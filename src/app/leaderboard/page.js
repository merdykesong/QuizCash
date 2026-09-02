"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function LeaderboardPage() {
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      setCurrentUserId(userData.user.id);

      const { data, error } = await supabase.rpc("obtenir_classement");

      if (!error) setPlayers(data);
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

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">🏆 Classement</h1>
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
          >
            Retour
          </Link>
        </div>

        {players.length === 0 ? (
          <p className="text-slate-400">Aucun joueur classé pour l'instant.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {players.map((p, index) => {
              const isMe = p.id === currentUserId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between rounded-xl border px-5 py-4 ${
                    isMe
                      ? "border-indigo-400 bg-indigo-500/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center text-lg font-bold">
                      {medals[index] || `#${index + 1}`}
                    </span>
                    <span className="font-medium">
                      {p.pseudo}
                      {isMe && (
                        <span className="ml-2 text-xs text-indigo-400">
                          (toi)
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
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
