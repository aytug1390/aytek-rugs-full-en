(async()=>{
  try{
    const proxy = 'http://127.0.0.1:3000';
    const id = '68bfa486b8548c8ef1e73973';
    const r = await fetch(`${proxy}/rug/${encodeURIComponent(id)}`);
    console.log('STATUS', r.status);
    const txt = await r.text();
    console.log('HTML PREVIEW (first 2000 chars):\n', txt.slice(0,2000));
  }catch(e){ console.error('fetch failed', e && e.message ? e.message : e); }
})();
