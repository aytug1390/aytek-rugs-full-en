"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Use hero images from public/images/bg as requested
const slides = [
  {
    image: "/images/bg/hero1.png",
    title: "Where Tradition Meets Timeless Elegance",
    subtitle:
      "Handwoven Turkish rugs that bring centuries of craftsmanship into your modern home.",
  },
  {
    image: "/images/bg/hero2.png",
    title: "Transform Your Space with Authentic Luxury",
    subtitle:
      "Each piece is more than a rug—it’s a statement of culture, artistry, and comfort.",
  },
  {
    image: "/images/bg/hero3.png",
    title: "Crafted for Today, Inspired by History",
    subtitle:
      "Blending 80% Turkish heritage with 20% global design for a truly unique experience.",
  },
];

function HeroSingle({ title, subtitle, background, cta } = {}) {
  const bg = background?.src || slides[0].image;
  const heading = title || slides[0].title;
  const sub = subtitle || slides[0].subtitle;
  return (
    <section className="relative w-full h-[600px] overflow-hidden" aria-label="Hero">
      <motion.img
        src={bg}
        alt={heading || "Rug background"}
        className={`absolute inset-0 w-full h-full object-cover rounded-3xl`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        loading="eager"
        decoding="async"
      />

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-black/25 to-black/50" />

      <div className="relative z-10 flex items-center justify-center h-full px-6 text-center text-white">
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight drop-shadow-lg">{heading}</h1>
          {sub && <p className="text-lg md:text-xl mb-8 leading-relaxed drop-shadow">{sub}</p>}
          {cta && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={cta.href || "/services"} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-2xl shadow-lg transition">{cta.label || 'Explore'}</a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function HeroSlideshow() {
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    timeoutRef.current && clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 10000); // 10 seconds per slide
    return () => clearTimeout(timeoutRef.current);
  }, [index]);

  return (
    <section className="relative w-full h-[600px] overflow-hidden" aria-label="Hero Slideshow">
      <motion.img
        key={slides[index].image}
        src={slides[index].image}
        alt={slides[index].title || "Rug background"}
        className={`absolute inset-0 w-full h-full object-cover rounded-3xl`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        loading="eager"
        decoding="async"
      />

      <img src={slides[(index + 1) % slides.length].image} alt="" className="hidden" />

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-black/25 to-black/50" />

      <div className="relative z-10 flex items-center justify-center h-full px-6 text-center text-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={slides[index].title}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight drop-shadow-lg">
              {slides[index].title}
            </h1>
            <p className="text-lg md:text-xl mb-8 leading-relaxed drop-shadow">
              {slides[index].subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/services"
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-2xl shadow-lg transition"
              >
                Explore Services
              </a>
              <a
                href="/contact"
                className="bg-white/90 hover:bg-white text-black font-semibold py-3 px-8 rounded-2xl shadow-lg transition"
              >
                Get a Free Quote
              </a>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
        <div className="flex gap-4 mb-2">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
            className="bg-white/80 hover:bg-white text-black rounded-full w-10 h-10 flex items-center justify-center shadow transition"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
            className="bg-white/80 hover:bg-white text-black rounded-full w-10 h-10 flex items-center justify-center shadow transition"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
          </button>
        </div>
        <div className="flex gap-3">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`w-3 h-3 rounded-full transition-all ${
                i === index ? "bg-white scale-110" : "bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Hero(props) {
  const { title, subtitle, background, cta } = props || {};
  const singleMode = Boolean(title || subtitle || background);
  if (singleMode) return <HeroSingle title={title} subtitle={subtitle} background={background} cta={cta} />;
  return <HeroSlideshow />;
}

