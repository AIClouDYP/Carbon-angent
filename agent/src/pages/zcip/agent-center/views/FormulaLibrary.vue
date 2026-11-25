<template>
  <div class="formula-library-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title"><i class="el-icon-s-operation"></i> 核算公式库</h2>
        <p class="page-desc">维护核算公式、参数与计算规则</p>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="toolbar">
      <el-input placeholder="搜索公式名称、编号..." prefix-icon="el-icon-search" size="small" v-model="searchText" clearable style="width: 220px;"></el-input>
      <el-select v-model="filterObject" placeholder="核算对象" size="small" clearable filterable style="width: 160px; margin-left: 8px;">
        <el-option v-for="o in objectOptions" :key="o" :label="o" :value="o"></el-option>
      </el-select>
      <el-select v-model="filterStatus" placeholder="状态" size="small" clearable style="width: 100px; margin-left: 8px;">
        <el-option label="启用" value="启用"></el-option>
        <el-option label="停用" value="停用"></el-option>
      </el-select>
    </div>

    <!-- 公式列表表格 -->
    <div class="table-wrapper">
      <div class="table-title-bar">
        <span class="table-title-text">公式列表</span>
        <el-button type="primary" size="small" icon="el-icon-plus" @click="openAdd">新增公式</el-button>
      </div>
      <div class="table-scroll">
        <el-table :data="pagedFormulas" border stripe size="small" style="width: 100%;" :header-cell-style="headerCellStyle">
          <el-table-column type="index" label="序号" width="55" align="center"></el-table-column>
          <el-table-column label="编号" prop="id" width="90" align="center">
            <template slot-scope="{ row }">
              <span style="font-family: monospace; font-size: 13px; color: #909399;">{{ row.id }}</span>
            </template>
          </el-table-column>
          <el-table-column label="核算对象" prop="calcObject" width="140">
            <template slot-scope="{ row }">
              <el-tag size="mini" type="info">{{ row.calcObject }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="核算指标（输出）" min-width="160">
            <template slot-scope="{ row }">
              <span style="font-weight: 600; color: var(--text-primary);">{{ row.indicator }}</span>
              <span style="font-size: 13px; color: var(--text-muted); margin-left: 4px;">({{ row.indicatorUnit }})</span>
            </template>
          </el-table-column>
          <el-table-column label="计算公式" prop="formula" min-width="220" show-overflow-tooltip>
            <template slot-scope="{ row }">
              <code class="formula-code">{{ row.formula }}</code>
            </template>
          </el-table-column>
          <el-table-column label="输入参数" width="80" align="center">
            <template slot-scope="{ row }">
              <el-badge :value="row.params ? row.params.length : 0" type="primary"></el-badge>
            </template>
          </el-table-column>
          <el-table-column label="来源标准" width="170" show-overflow-tooltip>
            <template slot-scope="{ row }">
              <span v-if="row.appliedStandard">{{ row.appliedStandard }}</span>
              <span v-else style="color:#c0c4cc;">人工维护</span>
              <span v-if="row.sourceBatch" class="source-batch">{{ row.sourceBatch }}</span>
            </template>
          </el-table-column>
          <el-table-column label="版本" prop="version" width="60" align="center"></el-table-column>
          <el-table-column label="状态" prop="status" width="60" align="center">
            <template slot-scope="{ row }">
              <el-tag size="mini" :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" align="center" fixed="right">
            <template slot-scope="{ row }">
              <el-button type="text" size="mini" @click="viewDetail(row)">查看</el-button>
              <el-button type="text" size="mini" @click="editFormula(row)">编辑</el-button>
              <el-button type="text" size="mini" class="btn-danger" @click="deleteFormula(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="filteredFormulas.length === 0" class="empty-state">
          <i class="el-icon-s-operation"></i>
          <p>暂无公式数据</p>
        </div>
      </div>
      <div class="pagination-bar" v-if="filteredFormulas.length > 0">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="filteredFormulas.length" :page-sizes="[10, 20, 50]" :page-size="pageSize" :current-page="currentPage" @size-change="handleSizeChange" @current-change="handlePageChange"></el-pagination>
      </div>
    </div>

    <!-- 详情抽屉 -->
    <el-drawer title="公式详情" :visible.sync="detailVisible" size="520px" append-to-body>
      <div v-if="currentFormula" class="detail-content">
        <!-- 基本信息 -->
        <el-descriptions :column="1" border size="small" label-class-name="detail-label">
          <el-descriptions-item label="公式编号">{{ currentFormula.id }}</el-descriptions-item>
          <el-descriptions-item label="核算对象">
            <el-tag size="mini" type="info">{{ currentFormula.calcObject }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="核算指标（输出）">
            <span style="font-weight: 600;">{{ currentFormula.indicator }}</span>
            <span style="color: var(--text-muted); margin-left: 6px;">（{{ currentFormula.indicatorUnit }}）</span>
          </el-descriptions-item>
          <el-descriptions-item label="计算公式">
            <code class="formula-code-lg">{{ currentFormula.formula }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="关联标准">{{ currentFormula.appliedStandard || '—' }}</el-descriptions-item>
          <el-descriptions-item label="版本号">{{ currentFormula.version }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag size="mini" :type="currentFormula.status === '启用' ? 'success' : 'info'">{{ currentFormula.status }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 输入参数 -->
        <div class="detail-section" v-if="currentFormula.params && currentFormula.params.length">
          <div class="section-title">
            <i class="el-icon-edit-outline"></i> 输入参数（{{ currentFormula.params.length }}）
          </div>
          <el-table :data="currentFormula.params" border size="mini" style="width: 100%;">
            <el-table-column label="参数符号" prop="symbol" width="90">
              <template slot-scope="{ row }">
                <code style="font-family: 'Courier New', monospace; color: #E6A23C;">{{ row.symbol }}</code>
              </template>
            </el-table-column>
            <el-table-column label="含义" prop="meaning" min-width="130"></el-table-column>
            <el-table-column label="单位" prop="unit" width="80"></el-table-column>
            <el-table-column label="数据来源" prop="source" min-width="110">
              <template slot-scope="{ row }">
                <el-tag size="mini" :type="sourceTagType(row.source)">{{ row.source }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 公式说明 -->
        <div class="detail-section" v-if="currentFormula.description">
          <div class="section-title"><i class="el-icon-document"></i> 公式说明</div>
          <div class="section-body">{{ currentFormula.description }}</div>
        </div>
      </div>
    </el-drawer>

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="editMode ? '编辑公式' : '新增公式'" :visible.sync="editVisible" width="620px" append-to-body :close-on-click-modal="false">
      <el-form :model="editForm" label-width="110px" size="small">
        <el-form-item label="核算对象" required>
          <el-select v-model="editForm.calcObject" placeholder="选择或输入核算对象" filterable allow-create style="width: 100%;">
            <el-option v-for="o in presetObjects" :key="o" :label="o" :value="o"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="核算指标" required>
          <el-input v-model="editForm.indicator" placeholder="输出指标名称，如：排放量、碳强度">
            <template slot="append">
              <el-input v-model="editForm.indicatorUnit" placeholder="单位" style="width: 90px;"></el-input>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="计算公式" required>
          <el-input type="textarea" v-model="editForm.formula" :rows="2" placeholder="如：E = AD × EF × (1 - 氧化率)"></el-input>
        </el-form-item>
        <el-form-item label="关联标准">
          <el-input v-model="editForm.appliedStandard" placeholder="如 GB/T 32150"></el-input>
        </el-form-item>
        <el-form-item label="版本号">
          <el-input v-model="editForm.version" placeholder="如 v1.0" style="width: 120px;"></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="editForm.status">
            <el-radio label="启用">启用</el-radio>
            <el-radio label="停用">停用</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 输入参数编辑 -->
        <el-form-item label="输入参数">
          <div class="params-editor">
            <div class="params-header">
              <span class="params-tip">参数符号 · 含义 · 单位 · 数据来源</span>
              <el-button type="text" size="mini" icon="el-icon-plus" @click="addParam">添加参数</el-button>
            </div>
            <div class="params-list">
              <div class="param-row" v-for="(p, idx) in editForm.params" :key="idx">
                <el-input v-model="p.symbol" placeholder="符号" size="mini" style="width: 80px;"></el-input>
                <el-input v-model="p.meaning" placeholder="含义" size="mini" style="flex: 1;"></el-input>
                <el-input v-model="p.unit" placeholder="单位" size="mini" style="width: 70px;"></el-input>
                <el-select v-model="p.source" placeholder="来源" size="mini" filterable allow-create style="width: 130px;">
                  <el-option label="数据采集" value="数据采集"></el-option>
                  <el-option label="排放因子库" value="排放因子库"></el-option>
                  <el-option label="电碳因子库" value="电碳因子库"></el-option>
                  <el-option label="标准默认值" value="标准默认值"></el-option>
                  <el-option label="下级汇总" value="下级汇总"></el-option>
                  <el-option label="本对象指标" value="本对象指标"></el-option>
                  <el-option label="统计数据" value="统计数据"></el-option>
                  <el-option label="碳市场行情" value="碳市场行情"></el-option>
                  <el-option label="配额分配" value="配额分配"></el-option>
                  <el-option label="目标设定" value="目标设定"></el-option>
                  <el-option label="产品档案" value="产品档案"></el-option>
                </el-select>
                <el-button type="text" size="mini" icon="el-icon-delete" style="color: #F56C6C;" @click="removeParam(idx)"></el-button>
              </div>
              <div v-if="!editForm.params || editForm.params.length === 0" class="params-empty">
                暂无参数，点击"添加参数"
              </div>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="公式说明">
          <el-input type="textarea" v-model="editForm.description" :rows="2" placeholder="公式用途、适用条件、注意事项等"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="editVisible = false">取消</el-button>
        <el-button type="primary" size="small" @click="saveFormula">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { DEFAULT_FORMULAS } from '../data/formulaLibrary'
export default {
  name: 'FormulaLibrary',
  data() {
    return {
      formulas: [],
      searchText: '',
      filterObject: '',
      filterStatus: '',
      currentPage: 1,
      pageSize: 10,
      headerCellStyle: { background: 'var(--bg-hover, #f8fafc)', color: 'var(--text-primary, #0f172a)', fontWeight: 600, textAlign: 'center' },
      detailVisible: false,
      currentFormula: null,
      editVisible: false,
      editMode: false,
      editForm: {
        id: '', calcObject: '', indicator: '', indicatorUnit: '', formula: '',
        appliedStandard: '', version: 'v1.0', status: '启用', description: '',
        params: []
      },
      presetObjects: [
        '燃料燃烧源', '外购电力', '外购热力/蒸汽', '过程排放', '逃逸排放', '生物质燃烧源',
        '锅炉设施', '空压设施', '配电设施',
        '排放单元', '生产线', '后勤区',
        '范围汇总', '组织整体', '园区整体', '配额履约', '通用分析'
      ]
    }
  },
  computed: {
    objectOptions() {
      return [...new Set(this.formulas.map(f => f.calcObject))]
    },
    filteredFormulas() {
      return this.formulas.filter(f => {
        if (this.searchText && !f.indicator.includes(this.searchText) && !f.id.includes(this.searchText) && !f.calcObject.includes(this.searchText)) return false
        if (this.filterObject && f.calcObject !== this.filterObject) return false
        if (this.filterStatus && f.status !== this.filterStatus) return false
        return true
      })
    },
    pagedFormulas() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.filteredFormulas.slice(start, start + this.pageSize)
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    loadData() {
      try {
        const saved = localStorage.getItem('cfp_formula_library')
        if (saved) {
          this.formulas = JSON.parse(saved)
        }
        if (!this.formulas || this.formulas.length === 0) {
          this.formulas = this.getDefaultFormulas()
          this.persist()
        } else {
          // 幂等补种：内置新增公式（如能源折标类 GB/T 2589）对已有缓存用户补齐，按 id 判重
          const existing = new Set(this.formulas.map(f => f.id))
          const pending = this.getDefaultFormulas().filter(f => !existing.has(f.id))
          if (pending.length) {
            this.formulas = this.formulas.concat(pending)
            this.persist()
          }
        }
      } catch (e) { /* ignore */ }
    },
    getDefaultFormulas() {
      return DEFAULT_FORMULAS.map(f => JSON.parse(JSON.stringify(f)))
    },
    persist() {
      try { localStorage.setItem('cfp_formula_library', JSON.stringify(this.formulas)) } catch (e) { /* ignore */ }
    },
    sourceTagType(source) {
      if (source === '下级汇总') return 'warning'
      if (source === '本对象指标') return 'success'
      if (source === '数据采集') return ''
      if (source === '排放因子库' || source === '电碳因子库') return 'info'
      return ''
    },
    viewDetail(row) {
      this.currentFormula = row
      this.detailVisible = true
    },
    openAdd() {
      this.editMode = false
      this.editForm = {
        id: '', calcObject: '', indicator: '', indicatorUnit: '', formula: '',
        appliedStandard: '', version: 'v1.0', status: '启用', description: '',
        params: []
      }
      this.editVisible = true
    },
    editFormula(row) {
      this.editMode = true
      this.editForm = { ...row, params: (row.params || []).map(p => ({ ...p })) }
      this.editVisible = true
    },
    addParam() {
      if (!this.editForm.params) this.editForm.params = []
      this.editForm.params.push({ symbol: '', meaning: '', unit: '', source: '' })
    },
    removeParam(idx) {
      this.editForm.params.splice(idx, 1)
    },
    saveFormula() {
      if (!this.editForm.calcObject || !this.editForm.indicator || !this.editForm.formula) {
        this.$message.warning('请填写核算对象、核算指标和计算公式')
        return
      }
      if (this.editMode) {
        const idx = this.formulas.findIndex(f => f.id === this.editForm.id)
        if (idx > -1) {
          this.editForm.updateTime = new Date().toISOString().slice(0, 10)
          this.$set(this.formulas, idx, { ...this.editForm })
        }
      } else {
        const maxId = this.formulas.reduce((max, f) => {
          const num = parseInt(f.id.replace('FL-', ''))
          return num > max ? num : max
        }, 0)
        this.formulas.push({
          ...this.editForm,
          id: 'FL-' + String(maxId + 1).padStart(3, '0'),
          updateTime: new Date().toISOString().slice(0, 10)
        })
      }
      this.persist()
      this.editVisible = false
      this.$message.success(this.editMode ? '公式已更新' : '公式已新增')
    },
    deleteFormula(row) {
      this.$confirm('确认删除公式「' + row.calcObject + ' · ' + row.indicator + '」？', '删除确认', { type: 'warning' }).then(() => {
        this.formulas = this.formulas.filter(f => f.id !== row.id)
        this.persist()
        this.$message.success('公式已删除')
      }).catch(() => {})
    },
    handleSizeChange(val) { this.pageSize = val; this.currentPage = 1 },
    handlePageChange(val) { this.currentPage = val }
  }
}
</script>

<style scoped>
.formula-library-page {
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
.stat-content { flex: 1; }
.stat-num {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}
.stat-label {
  font-size: 13px;
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
.formula-code {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  background: var(--bg-hover, #f5f7fa);
  padding: 2px 6px;
  border-radius: 3px;
  color: #E6A23C;
}
.source-batch {
  display: block;
  font-size: 13px;
  color: var(--text-muted, #a8abb2);
  margin-top: 2px;
}
.formula-code-lg {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  background: var(--bg-hover, #f5f7fa);
  padding: 6px 10px;
  border-radius: 4px;
  color: #E6A23C;
  display: inline-block;
}
.detail-content {
  padding: 0 20px 20px;
}
.detail-section {
  margin-top: 16px;
}
.section-title {
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
.section-body {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.8;
  padding: 8px 10px;
  background: var(--bg-hover, #f5f7fa);
  border-radius: 4px;
}
/* 参数编辑器 */
.params-editor {
  width: 100%;
}
.params-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.params-tip {
  font-size: 13px;
  color: var(--text-muted);
}
.params-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.param-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.params-empty {
  text-align: center;
  padding: 16px;
  font-size: 13px;
  color: var(--text-placeholder);
  background: var(--bg-hover, #f5f7fa);
  border-radius: 4px;
}
</style>
