/**
 * 排放因子匹配服务 (C-PSTGT-E v2.2 极简高可用公共模块)
 * 覆盖 7 大核算场景: 产品碳足迹(PCF)、产品环境足迹(PEF)、组织碳核算(Org)、北京碳市场(Beijing)、零碳园区(Park)、绿色工厂(GreenFactory)、零碳工厂(ZeroCarbon)
 *
 * v2.3：物料匹配规则配置化——场景路由 + 物料规则从「硬编码 if-else」收敛为「可维护规则表」，
 *       由 Skill 管理（因子匹配 Skill）界面增删改，运行时 loadMatchingRules() 读取，
 *       运维人员新增/调整物料匹配规则无需改代码。
 */

// ============================================================================
// 1. 全场景静态路由映射字典 (Context & Boundary 前置)
// ============================================================================
export const SCENARIO_ROUTING_MAP = {
  // 01. 产品碳足迹
  'footprint': {
    scenarioName: '产品碳足迹 (PCF)',
    standard: 'ISO 14067 / QC/T 1248-2025',
    gasType: 'CO₂e',
    systemBoundary: 'cradle-to-gate',
    electricityFactorType: 'footprint_full_lifecycle', // 含上游与线损
    preferredPools: ['CPCD 2026版', 'Ecoinvent v3.10', 'ELCD v3.2'],
    techPriorityHigh: true // T层工艺(电炉vs长流程、原生vs再生)具有决定权
  },
  // 02. 产品环境足迹
  'pef': {
    scenarioName: '产品环境足迹 (PEF)',
    standard: 'EU PEF Guide / EF 3.1',
    gasType: 'CO₂e / 16类环境影响指标',
    systemBoundary: 'cradle-to-gate',
    electricityFactorType: 'eu_ef_default',
    preferredPools: ['ELCD v3.2', 'Ecoinvent v3.10'],
    techPriorityHigh: true
  },
  // 03. 组织碳核算
  'org-accounting': {
    scenarioName: '组织碳核算 (Org)',
    standard: 'ISO 14064-1 / GHG Protocol',
    gasType: 'CO₂',
    systemBoundary: 'gate-to-gate / 范围一+范围二',
    electricityFactorType: 'consumption_grid_average', // 消费侧年均CO2
    preferredPools: ['国家温室气体排放因子库（公告〔2025〕47号）', 'IPCC 2006指南'],
    techPriorityHigh: false
  },
  // 04. 北京碳市场
  'beijing-carbon': {
    scenarioName: '北京碳市场核算 (Beijing Carbon)',
    standard: '北京市地方配额核算指南',
    gasType: 'CO₂',
    systemBoundary: 'compliance_report_boundary',
    electricityFactorType: 'beijing_compliance_assigned', // 主管部门指定
    preferredPools: ['国家温室气体排放因子库', '北京市碳市场指定因子库'],
    techPriorityHigh: false
  },
  // 05. 零碳园区
  'park-accounting': {
    scenarioName: '零碳园区核算 (Park)',
    standard: '零碳园区建设与评价指南',
    gasType: 'CO₂e',
    systemBoundary: 'park_spatial_boundary',
    electricityFactorType: 'regional_grid_and_green_power', // 区域电网+绿电抵消
    preferredPools: ['国家温室气体排放因子库', 'CPCD 2026版'],
    techPriorityHigh: true
  },
  // 06. 绿色工厂
  'green-factory': {
    scenarioName: '绿色工厂评价 (Green Factory)',
    standard: 'GB/T 36132 绿色工厂评价通则',
    gasType: 'CO₂',
    systemBoundary: 'factory_boundary',
    electricityFactorType: 'national_grid_average',
    preferredPools: ['国家温室气体排放因子库'],
    techPriorityHigh: false
  },
  // 07. 零碳工厂
  'zero-carbon-factory': {
    scenarioName: '零碳工厂核算与认证 (Zero Carbon Factory)',
    standard: '《国家级零碳工厂建设评估指标体系及指标说明（试行）》+ 建设方案大纲（工信部）',
    gasType: 'CO₂e',
    systemBoundary: 'factory_boundary_and_offsets',
    electricityFactorType: 'consumption_with_market_deduction', // 扣除市场化绿电
    preferredPools: ['国家温室气体排放因子库', 'CPCD 2026版'],
    techPriorityHigh: true
  },
  // 08. 智慧报告（能碳报告报送）
  'report-submission': {
    scenarioName: '能碳报告报送 (Smart Report)',
    standard: '附件2 用能单位能源利用状况报告格式 / GB/T 2589 / GB/T 32150',
    gasType: 'CO₂ / 吨标准煤',
    systemBoundary: 'legal_entity_boundary', // 报送以法人单位边界为准
    electricityFactorType: 'consumption_grid_average', // 消费侧电网平均因子（按主管部门公布口径）
    preferredPools: ['国家温室气体排放因子库（公告〔2025〕47号）', '北京市碳市场指定因子库'],
    techPriorityHigh: false // 报送场景以主管部门公布口径为准，不因工艺差异调整
  }
}

