# CHANGELOG

All notable changes to OMXHub are documented in this file.

> Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Entries are
> grouped by the date the work shipped. This file records **what has already been done** —
> the vision it serves lives in `BLUEPRINT.md`, the search strategy behind it in `SEO.md`,
> and everything still ahead in `IDEAS.md`.

---

## 2026-08-07

### Changed
- **The homepage rendered the same thirty tools eleven times.** A "popular" grid,
  a "latest" grid, a "free" grid, then seven auto-generated per-category grids —
  all identical in shape. It read as length rather than substance, and it buried
  the parts of the site that are actually distinctive. The eleven grids are now
  **one tabbed section** (Featured / Newest / Free), and the space that freed up
  went to sections the homepage never had.
  - All three tab panels are rendered into the HTML and only toggled with the
    `hidden` attribute, so every card is present on first paint — crawlable, and
    intact with JavaScript unavailable. Tabs follow the WAI-ARIA pattern with
    arrow-key navigation, and the arrows are **swapped under RTL**, since the
    visually next tab in Arabic is the one to the left.
  - **No tool page lost its only inbound link.** The seven category grids were
    duplicating what `/ai-tools` and the category landing pages already do
    better; the categories row still links every landing page.
- **Image tools, tutorials and prompts are on the homepage for the first time.**
  Three sections that existed on the site but not on the page that is supposed to
  introduce it. The free-tools section now covers all 18 browser tools rather
  than the 14 PDF ones.
- **The hero is centred on the search instead of split with decoration.** The old
  layout gave half its width to five animated floating cards — `aria-hidden`,
  three of five hidden on mobile — and squeezed the one element a visitor is most
  likely to use into what was left. Display-scale type, a wider lede measure, and
  three trust indicators counted from the catalogues rather than typed in.
- **The animated stats band was removed.** With real counts in the hero, the same
  four numbers again 900 px down was repetition in a different coat. Its counter
  script went with it — JavaScript the critical path no longer pays for.
- **New homepage title, headline and meta description.** The `<title>` and the
  visible headline are now written separately and deliberately: a headline is
  read in one glance, a title tag has to win a click from a results page, and the
  same sentence rarely does both.

### Added
- **Site search is a search experience rather than a text field.** It was the
  most prominent element on the homepage and behaved like a form input.
  - **`⌘K` / `Ctrl+K` focuses it, and actually works** — the modifier label is
    corrected at runtime, because one static build serves both platforms. The
    hint renders only where a keyboard exists (`any-hover` + `any-pointer:
    fine`); a visible shortcut badge that does nothing is a small promise broken
    on first try.
  - **Arrow keys, Enter and Escape** move through results, open one, and back
    out — with wrap-around, as every command palette behaves.
  - **A real `combobox`**: `aria-expanded`, `aria-activedescendant`, a `listbox`
    of `option`s, and a polite live region announcing the result count.
  - **It says when it is working.** The index is fetched on the first keystroke,
    which is a silent pause on a slow connection. A spinner now covers exactly
    that fetch and never the instant queries after it.
  - **Suggestion chips**, because an empty search box is a blank-page problem:
    someone who does not yet know what the site holds has nothing to type. Each
    chip is a query verified to return results across more than one content type.
  - Results are built as DOM nodes instead of interpolated into `innerHTML`. The
    index is our own data so this was not a security hole, but a tool named
    `C & C` would have rendered as broken markup.
- **The 18 PDF and image tools are in the search index.** The pages the site
  builds itself — and the only ones a visitor can use without leaving — were the
  only pages search could not find. Typing "ضغط" returned nothing while two
  compression tools sat one click away. They rank last on purpose: "صور" should
  surface the AI image generators before our own resize utility.
- **Three more image tools, in both languages** — Convert (`/image-tools/convert-image`),
  Resize (`/image-tools/resize-image`) and Crop (`/image-tools/crop-image`). Image tools:
  **1 → 4**. Six new indexable pages with the usual anatomy: unique title and description,
  four visible steps plus `HowTo`, seven FAQs plus `FAQPage`, and visible breadcrumbs plus
  `BreadcrumbList`. Still Canvas only — **no new dependency, and no new bytes on any existing
  page.**
