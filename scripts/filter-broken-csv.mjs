import fs from 'fs';
import path from 'path';
const input = process.argv[2] || 'tmp/broken-drive-urls.csv';
const output = process.argv[3] || 'tmp/broken-drive-urls-errors.csv';
if (!fs.existsSync(input)){
  console.error('Input not found:', input); process.exit(2);
}
const data = fs.readFileSync(input, 'utf8').split(/\r?\n/);
const header = data.shift();
const rows = data.filter(Boolean).map(r => {
  // naive CSV split respecting quoted fields
  const parts = r.match(/(?:"([^"]*(?:""[^"]*)*)")|([^,]+)/g) || [];
  return parts.map(p => p.replace(/^"|"$/g, '').replace(/""/g, '"'));
});
const filtered = rows.filter(cols => {
  const status = (cols[3] || '').trim();
  if (!status) return true; // treat empty as suspicious
  if (status.startsWith('ERROR')) return true;
  const m = status.match(/^HTTP\s+(\d{3})/);
  if (m){
    const code = parseInt(m[1],10);
    if (code >= 400 && code < 600) return true;
    return false;
  }
  // if status is not HTTP/NICE, keep it
  return true;
});
if (!fs.existsSync(path.dirname(output))){ fs.mkdirSync(path.dirname(output), { recursive: true }); }
const out = [header, ...filtered.map(cols => cols.map(c=>{
  if (c.includes(',') || c.includes('"') || c.includes('\n')) return '"'+c.replace(/"/g,'""')+'"';
  return c;
}).join(','))].join('\n') + '\n';
fs.writeFileSync(output, out, 'utf8');
console.log('Wrote', output, 'rows_in=', filtered.length);
process.exit(0);
