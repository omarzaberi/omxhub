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
  // Convert sits next to Compress because they are the same decision from two
  // directions — one picks the format for you, the other lets you pick it.
  {
    slug: 'convert-image',
    icon: '🔄',
    name: { ar: 'تحويل صيغة الصور', en: 'Convert Image' },
    desc: {
      ar: 'حوّل بين JPG و PNG و WebP بضغطة، والشفافية محفوظة إلا لو اخترت غير كذا',
      en: 'Convert between JPG, PNG and WebP in one click, with transparency kept unless you choose otherwise',
    },
  },
  // Resize and Crop are the two dimension tools and belong beside each other:
  // someone who has just resized is far more likely to want a crop next than a
  // format change.
  {
    slug: 'resize-image',
    icon: '📐',
    name: { ar: 'تصغير الصور', en: 'Resize Image' },
    desc: {
      ar: 'غيّر أبعاد صورتك بالبكسل أو بالنسبة المئوية مع الحفاظ على التناسب',
      en: 'Change your image dimensions by pixels or percentage, aspect ratio kept',
    },
  },
  {
    slug: 'crop-image',
    icon: '✂️',
    name: { ar: 'قص الصور', en: 'Crop Image' },
    desc: {
      ar: 'قص أي جزء من الصورة بالسحب أو بالأرقام، ومقاسات جاهزة للمربع والعريض',
      en: 'Crop any part of an image by dragging or by numbers, with ready square and widescreen presets',
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
 * With four tools live this returns the full three, so every image tool now has
 * exactly 3 outbound and 3 inbound related links — a closed chain in which no
 * tool can become orphaned as the set grows, the same property `relatedPdfTools`
 * gives the PDF section.
 *
 * The clamp stays because it is what made the section survivable while it had
 * one tool in it: rather than padding the list with repeats of the current page,
 * it returned fewer links and the layout leaned on a cross-section link instead.
 * A future section starting from scratch inherits that behaviour for free.
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
