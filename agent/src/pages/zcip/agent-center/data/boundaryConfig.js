/**
 * Boundary configuration templates for accounting scenarios only.
 * Scope: PCF / PEF / ORG / BJ / PARK.
 * User edits are business labels; runtime conversion happens on read.
 */

export const BOUNDARY_SCENARIO_KEYS = ['PCF', 'PEF', 'ORG', 'BJ', 'PARK']

export const BOUNDARY_SCENARIOS = [
  { key: 'PCF', label: '产品碳足迹' },
  { key: 'PEF', label: '产品环境足迹' },
  { key: 'ORG', label: '组织碳核算' },
  { key: 'BJ', label: '北京碳市场' },
  { key: 'PARK', label: '园区碳核算' }
]

export const BOUNDARY_FIELD_DEFS = {
  lifecycleScope: { key: 'lifecycleScope', label: '边界范围', type: 'text' },
  unitType: { key: 'unitType', label: '量化口径', type: 'text' },
  unitDetail: { key: 'unitDetail', label: '口径说明', type: 'textarea' },
  allocationRule: { key: 'allocationRule', label: '归集/分配方式', type: 'text' },
  cutoffItemThreshold: { key: 'cutoffItemThreshold', label: '单项取舍阈值', type: 'text' },
  cutoffTotalThreshold: { key: 'cutoffTotalThreshold', label: '累计取舍阈值', type: 'text' },
  cutoffThreshold: { key: 'cutoffThreshold', label: '取舍阈值汇总', type: 'text' },
  timeBoundary: { key: 'timeBoundary', label: '报告期/时间边界', type: 'textarea' },
  allowedScopes: { key: 'allowedScopes', label: '可选边界', type: 'list' },
  allowedUnitTypes: { key: 'allowedUnitTypes', label: '可选量化口径', type: 'list' },
  modelStages: { key: 'modelStages', label: '核算阶段/范围', type: 'list' },
  factorLibPriority: { key: 'factorLibPriority', label: '因子库优先级', type: 'list' }
}

const PCF_FIELDS = ['lifecycleScope', 'unitType', 'unitDetail', 'allocationRule', 'cutoffItemThreshold', 'cutoffTotalThreshold', 'timeBoundary', 'modelStages', 'availableFactorLibraries', 'allowedScopes', 'allowedUnitTypes']
const PRODUCT_FIELDS = ['lifecycleScope', 'unitType', 'unitDetail', 'allocationRule', 'cutoffItemThreshold', 'cutoffTotalThreshold', 'timeBoundary', 'modelStages', 'factorLibPriority']
const ORG_FIELDS = ['lifecycleScope', 'unitType', 'unitDetail', 'allocationRule', 'timeBoundary', 'modelStages', 'factorLibPriority']
const PARK_FIELDS = ['lifecycleScope', 'unitType', 'unitDetail', 'timeBoundary', 'modelStages', 'factorLibPriority']

