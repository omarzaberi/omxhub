# OMXHub Ideas

A collection of future ideas, improvements, experiments, and feature requests.

> **Status:** ⬜ Planned · 🟡 In Progress · ✅ Completed · ❌ Cancelled
>
> This is the backlog, not the record. Anything already shipped belongs in `CHANGELOG.md`;
> the vision these ideas serve lives in `BLUEPRINT.md`. An item only reaches ✅ here on the
> day the changelog has the entry to prove it — and it is then removed on the next pass, so
> this file stays a list of what is still ahead.

---

## AI Directory

- 🟡 **Grow the directory to 1,000+ tools.** 30 are live across all 7 categories.
- ⬜ **Tool badge system as structured metadata.** Nine badges — 🆓 Free, 💰 Freemium, 💳 Paid,
  ⭐ Editor's Choice, 🔥 Trending, 🆕 New, 🇸🇦 Arabic Support, 🚀 Best for Beginners,
  ⚡ No Sign-up Required — stored in each tool's data model and driving directory cards,
  category pages, search results, comparison pages and tool detail pages from one source.
  Maximum 3 badges per card, fully localised, consistent colours and icons everywhere.
- ⬜ **Badge-driven filtering** across the directory, using the same metadata rather than a
  second parallel system.
- ⬜ **Editorial badge rules, automated**: `New` expires after 60–90 days unless renewed,
  `Trending` reviewed periodically, `Editor's Choice` held to 5–10% of all tools.
- ⬜ **Screenshots on tool detail pages** — listed in the Blueprint's page anatomy, not yet built.
- ⬜ **Real visitor ratings.** Until these exist the editorial `Review` stands alone; once they
  do, `aggregateRating` becomes legitimate to publish.
- ⬜ **Link tool pages back to related tutorials and prompts** — the reverse direction of the
  linking already in place from tutorials and comparisons.

## Free Online Tools

Everything here inherits the Blueprint's hard rule: **it must run entirely in the browser.
No backend, no paid API.**

### PDF — Phase 1 remainder

- 🟡 **Phase 1 PDF set: 14 of 15 live.** Only Add Text is left.
- ⬜ **Add Text — one decision away, and the decision is about page weight.** It was filed as
  a plain pdf-lib draw operation. It is not. pdf-lib's standard fonts are WinAnsi-encoded and
  cannot represent Arabic at all, and embedding a TTF does not solve it: pdf-lib performs no
  shaping and no bidi reordering, so Arabic comes out as disconnected letters in reverse
  order — a worse failure than refusing, because it looks like it worked.
  - **Measured cost of doing it properly** (2026-08-07): `@pdf-lib/fontkit` is **328 kB
    gzipped — larger than pdf-lib itself (206 kB)**; an Arabic TTF adds roughly 200–400 kB
    (`@fontsource` ships woff2 only, which fontkit cannot read, so this would be a new asset);
    plus a presentation-forms reshaper and a bidi pass. Call it **600 kB–1 MB on that one
    page**, lazily loaded. That would make it comfortably the heaviest thing on the site.
  - **Options, none of them free:** ship it Latin-only and exclude half the audience; pay the
    weight behind a lazy import and accept a slow page for a minor tool; subset the font at
    build time to shrink the TTF; or leave it unbuilt and treat 14/15 as complete.
  - Shipped in the meantime: `src/lib/pdf-text.ts` detects unencodable characters up front,
    so the tools that draw text say what is actually wrong instead of blaming the file.

### PDF — follow-ups from what shipped

- ⬜ **Compress non-JPEG images.** Only `/DCTDecode` streams are recompressed today, which
  covers scans and photographs — where the weight almost always is. `/FlateDecode` bitmaps
  (screenshots, exports) are skipped on purpose, because converting them needs correct colour
  space and alpha handling and a subtle mistake corrupts the image rather than shrinking it.
  Worth doing carefully, not quickly.
