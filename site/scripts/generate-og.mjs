import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0C1512"/>
  <rect x="80" y="452" width="120" height="6" fill="#2DD4BF"/>
  <text x="80" y="372" font-family="Helvetica, Arial, sans-serif" font-size="150" font-weight="700" fill="#FFFFFF" letter-spacing="8">TREYST</text>
  <text x="84" y="430" font-family="Helvetica, Arial, sans-serif" font-size="32" fill="rgba(255,255,255,0.75)">Ítróttarklæðir · Útgerð · Prenting · Club Shop</text>
  <text x="84" y="560" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="rgba(255,255,255,0.5)">Hoyvík, Føroyar · treyst.fo</text>
</svg>`;

const out = fileURLToPath(new URL('../public/og-image.png', import.meta.url));
await sharp(Buffer.from(svg)).png().toFile(out);
console.log('wrote', out);
