import React, { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState([]);

  async function onChange(e) {
    const f = e.target.files[0];
    setFile(f);
    if (!f) return;
    const text = await f.text();
    // preview first 5 lines
    setPreview(text.split('\n').slice(0, 5).join('\n'));
  }

  async function onUpload() {
    setErrors([]);
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin-api/products/import', { method: 'POST', body: fd });
    const json = await res.json();
    if (!res.ok) setErrors([json.message || 'Import failed']);
    else alert('Import OK: ' + json.imported + ' records');
  }

  return (
    <div>
      <h1>CSV İçe Aktar</h1>
      <input type="file" accept="text/csv" onChange={onChange} />
      <div style={{ whiteSpace: 'pre-wrap', marginTop: 12, border: '1px solid #ddd', padding: 8 }}>
        {preview || 'Preview will appear here'}
      </div>
      <div style={{ color: 'red' }}>{errors.map((e) => <div key={e}>{e}</div>)}</div>
      <button onClick={onUpload} style={{ marginTop: 12 }}>Upload</button>
    </div>
  );
}
