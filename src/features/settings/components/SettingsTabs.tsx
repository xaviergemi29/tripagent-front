"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgencyTab } from "./AgencyTab";
import { SecurityTab } from "./SecurityTab";
import { ShieldCheck, Building2, Palette, ScrollText } from "lucide-react";
import { PoliciesTab } from "./PoliciesTab";
import { BrandingSettingsCard } from "./branding/BrandingSettingsCard";

const VALID_TABS = ["security", "agency", "policies", "branding"] as const;
type TabValue = (typeof VALID_TABS)[number];

/**
 * Pestañas de Configuración sincronizadas con `?tab=` (`security` | `agency` | `policies` | `branding`).
 * Lee `useSearchParams`, así que la página debe envolverlo en `<Suspense>` para poder
 * prerenderizarse (requisito de Next 16 en `next build`).
 */
export function SettingsTabs() {
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
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
      <TabsList className="flex h-auto w-full flex-wrap rounded-xl bg-slate-100 p-1 md:w-auto">
        <TabsTrigger value="security" className="gap-2 px-4 py-2">
          <ShieldCheck className="h-4 w-4" /> Seguridad
        </TabsTrigger>
        <TabsTrigger value="agency" className="gap-2 px-4 py-2">
          <Building2 className="h-4 w-4" /> Agencia
        </TabsTrigger>
        <TabsTrigger value="policies" className="gap-2 px-4 py-2">
          <ScrollText className="h-4 w-4" /> Políticas
        </TabsTrigger>
        <TabsTrigger value="branding" className="gap-2 px-4 py-2">
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">Identidad Visual &amp; PDFs</span>
          <span className="sm:hidden">Marca y PDFs</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="security" className="outline-none">
        <SecurityTab />
      </TabsContent>

      <TabsContent value="agency" className="outline-none">
        <AgencyTab />
      </TabsContent>

      <TabsContent value="policies" className="outline-none">
        <PoliciesTab />
      </TabsContent>

      <TabsContent value="branding" className="outline-none">
        <BrandingSettingsCard />
      </TabsContent>
    </Tabs>
  );
}
