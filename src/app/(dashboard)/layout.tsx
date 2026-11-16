import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
// Estilos base de las guías interactivas (driver.js); el tema TripAgent está en globals.css.
import "driver.js/dist/driver.css";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* 1. Sidebar Fijo a la Izquierda */}
      <Sidebar />

      {/* 2. Contenedor Derecho (Header + Contenido Desplazable) */}
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <Header />

        {/* Área de Contenido Dinámico */}
        <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