// ============================================================================
// 2. 物料匹配规则表（运维可维护：关键词模式 → 因子，支持场景覆盖与地域细分）
//    结构说明：每条规则 = 一个物料类别；pattern 为正则关键词；scenarioOverrides 为特殊场景覆盖；
//             regionValues 为可选的地域因子值映射（电力等地域敏感因子用，缺省回退 factorValue）。
// ============================================================================
const RULES_STORAGE_KEY = 'carbon-factor-matching-rules'

const DEFAULT_MATCHING_RULES = [
  {
    id: 'electricity',
    name: '电力（外购电/动力）',
    pattern: '电|动力',
    priority: 1,
    factorId: 'NGEF-EN-004',
    factorName: '区域电力平均因子',
    factorValue: '0.5500',
    factorUnit: 'kgCO₂/kWh',
    dbName: '国家温室气体排放因子库',
    sourcePool: '国家官方公告(池1)',
    tech: '电网综合平均',
    geo: '按生产地区域',
    confidence: 0.98,
    regionValues: { '华北': '0.6361', '南方': '0.4042' },
    scenarioOverrides: {
      'footprint': { factorId: 'CPCD-EN-001', factorName: '电网平均排放因子（含上游及线损）', factorValue: '0.581', factorUnit: 'kgCO₂e/kWh', dbName: 'CPCD 2026版', sourcePool: '生命周期数据库(池3)', tech: '电网全生命周期', geo: '按生产地区域', confidence: 0.96, regionValues: { '华北': '0.647', '南方': '0.527' } },
      'pef': { factorId: 'CPCD-EN-001', factorName: '电网平均排放因子（含上游及线损）', factorValue: '0.581', factorUnit: 'kgCO₂e/kWh', dbName: 'CPCD 2026版', sourcePool: '生命周期数据库(池3)', tech: '电网全生命周期', geo: '按生产地区域', confidence: 0.96, regionValues: { '华北': '0.647', '南方': '0.527' } },
      'beijing-carbon': { factorId: 'BJ-ETS-001', factorName: '北京电网碳排放核算因子（主管部门指定）', factorValue: '0.6040', factorUnit: 'kgCO₂/kWh', dbName: '北京市碳市场指定库', sourcePool: '国家官方/主管部门指定(池1)', tech: '履约指定口径', geo: '北京', confidence: 1.0 },
      'zero-carbon-factory': { factorId: 'NGEF-EN-002', factorName: '全国电力平均因子（不含市场化非化石电量）', factorValue: '0.6096', factorUnit: 'kgCO₂/kWh', dbName: '国家温室气体排放因子库', sourcePool: '国家官方公告(池1)', tech: '化石能源基准', geo: '全国', confidence: 0.95 }
    },
    excludedReason: '区域电力消费侧二氧化碳因子（口径为消费侧CO₂，未含发电上游与全生命周期）'
  },
  {
    id: 'aluminium',
    name: '铝/铸铝',
    pattern: '铝|铸铝',
    priority: 2,
    factorId: 'CPCD-MA-003',
    factorName: '铸造铝合金（原生）',
    factorValue: '8.52',
    factorUnit: 'kgCO₂e/kg',
    dbName: 'CPCD 2026版',
    sourcePool: '生命周期数据库(池3)',
    tech: '铸造/原生路线',
    geo: '全国',
    confidence: 0.93,
    excludedReason: '原生铝（Aluminium, primary，地理代表性全球低于本土实测）'
  },
  {
    id: 'steel',
    name: '钢/铁',
    pattern: '钢|铁',
    priority: 3,
    factorId: 'CPCD-MA-001',
    factorName: '热轧钢棒（碳钢/合金钢）',
    factorValue: '2.43',
    factorUnit: 'kgCO₂e/kg',
    dbName: 'CPCD 2026版',
    sourcePool: '生命周期数据库(池3)',
    tech: '热轧/原生',
    geo: '中国江苏',
    confidence: 0.94,
    excludedReason: '转炉钢（Steel, converter，地理层级全球低于江苏实测）'
  },
  {
    id: 'natural-gas',
    name: '天然气/燃气',
    pattern: '天然气|燃气',
    priority: 4,
    factorId: 'IPCC-EN-001',
    factorName: '天然气燃烧（固定源）',
    factorValue: '2.16172',
    factorUnit: 'kgCO₂e/m³',
    dbName: 'IPCC 2006指南',
    sourcePool: '国际通用缺省(池1)',
    tech: '固定源燃烧',
    geo: '全球',
    confidence: 0.90
  },
  {
    id: 'diesel-gasoline',
    name: '柴油/汽油',
    pattern: '柴油|汽油',
    priority: 5,
    factorId: 'IPCC-EN-002',
    factorName: '柴油燃烧（移动源内燃机）',
    factorValue: '2.66085',
    factorUnit: 'kgCO₂e/L',
    dbName: 'IPCC 2006指南',
    sourcePool: '国际通用缺省(池1)',
    tech: '内燃机燃烧',
    geo: '全球',
    confidence: 0.90
  }
]

