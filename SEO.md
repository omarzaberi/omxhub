# 🔍 OMXHub — SEO Plan

> The working SEO plan for the site. The status of each item (⬜ / 🟡 / ✅) is updated as we
> complete it. Paired with `BLUEPRINT.md` — this file covers **how** we rank, the Blueprint
> covers **what** we build. Dated history lives in `CHANGELOG.md`; unbuilt items are tracked
> in `IDEAS.md`.

## Principles

1. **Every feature is an indexable page**, with its own title, description and schema.
2. **Bilingual, done properly**: every Arabic page has an English counterpart bound to it by
   `hreflang`, and the two never compete with each other.
3. **No thin content**: a page with no real content behind it is deleted or set to `noindex` —
   it is never published empty.
4. **Speed is part of SEO**: we hold Lighthouse at 95+ and add no heavy scripts without cause.
5. **We verify for real**: after every SEO change we build the site and inspect the generated
   HTML rather than assuming.

---

## Phase 1 — Technical Foundation

Top priority. All of it is implemented centrally in `src/layouts/Layout.astro` so that it
applies to every page.

| Item | Status | Notes |
|---|---|---|
| `site` in astro.config | ✅ | `https://omxhub.com` |
| Sitemap integration | ✅ | `@astrojs/sitemap` → `/sitemap-index.xml` |
| robots.txt | ✅ | Allows all crawlers and points to the sitemap |
| Google Analytics (GA4) | ✅ | `G-W8MG2DBF3F` |
| **Self-referencing canonical URL on every page** | ✅ | Prevents duplicate content from trailing slashes and query parameters |
| **hreflang ar / en / x-default** | ✅ | Critical for a two-language site — without it Google treats the pairs as duplicates |
| **Open Graph tags** | ✅ | title, description, url, type, image, locale, site_name |
| **Twitter Cards** | ✅ | `summary_large_image` |
| **Default og:image** | ✅ | 1200×630, OMXHub brand identity |
| Title / description review | ✅ | ≤60 characters for titles, 120–160 for descriptions, no repetition |
| Correct `lang` + `dir` | ✅ | Already present in `Layout` |

## Phase 2 — Structured Data (Schema.org JSON-LD)

All JSON-LD is generated from a single file, `src/lib/schema.ts`, and printed as one `@graph`
in the `<head>` via the `schema` prop on `Layout`. Our governing rule: **we only mark up
content that is actually visible on the page.**

| Type | Applied to | Status | Notes |
|---|---|---|---|
| `WebSite` + `SearchAction` | Homepage | ✅ | The search genuinely accepts `?q=` — the URL declared in the schema works, it is not decorative |
| `Organization` | Homepage + About | ✅ | With `logo.png` (512×512), founder, and contact email. `sameAs` is deferred until official accounts exist |
| `SoftwareApplication` | AI tool pages (`/ai-tools/[slug]`) | ✅ | Plus an editorial `Review` bylined OMXHub (not `aggregateRating` — we have no user ratings) plus an `Offer` priced at 0, for free and freemium tools only |
| `HowTo` | PDF tool pages (usage steps) | ✅ | A visible "how to use it" section with 4 steps per tool in both languages — 28 pages (14 tools × 2 languages) — and the schema mirrors it literally |
| `FAQPage` | Tool pages that carry FAQs | ✅ | AI tools and PDF tools. The newer PDF tools (extract / delete / organize) carry 4 questions per page |
| `BreadcrumbList` | All internal pages | ✅ | Visible breadcrumbs on tool, category and PDF tool pages. **Open issue:** pages such as About, Contact, the prompts, and `/pdf-tools` emit `BreadcrumbList` with no visible trail on the page — a breach of our "only mark up what is visible" rule. The fix is to give them visible breadcrumbs (tracked as a separate task) |
| `CollectionPage` | Category pages + the comparisons landing page | ✅ | The comparisons page embeds an `ItemList` inside the `CollectionPage` |
| `Article` | Comparison pages (`/comparisons/[slug]`) | ✅ | 10 pages. `Article`, not `BlogPosting` — these are evergreen buying guides that get revised, not dated posts. `dateModified` is printed only when the page carries a visible "last updated" line |
| `Article` + `HowTo` | Tutorial pages (`/tutorials/[slug]`) | ✅ | 10 pages. `HowTo` is printed **only** when the page has visible numbered steps. Prerequisites are not marked up as `HowToTool` — they are prose conditions, not instruments, and marking them would be misleading |
| `CollectionPage` | Tutorials landing page (`/tutorials`) | ✅ | `ItemList` embedded inside the `CollectionPage`, ordered newest first |
| `Article` | Blog (once it launches) | ⬜ | |

