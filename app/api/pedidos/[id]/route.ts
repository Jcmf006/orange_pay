import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(
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
    .select("*")
    .eq("id", pedidoId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ pedido: data });
}
