"use client";
import React, { useState } from 'react';
import DriveImg from './DriveImg.client';
import { getDriveImageSrc, resolveDriveUrlWithFallback } from '../../src/lib/drive';

function normalize(images) {
  if (!images) return [];
  return images.map((i) => {
    if (!i) return { url: '', alt: '' };
    if (typeof i === 'string') return { url: i, alt: '' };
    return { url: i.url ?? i, alt: i.alt ?? '', isPrimary: !!i.isPrimary };
  });
}

export default function Gallery({ images, initialIndex = 0, productTitle }: { images: any[]; initialIndex?: number; productTitle?: string }) {
  const imgs = normalize(images);
  const primaryIndex = imgs.findIndex((x) => x.isPrimary);
  const [index, setIndex] = useState(() => (primaryIndex >= 0 ? primaryIndex : Math.min(initialIndex, Math.max(0, imgs.length - 1))));

  if (!imgs || imgs.length === 0) {
    return <div className="h-96 bg-gray-100 rounded" />;
  }

  return (
    <div className="space-y-4">
      <DriveImg url={imgs[index]?.url} alt={imgs[index]?.alt || productTitle} />
      <div className="grid grid-cols-6 gap-2">
        {imgs.map((g, i) => {
          const { primary, fallback } = resolveDriveUrlWithFallback(g.url, 400);
          // initial thumbnail src: prefer thumbnail primary, fallback to uc, else placeholder
          const thumbSrc = primary ?? fallback ?? '/placeholder.jpg';
          return (
            <button key={i} type="button" onClick={() => setIndex(i)} className="focus:outline-none">
              <img
                src={thumbSrc}
                referrerPolicy="no-referrer"
                alt={g.alt || productTitle}
                onError={(e) => {
                  try {
                    const t = e.currentTarget as HTMLImageElement;
                    if (primary && fallback && t.src === primary) t.src = fallback;
                    else t.src = '/placeholder.jpg';
                  } catch (err) {}
                }}
                className={`h-20 w-full object-cover rounded cursor-pointer ${i === index ? 'ring-2 ring-indigo-500' : ''}`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