const DEFAULT_FALLBACK_RULE = {
  factorId: 'CPCD-GEN-001',
  factorName: '行业参考排放因子',
  factorValue: '1.25',
  factorUnit: 'kgCO₂e/kg',
  dbName: 'CPCD 2026版',
  sourcePool: '生命周期数据库(池3)',
  tech: '通用工业',
  geo: '全国',
  confidence: 0.82
}

// ============================================================================
// 3. 规则配置读写（运维维护入口，Skill 管理界面调用）
// ============================================================================

/**
 * 读取物料匹配规则（优先 localStorage 运维维护版本，兜底代码默认值）
 * @returns {Array} 规则数组（按 priority 升序）
 */
export function loadMatchingRules() {
  try {
    const raw = localStorage.getItem(RULES_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.rules) && parsed.rules.length) {
        return parsed.rules
      }
    }
  } catch (e) { /* ignore */ }
  return JSON.parse(JSON.stringify(DEFAULT_MATCHING_RULES))
}

/**
 * 保存物料匹配规则（运维人员在 Skill 管理界面编辑后调用）
 * @param {Array} rules 规则数组
 * @returns {boolean} 是否成功
 */
export function saveMatchingRules(rules) {
  try {
    localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify({ version: 1, rules }))
    return true
  } catch (e) { return false }
}

/**
 * 读取兜底规则（无任何物料规则命中时的兜底因子）
 */
export function loadFallbackRule() {
  try {
    const raw = localStorage.getItem(RULES_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.fallback) return parsed.fallback
    }
  } catch (e) { /* ignore */ }
  return { ...DEFAULT_FALLBACK_RULE }
}

/**
 * 重置规则为代码默认值
 */
export function resetMatchingRules() {
  try { localStorage.removeItem(RULES_STORAGE_KEY); return true } catch (e) { return false }
}

/**
 * 获取默认规则（供界面「恢复默认」与初始渲染）
 */
export function getDefaultMatchingRules() {
  return JSON.parse(JSON.stringify(DEFAULT_MATCHING_RULES))
}

export function getDefaultFallbackRule() {
  return { ...DEFAULT_FALLBACK_RULE }
}

