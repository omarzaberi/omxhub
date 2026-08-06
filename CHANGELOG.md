# CHANGELOG

All notable changes to OMXHub are documented in this file.

> Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Entries are
> grouped by the date the work shipped. This file records **what has already been done** —
> the vision it serves lives in `BLUEPRINT.md`, the search strategy behind it in `SEO.md`,
> and everything still ahead in `IDEAS.md`.

---

## 2026-08-07

### Added
- **Three PDF page-management tools**, in both languages — Extract Pages (`/pdf-tools/extract-pages`),
  Delete Pages (`/pdf-tools/delete-pages`), Organize Pages (`/pdf-tools/organize-pdf`).
  PDF tools: **6 → 9**. Six new indexable pages, each with a unique title and description,
  four visible steps plus `HowTo`, four FAQs plus `FAQPage`, and visible breadcrumbs plus
  `BreadcrumbList`.
- **One shared interaction module for page management** (`src/lib/pdf-page-grid.ts`):
  pdf.js thumbnails, selection, and drag-or-button reordering. Extract / Delete / Organize
  keep only the few lines of pdf-lib that genuinely differ between them. Reordering never
  depends on drag-and-drop alone — every page also has explicit move buttons, so the tools
  work by keyboard and on touch.
- **A single source of truth for the PDF tool catalogue** (`src/data/pdf-tools.ts`).
- **Official tool logos** — a `ToolLogo` component backed by a `logos.ts` source, so directory
  cards, category pages, search results, comparisons, and tool detail pages all render the
  same official mark from one place instead of per-page markup.
- **Scripted post-build verification** (`scripts/verify-seo.mjs`), replacing ad-hoc checking.
  It inspects every built page for one valid `@graph`, a self-referencing canonical,
  ar/en/x-default hreflang, exactly one `h1`, sitemap/`noindex` agreement, zero broken internal
  links, and that every marked-up step, FAQ question and breadcrumb really appears in the
  visible text. Result: **156 pages, 2,649 assertions, 0 failures.**

### Changed
- **Internal linking for PDF tools is now derived, not hand-maintained.** `relatedPdfTools()`
  walks the catalogue and wraps around, giving every tool exactly **3 outbound and 3 inbound**
  related links — a closed, symmetric chain in which no PDF tool can become orphaned as the
  set grows. Previously each page carried a hand-written `related` array and some tools had
  only two links.
- The two `/pdf-tools` hub pages, the homepage quick-actions grid, and every tool page's
  related list all derive from the catalogue, so adding a tool is now a one-file change.

### Fixed
- Three documentation lines that had fallen behind reality: the Support page was built but
  documented as "not started", `tutorials` was indexable but documented as `noindex`, and the
  deferred loading of the PDF engines was implemented but still marked ⬜.

### Removed
- The duplicated PDF tool list, previously maintained by hand in four separate places — both
  `/pdf-tools` hub pages, the homepage quick-actions grid, and a bespoke `related` array on
  every tool page.

---

## 2026-08-06

### Added
- **Comparisons section** (`/comparisons`) — the highest-intent SEO surface on the site.
  A landing page with hero, in-page search, featured / latest / popular rails, category
  filters, scoring methodology, and a CTA into the AI directory; search and filtering run over
  pre-rendered HTML (no fetch, no index file), so every comparison is crawlable on first paint.
  5 comparisons × 2 languages = **10 pages**, each with 10 sections: hero and quick picks,
  summary card, 18-row side-by-side table, pros and cons, best use cases, performance scores,
  audience recommendations, related comparisons, FAQ, and related pages. Two shared templates
  (`ComparisonsIndex.astro`, `ComparisonDetail.astro`) drive both locales.
- **Tutorials section** (`/tutorials`) — the top-of-funnel counterpart to comparisons.
  A landing page with hero, in-page search, level *and* category filters, featured / latest
  rails, category cards, and a CTA into the AI directory; filtering moves the pre-rendered card
  nodes into a results grid rather than cloning them, so no card exists twice in the DOM.
  5 tutorials × 2 languages = **10 pages**: how to use Claude, prompt-engineering basics,
  Cursor for beginners, writing Arabic with AI, and editing PDFs without uploading. Each page
  carries takeaways, prerequisites, an editorial body, numbered steps, a "common mistakes"
  block, FAQ, and resolved links into tools / comparisons / prompts. Two shared templates
  (`TutorialsIndex.astro`, `TutorialDetail.astro`) drive both locales.
