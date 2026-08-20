-- Pedidos de Laranjas — schema inicial (Fase 1 + Fase 2)
-- Rode isso no SQL Editor do seu projeto Supabase.

create table if not exists pedidos (
  id                 bigint generated always as identity primary key,
  nome               text not null,
  setor              text not null,
  telefone           text not null,
  quantidade_sacos   integer not null check (quantidade_sacos > 0),
  valor_unitario     numeric(10,2) not null default 5.00,
  valor_total        numeric(10,2) not null,
  status_pagamento   text not null default 'PENDENTE'
                       check (status_pagamento in ('PENDENTE', 'PAGO', 'ATRASADO')),
  status_entrega     text not null default 'PENDENTE'
                       check (status_entrega in ('PENDENTE', 'ENTREGUE')),
  data_pedido        timestamptz not null default now(),
  data_pagamento     timestamptz,
  data_entrega       timestamptz,
  prazo_pagamento    timestamptz not null default (now() + interval '2 days'),
  order_nsu          text,        -- usado na Fase 4, para relacionar com InfinitePay
  transaction_nsu    text         -- idem
);

create index if not exists pedidos_status_pagamento_idx on pedidos (status_pagamento);
create index if not exists pedidos_data_pedido_idx on pedidos (data_pedido desc);

-- RLS: a tabela fica travada por padrão. Nesta fase, todo acesso (criar pedido,
-- ler o pedido para mostrar a tela de pagamento) passa pelas API routes do
-- Next.js usando a service_role key, que ignora RLS. Não exponha a
-- service_role key no cliente. Quando o painel admin (Fase 3) tiver login,
-- adicione policies específicas para o usuário autenticado em vez de abrir
-- select/update para o anon key.
alter table pedidos enable row level security;
