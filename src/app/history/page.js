"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function HistoryPage() {
  const router = useRouter();
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("parties")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) setParties(data);
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">📜 Historique</h1>
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
          >
            Retour
          </Link>
        </div>

        {parties.length === 0 ? (
          <p className="text-slate-400">
            Aucune partie jouée pour l'instant. {" "}
            <Link href="/quiz" className="text-indigo-400 hover:underline">
              Joue ta première partie !
            </Link>
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {parties.map((p, index) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-5 py-4"
              >
                <div>
                  <p className="font-semibold">
                    Partie #{parties.length - index}
                  </p>
                  <p className="text-sm text-slate-400">
                    {new Date(p.created_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{p.score} / 30</p>
                  <p className="text-sm text-slate-400">
                    {Number(p.pourcentage).toFixed(2)}% •{" "}
                    <span className="text-yellow-400">
                      +{Number(p.recompense).toFixed(2)} $
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
