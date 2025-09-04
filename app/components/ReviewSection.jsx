import React, { useEffect, useMemo, useState } from "react";

const API =
  process.env.NEXT_PUBLIC_ADMIN_API ||
  process.env.REACT_APP_ADMIN_API ||
  "http://localhost:5000/admin-api";

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
      <div className="reviews-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,margin:"24px 0"}}>
        <h3 style={{margin:0}}>Customer Reviews</h3>
        <div aria-label="Average rating">
          <strong>{avg.toFixed(1)}</strong> / 5 · {count} review{count === 1 ? "" : "s"}
        </div>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div style={{padding:"12px 0"}}>There are no reviews yet.</div>
      ) : (
        <ul style={{listStyle:"none",padding:0,margin:0,display:"grid",gap:12}}>
          {items.map((r) => (
            <li key={r._id} style={{border:"1px solid #eee",borderRadius:10,padding:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <strong>{r.name}</strong>
                <span title={`Rated ${r.rating} out of 5`}>⭐ {r.rating}/5</span>
              </div>
              <p style={{margin:"8px 0 0 0",whiteSpace:"pre-wrap"}}>{r.comment}</p>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button>
          <span>Page {page} / {pages}</span>
          <button disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>Next</button>
        </div>
      )}

      {/* Divider */}
      <hr style={{margin:"24px 0"}} />

      {/* Form */}
      <form onSubmit={onSubmit} style={{display:"grid",gap:12,maxWidth:560}}>
        <h4 style={{margin:"0 0 4px"}}>Write a review</h4>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <input name="name" placeholder="Your name *" value={form.name} onChange={onChange} required />
          <input type="email" name="email" placeholder="Email (optional)" value={form.email} onChange={onChange} />
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 3fr",gap:12}}>
          <select name="rating" value={form.rating} onChange={onChange} aria-label="Rating">
            {[5,4,3,2,1].map(v=> <option key={v} value={v}>{v} ★</option>)}
          </select>
          <textarea name="comment" placeholder="Your comment *" value={form.comment} onChange={onChange} rows={4} required />
        </div>

        {/* Honeypot – gizle (CSS ile display:none yapabilirsin) */}
        <input name="website" value={form.website} onChange={onChange} tabIndex={-1} autoComplete="off" style={{position:"absolute",left:"-9999px"}} />

        <button type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Submit review"}
        </button>

        {msg && <div role="status" style={{color: msg.startsWith("Thanks") ? "green" : "crimson"}}>{msg}</div>}
        <small>Reviews may be moderated before appearing publicly.</small>
      </form>
    </section>
  );
}

