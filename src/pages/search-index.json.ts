/**
 * The index behind the site-wide search box.
 *
 * The PDF and image tools were missing from it until now, which meant the 18
 * pages the site *builds itself* — and the only ones a visitor can use without
 * leaving — were the only pages search could not find. Someone typing "ضغط" got
 * nothing while two compression tools sat one click away.
 *
 * They are appended last on purpose: a query like "صور" should surface the AI
 * image generators before our own resize utility, because the directory is what
 * that query is usually asking about.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { categories } from '../data/categories';
import { pdfTools, pdfToolPath } from '../data/pdf-tools';
import { imageTools, imageToolPath } from '../data/image-tools';

export const GET: APIRoute = async () => {
  const lang = 'ar' as const;

  const tools = (await getCollection('tools')).filter((t) => t.data.lang === lang);
  const prompts = (await getCollection('prompts')).filter((p) => p.data.lang === lang);
  const comparisons = (await getCollection('comparisons')).filter((c) => c.data.lang === lang);
  const tutorials = (await getCollection('tutorials')).filter((t) => t.data.lang === lang);

  const toolItems = tools.map((t) => ({
    type: 'tool',
    typeLabel: 'أداة',
    title: t.data.name,
    description: t.data.tagline,
    category: categories[t.data.category][lang],
    url: `/ai-tools/${t.id.split('/')[1]}`,
  }));

  const promptItems = prompts.map((p) => ({
    type: 'prompt',
    typeLabel: 'برومبت',
    title: p.data.title,
    description: p.data.description,
    category: categories[p.data.category][lang],
    url: `/prompts/${p.id.split('/')[1]}`,
  }));

  const comparisonItems = comparisons.map((c) => ({
    type: 'comparison',
    typeLabel: 'مقارنة',
    title: c.data.title,
    description: c.data.subtitle,
    category: categories[c.data.category][lang],
    url: `/comparisons/${c.id.split('/')[1]}`,
  }));

  const tutorialItems = tutorials.map((t) => ({
    type: 'tutorial',
    typeLabel: 'شرح',
    title: t.data.title,
    description: t.data.subtitle,
    category: categories[t.data.category][lang],
    url: `/tutorials/${t.id.split('/')[1]}`,
  }));

  const pdfItems = pdfTools.map((tool) => ({
    type: 'utility',
    typeLabel: 'أداة PDF',
    title: tool.name[lang],
    description: tool.desc[lang],
    category: 'أدوات PDF',
    url: pdfToolPath(tool.slug),
  }));

  const imageItems = imageTools.map((tool) => ({
    type: 'utility',
    typeLabel: 'أداة صور',
    title: tool.name[lang],
    description: tool.desc[lang],
    category: 'أدوات الصور',
    url: imageToolPath(tool.slug),
  }));

  return new Response(
    JSON.stringify([
      ...toolItems,
      ...comparisonItems,
      ...tutorialItems,
      ...promptItems,
      ...pdfItems,
      ...imageItems,
    ]),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
