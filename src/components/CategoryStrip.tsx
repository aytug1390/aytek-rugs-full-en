"use client";

import Link from "next/link";
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
                return (
                  <img
                    src={pool[0]}
                    data-pool={JSON.stringify(pool)}
                    data-idx={"0"}
                    alt={c.name}
                    className="w-full h-full object-cover"
                    onError={handleImgError}
                  />
                );
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
