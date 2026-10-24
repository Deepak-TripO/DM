import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toJpeg } from 'html-to-image';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
} from 'docx';
import type { MidFinanceEntry } from '../services/midFinanceService';
import { TRIPO_LOGO_BASE64 } from '../assets/tripoLogoBase64';
import { saveExportedFileToShared } from '../services/fileService';

export interface SummaryData {
  deepakTotal?: number;
  elumugamTotal?: number;
  incomingTotal?: number;
  outgoingTotal?: number;
  overallTotal: number;
}

const mapExportPerson = (entry: MidFinanceEntry): string => {
  const p = entry.person === 'Deepak' ? 'Incoming' : entry.person === 'Elumugam' ? 'Outgoing' : entry.person;
  if (
    (p === 'Incoming + Outgoing' || p === 'Incoming+Outgoing' || p === 'Elumugam+Deepak' || p === 'Elumugam + Deepak') &&
    (entry.incoming_amount != null || entry.deepak_amount != null) &&
    (entry.outgoing_amount != null || entry.elumugam_amount != null)
  ) {
    const inAmt = entry.incoming_amount ?? entry.deepak_amount ?? 0;
    const outAmt = entry.outgoing_amount ?? entry.elumugam_amount ?? 0;
    return `Incoming + Outgoing (In: ${formatCurrencyPdf(inAmt)} | Out: ${formatCurrencyPdf(outAmt)})`;
  }
  return p;
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val);
};

