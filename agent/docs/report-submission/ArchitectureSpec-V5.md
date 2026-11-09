# 智慧报告智能体五阶段顶层架构与数据流全景规范（终版）

> 模块系统：enterprise-report-agent / report-submission
> 体系定位：企业级能碳/工业数字化智慧报告智能体核心领域模型、流转契约与运行时规格总纲
> 文档版本：V5.2-RELEASE（2026-09-23 评审修订：V5.1 EXEMPT 豁免态 / 规则归属标准库 / 两级三处校验分层 / 原型降级约定；V5.2 阶段五审批模式解耦——DIRECT_SIGN 基线 + MULTI_LEVEL_APPROVAL 插件，见 §5.2 与 §0 对照表）
> 归档说明：本篇为**目标态总纲规格**（细化设计/开发阶段的目标契约）；原型当前实现状态见「实现状态对照」，两者差距即细化设计的工作清单；原型的分步吸收路线见附录 A。

## 0. 实现状态对照（2026-09-23 评审）

| 规格条目 | 原型实现度 | 现状说明 |
|---|---|---|
| 确定性边界原则（1.1） | ✅ 已实现 | 换算由规则引擎执行、AI 不参与算数；裁决点（多口径确认/异常处置/豁免说明）归还用户 |
| 五阶段生命周期与领域对象（1.2） | ✅ 模型一致 | 编排界面阶段条为四段（Stage 0 在工作台完成），生命周期叙事五段（见 StagesAndSupport.md §0） |
| Scope 锁定协议·铁律 1/2（三） | ✅ 已实现 | templateLock 创建即生成（含场景路由）；阶段三不反向增删指标；免填/豁免经企业档案判定退回 Scope |
| 双重校验体系（5.1） | ◐ 部分实现 | 机器侧 9 类规则已实现；**校验总览按 V5.1 修订为客观计数（通过 / 总数 + 待处置），替代原加权评分 ≥60 口径**（避免伪精确与双闸门口径）；校验分层按 V5.1 §二 Gate 修订执行（两级三处） |
| 三级签发 + 指纹 + 水印 + 回执回写（5.2） | ✅ 已实现（V5.2 审批模式解耦） | DIRECT_SIGN 单人闭环基线（默认，操作人元数据留痕）+ MULTI_LEVEL 三级协同演示插件；signService（前端模拟，生产化转服务端）+ exportService 水印 + 碳报告中心登记；approvalChain 数据模型向后兼容 |
| 二维正交状态机（4.1，含 V5.1 EXEMPT 态） | ◐ 简化版已实现（附录 A-1/A-2） | 阶段二已落 resolutionStatus（AUTO_RESOLVED/PENDING_FILL/EXEMPT）× qualityStatus（PASS/WARNING/BLOCKED，由 ±20%/±50% 异动与非正值守恒驱动）；问题工作台三视图（待办问题/已豁免/全量一览）；PENDING_CONFIRM 待多源接入启用 |
| MetricDataVersion 五维血缘（4.2） | ⬜ 待开发（先行四维） | 现状修订留痕有 operator/time/原因（报告级）+ 填报值已持久化（collectedSnapshot）；字段级版本链、规则摘要哈希、单元格坐标、agent 版本锚点为细化设计项 |
| ValidationRule 动态规则元模型（4.3，V5.1 归属修订） | ◐ 部分实现 | 规则已配置化（CHECK_RULES + 标准库参数化结构）；规则套件归属**政策标准库**（见 4.3 归属修订），表达式引擎/容差/豁免条件未实现 |
| AgentActionLog 快照解耦（4.4） | ⬜ 待开发 | 现状日志为轻量文本留痕；哈希/快照引用为生产化架构项 |
| SOURCE_CONFLICT 多源裁决 | ⬜ 待开发 | 多口径适配目前在阶段三（置信度分级）；字段级多源冲突裁决（PENDING_CONFIRM）待多源数据接入（附录 A-2 待开发） |
| TIER 来源分级（4.2 sourceSnapshot，文本层） | ◐ 简化版已实现（附录 A-3） | 章节级来源徽标（TIER_1 官方档案 / TIER_2 系统采集 / TIER_3 人工填报）已落；docHash/cellCoordinate 留空位 |
| issues[] 问题模型（4.1，简化） | ◐ 简化版已实现（附录 A-4） | 字段级 issues（MISSING_DATA/ABNORMAL_VARIATION/PHYSICAL_VIOLATION，severity 三级 + suggestedFix）已落章节体展示；哈希与锚点留空位 |

