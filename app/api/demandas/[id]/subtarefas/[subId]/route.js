import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUsuarioAtual, respostaNaoAutenticado } from "@/lib/authServer";

export async function PATCH(request, { params }) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  const body = await request.json().catch(() => null);
  const atualizacoes = {};
  if (body?.titulo !== undefined) atualizacoes.titulo = body.titulo;
  if (body?.concluida !== undefined) atualizacoes.concluida = body.concluida;
  if (body?.ordem !== undefined) atualizacoes.ordem = body.ordem;

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("demanda_subtarefas")
    .update(atualizacoes)
    .eq("id", params.subId)
    .eq("demanda_id", params.id)
    .select("id, titulo, concluida, ordem")
    .single();

  if (error) return Response.json({ erro: error.message }, { status: 400 });
  return Response.json({ subtarefa: data });
}

export async function DELETE(request, { params }) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("demanda_subtarefas")
    .delete()
    .eq("id", params.subId)
    .eq("demanda_id", params.id);

  if (error) return Response.json({ erro: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
