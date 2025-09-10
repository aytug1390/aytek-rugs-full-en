import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

(async () => {
  const outDir = path.resolve('tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const url = process.env.URL || 'http://127.0.0.1:3000/all-rugs';
  console.log('[hv] launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  console.log('[hv] navigating to', url);
  await page.goto(url, { waitUntil: 'networkidle' , timeout: 30000 }).catch(e=>{ console.error('[hv] goto failed', e.message); });
  // wait for a likely element
  await page.waitForTimeout(1000);
  let headerText = '';
  try {
    headerText = await page.$eval('h1', el => el.innerText.trim());
  } catch (e) {
    console.error('[hv] failed to read h1:', e.message);
    // try to find by text
    const body = await page.content();
    const m = body.match(/All Rugs \([^\)]*\)/i);
    headerText = m ? m[0] : '';
  }

  const htmlPath = path.join(outDir, 'all-rugs-rendered.html');
  fs.writeFileSync(htmlPath, await page.content(), 'utf8');
  const shotPath = path.join(outDir, 'all-rugs-screenshot.png');
  await page.screenshot({ path: shotPath, fullPage: true });

  console.log('[hv] header:', headerText || '(not found)');
  console.log('[hv] saved html ->', htmlPath);
  console.log('[hv] saved screenshot ->', shotPath);

  await browser.close();
})();
