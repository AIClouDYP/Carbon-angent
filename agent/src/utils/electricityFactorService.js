/**
 * 分时分区电碳因子服务
 *
 * 数据结构：
 *   record = { regionCode, regionName, regionLevel, parentCode, grid,
 *              date, hour, value, unit, quality, source, generationMix? }
 *
 * 存储：以「库」为单位，records 为扁平数组；按 (regionCode, date, hour) 唯一
 */

import { normalizeRegion, normalizeDate, normalizeHour, LEVEL_PRIORITY } from './regionDict'

// ============ CSV 表头映射（支持多种写法） ============
const HEADER_MAP = {
  '区域': 'region',
  '单位': 'region',
  '地区': 'region',
  '省份': 'region',
  '城市': 'region',
  '区域名称': 'region',
  '日期': 'date',
  '数据日期': 'date',
  '小时': 'hour',
  '时段': 'hour',
  '时刻': 'hour',
  '碳排放因子': 'value',
  '因子值': 'value',
  '碳强度': 'value',
  '电碳因子': 'value',
  '煤电占比': 'mixCoal',
  '气电占比': 'mixGas',
  '水电占比': 'mixHydro',
  '风电占比': 'mixWind',
  '光伏占比': 'mixSolar',
  '核电占比': 'mixNuclear',
  '数据来源': 'source',
  '来源': 'source',
  '数据质量': 'quality',
  '质量': 'quality'
}

// ============ 发电结构按省份典型特征模拟（用于演示数据）============
const PROVINCE_MIX = {
  // 水电富集
  '四川': { coal: 0.12, gas: 0.02, hydro: 0.78, wind: 0.04, solar: 0.03, nuclear: 0.01 },
  '云南': { coal: 0.15, gas: 0.01, hydro: 0.75, wind: 0.05, solar: 0.04, nuclear: 0 },
  '湖北': { coal: 0.35, gas: 0.02, hydro: 0.55, wind: 0.04, solar: 0.04, nuclear: 0 },
  '青海': { coal: 0.08, gas: 0.01, hydro: 0.40, wind: 0.22, solar: 0.29, nuclear: 0 },
  '西藏': { coal: 0.01, gas: 0.01, hydro: 0.85, wind: 0.05, solar: 0.08, nuclear: 0 },
  '贵州': { coal: 0.55, gas: 0.01, hydro: 0.38, wind: 0.03, solar: 0.03, nuclear: 0 },
  // 煤电为主
  '内蒙古': { coal: 0.78, gas: 0.02, hydro: 0.03, wind: 0.11, solar: 0.06, nuclear: 0 },
  '山西': { coal: 0.72, gas: 0.03, hydro: 0.02, wind: 0.12, solar: 0.11, nuclear: 0 },
  '河北': { coal: 0.65, gas: 0.05, hydro: 0.01, wind: 0.16, solar: 0.13, nuclear: 0 },
  '山东': { coal: 0.68, gas: 0.04, hydro: 0.01, wind: 0.13, solar: 0.14, nuclear: 0 },
  '安徽': { coal: 0.70, gas: 0.03, hydro: 0.04, wind: 0.08, solar: 0.15, nuclear: 0 },
  '江苏': { coal: 0.62, gas: 0.09, hydro: 0.01, wind: 0.10, solar: 0.12, nuclear: 0.06 },
  '浙江': { coal: 0.46, gas: 0.09, hydro: 0.04, wind: 0.07, solar: 0.11, nuclear: 0.23 },
  '广东': { coal: 0.48, gas: 0.12, hydro: 0.06, wind: 0.09, solar: 0.10, nuclear: 0.15 },
  '福建': { coal: 0.35, gas: 0.03, hydro: 0.13, wind: 0.16, solar: 0.09, nuclear: 0.24 },
  '辽宁': { coal: 0.62, gas: 0.05, hydro: 0.03, wind: 0.15, solar: 0.08, nuclear: 0.07 },
  '河南': { coal: 0.73, gas: 0.03, hydro: 0.03, wind: 0.10, solar: 0.11, nuclear: 0 },
  '陕西': { coal: 0.68, gas: 0.04, hydro: 0.05, wind: 0.09, solar: 0.12, nuclear: 0.02 },
  '宁夏': { coal: 0.62, gas: 0.02, hydro: 0.02, wind: 0.18, solar: 0.16, nuclear: 0 },
  '甘肃': { coal: 0.45, gas: 0.02, hydro: 0.15, wind: 0.20, solar: 0.18, nuclear: 0 },
  '新疆': { coal: 0.68, gas: 0.04, hydro: 0.05, wind: 0.13, solar: 0.10, nuclear: 0 },
  '吉林': { coal: 0.55, gas: 0.02, hydro: 0.08, wind: 0.22, solar: 0.13, nuclear: 0 },
  '黑龙江': { coal: 0.62, gas: 0.03, hydro: 0.05, wind: 0.20, solar: 0.10, nuclear: 0 },
  '江西': { coal: 0.58, gas: 0.02, hydro: 0.20, wind: 0.07, solar: 0.13, nuclear: 0 },
  '湖南': { coal: 0.42, gas: 0.01, hydro: 0.42, wind: 0.07, solar: 0.08, nuclear: 0 },
  '广西': { coal: 0.45, gas: 0.02, hydro: 0.33, wind: 0.08, solar: 0.12, nuclear: 0 },
  '海南': { coal: 0.40, gas: 0.15, hydro: 0.08, wind: 0.12, solar: 0.25, nuclear: 0 },
  '北京': { coal: 0.02, gas: 0.18, hydro: 0.08, wind: 0.14, solar: 0.10, nuclear: 0 },
  '天津': { coal: 0.50, gas: 0.18, hydro: 0.03, wind: 0.15, solar: 0.14, nuclear: 0 },
  '上海': { coal: 0.30, gas: 0.20, hydro: 0.08, wind: 0.15, solar: 0.09, nuclear: 0.18 },
  '重庆': { coal: 0.35, gas: 0.02, hydro: 0.50, wind: 0.05, solar: 0.08, nuclear: 0 }
}
const DEFAULT_MIX = { coal: 0.58, gas: 0.04, hydro: 0.14, wind: 0.10, solar: 0.12, nuclear: 0.02 }

