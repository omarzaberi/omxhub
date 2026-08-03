---
lang: "en"
title: "Code Debugging Assistant"
description: "Analyzes your error message and code, then explains the root cause with clear steps to fix it"
category: "coding"
tool: "Claude"
difficulty: "advanced"
publishDate: 2026-08-03
featured: false
promptText: |
  I have a bug and need help diagnosing it:

  Error message:
  [paste the full error message]

  Relevant code:
  [paste the code]

  What I've tried so far: [mention anything you tried]
  Language and environment: [e.g. Python 3.11, Node.js 20, etc.]

  Please explain:
  1. The root cause (not just the symptoms)
  2. The fix, step by step
  3. How to avoid this issue in the future
---

Instead of digging through forums for hours, get a direct diagnosis tailored to your exact code.

## When to use it
- When you're stuck on an error you don't understand
- When the error message is vague or overly technical
- To document the fix so the issue doesn't recur
