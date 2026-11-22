import { cn } from "@/lib/utils";
import type { NotificationFilter } from "../schemas/notification.schema";

interface NotificationFilterTabsProps {
  value: NotificationFilter;
  onChange: (value: NotificationFilter) => void;
  totalCount: number;
  unreadCount: number;
  /** Celular: pestañas más altas para el dedo (`py-2.5`). */
  touch?: boolean;
}

/** Filtro segmentado "Todas" / "Sin leer" (escritorio y celular). */
export function NotificationFilterTabs({
  value,
  onChange,
  totalCount,
  unreadCount,
  touch = false,
}: NotificationFilterTabsProps) {
  const tabs: { value: NotificationFilter; label: string }[] = [
    { value: "ALL", label: `Todas (${totalCount})` },
    { value: "UNREAD", label: `Sin leer (${unreadCount})` },
  ];

  return (
    <div role="tablist" className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={cn(
              "flex-1 rounded-lg px-3 text-center text-xs",
              touch ? "py-2.5" : "py-1.5",
              isActive
                ? "bg-slate-900 font-semibold text-white shadow-sm"
                : "font-medium text-slate-600 hover:text-slate-900",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
