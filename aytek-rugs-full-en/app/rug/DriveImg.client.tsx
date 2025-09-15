"use client";
import React from 'react';
import ProxyImg from '@/components/ProxyImg';

export default function DriveImg({ src, alt = '', className = '', width, height, style }: { src: any; alt?: string; className?: string; width?: any; height?: any; style?: any }) {
  return <ProxyImg src={src} alt={alt} className={className} width={width} height={height} style={style} />;
}
