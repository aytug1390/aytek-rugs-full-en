#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const targets = process.argv.slice(2);
if (!targets.length) {
  console.error("Kullanım: node scripts/normalize_drive_urls_in_json.mjs <dosya1> <dosya2> ...");
  process.exit(1);
}

const RX = {
  id: /(?:[?&]id=|\/d\/)([A-Za-z0-9_-]+)/i,
  anyDrive: /(https?:\/\/(?:drive\.google\.com|lh3\.googleusercontent\.com|drive\.usercontent\.google\.com|drive\.googleapis\.com)[^"'\s\)]*)/gi,
};

function toProxy(u) {
  const m = String(u).match(RX.id);
  return m?.[1] ? `/api/drive?id=${encodeURIComponent(m[1])}&sz=1200` : u;
}

for (const file of targets) {
  const p = path.resolve(file);
  if (!fs.existsSync(p)) { console.warn("Yok:", p); continue; }
  const txt = fs.readFileSync(p, "utf8");
  const out = txt.replace(RX.anyDrive, (_m, url) => toProxy(url));
  if (out !== txt) {
    fs.writeFileSync(p, out, "utf8");
    console.log("Normalized:", p);
  } else {
    console.log("Already OK:", p);
  }
}
