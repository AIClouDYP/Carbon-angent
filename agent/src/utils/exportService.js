/**
 * 导出服务（清单 #7「报表导出与归档」）
 * 行值解析依赖 utils/sectionRows（兼容数组行 / 行名字符串 / 模板预置对象行三种形态）。
 *
 * 5 种导出格式共享同一套框架与元信息水印：
 *  - Word  .docx —— 复用已装依赖 docx@9.7.1（动态 import，避免主包体积膨胀）
 *  - Excel .csv  —— 零新增依赖（UTF-8 BOM，Excel 打开中文不乱码；政府在线填报系统通用）
 *  - PDF   .pdf  —— 零新增依赖（生成打印视图 + window.print()，用户可「另存为 PDF」）
 *  - JSON  .json —— 原生序列化，供 API 直报接口
 *  - XML   .xml  —— 手写序列化，部分政府系统要求的标准报送格式
 *
 * 设计取舍：不引入 xlsx / jspdf / file-saver —— 为单一格式增加 300KB+ 依赖不划算；
 *           CSV 可被 Excel 直接打开，打印方案还能保证中文字体与版式正确。
 *
 * 元信息水印：每次导出自动嵌入「填报单位 / 填报人 / 填报日期 / 数据来源声明」。
 */
import { sectionRowArray } from './sectionRows'
import { downloadZip } from './zipService'

/** 元信息（水印内容）：导出物必须自带数据来源声明，便于审计与归档追溯 */
export function buildMeta(meta = {}) {
  const org = meta.org || '—'
  const filler = meta.filler || '—'
  const date = meta.date || new Date().toLocaleDateString('zh-CN')
  return {
    org,
    filler,
    date,
    lines: [
      '填报单位：' + org,
      '填报人：' + filler,
      '填报日期：' + date,
      '数据来源声明：本报告数据由智慧报告智能体按锁定口径规则集自动换算生成，数值由确定性规则引擎计算，'
        + 'AI 仅参与叙述文字生成（数字经回查校验）。人工修订与异常处置记录见修订留痕。'
    ]
  }
}

