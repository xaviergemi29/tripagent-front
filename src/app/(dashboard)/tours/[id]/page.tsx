import { notFound } from "next/navigation";
import { TourDashboardView } from "@/features/tour-dashboard/components/TourDashboardView";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TourDashboardPage({ params }: PageProps) {
  // Desenvolvemos la promesa (Requisito de Next.js 15+)
  const { id } = await params;

  // Validación rápida de formato UUID (Opcional pero recomendada)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  if (!id || !isUUID) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TourDashboardView tourId={id} />
    </div>
  );
}
