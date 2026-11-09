/**
 * 阶段6-数据校验规则 用户说明版 → Word (.docx) 转换脚本
 *
 * 基于 gen-docx-v2.1.js 适配简化版用户文档
 * 使用 docx-js (npm install docx) 将 Markdown 文件转为专业排版的 Word 文档
 */

const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat, VerticalAlign
} = require('docx');

// ── 配色与尺寸 ──
const PAGE_WIDTH_DXA  = 11906;  // A4 宽度
const PAGE_HEIGHT_DXA = 16838;  // A4 高度
const MARGIN_DXA      = 1440;   // 1 inch margins
const CONTENT_WIDTH   = PAGE_WIDTH_DXA - MARGIN_DXA * 2; // 9026

const FONT_CN    = 'Microsoft YaHei';
const FONT_EN    = 'Arial';
const FONT_MONO  = 'Consolas';
const FONT_SIZE  = 21;  // 10.5pt (中文五号)
const FONT_TITLE = 36;  // 18pt
const FONT_H1    = 32;  // 16pt
const FONT_H2    = 28;  // 14pt
const FONT_H3    = 24;  // 12pt
const FONT_H4    = 22;  // 11pt
const FONT_CODE  = 18;  // 9pt

const COLOR_H1   = '1F4E79';
const COLOR_H2   = '2E75B6';
const COLOR_H3   = '404040';
const COLOR_H4   = '595959';
const COLOR_CODE_BG = 'F2F2F2';
const COLOR_TABLE_HEADER = 'D6E4F0';
const COLOR_BLOCKQUOTE_BAR = '2E75B6';

// 严重程度颜色
const SEVERITY_COLORS = {
  '🔴': 'CC0000',  // 阻断-红
  '🟠': 'E67E22',  // 确认-橙
  '🟡': 'F1C40F',  // 提示-黄（深黄以保证可读性）
  '✅': '27AE60',  // 通过-绿
  '⚠️': 'E67E22',  // 警告-橙
  '⭐': 'F39C12',  // 星级-金
};

// ── 读取 Markdown ──
const mdPath = 'e:/AI/碳亦管碳足迹智能体/CFP/docs/阶段6-数据校验规则-用户说明.md';
const mdText = fs.readFileSync(mdPath, 'utf-8');

// ── Markdown 解析器 ──

function parseMarkdown(text) {
  const lines = text.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 空行
    if (line.trim() === '') {
      i++;
      continue;
    }

    // 水平线 ---
    if (line.trim() === '---') {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // 代码块 ```
    if (line.trim().startsWith('```')) {
      const lang = line.trim().replace('```', '').trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // 跳过结尾的 ```
      blocks.push({ type: 'code', lang, content: codeLines.join('\n') });
      continue;
    }

    // 引用块 >
    if (line.startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'blockquote', content: quoteLines.join('\n') });
      continue;
    }

    // 表格
    if (line.trim().startsWith('|') && i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push(parseTable(tableLines));
      continue;
    }

    // 标题
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      blocks.push({ type: 'heading', level, text });
      i++;
      continue;
    }

    // 列表项 (- 开头)
    if (line.match(/^-\s+/)) {
      const listItems = [];
      while (i < lines.length && lines[i].match(/^-\s+/)) {
        listItems.push(lines[i].replace(/^-\s+/, ''));
        i++;
      }
      blocks.push({ type: 'list', items: listItems });
      continue;
    }

    // 普通段落
    blocks.push({ type: 'paragraph', text: line });
    i++;
  }

  return blocks;
}

function parseTable(tableLines) {
  if (tableLines.length < 2) return { type: 'paragraph', text: tableLines[0] };

  const parseRow = (line) => {
    const cells = line.split('|').slice(1, -1);
    return cells.map(c => c.trim());
  };

  // 检查第二行是否为分隔线 |---|---|
  const isSepLine = (line) => line.replace(/[|\s]/g, '').match(/^-+$/);

  let headers;
  let startIdx;

  if (isSepLine(tableLines[1])) {
    headers = parseRow(tableLines[0]);
    startIdx = 2;
  } else {
    // 没有分隔线，第一行就是数据
    headers = parseRow(tableLines[0]);
    startIdx = 1;
  }

  const rows = [];
  for (let j = startIdx; j < tableLines.length; j++) {
    // 跳过后续的分隔线行
    if (isSepLine(tableLines[j])) continue;
    const rowCells = parseRow(tableLines[j]);
    while (rowCells.length < headers.length) rowCells.push('');
    if (rowCells.length > headers.length) rowCells.splice(headers.length);
    rows.push(rowCells);
  }

  const colCount = headers.length;

  return { type: 'table', headers, rows, colCount };
}