export const BOUNDARY_DEFAULTS = {
  PCF: {
    scenarioKey: 'PCF', scenarioLabel: '产品碳足迹',
    purpose: '定义产品生命周期核算的系统边界、声明/功能单位、多产出分配、取舍规则与可用因子库范围；具体产品、核算年度和已选标准决定最终取值。',
    fields: PCF_FIELDS,
    labels: { lifecycleScope: '生命周期范围', unitType: '量化单位', unitDetail: '单位定义', allocationRule: '分配规则', cutoffItemThreshold: '单项取舍阈值', cutoffTotalThreshold: '累计取舍阈值', timeBoundary: '核算时间边界', modelStages: '生命周期阶段', availableFactorLibraries: '可用排放因子库范围', allowedScopes: '可选生命周期范围', allowedUnitTypes: '可选量化单位' },
    defaults: {
      lifecycleScope: null,
      unitType: null,
      unitDetail: null,
      allocationRule: null,
      cutoffItemThreshold: '1%',
      cutoffTotalThreshold: '5%',
      timeBoundary: null,
      modelStages: ['原材料获取阶段', '生产制造阶段', '运输分销阶段', '产品使用阶段', '报废回收阶段'],
      availableFactorLibraries: ['经企业权限开放的其他因子库'],
      allowedScopes: ['cradle-to-grave', 'cradle-to-gate', 'gate-to-gate'],
      allowedUnitTypes: ['declaration', 'functional']
    }
  },
  PEF: {
    scenarioKey: 'PEF', scenarioLabel: '产品环境足迹',
    purpose: '定义产品全生命周期环境影响评价的边界、量化单位与数据取舍规则。',
    fields: PRODUCT_FIELDS,
    labels: { lifecycleScope: '生命周期范围', unitType: '量化单位', unitDetail: '单位定义', allocationRule: '分配规则', cutoffItemThreshold: '单项取舍阈值', cutoffTotalThreshold: '累计取舍阈值', timeBoundary: '数据时间代表性要求', modelStages: '生命周期阶段', factorLibPriority: '环境影响因子库优先级' },
    defaults: {
      lifecycleScope: '摇篮到坟墓', unitType: '声明单位',
      unitDetail: '由企业按具体产品确定（声明单位 / 功能单位）',
      allocationRule: '按质量分配', cutoffItemThreshold: '1%', cutoffTotalThreshold: '5%',
      timeBoundary: '覆盖产品实际生产周期（通常为最近一个完整年度），并满足数据时间代表性要求',
      modelStages: ['原材料获取阶段', '生产制造阶段', '运输分销阶段', '产品使用阶段', '报废回收阶段'],
      factorLibPriority: ['企业实测因子', '行业数据库', '国家因子库', '国际数据库']
    }
  },
  ORG: {
    scenarioKey: 'ORG', scenarioLabel: '组织碳核算',
    purpose: '定义组织核算的合并方法、排放范围、基准期与数据归集要求。',
    fields: ORG_FIELDS,
    labels: { lifecycleScope: '组织边界方法', unitType: '核算范围', unitDetail: '核算范围说明', allocationRule: '数据归集方式', timeBoundary: '核算期/基准期', modelStages: '排放源范围', factorLibPriority: '排放因子库优先级' },
    defaults: {
      lifecycleScope: '运营控制权法', unitType: '范围1+范围2',
      unitDetail: '范围一直接排放 + 范围二外购电力热力排放',
      allocationRule: '按设施归集', timeBoundary: '2025-01-01 - 2025-12-31',
      modelStages: ['直接排放', '外购电力', '外购热力'],
      factorLibPriority: ['国家因子库', '区域因子库', '企业实测因子']
    }
  },
  BJ: {
    scenarioKey: 'BJ', scenarioLabel: '北京碳市场',
    purpose: '定义北京重点排放单位核算的法人/设施边界、排放范围与报告期。',
    fields: ORG_FIELDS,
    labels: { lifecycleScope: '核算主体边界', unitType: '核算排放范围', unitDetail: '核算范围说明', allocationRule: '数据归集方式', timeBoundary: '年度报告期', modelStages: '排放源范围', factorLibPriority: '排放因子库优先级' },
    defaults: {
      lifecycleScope: '运营控制权法', unitType: '范围1+范围2',
      unitDetail: '化石燃料燃烧排放 + 工业生产过程排放 + 外购电力、热力隐含排放（DB11/T 1787 口径）',
      allocationRule: '按设施归集', timeBoundary: '2025-01-01 - 2025-12-31',
      modelStages: ['化石燃料燃烧', '工业生产过程', '外购电力热力'],
      factorLibPriority: ['北京地方因子库', '国家因子库', '企业实测因子']
    }
  },
  PARK: {
    scenarioKey: 'PARK', scenarioLabel: '园区碳核算',
    purpose: '定义园区法定地理边界、核算排放范围与年度报告期。',
    fields: PARK_FIELDS,
    labels: { lifecycleScope: '园区边界', unitType: '核算总量口径', unitDetail: '边界说明', timeBoundary: '核算年度', modelStages: '核算排放源', factorLibPriority: '排放因子库优先级' },
    defaults: {
      lifecycleScope: '园区法定地理边界', unitType: '园区年度排放总量',
      unitDetail: '园区法定地理边界内年度碳排放总量',
      timeBoundary: '2024-01-01 - 2024-12-31',
      modelStages: ['化石燃料燃烧', '能源加工转换', '净购入电力热力', '工业过程'],
      factorLibPriority: ['国家因子库', '区域因子库', '企业实测因子']
    }
  }
}
export const BOUNDARY_VALUE_MAP = {
  '摇篮到坟墓': 'cradle-to-grave',
  '摇篮到大门': 'cradle-to-gate',
  '大门到大门': 'gate-to-gate',
  '声明单位': 'declaration',
  '功能单位': 'functional',
  '参考单位': 'reference',
  '按质量分配': 'mass',
  '按经济价值分配': 'economic',
  '按能量分配': 'energy',
  '按物理量分配': 'physical',
  '按设施归集': 'facility',
  '运营控制权法': 'operational',
  '控制权法': 'operational',
  '按股权比例合并': 'equity',
  '财务控制权法': 'financial',
  '股权比例法': 'equity',
  '范围1': 'scope1',
  '范围2': 'scope2',
  '范围1+范围2': 'scope12',
  '范围1+范围2+范围3': 'scope123',
  '园区法定地理边界': 'park-geographic',
  '园区年度排放总量': 'park-total'
}
export const BOUNDARY_STORAGE_KEY = 'carbon-boundary-scenario-templates'

