## Deployment — IMPORTANT

Netlify auto-deploys on every push to `main`, and build minutes are limited.

**Never run `git push` without explicit permission from Omar, every single time.**

- Commit locally as often as needed (`git add` / `git commit` are fine).
- Batch work and push to `main` at most once per week.
- Do not run `netlify deploy`, `netlify build`, or trigger deploys via the Netlify MCP.
- Before pushing, always ask first and show a summary of the commits that will go out.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

Test everything locally at **http://localhost:4321/** — never against the live site.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
