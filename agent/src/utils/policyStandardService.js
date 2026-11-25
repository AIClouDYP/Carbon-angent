import PARSED_STANDARDS from '@/data/parsedStandards.json'
import { getSkillConfigById } from '@/pages/zcip/agent-center/data/skillPrompts'
import { getEditableBoundaryTemplate, toRuntimeBoundaryTemplate } from '@/pages/zcip/agent-center/data/boundaryConfig'
/**
 * 政策标准库服务（R040201）
 * - 场景枚举与解析模板注册（STORY-004/STORY-012：本期 PCF/ZCF，其余场景注册扩充）
 * - 标准库存取（localStorage: carbon-library-standards，与 StandardsLibrary/StandardsDetail 同 key）
 * - 场景配置查询服务（STORY-009：API-004 的原型实现）
 * - 配置级差异对比（STORY-007：RULE-008）与更新预警数据（STORY-008：API-006）
 * - PCF 种子数据（STORY-010：产品碳足迹去硬编码的库内来源）
 */
const STORE_KEY = 'carbon-library-standards-v2'
const SEED_KEY = 'carbon-library-pcf-seed-version'
// 版本 2：新增智慧报告（REPORT）场景种子，并使已有缓存中的条目补齐 scope / scenarios / 参数化 structured
const SEED_VERSION = 16  // v16：生命周期范围交还用户确认；修正乘用车取舍阈值与标准缓存迁移

/** 一级场景枚举（与 R040102:STORY-001 场景路由 7 场景对齐，RULE-007；REPORT 为智慧报告场景扩充） */
export const SCENARIOS = [
  { key: 'PCF', label: '产品碳足迹' },
  { key: 'PEF', label: '产品环境足迹' },
  { key: 'ORG', label: '组织碳核算' },
  { key: 'BJ', label: '北京碳市场' },
  { key: 'PARK', label: '园区碳核算' },
  { key: 'ZCF', label: '零碳工厂' },
  { key: 'GF', label: '绿色工厂' },
  { key: 'REPORT', label: '智慧报告' }
]

/** 已注册解析模板的场景（STORY-012 扩充口：新场景在此注册） */
export const REGISTERED_TEMPLATES = ['PCF', 'ZCF']

/**
 * 场景默认边界模板（boundary-config Skill 的结构化产出约定）
 * - 仅作为「标准条款明确边界」之前的预填基准
 * - 标准 boundaryTemplate 存在对应值时，标准优先级更高
 * - 业务运行始终读取该 Skill 的场景模板，不依赖启停状态
 */
export function getBoundaryDefaults(scenarioKey) {
  if (!scenarioKey) return null
  const template = toRuntimeBoundaryTemplate(scenarioKey)
  if (!template) return null
  const skill = getSkillConfigById('boundary-config')
  return {
    template,
    sourceMeta: {
      skillId: 'boundary-config',
      skillName: (skill && skill.name) || '边界配置',
      scenarioKey,
      scenarioLabel: (getEditableBoundaryTemplate(scenarioKey) || {}).scenarioLabel || scenarioKey
    }
  }
}

/**
 * 智慧报告（REPORT）参数键字典（键 → 中文名）
 * 对齐口径规则四类参数：①指标名映射 ②范围规则 ③计算口径 ④粒度聚合
 * 结构沿用 P(key, value, clauseRefs) 范式，value 可为对象（承载结构化映射）或字符串（承载口径说明）
 */
export const REPORT_PARAM_LABELS = {
  indicatorMapping: '指标名称',
  scopeRule: '能源消费范围',
  calcRule: '折算方式',
  granularity: '报送周期'
}

/** PCF 参数键字典（键 → 中文名） */
export const PCF_PARAM_LABELS = {
  lifecycleScope: '生命周期范围', unitType: '量化单位类型', unitDetail: '单位详情',
  allocationRule: '分配规则', cutoffThreshold: '取舍阈值', cutoffItemThreshold: '单项取舍阈值',
  cutoffTotalThreshold: '累计取舍阈值', timeBoundary: '时间边界', allowedScopes: '可选生命周期范围',
  allowedUnitTypes: '可选单位类型', modelStages: '生命周期阶段', requiredInputs: '必填输入类型',
  requiredOutputs: '必填输出类型', dataRequiredFields: '数据必填字段', dqrDimensions: 'DQR维度',
  factorPriority: '因子优先级', completenessThreshold: '完整性阈值(%)', dqrScoreThreshold: 'DQR评分阈值',
  reportTemplate: '报告模板标识'
}

