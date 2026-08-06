# 🚀 OMXHub – Master Project Blueprint

> This is the long-term reference plan for OMXHub. Update the "Progress Log" section
> at the bottom as features ship — don't edit the core vision/structure without
> discussing it first, since everything else is built against this plan.

## Project Vision
Build OMXHub into the leading AI & Productivity platform, combining an AI tools
directory, free online productivity tools, learning resources, prompt libraries,
and technology content in one modern platform. Fast, SEO-optimized, scalable,
mobile-first, designed for long-term growth.

## Core Mission
Help people discover AI, use powerful online tools for free, and improve
productivity through a single, beautiful platform.

## Brand Identity
- **Name:** OMXHub
- **Domain:** OMXHub.com
- **Tagline:** Discover. Create. Simplify. *(alt: AI Tools & Productivity in One Place.)*

## Target Audience
Students, Professionals, Developers, Designers, Content Creators, Businesses, AI Enthusiasts

## Languages
🇺🇸 English · 🇸🇦 Arabic

## Design Style
Inspired by Futurepedia, TinyWow, Product Hunt, Notion, Linear, Vercel.
Premium · Minimal · Dark Mode First · Glassmorphism · Smooth Animations ·
Responsive · Mobile First · Accessibility (WCAG) · Lightning Fast

## Tech Stack
- **Framework:** Astro
- **UI:** React components where needed, TailwindCSS, TypeScript
- **PDF:** pdf-lib, pdf.js
- **Deployment:** GitHub → Netlify
- **Analytics:** Google Analytics, Google Search Console
- **SEO:** Dynamic sitemap, robots.txt, Schema.org, Open Graph, canonical URLs

## Website Structure
- Home
- AI Tools
- Free Tools
  - PDF Tools · Image Tools · Video Tools · Audio Tools · Text Tools · Developer Tools · SEO Tools · File Converters
- Prompt Library
- Tutorials
- Comparisons
- Blog
- AI News
- Support OMXHub
- About / Contact

## Homepage Sections
Hero · Global Search · Trending AI Tools · Featured AI Tools · Categories ·
Latest AI News · Latest Tutorials · Popular Prompts · Free Productivity Tools ·
Newsletter · Footer

## AI Directory
**Goal:** 1000+ AI tools. Each tool page includes: description, features, pricing,
screenshots, pros, cons, alternatives, FAQ, official website link, categories, tags,
related tools.

## Free Tools Roadmap

### Phase 1 — PDF Tools (Priority)
Merge · Split · Compress · Rotate · Delete Pages · Extract Pages · Organize Pages ·
Add Watermark · Add Text · Lock PDF · Unlock PDF · PDF↔Images · Crop · Add Page Numbers
**Rule: all must work entirely in-browser. No backend. No paid API.**

### Phase 2 — Image / Video / Audio Tools
- Image: Remove Background, Upscaler, Compress, Crop, Resize, Convert, Watermark, OCR
- Video: Compress, Trim, Convert, Extract Audio, GIF Maker
- Audio: Converter, Cutter, Volume Booster, Noise Reduction

### Phase 3 — Text / Developer / SEO Tools
- Text: Word Counter, Character Counter, Case Converter, Grammar Checker, AI Summarizer, AI Paraphraser
- Developer: JSON Formatter, JWT Decoder, Base64 Encoder, UUID Generator, QR Generator, Hash Generator, Regex Tester
- SEO: Meta Generator, Open Graph Generator, Robots.txt Generator, Sitemap Generator

## Content Sections
- **Prompt Library:** organized by tool (ChatGPT, Claude, Gemini, Midjourney, Cursor, Bolt, Lovable)
- **Tutorials:** Learn AI, Learn ChatGPT, Learn Claude, Prompt Engineering, Automation Guides
- **Comparisons:** e.g. ChatGPT vs Claude, Claude vs Gemini, Canva AI vs Adobe Firefly, Midjourney vs Flux
- **Blog:** content ideas, reviews, top AI tools, productivity tips, AI news, buying guides

