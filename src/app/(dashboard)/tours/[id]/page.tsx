import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { TourDashboardView } from "@/features/tour-dashboard/components/TourDashboardView";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TourDashboardPage({ params }: PageProps) {
  const { id } = await params;

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  if (!id || !isUUID) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <div className="mx-auto flex max-w-7xl items-center">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="-ml-2 text-slate-500 hover:text-slate-900"
          >
            <Link href="/tours">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Volver a Lista de Tours
            </Link>
          </Button>
        </div>
      </div>

      <TourDashboardView tourId={id} />
    </div>
  );
}