/* ==================== 存取 ==================== */
export function loadStandards() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) { return [] }
}
export function saveStandards(list) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)) } catch (e) { /* ignore */ }
}

/** 种子入库（STORY-010 前置：存量 PCF 标准完成参数化入库；v2 扩充智慧报告 REPORT 场景）
 *  - code 不存在 → 追加种子条目
 *  - code 存在但缺参数化 params → 将种子 structured（params/条款）与场景字段合并进既有条目（保留 desc 等既有字段）
 *  - 已处理过（有 params）→ 不动，避免覆盖用户编辑
 *  说明：REPORT_SEEDS 与 PCF_SEEDS 共用同一策略，故智慧报告的口径规则集可随 ensureSeed 自动入库，
 *        使消费方（智慧报告智能体）无需依赖用户是否打开过标准库管理页。
 */
export function ensureSeed() {
  let merged = 0
  try {
    const seeds = PCF_SEEDS.concat(REPORT_SEEDS, BJ_SEEDS, PARK_SEEDS, PEF_SEEDS, ORG_SEEDS)
    const prevVer = Number(localStorage.getItem(SEED_KEY) || 0)
    // 版本升级：**完全以种子重建**（种子为唯一数据源，保证页面数据与解析结果一致）
    if (prevVer < SEED_VERSION) {
      const rebuilt = seeds.map(seed => JSON.parse(JSON.stringify(seed)))
      saveStandards(rebuilt)
      localStorage.setItem(SEED_KEY, String(SEED_VERSION))
      return rebuilt.length
    }
    // 旧缓存兼容：生命周期范围不再由标准锁定；累计阈值必须来自标准原文
    const list = loadStandards()
    let migrated = false
    list.forEach(std => {
      const params = std.structured && std.structured.params
      if (!Array.isArray(params)) return
      const next = params.filter(p => p && p.key !== 'scopeFixedValue')
      const car = std.code === '乘用车生命周期碳排放核算技术规范'
      if (car) {
        const total = next.find(p => p && p.key === 'cutoffTotalThreshold')
        if (total && total.value === '1%') {
          const idx = next.indexOf(total)
          next.splice(idx, 1)
        }
        const summary = next.find(p => p && p.key === 'cutoffThreshold')
        if (summary) summary.value = '1%'
      }
      if (next.length !== params.length || car) {
        std.structured.params = next
        migrated = true
      }
    })
    if (migrated) saveStandards(list)
    // 版本一致：仅补齐缺失的种子条目（保留用户在详情页的编辑结果）
    const codes = new Set(list.map(s => s.code))
    seeds.forEach(seed => {
      if (!codes.has(seed.code)) {
        list.push(JSON.parse(JSON.stringify(seed)))
        merged++
      }
    })
    if (merged) saveStandards(list)
  } catch (e) { /* ignore */ }
  return merged
}

/* ==================== 场景配置查询（STORY-009 / API-004） ==================== */
/** 按场景查询已生效标准列表 */
export function queryStandardsByScenario(scenarioKind) {
  ensureSeed()
  return loadStandards().filter(s =>
    s.parseStatus === 'effective' &&
    (s.scenarios || []).includes(scenarioKind) &&
    s.structured && s.structured.scenarioKind === scenarioKind
  )
}

