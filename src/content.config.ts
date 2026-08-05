import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const tools = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tools' }),
  schema: z.object({
    lang: z.enum(['ar', 'en']),
    name: z.string(),
    tagline: z.string(),
    category: z.enum([
      'writing',
      'design',
      'video-audio',
      'coding',
      'productivity',
      'marketing',
      'research',
    ]),
    pricingType: z.enum(['free', 'paid', 'freemium']),
    officialUrl: z.string().url(),
    affiliateUrl: z.string().url().optional(),
    logo: z.string().optional(),
    rating: z.number().min(0).max(5).optional(),
    pros: z.array(z.string()),
    cons: z.array(z.string()),
    pricingPlans: z.array(
      z.object({
        name: z.string(),
        price: z.string(),
        features: z.string(),
      })
    ),
    alternatives: z.array(z.string()).optional(), // slugs of other tools
    faq: z
      .array(z.object({ q: z.string(), a: z.string() }))
      .optional(),
    publishDate: z.date(),
    featured: z.boolean().default(false),
  }),
});

const prompts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/prompts' }),
  schema: z.object({
    lang: z.enum(['ar', 'en']),
    title: z.string(),
    description: z.string(),
    promptText: z.string(),
    category: z.enum([
      'writing',
      'design',
      'video-audio',
      'coding',
      'productivity',
      'marketing',
      'research',
    ]),
    tool: z.string(), // recommended tool name, e.g. "ChatGPT"
    difficulty: z.enum(['beginner', 'advanced']),
    publishDate: z.date(),
    featured: z.boolean().default(false),
  }),
});

/**
 * Head-to-head comparisons (`/comparisons/<a>-vs-<b>`).
 *
 * The frontmatter carries every structured block the page renders (summary card,
 * feature table, scores, use cases, audience picks), and the markdown body holds
 * the editorial prose. Keeping the structure in frontmatter means the comparison
 * card, the landing page, and the search index can all read a comparison without
 * parsing its body.
 *
 * `side` values are always `'a' | 'b' | 'tie'`, referring to `toolA` / `toolB`.
 */
const comparisonSide = z.enum(['a', 'b', 'tie']);

const comparisonTool = z.object({
  /** Slug of the tool in the `tools` collection. Omit only if we have no page for it yet. */
  slug: z.string().optional(),
  name: z.string(),
  /** One line shown under the name in the versus header. */
  tagline: z.string(),
  /** Vendor, e.g. "OpenAI" — keeps the header honest about who makes what. */
  vendor: z.string(),
});

const comparisons = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/comparisons' }),
  schema: z.object({
    lang: z.enum(['ar', 'en']),
    /** Short H1, e.g. "ChatGPT vs Claude". */
    title: z.string(),
    /** Sentence under the H1. */
    subtitle: z.string(),
    /** <title> tag — written separately so it can target the search phrase. */
    metaTitle: z.string(),
    metaDescription: z.string(),
    category: z.enum([
      'writing',
      'design',
      'video-audio',
      'coding',
      'productivity',
      'marketing',
      'research',
    ]),

    toolA: comparisonTool,
    toolB: comparisonTool,

    /** Hero "quick recommendation" chips: Best for coding → Cursor, etc. */
    quickPicks: z
      .array(
        z.object({
          label: z.string(),
          pick: z.string(),
          side: comparisonSide,
        })
      )
      .min(2),

    /** Quick Summary Card. `value` is free text so rows like "Free plan" can describe both tools. */
    summary: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
          side: comparisonSide.optional(),
        })
      )
      .min(5),

    /** Side-by-side feature table. `edge` highlights the stronger cell. */
    table: z
      .array(
        z.object({
          feature: z.string(),
          a: z.string(),
          b: z.string(),
          edge: comparisonSide.default('tie'),
        })
      )
      .min(8),

    prosA: z.array(z.string()).min(2),
    consA: z.array(z.string()).min(2),
    prosB: z.array(z.string()).min(2),
    consB: z.array(z.string()).min(2),

    /** Best use cases — icon + who wins it + why. */
    useCases: z
      .array(
        z.object({
          icon: z.string(),
          title: z.string(),
          side: comparisonSide,
          body: z.string(),
        })
      )
      .min(4),

    /** Editorial performance scores, 0–10. Rendered as labelled bars. */
    performance: z
      .array(
        z.object({
          metric: z.string(),
          a: z.number().min(0).max(10),
          b: z.number().min(0).max(10),
          /** Optional one-line justification shown under the bars. */
          note: z.string().optional(),
        })
      )
      .min(4),

    /** "Which one should you choose?" — one recommendation per audience. */
    audiences: z
      .array(
        z.object({
          icon: z.string(),
          audience: z.string(),
          side: comparisonSide,
          body: z.string(),
        })
      )
      .min(4),

    /** Slugs of other comparisons to surface as alternatives. */
    related: z.array(z.string()).default([]),
    /** Slugs from the `prompts` collection worth trying with either tool. */
    relatedPrompts: z.array(z.string()).default([]),

    faq: z.array(z.object({ q: z.string(), a: z.string() })).min(3),

    publishDate: z.date(),
    /** Shown as "last updated" — pricing moves fast, readers deserve the date. */
    updatedDate: z.date().optional(),
    featured: z.boolean().default(false),
    /** Manual ordering weight for the "popular comparisons" rail. Higher = higher. */
    popularity: z.number().default(0),
  }),
});

export const collections = { tools, prompts, comparisons };
