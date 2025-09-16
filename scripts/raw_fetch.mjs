import http from 'node:http';
import https from 'node:https';
function fetchUrl(url){
  return new Promise((resolve,reject)=>{
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, (res)=>{
      let data=''; res.on('data',c=>data+=c); res.on('end',()=>resolve({status:res.statusCode, body:data}));
    });
    req.on('error',reject); req.setTimeout(10000, ()=>{req.abort(); reject(new Error('timeout'));});
  });
}
(async()=>{
  try{ const p = await fetchUrl('http://localhost:3000/api/admin-api/products?product_id=16390&limit=1'); console.log('proxy',p.status); console.log(p.body.slice(0,2000)); }catch(e){ console.error('proxy failed',e.message); }
  try{ const b = await fetchUrl('http://127.0.0.1:5001/admin-api/products?product_id=16390&limit=1'); console.log('backend',b.status); console.log(b.body.slice(0,2000)); }catch(e){ console.error('backend failed',e.message); }
})();
