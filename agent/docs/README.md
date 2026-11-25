# 智慧能碳智能体原型 —— 页面功能规格说明（Page Spec）

> 本目录是原型系统的**文档驱动**规格库。任何页面改动必须先改对应 md 再改代码。
> 流程：**文档先行 → 页面调整**（交付开发前的内部调整不留变更记录，代码 git 历史即事实记录）。

## 一、目录结构（与 src/pages/zcip 镜像）

```
docs/
  README.md                    <- 本文件：索引 + 编写规范
  _data-dictionary.md          <- 全局数据字典（mock 字段 <-> 未来 API 映射）
  _terms.md                    <- 术语与口径表（全局唯一口径定义）
  _data-list-interaction-spec.md <- 数据清单统一交互规范（8 场景共性：引导为主 + 抽屉按需）
  <一级模块>/                   <- 每个一级模块一个文件夹（镜像 pages/zcip）
    <页面>.md                   <- 每个功能页面一份规格

  agent-center/                <- 基础支撑模块（资源台账 + 运维管理）
    standards-library.md       <- 政策标准库（标准配置驱动源头）
    skill-management.md        <- Skill 管理（Prompt 模板配置与业务页消费）
    # formula-library.md       <- 核算公式库（待编写）
    # platform-template-library.md <- 平台模板库（待编写）
  99history/                   <- 历史版本归档（见 4.2）
```

## 二、单页面文档模板（4 节，缺一不可）

