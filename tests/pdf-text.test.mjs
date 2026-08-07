/**
 * Unit tests for the WinAnsi guard in `src/lib/pdf-text.ts`.
 *
 * The guard exists to replace a wrong error message with a true one, so the
 * thing worth pinning is its *judgement*: it must not reject text the standard
 * fonts can draw (that would block a working watermark for no reason), and it
 * must not accept text they cannot (which puts the misleading "your PDF is
 * broken" message straight back).
 *
 * Run with: npm test
 */
import { unsupportedChars, isDrawable } from '../src/lib/pdf-text.ts';

let pass = 0;
let fail = 0;
const check = (name, cond) => {
  cond ? pass++ : fail++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
};

// ------------------------------------------------- what must be accepted

check('plain ASCII', isDrawable('OMXHub'));
check('the default watermark', isDrawable('Draft'));
check('digits and punctuation', isDrawable('Page 3 of 12 — 2026/08/07 (v1.2)'));
check('the full printable ASCII range', isDrawable(
  Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('')
));
check('Latin-1 accents', isDrawable('Café Müller — Ångström, naïve façade'));
check('the Windows-1252 typographic extras', isDrawable('“curly” ‘quotes’ — dash… €50 ™'));
check('an empty string', isDrawable(''));
check('tabs and newlines are tolerated, not reported', isDrawable('a\tb\nc\r'));

// ------------------------------------------------- what must be rejected

check('Arabic is rejected', !isDrawable('سري'));
check('a single Arabic letter is rejected', !isDrawable('م'));
check('mixed Latin and Arabic is rejected', !isDrawable('Draft مسودة'));
check('Arabic-Indic digits are rejected', !isDrawable('١٢٣'));
check('CJK is rejected', !isDrawable('机密'));
check('Cyrillic is rejected', !isDrawable('Черновик'));
check('emoji are rejected', !isDrawable('draft 🔒'));

// ------------------------------------------------- what gets reported

check(
  'the reported characters are the offending ones only',
  unsupportedChars('Draft مسودة').join('') === 'مسودة'
);
check(
  'each distinct character is reported once, in order of appearance',
  unsupportedChars('سسسري').join('') === 'سري'
);
check('drawable text reports nothing', unsupportedChars('Confidential').length === 0);
check(
  'an emoji is reported as one character, not two broken halves',
  unsupportedChars('🔒').length === 1
);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
