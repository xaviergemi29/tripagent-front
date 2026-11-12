import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatSpanishLongDate, formatForDateInput } from "@/shared/utils/tour-date.util";
import { formatCurrency } from "@/shared/utils/currency.util";
import { type Currency, DEFAULT_CURRENCY } from "@/shared/constants/domain.constants";

export interface PaymentReceiptData {
  agencyName: string;
  agencyPhone?: string;
  tourName: string;
  departureDate?: string;
  bookingRef?: string;
  passengerLeadName?: string;
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  status: string;
  currency?: Currency;
  paymentHistory: Array<{
    id: string;
    date: string;
    amount: number;
    method: string;
    reference?: string;
  }>;
  passengers?: Array<{
    name: string;
    type: string;
    boardingPoint?: string;
    departureTime?: string;
  }>;
}

/** `jspdf-autotable` agrega `lastAutoTable` al documento en runtime, pero no lo declara en sus tipos. */
type JsPDFWithAutoTable = jsPDF & { lastAutoTable: { finalY: number } };

const formatFullDateNow = () => {
  const d = new Date();
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
};

const getMethodText = (method: string) => {
  switch (method?.toUpperCase()) {
    case "TRANSFER":
      return "Transferencia";
    case "CASH":
      return "Efectivo";
    case "CARD":
      return "Tarjeta / Link";
    default:
      return method || "Pago";
  }
};

