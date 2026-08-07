/**
 * Lazy loaders for the browser-side PDF engines.
 *
 * The PDF tools do all their work on the client, so pdf-lib (~420 kB),
 * pdfjs-dist (~330 kB of worker on top of the main library) and JSZip (~96 kB)
 * have to reach the browser eventually. But none of them are needed to *render*
 * a tool page, and most visitors who land on one never process a file at all.
 * Importing them statically put roughly 850 kB of parse-and-compile work on the
 * critical path of pages whose visible content is a heading and a drop zone.
 *
 * These helpers move that cost behind a dynamic import with a two-stage
 * strategy:
 *
 *   1. **Warm** on file selection. Once someone picks a file they have
 *      committed to the action, so we start the fetch immediately — by the time
 *      they reach for the button the bytes are usually already parsed.
 *   2. **Await** at the point of use. If the network was slow the button still
 *      works; it just waits behind the existing spinner instead of throwing.
 *
 * Each loader memoises its promise, so warming is idempotent and concurrent
 * callers share a single fetch.
 */

type PdfLib = typeof import('pdf-lib');
type PdfCrypto = typeof import('@cantoo/pdf-lib');
type PdfJs = typeof import('pdfjs-dist');
type JsZipCtor = typeof import('jszip').default;

let pdfLibPromise: Promise<PdfLib> | null = null;

/** `pdf-lib` — used by every tool that writes a PDF. */
export function loadPdfLib(): Promise<PdfLib> {
  pdfLibPromise ??= import('pdf-lib');
  return pdfLibPromise;
}

let pdfCryptoPromise: Promise<PdfCrypto> | null = null;

/**
 * `@cantoo/pdf-lib` — a maintained fork of pdf-lib that can read and write
 * encrypted PDFs. Only the Lock and Unlock tools need it.
 *
 * Upstream pdf-lib has no encryption support at all and no plans for it, so
 * those two tools are impossible without a second engine. It is a superset of
 * the API, so replacing pdf-lib with it everywhere would have worked — and that
 * is exactly why it is worth being deliberate about not doing so: the fork is
 * **272 kB gzipped against pdf-lib's 206 kB**, so a site-wide swap would put an
 * extra 66 kB on all thirteen other tools to serve two. Loading it from here
 * instead means only the two pages that need encryption ever pay for it, and
 * the rest of the catalogue is untouched by the decision.
 */
export function loadPdfCrypto(): Promise<PdfCrypto> {
  pdfCryptoPromise ??= import('@cantoo/pdf-lib');
  return pdfCryptoPromise;
}

let jsZipPromise: Promise<JsZipCtor> | null = null;

/** `JSZip` constructor — only needed when a tool emits more than one file. */
export function loadJsZip(): Promise<JsZipCtor> {
  jsZipPromise ??= import('jszip').then((m) => m.default ?? (m as unknown as JsZipCtor));
  return jsZipPromise;
}

let pdfJsPromise: Promise<PdfJs> | null = null;

/**
 * `pdfjs-dist`, with its worker wired up.
 *
 * The worker is pulled in as a `?url` import *inside* the dynamic chunk so the
 * 330 kB worker file is never even referenced by the page until rendering
 * actually starts.
 */
export function loadPdfJs(): Promise<PdfJs> {
  pdfJsPromise ??= (async () => {
    const [pdfjsLib, workerUrl] = await Promise.all([
      import('pdfjs-dist'),
      // @ts-ignore — Vite resolves `?url` to the emitted asset path.
      import('pdfjs-dist/build/pdf.worker.mjs?url').then((m) => m.default as string),
    ]);
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    return pdfjsLib;
  })();
  return pdfJsPromise;
}
