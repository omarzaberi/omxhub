---
lang: "en"
name: "FLUX"
tagline: "Image generation and editing models from Black Forest Labs — some open-weight and runnable on your own hardware"
category: "design"
pricingType: "freemium"
officialUrl: "https://bfl.ai"
rating: 4.5
pros:
  - "FLUX.2 [klein] is Apache 2.0 — run it locally and use it commercially for free"
  - "Among the best models available at rendering readable text inside an image"
  - "Pay-per-image API pricing instead of a fixed monthly subscription"
  - "Prompt-based image editing is built into the same model, not a separate tool"
  - "Strong photorealism — skin, lighting, and fine detail hold up"
  - "Available through several providers, so you're not locked to one vendor"
cons:
  - "No simple consumer app — you need a third-party platform or your own setup"
  - "Running locally needs a powerful GPU and a lot of VRAM"
  - "Licensing is tangled: klein is open, dev needs a paid commercial licence, pro is API-only"
  - "Non-English prompt handling is noticeably weaker than English"
  - "No community gallery to browse for inspiration the way Midjourney has"
pricingPlans:
  - name: "FLUX.2 [klein]"
    price: "Free (Apache 2.0)"
    features: "Open weights, local inference, commercial use at no cost"
  - name: "API — Klein"
    price: "~$0.014 / image"
    features: "Cheapest option through the API"
  - name: "API — Pro"
    price: "~$0.03 / image"
    features: "The balanced choice between quality and cost"
  - name: "API — Max"
    price: "~$0.07 / image"
    features: "Highest available quality, for final deliverables"
  - name: "Self-hosted licence"
    price: "$999 / month"
    features: "Commercial use of FLUX.2 [dev] on your own hardware, 100k images/month"
alternatives:
  - "midjourney"
  - "adobe-firefly"
  - "canva-ai"
faq:
  - q: "Is FLUX actually free?"
    a: "FLUX.2 [klein] is Apache 2.0, which means you can download it, run it, and use the output commercially at no cost — you just need capable hardware or a hosting service. The higher-quality Pro and Max tiers are pay-per-use through the API. The dev model has open weights, but commercial use of it requires a paid licence."
  - q: "How does it compare to Midjourney?"
    a: "Midjourney is a finished product with a monthly subscription: type a description, get a distinctly styled image, zero setup. FLUX is a set of models you reach through an API or run yourself — cheaper for occasional use, much better at text inside images, and harder to start with. Want something usable today? Midjourney. Want to build on it or control everything? FLUX."
  - q: "What do I need to run it locally?"
    a: "A GPU with substantial VRAM (16GB+ for the larger checkpoints, less for the distilled ones), disk space for the model, and basic familiarity with tools like ComfyUI or Diffusers. If you don't have that hardware, use a hosted provider and pay per image."
  - q: "Do I own the images I generate?"
    a: "It depends on the variant and the platform. Klein under Apache 2.0 is the clearest and most permissive. For the others, read the terms of the provider you're using — they differ. For any serious commercial work, read the licence yourself rather than trusting a summary."
  - q: "Klein, Pro, or Max — which should I use?"
    a: "Klein for experiments, high volume, and free local use. Pro is the sensible default for most work — excellent quality at a reasonable price. Max for the final image you'll publish or print. A practical workflow: iterate on Klein, render the final on Pro or Max."
  - q: "Can it render text in the image reliably?"
    a: "In English, yes — it's one of the best available, and signage, posters, and covers usually come out with correct letterforms. Scripts other than Latin are far less reliable. The practical workaround is to generate the image without text and add the type afterwards in a design tool."
publishDate: 2026-08-06
featured: false
---

FLUX is a family of image generation and editing models from **Black Forest Labs**, a German company founded by people behind the original Stable Diffusion models. The fundamental difference from Midjourney is that FLUX is **not a product, it's a set of models**: you reach them through an API, or download the weights and run them yourself.

That buys you more freedom and lower cost for occasional use — and puts the setup burden on you.

## The FLUX.2 variants

| Variant | Status | When to use it |
|---|---|---|
| **klein** | Open, Apache 2.0 | Experiments, high volume, free local inference |
| **dev** | Open weights, paid commercial licence | Running a strong model on your own infrastructure |
| **pro** | API only | The sensible default for most work |
| **flex / max** | API only | Highest quality, for final deliverables |

## What makes it stand out

- **Text inside images:** its strongest card. Signs, posters, and covers come out with correct English letterforms — a chronic weak spot for most competitors.
- **Prompt-based editing:** upload an image and say "replace the background with a modern office" — the same model edits it, no second tool needed.
- **Photorealism:** skin, lighting, and reflections land closer to natural than most available models.
- **Cost:** you pay per image. Generating 50 images a month costs far less than any subscription.
- **Independence:** because open variants exist, you aren't hostage to one company's pricing or shutdown decisions.

## How to use it

1. Pick your route: a hosted provider with per-image billing, the BFL API directly, or local inference via ComfyUI
2. Choose the right variant (Klein to explore, Pro to work, Max to finish)
3. Write the prompt in English and be explicit about lighting, lens, and style
4. To edit an existing image, upload it and describe the change in plain language
5. Render the final at the resolution you actually need — price scales with resolution

## Who it's for

**Good fit if** you're a developer building an image feature, a designer who needs accurate text in images, generating at volume and cost-sensitive, or interested in running a model locally without a subscription.

**Poor fit if** you want something you can open and use immediately with no setup, you need reliable non-Latin text rendering, or you value a community gallery for inspiration — Midjourney is a much better fit there.

## Limits worth knowing

Licensing is where people get caught out: **klein** is open and unambiguous, **dev** has open weights but commercial use requires a paid monthly licence, and **pro/max** run through the API under the provider's terms. Before any commercial project, read the licence for the exact variant you're using — the differences are not a technicality.
