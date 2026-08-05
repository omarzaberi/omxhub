/**
 * Central Schema.org (JSON-LD) builders.
 *
 * Every structured-data block on the site is produced here so the shape stays
 * consistent, `@id` references line up across pages, and nothing gets duplicated
 * page by page. Pages pass the result to `<Layout schema={...} />`, which emits
 * it inside <head>.
 *
 * Rules we hold ourselves to:
 *  - Only mark up what is actually visible on the page (Google's core policy).
 *  - Ratings are editorial, so they are expressed as a `Review` authored by
 *    OMXHub — never a fabricated `aggregateRating`.
 *  - Absolute URLs everywhere, matching the canonical form (no trailing slash).
 */

import { localizedPath } from '../i18n/utils';
import type { Lang } from '../i18n/ui';
import type { CategoryKey } from '../data/categories';

export const SITE = 'https://omxhub.com';

/** Stable node identifiers so pages can reference the org/site instead of repeating them. */
export const ORG_ID = `${SITE}/#organization`;
export const WEBSITE_ID = `${SITE}/#website`;

/** Normalise a path the same way Layout.astro builds canonicals: leading slash, no trailing slash. */
function normalize(path: string): string {
  let p = path.startsWith('/') ? path : `/${path}`;
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p || '/';
}

/** Absolute URL on the canonical host. */
export function absUrl(path: string): string {
  return `${SITE}${normalize(path)}`;
}

/** Absolute URL for a language-neutral path, localised first (`/x` → `/en/x`). */
export function langUrl(lang: Lang, path: string): string {
  return absUrl(localizedPath(lang, path));
}

type Json = Record<string, unknown>;

const ORG_NAME = 'OMXHub';
const ORG_EMAIL = 'omar.zaberi@gmail.com';
const FOUNDER = 'Omar Zaberi';

const ORG_DESCRIPTION: Record<Lang, string> = {
  ar: 'OMXHub دليل عربي مستقل لأدوات الذكاء الاصطناعي، مع أدوات PDF مجانية تعمل بالكامل داخل المتصفح.',
  en: 'OMXHub is an independent Arabic-first directory of AI tools, plus free PDF utilities that run entirely in the browser.',
};

/**
 * Publisher identity. Emitted once on the homepage and the About page; every
 * other block just references `{ '@id': ORG_ID }`.
 *
 * `sameAs` is intentionally absent — OMXHub has no official social profiles yet,
 * and pointing at accounts we do not control would be a trust signal we have not
 * earned. Add the array here the moment real profiles exist.
 */
/**
 * Lightweight reference to the publisher.
 *
 * Carries the same `@id` as the full node (so they merge into one entity) but
 * also repeats `name` and `url` — Google does not follow `@id` across pages, and
 * `author.name` is a hard requirement for review snippets.
 */
export function orgRef(): Json {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: ORG_NAME,
    url: SITE,
  };
}

export function organization(lang: Lang): Json {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: ORG_NAME,
    alternateName: 'OMX Hub',
    url: SITE,
    description: ORG_DESCRIPTION[lang],
    email: ORG_EMAIL,
    logo: {
      '@type': 'ImageObject',
      '@id': `${SITE}/#logo`,
      url: `${SITE}/logo.png`,
      width: 512,
      height: 512,
      caption: ORG_NAME,
    },
    image: { '@id': `${SITE}/#logo` },
    founder: { '@type': 'Person', name: FOUNDER },
    foundingDate: '2026',
    knowsLanguage: ['ar', 'en'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: ORG_EMAIL,
      availableLanguage: ['Arabic', 'English'],
    },
  };
}

/**
 * Site-level node with a search action.
 *
 * The `?q=` target is real: the homepage reads that parameter, fills the search
 * box, and runs the query. We never declare a search endpoint the site cannot
 * actually serve.
 */
export function website(lang: Lang, opts: { name: string; description: string }): Json {
  const home = langUrl(lang, '/');
  // `/` for Arabic, `/en/` for English — a trailing slash before the query string.
  const searchBase = home.endsWith('/') ? home : `${home}/`;
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: home,
    name: opts.name,
    description: opts.description,
    inLanguage: lang,
    publisher: { '@id': ORG_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${searchBase}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export interface Crumb {
  name: string;
  /** Language-neutral path (e.g. `/ai-tools`). Omit on the final crumb. */
  path?: string;
}

/** Breadcrumb trail. The last item is left without a URL, per Google's guidance. */
export function breadcrumbs(lang: Lang, crumbs: Crumb[]): Json {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      ...(crumb.path ? { item: langUrl(lang, crumb.path) } : {}),
    })),
  };
}

/** "Home" crumb label, so pages don't each hardcode it. */
export const HOME_LABEL: Record<Lang, string> = { ar: 'الرئيسية', en: 'Home' };

/**
 * Convenience for pages whose only structured data is the breadcrumb trail.
 * `trail(lang, [{ name: 'من نحن' }])` → Home / من نحن.
 */
export function trail(lang: Lang, crumbs: Crumb[]): Json {
  return graph(breadcrumbs(lang, [{ name: HOME_LABEL[lang], path: '/' }, ...crumbs]));
}

/** Maps our editorial categories onto schema.org `applicationCategory` values. */
const APP_CATEGORY: Record<CategoryKey, string> = {
  writing: 'BusinessApplication',
  design: 'DesignApplication',
  'video-audio': 'MultimediaApplication',
  coding: 'DeveloperApplication',
  productivity: 'BusinessApplication',
  marketing: 'BusinessApplication',
  research: 'EducationalApplication',
};

