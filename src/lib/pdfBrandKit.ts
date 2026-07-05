import type { jsPDF } from 'jspdf';
import { setPdfFont } from '@/lib/pdfUnicodeFont';

/** Paletă și dimensiuni standard rapoarte artGRANIT */
export const PDF_BRAND = {
  gold: [179, 143, 85] as const,
  dark: [12, 12, 12] as const,
  slate800: [30, 41, 59] as const,
  slate700: [51, 65, 85] as const,
  slate600: [71, 85, 105] as const,
  slate500: [100, 116, 139] as const,
  slate200: [226, 232, 240] as const,
  slate100: [241, 245, 249] as const,
  paper: [252, 252, 251] as const,
  green: [22, 163, 74] as const,
  amber: [217, 119, 6] as const,
  red: [220, 38, 38] as const,
  margin: 16,
  headerH: 32,
  footerY: 287,
} as const;

export type PdfAccent = 'ok' | 'warn' | 'alert' | 'neutral';

export function formatPdfRoDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatPdfRoDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ro-RO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateReportReference(prefix: string): string {
  const d = new Date();
  const stamp = d.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(d.getTime()).slice(-4);
  return `${prefix}-${stamp}-${seq}`;
}

/** Logo SVG → PNG alb pentru header închis */
export async function loadBrandLogoWhitePng(): Promise<string | null> {
  try {
    const res = await fetch('/brand/artgranit-logo.svg');
    if (!res.ok) return null;
    const svgText = await res.text();
    const whiteSvg = svgText.replace(/currentColor/g, '#FFFFFF');
    const blob = new Blob([whiteSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 426;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  } catch {
    return null;
  }
}

export function accentColor(accent: PdfAccent): readonly [number, number, number] {
  if (accent === 'ok') return PDF_BRAND.green;
  if (accent === 'warn') return PDF_BRAND.amber;
  if (accent === 'alert') return PDF_BRAND.red;
  return PDF_BRAND.slate500;
}

export interface PdfLayoutContext {
  doc: jsPDF;
  w: number;
  h: number;
  margin: number;
  contentW: number;
  y: number;
}

export function createPdfLayout(doc: jsPDF): PdfLayoutContext {
  return {
    doc,
    w: doc.internal.pageSize.getWidth(),
    h: doc.internal.pageSize.getHeight(),
    margin: PDF_BRAND.margin,
    contentW: doc.internal.pageSize.getWidth() - PDF_BRAND.margin * 2,
    y: 0,
  };
}

export function ensurePdfSpace(ctx: PdfLayoutContext, needed: number, onNewPage?: () => void) {
  if (ctx.y + needed > ctx.h - 20) {
    ctx.doc.addPage();
    ctx.y = 22;
    onNewPage?.();
  }
}

export async function drawBrandedReportHeader(
  ctx: PdfLayoutContext,
  opts: {
    title: string;
    subtitle: string;
    department?: string;
    reportRef: string;
    logoPng?: string | null;
  },
): Promise<void> {
  const { doc, w, margin } = ctx;
  const headerH = PDF_BRAND.headerH;

  doc.setFillColor(...PDF_BRAND.dark);
  doc.rect(0, 0, w, headerH, 'F');
  doc.setFillColor(...PDF_BRAND.gold);
  doc.rect(0, headerH, w, 1.2, 'F');

  const logoX = margin;
  const logoY = 9;
  if (opts.logoPng) {
    doc.addImage(opts.logoPng, 'PNG', logoX, logoY, 42, 6);
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    setPdfFont(doc, 'bold');
    doc.text('artGRANIT', logoX, logoY + 5);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  setPdfFont(doc, 'bold');
  doc.text(opts.title, margin, headerH - 11);
  doc.setFontSize(8);
  setPdfFont(doc, 'normal');
  doc.setTextColor(210, 210, 210);
  doc.text(opts.subtitle, margin, headerH - 6);

  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text(opts.department ?? 'Departament Ingineri', w - margin, headerH - 11, { align: 'right' });
  doc.text(formatPdfRoDate(new Date().toISOString()), w - margin, headerH - 6, { align: 'right' });

  ctx.y = headerH + 8;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...PDF_BRAND.slate200);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, ctx.y, ctx.contentW, 7, 1, 1, 'FD');
  doc.setFontSize(6.5);
  setPdfFont(doc, 'normal');
  doc.setTextColor(...PDF_BRAND.slate500);
  doc.text(`Referință document: ${opts.reportRef}`, margin + 3, ctx.y + 4.5);
  doc.text('Confidențial — uz intern', w - margin - 3, ctx.y + 4.5, { align: 'right' });
  ctx.y += 11;
}

export function drawSectionTitle(ctx: PdfLayoutContext, title: string, subtitle?: string) {
  ensurePdfSpace(ctx, subtitle ? 18 : 12);
  ctx.y += 5;
  const { doc, margin } = ctx;
  doc.setFontSize(11);
  setPdfFont(doc, 'bold');
  doc.setTextColor(...PDF_BRAND.slate800);
  doc.text(title, margin, ctx.y);
  ctx.y += 5;
  if (subtitle) {
    doc.setFontSize(7.5);
    setPdfFont(doc, 'normal');
    doc.setTextColor(...PDF_BRAND.slate500);
    doc.text(subtitle, margin, ctx.y);
    ctx.y += 5;
  }
  doc.setDrawColor(...PDF_BRAND.gold);
  doc.setLineWidth(0.6);
  doc.line(margin, ctx.y, margin + 32, ctx.y);
  ctx.y += 6;
}

export function drawExecutiveSummaryBox(ctx: PdfLayoutContext, title: string, body: string) {
  const { doc, margin, contentW } = ctx;
  const lines = doc.splitTextToSize(body, contentW - 12);
  const boxH = Math.max(20, lines.length * 4 + 12);
  ensurePdfSpace(ctx, boxH + 4);

  doc.setFillColor(250, 250, 249);
  doc.setDrawColor(...PDF_BRAND.gold);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, ctx.y, contentW, boxH, 2, 2, 'FD');

  doc.setFontSize(8);
  setPdfFont(doc, 'bold');
  doc.setTextColor(...PDF_BRAND.slate800);
  doc.text(title, margin + 5, ctx.y + 7);

  setPdfFont(doc, 'normal');
  doc.setTextColor(...PDF_BRAND.slate600);
  doc.text(lines, margin + 5, ctx.y + 13);
  ctx.y += boxH + 6;
}