// ── 内联文本解析（bold/italic/code/emoji） ──

function parseInline(text, baseSize) {
  const sz = baseSize || FONT_SIZE;
  const runs = [];
  // 匹配 **bold** 和 `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, font: FONT_CN, size: sz }));
    } else if (part.startsWith('`') && part.endsWith('`')) {
      runs.push(new TextRun({ text: part.slice(1, -1), font: FONT_MONO, size: sz - 2 }));
    } else if (part) {
      runs.push(new TextRun({ text: part, font: FONT_CN, size: sz }));
    }
  }

  return runs;
}

// ── 文档元素生成 ──

function makeHeading(block) {
  const levelMap = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
  };
  const colorMap = { 1: COLOR_H1, 2: COLOR_H2, 3: COLOR_H3, 4: COLOR_H4 };
  const sizeMap  = { 1: FONT_H1, 2: FONT_H2, 3: FONT_H3, 4: FONT_H4 };

  return new Paragraph({
    heading: levelMap[block.level],
    spacing: { before: 300, after: 200 },
    children: [
      new TextRun({
        text: block.text,
        bold: true,
        font: FONT_CN,
        size: sizeMap[block.level],
        color: colorMap[block.level],
      }),
    ],
  });
}

function makeParagraph(block) {
  return new Paragraph({
    spacing: { before: 60, after: 60, line: 360 },
    children: parseInline(block.text),
  });
}

function makeList(block) {
  const paragraphs = [];
  for (const item of block.items) {
    paragraphs.push(new Paragraph({
      spacing: { before: 40, after: 40, line: 320 },
      indent: { left: 360 },
      children: parseInline(item),
    }));
  }
  return paragraphs;
}

function makeCodeBlock(block) {
  const lines = block.content.split('\n');
  const paragraphs = [];

  for (const line of lines) {
    paragraphs.push(new Paragraph({
      spacing: { before: 0, after: 0, line: 240 },
      shading: { fill: COLOR_CODE_BG, type: ShadingType.CLEAR },
      children: [
        new TextRun({
          text: line || ' ',
          font: FONT_MONO,
          size: FONT_CODE,
        }),
      ],
    }));
  }

  return paragraphs;
}

function makeBlockquote(block) {
  // 引用块内容递归解析
  const innerBlocks = parseMarkdown(block.content);
  const paragraphs = [];

  for (const inner of innerBlocks) {
    switch (inner.type) {
      case 'table':
        const tableElements = makeTable(inner);
        for (const elem of tableElements) {
          if (elem instanceof Table) {
            paragraphs.push(elem);
          }
        }
        break;

      case 'heading':
        paragraphs.push(new Paragraph({
          spacing: { before: 160, after: 80, line: 320 },
          indent: { left: 480 },
          border: { left: { style: BorderStyle.SINGLE, size: 12, color: COLOR_BLOCKQUOTE_BAR, space: 8 } },
          children: [new TextRun({ text: inner.text, bold: true, font: FONT_CN, size: FONT_SIZE })],
        }));
        break;

      case 'paragraph':
        paragraphs.push(new Paragraph({
          spacing: { before: 40, after: 40, line: 320 },
          indent: { left: 480 },
          border: { left: { style: BorderStyle.SINGLE, size: 12, color: COLOR_BLOCKQUOTE_BAR, space: 8 } },
          children: parseInline(inner.text),
        }));
        break;

      case 'list':
        for (const item of inner.items) {
          paragraphs.push(new Paragraph({
            spacing: { before: 40, after: 40, line: 320 },
            indent: { left: 480 },
            border: { left: { style: BorderStyle.SINGLE, size: 12, color: COLOR_BLOCKQUOTE_BAR, space: 8 } },
            children: parseInline(item),
          }));
        }
        break;

      case 'code':
        const codeLines = inner.content.split('\n');
        for (const cl of codeLines) {
          paragraphs.push(new Paragraph({
            spacing: { before: 0, after: 0, line: 240 },
            indent: { left: 480 },
            border: { left: { style: BorderStyle.SINGLE, size: 12, color: COLOR_BLOCKQUOTE_BAR, space: 8 } },
            shading: { fill: COLOR_CODE_BG, type: ShadingType.CLEAR },
            children: [new TextRun({ text: cl || ' ', font: FONT_MONO, size: FONT_CODE })],
          }));
        }
        break;

      case 'hr':
        paragraphs.push(new Paragraph({
          indent: { left: 480 },
          border: { left: { style: BorderStyle.SINGLE, size: 12, color: COLOR_BLOCKQUOTE_BAR, space: 8 }, bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 1 } },
          children: [],
        }));
        break;

      case 'blockquote':
        const nested = makeBlockquote(inner);
        for (const np of nested) {
          if (np instanceof Paragraph) {
            const origIndent = np.indent?.left || 480;
            paragraphs.push(new Paragraph({
              ...np,
              indent: { left: origIndent + 480 },
            }));
          } else {
            paragraphs.push(np);
          }
        }
        break;

      default:
        if (inner.text) {
          paragraphs.push(new Paragraph({
            spacing: { before: 40, after: 40, line: 320 },
            indent: { left: 480 },
            border: { left: { style: BorderStyle.SINGLE, size: 12, color: COLOR_BLOCKQUOTE_BAR, space: 8 } },
            children: parseInline(inner.text),
          }));
        }
    }
  }

  return paragraphs;
}

