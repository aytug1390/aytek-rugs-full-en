"use client";

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/rugs', label: 'Rugs' },
  { href: '/admin/reviews', label: 'Reviews' },
  { href: '/admin/hero', label: 'Hero Slides' },
];

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === 'loading') return <div className="p-10">Loading...</div>;
  // Basit koruma: admin rolü yoksa engelle (rol bilgisini kendi NextAuth config’ine göre ayarla)
  if (!session?.user || !(session.user.role === "admin" || session.user.roles?.includes?.("admin"))) {
    return <div className="p-10">Unauthorized</div>;
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-white border-r p-4 flex flex-col">
        <div className="font-bold mb-6 text-lg">Aytek Admin</div>
        <nav className="flex-1 space-y-1">
          {nav.map(i => (
            <Link
              key={i.href}
              href={i.href}
              className={`block px-3 py-2 rounded text-sm font-medium hover:bg-gray-100 ${pathname === i.href ? 'bg-gray-200' : ''}`}
            >
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="text-xs text-gray-500 mb-2">{session.user.email}</div>
  <button type="button" onClick={() => signOut()} className="text-left px-3 py-2 rounded bg-gray-900 text-white text-sm">Sign Out</button>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
// (tekrar eden ve hatalı kodlar kaldırıldı)

