import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUsuarioAtual, respostaNaoAutenticado } from "@/lib/authServer";

export async function POST(request, { params }) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  const body = await request.json().catch(() => null);
  const titulo = body?.titulo?.trim();
  if (!titulo) return Response.json({ erro: "Escreva o texto da subtarefa." }, { status: 400 });

  const supabase = supabaseAdmin();

  const { count } = await supabase
    .from("demanda_subtarefas")
    .select("id", { count: "exact", head: true })
    .eq("demanda_id", params.id);

  const { data, error } = await supabase
    .from("demanda_subtarefas")
    .insert({ demanda_id: params.id, titulo, ordem: count || 0 })
    .select("id, titulo, concluida, ordem")
    .single();

  if (error) return Response.json({ erro: error.message }, { status: 400 });
  return Response.json({ subtarefa: data }, { status: 201 });
}
