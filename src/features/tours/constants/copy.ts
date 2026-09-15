export const TOUR_FORM_COPY = {
  title: "Configurar Nuevo Tour",
  description: "Define el precio y cómo prefieres recibir los pagos.",
  fields: {
    title: {
      label: "Título del Tour",
      placeholder: "Ej. Excursión a Cuetzalan y Cascadas",
    },
    deaperture: "Fecha del Viaje",
    capacity: "Capacidad Total (Asientos)",
    description: "Descripción (Itinerario e inclusiones)",
    recommendations: "Recomendaciones para el turista",
    price: "Precio (MXN)",
    duration: "Duración (Horas)",
    pointOfOrigin: "Punto de Encuentro",
    paymentSection: {
      title: "Configuración de Cobro",
      description: "Métodos de Pago y Anticipos.",
    },
    paymentTypes: {
      spei: {
        title: "Acepta SPEI",
        label: "Datos Bancarios (Banco, CLABE, Titular)",
      },
      credit: {
        title: "Acepta Tarjeta",
        label: "Enlace de Pago (Stripe / MercadoPago)",
      },
      cash: {
        title: "Acepta Efectivo",
        label: "Condiciones para pago en efectivo",
        placholder: "Ej. Pago en efectivo directamente al abordar la van",
      },
    },
  },
  confirmInstruction: "Instrucciones Post-Pago / Confirmación",
  actions: {
    submit: "Guardar Tour",
    reset: "Limpiar",
  },
  errors: {
    titleMinLength: "El título debe tener al menos 5 caracteres",
    // ... otros errores mapeados en Zod
  },
} as const; // Convierte el objeto en readonly y fija los tipos literales
