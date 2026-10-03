import { test } from 'node:test';
import assert from 'node:assert/strict';
import { t, switchLocalePath, localizePath } from '../src/i18n/utils.mjs';
import { services, otherServices, serviceById } from '../src/data/services.mjs';
import { ui } from '../src/i18n/ui.mjs';

test('t returns localized string', () => {
  assert.equal(t('fo', 'nav.home'), 'Heim');
  assert.equal(t('en', 'nav.home'), 'Home');
});

test('t falls back to fo then key', () => {
  assert.equal(t('de', 'nav.home'), 'Heim');
  assert.equal(t('fo', 'nope.missing'), 'nope.missing');
});

test('switchLocalePath maps both directions', () => {
  assert.equal(switchLocalePath('/klaedir', 'en'), '/en/apparel');
  assert.equal(switchLocalePath('/en/apparel', 'fo'), '/klaedir');
  assert.equal(switchLocalePath('/en/', 'fo'), '/');
  assert.equal(switchLocalePath('/', 'en'), '/en/');
});

test('switchLocalePath handles unknown paths gracefully', () => {
  assert.equal(switchLocalePath('/whatever', 'en'), '/en/');
});

test('localizePath localizes known paths', () => {
  assert.equal(localizePath('/um-okkum', 'en'), '/en/about');
  assert.equal(localizePath('/um-okkum', 'fo'), '/um-okkum');
});

test('services data is well-formed', () => {
  assert.equal(services.length, 4);
  assert.deepEqual(services.map((s) => s.id), ['apparel', 'equipment', 'printing', 'clubshop']);
  assert.equal(serviceById('printing').slugs.fo, '/prenting');
  assert.equal(otherServices('printing').length, 3);
});

test('switchLocalePath maps jersey detail routes by prefix', () => {
  assert.equal(switchLocalePath('/roynd/jersey-03', 'en'), '/en/try-on/jersey-03');
  assert.equal(switchLocalePath('/en/try-on/jersey-11', 'fo'), '/roynd/jersey-11');
  assert.equal(switchLocalePath('/roynd/jersey-03', 'fo'), '/roynd/jersey-03');
});

test('every dictionary key has non-empty fo and en values', () => {
  for (const [key, entry] of Object.entries(ui)) {
    assert.ok(entry && typeof entry === 'object', `${key} missing entry`);
    for (const lang of ['fo', 'en']) {
      const value = entry[lang];
      const ok = (typeof value === 'string' && value.trim().length > 0) || (Array.isArray(value) && value.length > 0);
      assert.ok(ok, `${key} missing ${lang}`);
    }
  }
});
