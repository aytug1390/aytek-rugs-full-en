"use client";

import Link from "next/link";
import Image from "next/image";
import { CATEGORIES } from "@/data/categories";
import { buildDriveCandidates, handleImgError } from "@/lib/driveImage";

export default function CategoryStrip() {
  return (
    <div className="relative">
      <div className="flex gap-4 overflow-x-auto py-2">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={{ pathname: '/all-rugs', query: { category: c.slug } }}
            className="flex-none w-44 rounded-2xl overflow-hidden border hover:shadow transition"
            title={c.name}
          >
            <div className="h-28">
              {(() => {
                const pool = buildDriveCandidates(c.image);
                const [idx, setIdx] = ((): [number, (v:number)=>void] => {
                  // lightweight per-render state using closure + refactor is not ideal;
                  // instead, render a small component to hold state.
                  return [0, () => {}];
                })();
                // Render a simple inline component that manages its own error state
                const Img = () => {
                  const { useState } = require('react');
                  const [i, setI] = useState(0);
                  const src = pool[i];
                  return (
                    <Image src={src} alt={c.name} fill unoptimized className="w-full h-full object-cover" onError={() => setI((prev)=>Math.min(prev+1,pool.length-1))} />
                  );
                };
                return <Img />;
              })()}
            </div>
            <div className="p-2">
              <p className="text-sm font-semibold">{c.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
