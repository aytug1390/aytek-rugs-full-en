export default function Categories() {
  const categories = [
    { name: "Antique Rugs", img: "/images/cat-antique.jpg" },
    { name: "Anatolian Rugs", img: "/images/cat-anatolian.jpg" },
    { name: "Silk Rugs", img: "/images/cat-silk.jpg" },
    { name: "Kilim Collection", img: "/images/cat-kilim.jpg" },
    { name: "Patchwork Rugs", img: "/images/cat-patchwork.jpg" },
    { name: "Modern Rugs", img: "/images/cat-modern.jpg" },
  ];

  return (
    <section className="p-10 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">Explore Our Collections</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {categories.map((cat, i) => (
          <div key={i} className="bg-white rounded shadow hover:shadow-lg transition">
            <img src={cat.img} alt={cat.name} className="w-full h-48 object-cover rounded-t" />
            <h3 className="p-4 text-lg font-semibold">{cat.name}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}

