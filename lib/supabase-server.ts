import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente server-only. Usa a service_role key, que ignora RLS — por isso
// NUNCA deve ser importado por um Client Component nem exposto com o
// prefixo NEXT_PUBLIC_. Toda escrita/leitura na tabela `pedidos` passa
// pelas API routes (app/api/**), nunca diretamente do browser.
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar configurados em .env.local"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export const supabaseAdmin = getSupabaseAdmin;
