import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUsuarioAtual, respostaNaoAutenticado } from "@/lib/authServer";
import { BUCKET_ANEXOS } from "@/lib/storageServer";

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

  const { searchParams } = new URL(request.url);
  const definitivo = searchParams.get("definitivo") === "true";
  const supabase = supabaseAdmin();

  if (!definitivo) {
    // Comportamento padrão: arquiva em vez de excluir, preservando o
    // histórico das demandas vinculadas.
    const { error } = await supabase.from("projetos").update({ ativo: false }).eq("id", params.id);
    if (error) return Response.json({ erro: error.message }, { status: 400 });
    return Response.json({ ok: true });
  }

  // Exclusão definitiva: irreversível, por isso restrita a gestor/admin.
  if (!["admin", "gestor"].includes(usuarioAtual.permissao)) {
    return Response.json({ erro: "Só gestores e administradores podem excluir um projeto definitivamente." }, { status: 403 });
  }

  const { data: projeto } = await supabase.from("projetos").select("id").eq("id", params.id).single();
  if (!projeto) return Response.json({ erro: "Projeto não encontrado." }, { status: 404 });

  // Remove do Storage os anexos ligados diretamente ao projeto, antes do
  // banco excluir os registros em cascata — senão os arquivos ficam
  // órfãos ocupando espaço no bucket.
  const { data: arquivos } = await supabase.from("arquivos").select("caminho_storage").eq("projeto_id", params.id);
  if (arquivos?.length) {
    await supabase.storage.from(BUCKET_ANEXOS).remove(arquivos.map((a) => a.caminho_storage));
  }

  // Demandas vinculadas a este projeto não são excluídas — elas só perdem
  // a referência ao projeto (projeto_id vira null, definido no schema).
  const { error } = await supabase.from("projetos").delete().eq("id", params.id);
  if (error) return Response.json({ erro: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