### Important note: what actually earns a rich result, and what doesn't

Google has withdrawn support for certain types, so we don't waste time chasing them:

- **`HowTo`** — withdrawn from Google results in 2023, and from the testing tool shortly after.
  We keep it because other engines (Bing) and AI answer engines read it, and because the
  **visible steps section** is valuable to users regardless of Google.
- **`FAQPage`** — restricted to trusted government and health sites since 2023, and withdrawn
  from the Rich Results Test in June 2026. We keep it for the same reason as above.
- **`WebSite` + `SearchAction`** (sitelinks searchbox) — discontinued by Google in November 2024.
  We keep it because it is an accurate description of the site and costs nothing.

What genuinely earns us a rich result: **`Organization`** (homepage),
**`SoftwareApplication` + `Review`** (rating stars on tool pages), and **`BreadcrumbList`**.

### Live test result (Rich Results Test — 2026-08-06)

- `omxhub.com` → **Organization**: ✅ valid item, zero errors
- `omxhub.com/ai-tools/chatgpt` → **3 valid items**: Breadcrumbs ✅ · Review snippets ✅ ·
  Software Apps ✅ — zero errors
- **Review snippets appearing as an independent group** means the rating stars are genuinely
  eligible to appear in search results
- The only warning: `Missing field "aggregateRating" (optional)` — **deliberate**. Filling it
  without real user ratings would breach Google's policy. It gets added once an actual visitor
  rating system is built.

## Phase 3 — Index Hygiene

| Item | Status | Notes |
|---|---|---|
| Empty pages: `ai-news` | ✅ | `noindex, follow` + excluded from the sitemap — lifted once real content is ready |
| ~~`tutorials`~~ — launched with real content | ✅ | 2026-08-06: `noindex` removed and dropped from the sitemap filter. 12 indexable pages (2 landing pages + 10 tutorials). This line had lagged reality and was corrected on 2026-08-07 |
| ~~`comparisons`~~ — launched with real content | ✅ | 2026-08-06: `noindex` removed and dropped from the sitemap filter. 12 indexable pages (2 landing pages + 10 comparisons) |
| Google Search Console connected | ✅ | Verified (TXT record confirmed live in DNS) + sitemap submitted. Guide: `docs/SEARCH-CONSOLE.md` |
| Bing Webmaster Tools connected | 🟡 | Covered by the same guide (import from GSC) |
| Broken-link check | ✅ | Now part of `scripts/verify-seo.mjs` — runs after every build. Last run: 166 pages, 0 broken links |
| Custom 404 page | ✅ | Both languages, with live search and section links. `noindex` and excluded from the sitemap. The English version is served for any broken `/en/*` URL via a rule in `netlify.toml` — verified live after deployment |

## Phase 4 — Internal Linking Structure

- ✅ Every AI tool page links to its category (the category badge is now a link) and to its
  alternatives, with visible breadcrumbs above it (Home ← AI Tools ← Category ← Tool).
- ✅ Category pages link to each other and to the all-tools page.
- ✅ **The comparisons section is fully linked**: every comparison page links to both tool
  pages, to related comparisons (4 cards — auto-filled from the same category when the `related`
  list is short), to related prompts, and to the category page. In the reverse direction, every
  tool page shows the comparisons that include it, and the homepage shows the 3 strongest
  comparisons. The result: no orphan comparison page.
- ✅ **The tutorials section is fully linked**: every tutorial links to the tool pages it
  mentions, to related comparisons, to related prompts, to other tutorials (3 cards — auto-filled
  from the same category first and then from any category, so no tutorial is left without an
  exit), and to the category page. The PDF tools tutorial links to the six tools directly inside
  the body text. The top-nav link was added only once the section had real content.
