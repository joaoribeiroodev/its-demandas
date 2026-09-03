import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUsuarioAtual, respostaNaoAutenticado } from "@/lib/authServer";
import { buscarProjetosComProgresso } from "@/lib/dataServer";

export async function GET() {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  try {
    const projetos = await buscarProjetosComProgresso();
    return Response.json({ projetos });
  } catch (error) {
    return Response.json({ erro: error.message }, { status: 500 });
  }
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
