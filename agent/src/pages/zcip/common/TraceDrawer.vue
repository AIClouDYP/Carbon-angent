<template>
  <el-drawer
    :visible="visible"
    size="440px"
    :with-header="false"
    :modal="false"
    custom-class="cd-trace-drawer"
    @update:visible="$emit('update:visible', $event)"
  >
    <div v-if="row" class="cd-trace">
      <div class="cd-trace-head">
        <span class="cd-trace-close" title="关闭" @click="$emit('update:visible', false)">
          <i class="el-icon-close"></i>
        </span>
        <div class="cd-trace-title">{{ row.name }}</div>
        <div class="cd-trace-sub">{{ row.scope }} · {{ row.category }}</div>
        <div v-if="typeof row.emission === 'number'" class="cd-trace-emission">
          <b>{{ row.emission.toLocaleString() }}</b><span>tCO₂e</span>
        </div>
      </div>

      <!-- 计算参数（活动数据 / 排放因子） -->
      <div v-for="grp in groups" :key="grp.key" class="cd-trace-part">
        <div class="cd-trace-part-t">
          <span>{{ grp.label }}</span>
          <span class="cd-trace-sec-hint">点 ✏️ 更正（留痕）</span>
        </div>
        <div class="cd-trace-params">
          <div
            v-for="it in grp.items"
            :key="it.ci"
            :class="['cd-trace-prow', { on: activeParam === it.ci }]"
            @click="$emit('update:activeParam', it.ci)"
          >
            <span :class="['cd-trace-sym', { 'is-ad': sym(it.ci) === 'AD', 'is-ef': sym(it.ci) === 'EF' }]">
              {{ sym(it.ci) }}
            </span>
            <span class="cd-trace-pname">{{ it.cp.label }}</span>
            <span class="cd-trace-pval">{{ it.cp.val }}</span>
            <i
              v-if="!isPeriodFiled"
              class="el-icon-edit cd-trace-edit"
              title="更正参数值（留痕）"
              @click.stop="$emit('edit', row, it.cp, it.ci)"
            ></i>
          </div>
        </div>
      </div>

      <!-- 当前参数的 凭证 / 匹配 / 记录 -->
      <div v-if="activeCp" class="cd-trace-detail">
        <div class="cd-detail-block">
          <div class="cd-detail-t">凭证材料<span class="cd-detail-sub">{{ activeCp.label }}</span></div>
          <div class="cd-proof-card" :class="{ empty: !activeCp.proof }">
            <div class="cd-proof-card-h">
              <i class="el-icon-paperclip"></i>
              <span class="cd-proof-card-n">{{ activeCp.proof || '暂无凭证材料' }}</span>
              <span v-if="activeCp.proof" class="cd-proof-card-tag">已归档</span>
            </div>
            <div v-if="activeCp.proof" class="cd-proof-card-b">
              <span class="cd-proof-card-src">{{ activeCp.source || '—' }}</span>
              <el-button type="text" size="mini" style="color:#0067fe;padding:0;" @click.stop="$emit('link-proof', row)">
                查看 / 下载
              </el-button>
            </div>
            <div v-else class="cd-proof-card-b">
              {{ activeMatch && activeMatch.candidates > 1 ? '因子库 / 折算参数无需凭证材料' : '可在「✏️ 更正」中上传佐证附件' }}
            </div>
          </div>
        </div>

        <div class="cd-detail-block">
          <div class="cd-detail-t">匹配过程</div>
          <div v-if="activeMatch" class="cd-match-box">
            <div class="cd-match-row-h">
              <b>{{ activeCp.label }}</b>
              <span class="cd-match-tag">匹配 {{ activeMatch.candidates }} 候选</span>
            </div>
            <div class="cd-match-row-b">{{ activeMatch.rule }}</div>
            <div class="cd-match-row-f">采用：{{ activeMatch.adopted }}</div>
          </div>
        </div>

        <div class="cd-detail-block">
          <div class="cd-detail-t">更正记录</div>
          <div v-if="activeLogs && activeLogs.length" class="cd-log">
            <div v-for="(l, i) in activeLogs" :key="i" class="cd-log-item">
              <span class="cd-log-time">{{ l.time }}</span>
              <span class="cd-log-txt">{{ l.old }} → {{ l.new }}（{{ l.reason }}）</span>
            </div>
          </div>
          <div v-else class="cd-log-empty">暂无更正记录</div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script>