export function drawHealthScoreCard(
  ctx: PdfLayoutContext,
  score: number,
  label: string,
  accent: PdfAccent,
) {
  const { doc, margin, contentW } = ctx;
  ensurePdfSpace(ctx, 24);
  const cardW = contentW;
  const cardH = 20;

  doc.setFillColor(...PDF_BRAND.paper);
  doc.setDrawColor(...PDF_BRAND.slate200);
  doc.roundedRect(margin, ctx.y, cardW, cardH, 2, 2, 'FD');

  doc.setFillColor(...accentColor(accent));
  doc.roundedRect(margin, ctx.y, 3, cardH, 1, 1, 'F');

  doc.setFontSize(7);
  setPdfFont(doc, 'normal');
  doc.setTextColor(...PDF_BRAND.slate500);
  doc.text('Indice sănătate organizațională', margin + 6, ctx.y + 7);

  doc.setFontSize(18);
  setPdfFont(doc, 'bold');
  doc.setTextColor(...PDF_BRAND.slate800);
  doc.text(`${score}`, margin + 6, ctx.y + 16);
  doc.setFontSize(10);
  doc.text('/100', margin + 18, ctx.y + 16);

  doc.setFontSize(8);
  setPdfFont(doc, 'normal');
  doc.setTextColor(...accentColor(accent));
  const labelLines = doc.splitTextToSize(label, contentW - 50);
  doc.text(labelLines, margin + 32, ctx.y + 14);

  const barX = margin + cardW * 0.45;
  const barW = cardW * 0.5;
  doc.setFillColor(...PDF_BRAND.slate200);
  doc.roundedRect(barX, ctx.y + 12, barW, 3, 1, 1, 'F');
  doc.setFillColor(...accentColor(accent));
  doc.roundedRect(barX, ctx.y + 12, barW * (score / 100), 3, 1, 1, 'F');

  ctx.y += cardH + 6;
}

