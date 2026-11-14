"use client";

import { useRef, useState, type DragEvent } from "react";
import { ImageUp, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildApiPublicFileUrl } from "@/shared/utils/share-links.util";
import { LOGO_ACCEPTED_TYPES, LOGO_MAX_BYTES } from "../../schemas/branding.schema";

interface LogoUploaderProps {
  logoPath: string | null;
  isUploading?: boolean;
  isRemoving?: boolean;
  disabled?: boolean;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
}

/** Fondo cuadriculado para apreciar la transparencia del logotipo. */
const CHECKERBOARD = {
  backgroundImage:
    "linear-gradient(45deg,#f1f5f9 25%,transparent 25%),linear-gradient(-45deg,#f1f5f9 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#f1f5f9 75%),linear-gradient(-45deg,transparent 75%,#f1f5f9 75%)",
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
};

/** Valida tipo (PNG/JPEG) y peso (≤ 2 MB) antes de subir. Devuelve el error o `null`. */
export const validateLogoFile = (file: File): string | null => {
  if (!LOGO_ACCEPTED_TYPES.includes(file.type as (typeof LOGO_ACCEPTED_TYPES)[number])) {
    return "El logotipo debe ser PNG o JPG (el PDF no admite SVG).";
  }
  if (file.size > LOGO_MAX_BYTES) return "El logotipo no debe pesar más de 2 MB.";
  return null;
};

/** Carga del logotipo (arrastrar y soltar o seleccionar) con vista previa sobre transparencia. */
export function LogoUploader({
  logoPath,
  isUploading,
  isRemoving,
  disabled,
  onSelectFile,
  onRemove,
}: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isBusy = Boolean(isUploading || isRemoving || disabled);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const error = validateLogoFile(file);
    if (error) {
      toast.error("Logotipo no válido", { description: error });
      return;
    }
    onSelectFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (!isBusy) handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isBusy) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-4 text-center transition-colors",
          isDragging ? "border-indigo-400 bg-indigo-50/60" : "border-slate-200",
        )}
        style={logoPath ? CHECKERBOARD : undefined}
      >
        {isUploading ? (
          <Loader2
            className="h-6 w-6 animate-spin text-indigo-600"
            aria-label="Subiendo logotipo"
          />
        ) : logoPath ? (
          // eslint-disable-next-line @next/next/no-img-element -- archivo servido por la API (otro origen)
          <img
            src={buildApiPublicFileUrl(logoPath)}
            alt="Logotipo actual de la agencia"
            className="max-h-24 max-w-full object-contain"
          />
        ) : (
          <>
            <ImageUp className="h-8 w-8 text-slate-300" aria-hidden />
            <div>
              <p className="text-sm font-medium text-slate-700">Arrastra tu logotipo aquí</p>
              <p className="text-xs text-slate-500">PNG transparente o JPG · máximo 2 MB</p>
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={LOGO_ACCEPTED_TYPES.join(",")}
        className="hidden"
        data-testid="logo-file-input"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isBusy}
          onClick={() => inputRef.current?.click()}
        >
          <ImageUp className="mr-1.5 h-4 w-4" />
          {logoPath ? "Cargar nuevo logotipo" : "Seleccionar archivo"}
        </Button>
        {logoPath && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isBusy}
            onClick={onRemove}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            {isRemoving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-1.5 h-4 w-4" />
            )}
            Quitar
          </Button>
        )}
      </div>
    </div>
  );
}
