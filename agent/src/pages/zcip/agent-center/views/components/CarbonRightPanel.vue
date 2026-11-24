<template>
  <div class="carbon-right-panel">
    <div class="panel-header">
      <!-- 选项卡切换按钮 -->
      <div class="tab-selectors">
        <span class="tab-selector" :class="{ active: localRightPanel === 'tasks' }" @click="switchTab('tasks')">
          <i class="el-icon-s-order"></i> 任务列表
        </span>
        <span class="tab-selector" :class="{ active: localRightPanel === 'products' }" @click="switchTab('products')">
          <i class="el-icon-s-goods"></i> 企业产品库
        </span>
      </div>
    </div>

    <!-- 近期核算任务 -->
    <div v-if="localRightPanel === 'tasks'" class="panel-content">
      <div class="search-header">
        <span class="panel-title">近期核算任务</span>
        <el-input placeholder="搜索任务..." prefix-icon="el-icon-search" size="mini" v-model="searchTask" style="width: 140px;"></el-input>
      </div>
      <div class="panel-grid">
        <div class="task-card" v-for="task in filteredTasks" :key="task.id" :class="{ 'is-archived': task.isReportArchived }" @click="$emit('enter-task', task)">
          <div class="task-top">
            <div class="task-icon" :class="'is-' + (task.status === '已完成' ? 'done' : task.status === '异常' ? 'error' : task.isReportArchived ? 'archived' : 'running')">
              <i :class="task.isReportArchived ? 'el-icon-folder-checked' : task.status === '已完成' ? 'el-icon-circle-check' : task.status === '异常' ? 'el-icon-warning-outline' : 'el-icon-loading'"></i>
            </div>
            <div class="task-name">{{ task.name }}</div>
            <div class="task-top-right">
              <el-tag :type="statusType(task.status)" size="mini" effect="plain">{{ task.status }}</el-tag>
              <el-popconfirm
                v-if="!task.isReportArchived"
                title="确定删除该任务吗？"
                confirm-button-text="删除"
                cancel-button-text="取消"
                @confirm="$emit('delete-task', task)"
              >
                <el-button slot="reference" class="task-del-btn" size="mini" type="text" icon="el-icon-delete" @click.stop></el-button>
              </el-popconfirm>
              <el-tooltip v-else content="报告已归档，任务不可删除" placement="top">
                <el-button class="task-del-btn is-archived" size="mini" type="text" icon="el-icon-lock" disabled @click.stop></el-button>
              </el-tooltip>
            </div>
          </div>
          <div class="task-info">
            <div class="task-info-row">
              <span class="info-label">标准</span>
              <span class="info-value">{{ task.product || '—' }}</span>
            </div>
            <div class="task-info-row">
              <span class="info-label">阶段</span>
              <span class="info-value">{{ task.currentStage || '—' }}</span>
            </div>
          </div>
          <div class="task-progress-row">
            <el-progress class="task-progress" :percentage="task.progress" :stroke-width="4" :show-text="false" :color="task.status === '异常' ? dangerColor : primaryColor"></el-progress>
            <span class="task-percent" :class="{ 'is-danger': task.status === '异常' }">{{ task.progress }}%</span>
          </div>
          <div class="task-bottom">
            <span class="task-time"><i class="el-icon-time"></i> {{ task.updateTime }}</span>
          </div>
        </div>
        <div v-if="filteredTasks.length === 0" class="empty-state">
          <i class="el-icon-folder-opened"></i>
          <p>暂无核算任务</p>
          <span class="empty-create-link" @click="$emit('start-create')">在对话框中创建新任务 →</span>
        </div>
      </div>
    </div>

    <!-- 企业产品库 -->
    <div v-if="localRightPanel === 'products'" class="panel-content">
      <div class="search-header">
        <span class="panel-title">企业产品库</span>
        <div style="display:flex;align-items:center;gap:8px;">
          <el-input placeholder="搜索产品..." prefix-icon="el-icon-search" size="mini" v-model="searchProduct" style="width: 120px;"></el-input>
          <el-tooltip content="前往企业产品库管理" placement="bottom">
            <el-button size="mini" icon="el-icon-setting" circle @click="$emit('go-to-product-library')"></el-button>
          </el-tooltip>
        </div>
      </div>
      <div class="panel-grid">
        <div class="product-card" v-for="prod in filteredProducts" :key="prod.id">
          <div class="product-top">
            <div class="product-icon"><i class="el-icon-goods"></i></div>
            <div class="product-name">{{ prod.name }}</div>
            <el-tag size="mini" :type="prod.sopIds && prod.sopIds.length > 0 ? 'success' : 'info'" effect="plain">
              {{ prod.sopIds && prod.sopIds.length > 0 ? '有SOP' : '待构建' }}
            </el-tag>
          </div>
          <div class="product-info">
            <div class="product-info-row">
              <span class="info-label">品类</span>
              <span class="info-value">{{ prod.category || '—' }}</span>
            </div>
            <div class="product-info-row">
              <span class="info-label">型号</span>
              <span class="info-value">{{ prod.standard || prod.specs || '—' }}</span>
            </div>
          </div>
          <div class="product-bottom">
            <el-button size="mini" type="primary" class="calc-btn" icon="el-icon-data-analysis" @click="$emit('quick-calc', prod)">
              开始核算
            </el-button>
          </div>
        </div>
        <div v-if="filteredProducts.length === 0" class="empty-state">
          <i class="el-icon-box"></i>
          <p>暂无产品</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CarbonRightPanel',
  props: {
    rightPanel: { type: String, default: 'tasks' },
    tasks: { type: Array, default: () => [] },
    conversations: { type: Array, default: () => [] },
    products: { type: Array, default: () => [] },
    sops: { type: Array, default: () => [] }
  },
  data() {
    return {
      primaryColor: '#0067FE',
      dangerColor: '#F56C6C',
      successColor: '#0067fe',
      searchTask: '',
      searchProduct: '',
      localRightPanel: this.rightPanel
    }
  },
  watch: {
    rightPanel(val) {
      this.localRightPanel = val
    }
  },
  computed: {
    filteredTasks() {
      return this.tasks.filter(t => !this.searchTask || t.name.includes(this.searchTask) || t.product.includes(this.searchTask))
    },
    filteredProducts() {
      const list = (this.products || []).map(p => ({ ...p, standard: p.standard || p.specs || '' }))
      return list.filter(p => !this.searchProduct || p.name.includes(this.searchProduct) || p.category.includes(this.searchProduct))
    }
  },
  methods: {
    statusType(s) {
      return s === '运行中' ? 'primary' : s === '已完成' ? 'success' : s === '异常' ? 'danger' : 'info'
    },
    switchTab(panel) {
      this.localRightPanel = panel
      this.$emit('tab-switch', panel)
    }
  }
}
</script>

