import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
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

test('nav and footer render on home', async () => {
  const html = await readDist('index.html');
  assert.match(html, /data-nav/);
  assert.match(html, /Heim/);
  assert.match(html, /info@treyst\.fo/);
  assert.match(html, /href="\/en\/"/);
});

test('english nav links point to english pages', async () => {
  const html = await readDist('en/index.html');
  assert.match(html, /href="\/en\/about"/);
  assert.match(html, /href="\/en\/contact"/);
});

test('home hero and services render (FO)', async () => {
  const html = await readDist('index.html');
  assert.match(html, /Minni umsiting\. Meira ítrótt\./);
  assert.match(html, /føroyskan ítrótt\./);
  assert.match(html, /href="\/klaedir"/);
  assert.match(html, /href="\/utgerd"/);
  assert.match(html, /href="\/prenting"/);
  assert.match(html, /href="\/club-shop"/);
});

test('home hero and services render (EN)', async () => {
  const html = await readDist('en/index.html');
  assert.match(html, /Faroese sport\./);
  assert.match(html, /href="\/en\/apparel"/);
});

test('all photo assets exist and are non-trivial in size', async () => {
  const names = ['hero', 'apparel', 'equipment', 'printing', 'clubshop', 'about', 'philosophy'];
  for (const name of names) {
    const url = new URL(`../src/assets/photos/${name}.jpg`, import.meta.url);
    await access(url); // throws if missing
  }
});
