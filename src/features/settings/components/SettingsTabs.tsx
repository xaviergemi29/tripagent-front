"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgencyTab } from "./AgencyTab";
import { SecurityTab } from "./SecurityTab";
import {
  ShieldCheck,
  Building2,
  Palette,
  ScrollText,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { PoliciesTab } from "./PoliciesTab";
import { BrandingSettingsCard } from "./branding/BrandingSettingsCard";
import { SubscriptionTab } from "./subscription/SubscriptionTab";
import { SubscriptionTabBadge } from "./subscription/SubscriptionTabBadge";
import { TOUR_TARGET } from "@/features/onboarding/constants/guided-tours";

const VALID_TABS = ["security", "agency", "policies", "branding", "subscription"] as const;
type TabValue = (typeof VALID_TABS)[number];

/** Una sola lista de pestañas para celular y escritorio (mismos textos, íconos e insignias). */
/** Marca de cada pestaña para la guía interactiva (`SETTINGS_GUIDED_TOUR`). */
const TAB_GUIDE_TARGET: Record<TabValue, string> = {
  security: TOUR_TARGET.SETTINGS_TAB_SECURITY,
  agency: TOUR_TARGET.SETTINGS_TAB_AGENCY,
  policies: TOUR_TARGET.SETTINGS_TAB_POLICIES,
  branding: TOUR_TARGET.SETTINGS_TAB_BRANDING,
  subscription: TOUR_TARGET.SETTINGS_TAB_SUBSCRIPTION,
};

const TAB_ITEMS: { value: TabValue; icon: LucideIcon; label: ReactNode; badge?: ReactNode }[] = [
  { value: "security", icon: ShieldCheck, label: "Seguridad" },
  { value: "agency", icon: Building2, label: "Agencia" },
  { value: "policies", icon: ScrollText, label: "Políticas" },
  {
    value: "branding",
    icon: Palette,
    label: (
      <>
        <span className="hidden sm:inline">Identidad Visual &amp; PDFs</span>
        <span className="sm:hidden">Marca y PDFs</span>
      </>
    ),
  },
  {
    value: "subscription",
    icon: CreditCard,
    label: "Suscripción",
    badge: <SubscriptionTabBadge />,
  },
];

/**
 * Por debajo de `lg` la barra es una fila de píldoras deslizable (sin salto de línea, inercia
 * táctil y sin barra de desplazamiento visible); desde `lg` es una barra con línea inferior donde
 * la pestaña activa lleva subrayado índigo (mismo lenguaje que el Centro de Control).
 */
const TABS_LIST_CLASS =
  "flex h-auto w-full flex-nowrap justify-start gap-2 overflow-x-auto rounded-2xl bg-slate-100/80 p-1.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] group-data-horizontal/tabs:h-auto [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:gap-1 lg:overflow-visible lg:rounded-none lg:border-b lg:border-slate-200 lg:bg-transparent lg:p-0";

const TABS_TRIGGER_CLASS = [
  // Base: área táctil >= 44 px, foco de teclado visible, íconos atenuados salvo en la activa.
  // `flex-1 basis-auto shrink-0`: reparten todo el ancho; si no caben (celular), se desliza.
  "min-h-11 flex-1 basis-auto shrink-0 gap-2 text-sm transition-colors focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 focus-visible:outline-none [&_svg]:text-slate-400",
  // Celular / tablet: píldora; la activa en el color de la marca.
  "rounded-xl border border-slate-200/60 bg-white/70 px-4 py-2 font-medium text-slate-600 hover:bg-white hover:text-slate-900",
  "data-active:border-transparent data-active:bg-indigo-600 data-active:font-semibold data-active:text-white data-active:shadow-sm data-active:shadow-indigo-200 data-active:[&_svg]:text-white",
  // Escritorio: pestaña con subrayado.
  "lg:min-h-12 lg:-mb-px lg:rounded-b-none lg:rounded-t-lg lg:border-0 lg:border-b-2 lg:border-transparent lg:bg-transparent lg:px-5 lg:font-semibold lg:text-slate-600 lg:hover:bg-slate-100 lg:hover:text-slate-900",
  "lg:data-active:border-indigo-600 lg:data-active:bg-indigo-50/60 lg:data-active:font-semibold lg:data-active:text-indigo-700 lg:data-active:shadow-none lg:data-active:[&_svg]:text-indigo-600",
].join(" ");

/**
 * Pestañas de Configuración sincronizadas con `?tab=` (`security` | `agency` | `policies` | `branding` |
 * `subscription`).
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

  // En celular, centra la pestaña activa dentro de la barra deslizable. Solo si la barra realmente
  // se desplaza (en escritorio no hay scroll y no debe mover la página).
  const tabsListRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = tabsListRef.current;
    if (!list || list.scrollWidth <= list.clientWidth) return;
    const active = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    active?.scrollIntoView?.({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeTab]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
      <TabsList ref={tabsListRef} className={TABS_LIST_CLASS}>
        {TAB_ITEMS.map(({ value, icon: Icon, label, badge }) => (
          <TabsTrigger
            key={value}
            value={value}
            className={TABS_TRIGGER_CLASS}
            data-tour={TAB_GUIDE_TARGET[value]}
          >
            <Icon className="h-4 w-4" aria-hidden="true" /> {label}
            {badge}
          </TabsTrigger>
        ))}
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

      <TabsContent value="subscription" className="outline-none">
        <SubscriptionTab />
      </TabsContent>
    </Tabs>
  );
}
