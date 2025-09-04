export const metadata = { title: "References | Aytek Rugs" };

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

export default function Page() {
	return (
		<main className="max-w-6xl mx-auto px-4 py-10">
			<h1 className="text-4xl font-bold mb-8 text-center">References</h1>
			<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
				{customers.map((customer, idx) => (
					<div key={idx} className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition">
						<a href={customer.img} target="_blank" rel="noopener noreferrer">
							<img
								src={customer.img}
								alt="Happy Customer"
								className="w-full h-64 object-cover rounded-lg mb-4 transform transition-transform duration-300 hover:scale-105 cursor-pointer"
							/>
						</a>
						<p className="text-gray-600 italic">{customer.message}</p>
					</div>
				))}
			</div>
		</main>
	);
}

