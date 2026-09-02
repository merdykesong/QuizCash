"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

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
  const [loading, setLoading] = useState(true);
  const [solde, setSolde] = useState(0);
  const [activeRequest, setActiveRequest] = useState(null);
  const [history, setHistory] = useState([]);
  const [step, setStep] = useState("methods");
  const [selectedMethod, setSelectedMethod] = useState(null);
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
      .select("solde_virtuel")
      .eq("id", userData.user.id)
      .single();

    const { data: requests } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .order("created_at", { ascending: false });

    setSolde(Number(profileData?.solde_virtuel ?? 0));

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

  function fieldsAreValid() {
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
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p>Chargement...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">💳 Retrait</h1>
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
          >
            Retour
          </Link>
        </div>

        {confirmed && (
          <div className="animate-question mb-6 rounded-2xl border border-green-400/30 bg-green-400/10 p-6 text-center backdrop-blur">
            <p className="mb-1 text-lg font-semibold text-green-300">
              ✅ Retrait confirmé !
            </p>
            <p className="text-sm text-slate-200">
              Vous recevrez votre argent retiré sous peu.
            </p>
          </div>
        )}

        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Solde disponible
          </p>
          <p className="mt-1 text-4xl font-extrabold text-yellow-400">
            {solde.toFixed(2)} $
          </p>
        </div>

        {/* Cas 1 : une demande est déjà en cours */}
        {activeRequest && (
          <div className="animate-question rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
            <p className="mb-2 text-lg font-semibold">
              Demande de retrait envoyée.
            </p>
            <p className="mb-1 text-sm text-slate-400">
              Méthode :{" "}
              {METHODS.find((m) => m.id === activeRequest.methode)?.label}
            </p>
            <p className="mb-3 text-sm text-slate-400">
              Montant : {Number(activeRequest.montant).toFixed(2)} $
            </p>
            <span className="inline-block rounded-full bg-white/10 px-4 py-1 text-sm">
              {STATUS_LABELS[activeRequest.status].emoji}{" "}
              {STATUS_LABELS[activeRequest.status].label}
            </span>
          </div>
        )}

        {/* Cas 2 : solde insuffisant */}
        {!activeRequest && solde < MIN_WITHDRAWAL && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
            <p className="mb-3 font-semibold text-slate-200">
              Solde minimum requis : {MIN_WITHDRAWAL.toFixed(2)} $
            </p>
            <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-indigo-500 transition-all"
                style={{
                  width: `${Math.min((solde / MIN_WITHDRAWAL) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="mb-3 text-sm text-slate-400">
              {solde.toFixed(2)} $ / {MIN_WITHDRAWAL.toFixed(2)} $
            </p>
            <p className="text-sm text-indigo-300">
              Encore {(MIN_WITHDRAWAL - solde).toFixed(2)} $ pour pouvoir
              demander un retrait.
            </p>
          </div>
        )}

        {/* Cas 3 : éligible, choix de la méthode */}
        {!activeRequest && solde >= MIN_WITHDRAWAL && step === "methods" && (
          <div>
            <h2 className="mb-4 text-lg font-semibold">
              Choisissez votre méthode de retrait
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMethod(m.id);
                    setFields({});
                    setConfirmed(false);
                    setStep("form");
                  }}
                  className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-5 transition hover:scale-[1.02] hover:border-indigo-400 hover:bg-white/10"
                >
                  <span className="text-2xl">{m.icon}</span>
                  <span className="text-sm font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cas 3b : formulaire selon la méthode */}
        {!activeRequest && step === "form" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <button
              onClick={() => setStep("methods")}
              className="mb-4 text-sm text-slate-400 hover:text-white"
            >
              ← Changer de méthode
            </button>

            <h2 className="mb-4 text-lg font-semibold">
              {METHODS.find((m) => m.id === selectedMethod)?.label}
            </h2>

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
                  <label className="mb-1 block text-sm text-slate-300">
                    Opérateur
                  </label>
                  <select
                    value={fields.operateur || ""}
                    onChange={(e) =>
                      handleFieldChange("operateur", e.target.value)
                    }
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-indigo-400"
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
              className="mt-5 w-full rounded-xl bg-indigo-500 py-3 font-semibold transition hover:scale-[1.02] hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuer
            </button>
          </div>
        )}

        {/* Cas 3c : récapitulatif */}
        {!activeRequest && step === "recap" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            {error && (
              <p className="mb-4 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <h2 className="mb-4 text-lg font-semibold">Récapitulatif</h2>

            <div className="mb-5 flex flex-col gap-2 text-sm">
              <p>
                <span className="text-slate-400">Méthode : </span>
                {METHODS.find((m) => m.id === selectedMethod)?.label}
              </p>
              <p>
                <span className="text-slate-400">Montant : </span>
                {solde.toFixed(2)} $
              </p>
              <div className="text-slate-400">
                Informations (masquées partiellement) :
                <ul className="mt-1 ml-4 list-disc text-slate-300">
                  {Object.entries(fields).map(([key, value]) => (
                    <li key={key}>{mask(String(value))}</li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mb-4 text-xs text-slate-500">
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
                className="flex-1 rounded-xl border border-white/20 py-3 font-medium hover:bg-white/10"
              >
                Modifier
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 rounded-xl bg-indigo-500 py-3 font-semibold hover:bg-indigo-400 disabled:opacity-50"
              >
                {submitting ? "Envoi..." : "CONFIRMER LA DEMANDE"}
              </button>
            </div>
          </div>
        )}

        {/* Historique */}
        {history.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-3 text-lg font-semibold">
              Historique des demandes
            </h2>
            <div className="flex flex-col gap-2">
              {history.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
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
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                    {STATUS_LABELS[r.status].emoji}{" "}
                    {STATUS_LABELS[r.status].label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-slate-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-indigo-400"
      />
    </div>
  );
}