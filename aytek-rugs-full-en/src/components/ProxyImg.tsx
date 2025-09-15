"use client";
import React from 'react';
import { getDriveImageSrc } from '@/lib/drive';

type Props = {
  src?: string | null;
  sz?: number;
  alt?: string;
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>;

export default function ProxyImg({ src, sz = 800, alt = 'Image', ...rest }: Props) {
  const proxied = src ? (getDriveImageSrc(src, sz) || `/api/drive?src=${encodeURIComponent(String(src))}&sz=${sz}`) : '/placeholder.png';
  return (
    <img
      src={proxied}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.png'; }}
      {...rest}
    />
  );
}
