-- Rode isso se sua tabela `pedidos` já existia ANTES da integração com a
-- InfinitePay (Fase 4). Se você está criando o banco do zero agora, não
-- precisa rodar isso — o schema.sql já vem com essa coluna.
--
-- Por que precisa disso: `create table if not exists` no schema.sql não
-- adiciona colunas novas a uma tabela que já existe — só cria do zero.

alter table pedidos
  add column if not exists checkout_url text;