- ⬜ **Downscale oversized images during compression.** A 4000px-wide scan placed in an A4
  page is carrying several times the resolution any printer will use. Re-encoding at lower
  quality helps; resampling to a sensible DPI would help far more.
- ⬜ **AES-256 encryption.** `@cantoo/pdf-lib` produces AES-128 only — `keyBits: 256`,
  `version: 5` and `pdfVersion: '2.0'` were all tried and silently returned V4/R4. The Lock
  FAQ states this plainly, and `tests/pdf-encrypted.test.mjs` asserts it, so the day the
  library gains AES-256 the test fails and the FAQ gets corrected rather than going stale.
- ⬜ **Preserve document structure when unlocking.** Removing a password requires copying
  pages into a fresh document, which loses bookmarks, form fields, attachments and metadata.
  The Unlock FAQ says so. Carrying them across is possible but is real work.
- ⬜ **Permission-only locking** — restricting printing or copying without requiring a
  password to open. The engine supports the permission flags already; it needs a UI and a
  clear explanation that permissions are advisory and readers may ignore them.

### Redaction

- ⬜ **Real redaction.** Crop hides content, it does not remove it — the bytes stay in the
  file and anyone can restore the full page, which the tool now says plainly in its FAQ.
  A genuine redaction tool that rewrites the content stream is the honest answer to what
  some people will reach for Crop hoping to do, and it is a distinct, high-trust feature
  rather than a flag on an existing one.

### Image — Phase 2

- ⬜ Remove Background · Upscaler · Compress · Crop · Resize · Convert · Watermark
- ⬜ OCR — only if it can run without a paid API, which the Blueprint currently rules out.

### Video — Phase 2

- ⬜ Compress · Trim · Convert · Extract Audio · GIF Maker

### Audio — Phase 2

- ⬜ Converter · Cutter · Volume Booster · Noise Reduction

### Text — Phase 3

- ⬜ Word Counter · Character Counter · Case Converter · Grammar Checker · AI Summarizer ·
  AI Paraphraser

### Developer — Phase 3

- ⬜ JSON Formatter · JWT Decoder · Base64 Encoder · UUID Generator · QR Generator ·
  Hash Generator · Regex Tester

### SEO — Phase 3

- ⬜ Meta Generator · Open Graph Generator · Robots.txt Generator · Sitemap Generator

### File Converters

- ⬜ The general file-converter section listed in the Blueprint's site structure.

## Tutorials

- 🟡 **More tutorials.** 5 are live; the Blueprint's tracks are Learn AI, Learn ChatGPT,
  Learn Claude, Prompt Engineering, and Automation Guides.
- ⬜ **`/tutorials/category/<x>` and `/tutorials/level/<x>` routes.** Deliberately not built —
  they would be thin content at this size, and the pills filter in place instead. Promote a
  facet to a real route once it has earned one.

## Comparisons

- 🟡 **More comparisons.** 5 are live; the Blueprint names Claude vs Gemini, Canva AI vs
  Adobe Firefly, and Midjourney vs Flux among the next candidates.
- ⬜ **`/comparisons/category/<x>` routes** — same reasoning as tutorials: thin content today,
  worth promoting once a category earns it.

## Prompt Library

- 🟡 **Expand beyond the current 10 prompts.**
- ⬜ **Organise by tool**: ChatGPT, Claude, Gemini, Midjourney, Cursor, Bolt, Lovable.
- ⬜ **Prompt packs** as a paid product (see *Monetization*).

## Blog

- ⬜ **Launch the Blog.** The section is `noindex` until there is real content behind it.
- ⬜ **Content lines**: tool reviews, top-AI-tool roundups, productivity tips, buying guides.
- ⬜ **`Article` schema for blog posts** — the one schema type in the SEO plan still unbuilt.
- ⬜ **Occasional Ko-fi link below blog posts**, as permitted by the Blueprint's no-popup rule.

## AI News

