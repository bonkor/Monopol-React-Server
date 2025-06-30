// scripts/build-sprite.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import svgstore from 'svgstore';
import { optimize } from 'svgo';

// __filename и __dirname для ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sprite = svgstore();
const iconsDir = path.resolve(__dirname, '../src/assets/icons');

function collectSvgFiles(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSvgFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.svg')) {
      const rawSvg = fs.readFileSync(fullPath, 'utf-8');
      const optimized = optimize(rawSvg, { path: fullPath }).data;
      const symbolId = path
        .relative(iconsDir, fullPath)
        .replace(/\.svg$/, '')
        .replace(/[\\\/]/g, '-'); // → nested/file.svg => nested-file
      sprite.add(symbolId, optimized);
    }
  }
}

collectSvgFiles(iconsDir);

const outPath = path.resolve(__dirname, '../src/assets/sprite.svg');
//const outPath = path.resolve(__dirname, '../public/sprite.svg');
fs.writeFileSync(outPath, sprite.toString({ inline: true }), 'utf-8');
console.log('✅ SVG sprite saved to:', outPath);
