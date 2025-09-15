import React, { useEffect, useMemo, useState } from "react";

const API =
  process.env.NEXT_PUBLIC_ADMIN_API ||
  process.env.REACT_APP_ADMIN_API ||
  "/admin-api";

export default function ReviewSection({ productId, pageSize = 5 }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const pages = useMemo(() => Math.max(Math.ceil(total / pageSize), 1), [total, pageSize]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    rating: 5,
    comment: "",
    website: "", // honeypot (boş kalmalı)
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  // fetch list
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const u = new URL(`${API}/reviews`);
        u.searchParams.set("product_id", productId);
        u.searchParams.set("page", String(page));
        u.searchParams.set("limit", String(pageSize));
        // onaylıları getiriyor (default)
        const res = await fetch(u.toString());
        const data = await res.json();
        if (!abort) {
          setItems(data.items || []);
          setTotal(data.total || 0);
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      abort = true;
    };
  }, [productId, page, pageSize]);

  // fetch average
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const u = new URL(`${API}/reviews/avg`);
        u.searchParams.set("product_id", productId);
        const res = await fetch(u.toString());
        const data = await res.json();
        if (!abort) {
          setAvg(Number(data.avg || 0));
          setCount(Number(data.count || 0));
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      abort = true;
    };
  }, [productId]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!form.name.trim() || !form.comment.trim()) {
      setMsg("Please fill in your name and comment.");
      return;
    }
    const ratingNum = Number(form.rating);
    if (ratingNum < 1 || ratingNum > 5) {
      setMsg("Rating must be between 1 and 5.");
      return;
    }
    // honeypot doluysa gönderme
    if (form.website && form.website.trim().length > 0) {
      setMsg("Spam detected.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          rating: ratingNum,
          comment: form.comment.trim(),
          name: form.name.trim(),
          email: form.email.trim(),
          // is_approved sunucuda default; formdan göndermiyoruz
          website: form.website, // backend honeypot kontrol edebilir
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to submit review");
      }
      setMsg("Thanks! Your review was received and will appear after approval.");
      // formu sıfırla
      setForm({ name: "", email: "", rating: 5, comment: "", website: "" });
      // ortalamayı ve listeyi tazele
      setPage(1);
      // küçük gecikme olmadan tekrar çek
      const [l1, a1] = await Promise.all([
        fetch(`${API}/reviews?product_id=${encodeURIComponent(productId)}&page=1&limit=${pageSize}`).then(r=>r.json()),
        fetch(`${API}/reviews/avg?product_id=${encodeURIComponent(productId)}`).then(r=>r.json())
      ]);
      setItems(l1.items || []);
      setTotal(l1.total || 0);
      setAvg(Number(a1.avg || 0));
      setCount(Number(a1.count || 0));
    } catch (err) {
      console.error(err);
      setMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="reviews">
      {/* Header / Average */}
      <div className="reviews-header flex justify-between items-center gap-3 my-6">
        <h3 className="m-0">Customer Reviews</h3>
        <div aria-label="Average rating">
          <strong>{avg.toFixed(1)}</strong> / 5 · {count} review{count === 1 ? "" : "s"}
        </div>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="py-3">There are no reviews yet.</div>
      ) : (
        <ul className="list-none p-0 m-0 grid gap-3">
          {items.map((r) => (
            <li key={r._id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <strong>{r.name}</strong>
                <span title={`Rated ${r.rating} out of 5`}>⭐ {r.rating}/5</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap">{r.comment}</p>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex gap-2 mt-3">
          <button type="button" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button>
          <span>Page {page} / {pages}</span>
          <button type="button" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>Next</button>
        </div>
      )}

      {/* Divider */}
  <hr className="my-6" />

      {/* Form */}
      <form onSubmit={onSubmit} className="grid gap-3 max-w-[560px]">
        <h4 className="m-0 mb-1">Write a review</h4>
        <div className="grid grid-cols-2 gap-3">
          <input name="name" placeholder="Your name *" value={form.name} onChange={onChange} required className="p-2 border rounded" />
          <input type="email" name="email" placeholder="Email (optional)" value={form.email} onChange={onChange} className="p-2 border rounded" />
        </div>
        <div className="grid grid-cols-[1fr,3fr] gap-3">
          <select name="rating" value={form.rating} onChange={onChange} aria-label="Rating" className="p-2 border rounded">
            {[5,4,3,2,1].map(v=> <option key={v} value={v}>{v} ★</option>)}
          </select>
          <textarea name="comment" placeholder="Your comment *" value={form.comment} onChange={onChange} rows={4} required className="p-2 border rounded" />
        </div>

        {/* Honeypot – visually hidden */}
        <input name="website" value={form.website} onChange={onChange} tabIndex={-1} autoComplete="off" className="sr-only" />

        <button type="submit" disabled={submitting} className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
          {submitting ? "Sending..." : "Submit review"}
        </button>

        {msg && <div role="status" className={msg.startsWith("Thanks") ? 'text-green-600' : 'text-red-600'}>{msg}</div>}
        <small>Reviews may be moderated before appearing publicly.</small>
      </form>
    </section>
  );
}


