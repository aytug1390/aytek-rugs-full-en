"use client";
import Image from "next/image";
import { useList } from "@/context/ListContext";
import { useState } from "react";
import { getSafeImgUrl } from "@/lib/imageUrl";

function ListItem({ item, onRemove }: { item: any; onRemove: (id: string) => void }) {
  const [errored, setErrored] = useState(false);
  const src = getSafeImgUrl(item.image || "/placeholder.jpg");
  return (
    <li key={item.id} className="flex gap-2 items-center">
      {!errored ? (
        <div className="w-12 h-12 relative">
          <Image src={src} alt="" fill className="object-cover rounded" unoptimized onError={() => setErrored(true)} />
        </div>
      ) : (
        <div className="w-12 h-12 grid place-items-center bg-neutral-100 text-neutral-500 rounded">No</div>
      )}
      <div className="flex-1">
        <div className="text-sm font-medium line-clamp-1">{item.name || item.id}</div>
        {item.price ? <div className="text-xs text-gray-600">${item.price}</div> : null}
      </div>
      <button onClick={() => onRemove(item.id)} className="text-xs text-red-600 hover:underline">remove</button>
    </li>
  );
}

export default function MyListSidebar() {
  const { list, remove, clear } = useList();
  return (
    <aside className="w-full lg:w-64 xl:w-72 shrink-0">
      <div className="sticky top-20 border rounded-2xl p-4 bg-white">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">My List</h3>
          <span className="text-xs bg-black text-white rounded-full px-2 py-0.5">{list.length}</span>
        </div>
        {list.length === 0 ? (
          <p className="text-sm text-gray-600 mt-3">
            Add favorite rugs to your list, request quotes or share with clients.
          </p>
        ) : (
          <>
            <ul className="mt-3 space-y-3">
              {list.map(item => (
                <ListItem key={item.id} item={item} onRemove={remove} />
              ))}
            </ul>
            <button onClick={clear} className="w-full mt-4 rounded-xl border py-2 hover:bg-gray-50 text-sm">Clear List</button>
          </>
        )}
        <div className="mt-4 space-y-2 text-xs text-gray-700">
          <div>✅ 14-day money back</div>
          <div>🚚 Free shipping (USA & Canada)</div>
        </div>
      </div>
    </aside>
  );
}