export function clone(value) { return JSON.parse(JSON.stringify(value)) }

function buildScenarioPrompt(tpl, defaults, purpose) {
  const fieldLines = (tpl.fields || []).map(field => {
    const label = (tpl.labels && tpl.labels[field]) || (BOUNDARY_FIELD_DEFS[field] && BOUNDARY_FIELD_DEFS[field].label) || field
    const value = defaults[field]
    const text = Array.isArray(value) ? value.join('、') : (value == null || value === '' ? '待按已选标准与当前任务确定' : String(value))
    if (tpl.scenarioKey === 'PCF' && (field === 'allowedScopes' || field === 'allowedUnitTypes')) {
      return '- ' + label + '：由运行时变量提供，不在 Prompt 正文展开'
    }
    return '- ' + label + '：' + text
  }).join('\n')
  const genericPrompt = [
    '你是核算边界配置专家。当前处于【阶段二 · 核算边界】。',
    '',
    '当前业务场景：' + tpl.scenarioLabel + '（' + tpl.scenarioKey + '）',
    '已选标准：{{standardCode}}',
    '',
    '【场景说明】',
    purpose,
    '',
    '【当前场景边界要求】',
    fieldLines,
    '',

    '【优先级】',
    '1. 已选标准的明确边界条款优先，并对默认边界进行细化或固化',
    '2. 当前场景默认边界作为第二优先级',
    '3. 工作台兜底配置仅用于标准与场景默认值缺失时',
    '',
    '【固化规则】',
    '- 标准明确规定某一边界项时，工作台应锁定为只读',
    '- 标准只给要求性表述时，保留原文并标注「标准要求」，不得自行编造日期或数值',
    '- 标准未规定的项可沿用当前场景默认值',
    '- 不得套用其他业务场景的边界字段或示例',
    '',
    '请只输出当前场景的结构化边界 JSON，不要输出无关说明。'
  ].join("\n")
  if (tpl.scenarioKey !== 'PCF') return genericPrompt
  return [
    '你是产品碳足迹（PCF）核算边界配置专家。',
    '',
    '当前业务场景：产品碳足迹（PCF）',
    '已选标准：{{standardCode}}',
    '',
    '【任务目标】',
    purpose,
    '',
    '【必须遵守】',
    '1. 以已选标准中的明确条款为最高优先级；不得自行编造标准未规定的数值、日期或限定条件。',
    '2. 产品、核算年度和功能/声明单位由当前任务决定，禁止套用其他产品或示例产品。',
    '3. 生命周期范围必须由用户确认；标准只固定纳入阶段，不得因阶段固定而锁定生命周期范围。',
    '4. 生命周期范围只能从运行时变量 {{allowedScopes}} 中选择，不得在 Prompt 正文中展开机器枚举值。',
    '5. 量化单位类型只能从运行时变量 {{allowedUnitTypes}} 中选择；单位定义必须由当前产品与标准确定。',
    '6. 生命周期范围决定核算到哪里，生命周期阶段决定模型按哪些过程组织，两者必须分别展示和确认。',
    '7. 生命周期阶段由标准明确规定时固定为纳入阶段；标准未规定时由当前场景阶段清单提供。',
    '8. 分配规则遵循：优先避免分配；无法避免时按物理关系（质量/数量/体积/热值）分配；最后才按经济价值分配。',
    '9. 取舍阈值优先采用已选标准的规定值；单项阈值与累计阈值必须分别判定、分别确认，标准未规定时默认单项 1%、累计 5%。',
    '10. 时间边界必须由用户选择；标准中的时间要求只作为推荐值，不得锁定日期或直接替代用户确认。',
    '11. 本阶段只划定可用排放因子库范围，不排定因子优先级；因子优先级由阶段五因子匹配按标准要求确定。',
    '12. 企业实测因子、标准附录因子（标准提供时）和分时分区电碳因子库属于默认可用项，不进入本阶段选择集合；本阶段只选择经企业权限开放的其他因子库。',
    '13. 其他因子库是否可用由企业权限决定；本阶段只保留权限校验入口，不在此处判定禁用。',
    '14. 分时分区电碳因子库的使用精度由单独的电力因子精度设置控制，不重复出现在因子库选择集合中。',
    '15. 不得在 Prompt 正文中展开机器枚举值，可选值统一由运行时变量传入。',
    '',
    '【当前场景约束】',
    fieldLines,
    '',
    '【输出要求】',
    '只输出当前产品的结构化边界 JSON。标准已明确的字段给出值并保留条款依据；标准未明确或需任务输入的字段留空或标注待确认，不得用示例值填充。',
    '',
    '请输出 JSON，不要输出无关说明。'
  ].join("\n")
}

