// Simple test that posts a small CSV as UTF-8 and UTF-16LE (with BOM) to /admin-products/import-csv
(async ()=>{
  const base = 'http://127.0.0.1:5000';
  const sample = `product_id,title,price,sale_price,availability,material,color,color_hex,size_text,origin,age_group,pattern,images,status,visibility
test-utf8,Test Rug UTF8,100,90,in stock,wool,Beige|Red,#cbb79c|#7a1f2b,170x240,Anatolia,adult,geometric,https://example.com/1.jpg active,active,public
`;

  try{
    console.log('POST UTF-8 sample');
    let r = await fetch(base + '/admin-products/import-csv', { method: 'POST', headers: { 'content-type': 'text/csv' }, body: sample });
    console.log('status', r.status);
    try{ console.log(await r.json()); } catch(e){ console.log(await r.text()); }
  }catch(e){ console.error('utf8 send failed', e); }

  try{
    console.log('POST UTF-16LE sample (with BOM)');
    // create buffer with BOM 0xFF 0xFE then utf16le encoded content
    const bom = Buffer.from([0xFF, 0xFE]);
    const contentBuf = Buffer.from(sample, 'utf16le');
    const payload = Buffer.concat([bom, contentBuf]);
    let r2 = await fetch(base + '/admin-products/import-csv', { method: 'POST', headers: { 'content-type': 'text/csv' }, body: payload });
    console.log('status', r2.status);
    try{ console.log(await r2.json()); } catch(e){ console.log(await r2.text()); }
  }catch(e){ console.error('utf16 send failed', e); }
})();
