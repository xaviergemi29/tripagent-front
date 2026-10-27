import { FormStatus } from "@/features/tour-dashboard/schemas/tour-dashboard.schema";

// Interfaz genérica para estandarizar todos los badges de la UI
export interface UIStateConfig {
  label: string;
  style: string;
}

// 1. Diccionario de Estados de Pago (Alineado con DB: PENDING, PARTIAL, PAID, REFUNDED)
export const PAYMENT_STATUS_DICT: Record<string, UIStateConfig> = {
  PAID: {
    label: "Liquidado",
    style: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  PARTIAL: {
    label: "Abono Parcial", // Resolviendo el punto 1
    style: "bg-blue-100 text-blue-800 border-blue-200",
  },
  PENDING: {
    label: "Sin Pago",
    style: "bg-slate-100 text-slate-600 border-slate-200",
  },
  REFUNDED: {
    label: "Reembolsado",
    style: "bg-purple-100 text-purple-800 border-purple-200",
  },
  // Mantenemos este por retrocompatibilidad si Zod aún lo requiere temporalmente
  PENDING_VALIDATION: {
    label: "Por Validar",
    style: "bg-orange-100 text-orange-800 border-orange-200",
  },
};

// 2. Diccionario de Estados de Formulario
export const FORM_STATUS_DICT: Record<FormStatus, UIStateConfig> = {
  COMPLETED: {
    label: "Completo",
    style: "text-emerald-600", // El dot 🟢 se renderiza en el componente
  },
  PENDING: {
    label: "Pendiente",
    style: "text-red-600", // El dot 🔴 se renderiza en el componente
  },
};

// 3. Diccionario de Métodos de Pago
// Alineado con PAYMENT_METHOD: "CASH", "TRANSFER", "CARD", "OTHER"
export const PAYMENT_METHOD_DICT: Record<string, string> = {
  CASH: "EFECTIVO",
  TRANSFER: "SPEI",
  CARD: "TARJETA",
  OTHER: "OTRO",
};
