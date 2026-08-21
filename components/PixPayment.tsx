"use client";

import { useState } from "react";

export default function PixPayment({ chavePix }: { chavePix: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(chavePix);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-sm font-semibold text-[var(--ink-soft)]">Chave PIX</p>
        <p className="rounded-md border-2 border-dashed border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-center font-mono text-lg tracking-wide">
          {chavePix}
        </p>
      </div>

      <button
        type="button"
        onClick={copiar}
        className="w-full rounded-md border-2 border-[var(--ink)] py-3 text-center font-semibold uppercase tracking-wide transition active:scale-[0.99]"
      >
        {copiado ? "✅ Chave copiada!" : "📋 Copiar chave PIX"}
      </button>

      <div>
        <p className="mb-2 text-center text-sm font-semibold text-[var(--ink-soft)]">
          Ou escaneie o QR Code para pagar
        </p>
        <div className="mx-auto flex aspect-square w-48 items-center justify-center rounded-md border-2 border-dashed border-[var(--line)] bg-[var(--paper)] p-4 text-center text-xs text-[var(--ink-soft)]">
          <img
  src="/public/qr-code-pix.png"
  alt="QR Code PIX"
  className="w-full h-full object-contain"
/>
        </div>
      </div>

      <p className="text-center text-xs text-[var(--ink-soft)]">
        Após pagar, aguarde a confirmação — o status muda para 🟢 assim que o pagamento for
        conferido.
      </p>
    </div>
  );
}
