# 🍊 Pedido de Laranjas — MVP (Fase 1 + Fase 2)

Sistema de pedidos de sacos de laranja: formulário → cálculo automático →
pedido salvo no Supabase → tela de pagamento PIX.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS 4
- Supabase (Postgres) — só acessado pelo servidor, via `service_role` key

## O que está pronto

**Fase 1 — Site**
- `/` — tela inicial com formulário (nome, setor, telefone, quantidade)
- Cálculo automático do total (`quantidade × R$ 5,00`) em tempo real
- Validação de todos os campos (client-side e, de novo, no servidor)
- `/pagamento/[id]` — resumo do pedido + chave PIX com botão copiar + espaço
  reservado para o QR Code

**Fase 2 — Banco**
- `supabase/schema.sql` com a tabela `pedidos` (todas as colunas descritas no
  planejamento: status de pagamento, status de entrega, prazo de 2 dias, campos
  `order_nsu`/`transaction_nsu` já reservados para a Fase 4/InfinitePay)
- `POST /api/pedidos` — cria o pedido (preço sempre calculado no servidor,
  nunca confiado do cliente)
- `GET /api/pedidos/[id]` — busca um pedido

## Rodando o projeto

1. **Instale as dependências** (já feito neste ambiente, mas para rodar do zero):
   ```bash
   npm install
   ```

2. **Crie um projeto no [supabase.com](https://supabase.com)** (gratuito) e rode
   o conteúdo de `supabase/schema.sql` no SQL Editor do projeto.

3. **Configure as variáveis de ambiente**:
   ```bash
   cp .env.local.example .env.local
   ```
   Preencha com os dados do seu projeto (Project Settings → API):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (a *service_role*, não a `anon` — fica só no
     servidor, nunca é enviada ao navegador)
   - `PIX_KEY` — a chave PIX que aparece na tela de pagamento

4. **Rode em desenvolvimento**:
   ```bash
   npm run dev
   ```
   Acesse http://localhost:3000

5. **Build de produção** (já testado neste ambiente, compila sem erros):
   ```bash
   npm run build
   npm start
   ```

## Sobre o QR Code

Ainda não incluí a imagem do QR Code (o arquivo anexado no planejamento original
não veio junto). Para adicionar:
1. Salve a imagem em `public/qrcode-pix.png`
2. Em `components/PixPayment.tsx`, troque o bloco de placeholder por:
   ```tsx
   import Image from "next/image";
   <Image src="/qrcode-pix.png" alt="QR Code PIX" width={200} height={200} />
   ```
Antes de colocar em produção, confira se o conteúdo do QR Code realmente
corresponde à chave PIX configurada — o próprio planejamento original chamava
atenção pra isso.

## Segurança / decisões importantes

- **O preço nunca vem do cliente.** O total é sempre `quantidade × R$ 5,00`,
  calculado dentro de `app/api/pedidos/route.ts`. Mesmo que alguém manipule o
  request, o valor gravado é sempre o correto.
- **RLS habilitado, sem policies.** A tabela `pedidos` fica travada por padrão.
  Toda leitura/escrita passa pelas API routes usando a `service_role` key
  (que ignora RLS). O cliente (browser) nunca fala direto com o Supabase.
  Quando o painel admin (Fase 3) tiver login, adicione policies específicas
  em vez de abrir acesso público.
- **Ninguém marca o próprio pedido como pago pelo site** — isso é proposital,
  seguindo o planejamento original: por enquanto não existe nenhuma rota para
  isso. Vai entrar na Fase 3 (painel admin) e Fase 4 (webhook InfinitePay).

## Próximos passos sugeridos (Fase 3 e 4, ainda não implementadas)

- Painel `/admin` com login, listagem de pedidos, marcar entregue/pago manualmente
- Job/cron para virar `PENDENTE` → `ATRASADO` depois do `prazo_pagamento`
- Checkout InfinitePay + webhook para confirmar pagamento automaticamente
- Envio automático de WhatsApp (via WhatsApp Business API) e e-mail (via Resend)
  a cada novo pedido / mudança de status
