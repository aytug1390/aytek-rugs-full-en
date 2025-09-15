"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function NavbarClient({ items }) {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const roles = session?.user?.roles || session?.user?.role ? (session.user.roles || [session.user.role]) : [];
  // Menü kaynağını tespit et
  let source = 'file';
  if (Array.isArray(items) && items.length > 0) {
    // DEFAULT_MENU'da "For Designers" ve "About Us" gibi yeni eklenen label'lar varsa file, yoksa db
    const hasNewLabels = items.some(i => i.label === 'For Designers' || i.label === 'About Us' || i.label === 'Contact');
    source = hasNewLabels ? 'file' : 'db';
  }
  const filtered = items
    .filter(i => i.active !== false)
    .filter(i => !i.roles || i.roles.length === 0 || i.roles.some(r => roles.includes(r)))
    .filter(i => i.label !== "Rug Cleaning" && i.label !== "Rug Repair")
    .sort((a,b)=>a.order - b.order);

  // Our Services dropdown içeriği
  const servicesDropdown = [
    {
      href: "/services/rug-cleaning",
      icon: "🧹",
      label: "Professional Rug Cleaning",
      desc: "Gentle hand-wash cleaning, especially for delicate handmade rugs."
    },
    {
      href: "/services/rug-repair",
      icon: "🛠️",
      label: "Rug Repair & Restoration",
      desc: "Expert craftsmanship restoring damaged rugs to their original beauty since 1988."
    },
    {
      href: "/trade-in",
      icon: "🤝",
      label: "Trade-In & Guaranteed Pricing",
      desc: "Fair evaluations, guaranteed prices, and trusted rug trade-ins."
    },
    {
      href: "/services/certification",
      icon: "📜",
      label: "Certified Rug Identification",
      desc: "Unique ID & authenticity certificate for every handmade rug."
    },
    {
      href: "/services/rug-padding",
      icon: "➖",
      label: "Premium Rug Padding",
      desc: "Anti-bacterial, durable, and non-slip padding for long rug life."
    },
    {
      href: "/services/shipping",
      icon: "🌍",
      label: "Worldwide Shipping",
      desc: "Safe and reliable international delivery for your rugs."
    },
  ];

  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-80 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/aytek-logo.png" alt="Aytek Rugs Logo" width={44} height={44} />
          <span className="font-bold text-lg tracking-wide">Aytek Rugs</span>
        </Link>
        {/* Menü kaynağı badge'i */}
        <span className="text-xs opacity-60 ml-4">menu:{source}</span>
        <ul className="hidden md:flex gap-8 font-medium text-gray-700">
          {filtered.map(l => {
            if (l.label === "Services") {
              return (
                <li key={l.href} className="relative group" onMouseEnter={() => setDropdownOpen(true)} onMouseLeave={() => setDropdownOpen(false)}>
                  <button type="button" className="hover:text-amber-600 transition-colors flex items-center gap-1" onClick={() => setDropdownOpen(!dropdownOpen)}>
                    Services <span>▼</span>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute left-0 mt-2 w-80 bg-white shadow-lg rounded-lg z-20">
                      <ul className="py-2">
                        {servicesDropdown.map(s => (
                          <li key={s.href}>
                            <Link href={s.href} className="flex items-start gap-2 px-4 py-3 hover:bg-gray-100">
                              <span className="text-2xl">{s.icon}</span>
                              <span>
                                <span className="font-semibold">{s.label}</span>
                                <br />
                                <span className="text-xs text-gray-500">{s.desc}</span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            }
            // Diğer menü item'ları
            return (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-amber-600 transition-colors">
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="md:hidden text-3xl leading-none focus:outline-none"
          aria-label="Open menu"
        >
          ☰
        </button>
      </div>
      {/* Mobil menüde dropdown eklenmedi, istersen ekleyebilirim */}
      {open && (
        <div className="fixed inset-0 z-70 flex" role="dialog" aria-modal="true">
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
          <div className="w-72 bg-white h-full shadow-xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="font-semibold text-lg">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="text-2xl text-gray-500 hover:text-gray-800"
              >
                ×
              </button>
            </div>
            <ul className="space-y-4">
              {filtered.map(l => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block text-gray-700 text-lg hover:text-amber-600"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-6 text-xs text-gray-400">
              © {new Date().getFullYear()} Aytek Rugs
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

