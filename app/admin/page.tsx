import { supabaseAdmin } from "@/lib/supabase-server";
import type { Pedido } from "@/lib/types";
import PainelPedidos from "@/components/admin/PainelPedidos";
import LogoutButton from "@/components/admin/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { data, error } = await supabaseAdmin()
    .from("pedidos")
    .select("*")
    .order("data_pedido", { ascending: false })
    .returns<Pedido[]>();

  const pedidos = error || !data ? [] : data;

  return (
    <main className="flex-1 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-2xl rise-in">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">🍊 Painel de pedidos</h1>
            {error && (
              <p className="text-sm text-[var(--red)]">
                Não foi possível carregar os pedidos agora.
              </p>
            )}
          </div>
          <LogoutButton />
        </header>

        <PainelPedidos pedidosIniciais={pedidos} />
      </div>
    </main>
  );
}
