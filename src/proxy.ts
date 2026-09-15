import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith("/login");
  const isDashboardRoute = pathname.startsWith("/tours");

  // 🛡️ Escape temprano para assets y rutas internas de auth
  if (pathname.startsWith("/_next") || pathname.includes("/api/auth")) {
    return NextResponse.next();
  }

  // 1. Usuario autenticado intentando entrar al login -> Redirigir al dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/tours", request.url));
  }

  // 2. Usuario sin sesión intentando entrar al dashboard -> Redirigir al login
  if (isDashboardRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
