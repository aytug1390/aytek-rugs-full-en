"use client";
import { useEffect, useRef } from "react";

export default function MapClient() {
  const ref = useRef(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!ref.current || !apiKey) return;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.onload = () => {
      if (window.google) {
        const map = new window.google.maps.Map(ref.current, {
          center: { lat: 40.8401, lng: -74.0907 }, // 711 Route 17 North, Carlstadt, NJ 07072
          zoom: 16,
        });
        new window.google.maps.Marker({
          position: { lat: 40.8401, lng: -74.0907 },
          map,
          title: "Aytek Rugs, 711 Route 17 North, Carlstadt, NJ 07072"
        });
      }
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, [apiKey]);

  if (!apiKey) {
    return (
      <div className="w-full h-[250px] rounded-lg bg-gray-800 flex items-center justify-center text-red-400">
        Google Maps API key not set in .env.local
      </div>
    );
  }

  return (
    <div ref={ref} className="w-full h-[250px] rounded-lg bg-gray-800" />
  );
}
