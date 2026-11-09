<template>
  <!-- 场景适配组件：按模板元数据逐条渲染「条件标签 + 下拉框」，单一变体模板整块不显示 -->
  <div v-if="matchFields.length" class="sm-panel">
    <div class="sm-sec">场景适配</div>
    <div class="sm-body">
      <div v-for="f in matchFields" :key="f.key" class="sm-row">
        <span class="sm-label">{{ f.label }}</span>
        <el-select :value="currentValue(f.key)" placeholder="请选择" size="small" style="flex:1" @input="onField(f.key, $event)">
          <el-option v-for="opt in fieldOptions(f.key)" :key="opt" :label="opt" :value="opt"></el-option>
        </el-select>
      </div>
      <div class="sm-tip"><i class="el-icon-info"></i> {{ tipText }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ScenarioMatch',
  props: {
    // 平台模板对象（运维统一配置）：matchFields 定义条件维度，variants 每个变体携带 conditions 取值
    template: { type: Object, default: null },
    // 各条件的路由取值对象：{ field: 'auto', industry: '数据中心/IDC' }（v-model）
    value: { type: Object, default: null }
  },
  computed: {
    variants() {
      return (this.template && Array.isArray(this.template.variants)) ? this.template.variants : []
    },
    // 条件维度：优先取模板显式定义，否则从变体 conditions 键推导
    matchFields() {
      if (this.template && Array.isArray(this.template.matchFields) && this.template.matchFields.length) {
        return this.template.matchFields
      }
      const keys = []
      this.variants.forEach(v => { Object.keys(v.conditions || {}).forEach(k => { if (!keys.includes(k)) keys.push(k) }) })
      return keys.map(k => ({ key: k, label: k }))
    },
    tipText() {
      return '场景条件在创建计划时必选：按条件组合固定路由，期次任务据此直接命中填报场景；组合未命中时转人工适配'
    }
  },
  methods: {
    currentValue(key) {
      return (this.value && this.value[key]) || ''
    },
    onField(key, val) {
      this.$emit('input', Object.assign({}, this.value, { [key]: val }))
    },
    // 该条件在所有变体中的去重取值
    fieldOptions(key) {
      const seen = []
      this.variants.forEach(v => {
        const val = (v.conditions || {})[key]
        if (val && !seen.includes(val)) seen.push(val)
      })
      return seen
    }
  }
}
</script>

<style scoped>
.sm-panel { margin-bottom: 8px; }
.sm-sec { font-size: 13px; font-weight: 700; color: #303133; margin: 4px 0 12px; padding-left: 8px; border-left: 3px solid var(--rs-color, #0067FE); }
.sm-body { background: var(--rs-color-bg, #f0f6ff); border: 1px solid var(--rs-color-border, #d4e3ff); border-radius: 6px; padding: 10px 12px; }
.sm-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.sm-row:last-of-type { margin-bottom: 0; }
.sm-label { flex-shrink: 0; min-width: 58px; font-size: 12px; font-weight: 600; color: #303133; }
.sm-tip { font-size: 11.5px; color: #909399; line-height: 1.6; margin-top: 8px; }
</style>
