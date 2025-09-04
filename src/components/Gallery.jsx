export default function Gallery() {
  const gallery = [
    "/images/customer1.jpg",
    "/images/customer2.jpg",
    "/images/customer3.jpg",
    "/images/customer4.jpg",
  ];

  return (
    <section className="p-10 bg-gray-100">
      <h2 className="text-3xl font-bold text-center mb-6">Happy Customers</h2>
      <div className="grid md:grid-cols-4 gap-4">
        {gallery.map((src, i) => (
          <img key={i} src={src} alt="Customer Rug" className="w-full h-48 object-cover rounded-lg shadow" />
        ))}
      </div>
      <p className="text-center mt-6 text-lg">
        ❤️ Thank you for choosing Aytek Rugs ❤️
      </p>
    </section>
  );
}
