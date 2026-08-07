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
 *    (`imageOrientation: 'from-image'`), and `image-io.ts` applies it.
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
 *
 * The promise is specific to Compress, and deliberately so: making the file
 * smaller is the entire request here. Convert, Resize and Crop are asked for
 * something else, so they inherit the honest half of the rule instead — the size
 * change is always stated and growth is never hidden (`sizeVerdict` in
 * `image-core.ts`).
 */
import {
  chooseBest,
  fitWithin,
  qualityFor,
  savingPercent,
  type Dimensions,
  type EncodedImage,
  type Encoder,
  type OutputFormat,
} from './image-core';

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
      try {
        // PNG ignores quality; passing the slider value through would imply the
        // control does something on a lossless format, which it does not.
        const blob = await encode(format, dim, qualityFor(format, input.quality));
        return blob ? { format, size: blob.size, blob } : null;
      } catch {
        // One format failing (an encoder the browser advertised but cannot
        // actually run) must not lose the results from the others.
        return null;
      }
    })
  );

  const attempts = encoded.filter(
    (a): a is { format: OutputFormat; size: number; blob: B } => a !== null
  );
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