## 一、 顶层架构哲学与核心理念

### 1.1 确定性边界原则（Determinism Boundary Principle）

在企业能碳核算、节能利用状况申报及法定合规监管等严肃工业场景下，系统坚守：

**"凡确定性任务优先自动化，凡存在业务裁决的任务默认交给用户（Automate the Deterministic, Delegate the Discretionary）。"**

- 严禁"AI 替企业背书做决定"：数据检索、单元格寻址、法定单位折标换算与物理守恒校验等确定性计算由系统与规则引擎 100% 自动化闭环；
- 决策权与法律责任归还用户：多源口径分歧裁定、高危合规人事/资质异动确认、特殊工况免责说明等关键 20% 节点必须由企业人员行使最终裁决权。

### 1.2 五大核心领域对象驱动模型（Domain-Driven Lifecycle）

系统摒弃简单的无状态过程流转，全面升级为以**五个不可变的核心领域对象（Core Domain Entities）**为交付骨架的业务流转链：

```
Task(任务实例对象) → Scope(范围基准对象) → Dataset(就绪数据对象) → Report(合规报告对象) → Filing Package(法定存证对象)
"我要做什么？"      "这次要报什么？"      "数据是否可信？"      "报告是否正确？"      "谁负责与留痕？"
```

每个领域对象均为下一阶段的强输入契约（Contract）与版本冻结快照。

### 1.3 智能体认知自主性梯度（Agent Autonomy Gradient）

```
阶段五：理解流程与责任 (Process & Governance)  ── 懂得内控闭环与法定存证
阶段四：理解报告与文风 (Report & Context)      ── 懂得严谨勾稽与合规表述
阶段三：理解数据与物理 (Data & Physics)        ── 懂得资产对齐与守恒法则
阶段二：理解法规与规则 (Rules & Compliance)    ── 懂得标准裁剪与豁免条件
阶段一：理解意图与目标 (Intent & Objective)    ── 懂得企业申报业务诉求
```

## 二、 五阶段业务边界、核心职责与硬准出闸门矩阵表

