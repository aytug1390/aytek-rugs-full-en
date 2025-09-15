"use client";
import React from 'react';
import Link from 'next/link';
import { getDriveImageSrc, makeSrcSet } from '@/utils/drive';

export default function ProductCard({ product }) {
  const primary = (product.images ?? []).find((i) => i.isPrimary) ?? (product.images ?? [])[0];
  const idRaw = String(product.product_id ?? '');
  const idShow = idRaw.replace(/\.0$/, '');
  const price = product.sale_price ?? product.price;
  const cover = primary?.url || primary?.id || product?.image_url;
  const src = getDriveImageSrc(cover, 800) || '/images/placeholder-rug.jpg';
  const srcSet = makeSrcSet(cover);

  return (
    <Link
      href={`/rug/${encodeURIComponent(idRaw)}`}
      className="block border rounded-xl p-3 shadow-sm hover:shadow-md transition cursor-pointer group"
    >
      <div className="w-full h-48 overflow-hidden rounded-lg">
        <img
          src={src}
          srcSet={srcSet}
          sizes="(max-width: 768px) 100vw, 33vw"
          alt={primary?.alt || product.title || idShow}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e)=>{ e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder.png'; }}
        />
      </div>
      <div className="mt-2 font-medium line-clamp-2 group-hover:underline">
        {product.title || idShow}
      </div>
      <div className="text-sm text-gray-600">{price ? `$${Number(price).toFixed(2)}` : '—'}</div>
      <div className="text-xs text-green-700">{product.availability || 'in stock'}</div>
    </Link>
  );
}
