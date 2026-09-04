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
      return `il y a ${value} ${name}${value > 1 && name !== "mois" ? "s" : ""}`;
    }
  }
  return "à l'instant";
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [parties, setParties] = useState([]);
  const [classement, setClassement] = useState([]);
  const [monRang, setMonRang] = useState(null);
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
        .maybeSingle();

      const { data: partiesData } = await supabase
        .from("parties")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);

      const { data: classementData } = await supabase.rpc(
        "obtenir_classement"
      );

      const { data: rangData } = await supabase.rpc("obtenir_mon_classement");

      setProfile(profileData);
      setParties(partiesData || []);
      setClassement((classementData || []).slice(0, 5));
      setMonRang(rangData);
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
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <p>Chargement...</p>
      </main>
    );
  }

  const pct = profile?.meilleur_score
    ? Math.round((profile.meilleur_score / 30) * 100)
    : 0;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar isAdmin={profile?.is_admin} />

      <div className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-6 p-4 pb-28 pt-24 sm:p-6 sm:pb-28 sm:pt-28 lg:flex-row lg:gap-6 lg:p-8 lg:pb-8 lg:pt-28">
        {/* Colonne centrale */}
        <main className="flex flex-1 flex-col gap-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">
                Bienvenue, {profile?.pseudo} 👋
              </h1>
              <p className="text-slate-500">Prêt à tester vos connaissances ?</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              📅 Semaine <span className="text-slate-400">▾</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon="💰"
              iconBg="bg-violet-100"
              label="Solde"
              value={`${Number(profile?.solde_virtuel ?? 0).toFixed(2)} $`}
              sub="Cagnotte disponible"
            />
            <StatCard
              icon="📊"
              iconBg="bg-cyan-100"
              label="Parties jouées"
              value={profile?.parties_jouees ?? 0}
              sub="au total"
            />
            <StatCard
              icon="🏅"
              iconBg="bg-emerald-100"
              label="Meilleur score"
              value={`${profile?.meilleur_score ?? 0} / 30`}
              sub={`${pct}% de réussite`}
            />
            <StatCard
              icon="⭐"
              iconBg="bg-amber-100"
              label="Ton classement"
              value={monRang ? `#${monRang}` : "—"}
              sub="classement global"
            />
          </div>

          {/* Bannière Jouer */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 p-6 sm:p-8">
            <div className="relative z-10 flex flex-col items-start gap-4 sm:max-w-md">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xl">
                ⚡
              </span>
              <div>
                <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                  Prêt pour un nouveau défi ?
                </h2>
                <p className="mt-2 text-sm text-violet-100">
                  Des milliers de questions, des sujets passionnants et des
                  classements compétitifs.
                </p>
              </div>
              <Link
                href="/quiz"
                className="mt-2 flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-violet-700 shadow-lg transition hover:scale-[1.03]"
              >
                Commencer un quiz
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs text-white">
                  →
                </span>
              </Link>
            </div>

            {/* Illustration décorative CSS */}
            <div className="pointer-events-none absolute -right-6 bottom-0 top-0 hidden w-64 items-center justify-center sm:flex">
              <div className="relative h-40 w-40 rotate-6 rounded-3xl bg-white/90 shadow-2xl">
                <div className="absolute -bottom-4 left-1/2 h-6 w-32 -translate-x-1/2 rounded-full bg-black/10 blur-md" />
                <div className="flex h-full w-full items-center justify-center text-6xl">
                  ⚡
                </div>
              </div>
            </div>
          </div>

          {/* Activité récente + Progression */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold">Activité récente</h3>
                <Link
                  href="/history"
                  className="text-sm font-medium text-violet-600 hover:underline"
                >
                  Voir tout
                </Link>
              </div>
              {parties.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Aucune activité récente. Joue ta première partie !
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {parties.map((p) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${
                          p.recompense > 0
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {p.recompense > 0 ? "✓" : "✕"}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Quiz terminé : {p.score}/30
                        </p>
                        <p className="text-xs text-slate-400">
                          {timeAgo(p.created_at)}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-bold ${
                          p.recompense > 0 ? "text-emerald-600" : "text-slate-400"
                        }`}
                      >
                        +{Number(p.recompense).toFixed(2)} $
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-bold">Votre progression</h3>
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-slate-100 text-2xl">
                  🔒
                </div>
                <p className="text-sm text-slate-500">
                  Le suivi de série de jours (streak) arrive bientôt !
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Colonne droite */}
        <aside className="flex w-full flex-col gap-6 lg:w-80">
          {/* Profil */}
          <div className="relative rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
            >
              ⋮
            </button>
            {menuOpen && (
              <div className="absolute right-4 top-10 z-10 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-lg">
                <Link href="/profile" className="px-4 py-2 text-left hover:bg-slate-50">
                  Mon profil
                </Link>
                <Link href="/settings" className="px-4 py-2 text-left hover:bg-slate-50">
                  Paramètres
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-left text-red-500 hover:bg-slate-50"
                >
                  Déconnexion
                </button>
              </div>
            )}

            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Mon Profil
            </p>
            <div className="relative mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-3xl">
              {profile?.avatar_emoji || (
                <span className="font-bold text-white">
                  {profile?.pseudo?.[0]?.toUpperCase()}
                </span>
              )}
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400" />
            </div>
            <p className="font-bold">{profile?.pseudo}</p>
            <p className="mt-1 text-xs text-slate-400">
              Niveau : bientôt disponible
            </p>
          </div>

          {/* Classement */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold">Classement</h3>
              <Link
                href="/leaderboard"
                className="text-sm font-medium text-violet-600 hover:underline"
              >
                Voir tout
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {classement.map((p, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between rounded-xl px-2 py-1.5 ${
                    p.est_moi ? "bg-violet-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center">
                      {medals[index] || index + 1}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        p.est_moi ? "text-violet-700" : "text-slate-700"
                      }`}
                    >
                      {p.pseudo}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-600">
                    {p.meilleur_score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Aide */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold">Besoin d'aide ?</h3>
            <p className="mb-4 text-sm text-slate-500">
              Nous sommes là pour vous aider
            </p>
            <Link
              href="/contact"
              className="mb-3 flex items-center justify-between rounded-xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
            >
              🎧 Contacter le support <span>→</span>
            </Link>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/help"
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-center text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                ❔ FAQ
              </Link>
              <Link
                href="/help"
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-center text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                ❔ Aide
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatCard({ icon, iconBg, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${iconBg}`}
        >
          {icon}
        </span>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className="text-xl font-extrabold sm:text-2xl">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
    </div>
  );
}