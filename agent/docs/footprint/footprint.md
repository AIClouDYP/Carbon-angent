# 产品碳足迹场景（工作台 + 任务详情）

> 对应标书：2.6.10.3-（3）、2.7.2 产品碳足迹智能体 | 状态：✅ 双页结构

## 1. 业务场景定位

面向园区制造企业的碳管理人员与工艺工程师，基于 LCA 生命周期方法提供产品碳足迹九阶段智能核算服务，支撑绿色供应链查询、产品出海合规与客户碳问卷回复。场景拆分为两个页面：

- 工作台 `/#/agent-center/apps/carbon-accounting`：历史对话、任务创建/删除、任务续作入口、企业产品库入口；
- 任务详情 `/#/footprint/accounting/agent`：左侧对话 + 右侧九阶段核算工作区，承接具体任务。

## 2. 页面边界与流转

| 页面 | 路由 | 主文件 | 布局与职责 |
|---|---|---|---|
| 工作台 | `/#/agent-center/apps/carbon-accounting` | `agent/src/pages/zcip/agent-center/views/CarbonAccountingCenter.vue` | 左侧历史对话栏；中间对话区与内嵌创建任务表单；右侧「任务列表 / 企业产品库」两页签 |
| 任务详情 | `/#/footprint/accounting/agent` | `agent/src/pages/zcip/footprint/accounting/agent.vue` | 左侧对话区；右侧九阶段核算面板；`pageMode` 固定为 `task-active`，页内不承载任务列表或选品 |

工作台通过任务卡片、创建任务表单或企业产品库「开始核算」进入任务详情。进入时通过 `direct=true` 及 `taskId`、`productName`、`inheritSop` 等 query 参数恢复或创建任务；任务详情顶部「返回」回到工作台，「重置」重置当前核算会话。

辅助视图：`data-collection.vue`（数据采集）、`emission-detail.vue`（排放源明细）。`CreateTaskDialog.vue` 当前未挂载，工作台使用对话内嵌表单创建任务。

## 3. 功能点清单

| 编号 | 名称 | 所在页面/文件 | 说明 | 原型实现度 |
|---|---|---|---|---|
| W-01 | 工作台新手引导 | CarbonAccountingCenter.vue | 通过 `steps-override` 描述真实三栏、两页签和双页分工 | 已实现 |
| W-02 | 历史对话栏 | CarbonAccountingCenter.vue | 左侧展示历史对话索引；标题栏支持新建对话 | 已实现 |
| W-03 | 创建核算任务 | CarbonAccountingCenter.vue | 中间对话区嵌入表单：任务名称、企业产品、核算标准 | 已实现 |
| W-04 | 任务列表 | CarbonRightPanel.vue | 展示产品、阶段、进度、状态、时间；点击进入任务详情 | 已实现 |
| W-05 | 任务删除 | CarbonAccountingCenter.vue + CarbonRightPanel.vue | 进行中/已完成未归档可删；`isReportArchived` 为 true 时隐藏删除并拦截 | 已实现 |
| W-06 | 企业产品库 | CarbonRightPanel.vue | 展示品类、型号、有SOP/待构建及「开始核算」；齿轮按钮去产品库管理 | 已实现 |
| T-01 | 任务详情对话 | agent.vue + agentChatMixin.js | 左侧对话承接阶段确认、建议和指令 | 已实现 |
| T-02 | 九阶段核算面板 | agent.vue + agentCoreMixin.js | 右侧按阶段展示标准、边界、模型、数据、因子、校验、计算、分析、报告；阶段2由 `boundary-config` Skill 提供场景默认边界，再由已选标准细化/固化 | 演示数据 |
| T-03 | 标准解析区 | agent.vue | 阶段1「政策标准」选择标准并展示标准解析内容 | 演示数据 |
| T-04 | 核算模型与数据 | agent.vue + agentCoreMixin.js | 生命周期模型、活动数据、因子匹配、数据校验 | 演示数据 |
| T-05 | 计算、分析与报告 | agent.vue + agentCoreMixin.js | 逐单元计算、贡献/不确定性/敏感性分析、报告导出 | 演示数据 |
| T-06 | 独立页签 | App.vue + routes.js | 任务详情独立页签，保留进入任务时的完整 query | 已实现 |
| A-01 | 数据采集页 | data-collection.vue | 独立数据采集视图，提交后跳转任务详情 | 已实现 |
| A-02 | 排放明细页 | emission-detail.vue | 独立排放明细查询视图 | 已实现 |

## 4. 九阶段命名与交互

```
政策标准 → 核算边界 → 核算模型 → 活动数据 → 排放因子 → 数据校验 → 碳足迹计算 → 碳足迹分析 → 碳足迹报告
```

- 阶段推进由左侧对话中的确认和右侧面板操作联动，`currentStepIndex` 同步进度条；
- 阶段1讲「标准怎么要求」，阶段2填「本产品怎么算」；标准解析区应随所选标准动态渲染；
- 阶段2进入时调用 `getBoundaryDefaults('PCF')` 读取 `boundary-config` Skill 场景默认值；`syncBoundaryFromStandard()` 用标准 `structured.params` 生成的 `boundaryTemplate` 覆盖默认值。优先级为：标准明确条款 > Skill 场景默认 > 工作台兜底；
- 标准固定生命周期、单位类型、分配规则、取舍阈值时，右侧面板锁定只读；标准时间边界为要求性文本时显示只读文本和「标准要求」标签，不强行造日期；
- 乘用车种子标准（SEED_VERSION v15）已补齐 `lifecycleScope`、`unitType`、`unitDetail`、`allocationRule`、取舍阈值、时间代表性、生命周期阶段等边界参数，并带条款溯源。
- 阶段3围绕生命周期边界构建模型；阶段4~6处理活动数据、因子匹配与数据校验；阶段7~9完成计算、分析和报告；
- 阶段9可发布 SOP；工作台企业产品库据此显示「有SOP」，后续核算可一键继承模型。

## 5. 任务数据与边界

- 任务列表统一存取 `localStorage.cfp_task_list`；工作台 `loadCfpTasks()` 与任务详情 `agentChatMixin.persistTaskList()` 同源，任务变更通过 `cfp-tasks-changed` 事件刷新工作台；
- 企业产品统一通过 `loadCfpProducts()` 读取 `cfp_products_v4`，工作台产品卡片只显示现有字段，不声明数据完整度或历史核算次数；
- 任务区分「进行中 / 已完成未归档 / 已归档」：进行中、已完成未归档可删，只有已归档不可删；
- 任务详情页依赖 `taskId` 恢复已有任务或快照；工作台跳转与全局页签切换均必须保留 query，避免丢失任务上下文；
- 工作台不承载九阶段核算，任务详情不承载任务列表、选品或左历史对话栏。

## 6. 验收要点

- [ ] 工作台左历史栏、中对话/创建表单、右两页签布局与引导一致；
- [ ] 创建任务、任务卡片续作、产品「开始核算」均进入任务详情并保留任务上下文；
- [ ] 工作台与任务详情分别显示为独立页签，点击任务详情标签不丢失 `direct/taskId/productName/inheritSop`；
- [ ] 任务详情只有左对话与右九阶段，顶部可返回工作台、重置当前会话；
- [ ] 九阶段名称与进度条一致；归档任务不可删除；
- [ ] 数据采集页提示与跳转目标写「任务详情」，不再称「核算工作台」。