/** 按 code+场景查询生效配置段（未生效返回不可用原因，RULE-003/RULE-011/RULE-012） */
export function queryStandardConfig(code, scenarioKind) {
  const std = loadStandards().find(s => s.code === code && (s.scenarios || []).includes(scenarioKind))
  if (!std) return { available: false, reason: `标准 ${code} 不适用场景 ${scenarioKind}` }
  if (std.parseStatus !== 'effective') return { available: false, reason: `标准 ${code}（${std.version}）未通过审核生效` }
  if (!std.structured || std.structured.scenarioKind !== scenarioKind) return { available: false, reason: `标准 ${code} 无 ${scenarioKind} 配置段` }
  return {
    available: true, code: std.code, name: std.name, version: std.version,
    params: std.structured.params || [],
    clauses: std.structured.dimensions || [],
    // 指标 ↔ 数据源 ↔ 因子 ↔ 公式（可执行规则，供消费方按指标取值换算）
    mappings: std.structured.mappings || []
  }
}

/** 通用五阶段兜底（与 agentCoreMixin 的默认阶段保持一致） */
const DEFAULT_LIFECYCLE_STAGES = ['原材料获取阶段', '生产制造阶段', '运输分销阶段', '产品使用阶段', '报废回收阶段']

/** 阶段关键词 → 标准阶段名（用于从条款文本 / 参数中识别生命周期阶段） */
const STAGE_KEYWORDS = [
  { re: /原材料获取|原材料生产|原料获取|材料获取|资源开采/, name: '原材料获取阶段' },
  { re: /整车生产|生产制造|生产阶段|制造过程|加工制造/, name: '生产制造阶段' },
  { re: /运输|分销|物流|配送/, name: '运输分销阶段' },
  { re: /使用阶段|使用过程|使用与维护/, name: '产品使用阶段' },
  { re: /报废|回收|废弃|处置|再生/, name: '报废回收阶段' }
]

/** 从标准结构化内容中推导生命周期阶段（按显式参数 → 边界条款 → 参数/规则文本 → 通用兜底的顺序） */
export function deriveLifecycleStages(std) {
  const s = (std && std.structured) || {}
  const p = {}
  structuredParams(s).forEach(it => { p[it.key] = it.value })
  // ① 显式配置的阶段
  if (Array.isArray(p.modelStages) && p.modelStages.length) return p.modelStages
  if (Array.isArray(p.lifecyclePhases) && p.lifecyclePhases.length) return p.lifecyclePhases
  // ② 边界条款（structured.dimensions 中 key='boundary' 的要点文本）
  const boundaryDim = (s.dimensions || []).find(d => d && (d.key === 'boundary' || d.key === 'scope'))
  if (boundaryDim && Array.isArray(boundaryDim.points)) {
    const text = boundaryDim.points.map(pt => pt && pt.text).filter(Boolean).join('；')
    const hit = STAGE_KEYWORDS.filter(k => k.re.test(text))
    if (hit.length) return hit.map(k => k.name)
  }
  // ③ 参数 / 计算规则文本综合匹配
  const allText = []
  structuredParams(s).forEach(it => { if (it && it.definition) allText.push(it.definition) })
  ;(s.calcRules || []).forEach(it => { if (it && it.content) allText.push(it.content) })
  if (allText.length) {
    const joined = allText.join('；')
    const hit = STAGE_KEYWORDS.filter(k => k.re.test(joined))
    if (hit.length) return hit.map(k => k.name)
  }
  // ④ 通用兜底
  return DEFAULT_LIFECYCLE_STAGES.slice()
}

/** 从标准结构化内容中推导量化单位类型：显式 unitType 优先，其次有核算报告模板视为声明单位 */
export function deriveUnitType(std) {
  const s = (std && std.structured) || {}
  const p = {}
  structuredParams(s).forEach(it => { p[it.key] = it.value })
  if (p.unitType) return p.unitType
  if (p.unitDetail) return 'declaration'
  return 'declaration'
}

/** 兼容读取 structured 中的参数列表（不同解析产出可能命名为 params 或 parameters） */
function structuredParams(s) {
  return (s && (s.params || s.parameters)) || []
}

/** 产品可计算性初筛：仅保留能支撑产品建模计算的核算类标准
 *  - 必须为核算类（structured.kind === 'accounting'），剔除政策文件骨架等非核算标准
 *  - 生命周期阶段与量化单位类型：优先取参数配置；参数缺失时由 structured.dimensions / calcRules 推导，
 *    避免「解析完整但未参数化」的标准被误判为不可计算而整条从工作台消失
 */
