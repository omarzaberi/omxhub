/**
 * Tests for `src/lib/image-convert.ts`.
 *
 * The thing worth pinning here is the difference from Compress, because it is a
 * deliberate exception to the section's most-quoted rule and would otherwise
 * look like a regression to whoever reads the two modules next:
 *
 * **Convert must deliver the format it was asked for, even when the result is
 * larger.** A JPEG converted to PNG is normally several times bigger, and that
 * is the correct answer — refusing it, as Compress would, means the tool never
 * does the one thing it exists for. What it may not do is hide the growth, which
 * is why every result carries a `verdict`.
 *
 * The encoder is a stub. No pixels are encoded; the module never looks at any.
 *
 * Run with: npm test
 */
import {
  alphaWillFlatten,
  availableTargets,
  convertImage,
  isSameFormat,
} from '../src/lib/image-convert.ts';

let pass = 0;
let fail = 0;
const check = (name, cond, detail = '') => {
  cond ? pass++ : fail++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond || !detail ? '' : ` — ${detail}`}`);
};

const stub = (size, log = []) => {
  const fn = async (format, dim, quality) => {
    log.push({ format, dim, quality });
    return size === null ? null : { size, type: `image/${format}` };
  };
  fn.log = log;
  return fn;
};

const base = {
  originalSize: 100_000,
  sourceType: 'image/jpeg',
  hasAlpha: false,
  dimensions: { width: 1200, height: 800 },
  quality: 0.8,
  target: 'png',
  webpSupported: true,
};

// ------------------------------------------------- available targets

{
  check('all three formats are offered on a capable browser', availableTargets(true).length === 3);
  const legacy = availableTargets(false);
  check('webp disappears where it cannot be encoded', !legacy.includes('webp'));
  check('and jpeg and png remain', legacy.includes('jpeg') && legacy.includes('png'));
}

// ------------------------------------------------- the transparency rule

{
  check('jpeg on a transparent image is flagged', alphaWillFlatten(true, 'jpeg'));
  check('jpeg on an opaque image is not', !alphaWillFlatten(false, 'jpeg'));
  check('webp keeps alpha, so it is never flagged', !alphaWillFlatten(true, 'webp'));
  check('png keeps alpha too', !alphaWillFlatten(true, 'png'));
}

// ------------------------------------------------- pointless conversions

{
  check('jpeg to jpeg is recognised as the same format', isSameFormat('image/jpeg', 'jpeg'));
  check('the image/jpg spelling is treated as jpeg', isSameFormat('image/jpg', 'jpeg'));
  check('png to png too', isSameFormat('image/png', 'png'));
  check('png to webp is a real conversion', !isSameFormat('image/png', 'webp'));
}

// ------------------------------------------------- delivery, not judgement

{
  const result = await convertImage(base, stub(380_000));
  check('a larger result is still delivered', result.ok === true && result.size === 380_000);
  check('and its growth is stated rather than hidden', result.verdict.direction === 'larger');
  check('with the magnitude attached', result.verdict.percent === 280, `got ${result.verdict.percent}`);
}

{
  const result = await convertImage({ ...base, target: 'webp' }, stub(45_000));
  check('a smaller result reports as smaller', result.ok === true && result.verdict.direction === 'smaller');
  check('with the saving attached', result.verdict.percent === 55);
}

{
  const log = [];
  const result = await convertImage({ ...base, target: 'webp' }, stub(50_000, log));
  check('exactly one encode is attempted — the format asked for', log.length === 1);
  check('and it is the requested one, with no competition', log[0].format === 'webp');
  check('the returned format matches the request', result.format === 'webp');
}

// ------------------------------------------------- dimensions are left alone

{
  const log = [];
  await convertImage(base, stub(10_000, log));
  check(
    'converting never resamples — that is the resize tool',
    log[0].dim.width === 1200 && log[0].dim.height === 800
  );
}

// ------------------------------------------------- quality

{
  const log = [];
  await convertImage({ ...base, target: 'png', quality: 0.4 }, stub(10_000, log));
  check('png is never given a lossy quality', log[0].quality === 1, `got ${log[0].quality}`);

  const log2 = [];
  await convertImage({ ...base, target: 'jpeg', quality: 0.4 }, stub(10_000, log2));
  check('jpeg receives the requested quality', log2[0].quality === 0.4);
}

// ------------------------------------------------- flattening is reported

{
  const result = await convertImage(
    { ...base, sourceType: 'image/png', hasAlpha: true, target: 'jpeg' },
    stub(20_000)
  );
  check('a flattened conversion says so in the result', result.ok === true && result.flattened === true);

  const kept = await convertImage(
    { ...base, sourceType: 'image/png', hasAlpha: true, target: 'webp' },
    stub(20_000)
  );
  check('one that kept transparency does not', kept.ok === true && kept.flattened === false);
}

// ------------------------------------------------- failure paths

{
  const result = await convertImage({ ...base, target: 'webp', webpSupported: false }, stub(1000));
  check('an unsupported target fails before encoding', result.ok === false && result.reason === 'no-format');
}

{
  const result = await convertImage(base, stub(null));
  check('an encoder returning null is a failure, not a zero-byte file', result.ok === false && result.reason === 'encode-failed');
}

{
  const result = await convertImage(base, async () => { throw new Error('boom'); });
  check('a throwing encoder fails the same way rather than escaping', result.ok === false && result.reason === 'encode-failed');
}

{
  const result = await convertImage(base, stub(0));
  check('a zero-byte blob is treated as a failed encode', result.ok === false);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
