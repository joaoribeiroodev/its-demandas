import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUsuarioAtual, respostaNaoAutenticado } from "@/lib/authServer";
import { calcularPrazoData } from "@/lib/demandaUtils";

export async function GET() {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("demandas")
    .select(
      "*, responsavel:responsavel_id(id, nome, setor), criador:criado_por(id, nome)"
    )
    .order("created_at", { ascending: false });

  if (error) return Response.json({ erro: error.message }, { status: 500 });
  return Response.json({ demandas: data });
}

export async function POST(request) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  const body = await request.json().catch(() => null);
  const { titulo, descricao, setor, prioridade, prazo_valor, prazo_unidade, responsavel_id } =
    body || {};

  if (!titulo || !setor || !prioridade || !prazo_valor || !prazo_unidade) {
    return Response.json({ erro: "Preencha os campos obrigatórios da demanda." }, { status: 400 });
  }
  if (!["baixa", "media", "alta"].includes(prioridade)) {
    return Response.json({ erro: "Prioridade inválida." }, { status: 400 });
  }
  if (!["dias", "semanas", "meses"].includes(prazo_unidade)) {
    return Response.json({ erro: "Unidade de prazo inválida." }, { status: 400 });
  }

  const prazo_data = calcularPrazoData(prazo_valor, prazo_unidade)
    .toISOString()
    .slice(0, 10);

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("demandas")
    .insert({
      titulo,
      descricao: descricao || "",
      setor,
      prioridade,
      prazo_valor,
      prazo_unidade,
      prazo_data,
      responsavel_id: responsavel_id || null,
      criado_por: usuarioAtual.id,
      status: "backlog",
    })
    .select("*, responsavel:responsavel_id(id, nome, setor), criador:criado_por(id, nome)")
    .single();

  if (error) return Response.json({ erro: error.message }, { status: 400 });
  return Response.json({ demanda: data }, { status: 201 });
}
