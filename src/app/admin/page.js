"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const STATUS_LABELS = {
  en_attente: { emoji: "🟡", label: "En attente" },
  en_cours: { emoji: "🔵", label: "En cours" },
  approuve: { emoji: "🟢", label: "Approuvé" },
  refuse: { emoji: "🔴", label: "Refusé" },
  termine: { emoji: "✅", label: "Terminé" },
};

const FILTERS = [
  { key: "toutes", label: "Toutes" },
  { key: "en_attente", label: "En attente" },
  { key: "en_cours", label: "En cours" },
  { key: "approuve", label: "Approuvées" },
  { key: "refuse", label: "Refusées" },
  { key: "termine", label: "Terminées" },
];

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [tab, setTab] = useState("retraits");

  const [requests, setRequests] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [pseudoMap, setPseudoMap] = useState({});
  const [filter, setFilter] = useState("toutes");
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push("/login");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userData.user.id)
      .single();

    if (!profileData?.is_admin) {
      router.push("/dashboard");
      return;
    }

    setAuthorized(true);
    setCurrentUserId(userData.user.id);

    const { data: requestsData } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const map = {};
    (profilesData || []).forEach((p) => {
      map[p.id] = p.pseudo;
    });

    setPseudoMap(map);
    setRequests(requestsData || []);
    setProfiles(profilesData || []);
    setLoading(false);
  }

  async function updateStatus(id, newStatus) {
    await supabase
      .from("withdrawal_requests")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id);

    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  }

  async function handleDeleteUser(targetUserId, pseudo) {
    const confirmed = window.confirm(
      `Supprimer définitivement le compte "${pseudo}" ? Cette action est irréversible.`
    );
    if (!confirmed) return;

    setDeletingId(targetUserId);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const res = await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetUserId }),
    });

    setDeletingId(null);

    if (!res.ok) {
      alert("Erreur lors de la suppression.");
      return;
    }

    setProfiles((prev) => prev.filter((p) => p.id !== targetUserId));
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p>Chargement...</p>
      </main>
    );
  }

  if (!authorized) return null;

  const filtered =
    filter === "toutes" ? requests : requests.filter((r) => r.status === filter);

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">🛠️ Administration</h1>
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
          >
            Retour
          </Link>
        </div>

        <div className="mb-8 flex gap-2">
          <button
            onClick={() => setTab("retraits")}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              tab === "retraits"
                ? "bg-indigo-500 text-white"
                : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            💳 Retraits
          </button>
          <button
            onClick={() => setTab("utilisateurs")}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              tab === "utilisateurs"
                ? "bg-indigo-500 text-white"
                : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            👥 Utilisateurs
          </button>
        </div>

        {tab === "retraits" && (
          <>
            <div className="mb-6 flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full px-4 py-1.5 text-sm transition ${
                    filter === f.key
                      ? "bg-indigo-500 text-white"
                      : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <p className="text-slate-400">Aucune demande dans cette catégorie.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map((r) => {
                  const isOpen = expandedId === r.id;
                  return (
                    <div
                      key={r.id}
                      className="overflow-hidden rounded-xl border border-white/10 bg-white/5"
                    >
                      <button
                        onClick={() => setExpandedId(isOpen ? null : r.id)}
                        className="flex w-full flex-wrap items-center justify-between gap-2 px-5 py-4 text-left"
                      >
                        <span className="text-sm text-slate-400">#{r.id}</span>
                        <span className="font-medium">
                          {pseudoMap[r.user_id] || "Inconnu"}
                        </span>
                        <span className="font-bold text-yellow-400">
                          {Number(r.montant).toFixed(2)} $
                        </span>
                        <span className="text-sm text-slate-400">{r.methode}</span>
                        <span className="text-sm text-slate-400">
                          {new Date(r.created_at).toLocaleDateString("fr-FR")}
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                          {STATUS_LABELS[r.status].emoji}{" "}
                          {STATUS_LABELS[r.status].label}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="animate-question border-t border-white/10 px-5 py-4">
                          <p className="mb-2 text-sm font-semibold text-slate-300">
                            Détails :
                          </p>
                          <pre className="mb-4 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-slate-300">
                            {JSON.stringify(r.details, null, 2)}
                          </pre>

                          <label className="mb-1 block text-sm text-slate-300">
                            Changer le statut :
                          </label>
                          <select
                            value={r.status}
                            onChange={(e) => updateStatus(r.id, e.target.value)}
                            className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                          >
                            {Object.entries(STATUS_LABELS).map(([key, val]) => (
                              <option key={key} value={key}>
                                {val.emoji} {val.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "utilisateurs" && (
          <>
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Nombre total d'utilisateurs
              </p>
              <p className="mt-1 text-3xl font-extrabold text-indigo-400">
                {profiles.length}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-4"
                >
                  <div>
                    <p className="font-medium">
                      {p.pseudo}
                      {p.id === currentUserId && (
                        <span className="ml-2 text-xs text-indigo-400">(toi)</span>
                      )}
                      {p.is_admin && (
                        <span className="ml-2 text-xs text-yellow-400">admin</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      Inscrit le{" "}
                      {new Date(p.created_at).toLocaleDateString("fr-FR")} •{" "}
                      {p.parties_jouees} partie(s) • Solde{" "}
                      {Number(p.solde_virtuel).toFixed(2)} $
                    </p>
                  </div>

                  {p.id !== currentUserId && (
                    <button
                      onClick={() => handleDeleteUser(p.id, p.pseudo)}
                      disabled={deletingId === p.id}
                      className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/30 disabled:opacity-50"
                    >
                      {deletingId === p.id ? "Suppression..." : "🗑️ Supprimer"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
