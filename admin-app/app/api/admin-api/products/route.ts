import { NextRequest, NextResponse } from "next/server";
import { readAll, writeAll, Product } from "@/lib/store";
import { ProductArraySchema, ProductSchema } from "@/lib/validation";
import { parseCsv } from "@/scripts/parseCsv";

function json(data: unknown, init: number | ResponseInit = 200) {
  const status = typeof init === "number" ? init : init.status ?? 200;
  const headers = new Headers(
    typeof init === "number" ? undefined : init.headers
  );
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Cache-Control", "no-store");
  return new NextResponse(JSON.stringify(data), { status, headers });
}

// GET /api/admin-api/products
export async function GET() {
  const items = await readAll();
  return json({ total: items.length, items });
}

// POST /api/admin-api/products
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = ProductSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  const items = await readAll();
  const idx = items.findIndex((p) => p.product_id === parsed.data.product_id);
  if (idx >= 0) items[idx] = { ...items[idx], ...parsed.data };
  else items.push(parsed.data as Product);
  await writeAll(items);

  return json({ ok: true });
}

// DELETE /api/admin-api/products?product_id=123
export async function DELETE(req: NextRequest) {
  const pid = new URL(req.url).searchParams.get("product_id");
  if (!pid) return json({ error: "product_id required" }, 400);

  const items = await readAll();
  const next = items.filter((p) => p.product_id !== pid);
  if (next.length === items.length) return json({ error: "not_found" }, 404);

  await writeAll(next);
  return json({ ok: true });
}

// POST /api/admin-api/products/import (multipart/form-data)
export async function PUT(req: NextRequest) {
  return json({ error: "Use POST /import for CSV" }, 405);
}

export async function PATCH(req: NextRequest) {
  return json({ error: "Use POST /import for CSV" }, 405);
}

// Separate handler for CSV import
export const runtime = "nodejs"; // ensure Node runtime for FormData file streaming

export async function POST(req: NextRequest, ctx: any) {
  const url = new URL(req.url);
  if (!url.pathname.endsWith("/products")) {
    return json({ error: "Not Found" }, 404);
  }

  // When called as /products/import, do CSV import:
  if (url.pathname.endsWith("/products/import")) {
    const form = await req.formData().catch(() => null);
    if (!form) return json({ error: "multipart/form-data required" }, 400);

    const file = form.get("file");
    if (!file || typeof file === "string") {
      return json({ error: "file field (CSV) is required" }, 400);
    }
    const selectedRaw = form.get("selected");
    let selected: string[] | null = null;
    if (typeof selectedRaw === "string" && selectedRaw.trim()) {
      try {
        selected = JSON.parse(selectedRaw);
      } catch {
        return json({ error: "selected must be JSON array of product_id" }, 400);
      }
    }

    const buf = Buffer.from(await (file as File).arrayBuffer());
    const rows = parseCsv(buf); // objects keyed by header names

    // Normalize keys to expected shape
    const mapped = rows.map((r) => {
      const obj: Record<string, any> = { ...r };
      if (obj.color_code && !obj.color) obj.color = obj.color_code;
      if (obj.size) obj.size_text = obj.size;
      return obj;
    });

    // Filter by selection if provided
    const toValidate = selected
      ? mapped.filter((r) => selected.includes(String(r.product_id)))
      : mapped;

    const parsed = ProductArraySchema.safeParse(toValidate);
    if (!parsed.success) {
      return json({ error: parsed.error.flatten(), count: toValidate.length }, 400);
    }

    // Merge with existing (upsert by product_id)
    const existing = await readAll();
    const byId = new Map<string, Product>(existing.map((p) => [p.product_id, p]));
    for (const p of parsed.data) {
      const prior = byId.get(p.product_id) || ({} as Product);
      byId.set(p.product_id, { ...prior, ...p });
    }
    const next = [...byId.values()];
    await writeAll(next);

    return json({
      ok: true,
      imported: parsed.data.length,
      total: next.length,
    });
  }

  // Fallback to single-item POST handled above
  return json({ error: "Invalid route. Try /products or /products/import" }, 404);
}
