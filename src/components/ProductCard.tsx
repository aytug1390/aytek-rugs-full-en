"use client";
import { useList } from "@/context/ListContext";
import { getImgUrl } from "@/lib/imageUrl";
import { getDriveImageSrc } from '../lib/drive';
import Link from "next/link";

function fmtPrice(v: any) {
  const n = Number(v);
  if (!isFinite(n) || n <= 0) return "";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function ProductCard({ p }: { p: any }) {
  const { add, remove, has } = useList();
  const id = String(p._id ?? p.product_id ?? p.id ?? "");
  const name = process.env.NEXT_PUBLIC_COLLECTION_TITLE || 'Cappadocia Collection';
  const raw =
    p.images?.[0]?.url ||
    p.image?.url ||
    p.image_url ||
    p.imagePath ||
    p.image ||
    p.img ||
    "";

  let img = '';
  if (raw && typeof raw === 'string') {
    // prefer drive helper for google drive links or numeric raw values
    img = getDriveImageSrc(raw);
    if (img === '/placeholder.jpg') {
      // fallback to original helper if not drive-like
      img = (raw.startsWith('/uploads') ? `/media${raw}` : getImgUrl(raw));
    }
  }
  const inList = has(id);
  const isSold = (p.stock && String(p.stock).toLowerCase() !== "in") || p.sold === true;

  return (
    <article className="group rounded-2xl border overflow-hidden bg-white hover:shadow transition">
      <Link href={`/rug/${id}`} className="block">
        <div className="relative aspect-[4/3] bg-gray-50">
          <img
            src={img}
            alt={name}
            title={img}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e)=>{ e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.jpg"; }}
          />
          {isSold && (
            <span className="absolute left-3 top-3 z-10 rounded-full bg-red-600 text-white text-xs font-semibold px-2 py-0.5">
              Sold
            </span>
          )}
        </div>
      </Link>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/rug/${id}`} className="font-medium leading-snug line-clamp-1 hover:underline" title={name}>
            {name}
          </Link>
          {fmtPrice(p.price) && <div className="text-sm font-semibold whitespace-nowrap">{fmtPrice(p.price)}</div>}
        </div>

        <div className="mt-1 text-xs text-gray-600 flex items-center gap-2">
          <span className="line-clamp-1">{p.size_text || "\u2014"}</span>
          <span aria-hidden>•</span>
          <span className={isSold ? "text-gray-500" : "text-green-600"}>
            {isSold ? "—" : "in stock"}
          </span>
        </div>

        <div className="mt-2">
          <button
            onClick={() => (inList ? remove(id) : add({ id, name, image: img, price: p.price }))}
            className={`text-xs px-2.5 py-1.5 rounded-md border ${inList ? "bg-black text-white" : "hover:bg-gray-100"}`}>
            {inList ? "Added" : "+ Add to List"}
          </button>
        </div>

        {/* compact color swatches for listing */}
        {((p.color_hex && p.color_hex.length) || (p.color_code && p.color_code.length)) ? (
          <div className="mt-3 flex items-center gap-2">
            {(p.color_hex || []).slice(0,4).map((h: string, i: number) => (
              <span key={`${h}-${i}`} title={h} className="w-4 h-4 rounded-full border" style={{ backgroundColor: h || 'transparent' }} />
            ))}
            {p.color_code && p.color_code.length ? (
              <span className="text-xs text-gray-500">{p.color_code.slice(0,3).join(', ')}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}