export function drawKpiCard(
  ctx: PdfLayoutContext,
  x: number,
  cardY: number,
  cardW: number,
  cardH: number,
  label: string,
  value: string,
  sub?: string,
  accent?: PdfAccent,
) {
  const { doc } = ctx;
  doc.setFillColor(...PDF_BRAND.slate100);
  doc.setDrawColor(...PDF_BRAND.slate200);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, cardY, cardW, cardH, 2, 2, 'FD');

  if (accent && accent !== 'neutral') {
    doc.setFillColor(...accentColor(accent));
    doc.rect(x, cardY, 2.5, cardH, 'F');
  }

  doc.setFontSize(6.5);
  setPdfFont(doc, 'normal');
  doc.setTextColor(...PDF_BRAND.slate500);
  doc.text(doc.splitTextToSize(label, cardW - 6), x + 4, cardY + 6);

  doc.setFontSize(13);
  setPdfFont(doc, 'bold');
  doc.setTextColor(...PDF_BRAND.slate800);
  doc.text(value, x + 4, cardY + 14);

  if (sub) {
    doc.setFontSize(6.5);
    setPdfFont(doc, 'normal');
    doc.setTextColor(...PDF_BRAND.slate600);
    doc.text(sub, x + 4, cardY + cardH - 3.5);
  }
}

export function drawMetricRow(
  ctx: PdfLayoutContext,
  label: string,
  value: string,
  accent?: PdfAccent,
) {
  ensurePdfSpace(ctx, 7);
  const { doc, margin, contentW } = ctx;
  doc.setFontSize(8);
  setPdfFont(doc, 'normal');
  doc.setTextColor(...PDF_BRAND.slate600);
  doc.text(label, margin + 2, ctx.y);
  setPdfFont(doc, 'bold');
  if (accent && accent !== 'neutral') doc.setTextColor(...accentColor(accent));
  else doc.setTextColor(...PDF_BRAND.slate800);
  doc.text(value, margin + contentW - 2, ctx.y, { align: 'right' });
  ctx.y += 5.5;
  doc.setDrawColor(...PDF_BRAND.slate200);
  doc.setLineWidth(0.1);
  doc.line(margin, ctx.y - 1, margin + contentW, ctx.y - 1);
}

export function drawTwoColumnPanels(
  ctx: PdfLayoutContext,
  leftTitle: string,
  rightTitle: string,
  drawLeft: (inner: PdfLayoutContext) => void,
  drawRight: (inner: PdfLayoutContext) => void,
) {
  const { margin, contentW } = ctx;
  const colW = (contentW - 6) / 2;
  const startY = ctx.y;
  const leftCtx = { ...ctx, contentW: colW };
  const rightCtx = { ...ctx, margin: margin + colW + 6, contentW: colW };

  const { doc } = ctx;
  ensurePdfSpace(ctx, 50);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...PDF_BRAND.slate200);
  doc.roundedRect(margin, startY, colW, 44, 2, 2, 'S');
  doc.roundedRect(margin + colW + 6, startY, colW, 44, 2, 2, 'S');

  leftCtx.y = startY + 6;
  rightCtx.y = startY + 6;

  doc.setFontSize(8);
  setPdfFont(doc, 'bold');
  doc.setTextColor(...PDF_BRAND.slate800);
  doc.text(leftTitle, margin + 4, startY + 6);
  doc.text(rightTitle, margin + colW + 10, startY + 6);

  leftCtx.y = startY + 10;
  rightCtx.y = startY + 10;
  drawLeft(leftCtx);
  drawRight(rightCtx);

  ctx.y = startY + 48;
}

export function drawRecommendationsList(ctx: PdfLayoutContext, items: string[]) {
  const { doc } = ctx;
  drawSectionTitle(ctx, 'Recomandări prioritare', 'Acțiuni sugerate pe baza indicatorilor curenți');
  for (const item of items) {
    const lines = doc.splitTextToSize(item, ctx.contentW - 10);
    ensurePdfSpace(ctx, lines.length * 4.5 + 4);
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(ctx.margin, ctx.y, ctx.contentW, lines.length * 4 + 4, 1.5, 1.5, 'FD');
    doc.setFontSize(7.5);
    setPdfFont(doc, 'normal');
    doc.setTextColor(...PDF_BRAND.slate700);
    doc.text(lines, ctx.margin + 4, ctx.y + 5);
    ctx.y += lines.length * 4 + 6;
  }
}

