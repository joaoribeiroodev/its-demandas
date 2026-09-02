import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUsuarioAtual, respostaNaoAutenticado, respostaSemPermissao } from "@/lib/authServer";

export async function GET() {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();
  if (usuarioAtual.permissao !== "admin") return respostaSemPermissao();

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome, email, login, setor, permissao, ativo, created_at")
    .order("nome", { ascending: true });

  if (error) return Response.json({ erro: error.message }, { status: 500 });
  return Response.json({ usuarios: data });
}

export async function POST(request) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();
  if (usuarioAtual.permissao !== "admin") return respostaSemPermissao();

  const body = await request.json().catch(() => null);
  const { nome, email, login, senha, setor, permissao } = body || {};

  if (!nome || !email || !login || !senha || !setor || !permissao) {
    return Response.json({ erro: "Preencha todos os campos obrigatórios." }, { status: 400 });
  }
  if (senha.length < 6) {
    return Response.json({ erro: "A senha deve ter ao menos 6 caracteres." }, { status: 400 });
  }
  if (!["admin", "gestor", "colaborador"].includes(permissao)) {
    return Response.json({ erro: "Permissão inválida." }, { status: 400 });
  }

  const senha_hash = await bcrypt.hash(senha, 10);
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("usuarios")
    .insert({ nome, email, login, senha_hash, setor, permissao })
    .select("id, nome, email, login, setor, permissao, ativo, created_at")
    .single();

  if (error) {
    const mensagem = error.code === "23505" ? "Já existe um usuário com este e-mail ou login." : error.message;
    return Response.json({ erro: mensagem }, { status: 400 });
  }

  return Response.json({ usuario: data }, { status: 201 });
}
