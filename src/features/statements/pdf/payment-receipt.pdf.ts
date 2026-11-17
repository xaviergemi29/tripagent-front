import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  type Currency,
  DEFAULT_CURRENCY,
  PASSENGER_ROLE,
  PAYMENT_METHOD,
} from "@/shared/constants/domain.constants";
import { formatCurrency } from "@/shared/utils/currency.util";
import { hexToRgb, type RgbTuple } from "@/shared/utils/color.util";
import {
  formatForDateInput,
  formatPickupTime,
  formatShortDateTime,
  formatSpanishLongDate,
} from "@/shared/utils/tour-date.util";
import { formatPhoneForDisplay, toPhoneDigits } from "@/shared/utils/share-links.util";
import { formatClabeForDisplay } from "@/shared/utils/bank-account.util";
import {
  getPaymentMethodText,
  PASSENGER_ROLE_DICT,
} from "@/shared/utils/config/status-dictionaries.config";

// ============================================================================
// Contrato: la vista que llama al generador ya tiene todos los datos
// (Magic Link → PartialPaymentView; operador → DashboardTravelerTable).
// ============================================================================

export interface PassengerItem {
  fullName: string;
  /** Titular (true) o acompañante (false). */
  isMainPassenger: boolean;
  pickupPointName: string;
  /** Hora del punto de abordaje, "HH:mm". */
  pickupTime?: string | null;
  /** Asiento asignado; sin valor se imprime "[Pendiente]". */
  seatNumber?: string | number | null;
  phone?: string | null;
}

export interface PaymentItem {
  id?: string;
  date: string | Date;
  /** Ej. "Anticipo Apartado de Lugares", "Abono a Cuenta" (ver `buildStatementPayments`). */
  concept: string;
  /** "TRANSFER" | "CASH" | "CARD" | "OTHER". */
  method: string;
  reference?: string | null;
  amount: number;
}

export interface StatementPDFData {
  agency: {
    name: string;
    subtitle?: string;
    email: string;
    whatsapp: string;
    /** DataURI o URL accesible (PNG/JPEG). */
    logoUrl?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    /** Acento (marcas de sección, línea del cierre). Nulo → secundario. */
    accentColor?: string | null;
    /**
     * Solo cuentas para depósito SPEI. El número de tarjeta NO se imprime (decisión del PM,
     * 2026-11-13: el PDF lo descarga y reenvía el cliente).
     */
    bankInfo?: {
      bankName: string;
      accountHolder: string;
      clabe: string;
    } | null;
    /**
     * Políticas generales de la agencia (Configuración → Políticas), texto libre ≤ 5000 caracteres.
     * Se imprimen al final en la tarjeta "POLÍTICAS DE LA AGENCIA". Vacías o nulas → no se imprime.
     */
    policies?: string | null;
  };
  tour: {
    title: string;
    routeSubtitle?: string | null;
    /** "YYYY-MM-DD". */
    departureDate: string;
    /** "HH:mm". */
    departureTime?: string | null;
    /** "YYYY-MM-DD"; nulo si el tour no tiene fecha de regreso. */
    returnDate?: string | null;
    returnTimeEstimated?: string | null;
    /** Lugares apartados (tamaño esperado del grupo). */
    totalPassengers: number;
    /** viajeros ya registrados (activos). */
    registeredPassengers: number;
    /**
     * Instrucciones Post-Pago del tour: indicaciones de logística ("Llevar botas de montaña").
     * Se imprimen en "INDICACIONES PARA TU VIAJE", antes de las políticas. Vacías → no se imprime.
     */
    postPaymentInstructions?: string | null;
  };
  /** Solo viajeros activos; el titular primero. */
  passengers: PassengerItem[];
  financials: {
    currency: Currency;
    totalAmount: number;
    paidAmount: number;
    /** `totalAmount − paidAmount`. `0` = viaje 100% liquidado. */
    balanceDue: number;
    /** Solo abonos válidos (sin anulaciones ni el abono anulado), en orden cronológico. */
    payments: PaymentItem[];
  };
  emissionDate?: Date | string;
}

/**
 * Convierte los abonos válidos al formato del estado de cuenta: orden cronológico y concepto
 * ("Anticipo Apartado de Lugares" el primero, "Abono a Cuenta" los demás). La base no guarda un
 * concepto por pago, así que se deriva del orden.
 */
export function buildStatementPayments(
  payments: Array<{
    id?: string;
    date: string | Date;
    amount: number;
    method: string;
    reference?: string | null;
  }>,
): PaymentItem[] {
  return [...payments]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((payment, index) => ({
      ...payment,
      concept: index === 0 ? "Anticipo Apartado de Lugares" : "Abono a Cuenta",
    }));
}

export interface ReceiptLogo {
  dataUrl: string;
  format: "PNG" | "JPEG";
}

// ============================================================================
// Paleta (Tailwind slate / emerald / amber / rose / blue)
// ============================================================================
const DEFAULT_PRIMARY = "#4f46e5";
const DEFAULT_SECONDARY = "#4338ca";
const DEFAULT_SUBTITLE = "Control Logístico & Reservaciones de Viaje";

