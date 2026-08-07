/**
 * Browser wiring for the Compress Image tool — the half that needs a DOM.
 *
 * `image-compress.ts` decides what to encode and which result to keep, and is
 * tested in Node. This file is everything that only exists in a browser: decode
 * the file, find out whether it has transparency, ask the canvas for bytes, and
 * put the outcome on screen. It is shared by the Arabic and English pages the
 * way `pdf-page-grid.ts` is shared by the three page-management tools, so the
 * two locales cannot drift apart in behaviour — only in wording, which is passed
 * in.
 *
 * Three browser facts drive the shape of the code:
 *
 * - **EXIF orientation lives outside the pixels.** Phone photos are stored
 *   unrotated with a rotation flag. Canvas drops the flag, so a portrait photo
 *   comes back sideways unless the decode is told `imageOrientation:
 *   'from-image'`. That single option is the whole fix, and it is why decoding
 *   goes through `createImageBitmap` rather than an `<img>` tag.
 * - **JPEG has no alpha.** Compositing a transparent image onto nothing gives
 *   black. Where JPEG is used deliberately the canvas is filled white first,
 *   which is what every image editor does and what a person expects to see.
 * - **Re-encoding drops metadata.** EXIF, GPS coordinates and colour profiles do
 *   not survive a canvas round-trip. For a tool whose selling point is that
 *   nothing leaves the browser, silently stripping location data from a photo is
 *   a feature — but it is stated in the FAQ rather than left as a surprise.
 */
import {
  compressImage,
  formatBytes,
  outputFileName,
  MIME,
  type Dimensions,
  type OutputFormat,
} from './image-compress';

export interface CompressStrings {
  processing: string;
  error: string;
  download: string;
  originalLabel: string;
  resultLabel: string;
  /** Shown when nothing beat the original — the honest "already optimised" case. */
  noImprovement: string;
  /** Shown when the chosen format cannot be produced by this browser. */
  noFormat: string;
  /** Warning when JPEG is chosen for an image that has transparency. */
  alphaJpegWarning: string;
  saved: (percent: number) => string;
  resizedTo: (width: number, height: number) => string;
  tooLarge: string;
}

/** Longest edge for the alpha probe. Big enough to catch a small logo's
 *  transparency, small enough to be instant on a 50 MP photograph. */
const ALPHA_PROBE_EDGE = 128;

/** Refuse absurd inputs rather than freezing the tab decoding them. */
const MAX_BYTES = 50 * 1024 * 1024;

/** Formats that cannot carry alpha, so the probe can be skipped entirely. */
const OPAQUE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/bmp']);

function supportsWebp(): boolean {
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
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
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

function naturalSize(source: ImageBitmap | HTMLImageElement): Dimensions {
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
function hasTransparency(source: ImageBitmap | HTMLImageElement, type: string): boolean {
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

function encodeWith(source: ImageBitmap | HTMLImageElement) {
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
    ctx.drawImage(source as CanvasImageSource, 0, 0, dim.width, dim.height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), MIME[format], quality);
    });
  };
}

