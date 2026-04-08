"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "◈" },
  { href: "/reservations", label: "Réservations", icon: "📋" },
  { href: "/flotte", label: "Flotte", icon: "🚗" },
  { href: "/prix/trajet", label: "Prix trajet", icon: "🗺" },
  { href: "/prix/mad", label: "Prix MAD", icon: "⏱" },
  { href: "/options", label: "Options", icon: "✦" },
  { href: "/parametres", label: "Paramètres", icon: "⚙" },
];

export default function Sidebar({ societeName }: { societeName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const currentPage = NAV.find((n) => n.href === pathname || (n.href !== "/dashboard" && pathname.startsWith(n.href)));

  const sidebarContent = (
    <>
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <div className="font-semibold text-gray-900 text-sm leading-tight">{societeName}</div>
          <div className="text-xs text-gray-500 mt-0.5">VTC Admin</div>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden p-1 text-gray-400 hover:text-gray-600">✕</button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-gray-900 text-white font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <span className="text-base">↩</span>
          Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
        >
          <span className="text-lg leading-none">☰</span>
        </button>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-900 truncate">
            {currentPage?.label || societeName}
          </span>
        </div>
        <div className="text-xs text-gray-400 font-medium">{societeName}</div>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — desktop always visible, mobile sliding drawer */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col h-full
        transition-transform duration-200 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {sidebarContent}
      </aside>
    </>
  );
}
