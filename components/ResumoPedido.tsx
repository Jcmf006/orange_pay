import type { Pedido } from "@/lib/types";
import { formatBRL } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

export default function ResumoPedido({ pedido }: { pedido: Pedido }) {
  const prazo = new Date(pedido.prazo_pagamento).toLocaleDateString("pt-BR");

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
            Pedido #{String(pedido.id).padStart(6, "0")}
          </p>
          <p className="font-display text-xl font-bold">{pedido.nome}</p>
          <p className="text-sm text-[var(--ink-soft)]">{pedido.setor}</p>
        </div>
        <StatusBadge status={pedido.status_pagamento} />
      </div>

      <div className="perforation pt-4 space-y-1.5 font-mono text-sm">
        <Linha label="Sacos de laranja" valor={String(pedido.quantidade_sacos)} />
        <Linha label="Valor unitário" valor={formatBRL(pedido.valor_unitario)} />
        <Linha
          label="Total"
          valor={formatBRL(pedido.valor_total)}
          destaque
        />
      </div>

      <p className="text-center text-xs text-[var(--ink-soft)]">
        Pague até <span className="font-semibold text-[var(--ink)]">{prazo}</span> para evitar
        o status 🔴 atrasado.
      </p>
    </div>
  );
}

function Linha({
  label,
  valor,
  destaque,
}: {
  label: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="font-sans text-[var(--ink-soft)]">{label}</span>
      <span className={destaque ? "text-lg font-bold text-[var(--orange-deep)]" : ""}>
        {valor}
      </span>
    </div>
  );
}
