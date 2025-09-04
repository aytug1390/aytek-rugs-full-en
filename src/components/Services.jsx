import React from "react";
import { FaBroom, FaTools, FaHandshake, FaCertificate, FaGripLines, FaGlobe } from "react-icons/fa";

const services = [
	{
		title: "Professional Rug Cleaning",
		description:
			"Gentle hand-wash cleaning, especially for delicate handmade rugs.",
		icon: <FaBroom className="text-4xl text-red-600 mb-4" />,
		link: "/services/rug-cleaning",
	},
	{
		title: "Rug Repair & Restoration",
		description:
			"Expert craftsmanship restoring damaged rugs to their original beauty since 1988.",
		icon: <FaTools className="text-4xl text-red-600 mb-4" />,
		link: "/services/rug-repair",
	},
	{
		title: "Trade-In & Guaranteed Pricing",
		description:
			"Fair evaluations, guaranteed prices, and trusted rug trade-ins.",
		icon: <FaHandshake className="text-4xl text-red-600 mb-4" />,
		link: "/trade-in",
	},
	{
		title: "Certified Rug Identification",
		description:
			"Unique ID & authenticity certificate for every handmade rug.",
		icon: <FaCertificate className="text-4xl text-red-600 mb-4" />,
		link: "/services/certification",
	},
	{
		title: "Premium Rug Padding",
		description:
			"Anti-bacterial, durable, and non-slip padding for long rug life.",
		icon: <FaGripLines className="text-4xl text-red-600 mb-4" />,
		link: "/services/rug-padding",
	},
	{
		title: "Worldwide Shipping",
		description: "Safe and reliable international delivery for your rugs.",
		icon: <FaGlobe className="text-4xl text-red-600 mb-4" />,
		link: "/services/shipping",
	},
];

export default function Services() {
	return (
		<section className="py-16 bg-gray-50">
			<div className="max-w-6xl mx-auto px-6">
				<h2 className="text-4xl font-bold text-center mb-12">
					Our Services
				</h2>
				<div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
					{services.map((service, index) => (
						<a href={service.link} key={index}>
							<div className="cursor-pointer bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition text-center">
								{service.icon}
								<h3 className="text-xl font-semibold mb-2">
									{service.title}
								</h3>
								<p className="text-gray-600">{service.description}</p>
							</div>
						</a>
					))}
				</div>
			</div>
		</section>
	);
}