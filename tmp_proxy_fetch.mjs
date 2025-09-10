(async()=>{
  try{
    const proxy = 'http://127.0.0.1:3000';
    const id = '68bfa486b8548c8ef1e73973';
    const r1 = await fetch(`${proxy}/api/admin-api/products/${encodeURIComponent(id)}`);
    console.log('PROXY STATUS:', r1.status);
    const t1 = await r1.text();
    console.log('PROXY BODY:\n', t1);

    const r2 = await fetch(`${proxy}/api/admin-api/products?product_id=${encodeURIComponent('16194')}&limit=1`);
    console.log('UPSTREAM LIST VIA PROXY STATUS:', r2.status);
    const t2 = await r2.text();
    console.log('UPSTREAM LIST VIA PROXY BODY:\n', t2);
  }catch(e){ console.error('fetch failed', e && e.message ? e.message : e); }
})();
