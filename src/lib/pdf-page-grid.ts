/**
 * Shared page-thumbnail grid for the PDF page-management tools.
 *
 * Extract Pages, Delete Pages and Organize PDF are three different jobs sitting
 * on top of one interaction: *show the user their pages and let them act on
 * them*. This module owns that interaction once. The tool pages keep only the
 * few lines of pdf-lib that actually differ — which page indices to copy, and
 * in what order.
 *
 * Two modes, chosen by `data-mode` on the container:
 *
 *   - `select`  — each page is a toggle button. Read the result with `getSelected()`.
 *   - `reorder` — each page is draggable. Read the result with `getOrder()`.
 *
 * ## Accessibility
 *
 * Drag and drop is unusable by keyboard and unreliable on touch, so reorder mode
 * never relies on it alone: every tile also carries explicit "move earlier" /
 * "move later" buttons, which are the primary mechanism and the one the ARIA
 * labels describe. Select mode uses real `<button aria-pressed>` tiles, so it is
 * keyboard- and screen-reader-operable with no extra code.
 *
 * ## Why the strings arrive as data attributes
 *
 * The labels have to be bilingual, but importing `src/i18n/ui.ts` into a client
 * bundle would ship both languages' entire UI dictionary to every visitor. The
 * Astro page renders the labels into `data-*` attributes instead: correct copy,
 * zero extra JavaScript, and the accessible names exist in the HTML either way.
 */
import { loadPdfJs } from './pdf-libs';

export type GridMode = 'select' | 'reorder';

/**
 * Above this page count we skip canvas rendering and show numbered tiles.
 *
 * Rasterising a few hundred pages is slow and memory-hungry on mobile, and a
 * frozen tab is a worse outcome than a plain tile. The tools stay fully
 * functional either way — only the preview is dropped.
 */
export const THUMB_LIMIT = 150;

export interface PageGrid {
  /** Renders `file` into the grid. Resolves with the page count. */
  load(file: File): Promise<number>;
  /** 0-based indices of the selected pages, ascending. Select mode. */
  getSelected(): number[];
  /** 0-based source indices in their current display order. Reorder mode. */
  getOrder(): number[];
  /** Total pages currently loaded. */
  pageCount(): number;
  /** Selects every page (select mode). */
  selectAll(): void;
  /** Clears the selection (select mode). */
  clearSelection(): void;
  /** Reverses the current display order (reorder mode). */
  reverse(): void;
  /** Empties the grid and forgets the document. */
  reset(): void;
}

interface GridStrings {
  page: string;
  moveEarlier: string;
  moveLater: string;
}

function readStrings(root: HTMLElement): GridStrings {
  return {
    page: root.dataset.pageLabel || 'Page',
    moveEarlier: root.dataset.moveEarlier || 'Move earlier',
    moveLater: root.dataset.moveLater || 'Move later',
  };
}

/**
 * Wires a page grid onto `root`.
 *
 * @param root     Container carrying `data-mode` and the `data-*` label strings.
 * @param onChange Fired whenever the selection or order changes, and once after
 *                 a document finishes loading. Tool pages use it to update their
 *                 counter and enable the action button.
 */
