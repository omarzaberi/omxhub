/**
 * Browser wiring for the Resize Image tool.
 *
 * Same division as the other three: `image-io.ts` decodes (EXIF applied, alpha
 * probed), `image-resize.ts` does the arithmetic and is tested in Node, and
 * `image-result.ts` closes the panel. What is here is the mode switch and the
 * live preview of the outcome.
 *
 * ## The live figure is the feature
 *
 * A resizer that only tells you the answer after you press the button makes you
 * press it to find out whether you asked the right question. Every control here
 * recomputes `targetDimensions` on input and prints the result — including the
 * cases where the answer is "nothing will change", which is the one a person is
 * most likely to be surprised by. It costs nothing: the arithmetic is pure and
 * runs on the numbers, not the pixels.
 *
 * The upscale checkbox follows the same idea. It is not a warning that fires
 * after an enlargement; it is a stated permission, and the note beside it
 * appears only when the current numbers would actually need it.
 */
import { formatBytes, outputFileName, type OutputFormat } from './image-core';
import { canvasEncoder, loadImage, supportsWebp, wireFileIntake, type LoadedImage } from './image-io';
import { resultMarkup, type ResultStrings } from './image-result';
import {
  keepFormat,
  resizeImage,
  targetDimensions,
  willUpscale,
  type ResizeMode,
  type ResizeRequest,
} from './image-resize';

export interface ResizeStrings extends ResultStrings {
  processing: string;
  error: string;
  tooLarge: string;
  /** Live readout of the dimensions that will be produced. */
  willBe: (width: number, height: number) => string;
  /** Live readout when the current settings change nothing. */
  willBeUnchanged: string;
  /** Shown beside the upscale control when the numbers would enlarge. */
  upscaleNote: string;
  /** Note under the result. */
  producedNote: (width: number, height: number) => string;
}

/** Fields that belong to each mode, so only the relevant ones are shown. */
const MODE_FIELDS: Record<ResizeMode, string[]> = {
  longest: ['longest'],
  width: ['width'],
  height: ['height'],
  percent: ['percent'],
  exact: ['exact'],
};

