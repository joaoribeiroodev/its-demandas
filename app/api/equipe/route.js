import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUsuarioAtual, respostaNaoAutenticado } from "@/lib/authServer";

export async function GET() {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome, setor")
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (error) return Response.json({ erro: error.message }, { status: 500 });
  return Response.json({ equipe: data });
}
