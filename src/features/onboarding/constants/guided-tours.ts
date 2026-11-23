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
  NOTIFICATIONS_BELL: "notifications-bell",
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
  DASHBOARD_ACTION_WHATSAPP: "dashboard-action-whatsapp",
  DASHBOARD_ACTION_PAYMENTS: "dashboard-action-payments",
  DASHBOARD_ACTION_TRANSFER: "dashboard-action-transfer",
  DASHBOARD_STAFF_SHARE: "dashboard-staff-share",
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
  // v3 (2026-11-23): hospedaje, cancelación desde el Centro de Control y notificaciones.
  version: 3,
  steps: [
    {
      title: "Tours y Operaciones",
      description:
        "Aquí controlas todas tus salidas: precios, lugares ocupados y si están próximas, en curso o finalizadas.",
    },
    {
      target: TOUR_TARGET.TOURS_CREATE,
      title: "Crea un tour",
      description:
        "Configura fechas de salida y regreso, precio, anticipo, capacidad, puntos de abordaje y el folleto PDF. Si dura más de un día, tendrá pestaña de Hospedaje.",
      side: "bottom",
      align: "end",
    },
    {
      target: TOUR_TARGET.TOURS_FILTERS,
      title: "Busca y filtra",
      description: "Encuentra una salida por nombre o destino y filtra por estado o tipo de viaje.",
      side: "bottom",
      align: "start",
    },
    {
      target: TOUR_TARGET.TOURS_LIST,
      title: "Tus salidas",
      description:
        "Revisa de un vistazo el precio, los lugares ocupados frente a tu capacidad vendible y el estatus de cada salida.",
      side: "top",
      align: "start",
    },
    {
      target: TOUR_TARGET.TOURS_ACTION_CONTROL_CENTER,
      title: "Centro de Control",
      description:
        "Entra al panel operativo del tour para gestionar reservas, abonos, asientos, hospedaje y lista de abordaje.",
      side: "left",
      align: "center",
    },
    {
      target: TOUR_TARGET.TOURS_ACTION_SHARE,
      title: "Compartir folleto",
      description:
        "Copia un mensaje listo para WhatsApp con el enlace del folleto digital, desde donde tu cliente puede apartar su lugar.",
      side: "left",
      align: "center",
    },
    {
      target: TOUR_TARGET.TOURS_ACTION_MORE,
      title: "Más opciones",
      description:
        "Edita los datos del tour o elimínalo (solo si aún no tiene reservas ni abonos). Para cancelar una salida, hazlo desde su Centro de Control.",
      side: "left",
      align: "center",
    },
    {
      target: TOUR_TARGET.NOTIFICATIONS_BELL,
      title: "Notificaciones",
      description:
        "Te avisa cuando un cliente aparta lugares desde tu folleto o completa el registro de su grupo en el Magic Link.",
      side: "bottom",
      align: "end",
    },
    GUIDE_BUTTON_STEP,
  ],
};

export const TOUR_DASHBOARD_GUIDED_TOUR: GuidedTourDefinition = {
  id: "tour-dashboard",
  // v3 (2026-11-23): hospedaje, "Enviar por WhatsApp" y enlace de staff.
  version: 3,
  steps: [
    {
      title: "Centro de Control",
      description:
        "Desde aquí operas toda la salida: reservas, cobranza, asientos, hospedaje y lista de abordaje.",
    },
    {
      target: TOUR_TARGET.DASHBOARD_KPIS,
      title: "Resumen del tour",
      description:
        "Monitorea lugares vendidos, lo cobrado frente a lo proyectado y cuántos pasajeros faltan por acomodar.",
      side: "bottom",
      align: "center",
    },
    {
      target: TOUR_TARGET.DASHBOARD_NEW_BOOKING,
      title: "Aparta lugares",
      description:
        "«Nueva Reserva» bloquea lugares y genera el Magic Link para que el cliente registre a su grupo por WhatsApp.",
      side: "bottom",
      align: "end",
    },
    {
      // Señala el contenedor de pestañas: la de Hospedaje solo existe en tours de varios días.
      target: TOUR_TARGET.DASHBOARD_TABS,
      title: "Pasajeros, asientos y hospedaje",
      description:
        "Alterna entre la lista de pasajeros, el mapa de asientos del transporte y Hospedaje (en tours con pernocta) para asignar cuartos y copiar el Rooming List.",
      side: "bottom",
      align: "start",
    },
    {
      target: TOUR_TARGET.DASHBOARD_FILTERS,
      title: "Encuentra a un viajero",
      description:
        "Busca por nombre o teléfono y filtra por pagos, formularios o asientos. Aquí mismo descargas la lista de abordaje.",
      side: "bottom",
      align: "start",
    },
    {
      target: TOUR_TARGET.DASHBOARD_TRAVELERS,
      title: "Reservas y cobranza",
      description:
        "Cada fila agrupa al titular y sus acompañantes con asiento, abordaje y saldo. Despliega con la flecha izquierda para ver el detalle.",
      side: "top",
      align: "start",
    },
    {
      target: TOUR_TARGET.DASHBOARD_ACTION_RECEIPT,
      title: "Estado de cuenta PDF",
      description:
        "Se activa en cuanto la reserva tiene abonos: descarga el comprobante con tu marca, pasajeros y pagos registrados.",
      side: "left",
      align: "center",
    },
    {
      target: TOUR_TARGET.DASHBOARD_ACTION_MAGIC_LINK,
      title: "Copiar Magic Link",
      description:
        "Copia el enlace personal del cliente para que registre a su grupo y consulte su estado de cuenta o pase de abordaje. No vence.",
      side: "left",
      align: "center",
    },
    {
      target: TOUR_TARGET.DASHBOARD_ACTION_WHATSAPP,
      title: "Enviar por WhatsApp",
      description:
        "Abre WhatsApp con un mensaje listo con el Magic Link, el anticipo pendiente y tus datos de transferencia. Aparece en reservas pendientes de registro o de pago.",
      side: "left",
      align: "center",
    },
    {
      target: TOUR_TARGET.DASHBOARD_ACTION_PAYMENTS,
      title: "Registrar abonos y pagos",
      description:
        "Abre el detalle financiero para registrar abonos, consultar el historial o anular un pago mal capturado.",
      side: "left",
      align: "center",
    },
    {
      target: TOUR_TARGET.DASHBOARD_ACTION_TRANSFER,
      title: "Más acciones",
      description:
        "Usa «Transferir titularidad» para ceder la reserva. Al desplegar el grupo puedes dar de baja pasajeros, transferir lugares o liberar apartados pendientes.",
      side: "left",
      align: "center",
    },
    {
      target: TOUR_TARGET.DASHBOARD_STAFF_SHARE,
      title: "Enlace de staff",
      description:
        "Comparte con tu guía o coordinador un enlace de solo lectura con el mapa de asientos y la lista de pasajeros con su punto de abordaje, sin montos ni datos de contacto.",
      side: "bottom",
      align: "end",
    },
    GUIDE_BUTTON_STEP,
  ],
};

