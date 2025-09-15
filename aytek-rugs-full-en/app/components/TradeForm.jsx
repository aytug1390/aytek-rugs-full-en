"use client";
import React, { useState } from "react";

export default function TradeForm() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    description: "",
    files: [],
  });
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState(null);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onFileChange = (e) => {
    update("files", Array.from(e.target.files));
  };

  const validate = () => {
    if (!form.fullName.trim()) return "Name & Surname is required.";
    if (!form.city.trim()) return "City is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Valid email is required.";
    if (!form.description.trim()) return "Please describe your rug and trade-in details.";
    if (form.files.length === 0) return "Please upload at least one rug photo.";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    const err = validate();
    if (err) { setMsg({ type: "error", text: err }); return; }

    const fd = new FormData();
    fd.append("fullName", form.fullName);
    fd.append("email", form.email);
    fd.append("phone", form.phone);
    fd.append("city", form.city);
    fd.append("description", form.description);
    form.files.forEach((f, i) => fd.append("files", f));

    setSending(true);
    try {
      const res = await fetch("/api/service/trade", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setMsg({ type: "ok", text: "Thanks! Your trade-in request has been sent." });
      setForm({
        fullName: "", email: "", phone: "", city: "", description: "", files: []
      });
    } catch (e2) {
      setMsg({ type: "error", text: e2.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="trade-form" className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6 mt-12">
      <h2 className="text-2xl font-bold mb-4">Request a Rug Trade-In</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="trade-fullName" className="block text-sm mb-1">Full Name *</label>
            <input
              id="trade-fullName"
              name="fullName"
              className="w-full rounded-xl border px-3 py-2"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="trade-city" className="block text-sm mb-1">City *</label>
            <input
              id="trade-city"
              name="city"
              className="w-full rounded-xl border px-3 py-2"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="trade-email" className="block text-sm mb-1">Email *</label>
            <input
              id="trade-email"
              name="email"
              type="email"
              className="w-full rounded-xl border px-3 py-2"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="trade-phone" className="block text-sm mb-1">Phone (optional)</label>
            <input
              id="trade-phone"
              name="phone"
              className="w-full rounded-xl border px-3 py-2"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="trade-files" className="block text-sm mb-1">Rug Photo(s) *</label>
          <input
            id="trade-files"
            name="files"
            type="file"
            accept="image/*"
            multiple
            onChange={onFileChange}
            className="block w-full text-sm"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Trade-In Details *</label>
          <textarea
            className="w-full rounded-xl border px-3 py-2"
            rows={4}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Describe your rug, condition, and trade-in expectations."
            required
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full md:w-auto px-5 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send Trade-In Request"}
        </button>

        {msg && (
          <p className={`text-sm mt-2 ${msg.type === "ok" ? "text-green-600" : "text-red-600"}`}>
            {msg.text}
          </p>
        )}
      </form>
    </section>
  );
}

