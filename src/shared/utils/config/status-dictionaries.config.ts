import type { TourCancellationReason } from "@/shared/constants/domain.constants";
import type {
  AgencyRole,
  BookingPaymentStatus,
  FormStatus,
  LodgingRoomStatus,
  LodgingRoomType,
  PassengerRole,
  PaymentMethod,
} from "@/shared/constants/domain.constants";

// Interfaz genérica para estandarizar todos los badges de la UI
export interface UIStateConfig {
  label: string;
  style: string;
}

// 1. Diccionario de Estados de Pago (Alineado con DB: PENDING, PARTIAL, PAID, REFUNDED)
export const PAYMENT_STATUS_DICT: Record<BookingPaymentStatus, UIStateConfig> = {
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
export const PAYMENT_METHOD_DICT: Record<PaymentMethod, string> = {
  CASH: "EFECTIVO",
  TRANSFER: "SPEI",
  CARD: "TARJETA",
  OTHER: "OTRO",
};

// Método de pago con texto para el cliente (comprobante PDF y estado de cuenta del Magic Link)
export const PAYMENT_METHOD_LABEL_DICT: Record<PaymentMethod, string> = {
  TRANSFER: "Transferencia",
  CASH: "Efectivo",
  CARD: "Tarjeta",
  OTHER: "Otro",
};

/** Texto del método de pago para el cliente; tolera valores fuera del enum. */
export const getPaymentMethodText = (method?: string | null): string =>
  PAYMENT_METHOD_LABEL_DICT[(method ?? "").toUpperCase() as PaymentMethod] ?? (method || "Pago");

// Rol del pasajero dentro de su reserva (titular o acompañante)
export const PASSENGER_ROLE_DICT: Record<PassengerRole, string> = {
  TITULAR: "Titular",
  COMPANION: "Acompañante",
};

// Rol del usuario de la agencia (Configuración → Seguridad)
export const AGENCY_ROLE_DICT: Record<AgencyRole, string> = {
  ADMIN: "Administrador",
  SALES: "Ventas",
  GUIDE: "Guía",
};

/**
 * Etiquetas de los motivos de cancelación de un tour (decisión del PM, 2026-11-14). Las ve el
 * operador al cancelar y el viajero en su Magic Link, así que son textos formales y fijos.
 */
export const TOUR_CANCELLATION_REASON_DICT: Record<TourCancellationReason, string> = {
  WEATHER: "Condiciones climatológicas adversas",
  SECURITY: "Motivos de seguridad / Cierre carretero",
  LOW_SALES: "Cupo mínimo no alcanzado",
  OTHER: "Causa de fuerza mayor de la agencia",
};

// Tipos de habitación del hospedaje (nombre, píldora, descripción y camas que se dibujan por cuarto).
export interface LodgingRoomTypeConfig {
  name: string;
  badgeLabel: string;
  description: string;
  beds: readonly string[];
}

export const LODGING_ROOM_TYPE_DICT: Record<LodgingRoomType, LodgingRoomTypeConfig> = {
  MATRIMONIAL: {
    name: "Matrimonial",
    badgeLabel: "2 pers.",
    description: "1 cama matrimonial · 2 pers.",
    beds: ["Cama 1 Matrimonial"],
  },
  DOUBLE_INDIVIDUAL: {
    name: "Doble Individual",
    badgeLabel: "2 pers.",
    description: "2 camas individuales · 2 pers.",
    beds: ["Cama 1 Individual", "Cama 2 Individual"],
  },
  TRIPLE: {
    name: "Triple Familiar",
    badgeLabel: "3 pers.",
    description: "1 matrimonial + 1 individual · 3 pers.",
    beds: ["Cama 1 Matrimonial", "Cama 2 Individual"],
  },
  QUADRUPLE: {
    name: "Cuádruple",
    badgeLabel: "4 pers.",
    description: "2 camas matrimoniales / queen · 4 pers.",
    beds: ["Cama 1 Matrimonial", "Cama 2 Matrimonial"],
  },
  SINGLE: {
    name: "Individual",
    badgeLabel: "1 pers.",
    description: "1 cama individual · 1 pers.",
    beds: ["Cama 1 Individual"],
  },
};

/** Estado de la habitación del hospedaje: etiqueta y clases de la insignia. */
export const LODGING_ROOM_STATUS_DICT: Record<
  LodgingRoomStatus,
  { label: string; badgeClass: string }
> = {
  CONSULTED: { label: "Consultada", badgeClass: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Confirmada", badgeClass: "bg-emerald-100 text-emerald-800" },
};
