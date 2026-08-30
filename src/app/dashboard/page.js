"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Sidebar } from "@/components/Sidebar";

function timeAgo(dateString) {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );
  const units = [
    ["an", 31536000],
    ["mois", 2592000],
    ["jour", 86400],
    ["heure", 3600],
    ["minute", 60],
  ];
  for (const [name, secs] of units) {
    const value = Math.floor(seconds / secs);
    if (value >= 1) {
      return `il y a ${value} ${name}${
        value > 1 && name !== "mois" ? "s" : ""
      }`;
    }
  }
  return "à l'instant";
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();

      const { data: partiesData } = await supabase
        .from("parties")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      setProfile(profileData);
      setParties(partiesData || []);
      setLoading(false);
    }

    loadData();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p>Chargement...</p>
      </main>
    );
  }

  const quickAccess = [
    { href: "/rewards", icon: "🎁", label: "Rewards" },
    { href: "/leaderboard", icon: "🏆", label: "Leaderboard" },
    { href: "/history", icon: "🕘", label: "History" },
    { href: "/settings", icon: "⚙️", label: "Settings" },
    profile?.is_admin
      ? { href: "/admin", icon: "🛠️", label: "Admin" }
      : { href: "/profile", icon: "👤", label: "Profil" },
    { href: "/help", icon: "❓", label: "Help" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white lg:flex-row">
      <Sidebar isAdmin={profile?.is_admin} />

      <div className="flex flex-1 flex-col gap-6 p-4 lg:flex-row lg:gap-6 lg:p-8">
        {/* Colonne centrale */}
        <main className="flex flex-1 flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              Bienvenue, {profile?.pseudo} 👋
            </h1>
            <p className="text-slate-400">Voici ton tableau de bord.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-5 text-center backdrop-blur-xl">
              <p className="text-xs uppercase tracking-wide text-yellow-300/70">
                Virtual Balance
              </p>
              <p className="mt-1 text-2xl font-bold text-yellow-300">
                {Number(profile?.solde_virtuel ?? 0).toFixed(2)} $
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-400/30 bg-indigo-400/10 p-5 text-center backdrop-blur-xl">
              <p className="text-xs uppercase tracking-wide text-indigo-300/70">
                High Score
              </p>
              <p className="mt-1 text-2xl font-bold text-indigo-300">
                {profile?.meilleur_score ?? 0} / 30
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-5 text-center backdrop-blur-xl">
              <p className="text-xs uppercase tracking-wide text-cyan-300/70">
                Games Played
              </p>
              <p className="mt-1 text-2xl font-bold text-cyan-300">
                {profile?.parties_jouees ?? 0}
              </p>
            </div>
          </div>

          {/* Play Now */}
          <Link
            href="/quiz"
            className="group flex items-center justify-between rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-600/40 via-purple-600/30 to-indigo-500/40 p-8 backdrop-blur-xl transition hover:scale-[1.01]"
          >
            <span className="text-3xl font-extrabold md:text-4xl">
              Play Now
            </span>
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/20 text-3xl shadow-lg shadow-indigo-500/40 transition group-hover:scale-110">
              ▶
            </span>
          </Link>

          {/* Grille d'accès rapide */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {quickAccess.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur-xl transition hover:scale-[1.03] hover:border-indigo-400/50 hover:bg-white/10"
              >
                <span className="text-3xl drop-shadow-[0_4px_6px_rgba(99,102,241,0.5)]">
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </main>

        {/* Colonne droite */}
        <aside className="flex w-full flex-col gap-6 lg:w-80">
          {/* User Profile */}
          <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              ⋮
            </button>
            {menuOpen && (
              <div className="absolute right-4 top-10 z-10 flex flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-900 text-sm shadow-xl">
                <Link
                  href="/profile"
                  className="px-4 py-2 text-left hover:bg-white/10"
                >
                  Mon profil
                </Link>
                <Link
                  href="/settings"
                  className="px-4 py-2 text-left hover:bg-white/10"
                >
                  Paramètres
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-left text-red-300 hover:bg-white/10"
                >
                  Déconnexion
                </button>
              </div>
            )}

            <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">
              User Profile
            </p>
            <div className="relative mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500 text-3xl font-bold">
              {profile?.pseudo?.[0]?.toUpperCase()}
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-slate-900 bg-green-400" />
            </div>
            <p className="font-semibold">{profile?.pseudo}</p>
          </div>

          {/* Activity Feed */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <p className="mb-4 text-xs uppercase tracking-wide text-slate-400">
              Activity Feed
            </p>
            {parties.length === 0 ? (
              <p className="text-sm text-slate-400">
                Aucune activité récente. Joue ta première partie !
              </p>
            ) : (
              <div className="relative flex flex-col gap-4 border-l border-white/10 pl-4">
                {parties.map((p) => (
                  <div key={p.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-indigo-400" />
                    <p className="text-sm">
                      Partie terminée : {p.score}/30 —{" "}
                      <span className="text-yellow-400">
                        +{Number(p.recompense).toFixed(2)} $
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {timeAgo(p.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Support Chat flottant */}
      <Link
        href="/contact"
        className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold shadow-lg shadow-indigo-500/40 transition hover:scale-105 hover:bg-indigo-400"
      >
        💬 Support Chat
      </Link>
    </div>
  );
}