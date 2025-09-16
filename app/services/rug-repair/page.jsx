/* eslint-disable react/no-unescaped-entities */
import ServiceHero from "../../components/ServiceHero";
import RepairForm from "../../components/RepairForm";
import { getSafeImgUrl } from '@/lib/imageUrl';

export default function RugRepairPage() {
  return (
    <div>
      {/* Hero Section */}
      <ServiceHero
        title="Rug Repair & Restoration"
        description="Since 1988, Aytek Rugs has been trusted for expert craftsmanship in restoring handmade and antique rugs. Our artisans preserve authenticity and value using traditional methods — ensuring your rugs remain timeless treasures."
        image="/images/services/rug-repair/step1.png"
      />

      {/* Intro */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-lg text-gray-700">
            El dokuma halılarınız, çağlar öncesinden gelen dokuma teknikleri bozulmadan,
            kök boyasına ve kalitesine özen gösterilerek, sanatın büyüsünü bozmadan
            titizlikle restore edilir.
          </p>
        </div>
      </section>

      {/* Process */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">
            Our Repair & Restoration Services
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-lg shadow p-6">
                <img
                  src={getSafeImgUrl("/images/services/rug-repair/step2.png")}
                alt="Initial Inspection"
                className="w-full h-48 object-cover rounded mb-4"
                loading="lazy"
              />
              <h3 className="text-xl font-semibold mb-2">1. Initial Inspection</h3>
              <p>
                Detailed inspection to assess the rug's condition and determine the best restoration approach.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-lg shadow p-6">
              <img
                src="/images/services/rug-repair/step2.png"
                alt="Fringe Repair"
                className="w-full h-48 object-cover rounded mb-4"
                loading="lazy"
              />
              <h3 className="text-xl font-semibold mb-2">2. Fringe Repair</h3>
              <p>
                Repairing and replacing fringes to match the rug’s original
                character and design.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-lg shadow p-6">
              <img
                src="/images/services/rug-repair/step3.png"
                alt="Edge Binding"
                className="w-full h-48 object-cover rounded mb-4"
                loading="lazy"
              />
              <h3 className="text-xl font-semibold mb-2">3. Edge Binding</h3>
              <p>
                Strengthening rug edges to prevent unraveling and preserve
                structure.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-lg shadow p-6">
              <img
                src="/images/services/rug-repair/step4.jpeg"
                alt="Re-Weaving"
                className="w-full h-48 object-cover rounded mb-4"
                loading="lazy"
              />
              <h3 className="text-xl font-semibold mb-2">4. Re-Weaving</h3>
              <p>
                Skilled artisans re-weave damaged sections using traditional
                weaving techniques.
              </p>
            </div>

            {/* Step 5 */}
            <div className="bg-white rounded-lg shadow p-6">
              <img
                src="/images/services/rug-repair/step5.jpeg"
                alt="Color Restoration"
                className="w-full h-48 object-cover rounded mb-4"
                loading="lazy"
              />
              <h3 className="text-xl font-semibold mb-2">5. Color Restoration</h3>
              <p>
                Restoring faded or damaged colors with natural dyes to bring back
                the rug’s vibrancy.
              </p>
            </div>
          </div>
              <RepairForm />
        </div>
      </section>
    </div>
  );
}



