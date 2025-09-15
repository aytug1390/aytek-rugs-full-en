"use client";
import { useSearchParams, useRouter } from "next/navigation";

export default function CategoryFilter({ categories }) {
  const sp = useSearchParams();
  const router = useRouter();
  const active = sp.get("category") || "";

  function goCategory(slug) {
    const q = new URLSearchParams();
    if (slug) q.set('category', slug);
    q.set('limit', '50');
    router.push(`/all-rugs?${q.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        type="button"
        onClick={() => goCategory("")}
        className={`chip ${active === "" ? "chip-active" : ""}`}
        aria-pressed={active === ""}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c.slug}
          type="button"
          onClick={() => goCategory(c.slug)}
          className={`chip ${active === c.slug ? "chip-active" : ""}`}
          aria-pressed={active === c.slug}
        >
          {c.name}
        </button>
      ))}
      <style jsx>{`
        .chip{padding:6px 12px;border:1px solid #e5e7eb;border-radius:999px;background:white}
        .chip-active{background:#111;color:#fff;border-color:#111}
      `}</style>
    </div>
  );
}

