import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { criarSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

const MAX_TENTATIVAS = 5;
const BLOQUEIO_MINUTOS = 15;

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

  // Mesma mensagem genérica ("Credenciais inválidas") em qualquer caso de
  // falha — login inexistente, senha errada ou conta desativada — para não
  // dar pistas a quem estiver tentando adivinhar contas válidas.
  if (error || !usuario || !usuario.ativo) {
    return Response.json({ erro: "Credenciais inválidas." }, { status: 401 });
  }

  // Bloqueio por tentativas incorretas (proteção contra força bruta).
  if (usuario.bloqueado_ate && new Date(usuario.bloqueado_ate) > new Date()) {
    const minutosRestantes = Math.ceil((new Date(usuario.bloqueado_ate) - new Date()) / 60000);
    return Response.json(
      { erro: `Conta temporariamente bloqueada por muitas tentativas. Tente novamente em ${minutosRestantes} min.` },
      { status: 429 }
    );
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
  if (!senhaValida) {
    const novasTentativas = usuario.tentativas_login_falhas + 1;
    const atualizacoes = { tentativas_login_falhas: novasTentativas };
    if (novasTentativas >= MAX_TENTATIVAS) {
      atualizacoes.bloqueado_ate = new Date(Date.now() + BLOQUEIO_MINUTOS * 60 * 1000).toISOString();
    }
    await supabase.from("usuarios").update(atualizacoes).eq("id", usuario.id);
    return Response.json({ erro: "Credenciais inválidas." }, { status: 401 });
  }

  // Login certo: zera o contador de tentativas e registra o acesso.
  await supabase
    .from("usuarios")
    .update({ tentativas_login_falhas: 0, bloqueado_ate: null, ultimo_login: new Date().toISOString() })
    .eq("id", usuario.id);

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