// ============================================================================
// 4. 前缀量纲自动换算矩阵 (Quantity & Equivalence)
// ============================================================================
export function normalizeQuantityAndUnit(val, rawUnit, targetUnit) {
  let v = parseFloat(val) || 0
  let multiplier = 1
  const u1 = (rawUnit || '').trim().toLowerCase()
  const u2 = (targetUnit || '').trim().toLowerCase()
  if (!u1 || !u2 || u1 === u2) return { val: v, multiplier: 1, converted: false }

  // 电能量纲
  if (u1 === 'mwh' && u2 === 'kwh') { v *= 1000; multiplier = 1000 }
  else if (u1 === 'kwh' && u2 === 'mwh') { v /= 1000; multiplier = 0.001 }
  else if (u1 === '万kwh' && u2 === 'kwh') { v *= 10000; multiplier = 10000 }
  // 质量量纲
  else if (u1 === 't' && u2 === 'kg') { v *= 1000; multiplier = 1000 }
  else if (u1 === 'kg' && u2 === 't') { v /= 1000; multiplier = 0.001 }
  else if (u1 === 'g' && u2 === 'kg') { v /= 1000; multiplier = 0.001 }
  // 容积量纲
  else if (u1 === 'nm³' && u2 === 'm³') { multiplier = 1 }
  else if (u1 === 'l' && u2 === 'm³') { v /= 1000; multiplier = 0.001 }
  else if (u1 === 'm³' && u2 === 'l') { v *= 1000; multiplier = 1000 }

  return { val: v, multiplier, converted: multiplier !== 1 }
}

// ============================================================================
// 5. 企业映射记忆检索与失效校验 (Evolution & Memory, 带地域作用域与2年时效)
// ============================================================================
export function queryMappingMemory(itemName, targetRegion = '全国') {
  try {
    const raw = localStorage.getItem('cfp_factor_mapping_memory')
    if (!raw) return null
    const memoryList = JSON.parse(raw)
    if (!Array.isArray(memoryList) || memoryList.length === 0) return null

    // 优先匹配相同地域作用域，再匹配通用地域
    let match = memoryList.find(m => {
      const nameHit = m.activityKeyword && (itemName.includes(m.activityKeyword) || m.activityKeyword.includes(itemName))
      const regionHit = m.region ? (m.region === targetRegion || targetRegion.includes(m.region)) : true
      return nameHit && regionHit
    })
    if (!match) {
      match = memoryList.find(m => m.activityKeyword && (itemName.includes(m.activityKeyword) || m.activityKeyword.includes(itemName)))
    }
    if (!match) return null

    // 2年时效校验
    if (match.updatedAt) {
      const recordYear = new Date(match.updatedAt).getFullYear()
      const currentYear = new Date().getFullYear()
      if (currentYear - recordYear > 2) {
        return { ...match, isExpired: true }
      }
    }
    return match
  } catch (e) {
    return null
  }
}

// ============================================================================
// 5.5 企业实测因子检索（企业因子库接入位：P-1 最高优先级，凭证有效期内方可命中）
// 数据源：企业因子库（localStorage: enterprise_measured_factors），演示种子见 ENTERPRISE_FACTOR_SEEDS
// 治理规则：状态非「有效」或超出有效期时返回 null——不参与命中，自动回退后续链路（留痕见调用方）
// 与「排放因子库」的关系：公因数（权威缺省，平台运维）vs 私因数（企业实测，本库治理），严格分库
// ============================================================================
const ENTERPRISE_FACTOR_SEEDS = [
  { code: 'EF-001', name: '天然气低位热值（实测）', keyword: '天然气', factorId: 'ENT-GAS-001', factorName: '天然气低位热值（企业实测）', factorValue: '13.56', factorUnit: 'tce/万Nm³', scope: '厂区 · 锅炉与工艺用气', lab: '华测检测 CMA', reportNo: 'PM-012', testDate: '2026-03-18', expireDate: '2027-03-17', status: '有效' },
  { code: 'EF-003', name: '外购电力排放因子（绿电剥离实测）', keyword: '电力', factorId: 'ENT-POWER-001', factorName: '外购电力排放因子（绿电剥离实测）', factorValue: '0.5792', factorUnit: 'kgCO₂/kWh', scope: '厂区 · 全厂（扣除市场化绿电）', lab: '中环联合认证', reportNo: 'PM-015', testDate: '2026-06-10', expireDate: '2027-06-09', status: '有效' },
  { code: 'EF-002', name: '柴油低位热值（实测）', keyword: '柴油', factorId: 'ENT-DIESEL-001', factorName: '柴油低位热值（企业实测）', factorValue: '1.4992', factorUnit: 'tce/t', scope: '厂区 · 厂内运输车辆', lab: '华测检测 CMA', reportNo: 'PM-013', testDate: '2026-05-06', expireDate: '2026-09-01', status: '已过期' }
]

