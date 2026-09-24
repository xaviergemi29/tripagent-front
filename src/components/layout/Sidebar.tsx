"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Calendar, Users, LogOut, Settings } from "lucide-react";
import { useSession } from "@/app/(auth)/hooks/useSession";
import { useLogout } from "@/features/settings/hooks/useAuth";
import { Button } from "../ui/button";

const navigationItems = [
  { name: "Tours", href: "/tours", icon: Calendar },
  { name: "Viajeros", href: "/travelers", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: user, isLoading } = useSession();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const initials = user?.fullName?.substring(0, 2).toUpperCase() || "US";
  const agencyTitle = user?.agencyName;
  console.log("initials", initials);

  return (
    <aside className="flex hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-300 md:flex">
      {/* Brand / Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">
          <Compass className="h-5 w-5" />
        </div>

        {isLoading ? (
          <div className="flex-1 animate-pulse space-y-1.5">
            <div className="h-3.5 w-3/4 rounded bg-slate-800" />
            <div className="h-2.5 w-1/2 rounded bg-slate-800/60" />
          </div>
        ) : (
          <div className="overflow-hidden">
            <h1 className="truncate text-sm font-bold tracking-wide text-white">{agencyTitle}</h1>
            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
              Control Logístico
            </p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-4 py-6">
        <p className="mb-3 px-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">
          Gestión
        </p>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== "/tours" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <div className="mt-6 border-t border-slate-800 pt-4">
          <p className="mb-3 px-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Sistema
          </p>
          <Link
            href="/settings"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              pathname.startsWith("/settings")
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span>Configuración</span>
          </Link>
        </div>
      </nav>

      {/* Footer / User Session Info */}
      <div className="border-t border-slate-800 bg-slate-950/40 p-3">
        {isLoading ? (
          <div className="flex animate-pulse items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-slate-700/50" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 rounded bg-slate-700/50" />
              <div className="h-2 w-1/2 rounded bg-slate-700/50" />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            {/* Info del usuario */}
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-xs font-semibold text-white">
                {initials}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-xs font-semibold text-white">
                  {user?.fullName || "Usuario"}
                </p>
                <p className="truncate text-[10px] text-slate-500 capitalize">
                  {user?.role?.toLowerCase() || "Operador"}
                </p>
              </div>
            </div>

            {/* 🚪 Botón de Cerrar Sesión Minimalista */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
              onClick={() => logout()}
              disabled={isLoggingOut}
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
