<template>
  <div class="sop-library-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title"><i class="el-icon-reading"></i> 产品SOP库</h2>
        <p class="page-desc">已验证核算模型的沉淀库，可复用SOP快速发起同类产品的碳足迹核算</p>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="toolbar">
      <el-input placeholder="搜索SOP名称、标准..." prefix-icon="el-icon-search" size="small" v-model="searchText" clearable style="width: 240px;"></el-input>
      <el-select v-model="filterStandard" placeholder="按标准筛选" size="small" clearable style="width: 160px; margin-left: 8px;">
        <el-option v-for="std in standards" :key="std" :label="std" :value="std"></el-option>
      </el-select>
    </div>

    <!-- SOP列表表格 -->
    <div class="table-wrapper">
      <div class="table-title-bar">
        <span class="table-title-text">SOP列表</span>
      </div>
      <div class="table-scroll">
        <el-table :data="pagedSOPs" border stripe size="small" style="width: 100%;" :header-cell-style="headerCellStyle" @row-click="viewDetail">
          <el-table-column type="index" label="序号" width="55" align="center"></el-table-column>
          <el-table-column label="SOP编号" prop="id" width="100" align="center">
            <template slot-scope="{ row }">
              <span style="font-family: monospace; font-size: 13px; color: #909399;">{{ row.id }}</span>
            </template>
          </el-table-column>
          <el-table-column label="SOP名称" prop="name" min-width="200" show-overflow-tooltip>
            <template slot-scope="{ row }">
              <span style="font-weight: 500; color: var(--text-primary);">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="关联产品" min-width="140" show-overflow-tooltip>
            <template slot-scope="{ row }">
              {{ getProductName(row.productId) }}
            </template>
          </el-table-column>
          <el-table-column label="核算标准" prop="standard" width="120" show-overflow-tooltip></el-table-column>
          <el-table-column label="版本" prop="version" width="70" align="center"></el-table-column>
          <el-table-column label="单元过程" width="80" align="center">
            <template slot-scope="{ row }">
              {{ (row.processIds || []).length }} 个
            </template>
          </el-table-column>
          <el-table-column label="验证状态" width="80" align="center">
            <template slot-scope="{ row }">
              <el-tag size="mini" :type="row.verified ? 'success' : 'warning'">{{ row.verified ? '已验证' : '待验证' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="发布时间" prop="publishTime" width="110" align="center"></el-table-column>
          <el-table-column label="操作" width="170" align="center" fixed="right">
            <template slot-scope="{ row }">
              <el-button type="text" size="mini" @click.stop="useSOP(row)"><i class="el-icon-magic-wand"></i> 使用SOP</el-button>
              <el-button type="text" size="mini" @click.stop="viewDetail(row)">详情</el-button>
              <el-button type="text" size="mini" class="btn-danger" @click.stop="deleteSOP(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="filteredSOPs.length === 0" class="empty-state">
          <i class="el-icon-reading"></i>
          <p>暂无SOP</p>
          <span>在产品碳足迹智能体中完成核算后，可发布为SOP</span>
        </div>
      </div>
      <div class="pagination-bar" v-if="filteredSOPs.length > 0">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="filteredSOPs.length" :page-sizes="[10, 20, 50]" :page-size="pageSize" :current-page="currentPage" @size-change="handleSizeChange" @current-change="handlePageChange"></el-pagination>
      </div>
    </div>

    <!-- 详情对话框 -->
    <el-dialog title="SOP详情" :visible.sync="detailVisible" width="560px" append-to-body>
      <div v-if="currentSOP" class="sop-detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="SOP名称">{{ currentSOP.name }}</el-descriptions-item>
          <el-descriptions-item label="SOP编号">{{ currentSOP.id }}</el-descriptions-item>
          <el-descriptions-item label="关联产品">{{ getProductName(currentSOP.productId) }}</el-descriptions-item>
          <el-descriptions-item label="核算标准">{{ currentSOP.standard }}</el-descriptions-item>
          <el-descriptions-item label="版本号">{{ currentSOP.version }}</el-descriptions-item>
          <el-descriptions-item label="验证状态">{{ currentSOP.verified ? '已验证' : '待验证' }}</el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ currentSOP.publishTime }}</el-descriptions-item>
          <el-descriptions-item label="来源任务">{{ currentSOP.sourceTaskId }}</el-descriptions-item>
        </el-descriptions>
        <div class="sop-model-info" v-if="hasModelSnapshot(currentSOP)">
          <div class="model-info-title"><i class="el-icon-cpu"></i> 模型快照信息</div>
          <div class="model-info-body">
            <div>核算标准：{{ currentSOP.modelSnapshot.selectedStandard || '—' }}</div>
            <div>声明单位：{{ currentSOP.modelSnapshot.selectedUnit || '—' }}</div>
            <div>模型构建：{{ currentSOP.modelSnapshot.isModelBuilt ? '已完成' : '未完成' }}</div>
            <div>当前阶段：阶段{{ (currentSOP.modelSnapshot.currentStepIndex || 0) + 1 }}</div>
          </div>
        </div>
        <div class="sop-model-info" v-if="currentSOP && currentSOP.processIds && currentSOP.processIds.length > 0">
          <div class="model-info-title"><i class="el-icon-connection"></i> 关联单元过程（{{ currentSOP.processIds.length }}）</div>
          <div class="model-info-body">
            <div v-for="pid in currentSOP.processIds" :key="pid" style="display: inline-flex; align-items: center; gap: 4px; margin: 3px 6px 3px 0; padding: 2px 8px; background: var(--bg-hover, #f5f7fa); border-radius: 4px; font-size: 13px;">
              <i class="el-icon-cpu" style="color: #0067FE; font-size: 13px;"></i>
              <span>{{ getProcessName(pid) }}</span>
              <span style="color: #C0C4CC; font-size: 13px; font-family: monospace;">{{ pid }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { loadCfpProducts, saveCfpProducts } from '@/utils/productStore'

export default {
  name: 'ProductSOPLibrary',
  data() {
    return {
      sops: [],
      products: [],
      processes: [],
      searchText: '',
      filterStandard: '',
      detailVisible: false,
      currentSOP: null,
      currentPage: 1,
      pageSize: 10,
      headerCellStyle: { background: 'var(--bg-hover, #f8fafc)', color: 'var(--text-primary, #0f172a)', fontWeight: 600, textAlign: 'center' }
    }
  },
  computed: {
    standards() {
      return [...new Set(this.sops.map(s => s.standard))]
    },
    linkedProductCount() {
      return new Set(this.sops.filter(s => s.productId).map(s => s.productId)).size
    },
    filteredSOPs() {
      return this.sops.filter(s => {
        if (this.searchText && !s.name.includes(this.searchText) && !s.standard.includes(this.searchText)) return false
        if (this.filterStandard && s.standard !== this.filterStandard) return false
        return true
      })
    },
    pagedSOPs() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.filteredSOPs.slice(start, start + this.pageSize)
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    loadData() {
      try {
        const savedSOPs = localStorage.getItem('cfp_sops')
        if (savedSOPs) {
          this.sops = JSON.parse(savedSOPs)
        }
        if (!this.sops || this.sops.length === 0) {
          this.sops = [
            { id: 'SOP-001', name: '动力电池碳足迹核算模型', productId: 'EP-001', sourceTaskId: 'T-001', publishTime: '2026-06-29', version: 'v1.0', verified: true, standard: 'ISO 14067', processIds: ['UP-001', 'UP-010', 'UP-007', 'UP-009'] },
            { id: 'SOP-002', name: '配电变压器碳足迹核算模型', productId: 'EP-003', sourceTaskId: 'T-005', publishTime: '2026-06-26', version: 'v1.0', verified: true, standard: 'GB/T 32150', processIds: ['UP-001', 'UP-003', 'UP-005', 'UP-006', 'UP-007'] }
          ]
          this.persist()
        }
        const savedProducts = loadCfpProducts()
        try {
          const savedProcesses = localStorage.getItem('cfp_processes')
          if (savedProcesses) {
            this.processes = JSON.parse(savedProcesses)
          }
        } catch (e) { /* ignore */ }
      } catch (e) { /* ignore */ }
    },
    persist() {
      try { localStorage.setItem('cfp_sops', JSON.stringify(this.sops)) } catch (e) { /* ignore */ }
    },
    getProductName(productId) {
      if (!productId) return '未关联'
      const p = this.products.find(p => p.id === productId)
      return p ? p.name : '未知产品'
    },
    getProcessName(processId) {
      if (!processId) return '未知过程'
      const p = this.processes.find(p => p.id === processId)
      return p ? p.name : processId
    },
    hasModelSnapshot(sop) {
      return sop && sop.modelSnapshot && typeof sop.modelSnapshot === 'object' && sop.modelSnapshot.selectedStandard
    },
    viewDetail(sop) {
      try {
        const tasks = JSON.parse(localStorage.getItem('cfp_task_list') || '[]')
        const task = tasks.find(t => t.id === sop.sourceTaskId)
        if (task && task.stageSnapshot) {
          this.currentSOP = { ...sop, modelSnapshot: task.stageSnapshot }
        } else {
          this.currentSOP = { ...sop, modelSnapshot: null }
        }
      } catch (e) {
        this.currentSOP = { ...sop, modelSnapshot: null }
      }
      this.detailVisible = true
    },
    useSOP(sop) {
      const product = this.products.find(p => p.id === sop.productId)
      if (!product) {
        this.$message.warning('关联产品不存在')
        return
      }
      try {
        const tasks = JSON.parse(localStorage.getItem('cfp_task_list') || '[]')
        const sourceTask = tasks.find(t => t.id === sop.sourceTaskId)
        localStorage.setItem('cfp_inherit_sop', JSON.stringify({
          sopId: sop.id, sopName: sop.name,
          productId: product.id, productName: product.name,
          standard: product.standard,
          modelSnapshot: (sourceTask && sourceTask.stageSnapshot) ? sourceTask.stageSnapshot : null,
          createTime: new Date().toISOString()
        }))
      } catch (e) { /* ignore */ }
      this.$router.push('/footprint/accounting/agent?direct=true&inheritSop=1')
    },
    deleteSOP(sop) {
      this.$confirm('确认删除SOP"' + sop.name + '"？关联产品将变为待构建状态。', '删除确认', { type: 'warning' }).then(() => {
        this.sops = this.sops.filter(s => s.id !== sop.id)
        this.persist()
        try {
          const products = loadCfpProducts()
          products.forEach(p => {
            if (p.sopIds) {
              p.sopIds = p.sopIds.filter(id => id !== sop.id)
            }
          })
          saveCfpProducts(products)
          this.products = products
        } catch (e) { /* ignore */ }
        this.$message.success('SOP已删除')
      }).catch(() => {})
    },
    handleSizeChange(val) { this.pageSize = val; this.currentPage = 1 },
    handlePageChange(val) { this.currentPage = val }
  }
}
</script>

<style scoped>
.sop-library-page {
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
.sop-detail { padding: 0; }
.sop-model-info {
  margin-top: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}
.model-info-title {
  padding: 10px 14px;
  background: var(--bg-hover);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 4px;
}
.model-info-body {
  padding: 12px 14px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.8;
}
</style>
