"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

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
        .single();

      setProfile(profileData);
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

  const dateInscription = new Date(profile?.created_at).toLocaleDateString(
    "fr-FR",
    { day: "2-digit", month: "long", year: "numeric" }
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">👤 Mon profil</h1>
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
          >
            Retour
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500 text-2xl font-bold">
              {profile?.avatar_emoji || profile?.pseudo?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-xl font-bold">{profile?.pseudo}</p>
              <p className="text-sm text-slate-400">{email}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <InfoRow label="Date d'inscription" value={dateInscription} />
            <InfoRow label="Parties jouées" value={profile?.parties_jouees ?? 0} />
            <InfoRow label="Meilleur score" value={`${profile?.meilleur_score ?? 0} / 30`} />
            <InfoRow
              label="Total récompenses"
              value={`${Number(profile?.solde_virtuel ?? 0).toFixed(2)} $`}
            />
          </div>
        </div>

        <Link
          href="/settings"
          className="mt-6 block w-full rounded-xl bg-indigo-500 py-3 text-center font-semibold hover:bg-indigo-400"
        >
          ⚙️ Modifier mon profil / paramètres
        </Link>
      </div>
    </main>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-lg bg-white/5 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
