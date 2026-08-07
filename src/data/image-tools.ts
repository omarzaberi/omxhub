import type { Lang } from '../i18n/ui';

/**
 * The image tool catalogue — single source of truth, mirroring `pdf-tools.ts`.
 *
 * The PDF catalogue exists because the same list was previously maintained by
 * hand in four places and drifted. This file starts in the shape that one
 * arrived at, so the image section never has to be rescued the same way.
 *
 * **Order is meaningful.** `relatedImageTools` walks this array and wraps
 * around, so each tool links to the next few and is linked from the previous
 * few — a closed crawl chain with no orphan and no dead end. Insert new tools
 * next to their conceptual neighbours rather than appending.
 *
 * **Only shipped tools belong here.** The hub grid and the sitemap are both
 * generated from this array, so a placeholder entry would publish a link to a
 * page that does not exist. Planned tools live in `IDEAS.md` until they ship.
 */
export interface ImageTool {
  /** URL segment — the page lives at `/image-tools/<slug>`. */
  slug: string;
  icon: string;
  /** Short label used in grids, related pills and breadcrumbs. */
  name: Record<Lang, string>;
  /** One-line description for the hub grid. Not the page meta description. */
  desc: Record<Lang, string>;
}

export const imageTools: readonly ImageTool[] = [
  {
    slug: 'compress-image',
    icon: '🗜️',
    name: { ar: 'ضغط الصور', en: 'Compress Image' },
    desc: {
      ar: 'صغّر حجم صورك بدون ما تخسر وضوحها، وكل شي داخل متصفحك',
      en: 'Shrink your images without visibly losing quality, entirely in your browser',
    },
  },
];

export function imageToolPath(slug: string): string {
  return `/image-tools/${slug}`;
}

export function getImageTool(slug: string): ImageTool {
  const tool = imageTools.find((t) => t.slug === slug);
  if (!tool) throw new Error(`Unknown image tool slug: ${slug}`);
  return tool;
}

/**
 * The next `count` tools after `slug`, wrapping around the catalogue.
 *
 * While the section is small this legitimately returns fewer than `count` — with
 * one tool live it returns none, and the layout falls back to a link across to
 * the PDF section rather than rendering an empty band. That is why the count is
 * clamped here instead of the caller padding the list with repeats.
 */
export function relatedImageTools(
  lang: Lang,
  slug: string,
  count = 3
): { label: string; href: string }[] {
  const start = imageTools.findIndex((t) => t.slug === slug);
  if (start === -1) throw new Error(`Unknown image tool slug: ${slug}`);
  const total = imageTools.length;
  const take = Math.min(count, total - 1);
  return Array.from({ length: take }, (_, i) => {
    const tool = imageTools[(start + i + 1) % total];
    return {
      label: tool.name[lang],
      href: lang === 'ar' ? imageToolPath(tool.slug) : `/en${imageToolPath(tool.slug)}`,
    };
  });
}
