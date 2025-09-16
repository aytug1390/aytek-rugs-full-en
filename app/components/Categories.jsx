import Image from 'next/image';
import { getSafeImgUrl } from '@/lib/imageUrl';

export default function Categories() {
  // Fallback images (existing in repo) until real category images are added
  const placeholders = [
    "/images/hero-bg/hero1.png",
    "/images/hero-bg/hero2.png",
    "/images/hero-bg/hero3.png",
    "/images/customers/customer1.jpg",
    "/images/customers/customer2.jpg",
    "/images/customers/customer3.jpg",
  ];
  const categories = [
    { name: "Antique Rugs", img: placeholders[0] },
    { name: "Anatolian Rugs", img: placeholders[1] },
    { name: "Silk Rugs", img: placeholders[2] },
    { name: "Kilim Collection", img: placeholders[3] },
    { name: "Patchwork Rugs", img: placeholders[4] },
    { name: "Modern Rugs", img: placeholders[5] },
  ];
  return (
    <section className="p-10 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">Explore Our Collections</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {categories.map((cat, i) => (
          <div key={i} className="bg-white rounded shadow hover:shadow-lg transition">
            <div className="relative w-full h-48 rounded-t overflow-hidden">
              <Image src={getSafeImgUrl(cat.img)} alt={cat.name} fill className="object-cover" />
            </div>
            <h3 className="p-4 text-lg font-semibold">{cat.name}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}

