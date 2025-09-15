
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MENU } from "./menuConfig";


export default function NavbarClient() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-gray-100/60 bg-white/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-center gap-6 py-3">
          {MENU.map((item) => {
            const active =
              pathname === item.to || pathname?.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                href={item.to}
                className={["group relative flex items-center gap-1.5", "text-sm font-semibold tracking-wide", item.color, "hover:opacity-80 transition-colors", active ? "opacity-100" : "opacity-90"].join(" ")}
              >
                <span className="text-[0.95rem] leading-none">{item.icon}</span>
                <span className="leading-none">{item.label}</span>
                <span
                  className={["absolute -bottom-2 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-current transition-all duration-200", active ? "w-6" : "group-hover:w-6"].join(" ")}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

