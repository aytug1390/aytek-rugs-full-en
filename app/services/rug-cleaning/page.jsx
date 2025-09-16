
import Image from "next/image";
import ServiceHero from "../../components/ServiceHero";
import CleaningForm from "../../components/CleaningForm";
import getImgUrl, { getSafeImgUrl } from '@/lib/imageUrl';

export default function RugCleaningPage() {
  return (
    <>
      <ServiceHero
        title="Professional Rug Cleaning Across the United States"
        description={"Since 1988, Aytek Rugs has been America’s trusted expert in gentle, hand-wash rug cleaning. With nationwide door-to-door pickup and delivery, we preserve and protect your rugs — from antique heirlooms to delicate handmade treasures — restoring them to their original beauty."}
  image="/images/services/rug-cleaning/hero.png"
        overlayOpacity={50}
        height="h-[420px]"
      />
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Our Cleaning Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                img: "/images/services/rug-cleaning/step1.png",
                alt: "Dust Removal",
                title: "1. Dust Removal",
                text: "Each rug is gently dusted to remove deep-set dirt and debris without harming delicate fibers.",
              },
              {
                img: "/images/services/rug-cleaning/step2.png",
                alt: "Hand-Wash Cleaning",
                title: "2. Hand-Wash Cleaning",
                text: "Rugs are washed by hand using mild, eco-friendly detergents to protect natural colors and textures.",
              },
              {
                img: "/images/services/rug-cleaning/step3.png",
                alt: "Rinse & Drying",
                title: "3. Rinse & Drying",
                text: "Clean water rinsing followed by controlled drying to prevent shrinkage and maintain rug shape.",
              },
              {
                img: "/images/services/rug-cleaning/step4.png",
                alt: "Final Inspection",
                title: "4. Final Inspection",
                text: "Every rug undergoes quality checks before being returned to you, ensuring the highest standards of care.",
              },
            ].map((s) => (
              <div key={s.title} className="bg-white rounded-lg shadow p-6">
                    <img
                      src={getSafeImgUrl(s.img)}
                  alt={s.alt}
                  className="w-full h-48 object-cover rounded mb-4"
                  loading="lazy"
                />
                <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>

      <div className="bg-red-50 p-8 rounded-lg mt-16 shadow-md">
            <h2 className="text-2xl font-bold mb-4">Pet Stains &amp; Odor Removal</h2>
            <p className="text-gray-700 mb-4">
              We understand how pets are part of the family — but accidents happen. Our advanced hand-wash techniques
              neutralize odors and remove tough stains caused by pets, restoring freshness without harming your rug’s fibers.
            </p>
            <Image
        src="/images/services/rug-cleaning/petdamage.png"
              alt="Pet Damage Cleaning"
              width={1200}
              height={480}
              className="rounded-lg shadow object-cover w-full h-auto"
              priority
            />
          </div>
        </div>
      </section>
      <CleaningForm />
    </>
  );
}