function isProductComputable(std) {
  if (!std.structured || std.structured.kind !== 'accounting') return false
  const p = {}
  structuredParams(std.structured).forEach(it => { p[it.key] = it.value })
  const hasExplicitStages = Array.isArray(p.modelStages) && p.modelStages.length > 0
  const hasExplicitUnit = !!p.unitType
  if (hasExplicitStages && hasExplicitUnit) return true
  // 未参数化：要求至少有可用的结构化解析内容（条款维度或计算规则），并据此推导阶段与单位
  const hasStructuredBody = ((std.structured.dimensions || []).length > 0) || ((std.structured.calcRules || []).length > 0) || (structuredParams(std.structured).length > 0)
  return hasStructuredBody
}

/** 同编号去重：同 code 存在多版本时仅保留版本号最高的一条 */
function dedupeByCode(list) {
  const verNum = v => Number(String(v || 'V0').replace(/\D/g, '') || 0)
  const map = {}
  list.forEach(s => {
    const prev = map[s.code]
    if (!prev || verNum(s.version) > verNum(prev.version)) map[s.code] = s
  })
  return Object.keys(map).map(k => map[k])
}

/** 产品碳足迹专用：拉取 PCF 场景已生效标准并转换为工作台消费形状（STORY-010，RULE-013）
 *  - 初步过滤：剔除不涉及产品计算的标准（isProductComputable）
 *  - 重复校验：同编号多版本仅保留最新（dedupeByCode）
 */
export function loadPcfStandardsForAgent() {
  ensureSeed()
  const CAR_STD = '乘用车生命周期碳排放核算技术规范'
  const list = dedupeByCode(queryStandardsByScenario('PCF').filter(isProductComputable))
  // 排序：乘用车核算技术规范优先（汽车类任务默认标准），其余保持原序
  list.sort((a, b) => {
    if (a.code === CAR_STD) return -1
    if (b.code === CAR_STD) return 1
    return 0
  })
  return list.map(toStandardConfig)
}

/** PEF 专属标准集（欧盟 PEF 方法论 + LCA 通用标准），与 PCF 标准合并供产品环境足迹工作台使用 */
// 兜底：仅当标准库异常（无 PEF 条目）时保证流程可用
const PEF_ONLY_STANDARDS = [
  { code: 'EU PEF 2021/2279', year: '2021', name: '欧盟产品环境足迹方法论（PEF Guide）', version: 'V1' }
]

/** PEF 适用标准白名单：仅保留 LCA 框架 / 多类别足迹 / 环境声明 / 水足迹类标准
 *  过滤掉行业专用（QC/T）、已废止（PAS 2050）、申报规则（CBAM）等与 PEF 核算方法无关的条目 */
const PEF_STANDARD_KEYWORDS = ['EU PEF', '14040', '14044', '14067']

function buildPefParams() {
  const stages = ['原材料获取阶段', '生产制造阶段', '运输分销阶段', '产品使用阶段', '报废回收阶段']
  return [
    { key: 'lifecycleScope', value: 'cradle-to-grave' },
    { key: 'unitType', value: 'declaration' },
    { key: 'unitDetail', value: '由企业按具体产品确定（声明单位 / 功能单位）' },
    { key: 'allocationRule', value: 'mass' },
    { key: 'cutoffThreshold', value: '1%/5%' },
    { key: 'cutoffItemThreshold', value: '1%' },
    { key: 'cutoffTotalThreshold', value: '5%' },
    { key: 'timeBoundary', value: '覆盖产品实际生产周期（通常为最近一个完整年度），并满足数据时间代表性要求' },
    { key: 'allowedScopes', value: ['cradle-to-grave', 'cradle-to-gate', 'gate-to-gate'] },
    { key: 'allowedUnitTypes', value: ['declaration', 'functional'] },
    { key: 'modelStages', value: stages },
    { key: 'requiredInputs', value: ['raw_material', 'energy', 'transport'] },
    { key: 'requiredOutputs', value: ['product', 'emission'] },
    { key: 'dataRequiredFields', value: ['name', 'amount', 'unit', 'source'] },
    { key: 'dqrDimensions', value: ['技术代表性', '地理代表性', '时间代表性', '数据质量'] },
    { key: 'factorPriority', value: ['企业实测因子', '行业数据库', '国家因子库', '国际数据库'] },
    { key: 'completenessThreshold', value: 95 },
    { key: 'dqrScoreThreshold', value: 3 },
    { key: 'reportTemplate', value: 'PEF-DECLARATION' }
  ]
}

