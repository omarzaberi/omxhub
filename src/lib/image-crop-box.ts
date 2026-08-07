/**
 * The draggable crop rectangle over an image preview.
 *
 * Deliberately built to the same contract as `pdf-crop-box.ts`, because the
 * conventions that file established are the ones worth keeping, not the code:
 *
 * - **Dragging is never the only way in.** Four number fields — x, y, width,
 *   height, all in percent — are bound to the same state in both directions:
 *   drag the rectangle and the numbers follow, type a number and the rectangle
 *   follows. They are real form controls, so they work with a keyboard and a
 *   screen reader with no extra machinery, and they are the accessible
 *   mechanism rather than a convenience.
 * - **The corner handles are `aria-hidden`.** Announcing them would promise an
 *   interaction assistive technology cannot perform.
 * - **An emptied field is not a zero.** Clearing "25" to retype it must not snap
 *   the rectangle open and back, and `Number('')` is 0 rather than NaN, so the
 *   empty case is checked explicitly.
 * - **Strings arrive as data attributes or arguments**, never by importing
 *   `src/i18n/ui.ts`, which would ship both languages' whole dictionary to every
 *   visitor.
 *
 * What is different is the model — a rectangle rather than four insets — and the
 * reason is in `image-crop.ts`: a fixed aspect ratio is the operation people
 * want from an image crop, and it is trivial on `{x, y, w, h}` and awkward on
 * insets.
 *
 * The pointer maths needs a real browser to test (jsdom reports every element as
 * zero-sized), so it is verified by hand. What the tests pin is the part that
 * carries the promises: the number fields, the clamping that stops a selection
 * collapsing, and the ratio lock.
 */
import { applyRatio, clampRect, FULL_RECT, MIN_SIZE, type CropRect } from './image-crop';

export interface CropBoxUi {
  /** Current rectangle, as fractions of the image. */
  getRect(): CropRect;
  /** Replace the rectangle. Clamped, and re-fitted to the active ratio. */
  setRect(rect: CropRect): void;
  /** Constrain to an aspect ratio (width ÷ height in image terms), or `null`. */
  setRatio(ratio: number | null): void;
  /** Tell the box the aspect ratio of the image it is sitting on. */
  setImageRatio(imageRatio: number): void;
  /** Back to the whole image. */
  clear(): void;
}

type Handle = 'nw' | 'ne' | 'sw' | 'se';
type Field = 'x' | 'y' | 'w' | 'h';

const FIELDS: Field[] = ['x', 'y', 'w', 'h'];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Wires a crop stage onto `root`.
 *
 * @param root     Container holding `[data-rect]` and the four
 *                 `input[data-crop]` fields.
 * @param onChange Fired whenever the rectangle changes.
 */
