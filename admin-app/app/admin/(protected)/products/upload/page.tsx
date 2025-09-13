"use client";
import React, { useState } from "react";

type PreviewRow = Record<string, string>;

export default function UploadCsvPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [log, setLog] = useState<string>("");

  async function handlePreview() {
    if (!file) return;
    const text = await file.text();
    // simple client-side CSV preview (no dependency); assumes comma/quoted minimal
    const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
    const headers = headerLine.split(",").map((h) => h.trim());
    const rows: PreviewRow[] = lines.map((ln) => {
      const cols = ln.split(","); // for real-world, replace with a small parser or reuse server
      const obj: PreviewRow = {};
      headers.forEach((h, i) => (obj[h] = (cols[i] ?? "").trim()));
      return obj;
    });
    setPreview(rows.slice(0, 300)); // safety cap
    // Initialize selection (select all by default)
    const nextSel: Record<string, boolean> = {};
    for (const r of rows) {
      if (r.product_id) nextSel[r.product_id] = true;
    }
    setSelected(nextSel);
  }

  function toggleAll(on: boolean) {
    if (!preview) return;
    const next: Record<string, boolean> = {};
    for (const r of preview) {
      if (r.product_id) next[r.product_id] = on;
    }
    setSelected(next);
  }

  async function handleImport() {
    if (!file) return;
    const chosen = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const fd = new FormData();
    fd.append("file", file);
    if (chosen.length) fd.append("selected", JSON.stringify(chosen));

    const res = await fetch("/api/admin-api/products/import", {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    setLog(JSON.stringify(data, null, 2));
  }

  // One-click import: send the CSV file without a `selected` field so the
  // server will import all rows (option A).
  async function handleImportAll() {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/admin-api/products/import", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      setLog(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setLog(`Request failed: ${err?.message || String(err)}`);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Upload CSV</h1>

      <div className="flex items-center gap-3">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button
          onClick={handlePreview}
          className="px-3 py-2 rounded-xl shadow hover:shadow-md border disabled:opacity-50"
          disabled={!file}
        >
          Preview
        </button>
        <button
          onClick={() => toggleAll(true)}
          className="px-3 py-2 rounded-xl border"
          disabled={!preview}
        >
          Select all
        </button>
        <button
          onClick={() => toggleAll(false)}
          className="px-3 py-2 rounded-xl border"
          disabled={!preview}
        >
          Clear
        </button>
        <button
          onClick={handleImport}
          className="px-3 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-50"
          disabled={!file}
        >
          Import selected
        </button>
        <button
          onClick={handleImportAll}
          className="px-3 py-2 rounded-xl bg-green-600 text-white hover:opacity-90 disabled:opacity-50"
          disabled={!file}
        >
          Import all
        </button>
      </div>

      {preview && (
        <div className="overflow-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 text-left">Pick</th>
                {Object.keys(preview[0] || {}).map((h) => (
                  <th key={h} className="p-2 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((r, i) => {
                const pid = r.product_id || `row-${i}`;
                const checked = !!selected[pid];
                return (
                  <tr key={pid} className="border-t">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setSelected((prev) => ({
                            ...prev,
                            [pid]: e.target.checked,
                          }))
                        }
                      />
                    </td>
                    {Object.entries(r).map(([k, v]) => (
                      <td key={k} className="p-2">
                        {v}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!!log && (
        <pre className="p-3 bg-gray-50 rounded-xl border overflow-auto text-xs">
          {log}
        </pre>
      )}
    </div>
  );
}