/** 产品环境足迹专用：PEF 专属标准 + PCF 可计算标准合并（PEF 置前） */
/**
 * 组织碳核算（ORG）专属标准集
 * 含 GHG Protocol 与 ISO 14064-1（暂不含国内标准）
 */
/** 组织碳核算仅启用的主标准（暂不含国内标准） */
const ORG_ALLOWED_CODES = ['GHG Protocol', 'ISO 14064-1:2018']

/** 北京碳市场：DB11/T 1787 等地标（核算口径） */
export function loadBjStandardsForAgent() {
  ensureSeed()
  const prefer = ['DB11/T 1787-2020', 'DB11/T 1784-2020', 'DB11/T 1781-2020']
  const list = queryStandardsByScenario('BJ')
  const ordered = prefer
    .map(code => list.find(s => s.code === code))
    .filter(Boolean)
  const rest = list.filter(s => prefer.indexOf(s.code) === -1)
  return dedupeByCode(ordered.concat(rest)).map(toStandardConfig)
}

export function loadParkStandardsForAgent() {
  ensureSeed()
  // 园区碳核算：只返回标注适用 PARK 场景的标准
  // 首选《零碳园区碳排放核算方法（试行）》（附件4）
  const prefer = ['零碳园区碳排放核算方法（试行）']
  const list = loadStandards().filter(x => {
    const sc = x.scenarios || []
    return sc.indexOf('PARK') > -1 || String(x.code || '').indexOf('零碳园区') > -1
  })
  const ordered = prefer
    .map(code => list.find(s => s.code === code))
    .filter(Boolean)
  const rest = list.filter(s => prefer.indexOf(s.code) === -1)
  return dedupeByCode(ordered.concat(rest)).map(toStandardConfig)
}

export function loadOrgStandardsForAgent() {
  ensureSeed()
  const list = queryStandardsByScenario('ORG').filter(s => ORG_ALLOWED_CODES.indexOf(s.code) > -1)
  // 按白名单顺序返回（GHG Protocol 优先）
  const ordered = ORG_ALLOWED_CODES
    .map(code => list.find(s => s.code === code))
    .filter(Boolean)
  return dedupeByCode(ordered).map(toStandardConfig)
}

export function loadPefStandardsForAgent() {
  ensureSeed()
  // 只取标准库中标注适用 PEF 场景、且可支撑产品计算的条目（与政策标准库同源）
  // 注：跨场景引用的标准（如 ISO 14067 同时适用 PCF/PEF）其 structured.scenarioKind 可能为 PCF，
  //     故此处按 scenarios 判定，不强制 scenarioKind 一致
  const rank = (code) => {
    const c = String(code || '')
    if (c.indexOf('EU PEF') > -1) return 0            // 主方法论
    if (c.indexOf('14040') > -1 || c.indexOf('14044') > -1) return 1  // LCA 框架
    return 2                                          // 类别方法（如 ISO 14067）
  }
  const fromLib = loadStandards()
    .filter(x => x.parseStatus === 'effective' && (x.scenarios || []).indexOf('PEF') > -1)
    .filter(isProductComputable)
    .map(toStandardConfig)
    .map(cfg => {
      // 标准条款与产品解耦：标准中的单位定义应为通用要求，不应绑定具体产品
      const bt = cfg.boundaryTemplate
      if (bt && /风电机组|汽车|叶片|塔筒/.test(String(bt.unitDetail || ''))) {
        bt.unitDetail = '由企业按具体产品确定（声明单位 / 功能单位）'
      }
      // 时间边界应为要求性表述，不写死具体年份
      if (bt && /^\d{4}-\d{2}-\d{2}/.test(String(bt.timeBoundary || ''))) {
        bt.timeBoundary = '覆盖产品实际生产周期（通常为最近一个完整年度），并满足数据时间代表性要求'
      }
      return cfg
    })
    .sort((a, b) => rank(a.code) - rank(b.code))
  if (fromLib.length) return fromLib
  // 兜底：标准库异常时保证流程可用
  return PEF_ONLY_STANDARDS.map(m => toStandardConfig({
    code: m.code, name: m.name, version: m.version,
    structured: { kind: 'accounting', scenarioKind: 'PEF', params: buildPefParams() }
  }))
}

