<template>
  <div class="skill-management-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title"><i class="el-icon-magic-stick"></i> Skill 管理</h2>
        <p class="page-desc">维护各智能体的 Prompt 模板</p>
      </div>
    </div>



    <!-- Skill 列表 -->
    <div class="table-wrapper">
      <div class="table-title-bar">
        <span class="table-title-text">Skill 列表</span>
        <div class="filter-bar">
          <el-select v-model="filterPhase" placeholder="适用阶段" size="small" clearable class="filter-select">
            <el-option v-for="item in phaseOptions" :key="item" :label="item" :value="item"></el-option>
          </el-select>
          <el-select v-model="filterKnowledge" placeholder="知识库" size="small" clearable class="filter-select">
            <el-option v-for="item in knowledgeOptions" :key="item" :label="item" :value="item"></el-option>
          </el-select>
          <el-select v-model="filterStatus" placeholder="状态" size="small" clearable class="filter-status">
            <el-option label="已启用" value="enabled"></el-option>
            <el-option label="已禁用" value="disabled"></el-option>
            <el-option label="已修改" value="modified"></el-option>
          </el-select>
          <el-input v-model="searchText" placeholder="搜索名称 / 描述 / Prompt" size="small" clearable prefix-icon="el-icon-search" class="filter-input"></el-input>
          <el-button size="small" @click="resetFilters">重置</el-button>
        </div>
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
      <el-table-column label="功能描述" prop="desc" min-width="360" show-overflow-tooltip></el-table-column>
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
      <el-table-column label="详情" width="70" align="center" fixed="right">
        <template slot-scope="{ row }">
          <el-button type="text" size="mini" @click="openDetail(row)">查看</el-button>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="210" align="center" fixed="right">
        <template slot-scope="{ row }">
          <el-button type="text" size="mini" @click="toggleEnabled(row)">{{ row.enabled ? '禁用' : '启用' }}</el-button>
          <el-button type="text" size="mini" @click="editPrompt(row)">编辑模板</el-button>
          <el-button v-if="row.modified" type="text" size="mini" @click="resetPrompt(row)">恢复默认</el-button>
        </template>
      </el-table-column>
    </el-table>
      </div>
      <div class="pagination-bar" v-if="filteredSkills.length > 0">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="filteredSkills.length" :page-sizes="[10, 20, 50]" :page-size="pageSize" :current-page="currentPage" @size-change="handleSizeChange" @current-change="handlePageChange"></el-pagination>
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
        <el-alert type="info" :closable="false" style="margin-bottom: 16px;">
          <template slot="title">
            <i class="el-icon-info"></i>
            仅可编辑文字描述内容；花括号内容由系统自动填充，请勿修改
          </template>
        </el-alert>

        <div class="prompt-editor">
          <div class="editor-label">
            <span>Prompt 模板</span>
            <div class="editor-actions">
              <el-button size="mini" @click="previewPrompt">预览效果</el-button>
            </div>
          </div>
          <el-input
            type="textarea"
            :rows="18"
            v-model="editingSkill.promptTemplate"
            placeholder="请输入 Prompt 模板..."
            class="prompt-textarea"
          ></el-input>
          <div class="editor-hint">
            字符数：{{ editingSkill.promptTemplate.length }}
          </div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="savePrompt">保存模板</el-button>
      </span>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog title="Prompt 预览" :visible.sync="showPreviewDialog" width="640px" append-to-body>
      <div class="prompt-preview" v-html="previewContent"></div>
    </el-dialog>

    <!-- Skill 详情抽屉 -->
    <el-drawer
      :visible.sync="showDetailDrawer"
      size="640px"
      custom-class="skill-detail-drawer"
      :with-header="false"
      append-to-body
    >
      <div v-if="detailSkill" class="skill-detail">
        <div class="detail-header">
          <div class="detail-icon" :style="{ background: detailSkill.color }"><i :class="detailSkill.icon"></i></div>
          <div class="detail-title">
            <h3>{{ detailSkill.name }}</h3>
            <p>{{ detailSkill.desc }}</p>
          </div>
          <el-button
            class="detail-close"
            type="text"
            size="mini"
            icon="el-icon-close"
            aria-label="关闭"
            @click="closeDetail"
          ></el-button>
        </div>
        <div class="detail-chips">
          <span class="detail-chip phase">{{ detailSkill.phase }}</span>
          <span class="detail-chip knowledge">{{ detailSkill.knowledgeBase }}</span>
          <span class="detail-chip" :class="detailSkill.enabled ? 'success' : 'muted'">{{ detailSkill.enabled ? '已启用' : '已禁用' }}</span>
          <span class="detail-chip" :class="detailSkill.modified ? 'warning' : 'muted'">{{ detailSkill.modified ? '模板已修改' : '默认模板' }}</span>
        </div>
        <div class="detail-meta">
          <div class="meta-item"><span>变量数量</span><strong>{{ detailVariables.length }}</strong></div>
          <div class="meta-item"><span>最近修改</span><strong>{{ detailSkill.updatedAt || '—' }}</strong></div>
          <div class="meta-item"><span>Prompt 字数</span><strong>{{ detailSkill.promptTemplate.length }}</strong></div>
          <div class="meta-item"><span>默认来源</span><strong>内置模板</strong></div>
        </div>
        <div class="detail-section">
          <div class="section-title">
            <span>输入变量</span>
            <small>系统运行时自动填充</small>
          </div>
          <div class="variable-list">
            <el-tag v-for="variable in detailVariables" :key="variable" size="mini" effect="plain">{{ variable }}</el-tag>
            <span v-if="detailVariables.length === 0" class="empty-variables">该 Skill 无系统变量</span>
          </div>
        </div>
        <div class="detail-section">
          <div class="section-title">
            <span>Prompt 模板</span>
            <el-button type="text" size="mini" icon="el-icon-document-copy" @click="copyPrompt">复制</el-button>
          </div>
          <div class="prompt-panel">
            <pre class="detail-prompt">{{ detailSkill.promptTemplate }}</pre>
            <div class="prompt-footer">共 {{ detailSkill.promptTemplate.length }} 字 · 默认模板可在「恢复默认」时还原</div>
          </div>
        </div>
      </div>
    </el-drawer>

  </div>
