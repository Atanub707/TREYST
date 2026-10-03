import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const astroDir = new URL('../dist/_astro/', import.meta.url);

test('total JS is under 35 KB gzipped', async () => {
  const files = (await readdir(astroDir)).filter((f) => f.endsWith('.js'));
  let total = 0;
  for (const file of files) {
    total += gzipSync(await readFile(new URL(file, astroDir))).length;
  }
  assert.ok(total < 35 * 1024, `JS budget exceeded: ${(total / 1024).toFixed(1)} KB gzipped`);
});

test('total CSS is under 45 KB gzipped', async () => {
  const files = (await readdir(astroDir)).filter((f) => f.endsWith('.css'));
  let total = 0;
  for (const file of files) {
    total += gzipSync(await readFile(new URL(file, astroDir))).length;
  }
  assert.ok(total < 45 * 1024, `CSS budget exceeded: ${(total / 1024).toFixed(1)} KB gzipped`);
});

test('no placeholder text ships in any page', async () => {
  const dist = fileURLToPath(new URL('../dist/', import.meta.url));
  const walk = async (dir) => {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const full = `${dir}/${entry.name}`;
      if (entry.isDirectory()) files.push(...(await walk(full)));
      else if (entry.name.endsWith('.html')) files.push(full);
    }
    return files;
  };
  for (const file of await walk(dist)) {
    const html = await readFile(file, 'utf8');
    assert.ok(!/TODO|TBD|lorem ipsum/i.test(html), `placeholder text found in ${file}`);
  }
});
