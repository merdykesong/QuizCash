"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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

      setProfile(profileData);
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-1 text-3xl font-bold">
          Bienvenue, {profile?.pseudo} 👋
        </h1>
        <p className="mb-8 text-slate-400">Voici ton tableau de bord.</p>

        {/* Stats */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Solde virtuel"
            value={`${Number(profile?.solde_virtuel ?? 0).toFixed(2)} $`}
          />
          <StatCard label="Meilleur score" value={`${profile?.meilleur_score ?? 0} / 30`} />
          <StatCard label="Parties jouées" value={profile?.parties_jouees ?? 0} />
        </div>

        {/* Menu */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MenuButton href="/quiz" label="🎮 Jouer maintenant" primary />
          <MenuButton href="/rewards" label="💰 Mes récompenses" />
          <MenuButton href="/history" label="📜 Historique" />
          <MenuButton href="/leaderboard" label="🏆 Classement" />
          <MenuButton href="/profile" label="👤 Mon profil" />
          <MenuButton href="/settings" label="⚙️ Paramètres" />
        </div>

        <button
          onClick={handleLogout}
          className="mt-8 w-full rounded-xl border border-white/20 py-3 font-semibold text-slate-200 transition hover:bg-white/10"
        >
          Déconnexion
        </button>
      </div>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function MenuButton({ href, label, primary }) {
  return (
    <Link
      href={href}
      className={`rounded-xl px-5 py-4 text-center font-medium transition ${
        primary
          ? "bg-indigo-500 text-white hover:bg-indigo-400"
          : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
      }`}
    >
      {label}
    </Link>
  );
}