const WHITE: RgbTuple = [255, 255, 255];
const SLATE_900: RgbTuple = [15, 23, 42];
const SLATE_800: RgbTuple = [30, 41, 59];
const SLATE_700: RgbTuple = [51, 65, 85];
const SLATE_600: RgbTuple = [71, 85, 105];
const SLATE_500: RgbTuple = [100, 116, 139];
const SLATE_400: RgbTuple = [148, 163, 184];
const SLATE_200: RgbTuple = [226, 232, 240];
const SLATE_100: RgbTuple = [241, 245, 249];
const SLATE_50: RgbTuple = [248, 250, 252];
const EMERALD_600: RgbTuple = [5, 150, 105];
const EMERALD_200: RgbTuple = [167, 243, 208];
const EMERALD_50: RgbTuple = [236, 253, 245];
const GREEN_200: RgbTuple = [187, 247, 208];
const GREEN_50: RgbTuple = [240, 253, 244];
const AMBER_600: RgbTuple = [217, 119, 6];
const AMBER_200: RgbTuple = [253, 230, 138];
const AMBER_100: RgbTuple = [254, 243, 199];
const AMBER_50: RgbTuple = [255, 251, 235];
const ROSE_600: RgbTuple = [225, 29, 72];
const ROSE_200: RgbTuple = [254, 205, 211];
const ROSE_100: RgbTuple = [255, 228, 230];
const ROSE_50: RgbTuple = [255, 241, 242];
const BLUE_600: RgbTuple = [37, 99, 235];
const BLUE_50: RgbTuple = [239, 246, 255];

const MARGIN = 14;
/** Espacio superior en páginas 2+ (encabezado corto) y reservado para el pie de página. */
const CONTINUATION_TOP = 24;
const FOOTER_SPACE = 20;

/**
 * Helvetica de jsPDF usa WinAnsi: los caracteres fuera de ese juego (emojis, flechas, etc.) salen
 * como basura. Se conservan ASCII, Latin-1 (acentos, ñ, ¿¡) y la puntuación tipográfica común.
 */
const toPdfSafeText = (text: string): string =>
  text
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, "  ")
    .replace(/[^\n\x20-\x7E\xA0-\xFF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u20AC]/g, "");

/** `jspdf-autotable` agrega `lastAutoTable` al documento en runtime, pero no lo declara. */
type JsPDFWithAutoTable = jsPDF & { lastAutoTable: { finalY: number } };

/** "Jueves, 12 de noviembre • 02:45 PM" con los formateadores del proyecto. */
const formatEmission = (value?: Date | string): string => {
  const date = value ? new Date(value) : new Date();
  const safe = isNaN(date.getTime()) ? new Date() : date;
  const time = `${String(safe.getHours()).padStart(2, "0")}:${String(safe.getMinutes()).padStart(2, "0")}`;
  return `${formatSpanishLongDate(formatForDateInput(safe))} • ${formatPickupTime(time)}`;
};

// ============================================================================
// Documento
// ============================================================================

/**
 * Arma el Estado de Cuenta del Viajero (A4 vertical, multipágina) para los estados Parcial y
 * 100% Liquidado. Es síncrono y no descarga nada: `generatePartialPaymentReceiptPDF` carga el
 * logotipo y guarda el archivo.
 */