- ⬜ Link tools to related tutorials and prompts (the reverse direction — from the tool page).
- ✅ **The PDF tool chain is now closed and symmetric**: `relatedPdfTools()` in
  `src/data/pdf-tools.ts` walks the catalogue and wraps around, so every tool has **exactly 3
  outbound and 3 inbound links**, with no self-links and no manual maintenance. Before this,
  every page carried a hand-written `related` array and some tools had only two links. Verified
  automatically after build across all nine tools in both languages.
- ✅ Every PDF tool is also linked from the homepage (the quick-actions grid now derives from the
  same catalogue), from `/pdf-tools`, and from the "edit PDF without uploading" tutorial — three
  independent link sources per tool.
- The homepage links to every main section.
- Visible breadcrumbs + schema.
- **No orphan pages**: any new page must have at least one internal link pointing at it.

## Phase 5 — Keyword and Content Strategy

### Where the real opportunity is

1. **Arabic searches for AI tools** — comparatively weak competition, and our core advantage.
   - Examples: "أفضل أدوات الذكاء الاصطناعي"، "بديل ChatGPT مجاني"، "شرح Claude AI".
2. **PDF tools with action intent** — very high intent and recurring traffic.
   - Examples: "دمج ملفات PDF"، "تحويل PDF إلى صور"، "merge pdf online free".
3. **Comparisons** — high-intent traffic that is comparatively easy to rank for.
   - Examples: "ChatGPT vs Claude"، "الفرق بين Gemini و ChatGPT".
4. **Prompts** — growing demand and content that scales.

### Quality rule

Every tool page must contain genuinely unique content: description, features, pricing,
pros and cons, alternatives, and FAQs. Copying from the official site earns a duplicate-content
penalty.

## Phase 6 — Performance (Core Web Vitals)

| Item | Status | Notes |
|---|---|---|
| Fonts: reduce the number of loaded families (was 5) | ✅ | 3 families per page instead of 5, self-hosted rather than served from Google Fonts |
| Remove third-party connections from the render path | ✅ | `fonts.googleapis.com` and `fonts.gstatic.com` removed entirely |
| `font-display: swap` | ✅ | Included in the generated `@font-face` rules |
| `preload` for above-the-fold fonts | ✅ | Two fonts per language, placed ahead of the AdSense/GA scripts in `<head>` |
| Lazy loading for images | ⬜ | |
| Defer pdf-lib / pdf.js to their own pages only | ✅ | `src/lib/pdf-libs.ts`: dynamic import with a warm-up the moment a file is selected. The engines (pdf-lib 418 KB, pdf.js 322 KB, JSZip 94 KB) emit as separate chunks and never enter the early module graph of any page. This line was marked `⬜` in error and was corrected on 2026-08-07 |
| Periodic Lighthouse audit | ⬜ | |
| Automated SEO check after every build | ✅ | `scripts/verify-seo.mjs` — 166 pages, 2,891 assertions, 0 failures |

### Font distribution after optimisation

Single source: `scripts/build-fonts.mjs` — it reads from the `@fontsource` packages, copies only
the required `.woff2` files into `public/fonts/`, and generates two stylesheets,
`src/styles/fonts-ar.css` and `fonts-en.css`. It runs automatically before every build via
`prebuild`.

| Pages | Families | Weights | File count |
|---|---|---|---|
| Arabic (`/`) | IBM Plex Sans Arabic · Tajawal · JetBrains Mono | 400/500/600/700 · 700 (+900 Latin for the logo) · 400/600/700 | 14 |
| English (`/en/`) | Inter · Space Grotesk · JetBrains Mono | 400/500/600/700 · 700 · 400/600/700 | 8 |

Important rules the split is built on:

- **An Arabic page never downloads Inter or Space Grotesk, and vice versa.** The stylesheet
  inlined in `<head>` changes with `lang`, so there is no surplus `@font-face` in the first place.
- **The Latin subset ships with the Arabic fonts** so that tool names (ChatGPT, Claude) inside
  Arabic text render in the same typeface rather than falling back to the system font.
- **Weights were matched to what is actually used**: Tajawal 400/500, Space Grotesk 500 and
  JetBrains Mono 500 were removed (nothing on the site uses them), and Inter 700 and JetBrains
  Mono 700 — which were **missing** — were added; the browser had been synthesising them
  (faux bold) on English pages and in the badges.
- The CSS is inlined rather than served as an external file so first paint doesn't wait on a
  network round trip, and `/fonts/*` is cached for a full year via `netlify.toml`.

## Phase 7 — Off-page

