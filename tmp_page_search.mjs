(async()=>{
  try{
    const proxy = 'http://127.0.0.1:3000';
    const id = '68bfa486b8548c8ef1e73973';
    const r = await fetch(`${proxy}/rug/${encodeURIComponent(id)}`);
    const txt = await r.text();
    const checks = ['Cappadocia Rug','16194','description_html','images'];
    for(const c of checks){
      const idx = txt.indexOf(c);
      console.log(c, idx>=0 ? 'FOUND at '+idx : 'NOT FOUND');
      if(idx>=0){
        const start = Math.max(0, idx-120);
        const snippet = txt.slice(start, idx+120).replace(/\s+/g,' ');
        console.log('SNIPPET ->', snippet);
      }
    }
  }catch(e){ console.error('fetch failed', e && e.message ? e.message : e); }
})();
