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
- ✅ AI Directory: 10 tools live (of 1000+ goal) — ChatGPT, Claude, Gemini, Midjourney,
  Canva AI, DeepSeek, Perplexity, ElevenLabs, Runway, Microsoft Copilot, Notion AI (11 now)
- ✅ Prompt Library: 10 prompts live
- ✅ PDF Tools (Phase 1, partial): Merge, Split, Rotate, Watermark, Images→PDF, PDF→Images
  — all tested working entirely client-side. **Not yet built:** Compress, Delete Pages,
  Extract Pages, Organize Pages, Add Text, Lock/Unlock PDF, Crop, Page Numbers
- ✅ Live site search (real-time filtering across tools + prompts)
- ✅ About, Contact, Privacy Policy (AdSense-ready) pages
- ✅ Google AdSense script installed
- ⬜ Support/Ko-fi page — not started
- ⬜ Blog, AI News, Comparisons, Tutorials — not started (pages removed until real content ready)
- ⬜ Image/Video/Audio/Text/Developer/SEO tools (Phase 2/3) — not started
- ⬜ Google Search Console submission — not confirmed
- ✅ SEO technical foundation: canonical URLs, hreflang (ar/en/x-default), Open Graph,
  Twitter Cards, default og:image, robots meta, noindex on placeholder pages,
  sitemap filtered + aligned with canonicals. Full plan tracked in `SEO.md`.
