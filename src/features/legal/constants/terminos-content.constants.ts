import { SUBSCRIPTION_PLAN } from "@/shared/constants/domain.constants";

/**
 * Texto de Términos y Condiciones de Servicio (/terminos, 2026-11-22), tal como lo entregó el
 * usuario. Algunas promesas todavía no las cumple el producto: están anotadas en la sección G de
 * `../CLAUDE.md` ("Promesas de las páginas públicas pendientes"). El texto legal se cambia aquí.
 */

export const TERMINOS_LAST_UPDATED = "Noviembre 2026";

/** Secciones del índice: ancla, título del índice de escritorio y píldora del celular. */
export const TERMINOS_SECTIONS = [
  { id: "naturaleza", title: "Naturaleza del servicio", short: "1. Naturaleza" },
  { id: "prueba", title: "Prueba gratis y pagos", short: "2. Prueba gratis" },
  { id: "propiedad", title: "Propiedad de los datos", short: "3. Propiedad" },
  { id: "operacion", title: "Responsabilidad operativa", short: "4. Operación" },
  { id: "soporte", title: "Cancelación y soporte", short: "5. Soporte" },
] as const;

export type TerminosSectionId = (typeof TERMINOS_SECTIONS)[number]["id"];

export const TERMINOS_EXECUTIVE_SUMMARY =
  "TripAgent es una herramienta administrativa y tecnológica. Tú eres el dueño absoluto de tus listas de pasajeros y contactos: nosotros no cobramos comisiones por tus ventas ni nos involucramos en tu dinero, y tienes el control total para cancelar tu suscripción con un solo clic cuando lo desees.";

export const TERMINOS_NATURALEZA = {
  title: "1. Naturaleza del Servicio",
  body: "TripAgent MX es una plataforma de software como servicio (SaaS) para la logística de salidas turísticas grupales terrestres en México: croquis digitales, Sprinter y autobuses, listas de abordaje, recibos PDF y pases de viaje.",
  delimitation:
    "TripAgent no es una agencia de viajes, no organiza ni comercializa tours al consumidor final, no provee unidades de transporte físico ni cuenta con choferes contratados. Asimismo, TripAgent no es un procesador de pagos ni intermediario financiero: los cobros se realizan directamente en las cuentas de banco, terminales o acuerdos comerciales que determine cada agencia.",
};

export const TERMINOS_PRUEBA = {
  title: `2. Prueba Gratuita de ${SUBSCRIPTION_PLAN.trialDaysTotal} Días y Suscripción`,
  body: `Toda agencia nueva cuenta con ${SUBSCRIPTION_PLAN.trialDaysTotal} días naturales sin costo en el Plan Todo Incluido ($0 MXN).`,
  bullets: [
    {
      title: "Sin tarjeta previa:",
      text: "No se requiere tarjeta de crédito ni cuenta bancaria.",
    },
    {
      title: "Tarifa única transparente:",
      text: `$${SUBSCRIPTION_PLAN.priceMxn} MXN mensuales concluidos los ${SUBSCRIPTION_PLAN.trialDaysTotal} días, salidas ilimitadas.`,
    },
    {
      title: "Cero comisiones por asiento:",
      text: "Sin cargos variables por pasajero vendido.",
    },
  ],
  softLock: {
    title: "Garantía de Candado Suave (Soft-Lock)",
    text: `Al vencer los ${SUBSCRIPTION_PLAN.trialDaysTotal} días, la cuenta entra en modo consulta histórica protegida: no se borra la información y permite exportar listas y manifiestos en PDF.`,
  },
};

export const TERMINOS_PROPIEDAD = {
  title: "3. Propiedad y Confidencialidad de Datos (LFPDPPP)",
  body: "Con respaldo legal en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), publicada en el Diario Oficial de la Federación el 20 de marzo de 2025, la agencia es la titular y Responsable del Tratamiento; TripAgent funge como Encargado Tecnológico: trata los datos solo por instrucciones de la agencia, no los usa para fines propios, guarda confidencialidad y los devuelve o suprime cuando la agencia deja el servicio. TripAgent no solicita datos de salud de los viajeros.",
  cards: [
    {
      title: "No-comercialización",
      text: "Jamás venderemos, rentaremos ni cederemos tus listas de clientes ni las usaremos para promocionar viajes de terceros.",
    },
    {
      title: "Cifrado bancario",
      text: "Certificados SSL/TLS y almacenamiento cifrado.",
    },
  ],
};

export const TERMINOS_OPERACION = {
  title: "4. Responsabilidad Operativa y Seguros",
  body: "TripAgent queda exonerado de manera explícita de la ejecución del viaje: la operación, el transporte y la atención a los pasajeros corresponden a la agencia.",
  cards: [
    {
      title: "Pólizas de autotransporte federal",
      text: "Es obligación de la agencia contar con el Seguro del Viajero (SICT).",
    },
    {
      title: "Contingencias mecánicas y viales",
      text: "Retrasos, fallas mecánicas o bloqueos carreteros.",
    },
    {
      title: "Políticas de cancelación y reembolsos particulares",
      text: "Definidas libremente por la agencia.",
    },
  ],
};

export const TERMINOS_SOPORTE = {
  title: "5. Cancelación, Disponibilidad y Soporte",
  items: [
    "Cancelación sin plazos forzosos con un clic o vía WhatsApp.",
    "Respaldos diarios y soporte humano en México.",
  ],
  legalChannelLabel: "Canal oficial de solicitudes legales:",
};

export const TERMINOS_SUPPORT_WHATSAPP_MESSAGE =
  "Hola, tengo dudas legales sobre los términos de TripAgent";
