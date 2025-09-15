#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const CACHE_DIR = path.resolve("tmp/drive-cache");
const MAX_BYTES = 500 * 1024 * 1024; // 500 MB

if (!fs.existsSync(CACHE_DIR)) {
  console.log("No cache dir:", CACHE_DIR);
  process.exit(0);
}

const files = fs.readdirSync(CACHE_DIR)
  .map(name => {
    const p = path.join(CACHE_DIR, name);
    const st = fs.statSync(p);
    return { p, name, size: st.size, mtimeMs: st.mtimeMs };
  })
  .sort((a, b) => b.mtimeMs - a.mtimeMs); // newest -> oldest

const total = files.reduce((s,f)=>s+f.size, 0);
if (total <= MAX_BYTES) {
  console.log("Cache OK:", (total/1e6).toFixed(1), "MB");
  process.exit(0);
}

let freed = 0;
let keepUntil = 0;
for (let i = 0; i < files.length; i++) {
  keepUntil += files[i].size;
  if (keepUntil > MAX_BYTES) {
    // delete files from i..end
    const toDelete = files.slice(i);
    for (const f of toDelete) {
      try { fs.unlinkSync(f.p); freed += f.size; } catch (e) {}
    }
    break;
  }
}
console.log("Pruned ~", (freed/1e6).toFixed(1), "MB");
