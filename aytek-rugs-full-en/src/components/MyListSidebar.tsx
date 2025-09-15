"use client";
import { useList } from "@/context/ListContext";

export default function MyListSidebar() {
  const { list, remove, clear } = useList();

  function formatPrice(p: any) {
    if (!p && p !== 0) return '';
    if (typeof p === 'number') return p.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    if (typeof p === 'string') return p;
    // handle shape like { amount, currency }
    if (typeof p === 'object' && p !== null) {
      const amt = (p.amount ?? p.value ?? p["amount"] ?? p["value"]);
      const cur = p.currency || p.currency_code || 'USD';
      const n = Number(amt);
      if (isFinite(n)) return n.toLocaleString(undefined, { style: 'currency', currency: String(cur) });
      // fallback to JSON string
      try { return String(JSON.stringify(p)); } catch (e) { return '' }
    }
    return String(p);
  }
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
                <li key={item.id} className="flex gap-3 items-start">
                  <img src={item.image || "/placeholder.jpg"} alt="" className="w-12 h-12 object-cover rounded" loading="lazy" fetchPriority="low" decoding="async" />
                  <div className="flex-1">
                    <div className="text-sm font-medium line-clamp-1">{item.name || item.id}</div>
                    {item.sku ? <div className="text-xs text-gray-600">SKU: <span className="font-mono">{item.sku}</span></div> : null}
                    {item.price ? <div className="text-xs text-gray-600">{formatPrice(item.price)}</div> : null}
                    <div className="mt-2 flex items-center gap-2">
                      <button type="button"
                        onClick={async ()=>{
                          try {
                            const text = `SKU: ${item.sku || item.id} - ${location.origin}/rug/${item.id}`;
                            await navigator.clipboard.writeText(text);
                            // simple feedback: temporarily change button text via aria-label
                            const el = document.getElementById(`connect-btn-${item.id}`);
                            if (el) el.textContent = 'Copied';
                            setTimeout(()=>{ if (el) el.textContent = 'Connect'; }, 1200);
                          } catch (err) {
                            // ignore
                          }
                        }}
                        id={`connect-btn-${item.id}`}
                        className="text-xs rounded px-2 py-1 border hover:bg-gray-50">
                        Connect
                      </button>
                      <button type="button" onClick={()=>remove(item.id)} className="text-xs text-red-600 hover:underline">remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" onClick={clear} className="w-full mt-4 rounded-xl border py-2 hover:bg-gray-50 text-sm">Clear List</button>
          </>
        )}
        <div className="mt-4 space-y-2 text-xs text-gray-700">
          <div>✅ 30-day money back</div>
          <div>🚚 Free shipping (USA & Canada)</div>
        </div>
      </div>
    </aside>
  );
}

