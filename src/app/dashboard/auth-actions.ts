"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Verifica se a senha passada corresponde à senha do usuário atualmente logado.
 * Usado como barreira extra antes de ações destrutivas (excluir, cancelar,
 * estornar). Retorna apenas ok/erro — não expõe detalhes do motivo de falha.
 */
export async function verificarSenhaUsuario(
  senha: string,
): Promise<{ ok: boolean; erro?: string }> {
  if (!senha || senha.length < 1) {
    return { ok: false, erro: "Informe sua senha." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false, erro: "Sessão expirada. Faça login novamente." };
  }

  // Tenta autenticar com email + senha fornecida.
  // Se funcionar, a senha está correta (Supabase renova a sessão com o mesmo
  // user, não causa logout nem cria nova conta).
  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: senha,
  });

  if (error) {
    // Não revela detalhes do erro (evita enumeração)
    return { ok: false, erro: "Senha incorreta." };
  }

  return { ok: true };
}
