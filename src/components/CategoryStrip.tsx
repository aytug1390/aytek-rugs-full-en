"use client";

import Link from "next/link";
import { CATEGORIES } from "@/data/categories";

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
              <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
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
