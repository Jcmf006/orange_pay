import { supabaseAdmin } from "@/lib/supabase-server";
import type { Pedido } from "@/lib/types";

const TUESDAY = 2;

export function calcularPrazoPagamento(dataPedido: string | Date): string {
  const prazo = new Date(dataPedido);
  prazo.setUTCHours(0, 0, 0, 0);
  prazo.setUTCDate(prazo.getUTCDate() + 1);

  while (prazo.getUTCDay() !== TUESDAY) {
    prazo.setUTCDate(prazo.getUTCDate() + 1);
  }

  prazo.setUTCDate(prazo.getUTCDate() + 2);
  prazo.setUTCHours(23, 59, 59, 999);
  return prazo.toISOString();
}

/**
 * Marca como ATRASADO todo pedido que:
 *  - ainda está PENDENTE (nunca foi pago)
 *  - e já passou o prazo calculado a partir da próxima terça-feira
 *
 * Nunca mexe em pedidos PAGO ou já ATRASADO.
 */
export async function marcarPedidosAtrasados(): Promise<{ atualizados: Pedido[] }> {
  const { data, error } = await supabaseAdmin()
    .from("pedidos")
    .select("*")
    .eq("status_pagamento", "PENDENTE")
    .returns<Pedido[]>();

  if (error) {
    throw new Error(`Falha ao marcar pedidos atrasados: ${error.message}`);
  }

  const agora = Date.now();
  const vencidos = (data ?? []).filter(
    (pedido) => agora > new Date(calcularPrazoPagamento(pedido.data_pedido)).getTime()
  );

  const atualizados = await Promise.all(
    vencidos.map(async (pedido) => {
      const prazo_pagamento = calcularPrazoPagamento(pedido.data_pedido);
      const { data: atualizado, error: updateError } = await supabaseAdmin()
        .from("pedidos")
        .update({ status_pagamento: "ATRASADO", prazo_pagamento })
        .eq("id", pedido.id)
        .eq("status_pagamento", "PENDENTE")
        .select()
        .single();

      if (updateError || !atualizado) {
        throw new Error(`Falha ao atualizar pedido atrasado: ${updateError?.message ?? "sem dados"}`);
      }
      return atualizado as Pedido;
    })
  );

  return { atualizados };
}
