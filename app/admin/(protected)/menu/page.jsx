"use client";
import useSWR from 'swr';
import { useState } from 'react';

const fetcher = url => fetch(url).then(r => r.json());

export default function MenuAdminPage() {
  const { data: menus, mutate } = useSWR('/api/menu', fetcher);
  const [form, setForm] = useState({ label: '', href: '', order: 0, roles: '' });

  async function addMenu() {
    if (!form.label || !form.href) return;
    await fetch('/api/menu', { method: 'POST', body: JSON.stringify(form) });
  setForm({ label: '', href: '', order: 0, roles: '' });
    mutate();
  }

  async function removeMenu(id) {
    await fetch(`/api/menu/${id}`, { method: 'DELETE' });
    mutate();
  }

  async function toggleActive(m) {
    await fetch(`/api/menu/${m._id}`, { method: 'PUT', body: JSON.stringify({ active: !m.active }) });
    mutate();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Navbar</h1>

      <div className="flex flex-wrap gap-2 mb-8 items-end">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide">Label</label>
          <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} className="border px-2 py-1 rounded" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide">Href</label>
          <input value={form.href} onChange={e => setForm(f => ({ ...f, href: e.target.value }))} className="border px-2 py-1 rounded" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide">Order</label>
          <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} className="border px-2 py-1 rounded w-24" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide">Roles (comma)</label>
          <input value={form.roles} onChange={e => setForm(f => ({ ...f, roles: e.target.value }))} placeholder="admin,editor" className="border px-2 py-1 rounded" />
        </div>
        <button onClick={addMenu} className="bg-green-600 text-white px-4 py-2 rounded">Add</button>
      </div>

      <ul className="space-y-2">
        {menus?.map(m => (
          <li key={m._id} className="flex items-center justify-between bg-white border rounded p-3">
            <div>
              <span className="font-medium">{m.label}</span>
              <span className="text-gray-400 text-sm ml-2">{m.href}</span>
              <span className="text-xs text-gray-400 ml-2">(order {m.order})</span>
              {m.roles?.length ? <span className="text-xs ml-2 text-purple-600">[{m.roles.join(', ')}]</span> : null}
              {!m.active && <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded">inactive</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleActive(m)} className="px-3 py-1 text-xs rounded bg-indigo-600 text-white">
                {m.active ? 'Disable' : 'Enable'}
              </button>
              <button onClick={() => removeMenu(m._id)} className="px-3 py-1 text-xs rounded bg-red-600 text-white">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

