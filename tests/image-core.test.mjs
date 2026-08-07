/**
 * Tests for `src/lib/image-core.ts` — the pieces every image tool shares.
 *
 * These assertions started life inside `image-compress.test.mjs`, because the
 * code they cover started life inside `image-compress.ts`. They moved with it:
 * `fitWithin` is now the backbone of Resize, `sizeVerdict` is the honesty rule
 * that Convert, Resize and Crop inherit in place of Compress's "never larger"
 * promise, and `outputFileName` names the download for all four.
 *
 * Nothing here touches a canvas or a DOM. That is the point of the module.
 *
 * Run with: npm test
 */
import {
  chooseBest,
  fitWithin,
  formatBytes,
  outputFileName,
  qualityFor,
  savingPercent,
  scaleBy,
  sizeVerdict,
} from '../src/lib/image-core.ts';

let pass = 0;
let fail = 0;
const check = (name, cond, detail = '') => {
  cond ? pass++ : fail++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond || !detail ? '' : ` — ${detail}`}`);
};
const dims = (d) => `${d.width}x${d.height}`;

// ------------------------------------------------- fitWithin

{
  check('landscape scales on its longest edge', dims(fitWithin({ width: 4000, height: 2000 }, 1000)) === '1000x500');
  check('portrait scales on its longest edge', dims(fitWithin({ width: 2000, height: 4000 }, 1000)) === '500x1000');

  const small = fitWithin({ width: 900, height: 300 }, 4000);
  check('never upscales a smaller image', small.width === 900 && small.height === 300);

  const off = fitWithin({ width: 1234, height: 999 }, 0);
  check('maxEdge of 0 leaves resolution alone', off.width === 1234 && off.height === 999);

  const sliver = fitWithin({ width: 5000, height: 3 }, 100);
  check('a dimension never rounds down to zero', sliver.height >= 1, `got ${sliver.height}`);
}

// ------------------------------------------------- scaleBy

{
  check('scaleBy halves both edges', dims(scaleBy({ width: 800, height: 600 }, 0.5)) === '400x300');
  check('scaleBy can enlarge when asked', dims(scaleBy({ width: 100, height: 50 }, 3)) === '300x150');
  check('a 1% scale on a thin banner keeps a live pixel', scaleBy({ width: 3000, height: 2 }, 0.01).height === 1);
  check('a nonsense scale is a no-op rather than a zero canvas', dims(scaleBy({ width: 10, height: 10 }, 0)) === '10x10');
  check('NaN is treated the same way', dims(scaleBy({ width: 10, height: 10 }, NaN)) === '10x10');
}

// ------------------------------------------------- chooseBest

{
  check('picks the smallest winner', chooseBest([{ format: 'jpeg', size: 80 }, { format: 'webp', size: 60 }], 100).format === 'webp');
  check('rejects anything not smaller than the original', chooseBest([{ format: 'jpeg', size: 100 }], 100) === null);
  check('rejects a failed encode reporting zero', chooseBest([{ format: 'jpeg', size: 0 }], 100) === null);
  check('ties go to the earlier, more-preferred candidate', chooseBest([{ format: 'webp', size: 50 }, { format: 'jpeg', size: 50 }], 100).format === 'webp');
}

// ------------------------------------------------- sizeVerdict (the honesty rule)

{
  const smaller = sizeVerdict(100_000, 40_000);
  check('a smaller result is reported as smaller', smaller.direction === 'smaller' && smaller.percent === 60);

  const larger = sizeVerdict(100_000, 140_000);
  check('growth is reported as growth, not hidden', larger.direction === 'larger', larger.direction);
  check('and its magnitude is a percentage of the original', larger.percent === 40, `got ${larger.percent}`);

  check('a percent-level no-change reads as "same", not as 0% saved', sizeVerdict(100_000, 100_200).direction === 'same');
  check('and reports no magnitude', sizeVerdict(100_000, 99_900).percent === 0);
  check('an empty original cannot produce a verdict', sizeVerdict(0, 500).direction === 'same');
  check('a failed encode reporting zero cannot either', sizeVerdict(500, 0).direction === 'same');
}

// ------------------------------------------------- presentation

{
  check('savingPercent never goes negative', savingPercent(100, 250) === 0);
  check('savingPercent handles an empty original', savingPercent(0, 0) === 0);
  check('bytes render as B', formatBytes(512) === '512 B');
  check('bytes render as KB', formatBytes(2048) === '2.0 KB');
  check('bytes render as MB', formatBytes(5 * 1024 * 1024) === '5.00 MB');
}

// ------------------------------------------------- quality gating

{
  check('png is never given a lossy quality', qualityFor('png', 0.4) === 1);
  check('jpeg receives the requested quality', qualityFor('jpeg', 0.55) === 0.55);
  check('webp receives it too', qualityFor('webp', 0.55) === 0.55);
  check('a quality of zero is nudged off the floor rather than encoding nothing', qualityFor('jpeg', 0) > 0);
  check('NaN falls back to the default rather than poisoning toBlob', qualityFor('jpeg', NaN) === 0.8);
}

// ------------------------------------------------- download naming

{
  check('the download keeps the stem and takes the winning extension', outputFileName('My Photo.PNG', 'webp', 'compressed') === 'My Photo-compressed.webp');
  check('a name with no extension still works', outputFileName('photo', 'jpeg', 'compressed') === 'photo-compressed.jpg');
  check('a version number is not mistaken for an extension', outputFileName('Report v1.2 final', 'jpeg', 'compressed') === 'Report v1.2 final-compressed.jpg');
  check('a real extension is still stripped when a dot precedes it', outputFileName('Report v1.2 final.png', 'jpeg', 'compressed') === 'Report v1.2 final-compressed.jpg');
  check('an Arabic file name survives intact', outputFileName('صورة المنتج.png', 'webp', 'compressed') === 'صورة المنتج-compressed.webp');
  check('each tool brands its own output', outputFileName('photo.jpg', 'png', 'converted') === 'photo-converted.png');
  check('and so does resize', outputFileName('photo.jpg', 'jpeg', 'resized') === 'photo-resized.jpg');
  check('and crop', outputFileName('photo.jpg', 'jpeg', 'cropped') === 'photo-cropped.jpg');
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