export function createPaymentReceiptDocument(
  data: StatementPDFData,
  logo: ReceiptLogo | null = null,
): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  const rightX = pageWidth - MARGIN;

  const { agency, tour, passengers, financials } = data;
  const agencyName = agency.name?.trim() || "Agencia de Viajes";
  const currency = financials.currency || DEFAULT_CURRENCY;
  const primary = hexToRgb(agency.primaryColor, DEFAULT_PRIMARY);
  // Acento de marca: ícono del viaje y título de las cuentas bancarias.
  const secondary = hexToRgb(agency.secondaryColor, DEFAULT_SECONDARY);
  // Acento: el de la agencia o, si no definió uno, el secundario.
  const accent = hexToRgb(agency.accentColor || agency.secondaryColor, DEFAULT_SECONDARY);
  const whatsapp = formatPhoneForDisplay(agency.whatsapp);
  const money = (value: number) => formatCurrency(value, { currency });

  const balanceDue = Math.max(0, financials.balanceDue);
  const isFullyPaid = balanceDue === 0;
  const percentPaid =
    financials.totalAmount > 0
      ? Math.min(100, Math.round((financials.paidAmount / financials.totalAmount) * 100))
      : isFullyPaid
        ? 100
        : 0;

  // --- Utilidades de dibujo --------------------------------------------------
  const setText = (rgb: RgbTuple) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  const setFill = (rgb: RgbTuple) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const setDraw = (rgb: RgbTuple) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const font = (style: "normal" | "bold", size: number) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
  };
  const fitText = (text: string, maxWidth: number) =>
    (doc.splitTextToSize(text, maxWidth) as string[])[0] ?? "";

  /** Palomita dibujada: Helvetica (WinAnsi) no incluye el carácter ✓. */
  const drawCheck = (x: number, baselineY: number, color: RgbTuple, size = 1) => {
    setDraw(color);
    doc.setLineWidth(0.45 * size);
    doc.line(x, baselineY - 1.3 * size, x + 0.9 * size, baselineY - 0.4 * size);
    doc.line(x + 0.9 * size, baselineY - 0.4 * size, x + 2.6 * size, baselineY - 2.4 * size);
    doc.setLineWidth(0.2);
  };

  /** Insignia redondeada. `align: "right"` la ancla por su borde derecho en `x`. */
  const drawBadge = (
    text: string,
    x: number,
    y: number,
    opts: {
      fill: RgbTuple;
      color: RgbTuple;
      border?: RgbTuple;
      size?: number;
      height?: number;
      check?: boolean;
      align?: "left" | "right";
    },
  ) => {
    const size = opts.size ?? 7;
    const height = opts.height ?? 5;
    font("bold", size);
    const iconSpace = opts.check ? 3.6 : 0;
    const width = doc.getTextWidth(text) + iconSpace + 5;
    const left = opts.align === "right" ? x - width : x;
    setFill(opts.fill);
    if (opts.border) {
      setDraw(opts.border);
      doc.setLineWidth(0.2);
      doc.roundedRect(left, y, width, height, height / 2, height / 2, "FD");
    } else {
      doc.roundedRect(left, y, width, height, height / 2, height / 2, "F");
    }
    const baseline = y + height / 2 + size * 0.13;
    if (opts.check) drawCheck(left + 2.4, baseline, opts.color, size / 8);
    setText(opts.color);
    doc.text(text, left + 2.5 + iconSpace, baseline);
    return width;
  };

  /** Título de sección con una marca vertical en el color de acento. */
  const sectionHeader = (title: string, subtitle: string | null, y: number) => {
    setFill(accent);
    doc.roundedRect(MARGIN, y - 3.1, 1.2, subtitle ? 8.2 : 3.8, 0.6, 0.6, "F");
    font("bold", 8.5);
    setText(SLATE_700);
    doc.text(title, MARGIN + 3, y);
    if (subtitle) {
      font("normal", 7.5);
      setText(SLATE_500);
      doc.text(subtitle, MARGIN + 3, y + 4.5);
    }
  };

  // ==========================================================================
  // A. Franja superior y encabezado de marca
  // ==========================================================================
  setFill(primary);
  doc.rect(0, 0, pageWidth, 3, "F");

  let textX = MARGIN;
  if (logo) {
    try {
      const { width, height } = doc.getImageProperties(logo.dataUrl);
      const scale = Math.min(12.4 / width, 12.4 / height);
      const w = width * scale;
      const h = height * scale;
      doc.addImage(logo.dataUrl, logo.format, MARGIN + (14 - w) / 2, 12 + (14 - h) / 2, w, h);
      setDraw(SLATE_200);
      doc.setLineWidth(0.3);
      doc.roundedRect(MARGIN, 12, 14, 14, 2.5, 2.5, "S");
      doc.setLineWidth(0.2);
      textX = MARGIN + 17;
    } catch {
      // Un logo dañado no impide emitir el estado de cuenta.
    }
  }

  // Lado derecho: datos del documento.
  font("bold", 16);
  setText(SLATE_900);
  doc.text("Estado de Cuenta", rightX, 17.5, { align: "right" });
  font("normal", 8);
  setText(SLATE_500);
  const emission = `Emisión: ${formatEmission(data.emissionDate)}`;
  doc.text(emission, rightX, 23, { align: "right" });
  const rightBlockWidth = Math.max(doc.getTextWidth(emission), 50);

  // Lado izquierdo: marca de la agencia.
  const leftMaxWidth = rightX - rightBlockWidth - 6 - textX;
  font("bold", 15);
  setText(SLATE_900);
  doc.text(fitText(agencyName, leftMaxWidth), textX, 17.5);

  font("normal", 7.5);
  setText(SLATE_500);
  doc.text(fitText(agency.subtitle?.trim() || DEFAULT_SUBTITLE, leftMaxWidth), textX, 22);
  const contact = [agency.email?.trim(), whatsapp].filter(Boolean).join("  •  ");
  if (contact) doc.text(fitText(contact, leftMaxWidth), textX, 26);

  setDraw(SLATE_200);
  doc.line(MARGIN, 30.5, rightX, 30.5);

  // ==========================================================================
  // B. Información de tu viaje
  // ==========================================================================
  let y = 35;
  const tripCardHeight = 37;
  setFill(SLATE_50);
  setDraw(SLATE_200);
  doc.roundedRect(MARGIN, y, contentWidth, tripCardHeight, 3, 3, "FD");

  // Ícono de ubicación (pin, color de acento) + título.
  setFill(secondary);
  doc.circle(MARGIN + 5.2, y + 5.6, 1.5, "F");
  doc.triangle(MARGIN + 3.85, y + 6.2, MARGIN + 6.55, y + 6.2, MARGIN + 5.2, y + 8.6, "F");
  setFill(SLATE_50);
  doc.circle(MARGIN + 5.2, y + 5.6, 0.55, "F");
  font("bold", 8.5);
  setText(SLATE_700);
  doc.text("INFORMACIÓN DE TU VIAJE", MARGIN + 8.5, y + 7.3);

  drawBadge(
    isFullyPaid ? "Viaje 100% Liquidado" : "•  Abono Parcial en Curso",
    rightX - 4,
    y + 3.4,
    isFullyPaid
      ? {
          fill: EMERALD_50,
          border: EMERALD_200,
          color: EMERALD_600,
          check: true,
          align: "right",
          size: 7.5,
          height: 5.6,
        }
      : {
          fill: AMBER_100,
          border: AMBER_200,
          color: AMBER_600,
          align: "right",
          size: 7.5,
          height: 5.6,
        },
  );

  setDraw(SLATE_200);
  doc.line(MARGIN + 4, y + 11.5, rightX - 4, y + 11.5);

  const colWidth = (contentWidth - 8) / 4;
  const colX = (i: number) => MARGIN + 4 + colWidth * i;
  for (let i = 1; i < 4; i++) {
    doc.line(colX(i) - 2, y + 15, colX(i) - 2, y + tripCardHeight - 4);
  }

  const gridLabel = (label: string, i: number) => {
    font("bold", 6.5);
    setText(SLATE_500);
    doc.text(label, colX(i), y + 17.5);
  };
  /** Valor en negrita, hasta 2 líneas (las fechas largas no se recortan). Devuelve su alto extra. */
  const gridValue = (value: string, i: number, atY: number, size = 8.5) => {
    font("bold", size);
    setText(SLATE_900);
    const lines = (doc.splitTextToSize(value, colWidth - 3) as string[]).slice(0, 2);
    lines.forEach((line, idx) => doc.text(line, colX(i), atY + idx * 4));
    return (lines.length - 1) * 4;
  };
  const gridNote = (note: string, i: number, atY: number) => {
    font("normal", 7);
    setText(SLATE_500);
    doc.text(fitText(note, colWidth - 5), colX(i), atY);
  };

  // 1. Destino / experiencia (título hasta en 2 líneas).
  gridLabel("DESTINO / EXPERIENCIA", 0);
  font("bold", 9);
  setText(SLATE_900);
  const titleLines = (
    doc.splitTextToSize(tour.title || "Tour programado", colWidth - 5) as string[]
  ).slice(0, 2);
  titleLines.forEach((line, idx) => doc.text(line, colX(0), y + 22.5 + idx * 4));
  if (tour.routeSubtitle?.trim()) {
    gridNote(tour.routeSubtitle.trim(), 0, y + 23.5 + titleLines.length * 4);
  }

  // 2. Fecha de salida.
  gridLabel("FECHA DE SALIDA", 1);
  const departureExtra = gridValue(
    tour.departureDate
      ? formatSpanishLongDate(formatForDateInput(tour.departureDate))
      : "Por confirmar",
    1,
    y + 22.5,
  );
  if (tour.departureTime) {
    gridNote(`Hora de salida: ${formatPickupTime(tour.departureTime)}`, 1, y + 27 + departureExtra);
  }

  // 3. Fecha de regreso.
  gridLabel("FECHA DE REGRESO", 2);
  const returnExtra = gridValue(
    tour.returnDate ? formatSpanishLongDate(formatForDateInput(tour.returnDate)) : "Por confirmar",
    2,
    y + 22.5,
  );
  if (tour.returnTimeEstimated) {
    gridNote(
      `Llegada estimada: ${formatPickupTime(tour.returnTimeEstimated)}`,
      2,
      y + 27 + returnExtra,
    );
  }

  // 4. Total de viajero.
  gridLabel("TOTAL VIAJEROS", 3);
  const totalPassengers = Math.max(tour.totalPassengers, tour.registeredPassengers);
  gridValue(
    `${totalPassengers} ${totalPassengers === 1 ? "Viajero" : "Viajeros"}`,
    3,
    y + 23.5,
    12,
  );
  const pendingPassengers = Math.max(0, totalPassengers - tour.registeredPassengers);
  font("bold", 7);
  if (pendingPassengers === 0) {
    drawCheck(colX(3), y + 28.6, EMERALD_600, 0.8);
    setText(EMERALD_600);
    doc.text("100% Registrados", colX(3) + 3, y + 28.6);
  } else {
    setText(AMBER_600);
    doc.text(
      `${pendingPassengers} ${pendingPassengers === 1 ? "Pendiente" : "Pendientes"} de registro`,
      colX(3),
      y + 28.6,
    );
  }

  y += tripCardHeight + 9;

  // ==========================================================================
  // C. Tus acompañantes y lugares de abordaje
  // ==========================================================================
  sectionHeader(
    "TUS ACOMPAÑANTES Y LUGARES DE ABORDAJE",
    "Detalles de subida y asientos asignados para tu grupo",
    y,
  );
  drawBadge(
    `${passengers.length} ${passengers.length === 1 ? "Viajero" : "Viajeros"}`,
    rightX,
    y - 3.4,
    { fill: SLATE_100, color: SLATE_600, align: "right", size: 7 },
  );

  const SEAT_COLUMN = 4;
  autoTable(doc, {
    startY: y + 8,
    head: [
      [
        "#",
        "Nombre Completo del Pasajero",
        "Rol en Reserva",
        "Punto y Hora de Abordaje",
        "Asiento",
        "Teléfono de Contacto",
      ],
    ],
    body: passengers.map((p, idx) => {
      const phone = formatPhoneForDisplay(p.phone);
      return [
        String(idx + 1).padStart(2, "0"),
        p.fullName,
        PASSENGER_ROLE_DICT[p.isMainPassenger ? PASSENGER_ROLE.TITULAR : PASSENGER_ROLE.COMPANION],
        p.pickupTime
          ? `${p.pickupPointName || "Por coordinar"}\nHora: ${formatPickupTime(p.pickupTime)}`
          : p.pickupPointName || "Por coordinar",
        // El asiento se dibuja como insignia en didDrawCell.
        "",
        // Internacionales (E.164) pueden tener menos de 10 dígitos nacionales: basta con 8 en total.
        toPhoneDigits(phone).length >= 8 ? phone : "Sin teléfono",
      ];
    }),
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2.6,
      textColor: SLATE_800,
      valign: "middle",
    },
    headStyles: { fillColor: SLATE_50, textColor: SLATE_500, fontStyle: "bold", fontSize: 7 },
    bodyStyles: { lineColor: SLATE_100, lineWidth: { bottom: 0.3 } },
    columnStyles: {
      0: { cellWidth: 8, halign: "center", textColor: SLATE_400 },
      1: { cellWidth: "auto", fontStyle: "bold" },
      2: { cellWidth: 24, textColor: SLATE_500 },
      3: { cellWidth: 46 },
      4: { cellWidth: 22 },
      5: { cellWidth: 30, textColor: SLATE_600 },
    },
    didParseCell: (hook) => {
      if (hook.section === "body" && hook.column.index === 5 && hook.cell.raw === "Sin teléfono") {
        hook.cell.styles.textColor = SLATE_400;
      }
    },
    didDrawCell: (hook) => {
      if (hook.section !== "body" || hook.column.index !== SEAT_COLUMN) return;
      const seat = passengers[hook.row.index]?.seatNumber;
      const hasSeat = seat !== null && seat !== undefined && String(seat).trim() !== "";
      drawBadge(
        hasSeat ? `#${String(seat).trim()}` : "[Pendiente]",
        hook.cell.x + 2,
        hook.cell.y + hook.cell.height / 2 - 2.4,
        hasSeat
          ? { fill: BLUE_50, color: BLUE_600, size: 7.5, height: 4.8 }
          : { fill: AMBER_50, color: AMBER_600, size: 7, height: 4.8 },
      );
    },
    rowPageBreak: "avoid",
    margin: { left: MARGIN, right: MARGIN, top: CONTINUATION_TOP, bottom: FOOTER_SPACE },
  });
  y = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10;

  // ==========================================================================
  // D. Resumen de tus pagos (3 métricas)
  // ==========================================================================
  const cardHeight = 28;
  if (y + 4 + cardHeight > pageHeight - FOOTER_SPACE) {
    doc.addPage();
    y = CONTINUATION_TOP + 4;
  }
  sectionHeader("RESUMEN DE TUS PAGOS", null, y);

  const cardGap = 4;
  const cardWidth = (contentWidth - cardGap * 2) / 3;
  const cardY = y + 4;
  const metricCard = (
    i: number,
    opts: {
      fill: RgbTuple;
      border: RgbTuple;
      label: string;
      badge?: { text: string; fill: RgbTuple; color: RgbTuple; check?: boolean };
      amount: string;
      amountColor: RgbTuple;
      note: string;
      noteColor: RgbTuple;
    },
  ) => {
    const x = MARGIN + (cardWidth + cardGap) * i;
    setFill(opts.fill);
    setDraw(opts.border);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 2.5, 2.5, "FD");
    font("bold", 7);
    setText(SLATE_500);
    doc.text(opts.label, x + 4, cardY + 6.5);
    if (opts.badge) {
      drawBadge(opts.badge.text, x + cardWidth - 3, cardY + 3.3, {
        fill: opts.badge.fill,
        color: opts.badge.color,
        check: opts.badge.check,
        align: "right",
        size: 6.5,
        height: 4.4,
      });
    }
    font("bold", 14);
    setText(opts.amountColor);
    doc.text(fitText(opts.amount, cardWidth - 8), x + 4, cardY + 15.5);
    font("normal", 7);
    setText(opts.noteColor);
    doc.text(fitText(opts.note, cardWidth - 8), x + 4, cardY + 22.5);
  };

  const paymentsCount = financials.payments.length;
  metricCard(0, {
    fill: WHITE,
    border: SLATE_200,
    label: "TOTAL DEL VIAJE",
    amount: money(financials.totalAmount),
    amountColor: SLATE_900,
    note: `Tarifa total pactada (${totalPassengers} ${totalPassengers === 1 ? "viajero" : "viajeros"})`,
    noteColor: SLATE_500,
  });
  metricCard(1, {
    fill: WHITE,
    border: SLATE_200,
    label: "LLEVAS PAGADO",
    badge: { text: `${percentPaid}% Cubierto`, fill: EMERALD_50, color: EMERALD_600 },
    amount: `+${money(financials.paidAmount)}`,
    amountColor: EMERALD_600,
    note:
      paymentsCount === 1
        ? "1 abono verificado en cuenta"
        : `${paymentsCount} abonos verificados en cuenta`,
    noteColor: SLATE_500,
  });
  metricCard(
    2,
    isFullyPaid
      ? {
          fill: GREEN_50,
          border: GREEN_200,
          label: "SALDO POR LIQUIDAR",
          badge: { text: "Liquidado", fill: EMERALD_50, color: EMERALD_600, check: true },
          amount: money(0),
          amountColor: EMERALD_600,
          note: "¡Tu viaje está completamente pagado!",
          noteColor: EMERALD_600,
        }
      : {
          fill: ROSE_50,
          border: ROSE_200,
          label: "SALDO POR LIQUIDAR",
          badge: { text: `Resta ${100 - percentPaid}%`, fill: ROSE_100, color: ROSE_600 },
          amount: money(balanceDue),
          amountColor: ROSE_600,
          note: "Límite sugerido: 24h antes del tour",
          noteColor: SLATE_500,
        },
  );
  y = cardY + cardHeight + 10;

  // ==========================================================================
  // E. Tus abonos registrados (multipágina)
  // ==========================================================================
  if (y > pageHeight - FOOTER_SPACE - 25) {
    doc.addPage();
    y = CONTINUATION_TOP + 4;
  }
  sectionHeader("TUS ABONOS REGISTRADOS", "Movimientos verificados por la agencia", y);

  /** Sin referencia: nula, vacía o pago en efectivo. */
  const isMissingReference = (p: PaymentItem) =>
    !p.reference?.trim() || p.method?.toUpperCase() === PAYMENT_METHOD.CASH;

  autoTable(doc, {
    startY: y + 8,
    head: [
      ["#", "Fecha & Hora", "Concepto", "Método / Medio", "Referencia", `Importe (${currency})`],
    ],
    body:
      paymentsCount > 0
        ? financials.payments.map((p, idx) => [
            String(idx + 1).padStart(2, "0"),
            formatShortDateTime(typeof p.date === "string" ? p.date : p.date.toISOString()),
            p.concept?.trim() || "Abono a Cuenta",
            getPaymentMethodText(p.method),
            isMissingReference(p) ? "- Sin referencia -" : (p.reference ?? "").trim(),
            `+${money(p.amount)}`,
          ])
        : [
            [
              {
                content: "Aún no hay abonos registrados",
                colSpan: 6,
                styles: { halign: "center", textColor: SLATE_500, fontStyle: "italic" },
              },
            ],
          ],
    showHead: "everyPage",
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 3,
      textColor: SLATE_800,
      lineColor: SLATE_100,
      lineWidth: 0.2,
      valign: "middle",
    },
    headStyles: {
      fillColor: primary,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    alternateRowStyles: { fillColor: SLATE_50 },
    columnStyles: {
      0: { cellWidth: 10, halign: "center", textColor: SLATE_500 },
      1: { cellWidth: 42, fontStyle: "bold" },
      2: { cellWidth: "auto" },
      3: { cellWidth: 27 },
      4: { cellWidth: 30, textColor: SLATE_400 },
      5: { cellWidth: 30, halign: "right", fontStyle: "bold", textColor: EMERALD_600 },
    },
    rowPageBreak: "avoid",
    margin: { left: MARGIN, right: MARGIN, top: CONTINUATION_TOP, bottom: FOOTER_SPACE },
  });
  y = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 9;

  // ==========================================================================
  // F. Cierre: totales finales + cuentas bancarias (o mensaje de liquidado)
  // ==========================================================================
  const closingHeight = 48;
  if (y + closingHeight > pageHeight - FOOTER_SPACE) {
    doc.addPage();
    y = CONTINUATION_TOP + 4;
  }

  const totalsWidth = 82;
  const infoWidth = contentWidth - totalsWidth - 5;
  const totalsX = rightX - totalsWidth;

  // F.1 Resumen de cierre consolidado (alineado a la derecha).
  setFill(WHITE);
  setDraw(SLATE_200);
  doc.roundedRect(totalsX, y, totalsWidth, closingHeight, 2.5, 2.5, "FD");
  const totalsRow = (
    label: string,
    value: string,
    rowY: number,
    color: RgbTuple,
    emphasis = false,
  ) => {
    font(emphasis ? "bold" : "normal", 8.5);
    setText(emphasis ? SLATE_800 : SLATE_500);
    doc.text(label, totalsX + 5, rowY);
    font("bold", emphasis ? 10 : 9);
    setText(color);
    doc.text(value, rightX - 5, rowY, { align: "right" });
  };
  totalsRow("Subtotal Contratado", money(financials.totalAmount), y + 9, SLATE_900);
  totalsRow("Total Abonado a la Fecha", `+${money(financials.paidAmount)}`, y + 16.5, EMERALD_600);
  setDraw(accent);
  doc.setLineWidth(0.6);
  doc.line(totalsX + 5, y + 21, rightX - 5, y + 21);
  doc.setLineWidth(0.2);
  if (isFullyPaid) {
    totalsRow("Saldo Pendiente", money(0), y + 29, EMERALD_600, true);
    drawBadge("¡LIQUIDADO!", rightX - 5, y + 34, {
      fill: EMERALD_600,
      color: WHITE,
      check: true,
      align: "right",
      size: 7.5,
      height: 5.6,
    });
  } else {
    totalsRow("Saldo Pendiente por Liquidar", money(balanceDue), y + 29, ROSE_600, true);
    font("normal", 7);
    setText(SLATE_500);
    doc.text("Límite sugerido: 24h antes del tour", rightX - 5, y + 35, { align: "right" });
  }

  // F.2 Cuentas bancarias (con saldo) o mensaje cordial (liquidado).
  if (isFullyPaid) {
    setFill(GREEN_50);
    setDraw(GREEN_200);
    doc.roundedRect(MARGIN, y, infoWidth, closingHeight, 2.5, 2.5, "FD");
    drawCheck(MARGIN + 5, y + 9.3, EMERALD_600, 1.2);
    font("bold", 10);
    setText(EMERALD_600);
    doc.text("¡Tu reserva está garantizada!", MARGIN + 9.5, y + 9.3);
    font("normal", 8.5);
    setText(SLATE_700);
    doc.text(
      doc.splitTextToSize(
        "Te esperamos en tu punto de abordaje con identificación oficial.",
        infoWidth - 10,
      ) as string[],
      MARGIN + 5,
      y + 17,
    );
    if (whatsapp) {
      font("normal", 7.5);
      setText(SLATE_500);
      doc.text(`¿Dudas el día del viaje? WhatsApp ${whatsapp}`, MARGIN + 5, y + closingHeight - 6);
    }
  } else {
    setFill(SLATE_50);
    setDraw(SLATE_200);
    doc.roundedRect(MARGIN, y, infoWidth, closingHeight, 2.5, 2.5, "FD");
    font("bold", 8.5);
    setText(secondary);
    doc.text("Cuentas Bancarias Oficiales de la Agencia", MARGIN + 5, y + 7.5);

    const bank = agency.bankInfo;
    const bankRows: Array<[string, string]> = [];
    if (bank?.bankName?.trim()) bankRows.push(["Banco Emisor", bank.bankName.trim()]);
    if (bank?.accountHolder?.trim()) bankRows.push(["Titular", bank.accountHolder.trim()]);
    if (bank?.clabe?.trim()) {
      bankRows.push(["CLABE Interbancaria", formatClabeForDisplay(bank.clabe)]);
    }

    if (bankRows.length === 0) {
      font("normal", 8.5);
      setText(SLATE_500);
      doc.text("Consulta con la agencia los medios de pago disponibles.", MARGIN + 5, y + 15);
    } else {
      bankRows.forEach(([label, value], i) => {
        const rowY = y + 14.5 + i * 5.6;
        font("normal", 8);
        setText(SLATE_500);
        doc.text(label, MARGIN + 5, rowY);
        font("bold", 8.5);
        setText(SLATE_900);
        doc.text(fitText(value, infoWidth - 44), MARGIN + 39, rowY);
      });
    }

    font("normal", 7.5);
    setText(SLATE_500);
    doc.text(
      doc.splitTextToSize(
        "Envía tu comprobante con el nombre de tu reserva para registrarlo de inmediato.",
        infoWidth - 10,
      ) as string[],
      MARGIN + 5,
      y + closingHeight - 5.5,
    );
  }

  y += closingHeight + 11;

  // ==========================================================================
  // G. Tarjetas de texto libre, después del cierre de saldos:
  //    1) "INDICACIONES PARA TU VIAJE": Instrucciones Post-Pago del tour (logística).
  //    2) "POLÍTICAS DE LA AGENCIA": políticas generales de Configuración (reglas legales).
  //    Ambas vienen de un <textarea>: se respetan los saltos de línea, se hace word-wrap al ancho de
  //    la tarjeta y, si el texto no cabe, la tarjeta continúa en la página siguiente.
  // ==========================================================================
  /**
   * Dibuja una tarjeta gris con barra lateral de color, título, subtítulo y texto libre.
   * Texto vacío, nulo o solo espacios → no dibuja nada. Deja `y` debajo de la tarjeta.
   */
  const drawFreeTextCard = (opts: {
    title: string;
    subtitle: string;
    text: string | null | undefined;
    barColor: RgbTuple;
  }): void => {
    const text = toPdfSafeText(opts.text ?? "").trim();
    if (text === "") return;

    const padding = 6;
    const lineHeight = 3.6;
    const bodyFontSize = 7.5;
    const firstBaseline = 15; // título (5) + subtítulo (9) + divisoria (11) + aire
    const bottomPadding = 5;
    const minStartSpace = 45; // si queda menos que esto antes del pie, la tarjeta inicia en otra página
    const bottomLimit = pageHeight - FOOTER_SPACE;
    const textWidth = contentWidth - padding * 2;
    const cardHeightFor = (lines: number) =>
      firstBaseline + (lines - 1) * lineHeight + bottomPadding;

    font("normal", bodyFontSize);
    let pending: string[] = text
      .split("\n")
      .flatMap((paragraph) =>
        paragraph.trim() === ""
          ? [""]
          : (doc.splitTextToSize(paragraph.trimEnd(), textWidth) as string[]),
      );

    if (y + Math.min(cardHeightFor(pending.length), minStartSpace) > bottomLimit) {
      doc.addPage();
      y = CONTINUATION_TOP + 4;
    }

    let isContinuation = false;
    while (pending.length > 0) {
      if (isContinuation) {
        // Una línea en blanco no debe abrir la tarjeta de continuación.
        while (pending[0] === "") pending = pending.slice(1);
        if (pending.length === 0) break;
      }
      const fitting =
        Math.floor((bottomLimit - y - firstBaseline - bottomPadding) / lineHeight) + 1;
      const chunk = pending.slice(0, Math.max(1, fitting));
      pending = pending.slice(chunk.length);
      const cardHeight = cardHeightFor(chunk.length);

      // 1. Fondo gris sutil con borde ligero.
      setFill(SLATE_50);
      setDraw(SLATE_200);
      doc.setLineWidth(0.3);
      doc.roundedRect(MARGIN, y, contentWidth, cardHeight, 2.5, 2.5, "FD");
      // 2. Barra lateral con el color de la marca.
      setFill(opts.barColor);
      doc.roundedRect(MARGIN, y, 2, cardHeight, 1, 1, "F");

      // 3. Encabezado: título, subtítulo y divisoria.
      font("bold", 8.5);
      setText(SLATE_800);
      doc.text(
        isContinuation ? `${opts.title} (CONTINUACIÓN)` : opts.title,
        MARGIN + padding,
        y + 5,
      );
      font("normal", 7);
      setText(SLATE_500);
      doc.text(opts.subtitle, MARGIN + padding, y + 9);
      setDraw(SLATE_100);
      doc.setLineWidth(0.2);
      doc.line(MARGIN + padding, y + 11, MARGIN + contentWidth - padding, y + 11);

      // 4. Texto libre, línea por línea.
      font("normal", bodyFontSize);
      setText(SLATE_700);
      chunk.forEach((line, i) => {
        if (line !== "") doc.text(line, MARGIN + padding, y + firstBaseline + i * lineHeight);
      });

      y += cardHeight + 6;
      if (pending.length > 0) {
        doc.addPage();
        y = CONTINUATION_TOP + 4;
        isContinuation = true;
      }
    }
  };

  drawFreeTextCard({
    title: "INDICACIONES PARA TU VIAJE",
    subtitle: "Lo que necesitas saber y llevar el día de la salida",
    text: tour.postPaymentInstructions,
    barColor: accent,
  });
  drawFreeTextCard({
    title: "POLÍTICAS DE LA AGENCIA",
    subtitle: "Términos y condiciones del servicio contratado",
    text: agency.policies,
    barColor: primary,
  });

  // ==========================================================================
  // Encabezado corto (páginas 2+) y pie "Página X de Y". Se dibujan al final porque
  // hasta aquí se conoce el total de páginas.
  // ==========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);

    if (page > 1) {
      setFill(primary);
      doc.rect(0, 0, pageWidth, 3, "F");
      font("bold", 9);
      setText(SLATE_900);
      doc.text(fitText(agencyName, contentWidth / 2), MARGIN, 12);
      font("normal", 8);
      setText(SLATE_500);
      doc.text(`Estado de Cuenta  •  ${fitText(tour.title || "", 80)}`, rightX, 12, {
        align: "right",
      });
      setDraw(SLATE_200);
      doc.setLineWidth(0.2);
      doc.line(MARGIN, 15, rightX, 15);
    }

    setDraw(SLATE_200);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, pageHeight - 15, rightX, pageHeight - 15);
    font("normal", 7.5);
    setText(SLATE_400);
    doc.text(
      fitText(
        `${agencyName} • Comprobante emitido automáticamente por TripAgent`,
        contentWidth - 30,
      ),
      MARGIN,
      pageHeight - 10,
    );
    doc.text(`Página ${page} de ${totalPages}`, rightX, pageHeight - 10, { align: "right" });
  }

  return doc;
}