1. **业务场景定位**：对应标书/需求编号（如 2.6.2.3-（9）），面向谁、解决什么问题、业务目标。
2. **页面布局**：区域划分描述或 ASCII 简图（左栏/对话区/右栏页签/弹窗），先建立页面空间结构。
3. **功能点清单**：表格（编号/名称/说明/**原型实现度**）。排序规则：空间主导型页面按布局 Z 序（左→中→右，自上而下，弹窗归入触发区域之后）；流程主导型页面按业务流程顺序。原型实现度只允许三档：**已实现**（原型可交互、逻辑真实）/ **演示数据**（原型可交互，以预置数据走流程，真实逻辑在开发阶段实现）/ **待开发**（原型界面未实现，开发阶段实现）。
   > **口径声明**：本列只表达原型阶段的实现程度，**不代表范围裁剪**——全部功能点均在开发交付范围内；确需排除的能力，统一写在模块“边界声明”节，不在本列表达。
4. **功能点详情**：对照第 3 节清单逐项展开，每项含**位置 / 交互 / 边界 / 数据 / 验收**（样板见 ReportSubmissionCenter.md）；流程主导型页面可按流程分组，但边界与验收须并入对应功能块，不再单设章节。字段全局定义登记到 _data-dictionary.md，不在页面文档重复定义。

## 三、硬性约定

1. **文档先行**：无文档变更不提交页面代码；commit message 引用文档章节号；
2. **演示边界**：文档“原型实现度”列如实标注三档（见模板第 3 节）；界面提示按误导风险分级——产出物造假（假文件、假结果、假流程终点）必须标注或做真；通用组件真实工作仅缺后端层的，不标注；待开发占位给“开发中”反馈即可；
3. **粒度**：按功能页面（路由）记录；跨页面的业务流程写在该模块主文档的“页面流转”节；
4. **拆分阈值**：单个 md 超过 500 行时按子视图拆分为同文件夹下多个 md，并在模块索引节登记；
5. **全局共享**：字段定义、术语口径只写在 _data-dictionary.md 与 _terms.md，页面文档引用不重复定义。
6. **实现文档同步**：改动命中下列内容时，必须同步更新对应页面文档：
   1. 新增、删除、重命名页面组件，或修改路由、页面参数、跨页面跳转。
   2. 修改 localStorage key、默认数据、种子数据或数据模型字段。
   3. 修改页面状态机、审核状态、发布/驳回、启用/禁用等核心逻辑。
   4. 修改 Skill id、默认 Prompt 来源、变量规则或跨页面消费函数。
   5. 改变“前端原型、模拟解析、不接大模型、不接后端”的边界。

   只调整颜色、间距、字号可不展开记录；影响交互结构、可见文案、状态展示或滚动行为时仍需补充。文档与代码冲突时以代码为准，并立即修正文档。

## 四、页面索引

### 4.1 页面规格（4 节模板）

| 模块 | 页面文档 | 路由 | 原型实现度 |
|---|---|---|---|
| report-submission | [智慧报告工作台](report-submission/ReportSubmissionCenter.md) | /#/agent-center/apps/report-submission | 已实现 |
| footprint | [产品碳足迹工作台 + 任务详情](footprint/footprint.md) | /#/agent-center/apps/carbon-accounting | 已实现 |
| footprint | [产品碳足迹任务详情（九阶段核算）](footprint/footprint.md) | /#/footprint/accounting/agent | 已实现 |
| footprint | 数据采集 | /#/footprint/accounting/data-collection | 已实现 |
| pef-accounting | 产品环境足迹工作台 | /#/agent-center/apps/pef-accounting | 已实现 |
| org-accounting | [组织碳核算工作台](org-accounting/org-accounting.md) | /#/org-accounting/accounting/agent | 已实现 |
| park-accounting | [园区碳核算工作台](park-accounting/park-accounting.md) | /#/park-accounting/accounting/agent | 已实现 |
| beijing-carbon | [北京碳市场工作台](beijing-carbon/beijing-carbon.md) | /#/beijing-carbon/accounting/agent | 已实现 |
| zero-carbon-factory | 零碳工厂申报工作台 | /#/agent-center/apps/zero-carbon-factory | 已实现 |
| green-factory | [绿色工厂自评价](green-factory/green-factory.md) | /#/green-factory/agent | 演示数据 |
| agent-center | 智能体中心 + 资源库群（多视图模块，按模块汇总记录；各视图清单见该文档第 3 节） | /#/agent-center/* | 已实现 |
| agent-center | [Skill 管理](agent-center/skill-management.md) | /#/agent-center/apps/skill-management | 已实现 |
| report-submission | [报送任务编排详情](report-submission/Orchestration.md) | （工作台任务模式内） | 已实现 |
| zero-carbon-factory | [任务编排（六阶段）](zero-carbon-factory/TaskWorkbench.md) | （工作台任务模式内） | 已实现 |

> 各模块文档完备度：✅ 完整规格 / 📋 骨架（待补详） / ⬜ 未建
> report-submission ✅ 完整样例 | 2026-09-20 全部 9 个模块已补齐为完整规格（✓），后续按“文档先行”原则随页面迭代维护
> 2026-10-14 更新：org-accounting / beijing-carbon 按当前实现重写（三步四项确认、结果与数据/配置与模型两页签、年度视图、核查对接；北京场景口径为「直接排放/间接排放」+「较上年」）

### 4.2 非页面类文档（设计输入 / 目标态规格）

| 文档 | 定位 | 类型 |
|---|---|---|
| [report-submission/ArchitectureSpec-V5.md](report-submission/ArchitectureSpec-V5.md) | 智慧报告五阶段顶层架构与数据流全景规范（含「原型实现度对照」，目标态与原型差距即细化设计工作清单） | 目标态总纲规格 |
| [report-submission/StagesAndSupport.md](report-submission/StagesAndSupport.md) | 五阶段生命周期与公共支撑联系（阶段口径说明、数据流主线、支撑 × 阶段矩阵） | 设计输入 |
| [report-submission/智慧报告智能体五阶段顶层架构与数据流全景规范（终版）.md](report-submission/智慧报告智能体五阶段顶层架构与数据流全景规范（终版）.md) | 智慧报告 PRD 终版（顶层产品哲学、五大领域对象、五阶段执行规范矩阵） | 目标态规格 |

### 4.3 归档目录

| 目录 | 定位 | 维护约定 |
|---|---|---|
| 99history/ | 历史版本归档（产品碳足迹 BRD/FRD、组织碳核算交互说明、数据校验规则详解等） | 不参与“文档先行”维护；**不适用 500 行拆分约定**（归档原文保留） |
| 99history/newdocs-template/ | 早期通用交付模板（01~05 与 README），已由 `agent/docs/` 现行页面实现文档替代 | 历史模板与占位内容，仅供追溯参考；不参与当前文档维护 |

> 2026-10-19 更新：三场景（园区/组织/北京）数据清单统一为 3 列参数表 + 计算式块；溯源抽屉改两段式（参数选中 → 凭证/匹配/记录）；新增参数更正与留痕；园区数据完整性按渠道化；新增 05园区碳核算 技术方案与功能设计文档。
