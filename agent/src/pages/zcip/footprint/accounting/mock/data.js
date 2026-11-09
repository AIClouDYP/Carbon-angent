/**
 * 产品碳足迹核算智能体 - Mock 数据
 * 包含：任务、排放源、核算结果、溯源树、治理数据等
 */

// ==================== 任务相关 ====================
export const mockTasks = [
  {
    id: 'TASK-20260910001',
    productName: '6.5MW陆上风电机组',
    productModel: 'EN-171/6.5',
    organizationName: 'XX风电装备制造有限公司',
    orgLevel: '企业级',
    functionalUnit: '1 台（全生命周期 20 年，度电碳足迹 gCO2e/kWh）',
    periodStart: '2025-01-01',
    periodEnd: '2044-12-31',
    status: 'COMPLETED',
    progress: 100,
    totalEmission: 5.56,
    unit: 'gCO2e/kWh（度电碳足迹）',
    createdAt: '2026-09-05 09:20:00',
    completedAt: '2026-09-08 17:40:00',
    emissionScopes: ['scope1', 'scope2', 'scope3'],
    factorVersion: 'GB/T 24067-2024 (LCA全生命周期)',
    aiOptions: { autoFill: true, anomalyDetect: true, supplyChain: true }
  },
  {
    id: 'TASK-20260624001',
    productName: '新能源汽车 EV700',
    productModel: 'EV-700-LFP-2024',
    organizationName: 'XX新能源汽车制造有限公司',
    orgLevel: '企业级',
    functionalUnit: '1 辆',
    periodStart: '2025-01-01',
    periodEnd: '2025-12-31',
    status: 'COMPLETED', // CREATED, DATA_COLLECTING, CALCULATING, GOVERNANCE, COMPLETED, FAILED
    progress: 100,
    totalEmission: 72.35,
    unit: 'kgCO2e',
    createdAt: '2026-06-20 10:30:00',
    completedAt: '2026-06-21 15:45:00',
    emissionScopes: ['scope1', 'scope2', 'scope3'],
    factorVersion: 'GB/T-2024-v2.1',
    aiOptions: { autoFill: true, anomalyDetect: true, supplyChain: false }
  },
  {
    id: 'TASK-20260624002',
    productName: '锂离子动力电池 50kWh',
    productModel: 'LIB-50K-2024',
    organizationName: 'XX新能源产业园-A3产线',
    orgLevel: '产线级',
    functionalUnit: '1 个',
    periodStart: '2025-03-01',
    periodEnd: '2025-09-30',
    status: 'CALCULATING',
    progress: 68,
    totalEmission: null,
    unit: 'kgCO2e',
    createdAt: '2026-06-24 08:15:00',
    completedAt: null,
    emissionScopes: ['scope1', 'scope2'],
    factorVersion: 'GB/T-2024-v2.1',
    aiOptions: { autoFill: true, anomalyDetect: true, supplyChain: false }
  },
  {
    id: 'TASK-20260623005',
   productName: '聚酯纤维面料 T400',
    productModel: 'PET-T400-BLK',
    organizationName: 'XX纺织集团-一分厂',
    orgLevel: '产线级',
    functionalUnit: '1 kg',
    periodStart: '2025-06-01',
    periodEnd: '2025-06-30',
    status: 'GOVERNANCE',
    progress: 85,
    totalEmission: 18.62,
    unit: 'kgCO2e',
    createdAt: '2026-06-23 14:00:00',
    completedAt: null,
    emissionScopes: ['scope1', 'scope2', 'scope3'],
    factorVersion: 'GB/T-2024-v2.0',
    aiOptions: { autoFill: true, anomalyDetect: true, supplyChain: true }
  },
  {
    id: 'TASK-20260622008',
    productName: '水泥 P.O 42.5',
    productModel: 'CEM-PO42.5',
    organizationName: 'YY建材股份-总厂',
    orgLevel: '企业级',
    functionalUnit: '1 吨',
    periodStart: '2025-04-01',
    periodEnd: '2025-04-30',
    status: 'FAILED',
    progress: 45,
    totalEmission: null,
    unit: 'kgCO2e',
    createdAt: '2026-06-22 09:20:00',
    completedAt: null,
    emissionScopes: ['scope1', 'scope2'],
    factorVersion: 'GB/T-2024-v2.1',
    aiOptions: { autoFill: false, anomalyDetect: true, supplyChain: false }
  },
  {
    id: 'TASK-20260714001',
    productName: '燃油汽车 ICE-A160',
    productModel: 'ICE-A160-1.6L-2024',
    organizationName: 'XX汽车制造有限公司-整车工厂',
    orgLevel: '产线级',
    functionalUnit: '1 台',
    periodStart: '2025-01-01',
    periodEnd: '2025-12-31',
    status: 'DATA_COLLECTING',
    progress: 25,
    totalEmission: null,
    unit: 'kgCO2e',
    createdAt: '2026-07-14 20:30:00',
    completedAt: null,
    emissionScopes: ['scope1', 'scope2', 'scope3'],
    factorVersion: 'GB/T-2024-v2.1',
    aiOptions: { autoFill: true, anomalyDetect: true, supplyChain: true },
    lifecyclePhases: ['原材料获取阶段', '生产制造阶段', '运输分销阶段', '产品使用阶段', '报废回收阶段']
  }
]

export const taskStatusMap = {
  CREATED: { label: '已创建', color: '#909399', icon: 'el-icon-document' },
  DATA_COLLECTING: { label: '数据采集中', color: '#E6A23C', icon: 'el-icon-upload' },
  CALCULATING: { label: '核算执行中', color: '#409EFF', icon: 'el-icon-loading' },
  GOVERNANCE: { label: '质量治理中', color: '#E6A23C', icon: 'el-icon-warning' },
  COMPLETED: { label: '已完成', color: '#67C23A', icon: 'el-icon-circle-check' },
  FAILED: { label: '失败', color: '#F56C6C', icon: 'el-icon-circle-close' }
}

// ==================== 产品模型库 ====================
export const mockProducts = [
  { id: 'PROD-001', name: '新能源汽车 EV700', model: 'EV-700-LFP-2024', category: '新能源产品', emissionSources: 18, weight: 2150, serviceLife: '15年/30万km', specs: '电池70kWh / 续航700km / 整备质量2150kg', packagingInfo: '专用运输架, 无一次性包装', productionLocation: '华南低碳产业园' },
  { id: 'PROD-002', name: '锂离子动力电池 50kWh', model: 'LIB-50K-2024', category: '新能源产品', emissionSources: 14, weight: 380, serviceLife: '8年/2000次循环', specs: '容量50kWh / 电压350V / 能量密度180Wh/kg', packagingInfo: '木箱+防震EPE, 约25kg', productionLocation: '华南低碳产业园' },
  { id: 'PROD-003', name: '聚酯纤维面料 T400', model: 'PET-T400-BLK', category: '纺织品', emissionSources: 12, weight: 0.25, serviceLife: '3年', specs: '幅宽150cm / 克重250g/m² / 成分100%PET', packagingInfo: '塑料薄膜卷装, 约0.5kg', productionLocation: '华东绿色制造基地' },
  { id: 'PROD-004', name: '水泥 P.O 42.5', model: 'CEM-PO42.5', category: '建材产品', emissionSources: 8, weight: 50, serviceLife: '50年(建筑结构)', specs: '强度等级42.5MPa / 密度3.15g/cm³', packagingInfo: '牛皮纸袋50kg/袋', productionLocation: '西部建材产业园' },
  { id: 'PROD-005', name: '不锈钢管 DN200', model: 'SS-DN200-304', category: '金属制品', emissionSources: 10, weight: 46.2, serviceLife: '30年', specs: '外径219mm / 壁厚6mm / 材质304', packagingInfo: '钢带捆扎, 裸管运输', productionLocation: '华东绿色制造基地' },
  { id: 'PROD-006', name: 'PET塑料瓶 500ml', model: 'PET-B500-CLEAR', category: '包装材料', emissionSources: 7, weight: 0.028, serviceLife: '一次性', specs: '容量500ml / 瓶重28g / 材质PET', packagingInfo: '瓦楞纸箱24瓶/箱', productionLocation: '华南低碳产业园' },
  { id: 'PROD-007', name: '有机蔬菜礼盒', model: 'ORG-BOX-S', category: '农产品', emissionSources: 9, weight: 3.5, serviceLife: '7天(保质期)', specs: '6种蔬菜 / 净重3kg / 礼盒400×300×120mm', packagingInfo: '可降解纸盒+冰袋, 约0.5kg', productionLocation: '西部建材产业园' },
  { id: 'PROD-008', name: '电动汽车驱动电机', model: 'EV-MOTOR-150KW', category: '汽车零部件', emissionSources: 16, weight: 85, serviceLife: '15年/30万km', specs: '功率150kW / 峰值扭矩310N·m / 转速16000rpm', packagingInfo: '木托盘+防锈膜, 约15kg', productionLocation: '华南低碳产业园' },
  { id: 'PROD-009', name: '燃油汽车 ICE-A160', model: 'ICE-A160-1.6L-2024', category: '燃油汽车', emissionSources: 58, weight: 1388, serviceLife: '15年/20万km', specs: '排量1.6L / 功率92kW / 整备质量1388kg', packagingInfo: '专用运输架, 无一次性包装', productionLocation: '华南低碳产业园' },
  { id: 'PROD-010', name: '6.5MW陆上风电机组', model: 'EN-171/6.5', category: '新能源装备', emissionSources: 32, weight: 770000, serviceLife: '20年', specs: '额定功率6.5MW / 叶轮直径171m / 塔架高度110m / 年发电小时数3500~4500h', packagingInfo: '叶片/机舱/塔筒分段运输, 专用支架', productionLocation: '北方风电产业园' }
]

