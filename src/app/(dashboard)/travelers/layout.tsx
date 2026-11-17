import type { Metadata } from "next";

// La página es Client Component y no puede exportar `metadata`: el título va aquí.
export const metadata: Metadata = { title: "Viajeros" };

export default function TravelersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
