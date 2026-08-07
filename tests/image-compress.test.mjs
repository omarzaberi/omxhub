/**
 * Tests for the decision logic in `src/lib/image-compress.ts`.
 *
 * The actual encode is `canvas.toBlob`, which is the browser's job and is not
 * where the danger is. The danger is everything around it: offering JPEG for an
 * image with transparency (which silently turns it black), handing back a file
 * larger than the one the user gave us, and letting one failed candidate lose
 * the results of the others. Those are what is pinned here.
 *
 * The shared arithmetic this module leans on — `fitWithin`, `chooseBest`,
 * `outputFileName` — moved to `image-core.ts` when the second image tool
 * arrived, and is covered by `tests/image-core.test.mjs`. What is left here is
 * only what Compress itself decides.
 *
 * The encoder is a stub that reports whatever size a test wants. No pixels are
 * ever encoded, because the module never looks at pixels — it only decides what
 * to ask for and which answer to keep.
 *
 * Run with: npm test
 */
import { candidateFormats, compressImage } from '../src/lib/image-compress.ts';

let pass = 0;
let fail = 0;
const check = (name, cond, detail = '') => {
  cond ? pass++ : fail++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond || !detail ? '' : ` — ${detail}`}`);
};

/** An encoder that returns a fixed size per format, recording what it was asked. */
const stubEncoder = (sizes, log = []) => {
  const fn = async (format, dim, quality) => {
    log.push({ format, dim, quality });
    const size = sizes[format];
    return size === undefined ? null : { size, type: `image/${format}` };
  };
  fn.log = log;
  return fn;
};

const base = {
  originalSize: 100_000,
  sourceType: 'image/jpeg',
  hasAlpha: false,
  dimensions: { width: 1000, height: 500 },
  quality: 0.8,
  maxEdge: 0,
  requested: 'auto',
  webpSupported: true,
};

// ------------------------------------------------- candidateFormats

{
  const opaque = candidateFormats({ sourceType: 'image/jpeg', hasAlpha: false, requested: 'auto', webpSupported: true });
  check('an opaque photo is offered webp and jpeg', opaque.includes('webp') && opaque.includes('jpeg'));
  check('and is not offered png, which can never win on a photo', !opaque.includes('png'));

  const alpha = candidateFormats({ sourceType: 'image/png', hasAlpha: true, requested: 'auto', webpSupported: true });
  check('a transparent image is NEVER offered jpeg under auto', !alpha.includes('jpeg'), alpha.join(','));
  check('and keeps png as a fallback', alpha.includes('png'));

  const noWebp = candidateFormats({ sourceType: 'image/png', hasAlpha: true, requested: 'auto', webpSupported: false });
  check('without webp, a transparent image still has png', noWebp.length > 0 && !noWebp.includes('jpeg'));

  const noWebpOpaque = candidateFormats({ sourceType: 'image/jpeg', hasAlpha: false, requested: 'auto', webpSupported: false });
  check('without webp, an opaque image still has jpeg', noWebpOpaque.includes('jpeg'));

  const forced = candidateFormats({ sourceType: 'image/png', hasAlpha: true, requested: 'jpeg', webpSupported: true });
  check('an explicit choice is honoured, alpha or not', forced.length === 1 && forced[0] === 'jpeg');

  const impossible = candidateFormats({ sourceType: 'image/png', hasAlpha: false, requested: 'webp', webpSupported: false });
  check('asking for webp where it is unsupported yields nothing', impossible.length === 0);
}

// ------------------------------------------------- the size promise

{
  const result = await compressImage(base, stubEncoder({ webp: 120_000, jpeg: 150_000 }));
  check('a file that cannot be beaten is kept, not replaced', result.kept === true);
  check('and the reason is reported rather than guessed at', result.reason === 'no-improvement');
}

{
  const result = await compressImage(base, stubEncoder({ webp: 40_000, jpeg: 60_000 }));
  check('a real win is returned', result.kept === false && result.format === 'webp');
  check('savings are computed against the original', result.savedBytes === 60_000 && result.savedPercent === 60);
  check('and it does not claim a resize it did not do', result.resized === false);
}

// ------------------------------------------------- resizing

{
  const log = [];
  const result = await compressImage(
    { ...base, dimensions: { width: 4000, height: 2000 }, maxEdge: 1000 },
    stubEncoder({ webp: 10_000, jpeg: 20_000 }, log)
  );
  check('every candidate is asked for the resampled size', log.every((c) => c.dim.width === 1000 && c.dim.height === 500));
  check('and the result reports that it resized', result.kept === false && result.resized === true);
}

// ------------------------------------------------- quality handling

{
  const log = [];
  await compressImage({ ...base, sourceType: 'image/png', hasAlpha: true, quality: 0.55 }, stubEncoder({ webp: 10, png: 20 }, log));
  const png = log.find((c) => c.format === 'png');
  const webp = log.find((c) => c.format === 'webp');
  check('png is never asked for a lossy quality', png && png.quality === 1, `got ${png && png.quality}`);
  check('lossy formats get the requested quality', webp && webp.quality === 0.55);
}

// ------------------------------------------------- resilience

{
  const flaky = async (format) => {
    if (format === 'webp') throw new Error('encoder exploded');
    return { size: 30_000, type: 'image/jpeg' };
  };
  const result = await compressImage(base, flaky);
  check('one exploding encoder does not lose the other results', result.kept === false && result.format === 'jpeg');
}

{
  const result = await compressImage({ ...base, requested: 'webp', webpSupported: false }, stubEncoder({}));
  check('no possible format is reported distinctly from no improvement', result.kept === true && result.reason === 'no-format');
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
