<template>
  <div class="platform-template-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title"><i class="el-icon-files"></i> 平台模板库</h2>
        <p class="page-desc">平台预置的通用核算模板框架，涵盖边界配置、核算模型、数据模板、报告模板，供全平台企业复用</p>
      </div>
    </div>

    <!-- 模板类型分页签（一级导航：按资产性质分类，徽标显示各类数量） -->
    <div class="type-tabs">
      <div v-for="t in typeTabs" :key="t.key" :class="['type-tab', { active: activeType === t.key }]" @click="switchType(t.key)">
        <span class="type-tab-name">{{ t.label }}</span>
        <span class="type-tab-count">{{ t.count }}</span>
      </div>
    </div>

    <!-- 搜索与筛选（类型已由分页签承担，此处只留场景 / 状态） -->
    <div class="toolbar">
      <el-input placeholder="搜索模板名称（跨全部类型）..." prefix-icon="el-icon-search" size="small" v-model="searchText" clearable style="width: 240px;"></el-input>
      <el-select v-model="filterScope" placeholder="业务场景" size="small" clearable style="width: 160px; margin-left: 8px;">
        <el-option v-for="s in scopeOptions" :key="s" :label="s" :value="s"></el-option>
      </el-select>
      <el-select v-model="filterStatus" placeholder="状态" size="small" clearable style="width: 110px; margin-left: 8px;">
        <el-option label="已发布" value="已发布"></el-option>
        <el-option label="待审核" value="待审核"></el-option>
        <el-option label="草稿" value="草稿"></el-option>
        <el-option label="已停用" value="已停用"></el-option>
      </el-select>
      <span v-if="searchText" class="toolbar-hint">搜索已跨全部类型，共匹配 {{ filteredTemplates.length }} 个模板</span>
    </div>

    <!-- 模板列表表格 -->
    <div class="table-wrapper">
      <div class="table-title-bar">
        <span class="table-title-text">模板列表</span>
        <!-- 模板内容（章节结构 / 表头字段）由文档解析产出，故不提供手工新增入口，统一走「上传解析 → 核对 → 待审核」 -->
        <el-button type="primary" size="small" icon="el-icon-upload2" @click="openParseDialog">上传解析模板</el-button>
      </div>
      <div class="table-scroll">
        <el-table :data="pagedTemplates" border stripe size="small" style="width: 100%;" :header-cell-style="headerCellStyle">
          <el-table-column type="expand" width="40">
            <template slot-scope="{ row }">
              <!-- 一二级联动：一级为模板，展开显示填报场景（含匹配条件与章节数）；无变体时显示配置项 -->
              <div v-if="row.variants && row.variants.length" class="var-panel">
                <div class="var-panel-title"><i class="el-icon-s-grid"></i> 填报场景（{{ row.variants.length }} 个）</div>
                <div class="var-row var-row-head">
                  <span>填报场景</span><span>报表套件</span><span>章节数</span><span>匹配条件</span><span>操作</span>
                </div>
                <div v-for="v in row.variants" :key="v.key" class="var-row">
                  <span class="var-label">{{ v.label }}</span>
                  <span class="var-suite">{{ v.suite }}</span>
                  <span class="var-count">{{ (v.sections || []).length }} 项</span>
                  <span class="var-cond">{{ conditionText(v.conditions) }}</span>
                  <el-button size="mini" type="text" @click="viewVariant(row, v)">查看章节</el-button>
                </div>
              </div>
              <div v-else-if="row.configItems && row.configItems.length" class="var-panel">
                <div class="var-panel-title"><i class="el-icon-setting"></i> 配置项（{{ row.configItems.length }} 项）</div>
                <div v-for="it in row.configItems" :key="it.key" class="cfg-row">
                  <span class="cfg-key">{{ it.key }}</span>
                  <span class="cfg-val">{{ it.value }}</span>
                </div>
              </div>
              <div v-else class="var-panel var-panel-empty">该模板暂未配置填报场景或配置项</div>
            </template>
          </el-table-column>
          <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
          <el-table-column label="模板编号" prop="id" width="110" align="center">
            <template slot-scope="{ row }">
              <span style="font-family: monospace; font-size: 12px; color: #909399;">{{ row.id }}</span>
            </template>
          </el-table-column>
          <el-table-column label="模板名称" prop="name" min-width="200" show-overflow-tooltip></el-table-column>
          <el-table-column v-if="!activeType" label="模板类型" prop="type" width="120" align="center">
            <template slot-scope="{ row }">
              <el-tag size="mini" :type="typeTagType(row.type)">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="业务场景" prop="scope" width="130" align="center"></el-table-column>
          <el-table-column label="依据标准" width="170" show-overflow-tooltip>
            <template slot-scope="{ row }">
              <span v-if="row.standard">{{ row.standard }}</span>
              <span v-else style="color:#c0c4cc;">无（按内部口径）</span>
            </template>
          </el-table-column>
          <el-table-column label="匹配条件" width="150" show-overflow-tooltip>
            <template slot-scope="{ row }">
              <span v-if="row.type === '报告模板' && row.reportType">{{ row.reportType }}</span>
              <span v-else-if="row.variants && row.variants.length">{{ row.variants.length }} 个填报场景</span>
              <span v-else-if="row.matchFields && row.matchFields.length">{{ row.matchFields.map(f => f.label).join(' / ') }}</span>
              <span v-else style="color:#c0c4cc;">—</span>
            </template>
          </el-table-column>
          <el-table-column label="版本" prop="version" width="80" align="center"></el-table-column>
          <el-table-column label="状态" prop="status" width="90" align="center">
            <template slot-scope="{ row }">
              <el-tag size="mini" :type="statusTagType(row.status)">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="更新时间" prop="updateTime" width="110" align="center"></el-table-column>
          <el-table-column label="操作" width="210" align="center" fixed="right">
            <template slot-scope="{ row }">
              <el-button type="text" size="mini" @click="viewDetail(row)">查看</el-button>
              <!-- 待审核：仅提供审核动作；其余状态：编辑 / 删除 -->
              <template v-if="row.status === '待审核'">
                <el-button type="text" size="mini" @click="approveTemplate(row)">通过</el-button>
                <el-button type="text" size="mini" class="btn-danger" @click="rejectTemplate(row)">驳回</el-button>
              </template>
              <template v-else>
                <el-button type="text" size="mini" @click="editTemplate(row)">编辑</el-button>
                <el-button type="text" size="mini" class="btn-danger" @click="deleteTemplate(row)">删除</el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="filteredTemplates.length === 0" class="empty-state">
          <i class="el-icon-files"></i>
          <p>{{ (searchText || filterScope || filterStatus) ? '未找到匹配的模板' : (activeType ? '该类型下暂无模板' : '暂无模板数据') }}</p>
        </div>
      </div>
      <div class="pagination-bar" v-if="filteredTemplates.length > 0">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="filteredTemplates.length" :page-sizes="[10, 20, 50]" :page-size="pageSize" :current-page="currentPage" @size-change="handleSizeChange" @current-change="handlePageChange"></el-pagination>
      </div>
    </div>

    <!-- 模板详情弹窗：基础信息 + 章节预览（模板内容量大，480px 抽屉展示受限） -->
    <el-dialog title="平台模板详情" :visible.sync="detailVisible" width="960px" top="6vh" append-to-body custom-class="tpl-detail-dialog">
      <div v-if="currentTemplate" class="tpl-detail">
        <el-tabs v-model="detailTab">
          <el-tab-pane label="基础信息" name="info">
            <el-descriptions :column="2" border size="small" label-class-name="detail-label">
              <el-descriptions-item label="模板编号">{{ currentTemplate.id }}</el-descriptions-item>
              <el-descriptions-item label="模板类型">{{ currentTemplate.type }}</el-descriptions-item>
              <el-descriptions-item label="模板名称" :span="2">{{ currentTemplate.name }}</el-descriptions-item>
              <el-descriptions-item label="模板文档全称" :span="2">{{ currentTemplate.docName || '—' }}</el-descriptions-item>
              <el-descriptions-item label="业务场景">{{ currentTemplate.scope }}</el-descriptions-item>
              <el-descriptions-item label="适用报告类型" v-if="currentTemplate.type === '报告模板'">{{ currentTemplate.reportType || '—' }}</el-descriptions-item>
              <el-descriptions-item label="匹配维度" :span="2">
                <template v-if="currentTemplate.matchFields && currentTemplate.matchFields.length">
                  <el-tag v-for="f in currentTemplate.matchFields" :key="f.key" size="mini" effect="plain" style="margin-right:4px;">{{ f.label }}</el-tag>
                  <span class="detail-hint">按这些字段匹配到对应填报场景</span>
                </template>
                <span v-else>—</span>
              </el-descriptions-item>
              <el-descriptions-item label="业务适用范围" :span="2">
                <template v-if="currentTemplate.scopes && currentTemplate.scopes.length">
                  <el-tag v-for="s in currentTemplate.scopes" :key="s" size="mini" effect="plain" style="margin-right:4px;">{{ s }}</el-tag>
                </template>
                <span v-else>—</span>
              </el-descriptions-item>
              <el-descriptions-item label="依据标准" :span="2">{{ currentTemplate.standard || '无（按内部口径）' }}</el-descriptions-item>
              <el-descriptions-item label="口径规则集" :span="2">
                <template v-if="detailCaliber">
                  <b>{{ detailCaliber.name }}</b>
                  <el-tag v-if="detailCaliber.formulaStandard" size="mini" type="success" effect="plain" style="margin-left:6px;">
                    公式标准 {{ detailCaliber.formulaStandard }}（{{ detailCaliber.formulaCount }} 条公式）
                  </el-tag>
                  <el-tag v-if="detailCaliber.factorVersion && detailCaliber.factorVersion !== '—'" size="mini" type="info" effect="plain" style="margin-left:4px;">
                    因子版本 {{ detailCaliber.factorVersion }}
                  </el-tag>
                  <div v-if="detailCaliber.formulaStandard && !detailCaliber.formulaCount" class="detail-hint" style="display:block;margin-top:2px;">
                    公式库中未收录该标准的公式，请在公式库中补充后生效
                  </div>
                </template>
                <span v-else>—</span>
              </el-descriptions-item>
              <el-descriptions-item label="版本号">{{ currentTemplate.version }}</el-descriptions-item>
              <el-descriptions-item label="状态">{{ currentTemplate.status }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ currentTemplate.updateTime }}</el-descriptions-item>
              <el-descriptions-item label="审核记录" :span="2" v-if="currentTemplate.auditTime || currentTemplate.auditRemark">
                <span>{{ currentTemplate.auditTime || '—' }}<template v-if="currentTemplate.auditBy"> · {{ currentTemplate.auditBy }}</template></span>
                <div v-if="currentTemplate.auditRemark" class="detail-hint" style="display:block;">驳回原因：{{ currentTemplate.auditRemark }}</div>
              </el-descriptions-item>
              <el-descriptions-item label="模板描述" :span="2">{{ currentTemplate.description || '—' }}</el-descriptions-item>
            </el-descriptions>
            <!-- 填报场景概览：基础信息只呈现模板共性，各场景的具体章节在 Tab2 按场景分块展示 -->
            <div class="detail-config" v-if="detailVariants.length">
              <div class="config-title"><i class="el-icon-s-grid"></i> 填报场景（{{ detailVariants.length }} 个）</div>
              <el-table :data="detailVariants" size="mini" border class="tpl-scene-table">
                <el-table-column label="填报场景" prop="label" width="170"></el-table-column>
                <el-table-column label="报表套件" prop="suite" show-overflow-tooltip></el-table-column>
                <el-table-column label="章节数" width="70" align="center">
                  <template slot-scope="{ row }">{{ (row.sections || []).length }}</template>
                </el-table-column>
                <el-table-column label="匹配条件" width="190">
                  <template slot-scope="{ row }">
                    <span v-for="(val, k) in (row.conditions || {})" :key="k" class="tpl-cond">{{ matchLabel[k] || k }} = {{ val }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <!-- 配置项在 Tab1 仅作摘要（有章节预览时）；无章节结构的模板在 Tab2「配置详情」完整展示，避免重复 -->
            <div class="detail-config" v-if="detailSections.length && currentTemplate.configItems && currentTemplate.configItems.length">
              <div class="config-title"><i class="el-icon-setting"></i> 模板配置项</div>
              <div class="config-list">
                <div class="config-row" v-for="item in currentTemplate.configItems" :key="item.key">
                  <span class="config-key">{{ item.key }}</span>
                  <span class="config-val">{{ item.value }}</span>
                </div>
              </div>
            </div>
          </el-tab-pane>
          <!-- Tab2 按模板类型动态化：报告类模板看章节结构，其他类型（边界/模型/数据模板）看配置明细 -->
          <el-tab-pane v-if="detailSections.length" name="sections">
            <span slot="label">章节预览（{{ detailSections.length }}）</span>
            <!-- 单场景：直接展示章节 -->
            <template-sections-preview v-if="detailVariants.length <= 1" :sections="detailSections" />
            <!-- 多场景：每个填报场景独立成块、逐个展开核对（避免横向切换按钮拥挤，也避免跨场景串看） -->
            <template v-else>
              <div class="tpl-scene-hint"><i class="el-icon-info"></i> 填报场景由填报领域等条件自动匹配，任务中不可手选；此处供逐个核对各场景章节。</div>
              <el-collapse v-model="detailVariantKey" accordion class="tpl-scene-collapse">
                <el-collapse-item v-for="v in detailVariants" :key="v.key" :name="v.key">
                  <template slot="title">
                    <span class="tpl-scene-name">{{ v.label }}</span>
                    <span class="tpl-scene-suite">{{ v.suite }}</span>
                    <el-tag size="mini" effect="plain">{{ (v.sections || []).length }} 张</el-tag>
                  </template>
                  <template-sections-preview :sections="v.sections" />
                </el-collapse-item>
              </el-collapse>
            </template>
          </el-tab-pane>
          <el-tab-pane v-else label="配置详情" name="config">
            <div v-if="currentTemplate.configItems && currentTemplate.configItems.length" class="cfg-detail">
              <div v-for="it in currentTemplate.configItems" :key="it.key" class="cfg-detail-row">
                <span class="cfg-detail-key">{{ it.key }}</span>
                <span class="cfg-detail-val">{{ it.value }}</span>
              </div>
            </div>
            <div v-else class="cfg-detail-empty">该模板暂未配置内容</div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <!-- 上传解析模板：上传 → 智能解析 → 确认入库（对齐政策标准库范式） -->
    <el-dialog title="上传解析模板" :visible.sync="showParseDialog" width="640px" append-to-body :close-on-click-modal="false" @close="resetParse">
      <div class="tpl-steps">
        <div :class="['tpl-step', { 'step-active': parseStep === 0, 'step-done': parseStep > 0 }]">
          <div class="tpl-step-dot">1</div><span>上传文件</span>
        </div>
        <div class="tpl-step-line"></div>
        <div :class="['tpl-step', { 'step-active': parseStep === 1, 'step-done': parseStep > 1 }]">
          <div class="tpl-step-dot">2</div><span>智能解析</span>
        </div>
        <div class="tpl-step-line"></div>
        <div :class="['tpl-step', { 'step-active': parseStep === 2, 'step-done': parseStep > 2 }]">
          <div class="tpl-step-dot">3</div><span>确认入库</span>
        </div>
      </div>

      <!-- 步骤1：上传文件 -->
      <div v-if="parseStep === 0" class="tpl-upload-zone">
        <div class="tpl-agent-tip">
          <i class="el-icon-cpu"></i>
          <span>请上传模板文件（Word / PDF / Excel），智能助手将解析出章节结构、表头字段与填报要求，并自动预填模板信息。</span>
        </div>
        <div class="tpl-drop-zone" :class="{ 'drop-active': isParseDragOver }"
          @dragover.prevent="isParseDragOver = true"
          @dragleave.prevent="isParseDragOver = false"
          @drop.prevent="onParseDrop"
          @click="$refs.parseFileInput.click()">
          <i class="el-icon-upload"></i>
          <div class="tpl-drop-text">将文件拖到此处，或<em>点击上传</em></div>
          <div class="tpl-drop-hint">支持 .doc / .docx / .pdf / .xlsx，单文件不超过 20MB</div>
        </div>
        <input ref="parseFileInput" type="file" accept=".doc,.docx,.pdf,.xlsx" style="display:none;" @change="onParseFileChange">
        <div v-if="parseFile" class="tpl-file-card">
          <i class="el-icon-document tpl-file-icon"></i>
          <div class="tpl-file-info">
            <div class="tpl-file-name">{{ parseFile.name }}</div>
            <div class="tpl-file-size">{{ formatFileSize(parseFile.size) }}</div>
          </div>
          <i class="el-icon-close tpl-file-remove" @click.stop="parseFile = null"></i>
        </div>
      </div>

      <!-- 步骤2：智能解析中 -->
      <div v-if="parseStep === 1" class="tpl-parsing-zone">
        <div class="tpl-parse-task" v-for="(task, i) in parseTasks" :key="i"
          :class="{ 'task-done': task.done, 'task-running': task.running }">
          <i :class="task.done ? 'el-icon-circle-check' : (task.running ? 'el-icon-loading' : 'el-icon-time')"></i>
          <span>{{ task.label }}</span>
          <span v-if="task.done && task.result" class="task-result">{{ task.result }}</span>
        </div>
      </div>

      <!-- 步骤3：解析完成（确认在编辑表单中完成，复用同一套字段） -->
      <div v-if="parseStep === 2" class="tpl-parsed-zone">
        <div class="tpl-agent-tip success">
          <i class="el-icon-circle-check"></i>
          <span>解析完成！已预填模板信息与章节结构，点击「确认并完善」在表单中核对修正后入库。</span>
        </div>
        <div v-if="parsedTemplate" class="tpl-parsed-summary">
          <div class="tpl-parsed-row"><span>模板名称</span><b>{{ parsedTemplate.name }}</b></div>
          <div class="tpl-parsed-row"><span>模板类型</span><b>{{ parsedTemplate.type }}</b></div>
          <div class="tpl-parsed-row"><span>章节结构</span><b>{{ parsedTemplate.sections ? parsedTemplate.sections.length : 0 }} 项</b></div>
          <div class="tpl-parsed-row"><span>识别依据</span><b>{{ parsedTemplate.standard || '未识别到标准引用' }}</b></div>
          <div class="tpl-parsed-row"><span>口径规则集</span><b>{{ parsedTemplate.caliber ? parsedTemplate.caliber.name : '—' }}</b></div>
        </div>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button v-if="parseStep === 2" @click="resetParse">重新上传</el-button>
        <el-button @click="showParseDialog = false">取消</el-button>
        <el-button v-if="parseStep === 0" type="primary" :disabled="!parseFile" @click="startParseTemplate">开始解析</el-button>
        <el-button v-if="parseStep === 2" type="primary" @click="confirmParseToForm">确认并完善</el-button>
      </span>
    </el-dialog>

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="editMode ? '编辑模板' : '确认模板信息（解析结果）'" :visible.sync="editVisible" width="560px" append-to-body>
      <el-form :model="editForm" label-width="100px" size="small">
        <el-form-item label="模板名称" required>
          <el-input v-model="editForm.name" placeholder="请输入模板名称"></el-input>
        </el-form-item>
        <el-form-item label="模板类型" required>
          <el-select v-model="editForm.type" placeholder="选择模板类型" style="width: 100%;">
            <el-option label="边界模板" value="边界模板"></el-option>
            <el-option label="模型模板" value="模型模板"></el-option>
            <el-option label="数据模板" value="数据模板"></el-option>
            <el-option label="报告模板" value="报告模板"></el-option>
            <el-option label="申报模板" value="申报模板"></el-option>
            <el-option label="全流程模板" value="全流程模板"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="业务场景" required>
          <el-select v-model="editForm.scope" placeholder="选择业务场景" style="width: 100%;" filterable allow-create>
            <el-option v-for="s in scopeOptions" :key="s" :label="s" :value="s"></el-option>
          </el-select>
          <div class="form-hint">选项由现有模板的场景自动汇总（含「智慧报告」等），也可直接输入新场景</div>
        </el-form-item>
        <el-form-item label="模板文档全称">
          <el-input v-model="editForm.docName" placeholder="对外展示的文档全称，如：《用能单位能源利用状况报告》（附件2规范）"></el-input>
        </el-form-item>
        <el-form-item label="适用报告类型" v-if="editForm.type === '报告模板'">
          <el-input v-model="editForm.reportType" placeholder="与任务的报告类型精确匹配，如：碳排放报告 / 能源审计报告"></el-input>
          <div class="form-hint">智慧报告智能体按此字段匹配模板，须与报送计划的「报告类型」一致</div>
        </el-form-item>
        <el-form-item label="依据标准">
          <el-input v-model="editForm.standard" placeholder="报告格式 / 报送依据（如：附件2 用能单位能源利用状况报告格式）；无官方依据可留空"></el-input>
        </el-form-item>
        <el-form-item label="口径规则集">
          <div class="caliber-editor">
            <el-input v-model="editForm.caliberName" size="small" placeholder="规则集名称，如：GB/T 2589 综合能耗计算通则（当量值折标）"></el-input>
            <div class="caliber-row">
              <span class="caliber-label">公式标准</span>
              <el-select v-model="editForm.caliberFormulaStandard" size="small" placeholder="引用公式库" filterable allow-create clearable style="flex:1;">
                <el-option v-for="s in formulaStandards" :key="s" :label="s" :value="s"></el-option>
              </el-select>
              <span class="caliber-label">因子版本</span>
              <el-input v-model="editForm.caliberFactorVersion" size="small" placeholder="如：2025年第3号公告版" style="flex:1;"></el-input>
            </div>
          </div>
          <div class="form-hint">口径规则集为「引用声明」：公式标准 → 公式库（按 appliedStandard 取公式）；因子版本 → 因子库（锁定系数版本）</div>
        </el-form-item>
        <el-form-item label="业务适用范围">
          <div class="tag-editor">
            <el-tag v-for="(s, si) in editForm.scopes" :key="si" size="small" closable @close="editForm.scopes.splice(si, 1)" style="margin: 0 6px 6px 0;">{{ s }}</el-tag>
            <el-input v-model="newScopeTag" size="small" placeholder="输入后回车添加，如：重点用能单位" style="width: 240px;" @keydown.enter.native="addScopeTag"></el-input>
          </div>
          <div class="form-hint">说明本模板适用于哪些单位 / 什么报告；章节结构请在下方「模板配置项」与模板内容中维护，勿填在此</div>
        </el-form-item>
        <el-form-item label="版本号">
          <el-input v-model="editForm.version" placeholder="如 v1.0" style="width: 120px;"></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="editForm.status">
            <el-radio label="草稿">草稿</el-radio>
            <el-radio label="待审核">待审核</el-radio>
            <el-radio label="已发布">已发布</el-radio>
            <el-radio label="已停用">已停用</el-radio>
          </el-radio-group>
          <div class="form-hint">草稿→待审核→已发布：仅「已发布」的模板会对引用方（智慧报告智能体等）生效；已停用不再被新任务匹配</div>
        </el-form-item>
        <el-form-item label="模板配置项">
          <div class="config-editor">
            <div v-for="(it, ii) in editForm.configItems" :key="ii" class="config-edit-row">
              <el-input v-model="it.key" size="small" placeholder="配置项名称" style="width: 150px;"></el-input>
              <el-input v-model="it.value" size="small" placeholder="配置值"></el-input>
              <el-button size="small" type="text" class="btn-danger" @click="editForm.configItems.splice(ii, 1)">删除</el-button>
            </div>
            <div class="config-edit-row">
              <el-input v-model="newConfigKey" size="small" placeholder="新增配置项名称" style="width: 150px;"></el-input>
              <el-input v-model="newConfigVal" size="small" placeholder="配置值"></el-input>
              <el-button size="small" type="text" @click="addConfigItem">添加</el-button>
            </div>
          </div>
          <div class="form-hint">模板的关键配置摘要（如：报告章节数 / 口径规则集 / 总量口径），将展示在模板详情中</div>
        </el-form-item>
        <el-form-item label="章节结构" v-if="editForm.type === '报告模板'">
          <el-input type="textarea" v-model="editForm.sectionsJson" :rows="4" placeholder='章节结构 JSON，如：{"sections":[{"name":"范围1 直接排放","purpose":"核算固定燃烧、移动燃烧与逸散排放"}]}'></el-input>
          <div class="form-hint">章节结构（sections）为报告内容与预览弹窗的唯一来源；留空则该模板在预览时提示「未定义章节结构」</div>
        </el-form-item>
        <el-form-item label="模板描述">
          <el-input type="textarea" v-model="editForm.description" :rows="3" placeholder="模板用途及适用范围说明"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="editVisible = false">取消</el-button>
        <el-button type="primary" size="small" @click="saveTemplate">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { loadPlatformTemplates } from '../data/platformTemplates'
import TemplateSectionsPreview from '../components/TemplateSectionsPreview.vue'

export default {
  name: 'PlatformTemplateLibrary',
  components: { TemplateSectionsPreview },
  data() {
    return {
      templates: [],
      searchText: '',
      activeType: '', // 类型分页签（一级导航）；搜索时自动跨类型
      filterScope: '',
      filterStatus: '',
      currentPage: 1,
      pageSize: 10,
      headerCellStyle: { background: 'var(--bg-hover, #f8fafc)', color: 'var(--text-primary, #0f172a)', fontWeight: 600, textAlign: 'center' },
      detailVisible: false,
      detailTab: 'info',
      detailVariantKey: '',
      currentTemplate: null,
      editVisible: false,
      editMode: false,
      editForm: {
        id: '', name: '', type: '', scope: '', standard: '',
        caliber: null, caliberName: '', caliberFormulaStandard: '', caliberFactorVersion: '',
        docName: '', reportType: '', scopes: [], configItems: [], sectionsJson: '',
        version: 'v1.0', status: '草稿', description: ''
      },
      // 配置项 / 适用范围 的逐条录入草稿
      newConfigKey: '',
      newConfigVal: '',
      newScopeTag: '',
      // 上传解析模板：上传 → 智能解析 → 确认入库（对齐政策标准库范式）
      showParseDialog: false,
      parseStep: 0,
      parseFile: null,
      isParseDragOver: false,
      parseTasks: [],
      parsedTemplate: null
    }
  },
  computed: {
    scopeOptions() {
      return [...new Set(this.templates.map(t => t.scope))]
    },
    // 场景 / 状态 / 搜索 预筛后的集合（类型分页签的数量徽标以此口径统计）
    scopeFilteredTemplates() {
      return this.templates.filter(t => {
        if (this.searchText && !t.name.includes(this.searchText)) return false
        if (this.filterScope && t.scope !== this.filterScope) return false
        if (this.filterStatus && t.status !== this.filterStatus) return false
        return true
      })
    },
    // 类型分页签：一级导航（按资产性质分类），徽标显示各类数量
    typeTabs() {
      const base = this.scopeFilteredTemplates
      const map = {}
      base.forEach(t => { map[t.type] = (map[t.type] || 0) + 1 })
      const order = ['报告模板', '边界模板', '模型模板', '数据模板', '申报模板']
      const keys = Object.keys(map).sort((a, b) => {
        const ia = order.indexOf(a)
        const ib = order.indexOf(b)
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
      })
      return [{ key: '', label: '全部', count: base.length }]
        .concat(keys.map(k => ({ key: k, label: k, count: map[k] })))
    },
    filteredTemplates() {
      // 搜索时跨全部类型，避免"当前分页签下搜不到"的困惑
      const crossType = !!this.searchText
      return this.scopeFilteredTemplates.filter(t => {
        if (!crossType && this.activeType && t.type !== this.activeType) return false
        return true
      })
    },
    pagedTemplates() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.filteredTemplates.slice(start, start + this.pageSize)
    },
    // 公式库中已有的标准编号（口径规则集引用公式库时可选）
    formulaStandards() {
      try {
        const saved = localStorage.getItem('cfp_formula_library')
        const list = saved ? JSON.parse(saved) : []
        return [...new Set(list.map(f => f.appliedStandard).filter(Boolean))]
      } catch (e) { return [] }
    },
    // 详情弹窗：口径规则集解析（引用声明 → 关联公式库统计公式条数）
    detailCaliber() {
      const raw = this.currentTemplate && this.currentTemplate.caliber
      if (!raw) return null
      const c = typeof raw === 'string' ? { name: raw } : raw
      const std = c.formulaStandard || ''
      let count = 0
      if (std) {
        try {
          const saved = localStorage.getItem('cfp_formula_library')
          const list = saved ? JSON.parse(saved) : []
          count = list.filter(f => f.appliedStandard === std && f.status === '启用').length
        } catch (e) { /* ignore */ }
      }
      return { name: c.name || '—', formulaStandard: std, factorVersion: c.factorVersion || '', formulaCount: count }
    },
    // 详情弹窗：填报场景列表；章节结构取当前选中变体（无变体时用模板级 sections）
    detailVariants() {
      const t = this.currentTemplate
      return (t && t.variants) || []
    },
    detailSections() {
      const t = this.currentTemplate
      if (!t) return []
      const vs = this.detailVariants
      if (vs.length) {
        const v = vs.find(x => x.key === this.detailVariantKey) || vs[0]
        return v.sections || []
      }
      return t.sections || []
    },
    // 匹配维度 key → 中文标签（模板未声明 matchFields 时回退为 key 本身）
    matchLabel() {
      const mf = (this.currentTemplate && this.currentTemplate.matchFields) || []
      const map = {}
      mf.forEach(f => { map[f.key] = f.label })
      return map
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    // 数据源统一在 agent-center/data/platformTemplates.js（含智慧报告场景的模板），避免多份副本不一致
    loadData() {
      this.templates = loadPlatformTemplates()
    },
    persist() {
      try { localStorage.setItem('cfp_platform_templates', JSON.stringify(this.templates)) } catch (e) { /* ignore */ }
    },
    typeTagType(type) {
      const map = { '边界模板': '', '模型模板': 'success', '数据模板': 'warning', '报告模板': 'info', '申报模板': 'danger', '全流程模板': 'danger' }
      return map[type] || ''
    },
    // 状态标签色：已发布=成功，待审核=警告，其余=中性
    statusTagType(status) {
      if (status === '已发布') return 'success'
      if (status === '待审核') return 'warning'
      return 'info'
    },
    // 审核通过：待审核 → 已发布（此后对引用方生效，如智慧报告智能体的模板匹配）
    approveTemplate(row) {
      this.$confirm('确认通过模板「' + row.name + '」的审核？通过后将对该模板的引用方（如智慧报告智能体）生效。', '审核确认', { type: 'warning' }).then(() => {
        const idx = this.templates.findIndex(t => t.id === row.id)
        if (idx > -1) {
          this.$set(this.templates, idx, {
            ...this.templates[idx], status: '已发布',
            auditBy: '当前用户', auditTime: new Date().toISOString().slice(0, 10), auditRemark: ''
          })
        }
        this.persist()
        this.$message.success('模板已通过审核并发布')
      }).catch(() => {})
    },
    // 审核驳回：退回草稿（附驳回原因，反馈提交人修改后重新提交）
    rejectTemplate(row) {
      this.$prompt('请填写驳回原因（将反馈给提交人）', '审核驳回', {
        inputPlaceholder: '如：章节结构缺少表26，请补充后重新提交',
        inputValidator: v => !!v || '请填写驳回原因'
      }).then(({ value }) => {
        const idx = this.templates.findIndex(t => t.id === row.id)
        if (idx > -1) {
          this.$set(this.templates, idx, {
            ...this.templates[idx], status: '草稿',
            auditBy: '当前用户', auditTime: new Date().toISOString().slice(0, 10), auditRemark: value || ''
          })
        }
        this.persist()
        this.$message.warning('模板已驳回，退回草稿')
      }).catch(() => {})
    },
    viewDetail(row) {
      this.currentTemplate = row
      this.detailTab = 'info'
      this.detailVariantKey = (row.variants && row.variants[0] && row.variants[0].key) || ''
      this.detailVisible = true
    },
    // 匹配条件文本化（列表展开行展示，如「填报领域=工业」）
    conditionText(conditions) {
      if (!conditions) return '—'
      const labels = { field: '填报领域', industry: '所属行业' }
      return Object.keys(conditions).map(k => (labels[k] || k) + '=' + conditions[k]).join('；')
    },
    // 从展开行直接查看某个变体的章节预览
    viewVariant(row, v) {
      this.currentTemplate = row
      this.detailTab = 'sections'
      this.detailVariantKey = v.key
      this.detailVisible = true
    },
    // ===== 上传解析模板（上传 → 智能解析 → 确认入库）=====
    openParseDialog() {
      this.resetParse()
      this.showParseDialog = true
    },
    resetParse() {
      this.parseStep = 0
      this.parseFile = null
      this.isParseDragOver = false
      this.parseTasks = []
      this.parsedTemplate = null
      if (this.$refs.parseFileInput) this.$refs.parseFileInput.value = ''
    },
    onParseFileChange(e) {
      const file = e.target.files && e.target.files[0]
      if (file) this.parseFile = file
    },
    onParseDrop(e) {
      this.isParseDragOver = false
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
      if (file) this.parseFile = file
    },
    formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    },
    startParseTemplate() {
      if (!this.parseFile) return
      this.parseStep = 1
      this.parseTasks = [
        { label: '版式解析（章节标题 / 表格结构 / 落款）', done: false, running: true, result: '' },
        { label: '章节结构抽取（章节名 + 表头列 + 填报行）', done: false, running: false, result: '' },
        { label: '字段与填报要求识别（单位 / 数据来源 / 说明）', done: false, running: false, result: '' },
        { label: '依据标准与口径规则识别（引用标准 / 公式标准 / 因子版本）', done: false, running: false, result: '' },
        { label: '识别条目信息（模板名称 / 类型 / 适用报告类型）', done: false, running: false, result: '' }
      ]
      this.parsedTemplate = this.mockParseTemplateInfo()
      this.runParseTask(0)
    },
    runParseTask(index) {
      if (index >= this.parseTasks.length) {
        this.parseStep = 2
        return
      }
      setTimeout(() => {
        this.$set(this.parseTasks[index], 'done', true)
        this.$set(this.parseTasks[index], 'running', false)
        const p = this.parsedTemplate || {}
        const colCount = (p.sections || []).reduce((n, s) => n + ((s.columns || []).length), 0)
        const results = [
          '已解析 ' + Math.round(this.parseFile.size / 1024) + 'KB 文档版式',
          p.sections ? '抽取 ' + p.sections.length + ' 个章节' : '未识别到章节结构',
          colCount ? '识别 ' + colCount + ' 个表头字段' : '未识别到表格字段',
          (p.caliber && p.caliber.formulaStandard) ? '引用标准 ' + p.caliber.formulaStandard : '未识别到标准引用',
          p.name || ''
        ]
        this.$set(this.parseTasks[index], 'result', results[index])
        if (this.parseTasks[index + 1]) this.$set(this.parseTasks[index + 1], 'running', true)
        this.runParseTask(index + 1)
      }, 420)
    },
    // 模拟解析（基于文件名与关键词推断；真实实现由后端文档解析服务产出）
    mockParseTemplateInfo() {
      const fileName = this.parseFile.name || ''
      const base = fileName.replace(/\.(docx?|pdf|xlsx)$/i, '')
      const key = (fileName + base).toLowerCase()
      const isNybg = /能源利用状况|用能单位|附件2/.test(key)
      const isPef = /环境足迹|PEF|生命周期评价|LCA/i.test(key)
      const isCarbon = /碳排放|温室气体|核算报告/.test(key)
      const isAudit = /能源审计|审计报告/.test(key)
      const isDisclose = /披露|环境信息/.test(key)
      if (isNybg) {
        return {
          name: '能源利用状况报告模板', docName: '《用能单位能源利用状况报告》（附件2规范）',
          type: '报告模板', scope: '智慧报告', reportType: '能源利用状况报告',
          standard: '附件2 用能单位能源利用状况报告格式',
          caliber: { name: 'GB/T 2589 综合能耗计算通则（当量值折标）', formulaStandard: 'GB/T 2589', factorVersion: '2025年第3号公告版' },
          scopes: ['重点用能单位', '年度能源利用状况报告'],
          configItems: [
            { key: '填报场景', value: '6 类：工业 / 交通运输、仓储和邮政业 / 住宿和餐饮业 / 批发和零售业 / 教育业 / 其他非工业' },
            { key: '报表数量', value: '随场景路由：工业 11 张（表1~8 + 表26~28）、交通 8 张（表9~13 + 表26~28）、其余各 6 张' },
            { key: '口径规则集', value: 'GB/T 2589 综合能耗计算通则（当量值折标）' }
          ],
          sections: [
            { no: '表1~8', name: '工业专属表格（8 张）', purpose: '工业基本情况 / 能源消费结构 / 加工转换附表 / 单位产品综合能耗 / 数据中心能效 / 节能目标进度 / 节能改造项目', source: '企业档案 + 基础计量 + 生产统计', columns: ['指标名称', '计量单位', '本期值', '上年值', '同比变化率（%）'], rows: ['表1 工业基本情况表', '表2 工业能源消费结构表', '表3 工业能源消费结构附表', '表4 工业单位产品综合能耗情况表', '表5 其他单位产品综合能耗情况表', '表6 数据中心能源利用效率情况表', '表7 工业节能目标进度完成情况表', '表8 工业节能改造项目情况表'] },
            { no: '表9~13', name: '交通运输、仓储和邮政业专属表格（5 张）', purpose: '行业基本情况 / 能源消费结构 / 单位运输周转量能耗 / 节能目标进度 / 节能改造项目', source: '企业档案 + 运输台账 + 基础计量', columns: ['指标名称', '计量单位', '本期值', '上年同期值', '同比变化率（%）'], rows: ['表9 行业基本情况表', '表10 行业能源消费结构表', '表11 单位运输周转量（吞吐量）能耗指标情况表', '表12 节能目标进度目标完成情况表', '表13 节能改造项目情况表'] },
            { no: '表14~16', name: '住宿和餐饮业专属表格（3 张）', purpose: '行业基本情况 / 能源消费结构 / 节能改造项目', source: '企业档案 + 基础计量 + 专项台账', columns: ['指标名称', '计量单位', '本期值', '上年同期值', '同比变化率（%）'], rows: ['表14 行业基本情况表', '表15 行业能源消费结构表', '表16 行业节能改造项目情况表'] },
            { no: '表17~19', name: '批发和零售业专属表格（3 张）', purpose: '行业基本情况 / 能源消费结构 / 节能改造项目', source: '企业档案 + 基础计量 + 专项台账', columns: ['指标名称', '计量单位', '本期值', '上年同期值', '同比变化率（%）'], rows: ['表17 行业基本情况表', '表18 行业能源消费结构表', '表19 行业节能改造项目情况表'] },
            { no: '表20~22', name: '教育业专属表格（3 张）', purpose: '行业基本情况 / 能源消费结构 / 节能改造项目', source: '企业档案 + 基础计量 + 专项台账', columns: ['指标名称', '计量单位', '本期值', '上年同期值', '同比变化率（%）'], rows: ['表20 行业基本情况表', '表21 行业能源消费结构表', '表22 行业节能改造项目情况表'] },
            { no: '表23~25', name: '其他非工业专属表格（3 张）', purpose: '行业基本情况 / 能源消费结构（含用能载体补充资料）/ 节能改造项目（含碳减排效果）', source: '企业档案 + 基础计量 + 专项台账', columns: ['指标名称', '计量单位', '本期值', '上年同期值', '同比变化率（%）'], rows: ['表23 其他非工业基本情况表', '表24 其他非工业能源消费结构表', '表25 其他非工业节能改造项目情况表'] },
            { no: '表26~28', name: '通用表格（3 张，各场景均含）', purpose: '碳排放情况 / 新能源及可再生能源利用 / 节能工作落实情况自查', source: '能源消费量 × 排放因子 + 专项台账 + 人工自查', columns: ['项目', '数值（吨二氧化碳）'], rows: ['表26 碳排放情况表（能源活动产生）', '表27 新能源及可再生能源利用情况表', '表28 重点用能单位节能工作落实情况自查表（16 条）'] }
          ]
        }
      }
      if (isPef) {
        return {
          name: '产品环境足迹报告模板', docName: '《产品环境足迹（PEF）核算报告》模板',
          type: '报告模板', scope: '产品环境足迹', reportType: 'PEF 环境足迹声明',
          standard: 'EU PEF 2021/2279（欧盟产品环境足迹方法论）',
          caliber: { name: 'EU PEF 2021/2279（16 类中点指标）', formulaStandard: 'EU PEF 2021/2279', factorVersion: 'EF 3.1' },
          scopes: ['出口欧盟产品', '产品环境足迹声明（EPD）', '多品类产品生命周期评价'],
          configItems: [
            { key: '影响类别', value: '16 类中点指标（可勾选，默认 5 类核心）' },
            { key: '主指标', value: '气候变化（GWP100）' },
            { key: '功能单位', value: '声明单位 / 功能单位（按产品确定）' },
            { key: '背景数据集', value: 'EF 3.1（强制）/ Ecoinvent / ELCD' }
          ],
          sections: [
            { name: '一、评估目的与功能单位声明', purpose: '声明评估目的、功能单位/声明单位与产品信息', source: '企业主数据 + 产品台账', columns: ['项目', '内容'] },
            { name: '二、系统边界与范围界定', purpose: '生命周期范围、量化边界、分配与取舍规则、时间与地理边界', source: '阶段2 边界配置', columns: ['项目', '设定'] },
            { name: '三、全生命周期清单分析', purpose: '各阶段活动数据与因子引用，形成清单表', source: '活动数据 + 排放因子库', columns: ['阶段', '单元过程', '活动数据', '因子', '影响量'] },
            { name: '四、多类别环境影响结果矩阵', purpose: '16 类中点指标 × 生命周期阶段的完整结果', source: '核算引擎', columns: ['影响类别', '各阶段', '合计', '单位'] },
            { name: '五、不确定性评价与数据质量', purpose: 'DQR 评分、蒙特卡洛模拟结果与置信区间', source: '阶段8 不确定性分析', columns: ['指标', '结果'] },
            { name: '六、结论与改进建议', purpose: '关键热点识别与改进方向', source: '阶段8 敏感性分析', columns: ['热点', '建议'] }
          ]
        }
      }
      if (isCarbon) {
        return {
          name: '碳排放报告模板', docName: '《企业碳排放核算报告》模板',
          type: '报告模板', scope: '智慧报告', reportType: '碳排放报告',
          standard: '企业温室气体排放报告管理办法（主管部门报送要求）',
          caliber: { name: '2025年第3号公告版（生态环境部）', formulaStandard: 'GB/T 32150', factorVersion: '2025年第3号公告版' },
          scopes: ['工业制造企业', '组织层面碳排放核算'],
          configItems: [{ key: '报告章节', value: '4 章（范围1/2/3 + 数据来源与说明）' }],
          sections: [
            { name: '范围1 直接排放', purpose: '固定燃烧、移动燃烧与逸散排放', source: '能源消费量 × 排放因子', columns: ['排放源', '活动数据', '排放因子', '排放量（tCO₂e）'], rows: ['固定燃烧', '移动燃烧', '逸散排放'] },
            { name: '范围2 间接排放', purpose: '外购电力、热力产生的间接排放', source: '购电量 × 区域电网因子', columns: ['能源类型', '消耗量', '电网因子', '排放量（tCO₂e）'], rows: ['外购电力', '外购热力'] }
          ]
        }
      }
      if (isAudit) {
        return {
          name: '能源审计报告模板', docName: '《企业能源审计报告》模板',
          type: '报告模板', scope: '智慧报告', reportType: '能源审计报告',
          standard: '',
          caliber: { name: 'GB/T 17166 企业能源审计技术通则', formulaStandard: 'GB/T 17166', factorVersion: '—' },
          scopes: ['重点用能单位', '年度能源审计'],
          configItems: [{ key: '报告章节', value: '4 章（管理概况/消费分析/能效对标/措施建议）' }],
          sections: [
            { name: '企业能源管理概况', purpose: '用能单位基本情况与能源管理体系', source: '企业档案带出', columns: ['项目', '内容'], rows: ['单位基本情况', '能源管理机构与人员'] },
            { name: '能源消费分析', purpose: '分品种、分系统能源消费与结构分析', source: '能源统计数据', columns: ['能源品种', '消费量', '折标量（tce）', '占比'], rows: ['电力', '天然气', '柴油'] }
          ]
        }
      }
      if (isDisclose) {
        return {
          name: '合规披露文件模板', docName: '《环境信息合规披露文件》模板',
          type: '报告模板', scope: '智慧报告', reportType: '合规披露文件',
          standard: '企业环境信息依法披露管理办法',
          caliber: { name: '生态环境部环境信息披露规范', formulaStandard: '', factorVersion: '—' },
          scopes: ['重点排污单位', '环境信息披露'],
          configItems: [{ key: '报告章节', value: '4 章（主体边界/环境信息/碳排放信息/合规改进）' }],
          sections: [
            { name: '披露主体与边界', purpose: '披露主体标识与报告边界', source: '企业档案带出', columns: ['项目', '内容'], rows: ['单位名称', '报告边界', '报告期间'] },
            { name: '环境信息', purpose: '污染物排放与资源消耗', source: '环境统计台账', columns: ['指标', '单位', '本期值', '上年值'], rows: ['废气排放', '废水排放', '固废产生'] }
          ]
        }
      }
      // 未识别到已知模板类型：给出通用骨架，由用户在确认步骤补全
      return {
        name: base || '新建模板', docName: '', type: '报告模板', scope: '智慧报告', reportType: '',
        standard: '', caliber: null, scopes: [], configItems: [],
        sections: [{ name: '章节 1', purpose: '（解析未识别到明确章节，请在此补充）', source: '', columns: [], rows: [], note: '' }]
      }
    },
    // 解析结果预填到编辑表单（确认步骤复用同一套字段，避免两处维护）
    confirmParseToForm() {
      const p = this.parsedTemplate || {}
      this.editMode = false
      this.editForm = {
        id: '', name: p.name || '', type: p.type || '报告模板', scope: p.scope || '智慧报告',
        standard: p.standard || '', caliber: p.caliber || null,
        caliberName: p.caliber ? p.caliber.name : '',
        caliberFormulaStandard: p.caliber ? p.caliber.formulaStandard : '',
        caliberFactorVersion: p.caliber ? p.caliber.factorVersion : '',
        docName: p.docName || '', reportType: p.reportType || '',
        scopes: p.scopes ? p.scopes.slice() : [],
        configItems: p.configItems ? JSON.parse(JSON.stringify(p.configItems)) : [],
        sectionsJson: p.sections ? JSON.stringify(p.sections, null, 2) : '',
        version: 'v1.0', status: '待审核',
        description: '由「' + (this.parseFile ? this.parseFile.name : '上传文件') + '」解析生成，请核对后提交审核'
      }
      this.newConfigKey = ''
      this.newConfigVal = ''
      this.newScopeTag = ''
      this.showParseDialog = false
      this.editVisible = true
    },
    editTemplate(row) {
      this.editMode = true
      // 深拷贝：避免配置项 / 适用范围等数组被直接改动而污染列表数据
      this.editForm = JSON.parse(JSON.stringify(row))
      if (!this.editForm.scopes) this.editForm.scopes = []
      if (!this.editForm.configItems) this.editForm.configItems = []
      this.editForm.sectionsJson = this.editForm.sections ? JSON.stringify(this.editForm.sections, null, 2) : ''
      // 口径规则集（引用声明）拆解为表单字段
      const c = typeof this.editForm.caliber === 'string' ? { name: this.editForm.caliber } : (this.editForm.caliber || {})
      this.editForm.caliberName = c.name || ''
      this.editForm.caliberFormulaStandard = c.formulaStandard || ''
      this.editForm.caliberFactorVersion = c.factorVersion || ''
      this.newConfigKey = ''
      this.newConfigVal = ''
      this.newScopeTag = ''
      this.editVisible = true
    },
    // 业务适用范围：回车添加标签
    addScopeTag() {
      const v = (this.newScopeTag || '').trim()
      if (!v) return
      if (!this.editForm.scopes.includes(v)) this.editForm.scopes.push(v)
      this.newScopeTag = ''
    },
    // 模板配置项：新增一条 key-value
    addConfigItem() {
      const k = (this.newConfigKey || '').trim()
      if (!k) { this.$message.warning('请填写配置项名称'); return }
      this.editForm.configItems.push({ key: k, value: (this.newConfigVal || '').trim() })
      this.newConfigKey = ''
      this.newConfigVal = ''
    },
    saveTemplate() {
      if (!this.editForm.name || !this.editForm.type || !this.editForm.scope) {
        this.$message.warning('请填写必填项')
        return
      }
      // 章节结构 JSON 校验与回写（sections 为模板内容的唯一来源）
      let sections = []
      const sj = (this.editForm.sectionsJson || '').trim()
      if (sj) {
        try {
          const parsed = JSON.parse(sj)
          sections = Array.isArray(parsed) ? parsed : (parsed.sections || [])
        } catch (e) {
          this.$message.error('章节结构 JSON 格式有误，请检查后重试')
          return
        }
      }
      const payload = { ...this.editForm, sections }
      delete payload.sectionsJson
      // 口径规则集：组装为引用声明（公式标准 → 公式库；因子版本 → 因子库版本锁定）
      const caliber = {
        name: (payload.caliberName || '').trim(),
        formulaStandard: (payload.caliberFormulaStandard || '').trim(),
        factorVersion: (payload.caliberFactorVersion || '').trim()
      }
      payload.caliber = (caliber.name || caliber.formulaStandard) ? caliber : null
      delete payload.caliberName
      delete payload.caliberFormulaStandard
      delete payload.caliberFactorVersion
      if (this.editMode) {
        const idx = this.templates.findIndex(t => t.id === this.editForm.id)
        if (idx > -1) {
          payload.updateTime = new Date().toISOString().slice(0, 10)
          // 合并而非整体替换：保留未在表单中编辑的扩展字段（variants / matchFields 等）
          this.$set(this.templates, idx, { ...this.templates[idx], ...payload })
        }
      } else {
        const maxId = this.templates.reduce((max, t) => {
          const num = parseInt(t.id.replace('PT-', ''))
          return num > max ? num : max
        }, 0)
        this.templates.push({
          ...payload,
          id: 'PT-' + String(maxId + 1).padStart(3, '0'),
          updateTime: new Date().toISOString().slice(0, 10)
        })
      }
      this.persist()
      this.editVisible = false
      this.$message.success(this.editMode ? '模板已更新' : '模板已新增')
    },
    deleteTemplate(row) {
      // 引用影响提示：报告类模板会被在途任务锁定引用，删除后相关任务的模板依据将失效
      const isReportTpl = row.scope === '智慧报告' || row.type === '报告模板'
      const tip = isReportTpl
        ? '确认删除模板"' + row.name + '"？该模板可能被在途任务锁定引用，删除后相关任务的模板依据将失效。'
        : '确认删除模板"' + row.name + '"？'
      this.$confirm(tip, '删除确认', { type: 'warning' }).then(() => {
        this.templates = this.templates.filter(t => t.id !== row.id)
        this.persist()
        this.$message.success('模板已删除')
      }).catch(() => {})
    },
    // 切换类型分页签（重置分页，避免停留在越界页）
    switchType(key) {
      this.activeType = key
      this.currentPage = 1
    },
    handleSizeChange(val) { this.pageSize = val; this.currentPage = 1 },
    handlePageChange(val) { this.currentPage = val }
  }
}
</script>