// ==================== 排放源与明细数据 ====================
export const mockEmissionCategories = [
  {
    id: 'CAT-RAW',
    name: '原材料获取 (Raw Materials)',
    phase: 'raw_materials',
    emission: 125.32,
    percentage: 17.3,
    color: '#5470C6',
    children: [
      {
        id: 'ES-001',
        name: '原料A（铝合金）采购运输',
        activity: '货物运输',
        dataSource: '供应商发票+GPS里程',
        value: 2500,
        unit: 't·km',
        factorValue: 0.062,
        factorUnit: 'kgCO2e/(t·km)',
        factorSource: 'GB/T 2589-2020 表A.7',
        emission: 155.0,
        uncertainty: 8.5,
        isMaxContributor: false,
        dataQuality: 'GOOD'
      },
      {
        id: 'ES-002',
        name: '原料B（锂电池芯）开采与加工能耗',
        activity: '上游能源消耗',
        dataSource: '供应商LCA报告引用',
        value: 450,
        unit: 'kWh',
        factorValue: 0.58,
        factorUnit: 'kgCO2e/kWh',
        factorSource: '中国区域电网平均因子 2024',
        emission: 261.0,
        uncertainty: 12.3,
        isMaxContributor: false,
        dataQuality: 'MODERATE'
      },
      {
        id: 'ES-003',
        name: '包装物（纸箱+缓冲材料）生产',
        activity: '物料生产',
        dataSource: '采购单+包装规格书',
        value: 500,
        unit: 'pcs',
        factorValue: 0.008,
        factorUnit: 'kgCO2e/pcs',
        factorSource: 'IPCC 2019 包装材料因子表',
        emission: 4.0,
        uncertainty: 5.2,
        isMaxContributor: false,
        dataQuality: 'GOOD'
      },
      {
        id: 'ES-004',
        name: '稀土元素提取与精炼',
        activity: '原材料加工',
        dataSource: '供应链调查问卷',
        value: 0.015,
        unit: 'kg',
        factorValue: 320,
        factorUnit: 'kgCO2e/kg',
        factorSource: '中国稀土行业LCA数据库 v3',
        emission: 4.8,
        uncertainty: 25.0,
        isMaxContributor: false,
        dataQuality: 'POOR'
      }
    ]
  },
  {
    id: 'CAT-MFG',
    name: '生产制造 (Manufacturing)',
    phase: 'manufacturing',
    emission: 489.76,
    percentage: 67.7,
    color: '#91CC75',
    children: [
      {
        id: 'ES-005',
        name: '电力消耗 — 组装生产线',
        activity: '能源外购(范围2)',
        dataSource: '智能电表自动采集',
        value: 1200,
        unit: 'kWh',
        factorValue: 0.5503,
        factorUnit: 'kgCO2e/kWh',
        factorSource: '南方区域电网 2024年度平均',
        emission: 660.36,
        uncertainty: 3.2,
        isMaxContributor: true,
        dataQuality: 'EXCELLENT',
        detail: {
          monthlyData: [
            { month: '2025-01', value: 98, peak: 142, offPeak: 56 },
            { month: '2025-02', value: 85, peak: 120, offPeak: 50 },
            { month: '2025-03', value: 110, peak: 158, offPeak: 62 },
            { month: '2025-04', value: 105, peak: 150, offPeak: 60 },
            { month: '2025-05', value: 115, peak: 165, offPeak: 65 },
            { month: '2025-06', value: 108, peak: 155, offPeak: 61 },
            { month: '2025-07', value: 118, peak: 170, offPeak: 66 },
            { month: '2025-08', value: 122, peak: 175, offPeak: 69 },
            { month: '2025-09', value: 112, peak: 160, offPeak: 64 },
            { month: '2025-10', value: 106, peak: 152, offPeak: 60 },
            { month: '2025-11', value: 111, peak: 159, offPeak: 63 },
            { month: '2025-12', value: 115, peak: 164, offPeak: 65 }
          ],
          meterId: 'METER-E-MF-001',
          collectionMethod: 'IoT自动采集(每15分钟)'
        }
      },
      {
        id: 'ES-006',
        name: '天然气燃烧 — 热处理工序',
        activity: '直接排放(范围1)',
        dataSource: '燃气流量计读数',
        value: 35,
        unit: 'm³',
        factorValue: 2.18,
        factorUnit: 'kgCO2e/m³',
        factorSource: 'IPCC 2006 天然气燃烧系数',
        emission: 76.3,
        uncertainty: 4.5,
        isMaxContributor: false,
        dataQuality: 'GOOD'
      },
      {
        id: 'ES-007',
        name: '工艺过程排放 — 焊剂挥发VOC',
        activity: '直接排放(范围1)',
        dataSource: '排放因子估算法',
        value: 2.5,
        unit: 'kg焊剂',
        factorValue: 4.96,
        factorUnit: 'kgCO2e/kg焊剂',
        factorSource: '行业工艺排放因子库 v2.3',
        emission: 12.4,
        uncertainty: 18.0,
        isMaxContributor: false,
        dataQuality: 'MODERATE'
      },
      {
        id: 'ES-008',
        name: '压缩空气系统用电',
        activity: '能源外购(范围2)',
        dataSource: '电表分项计量',
        value: 180,
        unit: 'kWh',
        factorValue: 0.5503,
        factorUnit: 'kgCO2e/kWh',
        factorSource: '南方区域电网 2024年度平均',
        emission: 99.05,
        uncertainty: 5.0,
        isMaxContributor: false,
        dataQuality: 'GOOD'
      },
      {
        id: 'ES-009',
        name: '厂内物流叉车柴油消耗',
        activity: '直接排放(范围1)',
        dataSource: '油卡加油记录',
        value: 28,
        unit: 'L柴油',
        factorValue: 2.67,
        factorUnit: 'kgCO2e/L',
        factorSource: 'IPCC 2006 柴油移动源',
        emission: 74.76,
        uncertainty: 6.0,
        isMaxContributor: false,
        dataQuality: 'GOOD'
      }
    ]
  },
  {
    id: 'CAT-DST',
    name: '运输分销阶段 (Distribution)',
    phase: 'distribution',
    emission: 67.84,
    percentage: 9.4,
    color: '#FAC858',
    children: [
      {
        id: 'ES-010',
        name: '成品仓储耗能(空调照明)',
        activity: '能源外购(范围2)',
        dataSource: '仓库电表+面积分配法',
        value: 38,
        unit: 'kWh',
        factorValue: 0.5503,
        factorUnit: 'kgCO2e/kWh',
        factorSource: '南方区域电网 2024年度平均',
        emission: 20.91,
        uncertainty: 10.0,
        isMaxContributor: false,
        dataQuality: 'MODERATE'
      },
      {
        id: 'ES-011',
        name: '成品配送运输(工厂→分销中心)',
        activity: '货物运输',
        dataSource: '物流运单+车型参数',
        value: 380,
        unit: 't·km',
        factorValue: 0.095,
        factorUnit: 'kgCO2e/(t·km)',
        factorSource: 'GB/T 2589-2020 重型卡车',
        emission: 36.1,
        uncertainty: 8.0,
        isMaxContributor: false,
        dataQuality: 'GOOD'
      },
      {
        id: 'ES-012',
        name: '包装废弃物处理',
        activity: '废弃物处置(范围3)',
        dataSource: '废品回收记录',
        value: 3.2,
        unit: 'kg',
        factorValue: 3.36,
        factorUnit: 'kgCO2e/kg',
        factorSource: '地方固废处理因子 2024',
        emission: 10.75,
        uncertainty: 15.0,
        isMaxContributor: false,
        dataQuality: 'MODERATE'
      }
    ]
  },
  {
    id: 'CAT-EOL',
    name: '报废回收阶段 (End-of-Life)',
    phase: 'end_of_life',
    emission: 41.43,
    percentage: 5.6,
    color: '#EE6666',
    children: [
      {
        id: 'ES-013',
        name: '使用阶段充电耗电(预估3年)',
        activity: '能源外购(范围3)',
        dataSource: '使用场景模型估算',
        value: 52.5,
        unit: 'kWh/年',
        factorValue: 0.5503,
        factorUnit: 'kgCO2e/kWh',
        factorSource: '南方区域电网 2024年度平均',
        emission: 28.89 * 3,
        uncertainty: 25.0,
        isMaxContributor: false,
        dataQuality: 'POOR',
        note: '基于典型使用场景假设：日均充电0.48次'
      },
      {
        id: 'ES-014',
        name: '废弃后拆解回收处理',
        activity: '废弃物处置(范围3)',
        dataSource: '回收协议+处理报告',
        value: -12.5,
        unit: 'kgCO2e',
        factorValue: 1.0,
        factorUnit: '',
        factorSource: '回收减排信用(负排放)',
        emission: -12.5,
        uncertainty: 20.0,
        isMaxContributor: false,
        dataQuality: 'MODERATE',
        note: '负排放：金属回收抵扣'
      }
    ]
  }
]

