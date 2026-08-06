import type { Lang } from '../i18n/ui';

/**
 * The PDF tool catalogue — single source of truth.
 *
 * Before this file the same list was maintained by hand in four places: the two
 * `/pdf-tools` hub pages, the homepage quick-actions grid, and a bespoke
 * `related` array inside every individual tool page. Adding one tool meant
 * editing all four and hoping none drifted. Everything now derives from here.
 *
 * **Order is meaningful.** `relatedPdfTools` walks this array and wraps around,
 * so each tool links to the next three and is linked from the previous three.
 * That gives a closed, symmetric crawl chain with no orphan and no dead end,
 * for free, forever. Insert new tools next to their conceptual neighbours.
 */
export interface PdfTool {
  /** URL segment — the page lives at `/pdf-tools/<slug>`. */
  slug: string;
  icon: string;
  /** Short label used in grids, related pills and breadcrumbs. */
  name: Record<Lang, string>;
  /** One-line description for the hub grid. Not the page meta description. */
  desc: Record<Lang, string>;
}

export const pdfTools: readonly PdfTool[] = [
  {
    slug: 'merge-pdf',
    icon: '🔗',
    name: { ar: 'دمج PDF', en: 'Merge PDF' },
    desc: {
      ar: 'ادمج عدة ملفات PDF بملف واحد بالترتيب اللي تبيه',
      en: 'Combine multiple PDF files into one, in the order you want',
    },
  },
  {
    slug: 'split-pdf',
    icon: '✂️',
    name: { ar: 'تقسيم PDF', en: 'Split PDF' },
    desc: {
      ar: 'قسّم ملف PDF لصفحات أو نطاقات منفصلة',
      en: 'Split a PDF file into separate pages or ranges',
    },
  },
  {
    slug: 'extract-pages',
    icon: '📑',
    name: { ar: 'استخراج صفحات', en: 'Extract Pages' },
    desc: {
      ar: 'اختر الصفحات اللي تبيها بالمعاينة واطلعها بملف PDF جديد',
      en: 'Pick the pages you want visually and save them as a new PDF',
    },
  },
  {
    slug: 'delete-pages',
    icon: '🗑️',
    name: { ar: 'حذف صفحات', en: 'Delete Pages' },
    desc: {
      ar: 'شِل الصفحات الفاضية أو الزايدة واحتفظ بالباقي كما هو',
      en: 'Remove blank or unwanted pages and keep the rest untouched',
    },
  },
  {
    slug: 'organize-pdf',
    icon: '🔀',
    name: { ar: 'ترتيب صفحات PDF', en: 'Organize PDF' },
    desc: {
      ar: 'رتّب صفحات الملف بالسحب أو بالأزرار، أو اعكس الترتيب كامل',
      en: 'Reorder pages by dragging or with buttons, or reverse them all',
    },
  },
  {
    slug: 'rotate-pdf',
    icon: '🔄',
    name: { ar: 'تدوير PDF', en: 'Rotate PDF' },
    desc: {
      ar: 'دوّر صفحات ملف PDF 90 أو 180 أو 270 درجة',
      en: 'Rotate PDF pages by 90, 180, or 270 degrees',
    },
  },
  {
    slug: 'watermark-pdf',
    icon: '💧',
    name: { ar: 'علامة مائية', en: 'Watermark PDF' },
    desc: {
      ar: 'أضف نص كعلامة مائية على كل صفحات ملف PDF',
      en: 'Add a text watermark across every page of a PDF',
    },
  },
  {
    slug: 'images-to-pdf',
    icon: '🖼️',
    name: { ar: 'صور إلى PDF', en: 'Images to PDF' },
    desc: {
      ar: 'حوّل صورة أو أكثر (JPG/PNG) لملف PDF واحد',
      en: 'Convert one or more images (JPG/PNG) into a single PDF',
    },
  },
  {
    slug: 'pdf-to-images',
    icon: '📄',
    name: { ar: 'PDF إلى صور', en: 'PDF to Images' },
    desc: {
      ar: 'حوّل كل صفحة بملف PDF لصورة PNG منفصلة',
      en: 'Convert every page of a PDF into a separate PNG image',
    },
  },
] as const;

/** Language-neutral path for a tool. Wrap in `localizedPath` before rendering. */
export function pdfToolPath(slug: string): string {
  return `/pdf-tools/${slug}`;
}

/** Catalogue entry lookup. Throws on an unknown slug so a typo fails the build. */
export function getPdfTool(slug: string): PdfTool {
  const tool = pdfTools.find((t) => t.slug === slug);
  if (!tool) throw new Error(`Unknown PDF tool slug: ${slug}`);
  return tool;
}

/**
 * The next `count` tools after `slug`, wrapping around the catalogue.
 *
 * Deterministic and symmetric: every tool ends up with exactly `count` outbound
 * related links and exactly `count` inbound ones, so no PDF tool page can ever
 * become orphaned no matter how the catalogue grows.
 */
export function relatedPdfTools(
  lang: Lang,
  slug: string,
  count = 3
): { label: string; href: string }[] {
  const start = pdfTools.findIndex((t) => t.slug === slug);
  if (start === -1) throw new Error(`Unknown PDF tool slug: ${slug}`);
  const total = pdfTools.length;
  const take = Math.min(count, total - 1);
  return Array.from({ length: take }, (_, i) => {
    const tool = pdfTools[(start + i + 1) % total];
    return {
      label: tool.name[lang],
      href: lang === 'ar' ? pdfToolPath(tool.slug) : `/en${pdfToolPath(tool.slug)}`,
    };
  });
}
