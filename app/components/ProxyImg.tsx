"use client";
import React from "react";
import Image from "next/image";
import { proxify } from "@/lib/img";

type Props = { src?: string | null; alt?: string; className?: string };

// Resilient ProxyImg: use next/image for optimized rendering. Keep API small
// to avoid mismatched HTML attributes being passed to the Image component.
export default function ProxyImg({ src, alt, className }: Props) {
  const proxied = src ? proxify(src) : "/img/placeholder.svg";

  return (
    <div className={className || "relative"}>
      <Image src={proxied} alt={alt || ""} fill className="object-cover" />
    </div>
  );
}
