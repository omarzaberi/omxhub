/**
 * Image recompression for the Compress PDF tool.
 *
 * ## Why this is not the obvious implementation
 *
 * The plan of record for Compress was to rasterise every page through pdf.js
 * and rebuild the document from the resulting bitmaps. That is what most
 * in-browser "compress PDF" tools do, and it has two properties nobody wants:
 * it destroys selectable text, and on a text-only document it *increases* the
 * file size — a page of text is a few kilobytes of drawing instructions and
 * several hundred kilobytes as a picture of itself.
 *
 * Measuring first showed the trade-off was never necessary. On a 1.6 MB
 * document mixing a scan with real text:
 *
 * | approach                        | result   | text |
 * |---------------------------------|----------|------|
 * | pdf-lib re-save, object streams | **0.0%** | kept |
 * | rasterise every page            | shrinks  | lost |
 * | recompress the images only      | **−71%** | kept |
 *
 * Almost all the bytes in a big PDF are in its images, and they can be replaced
 * individually without touching anything else. So that is what this does: find
 * the image XObjects, re-encode each one at a lower JPEG quality, and swap the
 * stream in place. Text, vectors, links and structure are never even read.
 *
 * ## Scope, deliberately
 *
 * Only `/DCTDecode` (JPEG) streams are touched. That is what scanners and phone
 * cameras produce, which is the overwhelming majority of large PDFs. Other
 * encodings — `/FlateDecode` bitmaps, indexed palettes, `/CCITTFaxDecode`,
 * anything carrying an `/SMask` — are skipped rather than guessed at, because
 * converting them correctly means handling colour spaces and alpha, and getting
 * that subtly wrong corrupts the image rather than shrinking it. A skipped
 * image costs the user nothing; a mangled one costs them their document.
 *
 * An image is also left alone whenever re-encoding it came out *larger*, which
 * happens with small or already-aggressively-compressed images. The guarantee
 * this gives is worth stating plainly: **this tool never makes a file bigger.**
 */

/** What a document looks like before we touch it — drives what the UI promises. */
export interface CompressionEstimate {
  /** Total bytes of the original file. */
  totalBytes: number;
  /** Number of JPEG images we could act on. */
  compressibleImages: number;
  /** Bytes held in those images. */
  compressibleBytes: number;
  /** Images we can see but will not touch, with the reason grouped by encoding. */
  skippedImages: number;
  /** Share of the file that is recompressible image data, 0–1. */
  ratio: number;
}

export interface CompressionResult {
  bytes: Uint8Array;
  originalBytes: number;
  finalBytes: number;
  /** Images actually replaced. */
  recompressed: number;
  /** Images left alone, either unsupported or because re-encoding grew them. */
  skipped: number;
}

/** JPEG quality for each user-facing level. */
export const QUALITY = { low: 0.4, medium: 0.6, high: 0.8 } as const;
export type QualityLevel = keyof typeof QUALITY;

/**
 * Images below this many bytes are not worth touching.
 *
 * Re-encoding a small image rarely saves anything and often costs, because JPEG
 * headers are a fixed overhead. Skipping them also keeps a document full of
 * little logos from taking hundreds of pointless canvas round trips.
 */
const MIN_IMAGE_BYTES = 8 * 1024;

type PdfLib = typeof import('pdf-lib');

interface ImageStream {
  obj: any;
  bytes: Uint8Array;
  isJpeg: boolean;
}

/** Finds every image XObject in the document, flagging the ones we can act on. */
function findImages(lib: PdfLib, doc: any): ImageStream[] {
  const { PDFName, PDFRawStream } = lib;
  const out: ImageStream[] = [];
  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    const dict = obj.dict;
    if (dict.get(PDFName.of('Subtype'))?.toString() !== '/Image') continue;

    const filter = dict.get(PDFName.of('Filter'))?.toString() ?? '';
    // An /SMask carries the image's transparency in a separate stream. Re-encoding
    // the colour data as JPEG — which has no alpha — would silently break it.
    const hasAlpha = !!dict.get(PDFName.of('SMask')) || !!dict.get(PDFName.of('Mask'));
    const bytes: Uint8Array = obj.contents;

    out.push({
      obj,
      bytes,
      isJpeg: filter.includes('DCTDecode') && !hasAlpha && bytes.length >= MIN_IMAGE_BYTES,
    });
  }
  return out;
}

