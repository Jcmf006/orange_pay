import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { validarPedido, telefoneParaDigitos } from "@/lib/format";
import { PRECO_SACO } from "@/lib/types";
import type { Pedido } from "@/lib/types";
import { criarLinkPagamento } from "@/lib/infinitepay";
import { calcularPrazoPagamento } from "@/lib/atraso";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const input = body as {
    nome?: string;
    setor?: string;
    telefone?: string;
    quantidade_sacos?: number;
  };

  const nome = (input.nome ?? "").trim();
  const setor = (input.setor ?? "").trim();
  const telefone = telefoneParaDigitos(input.telefone ?? "");
  const quantidade_sacos = Number(input.quantidade_sacos);

  const { valid, errors } = validarPedido({
    nome,
    setor,
    telefone,
    quantidade_sacos,
  });

  if (!valid) {
    return NextResponse.json({ error: "Dados inválidos.", fields: errors }, { status: 422 });
  }

  // O preço nunca vem do cliente — é sempre calculado aqui no servidor.
  const valor_unitario = PRECO_SACO;
  const valor_total = Math.round(valor_unitario * quantidade_sacos * 100) / 100;

  const { data, error } = await supabaseAdmin()
    .from("pedidos")
    .insert({
      nome,
      setor,
      telefone,
      quantidade_sacos,
      valor_unitario,
      valor_total,
      prazo_pagamento: calcularPrazoPagamento(new Date()),
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar pedido:", error);
    return NextResponse.json(
      { error: "Não foi possível registrar o pedido. Tente novamente." },
      { status: 500 }
    );
  }

  // Gera o link de pagamento na InfinitePay (Pix + cartão). Isso é
  // "best-effort": se a InfinitePay estiver fora do ar ou as variáveis de
  // ambiente não estiverem configuradas, o pedido já foi salvo mesmo assim —
  // a tela de pagamento cai automaticamente no modo de chave PIX manual.
  let checkoutUrl: string | null = null;
  try {
    checkoutUrl = await criarLinkPagamento(data as Pedido);
    await supabaseAdmin().from("pedidos").update({ checkout_url: checkoutUrl }).eq("id", data.id);
  } catch (err) {
    console.error("Não foi possível criar o link de pagamento na InfinitePay:", err);
  }

  // Fase 4 cuidará do envio automático para WhatsApp/e-mail a partir daqui.

  return NextResponse.json({ pedido: { ...data, checkout_url: checkoutUrl } }, { status: 201 });
}
