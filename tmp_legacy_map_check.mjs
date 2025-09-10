import 'dotenv/config';
import fs from 'fs';

(async()=>{
  const id='68bfa486b8548c8ef1e73976';
  const file='tmp_image_report.json';
  if(!fs.existsSync(file)){
    console.log('no file'); process.exit(0);
  }
  const raw=fs.readFileSync(file,'utf8');
  const data=JSON.parse(raw);
  const products=data.products||[];
  const found=products.find(p=>String(p._id)===id);
  console.log('found in tmp_image_report.json?', !!found, found?found.product_id:null);
  if(found){
    const pid=found.product_id;
    const upstream=(process.env.ADMIN_API_ORIGIN||'http://127.0.0.1:5000');
    const url = `${upstream}/admin-api/products?product_id=${encodeURIComponent(pid)}&limit=1`;
    try{
      const r = await fetch(url);
      console.log('upstream status', r.status);
      const j = await r.text();
      console.log(j.slice(0,1000));
    }catch(e){ console.error('fetch error', e.message); }
  }
  process.exit(0);
})();
