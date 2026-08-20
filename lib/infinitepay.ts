import "server-only";
import type { Pedido } from "@/lib/types";

// Documentação oficial: https://ajuda.infinitepay.io/pt-BR/articles/10766888
const API_BASE = "https://api.checkout.infinitepay.io";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} precisa estar configurado em .env.local`);
  }
  return value;
}

function siteUrl(): string {
  // Sem barra no final.
  return getEnv("SITE_URL").replace(/\/+$/, "");
}

/**
 * URL do webhook que a InfinitePay vai chamar quando o pagamento acontecer.
 * A InfinitePay não assina o corpo da requisição do webhook (não existe HMAC
 * na API deles), então usamos um segredo na própria query string como uma
 * camada simples de proteção — só quem conhece esse valor consegue chamar
 * nosso endpoint de forma que ele seja aceito.
 */
function webhookUrlComSegredo(): string {
  const secret = getEnv("WEBHOOK_SECRET");
  return `${siteUrl()}/api/webhooks/infinitepay?secret=${encodeURIComponent(secret)}`;
}

interface CriarLinkResposta {
  url: string;
}

/**
 * Cria um link de pagamento (Pix ou cartão) na InfinitePay para o pedido.
 * Usa pedido.id como order_nsu — é assim que casamos o webhook de volta
 * com a linha certa na nossa tabela `pedidos`.
 */
export async function criarLinkPagamento(pedido: Pedido): Promise<string> {
  const handle = getEnv("INFINITEPAY_HANDLE");
  const valorEmCentavos = Math.round(pedido.valor_total * 100);

  const body = {
    handle,
    redirect_url: `${siteUrl()}/pagamento/${pedido.id}?retorno=1`,
    webhook_url: webhookUrlComSegredo(),
    order_nsu: String(pedido.id),
    customer: {
      name: pedido.nome,
      phone_number: `+55${pedido.telefone}`,
    },
    items: [
      {
        quantity: 1,
        price: valorEmCentavos,
        description: `${pedido.quantidade_sacos} saco(s) de laranja`,
      },
    ],
  };

  const res = await fetch(`${API_BASE}/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const texto = await res.text().catch(() => "");
    throw new Error(`InfinitePay recusou a criação do link (${res.status}): ${texto}`);
  }

  const data = (await res.json()) as CriarLinkResposta;
  if (!data.url) {
    throw new Error("InfinitePay não retornou uma URL de pagamento.");
  }
  return data.url;
}

interface VerificarPagamentoInput {
  orderNsu: string;
  transactionNsu: string;
  slug: string;
}

interface VerificarPagamentoResposta {
  success: boolean;
  paid: boolean;
  amount: number;
  paid_amount: number;
  installments: number;
  capture_method: "pix" | "credit_card";
}

/**
 * Confirma diretamente com a InfinitePay se um pagamento foi mesmo aprovado.
 * Usamos isso como segunda checagem sempre que o webhook chega, já que o
 * webhook em si não é assinado — não confiamos cegamente no corpo que
 * recebemos, confirmamos com o servidor da InfinitePay antes de marcar
 * o pedido como pago.
 */
export async function verificarPagamento(
  input: VerificarPagamentoInput
): Promise<VerificarPagamentoResposta> {
  const handle = getEnv("INFINITEPAY_HANDLE");

  const res = await fetch(`${API_BASE}/payment_check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle,
      order_nsu: input.orderNsu,
      transaction_nsu: input.transactionNsu,
      slug: input.slug,
    }),
  });

  if (!res.ok) {
    const texto = await res.text().catch(() => "");
    throw new Error(`Falha ao verificar pagamento na InfinitePay (${res.status}): ${texto}`);
  }

  return (await res.json()) as VerificarPagamentoResposta;
}
