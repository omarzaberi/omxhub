/**
 * Tests for `src/lib/image-resize.ts`.
 *
 * A resizer is its arithmetic. Everything that can go wrong goes wrong before a
 * pixel is touched — a rounding that produces a zero-width canvas, a "1920 wide"
 * that quietly changes the aspect ratio, an upscale nobody asked for — so this
 * file is where the tool actually gets verified.
 *
 * Three behaviours carry promises and are pinned hardest:
 *
 * - **No upscaling unless it was explicitly permitted.** Enlarging cannot add
 *   detail; doing it by accident is how a "resize" hands back a blurry file.
 * - **`exact` fits inside the box, it does not crop to fill it.** Cover-style
 *   fitting would silently eat someone's headroom, and cropping is a different
 *   tool with a different UI.
 * - **A half-typed number is not an instruction.** An empty or unparseable
 *   field returns the source dimensions, exactly as an emptied crop field is not
 *   read as zero.
 *
 * Run with: npm test
 */
import {
  isNoOp,
  keepFormat,
  resizeImage,
  targetDimensions,
  willUpscale,
} from '../src/lib/image-resize.ts';

let pass = 0;
let fail = 0;
const check = (name, cond, detail = '') => {
  cond ? pass++ : fail++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond || !detail ? '' : ` — ${detail}`}`);
};

const landscape = { width: 4000, height: 2000 }; // 2:1
const portrait = { width: 1000, height: 2000 };
const size = (d) => `${d.width}x${d.height}`;
const at = (req) => size(targetDimensions(req));

// ------------------------------------------------- longest edge

{
  check('longest edge caps a landscape image on its width', at({ source: landscape, mode: 'longest', longest: 1000 }) === '1000x500');
  check('and a portrait image on its height', at({ source: portrait, mode: 'longest', longest: 1000 }) === '500x1000');
  check('a cap above the image changes nothing', at({ source: landscape, mode: 'longest', longest: 9000 }) === '4000x2000');
  check('a missing cap is not read as zero', at({ source: landscape, mode: 'longest' }) === '4000x2000');
}

// ------------------------------------------------- single-edge modes

{
  check('pinning the width derives the height from the ratio', at({ source: landscape, mode: 'width', width: 800 }) === '800x400');
  check('pinning the height derives the width', at({ source: landscape, mode: 'height', height: 400 }) === '800x400');
  check('an empty width field leaves the image alone', at({ source: landscape, mode: 'width', width: undefined }) === '4000x2000');
  check('a negative width is refused rather than obeyed', at({ source: landscape, mode: 'width', width: -100 }) === '4000x2000');
  check('NaN is refused too', at({ source: landscape, mode: 'width', width: NaN }) === '4000x2000');
}

// ------------------------------------------------- percent

{
  check('50% halves both edges', at({ source: landscape, mode: 'percent', percent: 50 }) === '2000x1000');
  check('25% quarters them', at({ source: landscape, mode: 'percent', percent: 25 }) === '1000x500');
  check('100% is a no-op', at({ source: landscape, mode: 'percent', percent: 100 }) === '4000x2000');
  check('a percent above 100 is refused without permission to upscale', at({ source: landscape, mode: 'percent', percent: 200 }) === '4000x2000');
  check('and honoured with it', at({ source: landscape, mode: 'percent', percent: 200, allowUpscale: true }) === '8000x4000');
  check('a tiny percent still leaves a live pixel', targetDimensions({ source: { width: 3000, height: 2 }, mode: 'percent', percent: 1 }).height === 1);
}

// ------------------------------------------------- exact box

{
  const locked = { source: landscape, mode: 'exact', width: 1000, height: 1000, lockAspect: true };
  check('a locked exact box fits the image inside it', at(locked) === '1000x500', at(locked));
  check('and never stretches to fill it', targetDimensions(locked).height !== 1000);

  const unlocked = { ...locked, lockAspect: false };
  check('unlocking obeys both numbers literally', at(unlocked) === '1000x1000');

  const tallBox = { source: landscape, mode: 'exact', width: 4000, height: 500, lockAspect: true };
  check('the constraining edge wins, whichever it is', at(tallBox) === '1000x500', at(tallBox));

  check('a half-filled box is not acted on', at({ source: landscape, mode: 'exact', width: 500, lockAspect: true }) === '4000x2000');
}

// ------------------------------------------------- upscaling

{
  const up = { source: portrait, mode: 'width', width: 3000 };
  check('an enlargement is blocked by default', at(up) === '1000x2000');
  check('and permitted when asked for', at({ ...up, allowUpscale: true }) === '3000x6000');
  check('willUpscale sees it coming before the button is pressed', willUpscale(up) === true);
  check('and does not cry wolf on a reduction', willUpscale({ source: portrait, mode: 'width', width: 500 }) === false);
  check(
    'a locked exact box larger than the image is blocked too',
    at({ source: portrait, mode: 'exact', width: 4000, height: 8000, lockAspect: true }) === '1000x2000'
  );
}

// ------------------------------------------------- no-op detection

{
  check('isNoOp spots a 100% resize', isNoOp({ source: landscape, mode: 'percent', percent: 100 }));
  check('isNoOp spots a blocked upscale', isNoOp({ source: portrait, mode: 'width', width: 3000 }));
  check('and does not fire on a real reduction', !isNoOp({ source: landscape, mode: 'percent', percent: 50 }));
}

// ------------------------------------------------- format preservation

{
  check('a png stays a png', keepFormat('image/png', true) === 'png');
  check('a jpeg stays a jpeg', keepFormat('image/jpeg', false) === 'jpeg');
  check('the image/jpg spelling too', keepFormat('image/jpg', false) === 'jpeg');
  check('a webp stays a webp', keepFormat('image/webp', true) === 'webp');
  check('a format the canvas cannot write falls to png when it has alpha', keepFormat('image/gif', true) === 'png');
  check('and to jpeg when it does not', keepFormat('image/bmp', false) === 'jpeg');
}

// ------------------------------------------------- end to end

{
  const log = [];
  const encode = async (format, dim, quality) => {
    log.push({ format, dim, quality });
    return { size: 30_000, type: `image/${format}` };
  };
  const result = await resizeImage(
    { source: landscape, mode: 'longest', longest: 1000, originalSize: 200_000, format: 'jpeg', quality: 0.8 },
    encode
  );
  check('the encoder is asked for the computed size', size(log[0].dim) === '1000x500');
  check('the result reports the dimensions it produced', result.ok === true && size(result.dimensions) === '1000x500');
  check('and the size change', result.verdict.direction === 'smaller' && result.verdict.percent === 85);
  check('it does not claim an upscale it did not do', result.upscaled === false);
  check('nor that nothing changed', result.unchanged === false);
}

{
  const result = await resizeImage(
    { source: landscape, mode: 'percent', percent: 100, originalSize: 100_000, format: 'png', quality: 0.8 },
    async () => ({ size: 900_000, type: 'image/png' })
  );
  check('a re-encode that grew the file still returns it', result.ok === true);
  check('and says plainly that it grew', result.verdict.direction === 'larger');
  check('and that the dimensions did not change', result.unchanged === true);
}

{
  const result = await resizeImage(
    { source: landscape, mode: 'percent', percent: 50, originalSize: 100_000, format: 'jpeg', quality: 0.8 },
    async () => null
  );
  check('a null encode is a failure, not a zero-byte download', result.ok === false && result.reason === 'encode-failed');
}

{
  const result = await resizeImage(
    { source: landscape, mode: 'percent', percent: 50, originalSize: 100_000, format: 'jpeg', quality: 0.8 },
    async () => { throw new Error('boom'); }
  );
  check('a throwing encoder does not escape the module', result.ok === false);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
