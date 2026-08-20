import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { Pedido } from "@/lib/types";
import ResumoPedido from "@/components/ResumoPedido";
import PixPayment from "@/components/PixPayment";
import CheckoutInfinitePay from "@/components/CheckoutInfinitePay";

export default async function PagamentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ retorno?: string }>;
}) {
  const { id } = await params;
  const { retorno } = await searchParams;
  const pedidoId = Number(id);
  if (!Number.isInteger(pedidoId)) notFound();

  const { data: pedido, error } = await supabaseAdmin()
    .from("pedidos")
    .select("*")
    .eq("id", pedidoId)
    .single<Pedido>();

  if (error || !pedido) notFound();

  const chavePix = process.env.PIX_KEY ?? "Configure PIX_KEY em .env.local";

  return (
    <main className="flex-1 flex justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-md rise-in">
        <header className="mb-8 text-center">
          <div className="mb-3 text-5xl">🍊</div>
          <h1 className="font-display text-2xl font-bold">
            {pedido.status_pagamento === "PAGO" ? "Pagamento confirmado!" : "Pedido registrado!"}
          </h1>
          <p className="mt-1 text-[var(--ink-soft)]">
            {pedido.status_pagamento === "PAGO"
              ? `Obrigado, ${pedido.nome}!`
              : `${pedido.nome}, seu pedido foi confirmado.`}
          </p>
        </header>

        {retorno === "1" && pedido.status_pagamento !== "PAGO" && (
          <div className="mb-4 rounded-md border-2 border-dashed border-[var(--peel)] bg-white px-4 py-3 text-center text-sm text-[var(--ink-soft)]">
            Recebemos seu retorno da InfinitePay. A confirmação pode levar
            alguns segundos — atualize a página se o status não mudar.
          </div>
        )}

        <div className="ticket p-6 pt-8 pb-8 space-y-6">
          <ResumoPedido pedido={pedido} />

          {pedido.status_pagamento !== "PAGO" && (
            <>
              <div className="perforation" />
              {pedido.checkout_url ? (
                <CheckoutInfinitePay checkoutUrl={pedido.checkout_url} chavePix={chavePix} />
              ) : (
                <PixPayment chavePix={chavePix} />
              )}
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm">
          <Link href="/" className="font-semibold text-[var(--orange-deep)] underline">
            Fazer outro pedido
          </Link>
        </p>
      </div>
    </main>
  );
}
