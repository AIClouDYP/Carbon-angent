<template>
  <div class="data-collection-page">
    <div class="page-header">
      <el-page-header @back="$router.back()" :content="`数据采集 — ${taskInfo.productName || '核算任务'}`"></el-page-header>
      <div class="header-actions">
        <el-button size="small" icon="el-icon-upload2" type="primary" plain @click="showImportDialog = true">批量导入</el-button>
        <el-button size="small" icon="el-icon-download">下载Excel模板</el-button>
        <el-badge :value="qualityIssues" :hidden="qualityIssues === 0">
          <el-button size="small" icon="el-icon-check" :type="allValid ? 'success' : 'warning'"
            @click="validateAll">{{ allValid ? '数据校验通过' : `有${qualityIssues}项需修正` }}</el-button>
        </el-badge>
        <el-button size="small" type="primary" icon="el-icon-right" @click="submitData"
          :disabled="!allValid">提交并进入下一步</el-button>
      </div>
    </div>

    <div class="page-body">

    <!-- 数据采集状态概览 -->
    <el-row :gutter="16" class="dc-overview">
      <el-col :span="6">
        <div class="dc-stat dc-stat--total">
          <i class="el-icon-s-grid"></i>
          <span class="dc-stat-num">{{ dataSourceList.length }}</span>
          <span class="dc-stat-label">排放源总数</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="dc-stat dc-stat--filled">
          <i class="el-icon-circle-check"></i>
          <span class="dc-stat-num">{{ filledCount }}</span>
          <span class="dc-stat-label">已填写</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="dc-stat dc-stat--partial">
          <i class="el-icon-warning-outline"></i>
          <span class="dc-stat-num">{{ partialCount }}</span>
          <span class="dc-stat-label">部分填写</span>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="dc-stat dc-stat--empty">
          <i class="el-icon-circle-close"></i>
          <span class="dc-stat-num">{{ emptyCount }}</span>
          <span class="dc-stat-label">未填写</span>
        </div>
      </el-col>
    </el-row>

    <!-- 按类别分组的数据表单 -->
    <div v-for="cat in categoriesWithSources" :key="cat.id" class="category-group"
      :id="'group-' + cat.id">
      <el-card shadow="hover" class="category-card">
        <div slot="header" class="cat-header">
          <div class="cat-left">
            <span class="cat-dot" :style="{ background: cat.color }"></span>
            <h3>{{ cat.name }}</h3>
            <el-tag size="small" type="info">{{ cat.sources.length }}个排放源</el-tag>
            <span class="cat-fill-rate">
              填写率:
              <el-progress :percentage="getCategoryFillRate(cat)" :stroke-width="10"
                :text-inside="true" style="width: 100px; display:inline-block;" :color="fillColor(cat)"></el-progress>
            </span>
          </div>
          <el-button size="mini" icon="el-icon-magic-stick" type="primary" plain
            @click="autoFillCategory(cat)">智能补全</el-button>
        </div>

        <!-- 排放源数据录入行 -->
        <el-form ref="form" :model="formData" label-position="top" size="small">
          <table class="source-table">
            <thead>
              <tr>
                <th width="40">#</th>
                <th width="260">排放源名称 / 活动类型</th>
                <th width="140">原始数值</th>
                <th width="90">单位</th>
                <th width="140">数据来源方式</th>
                <th width="180">佐证材料</th>
                <!-- <th width="100">数据质量</th> -->
                <th width="80">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(src, idx) in cat.sources" :key="src.id"
                :class="{ 'row-empty': !isFilled(src), 'row-warning': hasWarning(src), 'row-error': hasError(src) }">
                <td align="center">
                  <el-tooltip v-if="src.isMaxContributor" content="最大贡献排放源 ★" placement="top">
                    <i class="el-icon-star-on star-icon"></i>
                  </el-tooltip>
                  <span v-else>{{ idx + 1 }}</span>
                </td>
                <td>
                  <div class="source-name-cell">
                    <strong>{{ src.name }}</strong>
                    <span class="activity-tag">{{ src.activity }}</span>
                    <el-tag v-if="src.note" size="mini" type="info" class="note-tag">{{ src.note }}</el-tag>
                  </div>
                </td>
                <td>
                  <el-input-number v-model="formData[src.id].value"
                    :precision="getPrecision(src.unit)" :step="getStep(src.unit)"
                    placeholder="输入数值" controls-position="right"
                    style="width: 130px;" size="mini"
                    @change="(val) => onValueChange(src, val)">
                  </el-input-number>
                </td>
                <td>
                  <el-select v-model="formData[src.id].unit" filterable allow-create
                    default-first-option size="mini" style="width: 85px;"
                    @change="(val) => onUnitChange(src, val)">
                    <el-option v-for="u in unitOptions" :key="u.value" :label="u.label" :value="u.value"></el-option>
                  </el-select>
                </td>
                <td>
                  <el-select v-model="formData[src.id].dataSourceType" size="mini" style="width: 145px;">
                    <el-option label="手动填报" value="manual"></el-option>
                    <el-option label="物联网自动采集" value="iot_auto"></el-option>
                    <el-option label="系统自动计算" value="system_calc"></el-option>
                    <el-option label="供应商提供" value="supplier"></el-option>
                    <el-option label="文献引用" value="literature"></el-option>
                    <el-option label="行业估算" value="estimate"></el-option>
                  </el-select>
                </td>
                <td>
                  <div class="attachment-area">
                    <el-button size="mini" icon="el-icon-paperclip" circle plain
                      @click="triggerUpload(src.id)"></el-button>
                    <span v-if="formData[src.id].attachments && formData[src.id].attachments.length" class="attach-count">
                      {{ formData[src.id].attachments.length }}个附件
                    </span>
                    <input type="file" :ref="'file_' + src.id" hidden multiple accept=".jpg,.png,.pdf,.xlsx,.csv"
                      @change="(e) => handleFileUpload(src.id, e)" />
                  </div>
                </td>
                <td align="center">
                  <!-- <div :class="['quality-indicator', getQualityClass(src)]" :title="getQualityTip(src)">
                    {{ qualityLabel(getQualityLevel(src)) }}
                  </div> -->
                </td>
                <td align="center">
                  <el-button size="mini" icon="el-icon-refresh" circle plain title="重置为模型默认值"
                    @click="resetToDefault(src)"></el-button>
                  <el-button size="mini" icon="el-icon-view" circle plain type="primary"
                    title="查看详情/历史数据" @click="viewSourceHistory(src)"></el-button>
                </td>
              </tr>
            </tbody>
          </table>
        </el-form>
      </el-card>
    </div>
    </div>

    <!-- 批量导入对话框 -->
    <el-dialog title="批量导入数据" :visible.sync="showImportDialog" width="560px">
      <el-alert title="请先下载模板，按格式填写后上传。支持 .xlsx 和 .csv 格式。" type="info" :closable="false"
        show-icon></el-alert>
      <div class="import-steps" style="margin-top: 20px;">
        <el-steps :active="importStep" simple finish-status="success">
          <el-step title="下载模板"></el-step>
          <el-step title="填写数据"></el-step>
          <el-step title="上传文件"></el-step>
          <el-step title="确认导入"></el-step>
        </el-steps>
      </div>
      <div style="margin-top: 24px;">
        <el-upload drag action="#" :auto-upload="false" :limit="1" accept=".xlsx,.csv"
          :on-change="handleImportFile" :file-list="importFiles">
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        </el-upload>
      </div>
      <div slot="footer">
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmImport" :disabled="!importFiles.length">确认导入</el-button>
      </div>
    </el-dialog>

    <!-- 数据历史弹窗 -->
    <el-dialog :visible.sync="historyVisible" :title="`历史数据 — ${(currentSource || {}).name || ''}`" width="700px">
      <template v-if="currentSource && currentSource.detail && currentSource.detail.monthlyData">
        <div class="history-chart">
          <div class="hc-bar-container">
            <div v-for="m in currentSource.detail.monthlyData" :key="m.month" class="hc-bar-wrap">
              <div class="hc-bar-outer">
                <div class="hc-bar-inner" :style="{ height: (m.value / maxHistVal * 100) + '%' }">
                  <span class="hc-val">{{ m.value }}</span>
                </div>
              </div>
              <span class="hc-month">{{ m.month.slice(5) }}</span>
            </div>
          </div>
        </div>
        <el-descriptions :column="3" border size="small" style="margin-top: 16px;">
          <el-descriptions-item label="计量设备ID">{{ currentSource.detail.meterId || '—' }}</el-descriptions-item>
          <el-descriptions-item label="采集方式">{{ currentSource.detail.collectionMethod || '—' }}</el-descriptions-item>
          <el-descriptions-item label="年度合计">
            <strong>{{ currentSource.detail.monthlyData.reduce((s,m) => s+m.value, 0).toFixed(1) }}</strong> kWh
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <el-empty v-else description="暂无历史数据" :image-size="100"></el-empty>
    </el-dialog>
  </div>
