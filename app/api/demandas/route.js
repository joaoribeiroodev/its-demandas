import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUsuarioAtual, respostaNaoAutenticado } from "@/lib/authServer";
import { calcularPrazoData, SELECT_DEMANDA } from "@/lib/demandaUtils";

export async function GET() {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("demandas")
    .select(SELECT_DEMANDA)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ erro: error.message }, { status: 500 });
  return Response.json({ demandas: data });
}

export async function POST(request) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  const body = await request.json().catch(() => null);
  const {
    titulo,
    descricao,
    setor,
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

  const prazo_data = prazo_valor && prazo_unidade
    ? calcularPrazoData(prazo_valor, prazo_unidade).toISOString().slice(0, 10)
    : null;

  const statusInicial = status || (setor && prioridade ? "backlog" : "inbox");

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("demandas")
    .insert({
      titulo: titulo.trim(),
      descricao: descricao || "",
      setor: setor || null,
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
    })
    .select(SELECT_DEMANDA)
    .single();

  if (error) return Response.json({ erro: error.message }, { status: 400 });
  return Response.json({ demanda: data }, { status: 201 });
}