| 阶段 | 核心业务问题 | 核心领域对象 | Agent/系统核心职责 | 用户关键裁决与控制点 | 阶段出口硬准出条件（Gate） |
|---|---|---|---|---|---|
| 01 Task Setup 任务创建与意图实例化 | 我要做什么？ | Task（任务实例） | 自然语言意图解析；报送期次/类型与企业主体对齐；挂载基准模板与法规库本体；关联历史申报档案 | 确认任务主干信息："确认发起的是否是该任务" | 生成唯一 taskId，绑定法人主体代码与申报年度 |
| 02 Scope Resolution 适用性裁定与基准锁定 | 我要报什么？ | Scope（范围基准） | 场景子分支自动分流（工业 vs 非工业）；条件表格动态豁免裁定（附法规依据）；提取并实例化待填报指标清单骨架 | 核对适用范围与豁免理由："确认报表与指标清单是否完整无误" | 生成不可篡改的 templateLock，锁定报表范围与指标树 |
| 03 Data Hydration 数据补全与质量对齐 | 数据在哪里？缺什么？是否可信？ | Dataset（就绪数据集） | 多源资产穿透检索与单元格坐标映射；差异归因辅助（跨期/损耗/边界诊断）；动态规则校验（守恒/量级/异动）；记录五维可重现血缘与脱敏流水 | 介入 20% 关键裁决：多源口径冲突裁决；核心缺项补录；质量阻断项纠偏与工况豁免 | 三维硬闸门强校验（**第一级：单表内即时校验**，V5.1 分层修订）：PENDING_CONFIRM == 0；PENDING_FILL == 0；quality:BLOCKED == 0——校验范围为**单表内守恒/量级/波动**（跨表勾稽不在本级，彼时跨表数据未齐） |
| 04 Generation & Verification 受控生成与双重校验 | 如何形成一份正确的报告？ | Report（合规报告） | 规则引擎确定性换算（折标煤/碳排量）；跨表全量勾稽关系平衡校验；受控生成规范文本与异动原因说明 | 第二重人工业务审阅：核心生产与能耗指标复核；关键异动说明与合规文本定稿；人工确认通过质量校验报告 | 双重校验闭环（**第二级：跨表勾稽与格式规范**，V5.1 分层修订）：机器规则校验全部 PASS（含跨表全量勾稽 + 报送标准格式符合性）；人工业务确认签名完毕；校验客观计数无阻断项（原加权评分 ≥60 口径已废弃） |
| 05 Filing & Archive 三级签发与提报归档 | 谁负责交付与闭环？谁批准？谁负责？如何提交并留痕？ | Filing Package（法定存证包） | 驱动企业内审协同流（三级审核）；计算全文件 SHA-256 内容指纹；渲染导出多格式带水印交付件（PDF/Excel）；监管系统对接或提报回执编号回写 | 执行权责签署与归档交接：填报人/审核人/负责人电子签署；确认官方提报完成并回填回执 | 签发印章/指纹生成完毕；存证底卷与版本快照冻结；状态推进至"已提报/已归档" |

## 三、 阶段二（Scope）与阶段三（Dataset）的绝对锁定协议

这是杜绝数据流逻辑混乱的核心边界铁律：

```
阶段二：Scope Resolution（立法者：决定"需要什么"）
  输出 Contract: RequiredMetrics[]（只出清单，不管数值）
  · 锁定指标编码（M-001, M-002, M-003...）
  · 锁定物理量纲（tce, kWh, Nm³）
  · 锁定报表归属（表1 基础信息, 表2 消费结构...）
        │ 一旦锁定，禁止修改清单项（Lockdown）
        ▼
阶段三：Data Hydration（执行者：决定"有没有、能不能用"）
  消费 RequiredMetrics[]，只负责给坑填数与质检：
  · 来源唯一权威且合理   ──► AUTO_RESOLVED（自动入库）
  · 找到多份口径打架     ──► PENDING_CONFIRM（用户裁决）
  · 数据资产池完全找不到 ──► PENDING_FILL（用户补录）
  · 找到但违反物理守恒   ──► BLOCKED（阻断纠偏）
```

**铁律 1（职责单向依赖）**：阶段三绝对不允许反向增删阶段二定义的指标项。如果在找数过程中发现"某项实际不存在"，只能通过在阶段三录入"豁免/为 0"或退回阶段二修改企业属性重新解算 Scope，绝不允许直接在阶段三就地篡改报表结构。豁免结果以 **EXEMPT 就绪态**落账（V5.1 新增，见 4.1）——附判定依据，不计入补录闸门，不属于清单篡改。

**铁律 2（基准冻结）**：templateLock 形成后，阶段三至阶段五的全部换算、校验与审计均严格以此基准为准，彻底杜绝跨周期政策升版引发的指标漂移。

## 四、 阶段三深度规格：数据补全与质量对齐运行架构

### 4.1 二维正交状态机与问题管理（Dual-Axis State & Issues Engine）

彻底废除互斥的单一状态枚举，解耦为两维正交状态 + 问题集合（issues[]）：

