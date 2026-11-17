<template>
  <div class="carbon-right-panel park-right-panel">
    <div class="panel-header">
      <span class="panel-header-title"><i class="el-icon-s-order"></i> 任务列表</span>
      <span class="panel-header-count">{{ tasks.length }} 条记录</span>
      <el-tooltip content="新建核算" placement="bottom">
        <span class="panel-add-btn" @click="$emit('start-create')"><i class="el-icon-plus"></i></span>
      </el-tooltip>
    </div>

    <div class="panel-content">
      <!-- 状态筛选 + 年份筛选 -->
      <div class="search-header">
        <div class="status-filters">
          <span :class="['filter-tag', { active: statusFilter === 'all' }]" @click="statusFilter = 'all'">
            全部 {{ tasks.length }}
          </span>
          <span :class="['filter-tag', { active: statusFilter === 'running' }]" @click="statusFilter = 'running'">
            进行中 {{ countOf('运行中') }}
          </span>
          <span :class="['filter-tag', { active: statusFilter === 'done' }]" @click="statusFilter = 'done'">
            已完成 {{ countOf('已完成') }}
          </span>
          <span v-if="countOf('异常')" :class="['filter-tag', 'filter-danger', { active: statusFilter === 'error' }]"
            @click="statusFilter = 'error'">
            异常 {{ countOf('异常') }}
          </span>
        </div>
        <el-select v-model="yearFilter" size="mini" style="width: 96px;" :disabled="yearOptions.length <= 1">
          <el-option label="全部年份" value="all"></el-option>
          <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y"></el-option>
        </el-select>
      </div>

      <div class="panel-grid">
        <div class="task-card" v-for="task in visibleTasks" :key="task.id" @click="$emit('enter-task', task)">
          <!-- 标题 + 状态 -->
          <div class="task-top">
            <div class="task-name" :title="task.name">{{ task.name }}</div>
            <el-tag :type="statusType(task.status)" size="mini" class="task-status-tag">{{ task.status }}</el-tag>
          </div>

          <!-- 时间范围 -->
          <div class="task-field">
            <span class="field-label">时间范围</span>
            <span class="field-value">{{ periodLabel(task) }}</span>
          </div>
          <!-- 核算依据 -->
          <div class="task-field">
            <span class="field-label">核算依据</span>
            <span class="field-value" :title="task.standard || ''">{{ task.standard || '—' }}</span>
          </div>
          <!-- 当前阶段 + 更新时间 -->
          <div class="task-field">
            <span class="field-label">当前阶段</span>
            <span class="field-value">{{ task.currentStage || '—' }}</span>
            <span class="task-time">{{ task.updateTime }}</span>
          </div>

          <!-- hover 操作：更多菜单 -->
          <div class="task-actions" @click.stop>
            <el-dropdown trigger="click" placement="bottom-end" @command="cmd => onCommand(cmd, task)">
              <i class="el-icon-more task-more-btn"></i>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="delete" icon="el-icon-delete">删除任务</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </div>

        <!-- 加载更多 -->
        <div v-if="hasMore" class="load-more" @click="pageSize += PAGE_STEP">
          加载更多（还有 {{ filteredTasks.length - pageSize }} 条）
        </div>

        <div v-if="filteredTasks.length === 0" class="empty-state">
          <i class="el-icon-folder-opened"></i>
          <p>{{ tasks.length ? '当前筛选下无任务' : '暂无核算任务' }}</p>
          <span class="empty-create-link" @click="$emit('start-create')">在对话框中输入「新建核算」→</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const PAGE_STEP = 10

