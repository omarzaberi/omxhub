/**
 * The result panel every image tool ends with: before → after, a verdict badge,
 * any notes, and the download link.
 *
 * ## Why this is shared rather than four copies of the same markup
 *
 * The four tools produce different files for different reasons, but they all owe
 * the user the same closing sentence: *this is what you gave me, this is what
 * you are getting, here is the difference.* Writing that markup per page is how
 * three of them end up with a slightly different badge and the fourth quietly
 * stops showing the size at all.
 *
 * ## The honesty rule, in one place
 *
 * Compress can promise it never returns a larger file, because shrinking is the
 * request. Convert, Resize and Crop cannot — a PNG asked for from a JPEG will
 * almost always be bigger, and refusing to hand it over would mean the tool
 * never does its job. What all four *can* promise is that the direction is never
 * hidden: growth is shown in the warning colour and stated as a percentage,
 * exactly as prominently as a saving would have been.
 *
 * That is why `verdict` is rendered from `sizeVerdict` rather than from each
 * tool's own idea of success. A tool cannot present a 40% larger file as a win
 * by accident, because it does not write this markup.
 *
 * Strings are passed in — importing `src/i18n/ui.ts` into a client bundle would
 * ship both languages' entire dictionary to every visitor, the same reason
 * `pdf-page-grid.ts` takes its labels from the page.
 */
import { formatBytes, sizeVerdict } from './image-core';

export interface ResultStrings {
  originalLabel: string;
  resultLabel: string;
  download: string;
  /** Result is smaller — the good case. */
  smaller: (percent: number) => string;
  /** Result is larger. Shown in the warning colour, never softened. */
  larger: (percent: number) => string;
  /** Within half a percent either way: a re-encode that changed nothing. */
  same: string;
}

export interface ResultView {
  originalSize: number;
  newSize: number;
  /** Object URL for the produced blob. */
  url: string;
  /** Download attribute — the file name the user will see. */
  name: string;
  /** Extra lines under the badge, e.g. new dimensions or a format note. */
  notes?: string[];
  strings: ResultStrings;
}

/**
 * HTML for the finished state of a tool, ready to assign to the status element.
 *
 * Returns a string rather than nodes because every tool's status element is
 * already written with `innerHTML` for the in-progress spinner, and mixing the
 * two would leave a stale spinner behind on the second run.
 */
export function resultMarkup(view: ResultView): string {
  const { originalSize, newSize, url, name, notes = [], strings } = view;
  const verdict = sizeVerdict(originalSize, newSize);

  const badgeText =
    verdict.direction === 'smaller'
      ? strings.smaller(verdict.percent)
      : verdict.direction === 'larger'
        ? strings.larger(verdict.percent)
        : strings.same;
  // `grew` is the only styling decision here, and it is not the tool's to make.
  const badgeClass = verdict.direction === 'larger' ? 'saving-badge grew' : 'saving-badge';

  const noteHtml = notes
    .filter(Boolean)
    .map((note) => `<p class="field-note">${note}</p>`)
    .join('');

  return (
    `<div class="size-compare">` +
    `<div class="size-cell"><span class="size-label">${strings.originalLabel}</span>` +
    `<span class="size-value">${formatBytes(originalSize)}</span></div>` +
    `<span class="size-arrow" aria-hidden="true">→</span>` +
    `<div class="size-cell${verdict.direction === 'larger' ? ' worse' : ' after'}">` +
    `<span class="size-label">${strings.resultLabel}</span>` +
    `<span class="size-value">${formatBytes(newSize)}</span></div>` +
    `</div>` +
    `<span class="${badgeClass}">${badgeText}</span>` +
    noteHtml +
    `<a class="action-btn" href="${url}" download="${name}">⬇ ${strings.download}</a>`
  );
}
