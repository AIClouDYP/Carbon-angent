/**
 * 分时分区电碳因子 —— 生产阶段市电活动数据 + 按日 24 小时明细
 *
 * 适用判定：stage.key === 'manufacturing' && inp.type === '能源'
 *          && name 含「电」 && 不含绿电/光伏等非电网电力
 */

import { normalizeRegion } from './regionDict'

// 非电网电力关键词（需排除）
const NON_GRID_KEYWORDS = ['绿电', '光伏', '风电', '水电', '核电', '生物质电', '余电', '自发电', '直购电', '清洁能源']

/**
 * 判断某输入流是否应应用分时分区电碳因子
 *
 * 适用范围：仅生产制造/整车生产阶段的「市电」类型输入流
 * 判定规则：
 *   1. 阶段 key 为 manufacturing / vehicle_production（生产阶段）
 *   2. 流类型为能源（flowType === 'energy' 或 listType === 'energy' 或 type === '能源'）
 *   3. 名称中含「电」
 *   4. 不含绿电/光伏/风电/水电等非电网电力
 *   5. 单位为电量单位（kWh / 度）
 */
export function isTimespaceElec(inp, stage) {
  if (!inp || !stage) return false
  // 1. 仅生产阶段（生产制造阶段 / 整车生产阶段）
  const prodKeys = ['manufacturing', 'vehicle_production']
  if (prodKeys.indexOf(stage.key) === -1) return false
  // 2. 类型为能源
  const isEnergy = inp.flowType === 'energy' || inp.listType === 'energy' || inp.type === '能源'
  if (!isEnergy) return false
  const name = String(inp.name || '')
  // 3. 名称须含「电」
  if (!name.includes('电')) return false
  // 4. 排除非电网电力
  if (NON_GRID_KEYWORDS.some(k => name.includes(k))) return false
  // 5. 单位须为电量单位
  if (!/kwh|度/i.test(String(inp.unit || ''))) return false
  return true
}

