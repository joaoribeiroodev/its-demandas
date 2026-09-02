import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "demandas_session";
const SESSION_DURATION = 60 * 60 * 8; // 8 horas

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
