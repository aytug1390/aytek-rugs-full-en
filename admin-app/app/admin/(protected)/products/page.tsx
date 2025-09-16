"use client";
import React, { useEffect, useState } from "react";
import getImgUrl from '@/lib/imageUrl';
import Image from 'next/image';
import Link from "next/link";

type Product = {
  product_id: string;
  title?: string;
  price?: number;
  origin?: string;
  size_text?: string;
  color?: string[];
  image_url?: string;
};

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin-api/products", { cache: "no-store" });
      const data = await res.json();
      setItems(data.items || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products ({items.length})</h1>
        <Link
          href="/admin/(protected)/products/upload"
          className="px-3 py-2 rounded-xl shadow hover:shadow-md border"
        >
          Upload CSV
        </Link>
      </div>

      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Title</th>
              <th className="p-2 text-left">Price</th>
              <th className="p-2 text-left">Origin</th>
              <th className="p-2 text-left">Size</th>
              <th className="p-2 text-left">Colors</th>
              <th className="p-2 text-left">Image</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.product_id} className="border-t">
                <td className="p-2 font-mono">{p.product_id}</td>
                <td className="p-2">{p.title}</td>
                <td className="p-2">{p.price ?? ""}</td>
                <td className="p-2">{p.origin ?? ""}</td>
                <td className="p-2">{p.size_text ?? ""}</td>
                <td className="p-2">
                  {Array.isArray(p.color) ? p.color.join(", ") : ""}
                </td>
                <td className="p-2">
                  {p.image_url ? (
                    <div className="relative h-10 w-10 rounded-md overflow-hidden">
                      <Image
                        src={getImgUrl(p.image_url)}
                        alt={p.title || p.product_id}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    ""
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="p-6 text-gray-500" colSpan={7}>
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
