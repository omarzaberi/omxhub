/**
 * Tests for the crop rectangle's state handling (`src/lib/pdf-crop-box.ts`).
 *
 * The pointer drag needs a real browser to test meaningfully — jsdom reports
 * every element as zero-sized, so `getBoundingClientRect` maths is untestable
 * here and is verified by hand. What *is* testable, and matters more, is the
 * part this module promises: the four number fields are a first-class way to
 * drive the crop, bound to the same state in both directions, and the clamping
 * that stops a selection collapsing to nothing and producing a blank PDF.
 *
 * Run with: npm test
 */
import { JSDOM } from 'jsdom';

let pass = 0;
let fail = 0;
const check = (name, cond, detail = '') => {
  cond ? pass++ : fail++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond || !detail ? '' : ` — ${detail}`}`);
};
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
// The module touches the DOM at import time only through these globals.
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;

const { createCropBox, MIN_REMAINING } = await import('../src/lib/pdf-crop-box.ts');

function mount() {
  document.body.innerHTML = `
    <div id="crop" hidden>
      <div data-canvas></div>
      <div data-rect>
        <span data-handle="nw"></span><span data-handle="ne"></span>
        <span data-handle="sw"></span><span data-handle="se"></span>
      </div>
      <input type="number" data-edge="top" value="0" />
      <input type="number" data-edge="right" value="0" />
      <input type="number" data-edge="bottom" value="0" />
      <input type="number" data-edge="left" value="0" />
    </div>`;
  const root = document.getElementById('crop');
  let changes = 0;
  const crop = createCropBox(root, () => changes++);
  const field = (edge) => root.querySelector(`input[data-edge="${edge}"]`);
  const type = (edge, value) => {
    const input = field(edge);
    input.value = String(value);
    input.dispatchEvent(new dom.window.Event('input'));
  };
  const blur = (edge) => field(edge).dispatchEvent(new dom.window.Event('blur'));
  const rect = root.querySelector('[data-rect]');
  return { root, crop, field, type, blur, rect, changes: () => changes };
}

// ------------------------------------------------- initial state

{
  const { crop, root } = mount();
  const m = crop.getMargins();
  check('starts with no crop', m.top === 0 && m.right === 0 && m.bottom === 0 && m.left === 0);
  check('starts hidden until a document is loaded', root.hidden === true);
  check('starts with no page count', crop.pageCount() === 0);
}

// ------------------------------------------------- typing drives the crop

{
  const { crop, type, rect } = mount();
  type('top', 25);
  check('typing a percentage updates the state', near(crop.getMargins().top, 0.25));
  check('and moves the rectangle', rect.style.top === '25%');

  type('left', 10);
  check('each edge is independent', near(crop.getMargins().left, 0.1) && near(crop.getMargins().top, 0.25));
  check('untouched edges stay at zero', crop.getMargins().right === 0 && crop.getMargins().bottom === 0);
}

// ------------------------------------------------- the state drives the fields

{
  const { crop, type, field } = mount();
  type('top', 30);
  crop.clear();
  check('clearing resets the state', crop.getMargins().top === 0);
  check('and writes back into the field', field('top').value === '0');
}

// ------------------------------------------------- clamping

{
  const { crop, type, blur, field } = mount();
  type('top', 200);
  check(
    'a single edge cannot exceed the maximum',
    near(crop.getMargins().top, 1 - MIN_REMAINING),
    String(crop.getMargins().top)
  );

  type('top', -50);
  check('a negative percentage is floored at zero', crop.getMargins().top === 0);

  // The real collapse risk: two opposite edges that are each legal alone.
  type('top', 60);
  type('bottom', 60);
  const m = crop.getMargins();
  check(
    'opposite edges cannot together swallow the page',
    near(m.top + m.bottom, 1 - MIN_REMAINING),
    `top+bottom = ${m.top + m.bottom}`
  );
  check('at least the minimum area always survives', 1 - m.top - m.bottom >= MIN_REMAINING - 1e-9);
  check('and the other axis is untouched', m.left === 0 && m.right === 0);

  // Clamping must not fight the typist mid-keystroke — "9" on its way to "90".
  type('left', 9);
  check('the field is left alone while it has focus', field('left').value === '9');
  blur('left');
  check('and is rewritten once they leave it', field('left').value === '9');

  type('left', 95);
  check('an over-large value is clamped in state immediately', crop.getMargins().left <= 1 - MIN_REMAINING);
  blur('left');
  check('and the field is corrected on blur', field('left').value === String(Math.round((1 - MIN_REMAINING) * 100)));
}

// ------------------------------------------------- change notifications

{
  const { type, changes } = mount();
  const before = changes();
  type('top', 5);
  type('right', 5);
  check('every edit notifies the tool page', changes() === before + 2);
}

// ------------------------------------------------- non-numeric input

{
  const { crop, type } = mount();
  type('top', 20);
  type('top', '');
  check('an emptied field leaves the last good value in place', near(crop.getMargins().top, 0.2));
  type('top', 'abc');
  check('unparseable text is ignored rather than zeroing the crop', near(crop.getMargins().top, 0.2));
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
