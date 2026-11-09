# 全局数据字典

> mock 字段与未来 API 的映射登记处；**页面文档只引用不重复定义**。
> 登记口径：① 每个 mock 数据键在此登记一次（字段名 / 类型 / 说明 / mock 来源 / 未来接口）；② localStorage 命名空间统一在第一节登记；③ 新增键必须先在此登记再落代码（文档先行）。

## 一、localStorage 命名空间总表

> 命名约定：`<模块前缀>_<对象>`；前缀 cfp=产品碳足迹、pef=产品环境足迹、ghg=组织碳核算、park=园区碳核算、bjc=北京碳市场、zcf=零碳工厂、rs=智慧报告工作台、org=组织资源（跨模块共享的私域台账）。

| 键 | 归属模块 | 内容 | 生命周期 | 未来接口 |
|---|---|---|---|---|
| rs_reports_v1 / rs_calendar_v1 | report-submission | 工作台主数据（报送任务 / 报送日历），seed 变更时旧缓存失效回退 mock | 业务数据（长期） | GET/POST /report/tasks、/report/calendar |
| carbon-library-standards-v2 | agent-center · 政策标准库 | 标准条目（含结构化配置段、解析状态、版本） | 配置数据（长期） | GET/POST /standards |
| emission_factor_library | agent-center · 排放因子库 | 公域排放因子（官方缺省 / 分时分区电力 / 国际因子） | 配置数据（长期） | GET /factors |
| enterprise_measured_factors | 企业因子库（私域） | 企业实测因子（P1/P0 私因数） | 台账数据（长期） | GET/POST /factors/enterprise |
| cfp_factor_mapping_memory | 因子匹配服务 | 因子匹配记忆与人工纠偏结果（回写 P0） | 台账数据（长期） | POST /factors/mapping-memory |
| cfp_formula_library | agent-center · 核算公式库 | 核算公式（含内置公式幂等合并兜底） | 配置数据（长期） | GET /formulas |
| cfp_org_accounting_templates | agent-center · 组织模板库 | 企业侧核算模板 | 配置数据（长期） | GET/POST /accounting-templates |
| cfp_sops / cfp_products / cfp_processes | 产品 SOP 库 / 产品与物料库 / 单元过程库 | 私域台账（SOP、产品与物料、单元过程） | 台账数据（长期） | GET/POST /products、/sops、/processes |
| cfp_inherit_sop / pef_inherit_sop | 产品碳足迹 / PEF | 跨模块带入的 SOP 继承项（一次性消费） | 会话数据（短周期） | 无需接口（前端传递） |
| org_resources_v2 | agent-center · 组织资源库 | 主体、表计与档案台账（资格核验与场景路由的数据来源） | 台账数据（长期） | GET/POST /org-resources |
| org_carbon_reports_v2 / org_carbon_reports | 报告与档案中心 | 归档报告底卷（v2 现行；v1 兼容读取） | 归档数据（长期） | GET/POST /reports/archive |
| cfp_task_list / pef_task_list / park_task_list / ghg_task_list / bjc_task_list | 各核算模块 | 模块任务列表（任务与进度索引） | 业务数据（长期） | GET /tasks?module= |
| ghg_cycle_config | 组织碳核算 | 核算周期配置 | 配置数据（长期） | GET/POST /org/cycle-config |
| ghg_conversation_history | 组织碳核算 | 会话历史（切换与恢复上下文） | 会话数据（中期） | GET /conversations |
| org_onboarding_done / zcf_onboarding_done | 组织碳核算 / 零碳工厂 | 新手引导完成标记（布尔字符串） | 偏好数据（长期） | GET/PUT /user/preferences |
| aiPolish / aiNarratives（AI_POLISH_KEY） | report-submission | 整篇预览 AI 改写待审改动（按任务 id 分片、段落级 mode 标注），接受后才写入正文 | 业务数据（中期） | LLM 改写接口 |

> **隔离约定**：公域权威规则（`carbon-library-*` / `emission_factor_library` / `cfp_formula_library`）与私域企业台账（`org_*` / `enterprise_measured_factors` / `cfp_sops` / `cfp_products`）严格分库，不得互相覆盖；企业因子不得写入公域因子库。

## 二、模块字段登记

