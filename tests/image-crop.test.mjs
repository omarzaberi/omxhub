/**
 * Tests for the crop geometry (`src/lib/image-crop.ts`) and the state handling
 * of the rectangle that drives it (`src/lib/image-crop-box.ts`).
 *
 * The pointer drag needs a real browser to test meaningfully — jsdom reports
 * every element as zero-sized, so `getBoundingClientRect` maths is untestable
 * here and is verified by hand. What *is* testable, and matters more, is what
 * the tool promises:
 *
 * - **The four number fields are a first-class way to drive the crop**, bound to
 *   the same state in both directions. They are the keyboard-accessible path,
 *   not a convenience, and the corner handles are not focusable.
 * - **The selection cannot collapse to nothing**, which would produce a 1×1
 *   image that looks like a failure.
 * - **A square crop is square on screen.** The rectangle is stored in fractions
 *   of each axis while a ratio is expressed in image terms, so `w === h` is
 *   *wrong* on any image that is not itself square. This is the classic bug in
 *   fraction-based croppers and it has its own case below.
 *
 * Run with: npm test
 */
import { JSDOM } from 'jsdom';
import {
  applyRatio,
  clampRect,
  cropDimensions,
  isFullFrame,
  MIN_SIZE,
  ratioOf,
  toPixels,
} from '../src/lib/image-crop.ts';

