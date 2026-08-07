/**
 * The pieces every image tool needs, independent of what the tool does.
 *
 * ## Why this exists
 *
 * All of this was inside `image-compress.ts`, which was correct while Compress
 * was the only image tool. It stopped being correct the moment a second one
 * arrived: `fitWithin` is the whole of Resize, `formatBytes` and `savingPercent`
 * are how every tool reports its result, and importing them from a module named
 * *compress* into the Crop tool would be a lie about what the code is for.
 *
 * This is the same move `ToolLayout.astro` made when the image section arrived —
 * the shared half is extracted when the second caller shows up, not copied.
 *
 * Everything here is pure. No DOM, no canvas, no `Blob` — the browser half lives
 * in `image-io.ts`, and the split is what lets all of this be tested in Node.
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

/** Human-facing format label. Latin in both languages — these are file formats. */
export const FORMAT_LABEL: Record<OutputFormat, string> = {
  jpeg: 'JPEG',
  webp: 'WebP',
  png: 'PNG',
};

/** Lossy formats are the only ones the quality slider means anything for. */
export const LOSSY: ReadonlySet<OutputFormat> = new Set<OutputFormat>(['jpeg', 'webp']);

/**
 * Formats that cannot carry an alpha channel.
 *
 * The whole of the transparency rule reduces to this set. Encoding an image with
 * alpha into one of these flattens it, and the flattening has to be deliberate
 * (fill white) rather than incidental (composite against nothing, get black).
 */
export const OPAQUE_ONLY: ReadonlySet<OutputFormat> = new Set<OutputFormat>(['jpeg']);

/**
 * Scale `dim` so its longest edge is at most `maxEdge`, preserving aspect ratio.
 *
 * Never upscales: asking for a 4000 px limit on a 900 px image returns the 900 px
 * image. Enlarging cannot add detail. `maxEdge <= 0` means "leave it alone".
 *
 * The Resize tool needs upscaling to be *possible* — someone asking for exactly
 * 2000 px wide means it — so it calls `scaleToBox` with `allowUpscale`, and this
 * stays the strict version the other tools want.
 */
export function fitWithin(dim: Dimensions, maxEdge: number): Dimensions {
  const longest = Math.max(dim.width, dim.height);
  if (!Number.isFinite(maxEdge) || maxEdge <= 0 || longest <= maxEdge) {
    return { width: dim.width, height: dim.height };
  }
  return scaleBy(dim, maxEdge / longest);
}

/**
 * Multiply both edges by `scale`, rounded to whole pixels.
 *
 * A dimension must never round to zero — `canvas.width = 0` throws on encode, so
 * a 3000×2 banner scaled to 1% has to come back as 30×1, not 30×0.
 */
export function scaleBy(dim: Dimensions, scale: number): Dimensions {
  if (!Number.isFinite(scale) || scale <= 0) return { width: dim.width, height: dim.height };
  return {
    width: Math.max(1, Math.round(dim.width * scale)),
    height: Math.max(1, Math.round(dim.height * scale)),
  };
}

/** Whole-percent reduction from `originalSize` to `newSize`. Never negative. */
export function savingPercent(originalSize: number, newSize: number): number {
  if (originalSize <= 0 || newSize >= originalSize) return 0;
  return Math.round(((originalSize - newSize) / originalSize) * 100);
}

export interface SizeVerdict {
  direction: 'smaller' | 'larger' | 'same';
  /** Magnitude of the change as a whole percent of the original. Always ≥ 0. */
  percent: number;
}

/**
 * How the output compares to the input, as a fact rather than a judgement.
 *
 * Compress can promise it never returns a larger file, because making the file
 * smaller *is* the request. Convert, Resize and Crop cannot: asking for PNG from
 * a JPEG will almost always produce a larger file, and refusing to deliver it
 * would mean the tool never does the one thing it is for.
 *
 * So the rule those three inherit is the honest half of it — **the size change is
 * always stated, and growth is never hidden.** This function is that statement.
 * A change under half a percent reads as `same`, because "0% larger" on a
 * re-encode is noise reported as news.
 */
export function sizeVerdict(originalSize: number, newSize: number): SizeVerdict {
  if (originalSize <= 0 || newSize <= 0) return { direction: 'same', percent: 0 };
  const delta = newSize - originalSize;
  const percent = Math.round((Math.abs(delta) / originalSize) * 100);
  if (percent === 0) return { direction: 'same', percent: 0 };
  return { direction: delta < 0 ? 'smaller' : 'larger', percent };
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

/**
 * Encodes the decoded image at `dim` into `format`.
 *
 * Injected rather than imported so every decision module can be run in Node
 * against a stub. `canvas.toBlob` is the browser's job and is not where the
 * mistakes are; choosing what to ask it for is, and that is what gets tested.
 */
export type Encoder<B extends EncodedImage = EncodedImage> = (
  format: OutputFormat,
  dim: Dimensions,
  quality: number
) => Promise<B | null>;

export interface Attempt {
  format: OutputFormat;
  size: number;
}

/**
 * The smallest attempt that actually beats `originalSize`, or `null` for
 * "nothing here is an improvement, keep the user's file".
 *
 * Ties go to the earlier candidate, which is why callers pass their list in
 * preference order rather than sorted.
 */
export function chooseBest<T extends Attempt>(
  attempts: readonly T[],
  originalSize: number
): T | null {
  let best: T | null = null;
  for (const attempt of attempts) {
    if (attempt.size <= 0) continue; // a failed encode reports 0; never a winner
    if (attempt.size >= originalSize) continue;
    if (best === null || attempt.size < best.size) best = attempt;
  }
  return best;
}

/**
 * Download name: original stem, a tool suffix, and the real output extension.
 *
 * The extension pattern is deliberately strict — letters and digits, at most
 * five. A looser "anything after the last dot" rule turns `Report v1.2 final.png`
 * into `Report v1`, silently eating half the name the user recognises their file
 * by.
 */
export function outputFileName(
  originalName: string,
  format: OutputFormat,
  suffix: string
): string {
  const stem = originalName.replace(/\.[A-Za-z0-9]{1,5}$/, '') || 'image';
  return `${stem}-${suffix}.${EXTENSION[format]}`;
}

/** Quality is a 0–1 slider value, and only lossy formats are allowed to hear it. */
export function qualityFor(format: OutputFormat, quality: number): number {
  if (!LOSSY.has(format)) return 1;
  if (!Number.isFinite(quality)) return 0.8;
  return Math.min(1, Math.max(0.01, quality));
}
