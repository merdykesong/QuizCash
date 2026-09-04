"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Sidebar } from "@/components/Sidebar";

const FAQ = [
  {
    icon: "🎮",
    title: "Comment jouer ?",
    answer:
      "Depuis ton dashboard, clique sur \"Jouer maintenant\". Chaque partie contient 30 questions à choix multiples réparties sur plusieurs catégories. Choisis une réponse pour passer à la question suivante.",
  },
  {
    icon: "⏱️",
    title: "Comment fonctionne le chronomètre ?",
    answer:
      "Tu as un temps limité pour répondre à chaque question. Si le temps arrive à 0, la question est automatiquement comptée comme sans réponse et tu passes à la suivante.",
  },
  {
    icon: "🏆",
    title: "Comment fonctionne le score ?",
    answer:
      "Ton score est calculé sur 30 (nombre de bonnes réponses). Le calcul se fait de façon sécurisée sur nos serveurs à la fin de chaque partie, il ne peut pas être modifié depuis ton navigateur.",
  },
  {
    icon: "💰",
    title: "Comment fonctionnent les récompenses ?",
    answer:
      "À chaque partie, tu gagnes une récompense virtuelle ajoutée à ton solde. Tu peux consulter ton historique de récompenses depuis la page Récompenses.",
  },
  {
    icon: "💳",
    title: "Comment fonctionne le retrait ?",
    answer:
      "Une fois que ton solde atteint 10,00 $, tu peux faire une demande de retrait depuis la page Récompenses. Tu choisis le montant, la méthode, puis confirmes ta demande.",
  },
  {
    icon: "🔐",
    title: "Problème avec mon compte ?",
    answer:
      "Tu peux modifier ton pseudo ou ton mot de passe depuis la page Paramètres. Si tu n'arrives plus à te connecter ou si tu rencontres un autre souci de compte, utilise le formulaire de contact ci-dessous.",
  },
  {
    icon: "❓",
    title: "Autre problème ?",
    answer:
      "Si ta question ne figure pas ici, utilise le formulaire de contact plus bas : notre équipe te répondra dès que possible.",
  },
];

export default function HelpPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    async function load() {
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
      setIsAdmin(!!profileData?.is_admin);
      setLoading(false);
    }
    load();
  }, [router]);

  const filtered = FAQ.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="mx-auto max-w-2xl p-4 pb-28 pt-24 sm:p-6 sm:pb-28 sm:pt-28 lg:p-8 lg:pb-8 lg:pt-28">
        <h1 className="mb-1 text-2xl font-extrabold sm:text-3xl">
          🆘 Centre d'aide
        </h1>
        <p className="mb-6 text-slate-500">On répond à tes questions.</p>

        <input
          type="text"
          placeholder="Rechercher dans l'aide..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-6 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-violet-400"
        />

        <div className="flex flex-col gap-3">
          {filtered.length === 0 ? (
            <p className="text-slate-500">Aucun résultat pour "{search}".</p>
          ) : (
            filtered.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={item.title}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="flex items-center gap-3 font-medium">
                      <span className="text-xl">{item.icon}</span>
                      {item.title}
                    </span>
                    <span
                      className={`text-slate-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      ▾
                    </span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-600">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-8 rounded-3xl border border-violet-200 bg-violet-50 p-6 text-center">
          <p className="mb-3 text-slate-700">
            Tu n'as pas trouvé de réponse à ta question ?
          </p>
          <Link
            href="/contact"
            className="inline-block rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-md transition hover:scale-105"
          >
            📩 Nous contacter
          </Link>
        </div>
      </div>
    </div>
  );
}