import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUsuarioAtual, respostaNaoAutenticado } from "@/lib/authServer";
import { calcularPrazoData, calcularProximaOcorrencia, SELECT_DEMANDA } from "@/lib/demandaUtils";

const CAMPOS_PERMITIDOS = [
  "titulo",
  "descricao",
  "setor",
  "setor_direcionado",
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

  const supabase = supabaseAdmin();

  const { data: demandaAtual } = await supabase
    .from("demandas")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!demandaAtual) {
    return Response.json({ erro: "Demanda não encontrada." }, { status: 404 });
  }

  // Numa demanda de equipe, só gestor/admin do MESMO setor pode trocar o
  // responsável ou o setor — ela continua pertencendo ao setor mesmo depois
  // de atribuída. Colaborador nunca pode; gestor de outro setor também não.
  const ehAdmin = usuarioAtual.permissao === "admin";
  const ehGestorDoMesmoSetor = usuarioAtual.permissao === "gestor" && demandaAtual.setor === usuarioAtual.setor;
  if (demandaAtual.equipe && !ehAdmin && !ehGestorDoMesmoSetor) {
    if (atualizacoes.responsavel_id !== undefined) {
      return Response.json(
        { erro: "Só o gestor (ou admin) do setor pode atribuir esta demanda de equipe a uma pessoa específica." },
        { status: 403 }
      );
    }
    if (atualizacoes.setor !== undefined) {
      return Response.json(
        { erro: "Só o gestor (ou admin) do setor pode mudar o setor de uma demanda de equipe." },
        { status: 403 }
      );
    }
  }

  if (
    atualizacoes.status &&
    !["inbox", "backlog", "todo", "em_andamento", "revisao", "concluido"].includes(atualizacoes.status)
  ) {
    return Response.json({ erro: "Status inválido." }, { status: 400 });
  }

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

  const supabase = supabaseAdmin();

  const { data: demanda } = await supabase
    .from("demandas")
    .select("id, criado_por, responsavel_id, equipe, setor")
    .eq("id", params.id)
    .single();

  if (!demanda) {
    return Response.json({ erro: "Demanda não encontrada." }, { status: 404 });
  }

  const ehAdmin = usuarioAtual.permissao === "admin";
  const ehGestor = usuarioAtual.permissao === "gestor";
  const ehCriadorDeDemandaPessoal = !demanda.equipe && demanda.criado_por === usuarioAtual.id;

  let podeExcluir = ehAdmin || ehCriadorDeDemandaPessoal;

  // Gestor só exclui dentro do próprio setor: demanda de equipe do seu
  // setor, ou demanda pessoal de alguém (criador ou responsável) que é do
  // seu setor.
  if (!podeExcluir && ehGestor) {
    if (demanda.equipe) {
      podeExcluir = demanda.setor === usuarioAtual.setor;
    } else {
      const idsEnvolvidos = [demanda.criado_por, demanda.responsavel_id].filter(Boolean);
      if (idsEnvolvidos.length) {
        const { data: pessoas } = await supabase.from("usuarios").select("id, setor").in("id", idsEnvolvidos);
        podeExcluir = (pessoas || []).some((p) => p.setor === usuarioAtual.setor);
      }
    }
  }

  if (!podeExcluir) {
    const mensagem = demanda.equipe
      ? "Você só pode excluir demandas de equipe do seu próprio setor."
      : "Você só pode excluir demandas suas ou, se for gestor, de alguém do seu setor.";
    return Response.json({ erro: mensagem }, { status: 403 });
  }

  const { error } = await supabase.from("demandas").delete().eq("id", params.id);
  if (error) return Response.json({ erro: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
