/**
 * Page-rotation geometry, shared by the PDF tools that place things on a page.
 *
 * ## The problem this exists to solve
 *
 * A PDF page carries a `/Rotate` entry — 0, 90, 180 or 270 — which tells a
 * viewer to turn the content clockwise before showing it. Scanners set it
 * constantly. Crucially, **it does not move the content**: the coordinate
 * system pdf-lib writes into is the *unrotated* one, while the coordinates the
 * user picked come from what they *saw*, which is the rotated one.
 *
 * Ignore the difference and both of our placement tools break in the same
 * quiet, confusing way. Page numbers land sideways along an edge of a rotated
 * scan instead of under it; a crop taken off the visual bottom comes off the
 * left instead. The file is not corrupt and nothing throws — it is simply
 * wrong, which is the worst kind of bug to ship.
 *
 * So this module owns the conversion once, and the tools stay declarative:
 * they work entirely in display space, which is the only space the user knows.
 *
 * ## Coordinates
 *
 * - **User space** — what pdf-lib writes. Origin bottom-left, y grows upward,
 *   dimensions from `page.getSize()`. Unaffected by `/Rotate`.
 * - **Display space** — what the reader sees, and what pdf.js renders. Origin
 *   bottom-left of the *rotated* page, so for 90° and 270° the width and height
 *   are swapped relative to user space.
 *
 * Every mapping below was derived from where the four page corners land, and
 * each is verified by `tests/pdf-geometry.test.mjs` against that same corner
 * behaviour plus a round trip back through the inverse.
 */

/** The four values `/Rotate` may legally hold. */
export type Rotation = 0 | 90 | 180 | 270;

/**
 * Normalises any angle to 0 / 90 / 180 / 270.
 *
 * `page.getRotation().angle` is whatever was written into the file, which may be
 * negative (`-90`) or wrapped past a full turn (`450`), and pdf-lib does not
 * normalise it for us. Angles that are not right angles are illegal in the PDF
 * spec but do occur; we snap them to the nearest quarter turn rather than
 * refusing, because placing the content very slightly off is a far better
 * outcome for the user than placing nothing at all.
 */
export function normaliseRotation(angle: number): Rotation {
  const r = ((Math.round(angle / 90) * 90) % 360 + 360) % 360;
  return (r === 90 || r === 180 || r === 270 ? r : 0) as Rotation;
}

/** Page size as the reader sees it — width and height swap at 90° and 270°. */
export function displaySize(
  rotation: Rotation,
  width: number,
  height: number
): { width: number; height: number } {
  return rotation === 90 || rotation === 270
    ? { width: height, height: width }
    : { width, height };
}

/**
 * Converts a point the user picked on screen into the point pdf-lib must write.
 *
 * @param rotation Normalised page rotation.
 * @param width    Page width in **user** space (`page.getSize().width`).
 * @param height   Page height in **user** space.
 * @param x        Target x in **display** space, from the display left edge.
 * @param y        Target y in **display** space, up from the display bottom edge.
 *
 * Derived from the corners. At 90° the page turns clockwise, so the unrotated
 * bottom-left corner `(0, 0)` ends up at the display's *top*-left — which is why
 * the axes swap and one of them inverts rather than both simply shifting.
 */
export function displayToUser(
  rotation: Rotation,
  width: number,
  height: number,
  x: number,
  y: number
): { x: number; y: number } {
  switch (rotation) {
    case 90:
      return { x: width - y, y: x };
    case 180:
      return { x: width - x, y: height - y };
    case 270:
      return { x: y, y: height - x };
    default:
      return { x, y };
  }
}

/**
 * The text rotation that renders horizontally once `/Rotate` has been applied.
 *
 * The page turns content clockwise by `rotation`, and pdf-lib measures text
 * angles counter-clockwise, so text written at exactly `rotation` degrees comes
 * back to level on screen. Pass straight to pdf-lib's `degrees()`.
 */
export function uprightTextAngle(rotation: Rotation): number {
  return rotation;
}

/**
 * Insets from each edge of a box, as fractions of that box between 0 and 1.
 *
 * Fractions rather than points on purpose: the same crop then applies correctly
 * to every page of a document whose pages are not all the same size, which a
 * mixed scan very often is.
 */
export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Rewrites display-space margins into user-space margins.
 *
 * The user drags a crop rectangle on a rendered preview, so "top" means the top
 * of what they are looking at. On a rotated page that edge is not the top of the
 * PDF's own coordinate box, so each margin has to travel round the rotation with
 * the page. At 90° the visual top becomes the user-space left, and so on.
 */
export function displayToUserMargins(rotation: Rotation, m: Margins): Margins {
  switch (rotation) {
    case 90:
      return { left: m.top, right: m.bottom, bottom: m.left, top: m.right };
    case 180:
      return { left: m.right, right: m.left, bottom: m.top, top: m.bottom };
    case 270:
      return { left: m.bottom, right: m.top, bottom: m.right, top: m.left };
    default:
      return { ...m };
  }
}
