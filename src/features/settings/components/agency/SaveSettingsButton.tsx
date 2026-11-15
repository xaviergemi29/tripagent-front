import { Loader2, Save } from "lucide-react";

/** Botón "Guardar Configuración": ancho completo en celular, a la medida desde `sm`. */
export function SaveSettingsButton({
  disabled,
  isSaving,
}: {
  disabled: boolean;
  isSaving: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:bg-indigo-600 disabled:active:scale-100 sm:w-auto"
    >
      {isSaving ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Save className="h-4 w-4" aria-hidden />
      )}
      Guardar Configuración
    </button>
  );
}