// ==================== 溯源树数据（七级） ====================
export const mockTraceTree = {
  level1: {
    id: 'L1-001',
    level: 1,
    name: '核算报告总览',
    type: 'REPORT',
    taskId: 'TASK-20260624001',
    summary: {
      product: '新能源汽车 EV700',
      functionalUnit: '1 辆',
      totalEmission: 724.35,
      unit: 'kgCO2e',
      scope1: 163.46,
      scope2: 780.32,
      scope3: -219.43,
      completeness: 96.5,
      qualityScore: 82.3
    },
    children: ['L2-001', 'L2-002', 'L2-003']
  },
  levels: [
    // ========== L2 范围级 ==========
    {
      id: 'L2-001',
      level: 2,
      name: '范围1 直接排放',
      type: 'SCOPE',
      emission: 163.46,
      percentage: 22.6,
      parent: 'L1-001',
      children: ['L3-002']
    },
    {
      id: 'L2-002',
      level: 2,
      name: '范围2 能源间接排放',
      type: 'SCOPE',
      emission: 780.32,
      percentage: 107.7,
      parent: 'L1-001',
      children: ['L3-001', 'L3-003']
    },
    {
      id: 'L2-003',
      level: 2,
      name: '范围3 其他间接排放',
      type: 'SCOPE',
      emission: -219.43,
      percentage: -30.3,
      parent: 'L1-001',
      children: ['L3-004', 'L3-005']
    },

    // ========== L3 工序/环节级 ==========
    {
      id: 'L3-001',
      level: 3,
      name: '生产制造工序',
      type: 'PROCESS',
      emission: 759.41,
      parent: 'L2-002',
      children: ['L4-001', 'L4-002', 'L4-003', 'L4-004', 'L4-005']
    },
    {
      id: 'L3-002',
      level: 3,
      name: '燃料燃烧排放工序',
      type: 'PROCESS',
      emission: 163.46,
      parent: 'L2-001',
      children: ['L4-006', 'L4-007', 'L4-008']
    },
    {
      id: 'L3-003',
      level: 3,
      name: '运输分销阶段',
      type: 'PROCESS',
      emission: 20.91,
      parent: 'L2-002',
      children: ['L4-009']
    },
    {
      id: 'L3-004',
      level: 3,
      name: '原材料上游排放',
      type: 'PROCESS',
      emission: 424.8,
      parent: 'L2-003',
      children: ['L4-010', 'L4-011', 'L4-012', 'L4-013', 'L4-014']
    },
    {
      id: 'L3-005',
      level: 3,
      name: '报废回收阶段',
      type: 'PROCESS',
      emission: 74.16,
      parent: 'L2-003',
      children: ['L4-015', 'L4-016']
    },

    // ========== L4 排放源级 ==========
    // ---- 生产制造：电力相关 ----
    {
      id: 'L4-001',
      level: 4,
      name: '电力消耗 — 组装生产线',
      type: 'EMISSION_SOURCE',
      emission: 660.36,
      formula: 'value × factor = 1200 kWh × 0.5503 = 660.36 kgCO2e',
      parent: 'L3-001',
      children: ['L5-001']
    },
    {
      id: 'L4-002',
      level: 4,
      name: '压缩空气系统用电',
      type: 'EMISSION_SOURCE',
      emission: 99.05,
      formula: '180 kWh × 0.5503 = 99.05 kgCO2e',
      parent: 'L3-001',
      children: ['L5-002']
    },
    // ---- 生产制造：工艺过程 ----
    {
      id: 'L4-003',
      level: 4,
      name: '天然气燃烧 — 热处理工序',
      type: 'EMISSION_SOURCE',
      emission: 76.30,
      formula: '35 m³ × 2.18 = 76.30 kgCO2e',
      parent: 'L3-001',
      children: ['L5-003']
    },
    {
      id: 'L4-004',
      level: 4,
      name: '工艺过程排放 — 焊剂挥发VOC',
      type: 'EMISSION_SOURCE',
      emission: 12.40,
      formula: '2.5 kg焊剂 × 4.96 = 12.40 kgCO2e',
      parent: 'L3-001',
      children: ['L5-004']
    },
    // ---- 生产制造：厂内物流 ----
    {
      id: 'L4-005',
      level: 4,
      name: '厂内物流叉车柴油消耗',
      type: 'EMISSION_SOURCE',
      emission: 74.76,
      formula: '28 L柴油 × 2.67 = 74.76 kgCO2e',
      parent: 'L3-001',
      children: ['L5-005']
    },
    // ---- 燃料燃烧 ----
    {
      id: 'L4-006',
      level: 4,
      name: '涂装车间天然气燃烧(烘干固化)',
      type: 'EMISSION_SOURCE',
      emission: 63.10,
      formula: '29 m³ × 2.175 = 63.10 kgCO2e (含N2O修正)',
      parent: 'L3-002',
      children: ['L5-006']
    },
    {
      id: 'L4-007',
      level: 4,
      name: '厂内物流叉车柴油消耗(燃料燃烧)',
      type: 'EMISSION_SOURCE',
      emission: 74.76,
      formula: '28 L × 2.67 = 74.76 kgCO2e',
      parent: 'L3-002',
      children: ['L5-007']
    },
    {
      id: 'L4-008',
      level: 4,
      name: '应急发电机组柴油备用(未启用，按备用量估算)',
      type: 'EMISSION_SOURCE',
      emission: 25.60,
      formula: '10 L × 2.56 = 25.60 kgCO2e (备用估算)',
      parent: 'L3-002',
      children: ['L5-008']
    },
    // ---- 运输分销阶段 ----
    {
      id: 'L4-009',
      level: 4,
      name: '成品仓储耗能(空调照明)',
      type: 'EMISSION_SOURCE',
      emission: 20.91,
      formula: '38 kWh × 0.5503 = 20.91 kgCO2e',
      parent: 'L3-003',
      children: ['L5-009']
    },
    // ---- 原材料上游 ----
    {
      id: 'L4-010',
      level: 4,
      name: '铝合金车身材料采购与运输',
      type: 'EMISSION_SOURCE',
      emission: 155.00,
      formula: '2500 t·km × 0.062 = 155.00 kgCO2e',
      parent: 'L3-004',
      children: ['L5-010']
    },
    {
      id: 'L4-011',
      level: 4,
      name: '磷酸铁锂电池芯开采与加工能耗',
      type: 'EMISSION_SOURCE',
      emission: 261.00,
      formula: '450 kWh × 0.58 = 261.00 kgCO2e',
      parent: 'L3-004',
      children: ['L5-011']
    },
    {
      id: 'L4-012',
      level: 4,
      name: '包装物（纸箱+缓冲材料）生产',
      type: 'EMISSION_SOURCE',
      emission: 4.00,
      formula: '500 pcs × 0.008 = 4.00 kgCO2e',
      parent: 'L3-004',
      children: ['L5-012']
    },
    {
      id: 'L4-013',
      level: 4,
      name: '稀土永磁电机材料提取与精炼',
      type: 'EMISSION_SOURCE',
      emission: 4.80,
      formula: '0.015 kg稀土 × 320 = 4.80 kgCO2e',
      parent: 'L3-004',
      children: ['L5-013']
    },
    {
      id: 'L4-014',
      level: 4,
      name: '铜材导线采购运输碳排放',
      type: 'EMISSION_SOURCE',
      emission: 0.00,
      formula: '已包含在整车BOM上游核算中，此处不重复计算',
      parent: 'L3-004',
      children: ['L5-014']
    },
    // ---- 报废回收阶段 ----
    {
      id: 'L4-015',
      level: 4,
      name: '使用阶段充电耗电(预估15万公里全生命周期)',
      type: 'EMISSION_SOURCE',
      emission: 86.67,
      formula: '157.5 kWh/年 × 0.5503 × 1年(示例) = 86.67 kgCO2e',
      parent: 'L3-005',
      children: ['L5-015']
    },
    {
      id: 'L4-016',
      level: 4,
      name: '废弃后拆解回收处理(负排放抵扣)',
      type: 'EMISSION_SOURCE',
      emission: -12.50,
      formula: '-12.5 kgCO2e (金属回收信用)',
      parent: 'L3-005',
      children: ['L5-016']
    },

    // ============================================================
    //  L5 原始活动数据项级（Raw Activity Data）
    //  每条记录包含：原始值、单位、采集方式、采集时间、采集人/系统
    // ============================================================

    // ---- 组装线用电 L5-001 ----
    {
      id: 'L5-001',
      level: 5,
      name: '组装线年用电量原始值',
      type: 'DATA_ITEM',
      rawValue: 1200,
      unit: 'kWh',
      source: 'METER-E-MF-001 IoT智能电表',
      collectedAt: '2026-01-02 00:00:00',
      collector: 'system_auto(IoT-Gateway-v3)',
      dataSourceDetail: {
        meterId: 'METER-E-MF-001',
        meterType: '三相四线智能电表(DTSD341)',
        manufacturer: 'XX电气股份有限公司',
        accuracyClass: '0.5S级',
        installationLocation: '总装车间A线主配电柜',
        installDate: '2023-06-15',
        lastCalibration: '2025-03-10',
        calibrationValidUntil: '2026-03-09',
        collectionMethod: 'IoT自动采集，每15分钟上报一次，日聚合汇总',
        rawDataPeriod: '2025-01-01 ~ 2025-12-31（全年12个月逐月累加）',
        monthlyBreakdown: [
          { month: '2025-01', value: 98, peak: 142, offPeak: 56 },
          { month: '2025-02', value: 85, peak: 120, offPeak: 50 },
          { month: '2025-03', value: 110, peak: 158, offPeak: 62 },
          { month: '2025-04', value: 105, peak: 150, offPeak: 60 },
          { month: '2025-05', value: 115, peak: 165, offPeak: 65 },
          { month: '2025-06', value: 108, peak: 155, offPeak: 61 },
          { month: '2025-07', value: 118, peak: 170, offPeak: 66 },
          { month: '2025-08', value: 122, peak: 175, offPeak: 69 },
          { month: '2025-09', value: 112, peak: 160, offPeak: 64 },
          { month: '2025-10', value: 106, peak: 152, offPeak: 60 },
          { month: '2025-11', value: 111, peak: 159, offPeak: 63 },
          { month: '2025-12', value: 115, peak: 164, offPeak: 65 }
        ],
        dataQuality: 'EXCELLENT',
        completeness: '100%',
        notes: '全年无缺失值；2025年8月因高温天气空调负荷增加导致峰值偏高'
      },
      parent: 'L4-001',
      children: ['L6-001']
    },

    // ---- 压缩空气用电 L5-002 ----
    {
      id: 'L5-002',
      level: 5,
      name: '压缩空气系统年用电量',
      type: 'DATA_ITEM',
      rawValue: 180,
      unit: 'kWh',
      source: '电表分项计量 METER-E-COMP-002',
      collectedAt: '2026-01-02 00:00:00',
      collector: 'system_auto(IoT-Gateway-v3)',
      dataSourceDetail: {
        meterId: 'METER-E-COMP-002',
        meterType: '单相智能电表(DDZY208-Z)',
        manufacturer: 'XX仪表集团',
        accuracyClass: '1.0级',
        installationLocation: '空压机站房配电箱',
        installDate: '2023-08-20',
        lastCalibration: '2025-04-15',
        calibrationValidUntil: '2026-04-14',
        collectionMethod: 'IoT自动采集，每小时读数，日聚合',
        rawDataPeriod: '2025年度累计',
        monthlyBreakdown: null,
        dataQuality: 'GOOD',
        completeness: '100%',
        notes: '分项计量值；与总表差值在±3%以内'
      },
      parent: 'L4-002',
      children: ['L6-002']
    },

    // ---- 天然气热处理 L5-003 ----
    {
      id: 'L5-003',
      level: 5,
      name: '热处理工序天然气用量',
      type: 'DATA_ITEM',
      rawValue: 35,
      unit: 'm³',
      source: 'GAS-FLOW-HTR-001 涡轮流量计',
      collectedAt: '2026-01-02 00:00:00',
      collector: 'manual_entry(生产部-王工)',
      dataSourceDetail: {
        instrumentId: 'GAS-FLOW-HTR-001',
        instrumentType: '涡轮流量计(LWQ-A25)',
        manufacturer: 'XX自动化仪表有限公司',
        accuracyClass: '1.5级',
        installationLocation: '焊装车间热处理炉进气管道',
        installDate: '2024-01-10',
        lastCalibration: '2025-06-01',
        calibrationValidUntil: '2026-05-31',
        collectionMethod: '人工每月抄表录入MES系统',
        rawDataPeriod: '2025年度累计（月度抄表汇总）',
        monthlyRecords: [
          { period: '2025-Q1', readingStart: 12580.3, readingEnd: 12645.7, usage: 65.4 },
          { period: '2025-Q2', readingStart: 12645.7, readingEnd: 12718.2, usage: 72.5 },
          { period: '2025-Q3', readingStart: 12718.2, readingEnd: 12785.0, usage: 66.8 },
          { period: '2025-Q4', readingStart: 12785.0, readingEnd: 12854.9, usage: 69.9 }
        ],
        totalUsage: 274.6,
        allocatedToProduct: 35.0,
        allocationMethod: '按产量比例分配（本产品占该产线总产量12.75%）',
        dataQuality: 'GOOD',
        completeness: '100%',
        notes: '季度抄表，按产品产量占比分配到单车用量'
      },
      parent: 'L4-003',
      children: ['L6-003']
    },

    // ---- 焊剂VOC挥发 L5-004 ----
    {
      id: 'L5-004',
      level: 5,
      name: '焊剂使用量（VOC排放估算依据）',
      type: 'DATA_ITEM',
      rawValue: 2.5,
      unit: 'kg焊剂',
      source: '物料领用单 + BOM定额',
      collectedAt: '2026-01-03 10:30:00',
      collector: 'erp_sync(ERP-SAP-BOM模块)',
      dataSourceDetail: {
        sourceSystem: 'SAP ERP 物料管理系统',
        module: 'PP生产计划 / MM物料管理',
        documentType: '生产订单领料单(PROD-2025-EV700-xxxx)',
        materialCode: 'MAT-WELD-FLUX-LPB',
        materialName: '低氢型焊剂LPB-400',
        specification: 'GB/T 29722-2013 E501T-1',
        supplier: 'XX焊接材料有限公司',
        collectionMethod: 'ERP自动同步领料记录，按BOM理论定额+实际偏差率计算',
        theoreticalDosage: 2.2,
        actualUsage: 2.5,
        deviationRate: '13.6%',
        rawDataPeriod: '2025自然年度单车平均耗量',
        dataQuality: 'MODERATE',
        completeness: '95%',
        notes: '实际耗量高于理论定额13.6%，原因：试制阶段工艺不稳定，返工补焊较多'
      },
      parent: 'L4-004',
      children: ['L6-004']
    },

    // ---- 叉车柴油 L5-005 ----
    {
      id: 'L5-005',
      level: 5,
      name: '厂内物流柴油加油量',
      type: 'DATA_ITEM',
      rawValue: 28,
      unit: 'L柴油',
      source: '油卡管理系统 FUEL-CARD-SYS',
      collectedAt: '2026-01-02 00:00:00',
      collector: 'system_sync(FuelCard-API)',
      dataSourceDetail: {
        systemName: '中石化IC卡油品管理系统',
        apiVersion: 'v2.1',
        cardNo: '**** **** **** 8832',
        vehicleInfo: '杭叉CPCD35 叉车(3.5吨)，车牌号: 厂内-运007',
        fuelType: '国VI 0#车用柴油',
        density: '0.84 kg/L (20°C)',
        collectionMethod: '油卡消费记录API自动拉取，按行驶里程和作业台时分配到单车',
        rawDataPeriod: '2025年度累计',
        totalFuelConsumption: 4200,
        fleetSize: 5,
        allocationMethod: '按作业台时分配（本产品占用台时占总台时的3.33%）',
        allocatedToFleet: 140.0,
        allocatedToVehicle: 28.0,
        refuelRecords: [
          { date: '2025-01-15', station: '园区加油站#1', liters: 200, price: 7.32 },
          { date: '2025-02-20', station: '园区加油站#1', liters: 180, price: 7.28 },
          { date: '2025-03-18', station: '园区加油站#2', liters: 220, price: 7.25 }
        ],
        dataQuality: 'GOOD',
        completeness: '98%',
        notes: '油卡记录完整，分配基于台时日志'
      },
      parent: 'L4-005',
      children: ['L6-005']
    },

    // ---- 涂装天然气 L5-006 ----
    {
      id: 'L5-006',
      level: 5,
      name: '涂装烘干炉天然气用量',
      type: 'DATA_ITEM',
      rawValue: 29,
      unit: 'm³',
      source: 'GAS-FLOW-PNT-002 气体腰轮流量计',
      collectedAt: '2026-01-02 00:00:00',
      collector: 'scada_auto(SCADA-PaintShop-v2)',
      dataSourceDetail: {
        instrumentId: 'GAS-FLOW-PNT-002',
        instrumentType: '气体腰轮流量计(G160)',
        manufacturer: 'XX流量仪表有限公司',
        accuracyClass: '1.0级',
        installationLocation: '涂装车间烘干炉燃气进口管',
        installDate: '2023-12-01',
        lastCalibration: '2025-07-15',
        calibrationValidUntil: '2026-07-14',
        collectionMethod: 'SCADA系统实时采集，分钟级聚合',
        rawDataPeriod: '2025年度累计（SCADA历史库）',
        dataQuality: 'EXCELLENT',
        completeness: '100%',
        notes: 'SCADA在线监测数据，含温度压力补偿修正'
      },
      parent: 'L4-006',
      children: ['L6-006']
    },

    // ---- 燃烧侧叉车柴油 L5-007 ----
    {
      id: 'L5-007',
      level: 5,
      name: '燃料燃烧类-叉车柴油量(与L4-005同源，不同核算口径)',
      type: 'DATA_ITEM',
      rawValue: 28,
      unit: 'L柴油',
      source: '油卡管理系统 FUEL-CARD-SYS (同L5-005)',
      collectedAt: '2026-01-02 00:00:00',
      collector: 'system_sync(FuelCard-API)',
      dataSourceDetail: {
        note: '与L5-005为同一原始数据源，仅在范围1燃料燃烧口径下重复引用',
        crossReference: 'L5-005',
        dataQuality: 'GOOD',
        completeness: '98%'
      },
      parent: 'L4-007',
      children: ['L6-007'
      ]
    },

    // ---- 应急发电机 L5-008 ----
    {
      id: 'L5-008',
      level: 5,
      name: '应急发电机组柴油备用储量',
      type: 'DATA_ITEM',
      rawValue: 10,
      unit: 'L柴油(备用估算)',
      source: '设备台账 + 运行日志',
      collectedAt: '2026-01-01 00:00:00',
      collector: 'manual_entry(设备部-李工)',
      dataSourceDetail: {
        equipmentModel: '康明斯QSK19-G3 柴油发电机组(500kW)',
        ratedFuelConsumption: '38.5 L/h @ 100%负载',
        annualTestRunHours: 12,
        estimatedStandbyFuel: 10,
        estimationBasis: '年度测试运行油耗 + 备用启动预留',
        dataQuality: 'POOR',
        completeness: '60%',
        notes: '备用估算值，非实测消耗。建议安装燃油流量计提升数据精度'
      },
      parent: 'L4-008',
      children: ['L6-008']
    },

    // ---- 仓储能耗 L5-009 ----
    {
      id: 'L5-009',
      level: 5,
      name: '成品仓库空调照明年用电量',
      type: 'DATA_ITEM',
      rawValue: 38,
      unit: 'kWh',
      source: '仓库电表 METER-E-WH-003 + 面积分摊法',
      collectedAt: '2026-01-02 00:00:00',
      collector: 'system_auto(EnergyMgmtSys-v1)',
      dataSourceDetail: {
        meterId: 'METER-E-WH-003',
        warehouseTotalArea: 5000,
        productOccupiedArea: 280,
        areaRatio: '5.6%',
        totalWarehouseElectricity: 678.57,
        allocatedToProduct: 38.0,
        allocationMethod: '面积分摊法（产品占仓库面积比）',
        collectionMethod: '能源管理系统月度报表，按面积比例分摊',
        rawDataPeriod: '2025年度累计',
        dataQuality: 'MODERATE',
        completeness: '92%',
        notes: '分摊法引入不确定性，建议加装独立计量表'
      },
      parent: 'L4-009',
      children: ['L6-009']
    },

    // ---- 铝合金运输 L5-010 ----
    {
      id: 'L5-010',
      level: 5,
      name: '铝合金车身板运输周转量(t·km)',
      type: 'DATA_ITEM',
      rawValue: 2500,
      unit: 't·km',
      source: '供应商发货单 + GPS轨迹数据',
      collectedAt: '2026-01-03 14:20:00',
      collector: 'tms_sync(TMS-LogisticsPlatform)',
      dataSourceDetail: {
        supplierName: 'XX铝业股份有限公司',
        materialSpec: '6061-T6铝板 1.5mm/2.0mm',
        shipmentWeight: 850,
        avgTransportDistance: 2941,
        transportMode: '重型卡车(49吨GTW)',
        carrier: 'XX物流集团有限公司',
        vehiclePlate: '苏E·Uxxxx 系列',
        dataSources: ['供应商发货磅单', 'GPS车载终端轨迹', 'TMS运单'],
        collectionMethod: 'TMS平台整合运单重量与GPS里程，自动计算t·km',
        rawDataPeriod: '2025年度累计发运批次汇总',
        batchCount: 48,
        dataQuality: 'GOOD',
        completeness: '94%',
        notes: '部分早期批次缺少GPS精确里程，采用地图距离替代'
      },
      parent: 'L4-010',
      children: ['L6-010']
    },

    // ---- 电池芯加工能耗 L5-011 ----
    {
      id: 'L5-011',
      level: 5,
      name: '电池芯上游加工能耗(从供应商LCA报告引用)',
      type: 'DATA_ITEM',
      rawValue: 450,
      unit: 'kWh/辆等效',
      source: '供应商LCA报告 + 供应链调查问卷',
      collectedAt: '2025-11-15 16:00:00',
      collector: 'supplier_portal(SCM-Survey-v2)',
      dataSourceDetail: {
        supplierName: 'XX动力电池科技股份有限公司',
        batteryType: '磷酸铁锂(LFP) 70kWh pack',
        lcaReportNo: 'LCA-BATT-LFP-2024-003',
        lcaReportStandard: 'ISO 14044 + GB/T 24040',
        lcaReportReviewer: 'SGS通标认证',
        reportDate: '2024-09-30',
        coverage: 'cradle-to-gate (正极材料→电芯→模组→Pack)',
        declaredEnergyUse: 432,
        adjustmentFactor: '1.042 (调整为单车等效)',
        finalValue: 450,
        collectionMethod: '供应链碳管理平台问卷回收+LCA报告审核入库',
        surveyResponseRate: '100% (核心供应商全覆盖)',
        dataQuality: 'MODERATE',
        completeness: '88%',
        notes: '供应商声明数据，经初步审核但未做第三方现场核验'
      },
      parent: 'L4-011',
      children: ['L6-011']
    },

    // ---- 包装物生产 L5-012 ----
    {
      id: 'L5-012',
      level: 5,
      name: '包装物(纸箱+缓冲材料)用量',
      type: 'DATA_ITEM',
      rawValue: 500,
      unit: 'pcs',
      source: '采购订单 + 包装规格书',
      collectedAt: '2026-01-02 00:00:00',
      collector: 'erp_sync(ERP-MM-Procurement)',
      dataSourceDetail: {
        packagingSet: 'EV700整车包装套装 PKG-EV700-V3',
        components: [
          { name: '瓦楞外箱(AA楞)', quantity: 1, spec: '5200×2100×1900mm', material: '再生牛皮纸' },
          { name: 'EPE发泡护角', quantity: 8, spec: '600×80×80mm', material: '聚乙烯' },
          { name: '珍珠棉衬垫', quantity: 12, spec: '定制裁切', material: 'EPE发泡' },
          { name: '缠绕膜', quantity: 1, spec: '500mm×1800m', material: 'LLDPE拉伸膜' },
          { name: '木托盘', quantity: 1, spec: '4800×2000×150mm', material: '熏蒸松木' }
        ],
        purchaseOrder: 'PO-PKG-2025-0188',
        vendor: 'XX绿色包装材料有限公司',
        collectionMethod: 'ERP采购订单同步，包装BOM自动展开',
        dataQuality: 'GOOD',
        completeness: '100%',
        notes: '包装物规格已轻量化设计(V2→V3)，较上代减重8%'
      },
      parent: 'L4-012',
      children: ['L6-012']
    },

    // ---- 稀土提取 L5-013 ----
    {
      id: 'L5-013',
      level: 5,
      name: '稀土永磁电机中钕铁硼含量',
      type: 'DATA_ITEM',
      rawValue: 0.015,
      unit: 'kg稀土(钕铁硼NdFeB)/辆',
      source: '供应链碳足迹调查问卷 + 材料成分检测报告',
      collectedAt: '2025-10-20 11:00:00',
      collector: 'supplier_survey + lab_report',
      dataSourceDetail: {
        motorSupplier: 'XX驱动技术有限公司',
        motorModel: 'PM150kW-HS 永磁同步电机',
        magnetMaterial: '烧结钕铁硼 N42SH',
        magnetWeight: 4.8,
        ndFebContent: '稀土氧化物总量约32%（含Nd/Pr/Dy/Tb）',
        rareEarthEquivalent: 0.015,
        dataSources: [
          { type: '供应商问卷', title: '2025年度供应链碳足迹调查表', responseDate: '2025-10-18' },
          { type: '第三方检测', lab: 'XX金属材料分析测试中心', reportNo: 'TEST-MAT-2025-1092', method: 'ICP-OES电感耦合等离子光谱' }
        ],
        collectionMethod: '问卷填报 + 抽检复核双通道验证',
        dataQuality: 'POOR',
        completeness: '75%',
        notes: '稀土提取环节因子不确定性较大(±25%)，且不同矿场差异显著；当前使用中国行业平均值'
      },
      parent: 'L4-013',
      children: ['L6-013']
    },

    // ---- 铜材导线 L5-014 ----
    {
      id: 'L5-014',
      level: 5,
      name: '铜材线束上游碳排放（已纳入BOM上游合计）',
      type: 'DATA_ITEM',
      rawValue: 0,
      unit: 'kgCO2e (已在L4-011电池上游核算中包含)',
      source: 'BOM上游归集规则说明',
      collectedAt: '2026-01-01 00:00:00',
      collector: 'system_rule(AllocationRule-001)',
      dataSourceDetail: {
        explanation: '铜材线束作为电池Pack的子部件，其上游碳排放已包含在电池供应商LCA报告中',
        includedIn: 'L4-011 (磷酸铁锂电池芯上游)',
        avoidDoubleCountingRule: '同一物理件仅在最末级供应商处核算一次',
        copperContent: '~65 kg纯铜/辆(高压线束+电机绕组+母排)',
        estimatedIfStandalone: '~195 kgCO2e (独立核算参考值)',
        dataQuality: 'N/A',
        completeness: 'N/A',
        notes: '避免重复计数的归集规则项'
      },
      parent: 'L4-014',
      children: []
    },

    // ---- 使用阶段充电 L5-015 ----
    {
      id: 'L5-015',
      level: 5,
      name: '使用阶段年均充电电量(场景假设模型)',
      type: 'DATA_ITEM',
      rawValue: 52.5,
      unit: 'kWh/年/辆(示例年)',
      source: '使用场景模型假设 + 典型工况调研',
      collectedAt: '2026-01-01 00:00:00',
      collector: 'model_assumption(CarbonModel-v3.1)',
      dataSourceDetail: {
        scenarioName: '中国华东地区私家车主典型使用场景',
        assumptions: [
          { param: '年行驶里程', value: 15000, unit: 'km/年', basis: '中国乘联会2024新能源车主调研' },
          { param: '百公里电耗', value: 15.0, unit: 'kWh/100km', basis: 'CLTC工况实测值(整备质量2150kg)' },
          { param: '年均充电次数', value: 175, unit: '次/年', basis: '日均0.48次×365天' },
          { param: '电网覆盖区域', value: '华东电网', basis: '注册地主要使用区域' },
          { param: '生命周期年限', value: 15, unit: '年', basis: '设计使用寿命' }
        ],
        modelFormula: '年电耗 = 年里程 ÷ 100 × 百公里电耗 = 15000 ÷ 100 × 15.0 = 2250 kWh/年',
        displaySampleYear: 52.5,
        sampleNote: '展示数据为1/45年（月均等效），用于演示格式',
        fullLifecycleEmission: 2250 * 0.5503 * 15 * 1.0, // 含电网演变系数
        sensitivityRange: '+/-30% (取决于驾驶习惯和充电方式)',
        dataQuality: 'POOR',
        completeness: '60%',
        notes: '使用阶段数据高度依赖场景假设，不确定性±25%~30%。建议结合车联网实际数据迭代更新'
      },
      parent: 'L4-015',
      children: ['L6-015']
    },

    // ---- 回收拆解 L5-016 ----
    {
      id: 'L5-016',
      level: 5,
      name: '报废拆解回收减排量(负排放)',
      type: 'DATA_ITEM',
      rawValue: -12.5,
      unit: 'kgCO2e',
      source: '回收协议 + 行业回收率统计数据',
      collectedAt: '2026-01-01 00:00:00',
      collector: 'industry_stat + contract_data',
      dataSourceDetail: {
        recyclingProtocol: '《动力蓄电池回收利用管理暂行办法》工信部2019年第43号',
        recycler: 'XX资源循环利用有限公司',
        recyclingRate: {
          battery: '92% (梯次利用+再生冶炼)',
          aluminumBody: '95% (重熔回用)',
          copper: '98% (电解精炼)',
          steel: '90% (电弧炉炼钢)',
          plastics: '45% (物理回收)'
        },
        calculationBasis: '避免的原生材料生产排放（替代法/credit法）',
        methodology: 'ISO 14044 截断规则 + 中国再生材料减排因子数据库 v2024',
        avoidedEmissions: [
          { material: '钢铁(白车身)', weight: 520, factor: 1.45, credit: 754.0 },
          { material: '铝合金', weight: 310, factor: 8.24, credit: 2554.4 },
          { material: '铜', weight: 65, factor: 2.80, credit: 182.0 },
          { material: '塑料(PP/PVC)', weight: 35, factor: 2.10, credit: 73.5 }
        ],
        totalAvoided: 3563.9,
        perVehicleAllocation: -12.5,
        allocationNote: '按车辆寿命周期摊薄至单车（总避免量÷15年÷19辆车示例）',
        dataQuality: 'MODERATE',
        completeness: '70%',
        notes: '负排放采用替代法计算，方法学存在争议；部分国家/标准要求单独披露不参与总计扣减'
      },
      parent: 'L4-016',
      children: ['L6-016']
    },

    // ============================================================
    //  L6 排放因子级（Emission Factors）
    //  每条记录包含：因子值、单位、版本、发布方、有效日期、方法论
    // ============================================================

    // ---- 电网因子 L6-001 ----
    {
      id: 'L6-001',
      level: 6,
      name: '南方区域电网平均排放因子',
      type: 'FACTOR',
      factorValue: 0.5503,
      factorUnit: 'kgCO2e/kWh',
      version: 'v2024-Q4 (年度更新版)',
      effectiveDate: '2024-01-01 ~ 2024-12-31',
      publisher: '生态环境部气候司',
      factorSourceDetail: {
        officialDoc: '《关于发布2024年全国及各省级区域电网二氧化碳排放因子的公告》(公告 2025年 第3号)',
        publishDate: '2025-02-28',
        gridRegion: '南方区域电网(覆盖广东、广西、云南、贵州、海南五省区)',
        gridCoverageType: '组合边际CM + 运营边际OM 加权平均',
        omFactor: 0.4768,
        cmFactor: 0.6239,
        weightingRatio: 'OM:CM = 55%:45%',
        tdlFactor: 0.0472,
        note: '含输配电损耗(T&D loss)因子0.0472',
        methodology: 'IPCC 2006 国家温室气体清单指南 + 中国电网因子编制技术规范',
        database: '中国区域电网碳排放因子数据库 v2024',
        updateFrequency: '年度更新(通常次年2月底发布)',
        confidenceLevel: '高(A级)',
        alternativeFactors: [
          { label: '广东省电网(更精确)', value: 0.5123, note: '如工厂位于广东可采用此值' },
          { label: '全国平均(对比参考)', value: 0.5876, note: '用于跨区域对标' },
          { label: '未来年份预测(2025E)', value: 0.5210, note: '预计随可再生能源渗透率下降' }
        ]
      },
      parent: 'L5-001',
      children: ['L7-001']
    },

    // ---- 电网因子(压缩空气复用) L6-002 ----
    {
      id: 'L6-002',
      level: 6,
      name: '南方区域电网平均排放因子(同L6-001)',
      type: 'FACTOR',
      factorValue: 0.5503,
      factorUnit: 'kgCO2e/kWh',
      version: 'v2024-Q4',
      effectiveDate: '2024-01-01 ~ 2024-12-31',
      publisher: '生态环境部气候司',
      factorSourceDetail: {
        crossReference: 'L6-001 (同一因子复用)',
        note: '与组装线用电使用相同的电网因子'
      },
      parent: 'L5-002',
      children: ['L7-002']
    },

    // ---- 天然气燃烧因子 L6-003 ----
    {
      id: 'L6-003',
      level: 6,
      name: '天然气燃烧CO2排放因子',
      type: 'FACTOR',
      factorValue: 2.18,
      factorUnit: 'kgCO2e/m³',
      version: 'IPCC 2006 默认值 + 中国本土化修正',
      effectiveDate: '长期有效(基准年不变时可沿用)',
      publisher: 'IPCC(政府间气候变化专门委员会)',
      factorSourceDetail: {
        ipccTable: 'Table 1.4 (Energy/Fixed Combustion - Natural Gas)',
        ipccDefaultValue: '2.168 kgCO2/m³(低位发热量34.4 MJ/m³)',
        chinaAdjustment: '+0.012 (中国天然气组分修正，含微量CH4泄漏)',
        adjustedValue: 2.18,
        n2oCorrection: '已包含N2O当量转换(GWP100=298)',
        methodology: 'IPCC 2006 Tier1 方法 + 《省级二氧化碳排放达峰行动方案编制指南》',
        database: 'IPCC 2006 Emission Factor Database + 中国化石燃料排放因子研究(2023)',
        updateFrequency: 'IPCC每版更新(当前为AR6)',
        confidenceLevel: '高(A级)',
        alternativeFactors: [
          { label: 'GB 25189 天然气', value: 2.162, note: '国标推荐值(不含N2O)' },
          { label: '地方实测值', value: 2.205, note: '某省燃协实测均值(供参考)' }
        ]
      },
      parent: 'L5-003',
      children: ['L7-003']
    },

    // ---- 焊剂VOC因子 L6-004 ----
    {
      id: 'L6-004',
      level: 6,
      name: '焊剂/助焊剂VOC过程排放因子',
      type: 'FACTOR',
      factorValue: 4.96,
      factorUnit: 'kgCO2e/kg焊剂',
      version: '行业工艺排放因子库 v2.3',
      effectiveDate: '2023-01-01 至今',
      publisher: '中国环境科学研究院 + XX汽车工程研究院',
      factorSourceDetail: {
        sourceDocument: '《汽车涂装及焊接工艺挥发性有机物排放因子手册》v2.3',
        processCategory: '焊接/钎焊 - 低氢型焊剂',
        vocComposition: ['甲醛(HCHO)', '苯系物(BTX)', '醇类溶剂'],
        measurementMethod: '袋采样 + GC-MS/FID定量分析',
        testConditions: 'ISO 14555 标准焊接参数',
        sampleSize: 'n=15 (来自5家焊材厂商的3批次产品)',
        meanValue: 4.82,
        stdDev: 0.68,
        cv: '14.1%',
        upper95CI: 6.18,
        selectedValue: 4.96,
        selectionReason: '取95%置信上限以保守估计',
        methodology: '实测统计 + IPCC排放因子不确定性传播',
        database: '汽车制造业工艺排放因子库 v2.3 (内部维护)',
        confidenceLevel: '中等(B级)',
        alternativeFactors: [
          { label: 'EPA AP-42 焊接', value: 3.82, note: '美国EPA因子(偏小)' },
          { label: 'EEA Guidebook', value: 4.15, note: '欧洲环境署参考值' }
        ]
      },
      parent: 'L5-004',
      children: ['L7-004']
    },

    // ---- 柴油移动源因子 L6-005 ----
    {
      id: 'L6-005',
      level: 6,
      name: '柴油车用移动源排放因子',
      type: 'FACTOR',
      factorValue: 2.67,
      factorUnit: 'kgCO2e/L柴油',
      version: 'IPCC 2006 + GB 27518 修正值',
      effectiveDate: '长期有效(基准年不变时可沿用)',
      publisher: 'IPCC + 生态环境部',
      factorSourceDetail: {
        ipccTable: 'IPCC 2006 Table 3.2.1 Mobile Combustion - Diesel',
        ipccBaseline: '2.67 kg CO2/L (柴油密度0.836 kg/L,碳含量87.5%)',
        ch4N2oAdjustment: '含CH4(0.012g/km)和N2O(0.08g/km)非CO2温室气体换算',
        chinaDensityCorrection: '中国0#柴油标准密度0.84 kg/L(GB 252-2015)',
        methodology: 'IPCC Tier1 碳平衡法 + 移动源非CO2气体修正',
        database: '《中国移动源排放清单编制指南》(生态环境部2023)',
        updateFrequency: '跟随燃油标准升级调整',
        confidenceLevel: '高(A级)',
        alternativeFactors: [
          { label: '国VI柴油(更清洁)', value: 2.62, note: '国VI燃油硫含量<10ppm，略有下降' },
          { label: '非道路机械', value: 2.78, note: '工程机械用柴油(燃烧效率较低)' }
        ]
      },
      parent: 'L5-005',
      children: ['L7-005']
    },

    // ---- 涂装天然气因子(同L6-003) L6-006 ----
    {
      id: 'L6-006',
      level: 6,
      name: '天然气燃烧排放因子(涂装烘干，含N2O修正)',
      type: 'FACTOR',
      factorValue: 2.175,
      factorUnit: 'kgCO2e/m³',
      version: 'IPCC 2006 + 高温工况修正',
      effectiveDate: '长期有效',
      publisher: 'IPCC',
      factorSourceDetail: {
        baseFactor: 2.168,
        tempCorrection: '烘干炉温度>800°C，N2O生成率高于常温燃烧，额外+0.7%修正',
        methodology: 'IPCC Tier1 + 工艺特定N2O排放系数修正',
        crossReference: 'L6-003 (同源因子的工况变体)',
        confidenceLevel: '高(A级)'
      },
      parent: 'L5-006',
      children: ['L7-006']
    },

    // ---- 叉车柴油因子复用 L6-007 ----
    {
      id: 'L6-007',
      level: 6,
      name: '柴油移动源排放因子(同L6-005复用)',
      type: 'FACTOR',
      factorValue: 2.67,
      factorUnit: 'kgCO2e/L柴油',
      version: 'IPCC 2006 + GB 27518',
      effectiveDate: '长期有效',
      publisher: 'IPCC + 生态环境部',
      factorSourceDetail: {
        crossReference: 'L6-005 (同一因子复用，不同核算口径下的引用)'
      },
      parent: 'L5-007',
      children: ['L7-007']
    },

    // ---- 发电机备用柴油因子 L6-008 ----
    {
      id: 'L6-008',
      level: 6,
      name: '固定源柴油发电机排放因子',
      type: 'FACTOR',
      factorValue: 2.56,
      factorUnit: 'kgCO2e/L柴油',
      version: 'IPCC 2006 Table 1.4 Stationary',
      effectiveDate: '长期有效',
      publisher: 'IPCC',
      factorSourceDetail: {
        ipccCategory: '1.A.2.a.iv - Electricity generation - Diesel',
        differenceFromMobile: '固定源燃烧效率略低于移动源，因此因子值偏低3~4%',
        note: '备用估算场景，因子选择影响有限',
        confidenceLevel: '中等(B级)'
      },
      parent: 'L5-008',
      children: ['L7-008']
    },

    // ---- 仓库用电电网因子复用 L6-009 ----
    {
      id: 'L6-009',
      level: 6,
      name: '南方区域电网排放因子(仓库用电复用)',
      type: 'FACTOR',
      factorValue: 0.5503,
      factorUnit: 'kgCO2e/kWh',
      version: 'v2024-Q4',
      effectiveDate: '2024-01-01 ~ 2024-12-31',
      publisher: '生态环境部气候司',
      factorSourceDetail: {
        crossReference: 'L6-001 (同一电网因子复用)'
      },
      parent: 'L5-009',
      children: ['L7-009']
    },

    // ---- 重型货车运输因子 L6-010 ----
    {
      id: 'L6-010',
      level: 6,
      name: '重型柴油货车货物运输排放因子',
      type: 'FACTOR',
      factorValue: 0.095,
      factorUnit: 'kgCO2e/(t·km)',
      version: 'GB/T 2589-2020 + 中国货运排放因子研究2024',
      effectiveDate: '2020-09-01至今',
      publisher: '国家标准委 + 交通运输部规划院',
      factorSourceDetail: {
        standardRef: 'GB/T 2589-2020 综合能耗计算通则 表A.7 公路货运',
        baseFactor: 0.0872,
        chinaAdjustment: '+0.0078 (中国货运实载率/路况修正)',
        vehicleType: '重型半挂牵引车(49吨GTW)，国VI排放标准',
        loadFactor: '实载率72%，满载等速工况测算',
        roadCondition: '混合工况(高速60% + 国道30% + 城市10%)',
        methodology: 'MOBILE-China模型 + 实车PEMS测试数据校准',
        database: '中国道路交通排放因子库 v2024 (交通部规划院维护)',
        testDataSource: '中国汽研PEMS实车测试(n=12台次，覆盖主流车型)',
        confidenceLevel: '较高(B+级)',
        alternativeFactors: [
          { label: '电动重卡(零直接排放)', value: 0.0, note: '如改用电动重车可消除此项' },
          { label: '铁路运输替代', value: 0.022, note: '铁路货运因子仅为公路的1/4' }
        ]
      },
      parent: 'L5-010',
      children: ['L7-010']
    },

    // ---- 电池上游电耗因子 L6-011 ----
    {
      id: 'L6-011',
      level: 6,
      name: '电池上游生产电力的综合排放因子',
      type: 'FACTOR',
      factorValue: 0.58,
      factorUnit: 'kgCO2e/kWh',
      version: '中国电池产业链LCA数据库 v2024 Q3',
      effectiveDate: '2024年度',
      publisher: '中国电子节能技术协会电池专委会 + SGS',
      factorSourceDetail: {
        compositeNature: '综合因子(多省份电网加权 + 上游材料隐含排放)',
        breakdown: {
          directGridElectricity: { value: 0.5210, share: '89.8%', note: '电池产区主要电网加权平均(青海/四川/江苏)' },
          upstreamMaterialEmbodied: { value: 0.0470, share: '8.1%', note: '锂盐/正极/电解液生产的隐含电力排放' },
          processFuelCombustion: { value: 0.0120, share: '2.1%', note: '天然气加热/窑炉燃烧' }
        },
        methodology: '生命周期清单分析(LCI) + 归因法分配',
        database: '中国动力电池LCA基础数据库(CABLI 2024)',
        peerReview: '通过SGS第三方审核(报告号: CN-VER-LCA-2024-0156)',
        confidenceLevel: '中等(B级)',
        notes: '因子值高于普通电网因子，因为电池生产属高能耗产业且涉及上游材料嵌套排放',
        improvementTrend: '随着绿电工厂建设，该因子预计每年降低5~8%'
      },
      parent: 'L5-011',
      children: ['L7-011']
    },

    // ---- 包装材料因子 L6-012 ----
    {
      id: 'L6-012',
      level: 6,
      name: '包装材料组合排放因子',
      type: 'FACTOR',
      factorValue: 0.008,
      factorUnit: 'kgCO2e/pcs(整套)',
      version: 'IPCC 2019 + 中国包装工业LCA数据库 v3',
      effectiveDate: '2019-01-01至今',
      publisher: 'IPCC + 中国包装联合会',
      factorSourceDetail: {
        packagingSetComposition: [
          { component: '瓦楞纸箱', weight: 28.5, factor: 0.94, emission: 26.79, unit: 'kgCO2e/t' },
          { component: 'EPE发泡塑料', weight: 1.2, factor: 2.85, emission: 3.42, unit: 'kgCO2e/kg' },
          { component: '木托盘(熏蒸)', weight: 18.0, factor: 0.42, emission: 7.56, unit: 'kgCO2e/kg' },
          { component: '缠绕膜(LLDPE)', weight: 0.5, factor: 3.20, emission: 1.60, unit: 'kgCO2e/kg' }
        ],
        totalPerSet: 39.37,
        allocatedToVehicle: 0.008,
        note: '按每套包装总排放折算到单车',
        methodology: 'IPCC 2019 包装材料因子表 + ecoinvent 3.9.1交叉验证',
        database: 'IPCC 2019 Refinement + 中国包装碳足迹数据库(CPFD)',
        confidenceLevel: '高(A级)',
        reductionOpportunity: '采用蜂窝纸板替代EPE发泡可减少约35%包装碳排放'
      },
      parent: 'L5-012',
      children: ['L7-012']
    },

    // ---- 稀土提取因子 L6-013 ----
    {
      id: 'L6-013',
      level: 6,
      name: '稀土元素提取与精炼排放因子',
      type: 'FACTOR',
      factorValue: 320,
      factorUnit: 'kgCO2e/kg稀土氧化物(REO)',
      version: '中国稀土行业LCA数据库 v3(2022基年)',
      effectiveDate: '2022-01-01至今',
      publisher: '中国稀土行业协会 + 北京工业大学材料学院',
      factorSourceDetail: {
        rareEarthProcess: '钕铁硼磁体生产链: 稀土矿选矿→萃取分离→金属制备→合金熔炼→制粉成型',
        energyIntensity: '~45 kWh/kg REO (主要来自溶剂萃取和电解工序)',
        chemicalReagents: '盐酸、草酸、氨水等化学品生产隐含排放',
        mineType: '离子吸附型稀土矿(江西/广东矿区为主)',
        oreGrade: 'REO品位0.05~0.15%',
        methodology: '过程LCA + 经济价值分配法',
        database: '中国稀土行业LCA数据库 v3 (CRELA 2022)',
        studyCoverage: '涵盖北方内蒙氟碳铈矿 + 南方离子吸附型矿两大体系',
        uncertaintyAnalysis: '±25%(矿山品位波动+提取工艺路线差异)',
        confidenceLevel: '较低(C级)',
        notes: '当前最大不确定性来源之一。建议获取供应商一级数据替代行业均值',
        latestVersion: 'v5(2024)已更新，因子值为288(-10%)，建议下期切换'
      },
      parent: 'L5-013',
      children: ['L7-013']
    },

    // ---- 使用阶段电网因子(预测) L6-015 ----
    {
      id: 'L6-015',
      level: 6,
      name: '使用阶段电网排放因子(含逐年演变预测)',
      type: 'FACTOR',
      factorValue: 0.5503,
      factorUnit: 'kgCO2e/kWh',
      version: '预测情景(2025~2040年滚动预测)',
      effectiveDate: '2025年起(逐年递减预测)',
      publisher: '生态环境部 + 内部碳模型推演',
      factorSourceDetail: {
        baseYearFactor: 0.5503,
        projectionScenario: '政策基准情景(基于"双碳"目标路径)',
        yearlyProjection: [
          { year: 2025, factor: 0.5310, note: '可再生能源装机持续增长' },
          { year: 2030, factor: 0.4120, note: '风光占比超30%' },
          { year: 2035, factor: 0.3050, note: '新型电力系统基本建成' },
          { year: 2040, factor: 0.2180, note: '深度脱碳情景' }
        ],
        weightedAverageFactor: 0.3850,
        note: '使用阶段15年加权平均电网因子',
        methodology: 'LEAP模型(长期能源替代规划系统) + 区域电网演化预测',
        confidenceLevel: '低(D级)',
        notes: '高度依赖政策和能源结构预测，需每年回滚更新'
      },
      parent: 'L5-015',
      children: ['L7-015']
    },

    // ---- 回收减排因子 L6-016 ----
    {
      id: 'L6-016',
      level: 6,
      name: '再生材料替代原生材料的减排因子(负排放)',
      type: 'FACTOR',
      factorValue: -1.0,
      factorUnit: 'kgCO2e (归一化信用系数)',
      version: 'ISO 14044 替代法 + 中国再生材料减排因子库 2024',
      effectiveDate: '2024年度',
      publisher: '中国资源综合利用协会',
      factorSourceDetail: {
        methodology: '替代法(Substitution Method/Avoided Impact)',
        principle: '1kg再生材料避免生产1kg同类原生材料的排放',
        isoGuidance: 'ISO 14044:2006 §4.3.4.2 系统扩展(credits from recycling)',
        controversyNote: '替代法在欧洲TC207/WG8中有争议，部分标准要求单独列示不计入总碳足迹',
        factorByMaterial: [
          { material: '再生钢', virginFactor: 1.45, recycleFactor: 0.12, credit: 1.33 },
          { material: '再生铝', virginFactor: 8.24, recycleFactor: 0.58, credit: 7.66 },
          { material: '再生铜', virginFactor: 2.80, recycleFactor: 0.35, credit: 2.45 },
          { material: '再生塑料(PP)', virginFactor: 2.10, recycleFactor: 0.85, credit: 1.25 }
        ],
        database: '中国再生材料LCA因子数据库(CRMLCA 2024)',
        confidenceLevel: '中等(B级，方法论层面有争议)'
      },
      parent: 'L5-016',
      children: ['L7-016']
    },

    // ============================================================
    //  L7 因子元数据级（Factor Metadata）
    //  包含：方法论、数据库引用、文献出处、置信等级、备注
    // ============================================================

    // ---- 电网因子元数据 L7-001 ----
    {
      id: 'L7-001',
      level: 7,
      name: '南方区域电网因子元数据',
      type: 'METADATA',
      metadata: {
        methodology: '生命周期核算法(LCA) + 电网组合边际(CBM)法',
        database: '中国区域电网碳排放因子数据库',
        reference: '《关于发布2024年全国及各省级区域电网二氧化碳排放因子的公告》(2025年第3号)',
        secondaryReferences: [
          '《省级二氧化碳排放达峰行动方案编制指南》(环大气〔2023〕37号)',
          'IPCC 2006 国家温室气体清单指南 Vol.Energy Ch.2'
        ],
        updateFrequency: '年度更新(通常次年2月底发布)',
        lastUpdated: '2024-12-31',
        nextExpectedUpdate: '2026-02-28',
        confidenceLevel: '高(A级)',
        notes: '含输配电损耗因子0.0472 kgCO2e/kWh；CM+OM加权方法符合IPCC国家清单要求'
      },
      parent: 'L6-001'
    },

    // ---- 仓库电网元数据 L7-002 ----
    {
      id: 'L7-002',
      level: 7,
      name: '电网因子元数据(同L7-001)',
      type: 'METADATA',
      metadata: {
        crossReference: 'L7-001 (同源元数据复用)'
      },
      parent: 'L6-002'
    },

    // ---- 天然气因子元数据 L7-003 ----
    {
      id: 'L7-003',
      level: 7,
      name: '天然气燃烧因子元数据',
      type: 'METADATA',
      metadata: {
        methodology: 'IPCC 2006 Tier1 碳平衡法 + 化石燃料排放因子计算',
        database: 'IPCC 2006 Emission Factor Database (EFDB) + 中国本土化修正',
        reference: 'IPCC 2006 Guidelines Table 1.4; GB 25189-2010 综合能耗计算通则',
        updateFrequency: '跟随IPCC评估报告更新周期(~7年/版)',
        lastUpdated: '2019-08 (AR5 refinements)',
        confidenceLevel: '高(A级)',
        notes: '中国本土化修正考虑了国内天然气组分(甲烷含量96%+)和供应结构特点'
      },
      parent: 'L6-003'
    },

    // ---- VOC因子元数据 L7-004 ----
    {
      id: 'L7-004',
      level: 7,
      name: '焊剂VOC排放因子元数据',
      type: 'METADATA',
      metadata: {
        methodology: '实测统计法 + 不确定性传播分析(Monte Carlo模拟)',
        database: '汽车制造业工艺排放因子库 v2.3 (企业内部维护)',
        reference: '《汽车涂装及焊接工艺挥发性有机物排放因子手册》v2.3 (2023年内部出版)',
        updateFrequency: '每2年更新一轮实测数据',
        lastUpdated: '2023-06',
        confidenceLevel: '中等(B级)',
        notes: '样本量n=15，变异系数CV=14.1%。建议扩大样本并区分焊材类型细化因子'
      },
      parent: 'L6-004'
    },

    // ---- 柴油因子元数据 L7-005 ----
    {
      id: 'L7-005',
      level: 7,
      name: '柴油移动源排放因子元数据',
      type: 'METADATA',
      metadata: {
        methodology: 'IPCC Tier1 碳平衡法 + CH4/N2O非CO2温室气体GWP100换算',
        database: 'IPCC 2006 EFDB Table 3.2.1 + 《中国移动源排放清单编制指南》',
        reference: 'IPCC 2006 Vol.2 Ch.3; GB 27518-2011 化石燃料燃烧排放计算',
        updateFrequency: '跟随燃油标准升级(国VI→国VII)',
        lastUpdated: '2023-07 (适配国VIb标准)',
        confidenceLevel: '高(A级)',
        notes: '已包含CH4和N2O的非CO2效应(GWP100)；柴油密度采用国标GB 252-2015规定值0.84kg/L'
      },
      parent: 'L6-005'
    },

    // ---- 涂装天然气元数据 L7-006 ----
    {
      id: 'L7-006',
      level: 7,
      name: '高温工况天然气因子元数据',
      type: 'METADATA',
      metadata: {
        methodology: 'IPCC Tier1 + 工艺温度修正系数(基于Arrhenius反应速率)',
        database: '同L7-003 + 内部工艺测试数据',
        reference: '同L7-003 + 企业内部《涂装车间能效测试报告2025》',
        confidenceLevel: '高(A级)',
        notes: '高温工况(>800°C)下N2O生成率约为常温的1.5~2倍，此修正基于企业实测数据'
      },
      parent: 'L6-006'
    },

    // ---- 叉车柴油元数据(复用) L7-007 ----
    {
      id: 'L7-007',
      level: 7,
      name: '柴油因子元数据(复用)',
      type: 'METADATA',
      metadata: { crossReference: 'L7-005' },
      parent: 'L6-007'
    },

    // ---- 发电机柴油元数据 L7-008 ----
    {
      id: 'L7-008',
      level: 7,
      name: '固定源柴油发电机因子元数据',
      type: 'METADATA',
      metadata: {
        methodology: 'IPCC 2006 Table 1.4 Stationary Combustion - Diesel Oil',
        database: 'IPCC 2006 EFDB',
        confidenceLevel: '中等(B级)',
        notes: '备用估算场景，数据质量依赖后续加装计量设备后的实测值'
      },
      parent: 'L6-008'
    },

    // ---- 仓库电网元数据(复用) L7-009 ----
    {
      id: 'L7-009',
      level: 7,
      name: '电网因子元数据(复用)',
      type: 'METADATA',
      metadata: { crossReference: 'L7-001' },
      parent: 'L6-009'
    },

    // ---- 货运因子元数据 L7-010 ----
    {
      id: 'L7-010',
      level: 7,
      name: '重型货车货运排放因子元数据',
      type: 'METADATA',
      metadata: {
        methodology: 'MOVIC/MOBILE-China模型 + PEMS实车测试数据反演',
        database: '中国道路交通排放因子库 v2024 (交通运输部规划院)',
        reference: 'GB/T 2589-2020 综合能耗计算通则; 《道路机动车大气污染物排放清单编制技术指南》',
        updateFrequency: '年度更新(跟随新车排放标准和车型结构变化)',
        lastUpdated: '2024-03',
        confidenceLevel: '较高(B+级)',
        notes: '基于n=12台次PEMS实车测试数据校准；含高速/国道/城市混合工况权重'
      },
      parent: 'L6-010'
    },

    // ---- 电池上游因子元数据 L7-011 ----
    {
      id: 'L7-011',
      level: 7,
      name: '电池产业链综合排放因子元数据',
      type: 'METADATA',
      metadata: {
        methodology: '生命周期清单分析(LCI) + 多区域投入产出MRIO嵌套 + 归因法分配',
        database: '中国动力电池LCA基础数据库(CABLI 2024)',
        reference: 'ISO 14044:2006; GB/T 24040-2008; 《欧盟电池法规(EU 2023/1542)碳足迹方法学附件》',
        thirdPartyReview: 'SGS通标认证 审核报告编号 CN-VER-LCA-2024-0156 (2024-11-15签发)',
        updateFrequency: '季度更新(跟随电池产能结构和能源结构变化)',
        lastUpdated: '2024-Q3',
        confidenceLevel: '中等(B级)',
        notes: '综合因子高于单一电网因子是因为嵌套了上游材料(锂盐/正极/铜箔/电解液)的生产排放'
      },
      parent: 'L6-011'
    },

    // ---- 包装因子元数据 L7-012 ----
    {
      id: 'L7-012',
      level: 7,
      name: '包装材料组合因子元数据',
      type: 'METADATA',
      metadata: {
        methodology: 'IPCC 2019 Refinement + 过程求和法(各组件LCI加总)',
        database: 'IPCC 2019 EFDB + ecoinvent 3.9.1 + 中国包装碳足迹数据库(CPFD)',
        reference: 'IPCC 2019 Ch.10 Solid Waste; GB/T 16716-2023 包装与环境术语',
        updateFrequency: '随IPCC版本更新(约5~7年/版)',
        lastUpdated: '2023-08',
        confidenceLevel: '高(A级)',
        notes: '各组件因子均有独立LCI支撑；EPE发泡塑料为最大减排机会点(可用纸质缓冲替代)'
      },
      parent: 'L6-012'
    },

    // ---- 稀土因子元数据 L7-013 ----
    {
      id: 'L7-013',
      level: 7,
      name: '稀土提取排放因子元数据',
      type: 'METADATA',
      metadata: {
        methodology: '过程LCA + 经济价值分配法(按稀土氧化物市场价格分配)',
        database: '中国稀土行业LCA数据库 v3 (CRELA 2022)',
        reference: '《稀土冶炼分离企业单位产品能源消耗限额》(GB 29435-2021); 行业论文: 稀土永磁体碳足迹评价方法研究(稀有金属 2023)',
        updateFrequency: '不定期(跟随行业技术革新)',
        lastUpdated: '2022-12',
        confidenceLevel: '较低(C级)',
        notes: '最大不确定度来源！矿山类型(离子吸附型vs独居石)、提取工艺(溶剂萃取vs氧化焙烧)差异巨大。强烈建议获取供应商一级数据替代行业均值。最新v5因子(288)已降10%，建议尽快更新'
      },
      parent: 'L6-013'
    },

    // ---- 使用阶段电网元数据 L7-015 ----
    {
      id: 'L7-015',
      level: 7,
      name: '使用阶段电网因子预测元数据',
      type: 'METADATA',
      metadata: {
        methodology: 'LEAP模型(长期能源替代规划系统) + 情景分析法(scenario analysis)',
        database: '内部碳模型 CarbonModel-v3.1 (基于LEAP China 2024构建)',
        reference: '《2030年前碳达峰行动方案》(国务院2021); IEA Stated Policies Scenario 2024',
        projectionAssumptions: [
          '风电装机年增>70GW(十四五规划)',
          '光伏装机年增>100GW(十四五规划)',
          '电动汽车渗透率2030年达40%(推动电网负荷变化)',
          '储能装机规模2025年达30GW/60GWh'
        ],
        updateFrequency: '年度回滚更新(对照实际电网因子偏差校正)',
        lastUpdated: '2025-01',
        confidenceLevel: '低(D级)',
        notes: '预测性质数据，不确定性大。必须每年用实际发布的电网因子回滚修正'
      },
      parent: 'L6-015'
    },

    // ---- 回收减排元数据 L7-016 ----
    {
      id: 'L7-016',
      level: 7,
      name: '再生材料替代减排因子元数据',
      type: 'METADATA',
      metadata: {
        methodology: 'ISO 14044:2006 §4.3.4.2 替代法(System Expansion/Credits)',
        database: '中国再生材料LCA因子库(CRMLCA 2024) + World Steel Association 2024 LCI',
        reference: 'ISO 14044:2006; EN 15804+A2 可持续性建筑评估; 《循环经济促进法》',
        methodologicalControversy: '替代法是否应计入产品碳足迹存在国际争议: ISO/TC207/WG8倾向于分开列示; GHG Protocol Product Standard允许计入但须充分披露',
        disclosureRequirement: '如使用此因子，必须在报告中单独标注"含循环信用"并与"无循环信用"结果并列展示',
        updateFrequency: '年度更新(跟随再生技术效率变化)',
        lastUpdated: '2024-06',
        confidenceLevel: '中等(B级，方法论层面存在分歧)',
        notes: '⚠️ 方法学敏感项：若采用截断法(cutoff)而非替代法，此负排放项将不存在，总碳足迹将增加约36.6%'
      },
      parent: 'L6-016'
    }
  ]
}

