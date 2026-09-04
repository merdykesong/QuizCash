"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Sidebar } from "@/components/Sidebar";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      setEmail(userData.user.email);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .maybeSingle();

      setProfile(profileData);
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

  const dateInscription = new Date(profile?.created_at).toLocaleDateString(
    "fr-FR",
    { day: "2-digit", month: "long", year: "numeric" }
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar isAdmin={profile?.is_admin} />
      <div className="mx-auto max-w-lg p-4 pb-28 pt-24 sm:p-6 sm:pb-28 sm:pt-28 lg:p-8 lg:pb-8 lg:pt-28">
        <h1 className="mb-8 text-2xl font-extrabold sm:text-3xl">
          👤 Mon profil
        </h1>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-2xl">
              {profile?.avatar_emoji || (
                <span className="font-bold text-white">
                  {profile?.pseudo?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-xl font-bold">{profile?.pseudo}</p>
              <p className="text-sm text-slate-400">{email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow label="Date d'inscription" value={dateInscription} />
            <InfoRow
              label="Parties jouées"
              value={profile?.parties_jouees ?? 0}
            />
            <InfoRow
              label="Meilleur score"
              value={`${profile?.meilleur_score ?? 0} / 30`}
            />
            <InfoRow
              label="Solde actuel"
              value={`${Number(profile?.solde_virtuel ?? 0).toFixed(2)} $`}
            />
          </div>
        </div>

        <Link
          href="/settings"
          className="mt-6 block w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-center font-semibold text-white shadow-md transition hover:scale-[1.01]"
        >
          ⚙️ Modifier mon profil / paramètres
        </Link>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}