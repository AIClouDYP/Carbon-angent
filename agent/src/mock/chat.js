import Mock from 'mockjs'

var Random = Mock.Random

var quickQuestions = [
  '本月碳排放总量是多少？',
  '上周能源消耗趋势如何？',
  '当前有哪些异常需要处理？',
  '请生成本月碳排放报告',
  '对比上月，碳排放增减幅度？'
]

var agentReplies = {
  'carbon-accounting': [
    {
      text: '根据最新核算结果，本月（截至今日）园区碳排放总量为 **1,283.6 tCO₂e**，其中范围一排放 412.8 tCO₂e，范围二排放 870.8 tCO₂e。较上月同期下降 3.2%。',
      data: {
        type: 'metrics',
        title: '本月碳排放概览',
        items: [
          { label: '碳排放总量', value: '1,283.6 tCO₂e', trend: -3.2 },
          { label: '范围一排放', value: '412.8 tCO₂e', trend: -1.8 },
          { label: '范围二排放', value: '870.8 tCO₂e', trend: -4.1 },
          { label: '碳强度', value: '0.38 tCO₂e/万元', trend: -5.6 }
        ]
      }
    },
    {
      text: '当前碳排放核算任务执行完毕。本次核算覆盖了 3 个园区、12 个企业的数据，共匹配 47 个排放因子。以下是详细执行过程，请查看右侧面板。'
    },
    {
      text: '根据数据质量检查，发现园区A的电表数据存在 3 处缺失值，已自动补全。详细补全逻辑请查看"数据治理"步骤。'
    }
  ],
  'energy-optimization': [
    {
      text: '今日负荷预测已完成。预测今日峰值负荷为 **8.2 MW**（17:00-18:00），谷值 **3.1 MW**（03:00-04:00）。建议储能系统在凌晨充电、晚高峰放电，预计可节约用电成本 **12,800 元**。',
      data: {
        type: 'chart',
        title: '24小时负荷预测曲线',
        chartData: {
          hours: ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'],
          forecast: [3.5, 3.1, 3.3, 4.8, 6.5, 7.2, 7.8, 7.5, 8.0, 8.2, 6.8, 4.5],
          actual: [3.6, 3.0, 3.2, 5.0, 6.7, 7.1, 7.6, 7.4, 8.1, null, null, null]
        }
      }
    },
    {
      text: '优化调度策略已生成并下发。当前储能系统正在执行充电计划（SOC 35% → 85%），预计 2 小时后完成。实时状态请任务监控页面查看。'
    }
  ],
  'carbon-report': [
    {
      text: '本月的碳排放报告已自动生成完毕。报告包含碳排放总量、分范围统计、分企业明细、同比环比分析以及优化建议。您可以点击下方链接预览或下载报告。',
      data: {
        type: 'report',
        title: '2026年6月碳排放报告',
        reportUrl: '/report/2026-06',
        status: '已生成',
        pages: 24
      }
    }
  ],
  'carbon-diagnosis': [
    {
      text: '⚠️ 诊断发现异常：园区B的昨日电力消耗异常偏高（较基线 +23%）。经根因分析，初步定位为 3 号制冷机组效率下降导致。建议立即安排设备检修。',
      data: {
        type: 'diagnosis',
        title: '异常诊断结果',
        severity: 'warning',
        items: [
          { label: '异常指标', value: '电力消耗' },
          { label: '偏差幅度', value: '+23%' },
          { label: '影响时段', value: '2026-06-09 08:00-18:00' },
          { label: '根因设备', value: '3号制冷机组' },
          { label: '建议措施', value: '安排设备检修，切换至备用机组' }
        ]
      }
    },
    {
      text: '持续监控中，制冷机组 COP 值已从 4.2 降至 3.1，建议尽快干预。您可以通过右侧面板的"一键干预"下发检修工单。'
    }
  ],
  'product-footprint': [
    {
      text: '产品"光伏组件-550W单晶硅"的碳足迹核算已完成。依据 ISO 14067 标准，功能单位为 1 块组件（550Wp），系统边界覆盖原料获取至出厂阶段（cradle-to-gate）。\n\n核算结果：**总碳足迹 312.4 kgCO₂e/块**，其中多晶硅料生产占 58.2%，硅片切割占 15.7%，电池片制造占 12.3%，组件封装占 8.8%，运输占 5.0%。',
      data: {
        type: 'metrics',
        title: '产品碳足迹核算结果',
        items: [
          { label: '产品名称', value: '光伏组件-550W单晶硅' },
          { label: '功能单位', value: '1 块组件 (550Wp)' },
          { label: '总碳足迹', value: '312.4 kgCO₂e', trend: -4.5 },
          { label: '碳强度', value: '0.568 kgCO₂e/W', trend: -3.1 },
          { label: '核算标准', value: 'ISO 14067' },
          { label: '生命周期阶段', value: '原料获取→出厂 (cradle-to-gate)' }
        ]
      }
    },
    {
      text: '⚠️ 异常提醒：产品"光伏组件-550W单晶硅"的原料获取阶段缺少多晶硅料运输数据（供应商未上报）。当前已使用 Ecoinnet 缺省值临时估算，建议尽快联系供应商补充实测数据以提升核算精度。'
    },
    {
      text: '产品"锂电池-280Ah"与"锂电池-100Ah"共线生产，排放分配方法需确认。当前默认采用经济价值分配法（280Ah 占比 72%，100Ah 占比 28%）。如需切换为物理关系分配法（按容量比 73.7%/26.3%），请在任务详情中确认。',
      data: {
        type: 'metrics',
        title: '排放分配方案',
        items: [
          { label: '共线产品', value: '锂电池-280Ah / 锂电池-100Ah' },
          { label: '当前分配方法', value: '经济价值分配法' },
          { label: '280Ah 分配比例', value: '72.0%' },
          { label: '100Ah 分配比例', value: '28.0%' },
          { label: '待确认状态', value: '需人工确认' }
        ]
      }
    },
    {
      text: '今日已完成 4 个产品的碳足迹核算，其中 2 个产品已生成碳标签。碳标签包含产品碳足迹值、核算标准、功能单位及第三方核验状态，可直接用于供应链碳披露。'
    }
  ]
}

var defaultReply = {
  text: '收到您的问题。我正在分析相关数据，请稍候...\n\n根据当前数据，建议您查看任务监控页面了解最新执行状态。如需详细分析，请指定具体的时间范围或指标。'
}

Mock.mock(/\/api\/chat\/send/, 'post', function(options) {
  var body = JSON.parse(options.body)
  var agentId = body.agentId || 'carbon-accounting'
  var replies = agentReplies[agentId] || [defaultReply]
  var reply = replies[Random.integer(0, replies.length - 1)]

  return {
    code: 200,
    data: {
      id: 'msg-' + Random.guid(),
      content: reply.text,
      data: reply.data || null,
      taskId: 'TASK-' + Random.integer(10000, 99999),
      taskStatus: Random.pick(['running', 'completed'])
    },
    message: 'ok'
  }
})

export function sendMessage(payload) {
  var agentId = (payload && payload.agentId) || 'carbon-accounting'
  var replies = agentReplies[agentId] || [defaultReply]
  var reply = replies[Random.integer(0, replies.length - 1)]
  return Promise.resolve({
    data: {
      id: 'msg-' + Random.guid(),
      content: reply.text,
      data: reply.data || null,
      taskId: 'TASK-' + Random.integer(10000, 99999),
      taskStatus: Random.pick(['running', 'completed'])
    }
  })
}

export function getQuickQuestions() {
  return Promise.resolve({ data: quickQuestions })
}
