"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Sidebar } from "@/components/Sidebar";

const EMOJIS = ["😀","😎","🤖","🦁","🐯","🦊","🐺","🐸","🐵","🦄","👽","🎮","🏆","🔥","⚡","🌟","💎","🎯","🚀","🧠","🍀","🐉","🦅","🐍"];

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [pseudo, setPseudo] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

      setEmail(userData.user.email);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("pseudo, avatar_emoji, is_admin")
        .eq("id", userData.user.id)
        .maybeSingle();

      setPseudo(profileData?.pseudo || "");
      setAvatarEmoji(profileData?.avatar_emoji || "");
      setIsAdmin(!!profileData?.is_admin);
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
    setMessage("");

    if (!currentPassword) {
      setMessage("Entre ton mot de passe actuel.");
      return;
    }
    if (newPassword.length < 6) {
      setMessage("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    setSavingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      current_password: currentPassword,
    });

    setSavingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage(error ? error.message : "Mot de passe mis à jour ✅");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
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
          ⚙️ Paramètres
        </h1>

        {message && (
          <p className="mb-6 rounded-xl bg-violet-50 px-4 py-2 text-sm text-violet-700">
            {message}
          </p>
        )}

        {/* Choisir un avatar */}
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">Choisir un avatar</h2>
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-3xl">
              {avatarEmoji || "?"}
            </div>
            <p className="text-sm text-slate-500">
              Choisis un emoji ci-dessous pour l'utiliser comme avatar.
            </p>
          </div>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSelectAvatar(emoji)}
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl transition hover:scale-110 ${
                  avatarEmoji === emoji
                    ? "border-2 border-violet-400 bg-violet-50"
                    : "border border-slate-200 bg-slate-50"
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
          className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-4 text-lg font-bold">Modifier mon profil</h2>
          <label className="mb-1 block text-sm text-slate-500">Pseudo</label>
          <input
            type="text"
            required
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-violet-400"
          />
          <button
            type="submit"
            disabled={savingPseudo}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 font-medium text-white shadow-sm transition hover:scale-[1.02] disabled:opacity-50"
          >
            {savingPseudo ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>

        {/* Changer le mot de passe */}
        <form
          onSubmit={handleUpdatePassword}
          className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-4 text-lg font-bold">Paramètres du compte</h2>

          <label className="mb-1 block text-sm text-slate-500">
            Mot de passe actuel
          </label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-violet-400"
          />

          <label className="mb-1 block text-sm text-slate-500">
            Nouveau mot de passe
          </label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-violet-400"
          />

          <label className="mb-1 block text-sm text-slate-500">
            Confirmer le nouveau mot de passe
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-violet-400"
          />

          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 font-medium text-white shadow-sm transition hover:scale-[1.02] disabled:opacity-50"
          >
            {savingPassword ? "Enregistrement..." : "Changer le mot de passe"}
          </button>
        </form>

        <button
          onClick={handleLogout}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
}