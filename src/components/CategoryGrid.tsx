"use client";

import Link from "next/link";
import { CATEGORIES } from "@/data/categories";
import { getDriveImageSrc, preferLocalDriveSrc } from '@/lib/drive';

export default function CategoryGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.slug}
          href={`/category/${cat.slug}`}
          className="group rounded-2xl overflow-hidden shadow hover:shadow-lg transition"
        >
          <div className="relative h-48">
            <img
              src={getDriveImageSrc(cat.image, 1200) || preferLocalDriveSrc(cat.image, 1200)}
              alt={cat.name}
              className="w-full h-full object-cover"
              onError={(e)=>{ e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder.png'; }}
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white text-lg font-semibold drop-shadow">{cat.name}</h3>
              {cat.blurb && <p className="text-white/90 text-sm drop-shadow">{cat.blurb}</p>}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

