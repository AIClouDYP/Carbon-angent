import Mock from 'mockjs'

var Random = Mock.Random

var notifications = [
  {
    id: 'notif-001',
    agentId: 'carbon-diagnosis',
    agentName: '能碳诊断智能体',
    title: '碳排放异常告警',
    description: '园区B电力消耗异常偏高（+23%），3号制冷机组COP值下降，需要立即检修',
    severity: 'high',
    status: 'pending',
    time: '2026-06-10 09:35:00',
    suggestedAction: '下发检修工单至运维团队，切换备用制冷机组',
    taskId: 'TASK-45210',
    interventionOptions: [
      { label: '下发检修工单', action: 'create_work_order', icon: 'el-icon-document' },
      { label: '切换备用机组', action: 'switch_equipment', icon: 'el-icon-refresh' },
      { label: '人工确认忽略', action: 'ignore', icon: 'el-icon-close' }
    ],
    businessPage: '/equipment/diagnosis?deviceId=chiller-03'
  },
  {
    id: 'notif-002',
    agentId: 'energy-optimization',
    agentName: '能源优化调度智能体',
    title: '调度策略执行异常',
    description: '储能系统充电指令下发失败，EMS系统返回超时，当前SOC仅45%，影响今日晚高峰放电计划',
    severity: 'high',
    status: 'pending',
    time: '2026-06-10 08:15:00',
    suggestedAction: '检查EMS系统连接状态，手动重试调度指令下发',
    taskId: 'TASK-45208',
    interventionOptions: [
      { label: '重试指令下发', action: 'retry', icon: 'el-icon-refresh-right' },
      { label: '切换手动模式', action: 'manual_mode', icon: 'el-icon-setting' },
      { label: '跳转EMS控制台', action: 'goto_ems', icon: 'el-icon-link' }
    ],
    businessPage: '/energy/ems/control'
  },
  {
    id: 'notif-003',
    agentId: 'carbon-accounting',
    agentName: '产品碳足迹智能体',
    title: '数据源接入异常',
    description: '园区C的IoT数据源连接失败，影响该园区碳排放数据核算（影响范围：3家企业、约15%碳排放量）',
    severity: 'medium',
    status: 'pending',
    time: '2026-06-10 07:50:00',
    suggestedAction: '检查IoT平台数据接口状态，确认数据源配置是否正确',
    taskId: 'TASK-45205',
    interventionOptions: [
      { label: '重新连接数据源', action: 'reconnect', icon: 'el-icon-connection' },
      { label: '手动上传数据', action: 'upload', icon: 'el-icon-upload' },
      { label: '跳过本次核算', action: 'skip', icon: 'el-icon-video-pause' }
    ],
    businessPage: '/data-source/iot/config'
  },
  {
    id: 'notif-004',
    agentId: 'carbon-report',
    agentName: '能碳报告智能体',
    title: '报告模板匹配失败',
    description: 'ESG披露报告生成时，无法匹配到符合最新GRI标准的模板版本，报告生成已暂停',
    severity: 'medium',
    status: 'pending',
    time: '2026-06-09 16:40:00',
    suggestedAction: '更新报告模板库，导入最新GRI标准模板',
    taskId: 'TASK-45198',
    interventionOptions: [
      { label: '使用旧版模板', action: 'use_old_template', icon: 'el-icon-files' },
      { label: '导入新模板', action: 'import_template', icon: 'el-icon-upload2' },
      { label: '手动编排', action: 'manual', icon: 'el-icon-edit' }
    ],
    businessPage: '/report/templates/manage'
  },
  {
    id: 'notif-005',
    agentId: 'carbon-diagnosis',
    agentName: '能碳诊断智能体',
    title: '排放因子库过期提醒',
    description: '当前使用的电力排放因子版本（2024版）已有更新版本（2025版），建议尽快更新以确保核算准确性',
    severity: 'low',
    status: 'pending',
    time: '2026-06-09 10:00:00',
    suggestedAction: '审核新版排放因子并发布更新',
    taskId: null,
    interventionOptions: [
      { label: '预览更新内容', action: 'preview', icon: 'el-icon-view' },
      { label: '一键更新因子', action: 'update_factors', icon: 'el-icon-upload' },
      { label: '暂不处理', action: 'dismiss', icon: 'el-icon-close' }
    ],
    businessPage: '/factors/manage'
  },
  {
    id: 'notif-006',
    agentId: 'product-footprint',
    agentName: '产品碳足迹核算智能体',
    title: '产品LCI数据缺失',
    description: '产品"光伏组件-550W单晶硅"的原料获取阶段缺少多晶硅料运输数据，影响范围一排放计算准确性，碳足迹结果可能偏低约8%',
    severity: 'high',
    status: 'pending',
    time: '2026-06-10 10:20:00',
    suggestedAction: '联系上游供应商补充运输能耗数据，或使用行业缺省值进行估算',
    taskId: 'TASK-45215',
    interventionOptions: [
      { label: '联系供应商补数据', action: 'request_supplier_data', icon: 'el-icon-message' },
      { label: '使用缺省值估算', action: 'use_default', icon: 'el-icon-magic-stick' },
      { label: '暂停该产品核算', action: 'pause', icon: 'el-icon-video-pause' }
    ],
    businessPage: '/footprint/accounting/data-collection?product=pv-550w'
  },
  {
    id: 'notif-007',
    agentId: 'product-footprint',
    agentName: '产品碳足迹核算智能体',
    title: '排放分配方法需确认',
    description: '产品"锂电池-280Ah"与"锂电池-100Ah"共线生产，当前使用经济价值分配法，但两者产值占比接近，建议确认是否切换为物理量分配',
    severity: 'medium',
    status: 'pending',
    time: '2026-06-10 09:05:00',
    suggestedAction: '审核分配方法，确认产品产值数据后选择最优分配方案',
    taskId: 'TASK-45212',
    interventionOptions: [
      { label: '维持经济分配', action: 'keep_economic', icon: 'el-icon-check' },
      { label: '切换物理量分配', action: 'switch_physical', icon: 'el-icon-switch' },
      { label: '手动设定比例', action: 'manual_ratio', icon: 'el-icon-edit' }
    ],
    businessPage: '/footprint/accounting/emission-detail?product=battery-280ah'
  }
]

Mock.mock(/\/api\/notifications/, 'get', function(options) {
  var result = notifications.slice()
  if (options.url.indexOf('status=') !== -1) {
    var m = options.url.match(/status=(\w+)/)
    if (m) result = result.filter(function(n) { return n.status === m[1] })
  }
  return { code: 200, data: result, total: result.length, message: 'ok' }
})

Mock.mock(/\/api\/notifications\/unread-count/, 'get', function() {
  return {
    code: 200,
    data: notifications.filter(function(n) { return n.status === 'pending' }).length
  }
})

Mock.mock(/\/api\/notifications\/[\w-]+\/intervene/, 'post', function(options) {
  var match = options.url.match(/\/notifications\/([\w-]+)\/intervene/)
  var id = match ? match[1] : ''
  var notif = notifications.find(function(n) { return n.id === id })
  if (notif) {
    notif.status = 'resolved'
    notif.resolvedTime = Random.datetime('yyyy-MM-dd HH:mm:ss')
  }
  return { code: 200, data: { success: true, resolvedTime: notif ? notif.resolvedTime : null }, message: '干预成功' }
})

export function getNotifications() {
  return Promise.resolve({ data: notifications.slice() })
}

export function getUnreadCount() {
  return Promise.resolve({ data: notifications.filter(function(n) { return n.status === 'pending' }).length })
}
