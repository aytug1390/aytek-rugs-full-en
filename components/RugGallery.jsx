"use client";
import { useState } from 'react';
import Image from 'next/image';

function resolveDriveUrl(url, size = 1600) {
  if (!url) return '';
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)\//) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w${size}`;
  return url;
}

import getImgUrl from '../src/lib/imageUrl';

export default function RugGallery({ images }) {
  const [idx, setIdx] = useState(0);
  const list = images || [];
  const current = list[idx];

  return (
    <div>
      <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden mb-3">
        {current?.url && (
          <Image
            src={getImgUrl(resolveDriveUrl(current.url))}
            alt={current.alt || ''}
            fill
            className="object-contain"
            referrerPolicy="no-referrer"
          />
        )}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {list.map((im, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`border rounded-lg overflow-hidden ${i===idx ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="relative h-20">
              <Image
                src={getImgUrl(resolveDriveUrl(im.url, 400))}
                alt={im.alt || ''}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
