/**
 * Tests for encryption detection and the Lock / Unlock round trip.
 *
 * Two jobs here.
 *
 * The first is `looksEncrypted`, which decides whether a user gets a true
 * message or a false one. A false negative puts back the bug it exists to fix
 * ("make sure the file is a valid PDF" about a perfectly good file); a false
 * positive is worse, sending someone to the Unlock tool with a document that was
 * never locked. Both directions are checked against real files.
 *
 * The second is the encryption behaviour the tool pages depend on, including the
 * two caveats we chose to ship and document rather than hide:
 *
 *   1. `@cantoo/pdf-lib` produces **AES-128**, not AES-256. Asserted here so the
 *      day the library gains AES-256, this test fails and the FAQ gets updated
 *      instead of quietly going stale.
 *   2. Decrypting and re-saving is **not** enough to remove a password — the
 *      security handler survives. Copying pages into a fresh document is the
 *      only approach that works, which is exactly why bookmarks and form fields
 *      are lost. That is pinned so nobody "simplifies" it back into a bug.
 *
 * Run with: npm test
 */
import { PDFDocument as CryptoDoc, StandardFonts } from '@cantoo/pdf-lib';
import { PDFDocument as PlainDoc } from 'pdf-lib';
import { looksEncrypted } from '../src/lib/pdf-encrypted.ts';

let pass = 0;
let fail = 0;
const check = (name, cond, detail = '') => {
  cond ? pass++ : fail++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond || !detail ? '' : ` — ${detail}`}`);
};

const PASSWORD = 'correct horse battery staple';

async function makeDoc(pages = 3) {
  const doc = await CryptoDoc.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++) {
    doc.addPage([595, 842]).drawText(`Confidential page ${i + 1}`, { x: 50, y: 700, size: 14, font });
  }
  return doc;
}

const plainBytes = await (await makeDoc()).save();

const locked = await makeDoc();
locked.encrypt({
  userPassword: PASSWORD,
  ownerPassword: PASSWORD,
  permissions: { printing: 'highResolution' },
});
const lockedBytes = await locked.save();

// ------------------------------------------------- detection

check('an ordinary PDF is not flagged', !looksEncrypted(plainBytes));
check('an encrypted PDF is flagged', looksEncrypted(lockedBytes));
check('detection works on a Uint8Array', looksEncrypted(new Uint8Array(lockedBytes)));
check(
  'detection works on a raw ArrayBuffer',
  looksEncrypted(new Uint8Array(lockedBytes).buffer)
);
check('an empty buffer is not flagged', !looksEncrypted(new Uint8Array(0)));
check('a non-PDF is not flagged', !looksEncrypted(new TextEncoder().encode('hello world')));

// A large file must not defeat the tail scan — the trailer is what matters, and
// it stays at the end however big the document gets.
{
  const big = await CryptoDoc.create();
  const font = await big.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < 120; i++) {
    const page = big.addPage([595, 842]);
    for (let l = 0; l < 40; l++) {
      page.drawText(`page ${i} line ${l} ${'padding '.repeat(8)}`, { x: 40, y: 800 - l * 18, size: 9, font });
    }
  }
  const bigPlain = await big.save();
  big.encrypt({ userPassword: 'x', ownerPassword: 'x' });
  const bigLocked = await big.save();
  check('a large unencrypted document is not flagged', !looksEncrypted(bigPlain), `${bigPlain.length} bytes`);
  check('a large encrypted document is still flagged', looksEncrypted(bigLocked), `${bigLocked.length} bytes`);
}

// ------------------------------------------------- lock

check('locking produces a different file', lockedBytes.length !== plainBytes.length);

{
  const text = Buffer.from(lockedBytes).toString('latin1');
  check('the file carries a standard security handler', text.includes('/Filter /Standard'));
  // Documented limitation. If this ever fails, the library gained AES-256 and
  // the FAQ on the Lock page is now wrong.
  check('encryption is AES-128 (V4 / R4 / AESV2), as documented', /\/V 4\b/.test(text) && /\/CFM \/AESV2/.test(text));
  check('it is NOT AES-256 — the FAQ says so on purpose', !/\/CFM \/AESV3/.test(text));
}

// ------------------------------------------------- opening a locked file

{
  let openedWithout = false;
  try { await CryptoDoc.load(lockedBytes); openedWithout = true; } catch {}
  check('a locked file will not open without a password', !openedWithout);

  let openedWrong = false;
  try { await CryptoDoc.load(lockedBytes, { password: 'wrong' }); openedWrong = true; } catch {}
  check('a wrong password is rejected', !openedWrong);

  const opened = await CryptoDoc.load(lockedBytes, { password: PASSWORD });
  check('the correct password opens it', opened.getPageCount() === 3);
}

// Plain pdf-lib — what the other thirteen tools use — cannot read it at all.
// This is the failure the notice exists to explain.
{
  let plainOpened = false;
  try { await PlainDoc.load(lockedBytes); plainOpened = true; } catch {}
  check('plain pdf-lib cannot open an encrypted file — hence the notice', !plainOpened);
}

// ------------------------------------------------- unlock

{
  // The approach that looks obvious and does not work. Pinned so it is not
  // "simplified" back in.
  const naive = await CryptoDoc.load(lockedBytes, { password: PASSWORD });
  const naiveOut = await naive.save();
  check(
    'decrypt-and-re-save does NOT remove the password (why copyPages is needed)',
    looksEncrypted(naiveOut)
  );

  // The approach the tool actually uses.
  const source = await CryptoDoc.load(lockedBytes, { password: PASSWORD });
  const out = await CryptoDoc.create();
  const pages = await out.copyPages(source, source.getPageIndices());
  pages.forEach((p) => out.addPage(p));
  const unlockedBytes = await out.save();

  check('copying pages produces a file with no encryption', !looksEncrypted(unlockedBytes));
  check('every page comes across', pages.length === 3);

  const reopened = await CryptoDoc.load(unlockedBytes);
  check('the unlocked file opens with no password', reopened.getPageCount() === 3);

  // And the whole point: the other tools can now read it.
  const byPlain = await PlainDoc.load(unlockedBytes);
  check('plain pdf-lib can read the unlocked file, so every other tool works on it',
    byPlain.getPageCount() === 3);
}

// Locking an already-locked file is refused by the pages up front; confirm the
// detection they rely on holds for a file that has been round-tripped.
{
  const source = await CryptoDoc.load(lockedBytes, { password: PASSWORD });
  const out = await CryptoDoc.create();
  (await out.copyPages(source, source.getPageIndices())).forEach((p) => out.addPage(p));
  out.encrypt({ userPassword: 'second', ownerPassword: 'second' });
  const relocked = await out.save();
  check('a re-locked file is detected as encrypted', looksEncrypted(relocked));
  const opened = await CryptoDoc.load(relocked, { password: 'second' });
  check('and opens with its new password', opened.getPageCount() === 3);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
