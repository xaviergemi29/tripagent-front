import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registra tu agencia",
  description:
    "Crea la cuenta de tu agencia de tours en TripAgent: 30 días gratis, sin tarjeta de crédito.",
};

/** Layout libre de distracciones: la página trae su propia barra superior y pie. */
export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
