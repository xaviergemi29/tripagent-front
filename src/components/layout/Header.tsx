export function Header() {
  return (
    <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-semibold tracking-wider text-slate-600 uppercase">
          Centro de Control Logístico
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Indicador de Estado del Sistema */}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
          Bot WhatsApp Activo
        </span>
      </div>
    </header>
  );
}
