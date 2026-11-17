import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsTabs } from "@/features/settings/components/SettingsTabs";
import { SettingsGuideButton } from "@/features/settings/components/SettingsGuideButton";

export const metadata: Metadata = { title: "Configuración" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Configuración del Sistema
          </h1>
          <p className="text-sm text-slate-500">
            Administra las preferencias operativas, seguridad de tu cuenta y datos de la agencia.
          </p>
        </div>
        <SettingsGuideButton />
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <SettingsTabs />
      </Suspense>
    </div>
  );
}
