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
const SEED_VERSION = 12

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
    const list = loadStandards()
    const seeds = PCF_SEEDS.concat(REPORT_SEEDS, BJ_SEEDS, PARK_SEEDS, PEF_SEEDS, ORG_SEEDS)
    const codes = new Set(list.map(s => s.code))
    const missing = seeds.filter(seed => !codes.has(seed.code))
    // 快路径：版本已处理过 **且** 种子条目齐备 **且** 不存在空参数条目才跳过
    // （空参数条目会被种子刷新，避免缓存残留导致标准解析无内容）
    const hasEmptyParams = seeds.some(seed => {
      const idx = list.findIndex(s => s.code === seed.code)
      return idx > -1 && (!(list[idx].structured && list[idx].structured.params && list[idx].structured.params.length))
        && (seed.structured && seed.structured.params && seed.structured.params.length)
    })
    if (Number(localStorage.getItem(SEED_KEY) || 0) >= SEED_VERSION && !missing.length && !hasEmptyParams) return 0
    seeds.forEach(seed => {
      const idx = list.findIndex(s => s.code === seed.code)
      if (idx === -1) {
        list.push(JSON.parse(JSON.stringify(seed)))
        merged++
      } else if (!(list[idx].structured && list[idx].structured.params && list[idx].structured.params.length)) {
        // 种子条目已非空（如 BJ 种子补全了参数化内容）时，用种子刷新空参数条目
        const keep = list[idx]
        list[idx] = Object.assign({}, keep, {
          scope: seed.scope || keep.scope,
          scenarios: seed.scenarios,
          issuer: keep.issuer || seed.issuer,
          yearNum: keep.yearNum || seed.yearNum,
          version: keep.version || seed.version,
          parseStatus: 'effective',
          structured: JSON.parse(JSON.stringify(seed.structured))
        })
        merged++
      }
    })
    if (list.length) saveStandards(list)
    localStorage.setItem(SEED_KEY, String(SEED_VERSION))
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

/** 产品可计算性初筛：仅保留能支撑产品建模计算的核算类标准
 *  - 必须为核算类（structured.kind === 'accounting'），剔除政策文件骨架等非核算标准
 *  - 必须含生命周期阶段（modelStages 非空）与量化单位类型（unitType），剔除未完成参数化、不涉及产品计算的标准
 */