// ==================== 质量治理数据 ====================
export const mockGovernanceData = {
  validationSummary: {
    L1: { label: '格式校验', total: 50, pass: 48, warn: 2, fail: 0, score: 96 },
    L2: { label: '完整性校验', total: 50, pass: 35, missing: 10, abnormal: 5, score: 70 },
    L3: { label: '逻辑一致性校验', total: 40, pass: 30, suspicious: 8, conflict: 2, score: 75 }
  },
  overallScore: 78.5,
  anomalies: [
    {
      id: 'ANOM-001',
      level: 'WARNING',
      severity: 'high',
      category: 'L2_异常值',
      title: '电力数据超出历史均值300%',
      description: '2025年8月用电量175kWh，超出该产线历史同期均值(44kWh)的298%，可能存在计量错误或非正常工况。',
      sourceItem: 'ES-005',
      sourcePhase: '生产制造阶段',
      detectedBy: 'AI_AnomalyDetector',
      detectedAt: '2026-06-23 16:30:00',
      resolutionOptions: [
        { id: 'OPT-1', type: 'AI_SUGGEST', text: '建议核实：该月是否有加班排产或设备调试导致的高峰用电', confidence: 0.87 },
        { id: 'OPT-2', type: 'MANUAL_CORRECT', text: '手动修改为正确数值', requiresInput: true },
        { id: 'OPT-3', type: 'IGNORE', text: '确认为正常工况，忽略此警告', requiresReason: true }
      ],
      status: 'PENDING', // PENDING, RESOLVED, IGNORED
      resolution: null
    },
    {
      id: 'ANOM-002',
      level: 'ERROR',
      severity: 'medium',
      category: 'L1_单位不一致',
      title: '天然气计量单位不一致',
      description: '排放源ES-006填报单位为m³，但对应排放因子要求输入单位为kg。需统一换算。',
      sourceItem: 'ES-006',
      sourcePhase: '生产制造阶段',
      detectedBy: 'Rule_Engine_L1',
      detectedAt: '2026-06-23 16:30:00',
      resolutionOptions: [
        { id: 'OPT-4', type: 'AUTO_FIX', text: '自动换算：35 m³ ≈ 25.2 kg(密度0.72kg/m³)', confidence: 0.95 },
        { id: 'OPT-5', type: 'MANUAL_CORRECT', text: '手动重新录入', requiresInput: true }
      ],
      status: 'PENDING',
      resolution: null
    },
    {
      id: 'ANOM-003',
      level: 'WARNING',
      severity: 'low',
      category: 'L3_因子过旧',
      title: '排放因子版本过旧(2019年基准)',
      description: '排放源ES-004使用的稀土提取因子来源于2019年数据库(v3)，当前最新版本为v5(2024)，差异约15%。',
      sourceItem: 'ES-004',
      sourcePhase: '原材料获取阶段',
      detectedBy: 'AI_FactorVersionCheck',
      detectedAt: '2026-06-23 16:31:00',
      resolutionOptions: [
        { id: 'OPT-6', type: 'AUTO_UPDATE', text: '一键更新至最新因子(±15%影响)', confidence: 0.92 },
        { id: 'OPT-7', type: 'KEEP_VERSION', text: '保持当前版本并在报告中注明原因', requiresReason: true }
      ],
      status: 'PENDING',
      resolution: null
    }
  ],
  technicalExceptions: [
    {
      id: 'EXCP-001',
      type: 'NO_FACTOR_AVAILABLE',
      message: '排放源"溶剂挥发"未找到匹配的排放因子，已跳过该源核算',
      suggestion: '建议手动补充自定义因子或从文献中选取近似因子替代',
      impact: '可能导致总排放量低估约2~5%'
    }
  ],
  manualInterventions: [
    {
      id: 'INT-001',
      item: 'ES-004 稀土元素提取排放量',
      originalValue: 4.8,
      adjustedValue: 5.52,
      reason: '专家审核确认：实际工艺路线为湿法冶金，能耗高于默认假设，调整+15%',
      operator: '张工(碳管理师)',
      operatedAt: '2026-06-23 17:15:00'
    }
  ]
}

