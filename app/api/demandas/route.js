import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUsuarioAtual, respostaNaoAutenticado } from "@/lib/authServer";
import { calcularPrazoData, SELECT_DEMANDA } from "@/lib/demandaUtils";
import { buscarDemandas } from "@/lib/dataServer";

export async function GET() {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  try {
    const demandas = await buscarDemandas(usuarioAtual);
    return Response.json({ demandas });
  } catch (error) {
    return Response.json({ erro: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  const body = await request.json().catch(() => null);
  const {
    titulo,
    descricao,
    setor,
    setor_direcionado,
    prioridade,
    prazo_valor,
    prazo_unidade,
    responsavel_id,
    tags,
    energia,
    duracao_estimada_min,
    foco_dia_data,
    projeto_id,
    recorrente,
    recorrencia_regra,
    equipe,
    // Se não vier status explícito, uma captura mínima (só título) cai no
    // Inbox; se vier com os campos de organização já preenchidos (fluxo do
    // modal "Nova demanda" no quadro), começa direto no Backlog.
    status,
  } = body || {};

  if (!titulo || !titulo.trim()) {
    return Response.json({ erro: "Escreva ao menos um título para a tarefa." }, { status: 400 });
  }
  if (prioridade && !["baixa", "media", "alta"].includes(prioridade)) {
    return Response.json({ erro: "Prioridade inválida." }, { status: 400 });
  }
  if (prazo_unidade && !["dias", "semanas", "meses"].includes(prazo_unidade)) {
    return Response.json({ erro: "Unidade de prazo inválida." }, { status: 400 });
  }
  if (energia && !["leve", "moderada", "profunda"].includes(energia)) {
    return Response.json({ erro: "Nível de energia inválido." }, { status: 400 });
  }

  const ehEquipe = Boolean(equipe);
  if (ehEquipe) {
    if (!["admin", "gestor"].includes(usuarioAtual.permissao)) {
      return Response.json({ erro: "Só administradores e gestores podem criar demandas de equipe." }, { status: 403 });
    }
    if (!setor) {
      return Response.json({ erro: "Demandas de equipe precisam de um setor." }, { status: 400 });
    }
  }

  const prazo_data = prazo_valor && prazo_unidade
    ? calcularPrazoData(prazo_valor, prazo_unidade).toISOString().slice(0, 10)
    : null;

  // Demanda de equipe já nasce organizada — não faz sentido passar pelo Inbox pessoal.
  const statusInicial = status || (ehEquipe || (setor && prioridade) ? "backlog" : "inbox");

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("demandas")
    .insert({
      titulo: titulo.trim(),
      descricao: descricao || "",
      setor: setor || null,
      setor_direcionado: setor_direcionado || null,
      prioridade: prioridade || "media",
      prazo_valor: prazo_valor || null,
      prazo_unidade: prazo_unidade || null,
      prazo_data,
      responsavel_id: responsavel_id || null,
      criado_por: usuarioAtual.id,
      status: statusInicial,
      tags: tags || [],
      energia: energia || null,
      duracao_estimada_min: duracao_estimada_min || null,
      foco_dia_data: foco_dia_data || null,
      projeto_id: projeto_id || null,
      recorrente: Boolean(recorrente),
      recorrencia_regra: recorrente ? recorrencia_regra : null,
      equipe: ehEquipe,
    })
    .select(SELECT_DEMANDA)
    .single();

  if (error) return Response.json({ erro: error.message }, { status: 400 });
  return Response.json({ demanda: data }, { status: 201 });
}
