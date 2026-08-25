import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { StatusEntrega, StatusPagamento } from "@/lib/types";

const STATUS_PAGAMENTO: StatusPagamento[] = ["PENDENTE", "PAGO", "ATRASADO"];
const STATUS_ENTREGA: StatusEntrega[] = ["PENDENTE", "ENTREGUE"];

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pedidoId = Number(id);
  if (!Number.isInteger(pedidoId)) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("pedidos")
    .delete()
    .eq("id", pedidoId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Erro ao excluir pedido:", error);
    return NextResponse.json({ error: "Não foi possível excluir o pedido." }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ removido: true, id: pedidoId });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pedidoId = Number(id);
  if (!Number.isInteger(pedidoId)) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const { status_pagamento, status_entrega } = body as {
    status_pagamento?: string;
    status_entrega?: string;
  };

  const update: Record<string, unknown> = {};

  if (status_pagamento !== undefined) {
    if (!STATUS_PAGAMENTO.includes(status_pagamento as StatusPagamento)) {
      return NextResponse.json({ error: "status_pagamento inválido." }, { status: 422 });
    }
    update.status_pagamento = status_pagamento;
    update.data_pagamento = status_pagamento === "PAGO" ? new Date().toISOString() : null;
  }

  if (status_entrega !== undefined) {
    if (!STATUS_ENTREGA.includes(status_entrega as StatusEntrega)) {
      return NextResponse.json({ error: "status_entrega inválido." }, { status: 422 });
    }
    update.status_entrega = status_entrega;
    update.data_entrega = status_entrega === "ENTREGUE" ? new Date().toISOString() : null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("pedidos")
    .update(update)
    .eq("id", pedidoId)
    .select()
    .single();

  if (error || !data) {
    console.error("Erro ao atualizar pedido:", error);
    return NextResponse.json({ error: "Não foi possível atualizar o pedido." }, { status: 500 });
  }

  if (data.status_pagamento === "PAGO" && data.status_entrega === "ENTREGUE") {
    const { error: deleteError } = await supabaseAdmin()
      .from("pedidos")
      .delete()
      .eq("id", pedidoId);

    if (deleteError) {
      console.error("Erro ao apagar pedido concluído:", deleteError);
      return NextResponse.json(
        { error: "Pedido atualizado, mas não foi possível apagá-lo." },
        { status: 500 }
      );
    }

    return NextResponse.json({ pedido: null, removido: true });
  }

  return NextResponse.json({ pedido: data });
}
