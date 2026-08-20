"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatBRL, formatTelefoneInput, validarPedido } from "@/lib/format";
import { PRECO_SACO } from "@/lib/types";

export default function FormularioPedido() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [setor, setSetor] = useState("");
  const [telefone, setTelefone] = useState("");
  const [quantidade, setQuantidade] = useState<number>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const total = useMemo(() => {
    const q = Number.isFinite(quantidade) ? quantidade : 0;
    return Math.round(q * PRECO_SACO * 100) / 100;
  }, [quantidade]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErroGeral(null);

    const { valid, errors: fieldErrors } = validarPedido({
      nome,
      setor,
      telefone,
      quantidade_sacos: quantidade,
    });
    setErrors(fieldErrors);
    if (!valid) return;

    setEnviando(true);
    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, setor, telefone, quantidade_sacos: quantidade }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErroGeral(data.error ?? "Não foi possível enviar o pedido.");
        setEnviando(false);
        return;
      }

      router.push(`/pagamento/${data.pedido.id}`);
    } catch {
      setErroGeral("Falha de conexão. Verifique sua internet e tente de novo.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="ticket p-6 pt-8 pb-8 space-y-5">
      <Campo label="Nome completo" error={errors.nome}>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ana Silva"
          autoComplete="name"
          className={inputClass(!!errors.nome)}
        />
      </Campo>

      <Campo label="Setor que trabalha" error={errors.setor}>
        <input
          type="text"
          value={setor}
          onChange={(e) => setSetor(e.target.value)}
          placeholder="Ex.: Administrativo"
          className={inputClass(!!errors.setor)}
        />
      </Campo>

      <Campo label="Número de telefone" error={errors.telefone}>
        <input
          type="tel"
          inputMode="numeric"
          value={telefone}
          onChange={(e) => setTelefone(formatTelefoneInput(e.target.value))}
          placeholder="(79) 99999-9999"
          autoComplete="tel"
          className={`${inputClass(!!errors.telefone)} font-mono`}
        />
      </Campo>

      <Campo label="Quantidade de sacos" error={errors.quantidade_sacos}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Diminuir quantidade"
            onClick={() => setQuantidade((q) => Math.max(1, (q || 1) - 1))}
            className="h-11 w-11 shrink-0 rounded-full border-2 border-[var(--ink)] text-xl font-bold leading-none active:scale-95 transition"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={500}
            value={quantidade}
            onChange={(e) => setQuantidade(parseInt(e.target.value, 10) || 0)}
            className={`${inputClass(!!errors.quantidade_sacos)} text-center font-mono text-lg`}
          />
          <button
            type="button"
            aria-label="Aumentar quantidade"
            onClick={() => setQuantidade((q) => Math.min(500, (q || 0) + 1))}
            className="h-11 w-11 shrink-0 rounded-full border-2 border-[var(--ink)] text-xl font-bold leading-none active:scale-95 transition"
          >
            +
          </button>
        </div>
      </Campo>

      <div className="perforation pt-5 space-y-1">
        <div className="flex items-baseline justify-between text-sm text-[var(--ink-soft)]">
          <span>Valor por saco</span>
          <span className="font-mono">{formatBRL(PRECO_SACO)}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-display text-lg">Total do pedido</span>
          <span className="font-mono text-3xl font-bold text-[var(--orange-deep)]">
            {formatBRL(total)}
          </span>
        </div>
      </div>

      {erroGeral && (
        <p role="alert" className="text-sm font-medium text-[var(--red)]">
          {erroGeral}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-md bg-[var(--orange)] py-4 text-center font-display text-lg font-bold uppercase tracking-wide text-white shadow-[0_4px_0_var(--orange-deep)] transition active:translate-y-1 active:shadow-[0_1px_0_var(--orange-deep)] disabled:opacity-60 disabled:active:translate-y-0"
      >
        {enviando ? "Enviando…" : "🟠 Finalizar pedido"}
      </button>
    </form>
  );
}

function Campo({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-[var(--ink-soft)]">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-[var(--red)]">{error}</span>}
    </label>
  );
}

function inputClass(hasError: boolean) {
  return `w-full rounded-md border-2 bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--orange)] ${
    hasError ? "border-[var(--red)]" : "border-[var(--line)]"
  }`;
}