function isProductComputable(std) {
  if (!std.structured || std.structured.kind !== 'accounting') return false
  const p = {}
  ;(std.structured.params || []).forEach(it => { p[it.key] = it.value })
  return Array.isArray(p.modelStages) && p.modelStages.length > 0 && !!p.unitType
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
  ;(std.structured && std.structured.params || []).forEach(it => { p[it.key] = it.value })
  const cfg = {
    code: std.code, name: std.name, active: false, version: std.version,
    scope: std.scope || '', scopeExcluded: std.scopeExcluded || '', type: std.type || '', issuer: std.issuer || '',
    boundaryTemplate: {
      lifecycleScope: p.lifecycleScope, unitType: p.unitType, unitDetail: p.unitDetail,
      allocationRule: p.allocationRule, cutoffThreshold: p.cutoffThreshold,
      cutoffItemThreshold: p.cutoffItemThreshold, cutoffTotalThreshold: p.cutoffTotalThreshold,
      timeBoundary: p.timeBoundary,
      allowedScopes: p.allowedScopes || [], allowedUnitTypes: p.allowedUnitTypes || []
    },
    modelConfig: {
      stages: p.modelStages || [], requiredInputs: p.requiredInputs || [], requiredOutputs: p.requiredOutputs || []
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
  cfg.scopeFixedValue = p.scopeFixedValue || ''
  cfg.keyComponents = p.keyComponents || []
  cfg.indicatorMapping = p.indicatorMapping || null
  cfg.calcRule = p.calcRule || null
  cfg.granularity = p.granularity || null
  cfg.dataQuality = p.dataQuality || null
  cfg.mappings = (std.structured && std.structured.mappings) || []
  cfg.dimensions = (std.structured && std.structured.dimensions) || []
  // 汇总依据条款
  const _refs = []
  ;(std.structured && std.structured.params || []).forEach(it => {
    (it.clauseRefs || []).forEach(r => { if (_refs.indexOf(r) === -1) _refs.push(r) })
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
export const ORG_SEEDS = [
    {
    code: 'ISO 14064-1:2018', name: '温室气体 第1部分：组织层级温室气体排放与清除量化及报告规范', type: '国际标准',
    scope: '组织级', scenarios: ['ORG'], issuer: '国际标准化组织（ISO）', year: '2018',
    status: '现行', parseStatus: 'effective',
    desc: '组织层级温室气体量化与报告的国际标准：按类别1~6划分排放（直接排放、输入能源间接、运输间接、组织使用产品间接、与使用产品相关、其他间接），要求建立基准年与减排量核算。',
    structured: {
      kind: 'accounting', scenarioKind: 'ORG',
      params: [
        { key: 'indicatorMapping', value: { mode: 'categoryBased', note: '按类别1~6组织排放与清除' }, clauseRefs: ['ISO 14064-1 第5章：边界'] },
        { key: 'scopeRule', value: { boundary: '组织边界（运营控制权 / 财务控制权 / 股权比例）', scope: '类别1 直接排放 + 类别2 输入能源间接 + 类别3~6 其他间接' }, clauseRefs: ['ISO 14064-1 第5.1条：组织边界'] },
        { key: 'calcRule', value: { method: '排放因子法 / 质量平衡法', formula: 'GHG = Σ(AD × EF × GWP)' }, clauseRefs: ['ISO 14064-1 第6章：量化'] },
        { key: 'granularity', value: { time: '年度（含基准年）', space: '设施级汇总至组织级' }, clauseRefs: ['ISO 14064-1 第6.4条：数据时间边界'] },
        { key: 'dataQuality', value: { uncertainty: true, traceLevel: 3 }, clauseRefs: ['ISO 14064-1 第9章：不确定性与数据质量'] }
      ],
      mappings: [
        { indicator: '类别1 直接排放', dataSource: '设施燃料 / 工艺 / 逸散台账', factorCategory: '燃料 / 过程 / GWP', formula: 'Σ(活动数据 × 排放因子 × GWP)' },
        { indicator: '类别2 输入能源间接排放', dataSource: '外购电 / 热 / 蒸汽结算单', factorCategory: '电网 / 热力因子', formula: '购入能源量 × 排放因子' },
        { indicator: '类别3~6 其他间接排放', dataSource: '运输 / 采购 / 产品使用记录', factorCategory: '供应链因子', formula: '按类别分别量化' }
      ],
      dimensions: [
        { key: 'caliber', label: '口径要求', points: ['明确组织边界方法', '按类别1~6披露', '建立并说明基准年', '量化不确定性'] }
      ]
    }
  },
  {
    code: 'GHG Protocol', name: '温室气体核算体系：企业核算与报告标准（修订版）', type: '国际标准',
    scope: '组织级', scenarios: ['ORG'], issuer: 'WRI / WBCSD', year: '2004',
    status: '现行', parseStatus: 'effective',
    desc: '企业温室气体核算与报告的国际通用框架：按范围1（直接排放）、范围2（外购电力/热力间接）、范围3（价值链其他间接）划分，规定组织边界设定、基准年与排放清单管理。',
    structured: {
      kind: 'accounting', scenarioKind: 'ORG',
      params: [
        { key: 'indicatorMapping', value: { mode: 'scopeBased', note: '按范围1 / 范围2 / 范围3 组织排放清单' }, clauseRefs: ['GHG Protocol 第4章：设定组织边界'] },
        { key: 'scopeRule', value: { boundary: '运营控制权 / 财务控制权 / 股权比例', scope: '范围1 + 范围2 + 范围3（15 类价值链排放可选）' }, clauseRefs: ['GHG Protocol 第3章：核算范围'] },
        { key: 'calcRule', value: { method: '排放因子法', formula: '排放量 = 活动数据 × 排放因子' }, clauseRefs: ['GHG Protocol 第5章：计算排放量'] },
        { key: 'granularity', value: { time: '年度（含基准年重算政策）', space: '设施 → 公司级' }, clauseRefs: ['GHG Protocol 第5章：基准年'] },
        { key: 'dataQuality', value: { requireVoucher: true, traceLevel: 3 }, clauseRefs: ['GHG Protocol 第7章：数据管理'] }
      ],
      mappings: [
        { indicator: '范围1 直接排放', dataSource: '自有设施燃料 / 工艺 / 车辆台账', factorCategory: '燃料 / 过程因子', formula: 'Σ(活动数据 × 排放因子)' },
        { indicator: '范围2 间接排放', dataSource: '外购电 / 热 / 蒸汽', factorCategory: '电网 / 热力因子', formula: '购入量 × 排放因子（可选市场法 / 地区法）' },
        { indicator: '范围3 价值链排放', dataSource: '供应链 / 物流 / 差旅 / 废弃物记录', factorCategory: '供应链因子', formula: '按 15 类分别量化' }
      ],
      dimensions: [
        { key: 'caliber', label: '口径要求', points: ['明确组织边界方法', '范围1/2/3 分别披露', '设定基准年与重算政策', '范围2 可选市场法'] }
      ]
    }
  }
]

export const BJ_SEEDS = [
  ['DB11/T 1781-2020', '二氧化碳排放核算和报告要求 电力生产业'],
  ['DB11/T 1782-2020', '二氧化碳排放核算和报告要求 水泥制造业'],
  ['DB11/T 1783-2020', '二氧化碳排放核算和报告要求 石油化工生产业'],
  ['DB11/T 1784-2020', '二氧化碳排放核算和报告要求 热力生产和供应业'],
  ['DB11/T 1785-2020', '二氧化碳排放核算和报告要求 服务业'],
  ['DB11/T 1786-2020', '二氧化碳排放核算和报告要求 道路运输业'],
  ['DB11/T 1787-2020', '二氧化碳排放核算和报告要求 其他行业']
].map(([code, name]) => ({
  code: code,
  name: name,
  type: '地方标准',
  scenarios: ['BJ'],
  scope: '组织级',
  issuer: '北京市市场监督管理局',
  yearNum: 2020,
  version: 'V1',
  status: '现行',
  parseStatus: 'effective',
  sourceFile: '种子数据',
  structured: code === 'DB11/T 1787-2020' ? {
    kind: 'accounting',
    scenarioKind: 'BJ',
    params: [
      { key: 'indicatorMapping', value: { mode: 'scopeBased', note: '按化石燃料燃烧排放、工业生产过程排放、外购电力热力隐含排放组织清单（以二氧化碳为主）' }, clauseRefs: ['DB11/T 1787 第4章'] },
      { key: 'scopeRule', value: { boundary: '法人边界（运营控制权法）', scope: '化石燃料燃烧排放 + 工业生产过程排放 + 外购电力、热力隐含排放' }, clauseRefs: ['DB11/T 1787 第4.1节'] },
      { key: 'calcRule', value: { method: '排放因子法', formula: '排放量 = 活动数据 × 低位发热量 × 单位热值含碳量 × 碳氧化率 × 44/12（外购电力热力：购入量 × 隐含排放因子）' }, clauseRefs: ['DB11/T 1787 第5章'] },
      { key: 'granularity', value: { time: '年度', space: '设施 → 企业级' }, clauseRefs: ['DB11/T 1787 第6章'] },
      { key: 'dataQuality', value: { requireVoucher: true, traceLevel: 3 }, clauseRefs: ['DB11/T 1787 第7章：数据质量管理'] }
    ],
    mappings: [
      { indicator: '化石燃料燃烧排放', dataSource: '天然气/燃煤结算凭证与能源台账', factorCategory: '低位发热量 × 单位热值含碳量 × 碳氧化率', formula: 'Σ(燃料量 × 低位发热量 × 含碳量 × 氧化率 × 44/12)' },
      { indicator: '外购电力隐含排放', dataSource: '电量结算单', factorCategory: '区域电网排放因子', formula: '购入电量 × 电网排放因子' },
      { indicator: '外购热力隐含排放', dataSource: '热量结算单', factorCategory: '热力排放因子', formula: '购入热量 × 热力排放因子' }
    ],
    dimensions: [
      { key: 'caliber', label: '口径要求', points: ['法人边界（运营控制权法）', '二氧化碳为主', '按年度核算', '数据凭证留存备查'] }
    ]
  } : {
    kind: 'accounting',
    scenarioKind: 'BJ',
    params: []
  }
}))

/** 零碳园区 1 项核算依据（附件4《零碳园区碳排放核算方法（试行）》） */
export const PARK_SEEDS = [
  {
    code: '零碳园区碳排放核算方法（试行）',
    year: '2025', name: '零碳园区碳排放核算方法（试行）',
    type: '规范性文件',
    scenarios: ['PARK'],
    scope: '园区级',
    issuer: '国家发展改革委等（零碳园区建设通知附件4）',
    yearNum: 2025,
    version: 'V1',
    status: '现行',
    parseStatus: 'effective',
    sourceFile: '种子数据',
    structured: {
      kind: 'accounting',
      scenarioKind: 'PARK',
      accountingFormula: 'E_园区 = E_能源活动 + E_工业过程（仅二氧化碳，单位万吨）',
      indicatorSystemName: '国家级零碳园区建设指标体系（试行）',
      thresholdRule: { small: 0.20, large: 0.25, scaleField: '年综合能源消费量' },
      indicators: [
        { key: 'carbonPerTce', name: '单位能耗碳排放', type: 'core', target: 0.20, unit: 'tCO₂/tce', op: '≤', desc: '园区二氧化碳排放总量与年综合能源消费量的比值（零碳园区验收门槛硬指标，分档见 thresholdRule）' },
        { key: 'cleanEnergyRatio', name: '清洁能源消费比重', type: 'guided', target: 90.0, unit: '%', op: '≥', desc: '非化石能源（含分布式光伏自用与采购绿电）折标消费量占园区能源消费总量的比重' },
        { key: 'productEnergyLimitRatio', name: '产品能效达标比例', type: 'guided', target: 90.0, unit: '%', op: '≥', desc: '园区企业主要工业产品单位能耗优于强制性能效限额标准二级标准的比例' },
        { key: 'solidWasteRatio', name: '工业固废综合利用率', type: 'guided', target: 80.0, unit: '%', op: '≥', desc: '一般工业固废综合利用量占产生总量的比例' },
        { key: 'wasteHeatUtilRatio', name: '工业余能利用率', type: 'guided', target: 50.0, unit: '%', op: '≥', desc: '余热、余冷、余压等余能资源回收利用比例（无余能产生可申请豁免）' },
        { key: 'waterRecycleRatio', name: '中水回用率', type: 'guided', target: 80.0, unit: '%', op: '≥', desc: '园区再生水（中水）利用量占具备回用条件总用水量的比例（无中水管网可申请豁免）' }
      ],
      params: []
    }
  }
]

export const REPORT_SEEDS = [
  {
    code: '附件2', name: '用能单位能源利用状况报告格式（附件2）', type: '政策文件',
    scope: '智慧报告', scenarios: ['REPORT'], issuer: '国家发展改革委', year: '2025',
    status: '现行', parseStatus: 'effective',
    desc: '重点用能单位能源利用状况报告的官方编制要求与报表格式，按填报领域分表：工业（表1~8）、交通运输仓储邮政（表9~13）、住宿餐饮（表14~16）、批发零售（表17~19）、教育（表20~22）、其他非工业（表23~25），各领域通用表26 碳排放、表27 新能源及可再生能源、表28 节能工作落实情况自查表。',
    structured: {
      kind: 'accounting', scenarioKind: 'REPORT',
      // 口径规则四类参数（参数化配置）：供智慧报告按目标部门加载并生成多口径适配副本
      // 条款引用已对照真实《用能单位能源利用状况报告格式》（99输出材料/08报告提报/附件2 docx）核校
      params: [
        { key: 'indicatorMapping', value: '指标名称按各表规定填写', clauseRefs: ['附件2 填报目录：指标名称按各表规定填写'] },
        { key: 'scopeRule', value: { boundary: '法人边界', scope: '全口径能源消费（工业生产 + 非工业生产 + 运输工具消费）' }, clauseRefs: ['附件2 编制说明 4~6：工业生产消费 / 非工业生产消费 / 运输工具消费定义'] },
        { key: 'calcRule', value: { method: '当量值折标', standard: 'GB/T 2589' }, clauseRefs: ['附件2 表1/表3：综合能源消费量按当量值统计；折标系数见 GB/T 2589 综合能耗计算通则'] },
        { key: 'granularity', value: { time: '年度合计', space: '单位级' }, clauseRefs: ['附件2 表28 第9项：每年按要求报送上年度的能源利用状况报告'] }
      ],
      // 指标 ↔ 数据源 ↔ 因子 ↔ 公式（可执行规则，供换算引擎按指标取值）
      mappings: [
        { indicator: '综合能源消费量', dataSource: '表2 能源消费结构表 / 表3 结构附表', factorCategory: '折标系数（表2 第10列）', formula: 'Σ(分品种实物量 × 折标系数)' },
        { indicator: '单位产品综合能耗', dataSource: '表4/表5 单位产品综合能耗情况表', factorCategory: '—（强度指标）', formula: '综合能源消费量 ÷ 产品产量' },
        { indicator: '净购入电力间接排放', dataSource: '表26 碳排放情况表（间接）', factorCategory: '电网排放因子（消费侧）', formula: '净购入电量 × 电网平均排放因子' },
        { indicator: '碳排放量合计', dataSource: '表26：碳核查报告数据或碳排放参考计算表', factorCategory: '燃料燃烧因子 / 电力因子（消费侧）', formula: '直接排放 + 间接排放' }
      ],
      dimensions: [
        { key: 'report', label: '报表格式', points: ['工业：表1~8 + 表26~28（共 11 张）', '交通运输、仓储和邮政业：表9~13', '住宿和餐饮业：表14~16', '批发和零售业：表17~19', '教育业：表20~22', '其他非工业：表23~28', '表6 数据中心为条件性表格：全年电力消耗 500 万千瓦时及以上的数据中心填报', '正文提纲：概况 / 能源消费 / 能源利用效率 / 节能效益分析 / 节能措施 / 碳排放表 / 新能源利用 / 节能工作落实 / 节能目标完成 / 年度计划'] },
        { key: 'caliber', label: '口径要求', points: ['综合能源消费量按当量值统计（折标执行 GB/T 2589）', '碳排放口径为京内，与本市碳核查报告口径一致', '碳排放数据可采用本单位碳核查报告数据，或按碳排放参考计算表计算', '能源合计 = 分品种折标加总（表2 代码40）', '同比变化率由本期值与上年值自动计算'] },
        { key: 'sign', label: '落款与格式', points: ['各报表页脚：填报负责人 / 填报人 / 电话 / 填报日期', '封面（黑体一号）：题目「××（单位名称）××年度能源利用状况报告」，落款为单位名称（加盖公章）与日期', '封二（黑体一号）：单位名称（盖章）/ 报告编写人员名单 / 分管节能负责人（签字或盖章）/ 单位法定代表人（签字或盖章）', '目录与正文：一级标题黑体三号、二级标题楷体三号、三级标题仿宋三号、正文仿宋三号，1.5 倍行距'] }
      ]
    }
  },
  // ===== 部门级口径规则：同一份企业数据面向不同报送部门的四类口径转换规则 =====
  // 消费方式：智慧报告智能体按模板 caliber.standardCode 取主规则集，按 issuer（报送部门）取目标口径规则；
  //          新增部门只需在标准库追加一条条目，转换引擎不修改（规则模块化参数化）。
  {
    code: '生态环境局碳排放数据报送规范', name: '生态环境局碳排放数据报送规范', type: '政策文件',
    scope: '智慧报告', scenarios: ['REPORT'], issuer: '生态环境局', year: '2025',
    status: '现行', parseStatus: 'effective',
    desc: '生态环境局碳排放数据报送的指标名、范围边界、计算口径与数据粒度要求，用于企业数据向碳排放报送口径的转换。',
    structured: {
      kind: 'accounting', scenarioKind: 'REPORT',
      params: [
        { key: 'indicatorMapping', value: { from: '外购电量', to: '净购入电力' }, clauseRefs: ['报送规范：指标名称按部门口径填写'] },
        { key: 'scopeRule', value: { boundary: '法人边界', scope: '范围 1 + 范围 2（不含范围 3）' }, clauseRefs: ['报送规范：报告边界为法人边界，范围 3 单独披露不计入总量'] },
        { key: 'calcRule', value: { indirect: true, factor: '主管部门公布排放因子' }, clauseRefs: ['报送规范：含间接排放（外购电力、热力）'] },
        { key: 'granularity', value: { time: '年度合计', space: '单位级' }, clauseRefs: ['报送规范：按年度汇总报送'] }
      ],
      mappings: [
        { indicator: '碳排放量合计', dataSource: '能源消费量 + 外购电量', factorCategory: '燃料燃烧因子 / 电力因子（消费侧）', formula: '直接排放 + 间接排放' }
      ],
      dimensions: [
        { key: 'caliber', label: '口径要求', points: ['范围 1 + 范围 2，不含范围 3', '法人边界', '含间接排放，按主管部门公布排放因子', '总量 = 直接排放 + 间接排放'] }
      ]
    }
  },
  {
    code: '统计局能源消费统计报表制度', name: '统计局能源消费统计报表制度', type: '政策文件',
    scope: '智慧报告', scenarios: ['REPORT'], issuer: '统计局', year: '2025',
    status: '现行', parseStatus: 'effective',
    desc: '统计局能源消费统计的指标名、统计范围、计算口径与数据粒度要求，用于企业数据向能源统计口径的转换。',
    structured: {
      kind: 'accounting', scenarioKind: 'REPORT',
      params: [
        { key: 'indicatorMapping', value: { from: '综合能源消费量', to: '能源消费总量' }, clauseRefs: ['统计报表制度：分品种按统计目录名填报'] },
        { key: 'scopeRule', value: { boundary: '法人边界', scope: '分品种实物量口径（原煤 / 电力 / 天然气等逐品种）' }, clauseRefs: ['统计报表制度：按能源品种逐项统计'] },
        { key: 'calcRule', value: { method: '实物量为主（折标量为辅）' }, clauseRefs: ['统计报表制度：以实物量填报，折标量作参考'] },
        { key: 'granularity', value: { time: '月度采集 → 年度聚合（12 期求和）', space: '单位级' }, clauseRefs: ['统计报表制度：按月报送、年度汇总'] }
      ],
      mappings: [
        { indicator: '电力消费量', dataSource: '电费结算单 / 计量表', factorCategory: '—（实物量）', formula: '各月电量求和' },
        { indicator: '天然气消费量', dataSource: '燃气结算单 / 流量计', factorCategory: '—（实物量）', formula: '各月气量求和' }
      ],
      dimensions: [
        { key: 'caliber', label: '口径要求', points: ['分品种实物量口径', '实物量为主、折标量为辅', '月度采集、年度聚合', '指标名按统计目录'] }
      ]
    }
  },
  // 以下 3 条为 6 部门报送标准库的其余部门（四类参数为示例值，正式接入前需业务专家确认）
  {
    code: '电力企业能耗统计规范', name: '能源局电力企业能耗统计规范', type: '行业标准',
    scope: '智慧报告', scenarios: ['REPORT'], issuer: '能源局', year: '2025',
    status: '现行', parseStatus: 'effective',
    desc: '能源局电力企业能耗统计的指标名、统计范围、计算口径与数据粒度要求，用于企业数据向电力行业统计口径的转换。',
    structured: {
      kind: 'accounting', scenarioKind: 'REPORT',
      params: [
        { key: 'indicatorMapping', value: { from: '综合能源消费量', to: '发电企业能源消费量' }, clauseRefs: ['统计规范：按电力统计目录填报'] },
        { key: 'scopeRule', value: { boundary: '法人边界', scope: '发电生产用能（含厂用电与生产辅助用能）' }, clauseRefs: ['统计规范：发电生产用能单列'] },
        { key: 'calcRule', value: { method: '当量值折标', extra: '供电煤耗口径' }, clauseRefs: ['统计规范：综合能耗按 GB/T 2589 当量值折标'] },
        { key: 'granularity', value: { time: '月度采集 → 年度聚合', space: '机组级 / 企业级' }, clauseRefs: ['统计规范：按月报送、年度汇总'] }
      ],
      mappings: [
        { indicator: '发电企业能源消费量', dataSource: '能源消费结构表', factorCategory: '折标系数', formula: 'Σ(分品种实物量 × 折标系数)' },
        { indicator: '供电煤耗', dataSource: '发电量 + 燃料消耗', factorCategory: '—（效率指标）', formula: '发电标准煤耗 ÷ (1 − 厂用电率)' }
      ],
      dimensions: [
        { key: 'caliber', label: '口径要求', points: ['发电生产用能单列', '当量值折标', '供电煤耗按机组口径', '月度报送、年度汇总'] }
      ]
    }
  },
  {
    code: 'ESG信息披露环境章节规范', name: 'ESG 信息披露环境章节规范（GRI / SASB / TCFD）', type: '规范/指南',
    scope: '智慧报告', scenarios: ['REPORT'], issuer: 'ESG 评级机构', year: '2025',
    status: '现行', parseStatus: 'effective',
    desc: 'ESG 披露环境章节的指标名、披露边界、计算口径与数据粒度要求，框架支持 GRI 305 / SASB / TCFD。',
    structured: {
      kind: 'accounting', scenarioKind: 'REPORT',
      params: [
        { key: 'indicatorMapping', value: { from: '碳排放量合计', to: '范围1 / 范围2 / 范围3 温室气体排放' }, clauseRefs: ['GRI 305：按范围分别披露'] },
        { key: 'scopeRule', value: { boundary: '运营控制边界', scope: '范围 1 + 范围 2 + 范围 3（按 GRI 305 分类）' }, clauseRefs: ['GRI 305-1/2/3：分范围披露要求'] },
        { key: 'calcRule', value: { method: 'GHG Protocol / ISO 14064-1', intensity: '每万元营业收入排放强度' }, clauseRefs: ['GRI 305-4：排放强度披露'] },
        { key: 'granularity', value: { time: '年度（含三年对比）', space: '集团级 / 法人级' }, clauseRefs: ['TCFD：建议披露三年趋势'] }
      ],
      mappings: [
        { indicator: '范围1 温室气体排放', dataSource: '碳核算结果', factorCategory: '燃料燃烧因子', formula: 'Σ(活动数据 × 排放因子)' },
        { indicator: '范围2 温室气体排放', dataSource: '外购电/热', factorCategory: '电力 / 热力因子', formula: 'Σ(购入量 × 排放因子)' },
        { indicator: '排放强度', dataSource: '碳排放总量 + 营业收入', factorCategory: '—（强度指标）', formula: '碳排放总量 ÷ 营业收入' }
      ],
      dimensions: [
        { key: 'caliber', label: '口径要求', points: ['范围 1/2/3 分项披露', '运营控制边界', '含排放强度指标', '建议披露三年趋势'] }
      ]
    }
  },
  {
    code: '政策奖补申报规范', name: '政策奖补申报规范（节能技改 / 绿色制造）', type: '政策文件',
    scope: '智慧报告', scenarios: ['REPORT'], issuer: '工业和信息化部', year: '2025',
    status: '现行', parseStatus: 'effective',
    desc: '政策奖补申报的指标名、项目边界、计算口径与数据粒度要求，用于企业数据向奖补申报口径的转换。',
    structured: {
      kind: 'accounting', scenarioKind: 'REPORT',
      params: [
        { key: 'indicatorMapping', value: { from: '节能量', to: '项目年节能量' }, clauseRefs: ['申报规范：按项目单列节能量'] },
        { key: 'scopeRule', value: { boundary: '项目边界', scope: '技改项目对应的设备 / 工序用能' }, clauseRefs: ['申报规范：以项目为核算单元'] },
        { key: 'calcRule', value: { method: 'GB/T 13234 节能量测量和验证', formula: '改造前能耗 − 改造后能耗' }, clauseRefs: ['申报规范：节能量按 GB/T 13234 测算'] },
        { key: 'granularity', value: { time: '年度（含基准年对比）', space: '项目级' }, clauseRefs: ['申报规范：需提供基准年与改造后能耗'] }
      ],
      mappings: [
        { indicator: '项目年节能量', dataSource: '改造前后能耗台账', factorCategory: '折标系数', formula: '（改造前单位能耗 − 改造后单位能耗）× 产量' },
        { indicator: '年碳减排量', dataSource: '节能量 + 排放因子', factorCategory: '电力 / 燃料因子', formula: '节能量 × 排放因子' }
      ],
      dimensions: [
        { key: 'caliber', label: '口径要求', points: ['以项目为核算单元', '节能量按 GB/T 13234 测算', '需基准年对比数据', '碳减排量单独列示'] }
      ]
    }
  },
  {
    code: 'GB/T 32150-2015', name: '工业企业温室气体排放核算和报告通则（GB/T 32150-2015）', type: '国家标准',
    scope: '智慧报告', scenarios: ['REPORT'], issuer: '国家标准化管理委员会', year: '2015',
    status: '现行', parseStatus: 'effective',
    desc: '工业企业温室气体排放核算与报告的通用方法标准：核算边界与 fuel燃烧/过程/间接排放分类、排放因子法计算、活动数据与排放因子数据质量管理，为碳排放报告（生态环境部报送）提供核算方法依据。',
    structured: {
      kind: 'accounting', scenarioKind: 'REPORT',
      params: [
        { key: 'indicatorMapping', value: { mode: 'reportGuide', note: '指标按活动水平 / 排放因子 / 排放量三类组织，企业台账指标名按核算指南映射' }, clauseRefs: ['GB/T 32150 第4章：核算步骤与报告内容'] },
        { key: 'scopeRule', value: { boundary: '法人边界', scope: '燃料燃烧排放 + 过程排放 + 购入电力/热力间接排放（范围1 + 范围2）' }, clauseRefs: ['GB/T 32150 第5章：核算边界与排放源识别'] },
        { key: 'calcRule', value: { method: '排放因子法', formula: 'E = Σ(AD × EF)', indirect: true }, clauseRefs: ['GB/T 32150 第6章：排放量计算', '外购电力/热力按主管部门公布因子计算间接排放'] },
        { key: 'granularity', value: { time: '月度采集 · 年度报告汇总', space: '单位级' }, clauseRefs: ['GB/T 32150：按年度报告，月度数据用于过程管理'] }
      ],
      mappings: [
        { indicator: '碳排放量合计', dataSource: '能源消费量 + 外购电力/热力', factorCategory: '燃料燃烧因子 / 电网因子（消费侧）', formula: '直接排放 + 间接排放' },
        { indicator: '化石燃料燃烧排放', dataSource: '燃料消耗台账', factorCategory: '燃料排放因子', formula: 'Σ(燃料活动水平 × 低位热值 × 单位热值碳含量 × 氧化率)' },
        { indicator: '净购入电力间接排放', dataSource: '结算电量', factorCategory: '电网排放因子', formula: '净购入电量 × 电网平均排放因子' }
      ],
      dimensions: [
        { key: 'caliber', label: '口径要求', points: ['法人边界', '范围1 + 范围2 合计报告，范围3 不计入总量', '电力因子取主管部门公布值（2025年第3号公告版）', '活动数据优先实测 / 结算，缺项按指南估算并披露'] }
      ]
    }
  },
  {
    code: 'GB/T 17166', name: '企业能源审计技术通则（GB/T 17166）', type: '国家标准',
    scope: '智慧报告', scenarios: ['REPORT'], issuer: '国家市场监督管理总局', year: '2019',
    status: '现行', parseStatus: 'effective',
    desc: '企业能源审计的通用技术要求：能源消费全流程（购入储存 / 加工转换 / 输送分配 / 终端利用）审计内容、能源平衡表编制、当量值与等价值双口径折算及节能量核算方法。',
    structured: {
      kind: 'accounting', scenarioKind: 'REPORT',
      params: [
        { key: 'indicatorMapping', value: { mode: 'process', note: '企业台账指标按四环节（购入储存 / 加工转换 / 输送分配 / 终端利用）归集为审计报告指标' }, clauseRefs: ['GB/T 17166 第5章：能源审计内容'] },
        { key: 'scopeRule', value: { boundary: '企业能源消费全流程', scope: '购入储存 + 加工转换 + 输送分配 + 终端利用（含非生产用能）' }, clauseRefs: ['GB/T 17166：审计范围覆盖企业全部能源流向'] },
        { key: 'calcRule', value: { method: '能源平衡表 + 当量值/等价值双口径', standard: 'GB/T 2589' }, clauseRefs: ['GB/T 17166：编制企业能源平衡表，折算执行 GB/T 2589'] },
        { key: 'granularity', value: { time: '审计期（半年度 / 年度）', space: '企业级 + 重点用能环节' }, clauseRefs: ['GB/T 17166：审计期原则上为一个完整年度'] }
      ],
      mappings: [
        { indicator: '企业能源消费量合计', dataSource: '能源平衡表', factorCategory: '折标系数（当量值 / 等价值）', formula: 'Σ(分环节实物量 × 折标系数)' },
        { indicator: '节能量', dataSource: '基期与审计期能耗对比', factorCategory: '—（对比指标）', formula: '基期能耗（产量修正）− 审计期能耗' }
      ],
      dimensions: [
        { key: 'caliber', label: '口径要求', points: ['当量值与等价值双口径并列', '能源平衡表差额不超过 ±1%', '重点用能设备（环节）单独审计', '节能量按产品产量修正后列示'] }
      ]
    }
  },
  {
    code: '企业环境信息依法披露管理办法', name: '企业环境信息依法披露管理办法（生态环境部令 第24号）', type: '部门规章',
    scope: '智慧报告', scenarios: ['REPORT'], issuer: '生态环境部', year: '2022',
    status: '现行', parseStatus: 'effective',
    desc: '企业环境信息依法披露的规章要求：披露主体范围、披露内容与格式、时限及监督管理，环境信息披露文件中的排放数据与排污许可、碳核查等既有口径衔接。',
    structured: {
      kind: 'accounting', scenarioKind: 'REPORT',
      params: [
        { key: 'indicatorMapping', value: { mode: 'disclosureFormat', note: '按披露格式准则组织披露项，排放数据沿用排污许可证执行报告与碳核查口径' }, clauseRefs: ['管理办法 第12条：披露内容', '格式准则：污染物产生、治理与排放信息'] },
        { key: 'scopeRule', value: { boundary: '披露主体范围', scope: '重点排污单位 / 实施强制性清洁生产审核的企业 / 上年度因环境违法被处罚的企业' }, clauseRefs: ['管理办法 第7条：披露主体'] },
        { key: 'calcRule', value: { method: '衔接既有法定口径', standard: '与排污许可证执行报告、碳核查结果一致' }, clauseRefs: ['管理办法：披露数据应与依法获取的数据一致'] },
        { key: 'granularity', value: { time: '披露年度（次年3月15日前披露）', space: '企业级' }, clauseRefs: ['管理办法 第17条：披露时限'] }
      ],
      mappings: [
        { indicator: '温室气体排放数据', dataSource: '碳核查报告 / 排放核算', factorCategory: '与碳核查一致', formula: '沿用碳核查口径结果' }
      ],
      dimensions: [
        { key: 'caliber', label: '口径要求', points: ['披露数据与排污许可、碳核查等法定数据一致', '按格式准则分节披露', '披露前不得擅自变更已上传信息', '失信记录单独披露'] }
      ]
    }
  },
  {
    code: 'ESG信息披露环境章节规范', name: 'ESG 信息披露环境章节编制规范（GHG Protocol / ISO 14064-1）', type: '编制规范',
    scope: '智慧报告', scenarios: ['REPORT'], issuer: '企业 ESG 编制参考', year: '2025',
    status: '现行', parseStatus: 'effective',
    desc: 'ESG 报告环境章节的编制参考：以 GHG Protocol 与 ISO 14064-1 为核算方法基准，运营控制权法合并边界，范围 1/2/3 分类披露，覆盖 GRI 305 排放指标与气候相关财务披露衔接要求。',
    structured: {
      kind: 'accounting', scenarioKind: 'REPORT',
      params: [
        { key: 'indicatorMapping', value: { mode: 'framework', note: '按 GRI 305（排放）与能源、水资源等主题指标组织，与集团 KPI 口径对齐' }, clauseRefs: ['GRI 305：排放指标', 'ISO 14064-1 第5章：量化与报告'] },
        { key: 'scopeRule', value: { boundary: '运营控制权法合并边界', scope: '范围1 + 范围2（位置法/市场法双报告）+ 重要范围3 类别' }, clauseRefs: ['GHG Protocol Corporate Standard：合并方法与范围划分'] },
        { key: 'calcRule', value: { method: '排放因子法（GHG Protocol）', indirect: true }, clauseRefs: ['范围2 位置法与市场法双重报告', '范围3 按重要性筛选披露类别'] },
        { key: 'granularity', value: { time: '披露年度', space: '集团 / 组织级（可分业务板块）' }, clauseRefs: ['年度 ESG 报告周期'] }
      ],
      mappings: [
        { indicator: '范围1 排放（直接）', dataSource: '燃料消耗台账', factorCategory: '燃料排放因子（GHG Protocol）', formula: 'Σ(AD × EF) × GWP' },
        { indicator: '范围2 排放（间接，位置法/市场法）', dataSource: '购电量 + 绿电凭证', factorCategory: '区域电网因子 / 市场凭证因子', formula: '购电量 × 因子（双口径并列）' }
      ],
      dimensions: [
        { key: 'caliber', label: '口径要求', points: ['运营控制权法合并边界', '范围2 位置法与市场法双重披露', 'GWP 值注明 IPCC 评估报告版本', '重要范围3 类别经重要性评估后披露'] }
      ]
    }
  }
]

/* ==================== PCF 种子数据（5 条，参数化 + 条款溯源） ==================== */
const D = (dim, points) => ({ key: dim, label: { boundary: '核算边界', model: '核算模型', data: '数据要求', factor: '因子优先级', validation: '校验规则', report: '报告要求' }[dim] || dim, points })
const P = (key, value, clauseRefs) => ({ key, value, clauseRefs })

const PEF_SEEDS = [
  {
    code: 'EU PEF 2021/2279', year: '2021', name: '欧盟产品环境足迹方法论（PEF Guide）', type: '国际标准',
    scenarios: ['PEF'], scope: '产品级', issuer: '欧盟委员会（European Commission）', yearNum: 2021, version: 'V1',
    status: '现行', parseStatus: 'effective', sourceFile: '种子数据',
    remark: '适用于出口欧盟的多品类产品综合生命周期环境影响评价；替代旧版 2013/179/EU（PEF Guide 2021/2279 为现行版本）',
    structured: {
      kind: 'accounting', scenarioKind: 'PEF',
      params: [
        P('lifecycleScope', 'cradle-to-grave', ['PEF Guide 第4章：系统边界覆盖全生命周期']),
        P('unitType', 'declaration', ['PEF Guide 第4章：以声明单位/功能单位为基准']),
        P('unitDetail', '由企业按具体产品确定（声明单位 / 功能单位）', ['PEF Guide 第4章：声明单位定义']),
        P('allocationRule', 'mass', ['PEF Guide 第5章：多产出工艺按质量/经济比例分配']),
        P('cutoffThreshold', '1%/5%', ['PEF Guide 第5章：取舍准则单项<1%、累计≤5%']),
        P('cutoffItemThreshold', '1%', ['PEF Guide 第5章：单项物料/单元过程贡献<1%可舍弃']),
        P('cutoffTotalThreshold', '5%', ['PEF Guide 第5章：所有舍弃项累计≤5%']),
        P('timeBoundary', '覆盖产品实际生产周期（通常为最近一个完整年度），并满足数据时间代表性要求', ['PEF Guide 第4章：基准期采用完整自然年度']),
        P('allowedScopes', ['cradle-to-grave', 'cradle-to-gate', 'gate-to-gate'], ['PEF Guide 第4章：允许的生命周期范围']),
        P('allowedUnitTypes', ['declaration', 'functional'], ['PEF Guide 第4章：声明单位或功能单位']),
        P('modelStages', ['原材料获取阶段', '生产制造阶段', '运输分销阶段', '产品使用阶段', '报废回收阶段'], ['PEF Guide 第5章：生命周期阶段划分']),
        P('requiredInputs', ['raw_material', 'energy', 'transport'], ['PEF Guide 第6章：必收数据类别']),
        P('requiredOutputs', ['main_product', 'waste_gas', 'solid_waste'], ['PEF Guide 第6章：必收输出流']),
        P('dataRequiredFields', ['activityData', 'unit', 'source', 'timeReference'], ['PEF Guide 第6章：初级数据优先，须含来源与时间参照']),
        P('dqrDimensions', ['技术代表性', '地理代表性', '时间代表性', '数据质量'], ['PEF Guide 第7章：DQR 四维评估']),
        P('factorPriority', ['企业实测因子', '行业数据库', '国家因子库', '国际数据库'], ['PEF Guide 第7章：特征化因子采用 EF 3.1 推荐方法']),
        P('completenessThreshold', 95, ['PEF Guide 第7章：数据完整性阈值95%']),
        P('dqrScoreThreshold', 3, ['PEF Guide 第7章：DQR 评分不低于3分']),
        P('reportTemplate', 'PEF-DECLARATION', ['PEF Guide 第8章：环境足迹声明格式'])
      ],
      diffs: [],
      dimensions: [
        D('boundary', ['PEF Guide 第4章：系统边界、功能单位/声明单位与 PEFCR 类目规则优先', '第5章：取舍准则单项<1%、累计≤5%']),
        D('model', ['PEF Guide 第5章：生命周期模型与单元过程建模，多产出按质量/经济分配']),
        D('data', ['PEF Guide 第6章：初级数据优先，次级数据须来自合规数据集']),
        D('factor', ['PEF Guide 第7章：特征化因子采用 ILCD/PEF 推荐方法（EF 3.1）']),
        D('validation', ['PEF Guide 第7章：DQR 评估、完整性阈值与数据质量校验']),
        D('report', ['PEF Guide 第8章：声明须披露影响类别、方法版本、归一化与加权结果'])
      ]
    }
  },
  {
    code: 'ISO 14040/14044', year: '2006', name: '环境管理-生命周期评价（原则与框架 / 要求与指南）', type: '国际标准',
    scenarios: ['PEF'], scope: '产品级', issuer: 'ISO', yearNum: 2006, version: 'V1',
    status: '现行', parseStatus: 'effective', sourceFile: '种子数据',
    remark: 'PEF 的方法学基础：生命周期评价原则与框架（14040）+ 要求与指南（14044）',
    structured: {
      kind: 'accounting', scenarioKind: 'PEF',
      params: [
        P('lifecycleScope', 'cradle-to-grave', ['ISO 14044 第4章：系统边界设定']),
        P('unitType', 'declaration', ['ISO 14040 第4章：功能单位/声明单位']),
        P('unitDetail', '由企业按具体产品确定（声明单位 / 功能单位）', ['ISO 14040 第4章：功能单位定义']),
        P('allocationRule', 'mass', ['ISO 14044 第4.3.4条：分配规则']),
        P('cutoffThreshold', '1%/5%', ['ISO 14044 第4.3.3条：取舍准则']),
        P('cutoffItemThreshold', '1%', ['ISO 14044 第4.3.3条：单项取舍']),
        P('cutoffTotalThreshold', '5%', ['ISO 14044 第4.3.3条：累计取舍']),
        P('timeBoundary', '覆盖产品实际生产周期（通常为最近一个完整年度），并满足数据时间代表性要求', ['ISO 14044 第4.2.3条：时间边界']),
        P('allowedScopes', ['cradle-to-grave', 'cradle-to-gate', 'gate-to-gate'], ['ISO 14044 第4.2.3条：系统边界类型']),
        P('allowedUnitTypes', ['declaration', 'functional'], ['ISO 14040 第4章：功能单位']),
        P('modelStages', ['原材料获取阶段', '生产制造阶段', '运输分销阶段', '产品使用阶段', '报废回收阶段'], ['ISO 14044 第4.3条：清单分析阶段划分']),
        P('requiredInputs', ['raw_material', 'energy', 'transport'], ['ISO 14044 第4.3.2条：输入数据']),
        P('requiredOutputs', ['main_product', 'waste_gas', 'solid_waste'], ['ISO 14044 第4.3.2条：输出数据']),
        P('dataRequiredFields', ['activityData', 'unit', 'source', 'timeReference'], ['ISO 14044 第4.3.3条：数据质量要求']),
        P('dqrDimensions', ['技术代表性', '地理代表性', '时间代表性', '数据质量'], ['ISO 14044 第4.3.3条：数据质量评估']),
        P('factorPriority', ['企业实测因子', '行业数据库', '国家因子库', '国际数据库'], ['ISO 14044 第4.3.3条：数据来源优先序']),
        P('completenessThreshold', 95, ['ISO 14044 第4.5条：完整性检查']),
        P('dqrScoreThreshold', 3, ['ISO 14044 第4.3.3条：数据质量评分']),
        P('reportTemplate', 'PEF-DECLARATION', ['ISO 14044 第5章：报告要求'])
      ],
      diffs: [],
      dimensions: [
        D('boundary', ['ISO 14044 第4.2.3条：系统边界与功能单位设定']),
        D('model', ['ISO 14044 第4.3条：清单分析与单元过程建模']),
        D('data', ['ISO 14044 第4.3.2条：输入输出数据采集']),
        D('factor', ['ISO 14044 第4.3.3条：数据来源与质量']),
        D('validation', ['ISO 14044 第4.5条：完整性、一致性与敏感性检查']),
        D('report', ['ISO 14044 第5章：报告与关键评审'])
      ]
    }
  }
]

const PCF_SEEDS = [
  {
    code: 'QC/T 1248-2025', year: '2025', name: '汽车生命周期碳足迹核算方法和要求', type: '行业标准',
    scenarios: ['PCF'], scope: '产品级', issuer: '工业和信息化部', yearNum: 2025, version: 'V1',
    status: '现行', parseStatus: 'effective', sourceFile: '种子数据',
    structured: {
      kind: 'accounting', scenarioKind: 'PCF',
      params: [
        P('lifecycleScope', 'cradle-to-grave', ['第5章 系统边界：涵盖原材料获取至报废回收全生命周期']),
        P('unitType', 'declaration', ['第6.1条 量化单位：以声明单位为基准']),
        P('unitDetail', '1辆汽车', ['第6.1条 声明单位定义：1辆整车']),
        P('allocationRule', 'mass', ['第7.3条 多产出工艺按质量比例分配（参照ISO 14044）']),
        P('cutoffThreshold', '1%/5%', ['第5.3条 取舍准则：单项<1%，累计≤5%']),
        P('cutoffItemThreshold', '1%', ['第5.3条 单项物料/单元过程排放贡献<1%可舍弃']),
        P('cutoffTotalThreshold', '5%', ['第5.3条 所有舍弃项累计≤5%']),
        P('timeBoundary', '覆盖产品实际生产周期（通常为最近一个完整年度），并满足数据时间代表性要求', ['第4.3条 基准期：完整自然年度']),
        P('allowedScopes', ['cradle-to-grave'], ['第5章 本标准仅适用全生命周期边界']),
        P('allowedUnitTypes', ['declaration'], ['第6.1条 仅接受声明单位']),
        P('modelStages', ['原材料获取', '生产制造', '运输分销', '产品使用', '报废回收'], ['第5.2条 生命周期阶段划分']),
        P('requiredInputs', ['raw_material', 'energy', 'transport'], ['第6.2条 必收数据类别：原材料/能源/运输']),
        P('requiredOutputs', ['main_product', 'waste_gas', 'solid_waste'], ['第6.3条 必收输出流']),
        P('dataRequiredFields', ['activityData', 'unit', 'source', 'timeReference'], ['第8章 数据质量要求：活动数据须含来源与时间参照']),
        P('dqrDimensions', ['completeness', 'consistency', 'reliability', 'temporal', 'geographical', 'technological'], ['第8.2条 数据质量六维度评估']),
        P('factorPriority', ['cpcd', 'national-gef', 'ecoinvent'], ['第7.1条 因子选取优先序：本土实测优先']),
        P('completenessThreshold', 95, ['第8.1条 数据完整性阈值95%']),
        P('dqrScoreThreshold', 3, ['第8.2条 DQR评分不低于3分']),
        P('reportTemplate', 'qct-1248', ['第9章 报告内容与格式要求'])
      ],
      diffs: [],
      dimensions: [
        D('boundary', ['第5章：系统边界为摇篮到坟墓，涵盖原材料获取、生产制造、运输分销、产品使用、报废回收五阶段', '第5.3条：取舍准则单项<1%、累计≤5%']),
        D('model', ['第6章：单元过程建模须覆盖全部生命周期阶段，多产出工艺按质量分配']),
        D('data', ['第8章：活动数据须含活动数据值、单位、来源、时间参照；初级数据优先']),
        D('factor', ['第7.1条：因子优先序为 CPCD→国家温室气体因子库→Ecoinvent']),
        D('validation', ['第8.1条：完整性阈值95%，一致性校验开启，DQR≥3分']),
        D('report', ['第9章：报告须披露功能单位、系统边界、数据来源、因子出处与不确定度'])
      ]
    }
  },
  // ===== 乘用车生命周期碳排放核算技术规范（中汽中心）=====
  {
    code: '乘用车生命周期碳排放核算技术规范',
    name: '乘用车生命周期碳排放核算技术规范（中汽中心）',
    type: '行业规范',
    issuer: '中汽中心（中国汽车技术研究中心）',
    yearNum: 2025,
    version: 'V1',
    scenarios: ['PCF'],
    parseStatus: 'effective',
    scope: '最大设计总质量不超过 3500kg 的 M1 类车辆（汽油/柴油乘用车、不可外接充电式混动、插电式混动、纯电动乘用车）',
    scopeExcluded: '不适用于燃用气体燃料或醇醚类燃料的 M1 类车辆',
    structured: {
      kind: 'accounting',
      scenarioKind: 'PCF',
      params: [
        { key: 'lifecycleScope', value: 'cradle-to-use', label: '生命周期范围',
          clauseRefs: ['4.1.1 生命周期视角：原材料获取 + 整车生产 + 使用阶段（不含报废回收）'] },
        { key: 'unitType', value: 'functional', label: '量化单位类型',
          clauseRefs: ['4.2.1 功能单位'] },
        { key: 'allowedUnitTypes', value: ['functional'], label: '可选单位类型',
          clauseRefs: ['4.2.1 功能单位：本文件以功能单位为量化基准'] },
        { key: 'unitDetail', value: '一辆乘用车生命周期内行驶 1km 提供的运输服务（生命周期行驶里程按 1.5×10⁵ km 计算）',
          label: '单位详情', clauseRefs: ['4.2.1 功能单位'] },
        { key: 'allocationRule', value: 'economic', label: '分配规则',
          clauseRefs: ['4.3.2 数据分配：优先物理关系，无法确定时采用经济分配'] },
        { key: 'cutoffThreshold', value: '材料重量占比或碳排放占比 >1%（相对整车各部门）的其他均质材料，必须纳入核算范围；≤1% 可不纳入', label: '取舍准则',
          clauseRefs: ['4.2.2.2 原材料获取阶段核算范围：占比大于各部门 1% 但未列入表 1 的其他均质材料也需纳入'] },
        { key: 'timeBoundary', value: '最近连续生产 3 个月至 1 年的平均水平（优先 1 年）',
          label: '时间边界', clauseRefs: ['4.3.3.1 时间范围'] },
        { key: 'ghgGases', value: [
          { name: '二氧化碳', symbol: 'CO₂', gwp100: 1 },
          { name: '甲烷', symbol: 'CH₄', gwp100: 28 },
          { name: '氧化亚氮', symbol: 'N₂O', gwp100: 265 },
          { name: '氢氟碳化物', symbol: 'HFCs', gwp100: '按品种' },
          { name: '全氟碳化物', symbol: 'PFCs', gwp100: '按品种' },
          { name: '六氟化硫', symbol: 'SF₆', gwp100: 23500 },
          { name: '三氟化氮', symbol: 'NF₃', gwp100: 16100 }
        ], label: '温室气体种类（7 种，GWP100）',
          clauseRefs: ['4.2.3 碳（温室气体）：《京都议定书》规定的七种温室气体，参见附录 D'] },
        { key: 'emissionSources', value: [
          '能源利用', '燃烧过程', '化学反应', '运行过程', '废物处理'
        ], label: '碳排放源（输入/输出）',
          clauseRefs: ['4.2.4 碳排放源：本文件不考虑土地利用和土地利用变化'] },
        { key: 'excludedSources', value: ['土地利用', '土地利用变化（LULUC）'], label: '排除的排放源',
          clauseRefs: ['4.2.4'] },
        { key: 'dqrDimensions', value: ['时间范围', '地理范围', '技术范围', '完整性', '重现性', '数据来源'],
          label: '数据质量维度', clauseRefs: ['4.3.3 数据质量要求'] },
        { key: 'dataQuality', value: [
          { label: '时间范围', desc: '应收集最近连续生产 3 个月到 1 年的平均水平数据；优先使用最近连续生产 1 年的数据' },
          { label: '地理范围', desc: '应收集实际生产地理区域的数据' },
          { label: '技术范围', desc: '应收集实际生产工艺技术或技术组合的数据' },
          { label: '完整性', desc: '应收集涵盖产品系统边界范围的数据' },
          { label: '重现性', desc: '应保证独立从业人员可以重现产品碳排放的核算结果' },
          { label: '数据来源', desc: '应对数据的获得方式和来源均予以说明' }
        ], label: '数据质量要求（4.3.3）',
          clauseRefs: ['4.3.3.1 时间范围', '4.3.3.2 地理范围', '4.3.3.3 技术范围', '4.3.3.4 完整性', '4.3.3.5 重现性', '4.3.3.6 数据来源'] },
        { key: 'completenessRule', value: '完整性要求：应涵盖产品系统边界范围（4.3.3.4）', label: '完整性要求',
          clauseRefs: ['4.3.3.4 完整性：应收集涵盖产品系统边界范围的数据'] },
        { key: 'factorPriority', value: ['具体场地数据', '附录 B 缺省值', '附录 F 能源因子'], label: '因子优先级',
          clauseRefs: ['4.3.1 数据收集'] },
        { key: 'reportTemplate', value: '乘用车生命周期碳排放核算报告模板（附录 G）', label: '报告模板',
          clauseRefs: ['5 报告编制方法', '附录 G'] },
        // 三阶段系统边界
        { key: 'modelStages', value: ['原材料获取阶段', '整车生产阶段', '使用阶段'], label: '生命周期阶段',
          clauseRefs: ['4.1.1 生命周期视角：原材料获取阶段、整车生产阶段、使用阶段'] },
        { key: 'stagesFixed', value: true, label: '阶段是否由标准固定',
          clauseRefs: ['4.1.1 生命周期视角：阶段由本文件明确规定，不可增删'] },
        { key: 'scopeFixedValue', value: 'cradle-to-use', label: '标准规定的生命周期口径',
          clauseRefs: ['4.1.1 + 4.2.2 系统边界'] },
        // 材料类别（表1）
        { key: 'materialCategories', value: [
          '钢铁', '铸铁', '铝及铝合金', '镁及镁合金', '铜及铜合金', '热塑性塑料', '热固性塑料',
          '橡胶', '织物', '陶瓷玻璃', '铅', '硫镍', '玻璃纤维', '磷酸铁锂', '镍钴锰酸锂',
          '锰酸锂', '石墨', '电解液', '六氟磷酸锂', '润滑剂', '刹车液', '冷却液', '制冷剂', '洗涤液'
        ], label: '材料类别（表1 核算范围内材料汇总）', clauseRefs: ['表1'] },
        // 重点零部件（表2）
        { key: 'keyComponents', value: [
          { system: '发动机', parts: ['缸体', '缸盖', '气缸盖罩', '曲轴', '凸轮轴', '活塞', '连杆', '齿轮', '飞轮', '进气歧管', '排气歧管', '油底壳'] },
          { system: '动力系统', parts: ['箱体（壳体）', '散热片', '水连接管', '硬铜巴', '高压盒', '电芯（单体）', '壳体', '定子', '转子', '壳体'] },
          { system: '变速箱/减速器', parts: ['精密齿轮（中间轴）', '输入轴', '输出轴', '壳体'] },
          { system: '底盘系统', parts: ['传动轴', '驱动半轴（半轴）', '副车架', '轮毂', '轮胎', '备胎', '制动盘', '减震器', '螺旋弹簧'] },
          { system: '车身系统', parts: ['转向（管）柱本体', '车门', '发动机罩', '行李箱盖', '顶盖', '侧围', '白车身', '座椅骨架', '座椅发泡', '座椅面罩', '前挡风玻璃', '后挡风玻璃', '侧玻璃', '天窗玻璃', '内饰', '门护板', '立柱护板', '顶棚本体', '前保险杠本体', '后保险杠本体'] },
          { system: '电器系统', parts: ['铅酸蓄电池', '冷凝器', '压缩机', '蒸发器芯', '壳体', '电缆', '高压线束', '护套'] }
        ], label: '重点零部件（表2）', clauseRefs: ['表2'] },
        // 核算公式
        { key: 'calcRule', value: {
          method: '排放因子法（生命周期分段累加）',
          formulas: {
            rawMaterial: 'C原材料 = C部件 + C铅酸蓄电池 + C锂离子动力蓄电池 + C轮胎 + C液体',
            component: 'C部件 = Σ(部件材料i重量 × 部件材料i碳排放因子)',
            leadBattery: 'C铅酸蓄电池 = Σ(铅酸蓄电池材料i重量 × 碳排放因子)',
            lithiumBattery: 'C锂离子蓄电池 = 电池容量 × 锂离子动力蓄电池包碳排放因子',
            tire: 'C轮胎 = Σ(轮胎材料i重量 × 碳排放因子)',
            fluid: 'C液体 = Σ(液体材料i重量 × 碳排放因子)',
            production: 'C整车生产 = Σ(能源或燃料i外购量 × 碳排放因子) + Σ(燃料i使用量 × NCV × CEF) + Mco2',
            usePhase: 'C使用 = C燃料生产 + C燃料使用 + C轮胎更换 + C铅酸蓄电池更换 + C液体更换及制冷剂逸散',
            fuelProduction: 'C燃料生产 = FC × CEF燃料 × L / 100',
            fuelUse: 'C燃料使用 = FC × CEF燃烧 × L / 100',
            total: 'C生命周期 = C原材料 + C整车生产 + C使用阶段'
          },
          precision: '计算结果四舍五入至小数点后两位',
          unit: 'kgCO₂e'
        }, label: '核算方法', clauseRefs: ['4.4 计算方法'] }
      ],
      clauseRefs: ['4 生命周期碳排放核算方法', '5 报告编制方法']
    }
  },
  {
    code: 'GB/T 24067-2024', year: '2024', name: '温室气体 产品碳足迹 量化要求和指南', type: '国家标准',
    scenarios: ['PCF'], scope: '产品级', issuer: '国家市场监督管理总局', yearNum: 2024, version: 'V1',
    status: '现行', parseStatus: 'effective', sourceFile: '种子数据',
    structured: {
      kind: 'accounting', scenarioKind: 'PCF',
      params: [
        P('lifecycleScope', 'cradle-to-grave', ['第6章 系统边界：全生命周期或摇篮到大门']),
        P('unitType', 'declaration', ['第6.3条 功能单位/声明单位']),
        P('unitDetail', '1kg产品', ['第6.3条 以1kg产品为基准']),
        P('allocationRule', 'mass', ['第6.5条 分配优先按质量']),
        P('cutoffThreshold', '1%', ['第6.4条 取舍准则']),
        P('cutoffItemThreshold', '1%', ['第6.4条 单项取舍']),
        P('cutoffTotalThreshold', '5%', ['第6.4条 累计取舍']),
        P('timeBoundary', '覆盖产品实际生产周期（通常为最近一个完整年度），并满足数据时间代表性要求', ['第6.2条 数据时间段']),
        P('allowedScopes', ['cradle-to-grave', 'cradle-to-gate'], ['第6章 允许全生命周期或摇篮到大门']),
        P('allowedUnitTypes', ['declaration', 'reference'], ['第6.3条 声明单位或参考单位']),
        P('modelStages', ['原材料获取', '生产制造', '运输分销', '产品使用', '报废回收'], ['第6章 生命周期阶段']),
        P('requiredInputs', ['raw_material', 'energy'], ['第7章 必收：原材料与能源']),
        P('requiredOutputs', ['main_product', 'waste_gas', 'solid_waste', 'wastewater'], ['第7章 必收输出流']),
        P('dataRequiredFields', ['activityData', 'unit', 'source'], ['第8章 数据要求']),
        P('dqrDimensions', ['completeness', 'consistency', 'reliability'], ['第8章 数据质量评估维度']),
        P('factorPriority', ['national-gef', 'cpcd', 'ecoinvent'], ['第7.2条 因子优先序：国家因子库优先']),
        P('completenessThreshold', 90, ['第8章 完整性阈值90%']),
        P('dqrScoreThreshold', 3, ['第8章 DQR阈值']),
        P('reportTemplate', 'gbt-24067', ['第9章 报告要求'])
      ],
      diffs: [],
      dimensions: [
        D('boundary', ['第6章：系统边界允许摇篮到坟墓或摇篮到大门', '第6.4条：取舍准则']),
        D('model', ['第7章：按生命周期阶段建模，输出流须含主产品、废气、固废、废水']),
        D('data', ['第8章：活动数据须含值/单位/来源']),
        D('factor', ['第7.2条：优先采用国家温室气体因子库']),
        D('validation', ['第8章：完整性90%，DQR≥3']),
        D('report', ['第9章：按国标报告格式披露'])
      ]
    }
  },
  {
    code: 'ISO 14067:2018', year: '2018', name: '温室气体-产品碳足迹-量化和声明指南', type: '国际标准',
    scenarios: ['PCF', 'PEF'], scope: '产品级', issuer: 'ISO', yearNum: 2018, version: 'V1',
    status: '现行', parseStatus: 'effective', sourceFile: '种子数据',
    structured: {
      kind: 'accounting', scenarioKind: 'PCF',
      params: [
        P('lifecycleScope', 'cradle-to-grave', ['Clause 6 System boundary: cradle-to-grave recommended']),
        P('unitType', 'declaration', ['Clause 6.3 Functional unit']),
        P('unitDetail', '1功能单位', ['Clause 6.3 Functional unit definition']),
        P('allocationRule', 'mass', ['Clause 6.4.4 Allocation per ISO 14044']),
        P('cutoffThreshold', '1%', ['Clause 6.4.2 Cut-off criteria']),
        P('cutoffItemThreshold', '1%', ['Clause 6.4.2 Item cut-off']),
        P('cutoffTotalThreshold', '5%', ['Clause 6.4.2 Total cut-off']),
        P('timeBoundary', '覆盖产品实际生产周期（通常为最近一个完整年度），并满足数据时间代表性要求', ['Clause 6.2 Time boundary']),
        P('allowedScopes', ['cradle-to-grave', 'cradle-to-gate', 'gate-to-gate'], ['Clause 6: multiple boundary options']),
        P('allowedUnitTypes', ['declaration', 'reference'], ['Clause 6.3']),
        P('modelStages', ['原材料获取', '生产制造', '运输分销', '产品使用', '报废回收'], ['Clause 6 lifecycle stages']),
        P('requiredInputs', ['raw_material', 'energy', 'transport'], ['Clause 7.1 required input data']),
        P('requiredOutputs', ['main_product', 'waste_gas', 'solid_waste', 'wastewater'], ['Clause 7.2 required outputs']),
        P('dataRequiredFields', ['activityData', 'unit', 'source', 'timeReference', 'geography'], ['Clause 8 data quality: incl. geography']),
        P('dqrDimensions', ['completeness', 'consistency', 'reliability', 'temporal', 'geographical', 'technological'], ['Clause 8.4 DQR dimensions']),
        P('factorPriority', ['ecoinvent', 'elcd', 'ipcc'], ['Clause 7.3 secondary data preference']),
        P('completenessThreshold', 90, ['Clause 8 completeness ≥90%']),
        P('dqrScoreThreshold', 2, ['Clause 8.4 DQR threshold stricter']),
        P('reportTemplate', 'iso-14067', ['Clause 9 CFP report'])
      ],
      diffs: [],
      dimensions: [
        D('boundary', ['Clause 6: cradle-to-grave/gate/gate-to-gate均可，须声明', 'Clause 6.4: cut-off与分配规则']),
        D('model', ['Clause 7: LCI建模覆盖全部声明阶段']),
        D('data', ['Clause 8: 数据质量含地理维度']),
        D('factor', ['Clause 7.3: 次级数据优先国际数据库']),
        D('validation', ['Clause 8.4: DQR阈值更严格（≥2）']),
        D('report', ['Clause 9: CFP报告与沟通要求'])
      ]
    }
  },
  {
    code: 'PAS 2050:2011', year: '2011', name: '商品和服务的生命周期温室气体排放评价规范', type: '规范/指南',
    scenarios: ['PCF'], scope: '产品级', issuer: 'BSI', yearNum: 2011, version: 'V1',
    status: '现行', parseStatus: 'effective', sourceFile: '种子数据',
    structured: {
      kind: 'accounting', scenarioKind: 'PCF',
      params: [
        P('lifecycleScope', 'cradle-to-grave', ['Clause 5.3 System boundary']),
        P('unitType', 'declaration', ['Clause 6 Functional unit']),
        P('unitDetail', '1单位产品', ['Clause 6 Unit definition']),
        P('allocationRule', 'economic', ['Clause 8.5 Allocation: economic preferred']),
        P('cutoffThreshold', '1%', ['Clause 5.4 Cut-off']),
        P('cutoffItemThreshold', '1%', ['Clause 5.4']),
        P('cutoffTotalThreshold', '5%', ['Clause 5.4']),
        P('timeBoundary', '覆盖产品实际生产周期（通常为最近一个完整年度），并满足数据时间代表性要求', ['Clause 6.2']),
        P('allowedScopes', ['cradle-to-grave', 'cradle-to-gate'], ['Clause 5.3']),
        P('allowedUnitTypes', ['declaration'], ['Clause 6']),
        P('modelStages', ['原材料获取', '生产制造', '运输分销', '产品使用', '报废回收'], ['Clause 5.3 stages']),
        P('requiredInputs', ['raw_material', 'energy', 'transport'], ['Clause 7 inputs']),
        P('requiredOutputs', ['main_product', 'waste_gas'], ['Clause 7 outputs']),
        P('dataRequiredFields', ['activityData', 'unit', 'source'], ['Clause 8 data requirements']),
        P('dqrDimensions', ['completeness', 'consistency', 'reliability'], ['Clause 8.2']),
        P('factorPriority', ['ecoinvent', 'elcd', 'ipcc'], ['Clause 7.2']),
        P('completenessThreshold', 85, ['Clause 8 completeness ≥85%']),
        P('dqrScoreThreshold', 3, ['Clause 8.2']),
        P('reportTemplate', 'pas-2050', ['Clause 10 communication'])
      ],
      diffs: [],
      dimensions: [
        D('boundary', ['Clause 5.3: cradle-to-grave/gate', 'Clause 5.4: cut-off']),
        D('model', ['Clause 7: 多产出工艺按经济价值分配（不同于ISO质量分配）']),
        D('data', ['Clause 8: 数据要求']),
        D('factor', ['Clause 7.2: 次级数据']),
        D('validation', ['Clause 8.2: 完整性85%']),
        D('report', ['Clause 10: 声明与沟通'])
      ]
    }
  },
  {
    code: 'CBAM', year: '2023', name: '欧盟碳边境调节机制（CBAM）嵌入式排放核算', type: '政策文件',
    scenarios: ['PCF'], scope: '产品级（出口）', issuer: '欧盟委员会', yearNum: 2023, version: 'V1',
    status: '现行', parseStatus: 'effective', sourceFile: '种子数据',
    structured: {
      kind: 'accounting', scenarioKind: 'PCF',
      params: [
        P('lifecycleScope', 'cradle-to-gate', ['Annex IV: embedded emissions cover upstream to gate']),
        P('unitType', 'declaration', ['Annex IV reporting unit']),
        P('unitDetail', '1吨产品', ['Annex IV per tonne of goods']),
        P('allocationRule', 'mass', ['Annex IV allocation']),
        P('cutoffThreshold', '0%', ['Article 4: no cut-off allowed']),
        P('cutoffItemThreshold', '0%', ['Article 4: 全量核算，不允许取舍']),
        P('cutoffTotalThreshold', '0%', ['Article 4']),
        P('timeBoundary', '覆盖产品实际生产周期（通常为最近一个完整年度），并满足数据时间代表性要求', ['Article 6 reporting period']),
        P('allowedScopes', ['cradle-to-gate'], ['Annex IV 仅到大门']),
        P('allowedUnitTypes', ['declaration'], ['Annex IV']),
        P('modelStages', ['原材料获取', '生产制造'], ['Annex IV: 前体材料+生产阶段']),
        P('requiredInputs', ['raw_material', 'energy', 'precursor_material'], ['Annex IV precursor materials']),
        P('requiredOutputs', ['main_product'], ['Annex IV']),
        P('dataRequiredFields', ['activityData', 'unit', 'source', 'cnCode', 'productionCountry'], ['Article 6: CN code + country of origin mandatory']),
        P('dqrDimensions', ['completeness', 'consistency', 'reliability', 'geographical'], ['Article 6 data quality']),
        P('factorPriority', ['eu-default', 'national-gef', 'ecoinvent'], ['Article 4: EU default values vs actual data']),
        P('completenessThreshold', 100, ['Article 4: 完整性要求100%']),
        P('dqrScoreThreshold', 2, ['Article 6']),
        P('reportTemplate', 'cbam', ['Annex IV communication format']),
        P('cnCode', '', ['Annex I: 8-digit CN code 必填（任务级填写）']),
        P('productionCountry', '', ['Article 6: country of origin 必填（任务级填写）']),
        P('electricityFactor', '', ['Article 4: 电力因子来源（任务级填写）']),
        P('precursorMaterials', ['steel', 'aluminium', 'cement', 'fertilizer', 'electricity', 'hydrogen'], ['Annex I: covered precursor materials']),
        P('requireActualData', true, ['Article 4: actual data priority over default values'])
      ],
      diffs: [],
      dimensions: [
        D('boundary', ['Annex IV：边界为摇篮到大门（embedded emissions）', 'Article 4：不允许取舍，全量核算']),
        D('model', ['Annex I：覆盖钢/铝/水泥/化肥/电力/氢六类前体材料']),
        D('data', ['Article 6：CN税则号、原产国为必填，实际数据优先']),
        D('factor', ['Article 4：优先实际排放数据，缺省时用EU default values']),
        D('validation', ['Article 4：完整性100%，DQR≥2']),
        D('report', ['Annex IV：按季度报送嵌入式排放报告'])
      ]
    }
  }
]

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
