import React from "react";
import { Slide } from "react-slideshow-image";
import "react-slideshow-image/dist/styles.css";

const slides = [
  {
  image: "/images/hero-bg/hero1.png",
    title: "Where Tradition Meets Timeless Elegance",
    subtitle:
      "Handwoven Turkish rugs that bring centuries of craftsmanship into your modern home.",
  },
  {
  image: "/images/hero-bg/hero2.png",
    title: "Transform Your Space with Authentic Luxury",
    subtitle:
      "Each piece is more than a rug—it’s a statement of culture, artistry, and comfort.",
  },
  {
  image: "/images/hero-bg/hero3.png",
    title: "Crafted for Today, Inspired by History",
    subtitle:
      "Blending 80% Turkish heritage with 20% global design for a truly unique experience.",
  },
];

export default function Hero() {
  return (
    <section className="relative w-full h-[600px]">
      <Slide autoplay={true} duration={5000} transitionDuration={800}>
        {slides.map((slide, index) => (
          <div
            key={index}
            className="relative w-full h-[600px] flex items-center justify-center"
          >
            {/* Background image */}
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-40" />

            {/* Text */}
            <div className="relative z-10 text-center text-white max-w-3xl px-6">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
                {slide.title}
              </h1>
              <p className="text-lg md:text-xl drop-shadow-md">
                {slide.subtitle}
              </p>
            </div>
          </div>
        ))}
      </Slide>
    </section>
  );
}