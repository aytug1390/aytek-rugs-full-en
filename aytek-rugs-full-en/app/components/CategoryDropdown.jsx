"use client";
import React from 'react';

export default function CategoryDropdown({ categories = [] }) {
  return (
    <div className="inline-block">
      <label htmlFor="category" className="sr-only">Filter by category</label>
      <select id="category" className="border rounded px-2 py-1 text-sm">
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}
