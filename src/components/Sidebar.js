"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const LINKS = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/quiz", label: "Jouer maintenant", icon: "🎮" },
  { href: "/history", label: "Historique", icon: "📜" },
  { href: "/profile", label: "Mon profil", icon: "👤" },
  { href: "/settings", label: "Paramètres", icon: "⚙️" },
];

export function Sidebar({ isAdmin }) {
  const pathname = usePathname();
  const router = useRouter();

  const links = isAdmin
    ? [...LINKS, { href: "/admin", label: "Admin", icon: "🛠️" }]
    : LINKS;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <nav className="flex flex-col border-b border-white/10 bg-[#141414] px-4 py-3 lg:sticky lg:top-0 lg:h-screen lg:w-56 lg:border-b-0 lg:border-r lg:px-4 lg:py-8">
      <div className="mb-0 hidden shrink-0 items-center gap-2 px-2 lg:mb-8 lg:flex">
        <span className="text-2xl">🧠</span>
        <span className="text-lg font-bold tracking-tight text-neutral-100">
          Quiz<span className="text-red-500">Cash</span>
        </span>
      </div>

      <div className="flex flex-1 items-center gap-1 overflow-x-auto lg:flex-col lg:items-stretch lg:gap-2 lg:overflow-visible">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                active
                  ? "border border-sky-400/60 bg-sky-400/10 text-sky-200"
                  : "text-neutral-300 hover:bg-white/5"
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </div>

      <button
        onClick={handleLogout}
        className="mt-4 hidden shrink-0 items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-400 transition hover:bg-white/5 hover:text-white lg:flex"
      >
        <span>🚪</span>
        Déconnexion
      </button>
    </nav>
  );
}