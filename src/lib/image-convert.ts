/**
 * Decision logic for the Convert Image tool.
 *
 * ## How this differs from Compress, and why that matters
 *
 * Compress is allowed to change its mind. It tries several formats, keeps the
 * smallest, and if none beats the original it hands the original back — because
 * "make this smaller" is satisfied by doing nothing when nothing helps.
 *
 * Convert is not allowed to change its mind. Someone asking for PNG has a reason
 * — a print job, a design tool, a platform that rejects WebP — and a converter
 * that quietly returns the JPEG it was given because the PNG came out larger has
 * failed at the one thing it exists to do. **A JPEG converted to PNG is almost
 * always several times bigger, and that is the correct result.**
 *
 * So the size rule Compress established survives here in its honest half rather
 * than its absolute one: the result is always delivered, and the size change is
 * always stated — growth in the warning colour, at the same prominence a saving
 * would have had (`sizeVerdict` in `image-core.ts`, rendered by
 * `image-result.ts`). What is forbidden is hiding it, not producing it.
 *
 * ## Transparency
 *
 * The section's first rule holds unchanged, but it lands differently. Compress
 * simply never offers JPEG for an image with alpha under `auto`. Convert has no
 * `auto` — every target is an explicit request — so instead the loss is named
 * before it happens: `alphaWillFlatten` drives a warning that appears the moment
 * JPEG is selected for a transparent image, not after the file is produced. The
 * flattening itself is white, done by the shared canvas encoder, because
 * compositing against nothing yields black and a black-boxed logo looks like a
 * bug rather than a trade-off.
 */
import {
  qualityFor,
  sizeVerdict,
  type Dimensions,
  type EncodedImage,
  type Encoder,
  type OutputFormat,
  type SizeVerdict,
} from './image-core';

/** Every format a canvas can be asked for, in the order the UI lists them. */
export const CONVERT_TARGETS: readonly OutputFormat[] = ['webp', 'jpeg', 'png'];

/**
 * The targets this browser can actually produce.
 *
 * WebP encoding is missing on Safari before 14 and old Firefox. Offering a
 * format the browser will refuse produces an empty blob and a confusing error,
 * so the option is removed rather than left to fail.
 */
export function availableTargets(webpSupported: boolean): OutputFormat[] {
  return CONVERT_TARGETS.filter((f) => f !== 'webp' || webpSupported);
}

/**
 * Whether picking `target` for this image will flatten transparency away.
 *
 * Deliberately does not consider what the source format was: a PNG with no
 * transparent pixels loses nothing by becoming a JPEG, and warning about it
 * would train people to ignore the warning that matters.
 */
export function alphaWillFlatten(hasAlpha: boolean, target: OutputFormat): boolean {
  return hasAlpha && target === 'jpeg';
}

/**
 * Whether the conversion is a no-op — the target is already what the file is.
 *
 * Re-encoding a JPEG as a JPEG is not free: it is a second generation of lossy
 * compression, so the picture gets slightly worse while the file often gets
 * bigger. The tool still allows it (it is a legitimate way to apply a quality
 * change) but says what it is first.
 */
export function isSameFormat(sourceType: string, target: OutputFormat): boolean {
  const normalised = sourceType === 'image/jpg' ? 'image/jpeg' : sourceType;
  return normalised === `image/${target}`;
}

export interface ConvertInput {
  originalSize: number;
  sourceType: string;
  hasAlpha: boolean;
  dimensions: Dimensions;
  /** 0–1. Ignored by PNG, which is lossless. */
  quality: number;
  target: OutputFormat;
  webpSupported: boolean;
}

export type ConvertResult<B extends EncodedImage = EncodedImage> =
  | {
      ok: true;
      blob: B;
      format: OutputFormat;
      size: number;
      dimensions: Dimensions;
      /** Direction and magnitude of the size change. Never suppressed. */
      verdict: SizeVerdict;
      /** True when transparency was flattened to white to satisfy the target. */
      flattened: boolean;
    }
  | {
      ok: false;
      reason: 'no-format' | 'encode-failed';
    };

/**
 * Encode the image into exactly the requested format.
 *
 * One format, one attempt, no competition — the opposite of `compressImage`,
 * and for the reason above: the user picked the format, so there is nothing to
 * choose between. Dimensions are passed through untouched; changing resolution
 * is the Resize tool's job and doing it here as a bonus would mean a converted
 * file quietly differs from its source in a second way.
 */
export async function convertImage<B extends EncodedImage>(
  input: ConvertInput,
  encode: Encoder<B>
): Promise<ConvertResult<B>> {
  if (!availableTargets(input.webpSupported).includes(input.target)) {
    return { ok: false, reason: 'no-format' };
  }

  let blob: B | null;
  try {
    blob = await encode(input.target, input.dimensions, qualityFor(input.target, input.quality));
  } catch {
    return { ok: false, reason: 'encode-failed' };
  }
  // A browser that advertises a codec it cannot run resolves with null rather
  // than throwing, so both paths have to lead to the same honest failure.
  if (!blob || blob.size <= 0) return { ok: false, reason: 'encode-failed' };

  return {
    ok: true,
    blob,
    format: input.target,
    size: blob.size,
    dimensions: input.dimensions,
    verdict: sizeVerdict(input.originalSize, blob.size),
    flattened: alphaWillFlatten(input.hasAlpha, input.target),
  };
}
