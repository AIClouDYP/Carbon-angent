<template>
  <div class="emission-detail">
    <div class="page-header">
      <el-page-header @back="$router.back()" content="排放源明细分析"></el-page-header>
      <div class="header-actions">
        <el-button-group>
          <el-button size="small" :type="viewMode === 'category' ? 'primary' : ''" @click="viewMode = 'category'">
            分类视图
          </el-button>
          <el-button size="small" :type="viewMode === 'table' ? 'primary' : ''" @click="viewMode = 'table'">
            表格视图
          </el-button>
          <el-button size="small" :type="viewMode === 'waterfall' ? 'primary' : ''" @click="viewMode = 'waterfall'">
            瀑布图
          </el-button>
        </el-button-group>
        <el-button size="small" icon="el-icon-download" type="success" plain>导出Excel</el-button>
      </div>
    </div>

    <div class="page-body">

    <!-- 总计卡片 -->
    <el-row :gutter="16" class="summary-row">
      <el-col :span="6">
        <el-card shadow="never" class="summary-card">
          <div class="summary-val" style="color:#F56C6C;">{{ totalEmission.toFixed(2) }}</div>
          <div class="summary-lbl">总碳排放 (kgCO₂e)</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="summary-card">
          <div class="summary-val">{{ sourceCount }}</div>
          <div class="summary-lbl">排放源数量</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <!-- <el-card shadow="never" class="summary-card">
          <div class="summary-val" style="color:#E6A23C;">{{ avgUncertainty.toFixed(1) }}%</div>
          <div class="summary-lbl">平均不确定度</div>
        </el-card> -->
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="summary-card">
          <div class="summary-val" style="color:var(--primary, #0b294a);">{{ maxContributorName }}</div>
          <div class="summary-lbl">最大贡献源</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 分类视图 -->
    <div v-if="viewMode === 'category'" class="category-view">
      <div v-for="cat in categories" :key="cat.id" class="category-section" :id="'cat-' + cat.id">
        <el-card shadow="hover" class="category-card">
          <div slot="header" class="category-header">
            <div class="cat-title">
              <span class="cat-color-bar" :style="{ background: cat.color }"></span>
              <h3>{{ cat.name }}</h3>
              <el-tag size="small" type="info">{{ cat.children.length }}个排放源</el-tag>
            </div>
            <div class="cat-summary">
              <span class="cat-emission">
                <strong>{{ cat.emission.toFixed(2) }}</strong> kgCO₂e
              </span>
              <span class="cat-pct">占总量 {{ cat.percentage }}%</span>
            </div>
          </div>

          <!-- 迷你柱状图 -->
          <div class="mini-bars">
            <div v-for="src in cat.children" :key="src.id" class="mini-bar-row"
              :class="{ highlight: src.isMaxContributor }">
              <div class="mb-label">
                <el-tooltip :content="`质量等级: ${qualityLabel(src.dataQuality)}`"
                  placement="top">
                  <span class="mb-name" @click="showSourceDetail(src)">{{ src.name }}</span>
                </el-tooltip>
              </div>
              <div class="mb-track">
                <div class="mb-fill" :style="{
                  width: (Math.abs(src.emission) / maxCategoryEmission * 100) + '%',
                  background: src.emission >= 0 ? cat.color : '#73C0DE'
                }"></div>
              </div>
              <div class="mb-value">
                <span :class="{ negative: src.emission < 0 }">
                  {{ src.emission > 0 ? '+' : '' }}{{ src.emission.toFixed(1) }}
                </span>
                <el-tag size="mini" :type="qualityTagType(src.dataQuality)" effect="plain" class="mb-quality">
                  {{ qualityLabel(src.dataQuality) }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 表格视图 -->
    <div v-else-if="viewMode === 'table'" class="table-view">
      <el-card shadow="never">
        <el-table :data="flatSources" stripe border size="medium" :default-sort="{ prop: 'emission', order: 'descending' }">
          <el-table-column type="index" label="#" width="45" align="center"></el-table-column>
          <el-table-column prop="name" label="排放源名称" min-width="230" show-overflow-tooltip fixed>
            <template slot-scope="{ row }">
              <i v-if="row.isMaxContributor" class="el-icon-star-on" style="color:#E6A23C;"></i>
              {{ row.name }}
            </template>
          </el-table-column>
          <el-table-column label="所属阶段" width="140" align="center">
            <template slot-scope="{ row }">
              <el-tag size="small" effect="plain">{{ getPhaseLabel(row._categoryId) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="activity" label="活动类型" width="160"></el-table-column>
          <el-table-column label="原始数据" width="130" align="right">
            <template slot-scope="{ row }">
              <span class="mono">{{ row.value }}</span> <small class="unit-muted">{{ row.unit }}</small>
            </template>
          </el-table-column>
          <el-table-column label="排放因子" width="150" align="center">
            <template slot-scope="{ row }">
              <span class="factor-cell">
                <span class="factor-val">{{ row.factorValue }}</span>
                <br><small class="unit-muted factor-unit">{{ row.factorUnit }}</small>
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="emission" label="排放量(kgCO₂e)" width="130" align="right" sortable>
            <template slot-scope="{ row }">
              <strong :class="{ 'text-neg': row.emission < 0, 'text-max': row.isMaxContributor }">
                {{ row.emission > 0 ? '' : '' }}{{ row.emission.toFixed(2) }}
              </strong>
            </template>
          </el-table-column>
          <!-- <el-table-column prop="uncertainty" label="不确定度(%)" width="100" align="center" sortable>
            <template slot-scope="{ row }">
              <el-progress :percentage="row.uncertainty" :stroke-width="8"
                :color="uncertaintyColor(row.uncertainty)" :show-text="false"
                style="width: 60px; display:inline-block; vertical-align:middle;"></el-progress>
              <span class="uncertainty-txt">{{ row.uncertainty }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="dataQuality" label="数据质量" width="95" align="center">
            <template slot-scope="{ row }">
              <el-tag size="small" :type="qualityTagType(row.dataQuality)" effect="dark">
                {{ qualityLabel(row.dataQuality) }}
              </el-tag>
            </template>
          </el-table-column> -->
          <el-table-column label="操作" width="100" align="center" fixed="right">
            <template slot-scope="{ row }">
              <el-button type="text" size="small" @click="showSourceDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 瀑布图视图 -->
    <div v-else class="waterfall-view">
      <el-card shadow="never">
        <div slot="header"><strong>累积瀑布图 — 各排放源贡献链路</strong></div>
        <div class="waterfall-chart">
          <div v-for="(item, i) in waterfallData" :key="i" class="wf-bar-wrapper">
            <div class="wf-bar-label">{{ item.label }}</div>
            <div class="wf-chart-area">
              <div class="wf-bar-bg"></div>
              <div class="wf-bar-start" :style="{ width: item.startPct + '%' }"></div>
              <div class="wf-bar-value" :style="{
                left: item.startPct + '%',
                width: Math.abs(item.widthPct) + '%',
                backgroundColor: item.value >= 0 ? item.color : '#73C0DE'
              }">
                <span class="wf-bar-tip">{{ item.value > 0 ? '+' : '' }}{{ item.value.toFixed(1) }}</span>
              </div>
            </div>
            <div class="wf-running-total" :style="{ color: item.cumulative >= 0 ? '#303133' : '#67C23A' }">
              Σ={{ item.cumulative.toFixed(1) }}
            </div>
          </div>
        </div>
      </el-card>
    </div>
    </div>

    <!-- 排放源详情弹窗 -->
    <el-dialog :visible.sync="detailVisible" title="排放源详细核算过程" width="650px" custom-class="source-detail-dialog">
      <template v-if="currentSource">
        <el-descriptions :column="2" border size="medium">
          <el-descriptions-item label="排放源名称" :span="2">
            <strong>{{ currentSource.name }}</strong>
            <el-tag v-if="currentSource.isMaxContributor" size="mini" type="warning" style="margin-left:8px;">★ 最大贡献源</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="活动类型">{{ currentSource.activity }}</el-descriptions-item>
          <!-- <el-descriptions-item label="数据质量">
            <el-tag :type="qualityTagType(currentSource.dataQuality)" size="small">{{ qualityLabel(currentSource.dataQuality) }}</el-tag>
          </el-descriptions-item> -->
          <el-descriptions-item label="原始数值">
            <span class="mono">{{ currentSource.value }}</span> {{ currentSource.unit }}
          </el-descriptions-item>
          <!-- <el-descriptions-item label="不确定度">±{{ currentSource.uncertainty }}%</el-descriptions-item> -->
          <el-descriptions-item label="数据来源" :span="2">{{ currentSource.dataSource }}</el-descriptions-item>
          <el-descriptions-item label="排放因子" :span="2">
            <div class="factor-detail-box">
              <span class="factor-big">{{ currentSource.factorValue }}</span>
              <span class="factor-unit-lg">{{ currentSource.factorUnit }}</span>
            </div>
            <div class="factor-meta">来源: {{ currentSource.factorSource }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="计算公式" :span="2">
            <el-input :value="`${currentSource.value} ${currentSource.unit} × ${currentSource.factorValue} ${currentSource.factorUnit} = ${currentSource.emission} kgCO₂e`"
              readonly size="small" class="formula-input"></el-input>
          </el-descriptions-item>
          <el-descriptions-item label="排放结果" :span="2">
            <span class="result-big">{{ currentSource.emission.toFixed(2) }}</span>
            <span class="result-unit">kgCO₂e</span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 月度数据（如果有） -->
        <el-divider content-position="left">历史趋势</el-divider>
        <div v-if="currentSource.detail && currentSource.detail.monthlyData" class="monthly-chart">
          <div v-for="m in currentSource.detail.monthlyData" :key="m.month" class="m-bar-wrap">
            <span class="m-month">{{ m.month.slice(5) }}</span>
            <div class="m-track">
              <div class="m-fill" :style="{ height: (m.value / maxMonthly * 100) + '%' }"></div>
            </div>
            <span class="m-val mono">{{ m.value }}</span>
          </div>
        </div>
        <div v-else class="no-monthly-data">
          <i class="el-icon-date"></i>
          <p>该排放源无月度分解数据</p>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mockEmissionCategories } from './mock/data'

export default {
  name: 'PefEmissionDetail',
  data() {
    return {
      viewMode: 'table',
      categories: mockEmissionCategories,
      detailVisible: false,
      currentSource: null
    }
  },
  computed: {
    totalEmission() {
      return this.categories.reduce((sum, c) => sum + c.emission, 0)
    },
    sourceCount() {
      return this.categories.reduce((sum, c) => sum + c.children.length, 0)
    },
    avgUncertainty() {
      const all = this.flatSources
      if (!all.length) return 0
      return all.reduce((s, x) => s + x.uncertainty, 0) / all.length
    },
    maxContributorName() {
      const all = this.flatSources
      if (!all.length) return '—'
      const max = all.reduce((a, b) => (a.emission > b.emission ? a : b))
      return max.name.length > 12 ? max.name.slice(0, 12) + '...' : max.name
    },
    flatSources() {
      const result = []
      for (const cat of this.categories) {
        for (const src of cat.children) {
          result.push({ ...src, _categoryId: cat.id, _categoryColor: cat.color })
        }
      }
      return result
    },
    maxCategoryEmission() {
      let max = 0
      for (const cat of this.categories) {
        for (const s of cat.children) {
          if (Math.abs(s.emission) > max) max = Math.abs(s.emission)
        }
      }
      return max || 1
    },
    waterfallData() {
      const data = []
      let cumulative = 0
      const colors = ['#5470C6','#91CC75','#FAC858','#EE6666','#73C0DE','#909399']
      let ci = 0
      for (const cat of this.categories) {
        for (const src of cat.children) {
          const startPct = (cumulative / this.maxAbsTotal) * 45 + 2.5
          data.push({
            label: src.name.length > 14 ? src.name.slice(0, 14) + '..' : src.name,
            value: src.emission,
            cumulative: cumulative += src.emission,
            startPct,
            widthPct: (Math.abs(src.emission) / this.maxAbsTotal) * 45,
            color: cat.color
          })
        }
        ci++
      }
      return data
    },
    maxAbsTotal() {
      let maxAbs = 0
      let running = 0
      for (const cat of this.categories) {
        for (const s of cat.children) {
          running += s.emission
          maxAbs = Math.max(maxAbs, Math.abs(running), Math.abs(s.emission))
        }
      }
      return maxAbs || 1
    },
    maxMonthly() {
      if (!this.currentSource || !this.currentSource.detail || !this.currentSource.detail.monthlyData) return 1
      return Math.max(...this.currentSource.detail.monthlyData.map(m => m.value))
    }
  },
  methods: {
    qualityLabel(q) {
      return { EXCELLENT: '优秀', GOOD: '良好', MODERATE: '一般', POOR: '较差' }[q] || q
    },
    qualityTagType(q) {
      return { EXCELLENT: 'success', GOOD: '', MODERATE: 'warning', POOR: 'danger' }[q] || 'info'
    },
    uncertaintyColor(v) {
      if (v <= 5) return '#67C23A'
      if (v <= 15) return '#E6A23C'
      return '#F56C6C'
    },
    getPhaseLabel(catId) {
      const map = {
        'CAT-RAW': '原材料获取阶段',
        'CAT-MFG': '生产制造阶段',
        'CAT-DST': '运输分销阶段',
        'CAT-EOL': '报废回收阶段'
      }
      return map[catId] || catId
    },
    showSourceDetail(src) {
      this.currentSource = src
      this.detailVisible = true
    }
  }
}
</script>

<style scoped>
.emission-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f7fa;
}
.page-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.page-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px;
}

.summary-row { margin-bottom: 20px; }
.summary-card {
  border-radius: 8px; border: none; text-align: center;
}
.summary-val {
  font-size: 28px; font-weight: 700;
  line-height: 1.3;
}
.summary-lbl {
  font-size: 13px; color: #909399; margin-top: 4px;
}

/* 分类视图 */
.category-section { margin-bottom: 16px; }
.category-header {
  display: flex; justify-content: space-between; align-items: center;
}
.cat-title { display: flex; align-items: center; gap: 10px; margin: 0; }
.cat-title h3 { margin: 0; font-size: 15px; }
.cat-color-bar {
  width: 4px; height: 20px; border-radius: 2px; display: inline-block;
}
.cat-summary { text-align: right; }
.cat-emission { margin-right: 12px; }
.cat-pct { color: #909399; font-size: 12px; }

.mini-bars { padding: 4px 0; }
.mini-bar-row {
  display: flex; align-items: center; padding: 6px 0;
  border-bottom: 1px dashed #f0f0f0; transition: background 0.15s;
}
.mini-bar-row:last-child { border-bottom: none; }
.mini-bar-row:hover { background: #fafafa; }
.mini-bar-row.highlight { background: #fdf6ec; }

.mb-label { width: 280px; flex-shrink: 0; padding-right: 10px; }
.mb-name {
  font-size: 13px; cursor: pointer; color: #303133;
}
.mb-name:hover { color: var(--primary, #0b294a); text-decoration: underline; }
.mb-track {
  flex: 1; height: 22px; background: #f5f7fa; border-radius: 4px; overflow: hidden;
  position: relative;
}
.mb-fill {
  height: 100%; border-radius: 4px; transition: width 0.6s ease; min-width: 2px;
}
.mb-value {
  width: 100px; text-align: right; font-family: monospace; font-size: 13px; font-weight: 600;
  flex-shrink: 0;
}
.negative { color: #67C23A; }
.mb-quality { margin-left: 6px; }

/* 表格视图 */
.table-view { margin-top: 0; }
.mono { font-family: 'Monaco', monospace; font-size: 13px; }
.unit-muted { color: #c0c4cc; font-size: 11px; }
.factor-cell { display: inline-block; text-align: center; line-height: 1.4; }
.factor-val { font-weight: 600; color: var(--primary, #0b294a); }
.factor-unit { font-size: 10px; color: #c0c4cc; }
.text-neg { color: #67C23A !important; }
.text-max { color: #E6A23C !important; }
.uncertainty-txt { font-size: 11px; color: #909399; margin-left: 4px; vertical-align: middle;}

/* 瀑布图 */
.waterfall-chart { padding: 20px 10px; }
.wf-bar-wrapper {
  display: flex; align-items: center; margin-bottom: 8px; font-size: 12px;
}
.wf-bar-label {
  width: 150px; text-align: right; padding-right: 10px;
  color: #606266; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.wf-chart-area {
  flex: 1; height: 28px; position: relative;
}
.wf-bar-bg {
  position: absolute; top: 10px; left: 0; right: 0; height: 8px; background: #ebeef5; border-radius: 4px;
}
.wf-bar-start {
  position: absolute; top: 0; bottom: 0; background: transparent;
}
.wf-bar-value {
  position: absolute; top: 2px; height: 24px;
  border-radius: 4px; display: flex; align-items: center; justify-content: center;
  transition: all 0.5s ease;
}
.wf-bar-tip {
  color: #fff; font-size: 11px; font-weight: 600;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  white-space: nowrap;
}
.wf-running-total {
  width: 80px; text-align: left; padding-left: 10px;
  font-family: monospace; font-size: 11px; font-weight: 600;
}

/* 详情弹窗 */
.factor-detail-box { display: flex; align-items: baseline; gap: 8px; }
.factor-big { font-size: 24px; font-weight: 700; color: var(--primary, #0b294a); font-family: monospace; }
.factor-unit-lg { color: #909399; }
.factor-meta { font-size: 12px; color: #909399; margin-top: 4px; }
.formula-input { font-family: monospace; }
.result-big { font-size: 28px; font-weight: 700; color: #F56C6C; }
.result-unit { color: #909399; font-size: 14px; margin-left: 4px; }

.monthly-chart {
  display: flex; align-items: flex-end; gap: 6px;
  height: 160px; padding: 10px 0; border-bottom: 1px solid #ebeef5;
}
.m-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; }
.m-month { font-size: 10px; color: #909399; margin-bottom: 4px; }
.m-track {
  flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center;
}
.m-fill {
  width: 70%; background: linear-gradient(to top, var(--primary, #0b294a), var(--primary-light, #183f6c)); border-radius: 3px 3px 0 0;
  min-height: 4px; transition: height 0.5s;
}
.m-val { font-size: 10px; color: #606266; margin-top: 4px; font-family: monospace; }

.no-monthly-data {
  text-align: center; padding: 30px; color: #c0c4cc;
}
.no-monthly-data i { font-size: 32px; }
.no-monthly-data p { margin: 8px 0 0; }

/* ==================== 深色主题自适应覆盖 ==================== */
.theme-dark .emission-detail {
  background: transparent !important;
}
.theme-dark .summary-card {
  background: rgba(9, 20, 38, 0.7) !important;
  border: 1px solid rgba(0, 229, 255, 0.25) !important;
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.06) !important;
}
.theme-dark .summary-lbl {
  color: #94a3b8 !important;
}
.theme-dark .category-card {
  background: rgba(9, 20, 38, 0.7) !important;
  border: 1px solid rgba(0, 229, 255, 0.2) !important;
  color: #ffffff !important;
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.06) !important;
}
.theme-dark .category-card h3 {
  color: #ffffff !important;
}
.theme-dark .cat-pct {
  color: #64748b !important;
}
.theme-dark .mini-bar-row {
  border-bottom: 1px dashed rgba(255, 255, 255, 0.08) !important;
}
.theme-dark .mini-bar-row:hover {
  background: rgba(0, 229, 255, 0.08) !important;
}
.theme-dark .mini-bar-row.highlight {
  background: rgba(230, 162, 44, 0.15) !important;
}
.theme-dark .mb-name {
  color: #e2e8f0 !important;
}
.theme-dark .mb-name:hover {
  color: #00e5ff !important;
}
.theme-dark .mb-track {
  background: rgba(255, 255, 255, 0.05) !important;
}
.theme-dark .wf-bar-bg {
  background: rgba(255, 255, 255, 0.05) !important;
}
.theme-dark .wf-bar-label {
  color: #94a3b8 !important;
}
.theme-dark .wf-running-total {
  color: #e2e8f0 !important;
}
.theme-dark .monthly-chart {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
}
.theme-dark .m-month,
.theme-dark .m-val {
  color: #94a3b8 !important;
}
.theme-dark .no-monthly-data {
  color: #64748b !important;
}
</style>
