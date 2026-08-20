import { NextRequest, NextResponse } from "next/server";
import { marcarPedidosAtrasados } from "@/lib/atraso";

// Chamado automaticamente pelo Vercel Cron (ver vercel.json) uma vez por dia.
// Protegido por CRON_SECRET: só aceita a chamada se vier com o cabeçalho
// Authorization: Bearer <CRON_SECRET>. O Vercel envia esse cabeçalho sozinho
// quando a variável de ambiente CRON_SECRET está configurada no projeto.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET não configurado no servidor." },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { atualizados } = await marcarPedidosAtrasados();
    return NextResponse.json({ ok: true, quantidade: atualizados.length });
  } catch (err) {
    console.error("Erro no cron de atraso:", err);
    return NextResponse.json({ error: "Falha ao processar." }, { status: 500 });
  }
}
