import fs from 'fs';
import path from 'path';

// workspace root assumed to be two levels up from this script: adjust explicitly
const csvPath = path.resolve('C:/proje-aytek-rugs/images-map.csv');
const outPath = path.resolve('C:/proje-aytek-rugs/images-map.normalized.csv');

function normalizeId(id) {
  if (!id) return id;
  let s = String(id).trim();
  // remove surrounding quotes
  if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);
  // remove trailing .0 (only when decimal .0)
  if (/^\d+\.0$/.test(s)) s = s.replace(/\.0$/, '');
  return s;
}

(async function main(){
  if (!fs.existsSync(csvPath)) {
    console.error('images-map.csv not found at', csvPath);
    process.exit(2);
  }
  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = lines.shift();
  const outLines = [header];
  let changed = 0;
  for(const ln of lines){
    // simple CSV split on first comma (product_id,file_ids)
    const m = ln.match(/^\s*("?[^"]+"?)\s*,\s*("?.*"?)\s*$/);
    if(!m){
      outLines.push(ln);
      continue;
    }
    const rawId = m[1];
    const rest = m[2];
    const norm = normalizeId(rawId);
    const quoted = '"' + norm + '"';
    if(quoted !== rawId) changed++;
    outLines.push(`${quoted},${rest}`);
  }
  fs.writeFileSync(outPath, outLines.join('\n'));
  console.log('wrote', outPath);
  console.log('lines read:', lines.length + 1);
  console.log('changed keys:', changed);
})();
