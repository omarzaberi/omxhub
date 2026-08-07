# 🚀 OMXHub – Master Project Blueprint

> This is the long-term reference plan for OMXHub. Update the "Progress Log" section
> at the bottom as features ship — don't edit the core vision/structure without
> discussing it first, since everything else is built against this plan.

## Documentation Map

| File | Covers |
|---|---|
| `BLUEPRINT.md` *(this file)* | Long-term product vision and roadmap — **what** we build |
| `CLAUDE.md` | Development workflow and project rules — how we work |
| `SEO.md` | Search strategy and implementation — **how** we rank |
| `CHANGELOG.md` | Complete history of completed work, by date |
| `IDEAS.md` | Future backlog: ideas, experiments, and feature requests |

Rule of thumb: an idea starts in `IDEAS.md`, ships into `CHANGELOG.md`, and only the
Blueprint's vision and Progress Log summary change here.

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

## AI Tool Badges
Every AI tool card and tool detail page should display contextual badges to help users quickly understand the tool at a glance.

### Available Badges
- 🆓 Free — Completely free to use.
- 💰 Freemium — Free plan available with paid upgrades.
- 💳 Paid — Requires a paid subscription.
- ⭐ Editor's Choice — Personally recommended by the OMXHub editorial team.
- 🔥 Trending — Currently popular or rapidly growing.
- 🆕 New — Recently launched or newly added to OMXHub.
- 🇸🇦 Arabic Support — Offers good Arabic language support or interface.
- 🚀 Best for Beginners — Recommended for users who are just getting started.
- ⚡ No Sign-up Required — Can be used instantly without creating an account.

### Badge Rules
- Display a maximum of **3 badges per tool card** to keep the interface clean.
- Badge data must come from the tool metadata (single source of truth), never hardcoded in UI components.
- The same badge system must automatically power:
  - AI Directory cards
  - Category pages
  - Search results
  - Comparison pages
  - Tool detail pages
- Badges must be fully localized (Arabic and English).
- Badge colors, icons, and styling must remain consistent across the entire website.

### Editorial Guidelines
- **Editor's Choice** should be assigned to only 5–10% of all tools.
- **Trending** should be reviewed periodically as trends change.
- **New** should automatically expire after 60–90 days unless manually renewed.
- **Arabic Support** should only be shown when the tool genuinely provides a good Arabic experience.
- **Best for Beginners** should only be assigned to tools with an intuitive interface and low learning curve.
- **No Sign-up Required** should only appear when the core functionality is accessible without creating an account.

### Future Filtering
Design the badge system so it also powers future filtering across the AI Directory.
Users should be able to filter tools by:
- Free
- Freemium
- Paid
- Trending
- New
- Editor's Choice
- Arabic Support
- Best for Beginners
- No Sign-up Required

Implementation Requirements:
- Treat badges as structured metadata, not presentation-only elements.
- Store badges as part of each tool's data model.
- Avoid duplicated logic across components.
- Ensure the system is scalable for 1,000+ AI tools.
- Keep the implementation consistent with OMXHub's existing "Single Source of Truth" architecture used elsewhere in the project.

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
- **No suggested-amount tiers.** The amount is chosen on Ko-fi, not here — a preset grid on
  our page only adds a redundant step and reads as a price list on a page that is a thank-you,
  not a checkout.
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

> This is the state-of-the-site summary. The dated, entry-by-entry history lives in
> `CHANGELOG.md`; anything still unbuilt is tracked in `IDEAS.md`.

**As of August 2026:**
- ✅ Site live on Astro + Netlify, bilingual (AR/EN), dark theme default + toggle
- ✅ AI Directory: **30 tools live** (of 1000+ goal) — ChatGPT, Claude, Gemini, Grok,
  DeepSeek, Perplexity, Midjourney, FLUX, Adobe Firefly, Canva AI, Runway, Kling AI,
  Google Veo, HeyGen, Opus Clip, ElevenLabs, Suno, Cursor, Windsurf, GitHub Copilot,
  Lovable, Microsoft Copilot, Notion AI, Gamma, Grammarly, Jasper, AdCreative AI,
  Semrush, Surfer SEO, NotebookLM. All 7 categories are populated, so every category
  landing page is live.
- ✅ Prompt Library: 10 prompts live
- ✅ PDF Tools (Phase 1, nearly complete): **14 of 15 live** — Merge, Split, Extract Pages,
  Delete Pages, Organize Pages, Rotate, Crop, Compress, Watermark, Page Numbers, Lock,
  Unlock, Images→PDF, PDF→Images — all working entirely client-side. **Not yet built:**
  Add Text, and only that.
