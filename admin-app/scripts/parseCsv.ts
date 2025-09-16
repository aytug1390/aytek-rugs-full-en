import { parse } from "csv-parse/sync";

/**
 * Accepts CSV as Buffer/string, returns array of objects.
 * Requires header row. Trims cells. Empty -> undefined.
 */
export function parseCsv(csvInput: Buffer | string) {
  const records = parse(csvInput, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records.map((row: Record<string, any>) => {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(row)) {
      if (v === "" || v == null) continue;
      clean[k] = typeof v === "string" ? v.trim() : v;
    }
    return clean;
  });
}
