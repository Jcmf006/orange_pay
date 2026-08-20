import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verificarPagamento } from "@/lib/infinitepay";
import type { Pedido } from "@/lib/types";

interface WebhookPayload {
  invoice_slug?: string;
  amount?: number;
  paid_amount?: number;
  installments?: number;
  capture_method?: string;
  transaction_nsu?: string;
  order_nsu?: string;
  receipt_url?: string;
}

// A InfinitePay espera uma resposta rápida com um destes formatos:
//   200 { success: true,  message: null }   -> tudo certo
//   400 { success: false, message: "..." }  -> algo errado (eles tentam de novo)
function ok() {
  return NextResponse.json({ success: true, message: null }, { status: 200 });
}
function erro(message: string) {
  return NextResponse.json({ success: false, message }, { status: 400 });
}

export async function POST(req: NextRequest) {
  // Camada 1 de proteção: segredo na query string. A InfinitePay não assina
  // o corpo do webhook, então sem isso qualquer pessoa que descobrisse essa
  // URL poderia forjar uma notificação de "pagamento aprovado".
  const secretRecebido = req.nextUrl.searchParams.get("secret");
  if (!process.env.WEBHOOK_SECRET || secretRecebido !== process.env.WEBHOOK_SECRET) {
    return erro("Não autorizado.");
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return erro("JSON inválido.");
  }

  const { order_nsu, transaction_nsu, invoice_slug } = payload;

  if (!order_nsu || !transaction_nsu || !invoice_slug) {
    return erro("Campos obrigatórios ausentes (order_nsu, transaction_nsu, invoice_slug).");
  }

  const pedidoId = Number(order_nsu);
  if (!Number.isInteger(pedidoId)) {
    return erro("order_nsu não corresponde a um pedido válido.");
  }

  const { data: pedido, error: fetchError } = await supabaseAdmin()
    .from("pedidos")
    .select("*")
    .eq("id", pedidoId)
    .single<Pedido>();

  if (fetchError || !pedido) {
    return erro("Pedido não encontrado.");
  }

  // Idempotência: se um webhook duplicado chegar (a InfinitePay reenvia em
  // caso de erro 400), não processa de novo.
  if (pedido.status_pagamento === "PAGO") {
    return ok();
  }

  // Camada 2 de proteção: em vez de confiar direto no corpo recebido,
  // confirmamos o pagamento consultando a própria InfinitePay.
  let confirmacao;
  try {
    confirmacao = await verificarPagamento({
      orderNsu: order_nsu,
      transactionNsu: transaction_nsu,
      slug: invoice_slug,
    });
  } catch (err) {
    console.error("Erro ao confirmar pagamento na InfinitePay:", err);
    // Responde 400 para a InfinitePay tentar de novo mais tarde.
    return erro("Não foi possível confirmar o pagamento agora.");
  }

  if (!confirmacao.success || !confirmacao.paid) {
    return erro("Pagamento não confirmado como aprovado.");
  }

  const valorEsperadoCentavos = Math.round(pedido.valor_total * 100);
  if (confirmacao.amount !== valorEsperadoCentavos) {
    console.error(
      `Divergência de valor no pedido #${pedidoId}: esperado ${valorEsperadoCentavos}, recebido ${confirmacao.amount}`
    );
    return erro("Valor do pagamento não confere com o pedido.");
  }

  const { error: updateError } = await supabaseAdmin()
    .from("pedidos")
    .update({
      status_pagamento: "PAGO",
      data_pagamento: new Date().toISOString(),
      order_nsu,
      transaction_nsu,
    })
    .eq("id", pedidoId);

  if (updateError) {
    console.error("Erro ao atualizar pedido após confirmar pagamento:", updateError);
    return erro("Falha ao gravar a confirmação de pagamento.");
  }

  return ok();
}
