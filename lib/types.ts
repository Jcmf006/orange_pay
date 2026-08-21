export type StatusPagamento = "PENDENTE" | "PAGO" | "ATRASADO";
export type StatusEntrega = "PENDENTE" | "ENTREGUE";

export interface Pedido {
  id: number;
  nome: string;
  setor: string;
  telefone: string;
  quantidade_sacos: number;
  valor_unitario: number;
  valor_total: number;
  status_pagamento: StatusPagamento;
  status_entrega: StatusEntrega;
  data_pedido: string;
  data_pagamento: string | null;
  data_entrega: string | null;
  prazo_pagamento: string;
  order_nsu: string | null;
  transaction_nsu: string | null;
  checkout_url: string | null;
}

export interface NovoPedidoInput {
  nome: string;
  setor: string;
  telefone: string;
  quantidade_sacos: number;
}

export const PRECO_SACO = 5.0;
