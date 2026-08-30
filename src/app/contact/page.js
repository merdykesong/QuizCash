"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ContactPage() {
  const router = useRouter();
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
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
        .select("pseudo")
        .eq("id", userData.user.id)
        .single();

      setPseudo(profileData?.pseudo || "");
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

    setSending(false);

    if (insertError) {
      setError("Une erreur est survenue, réessaie plus tard.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 px-4 text-center text-white">
        <div className="animate-question flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <span className="text-4xl">✅</span>
          <p className="text-lg font-semibold">
            Votre message a bien été envoyé.
          </p>
          <p className="text-sm text-slate-400">
            Notre équipe vous répondra prochainement.
          </p>
          <Link
            href="/dashboard"
            className="mt-2 rounded-lg bg-indigo-500 px-6 py-3 font-medium transition hover:scale-105 hover:bg-indigo-400"
          >
            Retour au dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">📩 Contact</h1>
          <Link
            href="/help"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
          >
            Retour à l'aide
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
        >
          {error && (
            <p className="mb-4 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="mb-4">
            <label className="mb-1 block text-sm text-slate-300">
              Nom / pseudo
            </label>
            <input
              type="text"
              required
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-indigo-400"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm text-slate-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-indigo-400"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm text-slate-300">Sujet</label>
            <input
              type="text"
              required
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              placeholder="Ex : Problème avec mon retrait"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-indigo-400"
            />
          </div>

          <div className="mb-6">
            <label className="mb-1 block text-sm text-slate-300">
              Message
            </label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-indigo-400"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-xl bg-indigo-500 py-3 font-semibold transition hover:scale-[1.02] hover:bg-indigo-400 disabled:opacity-50"
          >
            {sending ? "Envoi..." : "ENVOYER LE MESSAGE"}
          </button>
        </form>
      </div>
    </main>
  );
}
