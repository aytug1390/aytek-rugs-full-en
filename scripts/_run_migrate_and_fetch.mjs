#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fetch from 'node-fetch';

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/aytekdb';
console.log('MONGO_URI=', MONGO);
try {
  execSync(`node "${process.cwd()}\\scripts\\apply-fill-descriptions-verbose.mjs"`, { stdio: 'inherit', env: { ...process.env, MONGO_URI: MONGO } });
} catch (e) {
  console.error('migration failed', e.message);
}

(async ()=>{
  try {
  const res = await fetch('http://127.0.0.1:5001/admin-api/products?product_id=16390&limit=1');
    const j = await res.json();
    console.log('backend fetch result:', JSON.stringify(j.items && j.items[0] ? { product_id: j.items[0].product_id, description_html: j.items[0].description_html } : j, null, 2));
  } catch (e) {
    console.error('fetch failed', e.message);
  }
})();
