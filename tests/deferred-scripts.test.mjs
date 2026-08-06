/**
 * Regression test for the deferred AdSense / GA4 loader in Layout.astro.
 *
 * That loader is a small piece of hand-written inline JS sitting on the hot
 * path of every page, and the two ways it can fail are both silent: load the
 * vendors too early (performance regression nobody notices until a Lighthouse
 * run) or never load them at all (ad revenue and analytics quietly stop).
 * So we assert both halves against the actual built HTML.
 *
 * Requires `npm run build` first. Run with: npm test
 */
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

// Pull the real inline loader out of the built homepage — we test what ships.
const html = readFileSync('dist/index.html', 'utf8');
const block = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map((m) => m[1])
  .find((s) => s.includes('adsbygoogle.js'));
if (!block) throw new Error('deferred loader not found in built HTML');

function boot() {
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { runScripts: 'outside-only' });
  const { window } = dom;
  window.requestIdleCallback = undefined; // force the setTimeout path so we control timing
  window.eval(block);
  const srcs = () => [...window.document.querySelectorAll('script[src]')].map((s) => s.src);
  return { window, srcs };
}

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`); };

// 1. Nothing is requested up front.
{
  const { window, srcs } = boot();
  check('no third-party script on the critical path', srcs().length === 0);
  check('dataLayer queue exists immediately', Array.isArray(window.dataLayer));
  check('adsbygoogle queue exists immediately', Array.isArray(window.adsbygoogle));
  const cmds = window.dataLayer.map((a) => a[0]);
  check("GA 'js' + 'config' queued before vendor code loads", cmds.includes('js') && cmds.includes('config'));
  check('config carries the right measurement ID', window.dataLayer.some((a) => a[1] === 'G-W8MG2DBF3F'));
}

// 2. Interaction triggers exactly one load of each.
{
  const { window, srcs } = boot();
  window.dispatchEvent(new window.Event('scroll'));
  const after = srcs();
  check('scroll loads both vendors', after.length === 2);
  check('  adsense url + client id correct',
    after.some((s) => s.startsWith('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1192147959258733')));
  check('  gtag url + id correct',
    after.some((s) => s === 'https://www.googletagmanager.com/gtag/js?id=G-W8MG2DBF3F'));
  check('scripts are async', [...window.document.querySelectorAll('script[src]')].every((s) => s.async));

  // Further interaction must not duplicate them.
  window.dispatchEvent(new window.Event('scroll'));
  window.dispatchEvent(new window.Event('keydown'));
  window.dispatchEvent(new window.Event('pointerdown'));
  check('repeat interaction does not duplicate scripts', srcs().length === 2);
}

// 3. The idle fallback fires for a passive reader who never interacts.
{
  const { window, srcs } = boot();
  window.dispatchEvent(new window.Event('load'));
  check('idle path has not fired yet at t=0', srcs().length === 0);
  await new Promise((r) => setTimeout(r, 3800));
  check('idle fallback loads both without any interaction', srcs().length === 2);
}

// 4. Interaction then idle must still only load once.
{
  const { window, srcs } = boot();
  window.dispatchEvent(new window.Event('pointerdown'));
  window.dispatchEvent(new window.Event('load'));
  await new Promise((r) => setTimeout(r, 3800));
  check('interaction + idle still loads exactly once', srcs().length === 2);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
