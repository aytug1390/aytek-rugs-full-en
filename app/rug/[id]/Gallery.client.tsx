"use client";
import { useMemo } from "react";
import Image from 'next/image';

const proxify = (url: string) =>
  url?.startsWith("http") ? `/api/drive?url=${encodeURIComponent(url)}` : url;

export default function Gallery({ urls }: { urls: string[] }) {
  const list = useMemo(() => (urls || []).filter(Boolean), [urls]);
  if (!list.length) return null;

  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {list.map((u, i) => (
          <a key={i} href={proxify(u)} target="_blank" rel="noopener noreferrer"
             className="block rounded-lg overflow-hidden border hover:opacity-90">
            <div className="relative h-40">
              <Image src={proxify(u)} alt={`Photo ${i+1}`} fill className="object-cover" />
            </div>
          </a>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">Daha yakından bakmak için görsele tıklayın.</p>
    </div>
  );
}
