// Simple, accessible hover/focus dropdown using Tailwind only
import React, { useState } from "react";
import Link from "next/link";

export default function NavDropdown({ label, items }) {
  const [open, setOpen] = useState(false);

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen((v) => !v);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div
      className="relative group"
      role="navigation"
      aria-label={label}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {/* Trigger */}
      { /* create a stable id for aria-controls */ }
      { /* label might contain spaces; sanitize to safe id */ }
      {
         
      }
      <button
        type="button"
        className="px-3 py-2 font-semibold hover:text-black/80 focus:outline-none"
        aria-haspopup="true"
        aria-expanded={open}
        tabIndex={0}
        aria-controls={`nav-${String(label || '').replace(/\s+/g, '-').replace(/[^a-z0-9-_]/gi, '').toLowerCase()}-menu`}
        onKeyDown={onKeyDown}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>

      {/* Menu: keep visual show/hide via CSS but ensure assistive tech sees correct state */}
      <div
        id={`nav-${String(label || '').replace(/\s+/g, '-').replace(/[^a-z0-9-_]/gi, '').toLowerCase()}-menu`}
        className={`
          invisible opacity-0 group-hover:visible group-hover:opacity-100
          group-focus-within:visible group-focus-within:opacity-100
          transition-opacity duration-150
          absolute left-0 top-full z-70 mt-2
          w-64 rounded-xl border bg-white shadow-xl
        `}
        aria-hidden={!open}
      >
        <ul className="py-2">
          {items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                className="block px-4 py-2 text-sm hover:bg-gray-50"
              >
                {it.label}
                {it.desc && <div className="text-xs text-gray-500">{it.desc}</div>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

