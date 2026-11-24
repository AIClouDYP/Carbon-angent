/**
 * 标准解析 Skill · 各业务场景的知识分组模板
 *
 * 设计说明：
 * - 分组体系预置于「标准解析」Skill 中，按业务场景各定义一套（非页面硬编码）
 * - 同一场景下所有标准共用同一套分组；标准间差异只在条目内容，不在分组结构
 * - 分组内容默认「条目列表 + 每条条款溯源」；type='table' 为表格型（如附录）
 * - REPORT 场景不预设分组：其消费方式为「选模板 + 配口径」，无知识检索环节
 *
 * 划分原则：不按标准章节目录划分，而按各场景的专业知识体系划分，
 * 保证无论解析哪份标准，知识都能归入相对稳定的分类。
 *
 * desc 字段为该分组的「覆盖内容关键词」，用于判断条款归属，
 * 与「标准解析」Skill 的 Prompt 保持一致（Prompt 中作为归类依据）。
 */

/** 分组类型 */
export const GROUP_TYPES = {
  LIST: 'list',   // 条目列表 + 条款溯源
  TABLE: 'table'  // 表格（列定义 + 行数据）
}

/**
 * PCF 产品碳足迹：8 个分组 + 附录
 * 覆盖从研究设计到结果报告的完整知识链条
 */
const PCF_GROUPS = [
  { key: 'principle', name: '基本原则与术语', desc: '核算原则/术语定义/适用范围' },
  { key: 'objective', name: '研究目的与核算对象', desc: '研究目的/产品描述/功能单位/声明单位/参考流' },
  { key: 'pcr', name: '产品类别规则与行业要求', desc: 'PCR/行业核算规则/产品特定要求/标准优先级' },
  { key: 'boundary', name: '系统边界与生命周期', desc: '生命周期阶段/系统边界/过程识别/截断原则/排除条件' },
  { key: 'data', name: '数据收集与质量管理', desc: '初级数据/次级数据/数据来源/时间地域技术代表性/数据质量评价' },
  { key: 'allocation', name: '分配原则与特殊处理', desc: '多产品分配/联产品/回收利用/生物源碳/土地利用变化/电力处理' },
  { key: 'method', name: '核算方法与结果评价', desc: '核算方法/量化要求/GWP/结果解释/不确定性分析' },
  { key: 'report', name: '报告披露与核查要求', desc: '报告内容/信息披露/第三方核查/结果声明' },
  { key: 'appendix', name: '附录', desc: '参数表/因子表等附表', type: GROUP_TYPES.TABLE }
]

/**
 * PEF 产品环境足迹：8 个分组
 * 突出多环境影响类别评价，不沿用 PCF 的单一温室气体逻辑
 */
const PEF_GROUPS = [
  { key: 'principle', name: '基本原则与术语', desc: '环境足迹原则/术语定义/评价框架' },
  { key: 'objective', name: '研究目的与产品定义', desc: '研究目的/产品描述/功能单位/参考流' },
  { key: 'pcr', name: '产品类别规则与方法要求', desc: 'PEFCR/行业规则/方法适用条件/优先级' },
  { key: 'boundary', name: '系统边界与生命周期', desc: '生命周期阶段/过程识别/边界确定/截断规则' },
  { key: 'lci', name: '生命周期清单与数据质量', desc: '初级数据/次级数据/数据来源/数据质量等级' },
  { key: 'impact', name: '环境影响评价方法', desc: '影响类别/特征化因子/归一化/加权' },
  { key: 'allocation', name: '分配原则与特殊处理', desc: '联产品分配/回收利用/循环经济/生物源材料' },
  { key: 'interpretation', name: '结果解释与报告核查', desc: '结果解释/不确定性/敏感性分析/报告核查' }
]

/**
 * ORG 组织碳核算：8 个分组
 * 核心特征：组织边界、范围一/二/三、基准年与数据修正
 */
