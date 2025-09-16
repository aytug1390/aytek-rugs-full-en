"use client";
import { useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";

export default function MapClient() {
  const ref = useRef(null);
  const initialized = useRef(false); // StrictMode çift-mount koruması
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (!ref.current || !apiKey) return;

    const loader = new Loader({ apiKey, version: "weekly" });

    const mapOptions = {
      center: { lat: 40.8401, lng: -74.0907 },
      zoom: 16,
      ...(mapId ? { mapId } : {}),
    };

    let map;
    let marker;

    loader
      .importLibrary("maps")
      .then((maps) => {
        map = new maps.Map(ref.current, mapOptions);
        return loader.importLibrary("marker");
      })
      .then((markerLib) => {
        try {
          const { AdvancedMarkerElement } = markerLib;
          marker = new AdvancedMarkerElement({
            position: { lat: 40.8401, lng: -74.0907 },
            map,
            title: "Aytek Rugs, 711 Route 17 North, Carlstadt, NJ 07072",
          });
        } catch {
           
          marker = new window.google.maps.Marker({
            position: { lat: 40.8401, lng: -74.0907 },
            map,
            title: "Aytek Rugs, 711 Route 17 North, Carlstadt, NJ 07072",
          });
        }
      })
      .catch((err) => {
        console.error("Google Maps failed to load", err);
      });

    return () => {
      try {
        if (marker && typeof marker.setMap === "function") marker.setMap(null);
      } catch {}
    };
  }, [apiKey, mapId]);

  if (!apiKey) {
    return (
      <div className="w-full h-[250px] rounded-lg bg-gray-800 flex items-center justify-center text-red-400">
        Google Maps API key not set in .env.local
      </div>
    );
  }

  return <div ref={ref} className="w-full h-[250px] rounded-lg bg-gray-800" />;
}

