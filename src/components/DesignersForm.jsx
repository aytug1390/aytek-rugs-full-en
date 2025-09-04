export default function DesignersForm() {
  return (
    <section className="p-10 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">For Designers</h2>
      <p className="mb-6">
        We proudly collaborate with interior designers and architects. 
        Enjoy trade discounts, sample collections, and personalized support.
      </p>
      <form className="grid gap-4">
        <input type="text" placeholder="Designer / Company Name" className="border p-3 rounded" />
        <input type="email" placeholder="Email" className="border p-3 rounded" />
        <textarea placeholder="Project Details" className="border p-3 rounded"></textarea>
        <button className="bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 transition">
          Submit Application
        </button>
      </form>
    </section>
  );
}