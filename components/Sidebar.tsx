"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="font-semibold text-gray-900 text-sm leading-tight">{societeName}</div>
        <div className="text-xs text-gray-500 mt-0.5">VTC Admin</div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
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
    </aside>
  );
}