/**
 * 数据溯源抽屉（平台级共性组件）
 * 规范：docs/_data-list-interaction-spec.md
 *
 * 使用方（场景）负责提供数据与回调，组件只负责渲染：
 *   :visible.sync     抽屉开关
 *   :row              当前数据行 { name, scope, category, emission }
 *   :groups           参数组 [{ key, label, items: [{ cp, ci }] }]
 *   :active-param.sync 当前选中参数索引
 *   :active-cp        当前参数对象（父级算好传入）
 *   :active-match     匹配过程 { candidates, rule, adopted }
 *   :active-logs      更正记录 [{ time, old, new, reason }]
 *   :sym-fn           参数符号函数 (ci) => 'AD' | 'EF'
 *   :is-period-filed  是否期间填报（控制编辑图标）
 * @event edit(row, cp, ci)      点击更正
 * @event link-proof(row)        查看/下载凭证
 */
export default {
  name: 'TraceDrawer',
  props: {
    visible: { type: Boolean, default: false },
    row: { type: Object, default: null },
    groups: { type: Array, default: () => [] },
    activeParam: { type: Number, default: 0 },
    activeCp: { type: Object, default: null },
    activeMatch: { type: Object, default: null },
    activeLogs: { type: Array, default: () => [] },
    symFn: { type: Function, default: null },
    isPeriodFiled: { type: Boolean, default: false }
  },
  methods: {
    sym(ci) {
      if (typeof this.symFn === 'function') return this.symFn(ci)
      return ''
    }
  }
}
</script>

