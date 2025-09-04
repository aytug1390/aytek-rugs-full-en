"use client";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    axios.get("/api/reviews")
      .then(res => { if(!cancelled) setReviews(res.data); })
      .catch(() => { if(!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);
  if (error) {
    return (
      <section id="reviews" className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 text-center text-gray-500 italic">
          <p>Reviews service currently unavailable.</p>
        </div>
      </section>
    );
  }
  if (!reviews.length && !error) {
    return (
      <section id="reviews" className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 text-center text-gray-400 italic">
          <p>No reviews yet.</p>
        </div>
      </section>
    );
  }
  return (
    <section id="reviews" className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-8">Customer Reviews</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((review, idx) => (
            <div key={idx} className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold">{review.name}</h3>
              <p className="text-yellow-500">{"⭐".repeat(review.rating)}</p>
              <p className="text-gray-600">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

