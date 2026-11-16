import { apiClient } from "@/lib/api-client";

/** Máximo que aceptan los listados paginados de la API (`limit` ≤ 100). */
export const API_PAGE_SIZE = 100;

/**
 * Tope de seguridad: 50 páginas (5,000 registros). Evita un ciclo sin fin si la API dejara de
 * respetar `limit`; con más registros conviene paginar o buscar en el servidor.
 */
export const MAX_PAGES = 50;

/**
 * Pide todas las páginas de un listado paginado por `limit`/`offset` (`/tours`, `/travelers`).
 *
 * El interceptor de `apiClient` desenvuelve `{ data, pagination }` y entrega solo el arreglo, así
 * que el final se detecta por una página incompleta (menos de `API_PAGE_SIZE` registros). Hasta el
 * 2026-11-16 los hooks pedían solo la primera página y, con más de 100 registros, el resto nunca
 * aparecía en pantalla ni en los filtros del cliente.
 *
 * Se descartan duplicados por `id` por si un registro se crea entre una página y otra (el orden de
 * la API es por fecha de alta descendente, con `id` como desempate).
 */
export async function fetchAllPages<T extends { id?: string | null }>(
  url: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T[]> {
  const items: T[] = [];
  const seenIds = new Set<string>();

  for (let page = 0; page < MAX_PAGES; page++) {
    const batch = await apiClient.get<never, T[]>(url, {
      params: { ...params, limit: API_PAGE_SIZE, offset: page * API_PAGE_SIZE },
    });
    const rows = Array.isArray(batch) ? batch : [];

    for (const row of rows) {
      if (row.id) {
        if (seenIds.has(row.id)) continue;
        seenIds.add(row.id);
      }
      items.push(row);
    }

    if (rows.length < API_PAGE_SIZE) break;
  }

  return items;
}
