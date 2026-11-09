import Mock from 'mockjs'

var Random = Mock.Random

var statuses = ['pending', 'running', 'completed', 'failed', 'interrupted']
var types = ['碳核算', '能源调度', '报告生成', '能碳诊断', '数据治理', '因子更新', '产品碳足迹']

var stepTemplates = {
  '碳核算': [
    { name: '数据采集', detail: '从IoT平台获取能耗原始数据，包括电、水、气、热等能源消耗记录' },
    { name: '数据治理', detail: '清洗异常值、补全缺失数据、标准化数据格式，共处理记录条' },
    { name: '因子匹配', detail: '根据行业与地区自动匹配对应排放因子库，选用最新版因子数据' },
    { name: '碳排放计算', detail: '基于IPCC方法学，按范围一/二/三分类计算碳排放量' },
    { name: '结果校验', detail: '对比历史趋势与行业基准，校验计算结果合理性' }
  ],
  '能源调度': [
    { name: '负荷预测', detail: '基于历史负荷数据与气象预报，预测未来24小时用电负荷曲线' },
    { name: '电价分析', detail: '获取日前电力市场价格信号，优化峰谷用电配比' },
    { name: '策略生成', detail: '运行优化算法，生成储能充放电与柔性负荷调度策略' },
    { name: '策略执行', detail: '下发调度指令至能源管理系统，实时监控执行状态' },
    { name: '效果评估', detail: '调度周期结束后，对比实际与基准能耗，评估优化效果' }
  ],
  '报告生成': [
    { name: '数据汇总', detail: '汇总核算周期内所有碳排放与能源消耗数据' },
    { name: '模板选择', detail: '根据报告类型（政府报送/企业内报/ESG披露）匹配对应模板' },
    { name: '内容编排', detail: '智能编排报告章节，自动生成图表与文字描述' },
    { name: '合规校验', detail: '校验报告内容是否符合相关法规与标准要求' },
    { name: '报告输出', detail: '生成PDF/Word格式报告文件，推送至指定接收方' }
  ],
  '能碳诊断': [
    { name: '指标监控', detail: '实时扫描各项能碳指标，与历史基线及行业基准对比' },
    { name: '异常识别', detail: '通过异常检测算法识别能耗突增、碳排放异常等事件' },
    { name: '根因分析', detail: '下钻分析异常时段数据，定位异常根因（设备故障/工艺变更/外部因素）' },
    { name: '建议生成', detail: '基于知识库与历史案例，生成针对性优化建议方案' },
    { name: '跟踪闭环', detail: '持续跟踪优化措施执行效果，形成诊断闭环' }
  ],
  '数据治理': [
    { name: '数据接入', detail: '对接各类数据源（IoT平台、ERP系统、手动录入）' },
    { name: '质量检查', detail: '执行数据完整性、准确性、一致性校验规则' },
    { name: '数据修复', detail: '对质量问题数据进行自动修复或标记人工处理' },
    { name: '数据入库', detail: '将治理后数据写入数据仓库，更新数据目录' }
  ],
  '因子更新': [
    { name: '因子库同步', detail: '从权威机构获取最新排放因子数据' },
    { name: '版本对比', detail: '对比新旧版本因子差异，评估影响范围' },
    { name: '因子发布', detail: '审核通过后发布新版本因子库，通知相关智能体更新引用' }
  ],
  '产品碳足迹': [
    { name: '产品建模', detail: '根据产品BOM表与工艺路线，构建产品碳足迹核算模型，定义功能单位与系统边界' },
    { name: 'LCI数据采集', detail: '采集原料获取、生产制造、运输配送、使用阶段、废弃处置全生命周期清单数据' },
    { name: '排放分配', detail: '对多产品共线生产场景进行排放量分配，基于物理关系或经济价值分配方法' },
    { name: '碳足迹计算', detail: '依据ISO 14067标准计算产品碳足迹，生成各阶段碳排放明细' },
    { name: '碳标签生成', detail: '生成产品碳标签与碳足迹声明，支持第三方核验与供应链碳披露' }
  ]
}

function generateSteps(taskType) {
  var template = stepTemplates[taskType] || stepTemplates['碳核算']
  return template.map(function(s, i) {
    return {
      id: 'step-' + Random.guid(),
      name: s.name,
      detail: s.detail,
      status: Random.pick(['completed', 'completed', 'completed', 'running', 'pending']),
      startTime: Random.datetime('yyyy-MM-dd HH:mm:ss'),
      duration: Random.integer(5, 300),
      result: i < template.length - 1 ? '成功' : Random.pick(['成功', '处理中', null])
    }
  })
}

