"use client";
import React from 'react';
import ProxyImg from '@/components/ProxyImg';

export default function ImageSafe({ src, alt = '', className = '', width, height, style }) {
  return <ProxyImg src={src} alt={alt} className={className} width={width} height={height} style={style} />;
}
