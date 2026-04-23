import "server-only";

import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import type { PppDiscountBreakdownRow, PppSavingsOrder, PppSavingsReport } from "@/lib/application/runtime/ppp-savings-service";

const PAGE_MARGIN = 12;
const HEADER_GREEN = "#315c49";
const LIGHT_ROW = "#f7f8f8";
const ALT_ROW = "#eef1f1";
const TOTAL_ROW = "#cfded5";
const PPP_GREEN = "#00ff00";
const GRID = "#d5dddd";
const TEXT = "#3f4344";

const columns = [
  { key: "brand", label: "Brand", width: 136, align: "left" },
  { key: "size", label: "Size", width: 52, align: "center" },
  { key: "quantity", label: "Quantity", width: 62, align: "center" },
  { key: "standardWholesale", label: "Standard\nWholesale", width: 82, align: "right" },
  { key: "currentPromoPrice", label: "Current\nPromo\nPrice", width: 82, align: "right" },
  { key: "pppPrice", label: "PPP\nPrice", width: 74, align: "right" },
  { key: "standardWholesaleTotal", label: "Standard\nWholesale\nTotal", width: 96, align: "right" },
  { key: "currentPromoTotal", label: "Current\nPromo\nTotal", width: 92, align: "right" },
  { key: "pppPricingTotal", label: "PPP\nPricing\nTotal", width: 90, align: "right" },
] as const;

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function shortDate(value: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function cellText(row: PppDiscountBreakdownRow, key: (typeof columns)[number]["key"]) {
  if (key === "brand") {
    return row.brand;
  }
  if (key === "size") {
    return row.size;
  }
  if (key === "quantity") {
    return row.quantity === null ? "-" : String(row.quantity);
  }
  const value = row[key];
  return typeof value === "number" ? money(value) : "-";
}

function tableWidth() {
  return columns.reduce((sum, column) => sum + column.width, 0);
}

function drawRect(doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number, fill: string, stroke = GRID) {
  doc.rect(x, y, width, height).fillAndStroke(fill, stroke);
}

function drawTitle(doc: PDFKit.PDFDocument, report: PppSavingsReport, order: PppSavingsOrder) {
  const width = tableWidth();
  const x = PAGE_MARGIN;
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(TEXT)
    .text("Discount Breakdown Summary", x, 6, { width, align: "center" });

  const orderDate = shortDate(order.orderDate);
  const subtitle = orderDate ? `${report.accountName} - Order #${order.orderNumber} - ${orderDate}` : `${report.accountName} - Order #${order.orderNumber}`;
  doc.font("Helvetica").fontSize(8).fillColor("#66706d").text(subtitle, x, 22, { width, align: "center" });
}

function drawHeader(doc: PDFKit.PDFDocument, y: number) {
  let x = PAGE_MARGIN;
  for (const column of columns) {
    drawRect(doc, x, y, column.width, 39, HEADER_GREEN, "#244636");
    doc
      .font("Helvetica-Bold")
      .fontSize(7.4)
      .fillColor("white")
      .text(column.label, x + 5, y + 7, {
        width: column.width - 10,
        height: 28,
        align: column.align,
        lineGap: -1,
      });
    x += column.width;
  }
}

function drawBreakdownRows(doc: PDFKit.PDFDocument, rows: PppDiscountBreakdownRow[], startY: number) {
  let y = startY;
  for (const [index, row] of rows.entries()) {
    let x = PAGE_MARGIN;
    const rowFill = index % 2 === 0 ? LIGHT_ROW : ALT_ROW;
    for (const column of columns) {
      const fill = column.key === "pppPrice" ? PPP_GREEN : rowFill;
      drawRect(doc, x, y, column.width, 23, fill);
      doc
        .font(column.key === "brand" ? "Helvetica-Bold" : "Helvetica")
        .fontSize(8.2)
        .fillColor(TEXT)
        .text(cellText(row, column.key), x + 6, y + 7, {
          width: column.width - 12,
          height: 10,
          align: column.align,
          ellipsis: true,
        });
      x += column.width;
    }
    y += 23;
  }
  return y;
}

function drawTotalRow(doc: PDFKit.PDFDocument, order: PppSavingsOrder, y: number) {
  let x = PAGE_MARGIN;
  const labelWidth = columns.slice(0, 6).reduce((sum, column) => sum + column.width, 0);
  drawRect(doc, x, y, labelWidth, 25, TOTAL_ROW, "#789184");
  doc.font("Helvetica-Bold").fontSize(9).fillColor(TEXT).text("Proposal Total", x + 6, y + 8, { width: labelWidth - 12 });
  x += labelWidth;

  const totals = [order.standardTotal, order.paidTotal, order.preferredTotal];
  for (const [index, value] of totals.entries()) {
    const column = columns[index + 6];
    drawRect(doc, x, y, column.width, 25, TOTAL_ROW, "#789184");
    doc.font("Helvetica-Bold").fontSize(9).fillColor(TEXT).text(money(value), x + 6, y + 8, {
      width: column.width - 12,
      align: "right",
    });
    x += column.width;
  }
}

function drawDiscountRow(doc: PDFKit.PDFDocument, label: string, value: number, y: number) {
  const totalWidth = tableWidth();
  const valueWidth = columns[8].width;
  const labelWidth = totalWidth - valueWidth;
  drawRect(doc, PAGE_MARGIN, y, labelWidth, 24, "#ffffff");
  drawRect(doc, PAGE_MARGIN + labelWidth, y, valueWidth, 24, PPP_GREEN);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(TEXT).text(label, PAGE_MARGIN + 6, y + 7, {
    width: labelWidth - 12,
    align: "right",
  });
  doc.font("Helvetica-Bold").fontSize(9).fillColor(TEXT).text(money(value), PAGE_MARGIN + labelWidth + 6, y + 7, {
    width: valueWidth - 12,
    align: "right",
  });
}

function drawOrderPage(doc: PDFKit.PDFDocument, report: PppSavingsReport, order: PppSavingsOrder) {
  drawTitle(doc, report, order);
  drawHeader(doc, 39);
  const afterRowsY = drawBreakdownRows(doc, order.breakdownRows, 78);
  drawTotalRow(doc, order, afterRowsY);
  const firstDiscountY = afterRowsY + 43;
  drawDiscountRow(doc, "Amount Discounted From Current Promo Pricing (PPP Discount)", order.discountFromPromo, firstDiscountY);
  drawDiscountRow(doc, "Amount Discounted From Standard Wholesale Pricing", order.discountFromStandard, firstDiscountY + 24);
}

export async function renderPppSavingsPdf(report: PppSavingsReport) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      layout: "landscape",
      margin: 0,
      info: {
        Title: `PICC PPP Savings - ${report.accountName}`,
        Subject: `${report.year} missed Preferred Partner savings`,
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    if (report.orders.length) {
      report.orders.forEach((order, index) => {
        if (index > 0) {
          doc.addPage();
        }
        drawOrderPage(doc, report, order);
      });
    } else {
      doc.font("Helvetica-Bold").fontSize(18).fillColor(TEXT).text("No eligible paid PICC orders found for this year.", 48, 48);
    }

    doc.end();
  });
}