| 模块 | 字段 | 类型 | 说明 | mock 来源 | 未来接口 |
|---|---|---|---|---|---|
| report-submission | calForm | object | 新建报送计划表单（reportType/dept/freq/firstPeriod/windowStart/windowEnd/route） | ReportSubmissionCenter data | POST /report/calendar |
| report-submission | submissionCalendar | array | 报送日历规则（dept/reportType/freq/window/nextName/nextPeriod/nextGen/windowEnd/enabled + templateId/sceneRule） | 同上 data | GET/POST /report/calendar |
| report-submission | reports | array | 报送任务列表（状态/进度/截止/异常/earlyKey 等） | 同上 data | GET /report/tasks |
| report-submission | reports[].earlyKey | string | 期次任务 ↔ 计划去重键（计划 id），自动派生与提前启动共用，防重复建单 | createCalTask / earlyStart | 任务快照接口 |
| report-submission | reports[].approval | object | **任务级审批配置（创建任务时确定）**：`level`（0 无需审批 / 1 一级 / 2 二级 / 3 三级，默认 0）+ `chain[{nodeLevel, roleKey, by}]`（按层级取平台三级审核链前 N 级）；`mode` 由 level 派生（0=DIRECT_SIGN 直接签发 / >0=MULTI_LEVEL_APPROVAL）供归档凭据沿用；编排内只读执行，缺失（旧缓存/历史任务）回退 0 级 | 新建报送计划 / 临时专项报告弹窗 → 任务对象；期次任务由计划继承（createCalTask） | GET/POST /report/tasks |
| report-submission | reports[].reportNo | string | 归档时报告与档案中心分配的报告编号，任务卡片跳转定位用 | confirmArchive 回写 | 归档接口返回 |
| report-submission | reports[].templateLock | object | 任务创建时模板快照（version / docName / standard / caliber 完整引用对象），在途任务不受模板库改版影响；旧数据兼容：caliber 为字符串时按当前模板声明补全引用键 | submitCreate / 提前启动 / 演示种子 | 任务快照接口 |
| report-submission | templates | array | 平台模板库（docName/reportType/version/variants/matchFields/caliber） | platformTemplates.js | GET /templates |
| report-submission | templates[].prefill | object | 报送计划预填配置（dept/freq/windowDays），选类型时随模板加载 | platformTemplates.js PT-009~016 | 模板库保存接口 |
| agent-center | templates[].periods | array | 模板支持的报送周期（年度/半年度/季度/月度），供报告类型按时间维度过滤（智慧报告临时报告弹窗）；管理页编辑表单暂未含此字段 | platformTemplates.js PT-009~016 | 模板库保存接口 |
| report-submission | caliberInfo | object | 编制依据聚合结构（declaration / ruleParams / ruleMappings / ruleClauses / ruleAvailable / formatReqs / formulas），来源 = 模板 caliber.standardCode → 标准库规则集（缓存缺失时从服务层种子兜底） | Orchestration 编制依据卡片与明细弹窗 | GET /standard/config?code=&scenario=REPORT |
| report-submission | estimatedTokens | number | 编排对话上下文用量估算（中文字符≈1.5 token，k/万格式化），任务重置/新建对话清零 | computed(messages) | 真实 LLM 接入后替换为 API usage |
| report-submission | checkSummary | object | 阶段三校验状态总览（**客观计数口径**：total / pass / groups；待处置 = 未通过规则数，按阻断 / 建议拆分）。原加权质量评分（qualityScore，<60 阻断）已废弃，避免伪精确与双闸门口径 | 校验结果集（CHECK_RULES）计算 | POST /report/check |
| report-submission | auditFlow | array | 三级审核记录（填报人自查 → 部门负责人审核 → 碳管理师复核；通过/退回/批注），全部通过后方可签字归档 | 编排阶段四 | POST /report/audit |
| report-submission | 提报状态 | — | **已移除**：报送看板（部门 × 期次矩阵）与状态枚举整体下线，提报状态统一由报告列表三态（已归档·待提报 / 已提报 / 已受理）表达 | — | 无需接口（由任务状态承载） |
| report-submission | 签发凭据 | object | 签字归档时生成内容指纹（指纹/签发时间/签发人/算法），支持随时重算比对检出签发后改动 | signService（前端模拟） | 服务端签名 + 防篡改存储 |
| zero-carbon-factory | 申报任务 | object | 申报任务（主体类型：制造型企业 / 零碳算力设施；期次；阶段进度 0~5） | agentCoreMixin data | GET/POST /zcf/tasks |
| zero-carbon-factory | 核算模型草稿 | object | 指标 → 构成子模块 → 输入项三级模型（含特殊口径：含/不含原料用能、绿电四类来源），确认后版本化冻结 | 阶段② 模型搭建 | POST /zcf/model |
| zero-carbon-factory | 指标核算结果 | array | 核心指标两级判定（基本要求 / 目标要求）+ 引导指标；逐行验算式与数据来源标注 | 阶段④ 指标核算与评价 | POST /zcf/evaluate |
| zero-carbon-factory | 材料包 | object | 建设方案（官方大纲六章）+ 证明材料附件与目录 + 内容指纹 | 阶段⑥ 材料编制 | POST /zcf/materials |
| org-accounting | org_resources_v2 / ghg_cycle_config / ghg_task_list | 见第一节 | 组织资源台账 / 核算周期配置 / 任务列表 | agentCoreMixin | 见第一节 |
| pef-accounting / park-accounting / beijing-carbon | *_task_list / cfp_sops / cfp_products | 见第一节 | 任务列表与共用私域台账 | agentChatMixin | 见第一节 |
| green-factory | 申报项目 | object | 工厂信息、阶段状态、六维度指标与举证材料、差距清单 | agent.vue（演示数据） | GET/POST /gf/projects |
| footprint | 核算任务 | object | 九阶段任务与进度 | footprint agent.vue | 待定 |
| 通用 | 溯源链 | tree | 报表四级溯源 / 核算七级溯源（见 _terms.md） | 各 agent.vue | 待定 |

## 三、约定

1. **命名**：localStorage 键采用 `<模块前缀>_<对象>`；数组字段用复数，快照类字段以 `*Lock` 结尾（如 `templateLock`）。
2. **快照与本体分离**：任务实例只持引用快照（templateLock / caliber），规则本体在公域库；规则升版不回溯改写历史任务。
3. **接口返回**：凡涉及依据与口径的接口，返回体须携带**标准版本号与时间戳**，保证审计可复现；不得返回“演示兜底值”。
4. **预填映射与期次派生规则**（buildPeriodMeta）见 [report-submission 文档](report-submission/ReportSubmissionCenter.md) 第 4 节（R-06 / R-08）。
