/**
 * Resolver hook: lets Node import our extensionless relative TypeScript imports.
 *
 * Node 22 strips TypeScript types natively, which is what lets the unit tests
 * import `src/lib/*.ts` directly with no build step. What it does *not* do is
 * guess extensions: `import { loadPdfJs } from './pdf-libs'` resolves under
 * Vite (and so in the real build) but fails under bare Node.
 *
 * The alternative was to write `'./pdf-libs.ts'` in the source purely so a test
 * could load it — changing shipped code to suit the test harness, and breaking
 * from the convention every other module in `src/lib` follows. This hook keeps
 * the fix where it belongs: in the tests.
 *
 * Used as `node --import ./tests/ts-extension-hook.mjs <test>`.
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register(
  // An inline hook module: on a failed resolution of a relative specifier that
  // has no extension, try again with `.ts` before giving up.
  'data:text/javascript,' +
    encodeURIComponent(`
      export async function resolve(specifier, context, next) {
        try {
          return await next(specifier, context);
        } catch (err) {
          if (specifier.startsWith('.') && !/\\.[a-z]+$/i.test(specifier)) {
            return next(specifier + '.ts', context);
          }
          throw err;
        }
      }
    `),
  pathToFileURL('./')
);
