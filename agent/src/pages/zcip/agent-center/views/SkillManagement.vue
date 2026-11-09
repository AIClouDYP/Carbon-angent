<template>
  <div class="skill-management-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title"><i class="el-icon-magic-stick"></i> Skill 管理</h2>
        <p class="page-desc">智能体 Prompt 模板维护，仅支持调整引导语与输出格式，核心规则由开发管控</p>
      </div>
    </div>



    <!-- Skill 列表 -->
    <div class="table-wrapper">
      <div class="table-title-bar">
        <span class="table-title-text">Skill 列表</span>
      </div>
      <div class="table-scroll">
    <el-table :data="pagedSkills" border stripe size="small" style="width: 100%;" :header-cell-style="headerCellStyle">
      <el-table-column label="Skill 名称" prop="name" width="180">
        <template slot-scope="{ row }">
          <div class="skill-name">
            <i :class="row.icon" :style="{ color: row.color }"></i>
            <span>{{ row.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="触发阶段" prop="phase" width="120" align="center">
        <template slot-scope="{ row }">
          <el-tag size="mini" :type="phaseTagType(row.phase)">{{ row.phase }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="功能描述" prop="desc" min-width="220" show-overflow-tooltip></el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template slot-scope="{ row }">
          <el-tag size="mini" :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '已启用' : '已禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="模板状态" width="100" align="center">
        <template slot-scope="{ row }">
          <el-tag v-if="row.modified" size="mini" type="warning" effect="plain">已修改</el-tag>
          <el-tag v-else size="mini" type="info" effect="plain">默认</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="210" align="center" fixed="right">
        <template slot-scope="{ row }">
          <el-button type="text" size="mini" @click="editPrompt(row)">编辑模板</el-button>
          <el-button v-if="row.id === 'factor-matching'" type="text" size="mini" style="color:#E6A23C;" @click="openRuleConfig(row)">规则配置</el-button>
          <el-button v-if="row.modified" type="text" size="mini" @click="resetPrompt(row)">恢复默认</el-button>
        </template>
      </el-table-column>
    </el-table>
      </div>
      <div class="pagination-bar" v-if="skills.length > 0">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="skills.length" :page-sizes="[10, 20, 50]" :page-size="pageSize" :current-page="currentPage" @size-change="handleSizeChange" @current-change="handlePageChange"></el-pagination>
      </div>
    </div>

    <!-- Prompt 模板编辑对话框 -->
    <el-dialog
      :title="`编辑 Prompt 模板 — ${editingSkill ? editingSkill.name : ''}`"
      :visible.sync="showEditDialog"
      width="720px"
      :close-on-click-modal="false"
    >
      <div v-if="editingSkill" class="prompt-edit-area">
        <div class="prompt-meta">
          <div class="meta-item">
            <span class="meta-label">Skill ID</span>
            <span class="meta-value code-font">{{ editingSkill.id }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">触发阶段</span>
            <el-tag size="mini" :type="phaseTagType(editingSkill.phase)">{{ editingSkill.phase }}</el-tag>
          </div>
          <div class="meta-item">
            <span class="meta-label">关联知识库</span>
            <span class="meta-value">{{ editingSkill.knowledgeBase || '—' }}</span>
          </div>
        </div>

        <el-alert type="info" :closable="false" style="margin-bottom: 16px;">
          <template slot="title">
            <i class="el-icon-info"></i>
            仅可编辑 Prompt 模板文本，变量使用 <code v-pre>{{variableName}}</code> 格式，核心规则逻辑不可修改
          </template>
        </el-alert>

        <div class="prompt-editor">
          <div class="editor-label">
            <span>Prompt 模板</span>
            <div class="editor-actions">
              <el-button size="mini" @click="insertVariable">插入变量</el-button>
              <el-button size="mini" @click="previewPrompt">预览效果</el-button>
            </div>
          </div>
          <el-input
            type="textarea"
            :rows="16"
            v-model="editingSkill.promptTemplate"
            placeholder="请输入 Prompt 模板..."
            class="prompt-textarea"
          ></el-input>
          <div class="editor-hint">
            字符数：{{ editingSkill.promptTemplate.length }} | 变量：{{ extractVariables(editingSkill.promptTemplate).join(', ') || '无' }}
          </div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="savePrompt">保存模板</el-button>
      </span>
    </el-dialog>

    <!-- 变量插入对话框 -->
    <el-dialog title="插入变量" :visible.sync="showVariableDialog" width="480px" append-to-body>
      <div class="variable-list">
        <div v-for="v in availableVariables" :key="v.name" class="variable-item" @click="doInsertVariable(v)">
          <div class="variable-name code-font">{{ v.name }}</div>
          <div class="variable-desc">{{ v.desc }}</div>
        </div>
      </div>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog title="Prompt 预览（含变量替换示例）" :visible.sync="showPreviewDialog" width="640px" append-to-body>
      <div class="prompt-preview" v-html="previewContent"></div>
    </el-dialog>

    <!-- 因子匹配规则配置对话框 -->
    <el-dialog title="因子匹配规则配置" :visible.sync="showRuleDialog" width="1200px" top="5vh" :close-on-click-modal="false">
      <el-alert type="info" :closable="false" style="margin-bottom:12px;">
        <template slot="title">
          <i class="el-icon-info"></i>
          维护物料匹配规则（关键词 → 因子）。新增物料、调整因子映射均无需改代码，保存后即时生效。
          优先级越小越先匹配；关键词为正则表达式（如「铝|铸铝」）；电力规则含场景覆盖（地域敏感高级字段由开发管控，不在本界面展示）。
        </template>
      </el-alert>
      <div class="rule-toolbar">
        <el-button size="mini" type="primary" icon="el-icon-plus" @click="addRule">新增规则</el-button>
        <el-button size="mini" icon="el-icon-refresh" @click="resetRules">恢复默认</el-button>
        <span class="rule-tip">规则总数：{{ ruleList.length }} 条</span>
      </div>
      <div class="rule-table-scroll">
        <el-table :data="ruleList" border size="small" style="width:100%;">
          <el-table-column label="优先级" width="80" align="center">
            <template slot-scope="{ row }">
              <el-input-number v-model="row.priority" :min="1" size="mini" controls-position="right" style="width:80px;"></el-input-number>
            </template>
          </el-table-column>
          <el-table-column label="规则名称" width="150">
            <template slot-scope="{ row }"><el-input v-model="row.name" size="mini" placeholder="如：铝/铸铝"></el-input></template>
          </el-table-column>
          <el-table-column label="关键词(正则)" width="130">
            <template slot-scope="{ row }"><el-input v-model="row.pattern" size="mini" placeholder="如：铝|铸铝"></el-input></template>
          </el-table-column>
          <el-table-column label="因子ID" width="130">
            <template slot-scope="{ row }"><el-input v-model="row.factorId" size="mini" placeholder="如：CPCD-MA-003"></el-input></template>
          </el-table-column>
          <el-table-column label="因子名称" width="150">
            <template slot-scope="{ row }"><el-input v-model="row.factorName" size="mini"></el-input></template>
          </el-table-column>
          <el-table-column label="因子值" width="90">
            <template slot-scope="{ row }"><el-input v-model="row.factorValue" size="mini"></el-input></template>
          </el-table-column>
          <el-table-column label="单位" width="110">
            <template slot-scope="{ row }"><el-input v-model="row.factorUnit" size="mini" placeholder="kgCO₂e/kg"></el-input></template>
          </el-table-column>
          <el-table-column label="来源库" width="130">
            <template slot-scope="{ row }"><el-input v-model="row.dbName" size="mini"></el-input></template>
          </el-table-column>
          <el-table-column label="置信度" width="90" align="center">
            <template slot-scope="{ row }">
              <el-input-number v-model="row.confidence" :min="0" :max="1" :step="0.01" :precision="2" size="mini" controls-position="right" style="width:90px;"></el-input-number>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="60" align="center" fixed="right">
            <template slot-scope="{ row }">
              <el-button type="text" size="mini" style="color:#f56c6c;" @click="removeRule(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <span slot="footer">
        <el-button @click="showRuleDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRules">保存规则</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { loadMatchingRules, saveMatchingRules, resetMatchingRules } from '@/utils/factorMatchingService'

export default {
  name: 'SkillManagement',
  data() {
    return {
      showEditDialog: false,
      showVariableDialog: false,
      showPreviewDialog: false,
      showRuleDialog: false,
      ruleList: [],
      editingSkill: null,
      originalTemplate: '',
      previewContent: '',
      currentPage: 1,
      pageSize: 10,
      availableVariables: [
        { name: 'standardCode', desc: '核算标准代码' },
        { name: 'standardName', desc: '核算标准名称' },
        { name: 'boundaryConfig', desc: '边界配置参数' },
        { name: 'activityData', desc: '活动数据列表' },
        { name: 'factorPriority', desc: '因子优先级' },
        { name: 'emissionResult', desc: '排放计算结果' },
        { name: 'productName', desc: '产品名称' },
        { name: 'phaseName', desc: '当前阶段名称' }
      ],
      skills: [
        {
          id: 'standard-parsing',
          name: '标准解析',
          phase: '阶段一',
          icon: 'el-icon-reading',
          color: '#0067FE',
          desc: '解析标准文档，提取核算边界、模型配置、校验规则，生成标准配置包',
          enabled: true,
          modified: false,
          knowledgeBase: '政策标准库',
          promptTemplate: '你是一位碳核算标准解析专家。请解析上传的标准文档，提取以下关键信息：\n\n1. 核算边界要求（生命周期范围、量化单位）\n2. 分配规则与取舍阈值\n3. 数据质量要求\n4. 报告格式要求\n\n请以 JSON 格式输出，字段包括：boundaryTemplate、modelConfig、validationRules、reportTemplate。'
        },
        {
          id: 'boundary-config',
          name: '边界配置',
          phase: '阶段二',
          icon: 'el-icon-set-up',
          color: '#0067fe',
          desc: '引导用户完成核算边界 5 步配置（生命周期/量化单位/分配规则/取舍规则/时间边界）',
          enabled: true,
          modified: false,
          knowledgeBase: '政策标准库',
          promptTemplate: '你是一位碳核算边界配置向导。当前处于【阶段二：核算边界】。\n\n请根据用户选择的标准 {{standardCode}}，引导完成 5 步边界配置：\n1. 生命周期范围确认\n2. 量化单位选择\n3. 分配规则确认\n4. 取舍规则确认\n5. 时间边界确认\n\n每步提供 2-3 个推荐选项，用户确认后进入下一步。'
        },
        {
          id: 'process-modeling',
          name: '工艺建模',
          phase: '阶段三',
          icon: 'el-icon-s-grid',
          color: '#ED7B2F',
          desc: '根据工艺物料平衡表/BOM 构建单元过程拓扑模型',
          enabled: true,
          modified: false,
          knowledgeBase: '—',
          promptTemplate: '你是一位工艺建模专家。请解析用户上传的工艺物料平衡表，构建单元过程拓扑模型。\n\n要求：\n1. 识别各生命周期阶段的单元过程\n2. 梳理输入流（原材料/能源/资源）和输出流（产品/副产品/废弃物）\n3. 建立过程间的拓扑关系\n\n输出格式：JSON 格式的单元过程列表，包含 name、stage、inputs、outputs。'
        },
        {
          id: 'data-collection',
          name: '数据采集',
          phase: '阶段四',
          icon: 'el-icon-s-data',
          color: '#722ED1',
          desc: '多源并发采集活动数据，支持 ERP/数据库/文档解析，自动降级',
          enabled: true,
          modified: false,
          knowledgeBase: '—',
          promptTemplate: '你是一位数据采集协调员。请根据模型数据清单 {{dataRequirements}}，制定数据采集计划。\n\n数据源优先级：\n1. ERP/PDM 系统（实时对接）\n2. 行业数据库（电池/材料库）\n3. 文档解析（EPD/台账）\n4. 用户手动上传（降级方案）\n\n输出采集任务列表，标注每个数据项的来源、状态和缺失项。'
        },
        {
          id: 'factor-annotation',
          name: '因子标注',
          phase: '独立能力',
          icon: 'el-icon-magic-stick',
          color: '#00A8A0',
          desc: '为排放因子智能标注活动标识（activityId，精确匹配键）与匹配关键词（tags，模糊命中层）：标识优先复用库内已有保障跨库对齐，关键词按词表命中+同活动复用生成',
          enabled: true,
          modified: false,
          knowledgeBase: '排放因子库',
          promptTemplate: '你是排放因子标注专家。请根据因子名称 {{factorName}}、类别 {{category}}、适用地区 {{region}}，完成两项标注：\n\n一、活动标识 activityId（精确匹配键）：\n1. 检索排放因子库全部已有 activityId，若存在同活动因子（同活动语义），优先复用其标识，保障跨库对齐\n2. 无匹配时按命名规范生成：大类_活动[_限定]，如 electricity_grid-average_east-china\n3. 地区后缀用英文：全国cn / 华东east-china / 华北north-china / 南方south-china / 东北north-east-china / 华中central-china / 西北north-west-china / 西南south-west-china / 欧盟eu / 全球无后缀\n4. 输出候选列表（最多3个），标注来源（复用/规则生成）与理由\n\n二、匹配关键词 tags（模糊命中层，提升因子匹配召回）：\n1. 从因子名称中提取碳核算领域词表命中的词（含同义词/俗称，如 电网↔电力↔外购电、钢↔钢材↔碳钢）\n2. 复用同 activityId 因子的已有 tags 并集\n3. 补充地区词（如 华东/华北/全国）\n4. 每个因子建议 3-8 个关键词\n\n注意：activityId 是跨库对齐键，同一活动在不同因子库中的标识必须完全一致；tags 服务于模糊命中，允许同义词与别名，多多益善但不引入无关词。'
        },
        {
          id: 'factor-matching',
          name: '因子匹配',
          phase: '阶段五',
          icon: 'el-icon-connection',
          color: '#E6A23C',
          desc: '为活动数据匹配最优排放因子，按优先级排序，计算置信度',
          enabled: true,
          modified: false,
          knowledgeBase: '排放因子库',
          promptTemplate: '你是一位排放因子匹配专家。请为活动数据 {{activityData}} 匹配最优排放因子。\n\n匹配规则：\n1. 按优先级 {{factorPriority}} 依次检索因子库\n2. 优先选择地域匹配、时间有效、来源可靠的因子\n3. 计算每个匹配的置信度（0-100%）\n4. 低置信度（<70%）需标注并提示用户确认\n\n输出因子匹配清单，包含因子值、单位、来源、置信度。'
        },
        {
          id: 'data-validation',
          name: '数据校验',
          phase: '阶段六',
          icon: 'el-icon-warning-outline',
          color: '#F5222D',
          desc: '五维度评估数据质量（完整性/一致性/准确性/时效性/地理性），生成问题清单',
          enabled: true,
          modified: false,
          knowledgeBase: '数据质量标准库',
          promptTemplate: '你是一位数据质量评估专家。请对数据集 {{dataset}} 进行五维度质量评估。\n\n评估维度：\n1. 完整性（必填字段覆盖率）\n2. 一致性（数据逻辑自洽）\n3. 准确性（与基准值偏差）\n4. 时效性（数据年份有效性）\n5. 地理性（地域代表性）\n\n输出 DQR 评分（1-5分）和问题清单，每个问题标注严重等级（高/中/低）。'
        },
        {
          id: 'calculation-orchestration',
          name: '计算编排',
          phase: '阶段七',
          icon: 'el-icon-cpu',
          color: '#0067FE',
          desc: '遍历生命周期各阶段，调用精确计算工具，汇总排放量',
          enabled: true,
          modified: false,
          knowledgeBase: '计算公式库',
          promptTemplate: '你是一位碳足迹计算编排师。请遍历生命周期各阶段，编排排放量计算流程。\n\n输入：\n- 单元过程模型 {{processModel}}\n- 活动数据 {{activityData}}\n- 排放因子 {{emissionFactors}}\n\n要求：\n1. 按阶段顺序（原材料→生产→运输→使用→报废）组织计算\n2. 调用精确计算工具执行数值运算\n3. 汇总各阶段排放量，输出总碳足迹\n\n输出：分阶段排放量明细 + 总计。'
        },
        {
          id: 'analysis-orchestration',
          name: '分析编排',
          phase: '阶段八',
          icon: 'el-icon-data-line',
          color: '#0067fe',
          desc: '贡献度分析、敏感度排序、蒙特卡洛不确定性模拟',
          enabled: true,
          modified: false,
          knowledgeBase: '—',
          promptTemplate: '你是一位碳足迹分析专家。请基于排放结果 {{emissionResult}} 执行以下分析：\n\n1. 贡献度分析：识别各阶段/排放源占比，定位热点\n2. 敏感度排序：计算关键参数的敏感度系数，排序减排优先级\n3. 蒙特卡洛模拟（仅产品碳足迹）：万次模拟，输出 95% 置信区间\n\n输出结构化分析报告，含图表数据。'
        },
        {
          id: 'report-generation',
          name: '报告生成',
          phase: '阶段九',
          icon: 'el-icon-document',
          color: '#67C23A',
          desc: '按标准模板生成合规报告（Word/PDF），配套四类可视化图表',
          enabled: true,
          modified: false,
          knowledgeBase: '—',
          promptTemplate: '你是一位碳足迹报告撰写专家。请根据核算结果 {{calculationResult}}，按标准 {{standardCode}} 模板生成合规报告。\n\n报告结构：\n1. 封面（产品信息/核算周期/总量）\n2. 执行摘要\n3. 方法学说明\n4. 数据清单与计算结果\n5. 数据质量评估\n6. 不确定性分析（如有）\n7. 减排建议\n8. 附录\n\n输出 Word 文档结构 + 四类图表（占比饼图/排放柱状图/不确定度分布/敏感度热力图）。'
        }
      ]
    }
  },
  computed: {
    pagedSkills() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.skills.slice(start, start + this.pageSize)
    }
  },
  methods: {
    handleSizeChange(val) { this.pageSize = val; this.currentPage = 1 },
    handlePageChange(val) { this.currentPage = val },
    phaseTagType(phase) {
      const map = { '阶段一': '', '阶段二': 'success', '阶段三': 'warning', '阶段四': 'danger', '阶段五': '', '阶段六': 'success', '阶段七': 'warning', '阶段八': 'danger', '阶段九': '' }
      return map[phase] || 'info'
    },
    editPrompt(row) {
      this.editingSkill = JSON.parse(JSON.stringify(row))
      this.originalTemplate = row.promptTemplate
      this.showEditDialog = true
    },
    savePrompt() {
      const idx = this.skills.findIndex(s => s.id === this.editingSkill.id)
      if (idx > -1) {
        this.skills[idx].promptTemplate = this.editingSkill.promptTemplate
        this.skills[idx].modified = this.editingSkill.promptTemplate !== this.originalTemplate
        this.persistSkills()
        this.$message.success('Prompt 模板已保存')
      }
      this.showEditDialog = false
      this.editingSkill = null
    },
    resetPrompt(row) {
      this.$confirm(`确定恢复「${row.name}」的默认 Prompt 模板吗？当前修改将丢失。`, '恢复确认', {
        confirmButtonText: '恢复默认',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 从原始定义恢复（实际应从服务端拉取默认模板）
        row.promptTemplate = this.getDefaultTemplate(row.id)
        row.modified = false
        this.persistSkills()
        this.$message.success('已恢复默认模板')
      }).catch(() => {})
    },
    getDefaultTemplate(skillId) {
      const skill = this.skills.find(s => s.id === skillId)
      return skill ? skill.promptTemplate : ''
    },
    insertVariable() {
      this.showVariableDialog = true
    },
    doInsertVariable(v) {
      const textarea = document.querySelector('.prompt-textarea textarea')
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = this.editingSkill.promptTemplate
        this.editingSkill.promptTemplate = text.substring(0, start) + '{{' + v.name + '}}' + text.substring(end)
      }
      this.showVariableDialog = false
    },
    extractVariables(template) {
      const matches = template.match(/\{\{(\w+)\}\}/g)
      return matches ? matches.map(m => m.replace(/\{\{|\}\}/g, '')) : []
    },
    previewPrompt() {
      let preview = this.editingSkill.promptTemplate
      // 模拟变量替换
      const sampleData = {
        standardCode: 'ISO 14067:2018',
        standardName: '温室气体-产品碳足迹-量化和声明指南',
        boundaryConfig: '{ lifecycleScope: "cradle-to-grave", ... }',
        activityData: '[{ name: "钢材", value: 620, unit: "kg" }]',
        factorPriority: '["cpcd", "ecoinvent"]',
        emissionResult: '{ total: 72.35, unit: "kgCO2e" }',
        productName: '燃油汽车 ICE-A160',
        phaseName: '政策分析'
      }
      Object.keys(sampleData).forEach(key => {
        preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), `<span class="var-highlight">${sampleData[key]}</span>`)
      })
      this.previewContent = `<pre style="white-space:pre-wrap;font-size:13px;line-height:1.6;">${preview}</pre>`
      this.showPreviewDialog = true
    },
    persistSkills() {
      try {
        localStorage.setItem('carbon-skill-templates', JSON.stringify(this.skills))
      } catch (e) { /* ignore */ }
    },
    loadSkills() {
      try {
        const saved = localStorage.getItem('carbon-skill-templates')
        if (saved) {
          const savedSkills = JSON.parse(saved)
          // 合并：保留默认结构，加载已保存的模板
          this.skills = this.skills.map(defaultSkill => {
            const saved = savedSkills.find(s => s.id === defaultSkill.id)
            return saved ? { ...defaultSkill, promptTemplate: saved.promptTemplate, modified: saved.modified } : defaultSkill
          })
        }
      } catch (e) { /* ignore */ }
    },
    // ===== 因子匹配规则维护 =====
    openRuleConfig(row) {
      this.ruleList = loadMatchingRules()
      this.showRuleDialog = true
    },
    addRule() {
      this.ruleList.push({
        id: 'custom-' + Date.now().toString().slice(-6),
        name: '新规则',
        pattern: '',
        priority: this.ruleList.length + 1,
        factorId: '', factorName: '', factorValue: '', factorUnit: '',
        dbName: '', sourcePool: '企业自建(池4)', tech: '', geo: '全国', confidence: 0.90
      })
    },
    removeRule(row) {
      const idx = this.ruleList.indexOf(row)
      if (idx > -1) this.ruleList.splice(idx, 1)
    },
    saveRules() {
      for (const r of this.ruleList) {
        if (!r.name || !r.pattern || !r.factorId || !r.factorValue || !r.factorUnit) {
          this.$message.warning('规则「' + (r.name || '未命名') + '」存在必填项未填写（名称/关键词/因子ID/因子值/单位）')
          return
        }
        try { new RegExp(r.pattern) } catch (e) {
          this.$message.warning('规则「' + r.name + '」的关键词正则不合法：' + e.message)
          return
        }
      }
      const ok = saveMatchingRules(this.ruleList)
      this.showRuleDialog = false
      this.$message.success(ok ? '规则已保存，匹配即刻生效' : '保存失败，请重试')
    },
    resetRules() {
      this.$confirm('确定恢复默认规则吗？当前配置将丢失。', '恢复确认', { type: 'warning' })
        .then(() => {
          resetMatchingRules()
          this.ruleList = loadMatchingRules()
          this.$message.success('已恢复默认规则')
        }).catch(() => {})
    }
  },
  mounted() {
    this.loadSkills()
  }
}
</script>

