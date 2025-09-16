// Simple, accessible hover/focus dropdown using Tailwind only
import React from "react";
import Link from "next/link";

export default function NavDropdown({ label, items }) {
  return (
    <div
      className="relative group"
      role="navigation"
      aria-label={label}
    >
      {/* Trigger */}
      <button
        className="px-3 py-2 font-semibold hover:text-black/80 focus:outline-none"
        aria-haspopup="true"
        aria-expanded="false"
        tabIndex={0}
      >
        {label}
      </button>

      {/* Menu */}
      <div
        className="
          invisible opacity-0 group-hover:visible group-hover:opacity-100
          group-focus-within:visible group-focus-within:opacity-100
          transition-opacity duration-150
          absolute left-0 top-full z-50 mt-2
          w-64 rounded-xl border bg-white shadow-xl
        "
      >
        <ul className="py-2">
          {items.map((it) => (
            <li key={it.href}>
              {/* Link olabilir: route, hash veya dış link */}
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

