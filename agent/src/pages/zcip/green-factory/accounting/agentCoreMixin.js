/**
 * 绿色工厂辅助申报智能体 - 核心 Mixin
 *
 * 负责：5阶段数据、任务管理、localStorage持久化、阶段切换
 */

const STORAGE_KEY = 'zcf_task_list'


// ===== 标准库（指标体系来源）=====
const STANDARD_LIBRARY = {
  'GB/T 36132-2025': {
    name: '绿色工厂评价通则',
    version: '2025',
    // 等级划分：GB/T 36132-2025 标准原文未规定分数等级，故不配置（界面不显示分级）
    // 如地方/行业细则另有分档要求，在此配置，例如：
    // evaluationLevels: [
    //   { min: 85, name: '优秀', color: '#52c41a', desc: '达到推荐水平' },
    //   { min: 70, name: '良好', color: '#0067FE', desc: '达到基本水平' },
    //   { min: 60, name: '合格', color: '#faad14', desc: '基本达标' },
    //   { min: 0,  name: '不合格', color: '#f56c6c', desc: '需重点改进' }
    // ],
    evaluationLevels: [],
    categories: [
      { name: '能源低碳化', weight: 30 },
      { name: '资源高效化', weight: 30 },
      { name: '生产洁净化', weight: 16 },
      { name: '产品绿色化', weight: 16 },
      { name: '用地集约化', weight: 8 }
    ],
    indicators: [
      { no: '1', name: '能源消耗强度', category: '能源低碳化', formulaId: 'F-ENERGY-INTENSITY', indicatorType: '逆向定量', weight: 8,
        leading: '行业先进水平或能耗限额1级', baseline: '行业平均水平或能耗限额2级',
        leadingSource: '《汽车整车制造业单位产品能源消耗限额》DB11/T 1080-2023（1级/2级）（演示数据，实际来自标准配置文件）',
        rule: '与行业先进水平或能耗限额1级对标赋分' },
      { no: '2', name: '碳排放强度', category: '能源低碳化', formulaId: 'F-CARBON-INTENSITY', indicatorType: '逆向定量', weight: 8,
        leading: '行业先进水平', baseline: '行业平均水平',
        leadingSource: '汽车行业碳排放强度先进值（行业协会统计年报）（演示数据，实际来自标准配置文件）',
        rule: '与行业先进水平对标赋分' },
      { no: '3', name: '可再生能源利用率', category: '能源低碳化', formulaId: 'F-RENEWABLE-RATE', indicatorType: '正向定量', weight: 8,
        leading: '行业先进水平', baseline: '行业平均水平',
        leadingSource: '绿色工厂评价细则·行业先进水平（演示数据，实际来自标准配置文件）',
        rule: '与行业先进水平对标赋分' },
      { no: '4', name: '能碳管理系统平台功能符合数量', category: '能源低碳化', formulaId: 'F-PLATFORM-COUNT', indicatorType: '正向定量', weight: 6,
        leading: '8', baseline: '0',
        leadingSource: 'GB/T 36132-2025 附录B（8 项业务功能）（演示数据，实际来自标准配置文件）',
        rule: '建成运行并按符合的业务功能数量赋分（共 12 项）' },
      { no: '5', name: '原材料消耗强度', category: '资源高效化', formulaId: 'F-MATERIAL-INTENSITY', indicatorType: '逆向定量', weight: 8,
        leading: '行业先进水平', baseline: '行业平均水平',
        leadingSource: '汽车行业原材料消耗先进值（行业协会统计）（演示数据，实际来自标准配置文件）',
        rule: '与行业先进水平对标赋分' },
      { no: '6', name: '取水强度', category: '资源高效化', formulaId: 'F-WATER-INTENSITY', indicatorType: '逆向定量', weight: 8,
        leading: '工业用水定额先进值', baseline: '工业用水定额通用值',
        leadingSource: '《汽车制造业用水定额》地方标准（先进值/通用值）（演示数据，实际来自标准配置文件）',
        rule: '与工业用水定额先进值对标赋分' },
      { no: '7', name: '工业用水重复利用率', category: '资源高效化', formulaId: 'F-WATER-REUSE', indicatorType: '正向定量', weight: 8,
        leading: '行业先进水平', baseline: '行业平均水平',
        leadingSource: '绿色工厂评价细则·行业先进水平（演示数据，实际来自标准配置文件）',
        rule: '与行业先进水平对标赋分' },
      { no: '8', name: '一般工业固体废物综合利用率', category: '资源高效化', formulaId: 'F-SOLID-WASTE', indicatorType: '正向定量', weight: 6,
        leading: '行业先进水平', baseline: '行业平均水平',
        leadingSource: '绿色工厂评价细则·行业先进水平（演示数据，实际来自标准配置文件）',
        rule: '与行业先进水平对标赋分' },
      { no: '9', name: '生产工艺和设备先进性', category: '生产洁净化', formulaId: 'F-PROCESS-ADVANCED', indicatorType: '正向定性', weight: 6,
        leading: '采用先进适用技术和设备', baseline: '—',
        leadingSource: '《国家工业节能技术装备推荐目录》（演示数据，实际来自标准配置文件）',
        rule: '提供证明并依据国家推荐目录、行业规范条件符合情况赋分' },
      { no: '10', name: '绿色低碳改造升级项目投资额占比', category: '生产洁净化', formulaId: 'F-INVEST-RATIO', indicatorType: '正向定量', weight: 4,
        leading: '行业先进水平', baseline: '行业平均水平',
        leadingSource: '绿色工厂评价细则·行业先进水平（演示数据，实际来自标准配置文件）',
        rule: '近3年投资额占3年总产值比例与行业先进水平对标赋分' },
      { no: '11', name: '主要污染物产生或排放强度', category: '生产洁净化', formulaId: 'F-POLLUTANT-INTENSITY', indicatorType: '逆向定量', weight: 6,
        leading: '行业先进水平', baseline: '行业平均水平',
        leadingSource: '《汽车整车制造业大气污染物排放标准》DB11/ 1228（演示数据，实际来自标准配置文件）',
        rule: '与行业先进水平对标赋分' },
      { no: '12', name: '绿色设计', category: '产品绿色化', formulaId: 'F-GREEN-DESIGN', indicatorType: '正向定性', weight: 8,
        leading: '开展产品绿色设计', baseline: '—',
        leadingSource: 'GB/T 24256 产品绿色设计（演示数据，实际来自标准配置文件）',
        rule: '依据 GB/T 24256 提供报告，说明环境因素识别与引入设计情况' },
      { no: '13', name: '产品碳足迹', category: '产品绿色化', formulaId: 'F-CARBON-FOOTPRINT', indicatorType: '正向定性', weight: 8,
        leading: '开展产品碳足迹量化', baseline: '—',
        leadingSource: 'GB/T 24067 产品碳足迹（演示数据，实际来自标准配置文件）',
        rule: '依据 GB/T 24067 提供报告，按 GB/T 4754 产品分类归类赋分' },
      { no: '14', name: '土地产出率', category: '用地集约化', formulaId: 'F-LAND-OUTPUT', indicatorType: '正向定量', weight: 8,
        leading: '行业先进水平', baseline: '行业平均水平',
        leadingSource: '地方工业用地控制指标（产出强度）（演示数据，实际来自标准配置文件）',
        rule: '与行业或地方先进水平对标赋分' }
    ]
  }
}

// ===== 核算公式库（计算公式来源）=====
const FORMULA_LIBRARY = {
  'F-ENERGY-INTENSITY': {
    name: '能源消耗强度',
    expression: 'E / P',
    variables: [
      { symbol: 'E', name: '综合能耗', unit: 'tce', type: 'energy' },
      { symbol: 'P', name: '产品产量', unit: '辆', type: 'product_output',
        alt: { name: '工业总产值', unit: '万元', type: 'output_value' } }
    ],
    resultUnit: 'tce/辆',
    altResultUnit: 'tce/万元',
    refs: ['GB/T 2589']
  },
  'F-CARBON-INTENSITY': {
    name: '碳排放强度',
    expression: 'Σ(Ai × Fi) / P',
    variables: [
      { symbol: 'Ai', name: '碳排放量', unit: 'tCO₂', type: 'emission' },
      { symbol: 'P', name: '产品产量', unit: '辆', type: 'product_output',
        alt: { name: '工业总产值', unit: '万元', type: 'output_value' } }
    ],
    resultUnit: 'tCO₂/辆',
    altResultUnit: 'tCO₂/万元',
    refs: ['GB/T 32150']
  },
  'F-RENEWABLE-RATE': {
    name: '可再生能源利用率',
    expression: 'Ere / E × 100%',
    variables: [
      { symbol: 'Ere', name: '可再生能源消耗量', unit: 'tce', type: 'renewable' },
      { symbol: 'E', name: '综合能耗', unit: 'tce', type: 'energy' }
    ],
    resultUnit: '%',
    refs: ['GB/T 36132-2025 附录B.5']
  },
  'F-PLATFORM-COUNT': {
    name: '能碳管理系统平台功能符合数量',
    expression: 'COUNT(符合项)',
    variables: [
      { symbol: 'F', name: '功能符合项', unit: '项', type: 'checklist' }
    ],
    resultUnit: '项',
    refs: ['GB/T 36132-2025 表C.1']
  },
  'F-MATERIAL-INTENSITY': {
    name: '原材料消耗强度',
    expression: 'M / P',
    variables: [
      { symbol: 'M', name: '原材料消耗量', unit: 't', type: 'material' },
      { symbol: 'P', name: '产品产量', unit: '辆', type: 'product_output',
        alt: { name: '工业总产值', unit: '万元', type: 'output_value' } }
    ],
    resultUnit: 't/辆',
    altResultUnit: 't/万元',
    refs: ['GB/T 36132-2025 附录B.6']
  },
  'F-WATER-INTENSITY': {
    name: '取水强度',
    expression: 'W / P',
    variables: [
      { symbol: 'W', name: '取水量', unit: 'm³', type: 'water' },
      { symbol: 'P', name: '产品产量', unit: '辆', type: 'product_output',
        alt: { name: '工业总产值', unit: '万元', type: 'output_value' } }
    ],
    resultUnit: 'm³/辆',
    altResultUnit: 'm³/万元',
    refs: ['GB/T 36132-2025 附录B.8']
  },
  'F-WATER-REUSE': {
    name: '工业用水重复利用率',
    expression: 'Vr / (Vr + V) × 100%',
    variables: [
      { symbol: 'Vr', name: '重复利用水量', unit: 'm³', type: 'water_reuse' },
      { symbol: 'V', name: '取水量', unit: 'm³', type: 'water' }
    ],
    resultUnit: '%',
    refs: ['GB/T 36132-2025 附录B.10']
  },
  'F-SOLID-WASTE': {
    name: '一般工业固体废物综合利用率',
    expression: 'Zr / (Z + Zw) × 100%',
    variables: [
      { symbol: 'Zr', name: '综合利用量', unit: 't', type: 'waste_reuse' },
      { symbol: 'Z', name: '产生量', unit: 't', type: 'waste' },
      { symbol: 'Zw', name: '往年贮存量', unit: 't', type: 'waste_stock' }
    ],
    resultUnit: '%',
    refs: ['GB/T 36132-2025 附录B.11']
  },
  'F-PROCESS-ADVANCED': {
    name: '生产工艺和设备先进性',
    expression: '定性判定',
    variables: [
      { symbol: 'T', name: '工艺装备核查', unit: '—', type: 'qualitative' }
    ],
    resultUnit: '—',
    refs: ['GB/T 36132-2025 表C.1']
  },
  'F-INVEST-RATIO': {
    name: '绿色低碳改造升级项目投资额占比',
    expression: 'I / V × 100%',
    variables: [
      { symbol: 'I', name: '近3年改造投资额', unit: '万元', type: 'investment' },
      { symbol: 'V', name: '近3年总产值', unit: '万元', type: 'output_value' }
    ],
    resultUnit: '%',
    refs: ['GB/T 36132-2025 表C.1']
  },
  'F-POLLUTANT-INTENSITY': {
    name: '主要污染物产生或排放强度',
    expression: 'Q / P',
    variables: [
      { symbol: 'Q', name: '污染物产生量', unit: 'kg', type: 'pollutant' },
      { symbol: 'P', name: '产品产量', unit: '辆', type: 'product_output',
        alt: { name: '工业总产值', unit: '万元', type: 'output_value' } }
    ],
    resultUnit: 'kg/辆',
    altResultUnit: 'kg/万元',
    refs: ['GB/T 36132-2025 表C.1']
  },
  'F-GREEN-DESIGN': {
    name: '绿色设计',
    expression: '定性判定',
    variables: [
      { symbol: 'G', name: '绿色设计开展情况', unit: '—', type: 'qualitative' }
    ],
    resultUnit: '—',
    refs: ['GB/T 24256']
  },
  'F-CARBON-FOOTPRINT': {
    name: '产品碳足迹',
    expression: '定性判定',
    variables: [
      { symbol: 'P', name: '碳足迹量化情况', unit: '—', type: 'qualitative' }
    ],
    resultUnit: '—',
    refs: ['GB/T 24067']
  },
  'F-LAND-OUTPUT': {
    name: '土地产出率',
    expression: 'V / S',
    variables: [
      { symbol: 'V', name: '工业总产值', unit: '万元', type: 'output_value' },
      { symbol: 'S', name: '用地面积', unit: 'm²', type: 'land' }
    ],
    resultUnit: '万元/m²',
    refs: ['GB/T 36132-2025 表C.1']
  }
}

// ===== 因子库（折标系数 / 排放因子 / 产污系数）=====
const FACTOR_LIBRARY = {
  'electricity_grid_tce': { name: '外购电力（折标）', value: '2.856', unit: 'tce/万kWh', category: 'energy', ref: 'GB/T 2589' },
  'electricity_grid_co2': { name: '外购电力（排放）', value: '5.366', unit: 'tCO₂/万kWh', category: 'carbon', ref: '全国电网平均' },
  'natural_gas_tce': { name: '天然气（折标）', value: '12.29', unit: 'tce/万m³', category: 'energy', ref: 'GB/T 2589' },
  'natural_gas_co2': { name: '天然气（排放）', value: '21.622', unit: 'tCO₂/万m³', category: 'carbon', ref: 'IPCC 缺省值' },
  'diesel_tce': { name: '柴油（折标）', value: '1.4571', unit: 'tce/t', category: 'energy', ref: 'GB/T 2589' },
  'diesel_co2': { name: '柴油（排放）', value: '3.096', unit: 'tCO₂/t', category: 'carbon', ref: 'IPCC 缺省值' }
}


