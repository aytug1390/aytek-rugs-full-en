import { chromium } from 'playwright';

(async()=>{
  const url = process.env.URL || 'http://127.0.0.1:3000/all-rugs';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  const bodyText = await page.evaluate(()=> document.body.innerText);
  const has388 = bodyText.includes('388');
  const idx = bodyText.indexOf('All Rugs');
  const snippet = idx>=0 ? bodyText.slice(Math.max(0, idx-40), idx+80) : '';
  console.log('has388:', has388);
  if (has388){
    const i = bodyText.indexOf('388');
    console.log('context around 388:\n', bodyText.slice(Math.max(0,i-40), i+40));
  }
  console.log('all-rugs header snippet:', snippet || '(not found)');
  await browser.close();
})();
