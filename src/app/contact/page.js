"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Sidebar } from "@/components/Sidebar";

export default function ContactPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      setEmail(userData.user.email);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("pseudo, is_admin")
        .eq("id", userData.user.id)
        .maybeSingle();

      setPseudo(profileData?.pseudo || "");
      setIsAdmin(!!profileData?.is_admin);
      setLoading(false);
    }
    loadUser();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSending(true);

    const { data: userData } = await supabase.auth.getUser();

    const { error: insertError } = await supabase
      .from("contact_messages")
      .insert({
        user_id: userData.user.id,
        pseudo,
        email,
        sujet,
        message,
      });

    if (insertError) {
      setSending(false);
      setError("Une erreur est survenue, réessaie plus tard.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    fetch("/api/notify-contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pseudo, email, sujet, message }),
    }).catch((err) => console.error("Notification error:", err));

    setSending(false);
    setSent(true);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <p>Chargement...</p>
      </main>
    );
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Sidebar isAdmin={isAdmin} />
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center p-4 pb-28 pt-24 text-center sm:pt-28 lg:pt-32">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <span className="text-4xl">✅</span>
            <p className="mt-3 text-lg font-semibold">
              Votre message a bien été envoyé.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Notre équipe vous répondra prochainement.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-block rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 font-medium text-white shadow-md transition hover:scale-105"
            >
              Retour au dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar isAdmin={isAdmin} />
      <div className="mx-auto max-w-lg p-4 pb-28 pt-24 sm:p-6 sm:pb-28 sm:pt-28 lg:p-8 lg:pb-8 lg:pt-28">
        <h1 className="mb-8 text-2xl font-extrabold sm:text-3xl">📩 Contact</h1>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {error && (
            <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="mb-4">
            <label className="mb-1 block text-sm text-slate-500">
              Nom / pseudo
            </label>
            <input
              type="text"
              required
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-violet-400"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm text-slate-500">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-violet-400"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm text-slate-500">Sujet</label>
            <input
              type="text"
              required
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              placeholder="Ex : Problème avec mon retrait"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-violet-400"
            />
          </div>

          <div className="mb-6">
            <label className="mb-1 block text-sm text-slate-500">
              Message
            </label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-violet-400"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 font-semibold text-white shadow-md transition hover:scale-[1.02] disabled:opacity-50"
          >
            {sending ? "Envoi..." : "ENVOYER LE MESSAGE"}
          </button>
        </form>
      </div>
    </div>
  );
}