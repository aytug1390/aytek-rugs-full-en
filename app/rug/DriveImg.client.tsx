"use client";
import React from "react";
import { resolveDriveUrlWithFallback } from '../../src/lib/drive';

export default function DriveImg({ url, alt, size = 1600 }: { url?: string; alt?: string; size?: number }) {
  const { primary, fallback } = resolveDriveUrlWithFallback(url, size);
  const src = primary ?? fallback ?? '';
  return src ? (
    <img
      src={src}
      alt={alt}
      className="w-full h-[540px] object-cover rounded-lg"
      referrerPolicy="no-referrer"
      onError={(e) => {
        try {
          const t = e.currentTarget as HTMLImageElement;
          if (primary && fallback && t.src === primary) t.src = fallback;
          else t.src = '/placeholder.jpg';
        } catch (err) {}
      }}
    />
  ) : (
    <div className="w-full h-[540px] bg-gray-100 rounded-lg" />
  );
}
