// Autenticação simples de admin: um único usuário, sem tabela de usuários.
// O "login" é apenas a senha em ADMIN_PASSWORD. Depois de autenticar, guardamos
// um token assinado (HMAC-SHA256) num cookie httpOnly. Isso é suficiente para
// um painel interno de uso único — se no futuro precisar de múltiplos admins
// com permissões diferentes, migre para Supabase Auth.

const COOKIE_NAME = "admin_session";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Sem Buffer (não disponível por padrão no runtime Edge do middleware).
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error("ADMIN_PASSWORD (ou ADMIN_SESSION_SECRET) precisa estar em .env.local");
  }
  return secret;
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return bufferToHex(sigBuffer);
}

export async function createSessionToken(): Promise<string> {
  const expiresAt = Date.now() + SEVEN_DAYS_MS;
  const payload = String(expiresAt);
  const signature = await hmac(payload);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = await hmac(payload);
  if (expected.length !== signature.length) return false;

  // Comparação em tempo constante para evitar timing attacks.
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  if (diff !== 0) return false;

  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && Date.now() < expiresAt;
}

export function verifyPassword(candidate: string): boolean {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  if (candidate.length !== real.length) return false;
  let diff = 0;
  for (let i = 0; i < real.length; i++) {
    diff |= candidate.charCodeAt(i) ^ real.charCodeAt(i);
  }
  return diff === 0;
}

export { COOKIE_NAME };
