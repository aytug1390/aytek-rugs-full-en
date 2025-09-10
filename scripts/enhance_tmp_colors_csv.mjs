import fs from 'fs/promises';
import path from 'path';
import { parse as csvParse } from 'csv-parse/sync';
import { stringify as csvStringify } from 'csv-stringify/sync';

const root = process.cwd();
const csvPath = path.join(root, 'tmp_colors_by_sku.csv');
const jsonPath = path.join(root, 'kayseriproductsfinal.prepped.json');
const outPath = path.join(root, 'tmp_colors_by_sku.enhanced.csv');

async function run(){
  const csvText = await fs.readFile(csvPath, 'utf8');
  const rows = csvParse(csvText, { columns: true, skip_empty_lines: true });

  let json = [];
  try{
    const jtext = await fs.readFile(jsonPath, 'utf8');
    json = JSON.parse(jtext);
  }catch(e){
    console.warn('Could not read prepped JSON, proceeding without size/origin');
  }

  const jsonBySku = new Map();
  for(const p of json){
    if(p.product_id) jsonBySku.set(String(p.product_id), p);
    if(p.sku) jsonBySku.set(String(p.sku), p);
  }

  const out = [];
  for(const r of rows){
    const sku = (r.sku || r.product_id || '').toString().trim();
    const j = jsonBySku.get(sku) || {};
    const colorList = [];
    if(r.color1) colorList.push(r.color1);
    if(r.color2) colorList.push(r.color2);
    if(r.color3) colorList.push(r.color3);
    const color = colorList.join(';');
    const origin = j.origin || j.country || '';
    const size = j.size || j.size_text || j.dimensions || '';
    const descriptionParts = [];
    if(color) descriptionParts.push(`Color: ${color}`);
    if(origin) descriptionParts.push(`Origin: ${origin}`);
    if(size) descriptionParts.push(`Size: ${size}`);
    const description = descriptionParts.join('; ');

    out.push({
      sku,
      image: r.image || r.url || '',
      color,
      origin,
      size,
      description,
      color1: r.color1||'',
      color2: r.color2||'',
      color3: r.color3||'',
      error: r.error||''
    });
  }

  const csvOut = csvStringify(out, { header: true });
  await fs.writeFile(outPath, csvOut, 'utf8');
  console.log('Wrote', outPath);
}

run().catch(err=>{ console.error(err); process.exit(1); });
