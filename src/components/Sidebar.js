"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const ALL_LINKS = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/quiz", label: "Jouer maintenant", icon: "🎮" },
  { href: "/history", label: "Historique", icon: "🕘" },
  { href: "/profile", label: "Mon profil", icon: "👤" },
  { href: "/leaderboard", label: "Classements", icon: "🏆" },
  { href: "/settings", label: "Paramètres", icon: "⚙️" },
];

const MOBILE_MAIN_LINKS = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/quiz", label: "Jouer", icon: "🎮" },
  { href: "/leaderboard", label: "Classement", icon: "🏆" },
  { href: "/profile", label: "Profil", icon: "👤" },
];

export function Sidebar({ isAdmin }) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  const desktopLinks = isAdmin
    ? [...ALL_LINKS, { href: "/admin", label: "Admin", icon: "🛡️" }]
    : ALL_LINKS;

  const moreLinks = [
    { href: "/history", label: "Historique", icon: "🕘" },
    { href: "/settings", label: "Paramètres", icon: "⚙️" },
    { href: "/help", label: "Aide", icon: "❔" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: "🛡️" }] : []),
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Desktop : barre flottante en haut, effet verre liquide */}
      <nav className="fixed inset-x-0 top-4 z-50 mx-auto hidden w-fit items-center gap-1 rounded-full border border-white/60 bg-white/70 px-3 py-2 shadow-lg shadow-slate-200/60 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/60 lg:flex">
        <Link href="/dashboard" className="mr-2 flex items-center gap-1.5 px-2">
          <span className="text-lg">⚡</span>
          <span className="text-sm font-extrabold tracking-tight text-slate-900">
            Quiz<span className="text-violet-600">Cash</span>
          </span>
        </Link>

        {desktopLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
              }`}
            >
              <span className="text-sm">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}

        <button
          onClick={handleLogout}
          className="ml-1 flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium text-slate-400 transition hover:bg-white/80 hover:text-red-500"
        >
          ↪ Déconnexion
        </button>
      </nav>

      {/* Mobile : barre flottante en bas, effet verre liquide */}
      <nav
        className="fixed inset-x-4 z-50 flex items-center justify-around rounded-3xl border border-white/60 bg-white/70 px-2 py-2 shadow-lg shadow-slate-200/60 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/60 lg:hidden"
        style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        {MOBILE_MAIN_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 text-[11px] font-medium transition-all duration-200 ${
                active
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <span className="text-lg leading-none">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}

        <button
          onClick={() => setMoreOpen((o) => !o)}
          className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 text-[11px] font-medium transition-all duration-200 ${
            moreOpen ? "bg-slate-900 text-white" : "text-slate-500"
          }`}
        >
          <span className="text-lg leading-none">•••</span>
          Plus
        </button>
      </nav>

      {/* Mobile : menu "Plus" */}
      {moreOpen && (
        <div
          className="fixed inset-x-4 z-50 flex flex-col gap-1 rounded-3xl border border-white/60 bg-white/80 p-2 shadow-lg shadow-slate-200/60 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/70 lg:hidden"
          style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
        >
          {moreLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white"
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-red-500 transition hover:bg-white"
          >
            <span>↪</span>
            Déconnexion
          </button>
        </div>
      )}
    </>
  );
}