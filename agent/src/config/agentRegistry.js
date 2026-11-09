/**
 * 智能体注册表 — 单一数据源
 *
 * 新增智能体只需在本文件中添加一条记录，无需修改路由菜单或侧边栏。
 * 所有智能体统一从"应用中心"卡片列表进入。
 */

export const agentRegistry = [
  {
    id: 'product-footprint',
    name: '产品碳足迹核算智能体',
    icon: 'ai-core',
    color: '#67C23A',
    category: '碳足迹',
    desc: '智能对话引导产品全生命周期碳足迹核算，内置国际/国内/地方三级核算标准与权威因子库，九阶段智能分析+供应链追溯+碳标签生成，一键覆盖从原料获取到废弃阶段',
    status: '可用',
    route: '/agent-center/apps/carbon-accounting',
    todayCompleted: 67,
    todayRunning: 4,
    todayExceptions: 2,
    capabilities: ['智能对话引导', '三级标准+因子库', '九阶段智能分析', '供应链追溯+碳标签']
  },
  {
    id: 'product-environment-footprint',
    name: '产品环境足迹核算智能体',
    icon: 'el-icon-s-marketing',
    color: '#00A8A0',
    category: '环境足迹',
    desc: '基于产品碳足迹扩展的多类别环境影响评估，支持PEF方法论12个影响类别可选（气候变化/水资源/酸化/富营养化/资源消耗等），复用LCA九阶段工作流+多类别影响矩阵+归一化分析，对标欧盟PEF绿色贸易壁垒',
    status: '可用',
    route: '/pef-accounting/accounting/agent',
    todayCompleted: 18,
    todayRunning: 2,
    todayExceptions: 0,
    capabilities: ['PEF多类别核算', '12影响类别可选', 'LCA九阶段复用', '多类别影响矩阵+归一化']
  },
  {
    id: 'org-carbon-accounting',
    name: '组织碳排放核算智能体',
    icon: 'el-icon-office-building',
    color: '#00A870',
    category: '碳核算',
    desc: '智能对话引导核算全流程，多标准自适应规则引擎一键接入与自动更新，覆盖组织范围1-3碳排放精准核算+智能合规校验+七级溯源，标准不再追、数据不再搬、核算不再算',
    status: '可用',
    route: '/agent-center/apps/org-accounting',
    todayCompleted: 128,
    todayRunning: 3,
    todayExceptions: 0,
    capabilities: ['智能对话引导', '多标准自适应', '范围1-3一键核算', '合规校验+七级溯源']
  },
  {
    id: 'zero-carbon-park',
    name: '园区碳排放核算智能体',
    icon: 'el-icon-school',
    color: '#8B5CF6',
    category: '碳核算',
    desc: '面向产业园区的碳排放全景核算与零碳路径规划，支持园区企业/公共配套/能源供应三维度核算+可再生能源抵消+蒙特卡洛不确定性分析+敏感度排序，助力园区实现碳达峰碳中和目标',
    status: '可用',
    route: '/park-accounting/accounting/agent',
    todayCompleted: 32,
    todayRunning: 1,
    todayExceptions: 0,
    capabilities: ['园区三维度核算', '可再生能源抵消', '蒙特卡洛不确定性', '敏感度排序+零碳路径']
  },
  {
    id: 'beijing-carbon-market',
    name: '北京碳市场智能体',
    icon: 'el-icon-s-flag',
    color: '#E6A23C',
    category: '碳市场',
    desc: '基于组织碳核算引擎，固定匹配北京碳市场核算标准（北京市企业CO₂核算和报告指南+碳排放权交易管理办法+配额核定方案），支持重点排放单位排放核算、配额履约数据填报与核查对接',
    status: '可用',
    route: '/beijing-carbon/accounting/agent',
    todayCompleted: 12,
    todayRunning: 1,
    todayExceptions: 0,
    capabilities: ['北京碳市场标准固定', 'Scope 1/2/3核算', '配额履约数据填报', '核查对接']
  },
  {
    name: '智慧报告',
    icon: 'el-icon-document-checked',
    color: '#722ED1',
    category: '报告',
    desc: '智能对话驱动数据补录替代传统表格式填报，四类口径智能适配转换（指标名/范围/计算口径/粒度聚合）完全替代人工调整，双引擎合规校验+频次驱动自动报送闭环，口径不再调、表不再填、报不再催',
    status: '可用',
    route: '/agent-center/apps/report-submission',
    todayCompleted: 45,
    todayRunning: 2,
    todayExceptions: 0,
    capabilities: ['智能对话补录', '四类口径适配', '双引擎合规校验', '频次自动报送闭环']
  }
]