/** 参数集 → 产品碳足迹工作台标准形状（与原硬编码完全同形，保证九阶段流程兼容） */
export function toStandardConfig(std) {
  const p = {}
  structuredParams(std.structured).forEach(it => { p[it.key] = it.value })
  // 生命周期阶段 / 单位类型：参数缺失时从结构化解析内容推导（保证解析完整但未参数化的标准可用）
  const stages = (Array.isArray(p.modelStages) && p.modelStages.length) ? p.modelStages : deriveLifecycleStages(std)
  const unitType = p.unitType || deriveUnitType(std)
  const cfg = {
    code: std.code, name: std.name, active: false, version: std.version,
    scope: std.scope || '', scopeExcluded: std.scopeExcluded || '', type: std.type || '', issuer: std.issuer || '',
    boundaryTemplate: {
      lifecycleScope: p.lifecycleScope, unitType: unitType, unitDetail: p.unitDetail,
      allocationRule: p.allocationRule, cutoffThreshold: p.cutoffThreshold,
      cutoffItemThreshold: p.cutoffItemThreshold, cutoffTotalThreshold: p.cutoffTotalThreshold,
      timeBoundary: p.timeBoundary,
      allowedScopes: p.allowedScopes || [], allowedUnitTypes: p.allowedUnitTypes || []
    },
    modelConfig: {
      stages: stages, requiredInputs: p.requiredInputs || [], requiredOutputs: p.requiredOutputs || []
    },
    dataSchema: { requiredFields: p.dataRequiredFields || [], dqrDimensions: p.dqrDimensions || [] },
    factorPriority: p.factorPriority || [],
    validationRules: {
      completenessThreshold: p.completenessThreshold, consistencyCheck: true, dqrScoreThreshold: p.dqrScoreThreshold
    },
    reportTemplate: p.reportTemplate
  }
  if (p.cnCode !== undefined) Object.assign(cfg.boundaryTemplate, { cnCode: p.cnCode, productionCountry: p.productionCountry, electricityFactor: p.electricityFactor })
  if (p.precursorMaterials) cfg.modelConfig.precursorMaterials = p.precursorMaterials
  if (p.requireActualData) cfg.validationRules.requireActualData = true
  // 组织碳核算（ORG）通用字段：范围规则 / 分类方式 / 计算方法 / 粒度 / 数据质量
  cfg.scopeRule = p.scopeRule || null
  // 温室气体种类 / 碳排放源 / 排除源（乘用车等技术规范类标准）
  cfg.ghgGases = p.ghgGases || []
  cfg.dataQuality = p.dataQuality || []
  cfg.completenessRule = p.completenessRule || ''
  cfg.emissionSources = p.emissionSources || []
  cfg.excludedSources = p.excludedSources || []
  cfg.materialCategories = p.materialCategories || []
  cfg.stagesFixed = p.stagesFixed === true
  cfg.scopeFixedValue = ''
  cfg.keyComponents = p.keyComponents || []
  cfg.indicatorMapping = p.indicatorMapping || null
  cfg.calcRule = p.calcRule || null
  cfg.granularity = p.granularity || null
  cfg.dataQuality = p.dataQuality || null
  // mappings 兼容两种来源：structured.mappings 或 params 里的 key='mappings'
  cfg.mappings = (std.structured && std.structured.mappings) || p.mappings || []
  cfg.dimensions = (std.structured && std.structured.dimensions) || []
  // 解析成果原样透出：公式 / 参数 / 报告模板（工作台阶段1 与标准库详情保持一致）
  cfg.formulas = (std.structured && std.structured.formulas) || []
  cfg.parameters = structuredParams(std.structured)
  cfg.reportTemplateDetail = (std.structured && std.structured.reportTemplate) || null
  // 园区（PARK）专用字段
  cfg.applicability = p.applicability || null
  cfg.indicatorSystem = p.indicatorSystem || null
  cfg.specialRule = p.specialRule || null
  // 汇总依据条款
  const _refs = []
  structuredParams(std.structured).forEach(it => {
    (it.clauseRefs || []).forEach(r => { if (_refs.indexOf(r) === -1) _refs.push(r) })
  })
  // 条款维度中携带的 clauseRefs 一并汇总（未参数化标准同样可溯源到条款）
  ;((std.structured && std.structured.dimensions) || []).forEach(dim => {
    ;((dim && dim.points) || []).forEach(pt => {
      (pt.clauseRefs || []).forEach(r => { if (_refs.indexOf(r) === -1) _refs.push(r) })
    })
  })
  cfg.clauseRefs = _refs
  return cfg
}