**就绪维度（resolutionStatus）**：
- AUTO_RESOLVED：数据源唯一且权威，已按规则自动对齐完成；
- PENDING_CONFIRM：检索到多个候选来源（存在跨期、线损、统计边界分歧），需人工裁决；
- PENDING_FILL：现有企业数据资产库中未收录该指标，需人工补录或上传材料微解析；
- **EXEMPT（V5.1 新增）**：经 Scope 裁定合法豁免——场景免填（如非工业领域豁免工业专属表）、条件性表格档案判定不适用（如无 500 万 kWh 及以上数据中心）。**附判定依据（企业档案字段 + 法规条款），不计入补录闸门分母**；正交三态无法表达该合法裁定，故独立成态。

**质量维度（qualityStatus）**：
- PASS：通过适用的动态物理守恒、量级范围与波动率校验；
- WARNING：非致命预警（数值同比波动偏离基准超 ±20%、临界值预警，允许放行但在正文生成时提示附说明）；
- BLOCKED：阻断级异常（违反适用行业的物理守恒边界、负数能耗、严重离群），必须就地纠偏或提供豁免备忘。

### 4.2 结构化数据实体模型（TypeScript）

```ts
// 1. 结构化问题项模型（Metric Issue）
interface MetricIssue {
  issueId: string;                 // 唯一问题编码（如 "ISS-20260923-001"）
  type:
    | 'SOURCE_CONFLICT'            // 多源口径冲突（跨期、边界、线损）
    | 'PHYSICAL_VIOLATION'         // 物理守恒与业务规则违背
    | 'ABNORMAL_VARIATION'         // 同比异动超标（如 |波动| > 20%）
    | 'LEGAL_COMPLIANCE_RISK'      // 法定合规异动风险（人事变更、证书超期）
    | 'MISSING_DATA';              // 数据项缺失
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
  description: string;

  // 法定合规依据（杜绝黑盒研判）
  complianceRule?: {
    ruleId: string;                // 规则唯一编码（如 "R-LAW-GB28-001"）
    ruleVersion: string;           // 规则/标准版本（如 "2026.1"）
    ruleSource: string;            // 法规文件/国家标准全称
    effectiveDate: string;         // 生效时间
    statutoryContent: string;      // 法规明文摘要
  };

  // 差异诊断上下文
  diagnosticContext?: {
    suspectedCause?: string;       // 归因诊断
    suggestedFix?: string;         // 处置建议
    evidenceRef?: string;          // 证据链指针
  };
}

// 2. 数据版本不可篡改记录（DataVersion，具备五维可重现性）
interface MetricDataVersion {
  versionId: string;               // 版本唯一标识（如 "v1_20260923_001"）
  versionNumber: number;           // 递增版本号
  previousValue: number | string | null;
  newValue: number | string;
  unit: string;

  operatorType: 'AGENT_AUTO' | 'USER_MANUAL' | 'REVIEWER_OVERRIDE';
  operatorId: string;
  operatorName: string;
  operationTime: string;           // ISO 8601 毫秒级时间戳
  operationReasonType: string;
  operationReason: string;         // 修改原因（人工变更时必填）
  evidenceDocId?: string;

  // 五维可重现性环境锚点（Reproducibility Anchors）
  runtimeEnv: {
    agentRunId: string;            // 执行批次 ID
    agentVersion: string;          // 智能体流水线发布版本
    executionLogAnchorId?: string; // 关联的首条 Action Log ID
  };
  ruleEnv: {
    ruleSetId: string;             // 规则套件编码
    ruleVersion: string;           // 规则版本号
    ruleId: string;                // 命中规则项
    ruleDigest: string;            // 规则配置内容的 SHA-256 签名
  };
  sourceSnapshot: {
    sourceSnapshotId: string;      // 物理快照存储指针
    sourceTier: 'TIER_1_OFFICIAL' | 'TIER_2_SYSTEM' | 'TIER_3_MANUAL';
    sourceDocName: string;         // 资产文件名称
    sourceDocHash: string;         // 原始材料 SHA-256 物理哈希值
    cellCoordinate?: string;       // 单元格绝对定位（如 "Sheet1!L18"）
  };
}

// 3. 指标主实体（Hydrated Metric Item）
interface HydratedMetricItem {
  metricId: string;                // 指标编码（如 "M_ENERGY_INPUT_TOTAL"）
  metricName: string;              // 指标名称
  sectionId: string;               // 归属报表章节

  // 两维正交状态（V5.1：就绪维度增加 EXEMPT 豁免态，附判定依据）
  resolutionStatus: 'AUTO_RESOLVED' | 'PENDING_CONFIRM' | 'PENDING_FILL' | 'EXEMPT';
  exemptBasis?: {                  // EXEMPT 态必填：豁免判定依据
    basisType: 'SCENARIO_EXEMPT' | 'CONDITIONAL_NOT_APPLICABLE';
    profileFieldRef?: string;      // 企业档案判定字段引用
    legalClause?: string;          // 法规/编制要求条款
  };
  qualityStatus: 'PASS' | 'WARNING' | 'BLOCKED';

  issues: MetricIssue[];           // 关联问题集合
  activeVersionId: string;         // 当前激活生效的版本
  currentValue: number | string | null;
  unit: string;
  versionHistory: MetricDataVersion[]; // 完整版本血缘链（Append-only）
}
```

