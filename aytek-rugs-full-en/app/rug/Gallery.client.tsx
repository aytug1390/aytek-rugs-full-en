"use client";
import React, { useState } from 'react';
import DriveImg from './DriveImg.client';

type Img = { url?: string; src?: string; alt?: string };

export default function Gallery({ images = [], productTitle = '' }: { images?: Img[]; productTitle?: string }) {
  const [index, setIndex] = useState<number>(0);
  const current: Img | null = images && images.length ? images[index] : null;

  return (
    <div>
      <div className="mb-3">
        {current ? (
          <DriveImg src={current.url || current.src} alt={current.alt || productTitle} className="w-full h-auto rounded" />
        ) : (
          <div className="h-96 bg-gray-100 rounded" />
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {(images || []).map((img, i) => (
          <button key={i} onClick={() => setIndex(i)} className="flex-shrink-0">
            <img src={img.url || img.src} alt={img.alt || productTitle} className="w-24 h-16 object-cover rounded" />
          </button>
        ))}
      </div>
    </div>
  );
}
