---
lang: "en"
title: "Prompt Engineering Basics: 7 Rules That Change Your Results"
subtitle: "No course, no jargon. Seven practical rules that move your output from generic to usable — with any AI tool."
metaTitle: "Prompt Engineering Basics — 7 Practical Rules for Beginners"
metaDescription: "A plain-language guide to prompt engineering: how to write a brief AI gets right the first time, with before-and-after examples you can copy."
category: "productivity"
level: "beginner"
readingTime: 11

takeaways:
  - "Turn any vague request into a clear brief using four fixed elements"
  - "Get the model to write in your voice instead of its own"
  - "Use examples properly — the most powerful technique and the least used"
  - "Know when to split a task and when to keep it in one prompt"
  - "Build reusable prompt templates instead of starting from scratch every time"

prerequisites:
  - "An account with any AI tool — ChatGPT, Claude, or Gemini. The free tier is enough."

steps:
  - title: "Rule 1: Define the role and the audience"
    body: "Without context, a model writes for an imaginary general reader and the result falls flat. Tell it who it is and who it's writing for. 'You are a content editor at a software company, writing for product managers' produces a completely different result from the same request without that line — because it sets the vocabulary, the depth of explanation, and the examples chosen."
    tip: "A role helps when it actually changes the writing. 'You are a world-renowned award-winning expert' adds nothing — that's decoration, not context."

  - title: "Rule 2: Ask for an output, not a topic"
    body: "There is a wide gap between 'talk about pricing' and 'write three pricing tiers as a table, each with a name, a monthly price, three features, and one line on who it suits.' The second gives you something usable immediately. Always specify the format (table, list, prose), the count, and the length."
    tip: "If you're going to paste the result elsewhere, say so: 'in Markdown' or 'no headings or bullets, connected paragraphs only'."

  - title: "Rule 3: Give examples — three beats one"
    body: "This is the most powerful technique in the whole subject and the least used. Rather than describing your style in words, paste three samples of your own writing and ask: 'First extract the style rules from these examples and show them to me; once I approve, write the new piece to those rules.' One example produces shallow mimicry; three lets it catch the pattern."
    tip: "Negative examples work too. 'Don't write like this: ...' is far clearer than 'avoid a marketing tone'."

  - title: "Rule 4: State your constraints explicitly"
    body: "A model doesn't know your constraints unless you name them. Put your limits as a short list at the end of the prompt: 'Don't use the words revolutionary or innovative. Don't open with a rhetorical question. No sentence over 20 words. Don't cite numbers I haven't given you.' Negative constraints work best when they're specific and checkable."
    tip: "'Don't invent figures — if you don't have the information, write [needs verification]' is one of the most useful constraints for anything you'll publish."

  - title: "Rule 5: Split the big task"
    body: "One prompt containing five tasks gives you five mediocre results. For a full article, ask for the outline first, review and fix it, then request one section at a time. Each step builds on the last, so you can correct course early instead of discovering the wrong angle after a complete draft."
    tip: "Rule of thumb: if your request contains more than two core verbs (summarise + analyse + recommend), split it."

  - title: "Rule 6: Ask it to think before answering"
    body: "For analytical work, add a line like: 'Before giving your final answer, write out your reasoning and the alternatives you considered.' This measurably improves accuracy on arithmetic, logic, and multi-part decisions, because it stops the model jumping straight to the first plausible-looking answer."
    tip: "Some models have a built-in extended thinking mode. If it's available, switch it on for complex work rather than asking for reasoning manually."

  - title: "Rule 7: Save what worked as a template"
    body: "The best prompt is one you never write twice. Whenever a phrasing produces excellent output, save it to a text file and bracket the variables: 'Write a [type] about [topic] for [audience] at [count] words.' After a month you'll have a personal library that saves you hours."
    tip: "Our prompt library is built on the same principle — start from those templates and adapt them to your work."

mistakes:
  - wrong: "'Write me professional, engaging content.' Words like professional and engaging mean nothing to a model."
    right: "Replace adjectives with specifications: 'short sentences, no marketing adjectives, one concrete example per paragraph'."

  - wrong: "Rewriting the prompt from scratch when you don't like the result."
    right: "Correct what exists with a specific note. Context accumulates, and the third revision beats a fresh request."

  - wrong: "Cramming ten instructions into one run-on paragraph."
    right: "Lay them out as a numbered list. Models follow lists far more reliably than prose."

  - wrong: "Asking to 'make it longer' and getting padding."
    right: "Say what to add: 'add a practical example to each point' or 'add a paragraph on the risks'."

  - wrong: "Copying a long prompt off the internet without understanding or adapting it."
    right: "Take the idea and rebuild it around your context. A copied prompt gives you a copied result."

relatedTools:
  - "chatgpt"
  - "claude"
  - "gemini"
relatedComparisons:
  - "chatgpt-vs-claude"
  - "chatgpt-vs-gemini"
relatedPrompts:
  - "blog-post-outline"
  - "professional-email"
  - "product-description"
related:
  - "how-to-use-claude"
  - "arabic-ai-writing"

faq:
  - q: "Will prompt engineering become obsolete as models improve?"
    a: "The trick-based part already is — the odd hacks that worked two years ago are unnecessary now. But the core of it, describing what you want clearly and supplying context and examples, isn't going anywhere. It's a communication skill."

  - q: "Do the rules differ between ChatGPT, Claude, and Gemini?"
    a: "All seven work across the three. The differences are in the details: Claude responds well to long, structured instructions, and Gemini is stronger when you hand it sources directly. Start with the same prompt and adjust based on what you observe."

  - q: "Is a longer prompt always better?"
    a: "No. Clearer is better, not longer. Five specific lines beat a hundred repetitive words. Length only helps when it adds a real constraint, example, or piece of context."

  - q: "How do I get output in a specific dialect or regional voice?"
    a: "Ask explicitly and supply a written example in that voice. The request alone usually isn't enough — models are trained on far more standard prose, so the example is what sets the tone."

  - q: "Do the same rules apply to image generation?"
    a: "The principles carry over (be specific, give examples, state constraints) but the vocabulary differs. Image prompts focus on visual description: lighting, angle, artistic style, aspect ratio. Try the portrait example in our prompt library."

publishDate: 2026-08-05
featured: true
popularity: 95
---

Most people who say "AI doesn't understand me" don't have a tool problem — they have a description problem. That's not an insult, because precise description is a skill we rarely practise. With people we lean on shared context, tone, and history. A model has none of that.

Prompt engineering is a grand name for a simple idea: describe what you want in a way that leaves no room for interpretation. Below are seven rules covering ninety percent of the practical difference between a bad result and an excellent one.

## Before the rules: the difference in one example

**A weak request:**

> Write an email to the client about the project delay.

**The same request with the rules applied:**

> You are a project manager writing to an enterprise client. Write a 120-word email telling them delivery will slip by two weeks because of a requirements change on their side — without blaming them outright. Tone: professional and confident, not over-apologetic. Include the new date and propose a short call. Don't open with "I hope this email finds you well."

The second gives you an email you can send after a light edit. The first gives you a generic template you'd rewrite entirely. The difference between them is one minute of typing.

## The seven rules
