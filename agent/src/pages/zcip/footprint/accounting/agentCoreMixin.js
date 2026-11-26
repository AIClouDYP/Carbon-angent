import * as XLSX from 'xlsx'
import { matchFactor, saveUserFactorOverride, normalizeQuantityAndUnit } from '@/utils/factorMatchingService'
import { loadPcfStandardsForAgent, ensureSeed, getBoundaryDefaults, toStandardConfig, loadStandards } from '@/utils/policyStandardService'
import { loadCfpProducts, saveCfpProducts } from '@/utils/productStore'
﻿export default {
  data() {
    return {
      inputText: '',
      isReportArchived: false,
      isSopPublished: false,
      reportViewMode: 'report', // 'report'|'traceability'|'verification'
      defaultTraceabilityData: [
        { id: 1, name: '非合金钢(碳钢)用量 620 kg', stage: '原材料获取阶段', source: 'BOM清单实测（企业采购台账）', version: '2024-Q4 采购数据', confLevel: 'high', confLabel: '高', icon: 'el-icon-box', confReason: '活动数据来源于企业采购台账实测记录，数据可直接追溯至原始凭证，时间范围覆盖核算期，完整性与时效性良好。' },
        { id: 2, name: '钢材排放因子 2.12', stage: '原材料获取阶段', source: '中国产品全生命周期温室气体排放系数库（CPCD）', version: 'CPCD 2024', confLevel: 'high', confLabel: '高', icon: 'el-icon-coin', confReason: '排放因子来源于中国本土权威数据库CPCD 2024版，地理代表性与技术代表性匹配度高，数据库经同行评审。' },
        { id: 3, name: '铸造铝合金用量 85 kg', stage: '原材料获取阶段', source: 'BOM清单实测（企业采购台账）', version: '2024-Q4 采购数据', confLevel: 'high', confLabel: '高', icon: 'el-icon-box', confReason: '活动数据来源于企业采购台账实测记录，数据可直接追溯至原始凭证，时间范围覆盖核算期，完整性与时效性良好。' },
        { id: 4, name: '铸造铝合金排放因子 8.52', stage: '原材料获取阶段', source: 'Ecoinvent 3.10 + CPCD 2024', version: 'v3.10 / 2024-06', confLevel: 'medium', confLabel: '中', icon: 'el-icon-coin', confReason: '排放因子综合引用国际数据库Ecoinvent与国内CPCD，两者存在工艺路线差异（原生铝vs再生铝混合），未区分具体供应商工艺，地理代表性存在一定偏差。' },
        { id: 5, name: '涂装工序市电 1,200 kWh', stage: '生产制造阶段', source: '车间电表实测数据', version: '2024年1-12月抄表', confLevel: 'high', confLabel: '高', icon: 'el-icon-lightning', confReason: '活动数据来源于车间电表逐月抄表记录，数据可直接追溯至计量仪表，覆盖完整核算年度，准确性与时效性高。' },
        { id: 6, name: '汽油碳排放因子 2.31', stage: '产品使用阶段', source: 'IPCC国家温室气体清单指南', version: '2019 精炼版', confLevel: 'high', confLabel: '高', icon: 'el-icon-coin', confReason: '排放因子来源于IPCC国家温室气体清单指南2019精炼版，为国际通用权威参数，经长期验证且适用于中国国VI燃油标准。' },
        { id: 7, name: '汽油消耗量 12,000 L', stage: '产品使用阶段', source: 'NEDC工况油耗6.8L/100km×20万公里', version: 'ICE-A160 型号备案数据', confLevel: 'high', confLabel: '高', icon: 'el-icon-data-line', confReason: '活动数据来源于型号备案油耗值（NEDC工况），经第三方检测机构认证，行驶里程按标准寿命假设，数据具有法定效力。' },
        { id: 8, name: '再生钢含量比例 45%', stage: '原材料获取阶段', source: 'World Steel Association 2024 LCI', version: '2024 年度统计', confLevel: 'medium', confLabel: '中', icon: 'el-icon-refresh', confReason: '再生比例为世界钢协行业年度统计数据，非企业供应链实测值，存在区域和供应商层级差异，实际再生比例可能有±5%波动。' },
        { id: 9, name: '再生铝含量比例 30%', stage: '原材料获取阶段', source: '国际铝业协会 + CPCD 2024', version: '2024 行业报告', confLevel: 'medium', confLabel: '中', icon: 'el-icon-refresh', confReason: '再生比例为国际铝业协会行业报告声明值，非供应商实测数据，不同批次实际比例波动范围25%~38%，建议逐步建立实测机制。' },
        { id: 10, name: '热塑性塑料用量 135 kg', stage: '原材料获取阶段', source: 'BOM清单实测（企业采购台账）', version: '2024-Q4 采购数据', confLevel: 'high', confLabel: '高', icon: 'el-icon-box', confReason: '活动数据来源于企业采购台账实测记录，数据可直接追溯至原始凭证，时间范围覆盖核算期，完整性与时效性良好。' }
      ],
      windTraceabilityData: [
        { id: 1, name: '钕铁硼永磁材料用量 6,000 kg', stage: '原材料获取阶段', source: '发电机供应商BOM清单', version: '2025-Q3 设计BOM', confLevel: 'high', confLabel: '高', icon: 'el-icon-box', confReason: '活动数据来源于发电机供应商BOM清单实测记录，数据可直接追溯至原始凭证，时间范围覆盖核算期，完整性与时效性良好。' },
        { id: 2, name: '稀土采选冶排放因子 18.6', stage: '原材料获取阶段', source: 'CPCD + 稀土行业LCA研究报告', version: 'CPCD 2024 / 2023 行业研究', confLevel: 'medium', confLabel: '中', icon: 'el-icon-coin', confReason: '稀土采选冶环节因子受矿源品位与分离工艺影响较大，行业研究数据存在±15%波动，建议向供应商核实实际取值。' },
        { id: 3, name: '玻璃纤维增强塑料用量 95,000 kg', stage: '原材料获取阶段', source: '叶片供应商BOM清单', version: '2025-Q3 采购数据', confLevel: 'high', confLabel: '高', icon: 'el-icon-box', confReason: '活动数据来源于叶片供应商BOM清单，数据可直接追溯至原始凭证，完整性与时效性良好。' },
        { id: 4, name: '年发电小时数 4,200 h', stage: '使用阶段', source: '风场SCADA运行数据', version: '投运后年度均值', confLevel: 'high', confLabel: '高', icon: 'el-icon-data-line', confReason: '活动数据来源于风场SCADA系统逐时运行记录，投运后实测均值与可研值一致，数据具有计量级准确性。' },
        { id: 5, name: '废玻纤处置排放因子 0.35', stage: '报废回收阶段', source: 'Ecoinvent（填埋/水泥窑协同）', version: 'v3.10 / 2024-06', confLevel: 'medium', confLabel: '中', icon: 'el-icon-coin', confReason: '国内风电叶片回收处置因子数据库尚不完善，当前引用国际数据库，地理代表性存在偏差，建议跟踪国内处置因子发布动态。' }
      ],
      verificationOrgs: [
        { id: 1, name: '中国质量认证中心', engName: 'CQC (China Quality Certification Centre)', location: '北京', qualifications: 'ISO 14065 认证 / CNAS 授权', scope: '碳足迹、碳核查、LCA验证', contact: '010-8386 1234', rating: '★★★★★ 国家级权威', priceRange: '¥3-5万', accredited: true, logoIcon: 'el-icon-office-building', logoBg: '#ecf5ff', logoColor: '#0067FE' },
        { id: 2, name: 'SGS 通标标准技术服务', engName: 'SGS (Société Générale de Surveillance)', location: '上海（全球100+分支）', qualifications: 'ISO 14065 / ISO 17025 / EU ETS 认证', scope: '碳足迹、GHG核查、ESG审计', contact: '021-6115 6789', rating: '★★★★★ 全球龙头', priceRange: '¥5-8万', accredited: true, logoIcon: 'el-icon-s-flag', logoBg: '#f0f9eb', logoColor: '#3d8a3d' },
        { id: 3, name: '必维国际检验集团', engName: 'Bureau Veritas (BV)', location: '深圳（全球140+国家）', qualifications: 'ISO 14065 / ISO 17024 认证', scope: '碳足迹验证、碳标签认证', contact: '0755-2688 3456', rating: '★★★★☆ 国际知名', priceRange: '¥4-7万', accredited: true, logoIcon: 'el-icon-s-check', logoBg: '#fdf6ec', logoColor: '#d48806' },
        { id: 4, name: '中环碳足迹认证中心', engName: 'Zhonghuan Carbon Verification Centre', location: '珠海', qualifications: 'CNAS 碳核查授权 / 行业专项认证', scope: '电力行业碳足迹、设备级LCA', contact: '0756-212 8989', rating: '★★★★☆ 行业专精', priceRange: '¥2-4万', accredited: true, logoIcon: 'el-icon-data-analysis', logoBg: '#ecf5ff', logoColor: '#0067FE' },
        { id: 5, name: 'TÜV 南德意志集团', engName: 'TÜV SÜD', location: '广州（全球50+分支）', qualifications: 'ISO 14065 / DAkkS 认证', scope: '碳足迹、产品LCA、碳标签', contact: '020-3839 1234', rating: '★★★★☆ 欧洲权威', priceRange: '¥4-6万', accredited: true, logoIcon: 'el-icon-s-security', logoBg: '#f5f7fa', logoColor: '#303133' }
      ],
      isTyping: false,
      showFactorLibDialog: false, // 因子库选择对话框
      showEvidenceDrawer: false, // C-PSTGT-E 决策证据链抽屉
      activeEvidenceTrace: null, // 当前查看的决策留痕对象
      mappingMemoryCount: 3, // 企业自学习映射记忆条数
      factorDatabases: [
        { id: 'ecoinvent', name: 'Ecoinvent', shortName: 'Ecoinvent', origin: '瑞士/国际', desc: '全球最广泛使用的LCA数据库，覆盖10,000+单元过程', recommended: true, selected: true, version: '3.10', releaseDate: '2023-11', standards: ['14067', '24067', 'ISO', 'GB/T', 'PEF', '2021/2279'] },
        { id: 'elcd', name: 'ELCD（European Life Cycle Database）', shortName: 'ELCD', origin: '欧盟', desc: '欧洲参考生命周期数据库，适用于欧洲背景数据', selected: false, disabled: true, disabledReason: '当前企业未开通该因子库使用权限，如需启用请联系运维人员开通', version: 'v2023', releaseDate: '2023-06', standards: ['PEF', '2021/2279'] },
        { id: 'ipcc', name: 'IPCC排放因子数据库', shortName: 'IPCC', origin: '国际', desc: 'IPCC国家温室气体清单指南配套因子库，覆盖燃料燃烧、工业过程等', recommended: true, selected: true, version: '2019', releaseDate: '2019-05', standards: ['14067', 'ISO'] },
        { id: 'cpcd', name: '中国产品全生命周期温室气体排放系数库（CPCD）', shortName: 'CPCD', origin: '中国', desc: '中国本土因子库，覆盖主要工业产品全生命周期排放系数', recommended: true, selected: true, version: 'v1.2', releaseDate: '2024-06', standards: ['14067', '24067', 'ISO', 'GB/T'] },
        { id: 'national-gef', name: '国家温室气体排放因子数据库', shortName: '国家因子库', origin: '中国', desc: '生态环境部发布，官方权威电网因子等核心数据', recommended: true, selected: true, version: 'v2024-Q4', releaseDate: '2024-12', standards: ['14067', '24067', 'ISO', 'GB/T'] },
        { id: 'elec-ts', name: '分时分区电碳因子库', shortName: '分时分区电碳因子库', origin: '中国', desc: '时空分辨电力碳强度因子（省级/市级 × 小时级）', recommended: false, selected: false, version: '2025版（小时级）', releaseDate: '2025-12', standards: ['14067', '24067', 'ISO', 'GB/T', 'PEF'], hidden: true }
      ],
      // 电力因子精度：regular=常规电网平均 | timespace=分时分区
      elecFactorMode: 'regular',
      pageMode: 'task-active', // 'task-active'=任务详情（九阶段）模式；原 'task-list' 页内任务列表模式已回退（任务列表/选品属工作台页面）
      taskList: [], // 历史任务列表（localStorage持久化）
      currentTaskId: null, // 当前活跃任务ID
      newTaskProductName: '', // 新建任务-产品名称
      newTaskStandard: '', // 新建任务-核算标准
      // （原 tlDialogStep/tlInputText 系页内 task-list 对话模式状态，已随该模式回退移除）
      // 历史对话栏
      showHistorySidebar: false,
      conversationHistory: [],
      currentConversationId: null,
      currentStepIndex: 0,
      selectedStandard: '',
      standardPickerOpen: true, // 兼容保留（旧展开态，模板已改用 el-select 下拉）
      selectedUnit: 'declaration',
      boundarySubStep: 0, // 阶段二内5个子步骤: 0-4
      isModelBuilt: false, // 是否构建了核算模型
      modelValidated: false, // 模型是否已通过结构校验
      highlightProc: null, // 阶段3新增单元过程后的高亮定位 { gi, pi }
      analysisActiveTab: 'routine', // 阶段八分析页签
      analysisSubStep: 0, // 阶段八的三个子步骤: 0-常规分析, 1-不确定性确认, 2-敏感性及全部解锁
      uncertaintyParams: { sampleSize: 10000, confidenceLevel: 95 }, // 不确定性分析参数
      sensitivityRatio: 10, // 敏感性分析变动比例(%)
      emissionExpandedNodes: {}, // 树表的展开/折叠状态映射表
      boundaryConfig: {
        lifecycleScope: 'cradle-to-grave',
        unitType: 'declaration',
        unitDetail: '1辆汽车（排量1.6L，整备质量1850kg，设计寿命15年/20万公里）',
        allocationRule: 'mass',
        cutoffThreshold: '1%/5%',
        cutoffItemThreshold: '1%',
        cutoffTotalThreshold: '5%',
        timeBoundary: '2024-01-01 - 2024-12-31',
        region: '北京'   // 企业所在省市（用于电力因子与区域因子匹配）
      },
      boundarySourceMeta: null,
      // ===== 多轮澄清 =====
      clarificationState: null,  // 当前澄清状态: null | { topic, step, totalSteps, data }
      clarificationTopics: {
        boundary: {
          name: '核算边界确认',
          steps: [
            { key: 'lifecycle', question: '请确认核算生命周期范围：\n* **摇篮到坟墓**：原材料获取+生产制造+运输分销+产品使用+报废回收\n* **摇篮到大门**：原材料获取+生产制造\n* **大门到大门**：仅生产制造', field: 'lifecycleScope', options: ['摇篮到坟墓', '摇篮到大门', '大门到大门'] },
            { key: 'unit', question: '请确认核算单位：\n* **声明单位**：按产品功能单位（如1辆汽车）\n* **参考单位**：按物理单位（如1kg产品）', field: 'unitType', options: ['声明单位', '参考单位'] },
            { key: 'allocation', question: '请确认分配规则：\n* **质量分配**：按产品质量比例分配\n* **经济分配**：按产品经济价值分配\n* **物理分配**：按物理量分配', field: 'allocationRule', options: ['质量分配', '经济分配', '物理分配'] },
            { key: 'cutoff', question: '请确认取舍规则：\n* **1%/5%规则**：单项<1%且累计<5%可忽略\n* **自定义阈值**：请说明具体阈值', field: 'cutoffThreshold', options: ['1%/5%规则', '自定义阈值'] }
          ]
        },
        dataCollection: {
          name: '活动数据确认',
          steps: [
            { key: 'source', question: '请确认数据来源：\n* **实测数据**：现场仪表/台账记录\n* **估算数据**：行业平均/模型推算\n* **混合数据**：部分实测+部分估算', field: 'dataSource', options: ['实测数据', '估算数据', '混合数据'] },
            { key: 'completeness', question: '数据完整性是否满足要求？\n* **完整**：覆盖所有单元过程\n* **基本完整**：缺少少量次要过程\n* **不完整**：缺少主要过程', field: 'dataCompleteness', options: ['完整', '基本完整', '不完整'] }
          ]
        }
      },
      // ===== 上下文记忆 =====
      userPreferences: {
        defaultStandard: '',      // 常用核算标准
        defaultUnitType: '',      // 常用单位类型
        recentProducts: [],       // 最近核算的产品（最多5个）
        preferredFactorLibs: [],  // 偏好的因子库组合
        customBoundaryRules: {},  // 自定义边界规则
        lastTaskDuration: 0       // 上次任务耗时
      },
      messages: [],
      // ===== 快捷指令面板 =====
      showCmdPanel: false,
      phases: [
        { key: 'POLICY_ANALYSIS', name: '政策标准', label: '依据', icon: 'el-icon-reading', desc: '核算标准选择与政策条款解析', version: '3.10', releaseDate: '2023-11', standards: ['14067', '24067', 'ISO', 'GB/T', 'PEF', '2021/2279'] },
        { key: 'CALCULATION_BOUNDARY', name: '核算边界', label: '边界', icon: 'el-icon-set-up', desc: '生命周期范围、量化单位、分配与取舍规则' },
        { key: 'CALCULATION_MODEL', name: '核算模型', label: '模型', icon: 'el-icon-s-grid', desc: '工艺拓扑构建与单元过程建模' },
        { key: 'ACTIVITY_DATA', name: '活动数据', label: '数据', icon: 'el-icon-s-data', desc: '多源活动数据并发采集' },
        { key: 'CALCULATION_FACTORS', name: '排放因子', label: '因子', icon: 'el-icon-connection', desc: '排放因子库自动匹配绑定' },
        { key: 'DATA_VERIFICATION', name: '数据校验', label: '校验', icon: 'el-icon-warning-outline', desc: '完整性、一致性、趋势、DQR多重校验' },
        { key: 'CARBON_CALCULATION', name: '碳足迹计算', label: '计算', icon: 'el-icon-cpu', desc: '全生命周期碳排放量汇总计算' },
        { key: 'CARBON_ANALYSIS', name: '碳足迹分析', label: '分析', icon: 'el-icon-data-line', desc: '统计分析、不确定性分析与敏感度分析' },
        { key: 'CARBON_REPORT', name: '碳足迹报告', label: '报告', icon: 'el-icon-document', desc: '核算报告生成、数据溯源与核查推荐' }
      ],
      // ===== 标准配置中心 =====
      // R040201 STORY-010（RULE-013）：标准唯一来源为政策标准库（PCF 场景已生效配置），
      inputTypeOptions: [
        { value: 'raw_material', label: '原材料', color: '#409EFF' },
        { value: 'packaging', label: '包装材料', color: '#13C2C2' },
        { value: 'energy', label: '能源', color: '#FA8C16' },
        { value: 'resource', label: '资源', color: '#52C41A' },
        { value: 'consumable', label: '辅料', color: '#722ED1' },
        { value: 'product', label: '中间产品', color: '#EB2F96' },
        { value: 'transport', label: '运输服务', color: '#2F54EB' }
      ],
      outputTypeOptions: [
        { value: 'main_product', label: '主产品', color: '#EB2F96' },
        { value: 'product', label: '中间产品', color: '#EB2F96' },
        { value: 'by_product', label: '副产品', color: '#C62828' },
        { value: 'waste_gas', label: '废气', color: '#F5222D' },
        { value: 'solid_waste', label: '固体废物', color: '#8D6E63' },
        { value: 'wastewater', label: '废水', color: '#1890FF' },
        { value: 'recycled', label: '可回收物', color: '#52C41A' }
      ],
      // 政策标准库必须随页面初始化加载，不能只在重置/任务画像时才赋值
      standards: loadPcfStandardsForAgent(),
      modelStages: this.createInitialModelStages(),
      // 阶段3 单元过程属性抽屉
      modelProcessDrawerVisible: false,
      modelProcessDrawerStageIndex: 0,
      modelProcessDrawerProcessIndex: 0,
      modelProcessDrawerDraft: null,
      modelFlowDrawerVisible: false,
      modelFlowDrawerStageIndex: 0,
      modelFlowDrawerProcessIndex: 0,
      modelFlowDrawerType: 'inputs',
      modelFlowDrawerIndex: 0,
      modelFlowDrawerDraft: null,
      modelUnitOptions: ['kg', 't', 'g', 'kWh', 'MWh', 'MJ', 'Nm³', 'm³', 'L', 't·km', '件', '台', '套', 'm²', 'km'],
      processTypeOptions: [
        { value: 'material_acquisition', label: '物料获取' },
        { value: 'production', label: '生产工序' },
        { value: 'transport', label: '运输' },
        { value: 'storage', label: '仓储' },
        { value: 'use', label: '使用' },
        { value: 'recycling', label: '回收处理' }
      ],
      validationStep: 0,
      inputFileName: '',
      bomRows: [],
      energyRows: [],
      paramRows: [],
      validationActiveTab: 'validation',
      validationItems: this.createDefaultValidationItems(),
      supplementFiles: []
    }
  },
  computed: {

    /** BOM 总重量（kg） */
    bomTotalWeight() {
      const rows = this.bomRows || []
      return Math.round(rows.reduce((a, r) => a + (r.total || 0), 0) * 100) / 100
    },
    /** 能源台账工序数 */
    energyProcessCount() {
      const set = {}
      ;(this.energyRows || []).forEach(r => { set[r.process] = true })
      return Object.keys(set).length
    },
    /** BOM 材料类别数 */
    bomMaterialCount() {
      const set = {}
      ;(this.bomRows || []).forEach(r => { set[r.material] = true })
      return Object.keys(set).length
    },
    /** 量化单位显示值 */
    boundaryUnitTypeLabel() {
      const t = this.boundaryConfig.unitType || ''
      const map = { functional: '功能单位', declaration: '声明单位' }
      return map[t] || t || '—'
    },
    /** 分配规则显示值 */
    boundaryAllocationLabel() {
      const t = this.boundaryConfig.allocationRule || ''
      const map = { mass: '按质量分配', economic: '按经济价值分配', energy: '按能量分配' }
      return map[t] || t || '—'
    },
    stageConfirmConfig() {
      const configs = {
        1: this.boundaryConfirmConfig(),
        2: { label: '确认模型，启动数据收集', icon: 'el-icon-check', hint: '确认工艺拓扑模型无误后，系统将自动完成活动数据采集与因子匹配', action: () => this.sendSuggestion('确认模型，启动数据收集') },
        5: this.validationActiveTab === 'activity'
          ? { label: '确认调整，重新校核', icon: 'el-icon-refresh-right', hint: '数据调整完成后重新进入「数据采集→因子匹配→数据校验」循环', action: () => this.confirmActivityData() }
          : null,
        6: { label: '进入碳足迹分析', icon: 'el-icon-data-analysis', hint: '查看碳足迹计算结果并进入分析阶段', action: () => this.sendSuggestion('进入碳足迹分析') },
        7: { label: '生成碳足迹报告', icon: 'el-icon-document', hint: '碳足迹分析已全部完成，生成碳足迹核算报告', action: () => this.sendSuggestion('导出碳足迹报告') }
      }
      return configs[this.currentStepIndex] || null
    },
    currentProductName() {
      if (!this.currentTaskId) return ''
      const task = this.taskList.find(t => t.id === this.currentTaskId)
      return task ? task.productName : ''
    },
    estimatedTokens() {
      let total = 0
      const all = [...(this.messages || []), ...(this.tlMessages || [])]
      all.forEach(m => {
        const content = m.content || m.text || ''
        total += Math.ceil(content.length * 1.5)
      })
      return total
    },
    modelProcessDrawerStage() {
      return (this.modelStages || [])[this.modelProcessDrawerStageIndex] || null
    },
    modelProcessDrawerProcess() {
      const stage = this.modelProcessDrawerStage
      return stage && (stage.processes || [])[this.modelProcessDrawerProcessIndex]
    },
    modelProcessUpstreamLabel() {
      const draft = this.modelProcessDrawerDraft
      if (!draft || !draft.upstreamProcessCode) return ''
      const option = this.upstreamProcessOptions(this.modelProcessDrawerStageIndex, this.modelProcessDrawerProcessIndex)
        .find(item => item.value === draft.upstreamProcessCode)
      return option ? option.label : draft.upstreamProcessCode
    },
    modelFlowDrawerStage() {
      return (this.modelStages || [])[this.modelFlowDrawerStageIndex] || null
    },
    modelFlowDrawerProcess() {
      const stage = this.modelFlowDrawerStage
      return stage && (stage.processes || [])[this.modelFlowDrawerProcessIndex]
    },
    modelFlowDrawerFlow() {
      const proc = this.modelFlowDrawerProcess
      const list = proc && proc[this.modelFlowDrawerType]
      return list && list[this.modelFlowDrawerIndex]
    },
    modelFlowTargetLabel() {
      const draft = this.modelFlowDrawerDraft
      if (!draft || !draft.targetFlowRef) return ''
      const option = this.downstreamProcessOptions(this.modelFlowDrawerStageIndex, this.modelFlowDrawerProcessIndex)
        .find(item => item.value === draft.targetFlowRef)
      return option ? option.label : draft.targetFlowRef
    },
    formattedTokens() {
      const t = this.estimatedTokens
      if (t >= 10000) return (t / 10000).toFixed(1) + '万 tokens'
      if (t >= 1000) return (t / 1000).toFixed(1) + 'k tokens'
      return t + ' tokens'
    },
    // 当前选中标准的完整配置
    selectedStandardConfig() {
      const selected = this.selectedStandard
      if (!selected) return (this.standards || [])[0] || null
      try {
        ensureSeed()
        const raw = (loadStandards() || []).find(s => s && s.code === selected)
        if (raw) return toStandardConfig(raw)
      } catch (e) { /* 标准库异常时回退当前内存对象 */ }
      const list = Array.isArray(this.standards) ? this.standards : []
      return list.find(s => s.code === selected) || list[0] || null
    },
    /** 标准时间边界是否为要求性文本（日期区间选择器无法回显） */
    isTextBoundaryTime() {
      const value = String((this.boundaryConfig && this.boundaryConfig.timeBoundary) || '')
      return Boolean(value) && !/^\d{4}-\d{2}-\d{2}\s-\s\d{4}-\d{2}-\d{2}$/.test(value.trim())
    },
    /** 阶段二数据来源提示：边界配置 Skill + 已选标准；Skill 禁用时仅显示标准来源 */
    boundarySourceLabel() {
      const meta = this.boundarySourceMeta || {}
      const skill = meta.skillName || ''
      const standard = meta.standardCode || (this.selectedStandardConfig && this.selectedStandardConfig.code)
      if (standard) return `${skill ? skill + '预填 · ' : ''}${standard}细化/固化`
      return skill ? `${skill}预填 · 工作台兜底` : '工作台兜底'
    },
    /** 完整性要求（4.3.3.4） */
    stdCompletenessRule() {
      const cfg = this.selectedStandardConfig || {}
      return cfg.completenessRule || ''
    },


    /** 标准是否明确固定了生命周期阶段（乘用车等技术规范类） */
    stdStagesFixed() {
      const cfg = this.selectedStandardConfig || {}
      return cfg.stagesFixed === true
    },
    /** 标准规定的生命周期口径标签 */
    stdScopeLabel() {
      const cfg = this.selectedStandardConfig || {}
      const v = cfg.scopeFixedValue || (cfg.boundaryTemplate && cfg.boundaryTemplate.lifecycleScope) || ''
      const map = {
        'cradle-to-grave': '摇篮到坟墓',
        'cradle-to-gate': '摇篮到大门',
        'cradle-to-use': '摇篮到使用',
        'gate-to-gate': '大门到大门'
      }
      return map[v] || v || '—'
    },
    /** 标准规定的阶段名称清单（标准未配置 modelConfig.stages 时回落通用 5 阶段） */
    stdStageNames() {
      const cfg = this.selectedStandardConfig || {}
      const mc = cfg.modelConfig || {}
      let arr = mc.stages || mc.lifecyclePhases || cfg.lifecyclePhases || []
      if (!Array.isArray(arr)) arr = []
      arr = arr.filter(Boolean)
      if (arr.length) return arr
      return ['原材料获取阶段', '生产制造阶段', '运输分销阶段', '产品使用阶段', '报废回收阶段']
    },
    /** 标准是否配置了阶段清单（用于区分「标准固定」与「通用 5 阶段兜底」） */
    stdStagesFromStandard() {
      const cfg = this.selectedStandardConfig || {}
      const mc = cfg.modelConfig || {}
      const arr = mc.stages || mc.lifecyclePhases || cfg.lifecyclePhases || []
      return Array.isArray(arr) && arr.filter(Boolean).length > 0
    },

    /** 标准适用范围 */
    stdScope() {
      return (this.selectedStandardConfig && this.selectedStandardConfig.scope) || ''
    },
    /** 量化单位类型标签 */
    stdUnitTypeLabel() {
      const cfg = this.selectedStandardConfig || {}
      const t = (cfg.boundaryTemplate && cfg.boundaryTemplate.unitType) || ''
      const map = { functional: '功能单位', declaration: '声明单位', scope123: '核算范围口径' }
      return map[t] || t || '—'
    },
    /** 量化单位详情 */
    stdUnitDetail() {
      const cfg = this.selectedStandardConfig || {}
      return (cfg.boundaryTemplate && cfg.boundaryTemplate.unitDetail) || ''
    },
    /** 分配规则标签：遵循 4.3.2 的三层优先级 */
    stdAllocationLabel() {
      const cfg = this.selectedStandardConfig || {}
      const t = (cfg.boundaryTemplate && cfg.boundaryTemplate.allocationRule) || ''
      // 乘用车等技术规范：采用「避免分配 → 物理关系 → 经济关系」三层优先级
      if (t === 'economic') {
        return '优先避免分配（细分单元过程/扩展系统边界）→ 其次按物理关系（重量/数量/体积/热值）→ 最后按经济价值（产值/利润，不确定性较高）'
      }
      const map = { mass: '按质量分配', energy: '按能量分配' }
      return map[t] || t || '—'
    },
    /** 取舍准则汇总 */
    stdCutoff() {
      const cfg = this.selectedStandardConfig || {}
      return (cfg.boundaryTemplate && cfg.boundaryTemplate.cutoffThreshold) || ''
    },
    /** 标准明确的单项取舍阈值 */
    stdCutoffItem() {
      const cfg = this.selectedStandardConfig || {}
      return (cfg.boundaryTemplate && cfg.boundaryTemplate.cutoffItemThreshold) || ''
    },
    /** 标准明确的累计取舍阈值 */
    stdCutoffTotal() {
      const cfg = this.selectedStandardConfig || {}
      return (cfg.boundaryTemplate && cfg.boundaryTemplate.cutoffTotalThreshold) || ''
    },
    /** 时间边界要求 */
    stdTimeBoundary() {
      const cfg = this.selectedStandardConfig || {}
      return (cfg.boundaryTemplate && cfg.boundaryTemplate.timeBoundary) || ''
    },
    /** 纳入的碳排放源 */
    stdEmissionSources() {
      const cfg = this.selectedStandardConfig || {}
      const arr = cfg.emissionSources || []
      return Array.isArray(arr) ? arr : []
    },
    /** 排除的排放源 */
    stdExcludedSources() {
      const cfg = this.selectedStandardConfig || {}
      const arr = cfg.excludedSources || []
      return Array.isArray(arr) ? arr : []
    },

    stageList() {
      const cfg = this.selectedStandardConfig
      return (cfg && cfg.modelConfig && cfg.modelConfig.stages) || []
    },
    dataFieldsText() {
      const map = {
        activityData: '活动数据', unit: '单位', source: '来源', timeReference: '时间参照',
        raw_material: '原材料', energy: '能源', transport: '运输',
        main_product: '主产品', waste_gas: '废气', solid_waste: '固废'
      }
      const cfg = this.selectedStandardConfig
      const arr = (cfg && cfg.dataSchema && cfg.dataSchema.requiredFields) || []
      return arr.map(k => map[k] || k).join('、') || '—'
    },
    completenessThreshold() {
      const cfg = this.selectedStandardConfig
      return (cfg && cfg.validationRules && cfg.validationRules.completenessThreshold) || 95
    },
    dqrScoreThreshold() {
      const cfg = this.selectedStandardConfig
      return (cfg && cfg.validationRules && cfg.validationRules.dqrScoreThreshold) || 3
    },
    stdBoundary() {
      const cfg = this.selectedStandardConfig
      return (cfg && cfg.boundaryTemplate) || {}
    },
    /** 标准知识分组（标准库详情「标准知识」页签同源） */
    stdKnowledgeDims() {
      const cfg = this.selectedStandardConfig || {}
      const arr = cfg.dimensions || []
      return Array.isArray(arr) ? arr : []
    },
    stdKnowledgeGroupCount() {
      return this.stdKnowledgeDims.length
    },
    stdKnowledgePointCount() {
      let n = 0
      this.stdKnowledgeDims.forEach(d => {
        n += (d.type === 'table' ? (d.rows || []).length : (d.points || []).length)
      })
      return n
    },
    /** 解析出的核算公式 */
    stdFormulaList() {
      const cfg = this.selectedStandardConfig || {}
      const arr = cfg.formulas || []
      return Array.isArray(arr) ? arr : []
    },
    /** 解析出的参数与因子 */
    stdParamList() {
      const cfg = this.selectedStandardConfig || {}
      const arr = cfg.parameters || []
      return Array.isArray(arr) ? arr : []
    },
    /** 报告模板：章节与字段 */
    stdReportSections() {
      const cfg = this.selectedStandardConfig || {}
      const tpl = cfg.reportTemplateDetail || null
      if (!tpl) return []
      const arr = Array.isArray(tpl) ? tpl : (tpl.sections || [])
      return Array.isArray(arr) ? arr : []
    },
    stdReportTitle() {
      const cfg = this.selectedStandardConfig || {}
      const tpl = cfg.reportTemplateDetail || null
      if (!tpl || Array.isArray(tpl)) return ''
      return tpl.name || tpl.title || ''
    },
    standardsWithSelection() {
      // 按任务类型初筛：风机任务剔除汽车行业专属标准 QC/T 1248-2025（通用核算标准保留）
      let list = Array.isArray(this.standards) ? this.standards : []
      if (this.isWindTask()) {
        list = list.filter(std => std.code !== 'QC/T 1248-2025')
      }
      return list.map(std => ({
        ...std,
        active: std.code === this.selectedStandard
      }))
    },
    lifecycleScopeLabel() {
      const t = (this.selectedStandardConfig && this.selectedStandardConfig.boundaryTemplate && this.selectedStandardConfig.boundaryTemplate.lifecycleScope) || this.boundaryConfig.lifecycleScope
      const map = {
        'cradle-to-grave': '摇篮到坟墓',
        'cradle-to-gate': '摇篮到大门',
        'cradle-to-use': '摇篮到使用（范围：原材料获取 + 整车生产 + 使用，不含报废回收）',
        'gate-to-gate': '大门到大门',
        'operational': '运营控制权法',
        'financial': '财务控制权法',
        'equity': '股权比例法'
      }
      return map[t] || t || '—'
    },
    unitTypeLabel() {
      return this.boundaryConfig.unitType === 'declaration' ? '声明单位' : '功能单位'
    },
    allocationRuleLabel() {
      const map = { 'mass': '质量分配', 'economic': '经济分配', 'energy': '能源分配' }
      return map[this.boundaryConfig.allocationRule] || this.boundaryConfig.allocationRule
    },
    boundarySummaryItems() {
      const b = this.boundaryConfig
      return [
        { label: '生命周期范围', value: this.lifecycleScopeLabel, set: this.boundarySubStep >= 1 },
        { label: '量化单位', value: this.unitTypeLabel + (b.unitDetail ? '：' + b.unitDetail : ''), set: this.boundarySubStep >= 2 },
        { label: '分配规则', value: this.allocationRuleLabel, set: this.boundarySubStep >= 3 },
        { label: '取舍规则', value: b.cutoffThreshold + '（单项<' + b.cutoffItemThreshold + '，累计≤' + b.cutoffTotalThreshold + ')', set: this.boundarySubStep >= 4 },
        { label: '时间边界', value: b.timeBoundary, set: this.boundarySubStep >= 5 }
      ]
    },
    carbonFootprintUnitLabel() {
      if (this.isWindTask()) return '台（度电碳足迹 gCO₂e/kWh）'
      return this.boundaryConfig.unitType === 'declaration' ? '辆' : '150,000 km'
    },
    boundaryDateRange: {
      get() {
        if (this.boundaryConfig.timeBoundary) {
          const parts = this.boundaryConfig.timeBoundary.split(' - ')
          if (parts.length === 2) return parts
        }
        return []
      },
      set(val) {
        if (Array.isArray(val) && val.length === 2 && val[0] && val[1]) {
          this.boundaryConfig.timeBoundary = val[0] + ' - ' + val[1]
        } else {
          this.boundaryConfig.timeBoundary = ''
        }
      }
    },
    reportStageBars() {
      const total = this.totalCarbonEmission
      const colors = ['#607d8b', '#ff9800', '#722ed1', '#2196f3', '#52c41a']
      const keys = ['raw', 'manu', 'trans', 'use', 'recycle']
      return this.emissionTreeData.map((stage, i) => {
        const pct = total > 0 ? (stage.emission / total * 100) : 0
        return {
          key: keys[i] || `stage-${i}`,
          label: stage.name,
          value: stage.emission,
          pct: pct,
          color: colors[i] || '#999',
          width: pct + '%'
        }
      })
    },
    reportDetailRows() {
      const rows = []
      const total = this.totalCarbonEmission
      let id = 1
      this.emissionTreeData.forEach(stage => {
        stage.children.forEach(proc => {
          rows.push({
            id: id++,
            stage: String(stage.name || '').split('（')[0],
            process: proc.name,
            emission: proc.emission,
            pct: total > 0 ? (proc.emission / total * 100).toFixed(1) + '%' : '0%',
            rowClass: '',
            isBold: false
          })
        })
        rows.push({
          id: id++,
          stage: '',
          process: '小计',
          emission: stage.emission,
          pct: total > 0 ? (stage.emission / total * 100).toFixed(1) + '%' : '0%',
          rowClass: 'row-subtotal',
          isBold: true
        })
      })
      rows.push({
        id: id++,
        stage: '',
        process: '碳足迹总计',
        emission: total,
        pct: '100%',
        rowClass: 'row-total',
        isBold: true
      })
      return rows
    },
    reportDqrData() {
      return [
        { name: '可靠性', score: 1.5, color: '#52c41a' },
        { name: '完整性', score: 2.0, color: '#0067FE' },
        { name: '时间相关性', score: 2.5, color: '#faad14' },
        { name: '地理相关性', score: 2.0, color: '#722ed1' },
        { name: '技术相关性', score: 2.5, color: '#eb2f96' }
      ]
    },
    /**
     * 数据质量评分（DQR）汇总 —— 用于阶段八 KPI 卡片
     * DQR 各维度为 1~5 分（1=最优），此处翻转为 5 分制得分（5=最优）
     */
    dqrSummary() {
      const dims = this.reportDqrData || []
      const max = 5
      if (!dims.length) {
        return { score: '—', max, grade: '暂无评分', cls: '' }
      }
      const avgCost = dims.reduce((s, d) => s + (Number(d.score) || 0), 0) / dims.length
      // DQR 成本 1~5 → 得分 5~1
      const score = Math.round((max + 1 - avgCost) * 10) / 10
      let grade = '较差'
      let cls = 'up-color'
      if (score >= 4.5) { grade = '优秀'; cls = 'down-color' }
      else if (score >= 3.5) { grade = '良好'; cls = 'down-color' }
      else if (score >= 2.5) { grade = '合格'; cls = '' }
      return {
        score: score.toFixed(1),
        max,
        grade,
        cls
      }
    },
    reportSensitivityData() {
      // 风机任务：敏感性因子取自风机五环节模型真实排放基数（净额口径）
      if (this.isWindTask()) {
        return [
          { name: '年发电小时数', coeff: -0.91, baseEmission: 3035649 },   // 度电分母：小时数+10% → 度电约-9%
          { name: '稀土采选冶因子', coeff: 0.46, baseEmission: 111600 },   // 6,000kg × 18.6
          { name: '玻纤/环氧树脂因子', coeff: 0.21, baseEmission: 437850 }, // 85,000×2.71 + 50,000×4.15
          { name: '回收钢抵扣系数', coeff: -0.24, baseEmission: 375000 },  // 300,000kg × (-1.25)
          { name: '电网排放因子（制造+施工）', coeff: 0.33, baseEmission: 101094 } // (112,000+62,000)×0.581
        ]
      }
      const scale = this.totalCarbonEmission > 0 ? this.totalCarbonEmission / 16510.5 : 1
      return [
        { name: '原铝冶炼电力', coeff: 0.42, baseEmission: 841.7 * scale },
        { name: '拆解能耗', coeff: 0.32, baseEmission: 671.9 * scale },
        { name: '再生钢含量比例', coeff: -0.22, baseEmission: 967.2 * scale },
        { name: '再生铝含量比例', coeff: -0.15, baseEmission: 841.7 * scale },
        { name: '汽油碳排放因子', coeff: 0.75, baseEmission: 12800.0 * scale }
      ]
    },
    sensitivityImpactData() {
      const ratio = this.sensitivityRatio / 100
      const total = this.totalCarbonEmission
      return this.reportSensitivityData.map(item => {
        const impactVal = item.coeff * item.baseEmission * ratio
        const impactPct = Math.abs(impactVal) / total * 100
        return {
          ...item,
          impactValue: impactVal,
          impactPct: impactPct,
          barWidth: Math.min(impactPct * 5, 100) // 乘5放大视觉效果，上限100%
        }
      })
    },
    // 已启用因子库数量（因子库选择弹窗底部计数）
    enabledLibCount() {
      return (this.factorDatabases || []).filter(l => l.selected).length
    },
    // 溯源数据按任务切换：风机任务→风机数据项，其余→汽车数据项
    activeTraceabilityData() {
      return this.isWindTask() ? this.windTraceabilityData : this.defaultTraceabilityData
    },
    // ===== 阶段八·分析中心演示数据（按任务画像切换：本期值直接取自 emissionTreeData，保证与阶段七/报告自洽） =====
    analysisProfile() {
      const total = this.totalCarbonEmission || 1
      const stages = this.emissionTreeData || []
      const mkYoy = (ratePct) => stages.map((s, i) => {
        const rate = ratePct[i] || 0
        const curr = s.emission
        const prev = curr / (1 + rate / 100)
        const maxVal = Math.max(curr, prev)
        return {
          name: `${i + 1}. ${s.name}`,
          rate: rate,
          rateCls: rate > 0 ? 'up-color' : 'down-color',
          rateText: (rate > 0 ? '↑ ' : '↓ ') + Math.abs(rate).toFixed(1) + '%',
          currText: this.formatEmission(curr) + ' kg',
          prevText: this.formatEmission(prev) + ' kg',
          currWidth: Math.max(Math.min(curr / total * 100, 100), 2) + '%',
          prevWidth: Math.max(Math.min(prev / total * 100, 100), 2) + '%',
          maxVal: maxVal
        }
      })
      if (this.isWindTask()) {
        return {
          kpis: [
            { label: '总排放总量', value: this.formatEmission(total), unit: 'kgCO₂e', cls: '', sub: '' },
            { label: '度电碳足迹', value: `≈ ${this.degreeEmission}`, unit: 'gCO₂e/kWh', cls: '', sub: '' },
            { label: '同比变化', value: '↓ 1.9%', sub: '减排5.8万kg', cls: 'down-color' },
            { label: '数据质量评分', value: this.dqrSummary.score, unit: `/ ${this.dqrSummary.max}`, cls: this.dqrSummary.cls, sub: this.dqrSummary.grade }
          ],
          yoyTitle: '生命周期阶段同比基准期对比',
          yoyRows: mkYoy([-4.8, -1.2, 2.1, -3.2, 0.6]),
          momTitle: '单元过程环比上期波动排行榜',
          momRows: [
            { proc: '叶片制造固化挥发物收集效率提升', change: '↓ 5.4% 🟢', cls: 'down-color' },
            { proc: '吊装施工机械柴油优化', change: '↓ 1.5% 🟢', cls: 'down-color' },
            { proc: '稀土采选冶因子版本更新', change: '↑ 1.2% 🔴', cls: 'up-color' }
          ],
          conclusionText: '原材料生产环节为全生命周期最大排放来源（占正排放49.3%），叶片玻纤/环氧树脂、塔筒钢材与直驱发电机稀土永磁材料为主要贡献；风场建设安装环节次之（占40.1%），基础混凝土与吊装施工柴油影响显著；零部件加工（3.0%）、大件运输（2.7%）与运营维护（2.4%）占比较低，报废回收阶段钢/铜回收抵扣显著降低净排放。',
          routineSugs: [
            { title: '原材料生产环节为全生命周期首要热点，应作为减排核心抓手', text: '原材料生产环节占正排放的49.3%，叶片玻纤/环氧树脂、塔筒钢材与发电机钕铁硼永磁材料是主要来源。建议：一是与叶片供应商协同推进大丝束玻纤与生物基环氧树脂应用；二是评估中速永磁等技术路线以降低稀土用量；三是将碳排放要求纳入材料采购合同条款，推动供应链整体减碳。该环节减排投入产出比最高，建议作为近期减排规划的优先领域。' },
            { title: '风场建设安装阶段的混凝土与施工能耗优化空间显著', text: '风场建设安装环节占正排放的40.1%，风机基础混凝土、集电线路混凝土与吊装施工机械柴油是主要排放源。建议优化基础结构设计以降低混凝土用量，探索低碳水泥与粉煤灰掺合料替代；施工环节可通过机械化方案优化与新能源施工机械试点降低柴油消耗，并优先选择运输半径内的部件供应基地以缩短大件运输距离。' },
            { title: '运营维护环节备件与润滑油管理影响长期碳足迹', text: '20年运营维护期内齿轮箱润滑油更换与备件更换是主要排放来源（占正排放2.4%，占比最低但随寿命累积）。建议建立备件寿命预测与预防性维护体系，延长关键部件更换周期；优先选用长寿命润滑油并规范废油回收处置，减少运维期排放的同时降低度电碳足迹。' },
            { title: '报废回收阶段提升叶片回收率，保障回收抵扣数据质量', text: '报废回收阶段钢材/铜回收抵扣显著降低全生命周期碳足迹，但废玻纤叶片处置仍是行业难点。建议跟踪玻纤回收（水泥窑协同/热解回收）技术进展，与专业回收服务商建立合作；同时完善回收钢铜的计量与台账管理，确保回收抵扣数据可审计，支撑度电碳足迹持续下降。' }
          ],
          uncSources: [
            { name: '稀土采选冶因子波动', badge: '高影响', cls: 'unc-high', pct: '贡献 28.4%', detail: '钕铁硼永磁材料6,000kg，稀土采选冶因子18.6 kgCO₂e/kg受矿源品位与分离工艺影响±15%，影响±16,700 kgCO₂e，是当前首要不确定度来源' },
            { name: '电网排放因子（企业不可控）', badge: '仅参考', cls: 'unc-low', pct: '贡献 27.1%', detail: '零部件制造与施工用电合计422,000kWh，电网排放因子随全国电网结构演进年际波动±5%，影响±5,100 kgCO₂e。该因素属外部参数，企业无法直接控制，仅供核算参考' },
            { name: '废玻纤处置因子数据质量', badge: '中影响', cls: 'unc-med', pct: '贡献 16.2%', detail: '废玻纤叶片135,000kg处置因子引用Ecoinvent国外数据库，地理代表性偏差±20%，影响±9,500 kgCO₂e' },
            { name: '年发电小时数取值偏差', badge: '中影响', cls: 'unc-med', pct: '贡献 15.6%', detail: '年发电小时数取4,200h为可研值，SCADA实测存在±3%年际波动，直接影响度电碳足迹分母（度电值波动±0.17 gCO₂e/kWh）' }
          ],
          uncSugs: [
            { title: '核实稀土永磁材料因子取值，降低原材料端不确定度', text: '钕铁硼稀土采选冶因子为当前最大不确定度来源。建议向发电机供应商索取稀土原料溯源清单与实测因子数据，必要时委托第三方开展稀土供应链LCA评估，通过提高实测数据比例有效收窄原材料阶段核算波动范围。' },
            { title: '跟踪国内风电叶片回收处置因子发布动态', text: '废玻纤叶片处置因子当前依赖国际数据库，地理代表性存在偏差。建议关注国内风电叶片回收处置因子与行业LCA数据库发布进展，及时替换为本土因子，提升报废回收阶段数据代表性。' },
            { title: '以SCADA实测数据滚动修正发电量参数', text: '年发电小时数是度电碳足迹的关键分母。建议建立投运后SCADA实测数据的年度滚动修正机制，以实测均值替代可研假设值，持续降低使用阶段参数不确定性。' },
            { title: '当前不确定度水平满足标准要求，建议持续优化数据质量', text: '当前核算的不确定度在标准可接受范围内。如需对外披露或申请碳标签认证，建议进一步提升活动数据和排放因子的实测比例，逐步降低对数据库默认值的依赖，将数据质量提升纳入企业碳管理工作计划。' }
          ],
          sensSugs: [
            { pri: 'P1', cls: 'sug-priority-1', numCls: 'pri-1', title: '发电小时数与发电量提升 (敏感度 -0.91) — 度电分母端首要杠杆', text: '度电碳足迹以全生命周期发电量为分母，对年发电小时数最为敏感（小时数+10%对应度电约-9%）。建议在风场规划阶段强化测风与微观选址优化，选用高容量系数机型；运维期通过智能提效改造（偏航校正/叶片气动附件）提升可利用率，以更高的实际发电量摊薄单位电量碳足迹。', kpis: ['方向：发电量提升', '策略：选址优化 + 智能提效', '优先级：最高'] },
            { pri: 'P2', cls: 'sug-priority-2', numCls: 'pri-2', title: '稀土永磁材料碳因子优化 (敏感度 +0.46) — 材料端首要减排方向', text: '稀土采选冶因子对全生命周期排放影响最大，主要受矿源与分离工艺电力来源影响。建议在发电机采购中优先选择稀土供应链碳数据透明的供应商，评估中速永磁等低重稀土技术路线，必要时通过多供应商竞争获取更优低碳方案。该方向通过采购策略调整即可推进，实施门槛较低。', kpis: ['方向：稀土供应链低碳化', '策略：供应商选择 + 技术路线评估', '优先级：高'] },
            { pri: 'P3', cls: 'sug-priority-3', numCls: 'pri-3', title: '回收钢抵扣率提升 (敏感度 -0.24) — 末端减排路径', text: '报废回收阶段钢材/铜回收抵扣对全生命周期结果有显著负向影响。建议完善退役机组回收拆解流程与计量台账，提升材料回收率与回收数据质量；跟踪叶片玻纤热解回收等新技术产业化进展，逐步扩大可抵扣回收材料范围，从末端持续降低碳足迹。', kpis: ['方向：回收率与数据质量', '策略：拆解优化 + 台账完善', '优先级：较高'] },
            { pri: 'P4', cls: 'sug-priority-4', numCls: 'pri-4', title: '制造与施工用电清洁化 — 绿电替代方向', text: '零部件制造与施工用电的电网排放因子为重要可控相关参数。建议叶片/机舱/塔筒生产基地逐步提高绿电使用比例（绿电直购或分布式光伏），施工环节优先接入当地绿电或采用储能供电，降低制造与建设环节的碳排放强度。', kpis: ['方向：绿电替代', '策略：绿电采购 + 施工供电优化', '优先级：持续推进'] }
          ],
          sensSummary: 'P1 从发电量分母端摊薄度电碳足迹（敏感度最高）；P2 聚焦稀土供应链碳数据透明化与低稀土技术路线；P3 提升回收抵扣率与数据质量；P4 推进制造与施工绿电替代。四项方向均聚焦企业可控环节，建议结合自身资源禀赋分阶段实施。'
        }
      }
      return {
        kpis: [
          { label: '总排放总量', value: this.formatEmission(total), unit: 'kgCO₂e', cls: '', sub: '' },
          { label: '同比变化', value: '↓ 2.1%', sub: '减排333kg', cls: 'down-color' },
          { label: '环比变化', value: '↓ 0.8%', sub: '改善成效', cls: 'down-color' },
          { label: '数据质量评分', value: this.dqrSummary.score, unit: `/ ${this.dqrSummary.max}`, cls: this.dqrSummary.cls, sub: this.dqrSummary.grade }
        ],
        yoyTitle: '生命周期阶段同比基准期对比',
        yoyRows: mkYoy([-23.2, -0.8, -2.1, 3.1]),
        momTitle: '单元过程环比上期波动排行榜',
        momRows: [
          { proc: '热塑性塑料注塑成型 (选用低碳催化剂)', change: '↓ 5.4% 🟢', cls: 'down-color' },
          { proc: '涂装工序总装检测 (精益节电改进)', change: '↓ 1.5% 🟢', cls: 'down-color' },
          { proc: '钢材轧制与深加工 (焦炭配比微幅波动)', change: '↑ 1.2% 🔴', cls: 'up-color' }
        ],
        conclusionText: '原材料获取阶段为企业可控排放最大来源（占企业可控排放60.3%），通过再生钢铝含量提升（钢45%/铝30%）较上期降低23.2%。企业应聚焦原材料采购、生产制造、运输分销等可控环节推进减排。',
        routineSugs: [
          { title: '原材料获取阶段为企业可控排放首要热点，应作为减排核心抓手', text: '原材料获取阶段占企业可控排放的60.3%，是生产企业能够直接发力减排的最大环节。建议企业从三个方向推进：一是持续提升再生材料使用比例，与上游供应商协同扩大再生钢、再生铝的采购渠道；二是探索低碳替代材料，在保证产品性能前提下逐步引入碳足迹更低的原材料；三是将碳排放要求纳入采购合同条款，推动供应链整体减碳。该阶段减排投入产出比较高，建议作为近期减排规划的优先领域。' },
          { title: '生产制造阶段能耗优化仍有减排空间', text: '生产制造阶段的碳排放主要来源于能源消耗，其中涂装等工序占比较高。建议企业持续推进精益生产和节能改造，优化关键工序的能源使用效率。同时可逐步提高清洁能源在厂区用能中的占比，降低生产环节的碳排放强度。建议定期开展能源审计，识别高耗能工序并制定改进计划。' },
          { title: '运输分销阶段物流优化有助于降低碳排放', text: '运输分销阶段虽占比较小，但企业可通过物流网络优化实现减排。建议企业优化运输路线规划，提高车辆装载率，减少空驶里程。同时可评估新能源物流车的适用场景，在短途配送环节逐步替换传统燃油运输车辆。与物流服务商合作时，可将碳排放绩效纳入考核指标，推动运输环节低碳化。' },
          { title: '建立供应商碳排放管理体系，降低上游碳因子波动风险', text: '部分原材料碳排放因子存在波动，可能影响碳足迹核算结果的稳定性。建议企业建立供应商碳排放数据收集机制，定期更新关键材料的排放因子数据。对于碳因子较高的材料，可探索低碳替代方案或调整采购策略，逐步构建低碳供应链体系。' }
        ],
        uncSources: [
          { name: '再生铝比例实测偏差', badge: '高影响', cls: 'unc-high', pct: '贡献 24.5%', detail: '再生铝30%为供应商声明值而非实测，实际比例波动范围25%~38%，影响铝材EF加权结果±330 kgCO₂e，是企业可控范围内首要不确定度来源' },
          { name: '钢材排放因子数据质量', badge: '中影响', cls: 'unc-med', pct: '贡献 22.3%', detail: '钢材用量800kg(非合金钢620+钢/铸钢180)，因子2.12/2.31来源CPCD数据库不同钢企工艺差异±10%，影响±170 kgCO₂e' },
          { name: '涂装天然气计量精度', badge: '中影响', cls: 'unc-med', pct: '贡献 18.0%', detail: '涂装天然气850Nm³，计量仪表精度±3%为可控范围，同时存在使用侧与生产侧双记录口径偏差，合计影响±105 kgCO₂e' },
          { name: '汽油碳排放因子（企业不可控）', badge: '仅参考', cls: 'unc-low', pct: '贡献 35.2%', detail: '汽油排放因子2.31 kgCO₂e/L，不同原油来源及炼油工艺差异±8%，影响±1,024波动。该因素属外部参数，企业无法直接控制，仅供核算参考' }
        ],
        uncSugs: [
          { title: '提升原材料再生比例的实测数据质量，降低关键参数不确定度', text: '再生铝比例等关键参数当前依赖供应商声明值，是企业可控范围内不确定度的主要来源。建议企业建立原材料碳数据溯源台账，要求供应商提供再生比例的第三方验证报告，并定期抽检核实。通过提高实测数据比例，可有效降低原材料阶段碳排放核算的波动范围。' },
          { title: '要求关键材料供应商提供第三方碳数据验证', text: '部分原材料再生比例为供应商声明值，缺乏第三方验证。建议企业在采购合同中逐步要求供应商提供EPD环境产品声明或第三方核查报告，提升再生材料比例等关键数据的可信度，减少因声明偏差带来的不确定性。' },
          { title: '多数据源交叉验证关键材料排放因子', text: '钢材等大宗材料的排放因子受生产工艺影响存在差异。建议企业同时参考多个权威数据库进行交叉比对，选取与企业实际采购材料工艺最匹配的因子值。对于偏差较大的因子，建议开展实地调研或委托第三方评估。' },
          { title: '当前不确定度水平满足标准要求，建议持续优化数据质量', text: '当前碳足迹核算的不确定度在标准可接受范围内。如需对外披露或申请碳标签认证，建议进一步提升活动数据和排放因子的实测比例，逐步降低对数据库默认值的依赖。建议将数据质量提升纳入企业碳管理工作计划，分阶段推进。' }
        ],
        sensSugs: [
          { pri: 'P1', cls: 'sug-priority-1', numCls: 'pri-1', title: '原材料碳因子优化 (敏感度 +0.42) — 企业可控首要减排方向', text: '铝材碳排放因子对企业可控排放影响最大，主要受冶炼电力来源影响。建议企业在铝材采购中优先选择使用清洁能源的供应商，并逐步提高再生铝的采购比例。可通过供应商评估和采购合同条款引导上游减碳，必要时引入多家供应商竞争以获取更优的低碳材料方案。该方向通过采购策略调整即可推进，实施门槛较低。', kpis: ['方向：低碳原材料采购', '策略：供应商选择 + 再生比例提升', '优先级：最高'] },
          { pri: 'P2', cls: 'sug-priority-2', numCls: 'pri-2', title: '再生材料比例提升 (敏感度 -0.22~-0.15) — 原料端减排杠杆', text: '提高再生钢和再生铝含量比例可有效降低原材料阶段的碳排放。建议企业与钢材、铝材供应商沟通，了解当前再生材料的市场可供应能力和价格差异，逐步提高采购中的再生比例要求。该方向主要通过采购策略调整即可推进，无需大规模技术改造，是投入产出比较高的减排路径。', kpis: ['方向：再生材料提升', '策略：采购条款调整 + 供应商协同', '优先级：高'] },
          { pri: 'P3', cls: 'sug-priority-3', numCls: 'pri-3', title: '报废回收拆解能耗 (敏感度 +0.32) — 末端减排路径', text: '报废回收阶段的拆解能耗对企业可控排放有显著影响。建议企业关注产品可回收性设计，在研发阶段考虑拆解便利性和材料回收率，降低报废处理阶段的能源消耗。同时可与专业拆解服务商合作，优化拆解流程，提升资源回收效率，从末端环节降低碳足迹。', kpis: ['方向：可回收性设计 + 拆解优化', '策略：研发设计 + 服务商合作', '优先级：较高'] },
          { pri: 'P4', cls: 'sug-priority-4', numCls: 'pri-4', title: '生产制造能耗优化 — 工艺节能方向', text: '生产制造阶段的能源消耗是企业的直接可控排放。建议企业持续推进精益生产和节能改造，定期开展能源审计识别高耗能工序，优化涂装、冲压等关键工艺的能源使用效率。同时可逐步提高厂区清洁能源使用比例，降低生产环节的碳排放强度。', kpis: ['方向：工艺节能 + 清洁能源', '策略：能源审计 + 设备改造', '优先级：持续推进'] }
        ],
        sensSummary: 'P1+P2 聚焦原材料采购端，通过供应商选择和再生比例提升实现近期减排；P3 从产品设计端优化报废回收；P4 持续推进生产制造节能。四项方向均聚焦企业可控环节，建议结合自身资源禀赋分阶段实施。'
      }
    },
    // ===== 阶段九·报告叙述性内容（按任务画像切换） =====
    reportProfile() {
      if (this.isWindTask()) {
        return {
          coverTitle: '6.5MW陆上风电机组产品碳足迹核算报告',
          product: '6.5MW陆上风电机组',
          model: 'EN-171/6.5',
          lifeDesc: '核算产品物理单位边界为台，机组设计寿命20年。功能单位定义为度电碳足迹（gCO₂e/kWh），基于额定功率6.5MW与年发电小时数4,200h。',
          dqrConclusion: '本次碳足迹核算结果整体不确定度为 ±11.6%（95%置信度），变异系数 6.0%，处于较低水平。蒙特卡洛模拟（N=10,000）表明碳足迹总量在 ' + this.confidenceIntervalText + ' kgCO₂e 区间内波动，结果稳定可靠，满足 GB/T 24067-2024 对数据质量的要求。主要不确定度来源为稀土采选冶因子的行业研究数据偏差，建议向供应商核实实际取值以进一步收窄不确定度区间。',
          ch7Desc: '在企业可控排放范围内，年发电小时数敏感度 -0.91 为度电碳足迹分母端首要杠杆，稀土采选冶因子 +0.46 为材料端减排热点，回收钢抵扣 -0.24 为末端减排路径。优化发电量、提升稀土供应链碳数据透明度与完善回收管理为最有效的可控减排路径。',
          degreeText: `折算度电碳足迹 ≈ ${this.degreeEmission} gCO₂e/kWh`,
          degreeSubText: '全生命周期发电量 5.46亿 kWh（6.5MW × 4200h × 20年）',
          complianceText: '本报告严格遵循 ' + this.selectedStandard + ' 规范编制，数据来源可追溯、计算逻辑可审计、结果可复现，满足度电碳足迹（gCO₂e/kWh）量化与披露要求。'
        }
      }
      return {
        coverTitle: '燃油汽车产品碳足迹核算报告',
        product: '燃油汽车 ICE-A160',
        model: 'ICE-A160-1.6L-2024',
        lifeDesc: '核算产品物理单位边界为辆，寿命界定为15年。功能单位定义为' + this.boundaryConfig.unitDetail + '。',
        dqrConclusion: '本次碳足迹核算结果整体不确定度为 ±11.6%（95%置信度），变异系数 6.0%，处于较低水平。蒙特卡洛模拟（N=10,000）表明碳足迹总量在 ' + this.confidenceIntervalText + ' kgCO₂e 区间内波动，结果稳定可靠，满足 ISO 14067:2018 对数据质量的要求。主要不确定度来源为原材料再生比例的供应商声明值偏差，建议通过提升实测数据比例进一步收窄不确定度区间。',
        ch7Desc: '在企业可控排放范围内，原铝冶炼电力因子敏感度 +0.42 为首要减排热点，再生钢含量比例 -0.22 为减排杠杆。提升再生材料比例与优化供应链低碳采购为企业最有效的可控减排路径。',
        complianceText: '本报告严格遵循 ' + this.selectedStandard + ' 规范编制，数据来源可追溯、计算逻辑可审计、结果可复现。'
      }
    },
    emissionTreeData() {
      const tree = []
      this.modelStages.forEach(stage => {
        let stageTotal = 0
        const stageChildren = []
        
        stage.processes.forEach(proc => {
          let procTotal = 0
          const procChildren = []
          
          proc.inputs.forEach(inp => {
            if (inp.flowType === 'product') return
            const val = parseFloat(this.getEmissionValue(proc.name, inp.name, true)) || 0
            procTotal += val
            if (val !== 0) {
              // 分时分区模式：市电不存在单一因子，因子列直接显示 —
              let factorText = inp.factor ? `${inp.factor} ${inp.factorUnit}` : '—'
              let factorTs = false
              if (this.isTsElecItem(inp, stage)) {
                factorText = '—'
              }
              procChildren.push({
                id: `item-${stage.key}-${proc.name}-${inp.name}-in`,
                name: `${inp.name} (输入)`,
                activityData: `${inp.value} ${inp.unit}`,
                factor: factorText,
                factorTs,
                emission: val,
                type: 'item'
              })
            }
          })
          
          proc.outputs.forEach(out => {
            if (out.flowType === 'product') return
            const val = parseFloat(this.getEmissionValue(proc.name, out.name, false)) || 0
            procTotal += val
            if (val !== 0) {
              procChildren.push({
                id: `item-${stage.key}-${proc.name}-${out.name}-out`,
                name: `${out.name} (输出)`,
                activityData: `${out.value} ${out.unit}`,
                factor: out.factor ? `${out.factor} ${out.factorUnit}` : '—',
                emission: val,
                type: 'item'
              })
            }
          })
          
          // 副产品分配扣除：副产品离开系统，按质量分配带走工序排放
          const byProducts = proc.outputs.filter(o => o.flowType === 'product' && o.productSubType === 'by_product')
          if (byProducts.length > 0 && procTotal > 0) {
            const totalOutputMass = byProducts.reduce((s, bp) => s + (parseFloat(bp.value) || 0), 0)
            byProducts.forEach(bp => {
              const bpMass = parseFloat(bp.value) || 0
              const allocShare = totalOutputMass > 0 ? bpMass / totalOutputMass : 0
              const deducted = procTotal * allocShare
              procTotal -= deducted
              procChildren.push({
                id: `item-${stage.key}-${proc.name}-${bp.name}-byprod`,
                name: `${bp.name} (副产品-分配扣除)`,
                activityData: `${bp.value} ${bp.unit}`,
                factor: `质量分配 ${allocShare.toFixed(2)}`,
                emission: -deducted,
                type: 'item'
              })
            })
          }
          
          stageTotal += procTotal
          stageChildren.push({
            id: `proc-${stage.key}-${proc.name}`,
            name: proc.name,
            type: 'process',
            emission: procTotal,
            children: procChildren
          })
        })
        
        tree.push({
          id: `stage-${stage.key}`,
          name: stage.title,
          type: 'stage',
          emission: stageTotal,
          children: stageChildren
        })
      })
      return tree
    },
    totalCarbonEmission() {
      return this.emissionTreeData.reduce((sum, stage) => sum + stage.emission, 0)
    },
    // 风机任务：度电碳足迹折算值（全生命周期发电量 = 6.5MW × 4200h × 20年 = 5.46亿 kWh）
    degreeEmission() {
      return (this.totalCarbonEmission / 546000000 * 1000).toFixed(2)
    },
    confidenceIntervalText() {
      const mu = this.totalCarbonEmission
      const sigma = mu * 0.0594
      if (this.uncertaintyParams.sampleSize === 10000 && this.uncertaintyParams.confidenceLevel === 95) {
        const lower = Math.round(mu - 1.96 * sigma)
        const upper = Math.round(mu + 1.96 * sigma)
        return `[ ${lower.toLocaleString()} ~ ${upper.toLocaleString()} ]`
      }
      const lower = Math.round(mu - 1.645 * sigma)
      const upper = Math.round(mu + 1.645 * sigma)
      return `[ ${lower.toLocaleString()} ~ ${upper.toLocaleString()} ]`
    },
    uncertaintyRangeText() {
      if (this.uncertaintyParams.sampleSize === 10000 && this.uncertaintyParams.confidenceLevel === 95) {
        return '±11.6%'
      }
      return '±10.0%'
    },
    // 蒙特卡洛直方图模拟数据（动态生成，CV恒定5.94%）
    monteCarloBins() {
      const mu = this.totalCarbonEmission
      const sigma = mu * 0.0594
      const N = this.uncertaintyParams.sampleSize
      const binWidth = sigma * 0.5
      const bins = []
      for (let i = -9; i <= 8; i++) {
        const center = mu + i * binWidth
        const z = (center - mu) / sigma
        const pdf = Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI))
        const freq = Math.max(1, Math.round(pdf * N * binWidth))
        const labelK = (center / 1000).toFixed(1) + 'k'
        bins.push({ center: Math.round(center), label: labelK, freq: freq })
      }
      return bins
    },
    // 正态拟合曲线数据点：与蒙特卡洛直方图完全同 x 网格（bin 中心），
    // 保证 category 轴上曲线与柱状严格按索引对齐、曲线穿过柱顶（smooth 补足平滑）
    normalCurvePoints() {
      const mu = this.totalCarbonEmission
      const sigma = mu * 0.0594
      const N = this.uncertaintyParams.sampleSize
      const binWidth = sigma * 0.5
      return this.monteCarloBins.map(b => {
        const z = (b.center - mu) / sigma
        const pdf = Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI))
        return [b.center, Math.round(pdf * N * binWidth)]
      })
    }
  },
  methods: {
    /** 阶段2确认栏：日期未填或顺序错误时直接提示并禁用 */
    boundaryConfirmConfig() {
      const error = this.validateBoundaryBeforeNextStage()
      return {
        label: '确认边界配置，进入核算模型',
        icon: 'el-icon-check',
        hint: error || '确认5项边界配置无误后进入核算模型阶段',
        disabled: Boolean(error),
        action: () => {
          const currentError = this.validateBoundaryBeforeNextStage()
          if (currentError) {
            this.$message.warning(currentError)
            return
          }
          this.sendSuggestion('确认边界配置')
        }
      }
    },

    /**
     * 阶段2 → 阶段3 前置校验：时间边界必填且起止顺序有效。
     * 返回 null 表示通过，否则返回给用户展示的错误信息。
     */
    validateBoundaryBeforeNextStage() {
      const range = String((this.boundaryConfig && this.boundaryConfig.timeBoundary) || '').trim()
      if (!range) return '时间边界为必填项，请先选择完整的开始日期和结束日期。'
      // 仅以「空格 - 空格」分隔起止日期，避免把日期自身的连字符当成分隔符
      const parts = range.split(/\s+-\s+/)
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        return '时间边界格式不完整，请重新选择开始日期和结束日期。'
      }
      const start = Date.parse(parts[0] + 'T00:00:00')
      const end = Date.parse(parts[1] + 'T00:00:00')
      if (!Number.isFinite(start) || !Number.isFinite(end)) {
        return '时间边界包含无法识别的日期，请重新选择。'
      }
      if (start > end) return '时间边界的开始日期不能晚于结束日期，请调整后再继续。'
      return null
    },

    /** flowType 中文标签 */
    ioTypeLabel(t) {
      const map = {
        raw_material: '原材料',
        packaging: '包装',
        consumable: '辅料',
        energy: '能源',
        transport: '运输',
        resource: '资源',
        service: '服务',
        product: '产品',
        waste: '废弃物',
        elementary: '环境排放'
      }
      return map[t] || t || ''
    },
    /** 边界项是否由标准固定（锁定只读） */
    isBoundaryLocked(field) {
      const cfg = this.selectedStandardConfig || {}
      // 生命周期范围：只有标准明确给出 scopeFixedValue 时才锁定；纳入阶段固定不等于范围固定
      if (field === 'lifecycleScope') return Boolean(cfg.scopeFixedValue)
      // 可选值只有一个 → 锁定
      const bt = cfg.boundaryTemplate || {}
      if (field === 'unitType') {
        const allowed = bt.allowedUnitTypes || []
        return allowed.length === 1
      }
      // 分配规则：只有标准明确给出分配方式时才锁定
      if (field === 'allocationRule') return Boolean(bt.allocationRule)
      // 取舍阈值：单项与累计分别判定，标准未规定时保持可编辑
      if (field === 'cutoffItemThreshold') return Boolean(bt.cutoffItemThreshold)
      if (field === 'cutoffTotalThreshold') return Boolean(bt.cutoffTotalThreshold)
      return false
    },
    /** 阶段二预填：边界配置 Skill 提供场景默认，随后标准 boundaryTemplate 细化/固化 */
    initBoundaryFromSkill() {
      const defaults = getBoundaryDefaults('PCF')
      if (defaults && defaults.template) {
        const tpl = defaults.template
        if (tpl.lifecycleScope) this.$set(this.boundaryConfig, 'lifecycleScope', tpl.lifecycleScope)
        if (tpl.unitType) this.$set(this.boundaryConfig, 'unitType', tpl.unitType)
        if (tpl.unitDetail) this.$set(this.boundaryConfig, 'unitDetail', tpl.unitDetail)
        if (tpl.allocationRule) this.$set(this.boundaryConfig, 'allocationRule', tpl.allocationRule)
        if (tpl.cutoffItemThreshold) this.$set(this.boundaryConfig, 'cutoffItemThreshold', tpl.cutoffItemThreshold)
        if (tpl.cutoffTotalThreshold) this.$set(this.boundaryConfig, 'cutoffTotalThreshold', tpl.cutoffTotalThreshold)
        if (tpl.timeBoundary) this.$set(this.boundaryConfig, 'timeBoundary', tpl.timeBoundary)
        this.boundaryConfig.cutoffThreshold = [this.boundaryConfig.cutoffItemThreshold, this.boundaryConfig.cutoffTotalThreshold].filter(Boolean).join('/')
        this.boundarySourceMeta = {
          ...defaults.sourceMeta,
          appliedAt: new Date().toLocaleString('zh-CN')
        }
      } else {
        this.boundarySourceMeta = null
      }
      this.syncBoundaryFromStandard()
    },
    // ===== C-PSTGT-E 智能因子匹配引擎 (v2.0 全景闭环核心算法) =====
    // 单元换算辅助：支持 MWh<->kWh, t<->kg, Nm3<->m3 等
    normalizeUnitAndQuantity(val, rawUnit, targetUnit) {
      let v = parseFloat(val) || 0
      let multiplier = 1
      const u1 = (rawUnit || '').trim().toLowerCase()
      const u2 = (targetUnit || '').trim().toLowerCase()
      if (u1 === u2) return { val: v, multiplier: 1, converted: false }
      // 电能
      if (u1 === 'mwh' && u2 === 'kwh') { v *= 1000; multiplier = 1000 }
      else if (u1 === 'kwh' && u2 === 'mwh') { v /= 1000; multiplier = 0.001 }
      // 质量
      else if (u1 === 't' && u2 === 'kg') { v *= 1000; multiplier = 1000 }
      else if (u1 === 'kg' && u2 === 't') { v /= 1000; multiplier = 0.001 }
      else if (u1 === 'g' && u2 === 'kg') { v /= 1000; multiplier = 0.001 }
      // 体积
      else if (u1 === 'nm³' && u2 === 'm³') { multiplier = 1 }
      else if (u1 === 'l' && u2 === 'm³') { v /= 1000; multiplier = 0.001 }
      return { val: v, multiplier, converted: multiplier !== 1 }
    },

    // 执行 C-PSTGT-E 完整决策链匹配
    matchFactorWithCpstgt(item, stageKey) {
      const standard = this.selectedStandard || 'QC/T 1248-2025'
      const taskRegion = (this.boundaryConfig && this.boundaryConfig.region) || '北京'
      // 调用公共轻量匹配服务
      const trace = matchFactor(item, 'footprint', { region: taskRegion, standard, stageKey })
      item.factor = trace.selected.factorValue
      item.factorUnit = trace.selected.factorUnit
      item.evidenceTrace = trace
      return trace
    },
    _old_matchFactorWithCpstgt(item, stageKey) {
      const standard = this.selectedStandard || 'QC/T 1248-2025'
      const itemName = item.name || ''
      const itemUnit = item.unit || ''
      const itemVal = parseFloat(item.value) || 0

      // 0. 企业映射自学习记忆优先检索 (P0 Memory)
      try {
        const rawMem = localStorage.getItem('cfp_factor_mapping_memory')
        const memoryList = rawMem ? JSON.parse(rawMem) : []
        const memHit = memoryList.find(m => itemName.includes(m.activityKeyword) || m.activityKeyword.includes(itemName))
        if (memHit) {
          const trace = {
            traceId: 'trace-mem-' + Date.now(),
            itemName,
            itemUnit,
            standard,
            stageKey,
            memoryHit: true,
            selected: {
              factorId: memHit.factorId,
              factorName: memHit.factorName,
              factorValue: memHit.factorValue,
              factorUnit: memHit.factorUnit,
              confidence: 0.99,
              sourcePool: '企业映射自学习记忆库 (P0 优先命中)'
            },
            candidates: [
              { factorId: memHit.factorId, name: memHit.factorName, excluded: false, reason: 'P0 级命中企业自学习纠偏记忆库（历史核准）' }
            ],
            antiManipulation: { status: 'PASS', warning: null },
            decisionChain: '企业记忆(P0) → 直接绑定',
            timestamp: new Date().toLocaleString('zh-CN')
          }
          item.factor = memHit.factorValue
          item.factorUnit = memHit.factorUnit
          item.evidenceTrace = trace
          return trace
        }
      } catch (e) {}

      // 1. Context & Boundary 场景与系统边界识别
      const isFootprint = standard.includes('14067') || standard.includes('QC/T') || standard.includes('PAS')
      const requiredGas = isFootprint ? 'CO₂e' : 'CO₂'
      const requiredBoundary = stageKey === 'manufacturing' && itemName.includes('燃烧') ? 'direct-combustion' : 'cradle-to-gate'

      // 2. 候选池构建与 PSTGT 有序评估
      const candidates = []
      let selectedFactor = null
      let confidence = 0.90
      let antiWarning = null

      if (itemName.includes('电') || itemName.includes('动力')) {
        // 电力因子按场景精准路由（企业所在省市：北京）
        if (isFootprint) {
          selectedFactor = { factorId: 'CPCD-EN-001', name: '北京电网平均排放因子', value: '0.581', unit: 'kgCO₂e/kWh', db: 'CPCD 2026版', pool: '生命周期数据库(池3)', tech: '电网平均', geo: '北京', year: '2024' }
          candidates.push({ factorId: 'CPCD-EN-001', name: '北京电网平均排放因子', excluded: false, reason: '选中: 符合产品碳足迹摇篮到大门边界 + 北京生产地' })
          candidates.push({ factorId: 'NGEF-EN-004', name: '华北区域电力平均因子', excluded: true, reason: '排除: 区域级口径，粗于省级且为消费侧CO₂，未含上游线损与全生命周期' })
          confidence = 0.95
        } else {
          selectedFactor = { factorId: 'NGEF-EN-004', name: '北京电力平均因子', value: '0.5500', unit: 'kgCO₂/kWh', db: '国家温室气体排放因子库', pool: '国家官方公告(池1)', tech: '电网平均', geo: '北京', year: '2023' }
          candidates.push({ factorId: 'NGEF-EN-004', name: '北京电力平均因子', excluded: false, reason: '选中: 国家生态环境部权威公告 + 北京市级口径 + 组织范围二消费侧CO₂口径' })
          confidence = 0.98
        }
      } else if (itemName.includes('铝') || itemName.includes('铸铝')) {
        // 材料：技术路线(原生/再生)高于年份
        selectedFactor = { factorId: 'CPCD-MA-003', name: '铸造铝合金', value: '8.52', unit: 'kgCO₂e/kg', db: 'CPCD 2026版', pool: '生命周期数据库(池3)', tech: '铸造/原生', geo: '中国全国', year: '2023' }
        candidates.push({ factorId: 'CPCD-MA-003', name: '铸造铝合金', excluded: false, reason: '选中: 本土CPCD + 铸造工艺吻合 + 生产地全国' })
        candidates.push({ factorId: 'ECO-MA-002', name: '原生铝 (Aluminium, primary)', excluded: true, reason: '排除: 国际Ecoinvent地理代表性(全球)低于本土CPCD' })
        confidence = 0.92
      } else if (itemName.includes('钢') || itemName.includes('铁')) {
        // 钢铁：热轧工艺吻合
        selectedFactor = { factorId: 'CPCD-MA-001', name: '热轧钢棒（碳钢/合金钢）', value: '2.43', unit: 'kgCO₂e/kg', db: 'CPCD 2026版', pool: '生命周期数据库(池3)', tech: '热轧/原生', geo: '中国江苏', year: '2022' }
        candidates.push({ factorId: 'CPCD-MA-001', name: '热轧钢棒（碳钢/合金钢）', excluded: false, reason: '选中: 工艺路线(热轧)+生产地exact(江苏)+DQR高分' })
        candidates.push({ factorId: 'ECO-MA-001', name: '转炉钢 (Steel, converter)', excluded: true, reason: '排除: 技术代表性略逊且地理层级(全球)低于江苏实测' })
        confidence = 0.94
      } else if (itemName.includes('天然气') || itemName.includes('燃气')) {
        selectedFactor = { factorId: 'IPCC-EN-001', name: '天然气燃烧', value: '2.16172', unit: 'kgCO₂e/m³', db: 'IPCC 2006指南', pool: '国际通用缺省(池1)', tech: '固定源燃烧', geo: '全球', year: '2006' }
        candidates.push({ factorId: 'IPCC-EN-001', name: '天然气燃烧', excluded: false, reason: '选中: 消费侧固定燃烧Tier-1权威缺省 + 净热值折算' })
        confidence = 0.90
      } else if (itemName.includes('柴油') || itemName.includes('汽油')) {
        selectedFactor = { factorId: 'IPCC-EN-002', name: '柴油燃烧', value: '2.66085', unit: 'kgCO₂e/L', db: 'IPCC 2006指南', pool: '国际通用缺省(池1)', tech: '内燃机燃烧', geo: '全球', year: '2006' }
        candidates.push({ factorId: 'IPCC-EN-002', name: '柴油燃烧', excluded: false, reason: '选中: 移动源内燃机权威燃烧因子' })
        confidence = 0.90
      } else {
        // 通用兜底
        selectedFactor = { factorId: 'CPCD-GEN-001', name: `${itemName} 标准排放因子`, value: '1.25', unit: 'kgCO₂e/kg', db: 'CPCD 2026版', pool: '生命周期数据库(池3)', tech: '通用工业', geo: '全国', year: '2023' }
        candidates.push({ factorId: 'CPCD-GEN-001', name: `${itemName} 标准因子`, excluded: false, reason: '选中: 行业基准与通用代表性' })
        confidence = 0.82
      }

      // 3. 量纲与当量自动折算
      const normRes = this.normalizeUnitAndQuantity(itemVal, itemUnit, selectedFactor.unit.split('/')[1] || itemUnit)

      // 4. 反操纵与低值审计 (Anti-Manipulation)
      if (parseFloat(selectedFactor.value) < 0.5 && itemName.includes('电')) {
        antiWarning = '该因子处于同类候选极低值区间，系统已自动附注技术与地理抗辩理由'
      }

      // 5. 组装不可篡改决策证据链 (Evidence Trace)
      const evidenceTrace = {
        traceId: 'trace-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        itemName,
        itemUnit,
        itemValue: itemVal,
        standard,
        stageKey,
        scenario: isFootprint ? '产品碳足迹 (ISO 14067/QC/T)' : '组织碳核算 (ISO 14064)',
        requiredBoundary,
        requiredGas,
        unitConversion: {
          rawInput: `${itemVal} ${itemUnit}`,
          normalizedVal: normRes.val,
          converted: normRes.converted,
          multiplier: normRes.multiplier
        },
        candidates,
        selected: {
          factorId: selectedFactor.factorId,
          factorName: selectedFactor.name,
          factorValue: selectedFactor.value,
          factorUnit: selectedFactor.unit,
          dbName: selectedFactor.db,
          sourcePool: selectedFactor.pool,
          confidence,
          isLowest: !!antiWarning
        },
        antiManipulation: {
          status: antiWarning ? 'WARNING' : 'PASS',
          warning: antiWarning
        },
        decisionChain: `场景路由(${isFootprint ? 'LCA碳足迹' : '范围二'}) → S池(${selectedFactor.pool}) → T技术(${selectedFactor.tech}) → G产地(${selectedFactor.geo})`,
        timestamp: new Date().toLocaleString('zh-CN')
      }

      item.factor = selectedFactor.value
      item.factorUnit = selectedFactor.unit
      item.evidenceTrace = evidenceTrace
      return evidenceTrace
    },

    // 打开查看决策证据链抽屉
    openEvidenceDetail(item) {
      if (!item.evidenceTrace) {
        this.matchFactorWithCpstgt(item, 'manufacturing')
      }
      this.activeEvidenceTrace = item.evidenceTrace
      this.showEvidenceDrawer = true
    },

    // 人工纠偏后沉淀为企业自学习记忆 (Evolution Memory)
    saveUserFactorOverride(item, newFactor) {
      const taskRegion = (this.boundaryConfig && this.boundaryConfig.region) || '全国'
      const ok = saveUserFactorOverride(item, newFactor, taskRegion)
      if (ok) {
        this.$message.success(`已沉淀「${item.name}」的匹配规则至企业记忆库，后续将 P0 优先复用！`)
      }
    },
    _old_saveUserFactorOverride(item, newFactor) {
      try {
        const raw = localStorage.getItem('cfp_factor_mapping_memory')
        const list = raw ? JSON.parse(raw) : []
        const existingIdx = list.findIndex(m => m.activityKeyword === item.name)
        const memoryEntry = {
          activityKeyword: item.name,
          techRoute: item.techRoute || '人工指定',
          factorId: newFactor.factorId || 'MANUAL-' + Date.now().toString().slice(-4),
          factorName: newFactor.name || newFactor.factorName,
          factorValue: newFactor.value || newFactor.factorValue,
          factorUnit: newFactor.factorUnit || newFactor.unit,
          dbName: newFactor.dbName || '企业核准库',
          hitCount: 1,
          updatedAt: new Date().toLocaleString('zh-CN')
        }
        if (existingIdx > -1) {
          list[existingIdx] = memoryEntry
        } else {
          list.unshift(memoryEntry)
        }
        localStorage.setItem('cfp_factor_mapping_memory', JSON.stringify(list))
        this.mappingMemoryCount = list.length
        this.$message.success(`已沉淀「${item.name}」的匹配规则至企业记忆库，后续将 P0 优先复用！`)
      } catch (e) {
        this.$message.warning('记忆库保存失败')
      }
    },

    // ===== 历史对话栏 =====
    // 默认标准编码：汽车类任务优先乘用车核算技术规范，其余取列表第一条
    defaultStandardCode() {
      const CAR_STD = '乘用车生命周期碳排放核算技术规范'
      const list = this.standards || []
      if (this.isWindTask && this.isWindTask()) {
        return (list[0] || {}).code || ''
      }
      // 汽车类任务：优先乘用车规范
      if (list.some(s => s.code === CAR_STD)) return CAR_STD
      return (list[0] || {}).code || ''
    },
    // 确保默认选中标准（汽车类优先乘用车核算技术规范）
    ensureDefaultStandard() {
      const list = this.standards || []
      if (!list.length) return
      if (!this.selectedStandard || !list.some(s => s.code === this.selectedStandard)) {
        this.$set(this, 'selectedStandard', this.defaultStandardCode() || list[0].code)
      }
    },
    toggleHistorySidebar() {
      this.showHistorySidebar = !this.showHistorySidebar
    },

    saveCurrentConversation() {
      // 保存当前对话到历史（以任务产品名命名）
      const msgs = this.messages || []
      if (msgs.length === 0) return
      const task = this.taskList.find(t => t.id === this.currentTaskId)
      const title = task ? task.productName : '产品碳足迹对话'
      const existing = this.conversationHistory.find(c => c.id === this.currentConversationId)
      if (existing) {
        existing.messages = JSON.parse(JSON.stringify(msgs))
        existing.timestamp = new Date().toLocaleString('zh-CN')
      } else {
        const conv = {
          id: 'fp-conv-' + Date.now(),
          title: title,
          timestamp: new Date().toLocaleString('zh-CN'),
          messages: JSON.parse(JSON.stringify(msgs))
        }
        this.conversationHistory.unshift(conv)
        this.currentConversationId = conv.id
      }
    },

    loadConversation(convId) {
      const conv = this.conversationHistory.find(c => c.id === convId)
      if (conv) {
        this.messages = JSON.parse(JSON.stringify(conv.messages))
        this.currentConversationId = convId
        this.$nextTick(() => {
          if (this.$refs.tlDialogMessages) this.$refs.tlDialogMessages.scrollTop = this.$refs.tlDialogMessages.scrollHeight
        })
      }
    },

    deleteConversation(convId) {
      const idx = this.conversationHistory.findIndex(c => c.id === convId)
      if (idx > -1) {
        this.conversationHistory.splice(idx, 1)
        if (this.currentConversationId === convId) this.currentConversationId = null
      }
    },

    // ===== 多轮澄清方法 =====
    // 开始澄清流程
    startClarification(topicKey) {
      const topic = this.clarificationTopics[topicKey]
      if (!topic) return false
      this.clarificationState = {
        topic: topicKey,
        step: 0,
        totalSteps: topic.steps.length,
        data: {}
      }
      return true
    },
    // 获取当前澄清问题
    getCurrentClarification() {
      if (!this.clarificationState) return null
      const topic = this.clarificationTopics[this.clarificationState.topic]
      if (!topic) return null
      const step = this.clarificationState.step
      if (step >= topic.steps.length) return null
      return {
        ...topic.steps[step],
        topicName: topic.name,
        stepNum: step + 1,
        totalSteps: this.clarificationState.totalSteps
      }
    },
    // 处理澄清回答
    answerClarification(answer) {
      if (!this.clarificationState) return null
      const topic = this.clarificationTopics[this.clarificationState.topic]
      const currentStep = topic.steps[this.clarificationState.step]

      // 记录回答
      this.$set(this.clarificationState.data, currentStep.field, answer)

      // 应用到配置
      if (currentStep.field && this.boundaryConfig.hasOwnProperty(currentStep.field)) {
        const valueMap = {
          'lifecycleScope': { '摇篮到坟墓': 'cradle-to-grave', '摇篮到大门': 'cradle-to-gate', '大门到大门': 'gate-to-gate' },
          'unitType': { '声明单位': 'declaration', '参考单位': 'reference' },
          'allocationRule': { '质量分配': 'mass', '经济分配': 'economic', '物理分配': 'physical' }
        }
        const mappedValue = valueMap[currentStep.field] ? valueMap[currentStep.field][answer] : answer
        this.boundaryConfig[currentStep.field] = mappedValue
      }

      // 推进到下一步或结束
      this.clarificationState.step++
      const isComplete = this.clarificationState.step >= this.clarificationState.totalSteps
      const result = {
        isComplete,
        currentStep: this.clarificationState.step,
        totalSteps: this.clarificationState.totalSteps,
        data: { ...this.clarificationState.data }
      }

      if (isComplete) {
        this.clarificationState = null
      }

      return result
    },
    // 检查是否在澄清中
    isInClarification() {
      return this.clarificationState !== null
    },
    // 取消澄清
    cancelClarification() {
      this.clarificationState = null
    },
    // ===== 快捷指令方法 =====
    // 添加评论
    addTaskComment(content) {
      if (!content.trim()) return
      const comment = {
        id: 'comment-' + Date.now(),
        author: '当前用户',
        content: content,
        timestamp: new Date().toLocaleString('zh-CN'),
        phase: this.phases[this.currentStepIndex] ? this.phases[this.currentStepIndex].name : '通用'
      }
      this.taskComments.push(comment)
      this.$message.success('评论已添加')
    },
    // ===== 上下文记忆方法 =====
    // 加载用户偏好
    loadUserPreferences() {
      try {
        const saved = localStorage.getItem('carbon-agent-user-prefs')
        if (saved) {
          this.userPreferences = { ...this.userPreferences, ...JSON.parse(saved) }
          // 应用偏好到当前配置
          this.applyUserPreferences()
        }
      } catch (e) { /* ignore */ }
    },
    // 保存用户偏好
    saveUserPreferences() {
      try {
        localStorage.setItem('carbon-agent-user-prefs', JSON.stringify(this.userPreferences))
      } catch (e) { /* ignore */ }
    },
    // 应用用户偏好到当前配置
    applyUserPreferences() {
      const prefs = this.userPreferences
      // 应用默认标准
      if (prefs.defaultStandard && this.standards.some(s => s.code === prefs.defaultStandard)) {
        this.selectedStandard = prefs.defaultStandard
      }
      // 应用默认单位类型
      if (prefs.defaultUnitType) {
        this.selectedUnit = prefs.defaultUnitType
      }
      // 应用偏好因子库
      if (prefs.preferredFactorLibs && prefs.preferredFactorLibs.length > 0) {
        this.factorDatabases.forEach(lib => {
          lib.selected = prefs.preferredFactorLibs.includes(lib.id)
        })
      }
      // 应用自定义边界规则
      if (prefs.customBoundaryRules && Object.keys(prefs.customBoundaryRules).length > 0) {
        this.boundaryConfig = { ...this.boundaryConfig, ...prefs.customBoundaryRules }
      }
    },
    // 记录用户选择到偏好
    recordUserChoice(key, value) {
      this.$set(this.userPreferences, key, value)
      this.saveUserPreferences()
    },
    // 添加最近产品
    addRecentProduct(productName) {
      const recent = [...this.userPreferences.recentProducts]
      const idx = recent.indexOf(productName)
      if (idx > -1) recent.splice(idx, 1)
      recent.unshift(productName)
      this.$set(this.userPreferences, 'recentProducts', recent.slice(0, 5))
      this.saveUserPreferences()
    },
    // 获取推荐配置提示
    getPreferenceHint() {
      const prefs = this.userPreferences
      const hints = []
      if (prefs.defaultStandard) hints.push(`常用标准：${prefs.defaultStandard}`)
      if (prefs.recentProducts.length > 0) hints.push(`最近产品：${prefs.recentProducts[0]}`)
      if (prefs.lastTaskDuration > 0) {
        const mins = Math.round(prefs.lastTaskDuration / 60)
        hints.push(`上次耗时：约${mins}分钟`)
      }
      return hints.length > 0 ? hints.join(' · ') : null
    },
    // ===== 快捷指令方法 =====
    useCmd(cmdText) {
      this.showCmdPanel = false
      this.inputText = cmdText
      this.$nextTick(() => {
        this.handleSend()
      })
    },
    handleArchiveReport() {
      this.isReportArchived = true
      this.$message.success('碳足迹核算报告已成功归档至企业碳资产库！')
    },
    handleExportReport(format) {
      const formatMap = {
        pdf: 'PDF 审计版',
        word: 'Word 编辑版'
      }
      this.$message.success(`正在导出 ${formatMap[format] || format} 格式报告，请稍候...`)
    },
    handleShareReport() {
      this.$message.success('报告已提交至第三方认证机构，请等待认证结果')
    },
    publishAsSOP() {
      if (!this.currentTaskId) {
        this.$message.warning('当前无活动任务，无法发布SOP')
        return
      }
      // 保存当前阶段快照
      this.saveStageSnapshot()
      const task = this.taskList.find(t => t.id === this.currentTaskId)
      if (!task) {
        this.$message.warning('任务数据异常，无法发布SOP')
        return
      }
      // 创建SOP记录
      const sopId = 'SOP-' + Date.now()
      const newSOP = {
        id: sopId,
        name: (task.productName || '产品') + '碳足迹核算模型',
        productId: null,
        sourceTaskId: task.id,
        publishTime: new Date().toLocaleString('zh-CN'),
        version: 'v1.0',
        verified: true,
        standard: this.selectedStandard
      }
      // 写入SOP库到localStorage
      try {
        const savedSOPs = JSON.parse(localStorage.getItem('cfp_sops') || '[]')
        // 检查是否已有同来源任务的SOP，有则更新版本号
        const existingIdx = savedSOPs.findIndex(s => s.sourceTaskId === task.id)
        if (existingIdx >= 0) {
          const old = savedSOPs[existingIdx]
          const vParts = old.version.replace('v', '').split('.')
          const minor = parseInt(vParts[1] || '0') + 1
          newSOP.version = 'v' + vParts[0] + '.' + minor
          newSOP.id = old.id
          savedSOPs[existingIdx] = newSOP
        } else {
          savedSOPs.unshift(newSOP)
        }
        localStorage.setItem('cfp_sops', JSON.stringify(savedSOPs))
        // 更新产品库（如有匹配的产品）——统一存取 cfp_products_v4 并广播变更
        const savedProducts = loadCfpProducts()
        const product = savedProducts.find(p => p.name === task.productName)
        if (product) {
          if (!product.sopIds) product.sopIds = []
          if (!product.sopIds.includes(newSOP.id)) {
            product.sopIds.push(newSOP.id)
          }
          newSOP.productId = product.id
          saveCfpProducts(savedProducts)
        }
      } catch (e) { /* ignore */ }
      this.isSopPublished = true
      this.$message.success('SOP已成功发布（' + newSOP.version + '），可在此产品的后续核算中一键继承')
    },
    switchBackToReport() {
      this.reportViewMode = 'report'
      this._reportChartsInitDone = false
    },
    handleTabClick(tabName) {
      this.analysisActiveTab = tabName
    },
    toggleNode(id) {
      this.$set(this.emissionExpandedNodes, id, !this.emissionExpandedNodes[id])
    },
    isNodeExpanded(id) {
      return this.emissionExpandedNodes[id] !== false
    },
    getItemPercentWidth(emission) {
      const absVal = Math.abs(emission)
      const percent = Math.min((absVal / 12800.0) * 100, 100)
      return `${percent}%`
    },
    formatEmission(val) {
      const num = parseFloat(val)
      if (isNaN(num)) return '-'
      if (num === 0) return '0.0'
      return num.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    },
    exportCalculationData() {
      // 构建 CSV 内容：边界配置 + 各阶段单元过程的活动数据/排放因子/排放量
      const b = this.boundaryConfig
      const headerRow = [
        '核算标准', '生命周期范围', '量化单位', '分配规则',
        '取舍规则(单项)', '取舍规则(累计)', '时间边界',
        '阶段', '单元过程', '类型', '物料名称',
        '活动数据', '活动数据单位', '排放因子', '排放因子单位', '排放量(kgCO₂e)'
      ]
      const rows = []
      // 1) 边界配置信息行（留空阶段列）
      rows.push([
        this.selectedStandard, this.lifecycleScopeLabel,
        this.unitTypeLabel + '：' + b.unitDetail, this.allocationRuleLabel,
        b.cutoffItemThreshold, b.cutoffTotalThreshold, b.timeBoundary,
        '', '', '', '', '', '', '', '', ''
      ])
      // 2) 各阶段各过程各输入输出行
      this.modelStages.forEach(stage => {
        stage.processes.forEach(proc => {
          proc.inputs.forEach(inp => {
            rows.push([
              '', '', '', '', '', '', '',
              stage.title, proc.name, '输入', inp.name,
              inp.value, inp.unit,
              inp.factor || '', inp.factorUnit || '',
              this.getEmissionValue(proc.name, inp.name, true)
            ])
          })
          proc.outputs.forEach(out => {
            rows.push([
              '', '', '', '', '', '', '',
              stage.title, proc.name, '输出', out.name,
              out.value, out.unit,
              out.factor || '', out.factorUnit || '',
              this.getEmissionValue(proc.name, out.name, false)
            ])
          })
        })
      })
      // 3) 汇总行
      rows.push([
        '', '', '', '', '', '', '',
        '合计', '', '', '', '', '', '', '',
        this.formatEmission(this.totalCarbonEmission)
      ])
      // CSV 编码：用 BOM 保证 Excel 正确识别 UTF-8
      const csvContent = '\uFEFF' + [headerRow, ...rows].map(r =>
        r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')
      ).join('\r\n')
      // 触发下载
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `碳足迹核算数据_${this.selectedStandard}_${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
      this.$message.success('核算数据已导出为 CSV 文件，可用于线下核对')
    },
    countProcFactors(proc) {
      let count = 0
      if (proc.inputs) count += proc.inputs.filter(i => i.factor && i.flowType !== 'product').length
      if (proc.outputs) count += proc.outputs.filter(o => o.factor && o.flowType !== 'product').length
      return count
    },
    getEmissionValue(procName, itemName, isInput) {
      for (const stage of this.modelStages) {
        const proc = stage.processes.find(p => p.name === procName)
        if (proc) {
          const list = isInput ? proc.inputs : proc.outputs
          const item = list.find(i => i.name === itemName)
          if (item) {
            if (item.flowType === 'product') return '0'
            const val = parseFloat(item.value) || 0
            // 分时分区模式：生产阶段市电使用「核算期加权平均因子」
            let factor = parseFloat(item.factor) || 0
            if (isInput && this.isTsElecItem(item, stage)) {
              const wf = this.tsWeightedFactorOf(procName)
              if (wf > 0) factor = wf
            }
            return (val * factor).toFixed(1)
          }
        }
      }
      return '0'
    },

    /**
     * 判断某输入项是否适用分时分区因子（mixin 内通用）
     * 规则：生产阶段 + 能源类型 + 含「电」+ 不含绿电/光伏 + 单位 kWh
     */
    isTsElecItem(item, stage) {
      if (!item || !stage) return false
      if (this.elecFactorMode !== 'timespace') return false
      const prodKeys = ['manufacturing', 'vehicle_production']
      if (prodKeys.indexOf(stage.key) === -1) return false
      const isEnergy = item.flowType === 'energy' || item.listType === 'energy' || item.type === '能源'
      if (!isEnergy) return false
      const name = String(item.name || '')
      if (name.indexOf('电') === -1) return false
      const EXCLUDE = ['绿电', '光伏', '风电', '水电', '核电', '生物质电', '余电', '自发电', '直购电', '清洁能源']
      if (EXCLUDE.some(k => name.indexOf(k) > -1)) return false
      if (!/kwh|度/i.test(String(item.unit || ''))) return false
      return true
    },
    createEmptyModelFlow(type, processCode, index) {
      const isInput = type === 'inputs'
      const seq = Number(index) || 1
      const procCode = processCode || 'S0-P001'
      return {
        flowId: 'FLOW-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        flowCode: procCode + (isInput ? '-I' : '-O') + String(seq).padStart(2, '0'),
        name: isInput ? '新输入' : '新输出',
        flowType: 'elementary',
        listType: isInput ? 'raw_material' : 'solid_waste',
        linkMode: 'manual',
        sourceFlowRef: '',
        targetFlowRef: '',
        unit: '',
        note: ''
      }
    },
    addProcess(groupIndex) {
      const group = this.modelStages[groupIndex]
      if (!group) return
      const processCode = this.nextProcessCode(groupIndex)
      const newProc = {
        processCode: processCode,
        name: '新单元过程',
        processType: group.key === 'raw_material' ? 'material_acquisition' : 'production',
        upstreamProcessCode: '',
        allocation: this.boundaryConfig.allocationRule || 'mass',
        allocationRemark: '',
        dataRequirement: '',
        factorCategory: '',
        note: '',
        inputs: [this.createEmptyModelFlow('inputs', processCode, 1)],
        outputs: [this.createEmptyModelFlow('outputs', processCode, 1)]
      }
      group.processes.push(newProc)
      const pi = group.processes.length - 1
      this.highlightProc = { gi: groupIndex, pi: pi }
      this.$message.success('已新增单元过程，请编辑名称与输入/输出流')
      this.$nextTick(() => {
        const el = document.querySelector('.process-row.proc-highlight')
        if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      })
      setTimeout(() => { this.highlightProc = null }, 1800)
    },
    /** 按「阶段号-P+三位过程序号」生成唯一编号，如 S1-P001 */
    nextProcessCode(groupIndex) {
      const stageNo = Number(groupIndex) + 1
      const stagePrefix = 'S' + stageNo + '-P'
      const codes = ((this.modelStages[groupIndex] || {}).processes || [])
        .map(proc => String((proc && proc.processCode) || ''))
        .filter(code => code.startsWith(stagePrefix))
      let max = 0
      codes.forEach(code => {
        const seq = Number(code.slice(stagePrefix.length))
        if (Number.isFinite(seq) && seq > max) max = seq
      })
      return stagePrefix + String(max + 1).padStart(3, '0')
    },
    /** 兼容旧模型：无编号的过程按阶段显示稳定编号 */
    processDisplayCode(stageIndex, processIndex, proc) {
      return (proc && proc.processCode) || ('S' + (Number(stageIndex) + 1) + '-P' + String(Number(processIndex) + 1).padStart(3, '0'))
    },
    /** 气泡内只展示流的短编号，完整编号在抽屉中展示 */
    modelFlowShortCode(flow, type, index) {
      const isInput = type === 'inputs'
      const seq = Number(index) + 1
      return (isInput ? 'I' : 'O') + String(seq).padStart(3, '0')
    },
    removeProcess(groupIndex, procIndex) {
      const group = this.modelStages[groupIndex]
      if (!group || !group.processes[procIndex]) return
      if (group.processes.length <= 1) {
        this.$message.warning('每个阶段至少保留1个单元过程')
        return
      }
      this.$confirm('确认删除该单元过程及其所有输入/输出？', '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        group.processes.splice(procIndex, 1)
        this.$message.success('已删除单元过程')
      }).catch(() => {})
    },
    addIO(proc, type) {
      if (!proc[type]) this.$set(proc, type, [])
      proc[type].push(this.createEmptyModelFlow(type, proc.processCode, proc[type].length + 1))
      this.invalidateModelValidation()
    },
    onOutputTypeChange(out) {
      if (out.listType === 'main_product') {
        out.flowType = 'product'
        out.productSubType = 'main'
      } else if (out.listType === 'by_product') {
        out.flowType = 'product'
        out.productSubType = 'by_product'
      } else {
        out.flowType = 'elementary'
        out.productSubType = null
      }
    },
    removeIO(proc, type, index) {
      if (!proc[type] || proc[type].length <= 0) return
      proc[type].splice(index, 1)
    },
    /** 空模型骨架：按所选标准的阶段清单生成（保证阶段2/3 阶段一致） */
    onModelFlowTypeChange(flow, type) {
      if (!flow) return
      if (type === 'outputs') this.onOutputTypeChange(flow)
      else { flow.flowType = 'elementary'; flow.productSubType = null }
      this.invalidateModelValidation()
    },
    toggleModelFlowLink(flow, type) {
      if (!flow || type !== 'inputs') return
      flow.linkMode = flow.linkMode === 'reference' ? 'manual' : 'reference'
      if (flow.linkMode === 'manual') flow.sourceFlowRef = ''
      if (flow.linkMode === 'reference') {
        flow.listType = 'product'
        flow.flowType = 'elementary'
        flow.productSubType = null
        flow.name = ''
      }
    },
    onModelFlowRefChange(flow) {
      if (!flow || !flow.sourceFlowRef) return
      const target = this.findModelFlowByRef(flow.sourceFlowRef)
      if (target) {
        flow.name = target.flow.name
        flow.listType = ['main_product', 'by_product'].indexOf(target.flow.listType) > -1 ? 'product' : target.flow.listType
        flow.unit = target.flow.unit || flow.unit
      }
      this.invalidateModelValidation()
    },
    referencedFlowLabel(flow) {
      return flow && flow.sourceFlowRef ? this.flowRefLabel(flow.sourceFlowRef) : ''
    },
    flowRefLabel(ref) {
      const target = this.findModelFlowByRef(ref)
      if (!target) return ''
      return (target.stageTitle ? target.stageTitle + ' · ' : '') + (target.processCode ? target.processCode + ' · ' : '') + (target.flowCode ? target.flowCode + ' · ' : '') + (target.flow ? target.flow.name : '')
    },
    findModelFlowByRef(ref) {
      if (!ref) return null
      let found = null
      ;(this.modelStages || []).some(stage => {
        return (stage.processes || []).some(proc => {
          return (proc.outputs || []).some(flow => {
            if (flow.flowCode !== ref) return false
            found = { stageTitle: stage.title, processCode: proc.processCode || proc.name, flowCode: flow.flowCode, flow: flow }
            return true
          })
        })
      })
      return found
    },
    upstreamOutputFlowOptions(stageIndex, processIndex) {
      const options = []
      ;(this.modelStages || []).forEach((stage, si) => {
        ;(stage.processes || []).forEach((proc, pi) => {
          ;(proc.outputs || []).forEach((flow) => {
            if (!flow.flowCode) return
            const procCode = this.processDisplayCode(si, pi, proc)
            options.push({ value: flow.flowCode, label: stage.title + ' · ' + procCode + ' · ' + flow.flowCode + ' · ' + (flow.name || '未命名输出') })
          })
        })
      })
      return options
    },
    upstreamProcessOptions(stageIndex, processIndex) {
      const options = []
      ;(this.modelStages || []).forEach((stage, si) => {
        ;(stage.processes || []).forEach((proc, pi) => {
          if (si === stageIndex && pi === processIndex) return
          const code = this.processDisplayCode(si, pi, proc)
          options.push({ value: code, label: stage.title + ' · ' + code + ' · ' + (proc.name || '未命名过程') })
        })
      })
      return options
    },
    downstreamProcessOptions(stageIndex, processIndex) {
      const options = []
      ;(this.modelStages || []).forEach((stage, si) => {
        ;(stage.processes || []).forEach((proc, pi) => {
          if (si === stageIndex && pi === processIndex) return
          const code = this.processDisplayCode(si, pi, proc)
          options.push({ value: code, label: stage.title + ' · ' + code + ' · ' + (proc.name || '未命名过程') })
        })
      })
      return options
    },
    getProcessTypeLabel(type) {
      const found = (this.processTypeOptions || []).find(item => item.value === type)
      return found ? found.label : '生产工序'
    },
    openModelProcessDrawer(stageIndex, processIndex) {
      const stage = (this.modelStages || [])[stageIndex]
      const process = stage && (stage.processes || [])[processIndex]
      if (!process) return
      this.modelProcessDrawerStageIndex = stageIndex
      this.modelProcessDrawerProcessIndex = processIndex
      this.modelProcessDrawerDraft = JSON.parse(JSON.stringify(process))
      this.modelProcessDrawerVisible = true
    },
    closeModelProcessDrawer() {
      this.modelProcessDrawerVisible = false
    },
    discardModelProcessDrawerDraft() {
      this.modelProcessDrawerDraft = null
    },
    focusModelProcessDrawer() {
      this.$nextTick(() => {
        const input = this.$refs.modelProcessNameInput
        if (input && input.focus) input.focus()
      })
    },
    saveModelProcessDrawer() {
      const draft = this.modelProcessDrawerDraft
      const target = this.modelProcessDrawerProcess
      if (!draft || !target) return
      const name = String(draft.name || '').trim()
      if (!name) {
        this.$message.warning('请填写单元过程名称')
        return
      }
      const duplicated = ((this.modelProcessDrawerStage || {}).processes || []).some((proc, index) =>
        index !== this.modelProcessDrawerProcessIndex && String(proc.name || '').trim() === name
      )
      if (duplicated) {
        this.$message.warning('同一阶段内已存在同名单元过程')
        return
      }
      Object.keys(target).forEach(key => {
        if (!(key in draft)) this.$delete(target, key)
      })
      Object.keys(draft).forEach(key => this.$set(target, key, draft[key]))
      target.name = name
      this.invalidateModelValidation()
      this.saveStageSnapshot()
      this.$message.success('单元过程属性已保存')
      this.modelProcessDrawerVisible = false
    },
    openModelFlowDrawer(stageIndex, processIndex, type, flowIndex) {
      const stage = (this.modelStages || [])[stageIndex]
      const process = stage && (stage.processes || [])[processIndex]
      const flow = process && (process[type] || [])[flowIndex]
      if (!flow) return
      this.modelFlowDrawerStageIndex = stageIndex
      this.modelFlowDrawerProcessIndex = processIndex
      this.modelFlowDrawerType = type
      this.modelFlowDrawerIndex = flowIndex
      this.modelFlowDrawerDraft = JSON.parse(JSON.stringify(flow))
      this.modelFlowDrawerVisible = true
    },
    closeModelFlowDrawer() {
      this.modelFlowDrawerVisible = false
    },
    discardModelFlowDrawerDraft() {
      this.modelFlowDrawerDraft = null
    },
    focusModelFlowDrawer() {
      this.$nextTick(() => {
        const input = this.$refs.modelFlowNameInput
        if (input && input.focus) input.focus()
      })
    },
    onModelFlowDrawerTypeChange() {
      this.onModelFlowTypeChange(this.modelFlowDrawerDraft, this.modelFlowDrawerType)
    },
    onModelFlowDrawerLinkModeChange(mode) {
      const draft = this.modelFlowDrawerDraft
      if (!draft) return
      if (mode === 'manual') {
        draft.sourceFlowRef = ''
      } else {
        draft.listType = 'product'
        draft.flowType = 'elementary'
        draft.productSubType = null
      }
    },
    onModelFlowDrawerRefChange() {
      this.onModelFlowRefChange(this.modelFlowDrawerDraft)
    },
    saveModelFlowDrawer() {
      const draft = this.modelFlowDrawerDraft
      const target = this.modelFlowDrawerFlow
      if (!draft || !target) return
      const name = String(draft.name || '').trim()
      if (!name) {
        this.$message.warning('请填写流名称')
        return
      }
      if (draft.linkMode === 'reference' && !draft.sourceFlowRef) {
        this.$message.warning('请选择上游输出流，或切换为手工输入')
        return
      }
      const list = (this.modelFlowDrawerProcess || {})[this.modelFlowDrawerType] || []
      const duplicated = list.some((flow, index) =>
        index !== this.modelFlowDrawerIndex && String(flow.name || '').trim() === name
      )
      if (duplicated) {
        const typeLabel = this.modelFlowDrawerType === 'inputs' ? '输入流' : '输出流'
        this.$message.warning('同一单元过程内已存在同名' + typeLabel)
        return
      }
      Object.keys(target).forEach(key => {
        if (!(key in draft)) this.$delete(target, key)
      })
      Object.keys(draft).forEach(key => this.$set(target, key, draft[key]))
      target.name = name
      this.invalidateModelValidation()
      this.saveStageSnapshot()
      this.$message.success('流属性已保存')
      this.modelFlowDrawerVisible = false
    },
    invalidateModelValidation() {
      if (this.modelValidated) {
        this.modelValidated = false
        this.$message.info('模型已调整，请重新校核')
      }
    },
    createEmptyModelStages() {
      const stageNames = this.stdStageNames || []
      const META = {
        '原材料获取阶段': { key: 'raw_material', dot: 'sd-raw' },
        '生产制造阶段': { key: 'manufacturing', dot: 'sd-manu' },
        '整车生产阶段': { key: 'vehicle_production', dot: 'sd-manu' },
        '运输分销阶段': { key: 'transport', dot: 'sd-trans' },
        '产品使用阶段': { key: 'use', dot: 'sd-use' },
        '使用阶段': { key: 'use', dot: 'sd-use' },
        '报废回收阶段': { key: 'recycle', dot: 'sd-recycle' }
      }
      if (stageNames.length) {
        return stageNames.map((name, i) => {
          const m = META[name] || { key: 'stage' + i, dot: 'sd-raw' }
          return { key: m.key, title: name, dotClass: m.dot, processes: [] }
        })
      }
      // 未选标准时退回通用 5 阶段
      return [
        { key: 'raw_material', title: '原材料获取阶段', dotClass: 'sd-raw', processes: [] },
        { key: 'manufacturing', title: '生产制造阶段', dotClass: 'sd-manu', processes: [] },
        { key: 'transport', title: '运输分销阶段', dotClass: 'sd-trans', processes: [] },
        { key: 'use', title: '产品使用阶段', dotClass: 'sd-use', processes: [] },
        { key: 'recycle', title: '报废回收阶段', dotClass: 'sd-recycle', processes: [] }
      ]
    },
    // 是否为风机碳足迹任务（产品名含"风电机组/风机"）
    isWindTask() {
      const t = this.taskList.find(t => t.id === this.currentTaskId)
      const n = (t && t.productName) || ''
      return n.indexOf('风机') > -1 || n.indexOf('风电机组') > -1
    },
    // 通用任务的默认校验项（汽车制造示例，与 data() 初始同构）
    createDefaultValidationItems() {
      return [
        { id: 'val-1', type: 'completeness', stage: '原材料获取阶段', process: '原料获取', label: '铜(线束)活动数据为BOM理论估算值，缺少实测采购台账', ioType: 'input', ioName: '铜(线束)', value: '', unit: 'kg', status: 'missing', statusLabel: '待补充', supplementHint: '铜材采购台账 / 供应商出货清单', recommended: '30', recommendNote: 'BOM理论估算用量' },
        { id: 'val-2', type: 'consistency', stage: '生产制造阶段', process: '涂装工序', label: '天然气同时记录"使用"(Nm³)与"生产"(m³)两笔，疑似重复计算', ioType: 'input', ioName: '非生物质天然气', value: '850', unit: 'Nm³', status: 'pending', statusLabel: '待确认', supplementHint: '涂装工序能源台账 / 天然气计量记录', recommended: '850', recommendNote: '仅计使用侧，剔除生产侧重复记录' },
        { id: 'val-3', type: 'consistency', stage: '产品使用阶段', process: '使用环节', label: '活动数据原始单位为L(12,000L)，需折算为kg', ioType: 'input', ioName: '汽油使用', value: '8880', unit: 'kg', status: 'pending', statusLabel: '待确认', supplementHint: '油耗检测报告 / NEDC工况备案数据', recommended: '8880', recommendNote: '12,000 L × 0.74 kg/L 密度折算' },
        { id: 'val-4', type: 'dqr', stage: '生产制造阶段', process: '冲压工序', label: '边角料（废钢）排放因子引用国外数据库，地理代表性评分偏高', ioType: 'output', ioName: '边角料（废钢）', value: '3.5', unit: '分', status: 'pending', statusLabel: '待确认', supplementHint: '国内废钢排放因子数据 / 行业LCA数据库', recommended: '3.0', recommendNote: '改用国内废钢因子后的地理代表性评分' }
      ]
    },
    // 校验项是否全部处理完毕（resolved/skipped），用于右侧"进入下一步"按钮显隐
    validationAllResolved() {
      const items = this.validationItems || []
      return items.length > 0 && items.every(v => v.status === 'resolved' || v.status === 'skipped')
    },
    // 按任务类型分发模型构建：风机任务→风机五环节模型，其余→汽车默认模型
    // （仅在事件处理时机调用；data() 初始化阶段 taskList 未就绪，须继续用 createInitialModelStages）
    // ===== 核算输入清单上传（单 Excel，多 sheet 自动识别） =====
    /** 触发文件选择 */
    triggerUpload() {
      const el = this.$refs.inputFileInput
      if (el) el.click()
    },
    /** 处理 Excel 文件：按 sheet 名识别并分发 */
    handleInputFileChange(e) {
      const file = (e.target.files || [])[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = new Uint8Array(ev.target.result)
          const wb = XLSX.read(data, { type: 'array' })
          this.dispatchSheets(wb, file.name)
        } catch (err) {
          this.$message.error('Excel 解析失败：' + err.message)
        }
      }
      reader.readAsArrayBuffer(file)
      e.target.value = ''
    },
    /** 按 sheet 名分发到三类数据 */
    dispatchSheets(wb, fileName) {
      this.inputFileName = fileName
      const results = []
      let bomN = 0, engN = 0, parN = 0

      wb.SheetNames.forEach(sheetName => {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' })
        if (!rows.length) return

        // 按 sheet 名关键词识别
        const nm = sheetName.replace(/\s/g, '')
        if (/BOM|物料|零件/i.test(nm)) {
          this.bomRows = this.parseBomRows(rows)
          bomN = this.bomRows.length
          results.push('BOM ' + bomN + ' 条')
        } else if (/能源|台账/i.test(nm)) {
          this.energyRows = this.parseEnergyRows(rows)
          engN = this.energyRows.length
          results.push('能源 ' + engN + ' 条')
        } else if (/参数|保养|车辆/i.test(nm)) {
          this.paramRows = this.parseParamRows(rows)
          parN = this.paramRows.length
          results.push('参数 ' + parN + ' 项')
        }
      })

      if (!results.length) {
        this.$message.warning('未识别到有效 sheet（需含 BOM / 能源 / 参数 关键词）')
        return
      }
      this.$message.success('解析成功：' + results.join('，'))
      // 在对话中反馈解析结果（智能体接收附件）
      if (this.messages) {
        this.messages.push({
          id: 'MSG-' + Date.now(),
          role: 'assistant',
          content: '**【附件已解析】** 文件：' + fileName + '\n\n识别结果：\n' +
            (bomN ? '* **BOM 清单**：' + bomN + ' 条物料，' + this.bomMaterialCount + ' 类材料 → 原材料获取阶段\n' : '') +
            (engN ? '* **能源消耗台账**：' + engN + ' 条记录，' + this.energyProcessCount + ' 个工序 → 整车生产阶段\n' : '') +
            (parN ? '* **车辆参数与保养**：' + parN + ' 项参数 → 使用阶段\n' : '') +
            '\n点击「上传全部材料并构建模型」生成核算模型。',
          timestamp: new Date().toLocaleTimeString('zh-CN'),
          suggestions: ['上传全部材料并构建模型']
        })
        if (this.scrollToBottom) this.$nextTick(this.scrollToBottom)
      }
      // 上传成功即自动构建模型（右侧同步更新）
      this.$nextTick(() => {
        const hasData = (this.bomRows || []).length || (this.energyRows || []).length || (this.paramRows || []).length
        if (this.currentStepIndex === 2 && hasData) {
          this.isModelBuilt = true
          this.modelStages = this.buildModelStages()
          this.$forceUpdate()
          this.$message.success('核算模型已自动生成，可在右侧核对')
        }
      })
    },

    /** 解析 BOM sheet → 物料行 */
    parseBomRows(rows) {
      const out = []
      rows.forEach(r => {
        const mat = this._pick(r, ['材料类别', '材质', '材料'])
        const w = parseFloat(this._pick(r, ['单件重量(kg)', '单件重量', '单重', '重量'])) || 0
        const q = parseFloat(this._pick(r, ['数量'])) || 1
        if (!mat || w <= 0) return
        const partName = this._pick(r, ['零件名称', '物料名称', '名称'])
        out.push({
          name: partName,
          pname: partName,
          part: partName,
          material: mat,
          weight: w,
          qty: q,
          total: Math.round(w * q * 100) / 100,
          system: this._pick(r, ['所属系统', '系统']),
          supplier: this._pick(r, ['供应商', '供应商/产地']),
          distance: this._pick(r, ['运输距离(km)', '运输距离', '距离'])
        })
      })
      return out
    },
    /** 解析能源台账 sheet */
    parseEnergyRows(rows) {
      const out = []
      rows.forEach(r => {
        const proc = this._pick(r, ['工序名称', '工序'])
        const q = parseFloat(this._pick(r, ['消耗量', '用量'])) || 0
        if (!proc || q <= 0) return
        out.push({
          process: proc,
          energyType: this._pick(r, ['能源类型', '能源']) || '市电',
          quantity: q,
          unit: this._pick(r, ['单位']) || 'kWh',
          source: this._pick(r, ['计量点/数据来源', '计量点', '数据来源']),
          // 材料输入（台账明确指定时）
          material: this._pick(r, ['材料名称', '材料']),
          materialQty: this._pick(r, ['材料用量', '用量2']),
          materialUnit: this._pick(r, ['材料单位'])
        })
      })
      return out
    },
    /** 解析车辆参数 sheet */
    parseParamRows(rows) {
      const out = []
      rows.forEach(r => {
        const name = this._pick(r, ['参数名称', '名称'])
        const val = this._pick(r, ['数值', '值'])
        if (!name || val === '') return
        out.push({
          category: this._pick(r, ['参数类别', '类别']),
          name: name,
          value: val,
          unit: this._pick(r, ['单位']),
          source: this._pick(r, ['数据来源'])
        })
      })
      return out
    },
    /** 按候选键名从行对象取值（兼容不同列名） */
    _pick(row, keys) {
      for (let i = 0; i < keys.length; i++) {
        const v = row[keys[i]]
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim()
      }
      return ''
    },

    /** 按 BOM 材料类别聚合 */
    aggregateBomByMaterial() {
      const map = {}
      ;(this.bomRows || []).forEach(r => {
        if (!map[r.material]) map[r.material] = { material: r.material, total: 0, items: [] }
        map[r.material].total += r.total
        map[r.material].items.push(r)
      })
      return Object.keys(map).map(k => map[k]).sort((a, b) => b.total - a.total)
    },
    /** 按工序聚合能源消耗 */
    aggregateEnergyByProcess() {
      const map = {}
      ;(this.energyRows || []).forEach(r => {
        if (!map[r.process]) map[r.process] = { process: r.process, items: [] }
        map[r.process].items.push(r)
      })
      return Object.keys(map).map(k => map[k])
    },
    /** 读取单个参数值 */
    getParam(name) {
      const p = (this.paramRows || []).find(x => x.name === name)
      return p ? parseFloat(p.value) : null
    },

    /** 构建核算模型：按【阶段1标准配置 + 阶段2边界配置】动态生成单元过程 */
    // ===== V3：按「产品→系统→零部件→材料」多层级构建模型 =====
    buildModelStages() {
      if (this.isWindTask()) return this.createWindModelStages()

      const cfg = this.selectedStandardConfig || {}
      const stageNames = this.stdStageNames || []
      if (!stageNames.length) return this.createInitialModelStages()

      const STAGE_META = {
        '原材料获取阶段': { key: 'raw_material', dot: 'sd-raw', code: 'S1' },
        '生产制造阶段': { key: 'manufacturing', dot: 'sd-manu', code: 'S2' },
        '整车生产阶段': { key: 'vehicle_production', dot: 'sd-manu', code: 'S2' },
        '运输分销阶段': { key: 'transport', dot: 'sd-trans', code: 'S3' },
        '产品使用阶段': { key: 'use', dot: 'sd-use', code: 'S4' },
        '使用阶段': { key: 'use', dot: 'sd-use', code: 'S4' },
        '报废回收阶段': { key: 'recycle', dot: 'sd-recycle', code: 'S5' }
      }

      // 计数器：同阶段同类型内递增
      const counter = {}
      const nextCode = (stageCode, typeCode) => {
        const k = stageCode + '-' + typeCode
        counter[k] = (counter[k] || 0) + 1
        return stageCode + '-P' + String(counter[k]).padStart(3, '0')
      }

      // 按系统聚合 BOM
      const bySystem = {}
      ;(this.bomRows || []).forEach(r => {
        const sys = r.system || '其他'
        if (!bySystem[sys]) bySystem[sys] = {}
        if (!bySystem[sys][r.part]) bySystem[sys][r.part] = []
        bySystem[sys][r.part].push(r)
      })

      // 按工序聚合能源
      const energyAgg = this.aggregateEnergyByProcess()

      return stageNames.map(name => {
        const meta = STAGE_META[name] || { key: 'stage', dot: 'sd-raw', code: 'S9' }
        const stageCode = meta.code
        let processes = []

        // ── 原材料获取阶段：按零部件拆分（多层级）──
        if (name.indexOf('原材料') > -1) {
          Object.keys(bySystem).forEach(sys => {
            Object.keys(bySystem[sys]).forEach(part => {
              const items = bySystem[sys][part]
              const totalW = items.reduce((a, x) => a + (x.total || 0), 0)
              processes.push({
                name: part,
                processCode: nextCode(stageCode, 'M'),
                layerType: 'part',
                level: 3,
                parentRef: sys,
                allocation: 'mass',
                inputs: items.map(x => ({
                  name: x.material,
                  value: String(x.total),
                  rawValue: String(x.total),
                  unit: 'kg',
                  dataSource: 'BOM清单（' + (x.pname || '') + '）',
                  flowType: 'raw_material',
                  listType: 'raw_material'
                })),
                outputs: [{
                  name: part,
                  value: String(Math.round(totalW * 100) / 100),
                  unit: 'kg',
                  flowType: 'product',
                  productSubType: 'main',
                  listType: 'main_product'
                }]
              })
            })
          })
          if (!processes.length) {
            processes = [{ name: '原材料获取', processCode: nextCode(stageCode, 'M'),
              layerType: 'part', level: 3, parentRef: '', allocation: 'mass',
              inputs: [{ name: '主要原材料', value: '', unit: 'kg', flowType: 'raw_material', listType: 'raw_material' }],
              outputs: [{ name: '材料（供下游）', value: '', unit: 'kg', flowType: 'product', productSubType: 'main', listType: 'main_product' }] }]
          }
          // 材料运输：仅当 BOM 提供「运输距离」时才生成（V3 规则：无距离列不生成）
          if ((this.bomRows || []).some(x => x.distance && parseFloat(x.distance) > 0)) {
            processes.push({
              name: '材料运输',
              processCode: nextCode(stageCode, 'T'),
              layerType: 'part', level: 3, parentRef: '',
              allocation: 'mass',
              processAttrs: { transportMode: '公路', distance: 180 },
              inputs: [{ name: '原材料', value: '', unit: 'kg', flowType: 'product', listType: 'product' }],
              outputs: [{ name: '到货原材料', value: '', unit: 'kg', flowType: 'product', productSubType: 'main', listType: 'main_product' }]
            })
          }
        }

        // ── 生产制造阶段：按能源台账工序展开（类型码 E）──
        else if (name.indexOf('整车生产') > -1 || name.indexOf('生产制造') > -1) {
          if (energyAgg.length) {
            processes = energyAgg.map(g => {
              // 能源输入
              const energyInputs = g.items.map(e => {
                const isElec = /市电|电/.test(e.energyType)
                const isGas = /天然气|燃气/.test(e.energyType)
                return {
                  name: e.energyType,
                  value: String(e.quantity),
                  rawValue: String(e.quantity),
                  unit: e.unit,
                  dataSource: e.source || ('能源台账-' + g.process),
                  flowType: (isElec || isGas) ? 'energy' : 'resource',
                  listType: (isElec || isGas) ? 'energy' : 'resource'
                }
              })
              // 材料输入（台账明确指定材料时）
              const matInputs = (g.items || [])
                .filter(e => e.material && e.materialQty)
                .map(e => ({
                  name: e.material,
                  value: String(e.materialQty),
                  rawValue: String(e.materialQty),
                  unit: e.materialUnit || 'kg',
                  dataSource: '能源台账材料列-' + g.process,
                  flowType: 'raw_material',
                  listType: 'raw_material'
                }))
              return {
                name: g.process,
                processCode: nextCode(stageCode, 'E'),
                layerType: 'system', level: 4, parentRef: '',
                allocation: 'mass',
                inputs: energyInputs.concat(matInputs),
                outputs: [{
                  name: g.process.replace('工序', '') + '件',
                  value: '', unit: 'kg',
                  flowType: 'product', productSubType: 'main', listType: 'main_product'
                }]
              }
            })
          } else {
            // 无台账：按标准 4.2.2.3 工序骨架
            processes = ['冲压', '焊接', '涂装', '总装', '动力站房'].map(p => ({
              name: p + '工序',
              processCode: nextCode(stageCode, 'E'),
              layerType: 'system', level: 4, parentRef: '',
              allocation: 'mass',
              inputs: [{ name: '市电', value: '', unit: 'kWh', flowType: 'energy', listType: 'energy' }],
              outputs: [{ name: p + '件', value: '', unit: 'kg', flowType: 'product', productSubType: 'main', listType: 'main_product' }]
            }))
          }
        }

        // ── 运输分销阶段：运输 + 仓储（固定 2 个）──
        else if (name.indexOf('运输') > -1) {
          processes = [
            { name: '成品运输', processCode: nextCode(stageCode, 'T'),
              layerType: 'product', level: 5, parentRef: '',
              allocation: 'mass',
              processAttrs: { transportMode: '公路', distance: 180 },
              inputs: [{ name: '成品', value: '', unit: 'kg', flowType: 'product', listType: 'product' }],
              outputs: [{ name: '成品', value: '', unit: 'kg', flowType: 'product', productSubType: 'main', listType: 'main_product' }] },
            { name: '仓储', processCode: nextCode(stageCode, 'W'),
              layerType: 'product', level: 5, parentRef: '',
              allocation: 'mass',
              processAttrs: { storageDays: 15, storageType: '成品库' },
              inputs: [
                { name: '成品', value: '', unit: 'kg', flowType: 'product', listType: 'product' },
                { name: '市电', value: '', unit: 'kWh', flowType: 'energy', listType: 'energy' }
              ],
              outputs: [{ name: '成品', value: '', unit: 'kg', flowType: 'product', productSubType: 'main', listType: 'main_product' }] }
          ]
        }

        // ── 产品使用阶段：合并为 1 个「产品使用」过程（能源按参数表动态识别）──
        else if (name.indexOf('使用') > -1) {
          const gp = this.getParam.bind(this)
          const mile = gp('生命周期行驶里程') || 150000

          // ── 能源识别：从参数表动态解析（不写死类型）──
          // 模式：参数名形如「百公里X耗」或「百公里X消耗」，X 为能源关键词
          // 单位：参数「单位」列形如 kWh/100km、L/100km，提取斜杠前部为消耗量单位
          const ENERGY_NAME_MAP = {
            '电': '电力',
            '电耗': '电力',
            '油': '汽油',
            '汽油': '汽油',
            '柴油': '柴油',
            '气': '天然气',
            '天然气': '天然气',
            '燃气': '天然气',
            '氢': '氢气',
            '氢气': '氢气',
            '甲醇': '甲醇',
            '乙醇': '乙醇',
            '液化石油气': '液化石油气',
            'LPG': '液化石油气',
            '压缩天然气': '压缩天然气',
            'CNG': '压缩天然气'
          }
          const energyInputs = []
          ;(this.paramRows || []).forEach(p => {
            const nm = (p.name || '').trim()
            // 匹配「(百公里|每百公里)?(.+?)(耗|消耗)$」
            const mt = nm.match(/^(?:百公里|每百公里)?(.+?)(?:耗|消耗)$/)
            if (!mt) return
            const kw = mt[1].trim()
            if (!kw) return
            // 映射到标准能源名；未识别则丢弃
            const stdName = ENERGY_NAME_MAP[kw]
            if (!stdName) return
            const cons = parseFloat(p.value)
            if (isNaN(cons) || cons <= 0) return
            // 单位：从「kWh/100km」提取「kWh」
            let unit = (p.unit || '').split('/')[0].trim()
            if (!unit) {
              unit = /电|氢/.test(stdName) ? 'kWh' : (/气/.test(stdName) ? 'm³' : 'L')
            }
            const total = Math.round(mile / 100 * cons * 100) / 100
            // 双侧：生产 + 消费
            energyInputs.push({
              name: stdName + '（生产）',
              value: String(total), rawValue: String(total), unit: unit,
              dataSource: '参数表：' + nm + ' ' + cons + (p.unit || ''),
              flowType: 'energy', listType: 'energy'
            })
            energyInputs.push({
              name: stdName + '（消费）',
              value: String(total), rawValue: String(total), unit: unit,
              dataSource: '实际消耗台账',
              flowType: 'energy', listType: 'energy'
            })
          })
          // 无任何可识别能源参数时兜底为电力
          if (!energyInputs.length) {
            const cons0 = gp('百公里电耗') || 12.5
            const totalKwh = Math.round(mile / 100 * cons0 * 100) / 100
            energyInputs.push(
              { name: '电力（生产）', value: String(totalKwh), unit: 'kWh', flowType: 'energy', listType: 'energy' },
              { name: '电力（消费）', value: String(totalKwh), unit: 'kWh', flowType: 'energy', listType: 'energy' }
            )
          }

          // ── 材料识别 ──
          const tireTimes = gp('轮胎更换次数')
          const tireW = gp('单条轮胎重量')
          const tireTotal = tireTimes && tireW ? Math.round(tireTimes * 4 * tireW * 100) / 100 : 86.40
          const batTimes = gp('铅酸蓄电池更换次数')
          const batW = gp('单块铅酸蓄电池重量')
          const batTotal = batTimes && batW ? Math.round(batTimes * batW * 100) / 100 : 18.20
          const oilW = gp('润滑剂更换量') || 3.40
          const brakeW = gp('刹车液更换量') || 1.20
          const coolW = gp('冷却液更换量') || 6.20
          const refW = gp('制冷剂充注量') || 0.68
          const refType = ((this.paramRows || []).find(x => x.name === '制冷剂型号') || {}).value || 'R134a'

          const matInputs = [
            { name: '轮胎', value: String(tireTotal), unit: 'kg',
              dataSource: '车辆参数：' + (tireTimes || 2) + '次 × 4条 × ' + (tireW || 17.28) + 'kg',
              flowType: 'raw_material', listType: 'raw_material' },
            { name: '蓄电池', value: String(batTotal), unit: 'kg',
              dataSource: '车辆参数：' + (batTimes || 2) + '次 × ' + (batW || 18.20) + 'kg',
              flowType: 'raw_material', listType: 'raw_material' },
            { name: '润滑剂', value: String(oilW), unit: 'kg',
              dataSource: '保养手册', flowType: 'raw_material', listType: 'raw_material' },
            { name: '刹车液', value: String(brakeW), unit: 'kg',
              dataSource: '保养手册', flowType: 'raw_material', listType: 'raw_material' },
            { name: '冷却液', value: String(coolW), unit: 'kg',
              dataSource: '保养手册', flowType: 'raw_material', listType: 'raw_material' },
            { name: refType, value: String(refW), unit: 'kg',
              dataSource: '车辆参数：制冷剂充注量', flowType: 'raw_material', listType: 'raw_material' }
          ]

          // ── 输出 ──
          const outputs = [
            { name: '服务量', value: String(mile), unit: 'km',
              flowType: 'product', productSubType: 'main', listType: 'main_product' },
            { name: '废轮胎', value: String(tireTotal), unit: 'kg',
              flowType: 'waste', productSubType: 'waste', listType: 'solid_waste' },
            { name: '废蓄电池', value: String(batTotal), unit: 'kg',
              flowType: 'waste', productSubType: 'waste', listType: 'solid_waste' },
            { name: '废液', value: String(Math.round((oilW + brakeW + coolW) * 100) / 100), unit: 'kg',
              flowType: 'waste', productSubType: 'waste', listType: 'solid_waste' },
            { name: '制冷剂逸散', value: String(refW), unit: 'kg',
              flowType: 'elementary', listType: 'waste_gas' }
          ]

          processes = [{
            name: '产品使用', processCode: nextCode(stageCode, 'E'),
            layerType: 'product', level: 5, parentRef: '',
            allocation: 'mass',
            inputs: energyInputs.concat(matInputs),
            outputs: outputs
          }]
        }

        // ── 报废回收阶段：不预置，台账驱动 ──
        else if (name.indexOf('报废') > -1 || name.indexOf('回收') > -1) {
          // 无台账时不生成过程
          processes = []
        }

        return {
          key: meta.key,
          title: name,
          dotClass: meta.dot,
          processes: processes
        }
      })
    },
    /** 材料演示数据（按标准表1 材料类别，虚构符合实车量级的用量与因子） */
    materialDemo(name) {
      // qty: 折算后用量(kg) | raw: 台账原始值 | ef: 碳排放因子(kgCO₂e/kg) | src: 因子来源 | ds: 数据来源
      const D = {
        // 金属材料（纯电轿车钢/铝为主）
        '钢铁': { qty: '412.60', raw: '412.6', ef: '2.05', src: 'CPCD 钢铁（高炉+转炉）', ds: 'BOM清单-车身系统' },
        '铸铁': { qty: '86.30', raw: '86.3', ef: '1.52', src: 'CPCD 铸铁', ds: 'BOM清单-动力系统' },
        '铝及铝合金': { qty: '198.40', raw: '198.4', ef: '11.26', src: 'CPCD 原铝（电解铝）', ds: 'BOM清单-车身/底盘' },
        '镁及镁合金': { qty: '12.50', raw: '12.5', ef: '24.10', src: 'CPCD 镁合金', ds: 'BOM清单-仪表支架' },
        '铜及铜合金': { qty: '34.80', raw: '34.8', ef: '3.48', src: 'CPCD 精炼铜', ds: 'BOM清单-线束/电机' },
        '铅': { qty: '18.20', raw: '18.2', ef: '2.12', src: 'CPCD 再生铅', ds: 'BOM清单-12V蓄电池' },
        // 塑料与橡胶
        '热塑性塑料': { qty: '142.70', raw: '142.7', ef: '2.73', src: 'CPCD PP/ABS 平均', ds: 'BOM清单-内外饰' },
        '热固性塑料': { qty: '28.40', raw: '28.4', ef: '3.85', src: 'CPCD 环氧/聚氨酯', ds: 'BOM清单-结构件' },
        '橡胶': { qty: '68.90', raw: '68.9', ef: '2.95', src: 'CPCD 合成橡胶', ds: 'BOM清单-轮胎/密封' },
        '玻璃纤维': { qty: '15.60', raw: '15.6', ef: '4.12', src: 'CPCD 玻纤制品', ds: 'BOM清单-轻量化件' },
        // 玻璃与陶瓷
        '陶瓷玻璃': { qty: '96.30', raw: '96.3', ef: '1.28', src: 'CPCD 汽车玻璃', ds: 'BOM清单-车窗' },
        '织物': { qty: '22.80', raw: '22.8', ef: '3.16', src: 'CPCD 涤纶织物', ds: 'BOM清单-座椅内饰' },
        // 电池材料（76.8kWh 磷酸铁锂）
        '磷酸铁锂': { qty: '286.50', raw: '286.5', ef: '12.85', src: 'CPCD 磷酸铁锂正极', ds: 'BOM清单-电芯正极' },
        '镍钴锰酸锂': { qty: '0.00', raw: '0', ef: '18.60', src: 'CPCD NCM 三元正极', ds: '本车型未使用' },
        '锰酸锂': { qty: '0.00', raw: '0', ef: '14.20', src: 'CPCD 锰酸锂正极', ds: '本车型未使用' },
        '石墨': { qty: '198.40', raw: '198.4', ef: '8.42', src: 'CPCD 人造石墨负极', ds: 'BOM清单-电芯负极' },
        '电解液': { qty: '82.60', raw: '82.6', ef: '6.18', src: 'CPCD 锂电电解液', ds: 'BOM清单-电芯电解液' },
        '六氟磷酸锂': { qty: '18.70', raw: '18.7', ef: '21.50', src: 'CPCD LiPF6', ds: 'BOM清单-电解质锂盐' },
        '硫镍': { qty: '0.00', raw: '0', ef: '9.80', src: 'CPCD 硫镍材料', ds: '本车型未使用' },
        // 液体与助剂
        '润滑剂': { qty: '6.80', raw: '6.8', ef: '1.85', src: 'CPCD 润滑油', ds: 'BOM清单-减速器油' },
        '刹车液': { qty: '1.20', raw: '1.2', ef: '2.34', src: 'CPCD 制动液', ds: 'BOM清单-制动系统' },
        '冷却液': { qty: '12.40', raw: '12.4', ef: '2.68', src: 'CPCD 乙二醇冷却液', ds: 'BOM清单-热管理' },
        '制冷剂': { qty: '0.68', raw: '0.68', ef: '1430.00', src: 'IPCC R134a GWP100', ds: 'BOM清单-空调系统' },
        '洗涤液': { qty: '3.50', raw: '3.5', ef: '0.92', src: 'CPCD 玻璃水', ds: 'BOM清单-雨刮系统' }
      }
      return D[name] || { qty: '0', raw: '0', ef: '0', src: '—', ds: '—' }
    },
    /** 材料类别按大类聚合（钢铁/铝/塑料/橡胶/玻璃/电池材料/液体 等） */
    groupMaterials(list) {
      const G = {
        '金属材料': ['钢铁', '铸铁', '铝及铝合金', '镁及镁合金', '铜及铜合金', '铅'],
        '塑料与橡胶': ['热塑性塑料', '热固性塑料', '橡胶', '玻璃纤维'],
        '玻璃与陶瓷': ['陶瓷玻璃', '织物'],
        '电池材料': ['磷酸铁锂', '镍钴锰酸锂', '锰酸锂', '石墨', '电解液', '六氟磷酸锂', '硫镍'],
        '液体与助剂': ['润滑剂', '刹车液', '冷却液', '制冷剂', '洗涤液']
      }
      const res = []
      const used = {}
      Object.keys(G).forEach(title => {
        const items = list.filter(m => G[title].indexOf(m) > -1)
        if (items.length) {
          res.push({ title, items })
          items.forEach(m => { used[m] = true })
        }
      })
      // 未归类材料并入「其他材料」
      const rest = list.filter(m => !used[m])
      if (rest.length) res.push({ title: '其他材料', items: rest })
      return res
    },
    // 风机任务校验项（数据质量/一致性/完整性问题取自风机核算实际场景）
    createWindValidationItems() {
      return [
        { id: 'wval-1', type: 'completeness', stage: '原材料获取阶段', process: '原材料获取（叶片/机舱/塔筒材料）', label: '钕铁硼永磁材料用量为设计BOM值，稀土采选冶因子取值需供应商核实', ioType: 'input', ioName: '钕铁硼永磁材料', value: '', unit: 'kg', status: 'missing', statusLabel: '待补充', supplementHint: '发电机供应商BOM与稀土用量清单', recommended: '6000', recommendNote: '发电机设计BOM用量' },
        { id: 'wval-2', type: 'consistency', stage: '生产制造阶段', process: '叶片制造（模具成型/固化/打磨）', label: '玻纤边角料同时出现"出厂转运"与"厂内暂存"两笔记录，疑似重复计数', ioType: 'output', ioName: '废玻纤边角料', value: '1200', unit: 'kg', status: 'pending', statusLabel: '待确认', supplementHint: '叶片车间固废转移联单', recommended: '1200', recommendNote: '仅计出厂转运一笔，剔除厂内暂存重复' },
        { id: 'wval-3', type: 'consistency', stage: '使用阶段', process: '运营维护（20年·年均发电小时数4200h）', label: '年发电小时数取4200h为风场可研值，需按投运后实际数据修正', ioType: 'input', ioName: '年发电小时数', value: '4200', unit: 'h/年', status: 'pending', statusLabel: '待确认', supplementHint: '风场SCADA运行数据 / 可研报告发电量章节', recommended: '4200', recommendNote: '投运后SCADA实测均值与可研一致' },
        { id: 'wval-4', type: 'dqr', stage: '报废回收阶段', process: '退役拆解与材料回收', label: '废玻纤叶片处置路径（填埋/水泥窑协同）因子引用国外数据库，地理代表性评分偏高', ioType: 'output', ioName: '废玻纤叶片', value: '3.5', unit: '分', status: 'pending', statusLabel: '待确认', supplementHint: '国内风电叶片回收处置因子数据', recommended: '3.0', recommendNote: '改用国内处置因子后的地理代表性评分' }
      ]
    },
    // 风机任务画像：标准、功能单位、模型、校验项整体切换为风机口径
    // 标准复用政策标准库已有的 GB/T 24067-2024 通用条目（同编号去重，不另插风机变体）
    applyWindTaskProfile() {
      const code = 'GB/T 24067-2024'
      // 兼容旧快照：移除历史版本动态插入的风机变体条目，避免列表重复
      this.standards = this.standards.filter(s => s.code.indexOf('（风力发电机组）') === -1)
      this.standards.forEach(s => { s.active = s.code === code })
      this.selectedStandard = code
      this.boundaryConfig.unitType = 'functional'
      this.boundaryConfig.unitDetail = '1台陆上风电机组（额定功率6.5MW，叶轮直径171m，塔架高度110m，设计寿命20年，年均发电小时数4200h）'
      this.modelStages = this.createWindModelStages()
      this.validationItems = this.createWindValidationItems()
    },
    // 通用任务画像：口径由所选标准驱动；模型初始为空骨架，由用户在阶段3构建
    applyDefaultTaskProfile() {
      if (!Array.isArray(this.standards) || !this.standards.length) {
        this.standards = loadPcfStandardsForAgent()
      }
      this.selectedStandard = this.defaultStandardCode() || (this.standards[0] && this.standards[0].code) || '' ;
      this.modelStages = this.createEmptyModelStages()
      this.validationItems = this.createDefaultValidationItems()
      // 迟一拍同步：确保 selectedStandardConfig 已解析完成
      this.$nextTick(() => this.initBoundaryFromSkill())
    },
    /** 将标准规定的边界项同步到 boundaryConfig（锁定项以标准为准） */
    syncBoundaryFromStandard() {
      const cfg = this.selectedStandardConfig
      if (!cfg) return
      const bt = cfg.boundaryTemplate || {}
      if (cfg.scopeFixedValue) this.$set(this.boundaryConfig, 'lifecycleScope', cfg.scopeFixedValue)
      if (bt.unitType) this.$set(this.boundaryConfig, 'unitType', bt.unitType)
      if (bt.unitDetail) this.$set(this.boundaryConfig, 'unitDetail', bt.unitDetail)
      if (bt.allocationRule) this.$set(this.boundaryConfig, 'allocationRule', bt.allocationRule)
      if (bt.cutoffItemThreshold) this.$set(this.boundaryConfig, 'cutoffItemThreshold', bt.cutoffItemThreshold)
      if (bt.cutoffTotalThreshold) this.$set(this.boundaryConfig, 'cutoffTotalThreshold', bt.cutoffTotalThreshold)
      if (bt.cutoffThreshold) this.$set(this.boundaryConfig, 'cutoffThreshold', bt.cutoffThreshold)
      if (bt.timeBoundary) this.$set(this.boundaryConfig, 'timeBoundary', bt.timeBoundary)
      if (bt.lifecycleScope && !cfg.scopeFixedValue) this.$set(this.boundaryConfig, 'lifecycleScope', bt.lifecycleScope)
      const standard = this.selectedStandardConfig
      const meta = this.boundarySourceMeta
      if (standard && meta) {
        this.boundarySourceMeta = {
          ...meta,
          standardCode: standard.code,
          standardName: standard.name,
          appliedAt: new Date().toLocaleString('zh-CN')
        }
      }
    },
    // 风机五环节 LCA 模型（基于远景《风机碳足迹与低碳发展报告2023》：EN-171/6.5 机型，
    // 度电碳足迹 5.56 gCO2e/kWh；五环节：原材料开采/零部件生产/风场建设安装/运营维护/废弃回收；
    // 碳排放占比：零部件生产 49.3% > 风场建设 40.1% > 运维最低；年发电小时数 3500~4500h、设计年限 20 年）
    createWindModelStages() {
      return [
        {
          key: 'raw_material',
          title: '原材料获取阶段',
          dotClass: 'sd-raw',
          processes: [
            {
              name: '原材料获取（叶片/机舱/塔筒材料）',
              allocation: 'mass',
              inputs: [
                { name: '玻璃纤维增强塑料（叶片主体）', value: '85000', unit: 'kg', factor: '2.71', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '环氧树脂（叶片基体）', value: '50000', unit: 'kg', factor: '4.15', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '低合金钢（塔筒/机架）', value: '460000', unit: 'kg', factor: '1.57', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '合金钢（主轴/齿轮箱）', value: '80000', unit: 'kg', factor: '2.48', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '铸铁（轮毂/机舱底座）', value: '80000', unit: 'kg', factor: '1.92', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '铜（电缆/绕组）', value: '10000', unit: 'kg', factor: '3.48', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '钕铁硼永磁材料（直驱发电机，含稀土）', value: '6000', unit: 'kg', factor: '18.6', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '原材料入厂物流', value: '241500', unit: 't*km', factor: '0.148', factorUnit: 'kgCO₂e/t*km', flowType: 'elementary', listType: 'transport' }
              ],
              outputs: [
                { name: '风电机组部件（叶片×3/机舱/塔筒/轮毂）', value: '770000', unit: 'kg', factor: null, factorUnit: null, flowType: 'product', productSubType: 'main', listType: 'main_product', toStage: 'manufacturing' }
              ]
            }
          ]
        },
        {
          key: 'manufacturing',
          title: '生产制造阶段',
          dotClass: 'sd-manu',
          processes: [
            {
              name: '叶片制造（模具成型/固化/打磨）',
              allocation: 'mass',
              inputs: [
                { name: '市电（叶片厂）', value: '112000', unit: 'kWh', factor: '0.581', factorUnit: 'kgCO₂e/kWh', flowType: 'elementary', listType: 'energy' }
              ],
              outputs: [
                { name: '固化挥发有机物（VOC）', value: '500', unit: 'kg', factor: '2.52', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'waste_gas' },
                { name: '废玻纤边角料', value: '1200', unit: 'kg', factor: '0.52', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'solid_waste' }
              ]
            },
            {
              name: '机舱总装与塔筒焊接',
              allocation: 'mass',
              inputs: [
                { name: '市电（总装厂）', value: '62000', unit: 'kWh', factor: '0.581', factorUnit: 'kgCO₂e/kWh', flowType: 'elementary', listType: 'energy' },
                { name: '天然气（涂装烘干）', value: '1800', unit: 'Nm³', factor: '2.162', factorUnit: 'kgCO₂e/Nm³', flowType: 'elementary', listType: 'energy' }
              ],
              outputs: [
                { name: '焊接烟尘', value: '120', unit: 'kg', factor: '1.85', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'waste_gas' },
                { name: '废焊材包装', value: '80', unit: 'kg', factor: '0.61', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'solid_waste' }
              ]
            }
          ]
        },
        {
          key: 'transport',
          title: '运输分销阶段',
          dotClass: 'sd-trans',
          processes: [
            {
              name: '大件运输（叶片/塔筒/机舱至风场）',
              allocation: 'mass',
              inputs: [
                { name: '重型货车运输（叶片，超高件专运）', value: '280000', unit: 't*km', factor: '0.148', factorUnit: 'kgCO₂e/t*km', flowType: 'elementary', listType: 'transport' },
                { name: '重型货车运输（塔筒+机舱）', value: '346900', unit: 't*km', factor: '0.148', factorUnit: 'kgCO₂e/t*km', flowType: 'elementary', listType: 'transport' }
              ],
              outputs: [
                { name: '运抵风场的机组部件（叶片/塔筒/机舱）', value: '770000', unit: 'kg', factor: null, factorUnit: null, flowType: 'product', productSubType: 'main', listType: 'main_product', toStage: 'use' }
              ]
            }
          ]
        },
        {
          key: 'use',
          title: '使用阶段',
          dotClass: 'sd-use',
          processes: [
            {
              name: '风场建设与安装（吊装/基础施工/集电线路分摊）',
              allocation: 'mass',
              inputs: [
                { name: '钢筋混凝土基础（单台机组）', value: '900000', unit: 'kg', factor: '0.152', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '集电线路及升压站混凝土（按20台机组分摊）', value: '2000000', unit: 'kg', factor: '0.152', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '场内道路及平台钢构（按20台机组分摊）', value: '220000', unit: 'kg', factor: '1.57', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '铝芯电缆（集电线路，按20台机组分摊）', value: '40000', unit: 'kg', factor: '6.16', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '柴油（吊车/施工机械）', value: '65000', unit: 'kg', factor: '3.096', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'energy' },
                { name: '市电（施工用电）', value: '248000', unit: 'kWh', factor: '0.581', factorUnit: 'kgCO₂e/kWh', flowType: 'elementary', listType: 'energy' }
              ],
              outputs: [
                { name: '建设安装完工交付（吊装/基础/集电线路并网）', value: '3930000', unit: 'kg', factor: null, factorUnit: null, flowType: 'product', productSubType: 'main', listType: 'main_product' }
              ]
            },
            {
              name: '运营维护（20年·年均发电小时数4200h）',
              allocation: 'mass',
              inputs: [
                { name: '齿轮箱润滑油更换（周期性）', value: '8000', unit: 'kg', factor: '3.18', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '备件更换（叶片修补/变桨轴承等）', value: '19600', unit: 'kg', factor: '2.21', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '运维车辆柴油（巡检）', value: '5000', unit: 'kg', factor: '3.096', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'energy' }
              ],
              outputs: [
                { name: '废润滑油（回收处置）', value: '2500', unit: 'kg', factor: '0.72', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'solid_waste' }
              ]
            }
          ]
        },
        {
          key: 'recycle',
          title: '报废回收阶段',
          dotClass: 'sd-recycle',
          processes: [
            {
              name: '退役拆解与材料回收',
              allocation: 'mass',
              inputs: [
                { name: '拆解机械柴油', value: '12500', unit: 'kg', factor: '3.096', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'energy' }
              ],
              outputs: [
                { name: '回收钢材（塔筒/机架，再生钢抵扣）', value: '300000', unit: 'kg', factor: '-1.25', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'recycled' },
                { name: '回收铜', value: '9000', unit: 'kg', factor: '-2.86', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'recycled' },
                { name: '废玻纤叶片（填埋/水泥窑协同处置）', value: '135000', unit: 'kg', factor: '0.35', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'solid_waste' }
              ]
            }
          ]
        }
      ]
    },
    createInitialModelStages() {
      return [
        {
          key: 'raw_material',
          title: '原材料获取阶段',
          dotClass: 'sd-raw',
          processes: [
            {
              name: '原料获取',
              allocation: 'mass',
              inputs: [
                { name: '铸造铝合金(含30%再生铝)', value: '85', unit: 'kg', factor: '6.41', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '非合金钢(碳钢), 低合金钢(含45%再生钢)', value: '620', unit: 'kg', factor: '1.57', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '热塑性塑料', value: '135', unit: 'kg', factor: '2.73', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '钢/铸钢/烧结钢(含45%再生钢)', value: '180', unit: 'kg', factor: '1.68', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '铝及铝合金(含30%再生铝)', value: '95', unit: 'kg', factor: '6.16', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '高合金钢(含45%再生钢)', value: '45', unit: 'kg', factor: '2.48', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '变形铝合金(含30%再生铝)', value: '70', unit: 'kg', factor: '4.53', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '橡胶', value: '75', unit: 'kg', factor: '2.95', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '聚氨酯', value: '55', unit: 'kg', factor: '4.21', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '铜(线束)', value: '28', unit: 'kg', factor: '3.48', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '原材料入厂物流', value: '8500', unit: 't*km', factor: '0.148', factorUnit: 'kgCO₂e/t*km', flowType: 'elementary', listType: 'transport' }
              ],
              outputs: [
                { name: '汽车零部件毛坯', value: '1388', unit: 'kg', factor: null, factorUnit: null, flowType: 'product', productSubType: 'main', listType: 'main_product', toStage: 'manufacturing' }
              ]
            },
            {
              name: '原材料获取-包装',
              allocation: 'mass',
              inputs: [
                { name: '瓦楞纸', value: '12', unit: 'kg', factor: '1.08', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'packaging' }
              ],
              outputs: [
                { name: '废瓦楞纸', value: '3', unit: 'kg', factor: '0.52', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'solid_waste' }
              ]
            }
          ]
        },
        {
          key: 'manufacturing',
          title: '生产制造阶段',
          dotClass: 'sd-manu',
          processes: [
            {
              name: '涂装工序',
              allocation: 'mass',
              inputs: [
                { name: '市电', value: '1200', unit: 'kWh', factor: '0.581', factorUnit: 'kgCO₂e/kWh', flowType: 'elementary', listType: 'energy' },
                { name: '热力', value: '15000', unit: 'MJ', factor: '0.092', factorUnit: 'kgCO₂e/MJ', flowType: 'elementary', listType: 'energy' },
                { name: '非生物质天然气使用', value: '850', unit: 'Nm³', factor: '2.162', factorUnit: 'kgCO₂e/Nm³', flowType: 'elementary', listType: 'energy' },
                { name: '非生物质天然气生产', value: '850', unit: 'm³', factor: '0.548', factorUnit: 'kgCO₂e/m³', flowType: 'elementary', listType: 'energy' },
                { name: '光伏电', value: '350', unit: 'kWh', factor: '0.048', factorUnit: 'kgCO₂e/kWh', flowType: 'elementary', listType: 'energy' },
                { name: '水', value: '850', unit: 't', factor: '0.193', factorUnit: 'kgCO₂e/t', flowType: 'elementary', listType: 'resource' }
              ],
              outputs: [
                { name: 'VOC焚烧', value: '120', unit: 'kg', factor: '2.52', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'waste_gas' },
                { name: '污泥', value: '280', unit: 'kg', factor: '0.486', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'solid_waste' },
                { name: '废溶剂', value: '95', unit: 'kg', factor: '1.83', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'solid_waste' },
                { name: '废水', value: '950', unit: 'm³', factor: '0.296', factorUnit: 'kgCO₂e/m³', flowType: 'elementary', listType: 'wastewater' },
                { name: '危废包装桶（200L以上）-残余物料', value: '45', unit: 'kg', factor: '0.672', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'solid_waste' },
                { name: '报废蓄电池', value: '15', unit: 'kg', factor: '1.98', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'solid_waste' }
              ]
            },
            {
              name: '焊接工序',
              allocation: 'mass',
              inputs: [
                { name: '市电', value: '2800', unit: 'kWh', factor: '0.581', factorUnit: 'kgCO₂e/kWh', flowType: 'elementary', listType: 'energy' },
                { name: '光伏电', value: '180', unit: 'kWh', factor: '0.048', factorUnit: 'kgCO₂e/kWh', flowType: 'elementary', listType: 'energy' },
                { name: 'CO2', value: '0.12', unit: 't', factor: '0.705', factorUnit: 'kgCO₂e/t', flowType: 'elementary', listType: 'resource' },
                { name: '水', value: '120', unit: 't', factor: '0.193', factorUnit: 'kgCO₂e/t', flowType: 'elementary', listType: 'resource' }
              ],
              outputs: [
                { name: 'CO2', value: '0.12', unit: 't', factor: '1.401', factorUnit: 'kgCO₂e/t', flowType: 'elementary', listType: 'waste_gas' },
                { name: '废水', value: '85', unit: 'm³', factor: '0.296', factorUnit: 'kgCO₂e/m³', flowType: 'elementary', listType: 'wastewater' }
              ]
            },
            {
              name: '冲压工序',
              allocation: 'mass',
              inputs: [
                { name: '市电', value: '1800', unit: 'kWh', factor: '0.581', factorUnit: 'kgCO₂e/kWh', flowType: 'elementary', listType: 'energy' },
                { name: '光伏电', value: '120', unit: 'kWh', factor: '0.048', factorUnit: 'kgCO₂e/kWh', flowType: 'elementary', listType: 'energy' },
                { name: '水', value: '65', unit: 't', factor: '0.193', factorUnit: 'kgCO₂e/t', flowType: 'elementary', listType: 'resource' }
              ],
              outputs: [
                { name: '边角料（废钢）', value: '42', unit: 'kg', factor: '1.05', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'solid_waste' },
                { name: '废水', value: '35', unit: 'm³', factor: '0.296', factorUnit: 'kgCO₂e/m³', flowType: 'elementary', listType: 'wastewater' }
              ]
            },
            {
              name: '总装工序',
              allocation: 'mass',
              inputs: [
                { name: '市电', value: '1200', unit: 'kWh', factor: '0.581', factorUnit: 'kgCO₂e/kWh', flowType: 'elementary', listType: 'energy' },
                { name: '光伏电', value: '80', unit: 'kWh', factor: '0.048', factorUnit: 'kgCO₂e/kWh', flowType: 'elementary', listType: 'energy' },
                { name: '水', value: '45', unit: 't', factor: '0.193', factorUnit: 'kgCO₂e/t', flowType: 'elementary', listType: 'resource' },
                { name: '汽车零部件毛坯（来自上游）', value: '1388', unit: 'kg', factor: null, factorUnit: null, flowType: 'product', productSubType: 'main', listType: 'product', fromStage: 'raw_material' }
              ],
              outputs: [
                { name: '燃油乘用车整车', value: '1', unit: '辆', factor: null, factorUnit: null, flowType: 'product', productSubType: 'main', listType: 'main_product', toStage: 'transport' }
              ]
            }
          ]
        },
                {
          key: 'transport',
          title: '运输分销阶段',
          dotClass: 'sd-trans',
          processes: [
            {
              name: '分销',
              allocation: 'mass',
              inputs: [
                { name: '整车出厂物流-国际海运', value: '8000', unit: 't*km', factor: '0.011', factorUnit: 'kgCO₂e/t*km', flowType: 'elementary', listType: 'transport' },
                { name: '市电', value: '120', unit: 'kWh', factor: '0.581', factorUnit: 'kgCO₂e/kWh', flowType: 'elementary', listType: 'energy' },
                { name: '整车出厂物流-国际公路', value: '3200', unit: 't*km', factor: '0.062', factorUnit: 'kgCO₂e/t*km', flowType: 'elementary', listType: 'transport' },
                { name: '整车出厂物流-国内水运', value: '1800', unit: 't*km', factor: '0.024', factorUnit: 'kgCO₂e/t*km', flowType: 'elementary', listType: 'transport' },
                { name: '整车出厂物流-国内公路', value: '1500', unit: 't*km', factor: '0.085', factorUnit: 'kgCO₂e/t*km', flowType: 'elementary', listType: 'transport' },
                { name: '燃油乘用车整车（来自上游）', value: '1', unit: '辆', factor: null, factorUnit: null, flowType: 'product', productSubType: 'main', listType: 'product', fromStage: 'manufacturing' }
              ],
              outputs: [
                { name: '已交付燃油乘用车', value: '1', unit: '辆', factor: null, factorUnit: null, flowType: 'product', productSubType: 'main', listType: 'main_product', toStage: 'use' }
              ]
            }
          ]
        },
                {
          key: 'use',
          title: '产品使用阶段',
          dotClass: 'sd-use',
          processes: [
            {
              name: '使用环节',
              allocation: 'mass',
              inputs: [
                { name: '汽油使用', value: '12000', unit: 'L', factor: '2.31', factorUnit: 'kgCO₂e/L', flowType: 'elementary', listType: 'energy' },
                { name: '汽油生产', value: '8640', unit: 'kg', factor: '0.45', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'energy' },
                { name: '轮胎-橡胶', value: '40', unit: 'kg', factor: '2.95', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'consumable' },
                { name: '润滑剂', value: '15', unit: 'kg', factor: '1.85', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'consumable' },
                { name: '铅酸蓄电池', value: '18', unit: 'kg', factor: '2.12', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'consumable' },
                { name: '轮胎-钢/铸钢/烧结钢', value: '12', unit: 'kg', factor: '2.31', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'consumable' },
                { name: '机油滤清器（钢）', value: '8', unit: 'kg', factor: '2.45', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'consumable' },
                { name: '冷却液', value: '10', unit: 'kg', factor: '1.52', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'consumable' },
                { name: '轮胎-织物（纤维、纱线、织物和针织物等）', value: '5', unit: 'kg', factor: '3.85', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'consumable' },
                { name: '洗涤液,电池酸液', value: '6', unit: 'kg', factor: '1.25', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'consumable' },
                { name: '传动皮带（橡胶）', value: '4', unit: 'kg', factor: '2.95', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'consumable' },
                { name: '已交付燃油乘用车（来自上游）', value: '1', unit: '辆', factor: null, factorUnit: null, flowType: 'product', productSubType: 'main', listType: 'product', fromStage: 'transport' }
              ],
              outputs: [
                { name: '废机油滤清器', value: '8', unit: 'kg', factor: '0.85', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'solid_waste' },
                { name: '废铅酸蓄电池', value: '18', unit: 'kg', factor: '0.65', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'solid_waste' },
                { name: '退役燃油乘用车', value: '1', unit: '辆', factor: null, factorUnit: null, flowType: 'product', productSubType: 'main', listType: 'main_product', toStage: 'recycle' }
              ]
            }
          ]
        }
        ,
                {
          key: 'recycle',
          title: '报废回收阶段',
          dotClass: 'sd-recycle',
          processes: [
            {
              name: '拆解报废',
              allocation: 'mass',
              inputs: [
                { name: '市电', value: '850', unit: 'kWh', factor: '0.581', factorUnit: 'kgCO₂e/kWh', flowType: 'elementary', listType: 'energy' },
                { name: '柴油使用', value: '1800', unit: 'MJ', factor: '0.072', factorUnit: 'kgCO₂e/MJ', flowType: 'elementary', listType: 'energy' },
                { name: '柴油生产', value: '52', unit: 'kg', factor: '0.62', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'energy' },
                { name: '退役燃油乘用车（来自上游）', value: '1', unit: '辆', factor: null, factorUnit: null, flowType: 'product', productSubType: 'main', listType: 'product', fromStage: 'use' }
              ],
              outputs: [
                { name: '废液处理', value: '25', unit: 'kg', factor: '0.65', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'wastewater' }
              ]
            }
          ]
        }
            ]
    },
    getAllocationLabel(val) {
      const map = { 'mass': '质量分配', 'economic': '经济分配', 'energy': '能源分配' }
      return map[val] || '质量分配'
    },
    onProcAllocationChange(proc) {
      if (proc.allocation && proc.allocation !== 'mass') {
        // 非质量分配，自动生成备注说明原因
        if (!proc.allocationRemark) {
          this.$set(proc, 'allocationRemark', `本过程采用${this.getAllocationLabel(proc.allocation)}，非质量分配`)
        } else {
          // 已有备注，更新规则名称部分
          this.$set(proc, 'allocationRemark', proc.allocationRemark.replace(/本过程采用.*?分配/, `本过程采用${this.getAllocationLabel(proc.allocation)}`))
        }
      } else {
        // 质量分配，清空备注
        this.$set(proc, 'allocationRemark', '')
      }
    },
    buildValidationSummary() {
      const missing = this.validationItems.filter(v => v.status === 'missing')
      const pending = this.validationItems.filter(v => v.status === 'pending')
      const consistency = pending.filter(v => v.type === 'consistency')
      const dqr = pending.filter(v => v.type === 'dqr')
      let msg = `**【阶段六：数据校验】**\n系统已完成完整性、一致性、DQR多重校验，共发现 **${missing.length + pending.length} 项**待处理事项：\n`
      if (missing.length > 0) {
        msg += `\n**❶ 完整性校验 — 缺失数据（${missing.length}项）**\n`
        missing.forEach(item => {
          const suggestVal = item.id === 'val-1' ? '30 kg（供应商实测）' : ''
          msg += `• **【${item.stage}·${item.process}】**\n`
          msg += `  - 关联物料：${item.ioType === 'input' ? '输入' : '输出'}流「${item.ioName}」\n`
          msg += `  - 问题描述：${item.label}\n`
          msg += `  - 建议值：${suggestVal}\n`
          msg += `  - 建议上传：${item.supplementHint}\n`
        })
      }
      if (consistency.length > 0) {
        msg += `\n**❷ 一致性校验 — 单位换算/口径核查（${consistency.length}项）**\n`
        consistency.forEach(item => {
          msg += `• **【${item.stage}·${item.process}】**\n`
          msg += `  - 关联物料：${item.ioType === 'input' ? '输入' : '输出'}流「${item.ioName}」\n`
          msg += `  - 问题描述：${item.label}\n`
          msg += `  - 建议值：${item.value} ${item.unit}\n`
          msg += `  - 建议核查：${item.supplementHint}\n`
        })
      }
      if (dqr.length > 0) {
        msg += `\n**❸ DQR数据质量校验 — 因子地理代表性（${dqr.length}项）**\n`
        dqr.forEach(item => {
          msg += `• **【${item.stage}·${item.process}】**\n`
          msg += `  - 关联物料：${item.ioType === 'input' ? '输入' : '输出'}流「${item.ioName}」\n`
          msg += `  - 问题描述：${item.label}\n`
          msg += `  - 建议评分：${item.value} ${item.unit}\n`
          msg += `  - 建议补充：${item.supplementHint}\n`
        })
      }
      msg += `\n---\n**📌 处理方式：**\n* 点击「全部使用建议值确认」可一次性处理所有事项\n* 也可在右侧面板逐项点击处理，或上传补充材料文件自动填充\n* 选择「暂不处理，直接计算」可跳过缺失项（可能影响核算精度）`
      return msg
    },
    getListTypeLabel(val) {
      const all = [...this.inputTypeOptions, ...this.outputTypeOptions]
      const opt = all.find(o => o.value === val)
      return opt ? opt.label : ''
    },
    getListTypeColor(val) {
      const all = [...this.inputTypeOptions, ...this.outputTypeOptions]
      const opt = all.find(o => o.value === val)
      return opt ? opt.color : '#909399'
    },
    onBoundaryEdit(field) {
      // 更新取舍规则汇总值
      if (field === 'cutoffItemThreshold' || field === 'cutoffTotalThreshold') {
        this.boundaryConfig.cutoffThreshold = this.boundaryConfig.cutoffItemThreshold + '/' + this.boundaryConfig.cutoffTotalThreshold
      }
    },
    onDateRangeChange(val) {
      if (val && val.length === 2) {
        this.boundaryConfig.timeBoundary = val[0] + ' - ' + val[1]
      } else {
        this.boundaryConfig.timeBoundary = ''
      }
    },
    // ===== 模型结构校验 =====
    validateModel() {
      const issues = []
      this.modelStages.forEach(stage => {
        // 0. 阶段不能没有单元过程
        if (!stage.processes || stage.processes.length === 0) {
          issues.push(`【${stage.title}】尚未录入任何单元过程，请先上传材料或手动添加`)
          return
        }
        // 阶段内过程名称查重
        const procNames = {}
        stage.processes.forEach((proc, pi) => {
          // 1. 过程名称不能为空
          if (!proc.name || !proc.name.trim()) {
            issues.push(`【${stage.title}】第${pi + 1}个单元过程名称为空`)
          }
          // 2. 过程名称查重
          const nm = proc.name ? proc.name.trim() : ''
          if (nm) {
            if (procNames[nm]) {
              issues.push(`【${stage.title}】单元过程「${nm}」名称重复`)
            }
            procNames[nm] = true
          }
          // 3. 每个过程至少1个输入和1个输出
          if (!proc.inputs || proc.inputs.length === 0) {
            issues.push(`【${stage.title}·${nm || '未命名'}】缺少输入流，至少需要1个`)
          }
          if (!proc.outputs || proc.outputs.length === 0) {
            issues.push(`【${stage.title}·${nm || '未命名'}】缺少输出流，至少需要1个`)
          }
          // 4. 输入流名称检查
          const inNames = {}
          ;(proc.inputs || []).forEach(inp => {
            if (!inp.name || !inp.name.trim()) {
              issues.push(`【${stage.title}·${nm || '未命名'}】存在未命名的输入流`)
            } else if (inNames[inp.name.trim()]) {
              issues.push(`【${stage.title}·${nm}】输入流「${inp.name}」名称重复`)
            } else {
              inNames[inp.name.trim()] = true
            }
          })
          // 5. 输出流名称检查
          const outNames = {}
          ;(proc.outputs || []).forEach(out => {
            if (!out.name || !out.name.trim()) {
              issues.push(`【${stage.title}·${nm || '未命名'}】存在未命名的输出流`)
            } else if (outNames[out.name.trim()]) {
              issues.push(`【${stage.title}·${nm}】输出流「${out.name}」名称重复`)
            } else {
              outNames[out.name.trim()] = true
            }
          })
        })
      })
      // 6. 生产制造阶段建议包含电力输入
      const manuStage = this.modelStages.find(s => s.key === 'manufacturing')
      if (manuStage) {
        const hasElectricity = manuStage.processes.some(p =>
          p.inputs && p.inputs.some(i => i.name && (i.name.includes('电') || i.name.includes('能')))
        )
        if (!hasElectricity) {
          issues.push(`【${manuStage.title}】建议为制造过程添加「电力」或「能源」输入流`)
        }
      }
      return issues
    },
  },
  mounted() {
    // 加载用户偏好
    this.loadUserPreferences()
    // 从第二层跳转过来时，直接进入九阶段（跳过初始化对话）
    if (this.$route.query.direct === 'true') {
      this.startDirectNineStage()
      return
    }
    if (this.pageMode === 'task-active') {
      this.initChatFlow()
      this.scrollToBottom()
    }
  },
  watch: {
    // 同一页面内 query 变化（工作台再次带 direct/taskId 进入）时同步当前任务，避免重复建任务
    '$route.query': {
      handler(nv, ov) {
        if (!nv || nv.direct !== 'true') return
        if (this.__directEntering) return
        this.__directEntering = true
        this.$nextTick(() => {
          this.__directEntering = false
          this.startDirectNineStage()
        })
      }
    }
  },
  updated() {
    // 防止无限循环：仅在阶段/Tab变化时初始化图表，不重复初始化已存在的图表实例
    if (this.currentStepIndex === 8 && !this._reportChartsInitDone) {
      this._reportChartsInitDone = true
      this.$nextTick(() => {
        this.initReportCharts()
      })
    }
    if (this.currentStepIndex === 7 && this.analysisActiveTab === 'uncertainty' && !this._analysisChartsInitDone) {
      this._analysisChartsInitDone = true
      this.$nextTick(() => {
        this.initAnalysisCharts()
      })
    }
  },
  beforeDestroy() {
    this.destroyReportCharts()
    this.destroyAnalysisCharts()
  }
}
