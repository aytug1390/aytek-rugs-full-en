"use client";
import React from "react";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form method="POST" action="/api/admin-login" className="w-full max-w-sm p-6 rounded-2xl shadow bg-white">
        <h1 className="text-xl font-semibold mb-4">Admin Login</h1>
        <input
          name="password"
          type="password"
          placeholder="Admin password"
          required
          className="w-full border rounded-md p-2"
        />
        <button className="mt-4 w-full rounded-md border px-4 py-2">Sign in</button>
      </form>
    </div>
  );
}
