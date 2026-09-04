"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Sidebar } from "@/components/Sidebar";

export default function RewardsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
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
        .maybeSingle();

      const { data: partiesData } = await supabase
        .from("parties")
        .select("*")
        .order("created_at", { ascending: false });

      setProfile(profileData);
      setIsAdmin(!!profileData?.is_admin);
      setParties(partiesData || []);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <p>Chargement...</p>
      </main>
    );
  }

  const totalGagne = parties.reduce((sum, p) => sum + Number(p.recompense), 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar isAdmin={isAdmin} />
      <div className="mx-auto max-w-2xl p-4 pb-28 pt-24 sm:p-6 sm:pb-28 sm:pt-28 lg:p-8 lg:pb-8 lg:pt-28">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold sm:text-3xl">
            💰 Mes récompenses
          </h1>
          <Link
            href="/withdraw"
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-105"
          >
            💳 Retrait
          </Link>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Solde actuel
            </p>
            <p className="mt-1 text-2xl font-bold text-violet-600">
              {Number(profile?.solde_virtuel ?? 0).toFixed(2)} $
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Total gagné
            </p>
            <p className="mt-1 text-2xl font-bold text-violet-600">
              {totalGagne.toFixed(2)} $
            </p>
          </div>
        </div>

        <h2 className="mb-3 text-lg font-bold">Historique des récompenses</h2>

        {parties.length === 0 ? (
          <p className="text-slate-500">Aucune récompense pour l'instant.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {parties.map((p, index) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
              >
                <span>
                  Partie #{parties.length - index} — {p.score}/30
                </span>
                <span
                  className={
                    p.recompense > 0
                      ? "font-bold text-emerald-600"
                      : "font-bold text-slate-400"
                  }
                >
                  +{Number(p.recompense).toFixed(2)} $
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}