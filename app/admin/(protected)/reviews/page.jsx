"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/api";

const PAGE_SIZE = 10;

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

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin-api/reviews?${qs}`, {
        cache: "no-store",
      });
      const { safeJson } = await import("@/lib/safeJson");
      const data = await safeJson(res, { items: [], total: 0 });
      setRows(data.items || data.data || []);
      setTotal(typeof data.total === "number" ? data.total : (data.items || []).length);
    } catch (e) {
      console.error(e);
      alert("Reviews getirilemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [qs]);

  async function approve(id) {
    if (!confirm("Onaylansın mı?")) return;
    try {
      const r = await fetch(`${API_BASE}/admin-api/reviews/${id}/approve`, {
        method: "PATCH",
      });
      if (!r.ok) throw new Error("Approve failed");
      setRows((list) => list.map((x) => (x._id === id ? { ...x, is_approved: true } : x)));
    } catch (e) {
      console.error(e);
      alert("Onaylama başarısız");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
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
          onClick={() => { setPage(1); load(); }}
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
              <tr><td colSpan={6} className="p-4 text-gray-500">Kayıt yok</td></tr>
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




