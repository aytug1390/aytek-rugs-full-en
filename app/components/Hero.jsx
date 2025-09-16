"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSafeImgUrl } from "@/lib/imageUrl";
import Image from 'next/image';

// Slide içerikleri (eski tasarımdaki gibi başlık + alt başlık)
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

export default function Hero() {
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef(null);

  // Auto-play
  useEffect(() => {
    timeoutRef.current && clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 15000); // 15 saniye
    return () => clearTimeout(timeoutRef.current);
  }, [index]);

  return (
    <section className="relative w-full h-[600px] overflow-hidden" aria-label="Hero Slideshow">
      {/* Images stack */}
      {slides.map((s, i) => (
        <div key={s.image} className={`absolute inset-0 transition-opacity duration-1000 ${i === index ? 'opacity-100' : 'opacity-0'}`}>
          <Image
            src={getSafeImgUrl(s.image)}
            alt="Rug background"
            fill
            className={`${i === 1 ? 'object-[60%]' : 'object-center'} object-cover`}
            sizes="(max-width: 768px) 100vw, 100vw"
            onError={(e) => {
              // @ts-ignore - fallback handling on native element
              const t = e?.target;
              if (t && !t.dataset?.fallback && t.src?.includes('/hero-bg/')) {
                t.src = t.src.replace('/hero-bg/', '/bg/');
                t.dataset.fallback = '1';
              }
            }}
          />
        </div>
      ))}
      {/* Dark overlay */}
  <div className="absolute inset-0 bg-black/45" />

      {/* Text motion */}
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

      {/* Dots */}
      {/* Oklar ve Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
        <div className="flex gap-4 mb-2">
          <button
            aria-label="Previous slide"
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
            className="bg-white/80 hover:bg-white text-black rounded-full w-10 h-10 flex items-center justify-center shadow transition"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button
            aria-label="Next slide"
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

