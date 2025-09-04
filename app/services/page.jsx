
"use client";

import { LuBrush, LuWrench, LuBadgeDollarSign, LuBadgeCheck, LuGripHorizontal, LuPlane } from "react-icons/lu";
import CleaningForm from "@/app/components/CleaningForm";
import Link from "next/link";

const services = [
	{ title: "Professional Rug Cleaning", description: "Gentle hand-wash cleaning, especially for delicate handmade rugs.", icon: <LuBrush className="text-4xl text-emerald-600 mb-4" />, link: "/services/rug-cleaning", button: "Request Cleaning" },
	{ title: "Rug Repair & Restoration", description: "Expert craftsmanship restoring damaged rugs to their original beauty since 1988.", icon: <LuWrench className="text-4xl text-blue-600 mb-4" />, link: "/services/rug-repair", button: "Request Repair" },
	{ title: "Trade-In & Guaranteed Pricing", description: "Fair evaluations, guaranteed prices, and trusted rug trade-ins.", icon: <LuBadgeDollarSign className="text-4xl text-yellow-600 mb-4" />, link: "/trade-in", button: "Request Trade-In" },
	{ title: "Certified Rug Identification", description: "Unique ID & authenticity certificate for every handmade rug.", icon: <LuBadgeCheck className="text-4xl text-purple-600 mb-4" />, link: "/services/certification", button: "Request Certification" },
	{ title: "Premium Rug Padding", description: "Anti-bacterial, durable, and non-slip padding for long rug life.", icon: <LuGripHorizontal className="text-4xl text-pink-600 mb-4" />, link: "/services/rug-padding", button: "Request Padding" },
	{ title: "Worldwide Shipping", description: "Safe and reliable international delivery for your rugs.", icon: <LuPlane className="text-4xl text-gray-600 mb-4" />, link: "/services/shipping", button: "Request Shipping" },
];

export default function Page() {
	return (
		<section className="py-16 bg-gray-50">
			<div className="max-w-6xl mx-auto px-6">
				<h2 className="text-4xl font-bold text-center mb-12">Our Services</h2>
				<div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
					{services.map((service, index) => (
						<Link href={service.link} key={index}>
							<div className="cursor-pointer bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition text-center group">
								{service.icon}
								<h3 className="text-xl font-semibold mb-2 group-hover:text-red-600 transition">{service.title}</h3>
								<p className="text-gray-600">{service.description}</p>
								<button
									type="button"
									className="mt-4 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition"
								>
									{service.button}
								</button>
							</div>
						</Link>
					))}
				</div>
			</div>
			<CleaningForm />
		</section>
	);
}


