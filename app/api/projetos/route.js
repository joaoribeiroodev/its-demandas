import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUsuarioAtual, respostaNaoAutenticado } from "@/lib/authServer";

export async function GET() {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  const supabase = supabaseAdmin();
  const { data: projetos, error } = await supabase
    .from("projetos")
    .select("id, nome, cor, ativo, created_at")
    .eq("ativo", true)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ erro: error.message }, { status: 500 });

  const { data: demandas } = await supabase
    .from("demandas")
    .select("id, projeto_id, status")
    .not("projeto_id", "is", null);

  const projetosComProgresso = projetos.map((projeto) => {
    const itens = (demandas || []).filter((d) => d.projeto_id === projeto.id);
    const concluidas = itens.filter((d) => d.status === "concluido").length;
    return {
      ...projeto,
      total_demandas: itens.length,
      demandas_concluidas: concluidas,
      progresso: itens.length ? Math.round((concluidas / itens.length) * 100) : 0,
    };
  });

  return Response.json({ projetos: projetosComProgresso });
}

export async function POST(request) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  const body = await request.json().catch(() => null);
  const nome = body?.nome?.trim();
  if (!nome) return Response.json({ erro: "Dê um nome ao projeto." }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("projetos")
    .insert({ nome, cor: body?.cor || "#8ac640", criado_por: usuarioAtual.id })
    .select("id, nome, cor, ativo, created_at")
    .single();

  if (error) return Response.json({ erro: error.message }, { status: 400 });
  return Response.json({ projeto: { ...data, total_demandas: 0, demandas_concluidas: 0, progresso: 0 } }, { status: 201 });
}
