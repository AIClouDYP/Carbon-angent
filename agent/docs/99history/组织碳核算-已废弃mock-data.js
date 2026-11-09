// ============================================================================
// 【已废弃 · 归档于 2026-10-12】
// 原路径：agent/src/pages/zcip/org-accounting/accounting/mock/data.js
//
// 归档原因：该文件未被任何代码引用（全 src 检索 0 命中），但内含与生效实现不一致的
//   「看起来已完成」内容——15 类范围三 / 6 态任务状态 / 4 套标准 / 7 阶段流程，
//   易导致现状盘点与开发误判（见《组织碳核算-现状核对（2026-10-12）》§4.1）。
//
// 现状以 accounting/agentCoreMixin.js 与 agentChatMixin.js 内置数据为准。
// 请勿再引用本文件；如需恢复，请先核对与生效实现的一致性。
// ============================================================================

// 组织碳核算智能体 Mock 数据
// 特点：核算对象唯一（当前登录用户所属企业），任务为不同核算周期
export const currentOrg = {
  orgName: '小米汽车',
  orgLevel: '企业级',
  industry: '汽车生产制造',
  standard: 'ISO 14064-1 + GHG Protocol',
  boundaryType: '运营控制边界',
  scope3Categories: ['上游运输', '外购商品与服务', '员工通勤']
}

export const mockTasks = [
  {
    id: 'OCA-2026-001',
    orgName: '小米汽车',
    orgLevel: '企业级',
    period: '2026年度',
    periodStart: '2026-01-01',
    periodEnd: '2026-12-31',
    standard: 'ISO 14064-1 + GHG Protocol',
    boundaryType: '运营控制边界',
    scope3Categories: ['上游运输', '外购商品与服务', '员工通勤'],
    status: 'DATA_COLLECTING',
    progress: 45,
    totalEmission: 17280.5,
    scope1Emission: 55.2,
    scope2Emission: 15720.3,
    scope3Emission: 1505.0,
    unit: 'tCO₂e',
    isCurrent: true,
    createdAt: '2026-06-15',
    updatedAt: '2026-07-02'
  },
  {
    id: 'OCA-2025-002',
    orgName: '小米汽车',
    orgLevel: '企业级',
    period: '2025年度',
    periodStart: '2025-01-01',
    periodEnd: '2025-12-31',
    standard: 'ISO 14064-1 + GHG Protocol',
    boundaryType: '运营控制边界',
    scope3Categories: ['上游运输', '外购商品与服务', '员工通勤'],
    status: 'COMPLETED',
    progress: 100,
    totalEmission: 16245.8,
    scope1Emission: 52.3,
    scope2Emission: 14890.5,
    scope3Emission: 1303.0,
    unit: 'tCO₂e',
    createdAt: '2025-06-15',
    updatedAt: '2025-12-31'
  },
  {
    id: 'OCA-2024-003',
    orgName: '小米汽车',
    orgLevel: '企业级',
    period: '2024年度',
    periodStart: '2024-01-01',
    periodEnd: '2024-12-31',
    standard: 'ISO 14064-1 + GHG Protocol',
    boundaryType: '运营控制边界',
    scope3Categories: ['上游运输', '外购商品与服务', '员工通勤'],
    status: 'COMPLETED',
    progress: 100,
    totalEmission: 15890.2,
    scope1Emission: 48.6,
    scope2Emission: 14560.8,
    scope3Emission: 1280.8,
    unit: 'tCO₂e',
    createdAt: '2024-06-10',
    updatedAt: '2024-12-28'
  }
]

export const taskStatusMap = {
  CREATED: { label: '已创建', color: '#909399' },
  DATA_COLLECTING: { label: '数据采集', color: '#0067FE' },
  COMPLIANCE: { label: '合规校验', color: '#0067fe' },
  CALCULATING: { label: '核算中', color: '#409EFF' },
  COMPLETED: { label: '已完成', color: '#52c41a' },
  FAILED: { label: '失败', color: '#F56C6C' }
}

// 核算标准选项
export const standardOptions = [
  { value: 'iso14064', label: 'ISO 14064-1', desc: '组织层面温室气体量化与报告规范', recommended: true },
  { value: 'ghg_protocol', label: 'GHG Protocol Corporate Standard', desc: '温室气体核算体系企业标准', recommended: true },
  { value: 'gbt32150', label: 'GB/T 32150', desc: '工业企业温室气体排放核算通用指南', recommended: false },
  { value: 'ghg_scope3', label: 'GHG Protocol Scope 3 Standard', desc: '范围3核算与报告标准', recommended: false }
]

// 组织边界选项
export const boundaryOptions = [
  { value: 'operational', label: '运营控制边界', desc: '对运营拥有控制权的所有设施（推荐）', recommended: true },
  { value: 'equity', label: '股权比例边界', desc: '按股权份额比例合并报告' },
  { value: 'legal', label: '法人边界', desc: '仅包含法人实体范围内排放源' }
]