- **The section's related-link chain now closes on itself.** With four tools,
  `relatedImageTools` gives every image tool exactly 3 outbound and 3 inbound links, wrapping
  around the catalogue — the same closed crawl chain the PDF section has, in which no tool can
  become orphaned as the set grows. The hub grid and the sitemap already derived from the same
  array, so shipping three tools was a one-file change to `src/data/image-tools.ts`.
- **Convert delivers the format you asked for, even when the file gets bigger** — the one
  deliberate exception to the rule Compress set, and the reason it is an exception is written
  into the module. A JPEG converted to PNG is normally several times larger; refusing it, as
  Compress would, means the tool never does the single thing it exists for. What survives is
  the *honest* half of the rule: the size change is always stated, growth is rendered in the
  warning colour at exactly the prominence a saving would have had, and it is never hidden.
  One shared `sizeVerdict` decides that, so no tool can present a 40% larger file as a win by
  accident — it does not write its own result panel.
- **Resize is built around naming the constraint, not two number boxes.** Five modes —
  longest edge, exact width, exact height, percentage, exact dimensions — because people
  arrive knowing which constraint they care about, and a bare width/height pair makes them
  compute the other number and breaks the aspect ratio when they get it slightly wrong. The
  final dimensions update live as you type, *including* the case people are most often
  surprised by ("this will not change anything"), since the arithmetic runs on numbers rather
  than pixels and there is no reason to make someone press a button to find out.
- **Upscaling is refused by default and permitted on request.** Enlarging cannot add detail,
  but "exactly 1000 px wide" from a 600 px source is a real requirement, and a tool that
  quietly returns 600 px has ignored the request rather than protected the user. So it is a
  visible checkbox, and the warning beside it appears only when the current numbers would
  actually need it.
- **Crop is draggable, and the drag is never the only way in.** Four percentage fields —
  position and size — are bound to the same state in both directions, and are the
  keyboard-accessible mechanism; the corner handles are `aria-hidden`, because assistive
  technology cannot perform that gesture. Same contract as the PDF crop tool, and the wiring
  test now asserts the handles stay hidden on every built page.
- **Six aspect-ratio presets, correct on non-square images.** The rectangle is stored as
  fractions of each axis while a ratio is expressed in real pixels, so on a 2:1 photo a square
  crop is 50% wide and 100% tall — `w === h` would give a wide rectangle. That is the classic
  bug in fraction-based croppers and it has its own test.
- **`tests/image-tool-wiring.test.mjs`** — every `mount*` function returns early if a single
  element id is missing, which produces a page that renders perfectly and does nothing when
  you press the button: no console error, no failing build, and the SEO checks pass because
  the markup is fine. Four tools across two locales is eight chances to ship that. The test
  reads the required ids **out of the UI modules themselves** rather than from a checklist, so
  adding a control extends the coverage automatically and a new tool is covered as soon as it
  is in the catalogue. Runs after the build, beside `deferred-scripts.test.mjs`.
- Four new unit-test files — `image-core`, `image-convert`, `image-resize`, `image-crop` —
  added to `test:unit`.

### Changed
- **`image-core.ts` and `image-io.ts` extracted, the same move `ToolLayout.astro` made.**
  All of it was inside the Compress tool, which was right while Compress was the only image
  tool and stopped being right the moment a second arrived: `fitWithin` is the whole of
  Resize, and importing it from a module named *compress* into the Crop tool would be a lie
  about what the code is for. `image-core.ts` holds the pure arithmetic (Node-testable),
  `image-io.ts` the browser half, and `image-result.ts` the closing panel.
- **The three rules Compress established now have exactly one implementation each.** They
  were the reason to extract rather than copy — each is a way this category silently ruins
  files, and four near-identical copies is how three of them stay right and the fourth drifts:
  transparency detected from pixels (a 128 px probe, not the extension), EXIF orientation
  applied at decode, and JPEG flattened to white deliberately rather than to black by
  omission. A tool added later cannot forget them, because it does not implement them.
- **Cropping reuses the shared canvas encoder with a source rectangle** instead of being a
  second pixel path, so it inherits the white-fill and high-quality smoothing behaviour rather
  than reimplementing them almost the same way.
- Compress was rewired onto the shared modules with **no behaviour change**; its own tests
  still pass unchanged, and the "never larger" promise stays specific to it.
