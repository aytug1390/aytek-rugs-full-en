import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { request as httpsRequest } from 'https';
import { request as httpRequest } from 'http';
import '../server/db.js';
import Product from '../server/models/Product.js';

const argv = process.argv.slice(2);
const outIndex = argv.findIndex(a => a === '--output');
const concIndex = argv.findIndex(a => a === '--concurrency');
const output = outIndex >= 0 ? argv[outIndex + 1] : 'tmp/broken-drive-urls.csv';
const concurrency = concIndex >= 0 ? parseInt(argv[concIndex + 1], 10) || 4 : 8;

function headUrl(url){
  if (!url) return Promise.resolve({ error: 'no-url' });
  return new Promise((resolve)=>{
    try{
      const u = new URL(url);
      const opts = { method: 'HEAD', hostname: u.hostname, path: u.pathname + (u.search || ''), headers: { 'User-Agent': 'Node' } };
      const reqFn = u.protocol === 'https:' ? httpsRequest : httpRequest;
      const req = reqFn(opts, (res)=>{
        const location = res.headers.location || '';
        resolve({ status: res.statusCode, location });
      });
      req.on('error', (err)=> resolve({ error: String(err) }));
      req.end();
    }catch(e){
      resolve({ error: String(e) });
    }
  });
}

function csvEscape(str){
  if (str == null) return '';
  str = String(str);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')){
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

async function run(){
  console.log('[csv] output=', output, 'concurrency=', concurrency);
  const outDir = path.dirname(output);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const ws = fs.createWriteStream(output, { encoding: 'utf8' });
  ws.write('product_id,sku,url,status,location\n');

  const products = await Product.find({}).lean().exec();
  console.log('[csv] products:', products.length);

  let idx = 0;
  const inFlight = new Set();

  async function handleProduct(p){
    const sku = p.product_id || p._id;
    const url = (p.images && p.images[0] && p.images[0].url) || p.main_image || '';
    const r = await headUrl(url);
    const status = r.error ? `ERROR: ${r.error}` : `HTTP ${r.status}`;
    const location = r.location || '';
    const row = [sku, sku, csvEscape(url || ''), csvEscape(status), csvEscape(location)].join(',') + '\n';
    ws.write(row);
  }

  for (; idx < products.length; idx++){
    const p = products[idx];
    const promise = handleProduct(p).then(()=> inFlight.delete(promise)).catch(()=> inFlight.delete(promise));
    inFlight.add(promise);
    if (inFlight.size >= concurrency){
      await Promise.race(Array.from(inFlight));
    }
  }
  // wait for remaining
  await Promise.all(Array.from(inFlight));
  ws.end();
  console.log('[csv] done. wrote', output);
  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(2); });
