import fs from 'fs';

const proxy = process.env.NEXT_PUBLIC_PROXY_ORIGIN || 'http://127.0.0.1:3000';
const skus = ['10005','16194','16390'];

function checkCsv(sku){
  const csv = fs.readFileSync('./tmp_colors_by_sku.enhanced.csv','utf8');
  const re = new RegExp('^'+sku+'[,\\s]', 'm');
  return re.test(csv);
}

(async()=>{
  for(const sku of skus){
    const inCsv = checkCsv(sku);
    console.log('=== SKU', sku, '===');
    console.log('in enhanced CSV:', inCsv);
    try{
      const url = `${proxy}/api/admin-api/products?product_id=${encodeURIComponent(sku)}&limit=1`;
      const r = await fetch(url, { cache: 'no-store' });
      console.log('proxy list status:', r.status);
      if(r.ok){
        const body = await r.json();
        const item = Array.isArray(body.items) && body.items[0] ? body.items[0] : null;
        if(!item) { console.log('no item in list response'); continue; }
        console.log('product_id:', item.product_id || item._id);
        const hasDescription = !!(item.description_html || item.description || item.long_description);
        const imagesCount = Array.isArray(item.images) ? item.images.length : (item.image_url ? 1 : 0);
        console.log('hasDescription:', hasDescription, 'imagesCount:', imagesCount);
      } else {
        const txt = await r.text();
        console.log('body:', txt.slice(0,400));
      }
    }catch(e){ console.error('fetch error', e && e.message ? e.message : e); }
    console.log('\n');
  }
})();
