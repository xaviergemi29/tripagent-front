"use client"; // Los error boundaries deben ser Client Components

import { RouteErrorFallback } from "@/components/shared/RouteErrorFallback";

/** Error inesperado fuera del panel (páginas públicas, login, manifiesto). */
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="min-h-screen bg-[#faf8ff]">
      <RouteErrorFallback error={error} retry={retry} />
    </div>
  );
}
