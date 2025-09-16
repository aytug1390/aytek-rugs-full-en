"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

const PAGE_SIZE = 10;

async function fetchJSON(url, opts = {}) {
  const isServer = typeof window === "undefined";
  const fetchUrl = isServer && !/^https?:\/\//i.test(url) ? (process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:5001") + url : url;
  const baseOpts = isServer ? { cache: "no-store" } : { cache: "no-store", headers: { Accept: "application/json" } };
  const res = await fetch(fetchUrl, { ...baseOpts, ...opts });
  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    // ignore
  }
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(String(msg));
  }
  return data;
}

export default function AdminReviews() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [productId, setProductId] = useState("");

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", String(PAGE_SIZE));
    if (productId.trim()) p.set("product_id", productId.trim());
    return p.toString();
  }, [page, productId]);

  const loadCb = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJSON(`/admin-api/reviews?${qs}`);
      setRows(data.items || data.data || []);
      setTotal(typeof data.total === "number" ? data.total : (data.items || []).length);
    } catch (e) {
      console.error(e);
      alert("Failed to load reviews");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => { loadCb(); }, [loadCb]);

  async function approve(id) {
    try {
      await fetchJSON(`/admin-api/reviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_approved: true }) });
      setRows((list) => list.map((r) => (r._id === id ? { ...r, is_approved: true } : r)));
    } catch (e) {
      alert("Approve failed: " + e.message);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reviews</h2>
      </div>

      <div className="flex items-end gap-3">
        <div>
          <label className="block text-sm font-medium">Filter by Product ID</label>
          <input
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="RUMI-VD170240"
            className="border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => { setPage(1); loadCb(); }}
          className="px-3 py-2 text-sm rounded-md border bg-white hover:bg-gray-50"
        >
          Apply
        </button>
      </div>

      <div className="overflow-x-auto border rounded-lg bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Approved</th>
              <th className="text-left p-2">Product</th>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Rating</th>
              <th className="text-left p-2">Comment</th>
              <th className="text-left p-2 w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-gray-500">No records</td></tr>
            ) : rows.map((r) => (
              <tr key={r._id} className="border-t">
                <td className="p-2">{r.is_approved ? "✅" : "⏳"}</td>
                <td className="p-2">{r.product_id}</td>
                <td className="p-2">{r.name}</td>
                <td className="p-2">{r.rating}</td>
                <td className="p-2">{r.comment}</td>
                <td className="p-2">
                  {!r.is_approved && (
                    <button
                      onClick={() => approve(r._id)}
                      className="px-3 py-1 rounded-md text-white bg-black hover:opacity-90"
                    >
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-3 py-2 text-sm rounded-md border bg-white disabled:opacity-50"
        >
          ← Prev
        </button>
        <span className="text-sm">Page {page} / {totalPages}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-2 text-sm rounded-md border bg-white disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    </div>
  );
}




