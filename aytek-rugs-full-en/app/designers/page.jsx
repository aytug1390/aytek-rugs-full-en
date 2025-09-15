import DesignerForm from "../../src/components/forms/DesignerForm";

export const metadata = { title: "Partner with Aytek Rugs — Designers Program | Aytek Rugs" };

export default function Page() {
	return (
		<main className="max-w-6xl mx-auto px-4 py-10">
			{/* HERO */}
			<section className="relative overflow-hidden rounded-3xl bg-gray-900 text-white">
				<img fetchPriority="high" decoding="async"
					src="/images/designers/hero-room.webp"
					alt="Aytek Rugs for Designers"
					className="absolute inset-0 w-full h-full object-cover opacity-55"
					loading="eager"
					width="1920" height="1080"
				/>
				<div className="relative p-10 md:p-16">
					<h1 className="text-3xl md:text-5xl font-extrabold">Partner with Aytek Rugs — Designers Program</h1>
					<p className="mt-4 text-lg md:text-xl max-w-3xl">
						Interior designers and architects trust us for unique handmade rugs, custom sourcing, and white-glove service.
					</p>
					{/* ÜCRETSİZ MOCKUP VURGUSU */}
								<div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur px-4 py-3">
									<span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
									<p className="text-base md:text-lg">
										<b>Free Visual Mockup:</b> Upon request, we digitally place your selected rug into your room photo and send you a complimentary visual preview.
									</p>
								</div>
					<a href="#designer-form" className="mt-8 inline-block rounded-xl bg-white text-gray-900 px-5 py-3 font-semibold">
						Request Designer Access
					</a>
				</div>
			</section>
			{/* AVANTAJLAR */}
			<section className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				{[
					{ t: "Custom Sourcing", d: "Özel ölçü, renk, motif arayışınız için hızlı tedarik." },
					{ t: "Trade Discounts", d: "Tasarımcılara özel indirim ve net fiyatlandırma." },
					{ t: "Priority Service", d: "Öncelikli stok erişimi ve hızlı teklif/teslimat." },
					{ t: "Exclusive Collection", d: "Sadece profesyonellere açık seçkiler." },
				].map((c, i) => (
					<div key={i} className="rounded-2xl border p-6 bg-white">
						<h3 className="font-semibold text-lg">{c.t}</h3>
						<p className="mt-2 text-gray-600">{c.d}</p>
					</div>
				))}
			</section>
			{/* SHOWCASE */}
			<section className="mt-12">
				<h2 className="text-2xl font-bold mb-4">Project Showcase</h2>
				<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
											{["proj1.webp","proj2.webp","proj3.webp","proj4.webp","proj5.webp","proj6.webp"].map((n) => (
															<img fetchPriority="low" decoding="async"
																key={n}
																src={`/images/designers/${n}`}
																alt="Project"
																className="w-full h-48 object-cover rounded-xl"
																loading="lazy"
																width="800" height="600"
															/>
											))}
				</div>
			</section>
			{/* FORM */}
			<DesignerForm />
		</main>
	);
}