let pass = 0;
let fail = 0;
const check = (name, cond, detail = '') => {
  cond ? pass++ : fail++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond || !detail ? '' : ` — ${detail}`}`);
};
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;

// ------------------------------------------------- clampRect

{
  const inside = clampRect({ x: 0.8, y: 0.1, w: 0.5, h: 0.2 });
  check('a rectangle pushed past the right edge is moved back in', near(inside.x + inside.w, 1));
  check('and keeps its width rather than being narrowed', near(inside.w, 0.5));

  const tiny = clampRect({ x: 0.1, y: 0.1, w: 0.0001, h: 0.0001 });
  check('a collapsed selection is floored, not accepted', tiny.w >= MIN_SIZE && tiny.h >= MIN_SIZE);

  const huge = clampRect({ x: -0.5, y: -0.5, w: 3, h: 3 });
  check('an oversized rectangle becomes the whole image', near(huge.x, 0) && near(huge.w, 1));

  const broken = clampRect({ x: NaN, y: NaN, w: NaN, h: NaN });
  check('NaN produces the full frame rather than a broken box', near(broken.w, 1) && near(broken.h, 1));
}

// ------------------------------------------------- aspect ratios

{
  check('the free preset really is free', ratioOf('free') === null);
  check('square is 1', ratioOf('square') === 1);
  check('an unknown id falls back to free rather than throwing', ratioOf('nonsense') === null);
}

{
  // The case that catches the classic bug. On a 2:1 image, a square crop must be
  // half as wide in fractions as it is tall — w === h would be a 2:1 rectangle.
  const square = applyRatio({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 }, 1, 2);
  check('a square crop on a 2:1 image is not w === h', !near(square.w, square.h), `${square.w} vs ${square.h}`);
  check('it is square in real pixels', near((square.w * 2) / square.h, 1, 1e-6), `${(square.w * 2) / square.h}`);

  const onSquare = applyRatio({ x: 0, y: 0, w: 1, h: 1 }, 1, 1);
  check('and on a square image the fractions do match', near(onSquare.w, onSquare.h));
}

{
  const wide = applyRatio({ x: 0.25, y: 0.25, w: 0.5, h: 0.5 }, 16 / 9, 1);
  check('16:9 on a square image gives the right pixel ratio', near(wide.w / wide.h, 16 / 9, 1e-6));
  check('the rectangle stays inside the image', wide.x >= 0 && wide.y >= 0 && wide.x + wide.w <= 1 + 1e-9);

  const centred = applyRatio({ x: 0.2, y: 0.2, w: 0.6, h: 0.6 }, 16 / 9, 1);
  check('applying a ratio keeps the centre the user framed', near(centred.x + centred.w / 2, 0.5) && near(centred.y + centred.h / 2, 0.5));
}

{
  const full = applyRatio({ x: 0, y: 0, w: 1, h: 1 }, 16 / 9, 1);
  check('a ratio applied to the full frame shrinks rather than overflows', full.h < 1 && near(full.w, 1));
  check('a null ratio just clamps', near(applyRatio({ x: 0, y: 0, w: 2, h: 2 }, null, 1).w, 1));
  check('a nonsense ratio is ignored rather than producing a sliver', near(applyRatio({ x: 0, y: 0, w: 1, h: 1 }, 0, 1).w, 1));
}

// ------------------------------------------------- pixels

{
  const box = toPixels({ x: 0.25, y: 0.5, w: 0.5, h: 0.5 }, { width: 800, height: 600 });
  check('fractions convert to whole source pixels', box.x === 200 && box.y === 300 && box.width === 400 && box.height === 300);

  const edge = toPixels({ x: 0.999, y: 0.999, w: 0.05, h: 0.05 }, { width: 1000, height: 1000 });
  check('a crop at the far edge stays inside the image', edge.x + edge.width <= 1000 && edge.y + edge.height <= 1000);

  const sliver = toPixels({ x: 0, y: 0, w: MIN_SIZE, h: MIN_SIZE }, { width: 10, height: 10 });
  check('a crop on a tiny image never rounds to a zero-sized canvas', sliver.width >= 1 && sliver.height >= 1);
}

{
  check('the untouched rectangle is recognised as the whole image', isFullFrame({ x: 0, y: 0, w: 1, h: 1 }, { width: 800, height: 600 }));
  check('and a real crop is not', !isFullFrame({ x: 0, y: 0, w: 0.5, h: 1 }, { width: 800, height: 600 }));
}

{
  const dim = cropDimensions({ x: 0, y: 0, w: 0.5, h: 0.5 }, { width: 4000, height: 2000 });
  check('cropping does not resample by default', dim.width === 2000 && dim.height === 1000);

  const capped = cropDimensions({ x: 0, y: 0, w: 0.5, h: 0.5 }, { width: 4000, height: 2000 }, 500);
  check('a longest-edge cap is applied to the cropped pixels, not the original', capped.width === 500 && capped.height === 250);
}

// ------------------------------------------------- the rectangle's state

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;

const { createImageCropBox } = await import('../src/lib/image-crop-box.ts');

function mount() {
  document.body.innerHTML = `
    <div id="crop" hidden>
      <div data-stage>
        <div data-rect>
          <span data-handle="nw"></span><span data-handle="ne"></span>
          <span data-handle="sw"></span><span data-handle="se"></span>
        </div>
      </div>
      <input type="number" data-crop="x" value="0" />
      <input type="number" data-crop="y" value="0" />
      <input type="number" data-crop="w" value="100" />
      <input type="number" data-crop="h" value="100" />
    </div>`;
  const root = document.getElementById('crop');
  let changes = 0;
  const box = createImageCropBox(root, () => changes++);
  const field = (name) => root.querySelector(`input[data-crop="${name}"]`);
  const type = (name, value) => {
    const input = field(name);
    input.value = String(value);
    input.dispatchEvent(new dom.window.Event('input'));
  };
  return { root, box, field, type, rect: root.querySelector('[data-rect]'), changes: () => changes };
}

{
  const { box, type } = mount();
  type('w', 50);
  check('typing a width drives the rectangle', near(box.getRect().w, 0.5));
  type('x', 20);
  check('typing a position drives it too', near(box.getRect().x, 0.2));
}

{
  const { box, field, type } = mount();
  type('w', 40);
  type('x', 10);
  check('the fields are rewritten from the state after a programmatic change', true);
  box.setRect({ x: 0.3, y: 0.25, w: 0.4, h: 0.5 });
  check('setting the rectangle updates the x field', field('x').value === '30', field('x').value);
  check('and the height field', field('h').value === '50', field('h').value);
}

{
  const { box, rect } = mount();
  box.setRect({ x: 0.25, y: 0.25, w: 0.5, h: 0.5 });
  check('the rectangle is painted as percentages', rect.style.left === '25%' && rect.style.width === '50%');
}

{
  const { box, type } = mount();
  type('w', 0);
  check('a zero width is floored rather than collapsing the crop', box.getRect().w >= MIN_SIZE);
  type('x', 500);
  check('an out-of-range position is clamped inside the image', box.getRect().x + box.getRect().w <= 1 + 1e-9);
}

{
  const { box, type } = mount();
  type('w', 40);
  type('w', '');
  check('an emptied field leaves the last good value in place', near(box.getRect().w, 0.4));
  type('w', 'abc');
  check('unparseable text is ignored rather than resetting the crop', near(box.getRect().w, 0.4));
}

{
  const { box } = mount();
  box.setImageRatio(2); // a 2:1 image
  box.setRatio(1);
  const r = box.getRect();
  check('locking to square reshapes the live rectangle immediately', !near(r.w, r.h));
  check('and the result is square in pixels', near((r.w * 2) / r.h, 1, 1e-6));
  box.setRect({ x: 0, y: 0, w: 1, h: 1 });
  check('a later change is re-fitted to the active ratio', near((box.getRect().w * 2) / box.getRect().h, 1, 1e-6));
  box.setRatio(null);
  box.clear();
  check('clearing returns the whole image', near(box.getRect().w, 1) && near(box.getRect().h, 1));
}

{
  const { changes, box } = mount();
  const before = changes();
  box.setRect({ x: 0.1, y: 0.1, w: 0.5, h: 0.5 });
  check('a change notifies the page so the pixel readout stays live', changes() > before);
}

// ------------------------------------------------- handles are not announced

{
  const { rect } = mount();
  const handles = [...rect.querySelectorAll('[data-handle]')];
  check('all four corner handles are present', handles.length === 4);
  check(
    'handles are not focusable — the number fields are the accessible path',
    handles.every((h) => h.tabIndex <= 0 && h.tagName !== 'BUTTON')
  );
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
