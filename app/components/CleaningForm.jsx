"use client";
import React, { useState } from "react";

const emptySize = { width: "", length: "", unit: "cm" };

export default function CleaningForm() {
  const [form, setForm] = useState({
    fullName: "",
    city: "",
    email: "",
    phone: "",
    sizes: [ { ...emptySize } ],
    notes: "",
    consent: true,
    files: [],
  });
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState(null);

  const onFileChange = (e) => {
    setForm((f) => ({ ...f, files: Array.from(e.target.files) }));
  };

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const updateSize = (idx, key, val) => {
    setForm((f) => {
      const sizes = [...f.sizes];
      sizes[idx] = { ...sizes[idx], [key]: val };
      return { ...f, sizes };
    });
  };

  const addSize = () =>
    setForm((f) => ({ ...f, sizes: [...f.sizes, { ...emptySize }] }));

  const removeSize = (idx) =>
    setForm((f) => ({ ...f, sizes: f.sizes.filter((_, i) => i !== idx) }));

  const validate = () => {
    if (!form.fullName.trim()) return "Name & Surname is required.";
    if (!form.city.trim()) return "City is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Valid email is required.";
    if (form.sizes.length === 0) return "Add at least one rug size.";
    for (const s of form.sizes) {
      if (!s.width || !s.length) return "Each size must include width & length.";
      if (Number(s.width) <= 0 || Number(s.length) <= 0)
        return "Sizes must be positive numbers.";
    }
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
    fd.append("city", form.city);
    fd.append("email", form.email);
    fd.append("phone", form.phone);
    fd.append("notes", form.notes);
    fd.append("consent", form.consent);
    fd.append("sizes", JSON.stringify(form.sizes));
    form.files.forEach((f, i) => fd.append("files", f));

    setSending(true);
    try {
      const res = await fetch("/api/service/cleaning", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setMsg({ type: "ok", text: "Thanks! Your request has been sent." });
      setForm({
        fullName: "", city: "", email: "", phone: "",
        sizes: [{ ...emptySize }], notes: "", consent: true, files: []
      });
    } catch (e2) {
      setMsg({ type: "error", text: e2.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="cleaning-form" className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6 mt-12">
      <h2 className="text-2xl font-bold mb-4">Request a Professional Rug Cleaning</h2>
      <p className="text-sm text-gray-500 mb-6">
        Fill out the form below to get a cleaning quote. We’ll reply by email.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name *</label>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="Name & Surname"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">City *</label>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="e.g., Carlstadt, NJ"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              className="w-full rounded-xl border px-3 py-2"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone (optional)</label>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+1 (201) 555-0123"
            />
          </div>
        </div>

        {/* Rug sizes */}
        <div className="border rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Rug Size(s)</h3>
            <button
              type="button"
              onClick={addSize}
              className="text-sm rounded-lg border px-3 py-1 hover:bg-gray-50"
            >
              + Add size
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {form.sizes.map((s, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  <label className="block text-xs font-medium mb-1">Width</label>
                  <input
                    type="number" min="0" step="0.01"
                    className="w-full rounded-xl border px-3 py-2"
                    value={s.width}
                    onChange={(e) => updateSize(idx, "width", e.target.value)}
                    placeholder="e.g., 200"
                    required
                  />
                </div>
                <div className="col-span-4">
                  <label className="block text-xs font-medium mb-1">Length</label>
                  <input
                    type="number" min="0" step="0.01"
                    className="w-full rounded-xl border px-3 py-2"
                    value={s.length}
                    onChange={(e) => updateSize(idx, "length", e.target.value)}
                    placeholder="e.g., 300"
                    required
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium mb-1">Unit</label>
                  <select
                    className="w-full rounded-xl border px-3 py-2"
                    value={s.unit}
                    onChange={(e) => updateSize(idx, "unit", e.target.value)}
                  >
                    <option value="cm">cm</option>
                    <option value="in">in</option>
                    <option value="ft">ft</option>
                    <option value="m">m</option>
                  </select>
                </div>
                <div className="col-span-1 flex justify-end">
                  {form.sizes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSize(idx)}
                      className="text-xs text-red-600 hover:underline"
                      aria-label="Remove size"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Rug Photo(s) *</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onFileChange}
            className="block w-full text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <textarea
            className="w-full rounded-xl border px-3 py-2"
            rows={4}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Stains, odors, pet accidents, wool/silk, pickup preferred, etc."
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="consent"
            type="checkbox"
            checked={form.consent}
            onChange={(e) => update("consent", e.target.checked)}
          />
          <label htmlFor="consent" className="text-sm">
            I agree to be contacted about my request.
          </label>
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full md:w-auto px-5 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send by Email"}
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

