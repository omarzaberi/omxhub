// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://omxhub.com',
  build: {
    // Every page was shipping one or two render-blocking <link rel=stylesheet>
    // requests. Our per-page CSS is small (the heaviest page is ~17 kB raw,
    // ~4 kB over the wire once gzipped), so inlining it costs a few kB of HTML
    // and removes an entire round-trip from the critical path — a trade that
    // pays off on mobile, where latency dominates transfer time.
    // `auto` only inlines sheets under 4 kB, which left the two biggest ones
    // blocking, so this is set explicitly.
    inlineStylesheets: 'always',
  },
  integrations: [
    sitemap({
      // Keep placeholder / noindex pages out of the sitemap so Google doesn't
      // waste crawl budget on them. Remove an entry here once it has real content.
      // `404` is excluded permanently — an error page must never be indexable.
      filter: (page) =>
        !/\/(ai-news|tutorials|404)\/?$/.test(new URL(page).pathname),
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
