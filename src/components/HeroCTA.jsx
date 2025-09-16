"use client";
import { useEffect, useState } from "react";
import { getBucket } from "@/lib/ab";
import QuoteCTA from "@/components/QuoteCTA";

export default function HeroCTA() {
  const [variant, setVariant] = useState("A");

  useEffect(() => {
    setVariant(getBucket("ab-quote", 0.5)); // 50/50
  }, []);

  const props =
    variant === "A"
      ? { label: "Free Rug Repair Quote (2 min)", variant: "A" }
      : { label: "Instant Estimate — Upload 2 Photos", variant: "B" };

  return <QuoteCTA {...props} />;
}

