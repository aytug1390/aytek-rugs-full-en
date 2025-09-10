import 'dotenv/config';
import fs from 'fs';

(async()=>{
  const id = process.argv[2] || '68bfa486b8548c8ef1e73973';
  const candidates = ['tmp_products_colors_backup.json','tmp_products_backup.json','tmp_image_report.json'];
  for(const file of candidates){
    if(!fs.existsSync(file)) continue;
    try{
      const raw = fs.readFileSync(file,'utf8');
      const data = JSON.parse(raw);
      const products = data.products ?? data.items ?? data;
      if(!Array.isArray(products)) continue;
      const found = products.find(p=>String(p._id)===id);
      if(found){
        console.log('found in', file, '-> product_id', found.product_id ?? found.productId ?? found.id);
        const pid = String(found.product_id ?? found.productId ?? found.id);
        const upstream = (process.env.ADMIN_API_ORIGIN || 'http://127.0.0.1:5000');
        const url = `${upstream}/admin-api/products?product_id=${encodeURIComponent(pid)}&limit=1`;
        try{
          const r = await fetch(url);
          console.log('upstream status', r.status);
          const txt = await r.text();
          console.log(txt.slice(0,800));
        }catch(e){
          console.error('fetch error', e.message);
        }
      }
    }catch(e){/* ignore parse errors */}
  }
  process.exit(0);
})();
