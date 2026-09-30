"use client";

import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import { UploadCloud, Eye, FileText, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TourAssetSectionProps {
  brochureFile: File | null;
  setBrochureFile: Dispatch<SetStateAction<File | null>>;
  existingBrochure: string | null;
  setExistingBrochure: Dispatch<SetStateAction<string | null>>;
  isProcessing: boolean;
}

export function TourAssetSection({
  brochureFile,
  setBrochureFile,
  existingBrochure,
  setExistingBrochure,
  isProcessing,
}: TourAssetSectionProps) {
  const getFilename = (): string => {
    if (brochureFile) return brochureFile.name;
    if (existingBrochure) {
      const rawName = existingBrochure.split("/").pop() || "itinerario.pdf";
      const isBackendGenerated = /^tour-[a-f0-9\-]+-\d+\.pdf$/i.test(rawName);
      return isBackendGenerated ? "itinerario_guardado.pdf" : rawName;
    }
    return "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 5242880) {
      // 5MB limit
      setBrochureFile(file);
    } else if (file) {
      toast.error("El archivo supera el límite de 5MB");
    }
    e.target.value = "";
  };

  const handleDelete = () => {
    if (
      window.confirm(
        "¿Deseas quitar este folleto del tour? Tendrás que guardar los cambios para confirmar la eliminación.",
      )
    ) {
      setBrochureFile(null);
      setExistingBrochure(null);
    }
  };

  return (
    <Card className="rounded-xl border border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-700">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
              <FileText className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-semibold">Folleto del Viaje (Opcional)</CardTitle>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            PDF, Máx 5MB
          </span>
        </div>
        <CardDescription className="mt-1 text-sm text-slate-500">
          Sube el PDF con tu itinerario y políticas. Tus clientes podrán descargarlo directamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {existingBrochure || brochureFile ? (
          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4 overflow-hidden">
              <div className="flex h-14 w-12 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500 shadow-sm">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-bold text-slate-700" title={getFilename()}>
                  {getFilename()}
                </span>
                <div className="mt-1 flex items-center gap-2 text-[11px] font-medium text-slate-500">
                  {brochureFile ? (
                    <span>{(brochureFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  ) : (
                    <span>Archivo en servidor</span>
                  )}
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="text-emerald-600">Listo para enviar</span>
                </div>
              </div>
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              {existingBrochure && !brochureFile && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 bg-white text-xs"
                  onClick={() => window.open(existingBrochure, "_blank")}
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver / Descargar
                </Button>
              )}

              <div className="relative">
                <input
                  type="file"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                  accept="application/pdf"
                  disabled={isProcessing}
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                  className="pointer-events-none h-9 bg-white text-xs"
                >
                  <UploadCloud className="mr-1.5 h-3.5 w-3.5" />{" "}
                  {isProcessing ? "Procesando..." : "Reemplazar"}
                </Button>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isProcessing}
                className="h-9 w-9 shrink-0 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex w-full items-center justify-center">
            <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-indigo-300 hover:bg-slate-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="mb-3 h-8 w-8 text-slate-400" />
                <p className="mb-1 text-sm font-semibold text-slate-600">
                  Haz clic para adjuntar el PDF
                </p>
                <p className="text-xs font-medium text-slate-500">Solo formato .PDF hasta 5MB</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="application/pdf"
                onChange={handleFileChange}
              />
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
