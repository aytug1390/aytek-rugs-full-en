"use client";

import { useState, useRef } from "react";

function ImagesMapUploader() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resJson, setResJson] = useState(null);
  const inputRef = useRef(null);

  async function submit(e){
    e.preventDefault();
    if(!file) return;
    setUploading(true);
    setResJson(null);
    try{
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/admin-api/import/images-map", { method: "POST", body: fd });
      const json = await res.json();
      if(!res.ok) throw new Error(JSON.stringify(json));
      setResJson(json);
    }catch(err){
      alert("Upload failed: " + (err.message || err));
    }finally{
      setUploading(false);
    }
  }
  return (
    <form onSubmit={submit} className="p-4 space-y-3">
      <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"
           onClick={()=>inputRef.current?.click()}>
        <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden"
               onChange={(e)=>setFile(e.target.files?.[0]||null)} />
        <div className="text-sm">
          {file ? <>Seçildi: <b>{file.name}</b></> : <>drive_image_map.csv seçin</>}
        </div>
      </div>
      <button type="submit" disabled={!file || uploading}
        className={`px-4 py-2 rounded-md text-white ${(!file||uploading)?"bg-gray-400":"bg-black hover:opacity-90"}`}>
        {uploading ? "Yükleniyor…" : "Yükle"}
      </button>
      {resJson && (
        <div className="text-sm border rounded-md p-3 bg-green-50">
          <div className="font-medium mb-1">Sonuç</div>
          <ul className="list-disc ml-5">
            <li>Rows: <b>{resJson.received_rows}</b></li>
            <li>Unique SKUs: <b>{resJson.unique_skus}</b></li>
            <li>Updated: <b>{resJson.updated}</b></li>
            {resJson.missing?.length ? <li>Missing: {resJson.missing.length}</li> : null}
          </ul>
        </div>
      )}
    </form>
  );
}

export default function AdminImportPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [log, setLog] = useState("");
  const inputRef = useRef(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLog("");
    if (!file) {
      setError("Lütfen bir CSV dosyası seçin.");
      return;
    }
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file); // backend 'file' alanını bekliyor

      // /admin-api → Next rewrites ile 5000’e proxy
      const res = await fetch(`/admin-api/import/products`, {
        method: "POST",
        body: fd,
        // DİKKAT: FormData ile 'Content-Type' header'ı MANUEL AYARLANMAZ.
      });

      // Use safeJson to avoid parse errors when backend returns HTML or text
      const { safeJson } = await import("@/lib/safeJson");
      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
        // try to read text for error message
        const t = await res.text().catch(() => "");
        setError(`HTTP ${res.status} — ${t.slice(0, 300)}`);
        return;
      }
      if (ct.includes("application/json")) {
        const json = await safeJson(res, {});
        setResult(json);
        setLog(JSON.stringify(json, null, 2));
      } else {
        // Sunucu düz metin dönerse yine gösterelim
        const text = await res.text().catch(() => "");
        setLog(text);
        setResult({ message: "Import tamamlandı", raw: true });
      }
    } catch (err) {
      setError(err.message || "Yükleme başarısız");
    } finally {
      setUploading(false);
    }
  }

  function onPick() {
    inputRef.current?.click();
  }

  function onChange(e) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  function downloadJSON() {
    if (!log) return;
    const blob = new Blob([log], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import_result.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Import (CSV)</h2>

  <div className="rounded-lg border bg-white p-4 space-y-4">
        <p className="text-sm text-gray-700">
          Lütfen <b>merge_drive_map.py</b> ile üretilmiş dosyalardan birini yükleyin
          (ör. <code>import_batch_1.csv</code>). Büyük veri için 1000’lik batch’ler önerilir.
        </p>

  <form onSubmit={onSubmit} className="space-y-3">
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"
            onClick={onPick}
          >
            <input
              ref={inputRef}
              id="import-file"
              name="file"
              type="file"
              accept=".csv,text/csv"
              onChange={onChange}
              className="hidden"
            />
            <div className="text-sm">
              {file ? (
                <span>
                  Seçildi: <b>{file.name}</b> ({Math.ceil(file.size / 1024)} KB)
                </span>
              ) : (
                <span>CSV dosyanızı buraya tıklayarak seçin</span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading || !file}
            className={`px-4 py-2 rounded-md text-white ${
              uploading || !file ? "bg-gray-400" : "bg-black hover:opacity-90"
            }`}
          >
            {uploading ? "Yükleniyor…" : "Yükle ve İçeri Al"}
          </button>
        </form>

        {error && (
          <div className="border rounded-md p-3 bg-red-50 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="border rounded-md p-3 bg-green-50 text-sm text-green-800 space-y-2">
            <div className="font-medium">Sonuç</div>

            {/* Esnek özet: backend hangi alanları dönerse onları yakalamaya çalışıyoruz */}
            <ul className="list-disc ml-5">
              {"imported" in result && <li>Imported: <b>{result.imported}</b></li>}
              {"updated" in result && <li>Updated: <b>{result.updated}</b></li>}
              {"skipped" in result && <li>Skipped: <b>{result.skipped}</b></li>}
              {"errors" in result && Array.isArray(result.errors) && (
                <li>Errors: <b>{result.errors.length}</b></li>
              )}
              {"message" in result && <li>{result.message}</li>}
            </ul>

            {"errors" in result && Array.isArray(result.errors) && result.errors.length > 0 && (
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full text-xs border bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Row</th>
                      <th className="p-2 text-left">Column</th>
                      <th className="p-2 text-left">Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.slice(0, 50).map((e, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{e.row ?? "-"}</td>
                        <td className="p-2">{e.column ?? "-"}</td>
                        <td className="p-2">{e.issue ?? JSON.stringify(e)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.errors.length > 50 && (
                  <div className="text-xs text-gray-600 mt-1">
                    (+{result.errors.length - 50} daha…)
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {log && (
                <button
                    type="button"
                    onClick={downloadJSON}
                    className="px-3 py-1 rounded-md border bg-white hover:bg-gray-50"
                  >
                    Sonucu JSON olarak indir
                  </button>
              )}
              <a
                href="/admin/rugs"
                className="px-3 py-1 rounded-md border bg-white hover:bg-gray-50"
              >
                Rug listesine git
              </a>
            </div>
          </div>
        )}

      {!result && !error && (
        <>
          <div className="mt-6">
            <details className="rounded-lg border bg-white">
              <summary className="cursor-pointer px-4 py-3 font-medium">
                Attach Images Map (only)
              </summary>
              <div className="p-2">
                <ImagesMapUploader />
              </div>
            </details>
          </div>

          <div className="text-xs text-gray-500">
            İpucu: Rewrite çalışıyorsa tarayıcıda{" "}
            <code>/admin-api/import/products</code> doğrudan 405 (Method Not Allowed)
            dönebilir; bu normaldir. POST formu ile gönderildiğinde JSON gelecek.
          </div>
        </>
      )}
      </div>
    </div>
  );
}

