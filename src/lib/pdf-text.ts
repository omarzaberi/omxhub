/**
 * Encoding guard for the tools that draw text into a PDF.
 *
 * ## Why this is needed
 *
 * pdf-lib's `StandardFonts` (Helvetica and friends) are **WinAnsi**-encoded.
 * WinAnsi is Latin-1 plus a short list of typographic extras — it has no Arabic
 * block at all. Hand `drawText` an Arabic string and pdf-lib throws.
 *
 * On an Arabic-first site that is not a hypothetical. The watermark tool shipped
 * with this defect: an Arabic watermark failed with *"make sure the file is a
 * valid PDF"*, which is both wrong and unhelpful — the file was fine, and no
 * amount of trying a different one would ever have helped. The user is left
 * blaming their document for a limitation of ours.
 *
 * So we check first and say the true thing instead.
 *
 * ## Why we do not simply embed an Arabic font
 *
 * Embedding a TTF needs `@pdf-lib/fontkit` plus a font download at runtime, and
 * it still would not be enough: pdf-lib performs no **shaping** and no **bidi**
 * reordering. Arabic would come out as disconnected letters in reverse order —
 * a worse result than a clear refusal, because it looks like it worked.
 * Real support needs a HarfBuzz-class shaper, which is a deliberate decision
 * about page weight rather than a patch. It is tracked in `IDEAS.md`.
 */

/**
 * Characters WinAnsi can encode: Latin-1, plus the handful of typographic
 * codepoints Windows-1252 maps into the 0x80–0x9F range.
 */
const WIN_ANSI = new Set(
  [
    ...Array.from({ length: 224 }, (_, i) => 32 + i), // 0x20–0xFF
    0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030,
    0x0160, 0x2039, 0x0152, 0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022,
    0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
  ].map((c) => String.fromCodePoint(c))
);

/** Tab, newline and carriage return are legal input; we simply never draw them. */
const IGNORED = new Set(['\t', '\n', '\r']);

/**
 * The distinct characters in `text` that a standard font cannot draw.
 *
 * Returns them in the order they first appear so the caller can show the user
 * exactly which characters are the problem, rather than a vague refusal.
 * An empty array means the string is safe to pass to `drawText`.
 */
export function unsupportedChars(text: string): string[] {
  const bad: string[] = [];
  const seen = new Set<string>();
  // Iterating the string yields whole code points, so astral characters such as
  // emoji are reported as one character rather than two broken halves.
  for (const ch of text) {
    if (WIN_ANSI.has(ch) || IGNORED.has(ch) || seen.has(ch)) continue;
    seen.add(ch);
    bad.push(ch);
  }
  return bad;
}

/** Whether every character in `text` can be drawn with a standard font. */
export function isDrawable(text: string): boolean {
  return unsupportedChars(text).length === 0;
}
