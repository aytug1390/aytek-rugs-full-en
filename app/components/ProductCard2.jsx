"use client";
import Link from 'next/link';
import { resolveDriveUrlWithFallback, resolveDriveUrlAlwaysUC, getDriveImageSrc } from '../../src/lib/drive';

function DriveImg({ url, alt, size = 1200 }) {
  // prefer thumbnail, fallback to uc, or placeholder if raw url is a numeric id like '16189.0'
  const src = getDriveImageSrc(url, size);
  return src ? (
    <img
      src={src}
      alt={alt}
      className="w-full h-48 object-cover rounded-lg"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={(e) => {
        try {
          if (primary && fallback && (e.currentTarget.src === primary)) {
            e.currentTarget.src = fallback;
          } else {
            e.currentTarget.src = '/placeholder.jpg';
          }
        } catch (err) {
          // swallow
        }
      }}
    />
  ) : (
    <div className="w-full h-48 bg-gray-100 rounded-lg" />
  );
}

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
      <DriveImg url={primary?.url} alt={primary?.alt || product.title || idShow} />
      {/* compact color swatches for listing */}
      {((product.color_hex && product.color_hex.length) || (product.color_code && product.color_code.length)) ? (
        <div className="mt-2 flex items-center gap-2">
          {(product.color_hex || []).slice(0,4).map((h, i) => (
            <span key={`${h}-${i}`} title={h} className="w-4 h-4 rounded-full border" style={{ backgroundColor: h || 'transparent' }} />
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

