<template>
  <!-- 模板章节预览（共享组件）：左侧章节目录 + 右侧该章节的用途 / 数据来源 / 表体结构 / 填报要求
       使用方：平台模板库详情（展示模板内容）、智慧报告智能体（模板结构预览）——同一份 sections 数据、同一套展示 -->
  <div class="tsp-wrap">
    <div class="tsp-aside">
      <div class="tsp-toc">
        <template v-for="g in tocGroups">
          <div v-if="g.label" :key="'grp-' + g.label" class="tsp-toc-group-title">{{ g.label }}<span>{{ g.items.length }}</span></div>
          <div v-for="x in g.items" :key="x.i" :class="['tsp-toc-item', { active: activeIndex === x.i }]" @click="activeIndex = x.i">
            <span v-if="x.s.no" class="tsp-toc-no">{{ x.s.no }}</span>
            <span class="tsp-toc-name">{{ x.s.name }}</span>
            <el-tag v-if="x.s.self && !x.s.blocks" size="mini" effect="plain" class="tsp-toc-tag">概况</el-tag>
          </div>
        </template>
      </div>
    </div>
    <div v-if="active" class="tsp-main">
      <div class="tsp-title">
        <span v-if="active.no" class="tsp-title-no">{{ active.no }}</span>
        <b>{{ active.name }}</b>
        <el-tag v-if="active.self && !hasBlocks" size="mini" type="success" effect="plain">即下方「用能单位概况」</el-tag>
      </div>
      <!-- 用途/数据来源为界面元信息，非模板自带内容：官方表样还原模式（blocks）下不显示 -->
      <div class="tsp-meta" v-if="!hasBlocks">
        <div class="tsp-meta-row"><span class="tsp-meta-label">用途</span><p>{{ active.purpose || '—' }}</p></div>
        <div v-if="active.source" class="tsp-meta-row"><span class="tsp-meta-label">数据来源</span><p>{{ active.source }}</p></div>
      </div>
      <!-- 概况表（self）所含的基本信息分组：由调用方传入（企业档案字段集）；官方版式 blocks 存在时不渲染（主体字段已在版式中呈现） -->
      <template v-if="active.self && profileSections.length && !hasBlocks">
        <div class="tsp-sec"><i class="el-icon-user"></i> 基本信息（企业档案带出，可在「用能单位概况」中核对编辑；点击分组展开）</div>
        <div class="tsp-profile">
          <div v-for="grp in profileSections" :key="grp.key" class="tsp-profile-grp">
            <div class="tsp-profile-grp-name is-clickable" @click="toggleGrp(grp.key)">
              {{ grp.name }}<span>{{ grp.fields.length }} 项</span>
              <i :class="expandedGrps[grp.key] ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
            </div>
            <div v-show="expandedGrps[grp.key]" class="tsp-profile-fields">
              <span v-for="(f, fi) in grp.fields" :key="fi" class="tsp-profile-field">{{ f.name }}</span>
            </div>
          </div>
        </div>
      </template>
      <!-- 官方版式 blocks：所有区块合并为一张连续表格（与官方表单一致），主体信息区 / 指标区 / 主要产品区以 colspan 网格共用同一表格 -->
      <template v-if="hasBlocks">
        <div v-if="active.no" class="tsp-table-caption">{{ active.no }}　{{ active.name }}</div>
        <template v-for="(b, bi) in active.blocks">
          <div v-if="b.type === 'kv' && b.caption" :key="'cap' + bi" class="tsp-kv-caption">{{ b.caption }}</div>
        </template>
        <div class="tsp-table-wrap">
          <table class="tsp-table tsp-blocks">
            <colgroup><col v-for="n in 24" :key="n"></colgroup>
            <tbody>
              <template v-for="(b, bi) in active.blocks">
                <!-- kv：主体信息区（label-value 对，colspan 网格；标签列统一宽度，内容过长自动换行） -->
                <template v-if="b.type === 'kv'">
                  <tr v-for="(row, ri) in b.rows" :key="bi + '-' + ri">
                    <template v-for="(cell, ci) in kvRowCells(b, row)">
                      <td :key="bi + '-' + ri + '-l' + ci" :class="cell.ls < 24 ? 'tsp-kv-label' : ''" :colspan="cell.ls">{{ cell.t }}</td>
                      <td v-if="cell.vs > 0" :key="bi + '-' + ri + '-v' + ci" :colspan="cell.vs"></td>
                    </template>
                  </tr>
                </template>
                <!-- table：表头（headerRows 多级 / groupHeads 双层 / 单层）+ 数据行；未声明 columns/rows 时复用章节自身数据 -->
                <template v-else-if="b.type === 'table'">
                  <tr v-for="(hr, hi) in headerRowsCells(b)" v-if="hr.length" :key="bi + '-h' + hi">
                    <th v-for="(c, ci) in hr" :key="bi + '-' + hi + '-' + ci" :colspan="c.span" :rowspan="c.rowspan">{{ c.t }}</th>
                  </tr>
                  <tr v-if="!b.headerRows && b.groupHeads" :key="bi + '-gh'">
                    <th v-for="(g, gi) in b.groupHeads" :key="bi + '-g' + gi" :colspan="g.span" :rowspan="g.rowspan || 1">{{ g.label }}</th>
                  </tr>
                  <tr v-if="!b.headerRows && (!b.groupHeads || hasSubCols(b))" :key="bi + '-th'">
                    <template v-for="(c, ci) in blockColumns(b)">
                      <th v-if="!isRowspanCol(b, ci)" :key="bi + '-c' + ci" :colspan="blockColSpan(b, ci)">{{ c }}</th>
                    </template>
                  </tr>
                  <tr v-for="(r, ri) in blockRows(b)" :key="bi + '-' + ri">
                    <td v-for="(c, ci) in blockColumns(b)" :key="bi + '-' + ri + '-' + ci" :colspan="blockColSpan(b, ci)">{{ sectionRowValue(r, c, ci) }}</td>
                  </tr>
                </template>
              </template>
            </tbody>
          </table>
        </div>
        <template v-for="(b, bi) in active.blocks">
          <div v-if="b.rowNote" :key="'rn' + bi" class="tsp-rownote">{{ b.rowNote }}</div>
          <div v-else-if="b.type === 'tail'" :key="'tl' + bi" class="tsp-tail">{{ b.text }}</div>
        </template>
      </template>
      <template v-else-if="active.columns && active.columns.length">
        <div v-if="active.no" class="tsp-table-caption">{{ active.no }}　{{ active.name }}</div>
        <div class="tsp-table-wrap">
          <table class="tsp-table">
            <thead>
              <tr><th v-for="(c, ci) in active.columns" :key="ci">{{ c }}</th></tr>
            </thead>
            <tbody>
              <tr v-for="(r, ri) in active.rows" :key="ri">
                <td v-for="(c, ci) in active.columns" :key="ci">{{ sectionRowValue(r, c, ci) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="active.rowNote" class="tsp-rownote">{{ active.rowNote }}</div>
      </template>
      <div v-if="active.note" class="tsp-note"><i class="el-icon-info"></i> {{ active.note }}</div>
    </div>
    <div v-else class="tsp-empty">
      <i class="el-icon-document"></i>
      <span>该模板暂未定义章节结构</span>
    </div>
  </div>
</template>

<script>
import { sectionRowValue } from '@/utils/sectionRows'

export default {
  name: 'TemplateSectionsPreview',
  props: {
    // 章节（报表）结构数组，元素含 name / no? / purpose / source / columns / rows / rowNote? / note / self?
    sections: { type: Array, default: () => [] },
    // 概况表（self 章节）的基本信息分组 [{ key, name, fields: [{ name }] }]；不传则概况表不渲染该区块
    profileSections: { type: Array, default: () => [] }
  },
  data() {
    return { activeIndex: 0, expandedGrps: {} }
  },
  computed: {
    active() {
      return this.sections[this.activeIndex] || null
    },
    // 官方版式块（blocks）是否存在：存在时按块渲染，chips 与普通单表分支退位
    hasBlocks() {
      const a = this.active
      return !!(a && a.blocks && a.blocks.length)
    },
    // 目录分组：存在正文标记（body）且同时存在附件时按「报告正文 / 附件报表」分区；
    // 纯章节数据（如平台模板库）无 body 标记，自动退回单组平铺，不显示分组标题
    tocGroups() {
      const indexed = this.sections.map((s, i) => ({ s, i }))
      const hasBody = indexed.some(x => x.s.body)
      const hasAnnex = indexed.some(x => !x.s.body)
      if (!hasBody || !hasAnnex) return [{ label: '', items: indexed }]
      return [
        { label: '报告正文', items: indexed.filter(x => x.s.body) },
        { label: '附件报表', items: indexed.filter(x => !x.s.body) }
      ]
    }
  },
  watch: {
    // 切换模板 / 变体时回到首项，避免索引越界
    sections() {
      this.activeIndex = 0
    }
  },
  methods: {
    // 章节行值解析以 methods 形式暴露给模板（表体渲染用）
    sectionRowValue,
    // 基本信息分组展开/收缩（默认收缩）
    toggleGrp(key) {
      this.$set(this.expandedGrps, key, !this.expandedGrps[key])
    },
    // ===== 官方版式 blocks 渲染辅助 =====
    // 表格块列/行：块未声明时回退章节自身数据（指标区与 section.columns/rows 单一来源，避免双份维护漂移）
    blockColumns(b) { return b.columns || this.active.columns || [] },
    blockRows(b) { return b.rows || this.active.rows || [] },
    // 多级表头（headerRows）：每行为格间单元格数组 { t, c | c0/c1, r(rowspan) }，
    // 按列坐标换算网格跨度，并跳过被上方 rowspan 覆盖的位置
    headerRowsCells(b) {
      const rows = b.headerRows || []
      const occ = rows.map(() => ({}))
      rows.forEach((row, ri) => row.forEach(cell => {
        const r = cell.r || 1
        if (r <= 1) return
        const c0 = cell.c0 !== undefined ? cell.c0 : cell.c
        const c1 = cell.c1 !== undefined ? cell.c1 : cell.c
        for (let k = 1; k < r; k++) {
          if (ri + k >= rows.length) break
          for (let c = c0; c <= c1; c++) occ[ri + k][c] = true
        }
      }))
      return rows.map((row, ri) => row
        .filter(cell => !occ[ri][cell.c0 !== undefined ? cell.c0 : cell.c])
        .map(cell => {
          const c0 = cell.c0 !== undefined ? cell.c0 : cell.c
          const c1 = cell.c1 !== undefined ? cell.c1 : cell.c
          let span = 0
          for (let c = c0; c <= c1; c++) span += this.blockColSpan(b, c)
          return { t: cell.t, span, rowspan: cell.r || 1 }
        }))
    },
    // 双层表头：被 rowspan 组覆盖的列不再渲染子表头。
    // 列宽按 colSpans 折算成网格坐标后再判定（rowspan 头的 span 是网格单位，与列序号不可直接比较）
    isRowspanCol(b, ci) {
      const heads = b.groupHeads || []
      if (!heads.length) return false
      let start = 0
      for (let i = 0; i < ci; i++) start += this.blockColSpan(b, i)
      const width = this.blockColSpan(b, ci)
      let hStart = 0
      for (let i = 0; i < heads.length; i++) {
        const g = heads[i]
        if ((g.rowspan || 1) > 1 && start < hStart + g.span && hStart < start + width) return true
        hStart += g.span
      }
      return false
    },
    // kv 块统一网格：标签列统一宽度（block.labelSpan，默认 4/24），值列按行型分配剩余跨度；
    // 条目为对象 { t, vs, ls? }（标签文本 / 值跨 / 可选标签跨覆盖），每行跨度合计必须等于基准列数（24）；
    // 标签文字量超出其跨度容量（按 2 行折算）时自动换行展示（CSS 白空格换行），不破坏列对齐
    kvRowCells(b, row) {
      const baseLS = b.labelSpan || 4
      return row.map(it => (it && typeof it === 'object')
        ? { t: it.t, ls: it.ls || baseLS, vs: it.vs !== undefined ? it.vs : 1 }
        : { t: String(it), ls: baseLS, vs: 1 })
    },
    // 表格块列跨度：未声明 colSpans 时等宽（每列 1 格）
    blockColSpan(b, ci) {
      return (b.colSpans && b.colSpans[ci]) || 1
    },
    // 双层表头下是否存在需要渲染的子表头列
    hasSubCols(b) {
      const cols = this.blockColumns(b)
      for (let ci = 0; ci < cols.length; ci++) { if (!this.isRowspanCol(b, ci)) return true }
      return false
    }
  }
}
</script>

<style scoped>
/* 固定高度：弹窗尺寸不随章节数量 / 内容长短跳动，超出部分在目录与正文区各自滚动 */
.tsp-wrap { display: flex; gap: 16px; height: 56vh; }
.tsp-aside { width: 240px; flex-shrink: 0; border-right: 1px solid #ebeef5; padding-right: 14px; display: flex; flex-direction: column; }
.tsp-toc { flex: 1; min-height: 0; overflow-y: auto; }
.tsp-toc-group-title { display: flex; align-items: baseline; gap: 6px; font-size: 13px; font-weight: 600; color: #909399; letter-spacing: 1px; padding: 8px 8px 3px; }
.tsp-toc-group-title span { font-weight: 400; }
.tsp-toc-group-title:not(:first-child) { margin-top: 8px; border-top: 1px dashed #ebeef5; padding-top: 10px; }
.tsp-toc-item { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: 13px; color: #606266; transition: all .15s; }
.tsp-toc-item:hover { background: #f5f7fa; }
.tsp-toc-item.active { background: var(--rs-color-bg, rgba(0, 103, 254, 0.06)); color: var(--rs-color, #0067FE); font-weight: 600; }
.tsp-toc-no { flex-shrink: 0; font-family: Consolas, Monaco, monospace; font-size: 13px; color: #909399; min-width: 34px; }
.tsp-toc-item.active .tsp-toc-no { color: var(--rs-color, #0067FE); }
.tsp-toc-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tsp-toc-tag { flex-shrink: 0; transform: scale(.9); }

.tsp-main { flex: 1; min-width: 0; overflow-y: auto; padding-right: 4px; }
.tsp-title { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #303133; }
.tsp-title-no { background: var(--rs-color, #0067FE); color: #fff; border-radius: 4px; padding: 1px 7px; font-size: 13px; font-family: Consolas, Monaco, monospace; }
.tsp-meta { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
.tsp-meta-row { display: flex; gap: 8px; font-size: 13px; line-height: 1.6; }
.tsp-meta-label { flex-shrink: 0; width: 56px; color: #909399; }
.tsp-meta-row p { margin: 0; flex: 1; min-width: 0; color: #303133; }
.tsp-sec { margin-top: 14px; font-size: 13px; font-weight: 600; color: #303133; display: flex; align-items: center; gap: 5px; }
/* 概况表基本信息：分组卡片 + 字段 chips */
.tsp-profile { margin-top: 8px; display: flex; flex-direction: column; gap: 8px; }
.tsp-profile-grp { border: 1px solid #f0f3f8; border-radius: 6px; padding: 8px 10px; background: #fbfcfe; }
.tsp-profile-grp-name { font-size: 13px; font-weight: 600; color: #303133; display: flex; align-items: baseline; gap: 6px; margin-bottom: 6px; }
.tsp-profile-grp-name.is-clickable { cursor: pointer; }
.tsp-profile-grp-name.is-clickable:hover { color: var(--rs-color, #0067FE); }
.tsp-profile-grp-name i { margin-left: auto; font-size: 13px; color: #909399; align-self: center; }
.tsp-profile-grp-name span { font-weight: 400; font-size: 13px; color: #909399; }
.tsp-profile-fields { display: flex; flex-wrap: wrap; gap: 4px; }
.tsp-profile-field { font-size: 13px; color: #475569; background: #fff; border: 1px solid #ebeef5; border-radius: 4px; padding: 2px 7px; }
/* 报表按官方版式呈现：表号标题居中 + 全框线 + 表头居中 + 待填空白格 */
.tsp-table-caption { margin-top: 10px; text-align: center; font-size: 13px; font-weight: 700; color: #0f172a; }
.tsp-table-wrap { margin-top: 6px; overflow-x: auto; }
.tsp-table { border-collapse: collapse; width: 100%; font-size: 13px; }
.tsp-table th { border: 1px solid #b9c4d4; background: #f5f7fa; color: #303133; font-weight: 600; text-align: center; padding: 7px 9px; white-space: nowrap; }
.tsp-table td { border: 1px solid #c9d3e0; padding: 8px 9px; color: #606266; white-space: nowrap; height: 26px; }
.tsp-table td:first-child { color: #303133; }
.tsp-rownote { margin-top: 6px; font-size: 13px; color: #909399; }
/* 官方版式 blocks：一张连续表格（区块间不再断开），fixed 网格保证各区块 colspan 边界严格对齐，min-width 配合横向滚动放宽表格宽度；
   排版对齐官方表样：行高舒展、文字居中、标签底色浅灰 */
.tsp-blocks { table-layout: fixed; min-width: 1080px; font-size: 13px; }
.tsp-blocks col { width: 4.1667%; }  /* 24 等分：跨行/跨块的 colspan 边界都落在等宽网格上 */
.tsp-blocks th { padding: 9px 10px; white-space: normal; }  /* 表头允许换行：窄列（如"计量单位"）不再溢出到相邻格 */
.tsp-blocks td { white-space: normal; height: auto; padding: 9px 12px; text-align: center; line-height: 1.6; }
.tsp-blocks tbody tr { height: 38px; }
.tsp-kv-caption { margin-top: 8px; font-size: 13px; color: #303133; }
.tsp-kv-label { color: #303133; }  /* 官方原表标签无底色，跨行边界差不显眼 */
.tsp-tail { margin-top: 8px; text-align: center; font-size: 13px; color: #303133; }
.tsp-note { margin-top: 10px; font-size: 13px; color: #E6A23C; background: #fdf6ec; border-radius: 6px; padding: 8px 10px; line-height: 1.6; display: flex; gap: 5px; align-items: flex-start; }
.tsp-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #909399; font-size: 13px; }
.tsp-empty i { font-size: 28px; color: #dcdfe6; }
</style>