export function getDefaultBoundaryTemplate(scenarioKey) {
  const tpl = BOUNDARY_DEFAULTS[scenarioKey]
  if (!tpl) return null
  const copy = clone(tpl)
  copy.promptTemplate = buildScenarioPrompt(copy, copy.defaults, copy.purpose)
  return copy
}

export function loadBoundaryOverrides() {
  try {
    const raw = localStorage.getItem(BOUNDARY_STORAGE_KEY)
    const stored = raw ? JSON.parse(raw) : {}
    const valid = Object.keys(stored).reduce((result, key) => {
      if (BOUNDARY_SCENARIO_KEYS.indexOf(key) > -1) result[key] = stored[key]
      return result
    }, {})
    if (JSON.stringify(valid) !== JSON.stringify(stored)) {
      localStorage.setItem(BOUNDARY_STORAGE_KEY, JSON.stringify(valid))
    }
    return valid
  } catch (e) { return {} }
}

export function getEditableBoundaryTemplate(scenarioKey) {
  const base = getDefaultBoundaryTemplate(scenarioKey)
  if (!base) return null
  const saved = loadBoundaryOverrides()[scenarioKey]
  if (!saved) return base
  const defaults = { ...base.defaults, ...(saved.defaults || {}) }
  const purpose = saved.purpose !== undefined ? saved.purpose : base.purpose
  return {
    ...base,
    purpose,
    defaults,
    promptTemplate: saved.promptTemplate || buildScenarioPrompt(base, defaults, purpose),
    modified: true
  }
}

export function saveBoundaryOverride(scenarioKey, template) {
  if (!scenarioKey || !template || !BOUNDARY_DEFAULTS[scenarioKey]) return false
  try {
    const overrides = loadBoundaryOverrides()
    overrides[scenarioKey] = {
      purpose: template.purpose,
      promptTemplate: template.promptTemplate,
      defaults: clone(template.defaults || {})
    }
    localStorage.setItem(BOUNDARY_STORAGE_KEY, JSON.stringify(overrides))
    return true
  } catch (e) { return false }
}

export function resetBoundaryOverride(scenarioKey) {
  try {
    const overrides = loadBoundaryOverrides()
    delete overrides[scenarioKey]
    localStorage.setItem(BOUNDARY_STORAGE_KEY, JSON.stringify(overrides))
    return true
  } catch (e) { return false }
}

export function toRuntimeBoundaryValue(value) {
  if (Array.isArray(value)) return value.map(toRuntimeBoundaryValue)
  const text = String(value == null ? '' : value).trim()
  return BOUNDARY_VALUE_MAP[text] || text
}

export function toRuntimeBoundaryTemplate(scenarioKey) {
  const tpl = getEditableBoundaryTemplate(scenarioKey)
  if (!tpl) return null
  const merged = { ...tpl.defaults }
  const result = {}
  Object.keys(merged).forEach(key => {
    if (merged[key] === null || merged[key] === undefined) return
    result[key] = toRuntimeBoundaryValue(merged[key])
  })
  result.cutoffThreshold = [result.cutoffItemThreshold, result.cutoffTotalThreshold].filter(Boolean).join('/')
  return result
}
