import { Hero3D } from "@/components/Hero3D";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6 md:px-12">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <span className="text-xl font-bold tracking-tight">
            Quiz<span className="text-indigo-400">Cash</span>
          </span>
        </div>
        <nav className="flex gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            Se connecter
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
          >
            S'inscrire
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-3xl flex-col items-center px-6 pb-16 pt-10 text-center md:pb-24 md:pt-16">
        <Hero3D />
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
          Réponds à des quiz.
          <br />
          <span className="text-indigo-400">Gagne des récompenses.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-slate-300">
          QuizCash est un jeu de quiz sur des dizaines de sujets — maths,
          histoire, sciences, sport, culture générale et bien plus. Chaque
          partie compte 30 questions chronométrées, et ton score se transforme
          en récompense virtuelle.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-xl bg-indigo-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400"
          >
            Créer mon compte
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-white/20 px-8 py-3 text-base font-semibold text-slate-100 transition hover:bg-white/10"
          >
            J&apos;ai déjà un compte
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="mb-10 text-center text-2xl font-bold md:text-3xl">
          Comment ça marche
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <StepCard
            emoji="✍️"
            title="1. Inscris-toi"
            text="Crée ton compte gratuitement en quelques secondes."
          />
          <StepCard
            emoji="⏱️"
            title="2. Joue"
            text="30 questions, 15 secondes chacune. Réponds vite et bien."
          />
          <StepCard
            emoji="💰"
            title="3. Gagne"
            text="Ton score se transforme en récompense virtuelle sur ton profil."
          />
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} QuizCash — Version bêta, récompenses virtuelles uniquement.
      </footer>
    </main>
  );
}

function StepCard({ emoji, title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
      <div className="mb-3 text-3xl">{emoji}</div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-slate-300">{text}</p>
    </div>
  );
}
