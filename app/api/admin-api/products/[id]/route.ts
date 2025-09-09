import { NextResponse } from "next/server";

type Params = { id: string };

const ORIGIN = process.env.ADMIN_API_ORIGIN || "http://127.0.0.1:5000";
const KEEP = (process.env.ADMIN_API_KEEP_PREFIX || "true").toLowerCase() === "true";
const UPSTREAM = KEEP ? `${ORIGIN}/admin-api` : ORIGIN;

function normalizeProduct(raw: any) {
  if (!raw || typeof raw !== "object") return null;
  const images = Array.isArray(raw.images) ? raw.images : [];
  return {
    _id: String(raw._id ?? raw.id ?? ""),
    product_id: String(raw.product_id ?? raw.id ?? ""),
    title: String(raw.title ?? raw.name ?? ""),
    availability: String(raw.availability ?? raw.status ?? ""),
    price: raw.price ?? null,
    sale_price: raw.sale_price ?? null,
    description_html: String(raw.description_html ?? raw.description ?? ""),
    images: images.map((img: any, i: number) => ({
      url: String(img.url ?? img.src ?? ""),
      alt: String(img.alt ?? `Image ${i + 1}`),
      isPrimary: Boolean(img.isPrimary ?? i === 0),
    })),
    updatedAt: raw.updatedAt ?? null,
  };
}

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { id } = await ctx.params; // Next 15: params Promise!

  const r = await fetch(`${UPSTREAM}/products/${encodeURIComponent(id)}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!r.ok) {
    return NextResponse.json({ ok: false, error: `upstream ${r.status}` }, { status: 502 });
  }

  const payload = await r.json();
  const raw = payload?.item ?? payload?.product ?? payload?.data ?? payload;
  const product = normalizeProduct(raw);
  if (!product) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  return NextResponse.json({ ok: true, id, product }, { status: 200 });
}

export async function HEAD(_req: Request, ctx: { params: Promise<Params> }) {
  const { id } = await ctx.params;
  return new Response(null, { status: 200, headers: { "x-item-id": id } });
}
