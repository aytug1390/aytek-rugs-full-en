import 'dotenv/config';
import { request as httpsRequest } from 'https';
import { request as httpRequest } from 'http';
import '../server/db.js';
import Product from '../server/models/Product.js';

const SKUS = [
  '10063','10138','10144','10435','10446','12102','13775','14921','15392','15355','16387'
];

function headUrl(url){
  if (!url) return Promise.resolve({ error: 'no-url' });
  return new Promise((resolve)=>{
    try{
      const u = new URL(url);
      const opts = { method: 'HEAD', hostname: u.hostname, path: u.pathname + (u.search || ''), headers: { 'User-Agent': 'Node' } };
      const reqFn = u.protocol === 'https:' ? httpsRequest : httpRequest;
      const req = reqFn(opts, (res)=>{
        const location = res.headers.location || null;
        resolve({ status: res.statusCode, location });
      });
      req.on('error', (err)=> resolve({ error: String(err) }));
      req.end();
    }catch(e){
      resolve({ error: String(e) });
    }
  });
}

async function run(){
  console.log('Checking Drive URLs for SKUs:', SKUS.join(', '));
  for (const sku of SKUS){
    const p = await Product.findOne({ product_id: String(sku) }).lean().exec();
    if (!p){
      console.log(`${sku}: product not found`);
      continue;
    }
    const url = (p.images && p.images[0] && p.images[0].url) || p.main_image || null;
    const r = await headUrl(url);
    if (r.error) console.log(`${sku}: url=${url || 'n/a'} -> ERROR: ${r.error}`);
    else console.log(`${sku}: url=${url || 'n/a'} -> status=${r.status}${r.location? ' location='+r.location: ''}`);
  }
  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(2); });
