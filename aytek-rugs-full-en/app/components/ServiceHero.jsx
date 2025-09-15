import React from "react";

/**
 * Generic service hero banner.
 * Props:
 *  - title: string
 *  - description: string (supports plain text)
 *  - image: background image path (public/ relative URL)
 *  - overlayOpacity: 0-100 (default 60)
 *  - height: tailwind h-* class or custom (default h-[400px])
 */
export default function ServiceHero({
  title,
  description,
  image = "/images/services/rug-cleaning/hero.png",
  overlayOpacity = 50,
  height = "h-[400px]",
  className = "",
}) {
  const opacity = Math.min(100, Math.max(0, overlayOpacity));
  return (
    <div
      className={[
        "relative bg-hero flex items-center justify-center text-center text-white",
        height,
        className,
      ].filter(Boolean).join(" ")}
      style={{ ['--hero-image']: `url('${image}')` }}
    >
      <div
        className="absolute inset-0 hero-overlay"
        style={{ ['--overlay-opacity']: String(opacity / 100) }}
        aria-hidden="true"
      />
      <div className="relative z-10 px-6 py-10 max-w-4xl">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">{title}</h1>
        {description && (
          <p className="text-base md:text-lg text-gray-100 leading-relaxed whitespace-pre-line">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

