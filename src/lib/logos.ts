/**
 * Tool logo lookup.
 *
 * Cards and detail pages used to render two-letter initials because we had no
 * logo assets. Now that `public/logos/` exists, every surface resolves through
 * here so there is exactly one place to register a new file — and exactly one
 * fallback (the old initials chip) for tools whose logo we do not have yet.
 *
 * Lookups are normalised, so `"GitHub Copilot"`, `"github-copilot"` and
 * `"githubcopilot"` all resolve to the same asset. That matters because cards
 * pass a slug while comparisons only carry a display name.
 */

/** Normalise a slug or display name down to a comparable key. */
const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Canonical slug (or display name) → filename in `public/logos/`.
 *
 * Filenames are kept exactly as downloaded rather than renamed, so re-fetching
 * an updated icon from the same source is a straight overwrite.
 */
const FILES: Record<string, string> = {
  'adobe-firefly': 'adobe-firefly-ai-icon.svg',
  'canva-ai': 'canva-icon.svg',
  chatgpt: 'chatgpt-icon.svg',
  claude: 'claude-ai-icon.svg',
  cursor: 'cursor-ai-code-icon.svg',
  deepseek: 'deepseek-logo-icon.svg',
  elevenlabs: 'elevenlabs.svg',
  flux: 'flux-ai-icon.svg',
  gemini: 'google-gemini-icon.svg',
  'github-copilot': 'githubcopilot.svg',
  grammarly: 'grammarly-icon.svg',
  grok: 'grok-icon.svg',
  jasper: 'jasper-icon.svg',
  'kling-ai': 'kling-ai-icon.svg',
  lovable: 'lovable-ai-icon.svg',
  'microsoft-copilot': 'copilot-icon.svg',
  midjourney: 'midjourney-blue-icon.svg',
  notebooklm: 'notebooklm-icon.svg',
  'notion-ai': 'notion.svg',
  perplexity: 'perplexity-ai-icon.svg',
  runway: 'runway-ai-icon.svg',
  semrush: 'semrush-icon.svg',
  suno: 'suno-ai-icon.svg',
  windsurf: 'windsurf-icon.svg',
};

/**
 * Extra spellings that should hit an entry in `FILES`.
 *
 * Comparisons store a display name (`"FLUX"`), tool pages store a slug
 * (`"flux"`), and a few brands are written differently in each place. Rather
 * than duplicate asset paths, alias the odd spellings onto the canonical slug.
 */
const ALIASES: Record<string, string> = {
  'google-gemini': 'gemini',
  'gemini-advanced': 'gemini',
  copilot: 'github-copilot',
  'notion': 'notion-ai',
  'canva': 'canva-ai',
  'firefly': 'adobe-firefly',
  'kling': 'kling-ai',
  'flux-1': 'flux',
  'elevenlabs-ai': 'elevenlabs',
  'perplexity-ai': 'perplexity',
  'chatgpt-plus': 'chatgpt',
  'claude-ai': 'claude',
};

/** Pre-normalised index, built once at module load. */
const INDEX: Record<string, string> = {};
for (const [slug, file] of Object.entries(FILES)) INDEX[key(slug)] = file;
for (const [alias, slug] of Object.entries(ALIASES)) {
  const file = FILES[slug];
  if (file) INDEX[key(alias)] = file;
}

/**
 * Public path to a tool's logo, or `null` when we have no asset for it.
 *
 * Pass the slug when you have one — it is unambiguous. The display name is
 * accepted as a second-best so comparison cards, which only carry names, still
 * resolve. Returns `null` rather than a placeholder path so callers make the
 * fallback decision explicitly instead of shipping a broken `<img>`.
 */
export function logoFor(...candidates: (string | undefined | null)[]): string | null {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const file = INDEX[key(candidate)];
    if (file) return `/logos/${file}`;
  }
  return null;
}

/** Palette for the initials fallback. Unchanged from the original cards. */
const PALETTE = ['#4fd1c5', '#9b8cfb', '#f5a623', '#34d399', '#f472b6'];

/**
 * Deterministic colour + initials for a tool with no logo asset.
 *
 * Same character-sum hash the cards shipped with, so a tool that later gains a
 * logo is the only thing that changes — everything else keeps its colour.
 */
export function initialsBadge(name: string): { color: string; initials: string } {
  const hash = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const initials = name
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return { color: PALETTE[hash % PALETTE.length], initials };
}
