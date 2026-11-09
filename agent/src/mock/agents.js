import Mock from 'mockjs'

const agents = [
  {
    id: 'product-footprint',
    name: '产品碳足迹核算智能体',
    icon: 'footprint',
    iconBg: '#2C8CF0',
    description: '面向产品全生命周期的碳足迹核算，覆盖原料获取、生产、运输、使用及废弃阶段，支持ISO 14067与PAS 2050标准',
    status: 'running',
    todayCompleted: 67,
    todayRunning: 4,
    todayExceptions: 2,
    capabilities: ['LCI分析', '产品碳足迹', '供应链追溯', '碳标签生成']
  },
  {
    id: 'carbon-accounting',
    name: '组织碳核算',
    icon: 'carbon',
    iconBg: '#00A870',
    description: '负责碳排放量自动核算、排放因子智能匹配、数据质量治理，支持多标准合规核算',
    status: 'online',
    todayCompleted: 128,
    todayRunning: 3,
    todayExceptions: 0,
    capabilities: ['自动核算', '因子匹配', '数据治理', '合规校验']
  },
  {
    id: 'carbon-report',
    name: '能碳报告智能体',
    icon: 'report',
    iconBg: '#722ED1',
    description: '自动生成碳排放报告、能源审计报告、合规披露文件，支持多模板智能编排',
    status: 'online',
    todayCompleted: 45,
    todayRunning: 2,
    todayExceptions: 0,
    capabilities: ['报告生成', '模板编排', '合规审查', '数据可视化']
  },
  {
    id: 'carbon-diagnosis',
    name: '能碳诊断智能体',
    icon: 'diagnosis',
    iconBg: '#ED7B2F',
    description: '智能识别能耗异常、碳排放超标问题，提供根因分析与优化建议',
    status: 'error',
    todayCompleted: 32,
    todayRunning: 1,
    todayExceptions: 3,
    capabilities: ['异常检测', '根因分析', '趋势预测', '优化建议']
  },
  {
    id: 'energy-optimization',
    name: '能源优化调度智能体',
    icon: 'energy',
    iconBg: '#0052D9',
    description: '基于负荷预测与实时电价，智能优化园区能源调度策略，降低用能成本与碳排放',
    status: 'running',
    todayCompleted: 86,
    todayRunning: 5,
    todayExceptions: 1,
    capabilities: ['负荷预测', '调度优化', '需量管理', '成本分析']
  }
]

Mock.mock(/\/api\/agents/, 'get', function() {
  return {
    code: 200,
    data: agents,
    message: 'ok'
  }
})

Mock.mock(/\/api\/agents\/(\w-)+/, 'get', function(options) {
  var match = options.url.match(/\/api\/agents\/([\w-]+)/)
  var id = match ? match[1] : ''
  return {
    code: 200,
    data: agents.find(function(a) { return a.id === id }) || null,
    message: 'ok'
  }
})

export function getAgents() {
  return Promise.resolve({ data: agents })
}
