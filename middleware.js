import { NextResponse } from "next/server";
import { SESSION_COOKIE, verificarSessionToken } from "./lib/session";

const ROTAS_PUBLICAS = ["/login", "/api/auth/login"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (ROTAS_PUBLICAS.some((rota) => pathname === rota)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const sessao = token ? await verificarSessionToken(token) : null;

  const ehApi = pathname.startsWith("/api");

  if (!sessao) {
    if (ehApi) {
      return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Área de usuários é restrita a administradores
  if (
    (pathname.startsWith("/dashboard/usuarios") || pathname.startsWith("/api/usuarios")) &&
    sessao.permissao !== "admin"
  ) {
    if (ehApi) {
      return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
