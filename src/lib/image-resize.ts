/**
 * Decision logic for the Resize Image tool.
 *
 * ## The tool is its arithmetic
 *
 * Everything a resizer does that can go wrong goes wrong before any pixel is
 * touched: a rounding that produces a zero-width canvas, a "1920 wide" that
 * silently changes the aspect ratio, an upscale nobody asked for. The draw call
 * afterwards is one line. So the whole tool is `targetDimensions`, and that
 * function is pure and tested in Node.
 *
 * ## Why there are modes rather than two number fields
 *
 * Two fields look simpler and are worse. People arrive at a resizer already
 * knowing which constraint they care about — *at most 1920 across*, *exactly
 * 300 wide for this template*, *half the size* — and a bare width/height pair
 * forces them to compute the other number themselves and gets the aspect ratio
 * wrong when they get it slightly off. Naming the constraint makes the answer
 * exact:
 *
 * - `longest` — cap the longer edge, whichever it is. The right mode for "make
 *   this suitable for the web" and the only one that treats portrait and
 *   landscape photos alike.
 * - `width` / `height` — pin one edge; the other follows the aspect ratio.
 * - `percent` — scale both edges. The mode people reach for when the absolute
 *   numbers do not matter.
 * - `exact` — a box. With the ratio locked the image is *fitted inside* the box
 *   (contain), never stretched to fill it; unlocked, the numbers are obeyed
 *   literally and the image distorts, which is occasionally what a person wants
 *   and is never what they get by accident.
 *
 * ## Upscaling
 *
 * Enlarging cannot add detail, so it is off by default and the page says why.
 * But it is not forbidden: "exactly 1000 px wide" from a 600 px source is a real
 * requirement (a fixed template slot, a marketplace listing), and a tool that
 * silently returns 600 px has ignored the request rather than protected the
 * user. So `allowUpscale` is a visible checkbox, and `willUpscale` lets the page
 * say what will happen before it happens.
 *
 * ## The size rule
 *
 * As with Convert, the absolute "never larger" promise belongs to Compress
 * alone. Resizing down almost always shrinks the file, but re-encoding a small
 * JPEG as PNG can grow it, and so can upscaling. The result is delivered either
 * way and the direction is always stated — `sizeVerdict` in `image-core.ts`.
 */
import {
  scaleBy,
  qualityFor,
  sizeVerdict,
  type Dimensions,
  type EncodedImage,
  type Encoder,
  type OutputFormat,
  type SizeVerdict,
} from './image-core';

export type ResizeMode = 'longest' | 'width' | 'height' | 'percent' | 'exact';

export interface ResizeRequest {
  source: Dimensions;
  mode: ResizeMode;
  /** Used by `width` and `exact`. */
  width?: number;
  /** Used by `height` and `exact`. */
  height?: number;
  /** Used by `longest`. */
  longest?: number;
  /** Used by `percent`. 100 means unchanged. */
  percent?: number;
  /** `exact` only: fit inside the box instead of stretching to fill it. */
  lockAspect?: boolean;
  /** Off by default — enlarging cannot add detail. */
  allowUpscale?: boolean;
}

const positive = (value: number | undefined): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;

/** Round to whole pixels, never to zero — a zero-sized canvas throws on encode. */
const px = (value: number): number => Math.max(1, Math.round(value));

/**
 * The dimensions to encode at, for any mode.
 *
 * Returns the source dimensions unchanged whenever the request is incomplete or
 * nonsensical (an empty field, a negative number, text). That is deliberate: a
 * half-typed number must never be interpreted as an instruction, exactly as an
 * emptied crop field is not read as zero in `pdf-crop-box.ts`.
 */
