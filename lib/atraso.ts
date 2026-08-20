import { supabaseAdmin } from "@/lib/supabase-server";
import type { Pedido } from "@/lib/types";

/**
 * Marca como ATRASADO todo pedido que:
 *  - ainda está PENDENTE (nunca foi pago)
 *  - e o prazo_pagamento já passou
 *
 * Nunca mexe em pedidos PAGO ou já ATRASADO.
 */
export async function marcarPedidosAtrasados(): Promise<{ atualizados: Pedido[] }> {
  const { data, error } = await supabaseAdmin()
    .from("pedidos")
    .update({ status_pagamento: "ATRASADO" })
    .eq("status_pagamento", "PENDENTE")
    .lt("prazo_pagamento", new Date().toISOString())
    .select()
    .returns<Pedido[]>();

  if (error) {
    throw new Error(`Falha ao marcar pedidos atrasados: ${error.message}`);
  }

  return { atualizados: data ?? [] };
}
