/**
 * One-shot codemod: replace the hand-written `related` array on every existing
 * PDF tool page with the derived chain from `src/data/pdf-tools.ts`.
 *
 * Kept in the repo as a record of exactly what was rewritten, matching the
 * convention set by `lazy-pdf-imports.mjs`. Every replacement asserts that its
 * target text was found exactly once, so a silent partial application is
 * impossible — if the pages drift, this fails loudly instead of half-editing.
 *
 * Run with: node scripts/derive-pdf-related.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Applies one replacement, throwing if the needle is missing or ambiguous. */
function sub(src, file, find, replace) {
  const first = src.indexOf(find);
  if (first === -1) throw new Error(`[${file}] pattern not found:\n${find}`);
  if (src.indexOf(find, first + 1) !== -1) throw new Error(`[${file}] pattern is ambiguous:\n${find}`);
  return src.slice(0, first) + replace + src.slice(first + find.length);
}

const slugs = [
  'merge-pdf',
  'split-pdf',
  'rotate-pdf',
  'watermark-pdf',
  'images-to-pdf',
  'pdf-to-images',
];

for (const lang of ['ar', 'en']) {
  const dir = lang === 'ar' ? 'src/pages/pdf-tools' : 'src/pages/en/pdf-tools';
  const up = lang === 'ar' ? '../..' : '../../..';

  for (const slug of slugs) {
    const file = `${dir}/${slug}.astro`;
    const path = join(root, file);
    let src = readFileSync(path, 'utf8');

    // 1. `localizedPath` was only ever used to build the related links. Once the
    //    chain is derived it becomes a dead import, so drop it from the specifier.
    src = sub(
      src,
      file,
      `import { useTranslations, localizedPath } from '${up}/i18n/utils';`,
      `import { useTranslations } from '${up}/i18n/utils';\nimport { relatedPdfTools } from '${up}/data/pdf-tools';`
    );

    // 2. Swap the literal array for the derived call. The array is always two
    //    entries followed by `];`, so match from `const related = [` to that.
    const start = src.indexOf('const related = [');
    if (start === -1) throw new Error(`[${file}] no related array`);
    const end = src.indexOf('];', start);
    if (end === -1) throw new Error(`[${file}] unterminated related array`);
    src = src.slice(0, start) + `const related = relatedPdfTools(lang, '${slug}');` + src.slice(end + 2);

    writeFileSync(path, src);
    console.log(`rewrote ${file}`);
  }
}

console.log(`\n${slugs.length * 2} pages now derive their related links from the catalogue.`);
