"use client";

import { useState } from "react";
import PixPayment from "@/components/PixPayment";

export default function CheckoutInfinitePay({
  checkoutUrl,
  chavePix,
}: {
  checkoutUrl: string;
  chavePix: string;
}) {
  const [mostrarPixManual, setMostrarPixManual] = useState(false);

  return (
    <div className="space-y-4">
      <a
        href={checkoutUrl}
        className="block w-full rounded-md bg-[var(--orange)] py-4 text-center font-display text-lg font-bold uppercase tracking-wide text-white shadow-[0_4px_0_var(--orange-deep)] transition active:translate-y-1 active:shadow-[0_1px_0_var(--orange-deep)]"
      >
        💳 Pagar agora (Pix ou cartão)
      </a>
      <p className="text-center text-xs text-[var(--ink-soft)]">
        Você vai ser levado para o checkout seguro da InfinitePay. Depois de
        pagar, volte pra essa página — a confirmação é automática.
      </p>

      <button
        type="button"
        onClick={() => setMostrarPixManual((v) => !v)}
        className="w-full text-center text-xs font-semibold text-[var(--ink-soft)] underline underline-offset-2"
      >
        {mostrarPixManual ? "Ocultar chave PIX manual" : "Prefere pagar direto com a chave PIX?"}
      </button>

      {mostrarPixManual && (
        <div className="perforation pt-4">
          <PixPayment chavePix={chavePix} />
        </div>
      )}
    </div>
  );
}