/** 触发浏览器下载（统一出口，便于后续替换为服务端下载链接） */
function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 文件名安全化（去掉 Windows / macOS 非法字符） */
function safeName(s) {
  return String(s || 'report').replace(/[\\/:*?"<>|\r\n]/g, '_').slice(0, 80)
}

/** HTML / XML 转义 */
function esc(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/** 导出载荷统一结构：{ title, sections[{ name, narrative, rows[], note }], meta, filename } */
function normalize(payload = {}) {
  return {
    title: payload.title || '智慧报告',
    sections: payload.sections || [],
    meta: buildMeta(payload.meta),
    filename: safeName(payload.filename || payload.title)
  }
}

/* ==================== Excel（CSV） ==================== */
/**
 * CSV 文本：正文按「章节名 + 叙述」，附件按「表头 + 数据行」铺平。
 * 元信息水印以独立行写入，保证文件离开系统后仍可追溯来源。
 * 抽为文本函数供单文件导出与报送包共用，避免两处序列化实现漂移。
 */
export function buildCsvText(payload) {
  const { title, sections, meta } = normalize(payload)
  const rows = [[title], []]
  meta.lines.forEach(l => rows.push([l]))
  rows.push([])
  sections.forEach(sec => {
    rows.push([sec.name])
    if (sec.narrative) rows.push(['（正文）', sec.narrative])
    if (sec.columns && sec.columns.length) rows.push(sec.columns)
    ;(sec.rows || []).forEach(r => rows.push(sectionRowArray(r, sec.columns || [])))
    if (sec.note) rows.push(['说明', sec.note])
    rows.push([])
  })
  return rows.map(r => r.map(cell => {
    const s = cell === null || cell === undefined ? '' : String(cell)
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }).join(',')).join('\r\n')
}

export function exportCsv(payload) {
  const { filename } = normalize(payload)
  // UTF-8 BOM：Excel 识别编码，中文不乱码
  download(new Blob(['\ufeff' + buildCsvText(payload)], { type: 'text/csv;charset=utf-8' }), filename + '.csv')
  return { format: 'csv', filename: filename + '.csv' }
}

/* ==================== Word（docx） ==================== */
/**
 * 导出 Word：复用已装依赖 docx@9.7.1。
 * 动态 import 使 docx 单独打包，未触发导出时不加载。
 */
export async function exportDocx(payload) {
  const { title, sections, meta, filename } = normalize(payload)
  const docx = await import(/* webpackChunkName: "docx" */ 'docx')
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx

  const children = []
  children.push(new Paragraph({ text: title, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }))
  meta.lines.forEach(l => children.push(new Paragraph({
    children: [new TextRun({ text: l, size: 18, color: '808080' })]
  })))
  children.push(new Paragraph({ text: '' }))

  sections.forEach(sec => {
    children.push(new Paragraph({ text: sec.name, heading: HeadingLevel.HEADING_2 }))
    if (sec.narrative) {
      children.push(new Paragraph({ children: [new TextRun({ text: sec.narrative, size: 24 })] }))
    }
    if (sec.columns && sec.columns.length) {
      children.push(new Paragraph({ children: [new TextRun({ text: sec.columns.join('　|　'), bold: true, size: 20 })] }))
    }
    ;(sec.rows || []).forEach(r => {
      children.push(new Paragraph({
        children: [new TextRun({ text: sectionRowArray(r, sec.columns || []).join('　|　'), size: 20 })]
      }))
    })
    if (sec.note) {
      children.push(new Paragraph({ children: [new TextRun({ text: '说明：' + sec.note, size: 18, color: '909399' })] }))
    }
    children.push(new Paragraph({ text: '' }))
  })

  const doc = new Document({ sections: [{ children }] })
  const blob = await Packer.toBlob(doc)
  download(blob, filename + '.docx')
  return { format: 'docx', filename: filename + '.docx' }
}

/* ==================== PDF（打印视图） ==================== */
/**
 * 导出 PDF：零依赖方案——打开打印视图并调用浏览器打印，用户选择「另存为 PDF」。
 * 相比引入 jspdf：无需处理中文字体嵌入，版式与打印一致，体积为零。
 */
export function exportPdf(payload) {
  const { title, sections, meta } = normalize(payload)
  const body = sections.map(sec => {
    const parts = ['<section class="sec"><h2>' + esc(sec.name) + '</h2>']
    if (sec.narrative) parts.push('<p class="narrative">' + esc(sec.narrative) + '</p>')
    if (sec.columns && sec.columns.length) {
      parts.push('<table><thead><tr>' + sec.columns.map(c => '<th>' + esc(c) + '</th>').join('') + '</tr></thead><tbody>')
      ;(sec.rows || []).forEach(r => {
        const cells = sectionRowArray(r, sec.columns || [])
        parts.push('<tr>' + cells.map(c => '<td>' + esc(c) + '</td>').join('') + '</tr>')
      })
      parts.push('</tbody></table>')
    }
    if (sec.note) parts.push('<p class="note">说明：' + esc(sec.note) + '</p>')
    parts.push('</section>')
    return parts.join('')
  }).join('')

  const html = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>' + esc(title) + '</title>'
    + '<style>'
    + '@page { size: A4; margin: 20mm 18mm; }'
    + 'body { font-family: "仿宋", "FangSong", "Noto Sans SC", serif; font-size: 14px; line-height: 1.75; color: #000; }'
    + 'h1 { font-family: "黑体", "SimHei", sans-serif; font-size: 22px; text-align: center; margin: 0 0 12px; }'
    + '.meta { font-size: 11px; color: #666; line-height: 1.7; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 18px; }'
    + '.sec { page-break-inside: auto; margin-bottom: 18px; }'
    + 'h2 { font-family: "黑体", "SimHei", sans-serif; font-size: 16px; border-bottom: 2px solid #333; padding-bottom: 4px; margin: 18px 0 8px; }'
    + '.narrative { text-indent: 2em; margin: 6px 0; }'
    + 'table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 12px; }'
    + 'th, td { border: 1px solid #999; padding: 4px 6px; text-align: left; }'
    + 'th { background: #f2f2f2; font-weight: 600; }'
    + '.note { font-size: 11px; color: #666; margin: 4px 0 0; }'
    + '.watermark { position: fixed; bottom: 6mm; left: 0; right: 0; text-align: center; font-size: 9px; color: #aaa; }'
    + '@media print { .watermark { position: fixed; bottom: 0; } }'
    + '</style></head><body>'
    + '<h1>' + esc(title) + '</h1>'
    + '<div class="meta">' + meta.lines.map(esc).join('<br>') + '</div>'
    + body
    + '<div class="watermark">' + esc(meta.org + ' · ' + meta.date + ' · 由智慧报告智能体生成') + '</div>'
    + '</body></html>'

  const w = window.open('', '_blank')
  if (!w) {
    throw new Error('浏览器拦截了打印窗口，请允许本站弹出窗口后重试')
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
  w.focus()
  // 等待样式与内容就绪再唤起打印，避免打印出空白页
  setTimeout(() => { try { w.print() } catch (e) { /* 用户可能已关闭窗口 */ } }, 400)
  return { format: 'pdf', filename: title + '.pdf' }
}

/* ==================== JSON ==================== */
/** JSON 文本：结构化数据，供 API 直报接口；含元信息与导出时间戳（导出与打包共用） */
export function buildJsonText(payload) {
  const { title, sections, meta } = normalize(payload)
  const data = {
    title,
    meta: { org: meta.org, filler: meta.filler, date: meta.date, statement: meta.lines[3] },
    exportedAt: new Date().toISOString(),
    sections
  }
  return JSON.stringify(data, null, 2)
}

export function exportJson(payload) {
  const { filename } = normalize(payload)
  download(new Blob([buildJsonText(payload)], { type: 'application/json;charset=utf-8' }), filename + '.json')
  return { format: 'json', filename: filename + '.json' }
}

/* ==================== XML ==================== */
/** XML 文本：部分政府报送系统要求的标准格式（导出与打包共用） */
export function buildXmlText(payload) {
  const { title, sections, meta } = normalize(payload)
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<Report>', '  <Title>' + esc(title) + '</Title>', '  <Meta>']
  lines.push('    <Org>' + esc(meta.org) + '</Org>')
  lines.push('    <Filler>' + esc(meta.filler) + '</Filler>')
  lines.push('    <Date>' + esc(meta.date) + '</Date>')
  lines.push('    <SourceStatement>' + esc(meta.lines[3]) + '</SourceStatement>')
  lines.push('  </Meta>')
  lines.push('  <Sections>')
  sections.forEach(sec => {
    lines.push('    <Section name="' + esc(sec.name) + '">')
    if (sec.narrative) lines.push('      <Narrative>' + esc(sec.narrative) + '</Narrative>')
    if (sec.columns && sec.columns.length) {
      lines.push('      <Columns>' + sec.columns.map(c => '<Column>' + esc(c) + '</Column>').join('') + '</Columns>')
    }
    ;(sec.rows || []).forEach(r => {
      lines.push('      <Row>' + esc(sectionRowArray(r, sec.columns || []).join(' | ')) + '</Row>')
    })
    if (sec.note) lines.push('      <Note>' + esc(sec.note) + '</Note>')
    lines.push('    </Section>')
  })
  lines.push('  </Sections>')
  lines.push('</Report>')
  return lines.join('\n')
}

export function exportXml(payload) {
  const { filename } = normalize(payload)
  download(new Blob([buildXmlText(payload)], { type: 'application/xml;charset=utf-8' }), filename + '.xml')
  return { format: 'xml', filename: filename + '.xml' }
}

/* ==================== 报送材料包（ZIP） ==================== */
/**
 * 报送材料包：「报告 + 佐证材料」是一个整体交付物，故打包必须自带材料清单。
 * 与元信息水印同一套哲学——文件离开系统后仍要能自证包内构成（含缺项与材料哈希）。
 * 演示环境：佐证材料以「索引件（元信息 + 哈希）」入包，报告为结构化数据件；
 *          生产环境由服务端打包报告定稿原件（Word / PDF）与佐证材料扫描件。
 */
const MATERIAL_STATUS_TEXT = { ready: '已齐', missing: '待补', pending: '待回传' }

/** 材料状态中文（界面与清单文件共用同一口径） */
export function materialStatusText(s) {
  return MATERIAL_STATUS_TEXT[s] || '—'
}

/** 材料清单（manifest）：每项含来源 / 状态 / 材料哈希，供包外核对与审计 */
export function buildManifestCsv(materials, meta) {
  const list = materials || []
  const rows = [['序号', '分组', '材料名称', '类型', '来源', '留存时间', '文件大小', '是否必需', '状态', '材料哈希', '备注']]
  list.forEach((m, i) => {
    rows.push([
      String(i + 1), m.group || '', m.name || '', m.type || '', m.source || '',
      m.time || '', m.size || '', m.required ? '必需' : '可选',
      materialStatusText(m.status), m.hash || '', m.note || ''
    ])
  })
  const cell = v => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  rows.push(['', '', '合计 ' + list.length + ' 项：已齐 ' + list.filter(m => m.status === 'ready').length
    + ' / 待补 ' + list.filter(m => m.status === 'missing').length
    + ' / 待回传 ' + list.filter(m => m.status === 'pending').length])
  // UTF-8 BOM：Excel 打开中文不乱码
  return '\ufeff' + rows.map(r => r.map(cell).join(',')).join('\r\n')
}

/** 单项佐证材料索引件（演示环境占位；生产环境为原件扫描件） */
function materialIndexText(m, meta) {
  return [
    '佐证材料索引件',
    '',
    '材料名称：' + (m.name || '—'),
    '材料类型：' + (m.type || '—'),
    '所属分组：' + (m.group || '—'),
    '数据来源：' + (m.source || '—'),
    '留存时间：' + (m.time || '—'),
    '文件大小：' + (m.size || '—'),
    '是否必需：' + (m.required ? '必需' : '可选'),
    '材料状态：' + materialStatusText(m.status),
    '材料哈希：' + (m.hash || '（待补录后生成）'),
    '备注：' + (m.note || '—'),
    '',
    '说明：演示环境以本索引件占位（含材料元信息与哈希），生产环境由服务端打入原件扫描件。',
    '填报单位：' + meta.org + '　填报人：' + meta.filler + '　填报日期：' + meta.date
  ].join('\n')
}

/** 打包说明：包构成 + 齐备性 + 防篡改口径 + 生产环境差异 */
function bundleReadme(meta, title, materials, fingerprint) {
  const list = materials || []
  const missing = list.filter(m => m.status === 'missing')
  const pending = list.filter(m => m.status === 'pending')
  const lines = [
    '报送材料包说明',
    '========================================',
    '',
    '【包构成】',
    '1. 报告/　　　　' + title + '（标准报送数据件：CSV / XML）',
    '2. 佐证材料/　　' + list.length + ' 项材料索引件（含材料元信息与哈希）',
    '3. 材料清单.csv　材料齐备性清单（manifest）',
    '4. 打包说明.txt　本文件',
    '',
    '【齐备性】',
    '已齐 ' + list.filter(m => m.status === 'ready').length + ' 项 · 待补 ' + missing.length + ' 项 · 待回传 ' + pending.length + ' 项',
    missing.length
      ? '待补材料：' + missing.map(m => m.name).join('、') + '（缺项不阻断归档，可在提报后补录）'
      : '全部必需材料已齐备。',
    pending.length ? '待回传：' + pending.map(m => m.name).join('、') : '',
    '',
    '【防篡改口径】',
    fingerprint
      ? '内容指纹：' + fingerprint + '（覆盖报告 + 佐证材料 ' + list.length + ' 项；材料补录后须重新校验或补充留痕）'
      : '本包为归档前版本；签字归档时将固化覆盖「报告 + 佐证材料」的内容指纹。',
    '',
    '【元信息】',
    meta.lines.join('\n'),
    '',
    '【生产环境差异】',
    '演示环境：佐证材料以索引件入包，报告为结构化数据件。',
    '生产环境：由服务端打包报告定稿原件（Word / PDF）与佐证材料扫描件，并附逐件哈希校验值。'
  ]
  return lines.join('\n')
}

/** 组装报送包文件清单（路径 + 文本内容） */
export function buildBundleFiles(payload) {
  const p = normalize(payload)
  const materials = payload.materials || []
  const files = [
    { path: '报告/' + p.filename + '.csv', content: '\ufeff' + buildCsvText(payload) },
    { path: '报告/' + p.filename + '.xml', content: buildXmlText(payload) }
  ]
  materials.forEach((m, i) => {
    const no = String(i + 1).padStart(2, '0')
    files.push({ path: '佐证材料/' + no + '_' + safeName(m.name) + '.txt', content: materialIndexText(m, p.meta) })
  })
  files.push({ path: '材料清单.csv', content: buildManifestCsv(materials, p.meta) })
  files.push({ path: '打包说明.txt', content: bundleReadme(p.meta, p.title, materials, payload.fingerprint) })
  return files
}

/** 导出报送材料包（.zip）：报告数据件 + 佐证材料索引件 + 材料清单 + 打包说明 */
export function exportBundle(payload) {
  const p = normalize(payload)
  const files = buildBundleFiles(payload)
  const filename = p.filename + '_报送材料包.zip'
  downloadZip(files, filename)
  return { format: 'bundle', filename, fileCount: files.length }
}

/**
 * 导出格式目录（供界面渲染「导出报告」菜单，避免界面与实现各写一份）。
 * 注：报送材料包（bundle）属包级动作（报告 + 佐证材料），入口在「报送包」行与存证底卷，
 *     不混入本菜单——本菜单只列报告本体的单文件格式。
 */
export const EXPORT_FORMATS = [
  { key: 'docx', label: 'Word（.docx）', desc: '含章节与叙述，供人工复核与盖章' },
  { key: 'xlsx', label: 'Excel（.csv）', desc: '政府在线填报系统通用格式' },
  { key: 'pdf', label: 'PDF（打印 / 另存）', desc: '正式提报文件，版式与打印一致' },
  { key: 'json', label: 'JSON（结构化）', desc: 'API 直报接口用' },
  { key: 'xml', label: 'XML（标准报送）', desc: '部分政府系统要求的标准格式' }
]

/** 统一导出入口：按格式分派，返回 { format, filename } */
export async function exportReport(format, payload) {
  switch (format) {
    case 'docx': return exportDocx(payload)
    case 'xlsx': return exportCsv(payload)
    case 'pdf': return exportPdf(payload)
    case 'json': return exportJson(payload)
    case 'xml': return exportXml(payload)
    case 'bundle': return exportBundle(payload)
    default: throw new Error('不支持的导出格式：' + format)
  }
}
