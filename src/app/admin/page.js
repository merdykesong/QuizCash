"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Sidebar } from "@/components/Sidebar";

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
  const [emailMap, setEmailMap] = useState({});
  const [recentGames, setRecentGames] = useState([]);
  const [filter, setFilter] = useState("toutes");
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [adjustingId, setAdjustingId] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustError, setAdjustError] = useState("");
  const [adjusting, setAdjusting] = useState(false);

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
      .maybeSingle();

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

    const { data: recentGamesData } = await supabase
      .from("parties")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    const map = {};
    (profilesData || []).forEach((p) => {
      map[p.id] = p.pseudo;
    });

    setPseudoMap(map);
    setRequests(requestsData || []);
    setProfiles(profilesData || []);
    setRecentGames(recentGamesData || []);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    try {
      const res = await fetch("/api/admin/list-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        const eMap = {};
        json.emails.forEach((u) => {
          eMap[u.id] = u.email;
        });
        setEmailMap(eMap);
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }

  async function updateStatus(id, newStatus) {
    const { error } = await supabase.rpc("admin_changer_statut_retrait", {
      p_request_id: id,
      p_nouveau_statut: newStatus,
    });

    if (error) {
      alert("Erreur: " + error.message);
      return;
    }

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

  async function handleAdjustBalance(userId, action) {
    setAdjustError("");
    const amount = Number(adjustAmount);
    if (!amount || amount <= 0) {
      setAdjustError("Entre un montant valide.");
      return;
    }

    setAdjusting(true);
    const { data, error } = await supabase.rpc("admin_ajuster_solde", {
      p_user_id: userId,
      p_montant: amount,
      p_action: action,
    });
    setAdjusting(false);

    if (error) {
      setAdjustError(error.message);
      return;
    }

    setProfiles((prev) =>
      prev.map((p) => (p.id === userId ? { ...p, solde_virtuel: data } : p))
    );
    setAdjustingId(null);
    setAdjustAmount("");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <p>Chargement...</p>
      </main>
    );
  }

  if (!authorized) return null;

  const filtered =
    filter === "toutes" ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar isAdmin={true} />
      <div className="mx-auto max-w-4xl p-4 pb-28 pt-24 sm:p-6 sm:pb-28 sm:pt-28 lg:p-8 lg:pb-8 lg:pt-28">
        <h1 className="mb-6 text-2xl font-extrabold sm:text-3xl">
          🛡️ Administration
        </h1>

        <div className="mb-8 flex flex-wrap gap-2">
          {[
            { key: "retraits", label: "💳 Retraits" },
            { key: "utilisateurs", label: "👥 Utilisateurs" },
            { key: "soldes", label: "💰 Soldes" },
            { key: "parties", label: "🎮 Parties récentes" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                tab === t.key
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
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
                      ? "bg-violet-600 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <p className="text-slate-500">Aucune demande dans cette catégorie.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map((r) => {
                  const isOpen = expandedId === r.id;
                  return (
                    <div
                      key={r.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      <button
                        onClick={() => setExpandedId(isOpen ? null : r.id)}
                        className="flex w-full flex-wrap items-center justify-between gap-2 px-5 py-4 text-left"
                      >
                        <span className="text-sm text-slate-400">#{r.id}</span>
                        <span className="font-medium">
                          {pseudoMap[r.user_id] || "Inconnu"}
                        </span>
                        <span className="font-bold text-violet-600">
                          {Number(r.montant).toFixed(2)} $
                        </span>
                        <span className="text-sm text-slate-400">{r.methode}</span>
                        <span className="text-sm text-slate-400">
                          {new Date(r.created_at).toLocaleDateString("fr-FR")}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                          {STATUS_LABELS[r.status].emoji}{" "}
                          {STATUS_LABELS[r.status].label}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="border-t border-slate-100 px-5 py-4">
                          <p className="mb-2 text-sm font-semibold text-slate-600">
                            Détails :
                          </p>
                          <pre className="mb-4 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                            {JSON.stringify(r.details, null, 2)}
                          </pre>

                          <label className="mb-1 block text-sm text-slate-500">
                            Changer le statut :
                          </label>
                          <select
                            value={r.status}
                            onChange={(e) => updateStatus(r.id, e.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
                          >
                            {Object.entries(STATUS_LABELS).map(([key, val]) => (
                              <option key={key} value={key}>
                                {val.emoji} {val.label}
                              </option>
                            ))}
                          </select>
                          {r.status === "refuse" && (
                            <p className="mt-2 text-xs text-emerald-600">
                              💡 Passer en "Refusé" rembourse automatiquement
                              l'utilisateur.
                            </p>
                          )}
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
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Nombre total d'utilisateurs
              </p>
              <p className="mt-1 text-3xl font-extrabold text-violet-600">
                {profiles.length}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {profiles.map((p) => {
                const isAdjusting = adjustingId === p.id;
                return (
                  <div
                    key={p.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {p.pseudo}
                          {p.id === currentUserId && (
                            <span className="ml-2 text-xs text-violet-500">
                              (toi)
                            </span>
                          )}
                          {p.is_admin && (
                            <span className="ml-2 text-xs text-amber-500">
                              admin
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400">{emailMap[p.id]}</p>
                        <p className="text-xs text-slate-400">
                          Inscrit le{" "}
                          {new Date(p.created_at).toLocaleDateString("fr-FR")} •{" "}
                          {p.parties_jouees} partie(s) • Solde{" "}
                          {Number(p.solde_virtuel).toFixed(2)} $
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setAdjustError("");
                            setAdjustAmount("");
                            setAdjustingId(isAdjusting ? null : p.id);
                          }}
                          className="rounded-xl bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-100"
                        >
                          💰 Ajuster solde
                        </button>

                        {p.id !== currentUserId && (
                          <button
                            onClick={() => handleDeleteUser(p.id, p.pseudo)}
                            disabled={deletingId === p.id}
                            className="rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            {deletingId === p.id ? "Suppression..." : "🗑️ Supprimer"}
                          </button>
                        )}
                      </div>
                    </div>

                    {isAdjusting && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        {adjustError && (
                          <p className="mb-2 text-sm text-red-500">{adjustError}</p>
                        )}
                        <label className="mb-1 block text-sm text-slate-500">
                          Montant ($)
                        </label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(e.target.value)}
                          className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAdjustBalance(p.id, "ajouter")}
                            disabled={adjusting}
                            className="flex-1 rounded-xl bg-emerald-50 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            ➕ Envoyer
                          </button>
                          <button
                            onClick={() => handleAdjustBalance(p.id, "retirer")}
                            disabled={adjusting}
                            className="flex-1 rounded-xl bg-red-50 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                          >
                            ➖ Retirer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "soldes" && (
          <div className="flex flex-col gap-2">
            {[...profiles]
              .sort((a, b) => Number(b.solde_virtuel) - Number(a.solde_virtuel))
              .map((p, index) => {
                const solde = Number(p.solde_virtuel);
                const eligible = solde >= 10;
                const proche = !eligible && solde >= 7;
                const pct = Math.min((solde / 10) * 100, 100);
                return (
                  <div
                    key={p.id}
                    className={`rounded-2xl border p-4 shadow-sm ${
                      eligible
                        ? "border-emerald-200 bg-emerald-50"
                        : proche
                        ? "border-amber-200 bg-amber-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        #{index + 1} — {p.pseudo}
                      </span>
                      <span className="font-bold">
                        {solde.toFixed(2)} $
                        {eligible && (
                          <span className="ml-2 text-xs text-emerald-600">
                            ✅ Peut retirer
                          </span>
                        )}
                        {proche && (
                          <span className="ml-2 text-xs text-amber-600">
                            🟠 Proche (10 $)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full ${
                          eligible ? "bg-emerald-400" : "bg-violet-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {tab === "parties" && (
          <div className="flex flex-col gap-2">
            {recentGames.length === 0 ? (
              <p className="text-slate-500">Aucune partie enregistrée.</p>
            ) : (
              recentGames.map((g) => (
                <div
                  key={g.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm shadow-sm"
                >
                  <span className="font-medium">
                    {pseudoMap[g.user_id] || "Inconnu"}
                  </span>
                  <span className="text-slate-400">
                    {new Date(g.created_at).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span>
                    Score : <strong>{g.score}/30</strong>
                  </span>
                  <span className="text-slate-400">
                    {g.solde_avant !== null
                      ? `${Number(g.solde_avant).toFixed(2)} $`
                      : "—"}{" "}
                    →{" "}
                    <span
                      className={
                        g.recompense > 0 ? "text-emerald-600" : "text-slate-400"
                      }
                    >
                      {g.solde_apres !== null
                        ? `${Number(g.solde_apres).toFixed(2)} $`
                        : "—"}
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      g.recompense > 0
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    +{Number(g.recompense).toFixed(2)} $
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}