// 各能源品种排放因子（kgCO2e/kWh，生命周期口径）
const EMISSION_RATE = {
  coal: 0.87,
  gas: 0.45,
  hydro: 0.005,
  wind: 0.015,
  solar: 0.048,
  nuclear: 0.012
}

/** 计算发电结构对应的碳强度 */
export function calcIntensity(mix) {
  let v = 0
  Object.keys(EMISSION_RATE).forEach(k => {
    v += (mix[k] || 0) * EMISSION_RATE[k]
  })
  return Math.round(v * 10000) / 10000
}

/**
 * 按小时调整发电结构（模拟日内波动）
 * 光伏：6-18 点出力，正午最高
 * 负荷：8-11、18-21 为高峰
 */
function modulateMix(baseMix, hour) {
  const mix = { ...baseMix }
  // 光伏日内曲线（钟形，峰值 12-13 点）
  let solarFactor = 0
  if (hour >= 6 && hour <= 18) {
    solarFactor = Math.sin(((hour - 6) / 12) * Math.PI)
  } else if (hour > 18 && hour < 22) {
    solarFactor = 0.05
  }
  const solarBase = baseMix.solar || 0
  const solarNow = solarBase * (0.05 + solarFactor * 1.35)
  // 光伏增减由煤电反向补偿
  const delta = solarNow - solarBase
  mix.solar = Math.max(0, solarNow)
  mix.coal = Math.max(0, (baseMix.coal || 0) - delta * 0.85)
  // 归一到 1
  const sum = Object.keys(EMISSION_RATE).reduce((s, k) => s + (mix[k] || 0), 0)
  if (sum > 0) {
    Object.keys(EMISSION_RATE).forEach(k => { mix[k] = Math.round((mix[k] || 0) / sum * 10000) / 10000 })
  }
  return mix
}