const ORG_GROUPS = [
  { key: 'principle', name: '基本原则与术语', desc: '核算原则/温室气体种类/术语' },
  { key: 'boundary', name: '核算对象与组织边界', desc: '核算主体/组织边界/股权比例法/控制权法' },
  { key: 'scope', name: '排放范围与排放源识别', desc: '范围一/范围二/范围三/排放源分类' },
  { key: 'data', name: '活动数据与数据质量', desc: '活动数据/数据来源/数据质量/监测要求' },
  { key: 'factor', name: '排放因子与核算方法', desc: '排放因子/GWP/计算方法/单位换算' },
  { key: 'special', name: '特殊排放核算要求', desc: '生物质燃烧/购入电力/温室气体移除/抵消' },
  { key: 'result', name: '排放结果与质量控制', desc: '排放量汇总/基准年/数据修正/不确定性' },
  { key: 'report', name: '报告披露与核查要求', desc: '报告内容/披露要求/第三方核查/证据要求' }
]

/**
 * BJ 北京碳市场：8 个分组
 * 核心特征：地方政策导向、监测合规要求、具体参数与算法
 */
const BJ_GROUPS = [
  { key: 'policy', name: '政策法规与核算基本要求', desc: '北京政策/适用范围/核算原则/核算周期/报告要求' },
  { key: 'boundary', name: '核算主体与核算边界', desc: '重点排放单位/核算主体/组织边界/设施边界/核算范围' },
  { key: 'source', name: '排放源识别与分类', desc: '燃料燃烧/工业过程/购入电力热力/其他排放源' },
  { key: 'data', name: '活动数据与监测要求', desc: '活动数据/数据获取/计量器具/监测方法/记录要求' },
  { key: 'factor', name: '排放因子与参数要求', desc: '排放因子/低位发热量/含碳量/氧化率/热值/单位换算' },
  { key: 'method', name: '排放核算方法与计算规则', desc: '排放源计算方法/公式/参数选取/排放量汇总' },
  { key: 'quality', name: '数据质量控制与核查要求', desc: '数据质量管理/计量设备校准/交叉验证/异常处理' },
  { key: 'report', name: '排放报告与信息披露要求', desc: '年度报告结构/填报内容/报告表格/数据披露' }
]

/**
 * PARK 零碳园区：9 个分组
 * 核心特征：申报建设 + 核算双导向，覆盖面比组织/产品场景更宽
 */
const PARK_GROUPS = [
  { key: 'policy', name: '政策法规与建设基本要求', desc: '国家政策/指导思想/建设原则/适用范围/建设目标' },
  { key: 'condition', name: '园区建设条件与边界要求', desc: '建设主体/园区范围/园中园/四至边界/产业能源基础' },
  { key: 'accounting', name: '碳排放核算与评价指标', desc: '核算边界/核算方法/单位能耗碳排放/核心指标/引导指标' },
  { key: 'energy', name: '园区能源结构转型', desc: '可再生能源/绿电直连/绿电交易/储能/清洁供热/多能互补' },
  { key: 'efficiency', name: '园区节能降碳', desc: '能源管理/能效诊断/重点用能设备/节能改造/设备更新' },
  { key: 'industry', name: '园区产业结构优化', desc: '产业结构调整/低碳产业布局/高载能优化/绿色制造' },
  { key: 'circular', name: '资源节约与循环利用', desc: '土地集约/固废利用/余热余压/水循环/废弃物资源化' },
  { key: 'infrastructure', name: '基础设施与低碳技术应用', desc: '电力热力燃气氢能/绿色建筑/绿色交通/低碳零碳负碳技术' },
  { key: 'management', name: '能碳管理与建设实施', desc: '能碳平台/能源监测/负荷预测/建设方案/评估验收' }
]

/**
 * GF 绿色工厂：7 个分组
 * 结构逻辑：绿色制造五大特征 + 评价规则
 */
const GF_GROUPS = [
  { key: 'principle', name: '评价基本要求与原则', desc: '绿色工厂定义/评价范围/评价原则/基本要求/评价流程' },
  { key: 'energy', name: '能源低碳化', desc: '能源结构/能源消费/利用效率/可再生能源/节能降碳' },
  { key: 'resource', name: '资源高效化', desc: '原材料利用/水资源利用/资源循环/固废利用/产出效率' },
  { key: 'clean', name: '生产洁净化', desc: '清洁生产/污染物排放/污染防治/过程控制/环境管理' },
  { key: 'product', name: '产品绿色化', desc: '绿色设计/绿色产品/有害物质控制/生命周期评价' },
  { key: 'land', name: '用地集约化', desc: '土地利用效率/厂区布局/建筑集约/土地资源管理' },
  { key: 'indicator', name: '评价指标与实施要求', desc: '指标定义/指标计算/基准值引领值/评分规则/证明材料' }
]

