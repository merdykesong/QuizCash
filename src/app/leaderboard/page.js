"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Sidebar } from "@/components/Sidebar";

export default function LeaderboardPage() {
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
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
        .select("is_admin")
        .eq("id", userData.user.id)
        .maybeSingle();

      const { data, error } = await supabase.rpc("obtenir_classement");

      if (!error) setPlayers(data);
      setIsAdmin(!!profileData?.is_admin);
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

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar isAdmin={isAdmin} />
      <div className="mx-auto max-w-2xl p-4 pb-28 pt-24 sm:p-6 sm:pb-28 sm:pt-28 lg:p-8 lg:pb-8 lg:pt-28">
        <h1 className="mb-1 text-2xl font-extrabold sm:text-3xl">
          🏆 Classement
        </h1>
        <p className="mb-8 text-slate-500">Le top 25 des meilleurs joueurs.</p>

        {players.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-slate-500">Aucun joueur classé pour l'instant.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {players.map((p, index) => (
              <div
                key={index}
                className={`flex items-center justify-between rounded-2xl border px-5 py-4 shadow-sm ${
                  p.est_moi
                    ? "border-violet-300 bg-violet-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 text-center text-lg font-bold">
                    {medals[index] || `#${index + 1}`}
                  </span>
                  <span
                    className={`font-medium ${
                      p.est_moi ? "text-violet-700" : "text-slate-800"
                    }`}
                  >
                    {p.pseudo}
                    {p.est_moi && (
                      <span className="ml-2 text-xs text-violet-500">
                        (toi)
                      </span>
                    )}
                    {p.est_champion && (
                      <span className="ml-2 text-xs font-semibold text-amber-500">
                        🏆 Champion
                      </span>
                    )}
                  </span>
                </div>
                <div className="text-right text-sm">
                  <p className="font-bold">{p.meilleur_score} / 30</p>
                  <p className="text-slate-400">
                    {p.parties_jouees} partie
                    {p.parties_jouees > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}