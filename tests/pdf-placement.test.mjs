/**
 * End-to-end check of what the placement tools actually write into a PDF.
 *
 * `pdf-geometry.test.mjs` pins the mapping functions. This file asks the harder
 * question: after the Page Numbers and Crop tools have run pdf-lib for real,
 * does the output land where the user was looking?
 *
 * The trick that makes this a genuine test rather than a tautology is the
 * reference implementation in `toDisplay()` below. It does **not** reuse
 * `pdf-geometry.ts`. It composes a plain clockwise rotation matrix and shifts
 * the result back into positive coordinates — the transform a PDF viewer
 * applies for `/Rotate`, derived from first principles. If the case-based
 * mapping in the library and this matrix ever disagree, one of them is wrong
 * and the test fails.
 *
 * We then read the drawn text straight out of the saved file's content stream,
 * so the assertions cover the whole chain: our mapping, the pdf-lib call, and
 * the rotation angle we asked pdf-lib for.
 *
 * Run with: npm test
 */
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { inflateSync } from 'node:zlib';
import {
  normaliseRotation,
  displaySize,
  displayToUser,
  uprightTextAngle,
  displayToUserMargins,
} from '../src/lib/pdf-geometry.ts';

let pass = 0;
let fail = 0;
const check = (name, cond, detail = '') => {
  cond ? pass++ : fail++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond || !detail ? '' : ` — ${detail}`}`);
};
const near = (a, b, tol = 0.75) => Math.abs(a - b) <= tol;

const W = 600;
const H = 800;
const ROTATIONS = [0, 90, 180, 270];

/**
 * Reference implementation — user space to display space, from first
 * principles and deliberately not sharing code with the module under test.
 *
 * `/Rotate r` turns the content clockwise by r. Clockwise rotation about the
 * origin sends (x, y) to (x·cos r + y·sin r, −x·sin r + y·cos r); that pushes
 * the page off into negative coordinates, so we shift it back by its own
 * bounding box. The composition of those two steps is what a viewer shows.
 */
function toDisplay(r, w, h, x, y) {
  const rad = (r * Math.PI) / 180;
  const cos = Math.round(Math.cos(rad));
  const sin = Math.round(Math.sin(rad));
  const rot = (px, py) => [px * cos + py * sin, -px * sin + py * cos];
  const corners = [[0, 0], [w, 0], [0, h], [w, h]].map(([px, py]) => rot(px, py));
  const minX = Math.min(...corners.map((c) => c[0]));
  const minY = Math.min(...corners.map((c) => c[1]));
  const [rx, ry] = rot(x, y);
  return { x: rx - minX, y: ry - minY };
}

// Sanity-check the reference itself against the physical description: turn a
// portrait page clockwise and its bottom-left corner arrives at the top-left.
{
  const p = toDisplay(90, W, H, 0, 0);
  check('reference transform: 90° sends the user origin to the display top-left',
    near(p.x, 0) && near(p.y, W));
}

/**
 * Extracts every drawn string with its text matrix from a saved PDF.
 *
 * pdf-lib writes `... a b c d e f Tm <hex> Tj ...` into a Flate-compressed
 * stream, so we inflate first and read the hex string — with a standard font
 * the bytes are the character codes directly.
 */
async function drawnText(bytes) {
  const doc = await PDFDocument.load(bytes);
  const out = [];
  for (const page of doc.getPages()) {
    const found = [];
    for (const stream of contentStreams(page)) {
      const re =
        /([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+Tm[\s\S]*?(?:\((.*?)\)|<([0-9A-Fa-f]+)>)\s*Tj/g;
      for (const m of stream.matchAll(re)) {
        const [a, b, c, d, e, f] = m.slice(1, 7).map(Number);
        const text = m[7] ?? Buffer.from(m[8], 'hex').toString('latin1');
        found.push({ a, b, c, d, x: e, y: f, text });
      }
    }
    out.push(found);
  }
  return out;
}

function contentStreams(page) {
  const streams = [];
  const push = (obj) => {
    const raw = obj?.getContents?.() ?? obj?.contents;
    if (!raw) return;
    const buf = Buffer.from(raw);
    try {
      streams.push(inflateSync(buf).toString('latin1'));
    } catch {
      streams.push(buf.toString('latin1'));
    }
  };
  const contents = page.node.Contents();
  if (contents && typeof contents.asArray === 'function') {
    for (const ref of contents.asArray()) push(page.doc.context.lookup(ref));
  } else {
    push(contents);
  }
  return streams;
}

/** Builds a document whose pages carry every rotation in turn. */
async function makeDoc() {
  const doc = await PDFDocument.create();
  for (const r of ROTATIONS) {
    const page = doc.addPage([W, H]);
    page.setRotation(degrees(r));
  }
  return doc;
}

// ------------------------------------------------------- PAGE NUMBERS
//
// The tool's own placement code, copied from the page so the test exercises the
// same arithmetic. Positions are chosen in display space; pdf-lib is handed
// user space.

const SIZE = 11;
const MARGIN = 28;

async function stampNumbers(position) {
  const doc = await makeDoc();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.getPages().forEach((page, i) => {
    const text = String(i + 1);
    const rotation = normaliseRotation(page.getRotation().angle);
    const box = page.getCropBox();
    const { width: dw, height: dh } = displaySize(rotation, box.width, box.height);
    const textWidth = font.widthOfTextAtSize(text, SIZE);
    const dx =
      position.endsWith('left') ? MARGIN
      : position.endsWith('right') ? dw - MARGIN - textWidth
      : (dw - textWidth) / 2;
    const dy = position.startsWith('bottom') ? MARGIN : dh - MARGIN - SIZE;
    const p = displayToUser(rotation, box.width, box.height, dx, dy);
    page.drawText(text, {
      x: box.x + p.x,
      y: box.y + p.y,
      size: SIZE,
      font,
      color: rgb(0.35, 0.35, 0.35),
      rotate: degrees(uprightTextAngle(rotation)),
    });
  });
  return { bytes: await doc.save(), font };
}

for (const position of ['bottom-center', 'top-right', 'bottom-left']) {
  const { bytes, font } = await stampNumbers(position);
  const pages = await drawnText(bytes);

  check(`${position}: one number drawn on each of the 4 pages`,
    pages.length === 4 && pages.every((p) => p.length === 1));

  pages.forEach((found, i) => {
    if (!found.length) return;
    const r = ROTATIONS[i];
    const t = found[0];
    const textWidth = font.widthOfTextAtSize(t.text, SIZE);
    const d = displaySize(r, W, H);

    // Where did the anchor actually end up, as the reader sees it?
    const seen = toDisplay(r, W, H, t.x, t.y);
    const wantX =
      position.endsWith('left') ? MARGIN
      : position.endsWith('right') ? d.width - MARGIN - textWidth
      : (d.width - textWidth) / 2;
    const wantY = position.startsWith('bottom') ? MARGIN : d.height - MARGIN - SIZE;

    check(`${position}: /Rotate ${r} — the number sits where the reader expects`,
      near(seen.x, wantX) && near(seen.y, wantY),
      `got (${seen.x.toFixed(1)}, ${seen.y.toFixed(1)}), wanted (${wantX.toFixed(1)}, ${wantY.toFixed(1)})`);

    // The baseline direction must come out horizontal on screen. The text
    // matrix gives the baseline in user space; push it through the same
    // reference transform and it has to point along display +X.
    const origin = toDisplay(r, W, H, t.x, t.y);
    const tip = toDisplay(r, W, H, t.x + t.a, t.y + t.b);
    check(`${position}: /Rotate ${r} — the number reads upright, not sideways`,
      near(tip.y - origin.y, 0, 0.01) && tip.x - origin.x > 0.5,
      `baseline heads (${(tip.x - origin.x).toFixed(2)}, ${(tip.y - origin.y).toFixed(2)})`);
  });
}

// A number must never be placed outside the page it belongs to.
{
  const { bytes } = await stampNumbers('bottom-center');
  const pages = await drawnText(bytes);
  const inside = pages.every((found, i) => {
    const d = displaySize(ROTATIONS[i], W, H);
    const p = toDisplay(ROTATIONS[i], W, H, found[0].x, found[0].y);
    return p.x >= 0 && p.y >= 0 && p.x <= d.width && p.y <= d.height;
  });
  check('every number lands inside its own page', inside);
}

// ------------------------------------------------------- CROP

for (const margins of [
  { top: 0.1, right: 0, bottom: 0, left: 0 },
  { top: 0.05, right: 0.05, bottom: 0.05, left: 0.05 },
  { top: 0.2, right: 0.1, bottom: 0, left: 0.3 },
]) {
  const doc = await makeDoc();
  doc.getPages().forEach((page) => {
    const rotation = normaliseRotation(page.getRotation().angle);
    const u = displayToUserMargins(rotation, margins);
    const box = page.getCropBox();
    page.setCropBox(
      box.x + u.left * box.width,
      box.y + u.bottom * box.height,
      box.width * (1 - u.left - u.right),
      box.height * (1 - u.top - u.bottom)
    );
  });

  const label = `crop ${JSON.stringify(margins)}`;
  const saved = await PDFDocument.load(await doc.save());

  saved.getPages().forEach((page, i) => {
    const r = ROTATIONS[i];
    const cb = page.getCropBox();
    const d = displaySize(r, W, H);

    // Push the surviving box through the reference transform and it must be the
    // rectangle the user dragged out on screen.
    const corners = [
      [cb.x, cb.y],
      [cb.x + cb.width, cb.y],
      [cb.x, cb.y + cb.height],
      [cb.x + cb.width, cb.y + cb.height],
    ].map(([x, y]) => toDisplay(r, W, H, x, y));

    const left = Math.min(...corners.map((c) => c.x));
    const right = Math.max(...corners.map((c) => c.x));
    const bottom = Math.min(...corners.map((c) => c.y));
    const top = Math.max(...corners.map((c) => c.y));

    check(`${label}: /Rotate ${r} — the visible area matches the selection`,
      near(left, margins.left * d.width) &&
      near(right, d.width * (1 - margins.right)) &&
      near(bottom, margins.bottom * d.height) &&
      near(top, d.height * (1 - margins.top)),
      `l/r/b/t = ${left.toFixed(1)}/${right.toFixed(1)}/${bottom.toFixed(1)}/${top.toFixed(1)}`);

    // A crop box outside the media box is invalid and viewers handle it badly.
    check(`${label}: /Rotate ${r} — the crop box stays inside the page`,
      cb.x >= -0.01 && cb.y >= -0.01 &&
      cb.x + cb.width <= W + 0.01 && cb.y + cb.height <= H + 0.01);
  });
}

// Cropping and then numbering must cooperate: the number belongs inside the
// *cropped* area, which is the whole reason the tool reads the crop box.
{
  const doc = await makeDoc();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const margins = { top: 0.1, right: 0.1, bottom: 0.1, left: 0.1 };

  doc.getPages().forEach((page) => {
    const rotation = normaliseRotation(page.getRotation().angle);
    const u = displayToUserMargins(rotation, margins);
    const b = page.getCropBox();
    page.setCropBox(
      b.x + u.left * b.width,
      b.y + u.bottom * b.height,
      b.width * (1 - u.left - u.right),
      b.height * (1 - u.top - u.bottom)
    );
  });

  doc.getPages().forEach((page, i) => {
    const text = String(i + 1);
    const rotation = normaliseRotation(page.getRotation().angle);
    const box = page.getCropBox();
    const { width: dw } = displaySize(rotation, box.width, box.height);
    const textWidth = font.widthOfTextAtSize(text, SIZE);
    const p = displayToUser(rotation, box.width, box.height, (dw - textWidth) / 2, MARGIN);
    page.drawText(text, {
      x: box.x + p.x, y: box.y + p.y, size: SIZE, font,
      rotate: degrees(uprightTextAngle(rotation)),
    });
  });

  const bytes = await doc.save();
  const reloaded = await PDFDocument.load(bytes);
  const pages = await drawnText(bytes);

  const allInside = pages.every((found, i) => {
    const cb = reloaded.getPages()[i].getCropBox();
    const { x, y } = found[0];
    return x >= cb.x && x <= cb.x + cb.width && y >= cb.y && y <= cb.y + cb.height;
  });
  check('a page number added after a crop lands inside the cropped area', allInside);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
