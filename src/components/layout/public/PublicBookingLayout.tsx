import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PublicBookingHeader, type PublicBookingHeaderProps } from "./PublicBookingHeader";
import { PublicBookingFooter, type PublicBookingFooterProps } from "./PublicBookingFooter";

export interface PublicBookingLayoutProps {
  headerProps: PublicBookingHeaderProps;
  footerProps: PublicBookingFooterProps;
  className?: string;
  children: ReactNode;
}

/**
 * Cascarón común de las vistas del Magic Link (`/register`): fondo, ancho máximo legible,
 * encabezado y pie homologados. El contenido de cada estado va en `children` sin cambios.
 */
export function PublicBookingLayout({
  headerProps,
  footerProps,
  className,
  children,
}: PublicBookingLayoutProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col bg-[#faf8ff] font-sans text-slate-800 antialiased selection:bg-indigo-100 selection:text-indigo-900",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4">
        <PublicBookingHeader {...headerProps} />

        <main className="mt-2 w-full min-w-0 flex-1 space-y-4">{children}</main>

        <PublicBookingFooter {...footerProps} />
      </div>
    </div>
  );
}
