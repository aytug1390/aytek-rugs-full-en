"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

const PAGE_SIZE = 10;

function cls(...a){return a.filter(Boolean).join(" ");}

import { safeJson } from "@/lib/safeJson";

async function fetchJSON(url, opts = {}) {
  // If this file runs as a Server Component, fetch will run on server and
  // absolute URL is safer; when running as Client Component we call the
  // relative `/admin-api` path and rely on the Next proxy. Keep headers only
  // for client-side calls - but safeJson will guard parsing.
  const isServer = typeof window === "undefined";
  const fetchUrl = isServer && !/^https?:\/\//i.test(url) ? (process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:5001") + url : url;
  const baseOpts = isServer ? { cache: "no-store" } : { cache: "no-store", headers: { Accept: "application/json" } };
  const res = await fetch(fetchUrl, { ...baseOpts, ...opts });
  // Use safeJson to avoid throwing when upstream returns HTML or broken JSON
  const data = await safeJson(res, { items: [], total: 0 });
  if (!res.ok) {
    // include status and any message if present in JSON
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(String(msg));
  }
  return data;
}

export default function AdminRugsPage() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // filtreler
  const [productId, setProductId] = useState("");
  const [q, setQ] = useState("");

  // quick add (tekil)
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    product_id: "",
    title: "",
    price: "",
    currency: "USD",
    availability: "in stock",
    main_image: "",
    width_cm: "",
    length_cm: "",
  });

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", String(PAGE_SIZE));
    if (productId.trim()) p.set("product_id", productId.trim());
    if (q.trim()) p.set("q", q.trim());
    return p.toString();
  }, [page, productId, q]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchJSON(`/admin-api/products?${qs}`);
      setRows(data.items || data.data || []);
      setTotal(data.total ?? 0);
    } catch (e) {
      console.error(e);
      setErr(e.message || "Failed to load products");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function toggleAvailability(row) {
    try {
      const newAvail = row.availability === "in stock" ? "out of stock" : "in stock";
      const res = await fetchJSON(`/admin-api/products/${row._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: newAvail }),
      });
      setRows((list) => list.map((x) => (x._id === row._id ? { ...x, availability: newAvail } : x)));
    } catch (e) {
      alert("Update failed: " + e.message);
    }
  }

  async function remove(row) {
    if (!confirm(`Delete product ${row.product_id || row.title}?`)) return;
    try {
      await fetchJSON(`/admin-api/products/${row._id}`, { method: "DELETE" });
      setRows((list) => list.filter((x) => x._id !== row._id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  }

  async function createOne(e) {
    e.preventDefault();
    if (!form.product_id || !form.title || !form.price || !form.main_image) {
      alert("product_id, title, price ve main_image zorunlu.");
      return;
    }
    setAdding(true);
    try {
      const body = {
        ...form,
        price: Number(form.price),
        width_cm: form.width_cm ? Number(form.width_cm) : undefined,
        length_cm: form.length_cm ? Number(form.length_cm) : undefined,
      };
      const created = await fetchJSON(`/admin-api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      // En üste göster
      setRows((list) => [created, ...list]);
      setTotal((t) => t + 1);
      setForm({
        product_id: "",
        title: "",
        price: "",
        currency: "USD",
        availability: "in stock",
        main_image: "",
        width_cm: "",
        length_cm: "",
      });
    } catch (e) {
      alert("Create failed: " + e.message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Rugs</h2>
        <div className="flex items-center gap-2">
          <a
            href="/admin/import"
            className="px-3 py-2 text-sm rounded-md border bg-white hover:bg-gray-50"
            title="Bulk import via CSV"
          >
            Import (CSV)
          </a>
        </div>
      </div>

      {/* Filtre */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-sm font-medium">Filter by Product ID</label>
          <input
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="RUMI-VD170240"
            className="border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Search (title/sku)</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="yahyalı, konya, kilim..."
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

      {/* Hata bandı */}
      {err && (
        <div className="border text-sm rounded-md p-3 bg-red-50 text-red-700">
          {err}
          <div className="mt-1 text-xs text-red-600/80">
            Eğer içerik tipi hatası görürsen, <code>next.config</code> rewrites veya
            <code> .env NEXT_PUBLIC_API_BASE</code> ayarını kontrol et.
          </div>
        </div>
      )}

      {/* Hızlı Tekil Ekleme (Add Product) */}
      <details className="rounded-lg border bg-white">
        <summary className="cursor-pointer px-4 py-3 font-medium">Add Product (single)</summary>
        <form onSubmit={createOne} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="block mb-1">Product ID (SKU) *</span>
            <input
              className="border rounded-md px-3 py-2 w-full"
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1">Title *</span>
            <input
              className="border rounded-md px-3 py-2 w-full"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1">Price (USD) *</span>
            <input
              type="number" step="0.01" min="0"
              className="border rounded-md px-3 py-2 w-full"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1">Main Image URL *</span>
            <input
              className="border rounded-md px-3 py-2 w-full"
              placeholder="https://drive.google.com/uc?export=view&id=..."
              value={form.main_image}
              onChange={(e) => setForm({ ...form, main_image: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1">Width (cm)</span>
            <input
              type="number" step="0.1" min="0"
              className="border rounded-md px-3 py-2 w-full"
              value={form.width_cm}
              onChange={(e) => setForm({ ...form, width_cm: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1">Length (cm)</span>
            <input
              type="number" step="0.1" min="0"
              className="border rounded-md px-3 py-2 w-full"
              value={form.length_cm}
              onChange={(e) => setForm({ ...form, length_cm: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="block mb-1">Availability</span>
            <select
              className="border rounded-md px-3 py-2 w-full"
              value={form.availability}
              onChange={(e) => setForm({ ...form, availability: e.target.value })}
            >
              <option value="in stock">in stock</option>
              <option value="out of stock">out of stock</option>
            </select>
          </label>

          <div className="md:col-span-2">
            <button
              disabled={adding}
              className={cls(
                "px-4 py-2 rounded-md text-white",
                adding ? "bg-gray-400" : "bg-black hover:opacity-90"
              )}
              type="submit"
            >
              {adding ? "Saving…" : "Save Product"}
            </button>
          </div>
        </form>
      </details>

      {/* Liste */}
      <div className="overflow-x-auto border rounded-lg bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Product</th>
              <th className="text-left p-2">Title</th>
              <th className="text-left p-2">Price</th>
              <th className="text-left p-2">Avail.</th>
              <th className="text-left p-2">Image</th>
              <th className="text-left p-2 w-44">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-gray-500">No records</td></tr>
            ) : rows.map((r) => (
              <tr key={r._id || r.product_id} className="border-t">
                <td className="p-2">{r.product_id || "-"}</td>
                <td className="p-2">{r.title || "-"}</td>
                <td className="p-2">
                  {(() => {
                    if (typeof r.price === "number") {
                      return `$${r.price.toFixed(2)}`;
                    }
                    if (r.price && typeof r.price === "object" && r.price.amount != null) {
                      // Eğer obje ise: {amount, currency}
                      return `${r.price.currency || ""} ${r.price.amount}`;
                    }
                    return r.price || "-";
                  })()}
                </td>
                <td className="p-2">{r.availability || "-"}</td>
                <td className="p-2">
                  {r.main_image ? (
                    <img
                      src={r.main_image}
                      alt=""
                      className="w-16 h-16 object-cover rounded"
                      loading="lazy"
                    />
                  ) : "—"}
                </td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleAvailability(r)}
                      className="px-3 py-1 rounded-md border bg-white hover:bg-gray-50"
                    >
                      {r.availability === "in stock" ? "Mark Out" : "Mark In"}
                    </button>
                    <button
                      onClick={() => remove(r)}
                      className="px-3 py-1 rounded-md text-white bg-red-600 hover:opacity-90"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* sayfalama */}
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




