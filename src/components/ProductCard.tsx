"use client";
import Image from "next/image";
import { useState } from "react";
import { useList } from "@/context/ListContext";
import { getImgUrl } from "@/lib/imageUrl";
import Link from "next/link";

function fmtPrice(v: any) {
  const n = Number(v);
  if (!isFinite(n) || n <= 0) return "";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function ProductCard({ p }: { p: any }) {
  const { add, remove, has } = useList();
  const id = String(p._id ?? p.product_id ?? p.id ?? "");
  const name = p.name || p.title || id;
  const raw =
    p.images?.[0]?.url ||
    p.image?.url ||
    p.image_url ||
    p.imagePath ||
    p.image ||
    p.img ||
    "";

  const imgSrc = raw && typeof raw === "string" && raw.startsWith("/uploads")
    ? `/media${raw}`
    : getImgUrl(raw);
  const inList = has(id);
  const isSold = (p.stock && String(p.stock).toLowerCase() !== "in") || p.sold === true;
  const [errored, setErrored] = useState(false);

  return (
    <article className="group rounded-2xl border overflow-hidden bg-white hover:shadow transition">
      <Link href={`/rug/${id}`} className="block">
        <div className="relative aspect-[4/3] bg-gray-50">
          {!errored && imgSrc ? (
            <Image
              src={imgSrc}
              alt={name}
              title={imgSrc}
              fill
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover w-full h-full"
              onError={() => setErrored(true)}
              unoptimized
            />
          ) : (
            <div className="w-full h-full grid place-items-center bg-neutral-100 text-neutral-500">
              <span className="text-sm">No image</span>
            </div>
          )}
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
            onClick={() => (inList ? remove(id) : add({ id, name, image: imgSrc, price: p.price }))}
            className={`text-xs px-2.5 py-1.5 rounded-md border ${inList ? "bg-black text-white" : "hover:bg-gray-100"}`}>
            {inList ? "Added" : "+ Add to List"}
          </button>
        </div>
      </div>
    </article>
  );
}


