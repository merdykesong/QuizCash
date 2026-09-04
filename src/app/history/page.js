"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Sidebar } from "@/components/Sidebar";

export default function HistoryPage() {
  const router = useRouter();
  const [parties, setParties] = useState([]);
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

      const { data, error } = await supabase
        .from("parties")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) setParties(data);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar isAdmin={isAdmin} />
      <div className="mx-auto max-w-3xl p-4 pb-28 pt-24 sm:p-6 sm:pb-28 sm:pt-28 lg:p-8 lg:pb-8 lg:pt-28">
        <h1 className="mb-1 text-2xl font-extrabold sm:text-3xl">
          🕘 Historique
        </h1>
        <p className="mb-8 text-slate-500">Toutes tes parties jouées.</p>

        {parties.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-slate-500">Aucune partie jouée pour l'instant.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {parties.map((p, index) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
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
                    <span
                      className={
                        p.recompense > 0
                          ? "font-semibold text-emerald-600"
                          : "text-slate-400"
                      }
                    >
                      +{Number(p.recompense).toFixed(2)} $
                    </span>
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