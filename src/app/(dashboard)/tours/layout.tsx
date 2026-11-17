import type { Metadata } from "next";

// Las páginas de /tours son Client Components y no pueden exportar `metadata`: el título va aquí.
export const metadata: Metadata = { title: "Tours" };

export default function ToursLayout({ children }: { children: React.ReactNode }) {
  return children;
}