- Profiles on Product Hunt, Reddit (r/artificial and Arabic communities), Twitter/X, and LinkedIn.
- Getting OMXHub listed in other AI tool directories.
- Guest posts, and sharing the free PDF tools in Arabic technical communities.
- **No buying backlinks** — the penalty risk outweighs any gain.

---

## ✅ Execution Log

| Date | What was done |
|---|---|
| 2026-08-05 | SEO plan created |
| 2026-08-05 | **Phase 1 complete**: canonical + hreflang (ar/en/x-default) + Open Graph + Twitter Cards + og:image + robots meta, all centralised in `Layout.astro` through new props (`image`, `noindex`, `schema`) |
| 2026-08-05 | Titles and descriptions improved across every page — descriptions that merely repeated the title were removed, and tool pages were given richer titles |
| 2026-08-05 | `noindex` applied to the empty pages (ai-news / comparisons / tutorials) and all three excluded from the sitemap |
| 2026-08-05 | Sitemap aligned with the canonicals (no trailing slash) to prevent conflicting signals |
| 2026-08-05 | **Category pages**: `/ai-tools/category/<slug>` in both languages, with a targeted H1, a unique editorial introduction, breadcrumbs, and schema (BreadcrumbList + CollectionPage) — generated only for categories that actually contain tools |
| 2026-08-05 | Fixed 14 broken links (404) on the homepage that pointed at categories which did not exist |
| 2026-08-05 | Homepage title updated to cover both pillars of the site (AI + PDF), and the footer line changed to the official tagline |
| 2026-08-06 | Google Search Console connected: ownership verified via DNS TXT record and `sitemap-index.xml` submitted |
| 2026-08-06 | **Phase 2 complete**: `src/lib/schema.ts` became the single source for all JSON-LD, printed as one `@graph` per page via the `schema` prop on `Layout` |
| 2026-08-06 | `WebSite` + `SearchAction` + `Organization` on the homepage in both languages, and `Organization` on the About page. Added `public/logo.png` (512×512) with the same identity as the favicon |
| 2026-08-06 | The homepage search now reads `?q=` from the URL — so the `SearchAction` points at a real endpoint rather than an imaginary one |
| 2026-08-06 | AI tool pages: `SoftwareApplication` + editorial `Review` + `FAQPage` + visible breadcrumbs. The Arabic and English `[slug]` pages were merged into a single `ToolDetail.astro` component (they had been duplicates of 202 lines each) |
| 2026-08-06 | PDF tools: a visible **"how to use it"** section with 4 steps per tool in both languages (12 pages) + `HowTo` schema mirroring those visible steps literally |
| 2026-08-06 | `BreadcrumbList` on every remaining internal page (tools, prompts, PDF tools, contact, support, privacy) — 78 pages |
| 2026-08-06 | **Custom 404 page** in both languages: live search + section links + `noindex` + excluded from the sitemap + a `netlify.toml` rule that serves the English version for broken `/en/*` URLs |
| 2026-08-06 | **Comparisons section launched** (`/comparisons`): a new `comparisons` content collection and two templates shared between the languages (`ComparisonsIndex.astro` + `ComparisonDetail.astro`) — 10 comparison pages (5 × 2 languages) with full editorial content, plus two landing pages whose search and filtering run over pre-rendered HTML with no fetch |
| 2026-08-06 | **3 new tools in the directory**: Cursor, Windsurf (Devin Desktop), FLUX — in both languages. Directory 11 → 14 tools, and the `coding` category got a real page for the first time |
| 2026-08-06 | `Article` schema for the comparison pages, plus `CollectionPage` with an embedded `ItemList` for the landing page. Added `article()` and `collectionPage()` to `src/lib/schema.ts` |
| 2026-08-06 | **Editorial scores**: every comparison displays 0–10 scores alongside a visible "how do we score?" box making clear this is an editorial assessment rather than a user vote — the same principle behind refusing a fabricated `aggregateRating` |
| 2026-08-06 | Automated check across the 106 pages: all JSON-LD valid, one block per page, every marked-up FAQ question and breadcrumb genuinely visible in the text, 0 broken internal links, one `h1` per page, and canonical + hreflang on all of them |
| 2026-08-06 | Automated check across the 88 generated pages: all JSON-LD valid, one block per page, every marked-up step / question / breadcrumb genuinely present in the page text (0 errors), and 0 broken internal links |
| 2026-08-06 | **Phase 6 — fonts item**: moved from a Google Fonts link loading 5 families on every page to self-hosting with 3 families per language. Added `scripts/build-fonts.mjs` (generated from `@fontsource`, run via `prebuild`), `preload` for two above-the-fold fonts, and a one-year cache header for `/fonts/*`. Weights were matched to actual usage: 3 dead weights removed and 2 missing weights added that had been causing faux bold |
| 2026-08-06 | Automated post-build verification: 88 pages, each carrying exactly 3 families and the correct set for its language, 0 references to `fonts.googleapis.com`/`gstatic`, every referenced font file present, 0 orphan font files, and `preload` ahead of the AdSense/GA scripts on every page |
| 2026-08-07 | **3 new PDF tools** in both languages (6 new indexable pages): extract pages (`/pdf-tools/extract-pages`), delete pages (`/pdf-tools/delete-pages`), organize pages (`/pdf-tools/organize-pdf`). Each page has a unique title and description, 4 visible steps + `HowTo`, 4 FAQs + `FAQPage`, and visible breadcrumbs + `BreadcrumbList`. PDF tools: 6 → 9 |
| 2026-08-07 | **Unified PDF tool catalogue** (`src/data/pdf-tools.ts`) — the same list had been duplicated in four places. The internal link chain is now derived from it: 3 outbound and 3 inbound per tool, closed and symmetric, with no manual maintenance |
| 2026-08-07 | **`scripts/verify-seo.mjs`**: an automated check of the generated HTML covering one valid `@graph` per page, a self-referencing canonical, ar/en/x-default hreflang, one `h1`, sitemap/`noindex` agreement, 0 broken links, and that every marked-up step / question / breadcrumb genuinely appears in the visible text. Result: 156 pages, 2,649 assertions, 0 failures |
| 2026-08-07 | Corrected three documentation lines that had fallen behind reality: the Support page was built but described as "not started", `tutorials` was indexed but described as `noindex`, and the deferral of the PDF engines was implemented but marked `⬜` |
| 2026-08-07 | **3 new PDF tools** in both languages (6 new indexable pages): compress (`/pdf-tools/compress-pdf`), lock (`/pdf-tools/lock-pdf`), unlock (`/pdf-tools/unlock-pdf`). PDF tools: 11 → 14, leaving only Add Text. Each with a unique title and description, 4 visible steps + `HowTo`, 4 FAQs + `FAQPage`, and visible breadcrumbs + `BreadcrumbList` |
| 2026-08-07 | Post-build verification re-run: **166 pages, 2,891 assertions, 0 failures**, 0 broken links, and the PDF related-link chain still closed and symmetric at 14 tools |
| 2026-08-07 | The encryption engine (`@cantoo/pdf-lib`, 488 kB emitted) is confined to the Lock and Unlock pages by a dynamic import. Verified against the built HTML: every tool page ships 5–9 kB of eager JavaScript, with no `modulepreload` and no heavy chunk on any critical path |
| 2026-08-07 | **2 new PDF tools** in both languages (4 new indexable pages): crop (`/pdf-tools/crop-pdf`), page numbers (`/pdf-tools/page-numbers`). Each with a unique title and description, 4 visible steps + `HowTo`, 4 FAQs + `FAQPage`, and visible breadcrumbs + `BreadcrumbList`. PDF tools: 9 → 11, and both were picked up by the hub grids, the homepage quick actions and the related-link chain from the single catalogue edit |
| 2026-08-07 | Post-build verification re-run with the new pages: **160 pages, 2,747 assertions, 0 failures**, 0 broken links, and the PDF related-link chain still closed and symmetric at 11 tools (exactly 3 inbound and 3 outbound each, no self-links) |
| 2026-08-07 | The two new tool pages keep the PDF engines off the critical path like the rest: ~2.4 kB of eager JavaScript each, with pdf-lib (428 kB) and pdf.js (330 kB) still emitted as separate chunks fetched only once a file is chosen |
| 2026-08-07 | Removed the "Choose an Amount" grid from `/support` in both languages — 5 links per page pointing at the same Ko-fi URL, i.e. 10 redundant outbound duplicates. The page keeps one Ko-fi CTA in the hero and one in the community section |
