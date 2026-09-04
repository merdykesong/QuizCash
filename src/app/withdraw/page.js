"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Sidebar } from "@/components/Sidebar";

const MIN_WITHDRAWAL = 10;

const STATUS_LABELS = {
  en_attente: { emoji: "🟡", label: "En attente" },
  en_cours: { emoji: "🔵", label: "En cours de traitement" },
  approuve: { emoji: "🟢", label: "Approuvé" },
  refuse: { emoji: "🔴", label: "Refusé" },
  termine: { emoji: "✅", label: "Terminé" },
};

const METHODS = [
  { id: "banque", icon: "🏦", label: "Compte bancaire" },
  { id: "paypal", icon: "💸", label: "PayPal" },
  { id: "mobile_money", icon: "📱", label: "Mobile Money" },
  { id: "autre", icon: "✨", label: "Autre méthode" },
];

function mask(value) {
  if (!value) return "";
  if (value.length <= 4) return "*".repeat(value.length);
  return value.slice(0, 2) + "*".repeat(value.length - 4) + value.slice(-2);
}

export default function WithdrawPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [solde, setSolde] = useState(0);
  const [activeRequest, setActiveRequest] = useState(null);
  const [history, setHistory] = useState([]);
  const [step, setStep] = useState("methods");
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [montant, setMontant] = useState("");
  const [fields, setFields] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

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
      .select("solde_virtuel, is_admin")
      .eq("id", userData.user.id)
      .maybeSingle();

    const { data: requests } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .order("created_at", { ascending: false });

    setSolde(Number(profileData?.solde_virtuel ?? 0));
    setIsAdmin(!!profileData?.is_admin);

    const pending = (requests || []).find((r) =>
      ["en_attente", "en_cours"].includes(r.status)
    );
    setActiveRequest(pending || null);
    setHistory(requests || []);
    setLoading(false);
  }

  function handleFieldChange(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function montantIsValid() {
    const m = Number(montant);
    return montant !== "" && m >= MIN_WITHDRAWAL && m <= solde;
  }

  function fieldsAreValid() {
    if (!montantIsValid()) return false;
    if (selectedMethod === "banque") {
      return fields.nom_titulaire && fields.nom_banque && fields.numero_compte;
    }
    if (selectedMethod === "paypal") {
      return !!fields.email_paypal;
    }
    if (selectedMethod === "mobile_money") {
      return (
        fields.operateur && fields.numero_telephone && fields.nom_titulaire
      );
    }
    if (selectedMethod === "autre") {
      return !!fields.description;
    }
    return false;
  }

  async function handleConfirm() {
    setSubmitting(true);
    setError("");

    const { data, error: rpcError } = await supabase.rpc("demander_retrait", {
      p_methode: selectedMethod,
      p_details: fields,
      p_montant: Number(montant),
    });

    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message || "Une erreur est survenue.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    fetch("/api/notify-withdrawal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        pseudo: fields.nom_titulaire || fields.email_paypal || "Utilisateur",
        montant: data[0].montant,
        methode: selectedMethod,
      }),
    }).catch((err) => console.error("Notification error:", err));

    await loadData();
    setConfirmed(true);
    setStep("methods");
    setSelectedMethod(null);
    setFields({});
    setMontant("");
  }

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
      <div className="mx-auto max-w-lg p-4 pb-28 pt-24 sm:p-6 sm:pb-28 sm:pt-28 lg:p-8 lg:pb-8 lg:pt-28">
        <h1 className="mb-8 text-2xl font-extrabold sm:text-3xl">
          💳 Retrait
        </h1>

        {confirmed && (
          <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <p className="mb-1 text-lg font-semibold text-emerald-700">
              ✅ Retrait confirmé !
            </p>
            <p className="text-sm text-emerald-600">
              Vous recevrez votre argent retiré sous peu.
            </p>
          </div>
        )}

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Solde disponible
          </p>
          <p className="mt-1 text-4xl font-extrabold text-violet-600">
            {solde.toFixed(2)} $
          </p>
        </div>

        {activeRequest && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="mb-2 text-lg font-semibold">
              Demande de retrait envoyée.
            </p>
            <p className="mb-1 text-sm text-slate-500">
              Méthode :{" "}
              {METHODS.find((m) => m.id === activeRequest.methode)?.label}
            </p>
            <p className="mb-3 text-sm text-slate-500">
              Montant : {Number(activeRequest.montant).toFixed(2)} $
            </p>
            <span className="inline-block rounded-full bg-slate-100 px-4 py-1 text-sm">
              {STATUS_LABELS[activeRequest.status].emoji}{" "}
              {STATUS_LABELS[activeRequest.status].label}
            </span>
          </div>
        )}

        {!activeRequest && solde < MIN_WITHDRAWAL && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="mb-3 font-semibold text-slate-700">
              Solde minimum requis : {MIN_WITHDRAWAL.toFixed(2)} $
            </p>
            <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
                style={{
                  width: `${Math.min((solde / MIN_WITHDRAWAL) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="mb-3 text-sm text-slate-500">
              {solde.toFixed(2)} $ / {MIN_WITHDRAWAL.toFixed(2)} $
            </p>
            <p className="text-sm text-violet-600">
              Encore {(MIN_WITHDRAWAL - solde).toFixed(2)} $ pour pouvoir
              demander un retrait.
            </p>
          </div>
        )}

        {!activeRequest && solde >= MIN_WITHDRAWAL && step === "methods" && (
          <div>
            <h2 className="mb-4 text-lg font-bold">
              Choisissez votre méthode de retrait
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMethod(m.id);
                    setFields({});
                    setMontant("");
                    setConfirmed(false);
                    setStep("form");
                  }}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm transition hover:scale-[1.02] hover:border-violet-300"
                >
                  <span className="text-2xl">{m.icon}</span>
                  <span className="text-sm font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!activeRequest && step === "form" && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <button
              onClick={() => setStep("methods")}
              className="mb-4 text-sm text-slate-400 hover:text-slate-700"
            >
              ← Changer de méthode
            </button>

            <h2 className="mb-4 text-lg font-bold">
              {METHODS.find((m) => m.id === selectedMethod)?.label}
            </h2>

            <div className="mb-4">
              <label className="mb-1 block text-sm text-slate-500">
                Montant à retirer (min. {MIN_WITHDRAWAL.toFixed(2)} $, max.{" "}
                {solde.toFixed(2)} $)
              </label>
              <input
                type="number"
                min={MIN_WITHDRAWAL}
                max={solde}
                step="0.01"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-violet-400"
              />
              {montant !== "" && !montantIsValid() && (
                <p className="mt-1 text-xs text-red-500">
                  Le montant doit être entre {MIN_WITHDRAWAL.toFixed(2)} $ et{" "}
                  {solde.toFixed(2)} $.
                </p>
              )}
            </div>

            {selectedMethod === "banque" && (
              <div className="flex flex-col gap-3">
                <Field
                  label="Nom du titulaire"
                  value={fields.nom_titulaire || ""}
                  onChange={(v) => handleFieldChange("nom_titulaire", v)}
                />
                <Field
                  label="Nom de la banque"
                  value={fields.nom_banque || ""}
                  onChange={(v) => handleFieldChange("nom_banque", v)}
                />
                <Field
                  label="Numéro de compte"
                  value={fields.numero_compte || ""}
                  onChange={(v) => handleFieldChange("numero_compte", v)}
                />
              </div>
            )}

            {selectedMethod === "paypal" && (
              <Field
                label="Adresse email PayPal"
                type="email"
                value={fields.email_paypal || ""}
                onChange={(v) => handleFieldChange("email_paypal", v)}
              />
            )}

            {selectedMethod === "mobile_money" && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="mb-1 block text-sm text-slate-500">
                    Opérateur
                  </label>
                  <select
                    value={fields.operateur || ""}
                    onChange={(e) =>
                      handleFieldChange("operateur", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-violet-400"
                  >
                    <option value="">-- Choisir --</option>
                    <option value="Airtel money">Airtel money</option>
                    <option value="M-pesa">M-pesa</option>
                    <option value="Orange money">Orange money</option>
                    <option value="Africell money">Africell money</option>
                  </select>
                </div>
                <Field
                  label="Numéro de téléphone"
                  value={fields.numero_telephone || ""}
                  onChange={(v) => handleFieldChange("numero_telephone", v)}
                />
                <Field
                  label="Nom du titulaire"
                  value={fields.nom_titulaire || ""}
                  onChange={(v) => handleFieldChange("nom_titulaire", v)}
                />
              </div>
            )}

            {selectedMethod === "autre" && (
              <Field
                label="Précisez votre méthode"
                value={fields.description || ""}
                onChange={(v) => handleFieldChange("description", v)}
              />
            )}

            <button
              disabled={!fieldsAreValid()}
              onClick={() => setStep("recap")}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 font-semibold text-white shadow-md transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuer
            </button>
          </div>
        )}

        {!activeRequest && step === "recap" && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {error && (
              <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <h2 className="mb-4 text-lg font-bold">Récapitulatif</h2>

            <div className="mb-5 flex flex-col gap-2 text-sm">
              <p>
                <span className="text-slate-500">Méthode : </span>
                {METHODS.find((m) => m.id === selectedMethod)?.label}
              </p>
              <p>
                <span className="text-slate-500">Montant : </span>
                {Number(montant).toFixed(2)} $
              </p>
              <div className="text-slate-500">
                Informations (masquées partiellement) :
                <ul className="mt-1 ml-4 list-disc text-slate-700">
                  {Object.entries(fields).map(([key, value]) => (
                    <li key={key}>{mask(String(value))}</li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mb-4 text-xs text-slate-400">
              Rappel : cette version est ultra sécurisée et ne stocke aucune
              information sensible. Les détails de votre méthode de retrait
              sont uniquement utilisés pour traiter votre demande de retrait
              et ne sont pas conservés. Ne partagez jamais vos informations
              sensibles avec des tiers mais aussi écrivez-les correctement
              pour éviter tout problème de traitement de retrait.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("form")}
                className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-600 hover:bg-slate-50"
              >
                Modifier
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 font-semibold text-white shadow-md hover:scale-[1.02] disabled:opacity-50"
              >
                {submitting ? "Envoi..." : "CONFIRMER LA DEMANDE"}
              </button>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-3 text-lg font-bold">
              Historique des demandes
            </h2>
            <div className="flex flex-col gap-2">
              {history.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
                >
                  <div>
                    <p className="font-medium">
                      {Number(r.montant).toFixed(2)} $ —{" "}
                      {METHODS.find((m) => m.id === r.methode)?.label}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(r.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                    {STATUS_LABELS[r.status].emoji}{" "}
                    {STATUS_LABELS[r.status].label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-slate-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-violet-400"
      />
    </div>
  );
}