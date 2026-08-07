/**
 * Tests for the PDF surgery in `src/lib/pdf-compress.ts`.
 *
 * Producing a JPEG needs a canvas and therefore a browser, so the encoder is
 * stubbed. That is not a gap — the encoding is the browser's job and is not
 * where the danger is. The danger is everything around it: replacing a stream's
 * bytes, keeping `/Length` in agreement with them, deciding which images are
 * safe to touch, and honouring the promise that the tool never returns a larger
 * file. Get any of those wrong and the user's document is corrupt rather than
 * merely unshrunk, so those are what is pinned here.
 *
 * Image XObjects are fabricated directly rather than embedded from real
 * pictures, because the module never decodes them — it only reads their
 * dictionaries and swaps their bytes.
 *
 * Run with: npm test
 */
import { PDFDocument, PDFName, PDFNumber, PDFRawStream, StandardFonts, rgb } from 'pdf-lib';
import { inflateSync } from 'node:zlib';
import * as pdfLib from 'pdf-lib';
import { recompressImages } from '../src/lib/pdf-compress.ts';

let pass = 0;
let fail = 0;
const check = (name, cond, detail = '') => {
  cond ? pass++ : fail++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond || !detail ? '' : ` — ${detail}`}`);
};

const MIN_IMAGE_BYTES = 8 * 1024;
const filler = (n) => new Uint8Array(n).fill(0xab);

/** Adds a fabricated image XObject to `doc` and returns its stream. */
function addImage(doc, { bytes, filter = 'DCTDecode', alpha = false }) {
  const dict = doc.context.obj({
    Type: 'XObject',
    Subtype: 'Image',
    Width: 100,
    Height: 100,
    ColorSpace: 'DeviceRGB',
    BitsPerComponent: 8,
    Filter: filter,
    Length: bytes.length,
  });
  if (alpha) dict.set(PDFName.of('SMask'), PDFNumber.of(1));
  const stream = PDFRawStream.of(dict, bytes);
  doc.context.register(stream);
  return stream;
}

/** An encoder that always "succeeds", shrinking to a fixed fraction. */
const shrinkTo = (fraction) => async (bytes) =>
  new Uint8Array(Math.floor(bytes.length * fraction)).fill(0x11);

// ------------------------------------------------- which images get touched

{
  const doc = await PDFDocument.create();
  doc.addPage();
  addImage(doc, { bytes: filler(50_000) });                                  // eligible
  addImage(doc, { bytes: filler(50_000), filter: 'FlateDecode' });           // wrong encoding
  addImage(doc, { bytes: filler(50_000), alpha: true });                     // has transparency
  addImage(doc, { bytes: filler(MIN_IMAGE_BYTES - 1) });                     // too small to matter

  const seen = [];
  const { recompressed, total } = await recompressImages(pdfLib, doc, 0.6, async (bytes) => {
    seen.push(bytes.length);
    return shrinkTo(0.5)(bytes);
  });

  check('every image XObject is found', total === 4, `saw ${total}`);
  check('only the eligible image is offered to the encoder', seen.length === 1, `offered ${seen.length}`);
  check('and it is the right one', seen[0] === 50_000);
  check('exactly one image is replaced', recompressed === 1);
}

// ------------------------------------------------- /Length must follow the bytes

{
  const doc = await PDFDocument.create();
  doc.addPage();
  const image = addImage(doc, { bytes: filler(40_000) });
  await recompressImages(pdfLib, doc, 0.6, shrinkTo(0.25));

  check('the stream bytes were replaced', image.contents.length === 10_000);
  check(
    '/Length agrees with the new bytes',
    image.dict.get(PDFName.of('Length')).asNumber() === image.contents.length,
    `dict says ${image.dict.get(PDFName.of('Length')).asNumber()}, stream is ${image.contents.length}`
  );

  // The real proof: it still parses.
  const reloaded = await PDFDocument.load(await doc.save());
  check('the document still loads after surgery', reloaded.getPageCount() === 1);
}

// ------------------------------------------------- never grow a file

{
  const doc = await PDFDocument.create();
  doc.addPage();
  const image = addImage(doc, { bytes: filler(40_000) });
  const before = image.contents.length;

  // An encoder that returns something larger — exactly what a real one does on
  // an already-optimised image.
  const { recompressed } = await recompressImages(pdfLib, doc, 0.6, async (bytes) =>
    new Uint8Array(bytes.length + 5_000)
  );

  check('a larger replacement is rejected', recompressed === 0);
  check('and the original bytes are left in place', image.contents.length === before);
}

{
  const doc = await PDFDocument.create();
  doc.addPage();
  const image = addImage(doc, { bytes: filler(40_000) });
  const before = image.contents.length;
  const { recompressed } = await recompressImages(pdfLib, doc, 0.6, async () => null);
  check('an encoder that declines is honoured', recompressed === 0);
  check('and leaves the image untouched', image.contents.length === before);
}

// ------------------------------------------------- text must survive

{
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  page.drawText('This text must survive compression', { x: 50, y: 700, size: 14, font, color: rgb(0, 0, 0) });
  addImage(doc, { bytes: filler(60_000) });

  await recompressImages(pdfLib, doc, 0.4, shrinkTo(0.3));
  const out = await doc.save();
  const reloaded = await PDFDocument.load(out);

  let withText = 0;
  for (const p of reloaded.getPages()) {
    const contents = p.node.Contents();
    const refs = typeof contents?.asArray === 'function' ? contents.asArray() : [contents];
    for (const ref of refs) {
      const obj = p.doc.context.lookup(ref);
      const raw = obj?.getContents?.() ?? obj?.contents;
      if (!raw) continue;
      let text;
      try { text = inflateSync(Buffer.from(raw)).toString('latin1'); }
      catch { text = Buffer.from(raw).toString('latin1'); }
      if (text.includes('Tj')) withText++;
    }
  }
  check('drawn text is still in the content stream after compression', withText === 1);
  check('this is the whole point: text stays selectable', withText > 0);
}

// ------------------------------------------------- progress reporting

{
  const doc = await PDFDocument.create();
  doc.addPage();
  for (let i = 0; i < 4; i++) addImage(doc, { bytes: filler(20_000) });

  const fractions = [];
  await recompressImages(pdfLib, doc, 0.6, shrinkTo(0.5), (f) => fractions.push(f));
  check('progress is reported once per image', fractions.length === 4);
  check('progress rises monotonically', fractions.every((f, i) => i === 0 || f > fractions[i - 1]));
  check('progress ends at 1', Math.abs(fractions.at(-1) - 1) < 1e-9);
}

// ------------------------------------------------- nothing to do

{
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.addPage().drawText('text only', { x: 50, y: 700, size: 12, font });
  let called = 0;
  const { recompressed, total } = await recompressImages(pdfLib, doc, 0.6, async (b) => {
    called++;
    return shrinkTo(0.5)(b);
  });
  check('a text-only document offers nothing to the encoder', called === 0);
  check('and reports no images at all', total === 0 && recompressed === 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
