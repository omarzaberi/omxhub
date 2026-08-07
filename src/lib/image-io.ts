/**
 * The browser half every image tool shares: decode, inspect, encode, intake.
 *
 * `image-core.ts` and the per-tool decision modules are pure and run in Node.
 * This is everything that only exists in a browser, and it is one file rather
 * than four because the three rules the Compress tool established are all
 * implemented here — duplicating them per tool is exactly how a category like
 * this silently starts ruining files:
 *
 * - **EXIF orientation is applied at decode.** Phone photos are stored unrotated
 *   with a rotation flag. Canvas drops the flag, so a portrait photo comes back
 *   sideways unless the decode is told `imageOrientation: 'from-image'`. That
 *   single option is the whole fix, and it is why decoding goes through
 *   `createImageBitmap` rather than an `<img>` tag.
 * - **Transparency is detected from pixels, not from the extension.** Most PNGs
 *   are fully opaque, and assuming otherwise forfeits real compression; assuming
 *   the reverse turns a logo's background black. A 128 px probe settles it.
 * - **JPEG is flattened deliberately.** It has no alpha channel, so compositing
 *   a transparent image onto nothing gives black. The canvas is filled white
 *   first, which is what every image editor does and what a person expects.
 *
 * One more browser fact shapes the tools rather than the code: **re-encoding
 * drops metadata.** EXIF, GPS coordinates and colour profiles do not survive a
 * canvas round-trip. For a tool whose selling point is that nothing leaves the
 * browser, silently stripping location data is a feature — but every tool states
 * it in its FAQ rather than leaving it as a surprise.
 */
import { MIME, type Dimensions, type OutputFormat } from './image-core';

/** Longest edge for the alpha probe. Big enough to catch a small logo's
 *  transparency, small enough to be instant on a 50 MP photograph. */
const ALPHA_PROBE_EDGE = 128;

/** Refuse absurd inputs rather than freezing the tab decoding them. */
export const MAX_BYTES = 50 * 1024 * 1024;

/** Source formats that cannot carry alpha, so the probe can be skipped. */
const OPAQUE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/bmp']);

export type DecodedImage = ImageBitmap | HTMLImageElement;

export function supportsWebp(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}

/**
 * Decode to a bitmap with EXIF rotation already applied.
 *
 * `imageOrientation` is the part that matters. The `<img>` fallback exists for
 * browsers without `createImageBitmap` options support; it applies orientation
 * itself when rendering, so the result is the same.
 */
export async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* fall through to the <img> path */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('decode failed'));
      img.src = url;
    });
    return img;
  } finally {
    // Safe once the bitmap is decoded; the element keeps its own copy.
    URL.revokeObjectURL(url);
  }
}

export function naturalSize(source: DecodedImage): Dimensions {
  return source instanceof HTMLImageElement
    ? { width: source.naturalWidth, height: source.naturalHeight }
    : { width: source.width, height: source.height };
}

/**
 * Whether the image actually has non-opaque pixels.
 *
 * The file being a PNG proves nothing — most PNGs are fully opaque, and treating
 * them as transparent would rule out JPEG and cost real compression. So the
 * pixels are checked, on a thumbnail: downscaling averages alpha, so even a few
 * transparent pixels pull a sampled pixel below 255 and are caught.
 */
export function hasTransparency(source: DecodedImage, type: string): boolean {
  if (OPAQUE_TYPES.has(type)) return false;
  const dim = naturalSize(source);
  const scale = Math.min(1, ALPHA_PROBE_EDGE / Math.max(dim.width, dim.height));
  const w = Math.max(1, Math.round(dim.width * scale));
  const h = Math.max(1, Math.round(dim.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return true; // cannot prove it is opaque, so assume the safe answer
  ctx.drawImage(source as CanvasImageSource, 0, 0, w, h);
  try {
    const { data } = ctx.getImageData(0, 0, w, h);
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) return true;
    }
    return false;
  } catch {
    return true; // tainted canvas: assume alpha rather than destroy it
  }
}

/** The rectangle of source pixels to draw. Omitted means "the whole image". */
export interface SourceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A canvas-backed `Encoder` for one decoded image.
 *
 * `sourceRect` is what lets Crop reuse this untouched: cropping is not a
 * separate operation on the pixels, it is the same draw with a source rectangle,
 * so the crop tool gets the white-fill and smoothing behaviour for free instead
 * of reimplementing them slightly differently.
 */
export function canvasEncoder(source: DecodedImage, sourceRect?: SourceRect) {
  return (format: OutputFormat, dim: Dimensions, quality: number): Promise<Blob | null> => {
    const canvas = document.createElement('canvas');
    canvas.width = dim.width;
    canvas.height = dim.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(null);

    // JPEG has no alpha channel: without this, transparent pixels composite
    // against nothing and encode as black. White is what an editor would do.
    if (format === 'jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, dim.width, dim.height);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (sourceRect) {
      ctx.drawImage(
        source as CanvasImageSource,
        sourceRect.x,
        sourceRect.y,
        sourceRect.width,
        sourceRect.height,
        0,
        0,
        dim.width,
        dim.height
      );
    } else {
      ctx.drawImage(source as CanvasImageSource, 0, 0, dim.width, dim.height);
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), MIME[format], quality);
    });
  };
}

/**
 * The drop-zone / file-input / drag-and-drop wiring, which is byte-identical
 * across the four tools and was worth writing once.
 *
 * Returns nothing: the caller's only job is `onFile`.
 */
export function wireFileIntake(
  els: { dropZone: HTMLElement; fileInput: HTMLInputElement; chooseBtn: HTMLElement },
  onFile: (file: File) => void
): void {
  const { dropZone, fileInput, chooseBtn } = els;

  chooseBtn.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('click', (e) => {
    if (e.target === dropZone || (e.target as HTMLElement).tagName !== 'BUTTON') fileInput.click();
  });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) onFile(file);
  });
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer?.files?.[0];
    if (file) onFile(file);
  });
}

export type LoadFailure = 'not-image' | 'too-large' | 'decode-failed';

export interface LoadedImage {
  file: File;
  source: DecodedImage;
  dimensions: Dimensions;
  hasAlpha: boolean;
}

/**
 * Validate, decode and inspect a chosen file in one step.
 *
 * Every tool needs exactly this sequence before it can show any options, and
 * doing it in one place is what guarantees a tool cannot be added later that
 * forgets the orientation fix or the alpha probe.
 */
export async function loadImage(file: File): Promise<LoadedImage | { error: LoadFailure }> {
  if (!file.type.startsWith('image/')) return { error: 'not-image' };
  if (file.size > MAX_BYTES) return { error: 'too-large' };

  let source: DecodedImage;
  try {
    source = await decodeImage(file);
  } catch {
    return { error: 'decode-failed' };
  }

  return {
    file,
    source,
    dimensions: naturalSize(source),
    hasAlpha: hasTransparency(source, file.type),
  };
}
