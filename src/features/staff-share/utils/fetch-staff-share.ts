import { API_BASE_URL } from "@/lib/api-config";
import { staffShareOutputSchema, type StaffShareOutput } from "../schemas/staff-share.schema";

export type StaffShareFetchResult =
  | { kind: "ok"; data: StaffShareOutput }
  | { kind: "not-found" }
  | { kind: "error"; message: string };

const SERVICE_ERROR_MESSAGE =
  "No pudimos cargar el croquis en este momento. Inténtalo de nuevo en unos minutos.";
const RATE_LIMIT_MESSAGE = "Demasiados intentos. Vuelve a intentarlo en unos minutos.";

/**
 * Lee `GET /public/staff-share/:token` desde el servidor (sin cookie). 404 → enlace inexistente,
 * vencido o de un tour cancelado; 429 y cualquier otra falla → mensaje amable, sin detalles técnicos.
 */
export async function fetchStaffShare(token: string): Promise<StaffShareFetchResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/staff-share/${encodeURIComponent(token)}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (res.status === 404) return { kind: "not-found" };
    if (res.status === 429) return { kind: "error", message: RATE_LIMIT_MESSAGE };
    if (!res.ok) return { kind: "error", message: SERVICE_ERROR_MESSAGE };

    const body: unknown = await res.json();
    const payload = typeof body === "object" && body !== null && "data" in body ? body.data : body;
    const parsed = staffShareOutputSchema.safeParse(payload);
    return parsed.success
      ? { kind: "ok", data: parsed.data }
      : { kind: "error", message: SERVICE_ERROR_MESSAGE };
  } catch {
    // Sin conexión o respuesta que no es JSON (p. ej. un 502 del proxy).
    return { kind: "error", message: SERVICE_ERROR_MESSAGE };
  }
}
