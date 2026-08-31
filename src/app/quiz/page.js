"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const TIME_PER_QUESTION = 10;
const DAILY_LIMIT = 5;

const CATEGORY_ICONS = {
  "Mathématiques": "🔢",
  "Histoire": "🏛️",
  "Géographie": "🌍",
  "Sciences": "🔬",
  "Sport": "⚽",
  "Technologie": "💻",
  "Culture générale": "🧠",
  "Musique": "🎵",
  "Littérature": "📚",
  "Casse-tête": "🧩",
};

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || "❓";
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function QuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blockedMessage, setBlockedMessage] = useState("");
  const [countdown, setCountdown] = useState("");
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const answeredRef = useRef(false);
  const submittedRef = useRef(false);

  // Vérifie la limite quotidienne, puis charge des questions via la fonction anti-répétition
  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("parties")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userData.user.id)
        .gte("created_at", startOfDay.toISOString());

      if (count !== null && count >= DAILY_LIMIT) {
        setBlockedMessage(
          `Limite quotidienne de ${DAILY_LIMIT} parties atteinte. Reviens demain !`
        );
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc("obtenir_questions_quiz");

      if (error || !data || data.length === 0) {
        console.error(error);
        setLoading(false);
        return;
      }

      const shuffled = shuffle(data);
      setQuestions(shuffled);
      setLoading(false);
    }

    init();
  }, [router]);

  useEffect(() => {
    if (!blockedMessage) return;

    function updateCountdown() {
      const now = new Date();
      const nextMidnight = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 1,
          0,
          0,
          0
        )
      );
      const diff = nextMidnight.getTime() - now.getTime();

      const hours = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(
        2,
        "0"
      );
      const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(
        2,
        "0"
      );

      setCountdown(`${hours}:${minutes}:${seconds}`);
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [blockedMessage]);

  const goToNext = useCallback(() => {
    setCurrentIndex((i) => {
      if (i + 1 < questions.length) {
        return i + 1;
      }
      setFinished(true);
      return i;
    });
  }, [questions.length]);

  function recordAnswer(choiceLetter) {
    if (answeredRef.current) return;
    answeredRef.current = true;

    const current = questions[currentIndex];

    setAnswers((prev) => [
      ...prev,
      { question_id: current.id, choix: choiceLetter },
    ]);

    goToNext();
  }

  useEffect(() => {
    if (loading || finished || questions.length === 0) return;
    answeredRef.current = false;
    setTimeLeft(TIME_PER_QUESTION);
  }, [currentIndex, loading, finished, questions.length]);

  useEffect(() => {
    if (loading || finished || questions.length === 0) return;

    if (timeLeft <= 0) {
      recordAnswer(null);
      return;
    }

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, loading, finished, questions.length]);

  useEffect(() => {
    if (!finished || submittedRef.current) return;
    submittedRef.current = true;

    async function submit() {
      setSubmitting(true);
      const { data, error } = await supabase.rpc("soumettre_partie", {
        reponses: answers,
      });

      if (error) {
        console.error(error);
        setSubmitError(error.message || "Une erreur est survenue.");
        setSubmitting(false);
        return;
      }

      setResult(data[0]);
      setSubmitting(false);
    }

    submit();
  }, [finished, answers]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p>Chargement...</p>
      </main>
    );
  }

  if (blockedMessage) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-4 text-white">
        <p className="max-w-sm text-center text-red-400">{blockedMessage}</p>
        <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-center">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Réinitialisation dans
          </p>
          <p className="mt-1 text-2xl font-bold text-indigo-300">
            {countdown || "..."}
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-lg bg-indigo-500 px-5 py-2 font-medium hover:bg-indigo-400"
        >
          Retour au dashboard
        </button>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-white">
        <p>Aucune question disponible pour le moment.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-lg border border-white/20 px-4 py-2 hover:bg-white/10"
        >
          Retour au dashboard
        </button>
      </main>
    );
  }

  if (finished) {
    if (submitError) {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-4 text-white">
          <p className="max-w-sm text-center text-red-400">{submitError}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg bg-indigo-500 px-5 py-2 font-medium hover:bg-indigo-400"
          >
            Retour au dashboard
          </button>
        </main>
      );
    }

    if (submitting || !result) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
          <p>Calcul du score...</p>
        </main>
      );
    }

    const total = questions.length;
    const bonnes = result.score;
    const mauvaises = total - bonnes;

    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 px-4 text-white">
        <div className="animate-question flex flex-col items-center gap-3">
          <h1 className="mb-2 text-3xl font-bold">Quiz terminé !</h1>

          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
            <p className="text-4xl font-extrabold text-indigo-400">
              {bonnes} / {total}
            </p>
            <p className="mt-1 text-sm text-slate-400">Score final</p>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-green-500/10 p-3">
                <p className="font-bold text-green-400">{bonnes}</p>
                <p className="text-slate-400">Bonnes réponses</p>
              </div>
              <div className="rounded-lg bg-red-500/10 p-3">
                <p className="font-bold text-red-400">{mauvaises}</p>
                <p className="text-slate-400">Mauvaises réponses</p>
              </div>
            </div>

            <p className="mt-5 text-lg">
              Pourcentage :{" "}
              <span className="font-bold">
                {Number(result.pourcentage).toFixed(2)}%
              </span>
            </p>
            <p className="mt-2 text-lg">
              Récompense :{" "}
              <span className="font-bold text-yellow-400">
                +{Number(result.recompense).toFixed(2)} $
              </span>
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 rounded-lg bg-indigo-500 px-6 py-3 font-medium transition hover:scale-105 hover:bg-indigo-400"
          >
            Retour au dashboard
          </button>
        </div>
      </main>
    );
  }

  const current = questions[currentIndex];
  const choices = [
    { letter: "a", text: current.choix_a },
    { letter: "b", text: current.choix_b },
    { letter: "c", text: current.choix_c },
    { letter: "d", text: current.choix_d },
  ];

  const isUrgent = timeLeft <= 5;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 px-4 text-white">
      <div key={currentIndex} className="animate-question w-full max-w-xl">
        <div className="mb-6 flex items-center justify-between text-sm text-slate-400">
          <span>
            Question {currentIndex + 1} / {questions.length}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
            <span>{getCategoryIcon(current.category)}</span>
            {current.category}
          </span>
        </div>

        <div className="mb-6 flex items-center justify-center">
          <div
            className={`rounded-full border-4 px-6 py-2 text-2xl font-bold transition-colors ${
              isUrgent
                ? "border-red-500 text-red-400"
                : "border-indigo-400 text-indigo-300"
            }`}
          >
            {timeLeft}s
          </div>
        </div>

        <h1 className="mb-8 text-2xl font-bold">{current.question}</h1>

        <div className="grid gap-3">
          {choices.map((choice) => (
            <button
              key={choice.letter}
              onClick={() => recordAnswer(choice.letter)}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-left transition hover:scale-[1.02] hover:border-indigo-400 hover:bg-white/10"
            >
              {choice.text}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}