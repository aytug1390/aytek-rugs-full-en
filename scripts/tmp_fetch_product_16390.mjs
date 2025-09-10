import fetch from 'node-fetch';
(async ()=>{
  try{
    const p = await fetch('http://localhost:3000/api/admin-api/products?product_id=16390&limit=1',{timeout:10000});
    console.log('proxy status', p.status); const j=await p.json(); console.log(JSON.stringify(j, null, 2));
  }catch(e){ console.error('proxy fetch failed', e.message); }
  try{
    const p2 = await fetch('http://127.0.0.1:5000/admin-api/products?product_id=16390&limit=1',{timeout:10000});
    console.log('backend status', p2.status); const j2=await p2.json(); console.log(JSON.stringify(j2, null, 2));
  }catch(e){ console.error('backend fetch failed', e.message); }
})();
