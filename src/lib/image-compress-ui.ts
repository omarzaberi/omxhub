/**
 * Browser wiring for the Compress Image tool.
 *
 * `image-compress.ts` decides what to encode and which result to keep, and is
 * tested in Node. `image-io.ts` owns the parts of the browser every image tool
 * needs — the EXIF-aware decode, the pixel-level transparency probe, the canvas
 * encoder — and `image-result.ts` owns the closing panel. What is left here is
 * only what is specific to compressing: the quality slider, the resolution cap,
 * the format choice, and the transparency warning that goes with it.
 *
 * The module is shared by the Arabic and English pages the way `pdf-page-grid.ts`
 * is shared by the three page-management tools, so the two locales cannot drift
 * apart in behaviour — only in wording, which is passed in.
 */
import { compressImage } from './image-compress';
import { formatBytes, outputFileName, type OutputFormat } from './image-core';
import { canvasEncoder, loadImage, supportsWebp, wireFileIntake, type LoadedImage } from './image-io';
import { resultMarkup, type ResultStrings } from './image-result';

export interface CompressStrings extends ResultStrings {
  processing: string;
  error: string;
  /** Shown when nothing beat the original — the honest "already optimised" case. */
  noImprovement: string;
  /** Shown when the chosen format cannot be produced by this browser. */
  noFormat: string;
  resizedTo: (width: number, height: number) => string;
  tooLarge: string;
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

  let loaded: LoadedImage | null = null;
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
    formatNote.hidden = !(formatSelect.value === 'jpeg' && !!loaded?.hasAlpha);
  };

  qualityRange.addEventListener('input', () => {
    qualityOut.textContent = `${Math.round(Number(qualityRange.value) * 100)}%`;
  });
  formatSelect.addEventListener('change', refreshFormatNote);

  async function loadFile(file: File) {
    releaseResult();
    statusEl.hidden = true;

    const result = await loadImage(file);
    if ('error' in result) {
      showError(result.error === 'too-large' ? s.tooLarge : s.error);
      return;
    }
    loaded = result;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    previewImg.src = previewUrl;
    previewImg.alt = file.name;
    previewEl.hidden = false;

    const { width, height } = result.dimensions;
    fileListEl.innerHTML =
      `<div class="file-item"><span class="file-name">🖼 ${file.name}</span>` +
      `<span class="file-name">${width}×${height} · ${formatBytes(file.size)}</span></div>`;

    optionsEl.hidden = false;
    actionBtn.disabled = false;
    refreshFormatNote();
  }

  wireFileIntake({ dropZone, fileInput, chooseBtn }, (file) => void loadFile(file));

  actionBtn.addEventListener('click', async () => {
    // Captured into a local rather than used through the closure variable: the
    // handler awaits, and a second file can be chosen mid-encode. Reading
    // `loaded` again afterwards would report the new file's size against the old
    // file's bytes.
    const current = loaded;
    if (!current) return;
    releaseResult();

    statusEl.hidden = false;
    statusEl.className = 'status-msg';
    statusEl.innerHTML = `<span class="spinner"></span> ${s.processing}`;
    actionBtn.disabled = true;

    try {
      const result = await compressImage(
        {
          originalSize: current.file.size,
          sourceType: current.file.type,
          hasAlpha: current.hasAlpha,
          dimensions: current.dimensions,
          quality: Number(qualityRange.value),
          maxEdge: Number(maxEdgeSelect.value),
          requested: formatSelect.value as 'auto' | OutputFormat,
          webpSupported,
        },
        canvasEncoder(current.source)
      );

      if (result.kept) {
        statusEl.className = 'status-msg';
        statusEl.textContent = result.reason === 'no-format' ? s.noFormat : s.noImprovement;
        return;
      }

      resultUrl = URL.createObjectURL(result.blob as Blob);
      statusEl.className = 'status-msg';
      statusEl.innerHTML = resultMarkup({
        originalSize: current.file.size,
        newSize: result.size,
        url: resultUrl,
        name: outputFileName(current.file.name, result.format, 'compressed'),
        notes: result.resized
          ? [s.resizedTo(result.dimensions.width, result.dimensions.height)]
          : [],
        strings: s,
      });
    } catch (err) {
      console.error(err);
      showError(s.error);
    } finally {
      actionBtn.disabled = false;
    }
  });
}