// 范围3可选类别
export const scope3CategoryOptions = [
  { value: 'upstream_transport', label: '上游运输与配送', required: false },
  { value: 'purchased_goods', label: '外购商品与服务', required: false },
  { value: 'employee_commuting', label: '员工通勤', required: false },
  { value: 'business_travel', label: '商务旅行', required: false },
  { value: 'waste_disposal', label: '废弃物处理', required: false },
  { value: 'capital_goods', label: '资本货物', required: false },
  { value: 'fuel_energy_related', label: '燃料与能源相关活动(未纳入范围1/2)', required: false },
  { value: 'downstream_transport', label: '下游运输与配送', required: false },
  { value: 'processing_sold_products', label: '售出产品加工', required: false },
  { value: 'use_sold_products', label: '售出产品使用', required: false },
  { value: 'end_of_life', label: '售出产品报废处理', required: false },
  { value: 'franchise', label: '特许经营', required: false },
  { value: 'investments', label: '投资', required: false },
  { value: 'leased_assets', label: '租赁资产(上游)', required: false },
  { value: 'downstream_leased', label: '租赁资产(下游)', required: false }
]

// 历史对话 Mock 数据
export const mockConversations = [
  { id: 'C-001', name: '2026年度碳排放核算咨询', preview: '关于2026年度范围1/2/3排放数据采集与因子匹配...', messageCount: 12, updateTime: '2026-07-02 10:30' },
  { id: 'C-002', name: '范围3排放源筛选讨论', preview: '上游运输与外购商品是否纳入范围3核算...', messageCount: 8, updateTime: '2026-06-20 15:20' },
  { id: 'C-003', name: '2025年度核算报告复核', preview: '2025年度碳排放核算结果与同比分析...', messageCount: 15, updateTime: '2025-12-28 09:15' },
  { id: 'C-004', name: '电碳因子匹配咨询', preview: '华东电网2025年度排放因子选取方法...', messageCount: 5, updateTime: '2025-06-18 14:00' }
]

// 排放源清单 Mock 数据（按范围分类）
export const mockEmissionSources = [
  // 范围1 — 直接排放
  { id: 'S1-01', scope: 1, name: '柴油消耗', source: '备用发电机/锅炉', unit: 't', factor: 3.096, factorSource: 'IPCC AR6', status: 'active' },
  { id: 'S1-02', scope: 1, name: '天然气消耗', source: '办公供暖/工艺', unit: '万m³', factor: 2.162, factorSource: 'GB/T 32150附录', status: 'active' },
  { id: 'S1-03', scope: 1, name: '汽油消耗', source: '公司公务车辆', unit: 't', factor: 2.925, factorSource: 'IPCC AR6', status: 'active' },
  // 范围2 — 外购能源间接
  { id: 'S2-01', scope: 2, name: '外购电力', source: '华东电网', unit: '万kWh', factor: 0.581, factorSource: '国家生态环境部2025', status: 'active' },
  { id: 'S2-02', scope: 2, name: '外购热力', source: '区域热网', unit: 'GJ', factor: 0.11, factorSource: '省级因子库', status: 'active' },
  // 范围3 — 其他间接
  { id: 'S3-01', scope: 3, name: '上游运输', source: '原材料物流运输', unit: 't·km', factor: 0.00012, factorSource: 'CPCD 2024', status: 'active' },
  { id: 'S3-02', scope: 3, name: '外购商品与服务', source: '主要原材料采购', unit: 't', factor: null, factorSource: '供应商碳数据声明', status: 'pending' },
  { id: 'S3-03', scope: 3, name: '员工通勤', source: '员工上下班交通', unit: 'km·人', factor: null, factorSource: 'AI估算模型', status: 'active' }
]

// 核算维度选项
export const dimensionOptions = [
  { value: 'park', label: '园区级' },
  { value: 'enterprise', label: '企业级' },
  { value: 'workshop', label: '车间级' }
]

