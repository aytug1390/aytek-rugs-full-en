'use client';
import { useState } from 'react';
import { preferLocalDriveSrc } from '../../src/lib/drive';

export default function RugGallery({ images }) {
  const [idx, setIdx] = useState(0);
  const list = images || [];
  const current = list[idx];

  return (
    <div>
      <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden mb-3">
        {current?.url && (
          <img fetchPriority="high" loading="eager" decoding="async"
            src={preferLocalDriveSrc(current.url, 1600) || current.url}
            alt={current.alt || ''}
            className="w-full h-full object-contain"
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
            <img fetchPriority="low" loading="lazy" decoding="async"
              src={preferLocalDriveSrc(im.url, 400) || im.url}
              alt={im.alt || ''}
              className="w-full h-20 object-cover"
              referrerPolicy="no-referrer"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

