import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

const DATA_PATH = path.join(process.cwd(), 'admin-app', 'data', 'products.json');

function readStore() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function writeStore(items) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(items, null, 2), 'utf8');
}

export async function GET(req) {
  const items = readStore();
  return NextResponse.json(items);
}

export async function POST(req) {
  // handle CSV import via multipart/form-data
  const contentType = req.headers.get('content-type') || '';
  if (contentType.startsWith('multipart/form-data')) {
    const formData = await req.formData();
    const file = formData.get('file');
    const text = await file.text();
    // simple CSV parse: header columns and rows
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 1) return NextResponse.json({ message: 'Empty CSV' }, { status: 400 });
    const headers = lines[0].split(',').map(h => h.trim());
    const records = lines.slice(1).map(line => {
      const cols = line.split(',');
      const obj = {};
      headers.forEach((h, i) => obj[h] = (cols[i] || '').trim());
      return obj;
    }).filter(r => Object.values(r).some(v => v));

    const store = readStore();
    const start = store.length;
    for (const r of records) {
      store.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2,6), ...r });
    }
    writeStore(store);
    return NextResponse.json({ imported: records.length, total: store.length });
  }

  // default: create product JSON
  const body = await req.json();
  const store = readStore();
  const item = { id: Date.now().toString(36), ...body };
  store.push(item);
  writeStore(store);
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(req) {
  const body = await req.json();
  const store = readStore();
  const idx = store.findIndex(i => i.id === body.id);
  if (idx === -1) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  store[idx] = { ...store[idx], ...body };
  writeStore(store);
  return NextResponse.json(store[idx]);
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ message: 'Missing id' }, { status: 400 });
  const store = readStore();
  const filtered = store.filter(i => i.id !== id);
  writeStore(filtered);
  return NextResponse.json({ deleted: id });
}