- The image hub's meta descriptions and closing note updated for a four-tool section.
- Verified after build: **176 pages, 3129 SEO assertions, 0 failures**; 356 unit assertions
  across eleven files (171 of them the five image modules), plus 41 wiring assertions over
  the eight built image-tool pages.

### Added
- **About and the Privacy Policy rewritten from scratch, in both languages.**
  Both had fallen behind the site: About described a directory that had since
  grown five more sections, and the policy was four short headings that did not
  mention analytics, browser-based processing, or what happens when you email us.
  - **About** now covers all six sections of the platform, the six axes every
    review is judged on (real testing, features, pricing, strengths, weaknesses,
    best use cases), why editorial scores are labelled as editorial, the mission
    statement, and the funding — stated in full, along with what it does not buy.
  - **Every count on both pages is derived from the catalogues and collections.**
    A hardcoded "30 tools" is wrong the day after it is written, and About is the
    page where being wrong costs the most.
  - **The Privacy Policy is twelve sections** and describes what this site
    actually does rather than a template: GA4 and what it collects, how AdSense
    uses cookies, the single `omxhub-theme` local key that is *not* a cookie, the
    affiliate disclosure, the fact that **there is no contact form** — the contact
    page is a `mailto:` link, which is itself a privacy decision worth stating —
    a dedicated section on why documents opened in the PDF and image tools never
    reach a server, data storage, every third-party service, user rights under
    GDPR and Saudi PDPL, and how changes are announced.
  - It also records something true and easy to miss: **Google's scripts are
    deferred until first interaction or idle**, so a quick visit executes no
    third-party script at all. That was a performance decision; it is a privacy
    fact too.
- **`ProsePage.astro`** — shared chrome for both prose pages. Copy stays in each
  locale's file, because passing thirty paragraphs through props produces
  translated-sounding Arabic, which is the one thing this site is built not to
  be. Structure has no business differing between locales, so it lives here.

### Fixed
- **About and Privacy emitted `BreadcrumbList` without a breadcrumb anyone could
  see.** That passed our own verification only because the final crumb happened
  to repeat the `h1`, and it broke the rule stated in `schema.ts`: mark up only
  what is on the page. Both now render the trail they claim. Contact, the prompt
  pages and `/pdf-tools` still owe the same fix and remain in `IDEAS.md`.

### Added
- **The Image Tools section, opened with Compress** — `/image-tools/compress-image` and its
  English twin, plus the `/image-tools` hub in both languages. Four new indexable pages with
  the usual anatomy: unique title and description, four visible steps plus `HowTo`, seven
  FAQs plus `FAQPage`, and visible breadcrumbs plus `BreadcrumbList`. Everything runs on
  Canvas, which every browser already has, so the section added **no new dependency and no
  new bytes** to any existing page.
- **Compress tries several formats and keeps the smallest** — WebP, JPEG and PNG are encoded
  in parallel and measured, rather than picking one up front. The guarantee is the same one
  Compress PDF makes: **it never returns a file larger than the one it was given**, and says
  so plainly when nothing beat the original instead of handing back a worse file.
- **Transparency is detected from pixels and JPEG is withheld when it would destroy them.**
  A 128 px probe decides whether an image really has alpha — the extension does not, since
  most PNGs are opaque. Under Auto, a transparent image is never offered JPEG; choosing it
  manually warns first and fills white rather than the black a bare canvas would produce.
- **EXIF orientation is honoured**, so portrait phone photos do not come back on their side —
  the most common failure in this category, and a one-option fix (`imageOrientation:
  'from-image'`) that most tools skip.
- `tests/image-compress.test.mjs` — 38 assertions over the decision logic with a stubbed
  encoder, pinning the size promise, the transparency rule, no-upscale on resize, and
  resilience when one format's encoder fails.

### Changed
- **`ToolLayout.astro` extracted from `PdfToolLayout.astro`.** The second tool section would
  otherwise have duplicated ~500 lines of drop-zone, button and status CSS, and every future
  spacing fix with it. Both section layouts are now thin wrappers over the shared base and
  keep their original props, so **none of the 28 PDF tool pages changed** — verified by a
  full build: 170 pages, 2967 SEO assertions, 0 failures.
