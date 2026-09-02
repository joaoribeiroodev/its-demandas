import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUsuarioAtual, respostaNaoAutenticado } from "@/lib/authServer";
import { calcularPrazoData } from "@/lib/demandaUtils";

const CAMPOS_PERMITIDOS = [
  "titulo",
  "descricao",
  "setor",
  "prioridade",
  "prazo_valor",
  "prazo_unidade",
  "responsavel_id",
  "status",
];

export async function PATCH(request, { params }) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ erro: "Corpo da requisição inválido." }, { status: 400 });

  const atualizacoes = {};
  for (const campo of CAMPOS_PERMITIDOS) {
    if (body[campo] !== undefined) atualizacoes[campo] = body[campo];
  }

  if (atualizacoes.status && !["backlog", "todo", "em_andamento", "revisao", "concluido"].includes(atualizacoes.status)) {
    return Response.json({ erro: "Status inválido." }, { status: 400 });
  }

  // Se o prazo (valor ou unidade) mudou, recalcula a data alvo a partir de hoje.
  if (atualizacoes.prazo_valor !== undefined || atualizacoes.prazo_unidade !== undefined) {
    const supabase = supabaseAdmin();
    const { data: atual } = await supabase
      .from("demandas")
      .select("prazo_valor, prazo_unidade, created_at")
      .eq("id", params.id)
      .single();

    const valor = atualizacoes.prazo_valor ?? atual?.prazo_valor ?? 1;
    const unidade = atualizacoes.prazo_unidade ?? atual?.prazo_unidade ?? "dias";
    atualizacoes.prazo_data = calcularPrazoData(valor, unidade, atual?.created_at ? new Date(atual.created_at) : new Date())
      .toISOString()
      .slice(0, 10);
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("demandas")
    .update(atualizacoes)
    .eq("id", params.id)
    .select("*, responsavel:responsavel_id(id, nome, setor), criador:criado_por(id, nome)")
    .single();

  if (error) return Response.json({ erro: error.message }, { status: 400 });
  return Response.json({ demanda: data });
}

export async function DELETE(request, { params }) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();
  if (!["admin", "gestor"].includes(usuarioAtual.permissao)) {
    return Response.json({ erro: "Sem permissão para excluir demandas." }, { status: 403 });
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase.from("demandas").delete().eq("id", params.id);
  if (error) return Response.json({ erro: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
