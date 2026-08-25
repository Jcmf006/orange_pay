"use client";

import { useMemo, useState } from "react";
import type { Pedido, StatusEntrega, StatusPagamento } from "@/lib/types";
import { formatBRL } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

type FiltroPagamento = "TODOS" | StatusPagamento;

const FILTROS: { label: string; value: FiltroPagamento }[] = [
  { label: "Todos", value: "TODOS" },
  { label: "🟡 Pendente", value: "PENDENTE" },
  { label: "🟢 Pago", value: "PAGO" },
  { label: "🔴 Atrasado", value: "ATRASADO" },
];

export default function PainelPedidos({ pedidosIniciais }: { pedidosIniciais: Pedido[] }) {
  const [pedidos, setPedidos] = useState(pedidosIniciais);
  const [filtro, setFiltro] = useState<FiltroPagamento>("TODOS");
  const [busca, setBusca] = useState("");
  const [atualizandoId, setAtualizandoId] = useState<number | null>(null);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [verificandoAtraso, setVerificandoAtraso] = useState(false);
  const [mensagemAtraso, setMensagemAtraso] = useState<string | null>(null);

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return pedidos.filter((p) => {
      if (filtro !== "TODOS" && p.status_pagamento !== filtro) return false;
      if (termo && !p.nome.toLowerCase().includes(termo) && !p.setor.toLowerCase().includes(termo))
        return false;
      return true;
    });
  }, [pedidos, filtro, busca]);

  const resumo = useMemo(() => {
    const totalPedidos = pedidos.length;
    const totalSacos = pedidos.reduce((soma, p) => soma + p.quantidade_sacos, 0);
    const aReceber = pedidos
      .filter((p) => p.status_pagamento !== "PAGO")
      .reduce((soma, p) => soma + p.valor_total, 0);
    const recebido = pedidos
      .filter((p) => p.status_pagamento === "PAGO")
      .reduce((soma, p) => soma + p.valor_total, 0);
    return { totalPedidos, totalSacos, aReceber, recebido };
  }, [pedidos]);

  async function atualizarStatus(
    id: number,
    campo: "status_pagamento" | "status_entrega",
    valor: StatusPagamento | StatusEntrega
  ) {
    setAtualizandoId(id);
    try {
      const res = await fetch(`/api/admin/pedidos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [campo]: valor }),
      });
      if (!res.ok) throw new Error();
      const { pedido, removido } = await res.json();
      setPedidos((prev) =>
        removido ? prev.filter((p) => p.id !== id) : prev.map((p) => (p.id === id ? pedido : p))
      );
    } catch {
      alert("Não foi possível atualizar esse pedido. Tente de novo.");
    } finally {
      setAtualizandoId(null);
    }
  }

  async function verificarAtrasados() {
    setVerificandoAtraso(true);
    setMensagemAtraso(null);
    try {
      const res = await fetch("/api/admin/atraso", { method: "POST" });
      if (!res.ok) throw new Error();
      const { atualizados } = (await res.json()) as { atualizados: Pedido[] };

      if (atualizados.length > 0) {
        setPedidos((prev) =>
          prev.map((p) => atualizados.find((a) => a.id === p.id) ?? p)
        );
      }
      setMensagemAtraso(
        atualizados.length === 0
          ? "Nenhum pedido novo atrasado."
          : `${atualizados.length} pedido(s) marcado(s) como atrasado.`
      );
    } catch {
      setMensagemAtraso("Não foi possível verificar agora. Tente de novo.");
    } finally {
      setVerificandoAtraso(false);
    }
  }

  async function excluirPedido(pedido: Pedido) {
    const confirmado = window.confirm(
      `Excluir o pedido de ${pedido.nome}? Essa ação não pode ser desfeita.`
    );
    if (!confirmado) return;

    setExcluindoId(pedido.id);
    try {
      const res = await fetch(`/api/admin/pedidos/${pedido.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPedidos((prev) => prev.filter((p) => p.id !== pedido.id));
    } catch {
      alert("Não foi possível excluir esse pedido. Tente de novo.");
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CardResumo label="Pedidos" valor={String(resumo.totalPedidos)} />
        <CardResumo label="Sacos" valor={String(resumo.totalSacos)} />
        <CardResumo label="A receber" valor={formatBRL(resumo.aReceber)} destaque />
        <CardResumo label="Recebido" valor={formatBRL(resumo.recebido)} verde />
      </div>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Buscar por nome ou setor…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full rounded-md border-2 border-[var(--line)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--orange)]"
        />
        <div className="flex flex-wrap items-center gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition ${
                filtro === f.value
                  ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                  : "border-[var(--line)] text-[var(--ink-soft)]"
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={verificarAtrasados}
            disabled={verificandoAtraso}
            className="ml-auto rounded-full border-2 border-dashed border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-soft)] transition disabled:opacity-60"
          >
            {verificandoAtraso ? "Verificando…" : "🔄 Verificar atrasados"}
          </button>
        </div>
        {mensagemAtraso && (
          <p className="text-xs text-[var(--ink-soft)]">{mensagemAtraso}</p>
        )}
      </div>

      {listaFiltrada.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--ink-soft)]">
          Nenhum pedido encontrado.
        </p>
      ) : (
        <ul className="space-y-3">
          {listaFiltrada.map((p) => (
            <li key={p.id} className="ticket p-4 pt-6 pb-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                    #{String(p.id).padStart(6, "0")} ·{" "}
                    {new Date(p.data_pedido).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="font-display text-lg font-bold truncate">{p.nome}</p>
                  <p className="text-sm text-[var(--ink-soft)]">{p.setor}</p>
                  <p className="font-mono text-sm text-[var(--ink-soft)]">{p.telefone}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status={p.status_pagamento} />
                  <span className="font-mono text-lg font-bold text-[var(--orange-deep)]">
                    {formatBRL(p.valor_total)}
                  </span>
                  <span className="text-xs text-[var(--ink-soft)]">
                    {p.quantidade_sacos} saco{p.quantidade_sacos > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="perforation mt-4 pt-4 flex flex-wrap items-center gap-2">
                {p.status_pagamento !== "PAGO" ? (
                  <BotaoAcao
                    disabled={atualizandoId === p.id}
                    onClick={() => atualizarStatus(p.id, "status_pagamento", "PAGO")}
                  >
                    ✅ Marcar como pago
                  </BotaoAcao>
                ) : (
                  <BotaoAcao
                    variante="secundario"
                    disabled={atualizandoId === p.id}
                    onClick={() => atualizarStatus(p.id, "status_pagamento", "PENDENTE")}
                  >
                    Desfazer pagamento
                  </BotaoAcao>
                )}

                {p.status_entrega !== "ENTREGUE" ? (
                  <BotaoAcao
                    variante="secundario"
                    disabled={atualizandoId === p.id}
                    onClick={() => atualizarStatus(p.id, "status_entrega", "ENTREGUE")}
                  >
                    📦 Marcar como entregue
                  </BotaoAcao>
                ) : (
                  <span className="text-xs font-semibold text-[var(--leaf)]">
                    📦 Entregue em {new Date(p.data_entrega!).toLocaleDateString("pt-BR")}
                  </span>
                )}

                <BotaoAcao
                  variante="perigo"
                  disabled={atualizandoId === p.id || excluindoId === p.id}
                  onClick={() => excluirPedido(p)}
                >
                  🗑️ Excluir
                </BotaoAcao>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CardResumo({
  label,
  valor,
  destaque,
  verde,
}: {
  label: string;
  valor: string;
  destaque?: boolean;
  verde?: boolean;
}) {
  return (
    <div className="ticket p-3 pt-5 pb-4 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
        {label}
      </p>
      <p
        className={`font-mono text-base font-bold ${
          destaque ? "text-[var(--orange-deep)]" : verde ? "text-[var(--leaf)]" : ""
        }`}
      >
        {valor}
      </p>
    </div>
  );
}

function BotaoAcao({
  children,
  onClick,
  disabled,
  variante = "primario",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variante?: "primario" | "secundario" | "perigo";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
        variante === "primario"
          ? "bg-[var(--leaf)] text-white"
          : variante === "perigo"
            ? "border-2 border-[var(--red)] text-[var(--red)]"
            : "border-2 border-[var(--line)] text-[var(--ink-soft)]"
      }`}
    >
      {children}
    </button>
  );
}
