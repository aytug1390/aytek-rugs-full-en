#!/usr/bin/env node
import fetch from 'node-fetch';
import fs from 'node:fs';

(async ()=>{
  try {
  const res = await fetch('http://127.0.0.1:5001/admin-api/products?product_id=16390&limit=1');
    const j = await res.json();
    fs.writeFileSync('tmp_fetch_result.json', JSON.stringify(j, null, 2));
    console.log('wrote tmp_fetch_result.json');
  } catch (e) {
    fs.writeFileSync('tmp_fetch_result.json', JSON.stringify({error: e.message}));
    console.error('fetch failed', e.message);
  }
})();
