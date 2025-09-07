"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/data/categories";

export default function CategoryChips({ active }: { active?: string }) {
  const qs = useSearchParams();

  return (
    <div className="flex gap-2 overflow-x-auto py-2 -mx-2 px-2">
      <Link
        href="/all-rugs"
        className={`px-3 py-1.5 rounded-full border text-sm whitespace-nowrap ${
          !active ? "bg-black text-white" : "hover:bg-gray-100"
        }`}>
        All
      </Link>
      {CATEGORIES.map((c) => {
        const q = qs ? qs.toString() : "";
        const href = q ? `/category/${c.slug}?${q}` : `/category/${c.slug}`;
        return (
          <Link
            key={c.slug}
            href={href}
            className={`px-3 py-1.5 rounded-full border text-sm whitespace-nowrap ${
              active === c.slug ? "bg-black text-white" : "hover:bg-gray-100"
            }`}>
            {c.name}
          </Link>
        );
      })}
    </div>
  );
}