export function mountCompressTool(s: CompressStrings): void {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
  const chooseBtn = document.getElementById('choose-btn');
  const fileListEl = document.getElementById('file-list');
  const optionsEl = document.getElementById('options');
  const qualityRange = document.getElementById('quality-range') as HTMLInputElement | null;
  const qualityOut = document.getElementById('quality-out');
  const maxEdgeSelect = document.getElementById('maxedge-select') as HTMLSelectElement | null;
  const formatSelect = document.getElementById('format-select') as HTMLSelectElement | null;
  const formatNote = document.getElementById('format-note');
  const previewEl = document.getElementById('preview');
  const previewImg = document.getElementById('preview-img') as HTMLImageElement | null;
  const actionBtn = document.getElementById('action-btn') as HTMLButtonElement | null;
  const statusEl = document.getElementById('status');

  if (
    !dropZone || !fileInput || !chooseBtn || !fileListEl || !optionsEl || !qualityRange ||
    !qualityOut || !maxEdgeSelect || !formatSelect || !formatNote || !previewEl ||
    !previewImg || !actionBtn || !statusEl
  ) {
    return;
  }

  const webpSupported = supportsWebp();
  if (!webpSupported) {
    const webpOption = formatSelect.querySelector('option[value="webp"]');
    if (webpOption) webpOption.remove();
  }

  let currentFile: File | null = null;
  let source: ImageBitmap | HTMLImageElement | null = null;
  let alpha = false;
  let previewUrl = '';
  let resultUrl = '';

  const releaseResult = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = '';
  };

  const showError = (message: string) => {
    statusEl.hidden = false;
    statusEl.className = 'status-msg error';
    statusEl.textContent = message;
  };

  /** JPEG on a transparent image is allowed but never silent. */
  const refreshFormatNote = () => {
    const wantsJpeg = formatSelect.value === 'jpeg';
    formatNote.hidden = !(wantsJpeg && alpha);
  };

  qualityRange.addEventListener('input', () => {
    qualityOut.textContent = `${Math.round(Number(qualityRange.value) * 100)}%`;
  });
  formatSelect.addEventListener('change', refreshFormatNote);

  async function loadFile(file: File) {
    releaseResult();
    statusEl.hidden = true;

    if (!file.type.startsWith('image/')) {
      showError(s.error);
      return;
    }
    if (file.size > MAX_BYTES) {
      showError(s.tooLarge);
      return;
    }

    try {
      source = await decode(file);
    } catch {
      showError(s.error);
      return;
    }

    currentFile = file;
    alpha = hasTransparency(source, file.type);
    const dim = naturalSize(source);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    previewImg.src = previewUrl;
    previewImg.alt = file.name;
    previewEl.hidden = false;

    fileListEl.innerHTML =
      `<div class="file-item"><span class="file-name">🖼 ${file.name}</span>` +
      `<span class="file-name">${dim.width}×${dim.height} · ${formatBytes(file.size)}</span></div>`;

    optionsEl.hidden = false;
    actionBtn.disabled = false;
    refreshFormatNote();
  }

  chooseBtn.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('click', (e) => {
    if (e.target === dropZone || (e.target as HTMLElement).tagName !== 'BUTTON') fileInput.click();
  });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) void loadFile(file);
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
    if (file) void loadFile(file);
  });

  actionBtn.addEventListener('click', async () => {
    // Captured into locals rather than used through the closure variables: the
    // handler awaits, and a second file can be chosen mid-encode. Reading
    // `currentFile` again afterwards would report the new file's size against
    // the old file's bytes.
    const file = currentFile;
    const src = source;
    const srcHasAlpha = alpha;
    if (!file || !src) return;
    releaseResult();

    statusEl.hidden = false;
    statusEl.className = 'status-msg';
    statusEl.innerHTML = `<span class="spinner"></span> ${s.processing}`;
    actionBtn.disabled = true;

    try {
      const result = await compressImage(
        {
          originalSize: file.size,
          sourceType: file.type,
          hasAlpha: srcHasAlpha,
          dimensions: naturalSize(src),
          quality: Number(qualityRange.value),
          maxEdge: Number(maxEdgeSelect.value),
          requested: formatSelect.value as 'auto' | OutputFormat,
          webpSupported,
        },
        encodeWith(src)
      );

      if (result.kept) {
        statusEl.className = 'status-msg';
        statusEl.textContent = result.reason === 'no-format' ? s.noFormat : s.noImprovement;
        return;
      }

      resultUrl = URL.createObjectURL(result.blob as Blob);
      const name = outputFileName(file.name, result.format);
      const resizedNote = result.resized
        ? `<p class="field-note">${s.resizedTo(result.dimensions.width, result.dimensions.height)}</p>`
        : '';

      statusEl.className = 'status-msg';
      statusEl.innerHTML =
        `<div class="size-compare">` +
        `<div class="size-cell"><span class="size-label">${s.originalLabel}</span>` +
        `<span class="size-value">${formatBytes(file.size)}</span></div>` +
        `<span class="size-arrow" aria-hidden="true">→</span>` +
        `<div class="size-cell after"><span class="size-label">${s.resultLabel}</span>` +
        `<span class="size-value">${formatBytes(result.size)}</span></div>` +
        `</div>` +
        `<span class="saving-badge">${s.saved(result.savedPercent)}</span>` +
        resizedNote +
        `<a class="action-btn" href="${resultUrl}" download="${name}">⬇ ${s.download}</a>`;
    } catch (err) {
      console.error(err);
      showError(s.error);
    } finally {
      actionBtn.disabled = false;
    }
  });
}