export function generatePartialPaymentReceiptPDF(data: PaymentReceiptData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primaryColor = [67, 56, 202]; // #4338ca (Indigo)
  const darkSlate = [30, 41, 59]; // #1e293b (Slate 800)
  const lightBg = [248, 250, 252]; // #f8fafc (Slate 50)

  const isFullyPaid = data.remainingBalance <= 0;
  const docCurrency = data.currency || DEFAULT_CURRENCY;

  // 1. FRANJA SUPERIOR CORPORATIVA
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 5, "F");

  // 2. ENCABEZADO INSTITUCIONAL
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text((data.agencyName || "Agencia de Viajes").toUpperCase(), 14, 18);

  doc.setFontSize(13);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text("Comprobante de Abonos", 14, 25);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Fecha de emisión: ${formatFullDateNow()}`, pageWidth - 14, 18, {
    align: "right",
  });

  if (data.agencyPhone) {
    doc.text(`Contacto: ${data.agencyPhone}`, pageWidth - 14, 23, {
      align: "right",
    });
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 29, pageWidth - 14, 29);

  // 3. TARJETA DE INFORMACIÓN DEL TOUR
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 33, pageWidth - 28, 21, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("DETALLES DE LA RESERVACIÓN", 18, 39);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text("Tour:", 18, 45);
  doc.setFont("helvetica", "bold");
  doc.text(data.tourName || "Tour Programado", 30, 45);

  if (data.passengerLeadName) {
    doc.setFont("helvetica", "normal");
    doc.text("Titular:", 18, 50);
    doc.setFont("helvetica", "bold");
    doc.text(data.passengerLeadName, 32, 50);
  }

  if (data.departureDate) {
    doc.setFont("helvetica", "normal");
    doc.text("Fecha de salida:", pageWidth / 2 + 5, 45);
    doc.setFont("helvetica", "bold");

    const formattedDeparture = formatSpanishLongDate(formatForDateInput(data.departureDate));
    doc.text(formattedDeparture, pageWidth / 2 + 35, 45);
  }

  doc.setFont("helvetica", "normal");
  doc.text("Estado del viaje:", pageWidth / 2 + 5, 50);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(isFullyPaid ? 5 : 180, isFullyPaid ? 150 : 83, isFullyPaid ? 105 : 9);
  doc.text(isFullyPaid ? "100% Liquidado" : "Pagos Parciales", pageWidth / 2 + 35, 50);

  // 4. RESUMEN FINANCIERO (3 CARDS HORIZONTALES)
  const cardY = 58;
  const cardW = (pageWidth - 28 - 6) / 3;

  // Card Costo Total
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, cardY, cardW, 16, 2, 2, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("COSTO TOTAL", 18, cardY + 5.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(formatCurrency(data.totalAmount, { currency: docCurrency }), 18, cardY + 12);

  // Card Total Abonado
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(14 + cardW + 3, cardY, cardW, 16, 2, 2, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(4, 120, 87);
  doc.text("TOTAL ABONADO", 18 + cardW + 3, cardY + 5.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(6, 95, 70);
  doc.text(
    `+${formatCurrency(data.amountPaid, { currency: docCurrency })}`,
    18 + cardW + 3,
    cardY + 12,
  );

  // Card Saldo Pendiente
  doc.setFillColor(isFullyPaid ? 248 : 254, isFullyPaid ? 250 : 242, isFullyPaid ? 252 : 242);
  doc.setDrawColor(isFullyPaid ? 226 : 254, isFullyPaid ? 232 : 202, isFullyPaid ? 240 : 202);
  doc.roundedRect(14 + (cardW + 3) * 2, cardY, cardW, 16, 2, 2, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(isFullyPaid ? 100 : 185, isFullyPaid ? 116 : 28, isFullyPaid ? 139 : 28);
  doc.text("PENDIENTE POR PAGAR", 18 + (cardW + 3) * 2, cardY + 5.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(
    isFullyPaid ? darkSlate[0] : 185,
    isFullyPaid ? darkSlate[1] : 28,
    isFullyPaid ? darkSlate[2] : 28,
  );
  doc.text(
    formatCurrency(data.remainingBalance, { currency: docCurrency }),
    18 + (cardW + 3) * 2,
    cardY + 12,
  );

  // 🚀 5. TABLA DE PASAJEROS (NUEVA SECCIÓN)
  let currentY = 84;

  if (data.passengers && data.passengers.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("PASAJEROS Y LOGÍSTICA", 14, currentY);

    const passengerBody = data.passengers.map((p) => {
      const boardingStr = p.boardingPoint
        ? `${p.boardingPoint}${p.departureTime ? ` (${p.departureTime})` : ""}`
        : "Por coordinar";
      return [p.name, p.type, boardingStr];
    });

    autoTable(doc, {
      startY: currentY + 4,
      head: [["Nombre del pasajero", "Rol", "Punto de abordaje"]],
      body: passengerBody,
      theme: "plain",
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [100, 116, 139],
        fontStyle: "bold",
        fontSize: 8,
        halign: "left",
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: "bold", textColor: [51, 65, 85] },
        1: { cellWidth: 30, textColor: [100, 116, 139] },
        2: { cellWidth: "auto", textColor: [100, 116, 139] },
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [226, 232, 240],
        lineWidth: { bottom: 0.1 },
      },
      margin: { left: 14, right: 14 },
    });

    // Desplazamos `currentY` al punto donde terminó la tabla de pasajeros
    currentY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 12;
  }

  // 6. TABLA DE DEPÓSITOS Y ABONOS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("HISTORIAL DE PAGOS Y ABONOS", 14, currentY);

  const sortedPayments = [...(data.paymentHistory || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const tableBody = sortedPayments.map((p, idx) => {
    const formattedDate = formatSpanishLongDate(formatForDateInput(p.date));

    return [
      String(sortedPayments.length - idx),
      formattedDate,
      `+${formatCurrency(p.amount, { currency: docCurrency })}`,
      getMethodText(p.method),
      p.reference?.trim() ? p.reference.trim() : "—",
    ];
  });

  autoTable(doc, {
    startY: currentY + 4,
    head: [["No.", "Fecha del abono", "Monto", "Método de pago", "Referencia"]],
    body: tableBody.length > 0 ? tableBody : [["—", "Sin abonos", "$0.00 MXN", "—", "—"]],
    theme: "striped",
    headStyles: {
      fillColor: [67, 56, 202],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left",
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 38 },
      2: { cellWidth: 35, fontStyle: "bold", textColor: [5, 150, 105] },
      3: { cellWidth: 40 },
      4: { cellWidth: "auto", textColor: [100, 116, 139] },
    },
    styles: {
      fontSize: 8.5,
      textColor: [51, 65, 85],
      cellPadding: 3,
      valign: "middle",
    },
    margin: { left: 14, right: 14, bottom: 18 },
    didDrawPage: (dataHook) => {
      // 7. PIE DE PÁGINA
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.setDrawColor(241, 245, 249);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

      doc.text(
        "Este documento contiene el historial oficial de abonos registrados para la reservación.",
        14,
        pageHeight - 7,
      );

      const pageStr = `Página ${dataHook.pageNumber} de ${doc.getNumberOfPages()}`;
      doc.text(pageStr, pageWidth - 14, pageHeight - 7, { align: "right" });
    },
  });

  const cleanTitle = (data.tourName || "tour")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 25);

  doc.save(`comprobante-abonos-${cleanTitle}.pdf`);
}