/**
 * 生成演示数据（指定省份、日期区间）
 * @param {string} regionName 省份名
 * @param {string} startDate YYYY-MM-DD
 * @param {string} endDate   YYYY-MM-DD
 * @param {string} quality   measured | estimated
 */
export function generateDemoRecords(regionName, startDate, endDate, quality = 'estimated') {
  const region = normalizeRegion(regionName)
  if (!region) return []
  const baseMix = PROVINCE_MIX[region.name] || DEFAULT_MIX
  const records = []

  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return []

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const month = d.getMonth() + 1
    // 季节修正：冬季（11-2月）光伏弱、负荷高
    const seasonFactor = (month >= 11 || month <= 2) ? 1.12 : (month >= 6 && month <= 8 ? 0.94 : 1.0)

    for (let h = 0; h < 24; h++) {
      const mix = modulateMix(baseMix, h)
      // 夜间无光伏时煤电抬高
      let intensity = calcIntensity(mix)
      intensity = Math.round(intensity * seasonFactor * 10000) / 10000
      // 加 1% 随机扰动使曲线自然（确定性伪随机，按日期+小时散列）
      const seed = (d.getDate() * 31 + h * 17 + region.code.charCodeAt(0)) % 100
      intensity = Math.round((intensity * (0.99 + seed / 5000)) * 10000) / 10000

      records.push({
        regionCode: region.code,
        regionName: region.name,
        regionLevel: region.level,
        parentCode: region.parentCode,
        grid: region.grid,
        date: dateStr,
        hour: h,
        value: intensity,
        unit: 'kgCO₂e/kWh',
        quality,
        source: `${region.name}电力交易中心（模拟）`,
        generationMix: mix
      })
    }
  }
  return records
}

// ============ CSV 解析 ============
export function parseCSV(text) {
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',' || c === '\t') { row.push(field); field = '' }
    else if (c === '\n') {
      row.push(field); field = ''
      if (row.some(x => x.trim() !== '')) rows.push(row)
      row = []
    } else if (c === '\r') { /* 忽略 */ }
    else field += c
  }
  row.push(field)
  if (row.some(x => x.trim() !== '')) rows.push(row)
  return rows
}

/**
 * 解析导入文件为记录数组
 * @param {string} text CSV 文本
 * @param {object} opts { source, quality }
 * @returns {{ records: array, errors: array, headers: array, unrecognizedRegions: array }}
 */
