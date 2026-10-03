import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readDist, exists } from './helpers.mjs';

test('home page builds', async () => {
  assert.equal(await exists('index.html'), true, 'dist/index.html should exist');
});

test('home page is Faroese with proper head', async () => {
  const html = await readDist('index.html');
  assert.match(html, /<html lang="fo"/);
  assert.match(html, /<title>TREYST<\/title>/);
  assert.match(html, /rel="icon"/);
});

test('english home builds under /en/', async () => {
  assert.equal(await exists('en/index.html'), true, 'dist/en/index.html should exist');
});

test('token CSS variables are emitted', async () => {
  const html = await readDist('index.html');
  const cssHref = html.match(/href="(\/_astro\/[^"]+\.css)"/)?.[1];
  assert.ok(cssHref, 'a bundled CSS file should be linked');
  const css = await readDist(cssHref.replace(/^\//, ''));
  assert.match(css, /--color-fjord:\s*#0C1512/i);
  assert.match(css, /--color-brand:\s*#0F766E/i);
  assert.match(css, /--font-display:\s*"Archivo Variable"/);
});

test('layout has skip link, main landmark and reveal contract', async () => {
  const html = await readDist('index.html');
  assert.match(html, /class="skip-link"/);
  assert.match(html, /<main id="main">/);
  assert.match(html, /classList\.add\('js'\)/);
});
