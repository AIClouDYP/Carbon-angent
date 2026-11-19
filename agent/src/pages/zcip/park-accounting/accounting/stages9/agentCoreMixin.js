import { matchFactor, saveUserFactorOverride, normalizeQuantityAndUnit } from '@/utils/factorMatchingService'
import { loadParkStandardsForAgent, ensureSeed } from '@/utils/policyStandardService'
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
        { id: 'national-gef', name: '国家温室气体排放因子数据库', shortName: '国家因子库', origin: '中国', desc: '生态环境部发布，官方权威电网因子等核心数据', recommended: true, selected: true, version: 'v2024-Q4', releaseDate: '2024-12', standards: ['14067', '24067', 'ISO', 'GB/T'] }
      ],
      pageMode: 'task-list', // 'task-list'=任务列表模式 | 'task-active'=对话模式
      taskList: [], // 历史任务列表（localStorage持久化）
      currentTaskId: null, // 当前活跃任务ID
      newTaskProductName: '', // 新建任务-园区名称
      newTaskStandard: '', // 新建任务-核算标准
      tlDialogStep: 'welcome', // 对话流程步进: welcome | show-history
      tlInputText: '', // 初始化对话输入框
      // 历史对话栏
      showHistorySidebar: false,
      conversationHistory: [],
      currentConversationId: null,
      currentStepIndex: 0,
      selectedStandard: '零碳园区碳排放核算方法（试行）',
      standardPickerOpen: false,   // 标准切换列表展开态
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
      // 园区基础信息（阶段2 核算主体）
      parkBasicInfo: {
        name: '北京亦庄新城零碳智能产业园',
        area: '12.5'
      },

      // ===== 阶段3 排放源清单（四大法定分类）=====
      emissionSources: [
        // ① 化石燃料燃烧（单向：燃料输入，无 IO 分区）
        { id: 1, name: '天然气', category: '化石燃料燃烧', channel: '材料识别',
          role: 'input', roleLabel: '燃料输入',
          channelDetail: '燃气结算发票与抄表底单 OCR 解析', enabled: true },
        { id: 2, name: '柴油', category: '化石燃料燃烧', channel: '材料识别',
          role: 'input', roleLabel: '燃料输入',
          channelDetail: '加油卡月度对账单解析（柴油台账）', enabled: true },

        // ② 能源加工转换（双向：支持多个输入项 + 多个输出项，仅名称/单位）
        { id: 3, name: '天然气制热与蒸汽供应', category: '能源加工转换', channel: '底座数据识别',
          role: 'both', roleLabel: '投入 + 产出',
          channelDetail: '', detailUnsupported: true, enabled: true,
          inputs: [
            { id: 'IN-3-1', name: '天然气' },
            { id: 'IN-3-2', name: '外购电力' }
          ],
          outputs: [
            { id: 'OUT-3-1', name: '蒸汽' },
            { id: 'OUT-3-2', name: '热水' }
          ]
        },

        // ③ 净购入电力热力（按流向，各自支持多个 IO）
        { id: 5, name: '公共电网受入电力', category: '净购入电力热力', channel: '底座数据识别',
          role: 'input', roleLabel: '购入（输入）',
          channelDetail: '', detailUnsupported: true, enabled: true,
          inputs: [
            { id: 'IN-5-1', name: '电力' }
          ],
          outputs: []
        },
        { id: 6, name: '企业专线受入电力', category: '净购入电力热力', channel: '底座数据识别',
          role: 'input', roleLabel: '购入（输入）',
          channelDetail: 'EMS 变配电系统高压侧专用测点直连', enabled: true,
          inputs: [
            { id: 'IN-6-1', name: '电力' }
          ],
          outputs: []
        },
        { id: 7, name: '屋顶光伏自发自用电力', category: '净购入电力热力', channel: '底座数据识别',
          role: 'output', roleLabel: '自供（输出）',
          channelDetail: '光伏逆变器并网电表群直连（按零碳属性核减）', enabled: true,
          inputs: [],
          outputs: [
            { id: 'OUT-7-1', name: '光伏电力' }
          ]
        },
        { id: 8, name: '绿电直供与绿证核销电力', category: '净购入电力热力', channel: '材料识别',
          role: 'output', roleLabel: '核减（输出）',
          channelDetail: '北京电力交易中心消纳凭证与绿证核销台账', enabled: true,
          inputs: [],
          outputs: [
            { id: 'OUT-8-1', name: '绿电' }
          ]
        },

        // ④ 工业过程（单向：产品产出，无 IO 分区）
        { id: 9, name: '12英寸集成电路芯片', category: '工业过程', channel: '材料识别',
          role: 'output', roleLabel: '产品产出',
          channelDetail: '晶圆月度产量台账与电子特气排污报告', enabled: true },
        { id: 10, name: '动力锂电池单体电芯', category: '工业过程', channel: '材料识别',
          role: 'output', roleLabel: '产品产出',
          channelDetail: '电芯下线台账与溶剂挥发物监测记录', enabled: true }
      ],
      // 物料/能源库（阶段3 输入输出项选择用）
      materialLibrary: [
        // 能源类
        '天然气', '柴油', '汽油', '燃料油', '焦炭', '燃煤',
        '电力', '外购电力', '光伏电力', '风电', '绿电',
        '蒸汽', '热水', '冷力', '压缩空气',
        // 工业物料
        '天然气制热与蒸汽供应', '水泥熟料', '粗钢', '合成氨',
        // 其他
        '其他物料'
      ],
      // ===== 阶段5 排放因子匹配 =====
      factorMatchList: [
        // ① 化石燃料燃烧（EF 排放因子 + CEF 折标煤系数）
        { id: 1, name: '天然气', category: '化石燃料燃烧', channel: '材料识别',
          factors: [
            { key: 'EF', name: '排放因子', value: '2.16', unit: 'tCO₂/t',
              source: 'IPCC 2006', sourceDetail: 'IPCC 缺省值（低位热值 389.31 GJ/万Nm³ × 含碳量 15.3 tC/TJ × 氧化率 99% × 44/12）',
              confidence: '高', verified: true },
            { key: 'CEF', name: '折标煤系数', value: '1.33', unit: 'kgce/m³',
              source: 'GB/T 2589', sourceDetail: 'GB/T 2589 综合能耗计算通则（天然气 1.3300 kgce/m³）',
              confidence: '高', verified: true }
          ] },
        { id: 2, name: '柴油', category: '化石燃料燃烧', channel: '材料识别',
          factors: [
            { key: 'EF', name: '排放因子', value: '3.10', unit: 'tCO₂/t',
              source: 'DB11/T 1787', sourceDetail: 'DB11/T 1787 缺省值（低位热值 43.33 GJ/t × 含碳量 20.2 tC/TJ × 氧化率 99% × 44/12）',
              confidence: '高', verified: true },
            { key: 'CEF', name: '折标煤系数', value: '1.4571', unit: 'kgce/kg',
              source: 'GB/T 2589', sourceDetail: 'GB/T 2589 综合能耗计算通则（柴油 1.4571 kgce/kg）',
              confidence: '高', verified: true }
          ] },

        // ② 能源加工转换（EF 转换因子 + CEF 折标煤系数）
        { id: 3, name: '天然气制热与蒸汽供应', category: '能源加工转换', channel: '底座数据识别',
          // 投入侧因子
          inputs: [
            { id: 'IN-3-1', name: '天然气', factors: [
              { key: 'EF', name: '投入排放因子', value: '0.11', unit: 'tCO₂/GJ',
                source: '国家温室气体清单', sourceDetail: '国家温室气体清单 天然气分部门转换因子（投入侧）',
                confidence: '中', verified: true },
              { key: 'CEF', name: '折标煤系数', value: '1.33', unit: 'kgce/m³',
                source: 'GB/T 2589', sourceDetail: 'GB/T 2589 天然气 1.33 kgce/m³',
                confidence: '高', verified: true }
            ] },
            { id: 'IN-3-2', name: '外购电力', factors: [
              { key: 'EF', name: '投入排放因子', value: '0.6101', unit: 'tCO₂/MWh',
                source: '华北电网', sourceDetail: '华北区域电网 2022 年平均排放因子（投入侧）',
                confidence: '高', verified: true },
              { key: 'CEF', name: '折标煤系数', value: '0.1229', unit: 'kgce/kWh',
                source: 'GB/T 2589', sourceDetail: 'GB/T 2589 电力当量值 0.1229 kgce/kWh',
                confidence: '高', verified: true }
            ] }
          ],
          // 产出侧因子（计算时按负值扣减）
          outputs: [
            { id: 'OUT-3-1', name: '蒸汽', factors: [
              { key: 'EF', name: '产出扣减因子', value: '0.11', unit: 'tCO₂/GJ',
                source: '国家温室气体清单', sourceDetail: '产出蒸汽按投入侧转换因子折减（避免重复计入）',
                confidence: '中', verified: true }
            ] },
            { id: 'OUT-3-2', name: '热水', factors: [
              { key: 'EF', name: '产出扣减因子', value: '0.11', unit: 'tCO₂/GJ',
                source: '国家温室气体清单', sourceDetail: '产出热水按投入侧转换因子折减（避免重复计入）',
                confidence: '中', verified: true }
            ] }
          ] },

        // ③ 净购入电力热力（EF 电网因子 + CEF 折标煤系数）
        { id: 5, name: '公共电网受入电力', category: '净购入电力热力', channel: '底座数据识别',
          factors: [
            { key: 'EF', name: '电网排放因子', value: '0.6101', unit: 'tCO₂/MWh',
              source: '华北电网', sourceDetail: '生态环境部 华北区域电网 2022 年平均排放因子',
              confidence: '高', verified: true },
            { key: 'CEF', name: '折标煤系数', value: '0.1229', unit: 'kgce/kWh',
              source: 'GB/T 2589', sourceDetail: 'GB/T 2589 综合能耗计算通则（电力当量值 0.1229 kgce/kWh）',
              confidence: '高', verified: true }
          ] },
        { id: 6, name: '企业专线受入电力', category: '净购入电力热力', channel: '底座数据识别',
          factors: [
            { key: 'EF', name: '电网排放因子', value: '0.6101', unit: 'tCO₂/MWh',
              source: '华北电网', sourceDetail: '生态环境部 华北区域电网 2022 年平均排放因子',
              confidence: '高', verified: true },
            { key: 'CEF', name: '折标煤系数', value: '0.1229', unit: 'kgce/kWh',
              source: 'GB/T 2589', sourceDetail: 'GB/T 2589 综合能耗计算通则（电力当量值 0.1229 kgce/kWh）',
              confidence: '高', verified: true }
          ] },
        { id: 7, name: '屋顶光伏自发自用电力', category: '净购入电力热力', channel: '底座数据识别',
          factors: [
            { key: 'EF', name: '电网排放因子（核减）', value: '0', unit: 'tCO₂/MWh',
              source: '零碳园区核算方法', sourceDetail: '光伏自发自用电力，零碳属性全额核减',
              confidence: '高', verified: true },
            { key: 'CEF', name: '折标煤系数', value: '0.1229', unit: 'kgce/kWh',
              source: 'GB/T 2589', sourceDetail: 'GB/T 2589 综合能耗计算通则（电力当量值 0.1229 kgce/kWh）',
              confidence: '高', verified: true }
          ] },
        { id: 8, name: '绿电直供与绿证核销电力', category: '净购入电力热力', channel: '材料识别',
          factors: [
            { key: 'EF', name: '电网排放因子（核减）', value: '0', unit: 'tCO₂/MWh',
              source: '零碳园区核算方法', sourceDetail: '绿电直供与绿证核销，按零碳属性核减',
              confidence: '高', verified: true },
            { key: 'CEF', name: '折标煤系数', value: '0.1229', unit: 'kgce/kWh',
              source: 'GB/T 2589', sourceDetail: 'GB/T 2589 综合能耗计算通则（电力当量值 0.1229 kgce/kWh）',
              confidence: '高', verified: true }
          ] },

        // ④ 工业过程（仅 EF，不计入综合能耗）
        { id: 9, name: '12英寸集成电路芯片', category: '工业过程', channel: '材料识别',
          factors: [
            { key: 'EF', name: '过程排放因子', value: '0.0284', unit: 'tCO₂/万片',
              source: 'IPCC 2006', sourceDetail: '含氟温室气体（NF₃/CF₄）按 GWP 折算',
              confidence: '中', verified: false }
          ] },
        { id: 10, name: '动力锂电池单体电芯', category: '工业过程', channel: '材料识别',
          factors: [
            { key: 'EF', name: '过程排放因子', value: '0.1450', unit: 'tCO₂/GWh',
              source: 'IPCC 2006', sourceDetail: '溶剂挥发物（NMP）按 GWP 折算',
              confidence: '中', verified: true }
          ] }
      ],


      // ===== 阶段4 活动数据（按排放源录入）=====
      // 每项：{ id, name, category, channel, value, unit, source, verified }
      activityDataList: [
        // ① 化石燃料燃烧（三层：类别→项目→参数表）
        {
          id: 1, name: '天然气', category: '化石燃料燃烧', channel: '材料识别',
          params: [
            { key: 'AD', label: '直接燃烧量', value: '779800', unit: 'm³',
              rawValue: '779800', rawUnit: 'm³', source: '燃气结算发票与抄表底单 OCR 解析（已扣除锅炉转换用气）', verified: true }
          ]
        },
        {
          id: 2, name: '柴油', category: '化石燃料燃烧', channel: '材料识别',
          params: [
            { key: 'AD', label: '消耗量', value: '16280', unit: 'L',
              rawValue: '13.6', rawUnit: 't', source: '加油卡月度对账单解析（柴油台账）', verified: false }
          ]
        },

        // ② 能源加工转换（五层：类别→项目→输入/输出分组→物料→参数表）
        {
          id: 3, name: '天然气制热与蒸汽供应', category: '能源加工转换', channel: '底座数据识别',
          inputs: [
            { id: 'IN-3-1', name: '天然气', params: [
              { key: 'AD', label: '消耗量', value: '84620', unit: 'GJ',
                rawValue: '8462000', rawUnit: 'MJ', source: '底座数据直连（燃气流量计）', verified: true }
            ] },
            { id: 'IN-3-2', name: '外购电力', params: [
              { key: 'AD', label: '消耗量', value: '1200', unit: 'kWh',
                rawValue: '1200000', rawUnit: 'Wh', source: '底座数据直连（电表）', verified: true }
            ] }
          ],
          outputs: [
            { id: 'OUT-3-1', name: '蒸汽', params: [
              { key: 'AD', label: '产出量', value: '5200', unit: 'GJ',
                rawValue: '5200', rawUnit: 'GJ', source: '底座数据直连（蒸汽计量）', verified: true }
            ] },
            { id: 'OUT-3-2', name: '热水', params: [
              { key: 'AD', label: '产出量', value: '1800', unit: 'GJ',
                rawValue: '1800', rawUnit: 'GJ', source: '底座数据直连（热水计量）', verified: true }
            ] }
          ]
        },

        // ③ 净购入电力热力（五层）
        {
          id: 5, name: '公共电网受入电力', category: '净购入电力热力', channel: '底座数据识别',
          inputs: [
            { id: 'IN-5-1', name: '电力', params: [
              { key: 'AD', label: '购入量', value: '12045800', unit: 'kWh',
                rawValue: '1204.58', rawUnit: '万kWh', source: '国网关口表直连', verified: true }
            ] }
          ],
          outputs: []
        },
        {
          id: 6, name: '企业专线受入电力', category: '净购入电力热力', channel: '底座数据识别',
          inputs: [
            { id: 'IN-6-1', name: '电力', params: [
              { key: 'AD', label: '购入量', value: '3460000', unit: 'kWh',
                rawValue: '346', rawUnit: '万kWh', source: 'EMS 变配电系统高压侧专用测点直连', verified: true }
            ] }
          ],
          outputs: []
        },
        {
          id: 7, name: '屋顶光伏自发自用电力', category: '净购入电力热力', channel: '底座数据识别',
          inputs: [],
          outputs: [
            { id: 'OUT-7-1', name: '光伏电力', params: [
              { key: 'AD', label: '自发自用量', value: '1820000', unit: 'kWh',
                rawValue: '182', rawUnit: '万kWh', source: '光伏逆变器并网电表群直连', verified: true }
            ] }
          ]
        },
        {
          id: 8, name: '绿电直供与绿证核销电力', category: '净购入电力热力', channel: '材料识别',
          inputs: [],
          outputs: [
            { id: 'OUT-8-1', name: '绿电', params: [
              { key: 'AD', label: '核销量', value: '560000', unit: 'kWh',
                rawValue: '56', rawUnit: '万kWh', source: '北京电力交易中心消纳凭证与绿证核销台账', verified: true }
            ] }
          ]
        },

        // ④ 工业过程（三层）
        {
          id: 9, name: '12英寸集成电路芯片', category: '工业过程', channel: '材料识别',
          params: [
            { key: 'AD', label: '产量', value: '2600', unit: '万片',
              rawValue: '2600', rawUnit: '万片', source: '晶圆月度产量台账与电子特气排污报告', verified: true }
          ]
        },
        {
          id: 10, name: '动力锂电池单体电芯', category: '工业过程', channel: '材料识别',
          params: [
            { key: 'AD', label: '产量', value: '82', unit: 'GWh',
              rawValue: '82000', rawUnit: 'MWh', source: '电芯下线台账与溶剂挥发物监测记录', verified: true }
          ]
        }
      ],

      // 阶段3 子页签：'sources'（碳排放源清单）| 'ledgers'（其他计算参数清单）
      stage3SubTab: 'sources',

      // 其他计算参数清单：按评价指标分组的全部输入参数
      // 渠道三值：底座数据识别 / 材料识别 / 系统汇总
      indicatorParamList: [
        { key: 'carbonPerTce', name: '单位能耗碳排放', type: 'core', params: [
          { id: 'P01-1', name: '园区综合碳排放量', channel: '系统汇总', channelDetail: '由排放源清单各品种核算结果自动汇总',
            value: '', unit: '万吨CO₂', rawValue: '', rawUnit: '', source: '待排放计算后自动汇总', verified: true, readonly: true, pending: true, },
          { id: 'P01-2', name: '园区综合能耗量', channel: '系统汇总', channelDetail: '全区电力、天然气、蒸汽折标煤自动汇总',
            value: '', unit: 'tce', rawValue: '', rawUnit: '', source: '活动数据折标汇总', verified: true, readonly: true, pending: true },
        ] },
        { key: 'cleanEnergyRatio', name: '清洁能源消费比重', type: 'guided', params: [
          { id: 'P02-1', name: '非化石能源折标消纳量', channel: '系统汇总', channelDetail: '由排放源清单光伏自发自用与绿电直供电量折标汇总',
            value: '', unit: 'tce', rawValue: '', rawUnit: '', source: '待光伏与绿电折标', verified: true, readonly: true, pending: true, },
          { id: 'P02-2', name: '园区综合能耗量', channel: '系统汇总', channelDetail: '同单位能耗碳排放分母',
            value: '', unit: 'tce', rawValue: '', rawUnit: '', source: '活动数据折标汇总', verified: true, readonly: true, pending: true },
        ] },
        { key: 'productEnergyLimitRatio', name: '产品能效达标比例', type: 'guided', params: [
          { id: 'P03-1', name: '能效达标产品类型数量', channel: '材料识别', channelDetail: '能效检测审计报告按产品类型判定达标',
            value: '2', unit: '类', rawValue: '2', rawUnit: '类', source: '能效检测审计报告', verified: true, readonly: false },
          { id: 'P03-2', name: '产品类型总数', channel: '系统汇总', channelDetail: '统计工业过程类别下的产品数量',
            value: '', unit: '类', rawValue: '', rawUnit: '', source: '排放源清单工业过程产品自动统计', verified: true, readonly: true, autoCount: 'productCount' },
        ] },
        { key: 'solidWasteRatio', name: '工业固废综合利用率', type: 'guided', params: [
          { id: 'P04-1', name: '固废综合利用量', channel: '材料识别', channelDetail: '转移联单与资源化利用合同解析',
            value: '12480', unit: 't', rawValue: '12480', rawUnit: 't', source: '固废转移联单与资源化合同', verified: true, readonly: false },
          { id: 'P04-2', name: '固废产生总量', channel: '材料识别', channelDetail: '出厂地磅电子称重单解析',
            value: '15360', unit: 't', rawValue: '15360', rawUnit: 't', source: '出厂地磅电子称重单', verified: true, readonly: false }
        ] },
        { key: 'wasteHeatUtilRatio', name: '工业余能利用率', type: 'guided', params: [
          { id: 'P05-1', name: '余热已利用量', channel: '底座数据识别', channelDetail: '余热回收计量表直连（本园区消纳）',
            value: '2860', unit: 'GJ', rawValue: '2860000', rawUnit: 'MJ', source: '余热回收计量表直连', verified: true, readonly: false },
          { id: 'P05-2', name: '余热理论可回收量', channel: '材料识别', channelDetail: '余能资源评估报告核定（受技术经济限制，不计入部分除外）',
            value: '4200', unit: 'GJ', rawValue: '4200', rawUnit: 'GJ', source: '余能资源评估报告', verified: true, readonly: false },
          { id: 'P05-3', name: '余冷已利用量', channel: '底座数据识别', channelDetail: '冷量计量直连（本园区消纳）',
            value: '680', unit: 'GJ', rawValue: '680', rawUnit: 'GJ', source: '冷量计量表直连', verified: true, readonly: false },
          { id: 'P05-4', name: '余冷理论可回收量', channel: '材料识别', channelDetail: '余能资源评估报告核定',
            value: '980', unit: 'GJ', rawValue: '980', rawUnit: 'GJ', source: '余能资源评估报告', verified: true, readonly: false },
          { id: 'P05-5', name: '余压已利用量', channel: '底座数据识别', channelDetail: '余压发电测点直连（本园区消纳）',
            value: '420', unit: 'GJ', rawValue: '420', rawUnit: 'GJ', source: '余压发电测点直连', verified: true, readonly: false },
          { id: 'P05-6', name: '余压理论可回收量', channel: '材料识别', channelDetail: '余能资源评估报告核定',
            value: '650', unit: 'GJ', rawValue: '650', rawUnit: 'GJ', source: '余能资源评估报告', verified: true, readonly: false }
        ] },
        { key: 'waterRecycleRatio', name: '中水回用率', type: 'guided', params: [
          { id: 'P06-1', name: '中水利用量', channel: '底座数据识别', channelDetail: '中水回用管网流量计直连',
            value: '186000', unit: 't', rawValue: '18.6', rawUnit: '万t', source: '中水回用管网流量计', verified: true, readonly: false },
          { id: 'P06-2', name: '具备回用条件总用水量', channel: '底座数据识别', channelDetail: '市政中水进水总表直连',
            value: '220000', unit: 't', rawValue: '22', rawUnit: '万t', source: '市政中水进水总表', verified: true, readonly: false }
        ] }
      ],

      // 排放源分类筛选
      // 排放源对话框
      sourceDialogVisible: false,
      sourceDialogMode: 'add',
      sourceForm: { id: null, name: '', category: '化石燃料燃烧', channel: '材料识别', channelDetail: '' },

      // ===== 阶段4 参数详情抽屉 =====

      // 阶段4 待确认项高亮
      highlightPid: null,

      // 阶段5 因子详情抽屉

      factorTraceVisible: false,

      factorTraceRow: null,

      factorTraceCtx: null,


      actTraceVisible: false,

      actTraceRow: null,

      actTraceCtx: null,


      // 底座数据同步状态

      // 阶段7 树形展开状态

      calcTreeExpanded: {},

      // 阶段6 子页签：validation（待补充/待确认）| quality（质量评估）| list（数据清单）

      parkQaTab: 'validation',

      baseSyncDone: false,

      baseSyncCount: 0,


      sourceCategoryFilter: 'all',
      sourceChannelFilter: 'all',

      boundaryConfig: {
        lifecycleScope: 'cradle-to-grave',
        unitType: 'declaration',
        unitDetail: '1辆汽车（排量1.6L，整备质量1850kg，设计寿命15年/20万公里）',
        allocationRule: 'mass',
        cutoffThreshold: '1%/5%',
        cutoffItemThreshold: '1%',
        cutoffTotalThreshold: '5%',
        timeBoundary: '2024-01-01 - 2024-12-31'
      },
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
        { key: 'EMISSION_SOURCES', name: '排放源清单', label: '清单', icon: 'el-icon-s-order', desc: '四大法定分类排放源清单与数据渠道确认' },
        { key: 'ACTIVITY_DATA', name: '活动数据', label: '数据', icon: 'el-icon-s-data', desc: '多源活动数据并发采集' },
        { key: 'CALCULATION_FACTORS', name: '排放因子', label: '因子', icon: 'el-icon-connection', desc: '排放因子库自动匹配绑定' },
        { key: 'DATA_VERIFICATION', name: '数据校验', label: '校验', icon: 'el-icon-warning-outline', desc: '完整性、一致性、趋势、DQR多重校验' },
        { key: 'CARBON_CALCULATION', name: '排放计算', label: '计算', icon: 'el-icon-cpu', desc: '园区能源/工业/交通/建筑分项核算模型搭建' },
        { key: 'CARBON_ANALYSIS', name: '排放分析', label: '分析', icon: 'el-icon-data-line', desc: '统计分析、不确定性分析与敏感度分析' },
        { key: 'CARBON_REPORT', name: '排放报告', label: '报告', icon: 'el-icon-document', desc: '核算报告生成、数据溯源与核查推荐' }
      ],
      // ===== 标准配置中心 =====
      // R040201 STORY-010（RULE-013）：标准唯一来源为政策标准库（PCF 场景已生效配置），
      // 库内新增/更新标准后此处自动获取，无需修改代码。形状与原硬编码完全兼容。
      standards: loadParkStandardsForAgent(),
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
      validationActiveTab: 'validation',
      validationItems: this.createDefaultValidationItems(),
      supplementFiles: []
    }
  },
  computed: {

    /** 阶段7：树形计算结果（分类 → 排放源 → 参数行，只显示值） */
    parkCalcTree() {
      const calc = this.parkEmissionCalc
      const facList = this.factorMatchList || []
      const actList = this.activityDataList || []

      const groups = (calc.groups || []).map(g => {
        const sources = []

        // 按排放源聚合（从 parkEmissionCalc 的 srcGroups 取）
        ;(g.srcGroups || []).forEach(sg => {
          const srcName = sg.name
          const actSrc = actList.find(x => x.name === srcName) || {}
          const facSrc = facList.find(x => x.name === srcName) || {}
          const params = []

          // 活动数据参数
          const pushParams = (arr, label) => {
            ;(arr || []).forEach(mat => {
              ;(mat.params || []).forEach(pp => {
                params.push({
                  key: 'AD',
                  label: (mat && mat.name ? mat.name + ' · ' : '') + (pp.label || ''),
                  value: pp.value,
                  unit: pp.unit,
                  source: pp.source || ''
                })
              })
            })
          }
          pushParams(actSrc.params)
          pushParams(actSrc.inputs)
          pushParams(actSrc.outputs)

          // 因子参数
          const pushFactors = (factors) => {
            ;(factors || []).forEach(f => {
              params.push({
                key: f.key,
                label: f.name,
                value: f.value,
                unit: f.unit,
                source: f.source || ''
              })
            })
          }
          pushFactors(facSrc.factors)
          ;(facSrc.inputs || []).forEach(io2 => pushFactors(io2.factors))
          ;(facSrc.outputs || []).forEach(io2 => pushFactors(io2.factors))

          sources.push({
            key: 'src-' + srcName,
            name: srcName,
            emission: sg.subtotal,
            params,
            expanded: false
          })
        })

        return {
          key: 'cat-' + g.key,
          name: g.key,
          icon: g.icon,
          color: g.color,
          emission: g.subtotal,
          sources,
          expanded: true
        }
      })

      // 追加「指标参数」分类（每个指标一个子节点）
      const indGroups = (this.parkIndicatorCalc.groups || []).map(ig => {
        const params = ig.rows.map(r => ({
          key: 'AD',
          label: r.name,
          value: r.value,
          unit: r.unit,
          source: r.inputDetail || ''
        }))
        // 结果行也作为参数展示
        params.push({
          key: 'AD',
          label: ig.result.name + '（结果）',
          value: ig.result.value,
          unit: ig.result.unit,
          source: ''
        })
        return {
          key: 'ind-' + ig.key,
          name: ig.key,
          emission: ig.result.value,
          emissionUnit: ig.result.unit,
          isIndicator: true,
          params,
          expanded: false
        }
      })

      groups.push({
        key: 'cat-indicator',
        name: '指标参数',
        icon: 'el-icon-data-analysis',
        color: '#0067fe',
        emission: null,
        sources: indGroups,
        expanded: true,
        isIndicatorGroup: true
      })

      return { groups, total: calc.total }
    },

    /** 阶段7：指标参数计算结果（按指标分组） */
    parkIndicatorCalc() {
      const calc = this.parkEmissionCalc
      const totalEmission = calc.total
      const totalEnergy = this.parkTotalEnergy

      // ===== 公共因子：非化石能源 =====
      let nonFossilKwh = 0
      const nonFossilNames = []
      ;(this.activityDataList || []).forEach(src => {
        if (src.category !== '净购入电力热力') return
        if (!/光伏|绿电/.test(src.name)) return
        const collect = (arr) => {
          ;(arr || []).forEach(mat => {
            ;(mat.params || []).forEach(pp => {
              const v = parseFloat(pp.value) || 0
              const u = (pp.unit || '').toLowerCase()
              const kwh = u === '万kwh' ? v * 10000 : v
              if (kwh > 0) {
                nonFossilKwh += kwh
                nonFossilNames.push(`${src.name} ${this.formatNum(v)} ${pp.unit}`)
              }
            })
          })
        }
        collect(src.params)
        collect(src.inputs)
        collect(src.outputs)
      })
      const nonFossilTce = nonFossilKwh * 0.1229 / 1000

      const products = (this.emissionSources || []).filter(x => x.category === '工业过程')
      const productCount = products.length

      // 从指标参数读取各引导指标参数值
      const getP = (id) => {
        let v = 0
        ;(this.indicatorParamList || []).forEach(g => {
          ;(g.params || []).forEach(pp => {
            if (pp.id === id) v = parseFloat(pp.value) || 0
          })
        })
        return v
      }
      const effPassCount = getP('P03-1')          // 能效达标产品数
      const solidUsed = getP('P04-1')             // 固废综合利用量
      const solidTotal = getP('P04-2')            // 固废产生总量
      const heatUsed = getP('P05-1')              // 余热已利用
      const heatTotal = getP('P05-2')             // 余热理论可回收
      const coldUsed = getP('P05-3')              // 余冷已利用
      const coldTotal = getP('P05-4')             // 余冷理论可回收
      const pressUsed = getP('P05-5')             // 余压已利用
      const pressTotal = getP('P05-6')            // 余压理论可回收
      const waterUsed = getP('P06-1')             // 中水利用量
      const waterTotal = getP('P06-2')            // 具备回用条件总用水量

      const solidRatio = solidTotal > 0 ? (solidUsed / solidTotal * 100) : 0
      const wasteEnergyUsed = heatUsed + coldUsed + pressUsed
      const wasteEnergyTotal = heatTotal + coldTotal + pressTotal
      const wasteEnergyRatio = wasteEnergyTotal > 0 ? (wasteEnergyUsed / wasteEnergyTotal * 100) : 0
      const waterRatio = waterTotal > 0 ? (waterUsed / waterTotal * 100) : 0
      const carbonPerTce = totalEnergy > 0 ? totalEmission / totalEnergy : 0
      const cleanRatio = totalEnergy > 0 ? (nonFossilTce / totalEnergy * 100) : 0

      const energyDetail = (this.parkEnergyDetail || [])
      const energyInputText = energyDetail.length
        ? energyDetail.slice(0, 2).map(x => `${x.mat} ${this.formatNum(x.value)} ${x.unit}`).join(' + ') + (energyDetail.length > 2 ? ` 等 ${energyDetail.length} 项` : '')
        : '—'

      // ===== 按指标分组 =====
      const groups = [
        {
          key: '单位能耗碳排放',
          badge: '核心硬指标',
          color: '#15803d',
          // 该指标的计算参数
          rows: [
            {
              name: '园区综合碳排放量',
              input: `${this.formatNum(totalEmission)} tCO₂`,
              inputDetail: calc.groups.map(g => `${g.key} ${g.subtotal.toFixed(2)}`).join(' + '),
              convert: 'Σ 四大分类',
              factor: '—',
              factorUnit: '',
              value: (totalEmission / 10000).toFixed(2),
              unit: '万吨CO₂'
            },
            {
              name: '园区综合能耗量',
              input: energyInputText,
              inputDetail: energyDetail.map(x => `${x.mat} ${x.value} ${x.unit} × ${x.cef} = ${x.tce} tce`).join('；'),
              convert: '折标汇总',
              factor: 'CEF',
              factorUnit: 'kgce/单位',
              value: this.formatNum(totalEnergy),
              unit: 'tce'
            }
          ],
          // 指标结果
          result: {
            name: '单位能耗碳排放',
            formula: `${this.formatNum(totalEmission)} tCO₂ ÷ ${this.formatNum(totalEnergy)} tce`,
            value: carbonPerTce.toFixed(3),
            unit: 'tCO₂/tce'
          }
        },
        {
          key: '清洁能源消费比重',
          badge: '引导指标',
          color: '#0369a1',
          rows: [
            {
              name: '非化石能源折标消纳量',
              input: `${this.formatNum(nonFossilKwh)} kWh`,
              inputDetail: nonFossilNames.join(' + ') || '无光伏/绿电数据',
              convert: '÷ 1000',
              factor: '0.1229',
              factorUnit: 'kgce/kWh',
              value: this.formatNum(nonFossilTce),
              unit: 'tce'
            },
            {
              name: '园区综合能耗量',
              input: energyInputText,
              inputDetail: '同核心指标分母',
              convert: '折标汇总',
              factor: 'CEF',
              factorUnit: 'kgce/单位',
              value: this.formatNum(totalEnergy),
              unit: 'tce'
            }
          ],
          result: {
            name: '清洁能源消费比重',
            formula: `${this.formatNum(nonFossilTce)} tce ÷ ${this.formatNum(totalEnergy)} tce × 100%`,
            value: cleanRatio.toFixed(1),
            unit: '%'
          }
        },
        {
          key: '产品能效达标比例',
          badge: '引导指标',
          color: '#7c3aed',
          rows: [
            {
              name: '能效达标产品类型数量',
              input: `${effPassCount} 类`,
              inputDetail: '能效检测审计报告按产品类型判定达标',
              convert: '材料识别',
              factor: '—',
              factorUnit: '',
              value: String(effPassCount),
              unit: '类'
            },
            {
              name: '产品类型总数',
              input: `${productCount} 项工业过程产品`,
              inputDetail: products.map(x => x.name).join('、') || '无',
              convert: '计数',
              factor: '—',
              factorUnit: '',
              value: String(productCount),
              unit: '类'
            }
          ],
          result: {
            name: '产品能效达标比例',
            formula: `${effPassCount} 类 ÷ ${productCount} 类 × 100%`,
            value: productCount > 0 ? (effPassCount / productCount * 100).toFixed(0) : '0',
            unit: '%'
          }
        },
        {
          key: '工业固废综合利用率',
          badge: '引导指标',
          color: '#0d9488',
          rows: [
            {
              name: '固废综合利用量',
              input: `${this.formatNum(solidUsed)} t`,
              inputDetail: '固废转移联单与资源化利用合同',
              convert: '材料识别',
              factor: '—',
              factorUnit: '',
              value: this.formatNum(solidUsed),
              unit: 't'
            },
            {
              name: '固废产生总量',
              input: `${this.formatNum(solidTotal)} t`,
              inputDetail: '出厂地磅电子称重单',
              convert: '材料识别',
              factor: '—',
              factorUnit: '',
              value: this.formatNum(solidTotal),
              unit: 't'
            }
          ],
          result: {
            name: '工业固废综合利用率',
            formula: `${this.formatNum(solidUsed)} t ÷ ${this.formatNum(solidTotal)} t × 100%`,
            value: solidRatio.toFixed(1),
            unit: '%'
          }
        },
        {
          key: '工业余能利用率',
          badge: '引导指标',
          color: '#0891b2',
          rows: [
            {
              name: '余热/余冷/余压已利用量',
              input: `${this.formatNum(wasteEnergyUsed)} GJ`,
              inputDetail: `余热 ${this.formatNum(heatUsed)} + 余冷 ${this.formatNum(coldUsed)} + 余压 ${this.formatNum(pressUsed)} GJ`,
              convert: '计量表直连',
              factor: '—',
              factorUnit: '',
              value: this.formatNum(wasteEnergyUsed),
              unit: 'GJ'
            },
            {
              name: '余热/余冷/余压理论可回收量',
              input: `${this.formatNum(wasteEnergyTotal)} GJ`,
              inputDetail: `余热 ${this.formatNum(heatTotal)} + 余冷 ${this.formatNum(coldTotal)} + 余压 ${this.formatNum(pressTotal)} GJ`,
              convert: '资源评估报告',
              factor: '—',
              factorUnit: '',
              value: this.formatNum(wasteEnergyTotal),
              unit: 'GJ'
            }
          ],
          result: {
            name: '工业余能利用率',
            formula: `${this.formatNum(wasteEnergyUsed)} GJ ÷ ${this.formatNum(wasteEnergyTotal)} GJ × 100%`,
            value: wasteEnergyRatio.toFixed(1),
            unit: '%'
          }
        },
        {
          key: '中水回用率',
          badge: '引导指标',
          color: '#2563eb',
          rows: [
            {
              name: '中水利用量',
              input: `${this.formatNum(waterUsed)} t`,
              inputDetail: '中水回用管网流量计直连',
              convert: '底座数据识别',
              factor: '—',
              factorUnit: '',
              value: this.formatNum(waterUsed),
              unit: 't'
            },
            {
              name: '具备回用条件总用水量',
              input: `${this.formatNum(waterTotal)} t`,
              inputDetail: '园区用水台账统计',
              convert: '系统汇总',
              factor: '—',
              factorUnit: '',
              value: this.formatNum(waterTotal),
              unit: 't'
            }
          ],
          result: {
            name: '中水回用率',
            formula: `${this.formatNum(waterUsed)} t ÷ ${this.formatNum(waterTotal)} t × 100%`,
            value: waterRatio.toFixed(1),
            unit: '%'
          }
        }
      ]

      return {
        totalEmission, totalEnergy, nonFossilKwh, nonFossilTce,
        productCount, carbonPerTce, cleanRatio,
        groups
      }
    },

    /** 阶段6：完整数据清单树（分类 → 排放源 → 物料 → 参数） */
    parkDataListTree() {
      const CATS = [
        { key: '化石燃料燃烧', icon: 'el-icon-heavy-rain', color: '#f97316' },
        { key: '能源加工转换', icon: 'el-icon-refresh', color: '#0ea5e9' },
        { key: '净购入电力热力', icon: 'el-icon-lightning', color: '#22c55e' },
        { key: '工业过程', icon: 'el-icon-s-cooperation', color: '#8b5cf6' }
      ]
      const actList = this.activityDataList || []
      const facList = this.factorMatchList || []

      return CATS.map(cat => {
        const actSrcs = actList.filter(x => x.category === cat.key)
        const facSrcs = facList.filter(x => x.category === cat.key)
        const sources = []

        actSrcs.forEach(src => {
          const fac = facSrcs.find(f => f.id === src.id) || {}
          const mats = []

          // ① 单一参数型（化石燃料 / 工业过程 / 净购入单一）
          if (src.params && src.params.length) {
            const ef = (fac.factors || []).find(x => x.key === 'EF')
            const cef = (fac.factors || []).find(x => x.key === 'CEF')
            mats.push({
              name: src.name,
              direction: 'single',
              factorObj: { ef, cef, src, mat: null },
              params: src.params.map(pp => ({
                key: pp.key, label: pp.label, value: pp.value, unit: pp.unit,
                rawValue: pp.rawValue, rawUnit: pp.rawUnit,
                source: pp.source, verified: pp.verified
              }))
            })
          }

          // ② 输入物料
          ;(src.inputs || []).forEach(mat => {
            const matFac = (fac.inputs || []).find(x => x.id === mat.id)
            const ef = matFac ? (matFac.factors || []).find(x => x.key === 'EF') : null
            const cef = matFac ? (matFac.factors || []).find(x => x.key === 'CEF') : null
            mats.push({
              name: mat.name,
              direction: 'input',
              factorObj: { ef, cef, src, mat },
              params: (mat.params || []).map(pp => ({
                key: pp.key, label: pp.label, value: pp.value, unit: pp.unit,
                rawValue: pp.rawValue, rawUnit: pp.rawUnit,
                source: pp.source, verified: pp.verified
              }))
            })
          })

          // ③ 输出物料
          ;(src.outputs || []).forEach(mat => {
            const matFac = (fac.outputs || []).find(x => x.id === mat.id)
            const ef = matFac ? (matFac.factors || []).find(x => x.key === 'EF') : null
            mats.push({
              name: mat.name,
              direction: 'output',
              factorObj: { ef, cef: null, src, mat },
              params: (mat.params || []).map(pp => ({
                key: pp.key, label: pp.label, value: pp.value, unit: pp.unit,
                rawValue: pp.rawValue, rawUnit: pp.rawUnit,
                source: pp.source, verified: pp.verified
              }))
            })
          })

          sources.push({ name: src.name, channel: src.channel, mats })
        })

        // 统计
        let paramCount = 0
        sources.forEach(s => s.mats.forEach(m => { paramCount += m.params.length }))
        return { ...cat, sources, paramCount }
      }).filter(g => g.sources.length > 0)
        // ④ 追加「指标参数」分组（阶段4 的其他计算参数）
        .concat([this.buildIndicatorDataGroup()])
        .filter(g => g.sources.length > 0)
    },


    /** 阶段9：园区核算报告数据 */
    parkReportProfile() {
      const calc = this.parkEmissionCalc
      const q = this.parkQualityAssessment
      const st = this.parkIndicatorStats
      const basic = this.parkBasicInfo || {}
      const range = this.boundaryDateRange || []
      return {
        parkName: basic.name || '—',
        area: basic.area || '—',
        standard: this.selectedStandard || '零碳园区碳排放核算方法（试行）',
        period: (range[0] || '—') + ' ~ ' + (range[1] || '—'),
        total: calc.total,
        totalWan: calc.totalWan,
        energy: this.parkTotalEnergy.toFixed(0),
        carbonPerTce: this.parkCarbonPerTce.toFixed(3),
        indicatorPass: st.pass,
        indicatorTotal: st.total,
        coreStatus: (this.parkIndicatorRows[0] || {}).pass ? '达标' : '未达标',
        qualityScore: q.weightedScore,
        qualityGrade: q.weightedGrade,
        lowCount: q.lowQuality.length,
        sourceCount: (this.emissionSources || []).length,
        categoryCount: (calc.groups || []).length,

        // ④ 零碳措施与成效
        measures: this.parkCarbonMeasures,
        // ⑥ 达标差距
        gaps: this.parkIndicatorGaps,
        // ⑦ 改进计划
        plans: this.parkImprovePlans
      }
    },

    /** 阶段9：零碳措施与成效 */
    parkCarbonMeasures() {
      const list = []
      // 光伏自用
      let pvKwh = 0
      let greenKwh = 0
      ;(this.activityDataList || []).forEach(src => {
        if (!/光伏|绿电/.test(src.name)) return
        const collect = (arr) => {
          ;(arr || []).forEach(mat => {
            ;(mat.params || []).forEach(pp => {
              const v = parseFloat(pp.value) || 0
              const u = (pp.unit || '').toLowerCase()
              const kwh = u === '万kwh' ? v * 10000 : v
              if (/光伏/.test(src.name)) pvKwh += kwh
              else greenKwh += kwh
            })
          })
        }
        collect(src.params)
        collect(src.inputs)
        collect(src.outputs)
      })
      if (pvKwh > 0) {
        list.push({
          icon: 'el-icon-sunny',
          name: '屋顶光伏自发自用',
          value: this.formatNum(pvKwh) + ' kWh',
          desc: `自发自用电量 ${this.formatNum(pvKwh)} kWh，全额按零碳核减，折标 ${this.formatNum(pvKwh * 0.1229 / 1000)} tce`
        })
      }
      if (greenKwh > 0) {
        list.push({
          icon: 'el-icon-lightning',
          name: '绿电直供与绿证核销',
          value: this.formatNum(greenKwh) + ' kWh',
          desc: `绿电交易与绿证核销电量 ${this.formatNum(greenKwh)} kWh，按 0 因子核减`
        })
      }
      // 余能利用
      const heatUsed = this.getIndicatorParamValue('P05-1')
      const heatTotal = this.getIndicatorParamValue('P05-2')
      if (heatTotal > 0) {
        list.push({
          icon: 'el-icon-refresh',
          name: '工业余能回收利用',
          value: this.formatNum(heatUsed) + ' / ' + this.formatNum(heatTotal) + ' GJ',
          desc: `余热余冷余压已利用 ${this.formatNum(heatUsed)} GJ，理论可回收 ${this.formatNum(heatTotal)} GJ，利用率 ${(heatUsed / heatTotal * 100).toFixed(1)}%`
        })
      }
      // 固废利用
      const solidUsed = this.getIndicatorParamValue('P04-1')
      const solidTotal = this.getIndicatorParamValue('P04-2')
      if (solidTotal > 0) {
        list.push({
          icon: 'el-icon-recycle',
          name: '工业固废资源化',
          value: this.formatNum(solidUsed) + ' / ' + this.formatNum(solidTotal) + ' t',
          desc: `固废综合利用 ${this.formatNum(solidUsed)} t，产生总量 ${this.formatNum(solidTotal)} t，综合利用率 ${(solidUsed / solidTotal * 100).toFixed(1)}%`
        })
      }
      // 中水回用
      const waterUsed = this.getIndicatorParamValue('P06-1')
      const waterTotal = this.getIndicatorParamValue('P06-2')
      if (waterTotal > 0) {
        list.push({
          icon: 'el-icon-help',
          name: '中水回用',
          value: this.formatNum(waterUsed) + ' / ' + this.formatNum(waterTotal) + ' t',
          desc: `中水利用 ${this.formatNum(waterUsed)} t，回用率 ${(waterUsed / waterTotal * 100).toFixed(1)}%`
        })
      }
      return list
    },

    /** 阶段9：指标达标差距 */
    parkIndicatorGaps() {
      const rows = this.parkIndicatorRows || []
      return rows.filter(r => !r.pass).map(r => {
        const cur = parseFloat(String(r.valueText).replace(/[^\d.]/g, '')) || 0
        const tgt = parseFloat(String(r.targetText).replace(/[^\d.]/g, '')) || 0
        const isUpper = /≤/.test(r.targetText)
        let delta = ''
        if (isUpper) {
          delta = cur > tgt ? `超标 ${(cur - tgt).toFixed(3)}` : '达标'
        } else {
          delta = cur < tgt ? `差额 ${(tgt - cur).toFixed(1)} 个百分点` : '达标'
        }
        return {
          name: r.name,
          delta,
          desc: r.calcText || `当前 ${r.valueText}，目标 ${r.targetText}`
        }
      })
    },

    /** 阶段9：改进路径与时间表 */
    parkImprovePlans() {
      const plans = []
      const st = this.parkIndicatorStats || {}
      // 第一阶段：立即改进
      plans.push({
        phase: '短期（1 年内）',
        title: '完善计量与数据治理',
        desc: '将材料识别类活动数据升级为底座直连，补充缺失佐证材料，提升数据可追溯性至 A 级'
      })
      // 第二阶段：中期
      plans.push({
        phase: '中期（1~3 年）',
        title: '提升清洁能源占比',
        desc: '扩大屋顶光伏装机容量，签订长期绿电购电协议，力争清洁能源消费比重达到 90% 以上'
      })
      // 第三阶段：长期
      if (st.corePass === 0) {
        plans.push({
          phase: '长期（3~5 年）',
          title: '压降单位能耗碳排放',
          desc: '推进工艺节能改造与能源梯级利用，优化产业结构，使单位能耗碳排放降至 0.20 tCO₂/tce 以下'
        })
      }
      return plans
    },


    /** 阶段8：园区综合能耗（按园区标准口径：全区终端能源消费折标汇总）
     *  计入：化石燃料燃烧（天然气/柴油全部消费量）、净购入电力热力（含光伏/绿电）
     *  不计：能源加工转换（投入已含在化石燃料燃烧，产出非终端消费，完全不计）
     *        工业过程（产品产量非能源消费）
     *  折标依据：GB/T 2589 当量值
     */
    parkTotalEnergy() {
      const list = this.activityDataList || []
      let tce = 0
      const detail = []

      // 折标系数（GB/T 2589 当量值）
      const cefOf = (name, unit) => {
        const nm = name || ''
        const u = (unit || '').toLowerCase().trim()
        // 电力：0.1229 kgce/kWh
        if (/电力|电量/.test(nm) || u === 'kwh' || u === '万kwh') {
          if (u === '万kwh') return { f: 0.1229 * 10, desc: '电力 0.1229 kgce/kWh（万kWh）' }
          return { f: 0.1229 / 1, desc: '电力 0.1229 kgce/kWh' }
        }
        // 天然气：1.33 kgce/m³
        if (/天然气/.test(nm) || u === 'm³') {
          return { f: 1.33, desc: '天然气 1.33 kgce/m³' }
        }
        // 柴油：1.4571 kgce/kg（L → kg 用 0.84 密度）
        if (/柴油|汽油/.test(nm) || u === 'l') {
          if (u === 'l') return { f: 1.4571 * 0.84, desc: '柴油 1.4571 kgce/kg（L换算）' }
          return { f: 1.4571, desc: '柴油 1.4571 kgce/kg' }
        }
        // 蒸汽/热力：0.0341 kgce/kg（GJ → kg 用 1/0.00293 约 341 kg/GJ）
        if (/蒸汽|热水|热力/.test(nm) || u === 'gj') {
          if (u === 'gj') return { f: 0.0341 * 1000 / 29.3076, desc: '蒸汽 0.0341 kgce/kg（GJ换算）' }
          return { f: 0.0341, desc: '蒸汽 0.0341 kgce/kg' }
        }
        return { f: 0, desc: '' }
      }

      const addRow = (srcName, matName, val, unit, isOutput) => {
        const v = parseFloat(val) || 0
        if (!v) return
        const { f, desc } = cefOf(matName || srcName, unit)
        if (!f) return
        // kgce → tce（÷1000）
        const t = v * f / 1000 * (isOutput ? 1 : 1)
        tce += t
        detail.push({ src: srcName, mat: matName, value: v, unit, cef: f, tce: t.toFixed(2), desc })
      }

      list.forEach(src => {
        // ① 工业过程：跳过（非能源消费）
        if (src.category === '工业过程') return

        // ② 能源加工转换：完全不计入（投入已含在化石燃料燃烧，产出非终端消费）
        if (src.category === '能源加工转换') {
          // 只计投入侧能耗（转换装置实际消耗）
          ;(src.inputs || []).forEach(mat => {
            ;(mat.params || []).forEach(pp => addRow(src.name, mat.name, pp.value, pp.unit, false))
          })
          return
        }

        // ③ 化石燃料燃烧 / 净购入电力热力：计入
        ;(src.params || []).forEach(pp => addRow(src.name, src.name, pp.value, pp.unit, false))
        ;(src.inputs || []).forEach(mat => {
          ;(mat.params || []).forEach(pp => addRow(src.name, mat.name, pp.value, pp.unit, false))
        })
        ;(src.outputs || []).forEach(mat => {
          ;(mat.params || []).forEach(pp => addRow(src.name, mat.name, pp.value, pp.unit, false))
        })
      })

      this._parkEnergyDetail = detail
      return Math.max(tce, 1)
    },
    /** 综合能耗明细（供展示） */
    parkEnergyDetail() {
      return this._parkEnergyDetail || []
    },
    /** 阶段8：单位能耗碳排放 */
    parkCarbonPerTce() {
      const total = this.parkEmissionCalc.total
      const tce = this.parkTotalEnergy
      return tce > 0 ? (total / tce) : 0
    },
    /** 阶段8：指标对标行 */
    parkIndicatorRows() {
      const cpt = this.parkCarbonPerTce
      const threshold = 0.20
      const rows = []
      // 核心指标
      rows.push({
        key: 'core',
        name: '单位能耗碳排放',
        typeName: '核心',
        isCore: true,
        applicable: true,
        valueText: cpt.toFixed(3) + ' tCO₂/tce',
        targetText: '≤ ' + threshold,
        pass: cpt <= threshold,
        calcText: '园区碳排放总量 ' + this.parkEmissionCalc.total.toFixed(1) + ' tCO₂ ÷ 综合能耗 ' + this.parkTotalEnergy.toFixed(0) + ' tce'
      })
      // 引导指标（优先使用 parkIndicatorCalc 的实际计算值）
      const calc = this.parkIndicatorCalc || {}
      // 从 parkIndicatorCalc.rows 中按名称取值
      const getCalcVal = (name) => {
        const r = (calc.rows || []).find(x => x.name === name)
        return r ? parseFloat(String(r.value).replace(/[^0-9.]/g, '')) || 0 : 0
      }
      // 兜底：从指标参数读原始值
      const getVal = (id) => {
        let v = ''
        ;(this.indicatorParamList || []).forEach(g => {
          ;(g.params || []).forEach(pp => { if (pp.id === id) v = pp.value })
        })
        return parseFloat(v) || 0
      }
      const guidedDefs = [
        { key: 'cleanEnergy', name: '清洁能源消费比重', calcName: '清洁能源消费比重', target: '≥ 90%' },
        { key: 'energyLimit', name: '产品能效达标比例', calcName: '产品能效达标比例', target: '≥ 90%' },
        { key: 'solidWaste', name: '工业固废综合利用率', calcName: '工业固废综合利用率', target: '≥ 80%' },
        { key: 'wasteHeat', name: '工业余能利用率', calcName: '工业余能利用率', target: '≥ 50%' },
        { key: 'waterRecycle', name: '中水回用率', calcName: '中水回用率', target: '≥ 80%' }
      ]
      guidedDefs.forEach(d => {
        let val = 0
        // 优先：直接用 parkIndicatorCalc 的计算值
        val = getCalcVal(d.calcName)
        // 兜底：用原始参数值
        if (!val) {
          if (d.key === 'wasteHeat') {
            const used = getVal('P05-1') + getVal('P05-3') + getVal('P05-5')
            const total = getVal('P05-2') + getVal('P05-4') + getVal('P05-6')
            val = total > 0 ? (used / total * 100) : 0
          } else if (d.key === 'cleanEnergy') {
            val = calc.cleanRatio || 0
          } else if (d.key === 'energyLimit') {
            const a = getVal('P03-1'); const b = getVal('P03-2') || calc.productCount || 0
            val = b > 0 ? (a / b * 100) : 0
          } else if (d.key === 'solidWaste') {
            const a = getVal('P04-1'); const b = getVal('P04-2')
            val = b > 0 ? (a / b * 100) : 0
          } else if (d.key === 'waterRecycle') {
            const a = getVal('P06-1'); const b = getVal('P06-2')
            val = b > 0 ? (a / b * 100) : 0
          }
        }
        const targetNum = parseFloat(d.target.replace(/[^0-9.]/g, ''))
        rows.push({
          key: d.key,
          name: d.name,
          typeName: '引导',
          isCore: false,
          applicable: true,
          valueText: val.toFixed(1) + '%',
          targetText: d.target,
          pass: val >= targetNum,
          calcText: d.name + '：' + val.toFixed(1) + '%（目标 ' + d.target + '）'
        })
      })
      return rows
    },
    /** 阶段8：指标达标统计 */
    parkIndicatorStats() {
      const rows = this.parkIndicatorRows || []
      return {
        total: rows.length,
        pass: rows.filter(r => r.pass).length,
        corePass: rows.filter(r => r.isCore && r.pass).length,
        guidedPass: rows.filter(r => !r.isCore && r.pass).length,
        guidedTotal: rows.filter(r => !r.isCore).length
      }
    },
    /** 阶段8：分类构成数据 */
    parkScopeTable() {
      const total = this.parkEmissionCalc.total || 1
      return (this.parkEmissionCalc.groups || []).map(g => ({
        name: g.key,
        color: g.color,
        value: g.subtotal,
        pct: (g.subtotal / total * 100).toFixed(1)
      }))
    },
    /** 阶段8：排放源 Top N */
    parkSourceRanking() {
      const list = []
      ;(this.parkEmissionCalc.groups || []).forEach(g => {
        // 按排放源聚合（srcGroups）
        ;(g.srcGroups || []).forEach(sg => {
          list.push({
            name: sg.name,
            value: Math.abs(sg.subtotal),
            category: g.key,
            color: g.color
          })
        })
      })
      return list.sort((a, b) => b.value - a.value).slice(0, 8)
    },

    /** 阶段7：园区碳排放计算结果（按四大分类逐项核算） */
    parkEmissionCalc() {
      const CATS = [
        { key: '化石燃料燃烧', icon: 'el-icon-heavy-rain', color: '#f97316' },
        { key: '能源加工转换', icon: 'el-icon-refresh', color: '#0ea5e9' },
        { key: '净购入电力热力', icon: 'el-icon-lightning', color: '#22c55e' },
        { key: '工业过程', icon: 'el-icon-s-cooperation', color: '#8b5cf6' }
      ]

      // 活动数据单位换算为因子单位
      // 优先按【单位】判断，名称作为辅助（避免"外购电力"在能源加工转换源名下漏判）
      const convertAD = (val, unit, efUnit, srcName, matName) => {
        const v = parseFloat(val) || 0
        const u = (unit || '').toLowerCase().trim()
        const eu = (efUnit || '').toLowerCase()
        const nm = (matName || srcName || '')

        // ① 电力：kWh → MWh（按单位判断，最可靠）
        if (u === 'kwh' || u === '万kwh') {
          const kwh = u === '万kwh' ? v * 10000 : v
          const mwh = kwh / 1000
          return { num: mwh, text: `${val} ${unit}`, convertText: `÷ 1000 = ${mwh.toFixed(2)} MWh` }
        }
        // ② GJ（热力/蒸汽）：单位一致
        if (u === 'gj') {
          return { num: v, text: `${val} ${unit}`, convertText: '单位一致' }
        }
        // ③ m³（天然气）：× 0.7174 kg/m³ ÷ 1000 → t
        if (u === 'm³' || u === '万nm³') {
          const m3 = u === '万nm³' ? v * 10000 : v
          const t = m3 * 0.7174 / 1000
          return { num: t, text: `${val} ${unit}`, convertText: `× 0.7174 kg/m³ ÷ 1000 = ${t.toFixed(2)} t` }
        }
        // ④ L（柴油/汽油）：× 0.84 kg/L ÷ 1000 → t
        if (u === 'l') {
          const t = v * 0.84 / 1000
          return { num: t, text: `${val} ${unit}`, convertText: `× 0.84 kg/L ÷ 1000 = ${t.toFixed(2)} t` }
        }
        // ⑤ kg → t
        if (u === 'kg') {
          return { num: v / 1000, text: `${val} ${unit}`, convertText: `÷ 1000 = ${(v / 1000).toFixed(3)} t` }
        }
        // ⑥ 其他（万片/GWh 等）：单位一致
        return { num: v, text: `${val} ${unit}`, convertText: '单位一致' }
      }

      const groups = CATS.map(cat => {
        const items = []
        const srcList = (this.activityDataList || []).filter(x => x.category === cat.key)
        const facList = (this.factorMatchList || []).filter(x => x.category === cat.key)

        srcList.forEach(src => {
          const fac = facList.find(f => f.id === src.id) || {}

          // ① 单一因子类（化石燃料 / 净购入电力热力 / 工业过程）
          if (fac.factors && fac.factors.length) {
            const efObj = fac.factors.find(x => x.key === 'EF') || fac.factors[0]
            const efVal = parseFloat(efObj.value) || 0
            const efUnit = efObj.unit || ''

            const pushRow = (label, adVal, adUnit, matName) => {
              const conv = convertAD(adVal, adUnit, efUnit, src.name, matName)
              const emission = conv.num * efVal
              items.push({
                srcName: src.name,
                matName: matName || '',
                label,
                adText: conv.text,
                convertText: conv.convertText,
                efVal,
                efUnit,
                sign: 1,
                emission,
                direction: ''
              })
            }

            if (src.params && src.params.length) {
              src.params.forEach(pp => pushRow(pp.label, pp.value, pp.unit))
            }
            ;(src.inputs || []).forEach(mat => {
              ;(mat.params || []).forEach(pp => pushRow(pp.label, pp.value, pp.unit, mat.name))
            })
            ;(src.outputs || []).forEach(mat => {
              ;(mat.params || []).forEach(pp => pushRow(pp.label, pp.value, pp.unit, mat.name))
            })
          }

          // ② 能源加工转换（投入 + / 产出 −）
          if (fac.inputs && fac.inputs.length) {
            fac.inputs.forEach(matFac => {
              const srcMat = (src.inputs || []).find(x => x.id === matFac.id)
              if (!srcMat) return
              const efObj = (matFac.factors || []).find(x => x.key === 'EF') || (matFac.factors || [])[0]
              if (!efObj) return
              const efVal = parseFloat(efObj.value) || 0
              ;(srcMat.params || []).forEach(pp => {
                const conv = convertAD(pp.value, pp.unit, efObj.unit, src.name, matFac.name)
                items.push({
                  srcName: src.name,
                  matName: matFac.name,
                  label: pp.label,
                  adText: conv.text,
                  convertText: conv.convertText,
                  efVal,
                  efUnit: efObj.unit,
                  sign: 1,
                  emission: conv.num * efVal,
                  direction: 'input'
                })
              })
            })
          }
          if (fac.outputs && fac.outputs.length) {
            fac.outputs.forEach(matFac => {
              const srcMat = (src.outputs || []).find(x => x.id === matFac.id)
              if (!srcMat) return
              const efObj = (matFac.factors || []).find(x => x.key === 'EF') || (matFac.factors || [])[0]
              if (!efObj) return
              const efVal = parseFloat(efObj.value) || 0
              ;(srcMat.params || []).forEach(pp => {
                const conv = convertAD(pp.value, pp.unit, efObj.unit, src.name, matFac.name)
                items.push({
                  srcName: src.name,
                  matName: matFac.name,
                  label: pp.label,
                  adText: conv.text,
                  convertText: conv.convertText,
                  efVal,
                  efUnit: efObj.unit,
                  sign: -1,
                  emission: -conv.num * efVal,
                  direction: 'output'
                })
              })
            })
          }
        })

        const subtotal = items.reduce((a, b) => a + b.emission, 0)
        // 按排放源名分组
        const srcGroups = []
        const seen = {}
        items.forEach(it => {
          if (!seen[it.srcName]) {
            seen[it.srcName] = { name: it.srcName, rows: [], subtotal: 0 }
            srcGroups.push(seen[it.srcName])
          }
          seen[it.srcName].rows.push(it)
          seen[it.srcName].subtotal += it.emission
        })
        return { ...cat, items, srcGroups, subtotal }
      })

      const total = groups.reduce((a, b) => a + b.subtotal, 0)
      return {
        groups: groups.filter(g => g.items.length > 0),
        total,
        totalWan: (total / 10000).toFixed(2)
      }
    },

    /** 阶段6：园区整体质量评估 */
    parkQualityAssessment() {
      const list = []
      // ① 排放源活动数据
      ;(this.activityDataList || []).forEach(src => {
        const collect = (arr, dir) => {
          ;(arr || []).forEach(mat => {
            ;(mat.params || []).forEach(pp => {
              const val = parseFloat(pp.value) || 0
              list.push({
                proc: src.name,
                unit: mat.name,
                key: pp.key,
                label: pp.label,
                value: pp.value,
                unitText: pp.unit,
                source: pp.source || '',
                verified: pp.verified,
                direction: dir,
                isAD: true,
                valueNum: val
              })
            })
          })
        }
        ;(src.params || []).forEach(pp => {
          list.push({
            proc: src.name, unit: src.name, key: pp.key, label: pp.label,
            value: pp.value, unitText: pp.unit, source: pp.source || '',
            verified: pp.verified, direction: 'single', isAD: true,
            valueNum: parseFloat(pp.value) || 0
          })
        })
        collect(src.inputs, 'input')
        collect(src.outputs, 'output')
      })

      // ② 排放因子
      ;(this.factorMatchList || []).forEach(src => {
        ;(src.factors || []).forEach(ff => {
          list.push({
            proc: src.name, unit: src.name, key: ff.key, label: ff.name,
            value: ff.value, unitText: ff.unit, source: ff.source || '',
            verified: ff.verified, direction: 'factor', isAD: false,
            confidence: ff.confidence || '中',
            library: ff.library || '',
            valueNum: 0
          })
        })
      })

      const total = list.length
      const adList = list.filter(x => x.isAD)
      const efList = list.filter(x => !x.isAD)

      // ③ 质量等级判定
      const gradeOf = (x) => {
        if (!x.value || String(x.value).trim() === '') return 'E'   // 缺值
        if (!x.source) return 'D'                                    // 无来源
        if (!x.verified) return 'C'                                  // 未确认
        if (x.isAD) {
          if (/底座数据直连|关口表|EMS|计量|直连/.test(x.source)) return 'A'
          if (/OCR|台账|结算|凭证|报告|票据/.test(x.source)) return 'B'
          return 'C'
        } else {
          if (/IPCC|DB11|国家|标准/.test(x.source)) return 'B'
          if (/缺省|默认/.test(x.source)) return 'C'
          return 'B'
        }
      }

      // ④ DQR 分布
      const dqrDist = { A: 0, B: 0, C: 0, D: 0, E: 0 }
      list.forEach(x => { dqrDist[gradeOf(x)]++ })

      // ⑤ 加权质量分（按活动数据量加权）
      const scoreMap = { A: 1.4, B: 2.2, C: 3.0, D: 3.8, E: 4.6 }
      let sumW = 0, sumWV = 0
      list.forEach(x => {
        const w = x.valueNum > 0 ? Math.log10(x.valueNum + 1) : 1
        sumW += w
        sumWV += w * scoreMap[gradeOf(x)]
      })
      const ws = sumW > 0 ? (sumWV / sumW) : 3.0
      const wg = ws <= 1.8 ? 'A' : ws <= 2.6 ? 'B' : ws <= 3.4 ? 'C' : ws <= 4.2 ? 'D' : 'E'

      // ⑥ 数据来源结构
      let platformCnt = 0, ocrCnt = 0, manualCnt = 0, unknownCnt = 0
      adList.forEach(x => {
        const src = x.source || ''
        if (/底座数据直连|关口表|EMS|计量|直连/.test(src)) platformCnt++
        else if (/OCR|台账|结算|凭证|报告|票据/.test(src)) ocrCnt++
        else if (src) manualCnt++
        else unknownCnt++
      })

      // ⑦ 覆盖率
      const adTotal = adList.length
      const adFilled = adList.filter(x => x.value && String(x.value).trim() !== '').length
      const efTotal = efList.length
      const efMatched = efList.filter(x => x.value && String(x.value).trim() !== '').length
      const sourceCoverage = adTotal ? Math.round(adFilled / adTotal * 100) : 0
      const factorCoverage = efTotal ? Math.round(efMatched / efTotal * 100) : 0

      // ⑧ 因子置信度分布
      const confDist = [
        { label: '高置信', count: efList.filter(x => x.confidence === '高').length, color: '#15803d' },
        { label: '中置信', count: efList.filter(x => x.confidence === '中').length, color: '#b45309' },
        { label: '低置信', count: efList.filter(x => x.confidence === '低').length, color: '#b91c1c' }
      ]

      // ⑨ 时效性
      const curYear = new Date().getFullYear()
      const ageInfo = {
        dataYear: curYear,
        dataGap: 0,
        factorVersion: 'IPCC 2006 / 华北电网 2022',
        factorGap: curYear - 2022,
        factorLevel: (curYear - 2022) <= 3 ? 'ok' : 'warn'
      }

      // ⑩ 低质量项
      const lowQuality = list
        .filter(x => ['D', 'E'].includes(gradeOf(x)))
        .sort((a, b) => (b.valueNum || 0) - (a.valueNum || 0))
        .slice(0, 20)
        .map(x => ({
          proc: x.proc,
          unit: x.unit,
          key: x.key,
          label: x.label,
          level: gradeOf(x) === 'E' ? 'block' : 'warn',
          grade: gradeOf(x)
        }))

      return {
        total,
        adTotal,
        efTotal,
        dqrDist,
        weightedScore: ws.toFixed(2),
        weightedGrade: wg,
        platformCnt,
        ocrCnt,
        manualCnt,
        unknownCnt,
        sourceCoverage,
        factorCoverage,
        confDist,
        ageInfo,
        lowQuality
      }
    },

    /** 阶段5：因子按四大分类分组 */
    groupedFactorMatch() {
      const CATS = [
        { key: '化石燃料燃烧', icon: 'el-icon-heavy-rain', color: '#f97316' },
        { key: '能源加工转换', icon: 'el-icon-refresh', color: '#0ea5e9' },
        { key: '净购入电力热力', icon: 'el-icon-lightning', color: '#22c55e' },
        { key: '工业过程', icon: 'el-icon-s-cooperation', color: '#8b5cf6' }
      ]
      const list = this.factorMatchList || []
      return CATS.map(c => {
        const items = list.filter(x => x.category === c.key)
        let all = []
        items.forEach(it => { all = all.concat(this.collectSourceFactors(it)) })
        return {
          ...c,
          items,
          total: items.length,
          factorTotal: all.length,
          verifiedCount: all.filter(x => x.verified).length
        }
      }).filter(g => g.total > 0)
    },
    /** 阶段5：因子统计 */
    factorMatchStats() {
      const list = this.factorMatchList || []
      let all = []
      list.forEach(it => { all = all.concat(this.collectSourceFactors(it)) })
      return {
        sourceCount: list.length,
        total: all.length,
        verified: all.filter(x => x.verified).length,
        pending: all.filter(x => !x.verified).length
      }
    },

    /** 指标参数（注入自动统计值） */
    indicatorParamListWithAuto() {
      const list = this.indicatorParamList || []
      const map = { productCount: this.productTypeCount }
      return list.map(g => {
        const params = (g.params || []).map(pp => {
          if (pp.autoCount && map[pp.autoCount] !== undefined) {
            return { ...pp, value: String(map[pp.autoCount]) }
          }
          return pp
        })
        return { ...g, params }
      })
    },

    /** 工业过程类别下的产品数量（用于产品类型总数） */
    productTypeCount() {
      return (this.emissionSources || []).filter(x => x.category === '工业过程').length
    },

    /** 阶段4：活动数据按四大分类分组 */
    groupedActivityData() {
      const CATS = [
        { key: '化石燃料燃烧', icon: 'el-icon-heavy-rain', color: '#f97316' },
        { key: '能源加工转换', icon: 'el-icon-refresh', color: '#0ea5e9' },
        { key: '净购入电力热力', icon: 'el-icon-lightning', color: '#22c55e' },
        { key: '工业过程', icon: 'el-icon-s-cooperation', color: '#8b5cf6' }
      ]
      const list = this.activityDataList || []
      return CATS.map(c => {
        const items = list.filter(x => x.category === c.key)
        let allParams = []
        items.forEach(it => { allParams = allParams.concat(this.collectSourceParams(it)) })
        return {
          ...c,
          items,
          total: items.length,
          paramTotal: allParams.length,
          verifiedCount: allParams.filter(x => x.verified).length
        }
      }).filter(g => g.total > 0)
    },
    /** 活动数据统计（按参数计） */
    activityStats() {
      const list = this.activityDataList || []
      let all = []
      list.forEach(it => { all = all.concat(this.collectSourceParams(it)) })
      return {
        sourceCount: list.length,
        total: all.length,
        verified: all.filter(x => x.verified).length,
        pending: all.filter(x => !x.verified).length
      }
    },
    /** 阶段4 指标参数统计（含确认状态） */
    indicatorParamStats2() {
      const groups = this.indicatorParamList || []
      let all = []
      groups.forEach(g => { all = all.concat(g.params || []) })
      return {
        total: all.length,
        verified: all.filter(x => x.verified).length,
        pending: all.filter(x => !x.verified).length,
        editable: all.filter(x => !x.readonly).length
      }
    },

    /** 其他计算参数统计 */
    indicatorParamStats() {
      const groups = this.indicatorParamList || []
      let total = 0
      const byChannel = { '系统汇总': 0, '材料识别': 0, '底座数据识别': 0 }
      groups.forEach(g => {
        (g.params || []).forEach(p => {
          total++
          if (byChannel[p.channel] !== undefined) byChannel[p.channel]++
        })
      })
      return { total, groups: groups.length, byChannel }
    },


    /** 阶段3：排放源按四大法定分类分组 */
    groupedEmissionSources() {
      const CATS = [
        { key: '化石燃料燃烧', icon: 'el-icon-heavy-rain', color: '#f97316', bg: '#fff7ed' },
        { key: '能源加工转换', icon: 'el-icon-refresh', color: '#0ea5e9', bg: '#f0f9ff' },
        { key: '净购入电力热力', icon: 'el-icon-lightning', color: '#22c55e', bg: '#f0fdf4' },
        { key: '工业过程', icon: 'el-icon-s-cooperation', color: '#8b5cf6', bg: '#faf5ff' }
      ]
      const list = (this.emissionSources || []).filter(x => {
        if (this.sourceCategoryFilter !== 'all' && x.category !== this.sourceCategoryFilter) return false
        if (this.sourceChannelFilter !== 'all' && x.channel !== this.sourceChannelFilter) return false
        return true
      })
      return CATS.map(c => {
        const items = list.filter(x => x.category === c.key)
        return {
          ...c,
          items,
          total: items.length,
          enabledCount: items.filter(x => x.enabled).length,
          platformCount: items.filter(x => x.channel === '底座数据识别').length,
          ocrCount: items.filter(x => x.channel === '材料识别').length
        }
      }).filter(g => g.total > 0)
    },
    /** 排放源总数与启用数 */
    emissionSourceStats() {
      const all = this.emissionSources || []
      return {
        total: all.length,
        enabled: all.filter(x => x.enabled).length
      }
    },

    /** 园区标准内容解析块（按结构化参数动态渲染） */
    parkParsingBlocks() {
      const cfg = this.selectedStandardConfig || {}
      const esc = v => String(v == null ? '' : v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const blocks = []

      // ① 适用范围与边界
      const sr = cfg.scopeRule
      if (sr && (sr.boundary || sr.scope)) {
        let h = ''
        if (sr.boundary) h += '<p>核算边界：<b>' + esc(sr.boundary) + '</b></p>'
        if (sr.scope) h += '<p>核算范围：' + esc(sr.scope) + '</p>'
        if (sr.gasScope) h += '<p>气体范围：<b>' + esc(sr.gasScope) + '</b></p>'
        if (sr.note) h += '<p>' + esc(sr.note) + '</p>'
        blocks.push({ key: 'scope', icon: 'scope-icon', title: '适用范围与边界', html: h })
      }

      // ② 排放源分类（四大法定分类）
      const im = cfg.indicatorMapping
      if (im && (im.note || im.categories)) {
        let h = ''
        if (im.note) h += '<p>' + esc(im.note) + '</p>'
        if (im.categories && im.categories.length) {
          const rows = im.categories.map(c => '<li><b>' + esc(c.name) + '</b>：' + esc(c.desc || '') + '</li>').join('')
          h += '<ul style="margin:6px 0 0;padding-left:18px;line-height:1.95;">' + rows + '</ul>'
        }
        blocks.push({ key: 'category', icon: 'boundary-icon', title: '排放源分类（四大法定分类）', html: h })
      }

      // ③ 量化方法
      const cr = cfg.calcRule
      if (cr && (cr.method || cr.formula)) {
        let h = ''
        if (cr.method) h += '<p>核算方法：<b>' + esc(cr.method) + '</b></p>'
        if (cr.formula) h += '<p>总公式：<code>' + esc(cr.formula) + '</code></p>'
        if (cr.subFormulas && cr.subFormulas.length) {
          const rows = cr.subFormulas.map(f =>
            '<li><b>' + esc(f.name) + '</b>：<code style="font-size:11.5px;">' + esc(f.formula) + '</code></li>'
          ).join('')
          h += '<ul style="margin:6px 0 0;padding-left:18px;line-height:2;">' + rows + '</ul>'
        }
        if (cr.note) h += '<p style="margin-top:6px;">' + esc(cr.note) + '</p>'
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
          if (g.note) h += '<p>' + esc(g.note) + '</p>'
        }
        if (dq) {
          if (dq.requireVoucher) h += '<p>凭证要求：活动数据须留存原始凭证，可追溯至凭证</p>'
          if (dq.traceLevel) h += '<p>溯源层级：<b>' + esc(dq.traceLevel) + ' 级</b></p>'
          if (dq.note) h += '<p>' + esc(dq.note) + '</p>'
        }
        blocks.push({ key: 'data', icon: 'scope-icon', title: '数据与质量要求', html: h })
      }

      // ⑤ 指标体系（1 核心 + 5 引导）
      const isys = cfg.indicatorSystem
      if (isys && (isys.core || isys.guided)) {
        let h = '<p>指标体系：<b>' + esc(isys.name || '') + '</b></p>'
        if (isys.core) {
          h += '<p style="margin-top:6px;"><b>核心指标（强制考核）</b></p>'
          h += '<ul style="margin:4px 0 0;padding-left:18px;line-height:1.95;">'
          h += '<li><b>' + esc(isys.core.name) + '</b> ' + esc(isys.core.op) + ' ' + esc(isys.core.threshold) + '</li>'
          h += '<li style="color:#94a3b8;font-size:11.5px;">计算公式：' + esc(isys.core.formula) + '</li>'
          h += '</ul>'
        }
        if (isys.guided && isys.guided.length) {
          h += '<p style="margin-top:8px;"><b>引导指标</b></p>'
          const rows = isys.guided.map(x =>
            '<li>' + esc(x.name) + ' ' + esc(x.op) + ' <b>' + esc(x.target) + esc(x.unit) + '</b></li>'
          ).join('')
          h += '<ul style="margin:4px 0 0;padding-left:18px;line-height:1.95;">' + rows + '</ul>'
        }
        if (isys.note) h += '<p style="margin-top:6px;">' + esc(isys.note) + '</p>'
        blocks.push({ key: 'indicator', icon: 'scope-icon', title: '指标体系（1 核心 + 5 引导）', html: h })
      }

      // ⑥ 排放源与数据映射
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

      // ⑦ 特殊规则
      const sp = cfg.specialRule
      if (sp && sp.rules && sp.rules.length) {
        const rows = sp.rules.map(r => '<li><b>' + esc(r.name) + '</b>：' + esc(r.desc) + '</li>').join('')
        blocks.push({
          key: 'special', icon: 'boundary-icon', title: '特殊规则',
          html: '<ul style="margin:0;padding-left:18px;line-height:1.95;">' + rows + '</ul>'
        })
      }

      return blocks
    },
    stageConfirmConfig() {
      const configs = {
        1: { label: '确认边界配置，进入核算模型', icon: 'el-icon-check', hint: '确认5项边界配置无误后进入核算模型阶段', action: () => this.sendSuggestion('确认边界配置') },
        2: { label: '确认模型，启动数据收集', icon: 'el-icon-check', hint: '确认工艺拓扑模型无误后，系统将自动完成活动数据采集与因子匹配', action: () => this.sendSuggestion('确认模型，启动数据收集') },
        5: this.validationActiveTab === 'activity'
          ? { label: '确认调整，重新校核', icon: 'el-icon-refresh-right', hint: '数据调整完成后重新进入「数据采集→因子匹配→数据校验」循环', action: () => this.confirmActivityData() }
          : null,
        6: { label: '进入碳足迹分析', icon: 'el-icon-data-analysis', hint: '查看碳足迹计算结果并进入分析阶段', action: () => this.sendSuggestion('进入碳足迹分析') },
        7: { label: '生成碳足迹报告', icon: 'el-icon-document', hint: '碳足迹分析已全部完成，生成碳足迹核算报告', action: () => this.sendSuggestion('导出评价报告') }
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
      const map = { 'PEF-DECLARATION': 'PEF 环境足迹声明', 'qct-1248': 'QC/T 1248 核算报告' }
      return map[t] || t || '—'
    },
    stdBoundary() {
      const cfg = this.selectedStandardConfig
      return (cfg && cfg.boundaryTemplate) || {}
    },
    standardsWithSelection() {
      let list = this.standards
      return list.map(std => ({
        ...std,
        active: std.code === this.selectedStandard
      }))
    },
    boundarySubStepLabels() {
      return ['生命周期范围', '量化单位', '分配规则', '取舍规则', '时间边界']
    },
    // 量化单位步骤占2个boundarySubStep（选类型+输内容），需映射到5步面板
    boundaryActiveIdx() {
      if (this.boundarySubStep <= 1) return this.boundarySubStep
      if (this.boundarySubStep === 2) return 1 // 仍为量化单位
      return this.boundarySubStep - 1 // 3→2, 4→3, 5→4
    },
    boundaryDisplayStep() {
      return this.boundaryActiveIdx + 1
    },
    lifecycleScopeLabel() {
      const map = { 'cradle-to-gate': '摇篮到大门', 'cradle-to-grave': '摇篮到坟墓', 'gate-to-gate': '大门到大门' }
      return map[this.boundaryConfig.lifecycleScope] || this.boundaryConfig.lifecycleScope
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
      // 园区碳核算以园区整体为核算对象，无产品或功能单位概念
      return 'tCO₂e（园区年度排放量）'
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
    reportSensitivityData() {
      // 园区碳核算：敏感性因子取自四大排放分类的真实排放基数
      const scale = this.totalCarbonEmission > 0 ? this.totalCarbonEmission / 16510.5 : 1
      return [
        { name: '净购入电力排放因子', coeff: 0.62, baseEmission: 6800.0 * scale },
        { name: '化石燃料燃烧低位热值', coeff: 0.35, baseEmission: 4200.0 * scale },
        { name: '能源加工转换效率', coeff: -0.28, baseEmission: 3100.0 * scale },
        { name: '工业过程工艺排放因子', coeff: 0.22, baseEmission: 2400.0 * scale },
        { name: '绿电消纳比例', coeff: -0.41, baseEmission: 6800.0 * scale }
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
    // 溯源数据：园区排放源数据项
    activeTraceabilityData() {
      return this.defaultTraceabilityData
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
      return {
        kpis: [
          { label: '园区碳排放总量', value: this.formatEmission(total), unit: 'kgCO₂e', cls: '', sub: '' },
          { label: '单位能耗碳排放', value: this.parkCarbonPerTce.toFixed(3), unit: 'tCO₂/tce', cls: this.parkCarbonPerTce <= 0.20 ? 'down-color' : 'up-color', sub: this.parkCarbonPerTce <= 0.20 ? '达标' : '未达标' },
          { label: '同比变化', value: '↓ 2.1%', sub: '减排333t', cls: 'down-color' },
          { label: '数据质量评分', value: '3.9', unit: '/ 5', cls: 'down-color', sub: '良好' }
        ],
        yoyTitle: '四大排放分类同比基准期对比',
        yoyRows: mkYoy([-23.2, -0.8, -2.1, 3.1]),
        momTitle: '排放源环比上期波动排行榜',
        momRows: [
          { proc: '净购入电力（绿电消纳比例提升）', change: '↓ 5.4% 🟢', cls: 'down-color' },
          { proc: '能源加工转换（机组效率优化）', change: '↓ 1.5% 🟢', cls: 'down-color' },
          { proc: '化石燃料燃烧（天然气用量波动）', change: '↑ 1.2% 🔴', cls: 'up-color' }
        ],
        conclusionText: '净购入电力热力为园区碳排放主要来源，通过提升绿电消纳比例与能源加工转换效率较上期降低。园区应聚焦净购入电力清洁化、能源加工转换优化、化石燃料替代等可控环节推进减排。',
        routineSugs: [
          { title: '净购入电力热力为园区排放首要热点，应作为减排核心抓手', text: '净购入电力热力占园区排放的主要份额，是园区能够直接发力减排的最大环节。建议从三个方向推进：一是提升绿电直购与绿证核销规模，扩大非化石能源消纳比例；二是推进分布式光伏建设与储能配套，提高自发自用比例；三是优化用电负荷时序，降低高峰时段外购电比例。该环节减排投入产出比较高，建议作为近期减排规划的优先领域。' },
          { title: '能源加工转换环节效率提升仍有减排空间', text: '能源加工转换环节的碳排放主要来源于转换损失。建议园区推进集中供热与热电联产优化，提升锅炉与机组运行效率；对高耗能转换设备开展能效诊断与技术改造；逐步以天然气、电能替代燃煤转换设施，降低加工转换环节的碳排放强度。' },
          { title: '化石燃料燃烧替代与工艺优化', text: '化石燃料燃烧是园区直接排放的重要来源。建议园区推动工业窑炉、锅炉的清洁能源替代，优先实施天然气替代燃煤；对无法替代的燃烧设施，通过燃烧控制优化、余热回收等方式降低单位能耗；同时建立分品种燃料消耗台账，提升数据可追溯性。' },
          { title: '建立园区碳排放数据管理体系，降低因子波动风险', text: '部分排放因子存在区域与年份差异，可能影响核算结果的稳定性。建议园区建立统一的碳排放数据收集机制，定期更新电网排放因子与燃料低位热值数据；对重点排放源安装在线监测，提升实测数据比例，逐步构建可审计的园区碳数据体系。' }
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
      return {
        coverTitle: '北京亦庄新城零碳智能产业园 碳排放核算报告',
        product: '北京亦庄新城零碳智能产业园',
        model: (this.parkBasicInfo && this.parkBasicInfo.name) || '园区整体',
        lifeDesc: '核算主体为园区整体，核算周期为' + ((this.boundaryConfig && this.boundaryConfig.timeBoundary) || '2024-01-01 ~ 2024-12-31') + '，核算口径为 E_园区 = E_能源活动 + E_工业过程。',
        dqrConclusion: '本次核算结果整体不确定度为 ±11.6%（95%置信度），变异系数 6.0%，处于较低水平。蒙特卡洛模拟（N=10,000）表明园区碳排放总量在 ' + this.confidenceIntervalText + ' kgCO₂e 区间内波动，结果稳定可靠，满足「零碳园区碳排放核算方法（试行）」对数据质量的要求。主要不确定度来源为净购入电力排放因子的区域代表性偏差，建议提升实测数据比例进一步收窄不确定度区间。',
        ch7Desc: '在企业可控排放范围内，净购入电力因子为首要减排热点，能源加工转换效率提升为减排杠杆。提升绿电消纳比例与优化园区能源结构为最有效的可控减排路径。',
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
              procChildren.push({
                id: `item-${stage.key}-${proc.name}-${inp.name}-in`,
                name: `${inp.name} (输入)`,
                activityData: `${inp.value} ${inp.unit}`,
                factor: inp.factor ? `${inp.factor} ${inp.factorUnit}` : '—',
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
    // 园区碳核算无度电碳足迹概念（该方法已随产品/风机画像清理移除）
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
    /** 工具：读取指标参数值 */
    getIndicatorParamValue(id) {
      let v = 0
      ;(this.indicatorParamList || []).forEach(g => {
        ;(g.params || []).forEach(pp => {
          if (pp.id === id) v = parseFloat(pp.value) || 0
        })
      })
      return v
    },

    /** 阶段7：切换树节点展开 */
    toggleCalcTree(key) {
      this.$set(this.calcTreeExpanded, key, !this.calcTreeExpanded[key])
    },
    /** 阶段7：判断是否展开 */
    isCalcTreeOpen(key) {
      const v = this.calcTreeExpanded[key]
      // 默认：分类展开，排放源折叠
      if (v === undefined) return key.indexOf('cat-') === 0
      return v
    },
    /** 进入阶段3 时自动同步底座数据（模拟） */
    syncBaseDataSources() {
      if (this.baseSyncDone) return
      const platformItems = (this.emissionSources || []).filter(x => x.channel === '底座数据识别')
      this.baseSyncCount = platformItems.length
      this.baseSyncDone = true
      if (platformItems.length) {
        this.$message.success('已从数据底座同步 ' + platformItems.length + ' 项排放源')
      }
    },

    /** 阶段6：指标参数分组（1 核心 + 5 引导指标的计算参数） */
    buildIndicatorDataGroup() {
      const groups = this.indicatorParamListWithAuto || []
      const sources = groups.map(g => {
        // 整组共用一个「物料」层（单层）
        const mat = {
          name: '计算参数',
          direction: 'single',
          factorObj: null,
          params: (g.params || []).map(pp => ({
            key: pp.id,
            label: pp.name,
            value: pp.autoCount ? pp.value : (pp.value || ''),
            unit: pp.unit,
            rawValue: pp.rawValue,
            rawUnit: pp.rawUnit,
            source: pp.source,
            verified: pp.verified,
            readonly: pp.readonly,
            pending: pp.pending,
            autoCount: pp.autoCount || '',
            channel: pp.channel,
            channelDetail: pp.channelDetail || '',
            __ref: pp
          }))
        }
        return {
          name: g.name,
          channel: g.type === 'core' ? '核心指标' : '引导指标',
          type: g.type,
          mats: [mat]
        }
      })
      let paramCount = 0
      sources.forEach(s => s.mats.forEach(m => { paramCount += m.params.length }))
      return {
        key: '指标参数',
        icon: 'el-icon-data-analysis',
        color: '#0067fe',
        sources,
        paramCount
      }
    },

    /* ===== 阶段6 数据清单详情 ===== */
    /** 打开参数详情（AD / 指标参数） */
    openDataListTrace(p, src, mat) {
      // 指标参数（含 __ref 引用原始对象）
      if (p.__ref) {
        const pp = p.__ref
        this.actTraceCtx = { src, mat, param: pp, isIndicator: true }
        this.actTraceRow = {
          paramName: pp.name,
          paramKey: pp.id,
          value: pp.value,
          unit: pp.unit,
          rawValue: pp.rawValue,
          rawUnit: pp.rawUnit,
          source: pp.source,
          readonly: !!pp.readonly,
          pending: !!pp.pending,
          verified: pp.verified,
          sourceName: src.name,
          category: src.type === 'core' ? '核心指标' : '引导指标',
          channel: pp.channel,
          channelDetail: pp.channelDetail || '',
          material: '计算参数',
          direction: 'single',
          convertNote: '指标计算参数，由通道自动归集或人工录入',
          quality: this.buildActQuality(pp),
          history: pp.history || [],
          proofFiles: pp.proofFiles || []
        }
        this.actTraceVisible = true
        return
      }
      // 排放源活动数据
      this.actTraceCtx = { src, mat, direction: mat.direction === 'input' ? 'input' : (mat.direction === 'output' ? 'output' : 'single') }
      this.actTraceRow = {
        paramName: p.label,
        paramKey: p.key,
        value: p.value,
        unit: p.unit,
        rawValue: p.rawValue,
        rawUnit: p.rawUnit,
        source: p.source,
        readonly: false,
        verified: p.verified,
        sourceName: src.name,
        category: src.category,
        channel: src.channel,
        material: mat.name,
        direction: mat.direction,
        convertNote: this.buildConvertNote(p),
        quality: this.buildActQuality(p),
        history: p.history || [],
        proofFiles: p.proofFiles || []
      }
      this.actTraceVisible = true
    },
    /** 打开因子详情（EF/CEF） */
    openDataListFactorTrace(mat, kind, src) {
      const f = kind === 'ef' ? mat.factorObj.ef : mat.factorObj.cef
      if (!f) return
      this.factorTraceRow = {
        name: f.name,
        key: f.key,
        value: f.value,
        unit: f.unit,
        source: f.source,
        sourceDetail: f.sourceDetail || f.source || '',
        confidence: f.confidence || '中',
        verified: f.verified,
        sourceName: src.name,
        category: src.category,
        channel: src.channel,
        quality: this.buildFactorQuality(f),
        history: f.history || [],
        proofFiles: f.proofFiles || []
      }
      this.factorTraceCtx = { ff: f, src }
      this.factorTraceVisible = true
    },

    /** 阶段5：收集某排放源下的全部因子（含 inputs/outputs 嵌套） */
    collectSourceFactors(src) {
      let all = []
      if (src.factors) all = all.concat(src.factors)
      ;(src.inputs || []).forEach(io => { all = all.concat(io.factors || []) })
      ;(src.outputs || []).forEach(io => { all = all.concat(io.factors || []) })
      return all
    },
    /** 可用排放因子库 */
    availableFactorLibs() {
      return (this.standards || []).length
        ? [
            { id: 'IPCC', name: 'IPCC 2006 国家温室气体清单', shortName: 'IPCC', version: '2006', releaseDate: '2006-01', required: true },
            { id: 'CPCD', name: '中国产品碳足迹数据库', shortName: 'CPCD', version: 'v3', releaseDate: '2024-06', required: false },
            { id: 'NATIONAL', name: '国家温室气体排放因子库', shortName: '国家因子库', version: '2025', releaseDate: '2025-03', required: true },
            { id: 'DB11', name: 'DB11/T 1787-2020 北京市核算指南', shortName: 'DB11', version: '2020', releaseDate: '2020-12', required: false },
            { id: 'GRID', name: '华北区域电网排放因子', shortName: '华北电网', version: '2022', releaseDate: '2024-04', required: true }
          ]
        : []
    },
    /** 必选排放因子库 */
    requiredFactorLibs() {
      return this.availableFactorLibs().filter(x => x.required)
    },

    /** 阶段9：下拉导出（PDF / Word / Excel） */
    handleExportParkReport(type) {
      const rp = this.parkReportProfile
      const ext = type === 'pdf' ? '.txt' : (type === 'word' ? '.doc' : '.csv')
      const filename = `零碳园区建设自评报告_${rp.parkName}_${new Date().toISOString().slice(0, 10)}${ext}`
      if (type === 'xlsx') {
        this.exportParkReportDataCSV(filename)
      } else {
        this.exportParkReport()
      }
      this.$message.success(`报告已导出为 ${type.toUpperCase()} 格式：${filename}`)
    },
    /** 阶段9：导出明细 CSV（模拟 Excel） */
    exportParkReportDataCSV(filename) {
      const L = []
      L.push('类别,名称,排放量(tCO₂),占比')
      const calc = this.parkEmissionCalc
      calc.groups.forEach(g => {
        L.push(`排放分类,${g.key},${g.subtotal.toFixed(2)},${(g.subtotal / calc.total * 100).toFixed(1)}%`)
      })
      L.push('')
      L.push('指标,类型,当前值,目标,自评')
      ;(this.parkIndicatorRows || []).forEach(x => {
        L.push(`${x.name},${x.typeName},${x.valueText},${x.targetText},${x.pass ? '达标' : '未达标'}`)
      })
      const blob = new Blob([L.join('\n')], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    },
    /** 阶段9：专家复核 */
    handleExpertReview() {
      this.$alert(
        '<div style="line-height: 2; font-size: 13px;">'
        + '<p><b>申请专家复核流程</b></p>'
        + '<p>1. 系统将打包自评报告、核算明细与全部佐证材料；</p>'
        + '<p>2. 委托具备资质的第三方机构（如 CQC、中环联合等）进行独立复核；</p>'
        + '<p>3. 复核周期通常 2~4 周，最终出具第三方核查意见；</p>'
        + '<p>4. 复核意见可用于零碳园区正式申报与披露。</p>'
        + '<p style="margin-top: 8px;"><b>是否立即提交复核申请？</b></p>'
        + '</div>',
        '专家复核申请',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '提交申请',
          cancelButtonText: '暂不申请',
          type: 'info'
        }
      ).then(() => {
        this.isExpertReviewRequested = true
        this.$message.success('专家复核申请已提交，核查机构将联系您')
      }).catch(() => {})
    },

    /** 阶段9：导出报告 */
    exportParkReport() {
      const r = this.parkReportProfile
      const calc = this.parkEmissionCalc
      const L = []
      L.push('零碳园区碳排放核算报告')
      L.push('=' .repeat(50))
      L.push('')
      L.push('【园区基本信息】')
      L.push(`园区名称：${r.parkName}`)
      L.push(`园区面积：${r.area} km²`)
      L.push(`核算标准：${r.standard}`)
      L.push(`核算年度：${r.period}`)
      L.push('核算边界：园区法定地理边界')
      L.push('气体范围：仅二氧化碳（CO₂）')
      L.push('')
      L.push('【核算结果】')
      L.push(`园区碳排放总量：${calc.total.toFixed(2)} tCO₂（${r.totalWan} 万吨CO₂）`)
      L.push(`综合能耗：${r.energy} tce`)
      L.push(`单位能耗碳排放：${r.carbonPerTce} tCO₂/tce`)
      L.push('')
      L.push('【分类排放清单】')
      calc.groups.forEach(g => {
        L.push(`  ${g.key}：${g.subtotal.toFixed(2)} tCO₂（${(g.subtotal / calc.total * 100).toFixed(1)}%）`)
      })
      L.push('')
      L.push('【指标评价】')
      ;(this.parkIndicatorRows || []).forEach(x => {
        L.push(`  ${x.name}（${x.typeName}）：${x.valueText} / 目标 ${x.targetText} → ${x.pass ? '达标' : '未达标'}`)
      })
      L.push('')
      L.push('【数据质量】')
      L.push(`  加权质量分：${r.qualityScore} / 5.0（${r.qualityGrade} 级）`)
      L.push(`  低质量项：${r.lowCount} 个`)
      L.push('')
      L.push(`生成时间：${new Date().toLocaleString('zh-CN')}`)
      const blob = new Blob([L.join('\n')], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `零碳园区碳排放核算报告_${r.parkName}_${new Date().toISOString().slice(0, 10)}.txt`
      a.click()
      URL.revokeObjectURL(url)
      this.$message.success('报告已导出')
    },
    /** 阶段9：归档报告 */
    archiveParkReport() {
      this.$confirm('确定归档本次核算报告？归档后将作为正式版本留存。', '归档确认', {
        confirmButtonText: '确定归档',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        this.isReportArchived = true
        this.$message.success('报告已归档')
      }).catch(() => {})
    },

    /** 阶段8：分析图表初始化 */
    initParkAnaCharts() {
      const echarts = (typeof window !== 'undefined' && window.__ECHARTS__) ? window.__ECHARTS__ : null
      if (!echarts) return
      this.$nextTick(() => {
        const scope = this.parkScopeTable || []
        const rank = this.parkSourceRanking || []

        // ① 构成环形图
        const el1 = this.$refs.parkAnaPieChart
        if (el1) {
          if (this._parkAnaPie) this._parkAnaPie.dispose()
          this._parkAnaPie = echarts.init(el1)
          this._parkAnaPie.setOption({
            tooltip: { trigger: 'item', formatter: '{b}<br/>{c} tCO₂ ({d}%)' },
            legend: { bottom: 0, itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 10 } },
            series: [{
              type: 'pie', radius: ['48%', '72%'], center: ['50%', '42%'],
              label: { show: true, formatter: '{b}\n{d}%', fontSize: 10 },
              data: scope.map(x => ({ name: x.name, value: x.value, itemStyle: { color: x.color } }))
            }]
          })
        }

        // ② Top 8 横向条形
        const el2 = this.$refs.parkAnaBarChart
        if (el2) {
          if (this._parkAnaBar) this._parkAnaBar.dispose()
          this._parkAnaBar = echarts.init(el2)
          const names = rank.map(x => x.name).reverse()
          const values = rank.map(x => x.value).reverse()
          const colors = rank.map(x => x.color).reverse()
          this._parkAnaBar.setOption({
            grid: { left: 150, right: 60, top: 16, bottom: 24 },
            xAxis: { type: 'value', axisLabel: { fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
            yAxis: {
              type: 'category', data: names,
              axisLabel: { fontSize: 11, width: 140, overflow: 'truncate' },
              axisLine: { show: false }, axisTick: { show: false }
            },
            series: [{
              type: 'bar', barWidth: 14,
              data: values.map((v, i) => ({ value: v, itemStyle: { color: colors[i], borderRadius: [0, 4, 4, 0] } })),
              label: { show: true, position: 'right', fontSize: 10, formatter: (p) => p.value.toFixed(1) }
            }]
          })
        }
      })
    },
    destroyParkAnaCharts() {
      [this._parkAnaPie, this._parkAnaBar].forEach(c => { try { c && c.dispose() } catch (e) {} })
      this._parkAnaPie = null
      this._parkAnaBar = null
    },

    /** 阶段7：导出计算结果 */
    exportParkCalc() {
      const calc = this.parkEmissionCalc
      const lines = []
      lines.push('园区碳排放计算结果')
      lines.push('生成时间：' + new Date().toLocaleString('zh-CN'))
      lines.push('')
      lines.push(`园区碳排放总量：${calc.total.toFixed(2)} tCO₂（${calc.totalWan} 万吨CO₂）`)
      lines.push('')
      calc.groups.forEach(g => {
        lines.push(`【${g.key}】小计 ${g.subtotal.toFixed(2)} tCO₂`)
        g.items.forEach(r => {
          lines.push(`  ${r.name} · ${r.label}：${r.formula} = ${r.emission.toFixed(2)} tCO₂`)
        })
        lines.push('')
      })
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `园区碳排放计算结果_${new Date().toISOString().slice(0, 10)}.txt`
      a.click()
      URL.revokeObjectURL(url)
      this.$message.success('计算结果已导出')
    },

    /* ===== 阶段6 质量评估图表 ===== */
    initParkQaCharts() {
      const echarts = (typeof window !== 'undefined' && window.__ECHARTS__) ? window.__ECHARTS__ : null
      if (!echarts) return
      this.$nextTick(() => {
        const q = this.parkQualityAssessment
        if (!q || !q.total) return

        // ① DQR 分布（环形）
        const el1 = this.$refs.parkQaDqrChart
        if (el1 && !this._parkQaDqr) {
          this._parkQaDqr = echarts.init(el1)
          const d = q.dqrDist
          this._parkQaDqr.setOption({
            tooltip: { trigger: 'item' },
            legend: { bottom: 0, itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 10 } },
            series: [{
              type: 'pie', radius: ['45%', '70%'], center: ['50%', '42%'],
              label: { show: true, formatter: '{b}\n{c}', fontSize: 10 },
              data: [
                { name: 'A 优秀', value: d.A, itemStyle: { color: '#15803d' } },
                { name: 'B 良好', value: d.B, itemStyle: { color: '#22c55e' } },
                { name: 'C 合格', value: d.C, itemStyle: { color: '#eab308' } },
                { name: 'D 偏低', value: d.D, itemStyle: { color: '#f97316' } },
                { name: 'E 差', value: d.E, itemStyle: { color: '#dc2626' } }
              ].filter(x => x.value > 0)
            }]
          })
        }

        // ② 数据来源结构（环形）
        const el2 = this.$refs.parkQaSourceChart
        if (el2 && !this._parkQaSource) {
          this._parkQaSource = echarts.init(el2)
          this._parkQaSource.setOption({
            tooltip: { trigger: 'item' },
            legend: { bottom: 0, itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 10 } },
            series: [{
              type: 'pie', radius: ['45%', '70%'], center: ['50%', '42%'],
              label: { show: true, formatter: '{b}\n{c}', fontSize: 10 },
              data: [
                { name: '底座直连', value: q.platformCnt, itemStyle: { color: '#0067fe' } },
                { name: '材料识别', value: q.ocrCnt, itemStyle: { color: '#f59e0b' } },
                { name: '人工录入', value: q.manualCnt, itemStyle: { color: '#8b5cf6' } },
                { name: '未知来源', value: q.unknownCnt, itemStyle: { color: '#cbd5e1' } }
              ].filter(x => x.value > 0)
            }]
          })
        }

        // ③ 覆盖率（仪表盘）
        const el3 = this.$refs.parkQaCoverChart
        if (el3 && !this._parkQaCover) {
          this._parkQaCover = echarts.init(el3)
          this._parkQaCover.setOption({
            series: [
              {
                type: 'gauge', center: ['50%', '58%'], radius: '82%',
                startAngle: 200, endAngle: -20, min: 0, max: 100,
                progress: { show: true, width: 12, itemStyle: { color: '#0067fe' } },
                axisLine: { lineStyle: { width: 12, color: [[1, '#eef2f7']] } },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: { show: false },
                pointer: { show: false },
                detail: { fontSize: 20, fontWeight: 600, offsetCenter: [0, '5%'], formatter: '{value}%' },
                title: { show: true, offsetCenter: [0, '35%'], fontSize: 11, color: '#94a3b8' },
                data: [{ value: q.sourceCoverage, name: '活动数据填写率' }]
              }
            ]
          })
        }

        // ④ 因子置信度（横向条形）
        const el4 = this.$refs.parkQaConfChart
        if (el4 && !this._parkQaConf) {
          this._parkQaConf = echarts.init(el4)
          const labels = q.confDist.map(x => x.label)
          const values = q.confDist.map(x => x.count)
          this._parkQaConf.setOption({
            grid: { left: 70, right: 30, top: 20, bottom: 20 },
            xAxis: { type: 'value', axisLabel: { fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
            yAxis: { type: 'category', data: labels, axisLabel: { fontSize: 11 }, axisLine: { show: false }, axisTick: { show: false } },
            series: [{
              type: 'bar', data: values.map((v, i) => ({ value: v, itemStyle: { color: q.confDist[i].color, borderRadius: [0, 4, 4, 0] } })),
              barWidth: 16,
              label: { show: true, position: 'right', fontSize: 11 }
            }]
          })
        }

        // ⑤ 时效性（柱状）
        const el5 = this.$refs.parkQaTimeChart
        if (el5 && !this._parkQaTime) {
          this._parkQaTime = echarts.init(el5)
          this._parkQaTime.setOption({
            grid: { left: 40, right: 20, top: 24, bottom: 30 },
            xAxis: {
              type: 'category',
              data: ['活动数据', '排放因子'],
              axisLabel: { fontSize: 11 },
              axisTick: { show: false },
              axisLine: { lineStyle: { color: '#e2e8f0' } }
            },
            yAxis: { type: 'value', name: '年份差', nameTextStyle: { fontSize: 10 }, axisLabel: { fontSize: 10 }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
            series: [{
              type: 'bar', barWidth: 28,
              data: [
                { value: q.ageInfo.dataGap, itemStyle: { color: '#22c55e', borderRadius: [4, 4, 0, 0] } },
                { value: q.ageInfo.factorGap, itemStyle: { color: q.ageInfo.factorLevel === 'ok' ? '#22c55e' : '#f59e0b', borderRadius: [4, 4, 0, 0] } }
              ],
              label: { show: true, position: 'top', fontSize: 11, formatter: '{c} 年' }
            }]
          })
        }

        // 统一 resize
        this._parkQaCharts = [this._parkQaDqr, this._parkQaSource, this._parkQaCover, this._parkQaConf, this._parkQaTime].filter(Boolean)
      })
    },
    destroyParkQaCharts() {
      (this._parkQaCharts || []).forEach(c => { try { c && c.dispose() } catch (e) {} })
      this._parkQaCharts = null
      this._parkQaDqr = null
      this._parkQaSource = null
      this._parkQaCover = null
      this._parkQaConf = null
      this._parkQaTime = null
    },
    /** 图表点击解读 */
    onParkQaClick(type) {
      const q = this.parkQualityAssessment
      let content = ''
      if (type === 'score') {
        content = `**【加权质量分】**\n\n**当前得分：**${q.weightedScore} / 5.0（${q.weightedGrade} 级）\n\n**计算方式：**按活动数据量对数加权\n加权分 = Σ(w × 单项分) / Σw，w = log₁₀(活动数据 + 1)\n\n**分级标准：**\n· 1.0~1.8 → A 级（优秀）\n· 1.8~2.6 → B 级（良好）\n· 2.6~3.4 → C 级（合格）\n· 3.4~4.2 → D 级（偏低）\n· 4.2~5.0 → E 级（差）\n\n**当前构成：**\n· 数据项 ${q.total} 个（活动数据 ${q.adTotal} + 排放因子 ${q.efTotal}）`
      } else if (type === 'dqr') {
        const d = q.dqrDist
        content = `**【DQR 分布】**\n\n· A 优秀：${d.A} 项\n· B 良好：${d.B} 项\n· C 合格：${d.C} 项\n· D 偏低：${d.D} 项\n· E 差：${d.E} 项\n\n**评级规则：**\n· A：底座直连/计量表/关口表\n· B：凭证/台账/OCR 解析或标准因子\n· C：未确认或行业缺省\n· D：缺少数据来源\n· E：活动数据未填写`
      } else if (type === 'source') {
        content = `**【数据来源结构】**\n\n· 底座直连：${q.platformCnt} 项\n· 材料识别：${q.ocrCnt} 项\n· 人工录入：${q.manualCnt} 项\n· 未知来源：${q.unknownCnt} 项\n\n数据来源越靠前，可追溯性越强。`
      } else if (type === 'cover') {
        content = `**【覆盖率】**\n\n· 活动数据填写率：${q.sourceCoverage}%（${q.adTotal} 项）\n· 排放因子匹配率：${q.factorCoverage}%（${q.efTotal} 项）\n\n覆盖率低于 100% 时，核算结果不完整。`
      } else if (type === 'conf') {
        content = `**【因子匹配置信度】**\n\n${q.confDist.map(x => `· ${x.label}：${x.count} 项`).join('\n')}\n\n高置信因子来自权威库（IPCC/国家清单/地方标准），低置信因子建议替换为企业实测。`
      } else if (type === 'time') {
        const a = q.ageInfo
        content = `**【时效性】**\n\n· 活动数据年份：${a.dataYear}（差 ${a.dataGap} 年）\n· 因子版本：${a.factorVersion}\n· 因子年份差：${a.factorGap} 年\n\n${a.factorLevel === 'ok' ? '因子时效性良好。' : '因子版本较旧，建议关注是否有更新版本。'}`
      }
      this.processInput(`查看${type === 'score' ? '加权质量分' : type === 'dqr' ? 'DQR分布' : type === 'source' ? '数据来源结构' : type === 'cover' ? '覆盖率' : type === 'conf' ? '因子置信度' : '时效性'}解读`)
      this.$nextTick(() => {
        this.messages.push({
          id: 'msg-qa-' + Date.now(),
          role: 'assistant',
          content: content,
          timestamp: new Date().toLocaleTimeString('zh-CN')
        })
        this.scrollToBottom()
      })
    },

    /* ===== 阶段5 因子详情 ===== */
    /** 打开因子详情抽屉 */
    openFactorTrace(ff, src) {
      this.factorTraceRow = {
        name: ff.name,
        key: ff.key,
        value: ff.value,
        unit: ff.unit,
        source: ff.source,
        sourceDetail: ff.sourceDetail || ff.source || '',
        confidence: ff.confidence || '中',
        verified: ff.verified,
        sourceName: src ? src.name : '',
        category: src ? src.category : '',
        channel: src ? src.channel : '',
        // 质量评级
        quality: this.buildFactorQuality(ff),
        // 历史
        history: ff.history || [],
        // 佐证
        proofFiles: ff.proofFiles || []
      }
      this.factorTraceCtx = { ff, src }
      this.factorTraceVisible = true
    },
    /** 因子数据质量 */
    buildFactorQuality(ff) {
      if (ff.value === '' || ff.value === undefined) return { level: '待补充', note: '参数值未填写', cls: 'is-missing' }
      if (!ff.source) return { level: '低', note: '缺少来源依据', cls: 'is-low' }
      if (/IPCC|GB\/T|DB11|国家|标准/.test(ff.source)) return { level: '高', note: '来自权威标准缺省值', cls: 'is-high' }
      return { level: '中', note: '来源已记录', cls: 'is-mid' }
    },
    /** 保存因子修改 */
    saveFactorTrace() {
      const r = this.factorTraceRow
      const ctx = this.factorTraceCtx
      if (!r || !ctx || !ctx.ff) return
      const ff = ctx.ff
      if (ff.value !== r.value) {
        if (!ff.history) this.$set(ff, 'history', [])
        ff.history.push({
          time: new Date().toLocaleString('zh-CN'),
          field: '参数值',
          from: ff.value || '—',
          to: r.value || '—'
        })
        ff.value = r.value
      }
      if (r.proofFiles) this.$set(ff, 'proofFiles', r.proofFiles)
      this.$message.success('已保存并记录留痕')
      this.factorTraceVisible = false
    },
    /** 切换因子确认状态 */
    toggleFactorVerified(ff) {
      ff.verified = !ff.verified
    },

    /** 切换参数确认状态 */
    toggleParamVerified(p) {
      p.verified = !p.verified
    },

    /** 阶段4：确认活动数据，进入阶段5（因子匹配） */
    confirmActivityData() {
      const st = this.activityStats
      if (st.pending > 0) {
        this.$message.warning(`还有 ${st.pending} 个参数待确认`)
        return
      }
      this.currentStepIndex = 4
      this.$message.success('活动数据已全部确认，进入排放因子匹配')
    },

    /** 阶段5：确认因子匹配，进入阶段6 */
    confirmFactorMatch() {
      const st = this.factorMatchStats
      if (st.pending > 0) {
        this.$message.warning(`还有 ${st.pending} 个因子待确认`)
        return
      }
      this.currentStepIndex = 5
      if (!this.validationStep || this.validationStep < 1 || this.validationStep > 4) {
        this.validationStep = 1
      }
      this.validationActiveTab = 'quality'
      this.$message.success('排放因子已全部确认，进入数据校验')
    },

    /** 阶段5：定位到下一个待确认因子 */
    gotoNextPendingFactor() {
      const list = []
      ;(this.factorMatchList || []).forEach(src => {
        // 单一因子
        ;(src.factors || []).forEach(f => {
          if (f && !f.verified) {
            list.push({
              pid: 'fac-' + src.id + '-' + f.key,
              name: f.name,
              src: src.name,
              category: src.category
            })
          }
        })
        // 输入/输出物料因子
        const pushMat = (arr) => {
          ;(arr || []).forEach(mat => {
            ;(mat.factors || []).forEach(f => {
              if (f && !f.verified) {
                list.push({
                  pid: 'fac-' + src.id + '-' + mat.id + '-' + f.key,
                  name: f.name,
                  src: src.name + ' / ' + mat.name,
                  category: src.category
                })
              }
            })
          })
        }
        pushMat(src.inputs)
        pushMat(src.outputs)
      })

      const next = list[0]
      if (!next) {
        this.$message.success('已无待确认因子')
        return
      }
      // 清除旧高亮
      document.querySelectorAll('.row-highlight').forEach(el => el.classList.remove('row-highlight'))
      const el = document.querySelector(`[data-pid="${next.pid}"]`)
      if (el) {
        el.classList.add('row-highlight')
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      this.$message.info(`已定位到待确认因子：${next.category} · ${next.src} · ${next.name}`)
    },

    /** 阶段4：定位到下一个待确认参数 */
    gotoNextPending() {
      const list = []
      // ① 排放源活动数据参数
      ;(this.activityDataList || []).forEach(src => {
        ;(src.params || []).forEach(pp => {
          list.push({ pid: 'act-' + src.id + '-' + pp.key, verified: pp.verified, readonly: false, name: pp.label, src: src.name, type: '排放源' })
        })
        ;(src.inputs || []).forEach(mat => {
          ;(mat.params || []).forEach(pp => {
            list.push({ pid: 'act-' + src.id + '-' + pp.key, verified: pp.verified, readonly: false, name: mat.name + ' · ' + pp.label, src: src.name, type: '输入' })
          })
        })
        ;(src.outputs || []).forEach(mat => {
          ;(mat.params || []).forEach(pp => {
            list.push({ pid: 'act-' + src.id + '-' + pp.key, verified: pp.verified, readonly: false, name: mat.name + ' · ' + pp.label, src: src.name, type: '输出' })
          })
        })
      })
      // ② 指标参数
      ;(this.indicatorParamListWithAuto || []).forEach(g => {
        ;(g.params || []).forEach(pp => {
          list.push({ pid: 'ind-' + pp.id, verified: pp.verified, readonly: pp.readonly, name: pp.name, src: g.name, type: '指标' })
        })
      })
      // 找第一个未确认且可编辑的
      const next = list.find(x => !x.verified && !x.readonly)
      if (!next) {
        this.$message.success('已无待确认项')
        return
      }
      // 清除旧高亮
      document.querySelectorAll('.row-highlight').forEach(el => el.classList.remove('row-highlight'))
      // 高亮并滚动（直接操作 DOM）
      const el = document.querySelector(`[data-pid="${next.pid}"]`)
      if (el) {
        el.classList.add('row-highlight')
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        this.$message.warning('未找到目标参数行')
        return
      }
      this.$message.info(`已定位到待确认项：${next.type} · ${next.src} · ${next.name}`)
    },

    /* ===== 阶段4 佐证材料上传 ===== */
    /** 文件类型图标 */
    proofFileIcon(name) {
      const ext = (name || '').split('.').pop().toLowerCase()
      if (['pdf'].includes(ext)) return 'el-icon-document'
      if (['xls', 'xlsx', 'csv'].includes(ext)) return 'el-icon-s-grid'
      if (['doc', 'docx'].includes(ext)) return 'el-icon-tickets'
      if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) return 'el-icon-picture-outline'
      return 'el-icon-paperclip'
    },
    /** 文件大小格式化 */
    formatFileSize(bytes) {
      if (!bytes) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
    },
    /** 选择文件后加入列表 */
    onProofFileChange(file, fileList) {
      if (!this.actTraceRow) return
      const raw = file.raw || file
      // 大小校验 20MB
      if (raw.size && raw.size > 20 * 1024 * 1024) {
        this.$message.warning(`「${raw.name}」超过 20MB，请压缩后重新上传`)
        return
      }
      if (!this.actTraceRow.proofFiles) this.$set(this.actTraceRow, 'proofFiles', [])
      this.actTraceRow.proofFiles.push({
        name: raw.name,
        size: raw.size || 0,
        sizeText: this.formatFileSize(raw.size || 0),
        uploadTime: new Date().toLocaleString('zh-CN')
      })
      this.$message.success(`已添加佐证材料：${raw.name}`)
      // 清空 uploader 内部列表，便于继续添加
      this.$nextTick(() => {
        if (this.$refs.proofUploader) this.$refs.proofUploader.clearFiles()
      })
    },
    /** 预览 */
    previewProof(f) {
      this.$alert(
        `<div style="line-height:2;font-size:13px;">
          <div><b>文件名：</b>${f.name}</div>
          <div><b>大小：</b>${f.sizeText}</div>
          <div><b>上传时间：</b>${f.uploadTime || '—'}</div>
        </div>`,
        '佐证材料信息',
        { dangerouslyUseHTMLString: true, confirmButtonText: '关闭' }
      )
    },
    /** 替换文件 */
    replaceProof(idx) {
      const list = this.actTraceRow.proofFiles || []
      if (idx < 0 || idx >= list.length) return
      this._replacingProofIdx = idx
      // 触发文件选择（复用 uploader）
      const input = this.$refs.proofUploader && this.$refs.proofUploader.$el.querySelector('input[type=file]')
      if (input) {
        input.value = ''
        input.click()
      } else {
        this.$message.info('请直接点「继续添加佐证」上传新文件后删除旧文件')
      }
    },
    /** 删除文件 */
    removeProof(idx) {
      const list = this.actTraceRow.proofFiles || []
      if (idx < 0 || idx >= list.length) return
      const f = list[idx]
      this.$confirm(`确定删除佐证材料「${f.name}」吗？`, '删除确认', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        list.splice(idx, 1)
        this.$message.success('已删除')
      }).catch(() => {})
    },

    /* ===== 阶段4 参数详情抽屉 ===== */
    /** 点击参数行：打开详情抽屉 */
    openActTrace(param, src, mat, direction) {
      this.actTraceCtx = {
        src, mat, direction: direction || 'single'
      }
      this.actTraceRow = {
        paramName: param.label,
        paramKey: param.key,
        value: param.value,
        unit: param.unit,
        rawValue: param.rawValue,
        rawUnit: param.rawUnit,
        source: param.source,
        verified: param.verified,
        // 上下文
        sourceName: src ? src.name : '',
        category: src ? src.category : '',
        channel: src ? src.channel : '',
        material: mat ? mat.name : '',
        direction: direction || 'single',
        // 换算
        convertNote: this.buildConvertNote(param),
        // 质量
        quality: this.buildActQuality(param),
        // 佐证材料
        proofFiles: param.proofFiles || [],
        // 历史（演示）
        history: param.history || []
      }
      this.actTraceVisible = true
    },
    /** 生成换算说明 */
    buildConvertNote(p) {
      if (!p.rawValue || !p.rawUnit) return ''
      if (p.rawUnit === p.unit) {
        return `原始值 ${p.rawValue} ${p.rawUnit}，单位一致无需换算`
      }
      return `原始值 ${p.rawValue} ${p.rawUnit} 换算为 ${p.value} ${p.unit}`
    },
    /** 数据质量评级 */
    buildActQuality(p) {
      if (!p.value) return { level: '待补充', note: '活动数据尚未填写', cls: 'is-missing' }
      if (!p.source) return { level: '低', note: '缺少数据来源与佐证材料', cls: 'is-low' }
      if (/底座数据直连|关口表|EMS|计量/.test(p.source)) {
        return { level: '高', note: '数据由底座直连或计量表采集，可追溯', cls: 'is-high' }
      }
      if (/OCR|台账|结算|凭证/.test(p.source)) {
        return { level: '中', note: '数据来自凭证/台账解析，建议保留原始凭证', cls: 'is-mid' }
      }
      return { level: '中', note: '数据来源已记录', cls: 'is-mid' }
    },
    /** 抽屉内保存 */
    saveActTrace() {
      const r = this.actTraceRow
      const ctx = this.actTraceCtx
      if (!r || !ctx) return
      // 指标参数：直接写回原始对象
      if (ctx.isIndicator && ctx.param) {
        const pp = ctx.param
        if (!pp.readonly && r.value !== undefined && pp.value !== r.value) {
          if (!pp.history) this.$set(pp, 'history', [])
          pp.history.push({
            time: new Date().toLocaleString('zh-CN'),
            field: '参数值',
            from: pp.value || '—',
            to: r.value || '—'
          })
          pp.value = r.value
        }
        if (r.proofFiles) this.$set(pp, 'proofFiles', r.proofFiles)
        this.$message.success('已保存并记录留痕')
        this.actTraceVisible = false
        return
      }
      // 定位参数对象并更新
      let target = null
      if (ctx.direction === 'single') {
        target = (ctx.src.params || []).find(x => x.key === r.paramKey)
      } else {
        target = (ctx.mat.params || []).find(x => x.key === r.paramKey)
      }
      if (target) {
        // 参数值同步（抽屉内可编辑）
        if (r.value !== undefined && target.value !== r.value) {
          if (!target.history) this.$set(target, 'history', [])
          target.history.push({
            time: new Date().toLocaleString('zh-CN'),
            field: '参数值',
            from: target.value || '—',
            to: r.value || '—'
          })
          target.value = r.value
        }
        // 佐证材料变更记录
        const newFiles = r.proofFiles || []
        const oldFiles = target.proofFiles || []
        if (newFiles.length !== oldFiles.length) {
          if (!target.history) this.$set(target, 'history', [])
          target.history.push({
            time: new Date().toLocaleString('zh-CN'),
            field: '佐证材料',
            from: oldFiles.length + ' 份',
            to: newFiles.length + ' 份'
          })
        }
        if (r.proofFiles) this.$set(target, 'proofFiles', r.proofFiles)
        this.$message.success('已保存并记录留痕')
      }
      this.actTraceVisible = false
    },

    /** 收集某排放源下的全部参数（含物料嵌套） */
    collectSourceParams(src) {
      let all = []
      if (src.params) all = all.concat(src.params)
      ;(src.inputs || []).forEach(io => { all = all.concat(io.params || []) })
      ;(src.outputs || []).forEach(io => { all = all.concat(io.params || []) })
      return all
    },

    /* ===== 阶段3 输入/输出项增删 ===== */
    /** 添加输入/输出项 */
    addSourceIO(src, kind) {
      if (!src[kind]) this.$set(src, kind, [])
      const list = src[kind]
      const seq = list.length + 1
      const prefix = kind === 'inputs' ? 'IN' : 'OUT'
      list.push({
        id: prefix + '-' + src.id + '-' + Date.now(),
        name: kind === 'inputs' ? '新输入项' : '新输出项'
      })
      this.$message.success('已添加' + (kind === 'inputs' ? '输入项' : '输出项'))
    },
    /** 删除输入/输出项 */
    removeSourceIO(src, kind, idx) {
      const list = src[kind] || []
      if (idx < 0 || idx >= list.length) return
      const item = list[idx]
      this.$confirm(`确定删除「${item.name}」吗？`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        list.splice(idx, 1)
        this.$message.success('已删除')
      }).catch(() => {})
    },

    /** 阶段3：确认排放源清单，直接进入阶段4（不弹二次确认） */
    confirmStage3() {
      const enabled = (this.emissionSources || []).filter(x => x.enabled).length
      if (!enabled) {
        this.$message.warning('请至少启用 1 个排放源')
        return
      }
      this.currentStepIndex = 3
      this.$message.success(`已确认 ${enabled} 个排放源，进入活动数据采集`)
    },

    /* ===== 阶段3 排放源增删改 ===== */
    /** 打开添加对话框 */
    openAddSource(category) {
      this.sourceDialogMode = 'add'
      this.sourceForm = {
        id: null,
        name: '',
        category: category || '化石燃料燃烧',
        channel: '手动添加',      // 手动创建固定为此渠道
        channelDetail: ''
      }
      this.sourceDialogVisible = true
    },
    /** 打开编辑对话框 */
    openEditSource(src) {
      this.sourceDialogMode = 'edit'
      this.sourceForm = {
        id: src.id,
        name: src.name,
        category: src.category,
        channel: src.channel,
        channelDetail: src.channelDetail || ''
      }
      this.sourceDialogVisible = true
    },
    /** 保存（新增或更新） */
    saveEmissionSource() {
      const f = this.sourceForm
      if (!f.name || !f.name.trim()) {
        this.$message.warning('请填写排放源名称')
        return
      }
      if (this.sourceDialogMode === 'add') {
        const maxId = (this.emissionSources || []).reduce((m, x) => Math.max(m, Number(x.id) || 0), 0)
        this.emissionSources.push({
          id: maxId + 1,
          name: f.name.trim(),
          category: f.category,
          channel: '手动添加',      // 手动添加渠道
          channelDetail: '',        // 手动添加无需数据来源
          enabled: true
        })
        this.$message.success('已添加排放源：' + f.name.trim())
      } else {
        const target = (this.emissionSources || []).find(x => x.id === f.id)
        if (target) {
          target.name = f.name.trim()
          target.category = f.category
          // 渠道与来源由系统维护，编辑时不修改
          this.$message.success('已更新排放源：' + f.name.trim())
        }
      }
      this.sourceDialogVisible = false
    },
    /** 删除排放源 */
    removeEmissionSource(src) {
      this.$confirm(`确定删除排放源「${src.name}」吗？`, '删除确认', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const idx = (this.emissionSources || []).findIndex(x => x.id === src.id)
        if (idx > -1) {
          this.emissionSources.splice(idx, 1)
          this.$message.success('已删除')
        }
      }).catch(() => {})
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
      const taskRegion = (this.boundaryConfig && this.boundaryConfig.region) || '华东'
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
        // 电力因子按场景精准路由
        if (isFootprint) {
          selectedFactor = { factorId: 'CPCD-EN-001', name: '华东电网平均排放因子', value: '0.581', unit: 'kgCO₂e/kWh', db: 'CPCD 2026版', pool: '生命周期数据库(池3)', tech: '电网平均', geo: '华东', year: '2024' }
          candidates.push({ factorId: 'CPCD-EN-001', name: '华东电网平均排放因子', excluded: false, reason: '选中: 符合产品碳足迹摇篮到大门边界 + 华东区域生产地' })
          candidates.push({ factorId: 'NGEF-EN-004', name: '华东区域电力平均因子', excluded: true, reason: '排除: 口径为消费侧CO₂，未含上游线损与全生命周期' })
          confidence = 0.95
        } else {
          selectedFactor = { factorId: 'NGEF-EN-004', name: '华东区域电力平均因子', value: '0.5500', unit: 'kgCO₂/kWh', db: '国家温室气体排放因子库', pool: '国家官方公告(池1)', tech: '电网平均', geo: '华东', year: '2023' }
          candidates.push({ factorId: 'NGEF-EN-004', name: '华东区域电力平均因子', excluded: false, reason: '选中: 国家生态环境部权威公告 + 组织范围二消费侧CO₂口径' })
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
        scenario: isFootprint ? '产品碳足迹 (零碳园区碳排放核算方法/QC/T)' : '组织碳核算 (ISO 14064)',
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
    // 默认标准编码（列表第一条，避免硬编码）
    defaultStandardCode() {
      return (this.standards[0] || {}).code || ''
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
      return this.emissionExpandedNodes[id] !== false
    },
    getItemPercentWidth(emission) {
      const absVal = Math.abs(emission)
      const percent = Math.min((absVal / 12800.0) * 100, 100)
      return `${percent}%`
    },    /** 数字千分位格式化 */    /** 两位小数（修正浮点精度） */
    fmt2(val) {
      const n = parseFloat(val)
      if (isNaN(n)) return '0.00'
      return (Math.round(n * 100) / 100).toFixed(2)
    },

    formatNum(val) {
      const n = parseFloat(val) || 0
      const s = n.toFixed(2).replace(/\.00$/, '')
      const parts = s.split('.')
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      return parts.join('.')
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
            const factor = parseFloat(item.factor) || 0
            return (val * factor).toFixed(1)
          }
        }
      }
      return '0'
    },
    // ===== 阶段3行内编辑方法 =====
    addProcess(groupIndex) {
      const group = this.modelStages[groupIndex]
      if (!group) return
      const newProc = {
        name: '新单元过程',
        allocation: this.boundaryConfig.allocationRule || 'mass',
        allocationRemark: '',
        inputs: [{ name: '新输入', flowType: 'elementary', listType: 'raw_material' }],
        outputs: [{ name: '新输出', flowType: 'elementary', listType: 'waste_gas' }]
      }
      group.processes.push(newProc)
      // 定位反馈：高亮新增行并滚动至可视区，便于用户立即编辑
      const pi = group.processes.length - 1
      this.highlightProc = { gi: groupIndex, pi: pi }
      this.$message.success('已新增单元过程，请编辑名称与输入/输出流')
      this.$nextTick(() => {
        const el = document.querySelector('.process-row.proc-highlight')
        if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      })
      setTimeout(() => { this.highlightProc = null }, 1800)
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
        { key: 'raw_material', title: '原材料获取阶段', dotClass: 'sd-raw', processes: [] },
        { key: 'manufacturing', title: '生产制造阶段', dotClass: 'sd-manu', processes: [] },
        { key: 'transport', title: '运输分销阶段', dotClass: 'sd-trans', processes: [] },
        { key: 'use', title: '产品使用阶段', dotClass: 'sd-use', processes: [] },
        { key: 'recycle', title: '报废回收阶段', dotClass: 'sd-recycle', processes: [] }
      ]
    },
    // 园区碳核算场景不区分产品机型画像，统一按园区口径核算
    // （保留方法签名以兼容既有调用，恒返回 false）
    isWindTask() {
      return false
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
    // 构建园区排放源模型（仅在事件处理时机调用）
    buildModelStages() {
      return this.createInitialModelStages()
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
    // 标准复用政策标准库已有的 国家级零碳园区建设指标体系 通用条目（同编号去重，不另插风机变体）
    applyWindTaskProfile() {
      const code = '国家级零碳园区建设指标体系（试行）'
      // 兼容旧快照：移除历史版本动态插入的风机变体条目，避免列表重复
      this.standards = this.standards.filter(s => s.code.indexOf('（风力发电机组）') === -1)
      this.standards.forEach(s => { s.active = s.code === code })
      this.selectedStandard = code
      this.boundaryConfig.unitType = 'functional'
      this.boundaryConfig.unitDetail = '1台陆上风电机组（额定功率6.5MW，叶轮直径171m，塔架高度110m，设计寿命20年，年均发电小时数4200h）'
      this.modelStages = this.createWindModelStages()
      this.validationItems = this.createWindValidationItems()
    },
    // 园区碳核算画像：统一按「零碳园区碳排放核算方法（试行）」园区口径
    applyDefaultTaskProfile() {
      this.selectedStandard = '零碳园区碳排放核算方法（试行）'
      this.boundaryConfig.unitType = 'park'
      this.boundaryConfig.unitDetail = '园区整体（年度周期核算）'
      this.modelStages = this.createInitialModelStages()
      this.validationItems = this.createDefaultValidationItems()
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
      if (proc.allocation !== this.boundaryConfig.allocationRule) {
        // 分配规则与全局不一致，自动生成备注
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
    /** 阶段6 · 数据校验汇总（园区版，按 4 大分类 + 6 项指标汇总） */
    buildValidationSummary() {
      const q = this.parkQualityAssessment || {}
      const low = q.lowQuality || []
      const st = this.parkIndicatorStats || {}
      const total = q.total || 0
      const adTotal = q.adTotal || 0
      const efTotal = q.efTotal || 0

      let msg = `**【阶段6 · 数据校验】**\n系统已完成数据质量评估（DQR 1\~5 级），共归集 **${total} 项**数据项（活动数据 ${adTotal} + 排放因子 ${efTotal}）：\n`

      // ① 加权质量分
      msg += `\n**❶ 整体质量评估**\n`
      msg += `• 加权质量分：**${q.weightedScore} / 5.0**（${q.weightedGrade} 级）\n`
      msg += `• 数据来源：底座直连 + 材料识别双通道归集\n`
      msg += `• 覆盖率：活动数据填写率 ${q.sourceCoverage || 0}%，排放因子匹配率 ${q.factorCoverage || 0}%\n`
      msg += `• 数据项：活动数据 ${adTotal} 项，排放因子 ${efTotal} 项\n`

      // ② 低质量项
      if (low.length > 0) {
        msg += `\n**❷ 低质量项（${low.length} 项）**\n`
        low.forEach((x, i) => {
          msg += `• ${x.name || x.src || '—'}：${x.note || x.reason || '建议补充佐证材料'}\n`
        })
      } else {
        msg += `\n**❷ 低质量项**\n• 无，全部数据项均达到 B 级及以上\n`
      }

      // ③ 一致性 / 待确认
      const pendingCount = q.pending || 0
      if (pendingCount > 0) {
        msg += `\n**❸ 待确认项（${pendingCount} 项）**\n• 请在「数据清单」页签逐项核对，或点击「全部使用建议值确认」一键处理\n`
      } else {
        msg += `\n**❸ 待确认项**\n• 无，所有参数已确认\n`
      }

      // ④ 指标达标准备
      msg += `\n**❹ 指标达标准备**\n• 已归集 ${st.total || 6} 项指标（1 核心 + 5 引导）计算所需参数\n• 单位能耗碳排放、清洁能源消费比重、产品能效达标比例、工业固废综合利用率、工业余能利用率、中水回用率\n`

      msg += `\n---\n\n**可进行的操作**：\n* 查看「整体质量评估」与「数据清单」页签详情\n* 点击「下一个待确认」逐项核对\n* 全部确认后进入「排放计算」`

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
    // ===== 排放源清单校验（四大法定分类） =====
    validateModel() {
      const issues = []
      const CATS = ['化石燃料燃烧', '能源加工转换', '净购入电力热力', '工业过程']
      const srcList = this.emissionSources || []

      // 1. 至少一个排放源
      if (srcList.length === 0) {
        issues.push('排放源清单为空，请至少添加 1 个排放源')
        return issues
      }

      // 2. 每个分类至少一个排放源（工业过程可为空，视园区实际情况）
      const byCat = {}
      srcList.forEach(src => {
        const cat = src.category
        if (!byCat[cat]) byCat[cat] = []
        byCat[cat].push(src)
      })
      CATS.forEach(cat => {
        if (cat === '工业过程') return   // 工业过程可选
        if (!byCat[cat] || byCat[cat].length === 0) {
          issues.push(`【${cat}】尚未添加任何排放源，建议至少维护 1 项`)
        }
      })

      // 3. 排放源名称检查
      const srcNames = {}
      srcList.forEach((src, si) => {
        const nm = src.name ? src.name.trim() : ''
        if (!nm) {
          issues.push(`第 ${si + 1} 个排放源名称为空`)
        } else if (srcNames[nm]) {
          issues.push(`排放源「${nm}」名称重复`)
        } else {
          srcNames[nm] = true
        }
      })

      // 4. 能源加工转换 / 净购入电力热力需有输入或输出物料
      srcList.forEach(src => {
        if (src.category === '能源加工转换' || src.category === '净购入电力热力') {
          const hasIn = src.inputs && src.inputs.length > 0
          const hasOut = src.outputs && src.outputs.length > 0
          if (!hasIn && !hasOut) {
            issues.push(`【${src.category}·${src.name}】既无输入也无输出物料，请至少维护 1 组`)
          }
        }
      })

      // 5. 其他计算参数完整性（16 项）
      const paramList = this.indicatorParamList || []
      let totalParams = 0
      paramList.forEach(g => {
        ;(g.params || []).forEach(p => {
          totalParams++
          if (!p.value && p.readonly !== true) {
            issues.push(`指标「${p.name}」未填写数值`)
          }
        })
      })
      if (totalParams < 10) {
        issues.push(`其他计算参数清单不完整（当前 ${totalParams} 项，应至少 10 项）`)
      }

      return issues
    },
  },
  mounted() {
    // 加载用户偏好
    this.loadUserPreferences()
    const q = this.$route.query || {}
    // ① 继续已有任务：带 task 参数 → 恢复该任务，不新建
    if (q.task) {
      const existing = (this.taskList || []).find(t => t.id === q.task)
      if (existing) {
        this.currentTaskId = existing.id
        this.currentStepIndex = Number(existing.currentStepIndex) || 0
        this.pageMode = 'task-active'
        this.initChatFlow()
        this.scrollToBottom()
        return
      }
    }
    // ② 新建任务：必须同时带 new=1 + direct=true → 只创建一次
    if (q.direct === 'true' && q.new === '1') {
      this.startDirectNineStage()
      // 创建后清理 URL 参数，避免刷新时重复创建
      this.$router.replace({
        path: this.$route.path,
        query: { task: this.currentTaskId, direct: 'true' }
      }).catch(() => {})
      return
    }
    // ③ 其他情况：保持当前模式
    if (this.pageMode === 'task-active') {
      this.initChatFlow()
      this.scrollToBottom()
    }
  },
  updated() {
    // 阶段8：初始化分析图表
    if (this.currentStepIndex === 7 && !this._parkAnaInitDone) {
      this._parkAnaInitDone = true
      setTimeout(() => this.initParkAnaCharts(), 200)
    }
    if (this.currentStepIndex !== 7 && this._parkAnaInitDone) {
      this._parkAnaInitDone = false
    }
    // 阶段6：初始化质量评估图表
    if (this.currentStepIndex === 5 && !this._parkQaInitDone) {
      this._parkQaInitDone = true
      setTimeout(() => this.initParkQaCharts(), 200)
    }
    if (this.currentStepIndex !== 5 && this._parkQaInitDone) {
      this._parkQaInitDone = false
    }
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