<style scoped>
.skill-management-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.page-header { margin-bottom: 20px; display: flex; align-items: flex-start; justify-content: space-between; flex-shrink: 0; }
.page-title { font-size: 20px; color: #303133; margin: 0 0 6px 0; }
.page-title i { color: #0067FE; }
.page-desc { font-size: 13px; color: #909399; margin: 0; }
.stats-row { display: flex; gap: 16px; margin-bottom: 16px; flex-shrink: 0; }
.stat-card {
  flex: 1; background: #fff; border-radius: 8px; padding: 14px 18px;
  border: 1px solid #ebeef5; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  display: flex; align-items: center; gap: 14px;
}
.stat-icon {
  width: 44px; height: 44px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; flex-shrink: 0;
}
.stat-content { flex: 1; min-width: 0; }
.stat-num { font-size: 24px; font-weight: 700; color: #303133; line-height: 1.2; }
.stat-label { font-size: 12px; color: #909399; margin-top: 2px; }
.skill-name { display: flex; align-items: center; gap: 8px; }
.skill-name i { font-size: 16px; }
.code-font { font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; }

/* 规则配置 */
.rule-toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.rule-tip { margin-left: auto; font-size: 12px; color: #909399; }
.rule-table-scroll { max-height: 60vh; overflow-y: auto; }
.rule-table-scroll .el-input__inner { padding: 0 6px; font-size: 12px; }

/* Prompt 编辑区 */
.prompt-edit-area { padding: 4px 0; }
.prompt-meta { display: flex; gap: 24px; margin-bottom: 16px; padding: 12px; background: #f8fafc; border-radius: 8px; }
.meta-item { display: flex; align-items: center; gap: 8px; }
.meta-label { font-size: 12px; color: #909399; }
.meta-value { font-size: 13px; color: #303133; font-weight: 600; }
.prompt-editor { border: 1px solid #dcdfe6; border-radius: 8px; overflow: hidden; }
.editor-label {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; background: #f5f7fa; border-bottom: 1px solid #dcdfe6;
  font-size: 13px; font-weight: 600; color: #303133;
}
.editor-actions { display: flex; gap: 8px; }
.prompt-textarea { border: none; }
.prompt-textarea >>> .el-textarea__inner { border: none; border-radius: 0; font-family: 'Consolas', 'Monaco', monospace; font-size: 13px; line-height: 1.6; }
.editor-hint { padding: 8px 14px; background: #fafbfc; border-top: 1px solid #ebeef5; font-size: 11px; color: #909399; }

/* 变量列表 */
.variable-list { display: flex; flex-direction: column; gap: 8px; }
.variable-item {
  padding: 10px 12px; border: 1px solid #ebeef5; border-radius: 6px;
  cursor: pointer; transition: all 0.2s;
}
.variable-item:hover { border-color: #0067FE; background: rgba(0,103,254,0.04); }
.variable-name { font-weight: 600; color: #0067FE; margin-bottom: 2px; }
.variable-desc { font-size: 12px; color: #909399; }

/* 预览高亮 */
.prompt-preview >>> .var-highlight {
  background: rgba(0,103,254,0.1); color: #0067FE;
  padding: 2px 6px; border-radius: 4px; font-weight: 600;
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
</style>