/* ==================== 配置级差异对比（STORY-007 / RULE-008） ==================== */
/** 参数键粒度对比：新增/删除/值变更 */
export function diffStructured(oldStd, newStd) {
  const op = {}, np = {}
  ;((oldStd.structured && oldStd.structured.params) || []).forEach(it => { op[it.key] = it.value })
  ;((newStd.structured && newStd.structured.params) || []).forEach(it => { np[it.key] = it.value })
  const labels = PCF_PARAM_LABELS
  const diffs = []
  Object.keys(np).forEach(k => {
    if (!(k in op)) diffs.push({ type: 'added', key: k, label: labels[k] || k, oldValue: '', newValue: JSON.stringify(np[k]) })
    else if (JSON.stringify(op[k]) !== JSON.stringify(np[k])) diffs.push({ type: 'changed', key: k, label: labels[k] || k, oldValue: JSON.stringify(op[k]), newValue: JSON.stringify(np[k]) })
  })
  Object.keys(op).forEach(k => {
    if (!(k in np)) diffs.push({ type: 'removed', key: k, label: labels[k] || k, oldValue: JSON.stringify(op[k]), newValue: '' })
  })
  return diffs
}

/** 审核通过时记录差异（找同 code 上一生效版本对比，写入新版本 structured.diffs） */
export function recordDiffOnApprove(std) {
  try {
    const list = loadStandards()
    const prev = list.filter(s => s.code === std.code && s.parseStatus === 'effective' && s.version !== std.version)
      .sort((a, b) => Number(String(b.version || 'V0').replace(/\D/g, '') || 0) - Number(String(a.version || 'V0').replace(/\D/g, '') || 0))[0]
    std.structured.diffs = prev ? diffStructured(prev, std) : []
    return std.structured.diffs
  } catch (e) { return [] }
}

/** 更新预警数据（STORY-008 / API-006）：存在更高生效版本的历史版本清单 */
export function getUpdateWarnings() {
  const list = loadStandards()
  const byCode = {}
  list.forEach(s => { (byCode[s.code] = byCode[s.code] || []).push(s) })
  const warnings = []
  Object.keys(byCode).forEach(code => {
    const versions = byCode[code]
    const effective = versions.filter(s => s.parseStatus === 'effective')
    if (effective.length < 1) return
    const current = effective[effective.length - 1]
    const outdated = versions.filter(s => s.version !== current.version)
    if (outdated.length) {
      warnings.push({ code, name: current.name, currentVersion: current.version, outdatedVersions: outdated.map(s => s.version) })
    }
  })
  return warnings
}

/** RULE-005 校验：每条参数必挂条款溯源 */
export function validateParams(structured) {
  const missing = (structured.params || []).filter(it => !it.clauseRefs || !it.clauseRefs.length)
  return { ok: missing.length === 0, missingKeys: missing.map(it => it.key) }
}

