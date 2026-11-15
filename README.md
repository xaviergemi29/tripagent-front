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

La arquitectura, las convenciones y las reglas de negocio están documentadas en [CLAUDE.md](CLAUDE.md) y, para todo el producto, en `../CLAUDE.md`.