// ==================== AI对话记录 ====================
export const mockChatMessages = [
  {
    id: 'MSG-001',
    role: 'assistant',
    content: '您好！我是小易，碳足迹核算智能体 🤖\n\n我已加载 **新能源汽车 EV700** 的产品模型，检测到该模型包含 **12个主要排放源**，覆盖原材料、生产制造、运输分销阶段和报废回收阶段全生命周期。\n\n是否开始自动核算？您也可以选择自定义核算步骤。',
    timestamp: '2026-06-24 10:00:01',
    suggestions: ['✅ 开始全自动核算', '⚙️ 自定义核算步骤', '📊 先查看排放源清单']
  },
  {
    id: 'MSG-002',
    role: 'user',
    content: '开始全自动核算吧',
    timestamp: '2026-06-24 10:00:45'
  },
  {
    id: 'MSG-003',
    role: 'assistant',
    content: '好的，正在启动全自动核算流程 🚀\n\n**当前进度：**\n✅ 第1步：数据准备检查完成 — 12/12 排放源数据就绪\n🔄 第2步：排放因子匹配进行中...\n\n预计耗时约 3 分钟，您可以随时通过对话框询问进展或提出问题。',
    timestamp: '2026-06-24 10:00:46'
  },
  {
    id: 'MSG-004',
    role: 'user',
    content: '这个产品的最大排放来源是什么？',
    timestamp: '2026-06-24 10:02:10'
  },
  {
    id: 'MSG-005',
    role: 'assistant',
    content: '根据初步分析，**电力消耗（组装生产线）是最大的单一排放源** 📌\n\n| 指标 | 数值 |\n|------|------|\n| 排放量 | **660.36 kgCO2e** |\n| 占比 | **91.2%** 的范围2排放 |\n| 年用电量 | 1,200 kWh |\n| 使用因子 | 南方区域电网 0.5503 kgCO2e/kWh |\n\n**减排建议优先级：**\n1. 🔝 引入屋顶分布式光伏（可减少40~60%的范围2排放）\n2. 🔝 优化生产排程避开电网高峰时段\n3. 💡 更新高效节能设备\n\n需要我生成详细的减排方案吗？',
    timestamp: '2026-06-24 10:02:12',
    suggestions: ['生成减排方案', '查看电力详细数据', '对比其他同类产品']
  }
]

