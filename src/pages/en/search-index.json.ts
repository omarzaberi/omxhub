import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { categories } from '../../data/categories';

export const GET: APIRoute = async () => {
  const lang = 'en' as const;

  const tools = (await getCollection('tools')).filter((t) => t.data.lang === lang);
  const prompts = (await getCollection('prompts')).filter((p) => p.data.lang === lang);
  const comparisons = (await getCollection('comparisons')).filter((c) => c.data.lang === lang);
  const tutorials = (await getCollection('tutorials')).filter((t) => t.data.lang === lang);

  const toolItems = tools.map((t) => ({
    type: 'tool',
    typeLabel: 'Tool',
    title: t.data.name,
    description: t.data.tagline,
    category: categories[t.data.category][lang],
    url: `/en/ai-tools/${t.id.split('/')[1]}`,
  }));

  const promptItems = prompts.map((p) => ({
    type: 'prompt',
    typeLabel: 'Prompt',
    title: p.data.title,
    description: p.data.description,
    category: categories[p.data.category][lang],
    url: `/en/prompts/${p.id.split('/')[1]}`,
  }));

  const comparisonItems = comparisons.map((c) => ({
    type: 'comparison',
    typeLabel: 'Comparison',
    title: c.data.title,
    description: c.data.subtitle,
    category: categories[c.data.category][lang],
    url: `/en/comparisons/${c.id.split('/')[1]}`,
  }));

  const tutorialItems = tutorials.map((t) => ({
    type: 'tutorial',
    typeLabel: 'Tutorial',
    title: t.data.title,
    description: t.data.subtitle,
    category: categories[t.data.category][lang],
    url: `/en/tutorials/${t.id.split('/')[1]}`,
  }));

  return new Response(
    JSON.stringify([...toolItems, ...comparisonItems, ...tutorialItems, ...promptItems]),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