export const TRAVELERS_GUIDED_TOUR: GuidedTourDefinition = {
  id: "travelers",
  // v3 (2026-11-23): eliminar = anonimizar (regla de privacidad).
  version: 3,
  steps: [
    {
      title: "Directorio de Viajeros",
      description:
        "Todo cliente que reservas o que se registra mediante un Magic Link se guarda aquí automáticamente, identificado por su WhatsApp.",
    },
    {
      target: TOUR_TARGET.TRAVELERS_FILTERS,
      title: "Busca y filtra",
      description:
        "Localiza rápido a cualquier viajero por nombre, teléfono o correo, y filtra por viajes nacionales o internacionales.",
      side: "bottom",
      align: "start",
    },
    {
      target: TOUR_TARGET.TRAVELERS_LIST,
      title: "Ficha del viajero",
      description:
        "Consulta sus datos de contacto, teléfono de emergencia y los tipos de viaje que ha realizado contigo.",
      side: "top",
      align: "start",
    },
    {
      target: TOUR_TARGET.TRAVELERS_ACTION_EDIT,
      title: "Editar viajero",
      description:
        "Actualiza su nombre, WhatsApp, correo, fecha de nacimiento o contacto de emergencia.",
      side: "left",
      align: "center",
    },
    {
      target: TOUR_TARGET.TRAVELERS_ACTION_HISTORY,
      title: "Ver historial",
      description:
        "Revisa todos los tours en los que ha viajado con tu agencia y el total pagado por moneda.",
      side: "left",
      align: "center",
    },
    {
      target: TOUR_TARGET.TRAVELERS_ACTION_DELETE,
      title: "Eliminar viajero",
      description:
        "Borra sus datos personales del directorio por privacidad, pero conserva su historial de viajes y pagos para tus reportes. No está disponible si tiene un viaje próximo o en curso.",
      side: "left",
      align: "center",
    },
    GUIDE_BUTTON_STEP,
  ],
};

export const SETTINGS_GUIDED_TOUR: GuidedTourDefinition = {
  id: "settings",
  // v2 (2026-11-23): textos actualizados.
  version: 2,
  steps: [
    {
      title: "Configuración",
      description:
        "Personaliza tu cuenta y la información pública que ven tus viajeros. Cada pestaña se guarda por separado.",
    },
    {
      target: TOUR_TARGET.SETTINGS_TAB_SECURITY,
      title: "Seguridad",
      description: "Consulta el correo y rol de tu usuario y actualiza tu contraseña.",
      side: "bottom",
      align: "start",
    },
    {
      target: TOUR_TARGET.SETTINGS_TAB_AGENCY,
      title: "Agencia",
      description:
        "Configura los datos públicos de tu agencia y tus cuentas bancarias (banco, titular, CLABE y tarjeta) para que tus clientes las vean en su Magic Link y estado de cuenta.",
      side: "bottom",
      align: "start",
    },
    {
      target: TOUR_TARGET.SETTINGS_TAB_POLICIES,
      title: "Políticas",
      description:
        "Define tus términos y condiciones de cancelación: el cliente los acepta al registrarse y se imprimen en cada estado de cuenta PDF.",
      side: "bottom",
      align: "center",
    },
    {
      target: TOUR_TARGET.SETTINGS_TAB_BRANDING,
      title: "Identidad visual",
      description:
        "Sube tu logotipo (para folleto, Magic Link y PDF) y elige los colores de tu marca.",
      side: "bottom",
      align: "center",
    },
    {
      target: TOUR_TARGET.SETTINGS_TAB_SUBSCRIPTION,
      title: "Suscripción",
      description:
        "Revisa el estatus de tu prueba gratuita y activa tu Plan PRO con tarjeta o transferencia SPEI.",
      side: "bottom",
      align: "end",
    },
    GUIDE_BUTTON_STEP,
  ],
};