### 4.3 动态规则引擎元模型（去硬编码）

严禁在系统代码中硬编码"产出 <= 投入"等物理规则。核算规则作为独立配置资产加载。

> **归属修订（V5.1）**：ValidationRule 的规则套件**归属政策标准库**（policyStandardService 的 REPORT 规则集），不另立独立 RULESET 体系——`ruleSetId/ruleVersion` 对齐标准库规则集的版本机制，`ruleDigest` 取标准库规则集内容的 SHA-256。理由：架构原则"引用与本体分离、规则本体在标准库"，避免规则双头维护破坏铁律 2 的单一基准；templateLock 锁定时的 `ruleEnv` 即对锁定规则集版本的引用。

```ts
interface ValidationRule {
  ruleId: string;                  // 规则编码（如 "RULE-ENERGY-2026-001"）
  ruleName: string;                // 规则名称（如 "加工转换平衡约束规则"）
  ruleSetId: string;               // 所属规则集 = 政策标准库规则集编码（V5.1：归属标准库）
  ruleVersion: string;             // 版本号 = 标准库规则集版本
  effectiveDate: { startDate: string; endDate?: string };
  applicableIndustry: string[];    // 适用行业国标码（如 ["C31", "C25"]）
  applicableReport: string[];      // 适用报表
  boundaryScope: 'ENTERPRISE_TOTAL' | 'PROCESS_UNIT' | 'EQUIPMENT_LEVEL';
  constraintType: 'PHYSICAL_CONSERVATION' | 'LOGICAL_CONSISTENCY' | 'RANGE_LIMIT' | 'VARIATION_RATIO';
  severity: 'BLOCKING' | 'WARNING';
  evaluationLogic: {
    expression: string;            // 动态表达式（解析折标系数、多产品平衡）
    toleranceRatio: number;        // 允许的折标或损耗容差率（如 0.03）
    exemptConditions?: string[];   // 豁免场景（如 ["副产品循环利用", "跨月库存结算"]）
  };
  diagnosticTemplate: {
    failureReason: string;         // 归因说明模版
    guidance: string;              // 纠偏引导文案
  };
}
```

### 4.4 动作日志（Agent Action Log）轻量化与快照存证解耦

严禁在日志中内联存储庞大且敏感的 payload，采用引用指针与哈希存证解耦：