</template>

<script>
import { mockEmissionCategories } from './mock/data'

export default {
  name: 'DataCollection',
  data() {
    // 初始化表单数据结构
    const formData = {}
    for (const cat of mockEmissionCategories) {
      for (const src of cat.children) {
        formData[src.id] = {
          value: null,
          unit: src.unit,
          dataSourceType: src.dataSource && src.dataSource.includes('电表') ? 'iot_auto' :
                         src.dataSource && src.dataSource.includes('发票') ? 'manual' :
                         src.dataSource && src.dataSource.includes('供应商') ? 'supplier' : 'manual',
          attachments: [],
          notes: ''
        }
      }
    }

    return {
      taskInfo: { productName: '新能源汽车 EV700' },
      categories: mockEmissionCategories,
      formData,
      showImportDialog: false,
      importStep: 2,
      importFiles: [],
      historyVisible: false,
      currentSource: null,

      unitOptions: [
        { label: 'kWh', value: 'kWh' }, { label: 'm³', value: 'm³' },
        { label: 'L', value: 'L' }, { label: 'kg', value: 'kg' },
        { label: 't', value: 't' }, { label: 't·km', value: 't·km' },
        { label: 'pcs', value: 'pcs' }, { label: 'km', value: 'km' },
        { label: 'kg焊剂', value: 'kg焊剂' }, { label: 'MJ', value: 'MJ' },
        { label: 'kW', value: 'kW' }, { label: 'tCO₂e', value: 'tCO₂e' }
      ]
    }
  },
  computed: {
    categoriesWithSources() {
      return this.categories.map(cat => ({
        ...cat,
        sources: cat.children
      }))
    },
    dataSourceList() {
      const list = []
      for (const cat of this.categories) list.push(...cat.children)
      return list
    },
    filledCount() {
      return this.dataSourceList.filter(s => this.isFilled(s)).length
    },
    partialCount() {
      return this.dataSourceList.filter(s => this.formData[s.id] && this.formData[s.id].value != null && this.formData[s.id].unit !== s.unit).length
    },
    emptyCount() {
      return this.dataSourceList.length - this.filledCount - this.partialCount
    },
    allValid() {
      return this.qualityIssues === 0 && this.filledCount === this.dataSourceList.length
    },
    qualityIssues() {
      let issues = 0
      for (const s of this.dataSourceList) {
        if (!this.isFilled(s)) issues++
        else if (this.hasWarning(s)) issues++
        else if (this.hasError(s)) issues++
      }
      return issues
    },
    maxHistVal() {
      if (!this.currentSource || !this.currentSource.detail || !this.currentSource.detail.monthlyData) return 1
      return Math.max(...this.currentSource.detail.monthlyData.map(m => m.value))
    }
  },
  methods: {
    isFilled(src) {
      const d = this.formData[src.id]
      return d && d.value != null && d.value !== '' && d.unit
    },
    hasWarning(src) {
      const d = this.formData[src.id]
      if (!d || !d.value) return false
      // Mock：如果值为负数则警告
      return d.value < 0
    },
    hasError(src) {
      const d = this.formData[src.id]
      if (!d || !d.value) return false
      // Mock：单位不匹配则报错
      return d.unit !== src.unit && !d.unit
    },
    getQualityLevel(src) {
      if (!this.isFilled(src)) return 'EMPTY'
      const d = this.formData[src.id]
      if (d.dataSourceType === 'iot_auto') return 'EXCELLENT'
      if (d.dataSourceType === 'supplier' || d.dataSourceType === 'manual') return 'GOOD'
      if (d.dataSourceType === 'estimate') return 'MODERATE'
      return 'POOR'
    },
    getQualityClass(src) {
      const level = this.getQualityLevel(src)
      return { EXCELLENT: 'q-excellent', GOOD: 'q-good', MODERATE: 'q-moderate', POOR: 'q-poor', EMPTY: 'q-empty' }[level]
    },
    getQualityTip(src) {
      const level = this.getQualityLevel(src)
      return { EXCELLENT: '优秀 — 物联网自动采集', GOOD: '良好 — 有据可查', MODERATE: '一般 — 估算值', POOR: '较差 — 缺少佐证', EMPTY: '未填写' }[level] || level
    },
    getCategoryFillRate(cat) {
      if (!cat.sources.length) return 0
      const filled = cat.sources.filter(s => this.isFilled(s)).length
      return Math.round(filled / cat.sources.length * 100)
    },
    fillColor(cat) {
      const rate = this.getCategoryFillRate(cat)
      if (rate >= 90) return '#67C23A'
      if (rate >= 50) return '#E6A23C'
      return '#F56C6C'
    },
    qualityLabel(level) {
      return { EXCELLENT: '优', GOOD: '良', MODERATE: '中', POOR: '差', EMPTY: '空' }[level] || level
    },
    getPrecision(unit) {
      if (unit === 'kWh' || unit === 'L' || unit === 'm³') return 0
      if (unit === 'kg' || unit === 't·km' || unit === 'pcs') return 1
      if (unit === 't') return 2
      return 2
    },
    getStep(unit) {
      if (unit === 'kWh') return 10
      if (unit === 'm³' || unit === 'L') return 1
      if (unit === 't·km') return 10
      return 1
    },
    onValueChange(src, val) {},
    onUnitChange(src, val) {},
    triggerUpload(id) {
      const ref = this.$refs['file_' + id]
      if (ref && ref[0]) ref[0].click()
    },
    handleFileUpload(srcId, e) {
      const files = e.target.files
      if (!files.length) return
      const names = Array.from(files).map(f => f.name)
      if (!this.formData[srcId].attachments) this.formData[srcId].attachments = []
      this.formData[srcId].attachments.push(...names)
      this.$message.success(`已添加 ${names.length} 个附件`)
      e.target.value = '' // reset
    },
    resetToDefault(src) {
      this.$set(this.formData[src.id], 'value', src.value)
      this.$set(this.formData[src.id], 'unit', src.unit)
      this.$message.info(`已重置为默认值: ${src.value} ${src.unit}`)
    },
    autoFillCategory(cat) {
      this.$confirm(`AI 将根据历史数据和行业基准自动补全「${cat.name}」类别下所有未填写的排放源，是否继续？`, '智能补全确认', {
        confirmButtonText: '开始补全',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        const loading = this.$loading({ text: 'AI正在分析并填充数据...' })
        setTimeout(() => {
          let filled = 0
          for (const src of cat.sources) {
            if (!this.isFilled(src)) {
              this.$set(this.formData[src.id], 'value', src.value)
              this.$set(this.formData[src.id], 'dataSourceType', 'estimate')
              filled++
            }
          }
          loading.close()
          this.$message.success(`智能补全完成！已自动填充 ${filled} 个排放源数据（标记为估算）`)
        }, 1500)
      }).catch(() => {})
    },
    validateAll() {
      const issues = this.qualityIssues
      if (issues === 0) {
        this.$message.success('✅ 全部数据校验通过，可以提交！')
      } else {
        this.$message.warning(`⚠️ 发现 ${issues} 个问题，请在上方表格中检查标红的行。`)
        // 滚动到第一个问题行
        const firstIssue = document.querySelector('.row-error, .row-empty')
        if (firstIssue) firstIssue.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    },
    submitData() {
      if (!this.allValid) {
        this.$message.warning('请先解决所有数据质量问题后再提交')
        return
      }
      this.$confirm('确认提交全部数据？提交后将进入核算执行阶段。', '确认提交', {
        type: 'info'
      }).then(() => {
        const loading = this.$loading({ text: '正在提交数据...' })
        setTimeout(() => {
          loading.close()
          this.$message.success('数据已成功提交，正在跳转到任务详情...')
          setTimeout(() => {
            this.$router.push('/footprint/accounting/agent?direct=true&id=TASK-20260624002')
          }, 800)
        }, 1200)
      }).catch(() => {})
    },
    viewSourceHistory(src) {
      this.currentSource = src
      this.historyVisible = true
    },
    handleImportFile(file) {
      this.importStep = 3
      this.importFiles = [file]
    },
    confirmImport() {
      const loading = this.$loading({ text: '正在解析导入文件...' })
      setTimeout(() => {
        loading.close()
        this.showImportDialog = false
        this.importFiles = []
        this.importStep = 1
        this.$message.success('数据导入成功！共覆盖 12 个排放源的原始数据')
      }, 2000)
    }
  }
}
</script>

<style scoped>
.data-collection-page {
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

/* 统计卡片 */
.dc-overview { margin-bottom: 20px; }
.dc-stat {
  display: flex; align-items: center; gap: 12px;
  padding: 18px 20px; border-radius: 8px; background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.dc-stat i { font-size: 28px; opacity: 0.7; }
.dc-stat--total i { color: #303133; }
.dc-stat--filled i { color: #67C23A; }
.dc-stat--partial i { color: #E6A23C; }
.dc-stat--empty i { color: #c0c4cc; }
.dc-stat-num { font-size: 26px; font-weight: 700; color: #303133; line-height: 1; }
.dc-stat-label { font-size: 12px; color: #909399; margin-top: 4px; }

/* 分类组 */
.category-group { margin-bottom: 18px; }
.category-card { border-radius: 8px; overflow: hidden; }
.cat-header {
  display: flex; justify-content: space-between; align-items: center;
}
.cat-left { display: flex; align-items: center; gap: 10px; }
.cat-left h3 { margin: 0; font-size: 15px; }
.cat-dot { width: 4px; height: 20px; border-radius: 2px; display: inline-block; }
.cat-fill-rate {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; color: #909399;
}

/* 数据表格 */
.source-table {
  width: 100%; border-collapse: collapse;
}
.source-table th {
  background: #fafbfc; color: #606266; font-size: 12px;
  padding: 10px 12px; text-align: left; border-bottom: 2px solid #ebeef5; font-weight: 600;
}
.source-table td {
  padding: 14px 10px; border-bottom: 1px solid #f0f0f0; vertical-align: middle;
}

.row-empty td { background: #fef0f0; } /* 未填红色底 */
.row-error td { background: #fef0f0; }
.row-warning td { background: #fdf6ec; }

.source-name-cell strong { display: block; font-size: 13px; color: #303133; }
.activity-tag {
  font-size: 11px; color: #909399; background: #f4f4f5; padding: 1px 6px; border-radius: 3px;
}
.note-tag { margin-left: 6px; }

.star-icon { color: #E6A23C; font-size: 15px; }

.attachment-area { display: flex; align-items: center; gap: 4px; }
.attach-count { font-size: 11px; color: var(--primary, #0b294a); }

/* 质量指示器 */
.quality-indicator {
  display: inline-block; padding: 3px 10px; border-radius: 10px;
  font-size: 11px; font-weight: 600; text-align: center; min-width: 36px;
}
.q-excellent { background: #f0f9eb; color: #67C23A; }
.q-good { background: var(--primary-bg, #eef4fa); color: var(--primary, #0b294a); }
.q-moderate { background: #fdf6ec; color: #E6A23C; }
.q-poor { background: #fef0f0; color: #F56C6C; }
.q-empty { background: #f4f4f5; color: #c0c4cc; }

/* 历史图表 */
.hc-bar-container {
  display: flex; align-items: flex-end; gap: 8px; height: 200px;
  padding: 20px 0; border-bottom: 2px solid #ebeef5;
}
.hc-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; }
.hc-bar-outer { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; }
.hc-bar-inner {
  width: 70%; background: linear-gradient(to top, var(--primary, #0b294a), var(--primary-light, #183f6c)); border-radius: 4px 4px 0 0;
  position: relative; min-height: 4px; transition: height 0.5s ease;
  display: flex; align-items: flex-start; justify-content: center; padding-top: 4px;
}
.hc-val { font-size: 10px; color: #fff; font-family: monospace; white-space: nowrap; }
.hc-month { font-size: 11px; color: #909399; margin-top: 6px; }
</style>
