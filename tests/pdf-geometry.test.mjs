/**
 * Unit tests for the page-rotation geometry in `src/lib/pdf-geometry.ts`.
 *
 * This module is worth testing precisely because its failures are silent. A
 * wrong mapping does not throw and does not corrupt the file — it just puts the
 * page number on the wrong edge, or crops the wrong side, on the subset of
 * documents that happen to carry a `/Rotate`. That is exactly the kind of bug
 * that ships and then lives for months, so the corner behaviour the mappings
 * were derived from is pinned here rather than left in a comment.
 *
 * Run with: npm test
 */
import {
  normaliseRotation,
  displaySize,
  displayToUser,
  uprightTextAngle,
  displayToUserMargins,
} from '../src/lib/pdf-geometry.ts';

let pass = 0;
let fail = 0;
const check = (name, cond) => {
  cond ? pass++ : fail++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
};
const eq = (a, b) => Math.abs(a - b) < 1e-9;
const samePoint = (p, x, y) => eq(p.x, x) && eq(p.y, y);

// A deliberately non-square page, so a width/height mix-up cannot pass by luck.
const W = 600;
const H = 800;

// ---------------------------------------------------------------- normalise

check('0 stays 0', normaliseRotation(0) === 0);
check('90 stays 90', normaliseRotation(90) === 90);
check('negative angles wrap (-90 → 270)', normaliseRotation(-90) === 270);
check('a full turn is 0 (360 → 0)', normaliseRotation(360) === 0);
check('past a full turn wraps (450 → 90)', normaliseRotation(450) === 90);
check('-270 → 90', normaliseRotation(-270) === 90);
check('off-spec angles snap to the nearest quarter turn (100 → 90)', normaliseRotation(100) === 90);
check('small noise snaps to 0 (3 → 0)', normaliseRotation(3) === 0);

// ---------------------------------------------------------------- size

check('0° keeps the page portrait', displaySize(0, W, H).width === W && displaySize(0, W, H).height === H);
check('180° keeps the page portrait', displaySize(180, W, H).width === W && displaySize(180, W, H).height === H);
check('90° swaps to landscape', displaySize(90, W, H).width === H && displaySize(90, W, H).height === W);
check('270° swaps to landscape', displaySize(270, W, H).width === H && displaySize(270, W, H).height === W);

// ---------------------------------------------------------------- corners
//
// The mappings were derived by asking where each corner of the unrotated page
// ends up once the viewer applies `/Rotate`. Physically: hold a portrait page
// and turn it clockwise 90°, and the bottom-left corner arrives at the top-left.
// These four blocks assert exactly that, from the display side.

// 0°: display space and user space are the same thing.
check('0° — display origin is the user origin', samePoint(displayToUser(0, W, H, 0, 0), 0, 0));
check('0° — display top-right is the user top-right', samePoint(displayToUser(0, W, H, W, H), W, H));

// 90°: display is H wide and W tall.
check('90° — display bottom-left came from user (W, 0)', samePoint(displayToUser(90, W, H, 0, 0), W, 0));
check('90° — display top-left came from user (0, 0)', samePoint(displayToUser(90, W, H, 0, W), 0, 0));
check('90° — display bottom-right came from user (W, H)', samePoint(displayToUser(90, W, H, H, 0), W, H));
check('90° — display top-right came from user (0, H)', samePoint(displayToUser(90, W, H, H, W), 0, H));

// 180°: both axes invert.
check('180° — display origin came from user (W, H)', samePoint(displayToUser(180, W, H, 0, 0), W, H));
check('180° — display top-right came from user (0, 0)', samePoint(displayToUser(180, W, H, W, H), 0, 0));

// 270°: the other landscape orientation.
check('270° — display bottom-left came from user (0, H)', samePoint(displayToUser(270, W, H, 0, 0), 0, H));
check('270° — display bottom-right came from user (0, 0)', samePoint(displayToUser(270, W, H, H, 0), 0, 0));
check('270° — display top-left came from user (W, H)', samePoint(displayToUser(270, W, H, 0, W), W, H));
check('270° — display top-right came from user (W, 0)', samePoint(displayToUser(270, W, H, H, W), W, 0));

