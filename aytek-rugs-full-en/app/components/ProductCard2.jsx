"use client";
import Link from 'next/link';
import MagnifyImage from './MagnifyImage';
import { preferLocalDriveSrc } from '../../src/lib/drive';

export default function ProductCard({ product }) {
  const primary = (product.images ?? []).find(i => i.isPrimary) ?? (product.images ?? [])[0];
  const idRaw   = String(product.product_id ?? '');
  const idShow  = idRaw.replace(/\.0$/, '');
  const priceRaw = product.sale_price ?? product.price;
  const priceNum = Number(priceRaw);
  const price    = Number.isFinite(priceNum) && priceNum > 0 ? `$${priceNum.toFixed(2)}` : null;

  return (
    <Link
      href={`/rug/${encodeURIComponent(idRaw)}`}
      className="block border rounded-xl p-3 shadow-sm hover:shadow-md transition cursor-pointer group"
    >
      <div className="aspect-[4/5] overflow-hidden rounded-lg">
          <MagnifyImage
            src={preferLocalDriveSrc(primary?.url, 1200) || primary?.url}
            alt={primary?.alt || product.title || idShow}
            zoom={2.2}
            lensSize={150}
            className="w-full h-full object-cover"
          />
      </div>
      {/* compact color swatches for listing */}
      {((product.color_hex && product.color_hex.length) || (product.color_code && product.color_code.length)) ? (
        <div className="mt-2 flex items-center gap-2">
          {(product.color_hex || []).slice(0,4).map((h, i) => (
            <span key={`${h}-${i}`} title={h} className="w-4 h-4 rounded-full border swatch" data-swatch={h || 'transparent'} />
          ))}
          {product.color_code && product.color_code.length ? (
            <span className="text-xs text-gray-500">{product.color_code.slice(0,3).join(', ')}</span>
          ) : null}
        </div>
      ) : null}
      <div className="mt-2 font-medium line-clamp-2 group-hover:underline">
        {process.env.NEXT_PUBLIC_COLLECTION_TITLE || 'Cappadocia Collection'}
      </div>
      <div className="text-sm text-gray-600">{price ?? '—'}</div>
      <div className="text-xs text-green-700">{product.availability || 'in stock'}</div>
    </Link>
  );
}

