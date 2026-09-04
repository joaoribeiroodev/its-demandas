import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUsuarioAtual, respostaNaoAutenticado, respostaSemPermissao } from "@/lib/authServer";

export async function PATCH(request, { params }) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();
  if (usuarioAtual.permissao !== "admin") return respostaSemPermissao();

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ erro: "Corpo da requisição inválido." }, { status: 400 });

  const atualizacoes = {};
  for (const campo of ["nome", "email", "login", "setor", "permissao", "ativo"]) {
    if (body[campo] !== undefined) atualizacoes[campo] = body[campo];
  }
  if (body.senha) {
    if (body.senha.length < 8) {
      return Response.json({ erro: "A senha deve ter ao menos 8 caracteres." }, { status: 400 });
    }
    atualizacoes.senha_hash = await bcrypt.hash(body.senha, 10);
  }

  if (
    params.id === usuarioAtual.id &&
    (atualizacoes.ativo === false || (atualizacoes.permissao && atualizacoes.permissao !== "admin"))
  ) {
    return Response.json(
      { erro: "Você não pode desativar ou remover seu próprio acesso de administrador." },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();

  // Trocar a senha, desativar a conta, ou pedir explicitamente
  // ("encerrar_sessoes") invalida IMEDIATAMENTE qualquer sessão já aberta
  // desse usuário — sem isso, quem já estivesse logado continuaria com
  // acesso até o token expirar sozinho.
  if (atualizacoes.senha_hash || atualizacoes.ativo === false || body.encerrar_sessoes) {
    const { data: atual } = await supabase.from("usuarios").select("sessao_versao").eq("id", params.id).single();
    atualizacoes.sessao_versao = (atual?.sessao_versao || 1) + 1;
  }

  const { data, error } = await supabase
    .from("usuarios")
    .update(atualizacoes)
    .eq("id", params.id)
    .select("id, nome, email, login, setor, permissao, ativo, ultimo_login, created_at")
    .single();

  if (error) {
    const mensagem = error.code === "23505" ? "Já existe um usuário com este e-mail ou login." : error.message;
    return Response.json({ erro: mensagem }, { status: 400 });
  }

  return Response.json({ usuario: data });
}

export async function DELETE(request, { params }) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();
  if (usuarioAtual.permissao !== "admin") return respostaSemPermissao();

  if (params.id === usuarioAtual.id) {
    return Response.json({ erro: "Você não pode excluir seu próprio usuário." }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: atual } = await supabase.from("usuarios").select("sessao_versao").eq("id", params.id).single();

  // Preferimos inativar a excluir, para preservar o histórico de demandas vinculadas.
  const { error } = await supabase
    .from("usuarios")
    .update({ ativo: false, sessao_versao: (atual?.sessao_versao || 1) + 1 })
    .eq("id", params.id);

  if (error) return Response.json({ erro: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
