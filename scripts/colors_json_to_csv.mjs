#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const inPath = path.join(process.cwd(),'tmp_colors_by_sku.json');
const outPath = path.join(process.cwd(),'tmp_colors_by_sku.csv');

if (!fs.existsSync(inPath)) {
  console.error('input file not found:', inPath);
  process.exit(2);
}

const raw = fs.readFileSync(inPath, 'utf8');
const data = JSON.parse(raw);

const rows = [];
rows.push(['sku','color1','color2','color3','image','error'].join(','));
for (const [sku, v] of Object.entries(data)) {
  const colors = v.colors || [];
  const image = v.image ? `"${String(v.image).replace(/"/g,'""')}"` : '';
  const error = v.error ? `"${String(v.error).replace(/"/g,'""')}"` : '';
  const c1 = colors[0] || '';
  const c2 = colors[1] || '';
  const c3 = colors[2] || '';
  rows.push([sku, c1, c2, c3, image, error].join(','));
}

fs.writeFileSync(outPath, rows.join('\n'), 'utf8');
console.log('wrote', outPath, 'rows=', rows.length-1);
