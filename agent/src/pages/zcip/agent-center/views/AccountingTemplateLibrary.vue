<template>
  <div class="template-library-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title"><i class="el-icon-document-copy"></i> 组织模板库</h2>
        <p class="page-desc">当前组织完成核算后沉淀的核算模型模板，再次发起同类核算时可优先复用，无需重新创建</p>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="toolbar">
      <el-input placeholder="搜索模板名称..." prefix-icon="el-icon-search" size="small" v-model="searchText" clearable style="width: 240px;"></el-input>
      <el-select v-model="filterScenario" placeholder="核算场景" size="small" clearable style="width: 140px; margin-left: 8px;">
        <el-option label="组织碳核算" value="组织碳核算"></el-option>
        <el-option label="园区碳核算" value="园区碳核算"></el-option>
        <el-option label="碳市场管控" value="碳市场管控"></el-option>
      </el-select>
      <el-select v-model="filterStandard" placeholder="核算标准" size="small" clearable style="width: 160px; margin-left: 8px;">
        <el-option v-for="std in standards" :key="std" :label="std" :value="std"></el-option>
      </el-select>
    </div>

    <!-- 模板列表表格 -->
    <div class="table-wrapper">
      <div class="table-title-bar">
        <span class="table-title-text">模板列表</span>
      </div>
      <div class="table-scroll">
        <el-table :data="pagedTemplates" border stripe size="small" style="width: 100%;" :header-cell-style="headerCellStyle" @row-click="viewDetail">
          <el-table-column type="index" label="序号" width="55" align="center"></el-table-column>
          <el-table-column label="编号" prop="id" width="90" align="center">
            <template slot-scope="{ row }">
              <span style="font-family: monospace; font-size: 13px; color: #909399;">{{ row.id }}</span>
            </template>
          </el-table-column>
          <el-table-column label="模板名称" prop="name" min-width="180" show-overflow-tooltip>
            <template slot-scope="{ row }">
              <span style="font-weight: 500; color: var(--text-primary);">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="核算场景" prop="scenario" width="110" align="center"></el-table-column>
          <el-table-column label="核算标准" prop="standard" width="140" show-overflow-tooltip></el-table-column>
          <el-table-column label="边界类型" prop="boundaryType" width="130" show-overflow-tooltip></el-table-column>
          <el-table-column label="版本" prop="version" width="70" align="center"></el-table-column>
          <el-table-column label="使用次数" prop="useCount" width="80" align="center"></el-table-column>
          <el-table-column label="状态" prop="status" width="70" align="center">
            <template slot-scope="{ row }">
              <el-tag size="mini" :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" prop="createTime" width="110" align="center"></el-table-column>
          <el-table-column label="操作" width="160" align="center" fixed="right">
            <template slot-scope="{ row }">
              <el-button type="text" size="mini" @click.stop="useTemplate(row)"><i class="el-icon-magic-wand"></i> 使用</el-button>
              <el-button type="text" size="mini" @click.stop="viewDetail(row)">详情</el-button>
              <el-button type="text" size="mini" class="btn-danger" @click.stop="deleteTemplate(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="filteredTemplates.length === 0" class="empty-state">
          <i class="el-icon-document-copy"></i>
          <p>暂无组织模板</p>
          <span>完成组织碳核算后，系统会自动将核算配置沉淀为模板</span>
        </div>
      </div>
      <div class="pagination-bar" v-if="filteredTemplates.length > 0">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="filteredTemplates.length" :page-sizes="[10, 20, 50]" :page-size="pageSize" :current-page="currentPage" @size-change="handleSizeChange" @current-change="handlePageChange"></el-pagination>
      </div>
    </div>

    <!-- 详情对话框 -->
    <el-dialog title="模板详情" :visible.sync="detailVisible" width="600px" append-to-body>
      <div v-if="currentTemplate" class="template-detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="模板名称">{{ currentTemplate.name }}</el-descriptions-item>
          <el-descriptions-item label="模板编号">{{ currentTemplate.id }}</el-descriptions-item>
          <el-descriptions-item label="核算场景">{{ currentTemplate.scenario }}</el-descriptions-item>
          <el-descriptions-item label="核算标准">{{ currentTemplate.standard }}</el-descriptions-item>
          <el-descriptions-item label="边界类型">{{ currentTemplate.boundaryType }}</el-descriptions-item>
          <el-descriptions-item label="版本号">{{ currentTemplate.version }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ currentTemplate.status }}</el-descriptions-item>
          <el-descriptions-item label="使用次数">{{ currentTemplate.useCount }} 次</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentTemplate.createTime }}</el-descriptions-item>
          <el-descriptions-item label="来源">{{ currentTemplate.source }}</el-descriptions-item>
        </el-descriptions>
        <div class="template-config-section">
          <div class="config-title"><i class="el-icon-setting"></i> 模板配置概览</div>
          <div class="config-body">
            <div class="config-item">
              <span class="config-label">边界配置：</span>
              <span>{{ currentTemplate.configSummary && currentTemplate.configSummary.boundary || '—' }}</span>
            </div>
            <div class="config-item">
              <span class="config-label">核算模型：</span>
              <span>{{ currentTemplate.configSummary && currentTemplate.configSummary.model || '—' }}</span>
            </div>
            <div class="config-item">
              <span class="config-label">数据模板：</span>
              <span>{{ currentTemplate.configSummary && currentTemplate.configSummary.data || '—' }}</span>
            </div>
            <div class="config-item">
              <span class="config-label">报告模板：</span>
              <span>{{ currentTemplate.configSummary && currentTemplate.configSummary.report || '—' }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'AccountingTemplateLibrary',
  data() {
    return {
      templates: [],
      searchText: '',
      filterScenario: '',
      filterStandard: '',
      detailVisible: false,
      currentTemplate: null,
      currentPage: 1,
      pageSize: 10,
      headerCellStyle: { background: 'var(--bg-hover, #f8fafc)', color: 'var(--text-primary, #0f172a)', fontWeight: 600, textAlign: 'center' }
    }
  },
  computed: {
    standards() {
      return [...new Set(this.templates.map(t => t.standard))]
    },
    filteredTemplates() {
      return this.templates.filter(t => {
        if (this.searchText && !t.name.includes(this.searchText)) return false
        if (this.filterScenario && t.scenario !== this.filterScenario) return false
        if (this.filterStandard && t.standard !== this.filterStandard) return false
        return true
      })
    },
    pagedTemplates() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.filteredTemplates.slice(start, start + this.pageSize)
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    loadData() {
      try {
        const saved = localStorage.getItem('cfp_org_accounting_templates')
        if (saved) {
          this.templates = JSON.parse(saved)
        }
        if (!this.templates || this.templates.length === 0) {
          this.templates = [
            {
              id: 'ET-001', name: '省公司温室气体盘查模板', scenario: '组织碳核算',
              standard: 'GB/T 32150', boundaryType: '范围一+范围二', version: 'v1.1',
              status: '启用', createTime: '2026-06-28', useCount: 5,
              source: '核算任务沉淀',
              configSummary: { boundary: '直接排放+外购电力热力', model: '排放因子法', data: '能源消耗台账', report: '温室气体盘查报告' }
            },
            {
              id: 'ET-002', name: '市公司碳核算模板', scenario: '组织碳核算',
              standard: 'GHG Protocol', boundaryType: '范围一+范围二+范围三', version: 'v1.0',
              status: '启用', createTime: '2026-07-05', useCount: 2,
              source: '核算任务沉淀',
              configSummary: { boundary: '直接+间接+价值链排放', model: '排放因子法', data: '能源+物料+差旅台账', report: 'GHG盘查报告' }
            },
            {
              id: 'ET-003', name: '零碳园区碳排放自评模板', scenario: '园区碳核算',
              standard: '零碳园区指标体系', boundaryType: '园区边界', version: 'v1.0',
              status: '启用', createTime: '2026-06-20', useCount: 1,
              source: '核算任务沉淀',
              configSummary: { boundary: '园区运营边界', model: '排放因子法+物料衡算', data: '能源+物料台账', report: '园区碳排放自评表' }
            },
            {
              id: 'ET-004', name: '北京碳市场报送模板', scenario: '碳市场管控',
              standard: '北京核算指南', boundaryType: '重点排放单位边界', version: 'v1.0',
              status: '启用', createTime: '2026-07-12', useCount: 3,
              source: '核算任务沉淀',
              configSummary: { boundary: '重点排放单位', model: '历史强度法', data: '能源消耗+产出数据', report: '碳排放报送表' }
            }
          ]
          this.persist()
        }
      } catch (e) { /* ignore */ }
    },
    persist() {
      try { localStorage.setItem('cfp_org_accounting_templates', JSON.stringify(this.templates)) } catch (e) { /* ignore */ }
    },
    viewDetail(tpl) {
      this.currentTemplate = tpl
      this.detailVisible = true
    },
    useTemplate(tpl) {
      this.$router.push('/agent-center/apps/org-accounting?inheritTemplate=' + tpl.id)
    },
    deleteTemplate(tpl) {
      this.$confirm('确认删除模板"' + tpl.name + '"？', '删除确认', { type: 'warning' }).then(() => {
        this.templates = this.templates.filter(t => t.id !== tpl.id)
        this.persist()
        this.$message.success('模板已删除')
      }).catch(() => {})
    },
    handleSizeChange(val) { this.pageSize = val; this.currentPage = 1 },
    handlePageChange(val) { this.currentPage = val }
  }
}
</script>

<style scoped>
.template-library-page {
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
  font-size: 13px;
  color: var(--text-muted);
  margin: 4px 0 0;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0 12px;
  flex-shrink: 0;
}
.btn-danger { color: var(--danger) !important; }
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
.empty-state span { font-size: 13px; }
/* 详情 */
.template-config-section {
  margin-top: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}
.config-title {
  padding: 10px 14px;
  background: var(--bg-hover);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 4px;
}
.config-body {
  padding: 12px 14px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.8;
}
.config-item { display: flex; gap: 4px; }
.config-label { color: var(--text-muted); white-space: nowrap; }
</style>
