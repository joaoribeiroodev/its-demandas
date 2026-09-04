import { cache } from "react";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verificarSessionToken } from "./session";
import { supabaseAdmin } from "./supabaseAdmin";

/**
 * Retorna os dados do usuário logado (a partir do cookie de sessão) ou null.
 * Uso em rotas /api e Server Components (não em componentes "use client").
 *
 * Além de validar a assinatura/expiração do token (isso já acontece no
 * middleware), aqui é feita uma checagem extra contra o banco: se o
 * usuário foi desativado, ou se a "versão da sessão" dele mudou desde que
 * este token foi emitido (troca de senha, ou um admin encerrou as sessões
 * dele), o acesso é negado imediatamente — sem esperar o token expirar
 * sozinho, que poderia levar até SESSION_DURATION_HORAS.
 *
 * Envolvida em `cache()` do React: o layout do dashboard e cada page.js
 * chamam esta função separadamente, mas dentro da mesma requisição isso
 * roda a consulta ao banco só uma vez.
 */
export const getUsuarioAtual = cache(async function getUsuarioAtual() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verificarSessionToken(token);
  if (!payload) return null;

  const supabase = supabaseAdmin();
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("ativo, sessao_versao")
    .eq("id", payload.id)
    .single();

  if (!usuario || !usuario.ativo || usuario.sessao_versao !== payload.sv) {
    return null;
  }

  return payload;
});

export function respostaNaoAutenticado() {
  return Response.json({ erro: "Não autenticado." }, { status: 401 });
}

export function respostaSemPermissao() {
  return Response.json({ erro: "Você não tem permissão para esta ação." }, { status: 403 });
}
