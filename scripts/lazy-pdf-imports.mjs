/**
 * One-shot codemod: convert the PDF tool pages from static to lazy imports.
 *
 * Kept in the repo as a record of exactly what was rewritten. Every replacement
 * asserts that its target text was found, so a silent partial application is
 * impossible — if the pages drift, this fails loudly instead of half-editing.
 *
 * Run with: node scripts/lazy-pdf-imports.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Applies one replacement, throwing if the needle is missing or ambiguous. */
function sub(src, file, find, replace) {
  const first = src.indexOf(find);
  if (first === -1) throw new Error(`[${file}] pattern not found:\n${find}`);
  if (src.indexOf(find, first + 1) !== -1) {
    throw new Error(`[${file}] pattern is ambiguous (matches more than once):\n${find}`);
  }
  return src.slice(0, first) + replace + src.slice(first + find.length);
}

const WARM_COMMENT = `    // Choosing a file is a commitment to the action, so start fetching the
    // engine now. It is normally parsed and ready before the button is pressed.`;

/** Per-tool edits. \`rel\` is substituted with the correct relative import path. */
const tools = {
  'merge-pdf': (s, f, rel) => {
    s = sub(s, f, `  import { PDFDocument } from 'pdf-lib';`, `  import { loadPdfLib } from '${rel}';`);
    s = sub(
      s,
      f,
      `      if (f.type === 'application/pdf') files.push(f);
    }
    renderFileList();`,
      `      if (f.type === 'application/pdf') files.push(f);
    }
    renderFileList();
${WARM_COMMENT}
    void loadPdfLib();`
    );
    return sub(
      s,
      f,
      `      const merged = await PDFDocument.create();`,
      `      const { PDFDocument } = await loadPdfLib();
      const merged = await PDFDocument.create();`
    );
  },

  'images-to-pdf': (s, f, rel) => {
    s = sub(s, f, `  import { PDFDocument } from 'pdf-lib';`, `  import { loadPdfLib } from '${rel}';`);
    s = sub(
      s,
      f,
      `      if (f.type === 'image/jpeg' || f.type === 'image/png') files.push(f);
    }
    renderFileList();`,
      `      if (f.type === 'image/jpeg' || f.type === 'image/png') files.push(f);
    }
    renderFileList();
${WARM_COMMENT}
    void loadPdfLib();`
    );
    return sub(
      s,
      f,
      `      const doc = await PDFDocument.create();`,
      `      const { PDFDocument } = await loadPdfLib();
      const doc = await PDFDocument.create();`
    );
  },

  'rotate-pdf': (s, f, rel) => {
    s = sub(s, f, `  import { PDFDocument, degrees } from 'pdf-lib';`, `  import { loadPdfLib } from '${rel}';`);
    s = sub(
      s,
      f,
      `  async function loadFile(f: File) {
    currentFile = f;`,
      `  async function loadFile(f: File) {
    currentFile = f;
${WARM_COMMENT}
    void loadPdfLib();`
    );
    return sub(
      s,
      f,
      `    try {
      const bytes = await currentFile.arrayBuffer();`,
      `    try {
      const { PDFDocument, degrees } = await loadPdfLib();
      const bytes = await currentFile.arrayBuffer();`
    );
  },

  'watermark-pdf': (s, f, rel) => {
    s = sub(
      s,
      f,
      `  import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';`,
      `  import { loadPdfLib } from '${rel}';`
    );
    s = sub(
      s,
      f,
      `  async function loadFile(f: File) {
    currentFile = f;`,
      `  async function loadFile(f: File) {
    currentFile = f;
${WARM_COMMENT}
    void loadPdfLib();`
    );
    return sub(
      s,
      f,
      `    try {
      const bytes = await currentFile.arrayBuffer();`,
      `    try {
      const { PDFDocument, StandardFonts, rgb, degrees } = await loadPdfLib();
      const bytes = await currentFile.arrayBuffer();`
    );
  },

  'split-pdf': (s, f, rel) => {
    s = sub(
      s,
      f,
      `  import { PDFDocument } from 'pdf-lib';
  // @ts-ignore
  import JSZip from 'jszip';`,
      `  import { loadPdfLib, loadJsZip } from '${rel}';`
    );
    // This tool needs pdf-lib immediately on selection to read the page count,
    // so the "warm" here is a real await rather than a fire-and-forget.
    s = sub(
      s,
      f,
      `    currentFile = f;
    const bytes = await f.arrayBuffer();
    const doc = await PDFDocument.load(bytes);`,
      `    currentFile = f;
    // Splitting needs the page count up front, so this one awaits the engine
    // rather than merely warming it. JSZip is warmed in parallel because the
    // "all pages" mode will need it a moment later.
    const [{ PDFDocument }, bytes] = await Promise.all([loadPdfLib(), f.arrayBuffer()]);
    void loadJsZip();
    const doc = await PDFDocument.load(bytes);`
    );
    s = sub(
      s,
      f,
      `      const bytes = await currentFile.arrayBuffer();
      const srcDoc = await PDFDocument.load(bytes);`,
      `      const { PDFDocument } = await loadPdfLib();
      const bytes = await currentFile.arrayBuffer();
      const srcDoc = await PDFDocument.load(bytes);`
    );
    return sub(
      s,
      f,
      `        const zip = new JSZip();`,
      `        const JSZip = await loadJsZip();
        const zip = new JSZip();`
    );
  },

  'pdf-to-images': (s, f, rel) => {
    s = sub(
      s,
      f,
      `  import * as pdfjsLib from 'pdfjs-dist';
  // @ts-ignore
  import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
  // @ts-ignore
  import JSZip from 'jszip';

  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;`,
      `  // The worker wiring lives in the loader so the 330 kB worker asset is not
  // even referenced by this page until a render actually starts.
  import { loadPdfJs, loadJsZip } from '${rel}';`
    );
    s = sub(
      s,
      f,
      `  async function loadFile(f: File) {
    currentFile = f;`,
      `  async function loadFile(f: File) {
    currentFile = f;
${WARM_COMMENT}
    void loadPdfJs();`
    );
    s = sub(
      s,
      f,
      `      const bytes = await currentFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;`,
      `      const pdfjsLib = await loadPdfJs();
      const bytes = await currentFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;`
    );
    return sub(
      s,
      f,
      `        const zip = new JSZip();`,
      `        const JSZip = await loadJsZip();
        const zip = new JSZip();`
    );
  },
};

const locales = [
  { dir: 'src/pages/pdf-tools', rel: '../../lib/pdf-libs' },
  { dir: 'src/pages/en/pdf-tools', rel: '../../../lib/pdf-libs' },
];

let count = 0;
for (const { dir, rel } of locales) {
  for (const [tool, transform] of Object.entries(tools)) {
    const path = join(root, dir, `${tool}.astro`);
    const before = readFileSync(path, 'utf8');
    const after = transform(before, `${dir}/${tool}.astro`, rel);
    if (after === before) throw new Error(`[${dir}/${tool}] transform was a no-op`);
    writeFileSync(path, after);
    console.log(`rewrote ${dir}/${tool}.astro`);
    count++;
  }
}
console.log(`\n${count} files rewritten.`);