export function parseImportText(text, opts = {}) {
  const rows = parseCSV(text)
  if (rows.length < 2) {
    return { records: [], errors: [{ row: 0, message: '文件为空或只有表头行' }], headers: [], unrecognizedRegions: [] }
  }

  const headerRow = rows[0].map(h => String(h).trim())
  const colIdx = {}
  headerRow.forEach((h, i) => {
    const key = HEADER_MAP[h]
    if (key && colIdx[key] === undefined) colIdx[key] = i
  })

  const missing = []
  if (colIdx.region === undefined) missing.push('区域')
  if (colIdx.date === undefined) missing.push('日期')
  if (colIdx.hour === undefined) missing.push('小时')
  if (colIdx.value === undefined) missing.push('碳排放因子')
  if (missing.length) {
    return {
      records: [],
      errors: [{ row: 1, message: `缺少必需列：${missing.join('、')}。请使用标准模板（区域/日期/小时/碳排放因子）` }],
      headers: headerRow,
      unrecognizedRegions: []
    }
  }

  const defaultSource = opts.source || '导入数据'
  const defaultQuality = opts.quality || 'measured'
  const records = []
  const errors = []
  const unrecognizedSet = new Set()
  const seen = new Set()

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r]
    const lineNo = r + 1
    const rawRegion = (cells[colIdx.region] || '').trim()
    const rawDate = (cells[colIdx.date] || '').trim()
    const rawHour = (cells[colIdx.hour] || '').trim()
    const rawValue = (cells[colIdx.value] || '').trim()

    if (!rawRegion && !rawDate && !rawHour && !rawValue) continue // 空行

    const region = normalizeRegion(rawRegion)
    if (!region) {
      errors.push({ row: lineNo, message: `区域「${rawRegion}」无法识别` })
      if (rawRegion) unrecognizedSet.add(rawRegion)
      continue
    }
    const date = normalizeDate(rawDate)
    if (!date) {
      errors.push({ row: lineNo, message: `日期「${rawDate}」格式无效（应为 YYYYMMDD 或 YYYY-MM-DD）` })
      continue
    }
    const hour = normalizeHour(rawHour)
    if (hour === null) {
      errors.push({ row: lineNo, message: `小时「${rawHour}」无效（应为 1~24 或 0~23）` })
      continue
    }
    const value = Number(rawValue)
    if (!Number.isFinite(value) || value < 0 || value > 5) {
      errors.push({ row: lineNo, message: `碳排放因子「${rawValue}」无效（应在 0~5 kgCO₂e/kWh）` })
      continue
    }

    // 去重键
    const key = `${region.code}|${date}|${hour}`
    if (seen.has(key)) {
      errors.push({ row: lineNo, message: `重复记录：${region.name} ${date} ${hour}时` })
      continue
    }
    seen.add(key)

    // 发电结构（可选）
    let generationMix
    const mixKeys = ['mixCoal', 'mixGas', 'mixHydro', 'mixWind', 'mixSolar', 'mixNuclear']
    if (mixKeys.some(k => colIdx[k] !== undefined)) {
      generationMix = {}
      const map = { mixCoal: 'coal', mixGas: 'gas', mixHydro: 'hydro', mixWind: 'wind', mixSolar: 'solar', mixNuclear: 'nuclear' }
      mixKeys.forEach(k => {
        if (colIdx[k] !== undefined) {
          const v = Number(cells[colIdx[k]])
          if (Number.isFinite(v)) generationMix[map[k]] = v > 1 ? v / 100 : v
        }
      })
    }

    records.push({
      regionCode: region.code,
      regionName: region.name,
      regionLevel: region.level,
      parentCode: region.parentCode,
      grid: region.grid,
      date,
      hour,
      value: Math.round(value * 10000) / 10000,
      unit: 'kgCO₂e/kWh',
      quality: (cells[colIdx.quality] || '').trim() || defaultQuality,
      source: (cells[colIdx.source] || '').trim() || defaultSource,
      generationMix
    })
  }

  return { records, errors, headers: headerRow, unrecognizedRegions: Array.from(unrecognizedSet) }
}

/**
 * 计算导入统计（覆盖度报告）
 */
export function buildCoverageReport(records, errors) {
  if (!records.length) {
    return {
      total: 0, success: 0, failed: errors.length,
      provinceCount: 0, cityCount: 0,
      dateStart: '', dateEnd: '', dayCount: 0,
      expectedHours: 0, actualHours: 0, missingHours: 0,
      min: 0, max: 0, mean: 0, std: 0,
      regionList: []
    }
  }
  const provs = new Set()
  const cities = new Set()
  const dates = new Set()
  const regionSet = new Set()
  let sum = 0
  let min = Infinity
  let max = -Infinity
  const values = []

  records.forEach(r => {
    if (r.regionLevel === 'city') cities.add(r.regionCode)
    else if (r.regionLevel === 'province') provs.add(r.regionCode)
    dates.add(r.date)
    regionSet.add(`${r.regionCode}|${r.regionName}|${r.regionLevel}`)
    sum += r.value
    values.push(r.value)
    if (r.value < min) min = r.value
    if (r.value > max) max = r.value
  })

  const sortedDates = Array.from(dates).sort()
  const mean = sum / records.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  const std = Math.sqrt(variance)
  const regionCount = provs.size + cities.size
  const dayCount = sortedDates.length
  const expected = regionCount * dayCount * 24

  return {
    total: records.length + errors.length,
    success: records.length,
    failed: errors.length,
    provinceCount: provs.size,
    cityCount: cities.size,
    dateStart: sortedDates[0] || '',
    dateEnd: sortedDates[sortedDates.length - 1] || '',
    dayCount,
    expectedHours: expected,
    actualHours: records.length,
    missingHours: Math.max(0, expected - records.length),
    min: Math.round(min * 10000) / 10000,
    max: Math.round(max * 10000) / 10000,
    mean: Math.round(mean * 10000) / 10000,
    std: Math.round(std * 10000) / 10000,
    regionList: Array.from(regionSet).map(s => {
      const [code, name, level] = s.split('|')
      return { code, name, level }
    }).sort((a, b) => (LEVEL_PRIORITY[a.level] || 9) - (LEVEL_PRIORITY[b.level] || 9) || a.name.localeCompare(b.name))
  }
}

