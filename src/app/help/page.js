"use client";

import { useState } from "react";
import Link from "next/link";

const FAQ = [
  {
    icon: "🎮",
    title: "Comment jouer et gagner?",
    answer:
      "Depuis ton dashboard, clique sur \"Jouer maintenant\". Chaque partie contient 30 questions à choix multiples réparties sur plusieurs catégories. Choisis une réponse pour passer à la question suivante.",
  },
  {
    icon: "⏱️",
    title: "Comment fonctionne le chronomètre ?",
    answer:
      "Tu as 10 secondes pour répondre à chaque question. Si le temps arrive à 0, la question est automatiquement comptée comme sans réponse et tu passes à la suivante.",
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
      "À chaque partie, tu gagnes une récompense réelle calculée ainsi : score ÷ 30. Par exemple, 20/30 donne 0,67 $. Cette récompense s'ajoute à ton solde virtuel visible sur ton dashboard.",
  },
  {
    icon: "💳",
    title: "Comment fonctionne le retrait ?",
    answer:
      "Une fois que ton solde  atteint 10,00 $, tu peux faire une demande de retrait depuis la page Récompenses. Pour cette version, les retraits sont faites directement  : vous aurez un transfert réel de votre argent rétiré.",
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
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState(null);

  const filtered = FAQ.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">🆘 Centre d'aide</h1>
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
          >
            Retour
          </Link>
        </div>

        <input
          type="text"
          placeholder="Rechercher dans l'aide..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-6 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-indigo-400"
        />

        <div className="flex flex-col gap-3">
          {filtered.length === 0 ? (
            <p className="text-slate-400">Aucun résultat pour "{search}".</p>
          ) : (
            filtered.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={item.title}
                  className="overflow-hidden rounded-xl border border-white/10 bg-white/5 transition"
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
                    <div className="animate-question border-t border-white/10 px-5 py-4 text-sm text-slate-300">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-10 rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-6 text-center">
          <p className="mb-3 text-slate-200">
            Tu n'as pas trouvé de réponse à ta question ?
          </p>
          <Link
            href="/contact"
            className="inline-block rounded-lg bg-indigo-500 px-6 py-3 font-semibold transition hover:scale-105 hover:bg-indigo-400"
          >
            📩 Nous contacter
          </Link>
        </div>
      </div>
    </main>
  );
}
