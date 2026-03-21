import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotas que não exigem estar logado
const PUBLIC_PATHS = [
  "/", // página inicial (faz o roteamento conforme auth no client)
  "/login",
  "/forgot-password",
  "/auth/action",
  "/unauthorized",
  "/api/auth/session", // criação/remoção de sessão
  "/api/users/check-email", // usado antes do login
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignora assets estáticos e arquivos públicos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/public") ||
    pathname.match(/\.(png|svg|ico|jpg|jpeg)$/i)
  ) {
    return NextResponse.next();
  }

  // Permitir rotas públicas
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Verifica se existe cookie de sessão
  const session = request.cookies.get("session")?.value;

  if (!session) {
    // Para APIs, devolve 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Não autenticado. Session cookie é obrigatório." },
        { status: 401 },
      );
    }

    // Para páginas, redireciona para login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Cookie existe, deixa seguir.
  // A validação de autorização e roles continua sendo feita nas rotas/API específicas.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};

