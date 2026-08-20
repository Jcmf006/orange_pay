import { NextResponse } from "next/server";
import { marcarPedidosAtrasados } from "@/lib/atraso";

// Protegido pelo proxy.ts (mesma sessão de admin usada em /admin).
// Permite rodar a verificação de atraso na hora, sem esperar o cron diário.
export async function POST() {
  try {
    const { atualizados } = await marcarPedidosAtrasados();
    return NextResponse.json({ ok: true, atualizados });
  } catch (err) {
    console.error("Erro ao marcar pedidos atrasados:", err);
    return NextResponse.json({ error: "Falha ao processar." }, { status: 500 });
  }
}