/** RULE-014 校验：申报指标权重合计 100%（填写了权重才校验） */
export function validateIndicatorsWeight(indicators) {
  const ws = (indicators || []).map(i => Number(i.weight)).filter(w => !isNaN(w) && w !== null && w !== undefined && String(i.weight).trim() !== '')
  if (!ws.length) return { ok: true, total: null }
  const total = ws.reduce((a, b) => a + b, 0)
  return { ok: Math.abs(total - 100) < 0.001, total }
}

/* ==================== 智慧报告（REPORT）种子数据 ==================== */
/**
 * 智慧报告场景的标准 / 规则种子（与 StandardsLibrary 的 EXTRA_STANDARDS 同源，此处为唯一数据源）。
 * 设计要点：口径规则本体置于标准库（而非报告模板），模板仅通过 caliber.standardCode 引用——
 * 同一规则集可被多个模板复用，政策变更时升版即生效，在途任务按创建时快照执行不受影响。
 */
/** 北京碳市场 7 项地方标准（DB11/T 1781~1787-2020，2020-12-24 发布 / 2021-01-01 实施） */
/** 组织碳核算（ORG）标准种子：GHG Protocol / ISO 14064-1（暂不含国内标准） */
export const ORG_SEEDS = []

export const BJ_SEEDS = []

/** 零碳园区 1 项核算依据（附件4《零碳园区碳排放核算方法（试行）》） */
export const PARK_SEEDS = []

export const REPORT_SEEDS = []

/* ==================== PCF 种子数据（5 条，参数化 + 条款溯源） ==================== */
const D = (dim, points) => ({ key: dim, label: { boundary: '核算边界', model: '核算模型', data: '数据要求', factor: '因子优先级', validation: '校验规则', report: '报告要求' }[dim] || dim, points })
const P = (key, value, clauseRefs) => ({ key, value, clauseRefs })

const PEF_SEEDS = []

const PCF_SEEDS = PARSED_STANDARDS

/** 申报政策（ZCF）骨架：指标体系含权重/星级/必选项（STORY-004/STORY-011） */
export function makePolicySkeleton() {
  return {
    kind: 'policy', scenarioKind: 'ZCF',
    applyConditions: ['（待人工核对）申报资格条件'],
    indicators: [{ name: '（待人工核对）', basic: '—', target: '—', caliber: '—', weight: '', starRule: '', required: '必选项' }],
    materialRequirements: ['（待人工核对）证明材料清单'],
    mappings: [{ indicator: '—', dataSource: '—', factorCategory: '—', formula: '—' }],
    params: [], diffs: []
  }
}

/** 核算标准（PCF）空骨架：参数待解析填充（STORY-004） */
export function makePcfSkeleton() {
  return {
    kind: 'accounting', scenarioKind: 'PCF',
    params: Object.keys(PCF_PARAM_LABELS).map(k => ({ key: k, value: '', clauseRefs: [] })),
    diffs: [],
    dimensions: [
      D('boundary', ['（待人工核对）生命周期边界条款']),
      D('model', ['（待人工核对）建模方法要求']),
      D('data', ['（待人工核对）初级/次级数据规则']),
      D('factor', ['（待人工核对）因子选取优先序']),
      D('validation', ['（待人工核对）数据质量校验规则']),
      D('report', ['（待人工核对）报告披露要求'])
    ]
  }
}

/** 通用核算骨架（非PCF场景，保持条款文本形态，参数化待该场景模板注册） */
export function makeGenericAccountingSkeleton() {
  return {
    kind: 'accounting', scenarioKind: null,
    params: [], diffs: [],
    dimensions: [
      D('boundary', ['（待人工核对）生命周期边界条款']),
      D('model', ['（待人工核对）建模方法要求']),
      D('data', ['（待人工核对）初级/次级数据规则']),
      D('factor', ['（待人工核对）因子选取优先序']),
      D('validation', ['（待人工核对）数据质量校验规则']),
      D('report', ['（待人工核对）报告披露要求'])
    ]
  }
}
