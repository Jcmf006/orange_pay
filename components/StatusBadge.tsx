import type { StatusPagamento } from "@/lib/types";

const CONFIG: Record<
  StatusPagamento,
  { label: string; dot: string; className: string }
> = {
  PENDENTE: {
    label: "Pendente",
    dot: "🟡",
    className: "text-[var(--peel)] border-[var(--peel)]",
  },
  PAGO: {
    label: "Pago",
    dot: "🟢",
    className: "text-[var(--leaf)] border-[var(--leaf)]",
  },
  ATRASADO: {
    label: "Atrasado",
    dot: "🔴",
    className: "text-[var(--red)] border-[var(--red)]",
  },
};

export default function StatusBadge({ status }: { status: StatusPagamento }) {
  const c = CONFIG[status];
  return (
    <span
      className={`stamp inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider font-mono ${c.className}`}
    >
      <span aria-hidden>{c.dot}</span>
      {c.label}
    </span>
  );
}
