/**
 * Shared helpers for the tutorials section.
 *
 * Mirrors `src/lib/comparisons.ts`: collection ids are `<lang>/<slug>`, so slug
 * extraction, ordering, and related-link resolution all belong in one place
 * rather than being re-derived by the landing page, the detail template, and the
 * search index.
 */

import type { CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

export type Tutorial = CollectionEntry<'tutorials'>;
export type Level = Tutorial['data']['level'];

/** `ar/how-to-use-claude` → `how-to-use-claude` */
export function slugOf(entry: { id: string }): string {
  return entry.id.split('/')[1];
}

/** Language-neutral path for a tutorial, e.g. `/tutorials/how-to-use-claude`. */
export function tutorialPath(entry: { id: string }): string {
  return `/tutorials/${slugOf(entry)}`;
}

/** Only the tutorials written in the requested language. */
export function inLang(all: Tutorial[], lang: Lang): Tutorial[] {
  return all.filter((entry) => entry.data.lang === lang);
}

/** Newest first. Used for the "latest" rail. */
export function byNewest(a: Tutorial, b: Tutorial): number {
  return b.data.publishDate.valueOf() - a.data.publishDate.valueOf();
}

/** Highest `popularity` weight first, newest breaking ties. */
export function byPopularity(a: Tutorial, b: Tutorial): number {
  const diff = b.data.popularity - a.data.popularity;
  return diff !== 0 ? diff : byNewest(a, b);
}

/**
 * Resolve `related` slugs to real entries in the same language.
 *
 * Anything that does not resolve is dropped rather than rendered as a dead link.
 * If the explicit list is short, we top up from the same category so a tutorial
 * is never a dead end — same rule as `resolveRelated` in `comparisons.ts`.
 */
export function resolveRelated(
  all: Tutorial[],
  entry: Tutorial,
  limit = 3
): Tutorial[] {
  const pool = inLang(all, entry.data.lang);
  const self = slugOf(entry);

  const picked = entry.data.related
    .map((slug) => pool.find((candidate) => slugOf(candidate) === slug))
    .filter(
      (candidate): candidate is Tutorial =>
        Boolean(candidate) && slugOf(candidate!) !== self
    );

  const topUp = (predicate: (candidate: Tutorial) => boolean) => {
    for (const candidate of [...pool].sort(byPopularity)) {
      if (picked.length >= limit) return;
      if (slugOf(candidate) === self) continue;
      if (picked.some((p) => slugOf(p) === slugOf(candidate))) continue;
      if (!predicate(candidate)) continue;
      picked.push(candidate);
    }
  };

  // Same category first, then anything else — better a cross-category link than
  // a page with nowhere to go.
  topUp((candidate) => candidate.data.category === entry.data.category);
  topUp(() => true);

  return picked.slice(0, limit);
}

/** Fills `{count}` style placeholders in a translated string. */
export function fill(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match
  );
}
