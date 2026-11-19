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
        <div class="task-card" v-for="task in filteredTasks" :key="task.id" @click="$emit('enter-task', task)">
          <div class="task-top">
            <div class="task-name">{{ task.name }}</div>
            <el-tag :type="statusType(task.status)" size="mini">{{ task.status }}</el-tag>
          </div>
          <div class="task-product">
            <i class="el-icon-box"></i> {{ task.product }}
          </div>
          <div class="task-progress">
            <el-progress :percentage="task.progress" :stroke-width="4" :color="task.status === '异常' ? dangerColor : primaryColor"></el-progress>
          </div>
          <div class="task-bottom">
            <span class="task-stage">{{ task.currentStage }}</span>
            <span class="task-time">{{ task.updateTime }}</span>
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
            <div class="product-name">{{ prod.name }}</div>
            <el-tag size="mini" :type="prod.sopIds && prod.sopIds.length > 0 ? 'success' : 'info'">
              {{ prod.sopIds && prod.sopIds.length > 0 ? '有SOP' : '待构建' }}
            </el-tag>
          </div>
          <div class="product-meta-row">
            <span class="product-cat">{{ prod.category }}</span>
            <span class="product-std">{{ prod.standard }}</span>
          </div>
          <div class="product-completeness">
            <span class="completeness-label">数据完整度</span>
            <el-progress :percentage="prod.dataCompleteness" :stroke-width="4" :color="prod.dataCompleteness >= 80 ? '#0067fe' : prod.dataCompleteness >= 50 ? '#E6A23C' : '#F56C6C'"></el-progress>
          </div>
          <div class="product-bottom">
            <span class="product-calc-count">已核算 {{ prod.calcCount }} 次</span>
            <span v-if="prod.lastCalcResult" class="product-last-result">{{ prod.lastCalcResult }}</span>
            <el-button size="mini" type="primary" plain class="calc-btn" @click="$emit('quick-calc', prod)">
              核算
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
      return (this.products || []).filter(p => !this.searchProduct || p.name.includes(this.searchProduct) || p.category.includes(this.searchProduct))
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
  padding: 16px;
  border: 1px solid #E4E7ED;
  background: #FFFFFF;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.3s;
  cursor: pointer;
}
.task-card:hover, .conv-card:hover {
  border-color: #0067FE;
  box-shadow: 0 4px 12px rgba(0, 103, 254, 0.1);
  transform: translateY(-2px);
}

/* 任务卡片 */
.task-top, .conv-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
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
.task-product, .conv-product {
  font-size: 12px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}
.task-progress {
  margin-bottom: 8px;
}
.task-bottom, .conv-bottom {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-muted);
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
  padding: 16px;
  border: 1px solid #E4E7ED;
  background: #FFFFFF;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.3s;
}
.product-card:hover {
  border-color: #0067FE;
  box-shadow: 0 4px 12px rgba(0, 103, 254, 0.1);
  transform: translateY(-2px);
}
.product-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.product-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  padding-right: 8px;
}
.product-meta-row {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.product-cat {
  background: var(--bg-hover);
  padding: 1px 6px;
  border-radius: 4px;
}
.product-std {
  color: var(--text-secondary);
}
.product-completeness {
  margin-bottom: 8px;
}
.completeness-label {
  font-size: 11px;
  color: var(--text-muted);
  display: block;
  margin-bottom: 2px;
}
.product-bottom {
  display: flex;
  align-items: center;
  font-size: 11px;
  color: var(--text-muted);
  gap: 8px;
}
.product-last-result {
  color: #0067fe;
  font-weight: 500;
}
.calc-btn {
  margin-left: auto;
  padding: 4px 14px;
  font-size: 12px;
}
</style>
