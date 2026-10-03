import { ui } from './ui.mjs';
import { services } from '../data/services.mjs';

export const LANGS = ['fo', 'en'];

export function t(lang, key) {
  const entry = ui[key];
  if (!entry) return key;
  return entry[lang] ?? entry.fo ?? key;
}

export const ROUTE_PAIRS = [
  { fo: '/', en: '/en/' },
  ...services.map((s) => ({ fo: s.slugs.fo, en: s.slugs.en })),
  { fo: '/roynd', en: '/en/try-on' },
  { fo: '/um-okkum', en: '/en/about' },
  { fo: '/samband', en: '/en/contact' },
  { fo: '/treytir', en: '/en/terms' },
  { fo: '/privatlivspolitikkur', en: '/en/privacy' },
];

const strip = (path) => (path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path);

export function switchLocalePath(pathname, targetLang) {
  const current = strip(pathname || '/');
  const pair = ROUTE_PAIRS.find((p) => strip(p.fo) === current || strip(p.en) === current);
  if (!pair) return targetLang === 'en' ? '/en/' : '/';
  return targetLang === 'en' ? pair.en : pair.fo;
}

export function localizePath(path, lang) {
  if (lang !== 'en') return path;
  const pair = ROUTE_PAIRS.find((p) => p.fo === path);
  return pair ? pair.en : '/en/';
}

export function slugFor(id, lang) {
  const service = services.find((s) => s.id === id);
  if (!service) return '/';
  return service.slugs[lang] ?? service.slugs.fo;
}
