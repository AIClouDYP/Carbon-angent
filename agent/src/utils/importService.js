/**
 * 离线表格导入服务（清单 #2「非碳核算数据补缺采集」主渠道）
 *
 * 零依赖方案：解析 CSV（Excel 可直接「另存为 CSV」）。
 * 说明：.xlsx 为 zip + XML 复合格式，前端解析需引入 xlsx 依赖（约 400KB）；
 *       本服务优先覆盖 CSV 主渠道，xlsx 原生解析列为后续项（见方案文档 §8.3）。
 *
 * 流程：读取文件 → 解析为二维数组 → 表头识别 → 字段映射建议（含置信度）→ 预览确认 → 写入采集项
 */

/** 读取文件为文本（自动去除 UTF-8 BOM，避免表头首列带隐藏字符） */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(String((e.target && e.target.result) || '').replace(/^\ufeff/, ''))
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file, 'UTF-8')
  })
}

/**
 * 解析 CSV 文本为二维数组。
 * 正确处理：引号包裹、引号内逗号、引号内换行、双引号转义、CRLF 换行。
 */
export function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false
  const src = String(text || '')
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++ } else inQuotes = false
      } else {
        cell += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(cell); cell = ''
    } else if (ch === '\n') {
      row.push(cell); rows.push(row); row = []; cell = ''
    } else if (ch !== '\r') {
      cell += ch
    }
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  // 丢弃全空行（Excel 另存常带尾部空行）
  return rows.filter(r => r.some(c => String(c).trim() !== ''))
}

/** 表头归一化：去掉单位符号、括号、标点与大小写差异，便于模糊匹配 */
function normHeader(s) {
  return String(s || '').replace(/[\s（）()【】[\]：:、,，.。/／-]/g, '').toLowerCase()
}

/**
 * 能源统计同义词表：同一指标的不同叫法（映射建议的兜底增强）。
 * 纯字符重叠匹配对「用电量 ↔ 外购电量」这类同义指标会失配（字符重叠仅 50%），
 * 同义词组双向展开后即可命中；组内可由运维按行业口径持续补充。
 */
const SYNONYMS = [
  { key: '外购电量', alts: ['用电量', '购电量', '购入电量', '电量'] },
  { key: '天然气', alts: ['燃气', '天然气消耗', '天然气消费', '天然气消费量'] },
  { key: '综合能源消费量', alts: ['能源消费总量', '综合能耗', '能源消费量', '能源消耗总量'] },
  { key: '碳排放量合计', alts: ['碳排放量', '碳排放', '温室气体排放', '二氧化碳排放'] },
  { key: '节能量', alts: ['年节能量', '节能效果', '节能量核算'] },
  { key: '热力', alts: ['外购热力', '蒸汽', '供热量', '供热'] }
]

/** 同义词组展开：目标字段命组内任一别名时，返回整组别名参与匹配 */
function synonymAliases(name) {
  const n = normHeader(name)
  for (const item of SYNONYMS) {
    const group = [normHeader(item.key)].concat(item.alts.map(normHeader))
    if (group.includes(n)) return group
  }
  return [n]
}

/**
 * 字段映射建议：把源表头映射到目标字段，并给出匹配置信度。
 * 匹配对「目标字段及其同义词组 × 源表头」逐一尝试，取最高分列。
 * 置信度分级：high（完全一致）/ medium（包含关系）/ low（字符重叠 ≥60%）/ none（未匹配）
 */
export function suggestMapping(headers, targetFields) {
  return (targetFields || []).map(f => {
    const aliases = synonymAliases(f.name)
    let best = null
    let bestScore = 0
    ;(headers || []).forEach((h, idx) => {
      const hn = normHeader(h)
      if (!hn) return
      let score = 0
      aliases.forEach(fn => {
        if (!fn) return
        if (hn === fn) score = Math.max(score, 3)
        else if (hn.includes(fn) || fn.includes(hn)) score = Math.max(score, 2)
        else {
          const set = new Set(hn.split(''))
          const hit = fn.split('').filter(c => set.has(c)).length
          if (fn.length && hit / fn.length >= 0.6) score = Math.max(score, 1)
        }
      })
      if (score > bestScore) { bestScore = score; best = idx }
    })
    return {
      field: f.name,
      unit: f.unit || '',
      hint: f.hint || '',
      sourceIndex: best,
      sourceHeader: best === null ? '' : String(headers[best] || ''),
      confidence: bestScore >= 3 ? 'high' : bestScore === 2 ? 'medium' : bestScore === 1 ? 'low' : 'none'
    }
  })
}

/** 按映射把数据行转为「目标字段 → 值」 */
export function applyMapping(rows, mapping) {
  return (rows || []).map(r => {
    const out = {}
    ;(mapping || []).forEach(m => {
      out[m.field] = (m.sourceIndex === null || m.sourceIndex === undefined) ? '' : String(r[m.sourceIndex] === undefined ? '' : r[m.sourceIndex])
    })
    return out
  })
}

/** 映射质量汇总：用于导入前的就绪度提示 */
export function mappingSummary(mapping) {
  const list = mapping || []
  const high = list.filter(m => m.confidence === 'high').length
  const medium = list.filter(m => m.confidence === 'medium').length
  const low = list.filter(m => m.confidence === 'low').length
  const none = list.filter(m => m.confidence === 'none').length
  const matched = high + medium + low
  return {
    total: list.length,
    high, medium, low, none, matched,
    rate: list.length ? Math.round(matched / list.length * 100) : 0,
    // 未匹配字段需人工指定列，否则该字段将留空
    needManual: none > 0
  }
}

/** 置信度元信息（界面标注用） */
export const MAPPING_CONFIDENCE = {
  high: { label: '精确匹配', type: 'success' },
  medium: { label: '包含匹配', type: 'primary' },
  low: { label: '模糊匹配', type: 'warning' },
  none: { label: '未匹配', type: 'danger' }
}
