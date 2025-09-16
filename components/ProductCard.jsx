"use client";
import Link from 'next/link';

function resolveDriveUrl(url, size = 1200) {
  if (!url) return '';
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)\//) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w${size}`;
  return url;
}

import getImgUrl from '../src/lib/imageUrl';
import Image from 'next/image';

export default function ProductCard({ product }) {
  const primary = (product.images ?? []).find(i => i.isPrimary) ?? (product.images ?? [])[0];
  const idRaw   = String(product.product_id ?? '');
  const idShow  = idRaw.replace(/\.0$/, '');
  const price   = product.sale_price ?? product.price;
  const src     = getImgUrl(resolveDriveUrl(primary?.url));

  return (
    <Link
      href={`/rug/${encodeURIComponent(idRaw)}`}
      className="block border rounded-xl p-3 shadow-sm hover:shadow-md transition cursor-pointer group"
    >
      {src ? (
        <div className="relative w-full h-48 rounded-lg overflow-hidden">
          <Image src={src} alt={primary?.alt || product.title || idShow} fill className="object-cover" referrerPolicy="no-referrer" />
        </div>
      ) : (
        <div className="w-full h-48 bg-gray-100 rounded-lg" />
      )}
      <div className="mt-2 font-medium line-clamp-2 group-hover:underline">
        {product.title || idShow}
      </div>
      <div className="text-sm text-gray-600">{price ? `$${Number(price).toFixed(2)}` : '—'}</div>
      <div className="text-xs text-green-700">{product.availability || 'in stock'}</div>
    </Link>
  );
}