<style scoped>
/* 模板类型分页签（一级导航：按资产性质分类，徽标显示各类数量） */
.type-tabs { display: flex; gap: 6px; padding: 0 16px 10px; flex-wrap: wrap; }
.type-tab { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 8px; border: 1px solid #e4e7ed; background: #fff; cursor: pointer; font-size: 13px; color: #606266; transition: all .15s; user-select: none; }
.type-tab:hover { border-color: #0067FE; color: #0067FE; }
.type-tab.active { background: #0067FE; border-color: #0067FE; color: #fff; font-weight: 600; }
.type-tab-count { font-size: 11px; padding: 0 6px; border-radius: 8px; background: rgba(0, 0, 0, 0.06); }
.type-tab.active .type-tab-count { background: rgba(255, 255, 255, 0.25); }
.toolbar-hint { font-size: 12px; color: #909399; margin-left: 10px; }

/* 编辑表单：字段说明 */
.form-hint { font-size: 11px; color: #909399; line-height: 1.5; margin-top: 2px; }
/* 上传解析模板：步骤条 / 上传区 / 解析任务 / 解析结果摘要 */
.tpl-steps { display: flex; align-items: center; padding: 4px 0 18px; }
.tpl-step { display: flex; flex-direction: column; align-items: center; gap: 5px; }
.tpl-step-dot { width: 26px; height: 26px; border-radius: 50%; border: 2px solid #dcdfe6; background: #fff; color: #909399; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; }
.tpl-step span { font-size: 12px; color: #909399; }
.tpl-step.step-active .tpl-step-dot { border-color: #0067FE; background: #0067FE; color: #fff; }
.tpl-step.step-active span { color: #0067FE; font-weight: 600; }
.tpl-step.step-done .tpl-step-dot { border-color: #0067FE; color: #0067FE; }
.tpl-step-line { flex: 1; height: 2px; background: #ebeef5; margin: 0 10px 20px; }
.tpl-agent-tip { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: #606266; background: #ecf5ff; border-radius: 8px; padding: 10px 12px; line-height: 1.6; margin-bottom: 14px; }
.tpl-agent-tip i { color: #0067FE; margin-top: 2px; }
.tpl-agent-tip.success { background: #f0f9eb; color: #529b2e; }
.tpl-agent-tip.success i { color: #67C23A; }
.tpl-drop-zone { border: 1px dashed #dcdfe6; border-radius: 8px; padding: 28px 16px; text-align: center; cursor: pointer; transition: all .2s; }
.tpl-drop-zone:hover, .tpl-drop-zone.drop-active { border-color: #0067FE; background: #f5f9ff; }
.tpl-drop-zone i { font-size: 34px; color: #c0c4cc; }
.tpl-drop-text { font-size: 13px; color: #606266; margin-top: 8px; }
.tpl-drop-text em { color: #0067FE; font-style: normal; }
.tpl-drop-hint { font-size: 11px; color: #909399; margin-top: 6px; }
.tpl-file-card { display: flex; align-items: center; gap: 10px; border: 1px solid #ebeef5; border-radius: 8px; padding: 10px 12px; margin-top: 12px; }
.tpl-file-icon { font-size: 22px; color: #0067FE; }
.tpl-file-info { flex: 1; min-width: 0; }
.tpl-file-name { font-size: 12px; color: #303133; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tpl-file-size { font-size: 11px; color: #909399; }
.tpl-file-remove { cursor: pointer; color: #909399; }
.tpl-file-remove:hover { color: #F56C6C; }
.tpl-parsing-zone { display: flex; flex-direction: column; gap: 10px; padding: 6px 0; }
.tpl-parse-task { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #909399; }
.tpl-parse-task.task-running { color: #0067FE; }
.tpl-parse-task.task-done { color: #303133; }
.tpl-parse-task.task-done i { color: #67C23A; }
.tpl-parse-task .task-result { margin-left: auto; font-size: 11px; color: #909399; }
.tpl-parsed-summary { border: 1px solid #ebeef5; border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
.tpl-parsed-row { display: flex; gap: 10px; font-size: 12px; }
.tpl-parsed-row span { flex-shrink: 0; width: 80px; color: #909399; }
.tpl-parsed-row b { color: #303133; font-weight: 600; }

/* 口径规则集编辑器（引用声明） */
.caliber-editor { display: flex; flex-direction: column; gap: 6px; }
.caliber-row { display: flex; align-items: center; gap: 8px; }
.caliber-label { flex-shrink: 0; font-size: 12px; color: #909399; }
/* 业务适用范围标签编辑器 */
.tag-editor { display: flex; flex-wrap: wrap; align-items: center; }
/* 列表展开行：填报场景 / 配置项（一二级联动） */
.var-panel { padding: 8px 16px 12px 48px; background: #fafbfc; }
.var-panel-title { font-size: 12px; font-weight: 600; color: #303133; margin-bottom: 8px; }
.var-panel-empty { color: #909399; font-size: 12px; }
.var-row { display: grid; grid-template-columns: 140px 1fr 80px 220px 90px; gap: 8px; align-items: center; font-size: 12px; color: #606266; padding: 5px 0; border-bottom: 1px dashed #ebeef5; }
.var-row:last-child { border-bottom: none; }
.var-row-head { color: #909399; font-size: 11px; font-weight: 600; }
.var-label { font-weight: 600; color: #303133; }
.var-suite { color: #606266; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.var-count { color: #909399; }
.var-cond { color: #E6A23C; }
.cfg-row { display: flex; gap: 10px; font-size: 12px; padding: 4px 0; }
.cfg-key { flex-shrink: 0; width: 120px; color: #909399; }
.cfg-val { color: #303133; }
/* 详情：配置明细（非报告类模板） */
.cfg-detail { display: flex; flex-direction: column; gap: 10px; padding: 4px 0; }
.cfg-detail-row { display: flex; gap: 12px; font-size: 13px; line-height: 1.6; }
.cfg-detail-key { flex-shrink: 0; width: 130px; color: #909399; }
.cfg-detail-val { flex: 1; min-width: 0; color: #303133; }
.cfg-detail-empty { text-align: center; color: #909399; font-size: 13px; padding: 40px 0; }
.detail-hint { font-size: 11px; color: #909399; margin-left: 4px; }
/* 模板详情弹窗：填报场景概览（Tab1）+ 按场景分块展示章节（Tab2） */
.tpl-scene-table { margin-top: 8px; }
.tpl-cond { display: inline-block; font-size: 11px; color: #606266; background: #f5f7fa; border-radius: 4px; padding: 1px 6px; margin: 0 6px 2px 0; }
.tpl-scene-hint { font-size: 11.5px; color: #909399; line-height: 1.6; margin-bottom: 10px; }
.tpl-scene-collapse { border-top: none; }
.tpl-scene-name { flex-shrink: 0; font-size: 13px; font-weight: 600; color: #303133; margin-right: 12px; }
.tpl-scene-suite { font-size: 11px; color: #909399; margin-right: 10px; max-width: 420px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* 模板配置项编辑器 */
.config-editor { display: flex; flex-direction: column; gap: 6px; }
.config-edit-row { display: flex; align-items: center; gap: 8px; }

.platform-template-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0 16px;
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}
.page-title i { color: var(--primary); }
.page-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin: 4px 0 0;
}
.stats-row {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  flex-shrink: 0;
}
.stat-card {
  flex: 1;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.stat-content {
  flex: 1;
}
.stat-num {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}
.stat-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0 12px;
  flex-shrink: 0;
}
.btn-danger {
  color: var(--danger) !important;
}
/* 表格区 */
.table-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-card);
}
.table-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}
.table-title-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
}
.table-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 4px 4px 0 4px;
}
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-muted);
}
.empty-state i { font-size: 48px; margin-bottom: 12px; color: var(--text-placeholder); }
.empty-state p { font-size: 14px; margin: 0 0 4px; }
.empty-state span { font-size: 12px; }
.detail-content {
  padding: 0 20px 20px;
}
.detail-config {
  margin-top: 16px;
}
.config-title {
  padding: 8px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 4px;
  border-bottom: 1px solid var(--border-light);
  margin-bottom: 8px;
}
.config-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.config-row {
  display: flex;
  gap: 8px;
  font-size: 12px;
  padding: 6px 10px;
  background: var(--bg-hover, #f5f7fa);
  border-radius: 4px;
}
.config-key {
  color: var(--text-muted);
  white-space: nowrap;
  min-width: 80px;
}
.config-val {
  color: var(--text-primary);
}
</style>

<!-- 详情弹窗经 append-to-body 挂载到 body 下，样式需脱离 scoped 才能命中；
     固定高度：切换 Tab / 展开折叠场景时弹窗尺寸不变，超长内容在弹窗体内滚动 -->
<style>
.tpl-detail-dialog { height: 82vh; display: flex; flex-direction: column; }
.tpl-detail-dialog .el-dialog__header { flex-shrink: 0; }
.tpl-detail-dialog .el-dialog__body { flex: 1; overflow-y: auto; padding: 16px 20px; }
</style>
