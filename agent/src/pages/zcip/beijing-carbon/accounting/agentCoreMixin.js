import { matchFactor, saveUserFactorOverride, normalizeQuantityAndUnit } from '@/utils/factorMatchingService'
import { loadOrgStandardsForAgent, loadBjStandardsForAgent, ensureSeed } from '@/utils/policyStandardService'
﻿export default {
  data() {
    return {
      inputText: '',
      isReportArchived: false,
      isSopPublished: false,
      reportViewMode: 'report', // 'report'|'traceability'|'verification'
      defaultTraceabilityData: [
        { id: 1, name: '天然气消耗量 85 万m³', stage: '范围1·固定源燃烧', source: '燃气结算单 / 能源台账', version: '2025年度', confLevel: 'high', confLabel: '高' },
        { id: 2, name: '天然气排放因子 21.62 tCO₂/万m³', stage: '范围1·固定源燃烧', source: 'GHG Protocol / IPCC 缺省值', version: '2025', confLevel: 'high', confLabel: '高' },
        { id: 3, name: '柴油消耗量 120 t', stage: '范围1·固定源燃烧', source: '燃料采购台账', version: '2025年度', confLevel: 'high', confLabel: '高' },
        { id: 4, name: '柴油排放因子 3.096 tCO₂/t', stage: '范围1·固定源燃烧', source: 'IPCC 国家温室气体清单缺省值', version: '2019 修订版', confLevel: 'high', confLabel: '高' },
        { id: 5, name: '车辆柴油消耗量 35 t', stage: '范围1·移动源燃烧', source: '车辆加油记录', version: '2025年度', confLevel: 'high', confLabel: '高' },
        { id: 6, name: '碳酸盐原料投入量 1,200 t', stage: '范围1·工业过程与逸散', source: '原料领用单', version: '2025年度', confLevel: 'medium', confLabel: '中' },
        { id: 7, name: '过程排放因子 0.44 tCO₂/t', stage: '范围1·工业过程与逸散', source: 'GHG Protocol 缺省值', version: '2025', confLevel: 'medium', confLabel: '中' },
        { id: 8, name: '净购入电量 12,000 MWh', stage: '范围2·外购电力/热力', source: '电费结算单', version: '2025年度', confLevel: 'high', confLabel: '高' },
        { id: 9, name: '电网排放因子 0.5703 tCO₂/MWh', stage: '范围2·外购电力/热力', source: '生态环境部区域电网排放因子', version: '2025', confLevel: 'high', confLabel: '高' },
        { id: 10, name: '净购入热力 8,500 GJ', stage: '范围2·外购电力/热力', source: '热力结算单', version: '2025年度', confLevel: 'high', confLabel: '高' }
      ],
      windTraceabilityData: [
        { id: 1, name: '钕铁硼永磁材料用量 6,000 kg', stage: '范围1·固定源燃烧', source: '发电机供应商BOM清单', version: '2025-Q3 设计BOM', confLevel: 'high', confLabel: '高', icon: 'el-icon-box', confReason: '活动数据来源于发电机供应商BOM清单实测记录，数据可直接追溯至原始凭证，时间范围覆盖核算期，完整性与时效性良好。' },
        { id: 2, name: '稀土采选冶排放因子 18.6', stage: '范围1·固定源燃烧', source: 'CPCD + 稀土行业LCA研究报告', version: 'CPCD 2024 / 2023 行业研究', confLevel: 'medium', confLabel: '中', icon: 'el-icon-coin', confReason: '稀土采选冶环节因子受矿源品位与分离工艺影响较大，行业研究数据存在±15%波动，建议向供应商核实实际取值。' },
        { id: 3, name: '玻璃纤维增强塑料用量 95,000 kg', stage: '范围1·固定源燃烧', source: '叶片供应商BOM清单', version: '2025-Q3 采购数据', confLevel: 'high', confLabel: '高', icon: 'el-icon-box', confReason: '活动数据来源于叶片供应商BOM清单，数据可直接追溯至原始凭证，完整性与时效性良好。' },
        { id: 4, name: '年发电小时数 4,200 h', stage: '使用阶段', source: '风场SCADA运行数据', version: '投运后年度均值', confLevel: 'high', confLabel: '高', icon: 'el-icon-data-line', confReason: '活动数据来源于风场SCADA系统逐时运行记录，投运后实测均值与可研值一致，数据具有计量级准确性。' },
        { id: 5, name: '废玻纤处置排放因子 0.35', stage: '范围3·价值链间接', source: 'Ecoinvent（填埋/水泥窑协同）', version: 'v3.10 / 2024-06', confLevel: 'medium', confLabel: '中', icon: 'el-icon-coin', confReason: '国内风电叶片回收处置因子数据库尚不完善，当前引用国际数据库，地理代表性存在偏差，建议跟踪国内处置因子发布动态。' }
      ],
      verificationOrgs: [
        { id: 1, name: '中国质量认证中心', engName: 'CQC (China Quality Certification Centre)', location: '北京', qualifications: 'ISO 14065 认证 / CNAS 授权', scope: '排放量、碳核查、LCA验证', contact: '010-8386 1234', rating: '★★★★★ 国家级权威', priceRange: '¥3-5万', accredited: true, logoIcon: 'el-icon-office-building', logoBg: '#ecf5ff', logoColor: '#0067FE' },
        { id: 2, name: 'SGS 通标标准技术服务', engName: 'SGS (Société Générale de Surveillance)', location: '上海（全球100+分支）', qualifications: 'ISO 14065 / ISO 17025 / EU ETS 认证', scope: '排放量、GHG核查、ESG审计', contact: '021-6115 6789', rating: '★★★★★ 全球龙头', priceRange: '¥5-8万', accredited: true, logoIcon: 'el-icon-s-flag', logoBg: '#f0f9eb', logoColor: '#3d8a3d' },
        { id: 3, name: '必维国际检验集团', engName: 'Bureau Veritas (BV)', location: '深圳（全球140+国家）', qualifications: 'ISO 14065 / ISO 17024 认证', scope: '排放量验证、碳标签认证', contact: '0755-2688 3456', rating: '★★★★☆ 国际知名', priceRange: '¥4-7万', accredited: true, logoIcon: 'el-icon-s-check', logoBg: '#fdf6ec', logoColor: '#d48806' },
        { id: 4, name: '中环排放量认证中心', engName: 'Zhonghuan Carbon Verification Centre', location: '珠海', qualifications: 'CNAS 碳核查授权 / 行业专项认证', scope: '电力行业排放量、设备级LCA', contact: '0756-212 8989', rating: '★★★★☆ 行业专精', priceRange: '¥2-4万', accredited: true, logoIcon: 'el-icon-data-analysis', logoBg: '#ecf5ff', logoColor: '#0067FE' },
        { id: 5, name: 'TÜV 南德意志集团', engName: 'TÜV SÜD', location: '广州（全球50+分支）', qualifications: 'ISO 14065 / DAkkS 认证', scope: '排放量、产品LCA、碳标签', contact: '020-3839 1234', rating: '★★★★☆ 欧洲权威', priceRange: '¥4-6万', accredited: true, logoIcon: 'el-icon-s-security', logoBg: '#f5f7fa', logoColor: '#303133' }
      ],
      isTyping: false,
      showFactorLibDialog: false, // 因子库选择对话框
      showEvidenceDrawer: false, // C-PSTGT-E 决策证据链抽屉
      activeEvidenceTrace: null, // 当前查看的决策留痕对象
      mappingMemoryCount: 3, // 企业自学习映射记忆条数
      factorDatabases: [
        { id: 'ecoinvent', name: 'Ecoinvent', shortName: 'Ecoinvent', origin: '瑞士/国际', desc: '全球最广泛使用的LCA数据库，覆盖10,000+排放源', recommended: true, selected: true, version: '3.10', releaseDate: '2023-11', standards: ['14067', '24067', 'ISO', 'GB/T', '环境足迹', '2021/2279'] },
        { id: 'elcd', name: 'ELCD（European Life Cycle Database）', shortName: 'ELCD', origin: '欧盟', desc: '欧洲参考核算范围数据库，适用于欧洲背景数据', selected: false, disabled: true, disabledReason: '当前企业未开通该因子库使用权限，如需启用请联系运维人员开通', version: 'v2023', releaseDate: '2023-06', standards: ['环境足迹', '2021/2279'] },
        { id: 'ipcc', name: 'IPCC排放因子数据库', shortName: 'IPCC', origin: '国际', desc: 'IPCC国家温室气体清单指南配套因子库，覆盖燃料燃烧、工业过程等', recommended: true, selected: true, version: '2019', releaseDate: '2019-05', standards: ['14067', 'ISO'] },
        { id: 'cpcd', name: '中国产品核算范围内温室气体排放系数库（CPCD）', shortName: 'CPCD', origin: '中国', desc: '中国本土因子库，覆盖主要工业产品核算范围内排放系数', recommended: true, selected: true, version: 'v1.2', releaseDate: '2024-06', standards: ['14067', '24067', 'ISO', 'GB/T'] },
        { id: 'national-gef', name: '国家温室气体排放因子数据库', shortName: '国家因子库', origin: '中国', desc: '生态环境部发布，官方权威电网因子等核心数据', recommended: true, selected: true, version: 'v2024-Q4', releaseDate: '2024-12', standards: ['14067', '24067', 'ISO', 'GB/T'] }
      ],
      pageMode: 'task-active', // 任务对话模式；无活跃任务时显示工作台欢迎视图
      taskList: [], // 历史任务列表（localStorage持久化）
      currentTaskId: null, // 当前活跃任务ID
      periodRange: [], // 核算时间范围 [起始日期, 结束日期]（阶段1 确认）
      newProc: {}, // 各大类「新增排放源」下拉的临时值 { [catKey]: name }
      // 阶段3 材料识别
      materialDialog: false,
      materialFiles: [],
      recognizing: false,
      recognizedSources: [],
      manualSourceCount: 0,
      // 数据溯源抽屉
      traceDrawer: false,
      traceRow: null,
      selectedParam: null, // 当前选中的参数（右侧点击 → 左侧引导联动）
      // 时间范围快捷选项
      periodPickerOptions: {
        shortcuts: [
          {
            text: '本年度',
            onClick(picker) {
              const y = new Date().getFullYear()
              picker.$emit('pick', [new Date(y, 0, 1), new Date(y, 11, 31)])
            }
          },
          {
            text: '上年度',
            onClick(picker) {
              const y = new Date().getFullYear() - 1
              picker.$emit('pick', [new Date(y, 0, 1), new Date(y, 11, 31)])
            }
          },
          {
            text: '本季度',
            onClick(picker) {
              const now = new Date()
              const q = Math.floor(now.getMonth() / 3)
              const start = new Date(now.getFullYear(), q * 3, 1)
              const end = new Date(now.getFullYear(), q * 3 + 3, 0)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '上季度',
            onClick(picker) {
              const now = new Date()
              const q = Math.floor(now.getMonth() / 3)
              const y = q === 0 ? now.getFullYear() - 1 : now.getFullYear()
              const qq = q === 0 ? 3 : q - 1
              const start = new Date(y, qq * 3, 1)
              const end = new Date(y, qq * 3 + 3, 0)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '本月',
            onClick(picker) {
              const now = new Date()
              const start = new Date(now.getFullYear(), now.getMonth(), 1)
              const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
              picker.$emit('pick', [start, end])
            }
          }
        ]
      },
      pendingTaskId: null, // 待创建任务ID（进入阶段2 才正式落库）
      newTaskProductName: '', // 新建任务-企业名称
      currentEnterprise: '小米汽车', // 当前登录企业（组织碳核算只核算本企业）
      currentIndustry: '新能源汽车制造', // 当前企业所属行业（用于行业画像推荐）
      newTaskStandard: '', // 新建任务-核算标准
      tlDialogStep: 'welcome', // 对话流程步进: welcome | show-history
      tlInputText: '', // 初始化对话输入框
      // 历史对话栏
      showHistorySidebar: false,
      conversationHistory: [],
      currentConversationId: null,
      currentStepIndex: 0,
      selectedStandard: 'DB11/T 1787-2020',
      standardPickerOpen: false,   // 标准切换列表展开态
      selectedUnit: 'scope12',
      boundarySubStep: 0, // 阶段二内5个子步骤: 0-4
      isModelBuilt: false, // 是否构建了核算模型
      modelValidated: false, // 模型是否已通过结构校验
      highlightProc: null, // 阶段3新增排放源后的高亮定位 { gi, pi }
      analysisActiveTab: 'routine', // 阶段八分析页签
      analysisSubStep: 0, // 阶段八的三个子步骤: 0-常规分析, 1-不确定性确认, 2-敏感性及全部解锁
      uncertaintyParams: { sampleSize: 10000, confidenceLevel: 95 }, // 不确定性分析参数

      sensitivityRatio: 10, // 敏感性分析变动比例(%)
      emissionExpandedNodes: {}, // 树表的展开/折叠状态映射表
      boundaryConfig: {
        lifecycleScope: 'operational',   // 组织边界方法
        unitType: 'scope12',            // 核算范围口径（北京试点不含范围3）
        unitDetail: '化石燃料燃烧排放 + 工业生产过程排放 + 外购电力、热力隐含排放（DB11/T 1787 口径）',
        allocationRule: 'facility',      // 数据归集方式
        cutoffThreshold: '1%/5%',
        cutoffItemThreshold: '1%',
        cutoffTotalThreshold: '5%',
        timeBoundary: '2025-01-01 - 2025-12-31'
      },
      // ===== 多轮澄清 =====
      clarificationState: null,  // 当前澄清状态: null | { topic, step, totalSteps, data }
      clarificationTopics: {
        boundary: {
          name: '核算边界确认',
          steps: [
            { key: 'lifecycle', question: '请确认核算核算范围范围：\n* **运营控制权法**：原材料获取+生产制造+运输分销+产品使用+报废回收\n* **财务控制权法**：原材料获取+生产制造\n* **股权比例法**：仅生产制造', field: 'lifecycleScope', options: ['运营控制权法', '财务控制权法', '股权比例法'] },
            { key: 'unit', question: '请确认核算单位：\n* **核算范围口径**：按产品核算范围（如1辆汽车）\n* **参考单位**：按物理单位（如1kg产品）', field: 'unitType', options: ['核算范围口径', '参考单位'] },
            { key: 'allocation', question: '请确认数据归集：\n* **质量分配**：按产品质量比例分配\n* **经济分配**：按产品经济价值分配\n* **物理分配**：按物理量分配', field: 'allocationRule', options: ['质量分配', '经济分配', '物理分配'] },
            { key: 'cutoff', question: '请确认重要性阈值：\n* **1%/5%规则**：单项<1%且累计<5%可忽略\n* **自定义阈值**：请说明具体阈值', field: 'cutoffThreshold', options: ['1%/5%规则', '自定义阈值'] }
          ]
        },
        dataCollection: {
          name: '活动数据确认',
          steps: [
            { key: 'source', question: '请确认数据来源：\n* **实测数据**：现场仪表/台账记录\n* **估算数据**：行业平均/模型推算\n* **混合数据**：部分实测+部分估算', field: 'dataSource', options: ['实测数据', '估算数据', '混合数据'] },
            { key: 'completeness', question: '数据完整性是否满足要求？\n* **完整**：覆盖所有排放源\n* **基本完整**：缺少少量次要过程\n* **不完整**：缺少主要过程', field: 'dataCompleteness', options: ['完整', '基本完整', '不完整'] }
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
        { key: 'POLICY_ANALYSIS', name: '政策标准', label: '依据', icon: 'el-icon-reading', desc: '核算标准选择与政策条款解析', version: '3.10', releaseDate: '2023-11', standards: ['14067', '24067', 'ISO', 'GB/T', '环境足迹', '2021/2279'] },
        { key: 'CALCULATION_BOUNDARY', name: '核算边界', label: '边界', icon: 'el-icon-set-up', desc: '核算范围范围、量化单位、分配与重要性阈值' },
        { key: 'CALCULATION_MODEL', name: '排放源清单', label: '清单', icon: 'el-icon-s-grid', desc: '工艺拓扑构建与排放源建模' },
        { key: 'ACTIVITY_DATA', name: '活动数据', label: '数据', icon: 'el-icon-s-data', desc: '多源活动数据并发采集' },
        { key: 'CALCULATION_FACTORS', name: '排放因子', label: '因子', icon: 'el-icon-connection', desc: '排放因子库自动匹配绑定' },
        { key: 'DATA_VERIFICATION', name: '数据校验', label: '校验', icon: 'el-icon-warning-outline', desc: '完整性、一致性、趋势、数据质量多重校验' },
        { key: 'CARBON_CALCULATION', name: '排放计算', label: '计算', icon: 'el-icon-cpu', desc: '范围1/2/3 排放量汇总计算' },
        { key: 'CARBON_ANALYSIS', name: '排放分析', label: '分析', icon: 'el-icon-data-line', desc: '排放结构分析、强度对标与敏感度分析' },
        { key: 'CARBON_REPORT', name: '排放报告', label: '报告', icon: 'el-icon-document', desc: '核算报告生成、数据溯源与核查推荐' }
      ],
      // ===== 标准配置中心 =====
      // R040201 STORY-010（RULE-013）：标准唯一来源为政策标准库（PCF 场景已生效配置），
      // 库内新增/更新标准后此处自动获取，无需修改代码。形状与原硬编码完全兼容。
      standards: loadBjStandardsForAgent(),
      inputTypeOptions: [
        { value: 'raw_material', label: '原材料', color: '#409EFF' },
        { value: 'packaging', label: '包装材料', color: '#13C2C2' },
        { value: 'transport', label: '运输', color: '#2F54EB' },
        { value: 'energy', label: '能源', color: '#FA8C16' },
        { value: 'resource', label: '资源', color: '#52C41A' },
        { value: 'consumable', label: '辅料', color: '#722ED1' },
        { value: 'product', label: '产品', color: '#EB2F96' }
      ],
      outputTypeOptions: [
        { value: 'main_product', label: '主产品', color: '#EB2F96' },
        { value: 'by_product', label: '副产品', color: '#C62828' },
        { value: 'waste_gas', label: '废气', color: '#F5222D' },
        { value: 'solid_waste', label: '固体废物', color: '#8D6E63' },
        { value: 'wastewater', label: '废水', color: '#1890FF' }
      ],
      modelStages: this.createInitialModelStages(),
      validationStep: 0,
      validationActiveTab: 'quality',
      validationItems: this.createDefaultValidationItems(),
      supplementFiles: []
    }
  },
  computed: {
    /** 待处理项列表（阶段4：AD 未填/未确认；阶段5：EF 未匹配/未确认） */
    pendingItems() {
      if (this.currentStepIndex !== 3 && this.currentStepIndex !== 4) return []
      const isAD = this.currentStepIndex === 3
      const key = isAD ? 'AD' : 'EF'
      const items = []
      ;(this.modelStages || []).forEach(stage => {
        ;(stage.processes || []).forEach(proc => {
          ;(proc.units || []).forEach(u => {
            const p = (u.params || []).find(x => x.key === key)
            if (!p) return
            const empty = !p.value || String(p.value).trim() === ''
            const unverified = !p.verified
            if (empty || unverified) {
              items.push({
                issueId: this.paramIssueId ? this.paramIssueId(proc, u, key) : ('PI-' + proc.name + '-' + u.name + '-' + key),
                procName: proc.name,
                unitName: u.name,
                reason: empty ? '待补充' : '待确认',
                empty: empty
              })
            }
          })
        })
      })
      return items
    },

    /** 待处理项总数 */
    pendingCount() {
      return this.pendingItems.length
    },

    /** 待补充数量 */
    pendingEmptyCount() {
      return this.pendingItems.filter(x => x.empty).length
    },

    /** 待确认数量 */
    pendingUnverifiedCount() {
      return this.pendingItems.filter(x => !x.empty).length
    },

    /** 是否存在待处理项 */
    hasPending() {
      return this.pendingCount > 0
    },

    /** 阶段6：整体数据质量评估 */
    qualityAssessment() {
      const list = []
      ;(this.modelStages || []).forEach(stage => {
        ;(stage.processes || []).forEach(proc => {
          ;(proc.units || []).forEach(u => {
            ;(u.params || []).forEach(p => {
              if (!p.value) return
              const r = this.validateParam ? this.validateParam(proc, u, p) : { level: '' }
              const ad = parseFloat(p.value) || 0
              const ef = parseFloat((u.params || []).find(x => x.key === 'EF')?.value) || 0
              const emission = (p.key === 'AD') ? ad * ef : 0
              list.push({
                proc: proc.name, unit: u.name, key: p.key,
                value: p.value, unitText: p.unit,
                source: p.source || '',
                verified: p.verified,
                level: r.level,
                emission,
                isPrimary: /台账|结算|计量|实测|记录/.test(p.source || '')
              })
            })
          })
        })
      })

      const total = list.length
      if (!total) {
        return { total: 0, dqrDist: {}, weightedScore: '—', weightedGrade: '—',
                 primaryCount: 0, primaryRatio: 0, primaryEmissionRatio: 0,
                 sourceCoverage: 0, emissionCoverage: 0,
                 confDist: [], ageInfo: {}, lowQuality: [] }
      }

      // ① DQR 分布（用校验级别映射）
      const dqrDist = { A: 0, B: 0, C: 0, D: 0, E: 0 }
      list.forEach(x => {
        let g = 'C'
        if (x.level === 'hint') g = 'A'
        else if (x.level === '') g = 'B'
        else if (x.level === 'warn') g = 'D'
        else if (x.level === 'block') g = 'E'
        dqrDist[g]++
      })

      // ② 加权质量分
      const scoreMap = { A: 1.4, B: 2.2, C: 3.0, D: 3.8, E: 4.6 }
      let sumE = 0, sumW = 0
      list.forEach(x => {
        let g = 'C'
        if (x.level === 'hint') g = 'A'
        else if (x.level === '') g = 'B'
        else if (x.level === 'warn') g = 'D'
        else if (x.level === 'block') g = 'E'
        const w = x.emission > 0 ? x.emission : 1
        sumE += w
        sumW += w * scoreMap[g]
      })
      const ws = sumE > 0 ? (sumW / sumE) : 3.0
      const wg = ws <= 1.8 ? 'A' : ws <= 2.6 ? 'B' : ws <= 3.4 ? 'C' : ws <= 4.2 ? 'D' : 'E'

      // ③ 数据来源结构
      const primary = list.filter(x => x.isPrimary)
      const primaryRatio = Math.round(primary.length / total * 100)
      const totalEm = list.reduce((a, b) => a + b.emission, 0)
      const primaryEm = primary.reduce((a, b) => a + b.emission, 0)
      const primaryEmissionRatio = totalEm > 0 ? Math.round(primaryEm / totalEm * 100) : 0

      // ④ 覆盖率
      let srcTotal = 0, srcFilled = 0
      ;(this.modelStages || []).forEach(stage => {
        ;(stage.processes || []).forEach(proc => {
          srcTotal++
          if ((proc.units || []).some(u => (u.params || []).some(p => p.value))) srcFilled++
        })
      })
      const sourceCoverage = srcTotal ? Math.round(srcFilled / srcTotal * 100) : 0
      const emissionCoverage = 96  // 演示值：实际应由总排放对比得出

      // ⑤ 置信度分布
      const confDist = [
        { label: 'P-1 企业实测', count: list.filter(x => x.level === '' && x.isPrimary).length, color: '#15803d' },
        { label: 'P0 企业记忆', count: 0, color: '#0369a1' },
        { label: '规则表命中', count: list.filter(x => x.key === 'EF' && x.level === '').length, color: '#7c3aed' },
        { label: '兜底缺省', count: list.filter(x => x.key === 'EF' && x.level !== '').length, color: '#b45309' }
      ]

      // ⑥ 时效性
      const ageInfo = {
        dataYear: this.baselineYear || new Date().getFullYear(),
        dataGap: 0,
        factorVersion: 'IPCC 2006',
        factorGap: 18,
        factorLevel: 'warn'
      }

      // ⑦ 低质量项
      const lowQuality = list.filter(x => x.level === 'warn' || x.level === 'block')
        .sort((a, b) => b.emission - a.emission)
        .slice(0, 20)
        .map(x => ({ proc: x.proc, unit: x.unit, key: x.key, level: x.level, emission: x.emission }))

      return {
        total, dqrDist,
        weightedScore: ws.toFixed(2), weightedGrade: wg,
        primaryCount: primary.length, primaryRatio, primaryEmissionRatio,
        sourceCoverage, emissionCoverage,
        confDist, ageInfo, lowQuality
      }
    },

    stageConfirmConfig() {
      const configs = {
        1: { label: '确认边界配置，进入核算模型', icon: 'el-icon-check', hint: '确认边界配置无误后进入核算模型阶段', action: () => this.sendSuggestion('确认边界配置') },
        2: { label: '确认清单，启动数据收集', icon: 'el-icon-check', hint: '确认核算清单无误后启动数据收集', action: () => this.sendSuggestion('确认模型，启动数据收集') },
        3: { label: '确认数据，进入因子匹配', icon: 'el-icon-right', hint: '确认活动数据无误后进入排放因子匹配', action: () => this.sendSuggestion('确认数据，进入因子匹配') },
        4: { label: '确认因子，进入数据校验', icon: 'el-icon-right', hint: '确认因子匹配结果后进入数据校验', action: () => this.sendSuggestion('确认因子，进入数据校验') },
        5: this.validationActiveTab === 'activity'
          ? { label: '确认调整，重新校核', icon: 'el-icon-refresh-right', hint: '数据调整完成后重新进入「数据采集→因子匹配→数据校验」循环', action: () => this.confirmActivityData() }
          : null,
        6: { label: '进入排放分析', icon: 'el-icon-data-analysis', hint: '查看排放量计算结果并进入分析阶段', action: () => this.sendSuggestion('进入排放分析') },
        7: { label: '生成排放报告', icon: 'el-icon-document', hint: '排放分析已全部完成，生成碳排放核算报告', action: () => this.sendSuggestion('导出排放报告') }
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
    formattedTokens() {
      const t = this.estimatedTokens
      if (t >= 10000) return (t / 10000).toFixed(1) + '万 tokens'
      if (t >= 1000) return (t / 1000).toFixed(1) + 'k tokens'
      return t + ' tokens'
    },
    // 当前选中标准的完整配置
    selectedStandardConfig() {
      const list = this.standards || []
      return list.find(s => s.code === this.selectedStandard) || list[0] || null
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
    dqrDimsText() {
      const cfg = this.selectedStandardConfig
      const arr = (cfg && cfg.dataSchema && cfg.dataSchema.dqrDimensions) || []
      return arr.join('、') || '—'
    },
    factorPriorityText() {
      const cfg = this.selectedStandardConfig
      const arr = (cfg && cfg.factorPriority) || []
      return arr.join(' > ') || '—'
    },
    completenessThreshold() {
      const cfg = this.selectedStandardConfig
      return (cfg && cfg.validationRules && cfg.validationRules.completenessThreshold) || 95
    },
    dqrScoreThreshold() {
      const cfg = this.selectedStandardConfig
      return (cfg && cfg.validationRules && cfg.validationRules.dqrScoreThreshold) || 3
    },
    reportTemplateLabel() {
      const cfg = this.selectedStandardConfig
      const t = cfg && cfg.reportTemplate
      const map = { '环境足迹-DECLARATION': '环境足迹 环境足迹声明', 'qct-1248': 'QC/T 1248 核算报告' }
      return map[t] || t || '—'
    },
    /** 组织碳核算标准解析区块（按选中标准的结构化参数动态生成） */
    orgParsingBlocks() {
      const cfg = this.selectedStandardConfig || {}
      const esc = v => String(v == null ? '' : v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const blocks = []

      // ① 适用范围与边界
      const sr = cfg.scopeRule
      if (sr && (sr.boundary || sr.scope)) {
        let h = ''
        if (sr.boundary) h += '<p>组织边界：<b>' + esc(sr.boundary) + '</b></p>'
        if (sr.scope) h += '<p>核算范围：' + esc(sr.scope) + '</p>'
        blocks.push({ key: 'scope', icon: 'scope-icon', title: '适用范围与边界', html: h })
      }

      // ② 排放源分类
      const im = cfg.indicatorMapping
      if (im && (im.note || im.mode)) {
        let h = ''
        if (im.note) h += '<p>' + esc(im.note) + '</p>'
        blocks.push({ key: 'category', icon: 'boundary-icon', title: '排放源分类', html: h })
      }

      // ③ 量化方法
      const cr = cfg.calcRule
      if (cr && (cr.method || cr.formula || cr.standard)) {
        let h = ''
        if (cr.method) h += '<p>核算方法：<b>' + esc(cr.method) + '</b></p>'
        if (cr.formula) h += '<p>计算公式：<code>' + esc(cr.formula) + '</code></p>'
        if (cr.indirect !== undefined) h += '<p>间接排放：' + (cr.indirect ? '纳入核算' : '不纳入') + '</p>'
        if (cr.standard) h += '<p>衔接口径：' + esc(cr.standard) + '</p>'
        blocks.push({ key: 'calc', icon: 'scope-icon', title: '量化方法', html: h })
      }

      // ④ 数据与质量要求
      const g = cfg.granularity
      const dq = cfg.dataQuality
      if (g || dq) {
        let h = ''
        if (g) {
          if (g.time) h += '<p>时间粒度：' + esc(g.time) + '</p>'
          if (g.space) h += '<p>空间粒度：' + esc(g.space) + '</p>'
        }
        if (dq) {
          if (dq.requireVoucher) h += '<p>凭证要求：活动数据须留存原始凭证，可追溯至台账</p>'
          if (dq.traceLevel) h += '<p>溯源层级：<b>' + esc(dq.traceLevel) + ' 级</b></p>'
          if (dq.uncertainty) h += '<p>不确定性：须量化并报告（蒙特卡洛或误差传播法）</p>'
        }
        blocks.push({ key: 'data', icon: 'scope-icon', title: '数据与质量要求', html: h })
      }

      // ⑤ 排放源 → 数据源 → 因子 映射
      const maps = cfg.mappings || []
      if (maps.length) {
        const rows = maps.map(m => '<li><b>' + esc(m.indicator) + '</b>：'
          + esc(m.dataSource) + ' × ' + esc(m.factorCategory || '排放因子')
          + (m.formula ? '（' + esc(m.formula) + '）' : '') + '</li>').join('')
        blocks.push({
          key: 'mapping', icon: 'boundary-icon', title: '排放源与数据映射',
          html: '<ul style="margin:0;padding-left:18px;line-height:1.95;">' + rows + '</ul>'
        })
      }

      // ⑥ 依据条款
      const refs = cfg.clauseRefs || []
      if (refs.length) {
        const items = refs.slice(0, 8).map(r => '<li>' + esc(r) + '</li>').join('')
        blocks.push({
          key: 'clause', icon: 'scope-icon', title: '依据条款',
          html: '<ul style="margin:0;padding-left:18px;line-height:1.9;">' + items + '</ul>'
        })
      }

      return blocks
    },
    stdBoundary() {
      const cfg = this.selectedStandardConfig
      return (cfg && cfg.boundaryTemplate) || {}
    },
    standardsWithSelection() {
      // 按任务类型初筛：风机任务剔除汽车行业专属标准 GHG Protocol（通用核算标准保留）
      let list = this.standards
      if (this.isWindTask()) {
        list = list.filter(std => std.code !== 'GHG Protocol')
      }
      return list.map(std => ({
        ...std,
        active: std.code === this.selectedStandard
      }))
    },
    /** 核算清单树：范围 → 大类 → 排放源（按阶段2 核算范围过滤） */
    modelTree() {
      const NAMES = {
        scope1: '范围1 · 直接排放',
        scope2: '范围2 · 外购能源间接排放',
        scope3: '范围3 · 价值链间接排放'
      }
      const ORDER = ['scope1', 'scope2', 'scope3']
      const range = (this.boundaryConfig && this.boundaryConfig.unitType) || 'scope12'
      const allow = range === 'scope12' ? ['scope1', 'scope2'] : ORDER
      return allow.map(k => ({
        key: k,
        name: NAMES[k],
        categories: (this.modelStages || []).filter(s => s.scope === k)
      })).filter(s => s.categories.length > 0)
    },
    /** 各大类的标准排放源枚举（扩展时在此追加） */
    stdProcesses() {
      return {
        fuel: [
          { name: '燃煤', formula: '消耗量 × 低位发热量 × 单位热值含碳量 × 碳氧化率 × 44/12' },
          { name: '天然气', formula: '消耗量 × 低位发热量 × 单位热值含碳量 × 碳氧化率 × 44/12' },
          { name: '柴油', formula: '消耗量 × 低位发热量 × 单位热值含碳量 × 碳氧化率 × 44/12' },
          { name: '汽油', formula: '消耗量 × 低位发热量 × 单位热值含碳量 × 碳氧化率 × 44/12' },
          { name: '燃料油', formula: '消耗量 × 低位发热量 × 单位热值含碳量 × 碳氧化率 × 44/12' },
          { name: '焦炭', formula: '消耗量 × 低位发热量 × 单位热值含碳量 × 碳氧化率 × 44/12' }
        ],
        process: [
          { name: '化学反应过程', formula: '原材料消耗量 × 工艺排放因子' },
          { name: '金属冶炼', formula: '产量 × 工艺排放因子' },
          { name: '水泥熟料生产', formula: '熟料产量 × 工艺排放因子' },
          { name: '化工合成', formula: '产量 × 工艺排放因子' }
        ],
        fugitive: [
          { name: '制冷剂逃逸', formula: '逃逸量 × GWP' },
          { name: '灭火剂逃逸', formula: '逃逸量 × GWP' },
          { name: 'SF6 逃逸', formula: '逃逸量 × GWP' },
          { name: '甲烷逃逸', formula: '逃逸量 × GWP' }
        ],
        energy: [
          { name: '净购入电力', formula: '净购入电量 × 电网排放因子（区域因子 / 市场因子双口径）' },
          { name: '净购入热力（蒸汽）', formula: '净购入热量 × 热力排放因子' },
          { name: '净购入热力（热水）', formula: '净购入热量 × 热力排放因子' },
          { name: '外购冷力', formula: '外购冷量 × 冷力排放因子' }
        ],
        transport: [
          { name: '上游运输与配送', formula: '运输量 × 里程 × 排放因子' },
          { name: '下游运输与配送', formula: '运输量 × 里程 × 排放因子' },
          { name: '员工通勤', formula: '通勤人次 × 里程 × 排放因子' },
          { name: '商务差旅', formula: '差旅量 × 排放因子' }
        ],
        waste: [
          { name: '运营废弃物处理', formula: '废弃物处理量 × 处理方式排放因子' },
          { name: '废水处理', formula: '废水量 × 废水排放因子' },
          { name: '固废填埋', formula: '填埋量 × 填埋排放因子' }
        ],
        valuechain: [
          { name: '外购商品与服务', formula: '采购额 / 用量 × 排放因子' },
          { name: '资本商品', formula: '采购额 × 排放因子' },
          { name: '燃料上游（WTT）', formula: '燃料消耗量 × 上游排放因子' },
          { name: '售出产品加工', formula: '加工量 × 排放因子' },
          { name: '售出产品使用', formula: '使用量 × 排放因子' },
          { name: '售出产品报废处理', formula: '报废量 × 排放因子' }
        ]
      }
    },
    /** 待处理校验项（未解决/未跳过） */
    pendingValidationItems() {
      return (this.validationItems || []).filter(v => v.status !== 'resolved' && v.status !== 'skipped')
    },
    /** 待处理数量 */
    pendingValidationCount() {
      return this.pendingValidationItems.length
    },
    /** 台账匹配到的排放单元数（用于阶段3 来源栏） */
    ledgerUnitCount() {
      return this.getEmissionSourceList().length
    },
    boundarySubStepLabels() {
      return ['组织边界', '核算范围', '数据所属期', '排放因子库']
    },
    // 阶段2 全部可编辑，子步骤条仅作导航展示（无高亮）
    boundaryActiveIdx() {
      return -1
    },
    boundaryDisplayStep() {
      return this.boundaryActiveIdx + 1
    },
    lifecycleScopeLabel() {
      const map = { operational: '运营控制权法', financial: '财务控制权法', equity: '股权比例法' }
      return map[this.boundaryConfig.lifecycleScope] || this.boundaryConfig.lifecycleScope
    },
    unitTypeLabel() {
      const map = { scope12: '范围1+2（化石燃料燃烧 + 工业过程 + 外购电力热力）', full: '全口径（含类别1~6）' }
      return map[this.boundaryConfig.unitType] || this.boundaryConfig.unitType
    },
    allocationRuleLabel() {
      const map = { facility: '设施直接归集', dept: '按部门分摊', hq: '总部统一归集' }
      return map[this.boundaryConfig.allocationRule] || this.boundaryConfig.allocationRule
    },
    boundarySummaryItems() {
      const b = this.boundaryConfig
      return [
        { label: '核算范围范围', value: this.lifecycleScopeLabel, set: this.boundarySubStep >= 1 },
        { label: '量化单位', value: this.unitTypeLabel + (b.unitDetail ? '：' + b.unitDetail : ''), set: this.boundarySubStep >= 2 },

        { label: '重要性阈值', value: b.cutoffThreshold + '（单项<' + b.cutoffItemThreshold + '，累计≤' + b.cutoffTotalThreshold + ')', set: this.boundarySubStep >= 4 },
        { label: '时间边界', value: b.timeBoundary, set: this.boundarySubStep >= 5 }
      ]
    },
    carbonFootprintUnitLabel() {
      if (this.isWindTask()) return '台（度电排放量 gCO₂e/kWh）'
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
        // 由 onDateRangeChange 处理
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
        process: '排放量总计',
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
    reportSensitivityData() {
      // 汽配组织碳核算：按实际排放源动态生成（系数 = 该源占比）
      const total = this.totalCarbonEmission || 1
      const list = []
      ;(this.modelStages || []).forEach(stage => {
        ;(stage.processes || []).forEach(proc => {
          const em = this.procEmission(proc)
          if (em > 0) {
            list.push({
              name: proc.name,
              coeff: em / total,          // 敏感度系数 = 该源占总量比例
              baseEmission: em
            })
          }
        })
      })
      list.sort((a, b) => b.coeff - a.coeff)
      return list
    },
    sensitivityImpactData() {
      const ratio = this.sensitivityRatio / 100
      const total = this.totalCarbonEmission || 1
      return this.reportSensitivityData.map(item => {
        const coeff = Number(item.coeff) || 0
        const base = Number(item.baseEmission) || 0
        const impactVal = coeff * base * ratio
        const impactPct = Math.abs(impactVal) / total * 100
        return {
          ...item,
          coeff: Number(coeff.toFixed(4)),
          baseEmission: Math.round(base),
          impactValue: Math.round(impactVal * 10) / 10,
          impactPct: Number(impactPct.toFixed(2)),
          barWidth: Math.min(impactPct * 5, 100)
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
            { label: '总排放总量', value: this.formatEmission(total), unit: 'tCO₂e', cls: '', sub: '' },
            { label: '度电排放量', value: `≈ ${this.degreeEmission}`, unit: 'gCO₂e/kWh', cls: '', sub: '' },
            { label: '同比变化', value: '↓ 1.9%', sub: '减排5.8万kg', cls: 'down-color' },
            { label: '回收钢抵扣率', value: '88%', sub: '较上期+2%', cls: 'up-color' }
          ],
          yoyTitle: '排放源同比基准期对比',
          yoyRows: mkYoy([-4.8, -1.2, 2.1, -3.2, 0.6]),
          momTitle: '排放源环比上期波动排行榜',
          momRows: [
            { proc: '叶片制造固化挥发物收集效率提升', change: '↓ 5.4% 🟢', cls: 'down-color' },
            { proc: '吊装施工机械柴油优化', change: '↓ 1.5% 🟢', cls: 'down-color' },
            { proc: '稀土采选冶因子版本更新', change: '↑ 1.2% 🔴', cls: 'up-color' }
          ],
          conclusionText: '原材料生产环节为核算范围内最大排放来源（占正排放49.3%），叶片玻纤/环氧树脂、塔筒钢材与直驱发电机稀土永磁材料为主要贡献；风场建设安装环节次之（占40.1%），基础混凝土与吊装施工柴油影响显著；零部件加工（3.0%）、大件运输（2.7%）与运营维护（2.4%）占比较低，范围3·价值链间接钢/铜回收抵扣显著降低净排放。',
          routineSugs: [
            { title: '原材料生产环节为核算范围内首要热点，应作为减排核心抓手', text: '原材料生产环节占正排放的49.3%，叶片玻纤/环氧树脂、塔筒钢材与发电机钕铁硼永磁材料是主要来源。建议：一是与叶片供应商协同推进大丝束玻纤与生物基环氧树脂应用；二是评估中速永磁等技术路线以降低稀土用量；三是将碳排放要求纳入材料采购合同条款，推动供应链整体减碳。该环节减排投入产出比最高，建议作为近期减排规划的优先领域。' },
            { title: '风场建设安装阶段的混凝土与施工能耗优化空间显著', text: '风场建设安装环节占正排放的40.1%，风机基础混凝土、集电线路混凝土与吊装施工机械柴油是主要排放源。建议优化基础结构设计以降低混凝土用量，探索低碳水泥与粉煤灰掺合料替代；施工环节可通过机械化方案优化与新能源施工机械试点降低柴油消耗，并优先选择运输半径内的部件供应基地以缩短大件运输距离。' },
            { title: '运营维护环节备件与润滑油管理影响长期排放量', text: '20年运营维护期内齿轮箱润滑油更换与备件更换是主要排放来源（占正排放2.4%，占比最低但随寿命累积）。建议建立备件寿命预测与预防性维护体系，延长关键部件更换周期；优先选用长寿命润滑油并规范废油回收处置，减少运维期排放的同时降低度电排放量。' },
            { title: '范围3·价值链间接提升叶片回收率，保障回收抵扣数据质量', text: '范围3·价值链间接钢材/铜回收抵扣显著降低核算范围内排放量，但废玻纤叶片处置仍是行业难点。建议跟踪玻纤回收（水泥窑协同/热解回收）技术进展，与专业回收服务商建立合作；同时完善回收钢铜的计量与台账管理，确保回收抵扣数据可审计，支撑度电排放量持续下降。' }
          ],
          uncSources: [
            { name: '稀土采选冶因子波动', badge: '高影响', cls: 'unc-high', pct: '贡献 28.4%', detail: '钕铁硼永磁材料6,000kg，稀土采选冶因子18.6 tCO₂e/kg受矿源品位与分离工艺影响±15%，影响±16,700 tCO₂e，是当前首要不确定度来源' },
            { name: '电网排放因子（企业不可控）', badge: '仅参考', cls: 'unc-low', pct: '贡献 27.1%', detail: '零部件制造与施工用电合计422,000kWh，电网排放因子随全国电网结构演进年际波动±5%，影响±5,100 tCO₂e。该因素属外部参数，企业无法直接控制，仅供核算参考' },
            { name: '废玻纤处置因子数据质量', badge: '中影响', cls: 'unc-med', pct: '贡献 16.2%', detail: '废玻纤叶片135,000kg处置因子引用Ecoinvent国外数据库，地理代表性偏差±20%，影响±9,500 tCO₂e' },
            { name: '年发电小时数取值偏差', badge: '中影响', cls: 'unc-med', pct: '贡献 15.6%', detail: '年发电小时数取4,200h为可研值，SCADA实测存在±3%年际波动，直接影响度电排放量分母（度电值波动±0.17 gCO₂e/kWh）' }
          ],
          uncSugs: [
            { title: '核实稀土永磁材料因子取值，降低原材料端不确定度', text: '钕铁硼稀土采选冶因子为当前最大不确定度来源。建议向发电机供应商索取稀土原料溯源清单与实测因子数据，必要时委托第三方开展稀土供应链LCA评估，通过提高实测数据比例有效收窄原材料阶段核算波动范围。' },
            { title: '跟踪国内风电叶片回收处置因子发布动态', text: '废玻纤叶片处置因子当前依赖国际数据库，地理代表性存在偏差。建议关注国内风电叶片回收处置因子与行业LCA数据库发布进展，及时替换为本土因子，提升范围3·价值链间接数据代表性。' },
            { title: '以SCADA实测数据滚动修正发电量参数', text: '年发电小时数是度电排放量的关键分母。建议建立投运后SCADA实测数据的年度滚动修正机制，以实测均值替代可研假设值，持续降低使用阶段参数不确定性。' },
            { title: '当前不确定度水平满足标准要求，建议持续优化数据质量', text: '当前核算的不确定度在标准可接受范围内。如需对外披露或申请碳标签认证，建议进一步提升活动数据和排放因子的实测比例，逐步降低对数据库默认值的依赖，将数据质量提升纳入企业碳管理工作计划。' }
          ],
          sensSugs: [
            { pri: 'P1', cls: 'sug-priority-1', numCls: 'pri-1', title: '发电小时数与发电量提升 (敏感度 -0.91) — 度电分母端首要杠杆', text: '度电排放量以核算范围内发电量为分母，对年发电小时数最为敏感（小时数+10%对应度电约-9%）。建议在风场规划阶段强化测风与微观选址优化，选用高容量系数机型；运维期通过智能提效改造（偏航校正/叶片气动附件）提升可利用率，以更高的实际发电量摊薄单位电量排放量。', kpis: ['方向：发电量提升', '策略：选址优化 + 智能提效', '优先级：最高'] },
            { pri: 'P2', cls: 'sug-priority-2', numCls: 'pri-2', title: '稀土永磁材料碳因子优化 (敏感度 +0.46) — 材料端首要减排方向', text: '稀土采选冶因子对核算范围内排放影响最大，主要受矿源与分离工艺电力来源影响。建议在发电机采购中优先选择稀土供应链碳数据透明的供应商，评估中速永磁等低重稀土技术路线，必要时通过多供应商竞争获取更优低碳方案。该方向通过采购策略调整即可推进，实施门槛较低。', kpis: ['方向：稀土供应链低碳化', '策略：供应商选择 + 技术路线评估', '优先级：高'] },
            { pri: 'P3', cls: 'sug-priority-3', numCls: 'pri-3', title: '回收钢抵扣率提升 (敏感度 -0.24) — 末端减排路径', text: '范围3·价值链间接钢材/铜回收抵扣对核算范围内结果有显著负向影响。建议完善退役机组回收拆解流程与计量台账，提升材料回收率与回收数据质量；跟踪叶片玻纤热解回收等新技术产业化进展，逐步扩大可抵扣回收材料范围，从末端持续降低排放量。', kpis: ['方向：回收率与数据质量', '策略：拆解优化 + 台账完善', '优先级：较高'] },
            { pri: 'P4', cls: 'sug-priority-4', numCls: 'pri-4', title: '制造与施工用电清洁化 — 绿电替代方向', text: '零部件制造与施工用电的电网排放因子为重要可控相关参数。建议叶片/机舱/塔筒生产基地逐步提高绿电使用比例（绿电直购或分布式光伏），施工环节优先接入当地绿电或采用储能供电，降低制造与建设环节的碳排放强度。', kpis: ['方向：绿电替代', '策略：绿电采购 + 施工供电优化', '优先级：持续推进'] }
          ],
          sensSummary: 'P1 从发电量分母端摊薄度电排放量（敏感度最高）；P2 聚焦稀土供应链碳数据透明化与低稀土技术路线；P3 提升回收抵扣率与数据质量；P4 推进制造与施工绿电替代。四项方向均聚焦企业可控环节，建议结合自身资源禀赋分阶段实施。'
        }
      }
      // ===== 汽配组织碳核算：按实际排放源计算 =====
      const procList = []
      ;(this.modelStages || []).forEach(stage => {
        ;(stage.processes || []).forEach(proc => {
          const em = this.procEmission(proc)
          if (em > 0) procList.push({ name: proc.name, emission: em, stage: stage.title })
        })
      })
      procList.sort((a, b) => b.emission - a.emission)
      const top1 = procList[0] || { name: '—', emission: 0 }
      const top2 = procList[1] || { name: '—', emission: 0 }
      const top3 = procList[2] || { name: '—', emission: 0 }
      const pct = (v) => total ? (v / total * 100).toFixed(1) : '0.0'

      // 同比（演示：各范围 ±2% 内波动）
      const yoyRates = [-2.1, -0.8, 1.2]
      const yoyRows = stages.map((s, i) => {
        const rate = yoyRates[i] || 0
        const curr = s.emission
        const prev = curr / (1 + rate / 100)
        return {
          name: s.name,
          rate: rate,
          rateCls: rate > 0 ? 'up-color' : 'down-color',
          rateText: (rate > 0 ? '↑ ' : '↓ ') + Math.abs(rate).toFixed(1) + '%',
          currText: this.formatEmission(curr) + ' tCO₂e',
          prevText: this.formatEmission(prev) + ' tCO₂e',
          currWidth: Math.max(Math.min(curr / total * 100, 100), 2) + '%',
          prevWidth: Math.max(Math.min(prev / total * 100, 100), 2) + '%',
          maxVal: Math.max(curr, prev)
        }
      })

      // 环比（按排放源实际占比排序）
      const momRows = procList.slice(0, 3).map((p, i) => {
        const chg = [1.5, -1.2, 0.8][i] || 0
        return {
          proc: p.name + '（占 ' + pct(p.emission) + '%）',
          change: (chg > 0 ? '↑ ' : '↓ ') + Math.abs(chg).toFixed(1) + '%',
          cls: chg > 0 ? 'up-color' : 'down-color'
        }
      })

      return {
        kpis: [
          { label: '总排放总量', value: this.formatEmission(total), unit: 'tCO₂e', cls: '', sub: '' },
          { label: '同比变化', value: '↓ 2.1%', sub: '较上年改善', cls: 'down-color' },
          { label: '环比变化', value: '↓ 0.8%', sub: '较上期改善', cls: 'down-color' },
          { label: '范围2 占比', value: pct(stages[1] ? stages[1].emission : 0) + '%', sub: '外购能源间接', cls: '' }
        ],
        yoyTitle: '范围排放量同比基准期对比',
        yoyRows: yoyRows,
        momTitle: '排放源环比上期波动排行榜',
        momRows: momRows,
        conclusionText: '按 DB11/T 1787（二氧化碳为主）核算的排放总量为 ' + this.formatEmission(total) + ' tCO₂e。' + top1.name + ' 为最大排放源（占 ' + pct(top1.emission) + '%），' + top2.name + '（占 ' + pct(top2.emission) + '%）与 ' + top3.name + '（占 ' + pct(top3.emission) + '%）次之。范围1（化石燃料燃烧与逸散）占比 ' + pct(stages[0] ? stages[0].emission : 0) + '%，范围2（外购电力热力）占比 ' + pct(stages[1] ? stages[1].emission : 0) + '%，范围3（价值链间接）占比 ' + pct(stages[2] ? stages[2].emission : 0) + '%。减排重点应聚焦 ' + top1.name + ' 与 ' + top2.name + '。',
        routineSugs: [
          { title: top1.name + ' 为首要减排热点，应作为核心抓手', text: top1.name + ' 排放 ' + this.formatEmission(top1.emission) + ' tCO₂e，占总量 ' + pct(top1.emission) + '%。建议：一是核查其活动数据计量准确性，补充结算凭证；二是评估替代能源或工艺优化方案；三是将减排指标纳入能源管理体系考核。' },
          { title: top2.name + ' 占 ' + pct(top2.emission) + '%，具备优化空间', text: top2.name + ' 排放 ' + this.formatEmission(top2.emission) + ' tCO₂e。建议核对活动数据与排放因子的匹配口径，优先采用区域电网因子或企业实测因子，并探索绿电采购降低间接排放。' },
          { title: '范围3 价值链间接排放需加强供应商协同', text: '范围3 排放 ' + this.formatEmission(stages[2] ? stages[2].emission : 0) + ' tCO₂e，占总量 ' + pct(stages[2] ? stages[2].emission : 0) + '%。建议向主要供应商索取产品碳足迹数据，建立供应商碳排放档案，将低碳要求纳入采购合同条款。' },
          { title: '完善数据质量管理，支撑年度报告与第三方核查', text: '当前部分活动数据来自估算与缺省因子。建议完善能源计量器具配备，提高结算凭证归档率，逐步以实测数据替代估算值，将不确定度控制在国际标准推荐水平以内。' }
        ],
        uncSources: [
          { name: '活动数据（燃料消耗量）计量偏差', badge: '高影响', cls: 'unc-high', pct: '贡献 ' + pct(top1.emission) + '%', detail: '燃料消耗量依赖人工抄表与台账记录，存在计量器具精度与抄表周期差异，是最大的不确定度来源。建议加装在线计量装置并建立月度对账机制。' },
          { name: '电网排放因子（企业不可控）', badge: '仅参考', cls: 'unc-low', pct: '贡献 ' + pct(stages[1] ? stages[1].emission : 0) + '%', detail: '净购入电力采用区域电网平均因子，随电网结构年度变化。建议按市场因子（绿电证书）与区域因子双口径披露。' },
          { name: '排放因子地理代表性', badge: '中影响', cls: 'unc-med', pct: '贡献 15.0%', detail: '部分排放源采用 IPCC 或 GHG Protocol 国际缺省因子，与中国本土因子存在差异。建议优先采用生态环境部发布的行业因子。' },
          { name: '逸散排放估算方法', badge: '中影响', cls: 'unc-med', pct: '贡献 10.0%', detail: '制冷剂与灭火剂逃逸量按补充量估算，缺少设备维保记录支撑。建议建立制冷剂全生命周期台账。' }
        ],
        uncSugs: [
          { title: '完善燃料计量与台账，降低最大不确定度来源', text: '燃料消耗量的计量偏差是当前不确定度的首要来源。建议加装在线流量计或皮带秤，实现自动采集；建立采购、入库、领用、结算四单对账机制，确保活动数据可追溯。' },
          { title: '优先采用本土排放因子，提升地理代表性', text: '建议将当前采用的国际缺省因子替换为生态环境部行业因子或省级电网因子，并在报告中说明因子版本与适用年份，提高核算结果的区域代表性。' },
          { title: '建立制冷剂/灭火剂全生命周期台账', text: '逸散排放按补充量估算，缺少设备级记录。建议对每台空调、灭火器建立充装、回收、检修记录，按物质类型分别核算 GWP 加权排放量。' },
          { title: '当前不确定度水平满足标准要求，建议持续优化', text: '当前核算不确定度处于 GHG Protocol 可接受范围内。如需对外披露或第三方核查，建议进一步提升实测比例，将不确定度降至 ±5% 以内。' }
        ],
        sensSugs: [
          { pri: 'P1', cls: 'sug-priority-1', numCls: 'pri-1', title: top1.name + ' 排放因子敏感度最高 — 数据质量优先', text: top1.name + ' 占总量 ' + pct(top1.emission) + '%，其排放因子每变动 10%，总量变动约 ' + pct(top1.emission * 0.1) + '。建议优先核对该排放源因子的适用性（燃料类型、低位发热量、含碳量），并留存因子出处文件。' },
          { pri: 'P2', cls: 'sug-priority-2', numCls: 'pri-2', title: top2.name + ' 活动数据敏感度高 — 计量准确性关键', text: top2.name + ' 占总量 ' + pct(top2.emission) + '%。建议提高该排放源活动数据的计量精度与抄表频次，减少估算比例。' },
          { pri: 'P3', cls: 'sug-priority-3', numCls: 'pri-3', title: '范围2 绿电替代 — 结构性减排路径', text: '外购电力排放 ' + this.formatEmission(stages[1] ? stages[1].emission : 0) + ' tCO₂e，通过绿电采购或自建光伏可将市场因子降至接近零，是确定性最高的减排路径。建议评估 PPA（购电协议）与分布式光伏的可行性。' },
          { pri: 'P4', cls: 'sug-priority-4', numCls: 'pri-4', title: '范围3 供应商协同 — 长期减排方向', text: '范围3 排放占比 ' + pct(stages[2] ? stages[2].emission : 0) + '%，减排依赖供应链协同。建议建立供应商碳绩效评价体系，优先选择提供产品碳足迹数据的供应商。' }
        ]
      }

    },
    // ===== 阶段九·报告叙述性内容（按任务画像切换） =====
    reportProfile() {
      if (this.isWindTask()) {
        return {
          coverTitle: (this.currentEnterprise || '本企业') + ' 年度二氧化碳排放核算报告',
          product: (this.currentEnterprise || '本企业'),
          model: 'EN-171/6.5',
          lifeDesc: '核算边界为本企业法人边界，覆盖范围1（直接排放）、范围2（间接排放）与范围3（价值链排放）。',
          dqrConclusion: '本次碳排放核算结果整体不确定度为 ±11.6%（95%置信度），变异系数 6.0%，处于较低水平。蒙特卡洛模拟（N=10,000）表明排放总量在 ' + this.confidenceIntervalText + ' tCO₂e 区间内波动，结果稳定可靠，满足 GB/T 32150-2025 对数据质量的要求。主要不确定度来源为稀土采选冶因子的行业研究数据偏差，建议向供应商核实实际取值以进一步收窄不确定度区间。',
          ch7Desc: '在企业可控排放范围内，年发电小时数敏感度 -0.91 为度电排放量分母端首要杠杆，稀土采选冶因子 +0.46 为材料端减排热点，回收钢抵扣 -0.24 为末端减排路径。优化发电量、提升稀土供应链碳数据透明度与完善回收管理为最有效的可控减排路径。',
          degreeText: `折算度电排放量 ≈ ${this.degreeEmission} gCO₂e/kWh`,
          degreeSubText: '核算范围内发电量 5.46亿 kWh（6.5MW × 4200h × 20年）',
          complianceText: '本报告严格遵循 ' + this.selectedStandard + ' 规范编制，数据来源可追溯、计算逻辑可审计、结果可复现，满足度电排放量（gCO₂e/kWh）量化与披露要求。'
        }
      }
        return {
          coverTitle: (this.currentEnterprise || '本企业') + ' 年度二氧化碳排放核算报告',
          product: (this.currentEnterprise || '本企业'),
          model: '重点碳排放单位 · 其他行业（DB11/T 1787）',
          lifeDesc: '核算边界为本企业法人边界（运营控制权法），核算范围覆盖化石燃料燃烧排放、工业生产过程排放与外购电力热力隐含排放（DB11/T 1787 口径，二氧化碳为主）。核算期：' + (typeof this.periodText === 'function' ? this.periodText() : (this.periodText || '2025-01-01 ~ 2025-12-31')) + '。',
          dqrConclusion: '本次核算采用误差传播法量化不确定性：综合不确定度 ' + (this.uncertaintyRangeText || '±3.2%') + '（活动数据 ±5%、排放因子 ±3%，95% 置信度），95% 置信区间 ' + (this.confidenceIntervalText || '[ — ]') + ' tCO₂e，满足 DB11/T 1787 与北京市碳排放权交易管理办法对报告数据质量的要求。',
          ch7Desc: (() => {
            const sens = this.sensitivityImpactData || []
            const s1 = sens[0] || { name: '—', coeff: 0 }
            const s2 = sens[1] || { name: '—', coeff: 0 }
            const s3 = sens[2] || { name: '—', coeff: 0 }
            return '在企业可控排放范围内，' + s1.name + '（敏感度 +' + Number(s1.coeff).toFixed(3) + '）为首要减排热点，' + s2.name + '（+' + Number(s2.coeff).toFixed(3) + '）、' + s3.name + '（+' + Number(s3.coeff).toFixed(3) + '）次之。优先提升高占比排放源的数据质量，并探索绿电替代与能源结构优化，为企业最有效的可控减排路径。'
          })(),
          complianceText: '本报告严格按照 DB11/T 1787《二氧化碳排放核算和报告要求（其他行业）》及《北京市碳排放权交易管理办法》编制，数据来源可追溯、计算逻辑可审计、结果可复现，可用于年度报告与第三方核查。'
        }
    },
    emissionTreeData() {
      const SCOPE_NAMES = {
        scope1: '范围1 · 直接排放',
        scope2: '范围2 · 外购能源间接排放',
        scope3: '范围3 · 价值链间接排放'
      }
      const scopeMap = { scope1: [], scope2: [], scope3: [] }
      this.modelStages.forEach(stage => {
        let stageTotal = 0
        const stageChildren = []
        
        stage.processes.forEach(proc => {
          let procTotal = 0
          const procChildren = []
          
          // 组织碳核算：按排放单元汇总
          const units = proc.units || []
          if (units.length) {
            units.forEach(u => {
              const val = parseFloat(u.emission) || 0
              procTotal += val
              if (val !== 0) {
                procChildren.push({
                  id: 'item-' + stage.key + '-' + proc.name + '-' + (u.name || ''),
                  name: u.name || proc.name,
                  activityData: (u.activityData || '—') + ' ' + (u.unit || ''),
                  factor: u.factor ? u.factor + ' ' + (u.factorUnit || '') : '—',
                  emission: val,
                  type: 'item'
                })
              }
            })
          } else {
            const val = parseFloat(proc.emission) || 0
            procTotal += val
            if (val !== 0) {
              procChildren.push({
                id: 'item-' + stage.key + '-' + proc.name,
                name: proc.name + '（按排放源）',
                activityData: (proc.activityData || '—') + ' ' + (proc.unit || ''),
                factor: proc.factor ? proc.factor + ' ' + (proc.factorUnit || '') : '—',
                emission: val,
                type: 'item'
              })
            }
          }
          
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
        
        const sc = stage.scope || 'scope1'
        if (!scopeMap[sc]) scopeMap[sc] = []
        scopeMap[sc].push({
          id: 'stage-' + stage.key,
          name: stage.title,
          type: 'stage',
          emission: stageTotal,
          children: stageChildren
        })
      })
      // 按范围组装（4 层：范围 → 大类 → 排放源 → 排放单元）
      return ['scope1', 'scope2', 'scope3'].map(sc => {
        const stages = scopeMap[sc] || []
        if (!stages.length) return null
        const total = stages.reduce((a, x) => a + x.emission, 0)
        return {
          id: 'scope-' + sc,
          name: SCOPE_NAMES[sc],
          type: 'scope',
          emission: total,
          children: stages
        }
      }).filter(Boolean)
    },
    totalCarbonEmission() {
      return this.emissionTreeData.reduce((sum, stage) => sum + stage.emission, 0)
    },
    // 风机任务：度电排放量折算值（核算范围内发电量 = 6.5MW × 4200h × 20年 = 5.46亿 kWh）
    degreeEmission() {
      return (this.totalCarbonEmission / 546000000 * 1000).toFixed(2)
    },

    // 蒙特卡洛直方图模拟数据（动态生成，CV恒定5.94%）
    monteCarloBins() {
      const mu = this.totalCarbonEmission
      const sigma = mu * this.calcTotalRelativeUncertainty()
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
      const sigma = mu * this.calcTotalRelativeUncertainty()
      const N = this.uncertaintyParams.sampleSize
      const binWidth = sigma * 0.5
      return this.monteCarloBins.map(b => {
        const z = (b.center - mu) / sigma
        const pdf = Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI))
        return [b.center, Math.round(pdf * N * binWidth)]
      })
    },
    /** 参数不确定度贡献分解（误差传播） */
    uncParamContrib() {
      const AD_UNC = 0.05
      const EF_UNC = 0.03
      const list = []
      let totalVar = 0
      ;(this.modelStages || []).forEach(stage => {
        ;(stage.processes || []).forEach(proc => {
          const em = this.procEmission(proc)
          if (!em) return
          const adVar = Math.pow(em * AD_UNC, 2)
          const efVar = Math.pow(em * EF_UNC, 2)
          list.push({ name: proc.name + ' · 活动数据', uncPct: 5, variance: adVar })
          list.push({ name: proc.name + ' · 排放因子', uncPct: 3, variance: efVar })
          totalVar += adVar + efVar
        })
      })
      if (!totalVar) return []
      list.sort((a, b) => b.variance - a.variance)
      const top = list.slice(0, 6)
      const maxShare = top.length ? (top[0].variance / totalVar) : 1
      return top.map(x => ({
        name: x.name,
        uncPct: x.uncPct,
        sharePct: (x.variance / totalVar * 100).toFixed(1),
        barWidth: Math.max(x.variance / maxShare * 100, 3) + '%'
      }))
    },
    /** 数据完整度（已确认参数占比） */
    dataCompleteness() {
      let total = 0
      let confirmed = 0
      ;(this.modelStages || []).forEach(stage => {
        ;(stage.processes || []).forEach(proc => {
          ;(proc.units || []).forEach(u => {
            ;(u.params || []).forEach(p => {
              total++
              if (p.verified) confirmed++
            })
          })
        })
      })
      return total ? Math.round(confirmed / total * 100) : 100
    },
    /** 范围构成明细表 */
    routineScopeTable() {
      const colors = ['#0067fe', '#722ed1', '#13c2c2']
      const yoys = [-2.1, -0.8, 1.2]
      const total = this.totalCarbonEmission || 1
      return (this.emissionTreeData || []).map((s, i) => ({
        name: s.name,
        value: Math.round(s.emission),
        pct: (s.emission / total * 100).toFixed(1),
        yoy: yoys[i] || 0,
        color: colors[i] || '#909399'
      }))
    },
    /** 排放源排行榜（按排放量降序） */
    routineRanking() {
      const total = this.totalCarbonEmission || 1
      const list = []
      ;(this.emissionTreeData || []).forEach(scope => {
        ;(scope.children || []).forEach(stage => {
          ;(stage.children || []).forEach(proc => {
            list.push({ name: proc.name, emission: proc.emission })
          })
        })
      })
      list.sort((a, b) => b.emission - a.emission)
      const max = list.length ? list[0].emission : 1
      return list.slice(0, 8).map(x => ({
        name: x.name,
        emission: x.emission,
        pct: (x.emission / total * 100).toFixed(1),
        width: Math.max(x.emission / max * 100, 2) + '%'
      }))
    },
    uncertaintyRangeText() {
      const rel = this.calcTotalRelativeUncertainty ? this.calcTotalRelativeUncertainty() : 0
      return '+' + (rel * 100).toFixed(1) + '%'
    },
    confidenceIntervalText() {
      const r = this.calcUncertaintyRange ? this.calcUncertaintyRange() : { lower: 0, upper: 0 }
      return '[ ' + (r.lower || 0).toLocaleString() + ' ~ ' + (r.upper || 0).toLocaleString() + ' ]'
    },
  },

  methods: {
    /** 按阶段过滤参数：阶段4（活动数据）只显示 AD，其余阶段显示全部 */
    paramsForStep(u) {
      const list = (u && u.params) || []
      // 阶段4（活动数据）只关注 AD；阶段5（排放因子）只关注 EF
      if (this.currentStepIndex === 3) {
        return list.filter(p => p.key === 'AD')
      }
      if (this.currentStepIndex === 4) {
        return list.filter(p => p.key === 'EF')
      }
      return list
    },

    validateParam(proc, unit, p) {
      if (!p) return { level: '', issues: [] }
      const issues = []
      const val = p.value
      const num = parseFloat(val)
      const hasVal = val !== undefined && val !== null && String(val).trim() !== ''
      const key = p.key || ''

      // ===== A 类：完整性 =====
      if (!hasVal) {
        issues.push({ level: 'block', code: 'A-1', msg: '活动数据未填写' })
      } else {
        // 来源 / 佐证材料二选一，有一个即可
        if (!p.source && !p.proof) {
          issues.push({ level: 'warn', code: 'A-2', msg: '未填写数据来源或佐证材料，无法追溯' })
        }
        if (!p.unit) issues.push({ level: 'block', code: 'A-4', msg: '活动数据缺少单位' })
      }

      // ===== B 类：合理性 =====
      if (hasVal) {
        if (isNaN(num)) {
          issues.push({ level: 'block', code: 'B-0', msg: '数值格式无效' })
        } else {
          if (num <= 0) issues.push({ level: 'block', code: 'B-1', msg: '活动数据必须大于 0' })
          // B-2 量级检查（简化：超 1e9 视为可疑）
          if (num > 1e9) issues.push({ level: 'warn', code: 'B-2', msg: '数值过大，请确认单位是否正确' })
          // B-4 精度
          const dec = (String(val).split('.')[1] || '').length
          if (dec > 4) issues.push({ level: 'hint', code: 'B-4', msg: '数值精度过高，建议保留 2 位小数' })
          // B-5 原始值偏差
          const raw = parseFloat(p.rawValue)
          if (!isNaN(raw) && raw > 0) {
            const diff = Math.abs(raw - num) / raw
            if (diff > 0.05) {
              issues.push({ level: 'warn', code: 'B-5', msg: '原始值与当前值偏差 ' + (diff * 100).toFixed(1) + '%，请确认换算' })
            }
          }
          // B-6 换算系数无说明
          if (p.convertFactor && String(p.convertFactor) !== '1' && !p.convertNote) {
            issues.push({ level: 'hint', code: 'B-6', msg: '发生了单位换算，建议补充换算说明' })
          }
        }
      }

      // ===== C 类：一致性 =====
      if (hasVal && !isNaN(num)) {
        // C-1 同期同类项重复
        const units = (proc && proc.units) || []
        const sameVals = units.filter(u => {
          const q = (u.params || []).find(x => x.key === key)
          return q && String(q.value) === String(val)
        })
        if (sameVals.length > 1) {
          issues.push({ level: 'warn', code: 'C-1', msg: '同一排放源下有 ' + sameVals.length + ' 个单元数值相同，请确认是否重复' })
        }
      }

      // 汇总级别（取最严重）
      const order = { block: 3, warn: 2, hint: 1 }
      let level = ''
      issues.forEach(i => {
        if (!level || order[i.level] > order[level]) level = i.level
      })

      return { level, issues }
    },

    /** 参数行 class（用于背景色） */
    paramRowClass(proc, unit, p) {
      const r = this.validateParam(proc, unit, p)
      const cls = {}
      if (r.level === 'block') cls['has-block'] = true
      else if (r.level === 'warn') cls['has-warn'] = true
      else if (r.level === 'hint') cls['has-hint'] = true
      // 待确认（有值但未确认）
      if (p && p.value && !p.verified) cls['is-pending-confirm'] = true
      return cls
    },

    /** 参数问题图标样式类 */
    paramIssueClass(proc, unit, p) {
      const r = this.validateParam(proc, unit, p)
      if (r.level === 'block') return 'is-block'
      if (r.level === 'warn') return 'is-warn'
      if (r.level === 'hint') return 'is-hint'
      return ''
    },

    /** 参数行问题提示文本 */
    paramIssueTip(proc, unit, p) {
      const r = this.validateParam(proc, unit, p)
      if (!r.issues.length) return ''
      return r.issues.map(i => '【' + i.code + '】' + i.msg).join('\n')
    },

    /** 汇总表：判断排放源下所有单元的某参数是否有值 */
    procHasValue(proc, key) {
      const units = (proc && proc.units) || []
      for (let i = 0; i < units.length; i++) {
        const p = (units[i].params || []).find(x => x.key === key)
        if (p && p.value && String(p.value).trim() !== '') return true
      }
      // 若无 units，退化为聚合字段
      if (!units.length) {
        return key === 'AD' ? !!proc.activityData : !!proc.factor
      }
      return false
    },

    /** 汇总表：判断排放源下所有单元的某参数是否全部已确认 */
    procIsVerified(proc, key) {
      const units = (proc && proc.units) || []
      let hasAny = false
      for (let i = 0; i < units.length; i++) {
        const p = (units[i].params || []).find(x => x.key === key)
        if (p && p.value && String(p.value).trim() !== '') {
          hasAny = true
          if (!p.verified) return false
        }
      }
      return hasAny
    },

    /** 汇总表：批量设置确认状态 */
    setProcVerified(proc, key, val) {
      const units = (proc && proc.units) || []
      units.forEach(u => {
        const p = (u.params || []).find(x => x.key === key)
        if (p) this.$set(p, 'verified', val)
      })
      this.$forceUpdate()
    },

    /** 汇总表：取排放源下最严重的校验级别 */
    procIssueLevel(proc, key) {
      const units = (proc && proc.units) || []
      const order = { block: 3, warn: 2, hint: 1 }
      let level = ''
      units.forEach(u => {
        const p = (u.params || []).find(x => x.key === key)
        if (!p) return
        const r = this.validateParam(proc, u, p)
        if (r.level && (!level || order[r.level] > order[level])) level = r.level
      })
      return level
    },

    /** 定位下一个待处理项（循环） */
    locateNextPending() {
      const list = this.pendingItems
      if (!list.length) {
        this.$message.success('全部数据已处理完成')
        this.pendingCursor = 0
        return
      }
      // 循环取下一个
      if (this.pendingCursor >= list.length) this.pendingCursor = 0
      const target = list[this.pendingCursor]
      const idx = this.pendingCursor + 1
      this.pendingCursor = this.pendingCursor + 1

      this.$nextTick(() => {
        const el = document.querySelector('[data-issue-id="' + target.issueId + '"]')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          this.pendingFlashId = target.issueId
          setTimeout(() => { this.pendingFlashId = '' }, 2000)
        }
      })
      this.$message.info('第 ' + idx + ' / ' + list.length + ' 项：' + target.procName + ' · ' + target.unitName + '（' + target.reason + '）')
    },

    /** 判断某参数是否当前高亮 */
    isPendingFlash(proc, unit, key) {
      if (!this.pendingFlashId) return false
      const id = this.paramIssueId ? this.paramIssueId(proc, unit, key) : ('PI-' + proc.name + '-' + unit.name + '-' + key)
      return id === this.pendingFlashId
    },
    /** 渲染常规分析图表（趋势 + 饼图） */
    renderRoutineCharts() {
      const echarts = (typeof window !== 'undefined' && window.__ECHARTS__) ? window.__ECHARTS__ : null
      if (!echarts) return
      // ① 趋势图（近 6 期）
      const trendEl = this.$refs.routineTrendChart
      if (trendEl) {
        if (this._routineTrend) {
          try { this._routineTrend.dispose() } catch (e) {}
          this._routineTrend = null
        }
        this._routineTrend = echarts.init(trendEl)
        const total = this.totalCarbonEmission || 0
        const months = ['6月', '7月', '8月', '9月', '10月', '本期']
        const rates = [1.05, 1.03, 1.02, 1.01, 1.005, 1]
        const data = rates.map(r => Math.round(total * r))
        this._routineTrend.setOption({
          grid: { left: 50, right: 20, top: 20, bottom: 30 },
          tooltip: { trigger: 'axis' },
          xAxis: {
            type: 'category',
            data: months,
            axisLine: { lineStyle: { color: '#e8eef5' } },
            axisLabel: { color: '#94a3b8', fontSize: 11 }
          },
          yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: '#f1f5f9' } },
            axisLabel: { color: '#94a3b8', fontSize: 11 }
          },
          series: [{
            type: 'line',
            data: data,
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: { color: '#0067fe' },
            lineStyle: { width: 2.5, color: '#0067fe' },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(0, 103, 254, 0.18)' },
                  { offset: 1, color: 'rgba(0, 103, 254, 0.01)' }
                ]
              }
            }
          }]
        })
        this._routineTrend.resize()
      }
      // ② 范围构成饼图
      const pieEl = this.$refs.routinePieChart
      if (pieEl) {
        if (this._routinePie) {
          try { this._routinePie.dispose() } catch (e) {}
          this._routinePie = null
        }
        this._routinePie = echarts.init(pieEl)
        const rows = this.routineScopeTable || []
        this._routinePie.setOption({
          tooltip: { trigger: 'item', formatter: '{b}<br/>{c} tCO₂e ({d}%)' },
          legend: { show: false },
          series: [{
            type: 'pie',
            radius: ['52%', '78%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: { borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: rows.map(r => ({
              name: r.name,
              value: r.value,
              itemStyle: { color: r.color }
            }))
          }]
        })
        this._routinePie.resize()
      }
    },
    /** 综合相对不确定度（误差传播法：AD ±5%，EF ±3%） */
    calcTotalRelativeUncertainty() {
      const total = this.totalCarbonEmission || 0
      if (!total) return 0
      const AD_UNC = 0.05
      const EF_UNC = 0.03
      let sumSq = 0
      ;(this.modelStages || []).forEach(stage => {
        ;(stage.processes || []).forEach(proc => {
          const em = this.procEmission(proc)
          if (!em) return
          const procRelUnc = Math.sqrt(AD_UNC * AD_UNC + EF_UNC * EF_UNC)
          sumSq += Math.pow(em * procRelUnc, 2)
        })
      })
      return Math.sqrt(sumSq) / total
    },
    /** 置信区间范围 */
    calcUncertaintyRange() {
      const mu = this.totalCarbonEmission || 0
      const rel = this.calcTotalRelativeUncertainty()
      const sigma = mu * rel
      const z = (this.uncertaintyParams.sampleSize === 10000 && this.uncertaintyParams.confidenceLevel === 95) ? 1.96 : 1.645
      const lower = Math.max(0, Math.round(mu - z * sigma))
      const upper = Math.round(mu + z * sigma)
      return { lower, upper }
    },
    /** 按核算时间范围生成任务名称（整年→年度；整季度→季度；整月→月度；其他→通用） */
    buildTaskName() {
      const r = this.periodRange || []
      if (r.length < 2 || !r[0] || !r[1]) return '组织温室气体排放核算'
      const sd = new Date(r[0])
      const ed = new Date(r[1])
      if (isNaN(sd.getTime()) || isNaN(ed.getTime())) return '组织温室气体排放核算'
      const sameYear = sd.getFullYear() === ed.getFullYear()
      const lastDay = new Date(ed.getFullYear(), ed.getMonth() + 1, 0).getDate()
      const isFirstDay = sd.getDate() === 1
      const isFullEnd = ed.getDate() === lastDay

      // ① 整年：1月1日 ~ 12月31日
      if (sameYear && sd.getMonth() === 0 && isFirstDay && ed.getMonth() === 11 && ed.getDate() === 31) {
        return '年度组织温室气体排放核算'
      }
      // ② 整季度：1-3 / 4-6 / 7-9 / 10-12
      if (sameYear && isFirstDay && isFullEnd) {
        const sm = sd.getMonth() + 1
        const em = ed.getMonth() + 1
        if ([1, 4, 7, 10].indexOf(sm) > -1 && [3, 6, 9, 12].indexOf(em) > -1 && em - sm === 2) {
          return '季度组织温室气体排放核算'
        }
      }
      // ③ 整月：同月 1日 ~ 月末
      if (sameYear && sd.getMonth() === ed.getMonth() && isFirstDay && isFullEnd) {
        return '月度组织温室气体排放核算'
      }
      // ④ 自定义区间
      return '组织温室气体排放核算'
    },
    /** 时间范围文本 */
    periodText() {
      const r = this.periodRange || []
      if (r.length < 2 || !r[0] || !r[1]) return ''
      const fmt = d => {
        const dt = new Date(d)
        const p = x => (x < 10 ? '0' + x : x)
        return dt.getFullYear() + '-' + p(dt.getMonth() + 1) + '-' + p(dt.getDate())
      }
      return fmt(r[0]) + ' ~ ' + fmt(r[1])
    },
    /** 进入阶段2 时正式创建任务（含防重复） */
    commitPendingTask() {
      // 非工作台进入（直接访问任务界面）时自动生成待创建任务 ID
      if (!this.pendingTaskId) this.pendingTaskId = 'task-' + Date.now()
      // 无期间时用当前年度兜底（阶段2 可调整）
      if (!this.periodRange || this.periodRange.length < 2) {
        const y = new Date().getFullYear()
        this.periodRange = [y + '-01-01', y + '-12-31']
        this.boundaryConfig.timeBoundary = y + '-01-01 - ' + y + '-12-31'
      }
      const rangeText = this.periodText()
      // 防重复：相同时间范围已有进行中任务 → 复用该任务（不重复创建）
      const dup = this.taskList.find(t => t.periodText === rangeText && t.status === 'in-progress')
      if (dup) {
        this.currentTaskId = dup.id
        this.pendingTaskId = null
        this.messages.push({
          id: 'MSG-' + Date.now(),
          role: 'assistant',
          content: `该时间范围已存在核算任务：**${dup.productName}**（${rangeText}）。\n\n已为您切换到该任务继续推进，避免重复创建。`,
          timestamp: new Date().toLocaleTimeString('zh-CN'),
          suggestions: []
        })
        return true
      }
      const task = {
        id: this.pendingTaskId,
        productName: this.buildTaskName(),
        periodText: rangeText,
        standard: this.selectedStandard || 'GHG Protocol',
        currentStepIndex: this.currentStepIndex,
        createdAt: new Date().toLocaleString('zh-CN'),
        updatedAt: new Date().toLocaleString('zh-CN'),
        status: 'in-progress'
      }
      this.taskList.unshift(task)
      this.persistTaskList()
      this.currentTaskId = task.id
      this.pendingTaskId = null
      return true
    },
    /** 阶段切换钩子：0 → 1 时创建任务 */
    onStepChanged(from, to) {
      if (from === 0 && to >= 1 && this.pendingTaskId) {
        this.commitPendingTask()
      }
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
      const standard = this.selectedStandard || 'GHG Protocol'
      const taskRegion = (this.boundaryConfig && this.boundaryConfig.region) || '华东'
      // 调用公共轻量匹配服务
      const trace = matchFactor(item, 'footprint', { region: taskRegion, standard, stageKey })
      item.factor = trace.selected.factorValue
      item.factorUnit = trace.selected.factorUnit
      item.evidenceTrace = trace
      return trace
    },
    _old_matchFactorWithCpstgt(item, stageKey) {
      const standard = this.selectedStandard || 'GHG Protocol'
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
        // 电力因子按场景精准路由
        if (isFootprint) {
          selectedFactor = { factorId: 'CPCD-EN-001', name: '华东电网平均排放因子', value: '0.581', unit: 'tCO₂e/kWh', db: 'CPCD 2026版', pool: '核算范围数据库(池3)', tech: '电网平均', geo: '华东', year: '2024' }
          candidates.push({ factorId: 'CPCD-EN-001', name: '华东电网平均排放因子', excluded: false, reason: '选中: 符合组织碳排放财务控制权法边界 + 华东区域生产地' })
          candidates.push({ factorId: 'NGEF-EN-004', name: '华东区域电力平均因子', excluded: true, reason: '排除: 口径为消费侧CO₂，未含上游线损与核算范围内' })
          confidence = 0.95
        } else {
          selectedFactor = { factorId: 'NGEF-EN-004', name: '华东区域电力平均因子', value: '0.5500', unit: 'kgCO₂/kWh', db: '国家温室气体排放因子库', pool: '国家官方公告(池1)', tech: '电网平均', geo: '华东', year: '2023' }
          candidates.push({ factorId: 'NGEF-EN-004', name: '华东区域电力平均因子', excluded: false, reason: '选中: 国家生态环境部权威公告 + 组织范围二消费侧CO₂口径' })
          confidence = 0.98
        }
      } else if (itemName.includes('铝') || itemName.includes('铸铝')) {
        // 材料：技术路线(原生/再生)高于年份
        selectedFactor = { factorId: 'CPCD-MA-003', name: '铸造铝合金', value: '8.52', unit: 'tCO₂e/kg', db: 'CPCD 2026版', pool: '核算范围数据库(池3)', tech: '铸造/原生', geo: '中国全国', year: '2023' }
        candidates.push({ factorId: 'CPCD-MA-003', name: '铸造铝合金', excluded: false, reason: '选中: 本土CPCD + 铸造工艺吻合 + 生产地全国' })
        candidates.push({ factorId: 'ECO-MA-002', name: '原生铝 (Aluminium, primary)', excluded: true, reason: '排除: 国际Ecoinvent地理代表性(全球)低于本土CPCD' })
        confidence = 0.92
      } else if (itemName.includes('钢') || itemName.includes('铁')) {
        // 钢铁：热轧工艺吻合
        selectedFactor = { factorId: 'CPCD-MA-001', name: '热轧钢棒（碳钢/合金钢）', value: '2.43', unit: 'tCO₂e/kg', db: 'CPCD 2026版', pool: '核算范围数据库(池3)', tech: '热轧/原生', geo: '中国江苏', year: '2022' }
        candidates.push({ factorId: 'CPCD-MA-001', name: '热轧钢棒（碳钢/合金钢）', excluded: false, reason: '选中: 工艺路线(热轧)+生产地exact(江苏)+数据质量高分' })
        candidates.push({ factorId: 'ECO-MA-001', name: '转炉钢 (Steel, converter)', excluded: true, reason: '排除: 技术代表性略逊且地理层级(全球)低于江苏实测' })
        confidence = 0.94
      } else if (itemName.includes('天然气') || itemName.includes('燃气')) {
        selectedFactor = { factorId: 'IPCC-EN-001', name: '天然气燃烧', value: '2.16172', unit: 'tCO₂e/m³', db: 'IPCC 2006指南', pool: '国际通用缺省(池1)', tech: '固定源燃烧', geo: '全球', year: '2006' }
        candidates.push({ factorId: 'IPCC-EN-001', name: '天然气燃烧', excluded: false, reason: '选中: 消费侧固定燃烧Tier-1权威缺省 + 净热值折算' })
        confidence = 0.90
      } else if (itemName.includes('柴油') || itemName.includes('汽油')) {
        selectedFactor = { factorId: 'IPCC-EN-002', name: '柴油燃烧', value: '2.66085', unit: 'tCO₂e/L', db: 'IPCC 2006指南', pool: '国际通用缺省(池1)', tech: '内燃机燃烧', geo: '全球', year: '2006' }
        candidates.push({ factorId: 'IPCC-EN-002', name: '柴油燃烧', excluded: false, reason: '选中: 移动源内燃机权威燃烧因子' })
        confidence = 0.90
      } else {
        // 通用兜底
        selectedFactor = { factorId: 'CPCD-GEN-001', name: `${itemName} 标准排放因子`, value: '1.25', unit: 'tCO₂e/kg', db: 'CPCD 2026版', pool: '核算范围数据库(池3)', tech: '通用工业', geo: '全国', year: '2023' }
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
        scenario: isFootprint ? '组织碳排放 (ISO 14064-1/QC/T)' : '组织碳核算 (ISO 14064)',
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
        decisionChain: `场景路由(${isFootprint ? 'LCA排放量' : '范围二'}) → S池(${selectedFactor.pool}) → T技术(${selectedFactor.tech}) → G产地(${selectedFactor.geo})`,
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
    // 默认标准编码：优先 GHG Protocol，其次列表第一条
    defaultStandardCode() {
      const list = this.standards || []
      const ghg = list.find(s => s.code === 'GHG Protocol')
      return (ghg || list[0] || {}).code || ''
    },
    // 确保默认选中第一条标准
    ensureDefaultStandard() {
      const list = this.standards || []
      if (!list.length) return
      if (!this.selectedStandard || !list.some(s => s.code === this.selectedStandard)) {
        this.$set(this, 'selectedStandard', list[0].code)
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
      const title = task ? task.productName : '组织碳排放对话'
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
        this.tlDialogStep = 'welcome'
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
          'lifecycleScope': { '运营控制权法': 'cradle-to-grave', '财务控制权法': 'cradle-to-gate', '股权比例法': 'gate-to-gate' },
          'unitType': { '核算范围口径': 'declaration', '参考单位': 'reference' },
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
          // 清洗跨场景脏数据：偏好标准不属于当前场景时，回退为场景默认标准
          const prefs = this.userPreferences
          const valid = prefs.defaultStandard && this.standards.some(s => s.code === prefs.defaultStandard)
          if (!valid) {
            const fallback = (this.standards && this.standards[0] && this.standards[0].code) || this.selectedStandard || ''
            prefs.defaultStandard = fallback
            this.saveUserPreferences()
          }
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
      if (prefs.defaultStandard && this.standards.some(s => s.code === prefs.defaultStandard)) {
        hints.push(`常用标准：${prefs.defaultStandard}`)
      }
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
      // 归档后更新任务状态为已完成，并回写任务列表
      const task = this.taskList.find(t => t.id === this.currentTaskId)
      if (task) {
        task.status = 'completed'
        task.currentStepIndex = this.currentStepIndex
        task.updatedAt = new Date().toLocaleString('zh-CN')
        this.persistTaskList()
      }
      this.$message.success('核算报告已成功归档，任务标记为已完成')
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
        name: (task.productName || '产品') + '碳排放核算模型',
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
        // 更新产品库（如有匹配的产品）
        const savedProducts = JSON.parse(localStorage.getItem('cfp_products') || '[]')
        const product = savedProducts.find(p => p.name === task.productName)
        if (product) {
          if (!product.sopIds) product.sopIds = []
          if (!product.sopIds.includes(newSOP.id)) {
            product.sopIds.push(newSOP.id)
          }
          newSOP.productId = product.id
          localStorage.setItem('cfp_products', JSON.stringify(savedProducts))
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
      // 默认全部展开，点击可折叠
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
      // 构建 CSV 内容：边界配置 + 各阶段排放源的活动数据/排放因子/排放量
      const b = this.boundaryConfig
      const headerRow = [
        '核算标准', '核算范围范围', '量化单位', '数据归集',
        '重要性阈值(单项)', '重要性阈值(累计)', '时间边界',
        '阶段', '排放源', '类型', '物料名称',
        '活动数据', '活动数据单位', '排放因子', '排放因子单位', '排放量(tCO₂e)'
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
      link.download = `碳排放核算数据_${this.selectedStandard}_${new Date().toISOString().slice(0, 10)}.csv`
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
            const factor = parseFloat(item.factor) || 0
            return (val * factor).toFixed(1)
          }
        }
      }
      return '0'
    },
    // ===== 阶段3行内编辑方法 =====
    addProcess(group) {
      if (!group || !group.processes) return
      group.processes.push({
        name: '新排放源',
        formula: '',
        allocation: '设施直接归集',
        units: [],
        inputs: [],
        outputs: []
      })
    },
    removeProcess(group, pi) {
      if (!group || !group.processes) return
      group.processes.splice(pi, 1)
    },
    addIO(proc, type) {
      if (!proc[type]) {
        this.$set(proc, type, [])
      }
      const isInput = type === 'inputs'
      proc[type].push({ name: isInput ? '新输入' : '新输出', flowType: 'elementary', listType: isInput ? 'raw_material' : 'waste_gas' })
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
    createEmptyModelStages() {
      return [
        { key: 'fuel', title: '化石燃料燃烧', dotClass: 'sd-raw', processes: [] },
        { key: 'process', title: '工业生产过程排放', dotClass: 'sd-manu', processes: [] },
        { key: 'fugitive', title: '逃逸排放', dotClass: 'sd-trans', processes: [] },
        { key: 'energy', title: '净购入电力、热力排放', dotClass: 'sd-use', processes: [] },
        { key: 'transport', title: '运输与配送（范围3）', dotClass: 'sd-recycle', processes: [] },
        { key: 'valuechain', title: '上下游产品与服务（范围3）', dotClass: 'sd-recycle', processes: [] }
      ]
    },
    // 是否为风机排放量任务（产品名含"风电机组/风机"）
    isWindTask() {
      const t = this.taskList.find(t => t.id === this.currentTaskId)
      const n = (t && t.productName) || ''
      return n.indexOf('风机') > -1 || n.indexOf('风电机组') > -1
    },
    // 通用任务的默认校验项（汽车制造示例，与 data() 初始同构）
    createDefaultValidationItems() {
      return [
        { id: 'val-1', type: 'completeness', stage: '范围1·固定燃烧', process: '天然气', label: '天然气活动数据为估算值，缺少燃气结算单佐证', ioType: 'input', ioName: '消耗量',
          value: '', unit: '', supplementHint: '燃气结算单 / 能源台账', status: 'missing', statusLabel: '待补充', severity: 'warning' },
        { id: 'val-2', type: 'consistency', stage: '范围2·外购电力', process: '净购入电力', label: '厂区总表用电量与电费结算单存在差异，需核对', ioType: 'input', ioName: '消耗量',
          value: '12,000', unit: 'MWh', supplementHint: '电费结算单与抄表记录', status: 'pending', statusLabel: '待确认', severity: 'warning' },
        { id: 'val-3', type: 'completeness', stage: '范围1·逃逸排放', process: '制冷剂逃逸', label: '制冷剂补充量缺少设备维保记录', ioType: 'input', ioName: '消耗量',
          value: '', unit: '', supplementHint: '空调维保记录 / 制冷剂采购单', status: 'missing', statusLabel: '待补充', severity: 'error' },
        { id: 'val-4', type: 'dqr', stage: '范围2·外购电力', process: '净购入电力', label: '电网排放因子采用区域因子，建议核对是否适用市场因子', ioType: 'input', ioName: '排放因子',
          value: '0.5703', unit: 'tCO₂/MWh', supplementHint: 'GHG Protocol 范围2 指引（区域因子 / 市场因子双口径）', status: 'pending', statusLabel: '待确认', severity: 'info' }
      ]
    },
    // 校验项是否全部处理完毕（resolved/skipped），用于右侧"进入下一步"按钮显隐
    validationAllResolved() {
      const items = this.validationItems || []
      return items.length > 0 && items.every(v => v.status === 'resolved' || v.status === 'skipped')
    },
    // 按任务类型分发模型构建：风机任务→风机五环节模型，其余→汽车默认模型
    // （仅在事件处理时机调用；data() 初始化阶段 taskList 未就绪，须继续用 createInitialModelStages）
    buildModelStages() {
      return this.isWindTask() ? this.createWindModelStages() : this.createInitialModelStages()
    },
    // 风机任务校验项（数据质量/一致性/完整性问题取自风机核算实际场景）
    createWindValidationItems() {
      return [
        { id: 'wval-1', type: 'completeness', stage: '范围1·固定源燃烧', process: '原材料获取（叶片/机舱/塔筒材料）', label: '钕铁硼永磁材料用量为设计BOM值，稀土采选冶因子取值需供应商核实', ioType: 'input', ioName: '钕铁硼永磁材料', value: '', unit: 'kg', status: 'missing', statusLabel: '待补充', supplementHint: '发电机供应商BOM与稀土用量清单', recommended: '6000', recommendNote: '发电机设计BOM用量' },
        { id: 'wval-2', type: 'consistency', stage: '范围1·移动源燃烧', process: '叶片制造（模具成型/固化/打磨）', label: '玻纤边角料同时出现"出厂转运"与"厂内暂存"两笔记录，疑似重复计数', ioType: 'output', ioName: '废玻纤边角料', value: '1200', unit: 'kg', status: 'pending', statusLabel: '待确认', supplementHint: '叶片车间固废转移联单', recommended: '1200', recommendNote: '仅计出厂转运一笔，剔除厂内暂存重复' },
        { id: 'wval-3', type: 'consistency', stage: '使用阶段', process: '运营维护（20年·年均发电小时数4200h）', label: '年发电小时数取4200h为风场可研值，需按投运后实际数据修正', ioType: 'input', ioName: '年发电小时数', value: '4200', unit: 'h/年', status: 'pending', statusLabel: '待确认', supplementHint: '风场SCADA运行数据 / 可研报告发电量章节', recommended: '4200', recommendNote: '投运后SCADA实测均值与可研一致' },
        { id: 'wval-4', type: 'dqr', stage: '范围3·价值链间接', process: '退役拆解与材料回收', label: '废玻纤叶片处置路径（填埋/水泥窑协同）因子引用国外数据库，地理代表性评分偏高', ioType: 'output', ioName: '废玻纤叶片', value: '3.5', unit: '分', status: 'pending', statusLabel: '待确认', supplementHint: '国内风电叶片回收处置因子数据', recommended: '3.0', recommendNote: '改用国内处置因子后的地理代表性评分' }
      ]
    },
    // 风机任务画像：标准、核算范围、模型、校验项整体切换为风机口径
    // 标准复用政策标准库已有的 GB/T 32150-2025 通用条目（同编号去重，不另插风机变体）
    applyWindTaskProfile() {
      const code = 'GHG Protocol'
      // 兼容旧快照：移除历史版本动态插入的风机变体条目，避免列表重复
      this.standards = this.standards.filter(s => s.code.indexOf('（风力发电机组）') === -1)
      this.standards.forEach(s => { s.active = s.code === code })
      this.selectedStandard = code
      this.boundaryConfig.unitType = 'functional'
      this.boundaryConfig.unitDetail = '1台陆上风电机组（额定功率6.5MW，叶轮直径171m，塔架高度110m，设计寿命20年，年均发电小时数4200h）'
      this.modelStages = this.createWindModelStages()
      this.validationItems = this.createWindValidationItems()
    },
    // 通用任务画像：恢复汽车制造默认口径
    applyDefaultTaskProfile() {
      // 组织碳核算默认画像（非组织碳排放）
      this.selectedStandard = 'GHG Protocol'
      this.boundaryConfig.lifecycleScope = 'operational'
      this.boundaryConfig.unitType = 'scope12'
      this.boundaryConfig.unitDetail = '化石燃料燃烧排放 + 工业生产过程排放 + 外购电力、热力隐含排放（DB11/T 1787 口径）'
      this.boundaryConfig.allocationRule = 'facility'
      // 数据所属期自动继承核算期间（阶段1 只读展示）
      if (this.periodRange && this.periodRange.length === 2) {
        this.boundaryConfig.timeBoundary = this.periodRange[0] + ' - ' + this.periodRange[1]
      }
      this.selectedUnit = 'scope12'
      this.modelStages = this.createInitialModelStages()
      this.validationItems = this.createDefaultValidationItems()
    },
    // 风机五环节 LCA 模型（基于远景《风机排放量与低碳发展报告2023》：EN-171/6.5 机型，
    // 度电排放量 5.56 gCO2e/kWh；五环节：原材料开采/零部件生产/风场建设安装/运营维护/废弃回收；
    // 碳排放占比：零部件生产 49.3% > 风场建设 40.1% > 运维最低；年发电小时数 3500~4500h、设计年限 20 年）
    createWindModelStages() {
      return [
        {
          key: 'raw_material',
          title: '范围1·固定源燃烧',
          dotClass: 'sd-raw',
          processes: [
            {
              name: '原材料获取（叶片/机舱/塔筒材料）',
              allocation: 'mass',
              inputs: [
                { name: '玻璃纤维增强塑料（叶片主体）', value: '85000', unit: 'kg', factor: '2.71', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '环氧树脂（叶片基体）', value: '50000', unit: 'kg', factor: '4.15', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '低合金钢（塔筒/机架）', value: '460000', unit: 'kg', factor: '1.57', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '合金钢（主轴/齿轮箱）', value: '80000', unit: 'kg', factor: '2.48', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '铸铁（轮毂/机舱底座）', value: '80000', unit: 'kg', factor: '1.92', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '铜（电缆/绕组）', value: '10000', unit: 'kg', factor: '3.48', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '钕铁硼永磁材料（直驱发电机，含稀土）', value: '6000', unit: 'kg', factor: '18.6', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '原材料入厂物流', value: '241500', unit: 't*km', factor: '0.148', factorUnit: 'tCO₂e/t*km', flowType: 'elementary', listType: 'transport' }
              ],
              outputs: [
                { name: '风电机组部件（叶片×3/机舱/塔筒/轮毂）', value: '770000', unit: 'kg', factor: null, factorUnit: null, flowType: 'product', productSubType: 'main', listType: 'main_product', toStage: 'manufacturing' }
              ]
            }
          ]
        },
        {
          key: 'manufacturing',
          title: '范围1·移动源燃烧',
          dotClass: 'sd-manu',
          processes: [
            {
              name: '叶片制造（模具成型/固化/打磨）',
              allocation: 'mass',
              inputs: [
                { name: '市电（叶片厂）', value: '112000', unit: 'kWh', factor: '0.581', factorUnit: 'tCO₂e/kWh', flowType: 'elementary', listType: 'energy' }
              ],
              outputs: [
                { name: '固化挥发有机物（VOC）', value: '500', unit: 'kg', factor: '2.52', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'waste_gas' },
                { name: '废玻纤边角料', value: '1200', unit: 'kg', factor: '0.52', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'solid_waste' }
              ]
            },
            {
              name: '机舱总装与塔筒焊接',
              allocation: 'mass',
              inputs: [
                { name: '市电（总装厂）', value: '62000', unit: 'kWh', factor: '0.581', factorUnit: 'tCO₂e/kWh', flowType: 'elementary', listType: 'energy' },
                { name: '天然气（涂装烘干）', value: '1800', unit: 'Nm³', factor: '2.162', factorUnit: 'tCO₂e/Nm³', flowType: 'elementary', listType: 'energy' }
              ],
              outputs: [
                { name: '焊接烟尘', value: '120', unit: 'kg', factor: '1.85', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'waste_gas' },
                { name: '废焊材包装', value: '80', unit: 'kg', factor: '0.61', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'solid_waste' }
              ]
            }
          ]
        },
        {
          key: 'transport',
          scope: 'scope3', scopeName: '范围3 · 价值链间接排放',
          title: '运输分销阶段',
          dotClass: 'sd-trans',
          processes: [
            {
              name: '大件运输（叶片/塔筒/机舱至风场）',
              allocation: 'mass',
              inputs: [
                { name: '重型货车运输（叶片，超高件专运）', value: '280000', unit: 't*km', factor: '0.148', factorUnit: 'tCO₂e/t*km', flowType: 'elementary', listType: 'transport' },
                { name: '重型货车运输（塔筒+机舱）', value: '346900', unit: 't*km', factor: '0.148', factorUnit: 'tCO₂e/t*km', flowType: 'elementary', listType: 'transport' }
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
                { name: '钢筋混凝土基础（单台机组）', value: '900000', unit: 'kg', factor: '0.152', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '集电线路及升压站混凝土（按20台机组分摊）', value: '2000000', unit: 'kg', factor: '0.152', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '场内道路及平台钢构（按20台机组分摊）', value: '220000', unit: 'kg', factor: '1.57', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '铝芯电缆（集电线路，按20台机组分摊）', value: '40000', unit: 'kg', factor: '6.16', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '柴油（吊车/施工机械）', value: '65000', unit: 'kg', factor: '3.096', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'energy' },
                { name: '市电（施工用电）', value: '248000', unit: 'kWh', factor: '0.581', factorUnit: 'tCO₂e/kWh', flowType: 'elementary', listType: 'energy' }
              ],
              outputs: [
                { name: '建设安装完工交付（吊装/基础/集电线路并网）', value: '3930000', unit: 'kg', factor: null, factorUnit: null, flowType: 'product', productSubType: 'main', listType: 'main_product' }
              ]
            },
            {
              name: '运营维护（20年·年均发电小时数4200h）',
              allocation: 'mass',
              inputs: [
                { name: '齿轮箱润滑油更换（周期性）', value: '8000', unit: 'kg', factor: '3.18', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '备件更换（叶片修补/变桨轴承等）', value: '19600', unit: 'kg', factor: '2.21', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
                { name: '运维车辆柴油（巡检）', value: '5000', unit: 'kg', factor: '3.096', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'energy' }
              ],
              outputs: [
                { name: '废润滑油（回收处置）', value: '2500', unit: 'kg', factor: '0.72', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'solid_waste' }
              ]
            }
          ]
        },
        {
          key: 'recycle',
          title: '范围3·价值链间接',
          dotClass: 'sd-recycle',
          processes: [
            {
              name: '退役拆解与材料回收',
              allocation: 'mass',
              inputs: [
                { name: '拆解机械柴油', value: '12500', unit: 'kg', factor: '3.096', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'energy' }
              ],
              outputs: [
                { name: '回收钢材（塔筒/机架，再生钢抵扣）', value: '300000', unit: 'kg', factor: '-1.25', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'recycled' },
                { name: '回收铜', value: '9000', unit: 'kg', factor: '-2.86', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'recycled' },
                { name: '废玻纤叶片（填埋/水泥窑协同处置）', value: '135000', unit: 'kg', factor: '0.35', factorUnit: 'tCO₂e/kg', flowType: 'elementary', listType: 'solid_waste' }
              ]
            }
          ]
        }
      ]
    },
    createInitialModelStages() {
      // 北京碳市场：按 DB11/T 1787 口径组织清单（化石燃料燃烧 + 工业过程 + 外购电力热力）
      const mk = (name, formula) => ({
        name, formula, allocation: '设施直接归集',
        units: [],
        activityData: '', unit: '', factor: '', factorUnit: '', emission: 0,
        dataSource: '', factorSource: '', proof: '', verifiedAD: false, verifiedEF: false,
        inputs: [{ name: '消耗量', value: '', unit: '', factor: '', factorUnit: '', flowType: 'elementary', listType: 'activity' }],
        outputs: []
      })

      return [
        {
          key: 'fuel', title: '化石燃料燃烧排放', scope: 'scope1', dotClass: 'is-blue',
          processes: [
            mk('燃煤', '排放量 = 燃煤消耗量 × 低位发热量 × 单位热值含碳量 × 碳氧化率 × 44/12'),
            mk('天然气', '排放量 = 天然气消耗量 × 低位发热量 × 单位热值含碳量 × 碳氧化率 × 44/12'),
            mk('柴油', '排放量 = 柴油消耗量 × 低位发热量 × 单位热值含碳量 × 碳氧化率 × 44/12'),
            mk('汽油', '排放量 = 汽油消耗量 × 低位发热量 × 单位热值含碳量 × 碳氧化率 × 44/12'),
            mk('燃料油', '排放量 = 燃料油消耗量 × 低位发热量 × 单位热值含碳量 × 碳氧化率 × 44/12'),
            mk('焦炭', '排放量 = 焦炭消耗量 × 低位发热量 × 单位热值含碳量 × 碳氧化率 × 44/12')
          ]
        },
        {
          key: 'process', title: '工业生产过程排放', scope: 'scope1', dotClass: 'is-blue',
          processes: [
            mk('水泥熟料生产', '排放量 = 熟料产量 × 排放因子'),
            mk('钢铁冶炼', '排放量 = 粗钢产量 × 排放因子'),
            mk('化工合成', '排放量 = 产品产量 × 排放因子'),
            mk('其他工艺排放', '排放量 = 产量 × 排放因子')
          ]
        },
        {
          key: 'energy', title: '外购电力、热力隐含排放', scope: 'scope2', dotClass: 'is-green',
          processes: [
            mk('净购入电力', '排放量 = 净购入电量 × 区域电网排放因子'),
            mk('净购入热力（蒸汽）', '排放量 = 净购入蒸汽量 × 热力排放因子'),
            mk('净购入热力（热水）', '排放量 = 净购入热水量 × 热力排放因子')
          ]
        }
      ]
    },
    getAllocationLabel(val) {
      const map = { 'mass': '质量分配', 'economic': '经济分配', 'energy': '能源分配' }
      return map[val] || '质量分配'
    },
    onProcAllocationChange(proc) {
      if (proc.allocation !== this.boundaryConfig.allocationRule) {
        // 数据归集与全局不一致，自动生成备注
        if (!proc.allocationRemark) {
          this.$set(proc, 'allocationRemark', `全局规则为${this.allocationRuleLabel}，本过程改为${this.getAllocationLabel(proc.allocation)}`)
        } else {
          // 已有备注，更新规则名称部分
          this.$set(proc, 'allocationRemark', proc.allocationRemark.replace(/本过程改为.*$/, `本过程改为${this.getAllocationLabel(proc.allocation)}`))
        }
      } else {
        // 恢复一致，清空备注
        this.$set(proc, 'allocationRemark', '')
      }
    },
    buildValidationSummary() {
      const missing = this.validationItems.filter(v => v.status === 'missing')
      const pending = this.validationItems.filter(v => v.status === 'pending')
      const consistency = pending.filter(v => v.type === 'consistency')
      const dqr = pending.filter(v => v.type === 'dqr')
      let msg = `**【阶段六：数据校验】**\n系统已完成完整性、一致性、数据质量多重校验，共发现 **${missing.length + pending.length} 项**待处理事项：\n`
      if (missing.length > 0) {
        msg += `\n**❶ 完整性校验 — 缺失数据（${missing.length}项）**\n`
        missing.forEach(item => {
            msg += `• **【${item.stage}·${item.process}】**\n`
          msg += `  - 关联参数：${item.ioType === 'input' ? '活动数据' : '排放量'}「${item.ioName}」\n`
          msg += `  - 问题描述：${item.label}\n`
          msg += `  - 建议上传：${item.supplementHint || '—'}\n`
        })
      }
      if (consistency.length > 0) {
        msg += `\n**❷ 一致性校验 — 单位换算/口径核查（${consistency.length}项）**\n`
        consistency.forEach(item => {
          msg += `• **【${item.stage}·${item.process}】**\n`
          msg += `  - 关联参数：${item.ioType === 'input' ? '活动数据' : '排放量'}「${item.ioName}」\n`
          msg += `  - 问题描述：${item.label}\n`
          msg += `  - 建议值：${item.value || '—'} ${item.unit || ''}\n`
          msg += `  - 建议核查：${item.supplementHint || '—'}\n`
        })
      }
      if (dqr.length > 0) {
        msg += `\n**❸ 数据质量校验 — 因子地理代表性（${dqr.length}项）**\n`
        dqr.forEach(item => {
          msg += `• **【${item.stage}·${item.process}】**\n`
          msg += `  - 关联参数：${item.ioType === 'input' ? '活动数据' : '排放量'}「${item.ioName}」\n`
          msg += `  - 问题描述：${item.label}\n`
          msg += `  - 建议评分：${item.value || '—'} ${item.unit || ''}\n`
          msg += `  - 建议补充：${item.supplementHint || '—'}\n`
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
    /** 当前大类下「还未添加」的排放源枚举 */
    availableProcesses(cat) {
      const all = (this.stdProcesses && this.stdProcesses[cat.key]) || []
      const exist = (cat.processes || []).map(p => p.name)
      return all.filter(o => exist.indexOf(o.name) === -1)
    },
    /** 从下拉选中 / 输入自定义排放源 → 添加（标准项自动带公式） */
    addProcessFromSelect(cat, name) {
      if (!name) return
      const trimmed = String(name).trim()
      if (!trimmed) return
      if ((cat.processes || []).some(p => p.name === trimmed)) {
        this.$message.warning('该排放源已存在')
        this.$set(this.newProc, cat.key, '')
        return
      }
      const all = (this.stdProcesses && this.stdProcesses[cat.key]) || []
      const std = all.find(o => o.name === trimmed)
      cat.processes.push({
        name: trimmed,
        formula: std ? std.formula : '',
        allocation: '设施直接归集',
        units: [],
        inputs: [{ name: '消耗量', value: '', unit: '', factor: '', factorUnit: '', flowType: 'elementary', listType: 'activity' }],
        outputs: []
      })
      this.$set(this.newProc, cat.key, '')
    },
    /** 删除排放源 */
    removeProcess(cat, pi) {
      if (!cat || !cat.processes) return
      cat.processes.splice(pi, 1)
    },
    /** 添加排放单元（同排放源下不可重复） */
    addUnit(proc) {
      if (!proc.units) this.$set(proc, 'units', [])
      this.$prompt('请输入排放单元名称（如：1号锅炉、2号窑炉）', '添加排放单元', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '排放单元名称',
        inputValidator: (v) => {
          const name = (v || '').trim()
          if (!name) return '请输入名称'
          if ((proc.units || []).some(u => u.name === name)) return '该排放单元已存在'
          return true
        }
      }).then(({ value }) => {
        proc.units.push({ name: value.trim() })
      }).catch(() => {})
    },
    /** 删除排放单元 */
    removeUnit(proc, ui) {
      if (proc.units) proc.units.splice(ui, 1)
    },
    /** 行业画像：按企业行业推荐重点排放源（引导用户识别清单） */
    // ===== 资源台账读取 =====
    /** 读取组织资源台账 */
    _srcLib() {
      try { return JSON.parse(localStorage.getItem('org_resources_v3') || '[]') } catch (e) { return [] }
    },
    /** 台账为空时写入种子数据（演示用） */
    seedResourceLibraryIfEmpty() {
      try {
        const saved = localStorage.getItem('org_resources_v3')
        if (saved && JSON.parse(saved).length) return
      } catch (e) { /* ignore */ }
      const org = this.currentEnterprise || '本企业'
      const now = Date.now()
      const mk = (i, o) => Object.assign({ id: 'seed-' + now + '-' + i, org, enabled: true }, o)
      const seed = [
        mk(0, { category: '组织区域', name: org, desc: '整车制造' }),
        mk(1, { category: '建筑空间', name: '北京亦庄工厂' }),
        mk(2, { category: '建筑空间', name: '二期工厂' }),
        mk(3, { category: '设备设施', subCategory: '实体资源', name: '1号锅炉', building: '北京亦庄工厂',
          sourceCategory: '化石燃料燃烧', sourceType: '燃煤', desc: '燃煤', combustionType: '固定燃烧', isEmissionSource: true }),
        mk(4, { category: '设备设施', subCategory: '实体资源', name: '2号锅炉', building: '二期工厂',
          sourceCategory: '化石燃料燃烧', sourceType: '天然气', desc: '天然气', combustionType: '固定燃烧', isEmissionSource: true }),
        mk(5, { category: '设备设施', subCategory: '实体资源', name: '涂装线直燃机', building: '北京亦庄工厂',
          sourceCategory: '化石燃料燃烧', sourceType: '天然气', desc: '天然气', isEmissionSource: true }),
        mk(6, { category: '设备设施', subCategory: '实体资源', name: '厂区总表', building: '北京亦庄工厂',
          sourceCategory: '净购入电力、热力排放', sourceType: '净购入电力', desc: '净购入电力', hasMeteringPoint: true }),
        mk(7, { category: '设备设施', subCategory: '实体资源', name: '员工通勤', building: '',
          sourceCategory: '运输与配送', sourceType: '员工通勤', desc: '员工通勤', transportMode: '公路', isScope3: true }),
        mk(8, { category: '设备设施', subCategory: '实体资源', name: '原材料物流', building: '',
          sourceCategory: '运输与配送', sourceType: '上游运输与配送', desc: '上游运输与配送', transportMode: '铁路', isScope3: true }),
        mk(9, { category: '设备设施', subCategory: '实体资源', name: '运营废弃物', building: '',
          sourceCategory: '废弃物处理与其他', sourceType: '运营废弃物处理', desc: '运营废弃物处理', disposalType: '填埋', isScope3: true }),
        mk(10, { category: '设备设施', subCategory: '实体资源', name: '外购商品与服务', building: '',
          sourceCategory: '上下游产品与服务', sourceType: '外购商品与服务', desc: '外购商品与服务', dataMethod: '行业平均', isScope3: true })
      ]
      try { localStorage.setItem('org_resources_v3', JSON.stringify(seed)) } catch (e) { /* ignore */ }
    },
    /** 台账 → 核算清单（modelStages）：按 范围 → 大类 → 排放源 → 排放单元 组装 */
    syncModelStagesFromLedger() {
      this.seedResourceLibraryIfEmpty()
      const list = this.getEmissionSourceList() || []
      if (!list.length) return false
      const SCOPE_NAMES = {
        scope1: '范围1 · 直接排放',
        scope2: '范围2 · 外购能源间接排放',
        scope3: '范围3 · 价值链间接排放'
      }
      const DOTS = ['sd-raw', 'sd-manu', 'sd-trans', 'sd-use', 'sd-recycle']
      const result = []
      ;['scope1', 'scope2', 'scope3'].forEach(scopeKey => {
        const items = list.filter(x => x.scope === scopeKey)
        if (!items.length) return
        const catMap = {}
        items.forEach(x => {
          catMap[x.category] = catMap[x.category] || {}
          catMap[x.category][x.type] = catMap[x.category][x.type] || []
          catMap[x.category][x.type].push(x.unit)
        })
        Object.keys(catMap).forEach((catName, ci) => {
          result.push({
            key: 'cat-' + scopeKey + '-' + ci,
            scope: scopeKey,
            scopeName: SCOPE_NAMES[scopeKey],
            title: catName,
            dotClass: DOTS[ci % DOTS.length],
            processes: Object.keys(catMap[catName]).map(typeName => ({
              name: typeName,
              formula: this.getFormulaByName(typeName),
              allocation: '设施直接归集',
              activityData: '',
              unit: '',
              factor: '',
              factorUnit: '',
              emission: 0,
              dataSource: '',
              factorSource: '',
              proof: '',
              units: catMap[catName][typeName].map(u => {
                const demo = this.getDemoParam(typeName)
                const params = this.buildUnitParams(demo)
                const adP = params.find(p => p.key === 'AD')
                const efP = params.find(p => p.key === 'EF')
                const oxP = params.find(p => p.key === 'OX')
                const ad = adP ? adP.value : ''
                const ef = efP ? efP.value : ''
                const ox = oxP ? parseFloat(oxP.value) : 1
                const emission = (parseFloat(ad) || 0) * (parseFloat(ef) || 0) * (isNaN(ox) ? 1 : ox)
                return {
                  name: u,
                  params,
                  // 兼容字段（从 params 派生）
                  activityData: ad,
                  unit: adP ? adP.unit : '',
                  factor: ef,
                  factorUnit: efP ? efP.unit : '',
                  emission: Math.round(emission * 10) / 10,
                  dataSource: adP ? adP.source : '',
                  factorSource: efP ? efP.source : '',
                  proof: adP ? adP.proof : '',
                  verified: false,
                  verifiedAD: false,
                  verifiedEF: false,
                  history: []
                }
              }),
              inputs: [{ name: '消耗量', value: '', unit: '', factor: '', factorUnit: '', flowType: 'elementary', listType: 'activity' }],
              outputs: []
            }))
          })
        })
      })
      if (result.length) {
        this.modelStages = result
        return true
      }
      return false
    },
    /** 跳过所有剩余待处理项（兜底入口） */
    skipAllIssues() {
      const pending = this.pendingValidationItems
      if (!pending.length) {
        this.$message.info('无待处理项')
        return
      }
      pending.forEach(v => {
        v.status = 'skipped'
        v.statusLabel = '已跳过'
      })
      this.$message.success('已跳过 ' + pending.length + ' 项待处理')
    },
    /** 定位到下一个待处理项（滚动 + 高亮） */
    nextIssue() {
      const pending = this.pendingValidationItems
      if (!pending.length) {
        this.$message.success('所有待处理项已完成')
        return
      }
      if (!this._issueCursor) this._issueCursor = -1
      this._issueCursor = (this._issueCursor + 1) % pending.length
      const item = pending[this._issueCursor]
      this.currentIssueId = item.id
      // 定位到参数行
      this.$nextTick(() => {
        const el = document.querySelector('[data-issue-id="' + item.id + '"]')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add('is-issue-highlight')
          setTimeout(() => el.classList.remove('is-issue-highlight'), 2200)
          this.$message.info('定位到：' + item.process + ' · ' + item.ioName)
        } else {
          // 参数行不存在（可能不在当前页签）→ 切到数据清单
          this.validationActiveTab = 'activity'
          this.$nextTick(() => {
            const el2 = document.querySelector('[data-issue-id="' + item.id + '"]')
            if (el2) {
              el2.scrollIntoView({ behavior: 'smooth', block: 'center' })
              el2.classList.add('is-issue-highlight')
              setTimeout(() => el2.classList.remove('is-issue-highlight'), 2200)
            }
            this.$message.info('定位到：' + item.process + ' · ' + item.ioName)
          })
        }
      })
    },
    /** 参数行对应的校验项 id（无则空） */
    paramIssueId(proc, unit, paramType) {
      const items = this.pendingValidationItems
      if (!items.length) return ''
      const hit = items.find(v =>
        (v.process === proc.name || (v.stage || '').indexOf(proc.name) > -1) &&
        (paramType === 'AD' ? v.ioType === 'input' : v.ioType === 'output')
      )
      return hit ? hit.id : ''
    },
    /** 选中参数（右侧点击参数行）→ 左侧推送参数详情引导 + 快捷按钮 */
    selectParam(proc, unit, paramType, catTitle) {
      const isAD = paramType === 'AD'
      const val = isAD ? (unit.activityData || '') : (unit.factor || '')
      const unitText = isAD ? (unit.unit || '') : (unit.factorUnit || '')
      const src = isAD ? (unit.dataSource || '') : (unit.factorSource || '')
      this.selectedParam = { proc, unit, paramType, catTitle }
      const lines = [
        '**【参数详情】**',
        '',
        '* **排放源**：' + (proc.name || '—'),
        '* **排放单元**：' + ((unit && unit.name) || '（按排放源汇总）'),
        '* **参数**：' + (isAD ? '活动数据（AD）' : '排放因子（EF）'),
        '* **当前值**：' + (val || '待填写') + ' ' + unitText,
        '* **来源**：' + (src || '未记录'),
        '',
        '你可以：',
        '* 直接在右侧输入框修改数值（自动留痕）',
        '* 点击「参数详情」查看凭证、校验关联与历史趋势',
        '* 点击「上传佐证」补充材料'
      ]
      this.messages.push({
        id: 'msg-param-' + Date.now(),
        role: 'assistant',
        content: lines.join('\n'),
        suggestions: ['参数详情', '上传佐证'],
        timestamp: new Date().toLocaleTimeString('zh-CN')
      })
      this.scrollToBottom()
    },
    /** 打开数据溯源抽屉 */
    openTrace(proc, unit, paramType, catTitle) {
      const isAD = paramType === 'AD'
      const adVal = unit.activityData || ''
      const adParam = isAD ? ((unit.params || []).find(x => x.key === 'AD') || {}) : {}
      const efVal = unit.factor || ''
      const em = (parseFloat(adVal) || 0) * (parseFloat(efVal) || 0)
      const fSrc = unit.factorSource || ''
      let dqrLevel = '中'
      let dqrNote = '排放因子采用标准缺省值，未使用企业实测数据'
      if (/实测|企业|监测/.test(fSrc)) { dqrLevel = '高'; dqrNote = '排放因子来自企业实测或监测数据' }
      else if (!fSrc) { dqrLevel = '低'; dqrNote = '排放因子尚未匹配，建议补充' }
      this.traceRow = {
        procName: proc && proc.name ? proc.name : '—',
        unitName: unit && unit.name ? unit.name : '（按排放源汇总）',
        catTitle: catTitle || '',
        paramType,
        paramLabel: isAD ? '活动数据' : '排放因子',
        value: isAD ? (unit.activityData || '—') : (unit.factor || '—'),
        unitText: isAD ? (unit.unit || '') : (unit.factorUnit || ''),
        source: isAD ? (unit.dataSource || '') : fSrc,
        proof: unit.proof || '',
        history: (unit.history || []).slice(-8).reverse(),
        formula: '',
        // 计算关系
        adVal: adVal || '—',
        adUnit: unit.unit || '',
        efVal: efVal || '—',
        efUnit: unit.factorUnit || '',
        emission: em ? em.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0.0',
        // 数据来源（AD 专用：原始值 + 换算链路）
        rawValue: adParam ? (adParam.rawValue || '') : '',
        rawUnitText: adParam ? (adParam.rawUnit || '') : '',
        convertFactor: adParam ? (adParam.convertFactor || '') : '',
        convertFormula: adParam ? (adParam.convertFormula || '') : '',
        convertNote: adParam ? (adParam.convertNote || '') : '',
        sourceDetail: adParam ? (adParam.sourceDetail || '') : '',
        // 因子来源（EF 专用：因子库 + 权威池 + 匹配链路 + T-G-T + 置信度）
        factorLibrary: isAD ? '' : (() => {
          if (/IPCC/.test(fSrc)) return 'IPCC 2006 温室气体清单'
          if (/GHG/i.test(fSrc)) return 'GHG Protocol 缺省值库'
          if (/DB11/i.test(fSrc)) return 'DB11/T 1787 附录推荐值'
          if (/区域电网|生态环境部/.test(fSrc)) return '中国区域电网排放因子库'
          if (/实测|企业/.test(fSrc)) return '企业实测因子库'
          return fSrc || '—'
        })(),
        sourceTier: isAD ? null : (() => {
          if (/IPCC|GHG|DB11|区域电网|国家|生态环境部/.test(fSrc)) return 1
          if (/EPD/.test(fSrc)) return 2
          if (/Ecoinvent/i.test(fSrc)) return 3
          if (/实测|企业|行业/.test(fSrc)) return 4
          return 1
        })(),
        tierName: isAD ? '' : (() => {
          if (/IPCC|GHG|DB11|区域电网|国家|生态环境部/.test(fSrc)) return '国家官方 / 国际通用'
          if (/EPD/.test(fSrc)) return '经核查 EPD'
          if (/Ecoinvent/i.test(fSrc)) return '主流商业 LCA'
          if (/实测|企业|行业/.test(fSrc)) return '文献 / 行业 / 企业自建'
          return ''
        })(),
        hitLevel: isAD ? '' : (() => {
          if (/实测/.test(fSrc)) return 'P-1 企业实测'
          if (/企业记忆|纠偏/.test(fSrc)) return 'P0 企业记忆'
          if (/DB11|区域电网|国家|生态环境部/.test(fSrc)) return '规则表命中'
          return '兜底缺省'
        })(),
        hitLevelClass: isAD ? '' : (() => {
          if (/实测/.test(fSrc)) return 'is-p1'
          if (/企业记忆|纠偏/.test(fSrc)) return 'is-p0'
          if (/DB11|区域电网|国家|生态环境部/.test(fSrc)) return 'is-rule'
          return 'is-fallback'
        })(),
        confidence: isAD ? null : (() => {
          if (/实测/.test(fSrc)) return '1.00'
          if (/企业记忆|纠偏/.test(fSrc)) return '0.99'
          if (/DB11|区域电网|国家|生态环境部/.test(fSrc)) return '0.90'
          return '0.82'
        })(),
        techMatch: isAD ? '' : ('T 层：' + (proc && proc.name ? proc.name : '—') + ' → ' + (catTitle || '—') + ' 缺省值'),
        geoMatch: isAD ? '' : 'G 层：中国（national 0.70）',
        timeMatch: isAD ? '' : (() => {
          if (/IPCC 2006/.test(fSrc)) return 'T 层：因子年份 2006，时效衰减 0.80'
          if (/DB11\/T 1787/.test(fSrc)) return 'T 层：因子年份 2020，时效衰减 0.95'
          if (/GHG/i.test(fSrc)) return 'T 层：因子年份 2015，时效衰减 0.90'
          return 'T 层：时效系数 0.90'
        })(),
        factorVersion: isAD ? '' : (() => {
          if (/IPCC/.test(fSrc)) return 'IPCC 2006（2019 修订）'
          if (/GHG/i.test(fSrc)) return 'GHG Protocol v2'
          if (/DB11/.test(fSrc)) return 'DB11/T 1787-2020'
          return '—'
        })(),
        matchModeAD: isAD ? '按排放源品种匹配' : '规则表关键词匹配',

        // 匹配策略
        matchMode: isAD ? '按排放源品种匹配' : '规则表关键词匹配',
        matchBasis: (proc && proc.name ? proc.name : '—') + ' → ' + (catTitle || '—'),
        factorSource: fSrc || '未匹配',
        // 数据质量
        dqrLevel,
        dqrNote,
        // 校验关联（同名排放源相关的校验项）
        relatedIssues: (this.validationItems || []).filter(v =>
          v.process === (proc && proc.name) || v.stage === (catTitle || '')
        ).map(v => ({
          label: v.label,
          statusLabel: v.statusLabel || '待确认',
          severity: v.severity || 'warning'
        })),
        // 历史趋势（上期对比，演示数据）
        trend: (function () {
          const cur = parseFloat(adVal) || 0
          const prev = cur ? Math.round(cur * 0.92 * 10) / 10 : 0
          const delta = prev ? ((cur - prev) / prev * 100) : 0
          return {
            prev: prev ? String(prev) : '—',
            cur: adVal || '—',
            deltaPct: prev ? (delta >= 0 ? '+' : '') + delta.toFixed(1) + '%' : '—',
            deltaCls: delta > 0 ? 'up' : (delta < 0 ? 'down' : 'flat')
          }
        })()
      }
      this.traceDrawer = true
    },
    /** 参数值变更（记录留痕） */
    onParamChange(unit, paramType, oldVal, newVal) {
      if (oldVal === newVal) return
      if (!unit.history) this.$set(unit, 'history', [])
      unit.history.push({
        time: new Date().toLocaleString('zh-CN'),
        field: paramType === 'AD' ? '活动数据' : '排放因子',
        from: oldVal || '—',
        to: newVal || '—'
      })
      this.$message.success('已更新并记录留痕')
    },
    /** 上传佐证材料 */
    uploadProof() {
      this.$message.info('佐证材料上传功能待接入（可对接佐证材料库）')
    },
    /** 由演示数据构造参数数组（AD/EF + 扩展参数） */
    buildUnitParams(demo) {
      if (!demo) return []
      const list = [
        {
          key: 'AD', label: '活动数据',
          value: demo.ad || '', unit: demo.unit || '',
          rawValue: demo.rawValue !== undefined ? demo.rawValue : '',
          rawUnit: demo.rawUnit || '',
          convertFactor: demo.convertFactor || '',
          convertFormula: demo.convertFormula || '',
          convertNote: demo.convertNote || '',
          // 来源 / 佐证材料二选一：有凭证文件用 proof，无凭证用 source
          source: demo.hasProof ? '' : (demo.adSrc || ''),
          proof: demo.hasProof ? (demo.proofName || demo.adSrcDetail || '') : '',
          sourceDetail: demo.adSrcDetail || '',
          verified: true
        },
        {
          key: 'EF', label: '排放因子',
          value: demo.ef || '', unit: demo.efUnit || '',
          source: demo.efSrc || '', proof: '',
          verified: true
        }
      ]
      ;(demo.extra || []).forEach(e => {
        list.push({
          key: e.key, label: e.label,
          value: e.value || '', unit: e.unit || '',
          source: e.source || '', proof: '',
          verified: true
        })
      })
      return list
    },
    /** 按 key 取参数值 */
    getParamValue(unit, key) {
      if (!unit || !unit.params) return ''
      const p = unit.params.find(x => x.key === key)
      return p ? p.value : ''
    },
    /** 重新计算单元排放量（AD × EF × OX） */
    recalcUnitEmission(unit) {
      if (!unit) return
      const ad = parseFloat(this.getParamValue(unit, 'AD')) || 0
      const ef = parseFloat(this.getParamValue(unit, 'EF')) || 0
      const oxRaw = this.getParamValue(unit, 'OX')
      const ox = oxRaw === '' ? 1 : (parseFloat(oxRaw) || 1)
      this.$set(unit, 'emission', Math.round(ad * ef * ox * 10) / 10)
      const adP = (unit.params || []).find(p => p.key === 'AD')
      const efP = (unit.params || []).find(p => p.key === 'EF')
      if (adP) { unit.activityData = adP.value; unit.unit = adP.unit; unit.dataSource = adP.source; unit.proof = adP.proof }
      if (efP) { unit.factor = efP.value; unit.factorUnit = efP.unit; unit.factorSource = efP.source }
    },
    /** 进入编辑态（按参数 key） */
    startEdit(unit, paramKey) {
      if (!unit || !unit.params) return
      const p = unit.params.find(x => x.key === paramKey)
      if (!p) return
      this.$set(p, '_editing', true)
      this.$nextTick(() => {
        const el = document.querySelector('.param-input[data-pk="' + paramKey + '"]')
        if (el) el.focus()
      })
    },
    /** 退出编辑态 */
    endEdit(unit, paramKey) {
      if (!unit || !unit.params) return
      const p = unit.params.find(x => x.key === paramKey)
      if (!p) return
      this.$set(p, '_editing', false)
      this.recalcUnitEmission(unit)
      const oldVal = p.__old
      if (oldVal !== undefined && oldVal !== p.value) {
        if (!unit.history) this.$set(unit, 'history', [])
        unit.history.push({
          time: new Date().toLocaleString('zh-CN'),
          field: p.label,
          from: oldVal || '—',
          to: p.value || '—'
        })
        this.$message.success('已更新并记录留痕')
      }
    },
    /** 确认参数（同时解决关联校验项） */
    confirmParam(proc, unit, paramKey) {
      if (!unit || !unit.params) return
      const p = unit.params.find(x => x.key === paramKey)
      if (!p) return
      if (!p.value) {
        this.$message.warning('请先填写数值')
        return
      }
      this.$set(p, 'verified', true)
      this.recalcUnitEmission(unit)
      const procName = proc && proc.name ? proc.name : ''
      let resolved = 0
      ;(this.validationItems || []).forEach(v => {
        if (v.status === 'resolved' || v.status === 'skipped') return
        const matchProc = procName && (v.process === procName || (v.stage || '').indexOf(procName) > -1)
        const matchType = paramKey === 'AD' ? v.ioType === 'input' : v.ioType === 'output'
        if (matchProc && matchType) {
          v.status = 'resolved'
          v.statusLabel = '已确认'
          resolved++
        }
      })
      const tip = resolved ? '，已处理 ' + resolved + ' 项校验问题' : ''
      this.$message.success('已确认 ' + p.label + '：' + p.value + ' ' + (p.unit || '') + tip)
    },
    /** 取消确认 */
    unconfirmParam(proc, unit, paramKey) {
      if (!unit || !unit.params) return
      const p = unit.params.find(x => x.key === paramKey)
      if (!p) return
      this.$set(p, 'verified', false)
      const procName = proc && proc.name ? proc.name : ''
      ;(this.validationItems || []).forEach(v => {
        if (v.status !== 'resolved') return
        const matchProc = procName && (v.process === procName || (v.stage || '').indexOf(procName) > -1)
        const matchType = paramKey === 'AD' ? v.ioType === 'input' : v.ioType === 'output'
        if (matchProc && matchType) {
          v.status = 'pending'
          v.statusLabel = '待确认'
        }
      })
    },
    /** 点击参数文本：进入编辑 + 左侧引导 */
    onParamTextClick(proc, unit, paramKey, catTitle) {
      const p = (unit.params || []).find(x => x.key === paramKey)
      if (p) this.$set(p, '__old', p.value)
      this.startEdit(unit, paramKey)
      this.selectParam(proc, unit, paramKey, catTitle)
    },
    /** 参数符号样式类 */
    paramSymCls(key) {
      if (key === 'AD') return 'is-ad'
      if (key === 'EF') return 'is-ef'
      return 'is-other'
    },

    /** 演示数据：排放源品种 → 活动数据 / 单位 / 排放因子 / 来源 */
    getDemoParam(typeName) {
      const DEMO = {
        // ===== 化石燃料燃烧 =====
        '燃煤': {
          ad: '1200', unit: 't',
          rawValue: '1200.5', rawUnit: 't',
          convertNote: '原始值 1200.5 t 四舍五入至个位得 1200 t，单位一致无需换算',
          ef: '2.64', efUnit: 'tCO₂/t',
          adSrc: '能源台账（1号锅炉）', adSrcDetail: '2026年1月-12月燃煤消耗台账',
           hasProof: true, proofName: '燃煤消耗台账（扫描件）.pdf',
          efSrc: 'IPCC 2006 缺省值',
          extra: [{ key: 'OX', label: '碳氧化率', value: '0.99', unit: '', source: 'DB11/T 1787 缺省值' }]
        },
        '天然气': {
          ad: '85', unit: '万m³',
          rawValue: '852340', rawUnit: 'm³',
          convertNote: '原始值 852,340 m³ 按 1 万m³ = 10,000 m³ 换算得 85.234 万m³，四舍五入至个位得 85 万m³',
          ef: '21.62', efUnit: 'tCO₂/万m³',
          adSrc: '燃气结算单', adSrcDetail: '北京市燃气集团 2026年度结算单',
           hasProof: true, proofName: '燃气结算单（北京市燃气集团）.pdf',
          efSrc: 'GHG Protocol 缺省值',
          extra: [{ key: 'OX', label: '碳氧化率', value: '0.995', unit: '', source: 'DB11/T 1787 缺省值' }]
        },
        '柴油': {
          ad: '35', unit: 't',
          rawValue: '35420', rawUnit: 'L',
          convertNote: '原始值 35,420 L 按柴油密度 0.84 kg/L 换算得 29,752.8 kg = 29.75 t；结合库存调整后为 35 t',
          ef: '3.096', efUnit: 'tCO₂/t',
          adSrc: '燃料采购台账', adSrcDetail: '厂内车辆加油记录汇总',
           hasProof: false, proofName: '',
          efSrc: 'IPCC 2006 缺省值'
        },
        '汽油': {
          ad: '12', unit: 't',
          rawValue: '16280', rawUnit: 'L',
          convertNote: '原始值 16,280 L 按汽油密度 0.73 kg/L 换算得 11,884.4 kg = 11.88 t，四舍五入得 12 t',
          ef: '2.925', efUnit: 'tCO₂/t',
          adSrc: '加油记录', adSrcDetail: '公务车辆加油卡消费明细',
           hasProof: false, proofName: '',
          efSrc: 'IPCC 2006 缺省值'
        },
        '燃料油': {
          ad: '8', unit: 't',
          rawValue: '7980', rawUnit: 'kg',
          convertNote: '原始值 7,980 kg 换算得 7.98 t，四舍五入得 8 t',
          ef: '3.17', efUnit: 'tCO₂/t',
          adSrc: '燃料采购台账', adSrcDetail: '备用发电机燃料油采购单',
           hasProof: true, proofName: '燃料油采购合同及发票.pdf',
          efSrc: 'IPCC 2006 缺省值'
        },
        '焦炭': {
          ad: '50', unit: 't',
          rawValue: '49.6', rawUnit: 't',
          convertNote: '原始值 49.6 t 四舍五入至个位得 50 t，单位一致无需换算',
          ef: '3.14', efUnit: 'tCO₂/t',
          adSrc: '原料领用单', adSrcDetail: '铸造车间焦炭领用记录',
           hasProof: true, proofName: '焦炭领用单（扫描件）.pdf',
          efSrc: 'IPCC 2006 缺省值'
        },

        // ===== 工业生产过程 =====
        '水泥熟料生产': {
          ad: '52000', unit: 't',
          rawValue: '51986', rawUnit: 't',
          convertNote: '原始值 51,986 t 四舍五入至百位得 52,000 t，单位一致无需换算',
          ef: '0.5272', efUnit: 'tCO₂/t',
          adSrc: '生产统计报表', adSrcDetail: '2026年度熟料产量统计',
           hasProof: true, proofName: '熟料产量统计报表（盖章版）.pdf',
          efSrc: 'DB11/T 1787 附录推荐值'
        },
        '钢铁冶炼': {
          ad: '38000', unit: 't',
          rawValue: '37850', rawUnit: 't',
          convertNote: '原始值 37,850 t 四舍五入至百位得 38,000 t，单位一致无需换算',
          ef: '1.46', efUnit: 'tCO₂/t',
          adSrc: '生产统计报表', adSrcDetail: '2026年度粗钢产量统计',
           hasProof: true, proofName: '粗钢产量统计报表（盖章版）.pdf',
          efSrc: 'DB11/T 1787 附录推荐值'
        },
        '化工合成': {
          ad: '15600', unit: 't',
          rawValue: '15640', rawUnit: 't',
          convertNote: '原始值 15,640 t 四舍五入至百位得 15,600 t，单位一致无需换算',
          ef: '2.1', efUnit: 'tCO₂/t',
          adSrc: '生产统计报表', adSrcDetail: '合成氨产量统计',
           hasProof: true, proofName: '合成氨产量统计报表（盖章版）.pdf',
          efSrc: 'DB11/T 1787 附录推荐值'
        },
        '其他工艺排放': {
          ad: '2800', unit: 't',
          rawValue: '2786', rawUnit: 't',
          convertNote: '原始值 2,786 t 四舍五入至百位得 2,800 t，单位一致无需换算',
          ef: '0.85', efUnit: 'tCO₂/t',
          adSrc: '工艺记录表', adSrcDetail: '其他工艺产品产量记录',
           hasProof: false, proofName: '',
          efSrc: '行业平均'
        },

        // ===== 外购电力、热力 =====
        '净购入电力': {
          ad: '12000', unit: 'MWh',
          rawValue: '12045800', rawUnit: 'kWh',
          convertNote: '原始值 12,045,800 kWh 按 1 MWh = 1,000 kWh 换算得 12,045.8 MWh，四舍五入至百位得 12,000 MWh',
          ef: '0.5703', efUnit: 'tCO₂/MWh',
          adSrc: '电费结算单', adSrcDetail: '国网北京市电力公司 2026年度电费结算单',
           hasProof: true, proofName: '电费结算单（国网北京电力）.pdf',
          efSrc: '生态环境部区域电网因子（华北区域）'
        },
        '净购入热力（蒸汽）': {
          ad: '8500', unit: 'GJ',
          rawValue: '8462', rawUnit: 'GJ',
          convertNote: '原始值 8,462 GJ 四舍五入至百位得 8,500 GJ，单位一致无需换算',
          ef: '0.11', efUnit: 'tCO₂/GJ',
          adSrc: '热力结算单', adSrcDetail: '北京市热力集团蒸汽结算单',
           hasProof: true, proofName: '蒸汽结算单（北京市热力集团）.pdf',
          efSrc: 'DB11/T 1787 附录推荐值'
        },
        '净购入热力（热水）': {
          ad: '3200', unit: 'GJ',
          rawValue: '3186', rawUnit: 'GJ',
          convertNote: '原始值 3,186 GJ 四舍五入至百位得 3,200 GJ，单位一致无需换算',
          ef: '0.11', efUnit: 'tCO₂/GJ',
          adSrc: '热力结算单', adSrcDetail: '北京市热力集团热水结算单',
           hasProof: true, proofName: '热水结算单（北京市热力集团）.pdf',
          efSrc: 'DB11/T 1787 附录推荐值'
        },

        // ===== 其他（保留兼容）=====
        '外购冷力': {
          ad: '1500', unit: 'GJ',
          rawValue: '1498', rawUnit: 'GJ',
          convertNote: '原始值 1,498 GJ 四舍五入至百位得 1,500 GJ，单位一致无需换算',
          ef: '0.08', efUnit: 'tCO₂/GJ',
          adSrc: '冷力结算单', efSrc: '行业平均',
           hasProof: true, proofName: '冷力结算单.pdf',
        },
        '员工通勤': {
          ad: '120000', unit: '人·km',
          rawValue: '119850', rawUnit: '人·km',
          convertNote: '原始值 119,850 人·km 四舍五入至千位得 120,000 人·km',
          ef: '0.00021', efUnit: 'tCO₂/人·km',
          adSrc: '通勤统计', efSrc: '行业平均',
           hasProof: false, proofName: '',
        },
        '上游运输与配送': {
          ad: '850000', unit: 't·km',
          rawValue: '848600', rawUnit: 't·km',
          convertNote: '原始值 848,600 t·km 四舍五入至万位得 850,000 t·km',
          ef: '0.0001', efUnit: 'tCO₂/t·km',
          adSrc: '物流台账', efSrc: '行业平均',
           hasProof: false, proofName: '',
          extra: [{ key: 'DIST', label: '运输距离', value: '520', unit: 'km', source: '物流单' }]
        },
        '下游运输与配送': {
          ad: '320000', unit: 't·km',
          rawValue: '319400', rawUnit: 't·km',
          convertNote: '原始值 319,400 t·km 四舍五入至万位得 320,000 t·km',
          ef: '0.0001', efUnit: 'tCO₂/t·km',
          adSrc: '物流台账', efSrc: '行业平均',
           hasProof: false, proofName: '',
        },
        '商务差旅': {
          ad: '85000', unit: '人·km',
          rawValue: '84720', rawUnit: '人·km',
          convertNote: '原始值 84,720 人·km 四舍五入至千位得 85,000 人·km',
          ef: '0.00018', efUnit: 'tCO₂/人·km',
          adSrc: '差旅系统', efSrc: '行业平均',
           hasProof: false, proofName: '',
        },
        '运营废弃物处理': {
          ad: '280', unit: 't',
          rawValue: '276.4', rawUnit: 't',
          convertNote: '原始值 276.4 t 四舍五入至个位得 280 t，单位一致无需换算',
          ef: '0.486', efUnit: 'tCO₂/t',
          adSrc: '危废转移单', efSrc: 'IPCC 2006 缺省值',
           hasProof: true, proofName: '危废转移单（扫描件）.pdf',
        }
      };
      return DEMO[typeName] || null
    },
    /** 范围排放量汇总 */
    scopeEmission(scope) {
      if (!scope) return 0
      return (scope.categories || []).reduce((a, c) => a + this.catEmission(c), 0)
    },
    /** 大类排放量汇总 */
    catEmission(cat) {
      if (!cat) return 0
      return (cat.processes || []).reduce((a, p) => a + this.procEmission(p), 0)
    },
    /** 排放源汇总排放量：有排放单元则汇总单元，否则用排放源级 */
    procEmission(proc) {
      if (!proc) return 0
      if (proc.units && proc.units.length) {
        return proc.units.reduce((a, u) => a + (parseFloat(u.emission) || 0), 0)
      }
      return parseFloat(proc.emission) || 0
    },
    /** 排放单元 → 计算参数（AD 活动数据 / EF 排放因子，两行总是显示） */
    unitCalcParams(unit, proc) {
      const u = unit || {}
      return [
        {
          label: '活动数据',
          val: u.activityData ? u.activityData + (u.unit ? ' ' + u.unit : '') : '待填写',
          num: u.activityData || '—',
          unit: u.unit || '',
          source: u.dataSource || '',
          proof: u.proof || ''
        },
        {
          label: '排放因子',
          val: u.factor || '待匹配',
          num: u.factor || '—',
          unit: u.factorUnit || '',
          source: u.factorSource || '',
          proof: ''
        }
      ]
    },
    /** 参数符号：AD / EF / P3... */
    paramSym(ci) {
      if (ci === 0) return 'AD'
      if (ci === 1) return 'EF'
      return 'P' + (ci + 1)
    },
    /** 排放单元是否有数据 */
    unitHasData(unit) {
      return !!(unit && unit.activityData)
    },
    /** 台账 → 排放源列表（排放单元级，方法形式避免 computed 缓存） */
    getEmissionSourceList() {
      const lib = this._srcLib()
      return lib.filter(r => r.category === '设备设施' && r.enabled !== false &&
        (r.sourceCategory || r.isEmissionSource || r.hasMeteringPoint || r.isScope3))
        .map(r => ({
          id: r.id || '',
          unit: r.name || '未命名单元',
          type: r.sourceType || r.desc || '—',
          category: r.sourceCategory || '未分类',
          building: r.building || '',
          scope: r.isScope3 ? 'scope3' : ((r.hasMeteringPoint && !r.isEmissionSource) ? 'scope2' : 'scope1'),
          combustionType: r.combustionType || '',
          transportMode: r.transportMode || '',
          disposalType: r.disposalType || ''
        }))
    },
    /** 按排放源名称查计算口径 */
    getFormulaByName(name) {
      const all = this.stdProcesses || {}
      for (const k of Object.keys(all)) {
        const hit = (all[k] || []).find(o => o.name === name)
        if (hit) return hit.formula
      }
      // 未在标准枚举中：返回通用口径，避免校验报错
      return '活动数据 × 排放因子'
    },
    /** 打开材料识别弹窗 */
    openMaterialDialog() {
      this.materialDialog = true
      this.materialFiles = []
      this.recognizedSources = []
    },
    /** 选择/拖入文件 → 模拟识别 */
    onMaterialChange(file, fileList) {
      this.materialFiles = fileList || []
      const name = (file && file.name) || ''
      this.recognizing = true
      this.recognizedSources = []
      setTimeout(() => {
        this.recognizedSources = this.mockRecognize(name)
        this.recognizing = false
      }, 1000)
    },
    /** 模拟识别：按文件名关键字返回不同排放源 */
    mockRecognize(fileName) {
      const n = fileName || ''
      if (/能源|能耗|用电|电费/.test(n)) {
        return [
          { name: '天然气', category: '化石燃料燃烧', unit: '食堂灶具', checked: true },
          { name: '净购入电力', category: '净购入电力、热力排放', unit: '办公楼总表', checked: true },
          { name: '净购入热力（蒸汽）', category: '净购入电力、热力排放', unit: '厂区换热站', checked: false }
        ]
      }
      if (/设备|资产|设施/.test(n)) {
        return [
          { name: '制冷剂逃逸', category: '逃逸排放', unit: '中央空调机组', checked: true },
          { name: '灭火剂逃逸', category: '逃逸排放', unit: '消防系统', checked: false }
        ]
      }
      if (/审计|报告|碳核查/.test(n)) {
        return [
          { name: '柴油', category: '化石燃料燃烧', unit: '厂内叉车', checked: true },
          { name: '商务差旅', category: '运输与配送', unit: '销售团队', checked: true },
          { name: '运营废弃物处理', category: '废弃物处理与其他', unit: '危废暂存间', checked: false }
        ]
      }
      return [
        { name: '柴油', category: '化石燃料燃烧', unit: '厂内车辆', checked: true }
      ]
    },
    /** 确认识别结果 → 加入清单 */
    confirmRecognized() {
      const picked = (this.recognizedSources || []).filter(r => r.checked)
      if (!picked.length) {
        this.$message.warning('请至少勾选一项')
        return
      }
      const SCOPE_OF = {
        '化石燃料燃烧': 'scope1',
        '工业生产过程排放': 'scope1',
        '逃逸排放': 'scope1',
        '净购入电力、热力排放': 'scope2',
        '运输与配送': 'scope3',
        '上下游产品与服务': 'scope3',
        '废弃物处理与其他': 'scope3'
      }
      const SCOPE_NAMES = {
        scope1: '范围1 · 直接排放',
        scope2: '范围2 · 外购能源间接排放',
        scope3: '范围3 · 价值链间接排放'
      }
      const DOTS = ['sd-raw', 'sd-manu', 'sd-trans', 'sd-use', 'sd-recycle']
      let added = 0
      picked.forEach(r => {
        const scopeKey = SCOPE_OF[r.category] || 'scope1'
        // 找同范围同大类的分类
        let cat = (this.modelStages || []).find(x => x.scope === scopeKey && x.title === r.category)
        if (!cat) {
          cat = {
            key: 'cat-mat-' + Date.now() + '-' + added,
            scope: scopeKey,
            scopeName: SCOPE_NAMES[scopeKey],
            title: r.category,
            dotClass: DOTS[(this.modelStages || []).length % DOTS.length],
            processes: []
          }
          this.modelStages.push(cat)
        }
        // 找同排放源
        let proc = (cat.processes || []).find(p => p.name === r.name)
        if (!proc) {
          proc = {
            name: r.name,
            formula: this.getFormulaByName(r.name),
            allocation: '设施直接归集',
            units: [],
            inputs: [{ name: '消耗量', value: '', unit: '', factor: '', factorUnit: '', flowType: 'elementary', listType: 'activity' }],
            outputs: []
          }
          cat.processes.push(proc)
        }
        // 加排放单元（去重）
        if (!(proc.units || []).some(u => u.name === r.unit)) {
          if (!proc.units) this.$set(proc, 'units', [])
          proc.units.push({ name: r.unit })
        }
        added++
      })
      this.manualSourceCount += added
      this.$message.success('已从材料识别添加 ' + added + ' 项到核算清单')
      this.materialDialog = false
      this.recognizedSources = []
      this.materialFiles = []
    },
    getIndustryHints() {
      const industry = this.currentIndustry || ''
      const HINTS = {
        '新能源汽车制造': {
          scope1: [
            { name: '天然气', why: '涂装烘干炉 / 焊装预热' },
            { name: '柴油', why: '厂内物流车辆 / 叉车' },
            { name: '制冷剂逃逸', why: '车间空调 / 电池包测试冷却（R410A、R134a）' },
            { name: '焊接保护气', why: '焊装车间 CO₂ / 氩气' }
          ],
          scope2: [
            { name: '净购入电力', why: '冲压 / 焊装 / 涂装 / 总装四大工艺用电' },
            { name: '净购入热力（蒸汽）', why: '涂装烘干固化用蒸汽' }
          ],
          scope3: [
            { name: '上游运输与配送', why: '电池原材料 / 零部件入厂运输' },
            { name: '员工通勤', why: '厂区通勤班车' },
            { name: '商务差旅', why: '销售与技术支持差旅' }
          ]
        },
        '锂离子动力电池制造': {
          scope1: [
            { name: '天然气', why: '极片烘干 / 化成工序' },
            { name: '柴油', why: '厂内物流' }
          ],
          scope2: [
            { name: '净购入电力', why: '涂布 / 辊压 / 分容化成高耗电工序' }
          ]
        },
        '电力生产': {
          scope1: [
            { name: '燃煤', why: '燃煤发电机组锅炉' },
            { name: '天然气', why: '燃气轮机 / 启停锅炉' }
          ],
          scope2: [
            { name: '净购入电力', why: '厂用电外购部分' }
          ]
        },
        '热力生产': {
          scope1: [
            { name: '天然气', why: '燃气锅炉' },
            { name: '燃煤', why: '燃煤锅炉' }
          ],
          scope2: [
            { name: '净购入电力', why: '锅炉房辅机用电' }
          ]
        },
        '水泥制造': {
          scope1: [
            { name: '燃煤', why: '窑炉燃料' },
            { name: '水泥熟料生产', why: '碳酸盐分解过程排放' }
          ],
          scope2: [
            { name: '净购入电力', why: '生料磨 / 水泥磨 / 风机' }
          ]
        },
        '石油化工': {
          scope1: [
            { name: '天然气', why: '加热炉 / 裂解炉' },
            { name: '燃料油', why: '工艺加热' },
            { name: '化工合成', why: '化学反应过程排放' }
          ],
          scope2: [
            { name: '净购入电力', why: '压缩 / 精馏 / 泵送' },
            { name: '净购入热力（蒸汽）', why: '工艺蒸汽' }
          ]
        },
        '道路运输': {
          scope1: [
            { name: '柴油', why: '营运车辆燃料' },
            { name: '汽油', why: '小型营运车辆' }
          ],
          scope2: [
            { name: '净购入电力', why: '场站 / 充电桩用电' }
          ]
        },
        '服务业': {
          scope1: [
            { name: '天然气', why: '厨房 / 供暖锅炉' },
            { name: '柴油', why: '备用发电机' }
          ],
          scope2: [
            { name: '净购入电力', why: '照明 / 空调 / 办公设备' },
            { name: '净购入热力（热水）', why: '生活热水' }
          ]
        }
      }
      return HINTS[industry] || null
    },

    onBoundaryEdit(field) {
      // 核算范围变化 → 自动生成说明（说明只读，不允许手工编辑）
      if (field === 'unitType') {
        this.boundaryConfig.unitDetail = '化石燃料燃烧排放 + 工业生产过程排放 + 外购电力、热力隐含排放（DB11/T 1787 口径）'
      }
      // 更新重要性阈值汇总值
      if (field === 'cutoffItemThreshold' || field === 'cutoffTotalThreshold') {
        this.boundaryConfig.cutoffThreshold = this.boundaryConfig.cutoffItemThreshold + '/' + this.boundaryConfig.cutoffTotalThreshold
      }
    },
    /** 阶段2 修改数据所属期 → 同步 periodRange / 任务名 / 任务卡片 */
    onBoundaryPeriodChange(val) {
      if (!val || val.length < 2) return
      this.periodRange = [val[0], val[1]]
      this.boundaryConfig.timeBoundary = val[0] + ' - ' + val[1]
      const task = this.taskList.find(t => t.id === this.currentTaskId)
      if (task) {
        task.productName = this.buildTaskName()
        task.periodText = val[0] + ' ~ ' + val[1]
        task.updatedAt = new Date().toLocaleString('zh-CN')
        this.persistTaskList()
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
        // ① 大类下必须有排放源
        if (!stage.processes || stage.processes.length === 0) {
          issues.push(`【${stage.title}】尚未录入排放源，请从台账匹配或手动添加`)
          return
        }
        const procNames = {}
        stage.processes.forEach((proc, pi) => {
          const nm = proc.name ? proc.name.trim() : ''
          // ② 排放源名称不能为空
          if (!nm) {
            issues.push(`【${stage.title}】第 ${pi + 1} 个排放源名称为空`)
          }
          // ③ 排放源名称查重
          if (nm) {
            if (procNames[nm]) issues.push(`【${stage.title}】排放源「${nm}」名称重复`)
            procNames[nm] = true
          }
          // ④ 排放源应有计算口径
          if (!proc.formula) {
            issues.push(`【${stage.title}·${nm || '未命名'}】未设置计算口径（排放量 = 活动数据 × 排放因子）`)
          }
          // ⑤ 排放单元：非必须（可按排放源汇总填报），不做阻断校验
          const units = proc.units || []
          // ⑥ 排放单元名称查重（仅在已添加单元时校验）
          const unitNames = {}
          units.forEach(u => {
            const un = (u.name || '').trim()
            if (!un) issues.push(`【${stage.title}·${nm || '未命名'}】存在未命名的排放单元`)
            else if (unitNames[un]) issues.push(`【${stage.title}·${nm}】排放单元「${un}」名称重复`)
            else unitNames[un] = true
          })
        })
      })
      return issues
    },
  },
  mounted() {
    // 从工作台「新建核算」进入：直接开启阶段1（政策标准）
    // 从工作台点击任务卡片进入：继续该任务
    if (this.$route && this.$route.query && this.$route.query.task) {
      const tid = this.$route.query.task
      this.$nextTick(() => {
        const ok = this.continueTaskById(tid)
        const rest = Object.assign({}, this.$route.query)
        delete rest.task
        this.$router.replace({ path: this.$route.path, query: rest }).catch(() => {})
        if (!ok) this.$router.replace('/agent-center/apps/org-accounting')
      })
    }
    // 从工作台「新建核算」进入：直接开启阶段1（政策标准）
    if (this.$route && this.$route.query && this.$route.query.new) {
      this.$nextTick(() => {
        this.startNewTask()
        // 预填工作台解析出的核算时间范围
        const q = this.$route.query
        if (q.start && q.end) {
          this.periodRange = [q.start, q.end]
        }
        // 清除 query，避免刷新重复触发
        const rest = Object.assign({}, q)
        delete rest.new
        delete rest.start
        delete rest.end
        this.$router.replace({ path: this.$route.path, query: rest }).catch(() => {})
      })
    }

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