export function createPageGrid(root: HTMLElement, onChange: () => void): PageGrid {
  const mode: GridMode = root.dataset.mode === 'reorder' ? 'reorder' : 'select';
  const s = readStrings(root);
  const selected = new Set<number>();
  let count = 0;

  const tiles = (): HTMLElement[] =>
    Array.from(root.querySelectorAll<HTMLElement>('.page-tile'));

  // ---------------------------------------------------------------- tiles

  function thumbHolder(): HTMLElement {
    const holder = document.createElement('span');
    holder.className = 'tile-thumb';
    // Placeholder keeps the tile at its final height, so filling in canvases
    // later does not reflow the grid (and does not cost CLS).
    holder.innerHTML = '<span class="tile-skeleton" aria-hidden="true"></span>';
    return holder;
  }

  function numberLabel(index: number): HTMLElement {
    const num = document.createElement('span');
    num.className = 'tile-num';
    num.textContent = String(index + 1);
    return num;
  }

  function makeSelectTile(index: number): HTMLElement {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'page-tile';
    tile.dataset.index = String(index);
    tile.setAttribute('aria-pressed', 'false');
    tile.setAttribute('aria-label', `${s.page} ${index + 1}`);
    tile.append(thumbHolder(), numberLabel(index));
    return tile;
  }

  function makeReorderTile(index: number): HTMLElement {
    const tile = document.createElement('div');
    tile.className = 'page-tile';
    tile.dataset.index = String(index);
    tile.draggable = true;

    const moves = document.createElement('span');
    moves.className = 'tile-moves';
    for (const dir of [-1, 1] as const) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.move = String(dir);
      btn.className = 'tile-move';
      // Logical, not visual: the stylesheet flips the glyph under `dir="rtl"`,
      // while the accessible name always describes the effect on page order.
      btn.textContent = dir === -1 ? '‹' : '›';
      btn.setAttribute(
        'aria-label',
        `${dir === -1 ? s.moveEarlier : s.moveLater} — ${s.page} ${index + 1}`
      );
      moves.appendChild(btn);
    }

    tile.append(thumbHolder(), numberLabel(index), moves);
    return tile;
  }

  const makeTile = mode === 'reorder' ? makeReorderTile : makeSelectTile;

  // ---------------------------------------------------------------- loading

  async function load(file: File): Promise<number> {
    reset();
    const pdfjsLib = await loadPdfJs();
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    count = pdf.numPages;

    // Build every tile first so the grid appears immediately, then fill the
    // previews in. A 200-page document is usable before page 2 has rendered.
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) frag.appendChild(makeTile(i));
    root.appendChild(frag);
    root.hidden = false;
    onChange();

    try {
      const limit = Math.min(count, THUMB_LIMIT);
      for (let i = 1; i <= limit; i++) {
        const page = await pdf.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: 150 / base.width });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) break;
        // pdf.js derives the target canvas from the context — passing `canvas`
        // as well is a no-op at runtime and not part of `RenderParameters`.
        await page.render({ canvasContext: ctx, viewport }).promise;
        page.cleanup();
        // The tile may have moved (reorder mode), so look it up by index.
        const holder = root.querySelector(`.page-tile[data-index="${i - 1}"] .tile-thumb`);
        if (holder) holder.replaceChildren(canvas);
      }
    } finally {
      // Frees the worker's copy of the document. The tool re-reads the File
      // when it writes output, so nothing downstream depends on this handle.
      await pdf.destroy();
    }
    return count;
  }

  function reset(): void {
    root.replaceChildren();
    root.hidden = true;
    selected.clear();
    count = 0;
  }

  // ---------------------------------------------------------------- select

  function setSelected(tile: HTMLElement, on: boolean): void {
    const index = Number(tile.dataset.index);
    if (on) selected.add(index);
    else selected.delete(index);
    tile.setAttribute('aria-pressed', String(on));
  }

  if (mode === 'select') {
    root.addEventListener('click', (e) => {
      const tile = (e.target as HTMLElement).closest<HTMLElement>('.page-tile');
      if (!tile) return;
      setSelected(tile, tile.getAttribute('aria-pressed') !== 'true');
      onChange();
    });
  }

  // ---------------------------------------------------------------- reorder

  function move(tile: HTMLElement, dir: -1 | 1): void {
    const sibling = dir === -1 ? tile.previousElementSibling : tile.nextElementSibling;
    if (!sibling) return;
    if (dir === -1) sibling.before(tile);
    else sibling.after(tile);
    // Keep focus on the button the user pressed so repeated presses keep working.
    tile.querySelector<HTMLElement>(`.tile-move[data-move="${dir}"]`)?.focus();
    onChange();
  }

  if (mode === 'reorder') {
    root.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('.tile-move');
      const tile = btn?.closest<HTMLElement>('.page-tile');
      if (!btn || !tile) return;
      move(tile, Number(btn.dataset.move) === -1 ? -1 : 1);
    });

    let dragEl: HTMLElement | null = null;

    root.addEventListener('dragstart', (e) => {
      const tile = (e.target as HTMLElement).closest<HTMLElement>('.page-tile');
      if (!tile) return;
      dragEl = tile;
      tile.classList.add('dragging');
      // Firefox refuses to start a drag without a payload.
      e.dataTransfer?.setData('text/plain', tile.dataset.index ?? '');
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    });

    root.addEventListener('dragover', (e) => {
      if (!dragEl) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      const target = (e.target as HTMLElement).closest<HTMLElement>('.page-tile');
      if (!target || target === dragEl) return;
      const rect = target.getBoundingClientRect();
      const pastMiddle = e.clientX - rect.left > rect.width / 2;
      // Past the midpoint means "later in the order" — which is to the *left*
      // when the grid is laid out right-to-left.
      const rtl = getComputedStyle(root).direction === 'rtl';
      const insertAfter = rtl ? !pastMiddle : pastMiddle;
      if (insertAfter) target.after(dragEl);
      else target.before(dragEl);
    });

    root.addEventListener('drop', (e) => e.preventDefault());

    root.addEventListener('dragend', () => {
      dragEl?.classList.remove('dragging');
      dragEl = null;
      onChange();
    });
  }

  // ---------------------------------------------------------------- public

  return {
    load,
    reset,
    pageCount: () => count,
    getSelected: () => [...selected].sort((a, b) => a - b),
    getOrder: () => tiles().map((tile) => Number(tile.dataset.index)),
    selectAll() {
      tiles().forEach((tile) => setSelected(tile, true));
      onChange();
    },
    clearSelection() {
      tiles().forEach((tile) => setSelected(tile, false));
      onChange();
    },
    reverse() {
      root.append(...tiles().reverse());
      onChange();
    },
  };
}
