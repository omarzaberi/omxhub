/**
 * Detects password-protected PDFs before an engine chokes on one.
 *
 * ## Why
 *
 * Plain pdf-lib has no decryption support, and it does not fail *cleanly* on an
 * encrypted file — it fails while parsing, with `Trying to parse invalid
 * object` and `Invalid object ref: 8 0 R`. Every tool on the site catches that
 * and shows its generic message: *"make sure the file is a valid PDF"*.
 *
 * The file is a valid PDF. It is locked. Telling someone their document is
 * broken when it is merely protected sends them off to re-export or repair a
 * file that was never damaged — the same failure as the Arabic watermark
 * message, and worth fixing the same way: check first, then say the true thing.
 *
 * Since we now ship an Unlock tool, the true thing also comes with somewhere
 * useful to go.
 */

/** How much of the tail to scan. The trailer lives at the end of the file. */
const TAIL_BYTES = 4096;

/**
 * Whether `bytes` looks like an encrypted PDF.
 *
 * The `/Encrypt` key lives in the trailer dictionary, so we read the tail rather
 * than the whole buffer: a large scan is tens of megabytes, and searching all of
 * it would also raise the chance of matching the literal text `/Encrypt` inside
 * a content or metadata stream, which would be a false positive.
 *
 * Linearised files carry a second trailer at the front, so the head is checked
 * too — still far cheaper than a full scan, and it catches the case where the
 * cross-reference table has been rewritten to the beginning.
 */
export function looksEncrypted(bytes: ArrayBuffer | Uint8Array): boolean {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const decoder = new TextDecoder('latin1');
  const head = decoder.decode(view.subarray(0, Math.min(TAIL_BYTES, view.length)));
  if (head.includes('/Encrypt')) return true;
  const tail = decoder.decode(view.subarray(Math.max(0, view.length - TAIL_BYTES)));
  return tail.includes('/Encrypt');
}

/**
 * The id of the notice `PdfToolLayout` renders, hidden, on every tool page.
 *
 * The copy has to be bilingual, and a client bundle must not import
 * `src/i18n/ui.ts` — that would ship both languages' entire dictionary to every
 * visitor, the same trap `pdf-page-grid.ts` avoids. Rendering the notice from
 * the layout, which already knows the language, means the message exists in the
 * HTML in the right language and the guard below is one line on every page
 * rather than a paragraph of duplicated copy on each.
 */
const NOTICE_ID = 'encrypted-notice';

/**
 * Reveals the "this file is password-protected" notice, if the page has one.
 *
 * @returns whether the notice was shown, so callers can `return` on it.
 */
export function showEncryptedNotice(): boolean {
  const notice = document.getElementById(NOTICE_ID);
  if (!notice) return false;
  notice.hidden = false;
  // Suppress whatever the page was about to say. The guard runs after the
  // spinner is already up, and leaving a "make sure the file is valid" message
  // next to "there is nothing wrong with your file" would contradict itself.
  const status = document.getElementById('status');
  if (status) status.hidden = true;
  notice.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  return true;
}

/**
 * One-line guard for a tool page: shows the notice and reports whether to stop.
 *
 * ```ts
 * const bytes = await file.arrayBuffer();
 * if (guardEncrypted(bytes)) return;
 * ```
 */
export function guardEncrypted(bytes: ArrayBuffer | Uint8Array): boolean {
  if (!looksEncrypted(bytes)) return false;
  showEncryptedNotice();
  return true;
}
