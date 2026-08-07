/**
 * Browser wiring for the Convert Image tool.
 *
 * The shape is deliberately the same as `image-compress-ui.ts`: decode through
 * `image-io.ts` so the EXIF and transparency rules are applied identically,
 * decide in `image-convert.ts` so the decision is testable in Node, and close
 * with `image-result.ts` so the size change is reported the same way everywhere.
 *
 * The only interesting behaviour that lives here is the pair of notices under
 * the format picker, because both are warnings *before* the fact rather than
 * explanations after it:
 *
 * - choosing JPEG for an image that has transparency, which will flatten it;
 * - choosing the format the file already is, which re-encodes it for nothing.
 *
 * Both are recomputed whenever either the file or the target changes, so the
 * page can never show a warning about the previous image.
 */
import {
  alphaWillFlatten,
  convertImage,
  isSameFormat,
  availableTargets,
} from './image-convert';
import { FORMAT_LABEL, formatBytes, outputFileName, type OutputFormat } from './image-core';
import { canvasEncoder, loadImage, supportsWebp, wireFileIntake, type LoadedImage } from './image-io';
import { resultMarkup, type ResultStrings } from './image-result';

export interface ConvertStrings extends ResultStrings {
  processing: string;
  error: string;
  tooLarge: string;
  /** The browser cannot encode the chosen format. */
  noFormat: string;
  /** JPEG chosen for an image that has transparency. */
  alphaWarning: string;
  /** The chosen target is the format the file already is. */
  sameFormatNote: (format: string) => string;
  /** Note under the result when transparency was flattened to white. */
  flattenedNote: string;
  /** Note under the result naming what was produced. */
  producedNote: (format: string, width: number, height: number) => string;
}

export function mountConvertTool(s: ConvertStrings): void {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
  const chooseBtn = document.getElementById('choose-btn');
  const fileListEl = document.getElementById('file-list');
  const optionsEl = document.getElementById('options');
  const formatSelect = document.getElementById('format-select') as HTMLSelectElement | null;
  const alphaNote = document.getElementById('alpha-note');
  const sameNote = document.getElementById('same-note');
  const qualityRow = document.getElementById('quality-row');
  const qualityRange = document.getElementById('quality-range') as HTMLInputElement | null;
  const qualityOut = document.getElementById('quality-out');
  const previewEl = document.getElementById('preview');
  const previewImg = document.getElementById('preview-img') as HTMLImageElement | null;
  const actionBtn = document.getElementById('action-btn') as HTMLButtonElement | null;
  const statusEl = document.getElementById('status');

  if (
    !dropZone || !fileInput || !chooseBtn || !fileListEl || !optionsEl || !formatSelect ||
    !alphaNote || !sameNote || !qualityRow || !qualityRange || !qualityOut || !previewEl ||
    !previewImg || !actionBtn || !statusEl
  ) {
    return;
  }

  const webpSupported = supportsWebp();
  const targets = availableTargets(webpSupported);
  for (const option of Array.from(formatSelect.options)) {
    if (!targets.includes(option.value as OutputFormat)) option.remove();
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

  /** Both pre-flight notices, plus the quality row, follow the current target. */
  const refreshNotes = () => {
    const target = formatSelect.value as OutputFormat;
    alphaNote.hidden = !alphaWillFlatten(!!loaded?.hasAlpha, target);
    sameNote.hidden = !(loaded && isSameFormat(loaded.file.type, target));
    if (!sameNote.hidden) sameNote.textContent = s.sameFormatNote(FORMAT_LABEL[target]);
    // PNG is lossless, so a quality slider on it would be a control that does
    // nothing — worse than no control, because it implies a trade-off exists.
    qualityRow.hidden = target === 'png';
  };

  qualityRange.addEventListener('input', () => {
    qualityOut.textContent = `${Math.round(Number(qualityRange.value) * 100)}%`;
  });
  formatSelect.addEventListener('change', refreshNotes);

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
    refreshNotes();
  }

  wireFileIntake({ dropZone, fileInput, chooseBtn }, (file) => void loadFile(file));

  actionBtn.addEventListener('click', async () => {
    // Captured before the await: a second file can be chosen mid-encode, and
    // reading the closure variable afterwards would measure the new file's size
    // against the old file's bytes.
    const current = loaded;
    if (!current) return;
    releaseResult();

    statusEl.hidden = false;
    statusEl.className = 'status-msg';
    statusEl.innerHTML = `<span class="spinner"></span> ${s.processing}`;
    actionBtn.disabled = true;

    try {
      const target = formatSelect.value as OutputFormat;
      const result = await convertImage(
        {
          originalSize: current.file.size,
          sourceType: current.file.type,
          hasAlpha: current.hasAlpha,
          dimensions: current.dimensions,
          quality: Number(qualityRange.value),
          target,
          webpSupported,
        },
        canvasEncoder(current.source)
      );

      if (!result.ok) {
        statusEl.className = 'status-msg error';
        statusEl.textContent = result.reason === 'no-format' ? s.noFormat : s.error;
        return;
      }

      resultUrl = URL.createObjectURL(result.blob as Blob);
      statusEl.className = 'status-msg';
      statusEl.innerHTML = resultMarkup({
        originalSize: current.file.size,
        newSize: result.size,
        url: resultUrl,
        name: outputFileName(current.file.name, result.format, 'converted'),
        notes: [
          s.producedNote(
            FORMAT_LABEL[result.format],
            result.dimensions.width,
            result.dimensions.height
          ),
          result.flattened ? s.flattenedNote : '',
        ],
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