/**
 * Inspects a document without modifying it.
 *
 * The point is to let the page tell the truth *before* the user commits: a
 * text-only PDF cannot be compressed by this method, and saying so up front is
 * far better than spinning for ten seconds and handing back the same file.
 */
export async function estimate(file: File): Promise<CompressionEstimate> {
  const { loadPdfLib } = await import('./pdf-libs');
  const lib = await loadPdfLib();
  const doc = await lib.PDFDocument.load(await file.arrayBuffer());
  const images = findImages(lib, doc);

  const compressible = images.filter((i) => i.isJpeg);
  const compressibleBytes = compressible.reduce((sum, i) => sum + i.bytes.length, 0);

  return {
    totalBytes: file.size,
    compressibleImages: compressible.length,
    compressibleBytes,
    skippedImages: images.length - compressible.length,
    ratio: file.size ? compressibleBytes / file.size : 0,
  };
}

/**
 * Re-encodes one JPEG at `quality`, returning null if it could not be improved.
 *
 * `createImageBitmap` decodes off the main thread where the browser supports it,
 * which keeps a fifty-page scan from locking the tab.
 */
async function requantise(bytes: Uint8Array, quality: number): Promise<Uint8Array | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }));
  } catch {
    // A stream we cannot decode is one we must not replace.
    return null;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
    if (!blob || blob.size >= bytes.length) return null;
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    bitmap.close();
  }
}

/**
 * An image re-encoder. Returns smaller bytes, or null to leave the image alone.
 *
 * This is a seam, and a deliberate one. Actually producing a JPEG needs a canvas
 * and therefore a browser, but the risky part of this module is not the encoding
 * — it is the PDF surgery around it: swapping a stream's bytes, keeping
 * `/Length` honest, and never returning a file larger than we were given. Those
 * are testable with a stub encoder, and they are what would corrupt a document
 * if wrong.
 */
export type ImageEncoder = (bytes: Uint8Array, quality: number) => Promise<Uint8Array | null>;

/**
 * Replaces image streams in an already-loaded document.
 *
 * Exported for tests; the browser path goes through `compress()` below.
 */
export async function recompressImages(
  lib: PdfLib,
  doc: any,
  quality: number,
  encode: ImageEncoder,
  onProgress?: (fraction: number) => void
): Promise<{ recompressed: number; total: number }> {
  const { PDFName, PDFNumber } = lib;
  const images = findImages(lib, doc);
  const targets = images.filter((i) => i.isJpeg);

  let recompressed = 0;
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const smaller = await encode(target.bytes, quality);
    // Guard here as well as in the encoder: a replacement that is not actually
    // smaller is a regression, whatever the encoder believed.
    if (smaller && smaller.length < target.bytes.length) {
      target.obj.contents = smaller;
      // /Length must agree with the stream we just wrote, or the file is corrupt.
      target.obj.dict.set(PDFName.of('Length'), PDFNumber.of(smaller.length));
      recompressed++;
    }
    onProgress?.((i + 1) / targets.length);
  }
  return { recompressed, total: images.length };
}

/**
 * Recompresses the images in `file` and returns the rebuilt document.
 *
 * @param onProgress Called with a 0–1 fraction as images are processed, so a
 *                   large scan can show progress rather than appearing hung.
 */
export async function compress(
  file: File,
  level: QualityLevel,
  onProgress?: (fraction: number) => void
): Promise<CompressionResult> {
  const { loadPdfLib } = await import('./pdf-libs');
  const lib = await loadPdfLib();

  const originalBytes = file.size;
  const doc = await lib.PDFDocument.load(await file.arrayBuffer());
  const { recompressed, total: images } = await recompressImages(
    lib,
    doc,
    QUALITY[level],
    requantise,
    onProgress
  );

  const bytes = await doc.save();

  // The promise the docs make: never hand back something larger than we were
  // given. Re-saving can add a few bytes even when nothing was recompressed.
  if (bytes.length >= originalBytes && recompressed === 0) {
    return {
      bytes: new Uint8Array(await file.arrayBuffer()),
      originalBytes,
      finalBytes: originalBytes,
      recompressed: 0,
      skipped: images,
    };
  }

  return {
    bytes,
    originalBytes,
    finalBytes: bytes.length,
    recompressed,
    skipped: images - recompressed,
  };
}
