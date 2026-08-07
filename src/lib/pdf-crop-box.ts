/**
 * Shared crop-rectangle interaction for the Crop PDF tool.
 *
 * It renders the first page of a document with pdf.js and lays a resizable
 * rectangle over it. The tool page keeps only the pdf-lib call that applies the
 * result — the same division of labour as `pdf-page-grid.ts`, and the same
 * reason: the interaction is the hard part and deserves one home.
 *
 * ## Margins, not pixels
 *
 * The result is reported as fractional insets from each edge rather than an
 * absolute rectangle. That is what makes "apply to every page" honest on a
 * document whose pages are not all the same size — a mixed scan, most often.
 * A 5% inset means 5% of *each* page, so a smaller page is not over-cropped and
 * a larger one is not left with a border.
 *
 * ## Accessibility
 *
 * A drag rectangle is unusable by keyboard and awkward on touch, so — exactly as
 * the page-management tools refuse to depend on drag-and-drop alone — dragging
 * is never the only way in. Four number inputs are bound to the same state in
 * both directions: drag the rectangle and the numbers follow, type a number and
 * the rectangle follows. The inputs are the accessible mechanism and are real
 * form controls, so they work with a keyboard and a screen reader with no extra
 * machinery. The corner handles are a pointer affordance on top and are
 * `aria-hidden`, because announcing them would promise an interaction that
 * assistive technology cannot actually perform.
 *
 * ## Why the strings arrive as data attributes
 *
 * Same reason as `pdf-page-grid.ts`: importing `src/i18n/ui.ts` into a client
 * bundle would ship both languages' entire dictionary to every visitor. The
 * Astro page writes the labels it needs into `data-*` attributes instead.
 */
import { loadPdfJs } from './pdf-libs';
import type { Margins } from './pdf-geometry';

/**
 * The smallest fraction of each axis that must survive the crop.
 *
 * Without a floor the rectangle can be collapsed to nothing, which produces a
 * technically valid but completely blank PDF — a result no one wants and which
 * looks like the tool failed.
 */
export const MIN_REMAINING = 0.1;

/** Preview width in CSS pixels. The stage scales down on narrow screens. */
const PREVIEW_WIDTH = 520;

export interface CropBoxUi {
  /** Renders page 1 of `file` into the stage. Resolves with the page count. */
  load(file: File): Promise<number>;
  /** Current insets, as fractions of the *displayed* page, 0–1. */
  getMargins(): Margins;
  /** Total pages in the loaded document. */
  pageCount(): number;
  /** Returns the rectangle to the whole page. */
  clear(): void;
  /** Empties the stage and forgets the document. */
  reset(): void;
}

type Edge = keyof Margins;
type Handle = 'nw' | 'ne' | 'sw' | 'se';

const EDGES: Edge[] = ['top', 'right', 'bottom', 'left'];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Wires a crop stage onto `root`.
 *
 * @param root     Container holding `[data-canvas]`, `[data-rect]` and the four
 *                 `input[data-edge]` fields.
 * @param onChange Fired after a document loads and whenever the crop changes.
 */
