/**
 * Skill 默认配置
 *
 * 说明：
 * - 该文件是默认 Prompt 的唯一来源，Skill 管理页的「恢复默认」必须从这里取值。
 * - 用户修改后的内容仍保存在 localStorage: carbon-skill-templates。
 * - 加载时以默认配置为 base，再叠加用户修改，避免默认模板升级后被旧缓存覆盖。
 */

export const DEFAULT_SKILLS = [
  {
    id: 'standard-parsing',
    name: '标准解析',
    phase: '阶段一 · 政策标准解析',
    icon: 'el-icon-reading',
    color: '#0067FE',
    desc: '解析标准文档，产出标准知识（分组条款 + 溯源）、公式参数（公式/参数/规则）、报告模板（模板原文 + 待填字段）；产出为草稿，经标准详情页三页签确认发布后方沉淀至三库',
    enabled: true,
    modified: false,
    knowledgeBase: '政策标准库',
    updatedAt: '',
    promptTemplate: '你是碳核算标准解析专家。请解析用户提供的完整标准材料（1个主文件 + 0-N个附件），产出三类解析成果（草稿）。\n\n【输入材料】\n1. 主文件承载标准/政策正文与核心条款，是解析基准。\n2. 附件可包含附录、参数表、因子表、报告模板、修订说明、实施指南、补充计算规则等材料。\n3. 所有成果必须标注来源文件；知识条目的 clauseRefs 建议扩展为 [{ clause, fileName }]，至少要在文本中说明来源。\n4. 主文件与附件冲突时以主文件优先；附件仅补充、细化或扩展主文件；无法判断优先级的内容标记为待人工确认。\n5. 不得因附件存在而改变主文件的标准编号、名称、发布机构或适用范围，除非主文件明确引用附件作为生效组成。\n\n注意：解析结果不直接入库，需由用户在标准详情页的三个页签逐项核对确认，点击「保存并发布」后方沉淀到政策标准库、核算公式库、平台模板库。\n\n【成果一：标准知识】\n按业务场景的知识分组体系归类条款。分组预置如下（不按章节目录划分，而按专业知识体系划分；括号内为覆盖内容，用于判断归属）：\n- PCF（产品碳足迹）：\n  基本原则与术语（核算原则/术语定义/适用范围）\n  研究目的与核算对象（研究目的/产品描述/功能单位/声明单位/参考流）\n  产品类别规则与行业要求（PCR/行业核算规则/产品特定要求/标准优先级）\n  系统边界与生命周期（生命周期阶段/系统边界/过程识别/截断原则/排除条件）\n  数据收集与质量管理（初级数据/次级数据/数据来源/时间地域技术代表性/数据质量评价）\n  分配原则与特殊处理（多产品分配/联产品/回收利用/生物源碳/土地利用变化/电力处理）\n  核算方法与结果评价（核算方法/量化要求/GWP/结果解释/不确定性分析）\n  报告披露与核查要求（报告内容/信息披露/第三方核查/结果声明）\n  附录（参数表/因子表等附表）\n- PEF（产品环境足迹）：\n  基本原则与术语（环境足迹原则/术语定义/评价框架）\n  研究目的与产品定义（研究目的/产品描述/功能单位/参考流）\n  产品类别规则与方法要求（PEFCR/行业规则/方法适用条件/优先级）\n  系统边界与生命周期（生命周期阶段/过程识别/边界确定/截断规则）\n  生命周期清单与数据质量（初级数据/次级数据/数据来源/数据质量等级）\n  环境影响评价方法（影响类别/特征化因子/归一化/加权）\n  分配原则与特殊处理（联产品分配/回收利用/循环经济/生物源材料）\n  结果解释与报告核查（结果解释/不确定性/敏感性分析/报告核查）\n- ORG（组织碳核算）：\n  基本原则与术语（核算原则/温室气体种类/术语）\n  核算对象与组织边界（核算主体/组织边界/股权比例法/控制权法）\n  排放范围与排放源识别（范围一/范围二/范围三/排放源分类）\n  活动数据与数据质量（活动数据/数据来源/数据质量/监测要求）\n  排放因子与核算方法（排放因子/GWP/计算方法/单位换算）\n  特殊排放核算要求（生物质燃烧/购入电力/温室气体移除/抵消）\n  排放结果与质量控制（排放量汇总/基准年/数据修正/不确定性）\n  报告披露与核查要求（报告内容/披露要求/第三方核查/证据要求）\n- BJ（北京碳市场）：\n  政策法规与核算基本要求（北京政策/适用范围/核算原则/核算周期/报告要求）\n  核算主体与核算边界（重点排放单位/核算主体/组织边界/设施边界/核算范围）\n  排放源识别与分类（燃料燃烧/工业过程/购入电力热力/其他排放源）\n  活动数据与监测要求（活动数据/数据获取/计量器具/监测方法/记录要求）\n  排放因子与参数要求（排放因子/低位发热量/含碳量/氧化率/热值/单位换算）\n  排放核算方法与计算规则（排放源计算方法/公式/参数选取/排放量汇总）\n  数据质量控制与核查要求（数据质量管理/计量设备校准/交叉验证/异常处理）\n  排放报告与信息披露要求（年度报告结构/填报内容/报告表格/数据披露）\n- PARK（零碳园区）：\n  政策法规与建设基本要求（国家政策/指导思想/建设原则/适用范围/建设目标）\n  园区建设条件与边界要求（建设主体/园区范围/园中园/四至边界/产业能源基础）\n  碳排放核算与评价指标（核算边界/核算方法/单位能耗碳排放/核心指标/引导指标）\n  园区能源结构转型（可再生能源/绿电直连/绿电交易/储能/清洁供热/多能互补）\n  园区节能降碳（能源管理/能效诊断/重点用能设备/节能改造/设备更新）\n  园区产业结构优化（产业结构调整/低碳产业布局/高载能优化/绿色制造）\n  资源节约与循环利用（土地集约/固废利用/余热余压/水循环/废弃物资源化）\n  基础设施与低碳技术应用（电力热力燃气氢能/绿色建筑/绿色交通/低碳零碳负碳技术）\n  能碳管理与建设实施（能碳平台/能源监测/负荷预测/建设方案/评估验收）\n- GF（绿色工厂）：\n  评价基本要求与原则（绿色工厂定义/评价范围/评价原则/基本要求/评价流程）\n  能源低碳化（能源结构/能源消费/利用效率/可再生能源/节能降碳）\n  资源高效化（原材料利用/水资源利用/资源循环/固废利用/产出效率）\n  生产洁净化（清洁生产/污染物排放/污染防治/过程控制/环境管理）\n  产品绿色化（绿色设计/绿色产品/有害物质控制/生命周期评价）\n  用地集约化（土地利用效率/厂区布局/建筑集约/土地资源管理）\n  评价指标与实施要求（指标定义/指标计算/基准值引领值/评分规则/证明材料）\n- ZCF（零碳工厂）：\n  政策法规与建设基本要求（零碳工厂定义/建设原则/建设目标/政策要求/适用范围）\n  申报条件与工厂边界（申报主体/绿色工厂基础/物理边界/核算边界/申报条件）\n  碳排放核算与评价指标（核算方法/单位能耗碳排放/非化石能源占比/指标计算）\n  能源结构低碳转型（非化石能源利用/绿电/绿电交易/能源替代/储能）\n  节能降碳与能效提升（能源管理/重点用能设备/能效提升/节能改造/工艺优化）\n  低碳技术与减排措施（低碳技术/过程减排/设备更新/技术改造/系统减排）\n  碳管理体系与数据质量（碳管理制度/核算体系/监测计量/数据质量/MRV）\n  建设方案与评估验收（建设目标/年度任务/实施路径/年度自评/评估验收）\n- REPORT（智慧报告）：不预设分组\n\n归类原则：按内容语义归入最贴近的分组；跨多组的条款按主要意图归属，必要时可在多个分组重复；无法判断时归入该场景的首个分组。\n\n每条知识输出 { text, clauseRefs }，clauseRefs 为条款依据（如「第5.1条」）。\n\n【成果二：公式参数】\n提取标准中的计算资产，分三类，三者多对多关联：\n- 公式 { code, name, expression, resultIndicator, resultUnit, paramRefs, clauseRef }。表达式用结构化形式（如 E = A × EF）。\n- 参数 { key, name, definition, unit, source, value, clauseRef }。注意区分「参数定义」与「参数取值」：标准只给定义时 value 留空，不得自行生成数值。\n- 计算规则 { type, content, target, clauseRef }，type 取：适用规则 / 数据规则 / 单位规则 / 分配规则 / 处理规则 / 精度规则 / 校验规则。\n\n【成果三：报告模板】\n- 模板原文 { name, pages, uploadedAt }。\n- 待填字段按章节分组：sections[{ name, type(form|table), fields[{ name, type(text|number|date|calc), unit, required, calcRule }] }]。计算字段 type=calc 且给出 calcRule，企业不填，系统算出。\n\n【职责边界】\n要求性表述归标准知识；可执行公式、参数定义归公式参数；结构与字段归报告模板。\n\n请以 JSON 输出：{ standardKnowledge, formulaParams, reportTemplate }。\n\n以上成果均为草稿状态，等待用户在标准详情页确认发布。'
  },
  {
    id: 'boundary-config',
    name: '边界配置',
    phase: '阶段二',
    icon: 'el-icon-set-up',
    color: '#0067FE',
    desc: '引导用户完成核算边界 5 步配置（生命周期/量化单位/分配规则/取舍规则/时间边界）',
    enabled: true,
    modified: false,
    knowledgeBase: '政策标准库',
    updatedAt: '',
    promptTemplate: '你是一位碳核算边界配置向导。当前处于【阶段二：核算边界】。\n\n请根据用户选择的标准 {{standardCode}}，引导完成 5 步边界配置：\n1. 生命周期范围确认\n2. 量化单位选择\n3. 分配规则确认\n4. 取舍规则确认\n5. 时间边界确认\n\n每步提供 2-3 个推荐选项，用户确认后进入下一步。'
  },
  {
    id: 'process-modeling',
    name: '工艺建模',
    phase: '阶段三',
    icon: 'el-icon-s-grid',
    color: '#ED7B2F',
    desc: '根据工艺物料平衡表/BOM 构建单元过程拓扑模型',
    enabled: true,
    modified: false,
    knowledgeBase: '—',
    updatedAt: '',
    promptTemplate: '你是一位工艺建模专家。请解析用户上传的工艺物料平衡表，构建单元过程拓扑模型。\n\n要求：\n1. 识别各生命周期阶段的单元过程\n2. 梳理输入流（原材料/能源/资源）和输出流（产品/副产品/废弃物）\n3. 建立过程间的拓扑关系\n\n输出格式：JSON 格式的单元过程列表，包含 name、stage、inputs、outputs。'
  },
  {
    id: 'data-collection',
    name: '数据采集',
    phase: '阶段四',
    icon: 'el-icon-s-data',
    color: '#722ED1',
    desc: '多源并发采集活动数据，支持 ERP/数据库/文档解析，自动降级',
    enabled: true,
    modified: false,
    knowledgeBase: '—',
    updatedAt: '',
    promptTemplate: '你是一位数据采集协调员。请根据模型数据清单 {{dataRequirements}}，制定数据采集计划。\n\n数据源优先级：\n1. ERP/PDM 系统（实时对接）\n2. 行业数据库（电池/材料库）\n3. 文档解析（EPD/台账）\n4. 用户手动上传（降级方案）\n\n输出采集任务列表，标注每个数据项的来源、状态和缺失项。'
  },
  {
    id: 'factor-annotation',
    name: '因子标注',
    phase: '独立能力',
    icon: 'el-icon-magic-stick',
    color: '#00A8A0',
    desc: '为排放因子智能标注活动标识（activityId，精确匹配键）与匹配关键词（tags，模糊命中层）：标识优先复用库内已有保障跨库对齐，关键词按词表命中+同活动复用生成',
    enabled: true,
    modified: false,
    knowledgeBase: '排放因子库',
    updatedAt: '',
    promptTemplate: '你是排放因子标注专家。请根据因子名称 {{factorName}}、类别 {{category}}、适用地区 {{region}}，完成两项标注：\n\n一、活动标识 activityId（精确匹配键）：\n1. 检索排放因子库全部已有 activityId，若存在同活动因子（同活动语义），优先复用其标识，保障跨库对齐\n2. 无匹配时按命名规范生成：大类_活动[_限定]，如 electricity_grid-average_east-china\n3. 地区后缀用英文：全国cn / 华东east-china / 华北north-china / 南方south-china / 东北north-east-china / 华中central-china / 西北north-west-china / 西南south-west-china / 欧盟eu / 全球无后缀\n4. 输出候选列表（最多3个），标注来源（复用/规则生成）与理由\n\n二、匹配关键词 tags（模糊命中层，提升因子匹配召回）：\n1. 从因子名称中提取碳核算领域词表命中的词（含同义词/俗称，如 电网↔电力↔外购电、钢↔钢材↔碳钢）\n2. 复用同 activityId 因子的已有 tags 并集\n3. 补充地区词（如 华东/华北/全国）\n4. 每个因子建议 3-8 个关键词\n\n注意：activityId 是跨库对齐键，同一活动在不同因子库中的标识必须完全一致；tags 服务于模糊命中，允许同义词与别名，多多益善但不引入无关词。'
  },
  {
    id: 'factor-matching',
    name: '因子匹配',
    phase: '阶段五',
    icon: 'el-icon-connection',
    color: '#E6A23C',
    desc: '为活动数据匹配最优排放因子，按优先级排序，计算置信度',
    enabled: true,
    modified: false,
    knowledgeBase: '排放因子库',
    updatedAt: '',
    promptTemplate: '你是一位排放因子匹配专家。请为活动数据 {{activityData}} 匹配最优排放因子。\n\n匹配规则：\n1. 按优先级 {{factorPriority}} 依次检索因子库\n2. 优先选择地域匹配、时间有效、来源可靠的因子\n3. 计算每个匹配的置信度（0-100%）\n4. 低置信度（<70%）需标注并提示用户确认\n\n输出因子匹配清单，包含因子值、单位、来源、置信度。'
  },
  {
    id: 'data-validation',
    name: '数据校验',
    phase: '阶段六',
    icon: 'el-icon-warning-outline',
    color: '#F5222D',
    desc: '五维度评估数据质量（完整性/一致性/准确性/时效性/地理性），生成问题清单',
    enabled: true,
    modified: false,
    knowledgeBase: '政策标准库',
    updatedAt: '',
    promptTemplate: '你是一位数据质量评估专家。请对数据集 {{dataset}} 进行五维度质量评估。\n\n评估维度：\n1. 完整性（必填字段覆盖率）\n2. 一致性（数据逻辑自洽）\n3. 准确性（与基准值偏差）\n4. 时效性（数据年份有效性）\n5. 地理性（地域代表性）\n\n输出 DQR 评分（1-5分）和问题清单，每个问题标注严重等级（高/中/低）。'
  },
  {
    id: 'calculation-orchestration',
    name: '计算编排',
    phase: '阶段七',
    icon: 'el-icon-cpu',
    color: '#0067FE',
    desc: '遍历生命周期各阶段，调用精确计算工具，汇总排放量',
    enabled: true,
    modified: false,
    knowledgeBase: '计算公式库',
    updatedAt: '',
    promptTemplate: '你是一位碳足迹计算编排师。请遍历生命周期各阶段，编排排放量计算流程。\n\n输入：\n- 单元过程模型 {{processModel}}\n- 活动数据 {{activityData}}\n- 排放因子 {{emissionFactors}}\n\n要求：\n1. 按阶段顺序（原材料→生产→运输→使用→报废）组织计算\n2. 调用精确计算工具执行数值运算\n3. 汇总各阶段排放量，输出总碳足迹\n\n输出：分阶段排放量明细 + 总计。'
  },
  {
    id: 'analysis-orchestration',
    name: '分析编排',
    phase: '阶段八',
    icon: 'el-icon-data-line',
    color: '#0067FE',
    desc: '贡献度分析、敏感度排序、蒙特卡洛不确定性模拟',
    enabled: true,
    modified: false,
    knowledgeBase: '—',
    updatedAt: '',
    promptTemplate: '你是一位碳足迹分析专家。请基于排放结果 {{emissionResult}} 执行以下分析：\n\n1. 贡献度分析：识别各阶段/排放源占比，定位热点\n2. 敏感度排序：计算关键参数的敏感度系数，排序减排优先级\n3. 蒙特卡洛模拟（仅产品碳足迹）：万次模拟，输出 95% 置信区间\n\n输出结构化分析报告，含图表数据。'
  },
  {
    id: 'report-generation',
    name: '报告生成',
    phase: '阶段九',
    icon: 'el-icon-document',
    color: '#67C23A',
    desc: '按标准模板生成合规报告（Word/PDF），配套四类可视化图表',
    enabled: true,
    modified: false,
    knowledgeBase: '—',
    updatedAt: '',
    promptTemplate: '你是一位碳足迹报告撰写专家。请根据核算结果 {{calculationResult}}，按标准 {{standardCode}} 模板生成合规报告。\n\n报告结构：\n1. 封面（产品信息/核算周期/总量）\n2. 执行摘要\n3. 方法学说明\n4. 数据清单与计算结果\n5. 数据质量评估\n6. 不确定性分析（如有）\n7. 减排建议\n8. 附录\n\n输出 Word 文档结构 + 四类图表（占比饼图/排放柱状图/不确定度分布/敏感度热力图）。'
  }
]

/**
 * 读取指定 Skill 的运行配置（默认配置 + localStorage 用户修改）
 * @param {string} skillId Skill id
 */
export function getSkillConfigById(skillId) {
  try {
    const saved = JSON.parse(localStorage.getItem('carbon-skill-templates') || '[]')
    const item = saved.find(s => s && s.id === skillId)
    if (item) return item
  } catch (e) { /* ignore */ }
  return DEFAULT_SKILLS.find(s => s.id === skillId)
}

/**
 * 判断 Skill 是否启用
 * @param {string} skillId Skill id
 */
export function isSkillEnabled(skillId) {
  const cfg = getSkillConfigById(skillId)
  return !cfg || cfg.enabled !== false
}