function makeHR() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC', space: 1 } },
    children: [],
  });
}

function makeTable(block) {
  const { headers, rows, colCount } = block;
  const numCols = colCount || headers.length;

  const colWidths = calculateColWidths(headers, rows, numCols);
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);

  const border = { style: BorderStyle.SINGLE, size: 1, color: 'BBBBBB' };
  const borders = { top: border, bottom: border, left: border, right: border };
  const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

  // 表头行
  const headerRow = new TableRow({
    children: headers.map((h, idx) => new TableCell({
      borders,
      width: { size: colWidths[idx], type: WidthType.DXA },
      shading: { fill: COLOR_TABLE_HEADER, type: ShadingType.CLEAR },
      margins: cellMargins,
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text: h, bold: true, font: FONT_CN, size: FONT_SIZE - 1 })],
      })],
    })),
  });

  // 数据行
  const dataRows = rows.map(row => {
    const safeRow = row.slice(0, numCols);
    while (safeRow.length < numCols) safeRow.push('');
    return new TableRow({
      children: safeRow.map((cell, idx) => new TableCell({
        borders,
        width: { size: colWidths[idx], type: WidthType.DXA },
        margins: cellMargins,
        verticalAlign: VerticalAlign.CENTER,
        children: [makeCellParagraph(cell)],
      })),
    });
  });

  return [new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  })];
}

function makeCellParagraph(cellText) {
  // 处理单元格内的 bold 标记和换行
  const parts = cellText.split(/(\*\*[^*]+\*\*)/g);
  const children = [];

  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      children.push(new TextRun({ text: part.slice(2, -2), bold: true, font: FONT_CN, size: FONT_SIZE - 2 }));
    } else if (part) {
      // 处理 <br> 换行
      const subParts = part.split('<br>');
      for (let k = 0; k < subParts.length; k++) {
        children.push(new TextRun({ text: subParts[k], font: FONT_CN, size: FONT_SIZE - 2 }));
        if (k < subParts.length - 1) {
          children.push(new TextRun({ break: 1 }));
        }
      }
    }
  }

  return new Paragraph({ spacing: { before: 20, after: 20 }, children });
}

