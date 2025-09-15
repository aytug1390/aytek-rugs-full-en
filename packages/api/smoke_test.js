(async()=>{
  const base = 'http://127.0.0.1:5000';
  const log = (k,v)=> console.log(k, typeof v === 'string' ? v : JSON.stringify(v));
  try{
    const hres = await fetch(base + '/health');
    let h;
    try { h = await hres.json(); } catch(e){ h = await hres.text(); }
    log('HEALTH', h);

    const product = {
      product_id: 'test-123',
      title: 'Test Rug',
      price: 100,
      sale_price: 80,
      availability: 'in stock',
      brand: 'Aytek Rugs',
      images: ['https://example.com/img1.jpg'],
      status: 'active',
      visibility: 'public'
    };

    const up = await fetch(base + '/admin-products', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(product) });
    let upj; try { upj = await up.json(); } catch(e){ upj = await up.text(); }
    log('UPSERT', upj);

    const listR = await fetch(base + '/admin-products');
    const applied = listR.headers.get('x-applied-filters');
    let listj; try { listj = await listR.json(); } catch(e){ listj = await listR.text(); }
    log('LIST-HEADERS', applied);
    log('LIST', listj);

    const del = await fetch(base + '/admin-products/test-123', { method: 'DELETE' });
    let delj; try { delj = await del.json(); } catch(e){ delj = await del.text(); }
    log('DELETE', delj);

    const g = await fetch(base + '/gmc.csv', { method: 'HEAD' });
    log('GMC-HEAD', g.status);

    const im = await fetch(base + '/img?id=doesnotexist', { method: 'HEAD' });
    log('IMG-HEAD', im.status);

    process.exit(0);
  }catch(e){
    console.error('SMOKE ERROR', e);
    process.exit(2);
  }
})();
