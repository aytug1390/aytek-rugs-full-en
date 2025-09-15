"use client";
import { useState } from 'react';
import { preferLocalDriveSrc, getDriveImageSrc } from '../src/lib/drive';
import MagnifyImage from '../app/components/MagnifyImage';

export default function RugGallery({ images }) {
  const [idx, setIdx] = useState(0);
  const list = images || [];
  const current = list[idx];

  return (
    <div>
      <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden mb-3">
        {current?.url && (
          <MagnifyImage
            src={preferLocalDriveSrc(current.url) || resolveDriveUrlAlwaysUC(current.url)}
            alt={current.alt || ''}
            zoom={2.4}
            lensSize={170}
            className="w-full h-full object-contain"
            rounded="rounded-xl"
          />
        )}
      </div>
      <div className="grid grid-cols-5 gap-2">
    {list.map((im, i) => (
          <button
            type="button"
            key={i}
            onClick={() => setIdx(i)}
            className={`border rounded-lg overflow-hidden ${i===idx ? 'ring-2 ring-blue-500' : ''}`}
          >
            <img
              src={preferLocalDriveSrc(im.url, 400) || getDriveImageSrc(im.url, 400)}
              alt={im.alt || ''}
              className="w-full h-20 object-cover"
              referrerPolicy="no-referrer"
              loading="lazy"
              fetchPriority="low"
              decoding="async"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