/**
 * ZCF 零碳工厂：8 个分组
 * 核心特征：以碳为核心、MRV 体系、建设-验收闭环
 */
const ZCF_GROUPS = [
  { key: 'policy', name: '政策法规与建设基本要求', desc: '零碳工厂定义/建设原则/建设目标/政策要求/适用范围' },
  { key: 'condition', name: '申报条件与工厂边界', desc: '申报主体/绿色工厂基础/物理边界/核算边界/申报条件' },
  { key: 'accounting', name: '碳排放核算与评价指标', desc: '核算方法/单位能耗碳排放/非化石能源占比/指标计算' },
  { key: 'energy', name: '能源结构低碳转型', desc: '非化石能源利用/绿电/绿电交易/能源替代/储能' },
  { key: 'efficiency', name: '节能降碳与能效提升', desc: '能源管理/重点用能设备/能效提升/节能改造/工艺优化' },
  { key: 'technology', name: '低碳技术与减排措施', desc: '低碳技术/过程减排/设备更新/技术改造/系统减排' },
  { key: 'management', name: '碳管理体系与数据质量', desc: '碳管理制度/核算体系/监测计量/数据质量/MRV' },
  { key: 'implementation', name: '建设方案与评估验收', desc: '建设目标/年度任务/实施路径/年度自评/评估验收' }
]

/**
 * 各场景分组模板（Skill 预置）
 * REPORT 场景不预设分组：消费方式为「选模板 + 配口径」，无知识检索环节
 */
export const SKILL_GROUP_TEMPLATES = {
  PCF: PCF_GROUPS,
  PEF: PEF_GROUPS,
  ORG: ORG_GROUPS,
  BJ: BJ_GROUPS,
  PARK: PARK_GROUPS,
  GF: GF_GROUPS,
  ZCF: ZCF_GROUPS,
  REPORT: []
}

/**
 * 取场景对应的分组模板
 * @param {string} scenarioKey 场景 key
 * @returns {Array} 分组模板数组
 */
export function getGroupTemplate(scenarioKey) {
  return SKILL_GROUP_TEMPLATES[scenarioKey] || []
}

/**
 * 场景是否预设知识分组（REPORT 场景不预设）
 * @param {string} scenarioKey 场景 key
 * @returns {boolean}
 */
export function hasGroupTemplate(scenarioKey) {
  return getGroupTemplate(scenarioKey).length > 0
}

/**
 * 按场景模板补齐/规范化标准的分组结构
 * - 已有分组按 key 对齐模板（保留内容，更新名称）
 * - 模板中有但标准中缺失的分组，补空分组
 * - 标准中多出的分组保留（用户可自定义新增）
 *
 * @param {Array} existing 现有分组（structured.dimensions）
 * @param {string} scenarioKey 场景 key
 * @returns {Array} 规范化后的分组
 */
export function normalizeGroupsByTemplate(existing, scenarioKey) {
  const template = getGroupTemplate(scenarioKey)
  if (!template.length) return Array.isArray(existing) ? existing : []

  const list = Array.isArray(existing) ? existing : []
  const byKey = {}
  list.forEach(g => { if (g && g.key) byKey[g.key] = g })

  // 按模板顺序输出
  const result = template.map(t => {
    const cur = byKey[t.key]
    return {
      key: t.key,
      name: t.name,
      label: t.name,          // 兼容旧字段
      desc: t.desc,
      type: t.type || GROUP_TYPES.LIST,
      points: (cur && Array.isArray(cur.points)) ? cur.points : [],
      items: (cur && Array.isArray(cur.items)) ? cur.items : []
    }
  })

  // 保留标准中多出的自定义分组
  list.forEach(g => {
    if (!g || !g.key) return
    if (template.some(t => t.key === g.key)) return
    result.push({
      key: g.key,
      name: g.name || g.label || '自定义分组',
      label: g.label || g.name || '自定义分组',
      desc: g.desc || '',
      type: g.type || GROUP_TYPES.LIST,
      points: Array.isArray(g.points) ? g.points : [],
      items: Array.isArray(g.items) ? g.items : []
    })
  })

  return result
}