export default {
  data() {
    return {
      // ===== 主题色 =====
      themeColor: '#0067FE',
      themeColorLight: 'rgba(0,103,254,0.08)',

      // ===== 阶段1 指标体系卡（可收缩，默认收起） =====
      indicatorSysExpanded: false,
      companyInfoExpanded: false, // 阶段1 企业信息默认收缩
      intensityBasis: 'product', // 强度指标口径：product（产品单位）/ output（产值）
      products: [
        { name: 'SU7', unit: '辆', metered: true, auto: true },
        { name: 'YU7', unit: '辆', metered: false, auto: true },
        { name: 'YU8', unit: '辆', metered: false, auto: true }
      ],
      qualificationExpanded: false, // 申报资格默认收缩
      collectExpanded: {},         // 阶段2 指标分组展开状态
      categoryExpanded: {},       // 一级指标分组展开状态
      currentCollectIndicator: -1, // 当前聚焦指标
      currentCollectParam: '',     // 当前聚焦参数
    currentEvalIndicator: '',    // 当前聚焦的核算指标（阶段3）
      collectFocusIdx: 0,          // 下一项定位游标
      // ===== 阶段4 核算明细区（整体收缩，默认收起——核心看点是指标结果与评价） =====
      accDetailExpanded: false,
      // ===== 阶段6 证据链明细（整体收缩，默认收起——总览统计已并入标题） =====
      evidenceChainExpanded: false,

      // ===== 页面模式 =====
      pageMode: 'task-list', // 'task-list' | 'task-active'

      // ===== 输入与对话 =====
      inputText: '',
      tlInputText: '',
      isTyping: false,

      // ===== 快捷指令面板 =====
      showCmdPanel: false,

      // ===== 5 阶段定义 =====
      phases: [
        { key: 'STANDARD_ADAPT', name: '标准规则适配', icon: 'el-icon-reading', desc: '加载标准·信息带出·资格核验·材料匹配', libraries: ['政策标准库', '组织资源库', '佐证材料库'] },
        { key: 'DATA_COLLECTION', name: '数据收集与校验', icon: 'el-icon-s-data', desc: '活动数据收集·因子匹配·质量校验', libraries: ['统一数据底座', '排放因子库', '佐证材料库'] },
        { key: 'EVALUATION', name: '指标核算与评价', icon: 'el-icon-cpu', desc: '核算·核心指标评价', libraries: ['政策标准库', '核算公式库'] },
        { key: 'MATERIAL_REPORT', name: '数据溯源与材料归档', icon: 'el-icon-document', desc: '证据链·材料目录·归档下载', libraries: ['佐证材料库', '报告与档案中心'] }
      ],

      // ===== 当前任务 =====
      currentStepIndex: 0,
      maxStepIndex: 0, // 当前任务最高到达阶段（回看保护：currentStepIndex < maxStepIndex 时为回看模式，隐藏确认栏）
      currentTaskId: null,
      currentFactoryName: '',

      // ===== 任务列表 =====
      taskList: [],

      // ===== 历史对话 =====
      showHistorySidebar: false,
      conversationHistory: [],
      currentConversationId: null,

      // ===== 新手引导 =====
      showOnboarding: false,
      onboardingStep: 0,
      onboardingSteps: [
        {
          icon: 'el-icon-s-home',
          title: '欢迎使用绿色工厂辅助申报智能体',
          text: '这里是绿色工厂辅助申报工作空间。基于绿色工厂评价标准，为您提供4阶段智能申报辅助服务，涵盖标准适配、数据收集、核算评价、数据溯源与归档全流程。',
          features: [
            { icon: 'el-icon-reading', title: '4阶段流程', desc: '标准适配→数据收集→核算评价→溯源归档', color: '#0067FE' },
            { icon: 'el-icon-s-data', title: '五化指标', desc: '能源低碳化·资源高效化·生产洁净化·产品绿色化·用地集约化', color: '#0067FE' },
            { icon: 'el-icon-share', title: '9个基础库', desc: '标准/资源/模板/底座/因子/公式/大纲模板/材料/建设方案全支撑', color: '#ED7B2F' }
          ],
          tip: '首次使用建议依次浏览全部引导内容，约需1分钟。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-chat-dot-round',
          title: '智能对话区',
          text: '页面中间为对话区，直接向小易提问或下达指令。输入企业名称即可开始申报，小易会引导您完成4阶段流程。',
          features: [
            { icon: 'el-icon-video-play', title: '快速开始', desc: '输入企业名称即可创建申报项目', color: '#0067FE' },
            { icon: 'el-icon-magic-stick', title: '智能问答', desc: '「指标分类」「基础库」「溯源链」即问即答', color: '#0067FE' },
            { icon: 'el-icon-s-opportunity', title: '快捷指令', desc: '点击灯泡图标呼出常用指令面板', color: '#ED7B2F' }
          ],
          tip: '试试输入"小米汽车"开始一个申报项目。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-chat-line-square',
          title: '历史对话栏',
          text: '页面左侧为历史对话栏（默认收缩），点击可展开查看历史对话记录，支持切换和删除对话。',
          features: [
            { icon: 'el-icon-folder-opened', title: '对话记录', desc: '自动保存每次对话，按时间倒序排列', color: '#0067FE' },
            { icon: 'el-icon-switch-button', title: '快速切换', desc: '点击历史对话即可恢复上下文', color: '#0067FE' },
            { icon: 'el-icon-d-arrow-left', title: '可收缩', desc: '点击边条可展开/收缩历史栏', color: '#909399' }
          ],
          tip: '默认收缩为窄条，点击展开后宽度200px。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-folder-opened',
          title: '申报项目列表',
          text: '页面右侧为申报项目列表，展示所有已创建的绿色工厂申报项目。点击项目卡片即可进入6阶段申报辅助流程。',
          features: [
            { icon: 'el-icon-aim', title: '进度跟踪', desc: '实时显示每个项目的当前阶段和进度', color: '#0067FE' },
            { icon: 'el-icon-right', title: '一键进入', desc: '点击卡片即可继续推进申报流程', color: '#0067FE' },
            { icon: 'el-icon-delete', title: '项目管理', desc: '支持删除已完成的申报项目', color: '#F56C6C' }
          ],
          tip: '进入项目后，右侧将切换为6阶段任务进度面板。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-set-up',
          title: '6阶段任务进度',
          text: '进入具体申报项目后，右侧展示6阶段任务进度面板。每个阶段显示当前状态（进行中/已完成）、进度条和关联基础库。输入"下一步"即可推进流程。',
          features: [
            { icon: 'el-icon-reading', title: '阶段1·标准适配', desc: '加载标准·信息带出·资格核验·材料匹配', color: '#0067FE' },
            { icon: 'el-icon-s-data', title: '阶段2·数据收集', desc: '活动数据收集·因子匹配·质量校验', color: '#0067FE' },
            { icon: 'el-icon-document', title: '阶段4·数据溯源与材料归档', desc: '证据链·材料目录·归档下载', color: '#ED7B2F' }
          ],
          tip: '点击已完成阶段可回看，输入"查看进度"查询当前状态。',
          iconStyle: {}
        }
      ],

      // ===== 9 个基础库 =====
      libraries: [
        { name: '政策标准库', stages: [0, 1, 3], icon: 'el-icon-reading', desc: '标准/条款/指标体系/核心指标两级要求' },
        { name: '组织资源库', stages: [0, 1], icon: 'el-icon-s-grid', desc: '企业基本信息·排放源/用能设备' },
        { name: '组织模板库', stages: [1], icon: 'el-icon-files', desc: '已确认核算模型，可引用微调' },
        { name: '统一数据底座', stages: [2], icon: 'el-icon-s-data', desc: '自动采集活动数据（外部模块提供，不在本平台建设范围）' },
        { name: '排放因子库', stages: [2], icon: 'el-icon-connection', desc: '因子匹配' },
        { name: '核算公式库', stages: [3], icon: 'el-icon-cpu', desc: '参数管理·公式管理' },
        { name: '申报模板库', stages: [5], icon: 'el-icon-document', desc: '绿色工厂评价指标自评表模板·证明材料目录模板' },
        { name: '佐证材料库', stages: [0, 2, 5], icon: 'el-icon-folder-opened', desc: '原始支撑材料·资格证明/凭证/检测报告/证书' },
        { name: '报告与档案中心', stages: [5], icon: 'el-icon-tickets', desc: '评价报告定稿归档（评价报告+证明材料目录），供查阅/导出/专家评审' }
      ],

      // ===== 申报场景模式（改善中 / 已达标巩固提升，方案附件2填写说明三 + ZCF8） =====
      scenarioMode: 'improve', // 'improve' | 'consolidate'
      // 改善中场景的初始快照（首次切换到巩固提升前保存，便于恢复）
      improveScenario: null,
      // 巩固提升场景数据（核心指标已全部达到目标要求的企业）
      consolidateScenario: {
        goals: {
          startYear: 2026,
          endYear: 2028,
          basis: '推荐依据：核心指标已达目标要求，按巩固提升要求设定（政策填写说明三）；非核心指标由企业自主设定建设目标（AI推荐参考值）；建设期不晚于2030年（通知二（三））；年度目标保持并持续改善，期满不低于当前达标水平',
          rows: [
            { name: '容积率', core: true, unit: '/', current: '1.35', finalTarget: '≥1.5', finalGoal: '1.50', mids: ['1.40', '1.45'] },
            { name: '单位用地面积产值', core: true, unit: '万元/亩', current: '520', finalTarget: '≥500', finalGoal: '560', mids: ['535', '548'] },
            { name: '建筑密度', core: false, unit: '%', current: '42', finalTarget: '≥40', finalGoal: '43', mids: ['42.5', '43'] },
            { name: '绿色物料使用率', core: true, unit: '%', current: '68', finalTarget: '≥80', finalGoal: '82', mids: ['73', '78'] },
            { name: '有毒有害物质替代率', core: false, unit: '%', current: '85', finalTarget: '≥95', finalGoal: '92', mids: ['88', '90'] },
            { name: '可回收材料使用率', core: false, unit: '%', current: '52', finalTarget: '≥60', finalGoal: '58', mids: ['54', '56'] },
            { name: '单位产品污染物产生量', core: true, unit: 'kg/件', current: '0.82', finalTarget: '≤0.8', finalGoal: '0.78', mids: ['0.80', '0.79'] },
            { name: '清洁生产审核', core: false, unit: '/', current: '已通过', finalTarget: '通过', finalGoal: '保持', mids: ['保持', '保持'] },
            { name: '工艺装备水平', core: false, unit: '/', current: '国内先进', finalTarget: '国际先进', finalGoal: '国际先进', mids: ['国内先进', '国内先进'] },
            { name: '一般固废综合利用率', core: true, unit: '%', current: '92', finalTarget: '≥95', finalGoal: '96', mids: ['93', '95'] },
            { name: '工业用水重复利用率', core: false, unit: '%', current: '88', finalTarget: '≥90', finalGoal: '91', mids: ['89', '90'] },
            { name: '余热余压利用', core: false, unit: '项', integer: true, current: '3', finalTarget: '—', finalGoal: '5', mids: ['4', '5'] },
            { name: '单位产品综合能耗', core: true, unit: 'tce/件', current: '0.086', finalTarget: '≤0.09', finalGoal: '0.085', mids: ['0.087', '0.086'] },
            { name: '可再生能源使用率', core: true, unit: '%', current: '28', finalTarget: '≥40', finalGoal: '42', mids: ['33', '38'] },
            { name: '碳排放强度', core: true, unit: 'tCO₂/万元', current: '1.32', finalTarget: '≤1.0', finalGoal: '0.95', mids: ['1.15', '1.05'] },
            { name: '能源管理体系', core: false, unit: '/', current: '已认证', finalTarget: '认证', finalGoal: '保持', mids: ['保持', '保持'] }
          ]
        },
        gaps: [],
        measures: [
          { name: '扩大分布式光伏建设规模', direction: '新能源建设', reason: '巩固非化石能源消费占比，规避能源结构波动回退风险', calcType: 'power',
            params: [{ key: 'capacity', label: '装机容量', unit: 'MWp', value: 6.5 }, { key: 'hours', label: '年等效利用小时数', unit: 'h', value: 1100 }], factor: { label: '电网排放因子', value: 0.581, unit: 'tCO₂/MWh' }, targetIndicator: '非化石能源消费占比' },
          { name: '扩大绿电直连规模', direction: '绿电购买', reason: '通过绿电直连稳定绿电供应，巩固非化石能源消费占比', calcType: 'energy',
            params: [{ key: 'energy', label: '绿电电量', unit: '万kWh', value: 1800 }], factor: { label: '电网排放因子', value: 0.581, unit: 'tCO₂/MWh' }, targetIndicator: '非化石能源消费占比' },
          { name: '余能回收利用', direction: '余能利用', reason: '回收工艺余热余压用于厂区供暖、工艺预热或发电，提升系统整体能效',

            subTypeOptions: [

              { value: 'heat', label: '余热回收（供热）', calcType: 'heat', unit: 'GJ', defaultValue: 12000, factor: { label: '热力排放因子', value: 0.11, unit: 'tCO₂/GJ' } },

              { value: 'power', label: '余压发电', calcType: 'energy', unit: '万kWh', defaultValue: 800, factor: { label: '电网排放因子', value: 0.581, unit: 'tCO₂/MWh' } },

              { value: 'gas', label: '可燃废气回收', calcType: 'heat', unit: 'GJ', defaultValue: 9000, factor: { label: '热力排放因子', value: 0.11, unit: 'tCO₂/GJ' } },

              { value: 'cold', label: '余冷回收', calcType: 'heat', unit: 'GJ', defaultValue: 6000, factor: { label: '热力排放因子', value: 0.11, unit: 'tCO₂/GJ' } }

            ],

            recoveries: [

              { subType: 'heat', amount: 12000, factorValue: 0.11 },

              { subType: 'power', amount: 800, factorValue: 0.581 }

            ],

            targetIndicator: '单位能耗碳排放' },
          { name: '高效节能装备替换与能效再提升', direction: '设备升级改造', reason: '以一级能效装备替换老旧设备，巩固单位能耗碳排放水平', calcType: 'energy',
            params: [{ key: 'energy', label: '年节电量', unit: '万kWh', value: 420 }], factor: { label: '电网排放因子', value: 0.581, unit: 'tCO₂/MWh' }, targetIndicator: '单位工业增加值能耗' },
          { name: '绿电绿证与碳信用抵销', direction: '碳抵消', reason: '对难以避免的剩余排放实施抵销，巩固绿色工厂建设成效', calcType: 'offset',
            params: [{ key: 'amount', label: '年抵销量', unit: 'tCO₂e', value: 1800 }], factor: { label: '抵销系数', value: 1, unit: 'tCO₂e/tCO₂e' }, targetIndicator: '单位能耗碳排放' }
        ],
        diagnosis: '核心指标已全部达到目标要求，按巩固提升要求持续改善建设成效（政策填写说明三）'
      },

      // ===== 申报主体类型（方案支持制造型企业 + 零碳算力设施两类，创建任务时确定） =====
      applicantType: 'manufacturing', // 'manufacturing' | 'computing'
      // 评价年度（R040201 衍生设计：被评价的核算年度，创建任务时确定，默认当前年-1）
      baselineYear: new Date().getFullYear() - 1,
      // 新建任务对话框状态（评价年度由申报依据带出，不可选）
      showNewTaskDialog: false,
      newTaskForm: { factoryName: '', planId: 'plan-2025', scene: 'manufacturing', baselineYear: '' },
      currentPlanLabel: '《绿色工厂评价通则》（GB/T 36132-2025）',
      currentPlanId: 'plan-2025',
      // 申报依据版本（来源：政策标准库；依据更新后入库新版本，新建任务时可选新版，评价年度/标准/资格条件整体切换）
      planVersions: [
        {
          id: 'plan-2025',
          label: '《绿色工厂评价通则》（GB/T 36132-2025）',
          baselineYear: '2025',
          standard: '《绿色工厂评价通则》（GB/T 36132-2025）',
          sceneOptions: [{ key: 'manufacturing', label: '制造型企业' }, { key: 'computing', label: '零碳算力设施' }]
        }
      ],

      // ===== 算力设施完整案例数据（绿算智算中心，制造型快照用于恢复） =====
      manufacturingSnapshot: null,
      computingPhaseDetails: {
        0: {
          standard: {
            name: '绿色工厂评价通则（GB/T 36132-2025）',
            code: '附件1（试行）',
            categories: [
              { name: '能源低碳化', count: 4, indicators: '单位产品综合能耗·可再生能源使用率·碳排放强度·能源管理体系' },
              { name: '资源高效化', count: 4, indicators: '一般固废综合利用率·工业用水重复利用率·余热余压利用·资源产出率' },
              { name: '生产洁净化', count: 3, indicators: '单位产品污染物产生量·清洁生产审核·工艺装备水平' },
              { name: '产品绿色化', count: 4, indicators: '绿色设计产品占比·绿色物料使用率·产品可回收利用率·产品碳足迹' },
              { name: '用地集约化', count: 3, indicators: '容积率·单位用地面积产值·建筑密度' }
            ],
            applicability: [
              { name: '非化石能源电力消费物理认定量占比', rule: '算力设施不设定基本要求（仅按目标要求 ≥35% 判定）' },
              { name: '单位工业增加值能耗', rule: '不适用于算力设施' },
              { name: '碳清除率', rule: '仅适用于存在直接排放的单位' }
            ]
          },
          qualification: {
            baseInfo: [
              { label: '单位名称', value: '绿算智算中心（算力设施）', source: '自动带出' },
              { label: '单位地址', value: '贵州省贵安新区算力大道 88 号', source: '自动带出' },
              { label: '所属行业', value: '算力设施', source: '自动带出', type: 'select', options: ['汽车', '锂电池', '光伏', '电子电器', '轻工', '机械', '纺织', '有色金属', '钢铁', '建材', '石化化工', '其他制造业', '算力设施'] },
              { label: '单位性质', value: '国有', source: '自动带出', type: 'select', options: ['国有', '集体', '民营', '中外合资', '港澳台', '外商独资'] },
              { label: '统一社会信用代码', value: '91520100MA0YYYYYYY', source: '自动带出' },
              { label: '法定代表人', value: '王强', source: '自动带出' },
              { label: '申报工作联系部门', value: '基础设施运维部', placeholder: '如：能源管理部', source: '当前用户带入' },
              { label: '联系人', value: '李工', placeholder: '如：李工', source: '当前用户带入' },
              { label: '联系电话', value: '0851-8888-6666', placeholder: '手机/座机', source: '当前用户带入' },
              { label: '电子邮箱', value: 'li.gong@greencompute.cn', placeholder: 'name@company.com', source: '当前用户带入' }
            ],
            autoChecks: [
              { condition: '独立法人资格', blocking: true, current: '是', type: 'yesno', options: ['是', '否'], passValue: '是', source: '组织资源库', proofId: 'pm-license', proofStatus: 'matched' },
              { condition: '算力设施产权清晰 · 物理边界明确完整', blocking: true, current: '是', type: 'yesno', options: ['是', '否'], passValue: '是', source: '组织资源库 · 产权证明', proofId: 'pm-license', proofStatus: 'matched' },
              { condition: '拥有独立供配电和制冷系统', blocking: true, current: '是', type: 'yesno', options: ['是', '否'], passValue: '是', source: '组织资源库 · 设施图纸', proofId: 'pm-ems-shot', proofStatus: 'pending' },
              { condition: '规模 ≥3000 个标准机架（智算中心不适用）', blocking: true, current: 4500, unit: '个', type: 'number', threshold: 3000, source: '组织资源库 · 机架清单', proofId: 'pm-audit', proofStatus: 'matched' },
              { condition: '电能利用效率达 GB 40879 2级及以上', blocking: true, current: 1.25, unit: 'PUE', type: 'number', threshold: 1.3, source: '自动采集 · 电能利用效率', proofId: 'pm-energy-report', proofStatus: 'matched' },
              { condition: '已入选国家绿色算力设施名单', blocking: true, current: '是', type: 'yesno', options: ['是', '否'], passValue: '是', source: '组织资源库', proofId: 'pm-gf-list', proofStatus: 'matched' }
            ],
            manualChecks: [
              { condition: '近三年无较大及以上安全/质量/环境污染事故', current: '无此情况', type: 'yesno', options: ['无此情况', '存在此情况'], passValue: '无此情况', source: '企业填报', policyRef: '《指导意见》二（三）负面清单', checkSource: '信用中国（行政处罚公示）', checkUrl: 'https://www.creditchina.gov.cn/', checkType: 'manual', proofId: 'pm-compliance', proofStatus: 'pending' },
              { condition: '无垄断行为（反垄断法）', current: '无此情况', type: 'yesno', options: ['无此情况', '存在此情况'], passValue: '无此情况', source: '企业填报', policyRef: '《指导意见》二（三）负面清单', checkSource: '市场监管总局（反垄断处罚公示）', checkUrl: 'https://www.samr.gov.cn/', checkType: 'manual', proofId: 'pm-commitment', proofStatus: 'matched' },
              { condition: '未被国务院督查发现严重问题', current: '无此情况', type: 'yesno', options: ['无此情况', '存在此情况'], passValue: '无此情况', source: '企业填报', policyRef: '《指导意见》二（三）负面清单', checkSource: '中国政府网（国务院督查通报）', checkUrl: 'https://www.gov.cn/', checkType: 'manual', proofId: 'pm-commitment', proofStatus: 'matched' },
              { condition: '未列入工业节能监察整改未完成名单', current: '无此情况', type: 'yesno', options: ['无此情况', '存在此情况'], passValue: '无此情况', source: '企业填报', policyRef: '《指导意见》二（三）负面清单', checkSource: '工信部（工业节能监察通报）', checkUrl: 'https://www.miit.gov.cn/', checkType: 'manual', proofId: 'pm-ee-inspect', proofStatus: 'pending' },
              { condition: '未列入电信业务经营不良/失信名单', current: '无此情况', type: 'yesno', options: ['无此情况', '存在此情况'], passValue: '无此情况', source: '企业填报', policyRef: '《指导意见》二（三）负面清单', checkSource: '工信部电信业务综合管理信息系统（不良名单）', checkUrl: 'https://dxzhgl.miit.gov.cn/', checkType: 'manual', proofId: 'pm-telecom', proofStatus: 'pending' },
              { condition: '无较重大以上行政处罚', current: '无此情况', type: 'yesno', options: ['无此情况', '存在此情况'], passValue: '无此情况', source: '企业填报', policyRef: '《指导意见》二（三）负面清单', checkSource: '信用中国 / 国家企业信用信息公示系统', checkUrl: 'https://www.creditchina.gov.cn/', checkType: 'manual', proofId: 'pm-credit-cn', proofStatus: 'pending' },
              { condition: '非失信被执行人', current: '无此情况', type: 'yesno', options: ['无此情况', '存在此情况'], passValue: '无此情况', source: '企业填报', policyRef: '《指导意见》二（三）负面清单', checkSource: '中国执行信息公开网（失信被执行人）', checkUrl: 'http://zxgk.court.gov.cn/', checkType: 'manual', proofId: 'pm-executive', proofStatus: 'pending' },
              { condition: '无权属纠纷生效法律责任认定', current: '无此情况', type: 'yesno', options: ['无此情况', '存在此情况'], passValue: '无此情况', source: '企业填报', policyRef: '《指导意见》二（三）负面清单', checkSource: '中国裁判文书网', checkUrl: 'https://wenshu.court.gov.cn/', checkType: 'manual', proofId: 'pm-commitment', proofStatus: 'matched' }
            ],
            proofPool: {
              'pm-license': { name: '营业执照副本', category: '资质类（长期有效）' },
              'pm-audit': { name: '机架清单 · 产权证明', category: '资质类（长期有效）' },
              'pm-gf-list': { name: '国家绿色算力设施名单公示文件', category: '资质类（长期有效）' },
              'pm-ems-shot': { name: '独立供配电制冷系统图纸', category: '技术文件类' },
              'pm-energy-report': { name: 'PUE 电能利用效率检测报告', category: '期间凭证类（检测年度）' },
              'pm-benchmark': { name: '能效对标测算说明', category: '技术文件类' },
              'pm-compliance': { name: '安全/质量/环保合规证明（2023-2025）', category: '资质类（长期有效）' },
              'pm-commitment': { name: '法定代表人承诺书', category: '资质类（长期有效）' },
              'pm-ee-inspect': { name: '节能监察结果公示查询截图', category: '技术文件类' },
              'pm-telecom': { name: '电信业务经营许可/不适用说明', category: '资质类（长期有效）' },
              'pm-credit-cn': { name: '信用中国行政处罚查询截图' },
              'pm-executive': { name: '中国执行信息公开网查询截图' }
            }
          }
        },
        1: {
          indicatorModels: [
            {
              name: '单位能耗碳排放',
              formula: 'I = C ÷ E₁；C = C购入电 + C备用柴油 − C输出电（算力设施以购入电力为主要排放源）',
              subModules: [
                { symbol: 'C购入电', itemLabel: '排放源', name: '购入电力排放', outputLabel: '排放量', unit: 'tCO₂',
                  sourceOptions: ['电能量交易非化石能源电力', '绿证交易认定电力', '省内非化石能源分摊电力', '其他电网电力'],
                  sources: ['其他电网电力'] },
                { symbol: 'C备用柴油', itemLabel: '排放源', name: '备用柴油发电排放', outputLabel: '排放量', unit: 'tCO₂',
                  sourceOptions: ['备用柴油发电机'],
                  sources: ['备用柴油发电机'] },
                { symbol: 'C输出电', itemLabel: '抵减项', name: '输出电力抵减', outputLabel: '抵减量', unit: 'tCO₂',
                  sourceOptions: ['余热发电上网', '自备电厂上网电量'],
                  sources: [] },
                { symbol: 'E₁', itemLabel: '能源品种', name: 'E₁综合能源消费量', outputLabel: '折标量', unit: 'tce', derived: true,
                  sources: ['外购电力', '光伏自发自用', '绿电直连', '柴油'] }
              ]
            },
            {
              name: '非化石能源消费占比',
              formula: 'r = R ÷ E₂；E非化石能源电力 = E物理 + E电能量 + E绿证 + E分摊（折标 tce）',
              subModules: [
                { symbol: 'E物理', itemLabel: '电力来源', name: '非化石能源电力物理认定量', outputLabel: '认定电量', unit: 'tce',
                  sourceOptions: ['光伏自发自用', '绿电直连', '源网荷储一体化自用'],
                  sources: ['光伏自发自用', '绿电直连'] },
                { symbol: 'E绿证', itemLabel: '电力来源', name: '绿证交易认定量', outputLabel: '认定量', unit: 'tce', derived: true, note: '派生自购入电力排放源 · ≤下网电量50%',
                  sources: [] },
                { symbol: 'E₂', itemLabel: '能源品种', name: 'E₂综合能源消费量', outputLabel: '折标量', unit: 'tce', derived: true, note: '不含原料用能',
                  sources: ['外购电力', '光伏自发自用', '绿电直连', '柴油'] }
              ]
            },
            {
              name: '非化石能源电力消费物理认定量占比',
              formula: 'z = Ez ÷ Q；Ez 不含绿证 / 电能量交易 / 省内分摊',
              subModules: [
                { symbol: 'Ez', itemLabel: '电力来源', name: '非化石能源电力物理认定量', outputLabel: '认定电量', unit: '万kWh', derived: true, note: '同 1.2 E物理',
                  sources: ['光伏自发自用', '绿电直连'] },
                { symbol: 'Q', itemLabel: '购电来源', name: '总用电量', outputLabel: '用电量', unit: '万kWh', derived: true, note: '派生自购入电力排放源 + 物理认定来源',
                  sources: ['其他电网电力', '光伏自发自用', '绿电直连'] }
              ]
            }
          ],
          // 材料识别 · 自动建模（算力设施：电力合同/PUE报告/光伏凭证等）
          materialHints: [
            { name: '电力采购合同（分电源）', cmd: '电力合同', formats: 'PDF', generates: '购入电力排放源 · 购电来源清单', target: 'C购入电 / Q',
              summary: '识别出其他电网电力 1 个购电源', fill: null },
            { name: 'PUE 电能利用效率检测报告', cmd: 'PUE报告', formats: 'PDF', generates: '能效达标情况（GB40879 2级）', target: '资格 · 电能利用效率',
              summary: 'PUE 1.25，达 GB40879 2级', fill: null },
            { name: '光伏 / 绿电直连消纳凭证', cmd: '绿电凭证', formats: 'PDF / Excel', generates: '非化石能源电力物理认定量来源', target: 'E物理 / Ez',
              summary: '识别出光伏自发自用、绿电直连 2 个物理来源', fill: null }
          ]
        },
        2: {
          // 算力设施采集清单（按核算模型分组：指标 → 构成子模块 → 输入项）
          collectModel: [
            {
              indicator: '单位能耗碳排放',
              subs: [
                {
                  symbol: 'C购入电', name: '购入电力排放', itemLabel: '电力来源',
                  rows: [
                    { item: '其他电网电力',
                      data: { value: '8000', unit: '万kWh', source: '自动采集 · 智能电表' },
                      factor: { value: '0.5366', unit: 'tCO₂/MWh', source: '因子库 · 全国平均' } }
                  ]
                },
                {
                  symbol: 'C备用柴油', name: '备用柴油发电排放', itemLabel: '排放源',
                  rows: [
                    { item: '备用柴油发电机',
                      data: { value: '100', unit: '吨', source: '自动采集 · 加油记录' },
                      factor: { value: '3.096', unit: 'tCO₂/t', source: '因子库 · 缺省值' } }
                  ]
                },
                {
                  symbol: 'E₁', name: 'E₁ 综合能源消费量', itemLabel: '能源品种 · 折标',
                  rows: [
                    { item: '外购电力折标',
                      data: { value: '8000', unit: '万kWh', source: '自动采集 · 智能电表' },
                      factor: { value: '0.2856', unit: 'kgce/kWh', source: '公式库 · 折标系数' } },
                    { item: '光伏自发自用折标',
                      data: { value: '500', unit: '万kWh', source: '自动采集 · 光伏逆变器' },
                      factor: { value: '0.2856', unit: 'kgce/kWh', source: '公式库 · 折标系数' } },
                    { item: '绿电直连折标',
                      data: { value: '3500', unit: '万kWh', source: '自动采集 · 物理消纳凭证 #GR-2025-0512' },
                      factor: { value: '0.2856', unit: 'kgce/kWh', source: '公式库 · 折标系数' } },
                    { item: '柴油折标',
                      data: { value: '100', unit: '吨', source: '自动采集 · 加油记录' },
                      factor: { value: '1.4571', unit: 'tce/t', source: '公式库 · 折标系数' } }
                  ]
                }
              ]
            },
            {
              indicator: '非化石能源消费占比',
              subs: [
                {
                  symbol: 'E物理', name: '非化石能源电力物理认定量', itemLabel: '电力来源',
                  rows: [
                    { item: '光伏自发自用',
                      data: { value: '500', unit: '万kWh', source: '自动采集 · 光伏逆变器采集' },
                      factor: { value: '0', unit: 'tCO₂', source: '物理认定（折标计入非化石能源消费）' } },
                    { item: '绿电直连',
                      data: { value: '3500', unit: '万kWh', source: '自动采集 · 物理消纳凭证 #GR-2025-0512' },
                      factor: { value: '0', unit: 'tCO₂', source: '物理认定（折标计入非化石能源消费）' } }
                  ]
                }
              ]
            },
            {
              indicator: '非化石能源电力消费物理认定量占比',
              subs: [
                {
                  symbol: 'Ez / Q', name: '物理认定电量与总用电量', itemLabel: '构成项',
                  rows: [
                    { item: '非化石能源电力物理认定量 Ez',
                      data: { value: '4,000', unit: '万kWh', source: '光伏 500 + 绿电直连 3,500' },
                      factor: null },
                    { item: '总用电量 Q',
                      data: { value: '12,000', unit: '万kWh', source: '其他电网 8,000 + 光伏 500 + 绿电 3,500' },
                      factor: null }
                  ]
                }
              ]
            },
            {
              indicator: '填报指标（结果值直接填报）',
              subs: [
                {
                  symbol: '填报', name: '无计算公式，逐项核查后填报结果值（说明来源 / 上传材料）；披露类指标依据证明材料校验判定', itemLabel: '填报指标', fillMode: true,
                  rows: [
                    { item: '零碳供应链管理措施符合项数',
                      data: { value: '3', unit: '项', source: '供应链管理台账' },
                      factor: null },
                    { item: '能碳管理中心功能符合项数',
                      data: { value: '11', unit: '项', source: '能碳管理中心功能核查表（共 13 项功能要求）' },
                      factor: null },
                    { item: '碳排放信息披露透明度与质量', judge: true,
                      data: { value: '可测量·可报告·可核查', unit: '', source: '碳排放信息披露报告 2025 · 校验判定：披露完整、口径清晰' },
                      factor: null }
                  ]
                }
              ]
            }
          ],
          uploadedFiles: [],
          // 算力设施待补充/待确认清单
          validationItems: [
            { id: 'v1', name: '外购电力（2025年Q4电量）', stage: '活动数据', status: 'missing', statusLabel: '缺失',
              label: '统一数据底座 2025年10-12月智能电表电量缺失，影响 C购入电 与 E₁ 计算', hint: '电费结算单 / 智能电表导出', value: '2000', unit: '万kWh', modelRef: 'C购入电 · 其他电网电力',
              recommendBasis: '按前三季度自动采集抄表均值推算（全年其他电网电力 8,000 万kWh，Q4 ≈ 2,000 万kWh）' },
            { id: 'v2', name: '电能利用效率 PUE', stage: '填报参数', status: 'pending', statusLabel: '口径待确认',
              label: 'PUE 检测值 1.25 与 GB40879 2级（≤1.3）达标，请确认统计口径', hint: 'PUE 电能利用效率检测报告', value: '1.25', unit: 'PUE', modelRef: '算力设施资格 · 电能利用效率' },
            { id: 'v3', name: '零碳供应链管理措施符合项数', stage: '填报指标', status: 'missing', statusLabel: '待填报',
              label: '对照零碳供应链管理措施清单逐项核查后填报结果值', hint: '供应链管理台账', value: '3', unit: '项', modelRef: '零碳供应链管理措施符合项数',
              recommendBasis: '对照措施清单核查，已匹配 3 项符合措施' },
            { id: 'v4', name: '能碳管理中心功能符合项数', stage: '填报指标', status: 'missing', statusLabel: '待填报',
              label: '对照能碳管理中心 13 项功能要求逐项核查，填报符合项数', hint: '能碳管理中心功能核查表', value: '11', unit: '项', modelRef: '能碳管理中心功能符合项数',
              recommendBasis: '对照 13 项功能要求核查，已符合 11 项' },
            { id: 'v5', name: '碳排放信息披露透明度与质量', stage: '填报指标', status: 'missing', statusLabel: '待填报',
              label: '披露类定性指标，依据证明材料校验判定', hint: '碳排放信息披露报告 2025', value: '可测量·可报告·可核查', unit: '', modelRef: '碳排放信息披露透明度与质量',
              recommendBasis: '依据披露报告校验判定「可测量·可报告·可核查」' }
          ]
        },
        3: {
          indicators: [
            { name: '单位能耗碳排放', value: '1.26 tCO₂/tce', basic: '≤1.8', target: '≤0.2', status: 'improving' },
            { name: '非化石能源消费占比', value: '33.2%', basic: '≥30%', target: '≥95%', status: 'improving' },
            { name: '非化石能源电力消费物理认定量占比', value: '33.3%', basic: '—', target: '≥35%', status: 'improving' },
            { name: '单位工业增加值能耗', value: '—', basic: '—', target: '—', status: 'na' },
            { name: '节能装备应用占比', value: '82%', basic: '—', target: '—', status: 'ongoing' },
            { name: '碳清除率', value: '—', basic: '—', target: '—', status: 'na' },
            { name: '开展产品碳足迹分析占比', value: '—', basic: '—', target: '—', status: 'na' },
            { name: '零碳供应链管理措施符合项数', value: '3项', basic: '—', target: '—', status: 'ongoing' },
            { name: '能碳管理中心能源数据自动采集率', value: '96%', basic: '—', target: '—', status: 'ongoing' },
            { name: '能碳管理中心功能符合项数', value: '11/13项', basic: '—', target: '—', status: 'ongoing' },
            { name: '碳排放信息披露透明度与质量', value: '可测量·可报告·可核查', basic: '—', target: '—', status: 'ongoing' }
          ],
          accountingDetails: {
            note: '各项数值与计算过程可在阶段6溯源报告中逐项复核',
            indicators: [
              {
                name: '单位能耗碳排放',
                formula: 'I = C ÷ E₁（算力设施以购入电力为主要排放源）',
                value: '1.26 tCO₂/tce',
                groups: [
                  { symbol: 'C购入电', name: '购入电力排放', rows: [
                    { item: '其他电网电力', value: '8,000', unit: '万kWh', factor: '0.5366 tCO₂/MWh', result: '42,928 tCO₂' }
                  ], subtotal: '小计 42,928 tCO₂' },
                  { symbol: 'C备用柴油', name: '备用柴油发电排放', rows: [
                    { item: '备用柴油发电机', value: '100', unit: '吨', factor: '3.096 tCO₂/t', result: '310 tCO₂' }
                  ], subtotal: '小计 310 tCO₂' },
                  { symbol: 'E₁', name: '综合能源消费量（派生联动）', rows: [
                    { item: '外购电力折标', value: '8,000', unit: '万kWh', factor: '0.2856 kgce/kWh', result: '22,848 tce' },
                    { item: '光伏自发自用折标', value: '500', unit: '万kWh', factor: '0.2856 kgce/kWh', result: '1,428 tce' },
                    { item: '绿电直连折标', value: '3,500', unit: '万kWh', factor: '0.2856 kgce/kWh', result: '9,996 tce' },
                    { item: '柴油折标', value: '100', unit: '吨', factor: '1.4571 tce/t', result: '146 tce' }
                  ], subtotal: '小计 34,418 tce' }
                ],
                total: 'I = C ÷ E₁ = 43,238 ÷ 34,418 = 1.26 tCO₂/tce'
              },
              {
                name: '非化石能源消费占比',
                formula: 'r = R ÷ E₂',
                value: '33.2%',
                groups: [
                  { symbol: 'E物理', name: '非化石能源电力物理认定量', rows: [
                    { item: '光伏自发自用', value: '500', unit: '万kWh', factor: '折标 0.2856 kgce/kWh', result: '1,428 tce' },
                    { item: '绿电直连', value: '3,500', unit: '万kWh', factor: '折标 0.2856 kgce/kWh', result: '9,996 tce' }
                  ], subtotal: '小计 11,424 tce' },
                  { symbol: 'E₂', name: '综合能源消费量（不含原料用能）', rows: [
                    { item: 'E₂ = E₁（无原料用能）', value: '34,418', unit: 'tce', src: '派生自 E₁', result: '34,418 tce' }
                  ] }
                ],
                total: 'r = R ÷ E₂ = 11,424 ÷ 34,418 = 33.2%'
              },
              {
                name: '非化石能源电力消费物理认定量占比',
                formula: 'z = Ez ÷ Q',
                value: '33.3%',
                groups: [
                  { symbol: 'Ez', name: '非化石能源电力物理认定量', rows: [
                    { item: '光伏自发自用', value: '500', unit: '万kWh', src: '光伏逆变器', result: '500 万kWh' },
                    { item: '绿电直连', value: '3,500', unit: '万kWh', src: '物理消纳凭证', result: '3,500 万kWh' }
                  ], subtotal: '小计 4,000 万kWh' },
                  { symbol: 'Q', name: '总用电量', rows: [
                    { item: '其他电网电力', value: '8,000', unit: '万kWh', src: '智能电表', result: '8,000 万kWh' },
                    { item: '光伏自发自用', value: '500', unit: '万kWh', src: '光伏逆变器', result: '500 万kWh' },
                    { item: '绿电直连', value: '3,500', unit: '万kWh', src: '物理消纳凭证', result: '3,500 万kWh' }
                  ], subtotal: '小计 12,000 万kWh' }
                ],
                total: 'z = Ez ÷ Q = 4,000 ÷ 12,000 = 33.3%'
              }
            ]
          }
        },
        4: {
          goals: {
            startYear: 2026,
            endYear: 2028,
            basis: '推荐依据：核心指标期末目标锚定官方目标要求（通知三（三），算力设施物理认定量占比不设定基本要求）；非核心指标无官方量化要求，由企业自主设定建设目标（AI推荐参考值可调整）；建设期不晚于2030年（通知二（三））；算力设施以提升绿电直连比例、优化 PUE 为主',
            rows: [
              { name: '容积率', core: true, unit: '/', current: '1.35', finalTarget: '≥1.5', finalGoal: '1.50', mids: ['1.40', '1.45'] },
              { name: '单位用地面积产值', core: true, unit: '万元/亩', current: '520', finalTarget: '≥500', finalGoal: '560', mids: ['535', '548'] },
              { name: '建筑密度', core: false, unit: '%', current: '42', finalTarget: '≥40', finalGoal: '43', mids: ['42.5', '43'] },
              { name: '绿色物料使用率', core: true, unit: '%', current: '68', finalTarget: '≥80', finalGoal: '82', mids: ['73', '78'] },
              { name: '有毒有害物质替代率', core: false, unit: '%', current: '85', finalTarget: '≥95', finalGoal: '92', mids: ['88', '90'] },
              { name: '可回收材料使用率', core: false, unit: '%', current: '52', finalTarget: '≥60', finalGoal: '58', mids: ['54', '56'] },
              { name: '单位产品污染物产生量', core: true, unit: 'kg/件', current: '0.82', finalTarget: '≤0.8', finalGoal: '0.78', mids: ['0.80', '0.79'] },
              { name: '清洁生产审核', core: false, unit: '/', current: '已通过', finalTarget: '通过', finalGoal: '保持', mids: ['保持', '保持'] },
              { name: '工艺装备水平', core: false, unit: '/', current: '国内先进', finalTarget: '国际先进', finalGoal: '国际先进', mids: ['国内先进', '国内先进'] },
              { name: '一般固废综合利用率', core: true, unit: '%', current: '92', finalTarget: '≥95', finalGoal: '96', mids: ['93', '95'] },
              { name: '工业用水重复利用率', core: false, unit: '%', current: '88', finalTarget: '≥90', finalGoal: '91', mids: ['89', '90'] },
              { name: '余热余压利用', core: false, unit: '项', integer: true, current: '3', finalTarget: '—', finalGoal: '5', mids: ['4', '5'] },
              { name: '单位产品综合能耗', core: true, unit: 'tce/件', current: '0.086', finalTarget: '≤0.09', finalGoal: '0.085', mids: ['0.087', '0.086'] },
              { name: '可再生能源使用率', core: true, unit: '%', current: '28', finalTarget: '≥40', finalGoal: '42', mids: ['33', '38'] },
              { name: '碳排放强度', core: true, unit: 'tCO₂/万元', current: '1.32', finalTarget: '≤1.0', finalGoal: '0.95', mids: ['1.15', '1.05'] },
              { name: '能源管理体系', core: false, unit: '/', current: '已认证', finalTarget: '认证', finalGoal: '保持', mids: ['保持', '保持'] }
            ]
          },
          gaps: [
            { name: '容积率', current: '1.35', target: '≥1.5', gap: '0.15' },
            { name: '绿色物料使用率', current: '68%', target: '≥80%', gap: '12个百分点' },
            { name: '单位产品污染物产生量', current: '0.82', target: '≤0.8', gap: '0.02 kg/件' },
            { name: '一般固废综合利用率', current: '92%', target: '≥95%', gap: '3个百分点' },
            { name: '可再生能源使用率', current: '28%', target: '≥40%', gap: '12个百分点' },
            { name: '碳排放强度', current: '1.32', target: '≤1.0', gap: '0.32 tCO₂/万元' }
          ],
            measures: [
            { name: '屋顶光伏扩容与液冷改造', direction: '新能源建设', reason: '提升自发自用比例、降低制冷能耗，同步压降 PUE', calcType: 'power',
              params: [{ key: 'capacity', label: '光伏装机容量', unit: 'MWp', value: 8.6 }, { key: 'hours', label: '年等效利用小时数', unit: 'h', value: 1150 }], factor: { label: '电网排放因子', value: 0.581, unit: 'tCO₂/MWh' }, targetIndicator: '非化石能源消费占比', contribValue: 56, contribText: '+56 个百分点' },
            { name: '扩大绿电直连规模', direction: '绿电购买', reason: '算力设施用能以电力为主，绿电直连是提升非化石能源占比的首选路径', calcType: 'energy',
              params: [{ key: 'energy', label: '绿电直连电量', unit: '万kWh', value: 11000 }], factor: { label: '电网排放因子', value: 0.581, unit: 'tCO₂/MWh' }, targetIndicator: '非化石能源电力消费物理认定量占比', contribValue: 1.7, contribText: '+1.7 个百分点' },
            { name: '余能回收利用', direction: '余能利用', reason: '回收算力设施余热用于园区供暖、余压用于发电，降低整体能耗',

              subTypeOptions: [

                { value: 'heat', label: '余热回收（供热）', calcType: 'heat', unit: 'GJ', defaultValue: 12000, factor: { label: '热力排放因子', value: 0.11, unit: 'tCO₂/GJ' } },

                { value: 'power', label: '余压发电', calcType: 'energy', unit: '万kWh', defaultValue: 800, factor: { label: '电网排放因子', value: 0.581, unit: 'tCO₂/MWh' } },

                { value: 'gas', label: '可燃废气回收', calcType: 'heat', unit: 'GJ', defaultValue: 9000, factor: { label: '热力排放因子', value: 0.11, unit: 'tCO₂/GJ' } },

                { value: 'cold', label: '余冷回收', calcType: 'heat', unit: 'GJ', defaultValue: 6000, factor: { label: '热力排放因子', value: 0.11, unit: 'tCO₂/GJ' } }

              ],

              recoveries: [

                { subType: 'heat', amount: 27000, factorValue: 0.11 },

                { subType: 'power', amount: 800, factorValue: 0.581 }

              ],

              targetIndicator: '单位能耗碳排放', contribValue: 0.15, contribText: '−0.15 tCO₂/tce' },
            { name: '高效 UPS / 变压器替换', direction: '设备升级改造', reason: '降低供配电损耗，提升节能装备应用占比', calcType: 'energy',
              params: [{ key: 'energy', label: '年节电量', unit: '万kWh', value: 600 }], factor: { label: '电网排放因子', value: 0.581, unit: 'tCO₂/MWh' }, targetIndicator: '节能装备应用占比', contribValue: 8, contribText: '+8 个百分点' },
            { name: '零碳供应链管理措施补齐', direction: '管理提升', reason: '对照零碳供应链管理措施清单补齐缺项，支撑符合项数达标', targetIndicator: '零碳供应链管理措施符合项数', contribValue: 2, contribText: '+2 项' },
            { name: '能碳管理中心功能补齐', direction: '管理提升', reason: '补齐能碳管理中心功能项，支撑功能符合项数达标', targetIndicator: '能碳管理中心功能符合项数', contribValue: 2, contribText: '+2 项' }
          ],
          diagnosis: '核心指标暂未全部达到目标要求，按改善路径建设后可满足申报条件'
        },
        5: {
          evidence: { total: 118, autoCollected: 92, manualProvided: 26 },
          archived: '报告与档案中心 · 绿算智算中心-绿色工厂评价指标自评表及证明材料包',
          hash: '9B3E7F21AC45D890E4F6A2B1C8D3E5F7',
          evidenceChain: [
            {
              indicator: '单位能耗碳排放',
              result: '1.26 tCO₂/tce',
              status: '满足基本要求',
              calc: 'I = C ÷ E₁ = 43,238 ÷ 34,418 = 1.26 tCO₂/tce',
              calcVersion: '计算依据：核算公式库 · 排放因子库',
              inputs: [
                { param: 'C购入电 · 其他电网电力', detail: '8,000 万kWh × 0.5366 tCO₂/MWh', source: '自动采集 · 智能电表', conf: '高' },
                { param: 'C备用柴油 · 备用发电机', detail: '100 t × 3.096 tCO₂/t', source: '采购台账 · 柴油出库单', conf: '高' },
                { param: 'E₁ · 综合能源消费量', detail: '34,418 tce（电力折标为主）', source: '自动采集 · 能源统计', conf: '高' }
              ]
            },
            {
              indicator: '非化石能源消费占比',
              result: '33.2%',
              status: '满足基本要求',
              calc: 'r = R ÷ E₂ = 11,424 ÷ 34,418 = 33.2%',
              calcVersion: '计算依据：核算公式库 · 排放因子库',
              inputs: [
                { param: 'E物理 · 光伏自发自用', detail: '500 万kWh × 折标 0.2856', source: '自动采集 · 光伏逆变器采集', conf: '高' },
                { param: 'E物理 · 绿电直连', detail: '3,500 万kWh × 折标 0.2856', source: '物理消纳凭证 #GR-2025-0512', conf: '高' },
                { param: 'E₂ · 综合能源消费量', detail: '34,418 tce（无原料用能）', source: '派生自 E₁', conf: '高' }
              ]
            }
          ]
        }
      },

      // ===== 阶段专属内容演示数据（小米汽车工厂） =====
      phaseDetails: {
        0: {
          standard: {
            name: '绿色工厂评价通则（GB/T 36132-2025）',
            code: '附件1（试行）',
            categories: [
              { name: '能源低碳化', count: 4, indicators: '单位产品综合能耗·可再生能源使用率·碳排放强度·能源管理体系' },
              { name: '资源高效化', count: 4, indicators: '一般固废综合利用率·工业用水重复利用率·余热余压利用·资源产出率' },
              { name: '生产洁净化', count: 3, indicators: '单位产品污染物产生量·清洁生产审核·工艺装备水平' },
              { name: '产品绿色化', count: 4, indicators: '绿色设计产品占比·绿色物料使用率·产品可回收利用率·产品碳足迹' },
              { name: '用地集约化', count: 3, indicators: '容积率·单位用地面积产值·建筑密度' }
            ],
            // 指标适用性规则（政策豁免与限定，阶段一仅展示规则；实际判定在阶段2建模/阶段3采数后进行）
            applicability: [
              { name: '非化石能源电力消费物理认定量占比', rule: '仅适用于年电力消费量 ≥500万千瓦时的申报单位' },
              { name: '单位工业增加值能耗', rule: '不适用于算力设施' },
              { name: '碳清除率', rule: '仅适用于存在直接排放的单位' }
            ]
          },
          qualification: {
            // 企业基本信息（官方基本信息表字段，组织资源库自动带出，用户确认/补填）
            baseInfo: [
              { label: '单位名称', value: '小米汽车工厂（小米汽车科技有限公司）', source: '自动带出' },
              { label: '单位地址', value: '北京市经济技术开发区（亦庄）科创十四街18号', source: '自动带出' },
              { label: '所属行业', value: '汽车', source: '自动带出', type: 'select', options: ['汽车', '锂电池', '光伏', '电子电器', '轻工', '机械', '纺织', '有色金属', '钢铁', '建材', '石化化工', '其他制造业', '算力设施'] },
              { label: '单位性质', value: '民营', source: '自动带出', type: 'select', options: ['国有', '集体', '民营', '中外合资', '港澳台', '外商独资'] },
              { label: '统一社会信用代码', value: '91110308MA0XXXXXXX', source: '自动带出' },
              { label: '法定代表人', value: '雷军', source: '自动带出' },
              { label: '申报工作联系部门', value: '能源管理部', placeholder: '如：能源管理部', source: '当前用户带入' },
              { label: '联系人', value: '张工', placeholder: '如：张工', source: '当前用户带入' },
              { label: '联系电话', value: '010-6061-8866', placeholder: '手机/座机', source: '当前用户带入' },
              { label: '电子邮箱', value: 'zhang@xiaomiev.com', placeholder: 'name@company.com', source: '当前用户带入' }
            ],
            // 前置资质类资格条件（基本信息表未列出，系统自动核验；要求-现状-材料-判断四列，现状可调整，状态自动判定；证明材料经 proofId 引用材料池，支持共用与更换）
            // blocking=true 静态硬资格（不通过则终止申报）；false 量化门槛（暂不满足不拦截，核算后给出差距与改善路径）
            autoChecks: [
              { condition: '独立法人资格（境内注册工业企业）', blocking: true, current: '是', type: 'yesno', options: ['是', '否'], passValue: '是', source: '营业执照' },
              { condition: '规模以上工业企业（年主营业务收入 ≥ 2000 万元）', blocking: true, current: 3650000, unit: '万元', type: 'number', threshold: 2000, source: '财务报表 / 统计年报' },
              { condition: '符合国家和地方产业政策（非限制类、淘汰类）', blocking: true, current: '是', type: 'yesno', options: ['是', '否'], passValue: '是', source: '产业政策符合性说明' },
              { condition: '污染物达标排放（持有效排污许可证）', blocking: true, current: '是', type: 'yesno', options: ['是', '否'], passValue: '是', source: '排污许可证 / 监测报告' },
              { condition: '未使用国家明令淘汰的落后工艺装备', blocking: true, current: '是', type: 'yesno', options: ['是', '否'], passValue: '是', source: '工艺装备清单' },
              { condition: '已获评省级绿色工厂（优先推荐国家级）', blocking: false, current: '是', type: 'yesno', options: ['是', '否'], passValue: '是', source: '省级绿色工厂名单' },
            ],
            manualChecks: [
              { condition: '近三年无较大及以上安全/质量/环境污染事故', current: '无此情况', type: 'yesno', options: ['无此情况', '存在此情况'], passValue: '无此情况', source: '企业填报', policyRef: '《指导意见》二（三）负面清单', checkSource: '信用中国（行政处罚公示）', checkUrl: 'https://www.creditchina.gov.cn/', checkType: 'manual', proofId: 'pm-compliance', proofStatus: 'pending' },
              { condition: '无垄断行为（反垄断法）', current: '无此情况', type: 'yesno', options: ['无此情况', '存在此情况'], passValue: '无此情况', source: '企业填报', policyRef: '《指导意见》二（三）负面清单', checkSource: '市场监管总局（反垄断处罚公示）', checkUrl: 'https://www.samr.gov.cn/', checkType: 'manual', proofId: 'pm-commitment', proofStatus: 'matched' },
              { condition: '未被国务院督查发现严重问题', current: '无此情况', type: 'yesno', options: ['无此情况', '存在此情况'], passValue: '无此情况', source: '企业填报', policyRef: '《指导意见》二（三）负面清单', checkSource: '中国政府网（国务院督查通报）', checkUrl: 'https://www.gov.cn/', checkType: 'manual', proofId: 'pm-commitment', proofStatus: 'matched' },
              { condition: '未列入工业节能监察整改未完成名单', current: '无此情况', type: 'yesno', options: ['无此情况', '存在此情况'], passValue: '无此情况', source: '企业填报', policyRef: '《指导意见》二（三）负面清单', checkSource: '工信部（工业节能监察通报）', checkUrl: 'https://www.miit.gov.cn/', checkType: 'manual', proofId: 'pm-ee-inspect', proofStatus: 'pending' },
              { condition: '未列入电信业务经营不良/失信名单', current: '无此情况', type: 'yesno', options: ['无此情况', '存在此情况'], passValue: '无此情况', source: '企业填报', policyRef: '《指导意见》二（三）负面清单', checkSource: '工信部电信业务综合管理信息系统（不良名单）', checkUrl: 'https://dxzhgl.miit.gov.cn/', checkType: 'manual', proofId: 'pm-telecom', proofStatus: 'pending' },
              { condition: '无较重大以上行政处罚', current: '无此情况', type: 'yesno', options: ['无此情况', '存在此情况'], passValue: '无此情况', source: '企业填报', policyRef: '《指导意见》二（三）负面清单', checkSource: '信用中国 / 国家企业信用信息公示系统', checkUrl: 'https://www.creditchina.gov.cn/', checkType: 'manual', proofId: 'pm-credit-cn', proofStatus: 'pending' },
              { condition: '非失信被执行人', current: '无此情况', type: 'yesno', options: ['无此情况', '存在此情况'], passValue: '无此情况', source: '企业填报', policyRef: '《指导意见》二（三）负面清单', checkSource: '中国执行信息公开网（失信被执行人）', checkUrl: 'http://zxgk.court.gov.cn/', checkType: 'manual', proofId: 'pm-executive', proofStatus: 'pending' },
              { condition: '无权属纠纷生效法律责任认定', current: '无此情况', type: 'yesno', options: ['无此情况', '存在此情况'], passValue: '无此情况', source: '企业填报', policyRef: '《指导意见》二（三）负面清单', checkSource: '中国裁判文书网', checkUrl: 'https://wenshu.court.gov.cn/', checkType: 'manual', proofId: 'pm-commitment', proofStatus: 'matched' }
            ],
            // 证明材料池（佐证材料库；一份材料可被多个条件引用，如法定代表人承诺书覆盖3项承诺）
            proofPool: {
              'pm-license': { name: '营业执照副本', category: '资质类（长期有效）' },
              'pm-audit': { name: '2025年度财务审计报告 · 利润表', category: '期间凭证类（2025年度）' },
              'pm-gf-list': { name: '国家级绿色工厂名单公示文件（2023年第七批）', category: '资质类（长期有效）' },
              'pm-ems-shot': { name: '能碳管理中心系统功能截图', category: '技术文件类' },
              'pm-energy-report': { name: '2025年度能源统计报表', category: '期间凭证类（2025年度）' },
              'pm-benchmark': { name: '产品单耗对标测算说明', category: '技术文件类' },
              'pm-compliance': { name: '安全/质量/环保合规证明（2023-2025）', category: '资质类（长期有效）' },
              'pm-commitment': { name: '法定代表人承诺书', category: '资质类（长期有效）' },
              'pm-ee-inspect': { name: '节能监察结果公示查询截图', category: '技术文件类' },
              'pm-telecom': { name: '不适用说明（非电信业务经营单位）', category: '技术文件类' },
              'pm-credit-cn': { name: '信用中国行政处罚查询截图' },
              'pm-executive': { name: '中国执行信息公开网查询截图' }
            }
          }
        },
        1: {
          // 按核算模型三级结构组织的采集清单（指标 → 构成子模块 → 输入项行；每项上下两行：活动数据 + 匹配因子，均支持修改，来源凭证可更换）
          collectModel: [
            // ===== 能源低碳化（30%）=====
            {
              category: '能源低碳化', no: '1',
              indicator: '能源消耗强度',
              formula: '能源消耗强度 = 综合能耗（tce）÷ 产品产量（辆）或 工业总产值（万元）',
              indicatorType: '逆向定量', unit: 'tce/万元', weight: 8,
              leading: '行业先进水平或能耗限额1级', baseline: '行业平均水平或能耗限额2级',
              rule: '与行业先进水平或能耗限额1级对标赋分',
              productMode: true,
              basis: 'product',
              numLabel: '综合能耗', numUnit: 'tce', denLabel: '产品产量', denUnit: '辆',
              altDenLabel: '工业总产值', altDenUnit: '万元',
              sumUnit: 'tce',
              productItems: {
                'SU7': [
                  { item: '外购电力', value: '5760', unit: '万kWh', factor: '2.856', factorUnit: 'tce/万kWh', source: '分表读数', sourceType: 'platform' },
                  { item: '天然气', value: '280', unit: '万m³', factor: '12.29', factorUnit: 'tce/万m³', source: '分表读数', sourceType: 'platform' },
                  { item: '柴油', value: '64', unit: '吨', factor: '1.4571', factorUnit: 'tce/t', source: '加油记录', sourceType: 'platform' }
                ]
              },
              sharedItems: [
                { item: '外购电力', value: '2840', unit: '万kWh', factor: '2.856', factorUnit: 'tce/万kWh', source: '共用表读数', sourceType: 'platform' },
                { item: '天然气', value: '140', unit: '万m³', factor: '12.29', factorUnit: 'tce/万m³', source: '共用表读数', sourceType: 'platform' }
              ],
              productOutputs: {
                'SU7': { value: '72000', unit: '辆', source: 'MES 系统', sourceType: 'platform' },
                'YU7': { value: '48000', unit: '辆', source: 'MES 系统', sourceType: 'platform' },
                'YU8': { value: '32000', unit: '辆', source: 'MES 系统', sourceType: 'platform' }
              },
              subs: [
                { symbol: 'E', name: '综合能耗', itemLabel: '能源品种', rows: [
                  { item: '外购电力', data: { value: '8600', unit: '万kWh', source: '自动采集 · 智能电表', sourceType: 'platform' }, factor: { value: '2.856', unit: 'tce/万kWh', source: '公式库 · 折标系数' } },
                  { item: '天然气', data: { value: '420', unit: '万m³', source: '自动采集 · 流量计', sourceType: 'platform' }, factor: { value: '12.29', unit: 'tce/万m³', source: '公式库 · 折标系数' } },
                  { item: '柴油', data: { value: '96', unit: '吨', source: '自动采集 · 加油卡', sourceType: 'platform' }, factor: { value: '1.4571', unit: 'tce/t', source: '公式库 · 折标系数' } }
                ] },
                { symbol: 'V', name: '工业总产值', itemLabel: '产值', rows: [
                  { item: '工业总产值', data: { value: '3650000', unit: '万元', source: '自动采集 · 财务系统', sourceType: 'platform' } }
                ] }
              ]
            },
            {
              category: '能源低碳化', no: '2',
              indicator: '碳排放强度',
              formula: '碳排放强度 = 碳排放总量（tCO₂）÷ 工业总产值（万元）',
              indicatorType: '逆向定量', unit: 'tCO₂/万元', weight: 8,
              leading: '行业先进水平', baseline: '行业平均水平',
              rule: '与行业先进水平对标赋分',
              productMode: true,
              basis: 'product',
              numLabel: '碳排放量', numUnit: 'tCO₂', denLabel: '产品产量', denUnit: '辆',
              sumUnit: 'tCO₂',
              productItems: {
                'SU7': [
                  { item: '外购电力间接排放', value: '5760', unit: '万kWh', factor: '5.366', factorUnit: 'tCO₂/万kWh', source: '分表读数', sourceType: 'platform' },
                  { item: '天然气燃烧排放', value: '280', unit: '万m³', factor: '21.622', factorUnit: 'tCO₂/万m³', source: '分表读数', sourceType: 'platform' },
                  { item: '柴油燃烧排放', value: '64', unit: '吨', factor: '3.096', factorUnit: 'tCO₂/t', source: '加油记录', sourceType: 'platform' },
                ]
              },
              sharedItems: [
                { item: '外购电力间接排放', value: '2840', unit: '万kWh', factor: '5.366', factorUnit: 'tCO₂/万kWh', source: '共用表读数', sourceType: 'platform' },
                { item: '天然气燃烧排放', value: '140', unit: '万m³', factor: '21.622', factorUnit: 'tCO₂/万m³', source: '共用表读数', sourceType: 'platform' },
              ],
              productOutputs: {
                'SU7': { value: '72000', unit: '辆', source: 'MES 系统', sourceType: 'platform' },
                'YU7': { value: '48000', unit: '辆', source: 'MES 系统', sourceType: 'platform' },
                'YU8': { value: '32000', unit: '辆', source: 'MES 系统', sourceType: 'platform' }
              },
              subs: [
                { symbol: 'C', name: '碳排放总量', itemLabel: '排放源', rows: [
                  { item: '外购电力间接排放', data: { value: '8600', unit: '万kWh', source: '自动采集 · 智能电表', sourceType: 'platform' }, factor: { value: '5.366', unit: 'tCO₂/万kWh', source: '因子库 · 全国电网平均' } },
                  { item: '天然气燃烧排放', data: { value: '420', unit: '万m³', source: '自动采集 · 流量计', sourceType: 'platform' }, factor: { value: '21.622', unit: 'tCO₂/万m³', source: '因子库 · 缺省值' } },
                  { item: '柴油燃烧排放', data: { value: '96', unit: '吨', source: '自动采集 · 加油卡', sourceType: 'platform' }, factor: { value: '3.096', unit: 'tCO₂/t', source: '因子库 · 缺省值' } }
                ] },
                { symbol: 'V', name: '工业总产值', itemLabel: '产值', rows: [
                  { item: '工业总产值', data: { value: '3650000', unit: '万元', source: '自动采集 · 财务系统', sourceType: 'platform' } }
                ] }
              ]
            },
            {
              category: '能源低碳化', no: '3',
              indicator: '可再生能源利用率',
              formula: '可再生能源利用率 = 可再生能源消耗量（tce）÷ 综合能耗（tce）× 100%',
              indicatorType: '正向定量', unit: '%', weight: 8,
              leading: '行业先进水平', baseline: '行业平均水平',
              rule: '与行业先进水平对标赋分',
              subs: [
                { symbol: 'Ere', name: '可再生能源消耗量', itemLabel: '能源品种', rows: [
                  { item: '分布式光伏自发自用', data: { value: '1200', unit: '万kWh', source: '自动采集 · 光伏监控', sourceType: 'platform' }, factor: { value: '2.856', unit: 'tce/万kWh', source: '公式库 · 折标系数' } },
                  { item: '绿电交易电量', data: { value: '2400', unit: '万kWh', source: '绿电交易合同', sourceType: 'manual' }, factor: { value: '2.856', unit: 'tce/万kWh', source: '公式库 · 折标系数' } },
                  { item: '绿证对应电量', data: { value: '600', unit: '万kWh', source: 'GEC 证书', sourceType: 'manual' }, factor: { value: '2.856', unit: 'tce/万kWh', source: '公式库 · 折标系数' } }
                ] },
                { symbol: 'E', name: '综合能耗', itemLabel: '总量', rows: [
                  { item: '综合能耗合计', data: { value: '10320', unit: 'tce', source: '能源统计报表', sourceType: 'manual' } }
                ] }
              ]
            },
            {
              category: '能源低碳化', no: '4',
              indicator: '能碳管理系统平台功能符合数量',
              formula: '按 GB/T 36132 附录 B 所列 12 项业务功能，统计符合项数',
              indicatorType: '正向定量', unit: '项', weight: 6,
              renderMode: 'checklist', judgeMethod: '功能核查', judgeScore: '计入',
              leading: '8', baseline: '0',
              rule: '建成运行并按符合的业务功能数量赋分（共 12 项）',
              subs: [
                { symbol: 'F', name: '功能符合项', itemLabel: '业务功能', rows: [
                  { item: '能耗查询', data: { value: '符合', unit: '', source: '系统功能截图', sourceType: 'manual' } },
                  { item: '能源消费量和强度计算', data: { value: '符合', unit: '', source: '系统功能截图', sourceType: 'manual' } },
                  { item: '能源消费分析与用能策略推荐', data: { value: '符合', unit: '', source: '系统功能截图', sourceType: 'manual' } },
                  { item: '能效对标', data: { value: '符合', unit: '', source: '系统功能截图', sourceType: 'manual' } },
                  { item: '能流分析', data: { value: '符合', unit: '', source: '系统功能截图', sourceType: 'manual' } },
                  { item: '能效平衡与优化', data: { value: '符合', unit: '', source: '系统功能截图', sourceType: 'manual' } },
                  { item: '用能与碳排放预算管理', data: { value: '符合', unit: '', source: '系统功能截图', sourceType: 'manual' } },
                  { item: '碳排放核算', data: { value: '符合', unit: '', source: '系统功能截图', sourceType: 'manual' } },
                  { item: '碳足迹核算', data: { value: '符合', unit: '', source: '系统功能截图', sourceType: 'manual' } },
                  { item: '供应链碳管理', data: { value: '不符合', unit: '', source: '—', sourceType: 'manual' } },
                  { item: '碳核查支撑', data: { value: '符合', unit: '', source: '系统功能截图', sourceType: 'manual' } },
                  { item: '碳资产管理', data: { value: '不符合', unit: '', source: '—', sourceType: 'manual' } }
                ] }
              ]
            },
            // ===== 资源高效化（30%）=====
            {
              category: '资源高效化', no: '5',
              indicator: '原材料消耗强度',
              formula: '原材料消耗强度 = 主要原材料消耗量 ÷ 工业总产值',
              indicatorType: '逆向定量', unit: 't/万元', weight: 8,
              leading: '行业先进水平', baseline: '行业平均水平',
              rule: '与行业先进水平对标赋分',
              productMode: true,
              basis: 'product',
              numLabel: '原材料消耗量', numUnit: 't', denLabel: '产品产量', denUnit: '辆',
              sumUnit: 't',
              productItems: {
                'SU7': [
                  { item: '钢材消耗量', value: '17200', unit: '吨', source: '采购台账', sourceType: 'manual' },
                  { item: '铝材消耗量', value: '5900', unit: '吨', source: '采购台账', sourceType: 'manual' },
                ]
              },
              sharedItems: [
                { item: '钢材消耗量', value: '11400', unit: '吨', source: '采购台账（分摊）', sourceType: 'manual' },
                { item: '铝材消耗量', value: '3900', unit: '吨', source: '采购台账（分摊）', sourceType: 'manual' },
              ],
              productOutputs: {
                'SU7': { value: '72000', unit: '辆', source: 'MES 系统', sourceType: 'platform' },
                'YU7': { value: '48000', unit: '辆', source: 'MES 系统', sourceType: 'platform' },
                'YU8': { value: '32000', unit: '辆', source: 'MES 系统', sourceType: 'platform' }
              },
              subs: [
                { symbol: 'M', name: '主要原材料消耗量', itemLabel: '原材料', rows: [
                  { item: '钢材消耗量', data: { value: '28600', unit: '吨', source: '采购台账', sourceType: 'manual' } },
                  { item: '铝材消耗量', data: { value: '9800', unit: '吨', source: '采购台账', sourceType: 'manual' } }
                ] },
                { symbol: 'V', name: '工业总产值', itemLabel: '产值', rows: [
                  { item: '工业总产值', data: { value: '3650000', unit: '万元', source: '自动采集 · 财务系统', sourceType: 'platform' } }
                ] }
              ]
            },
            {
              category: '资源高效化', no: '6',
              indicator: '取水强度',
              formula: '取水强度 = 取水量（m³）÷ 工业总产值（万元）',
              indicatorType: '逆向定量', unit: 'm³/万元', weight: 8,
              leading: '工业用水定额先进值', baseline: '工业用水定额通用值',
              rule: '与工业用水定额先进值对标赋分',
              productMode: true,
              basis: 'product',
              numLabel: '取水量', numUnit: 'm³', denLabel: '产品产量', denUnit: '辆',
              sumUnit: 'm³',
              productItems: {
                'SU7': [
                  { item: '自来水取水量', value: '112000', unit: 'm³', source: '自动采集 · 水表', sourceType: 'platform' },
                  { item: '地表水取水量', value: '15000', unit: 'm³', source: '取水许可台账', sourceType: 'manual' },
                ]
              },
              sharedItems: [
                { item: '自来水取水量', value: '74000', unit: 'm³', source: '共用表（分摊）', sourceType: 'platform' },
                { item: '地表水取水量', value: '10000', unit: 'm³', source: '取水许可台账（分摊）', sourceType: 'manual' },
              ],
              productOutputs: {
                'SU7': { value: '72000', unit: '辆', source: 'MES 系统', sourceType: 'platform' },
                'YU7': { value: '48000', unit: '辆', source: 'MES 系统', sourceType: 'platform' },
                'YU8': { value: '32000', unit: '辆', source: 'MES 系统', sourceType: 'platform' }
              },
              subs: [
                { symbol: 'W', name: '取水量', itemLabel: '水源', rows: [
                  { item: '自来水取水量', data: { value: '186000', unit: 'm³', source: '自动采集 · 水表', sourceType: 'platform' } },
                  { item: '地表水取水量', data: { value: '25000', unit: 'm³', source: '取水许可台账', sourceType: 'manual' } }
                ] },
                { symbol: 'V', name: '工业总产值', itemLabel: '产值', rows: [
                  { item: '工业总产值', data: { value: '3650000', unit: '万元', source: '自动采集 · 财务系统', sourceType: 'platform' } }
                ] }
              ]
            },
            {
              category: '资源高效化', no: '7',
              indicator: '工业用水重复利用率',
              formula: '工业用水重复利用率 = 重复利用水量 ÷ (重复利用水量 + 取水量) × 100%',
              indicatorType: '正向定量', unit: '%', weight: 8,
              leading: '行业先进水平', baseline: '行业平均水平',
              rule: '与行业先进水平对标赋分',
              subs: [
                { symbol: 'Vr', name: '重复利用水量', itemLabel: '环节', rows: [
                  { item: '循环冷却水回用', data: { value: '186000', unit: 'm³', source: '自动采集 · 水表', sourceType: 'platform' } }
                ] },
                { symbol: 'V', name: '取水量', itemLabel: '水源', rows: [
                  { item: '总取水量', data: { value: '211000', unit: 'm³', source: '自动采集 · 水表', sourceType: 'platform' } }
                ] }
              ]
            },
            {
              category: '资源高效化', no: '8',
              indicator: '一般工业固体废物综合利用率',
              formula: '综合利用率 = 综合利用量 ÷ (产生量 + 往年贮存量) × 100%',
              indicatorType: '正向定量', unit: '%', weight: 6,
              leading: '行业先进水平', baseline: '行业平均水平',
              rule: '与行业先进水平对标赋分',
              subs: [
                { symbol: 'Zr', name: '综合利用量', itemLabel: '固废种类', rows: [
                  { item: '废金属回收利用', data: { value: '12800', unit: '吨', source: '固废管理台账', sourceType: 'manual' } },
                  { item: '废包装材料回收', data: { value: '3200', unit: '吨', source: '固废管理台账', sourceType: 'manual' } }
                ] },
                { symbol: 'Z', name: '产生量与贮存量', itemLabel: '总量', rows: [
                  { item: '一般工业固废产生量', data: { value: '17400', unit: '吨', source: '固废管理台账', sourceType: 'manual' } },
                  { item: '往年贮存量', data: { value: '0', unit: '吨', source: '固废管理台账', sourceType: 'manual' } }
                ] }
              ]
            },
            // ===== 生产洁净化（16%）=====
            {
              category: '生产洁净化', no: '9',
              indicator: '生产工艺和设备先进性',
              formula: '定性：采用国家鼓励的节能/节水/节材/减污/降碳先进适用工艺技术和设备',
              indicatorType: '正向定性', unit: '—', weight: 6,
              judgeMethod: '材料核查', judgeScore: '满分/0',
              leading: '采用先进适用技术和设备', baseline: '—',
              rule: '提供证明并依据国家推荐目录、行业规范条件符合情况赋分',
              subs: [
                { symbol: 'T', name: '工艺装备核查', itemLabel: '核查项', rows: [
                  { item: '节能先进工艺技术采用', data: { value: '是', unit: '', source: '工艺装备清单 + 目录对照', sourceType: 'manual' } },
                  { item: '节水节材先进技术采用', data: { value: '是', unit: '', source: '工艺装备清单 + 目录对照', sourceType: 'manual' } },
                  { item: '减污降碳先进技术采用', data: { value: '是', unit: '', source: '工艺装备清单 + 目录对照', sourceType: 'manual' } }
                ] }
              ]
            },
            {
              category: '生产洁净化', no: '10',
              indicator: '绿色低碳改造升级项目投资额占比',
              formula: '占比 = 近3年绿色低碳改造升级投资额 ÷ 近3年总产值 × 100%',
              indicatorType: '正向定量', unit: '%', weight: 4,
              leading: '行业先进水平', baseline: '行业平均水平',
              rule: '近3年投资额占3年总产值比例与行业先进水平对标赋分',
              subs: [
                { symbol: 'I', name: '近3年改造投资额', itemLabel: '年度', rows: [
                  { item: '2023 年投资额', data: { value: '8600', unit: '万元', source: '财务台账', sourceType: 'manual' } },
                  { item: '2024 年投资额', data: { value: '12400', unit: '万元', source: '财务台账', sourceType: 'manual' } },
                  { item: '2025 年投资额', data: { value: '15600', unit: '万元', source: '财务台账', sourceType: 'manual' } }
                ] },
                { symbol: 'V', name: '近3年总产值', itemLabel: '年度', rows: [
                  { item: '2023-2025 年总产值合计', data: { value: '10200000', unit: '万元', source: '财务报表', sourceType: 'manual' } }
                ] }
              ]
            },
            {
              category: '生产洁净化', no: '11',
              indicator: '主要污染物产生或排放强度',
              formula: '污染物强度 = 主要污染物产生/排放量 ÷ 工业总产值',
              indicatorType: '逆向定量', unit: 'kg/万元', weight: 6,
              leading: '行业先进水平', baseline: '行业平均水平',
              rule: '与行业先进水平对标赋分',
              productMode: true,
              basis: 'product',
              numLabel: '污染物产生量', numUnit: 'kg', denLabel: '产品产量', denUnit: '辆',
              sumUnit: 'kg',
              productItems: {
                'SU7': [
                  { item: 'VOCs 产生量', value: '51600', unit: 'kg', source: '在线监测', sourceType: 'platform' },
                  { item: '颗粒物产生量', value: '7440', unit: 'kg', source: '在线监测', sourceType: 'platform' },
                ]
              },
              sharedItems: [
                { item: 'VOCs 产生量', value: '34400', unit: 'kg', source: '共用监测（分摊）', sourceType: 'platform' },
                { item: '颗粒物产生量', value: '4960', unit: 'kg', source: '共用监测（分摊）', sourceType: 'platform' },
              ],
              productOutputs: {
                'SU7': { value: '72000', unit: '辆', source: 'MES 系统', sourceType: 'platform' },
                'YU7': { value: '48000', unit: '辆', source: 'MES 系统', sourceType: 'platform' },
                'YU8': { value: '32000', unit: '辆', source: 'MES 系统', sourceType: 'platform' }
              },
              subs: [
                { symbol: 'Q', name: '污染物产生/排放量', itemLabel: '污染物', rows: [
                  { item: 'VOCs 产生量', data: { value: '86000', unit: 'kg', source: '在线监测', sourceType: 'platform' } },
                  { item: '颗粒物产生量', data: { value: '12400', unit: 'kg', source: '在线监测', sourceType: 'platform' } },
                  { item: '废水排放量', data: { value: '48000', unit: '吨', source: '在线监测', sourceType: 'platform' } }
                ] },
                { symbol: 'V', name: '工业总产值', itemLabel: '产值', rows: [
                  { item: '工业总产值', data: { value: '3650000', unit: '万元', source: '自动采集 · 财务系统', sourceType: 'platform' } }
                ] }
              ]
            },
            // ===== 产品绿色化（16%）=====
            {
              category: '产品绿色化', no: '12',
              indicator: '绿色设计',
              formula: '定性：依据 GB/T 24256 开展产品绿色设计并取得环境绩效',
              indicatorType: '正向定性', unit: '—', weight: 8,
              judgeMethod: '报告核查', judgeScore: '满分/0',
              leading: '开展产品绿色设计', baseline: '—',
              rule: '依据 GB/T 24256 提供报告，说明环境因素识别与引入设计情况',
              subs: [
                { symbol: 'G', name: '绿色设计开展情况', itemLabel: '核查项', rows: [
                  { item: '绿色设计报告', data: { value: '已开展', unit: '', source: '绿色设计报告（GB/T 24256）', sourceType: 'manual' } },
                  { item: '环境因素识别与引入设计', data: { value: '已实施', unit: '', source: '绿色设计报告', sourceType: 'manual' } },
                  { item: '环境绩效验证', data: { value: '已取得', unit: '', source: '绿色设计报告', sourceType: 'manual' } }
                ] }
              ]
            },
            {
              category: '产品绿色化', no: '13',
              indicator: '产品碳足迹',
              formula: '定性：依据 GB/T 24067 开展主要产品碳足迹量化并提供报告',
              indicatorType: '正向定性', unit: '—', weight: 8,
              judgeMethod: '报告核查', judgeScore: '满分/0',
              leading: '开展产品碳足迹量化', baseline: '—',
              rule: '依据 GB/T 24067 提供报告，按 GB/T 4754 产品分类归类赋分',
              subs: [
                { symbol: 'P', name: '碳足迹量化情况', itemLabel: '核查项', rows: [
                  { item: '产品碳足迹报告', data: { value: '已开展', unit: '', source: '碳足迹报告（GB/T 24067）', sourceType: 'manual' } },
                  { item: '覆盖产品类别数', data: { value: '3', unit: '类', source: '碳足迹报告', sourceType: 'manual' } }
                ] }
              ]
            },
            // ===== 用地集约化（8%）=====
            {
              category: '用地集约化', no: '14',
              indicator: '土地产出率',
              formula: '土地产出率 = 工业总产值（万元）÷ 用地面积（m²）',
              indicatorType: '正向定量', unit: '万元/m²', weight: 8,
              leading: '行业先进水平', baseline: '行业平均水平',
              rule: '与行业或地方先进水平对标赋分',
              subs: [
                { symbol: 'V', name: '工业总产值', itemLabel: '产值', rows: [
                  { item: '工业总产值', data: { value: '3650000', unit: '万元', source: '自动采集 · 财务系统', sourceType: 'platform' } }
                ] },
                { symbol: 'S', name: '用地面积', itemLabel: '用地', rows: [
                  { item: '厂区用地面积', data: { value: '360000', unit: 'm²', source: '不动产权证', sourceType: 'manual' } }
                ] }
              ]
            }
          ],
          uploadedFiles: [],
          validation: [
            { item: '参数完整性', result: '132项全部齐备', pass: true },
            { item: '合理性', result: '3项异常已修正（扩产核实2项+抄表更正1项）', pass: true },
            { item: '一致性', result: '跨来源交叉核对通过（电费单↔自动采集抄表↔检测报告 比对一致）', pass: true }
          ],
          // 待补充/待确认清单（missing=缺失待补充 / pending=异常待确认 / resolved=已处理；value 为智能体推荐值，用户可确认或修改）
          validationItems: [
            { id: 'v1', name: '外购电力（2025年Q4电量）', stage: '活动数据', status: 'missing', statusLabel: '缺失',
              label: '统一数据底座 2025年10-12月智能电表电量缺失，影响 C购入电 与 E₁ 计算', hint: '电费结算单 / 智能电表导出', value: '2150', unit: '万kWh', modelRef: 'C购入电 · 其他电网电力',
              recommendBasis: '按前三季度自动采集抄表均值推算（全年其他电网电力 8,600 万kWh，Q4 ≈ 2,150 万kWh）' },
            { id: 'v2', name: '天然气低位发热量', stage: '因子参数', status: 'pending', statusLabel: '偏差>3%',
              label: '检测报告热值 38.9 MJ/m³ 与缺省值 37.5 MJ/m³ 偏差 >3%，请确认采用口径', hint: '天然气检测报告（2025年度）', value: '38.9', unit: 'MJ/m³', modelRef: 'C燃烧 · 天然气燃烧' },
            { id: 'v3', name: '碳足迹分析产品类别数', stage: '填报参数', status: 'pending', statusLabel: '口径待确认',
              label: '碳足迹报告口径 2/3 类，B204-1 报表主要产品 3 类，请确认一致', hint: '产品碳足迹报告 2025 版 · B204-1', value: '2', unit: '类', modelRef: '开展产品碳足迹分析占比 · Ncf' },
            { id: 'v4', name: '零碳供应链管理措施符合项数', stage: '填报指标', status: 'missing', statusLabel: '待填报',
              label: '填报指标无计算公式，需逐项核查后填报结果值（对照零碳供应链管理措施清单逐项确认）', hint: '零碳供应链管理台账/管理措施对照清单', value: '4', unit: '项', modelRef: '零碳供应链管理措施符合项数',
              recommendBasis: '对照零碳供应链管理措施清单逐项核查，已匹配 4 项符合措施' },
            { id: 'v5', name: '能碳管理中心功能符合项数', stage: '填报指标', status: 'missing', statusLabel: '待填报',
              label: '对照能碳管理中心 13 项功能要求逐项核查，填报符合项数', hint: '能碳管理中心功能核查表/系统功能截图', value: '9', unit: '项', modelRef: '能碳管理中心功能符合项数',
              recommendBasis: '对照 13 项功能要求核查，已符合 9 项（数据采集/能耗监测/碳排放核算等）' },
            { id: 'v6', name: '碳排放信息披露透明度与质量', stage: '填报指标', status: 'missing', statusLabel: '待填报',
              label: '披露类定性指标，依据证明材料校验判定（可测量 / 可报告 / 可核查）', hint: '碳排放信息披露报告 2025/披露平台截图', value: '可测量·可报告·可核查', unit: '', modelRef: '碳排放信息披露透明度与质量',
              recommendBasis: '依据披露报告校验判定：披露完整、口径清晰，符合可测量、可报告、可核查原则' }
          ]
        },
        2: {
          // 核算明细（11项指标全覆盖：计算指标=构成子模块→输入×因子=结果→验算式；填报/判定指标=填报值+核查来源；全链数值可逐行验算）
          indicators: [
            {
            no: '1', name: '能源消耗强度', category: '能源低碳化',
            indicatorType: '逆向定量', unit: 'tce/万元', weight: 8,
            value: '0.0028', leading: '0.0020', baseline: '0.0040',
            leadingSource: '《汽车整车制造业单位产品能源消耗限额》DB11/T 1080-2023（1级/2级）（演示数据，实际来自标准配置文件）',
            score: 4.8, status: 'improving',
            evidence: '能源统计报表 P11',
            detail: '综合能耗 10,320 tce ÷ 工业总产值 3,650,000 万元 = 0.0028 tce/万元',
            rule: '与行业先进水平（0.0020）或能耗限额1级对标：介于引领值与基准值之间，按线性比例赋分'
            },
            {
            no: '2', name: '碳排放强度', category: '能源低碳化',
            indicatorType: '逆向定量', unit: 'tCO₂/万元', weight: 8,
            value: '0.0152', leading: '0.0100', baseline: '0.0200',
            leadingSource: '汽车行业碳排放强度先进值（行业协会统计年报）（演示数据，实际来自标准配置文件）',
            score: 3.8, status: 'improving',
            evidence: '碳排放核查报告 P18',
            detail: '碳排放总量 55,526 tCO₂ ÷ 工业总产值 3,650,000 万元 = 0.0152 tCO₂/万元',
            rule: '与行业先进水平（0.0100）对标：介于引领值与基准值之间，按线性比例赋分'
            },
            {
            no: '3', name: '可再生能源利用率', category: '能源低碳化',
            indicatorType: '正向定量', unit: '%', weight: 8,
            value: '28.0', leading: '40.0', baseline: '15.0',
            leadingSource: '绿色工厂评价细则·行业先进水平（演示数据，实际来自标准配置文件）',
            score: 4.2, status: 'improving',
            evidence: '绿电交易凭证 P15',
            detail: '可再生能源消耗 2,890 tce ÷ 综合能耗 10,320 tce × 100% = 28.0%',
            rule: '与行业先进水平（40%）对标：介于引领值与基准值之间，按线性比例赋分'
            },
            {
            no: '4', name: '能碳管理系统平台功能符合数量', category: '能源低碳化',
            indicatorType: '正向定量', unit: '项', weight: 6,
            value: '10', leading: '8', baseline: '0',
            leadingSource: 'GB/T 36132-2025 附录B（8 项业务功能）（演示数据，实际来自标准配置文件）',
            score: 6.0, status: 'met',
            evidence: '能碳平台功能核查表 P21',
            detail: '12 项业务功能中符合 10 项（能耗查询、强度计算、分析推荐、能效对标、能流分析、能效平衡、预算管理、碳排放核算、碳足迹核算、碳核查支撑）',
            rule: '达到或优于引领值（8 项）→ 满分'
            },
            {
            no: '5', name: '原材料消耗强度', category: '资源高效化',
            indicatorType: '逆向定量', unit: 't/万元', weight: 8,
            value: '0.0105', leading: '0.0080', baseline: '0.0150',
            leadingSource: '汽车行业原材料消耗先进值（行业协会统计）（演示数据，实际来自标准配置文件）',
            score: 5.1, status: 'improving',
            evidence: '原材料采购台账 P25',
            detail: '主要原材料消耗 38,400 t ÷ 工业总产值 3,650,000 万元 = 0.0105 t/万元',
            rule: '与行业先进水平（0.0080）对标：介于引领值与基准值之间，按线性比例赋分'
            },
            {
            no: '6', name: '取水强度', category: '资源高效化',
            indicatorType: '逆向定量', unit: 'm³/万元', weight: 8,
            value: '0.0578', leading: '0.0400', baseline: '0.0800',
            leadingSource: '《汽车制造业用水定额》地方标准（先进值/通用值）（演示数据，实际来自标准配置文件）',
            score: 4.4, status: 'improving',
            evidence: '取水计量与水费单据 P28',
            detail: '取水量 211,000 m³ ÷ 工业总产值 3,650,000 万元 = 0.0578 m³/万元',
            rule: '与工业用水定额先进值（0.0400）对标：介于先进值与通用值之间，按线性比例赋分'
            },
            {
            no: '7', name: '工业用水重复利用率', category: '资源高效化',
            indicatorType: '正向定量', unit: '%', weight: 8,
            value: '88.0', leading: '95.0', baseline: '80.0',
            leadingSource: '绿色工厂评价细则·行业先进水平（演示数据，实际来自标准配置文件）',
            score: 4.3, status: 'improving',
            evidence: '工业用水台账 P30',
            detail: '重复利用水量 186,000 m³ ÷ (186,000 + 211,000) m³ × 100% = 46.9%（按全厂口径折算 88.0%）',
            rule: '与行业先进水平（95%）对标：介于引领值与基准值之间，按线性比例赋分'
            },
            {
            no: '8', name: '一般工业固体废物综合利用率', category: '资源高效化',
            indicatorType: '正向定量', unit: '%', weight: 6,
            value: '92.0', leading: '98.0', baseline: '85.0',
            leadingSource: '绿色工厂评价细则·行业先进水平（演示数据，实际来自标准配置文件）',
            score: 3.2, status: 'improving',
            evidence: '固废管理台账 P33',
            detail: '综合利用量 16,000 t ÷ (产生量 17,400 t + 往年贮存 0 t) × 100% = 92.0%',
            rule: '与行业先进水平（98%）对标：介于引领值与基准值之间，按线性比例赋分'
            },
            {
            no: '9', name: '生产工艺和设备先进性', category: '生产洁净化',
            indicatorType: '正向定性', unit: '—', weight: 6,
            value: '符合', leading: '采用先进适用技术和设备', baseline: '—',
            leadingSource: '《国家工业节能技术装备推荐目录》（演示数据，实际来自标准配置文件）',
            score: 6.0, status: 'met',
            evidence: '工艺装备清单 P36',
            detail: '已采用国家鼓励的节能、节水、节材、减污、降碳先进工艺技术和设备（3 项均符合推荐目录）',
            rule: '提供证明并符合国家推荐目录、行业规范条件 → 满分'
            },
            {
            no: '10', name: '绿色低碳改造升级项目投资额占比', category: '生产洁净化',
            indicatorType: '正向定量', unit: '%', weight: 4,
            value: '0.36', leading: '1.00', baseline: '0.30',
            leadingSource: '绿色工厂评价细则·行业先进水平（演示数据，实际来自标准配置文件）',
            score: 0.3, status: 'improving',
            evidence: '财务投资台账 P40',
            detail: '近3年改造投资 36,600 万元 ÷ 近3年总产值 10,200,000 万元 × 100% = 0.36%',
            rule: '与行业先进水平（1.00%）对标：介于引领值与基准值之间，按线性比例赋分'
            },
            {
            no: '11', name: '主要污染物产生或排放强度', category: '生产洁净化',
            indicatorType: '逆向定量', unit: 'kg/万元', weight: 6,
            value: '0.0270', leading: '0.0200', baseline: '0.0500',
            leadingSource: '《汽车整车制造业大气污染物排放标准》DB11/ 1228（演示数据，实际来自标准配置文件）',
            score: 4.6, status: 'improving',
            evidence: '污染物检测报告 P43',
            detail: '主要污染物产生量 98,400 kg ÷ 工业总产值 3,650,000 万元 = 0.0270 kg/万元',
            rule: '与行业先进水平（0.0200）对标：介于引领值与基准值之间，按线性比例赋分'
            },
            {
            no: '12', name: '绿色设计', category: '产品绿色化',
            indicatorType: '正向定性', unit: '—', weight: 8,
            value: '已开展', leading: '开展产品绿色设计', baseline: '—',
            leadingSource: 'GB/T 24256 产品绿色设计（演示数据，实际来自标准配置文件）',
            score: 8.0, status: 'met',
            evidence: '绿色设计报告 P46',
            detail: '依据 GB/T 24256 开展产品绿色设计，完成环境因素识别与引入设计，取得良好环境绩效',
            rule: '提供报告并说明环境因素识别与引入设计情况 → 满分'
            },
            {
            no: '13', name: '产品碳足迹', category: '产品绿色化',
            indicatorType: '正向定性', unit: '—', weight: 8,
            value: '已开展', leading: '开展产品碳足迹量化', baseline: '—',
            leadingSource: 'GB/T 24067 产品碳足迹（演示数据，实际来自标准配置文件）',
            score: 8.0, status: 'met',
            evidence: '产品碳足迹报告 P49',
            detail: '依据 GB/T 24067 开展主要产品碳足迹量化，覆盖 3 类产品，已提供报告',
            rule: '提供报告并按 GB/T 4754 产品分类归类 → 满分'
            },
            {
            no: '14', name: '土地产出率', category: '用地集约化',
            indicatorType: '正向定量', unit: '万元/m²', weight: 8,
            value: '7.20', leading: '15.00', baseline: '8.00',
            leadingSource: '地方工业用地控制指标（产出强度）（演示数据，实际来自标准配置文件）',
            score: 0, status: 'fail',
            evidence: '不动产权证 P52',
            detail: '工业总产值 2,592,000 万元 ÷ 用地面积 360,000 m² = 7.20 万元/m²（未达基准值 8.00）',
            rule: '与行业或地方先进水平（15.00）对标：未达基准值（8.00），得 0 分'
            }
          ],
        },
        3: {
          evidence: { total: 132, autoCollected: 96, manualProvided: 36 },
          archived: '报告与档案中心 · 小米汽车工厂-绿色工厂评价指标自评表及证明材料包',
          hash: '7C4A8D09CA3762AF61E59520943DC264',
          // 四级证据链（指标结果 → 计算过程 → 输入参数 → 数据来源，3项核心指标全链可追溯）
          evidenceChain: [
            {
              indicator: '单位能耗碳排放',
              result: '1.27 tCO₂/tce',
              status: '满足基本要求',
              calc: 'I = C ÷ E₁ = 55,526 ÷ 43,677 = 1.27 tCO₂/tce',
              calcVersion: '计算依据：核算公式库 · 排放因子库',
              inputs: [
                { param: 'C燃烧 · 天然气燃烧', detail: '420 万m³ × 21.622 tCO₂/万m³', source: '自动采集 · 燃气表抄表', conf: '高' },
                { param: 'C燃烧 · 柴油燃烧', detail: '96 t × 3.096 tCO₂/t', source: '采购台账 · 柴油出库单', conf: '高' },
                { param: 'C购入电 · 其他电网电力', detail: '8,600 万kWh × 0.5366 tCO₂/MWh', source: '自动采集 · 智能电表', conf: '高' },
                { param: 'E₁ · 综合能源消费量', detail: '43,677 tce（分品种折标）', source: '自动采集 · 能源统计', conf: '高' }
              ]
            },
            {
              indicator: '非化石能源消费占比',
              result: '32.5%',
              status: '满足基本要求',
              calc: 'r = R ÷ E₂ = 13,813 ÷ 42,502 = 32.5%',
              calcVersion: '计算依据：核算公式库 · 排放因子库',
              inputs: [
                { param: 'E物理 · 光伏自发自用', detail: '1,000 万kWh × 折标 0.2856 kgce/kWh', source: '自动采集 · 光伏逆变器采集', conf: '高' },
                { param: 'E物理 · 绿电直连', detail: '3,838 万kWh × 折标 0.2856 kgce/kWh', source: '物理消纳凭证 #GR-2025-0311', conf: '高' },
                { param: 'E₂ · 综合能源消费量（不含原料）', detail: '43,677 − 1,175（原料用能）= 42,502 tce', source: '派生自 E₁ · 原料用能台账', conf: '高' }
              ]
            },
            {
              indicator: '非化石能源电力消费物理认定量占比',
              result: '36.0%',
              status: '满足目标要求',
              calc: 'z = Ez ÷ Q = 4,838 ÷ 13,438 = 36.0%',
              calcVersion: '计算依据：核算公式库 · 排放因子库',
              inputs: [
                { param: 'Ez · 光伏自发自用', detail: '1,000 万kWh（物理消纳）', source: '自动采集 · 光伏逆变器采集', conf: '高' },
                { param: 'Ez · 绿电直连', detail: '3,838 万kWh（物理消纳）', source: '物理消纳凭证 #GR-2025-0311', conf: '高' },
                { param: 'Q · 总用电量', detail: '8,600 + 0 + 1,000 + 3,838 = 13,438 万kWh', source: '自动采集 · 购电来源汇总', conf: '高' }
              ]
            }
          ]
        }
      },

      // ===== 阶段6材料编制Skill配置（输出内容由Skill配置驱动，可扩展；章节按填充方式分级标识） =====
      materialSkillConfig: {
        skillName: '零碳申报材料编制Skill',
        template: '平台模板库 · 绿色工厂评价指标自评表模板（GB/T 36132-2025）',
        coreOutput: {
          name: '绿色工厂评价指标自评表',
          status: '草稿已生成（数据指标自动填充，叙述与规划类章节待企业确认补充）',
          sections: [            {
              title: '', source: '阶段3 指标核算结果 + 佐证材料库', status: '已生成', fillType: 'auto',
              blocks: [
                { type: 'paragraph', text: '企业名称：小米汽车科技有限公司　　评价年度：2025 年度' },
                {
                  type: 'table',
                  caption: '绿色工厂评价指标自评表（GB/T 36132-2025）',
                  dynamic: 'scoreTable',
                  refs: ['阶段3 · 指标核算结果'],
                  columns: [
                    { key: 'category', label: '一级指标（权重）', width: 122 },
                    { key: 'no', label: '序号', width: 46 },
                    { key: 'name', label: '二级指标', width: 150 },
                    { key: 'indicatorType', label: '指标类型', width: 70 },
                    { key: 'unit', label: '单位', width: 78 },
                    { key: 'leading', label: '引领值', width: 84 },
                    { key: 'baseline', label: '基准值', width: 84 },
                    { key: 'weight', label: '权重分值', width: 58 },
                    { key: 'value', label: '实际值', width: 88 },
                    { key: 'score', label: '得分', width: 50 },
                    { key: 'evidence', label: '证明材料索引', width: 118 },
                    { key: 'rule', label: '评分规则', width: 300 }
                  ]
                },
                { type: 'paragraph', refs: ['阶段3 · 指标核算结果'], text: '说明：强度类指标（能源消耗强度、碳排放强度、原材料消耗强度、取水强度、污染物强度）按产品单位口径计算，可在阶段2 切换为产值口径；引领值、基准值按行业标准或统计值配置。' }
              ]
            },
          ]
        },
        attachments: []
      },

      // ===== 算力设施案例的报告编制配置（与制造版同构，内容按绿算智算中心口径编写；loadCase 时整体切换） =====
      computingMaterialSkillConfig: {
        skillName: '零碳申报材料编制Skill',
        template: '平台模板库 · 绿色工厂评价指标自评表模板（GB/T 36132-2025）',
        coreOutput: {
          name: '绿色工厂评价指标自评表',
          status: '草稿已生成（数据指标自动填充，叙述与规划类章节待企业确认补充）',
          sections: [
            {
              title: '基本信息表', source: '组织资源库 · 阶段1（信息带出；亮点AI草稿；承诺固定模板）', status: '草稿待确认', fillType: 'draft',
              blocks: [
                {
                  type: 'table',
                  caption: '基本信息表',
                  dynamic: 'baseInfo',
                  refs: ['阶段1 · 组织资源库'],
                  columns: [
                    { key: 'field', label: '项目', width: 180 },
                    { key: 'value', label: '内容' }
                  ]
                },
                { type: 'paragraph', refs: ['阶段4 · 指标核算结果'], text: '绿色工厂建设亮点（300字以内）：\n【AI草稿】围绕新五化建设路径——能源低碳化：单位产品综合能耗 0.086 tce/件、可再生能源使用率 28%、已通过 ISO 50001 认证；资源高效化：一般固废综合利用率 92%、工业用水重复利用率 88%、资源产出率 1.85 万元/吨标煤；生产洁净化：单位产品污染物产生量 0.82 kg/件、已通过清洁生产审核；产品绿色化：绿色设计产品占比 45%、绿色物料使用率 68%、产品可回收利用率 72%；用地集约化：容积率 1.35、单位用地面积产值 520 万元/亩。' },
                { type: 'paragraph', text: '单位承诺：\n近三年不存在下列情况：发生较大及以上级别的安全（含网络安全、数据安全、生产安全等）、质量、环境污染等事故；从事《中华人民共和国反垄断法》规定的垄断行为；在国务院及有关部门相关督查工作中被发现存在严重问题；被列入工业节能监察整改名单且未按要求完成整改；被列入电信业务经营不良名单和失信名单；受到有关行政主管部门比较重大以上行政处罚；被列为失信被执行人；因专利权、商标权、著作权、所有权、使用权等权属纠纷被生效法律文书认定应承担法律责任。\n\n绿色工厂建设在不影响电力安全供应和系统稳定运行的前提下进行。所提交的所有材料均真实、有效，愿接受并积极配合主管部门的监督抽查和核验。如有违反，愿承担由此产生的相应责任。\n\n法定代表人签字：____________　　　　（单位公章）：____________\n　　　　　　　　年　　月　　日' }
              ]
            },
            {
              title: '四、数据溯源说明（四级证据链）', source: '阶段2 数据清单 + 阶段4 溯源自动生成', status: '已生成', fillType: 'auto',
              blocks: [
                { type: 'paragraph', refs: ['阶段2 · 数据采集', '阶段4 · 数据溯源'], text: '（一）四级证据链\n本次评价的全部指标值均构建「指标结果 → 计算过程 → 输入参数 → 数据来源」四级证据链，支撑结果复现与过程审计。\n· 指标结果：14 项指标值与得分（见第二章）\n· 计算过程：各项指标的计算公式与代入数值（见阶段3 指标详情）\n· 输入参数：活动数据、因子、产量等原始参数（见阶段2 数据清单）\n· 数据来源：统一数据底座自动采集 + 材料识别/人工填写，均已关联佐证材料\n\n（二）数据质量说明\n· 自动采集数据：来自智能电表、流量计、MES 系统、财务系统，按采集频率自动留痕\n· 材料数据：来自检测报告、采购台账、合同等，已上传并关联页码\n· 全部参数经完整性、合理性、来源三重校验' }
              ]
            },
            {
              title: '五、改进建议（差距项与提升方向）', source: '阶段3 核算结果 + 差距分析自动生成', status: '草稿待补充', fillType: 'draft',
              blocks: [
                { type: 'paragraph', refs: ['阶段3 · 指标核算结果'], text: '（一）优先改进项（未达标）\n用地集约化：土地产出率 7.20 万元/m²（基准值 8.00）。建议：① 优化产线布局、提升产能利用率，提高单位面积产出；② 梳理闲置用地，提升土地集约利用水平。\n\n（二）持续提升项（改进中）\n能源低碳化：能源消耗强度 0.1962 tce/辆、碳排放强度 0.0152 tCO₂/万元，建议扩大绿电交易规模、推进节能改造；可再生能源利用率 28.0%，建议新增分布式光伏。\n资源高效化：工业用水重复利用率 88.0%，建议完善中水回用系统；一般工业固废综合利用率 92.0%，建议拓展固废资源化渠道。\n生产洁净化：近三年绿色低碳改造投资占比 0.36%，建议加大改造投入。\n\n（三）保持项（已达标）\n产品绿色化：绿色设计与产品碳足迹量化已开展，建议持续完善并覆盖更多产品类别。' }
              ]
            },
            {
              title: '六、证明材料目录', source: '数据溯源自动生成', status: '已生成', fillType: 'auto',
              blocks: [
                { type: 'paragraph', refs: ['阶段2 · 数据采集', '阶段4 · 数据溯源'], text: '证明材料与指标、资格条件为多对多引用关系，一份材料可同时证明多个条件。全部参数经三重校验（完整性、合理性、来源），自动采集数据来自统一数据底座，材料数据已上传并关联页码。' },
                {
                  type: 'table',
                  caption: '主要证明材料目录',
                  dynamic: 'evidenceTable',
                  columns: [
                    { key: 'no', label: '序号', width: 60 },
                    { key: 'name', label: '材料名称', width: 260 },
                    { key: 'type', label: '材料类型', width: 110 },
                    { key: 'refs', label: '关联指标/条件', width: 200 },
                    { key: 'page', label: '页码', width: 70 }
                  ]
                }
              ]
            },
            {
              title: '一、企业概况（单位情况/主要产品/生产工艺）', source: '阶段1资源库 + 阶段3近三年数据；近三年数据自动，工艺等行业自述内容由企业提供、AI整理成稿', status: '草稿待补充', fillType: 'draft',
              blocks: [
                { type: 'paragraph', refs: ['阶段1 · 基本信息', '阶段3 · 数据采集', '阶段4 · 指标核算结果'], text: '（一）单位情况\n绿算智算中心位于贵州省贵安新区算力大道 88 号，是一家面向云计算与智算服务的算力设施运营单位，拥有独立供配电和制冷系统，标准机架 4,500 个，已入选国家绿色算力设施名单。\n\n（二）设施与用能情况\n算力设施以电力消费为主，2025 年总用电量 12,000 万千瓦时，其中其他电网电力 8,000 万千瓦时、光伏自发自用 500 万千瓦时、绿电直连 3,500 万千瓦时（物理消纳凭证 #GR-2025-0512）；备用柴油发电 100 吨。电能利用效率 PUE 1.25，达 GB 40879 2级。\n\n（三）能源利用情况\n2025 年综合能源消费量 34,418 吨标准煤（等价值，无原料用能）。\n\n（四）碳排放情况\n2025 年边界内二氧化碳排放总量约 43,238 吨，其中购入电力排放 42,928 吨、备用柴油发电排放 310 吨。单位能耗碳排放 1.26 tCO₂/tce，非化石能源消费占比 33.2%，非化石能源电力消费物理认定量占比 33.3%。' }
              ]
            },
            {
              title: '一、评价指标核算（五化 14 项）', source: '阶段4指标核算结果 + 佐证材料库；指标情况自动，已开展工作事实由企业提供、AI生成草稿', status: '草稿待补充', fillType: 'draft',
              blocks: [
                { type: 'paragraph', refs: ['阶段4 · 指标核算结果'], text: '（一）科学算碳\n已建立覆盖全部算力设备的能碳计量体系，按可测量、可报告、可核查原则开展碳排放计量统计；118 项参数全程留痕，数据来源、统计口径、计算过程可追溯。【待企业补充：核算体系运行具体情况】\n\n（二）源头减碳\n绿电直连 3,500 万千瓦时（物理消纳认定）+ 分布式光伏自发自用 500 万千瓦时，非化石能源消费占比 33.2%。\n\n（三）过程脱碳\n节能装备应用占比 82%，PUE 1.25 达 GB 40879 2级（≤1.3）。\n\n（四）协同降碳\n算力设施不适用产品碳足迹类指标（2.1/2.3/3.1 不适用），零碳供应链管理措施符合 3 项。\n\n（五）智能控碳\n能碳管理中心能源数据自动采集率 96%，功能符合项数 11/13 项。\n\n（六）碳抵销和信息披露\n碳排放信息披露透明度与质量符合可测量、可报告、可核查原则。【待企业补充：各路径已开展的具体工作与建设亮点】\n\n对照《国家级绿色工厂建设评估指标体系》，3 项核心指标均满足基本要求（目标要求在建设期内达成）；其余指标中 2 项不适用，其余不设量化要求，验收时按较申报时持续改善核查（指标明细详见第三章）。' }
              ]
            },
            {
              title: '三、评价结论（综合得分与等级）', source: '阶段4达标判定 + 阶段5差距分析；可达性分析AI草稿，建设目标由企业确认的表1目标生成', status: '草稿待决策', fillType: 'draft',
              blocks: [
                { type: 'paragraph', refs: ['阶段4 · 指标核算结果', '阶段5 · 建设目标'], text: '（一）能源消费、碳排放趋势及目标可达性分析\n以近三年能源消费和碳排放现状数据为基础，结合绿电直连扩容、光伏扩容与液冷改造、高效 UPS 替换等举措，建设期内绿电消费比例持续提升、碳排放强度逐年下降：单位能耗碳排放由 1.26 降至 0.20 tCO₂/tce、非化石能源消费占比由 33.2% 提升至 95%、非化石能源电力消费物理认定量占比由 33.3% 提升至 38%。经测算，核心指标目标要求可达，实现路径与阶段安排如下（详见（二）建设目标）。' },
                
                
                {
                  type: 'table',
                  caption: '表1 国家级绿色工厂建设期评估指标年度目标表',
                  dynamic: 'targetTable',
                  refs: ['阶段4 · 指标核算结果', '阶段5 · 建设目标'],
                  columns: [
                    { key: 'category', label: '类别', width: 110 },
                    { key: 'indicator', label: '指标', width: 210 },
                    { key: 'unit', label: '单位', width: 70 },
                    { key: 'y2025', label: '2025 实际值' },
                    { key: 'y2026', label: '2026 年' },
                    { key: 'y2027', label: '2027 年' },
                    { key: 'y2028', label: '目标达成' },
                    { key: 'remark', label: '备注', width: 90 }
                  ]
                },
                { type: 'paragraph', text: '注：标“*”的指标为核心指标。年度目标值经企业于建设目标设定环节逐项确认，逐年下降不回退、期满达标；建设单位应按年度通过管理平台报送建设进展、指标变化情况及有关绩效信息，备注说明栏填写指标不适用及其他特殊情况。' },
                
                {
                  type: 'table',
                  caption: '主要证明材料目录',
                  refs: ['阶段6 · 数据溯源'],
                  columns: [
                    { key: 'no', label: '编号', width: 70 },
                    { key: 'name', label: '证明材料名称', width: 260 },
                    { key: 'page', label: '页码' }
                  ],
                  rows: [
                    { no: 'CL-01', name: '营业执照副本', page: 'P1' },
                    { no: 'CL-02', name: '电力采购合同（分电源）', page: 'P3' },
                    { no: 'CL-03', name: 'PUE 电能利用效率检测报告', page: 'P8' },
                    { no: 'CL-04', name: '绿电直连物理消纳凭证（#GR-2025-0512）', page: 'P12' },
                    { no: 'CL-05', name: '国家绿色算力设施名单公示文件', page: 'P16' },
                    { no: 'CL-06', name: '碳排放信息披露报告 2025', page: 'P19' },
                    { no: 'CL-07', name: '能碳管理中心功能核查表', page: 'P22' }
                  ]
                }
              ]
            }
          ]
        },
        attachments: []
      },

      // ===== 阶段交互操作状态 =====
      phaseOps: {
        resultConfirmed: false,
        goalConfirmed: false,
        planGenerated: false,
        adoptedMeasures: [],
        dataTab: 'validation'
      },

      // ===== 阶段6整篇编制（通读 + 就地编辑一体弹窗） =====
      fullPreviewVisible: false,
      isPolishing: false,
      isReportArchived: false,
      // 因上游阶段变更需重新确认的下游阶段索引（方案A：可编辑回溯 + 失效标记）
      invalidatedStages: [],
      // 四道关键确认留痕（谁/何时/确认了什么，方案 saveConfirmRecord Tool）
      confirmRecords: [],

      // ===== 评价体系（绿色工厂5大类指标） =====
      evalCategories: [
        { name: '能源低碳化', icon: 'el-icon-lightning', color: '#52c41a', indicators: ['单位产品综合能耗', '可再生能源使用率', '碳排放强度', '能源管理体系'] },
        { name: '资源高效化', icon: 'el-icon-refresh', color: '#722ED1', indicators: ['一般固废综合利用率', '工业用水重复利用率', '余热余压利用', '资源产出率'] },
        { name: '生产洁净化', icon: 'el-icon-cpu', color: '#00A8A0', indicators: ['单位产品污染物产生量', '清洁生产审核', '工艺装备水平'] },
        { name: '产品绿色化', icon: 'el-icon-box', color: '#ED7B2F', indicators: ['绿色设计产品占比', '绿色物料使用率', '产品可回收利用率', '产品碳足迹'] },
        { name: '用地集约化', icon: 'el-icon-location', color: '#0067FE', indicators: ['容积率', '单位用地面积产值', '建筑密度'] },
      ],

      // ===== 指标分类（两类：按结果产生方式划分；输入参数的采集方式为计算指标内部的参数级属性） =====
      indicatorTypes: [
        { type: 'calc', name: '计算指标', source: '有计算公式', calcMethod: '系统按公式计算（输入参数可自动采集与人工填报混合）', example: '单位能耗碳排放、非化石能源消费占比、能源数据自动采集率' },
        { type: 'direct', name: '填报指标', source: '无计算公式，需逐项核查', calcMethod: '用户填报结果值（说明来源/上传材料）', example: '零碳供应链管理措施符合项数、能碳管理中心功能符合项数、碳排放信息披露透明度与质量' }
      ],

      // ===== 申报场景 =====
      scenarios: [
        { code: 'ZC', name: '绿色工厂', starMax: 5, standard: 'GB/T 36132 绿色工厂评价通则' }
      ]
    }
  },

  computed: {
    // ===== 标准库（computed）=====
    currentStandard() {
      return STANDARD_LIBRARY['GB/T 36132-2025'] || null
    },
    standardIndicators() {
      const std = this.currentStandard
      return std ? std.indicators : []
    },
    standardCategories() {
      const std = this.currentStandard
      return std ? std.categories : []
    },
      // 评价年度选择器：仅可选当前年之前的年份
      yearPickerOptions() {
        const now = new Date()
        const thisYearStart = new Date(now.getFullYear(), 0, 1).getTime()
        return {
          disabledDate(time) {
            return time.getTime() >= thisYearStart
          }
        }
      },
      // 评价年度可选范围（保留兼容）
      // 申报资格状态（标题提醒）
      qualificationStatus() {
        const q = this.phaseDetails[0] && this.phaseDetails[0].qualification
        if (!q) return { text: '', type: 'info', total: 0, pass: 0 }
        const all = [...(q.autoChecks || []), ...(q.manualChecks || [])]
        const total = all.length
        let pass = 0
        let fail = 0
        let wait = 0
        all.forEach(c => {
          const r = this.judgeQualiPass(c)
          if (r === true) pass++
          else if (r === false) fail++
          else wait++
        })
        if (fail) return { text: '✗ ' + fail + ' 项不符（可继续试算）', type: 'danger', total, pass, fail, wait }
        if (wait) return { text: '⚠ ' + wait + ' 项待确认', type: 'warning', total, pass, fail, wait }
        return { text: '✓ ' + pass + '/' + total + ' 通过', type: 'success', total, pass, fail, wait }
      },
      // 独立计量的产品（阶段2 按产品建子分组）
      meteredProductList() {
        return (this.products || []).filter(p => p.metered && p.name)
      },
      // 分摊计量的产品（合并成一个分组）
      sharedProductList() {
        return (this.products || []).filter(p => !p.metered && p.name)
      },
      // 产品定义口径（自动推断，不暴露给用户）
      productDefinition() {
        const n = (this.products || []).length
        if (n <= 1) return 'single'
        return 'main'
      },
      // 产品构成展示文本（从产品产量参数汇总）
      productComposeText() {
        const groups = (this.phaseDetails[1] && this.phaseDetails[1].collectModel) || []
        const found = []
        groups.forEach(g => {
          (g.subs || []).forEach(s => {
            (s.rows || []).forEach(r => {
              if (/产量|产品数量|整车/.test(r.item) && r.data && r.data.value) {
                found.push(r.item + ' ' + r.data.value + (r.data.unit || ''))
              }
            })
          })
        })
        if (!found.length) return '未定义'
        const uniq = [...new Set(found)]
        return uniq.join(' · ') + '（' + (this.productDefinition === 'main' ? '主产品合计' : this.productDefinition === 'split' ? '分产品核算' : '单一产品') + '）'
      },
      // 阶段2 按一级指标分组
      collectByCategory() {
        const groups = (this.phaseDetails[1] && this.phaseDetails[1].collectModel) || []
        const order = ['能源低碳化', '资源高效化', '生产洁净化', '产品绿色化', '用地集约化']
        const map = {}
        groups.forEach(g => {
          const c = g.category || '其他'
          if (!map[c]) map[c] = { category: c, items: [], missing: 0, pending: 0 }
          map[c].items.push(g)
          const rows = this.flattenParams(g)
          rows.forEach(r => {
            const st = this.paramStatus(r)
            if (st.text === '待补充') map[c].missing++
            else if (st.text === '待确认') map[c].pending++
          })
        })
        return order.filter(c => map[c]).map(c => map[c])
      },
      // 阶段3 指标（跟随强度口径动态调整指标1）
      dynamicIndicators() {
        const inds = (this.phaseDetails[2] && this.phaseDetails[2].indicators) || []
        if (this.intensityBasis !== 'product') return inds
        const g = ((this.phaseDetails[1] && this.phaseDetails[1].collectModel) || []).find(x => x.no === '1')
        if (!g) return inds
        // 综合能耗 = 独立计量产品明细 + 共用计量项
        let energy = this.sharedTotal(g)
        Object.keys(g.productItems || {}).forEach(k => { energy += this.itemSum(g, k) })
        // 总产量
        let output = 0
        Object.keys(g.productOutputs || {}).forEach(k => {
          const ov = g.productOutputs[k]
          output += parseFloat(String(ov && ov.value !== undefined ? ov.value : ov)) || 0
        })
        const val = output ? (energy / output).toFixed(4) : ''
        return inds.map(i => {
          if (i.no !== '1') return i
          return Object.assign({}, i, {
            value: val,
            unit: 'tce/辆',
            detail: '综合能耗 ' + energy.toFixed(1) + ' tce ÷ 总产量 ' + output + ' 辆 = ' + val + ' tce/辆'
          })
        })
      },
      // 阶段2 待处理统计（三态：待补充 / 待确认）
      collectPendingCount() {
        const groups = (this.phaseDetails[1] && this.phaseDetails[1].collectModel) || []
        let missing = 0
        let pending = 0
        const check = obj => {
          const v = obj && obj.value !== undefined ? obj.value : obj
          if (!v || v === '—') missing++
          else if (obj && obj.confirmed !== true) pending++
        }
        groups.forEach(g => {
          if (g.productMode) {
            // 独立计量产品明细
            Object.keys(g.productItems || {}).forEach(k => {
              const arr = g.productItems[k]
              if (Array.isArray(arr)) arr.forEach(check)
            })
            // 共用计量项
            if (Array.isArray(g.sharedItems)) g.sharedItems.forEach(check)
            // 各产品产量
            Object.keys(g.productOutputs || {}).forEach(k => check(g.productOutputs[k]))
          } else {
            // 普通指标参数
            if (Array.isArray(g.subs)) {
              g.subs.forEach(sb => {
                if (Array.isArray(sb.rows)) sb.rows.forEach(r => check(r.data))
              })
            }
          }
        })
        return { missing, pending, total: missing + pending }
      },
      // ===== 绿色工厂综合评分（百分制 + 星级 + 等级）=====
      greenScore() {
        const inds = this.dynamicIndicators || []
        const total = inds.reduce((a, i) => a + (parseFloat(i.score) || 0), 0)
        return total.toFixed(1)
      },
      // 指标状态统计
      indicatorStatusCount() {
        const inds = this.dynamicIndicators || []
        return {
          met: inds.filter(i => i.status === 'met').length,
          improving: inds.filter(i => i.status === 'improving').length,
          fail: inds.filter(i => i.status === 'fail').length
        }
      },
      // 报告生成状态（动态统计）
      reportGeneratedText() {
        const secs = (this.materialSkillConfig && this.materialSkillConfig.coreOutput && this.materialSkillConfig.coreOutput.sections) || []
        const total = secs.length
        const done = secs.filter(s => s.status === '已生成').length
        const pending = total - done
        if (!total) return '未生成'
        if (pending === 0) return '全部已生成（' + total + ' 章）'
        return '已生成 ' + done + ' 章，' + pending + ' 章待补充'
      },
      // 评价结论（达标/改进/未达标 + 最低短板）
      evalConclusion() {
        const inds = this.dynamicIndicators || []
        const met = inds.filter(i => i.status === 'met').length
        const imp = inds.filter(i => i.status === 'improving').length
        const fail = inds.filter(i => i.status === 'fail').length
        const cats = (this.indicatorsByCategory || []).slice().sort((a, b) => a.rate - b.rate)
        return {
          total: inds.length,
          met: met,
          imp: imp,
          fail: fail,
          worst: cats.length ? cats[0] : null
        }
      },
      // 环形进度颜色（有等级用等级色，无等级用中性蓝）
      ringColor() {
        if (this.scoreLevel && this.scoreLevel.color) return this.scoreLevel.color
        const s = parseFloat(this.greenScore) || 0
        if (s >= 85) return '#52c41a'
        if (s >= 70) return '#0067FE'
        if (s >= 60) return '#faad14'
        return '#f56c6c'
      },
      // 指标按一级分类分组（含组小计，分类来自标准配置）
      indicatorsByCategory() {
        const inds = this.dynamicIndicators || []
        const cats = this.standardCategories || []
        return cats.map(cat => {
          const items = inds.filter(i => i.category === cat.name)
          const score = items.reduce((a, i) => a + (parseFloat(i.score) || 0), 0)
          const w = items.reduce((a, i) => a + (parseFloat(i.weight) || 0), 0)
          return {
            name: cat.name,
            weight: cat.weight,
            items: items,
            score: score.toFixed(1),
            subWeight: w,
            rate: cat.weight ? Math.min(100, (score / cat.weight) * 100) : 0
          }
        }).filter(g => g.items.length > 0)
      },
      // 一级指标得分（按分类汇总，分类来自标准配置）
      categoryScores() {
        const inds = this.dynamicIndicators || []
        const cats = this.standardCategories || []
        return cats.map(cat => {
          const items = inds.filter(i => i.category === cat.name)
          const score = items.reduce((a, i) => a + (parseFloat(i.score) || 0), 0)
          return {
            name: cat.name,
            score: score.toFixed(1),
            weight: cat.weight,
            rate: cat.weight ? Math.min(100, (score / cat.weight) * 100) : 0,
            failCount: items.filter(i => i.status === 'fail').length,
            impCount: items.filter(i => i.status === 'improving').length
          }
        })
      },
      // 总得分等级（从标准配置读取；未配置则不显示分级）
      scoreLevel() {
        const levels = (this.currentStandard && this.currentStandard.evaluationLevels) || []
        if (!levels.length) return null
        const s = parseFloat(this.greenScore) || 0
        const sorted = levels.slice().sort((a, b) => b.min - a.min)
        for (const lv of sorted) {
          if (s >= lv.min) return { text: lv.name, desc: lv.desc || '', color: lv.color || '#0067FE', cls: 'lv-' + lv.name }
        }
        return null
      },
      // 权重合计
      totalWeight() {
        return (this.dynamicIndicators || []).reduce((a, i) => a + (parseFloat(i.weight) || 0), 0)
      },
      greenStars() {
        const v = this.greenScore
        if (v >= 90) return 5
        if (v >= 80) return 4
        if (v >= 70) return 3
        if (v >= 60) return 2
        return 1
      },
      greenStarsText() {
        const n = this.greenStars
        return '★'.repeat(n) + '☆'.repeat(5 - n)
      },
      greenLevel() {
        const v = this.greenScore
        if (v >= 90) return '国家级绿色工厂（推荐）'
        if (v >= 80) return '省级绿色工厂（推荐）'
        if (v >= 70) return '市级绿色工厂（可申报）'
        return '需改进后申报'
      },
      greenScoreSummary() {
        const inds = (this.phaseDetails[2] && this.phaseDetails[2].indicators) || []
        return {
          total: inds.length,
          met: inds.filter(i => i.status === 'met').length,
          improving: inds.filter(i => i.status === 'improving').length,
          ongoing: inds.filter(i => i.status === 'ongoing').length,
          na: inds.filter(i => i.status === 'na').length
        }
      },

    // 任务激活态：最新一条回复消息的快捷按钮实时计算（随 goalConfirmed 等状态即时刷新，替代消息内静态快照）
    activeSuggestions() {
      return this.getReplySuggestions()
    },
    currentPhase() {
      return this.phases[this.currentStepIndex] || {}
    },
    // 新建任务：企业名称按主体类型自动带出（从对应案例数据的组织资源库 baseInfo 读取）
    autoFactoryName() {
      const src = (this.newTaskForm.scene || 'manufacturing') === 'computing' ? this.computingPhaseDetails : this.phaseDetails
      const bi = src && src[0] && src[0].qualification ? src[0].qualification.baseInfo : []
      const name = bi.find(x => x.label === '单位名称')
      return name ? name.value : ''
    },
    // 阶段5：建设目标按核心/自主目标分组（目标设定、年度分解、差距分析三表共用）
    phase5GoalGroups() {
      const rows = (this.phaseDetails[3] && this.phaseDetails[3].goals ? this.phaseDetails[3].goals.rows : []) || []
      return { core: rows.filter(r => r.core), self: rows.filter(r => !r.core) }
    },
    phase5GapGroups() {
      const p4 = this.phaseDetails[3] || {}
      const gaps = p4.gaps || []
      const goalOf = n => ((p4.goals && p4.goals.rows ? p4.goals.rows.find(r => r.name === n) : null) || {})
      return {
        core: gaps.filter(x => goalOf(x.name).core),
        self: gaps.filter(x => !goalOf(x.name).core)
      }
    },
    // 阶段5：整数型指标（项数类，integer=true）目标值失焦取整——项数不允许出现小数
    roundGoal(g, field, mi) {
      if (!g || !g.integer) return
      const raw = field === 'mids' ? g.mids[mi] : g[field]
      const n = parseFloat(raw)
      if (!isNaN(n) && String(Math.round(n)) !== raw) {
        const v = String(Math.round(n))
        if (field === 'mids') this.$set(g.mids, mi, v)
        else g[field] = v
      }
    },
    // 阶段5：建设期年度目标年份列表（起始年起至期满年前一年；单年建设期为空）
    goalMidYears() {
      const g = this.phaseDetails[3].goals
      const arr = []
      for (let y = g.startYear; y < g.endYear; y++) arr.push(y)
      return arr
    },
    // 阶段5：建设期结束年份选择器可选范围（不早于起始年 · 不晚于 2030 政策上限）
    goalEndYearPickerOptions() {
      const g = this.phaseDetails[3].goals
      return {
        disabledDate(time) {
          const y = time.getFullYear()
          return y < g.startYear || y > 2030
        }
      }
    },
    // 新建任务：当前所选申报依据（决定评价年度/标准/资格条件）
    newTaskPlan() {
      return this.planVersions.find(v => v.id === this.newTaskForm.planId) || this.planVersions[0]
    },
    // 评价年度选择器可选范围：政策评价年度前推3年 ~ 当前年份（稳定计算属性，供 picker-options 引用）
    baselineYearPickerOptions() {
      const std = Number(this.newTaskPlan.baselineYear) || new Date().getFullYear() - 1
      const now = new Date().getFullYear()
      const min = new Date(std - 3, 0, 1)
      const max = new Date(now + 1, 0, 1)
      return {
        disabledDate: d => d < min || d >= max
      }
    },
    // 阶段6：数据溯源报告参数明细（从阶段3采集清单真实聚合——每行=指标/子模块/参数/活动数据/数据来源/因子/因子来源）
    evidenceParamRows() {
      const rows = []
      const cm = (this.phaseDetails[1] && this.phaseDetails[1].collectModel) || []
      cm.forEach(m => {
        m.subs.forEach(sub => {
          (sub.rows || []).forEach(r => {
            rows.push({
              indicator: m.indicator,
              sub: sub.symbol + ' ' + sub.name,
              item: r.item,
              data: r.data ? (r.data.value + (r.data.unit ? ' ' + r.data.unit : '')) : '—',
              dataSource: r.data ? r.data.source : '—',
              factor: r.factor ? r.factor.value + (r.factor.unit ? ' ' + r.factor.unit : '') : (r.factor || '—'),
              factorSource: r.factor && r.factor.source ? r.factor.source : (typeof r.factor === 'string' ? '因子库' : '—')
            })
          })
        })
      })
      return rows
    },
    // 阶段5：建设期结束年份（v-model 受控：get 读 goals，set 进 changeGoalPeriod 联动重算）
    goalEndYearModel: {
      get() {
        return String(this.phaseDetails[3].goals.endYear)
      },
      set(v) {
        if (v) this.changeGoalPeriod(Number(v))
      }
    },
    // 阶段统一确认栏配置（存在统一确认内容的阶段在底部悬浮显示）
    stageConfirmConfig() {
      const i = this.currentStepIndex
      // 回看历史阶段（可编辑）：提供「保存修改」按钮，保存后下游已确认阶段标记为需重新确认
      if (i < this.maxStepIndex) {
        return {
          label: '保存修改',
          icon: 'el-icon-check',
          hint: '已编辑「' + this.phases[i].name + '」，保存后下游阶段需重新确认',
          type: 'warning',
          action: () => this.saveHistoryEdit()
        }
      }
      if (i === 1) {
        return {
          label: '数据确认',
          icon: 'el-icon-check',
          hint: this.collectPendingCount.total ? ('尚有 ' + this.collectPendingCount.total + ' 项待处理，可点「全部确认」或逐项确认') : '数据收集与校验完成，确认后进入指标核算与评价',
          type: 'primary',
          action: () => {
            if (this.collectPendingCount.total) {
              this.$message.warning('尚有 ' + this.collectPendingCount.total + ' 项待处理，请先确认（可点「全部确认」）')
              return
            }
            this.nextPhase()
          }
        }
      }
      if (i === 2) {
        return {
          label: '确认核算结果并进入材料编制',
          icon: 'el-icon-right',
          hint: '确认 14 项指标核算结果与得分无误后，进入数据溯源与材料归档',
          type: 'primary',
          action: () => {
            this.recordConfirm('confirm3', '核算与评价结果确认', '确认 14 项指标核算结果与对标赋分结果')
            this.nextPhase()
          }
        }
      }
      if (i === 3) {
        return {
          label: '完成自评',
          icon: 'el-icon-check',
          hint: '材料已生成，可归档下载',
          type: 'success',
          action: () => {
            this.recordConfirm('confirm4', '材料审核', '确认申报材料与证据链完整')
            this.$message.success('申报材料已确认，可归档下载')
          }
        }
      }
      if (i === 0) {
        return {
          label: '确认并进入数据收集与校验',
          icon: 'el-icon-right',
          hint: '完成右侧企业信息与申报资格条件确认后推进',
          type: 'primary',
          action: () => {
            const c = this.qualiConclusion()
            if (c.ok === false) {
              // 企业内部辅助工具：不硬阻断，提示风险后由用户决定是否继续（试算）
              this.$confirm('存在不满足的静态硬资格条件，可继续推进（试算模式），但正式申报前需完成整改。是否继续？', '资格条件提示', {
                confirmButtonText: '继续（试算）',
                cancelButtonText: '先去整改',
                type: 'warning'
              }).then(() => {
                this.recordConfirm('confirm1', '资格与信息确认', '确认企业信息 11 项与资格条件核验结果（含未满足项，试算模式）')
                this.nextPhase()
              }).catch(() => {})
              return
            }
            this.recordConfirm('confirm1', '资格与信息确认', '确认企业信息 11 项与资格条件核验结果')
            this.nextPhase()
          }
        }
      }
      if (i === 1) {
        return {
          label: '确认核算模型并进入数据收集',
          icon: 'el-icon-right',
          hint: '确认核算模型无误后进入数据收集与校验',
          type: 'primary',
          action: () => {
            this.recordConfirm('confirm2', '核算模型确认', '确认核算模型三级结构、指标归属与计算路径')
            this.nextPhase()
          }
        }
      }
      if (i === 4 && !this.phaseOps.goalConfirmed) {
        return {
          label: '确认建设目标',
          icon: 'el-icon-aim',
          hint: '确认期末目标与年度目标轨迹后，将对照目标给出优化建议（目标可调高，不得低于官方目标要求）',
          type: 'primary',
          action: () => this.toggleGoalConfirm()
        }
      }
      if (i === 4 && this.phaseOps.adoptedMeasures.length > 0) {
        return {
          label: '生成改善计划并进入材料编制',
          icon: 'el-icon-document',
          hint: '采纳改善措施后生成改善计划，随即进入阶段四数据溯源与材料归档',
          type: 'primary',
          action: () => this.generatePlan()
        }
      }
      if (i === 5) {
        // 阶段6为最终阶段：无「推进」动作，底部操作（存档/导出/专家复核）由右侧内容区操作面板承载
        return null
      }
      return null
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
    formattedTokens() {
      const t = this.estimatedTokens
      if (t >= 10000) return (t / 10000).toFixed(1) + '万 tokens'
      if (t >= 1000) return (t / 1000).toFixed(1) + 'k tokens'
      return t + ' tokens'
    },
    progressPercent() {
      return Math.round((this.maxStepIndex / (this.phases.length - 1)) * 100)
    },
    sortedTaskList() {
      return [...this.taskList].sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return 1
        if (a.status !== 'completed' && b.status === 'completed') return -1
        return new Date(b.updatedAt) - new Date(a.updatedAt)
      })
    }
  },

  methods: {
    // 单击参数行：聚焦 + 左侧联动引导（兼容产品明细 / 普通参数两种结构）
    focusCollectParam(grp, it, productName) {
      this.currentCollectIndicator = grp.indicator
      const key = grp.indicator + '-' + (productName || '') + '-' + (it.item || '')
      this.currentCollectParam = key
      // 兼容：产品明细 it.value / 普通参数 it.data.value
      const d = it.data || it
      const value = d.value
      const unit = d.unit
      const src = d.source
      const srcType = d.sourceType
      const factorVal = it.factor && it.factor.value !== undefined ? it.factor.value : it.factor
      const factorUnit = (it.factor && it.factor.unit) || it.factorUnit || ''
      const st = this.itemConfirmStatus({ value: value, confirmed: d.confirmed })
      const calcNum = factorVal ? (parseFloat(value || 0) * parseFloat(factorVal)) : null
      const calc = calcNum !== null && !isNaN(calcNum)
        ? calcNum.toFixed(1) + ' ' + (grp.sumUnit || '')
        : (value || '—')
      const html = '<strong style="color:#0067FE;">【阶段2 · 数据收集】当前参数</strong><br/>' +
        '<div style="padding:10px 12px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;margin:8px 0;line-height:1.9;">' +
        '<b style="font-size:13px;">' + (it.item || '') + '</b>' +
        (productName ? ' <span style="color:#64748b;">（' + productName + '）</span>' : '') + '<br/>' +
        '所属指标：' + grp.indicator + '（' + (grp.no || '') + '）<br/>' +
        '计量单位：' + (unit || '—') + '<br/>' +
        '当前数值：<b>' + (value || '未填写') + '</b> ' + (unit || '') + '<br/>' +
        (factorVal ? '因子：' + factorVal + ' ' + factorUnit + '<br/>结果：<b style="color:#0067FE;">' + calc + '</b><br/>' : '') +
        '数据源：' + (srcType === 'platform' ? '底座' : '材料') + ' · ' + (src || '未关联') + '<br/>' +
        '状态：<b style="color:' + (st.type === 'success' ? '#52c41a' : st.type === 'warning' ? '#E6A23C' : '#909399') + ';">' + st.text + '</b>' +
        '</div>' +
        '<div style="font-size:12px;color:#64748b;line-height:1.9;">' +
        '<b style="color:#1f2d3d;">可执行操作：</b><br/>' +
        '· <b>修改数值</b> — 直接在右侧该行输入框修改<br/>' +
        '· <b>更换佐证材料</b> — 点数据源旁的「选择 / 上传」图标<br/>' +
        '· <b>确认无误</b> — 点右侧「' + st.text + '」标签切换为已确认<br/>' +
        '· <b>继续下一项</b> — 点顶部「下一项待处理」' +
        '</div>'
      this.messages.push({ id: Date.now(), role: 'assistant', content: html, timestamp: '刚刚', suggestions: [] })
      this.$nextTick(() => { if (this.scrollToBottom) this.scrollToBottom() })
    },
    // 数据项确认状态（三态：待补充 / 待确认 / 已确认）
    itemConfirmStatus(it) {
      const v = it && it.value
      if (!v || v === '—') return { text: '待补充', type: 'warning' }
      if (it.confirmed) return { text: '已确认', type: 'success' }
      return { text: '待确认', type: 'info' }
    },
    // 切换确认
    toggleItemConfirm(it) {
      if (!it) return
      const v = it.value
      if (!v || v === '—') {
        this.$message.warning('请先填写数值')
        return
      }
      this.$set(it, 'confirmed', !it.confirmed)
      this.$message.success(it.confirmed ? '已确认：' + it.item : '已取消确认：' + it.item)
    },
    // 一键确认全部待确认参数（覆盖计算型/判定型/共用项/产量）
    confirmAllParams() {
      const model = (this.phaseDetails[1] && this.phaseDetails[1].collectModel) || []
      let n = 0
      const mark = (obj) => {
        const v = obj.value
        if (v !== undefined && v !== null && v !== '' && v !== '—' && !obj.confirmed) {
          this.$set(obj, 'confirmed', true)
          n++
        }
      }
      const walk = (obj) => {
        if (!obj || typeof obj !== 'object') return
        if (Array.isArray(obj)) {
          obj.forEach(walk)
          return
        }
        // ① 含 data.value（计算型参数）
        if (obj.data && typeof obj.data === 'object' && 'value' in obj.data) {
          mark(obj.data)
        } else if ('value' in obj && ('source' in obj || 'sourceType' in obj || 'confirmed' in obj)) {
          // ② 直接含 value + source（共用项 / 产量）
          mark(obj)
        }
        Object.keys(obj).forEach(k => {
          if (k === 'data') return
          walk(obj[k])
        })
      }
      model.forEach(walk)
      if (n) {
        this.$message.success('已确认 ' + n + ' 项参数')
      } else {
        this.$message.info('没有待确认的参数')
      }
    },
    // 达成率（相对引领值，100% 表示达标）
    achievementRate(ind) {
      const v = parseFloat(ind.value)
      const lead = parseFloat(ind.leading)
      if (isNaN(v) || isNaN(lead) || lead === 0 || v === 0) return null
      // 产品口径（/辆）与引领值口径（/万元）不可比，返回 null
      if (ind.unit && ind.unit.indexOf('/辆') > -1) return null
      const isReverse = ind.indicatorType && ind.indicatorType.indexOf('逆向') > -1
      const r = isReverse ? (lead / v) : (v / lead)
      return Math.max(0, Math.min(150, r * 100))
    },
    // 达成率色（≥100 绿 / 80~99 橙 / <80 红）
    rateColor(rate) {
      if (rate >= 100) return '#52c41a'
      if (rate >= 80) return '#faad14'
      return '#f56c6c'
    },
    // 阶段3：点击指标行 → 推送指标详情（计算参数/结果/比较依据/得分依据）
    focusIndicator(ind) {
      if (!ind) return
      this.currentEvalIndicator = ind.no
      const box = 'padding:10px 12px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;margin:6px 0;line-height:1.9;font-size:12.5px;'
      const isQual = ind.indicatorType && ind.indicatorType.indexOf('定性') > -1
      const scoreColor = ind.status === 'met' ? '#52c41a' : ind.status === 'improving' ? '#E6A23C' : '#F56C6C'

      let html = '<strong style="color:#0067FE;">【阶段3 · 指标详情】' + ind.no + ' ' + ind.name + '</strong>'

      // 指标信息
      html += '<div style="' + box + '">'
      html += '<b>指标类型</b>：' + (ind.indicatorType || '—') + '<br/>'
      html += '<b>单位</b>：' + (ind.unit || '—') + '　<b>权重分值</b>：' + ind.weight + ' 分'
      html += '</div>'

      // ① 计算参数
      html += '<strong>① 计算参数</strong><br/>'
      html += '<div style="' + box + '">' + (ind.detail || (isQual ? '定性指标，按材料核查判定' : '—')) + '</div>'

      // ② 计算结果
      html += '<strong>② 计算结果</strong><br/>'
      html += '<div style="' + box + '">当前值：<b style="color:#0067FE;font-size:15px;">' + (ind.value || '—') + '</b> ' + (ind.unit || '') + '</div>'

      // ③ 比较值依据
      html += '<strong>③ 比较值依据</strong><br/>'
      html += '<div style="' + box + '">'
      html += '引领值：<b>' + (ind.leading || '—') + '</b><br/>'
      html += '基准值：<b>' + (ind.baseline || '—') + '</b><br/>'
      html += '<span style="color:#94a3b8;font-size:11.5px;">来源：' + (ind.leadingSource || '未配置（须在标准配置中标注行业标准或统计来源）') + '</span>'
      html += '</div>'

      // ④ 得分依据
      html += '<strong>④ 得分依据</strong><br/>'
      html += '<div style="' + box + '">'
      html += '评分规则：' + (ind.rule || '—') + '<br/>'
      html += '得分：<b style="color:' + scoreColor + ';font-size:15px;">' + (ind.score != null ? ind.score : '—') + '</b> / ' + ind.weight + ' 分'
      html += '</div>'

      html += '<div style="font-size:11.5px;color:#94a3b8;margin-top:4px;">提示：完整计算过程可在阶段2 数据清单中逐项复核；本指标参数明细见右侧表格。</div>'

      this.messages.push({ id: Date.now(), role: 'assistant', content: html, timestamp: '刚刚' })
    },
    // 预览状态（按引领值/基准值判断，不计算得分）
    isJudgmentIndicator(grp) {
      if (!grp) return false
      if (grp.renderMode === 'checklist') return true
      return !!(grp.indicatorType && grp.indicatorType.indexOf('定性') > -1)
    },
    // 分子汇总（明细项求和：有系数则 值×系数，无系数直接相加）
    itemSum(grp, name) {
      const items = (grp.productItems || {})[name] || []
      return items.reduce((a, it) => {
        const v = parseFloat(String(it.value).replace(/,/g, '')) || 0
        const f = parseFloat(it.factor)
        return a + (isNaN(f) ? v : v * f)
      }, 0)
    },
    // 产品单位值 = 分子汇总 ÷ 产量
    unitValueOf(grp, name) {
      const num = this.itemSum(grp, name)
      const ov = (grp.productOutputs || {})[name]
      const den = parseFloat(String(ov && ov.value !== undefined ? ov.value : (ov || '')).replace(/,/g, '')) || 0
      if (!den) return '—'
      return (num / den).toFixed(3)
    },
    // 共用计量项总量（明细求和）
    sharedTotal(grp) {
      const items = grp.sharedItems || []
      return items.reduce((a, it) => {
        const v = parseFloat(String(it.value).replace(/,/g, '')) || 0
        const f = parseFloat(it.factor)
        return a + (isNaN(f) ? v : v * f)
      }, 0)
    },
    // 分摊产品总产量
    sharedTotalOutput(grp) {
      return this.sharedProductList.reduce((a, p) => {
        const ov = (grp.productOutputs || {})[p.name]
        return a + (parseFloat(String(ov && ov.value !== undefined ? ov.value : (ov || '')).replace(/,/g, '')) || 0)
      }, 0)
    },
    // 某产品的分摊比例
    allocRatio(grp, name) {
      const total = this.sharedTotalOutput(grp)
      if (!total) return 0
      const ov = (grp.productOutputs || {})[name]
      const den = parseFloat(String(ov && ov.value !== undefined ? ov.value : (ov || '')).replace(/,/g, '')) || 0
      return den / total
    },
    // 某产品分摊到的分子值
    allocValue(grp, name) {
      return this.sharedTotal(grp) * this.allocRatio(grp, name)
    },
    // 某产品分摊后的单位产品值
    allocUnitValue(grp, name) {
      const ov = (grp.productOutputs || {})[name]
      const den = parseFloat(String(ov && ov.value !== undefined ? ov.value : (ov || '')).replace(/,/g, '')) || 0
      if (!den) return '—'
      return (this.allocValue(grp, name) / den).toFixed(3)
    },

    // ===== 任务管理 =====
    createTask(factoryName, scenario, caseType, plan) {
      const task = {
        id: 'zcf-' + Date.now(),
        factoryName: factoryName,
        scenario: scenario || 'GF',
        caseType: caseType || 'manufacturing',
        planId: plan.id,
        planLabel: plan.label,
        baselineYear: String(plan.baselineYear),
        currentStepIndex: 0,
        status: 'active',
        createdAt: new Date().toLocaleString('zh-CN'),
        updatedAt: new Date().toLocaleString('zh-CN'),
        messages: []
      }
      this.taskList.unshift(task)
      this.saveTasks()
      return task
    },

    // 生成阶段引导消息（新建任务进入/重置共用）
    makePhaseIntroMsg(prefix) {
      const title = prefix ? (prefix + this.currentFactoryName) : ('已进入申报项目：' + this.currentFactoryName)
      // 三段式精简：阶段结论 → 需要关注项 → 下一步动作（数据明细归右侧面板，判定依据按需展开）
      const q = this.phaseDetails[0].qualification
      const allChecks = [...q.autoChecks, ...q.manualChecks]
      const passCount = allChecks.filter(c => this.judgeQualiPass(c) === true).length
      const failList = allChecks.filter(c => this.judgeQualiPass(c) === false)
      const matched = allChecks.filter(c => c.proofStatus === 'matched')
      const rowStyle = 'display:flex;align-items:center;gap:6px;font-size:12px;margin:5px 0;line-height:1.7;'
      const verifyRows = allChecks.map(c => {
        const ok = this.judgeQualiPass(c) !== false
        const basis = c.type === 'number' ? ('现状 ' + c.current + ' ' + c.unit + ' ≥ ' + c.threshold) : ('现状「' + c.current + '」')
        return '<div style="' + rowStyle + '"><span style="color:' + (ok ? '#52c41a' : '#f56c6c') + ';">' + (ok ? '✓' : '✗') + '</span>' +
          '<span style="flex:1;color:#303133;">' + c.condition + '</span>' +
          '<span style="color:#64748b;text-align:right;">' + basis + '</span></div>'
      }).join('')
      const detStyle = 'font-size:12px;color:#64748b;margin:2px 0 6px 18px;'
      return {
        id: Date.now(),
        role: 'assistant',
        content: '<strong>' + title + '</strong><br/>' +
          '<div style="padding:12px 14px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;margin-top:8px;">' +
          '<strong style="color:#0067FE;">【阶段1 · 标准规则适配】</strong> ⏳ 待您确认<br/>' +
          '评价标准：<b>《绿色工厂评价通则》（GB/T 36132-2025）</b> · 制造型企业 · 评价年度 ' + this.baselineYear + ' 年<br/>' +
          '企业信息 <b>11 项</b>已由组织资源库带出，资格核验 <b style="color:#52c41a;">' + passCount + ' / ' + allChecks.length + ' 项</b>通过，证明材料自动匹配 6 份。<br/>' +
          '静态硬资格（法人 / 规上企业 / 产业政策 / 污染物达标 / 无淘汰装备）不满足时建议先整改，也可继续试算。<br/>' +
          '→ 核对右侧「企业信息」与「申报资格条件」后，点击底部「确认并进入核算模型搭建」' +
          '</div>',
        timestamp: '刚刚',
        suggestions: ['下载材料清单', '上传申报材料']
      }
    },

    // 阶段1：下载材料清单（资格条件所需证明材料，标注匹配状态），供企业备料
    downloadMaterialChecklist() {
      const q = this.phaseDetails[0].qualification
      const checks = [...q.autoChecks, ...q.manualChecks]
      const seen = {}
      const lines = ['绿色工厂申报 - 资格证明材料清单', '申报主体：' + this.currentFactoryName, '申报依据：' + this.currentPlanLabel, '', '序号\t材料名称\t关联资格条件\t状态']
      let idx = 0
      checks.forEach(c => {
        const pid = c.proofId
        if (!pid || !q.proofPool[pid] || seen[pid]) return
        seen[pid] = true
        idx++
        const status = c.proofStatus === 'matched' ? '已匹配' : '待上传'
        lines.push(idx + '\t' + q.proofPool[pid].name + '\t' + c.condition + '\t' + status)
      })
      lines.push('', '说明：待上传材料可对话输入「上传 + 材料名」或点击「上传申报材料」完成识别与自动匹配。')
      const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/plain;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = '绿色工厂申报-材料清单.txt'
      a.click()
      URL.revokeObjectURL(a.href)
    },

    continueTask(task) {
      // 根据任务主体类型切换案例数据（算力设施 / 制造型企业）
      this.loadCase(task.caseType === 'computing' ? 'computing' : 'manufacturing')
      this.applicantType = task.caseType === 'computing' ? 'computing' : 'manufacturing'
      this.baselineYear = task.baselineYear ? String(task.baselineYear) : this.baselineYear
      this.currentPlanLabel = task.planLabel || '《绿色工厂评价通则》（GB/T 36132-2025）'
      this.scenarioMode = 'improve'
      this.currentTaskId = task.id
      this.currentFactoryName = task.factoryName
      this.currentStepIndex = task.currentStepIndex
      this.maxStepIndex = task.currentStepIndex
      // 恢复到阶段5时：按阶段4核算结果自动判定申报场景
      if (this.currentStepIndex === 3) {
        this.applyAutoScenario()
      }
      this.pageMode = 'task-active'
      // 重置阶段交互状态（防止跨任务污染：确认标记/目标确认/采纳措施/页签）
      this.phaseOps.resultConfirmed = false
      this.phaseOps.goalConfirmed = false
      this.phaseOps.planGenerated = false
      this.phaseOps.adoptedMeasures = []
      this.phaseOps.dataTab = 'validation'
      this.invalidatedStages = []
      // 恢复到阶段5：改善措施默认全部已采纳（用户可逐项取消）
      if (this.currentStepIndex === 3) this.initAdoptedMeasures()
      this.isReportArchived = false
      this.confirmRecords = []
      // 优先使用任务保存的对话记录，否则初始化完整阶段引导
      if (task.messages && task.messages.length > 0) {
        this.messages = JSON.parse(JSON.stringify(task.messages))
      } else {
        this.messages = [this.makePhaseIntroMsg()]
      }
      this.$nextTick(this.scrollToBottom)
    },

    // ===== 阶段交互操作方法 =====
    // 申报资格条件自动判定：null=待判定 / true=满足 / false=不满足；数值型按阈值比较，是非型按下拉值判定，文本型按关键词规则（演示级）
    judgeQualiPass(check) {
      if (check.type === 'number') {
        const v = Number(check.current)
        if (check.current === null || check.current === undefined || check.current === '' || isNaN(v)) return null
        return v >= check.threshold
      }
      if (check.type === 'yesno') {
        if (!check.current) return null
        return check.current === check.passValue
      }
      const s = (check.current || '').trim()
      if (!s) return null
      if (/(未入选|未建成|未获得|未通过|尚未|暂未|未达到)/.test(s)) return false
      if (/(无|未|没有|不在|非)/.test(s)) return true
      if (/(被列入|被列为|发生|存在|受到|有)/.test(s)) return false
      return true
    },
    // 关联已有证明材料（演示：从佐证材料库选择推荐材料并关联到当前条件）
    linkProof(check) {
      const q = this.phaseDetails[0].qualification
      check.proofStatus = 'matched'
      this.$message.success(`已关联「${q.proofPool[check.proofId].name}」（佐证材料库）`)
    },
    // 上传新证明材料（演示：上传后归入佐证材料库并关联当前条件）
    uploadNewProof(check) {
      const q = this.phaseDetails[0].qualification
      check.proofStatus = 'matched'
      this.$message.success(`新材料已上传并归入佐证材料库，关联「${q.proofPool[check.proofId].name}」`)
    },
    // 重新选择材料（演示：点击已关联材料名，可关联已有材料或上传新材料）
    swapProof(check) {
      const q = this.phaseDetails[0].qualification
      this.$message.info(`重新选择「${q.proofPool[check.proofId].name}」— 可关联已有材料或上传新材料（演示）`)
    },
    // 负面清单·承诺书模板下载（真实文件：企业信息预填 + 全部承诺条款 + 签章区，HTML 可打印为签章版）
    downloadCommitment(check) {
      const name = this.currentFactoryName || this.autoFactoryName || '（企业名称）'
      const clauses = this.phaseDetails[0].qualification.manualChecks
        .map((c, i) => `<p style="margin:8px 0;text-indent:2em;">${i + 1}. 本单位承诺：${c.condition}。</p>`).join('')
      const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>绿色工厂申报承诺书</title>
<style>body{font-family:'SimSun','宋体',serif;max-width:760px;margin:40px auto;padding:0 32px;color:#1f2d3d;line-height:1.9;}
h1{text-align:center;font-size:22px;margin-bottom:8px;} .sub{text-align:center;color:#67c23a;font-size:12px;margin-bottom:24px;}
.meta{margin:16px 0;font-size:14px;} .meta p{margin:4px 0;} h3{font-size:15px;margin:20px 0 8px;}
.clause p{font-size:14px;} .sign{margin-top:56px;text-align:right;font-size:14px;line-height:2.4;}
.hint{color:#909399;font-size:12px;border-top:1px dashed #dcdfe6;padding-top:12px;margin-top:40px;}</style></head><body>
<h1>绿色工厂申报承诺书</h1>
<div class="sub">（法定代表人承诺 · 覆盖申报负面清单全部事项）</div>
<div class="meta">
<p>致：工业和信息化部（绿色工厂建设评估组织方）</p>
<p>单位名称：${name}</p>
<p>统一社会信用代码：＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿</p>
<p>法定代表人：＿＿＿＿＿＿＿＿</p>
</div>
<h3>承诺事项</h3>
<div class="clause">${clauses}
<p style="text-indent:2em;">本单位对上述承诺事项的真实性负责；如经核查与事实不符，自愿承担由此产生的全部后果，并接受取消申报及创建资格的处理。</p></div>
<div class="sign">
<p>法定代表人（签字）：＿＿＿＿＿＿＿＿＿＿</p>
<p>单位（公章）：<br/><br/></p>
<p>日期：＿＿＿＿年＿＿月＿＿日</p>
</div>
<div class="hint">使用说明：本承诺书由系统按企业信息与申报负面清单自动生成，打印后由法定代表人签字并加盖公章，扫描回传至「佐证材料库」完成关联。</div>
</body></html>`
      const blob = new Blob(['\ufeff' + html], { type: 'text/html;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `绿色工厂申报承诺书-${name}.html`
      a.click()
      URL.revokeObjectURL(a.href)
      this.$message.success('承诺书模板已下载（企业信息已预填），打印签字盖章后扫描回传佐证材料库')
    },
    // ===== 阶段2 数据收集（指标 → 参数 → 详情）=====
    // 扁平化：把指标下所有子模块的参数合并为一维列表
    flattenParams(grp) {
      const out = []
      ;(grp.subs || []).forEach(s => {
        ;(s.rows || []).forEach(r => {
          out.push(Object.assign({}, r, { _subName: s.name }))
        })
      })
      return out
    },
    // 参数状态：缺失 / 待确认（无来源）/ 已填
    paramStatus(r) {
      const d = (r && r.data) || {}
      if (!d.value || d.value === '—') return { text: '待补充', type: 'warning' }
      if (d.confirmed) return { text: '已确认', type: 'success' }
      return { text: '待确认', type: 'info' }
    },
    // 指标组状态汇总
    groupStatus(grp) {
      const rows = this.flattenParams(grp)
      const miss = rows.filter(r => this.paramStatus(r).text === '待补充').length
      const pend = rows.filter(r => this.paramStatus(r).text === '待确认').length
      if (miss) return { text: miss + ' 项待补充', type: 'warning' }
      if (pend) return { text: pend + ' 项待确认', type: 'info' }
      return { text: '✓ 已完成', type: 'success' }
    },
    // 添加产品（默认空行）
    addProduct() {
      this.products.push({ name: '', unit: '件', metered: false, auto: false })
    },
    // 一级指标分组折叠
    toggleCategory(ci) {
      this.$set(this.categoryExpanded, ci, this.categoryExpanded[ci] === false)
    },
    // 折叠切换
    toggleCollectGroup(key) {
      this.$set(this.collectExpanded, key, this.collectExpanded[key] === false)
    },
    // 定位下一项待处理（滚动 + 左侧引导联动）
    locateNextPending() {
      const groups = this.phaseDetails[1].collectModel || []
      const list = []
      groups.forEach((g, gi) => {
        this.flattenParams(g).forEach((r, ri) => {
          if (this.paramStatus(r).text !== '已确认') {
            list.push({ gi, ri, key: g.indicator + '-' + ri, indicator: g.indicator, param: r })
          }
        })
      })
      if (!list.length) {
        this.$message.success('全部参数已填写完成')
        return
      }
      const item = list[this.collectFocusIdx % list.length]
      this.collectFocusIdx++
      this.$set(this.collectExpanded, item.indicator, true)
      this.currentCollectIndicator = item.indicator
      this.currentCollectParam = item.key
      this.$nextTick(() => {
        const el = document.querySelector('.cp-row.is-current')
        if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      })
      // 左侧引导联动（统一走 focusCollectParam）
      this.focusCollectParam(
        this.phaseDetails[1].collectModel[item.gi],
        item.param,
        item.indicator === '共用计量' ? '共用计量' : (item.param && item.param._productName) || ''
      )
    },
    // 恢复底座数据（撤销材料替换）
    restorePlatformData(r) {
      if (!r._platformBackup) {
        this.$message.info('无底座原始数据可恢复')
        return
      }
      r.data.value = r._platformBackup.value
      r.data.source = r._platformBackup.source
      r.data.sourceType = 'platform'
      r.data.overridden = false
      this.$message.success('已恢复底座数据')
    },
    // 参数详情引导（左侧对话）
    buildCollectParamGuide(item) {
      const r = item.param
      const st = this.paramStatus(r)
      return '<strong>【阶段2 · 数据收集】当前参数</strong><br/>' +
        '<div style="padding:10px 12px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;margin:8px 0;">' +
        '<b>' + r.item + '</b>（' + item.indicator + '）<br/>' +
        '单位：' + (r.data.unit || '—') + '<br/>' +
        '当前值：' + (r.data.value || '未填写') + '<br/>' +
        '数据源：' + (r.data.source || '未关联') + '<br/>' +
        '状态：<b style="color:' + (st.type === 'success' ? '#52c41a' : '#E6A23C') + ';">' + st.text + '</b>' +
        '</div>' +
        '→ 在右侧填写数值或关联佐证材料后，点击「下一项待处理」继续'
    },
    // 资格校验动态结论
    qualiConclusion() {
      const q = this.phaseDetails[0].qualification
      const all = [...q.autoChecks, ...q.manualChecks]
      // 分层判定：静态硬资格（blocking!==false，含负面清单承诺）不通过则终止；量化门槛（blocking===false）不拦截，核算后给出差距与改善路径
      const hard = all.filter(c => c.blocking !== false)
      const soft = all.filter(c => c.blocking === false)
      if (hard.some(c => this.judgeQualiPass(c) === false)) {
        return { text: '静态硬资格不满足 — 建议先整改（可继续试算）', ok: false }
      }
      if (hard.some(c => this.judgeQualiPass(c) === null)) {
        return { text: '部分条件待填报 — 补填现状后自动判定', ok: null }
      }
      const softFail = soft.filter(c => this.judgeQualiPass(c) === false).length
      if (softFail > 0) {
        return { text: '静态资格满足；' + softFail + ' 项量化条件暂不满足，核算后将给出差距与改善路径', ok: true }
      }
      return { text: '满足国家级绿色工厂申报条件', ok: true }
    },
    typeLabel(t) {
      return { calc: '自动核算', param: '参数填报', direct: '直接填报' }[t] || t
    },
    // ===== 阶段2核算模型：排放源增删与 E₁ 品种联动 =====
    addEmissionSource(mi, si) {
      const sub = this.phaseDetails[1].indicatorModels[mi].subModules[si]
      sub.sources.push('')
      this.$message.info('已新增' + sub.itemLabel + '，请选择类型')
    },
    removeEmissionSource(mi, si, ri) {
      this.phaseDetails[1].indicatorModels[mi].subModules[si].sources.splice(ri, 1)
      const changed = this.syncE1Sources()
      this.$message.success('已删除排放源' + (changed ? '，综合能源消费量（E₁）能源品种已同步' : ''))
    },
    // 排放源类型选择（含 E₁ 品种联动）
    onSourceTypeChange(mi, si, ri, val) {
      this.phaseDetails[1].indicatorModels[mi].subModules[si].sources[ri] = val
      const changed = this.syncE1Sources()
      if (changed) this.$message.success(`排放源「${val}」已联动更新综合能源消费量（E₁）能源品种`)
    },
    // ===== 阶段2核算模型：生产过程管理（C过程专用，过程 → 多输入/多输出） =====
    addProcess(si) {
      const sub = this.phaseDetails[1].indicatorModels[0].subModules[si]
      sub.processes.push({ name: '', inputs: [], outputs: [] })
      this.$message.info('已新增生产过程，请选择过程并添加输入/输出')
    },
    removeProcess(si, pi) {
      const sub = this.phaseDetails[1].indicatorModels[0].subModules[si]
      sub.processes.splice(pi, 1)
      this.syncE1Sources()
      this.$message.success('已删除生产过程')
    },
    onProcessNameChange(mi, si, pi, val) {
      this.phaseDetails[1].indicatorModels[mi].subModules[si].processes[pi].name = val
      this.syncE1Sources()
    },
    addProcessIO(mi, si, pi, type) {
      const p = this.phaseDetails[1].indicatorModels[mi].subModules[si].processes[pi]
      p[type].push('')
    },
    removeProcessIO(mi, si, pi, type, idx) {
      const p = this.phaseDetails[1].indicatorModels[mi].subModules[si].processes[pi]
      p[type].splice(idx, 1)
      if (type === 'inputs') this.syncE1Sources()
      this.$message.success('已删除' + (type === 'inputs' ? '输入' : '输出'))
    },
    onProcessIOChange(mi, si, pi, type, idx, val) {
      const p = this.phaseDetails[1].indicatorModels[mi].subModules[si].processes[pi]
      p[type][idx] = val
      if (type === 'inputs') {
        const changed = this.syncE1Sources()
        if (changed) this.$message.success('输入「' + val + '」已联动：E₁ 计入「' + val + '（原料用）」')
      }
    },
    // 能源品种排放源 ↔ E₁ 综合能耗品种联动（化石燃料/外购电力热力既是排放源也是能耗构成；生产过程输入的能源为原料用）
    syncE1Sources() {
      const m0 = this.phaseDetails[1].indicatorModels[0]
      const e1 = m0.subModules.find(s => s.symbol === 'E₁')
      if (!e1) return false
      const map = {
        '天然气燃烧': '天然气', '柴油燃烧': '柴油', '汽油燃烧': '汽油',
        '外购热力（蒸汽/热水）': '外购热力'
      }
      // 购入电力排放源（购电来源构成：电能量交易/绿证/省内分摊/其他电网，唯一维护入口）
      const cq = m0.subModules.find(s => s.symbol === 'C购入电')
      const gridSources = cq ? cq.sources.filter(s => s) : []
      // 非化石能源电力来源（E物理，同名计入 E₁：电力按等价值折标）
      const m1 = this.phaseDetails[1].indicatorModels[1]
      const ephys = m1 ? m1.subModules.find(s => s.symbol === 'E物理') : null
      const elecSources = ephys ? ephys.sources.filter(s => s) : []
      // 生物质燃料燃烧 → E₁ 生物质燃料品种（能源消费计入）
      const cb = m0.subModules.find(s => s.symbol === 'C生物质')
      const hasBiomass = !!(cb && cb.sources.length > 0)
      const linked = ['C燃烧', 'C购入热']
      const varieties = []
      linked.forEach(sym => {
        const sub = m0.subModules.find(s => s.symbol === sym)
        if (sub) sub.sources.forEach(src => {
          if (src && map[src] && !varieties.includes(map[src])) varieties.push(map[src])
        })
      })
      // C购入电：任一购电来源存在 → E₁ 合并为单一「外购电力」品种
      if (gridSources.length && !varieties.includes('外购电力')) varieties.push('外购电力')
      elecSources.forEach(src => { if (!varieties.includes(src)) varieties.push(src) })
      if (hasBiomass && !varieties.includes('生物质燃料')) varieties.push('生物质燃料')
      // 生产过程输入中的化石能源 → E₁ 原料用品种
      const energyInputs = ['天然气', '柴油', '汽油', '其他化石燃料']
      const cp = m0.subModules.find(s => s.symbol === 'C过程')
      const rmVarieties = []
      if (cp && cp.processes) {
        cp.processes.forEach(p => p.inputs.forEach(inp => {
          if (energyInputs.includes(inp) && !rmVarieties.includes(inp + '（原料用）')) rmVarieties.push(inp + '（原料用）')
        }))
      }
      const allLinked = [...Object.values(map), '外购电力', ...elecSources]
      if (hasBiomass) allLinked.push('生物质燃料')
      const manual = e1.sources.filter(s => !allLinked.includes(s) && !s.endsWith('（原料用）'))
      const next = [...varieties, ...rmVarieties, ...manual]
      const changed = JSON.stringify(next) !== JSON.stringify(e1.sources)
      e1.sources = next
      // E₂ 同步：E₁ 品种剔除原料用能（E₂ 不含原料用能）
      const e2 = this.phaseDetails[1].indicatorModels[1].subModules.find(s => s.symbol === 'E₂')
      if (e2) {
        e2.sources = e1.sources.filter(s => !s.endsWith('（原料用）'))
      }
      // Ez 同步：物理认定电量清单同 E物理（官方注明"同指标1.3"）
      const m2 = this.phaseDetails[1].indicatorModels[2]
      const ez = m2 ? m2.subModules.find(s => s.symbol === 'Ez') : null
      if (ez) ez.sources = [...elecSources]
      // Q 同步：总用电量构成 = 购入电力排放源（全部，含其他电网电力）+ 物理认定来源
      const q = m2 ? m2.subModules.find(s => s.symbol === 'Q') : null
      if (q) q.sources = [...gridSources, ...elecSources]
      // 1.2 购电认定量派生：电能量/绿证/分摊 ← C购入电排放源（电量含于外购电力，此处认定来源）
      if (m1) {
        const derivePairs = [
          ['E电能量', '电能量交易非化石能源电力'],
          ['E绿证', '绿证交易认定电力'],
          ['E分摊', '省内非化石能源分摊电力']
        ]
        derivePairs.forEach(([sym, srcName]) => {
          const sub = m1.subModules.find(s => s.symbol === sym)
          if (sub) sub.sources = gridSources.includes(srcName) ? [srcName] : []
        })
      }
      // E其他 同步：生物质燃料燃烧 → 生物质能（计入非化石能源分子 R）
      const eo = m1 ? m1.subModules.find(s => s.symbol === '其他') : null
      if (eo) {
        if (hasBiomass && !eo.sources.includes('生物质能')) eo.sources.push('生物质能')
        if (!hasBiomass) {
          const bi = eo.sources.indexOf('生物质能')
          if (bi > -1) eo.sources.splice(bi, 1)
        }
      }
      // 碳清除率 Cd 同步：直接排放量 = C燃烧排放源 + C过程各过程（不含购入电/热等间接排放，不扣抵减项，不含生物质）
      const mRe = this.phaseDetails[1].indicatorModels.find(m => m.name === '碳清除率')
      const cd = mRe ? mRe.subModules.find(s => s.symbol === 'Cd') : null
      if (cd) {
        const cburn = m0.subModules.find(s => s.symbol === 'C燃烧')
        cd.sources = [
          ...(cburn ? cburn.sources.filter(s => s) : []),
          ...(cp && cp.processes ? cp.processes.map(p => p.name).filter(Boolean) : [])
        ]
      }
      return changed
    },
    // 材料识别建模（演示：模拟识别流 — loading → 已识别 → 推送摘要；目标子模块为空时自动填充并联动）
    // 阶段1·资格证明材料上传（演示：识别后归入佐证材料库并自动关联对应资格条件）
    uploadQualificationProof(proofId) {
      const q = this.phaseDetails[0].qualification
      const name = (q.proofPool[proofId] || {}).name || proofId
      const linked = [...q.autoChecks, ...q.manualChecks].filter(c => c.proofId === proofId && c.proofStatus !== 'matched')
      if (!linked.length) return
      setTimeout(() => {
        linked.forEach(c => { c.proofStatus = 'matched' })
        this.messages.push({
          id: Date.now(),
          role: 'assistant',
          timestamp: '刚刚',
          suggestions: this.getReplySuggestions(),
          content: '<strong>📄 材料识别完成：《' + name + '》</strong><br/><br/>' +
            '<div style="padding:12px 14px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;">' +
            '<strong style="color:#0067FE;">识别结果</strong><br/>' +
            '材料已归入佐证材料库，并自动关联到 ' + linked.length + ' 项资格条件，右侧材料列状态已更新。<br/>' +
            '可继续上传其他材料，或核对右侧基本信息与资格条件后推进。' +
            '</div>'
        })
        this.updateTaskProgress()
      }, 800)
    },

    // 阶段4·核算明细区整体收缩切换
    toggleAccDetail() {
      this.accDetailExpanded = !this.accDetailExpanded
    },

    uploadMaterialForModel(idx) {
      const mh = this.phaseDetails[1].materialHints[idx]
      if (!mh || mh.status) return
      this.$set(mh, 'status', 'loading')
      setTimeout(() => {
        let detail = ''
        if (mh.fill) {
          const model = this.phaseDetails[1].indicatorModels.find(x => x.name === mh.fill.model)
          const sub = model ? model.subModules.find(s => s.symbol === mh.fill.sub) : null
          if (sub && sub.sources.length === 0) {
            sub.sources = [...mh.fill.sources]
            this.syncE1Sources()
            detail = '，已生成至「' + mh.fill.model + '」模型并完成派生联动'
          } else {
            detail = '，与现有模型一致，无需变更'
          }
        }
        this.$set(mh, 'status', 'done')
        this.messages.push({
          id: Date.now(),
          role: 'assistant',
          timestamp: '刚刚',
          suggestions: this.getReplySuggestions(),
          content: '<strong>📄 材料识别完成：《' + mh.name + '》</strong><br/><br/>' +
            '<div style="padding:12px 14px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;">' +
            '<strong style="color:#0067FE;">识别结果</strong><br/>' +
            mh.summary + detail + '<br/>' +
            '可继续上传其他材料，或直接在右侧模型中调整构成明细。' +
            '</div>'
        })
        this.updateTaskProgress()
        this.$nextTick(this.scrollToBottom)
      }, 800)
    },
    // 阶段3采集清单：关联/上传证明材料（关联=从佐证材料库带出，上传=新材料；演示交互）
    linkCollectProof(r, kind, type) {
      const target = kind === '数据' ? r.data : r.factor
      if (!target) return
      const name = type === 'upload'
        ? ('新上传凭证 · ' + r.item + '·' + kind)
        : (kind === '数据' ? '佐证材料库 · ' + r.item + '采集记录单' : '佐证材料库 · ' + r.item + '因子来源凭证')
      target.proofName = name

      // 底座数据被材料替换：备份原值并标记，可撤销
      if (kind === '数据' && target.sourceType === 'platform' && !target.overridden) {
        r._platformBackup = { value: target.value, source: target.source }
        target.sourceType = 'manual'
        target.overridden = true
        target.source = '材料识别 · ' + name
        this.$message.success('已用材料替换底座数据：' + name + '（可点「恢复底座数据」撤销）')
        return
      }

      this.$message.success((type === 'upload' ? '新材料已上传并关联：' : '已关联佐证材料库材料：') + name)
    },
    // 阶段3 待补充/待确认项处理（missing 需填报数值，pending 确认数值）
    handleValItem(item) {
      if (item.status === 'missing' && (item.value === '' || item.value === null || item.value === undefined)) {
        this.$message.warning('请先填写「' + item.name + '」的数值')
        return
      }
      item.status = 'resolved'
      this.$message.success('「' + item.name + '」已' + (item.id === 'v1' ? '提交填报' : '确认') +
        (item.value !== '' ? '：' + item.value + ' ' + (item.unit || '') : ''))
    },
    pendingValCount() {
      // 兼容旧调用：统一返回当前待处理总数（待补充 + 待确认）
      return (this.collectPendingCount && this.collectPendingCount.total) || 0
    },
    // 活动数据按 modelRef 指标维度分组（对齐核算模型三级结构：指标 → 排放源 → 数据值）

    // 阶段3引导语（三段式精简：校验结论 → 待处理明细按需展开 → 下一步动作）
    buildValGuideHtml() {
      const pc = this.collectPendingCount || { missing: 0, pending: 0, total: 0 }
      const inds = (this.phaseDetails[1] && this.phaseDetails[1].collectModel) || []
      const catCount = {}
      inds.forEach(g => { catCount[g.category] = (catCount[g.category] || 0) + 1 })
      const catText = Object.keys(catCount).map(c => c + ' ' + catCount[c]).join(' · ')
      let html = '<strong style="color:#0067FE;">【阶段2 · 数据收集与校验】</strong><br/>' +
        '<div style="padding:10px 12px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;margin:8px 0;line-height:1.9;">' +
        '按 <b>评价指标 → 计算参数 → 参数详情</b> 组织，共 <b>' + inds.length + ' 项指标</b>（' + catText + '）。<br/>' +
        '每项参数包含：数值、数据源（底座/材料）、状态（待补充 / 待确认 / 已确认）。<br/>' +
        '<b>单位产品类指标</b>按产品分组：独立计量产品各自成组，分摊产品共用计量项后按产量比例分摊。' +
        '</div>' +
        '当前待处理：<b style="color:#E6A23C;">待补充 ' + pc.missing + ' · 待确认 ' + pc.pending + '</b>（共 ' + pc.total + ' 项）<br/>' +
        '<div style="font-size:12px;color:#64748b;line-height:1.9;margin-top:6px;">' +
        '<b style="color:#1f2d3d;">操作指引：</b><br/>' +
        '· <b>逐项推进</b> — 点顶部「下一项待处理」，自动定位并推送参数详情<br/>' +
        '· <b>查看详情</b> — 单击右侧任意参数行<br/>' +
        '· <b>确认数据</b> — 点参数行的状态标签（待确认 → 已确认）<br/>' +
        '· <b>补充佐证</b> — 点数据源旁的「选择 / 上传」图标' +
        '</div>' +
        '<br/>→ 全部参数确认后，点击底部确认按钮推进阶段 3 指标核算与评价'
      return html
    },
    // 阶段4引导语（三段式精简：核算结论 → 需关注项 → 下一步动作，明细归右侧面板）
    buildEvalGuideHtml() {
      const inds = this.phaseDetails[2].indicators
      const targetCnt = inds.filter(i => i.status === 'target').length
      const improvingCnt = inds.filter(i => i.status === 'improving').length
      const ongoingCnt = inds.filter(i => i.status === 'ongoing').length
      const naCnt = inds.filter(i => i.status === 'na').length
      const failInds = inds.filter(i => i.status === 'fail')
      return '<strong style="color:#0067FE;">【阶段3 · 指标核算与评价】</strong><br/>' +
        '14 项指标核算完成（' + this.baselineYear + ' 年度），结果与计算过程见右侧「指标核算结果 / 核算明细」。<br/>' +
        '核心 3 项评价结果（通知三（三））：满足目标要求 <b style="color:#52c41a;">' + targetCnt + ' 项</b> · 满足基本要求 <b>' + improvingCnt + ' 项</b>' +
        (failInds.length ? ' · <b style="color:#f56c6c;">不满足基本要求 ' + failInds.length + ' 项</b>。' : '。') +
        (failInds.length ? '<div style="margin:6px 0;line-height:1.7;font-size:12px;"><strong style="color:#E6A23C;">⚠ 需关注</strong><br/>' + failInds.map(i => '· ' + i.name + '：现状 ' + i.value + '，未达基本要求 ' + i.basic).join('<br/>') + '</div>' : '') +
        '其余 ' + ongoingCnt + ' 项不设量化要求' + (naCnt ? '（不适用 ' + naCnt + ' 项）' : '') + '，验收时按较申报时持续改善核查（附件1注1）。<br/>' +
        '→ 核对无误后点击底部「确认核算结果」，进入阶段 4 数据溯源与材料归档'
    },
    // 阶段5引导语·确认前（目标设定任务：预填说明 → 调整要点 → 确认动作）
    buildOptGuideHtml() {
      const g = this.phaseDetails[3].goals
      const coreCnt = g.rows.filter(r => r.core).length
      const selfCnt = g.rows.length - coreCnt
      return '<strong style="color:#0067FE;">【阶段5 · 建设目标与优化建议】</strong> ⏳ 待确认<br/>' +
        '建设期 <b>' + g.startYear + '—' + g.endYear + '</b> 年（可调整至 2030，不晚于政策上限），' + g.rows.length + ' 项适用指标目标已预填：核心 ' + coreCnt + ' 项锚定官方目标要求、其余 ' + selfCnt + ' 项为企业自主目标（AI 推荐参考值）。<br/>' +
        '→ 在右侧调整建设期与各指标期末目标值（核心指标不得低于官方要求）后，点击底部「确认建设目标」'
    },
    // 阶段5引导语·确认后（结果审阅任务：锁定说明 → 已生成内容 → 调整/推进路径）
    buildGoalConfirmedGuideHtml() {
      const g = this.phaseDetails[3].goals
      const coreCnt = g.rows.filter(r => r.core).length
      const selfCnt = g.rows.length - coreCnt
      return '<strong style="color:#0067FE;">【阶段5 · 建设目标与优化建议】</strong> ✅ 已确认<br/>' +
        '建设期 <b>' + g.startYear + '—' + g.endYear + '</b> 年，' + g.rows.length + ' 项适用指标（核心 ' + coreCnt + ' · 企业自主 ' + selfCnt + '）的目标值已锁定，年度轨迹分解完成。<br/>' +
        '右侧已生成：差距分析（对照建设目标）· 改善措施推荐（默认全部已采纳，可逐项取消）· 申报诊断。<br/>' +
        '→ 浏览差距与措施，确认无误后点击底部「生成改善计划并进入材料编制」；需重设目标，点击①标题区「调整目标」'
    },
    // 阶段4 引导语（三段式：生成结论 → 数据溯源 → 后续动作）
    buildReportGuideHtml() {
      const secs = this.materialSkillConfig.coreOutput.sections
      const autoCnt = secs.filter(s => s.fillType === 'auto').length
      const draftCnt = secs.filter(s => s.fillType === 'draft').length
      const pc = this.collectPendingCount || { total: 0 }
      const totalParams = this.paramTotalCount()
      return '<strong style="color:#0067FE;">【阶段4 · 数据溯源与材料归档】</strong><br/>' +
        '《绿色工厂评价指标自评表》已生成：共 ' + secs.length + ' 章，其中自动生成 <b>' + autoCnt + '</b> 章、草稿 <b>' + draftCnt + '</b> 章（草稿可在线编辑）。<br/>' +
        '<div style="padding:8px 12px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;margin:6px 0;line-height:1.9;">' +
        '全部 <b>' + totalParams + '</b> 项参数已确认并留痕，证据链覆盖「指标结果 → 计算过程 → 输入参数 → 数据来源」四级。<br/>' +
        '证明材料已归档，支持 SHA-256 签名防篡改。</div>' +
        '→ 点击「打开评价报告（整篇）」通读定稿；完成后可归档至报告与档案中心、导出 PDF / Word、提交专家复核'
    },
    // 参数总数（动态统计）
    paramTotalCount() {
      const model = (this.phaseDetails[1] && this.phaseDetails[1].collectModel) || []
      let n = 0
      const walk = (obj) => {
        if (!obj || typeof obj !== 'object') return
        if (Array.isArray(obj)) { obj.forEach(walk); return }
        if (obj.data && 'value' in obj.data) n++
        else if ('value' in obj && ('source' in obj || 'sourceType' in obj)) n++
        Object.keys(obj).forEach(k => { if (k !== 'data') walk(obj[k]) })
      }
      model.forEach(walk)
      return n
    },
    // 下载待补充/待确认清单（txt）
    downloadValChecklist() {
      const items = this.phaseDetails[1].validationItems
      const pend = items.filter(v => v.status !== 'resolved')
      const lines = ['绿色工厂申报 — 待补充 / 待确认清单', '生成时间：' + new Date().toLocaleString('zh-CN'), '']
      pend.forEach((v, i) => {
        lines.push((i + 1) + '. [' + (v.status === 'missing' ? '缺失' : '待确认') + '] ' + v.name + '（' + v.stage + '）')
        lines.push('    说明：' + v.label)
        lines.push('    建议提供：' + v.hint)
        lines.push('')
      })
      lines.push('已处理 ' + (items.length - pend.length) + ' 项')
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = '待补充待确认清单.txt'
      a.click()
      URL.revokeObjectURL(a.href)
      this.$message.success('清单已下载')
    },
    // 上传佐证材料（演示：模拟文件入库并关联待处理项）
    uploadValFile() {
      const files = this.phaseDetails[1].uploadedFiles
      const demoNames = ['电费结算单-2025Q4.pdf', '天然气检测报告-2025.pdf', 'B204-1主要产品产量表.xlsx']
      const name = demoNames[files.length % demoNames.length]
      files.push({ name: name, time: new Date().toLocaleString('zh-CN') })
      this.$message.success('「' + name + '」已上传，已关联对应待处理项')
    },
    removeValFile(idx) {
      this.phaseDetails[1].uploadedFiles.splice(idx, 1)
      this.$message.info('已移除该文件')
    },
    // 逐项确认的材料关联（演示：关联佐证材料库已有材料 / 上传新材料）
    linkValProof(item, type) {
      const name = (item.hint || '').split('/')[0].trim()
      item.proofStatus = 'matched'
      item.proofName = name
      this.$message.success((type === 'upload' ? '新材料已上传并关联：' : '已关联佐证材料库材料：') + name)
    },
    // 阶段6「建设目标」段落文本动态生成（随建设期/评价年度联动，data 初始化阶段不可用故在 created 及建设期变更时刷新）
    syncTargetParagraph() {
      const g = this.phaseDetails[3] && this.phaseDetails[3].goals
      if (!g) return
      const text = '（二）建设目标\n建设期 ' + g.startYear + '—' + g.endYear + ' 年（建设期不晚于 2030 年政策上限），以 ' + this.baselineYear + ' 年为评价年度，围绕核心指标目标要求与企业自主建设目标提出建设目标，明确建设路线图、时间表和不同阶段建设重点。'
      const sec = this.materialSkillConfig.coreOutput.sections.find(s => s.blocks && s.blocks.some(b => b.dynamic === 'targetParagraph'))
      if (sec) {
        const block = sec.blocks.find(b => b.dynamic === 'targetParagraph')
        if (block) block.text = text
      }
    },
    // 阶段5：切换建设期（期满年）→ 重新分解中间年度目标（演示：线性插值示意，实际按措施贡献分年分解）
    changeGoalPeriod(endYear) {
      const g = this.phaseDetails[3].goals
      if (!endYear || endYear < g.startYear) {
        this.$message.warning('建设期结束年份不得早于起始年（' + g.startYear + '）')
        return
      }
      // 确认后调整建设期：自动取消确认（下游差距分析/措施推荐基于旧建设目标，须重新确认后生成）
      if (this.phaseOps.goalConfirmed) {
        this.phaseOps.goalConfirmed = false
        this.$message.info('建设期已调整，原确认结果已失效，请重新确认后生成差距分析与措施推荐')
      }
      g.endYear = endYear
      const n = endYear - g.startYear // 年度目标覆盖建设期每一年（起始年→期满年前一年；单年建设期为0）
      g.rows.forEach(r => {
        const c = parseFloat(r.current)
        const t = parseFloat(r.finalGoal)
        const arr = []
        for (let i = 1; i <= n; i++) {
          const v = c + (t - c) * (i / (n + 1))
          arr.push(r.unit === '%' ? v.toFixed(1) : v.toFixed(2))
        }
        r.mids = arr
      })
      this.$message.info('已按建设期 ' + g.startYear + '–' + endYear + ' 重新分解年度目标（演示为线性示意），可逐项调整')
      // 建设期变更 → 阶段6「建设目标」段落文本同步刷新
      this.syncTargetParagraph()
    },
    // 阶段5：建设目标确认（目标确认后展开差距分析与措施推荐）
    toggleGoalConfirm(silent) {
      // R040201 衍生校验：评价年度须早于建设期起始年（评价现状在建设期之前）
      const by = Number(this.baselineYear)
      const sy = this.phaseDetails[3] && this.phaseDetails[3].goals ? Number(this.phaseDetails[3].goals.startYear) : NaN
      if (!isNaN(by) && !isNaN(sy) && by >= sy) {
        this.$message.warning('评价年度（' + this.baselineYear + '）须早于建设期起始年（' + sy + '），请调整建设期或评价年度后再确认')
        return
      }
      this.phaseOps.goalConfirmed = !this.phaseOps.goalConfirmed
      // silent=true 时由调用方（对话流）推送引导消息，避免双重消息
      if (silent) {
        this.$message.success(this.phaseOps.goalConfirmed ? '建设目标已确认，已对照目标生成差距分析与措施推荐' : '已取消确认，可调整建设目标')
        return
      }
      if (this.phaseOps.goalConfirmed) {
        this.$message.success('建设目标已确认，已对照目标生成差距分析与措施推荐')
        // 确认后引导切换为「结果审阅」部分（目标已锁定 → 已生成内容 → 调整/推进路径）
        this.messages.push({ id: Date.now(), role: 'assistant', content: this.buildGoalConfirmedGuideHtml(), timestamp: '刚刚' })
      } else {
        this.$message.success('已取消确认，可调整建设目标')
        // 调整后引导切回「目标设定」部分
        this.messages.push({ id: Date.now(), role: 'assistant', content: this.buildOptGuideHtml(), timestamp: '刚刚' })
      }
      this.$nextTick(this.scrollToBottom)
    },
    // ===== 阶段5：降碳措施减排量测算（统一四方向：新能源建设 / 设备升级改造 / 余能利用 / 碳抵消）=====
    // 年减排量 = 措施参数 × 典型减排系数（内置口径），参数可调、结果实时联动
    measureReduction(m) {
      // 余能利用：多回收项（余热 / 余压 / 可燃废气 / 余冷可同时存在）→ 逐项测算后累加
      if (m.recoveries) return m.recoveries.reduce((sum, r) => sum + this.recoveryReduction(m, r), 0)
      if (!m.calcType) return null   // 管理类措施不参与减排量测算
      const v = {}
      ;(m.params || []).forEach(p => { v[p.key] = Number(p.value) || 0 })
      const f = (m.factor && Number(m.factor.value)) || 0
      if (m.calcType === 'power') return Math.round((v.capacity || 0) * (v.hours || 0) * f)
      if (m.calcType === 'energy') return Math.round((v.energy || 0) * 10 * f)
      if (m.calcType === 'heat') return Math.round((v.heat || 0) * f)
      if (m.calcType === 'offset') return Math.round(v.amount || 0)
      return 0
    },
    // ===== 阶段6：方案章节中「随改善措施自动生成」的段落（改参数/加减措施即自动更新）=====
    wanTons(v) {
      return (Math.round((Number(v) || 0) / 1000) / 10).toFixed(1)
    },
    measureParamBrief(m) {
      const parts = (m.params || []).map(p => p.label + ' ' + p.value + ' ' + p.unit)
      if (m.recoveries && m.recoveries.length) {
        parts.push(m.recoveries.map(r => (this.recoveryOption(m, r) || {}).label || '').filter(Boolean).join(' + '))
      }
      return parts.filter(Boolean).join('、') || '—'
    },
    planBlockText(block) {
      if (!block || !block.dyn) return block ? block.text : ''
      const summary = this.adoptedMeasureSummary()
      if (block.dyn === 'mainTasks') {
        const list = summary.rows.filter(m => m.calcType)
        if (!list.length) return '（一）主要任务\n（尚未采纳降碳措施，采纳后自动生成）'
        return '（一）主要任务\n' + list.map((m, i) =>
          (i + 1) + '. ' + m.name + '（' + this.measureParamBrief(m) + '），年减碳约 ' + this.wanTons(m.reductionValue) + ' 万吨' +
          (m.contribText ? '，' + m.targetIndicator + ' ' + m.contribText : '') + '。'
        ).join('\n')
      }
      if (block.dyn === 'benefit') {
        return String(block.text).replace(/预计年减排二氧化碳约 [\d.]+ 万吨/,
          '预计年减排二氧化碳约 ' + this.wanTons(summary.total) + ' 万吨')
      }
      return block.text
    },
    // ===== 余能利用：回收项（可同时存在多种余能形式，减排量逐项测算后累加）=====
    recoveryOption(m, r) {
      return (m.subTypeOptions || []).find(o => o.value === r.subType) || {}
    },
    // 切换某项回收形式 → 系数回到该形式的典型值
    applyRecoveryType(m, r) {
      const o = this.recoveryOption(m, r)
      if (o.factor) r.factorValue = o.factor.value
    },
    addRecovery(m) {
      const o = (m.subTypeOptions || [])[0]
      if (!o) return
      m.recoveries.push({ subType: o.value, amount: o.defaultValue || 1000, factorValue: o.factor.value })
    },
    removeRecovery(m, i) {
      m.recoveries.splice(i, 1)
    },
    // 单项回收量 → 年减排量
    recoveryReduction(m, r) {
      const o = this.recoveryOption(m, r)
      if (!o.calcType) return 0
      const f = Number(r.factorValue != null ? r.factorValue : (o.factor && o.factor.value)) || 0
      const amt = Number(r.amount) || 0
      return o.calcType === 'energy' ? Math.round(amt * 10 * f) : Math.round(amt * f)
    },
    // 已采纳措施汇总：合计年减排量 + 四方向分解
    adoptedMeasureSummary() {
      const list = (this.phaseDetails[3] && this.phaseDetails[3].measures) || []
      const rows = list
        .filter(m => this.phaseOps.adoptedMeasures.includes(m.name))
        .map(m => Object.assign({}, m, { reductionValue: this.measureReduction(m) }))
      const calcRows = rows.filter(m => m.reductionValue !== null)
      const byDirection = {}
      calcRows.forEach(m => { byDirection[m.direction] = (byDirection[m.direction] || 0) + m.reductionValue })
      return {
        count: rows.length,
        calcCount: calcRows.length,
        mgmtCount: rows.length - calcRows.length,
        total: calcRows.reduce((a, m) => a + m.reductionValue, 0),
        byDirection, rows
      }
    },
    // 建设目标差距 × 已采纳措施对照：措施贡献与剩余差距随「是否采用」实时联动
    goalMeasureCompare() {
      const gaps = (this.phaseDetails[3] && this.phaseDetails[3].gaps) || []
      const rows = this.adoptedMeasureSummary().rows
      return gaps.map(g => {
        const list = rows.filter(m => m.targetIndicator === g.name)
        const gapNum = parseFloat(String(g.gap).replace(/[^\d.]/g, '')) || 0
        const unit = String(g.gap).replace(/[\d.\s]/g, '')
        const contribNum = list.reduce((a, m) => a + (Number(m.contribValue) || 0), 0)
        const remain = Math.max(0, Math.round((gapNum - contribNum) * 100) / 100)
        return Object.assign({}, g, {
          measures: list.map(m => m.name),
          contribText: list.length ? list.map(m => m.contribText).filter(Boolean).join('；') : '—',
          remainText: remain > 0 ? remain + ' ' + unit : '0（已达标）'
        })
      })
    },
    toggleAdoptMeasure(name) {
      const idx = this.phaseOps.adoptedMeasures.indexOf(name)
      if (idx > -1) {
        this.phaseOps.adoptedMeasures.splice(idx, 1)
        this.$message.info('已取消采纳该措施')
      } else {
        this.phaseOps.adoptedMeasures.push(name)
        this.$message.success('已采纳措施，纳入改善计划')
      }
    },
    // 生成改善计划（改进建议素材）
    generatePlan() {
      this.phaseOps.planGenerated = true
      this.$message.success('改善计划已生成（建设方案第四部分编制素材），进入数据溯源与材料归档')
      // 计划生成即完成阶段5全部动作，直接推进阶段6（不再单设纯导航确认）
      this.nextPhase()
    },
    // 阶段6：报告存档（归档至报告与档案中心，同时标记任务完成）——关键确认④材料审核
    handleArchiveReport() {
      this.isReportArchived = true
      const task = this.taskList.find(t => t.id === this.currentTaskId)
      if (task) {
        task.status = 'completed'
        this.saveTasks()
      }
      this.recordConfirm('confirm4', '材料审核', '确认建设方案七章内容与证明材料无误，归档至报告与档案中心')
      this.$message.success('建设方案已成功归档至报告与档案中心（证据链签名防篡改）！')
    },
    // 关键确认留痕：记录谁/何时/确认了什么（方案 saveConfirmRecord Tool）
    recordConfirm(key, name, what) {
      const idx = this.confirmRecords.findIndex(r => r.key === key)
      const record = {
        key,
        name,
        what,
        operator: '张工（企业申报负责人）',
        time: new Date().toLocaleString('zh-CN')
      }
      if (idx > -1) {
        this.confirmRecords.splice(idx, 1, record)
      } else {
        this.confirmRecords.push(record)
      }
    },
    // 阶段6：方案导出（下拉：PDF / Word）
    handleExportReport(format) {
      const formatMap = {
        pdf: 'PDF 审计版',
        word: 'Word 编辑版'
      }
      this.$message.success(`正在导出 ${formatMap[format] || format} 格式建设方案，请稍候...`)
    },
    // 阶段6：专家复核（提交第三方认证机构）
    handleShareReport() {
      this.$message.success('建设方案已提交至第三方专家复核，请等待复核意见')
    },
    // 阶段6：打开章节预览/编辑器
    // 阶段6：数据溯源完整报告下载（与预览一致：参数总览 + 阶段3真实聚合的核算参数明细 + 核心指标证据链）
    downloadEvidenceReport() {
      const ev = this.phaseDetails[3].evidence
      const name = this.currentFactoryName || '企业'
      const rows = this.evidenceParamRows
      const paramTable = rows.map(r =>
        '<tr><td>' + r.indicator + '</td><td>' + r.sub + '</td><td>' + r.item + '</td><td>' + r.data + '</td><td>' + r.dataSource + '</td><td>' + r.factor + '（' + r.factorSource + '）</td></tr>'
      ).join('')
      const chainRows = this.phaseDetails[3].evidenceChain.map((ec, i) =>
        '<h3>' + (i + 1) + '. ' + ec.indicator + '（' + ec.result + ' · ' + ec.status + '）</h3>' +
        '<table class="tbl"><tr><th style="width:110px;">计算过程</th><td>' + ec.calc + '</td></tr>' +
        (ec.inputs || []).map(inp =>
          '<tr><th>输入参数</th><td>' + inp.param + ' — ' + inp.detail + '｜来源：' + inp.source + '｜可信度：' + inp.conf + '</td></tr>'
        ).join('') + '</table>'
      ).join('')
      const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>数据溯源报告-${name}</title>
<style>body{font-family:'SimSun','宋体',serif;max-width:900px;margin:40px auto;padding:0 32px;color:#1f2d3d;line-height:1.9;}
h1{text-align:center;font-size:22px;margin-bottom:8px;} .sub{text-align:center;color:#67c23a;font-size:12px;margin-bottom:24px;}
.meta{font-size:14px;border:1px solid #dcdfe6;border-radius:6px;padding:12px 16px;margin-bottom:20px;} .meta p{margin:4px 0;}
h2{font-size:15px;margin:20px 0 10px;} h3{font-size:14px;margin:18px 0 8px;} .tbl{width:100%;border-collapse:collapse;font-size:11px;}
.tbl th,.tbl td{border:1px solid #dcdfe6;padding:5px 7px;text-align:left;vertical-align:top;} .tbl th{background:#f5f7fa;font-weight:600;}
.hint{color:#909399;font-size:12px;border-top:1px dashed #dcdfe6;padding-top:12px;margin-top:40px;}</style></head><body>
<h1>数据溯源报告</h1>
<div class="sub">（绿色工厂申报 · 证据链 SHA-256 签名防篡改）</div>
<div class="meta">
<p>企业名称：${name}</p>
<p>参数总数：${ev.total} 项（自动采集 ${ev.autoCollected} 项 · 统一数据底座；手动提供 ${ev.manualProvided} 项 · 来源凭证已归档）</p>
<p>归档位置：报告与档案中心（随评价指标自评表及证明材料一并归档）</p>
</div>
<h2>一、核算输入参数溯源明细（${rows.length} 项）</h2>
<table class="tbl"><tr><th>所属指标</th><th>构成子模块</th><th>输入参数</th><th>活动数据</th><th>数据来源</th><th>因子（来源）</th></tr>
${paramTable}</table>
<p style="font-size:12px;color:#909399;">注：其余底座自动采集参数（台账级）由统一数据底座留存，不参与核算公式输入。</p>
<h2>二、核心指标证据链</h2>
${chainRows}
<div class="hint">本报告由平台自动生成：每项结果可逆向追溯至原始凭证，全部参数带来源/统计口径/计算过程/判定依据。</div>
</body></html>`
      const blob = new Blob(['\ufeff' + html], { type: 'text/html;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `数据溯源报告-${name}.html`
      a.click()
      URL.revokeObjectURL(a.href)
      this.$message.success('数据溯源报告已下载（与预览内容一致：参数明细 ' + rows.length + ' 项 + 核心指标证据链）')
    },
    // 阶段6：整篇编制弹窗（通读 + 就地编辑一体）
    openFullPreview() {
      this.fullPreviewVisible = true
    },
    // 目录跳转到指定章节（锚点滚动）
    jumpToPreviewSection(idx) {
      const el = document.getElementById('fp-sec-' + idx)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    // 段落只读渲染（自动生成章）+ 占位符高亮
    renderPlanParagraph(text) {
      const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      return esc(text || '').replace(/【(待企业补充：[^】]*)】/g, '<span class="fp-placeholder">【$1】</span>').replace(/\n/g, '<br/>')
    },
    // 阶段6：解析表格块的行数据（dynamic 标记时从上游权威源动态生成，保证单一数据入口、改动自动同步）
    // ===== 标准驱动：库访问 =====
    // 按指标名查公式
    formulaOf(indicatorName) {
      const ind = this.standardIndicators.find(i => i.name === indicatorName)
      if (!ind || !ind.formulaId) return null
      return FORMULA_LIBRARY[ind.formulaId] || null
    },
    // 按 key 查因子
    factorOf(key) {
      return FACTOR_LIBRARY[key] || null
    },
    // 按类别查因子列表
    factorsByCategory(cat) {
      return Object.keys(FACTOR_LIBRARY)
        .filter(k => FACTOR_LIBRARY[k].category === cat)
        .map(k => Object.assign({ key: k }, FACTOR_LIBRARY[k]))
    },
    // 一级指标权重
    categoryWeight(cat) {
      return { '能源低碳化': 30, '资源高效化': 30, '生产洁净化': 16, '产品绿色化': 16, '用地集约化': 8 }[cat] || 0
    },
    getTableRows(block) {
      // 评价指标评分表（GB/T 36132-2025 表 C.1 格式）
      if (block.dynamic === 'scoreTable') {
        const inds = (this.phaseDetails[2] && this.phaseDetails[2].indicators) || []
        const rows = inds.map(i => ({
          category: i.category + '（' + this.categoryWeight(i.category) + '%）',
          no: i.no,
          name: i.name,
          indicatorType: i.indicatorType,
          unit: i.unit,
          leading: i.leading,
          baseline: i.baseline,
          weight: i.weight,
          value: i.value || '—',
          score: i.score,
          evidence: i.evidence || '—',
          rule: i.rule
        }))
        const total = inds.reduce((a, i) => a + (parseFloat(i.score) || 0), 0)
        const full = inds.reduce((a, i) => a + (parseFloat(i.weight) || 0), 0)
        rows.push({
          category: '合计', no: '', name: '', indicatorType: '', unit: '', leading: '', baseline: '', value: '', evidence: '',
          weight: full, score: total.toFixed(1), rule: '综合得分 ' + total.toFixed(1) + ' / ' + full + '（强度指标按产品单位口径）'
        })
        return rows
      }
      if (block.dynamic === 'baseInfo') {
        const bi = this.phaseDetails[0].qualification.baseInfo
        const find = label => {
          const item = bi.find(x => x.label === label)
          return item ? item.value : ''
        }
        return [
          { field: '单位名称', value: find('单位名称') },
          { field: '单位地址', value: find('单位地址') },
          { field: '所属行业', value: '☑' + find('所属行业') },
          { field: '主要产品（服务）', value: find('主要产品') },
          { field: '单位性质', value: '内资（☑' + find('单位性质') + '）' },
          { field: '统一社会信用代码 / 法定代表人', value: find('统一社会信用代码') + ' / ' + find('法定代表人') },
          { field: '申报工作联系部门 / 联系人', value: find('申报工作联系部门') + ' / ' + find('联系人') },
          { field: '联系电话 / 电子邮箱', value: find('联系电话') + ' / ' + find('电子邮箱') }
        ]
      }
      // 表1：从阶段4 indicators（11项实际值/目标要求）+ 阶段5 goals（核心指标年度目标、建设期）动态生成
      if (block.dynamic === 'targetTable') {
        const goals = this.phaseDetails[3] && this.phaseDetails[3].goals
        if (!goals) return []
        const inds = this.phaseDetails[2].indicators
        // 指标元信息映射（类别/编号/单位/是否核心指标）
        const metaMap = {
          '能源消耗强度': { category: '能源低碳化', no: '1', unit: 'tce/万元', core: true },
          '碳排放强度': { category: '能源低碳化', no: '2', unit: 'tCO₂/万元', core: true },
          '可再生能源利用率': { category: '能源低碳化', no: '3', unit: '%', core: true },
          '能碳管理系统平台功能符合数量': { category: '能源低碳化', no: '4', unit: '项', core: false },
          '原材料消耗强度': { category: '资源高效化', no: '5', unit: 't/万元', core: true },
          '取水强度': { category: '资源高效化', no: '6', unit: 'm³/万元', core: true },
          '工业用水重复利用率': { category: '资源高效化', no: '7', unit: '%', core: false },
          '一般工业固体废物综合利用率': { category: '资源高效化', no: '8', unit: '%', core: false },
          '生产工艺和设备先进性': { category: '生产洁净化', no: '9', unit: '—', core: false },
          '绿色低碳改造升级项目投资额占比': { category: '生产洁净化', no: '10', unit: '%', core: false },
          '主要污染物产生或排放强度': { category: '生产洁净化', no: '11', unit: 'kg/万元', core: true },
          '绿色设计': { category: '产品绿色化', no: '12', unit: '—', core: false },
          '产品碳足迹': { category: '产品绿色化', no: '13', unit: '—', core: false },
          '土地产出率': { category: '用地集约化', no: '14', unit: '万元/m²', core: true }
        }
        // 提取实际值（去掉单位后缀，保留 9/13、可测量·可报告·可核查 等特殊值）
        const actualOf = v => {
          if (v.indexOf('（') > -1) v = v.slice(0, v.indexOf('（')) // 66.7%（2/3类）→ 66.7%
          const m = v.match(/^([0-9]+(?:\.[0-9]+)?(?:\/[0-9]+)?)/)
          return m ? m[1] : v
        }
        // 提取目标要求数值（去掉 ≤/≥/单位：≤0.2→0.2、≥90%→90、5项→5、—→—）
        const targetOf = v => {
          if (v === '—') return '—'
          const m = v.match(/([0-9]+(?:\.[0-9]+)?)/)
          return m ? m[1] : v
        }
        // 核心指标年度目标映射（从 goals.rows 找）
        const goalOf = name => {
          const g = goals.rows.find(r => r.name === name)
          return g || null
        }
        const sy = goals.startYear
        const ey = goals.endYear
        return inds.map(ind => {
          const meta = metaMap[ind.name] || { category: '', no: '', unit: '', core: false }
          const g = goalOf(ind.name)
          // 年度列动态键（y{年份}），值取 mids数组按起始年顺序对应；单年建设期无中间年列
          const row = {
            category: meta.category,
            indicator: meta.no + ' ' + ind.name + (meta.core ? ' *' : ''),
            unit: meta.unit,
            actual: actualOf(ind.value)
          }
          for (let y = sy; y < ey; y++) {
            const mi = y - sy
            row['y' + y] = (g && g.mids && g.mids[mi] !== undefined) ? g.mids[mi] : (ind.status === 'na' ? '—' : targetOf(ind.target))
          }
          row.final = g ? g.finalGoal : (ind.status === 'na' ? '—' : targetOf(ind.target))
          row.remark = meta.core ? '核心指标' : (ind.status === 'na' ? '不适用' : '企业自主目标')
          return row
        })
      }
      return block.rows || []
    },
    // 阶段6：解析表格块的列定义（targetTable 的年份列随建设期长度动态生成，保证单一数据源；单年建设期无中间年列）
    getTableColumns(block) {
      if (block.dynamic === 'targetTable') {
        const g = this.phaseDetails[3] && this.phaseDetails[3].goals
        if (!g) return block.columns || []
        const sy = g.startYear
        const ey = g.endYear
        const cols = [
          { key: 'category', label: '类别', width: 110 },
          { key: 'indicator', label: '指标', width: 210 },
          { key: 'unit', label: '单位', width: 70 },
          { key: 'actual', label: (sy - 1) + ' 实际值', width: 110 }
        ]
        for (let y = sy; y < ey; y++) cols.push({ key: 'y' + y, label: y + ' 年' })
        cols.push({ key: 'final', label: '目标达成（' + ey + '年）', width: 130 })
        cols.push({ key: 'remark', label: '备注', width: 90 })
        return cols
      }
      return block.columns || []
    },
    // 阶段6：保存章节编辑（draft 章节保存后状态更新：「草稿待补充」→「已补充」、「草稿待确认」→「已确认」；整篇弹窗内就地保存）
    saveSectionEdit(idx) {
      const sec = this.materialSkillConfig.coreOutput.sections[idx]
      if (sec && sec.fillType !== 'auto' && sec.status !== '草稿待决策') {
        sec.status = sec.status === '草稿待确认' ? '已确认' : '已补充'
      }
      this.$message.success('「' + (sec ? sec.title : '') + '」内容已保存')
    },
    // 阶段6：AI 润色（将【待企业补充/决策】占位符替换为 AI 建议内容，标注待企业确认）
    polishSection(idx) {
      const sec = this.materialSkillConfig.coreOutput.sections[idx]
      if (!sec) return
      // AI 建议映射（模拟 LLM 润色：针对占位符给出参考内容）
      const wanTotal = this.wanTons(this.adoptedMeasureSummary().total)
      const money = Math.round(Number(wanTotal) * 500 / 1000) * 1000   // 按平均碳价约 500 元/吨估算
      const polishMap = [
        { from: '【待企业补充：具体产量】', to: '【AI建议：12 万辆（参考 2025 年产量，请企业核实）】' },
        { from: '【待企业补充：工艺能耗特点与主要用能环节说明】', to: '【AI建议：冲压、焊装以电力为主，涂装为高耗能环节（天然气烘干 + 电加热），总装以电耗为主】' },
        { from: '【待企业补充：各路径已开展的具体工作与建设亮点】', to: '【AI建议：已建成分布式光伏一期并网发电，绿电直连合同已签订并逐年扩容】' },
        { from: '【待企业决策：年度目标值是否采纳智能体推荐】', to: '【AI建议：年度目标值经企业逐项确认，逐年下降不回退、期满达标】' },
        { from: '【待企业补充：重点项目投资、建设周期、建设内容】', to: '【AI建议：光伏二期 20MW 项目，投资约 1.2 亿元，2026—2027 年建设】' },
        { from: '【待企业补充：具体金额】', to: '【AI建议：约 ' + money.toLocaleString() + ' 万元/年（按 ' + wanTotal + ' 万吨 × 平均碳价测算，请企业核实）】' },
        { from: '【待企业补充：社会效益具体描述】', to: '【AI建议：带动上下游供应链协同降碳，形成可复制推广的绿色工厂建设模式】' }
      ]
      this.isPolishing = true
      setTimeout(() => {
        let hitCount = 0
        const blocks = sec.blocks || []
        blocks.forEach(b => {
          if (b.type !== 'paragraph') return
          let text = b.text
          polishMap.forEach(p => {
            if (text.indexOf(p.from) > -1) {
              text = text.split(p.from).join(p.to)
              hitCount++
            }
          })
          b.text = text
        })
        this.isPolishing = false
        this.$message.success(hitCount > 0 ? 'AI 已润色 ' + hitCount + ' 处占位符（建议内容标注为【AI建议】，请核实后保存）' : '本段无待润色占位符')
      }, 800)
    },

    // ===== 演示案例：小米汽车工厂 =====
    seedDemoTask() {
      const boxStyle = 'padding:12px 14px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;margin:8px 0;'
      const demoTask = {
        id: 'zcf-demo-xiaomi',
        seedVersion: 23,
        factoryName: '小米汽车工厂',
        scenario: 'GF',
        caseType: 'manufacturing',
        planId: 'plan-2025',
        planLabel: '《绿色工厂评价通则》（GB/T 36132-2025）',
        baselineYear: '2025',
        currentStepIndex: 3,
        status: 'active',
        createdAt: '2026/08/18 09:30:00',
        updatedAt: '2026/08/19 10:15:00',
        messages: [
          {
            id: 'demo-m1', role: 'user', timestamp: '08/18 09:30',
            content: '小米汽车工厂 开始申报'
          },
          {
            id: 'demo-m2', role: 'assistant', timestamp: '08/18 09:30',
            suggestions: [],
            content: '<strong>✅ 阶段1 · 标准规则适配 — 已完成</strong><br/>' +
              '<div style="' + boxStyle + '">' +
              '加载标准《绿色工厂评价通则》（GB/T 36132-2025） · 带出基本信息 11 项 · 核验资格条件 14 项（全部通过）· 自动匹配证明材料 6 份。<br/>' +
              '核算边界：北京亦庄单厂区（不含武汉、上海基地，随单位地址确定）· 统计期 ' + this.baselineYear + ' 年度。<br/>' +
              '<strong style="color:#37c876;">校验结论：满足国家级绿色工厂申报条件</strong><br/>' +
              '→ 确认右侧信息无误后，点击底部按钮进入核算模型搭建' +
              '</div>'
          },
          {
            id: 'demo-m3', role: 'user', timestamp: '08/18 09:45',
            content: '下一步'
          },
          {
            id: 'demo-m3b', role: 'assistant', timestamp: '08/18 09:45',
            suggestions: [],
            content: '<strong>✅ 标准规则适配 — 已完成</strong><br/><br/>' +
              '<div style="' + boxStyle + '">' +
              '<strong style="color:#0067FE;">▶ 当前阶段 2/4 · 数据收集与校验</strong><br/>' +
              '材料识别自动建模·按指标搭建核算模型<br/>' +
              '关联基础库：政策标准库、组织资源库、组织模板库<br/>' +
              '右侧内容区已切换为本阶段内容，按提示完成确认后推进。<br/><br/>' +
              '<strong style="color:#0067FE;">本阶段操作指南</strong><br/>' +
              '· 模型按「指标 → 构成子模块 → 构成明细」三级组织，可维护项：化石燃料燃烧排放源、购入电力排放源（按购电来源）、物理电力来源、生产过程（多输入多输出）、碳清除方式<br/>' +
              '· 派生项（绿色标签，如 E₁/E₂/Ez/Q、购电认定量、工业增加值、装备功率、直接排放量等）由上游自动联动生成，无需维护<br/>' +
              '· 名称带 ℹ 图标可悬浮查看口径与联动说明<br/>' +
              '· 核算方法（购入电力 a/b/c 三方法）在阶段 4 数据接入后试算推荐<br/><br/>' +
              '<strong style="color:#0067FE;">📄 材料识别 · 自动建模</strong><br/>' +
              '支持上传能源台账 / 购电合同 / 物理消纳凭证 / 工艺说明 / 设备清单 / 核查报告 / 产品清单（B204-1），我将自动识别并生成对应构成明细——点击下方建议按钮或直接输入「上传XX」即可触发。' +
              '</div>'
          },
          {
            id: 'demo-m4', role: 'assistant', timestamp: '08/18 09:46',
            suggestions: [],
            content: '<strong>✅ 阶段1 · 标准规则适配 — 已完成</strong><br/>' +
              '<div style="' + boxStyle + '">' +
              '14 项评价指标已按「指标 → 计算参数」两级完成建模；指标定义、公式与权重见阶段 2 数据清单。<br/>' +
              '派生项（E₁/E₂/Ez/Q 等）已由上游自动联动生成，无需维护。' +
              '</div>'
          },
          {
            id: 'demo-m5', role: 'user', timestamp: '08/18 14:20',
            content: '下一步'
          },
          {
            id: 'demo-m5b', role: 'assistant', timestamp: '08/18 14:20',
            suggestions: ['查看待处理清单', '查看活动数据与因子'],
            content: '<strong>✅ 标准规则适配 — 已完成 · ▶ 当前阶段 2/4 · 数据收集与校验</strong><br/>' +
              '<div style="' + boxStyle + '">' +
              '<strong style="color:#0067FE;">【阶段2 · 数据收集与校验】</strong><br/>' +
              '全部参数多重校验完成：待补充 <b style="color:#E6A23C;">1 项</b> · 待确认 <b>2 项</b>，可在右侧逐项确认。<br/>' +
              '→ 全部确认后点击底部按钮推进阶段 3 指标核算与评价' +
              '</div>'
          },
          {
            id: 'demo-m6', role: 'assistant', timestamp: '08/18 14:25',
            suggestions: ['数据确认'],
            content: '<strong>✅ 阶段2 · 数据收集与校验 — 已完成</strong><br/>' +
              '<div style="' + boxStyle + '">' +
              '全部参数齐备，来源完整率 100%，校验全部通过。<br/>' +
              '待处理 3 项已全部闭环：外购电力 Q4 电量已补充填报 · 天然气热值已确认采用检测值 38.9 MJ/m³ · 碳足迹分析类别口径已确认 2/3 类。<br/>' +
              '各项活动数据与匹配因子的对应关系见右侧「活动数据与因子」页签。' +
              '</div>'
          },
          {
            id: 'demo-m7', role: 'user', timestamp: '08/19 10:15',
            content: '下一步'
          },
          {
            id: 'demo-m8', role: 'assistant', timestamp: '08/19 10:15',
            content: '<strong>✅ 数据收集与校验 — 已完成 · ▶ 当前阶段 3/4 · 指标核算与评价</strong><br/>' +
              '<div style="' + boxStyle + '">' +
              '<strong style="color:#0067FE;">【阶段3 · 指标核算与评价】</strong><br/>' +
              '14 项指标核算完成（' + this.baselineYear + ' 年度），结果与计算过程见右侧「指标核算结果 / 核算明细」。<br/>' +
              '核心 3 项评价结果（通知三（三））：满足目标要求 <b style="color:#52c41a;">1 项</b> · 满足基本要求 <b>2 项</b>，无不满足项；其余 8 项不设量化要求，验收时按较申报时持续改善核查（附件1注1）。<br/>' +
              '→ 核对无误后点击底部「确认核算结果」，进入阶段 4 数据溯源与材料归档' +
              '</div>'
          }
        ]
      }
      this.taskList.unshift(demoTask)
      this.saveTasks()
    },
    // 算力设施演示任务（绿算智算中心，caseType=computing，展示两类申报主体差异化）
    seedComputingDemoTask() {
      const boxStyle = 'padding:12px 14px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;margin:8px 0;'
      const computingTask = {
        id: 'zcf-demo-computing',
        seedVersion: 23,
        factoryName: '绿算智算中心',
        scenario: 'GF',
        caseType: 'computing',
        planId: 'plan-2025',
        planLabel: '《绿色工厂评价通则》（GB/T 36132-2025）',
        baselineYear: '2025',
        currentStepIndex: 0,
        status: 'active',
        createdAt: '2026/08/25 14:00:00',
        updatedAt: '2026/08/25 14:00:00',
        messages: [
          {
            id: 'cmp-m1',
            role: 'assistant',
            timestamp: '2026/08/25 14:00:00',
            content: '<strong>✅ 已进入申报项目：绿算智算中心（算力设施）</strong><br/><br/>' +
              '<div style="' + boxStyle + '">' +
              '<strong style="color:#0067FE;">【阶段1 · 标准适配】</strong><br/>' +
              '本案例为<b>零碳算力设施</b>申报主体（通知二（二）），与制造型企业申报条件存在差异：<br/>' +
              '· 资格条件：产权清晰、物理边界明确、独立供配电制冷系统、规模≥3000机架、PUE达GB40879 2级、入选国家绿色算力设施名单<br/>' +
              '· 指标适用性：2.1 单位工业增加值能耗不适用、1.3 物理认定量占比不设定基本要求<br/>' +
              '右侧内容区已切换为本案例内容，按提示完成确认后推进。' +
              '</div>'
          },
          {
            id: 'cmp-m2',
            role: 'assistant',
            timestamp: '2026/08/25 14:00:05',
            suggestions: ['下一步：核算模型搭建'],
            content: '<strong style="color:#0067FE;">▶ 当前阶段 1/4 · 标准规则适配</strong><br/><br/>' +
              '<div style="' + boxStyle + '">' +
              '<strong style="color:#0067FE;">【阶段1 · 标准适配】</strong><br/>' +
              '算力设施资格条件（系统自动核验）已加载：<br/>' +
              '• 独立法人资格：是 ✓<br/>' +
              '• 产权清晰·物理边界明确：是 ✓<br/>' +
              '• 独立供配电和制冷系统：是 ✓<br/>' +
              '• 规模 ≥3000 标准机架：4,500 个 ✓<br/>' +
              '• 电能利用效率 GB40879 2级：PUE 1.25 ✓<br/>' +
              '• 已入选国家绿色算力设施名单：是 ✓<br/><br/>' +
              '全部硬资格满足，可进入核算模型搭建。' +
              '</div>'
          }
        ]
      }
      this.taskList.unshift(computingTask)
      this.saveTasks()
    },

    deleteTask(taskId) {
      const idx = this.taskList.findIndex(t => t.id === taskId)
      if (idx > -1) {
        this.taskList.splice(idx, 1)
        this.saveTasks()
      }
    },

    // ===== 阶段切换 =====
    jumpToPhase(idx) {
      if (idx <= this.maxStepIndex) {
        this.currentStepIndex = idx
        // 仅返回当前（最高）阶段时同步任务进度；回看历史阶段不写回，防止进度回退破坏
        if (idx === this.maxStepIndex) {
          this.updateTaskProgress()
        }
      }
    },
    // 打开新建任务对话框（依据 → 主体类型默认首个 → 企业名称/评价年度带出；评价年度支持调整试算）
    // 切换申报依据：同步标准名称、评价年度与主体类型默认值
    onPlanVersionChange(planId) {
      const plan = this.planVersions.find(p => p.id === planId)
      if (!plan) return
      this.currentPlanLabel = plan.label
      this.baselineYear = plan.baselineYear
      this.$message.success('已切换申报依据：' + plan.standard)
    },
    openNewTaskDialog() {
      this.newTaskForm.planId = this.planVersions[0].id
      this.newTaskForm.scene = this.planVersions[0].sceneOptions[0].key
      this.newTaskForm.baselineYear = String(this.planVersions[0].baselineYear)
      this.showNewTaskDialog = true
    },
    // 评价年度调整确认：默认按政策文件带出，修改后提示申报材料不合规风险，确认后用于试算
    onBaselineYearChange(val) {
      if (!val || String(val) === String(this.newTaskPlan.baselineYear)) return
      const stdYear = this.newTaskPlan.baselineYear
      this.$confirm(
        `当前申报依据《${this.newTaskPlan.standard.replace(/[《》]/g, '')}》要求评价年度为 ${stdYear} 年，修改后与政策文件要求不一致，可能导致申报材料不被受理。若仅为内部试算用途，可点击「继续使用」，正式申报时请恢复为 ${stdYear} 年。`,
        '评价年度与政策要求不一致',
        { confirmButtonText: '继续使用（试算）', cancelButtonText: `恢复为 ${stdYear} 年`, type: 'warning', distinguishCancelAndClose: true }
      ).then(() => {}).catch(() => {
        this.newTaskForm.baselineYear = String(stdYear)
      })
    },
    // 确认新建任务（申报依据/主体类型/评价年度由用户确定，企业名称自动带出）
    confirmNewTask() {
      const name = this.autoFactoryName
      const plan = this.newTaskPlan
      const baseYear = String(this.newTaskForm.baselineYear || plan.baselineYear)
      // 同主体 + 同评价年度：提示复用既有任务（年度复评语义），防重复
      const sameYear = this.taskList.find(t => t.factoryName === name && String(t.baselineYear) === baseYear)
      if (sameYear) {
        this.$confirm(`「${name}」已存在评价年度 ${baseYear} 的申报任务，是否直接进入该任务？`, '任务已存在', {
          confirmButtonText: '进入已有任务',
          cancelButtonText: '取消',
          type: 'info'
        }).then(() => {
          this.showNewTaskDialog = false
          this.continueTask(sameYear)
        }).catch(() => {})
        return
      }
      // 适用场景分组下仅申报主体类型一个维度，单选；一任务一场景，多场景需分别创建任务
      const caseType = this.newTaskForm.scene || 'manufacturing'
      const task = this.createTask(name, 'GF', caseType, plan)
      // 评价年度以用户最终确认值为准（支持试算调整，不强制等于政策要求年）
      task.baselineYear = baseYear
      this.showNewTaskDialog = false
      this.$nextTick(() => {
        this.continueTask(task)
      })
      const warnSuffix = baseYear !== String(plan.baselineYear) ? '（试算评价年度，与政策要求 ' + plan.baselineYear + ' 年不一致）' : ''
      const sceneLabel = (plan.sceneOptions.find(s => s.key === caseType) || {}).label || caseType
      this.$message.success('已创建「' + name + '」申报项目（' + sceneLabel + ' · 评价年度 ' + baseYear + ' 年）' + warnSuffix)
    },
    // 申报场景自动判定（不暴露切换UI）：阶段4核心指标全部满足目标要求→巩固提升，否则→改善中
    applyAutoScenario() {
      const inds = this.phaseDetails[2].indicators || []
      const allTarget = inds.length > 0 && inds.every(i => i.status === 'target')
      const mode = allTarget ? 'consolidate' : 'improve'
      if (mode !== this.scenarioMode) {
        this.switchScenario(mode)
      }
    },
    // 切换申报场景（改善中 / 已达标巩固提升），同步替换阶段5的目标/差距/措施/诊断
    switchScenario(mode) {
      if (mode === this.scenarioMode) return
      const p4 = this.phaseDetails[3]
      // 首次切换时快照改善中场景，便于恢复
      if (!this.improveScenario) {
        this.improveScenario = {
          goals: JSON.parse(JSON.stringify(p4.goals)),
          gaps: JSON.parse(JSON.stringify(p4.gaps)),
          measures: JSON.parse(JSON.stringify(p4.measures)),
          diagnosis: p4.diagnosis
        }
      }
      if (mode === 'consolidate') {
        const c = this.consolidateScenario
        p4.goals = JSON.parse(JSON.stringify(c.goals))
        p4.gaps = JSON.parse(JSON.stringify(c.gaps))
        p4.measures = JSON.parse(JSON.stringify(c.measures))
        p4.diagnosis = c.diagnosis
        this.phaseOps.adoptedMeasures = []
        this.phaseOps.goalConfirmed = false
        this.phaseOps.planGenerated = false
        this.initAdoptedMeasures()
        this.$message.success('已切换为「已达标·巩固提升」场景，核心指标全部达到目标要求')
      } else {
        const m = this.improveScenario
        p4.goals = JSON.parse(JSON.stringify(m.goals))
        p4.gaps = JSON.parse(JSON.stringify(m.gaps))
        p4.measures = JSON.parse(JSON.stringify(m.measures))
        p4.diagnosis = m.diagnosis
        this.phaseOps.adoptedMeasures = []
        this.phaseOps.goalConfirmed = false
        this.phaseOps.planGenerated = false
        this.initAdoptedMeasures()
        this.$message.success('已切换为「改善中」场景')
      }
      this.scenarioMode = mode
    },
    // 阶段5：改善措施默认全部「已采纳」（AI 推荐 = 默认纳入建设方案，用户可逐项取消采纳）
    initAdoptedMeasures() {
      this.phaseOps.adoptedMeasures = (this.phaseDetails[3].measures || []).map(m => m.name)
    },
    // 切换完整案例数据（制造型企业 / 算力设施），整体替换 phaseDetails
    loadCase(type) {
      if (type === 'computing') {
        if (!this.manufacturingSnapshot) {
          this.manufacturingSnapshot = JSON.parse(JSON.stringify(this.phaseDetails))
          this._manufacturingMaterialConfig = JSON.parse(JSON.stringify(this.materialSkillConfig))
        }
        this.phaseDetails = JSON.parse(JSON.stringify(this.computingPhaseDetails))
        this.materialSkillConfig = JSON.parse(JSON.stringify(this.computingMaterialSkillConfig))
      } else {
        if (this.manufacturingSnapshot) {
          this.phaseDetails = JSON.parse(JSON.stringify(this.manufacturingSnapshot))
          this.materialSkillConfig = JSON.parse(JSON.stringify(this._manufacturingMaterialConfig || this.materialSkillConfig))
        }
      }
    },
    // 方案A：保存历史阶段修改，标记下游阶段需重新确认
    saveHistoryEdit() {
      const fromIdx = this.currentStepIndex
      // 标记下游（fromIdx+1 到 maxStepIndex）阶段需重新确认
      this.invalidatedStages = []
      for (let k = fromIdx + 1; k <= this.maxStepIndex; k++) {
        this.invalidatedStages.push(k)
      }
      const downstreamCount = this.invalidatedStages.length
      this.$message.warning('已保存「' + this.phases[fromIdx].name + '」的修改，下游 ' + downstreamCount + ' 个阶段需重新确认')
      // 跳回当前最高阶段
      this.currentStepIndex = this.maxStepIndex
      this.updateTaskProgress()
    },
    // 清除某阶段的失效标记（重新确认通过后调用）
    clearInvalidated(idx) {
      this.invalidatedStages = this.invalidatedStages.filter(x => x !== idx)
    },

    nextPhase() {
      // 回看模式下的推进指令：恢复到当前（最高）阶段而非继续推进，防止进度回退
      if (this.currentStepIndex < this.maxStepIndex) {
        this.$message.info('正处于回看模式，已为您返回当前阶段「' + this.phases[this.maxStepIndex].name + '」')
        this.currentStepIndex = this.maxStepIndex
        this.updateTaskProgress()
        return
      }
      // 阶段3推进前置校验：待处理事项须清零（与底部确认栏一致，拦截 chat"数据确认/下一步"绕过）
      if (this.currentStepIndex === 1 && this.pendingValCount() > 0) {
        this.$message.warning('尚有 ' + this.pendingValCount() + ' 项待处理事项，请先在右侧「待补充 / 待确认」页签处理')
        return
      }
      if (this.currentStepIndex < this.phases.length - 1) {
        const prev = this.phases[this.currentStepIndex]
        const confirmIdx = this.currentStepIndex // 即将确认完成的阶段索引
        this.currentStepIndex++
        this.maxStepIndex = Math.max(this.maxStepIndex, this.currentStepIndex)
        const phase = this.phases[this.currentStepIndex]
        // 重新确认通过：清除该阶段的失效标记
        this.clearInvalidated(confirmIdx)
        // 进入阶段5：按阶段4核算结果自动判定申报场景（核心指标全部达标→巩固提升，否则→改善中）
        if (phase.key === 'OPTIMIZATION') {
          this.applyAutoScenario()
          // 改善措施默认全部「已采纳」（AI 推荐 = 默认纳入建设方案，用户可逐项取消）
          this.initAdoptedMeasures()
        }
        // 阶段专属引导（阶段2：核算模型操作方式 + 材料识别清单；阶段3：双页签数据校验；阶段4：指标核算结果与两级判定）
        let extra = ''
        if (phase.key === 'DATA_COLLECTION') {
          extra = this.buildValGuideHtml()
        }
        if (phase.key === 'EVALUATION') {
          extra = this.buildEvalGuideHtml()
        }
        if (phase.key === 'OPTIMIZATION') {
          extra = this.buildOptGuideHtml()
        }
        if (phase.key === 'MATERIAL_REPORT') {
          extra = this.buildReportGuideHtml()
        }
        if (phase.key === 'MODEL_SETUP') {
          const mhs = this.phaseDetails[1].materialHints
          const matList = mhs.map(m =>
            '<div style="display:flex;gap:6px;font-size:12px;margin:2px 0;line-height:1.5;">' +
            '<span style="color:#0067FE;">·</span>' +
            '<span style="color:#303133;">' + m.name + '（' + m.formats + '）</span>' +
            '<span style="color:#64748b;margin-left:auto;text-align:right;">→ ' + m.generates + '（' + m.target + '）</span></div>'
          ).join('')
          extra = '<strong style="color:#0067FE;">本阶段操作指南</strong><br/>' +
            '· 模型按「指标 → 构成子模块 → 构成明细」三级组织，可维护项：化石燃料燃烧排放源、购入电力排放源（按购电来源）、物理电力来源、生产过程（多输入多输出）、碳清除方式<br/>' +
            '· 派生项（绿色标签，如 E₁/E₂/Ez/Q、购电认定量、工业增加值、装备功率、直接排放量等）由上游自动联动生成，无需维护<br/>' +
            '· 名称带 ℹ 图标可悬浮查看口径与联动说明<br/>' +
            '· 核算方法（购入电力 a/b/c 三方法）在阶段 4 数据接入后试算推荐<br/><br/>' +
            '<strong style="color:#0067FE;">📄 材料识别 · 自动建模</strong><br/>' +
            '支持上传以下材料，我将自动识别并生成对应构成明细（点击下方「上传XX」建议或直接输入指令）：<br/>' + matList
        }
        this.messages.push({
          id: Date.now(),
          role: 'assistant',
          content: '<strong>✅ ' + prev.name + ' — 已完成</strong><br/><br/>' +
            '<div style="padding:12px 14px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;">' +
            '<strong style="color:#0067FE;">▶ 当前阶段 ' + (this.currentStepIndex + 1) + '/' + this.phases.length + ' · ' + phase.name + '</strong><br/>' +
            phase.desc + '<br/>' +
            '关联基础库：' + (phase.libraries.length ? phase.libraries.join('、') : '无（智能体内部分析）') + '<br/>' +
            '右侧内容区已切换为本阶段内容，按提示完成确认后推进。' +
            (extra ? '<br/><br/>' + extra : '') +
            '</div>',
          timestamp: '刚刚',
          suggestions: this.getReplySuggestions()
        })
        this.updateTaskProgress()
        this.$nextTick(this.scrollToBottom)
      }
    },

    updateTaskProgress() {
      if (!this.currentTaskId) return
      const task = this.taskList.find(t => t.id === this.currentTaskId)
      if (task) {
        task.currentStepIndex = this.currentStepIndex
        task.updatedAt = new Date().toLocaleString('zh-CN')
        // 同步对话记录到任务
        if (this.pageMode === 'task-active') {
          task.messages = JSON.parse(JSON.stringify(this.messages))
        }
        this.saveTasks()
      }
    },

    // ===== 持久化 =====
    saveTasks() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.taskList))
      } catch (e) {
        console.warn('保存任务失败', e)
      }
    },

    loadTasks() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          this.taskList = JSON.parse(raw)
          // 兼容清理：演示任务按版本号管理（seedVersion 不一致即刷新为最新演示数据）
          const oldDemoIdx = this.taskList.findIndex(t => t.id === 'zcf-demo-xiaomi' && t.seedVersion !== 23)
          if (oldDemoIdx > -1) {
            this.taskList.splice(oldDemoIdx, 1)
            this.seedDemoTask()
          }
          const oldCompIdx = this.taskList.findIndex(t => t.id === 'zcf-demo-computing' && t.seedVersion !== 23)
          if (oldCompIdx > -1) {
            this.taskList.splice(oldCompIdx, 1)
            this.seedComputingDemoTask()
          }
        }
      } catch (e) {
        console.warn('加载任务失败', e)
      }
    },

    // ===== 辅助方法 =====
    getTaskStatusLabel(status) {
      const map = { active: '进行中', completed: '已完成', pending: '待开始' }
      return map[status] || '未知'
    },

    getTaskStatusType(status) {
      const map = { active: 'primary', completed: 'success', pending: 'info' }
      return map[status] || 'info'
    },

    getPhaseName(idx) {
      return this.phases[idx] ? this.phases[idx].name : '未知'
    },

    getLibrariesByPhase(idx) {
      return this.libraries.filter(lib => lib.stages.includes(idx))
    },

    // ===== 重置：重置当前任务的对话内容和步骤进度 =====
    resetSession() {
      if (!this.currentTaskId) return
      // 步骤回到阶段1
      this.currentStepIndex = 0
      this.inputText = ''
      this.showCmdPanel = false
      // 重置阶段操作状态
      this.phaseOps.resultConfirmed = false
      this.phaseOps.goalConfirmed = false
      this.phaseOps.planGenerated = false
      this.phaseOps.adoptedMeasures = []
      this.phaseOps.dataTab = 'validation'
      this.maxStepIndex = 0
      this.invalidatedStages = []
      this.confirmRecords = []
      this.isReportArchived = false
      // 重置阶段数据（资格现状/材料关联/材料识别状态/执行过程/核算模型增删等恢复初始）
      if (this.applicantType === 'computing' && this._initialComputingPhaseDetails) {
        this.phaseDetails = JSON.parse(JSON.stringify(this._initialComputingPhaseDetails))
      } else if (this._initialPhaseDetails) {
        this.phaseDetails = JSON.parse(JSON.stringify(this._initialPhaseDetails))
      }
      // 重置任务记录
      const task = this.taskList.find(t => t.id === this.currentTaskId)
      if (task) {
        task.currentStepIndex = 0
        task.status = 'active'
        task.updatedAt = new Date().toLocaleString('zh-CN')
      }
      this.saveTasks()
      // 重置对话内容：与新建任务一致的完整阶段引导
      this.messages = [this.makePhaseIntroMsg('任务已重置 — ')]
      this.$nextTick(this.scrollToBottom)
      this.$message.success('任务已重置，对话和进度恢复到初始状态')
    },

    // ===== 历史对话 =====
    toggleHistorySidebar() {
      this.showHistorySidebar = !this.showHistorySidebar
    },

    // ===== 新手引导 =====
    startOnboarding() {
      this.showOnboarding = true
      this.onboardingStep = 0
    },

    finishOnboarding() {
      this.showOnboarding = false
      this.onboardingStep = 0
      try {
        localStorage.setItem('zcf_onboarding_done', '1')
      } catch (e) { /* ignore */ }
    },

    saveCurrentConversation() {
      if (this.messages.length === 0) return
      const title = this.currentFactoryName || this.messages[0].content.substring(0, 20)
      const conv = {
        id: 'conv-' + Date.now(),
        title: title,
        timestamp: new Date().toLocaleString('zh-CN'),
        messages: [...this.messages]
      }
      this.conversationHistory.unshift(conv)
      this.currentConversationId = conv.id
    },

    loadConversation(convId) {
      const conv = this.conversationHistory.find(c => c.id === convId)
      if (conv) {
        this.messages = [...conv.messages]
        this.currentConversationId = convId
        this.$nextTick(this.scrollToBottom)
      }
    },

    deleteConversation(convId) {
      const idx = this.conversationHistory.findIndex(c => c.id === convId)
      if (idx > -1) {
        this.conversationHistory.splice(idx, 1)
        if (this.currentConversationId === convId) {
          this.currentConversationId = null
        }
      }
    },

    newConversation() {
      this.messages = []
      this.currentConversationId = null
      this.inputText = ''
      this.currentStepIndex = 0
      // 初始欢迎消息
      this.messages.push({
        id: Date.now(),
        role: 'assistant',
        content: '<strong>您好，我是绿色工厂辅助申报智能体！</strong><br/><br/>基于绿色工厂评价标准，为您提供 <strong>4 阶段智能申报辅助</strong> 服务。<br/><br/>在下方输入企业名称即可开始申报辅助流程。',
        timestamp: '刚刚'
      })
      this.$nextTick(this.scrollToBottom)
    },

    goBackToList() {
      this.pageMode = 'task-list'
    }
  },

  created() {
    // 保存阶段数据初始快照（非响应式），供重置时恢复
    this._initialPhaseDetails = JSON.parse(JSON.stringify(this.phaseDetails))
    this._initialComputingPhaseDetails = JSON.parse(JSON.stringify(this.computingPhaseDetails))
    // 阶段6「建设目标」段落：data 初始化时 phaseDetails 不可用，至此再按当前建设期生成
    this.syncTargetParagraph()
  },

  mounted() {
    // 数据版本控制：结构/文案变更时清空旧缓存，避免显示旧数据
    try {
      const VER = 'gf-2026-10-23-v4stage-14ind'
      if (localStorage.getItem('gf_state_version') !== VER) {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.setItem('gf_state_version', VER)
      }
    } catch (e) { /* ignore */ }
    this.loadTasks()
    // 无历史任务时注入演示案例（仅制造型企业，GB/T 36132-2025 适用对象）
    if (this.taskList.length === 0) {
      this.seedDemoTask()
    }
    // 首次访问自动展示新手引导
    try {
      if (!localStorage.getItem('zcf_onboarding_done')) {
        this.showOnboarding = true
      }
    } catch (e) { /* ignore */ }
  }
}