</template>

<script>
import { DEFAULT_SKILLS } from '../data/skillPrompts'

export default {
  name: 'SkillManagement',
  data() {
    return {
      showEditDialog: false,
      showPreviewDialog: false,
      showDetailDrawer: false,
      detailSkill: null,
      searchText: '',
      filterPhase: '',
      filterKnowledge: '',
      filterStatus: '',
      editingSkill: null,
      originalTemplate: '',
      previewContent: '',
      currentPage: 1,
      pageSize: 10,
      skills: DEFAULT_SKILLS.map(s => JSON.parse(JSON.stringify(s)))
    }
  },
  computed: {
    phaseOptions() {
      return Array.from(new Set(this.skills.map(s => s.phase).filter(Boolean)))
    },
    knowledgeOptions() {
      return Array.from(new Set(this.skills.map(s => s.knowledgeBase).filter(v => v && v !== '—')))
    },
    filteredSkills() {
      const keyword = this.searchText.trim().toLowerCase()
      return this.skills.filter(skill => {
        const phaseMatched = !this.filterPhase || skill.phase === this.filterPhase
        const knowledgeMatched = !this.filterKnowledge || skill.knowledgeBase === this.filterKnowledge
        const statusMatched = !this.filterStatus || (this.filterStatus === 'enabled' ? skill.enabled : this.filterStatus === 'disabled' ? !skill.enabled : skill.modified)
        const keywordMatched = !keyword || [skill.name, skill.desc, skill.phase, skill.knowledgeBase, skill.promptTemplate].some(value => String(value || '').toLowerCase().includes(keyword))
        return phaseMatched && knowledgeMatched && statusMatched && keywordMatched
      })
    },
    pagedSkills() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.filteredSkills.slice(start, start + this.pageSize)
    },
    detailVariables() {
      return this.detailSkill ? this.extractVariables(this.detailSkill.promptTemplate) : []
    }
  },
  watch: {
    searchText() { this.currentPage = 1 },
    filterPhase() { this.currentPage = 1 },
    filterKnowledge() { this.currentPage = 1 },
    filterStatus() { this.currentPage = 1 }
  },
  methods: {
    handleSizeChange(val) { this.pageSize = val; this.currentPage = 1 },
    handlePageChange(val) { this.currentPage = val },
    resetFilters() {
      this.searchText = ''
      this.filterPhase = ''
      this.filterKnowledge = ''
      this.filterStatus = ''
    },
    openDetail(row) {
      this.detailSkill = row
      this.showDetailDrawer = true
    },
    closeDetail() {
      this.showDetailDrawer = false
    },
    copyPrompt() {
      if (!this.detailSkill) return
      const prompt = this.detailSkill.promptTemplate
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(prompt).then(() => {
          this.$message.success('Prompt 已复制')
        }).catch(() => {
          this.$message.warning('复制失败，请手动选择复制')
        })
      } else {
        this.$message.warning('当前浏览器不支持自动复制，请手动选择复制')
      }
    },
    toggleEnabled(row) {
      row.enabled = !row.enabled
      row.updatedAt = new Date().toLocaleString('zh-CN', { hour12: false })
      this.persistSkills()
      this.$message.success(row.enabled ? `已启用「${row.name}」` : `已禁用「${row.name}」`)
    },
    editPrompt(row) {
      this.editingSkill = JSON.parse(JSON.stringify(row))
      this.originalTemplate = row.promptTemplate
      this.showEditDialog = true
    },
    savePrompt() {
      // 变量完整性校验：模板中的花括号变量由系统自动填充，用户不应增删改
      const lost = this.checkVariablesLost(this.originalTemplate, this.editingSkill.promptTemplate)
      if (lost.length) {
        this.$message.warning(`花括号内容由系统自动填充，不可修改。请恢复以下内容后重试：${lost.join('、')}`)
        return
      }
      const idx = this.skills.findIndex(s => s.id === this.editingSkill.id)
      if (idx > -1) {
        this.skills[idx].promptTemplate = this.editingSkill.promptTemplate
        this.skills[idx].modified = this.editingSkill.promptTemplate !== this.originalTemplate
        this.skills[idx].updatedAt = new Date().toLocaleString('zh-CN', { hour12: false })
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
        const defaultSkill = DEFAULT_SKILLS.find(s => s.id === row.id)
        row.promptTemplate = defaultSkill ? defaultSkill.promptTemplate : row.promptTemplate
        row.modified = false
        this.persistSkills()
        this.$message.success('已恢复默认模板')
      }).catch(() => {})
    },
    extractVariables(template) {
      const matches = String(template || '').match(/\{\{(\w+)\}\}/g)
      if (!matches) return []
      const names = matches.map(m => m.replace(/\{\{|\}\}/g, ''))
      return names.filter((name, index) => names.indexOf(name) === index)
    },
    /** 校验变量完整性：返回原模板中有、新模板中已丢失的变量 */
    checkVariablesLost(original, current) {
      const before = this.extractVariables(original)
      const after = this.extractVariables(current)
      return before.filter(v => after.indexOf(v) === -1)
    },
    previewPrompt() {
      let preview = this.editingSkill.promptTemplate
      const escapeHtml = value => String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
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
        preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), `<span class="var-highlight">${escapeHtml(sampleData[key])}</span>`)
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
        const savedSkills = saved ? JSON.parse(saved) : []
        this.skills = DEFAULT_SKILLS.map(defaultSkill => {
          const savedSkill = savedSkills.find(item => item.id === defaultSkill.id)
          return savedSkill ? { ...JSON.parse(JSON.stringify(defaultSkill)), ...savedSkill } : JSON.parse(JSON.stringify(defaultSkill))
        })
      } catch (e) {
        this.skills = DEFAULT_SKILLS.map(skill => JSON.parse(JSON.stringify(skill)))
      }
    },
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

