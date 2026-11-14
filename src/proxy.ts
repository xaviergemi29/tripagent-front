// En proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Rutas del panel autenticado. Sin cookie se redirige a /login antes de renderizar.
 * Mantener en sincronía con las cabeceras `no-store` de next.config.ts.
 */
const PROTECTED_PREFIXES = ["/tours", "/travelers", "/settings", "/pdf-tour"];

const isProtectedPath = (pathname: string): boolean =>
  PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname, searchParams } = request.nextUrl;

  const isAuthRoute = pathname.startsWith("/login");
  const isDashboardRoute = isProtectedPath(pathname);

  if (pathname.startsWith("/_next") || pathname.includes("/api/auth")) {
    return NextResponse.next();
  }

  // 1. Usuario "autenticado" intentando entrar al login
  if (isAuthRoute && token) {
    // 🚀 FIX: Si viene rebotado por un 401, destruimos la cookie muerta y le damos acceso al login
    if (searchParams.get("expired") === "true") {
      const response = NextResponse.next();
      response.cookies.delete("token");
      return response;
    }

    // Si entró de forma manual al /login, lo mandamos de regreso al dashboard
    return NextResponse.redirect(new URL("/tours", request.url));
  }

  // 2. Usuario sin sesión intentando entrar al dashboard
  if (isDashboardRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