- **3 new AI tools**: Cursor, Windsurf (Devin Desktop), and FLUX, in both languages. Directory
  **11 → 14**, and the `coding` category got a real page for the first time.
- **16 further AI tools**, taking the directory **14 → 30**. All 7 categories are now populated,
  so every category landing page is live.
- **Structured data foundation** — all JSON-LD generated from one module (`src/lib/schema.ts`)
  and emitted as a single `@graph` per page via the `schema` prop on `Layout`:
  `WebSite` + `SearchAction`, `Organization`, `SoftwareApplication` + editorial `Review`,
  `HowTo`, `FAQPage`, `BreadcrumbList`, `CollectionPage`, and `Article`. The governing rule:
  only mark up content that is actually visible on the page.
- `public/logo.png` (512×512, matching the favicon identity) for the `Organization` markup,
  alongside founder and contact-email fields.
- **A visible "how to use it" section on every PDF tool** — four real steps in both languages
  (12 pages) — with `HowTo` markup that mirrors those visible steps literally.
- **Visible breadcrumbs plus `BreadcrumbList`** across the remaining internal pages (78 pages):
  tools, prompts, PDF tools, contact, support, and privacy.
- **Custom 404 page** in both languages, with live search and section links, `noindex`, excluded
  from the sitemap, plus a `netlify.toml` rule that serves the English 404 for any broken
  `/en/*` URL — verified live after deployment.
- **Editorial 0–10 scores** on every comparison, with a visible "how we score" box stating that
  these are editorial judgements rather than user votes — the same principle behind our refusal
  to publish a fabricated `aggregateRating`.
- `scripts/build-fonts.mjs` — reads the required `.woff2` files from `@fontsource`, copies only
  those into `public/fonts/`, and generates `src/styles/fonts-ar.css` and `fonts-en.css`. Runs
  automatically before every build via `prebuild`.
- `src/lib/pdf-libs.ts` — dynamic imports for pdf-lib (418 KB), pdf.js (322 KB) and JSZip (94 KB),
  warmed the moment a file is selected, so the engines ship as separate chunks and never enter
  the early module graph of any page.
- **Google Search Console**: ownership verified via DNS TXT record and `sitemap-index.xml`
  submitted. Setup documented in `docs/SEARCH-CONSOLE.md`.

### Changed
- The homepage search now reads `?q=` from the URL, so the `SearchAction` in the schema points
  at a real endpoint rather than a decorative one.
- The Arabic and English `ai-tools/[slug]` pages merged into one `ToolDetail.astro` component;
  they had been duplicates of 202 lines each.
- **Fonts moved from Google Fonts to self-hosting**: from a third-party link loading 5 families
  on every page to 3 families per language — 14 files for Arabic (IBM Plex Sans Arabic, Tajawal,
  JetBrains Mono), 8 for English (Inter, Space Grotesk, JetBrains Mono). `font-display: swap`,
  two above-the-fold fonts preloaded ahead of the AdSense and GA scripts, the stylesheet inlined
  so first paint waits on no network round trip, and a one-year cache header on `/fonts/*`.
  An Arabic page now never downloads Inter or Space Grotesk, and vice versa; the Latin subset
  ships with the Arabic fonts so tool names inside Arabic text render in the same typeface.
- `tutorials` and `comparisons` left placeholder status: `noindex` removed and both dropped from
  the sitemap filter, giving 24 newly indexable pages (two landing pages and ten detail pages
  per section).
- Font weights matched to real usage — see *Removed* and *Fixed* below.

### Fixed
- Inter 700 and JetBrains Mono 700 were missing from the font set, so the browser had been
  synthesising faux bold on English pages and in badges. Both are now shipped properly.

### Removed
- `fonts.googleapis.com` and `fonts.gstatic.com` — no third-party connection remains in the
  render path.
- Three font weights nothing on the site actually used: Tajawal 400/500, Space Grotesk 500,
  and JetBrains Mono 500.

