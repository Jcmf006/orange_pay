import FormularioPedido from "@/components/FormularioPedido";

export default function Home() {
  return (
    <main className="flex-1 flex justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-md rise-in">
        <header className="mb-8 text-center">
          <div className="mb-3 text-5xl">🍊</div>
          <h1 className="font-display text-3xl font-bold text-[var(--ink)]">
            Pedido de Laranjas
          </h1>
          <p className="mt-2 text-[var(--ink-soft)]">
            Faça seu pedido de forma rápida e fácil.
          </p>
        </header>

        <FormularioPedido />

        <p className="mt-6 text-center text-xs text-[var(--ink-soft)]">
          Depois de finalizar, você verá a chave PIX e o QR Code para pagamento.
        </p>
      </div>
    </main>
  );
}