// ==================== 运行日志 ====================
export const mockRunLogs = [
  { phase: 'DATA_COLLECTION', step: '数据采集启动', status: 'SUCCESS', startTime: '10:00:46', endTime: '10:01:12', durationMs: 26000, message: '成功采集12个排放源的原始数据' },
  { phase: 'DATA_COLLECTION', step: 'IoT电表数据拉取', status: 'SUCCESS', startTime: '10:01:12', endTime: '10:01:35', durationMs: 23000, message: 'METER-E-MF-001 全年12个月数据采集完毕' },
  { phase: 'FACTOR_MATCH', step: '因子匹配引擎启动', status: 'SUCCESS', startTime: '10:01:35', endTime: '10:02:08', durationMs: 33000, message: '12个排放源全部匹配到排放因子(GB/T-2024-v2.1)' },
  { phase: 'CALCULATION', step: '排放量逐源计算', status: 'RUNNING', startTime: '10:02:08', endTime: null, durationMs: null, message: '已完成 8/12 个排放源计算...' },
  { phase: 'TRACEABILITY', step: '溯源链构建', status: 'PENDING', startTime: null, endTime: null, durationMs: null, message: '等待计算完成后执行' },
  { phase: 'GOVERNANCE', step: '质量校验分析', status: 'PENDING', startTime: null, endTime: null, durationMs: null, message: '等待溯源完成后执行' },
  { phase: 'REPORT', step: '报告生成', status: 'PENDING', startTime: null, endTime: null, durationMs: null, message: '最终步骤' }
]

