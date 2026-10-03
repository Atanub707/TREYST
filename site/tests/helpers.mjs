import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const distPath = (rel) => fileURLToPath(new URL(`../dist/${rel}`, import.meta.url));

export async function readDist(rel) {
  return readFile(distPath(rel), 'utf8');
}

export async function exists(rel) {
  try {
    await access(distPath(rel));
    return true;
  } catch {
    return false;
  }
}
