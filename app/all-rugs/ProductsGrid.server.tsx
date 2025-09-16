import Link from "next/link";
import Image from "next/image";
import { getImgUrl } from "@/lib/imageUrl";

type Item = any;

export default function ProductsGridServer({ items = [], page = 1, limit = 24, total = 0 }: { items?: Item[]; page?: number; limit?: number; total?: number }) {
  const hasNext = (page * limit) < (total || (items || []).length);
  const hasPrev = (page || 1) > 1;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {(items || []).map((it: Item) => {
          const id = String(it._id ?? it.product_id ?? it.id ?? "");
          const name = it.title || it.name || id;
          const raw = it.images?.[0]?.url || it.image_url || it.image?.url || "";
          const imgSrc = raw ? getImgUrl(raw) : "";

          return (
            <article key={id} className="group block rounded-xl overflow-hidden border hover:shadow bg-white">
              <Link href={`/rug/${id}`} className="block">
                <div className="relative aspect-[4/3] bg-gray-50">
                  {imgSrc ? (
                    <Image src={imgSrc} alt={name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full grid place-items-center bg-neutral-100 text-neutral-500">
                      <span className="text-sm">No image</span>
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-3">
                <div className="font-medium line-clamp-1">{name}</div>
                <div className="text-xs text-gray-500 line-clamp-1">{(it.size_text || "").trim()}{it.origin ? ` • ${it.origin}` : ""}</div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-6">
        <a className={`px-3 py-2 rounded border ${hasPrev ? "opacity-100" : "opacity-40 pointer-events-none"}`} href={`/all-rugs?page=${page - 1}&limit=${limit}`}>← Prev</a>
        <span className="text-sm">Page {page} • Showing {(items || []).length} / {total}</span>
        <a className={`px-3 py-2 rounded border ${hasNext ? "opacity-100" : "opacity-40 pointer-events-none"}`} href={`/all-rugs?page=${page + 1}&limit=${limit}`}>Next →</a>
      </div>
    </div>
  );
}
