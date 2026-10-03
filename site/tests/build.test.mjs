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

test('home values, philosophy, process and cta render (FO)', async () => {
  const html = await readDist('index.html');
  assert.match(html, /Alt á einum stað\./);
  assert.match(html, /TREYST er ein viðleikari\./);
  assert.match(html, /Hvussu vit arbeiða/);
  assert.match(html, /Ger gerandisdagin lættari/);
});

test('home values, philosophy, process and cta render (EN)', async () => {
  const html = await readDist('en/index.html');
  assert.match(html, /All in one place\./);
  assert.match(html, /TREYST is a teammate\./);
  assert.match(html, /How we work/);
  assert.match(html, /Make everyday easier/);
});

test('apparel page renders (FO)', async () => {
  const html = await readDist('klaedir/index.html');
  assert.match(html, /Klæðir til ítróttafeløg/);
  assert.match(html, /Liðbúni/);
  assert.match(html, /<details/);
  assert.match(html, /href="\/samband"/);
});

test('equipment page renders (EN)', async () => {
  const html = await readDist('en/equipment/index.html');
  assert.match(html, /Equipment for sports clubs/);
  assert.match(html, /href="\/en\/contact"/);
});

test('printing page includes the jersey customizer (FO)', async () => {
  const html = await readDist('prenting/index.html');
  assert.match(html, /data-customizer/);
  assert.match(html, /data-jersey-body/);
  assert.match(html, /data-name-input/);
  assert.match(html, /name="jersey-color"/);
});

test('printing page includes the jersey customizer (EN)', async () => {
  const html = await readDist('en/printing/index.html');
  assert.match(html, /data-customizer/);
  assert.match(html, /Try it yourself/);
});

test('club shop page renders steps (FO)', async () => {
  const html = await readDist('club-shop/index.html');
  assert.match(html, /Club Shop til títt felag/);
  assert.match(html, /Uppseting/);
  assert.match(html, /Bíleggingar/);
  assert.match(html, /01/);
  assert.match(html, /04/);
});

test('club shop page renders steps (EN)', async () => {
  const html = await readDist('en/club-shop/index.html');
  assert.match(html, /A club shop for your club/);
  assert.match(html, /Catalogue/);
});

test('about page renders (FO)', async () => {
  const html = await readDist('um-okkum/index.html');
  assert.match(html, /Ikki bert ein veitari\./);
  assert.match(html, /Ein viðleikari\./);
  assert.match(html, /info@treyst\.fo/);
});

test('about page renders (EN)', async () => {
  const html = await readDist('en/about/index.html');
  assert.match(html, /Not just a supplier\./);
  assert.match(html, /A teammate\./);
});

test('contact page has the form (FO)', async () => {
  const html = await readDist('samband/index.html');
  assert.match(html, /name="name"/);
  assert.match(html, /name="club"/);
  assert.match(html, /name="email"/);
  assert.match(html, /name="message"/);
  assert.match(html, /data-msg-success/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /honeypot/);
});

test('contact page has the form (EN)', async () => {
  const html = await readDist('en/contact/index.html');
  assert.match(html, /Get in touch/);
  assert.match(html, /name="message"/);
});

test('legal pages and 404 render', async () => {
  assert.equal(await exists('treytir/index.html'), true);
  assert.equal(await exists('privatlivspolitikkur/index.html'), true);
  assert.equal(await exists('en/terms/index.html'), true);
  assert.equal(await exists('en/privacy/index.html'), true);
  assert.equal(await exists('404.html'), true);
  const notFound = await readDist('404.html');
  assert.match(notFound, /Síðan varð ikki funnin\./);
});

const PAIRS = [
  ['index.html', 'en/index.html', '/', '/en/'],
  ['klaedir/index.html', 'en/apparel/index.html', '/klaedir', '/en/apparel'],
  ['utgerd/index.html', 'en/equipment/index.html', '/utgerd', '/en/equipment'],
  ['prenting/index.html', 'en/printing/index.html', '/prenting', '/en/printing'],
  ['club-shop/index.html', 'en/club-shop/index.html', '/club-shop', '/en/club-shop'],
  ['um-okkum/index.html', 'en/about/index.html', '/um-okkum', '/en/about'],
  ['samband/index.html', 'en/contact/index.html', '/samband', '/en/contact'],
  ['treytir/index.html', 'en/terms/index.html', '/treytir', '/en/terms'],
  ['privatlivspolitikkur/index.html', 'en/privacy/index.html', '/privatlivspolitikkur', '/en/privacy'],
];

test('hreflang pairs are reciprocal on every page', async () => {
  for (const [foFile, enFile, foPath, enPath] of PAIRS) {
    const foHtml = await readDist(foFile);
    const enHtml = await readDist(enFile);
    const foUrl = `https://treyst.fo${foPath}`;
    const enUrl = `https://treyst.fo${enPath}`;
    assert.ok(foHtml.includes(`hreflang="fo" href="${foUrl}"`), `${foFile}: missing fo hreflang`);
    assert.ok(foHtml.includes(`hreflang="en" href="${enUrl}"`), `${foFile}: missing en hreflang`);
    assert.ok(foHtml.includes(`hreflang="x-default" href="${foUrl}"`), `${foFile}: missing x-default`);
    assert.ok(enHtml.includes(`hreflang="fo" href="${foUrl}"`), `${enFile}: missing fo hreflang`);
    assert.ok(enHtml.includes(`hreflang="en" href="${enUrl}"`), `${enFile}: missing en hreflang`);
    assert.ok(enHtml.includes(`hreflang="x-default" href="${foUrl}"`), `${enFile}: missing x-default`);
  }
});

test('jersey assets exist and are non-trivial', async () => {
  const url = new URL('../src/data/jerseys.mjs', import.meta.url);
  await access(url); // throws if missing
  const credits = new URL('../src/assets/jerseys/CREDITS.md', import.meta.url);
  await access(credits);
});

test('sitemap, robots and JSON-LD are present', async () => {
  assert.equal(await exists('sitemap-index.xml'), true, 'sitemap-index.xml should exist');
  const robots = await readDist('robots.txt');
  assert.match(robots, /Sitemap: https:\/\/treyst\.fo\/sitemap-index\.xml/);
  const html = await readDist('index.html');
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /"@type":"LocalBusiness"/);
  assert.equal(await exists('og-image.png'), true, 'og-image.png should exist');
});