const formatCurrencyPdf = (val: number) => {
  const numStr = (Number(val) || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  return `Rs. ${numStr}`;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-');
    if (y && m && d) {
      const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
};

const getTodayFormatted = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getPdfFooterText = (): string => {
  try {
    const saved = localStorage.getItem('dm_pdf_footer_text');
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return 'TripO Offical';
};

/**
 * PDF EXPORT — MID Finance Report
 */
export const exportToPdf = async (entries: MidFinanceEntry[], summary: SummaryData) => {
  // A4 Landscape mode: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const todayStr = getTodayFormatted();

  // Draw Card Container Frame (subtle border and clean background)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(10, 10, 277, 190, 6, 6, 'FD');

  // --- HEADER SECTION ---
  // Top Left: TripO Logo Image
  try {
    doc.addImage(TRIPO_LOGO_BASE64, 'JPEG', 18, 16, 36, 14);
  } catch {
    // Fallback if image fails to decode
  }

  // Header Title next to logo
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('— MID Finance Report', 58, 25);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Export Date: ${todayStr}`, 58, 30);

  // Top Right: OVERALL TOTAL Card (Badge)
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(191, 219, 254); // blue-200
  doc.roundedRect(215, 15, 62, 19, 4, 4, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text('OVERALL TOTAL', 246, 21, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text(formatCurrencyPdf(summary.overallTotal), 246, 29, { align: 'center' });

  // --- MIDDLE SECTION: EXPENSE SUMMARY CARDS ---
  const startX = 18;
  const cardY = 38;
  const cardWidth = 83;
  const cardHeight = 22;
  const cardGap = 8;

  // 1. Incoming Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(startX, cardY, cardWidth, cardHeight, 3, 3, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('INCOMING AMOUNT', startX + 6, cardY + 8);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const incTotal = summary.incomingTotal ?? summary.deepakTotal ?? 0;
  doc.text(formatCurrencyPdf(incTotal), startX + 6, cardY + 16);

  // 2. Outgoing Card
  const elumugamX = startX + cardWidth + cardGap;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(elumugamX, cardY, cardWidth, cardHeight, 3, 3, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('OUTGOING AMOUNT', elumugamX + 6, cardY + 8);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const outTotal = summary.outgoingTotal ?? summary.elumugamTotal ?? 0;
  doc.text(formatCurrencyPdf(outTotal), elumugamX + 6, cardY + 16);

  // 3. Combined / Share Summary Card
  const totalX = elumugamX + cardWidth + cardGap;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(totalX, cardY, cardWidth, cardHeight, 3, 3, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('EXPENSE SUMMARY', totalX + 6, cardY + 8);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrencyPdf(summary.overallTotal), totalX + 6, cardY + 16);

  // --- BOTTOM SECTION: FINANCE TABLE ---
  const tableData = entries.map((entry, index) => {
    const company = entry.company_name || entry.item || '—';
    const personText = mapExportPerson(entry);

    return [
      (index + 1).toString(),
      formatDate(entry.date),
      company,
      entry.description || '—',
      personText,
      formatCurrencyPdf(entry.amount),
    ];
  });

  autoTable(doc, {
    startY: 65,
    head: [['S.NO', 'DATE', 'COMPANY NAME', 'DESCRIPTION', 'TYPE', 'AMOUNT']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249], // slate-100
      textColor: [51, 65, 85], // slate-700
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      cellPadding: 3,
    },
    bodyStyles: {
      textColor: [51, 65, 85],
      fontSize: 7.5,
      cellPadding: 2.5,
      lineColor: [241, 245, 249],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' }, // S.No
      1: { cellWidth: 26 }, // Date
      2: { cellWidth: 55, fontStyle: 'bold' }, // Company Name
      3: { cellWidth: 75 }, // Description
      4: { cellWidth: 50 }, // Type
      5: { cellWidth: 32, halign: 'right', fontStyle: 'bold' }, // Amount
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    didDrawPage: (data) => {
      // Draw Page Border Frame on extra pages
      if (data.pageNumber > 1) {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(10, 10, 277, 190, 6, 6, 'FD');
      }

      // Footer
      const totalPages = (doc as any).getNumberOfPages();
      const currentPage = data.pageNumber;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('Generated from DM MID Finance', 18, 194);
      doc.text(`Page ${currentPage} of ${totalPages}`, 277, 194, { align: 'right' });
    },
    margin: { left: 18, right: 18, bottom: 35 },
    pageBreak: 'auto',
  });

  // Render watermark/footer text
  const totalPages = (doc as any).getNumberOfPages();
  doc.setPage(totalPages);
  const pdfFooterText = getPdfFooterText();
  const lastY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 140;
  
  let sealY = lastY + 22;
  if (sealY > 182) {
    doc.addPage();
    doc.setPage((doc as any).getNumberOfPages());
    sealY = 35;
  }

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text(pdfFooterText, 277, sealY, { align: 'right' });

  const filename = `DM_MID_Finance_${todayStr}.pdf`;
  doc.save(filename);

  // Auto-save to Shared / Files / Recent
  try {
    const pdfBlob = doc.output('blob');
    await saveExportedFileToShared(filename, pdfBlob, 'application/pdf');
  } catch (err) {
    console.warn('Auto-save PDF notice:', err);
  }
};

/**
 * JPG EXPORT — MID Finance Report
 */
export const exportToJpg = async (entries: MidFinanceEntry[], summary: SummaryData) => {
  const todayStr = getTodayFormatted();

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '1050px';
  container.style.zIndex = '-99999';
  container.style.opacity = '1';
  container.style.visibility = 'visible';
  container.style.pointerEvents = 'none';
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '40px';
  container.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  const incTotal = summary.incomingTotal ?? summary.deepakTotal ?? 0;
  const outTotal = summary.outgoingTotal ?? summary.elumugamTotal ?? 0;

  const rowsHtml = entries
    .map((entry, index) => {
      const company = entry.company_name || entry.item || '—';
      const p = entry.person === 'Deepak' ? 'Incoming' : entry.person === 'Elumugam' ? 'Outgoing' : entry.person;
      let personHtml = p;
      if (
        (p === 'Incoming + Outgoing' || p === 'Incoming+Outgoing' || p === 'Elumugam+Deepak' || p === 'Elumugam + Deepak') &&
        (entry.incoming_amount != null || entry.deepak_amount != null) &&
        (entry.outgoing_amount != null || entry.elumugam_amount != null)
      ) {
        const inAmt = entry.incoming_amount ?? entry.deepak_amount ?? 0;
        const outAmt = entry.outgoing_amount ?? entry.elumugam_amount ?? 0;
        personHtml = `<div>Incoming + Outgoing</div><div style="font-size: 10px; color: #64748b; font-weight: 600; margin-top: 2px;">In: ${formatCurrency(inAmt)} | Out: ${formatCurrency(outAmt)}</div>`;
      }

      return `
      <tr style="border-bottom: 1px solid #f1f5f9; ${index % 2 === 1 ? 'background-color: #fafbfc;' : ''}">
        <td style="padding: 10px 14px; font-size: 12px; color: #64748b; text-align: center;">${index + 1}</td>
        <td style="padding: 10px 14px; font-size: 12px; color: #334155; white-space: nowrap;">${formatDate(entry.date)}</td>
        <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #0f172a;">${company}</td>
        <td style="padding: 10px 14px; font-size: 12px; color: #475569;">${entry.description || '—'}</td>
        <td style="padding: 10px 14px; font-size: 12px; font-weight: 600; color: #334155;">${personHtml}</td>
        <td style="padding: 10px 14px; font-size: 13px; font-weight: 800; color: #0f172a; text-align: right;">${formatCurrency(entry.amount)}</td>
      </tr>
    `;
    })
    .join('');

  container.innerHTML = `
    <div style="border: 1px solid #e2e8f0; border-radius: 20px; padding: 32px; background: #ffffff; box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <img src="${TRIPO_LOGO_BASE64}" alt="TripO Logo" style="height: 50px; width: auto; object-fit: contain;" />
          <div>
            <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -0.02em;">— MID Finance Report</h1>
            <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0; font-weight: 600;">Export Date: ${todayStr}</p>
          </div>
        </div>
        <div style="background-color: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 14px; padding: 12px 24px; text-align: right;">
          <p style="font-size: 10px; font-weight: 800; color: #2563eb; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">Overall Total</p>
          <p style="font-size: 20px; font-weight: 900; color: #1e3a8a; margin: 2px 0 0 0;">${formatCurrency(summary.overallTotal)}</p>
        </div>
      </div>

      <!-- Expense Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px;">
          <p style="font-size: 11px; font-weight: 700; color: #64748b; margin: 0; text-transform: uppercase;">Incoming Amount</p>
          <p style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 6px 0 0 0;">${formatCurrency(incTotal)}</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px;">
          <p style="font-size: 11px; font-weight: 700; color: #64748b; margin: 0; text-transform: uppercase;">Outgoing Amount</p>
          <p style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 6px 0 0 0;">${formatCurrency(outTotal)}</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px;">
          <p style="font-size: 11px; font-weight: 700; color: #64748b; margin: 0; text-transform: uppercase;">Expense Summary</p>
          <p style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 6px 0 0 0;">${formatCurrency(summary.overallTotal)}</p>
        </div>
      </div>

      <!-- Table -->
      <table style="width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 24px;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; color: #334155; text-align: center;">S.NO</th>
            <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; color: #334155;">DATE</th>
            <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; color: #334155;">COMPANY NAME</th>
            <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; color: #334155;">DESCRIPTION</th>
            <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; color: #334155;">TYPE</th>
            <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; color: #334155; text-align: right;">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <!-- Footer -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">Generated from DM MID Finance</span>
        <span style="font-size: 12px; color: #334155; font-weight: 800;">${getPdfFooterText()}</span>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Wait briefly for fonts and logo to settle in layout
    await new Promise((resolve) => setTimeout(resolve, 300));

    const dataUrl = await toJpeg(container, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });

    const link = document.createElement('a');
    const filename = `DM_MID_Finance_${todayStr}.jpg`;
    link.download = filename;
    link.href = dataUrl;
    link.click();

    // Auto-save to Shared / Files / Recent
    try {
      const res = await fetch(dataUrl);
      const jpgBlob = await res.blob();
      await saveExportedFileToShared(filename, jpgBlob, 'image/jpeg', dataUrl);
    } catch (err) {
      console.warn('Auto-save JPG notice:', err);
    }
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};

/**
 * DOCUMENT (DOCX) EXPORT — MID Finance Report
 */
export const exportToDocx = async (entries: MidFinanceEntry[], summary: SummaryData) => {
  const todayStr = getTodayFormatted();

  const borderSingle = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
  };

  const incTotal = summary.incomingTotal ?? summary.deepakTotal ?? 0;
  const outTotal = summary.outgoingTotal ?? summary.elumugamTotal ?? 0;

  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: borderSingle,
            shading: { fill: 'F1F5F9' },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Incoming Amount', bold: true, size: 18, color: '64748B' }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: formatCurrency(incTotal), bold: true, size: 24, color: '0F172A' }),
                ],
              }),
            ],
          }),
          new TableCell({
            borders: borderSingle,
            shading: { fill: 'F1F5F9' },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Outgoing Amount', bold: true, size: 18, color: '64748B' }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: formatCurrency(outTotal), bold: true, size: 24, color: '0F172A' }),
                ],
              }),
            ],
          }),
          new TableCell({
            borders: borderSingle,
            shading: { fill: 'EFF6FF' },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Overall Total', bold: true, size: 18, color: '2563EB' }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: formatCurrency(summary.overallTotal), bold: true, size: 24, color: '1E3A8A' }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const tableHeaderRow = new TableRow({
    children: ['S.NO', 'DATE', 'COMPANY NAME', 'DESCRIPTION', 'TYPE', 'AMOUNT'].map(
      (headerText) =>
        new TableCell({
          borders: borderSingle,
          shading: { fill: 'F1F5F9' },
          children: [
            new Paragraph({
              alignment: headerText === 'AMOUNT' ? AlignmentType.RIGHT : AlignmentType.LEFT,
              children: [
                new TextRun({ text: headerText, bold: true, size: 18, color: '334155' }),
              ],
            }),
          ],
        })
    ),
  });

  const tableDataRows = entries.map((entry, index) => {
    const company = entry.company_name || entry.item || '—';
    const personDesc = mapExportPerson(entry);

    return new TableRow({
      children: [
        (index + 1).toString(),
        formatDate(entry.date),
        company,
        entry.description || '—',
        personDesc,
        formatCurrency(entry.amount),
      ].map(
        (cellText, cellIndex) =>
          new TableCell({
            borders: borderSingle,
            children: [
              new Paragraph({
                alignment: cellIndex === 5 ? AlignmentType.RIGHT : AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: cellText,
                    bold: cellIndex === 2 || cellIndex === 5,
                    size: 18,
                    color: '334155',
                  }),
                ],
              }),
            ],
          })
      ),
    });
  });

  const entriesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [tableHeaderRow, ...tableDataRows],
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'TripO — MID Finance Report', bold: true, size: 32, color: '0F172A' }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Export Date: ${todayStr}`, size: 18, color: '64748B' }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Expense Summary', bold: true, size: 24, color: '0F172A' }),
            ],
          }),
          summaryTable,
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'MID Finance Entries', bold: true, size: 24, color: '0F172A' }),
            ],
          }),
          entriesTable,
          new Paragraph({ text: '' }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: getPdfFooterText(), bold: true, size: 20, color: '334155' }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `DM_MID_Finance_${todayStr}.docx`;
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);

  // Auto-save to Shared / Files / Recent
  try {
    await saveExportedFileToShared(
      filename,
      blob,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
  } catch (err) {
    console.warn('Auto-save DOCX notice:', err);
  }
};