// ============================================================================
// Descarga
// ============================================================================

/** Obtiene el logotipo (DataURI o URL) como dataURL. Si falla, el PDF se emite sin logo. */
async function loadReceiptLogo(logoUrl?: string | null): Promise<ReceiptLogo | null> {
  if (!logoUrl) return null;
  const formatOf = (mime: string): ReceiptLogo["format"] | null =>
    mime === "image/png" ? "PNG" : mime === "image/jpeg" || mime === "image/jpg" ? "JPEG" : null;

  if (logoUrl.startsWith("data:")) {
    const format = formatOf(logoUrl.slice(5, logoUrl.indexOf(";")));
    return format ? { dataUrl: logoUrl, format } : null;
  }

  try {
    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    const format = formatOf(blob.type);
    if (!format) return null;
    const dataUrl = await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
    return dataUrl ? { dataUrl, format } : null;
  } catch {
    return null;
  }
}

/**
 * Genera y descarga el Estado de Cuenta del Viajero (Parcial o 100% Liquidado).
 * La vista que lo llama ya debe tener todos los datos (`StatementPDFData`).
 */
export async function generatePartialPaymentReceiptPDF(data: StatementPDFData): Promise<void> {
  const logo = await loadReceiptLogo(data.agency.logoUrl);
  const doc = createPaymentReceiptDocument(data, logo);

  const slug = (data.tour.title || "tour")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);

  doc.save(`estado-de-cuenta-${slug || "tour"}.pdf`);
}
