"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Compass, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { useSession } from "@/app/(auth)/hooks/useSession";
import { useLogout } from "@/features/settings/hooks/useAuth";
import { NAVIGATION_ITEMS, SYSTEM_ITEMS } from "@/shared/utils/config/navigation";

export function Header() {
  const pathname = usePathname();
  const { data: user } = useSession();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const initials = user?.fullName?.substring(0, 2).toUpperCase() || "US";

  return (
    <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2 text-slate-600">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-72 flex-col border-r-slate-800 bg-slate-900 p-0 text-slate-300"
            >
              {/* Para accesibilidad de Shadcn, el Sheet necesita un Title aunque lo ocultes visualmente */}
              <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
              {/* Brand Header del Mobile Nav */}
              <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Compass className="h-5 w-5" />
                </div>
                <div className="overflow-hidden">
                  <h2 className="truncate text-sm font-bold tracking-wide text-white">
                    {user?.agencyName || "Agencia"}
                  </h2>
                </div>
              </div>
              <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
                <p className="mb-3 px-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Gestión
                </p>
                {NAVIGATION_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/tours" && pathname.startsWith(item.href));
                  return (
                    <SheetClose asChild key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-indigo-600 text-white"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    </SheetClose>
                  );
                })}

                <div className="mt-6 border-t border-slate-800 pt-4">
                  <p className="mb-3 px-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    Sistema
                  </p>
                  {SYSTEM_ITEMS.map((item) => (
                    <SheetClose asChild key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          pathname.startsWith(item.href)
                            ? "bg-indigo-600 text-white"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    </SheetClose>
                  ))}
                </div>
              </nav>
              {/* Mobile Footer / Logout */}
              <div className="border-t border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
                      {initials}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{user?.fullName}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => logout()}
                    disabled={isLoggingOut}
                    className="text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <h2 className="text-sm font-semibold tracking-wider text-slate-600 uppercase">
          Centro de Control Logístico
        </h2>
      </div>
    </header>
  );
}