export interface SoftwareAppInput {
  lang: Lang;
  name: string;
  description: string;
  /** Language-neutral page path, e.g. `/ai-tools/chatgpt`. */
  path: string;
  category: CategoryKey;
  pricingType: 'free' | 'paid' | 'freemium';
  officialUrl: string;
  /** Our editorial score out of 5, if the tool has been rated. */
  rating?: number;
  /** Publish date of the review, used as the review date. */
  datePublished?: Date;
}

/**
 * A reviewed AI tool.
 *
 * The rating is ours, written by us, so it is modelled as a single `Review` with
 * OMXHub as the author. That is honest and still eligible for review snippets;
 * an `aggregateRating` here would imply user votes we do not collect.
 */
export function softwareApplication(input: SoftwareAppInput): Json {
  const url = langUrl(input.lang, input.path);
  const node: Json = {
    '@type': 'SoftwareApplication',
    '@id': `${url}#software`,
    name: input.name,
    description: input.description,
    // `url` is the product itself; `mainEntityOfPage` is where we describe it.
    url: input.officialUrl,
    mainEntityOfPage: url,
    applicationCategory: APP_CATEGORY[input.category],
    operatingSystem: 'Web',
    inLanguage: input.lang,
  };

  // Only claim a price we can stand behind. "free" and "freemium" both have a
  // genuine zero-cost tier; "paid" plans vary too much to encode safely.
  if (input.pricingType === 'free' || input.pricingType === 'freemium') {
    node.offers = {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    };
  }

  if (typeof input.rating === 'number') {
    node.review = {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: input.rating,
        bestRating: 5,
        worstRating: 1,
      },
      author: orgRef(),
      publisher: orgRef(),
      url,
      ...(input.datePublished
        ? { datePublished: input.datePublished.toISOString().slice(0, 10) }
        : {}),
    };
  }

  return node;
}

export interface FaqItem {
  q: string;
  a: string;
}

/** FAQ block. Returns null when there are no questions, so callers can spread safely. */
export function faqPage(faq: FaqItem[]): Json | null {
  if (!faq.length) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

export interface HowToInput {
  lang: Lang;
  name: string;
  description: string;
  /** Language-neutral page path, e.g. `/pdf-tools/merge-pdf`. */
  path: string;
  steps: { name: string; text: string }[];
  /** ISO 8601 duration, e.g. "PT1M". */
  totalTime?: string;
}

/**
 * Step-by-step instructions for a PDF tool.
 *
 * Every step listed here is also rendered visibly on the page — marking up
 * invisible content is a policy violation, not a shortcut.
 */
export function howTo(input: HowToInput): Json {
  const url = langUrl(input.lang, input.path);
  return {
    '@type': 'HowTo',
    '@id': `${url}#howto`,
    name: input.name,
    description: input.description,
    inLanguage: input.lang,
    totalTime: input.totalTime ?? 'PT1M',
    // These tools are free and run client-side — no cost to the user at all.
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: '0' },
    tool: {
      '@type': 'HowToTool',
      name: input.lang === 'ar' ? 'متصفح ويب حديث' : 'A modern web browser',
    },
    step: input.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      url: `${url}#step-${index + 1}`,
    })),
  };
}

export interface ArticleInput {
  lang: Lang;
  headline: string;
  description: string;
  /** Language-neutral page path, e.g. `/comparisons/chatgpt-vs-claude`. */
  path: string;
  datePublished: Date;
  dateModified?: Date;
  /** Optional social image path, e.g. `/og/chatgpt-vs-claude.png`. */
  image?: string;
  /** Names of the products the article is about — becomes `about`. */
  about?: string[];
  /** Free-text keywords, joined into the `keywords` property. */
  keywords?: string[];
}

/**
 * Editorial article — used by comparison pages.
 *
 * We use `Article` rather than `NewsArticle` or `BlogPosting`: these are evergreen
 * buying guides that get revised, not dated posts. `dateModified` is emitted only
 * when the page really carries a visible "last updated" line.
 */
export function article(input: ArticleInput): Json {
  const url = langUrl(input.lang, input.path);
  return {
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: input.headline,
    description: input.description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    inLanguage: input.lang,
    isPartOf: { '@id': WEBSITE_ID },
    author: orgRef(),
    publisher: { '@id': ORG_ID },
    datePublished: input.datePublished.toISOString().slice(0, 10),
    ...(input.dateModified
      ? { dateModified: input.dateModified.toISOString().slice(0, 10) }
      : {}),
    image: `${SITE}${input.image ?? '/og-default.png'}`,
    ...(input.about?.length
      ? {
          about: input.about.map((name) => ({
            '@type': 'SoftwareApplication',
            name,
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
          })),
        }
      : {}),
    ...(input.keywords?.length ? { keywords: input.keywords.join(', ') } : {}),
  };
}

export interface CollectionInput {
  lang: Lang;
  name: string;
  description: string;
  /** Language-neutral path, e.g. `/comparisons`. */
  path: string;
  /** Entries listed on the page, in the order they are rendered. */
  items: { name: string; path: string }[];
}

/**
 * A listing page plus the ordered list of what it links to.
 *
 * `ItemList` is nested inside the `CollectionPage` rather than emitted as a
 * sibling so the two are unambiguously connected.
 */
export function collectionPage(input: CollectionInput): Json {
  const url = langUrl(input.lang, input.path);
  return {
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    name: input.name,
    description: input.description,
    url,
    inLanguage: input.lang,
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORG_ID },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: input.items.length,
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      itemListElement: input.items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: langUrl(input.lang, item.path),
      })),
    },
  };
}

/**
 * Wraps one or more nodes into a single `@graph` document.
 * One `<script type="application/ld+json">` per page beats several — the nodes
 * can then reference each other by `@id`.
 */
export function graph(...nodes: (Json | null | undefined)[]): Json {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes.filter(Boolean) as Json[],
  };
}
