/**
 * Post-build SEO verification against the *emitted HTML*.
 *
 * `SEO.md` principle #5 is "verify for real": after any SEO-affecting change we
 * check the built output rather than trusting the source. This script encodes
 * the checks that were previously run ad hoc, so they are repeatable.
 *
 * What it asserts, for every page in `dist`:
 *
 *   1. Exactly one JSON-LD block, parsing as valid JSON, shaped as one `@graph`.
 *   2. Every `HowTo` step, `FAQPage` question and `BreadcrumbList` name that is
 *      marked up also appears in the page's *visible* text. Marking up content
 *      the user cannot see is a policy violation, not a shortcut.
 *   3. Exactly one `<h1>`.
 *   4. A self-referencing canonical, plus `hreflang` for ar / en / x-default.
 *   5. `noindex` pages are absent from the sitemap, and indexable pages present.
 *   6. No broken internal links anywhere on the site.
 *
 * Requires `npm run build` first. Run with: node scripts/verify-seo.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, posix } from 'node:path';

const DIST = 'dist';
const SITE = 'https://omxhub.com';

let pass = 0;
const failures = [];
const check = (name, cond, detail = '') => {
  if (cond) pass++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
};

// ---------------------------------------------------------------- helpers

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

/** `dist/en/pdf-tools/merge-pdf/index.html` → `/en/pdf-tools/merge-pdf` */
function routeOf(file) {
  const rel = relative(DIST, file).split(/[\\/]/).join('/');
  const path = '/' + rel.replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '');
  return path === '' ? '/' : path;
}

const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');

/** Page text with script/style stripped — i.e. what a reader actually sees. */
function visibleText(html) {
  return decode(
    html
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ');
}

/** Collects every string value under the given JSON-LD keys. */
function collect(node, keys, out = []) {
  if (Array.isArray(node)) node.forEach((n) => collect(n, keys, out));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (keys.includes(k) && typeof v === 'string') out.push(v);
      else collect(v, keys, out);
    }
  }
  return out;
}

const norm = (s) => decode(s).replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------- run

if (!existsSync(DIST)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const files = walk(DIST);
const routes = new Set(files.map(routeOf));
const sitemap = readdirSync(DIST)
  .filter((f) => /^sitemap-\d+\.xml$/.test(f))
  .map((f) => readFileSync(join(DIST, f), 'utf8'))
  .join('');

let brokenLinks = 0;
let schemaNodes = 0;

for (const file of files) {
  const html = readFileSync(file, 'utf8');
  const route = routeOf(file);
  const text = visibleText(html);
  const isNoindex = /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/.test(html);

  // 1. one h1
  const h1s = html.match(/<h1[\s>]/g) ?? [];
  check(`${route}: exactly one <h1>`, h1s.length === 1, `found ${h1s.length}`);

  // 2. canonical + hreflang
  const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1];
  check(`${route}: canonical present`, Boolean(canonical));
  if (canonical) {
    check(
      `${route}: canonical is self-referencing`,
      canonical === `${SITE}${route === '/' ? '/' : route}`,
      `got ${canonical}`
    );
  }
  const alts = [...html.matchAll(/<link[^>]+rel="alternate"[^>]+hreflang="([^"]+)"/g)].map((m) => m[1]);
  for (const lang of ['ar', 'en', 'x-default']) {
    check(`${route}: hreflang ${lang}`, alts.includes(lang));
  }

  // 3. JSON-LD: exactly one block, valid, single @graph
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (m) => m[1]
  );
  if (blocks.length === 0) {
    // 404 and other bare pages legitimately carry none.
    check(`${route}: no schema is only allowed on noindex pages`, isNoindex);
  } else {
    check(`${route}: exactly one JSON-LD block`, blocks.length === 1, `found ${blocks.length}`);
    let data;
    try {
      data = JSON.parse(blocks[0]);
      pass++;
    } catch (err) {
      failures.push(`${route}: JSON-LD does not parse — ${err.message}`);
      continue;
    }
    check(`${route}: JSON-LD uses a single @graph`, Array.isArray(data['@graph']));
    schemaNodes += data['@graph']?.length ?? 0;

    // 4. everything marked up must be visible on the page
    //
    // Two deliberate exemptions, both for things that are claims about the page
    // rather than content of it:
    //   - `HowToTool` names ("a modern web browser") state a precondition; they
    //     are not steps and were never meant to be rendered.
    //   - The position-1 breadcrumb is the site root, represented by the header
    //     logo on every page rather than by body text.
    const graph = data['@graph'] ?? [];

    for (const node of graph.filter((n) => n['@type'] === 'HowTo')) {
      for (const step of collect(node.step ?? [], ['name', 'text'])) {
        check(`${route}: HowTo step is visible`, text.includes(norm(step)), norm(step).slice(0, 60));
      }
    }
    const faq = graph.filter((n) => n['@type'] === 'FAQPage');
    for (const q of collect(faq, ['name'])) {
      check(`${route}: FAQ question is visible`, text.includes(norm(q)), norm(q).slice(0, 60));
    }
    for (const node of graph.filter((n) => n['@type'] === 'BreadcrumbList')) {
      for (const item of (node.itemListElement ?? []).slice(1)) {
        const name = norm(String(item.name ?? ''));
        check(`${route}: breadcrumb is visible`, text.includes(name), name.slice(0, 60));
      }
    }
  }

  // 5. sitemap hygiene
  const inSitemap = sitemap.includes(`<loc>${SITE}${route === '/' ? '/' : route}</loc>`);
  if (isNoindex) check(`${route}: noindex page excluded from sitemap`, !inSitemap);
  else check(`${route}: indexable page listed in sitemap`, inSitemap);

  // 6. internal links resolve
  for (const m of html.matchAll(/<a[^>]+href="(\/[^"#?]*)"/g)) {
    const href = m[1].replace(/\/$/, '') || '/';
    if (/\.[a-z0-9]{2,4}$/i.test(href)) {
      if (!existsSync(join(DIST, href))) {
        brokenLinks++;
        failures.push(`${route}: broken asset link → ${href}`);
      }
      continue;
    }
    if (!routes.has(href)) {
      brokenLinks++;
      failures.push(`${route}: broken internal link → ${href}`);
    }
  }
}
check('no broken internal links site-wide', brokenLinks === 0, `${brokenLinks} broken`);

// ---------------------------------------------------------------- report

console.log(`pages checked : ${files.length}`);
console.log(`schema nodes  : ${schemaNodes}`);
console.log(`assertions    : ${pass} passed, ${failures.length} failed`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures.slice(0, 40)) console.log(`  ✗ ${f}`);
  if (failures.length > 40) console.log(`  … and ${failures.length - 40} more`);
}
process.exit(failures.length ? 1 : 0);
