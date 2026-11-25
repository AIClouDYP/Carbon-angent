# Skill 管理（Skill Management）

> 所属菜单：运维管理 → Skill 管理
> 页面路由：`/agent-center/apps/skill-management`
> 代码位置：`src/pages/zcip/agent-center/views/SkillManagement.vue`、`src/pages/zcip/agent-center/data/skillPrompts.js`
> 原型边界：不接后端、不执行真实大模型；页面只维护 Prompt 模板，业务页始终按固定编排读取对应 Skill 配置。

## 1. 业务场景定位

Skill 管理是智能体能力的配置入口，负责维护智能体流程中使用的 Prompt 模板和修改状态。它的核心价值是让解析规则可在线调整，而不是散落在业务页硬编码。

当前页面定位是前端原型配置台：

- Prompt 是模板文本，不是模型执行结果；
- 配置保存在浏览器 `localStorage`；
- 业务页面读取配置后仍然执行规则化模拟；
- 后续接入真实模型时，只需替换业务页的执行层，配置契约保持不变。

## 2. 页面布局

页面由三部分组成：

```text
┌────────────────────────────────────────────────────────────┐
│ 页头：Skill 管理 / 维护各智能体的 Prompt 模板                │
├────────────────────────────────────────────────────────────┤
│ 列表工具条：知识库 / 模板状态 / 关键字 / 重置               │
│ Skill 表格：名称 / 功能描述 / 模板状态 / 详情 / 操作         │
│ 分页栏                                                      │
└────────────────────────────────────────────────────────────┘
```

辅助交互：

- 编辑模板弹窗：Prompt 文本编辑、实时字数、预览效果；
- Prompt 预览弹窗：模拟变量替换与高亮；
- 详情抽屉：640px，无 Element 默认 header，自定义信息头、属性标签、变量区和 Prompt 卡片。

## 3. 功能点清单

| 编号 | 名称 | 说明 | 原型实现度 |
| --- | --- | --- | --- |
| S-01 | Skill 列表 | 展示默认 10 个 Skill 的名称、描述和模板状态 | 已实现 |
| S-02 | 条件筛选 | 知识库、模板状态、关键字联合过滤，支持分页 | 已实现 |
| S-04 | Prompt 编辑 | 复制当前对象进编辑器；保存前校验变量不丢失 | 已实现 |
| S-05 | Prompt 预览 | 使用示例数据替换部分变量并高亮 | 已实现 |
| S-06 | 恢复默认 | 从 `DEFAULT_SKILLS` 还原 Prompt，只影响模板内容 | 已实现 |
| S-07 | 详情抽屉 | 查看知识库、模板状态、输入变量和 Prompt；边界配置按场景编辑 | 已实现 |
| S-08 | 配置持久化 | localStorage 保存用户修改；默认配置升级可增量合并 | 已实现 |
| S-09 | 跨页消费 | 业务页按固定编排读取对应 Skill 的 Prompt | 已实现 |

## 4. 功能点详情

### S-01 Skill 列表

- **位置**：页面主体表格。
- **交互**：名称列显示图标和名称；描述列超长省略；模板状态展示默认/已修改。
- **边界**：列表数据来自 `DEFAULT_SKILLS` 深拷贝，`mounted()` 后与本地缓存合并。
- **数据**：Skill 配置对象；`id` 是稳定唯一键。
- **验收**：默认 10 个 Skill 都可见；修改状态能如实显示。

### S-07 详情抽屉

- **位置**：表格「详情」列。
- **交互**：信息头展示实色图标、名称、描述和关闭按钮；属性标签展示知识库和模板状态；普通 Skill 展示 Prompt 模板和输入变量，`promptScope=scenario` 的 Skill 展示按场景编辑的模板；边界配置只包含 PCF / PEF / ORG / BJ / PARK 五个核算场景。
- **边界**：抽屉关闭 Element 默认 header，避免双重标题；`detailSkill` 直接引用表格行，抽屉内不直接编辑。
- **数据**：`detailVariables` 由 Prompt 实时提取。
- **验收**：只有单一标题；关闭按钮、遮罩和 ESC 都可关闭；复制成功或失败均有提示。

