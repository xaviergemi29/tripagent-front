"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Calendar, PlusCircle, Users, LogOut } from "lucide-react";
import { useSession } from "@/app/(auth)/hooks/useSession";
import { useLogout } from "@/app/(auth)/hooks/useAuth";
import { Button } from "../ui/button";

const navigationItems = [
  { name: "Mis Viajes", href: "/tours", icon: Calendar },
  { name: "Viajeros", href: "/travelers", icon: Users },
  { name: "Crear Tour", href: "/tours/new", icon: PlusCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: user, isLoading } = useSession();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const initials = user?.fullName?.substring(0, 2).toUpperCase() || "US";
  const agencyTitle = user?.agencyName;
  console.log("initials", initials)

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 hidden md:flex">
      {/* Brand / Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
          <Compass className="w-5 h-5" />
        </div>

        {isLoading ? (
          <div className="space-y-1.5 flex-1 animate-pulse">
            <div className="h-3.5 bg-slate-800 rounded w-3/4" />
            <div className="h-2.5 bg-slate-800/60 rounded w-1/2" />
          </div>
        ) : (
          <div className="overflow-hidden">
            <h1 className="font-bold text-white text-sm tracking-wide truncate">
              {agencyTitle}
            </h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Control Logístico
            </p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Gestión
        </p>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/tours" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Session Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        {isLoading ? (
          <div className="flex items-center gap-3 px-3 py-2 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-700/50" />
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-slate-700/50 rounded w-3/4" />
              <div className="h-2 bg-slate-700/50 rounded w-1/2" />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            {/* Info del usuario */}
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                {initials}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.fullName || "Usuario"}
                </p>
                <p className="text-[10px] text-slate-500 truncate capitalize">
                  {user?.role?.toLowerCase() || "Operador"}
                </p>
              </div>
            </div>

            {/* 🚪 Botón de Cerrar Sesión Minimalista */}
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 transition-colors shrink-0"
              onClick={() => logout()}
              disabled={isLoggingOut}
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}