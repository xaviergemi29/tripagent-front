import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ["192.168.1.87"],
  // Las páginas privadas no se guardan en la caché HTTP ni en la BFCache del navegador:
  // tras cerrar sesión, «Atrás» debe volver a pedirlas al servidor (y pasar por src/proxy.ts).
  async headers() {
    const noStore = [
      { key: "Cache-Control", value: "private, no-cache, no-store, max-age=0, must-revalidate" },
    ];
    // Encabezados de seguridad en todas las páginas (auditoría 2026-11-13): sin incrustar la app
    // en iframes ajenos (clickjacking del panel), sin "sniffing" de tipos y sin enviar la URL
    // completa (p. ej. el token del Magic Link) a sitios externos como wa.me o el link de pago.
    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    return [
      { source: "/:path*", headers: securityHeaders },
      ...["/tours", "/travelers", "/settings", "/pdf-tour"].flatMap((route) => [
        { source: route, headers: noStore },
        { source: `${route}/:path*`, headers: noStore },
      ]),
    ];
  },
};

export default nextConfig;