- Image Tools added to the site header nav and the 404 page's quick links.

### Added
- **Three more Phase 1 PDF tools**, in both languages — Compress (`/pdf-tools/compress-pdf`),
  Lock (`/pdf-tools/lock-pdf`) and Unlock (`/pdf-tools/unlock-pdf`). PDF tools: **11 → 14**,
  leaving only Add Text unbuilt. Six new indexable pages with the usual anatomy: unique title
  and description, four visible steps plus `HowTo`, four FAQs plus `FAQPage`, and visible
  breadcrumbs plus `BreadcrumbList`.
- **Compress works by recompressing images, not by rasterising pages** — which means
  **text stays selectable**. The plan of record assumed the opposite, so the three candidate
  strategies were measured before anything was built:

  | approach | text-heavy file | image-heavy file | text |
  |---|---|---|---|
  | pdf-lib re-save with object streams | 0.0% | 0.0% | kept |
  | rasterise every page through pdf.js | *grows it* | shrinks | **destroyed** |
  | **recompress image XObjects** | nothing to do | **−70.6%** | **kept** |

  The documented trade-off — "destroys selectable text and can grow text-only PDFs" — turned
  out never to be necessary. Almost all the bytes in a large PDF are in its images, and those
  can be replaced individually. `src/lib/pdf-compress.ts` finds `/DCTDecode` image streams,
  re-encodes each through a canvas, and swaps the bytes with `/Length` kept in agreement.
  Other encodings and anything carrying an `/SMask` are skipped rather than guessed at,
  because a mangled image is a worse outcome than an unshrunk one. **The tool never returns a
  larger file than it was given.** It also inspects the document *before* the user commits and
  says plainly when there is nothing to compress.
- **Lock and Unlock**, via `@cantoo/pdf-lib` — a maintained fork of pdf-lib with encryption
  support, which upstream has never had. Loaded from `pdf-libs.ts` **only on those two pages**:
  the fork is 272 kB gzipped against pdf-lib's 206 kB, so swapping it in site-wide would have
  put 66 kB on twelve other tools to serve two. Verified after build: every tool page ships
  5–9 kB of eager JavaScript, with no `modulepreload` and no heavy chunk on any critical path.
- **Two limitations shipped as documentation rather than hidden**, both asserted in tests so
  they cannot go quietly stale:
  - Encryption is **AES-128** (`AESV2`/V4/R4), not AES-256. `keyBits: 256`, `version: 5` and
    `pdfVersion: '2.0'` were all tried and silently returned V4/R4. The Lock FAQ says so, and
    says when a PDF password is the wrong tool for the job.
  - Unlocking **rebuilds the document**, so bookmarks, form fields, attachments and metadata
    are lost. Decrypting and re-saving is not enough — the security handler survives, and the
    output stays encrypted. Copying pages into a fresh document is the only approach that
    works. The test pins both halves so nobody "simplifies" it back into a bug.
- The Unlock page states plainly that it **cannot open a file whose password you do not know**,
  and why anything advertising otherwise is guessing passwords or uploading your document.
- **Two more unit test files** (`pdf-compress`, `pdf-encrypted`), taking the suite to
  **185 assertions across six files**, all running before the build so they fail fast.
- **Two more Phase 1 PDF tools**, in both languages — Crop PDF (`/pdf-tools/crop-pdf`)
  and Add Page Numbers (`/pdf-tools/page-numbers`). PDF tools: **9 → 11**. Four new
  indexable pages, each with a unique title and description, four visible steps plus
  `HowTo`, four FAQs plus `FAQPage`, and visible breadcrumbs plus `BreadcrumbList`.
  - **Crop** works off a live pdf.js preview of page one: drag the corners, or type an
    exact percentage into any of the four edge fields. The crop is expressed as
    *fractions* rather than points, so applying it to every page is correct even when
    the pages are not all the same size — a mixed scan crops evenly instead of taking
    more off the small pages.
  - **Page Numbers** offers six positions, three formats, a custom starting number, and
    an option to leave a cover page unmarked.
