"use client";
import { LoadScript, GoogleMap, Marker } from "@react-google-maps/api"; // Marker kept as fallback

const quickLinks = [
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/rugs", label: "All Rugs" },
  { href: "/contact", label: "Contact" },
];

const socialLinks = [
  { href: "https://facebook.com/aytekrugs", label: "Facebook" },
  { href: "https://instagram.com/aytekrugs", label: "Instagram" },
  { href: "https://wa.me/12015547202", label: "WhatsApp" },
];

// Precise coordinates for 711 Route 17 North, Carlstadt, NJ 07072
const center = { lat: 40.84094, lng: -74.06585 };

export default function Footer() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  return (
    <footer className="bg-gray-900 text-gray-200 mt-16 pt-12">
      <div className="max-w-6xl mx-auto px-6 grid gap-10 md:grid-cols-4">
        <div>
          <h2 className="text-xl font-bold mb-4">Aytek Rugs</h2>
          <p className="text-sm leading-relaxed">
            Luxury Handmade Rugs – Antique, Silk, Tribal, Modern & Kilim. Serving customers worldwide with unique, one-of-a-kind pieces.
          </p>
          <div className="flex gap-3 mt-4">
            {socialLinks.map(s => (
              <a key={s.href} href={s.href} target="_blank" rel="noopener" className="text-sm hover:text-yellow-400">{s.label}</a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {quickLinks.map(l => (
                <li key={l.href}><a href={l.href} className="hover:text-yellow-400">{l.label}</a></li>
              ))}
            </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Contact</h3>
          <p className="text-sm">711 Route 17 North, Carlstadt, NJ 07072</p>
          <p className="text-sm">Mon–Sat: 10AM–6PM | Sunday Closed</p>
          <p className="text-sm">Phone: <a href="tel:+12015547202" className="hover:text-yellow-400">(201) 554-7202</a></p>
          <p className="text-sm">Email: <a href="mailto:info@aytekrugs.com" className="hover:text-yellow-400">info@aytekrugs.com</a></p>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Find Us</h3>
          <div className="rounded overflow-hidden h-[250px] bg-gray-800 text-xs flex items-center justify-center">
            {apiKey ? (
              <LoadScript googleMapsApiKey={apiKey} loadingElement={<div className="text-gray-400">Loading map...</div>}>
                <GoogleMap mapContainerStyle={{ width: "100%", height: "250px" }} center={center} zoom={15} options={{ disableDefaultUI: true, mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID }}>
                  {/* AdvancedMarkerElement (new API). If not available in lib version, fallback to standard Marker */}
                  <div
                    data-advanced-marker
                    data-lat={center.lat}
                    data-lng={center.lng}
                    style={{ position: 'absolute' }}
                  >
                    <div className="bg-yellow-500 text-gray-900 font-bold text-[11px] px-2 py-1 rounded shadow border border-yellow-300">
                      Aytek
                    </div>
                  </div>
                  <Marker position={center} title="Aytek Rugs - 711 Route 17 N" opacity={0} />
                </GoogleMap>
                <div className="mt-2 text-[11px] text-center text-gray-400">
                  <a className="hover:text-yellow-400" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=711+NJ-17+Carlstadt+NJ+07072">Open in Google Maps</a>
                </div>
              </LoadScript>
            ) : (
              <span className="px-4 text-center">Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to show map.</span>
            )}
          </div>
        </div>
      </div>
      <div className="text-center text-sm text-gray-400 mt-10 border-t border-gray-700 py-4">
        © {new Date().getFullYear()} Aytek Rugs Inc. — Carlstadt, NJ
      </div>
    </footer>
  );
}
