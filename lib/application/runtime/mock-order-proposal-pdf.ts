import "server-only";

import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import type { MockOrderProposalItem, MockOrderProposalReport } from "@/lib/application/runtime/mock-order-proposal-service";

const PAGE_MARGIN = 36;
const HEADER = "#1f4f3b";
const LIGHT_ROW = "#f7f8f7";
const ALT_ROW = "#edf2ef";
const GRID = "#d5ddda";
const TEXT = "#252928";
const ROW_HEIGHT = 25;
const FIRST_PAGE_ROWS = 15;
const CONTINUATION_ROWS = 18;

const columns = [
  { key: "skuCode", label: "SKU", width: 86, align: "left" },
  { key: "product", label: "Product", width: 226, align: "left" },
  { key: "strainType", label: "Type", width: 48, align: "center" },
  { key: "casePackSize", label: "Case\nSize", width: 48, align: "right" },
  { key: "availableUnits", label: "Avail.\nUnits", width: 56, align: "right" },
  { key: "proposedCases", label: "Cases", width: 48, align: "right" },
  { key: "proposedUnits", label: "Units", width: 48, align: "right" },
  { key: "unitPrice", label: "Unit\nPrice", width: 60, align: "right" },
  { key: "lineTotal", label: "Line\nTotal", width: 68, align: "right" },
  { key: "expirationDate", label: "COA Exp.", width: 70, align: "center" },
] as const;

type ColumnKey = (typeof columns)[number]["key"];

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
    return "-";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10);
}

function tableWidth() {
  return columns.reduce((sum, column) => sum + column.width, 0);
}

function cellText(item: MockOrderProposalItem, key: ColumnKey) {
  if (key === "unitPrice" || key === "lineTotal") {
    return money(item[key]);
  }
  if (key === "expirationDate") {
    return shortDate(item.expirationDate);
  }
  return String(item[key] ?? "-");
}

function drawRect(doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number, fill: string, stroke = GRID) {
  doc.rect(x, y, width, height).fillAndStroke(fill, stroke);
}

function drawTitle(doc: PDFKit.PDFDocument, report: MockOrderProposalReport, pageTitle: string) {
  doc.font("Helvetica-Bold").fontSize(18).fillColor(TEXT).text("Mock Order Proposal", PAGE_MARGIN, 28);
  doc.font("Helvetica").fontSize(10).fillColor("#5c6764").text(`${report.accountName} - ${pageTitle}`, PAGE_MARGIN, 51);
  doc.font("Helvetica").fontSize(8.5).fillColor("#6b7471").text(`Generated ${shortDate(report.generatedAt)} from live NY inventory. PDF only; no order was created.`, PAGE_MARGIN, 68);
}

function drawSummary(doc: PDFKit.PDFDocument, report: MockOrderProposalReport) {
  const y = 92;
  const cards = [
    ["Items", String(report.items.length)],
    ["Cases", String(report.totals.cases)],
    ["Units", String(report.totals.units)],
    ["Est. subtotal", money(report.totals.subtotal)],
  ];
  cards.forEach(([label, value], index) => {
    const x = PAGE_MARGIN + index * 140;
    drawRect(doc, x, y, 124, 46, "#f3f6f4", "#cfd8d3");
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#6b7471").text(label.toUpperCase(), x + 10, y + 9);
    doc.font("Helvetica-Bold").fontSize(14).fillColor(TEXT).text(value, x + 10, y + 24, { width: 104, ellipsis: true });
  });
}

function drawHeader(doc: PDFKit.PDFDocument, y: number) {
  let x = PAGE_MARGIN;
  for (const column of columns) {
    drawRect(doc, x, y, column.width, 34, HEADER, "#173a2c");
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("white").text(column.label, x + 5, y + 8, {
      width: column.width - 10,
      height: 20,
      align: column.align,
      lineGap: -1,
    });
    x += column.width;
  }
}

function drawRows(doc: PDFKit.PDFDocument, items: MockOrderProposalItem[], startY: number) {
  let y = startY;
  for (const [index, item] of items.entries()) {
    let x = PAGE_MARGIN;
    const fill = index % 2 === 0 ? LIGHT_ROW : ALT_ROW;
    for (const column of columns) {
      drawRect(doc, x, y, column.width, ROW_HEIGHT, fill);
      doc.font(column.key === "product" ? "Helvetica-Bold" : "Helvetica").fontSize(7.2).fillColor(TEXT).text(cellText(item, column.key), x + 5, y + 8, {
        width: column.width - 10,
        height: 10,
        align: column.align,
        ellipsis: true,
      });
      x += column.width;
    }
    y += ROW_HEIGHT;
  }
  return y;
}

function drawFooter(doc: PDFKit.PDFDocument, report: MockOrderProposalReport) {
  const y = 560;
  doc.font("Helvetica").fontSize(8).fillColor("#65706c").text(
    `${report.diagnostics.rowsScanned} inventory rows scanned across ${report.diagnostics.pagesScanned} pages. ${report.diagnostics.rowsExcludedAsDisplayOrSample} non-sellable rows excluded. ${report.diagnostics.rowsExcludedBelowCasePack} rows had less than one full case in stock.`,
    PAGE_MARGIN,
    y,
    { width: tableWidth() },
  );
}

function drawTotals(doc: PDFKit.PDFDocument, report: MockOrderProposalReport, y: number) {
  const width = tableWidth();
  drawRect(doc, PAGE_MARGIN, y, width, 32, "#dbe8df", "#8da295");
  doc.font("Helvetica-Bold").fontSize(10).fillColor(TEXT).text("Proposal Total", PAGE_MARGIN + 10, y + 11);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(TEXT).text(money(report.totals.subtotal), PAGE_MARGIN + width - 160, y + 11, {
    width: 150,
    align: "right",
  });
}

export async function renderMockOrderProposalPdf(report: MockOrderProposalReport) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      layout: "landscape",
      margin: 0,
      info: {
        Title: `Mock Order Proposal - ${report.accountName}`,
        Subject: "Live Nabis inventory proposal",
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const chunksOfItems: MockOrderProposalItem[][] = [];
    let remaining = [...report.items];
    chunksOfItems.push(remaining.splice(0, FIRST_PAGE_ROWS));
    while (remaining.length) {
      chunksOfItems.push(remaining.splice(0, CONTINUATION_ROWS));
    }

    if (!chunksOfItems.length || !chunksOfItems[0].length) {
      drawTitle(doc, report, "No eligible live inventory");
      doc.font("Helvetica-Bold").fontSize(14).fillColor(TEXT).text("No in-stock products with at least one full case were found.", PAGE_MARGIN, 118);
      drawFooter(doc, report);
    } else {
      chunksOfItems.forEach((items, index) => {
        if (index > 0) {
          doc.addPage();
        }
        drawTitle(doc, report, index === 0 ? "One full case per in-stock product" : `continued ${index + 1}`);
        if (index === 0) {
          drawSummary(doc, report);
        }
        const headerY = index === 0 ? 154 : 92;
        drawHeader(doc, headerY);
        const y = drawRows(doc, items, headerY + 34);
        if (index === chunksOfItems.length - 1) {
          drawTotals(doc, report, y + 10);
        }
        drawFooter(doc, report);
      });
    }

    doc.end();
  });
}
