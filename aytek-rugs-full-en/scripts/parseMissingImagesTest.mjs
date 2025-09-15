import fs from "node:fs/promises";
import { parse } from "csv-parse/sync";

const raw = await fs.readFile("./missing_images.csv", "utf8");
console.log("RAW_LEN:", raw.length);
console.log("RAW_TAIL_HEX:", Buffer.from(raw.slice(-10)).toString("hex"));
const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: false });
console.log("ROWS:", rows.length);
for (const r of rows) {
  for (const k of Object.keys(r)) {
    if (typeof r[k] === "string") r[k] = r[k].replace(/\r+$/,"").trim();
  }
}
console.dir(rows, { depth: 3 });