// ==================== 核算报告数据 ====================
export const mockReportData = {
  basicInfo: {
    reportNo: 'CFR-2026-EV700-0001',
    standard: 'ISO 14067:2018 + GB/T 24040-2008',
    productName: '新能源汽车 EV700',
    manufacturer: 'XX新能源汽车制造有限公司',
    functionalUnit: '1 辆新能源汽车（磷酸铁锂电池版）',
    declarationUnit: 'kg CO₂ 当量 (kgCO₂e)',
    boundary: '摇篮到大门(Cradle-to-Gate) + 报废回收阶段预估',
    cutoffRules: '单排放源占比<1%予以截断；累计截断<5%',
    dataQuality: {
      temporalCoverage: '2025自然年度',
      geographicCoverage: '中国华南地区',
      technologyCoverage: '现行主流生产工艺',
      completeness: '96.5%',
      uncertainty: '±12.3%'
    }
  },
  lciResult: {
    tableHeaders: ['序号', '类别', '排放源名称', '原始数据', '单位', '排放因子', '因子单位', '排放量(kgCO₂e)'/* , '不确定度(%)' */],
    tableData: [
      [1, '原材料', '原料A采购运输', '2,500', 't·km', '0.062', 'kgCO₂e/(t·km)', '155.0', '8.5'],
      [2, '原材料', '原料B开采加工能耗', '450', 'kWh', '0.58', 'kgCO₂e/kWh', '261.0', '12.3'],
      [3, '原材料', '包装物生产', '500', 'pcs', '0.008', 'kgCO₂e/pcs', '4.0', '5.2'],
      [4, '原材料', '稀土元素提取', '0.015', 'kg', '320', 'kgCO₂e/kg', '4.8', '25.0'],
      [5, '生产制造阶段', '电力消耗-组装线', '1,200', 'kWh', '0.5503', 'kgCO₂e/kWh', '660.36', '3.2'],
      [6, '生产制造阶段', '天然气燃烧', '35', 'm³', '2.18', 'kgCO₂e/m³', '76.3', '4.5'],
      [7, '生产制造阶段', '工艺VOC挥发', '2.5', 'kg焊剂', '4.96', 'kgCO₂e/kg焊剂', '12.4', '18.0'],
      [8, '生产制造阶段', '压缩空气用电', '180', 'kWh', '0.5503', 'kgCO₂e/kWh', '99.05', '5.0'],
      [9, '生产制造阶段', '叉车柴油消耗', '28', 'L', '2.67', 'kgCO₂e/L', '74.76', '6.0'],
      [10, '运输分销阶段', '仓库能耗', '38', 'kWh', '0.5503', 'kgCO₂e/kWh', '20.91', '10.0'],
      [11, '运输分销阶段', '成品配送', '380', 't·km', '0.095', 'kgCO₂e/(t·km)', '36.1', '8.0'],
      [12, '运输分销阶段', '包装废物处理', '3.2', 'kg', '3.36', 'kgCO₂e/kg', '10.75', '15.0'],
      [13, '报废回收阶段', '使用阶段充电(3年)', '157.5', 'kWh/年', '0.5503', 'kgCO₂e/kWh', '86.67', '25.0'],
      [14, '报废回收阶段', '拆解回收抵扣', '-12.5', 'kgCO₂e', '-', '-', '-12.5', '20.0']
    ],
    totalRow: ['', '', '', '', '', '', '', '**724.35*', '']
  },
  lciaResult: {
    totalEmission: 724.35,
    scopeBreakdown: {
      scope1: { value: 163.46, pct: 22.6, label: '直接排放' },
      scope2: { value: 780.32, pct: 107.7, label: '能源间接排放' },
      scope3: { value: -219.43, pct: -30.3, label: '其他间接排放(含回收抵扣)' }
    },
    phaseBreakdown: [
      { phase: '原材料获取阶段', value: 424.8, pct: 58.7 },
      { phase: '生产制造阶段', value: 922.87, pct: 127.4 },
      { phase: '运输分销阶段', value: 67.76, pct: 9.4 },
      { phase: '报废回收阶段', value: 74.16, pct: 10.2 },
      { phase: '回收抵扣', value: -265.24, pct: -36.6 }
    ]
  },
  interpretation: {
    hotspot: '电池生产与电力消耗占主导地位，应优先考虑绿电供应链与电池回收体系',
    comparison: '较上一代车型(EV600)降低12.5%，主要得益于轻量化车身设计和电池能量密度提升',
    reductionPotential: '引入绿电供应链可使范围2排放降低40%~60%，理论最优可达4,200 kgCO2e/辆',
    limitations: '使用阶段数据基于场景假设(不确定性±25%)；稀土开采因子存在较大不确定性(±25%)'
  }
}

