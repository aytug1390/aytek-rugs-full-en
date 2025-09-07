export default function Contact() {
  return (
    <section className="p-10 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Contact Us</h2>
      
      <div className="mb-6">
        <p>📍 711 Route 17 North, Carlstadt, NJ 07072</p>
        <p>📞 (201) 554-7202</p>
        <p>✉️ info@aytekrugs.com</p>
      </div>

      {/* Google Maps Embed */}
      <iframe
        title="map"
        className="w-full h-64 rounded mb-6"
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3025.692769456705!2d-74.07468428459497!3d40.84267897931768!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c2f9f86f7f85a7%3A0xe2d6237e7e9aee7!2s711%20NJ-17%2C%20Carlstadt%2C%20NJ%2007072%2C%20USA!5e0!3m2!1sen!2sus!4v1693715152367!5m2!1sen!2sus"
        allowFullScreen=""
        loading="lazy"
      ></iframe>

      {/* Contact Form */}
      <form className="grid gap-4">
        <input type="text" placeholder="Name" className="border p-3 rounded" />
        <input type="email" placeholder="Email" className="border p-3 rounded" />
        <textarea placeholder="Message" className="border p-3 rounded"></textarea>
        <button className="bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 transition">
          Send Message
        </button>
      </form>
    </section>
  );
}

