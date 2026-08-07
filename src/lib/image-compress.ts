/**
 * Decision logic for the Compress Image tool.
 *
 * ## Why there is a module here at all
 *
 * Compressing an image in the browser is three lines: draw it on a canvas, call
 * `toBlob('image/jpeg', 0.8)`, hand back the result. Every "compress image
 * online" tool does exactly that, and it is wrong in four ways that only show up
 * on real files:
 *
 * 1. **It silently destroys transparency.** A canvas is transparent black where
 *    a PNG has alpha. Encoded as JPEG — which has no alpha channel — every
 *    transparent pixel becomes solid black. A logo comes back ruined, and it
 *    looks like the tool worked.
 * 2. **It can return a larger file.** Re-encoding an already-optimised JPEG at
 *    quality 0.8, or converting a flat-colour screenshot to JPEG, routinely
 *    grows the file. A compressor that sometimes inflates is worse than none.
 * 3. **It rotates photos.** Phone cameras record orientation in EXIF and store
 *    the pixels unrotated. Drawing to a canvas drops EXIF, so a portrait photo
 *    comes back on its side. The fix belongs at decode time
 *    (`imageOrientation: 'from-image'`), and the page relies on it.
 * 4. **It ignores resolution.** A 4000 px wide photo posted to a page that
 *    renders it at 800 px is carrying 25× the pixels anyone will see. Quality
 *    reduction nibbles at that; resampling removes it outright.
 *
 * Everything except the actual encode is a decision, and decisions are testable
 * while `canvas.toBlob` is not. So the encoder is injected: this module decides
 * *what* to encode and *which result to keep*, the page supplies the browser.
 * `tests/image-compress.test.mjs` runs the whole flow against a fake encoder.
 *
 * ## The one promise
 *
 * **This tool never returns a file larger than the one it was given.** Every
 * candidate is measured, and if none beats the original the original is handed
 * back untouched with a plain explanation. That is why `compressImage` returns a
 * `kept: true` result instead of throwing or quietly returning the biggest loser.
 */

export interface Dimensions {
  width: number;
  height: number;
}

/** Formats a browser canvas can reliably encode to. */
export type OutputFormat = 'jpeg' | 'webp' | 'png';

export const MIME: Record<OutputFormat, string> = {
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  png: 'image/png',
};

/** Extension used for the download name. */
export const EXTENSION: Record<OutputFormat, string> = {
  jpeg: 'jpg',
  webp: 'webp',
  png: 'png',
};

/** Lossy formats are the only ones the quality slider means anything for. */
export const LOSSY: ReadonlySet<OutputFormat> = new Set<OutputFormat>(['jpeg', 'webp']);

/**
 * Scale `dim` so its longest edge is at most `maxEdge`, preserving aspect ratio.
 *
 * Never upscales: asking for a 4000 px limit on a 900 px image returns the 900 px
 * image. Enlarging cannot add detail, and it would violate the size promise for
 * no benefit. `maxEdge <= 0` means "leave the resolution alone".
 */
export function fitWithin(dim: Dimensions, maxEdge: number): Dimensions {
  const longest = Math.max(dim.width, dim.height);
  if (!Number.isFinite(maxEdge) || maxEdge <= 0 || longest <= maxEdge) {
    return { width: dim.width, height: dim.height };
  }
  const scale = maxEdge / longest;
  return {
    // A dimension must never round to zero, or the canvas throws.
    width: Math.max(1, Math.round(dim.width * scale)),
    height: Math.max(1, Math.round(dim.height * scale)),
  };
}

export interface FormatChoiceInput {
  /** MIME type of the uploaded file, e.g. `image/png`. */
  sourceType: string;
  /** Whether the decoded image actually carries non-opaque pixels. */
  hasAlpha: boolean;
  /** What the user picked. `auto` lets this module decide. */
  requested: 'auto' | OutputFormat;
  /** Whether this browser can encode WebP. Safari <14 and old Firefox cannot. */
  webpSupported: boolean;
}

/**
 * Which formats are worth encoding for this image, best candidate first.
 *
 * The transparency rule is the important one and it is absolute: **JPEG is never
 * offered for an image with alpha under `auto`**, because the failure is silent
 * and destroys the picture. If the user explicitly picks JPEG for such an image
 * the page warns them first — an informed choice is theirs to make, a hidden one
 * is not.
 *
 * PNG is only ever a candidate for images that have alpha or came in as PNG.
 * Canvas PNG encoding is lossless and unoptimised, so for a photograph it is
 * reliably far larger than the JPEG it started as; offering it there would just
 * burn time on a candidate that can never win.
 */