export function drawSignatureBlock(ctx: PdfLayoutContext) {
  ensurePdfSpace(ctx, 28);
  ctx.y += 4;
  const { doc, margin, contentW, w } = ctx;
  const colW = contentW / 2 - 4;

  doc.setDrawColor(...PDF_BRAND.slate200);
  doc.line(margin, ctx.y + 14, margin + colW, ctx.y + 14);
  doc.line(w - margin - colW, ctx.y + 14, w - margin, ctx.y + 14);

  doc.setFontSize(7);
  setPdfFont(doc, 'normal');
  doc.setTextColor(...PDF_BRAND.slate500);
  doc.text('Responsabil HR / Instruire', margin, ctx.y + 18);
  doc.text('Management / Aprobare', w - margin - colW, ctx.y + 18);

  doc.setFontSize(6);
  doc.setTextColor(...PDF_BRAND.slate500);
  const notice = doc.splitTextToSize(
    'Document generat automat din platforma artGRANIT Instruire Ingineri. Datele reflectă starea la momentul generării. Distribuirea externă necesită acordul departamentului HR.',
    contentW,
  );
  doc.text(notice, margin, ctx.y + 24);
  ctx.y += 24 + notice.length * 3;
}

export function stampFootersOnAllPages(doc: jsPDF, reportTitle: string) {
  const total = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const margin = PDF_BRAND.margin;
  const generated = formatPdfRoDateTime(new Date().toISOString());

  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...PDF_BRAND.gold);
    doc.setLineWidth(0.3);
    doc.line(margin, h - 14, w - margin, h - 14);
    doc.setFontSize(6.5);
    setPdfFont(doc, 'normal');
    doc.setTextColor(...PDF_BRAND.slate500);
    doc.text(`artGRANIT · ${reportTitle} · ${generated}`, margin, h - 9);
    doc.text(`Pagina ${i} / ${total}`, w - margin, h - 9, { align: 'right' });
  }
}

export function drawDataTable(
  ctx: PdfLayoutContext,
  columns: Array<{ label: string; width: number; align?: 'left' | 'right' | 'center' }>,
  rows: string[][],
  emptyMessage: string,
): void {
  const { doc, margin, contentW } = ctx;
  const rowH = 8;
  const colOffsets: number[] = [];
  let x = 0;
  for (const col of columns) {
    colOffsets.push(x);
    x += col.width;
  }

  const drawHeader = () => {
    doc.setFillColor(...PDF_BRAND.slate800);
    doc.rect(margin, ctx.y, contentW, rowH, 'F');
    doc.setFontSize(7);
    setPdfFont(doc, 'bold');
    doc.setTextColor(255, 255, 255);
    for (let c = 0; c < columns.length; c++) {
      const col = columns[c];
      const tx = margin + colOffsets[c] + 3;
      doc.text(col.label, tx, ctx.y + 5.5);
    }
    ctx.y += rowH;
  };

  drawHeader();

  if (rows.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, ctx.y, contentW, rowH, 'F');
    doc.setFontSize(7.5);
    setPdfFont(doc, 'normal');
    doc.setTextColor(...PDF_BRAND.slate500);
    doc.text(emptyMessage, margin + 3, ctx.y + 5.5);
    ctx.y += rowH + 4;
    return;
  }

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    let maxLines = 1;
    const cellLines = row.map((cell, c) => {
      const lines = doc.splitTextToSize(cell, columns[c].width - 6);
      maxLines = Math.max(maxLines, lines.length);
      return lines;
    });
    const dynamicH = Math.max(rowH, maxLines * 4 + 4);

    if (ctx.y + dynamicH > ctx.h - 22) {
      doc.addPage();
      ctx.y = 22;
      drawHeader();
    }

    doc.setFillColor(r % 2 === 0 ? 255 : 248, r % 2 === 0 ? 255 : 250, r % 2 === 0 ? 255 : 252);
    doc.rect(margin, ctx.y, contentW, dynamicH, 'F');
    doc.setDrawColor(...PDF_BRAND.slate200);
    doc.line(margin, ctx.y + dynamicH, margin + contentW, ctx.y + dynamicH);

    doc.setFontSize(7.5);
    setPdfFont(doc, 'normal');
    doc.setTextColor(...PDF_BRAND.slate700);
    for (let c = 0; c < cellLines.length; c++) {
      doc.text(cellLines[c], margin + colOffsets[c] + 3, ctx.y + 5.5);
    }
    ctx.y += dynamicH;
  }
  ctx.y += 4;
}
