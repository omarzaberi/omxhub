/**
 * Crop geometry for the Crop Image tool.
 *
 * ## Why this is not `pdf-crop-box.ts`
 *
 * The PDF crop tool solves a related problem and the resemblance is deliberate —
 * fractions rather than pixels, number fields bound to the same state as the
 * drag, corner handles that are `aria-hidden` because assistive technology
 * cannot perform that gesture. Those conventions are copied on purpose.
 *
 * What is *not* shared is the model, because the two tools crop different
 * things. A PDF crop is four **insets** applied to every page of a document
 * whose pages may not be the same size, which is exactly why insets are the
 * right unit there: 5% off each edge stays correct on a mixed scan. An image
 * crop is one **rectangle** on one image, and the operation people actually want
 * from it — a fixed aspect ratio, 1:1 for an avatar, 16:9 for a thumbnail — is
 * awkward to express as insets and trivial as `{x, y, w, h}`. Forcing one model
 * to serve both would mean converting back and forth at every edge of both
 * tools, so each keeps the shape its own problem has.
 *
 * ## Fractions, not pixels
 *
 * The rectangle is stored as fractions of the image, 0–1. The preview is a few
 * hundred CSS pixels wide and the image may be 6000 across; keeping the state in
 * display pixels would bake the preview size into the result and quietly change
 * the crop when the window is resized. `toPixels` is the single place the
 * conversion happens, and it is the only function here that knows the image's
 * real dimensions.
 *
 * Everything in this file is pure and tested in Node. The pointer handling that
 * drives it lives in `image-crop-box.ts`.
 */
import { scaleBy, type Dimensions } from './image-core';

/** A crop rectangle in fractions of the image. `x`/`y` are the top-left corner. */
export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const FULL_RECT: CropRect = { x: 0, y: 0, w: 1, h: 1 };

/**
 * The smallest fraction of each axis the rectangle may shrink to.
 *
 * Without a floor the selection can be collapsed to nothing, producing a 1×1
 * image that looks like the tool failed. The PDF crop tool holds the same line
 * for the same reason.
 */
export const MIN_SIZE = 0.05;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Force a rectangle back inside the image, with a live area.
 *
 * Order matters: the size is clamped before the position, so a rectangle dragged
 * past the right edge is pushed back in at its current width rather than being
 * silently narrowed.
 */
export function clampRect(rect: CropRect): CropRect {
  const w = clamp(Number.isFinite(rect.w) ? rect.w : 1, MIN_SIZE, 1);
  const h = clamp(Number.isFinite(rect.h) ? rect.h : 1, MIN_SIZE, 1);
  return {
    w,
    h,
    x: clamp(Number.isFinite(rect.x) ? rect.x : 0, 0, 1 - w),
    y: clamp(Number.isFinite(rect.y) ? rect.y : 0, 0, 1 - h),
  };
}

/**
 * Aspect-ratio presets, as width ÷ height. `null` is "free".
 *
 * Named by what people are actually making, because "1.7778" is not a thing
 * anyone asks for. Kept here rather than in the page so both locales offer the
 * same set and the ratios cannot drift apart between them.
 */
export const ASPECT_PRESETS: readonly { id: string; ratio: number | null }[] = [
  { id: 'free', ratio: null },
  { id: 'square', ratio: 1 },
  { id: 'wide', ratio: 16 / 9 },
  { id: 'photo', ratio: 4 / 3 },
  { id: 'portrait', ratio: 3 / 4 },
  { id: 'story', ratio: 9 / 16 },
];

export function ratioOf(id: string): number | null {
  return ASPECT_PRESETS.find((p) => p.id === id)?.ratio ?? null;
}

/**
 * Reshape `rect` to `ratio` within an image of aspect `imageRatio`.
 *
 * The ratio is expressed in *image* terms while the rectangle is in fractions of
 * each axis, so a square crop on a 2:1 photo is `w = 0.5, h = 1` — not
 * `w = h`. Getting this wrong is the classic bug in fraction-based croppers: the
 * box looks square in the code and is visibly rectangular on screen.
 *
 * The rectangle shrinks to fit rather than growing, so applying a ratio can
 * never push the selection outside the image, and it keeps its centre so the
 * subject the user framed stays framed.
 */
export function applyRatio(rect: CropRect, ratio: number | null, imageRatio: number): CropRect {
  if (ratio === null || !Number.isFinite(ratio) || ratio <= 0) return clampRect(rect);
  if (!Number.isFinite(imageRatio) || imageRatio <= 0) return clampRect(rect);

  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;

  // Fractional width per unit of fractional height, for this ratio on this image.
  const wPerH = ratio / imageRatio;

  // Try holding the width; if the implied height overflows, hold the height.
  let w = rect.w;
  let h = w / wPerH;
  if (h > 1) {
    h = 1;
    w = h * wPerH;
  }
  if (w > 1) {
    w = 1;
    h = w / wPerH;
  }
  // A ratio so extreme that one axis falls under the floor cannot be honoured
  // without producing a sliver; the floor wins, and the rectangle is simply the
  // closest legal thing to what was asked for.
  w = clamp(w, MIN_SIZE, 1);
  h = clamp(h, MIN_SIZE, 1);

  return clampRect({ x: cx - w / 2, y: cy - h / 2, w, h });
}

/** The crop as whole source pixels, ready for `drawImage`. */
export function toPixels(rect: CropRect, image: Dimensions): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const safe = clampRect(rect);
  const width = Math.max(1, Math.round(safe.w * image.width));
  const height = Math.max(1, Math.round(safe.h * image.height));
  return {
    // Rounding the offset after the size keeps the rectangle inside the image
    // when both round up on a crop that reaches the far edge.
    x: Math.min(Math.max(0, Math.round(safe.x * image.width)), image.width - width),
    y: Math.min(Math.max(0, Math.round(safe.y * image.height)), image.height - height),
    width,
    height,
  };
}

/** Whether the rectangle still covers the whole image, to within a pixel. */
export function isFullFrame(rect: CropRect, image: Dimensions): boolean {
  const box = toPixels(rect, image);
  return box.width >= image.width && box.height >= image.height;
}

/**
 * Output dimensions for a crop: the cropped pixels, optionally scaled down to a
 * longest-edge cap.
 *
 * Cropping does not resample by default — the point is to keep the pixels that
 * are left at full quality — so `maxEdge` of 0 returns the crop untouched.
 */
export function cropDimensions(
  rect: CropRect,
  image: Dimensions,
  maxEdge = 0
): Dimensions {
  const box = toPixels(rect, image);
  const cropped = { width: box.width, height: box.height };
  const longest = Math.max(cropped.width, cropped.height);
  if (!Number.isFinite(maxEdge) || maxEdge <= 0 || longest <= maxEdge) return cropped;
  return scaleBy(cropped, maxEdge / longest);
}