export function createImageCropBox(root: HTMLElement, onChange: () => void): CropBoxUi {
  const rectEl = root.querySelector<HTMLElement>('[data-rect]')!;
  const stage = root.querySelector<HTMLElement>('[data-stage]') ?? root;
  const inputs = new Map<Field, HTMLInputElement>();
  for (const field of FIELDS) {
    const input = root.querySelector<HTMLInputElement>(`input[data-crop="${field}"]`);
    if (input) inputs.set(field, input);
  }

  let rect: CropRect = { ...FULL_RECT };
  let ratio: number | null = null;
  let imageRatio = 1;

  // ---------------------------------------------------------------- state

  function paint(): void {
    rectEl.style.left = `${rect.x * 100}%`;
    rectEl.style.top = `${rect.y * 100}%`;
    rectEl.style.width = `${rect.w * 100}%`;
    rectEl.style.height = `${rect.h * 100}%`;
  }

  function syncInputs(): void {
    for (const [field, input] of inputs) {
      // Whole percent in the field: sub-percent precision is meaningless at a
      // few hundred pixels of preview and would only produce jittery numbers
      // while dragging.
      const next = String(Math.round(rect[field] * 100));
      if (input.value !== next) input.value = next;
    }
  }

  function set(next: CropRect, fromInput = false): void {
    rect = ratio === null ? clampRect(next) : applyRatio(next, ratio, imageRatio);
    paint();
    if (!fromInput) syncInputs();
    onChange();
  }

  // ---------------------------------------------------------------- inputs

  for (const [field, input] of inputs) {
    input.addEventListener('input', () => {
      const raw = input.value.trim();
      // An empty field is a keystroke on the way somewhere, not an instruction.
      // `Number('')` is 0, not NaN, so this has to be an explicit check. A
      // number input also reports '' for unparseable text, which lands here too.
      if (raw === '') return;
      const pct = Number(raw);
      if (!Number.isFinite(pct)) return;
      const value = clamp(pct, 0, 100) / 100;
      set({ ...rect, [field]: value }, true);
    });
    // Clamping mid-typing would fight the user ("9" on its way to "90"), so the
    // field is only rewritten once they leave it.
    input.addEventListener('blur', syncInputs);
  }

  // ---------------------------------------------------------------- pointer

  let drag: { handle: Handle | 'move'; x: number; y: number; start: CropRect } | null = null;

  /** Pointer position as a fraction of the stage, so drags scale with it. */
  function fractionOf(e: PointerEvent): { x: number; y: number } {
    const box = stage.getBoundingClientRect();
    if (!box.width || !box.height) return { x: 0, y: 0 };
    return { x: (e.clientX - box.left) / box.width, y: (e.clientY - box.top) / box.height };
  }

  rectEl.addEventListener('pointerdown', (e) => {
    const handle = (e.target as HTMLElement).closest<HTMLElement>('[data-handle]');
    const p = fractionOf(e);
    drag = {
      handle: (handle?.dataset.handle as Handle) ?? 'move',
      x: p.x,
      y: p.y,
      start: { ...rect },
    };
    rectEl.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  rectEl.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = fractionOf(e);
    const dx = p.x - drag.x;
    const dy = p.y - drag.y;
    const s = drag.start;

    if (drag.handle === 'move') {
      // Translate: slide within the image and stop at the edge rather than
      // letting the rectangle shrink when it runs out of room.
      set({
        ...s,
        x: clamp(s.x + dx, 0, 1 - s.w),
        y: clamp(s.y + dy, 0, 1 - s.h),
      });
      return;
    }

    const north = drag.handle.startsWith('n');
    const west = drag.handle.endsWith('w');
    // Resizing from a corner moves the two adjacent edges and pins the opposite
    // one, which is what makes the far corner feel anchored under the finger.
    const left = west ? clamp(s.x + dx, 0, s.x + s.w - MIN_SIZE) : s.x;
    const right = west ? s.x + s.w : clamp(s.x + s.w + dx, s.x + MIN_SIZE, 1);
    const top = north ? clamp(s.y + dy, 0, s.y + s.h - MIN_SIZE) : s.y;
    const bottom = north ? s.y + s.h : clamp(s.y + s.h + dy, s.y + MIN_SIZE, 1);

    set({ x: left, y: top, w: right - left, h: bottom - top });
  });

  const endDrag = (e: PointerEvent) => {
    if (!drag) return;
    drag = null;
    if (rectEl.hasPointerCapture(e.pointerId)) rectEl.releasePointerCapture(e.pointerId);
  };
  rectEl.addEventListener('pointerup', endDrag);
  rectEl.addEventListener('pointercancel', endDrag);

  // ---------------------------------------------------------------- api

  paint();
  syncInputs();

  return {
    getRect: () => ({ ...rect }),
    setRect: (next) => set(next),
    setRatio: (next) => {
      ratio = next;
      // Re-fit immediately rather than waiting for the next drag, so choosing
      // "square" visibly does something even on an untouched selection.
      set(rect);
    },
    setImageRatio: (next) => {
      imageRatio = Number.isFinite(next) && next > 0 ? next : 1;
      set(rect);
    },
    clear: () => set({ ...FULL_RECT }),
  };
}