- 🟡 **Image Tools (Phase 2, opened): 1 live** — Compress (`/image-tools/compress-image`),
  client-side via Canvas with no new dependency. Convert, Resize and Crop are next and reuse
  the same decode/encode path.
  - **The section was opened instead of finishing PDF Phase 1.** Add Text is the last PDF
    tool and it is blocked on Arabic text shaping: doing it properly costs 600 kB–1 MB on a
    single page (see `IDEAS.md`), which would make a minor tool the heaviest thing on the
    site. Image tools cost nothing extra — Canvas is already in every browser — so the next
    unit of user value was cheaper one category over.
  - **`ToolLayout.astro` was extracted when the second section arrived**, rather than
    copying 500 lines of tool CSS. `PdfToolLayout` and `ImageToolLayout` are now thin
    wrappers over it with unchanged props, so none of the 28 PDF pages were touched.
  - **Compress does not take the trade-off the plan assumed.** It was filed as "rasterise
    pages through pdf.js, destroying selectable text and possibly growing text-only PDFs".
    Measuring first showed a third way: almost all the bytes in a large PDF are in its
    images, and those can be recompressed individually — **−70.6% on a scan with the text
    left fully selectable**, against 0.0% for a pdf-lib re-save. The tool also refuses to
    return a file larger than it was given, and says up front when a document has nothing
    worth compressing.
  - **Lock and Unlock use a second engine, loaded only where it is needed.** pdf-lib has no
    encryption support, so those two pages use `@cantoo/pdf-lib`. It is a superset and could
    have replaced pdf-lib everywhere — which is exactly why it was worth *not* doing: the
    fork is 272 kB gzipped against 206 kB, so a site-wide swap would tax twelve tools to
    serve two. Two documented limits, both pinned by tests: encryption is **AES-128**, not
    AES-256; and unlocking rebuilds the document, so bookmarks, form fields and metadata do
    not survive.
  - **Add Text is a font decision, not a drawing task** — which is why it is the one left.
    pdf-lib's standard fonts are WinAnsi-encoded and cannot represent Arabic at all, and
    embedding a font does not fix it: pdf-lib performs no shaping or bidi, so Arabic would
    render as disconnected letters in reverse order. Doing it properly costs roughly
    600 kB–1 MB on that page (fontkit alone is 328 kB gzipped — larger than pdf-lib — plus
    an Arabic TTF, a reshaper and a bidi pass). On a site that holds Lighthouse at 95+, that
    is a deliberate call to make, not a detail to slip in while finishing a set.
- ✅ **Page rotation is handled, not ignored** (`src/lib/pdf-geometry.ts`). A page's
  `/Rotate` entry turns the content for the viewer without moving it, so pdf-lib writes
  into one coordinate system while the user picks coordinates in another. Both placement
  tools translate between the two through one module and work purely in the coordinates
  the reader sees — which is why a page number lands under a rotated scan rather than
  sideways along its edge, and a crop taken off the visual top comes off the top.
  The mappings are pinned by tests that check the real pdf-lib output against an
  independently derived rotation matrix.
- ✅ **PDF tool catalogue is a single source of truth** (`src/data/pdf-tools.ts`). The tool
  list used to be maintained by hand in four places — both `/pdf-tools` hub pages, the
  homepage quick-actions grid, and a bespoke `related` array on every tool page. All four
  now derive from the catalogue, so adding a tool is a one-file change. `relatedPdfTools()`
  walks the catalogue and wraps around, giving every tool exactly 3 outbound and 3 inbound
  related links — a closed chain in which no PDF tool can become orphaned as the set grows.
- ✅ **Crop shares one interaction module too** (`src/lib/pdf-crop-box.ts`): a pdf.js
  preview with a draggable, resizable rectangle. As with reordering, dragging is never the
  only way in — four percentage fields are bound to the same state in both directions and
  are the keyboard-accessible mechanism, while the corner handles are `aria-hidden`
  because assistive technology cannot perform that gesture. The crop is stored as
  *fractions* of each page, so "apply to every page" stays correct on a document whose
  pages are not all the same size.
- ✅ **Page-management tools share one interaction module** (`src/lib/pdf-page-grid.ts`):
  pdf.js thumbnails, selection, and drag-or-button reordering. Extract / Delete / Organize
  keep only the few lines of pdf-lib that genuinely differ. Reordering never depends on
  drag-and-drop alone — every page also has explicit move buttons, so the tool works by
  keyboard and on touch.
- ✅ Live site search (real-time filtering across tools + prompts)
- ✅ About, Contact, Privacy Policy (AdSense-ready) pages
- ✅ Google AdSense script installed
- ✅ Support/Ko-fi page (`/support`, both languages) — hero with a single Ko-fi CTA,
  "why support" cards, public roadmap, and a community CTA. Follows the blueprint's
  UX rule: no popups, and the Ko-fi link appears only under each PDF tool,
  in the footer, and on this page
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
- ✅ **Post-build verification is scripted**, not ad hoc (`scripts/verify-seo.mjs`): checks
  every built page for one valid `@graph`, a self-referencing canonical, ar/en/x-default
  hreflang, exactly one `h1`, sitemap/`noindex` agreement, zero broken internal links, and
  that every marked-up step, FAQ question and breadcrumb really appears in the visible text.
  Currently 166 pages, 2,891 assertions, 0 failures. Six unit-test files (185 assertions) run
  *before* the build so they fail fast: the rotation geometry, the text-encoding guard, the
  crop state machine, the compression surgery, the encryption round trip, and an end-to-end
  check that reads what the tools actually wrote into a PDF back out of its content stream.
- ✅ **A password-protected PDF gets a true error message.** pdf-lib cannot read encrypted
  files and does not fail cleanly on one — it fails mid-parse, so every tool used to report
  that the document was invalid. It was not; it was locked. Every tool now detects this and
  points at the Unlock tool instead.
