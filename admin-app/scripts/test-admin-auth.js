#!/usr/bin/env node
const http = require('http');
const { URL } = require('url');

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3001/admin';
// Prefer ADMIN_SECRET, but fall back to older names for compatibility
const ADMIN_SECRET_ENV = process.env.ADMIN_SECRET_ENV || 'ADMIN_SECRET';

function logResult(name, ok, details='') {
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}` + (details ? `\n       ${details}` : ''));
}

function request(url, opts={}){
  return new Promise((resolve, reject)=>{
    const u = new URL(url);
    const options = { method: opts.method||'GET', hostname: u.hostname, port: u.port, path: u.pathname + (u.search||''), headers: opts.headers||{} };
    const req = http.request(options, res=>{
      const chunks = [];
      res.on('data', c=>chunks.push(c));
      res.on('end', ()=>{
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({ statusCode: res.statusCode, headers: res.headers, body });
      });
    });
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

(async function main(){
  try{
    // 1) No cookie -> expect 302; perform a low-level GET and inspect status without following redirects.
    const rawNoCookie = await request(ADMIN_URL);
    if (rawNoCookie.statusCode === 302) {
      logResult('No-cookie should redirect (302)', true, `Location: ${rawNoCookie.headers.location || ''}`);
    } else {
      logResult('No-cookie should redirect (302)', rawNoCookie.statusCode === 302, `Got ${rawNoCookie.statusCode}`);
    }

    // 2) Invalid cookie -> expect 302
    const rawInvalid = await request(ADMIN_URL, { headers: { Cookie: 'admin_sess=abc.def' } });
    if (rawInvalid.statusCode === 302) {
      logResult('Invalid-cookie should redirect (302)', true, `Location: ${rawInvalid.headers.location || ''}`);
    } else {
      logResult('Invalid-cookie should redirect (302)', false, `Got ${rawInvalid.statusCode}`);
    }

    // 3) Valid token -> expect 200
    const secret = process.env[ADMIN_SECRET_ENV];
    if (!secret) {
      console.warn(`Warning: environment var ${ADMIN_SECRET_ENV} not set. Set it to run valid-token test.`);
      return;
    }
    // create token
    const crypto = require('crypto');
    const now = Date.now();
    const exp = now + 14*24*60*60*1000;
    const payload = { sub: 'admin', ts: now, exp };
    const b64u = s => Buffer.from(s).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    const p = b64u(JSON.stringify(payload));
    const sig = b64u(crypto.createHmac('sha256', secret).update(p).digest());
    const token = `${p}.${sig}`;

    const rawValid = await request(ADMIN_URL, { headers: { Cookie: `admin_sess=${token}` } });
    if (rawValid.statusCode === 200) {
      logResult('Valid-token should return 200', true, `Status: 200`);
    } else {
      logResult('Valid-token should return 200', false, `Got ${rawValid.statusCode}`);
    }
  }catch(e){
    console.error('Error running tests:', e);
    process.exit(2);
  }
})();
