"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgencyTab } from "@/features/settings/components/AgencyTab";
import { SecurityTab } from "@/features/settings/components/SecurityTab";
import { ShieldCheck, Building2 } from "lucide-react";

const VALID_TABS = ["security", "agency"] as const;
type TabValue = (typeof VALID_TABS)[number];

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTabParam = searchParams.get("tab") as TabValue | null;
  const activeTab: TabValue =
    currentTabParam && VALID_TABS.includes(currentTabParam) ? currentTabParam : "security";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Configuración del Sistema
        </h1>
        <p className="text-sm text-slate-500">
          Administra las preferencias operativas, seguridad de tu cuenta y datos de la agencia.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="flex h-auto w-full rounded-xl bg-slate-100 p-1 md:w-auto">
          <TabsTrigger value="security" className="gap-2 px-4 py-2">
            <ShieldCheck className="h-4 w-4" /> Seguridad
          </TabsTrigger>
          <TabsTrigger value="agency" className="gap-2 px-4 py-2">
            <Building2 className="h-4 w-4" /> Agencia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="outline-none">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="agency" className="outline-none">
          <AgencyTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
