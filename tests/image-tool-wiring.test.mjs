/**
 * Every image tool page is wired to the module that drives it.
 *
 * ## The failure this exists to catch
 *
 * Each `mount*` function looks its elements up by id and returns early if any
 * one of them is missing:
 *
 *     if (!dropZone || !fileInput || ... ) return;
 *
 * That guard is right — a half-wired page should not throw on every keystroke —
 * but it means a single mistyped id produces a page that looks completely
 * normal, renders every control, and does nothing at all when you press the
 * button. No console error, no failing build, no clue. With four tools across
 * two locales that is eight chances to ship a dead page, and the SEO
 * verification would pass every one of them because the markup is fine.
 *
 * ## Why the id list is not written down here
 *
 * A hand-maintained list of expected ids drifts the moment someone adds a
 * control, and a stale checklist is worse than none because it reads as
 * coverage. So the ids are read out of the UI modules themselves: whatever the
 * module calls `getElementById` on is exactly what the page has to contain.
 * Adding a control to a tool extends this test automatically, and adding a whole
 * new tool extends it as soon as the tool is in the catalogue.
 *
 * The handful of structural selectors below are the exception — they are built
 * from template strings in `image-crop-box.ts` (`input[data-crop="${field}"]`)
 * and cannot be recovered by reading the source, so they are listed explicitly.
 *
 * Runs against `dist/`, so it belongs after the build alongside
 * `deferred-scripts.test.mjs`, not in `test:unit`.
 *
 * Run with: npm test
 */
import { readFileSync, existsSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { imageTools } from '../src/data/image-tools.ts';

let pass = 0;
let fail = 0;
const check = (name, cond, detail = '') => {
  cond ? pass++ : fail++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond || !detail ? '' : ` — ${detail}`}`);
};

/**
 * `compress-image` → `src/lib/image-compress-ui.ts`.
 *
 * The convention is the section's, not this test's: every tool page imports
 * exactly one `mount*` from a module named this way.
 */
const uiModuleFor = (slug) => `src/lib/image-${slug.replace(/-image$/, '')}-ui.ts`;

/** Literal ids the module will look up, plus those in the modules it imports. */
function requiredIds(entry, seen = new Set()) {
  if (seen.has(entry) || !existsSync(entry)) return new Set();
  seen.add(entry);
  const source = readFileSync(entry, 'utf8');
  const ids = new Set([...source.matchAll(/getElementById\(\s*'([^']+)'\s*\)/g)].map((m) => m[1]));

  // One level down: `image-crop-ui.ts` delegates its stage to
  // `image-crop-box.ts`, and that module's lookups are just as fatal.
  for (const [, spec] of source.matchAll(/from\s+'\.\/(image-[\w-]+)'/g)) {
    for (const id of requiredIds(`src/lib/${spec}.ts`, seen)) ids.add(id);
  }
  return ids;
}

/** Selectors built from template strings, which cannot be read out of source. */
const STRUCTURAL = {
  'crop-image': [
    ['[data-stage]', 1],
    ['[data-rect]', 1],
    ['[data-handle]', 4],
    ['input[data-crop="x"]', 1],
    ['input[data-crop="y"]', 1],
    ['input[data-crop="w"]', 1],
    ['input[data-crop="h"]', 1],
  ],
  'resize-image': [
    // Every mode's field group must exist, or switching mode reveals nothing.
    ['[data-field="longest"]', 1],
    ['[data-field="width"]', 1],
    ['[data-field="height"]', 1],
    ['[data-field="percent"]', 1],
    ['[data-field="exact"]', 1],
    ['[data-field="lock"]', 1],
  ],
};

check('the catalogue is not empty, or this test proves nothing', imageTools.length > 0);

for (const tool of imageTools) {
  const modulePath = uiModuleFor(tool.slug);
  check(`${tool.slug}: the UI module exists where the convention says`, existsSync(modulePath), modulePath);

  const ids = requiredIds(modulePath);
  check(`${tool.slug}: its module actually looks elements up`, ids.size > 0);

  for (const prefix of ['', '/en']) {
    const page = `dist${prefix}/image-tools/${tool.slug}/index.html`;
    if (!existsSync(page)) {
      check(`${tool.slug}${prefix || '/ar'}: page was built`, false, page);
      continue;
    }
    const doc = new JSDOM(readFileSync(page, 'utf8')).window.document;

    const missing = [...ids].filter((id) => !doc.getElementById(id));
    check(
      `${tool.slug}${prefix || '/ar'}: all ${ids.size} elements the module needs are present`,
      missing.length === 0,
      `missing ${missing.join(', ')}`
    );

    const shortfall = (STRUCTURAL[tool.slug] ?? [])
      .filter(([sel, n]) => doc.querySelectorAll(sel).length < n)
      .map(([sel]) => sel);
    check(
      `${tool.slug}${prefix || '/ar'}: structural selectors are present`,
      shortfall.length === 0,
      `missing ${shortfall.join(', ')}`
    );

    // A page can have every id and still be inert if the script never shipped.
    check(
      `${tool.slug}${prefix || '/ar'}: a module script is actually linked`,
      doc.querySelector('script[type="module"][src]') !== null
    );

    // The accessible path out of a drag interaction is a real form control, and
    // the handles must not pretend to be one.
    for (const handle of doc.querySelectorAll('[data-handle]')) {
      check(
        `${tool.slug}${prefix || '/ar'}: crop handles stay hidden from assistive tech`,
        handle.getAttribute('aria-hidden') === 'true' && handle.tagName !== 'BUTTON'
      );
    }
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
