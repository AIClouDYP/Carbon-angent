<template>
  <div class="standards-library-page">
    <!-- 页头：编号 + 名称 + 状态标签 -->
    <div class="page-header">
      <div class="header-left">
        <el-button size="small" icon="el-icon-back" @click="goBack" class="back-btn">返回列表</el-button>
        <h2 class="page-title">
          <i class="el-icon-collection"></i>
          <span v-if="form">{{ form.code || '（无编号）' }}</span>
          <span v-else>政策标准库 · 详情</span>
          <span v-if="form && form.name" class="title-name">{{ form.name }}</span>
          <template v-if="form">
            <el-tag v-if="form.version" size="small" style="margin-left:8px;">{{ form.version }}</el-tag>
            <el-tag size="small" :type="form.status === '现行' ? 'success' : 'info'" style="margin-left:6px;">{{ form.status }}</el-tag>
            <el-tag size="small" :type="parseStatusTagType(form.parseStatus)" style="margin-left:6px;">{{ parseStatusText(form.parseStatus) }}</el-tag>
          </template>
        </h2>
        <p class="page-desc">标准配置的查看与编辑；修改保存后对智能体生效。</p>
      </div>
      <div class="header-right">
        <el-button type="primary" size="small" icon="el-icon-check" :loading="saving" @click="saveDetail">保存修改</el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" v-loading="true" class="detail-loading"></div>

    <!-- 未找到 -->
    <el-empty v-else-if="!form" description="未找到该标准条目（标识可能已变更）">
      <el-button size="small" @click="goBack">返回列表</el-button>
    </el-empty>

    <template v-else>
      <div class="detail-body">
      <!-- 解析概览 -->
      <div class="detail-card overview-card">
        <div class="card-title"><i class="el-icon-data-analysis"></i> 解析概览<span class="card-hint">结构化解析由 Skill 驱动生成</span></div>
        <div class="overview-grid">
          <div class="ov-item">
            <span class="ov-label">解析技能</span>
            <span class="ov-value">{{ form.parseSkillName || '—' }}</span>
          </div>
          <div class="ov-item">
            <span class="ov-label">解析时间</span>
            <span class="ov-value">{{ form.parseTime || '—' }}</span>
          </div>
          <div class="ov-item">
            <span class="ov-label">提取结果</span>
            <span class="ov-value">
              参数 {{ (structured.params || []).length }} ·
              指标 {{ (structured.indicators || []).length }} ·
              权重 {{ (structured.weights || []).length }} ·
              公式 {{ (structured.formulas || []).length }}
            </span>
          </div>
        </div>
      </div>

      <!-- 基本信息（精简：类型 / 机构 / 年份 / 场景 / 简介） -->
      <div class="detail-card">
        <div class="card-title"><i class="el-icon-document"></i> 基本信息<span class="card-hint">文件属性可编辑，修改后同步至标准库</span></div>
        <el-form :model="form" ref="baseForm" label-width="80px" size="small" class="detail-form">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item label="类型">
                <el-select v-model="form.type" style="width:100%">
                  <el-option v-for="t in typeOptions" :key="t" :label="t" :value="t"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="发布机构">
                <el-input v-model="form.issuer" placeholder="如 ISO / 国家市场监督管理总局"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="发布年份">
                <el-input-number v-model="form.yearNum" :min="1990" :max="2099" :controls="false" style="width:100%;" placeholder="如 2024"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="业务场景">
                <el-select v-model="form.scenarios" multiple collapse-tags style="width:100%" placeholder="选择适用场景">
                  <el-option v-for="sc in scenarioEnum" :key="sc.key" :label="sc.label" :value="sc.key"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="简介">
            <el-input type="textarea" :rows="2" v-model="form.desc" placeholder="标准内容简介"></el-input>
          </el-form-item>
          <el-alert v-if="form.parseStatus === 'rejected' && form.rejectReason" :title="'驳回原因：' + form.rejectReason" type="error" :closable="false" style="margin-bottom:12px;"></el-alert>
          <!-- 人工审核入口（待确认状态） -->
          <div v-if="form.parseStatus === 'pending'" class="detail-audit">
            <span class="detail-audit-tip"><i class="el-icon-warning-outline"></i> 该标准待人工确认，确认通过后方可对智能体生效</span>
            <div>
              <el-button type="primary" size="small" @click="approveStandard">确认通过</el-button>
              <el-button type="danger" size="small" plain @click="rejectStandard">驳回</el-button>
            </div>
          </div>
        </el-form>
      </div>


      <!-- 结构化解析内容区（可编辑） -->
      <div class="detail-card">
        <div class="card-title"><i class="el-icon-cpu"></i> 结构化解析内容<span class="card-hint">（机器可读规则，供智能体直接消费）</span></div>

        <!-- 核算标准：六维度配置包 -->
        <template v-if="structured.kind === 'accounting'">
          <!-- R040201 STORY-004：参数化配置（params，机器可执行，逐条挂条款溯源） -->
          <div v-if="structured.params && structured.params.length" class="dim-block">
            <div class="dim-label">参数化配置（{{ structured.scenarioKind || 'PCF' }} 场景 · 每条参数须挂条款溯源，RULE-005）</div>
            <el-table :data="structured.params" border size="mini">
              <el-table-column label="参数键" width="190">
                <template slot-scope="{ row }">
                  <span class="code-font">{{ row.key }}</span>
                  <div style="font-size:11px;color:#909399;">{{ pcfParamLabels[row.key] || '—' }}</div>
                </template>
              </el-table-column>
              <el-table-column label="参数值" min-width="180">
                <template slot-scope="{ row }">
                  <el-input v-if="!Array.isArray(row.value) && typeof row.value !== 'boolean'" size="mini" v-model="row.value"></el-input>
                  <el-select v-else-if="Array.isArray(row.value) && row.value.every(v => typeof v === 'string' || typeof v === 'number')" size="mini" v-model="row.value" multiple filterable allow-create default-first-option style="width:100%">
                    <el-option v-for="v in row.value" :key="v" :label="v" :value="v"></el-option>
                  </el-select>
                  <el-input v-else size="mini" :value="JSON.stringify(row.value)" @input="row.value = $event ? JSON.parse($event) : null"></el-input>
                </template>
              </el-table-column>
              <el-table-column label="条款溯源（出自标准原文）" min-width="260">
                <template slot-scope="{ row }">
                  <div v-for="(c, ci) in row.clauseRefs" :key="ci" class="point-row" style="margin-bottom:4px;">
                    <el-input size="mini" v-model="row.clauseRefs[ci]" placeholder="条款位置或摘录"></el-input>
                    <el-button size="mini" type="text" class="btn-danger" @click="row.clauseRefs.splice(ci, 1)">删</el-button>
                  </div>
                  <el-button size="mini" type="text" icon="el-icon-plus" @click="row.clauseRefs.push('')">添加溯源</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- R040201 STORY-007：版本差异（生效时自动生成） -->
          <div v-if="structured.diffs && structured.diffs.length" class="dim-block">
            <div class="dim-label">版本差异（与上一生效版本对比，RULE-008）</div>
            <el-table :data="structured.diffs" border size="mini">
              <el-table-column label="差异类型" width="100" align="center">
                <template slot-scope="{ row }">
                  <el-tag size="mini" :type="row.type === 'added' ? 'success' : (row.type === 'removed' ? 'danger' : 'warning')">
                    {{ { added: '新增', removed: '删除', changed: '变更' }[row.type] || row.type }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="参数" width="180">
                <template slot-scope="{ row }">{{ row.label || row.key }}</template>
              </el-table-column>
              <el-table-column label="旧值" min-width="140">
                <template slot-scope="{ row }"><span class="code-font">{{ row.oldValue || '—' }}</span></template>
              </el-table-column>
              <el-table-column label="新值" min-width="140">
                <template slot-scope="{ row }"><span class="code-font">{{ row.newValue || '—' }}</span></template>
              </el-table-column>
            </el-table>
          </div>

          <div v-for="dim in structured.dimensions" :key="dim.key" class="dim-block">
            <div class="dim-label">{{ dim.label }}</div>
            <div v-for="(p, pi) in dim.points" :key="pi" class="point-row">
              <el-input size="small" v-model="dim.points[pi]" placeholder="输入条款内容"></el-input>
              <el-button size="mini" type="text" class="btn-danger" @click="removePoint(dim, pi)">删除</el-button>
            </div>
            <el-button size="mini" plain icon="el-icon-plus" @click="addPoint(dim)">添加条款</el-button>
          </div>
        </template>

        <!-- 申报政策：申报条件 + 指标体系 + 材料要求 + 映射关系 -->
        <template v-else>
          <div class="dim-block">
            <div class="dim-label">申报条件</div>
            <div v-for="(c, ci) in structured.applyConditions" :key="ci" class="point-row">
              <el-input size="small" v-model="structured.applyConditions[ci]" placeholder="输入申报条件"></el-input>
              <el-button size="mini" type="text" class="btn-danger" @click="structured.applyConditions.splice(ci, 1)">删除</el-button>
            </div>
            <el-button size="mini" plain icon="el-icon-plus" @click="structured.applyConditions.push('')">添加条件</el-button>
          </div>

          <div class="dim-block">
            <div class="dim-label">指标体系（核心指标两级要求 · 统计口径 · 权重与星级规则）</div>
            <el-table :data="structured.indicators" border size="mini">
              <el-table-column label="指标" min-width="160">
                <template slot-scope="{ row }">
                  <el-input size="mini" v-model="row.name"></el-input>
                </template>
              </el-table-column>
              <el-table-column label="基本要求" min-width="120">
                <template slot-scope="{ row }">
                  <el-input size="mini" v-model="row.basic"></el-input>
                </template>
              </el-table-column>
              <el-table-column label="目标要求" min-width="120">
                <template slot-scope="{ row }">
                  <el-input size="mini" v-model="row.target"></el-input>
                </template>
              </el-table-column>
              <el-table-column label="统计口径" min-width="140">
                <template slot-scope="{ row }">
                  <el-input size="mini" v-model="row.caliber"></el-input>
                </template>
              </el-table-column>
              <el-table-column label="权重(%)" width="90" align="center">
                <template slot-scope="{ row }">
                  <el-input size="mini" v-model="row.weight" placeholder="如 15"></el-input>
                </template>
              </el-table-column>
              <el-table-column label="星级规则" min-width="110">
                <template slot-scope="{ row }">
                  <el-input size="mini" v-model="row.starRule" placeholder="如 三星需达标"></el-input>
                </template>
              </el-table-column>
              <el-table-column label="类别" width="110" align="center">
                <template slot-scope="{ row }">
                  <el-select size="mini" v-model="row.required" style="width:100%">
                    <el-option label="必选项" value="必选项"></el-option>
                    <el-option label="加分项" value="加分项"></el-option>
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column width="60" align="center">
                <template slot-scope="{ $index }">
                  <el-button size="mini" type="text" class="btn-danger" @click="structured.indicators.splice($index, 1)">删</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button size="mini" plain icon="el-icon-plus" style="margin-top:6px;" @click="structured.indicators.push({ name: '', basic: '', target: '', caliber: '', weight: '', starRule: '', required: '必选项' })">添加指标</el-button>
            <div style="font-size:12px;color:#909399;margin-top:4px;">权重合计须为 100%（RULE-014）；必选项供评价引擎一票否决判定（RULE-015）。</div>
          </div>

          <div class="dim-block">
            <div class="dim-label">证明材料要求</div>
            <div v-for="(m, mi) in structured.materialRequirements" :key="mi" class="point-row">
              <el-input size="small" v-model="structured.materialRequirements[mi]" placeholder="输入证明材料要求"></el-input>
              <el-button size="mini" type="text" class="btn-danger" @click="structured.materialRequirements.splice(mi, 1)">删除</el-button>
            </div>
            <el-button size="mini" plain icon="el-icon-plus" @click="structured.materialRequirements.push('')">添加材料要求</el-button>
          </div>

          <div class="dim-block">
            <div class="dim-label">指标映射关系（指标 ↔ 数据源 / 因子 / 公式）</div>
            <el-table :data="structured.mappings" border size="mini">
              <el-table-column label="指标" min-width="160">
                <template slot-scope="{ row }"><el-input size="mini" v-model="row.indicator"></el-input></template>
              </el-table-column>
              <el-table-column label="数据源" min-width="140">
                <template slot-scope="{ row }"><el-input size="mini" v-model="row.dataSource"></el-input></template>
              </el-table-column>
              <el-table-column label="因子类别" min-width="140">
                <template slot-scope="{ row }"><el-input size="mini" v-model="row.factorCategory"></el-input></template>
              </el-table-column>
              <el-table-column label="核算公式" min-width="110">
                <template slot-scope="{ row }"><el-input size="mini" v-model="row.formula"></el-input></template>
              </el-table-column>
              <el-table-column width="60" align="center">
                <template slot-scope="{ $index }">
                  <el-button size="mini" type="text" class="btn-danger" @click="structured.mappings.splice($index, 1)">删</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button size="mini" plain icon="el-icon-plus" style="margin-top:6px;" @click="structured.mappings.push({ indicator: '', dataSource: '', factorCategory: '', formula: '' })">添加映射</el-button>
          </div>
        </template>

        <el-empty v-if="!structured" description="该条目尚未结构化解析"></el-empty>
      </div>
      </div>
    </template>
  </div>
</template>

<script>
import { SCENARIOS, recordDiffOnApprove, validateIndicatorsWeight, PCF_PARAM_LABELS } from '@/utils/policyStandardService'

export default {
  name: 'StandardsDetail',
  data() {
    return {
      loading: true,
      saving: false,
      form: null,            // 基本信息（可编辑）
      structured: null,      // 结构化内容（可编辑，与 form.structured 同步）
      typeOptions: ['国际标准', '国家标准', '行业标准', '规范/指南', '政策文件'],
      scenarioEnum: SCENARIOS,
      pcfParamLabels: PCF_PARAM_LABELS
    }
  },
  computed: {
    // 唯一标识：code + version 组合（同编号多版本并存）
    itemKey() {
      return (this.$route.query.code || '') + '@' + (this.$route.query.version || '')
    }
  },
  created() {
    this.loadDetail()
  },
  methods: {
    // 从数据源（localStorage）按唯一标识定位并加载单条详情
    loadDetail() {
      this.loading = true
      try {
        const saved = localStorage.getItem('carbon-library-standards-v2')
        let list = saved ? JSON.parse(saved) : []
        const item = list.find(s => (s.code || '') + '@' + (s.version || '') === this.itemKey)
        if (item) {
          this.form = {
            code: item.code,
            name: item.name,
            type: item.type,
            scope: item.scope,
            scenarios: item.scenarios || [],
            issuer: item.issuer,
            year: item.year || '',
            yearNum: parseInt(item.year) || new Date().getFullYear(),
            version: item.version,
            status: item.status || '现行',
            parseStatus: item.parseStatus || '未解析',
            rejectReason: item.rejectReason || '',
            desc: item.desc || ''
          }
          // 结构化内容深拷贝，编辑不影响原数据，保存时再写回
          this.structured = item.structured ? JSON.parse(JSON.stringify(item.structured)) : null
        } else {
          this.form = null
          this.structured = null
        }
      } catch (e) {
        this.form = null
        this.structured = null
      }
      this.loading = false
    },
    goBack() {
      this.$router.push('/agent-center/apps/standards-library')
    },
    addPoint(dim) {
      dim.points.push('')
    },
    removePoint(dim, index) {
      dim.points.splice(index, 1)
    },
    parseStatusText(ps) {
      return { pending: '待审核', effective: '已生效', rejected: '已驳回' }[ps] || '未解析'
    },
    parseStatusTagType(ps) {
      return { pending: 'warning', effective: 'success', rejected: 'danger' }[ps] || 'info'
    },
    // ===== 人工审核（解析结果须审核通过后方可对智能体生效，写回数据源） =====
    approveStandard() {
      this.$confirm('确认审核通过？通过后结构化解析内容将立即对智能体生效。', '审核通过', {
        confirmButtonText: '审核通过',
        cancelButtonText: '取消',
        type: 'success'
      }).then(() => {
        this.form.parseStatus = 'effective'
        // R040201 STORY-007（RULE-008）：生效时自动生成与上一生效版本的配置级差异
        const diffs = recordDiffOnApprove({ code: this.form.code, version: this.form.version, structured: this.structured })
        if (diffs && diffs.length) {
          this.$message.success(`审核通过，已对智能体生效；与上一版本存在 ${diffs.length} 处配置差异，详见「版本差异」区块`)
        } else {
          this.$message.success('审核通过，结构化解析内容已对智能体生效')
        }
        this.persistDetail()
      }).catch(() => {})
    },
    rejectStandard() {
      this.$prompt('请输入驳回原因（将记录留痕）', '驳回解析结果', {
        confirmButtonText: '驳回',
        cancelButtonText: '取消',
        inputPlaceholder: '如：指标两级要求提取有误 / 申报条件遗漏'
      }).then(({ value }) => {
        this.form.parseStatus = 'rejected'
        this.form.rejectReason = value || '解析结果不准确'
        this.persistDetail()
        this.$message.info('已驳回，可修正后重新解析入库')
      }).catch(() => {})
    },
    // 将当前 form 与 structured 写回数据源（供审核操作复用）
    persistDetail() {
      try {
        const saved = localStorage.getItem('carbon-library-standards-v2')
        const list = saved ? JSON.parse(saved) : []
        const idx = list.findIndex(s => (s.code || '') + '@' + (s.version || '') === this.itemKey)
        if (idx > -1) {
          const prev = list[idx]
          list[idx] = Object.assign({}, prev, {
            parseStatus: this.form.parseStatus,
            rejectReason: this.form.rejectReason,
            structured: this.structured
          })
          localStorage.setItem('carbon-library-standards-v2', JSON.stringify(list))
        }
      } catch (e) { /* ignore */ }
    },
    // 验证并通过数据源同步保存
    saveDetail() {
      if (!this.form.code || !this.form.name) {
        this.$message.warning('标准编号和标准名称为必填项')
        return
      }
      // R040201 RULE-014：申报指标权重合计校验（填写了权重才触发）
      if (this.structured && this.structured.indicators) {
        const vw = validateIndicatorsWeight(this.structured.indicators)
        if (!vw.ok) {
          this.$message.warning(`指标权重合计为 ${vw.total}%，须等于 100%`)
          return
        }
      }
      this.saving = true
      setTimeout(() => {
        try {
          const saved = localStorage.getItem('carbon-library-standards-v2')
          const list = saved ? JSON.parse(saved) : []
          const idx = list.findIndex(s => (s.code || '') + '@' + (s.version || '') === this.itemKey)
          if (idx > -1) {
            const prev = list[idx]
            list[idx] = Object.assign({}, prev, {
              code: this.form.code,
              name: this.form.name,
              type: this.form.type,
              scenarios: this.form.scenarios,
              issuer: this.form.issuer,
              year: this.form.yearNum ? String(this.form.yearNum) : '',
              version: this.form.version,
              status: this.form.status,
              desc: this.form.desc,
              structured: this.structured
            })
            localStorage.setItem('carbon-library-standards-v2', JSON.stringify(list))
            this.$message.success('保存成功，已同步更新至政策标准库')
          } else {
            this.$message.error('保存失败：条目在数据源中已不存在')
          }
        } catch (e) {
          this.$message.error('保存失败：本地数据读写异常')
        }
        this.saving = false
      }, 300)
    }
  }
}
</script>

<style scoped>
.standards-library-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.page-header { margin-bottom: 20px; display: flex; align-items: flex-start; justify-content: space-between; flex-shrink: 0; }
.header-left { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.back-btn { margin-right: 4px; }
.page-title { font-size: 20px; color: #303133; margin: 0; }
.page-title i { color: #0067FE; }
.page-desc { font-size: 13px; color: #909399; margin-top: 6px; }
.header-right { flex-shrink: 0; }
.detail-loading { min-height: 240px; }
/* 正文滚动容器（与列表页 table-scroll 同机制） */
.detail-body { flex: 1; min-height: 0; overflow: auto; }
.detail-card {
  background: #fff; border: 1px solid #ebeef5; border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04); padding: 16px 18px; margin-bottom: 16px;
}
.card-title { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 14px; }
.card-title i { color: #0067FE; margin-right: 4px; }
.card-hint { font-size: 12px; font-weight: 400; color: #909399; margin-left: 6px; }
.detail-form { max-width: 1100px; }

/* 解析概览卡片 */
.overview-card { background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%); border-left: 3px solid #0067FE; }
.overview-grid { display: flex; gap: 40px; flex-wrap: wrap; padding: 4px 0; }
.ov-item { display: flex; flex-direction: column; gap: 4px; min-width: 180px; }
.ov-label { font-size: 12px; color: #8c8c8c; }
.ov-value { font-size: 13px; color: #303133; font-weight: 500; }

/* 页头标题内的名称 */
.title-name { font-size: 14px; font-weight: 400; color: #606266; margin-left: 10px; }
.dim-block { margin-bottom: 16px; padding: 12px 14px; background: #fafbfc; border: 1px solid #eef1f6; border-radius: 6px; }
.dim-block:last-child { margin-bottom: 0; }
.dim-label { font-size: 12.5px; font-weight: 600; color: #0067FE; margin-bottom: 8px; }
.point-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.point-row .el-input { flex: 1; }
.btn-danger { color: #f56c6c; }
.btn-danger:hover { color: #f78989; }
.detail-audit {
  margin-top: 14px; padding: 12px 14px; background: #fdf6ec; border: 1px solid #faecd8; border-radius: 6px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
}
.detail-audit-tip { font-size: 13px; color: #b88230; }
.detail-audit-tip i { margin-right: 4px; }
</style>