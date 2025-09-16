import fs from 'fs';
import path from 'path';

const fp = path.resolve(process.cwd(), 'cappadocia.csv');
if (!fs.existsSync(fp)) {
  console.error('cappadocia.csv not found');
  process.exit(2);
}
const raw = fs.readFileSync(fp, 'utf8');
// Simple CSV parser that handles quoted fields
function parseCSV(text) {
  const rows = [];
  let cur = [];
  let curField = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i+1];
    if (inQuotes) {
      if (ch === '"') {
        if (next === '"') { curField += '"'; i++; }
        else { inQuotes = false; }
      } else { curField += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { cur.push(curField); curField = ''; }
      else if (ch === '\r') { continue; }
      else if (ch === '\n') { cur.push(curField); rows.push(cur); cur = []; curField = ''; }
      else { curField += ch; }
    }
  }
  // last field
  if (inQuotes) {
    // malformed but still push
    cur.push(curField);
    rows.push(cur);
  } else if (curField !== '' || cur.length > 0) {
    cur.push(curField);
    rows.push(cur);
  }
  return rows;
}

const rows = parseCSV(raw);
if (!rows.length) { console.log('products: 0'); process.exit(0); }
const header = rows[0];
const data = rows.slice(1).filter(r => r.some(cell => cell && cell.trim() !== ''));
const products = data.length;
const imageIdx = header.indexOf('image_url');
let rowsWithImage = 0;
const unique = new Set();
if (imageIdx >= 0) {
  for (const r of data) {
    const v = (r[imageIdx] || '').trim();
    if (v) { rowsWithImage++; unique.add(v); }
  }
}
console.log('products:', products);
console.log('rows_with_image_url:', rowsWithImage);
console.log('unique_image_urls:', unique.size);