export default {
  name: 'ParkRightPanel',
  props: {
    rightPanel: { type: String, default: 'tasks' },
    tasks: { type: Array, default: () => [] }
  },
  data() {
    return {
      primaryColor: '#0067FE',
      dangerColor: '#F56C6C',
      warnColor: '#E6A23C',
      statusFilter: 'all',
      yearFilter: 'all',
      pageSize: PAGE_STEP,
      PAGE_STEP
    }
  },
  computed: {
    /** 可选年份（从 periodText 提取，倒序） */
    yearOptions() {
      const set = new Set()
      this.tasks.forEach(t => {
        const m = String(t.periodText || '').match(/(\d{4})/)
        if (m) set.add(m[1])
      })
      return Array.from(set).sort((a, b) => b.localeCompare(a))
    },
    /** 状态 + 年份筛选后，按更新时间倒序 */
    filteredTasks() {
      let list = this.tasks
      const statusMap = { running: '运行中', done: '已完成', error: '异常' }
      if (this.statusFilter !== 'all') {
        list = list.filter(t => t.status === statusMap[this.statusFilter])
      }
      if (this.yearFilter !== 'all') {
        list = list.filter(t => String(t.periodText || '').indexOf(this.yearFilter) > -1)
      }
      return list.slice().sort((a, b) => String(b.updateTime || '').localeCompare(String(a.updateTime || '')))
    },
    /** 当前页可见任务 */
    visibleTasks() {
      return this.filteredTasks.slice(0, this.pageSize)
    },
    hasMore() {
      return this.filteredTasks.length > this.pageSize
    }
  },
  watch: {
    statusFilter() { this.pageSize = PAGE_STEP },
    yearFilter() { this.pageSize = PAGE_STEP }
  },
  methods: {
    onCommand(cmd, task) {
      if (cmd === 'delete') this.$emit('delete-task', task)
    },
    statusType(s) {
      return s === '运行中' ? 'primary' : s === '已完成' ? 'success' : s === '异常' ? 'danger' : 'info'
    },
    countOf(status) {
      return this.tasks.filter(t => t.status === status).length
    },
    /** 时间范围智能简化：整年→2025年度；整月→2025年1月；其他→原样 */
    periodLabel(task) {
      const p = task.periodText || ''
      if (!p) return '—'
      let m = p.match(/^(\d{4})-01-01 ~ (\d{4})-12-31$/)
      if (m && m[1] === m[2]) return m[1] + '年度'
      m = p.match(/^(\d{4})-(\d{2})-01 ~ \1-\2-\d{2}$/)
      if (m) return m[1] + '年' + parseInt(m[2], 10) + '月'
      return p
    }
  }
}
</script>

<style scoped>
/* ===== 面板（与 CarbonRightPanel 规格一致） ===== */
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

.panel-header-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 5px;
}
.panel-header-count {
  margin-left: auto;
  font-size: 11.5px;
  color: #64748b;
}
.panel-add-btn {
  margin-left: 8px;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #0067fe;
  background: rgba(0, 103, 254, 0.08);
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
  font-size: 12px;
}
.panel-add-btn:hover {
  background: rgba(0, 103, 254, 0.16);
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
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
  gap: 8px;
}

/* 状态筛选标签 */
.status-filters {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}
.filter-tag {
  font-size: 12.5px;
  color: #475569;
  padding: 4px 10px;
  border-radius: 10px;
  cursor: pointer;
  background: #f1f5f9;
  transition: background-color 0.2s, color 0.2s;
  white-space: nowrap;
  user-select: none;
}
.filter-tag:hover {
  color: #0067fe;
  background: rgba(0, 103, 254, 0.08);
}
.filter-tag.active {
  color: #0067fe;
  background: rgba(0, 103, 254, 0.12);
  font-weight: 600;
}
.filter-tag.filter-danger {
  color: #e24c4c;
}
.filter-tag.filter-danger.active {
  background: rgba(245, 108, 108, 0.12);
}

.panel-grid {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

/* ===== 任务卡片 ===== */
.task-card {
  position: relative;
  padding: 16px;
  border: 1px solid #E4E7ED;
  background: #FFFFFF;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.task-card:hover {
  border-color: #0067FE;
  box-shadow: 0 4px 12px rgba(0, 103, 254, 0.1);
}
.task-card:focus-visible {
  outline: 2px solid rgba(0, 103, 254, 0.45);
  outline-offset: 1px;
}

/* 标题 + 状态同一行 */
.task-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.task-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.5;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.task-status-tag {
  flex-shrink: 0;
}
.task-time {
  font-size: 11.5px;
  color: var(--text-muted);
  flex-shrink: 0;
  margin-left: 8px;
}

/* 字段行（label + value） */
.task-field {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12.5px;
  line-height: 2;
}
.field-label {
  color: #64748b;
  width: 62px;
  flex-shrink: 0;
}
.field-value {
  color: #334155;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* hover 操作（更多菜单） */
.task-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: none;
}
.task-card:hover .task-actions {
  display: block;
}
.task-card:hover .task-status-tag {
  opacity: 0;
  transition: opacity 0.15s;
}
.task-more-btn {
  font-size: 15px;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: color 0.2s, background-color 0.2s;
  transform: rotate(90deg);
}
.task-more-btn:hover {
  color: #0067fe;
  background: rgba(0, 103, 254, 0.08);
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 10px;
  font-size: 12.5px;
  color: #0067fe;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s;
  user-select: none;
}
.load-more:hover {
  background: rgba(0, 103, 254, 0.06);
}

/* 空态 */
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
</style>
