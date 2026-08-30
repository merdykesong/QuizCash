"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/quiz", label: "Jouer maintenant", icon: "🎮" },
  { href: "/history", label: "Historique", icon: "📜" },
  { href: "/profile", label: "Mon profil", icon: "👤" },
  { href: "/settings", label: "Paramètres", icon: "⚙️" },
];

export function Sidebar({ isAdmin }) {
  const pathname = usePathname();

  const links = isAdmin
    ? [...LINKS, { href: "/admin", label: "Admin", icon: "🛠️" }]
    : LINKS;

  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:w-56 lg:flex-col lg:items-stretch lg:gap-2 lg:overflow-visible lg:border-b-0 lg:border-r lg:px-4 lg:py-8">
      <div className="mb-0 hidden shrink-0 items-center gap-2 px-2 lg:mb-8 lg:flex">
        <span className="text-2xl">🧠</span>
        <span className="text-lg font-bold tracking-tight">
          Quiz<span className="text-indigo-400">Cash</span>
        </span>
      </div>
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-indigo-500 text-white"
                : "text-slate-300 hover:bg-white/10"
            }`}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
