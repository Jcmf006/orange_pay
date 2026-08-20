export function formatBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatTelefoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function telefoneParaDigitos(raw: string): string {
  return raw.replace(/\D/g, "");
}

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<"nome" | "setor" | "telefone" | "quantidade_sacos", string>>;
}

export function validarPedido(input: {
  nome: string;
  setor: string;
  telefone: string;
  quantidade_sacos: number;
}): ValidationResult {
  const errors: ValidationResult["errors"] = {};

  if (!input.nome || input.nome.trim().length < 3) {
    errors.nome = "Informe o nome completo.";
  }

  if (!input.setor || input.setor.trim().length < 2) {
    errors.setor = "Informe o setor.";
  }

  const telefoneDigitos = telefoneParaDigitos(input.telefone || "");
  if (telefoneDigitos.length < 10 || telefoneDigitos.length > 11) {
    errors.telefone = "Informe um telefone válido com DDD.";
  }

  if (
    !Number.isInteger(input.quantidade_sacos) ||
    input.quantidade_sacos < 1 ||
    input.quantidade_sacos > 500
  ) {
    errors.quantidade_sacos = "Informe uma quantidade entre 1 e 500 sacos.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