```ts
interface AgentActionLog {
  logId: string;
  taskId: string;
  phase: 'PHASE_3_HYDRATION';
  timestamp: string;               // 毫秒级时间戳（ISO 8601）
  actionType: 'SOURCE_MOUNT' | 'SCHEMA_PARSE' | 'RULE_EVAL' | 'CONFLICT_DETECT' | 'QUALITY_VERIFY' | 'GATE_EVAL';
  targetEntity?: { metricId?: string; metricName?: string; sourceRef?: string };
  detail: { message: string; costMs: number; status: 'SUCCESS' | 'WARN' | 'FAILED' };
  payloadTrace: {
    inputRef?: { snapshotId: string; targetLocation?: string; payloadHash: string; byteSize: number };
    outputRef?: { snapshotId: string; payloadHash: string; byteSize: number };
  };
  decisionReason?: string;
}
```

## 五、 阶段四与阶段五规格：生成校验与存证提报闭环

### 5.1 阶段四：双重校验体系（Dual Verification Gate）

将校验拆解为"第一重机器校验（确定性硬防线）"与"第二重人工业务校验（决策与责任确认）"：

**第一重：机器硬核验（100% 规则引擎执行）**
- 字段完整性（Nullability Check）：法定必填字段无缺项；
- 数值合法性（Range Check）：无荒谬量级、负能耗或倒挂；
- 单位归一性（Unit Check）：折标煤系数、千瓦时与吨标准煤换算准确；
- 跨表全量勾稽自洽（Cross-table Cross-check）：表 1 总能耗与表 2 平衡表综合能耗完全一致；
- 格式与规范符合性（Format Spec）：完全对齐发改部门最新报送标准；
- 校验客观计数：必须项（阻断项）全部通过方可流转，否则阻断（原加权评分 ≥60 口径已废弃，避免伪精确与双闸门口径）。

**第二重：人工业务校验（人类审阅签字）**
- 核心生产与能耗指标复核：折标总能耗与万元产值单耗符合企业实际经营情况；
- 敏感合规文本审阅：确认 Agent 受控起草的节能措施与技改分析段落准确；
- 异动原因核准：对波动超 ±20% 的指标原因说明做最终责任定稿。

### 5.2 阶段五：三级签发与政企隔离提报闭环（V5.2 审批模式解耦）

> **架构解耦策略（V5.2）**：业务流（Submission Flow）与权限流（Approval Flow）分离——"单人闭环为基线，多级协同为插件"。底层 RBAC/ABAC 权限中枢、组织架构同步与电子签章密钥体系就绪前，不将三级流转强编码进业务层，避免"上层业务流空转、联调依赖死锁"。

- **审批模式开关（approvalMode）**：
  - `DIRECT_SIGN`（V1.0 基线）：依赖基础系统账号登录态；具备报送权限的用户一键"报告确认与签发归档"；仅记录操作人签名元数据（operatorId/operatorName）；审批链 `approvalChain` 仅含 1 个节点直接完结；
  - `MULTI_LEVEL_APPROVAL`（V2.0 规划）：外挂企业级工作流引擎（BPMN/OA）与组织架构鉴权体系（RBAC 岗位-部门权限矩阵）后激活逐级审批看板与移动端催审——**数据模型无需重构**（approvalChain 自动展开 3 节点）。
- **数据模型（向后兼容）**：
  - `ApprovalNode`：{ nodeLevel, roleKey: 'SUBMITTER'|'REVIEWER'|'LEGAL_REPRESENTATIVE', status: 'PENDING'|'APPROVED'|'REJECTED'|'SKIPPED', operatorId?, operatorName?, signTimestamp?, signatureDigest?, comments? }；
  - `FilingPackageEntity`：{ packageId, reportId, archiveStatus: 'DRAFT'|'SEALED'|'ARCHIVED', approvalMode, approvalChain: ApprovalNode[], submissionRecord: { status: 'NOT_SUBMITTED'|'SUBMITTED'|'ACCEPTED', submittedAt?, officialReceiptNo? }, fileFingerprint }。
