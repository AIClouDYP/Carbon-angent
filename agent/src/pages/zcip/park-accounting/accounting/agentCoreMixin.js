/**
 * 园区碳核算智能体 — 核心Mixin (周期看板态)
 * 依据文件：
 *   1. 国家发展改革委、工业和信息化部、国家能源局《关于开展零碳园区建设的通知》（发改环资〔2025〕910号）
 *   2. 附件4《零碳园区碳排放核算方法（试行）》：E_园区 = E_能源活动 + E_工业过程（二氧化碳）
 *   3. 附件3《国家级零碳园区建设指标体系（试行）》：1项核心指标（单位能耗碳排放） + 5项引导指标
 */
import { DEFAULT_PLATFORM_TEMPLATES, STORAGE_KEY as PLATFORM_TPL_KEY } from '../../agent-center/data/platformTemplates'
import { ensureSeed } from '@/utils/policyStandardService'

export default {
  data() {
    return {
      // ===== 主题色 =====
      themeColor: '#0067fe',
      themeColorLight: 'rgba(0,103,254,0.1)',

      // ===== 页面模式：统一为 cycle-dashboard =====
      pageMode: 'cycle-dashboard',
      cfgActive: 1, // 配置步骤：1=园区主体信息 2=核算标准与建设指标 3=核算模型
      cfgEditStep: 0,
      showFactorLibDialog: false,

      // ===== 对话区 =====
      inputText: '',
      isTyping: false,
      messages: [],
      thinkingOpen: {},
      showHistorySidebar: false,
      conversationHistory: [],
      currentConversationId: null,

      // ===== 看板与期次 =====
      cdActiveTab: 'tasks', // tasks=结果与数据, model=配置与模型
      resultTab: 'chart',   // chart=图表与指标, list=数据清单
      resultPeriod: 'current',
  
    // 数据清单折叠状态（组 / 子项 / 底层折算参数）
      groupCollapsed: {},
      itemExpanded: {},
      paramExpanded: {},
      resultGranularity: 'month', // month=月度, year=年度
      resultYear: '2026',
      resultYearMonth: '2026-10',
      cycleArchive: {},     // 锁定状态
      configVersions: [],
      configEffectiveTo: '',

      // ===== 抽屉与弹窗 =====
      traceDrawer: false,
      traceGrpKey: '',
      // 计算参数更正（锁期前可改，留痕）
      traceTab: 'source',
      activeParam: 0,
      paramEditLog: [],
      paramEditDialog: false,
      paramEditForm: {},
      paramEditTarget: null,
      kpiTotalOverride: null,
      kpiCarbonPerTceOverride: null,
      traceRow: null,
      versionDialog: false,
      showOnboarding: false,
      // ===== 对话引擎（园区适配）=====
      thinkingOpen: {},
      parkInfoConfirmed: false,
      sourceListConfirmed: false,
      ledgerConfirmed: false,
      modelConfirmed: false,
      standardConfirmed: false,
      onboardingStep: 0,
      onboardingSteps: [
        {
          icon: 'el-icon-s-home',
          title: '欢迎使用零碳园区碳核算工作空间',
          text: '本系统严格依据国家发展改革委等《关于开展零碳园区建设的通知》（发改环资〔2025〕910号）附件4《零碳园区碳排放核算方法（试行）》及附件3《国家级零碳园区建设指标体系（试行）》，提供园区级二氧化碳排放核算与1核心+5引导指标对标监测。',
          features: [
            { icon: 'el-icon-time', title: '月度周期核算', desc: '按月自动汇总园区能源活动与工业过程排放', color: '#0067fe' },
            { icon: 'el-icon-sunny', title: '绿电消纳直接核减', desc: '屋顶光伏自发自用与绿电直供直接降低外购电排放', color: '#52c41a' },
            { icon: 'el-icon-odometer', title: '1+5指标体系对标', desc: '单位能耗碳排放核心门槛与清洁能源、循环利用引导指标实时诊断', color: '#0067fe' }
          ]
        }
      ],

      // ===== 园区基础信息（发改委核算主体口径）=====
      parkInfo: {
        name: '北京亦庄新城零碳智能产业园',
        area: 15600000.00, // 规划面积 m²（两位小数）
        period: '2026年10月',
        periodStart: '2026-01-01',
        annualEnergyScale: '100万tce以下', // 发改委官方两档：'100万tce以下' / '100万tce及以上'
        enterprisesCount: 128 // 规上重点用能企业
      },

      // 编辑态备份与弹窗
      parkInfoBackup: null,
      guidedIndicatorsBackup: null,
      emissionSourceGroupsBackup: null,
      emissionSourcesBackup: null,

      // 阶段 2 排放源清单管理（零碳园区碳核算智能体：底座数据识别 + 智能附件补充）
      sourceDialog: false,
      sourceIsEdit: false,
      sourceEditIndex: -1,
      sourceForm: {
        id: '',
        name: '',
        category: '化石燃料燃烧',
        channel: '底座数据识别',
        channelDetail: ''
      },
      sourceFilterCategory: 'all',
      sourceFilterCompany: 'all',
      sourceFilterChannel: 'all',

      // 排放源清单：大类 → 品种/具体加工转换过程/具体产品（园区统计口径，不落具体设施）
      // 渠道两值：底座数据识别 / 材料识别（channelDetail 为接入方式明细）
      emissionSources: [
        { id: 1, name: '天然气', category: '化石燃料燃烧', channel: '材料识别',
          channelDetail: '燃气结算发票与抄表底单 OCR 解析', enabled: true },
        { id: 2, name: '柴油', category: '化石燃料燃烧', channel: '材料识别',
          channelDetail: '加油卡月度对账单解析（柴油台账）', enabled: true },
        // 底座数据识别：底座仅提供总表读数、不支持测点明细的源，channelDetail 留空（detailUnsupported 标记）
        { id: 3, name: '天然气制热与蒸汽供应', category: '能源加工转换', channel: '底座数据识别',
          channelDetail: '', detailUnsupported: true, enabled: true },
        { id: 5, name: '公共电网受入电力', category: '净购入电力热力', channel: '底座数据识别',
          channelDetail: '', detailUnsupported: true, enabled: true },
        { id: 6, name: '企业专线受入电力', category: '净购入电力热力', channel: '底座数据识别',
          channelDetail: 'EMS 变配电系统高压侧专用测点直连', enabled: true },
        { id: 7, name: '屋顶光伏自发自用电力', category: '净购入电力热力', channel: '底座数据识别',
          channelDetail: '光伏逆变器并网电表群直连（按零碳属性核减）', enabled: true },
        { id: 8, name: '绿电直供与绿证核销电力', category: '净购入电力热力', channel: '材料识别',
          channelDetail: '北京电力交易中心消纳凭证与绿证核销台账', enabled: true },
        { id: 9, name: '12英寸集成电路芯片', category: '工业过程', channel: '材料识别',
          channelDetail: '晶圆月度产量台账与电子特气排污报告', enabled: true },
        { id: 10, name: '动力锂电池单体电芯', category: '工业过程', channel: '材料识别',
          channelDetail: '电芯下线台账与溶剂挥发物监测记录', enabled: true }
      ],

            // 阶段 2 子切换：'sources'（碳排放源清单） | 'ledgers'（指标计算参数底账）
      stage2SubTab: 'sources',
      indicatorLedgerDialog: false,
      indicatorLedgerForm: { pid: '', name: '', channel: '底座数据识别', channelDetail: '' },
      indicatorDataLedgersBackup: null,

      // 其他计算参数清单：按评价指标分组的全部输入参数（渠道三值：底座数据识别/材料识别/系统汇总）
      indicatorParamList: [
        { key: 'carbonPerTce', params: [
          { id: 'P01-1', name: '园区综合碳排放量', channel: '系统汇总', channelDetail: '由②排放源清单各品种核算结果自动汇总' },
          { id: 'P01-2', name: '园区综合能耗量', channel: '系统汇总', channelDetail: '全区电力、天然气、蒸汽折标煤自动汇总' }
        ] },
        { key: 'cleanEnergyRatio', params: [
          { id: 'P02-1', name: '非化石能源折标消纳量', channel: '系统汇总', channelDetail: '由②排放源清单光伏自发自用与绿电直供电量折标汇总' },
          { id: 'P02-2', name: '园区综合能耗量', channel: '系统汇总', channelDetail: '同单位能耗碳排放分母' }
        ] },
        { key: 'productEnergyLimitRatio', params: [
          { id: 'P03-1', name: '能效达标产品类型数量', channel: '材料识别', channelDetail: '能效检测审计报告按产品类型判定达标' },
          { id: 'P03-2', name: '产品类型总数', channel: '系统汇总' }
        ] },
        { key: 'solidWasteRatio', params: [
          { id: 'P04-1', name: '固废综合利用量', channel: '材料识别', channelDetail: '转移联单与资源化利用合同解析' },
          { id: 'P04-2', name: '固废产生总量', channel: '材料识别', channelDetail: '出厂地磅电子称重单解析' }
        ] },
        { key: 'wasteHeatUtilRatio', params: [
          { id: 'P05-1', name: '余热已利用量', channel: '底座数据识别', channelDetail: '余热回收计量表直连（本园区消纳）' },
          { id: 'P05-2', name: '余热理论可回收量', channel: '材料识别', channelDetail: '余能资源评估报告核定（受技术经济限制，不计入部分除外）' },
          { id: 'P05-3', name: '余冷已利用量', channel: '底座数据识别', channelDetail: '冷量计量直连（本园区消纳）' },
          { id: 'P05-4', name: '余冷理论可回收量', channel: '材料识别', channelDetail: '余能资源评估报告核定' },
          { id: 'P05-5', name: '余压已利用量', channel: '底座数据识别', channelDetail: '余压发电测点直连（本园区消纳）' },
          { id: 'P05-6', name: '余压理论可回收量', channel: '材料识别', channelDetail: '余能资源评估报告核定' },
        ] },
        { key: 'waterRecycleRatio', params: [
          { id: 'P06-1', name: '中水利用量', channel: '底座数据识别', channelDetail: '中水回用管网流量计直连' },
          { id: 'P06-2', name: '具备回用条件总用水量', channel: '底座数据识别', channelDetail: '市政中水进水总表直连' }
        ] }
      ],

            // 保留原有旧结构做向前兼容
      emissionSourceGroups: [
        {
          key: 'energy-combustion',
          name: '能源活动：固定与移动燃烧',
          countText: '3 个排放源 · 燃气与柴油',
          items: [
            { name: '集中供热动力站天然气锅炉', sub: '集中供热 · 固定燃烧 · 动力中心', unit: 'SCADA燃气流量计' },
            { name: '生物医药基地天然气直燃机', sub: '研发实验供暖 · 固定燃烧 · 昭衍生物', unit: '燃气账单智能识别' },
            { name: '园区内部物流倒短重卡与通勤班车', sub: '厂内运输 · 移动燃烧 · 柴油物流', unit: '油品凭证智能识别' }
          ]
        },
        {
          key: 'energy-grid',
          name: '能源活动：外购电力与集中供热',
          countText: '2 个变电关口 · 电网直连',
          items: [
            { name: '110kV综合变电站主供回路', sub: '园区电力集控中心 · 国网关口', unit: '平台数据底座数据识别' },
            { name: '产业二期开闭所自管配电单元', sub: '中芯集成电路专线配电', unit: '平台数据底座数据识别' }
          ]
        },
        {
          key: 'industrial-process',
          name: '工业生产过程',
          countText: '1 项重点工业 · 工艺特气',
          items: [
            { name: '集成电路制造特种气体刻蚀与清洗', sub: '中芯北方 · NF₃/CF₄分解逸散', unit: '检测报告智能识别' }
          ]
        },
        {
          key: 'clean-energy-ledger',
          name: '清洁能源供给与消纳',
          countText: '2 项清洁电力消纳 · 直接冲抵外购电',
          items: [
            { name: '园区屋顶分布式光伏系统 (24MW)', sub: '园区绿能公司 · 自发自用', unit: '逆变器平台底座' },
            { name: '绿色电力市场化交易与绿证核销', sub: '园区绿能公司 · 跨省绿电交易', unit: '交易凭证智能识别' }
          ]
        }
      ],

      // 【标记】parkIndicators 核心门槛（carbonPerTceTarget）由所选标准解析内容 thresholdRule 分档带出（非写死）
      // ===== 国家级零碳园区建设指标体系（发改委发改环资〔2025〕910号附件3）=====
      // 1 项核心硬指标（强制考核）
      parkIndicators: {
        carbonPerTce: 0.179,
        carbonPerTceTarget: 0.20,
        carbonPerTceUnit: 'tCO₂/tce',
        carbonPerTceStatus: '达标',
        carbonPerTceCalc: '园区综合碳排放量 18,340 tCO₂ ÷ 园区综合能耗量 102,470 tce'
      },

      // 【标记】评价指标「定义」（名称/目标值/单位/判定符/说明）由所选标准的解析内容自动带出（applyStandardParsedContent 覆盖）；
      // currentValue 为当期运行数值（演示数据），applicable/reason 为园区本地裁剪状态 —— 均不来自标准
      // 5 项独立引导指标（支持因地制宜适用性裁剪，选择不适用需填报理由）
      guidedIndicators: [
        {
          key: 'cleanEnergyRatio',
          name: '清洁能源消费比重',
          shortName: '清洁能源',
          target: 90.0,
          unit: '%',
          op: '≥',
          currentValue: 91.5,
          calcText: '非化石能源折标消纳 93,760 tce ÷ 园区综合能耗 102,470 tce',
          applicable: true,
          reason: '',
          desc: '非化石能源（含分布式光伏自用与采购绿电）折标消费量占园区能源消费总量的比重'
        },
        {
          key: 'productEnergyLimitRatio',
          name: '产品能效达标比例',
          shortName: '产品能效',
          target: 90.0,
          unit: '%',
          op: '≥',
          currentValue: 100,
          calcText: '能效达标类型 2 ÷ 产品类型 2（复用②排放源清单）',
          applicable: true,
          reason: '',
          desc: '能效达标产品类型数量占②排放源清单工业过程产品类型总数的比例（分母复用排放源清单）'
        },
        {
          key: 'solidWasteRatio',
          name: '工业固废综合利用率',
          shortName: '固废利用',
          target: 80.0,
          unit: '%',
          op: '≥',
          currentValue: 86.4,
          calcText: '综合利用 18,230 t ÷ 产生总量 21,100 t',
          applicable: true,
          reason: '',
          desc: '一般工业固废综合利用量占产生总量的比例'
        },
        {
          key: 'wasteHeatUtilRatio',
          name: '工业余能利用率',
          shortName: '余能利用',
          target: 50.0,
          unit: '%',
          op: '≥',
          currentValue: 59.3,
          calcText: '余热 64.1%（2,140/3,340）· 余冷 48.3%（860/1,780）· 余压 58.0%（690/1,190）——按已利用量加权 = 59.3%',
          applicable: true,
          reason: '',
          desc: '余热/余冷/余压按已利用量加权的综合利用率（分母为理论可回收资源量，统一折标，无余能产生可申请豁免）'
        },
        {
          key: 'waterRecycleRatio',
          name: '中水回用率',
          shortName: '中水回用',
          target: 80.0,
          unit: '%',
          op: '≥',
          currentValue: 88.2,
          calcText: '中水利用 128 万m³ ÷ 具备回用条件总用水 145 万m³',
          applicable: true,
          reason: '',
          desc: '园区再生水（中水）利用量占具备回用条件总用水量的比例（无中水管网可申请豁免）'
        }
      ],

      // 【兜底】内置标准：正常情况下由标准库解析内容自动带出（loadParkStandardFromLibrary）
      // 政策标准库（当前支持官方试行版，支持下拉扩展）
      selectedStandardCode: '发改环资〔2025〕910号附件4',
      standards: [
        {
          code: '发改环资〔2025〕910号附件4',
          name: '零碳园区碳排放核算方法（试行）',
          indicatorSystemName: '国家级零碳园区建设指标体系（试行）',
          version: '试行版（现行官方）',
          year: '2025',
          status: '现行',
          issuer: '国家发展改革委、工信部、国家能源局',
          desc: '以园区为核算边界，严格按 E_园区 = E_能源活动 + E_工业过程 核算二氧化碳排放，光伏自发自用与绿电直接按零碳属性核减受入电量。'
        }
      ],

      // 因子库列表
      factorDatabases: [
        { id: 'lib-1', name: '国家温室气体清单排放因子库', origin: '生态环境部', selected: true, recommended: true, desc: '权威官方因子库，覆盖化石能源燃烧缺省值' },
        { id: 'lib-2', name: '北京市重点行业温室气体排放因子库', origin: '北京市地方标准', selected: true, recommended: true, desc: '地方发布电网及热力综合因子' },
        { id: 'lib-3', name: '零碳园区可再生能源消纳与折标参数库', origin: '发改委附件4配套', selected: true, recommended: true, desc: '屋顶光伏自发自用与绿电直供核算折标依据' }
      ]
    }
  },

  computed: {
    guideChecklist() {
      return [
        { key: 'info', label: '确认园区信息', done: this.parkInfoConfirmed, step: 1 },
        { key: 'standard', label: '确认核算标准', done: this.standardConfirmed, step: 1 },
        { key: 'source', label: '确认排放源清单', done: this.sourceListConfirmed, step: 2 },
        { key: 'ledger', label: '确认计算参数清单', done: this.ledgerConfirmed, step: 2 },
        { key: 'model', label: '确认核算模型', done: this.modelConfirmed, step: 3 }
      ]
    },
    currentStandard() {
      return this.standards.find(s => s.code === this.selectedStandardCode) || this.standards[0]
    },
    // 适用引导指标与豁免引导指标
    applicableGuidedIndicators() {
      return this.guidedIndicators.filter(g => g.applicable)
    },
    exemptGuidedIndicators() {
      return this.guidedIndicators.filter(g => !g.applicable)
    },
    // 统一展示的 6 大指标列表（1 核心硬指标 + 5 项引导指标）
    indicatorList() {
      return [
        {
          key: 'carbonPerTce',
          isCore: true,
          typeName: '核心指标',
          name: '单位能耗碳排放',
          shortName: '能耗碳排',
          desc: '园区二氧化碳综合排放总量与年综合能源消费量的比值',
          applicable: true,
          required: true,
          reason: ''
        },
        ...this.guidedIndicators.map(g => ({
          ...g,
          isCore: false,
          typeName: '引导指标',
          required: false
        }))
      ]
    },
    // 阶段 2 排放源过滤列表及统计（统一园区核算边界）
    filteredEmissionSources() {
      return this.emissionSources.filter(src => {
        if (this.sourceFilterCategory !== 'all' && src.category !== this.sourceFilterCategory) return false
        if (this.sourceFilterChannel !== 'all' && src.channel !== this.sourceFilterChannel) return false
        return true
      })
    },
    sourceCategories() {
      const set = new Set(this.emissionSources.map(s => s.category))
      return Array.from(set)
    },
    sourceProductCount() {
      return this.emissionSources.filter(s => s.category === '工业过程').length
    },
    sourcePlatformCount() {
      return this.emissionSources.filter(s => s.channel === '底座数据识别').length
    },
    sourceOcrCount() {
      return this.emissionSources.filter(s => s.channel === '材料识别').length
    },
    // 其他计算参数清单：按评价指标分组，组内为该指标所需的全部输入参数
    // （组/指标定义来自标准解析；参数渠道为演示配置，目标态由数据底座与材料识别服务提供）
    paramGroups() {
      return this.indicatorList.map(ind => {
        const applicable = ind.applicable !== false
        const defs = (this.indicatorParamList.find(x => x.key === ind.key) || {}).params || []
        return {
          key: ind.key,
          indicatorName: ind.name,
          typeName: ind.typeName,
          isCore: ind.isCore,
          applicable: applicable,
          items: defs.map(p => Object.assign({}, p, { applicable: applicable }))
        }
      })
    },
        // 参数输入分组：按评价指标（1核心+5引导）分组，组内为该指标所需的参数输入底账（不显示公式）
    ledgerGroups() {
      return this.indicatorList.map(ind => ({
        key: ind.key,
        indicatorName: ind.name,
        typeName: ind.typeName,
        isCore: ind.isCore,
        applicable: ind.applicable !== false,
        items: this.activeIndicatorLedgers.filter(l => l.key === ind.key)
      }))
    },
    // 零碳园区四大法定核算分类分组（化石燃料燃烧、能源加工转换、净购入电力热力、工业过程）
    groupedEmissionSources() {
      const groups = [
        {
          key: 'combustion',
          category: '化石燃料燃烧',
          name: '化石燃料燃烧',
          badgeColor: '#d97706',
          badgeBg: '#fffbeb',
          badgeBorder: '#fde68a',
          scopeDesc: '园区企业设备用能与厂区内部运输等化石燃料（天然气、柴油等）直接燃烧',
          productOriented: false
        },
        {
          key: 'conversion',
          category: '能源加工转换',
          name: '能源加工转换',
          badgeColor: '#0284c7',
          badgeBg: '#f0f9ff',
          badgeBorder: '#bae6fd',
          scopeDesc: '园区集中供能动力站蒸汽制热等能源二次加工转换',
          productOriented: false
        },
        {
          key: 'net-grid',
          category: '净购入电力热力',
          name: '净购入电力热力',
          badgeColor: '#2563eb',
          badgeBg: '#eff6ff',
          badgeBorder: '#bfdbfe',
          scopeDesc: '市政变电站受电关口、企业专线受热，以及光伏自发自用与市场化绿电直供核减',
          productOriented: false
        },
        {
          key: 'process',
          category: '工业过程',
          name: '工业过程（具体产品归口）',
          badgeColor: '#7c3aed',
          badgeBg: '#f5f3ff',
          badgeBorder: '#ddd6fe',
          scopeDesc: '园区重点工业企业具体产品（半导体晶圆/动力电芯）生产过程反应与特气逸散',
          productOriented: true
        }
      ]

      return groups.map(g => {
        const items = this.filteredEmissionSources.filter(s => s.category === g.category)
        const platformCount = items.filter(s => s.channel === '底座数据识别').length
        const ocrCount = items.filter(s => s.channel === '材料识别').length
        return {
          ...g,
          items,
          totalCount: items.length,
          platformCount,
          ocrCount
        }
      })
    },
    cfgBarHint() {
      if (this.cfgActive === 1) return '维护园区基础信息、核算标准与指标配置'
      if (this.cfgActive === 2) return '按四大法定分类维护排放源清单与指标底账'
      return '园区核算模型：四大法定分类的计算公式与计算参数'
    },
    currentPeriodKey() {
      return this.isYearMode ? (this.resultYear + '年') : (this.resultYearMonth ? (this.resultYearMonth.replace('-', '年') + '月') : '2026年10月')
    },
    isYearMode() {
      return this.resultGranularity === 'year'
    },
    periodVersionText() {
      return '发改委《零碳园区碳排放核算方法（试行）》'
    },
    periodStatusLabel() {
      return this.isPeriodFiled ? '已锁定' : '未锁定'
    },
    isPeriodFiled() {
      return this.cycleArchive[this.currentPeriodKey] === 'filed'
    },
    isFiledNow() {
      return this.isPeriodFiled
    },
    resultYearOptions() {
      return ['2026', '2025']
    },
    estimatedTokens() {
      return 1560
    },
    formattedTokens() {
      return '1.5k'
    },

    // 4 大核心 KPI（总量由②清单四分类派生；指标数值为演示运行值）
    kpiTotalsBase() {
      const isYear = this.isYearMode
      if (isYear) {
        return {
          totalEmission: 183400,      // 1-10月累计（与月度口径连续）
          carbonPerTce: 0.179,        // 单位能耗碳排放 tCO₂/tce（标准解析门槛分档判定）
          cleanEnergyRatio: 92.1,     // 清洁能源消费比重 %（引导指标）
          yoyDiff: -10.8,
          doneMonths: 10
        }
      }
      return {
        totalEmission: 18340,         // 当月园区碳排放总量 tCO₂（= 四分类合计，见 resultTotals）
        carbonPerTce: 0.179,
        cleanEnergyRatio: 91.5,
        yoyDiff: -12.5,
        doneMonths: 1
      }
    },

    // 更正后的合计覆盖（参数更正后重算，优先于演示基准值）
    kpiTotals() {
      const base = this.kpiTotalsBase
      if (this.kpiTotalOverride !== null && this.kpiTotalOverride !== undefined) {
        const o = Object.assign({}, base, { totalEmission: this.kpiTotalOverride })
        if (this.kpiCarbonPerTceOverride !== null && this.kpiCarbonPerTceOverride !== undefined) {
          o.carbonPerTce = this.kpiCarbonPerTceOverride
        }
        return o
      }
      return base
    },

    // 分类贡献（正值项 Top 8，核减项不参与排名）
    resultCategories() {
      return [
        { name: '天然气', value: 5240 },
        { name: '天然气制热与蒸汽供应', value: 3730 },
        { name: '公共电网受入电力', value: 3020 },
        { name: '企业专线受入电力', value: 2910 },
        { name: '12英寸集成电路芯片', value: 2580 },
        { name: '柴油', value: 450 },
        { name: '动力锂电池单体电芯', value: 410 },
      ]
    },

    // 数据清单分组行 = ② 排放源清单逐条派生（品种级，含 0 因子核减负值行）
    resultGroups() {
      return [
        {
          key: 'fossil',
          scope: '化石燃料燃烧',
          category: '天然气、柴油等化石燃料直接燃烧',
          emission: 5690,
          items: [
            {
              name: '天然气', sub: '园区直燃与工艺用气', emission: 5240, channel: '材料识别', calcText: '242.4 万Nm³ × 21.62 tCO₂e/万Nm³ = 5,240 tCO₂e',
              hasData: true, value: 242.4, unit: '万Nm³', dataSource: '燃气管网计量流量计', proof: '燃气结算单据 PZ-202610-01',
              factor: '21.62 tCO₂/万Nm³', factorSource: '国家温室气体清单库', params: [['低位发热量(NCV)', '389.31 GJ/万Nm³'], ['单位热值含碳量(CC)', '0.0153 tC/GJ'], ['碳氧化率(OF)', '0.99']]
            },
            {
              name: '柴油', sub: '园区内部运输与通勤', emission: 450, channel: '材料识别', calcText: '142.0 t × 3.17 tCO₂e/t = 450 tCO₂e',
              hasData: true, value: 142.0, unit: '吨', dataSource: '园区加油管理系统', proof: '出库单据 PZ-202610-03',
              factor: '3.17 tCO₂/t', factorSource: '国家温室气体清单库', params: [['低位发热量(NCV)', '42.65 GJ/t'], ['碳氧化率(OF)', '0.98']]
            }
          ]
        },
        {
          key: 'conversion',
          scope: '能源加工转换',
          category: '制热供应（碳平衡）',
          emission: 3730,
          items: [
            {
              name: '天然气制热与蒸汽供应', sub: '二次能源加工转换（碳平衡差值）', emission: 3730, channel: '底座数据识别', calcText: '投入 200.0 × 21.62 − 产出 5.40 × 0.11（万GJ）≈ 3,730 tCO₂e（碳平衡）',
              hasData: true, value: 200.0, unit: '万Nm³',
              dataSource: 'SCADA 供热介质流量计', proof: '供热结算单据 PZ-202610-04',
              factor: '21.62 tCO₂/万Nm³', factorSource: '国家温室气体清单库',
              params: [['产出二次能源产品(AD_出)', '5.40 万GJ（蒸汽）'], ['产出因子(EF_出)', '0.11 tCO₂/GJ']]
            },
          ]
        },
        {
          key: 'net',
          scope: '净购入电力热力（净受入，已计核减）',
          category: '受入电力种类 × 因子 − 零碳属性核减',
          emission: 5930,
          items: [
            {
              name: '公共电网受入电力', sub: '市政关口受电', emission: 3020, channel: '底座数据识别', calcText: '5,666 MWh × 0.5330 tCO₂e/MWh = 3,020 tCO₂e',
              hasData: true, value: 5666, unit: 'MWh', dataSource: '电网双向关口电表', proof: '国家电网结算发票 FP-202610-88',
              factor: '0.5330 tCO₂/MWh', factorSource: '华北区域电网基准因子', params: [['综合线损率', '2.1%']]
            },
            {
              name: '企业专线受入电力', sub: '智能制造专线配电', emission: 2910, channel: '底座数据识别', calcText: '5,460 MWh × 0.5330 tCO₂e/MWh = 2,910 tCO₂e',
              hasData: true, value: 5460, unit: 'MWh', dataSource: '智慧电表在线抄读', proof: '内部用能报表 BB-202610-05',
              factor: '0.5330 tCO₂/MWh', factorSource: '华北区域电网基准因子', params: [['分项计量校验', '合格']]
            },
            {
              name: '屋顶光伏自发自用电力', sub: '零碳属性 · 0 因子', emission: 0, channel: '底座数据识别', calcText: '9,621 MWh × 0（零碳属性）= 0 tCO₂e（核减电量不产生排放）',
              hasData: true, value: 9621, unit: 'MWh', dataSource: '光伏逆变器并网电表群', proof: '自发自用消纳清单 ZC-202610-11',
              factor: '0（零碳属性）', factorSource: '发改环资〔2025〕910号附件4', params: []
            },
            {
              name: '绿电直供与绿证核销电力', sub: '零碳属性 · 0 因子', emission: 0, channel: '材料识别', calcText: '5,630 MWh × 0（零碳属性）= 0 tCO₂e（核销电量不产生排放）',
              hasData: true, value: 5630, unit: 'MWh', dataSource: '北京电力交易中心', proof: '绿电消纳凭证与绿证核销台账 ZC-202610-12',
              factor: '0（零碳属性）', factorSource: '发改环资〔2025〕910号附件4', params: []
            }
          ]
        },
        {
          key: 'process',
          scope: '工业生产过程',
          category: '按具体产品归口',
          emission: 2990,
          items: [
            {
              name: '12英寸集成电路芯片', sub: '电子特气分解逸散', emission: 2580, channel: '材料识别', calcText: '16.0 万件 × 161.08 tCO₂e/万件 = 2,580 tCO₂e',
              hasData: true, value: 16.0, unit: '万件', dataSource: '生产 MES 制造执行系统', proof: '排污许可月度报表 PW-202610-09',
              factor: '161.08 tCO₂/万件', factorSource: '企业实测材料（分产品因子）', params: []
            },
            {
              name: '动力锂电池单体电芯', sub: '溶剂挥发逸散', emission: 410, channel: '材料识别', calcText: '2.5 万只 × 164.0 tCO₂e/万只 = 410 tCO₂e',
              hasData: true, value: 2.5, unit: '万只', dataSource: '电芯下线台账', proof: '挥发物监测记录 PW-202610-10',
              factor: '164.0 tCO₂/万只', factorSource: '企业实测材料（分产品因子）', params: []
            }
          ]
        }
        ,
        {
          key: 'ind-carbonPerTce', paramGroup: true, calcText: '单位能耗碳排放 = 18,340 tCO₂e ÷ 102,470 tce = 0.179 tCO₂e/tce',
          scope: '单位能耗碳排放（核心）',
          category: '核心指标计算输入参数',
          items: [
            { name: '园区综合碳排放量', value: 18340, unit: 'tCO₂', hasData: true, dataSource: '系统汇总', proof: '②清单四分类核算汇总' },
            { name: '园区综合能耗量', value: 102470, unit: 'tce', hasData: true, dataSource: '系统汇总', proof: '全区电力、天然气、蒸汽折标汇总' }
          ]
        },
        {
          key: 'ind-cleanEnergy', paramGroup: true, calcText: '清洁能源消费比重 = 93,760 tce ÷ 102,470 tce × 100% = 91.5%',
          scope: '清洁能源消费比重（引导）',
          category: '引导指标计算输入参数',
          items: [
            { name: '非化石能源折标消纳量', value: 93760, unit: 'tce', hasData: true, dataSource: '系统汇总', proof: '光伏自用 + 绿电直供折标汇总' },
            { name: '园区综合能耗量', value: 102470, unit: 'tce', hasData: true, dataSource: '系统汇总', proof: '同核心指标分母' }
          ]
        },
        {
          key: 'ind-productEnergy', paramGroup: true, calcText: '产品能效达标比例 = 2 类 ÷ 2 类 × 100% = 100%',
          scope: '产品能效达标比例（引导）',
          category: '引导指标计算输入参数',
          items: [
            { name: '能效达标产品类型数量', value: 2, unit: '类', hasData: true, dataSource: '材料识别', proof: '能效检测审计报告' },
            { name: '产品类型总数', value: 2, unit: '类', hasData: true, dataSource: '系统汇总', proof: '②清单工业过程产品类型' }
          ]
        },
        {
          key: 'ind-solidWaste', paramGroup: true, calcText: '工业固废综合利用率 = 18,230 t ÷ 21,100 t × 100% = 86.4%',
          scope: '工业固废综合利用率（引导）',
          category: '引导指标计算输入参数',
          items: [
            { name: '固废综合利用量', value: 18230, unit: 't', hasData: true, dataSource: '材料识别', proof: '转移联单与资源化合同' },
            { name: '固废产生总量', value: 21100, unit: 't', hasData: true, dataSource: '材料识别', proof: '出厂地磅称重单' }
          ]
        },
        {
          key: 'ind-wasteHeat', paramGroup: true, calcText: '工业余能利用率 = 加权(余热 64.1% · 余冷 48.3% · 余压 58.0%) = 59.3%',
          scope: '工业余能利用率（引导）',
          category: '引导指标计算输入参数（余热/余冷/余压加权）',
          items: [
            { name: '余热已利用量', value: 2140, unit: 'tce', hasData: true, dataSource: '底座数据识别', proof: '余热回收计量表' },
            { name: '余热理论可回收量', value: 3340, unit: 'tce', hasData: true, dataSource: '材料识别', proof: '余能资源评估报告' },
            { name: '余冷已利用量', value: 860, unit: 'tce', hasData: true, dataSource: '底座数据识别', proof: '冷量计量' },
            { name: '余冷理论可回收量', value: 1780, unit: 'tce', hasData: true, dataSource: '材料识别', proof: '余能资源评估报告' },
            { name: '余压已利用量', value: 690, unit: 'tce', hasData: true, dataSource: '底座数据识别', proof: '余压发电测点' },
            { name: '余压理论可回收量', value: 1190, unit: 'tce', hasData: true, dataSource: '材料识别', proof: '余能资源评估报告' }
          ]
        },
        {
          key: 'ind-water', paramGroup: true, calcText: '中水回用率 = 128 万m³ ÷ 145 万m³ × 100% = 88.2%',
          scope: '中水回用率（引导）',
          category: '引导指标计算输入参数',
          items: [
            { name: '中水利用量', value: 128, unit: '万m³', hasData: true, dataSource: '底座数据识别', proof: '中水回用管网流量计' },
            { name: '具备回用条件总用水量', value: 145, unit: '万m³', hasData: true, dataSource: '底座数据识别', proof: '市政中水进水总表' }
          ]
        }
      ]
    },

    // 排放构成表（四大法定分类 = ② 清单分组汇总，合计 18,340）
    // 指标对标行（1 核心 + N 引导，行数随标准/裁剪动态变化；计算式随行悬浮提示）
    indicatorRows() {
      const rows = []
      rows.push({
        key: 'carbonPerTce', name: '单位能耗碳排放', typeName: '核心', isCore: true,
        valueText: this.parkIndicators.carbonPerTce + ' tCO₂/tce',
        targetText: '≤ ' + Number(this.parkIndicators.carbonPerTceTarget).toFixed(2) + ' tCO₂/tce',
        pass: this.parkIndicators.carbonPerTceStatus === '达标',
        applicable: true, calcText: this.parkIndicators.carbonPerTceCalc || ''
      })
      this.guidedIndicators.forEach(g => {
        const applicable = g.applicable !== false
        const v = Number(g.currentValue)
        const tg = Number(g.target)
        rows.push({
          key: g.key, name: g.name, typeName: '引导', isCore: false,
          valueText: g.currentValue + g.unit,
          targetText: g.op + ' ' + g.target + g.unit,
          pass: g.op === '≥' ? v >= tg : v <= tg,
          applicable: applicable,
          calcText: g.calcText || '',
          reason: g.reason || ''
        })
      })
      return rows
    },
    // 引导指标达标统计（与标准中引导指标数量解耦：数量随标准/裁剪动态变化）
    guidedApplicableCount() {
      return this.guidedIndicators.filter(g => g.applicable !== false).length
    },
    guidedPassCount() {
      return this.guidedIndicators.filter(g => g.applicable !== false).filter(g => {
        const v = Number(g.currentValue)
        const t = Number(g.target)
        return g.op === '≥' ? v >= t : v <= t
      }).length
    },
    resultScopeTable() {
      return [
        { name: '化石燃料燃烧', color: '#0067fe', value: 5690, pct: 30.5, yoy: -390, yoyPct: -6.4, mom: -120, momPct: -2.1 },
        { name: '能源加工转换', color: '#0ea5e9', value: 3730, pct: 20.3, yoy: -222, yoyPct: -5.2, mom: -49, momPct: -1.2 },
        { name: '净购入电力热力', color: '#38bdf8', value: 5930, pct: 31.8, yoy: -645, yoyPct: -9.8, mom: -158, momPct: -2.6 },
        { name: '工业生产过程', color: '#fb923c', value: 2990, pct: 16.0, yoy: -122, yoyPct: -3.9, mom: -51, momPct: -1.7 }
      ]
    },

    resultTotals() {
      return {
        total: 18340,
        fossil: 5690,
        conversion: 4040,
        net: 5930,
        process: 2990,
        isCurrent: true
      }
    }
  },

    created() {
    this._loadCycleArchive()
  },

  mounted() {
    this.loadParkStandardFromLibrary()
    this._initParkGuide()
    this.$nextTick(() => {
      setTimeout(() => {
        if (this.initResultCharts) this.initResultCharts()
      }, 100)
    })
    this._onResize = () => {
      if (this._trendChart) this._trendChart.resize()
      if (this._pieChart) this._pieChart.resize()
      if (this._catChart) this._catChart.resize()
    }
    window.addEventListener('resize', this._onResize)
  },

  beforeDestroy() {
    if (this._onResize) window.removeEventListener('resize', this._onResize)
  },

  methods: {
    // ===== 对话引擎（园区适配：思考+结论同条 / 三步四项确认 / 双向联动）=====
    pushNarrative(n) {
      const lines = []
      if (n.recognize) lines.push('**【识别】** ' + n.recognize)
      if (n.basis) lines.push('**【依据】** ' + n.basis)
      if (n.exec) lines.push('**【执行】** ' + n.exec)
      if (n.result) lines.push('**【结果】** ' + n.result)
      this._pendingNarrative = lines.join('\n\n')
    },
    _push(content, suggestions) {
      const pn = this._pendingNarrative || ''
      this._pendingNarrative = ''
      const msg = { id: 'MSG-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), role: 'assistant', content: content, suggestions: suggestions || [], timestamp: new Date().toLocaleTimeString('zh-CN') }
      if (pn) { msg.thinking = true; msg.narrative = pn }
      this.isTyping = false
      this.messages.push(msg)
      this.scrollToBottom()
    },
    guideChecklistText() {
      return this.guideChecklist.map(c => (c.done ? '✅' : '⬜') + ' ' + c.label).join('\n')
    },
    _initParkGuide() {
      this._pendingNarrative = ''
      this._quietSwitch()
      this.cdActiveTab = 'model'
      this.cfgActive = 1
      this._push('欢迎使用**园区碳核算智能体**。\n\n核算配置共 **三步 · 五项确认**：\n\n'
        + '**① 园区主体与依据**\n· 确认园区信息\n· 确认核算标准\n**② 核算底账与源清单**\n· 确认排放源清单\n· 确认计算参数清单\n**③ 园区核算模型**\n· 确认核算模型\n\n我们开始 ① 园区主体与依据。')
      this.pushGuideStep()
    },
    pushGuideStep() {
      const c = this.guideChecklist
      if (!c[0].done) return this.pushConfirmParkInfo()
      if (!c[1].done) return this.pushConfirmParkStandard()
      if (!c[2].done) return this.pushConfirmParkSources()
      if (!c[3].done) return this.pushConfirmParkParams()
      if (!c[4].done) return this.pushConfirmParkModel()
      this._push('**五项确认已全部完成 ✅**\n\n' + this.guideChecklistText() + '\n\n配置已就绪：可在右侧「核算结果」查看当期园区核算结果。', ['启用周期核算'])
    },
    pushConfirmParkInfo() {
      this._quietSwitch()
      this.cfgActive = 1
      this._push('**当前：① 园区主体与依据 · 确认园区信息**\n\n'
        + '· 园区名称：**' + this.parkInfo.name + '**\n'
        + '· 规划面积：' + this.formatArea(this.parkInfo.area) + '\n'
        + '· 年能耗规模：' + this.parkInfo.annualEnergyScale + '\n'
        + '· 规上重点用能企业：' + this.parkInfo.enterprisesCount + ' 家\n\n'
        + '以上信息由园区主体档案自动带出。\n核对无误后，请回复「**确认园区信息**」。', ['确认园区信息'])
    },
    pushConfirmParkStandard() {
      this._quietSwitch()
      this.cfgActive = 1
      this._push('**当前：① 园区主体与依据 · 确认核算标准**\n\n'
        + '· 核算标准：**' + this.currentStandard.name + '**（' + this.currentStandard.status + '）\n'
        + '· 核算口径：**E_园区 = E_能源活动 + E_工业过程**（仅二氧化碳，单位万吨）\n'
        + '· 指标体系：国家级零碳园区建设指标体系（试行）——**1 核心 + 5 引导**\n'
        + '· 核心门槛：单位能耗碳排放 ≤ 0.20 tCO₂/tce（年能耗规模 100万tce以下档；100万tce及以上档 ≤ 0.25）\n'
        + '· 引导指标支持因地制宜**适用性裁剪**（豁免需填报理由，对应底账自动停用）\n\n'
        + '标准一经确认，四大法定核算分类与指标体系随之锁定。\n核对无误后，请回复「**确认核算标准**」。', ['确认核算标准', '指标裁剪说明'])
    },
    pushConfirmParkSources() {
      this._quietSwitch()
      this.cfgActive = 2
      this.stage2SubTab = 'sources'
      this._push('**当前：② 核算底账与源清单 · 确认排放源清单**\n\n'
        + '共 **9 个排放源**，按「大类 → 品种 / 具体加工转换过程 / 具体产品」两级组织（园区统计口径，不落具体设施）：\n'
        + '· **化石燃料燃烧**（2）：天然气、柴油\n'
        + '· **能源加工转换**（1）：天然气制热与蒸汽供应\n'
        + '· **净购入电力热力**（4）：公共电网受入电力、企业专线受入电力、屋顶光伏自发自用电力（核减）、绿电直供与绿证核销电力（核减）\n'
        + '· **工业过程**（2，按产品归口）：12英寸集成电路芯片、动力锂电池单体电芯\n\n'
        + '数据渠道：**底座数据识别 5 项 · 材料识别 5 项**。\n'
        + '若发现缺漏：可在本步骤点「修改」按分类新增，或上传能源台账由智能体识别补录。\n\n'
        + '核对无误后，请回复「**确认排放源清单**」。', ['确认排放源清单', '上传台账识别'])
    },
    pushConfirmParkParams() {
      this._quietSwitch()
      this.cfgActive = 2
      this.stage2SubTab = 'ledgers'
      this._push('**当前：② 核算底账与源清单 · 确认计算参数清单**\n\n'
        + '共 **6 项评价指标的计算参数清单**（此处仅确认数据来源渠道，数值在「核算结果」中展示）：\n'
        + '· **单位能耗碳排放**：园区综合碳排放量、园区综合能耗量（系统汇总）\n'
        + '· **清洁能源消费比重**：非化石能源折标消纳量、园区综合能耗量（均系统汇总）\n'
        + '· **产品能效达标比例**：能效达标产品类型数量、产品类型总数（材料识别）\n'
        + '· **工业固废综合利用率**：综合利用量、产生总量（材料识别）\n'
        + '· **工业余能利用率**：余热/余冷/余压已利用量（底座数据识别）+ 理论可回收量（材料识别）\n'
        + '· **中水回用率**：中水利用量、具备回用条件总用水量（底座数据识别）\n\n'
        + '豁免指标对应参数自动停用。\n核对无误后，请回复「**确认计算参数清单**」。', ['确认计算参数清单'])
    },
    pushConfirmParkModel() {
      this._quietSwitch()
      this.cfgActive = 3
      this._push('**当前：③ 园区核算模型 · 确认核算模型**\n\n'
        + '这里是 ① 排放源清单 × ② 核算方法的自动匹配结果（只读）：\n'
        + '· **化石燃料燃烧**：Σ(品种消费量 × 因子)——天然气 21.62 tCO₂/万Nm³、柴油 3.17 tCO₂/t\n'
        + '· **能源加工转换**：Σ(投入×因子) − Σ(产出×因子)（碳平衡，氧化率 100%）\n'
        + '· **净购入电力热力**：Σ(受入×因子) − Σ(送出×因子)——电网 0.5330 tCO₂/MWh；**光伏自用与绿电直供按 0 因子核减**\n'
        + '· **工业过程**：Σ(产品产量 × 因子)——电子特气分解 161.08 tCO₂/万件\n\n'
        + '核对无误后，请回复「**确认核算模型**」。', ['确认核算模型'])
    },
    handleCommonIntent(q) {
      if (this.handleTraceIntent(q)) return true
      const lower = (q || '').trim()
      const hit = (kw) => lower.indexOf(kw) > -1
      if (hit('确认园区信息')) {
        this.parkInfoConfirmed = true
        this.pushNarrative({ recognize: '确认「园区信息」', basis: '配置确认清单第 1 / 4 项', exec: '锁定园区主体与核算依据，进入 ② 核算底账与源清单', result: '园区信息已确认' })
        this.guideChecklist[0].done = true
        this.pushGuideStep()
        return true
      }
      if (hit('确认核算标准')) {
        this.standardConfirmed = true
        this.pushNarrative({ recognize: '确认「核算标准」', basis: '配置确认清单第 2 / 5 项', exec: '锁定附件4核算方法与 1+5 指标体系', result: '核算标准已确认' })
        this.guideChecklist[1].done = true
        this.pushGuideStep()
        return true
      }
      if (hit('确认排放源清单')) {
        this.sourceListConfirmed = true
        this.pushNarrative({ recognize: '确认「排放源清单」', basis: '配置确认清单第 3 / 5 项', exec: '锁定四大法定分类清单', result: '排放源清单已确认' })
        this.guideChecklist[2].done = true
        this.pushGuideStep()
        return true
      }
      if (hit('确认计算参数清单') || hit('确认指标底账')) {
        this.ledgerConfirmed = true
        this.pushNarrative({ recognize: '确认「指标底账」', basis: '配置确认清单第 4 / 5 项', exec: '锁定 6 项指标计算参数底账', result: '指标底账已确认' })
        this.guideChecklist[3].done = true
        this.pushGuideStep()
        return true
      }
      if (hit('确认核算模型')) {
        this.modelConfirmed = true
        this.pushNarrative({ recognize: '确认「核算模型」', basis: '配置确认清单第 5 / 5 项', exec: '锁定园区核算模型', result: '核算模型已确认' })
        this.guideChecklist[4].done = true
        this.pushGuideStep()
        return true
      }
      if (hit('启用周期核算')) {
        this.pushNarrative({ recognize: '启动 ' + this.currentPeriodKey + ' 园区核算周期', basis: '四项配置已就绪；按附件4核算方法执行', exec: '按月自动核算、次月生成上月任务', result: '核算周期已启用' })
        this._push('**' + this.currentPeriodKey + ' 园区核算结果**\n\n'
          + '· 园区碳排放总量：**' + this.kpiTotals.totalEmission.toLocaleString() + ' tCO₂**\n'
          + '· 单位能耗碳排放：**' + this.kpiTotals.carbonPerTce + ' tCO₂/tce**（核心门槛 ≤ ' + this.parkIndicators.carbonPerTceTarget + '，✅ 达标）\n'
          + '· 清洁能源消费比重：**' + this.kpiTotals.cleanEnergyRatio + '%**（引导 ≥ 90%，✅ 达标）\n'
          + '· 同比：' + (this.kpiTotals.yoyDiff > 0 ? '+' : '') + this.kpiTotals.yoyDiff + '%\n\n'
          + this.dataCompletenessText() + '\n\n'
          + '右侧「核算结果」可查看分项趋势、指标诊断与数据清单。', this.dataCompleteness().missing.length ? ['补充缺失数据', '上传台账', '查看数据清单'] : ['补充缺失数据', '查看数据清单', '指标对标诊断'])
        this._quietSwitch()
        this.cdActiveTab = 'tasks'
        this.resultTab = 'list'
        // 切到结果页后初始化图表（容器可见后再 init，否则 echarts 尺寸为 0 导致空白）
        this.$nextTick(() => {
          setTimeout(() => {
            if (this.initResultCharts) this.initResultCharts()
          }, 80)
        })
        return true
      }
      if (hit('查看数据清单')) {
        this._quietSwitch()
        this.cdActiveTab = 'tasks'
        this.resultTab = 'list'
        this.$nextTick(() => {
          setTimeout(() => { if (this.initResultCharts) this.initResultCharts() }, 80)
        })
        return {
          content: '已切换到「**核算结果 · 数据清单**」。\n\n'
            + '按排放分类与指标分组展示：参数名称 / 参数值 / 来源 · 佐证材料，并附计算式；'
            + '点行可打开溯源抽屉查看匹配过程并更正参数（锁期前）。',
          suggestions: ['指标对标诊断', '生成园区核算报告']
        }
      }
      if (hit('指标裁剪')) {
        const g = this.guidedIndicators
        const pending = this.guideChecklist.filter(c => !c.done)[0]
        this._push('**【指标裁剪说明】**\n\n依据附件3，引导指标支持因地制宜适用性裁剪：\n'
          + g.map(x => '· ' + x.name + '：当前 ' + x.currentValue + x.unit + '（目标 ' + x.op + x.target + x.unit + '）——' + (x.applicable ? '✅ 适用' : '⭕ 豁免（' + (x.reason || '需填报理由') + '）')).join('\n')
          + '\n\n在 ① 步骤点「修改」可切换适用状态并填报理由；豁免指标对应底账自动停用。'
          + (pending ? '\n\n核对后请回复「**' + pending.label + '**」。' : ''), pending ? [pending.label] : [])
        return true
      }
      if (hit('补充缺失数据') || hit('补录缺失')) {
        this._quietSwitch()
        this.cdActiveTab = 'tasks'
        this.resultTab = 'list'
        const d = this.dataCompleteness()
        let content
        if (d.missing.length) {
          content = '⚠ **待补录 ' + d.missing.length + ' 项**：' + d.missing.join('、')
            + '\n\n可「上传台账」补录凭证，或「补充确认数据」后重算（缺失项当前按 0 计入，结果偏低）。'
        } else {
          content = '当前 **' + d.total + ' 项排放源数据与凭证齐备**（底座直连 ' + d.baseOk + '/' + d.baseTotal
            + '，材料识别 ' + d.matOk + '/' + d.matTotal + '）。\n\n'
            + '如个别参数需调整，可点卡片进入抽屉，用参数行 ✏️ 更正（留痕并重算）。'
        }
        return { content: content, suggestions: ['上传台账', '查看数据清单'] }
      }
      if (hit('补充确认数据')) {
        this._quietSwitch()
        this.cdActiveTab = 'model'
        this.cfgActive = 2
        return {
          content: '已切到「**配置与模型 · ② 核算底账与源清单**」。\n\n可在此核对排放源与数据渠道；缺失项支持「上传材料」补录或补充确认后重算。',
          suggestions: ['上传台账', '确认排放源清单']
        }
      }
      if (hit('上传台账')) {
        this._push('**【附件识别补录】**\n\n园区排放源与指标底账支持「材料识别」通道：\n'
          + '· 化石燃料：燃气结算发票 / 加油卡对账单 OCR\n'
          + '· 绿电绿证：北京电力交易中心消纳凭证核销台账\n'
          + '· 工业过程：产品产量台账 / 排污许可月报\n\n'
          + '在本步骤点「修改」→ 选择对应排放源 → 上传附件即可由智能体解析补录。', ['确认排放源清单'])
        return true
      }
      if (hit('清单怎么来')) {
        this._push('**【清单来源】**\n\n排放源清单按**四大法定分类**维护，数据获取走**双通道**：\n'
          + '· **底座数据识别**（SCADA/关口表/EMS 直连）——连续计量类\n'
          + '· **材料识别**（发票/台账/联单 OCR）——票证类\n\n'
          + '清单确认后在 ③ 园区核算模型中按附件4方法自动匹配公式。', ['确认排放源清单'])
        return true
      }
      return false
    },
    _quietSwitch() {
      this._silentSwitch = true
      clearTimeout(this._swT)
      this._swT = setTimeout(() => { this._silentSwitch = false }, 400)
    },
    buildSyncMessage(kind) {
      if (kind === 'tab') {
        if (this.cdActiveTab === 'model') {
          const names = { 1: '① 园区主体与依据', 2: '② 核算底账与源清单', 3: '③ 园区核算模型' }
          const step = this.guideChecklist.filter(c => !c.done)[0]
          return { content: '已切换到「**配置与模型**」：' + (step ? '当前待确认 **' + step.label + '**（' + names[this.cfgActive] + '）。' : '配置已全部完成。'), suggestions: [] }
        }
        return { content: '已切换到「**核算结果**」：当前期次 **' + this.currentPeriodKey + '**，园区碳排放总量 **' + this.kpiTotals.totalEmission.toLocaleString() + ' tCO₂**，单位能耗 **' + this.kpiTotals.carbonPerTce + '** tCO₂/tce（达标）。', suggestions: [] }
      }
      if (kind === 'cfgstep') {
        const names = { 1: '① 园区主体与依据', 2: '② 核算底账与源清单', 3: '③ 园区核算模型' }
        let t = names[this.cfgActive] || '—'
        if (this.cfgActive === 2) t += '（' + (this.stage2SubTab === 'ledgers' ? '指标计算参数底账' : '碳排放源清单') + '）'
        return { content: '当前配置步骤：**' + t + '**。', suggestions: [] }
      }
      if (kind === 'granularity' || kind === 'period') {
        return { content: (this.isYearMode ? '已切换到**年度视图**（' + this.resultYear + ' 年）' : '已切换到**月度视图**（' + this.resultYearMonth.replace('-', '年') + '月）') + '：园区碳排放总量 **' + this.kpiTotals.totalEmission.toLocaleString() + ' tCO₂**，单位能耗 **' + this.kpiTotals.carbonPerTce + '** tCO₂/tce（达标）。', suggestions: [] }
      }
      return null
    },
    syncChatWithRight(kind) {
      if (this._silentSwitch) return
      const m = this.buildSyncMessage(kind)
      if (m) this._push(m.content, m.suggestions)
    },
    isEditing(step) {
      return this.cfgEditStep === step
    },
    startCfgEdit(step) {
      this.parkInfoBackup = JSON.parse(JSON.stringify(this.parkInfo))
      this.guidedIndicatorsBackup = JSON.parse(JSON.stringify(this.guidedIndicators))
      this.emissionSourcesBackup = JSON.parse(JSON.stringify(this.emissionSources))
      this.emissionSourceGroupsBackup = JSON.parse(JSON.stringify(this.emissionSourceGroups))
      this.cfgEditStep = step
    },
    cancelCfgEdit() {
      if (this.parkInfoBackup) {
        this.parkInfo = JSON.parse(JSON.stringify(this.parkInfoBackup))
      }
      if (this.guidedIndicatorsBackup) {
        this.guidedIndicators = JSON.parse(JSON.stringify(this.guidedIndicatorsBackup))
      }
      if (this.emissionSourcesBackup) {
        this.emissionSources = JSON.parse(JSON.stringify(this.emissionSourcesBackup))
      }
      if (this.emissionSourceGroupsBackup) {
        this.emissionSourceGroups = JSON.parse(JSON.stringify(this.emissionSourceGroupsBackup))
      }
      this.cfgEditStep = 0
      this.$message.info('已取消本次修改')
    },
    saveCfgEdit() {
      // 核心硬指标门槛：由所选标准解析内容 thresholdRule 分档带出（兜底 0.20/0.25）
      const rule = (this.currentStandard && this.currentStandard.thresholdRule) || { small: 0.20, large: 0.25 }
      this.parkIndicators.carbonPerTceTarget = this.parkInfo.annualEnergyScale === '100万tce以下' ? rule.small : rule.large
      this.parkIndicators.carbonPerTceStatus = this.parkIndicators.carbonPerTce <= this.parkIndicators.carbonPerTceTarget ? '达标' : '超标'

      this.cfgEditStep = 0
      this.$message.success('园区主体信息、核算标准及排放源清单已成功保存')
    },
    // ===== 标准库联动：核算标准、指标体系、评价指标均由所选标准的【解析内容】自动带出（非写死）=====
    loadParkStandardFromLibrary() {
      try {
        if (typeof ensureSeed === 'function') ensureSeed()   // 保证 PARK 标准种子入库（业务场景不会自动触发）
        const saved = localStorage.getItem('carbon-library-standards-v2') || localStorage.getItem('carbon-library-standards')
        const all = saved ? JSON.parse(saved) : []
        const park = all.filter(x => (x.scenarios || []).indexOf('PARK') > -1)
        if (!park.length) return
        const list = park.map(x => {
          const st = x.structured || {}
          return {
            code: x.code,
            name: x.name,
            status: x.status || '',
            version: x.version || '',
            year: String(x.yearNum || ''),
            issuer: x.issuer || '',
            desc: x.desc || '',
            // ★ 以下三项均来自标准【解析内容】structured
            indicatorSystemName: st.indicatorSystemName || '国家级零碳园区建设指标体系（试行）',
            accountingFormula: st.accountingFormula || 'E_园区 = E_能源活动 + E_工业过程',
            indicators: st.indicators || [],
            thresholdRule: st.thresholdRule || null
          }
        })
        this.standards = list
        this.selectedStandardCode = list[0].code
        this.applyStandardParsedContent(this.currentStandard)
      } catch (e) { /* 标准库异常时保留内置兜底 */ }
    },
    // 将标准解析内容应用到指标体系：定义来自标准（覆盖），运行数值保留本地演示值
    applyStandardParsedContent(std) {
      if (!std) return
      const defs = std.indicators || []
      if (defs.length) {
        this.guidedIndicators = this.guidedIndicators.map(g => {
          const def = defs.find(x => x.key === g.key)
          return def ? Object.assign({}, g, { name: def.name, target: def.target, unit: def.unit, op: def.op, desc: def.desc }) : g
        })
      }
      if (std.thresholdRule) {
        const large = this.parkInfo.annualEnergyScale === '100万tce及以上'
        this.parkIndicators.carbonPerTceTarget = large ? std.thresholdRule.large : std.thresholdRule.small
        this.parkIndicators.carbonPerTceStatus = this.parkIndicators.carbonPerTce <= this.parkIndicators.carbonPerTceTarget ? '达标' : '超标'
      }
    },
    onStandardChange(code) {
      const std = this.standards.find(s => s.code === code)
      this.$message.success('已切换为核算标准：' + (std ? std.name : code))
    },
    getGuidedIndicator(key) {
      return this.guidedIndicators.find(g => g.key === key) || {}
    },

    // 格式化规划面积（单位固定为 m²，保留 2 位小数）
    formatArea(val) {
      const num = Number(val)
      if (isNaN(num)) return '0.00 m²'
      return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' m²'
    },

    // ===== 阶段 2 排放源清单管理（数据底座数据识别 + 智能附件补充） =====
    openAddSource(defaultCategory) {
      this.sourceIsEdit = false
      this.sourceEditIndex = -1
      const category = defaultCategory || '化石燃料燃烧'
      const isProcess = category === '工业过程'
      
      let defaultDetail = '燃气结算发票与用能账单 OCR 解析'
      if (category === '能源加工转换') {
        defaultDetail = 'SCADA 管网总表与供热介质流量测点直连'
      } else if (category === '净购入电力热力') {
        defaultDetail = '市政受电关口双向表直连（含光伏自用与绿电直供核减）'
      } else if (category === '工业过程') {
        defaultDetail = '具体产品月度产量台账与排污报告解析'
      }

      this.sourceForm = {
        id: this.emissionSources.length + 1,
        name: '',
        category: category,
        channel: defaultCategory === '化石燃料燃烧' || defaultCategory === '工业过程' ? '材料识别' : '底座数据识别',
        channelDetail: defaultDetail,
        enabled: true
      }
      this.sourceDialog = true
    },
    openEditSource(item) {
      const index = this.emissionSources.findIndex(s => s.id === item.id)
      this.sourceIsEdit = true
      this.sourceEditIndex = index
      this.sourceForm = JSON.parse(JSON.stringify(item))
      this.sourceDialog = true
    },
    saveSource() {
      if (!this.sourceForm.name || !this.sourceForm.name.trim()) {
        this.$message.warning('请输入排放源或具体产品名称')
        return
      }
      if (this.sourceIsEdit && this.sourceEditIndex >= 0) {
        this.$set(this.emissionSources, this.sourceEditIndex, {
          ...this.sourceForm,
          enabled: true
        })
        this.$message.success('已修改排放源/产品信息')
      } else {
        this.emissionSources.push({
          ...this.sourceForm,
          id: this.emissionSources.length + 1,
          enabled: true
        })
        this.$message.success('已新增排放源并纳入园区统一核算清单')
      }
      this.sourceDialog = false
    },
    deleteSource(itemOrIdx) {
      const idx = typeof itemOrIdx === 'number' ? itemOrIdx : this.emissionSources.findIndex(s => s.id === itemOrIdx.id)
      if (idx < 0) return
      const targetName = this.emissionSources[idx].name
      this.$confirm(`确认从零碳园区核算底账中删除「${targetName}」？`, '提示', {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
      }).then(() => {
        this.emissionSources.splice(idx, 1)
        this.$message.success('已从核算清单中移除该排放源')
      }).catch(() => {})
    },
    toggleSourceStatus(item) {
      item.enabled = !item.enabled
      this.$message.info(`排放源「${item.name}」已${item.enabled ? '启用' : '停用'}`)
    },

    // 因子库联动：跳转平台已有「排放因子库」（新标签，保留当前核算会话）
    openFactorLibrary() {
      window.open('/#/agent-center/apps/emission-factor-library', '_blank')
    },
    // 数据清单：把 活动数据 / 排放因子 / 核算参数 统一编号为「计算参数 1,2,3…」
    itemCalcParams(r, grpKey) {
      const labelMap = {
        fossil: { a: '燃料消耗量(FC)', f: '综合排放因子(EF)' },
        conversion: { a: '转换投入能源(AD_入)', f: '投入因子(EF_入)' },
        net: { a: '受入电量(AD_i)', f: '排放因子(EF_i)' },
        process: { a: '产品产量(P_j)', f: '单位产品过程排放因子(EF_j)' }
      }
      const lm = labelMap[grpKey] || { a: '活动数据', f: '排放因子' }
      const list = []
      if (r.hasData !== false && (r.activityText || (r.value !== undefined && r.value !== null))) {
        if (r.activityText) {
          list.push({ label: r.factor ? lm.a : '当期值', val: r.activityText, num: r.activityText, unit: '', source: r.dataSource || '', proof: r.proof || '' })
        } else {
          list.push({ label: r.factor ? lm.a : '当期值', val: Number(r.value).toLocaleString() + ' ' + (r.unit || ''), num: Number(r.value).toLocaleString(), unit: r.unit || '', source: r.dataSource || '', proof: r.proof || '' })
        }
      }
      if (r.factor) {
        const f = this._splitNumUnit(r.factor)
        list.push({ label: lm.f, val: r.factor, num: f.num, unit: f.unit, source: r.factorSource || '', proof: '' })
      }
      ;(r.params || []).forEach(p => {
        const sp = this._splitNumUnit(p[1])
        list.push({ label: p[0], val: p[1], num: sp.num, unit: sp.unit, source: '', proof: '' })
      })
      return list
    },
    // 底层折算参数数量
    subParamCount(r) { return (r.params || []).length },
    // 补充缺失数据：定位缺失项并给出补录指引
    showMissingData() {
      const d = this.dataCompleteness()
      this._quietSwitch()
      this.cdActiveTab = 'tasks'
      this.resultTab = 'list'
      let content
      if (d.missing.length) {
        content = '⚠ **待补录 ' + d.missing.length + ' 项**：' + d.missing.join('、')
          + '\n\n可「上传台账」补录凭证，或「补充确认数据」后重算（缺失项当前按 0 计入，结果偏低）。'
      } else {
        content = '当前 **' + d.total + ' 项排放源数据与凭证齐备**（底座直连 ' + d.baseOk + '/' + d.baseTotal
          + '，材料识别 ' + d.matOk + '/' + d.matTotal + '）。\n\n'
          + '如个别参数需调整，可点卡片进入抽屉，用参数行 ✏️ 更正（留痕并重算）。'
      }
      this._push(content, ['上传台账', '查看数据清单'])
    },
    // 数据完整性（应报 / 已接入 / 缺失 / 凭证齐套）
    dataCompleteness() {
      const groups = this.resultGroups.filter(g => !g.paramGroup)
      const items = []
      groups.forEach(g => (g.items || []).forEach(r => items.push(r)))
      const base = items.filter(r => r.channel === '底座数据识别')
      const mat = items.filter(r => r.channel === '材料识别')
      // 底座直连：基本不会缺失（仅统计未接入）
      const baseMissing = base.filter(r => r.hasData === false).map(r => r.name)
      // 材料识别：重点在凭证补充/确认
      const matMissing = mat.filter(r => r.hasData === false).map(r => r.name)
      const matNoProof = mat.filter(r => r.hasData !== false && !r.proof).map(r => r.name)
      const total = items.length
      const needConfirm = matMissing.concat(matNoProof)
      return {
        total: total,
        baseTotal: base.length, baseOk: base.length - baseMissing.length,
        matTotal: mat.length, matOk: mat.length - matMissing.length, matProofOk: mat.length - matMissing.length - matNoProof.length,
        missing: needConfirm, baseMissing: baseMissing, matMissing: matMissing, matNoProof: matNoProof,
        rate: total ? Math.round(((total - needConfirm.length) / total) * 100) : 100
      }
    },
    // 数据完整性文案
    dataCompletenessText() {
      const d = this.dataCompleteness()
      let s = '**数据完整性**：底座直连 ' + d.baseOk + '/' + d.baseTotal + ' 项已接入'
        + ' · 材料识别 ' + d.matOk + '/' + d.matTotal + ' 项（凭证齐套 ' + d.matProofOk + '/' + d.matTotal + '）'
        + ' · 完整度 ' + d.rate + '%'
      if (d.matMissing.length || d.matNoProof.length) {
        s += '\n\n⚠ 材料识别项待补充/确认：' + d.missing.join('、')
        s += '——底座数据已直连无需补录，可「上传材料」补凭证或「补充确认数据」。'
      } else if (d.baseMissing.length) {
        s += '\n\n⚠ 底座直连未接入：' + d.baseMissing.join('、') + '——请检查测点接入。'
      } else {
        s += '\n\n底座数据已直连、材料识别凭证齐备，可直接用于申报与验收。'
      }
      return s
    },
    // 组级计算式拆解（指标组）
    groupCalcParts(g) {
      const txt = (g && g.calcText) || ''
      if (!txt) return { left: '', right: '' }
      const eq = txt.split(/\s*=\s*/)
      if (eq.length >= 2) return { left: eq.slice(0, -1).join(' = '), right: eq[eq.length - 1] }
      return { left: txt, right: '' }
    },
    // 计算式拆解：左式 / 结果（结果加粗高亮）
    itemCalcParts(r) {
      const txt = this.itemCalcText(r)
      if (!txt) return { left: '', right: '' }
      const eq = txt.split(/\s*=\s*/)
      if (eq.length >= 2) return { left: eq.slice(0, -1).join(' = '), right: eq[eq.length - 1] }
      const ap = txt.split(/\s*≈\s*/)
      if (ap.length >= 2) return { left: ap[0] + ' ≈', right: ap[1] }
      return { left: txt, right: '' }
    },
    // 计算参数更正（锁期前可改；留痕并重算行/组/总量）
    openParamEdit(r, g, cp, ci) {
      if (this.isPeriodFiled) { this.$message.warning('本期已锁定，需先解除锁定后更正'); return }
      let name = r.name, oldVal = r.value, unit = r.unit || '', val = r.value
      if (cp) {
        name = cp.label
        oldVal = cp.val
        unit = ''
        val = cp.num
      }
      this.paramEditForm = { name: name, oldVal: oldVal, val: val, unit: unit, reason: '' }
      this.paramEditTarget = { r, g, cp: cp || null, ci: (ci === undefined ? null : ci) }
      this.paramEditDialog = true
    },
    saveParamEdit() {
      const tg = this.paramEditTarget
      if (!tg) return
      const nv = Number(this.paramEditForm.val)
      if (isNaN(nv) || String(this.paramEditForm.val).trim() === '') { this.$message.warning('请输入有效数值'); return }
      if (!String(this.paramEditForm.reason || '').trim()) { this.$message.warning('请填写更正理由'); return }
      const old = tg.cp ? tg.cp.val : tg.r.value
      this.paramEditLog.unshift({ time: new Date().toLocaleTimeString('zh-CN'), name: (tg.cp ? tg.cp.label : tg.r.name), old: old, new: nv, reason: this.paramEditForm.reason })
      let emissionChanged = false
      if (!tg.cp) {
        // 指标参数组：当期值
        tg.r.value = nv
      } else if (tg.ci === 0) {
        // 活动数据
        tg.r.value = nv
        const f0 = parseFloat(String(tg.r.factor || '0'))
        if (tg.r.factor && !isNaN(f0)) { tg.r.emission = Math.round(nv * f0 * 100) / 100; emissionChanged = true }
      } else if (tg.r.factor && tg.ci === 1) {
        // 排放因子：保留单位，仅换数值，并重算
        const oldF = String(tg.r.factor)
        const m0 = oldF.match(/^[\d.]+/)
        const u0 = m0 ? oldF.slice(m0[0].length) : ''
        tg.r.factor = nv + u0
        tg.r.emission = Math.round(Number(tg.r.value) * nv * 100) / 100
        emissionChanged = true
      } else if (tg.r.params) {
        // 底层折算参数：仅更新参数值（因子为综合值，不重算排放）
        const pIdx = tg.ci - (tg.r.factor ? 2 : 1)
        if (tg.r.params[pIdx]) {
          const oldP = String(tg.r.params[pIdx][1])
          const m1 = oldP.match(/^[\d.]+/)
          const u1 = m1 ? oldP.slice(m1[0].length) : ''
          tg.r.params[pIdx][1] = nv + u1
        }
      }
      if (emissionChanged) {
        this.resultGroups.forEach(grp => {
          if (grp.items && grp.items.some(x => typeof x.emission === 'number')) {
            grp.emission = grp.items.reduce((s, x) => s + (typeof x.emission === 'number' ? x.emission : 0), 0)
          }
        })
        const total = this.resultGroups.filter(x => typeof x.emission === 'number').reduce((s, x) => s + x.emission, 0)
        this.kpiTotalOverride = Math.round(total)
        this.kpiCarbonPerTceOverride = Number((total / 102470).toFixed(3))
      }
      this.paramEditDialog = false
      this.$message.success('参数已更正并留痕：' + old + ' → ' + nv + ' ' + (tg.r.unit || '') + '（理由：' + this.paramEditForm.reason + '）')
    },
    // 数据清单折叠
    toggleGroup(k) { this.$set(this.groupCollapsed, k, !this.groupCollapsed[k]) },
    toggleItem(k) { this.$set(this.itemExpanded, k, !this.itemExpanded[k]) },
    toggleParams(k) { this.$set(this.paramExpanded, k, !this.paramExpanded[k]) },
    // 拆分「数值 + 单位」
    _splitNumUnit(str) {
      const s = String(str || '')
      const i = s.indexOf(' ')
      if (i < 0) return { num: s, unit: '' }
      return { num: s.slice(0, i), unit: s.slice(i + 1) }
    },
    // 参数匹配过程（候选 / 采用 / 取数规则）
    paramMatchInfo(r, cp, ci) {
      const isAct = (ci === 0)
      const isFactor = (!!r.factor && ci === 1)
      if (isAct) {
        return {
          rule: '按排放源品种匹配底座测点 / 材料单据（唯一命中）',
          candidates: 1,
          adopted: cp.source || r.dataSource || '—'
        }
      }
      if (isFactor) {
        const src = r.factorSource || '国家温室气体清单排放因子库'
        const isPrivate = src.indexOf('企业实测') > -1
        return {
          rule: '取数优先级：企业实测 > 省级清单测算 > 国家清单缺省；同级取年份最新、地域最精确',
          candidates: 3,
          adopted: src + (isPrivate ? '（私因数）' : '（公因数缺省值）')
        }
      }
      return { rule: '折算参数随因子版本联动（唯一）', candidates: 1, adopted: '随因子版本' }
    },
    // 页签（无因子场景不显示匹配）
    traceTabs() {
      const hasFactor = !!(this.traceRow && this.traceRow.factor)
      const tabs = [{ key: 'source', label: '凭证' }]
      if (hasFactor) tabs.push({ key: 'match', label: '匹配' })
      tabs.push({ key: 'record', label: '记录' })
      return tabs
    },
    // 当前选中参数
    activeParamCp() {
      const r = this.traceRow
      if (!r) return null
      const list = this.itemCalcParams(r, this.traceGrpKey)
      return list[this.activeParam] || list[0] || null
    },
    // 当前选中参数的匹配信息
    activeParamMatch() {
      const cp = this.activeParamCp()
      if (!cp) return null
      return this.paramMatchInfo(this.traceRow, cp, this.activeParam)
    },
    // 当前选中参数的更正记录
    activeParamLogs() {
      const cp = this.activeParamCp()
      if (!cp) return []
      return (this.paramEditLog || []).filter(l => l.name === cp.label)
    },
    // 参数符号（与计算模型公式一致）
    paramSym(ci) {
      const r = this.traceRow
      if (!r || !r.factor) return 'P' + (ci + 1)
      if (ci === 0) return 'AD'
      if (ci === 1) return 'EF'
      return 'P' + ci
    },
    // 参数分组：活动数据 / 排放因子（无因子场景单组）
    traceParamGroups() {
      const r = this.traceRow
      if (!r) return []
      const list = this.itemCalcParams(r, this.traceGrpKey)
      return [{ key: 'all', label: '计算参数', items: list.map((cp, i) => ({ cp: cp, ci: i })) }]
    },
    // 选中参数（联动匹配页签）
    selectParam(ci) { this.activeParam = ci },
    // 计算式：优先取显式配置，否则按 活动×因子≈排放 自动生成
    itemCalcText(r) {
      if (r.calcText) return r.calcText
      if (r.value !== undefined && r.value !== null && r.factor) {
        return Number(r.value).toLocaleString() + ' ' + (r.unit || '') + ' × ' + r.factor + ' ≈ ' + Number(r.emission || 0).toLocaleString() + ' tCO₂'
      }
      return ''
    },
    // 计算参数数据渠道编辑
    openEditParam(p) {
      this.indicatorLedgerForm = { pid: p.id, name: p.name, channel: p.channel, channelDetail: p.channelDetail }
      this.indicatorLedgerDialog = true
    },
    saveParam() {
      let hit = null
      this.indicatorParamList.forEach(g => g.params.forEach(p => { if (p.id === this.indicatorLedgerForm.pid) hit = p }))
      if (hit) {
        hit.channel = this.indicatorLedgerForm.channel
        hit.channelDetail = this.indicatorLedgerForm.channelDetail
        this.$message.success('已更新「' + hit.name + '」的数据渠道')
      }
      this.indicatorLedgerDialog = false
    },

        // 向前兼容别名
    openAddFacility() { this.openAddSource() },
    openEditFacility(grpKey, it, idx) { this.openEditSource(it, idx) },
    saveFacility() { this.saveSource() },
    deleteFacility(grpKey, idx) { this.deleteSource(idx) },
    switchCdTab(tab) {
      this.cdActiveTab = tab
      if (tab === 'tasks' && this.resultTab === 'chart') {
        this.$nextTick(() => this.initResultCharts && this.initResultCharts())
      }
    },
    switchResultTab(tab) {
      this.resultTab = tab
      if (tab === 'chart') this.$nextTick(() => this.initResultCharts && this.initResultCharts())
    },
    setGranularity(g) {
      this.resultGranularity = g
      this.$nextTick(() => this.initResultCharts && this.initResultCharts())
    },

    // 锁定与解锁切换
    togglePeriodArchive() {
      if (this.isPeriodFiled) {
        this.unarchivePeriod()
      } else {
        this.archivePeriod()
      }
    },
    // 锁定与解锁
    archivePeriod() {
      const p = this.currentPeriodKey
      if (!p || this.isPeriodFiled) return
      this.$confirm('锁定后「' + p + '」园区核算数据将不可修改，内容指纹已存证。确认锁定？', '锁定确认', {
        confirmButtonText: '确认锁定', cancelButtonText: '取消', type: 'warning'
      }).then(() => {
        this.$set(this.cycleArchive, p, 'filed')
        this._saveCycleArchive()
        this.$message.success('本期园区碳核算数据已锁定')
        this.messages.push({
          id: 'MSG-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), role: 'assistant',
          content: '✅ **「' + p + '」园区核算数据已锁定**\n\n园区碳排放总量 **18,340 tCO₂**，单位能耗碳排放 **0.179 tCO₂/tce**（达标），清洁能源消费比重 **91.5%**（达标）。\n\n报告已同步归档至「报告与档案中心」。',
          timestamp: new Date().toLocaleTimeString('zh-CN'),
          suggestions: ['查看数据清单', '导出核算报表']
        })
      }).catch(() => {})
    },
    unarchivePeriod() {
      const p = this.currentPeriodKey
      if (!p || !this.isPeriodFiled) return
      this.$confirm('解除锁定后「' + p + '」数据可再次调整，操作将记入日志。确认解除？', '解除锁定', {
        confirmButtonText: '确认解除', cancelButtonText: '取消', type: 'warning'
      }).then(() => {
        this.$delete(this.cycleArchive, p)
        this._saveCycleArchive()
        this.$message.success('已解除锁定，本期数据可修改')
      }).catch(() => {})
    },
    _saveCycleArchive() {
      try { localStorage.setItem('park_cycle_archive_v1', JSON.stringify(this.cycleArchive)) } catch (e) {}
    },
    _loadCycleArchive() {
      try { this.cycleArchive = JSON.parse(localStorage.getItem('park_cycle_archive_v1') || '{}') } catch (e) { this.cycleArchive = {} }
    },

    // 导出与报告
    exportCalculationData() {
      this.$message.success('已成功导出 ' + this.currentPeriodKey + ' 园区碳排放核算台账 (Excel)')
    },
    generateReport() {
      this.$message.success('已成功生成 ' + this.currentPeriodKey + ' 零碳园区碳排放核算报告，可前往报告中心下载')
    },

    // 数据溯源抽屉
    openTrace(r, grpKey) {
      this.activeParam = 0
      this.traceTab = 'source'
      this.traceRow = r
      this.traceGrpKey = grpKey || ''
      this.traceDrawer = false
      this.pushTraceGuide(r)
    },
    linkProof(r) {
      this.$message.info('正在调取佐证材料库中「' + (r.proof || r.name) + '」的存证底卷...')
    },

    renderMarkdown(text) {
      if (!text) return ''
      return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>').replace(/`(.*?)`/g, '<code>$1</code>')
    },
    // 思考过程展开/折叠
    toggleThinking(id) {
      this.$set(this.thinkingOpen, id, !this.thinkingOpen[id])
    },
    // 输入框回车发送
    handleCycleSendKey(e) {
      if (e.shiftKey) return
      e.preventDefault()
      this.handleCycleSend && this.handleCycleSend()
    },
    // 输入框自适应高度
    autoResizeTextarea() {
      const el = this.$refs.inputTextareaRef
      if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px' }
    },
    // 常用指令提示
    showCmdHint() {
      this.messages.push({
        id: 'cmd-' + Date.now(), role: 'assistant',
        content: '💡 **常用指令提示**：\n• 询问“单位能耗碳排放”或“指标达标情况”\n• 询问“清洁能源消纳”或“光伏与绿电”\n• 点击“生成园区核算报告”或“导出数据”',
        suggestions: ['指标对标诊断', '清洁能源消纳说明', '生成园区核算报告'],
        timestamp: new Date().toLocaleTimeString('zh-CN')
      })
      this.scrollToBottom && this.scrollToBottom()
    },
    // 新手引导
    startOnboarding() {
      this.onboardingStep = 0
      this.showOnboarding = true
    },
    finishOnboarding() {
      this.showOnboarding = false
      try { localStorage.setItem('park_onboarding_done', '1') } catch (e) {}
    },
    // 历史对话切换与加载
    toggleHistorySidebar() {
      this.showHistorySidebar = !this.showHistorySidebar
      if (this.showHistorySidebar) this.loadConversationHistory()
    },
    loadConversationHistory() {
      try {
        const saved = localStorage.getItem('park_conversation_history')
        this.conversationHistory = saved ? JSON.parse(saved) : []
      } catch (e) { this.conversationHistory = [] }
    },
    newConversation() {
      this.saveCurrentConversation()
      this.messages = []
      this.$message.success('已开启新对话')
    },
    saveCurrentConversation() {
      if (!this.messages || this.messages.length === 0) return
      try {
        const stored = localStorage.getItem('park_conversation_history')
        let history = stored ? JSON.parse(stored) : []
        const firstMsg = this.messages.find(m => m.role === 'assistant')
        const title = firstMsg ? firstMsg.content.replace(/[#*]/g, '').substring(0, 30) + '…' : '新对话'
        history.unshift({
          id: 'CONV-' + Date.now(),
          title: title,
          timestamp: new Date().toLocaleString('zh-CN'),
          messages: JSON.parse(JSON.stringify(this.messages))
        })
        if (history.length > 20) history = history.slice(0, 20)
        localStorage.setItem('park_conversation_history', JSON.stringify(history))
        this.conversationHistory = history
      } catch (e) {}
    },
    loadConversation(convId) {
      const conv = this.conversationHistory.find(c => c.id === convId)
      if (!conv) return
      this.currentConversationId = convId
      this.messages = JSON.parse(JSON.stringify(conv.messages))
      this.$nextTick(() => { this.scrollToBottom && this.scrollToBottom() })
    },
    deleteConversation(convId) {
      this.conversationHistory = this.conversationHistory.filter(c => c.id !== convId)
      try {
        localStorage.setItem('park_conversation_history', JSON.stringify(this.conversationHistory))
      } catch (e) {}
    }
  }
}
