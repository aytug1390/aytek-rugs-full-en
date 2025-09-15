#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import process from 'process';

const argv = new Map(process.argv.slice(2).map(a => {
  const [k, v] = a.includes('=') ? a.split('=') : [a, true];
  return [k, v === undefined ? true : v];
}));

const WRITE = argv.has('--write') || argv.has('-w');
const CHECK = argv.has('--check') || !WRITE;

// --dir=aytek-rugs-full-en/app/api
const ROOT = process.cwd();
const API_DIR = path.resolve(ROOT, String(argv.get('--dir') || 'app/api'));

async function walk(dir, hits) {
  const ents = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of ents) {
    const fp = path.join(dir, ent.name);
    if (ent.isDirectory()) await walk(fp, hits);
    else if (ent.isFile() && (ent.name === 'route.ts' || ent.name === 'route.js')) hits.push(fp);
  }
}

function ensureJsonUtf8Import(src) {
  if (src.includes("@/lib/responses")) return src;
  const lines = src.split('\n');
  let lastImport = -1;
  for (let i = 0; i < lines.length; i++) if (/^\s*import\b/.test(lines[i])) lastImport = i;
  if (lastImport >= 0) lines.splice(lastImport + 1, 0, `import { jsonUtf8 } from '@/lib/responses';`);
  else lines.unshift(`import { jsonUtf8 } from '@/lib/responses';`);
  return lines.join('\n');
}

function removeUnusedNextResponseImport(src) {
  if (/\bNextResponse\b/.test(src)) return src; // still used
  return src
    .replace(/import\s*\{\s*NextResponse\s*,\s*NextRequest\s*\}\s*from\s*['"]next\/server['"]\s*;?\s*\n?/g, `import { NextRequest } from 'next/server';\n`)
    .replace(/import\s*\{\s*NextRequest\s*,\s*NextResponse\s*\}\s*from\s*['"]next\/server['"]\s*;?\s*\n?/g, `import { NextRequest } from 'next/server';\n`)
    .replace(/import\s*\{\s*NextResponse\s*\}\s*from\s*['"]next\/server['"]\s*;?\s*\n?/g, ``)
    .replace(/import\s*\{\s*\s*\}\s*from\s*['"]next\/server['"]\s*;?\s*\n?/g, ``);
}

function migrateBodyCalls(src) {
  let changed = false;
  let out = src;

  if (/\bNextResponse\.json\s*\(/.test(out)) {
    out = out.replace(/\bNextResponse\.json\s*\(/g, 'jsonUtf8(');
    changed = true;
  }
  if (/\bResponse\.json\s*\(/.test(out)) {
    out = out.replace(/\bResponse\.json\s*\(/g, 'jsonUtf8(');
    changed = true;
  }
  if (/new\s+Response\s*\(\s*JSON\.stringify\s*\(/.test(out)) {
    out = out.replace(/new\s+Response\s*\(\s*JSON\.stringify\s*\(/g, 'jsonUtf8(');
    changed = true;
  }
  return { out, changed };
}

async function run() {
  const targets = [];
  try { await walk(API_DIR, targets); }
  catch (e) {
    console.error(`Cannot read ${API_DIR}:`, e.message);
    process.exit(1);
  }

  let filesChanged = 0;
  for (const file of targets) {
    let src = await fs.readFile(file, 'utf8');
    const orig = src;
    const { out, changed } = migrateBodyCalls(src);
    if (changed) {
      let s = ensureJsonUtf8Import(out);
      s = removeUnusedNextResponseImport(s);
      if (s !== orig) {
        filesChanged++;
        if (WRITE) {
          await fs.writeFile(file, s, 'utf8');
          console.log(`✔ migrated: ${path.relative(ROOT, file)}`);
        } else {
          console.log(`~ would change: ${path.relative(ROOT, file)}`);
        }
      }
    }
  }

  console.log(WRITE
    ? `\nDone. Migrated ${filesChanged} file(s).`
    : `\nCheck mode: ${filesChanged} file(s) would change. Re-run with --write to apply.`);
}

run().catch(e => { console.error(e); process.exit(1); });
