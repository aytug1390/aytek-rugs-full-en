"use client";
import React from 'react';

// Minimal magnify image adapter used where the richer implementation is missing.
// Accepts a subset of props used across the app so imports resolve during build.
export default function MagnifyImage({ src, alt = '', className = '', zoom, lensSize, style = undefined }) {
  // This is intentionally minimal: a plain <img/> so pages render during build.
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
    />
  );
}
