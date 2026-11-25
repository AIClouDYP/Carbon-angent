<template>
  <el-dialog title="创建核算任务" :visible.sync="dialogVisible" width="680px" custom-class="create-dialog"
    :close-on-click-modal="false" @close="resetForm">

    <el-form ref="form" :model="form" :rules="rules" label-width="130px" label-position="right">
      <!-- 步骤条 -->
      <el-steps :active="currentStep" finish-status="success" simple class="form-steps">
        <el-step title="基础信息"></el-step>
        <el-step title="核算配置"></el-step>
        <el-step title="智能选项"></el-step>
        <el-step title="确认提交"></el-step>
      </el-steps>

      <!-- 步骤1：基础信息 -->
      <div v-show="currentStep === 0" class="step-content">
        <el-form-item label="选择产品模型" prop="productId" required>
          <el-select v-model="form.productId" filterable remote reserve-keyword
            placeholder="搜索并选择产品模型" :remote-method="searchProducts" :loading="productSearchLoading"
            style="width: 100%;">
            <el-option v-for="p in filteredProducts" :key="p.id" :label="`${p.name} (${p.model})`"
              :value="p.id">
              <div style="display: flex; justify-content: space-between;">
                <span>{{ p.name }}</span>
                <el-tag size="mini" type="info">{{ p.category }}</el-tag>
              </div>
            </el-option>
          </el-select>
          <div class="form-tip">未找到产品模型？<el-link type="primary" @click="$router.push('/footprint/model')">前往模型管理创建</el-link></div>
        </el-form-item>

        <!-- 产品物理属性面板 -->
        <div class="product-info-panel" v-if="selectedProduct">
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="净重(kg)">{{ selectedProduct.weight || '—' }}</el-descriptions-item>
            <el-descriptions-item label="使用寿命">{{ selectedProduct.serviceLife || '—' }}</el-descriptions-item>
            <el-descriptions-item label="生产地">{{ selectedProduct.productionLocation || '—' }}</el-descriptions-item>
            <el-descriptions-item label="规格参数" :span="3">{{ selectedProduct.specs || '—' }}</el-descriptions-item>
            <el-descriptions-item label="包装信息" :span="3">{{ selectedProduct.packagingInfo || '—' }}</el-descriptions-item>
          </el-descriptions>
          <div class="product-info-hint" v-if="linkedSOPInfo">
            <i class="el-icon-connection" style="color: #0067fe;"></i>
            <span>{{ linkedSOPInfo }}</span>
          </div>
        </div>

        <el-form-item label="核算周期" required>
          <el-col :span="11">
            <el-date-picker v-model="form.periodStart" type="month" placeholder="开始月份"
              value-format="yyyy-MM-dd" style="width: 100%;"></el-date-picker>
          </el-col>
          <el-col :span="2" style="text-align: center;">至</el-col>
          <el-col :span="11">
            <el-date-picker v-model="form.periodEnd" type="month" placeholder="结束月份"
              value-format="yyyy-MM-dd" style="width: 100%;"></el-date-picker>
          </el-col>
        </el-form-item>

        <el-form-item label="组织边界" prop="orgPath" required>
          <el-cascader v-model="form.orgPath" :options="orgTreeOptions" style="width: 100%;"
            placeholder="请选择组织层级" clearable filterable
            :props="{ checkStrictly: true, value: 'id', label: 'name', children: 'children' }"></el-cascader>
        </el-form-item>

        <el-form-item label="功能单位" prop="functionalUnit" required>
          <el-row :gutter="10">
            <el-col :span="18">
              <el-input v-model="form.functionalUnitValue" placeholder="数值" type="number"></el-input>
            </el-col>
            <el-col :span="6">
              <el-select v-model="form.functionalUnitUnit" placeholder="单位" allow-create
                default-first-option style="width: 100%;">
                <el-option label="台" value="台"></el-option>
                <el-option label="个" value="个"></el-option>
                <el-option label="kg" value="kg"></el-option>
                <el-option label="吨" value="吨"></el-option>
                <el-option label="件" value="件"></el-option>
                <el-option label="套" value="套"></el-option>
                <el-option label="m²" value="m²"></el-option>
                <el-option label="L" value="L"></el-option>
              </el-select>
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item label="任务备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选：填写任务说明或特殊要求"
            maxlength="200" show-word-limit></el-input>
        </el-form-item>
      </div>

      <!-- 步骤2：核算配置 -->
      <div v-show="currentStep === 1" class="step-content">
        <el-form-item label="排放范围" prop="scopes">
          <el-checkbox-group v-model="form.scopes">
            <el-checkbox label="scope1">
              范围1 — 直接排放（燃料燃烧、工艺排放等）
              <el-tooltip content="企业直接控制的温室气体排放源产生的排放" placement="top">
                <i class="el-icon-info text-tip"></i>
              </el-tooltip>
            </el-checkbox>
            <el-checkbox label="scope2">
              范围2 — 能源间接排放（外购电力、热力等）
              <el-tooltip content="因使用外购能源而产生的间接排放" placement="top">
                <i class="el-icon-info text-tip"></i>
              </el-tooltip>
            </el-checkbox>
            <el-checkbox label="scope3">
              范围3 — 其他间接排放（上下游供应链等）
              <el-tooltip content="价值链中其他间接排放，如原材料开采、产品使用和废弃处置等" placement="top">
                <i class="el-icon-info text-tip"></i>
              </el-tooltip>
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="数据来源方式" prop="dataSourceType">
          <el-radio-group v-model="form.dataSourceType">
            <el-radio label="manual">手动填报</el-radio>
            <el-radio label="auto">系统自动采集（物联网设备）</el-radio>
            <el-radio label="import">Excel批量导入</el-radio>
            <el-radio label="api">API对接导入</el-radio>
          </el-radio-group>
        </el-form-item>


        <el-form-item label="截断规则" prop="cutoffThreshold">
          <div>
            <el-slider v-model="form.cutoffThreshold" :min="0.5" :max="5" :step="0.5" :format-tooltip="val => `截断阈值 ${val}%`"
              show-input input-size="mini" style="margin-top: 10px;"></el-slider>
            <div class="form-tip">单排放源占比低于此阈值时予以截断不计；默认1%</div>
          </div>
        </el-form-item>
      </div>

      <!-- 步骤3：AI辅助选项 -->
      <div v-show="currentStep === 2" class="step-content ai-options">
        <div class="ai-option-card" :class="{ active: form.aiOptions.autoFill }" @click="form.aiOptions.autoFill = !form.aiOptions.autoFill">
          <div class="ai-option-header">
            <i class="el-icon-magic-stick"></i>
            <h4>智能数据补全</h4>
            <el-switch v-model="form.aiOptions.autoFill" active-color="#409EFF"></el-switch>
          </div>
          <p>当检测到部分数据缺失时，智能体将根据历史数据和行业基准自动填充合理估算值，并在报告中标注为估算。</p>
          <ul class="ai-capabilities">
            <li>📊 基于历史同期数据的趋势推算</li>
            <li>🏭 行业同类产品能耗基准参考</li>
            <li>⚠️ 所有补全值均会标记不确定性等级</li>
          </ul>
        </div>

        <div class="ai-option-card" :class="{ active: form.aiOptions.anomalyDetect }" @click="form.aiOptions.anomalyDetect = !form.aiOptions.anomalyDetect">
          <div class="ai-option-header">
            <i class="el-icon-view"></i>
            <h4>异常智能识别</h4>
            <el-switch v-model="form.aiOptions.anomalyDetect" active-color="#409EFF"></el-switch>
          </div>
          <p>在核算过程中自动识别异常数据点，包括离群值、逻辑矛盾、单位不一致等问题。</p>
          <ul class="ai-capabilities">
            <li>🔍 数值离群检测（超出±3σ或历史300%）</li>
            <li>⚖️ 量纲一致性校验（单位匹配）</li>
            <li>🔗 因子时效性检查（版本过旧提醒）</li>
          </ul>
        </div>

        <div class="ai-option-card" :class="{ active: form.aiOptions.supplyChain }" @click="form.aiOptions.supplyChain = !form.aiOptions.supplyChain">
          <div class="ai-option-header">
            <i class="el-icon-connection"></i>
            <h4>供应链追溯增强</h4>
            <el-switch v-model="form.aiOptions.supplyChain" active-color="#409EFF"></el-switch>
          </div>
          <p>对范围3上游排放进行深度溯源分析，尝试获取供应商一级的详细碳排放信息。</p>
          <ul class="ai-capabilities">
            <li>📦 主要原材料供应商排放调查问卷生成</li>
            <li>🔗 供应链图谱可视化构建</li>
            <li>⏱️ 注意：此功能可能增加30%~50%的核算耗时</li>
          </ul>
        </div>
      </div>

      <!-- 步骤4：确认 -->
      <div v-show="currentStep === 3" class="step-content confirm-content">
        <el-descriptions title="任务配置摘要" :column="2" border size="medium">
          <el-descriptions-item label="产品名称">{{ selectedProductName }}</el-descriptions-item>
          <el-descriptions-item label="功能单位">{{ form.functionalUnitValue }} {{ form.functionalUnitUnit }}</el-descriptions-item>
          <el-descriptions-item label="组织边界">{{ orgPathDisplay || '—' }}</el-descriptions-item>
          <el-descriptions-item label="核算周期">{{ form.periodStart || '—' }} ~ {{ form.periodEnd || '—' }}</el-descriptions-item>
          <el-descriptions-item label="排放范围">
            <el-tag v-for="s in form.scopes" :key="s" size="mini" style="margin-right: 4px;"
              :type="s === 'scope1' ? 'danger' : s === 'scope2' ? 'warning' : 'info'">
              {{ s.toUpperCase().replace('SCOPE', '范围') }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="因子库">在「阶段2 核算边界」选择（可多选）</el-descriptions-item>
          <el-descriptions-item label="数据来源">{{ dataSourceLabels[form.dataSourceType] }}</el-descriptions-item>
          <el-descriptions-item label="智能补全">
            <el-tag :type="form.aiOptions.autoFill ? 'success' : 'info'" size="mini">
              {{ form.aiOptions.autoFill ? '启用' : '未启用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="异常识别">
            <el-tag :type="form.aiOptions.anomalyDetect ? 'success' : 'info'" size="mini">
              {{ form.aiOptions.anomalyDetect ? '启用' : '未启用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="供应链追溯">
            <el-tag :type="form.aiOptions.supplyChain ? 'success' : 'info'" size="mini">
              {{ form.aiOptions.supplyChain ? '启用' : '未启用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ form.remark || '无' }}</el-descriptions-item>
        </el-descriptions>

        <el-alert title="请仔细核对以上配置信息，确认无误后点击提交启动核算。" type="info"
          :closable="false" show-icon style="margin-top: 16px;"></el-alert>
      </div>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button v-if="currentStep > 0" @click="prevStep" style="margin-right: auto;">上一步</el-button>
      <div v-else></div>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button v-if="currentStep < 3" type="primary" @click="nextStep">下一步</el-button>
      <el-button v-else type="primary" :loading="submitting" icon="el-icon-check" @click="handleSubmit">
        确认创建并启动
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import { mockProducts } from '../mock/data'
import { loadCfpProducts } from '@/utils/productStore'

export default {
  name: 'CreateTaskDialog',
  props: {
    visible: Boolean
  },
  data() {
    return {
      currentStep: 0,
      submitting: false,
      productSearchLoading: false,
      productSearchQuery: '',
      form: {
        productId: null,
        periodStart: '',
        periodEnd: '',
        orgPath: [],
        functionalUnitValue: 1,
        functionalUnitUnit: '辆',
        scopes: ['scope1', 'scope2'],
        dataSourceType: 'auto',
        factorVersion: '',
        cutoffThreshold: 1.0,
        remark: '',
        aiOptions: {
          autoFill: true,
          anomalyDetect: true,
          supplyChain: false
        }
      },
      rules: {
        productId: [{ required: true, message: '请选择产品模型', trigger: 'change' }],
        orgPath: [{ required: true, message: '请选择组织边界', trigger: 'change' }]
      },
      dataSourceLabels: {
        manual: '手动填报',
        auto: '系统自动采集(物联网)',
        import: 'Excel批量导入',
        api: 'API对接导入'
      },
      orgTreeOptions: [
        {
          id: 'org-root',
          name: 'XX集团总部',
          children: [
            { id: 'org-park-1', name: '华南低碳产业园', children: [
              { id: 'org-comp-1', name: 'XX电子科技有限公司' },
              { id: 'org-comp-2', name: 'XX新能源科技有限公司' }
            ]},
            { id: 'org-park-2', name: '华东绿色制造基地', children: [
              { id: 'org-line-1', name: 'XX纺织集团-一分厂' },
              { id: 'org-line-2', name: 'XX纺织集团-二分厂' }
            ]},
            { id: 'org-park-3', name: '西部建材产业园', children: [
              { id: 'org-comp-3', name: 'YY建材股份-总厂' }
            ]}
          ]
        }
      ],
      allProducts: mockProducts,
      epProducts: [],
      epSOPs: [],
      epProcesses: []
    }
  },
  computed: {
    dialogVisible: {
      get() { return this.visible },
      set(val) { this.$emit('update:visible', val) }
    },
    filteredProducts() {
      if (!this.productSearchQuery) return this.allProducts
      const q = this.productSearchQuery.toLowerCase()
      return this.allProducts.filter(p =>
        p.name.toLowerCase().includes(q) || p.model.toLowerCase().includes(q)
      )
    },
    selectedProductName() {
      const p = this.allProducts.find(p => p.id === this.form.productId)
      return p ? p.name : '未选择'
    },
    selectedProduct() {
      return this.allProducts.find(p => p.id === this.form.productId) || null
    },
    linkedSOPInfo() {
      if (!this.selectedProduct) return ''
      const epProduct = this.epProducts.find(p => p.name === this.selectedProduct.name)
      if (!epProduct || !epProduct.sopIds || epProduct.sopIds.length === 0) return ''
      const sop = this.epSOPs.find(s => epProduct.sopIds.includes(s.id))
      if (!sop) return ''
      const processCount = (sop.processIds || []).length
      return `已关联核算模型「${sop.name}」，包含 ${processCount} 个单元过程`
    },
    orgPathDisplay() {
      const names = []
      const walk = (nodes, targetIds) => {
        for (const node of nodes) {
          if (targetIds.includes(node.id)) {
            names.push(node.name)
          }
          if (node.children && node.children.length) {
            walk(node.children, targetIds)
          }
        }
      }
      walk(this.orgTreeOptions, this.form.orgPath)
      return names.join(' → ')
    }
  },
  mounted() {
    try {
      const products = loadCfpProducts()
      if (products.length) this.epProducts = products
      const sops = localStorage.getItem('cfp_sops')
      if (sops) this.epSOPs = JSON.parse(sops)
      const processes = localStorage.getItem('cfp_processes')
      if (processes) this.epProcesses = JSON.parse(processes)
    } catch (e) { /* ignore */ }
  },
  methods: {
    searchProducts(query) {
      this.productSearchQuery = query
      this.productSearchLoading = true
      setTimeout(() => { this.productSearchLoading = false }, 400)
    },
    prevStep() {
      if (this.currentStep > 0) this.currentStep--
    },
    nextStep() {
      // 简单验证当前步骤必填项
      if (this.currentStep === 0) {
        if (!this.form.productId) {
          this.$message.warning('请先选择产品模型')
          return
        }
        if (!this.form.orgPath.length) {
          this.$message.warning('请先选择组织边界')
          return
        }
      }
      if (this.currentStep < 3) this.currentStep++
    },
    resetForm() {
      this.currentStep = 0
      this.form = {
        productId: null, periodStart: '', periodEnd: '', orgPath: [],
        functionalUnitValue: 1, functionalUnitUnit: '辆',
        scopes: ['scope1', 'scope2'], dataSourceType: 'auto',
        factorVersion: '', cutoffThreshold: 1.0, remark: '',
        aiOptions: { autoFill: true, anomalyDetect: true, supplyChain: false }
      }
    },
    handleSubmit() {
      this.submitting = true
      // 模拟提交
      setTimeout(() => {
        const newTask = {
          id: `TASK-${Date.now().toString().slice(-11)}`,
          productName: this.selectedProductName,
          productModel: (this.filteredProducts.find(p => p.id === this.form.productId) || {}).model || '',
          organizationName: this.orgPathDisplay,
          orgLevel: '产线级',
          functionalUnit: `${this.form.functionalUnitValue} ${this.form.functionalUnitUnit}`,
          periodStart: (this.form.periodStart ? this.form.periodStart.slice(0, 7).replace('-', '年') + '月' : '') || '待定',
          periodEnd: (this.form.periodEnd ? this.form.periodEnd.slice(0, 7).replace('-', '年') + '月' : '') || '待定',
          status: 'CREATED',
          progress: 5,
          totalEmission: null,
          unit: 'kgCO2e',
          createdAt: new Date().toLocaleString('zh-CN'),
          completedAt: null,
          emissionScopes: [...this.form.scopes],
          factorVersion: this.form.factorVersion,
          aiOptions: { ...this.form.aiOptions }
        }
        this.submitting = false
        this.$emit('created', newTask)
      }, 1200)
    }
  }
}
</script>

<style scoped>
.create-dialog {
  border-radius: 12px;
}

.form-steps {
  margin-bottom: 24px;
  padding: 0 10px;
}

.step-content {
  padding: 10px 0;
  min-height: 340px;
}

.form-tip {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.text-tip {
  color: #909399;
  cursor: help;
  margin-left: 2px;
}

/* AI 选项卡片 */
.ai-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-option-card {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 18px 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  background: #fafafa;
}

.ai-option-card:hover {
  border-color: #c6e2ff;
  box-shadow: 0 2px 8px rgba(64,158,255,0.1);
}

.ai-option-card.active {
  border-color: #409EFF;
  background: #ecf5ff;
  position: relative;
}

.ai-option-card.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #409EFF;
  border-radius: 8px 0 0 8px;
}

.ai-option-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.ai-option-header i {
  font-size: 22px;
  color: #409EFF;
}

.ai-option-header h4 {
  flex: 1;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.ai-option-card p {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  margin: 0 0 10px 0;
}

.ai-capabilities {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 13px;
  color: #909399;
  line-height: 1.8;
}

.confirm-content {
  max-height: 420px;
  overflow-y: auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.product-info-panel {
  margin-top: 8px;
  padding: 12px;
  background: #f8f9fb;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.product-info-hint {
  margin-top: 10px;
  padding: 8px 12px;
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 6px;
  font-size: 13px;
  color: #67c23a;
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
