const customers = [
  { img: "/images/customers/customer1.jpg", message: "Thank you for choosing Aytek Rugs ❤️" },
  { img: "/images/customers/customer2.jpg", message: "Your home, our handmade touch 🧵" },
  { img: "/images/customers/customer3.jpg", message: "Grateful for our happy customers 🙏" },
  { img: "/images/customers/customer4.jpg", message: "Every rug has a story, glad it's in your home 🏡" },
  { img: "/images/customers/customer5.jpg", message: "Woven with tradition, delivered with love 💕" },
  { img: "/images/customers/customer6.jpg", message: "Elegance meets comfort ✨" },
  { img: "/images/customers/customer7.jpg", message: "A timeless piece for a timeless home ⏳" },
  { img: "/images/customers/customer8.jpg", message: "Proud to be part of your journey 🙌" },
];

export default function HappyCustomers() {
  return (
    <section id="happy-customers" className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold mb-8">Happy Customers</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {customers.map((customer, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition">
              <a href={customer.img} target="_blank" rel="noopener noreferrer">
                <img fetchPriority="high" loading="eager" decoding="async"
                  src={customer.img}
                  alt="Happy Customer"
                  className="w-full h-64 object-cover rounded-lg mb-4 transform transition-transform duration-300 hover:scale-105 cursor-pointer"
                />
              </a>
              <p className="text-gray-600 italic">{customer.message}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