// Whatever the rotation, the four display corners must land on the four user
// corners — no point may be mapped off the page, and none may collide.
for (const r of [0, 90, 180, 270]) {
  const d = displaySize(r, W, H);
  const mapped = [
    [0, 0],
    [d.width, 0],
    [0, d.height],
    [d.width, d.height],
  ].map(([x, y]) => {
    const p = displayToUser(r, W, H, x, y);
    return `${Math.round(p.x)},${Math.round(p.y)}`;
  });
  const expected = [`0,0`, `${W},0`, `0,${H}`, `${W},${H}`];
  check(
    `${r}° — the four display corners map onto the four user corners, bijectively`,
    new Set(mapped).size === 4 && expected.every((c) => mapped.includes(c))
  );
}

// The centre is rotation-invariant, which is a cheap check that nothing is
// shifted by half a page.
for (const r of [0, 90, 180, 270]) {
  const d = displaySize(r, W, H);
  check(
    `${r}° — the display centre maps to the page centre`,
    samePoint(displayToUser(r, W, H, d.width / 2, d.height / 2), W / 2, H / 2)
  );
}

// ---------------------------------------------------------------- text angle

for (const r of [0, 90, 180, 270]) {
  check(`${r}° — upright text is written at ${r}°`, uprightTextAngle(r) === r);
}

// ---------------------------------------------------------------- margins

const M = { top: 0.1, right: 0.2, bottom: 0.3, left: 0.4 };
const sameMargins = (a, b) =>
  ['top', 'right', 'bottom', 'left'].every((k) => eq(a[k], b[k]));

check('0° leaves margins untouched', sameMargins(displayToUserMargins(0, M), M));
check(
  '90° — the visual top becomes the user-space left',
  sameMargins(displayToUserMargins(90, M), { left: 0.1, right: 0.3, bottom: 0.4, top: 0.2 })
);
check(
  '180° — every margin swaps with its opposite',
  sameMargins(displayToUserMargins(180, M), { left: 0.2, right: 0.4, bottom: 0.1, top: 0.3 })
);
check(
  '270° — the visual top becomes the user-space right',
  sameMargins(displayToUserMargins(270, M), { left: 0.3, right: 0.1, bottom: 0.2, top: 0.4 })
);

// Four quarter turns is the identity — this catches any single mapping that is
// internally consistent but rotated the wrong way round.
{
  let m = { ...M };
  for (let i = 0; i < 4; i++) m = displayToUserMargins(90, m);
  check('four 90° margin rotations return to the start', sameMargins(m, M));
}

// A margin set must never gain or lose area: the total inset on each axis is
// preserved by any rotation, only reassigned between the two edges.
for (const r of [0, 90, 180, 270]) {
  const u = displayToUserMargins(r, M);
  const before = [M.top + M.bottom, M.left + M.right].sort().join();
  const after = [u.top + u.bottom, u.left + u.right].sort().join();
  check(`${r}° — margins are reassigned between axes, never invented`, before === after);
}

// ---------------------------------------------------------------- end-to-end
//
// The real question the Crop tool asks: does cropping 10% off the visual top of
// a 90°-rotated page actually remove the strip the user was looking at?
{
  const crop = { top: 0.1, right: 0, bottom: 0, left: 0 };
  const u = displayToUserMargins(90, crop);
  // On a 90° page the visual top is the user-space left edge, so the surviving
  // box should start 10% in from x = 0 and keep its full height.
  const x = u.left * W;
  const width = W * (1 - u.left - u.right);
  const height = H * (1 - u.top - u.bottom);
  check('90° — a 10% top crop trims the user-space left edge', eq(x, 0.1 * W));
  check('90° — that crop narrows the page by 10%', eq(width, 0.9 * W));
  check('90° — and leaves the other axis untouched', eq(height, H));
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
