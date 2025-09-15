'use client';
import { useState } from 'react';
import { getDriveImageSrc, makeSrcSet } from '@/utils/drive';

export default function RugGallery({ images }) {
  const [idx, setIdx] = useState(0);
  const list = images || [];
  const current = list[idx];

  return (
    <div>
      <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden mb-3">
        {current && (
          <img
            src={getDriveImageSrc(current.url || current.id || current, 1200) || '/images/placeholder-rug.jpg'}
            srcSet={makeSrcSet(current.url || current.id || current)}
            sizes="100vw"
            alt={current.alt || ''}
            className="w-full h-full object-contain"
            loading="lazy"
            decoding="async"
            onError={(e)=>{ e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder.png'; }}
          />
        )}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {list.map((im, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`border rounded-lg overflow-hidden ${i === idx ? 'ring-2 ring-blue-500' : ''}`}
          >
            <img
              src={getDriveImageSrc(im.url || im.id || im, 400) || '/images/placeholder-rug.jpg'}
              srcSet={makeSrcSet(im.url || im.id || im)}
              sizes="80px"
              alt={im.alt || ''}
              className="w-full h-20 object-cover"
              loading="lazy"
              decoding="async"
              onError={(e)=>{ e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder.png'; }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
