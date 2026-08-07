/**
 * Browser wiring for the Crop Image tool.
 *
 * The same three-way split as the rest of the section: `image-io.ts` decodes
 * (EXIF applied — and it matters more here than anywhere, because a crop taken
 * off a sideways preview lands on the wrong part of the photo), `image-crop.ts`
 * does the geometry and is tested in Node, `image-crop-box.ts` handles the drag,
 * and `image-result.ts` closes the panel.
 *
 * What this file adds is the join between them: the preview element the
 * rectangle sits on, the live pixel readout, and the encode. The crop itself is
 * not a separate pixel operation — it is `canvasEncoder` with a source
 * rectangle, so the crop tool inherits the white-fill-for-JPEG and high-quality
 * smoothing behaviour instead of reimplementing them almost the same way.
 */
import { formatBytes, outputFileName, qualityFor, type Dimensions, type OutputFormat } from './image-core';
import { canvasEncoder, loadImage, supportsWebp, wireFileIntake, type LoadedImage } from './image-io';
import { cropDimensions, isFullFrame, ratioOf, toPixels } from './image-crop';
import { createImageCropBox } from './image-crop-box';
import { keepFormat } from './image-resize';
import { resultMarkup, type ResultStrings } from './image-result';

export interface CropStrings extends ResultStrings {
  processing: string;
  error: string;
  tooLarge: string;
  /** Live readout of the pixels the crop will keep. */
  willBe: (width: number, height: number) => string;
  /** Live readout when the rectangle still covers the whole image. */
  wholeImage: string;
  /** Note under the result. */
  producedNote: (width: number, height: number) => string;
}

export function mountCropTool(s: CropStrings): void {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
  const chooseBtn = document.getElementById('choose-btn');
  const fileListEl = document.getElementById('file-list');
  const optionsEl = document.getElementById('options');
  const cropRoot = document.getElementById('crop-stage');
  const cropImg = document.getElementById('crop-img') as HTMLImageElement | null;
  const ratioSelect = document.getElementById('ratio-select') as HTMLSelectElement | null;
  const resetBtn = document.getElementById('reset-btn');
  const formatSelect = document.getElementById('format-select') as HTMLSelectElement | null;
  const qualityRow = document.getElementById('quality-row');
  const qualityRange = document.getElementById('quality-range') as HTMLInputElement | null;
  const qualityOut = document.getElementById('quality-out');
  const outcomeEl = document.getElementById('outcome');
  const actionBtn = document.getElementById('action-btn') as HTMLButtonElement | null;
  const statusEl = document.getElementById('status');

  if (
    !dropZone || !fileInput || !chooseBtn || !fileListEl || !optionsEl || !cropRoot ||
    !cropImg || !ratioSelect || !resetBtn || !formatSelect || !qualityRow || !qualityRange ||
    !qualityOut || !outcomeEl || !actionBtn || !statusEl
  ) {
    return;
  }

  if (!supportsWebp()) {
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

  const chosenFormat = (): OutputFormat => {
    const picked = formatSelect.value;
    if (picked === 'keep') return keepFormat(loaded?.file.type ?? '', !!loaded?.hasAlpha);
    return picked as OutputFormat;
  };

  const refreshOutcome = () => {
    qualityRow.hidden = chosenFormat() === 'png';
    if (!loaded) {
      outcomeEl.hidden = true;
      return;
    }
    const rect = cropBox.getRect();
    const dim: Dimensions = cropDimensions(rect, loaded.dimensions);
    outcomeEl.hidden = false;
    outcomeEl.textContent = isFullFrame(rect, loaded.dimensions)
      ? s.wholeImage
      : s.willBe(dim.width, dim.height);
  };

  const cropBox = createImageCropBox(cropRoot, refreshOutcome);

  ratioSelect.addEventListener('change', () => cropBox.setRatio(ratioOf(ratioSelect.value)));
  resetBtn.addEventListener('click', () => {
    ratioSelect.value = 'free';
    cropBox.setRatio(null);
    cropBox.clear();
  });
  formatSelect.addEventListener('change', refreshOutcome);
  qualityRange.addEventListener('input', () => {
    qualityOut.textContent = `${Math.round(Number(qualityRange.value) * 100)}%`;
  });

  async function loadFile(file: File) {
    releaseResult();
    statusEl.hidden = true;

    const result = await loadImage(file);
    if ('error' in result) {
      showError(result.error === 'too-large' ? s.tooLarge : s.error);
      return;
    }
    loaded = result;

    const { width, height } = result.dimensions;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    cropImg.src = previewUrl;
    cropImg.alt = file.name;
    // The stage is sized from the image's own aspect ratio, so the rectangle
    // never has to be repositioned once the bitmap lands — the same reason
    // `pdf-crop-box.ts` sets `aspect-ratio` on its canvas holder.
    cropRoot.style.setProperty('--crop-ratio', `${width} / ${height}`);
    cropRoot.hidden = false;

    fileListEl.innerHTML =
      `<div class="file-item"><span class="file-name">🖼 ${file.name}</span>` +
      `<span class="file-name">${width}×${height} · ${formatBytes(file.size)}</span></div>`;

    // The image's aspect ratio is what makes a "square" crop actually square on
    // a 2:1 photo, so the box has to be told before any ratio is applied.
    cropBox.setImageRatio(width / height);
    ratioSelect.value = 'free';
    cropBox.setRatio(null);
    cropBox.clear();

    optionsEl.hidden = false;
    actionBtn.disabled = false;
    refreshOutcome();
  }

  wireFileIntake({ dropZone, fileInput, chooseBtn }, (file) => void loadFile(file));

  actionBtn.addEventListener('click', async () => {
    const current = loaded;
    if (!current) return;
    releaseResult();

    statusEl.hidden = false;
    statusEl.className = 'status-msg';
    statusEl.innerHTML = `<span class="spinner"></span> ${s.processing}`;
    actionBtn.disabled = true;

    try {
      const rect = cropBox.getRect();
      const box = toPixels(rect, current.dimensions);
      const dim = cropDimensions(rect, current.dimensions);
      const format = chosenFormat();

      // Cropping is the same draw with a source rectangle — no separate pixel
      // path, so JPEG still gets its white fill and the smoothing settings match
      // every other tool in the section.
      const encode = canvasEncoder(current.source, box);
      // PNG is lossless; handing it the slider value would imply the control
      // does something on it.
      const blob = await encode(format, dim, qualityFor(format, Number(qualityRange.value)));
      if (!blob || blob.size <= 0) {
        showError(s.error);
        return;
      }

      resultUrl = URL.createObjectURL(blob);
      statusEl.className = 'status-msg';
      statusEl.innerHTML = resultMarkup({
        originalSize: current.file.size,
        newSize: blob.size,
        url: resultUrl,
        name: outputFileName(current.file.name, format, 'cropped'),
        notes: [s.producedNote(dim.width, dim.height)],
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