export function candidateFormats(input: FormatChoiceInput): OutputFormat[] {
  const { sourceType, hasAlpha, requested, webpSupported } = input;

  if (requested !== 'auto') {
    if (requested === 'webp' && !webpSupported) return [];
    return [requested];
  }

  const out: OutputFormat[] = [];
  if (webpSupported) out.push('webp'); // best ratio, and the only lossy format with alpha
  if (!hasAlpha) out.push('jpeg');
  if (hasAlpha || sourceType === 'image/png') out.push('png');

  // A browser with no WebP, given an opaque image, still gets JPEG. Given a
  // transparent one it gets PNG. The list is never empty for a decodable image.
  return out;
}

export interface Attempt {
  format: OutputFormat;
  size: number;
}

/**
 * The smallest attempt that actually beats `originalSize`, or `null` for
 * "nothing here is an improvement, keep the user's file".
 *
 * Ties go to the earlier candidate, which is why `candidateFormats` returns its
 * list in preference order rather than sorted alphabetically.
 */
export function chooseBest<T extends Attempt>(attempts: readonly T[], originalSize: number): T | null {
  let best: T | null = null;
  for (const attempt of attempts) {
    if (attempt.size <= 0) continue; // a failed encode reports 0; never a winner
    if (attempt.size >= originalSize) continue;
    if (best === null || attempt.size < best.size) best = attempt;
  }
  return best;
}

/** Whole-percent reduction from `originalSize` to `newSize`. Never negative. */
export function savingPercent(originalSize: number, newSize: number): number {
  if (originalSize <= 0 || newSize >= originalSize) return 0;
  return Math.round(((originalSize - newSize) / originalSize) * 100);
}

/**
 * Human byte size. Latin digits and units in both languages, because a file
 * size is read as a number and Arabic technical UI overwhelmingly uses KB/MB.
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Minimal structural stand-in for a `Blob`, so this module needs no DOM lib. */
export interface EncodedImage {
  size: number;
  type: string;
}

export type Encoder<B extends EncodedImage = EncodedImage> = (
  format: OutputFormat,
  dim: Dimensions,
  quality: number
) => Promise<B | null>;

export interface CompressInput {
  originalSize: number;
  sourceType: string;
  hasAlpha: boolean;
  /** Natural dimensions of the decoded image. */
  dimensions: Dimensions;
  /** 0–1. Ignored by PNG, which is lossless. */
  quality: number;
  /** Longest-edge cap in pixels; 0 keeps the original resolution. */
  maxEdge: number;
  requested: 'auto' | OutputFormat;
  webpSupported: boolean;
}

export type CompressResult<B extends EncodedImage = EncodedImage> =
  | {
      kept: false;
      blob: B;
      format: OutputFormat;
      dimensions: Dimensions;
      size: number;
      savedBytes: number;
      savedPercent: number;
      /** True when the win came partly from resampling rather than quality alone. */
      resized: boolean;
    }
  | {
      kept: true;
      reason: 'no-improvement' | 'no-format';
    };

/**
 * Encode every sensible candidate and keep the smallest one that beats the
 * original — or keep the original.
 *
 * Candidates are encoded in parallel. There are at most three, they are already
 * decoded in memory, and running them sequentially would triple the wait on a
 * large photograph for no benefit.
 */
export async function compressImage<B extends EncodedImage>(
  input: CompressInput,
  encode: Encoder<B>
): Promise<CompressResult<B>> {
  const formats = candidateFormats(input);
  if (formats.length === 0) return { kept: true, reason: 'no-format' };

  const dim = fitWithin(input.dimensions, input.maxEdge);
  const resized = dim.width !== input.dimensions.width || dim.height !== input.dimensions.height;

  const encoded = await Promise.all(
    formats.map(async (format) => {
      // PNG ignores quality; passing the slider value through would imply the
      // control does something on a lossless format, which it does not.
      const quality = LOSSY.has(format) ? input.quality : 1;
      try {
        const blob = await encode(format, dim, quality);
        return blob ? { format, size: blob.size, blob } : null;
      } catch {
        // One format failing (an encoder the browser advertised but cannot
        // actually run) must not lose the results from the others.
        return null;
      }
    })
  );

  const attempts = encoded.filter((a): a is { format: OutputFormat; size: number; blob: B } => a !== null);
  const best = chooseBest(attempts, input.originalSize);
  if (!best) return { kept: true, reason: 'no-improvement' };

  return {
    kept: false,
    blob: best.blob,
    format: best.format,
    dimensions: dim,
    size: best.size,
    savedBytes: input.originalSize - best.size,
    savedPercent: savingPercent(input.originalSize, best.size),
    resized,
  };
}

/**
 * Download name: original stem, extension of whatever format actually won.
 *
 * The pattern is deliberately strict — letters and digits, at most five. A
 * looser "anything after the last dot" rule turns `Report v1.2 final.png` into
 * `Report v1`, silently eating half the name the user recognises their file by.
 */
export function outputFileName(originalName: string, format: OutputFormat): string {
  const stem = originalName.replace(/\.[A-Za-z0-9]{1,5}$/, '') || 'image';
  return `${stem}-compressed.${EXTENSION[format]}`;
}
