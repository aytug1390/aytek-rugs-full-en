"use client";

import Link from "next/link";
import Image from 'next/image';
import NavDropdown from "./nav/NavDropdown";

export default function Navbar() {

  const servicesMenu = [
    { label: "Professional Cleaning", href: "/services#cleaning-form" },
    { label: "Repair & Restoration", href: "/services/rug-repair#repair-form" },
    { label: "Trade-In & Guaranteed Pricing", href: "/trade-in#tradein" },
    { label: "Certified Rug Identification", href: "/services/certification#identification" },
    { label: "Premium Rug Padding", href: "/services/rug-padding#padding" },
    { label: "Worldwide Shipping", href: "/services/shipping#shipping" },
  ];

  const aboutPolicies = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms" },
  { label: "Returns & Refunds", href: "/returns" },
  { label: "Shipping & Delivery", href: "/shipping" },
  { label: "Warranty & Repairs", href: "/warranty-repairs" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Cookie Settings", href: "/cookie-settings" },
  { label: "Do Not Sell/Share", href: "/do-not-sell" },
  { label: "Accessibility", href: "/accessibility" },
  ];

  return (
    <nav className="flex items-center gap-6 justify-center py-3 bg-white shadow border-b border-gray-100/60">
      {/* Logo sol tarafta */}
      <Link href="/" className="flex items-center gap-2 mr-6">
        <Image src="/images/aytek-logo.png" alt="Aytek Rugs Logo" width={32} height={32} className="inline-block" />
        <span className="font-bold text-base tracking-wide text-gray-800">Aytek Rugs</span>
      </Link>
      {/* Menü */}
      <div className="flex gap-4 items-center">
        <Link href="/" className="flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition text-blue-600">
          <span className="text-[0.95rem] leading-none">🏠</span>
          <span className="leading-none">HOME</span>
        </Link>
        <Link href="/all-rugs" className="flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition text-red-500">
          <span className="text-[0.95rem] leading-none">🧶</span>
          <span className="leading-none">ALL RUGS</span>
        </Link>
        <Link href="/trade-in" className="flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition text-green-500">
          <span className="text-[0.95rem] leading-none">🤝</span>
          <span className="leading-none">TRADE-IN</span>
        </Link>
        <Link href="/try-at-home" className="flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition text-sky-500">
          <span className="text-[0.95rem] leading-none">🚚</span>
          <span className="leading-none">TRY AT HOME</span>
        </Link>
        {/* Services dropdown */}
        <NavDropdown label="SERVICES" items={servicesMenu} />
        <Link href="/references" className="flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition text-purple-500">
          <span className="text-[0.95rem] leading-none">📖</span>
          <span className="leading-none">REFERENCES</span>
        </Link>
        <Link href="/designers" className="flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition text-pink-500">
          <span className="text-[0.95rem] leading-none">🎨</span>
          <span className="leading-none">FOR DESIGNERS</span>
        </Link>
        {/* About dropdown with policies */}
        <NavDropdown label="ABOUT" items={[{ label: "About Us", href: "/about" }, ...aboutPolicies]} />
        <Link href="/contact" className="flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition text-orange-500">
          <span className="text-[0.95rem] leading-none">📞</span>
          <span className="leading-none">CONTACT</span>
        </Link>
      </div>
    </nav>
  );
}


