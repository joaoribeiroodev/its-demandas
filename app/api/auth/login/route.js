import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { criarSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const identificador = body?.identificador?.trim();
  const senha = body?.senha;

  if (!identificador || !senha) {
    return Response.json({ erro: "Informe login/e-mail e senha." }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: usuario, error } = await supabase
    .from("usuarios")
    .select("*")
    .or(`login.eq.${identificador},email.eq.${identificador}`)
    .maybeSingle();

  if (error || !usuario || !usuario.ativo) {
    return Response.json({ erro: "Credenciais inválidas." }, { status: 401 });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
  if (!senhaValida) {
    return Response.json({ erro: "Credenciais inválidas." }, { status: 401 });
  }

  const token = await criarSessionToken(usuario);

  const resposta = Response.json({
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      login: usuario.login,
      setor: usuario.setor,
      permissao: usuario.permissao,
    },
  });

  resposta.headers.set(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`
  );

  return resposta;
}