- **A shared crop-rectangle module** (`src/lib/pdf-crop-box.ts`), following the same split
  as `pdf-page-grid.ts`: the module owns the interaction, the tool page keeps only the few
  lines of pdf-lib that differ. As with page reordering, dragging is never the only way in
  — the four percentage fields are bound to the same state in both directions and are the
  keyboard-accessible mechanism, while the corner handles are `aria-hidden` because
  assistive technology cannot perform that gesture.
- **`src/lib/pdf-geometry.ts` — page-rotation handling, in one place.** A page's `/Rotate`
  entry tells a viewer to turn the content before showing it, but does **not** move the
  content: pdf-lib writes into the unrotated coordinate system while the user picks
  coordinates off the rotated one. Ignoring the difference fails silently and specifically
  — a page number lands sideways along the edge of a rotated scan, a crop taken off the
  visual bottom comes off the left — so both new tools translate through this module and
  work purely in the coordinates the reader sees.
- **`src/lib/pdf-text.ts` — a WinAnsi encoding guard** for the tools that draw text.
- **Three unit test files, wired into `npm test` ahead of the build** so they fail fast:
  - `tests/pdf-geometry.test.mjs` — 48 assertions pinning the corner behaviour each
    rotation mapping was derived from, plus bijectivity and round-trip properties.
  - `tests/pdf-text.test.mjs` — 19 assertions on what the encoding guard accepts and
    rejects, in both directions.
  - `tests/pdf-placement.test.mjs` — 54 assertions that run the real tool code through
    pdf-lib, then read the drawn text back out of the saved file's content stream and
    check it against a **reference transform derived independently** from a rotation
    matrix. If the library's case-based mapping and that matrix ever disagree, the build
    fails. Also covers crop-then-number, where a page number must land inside the
    already-cropped area.
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
  visible text. Latest run, with the two new tools included: **160 pages, 2,747 assertions,
  0 failures.**

### Changed
- **Internal linking for PDF tools is now derived, not hand-maintained.** `relatedPdfTools()`
  walks the catalogue and wraps around, giving every tool exactly **3 outbound and 3 inbound**
  related links — a closed, symmetric chain in which no PDF tool can become orphaned as the
  set grows. Previously each page carried a hand-written `related` array and some tools had
  only two links.
- The two `/pdf-tools` hub pages, the homepage quick-actions grid, and every tool page's
  related list all derive from the catalogue, so adding a tool is now a one-file change.

### Fixed
- **Every PDF tool blamed the user's file for an encrypted document.** Plain pdf-lib has no
  decryption support and does not fail cleanly on a protected file — it fails mid-parse with
  `Trying to parse invalid object`, which each tool caught and reported as *"make sure the file
  is a valid PDF"*. The file was valid; it was locked. Now `src/lib/pdf-encrypted.ts` detects
  it first and `PdfToolLayout` shows a notice saying there is nothing wrong with the file, with
  a link to the new Unlock tool. Applied across all thirteen tools that read PDFs — but
  deliberately **not** to Images→PDF, which consumes images and where the check would be
  meaningless. Same class of bug as the Arabic watermark message, fixed the same way.
- **The watermark tool blamed the user's file for our own limitation.** pdf-lib's standard
  fonts are WinAnsi-encoded and cannot represent Arabic, so an Arabic watermark threw and
  fell into the generic handler — *"make sure the file is a valid PDF"*. The file was
  always fine, and no amount of trying another one would have helped. The text is now
  checked before the document is opened, and the user is told exactly which characters
  cannot be used and that their file is not the problem. The Arabic page also stopped
  *suggesting* Arabic examples ("مسودة"، "سري") in its placeholder and steps, which were
  the precise inputs guaranteed to fail.
- Three documentation lines that had fallen behind reality: the Support page was built but
  documented as "not started", `tutorials` was indexable but documented as `noindex`, and the
  deferred loading of the PDF engines was implemented but still marked ⬜.

### Removed
- **The "Choose an Amount" grid on `/support`**, in both languages — the five preset cards
  ($2 / $5 / $10 / $20 / Custom) all pointed at the same Ko-fi URL, where the amount is
  chosen anyway. The grid added a decision before the click without changing where the click
  led, and made a thank-you page read like a price list. The page now goes hero → why support
  → roadmap → CTA, with the Ko-fi button as the single call to action. The `amounts` array and
  the `.amounts-grid` / `.amount-card` styles were removed with it.
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
