# tripagent-front

Frontend de TripAgent: panel de las agencias de tours (catálogo, Centro de Control, viajeros y configuración) y páginas públicas del viajero (Magic Link `/register` y folleto `/p/[id]`).

Next.js 16 (App Router) · React 19 · TypeScript · React Query · Tailwind 4 · shadcn/Radix. Consume la API de `tripagent-api`.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000 (la API debe correr en :3001)
```

Variable de entorno en `.env.local`: `NEXT_PUBLIC_API_URL` (por defecto `http://localhost:3001/api`).

## Validación

```bash
npm run lint
npm run test:run
npm run build
```

## Dónde está cada cosa

- `src/app/`: solo rutas y composición.
- `src/features/<dominio>/`: componentes, hooks, schemas y utilidades de cada funcionalidad (`auth`, `tours`, `tour-dashboard`, `statements`, `travelers`, `external-registration`, `public-tours`, `settings`, `vehicles`).
- `src/shared/`: claves de React Query (`api/query-keys.ts`), constantes de dominio y utilidades sin dependencias de features.
- `src/components/`: `ui/` (shadcn), `layout/` y componentes compartidos.

## Estados de error de carga (`QueryErrorState`)

Toda pantalla cuya consulta falla **sin datos** muestra `src/components/shared/QueryErrorState.tsx` (actualizado el 2026-11-17):

- **Copy en español de México, sin tecnicismos.** Nunca se muestra el error técnico ("Network Error", "servidor", "API"): el mensaje transmite calma y que la información está respaldada. Título "No pudimos cargar tus **tours**" (recurso resaltado), "¡No te preocupes!", la píldora "Espera unos momentos y vuelve a intentarlo.", el botón **Volver a intentar** (spinner y "Volviendo a intentar…" mientras reintenta) y el sello "Tus registros están respaldados y protegidos en tu cuenta.".
- **Props:** `resourceName` + `resourceArticle` (concordancia: "tus" por defecto; "tu suscripción", "el tour", "los asientos"), `title` / `description` para reemplazar el texto, `onRetry` (`refetch`; sin él no hay botón), `isRetrying`, `variant` (`"full"` en el área principal, `"compact"` en modales, drawers o secciones) y `className`.
- **Animación `soft-pulse`:** el ícono (nube con una pausa ámbar) "respira" con `motion-safe:animate-soft-pulse` (escala 1 → 1.05 y opacidad 0.95 → 1 en 2.8 s). Está en `src/app/globals.css` como `--animate-soft-pulse` + `@keyframes softPulse` dentro de `@theme` (Tailwind 4, sin `tailwind.config`); `motion-safe:` respeta "reducir movimiento".
- **Uso:** `<QueryErrorState resourceName="tours" onRetry={() => void refetch()} isRetrying={isFetching} />`. Un 404 no es un error de carga: esas pantallas dicen "Tour no encontrado" (`isNotFoundError` de `src/lib/api-error.ts`).

La arquitectura, las convenciones y las reglas de negocio están documentadas en [CLAUDE.md](CLAUDE.md) y, para todo el producto, en `../CLAUDE.md`.
