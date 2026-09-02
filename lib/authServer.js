import { cookies } from "next/headers";
import { SESSION_COOKIE, verificarSessionToken } from "./session";

/**
 * Retorna os dados do usuário logado (a partir do cookie de sessão) ou null.
 * Uso em rotas /api e Server Components (não em componentes "use client").
 */
export async function getUsuarioAtual() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verificarSessionToken(token);
  return payload;
}

export function respostaNaoAutenticado() {
  return Response.json({ erro: "Não autenticado." }, { status: 401 });
}

export function respostaSemPermissao() {
  return Response.json({ erro: "Você não tem permissão para esta ação." }, { status: 403 });
}
