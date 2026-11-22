import { RegisterAgencyPageContent } from "@/features/auth/components/RegisterAgencyPageContent";

interface RegisterPageProps {
  /** `?plan=todo-incluido` y atribución opcional (`utm_source`, `ref`) desde la landing o campañas. */
  searchParams: Promise<{ plan?: string | string[] }>;
}

const DEFAULT_PLAN = "todo-incluido";

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { plan } = await searchParams;
  const selectedPlan =
    typeof plan === "string" && plan.trim() ? plan.trim().slice(0, 40) : DEFAULT_PLAN;

  return <RegisterAgencyPageContent plan={selectedPlan} />;
}
