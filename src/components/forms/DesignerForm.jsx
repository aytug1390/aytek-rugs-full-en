"use client";
import React, { useState } from "react";

export default function DesignerForm() {
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    city: "",
    projectType: "Residential",
    message: "",
    wantsMockup: true,
    preferredColors: "",
    preferredSize: "",
    preferredSKU: "",
    files: [],
  });

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const onFileChange = (e) => update("files", Array.from(e.target.files));

  const validate = () => {
    if (!form.fullName.trim()) return "Full name is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Valid email is required.";
    if (!form.city.trim()) return "City/State is required.";
    if (!form.message.trim()) return "Please describe your project/requirements.";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    const err = validate();
    if (err) { setMsg({ type: "error", text: err }); return; }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === "files") return;
      fd.append(k, typeof v === "boolean" ? String(v) : v);
    });
    form.files.forEach((f) => fd.append("files", f));

    setSending(true);
    try {
      const res = await fetch("/api/designers/lead", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setMsg({ type: "ok", text: "Thanks! We received your request." });
      setForm({
        fullName: "", email: "", phone: "", company: "", city: "",
        projectType: "Residential", message: "", wantsMockup: true,
        preferredColors: "", preferredSize: "", preferredSKU: "", files: []
      });
    } catch (e2) {
      setMsg({ type: "error", text: e2.message });
    } finally { setSending(false); }
  };

  return (
    <section id="designer-form" className="mt-14 bg-white rounded-2xl shadow p-6 md:p-8">
      <h2 className="text-2xl font-bold">Request Designer Access</h2>
      <p className="text-gray-600 mt-2">
        Join our Designers Program. <b>Talep halinde ücretsiz görsel yerleşim (mockup)</b> çalışması yapıp e-posta ile gönderiyoruz.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium" htmlFor="designer-fullName">Full Name *</label>
            <input id="designer-fullName" name="fullName" className="w-full rounded-xl border px-3 py-2" value={form.fullName} onChange={(e)=>update("fullName", e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="designer-email">Email *</label>
            <input id="designer-email" name="email" type="email" className="w-full rounded-xl border px-3 py-2" value={form.email} onChange={(e)=>update("email", e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="designer-phone">Phone (optional)</label>
            <input id="designer-phone" name="phone" className="w-full rounded-xl border px-3 py-2" value={form.phone} onChange={(e)=>update("phone", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="designer-company">Company / Studio</label>
            <input id="designer-company" name="company" className="w-full rounded-xl border px-3 py-2" value={form.company} onChange={(e)=>update("company", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="designer-city">City / State *</label>
            <input id="designer-city" name="city" className="w-full rounded-xl border px-3 py-2" value={form.city} onChange={(e)=>update("city", e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium">Project Type</label>
            <select className="w-full rounded-xl border px-3 py-2" value={form.projectType} onChange={(e)=>update("projectType", e.target.value)}>
              <option>Residential</option>
              <option>Hospitality</option>
              <option>Office</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        {/* Mockup vurgusu + tercih alanları */}
        <div className="rounded-2xl border p-4">
          <div className="flex items-center gap-2">
            <input id="wantsMockup" type="checkbox" checked={form.wantsMockup} onChange={(e)=>update("wantsMockup", e.target.checked)} />
            <label htmlFor="wantsMockup" className="text-sm">
              I’d like a <b>free visual mockup</b> (place selected rugs into my room photo).
            </label>
          </div>
          <div className="mt-3 grid md:grid-cols-3 gap-3">
            <input id="designer-preferredColors" name="preferredColors" className="rounded-xl border px-3 py-2" placeholder="Preferred colors (e.g., beige, burgundy)" value={form.preferredColors} onChange={(e)=>update("preferredColors", e.target.value)} />
            <input id="designer-preferredSize" name="preferredSize" className="rounded-xl border px-3 py-2" placeholder="Preferred size (e.g., 8x10 ft)" value={form.preferredSize} onChange={(e)=>update("preferredSize", e.target.value)} />
            <input id="designer-preferredSKU" name="preferredSKU" className="rounded-xl border px-3 py-2" placeholder="SKU (if any)" value={form.preferredSKU} onChange={(e)=>update("preferredSKU", e.target.value)} />
          </div>
          <p className="text-xs text-gray-500 mt-2">Not: Mockup için oda/alan fotoğrafı eklemeniz önerilir.</p>
        </div>
        <div>
          <label className="block text-sm font-medium">Message / Requirements *</label>
          <textarea className="w-full rounded-xl border px-3 py-2" rows={4} value={form.message} onChange={(e)=>update("message", e.target.value)} required placeholder="Measurements, palette, deadline, usage (living room, lobby), etc." />
        </div>
        <div>
          <label className="block text-sm font-medium">Upload files (room photo, plan, moodboard) — optional</label>
          <input id="designer-files" name="files" type="file" accept="image/*,.pdf" multiple onChange={onFileChange} className="block w-full text-sm" />
          <p className="text-xs text-gray-500 mt-1">Max 5 files • up to 10MB each</p>
        </div>
        <button type="submit" disabled={sending} className="w-full md:w-auto px-5 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-50">
          {sending ? "Sending…" : "Request Designer Access"}
        </button>
        {msg && (
          <p className={`text-sm mt-2 ${msg.type === "ok" ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>
        )}
      </form>
    </section>
  );
}

