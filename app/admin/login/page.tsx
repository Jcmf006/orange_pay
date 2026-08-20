"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErro(data.error ?? "Não foi possível entrar.");
        setEnviando(false);
        return;
      }

      const next = searchParams.get("next") || "/admin";
      router.push(next);
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="ticket p-6 pt-8 pb-8 space-y-5">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-[var(--ink-soft)]">
          Senha de admin
        </span>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoFocus
          className="w-full rounded-md border-2 border-[var(--line)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--orange)]"
        />
      </label>

      {erro && (
        <p role="alert" className="text-sm font-medium text-[var(--red)]">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-md bg-[var(--orange)] py-4 text-center font-display text-lg font-bold uppercase tracking-wide text-white shadow-[0_4px_0_var(--orange-deep)] transition active:translate-y-1 active:shadow-[0_1px_0_var(--orange-deep)] disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="flex-1 flex justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-md rise-in">
        <header className="mb-8 text-center">
          <div className="mb-3 text-5xl">🔐</div>
          <h1 className="font-display text-2xl font-bold">Painel administrativo</h1>
          <p className="mt-1 text-[var(--ink-soft)]">Pedido de Laranjas</p>
        </header>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
