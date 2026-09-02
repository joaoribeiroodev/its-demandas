import { SESSION_COOKIE } from "@/lib/session";

export async function POST() {
  const resposta = Response.json({ ok: true });
  resposta.headers.set(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  return resposta;
}
