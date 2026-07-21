import {
  AlignmentType,
  Document,
  HeadingLevel,
  PageOrientation,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';

const STATUS_LABELS = {
  APPROVED: 'Đã duyệt',
  BORROWED: 'Đang mượn',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Hoàn thành',
  DAMAGED: 'Hư hỏng',
  LOST: 'Thất lạc',
  OVERDUE: 'Quá hạn',
  PENDING: 'Chờ duyệt',
  REJECTED: 'Từ chối',
  REQUESTED: 'Đã gửi yêu cầu',
  RETURNED: 'Đã trả',
};

function formatCellValue(value, key) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.join(' | ');
  if (typeof value === 'object') return JSON.stringify(value);
  if (/date|at$/i.test(key) && !Number.isNaN(new Date(value).getTime())) {
    return new Date(value).toLocaleDateString('vi-VN');
  }
  if (/status/i.test(key)) return STATUS_LABELS[String(value).toUpperCase()] || String(value);
  return String(value);
}

function getColumnWeight({ key, width }) {
  if (width) return width;
  if (/^(id|requestId|renewalCount|itemCount)$/i.test(key)) return 6;
  if (/date|at$/i.test(key)) return 11;
  if (/memberName|bookTitle|title|name/i.test(key)) return 15;
  if (/email|categories|publisher|author/i.test(key)) return 14;
  return 10;
}

export async function downloadDocx(filename, title, rows, columns) {
  const dataRows = Array.isArray(rows) ? rows : [];
  if (!dataRows.length || !columns?.length) return false;
  const weights = columns.map(getColumnWeight);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const columnWidths = weights.map((weight) => Math.floor((15000 * weight) / totalWeight));

  const header = new TableRow({
    tableHeader: true,
    children: columns.map(({ label }, index) => new TableCell({
      width: { size: columnWidths[index], type: WidthType.DXA },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 80, bottom: 80, left: 70, right: 70 },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: label, bold: true, size: 16 })],
      })],
    })),
  });
  const body = dataRows.map((row) => new TableRow({
    children: columns.map(({ key }, index) => new TableCell({
      width: { size: columnWidths[index], type: WidthType.DXA },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 65, bottom: 65, left: 70, right: 70 },
      children: [new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: formatCellValue(row[key], key), size: 16 })],
      })],
    })),
  }));
  const document = new Document({
    sections: [{
      properties: {
        page: {
          size: { orientation: PageOrientation.LANDSCAPE },
          margin: { top: 500, right: 500, bottom: 500, left: 500 },
        },
      },
      children: [
        new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
        new Paragraph({
          spacing: { after: 160 },
          children: [new TextRun({ text: `Thời gian xuất: ${new Date().toLocaleString('vi-VN')}`, size: 18 })],
        }),
        new Table({
          width: { size: 15000, type: WidthType.DXA },
          columnWidths,
          layout: TableLayoutType.FIXED,
          rows: [header, ...body],
        }),
      ],
    }],
  });
  const blob = await Packer.toBlob(document);
  const url = URL.createObjectURL(blob);
  const link = documentGlobal.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}

const documentGlobal = globalThis.document;
