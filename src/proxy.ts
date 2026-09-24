// En proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname, searchParams } = request.nextUrl;

  const isAuthRoute = pathname.startsWith("/login");
  const isDashboardRoute = pathname.startsWith("/tours");

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
