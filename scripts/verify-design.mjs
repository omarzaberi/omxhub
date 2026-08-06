/**
 * Design-equivalence proof.
 *
 * Normalises away the three changes we intended to make, then asserts the
 * remaining CSS is identical. Anything left over is an unintended visual change.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function css(d, f) {
  const h = readFileSync(join(d, f), 'utf8');
  let o = '';
  for (const m of h.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) o += m[1];
  for (const m of h.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)) {
    const p = join(d, m[1].slice(1));
    if (existsSync(p)) o += readFileSync(p, 'utf8');
  }
  return o;
}

/** Undo the three intended edits so only unintended drift survives. */
function normalise(text) {
  return text
    // 1. metric-matched fallback @font-face blocks
    .replace(/@font-face\s*\{[^}]*?['"][^'"]+ Fallback['"][^}]*\}/g, '')
    // 2. fallback families appended to font stacks
    .replace(/,\s*(?:'|")?(?:Inter|Space Grotesk|JetBrains Mono) Fallback(?:'|")?/g, '')
    // 3. the counter CLS reservation
    .replace(/font-variant-numeric:\s*tabular-nums;?/g, '')
    .replace(/(\.stat-num\[[^\]]*\]\{[^}]*?)text-align:center;?/g, '$1')
    .replace(/(\.stat-num\[[^\]]*\]\{[^}]*?);?display:inline-block/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/;\}/g, '}');
}

function rules(t) {
  return new Set(normalise(t).split(/(?<=\})/).map((r) => r.trim()).filter(Boolean));
}

const pages = ['index.html', 'en/index.html', 'ai-tools/index.html', 'comparisons/chatgpt-vs-claude/index.html',
  'pdf-tools/merge-pdf/index.html', 'pdf-tools/pdf-to-images/index.html', 'prompts/index.html', 'support/index.html'];

let drift = 0;
for (const p of pages) {
  const b = rules(css('base/dist', p)), a = rules(css('build/dist', p));
  const added = [...a].filter((r) => !b.has(r));
  const removed = [...b].filter((r) => !a.has(r));
  if (added.length || removed.length) {
    drift += added.length + removed.length;
    console.log(`\nDRIFT in ${p}:`);
    added.forEach((r) => console.log('  + ' + r.slice(0, 200)));
    removed.forEach((r) => console.log('  - ' + r.slice(0, 200)));
  }
}
console.log(drift === 0
  ? `\n✓ ${pages.length} pages: CSS is identical once the 3 intended changes are normalised away — zero visual drift.`
  : `\n✗ ${drift} unintended CSS differences.`);