<style>
.cd-detail-title {font-size:12px;font-weight:600;color:#303133;margin-bottom:6px}
.cd-detail-total {border-top:1px solid #ebeef5;margin-top:4px;padding-top:6px;font-weight:700}
.cd-detail-total .cd-dr-label {color:#303133}
/* ===== 数据溯源抽屉 ===== */
.cd-trace-drawer .el-drawer__body { padding: 0; overflow-y: auto; }
.cd-trace { padding: 18px 20px 28px; }
.cd-trace-head { padding-bottom: 12px; border-bottom: 1px solid #ebeef5; margin-bottom: 14px; }
.cd-trace-title { font-size: 15px; font-weight: 600; color: #1e293b; }
.cd-trace-sub { font-size: 11.5px; color: #909399; margin-top: 4px; }
.cd-trace-sec { margin-bottom: 16px; }
.cd-trace-sec-t { font-size: 12px; font-weight: 600; color: #1e293b; margin-bottom: 6px; }
.cd-trace-sec-t em { font-style: normal; font-size: 11px; color: #c0c4cc; font-weight: 400; margin-left: 4px; }
.cd-trace-kv { display: flex; align-items: center; justify-content: space-between; padding: 5px 8px; font-size: 12px; background: #fafbfc; border-radius: 3px; margin-bottom: 4px; }
.cd-trace-kv span { color: #909399; }
.cd-trace-kv b { color: #303133; font-weight: 500; }
.cd-trace-todo { color: #e6a23c !important; font-weight: 400 !important; }
.cd-trace-formula { font-size: 12px; color: #303133; background: #f5f9ff; border-radius: 4px; padding: 8px 10px; line-height: 1.6; }
.cd-trace-formula b { color: #0067fe; font-weight: 600; }
.cd-trace-chain { display: flex; align-items: center; gap: 6px; font-size: 11.5px; }
.cd-trace-chain span { padding: 2px 8px; background: #f2f3f5; border-radius: 3px; color: #606266; }
.cd-trace-chain span.on { background: #eaf2ff; color: #0067fe; }
.cd-trace-chain i { color: #c0c4cc; font-style: normal; }
/* 溯源抽屉：无遮罩 + 关闭按钮 */
.cd-trace-head { position: relative; }
.cd-trace-close { position: absolute; top: -2px; right: 0; font-size: 15px; color: #909399; cursor: pointer; line-height: 1; }
.cd-trace-close:hover { color: #0067fe; }
.cd-trace-drawer { box-shadow: -2px 0 12px rgba(0, 0, 0, .08); }
/* 抽屉 UI（与园区一致） */
.cd-trace-emission {margin-top:4px;display:flex;align-items:baseline;gap:3px;color:#0067fe}
.cd-trace-emission b {font-size:20px;font-family:Consolas,Menlo,monospace}
.cd-trace-emission span {font-size:10px;color:#94a3b8}
.cd-trace-param {border:1px solid #eef2f7;border-radius:6px;padding:6px 8px;margin-bottom:6px;background:#fff}
.cd-trace-param-row {display:flex;align-items:center;gap:6px}
.cd-trace-param-name {font-size:11px;color:#475569;min-width:104px}
.cd-trace-param-val {flex:1;font-size:11.5px;font-weight:700;color:#0f172a;font-family:Consolas,Menlo,monospace}
.cd-trace-param-meta {display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:4px;font-size:10px;color:#94a3b8}
.cd-trace-src {color:#64748b}
.cd-match-tag {padding:1px 6px;border-radius:9px;background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0;cursor:help}
.cd-trace-actions {display:flex;gap:8px;margin-top:10px;padding-top:10px;border-top:1px dashed #e2e8f0}
/* 抽屉：上参数 / 下页签 */
.cd-trace-sub {font-size:11px;color:#94a3b8;margin-top:2px}
.cd-trace-part {border:1px solid #eef2f7;border-radius:8px;background:#fff;padding:8px 10px;margin-bottom:10px}
.cd-trace-part-t {display:flex;align-items:center;justify-content:space-between;font-size:11.5px;font-weight:700;color:#334155;margin-bottom:6px}
.cd-trace-params {display:flex;flex-direction:column;gap:2px}
.cd-trace-prow {display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px dashed #f1f5f9}
.cd-trace-prow:last-child {border-bottom:none}
.cd-trace-sym {flex:none;width:26px;height:16px;line-height:16px;text-align:center;font-size:9.5px;font-weight:700;color:#0067fe;background:#e8f2ff;border-radius:3px}
.cd-trace-pname {flex:1;min-width:0;font-size:11px;color:#475569;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cd-trace-pval {flex:none;font-size:11.5px;font-weight:700;color:#0f172a;font-family:Consolas,Menlo,monospace}
.cd-trace-edit {flex:none;color:#0067fe;cursor:pointer;font-size:12px;opacity:.75}
.cd-trace-edit:hover {opacity:1}
.cd-trace-tabs {display:flex;gap:4px;border-bottom:1px solid #eef2f7;margin-bottom:8px}
.cd-trace-tab {padding:5px 12px;font-size:11.5px;color:#64748b;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
.cd-trace-tab.on {color:#0067fe;font-weight:700;border-bottom-color:#0067fe}
.cd-trace-pane {min-height:80px}
.cd-match-row {border:1px solid #eef2f7;border-radius:6px;padding:6px 8px;margin-bottom:6px;background:#fff}
.cd-match-row-h {display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:3px}
.cd-match-row-h b {font-size:11px;color:#334155}
.cd-match-row-b {font-size:10.5px;color:#64748b;line-height:1.5}
.cd-match-row-f {font-size:10.5px;color:#0f766e;margin-top:2px}
.cd-log {margin-top:8px}
.cd-log-item {display:flex;gap:6px;font-size:10.5px;color:#475569;padding:3px 0;border-bottom:1px dashed #f1f5f9}
.cd-log-time {flex:none;color:#94a3b8}
.cd-log-empty {font-size:11px;color:#cbd5e1;text-align:center;padding:12px 0}
/* 抽屉 v4：选中态 / 凭证卡 / 分组 */
.cd-trace-prow {cursor:pointer;border-radius:5px;transition:background .15s;padding:4px 6px}
.cd-trace-prow:hover {background:#f8fafc}
.cd-trace-prow.on {background:#eff6ff;box-shadow:inset 2px 0 0 #0067fe}
.cd-trace-prow.on .cd-trace-pname {color:#0067fe;font-weight:600}
.cd-match-row.on {border-color:#0067fe;background:#f5f9ff}
.cd-proof-card {border:1px solid #e6f0ff;background:#f7fbff;border-radius:8px;padding:10px;margin-bottom:8px}
.cd-proof-card.empty {border-color:#eef2f7;background:#fafbfc}
.cd-proof-card-h {display:flex;align-items:center;gap:6px;font-size:12px;color:#0f172a}
.cd-proof-card-h i {color:#0067fe}
.cd-proof-card-n {flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}
.cd-proof-card-tag {flex:none;padding:1px 6px;border-radius:9px;background:#e6f7ec;color:#0f9d58;font-size:10px;border:1px solid #cdebd7}
.cd-proof-card-b {display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px;font-size:10.5px;color:#94a3b8}
.cd-proof-card-src {flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* 抽屉 v5：选中参数的三段详情 */
.cd-trace-detail {margin-top:4px}
.cd-detail-block {margin-bottom:10px}
.cd-detail-t {display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:#334155;margin-bottom:6px}
.cd-detail-sub {font-weight:400;color:#94a3b8;font-size:10px}
.cd-match-box {border:1px solid #eef2f7;border-radius:6px;padding:8px 10px;background:#fff}
/* 符号类型配色 */
.cd-trace-sym {background:#f1f5f9;color:#64748b}
.cd-trace-sym.is-ad {background:#e8f2ff;color:#0067fe}
.cd-trace-sym.is-ef {background:#e9f7ef;color:#0f9d58}
/* 匹配标签：轻量徽章（圆点 + 浅蓝） */
.cd-match-tag {display:inline-flex;align-items:center;gap:4px;padding:1px 8px;border-radius:10px;background:#f0f7ff;color:#1d4ed8;border:1px solid #dbeafe;font-size:10px;font-weight:600;line-height:17px;letter-spacing:.2px}
.cd-match-tag::before {content:'';width:5px;height:5px;border-radius:50%;background:#3b82f6;flex:none}
</style>
