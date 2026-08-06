/**
 * Shared helpers for the comparisons section.
 *
 * Content collection ids are `<lang>/<slug>` (the glob loader keeps the folder
 * in the id), so every consumer needs the same slug extraction and the same
 * ordering rules. Centralising them here keeps the landing page, the detail
 * template, and the search index in agreement.
 */

import type { CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

export type Comparison = CollectionEntry<'comparisons'>;
export type Side = 'a' | 'b' | 'tie';

/** `ar/chatgpt-vs-claude` → `chatgpt-vs-claude` */
export function slugOf(entry: { id: string }): string {
  return entry.id.split('/')[1];
}

/** Language-neutral path for a comparison, e.g. `/comparisons/chatgpt-vs-claude`. */
export function comparisonPath(entry: { id: string }): string {
  return `/comparisons/${slugOf(entry)}`;
}

/** Only the comparisons written in the requested language. */
export function inLang(all: Comparison[], lang: Lang): Comparison[] {
  return all.filter((entry) => entry.data.lang === lang);
}

/** Newest first. Used for the "latest" rail. */
export function byNewest(a: Comparison, b: Comparison): number {
  return b.data.publishDate.valueOf() - a.data.publishDate.valueOf();
}

/** Highest `popularity` weight first, newest breaking ties. */
export function byPopularity(a: Comparison, b: Comparison): number {
  const diff = b.data.popularity - a.data.popularity;
  return diff !== 0 ? diff : byNewest(a, b);
}

/**
 * Resolve `related` slugs to real entries in the same language.
 *
 * Anything that does not resolve is dropped rather than rendered as a dead
 * link — the internal-linking rule in SEO.md is "no broken links, ever".
 */
export function resolveRelated(
  all: Comparison[],
  entry: Comparison,
  limit = 4
): Comparison[] {
  const pool = inLang(all, entry.data.lang);
  const self = slugOf(entry);
  const picked = entry.data.related
    .map((slug) => pool.find((candidate) => slugOf(candidate) === slug))
    .filter((candidate): candidate is Comparison => Boolean(candidate) && slugOf(candidate!) !== self);

  // Top up from the same category so a comparison is never a dead end, even if
  // its `related` list is short or points at pages we have not written yet.
  if (picked.length < limit) {
    for (const candidate of pool.sort(byPopularity)) {
      if (picked.length >= limit) break;
      if (slugOf(candidate) === self) continue;
      if (picked.some((p) => slugOf(p) === slugOf(candidate))) continue;
      if (candidate.data.category !== entry.data.category) continue;
      picked.push(candidate);
    }
  }

  return picked.slice(0, limit);
}

/** The tool name on a given side, or the tie label. */
export function sideName(entry: Comparison, side: Side, tieLabel: string): string {
  if (side === 'a') return entry.data.toolA.name;
  if (side === 'b') return entry.data.toolB.name;
  return tieLabel;
}

/** Fills `{count}` style placeholders in a translated string. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match
  );
}
