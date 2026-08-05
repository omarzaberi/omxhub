// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://omxhub.com',
  integrations: [
    sitemap({
      // Keep placeholder / noindex pages out of the sitemap so Google doesn't
      // waste crawl budget on them. Remove an entry here once it has real content.
      // `404` is excluded permanently — an error page must never be indexable.
      filter: (page) =>
        !/\/(ai-news|comparisons|tutorials|404)\/?$/.test(new URL(page).pathname),
      // Match the canonical URLs emitted in <head> (no trailing slash) so Google
      // doesn't get conflicting signals between the sitemap and the pages.
      serialize: (item) => {
        const u = new URL(item.url);
        if (u.pathname !== '/' && u.pathname.endsWith('/')) {
          u.pathname = u.pathname.replace(/\/+$/, '');
        }
        return { ...item, url: u.href };
      },
    }),
  ],
  i18n: {
    locales: ['ar', 'en'],
    defaultLocale: 'ar',
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
