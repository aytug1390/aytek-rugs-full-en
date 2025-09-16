"use client";
import React, { useRef, useState, useEffect } from 'react';
import { proxify, onImgError } from '@/lib/img';

type Props = {
  src: string;
  alt?: string;
  zoom?: number; // lens zoom multiplier
};

export default function ZoomImage({ src, alt = '', zoom = 2 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const lensRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function moveLens(e: MouseEvent | TouchEvent) {
      e.preventDefault();
      const img = imgRef.current;
      const lens = lensRef.current;
      if (!img || !lens) return;

      const bounds = img.getBoundingClientRect();
      let clientX = 0, clientY = 0;
      if (e instanceof TouchEvent) {
        if (!e.touches || e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      const x = clientX - bounds.left;
      const y = clientY - bounds.top;

      const sx = Math.max(0, Math.min(x / Math.max(bounds.width, 1), 1));
      const sy = Math.max(0, Math.min(y / Math.max(bounds.height, 1), 1));

      const lensSize = 160;
      const naturalW = img.naturalWidth || bounds.width;
      const naturalH = img.naturalHeight || bounds.height;
      const bgX = -sx * naturalW * zoom + lensSize / 2;
      const bgY = -sy * naturalH * zoom + lensSize / 2;

      lens.style.left = `${Math.max(0, Math.min(x - lensSize / 2, bounds.width - lensSize))}px`;
      lens.style.top = `${Math.max(0, Math.min(y - lensSize / 2, bounds.height - lensSize))}px`;
      lens.style.backgroundPosition = `${bgX}px ${bgY}px`;
      lens.style.backgroundSize = `${naturalW * zoom}px ${naturalH * zoom}px`;
    }

    function enter() { setVisible(true); }
    function leave() { setVisible(false); }

    container.addEventListener('mousemove', moveLens);
    container.addEventListener('touchmove', moveLens, { passive: false } as any);
    container.addEventListener('mouseenter', enter);
    container.addEventListener('mouseleave', leave);
    container.addEventListener('touchstart', enter);
    container.addEventListener('touchend', leave);

    return () => {
      container.removeEventListener('mousemove', moveLens);
      container.removeEventListener('touchmove', moveLens as any);
      container.removeEventListener('mouseenter', enter);
      container.removeEventListener('mouseleave', leave);
      container.removeEventListener('touchstart', enter);
      container.removeEventListener('touchend', leave);
    };
  }, [zoom]);

  const imgSrc = proxify(src);

  return (
    <div ref={containerRef} className="relative inline-block"> 
  <img ref={imgRef} src={imgSrc} alt={alt} className="block max-w-full h-auto" data-step="proxy" onError={onImgError(src)} />

      <div
        ref={lensRef}
        aria-hidden
        className="pointer-events-none rounded-full border-2 border-white shadow-lg"
        style={{
          position: 'absolute',
          width: 160,
          height: 160,
          display: visible ? 'block' : 'none',
          backgroundImage: `url(${imgSrc})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${(imgRef.current?.naturalWidth || 0) * zoom}px ${(imgRef.current?.naturalHeight || 0) * zoom}px`,
          transform: 'translateZ(0)',
          zIndex: 40,
        }}
      />
    </div>
  );
}