<style scoped>
.carbon-right-panel {
  background: var(--bg-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-color);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  height: 52px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: var(--bg-card);
  flex-shrink: 0;
}

.tab-selectors {
  display: flex;
  background: var(--bg-hover);
  padding: 3px;
  border-radius: 8px;
  width: 100%;
}
.tab-selector {
  flex: 1;
  text-align: center;
  font-size: 12px;
  padding: 6px 0;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: var(--transition);
  font-weight: 500;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.tab-selector:hover {
  color: var(--primary);
}
.tab-selector.active {
  background: var(--bg-card);
  color: var(--primary);
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}
.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.panel-grid {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

/* 卡片通用 */
.task-card, .conv-card {
  padding: 14px;
  border: 1px solid #E4E7ED;
  background: #FFFFFF;
  border-radius: 10px;
  margin-bottom: 12px;
  transition: all 0.3s;
  cursor: pointer;
}
.task-card:hover, .conv-card:hover {
  border-color: #0067FE;
  box-shadow: 0 4px 12px rgba(0, 103, 254, 0.1);
  transform: translateY(-2px);
}
.task-card.is-archived {
  background: var(--bg-hover);
}

/* 任务卡片 */
.task-top, .conv-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.task-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  background: rgba(0, 103, 254, 0.08);
  color: #0067FE;
}
.task-icon.is-done {
  background: rgba(103, 194, 58, 0.1);
  color: #67C23A;
}
.task-icon.is-error {
  background: rgba(245, 108, 108, 0.1);
  color: #F56C6C;
}
.task-icon.is-archived {
  background: rgba(144, 147, 153, 0.12);
  color: #909399;
}
.task-top-right {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}
.task-del-btn {
  padding: 2px;
  font-size: 13px;
  color: var(--text-secondary);
}
.task-del-btn:hover {
  color: #F56C6C;
}
.task-del-btn.is-archived {
  color: var(--text-placeholder);
  cursor: not-allowed;
}
.task-name, .conv-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  padding-right: 8px;
}
.task-info {
  background: var(--bg-hover);
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 10px;
}
.task-info-row {
  display: flex;
  align-items: center;
  font-size: 11px;
  line-height: 20px;
}
.task-product, .conv-product {
  font-size: 12px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}
.task-progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.task-progress {
  flex: 1;
}
.task-percent {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 32px;
  text-align: right;
}
.task-percent.is-danger {
  color: #F56C6C;
}
.task-bottom, .conv-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--text-muted);
}
.task-time {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 空白状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-muted);
}
.empty-state i {
  font-size: 36px;
  margin-bottom: 8px;
  color: var(--text-placeholder);
}
.empty-state p {
  font-size: 13px;
  margin: 0 0 8px;
}
.empty-create-link {
  font-size: 12px;
  color: var(--primary);
  cursor: pointer;
}
.empty-create-link:hover {
  text-decoration: underline;
}

/* 产品卡片 */
.product-card {
  padding: 14px;
  border: 1px solid #E4E7ED;
  background: #FFFFFF;
  border-radius: 10px;
  margin-bottom: 12px;
  transition: all 0.3s;
  cursor: default;
}
.product-card:hover {
  border-color: #0067FE;
  box-shadow: 0 4px 12px rgba(0, 103, 254, 0.1);
  transform: translateY(-2px);
}
.product-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.product-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(0, 103, 254, 0.08);
  color: #0067FE;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.product-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.product-info {
  background: var(--bg-hover);
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 10px;
}
.product-info-row {
  display: flex;
  align-items: center;
  font-size: 11px;
  line-height: 20px;
}
.info-label {
  color: var(--text-muted);
  width: 30px;
  flex-shrink: 0;
}
.info-value {
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.product-bottom {
  display: flex;
  align-items: center;
}
.calc-btn {
  width: 100%;
  font-size: 12px;
  border-radius: 6px;
}
</style>