// 排放因子示例
export const emissionFactors = [
  { id: 'ef-electricity-east', name: '华东区域电网排放因子', value: 0.581, unit: 'tCO₂/MWh', source: '国家生态环境部2025', region: '华东', scope: '范围2', category: '外购电力', validity: '2025-2027', priority: 1 },
  { id: 'ef-natural-gas', name: '天然气燃烧排放因子', value: 2.162, unit: 'tCO₂/万m³', source: 'GB/T 32150附录', region: '全国', scope: '范围1', category: '燃料燃烧', validity: '2024-2026', priority: 1 },
  { id: 'ef-diesel', name: '柴油燃烧排放因子', value: 3.096, unit: 'tCO₂/t', source: 'IPCC AR6', region: '全国', scope: '范围1', category: '燃料燃烧', validity: '2024-2026', priority: 2 },
  { id: 'ef-steam', name: '外购蒸汽排放因子', value: 0.11, unit: 'tCO₂/GJ', source: '地方标准', region: '北京', scope: '范围2', category: '外购热力', validity: '2025-2027', priority: 1 },
  { id: 'ef-commuting-bus', name: '员工通勤-公交排放因子', value: 0.048, unit: 'kgCO₂/km·人', source: 'GHG Protocol默认值', region: '全国', scope: '范围3', category: '员工通勤', validity: '2024-2026', priority: 3 },
  { id: 'ef-transport-truck', name: '上游运输-卡车排放因子', value: 0.12, unit: 'kgCO₂/t·km', source: 'GHG Protocol默认值', region: '全国', scope: '范围3', category: '上游运输', validity: '2024-2026', priority: 3 }
]

// 活动数据示例
export const activityData = [
  { id: 'ad-001', category: '范围1-燃料燃烧', source: '柴油', amount: 18.5, unit: '吨', efId: 'ef-diesel', emission: 57.78, dataQuality: '实测', completeness: '100%' },
  { id: 'ad-002', category: '范围1-燃料燃烧', source: '天然气', amount: 120000, unit: 'm³', efId: 'ef-natural-gas', emission: 259.44, dataQuality: '实测', completeness: '100%' },
  { id: 'ad-003', category: '范围2-外购电力', source: '华东电网外购电', amount: 2850000, unit: 'kWh', efId: 'ef-electricity-east', emission: 16528.5, dataQuality: '电费账单', completeness: '98%' },
  { id: 'ad-004', category: '范围2-外购热力', source: '外购蒸汽', amount: 850, unit: 'GJ', efId: 'ef-steam', emission: 93.5, dataQuality: '发票', completeness: '100%' },
  { id: 'ad-005', category: '范围3-上游运输', source: '原材料物流', amount: 580000, unit: 't·km', efId: 'ef-transport-truck', emission: 696.0, dataQuality: '物流台账', completeness: '85%' },
  { id: 'ad-006', category: '范围3-员工通勤', source: '员工通勤', amount: 2400000, unit: 'km·人', efId: 'ef-commuting-bus', emission: 115.2, dataQuality: 'AI估算', completeness: '75%' },
  { id: 'ad-007', category: '范围3-外购商品与服务', source: '办公用品+IT设备', amount: 856.82, unit: 'tCO₂e', efId: null, emission: 856.82, dataQuality: '供应商数据', completeness: '70%' }
]

// 合规校验规则
export const complianceRules = [
  { id: 'cr-001', rule: '范围1覆盖率应达到100%', type: '完整性', severity: 'MUST', description: '所有直接排放源必须被覆盖' },
  { id: 'cr-002', rule: '范围2覆盖率应≥95%', type: '完整性', severity: 'MUST', description: '外购能源数据覆盖率不低于95%' },
  { id: 'cr-003', rule: '范围3覆盖率建议≥80%', type: '完整性', severity: 'WARNING', description: '范围3数据覆盖率低于80%时需说明原因' },
  { id: 'cr-004', rule: '年度碳排放同比波动不应超过±15%', type: '一致性', severity: 'WARNING', description: '同比增幅超过15%需提供增长原因说明' },
  { id: 'cr-005', rule: '电力消耗×排放因子=碳排放量（逻辑验证）', type: '逻辑', severity: 'MUST', description: '验证计算结果与因子计算的一致性' },
  { id: 'cr-006', rule: '报告必须包含核算方法说明', type: '合规', severity: 'MUST', description: 'ISO 14064-1要求披露核算方法' }
]

// 核算步骤定义（7个阶段）
export const accountingSteps = [
  { index: 1, name: '标准与边界选择', key: 'STANDARD_BOUNDARY', icon: 'el-icon-setting', color: '#0067FE' },
  { index: 2, name: '活动数据采集', key: 'DATA_COLLECTION', icon: 'el-icon-document', color: '#409EFF' },
  { index: 3, name: '排放因子匹配', key: 'FACTOR_MATCHING', icon: 'el-icon-connection', color: '#0067fe' },
  { index: 4, name: '碳排放计算', key: 'EMISSION_CALCULATION', icon: 'el-icon-s-data', color: '#0067fe' },
  { index: 5, name: '合规校验', key: 'COMPLIANCE_CHECK', icon: 'el-icon-warning', color: '#F56C6C' },
  { index: 6, name: '不确定度分析', key: 'UNCERTAINTY_ANALYSIS', icon: 'el-icon-data-analysis', color: '#909399' },
  { index: 7, name: '报告生成与溯源', key: 'REPORT_GENERATION', icon: 'el-icon-document-checked', color: '#52c41a' }
]
