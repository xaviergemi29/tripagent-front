export function Header() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-10">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
          Centro de Control Logístico
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Indicador de Estado del Sistema */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Bot WhatsApp Activo
        </span>
      </div>
    </header>
  );
}