> **Verification for this day.** Automated post-build checks across the 106 and then 88 generated
> pages: every JSON-LD block valid, exactly one block per page, every marked-up step, FAQ question
> and breadcrumb present in the visible text, one `h1` per page, canonical and hreflang everywhere,
> and 0 broken internal links. Font audit across 88 pages: exactly 3 families per page and the
> correct set for its language, 0 references to `fonts.googleapis.com`/`gstatic`, every referenced
> font file present, 0 orphan font files, and `preload` ordered ahead of the AdSense/GA scripts on
> every page. **Rich Results Test (live)**: `omxhub.com` → *Organization* valid, zero errors;
> `omxhub.com/ai-tools/chatgpt` → *3 valid items* — Breadcrumbs, Review snippets, Software Apps —
> zero errors. Review snippets appearing as an independent group means the rating stars are
> genuinely eligible to show in search results. The single warning,
> `Missing field "aggregateRating" (optional)`, is **deliberate**: filling it without real user
> ratings would breach Google's policy.

---

## 2026-08-05

### Added
- **`SEO.md`** — the practical search plan. It covers *how* we rank; the Blueprint covers
  *what* we build.
- **SEO technical foundation**, implemented centrally in `src/layouts/Layout.astro` through new
  `image`, `noindex` and `schema` props so it applies to every page: self-referencing canonical
  URLs, `hreflang` for ar / en / x-default, Open Graph tags, Twitter Cards
  (`summary_large_image`), a default 1200×630 `og:image`, and robots meta.
- **Category pages** `/ai-tools/category/<slug>` in both languages — targeted `h1`, a unique
  editorial introduction, breadcrumbs, and schema (`BreadcrumbList` + `CollectionPage`).
  Generated only for categories that actually contain tools, so an empty listing page cannot
  exist.
- **Google Analytics 4** (`G-W8MG2DBF3F`).
- `docs/SEARCH-CONSOLE.md` — the Search Console setup guide, which also covers importing the
  property into Bing Webmaster Tools.
- `noindex, follow` plus sitemap exclusion on the empty placeholder sections (`ai-news`,
  `comparisons`, `tutorials`), so no thin page ever enters the index.

### Changed
- Homepage redesigned.
- Titles and descriptions reviewed across every page: ≤60 characters for titles, 120–160 for
  descriptions, and no description repeating its own title. Tool pages received richer titles.
- The homepage title now covers both pillars of the site (AI and PDF), and the footer line uses
  the official tagline.
- The sitemap aligned with the canonicals (no trailing slash) so the two can no longer send
  conflicting signals.
- AI tool entries expanded with fuller editorial content — features, pricing, pros and cons,
  alternatives, and FAQs.

### Fixed
- 14 broken links (404) on the homepage that pointed at categories which did not exist.

---

## 2026-08-04

### Added
- **PDF Tools — the first six**, in both languages, plus the `/pdf-tools` hub: Merge, Split,
  Rotate, Watermark, Images→PDF, and PDF→Images. All of them run entirely in the browser:
  no backend, no paid API.
- **Support OMXHub page** (`/support`), in both languages — hero, suggested amounts linking to
  ko-fi.com/omxhub, "why support" cards, a public roadmap, and a community CTA. It follows the
  Blueprint's UX rule exactly: no donation popups, with the Ko-fi link appearing only under each
  PDF tool, in the footer, and on this page.
- **About** and **Contact** pages.
- **Google AdSense** script.

### Changed
- Privacy Policy updated to be AdSense-ready.
- Search bar behaviour and the site name / contact email.

### Fixed
- Logo rendering and the search bar.

### Removed
- Empty placeholder pages with no real content behind them.

---

## 2026-08-03

### Added
- **Initial OMXHub site on Astro**, deployed to Netlify from GitHub.
- **Bilingual architecture** (Arabic / English) with a language toggle.
- **Dark theme as the default**, with a light/dark toggle and the modern tech colour scheme
  replacing the original navy/gold palette.
- **AI Directory** with tool detail pages generated from Astro Content Collections.
- **Prompt Library** — 10 prompts in both languages, each with a copy button.
- **Live site search**, filtering in real time across tools and prompts.
- Sitemap integration (`@astrojs/sitemap` → `/sitemap-index.xml`), `robots.txt`, `netlify.toml`,
  and `site` set to `https://omxhub.com` in `astro.config`.

### Fixed
- Arabic font rendering in the search bar.