- ⬜ **Launch the AI News section.** Currently `noindex, follow` and excluded from the sitemap;
  the flag comes off when real content is ready.
- ⬜ **Topic pages** under `/news/<topic>`, e.g. `/news/openai`.

## Community

- ⬜ **Newsletter.** The homepage signup section is in the Blueprint's layout; the list itself
  does not exist yet.
- ⬜ **Official accounts**: Product Hunt, Reddit (r/artificial and Arabic communities),
  Twitter/X, LinkedIn. This also unblocks `sameAs` on the `Organization` schema, which is
  deferred for exactly this reason.
- ⬜ **Get OMXHub listed in other AI tool directories.**
- ⬜ **Guest posts**, and sharing the free PDF tools in Arabic technical communities.
- ❌ **Buying backlinks** — ruled out. Penalty risk outweighs any gain.

## Monetization

- ⬜ **Affiliate marketing** (Phase 1, alongside the AdSense and Ko-fi support already live).
- ⬜ **Featured listings** (Phase 2).
- ⬜ **Sponsored articles** (Phase 2).
- ⬜ **Newsletter sponsorship** (Phase 2) — depends on the newsletter existing.
- ⬜ **Premium membership** (Phase 3).
- ⬜ **Prompt packs** (Phase 3).
- ⬜ **Digital products and templates** (Phase 3).
- ⬜ **Paid API access** (Phase 3).

## SEO

- ⬜ **Add visible breadcrumbs to the pages that emit `BreadcrumbList` without one** — About,
  Contact, the prompt pages, and `/pdf-tools`. As it stands these break our own rule of marking
  up only what is visible on the page.
- 🟡 **Bing Webmaster Tools** — importable from Search Console, covered by
  `docs/SEARCH-CONSOLE.md`.
- ⬜ **`Article` schema for the blog**, once the blog launches.
- ⬜ **`sameAs` on `Organization`**, once official accounts exist.
- ⬜ **`aggregateRating`**, once a real visitor rating system exists. This is the only optional
  field the Rich Results Test flags, and it is left empty on purpose.
- ⬜ **Keyword pushes** in the four areas the SEO plan identifies as the real opportunity:
  Arabic searches for AI tools, action-intent PDF queries, comparisons, and prompts.
- ⬜ **Thousands of indexable pages** — the standing goal, one page per feature.

## Performance

- ⬜ **Lazy loading for images.**
- ⬜ **Regular Lighthouse audits**, holding the 95+ target.
- ⬜ **Route-level bundle review** beyond the PDF engines, which are already deferred.

## Developer Experience

- ⬜ **Extend `scripts/verify-seo.mjs`** as new sections land, so every launch is covered by the
  same assertions rather than a one-off check.
- ⬜ **Apply the single-source catalogue pattern** used for PDF tools to the other sets as they
  grow, so no list is ever maintained by hand in more than one place.
- ⬜ **Fold the font audit into the scripted build check**, the way the SEO assertions already are.

## Future Products

- ⬜ **Browser extension** (Blueprint, months 7–12).
- ⬜ **Mobile app** (Blueprint, months 7–12, planning stage).
- ⬜ **Public API** over the AI directory — also the basis for the paid API tier.
- ⬜ **User accounts.** Gated by the Blueprint's "What NOT to Build (Yet)" list, which rules out
  backend authentication for now. Everything below depends on this or on local storage.
- ⬜ **Bookmarks / favourites.**
- ⬜ **Collections** — curated, shareable sets of tools.
- ⬜ **Browser sync** of saved tools across devices.

---

## Deliberately Deferred

Not cancelled, but explicitly out of scope until the site earns them. Kept here so they are not
re-proposed by accident:

- Backend authentication
- Complex dashboards
- OCR that requires a paid API
- PDF→Word / PDF→Excel via paid engines
- Expensive AI APIs, before traffic justifies the cost

The guiding principle behind all of the above: **every new feature must help users accomplish a
real task — not just read about it.**