/**
 * 查询某区域某天的小时序列（用于曲线图）
 */
export function queryDaySeries(records, regionCode, date) {
  const map = new Map()
  records.forEach(r => {
    if (r.regionCode === regionCode && r.date === date) map.set(r.hour, r)
  })
  const series = []
  for (let h = 0; h < 24; h++) {
    const rec = map.get(h)
    series.push({ hour: h, value: rec ? rec.value : null, mix: rec ? rec.generationMix : null })
  }
  return series
}

/**
 * 查询同一时刻多区域对比
 */
export function querySnapshot(records, date, hour) {
  const out = []
  records.forEach(r => {
    if (r.date === date && r.hour === hour) out.push(r)
  })
  return out.sort((a, b) => (LEVEL_PRIORITY[a.regionLevel] || 9) - (LEVEL_PRIORITY[b.regionLevel] || 9) || a.value - b.value)
}

/**
 * 按回退优先级为「某区域某时刻」取值
 * 市级 → 省级 → 区域电网 → 全国
 */
export function resolveFactor(records, regionCode, date, hour) {
  const region = (() => {
    let r = null
    records.some(x => { if (x.regionCode === regionCode) { r = x; return true } return false })
    return r
  })()

  // 直接命中
  const direct = records.find(r => r.regionCode === regionCode && r.date === date && r.hour === hour)
  if (direct) return { record: direct, hitLevel: direct.regionLevel, fallback: false }

  // 市级 → 省级
  if (region && region.regionLevel === 'city' && region.parentCode) {
    const p = records.find(r => r.regionCode === region.parentCode && r.date === date && r.hour === hour)
    if (p) return { record: p, hitLevel: 'province', fallback: true, reason: '市级因子缺失，回退省级' }
  }
  // → 区域电网
  if (region && region.grid) {
    const g = records.find(r => r.regionLevel === 'grid' && r.regionName === region.grid && r.date === date && r.hour === hour)
    if (g) return { record: g, hitLevel: 'grid', fallback: true, reason: '省级因子缺失，回退区域电网' }
  }
  // → 全国
  const n = records.find(r => r.regionCode === 'CN' && r.date === date && r.hour === hour)
  if (n) return { record: n, hitLevel: 'national', fallback: true, reason: '区域因子缺失，回退全国' }

  return { record: null, hitLevel: null, fallback: true, reason: '无可用因子' }
}

/** 生成导入模板 CSV 内容 */
export function buildTemplateCSV(withMix = false) {
  const header = withMix
    ? '区域,日期,小时,碳排放因子,煤电占比,气电占比,水电占比,数据来源'
    : '区域,日期,小时,碳排放因子'
  const rows = [header]
  const sample = withMix
    ? [
        ['北京', '20251201', '1', '0.7920', '0.62', '0.08', '0.05', '北京电力交易中心'],
        ['北京', '20251201', '2', '0.7850', '0.61', '0.08', '0.05', '北京电力交易中心'],
        ['江苏省', '20251201', '1', '0.6210', '0.45', '0.12', '0.08', '江苏电力交易中心'],
        ['南京市', '20251201', '1', '0.6550', '0.48', '0.10', '0.09', '江苏电力交易中心']
      ]
    : [
        ['北京', '20251201', '1', '0.7920'],
        ['北京', '20251201', '2', '0.7850'],
        ['江苏省', '20251201', '1', '0.6210'],
        ['南京市', '20251201', '1', '0.6550']
      ]
  sample.forEach(r => rows.push(r.join(',')))
  return rows.join('\n')
}
