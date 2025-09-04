import { rm, stat, rename } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function removeIfExists(relPath){
  const full = resolve(__dirname,'..',relPath);
  try {
    await stat(full);
    try {
      await rm(full,{force:true, recursive:true});
      console.log('[cleanup] removed', relPath);
    } catch (delErr) {
      // Fallback: rename so Next.js won't treat it as a route
      const renamed = full + '.disabled';
      try {
        await rename(full, renamed);
        console.log('[cleanup] renamed to disable', relPath);
      } catch (renameErr) {
        console.warn('[cleanup] failed to remove or rename', relPath, renameErr.message);
      }
    }
  } catch (e) {
    // ignore
  }
}

const targets = [
  'pages/services/rug-repair.jsx',
  'src/pages/services/rug-cleaning.jsx'
];

for (const t of targets) await removeIfExists(t);

// Also attempt to remove the entire legacy pages directory if now unused
await removeIfExists('pages/services');
await removeIfExists('pages');

// Retry a few times in case OneDrive resurrects the file shortly after deletion
for (let i=0;i<5;i++) {
  await new Promise(r=>setTimeout(r,300));
  for (const t of targets) await removeIfExists(t);
  await removeIfExists('pages/services');
  await removeIfExists('pages');
}

console.log('[cleanup] legacy page router files purged (if they existed)');