/** 字符串散列（确定性伪随机） */
function hashStr(s) {
  let h = 0
  for (let i = 0; i < String(s).length; i++) {
    h = ((h << 5) - h + String(s).charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/**
 * 工序日内负荷特征（相对值 0~1）
 * 涂装/烘干偏夜间，冲压/焊接偏白天，总装全天
 */
export function hourlyLoadProfile(procName) {
  const name = String(procName || 'proc')
  const isNight = /涂装|烘干|固化|喷涂/.test(name)
  const isDay = /冲压|焊接|机加/.test(name)
  const h0 = hashStr(name)
  const arr = []
  for (let h = 0; h < 24; h++) {
    let base
    if (isNight) {
      base = (h >= 20 || h <= 5) ? 1 : 0.3
    } else if (isDay) {
      base = (h >= 8 && h <= 18) ? 1 : 0.2
    } else {
      base = (h >= 7 && h <= 21) ? 0.9 : 0.4
    }
    // 小幅确定性波动
    const wave = 0.92 + ((h0 + h * 13) % 17) / 100
    arr.push(Math.round(base * wave * 1000) / 1000)
  }
  // 归一到峰值 = 1
  const max = Math.max(...arr) || 1
  return arr.map(v => Math.round((v / max) * 1000) / 1000)
}

// ============ 省份发电结构（与排放因子库演示数据一致）============
const PROVINCE_MIX = {
  '四川': { coal: 0.12, gas: 0.02, hydro: 0.78, wind: 0.04, solar: 0.03, nuclear: 0.01 },
  '云南': { coal: 0.15, gas: 0.01, hydro: 0.75, wind: 0.05, solar: 0.04, nuclear: 0 },
  '湖北': { coal: 0.35, gas: 0.02, hydro: 0.55, wind: 0.04, solar: 0.04, nuclear: 0 },
  '青海': { coal: 0.08, gas: 0.01, hydro: 0.40, wind: 0.22, solar: 0.29, nuclear: 0 },
  '西藏': { coal: 0.01, gas: 0.01, hydro: 0.85, wind: 0.05, solar: 0.08, nuclear: 0 },
  '贵州': { coal: 0.55, gas: 0.01, hydro: 0.38, wind: 0.03, solar: 0.03, nuclear: 0 },
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

// 各能源品种排放因子（kgCO₂e/kWh）
const EMISSION_RATE = { coal: 0.87, gas: 0.45, hydro: 0.005, wind: 0.015, solar: 0.048, nuclear: 0.012 }

/** 按发电结构计算碳强度 */
function calcIntensity(mix) {
  let v = 0
  Object.keys(EMISSION_RATE).forEach(k => { v += (mix[k] || 0) * EMISSION_RATE[k] })
  return v
}

/**
 * 计算某区域某日某小时的电碳因子
 * 与「排放因子库 → 分时分区电碳因子库」的演示数据算法一致：
 * 按省份典型发电结构 + 日内光伏曲线 + 季节修正 + 确定性扰动
 *
 * @param {string} regionName 任务区域（企业所在地址，如「江苏」「南京」）
 * @param {string} date YYYY-MM-DD
 * @param {number} hour 0~23
 * @returns {{ value: number, hitLevel: string, regionName: string }}
 */
export function factorAt(regionName, date, hour) {
  const region = normalizeRegion(regionName)
  // 区域名无法识别 → 回退到「北京」（本案例企业所在地）
  const fallbackName = '北京'
  const baseMix = PROVINCE_MIX[region ? region.name : fallbackName] || PROVINCE_MIX[fallbackName] || DEFAULT_MIX

  // 日内光伏曲线（6~18 点，正午峰值）
  let solarFactor = 0
  if (hour >= 6 && hour <= 18) {
    solarFactor = Math.sin(((hour - 6) / 12) * Math.PI)
  } else if (hour > 18 && hour < 22) {
    solarFactor = 0.05
  }
  const mix = { ...baseMix }
  const solarNow = (baseMix.solar || 0) * (0.05 + solarFactor * 1.35)
  const delta = solarNow - (baseMix.solar || 0)
  mix.solar = Math.max(0, solarNow)
  mix.coal = Math.max(0, (baseMix.coal || 0) - delta * 0.85)
  // 归一
  const sum = Object.keys(EMISSION_RATE).reduce((s, k) => s + (mix[k] || 0), 0)
  if (sum > 0) Object.keys(EMISSION_RATE).forEach(k => { mix[k] = (mix[k] || 0) / sum })

  // 季节修正
  const month = Number(String(date).slice(5, 7)) || 1
  const seasonFactor = (month >= 11 || month <= 2) ? 1.12 : ((month >= 6 && month <= 8) ? 0.94 : 1.0)

  let intensity = calcIntensity(mix) * seasonFactor

  // 确定性扰动
  const day = Number(String(date).slice(8, 10)) || 1
  const seed = (day * 31 + hour * 17 + hashStr(regionName || fallbackName)) % 100
  intensity = intensity * (0.99 + seed / 5000)

  return {
    value: Math.round(intensity * 10000) / 10000,
    hitLevel: region ? region.level : 'province',
    regionName: region ? region.name : fallbackName
  }
}

/** 常规模式（区域电网年均）对照因子 */
const NORMAL_FACTOR = {
  '北京': 0.581, '天津': 0.636, '河北': 0.647, '山西': 0.647, '内蒙古': 0.647,
  '上海': 0.550, '江苏': 0.550, '浙江': 0.550, '安徽': 0.550, '福建': 0.550,
  '山东': 0.647, '河南': 0.527, '湖北': 0.527, '湖南': 0.527, '江西': 0.527,
  '重庆': 0.527, '四川': 0.527, '广东': 0.404, '广西': 0.404, '云南': 0.404,
  '贵州': 0.404, '海南': 0.404, '陕西': 0.554, '甘肃': 0.554, '青海': 0.554,
  '宁夏': 0.554, '新疆': 0.554, '辽宁': 0.512, '吉林': 0.512, '黑龙江': 0.512,
  '西藏': 0.527
}

/**
 * 生成某工序某日的 24 小时明细（用电量 + 因子 + 排放量）
 * @param {object} opts
 *   procName   工序名
 *   date       YYYY-MM-DD
 *   totalKwh   该工序核算期总电量（kWh）
 *   days       核算期天数
 *   region     任务区域（企业所在地址）
 *   stoppedHours 停产小时（可选，数组，这些时段电量为 0 但仍显示行）
 * @returns {{ rows: Array, dayKwh: number, dayEmission: number, avgFactor: number }}
 */
export function buildDayDetail(opts) {
  const { procName, date, totalKwh, days, region, stoppedHours } = opts
  const profile = hourlyLoadProfile(procName)
  const h0 = hashStr(procName + date)

  // 当日用电量 = 总电量 / 天数 × 日波动系数（0.85~1.15）
  const dayWave = 0.85 + ((h0 % 31) / 100)
  const dayKwh = Math.round((totalKwh / Math.max(days, 1)) * dayWave * 100) / 100

  // 停产时段（确定性生成：部分日期有检修停产）
  const stopped = new Set(stoppedHours || [])
  if (!stoppedHours) {
    // 每 7 天出现 1 天检修，停产 4~6 小时（凌晨）
    if (h0 % 7 === 0) {
      const startH = 1 + (h0 % 3)
      const dur = 4 + (h0 % 3)
      for (let i = 0; i < dur; i++) stopped.add((startH + i) % 24)
    }
  }

  // 按负荷曲线分配到 24 小时（停产小时负荷归 0）
  const effectiveProfile = profile.map((v, h) => stopped.has(h) ? 0 : v)
  const sumProfile = effectiveProfile.reduce((s, v) => s + v, 0) || 1

  const rows = []
  let dayEmission = 0
  let weightedFactorSum = 0
  let sumKwh = 0

  for (let h = 0; h < 24; h++) {
    const isStopped = stopped.has(h)
    const kwh = isStopped ? 0 : Math.round((dayKwh * effectiveProfile[h] / sumProfile) * 100) / 100
    const f = factorAt(region, date, h)
    const factor = f.value
    const emission = Math.round(kwh * factor * 100) / 100

    dayEmission += emission
    weightedFactorSum += kwh * factor
    sumKwh += kwh

    rows.push({
      hour: h,
      hourLabel: `${String(h).padStart(2, '0')}:00-${String((h + 1) % 24).padStart(2, '0')}:00`,
      kwh,
      factor,
      factorHitLevel: f.hitLevel,
      factorRegion: f.regionName,
      emission,
      stopped: isStopped,
      // 活动数据来源（阶段4展示）
      dataSource: isStopped ? '停产（电量为0）' : '车间智能电表实测',
      // 因子来源（阶段5展示）
      factorSource: '分时分区电碳因子库'
    })
  }

  const avgFactor = sumKwh > 0 ? Math.round((weightedFactorSum / sumKwh) * 10000) / 10000 : 0

  // 常规模式对照因子（区域电网年均，用于阶段5对比）
  const normalFactor = NORMAL_FACTOR[region] || NORMAL_FACTOR[fallbackProvince(region)] || 0.581

  return {
    rows,
    dayKwh: Math.round(sumKwh * 100) / 100,
    dayEmission: Math.round(dayEmission * 100) / 100,
    avgFactor,
    normalFactor,
    // 分时因子相对常规因子的偏差
    factorDiff: avgFactor && normalFactor
      ? Math.round(((avgFactor - normalFactor) / normalFactor) * 10000) / 100
      : 0
  }
}

/** 区域名归一为省份名（用于对照因子查找） */
function fallbackProvince(regionName) {
  const r = normalizeRegion(regionName)
  return r ? r.name : '北京'
}

/**
 * 计算核算期内的分时因子加权平均值（用于阶段7碳排放计算）
 * 权重：按工序负荷曲线分配的电量
 *
 * @param {object} opts { procName, startDate, endDate, region }
 * @returns {{ avgFactor: number, totalKwh: number, dayCount: number }}
 */
export function calcPeriodWeightedFactor(opts) {
  const { procName, startDate, endDate, region } = opts
  const days = daysBetween(startDate, endDate)
  const profile = hourlyLoadProfile(procName)
  const sumProfile = profile.reduce((s, v) => s + v, 0) || 1

  // 抽样计算：最多取 30 天（避免 366×24 次循环）
  const step = Math.max(1, Math.floor(days / 30))
  let weighted = 0
  let weightSum = 0
  let sampledDays = 0

  const start = new Date(startDate + 'T00:00:00')
  for (let d = 0; d < days; d += step) {
    const dt = new Date(start)
    dt.setDate(dt.getDate() + d)
    const dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
    sampledDays++

    for (let h = 0; h < 24; h++) {
      const w = profile[h] / sumProfile  // 该小时电量权重
      if (w <= 0) continue
      const f = factorAt(region, dateStr, h)
      weighted += w * f.value
      weightSum += w
    }
  }

  const avgFactor = weightSum > 0 ? weighted / weightSum : 0
  return {
    avgFactor: Math.round(avgFactor * 10000) / 10000,
    dayCount: days,
    sampledDays
  }
}

/**
 * 计算核算期天数
 */
export function daysBetween(start, end) {
  if (!start || !end) return 365
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 365
  return Math.max(1, Math.round((e - s) / 86400000) + 1)
}
