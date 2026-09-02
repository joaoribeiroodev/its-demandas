import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUsuarioAtual, respostaNaoAutenticado } from "@/lib/authServer";

export async function GET(request, { params }) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("demanda_comentarios")
    .select("id, mensagem, created_at, autor:autor_id(id, nome)")
    .eq("demanda_id", params.id)
    .order("created_at", { ascending: true });

  if (error) return Response.json({ erro: error.message }, { status: 500 });
  return Response.json({ comentarios: data });
}

export async function POST(request, { params }) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  const body = await request.json().catch(() => null);
  const mensagem = body?.mensagem?.trim();
  if (!mensagem) return Response.json({ erro: "Escreva uma mensagem." }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("demanda_comentarios")
    .insert({ demanda_id: params.id, autor_id: usuarioAtual.id, mensagem })
    .select("id, mensagem, created_at, autor:autor_id(id, nome)")
    .single();

  if (error) return Response.json({ erro: error.message }, { status: 400 });
  return Response.json({ comentario: data }, { status: 201 });
}
