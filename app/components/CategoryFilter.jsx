"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CategoryFilter({ categories }) {
  const sp = useSearchParams();
  const active = sp.get("category") || "";
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Link href="/all-rugs?limit=50" className={`chip ${active===""?"chip-active":""}`}>
        All
      </Link>
      {categories.map(c => (
        <Link
          key={c.slug}
          href={`/all-rugs?category=${encodeURIComponent(c.slug)}&limit=50`}
          className={`chip ${active===c.slug?"chip-active":""}`}
        >
          {c.name}
        </Link>
      ))}
      <style jsx>{`
        .chip{padding:6px 12px;border:1px solid #e5e7eb;border-radius:999px}
        .chip-active{background:#111;color:#fff;border-color:#111}
      `}</style>
    </div>
  );
}