function calculateColWidths(headers, rows, colCount) {
  const baseWidth = Math.floor(CONTENT_WIDTH / colCount);

  const maxLens = headers.map((h, idx) => {
    let maxLen = h.length;
    for (const row of rows) {
      if (row[idx]) maxLen = Math.max(maxLen, row[idx].length);
    }
    return maxLen;
  });

  const logLens = maxLens.map(len => Math.log(Math.max(len, 5)));
  const totalLog = logLens.reduce((a, b) => a + b, 0);

  const minWidth = 600;
  const widths = logLens.map(logLen => {
    const w = Math.round(CONTENT_WIDTH * (logLen / totalLog));
    return Math.max(w, minWidth);
  });

  let totalW = widths.reduce((a, b) => a + b, 0);
  let diff = CONTENT_WIDTH - totalW;
  const perCol = Math.floor(diff / colCount);
  const remainder = diff - perCol * colCount;
  for (let k = 0; k < colCount; k++) {
    widths[k] += perCol;
  }
  widths[0] += remainder;

  return widths;
}

// ── 主转换流程 ──

function buildDocument(blocks) {
  const children = [];

  // 文档封面区
  children.push(new Paragraph({
    spacing: { before: 800, after: 200 },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: '数据校验规则说明',
        bold: true,
        font: FONT_CN,
        size: FONT_TITLE,
        color: COLOR_H1,
      }),
    ],
  }));

  children.push(new Paragraph({
    spacing: { before: 100, after: 100 },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: '产品碳足迹核算智能体 — 面向填报用户的数据校验指引',
        font: FONT_CN,
        size: FONT_H3,
        color: COLOR_H2,
      }),
    ],
  }));

  children.push(new Paragraph({
    spacing: { before: 60, after: 400 },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: '本文档说明系统在数据校验阶段会检查哪些问题、如何判定严重程度、以及您需要做什么才能通过校验。',
        font: FONT_CN,
        size: FONT_SIZE,
        italics: true,
        color: '666666',
      }),
    ],
  }));

  children.push(makeHR());

  // 处理所有解析出的块
  for (const block of blocks) {
    switch (block.type) {
      case 'heading':
        // 跳过第一行 # 标题（已由封面区覆盖）
        if (block.level === 1 && block.text.includes('数据校验规则')) continue;
        children.push(makeHeading(block));
        break;

      case 'paragraph':
        children.push(makeParagraph(block));
        break;

      case 'list':
        children.push(...makeList(block));
        break;

      case 'code':
        children.push(...makeCodeBlock(block));
        break;

      case 'blockquote':
        children.push(...makeBlockquote(block));
        break;

      case 'table':
        children.push(...makeTable(block));
        break;

      case 'hr':
        children.push(makeHR());
        break;
    }
  }

  return children;
}

// ── 组装 Document ──

const blocks = parseMarkdown(mdText);
const docChildren = buildDocument(blocks);

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT_CN, size: FONT_SIZE },
      },
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: FONT_H1, bold: true, font: FONT_CN, color: COLOR_H1 },
        paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: FONT_H2, bold: true, font: FONT_CN, color: COLOR_H2 },
        paragraph: { spacing: { before: 280, after: 200 }, outlineLevel: 1 },
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: FONT_H3, bold: true, font: FONT_CN, color: COLOR_H3 },
        paragraph: { spacing: { before: 200, after: 160 }, outlineLevel: 2 },
      },
      {
        id: 'Heading4', name: 'Heading 4', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: FONT_H4, bold: true, font: FONT_CN, color: COLOR_H4 },
        paragraph: { spacing: { before: 160, after: 120 }, outlineLevel: 3 },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_WIDTH_DXA, height: PAGE_HEIGHT_DXA },
        margin: { top: MARGIN_DXA, right: MARGIN_DXA, bottom: MARGIN_DXA, left: MARGIN_DXA },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: '产品碳足迹核算智能体 · 数据校验规则说明（用户版）', font: FONT_CN, size: 16, color: '999999' }),
          ],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: '— ', font: FONT_EN, size: 16, color: '999999' }),
            new TextRun({ children: [PageNumber.CURRENT], font: FONT_EN, size: 16, color: '999999' }),
            new TextRun({ text: ' —', font: FONT_EN, size: 16, color: '999999' }),
          ],
        })],
      }),
    },
    children: docChildren,
  }],
});

// ── 输出文件 ──

const outputPath = 'e:/AI/碳亦管碳足迹智能体/CFP/docs/阶段6-数据校验规则-用户说明.docx';

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Word 文档已生成: ${outputPath}`);
  console.log(`   文件大小: ${(buffer.length / 1024).toFixed(1)} KB`);
}).catch(err => {
  console.error('❌ 生成失败:', err);
});