## Universal Search
Should search across: AI Tools, PDF Tools, Blog, Tutorials, Prompts.
Instant results, filters, categories, tags.

## ❤️ Support OMXHub (`/support`)
Goal: let users voluntarily support the project so tools stay free forever.
- **Platform:** Ko-fi → ko-fi.com/omxhub (payments via PayPal/Ko-fi-supported methods)
- Suggested amounts: ☕ $2 / $5 / $10 · 🚀 $20 · ❤️ Custom
- Sections: Hero, "Why Support" (Development / Infrastructure / New Features / Security),
  Public Roadmap (Completed / In Progress / Upcoming), Community CTA, Footer thank-you

**UX rule (important): NO donation popups.** Only show the Ko-fi button:
after successfully using a tool, on `/support`, in the footer, on `/about`, and
occasionally below blog posts. Friendly framing only — never interruptive.

## Monetization Strategy
- **Phase 1:** Google AdSense, Affiliate Marketing, Ko-fi Support
- **Phase 2:** Featured Listings, Sponsored Articles, Newsletter Sponsorship
- **Phase 3:** Premium Membership, Prompt Packs, Digital Products, Templates, API Access

## SEO Strategy
Every feature gets its own indexable page/URL, e.g.:
`/tools/chatgpt` · `/pdf/merge-pdf` · `/image/remove-background` ·
`/video/compress-video` · `/prompts/chatgpt` · `/tutorials/how-to-use-claude` ·
`/blog/best-ai-tools` · `/news/openai`
**Goal: thousands of indexable pages.**

## Performance Goals
Lighthouse 95+ · Excellent Core Web Vitals · Lazy loading · Image optimization ·
Code splitting · Fast navigation

## What NOT to Build (Yet)
❌ Backend authentication · ❌ Complex dashboards · ❌ OCR requiring paid APIs ·
❌ PDF→Word/Excel via paid engines · ❌ Expensive AI APIs before traffic justifies them
**Focus on features that run in the browser and provide immediate value.**

## Growth Roadmap
- **Month 1:** Launch site, AI Directory, first 15 PDF tools
- **Month 2:** 100 AI tool pages, launch Blog, enable AdSense
- **Month 3:** Image Tools, launch Prompt Library, start Affiliate Marketing
- **Month 4:** Video & Audio Tools, tutorials & comparisons
- **Month 5–6:** 300+ AI tools, expand SEO, launch newsletter
- **Month 7–12:** Premium membership, browser extension, mobile app planning

## Final Guiding Principle
Every new feature must help users accomplish a real task — not just read about it.
Build quality before quantity, keep the experience fast and simple, and grow the
platform one polished feature at a time.

---

## 📍 Progress Log (updated as we ship)

**As of August 2026:**
- ✅ Site live on Astro + Netlify, bilingual (AR/EN), dark theme default + toggle
- ✅ AI Directory: **30 tools live** (of 1000+ goal) — ChatGPT, Claude, Gemini, Grok,
  DeepSeek, Perplexity, Midjourney, FLUX, Adobe Firefly, Canva AI, Runway, Kling AI,
  Google Veo, HeyGen, Opus Clip, ElevenLabs, Suno, Cursor, Windsurf, GitHub Copilot,
  Lovable, Microsoft Copilot, Notion AI, Gamma, Grammarly, Jasper, AdCreative AI,
  Semrush, Surfer SEO, NotebookLM. All 7 categories are populated, so every category
  landing page is live.
- ✅ Prompt Library: 10 prompts live
- ✅ PDF Tools (Phase 1, partial): Merge, Split, Rotate, Watermark, Images→PDF, PDF→Images
  — all tested working entirely client-side. **Not yet built:** Compress, Delete Pages,
  Extract Pages, Organize Pages, Add Text, Lock/Unlock PDF, Crop, Page Numbers
