async function run(){
  const apiUrl = 'http://127.0.0.1:5001/admin-api/products?limit=1&page=1';
  try{
    const r = await fetch(apiUrl);
    console.log('[api] status', r.status);
    const json = await r.json();
    console.log('[api] sample product count or keys:', Object.keys(json));
  }catch(e){
    console.error('[api] failed', e.message);
  }

  try{
    const r2 = await fetch('http://127.0.0.1:3000/all-rugs');
    console.log('[page] status', r2.status);
    const text = await r2.text();
    console.log('[page] len', text.length, 'startsWith', text.slice(0,120));
  }catch(e){
    console.error('[page] failed', e.message);
  }
}

run();
