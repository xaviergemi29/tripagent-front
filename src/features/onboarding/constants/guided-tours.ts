/**
 * Guías interactivas (driver.js) del panel del operador. Cada paso señala un elemento marcado con
 * `data-tour="<target>"`; sin `target`, el globo aparece centrado. Al cambiar el contenido de una
 * guía de forma relevante, sube `version` para que se vuelva a abrir sola a quien ya la vio.
 */
export interface GuidedTourStep {
  target?: string;
  title: string;
  description: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export interface GuidedTourDefinition {
  id: string;
  version: number;
  steps: GuidedTourStep[];
}

export const TOUR_TARGET = {
  GUIDE_BUTTON: "guide-button",
  TOURS_CREATE: "tours-create",
  TOURS_FILTERS: "tours-filters",
  TOURS_LIST: "tours-list",
  TOURS_ACTION_CONTROL_CENTER: "tours-action-control-center",
  TOURS_ACTION_SHARE: "tours-action-share",
  TOURS_ACTION_MORE: "tours-action-more",
  DASHBOARD_NEW_BOOKING: "dashboard-new-booking",
  DASHBOARD_KPIS: "dashboard-kpis",
  DASHBOARD_TABS: "dashboard-tabs",
  DASHBOARD_FILTERS: "dashboard-filters",
  DASHBOARD_TRAVELERS: "dashboard-travelers",
  DASHBOARD_ACTION_RECEIPT: "dashboard-action-receipt",
  DASHBOARD_ACTION_MAGIC_LINK: "dashboard-action-magic-link",
  DASHBOARD_ACTION_PAYMENTS: "dashboard-action-payments",
  DASHBOARD_ACTION_TRANSFER: "dashboard-action-transfer",
  TRAVELERS_FILTERS: "travelers-filters",
  TRAVELERS_LIST: "travelers-list",
  TRAVELERS_ACTION_EDIT: "travelers-action-edit",
  TRAVELERS_ACTION_HISTORY: "travelers-action-history",
  TRAVELERS_ACTION_DELETE: "travelers-action-delete",
  SETTINGS_TAB_SECURITY: "settings-tab-security",
  SETTINGS_TAB_AGENCY: "settings-tab-agency",
  SETTINGS_TAB_POLICIES: "settings-tab-policies",
  SETTINGS_TAB_BRANDING: "settings-tab-branding",
  SETTINGS_TAB_SUBSCRIPTION: "settings-tab-subscription",
} as const;

const GUIDE_BUTTON_STEP: GuidedTourStep = {
  target: TOUR_TARGET.GUIDE_BUTTON,
  title: "Vuelve a ver esta guía",
  description: "Cuando quieras repasar esta pantalla, toca «Ver guía».",
  side: "bottom",
  align: "end",
};

export const TOURS_GUIDED_TOUR: GuidedTourDefinition = {
  id: "tours",
  // v2 (2026-11-15): un paso por botón de la columna "Acciones".
  version: 2,
  steps: [
    {
      title: "Tours y Operaciones",
      description:
        "Aquí ves todas tus salidas programadas: su precio, los lugares ocupados y si están próximas, en curso o finalizadas.",
    },
    {
      target: TOUR_TARGET.TOURS_CREATE,
      title: "Crea un tour",
      description:
        "Define fecha, precio, anticipo, capacidad, puntos de abordaje, métodos de pago y el folleto PDF.",
      side: "bottom",
      align: "end",
    },
    {
      target: TOUR_TARGET.TOURS_FILTERS,
      title: "Busca y filtra",
      description: "Encuentra un tour por nombre o destino y filtra por estado o tipo de destino.",
      side: "bottom",
      align: "start",
    },
    {
      target: TOUR_TARGET.TOURS_LIST,
      title: "Tus salidas",
      description:
        "Cada fila muestra el precio, los lugares ocupados de la capacidad vendible y el estado del tour.",
      side: "top",
      align: "start",
    },
    {
      target: TOUR_TARGET.TOURS_ACTION_CONTROL_CENTER,
      title: "Centro de Control",
      description: "Abre el panel del tour: reservas, abonos, asientos y la lista de abordaje.",
      side: "left",
      align: "center",
    },
    {
      target: TOUR_TARGET.TOURS_ACTION_SHARE,
      title: "Compartir folleto",
      description:
        "Copia un mensaje con el enlace del folleto digital, listo para pegarlo en WhatsApp. Desde el folleto, el cliente puede iniciar su reserva.",
      side: "left",
      align: "center",
    },
    {
      target: TOUR_TARGET.TOURS_ACTION_MORE,
      title: "Más opciones",
      description:
        "Edita los datos del tour o elimínalo. Solo se puede eliminar si no tiene reservas activas ni dinero abonado.",
      side: "left",
      align: "center",
    },
    GUIDE_BUTTON_STEP,
  ],
};

export const TOUR_DASHBOARD_GUIDED_TOUR: GuidedTourDefinition = {
  id: "tour-dashboard",
  // v2 (2026-11-15): un paso por botón de la columna "Acciones".
  version: 2,
  steps: [
    {
      title: "Centro de Control",
      description:
        "Desde aquí operas el tour: reservas, cobranza, asientos y la lista de abordaje.",
    },
    {
      target: TOUR_TARGET.DASHBOARD_KPIS,
      title: "Resumen del tour",
      description:
        "Ocupación de los lugares vendibles, lo cobrado contra lo proyectado y los pasajeros que aún no tienen asiento.",
      side: "bottom",
      align: "center",
    },
    {
      target: TOUR_TARGET.DASHBOARD_NEW_BOOKING,
      title: "Aparta lugares",
      description:
        "«Nueva Reserva» aparta lugares y genera el Magic Link que compartes por WhatsApp para que el cliente registre a su grupo.",
      side: "bottom",
      align: "end",
    },
    {
      target: TOUR_TARGET.DASHBOARD_TABS,
      title: "Pasajeros y asientos",
      description:
        "Cambia entre la lista de pasajeros y el mapa de asientos, donde asignas el vehículo y acomodas a cada viajero.",
      side: "bottom",
      align: "start",
    },
    {
      target: TOUR_TARGET.DASHBOARD_FILTERS,
      title: "Encuentra a un viajero",
      description:
        "Busca por nombre o teléfono y filtra por pagos, formularios o asientos. Aquí también descargas la lista de abordaje.",
      side: "bottom",
      align: "start",
    },
    {
      target: TOUR_TARGET.DASHBOARD_TRAVELERS,
      title: "Reservas y cobranza",
      description:
        "Cada reserva agrupa al titular y sus acompañantes, con su asiento, punto de abordaje, registro y estado de pago. Despliega el grupo con la flecha de la izquierda para ver a cada acompañante.",
      side: "top",
      align: "start",
    },
    {
      target: TOUR_TARGET.DASHBOARD_ACTION_RECEIPT,
      title: "Estado de cuenta PDF",
      description:
        "Aparece cuando la reserva ya tiene abonos: descarga el estado de cuenta con la marca de tu agencia, los pasajeros y los pagos registrados.",
      side: "left",
      align: "center",
    },
    {
      target: TOUR_TARGET.DASHBOARD_ACTION_MAGIC_LINK,
      title: "Copiar Magic Link",
      description:
        "Copia el enlace personal del cliente. Con él registra a su grupo y después consulta su estado de cuenta y su pase de abordaje. No vence.",
      side: "left",
      align: "center",
    },
    {
      target: TOUR_TARGET.DASHBOARD_ACTION_PAYMENTS,
      title: "Registrar abonos y pagos",
      description:
        "Abre el detalle financiero de la reserva: registra abonos, revisa el historial de pagos y anula un abono mal capturado.",
      side: "left",
      align: "center",
    },
    {
      target: TOUR_TARGET.DASHBOARD_ACTION_TRANSFER,
      title: "Más acciones",
      description:
        "«Transferir titularidad» pasa la reserva y su saldo a otra persona. Al desplegar el grupo, cada acompañante tiene «Dar de baja pasajero» y «Transferir lugar», y cada lugar pendiente «Liberar lugar apartado».",
      side: "left",
      align: "center",
    },
    GUIDE_BUTTON_STEP,
  ],
};

export const TRAVELERS_GUIDED_TOUR: GuidedTourDefinition = {
  id: "travelers",
  // v2 (2026-11-15): un paso por botón de la columna "Acciones".
  version: 2,
  steps: [
    {
      title: "Directorio de Viajeros",
      description:
        "Cada persona que reservas o que se registra con un Magic Link queda aquí, identificada por su WhatsApp.",
    },
    {
      target: TOUR_TARGET.TRAVELERS_FILTERS,
      title: "Busca y filtra",
      description:
        "Encuentra a un viajero por nombre, teléfono o correo, y filtra por viajes nacionales o internacionales.",
      side: "bottom",
      align: "start",
    },
    {
      target: TOUR_TARGET.TRAVELERS_LIST,
      title: "Ficha del viajero",
      description:
        "Consulta su contacto, contacto de emergencia, los tipos de viaje que ha hecho y sus notas médicas.",
      side: "top",
      align: "start",
    },
    {
      target: TOUR_TARGET.TRAVELERS_ACTION_EDIT,
      title: "Editar viajero",
      description:
        "Corrige su nombre, WhatsApp, correo, fecha de nacimiento, contacto de emergencia o notas médicas.",
      side: "left",
      align: "center",
    },
    {
      target: TOUR_TARGET.TRAVELERS_ACTION_HISTORY,
      title: "Ver historial",
      description:
        "Muestra los tours en los que ha viajado y lo que ha pagado en total en cada moneda.",
      side: "left",
      align: "center",
    },
    {
      target: TOUR_TARGET.TRAVELERS_ACTION_DELETE,
      title: "Eliminar viajero",
      description: "Lo quita del directorio. Antes te pide confirmación.",
      side: "left",
      align: "center",
    },
    GUIDE_BUTTON_STEP,
  ],
};

export const SETTINGS_GUIDED_TOUR: GuidedTourDefinition = {
  id: "settings",
  version: 1,
  steps: [
    {
      title: "Configuración",
      description:
        "Aquí ajustas tu cuenta y los datos de tu agencia que ven tus viajeros. Cada pestaña guarda por separado.",
    },
    {
      target: TOUR_TARGET.SETTINGS_TAB_SECURITY,
      title: "Seguridad",
      description: "Revisa el correo y el rol de tu sesión y cambia tu contraseña.",
      side: "bottom",
      align: "start",
    },
    {
      target: TOUR_TARGET.SETTINGS_TAB_AGENCY,
      title: "Agencia",
      description:
        "Tu perfil público (nombre, correo, WhatsApp y dirección) y tus datos bancarios: banco, titular, CLABE y, si quieres, número de tarjeta. Tus viajeros los ven en el Magic Link y en su estado de cuenta.",
      side: "bottom",
      align: "start",
    },
    {
      target: TOUR_TARGET.SETTINGS_TAB_POLICIES,
      title: "Políticas",
      description:
        "Las políticas generales de tu agencia: el cliente las acepta al registrarse y se imprimen en todos los estados de cuenta PDF.",
      side: "bottom",
      align: "center",
    },
    {
      target: TOUR_TARGET.SETTINGS_TAB_BRANDING,
      title: "Identidad visual",
      description:
        "Sube tu logotipo (folleto, Magic Link y PDF) y elige los colores de marca de tus estados de cuenta.",
      side: "bottom",
      align: "center",
    },
    {
      target: TOUR_TARGET.SETTINGS_TAB_SUBSCRIPTION,
      title: "Suscripción",
      description:
        "Consulta los días que le quedan a tu prueba gratuita y activa el Plan PRO con tarjeta o transferencia SPEI.",
      side: "bottom",
      align: "end",
    },
    GUIDE_BUTTON_STEP,
  ],
};
