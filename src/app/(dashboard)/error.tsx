"use client"; // Los error boundaries deben ser Client Components

import { RouteErrorFallback } from "@/components/shared/RouteErrorFallback";

/** Error inesperado dentro del panel: conserva el menú lateral y ofrece volver a Tours. */
export default function DashboardError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <RouteErrorFallback error={error} retry={retry} homeHref="/tours" homeLabel="Ir a Tours" />
  );
}
