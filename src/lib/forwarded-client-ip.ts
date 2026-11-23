import { headers } from "next/headers";

/**
 * Cabeceras para que la API limite por la IP del **visitante** en las páginas públicas que se
 * arman en el servidor (folleto `/p/[id]`, Magic Link `/register`, enlace de staff `/s/[token]`).
 * Sin esto, la API ve la IP de este servidor y el límite de intentos es uno solo para todos.
 *
 * Solo se envía con `INTERNAL_PROXY_SECRET` (variable de servidor, nunca `NEXT_PUBLIC_`): la API
 * acepta la IP únicamente con ese secreto. Sin la variable devuelve `{}` y todo sigue como antes.
 *
 * La IP sale de `x-forwarded-for` (primer valor) o `x-real-ip`, que pone el proxy del hosting
 * (Vercel, Cloudflare, Nginx). Si Next se expone sin un proxy que **reescriba** esas cabeceras, un
 * visitante podría falsificarlas para repartir sus peticiones entre IPs inventadas: ver la nota de
 * hosting en `../CLAUDE.md` (sección G).
 */
export const CLIENT_IP_HEADER = "x-tripagent-client-ip";
export const INTERNAL_SECRET_HEADER = "x-tripagent-internal-secret";

export async function getForwardedClientIpHeaders(): Promise<Record<string, string>> {
  const secret = process.env.INTERNAL_PROXY_SECRET?.trim();
  if (!secret) return {};
  const incoming = await headers();
  const ip =
    incoming.get("x-forwarded-for")?.split(",")[0]?.trim() || incoming.get("x-real-ip")?.trim();
  if (!ip) return {};
  return { [CLIENT_IP_HEADER]: ip, [INTERNAL_SECRET_HEADER]: secret };
}
