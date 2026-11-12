"use client";

import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreBookingDialog } from "./PreBookingDialog";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";

interface BrochureCallToActionProps {
  tourId: string;
  tourTitle: string;
  whatsappUrl: string | null;
  availableSeats: number;
  isBookable: boolean;
}

export function BrochureCallToAction({
  tourId,
  tourTitle,
  whatsappUrl,
  availableSeats,
  isBookable,
}: BrochureCallToActionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <footer className="fixed right-0 bottom-0 left-0 z-50 border-t border-slate-100 bg-white/95 px-4 pt-3 pb-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-md flex-col gap-2">
          <Button
            type="button"
            disabled={!isBookable}
            onClick={() => setIsDialogOpen(true)}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-700 text-base font-bold text-white shadow-lg shadow-indigo-900/10 transition-all hover:bg-indigo-800 active:scale-[0.98]"
          >
            <CalendarCheck className="h-5 w-5" />
            {isBookable ? "Iniciar Reserva" : "Agotado"}
          </Button>

          {whatsappUrl && (
            <Button
              asChild
              variant="ghost"
              className="h-10 w-full rounded-2xl text-sm font-semibold text-[#008069] hover:bg-emerald-50 hover:text-[#006e5a]"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="h-4 w-4" />
                Contactar asesor por WhatsApp
              </a>
            </Button>
          )}
        </div>
      </footer>

      <PreBookingDialog
        tourId={tourId}
        tourTitle={tourTitle}
        availableSeats={availableSeats}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}
