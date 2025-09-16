"use client";
import { useEffect, useRef, useState } from "react";

export default function DeepZoom({ id }: { id: string }) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const [err, setErr] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let viewer: any = null;

  const proxify = (url: string) => url?.startsWith('http') ? `/api/drive?url=${encodeURIComponent(url)}` : url;

  async function run() {
      try {
        setLoading(true);

        // 1) Ürünü product_id ile al
        const r = await fetch(`/api/admin-api/products?limit=1&page=1&product_id=${encodeURIComponent(id)}`, {
          headers: { "x-ui": "deep-zoom" },
          cache: "no-store",
        });
        if (!r.ok) throw new Error(`Product fetch ${r.status}`);
        const data = await r.json();
        const item = data?.items?.[0];
  const imageUrl: string | undefined = item?.image_url;

  if (!imageUrl) throw new Error("image_url bulunamadı");

  // proxify the image so it is served from our same-origin proxy (avoid CORS)
  const src = proxify(imageUrl);

  // Ensure OpenSeadragon is available (load from CDN if needed)
        if (!(window as any).OpenSeadragon) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.1/openseadragon.min.js';
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Failed to load OpenSeadragon'));
            document.head.appendChild(s);
          });
        }

        const OpenSeadragon = (window as any).OpenSeadragon;
        if (!OpenSeadragon) throw new Error('OpenSeadragon not available');

        // 2) OpenSeadragon başlat (tek büyük görselle)
        viewer = OpenSeadragon({
          element: divRef.current!,
          prefixUrl: 'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.1/images/',
          showNavigator: true,
          maxZoomPixelRatio: 3,
          tileSources: { type: 'image', url: src },
        });
      } catch (e: any) {
        setErr(e?.message || "Deep zoom error");
      } finally {
        setLoading(false);
      }
    }

    run();
    return () => {
      try { viewer?.destroy(); } catch (e) { /* ignore */ }
    };
  }, [id]);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ height: 600 }}>
      <div ref={divRef} className="w-full h-full bg-black/5" />
      {loading && <p className="p-2 text-sm text-gray-500">Loading image…</p>}
      {err && <p className="p-2 text-sm text-red-600">{err}</p>}
    </div>
  );
}
