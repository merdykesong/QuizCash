"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function RewardsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
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
        .order("created_at", { ascending: false });

      setProfile(profileData);
      setParties(partiesData || []);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p>Chargement...</p>
      </main>
    );
  }

  const totalGagne = parties.reduce((sum, p) => sum + Number(p.recompense), 0);

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">💰 Mes récompenses</h1>
          <Link
  href="/withdraw"
  className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-yellow-400"
>
  💳 Retrait
</Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
          >
            Retour
          </Link>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Solde actuel
            </p>
            <p className="mt-1 text-2xl font-bold text-yellow-400">
              {Number(profile?.solde_virtuel ?? 0).toFixed(2)} $
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Total gagné
            </p>
            <p className="mt-1 text-2xl font-bold text-yellow-400">
              {totalGagne.toFixed(2)} $
            </p>
          </div>
        </div>

        <h2 className="mb-3 text-lg font-semibold">Historique des récompenses</h2>

        {parties.length === 0 ? (
          <p className="text-slate-400">Aucune récompense pour l'instant.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {parties.map((p, index) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                <span>
                  Partie #{parties.length - index} — {p.score}/30
                </span>
                <span className="font-bold text-yellow-400">
                  +{Number(p.recompense).toFixed(2)} $
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
