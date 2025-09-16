"use client";
import React from "react";

export default function AdminLoginPage() {
  const [csrf, setCsrf] = React.useState("");

  React.useEffect(() => {
    let mounted = true;
    fetch('/api/admin-login', { credentials: 'same-origin' }).then(r => r.json()).then(j => { if (mounted && j?.csrf) setCsrf(j.csrf); }).catch(() => {});
    return () => { mounted = false; };
  }, []);
  async function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    // ensure csrf is present
    form.set('csrf', csrf || '');
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        body: new URLSearchParams(Object.fromEntries(form)),
        credentials: 'same-origin',
        redirect: 'manual',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      if (res.status === 302) {
        // successfully logged in, follow redirect to /admin
        window.location.href = '/admin';
        return;
      }
      if (res.ok) {
        window.location.href = '/admin';
        return;
      }
      const text = await res.text();
      alert('Login failed: ' + (text || res.status));
    } catch (err) {
      console.error('Login error', err);
      alert('Login error');
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-6 rounded-2xl shadow bg-white">
        <h1 className="text-xl font-semibold mb-4">Admin Login (admin-app)</h1>
        <input
          name="password"
          type="password"
          placeholder="Admin password"
          required
          className="w-full border rounded-md p-2"
        />
        <input type="hidden" name="csrf" value={csrf} />
        <button type="submit" className="mt-4 w-full rounded-md border px-4 py-2">Sign in</button>
      </form>
    </div>
  );
}
