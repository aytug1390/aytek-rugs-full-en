#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const inFile = process.argv[2];
if (!inFile) {
  console.error("Usage: node scripts/normalize_drive_urls_in_csv.mjs <input.csv>");
  process.exit(1);
}
const outFile = path.join(
  path.dirname(inFile),
  path.basename(inFile).replace(/\.csv$/i, ".normalized.csv")
);

const csv = fs.readFileSync(inFile, "utf8");

let out = csv.replace(
  /https?:\/\/drive\.google\.com\/uc\?[^,\s"]*?[?&]id=([A-Za-z0-9_-]+)/gi,
  (_m, id) => `/api/drive?id=${id}&sz=1200`
);

out = out.replace(
  /https?:\/\/drive\.google\.com\/thumbnail\?[^,\s"]*?[?&]id=([A-Za-z0-9_-]+)[^,\s"]*?[?&]sz=w(\d+)/gi,
  (_m, id, w) => `/api/drive?id=${id}&sz=${w}`
);

out = out.replace(
  /https?:\/\/lh3\.googleusercontent\.com\/d\/([A-Za-z0-9_-]+)[^,\s"]*/gi,
  (_m, id) => `/api/drive?id=${id}&sz=1200`
);

fs.writeFileSync(outFile, out, "utf8");
console.log("Wrote:", outFile);