### S-08 配置持久化

- **位置**：`persistSkills()`、`loadSkills()`。
- **交互**：保存模板、恢复默认后保存完整 `skills` 数组；页面进入时与默认配置合并。
- **边界**：
  - key 为 `carbon-skill-templates`；
  - 默认配置作为 base，本地缓存按 `id` 覆盖；
  - JSON 解析失败时回退默认配置；
  - 旧缓存对象的字段会整体覆盖默认配置，不做字段级兜底；加载后主动丢弃废弃的 `phase` / `enabled` 字段。
- **数据**：见全局数据字典 `carbon-skill-templates`。
- **验收**：刷新后配置保留；新增默认 Skill 能出现在列表；默认 Prompt 升级时未被用户修改的 Skill 能取新值。

### S-09 跨页消费

- **位置**：`skillPrompts.js` 导出函数，当前消费方是 `StandardsLibrary.vue` 与产品碳足迹工作台。
- **交互**：业务页按固定编排调用 `getSkillConfigById(skillId)` 读取对应 Skill 的 Prompt；不检查启停状态。
- **边界**：
  - `getSkillConfigById()` 优先返回本地缓存配置，找不到时返回默认配置；
  - 当前只把 Prompt 和状态写入 `parseMeta`，不执行 Prompt；
  - `boundary-config` 仅覆盖需要核算边界的场景（PCF / PEF / ORG / BJ / PARK），由 `policyStandardService.getBoundaryDefaults()` 消费；ZCF / GF / REPORT 不生成边界模板。
- **数据**：Skill id、`promptTemplate`。
- **验收**：页面与业务页读取到同一份模板；历史缓存中残留的停用字段不参与流程判断。

## 5. 数据模型

默认配置对象字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 稳定唯一键，业务页按 id 查配置 |
| `name` | string | 展示名称 |
| `icon` | string | Element 图标类名 |
| `color` | string | 列表图标和详情头部颜色 |
| `desc` | string | 功能描述，参与关键字搜索 |
| `promptScope` | string | 模板粒度：`global` 为所有场景共用一份 Prompt，`scenario` 为按业务场景拆分独立 Prompt；决定详情页使用普通面板还是场景页签 |
| `modified` | boolean | 当前 Prompt 是否偏离默认 |
| `knowledgeBase` | string | 关联知识库；`—` 表示无强关联 |
| `updatedAt` | string | 最近修改时间 |
| `promptTemplate` | string | Prompt 模板全文 |

默认 Skill 清单：

| id | 名称 | 知识库 |
| --- | --- | --- |
| `standard-parsing` | 标准解析 | 政策标准库 |
| `boundary-config` | 边界配置 | 政策标准库 |
| `process-modeling` | 工艺建模 | — |
| `data-collection` | 数据采集 | — |
| `factor-annotation` | 因子标注 | 排放因子库 |
| `factor-matching` | 因子匹配 | 排放因子库 |
| `data-validation` | 数据校验 | 政策标准库 |
| `calculation-orchestration` | 计算编排 | 计算公式库 |
| `analysis-orchestration` | 分析编排 | — |
| `report-generation` | 报告生成 | — |

## 6. 后续接入改造点

| 主题 | 当前状态 | 后续方向 |
| --- | --- | --- |
| 持久化 | 仅浏览器 localStorage | 按用户/租户迁移到后端配置接口 |
| 默认版本 | 没有默认模板版本号或 hash | 增加默认版本，区分内置升级与用户修改 |
| 变量校验 | 只校验原变量丢失 | 增加未注册变量提示和变量来源登记 |
| 预览安全 | 只转义变量值 | 先整体 HTML 转义文本，再插入高亮片段 |
| 执行链路 | 业务页规则化模拟 | Prompt 与文件列表提交真实模型服务 |
| 消费范围 | `standard-parsing` 供政策标准库模拟解析；`boundary-config` 供产品碳足迹阶段二预填 | 按阶段逐个接入运行时 |

