import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUsuarioAtual, respostaNaoAutenticado } from "@/lib/authServer";

export async function PATCH(request, { params }) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  const body = await request.json().catch(() => null);
  const atualizacoes = {};
  if (body?.nome !== undefined) atualizacoes.nome = body.nome;
  if (body?.cor !== undefined) atualizacoes.cor = body.cor;
  if (body?.ativo !== undefined) atualizacoes.ativo = body.ativo;

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("projetos")
    .update(atualizacoes)
    .eq("id", params.id)
    .select("id, nome, cor, ativo, created_at")
    .single();

  if (error) return Response.json({ erro: error.message }, { status: 400 });
  return Response.json({ projeto: data });
}

export async function DELETE(request, { params }) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  const supabase = supabaseAdmin();
  // Desativa em vez de excluir, para preservar o histórico das demandas vinculadas.
  const { error } = await supabase.from("projetos").update({ ativo: false }).eq("id", params.id);
  if (error) return Response.json({ erro: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