- ✅ Live site search (real-time filtering across tools + prompts)
- ✅ About, Contact, Privacy Policy (AdSense-ready) pages
- ✅ Google AdSense script installed
- ⬜ Support/Ko-fi page — not started
- ✅ **Comparisons section live** (`/comparisons`) — the highest-intent SEO surface on the site:
  - Landing page: hero, in-page search, featured / latest / popular rails, category filters,
    scoring methodology, and a CTA into the AI directory. Search and filtering run over
    pre-rendered HTML (no fetch, no index file), so every comparison is crawlable on first paint.
  - 5 comparisons × 2 languages = 10 pages, each with 10 sections: hero + quick picks,
    summary card, 18-row side-by-side table, pros & cons, best use cases, performance scores,
    audience recommendations, related comparisons, FAQ, and related pages.
  - Two shared templates (`ComparisonsIndex.astro`, `ComparisonDetail.astro`) drive both
    locales — the same single-source pattern as `ToolDetail` and `CategoryListing`.
  - **Scores are labelled editorial**, with a visible "how we score" box. Consistent with our
    refusal to fake `aggregateRating`.
  - **No `/comparisons/category/<x>` routes** — with this few entries they'd be thin content.
    Category pills filter in place; promote to real routes once a category earns one.
- ✅ **Tutorials section live** (`/tutorials`) — the top-of-funnel counterpart to comparisons:
  - Landing page: hero, in-page search, level *and* category filters, featured / latest rails,
    category cards, and a CTA into the AI directory. Filtering moves the pre-rendered card
    nodes into a results grid rather than cloning them, so no card exists twice in the DOM
    and every tutorial is crawlable on first paint — no fetch, no index file.
  - 5 tutorials × 2 languages = 10 pages: how to use Claude, prompt-engineering basics,
    Cursor for beginners, writing Arabic with AI, and editing PDFs without uploading.
  - Each page carries: takeaways, prerequisites, editorial body, numbered steps, a
    "common mistakes" block, FAQ, and resolved links into tools / comparisons / prompts.
  - Two shared templates (`TutorialsIndex.astro`, `TutorialDetail.astro`) drive both locales.
  - **`HowTo` is emitted only when the page really has visible numbered steps.** Prerequisites
    are deliberately *not* marked up as `HowToTool` — they are prose conditions, not instruments.
  - **No `/tutorials/category/<x>` or `/tutorials/level/<x>` routes** — thin content at this
    size. The pills filter in place; promote to real routes once a facet earns one.
  - The `edit-pdf-without-uploading` tutorial exists partly to feed the PDF tools: it turns
    readers into users, which is the blueprint's guiding principle.
- ⬜ Blog, AI News — not started (pages `noindex` until real content ready)
- ⬜ Image/Video/Audio/Text/Developer/SEO tools (Phase 2/3) — not started
- ✅ Google Search Console: ownership verified via DNS TXT, sitemap submitted
- ✅ SEO technical foundation: canonical URLs, hreflang (ar/en/x-default), Open Graph,
  Twitter Cards, default og:image, robots meta, noindex on placeholder pages,
  sitemap filtered + aligned with canonicals. Full plan tracked in `SEO.md`.
- ✅ Structured data (Schema.org): all JSON-LD generated from one module
  (`src/lib/schema.ts`) and emitted as a single `@graph` per page — `WebSite` +
  `SearchAction`, `Organization`, `SoftwareApplication` + editorial `Review`,
  `HowTo`, `FAQPage`, `BreadcrumbList`, `CollectionPage`. We only mark up content
  that is actually visible on the page.
- ✅ Custom 404 page in both languages, with live search and section links
- ✅ Every PDF tool now has a visible "how to use it" section (4 real steps, both
  languages) — better for users, and the basis for the `HowTo` markup
