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
import type { FinanceEntry } from '../services/financeService';
import { TRIPO_LOGO_BASE64 } from '../assets/tripoLogoBase64';
import { saveExportedFileToShared } from '../services/fileService';

export interface SummaryData {
  deepakTotal: number;
  elumugamTotal: number;
  overallTotal: number;
}

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

export const setPdfFooterText = (text: string): void => {
  try {
    localStorage.setItem('dm_pdf_footer_text', text.trim() || 'TripO Offical');
  } catch {}
};

/**
 * PDF EXPORT — Fix font encoding issue (remove unwanted '1' prefix before amounts)
 */
export const exportToPdf = async (entries: FinanceEntry[], summary: SummaryData) => {
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
  doc.text('— Finance Report', 58, 25);

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
  doc.text(formatCurrencyPdf(summary.overallTotal), 246, 29, { align: 'center' });

  // --- MIDDLE SECTION: EXPENSE SUMMARY CARDS ---
  const summaryY = 38;

  // Card 1: Deepak Amount
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(18, summaryY, 78, 17, 4, 4, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('DEEPAK AMOUNT', 24, summaryY + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrencyPdf(summary.deepakTotal), 24, summaryY + 13);

  // Card 2: Elumugam Amount
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(101, summaryY, 78, 17, 4, 4, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('ELUMUGAM AMOUNT', 107, summaryY + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrencyPdf(summary.elumugamTotal), 107, summaryY + 13);

  // Card 3: Total Amount
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(184, summaryY, 93, 17, 4, 4, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('TOTAL AMOUNT', 190, summaryY + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(formatCurrencyPdf(summary.overallTotal), 190, summaryY + 13);

  // --- BOTTOM SECTION: FINANCE TABLE ---
  const tableRows = entries.map((entry, index) => [
    index + 1,
    formatDate(entry.date),
    entry.item || '',
    entry.category || 'Software',
    entry.description || '--',
    entry.person || '',
    formatCurrencyPdf(Number(entry.amount) || 0),
  ]);

  // Total row at bottom
  tableRows.push([
    '',
    '',
    '',
    '',
    '',
    'TOTAL',
    formatCurrencyPdf(summary.overallTotal),
  ]);

  autoTable(doc, {
    startY: 60,
    head: [['S.NO', 'DATE', 'ITEM', 'CATEGORY', 'DESCRIPTION', 'PERSON', 'AMOUNT']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59], // dark navy slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' }, // S.No
      1: { cellWidth: 26, halign: 'center' }, // Date
      2: { cellWidth: 46, halign: 'left', fontStyle: 'bold' }, // Item
      3: { cellWidth: 32, halign: 'left' }, // Category
      4: { cellWidth: 80, halign: 'left' }, // Description (wide, wrapped)
      5: { cellWidth: 32, halign: 'left' }, // Person
      6: { cellWidth: 29, halign: 'right', fontStyle: 'bold' }, // Amount
    },
    didParseCell: (data) => {
      // Highlight Total Row
      if (data.row.index === tableRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249]; // slate-100
        if (data.column.index === 6) {
          data.cell.styles.textColor = [37, 99, 235]; // blue-600
        }
      }
    },
    didDrawPage: (data) => {
      // Minimal Footer
      const totalPages = (doc as any).internal.getNumberOfPages();
      const currentPage = data.pageNumber;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('Generated from DM Finance', 18, 194);
      doc.text(`Page ${currentPage} of ${totalPages}`, 277, 194, { align: 'right' });
    },
    margin: { left: 18, right: 18, bottom: 24 },
    pageBreak: 'auto',
  });

  // Render official footer watermark "TripO Offical" at bottom-right corner of all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  const pdfFooterText = getPdfFooterText();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(pdfFooterText, 277, 198, { align: 'right' });
  }

  const filename = `DM_Finance_${todayStr}.pdf`;
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
 * JPG EXPORT — Fixed blank image issue with DOM render delay & TripO logo
 */
export const exportToJpg = async (entries: FinanceEntry[], summary: SummaryData) => {
  const todayStr = getTodayFormatted();

  // Create temporary offscreen element rendered inside fixed viewport (z-index: -99999)
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

  const rowsHtml = entries
    .map(
      (entry, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
      <td style="padding: 12px 14px; text-align: center; font-weight: bold; color: #64748b;">${idx + 1}</td>
      <td style="padding: 12px 14px; text-align: center; font-weight: 600; color: #1e293b;">${formatDate(entry.date)}</td>
      <td style="padding: 12px 14px; font-weight: 800; color: #0f172a;">${entry.item}</td>
      <td style="padding: 12px 14px;"><span style="background-color: #eff6ff; color: #2563eb; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; display: inline-block;">${entry.category}</span></td>
      <td style="padding: 12px 14px; color: #475569; word-break: break-word;">${entry.description || '--'}</td>
      <td style="padding: 12px 14px; font-weight: 700; color: #1e293b;">${entry.person}</td>
      <td style="padding: 12px 14px; text-align: right; font-weight: 900; color: #2563eb; font-size: 14px;">${formatCurrency(Number(entry.amount) || 0)}</td>
    </tr>
  `
    )
    .join('');

  container.innerHTML = `
    <div style="background-color: #ffffff; border-radius: 24px; padding: 36px; box-shadow: 0 4px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
      <!-- Title Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 20px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <img src="${TRIPO_LOGO_BASE64}" style="height: 38px; width: auto; object-fit: contain;" alt="TripO Logo" />
          <div>
            <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -0.02em;">— Finance Report</h1>
            <p style="font-size: 12px; font-weight: 600; color: #64748b; margin: 4px 0 0 0;">Export Date: ${todayStr}</p>
          </div>
        </div>
        <div style="text-align: center; background-color: #eff6ff; padding: 10px 20px; border-radius: 16px; border: 1px solid #bfdbfe;">
          <span style="font-size: 11px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 0.05em;">Overall Total</span>
          <div style="font-size: 20px; font-weight: 900; color: #2563eb;">${formatCurrency(summary.overallTotal)}</div>
        </div>
      </div>

      <!-- Expense Summary Box -->
      <div style="display: flex; gap: 16px; margin-bottom: 28px;">
        <div style="flex: 1; background-color: #f1f5f9; padding: 16px; border-radius: 16px; border: 1px solid #e2e8f0;">
          <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Deepak Amount</div>
          <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 4px;">${formatCurrency(summary.deepakTotal)}</div>
        </div>
        <div style="flex: 1; background-color: #f1f5f9; padding: 16px; border-radius: 16px; border: 1px solid #e2e8f0;">
          <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Elumugam Amount</div>
          <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 4px;">${formatCurrency(summary.elumugamTotal)}</div>
        </div>
        <div style="flex: 1; background-color: #eff6ff; padding: 16px; border-radius: 16px; border: 1px solid #bfdbfe;">
          <div style="font-size: 11px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 0.05em;">Total Amount</div>
          <div style="font-size: 20px; font-weight: 900; color: #2563eb; margin-top: 4px;">${formatCurrency(summary.overallTotal)}</div>
        </div>
      </div>

      <!-- Table Container -->
      <div style="border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; background-color: #ffffff;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px;">
          <thead>
            <tr style="background-color: #1e293b; color: #ffffff; text-transform: uppercase; font-size: 11px; font-weight: 800;">
              <th style="padding: 14px 16px; text-align: center; width: 50px;">S.No</th>
              <th style="padding: 14px 16px; text-align: center; width: 100px;">Date</th>
              <th style="padding: 14px 16px; width: 180px;">Item</th>
              <th style="padding: 14px 16px; width: 120px;">Category</th>
              <th style="padding: 14px 16px;">Description</th>
              <th style="padding: 14px 16px; width: 130px;">Person</th>
              <th style="padding: 14px 16px; text-align: right; width: 130px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr style="background-color: #f1f5f9; border-top: 2px solid #cbd5e1;">
              <td colspan="5"></td>
              <td style="padding: 14px 16px; font-weight: 900; font-size: 13px; color: #0f172a; text-transform: uppercase;">Total</td>
              <td style="padding: 14px 16px; text-align: right; font-weight: 900; font-size: 16px; color: #2563eb;">${formatCurrency(summary.overallTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Wait for DOM layout & font rendering calculations
    if (document.fonts) {
      await document.fonts.ready;
    }
    await new Promise((res) => setTimeout(res, 200));

    const dataUrl = await toJpeg(container, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
    });

    const link = document.createElement('a');
    const filename = `DM_Finance_${todayStr}.jpg`;
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
 * DOCUMENT (DOCX) EXPORT
 */
export const exportToDocx = async (entries: FinanceEntry[], summary: SummaryData) => {
  const todayStr = getTodayFormatted();

  const borderSingle = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
  };

  // Construct Expense Summary Table
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
                  new TextRun({ text: 'Deepak Amount', bold: true, size: 18, color: '64748B' }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: formatCurrency(summary.deepakTotal), bold: true, size: 24, color: '0F172A' }),
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
                  new TextRun({ text: 'Elumugam Amount', bold: true, size: 18, color: '64748B' }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: formatCurrency(summary.elumugamTotal), bold: true, size: 24, color: '0F172A' }),
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
                  new TextRun({ text: 'Total Amount', bold: true, size: 18, color: '2563EB' }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: formatCurrency(summary.overallTotal), bold: true, size: 26, color: '2563EB' }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Table Header Row
  const tableHeaderRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({ shading: { fill: '1E293B' }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'S.No', bold: true, color: 'FFFFFF', size: 18 })] })] }),
      new TableCell({ shading: { fill: '1E293B' }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Date', bold: true, color: 'FFFFFF', size: 18 })] })] }),
      new TableCell({ shading: { fill: '1E293B' }, children: [new Paragraph({ children: [new TextRun({ text: 'Item', bold: true, color: 'FFFFFF', size: 18 })] })] }),
      new TableCell({ shading: { fill: '1E293B' }, children: [new Paragraph({ children: [new TextRun({ text: 'Category', bold: true, color: 'FFFFFF', size: 18 })] })] }),
      new TableCell({ shading: { fill: '1E293B' }, children: [new Paragraph({ children: [new TextRun({ text: 'Description', bold: true, color: 'FFFFFF', size: 18 })] })] }),
      new TableCell({ shading: { fill: '1E293B' }, children: [new Paragraph({ children: [new TextRun({ text: 'Person', bold: true, color: 'FFFFFF', size: 18 })] })] }),
      new TableCell({ shading: { fill: '1E293B' }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Amount', bold: true, color: 'FFFFFF', size: 18 })] })] }),
    ],
  });

  // Data Rows
  const dataRows = entries.map(
    (entry, idx) =>
      new TableRow({
        children: [
          new TableCell({ borders: borderSingle, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(idx + 1), size: 18, color: '64748B' })] })] }),
          new TableCell({ borders: borderSingle, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatDate(entry.date), size: 18 })] })] }),
          new TableCell({ borders: borderSingle, children: [new Paragraph({ children: [new TextRun({ text: entry.item, bold: true, size: 18 })] })] }),
          new TableCell({ borders: borderSingle, children: [new Paragraph({ children: [new TextRun({ text: entry.category, size: 18, color: '2563EB' })] })] }),
          new TableCell({ borders: borderSingle, children: [new Paragraph({ children: [new TextRun({ text: entry.description || '--', size: 18 })] })] }),
          new TableCell({ borders: borderSingle, children: [new Paragraph({ children: [new TextRun({ text: entry.person, size: 18 })] })] }),
          new TableCell({ borders: borderSingle, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(Number(entry.amount) || 0), bold: true, size: 18, color: '2563EB' })] })] }),
        ],
      })
  );

  // Total Summary Row
  const totalRow = new TableRow({
    children: [
      new TableCell({ borders: borderSingle, shading: { fill: 'F1F5F9' }, children: [new Paragraph({ text: '' })] }),
      new TableCell({ borders: borderSingle, shading: { fill: 'F1F5F9' }, children: [new Paragraph({ text: '' })] }),
      new TableCell({ borders: borderSingle, shading: { fill: 'F1F5F9' }, children: [new Paragraph({ text: '' })] }),
      new TableCell({ borders: borderSingle, shading: { fill: 'F1F5F9' }, children: [new Paragraph({ text: '' })] }),
      new TableCell({ borders: borderSingle, shading: { fill: 'F1F5F9' }, children: [new Paragraph({ text: '' })] }),
      new TableCell({ borders: borderSingle, shading: { fill: 'F1F5F9' }, children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL', bold: true, size: 20 })] })] }),
      new TableCell({ borders: borderSingle, shading: { fill: 'F1F5F9' }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(summary.overallTotal), bold: true, size: 20, color: '2563EB' })] })] }),
    ],
  });

  const mainTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [tableHeaderRow, ...dataRows, totalRow],
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Finance Report',
                bold: true,
                size: 32,
                color: '0F172A',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Export Date: ${todayStr}`,
                size: 20,
                color: '64748B',
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Expense Summary', bold: true, size: 24, color: '0F172A' }),
            ],
          }),
          new Paragraph({ text: '' }),
          summaryTable,
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Finance Entries', bold: true, size: 24, color: '0F172A' }),
            ],
          }),
          new Paragraph({ text: '' }),
          mainTable,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `DM_Finance_${todayStr}.docx`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);

  // Auto-save to Shared / Files / Recent
  try {
    await saveExportedFileToShared(filename, blob, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  } catch (err) {
    console.warn('Auto-save DOCX notice:', err);
  }
};