function generateTask() {
  var taskType = Random.pick(types)
  var agentIds = ['carbon-accounting', 'energy-optimization', 'carbon-report', 'carbon-diagnosis', 'product-footprint']
  var agentNames = ['产品碳足迹智能体', '能源优化调度智能体', '能碳报告智能体', '能碳诊断智能体', '产品碳足迹核算智能体']
  var idx = Random.integer(0, agentIds.length - 1)
  return {
    id: 'TASK-' + Random.integer(10000, 99999),
    agentId: agentIds[idx],
    agentName: agentNames[idx],
    type: taskType,
    status: Random.pick(statuses),
    startTime: Random.datetime('yyyy-MM-dd HH:mm:ss'),
    duration: Random.integer(30, 3600),
    steps: generateSteps(taskType),
    summary: Random.cparagraph(1)
  }
}

var tasks = Array.from({ length: 18 }, generateTask)

// 燃油汽车产品碳足迹计算任务（基于0714燃油汽车产品碳模型样例）
tasks.unshift({
  id: 'TASK-ICE-A160',
  agentId: 'product-footprint',
  agentName: '产品碳足迹核算智能体',
  type: '产品碳足迹',
  status: 'running',
  startTime: '2026-07-14 20:30:00',
  duration: 1800,
  steps: [
    { id: 'step-ice-1', name: '产品建模', detail: '根据燃油汽车ICE-A160的BOM表与5阶段工艺路线(原材料获取/整车生产/整车分销/使用环节/报废拆解)，构建产品碳足迹核算模型，功能单位1台，系统边界摇篮到坟墓(Cradle-to-Grave)', status: 'completed', startTime: '2026-07-14 20:30:15', duration: 45, result: '成功' },
    { id: 'step-ice-2', name: 'LCI数据采集', detail: '采集原材料获取(铸造铝合金/非合金钢/热塑性塑料等13项)+整车生产(涂装/焊接/冲压/总装4工序23项)+整车分销(国际海运/公路/国内水运/公路5项)+使用环节(汽油使用/生产+轮胎/润滑剂/蓄电池等13项)+报废拆解(废塑料/废钢/柴油等11项)全生命周期清单数据，共58个排放源', status: 'running', startTime: '2026-07-14 20:31:00', duration: 120, result: '处理中' },
    { id: 'step-ice-3', name: '排放分配', detail: '对整车生产多工序共线生产场景(涂装/焊接/冲压/总装)进行排放量分配，基于物理关系分配方法', status: 'pending', startTime: null, duration: 0, result: null },
    { id: 'step-ice-4', name: '碳足迹计算', detail: '依据ISO 14067标准计算燃油汽车全生命周期碳足迹，预估15501.4 kgCO2e/台，使用环节占82.8%', status: 'pending', startTime: null, duration: 0, result: null },
    { id: 'step-ice-5', name: '碳标签生成', detail: '生成燃油汽车ICE-A160产品碳标签与碳足迹声明，支持第三方核验与供应链碳披露', status: 'pending', startTime: null, duration: 0, result: null }
  ],
  summary: '燃油汽车ICE-A160(1.6L排量)产品碳足迹核算任务，覆盖5个生命周期阶段58个排放源，使用环节汽油燃烧排放占绝对主导(82.8%)'
})

Mock.mock(/\/api\/tasks/, 'get', function(options) {
  var result = tasks.slice()
  if (options.url.indexOf('status=') !== -1) {
    var m = options.url.match(/status=(\w+)/)
    if (m) result = result.filter(function(t) { return t.status === m[1] })
  }
  return { code: 200, data: result, total: result.length, message: 'ok' }
})

Mock.mock(/\/api\/tasks\/[\w-]+/, 'get', function(options) {
  var id = options.url.split('/').pop()
  return { code: 200, data: tasks.find(function(t) { return t.id === id }) || null, message: 'ok' }
})

export function getTasks(filters) {
  filters = filters || {}
  var result = tasks.slice()
  if (filters.status) result = result.filter(function(t) { return t.status === filters.status })
  if (filters.agentId) result = result.filter(function(t) { return t.agentId === filters.agentId })
  return Promise.resolve({ data: result, total: result.length })
}