export function queryEnterpriseFactor(itemName) {
  let list = ENTERPRISE_FACTOR_SEEDS
  try {
    const raw = localStorage.getItem('enterprise_measured_factors')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) list = parsed
    }
  } catch (e) { /* 解析失败回退演示种子 */ }
  const hit = list.find(f => f.status === '有效' && f.keyword && (itemName.includes(f.keyword) || f.keyword.includes(itemName)))
  if (!hit) return null
  // 有效期校验：凭证过期即降级退出（由后续链路兜底）
  if (hit.expireDate && hit.expireDate !== '—' && new Date(hit.expireDate) < new Date()) return null
  return hit
}

// ============================================================================
// 6. C-PSTGT-E 匹配核心执行函数（规则表驱动）
// ============================================================================
export function matchFactor(item, scenarioKey = 'footprint', taskContext = {}) {
  const cfg = SCENARIO_ROUTING_MAP[scenarioKey] || SCENARIO_ROUTING_MAP['footprint']
  const itemName = item.name || ''
  const itemUnit = item.unit || ''
  const itemVal = parseFloat(item.value) || 0
  const taskRegion = taskContext.region || '华东'

  // Step P-1: 企业实测因子检索（企业因子库，检测凭证有效期内最高优先级）
  const entHit = queryEnterpriseFactor(itemName)
  if (entHit) {
    const normRes = normalizeQuantityAndUnit(itemVal, itemUnit, entHit.factorUnit.split('/')[1] || itemUnit)
    return {
      traceId: 'trace-ent-' + Date.now(),
      itemName,
      itemUnit,
      scenario: cfg.scenarioName,
      standard: cfg.standard,
      memoryHit: false,
      enterpriseMeasured: true,
      selected: {
        factorId: entHit.factorId,
        factorName: entHit.factorName,
        factorValue: entHit.factorValue,
        factorUnit: entHit.factorUnit,
        sourcePool: '企业实测因子库 (P-1 优先命中 · 检测凭证有效)',
        tech: '企业实测',
        geo: entHit.scope || '企业边界内',
        confidence: 1.0
      },
      unitConversion: { rawInput: `${itemVal} ${itemUnit}`, normalizedVal: normRes.val, multiplier: normRes.multiplier },
      candidates: [{ factorId: entHit.factorId, name: entHit.factorName, excluded: false, reason: '企业实测因子命中（' + entHit.lab + ' · 溯源凭证 ' + entHit.reportNo + '）' }],
      antiManipulation: { status: 'PASS', warning: null },
      decisionChain: '企业实测因子(凭证有效) → 直接绑定',
      timestamp: new Date().toLocaleString('zh-CN')
    }
  }

  // Step 0: 企业自学习记忆库检索 (P0 优先)
  const memHit = queryMappingMemory(itemName, taskRegion)
  if (memHit && !memHit.isExpired) {
    const normRes = normalizeQuantityAndUnit(itemVal, itemUnit, memHit.factorUnit.split('/')[1] || itemUnit)
    return {
      traceId: 'trace-mem-' + Date.now(),
      itemName,
      itemUnit,
      scenario: cfg.scenarioName,
      standard: cfg.standard,
      memoryHit: true,
      selected: {
        factorId: memHit.factorId,
        factorName: memHit.factorName,
        factorValue: memHit.factorValue,
        factorUnit: memHit.factorUnit,
        sourcePool: '企业映射自学习记忆库 (P0 优先命中)',
        confidence: 0.99
      },
      unitConversion: { rawInput: `${itemVal} ${itemUnit}`, normalizedVal: normRes.val, multiplier: normRes.multiplier },
      candidates: [{ factorId: memHit.factorId, name: memHit.factorName, excluded: false, reason: 'P0 级命中企业自学习纠偏记忆库（历史核准）' }],
      antiManipulation: { status: 'PASS', warning: null },
      decisionChain: '企业记忆(P0) → 直接绑定',
      timestamp: new Date().toLocaleString('zh-CN')
    }
  }

  // Step 1: 遍历可维护规则表，按 priority 顺序匹配物料特征
  let selected = null
  const candidates = []
  let confidence = 0.90
  let antiWarning = null

  const rules = loadMatchingRules().sort((a, b) => (a.priority || 99) - (b.priority || 99))
  const rule = rules.find(r => new RegExp(r.pattern).test(itemName))

  if (rule) {
    // 场景覆盖优先：特殊场景用不同因子（如电力按场景细分）
    const override = rule.scenarioOverrides ? rule.scenarioOverrides[scenarioKey] : null
    const f = override || rule
    // 地域细分：regionValues 命中则覆盖 factorValue
    const factorValue = (f.regionValues && f.regionValues[taskRegion]) || f.factorValue
    selected = {
      factorId: f.factorId,
      factorName: f.factorName,
      factorValue,
      factorUnit: f.factorUnit,
      dbName: f.dbName,
      sourcePool: f.sourcePool,
      tech: f.tech,
      geo: f.geo
    }
    confidence = f.confidence || 0.90
    candidates.push({ factorId: f.factorId, name: f.factorName, excluded: false, reason: '命中规则「' + rule.name + '」' + (override ? '（场景覆盖：' + cfg.scenarioName + '）' : '') })
    if (rule.excludedReason) {
      candidates.push({ factorId: '', name: rule.excludedReason, excluded: true, reason: '排除: ' + rule.excludedReason })
    }
  } else {
    // 兜底：无规则命中
    const fb = loadFallbackRule()
    selected = {
      factorId: fb.factorId,
      factorName: fb.factorName + '（' + itemName + '）',
      factorValue: fb.factorValue,
      factorUnit: fb.factorUnit,
      dbName: fb.dbName,
      sourcePool: fb.sourcePool,
      tech: fb.tech,
      geo: fb.geo
    }
    confidence = fb.confidence || 0.82
    candidates.push({ factorId: fb.factorId, name: fb.factorName, excluded: false, reason: '兜底: 行业基准与通用代表性' })
  }

  // Step 2: 量纲自适应归一
  const targetUnit = selected.factorUnit.split('/')[1] || itemUnit
  const normRes = normalizeQuantityAndUnit(itemVal, itemUnit, targetUnit)

  // Step 3: 反操纵审计
  if (parseFloat(selected.factorValue) < 0.5 && itemName.includes('电')) {
    antiWarning = '该因子处于同类候选极低值区间，系统已自动附注技术与地理抗辩理由'
  }

  // Step 4: 组装决策留痕 Trace
  return {
    traceId: 'trace-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    itemName,
    itemUnit,
    itemValue: itemVal,
    scenario: cfg.scenarioName,
    standard: cfg.standard,
    requiredBoundary: cfg.systemBoundary,
    requiredGas: cfg.gasType,
    unitConversion: {
      rawInput: `${itemVal} ${itemUnit}`,
      normalizedVal: normRes.val,
      converted: normRes.converted,
      multiplier: normRes.multiplier
    },
    candidates,
    selected: {
      factorId: selected.factorId,
      factorName: selected.factorName,
      factorValue: selected.factorValue,
      factorUnit: selected.factorUnit,
      dbName: selected.dbName,
      sourcePool: selected.sourcePool,
      confidence,
      isLowest: !!antiWarning
    },
    antiManipulation: {
      status: antiWarning ? 'WARNING' : 'PASS',
      warning: antiWarning
    },
    decisionChain: `场景路由(${cfg.scenarioName}) → S池(${selected.sourcePool}) → T技术(${selected.tech}) → G产地(${selected.geo})`,
    timestamp: new Date().toLocaleString('zh-CN')
  }
}

// ============================================================================
// 7. 保存用户纠偏并沉淀为企业映射记忆
// ============================================================================
export function saveUserFactorOverride(item, newFactor, region = '全国') {
  try {
    const raw = localStorage.getItem('cfp_factor_mapping_memory')
    const list = raw ? JSON.parse(raw) : []
    const existingIdx = list.findIndex(m => m.activityKeyword === item.name && (!m.region || m.region === region))
    const memoryEntry = {
      activityKeyword: item.name,
      techRoute: item.techRoute || '人工指定',
      region: region || '全国',
      factorId: newFactor.factorId || 'MANUAL-' + Date.now().toString().slice(-4),
      factorName: newFactor.name || newFactor.factorName,
      factorValue: newFactor.value || newFactor.factorValue,
      factorUnit: newFactor.factorUnit || newFactor.unit,
      dbName: newFactor.dbName || '企业核准库',
      hitCount: 1,
      updatedAt: new Date().toLocaleString('zh-CN')
    }
    if (existingIdx > -1) {
      list[existingIdx] = memoryEntry
    } else {
      list.unshift(memoryEntry)
    }
    localStorage.setItem('cfp_factor_mapping_memory', JSON.stringify(list))
    return true
  } catch (e) {
    return false
  }
}
