"use client";
import Link from 'next/link';
import { preferLocalDriveSrc } from '../../src/lib/drive';

function resolveDriveUrl(url, size = 1200) {
  if (!url) return '';
  return preferLocalDriveSrc(url, size) || url;
}

export default function ProductCard({ product }) {
  const primary = (product.images ?? []).find(i => i.isPrimary) ?? (product.images ?? [])[0];
  const idRaw   = String(product.product_id ?? '');
  const idShow  = idRaw.replace(/\.0$/, '');
  const price   = product.sale_price ?? product.price;
  const src     = resolveDriveUrl(primary?.url);

  return (
    <Link
      href={`/rug/${encodeURIComponent(idRaw)}`}
      className="block border rounded-xl p-3 shadow-sm hover:shadow-md transition cursor-pointer group"
    >
      {src ? (
        <img
          src={src}
          alt={primary?.alt || product.title || idShow}
          className="w-full h-48 object-cover rounded-lg"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
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