- **内控审批流（MULTI_LEVEL 模式 Approval Chain）**：数据填报人提交 → 节能主管部门复核 → 主管能碳负责人签章（数字签名）；
- **防篡改存证包（Filing Package）**：计算全文档 SHA-256 内容指纹，确保签发后不可被非法修改；渲染导出带防伪数字水印的多格式归档文件（PDF、Excel 数据底表）——**两种审批模式下均不变**（审计底线：内容指纹、操作人留痕、提报回执闭环）；
- **提报与官方回执闭环**：状态解耦——内控签发归档后，任务进入"已归档·待提报"状态；在官方节能/碳排专网完成上传后，登记提报时间并回写官方回执编号（Official Receipt No.），任务正式推进至终态"已提报/已受理"。

## 六、 原型降级实现约定（V5.1 新增）

本规范为**目标态契约**；演示原型以 Vue 2 + localStorage/mock 承载，生产级审计字段（哈希、快照指针、执行锚点）无法亦不应在原型中硬造。约定如下：

1. **字段级血缘先行四维**：`operatorType / operatorName / operationTime / operationReason` 原型期落全；`runtimeEnv / ruleEnv / sourceSnapshot` 仅保留**空位字段**（null），细化设计接入真实运行时后填充；
2. **来源分级先落文本层**：`sourceTier` 原型期以来源标签文本表达（官方文件 / 系统采集 / 人工填报），`sourceDocHash / cellCoordinate` 留空位；
3. **规则摘要留位**：校验结果展示 ruleId/ruleVersion，`ruleDigest` 留空位（待标准库规则集内容哈希机制落地）；
4. **严禁在原型硬造审计凭证**：哈希值、快照 ID、执行锚点不得以随机串伪装——未接入真实机制的维度一律显式置空，避免"造假产出物"（对应文档先行的演示边界原则）；
5. **接口形状即契约**：原型数据结构的字段命名与嵌套与本文 TypeScript 定义保持一致，细化设计时字段级平移，不做二次建模。

## 附录 A · 原型吸收路线（近期四项，V5.1 登记）

> 目标：在不硬造审计凭证的前提下，让阶段二消番工作台先行对齐本规范的核心模型。载体：`ReportSubmissionCenter.vue` 阶段二 + `Orchestration.md` 同步登记。

| # | 吸收项 | 规格条目 | 原型实现口径 | 依赖 |
|---|---|---|---|---|
| A-1 | 二维正交状态机简化版 | §4.1 | 采集项 status 拆为 `resolutionStatus`（AUTO_RESOLVED / PENDING_FILL / EXEMPT；PENDING_CONFIRM 随多源裁决后启用）× `qualityStatus`（PASS / WARNING / BLOCKED，由 ±20%/±50% 即时校验与单表守恒规则驱动）；UI：缺项消番 Tab 演进为"问题工作台"（按状态分组：待裁决 / 待补录 / 已豁免） | 现有 chapterItems / 缺项聚合视图 |
| A-2 | EXEMPT 豁免态 | §4.1 | 免填/条件判定（现"不适用"）迁移为 EXEMPT + `exemptBasis`（档案字段引用 + 附件2 条款），豁免项不入闸门分母，可展开查看判定依据 | 现有 collectNa / rwb-na-note |
| A-3 | TIER 来源分级（文本层） | §4.2 sourceSnapshot | 字段级来源标注结构化为 `sourceTier`（官方文件 / 系统采集 / 人工填报）+ `sourceDocName`；采集清单"数据来源"与"已导入"标签升级为分级徽标 | 现有 fields[].ready / imported 标签 |
| A-4 | issues[] 简化问题模型 | §4.1 MetricIssue | 阶段二问题卡片收敛为 `issues[]`（type/severity/description/suggestedFix 四字段，哈希与锚点留空位）；±50%/±20% 预警与单表守恒校验产出统一入 issues，替代散落的提示条 | 现有 devWarn / 校验提示 |

**验收口径**：四项完成后，阶段二数据结构满足 `HydratedMetricItem` 的降级子集（无哈希/锚点维度），细化设计时字段级平移；UI 语义与规范一致（问题工作台：待裁决 / 待补录 / 已豁免三分区）。
