/**
 * URL base de la API (incluye `/api`). Única fuente para el cliente del panel (`apiClient`), las
 * páginas públicas que hacen `fetch` en el servidor (`/register`, `/p/[id]`) y las URLs de archivos
 * públicos (`buildApiPublicFileUrl`). Hasta el 2026-11-16 las páginas públicas no tenían respaldo:
 * sin `NEXT_PUBLIC_API_URL` pedían a `undefined/...` mientras el panel sí funcionaba.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/** Tiempo máximo de una petición normal. */
export const API_TIMEOUT_MS = 10_000;

/**
 * Tiempo máximo para subir archivos (folleto PDF ≤ 5 MB, logotipo ≤ 2 MB). Con 10 s, un PDF de
 * 5 MB en una conexión móvil de 1–2 Mbps se cortaba aunque fuera válido.
 */
export const UPLOAD_TIMEOUT_MS = 120_000;
