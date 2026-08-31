"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const EMOJIS = ["😀","😎","🤖","🦁","🐯","🦊","🐺","🐸","🐵","🦄","👽","🎮","🏆","🔥","⚡","🌟","💎","🎯","🚀","🧠","🍀","🐉","🦅","🐍"];

export default function SettingsPage() {
  const router = useRouter();
  const [pseudo, setPseudo] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingPseudo, setSavingPseudo] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("pseudo, avatar_emoji")
        .eq("id", userData.user.id)
        .single();

      setPseudo(profileData?.pseudo || "");
      setAvatarEmoji(profileData?.avatar_emoji || "");
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSelectAvatar(emoji) {
    setAvatarEmoji(emoji);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_emoji: emoji })
      .eq("id", userData.user.id);

    setMessage(error ? "Erreur lors de la mise à jour." : "Avatar mis à jour ✅");
  }

  async function handleUpdatePseudo(e) {
    e.preventDefault();
    setSavingPseudo(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("profiles")
      .update({ pseudo })
      .eq("id", userData.user.id);

    setSavingPseudo(false);
    setMessage(error ? "Erreur lors de la mise à jour." : "Pseudo mis à jour ✅");
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setMessage("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setSavingPassword(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setSavingPassword(false);
    setNewPassword("");
    setMessage(error ? error.message : "Mot de passe mis à jour ✅");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
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
          <h1 className="text-3xl font-bold">⚙️ Paramètres</h1>
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
          >
            Retour
          </Link>
        </div>

        {message && (
          <p className="mb-6 rounded-lg bg-white/10 px-4 py-2 text-sm">
            {message}
          </p>
        )}

        {/* Choisir un avatar */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold">Choisir un avatar</h2>
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500 text-3xl">
              {avatarEmoji || "?"}
            </div>
            <p className="text-sm text-slate-400">
              Choisis un emoji ci-dessous pour l'utiliser comme avatar.
            </p>
          </div>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSelectAvatar(emoji)}
                className={`flex h-11 w-11 items-center justify-center rounded-lg text-xl transition hover:scale-110 ${
                  avatarEmoji === emoji
                    ? "border-2 border-indigo-400 bg-indigo-500/20"
                    : "border border-white/10 bg-white/5"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Modifier le pseudo */}
        <form
          onSubmit={handleUpdatePseudo}
          className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <h2 className="mb-4 text-lg font-semibold">Modifier mon profil</h2>
          <label className="mb-1 block text-sm text-slate-300">Pseudo</label>
          <input
            type="text"
            required
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            className="mb-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-indigo-400"
          />
          <button
            type="submit"
            disabled={savingPseudo}
            className="rounded-lg bg-indigo-500 px-5 py-2 font-medium hover:bg-indigo-400 disabled:opacity-50"
          >
            {savingPseudo ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>

        {/* Changer le mot de passe */}
        <form
          onSubmit={handleUpdatePassword}
          className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <h2 className="mb-4 text-lg font-semibold">Paramètres du compte</h2>
          <label className="mb-1 block text-sm text-slate-300">
            Nouveau mot de passe
          </label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mb-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-indigo-400"
          />
          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-lg bg-indigo-500 px-5 py-2 font-medium hover:bg-indigo-400 disabled:opacity-50"
          >
            {savingPassword ? "Enregistrement..." : "Changer le mot de passe"}
          </button>
        </form>

        <button
          onClick={handleLogout}
          className="w-full rounded-xl border border-white/20 py-3 font-semibold text-slate-200 transition hover:bg-white/10"
        >
          Déconnexion
        </button>
      </div>
    </main>
  );
}
