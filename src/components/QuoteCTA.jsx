import { useEffect, useMemo, useState } from "react";

function Field({ label, children, required }) {
  return (
    <label className="block mb-3">
      <span className="block text-sm font-medium text-gray-700">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

// ...existing code...
export default function QuoteCTA({ label = "Free Rug Repair Quote (2 min)", variant = "A" }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    zip: "",
    service: "Repair",
    rugSize: "",
    issue: "",
    message: "",
    files: [],
    consent: true,
    utm: {},
  });

  // UTM yakala
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm = ["utm_source","utm_medium","utm_campaign","utm_term","utm_content"]
      .reduce((acc,k)=> (params.get(k) ? {...acc, [k]: params.get(k)} : acc), {});
    setForm(f => ({...f, utm}));
  }, []);

  const canNext = useMemo(() => {
    if (step === 1) return form.name && (form.phone || form.email) && form.zip;
    return form.service && form.rugSize && form.issue;
  }, [step, form]);

  function onFileChange(e) {
    const files = Array.from(e.target.files || []).slice(0, 5);
    setForm(f => ({ ...f, files }));
  }

  async function submit() {
    setLoading(true); setErr("");
    try {
      const fd = new FormData();
      Object.entries({
        name: form.name, phone: form.phone, email: form.email, zip: form.zip,
        service: form.service, rugSize: form.rugSize, issue: form.issue,
        message: form.message, consent: form.consent ? "1" : "0",
        utm: JSON.stringify(form.utm),
      }).forEach(([k,v]) => fd.append(k, v ?? ""));

      form.files.forEach((file, i) => fd.append("photos", file, file.name));

      const res = await fetch("/api/quotes", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Failed");
      setDone(true);
    } catch (e) {
      setErr("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // GA4 olayları (varsa gtag)
  function track(evt, data={}) {
    if (window.gtag) window.gtag("event", evt, data);
  }

  return (
    <>
      {/* Primary CTA */}
      <button
        onClick={() => { setOpen(true); track("quote_open"); }}
        className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-semibold text-white
                   bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg hover:shadow-xl
                   active:scale-[.98] focus:outline-none focus:ring-4 focus:ring-emerald-200"
      >
        <span>🧵</span>
        <span>Free Rug Repair Quote (2 min)</span>
      </button>

      {/* Sticky mobile mini CTA */}
      <div className="fixed inset-x-0 bottom-3 z-40 flex justify-center md:hidden">
        <button
          onClick={() => { setOpen(true); track("quote_open_mobile"); }}
          className="mx-4 w-full max-w-sm rounded-full bg-teal-600 px-5 py-3 text-white font-semibold shadow-lg"
        >
          Get a Free Quote
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            {!done ? (
              <>
                <div className="mb-5 flex items-center justify-between">
        <span>{label}</span>
                  <button onClick={() => setOpen(false)} className="text-2xl leading-none">×</button>
                </div>

                {/* Steps */}
                {step === 1 && (
                  <div>
                    <p className="mb-4 text-sm text-gray-600">No obligation • Same-day reply</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Full Name" required>
                        <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      </Field>
                      <Field label="Phone (for faster reply)">
                        <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      </Field>
                      <Field label="Email">
                        <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      </Field>
                      <Field label="ZIP Code" required>
                        <input value={form.zip} onChange={e=>setForm(f=>({...f,zip:e.target.value}))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      </Field>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Service Type" required>
                        <select value={form.service} onChange={e=>setForm(f=>({...f,service:e.target.value}))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500">
                          <option>Repair</option>
                          <option>Cleaning</option>
                          <option>Re-Weaving</option>
                          <option>Edge Binding</option>
                          <option>Color Restoration</option>
                          <option>Other</option>
                        </select>
                      </Field>
                      <Field label="Rug Size (e.g., 8x10 ft)" required>
                        <input value={form.rugSize} onChange={e=>setForm(f=>({...f,rugSize:e.target.value}))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      </Field>
                      <Field label="Main Issue (short)" required>
                        <input value={form.issue} onChange={e=>setForm(f=>({...f,issue:e.target.value}))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      </Field>
                      <Field label="Notes (optional)">
                        <textarea rows={3} value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      </Field>
                    </div>

                    <Field label="Photos (up to 5)">
                      <input type="file" multiple accept="image/*" onChange={onFileChange} />
                      {form.files?.length ? (
                        <p className="mt-1 text-xs text-gray-500">{form.files.length} photo(s) selected</p>
                      ) : <p className="mt-1 text-xs text-gray-400">Tip: Add 2-3 clear photos for faster quote.</p>}
                    </Field>

                    <label className="mt-2 flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.consent} onChange={e=>setForm(f=>({...f,consent:e.target.checked}))} />
                      I agree to be contacted about my quote.
                    </label>
                  </div>
                )}

                {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-xs text-gray-500">Secure • No obligation • Same-day reply</div>
                  <div className="flex gap-2">
                    {step > 1 && (
                      <button onClick={()=>setStep(s=>s-1)} className="rounded-lg px-4 py-2 text-sm font-semibold border">
                        Back
                      </button>
                    )}
                    {step < 2 && (
                      <button disabled={!canNext}
                        onClick={()=> setStep(2)} 
                        className={`rounded-lg px-4 py-2 text-sm font-semibold ${canNext ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                        Next
                      </button>
                    )}
                    {step === 2 && (
                      <button disabled={loading || !canNext}
                        onClick={()=> { track("generate_lead"); submit(); }}
                        className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                        {loading ? "Sending..." : "Get Quote"}
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">✅</div>
                <h3 className="text-xl font-bold mb-2">Thanks! We received your request.</h3>
                <p className="text-gray-600">We’ll reply the same day. If urgent, call us at 201-554-7202.</p>
                <button onClick={()=> setOpen(false)} className="mt-6 rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
