"use client";
import React from 'react';

// Minimal ProxyImg for admin app (keeps admin self-contained)
export default function ProxyImg({ src, sz = 400, alt = 'Image', ...rest }: any) {
  const proxied = src ? `/api/drive?src=${encodeURIComponent(String(src))}&sz=${sz}` : '/placeholder.png';
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={proxied} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = '/placeholder.png'; }} {...rest} />
  );
}
