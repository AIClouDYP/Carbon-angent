// 公式库默认数据（共享模块）：FormulaLibrary 管理页与智慧报告工作台共用同一份种子。
// 消费方读取 localStorage 为空时以此兜底——解决懒初始化（未打开管理页时公式计数为 0）问题。
export const DEFAULT_FORMULAS = [
        // === 排放源级 ===
        {
          id: 'FL-001', calcObject: '燃料燃烧源', indicator: '排放量', indicatorUnit: 'tCO₂',
          formula: 'E = AD × EF × (1 - 氧化率)',
          appliedStandard: 'GB/T 32150', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '适用于化石燃料燃烧产生的直接碳排放计算',
          params: [
            { symbol: 'AD', meaning: '燃料消耗量', unit: 't或m³', source: '数据采集' },
            { symbol: 'EF', meaning: '排放因子', unit: 'tCO₂/t', source: '排放因子库' },
            { symbol: '氧化率', meaning: '碳氧化率', unit: '%', source: '标准默认值' }
          ]
        },
        {
          id: 'FL-002', calcObject: '外购电力', indicator: '排放量', indicatorUnit: 'tCO₂',
          formula: 'E = AD × EF',
          appliedStandard: 'GB/T 32150', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '外购电力间接排放，采用分时分区电碳因子时精度更高',
          params: [
            { symbol: 'AD', meaning: '外购电量', unit: 'MWh', source: '数据采集' },
            { symbol: 'EF', meaning: '电网排放因子', unit: 'tCO₂/MWh', source: '电碳因子库' }
          ]
        },
        {
          id: 'FL-003', calcObject: '外购热力/蒸汽', indicator: '排放量', indicatorUnit: 'tCO₂',
          formula: 'E = AD × EF',
          appliedStandard: 'GB/T 32150', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '外购热力或蒸汽的间接排放计算',
          params: [
            { symbol: 'AD', meaning: '外购热量', unit: 'GJ', source: '数据采集' },
            { symbol: 'EF', meaning: '热力排放因子', unit: 'tCO₂/GJ', source: '排放因子库' }
          ]
        },
        {
          id: 'FL-004', calcObject: '过程排放', indicator: '排放量', indicatorUnit: 'tCO₂',
          formula: 'E = M × R × GWP',
          appliedStandard: 'GB/T 32150', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '生产工艺过程中化学反应产生的碳排放',
          params: [
            { symbol: 'M', meaning: '原料消耗量', unit: 't', source: '数据采集' },
            { symbol: 'R', meaning: '化学计量比', unit: '—', source: '标准默认值' },
            { symbol: 'GWP', meaning: 'GWP转换系数', unit: 'tCO₂/t', source: '排放因子库' }
          ]
        },
        {
          id: 'FL-005', calcObject: '逃逸排放', indicator: '排放量', indicatorUnit: 'tCO₂e',
          formula: 'E = M × GWP',
          appliedStandard: 'GB/T 32150', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '制冷剂、六氟化硫等温室气体逃逸排放',
          params: [
            { symbol: 'M', meaning: '气体补充量/泄漏量', unit: 't', source: '数据采集' },
            { symbol: 'GWP', meaning: 'GWP转换系数', unit: 'tCO₂e/t', source: '排放因子库' }
          ]
        },
        {
          id: 'FL-006', calcObject: '生物质燃烧源', indicator: '生物源排放量', indicatorUnit: 'tCO₂',
          formula: 'E_生物 = AD × EF_生物',
          appliedStandard: 'GB/T 32150', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '生物质燃料燃烧产生的生物源碳排放，单独计量不计入总量',
          params: [
            { symbol: 'AD', meaning: '生物质消耗量', unit: 't', source: '数据采集' },
            { symbol: 'EF_生物', meaning: '生物质排放因子', unit: 'tCO₂/t', source: '排放因子库' }
          ]
        },

        // === 设施级 ===
        {
          id: 'FL-007', calcObject: '锅炉设施', indicator: '热量产出', indicatorUnit: 'GJ',
          formula: 'Q = AD × NCV',
          appliedStandard: 'GB/T 32150', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '锅炉燃料燃烧产生的有效热量',
          params: [
            { symbol: 'AD', meaning: '燃料消耗量', unit: 't', source: '数据采集' },
            { symbol: 'NCV', meaning: '低位热值', unit: 'GJ/t', source: '排放因子库' }
          ]
        },
        {
          id: 'FL-008', calcObject: '锅炉设施', indicator: '设施效率', indicatorUnit: '%',
          formula: 'η = Q_产出 / Q_输入',
          appliedStandard: 'GB/T 32150', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '锅炉热效率，用于效率折算和能效评估',
          params: [
            { symbol: 'Q_产出', meaning: '有效热量产出', unit: 'GJ', source: '本对象指标' },
            { symbol: 'Q_输入', meaning: '燃料输入热量', unit: 'GJ', source: '本对象指标' }
          ]
        },
        {
          id: 'FL-009', calcObject: '锅炉设施', indicator: '数据调和系数', indicatorUnit: '—',
          formula: 'k = AD_总表 / ΣAD_子表',
          appliedStandard: '通用', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '子表读数之和与总表不一致时，按比例计算调和系数用于校正',
          params: [
            { symbol: 'AD_总表', meaning: '总表读数', unit: '各异的', source: '数据采集' },
            { symbol: 'ΣAD_子表', meaning: '子表读数之和', unit: '各异的', source: '下级汇总' }
          ]
        },

        // === 排放单元级 ===
        {
          id: 'FL-010', calcObject: '排放单元', indicator: '单元排放量', indicatorUnit: 'tCO₂e',
          formula: 'E_单元 = Σ E_源i',
          appliedStandard: 'GB/T 32150', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '汇总排放单元内所有排放源的排放量',
          params: [
            { symbol: 'E_源i', meaning: '第i个排放源排放量', unit: 'tCO₂e', source: '下级汇总' }
          ]
        },
        {
          id: 'FL-011', calcObject: '排放单元', indicator: '分配系数（质量法）', indicatorUnit: '—',
          formula: 'f_i = m_i / Σm_j',
          appliedStandard: 'GB/T 32150', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '按产出质量比例分配共用设施碳排放',
          params: [
            { symbol: 'm_i', meaning: '产品i的质量', unit: 't', source: '数据采集' },
            { symbol: 'Σm_j', meaning: '总产出质量', unit: 't', source: '下级汇总' }
          ]
        },
        {
          id: 'FL-012', calcObject: '排放单元', indicator: '分配系数（经济法）', indicatorUnit: '—',
          formula: 'f_i = V_i / ΣV_j',
          appliedStandard: 'GB/T 32150', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '按产出经济价值比例分配共用设施碳排放',
          params: [
            { symbol: 'V_i', meaning: '产品i的产值', unit: '元', source: '数据采集' },
            { symbol: 'ΣV_j', meaning: '总产值', unit: '元', source: '下级汇总' }
          ]
        },
        {
          id: 'FL-013', calcObject: '排放单元', indicator: '分配系数（能耗法）', indicatorUnit: '—',
          formula: 'f_i = E_i / ΣE_j',
          appliedStandard: '通用', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '按能耗比例分配共用设施碳排放',
          params: [
            { symbol: 'E_i', meaning: '产品i的能耗', unit: 'GJ', source: '数据采集' },
            { symbol: 'ΣE_j', meaning: '总能耗', unit: 'GJ', source: '下级汇总' }
          ]
        },
        {
          id: 'FL-014', calcObject: '排放单元', indicator: '单元碳强度', indicatorUnit: 'tCO₂e/t',
          formula: 'I = E_单元 / Q_单元',
          appliedStandard: '通用', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '排放单元单位产出的碳排放强度',
          params: [
            { symbol: 'E_单元', meaning: '单元排放量', unit: 'tCO₂e', source: '本对象指标' },
            { symbol: 'Q_单元', meaning: '单元产出量', unit: 't', source: '数据采集' }
          ]
        },

        // === 汇总级 ===
        {
          id: 'FL-015', calcObject: '范围汇总', indicator: '范围一排放量', indicatorUnit: 'tCO₂e',
          formula: 'E_范围一 = Σ E_直接i',
          appliedStandard: 'GB/T 32150', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '汇总所有直接排放源（燃料燃烧、过程排放、逃逸排放）',
          params: [
            { symbol: 'E_直接i', meaning: '第i个直接排放源排放量', unit: 'tCO₂e', source: '下级汇总' }
          ]
        },
        {
          id: 'FL-016', calcObject: '范围汇总', indicator: '范围二排放量', indicatorUnit: 'tCO₂e',
          formula: 'E_范围二 = Σ E_间接i',
          appliedStandard: 'GB/T 32150', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '汇总所有外购电力、热力、蒸汽的间接排放',
          params: [
            { symbol: 'E_间接i', meaning: '第i个间接排放源排放量', unit: 'tCO₂e', source: '下级汇总' }
          ]
        },
        {
          id: 'FL-017', calcObject: '范围汇总', indicator: '范围三排放量', indicatorUnit: 'tCO₂e',
          formula: 'E_范围三 = Σ E_价值链i',
          appliedStandard: 'GHG Protocol', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '汇总价值链上下游间接排放（差旅、通勤、采购、废弃物等）',
          params: [
            { symbol: 'E_价值链i', meaning: '第i类价值链排放量', unit: 'tCO₂e', source: '下级汇总' }
          ]
        },
        {
          id: 'FL-018', calcObject: '范围汇总', indicator: '总排放量', indicatorUnit: 'tCO₂e',
          formula: 'E_总 = E_范围一 + E_范围二 + E_范围三',
          appliedStandard: 'GHG Protocol', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '三个范围排放量加总，得到组织温室气体排放总量',
          params: [
            { symbol: 'E_范围一', meaning: '范围一排放量', unit: 'tCO₂e', source: '本对象指标' },
            { symbol: 'E_范围二', meaning: '范围二排放量', unit: 'tCO₂e', source: '本对象指标' },
            { symbol: 'E_范围三', meaning: '范围三排放量', unit: 'tCO₂e', source: '本对象指标' }
          ]
        },
        {
          id: 'FL-019', calcObject: '范围汇总', indicator: 'GWP转换排放量', indicatorUnit: 'tCO₂e',
          formula: 'E_CO2e = Σ (E_i × GWP_i)',
          appliedStandard: 'IPCC', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '将多种温室气体排放量按GWP系数转换为CO₂当量',
          params: [
            { symbol: 'E_i', meaning: '第i种温室气体排放量', unit: 't', source: '下级汇总' },
            { symbol: 'GWP_i', meaning: '第i种气体GWP系数', unit: 'tCO₂e/t', source: '排放因子库' }
          ]
        },

        // === 整体级 ===
        {
          id: 'FL-020', calcObject: '组织整体', indicator: '碳强度（单位GDP）', indicatorUnit: 'tCO₂e/万元',
          formula: 'I = E_总 / GDP',
          appliedStandard: 'GB/T 32150', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '组织单位GDP碳排放强度',
          params: [
            { symbol: 'E_总', meaning: '组织排放总量', unit: 'tCO₂e', source: '下级汇总' },
            { symbol: 'GDP', meaning: '组织生产总值', unit: '万元', source: '统计数据' }
          ]
        },
        {
          id: 'FL-021', calcObject: '组织整体', indicator: '碳强度（单位产量）', indicatorUnit: 'tCO₂e/t',
          formula: 'I = E_总 / Q',
          appliedStandard: '通用', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '组织单位产量碳排放强度',
          params: [
            { symbol: 'E_总', meaning: '组织排放总量', unit: 'tCO₂e', source: '下级汇总' },
            { symbol: 'Q', meaning: '总产量', unit: 't', source: '统计数据' }
          ]
        },
        {
          id: 'FL-022', calcObject: '组织整体', indicator: '人均碳排放', indicatorUnit: 'tCO₂e/人',
          formula: 'I = E_总 / N',
          appliedStandard: '通用', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '组织人均碳排放量',
          params: [
            { symbol: 'E_总', meaning: '组织排放总量', unit: 'tCO₂e', source: '下级汇总' },
            { symbol: 'N', meaning: '员工总数', unit: '人', source: '统计数据' }
          ]
        },
        {
          id: 'FL-023', calcObject: '组织整体', indicator: '地均碳排放', indicatorUnit: 'tCO₂e/m²',
          formula: 'I = E_总 / A',
          appliedStandard: '通用', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '组织单位面积碳排放量',
          params: [
            { symbol: 'E_总', meaning: '组织排放总量', unit: 'tCO₂e', source: '下级汇总' },
            { symbol: 'A', meaning: '占地面积', unit: 'm²', source: '统计数据' }
          ]
        },

        // === 园区整体级 ===
        {
          id: 'FL-024', calcObject: '园区整体', indicator: '园区排放总量', indicatorUnit: 'tCO₂e',
          formula: 'E_园区 = Σ E_企业i',
          appliedStandard: '零碳园区指标体系', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '汇总园区内所有企业的排放量',
          params: [
            { symbol: 'E_企业i', meaning: '第i个企业排放量', unit: 'tCO₂e', source: '下级汇总' }
          ]
        },
        {
          id: 'FL-025', calcObject: '园区整体', indicator: '零碳路径缺口', indicatorUnit: 'tCO₂e',
          formula: 'Gap = E_目标 - E_实际',
          appliedStandard: '零碳园区指标体系', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '园区实际排放与零碳目标的差距，正值表示需进一步减排',
          params: [
            { symbol: 'E_目标', meaning: '目标排放量', unit: 'tCO₂e', source: '目标设定' },
            { symbol: 'E_实际', meaning: '实际排放量', unit: 'tCO₂e', source: '下级汇总' }
          ]
        },

        // === 碳市场/配额 ===
        {
          id: 'FL-026', calcObject: '配额履约', indicator: '配额盈亏', indicatorUnit: '元',
          formula: 'P = (E_配额 - E_实际) × Price',
          appliedStandard: '北京核算指南', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '配额履约盈亏计算，正值表示盈余可出售，负值表示需购入',
          params: [
            { symbol: 'E_配额', meaning: '分配配额量', unit: 'tCO₂', source: '配额分配' },
            { symbol: 'E_实际', meaning: '实际排放量', unit: 'tCO₂', source: '下级汇总' },
            { symbol: 'Price', meaning: '碳价', unit: '元/tCO₂', source: '碳市场行情' }
          ]
        },
        {
          id: 'FL-027', calcObject: '配额履约', indicator: 'CCER抵消后净排放量', indicatorUnit: 'tCO₂',
          formula: 'E_净 = E_实际 - E_CCER × r',
          appliedStandard: '北京核算指南', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '扣除CCER抵消量后的净排放量，r为允许抵消比例',
          params: [
            { symbol: 'E_实际', meaning: '实际排放量', unit: 'tCO₂', source: '下级汇总' },
            { symbol: 'E_CCER', meaning: 'CCER抵消量', unit: 'tCO₂', source: '配额分配' },
            { symbol: 'r', meaning: '允许抵消比例', unit: '%', source: '标准默认值' }
          ]
        },
        {
          id: 'FL-028', calcObject: '配额履约', indicator: '基准线法配额量', indicatorUnit: 'tCO₂',
          formula: 'E_配额 = Q × B × k',
          appliedStandard: '北京核算指南', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '基准线法配额分配，Q为产出量，B为基准值，k为调节系数',
          params: [
            { symbol: 'Q', meaning: '产出量', unit: 't或MWh', source: '数据采集' },
            { symbol: 'B', meaning: '基准值', unit: 'tCO₂/单位产出', source: '标准默认值' },
            { symbol: 'k', meaning: '调节系数', unit: '—', source: '配额分配' }
          ]
        },

        // === 通用分析 ===
        {
          id: 'FL-029', calcObject: '通用分析', indicator: '不确定性分布', indicatorUnit: '%',
          formula: 'U = MonteCarlo(AD, EF, n)',
          appliedStandard: 'ISO 14064', version: 'v1.0', status: '启用', updateTime: '2026-06-01',
          description: '蒙特卡洛模拟计算碳排放结果的不确定性分布和置信区间',
          params: [
            { symbol: 'AD', meaning: '活动数据概率分布', unit: '—', source: '数据采集' },
            { symbol: 'EF', meaning: '排放因子概率分布', unit: '—', source: '排放因子库' },
            { symbol: 'n', meaning: '模拟次数', unit: '次', source: '标准默认值' }
          ]
        },
        // === 能源折标类（GB/T 2589 综合能耗计算通则 · 当量值口径）===
        {
          id: 'FL-030', calcObject: '能源品种', indicator: '折标量（当量值）', indicatorUnit: 'tce',
          formula: 'Ece = Q × Cce',
          appliedStandard: 'GB/T 2589', version: 'v1.0', status: '启用', updateTime: '2026-08-01',
          description: '将各能源品种实物量按当量值折标系数折算为标准煤，是综合能耗计算的基础',
          params: [
            { symbol: 'Q', meaning: '能源实物量', unit: 't / 万m³ / 万kWh', source: '数据采集' },
            { symbol: 'Cce', meaning: '当量值折标系数', unit: 'tce/实物单位', source: '排放因子库' }
          ]
        },
        {
          id: 'FL-031', calcObject: '用能单位', indicator: '综合能源消费量', indicatorUnit: 'tce',
          formula: 'E_综合 = Σ Ece_i',
          appliedStandard: 'GB/T 2589', version: 'v1.0', status: '启用', updateTime: '2026-08-01',
          description: '汇总各能源品种折标量得到综合能源消费量，须与分品种折标加总一致',
          params: [
            { symbol: 'Ece_i', meaning: '第 i 个能源品种折标量', unit: 'tce', source: '下级汇总' }
          ]
        },
        {
          id: 'FL-032', calcObject: '用能单位', indicator: '单位产值综合能耗', indicatorUnit: 'tce/万元',
          formula: 'e = E_综合 / V',
          appliedStandard: 'GB/T 2589', version: 'v1.0', status: '启用', updateTime: '2026-08-01',
          description: '单位产值综合能耗，用于产值能耗指标与同比下降率计算',
          params: [
            { symbol: 'E_综合', meaning: '综合能源消费量', unit: 'tce', source: '本对象指标' },
            { symbol: 'V', meaning: '工业总产值', unit: '万元', source: '数据采集' }
          ]
        },
        {
          id: 'FL-033', calcObject: '能源品种', indicator: '能源消费结构占比', indicatorUnit: '%',
          formula: 'r_i = Ece_i / E_综合 × 100%',
          appliedStandard: 'GB/T 2589', version: 'v1.0', status: '启用', updateTime: '2026-08-01',
          description: '各能源品种占综合能耗的比重，用于能源消费结构表填报',
          params: [
            { symbol: 'Ece_i', meaning: '第 i 个能源品种折标量', unit: 'tce', source: '下级汇总' },
            { symbol: 'E_综合', meaning: '综合能源消费量', unit: 'tce', source: '本对象指标' }
          ]
        },
        {
          id: 'FL-034', calcObject: '用能单位', indicator: '同比变化率', indicatorUnit: '%',
          formula: 'Δ = (本期值 - 上年值) / 上年值 × 100%',
          appliedStandard: 'GB/T 2589', version: 'v1.0', status: '启用', updateTime: '2026-08-01',
          description: '同比变化率，用于硬规则校验的同比波动阈值判定',
          params: [
            { symbol: '本期值', meaning: '本期统计值', unit: '随指标', source: '本对象指标' },
            { symbol: '上年值', meaning: '上年同期值', unit: '随指标', source: '数据采集' }
          ]
        },
        // === 能源审计类（GB/T 17166 企业能源审计技术通则）===
        {
          id: 'FL-035', calcObject: '用能单位', indicator: '企业能源消费量合计', indicatorUnit: 'tce',
          formula: 'E_总 = E_购入储存 + E_加工转换 + E_输送分配 + E_终端利用',
          appliedStandard: 'GB/T 17166', version: 'v1.0', status: '启用', updateTime: '2026-09-01',
          description: '按能源流四环节归集企业能源消费量，编制能源平衡表的基础（差额不超过 ±1%）',
          params: [
            { symbol: 'E_购入储存', meaning: '购入储存环节能耗', unit: 'tce', source: '数据采集' },
            { symbol: 'E_加工转换', meaning: '加工转换环节能耗', unit: 'tce', source: '数据采集' },
            { symbol: 'E_输送分配', meaning: '输送分配环节损耗', unit: 'tce', source: '数据采集' },
            { symbol: 'E_终端利用', meaning: '终端利用环节能耗', unit: 'tce', source: '数据采集' }
          ]
        },
        {
          id: 'FL-036', calcObject: '用能单位', indicator: '节能量', indicatorUnit: 'tce',
          formula: 'ΔE = (E_基期 / Q_基期 - E_审计期 / Q_审计期) × Q_审计期',
          appliedStandard: 'GB/T 17166', version: 'v1.0', status: '启用', updateTime: '2026-09-01',
          description: '按产品产量修正后的节能量，用于能源审计报告与政策奖补申报',
          params: [
            { symbol: 'E_基期', meaning: '基期能源消费量', unit: 'tce', source: '历史数据' },
            { symbol: 'Q_基期', meaning: '基期产品产量', unit: '随产品', source: '生产统计' },
            { symbol: 'E_审计期', meaning: '审计期能源消费量', unit: 'tce', source: '本对象指标' },
            { symbol: 'Q_审计期', meaning: '审计期产品产量', unit: '随产品', source: '生产统计' }
          ]
        },
        {
          id: 'FL-037', calcObject: '能源品种', indicator: '能源平衡差额', indicatorUnit: '%',
          formula: 'δ = (E_购入 - E_消费 ± E_库存变化) / E_购入 × 100%',
          appliedStandard: 'GB/T 17166', version: 'v1.0', status: '启用', updateTime: '2026-09-01',
          description: '能源平衡表校验：购入量与消费量及库存变化的差额占比，用于数据逻辑校验',
          params: [
            { symbol: 'E_购入', meaning: '购入能源量', unit: 'tce', source: '数据采集' },
            { symbol: 'E_消费', meaning: '消费能源量', unit: 'tce', source: '下级汇总' },
            { symbol: 'E_库存变化', meaning: '期初期末库存差', unit: 'tce', source: '数据采集' }
          ]
        }
      ]
