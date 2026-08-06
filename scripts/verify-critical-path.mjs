// Measures the *critical path*: bytes and requests the browser must fetch,
// parse and execute before it can paint, per page.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const pages = [
  ['AR home',        'index.html'],
  ['EN home',        'en/index.html'],
  ['AR tools index', 'ai-tools/index.html'],
  ['AR comparison',  'comparisons/chatgpt-vs-claude/index.html'],
  ['AR merge-pdf',   'pdf-tools/merge-pdf/index.html'],
  ['AR pdf->images', 'pdf-tools/pdf-to-images/index.html'],
];

function analyse(dist, file) {
  const html = readFileSync(join(dist, file), 'utf8');
  const gz = (s) => gzipSync(Buffer.from(s)).length;

  // Render-blocking: sync <script src>, and <link rel=stylesheet>.
  const sheets = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map((m) => m[1]);
  const scripts = [...html.matchAll(/<script([^>]*)\ssrc="([^"]+)"/g)]
    .map((m) => ({ attrs: m[1], src: m[2] }));

  // Everything a module script pulls in transitively is still fetched eagerly.
  const seen = new Set();
  let eagerJs = 0;
  const walk = (src) => {
    if (!src.startsWith('/') || seen.has(src)) return;
    seen.add(src);
    const p = join(dist, src.slice(1));
    if (!existsSync(p)) return;
    const code = readFileSync(p, 'utf8');
    eagerJs += Buffer.byteLength(code);
    // static imports only — dynamic import() is lazy by definition
    for (const m of code.matchAll(/(?:^|[};])\s*import\s*(?:[^"';]*?from\s*)?["']([^"']+)["']/g)) {
      const spec = m[1];
      if (spec.startsWith('./')) walk('/_astro/' + spec.slice(2));
      else if (spec.startsWith('/')) walk(spec);
    }
  };
  const localScripts = scripts.filter((s) => s.src.startsWith('/'));
  localScripts.forEach((s) => walk(s.src));

  let cssBytes = 0;
  for (const h of sheets) {
    const p = join(dist, h.slice(1));
    if (existsSync(p)) cssBytes += Buffer.byteLength(readFileSync(p, 'utf8'));
  }

  const thirdParty = scripts.filter((s) => s.src.startsWith('http'));
  const blockingThirdParty = thirdParty.filter((s) => !/\basync\b|\bdefer\b/.test(s.attrs));

  return {
    htmlGz: gz(html),
    blockingSheets: sheets.length,
    cssBytes,
    eagerJs,
    thirdParty: thirdParty.length,
    blockingThirdParty: blockingThirdParty.length,
    // total bytes the browser must pull before it is idle at first render
    criticalBytes: gz(html) + cssBytes + eagerJs,
  };
}

const rows = [];
for (const [label, file] of pages) {
  const b = analyse(process.argv[2], file);
  const a = analyse(process.argv[3], file);
  rows.push({ label, b, a });
}

const pad = (s, n) => String(s).padEnd(n);
const num = (n) => (n / 1024).toFixed(1) + 'kB';
console.log(pad('PAGE', 16), pad('CSS REQ', 9), pad('3P SCRIPTS', 12), pad('EAGER JS', 20), 'CRITICAL BYTES');
console.log('-'.repeat(86));
for (const { label, b, a } of rows) {
  const delta = b.criticalBytes ? (((a.criticalBytes - b.criticalBytes) / b.criticalBytes) * 100).toFixed(0) : '0';
  console.log(
    pad(label, 16),
    pad(`${b.blockingSheets} -> ${a.blockingSheets}`, 9),
    pad(`${b.thirdParty} -> ${a.thirdParty}`, 12),
    pad(`${num(b.eagerJs)} -> ${num(a.eagerJs)}`, 20),
    `${num(b.criticalBytes)} -> ${num(a.criticalBytes)}  (${delta}%)`
  );
}
