import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const tools = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tools' }),
  schema: z.object({
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
    publishDate: z.date(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { tools };