export function createCropBox(root: HTMLElement, onChange: () => void): CropBoxUi {
  const canvasHolder = root.querySelector<HTMLElement>('[data-canvas]')!;
  const rect = root.querySelector<HTMLElement>('[data-rect]')!;
  const inputs = new Map<Edge, HTMLInputElement>();
  for (const edge of EDGES) {
    const input = root.querySelector<HTMLInputElement>(`input[data-edge="${edge}"]`);
    if (input) inputs.set(edge, input);
  }

  let margins: Margins = { top: 0, right: 0, bottom: 0, left: 0 };
  let count = 0;

  // ---------------------------------------------------------------- state

  /** Keeps the two opposite insets on an axis from swallowing the page. */
  function clampMargins(m: Margins): Margins {
    const out = { ...m };
    for (const edge of EDGES) out[edge] = clamp(out[edge], 0, 1 - MIN_REMAINING);
    const fix = (a: Edge, b: Edge) => {
      const over = out[a] + out[b] - (1 - MIN_REMAINING);
      if (over > 0) out[b] = Math.max(0, out[b] - over);
    };
    fix('top', 'bottom');
    fix('left', 'right');
    return out;
  }

  function paint(): void {
    for (const edge of EDGES) rect.style[edge] = `${margins[edge] * 100}%`;
  }

  function syncInputs(): void {
    for (const [edge, input] of inputs) {
      // Whole percent in the field: sub-percent precision is meaningless at a
      // 520 px preview and would only produce jittery numbers while dragging.
      const next = String(Math.round(margins[edge] * 100));
      if (input.value !== next) input.value = next;
    }
  }

  function set(next: Margins, fromInput = false): void {
    margins = clampMargins(next);
    paint();
    if (!fromInput) syncInputs();
    onChange();
  }

  // ---------------------------------------------------------------- inputs

  for (const [edge, input] of inputs) {
    input.addEventListener('input', () => {
      const raw = input.value.trim();
      // An empty field is a keystroke on the way somewhere, not an instruction.
      // Clearing "25" to retype it must not snap the rectangle open to the full
      // page and back — and `Number('')` is 0, not NaN, so this has to be an
      // explicit check. A number input also reports '' for unparseable text,
      // which lands here too and is ignored for the same reason.
      if (raw === '') return;
      const pct = Number(raw);
      if (!Number.isFinite(pct)) return;
      set({ ...margins, [edge]: clamp(pct, 0, 100) / 100 }, true);
    });
    // Clamping mid-typing would fight the user ("9" on its way to "90"), so the
    // field is only rewritten once they leave it.
    input.addEventListener('blur', syncInputs);
  }

  // ---------------------------------------------------------------- pointer

  let drag: { handle: Handle | 'move'; x: number; y: number; start: Margins } | null = null;

  /** Pointer position as a fraction of the preview, so drags scale with it. */
  function fractionOf(e: PointerEvent): { x: number; y: number } {
    const box = canvasHolder.getBoundingClientRect();
    if (!box.width || !box.height) return { x: 0, y: 0 };
    return { x: (e.clientX - box.left) / box.width, y: (e.clientY - box.top) / box.height };
  }

  rect.addEventListener('pointerdown', (e) => {
    const handle = (e.target as HTMLElement).closest<HTMLElement>('[data-handle]');
    const p = fractionOf(e);
    drag = {
      handle: (handle?.dataset.handle as Handle) ?? 'move',
      x: p.x,
      y: p.y,
      start: { ...margins },
    };
    rect.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  rect.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = fractionOf(e);
    const dx = p.x - drag.x;
    const dy = p.y - drag.y;
    const s = drag.start;

    if (drag.handle === 'move') {
      // Translate: shift both insets on an axis together, and stop at the edge
      // rather than letting the rectangle shrink when it runs out of room.
      const shiftX = clamp(dx, -s.left, s.right);
      const shiftY = clamp(dy, -s.top, s.bottom);
      set({
        top: s.top + shiftY,
        bottom: s.bottom - shiftY,
        left: s.left + shiftX,
        right: s.right - shiftX,
      });
      return;
    }

    const north = drag.handle.startsWith('n');
    const west = drag.handle.endsWith('w');
    set({
      top: north ? s.top + dy : s.top,
      bottom: north ? s.bottom : s.bottom - dy,
      left: west ? s.left + dx : s.left,
      right: west ? s.right : s.right - dx,
    });
  });

  const endDrag = (e: PointerEvent) => {
    if (!drag) return;
    drag = null;
    if (rect.hasPointerCapture(e.pointerId)) rect.releasePointerCapture(e.pointerId);
  };
  rect.addEventListener('pointerup', endDrag);
  rect.addEventListener('pointercancel', endDrag);

  // ---------------------------------------------------------------- loading

  async function load(file: File): Promise<number> {
    reset();
    const pdfjsLib = await loadPdfJs();
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    count = pdf.numPages;

    try {
      const page = await pdf.getPage(1);
      const base = page.getViewport({ scale: 1 });
      // Render above CSS size on high-density screens so the preview stays
      // sharp, but never past 2× — beyond that the memory cost buys nothing.
      const density = Math.min(2, window.devicePixelRatio || 1);
      const viewport = page.getViewport({ scale: (PREVIEW_WIDTH / base.width) * density });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      // The stage is sized from the page's own aspect ratio, so the rectangle
      // never has to be repositioned once the bitmap lands.
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvasHolder.style.aspectRatio = `${base.width} / ${base.height}`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
        canvasHolder.replaceChildren(canvas);
      }
      page.cleanup();
    } finally {
      // Frees the worker's copy. The tool re-reads the File to write output.
      await pdf.destroy();
    }

    root.hidden = false;
    set({ top: 0, right: 0, bottom: 0, left: 0 });
    return count;
  }

  function reset(): void {
    canvasHolder.replaceChildren();
    canvasHolder.style.removeProperty('aspect-ratio');
    root.hidden = true;
    count = 0;
    margins = { top: 0, right: 0, bottom: 0, left: 0 };
    paint();
    syncInputs();
  }

  paint();

  return {
    load,
    reset,
    pageCount: () => count,
    getMargins: () => ({ ...margins }),
    clear: () => set({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
}
