"use client";
import { useList } from "@/context/ListContext";
import { getImgUrl } from "@/lib/imageUrl";
import { preferLocalDriveSrc } from '../lib/drive';
import ImageSafe from '../../app/components/ImageSafe';
import Link from "next/link";
import MagnifyImage from '../../app/components/MagnifyImage';

function fmtPrice(v: any) {
  const n = Number(v);
  if (!isFinite(n) || n <= 0) return "";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function ProductCard({ p }: { p: any }) {
  const { add, remove, has } = useList();
  // Prefer `product_id` (SKU) for public links so the single-item endpoint
  // receives the expected identifier. Fall back to Mongo `_id` only when
  // `product_id` is missing.
  const id = String(p.product_id ?? p._id ?? p.id ?? "");
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
    // prefer local cached image (manifest) or fallback to proxy
    img = preferLocalDriveSrc(raw);
    if (img === '/placeholder.jpg') {
      // fallback to original helper if not drive-like
      img = (raw.startsWith('/uploads') ? `/media${raw}` : getImgUrl(raw));
    }
  }
  const inList = has(id);
  const isSold = (p.stock && String(p.stock).toLowerCase() !== "in") || p.sold === true;

  return (
  <article className="relative group rounded-2xl border overflow-hidden bg-white hover:shadow transition">
      <Link href={`/rug/${id}`} className="block">
        <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
          <MagnifyImage
            src={img}
            alt={name}
            zoom={2.2}
            lensSize={150}
            className="w-full h-full object-cover"
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
            <button type="button"
              onClick={() => {
                if (inList) return remove(id);
                // try common sku fields
                const sku = p.sku || p.SKU || p.product_id || p._id || '';
                add({ id, name, image: img, price: p.price, sku });
              }}
              className={`text-xs px-2.5 py-1.5 rounded-md border ${inList ? "bg-black text-white" : "hover:bg-gray-100"}`}>
              {inList ? "Added" : "+ Add to List"}
            </button>
        </div>

        {/* compact color swatches for listing */}
        {((p.color_hex && p.color_hex.length) || (p.color_code && p.color_code.length)) ? (
          <div className="mt-3 flex items-center gap-2">
            {(p.color_hex || []).slice(0,4).map((h: string, i: number) => {
              const hex = String(h || '').trim();
              const name = (Array.isArray(p.color_names) ? p.color_names[i] : (Array.isArray(p.color) ? p.color[i] : undefined)) || '';
              const toTitleCase = (s: string) => String(s || '').toLowerCase().split(/\s+/).map(w => w ? w.charAt(0).toUpperCase()+w.slice(1) : '').join(' ');
              const title = name ? `${toTitleCase(name)} (${hex})` : hex;
              return <span key={`${hex}-${i}`} title={title} className="w-4 h-4 rounded-full border swatch" data-swatch={hex || 'transparent'} />;
            })}
            {p.color_code && p.color_code.length ? (
              <span className="text-xs text-gray-500">{p.color_code.slice(0,3).join(', ')}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}


