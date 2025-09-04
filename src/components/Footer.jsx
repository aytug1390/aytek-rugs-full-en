import React from "react";
import Link from "next/link";
import MapClient from "./MapClient";

const quickLinks = [
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/rugs", label: "All Rugs" },
  { href: "/contact", label: "Contact" },
];

const socialLinks = [
  { href: "https://facebook.com/aytekrugs", icon: "fab fa-facebook", label: "Facebook" },
  { href: "https://instagram.com/aytekrugs", icon: "fab fa-instagram", label: "Instagram" },
  { href: "https://wa.me/12015547202", icon: "fab fa-whatsapp", label: "WhatsApp" },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-200 py-10 border-t mt-10 outline outline-2 outline-emerald-400">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-8">
        {/* Policies Block for GMC */}
        <div>
          <div className="font-semibold">Policies</div>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li><Link href="/privacy-policy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
            <li><Link href="/returns">Returns & Refunds</Link></li>
            <li><Link href="/shipping">Shipping & Delivery</Link></li>
            <li><Link href="/warranty-repairs">Warranty & Repairs</Link></li>
            <li><Link href="/cookie-policy">Cookie Policy</Link></li>
            <li><Link href="/cookie-settings">Cookie Settings</Link></li>
            <li><Link href="/do-not-sell">Do Not Sell/Share</Link></li>
            <li><Link href="/accessibility">Accessibility</Link></li>
          </ul>
        </div>
        {/* Logo & About */}
        <div>
          <h2 className="text-xl font-bold mb-4">Aytek Rugs</h2>
          <p className="text-sm">
            Luxury Handmade Rugs – Antique, Silk, Tribal, Modern & Kilim.  
            Serving customers worldwide with unique, one-of-a-kind pieces.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="hover:text-yellow-400">{link.label}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-semibold mb-4">Contact</h3>
          <p className="text-sm">711 Route 17 North, Carlstadt, NJ 07072</p>
          <p className="text-sm">Mon–Sat: 10AM–6PM | Sunday Closed</p>
          <p className="text-sm">
            Phone: <a href="tel:+12015547202" className="hover:text-yellow-400">(201) 554-7202</a>
          </p>
          <p className="text-sm">
            Email: <a href="mailto:info@aytekrugs.com" className="hover:text-yellow-400">info@aytekrugs.com</a>
          </p>
        </div>

        {/* Interactive Google Map (moved to client component) */}
        <div className="flex flex-col items-center justify-center">
          <h3 className="font-semibold mb-4">Find Us</h3>
          <div className="w-full flex flex-col items-center justify-center">
            <MapClient />
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=711+Route+17+North%2C+Carlstadt%2C+NJ+07072"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-white font-semibold shadow hover:bg-emerald-700"
            >
              Get Directions
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center text-sm text-gray-400 mt-8 border-t border-gray-700 pt-4">
        © {new Date().getFullYear()} Aytek Rugs Inc. — Carlstadt, NJ
      </div>
    </footer>
  );
}