// ==================== 燃油汽车 ICE-A160 碳足迹专属数据（与0714燃油汽车产品碳模型样例Excel逐项一致） ====================
export const iceVehicleEmissionData = {
  taskId: 'TASK-20260714001',
  productId: 'PROD-009',
  phases: [
    {
      id: 'ICE-PHASE-1',
      name: '原材料获取阶段',
      phase: 'raw_materials',
      emission: 2237.5,
      percentage: 13.6,
      color: '#5470C6',
      items: [
        { id: 'ICE-R-01', process: '原材料获取', name: '铸造铝合金', type: '原材料', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-R-02', process: '原材料获取', name: '非合金钢(碳钢), 低合金钢', type: '原材料', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-R-03', process: '原材料获取', name: '热塑性塑料', type: '原材料', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-R-04', process: '原材料获取', name: '钢/铸钢/烧结钢', type: '原材料', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-R-05', process: '原材料获取', name: '铝及铝合金', type: '原材料', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-R-06', process: '原材料获取', name: '高合金钢', type: '原材料', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-R-07', process: '原材料获取', name: '变形铝合金', type: '原材料', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-R-08', process: '原材料获取', name: '橡胶', type: '原材料', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-R-09', process: '原材料获取', name: '聚氨酯', type: '原材料', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-R-10', process: '原材料获取', name: '铜(线束)', type: '原材料', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-R-11', process: '原材料获取', name: '原材料入厂物流', type: '运输', unit: 't*km', activityData: null, datasetName: null },
        { id: 'ICE-R-12', process: '原材料获取-包装', name: '瓦楞纸', type: '包装材料', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-R-13', process: '原材料获取-包装', name: '废瓦楞纸', type: '固废', unit: 'kg', activityData: null, datasetName: null }
      ]
    },
    {
      id: 'ICE-PHASE-2',
      name: '生产制造阶段',
      phase: 'manufacturing',
      emission: 680.8,
      percentage: 4.4,
      color: '#91CC75',
      items: [
        { id: 'ICE-M-01', process: '涂装工序', name: '市电', type: '能源', unit: 'kWh', activityData: null, datasetName: null },
        { id: 'ICE-M-02', process: '涂装工序', name: '热力', type: '能源', unit: 'MJ', activityData: null, datasetName: null },
        { id: 'ICE-M-03', process: '涂装工序', name: '非生物质天然气使用', type: '能源', unit: 'Nm3', activityData: null, datasetName: null },
        { id: 'ICE-M-04', process: '涂装工序', name: '非生物质天然气生产', type: '能源', unit: 'm3', activityData: null, datasetName: null },
        { id: 'ICE-M-05', process: '涂装工序', name: 'VOC焚烧', type: '废气', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-M-06', process: '涂装工序', name: '污泥', type: '固废', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-M-07', process: '涂装工序', name: '光伏电', type: '能源', unit: 'kWh', activityData: null, datasetName: null },
        { id: 'ICE-M-08', process: '涂装工序', name: '废溶剂', type: '固废', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-M-09', process: '涂装工序', name: '水', type: '资源', unit: 't', activityData: null, datasetName: null },
        { id: 'ICE-M-10', process: '涂装工序', name: '废水', type: '废水', unit: 'm3', activityData: null, datasetName: null },
        { id: 'ICE-M-11', process: '涂装工序', name: '危废包装桶(200L以上)-残余物料', type: '固废', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-M-12', process: '涂装工序', name: '报废蓄电池', type: '固废', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-M-13', process: '焊接工序', name: '市电', type: '能源', unit: 'kWh', activityData: null, datasetName: null },
        { id: 'ICE-M-14', process: '焊接工序', name: 'CO2(废气)', type: '废气', unit: 't', activityData: null, datasetName: null },
        { id: 'ICE-M-15', process: '焊接工序', name: '光伏电', type: '能源', unit: 'kWh', activityData: null, datasetName: null },
        { id: 'ICE-M-16', process: '焊接工序', name: 'CO2(资源)', type: '资源', unit: 't', activityData: null, datasetName: null },
        { id: 'ICE-M-17', process: '焊接工序', name: '水', type: '资源', unit: 't', activityData: null, datasetName: null },
        { id: 'ICE-M-18', process: '焊接工序', name: '废水', type: '废水', unit: 'm3', activityData: null, datasetName: null },
        { id: 'ICE-M-19', process: '冲压工序', name: '市电', type: '能源', unit: 'kWh', activityData: null, datasetName: null },
        { id: 'ICE-M-20', process: '冲压工序', name: '光伏电', type: '能源', unit: 'kWh', activityData: null, datasetName: null },
        { id: 'ICE-M-21', process: '冲压工序', name: '水', type: '资源', unit: 't', activityData: null, datasetName: null },
        { id: 'ICE-M-22', process: '总装工序', name: '市电', type: '能源', unit: 'kWh', activityData: null, datasetName: null },
        { id: 'ICE-M-23', process: '总装工序', name: '光伏电', type: '能源', unit: 'kWh', activityData: null, datasetName: null },
        { id: 'ICE-M-24', process: '总装工序', name: '水', type: '资源', unit: 't', activityData: null, datasetName: null }
      ]
    },
    {
      id: 'ICE-PHASE-3',
      name: '运输分销阶段',
      phase: 'distribution',
      emission: 120.3,
      percentage: 0.8,
      color: '#FAC858',
      items: [
        { id: 'ICE-D-01', process: '分销', name: '整车出厂物流-国际海运', type: '运输', unit: 't*km', activityData: null, datasetName: null },
        { id: 'ICE-D-02', process: '分销', name: '市电', type: '能源', unit: 'kWh', activityData: null, datasetName: null },
        { id: 'ICE-D-03', process: '分销', name: '整车出厂物流-国际公路', type: '运输', unit: 't*km', activityData: null, datasetName: null },
        { id: 'ICE-D-04', process: '分销', name: '整车出厂物流-国内水运', type: '运输', unit: 't*km', activityData: null, datasetName: null },
        { id: 'ICE-D-05', process: '分销', name: '整车出厂物流-国内公路', type: '运输', unit: 't*km', activityData: null, datasetName: null }
      ]
    },
    {
      id: 'ICE-PHASE-4',
      name: '产品使用阶段',
      phase: 'use_phase',
      emission: 12800.0,
      percentage: 82.8,
      color: '#EE6666',
      items: [
        { id: 'ICE-U-01', process: '使用环节', name: '汽油使用', type: '能源', unit: 'l', activityData: null, datasetName: null },
        { id: 'ICE-U-02', process: '使用环节', name: '汽油生产', type: '能源', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-U-03', process: '使用环节', name: '轮胎-橡胶', type: '耗材', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-U-04', process: '使用环节', name: '润滑剂', type: '耗材', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-U-05', process: '使用环节', name: '铅酸蓄电池', type: '耗材', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-U-06', process: '使用环节', name: '轮胎-钢/铸钢/烧结钢', type: '耗材', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-U-07', process: '使用环节', name: '机油滤清器(钢)', type: '耗材', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-U-08', process: '使用环节', name: '冷却液', type: '耗材', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-U-09', process: '使用环节', name: '轮胎-织物(纤维、纱线、织物和针织物等)', type: '耗材', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-U-10', process: '使用环节', name: '洗涤液,电池酸液', type: '耗材', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-U-11', process: '使用环节', name: '传动皮带(橡胶)', type: '耗材', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-U-12', process: '使用环节', name: '废机油滤清器', type: '固废', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-U-13', process: '使用环节', name: '废铅酸蓄电池', type: '固废', unit: 'kg', activityData: null, datasetName: null }
      ]
    },
    {
      id: 'ICE-PHASE-5',
      name: '报废回收阶段',
      phase: 'end_of_life',
      emission: 671.9,
      percentage: 4.1,
      color: '#73C0DE',
      items: [
        { id: 'ICE-E-01', process: '拆解报废', name: '废塑料-mTe', type: '固废', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-E-02', process: '拆解报废', name: '轮胎-mp', type: '固废', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-E-03', process: '拆解报废', name: '废液-mp', type: '废水', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-E-04', process: '拆解报废', name: '市电', type: '能源', unit: 'kWh', activityData: null, datasetName: null },
        { id: 'ICE-E-05', process: '拆解报废', name: '废塑料-mD', type: '固废', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-E-06', process: '拆解报废', name: '废塑料-mTr', type: '固废', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-E-07', process: '拆解报废', name: '废钢-mM', type: '固废', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-E-08', process: '拆解报废', name: '柴油使用', type: '能源', unit: 'MJ', activityData: null, datasetName: null },
        { id: 'ICE-E-09', process: '拆解报废', name: '柴油生产', type: '能源', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-E-10', process: '拆解报废', name: '机油滤清器-mp', type: '固废', unit: 'kg', activityData: null, datasetName: null },
        { id: 'ICE-E-11', process: '拆解报废', name: '废电池-mp', type: '固废', unit: 'kg', activityData: null, datasetName: null }
      ]
    }
  ],
  summary: {
    totalEmission: 16510.5,
    unit: 'kgCO₂e',
    functionalUnit: '1辆汽车（排量1.6L，整备质量1850kg，设计寿命15年/20万公里）',
    boundary: '摇篮到坟墓',
    breakdown: [
      { phase: '原材料获取阶段', value: 2237.5, pct: 13.6 },
      { phase: '生产制造阶段', value: 680.8, pct: 4.1 },
      { phase: '运输分销阶段', value: 120.3, pct: 0.7 },
      { phase: '产品使用阶段', value: 12800.0, pct: 77.5 },
      { phase: '报废回收阶段', value: 671.9, pct: 4.1 }
    ]
  },
  interpretation: {
    hotspot: '原材料获取阶段为企业可控排放最大来源（占可控排放60.3%），应作为企业减排首要抓手',
    comparison: '原材料阶段通过再生含量法（钢45%/铝30%）较原生材料方案降低约674 kgCO2e，企业可控排放合计3,710.5 kgCO2e',
    reductionPotential: '提升再生材料比例、优化生产工艺能耗、推进低碳物流为企业三大可控减排方向',
    limitations: '原材料获取阶段因子存在供应商层级差异(±15%)；涂装工序天然气存在使用侧与生产侧双记录口径偏差'
  }
}
