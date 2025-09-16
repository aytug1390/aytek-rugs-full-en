#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('Missing MONGO_URI in environment. Set MONGO_URI and re-run.');
  process.exit(1);
}

// Allow an optional CSV path as the first CLI argument (useful for dry-run/testing).
const possibleCliCsv = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const csvPath = possibleCliCsv ? path.resolve(possibleCliCsv) : path.resolve('tmp', 'upload_for_migration.csv');
if (!fs.existsSync(csvPath)) {
  console.error(`CSV file not found: ${csvPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(csvPath, 'utf8');

// Deterministic parsing: detect header explicitly.
const allLines = raw.split(/\r?\n/);
let headerFields = null;
let headerIdx = -1;

// 1) Prefer a real (non-comment) header line containing 'product_id'
headerIdx = allLines.findIndex(l => l && l.trim() !== '' && !l.trim().startsWith('#') && /\bproduct_id\b/i.test(l));
if (headerIdx >= 0) {
  const headerLine = allLines[headerIdx].replace(/^#\s*/, '').trim();
  headerFields = headerLine.split(/[\t,]+/).map(s => s.trim()).filter(Boolean);
} else {
  // 2) Fallback: find a commented example header
  headerIdx = allLines.findIndex(l => l && l.trim().startsWith('#') && /\bproduct_id\b/i.test(l));
  if (headerIdx >= 0) {
    const headerLine = allLines[headerIdx].replace(/^#\s*/, '').trim();
    headerFields = headerLine.split(/[\t,]+/).map(s => s.trim()).filter(Boolean);
  }
}

let records = null;
let chosenDelimiter = null;

if (headerFields && headerFields.length > 0) {
  // Collect data lines after the header index (strip comments and empties)
  const dataLines = allLines.slice(headerIdx + 1).filter(l => l && l.trim() !== '' && !l.trim().startsWith('#'));
  if (dataLines.length === 0) {
    // Maybe the entire file used commented header and data follows immediately; try all non-comment lines
    const allData = allLines.filter(l => l && l.trim() !== '' && !l.trim().startsWith('#'));
    dataLines.push(...allData);
  }

  if (dataLines.length > 0) {
    const sample = dataLines[0];
    const delim = sample.includes('\t') ? '\t' : ',';
    const csvText = headerFields.join(delim) + '\n' + dataLines.join('\n');
    try {
      records = parse(csvText, { columns: headerFields, skip_empty_lines: true, delimiter: delim });
      chosenDelimiter = delim;
    } catch (e) {
      // try parse with csv-parse letting it detect columns (robust fallback)
      try {
        records = parse(csvText, { columns: true, skip_empty_lines: true, delimiter: delim });
        chosenDelimiter = delim;
      } catch (e2) {
        // manual fallback below
      }
    }

    // Manual fallback: split fields and map to headerFields
    if ((!records || records.length === 0) && headerFields.length > 0) {
      try {
        const objs = dataLines.map((ln) => {
          const parts = ln.split(delim);
          if (parts.length > headerFields.length) {
            const head = parts.slice(0, headerFields.length - 1);
            const last = parts.slice(headerFields.length - 1).join(delim);
            parts.length = 0;
            parts.push(...head, last);
          }
          const obj = {};
          for (let i = 0; i < headerFields.length; i++) obj[headerFields[i]] = (parts[i] || '').trim();
          return obj;
        }).filter(Boolean);
        if (objs.length > 0) {
          records = objs;
          chosenDelimiter = delim;
          console.log('Manual parse succeeded, records ->', records.length);
        }
      } catch (e) {
        // ignore
      }
    }
  }
}

// If still not parsed, fall back to previous tolerant approach (try both delimiters)
if (!records || records.length === 0) {
  try {
    records = parse(raw, { columns: true, skip_empty_lines: true });
    chosenDelimiter = '\\t or , (auto)';
  } catch (e) {
    // last resort: find first non-empty non-comment line and show for debugging
    const firstNonEmpty = raw.split(/\r?\n/).find(l => l && l.trim() !== '');
    console.log('Could not parse CSV into records. First non-empty raw line ->', firstNonEmpty && firstNonEmpty.slice(0, 400));
  }
}

console.log('CSV parse: chosen delimiter ->', JSON.stringify(chosenDelimiter));
console.log('Parsed records count ->', Array.isArray(records) ? records.length : 0);
if (Array.isArray(records) && records.length > 0) {
  console.log('Header keys ->', Object.keys(records[0]).slice(0, 20));
  console.log('Sample record ->', Object.fromEntries(Object.entries(records[0]).slice(0, 10)));
}

// If parser yielded a single combined header key (e.g. 'product_id,image_url,...')
// this often means the real header was provided as a commented example. Attempt
// to locate a commented header and re-parse using it as explicit columns.
if (Array.isArray(records) && records.length > 0 && Object.keys(records[0]).length === 1) {
  const key = Object.keys(records[0])[0] || '';
  if (/product_id[,\t]/i.test(key) || key.includes(',')) {
    const allLines = raw.split(/\r?\n/);
    const commentedIdx = allLines.findIndex(l => /^#\s*product_id[,\t]/i.test(l));
    if (commentedIdx >= 0) {
      const commentedHeader = allLines[commentedIdx].replace(/^#\s*/, '').trim();
      const headerFields = commentedHeader.split(/[,\t]+/).map(s => s.trim()).filter(Boolean);
      // Collect all non-empty, non-comment lines as data rows (supports files
      // where the pasted CSV omitted the header but included a commented
      // example header at the top).
      const dataLines = allLines.filter(l => l && l.trim() !== '' && !l.trim().startsWith('#'));
      if (dataLines.length > 0) {
        const sample = dataLines[0] || '';
        const delim = sample.includes('\t') ? '\t' : ',';
        const csvText = headerFields.join(delim) + '\n' + dataLines.join('\n');
        try {
          const reparsed = parse(csvText, { columns: headerFields, skip_empty_lines: true, delimiter: delim });
          records = reparsed;
          chosenDelimiter = delim;
          console.log('Re-parsed using commented header ->', headerFields.join(','));
          console.log('Re-parsed records ->', records.length);
        } catch (e) {
          console.warn('Re-parse with commented header failed:', e && e.message);
          // Manual fallback: split lines by delimiter and map fields to headerFields.
          try {
            const objs = dataLines.map((ln) => {
              const parts = ln.split(delim);
              // If there are more parts than headers, join extras into last field
              if (parts.length > headerFields.length) {
                const head = parts.slice(0, headerFields.length - 1);
                const last = parts.slice(headerFields.length - 1).join(delim);
                parts.length = 0;
                parts.push(...head, last);
              }
              const obj = {};
              for (let i = 0; i < headerFields.length; i++) {
                obj[headerFields[i]] = (parts[i] || '').trim();
              }
              return obj;
            }).filter(Boolean);
            if (objs.length > 0) {
              records = objs;
              chosenDelimiter = delim;
              console.log('Manual parse succeeded, records ->', records.length);
            }
          } catch (e2) {
            console.warn('Manual parse fallback failed:', e2 && e2.message);
          }
        }
      }
    }
  }
}

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  const products = db.collection('products');
  const backups = db.collection('products_migration_backups');

  const plan = [];

  for (const row of records) {
    // Expect at least product_id column
  const product_id = (row.product_id || '').toString().trim();
  // Skip accidental header rows where the CSV header got parsed as a record
  if (!product_id) continue;
  if (product_id.toLowerCase() === 'product_id') continue;

    const doc = await products.findOne({ product_id });
    if (!doc) {
      plan.push({ product_id, status: 'missing_in_db' });
      continue;
    }

    const update = {};
    // map fields if present in CSV
    if (row.main_image && row.main_image.trim()) update.image_url = row.main_image.trim();
    if (row.images && row.images.trim()) {
      // split by comma and trim
      const imgs = row.images.split(',').map(s => s.trim()).filter(Boolean);
      // normalize to objects
      update.images = imgs.map((u, i) => ({ url: u, alt: row.title || doc.title || '', isPrimary: i === 0 }));
    }
    if (row.description_html && row.description_html.trim()) update.description_html = row.description_html;
    if (row.origin && row.origin.trim()) update.origin = row.origin.trim();
    if (row.size_text && row.size_text.trim()) update.size_text = row.size_text.trim();
    if (row.title && row.title.trim()) update.title = row.title.trim();

    if (Object.keys(update).length === 0) {
      plan.push({ product_id, status: 'no_changes', docId: doc._id });
      continue;
    }

    // Determine which fields would change
    const diffs = {};
    for (const k of Object.keys(update)) {
      const oldVal = doc[k];
      const newVal = update[k];
      // simple JSON compare
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) diffs[k] = { from: oldVal === undefined ? null : oldVal, to: newVal };
    }

    if (Object.keys(diffs).length === 0) {
      plan.push({ product_id, status: 'identical', docId: doc._id });
      continue;
    }

    plan.push({ product_id, status: 'will_update', docId: doc._id, diffs, update });

    if (APPLY) {
      // backup original
      await backups.insertOne({ product_id, docId: doc._id, before: doc, appliedAt: new Date(), script: path.basename(process.argv[1]) });
      // apply update
      await products.updateOne({ _id: doc._id }, { $set: update });
      plan[plan.length - 1].applied = true;
    }
  }

  // print a concise report
  console.log(JSON.stringify({ apply: APPLY, summary: plan.map(p => ({ product_id: p.product_id, status: p.status })) }, null, 2));

  // print detailed plan for 'will_update' entries
  for (const p of plan.filter(x => x.status === 'will_update')) {
    console.log('---');
    console.log(`product_id: ${p.product_id}`);
    console.log('diffs:');
    console.log(JSON.stringify(p.diffs, null, 2));
    if (p.applied) console.log('APPLIED');
  }

  await client.close();
}

main().catch(err => { console.error(err); process.exit(2); });