/* Prompt 编辑区 */
.prompt-edit-area { padding: 4px 0; }
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
.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.filter-select,
.filter-status {
  width: 126px;
}
.filter-input {
  width: 220px;
}
.skill-detail {
  padding: 0 20px 24px;
}
.skill-detail-drawer >>> .el-drawer__header {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color, #ebeef5);
  color: #303133;
  font-weight: 600;
}
.skill-detail-drawer >>> .el-drawer__body {
  height: 100%;
  overflow: auto;
}
.detail-header {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding-top: 24px;
}
.detail-close {
  margin-left: auto;
  margin-right: -6px;
  padding: 4px;
  color: #909399;
  font-size: 18px;
}
.detail-close:hover {
  color: #303133;
  background: #f2f3f5;
}
.detail-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.detail-icon i {
  color: #fff;
}
.detail-title h3 {
  margin: 0 0 6px;
  font-size: 17px;
  color: #303133;
}
.detail-title p {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: #909399;
}
.detail-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
.detail-chip {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  background: #f1f5f9;
  color: #64748b;
}
.detail-chip.phase {
  background: rgba(0,103,254,0.1);
  color: #0067FE;
}
.detail-chip.knowledge {
  background: rgba(0,168,160,0.1);
  color: #00A8A0;
}
.detail-chip.success {
  background: rgba(103,194,58,0.12);
  color: #67C23A;
}
.detail-chip.warning {
  background: rgba(230,162,60,0.14);
  color: #e6a23c;
}
.detail-meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 14px;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid var(--border-color, #ebeef5);
  border-radius: 10px;
}
.meta-item {
  min-width: 0;
}
.meta-item span {
  display: block;
  margin-bottom: 4px;
  font-size: 11px;
  color: #909399;
}
.meta-item strong {
  font-size: 13px;
  color: #303133;
  font-weight: 600;
}
.detail-section {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--border-color, #ebeef5);
}
.section-title {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section-title small {
  font-size: 11px;
  font-weight: 400;
  color: #909399;
}
.variable-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.variable-list .el-tag {
  font-family: 'Consolas', 'Monaco', monospace;
}
.empty-variables {
  font-size: 12px;
  color: #909399;
}
.prompt-panel {
  overflow: hidden;
  border: 1px solid var(--border-color, #ebeef5);
  border-radius: 10px;
  background: #fafbfc;
}
.detail-prompt {
  max-height: 380px;
  overflow: auto;
  margin: 0;
  padding: 14px 16px;
  white-space: pre-wrap;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #475569;
}
.prompt-footer {
  padding: 8px 16px;
  background: rgba(0,103,254,0.04);
  border-top: 1px solid var(--border-color, #ebeef5);
  font-size: 11px;
  color: #909399;
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
