import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "demandas_session";
// Duração da sessão configurável via variável de ambiente (em horas).
// Padrão: 8 horas (uma jornada de trabalho).
const SESSION_DURATION = (Number(process.env.SESSION_DURATION_HORAS) || 8) * 60 * 60;

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não configurado nas variáveis de ambiente.");
  }
  return new TextEncoder().encode(secret);
}

export async function criarSessionToken(usuario) {
  return await new SignJWT({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    login: usuario.login,
    setor: usuario.setor,
    permissao: usuario.permissao,
    // Versão da sessão no momento do login. Se o valor gravado no banco
    // mudar depois (troca de senha, desativação, "encerrar sessões"), este
    // token para de ser aceito imediatamente, mesmo sem ter expirado.
    sv: usuario.sessao_versao ?? 1,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSecretKey());
}

export async function verificarSessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = COOKIE_NAME;
export const SESSION_MAX_AGE = SESSION_DURATION;