export function mountResizeTool(s: ResizeStrings): void {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
  const chooseBtn = document.getElementById('choose-btn');
  const fileListEl = document.getElementById('file-list');
  const optionsEl = document.getElementById('options');
  const modeSelect = document.getElementById('mode-select') as HTMLSelectElement | null;
  const longestInput = document.getElementById('longest-input') as HTMLInputElement | null;
  const widthInput = document.getElementById('width-input') as HTMLInputElement | null;
  const heightInput = document.getElementById('height-input') as HTMLInputElement | null;
  const percentInput = document.getElementById('percent-input') as HTMLInputElement | null;
  const exactWidth = document.getElementById('exact-width') as HTMLInputElement | null;
  const exactHeight = document.getElementById('exact-height') as HTMLInputElement | null;
  const lockCheck = document.getElementById('lock-check') as HTMLInputElement | null;
  const upscaleCheck = document.getElementById('upscale-check') as HTMLInputElement | null;
  const upscaleNote = document.getElementById('upscale-note');
  const formatSelect = document.getElementById('format-select') as HTMLSelectElement | null;
  const qualityRow = document.getElementById('quality-row');
  const qualityRange = document.getElementById('quality-range') as HTMLInputElement | null;
  const qualityOut = document.getElementById('quality-out');
  const outcomeEl = document.getElementById('outcome');
  const previewEl = document.getElementById('preview');
  const previewImg = document.getElementById('preview-img') as HTMLImageElement | null;
  const actionBtn = document.getElementById('action-btn') as HTMLButtonElement | null;
  const statusEl = document.getElementById('status');

  if (
    !dropZone || !fileInput || !chooseBtn || !fileListEl || !optionsEl || !modeSelect ||
    !longestInput || !widthInput || !heightInput || !percentInput || !exactWidth ||
    !exactHeight || !lockCheck || !upscaleCheck || !upscaleNote || !formatSelect ||
    !qualityRow || !qualityRange || !qualityOut || !outcomeEl || !previewEl || !previewImg ||
    !actionBtn || !statusEl
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

  /** An empty or unparseable field is a keystroke on the way somewhere, not a
   *  number. `Number('')` is 0, so this has to be an explicit check. */
  const num = (input: HTMLInputElement): number | undefined => {
    const raw = input.value.trim();
    if (raw === '') return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  };

  const currentRequest = (): ResizeRequest | null => {
    if (!loaded) return null;
    return {
      source: loaded.dimensions,
      mode: modeSelect.value as ResizeMode,
      longest: num(longestInput),
      width: modeSelect.value === 'exact' ? num(exactWidth) : num(widthInput),
      height: modeSelect.value === 'exact' ? num(exactHeight) : num(heightInput),
      percent: num(percentInput),
      lockAspect: lockCheck.checked,
      allowUpscale: upscaleCheck.checked,
    };
  };

  const chosenFormat = (): OutputFormat => {
    const picked = formatSelect.value;
    if (picked === 'keep') return keepFormat(loaded?.file.type ?? '', !!loaded?.hasAlpha);
    return picked as OutputFormat;
  };

  /** Recomputes every dependent piece of the UI from the current inputs. */
  const refresh = () => {
    const mode = modeSelect.value as ResizeMode;
    const shown = MODE_FIELDS[mode] ?? MODE_FIELDS.longest;
    for (const group of Array.from(optionsEl.querySelectorAll<HTMLElement>('[data-field]'))) {
      group.hidden = !shown.includes(group.dataset.field ?? '');
    }
    // The aspect lock only means anything when both edges are being specified.
    const lockRow = optionsEl.querySelector<HTMLElement>('[data-field="lock"]');
    if (lockRow) lockRow.hidden = mode !== 'exact';

    qualityRow.hidden = chosenFormat() === 'png';

    const req = currentRequest();
    if (!req) {
      outcomeEl.hidden = true;
      upscaleNote.hidden = true;
      return;
    }

    const target = targetDimensions(req);
    const unchanged =
      target.width === req.source.width && target.height === req.source.height;
    outcomeEl.hidden = false;
    outcomeEl.textContent = unchanged ? s.willBeUnchanged : s.willBe(target.width, target.height);
    // Only offer the permission when the numbers would actually need it.
    upscaleNote.hidden = !(willUpscale(req) && !upscaleCheck.checked);
  };

  for (const el of [longestInput, widthInput, heightInput, percentInput, exactWidth, exactHeight]) {
    el.addEventListener('input', refresh);
  }
  for (const el of [modeSelect, formatSelect, lockCheck, upscaleCheck]) {
    el.addEventListener('change', refresh);
  }
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

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    previewImg.src = previewUrl;
    previewImg.alt = file.name;
    previewEl.hidden = false;

    const { width, height } = result.dimensions;
    fileListEl.innerHTML =
      `<div class="file-item"><span class="file-name">🖼 ${file.name}</span>` +
      `<span class="file-name">${width}×${height} · ${formatBytes(file.size)}</span></div>`;

    // Seed the fields from the real image so the first thing shown is the truth
    // about this file rather than a placeholder someone has to clear.
    exactWidth.value = String(width);
    exactHeight.value = String(height);
    if (!widthInput.value) widthInput.value = String(Math.max(1, Math.round(width / 2)));
    if (!heightInput.value) heightInput.value = String(Math.max(1, Math.round(height / 2)));

    optionsEl.hidden = false;
    actionBtn.disabled = false;
    refresh();
  }

  wireFileIntake({ dropZone, fileInput, chooseBtn }, (file) => void loadFile(file));

  actionBtn.addEventListener('click', async () => {
    const current = loaded;
    const req = currentRequest();
    if (!current || !req) return;
    releaseResult();

    statusEl.hidden = false;
    statusEl.className = 'status-msg';
    statusEl.innerHTML = `<span class="spinner"></span> ${s.processing}`;
    actionBtn.disabled = true;

    try {
      const result = await resizeImage(
        {
          ...req,
          originalSize: current.file.size,
          format: chosenFormat(),
          quality: Number(qualityRange.value),
        },
        canvasEncoder(current.source)
      );

      if (!result.ok) {
        showError(s.error);
        return;
      }

      resultUrl = URL.createObjectURL(result.blob as Blob);
      statusEl.className = 'status-msg';
      statusEl.innerHTML = resultMarkup({
        originalSize: current.file.size,
        newSize: result.size,
        url: resultUrl,
        name: outputFileName(current.file.name, result.format, 'resized'),
        notes: [s.producedNote(result.dimensions.width, result.dimensions.height)],
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
