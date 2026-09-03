import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUsuarioAtual, respostaNaoAutenticado } from "@/lib/authServer";
import { calcularPrazoData, calcularProximaOcorrencia, SELECT_DEMANDA } from "@/lib/demandaUtils";

const CAMPOS_PERMITIDOS = [
  "titulo",
  "descricao",
  "setor",
  "prioridade",
  "prazo_valor",
  "prazo_unidade",
  "responsavel_id",
  "status",
  "tags",
  "energia",
  "duracao_estimada_min",
  "foco_dia_data",
  "projeto_id",
  "recorrente",
  "recorrencia_regra",
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

  if (
    atualizacoes.status &&
    !["inbox", "backlog", "todo", "em_andamento", "revisao", "concluido"].includes(atualizacoes.status)
  ) {
    return Response.json({ erro: "Status inválido." }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  const { data: demandaAtual } = await supabase
    .from("demandas")
    .select("*")
    .eq("id", params.id)
    .single();

  // Se o prazo (valor ou unidade) mudou, recalcula a data alvo a partir de hoje.
  if (atualizacoes.prazo_valor !== undefined || atualizacoes.prazo_unidade !== undefined) {
    const valor = atualizacoes.prazo_valor ?? demandaAtual?.prazo_valor;
    const unidade = atualizacoes.prazo_unidade ?? demandaAtual?.prazo_unidade;
    const dataCalculada = calcularPrazoData(
      valor,
      unidade,
      demandaAtual?.created_at ? new Date(demandaAtual.created_at) : new Date()
    );
    atualizacoes.prazo_data = dataCalculada ? dataCalculada.toISOString().slice(0, 10) : null;
  }

  const { data, error } = await supabase
    .from("demandas")
    .update(atualizacoes)
    .eq("id", params.id)
    .select(SELECT_DEMANDA)
    .single();

  if (error) return Response.json({ erro: error.message }, { status: 400 });

  // Recorrência: se a demanda acabou de ser concluída e é recorrente,
  // cria automaticamente a próxima ocorrência com base em recorrencia_regra.
  let proximaDemanda = null;
  const acabouDeConcluir = atualizacoes.status === "concluido" && demandaAtual?.status !== "concluido";
  if (acabouDeConcluir && data.recorrente && data.recorrencia_regra) {
    const proximaData = calcularProximaOcorrencia(data.recorrencia_regra, new Date());

    if (proximaData) {
      const { data: nova } = await supabase
        .from("demandas")
        .insert({
          titulo: data.titulo,
          descricao: data.descricao,
          setor: data.setor,
          prioridade: data.prioridade,
          prazo_valor: data.prazo_valor,
          prazo_unidade: data.prazo_unidade,
          prazo_data: proximaData.toISOString().slice(0, 10),
          responsavel_id: data.responsavel_id,
          criado_por: data.criado_por,
          status: "backlog",
          tags: data.tags,
          energia: data.energia,
          duracao_estimada_min: data.duracao_estimada_min,
          projeto_id: data.projeto_id,
          recorrente: true,
          recorrencia_regra: data.recorrencia_regra,
        })
        .select(SELECT_DEMANDA)
        .single();
      proximaDemanda = nova || null;

      // Duplica as subtarefas (desmarcadas) para a nova ocorrência.
      if (nova && data.subtarefas?.length) {
        await supabase.from("demanda_subtarefas").insert(
          data.subtarefas.map((s) => ({ demanda_id: nova.id, titulo: s.titulo, concluida: false, ordem: s.ordem }))
        );
      }
    }
  }

  return Response.json({ demanda: data, proximaOcorrencia: proximaDemanda });
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
