"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function Icon({ path, className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {path}
    </svg>
  );
}

const icons = {
  home: (
    <Icon
      path={
        <>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
        </>
      }
    />
  ),
  play: (
    <Icon
      path={
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M10 8.5 15.5 12 10 15.5z" />
        </>
      }
    />
  ),
  card: (
    <Icon
      path={
        <>
          <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
          <path d="M2.5 9.5h19" />
        </>
      }
    />
  ),
  clock: (
    <Icon
      path={
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.5 2" />
        </>
      }
    />
  ),
  user: (
    <Icon
      path={
        <>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5" />
        </>
      }
    />
  ),
  trophy: (
    <Icon
      path={
        <>
          <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
          <path d="M7 5H4.5A1.5 1.5 0 0 0 3 6.5 3.5 3.5 0 0 0 6.5 10H7" />
          <path d="M17 5h2.5A1.5 1.5 0 0 1 21 6.5 3.5 3.5 0 0 1 17.5 10H17" />
          <path d="M12 14v3M9 20.5h6M10 20.5v-2.8M14 20.5v-2.8" />
        </>
      }
    />
  ),
  settings: (
    <Icon
      path={
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.2 3H9.8l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9c.6.5 1.3.9 2 1.2l.4 2.6h4.4l.4-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" />
        </>
      }
    />
  ),
  help: (
    <Icon
      path={
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 0 1 4.9.7c0 1.6-2.4 1.8-2.4 3.3" />
          <path d="M12 17.2v.1" />
        </>
      }
    />
  ),
  shield: (
    <Icon
      path={
        <path d="M12 3.5 19 6.3V11c0 4.8-3 7.9-7 9.5-4-1.6-7-4.7-7-9.5V6.3z" />
      }
    />
  ),
  more: (
    <Icon
      path={
        <>
          <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
        </>
      }
    />
  ),
  logout: (
    <Icon
      path={
        <>
          <path d="M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3" />
          <path d="M16 17l5-5-5-5M21 12H9" />
        </>
      }
    />
  ),
};

const ALL_LINKS = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/quiz", label: "Jouer maintenant", icon: "play" },
  { href: "/withdraw", label: "Retrait", icon: "card" },
  { href: "/history", label: "Historique", icon: "clock" },
  { href: "/profile", label: "Mon profil", icon: "user" },
  { href: "/leaderboard", label: "Classements", icon: "trophy" },
  { href: "/settings", label: "Paramètres", icon: "settings" },
];

const MOBILE_MAIN_LINKS = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/quiz", label: "Jouer", icon: "play" },
  { href: "/leaderboard", label: "Classement", icon: "trophy" },
  { href: "/profile", label: "Profil", icon: "user" },
];

export function Sidebar({ isAdmin }) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  const desktopLinks = isAdmin
    ? [...ALL_LINKS, { href: "/admin", label: "Admin", icon: "shield" }]
    : ALL_LINKS;

  const moreLinks = [
    { href: "/withdraw", label: "Retrait", icon: "card" },
    { href: "/history", label: "Historique", icon: "clock" },
    { href: "/settings", label: "Paramètres", icon: "settings" },
    { href: "/help", label: "Aide", icon: "help" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: "shield" }] : []),
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const glass =
    "border border-white/70 bg-white/60 shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur-2xl backdrop-saturate-[1.8] supports-[backdrop-filter]:bg-white/55";

  return (
    <>
      {/* Desktop : barre flottante, complètement indépendante du contenu */}
      <nav
        className={`pointer-events-auto fixed left-1/2 top-4 z-[100] hidden w-fit -translate-x-1/2 items-center gap-1 rounded-full px-2.5 py-2 lg:flex ${glass}`}
      >
        <Link href="/dashboard" className="mr-1.5 flex items-center gap-1.5 px-2.5">
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
                  ? "bg-violet-500/15 text-violet-700 backdrop-blur-md"
                  : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
              }`}
            >
              {icons[link.icon]}
              {link.label}
            </Link>
          );
        })}

        <button
          onClick={handleLogout}
          className="ml-1 flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium text-slate-400 transition hover:bg-white/70 hover:text-red-500"
        >
          {icons.logout}
        </button>
      </nav>

      {/* Mobile : barre flottante en bas, séparée du contenu */}
      <nav
        className={`pointer-events-auto fixed inset-x-6 z-[100] flex items-center justify-around rounded-[28px] px-2 py-2 lg:hidden ${glass}`}
        style={{
          bottom: "calc(1rem + env(safe-area-inset-bottom))",
        }}
      >
        {MOBILE_MAIN_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 transition-all duration-200 ${
                active
                  ? "bg-violet-500/15 text-violet-700"
                  : "text-slate-500"
              }`}
            >
              {icons[link.icon]}
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}

        <button
          onClick={() => setMoreOpen((o) => !o)}
          className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 transition-all duration-200 ${
            moreOpen ? "bg-violet-500/15 text-violet-700" : "text-slate-500"
          }`}
        >
          {icons.more}
          <span className="text-[10px] font-medium">Plus</span>
        </button>
      </nav>

      {/* Mobile : menu "Plus", flottant lui aussi */}
      {moreOpen && (
        <div
          className={`fixed inset-x-6 z-[100] flex flex-col gap-1 rounded-[28px] p-2 lg:hidden ${glass}`}
          style={{
            bottom: "calc(5.5rem + env(safe-area-inset-bottom))",
          }}
        >
          {moreLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white/70"
            >
              {icons[link.icon]}
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-red-500 transition hover:bg-white/70"
          >
            {icons.logout}
            Déconnexion
          </button>
        </div>
      )}
    </>
  );
}