export function targetDimensions(req: ResizeRequest): Dimensions {
  const { source, mode } = req;
  const ratio = source.width / source.height;
  const allowUpscale = req.allowUpscale === true;

  let out: Dimensions;

  switch (mode) {
    case 'percent': {
      const percent = positive(req.percent);
      if (percent === null) return { ...source };
      out = scaleBy(source, percent / 100);
      break;
    }
    case 'width': {
      const width = positive(req.width);
      if (width === null) return { ...source };
      out = { width: px(width), height: px(width / ratio) };
      break;
    }
    case 'height': {
      const height = positive(req.height);
      if (height === null) return { ...source };
      out = { width: px(height * ratio), height: px(height) };
      break;
    }
    case 'exact': {
      const width = positive(req.width);
      const height = positive(req.height);
      if (width === null || height === null) return { ...source };
      if (req.lockAspect === false) {
        // The one path that is allowed to change the aspect ratio, and only
        // because the user switched the lock off deliberately.
        out = { width: px(width), height: px(height) };
      } else {
        // Contain, not cover: the whole image ends up inside the box. Cover
        // would have to crop, and cropping is a different tool with a
        // different UI — doing it silently here is how a resizer eats
        // someone's headroom.
        out = scaleBy(source, Math.min(width / source.width, height / source.height));
      }
      break;
    }
    case 'longest':
    default: {
      const longest = positive(req.longest);
      if (longest === null) return { ...source };
      out = scaleBy(source, longest / Math.max(source.width, source.height));
      break;
    }
  }

  if (!allowUpscale && (out.width > source.width || out.height > source.height)) {
    return { ...source };
  }
  return out;
}

/** Whether the request as it stands would enlarge the image. */
export function willUpscale(req: ResizeRequest): boolean {
  const target = targetDimensions({ ...req, allowUpscale: true });
  return target.width > req.source.width || target.height > req.source.height;
}

/** Whether the request produces the image it was given. */
export function isNoOp(req: ResizeRequest): boolean {
  const target = targetDimensions(req);
  return target.width === req.source.width && target.height === req.source.height;
}

export interface ResizeInput extends ResizeRequest {
  originalSize: number;
  /** `keep` re-encodes in the format the file already is. */
  format: OutputFormat;
  quality: number;
}

export type ResizeResult<B extends EncodedImage = EncodedImage> =
  | {
      ok: true;
      blob: B;
      format: OutputFormat;
      size: number;
      dimensions: Dimensions;
      verdict: SizeVerdict;
      /** True when the output is larger in pixels than the input. */
      upscaled: boolean;
      /** True when the dimensions did not change at all. */
      unchanged: boolean;
    }
  | { ok: false; reason: 'encode-failed' };

export async function resizeImage<B extends EncodedImage>(
  input: ResizeInput,
  encode: Encoder<B>
): Promise<ResizeResult<B>> {
  const dim = targetDimensions(input);

  let blob: B | null;
  try {
    blob = await encode(input.format, dim, qualityFor(input.format, input.quality));
  } catch {
    return { ok: false, reason: 'encode-failed' };
  }
  if (!blob || blob.size <= 0) return { ok: false, reason: 'encode-failed' };

  return {
    ok: true,
    blob,
    format: input.format,
    size: blob.size,
    dimensions: dim,
    verdict: sizeVerdict(input.originalSize, blob.size),
    upscaled: dim.width > input.source.width || dim.height > input.source.height,
    unchanged: dim.width === input.source.width && dim.height === input.source.height,
  };
}

/**
 * Which format to write when the user has not asked for a change.
 *
 * Resizing should not also convert. A PNG resized in a hurry and returned as a
 * JPEG loses its transparency to a tool the person did not ask to make that
 * decision — so the source format is preserved by default, and anything the
 * canvas cannot encode (GIF, BMP, AVIF, TIFF) falls to PNG when the image has
 * transparency and JPEG when it does not, which is the closest honest match.
 */
export function keepFormat(sourceType: string, hasAlpha: boolean): OutputFormat {
  switch (sourceType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpeg';
    default:
      return hasAlpha ? 'png' : 'jpeg';
  }
}
