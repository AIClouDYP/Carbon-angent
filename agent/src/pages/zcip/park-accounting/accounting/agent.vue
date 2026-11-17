<template>
  <div class="agent-page">
    <div class="cycle-dashboard-mode">
      <div class="cd-body">
        <!-- 历史对话栏（可收缩） -->
        <div :class="['cd-history-sidebar', { 'history-collapsed': !showHistorySidebar }]">
          <div class="history-toggle" @click="toggleHistorySidebar">
            <i :class="showHistorySidebar ? 'el-icon-d-arrow-left' : 'el-icon-d-arrow-right'"></i>
            <span v-if="!showHistorySidebar" class="history-vertical-text">历史对话</span>
          </div>
          <div v-if="showHistorySidebar" class="history-content">
            <div class="history-header">
              <span>历史对话</span>
              <span class="history-count">{{ conversationHistory.length }}</span>
            </div>
            <div class="history-list">
              <div v-for="conv in conversationHistory" :key="conv.id"
                :class="['history-item', { 'history-active': currentConversationId === conv.id }]"
                @click="loadConversation(conv.id)">
                <div class="history-item-title">{{ conv.title }}</div>
                <div class="history-item-time">{{ conv.timestamp }}</div>
                <i class="el-icon-close history-item-del" @click.stop="deleteConversation(conv.id)"></i>
              </div>
              <div v-if="conversationHistory.length === 0" class="history-empty">
                <i class="el-icon-chat-line-square"></i>
                <span>暂无历史对话</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 左侧：小易智能对话区 -->
        <div class="cd-chat-container">
          <div class="chat-header">
            <div class="header-title">
              <span class="bot-avatar-sm" :style="{ background: themeColorLight }">
                <AgentIcon icon="ai-core" :color="themeColor" :size="24" />
              </span>
              <span class="chat-name-highlight" style="font-weight:600;margin-left:8px;font-size:16px;">小易</span>
              <span class="bot-status-dot"></span>
              <span class="tl-header-status">在线</span>
            </div>
            <div class="header-actions">
              <span class="back-link-agent" @click="goBackHome"><i class="el-icon-back"></i> 返回</span>
              <span class="token-counter" v-if="estimatedTokens > 0"><i class="el-icon-coin"></i> {{ formattedTokens }}</span>
              <span class="header-onboarding-btn" @click="startOnboarding"><i class="el-icon-aim"></i> 新手引导</span>
              <span class="toolbar-icon-sep" @click="newConversation"><i class="el-icon-plus"></i> 新建对话</span>
            </div>
          </div>
          <div class="chat-messages" ref="chatMessagesRef">
            <div v-for="msg in messages" :key="msg.id" :class="['message-row', `message--${msg.role}`]">
              <div class="msg-avatar">
                <AgentIcon v-if="msg.role === 'assistant'" icon="ai-core" :color="themeColor" :size="26" />
                <i v-else class="el-icon-user"></i>
              </div>
              <div class="msg-body">
                <div v-if="msg.thinking" class="msg-thinking-head" @click="toggleThinking(msg.id)">
                  <i :class="['el-icon-arrow-right', { 'is-open': thinkingOpen[msg.id] }]"></i> 思考过程
                </div>
                <div v-if="msg.thinking" v-show="thinkingOpen[msg.id]" class="msg-text" v-html="renderMarkdown(msg.narrative || msg.content)"></div>
                <div v-if="!msg.thinking || msg.narrative" class="msg-text" v-html="renderMarkdown(msg.content)"></div>
                <div v-if="msg.suggestions && msg.suggestions.length" class="msg-suggestions">
                  <span v-for="(s, i) in msg.suggestions" :key="i" class="suggestion-btn" :class="{ 'suggestion-disabled': isTyping }" @click="!isTyping && handleCycleSuggestion(s)">{{ s }}</span>
                </div>
                <div class="msg-time">{{ msg.timestamp }}</div>
              </div>
            </div>
            <div v-if="isTyping" class="message-row message--assistant">
              <div class="msg-avatar"><AgentIcon icon="ai-core" :color="themeColor" :size="26" /></div>
              <div class="msg-body"><div class="typing-indicator"><span></span><span></span><span></span></div></div>
            </div>
          </div>
          <div class="chat-input-area">
            <div class="input-box">
              <textarea class="input-textarea" v-model="inputText" placeholder="向小易询问园区碳排放、可再生能源抵消或指标达标情况…" rows="1"
                @keydown.enter.exact="handleCycleSendKey" @input="autoResizeTextarea" ref="inputTextareaRef"></textarea>
              <div class="input-box-footer">
                <div class="input-toolbar">
                  <span class="toolbar-icon" title="常用指令" @click="showCmdHint"><i class="el-icon-s-opportunity"></i></span>
                  <span class="toolbar-icon" title="语音输入" @click="$message.info('语音输入功能开发中')"><i class="el-icon-microphone"></i></span>
                  <span class="toolbar-icon" title="图片上传" @click="$message.info('图片上传功能开发中')"><i class="el-icon-picture"></i></span>
                  <span class="toolbar-icon" title="附件上传" @click="$message.info('附件上传功能开发中')"><i class="el-icon-upload2"></i></span>
                </div>
                <button class="send-btn" :disabled="!inputText.trim() || isTyping" @click="handleCycleSend" :style="{ background: themeColor }">
                  <i class="el-icon-s-promotion"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：周期看板 -->
        <aside class="cd-sidebar">
          <!-- Tab 页签 -->
          <div class="cd-tabs-header">
            <div :class="['cd-tab', { active: cdActiveTab === 'tasks' }]" @click="switchCdTab('tasks')">
              <i class="el-icon-pie-chart"></i><span>核算结果</span>
            </div>
            <div :class="['cd-tab', { active: cdActiveTab === 'model' }]" @click="switchCdTab('model')">
              <i class="el-icon-s-grid"></i><span>配置与模型</span>
            </div>
          </div>

          <!-- Tab 1：核算结果 -->
          <div v-if="cdActiveTab === 'tasks'" key="tab-tasks" class="cd-tab-content cd-tab-result">
            <!-- 顶部信息栏：精致通透两行卡片 -->
            <div class="cd-period-bar-modern">
              <div class="cd-pb-row">
                <div class="cd-pb-item">
                  <span class="cd-pb-label"><i class="el-icon-date"></i> 时间维度</span>
                  <div class="cd-segmented-switch">
                    <span :class="['cd-seg-btn', { active: resultGranularity === 'month' }]" @click="setGranularity('month')">月度</span>
                    <span :class="['cd-seg-btn', { active: resultGranularity === 'year' }]" @click="setGranularity('year')">年度</span>
                  </div>
                </div>
                <div class="cd-pb-item cd-pb-time">
                  <span class="cd-pb-label"><i class="el-icon-time"></i> 核算期次</span>
                  <template v-if="isYearMode">
                    <el-select v-model="resultYear" size="mini" class="cd-period-picker-clean" placeholder="选择年份">
                      <el-option v-for="y in resultYearOptions" :key="y" :label="y + '年度'" :value="y"></el-option>
                    </el-select>
                  </template>
                  <template v-else>
                    <el-date-picker v-model="resultYearMonth" type="month" size="mini" class="cd-period-picker-clean"
                      placeholder="选择月份" format="yyyy年MM月" value-format="yyyy-MM" :clearable="false"></el-date-picker>
                  </template>
                </div>
              </div>
              <div class="cd-pb-row cd-pb-row-sub">
                <div class="cd-pb-item cd-pb-basis">
                  <span class="cd-pb-label"><i class="el-icon-document-checked"></i> 核算依据</span>
                  <span class="cd-basis-pill" :title="periodVersionText">{{ periodVersionText }}</span>
                </div>
                <div class="cd-pb-item cd-pb-status">
                  <span class="cd-pb-label">数据状态</span>
                  <span class="cd-period-status-pill" :class="isFiledNow ? 'is-filed' : 'is-open'">
                    <i :class="isFiledNow ? 'el-icon-lock' : 'el-icon-refresh'"></i>
                    {{ periodStatusLabel }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 子页签 -->
            <div class="cd-subtabs">
              <div :class="['cd-subtab', { active: resultTab === 'chart' }]" @click="switchResultTab('chart')">图表与指标</div>
              <div :class="['cd-subtab', { active: resultTab === 'list' }]" @click="switchResultTab('list')">数据清单</div>
            </div>

            <!-- 内容区（滚动） -->
            <div class="cd-result-scroll">
              <!-- 图表与指标 -->
              <div v-show="resultTab === 'chart'">
                <!-- 4 大现代高质感核心 KPI（严格对齐发改委910号文） -->
                <div class="cd-metrics-grid">
                  <div class="cd-metric-box metric-gross">
                    <div class="mb-top">
                      <span class="mb-label">园区碳排放总量</span>
                      <span class="mb-badge">全口径</span>
                    </div>
                    <div class="mb-value-row">
                      <span class="mb-num">{{ kpiTotals.totalEmission.toLocaleString() }}</span>
                      <span class="mb-unit">tCO₂</span>
                    </div>
                    <div class="mb-sub">能源活动 + 工业过程</div>
                  </div>

                  <div class="cd-metric-box metric-rate">
                    <div class="mb-top">
                      <span class="mb-label">碳排放同比变化</span>
                      <span class="mb-badge is-teal">治理成效</span>
                    </div>
                    <div class="mb-value-row">
                      <span class="mb-num is-teal" :class="kpiTotals.yoyDiff < 0 ? 'down' : 'up'">{{ kpiTotals.yoyDiff > 0 ? '+' : '' }}{{ kpiTotals.yoyDiff }}%</span>
                    </div>
                    <div class="mb-sub">较上年同期治理优化</div>
                  </div>

                  <div class="cd-metric-box metric-offset">
                    <div class="mb-top">
                      <span class="mb-label">单位能耗碳排放</span>
                      <span class="mb-badge is-green">核心硬指标</span>
                    </div>
                    <div class="mb-value-row">
                      <span class="mb-num is-green">{{ kpiTotals.carbonPerTce }}</span>
                      <span class="mb-unit">tCO₂/tce</span>
                    </div>
                    <div class="mb-sub is-green">门槛 ≤ 0.20 · 达标</div>
                  </div>

                  <div class="cd-metric-box metric-net">
                    <div class="mb-top">
                      <span class="mb-label">引导指标达标</span>
                      <span class="mb-badge is-blue">引导指标</span>
                    </div>
                    <div class="mb-value-row">
                      <span class="mb-num is-blue">{{ guidedPassCount }}/{{ guidedApplicableCount }}</span>
                      <span class="mb-unit">项</span>
                    </div>
                    <div class="mb-sub">{{ guidedPassCount === guidedApplicableCount ? '全部达标' : (guidedApplicableCount - guidedPassCount) + ' 项未达标' }}</div>
                  </div>
                </div>

                <!-- 零碳园区建设指标对标横幅（发改委附件3：1核心硬指标 + 5引导指标） -->
                <div class="cd-diagnosis-strip">
                  <div class="ds-top-row">
                    <div class="ds-head">
                      <i class="el-icon-medal"></i>
                      <span>园区对标指标</span>
                    </div>
                    <div class="ds-all-badge" :style="((parkIndicators.carbonPerTceStatus === '达标' ? 1 : 0) + guidedPassCount) === (guidedApplicableCount + 1) ? '' : 'color:#b45309;background:#fffbeb;border-color:#fde68a;'">
                      <i class="el-icon-circle-check"></i>
                      <span>{{ (parkIndicators.carbonPerTceStatus === '达标' ? 1 : 0) + guidedPassCount }}/{{ guidedApplicableCount + 1 }} 项达标<template v-if="((parkIndicators.carbonPerTceStatus === '达标' ? 1 : 0) + guidedPassCount) === (guidedApplicableCount + 1)"> · 全部达标</template><template v-if="exemptGuidedIndicators.length"> ({{ exemptGuidedIndicators.length }} 项已豁免)</template></span>
                    </div>
                  </div>
                  <div class="ds-table">
                    <div class="ds-tr ds-th">
                      <span>指标</span><span>类型</span><span>当前值</span><span>目标要求</span><span>判定</span>
                    </div>
                    <div v-for="r in indicatorRows" :key="r.key"
                      :class="['ds-tr', { 'is-core': r.isCore, 'is-exempt': !r.applicable }]"
                      :title="r.applicable ? (r.calcText || r.name) : ('不适用（已豁免）：' + (r.reason || '未填写理由'))">
                      <span class="ds-name">{{ r.name }}</span>
                      <span><em :class="['ds-type', r.isCore ? 'core' : 'guided']">{{ r.typeName }}</em></span>
                      <span class="ds-val">{{ r.valueText }}</span>
                      <span class="ds-target">{{ r.targetText }}</span>
                      <span>
                        <template v-if="!r.applicable"><em class="ds-tag exempt">不适用</em></template>
                        <template v-else-if="r.pass"><em class="ds-tag ok">达标</em></template>
                        <template v-else><em class="ds-tag fail">未达标</em></template>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 趋势图 -->
                <div class="cd-result-card">
                  <div class="cd-result-title">园区碳排放趋势分析</div>
                  <div ref="resultTrendChart" class="cd-chart cd-chart-trend"></div>
                </div>

                <!-- 构成图与表格 -->
                <div class="cd-result-card">
                  <div class="cd-result-title">碳排放构成</div>
                  <div class="cd-scope-wrap">
                    <div ref="resultPieChart" class="cd-chart cd-chart-pie"></div>
                    <table class="cd-scope-table">
                      <thead>
                        <tr>
                          <th>排放类别</th>
                          <th class="ta-r">占比</th>
                          <th class="ta-r">数值 (tCO₂)</th>
                          <th class="ta-r">同比变化</th>
                          <th class="ta-r" v-if="!isYearMode">环比变化</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="r in resultScopeTable" :key="r.name">
                          <td><span class="cd-sl-dot" :style="{ background: r.color }"></span>{{ r.name }}</td>
                          <td class="ta-r">{{ r.pct }}%</td>
                          <td class="ta-r">{{ r.value.toLocaleString() }}</td>
                          <td class="ta-r">
                            <span :class="r.yoy < 0 ? 'down' : 'up'">{{ r.yoy > 0 ? '+' : '' }}{{ r.yoy }}</span>
                          </td>
                          <td class="ta-r" v-if="!isYearMode">
                            <span :class="r.mom < 0 ? 'down' : 'up'">{{ r.mom > 0 ? '+' : '' }}{{ r.mom }}</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- 重点企业/排放源贡献排名 -->
                <div class="cd-result-card">
                  <div class="cd-result-title">排放源贡献 (Top 8)</div>
                  <div ref="resultCatChart" class="cd-chart cd-chart-cat"></div>
                </div>
              </div>

              <!-- 数据清单 -->
              <div v-show="resultTab === 'list'">
                <div class="cd-grp-list">
                  <div class="cd-grp-total" style="margin:0 0 10px 0;">
                    <span>园区碳排放核算合计</span>
                    <span class="cd-grp-emission" style="color:#0067fe;">{{ kpiTotals.totalEmission.toLocaleString() }} tCO₂e</span>
                  </div>
                  <div v-for="g in resultGroups" :key="g.key" class="cd-grp">
                  <div class="cd-grp-head" @click="toggleGroup(g.key)">
                    <span class="cd-grp-chevron"><i :class="['el-icon-arrow-right', { 'is-open': !groupCollapsed[g.key] }]"></i></span>
                    <span class="cd-grp-scope">{{ g.scope }}</span>
                    <span class="cd-grp-count">{{ g.items.length }} 项</span>
                    <span v-if="typeof g.emission === 'number'" class="cd-grp-emission" :style="{ color: g.emission < 0 ? '#52c41a' : '#0067fe' }">
                      {{ g.emission.toLocaleString() }} tCO₂e
                    </span>
                  </div>
                  <div v-show="!groupCollapsed[g.key]" class="cd-grp-body">
                    <template v-if="!g.paramGroup">
<div v-for="(r, i) in g.items" :key="i" :class="['cd-item', { 'is-missing': !r.hasData }]" @click="openTrace(r, g.key)">
                      <div class="cd-item-head">
                        <span class="cd-item-chevron" @click.stop="toggleItem(g.key + '-' + i)">
                          <i :class="['el-icon-arrow-right', { 'is-open': itemExpanded[g.key + '-' + i] !== false }]"></i>
                        </span>
                        <span class="cd-item-name" @click="openTrace(r, g.key)">{{ r.name }}</span>
                                                <span v-if="!r.hasData" class="cd-tag-missing-badge">待补录</span>
                        <span v-else-if="r.confirmed" class="cd-tag-confirmed">已确认</span>
                        <span v-if="typeof r.emission === 'number'" class="cd-item-emission" :style="{ color: r.emission < 0 ? '#52c41a' : '#0f172a' }">
                          {{ r.emission.toLocaleString() }}<span class="cd-unit"> tCO₂e</span>
                        </span>
                      </div>
                      <div v-show="itemExpanded[g.key + '-' + i] !== false" class="cd-param-wrap">
                        <div class="cd-param-table">
                          <div class="cd-param-tr cd-param-th">
                            <span>参数名称</span><span class="ta-r">参数值</span><span>来源 · 佐证材料</span>
                          </div>
                          <div v-for="(cp, ci) in itemCalcParams(r, g.key)" :key="ci" class="cd-param-tr">
                            <span>{{ ci + 1 }}. {{ cp.label }}</span>
                            <span class="ta-r">
                              <b class="cd-param-num">{{ cp.num }}</b><span class="cd-param-unit">{{ cp.unit }}</span>
                            </span>
                            <span>
                              <span class="cd-param-src">{{ cp.source || '—' }}</span>
                              <span v-if="cp.proof" class="cd-proof-tag" @click.stop="linkProof(r)"><i class="el-icon-paperclip"></i>{{ cp.proof }}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div v-if="itemCalcText(r)" class="cd-calc-block">
                        <span class="cd-calc-label">计算式</span>
                        <span class="cd-calc-expr">{{ itemCalcParts(r).left }}</span>
                        <span v-if="itemCalcParts(r).right" class="cd-calc-eq">=</span>
                        <b v-if="itemCalcParts(r).right" class="cd-calc-result">{{ itemCalcParts(r).right }}</b>
                      </div>
                    </div></template>
                      <div v-else class="cd-param-table">
                        <div class="cd-param-tr cd-param-th">
                          <span>参数名称</span><span class="ta-r">参数值</span><span>来源 · 佐证材料</span>
                        </div>
                        <div v-for="(r, i) in g.items" :key="'p' + i" class="cd-param-tr" :title="(r.dataSource || '') + (r.proof ? ' · ' + r.proof : '')">
                          <span>{{ i + 1 }}. {{ r.name }}</span>
                          <span class="ta-r"><b class="cd-param-num">{{ r.value.toLocaleString() }}</b><span class="cd-param-unit">{{ r.unit }}</span><i v-if="!isPeriodFiled" class="el-icon-edit" style="margin-left:5px;color:#0067fe;cursor:pointer;" title="更正参数值（留痕）" @click.stop="openParamEdit(r, g, null, i)"></i></span>
                          <span><span class="cd-param-src">{{ r.dataSource || '—' }}</span><span v-if="r.proof" class="cd-proof-tag" @click.stop="linkProof(r)"><i class="el-icon-paperclip"></i>{{ r.proof }}</span></span>
                        </div>
                      </div>

                                        <div v-if="g.calcText" class="cd-calc-block" style="margin:10px 0 2px 0;">
                        <span class="cd-calc-label">计算式</span>
                        <span class="cd-calc-expr">{{ groupCalcParts(g).left }}</span>
                        <span v-if="groupCalcParts(g).right" class="cd-calc-eq">=</span>
                        <b v-if="groupCalcParts(g).right" class="cd-calc-result">{{ groupCalcParts(g).right }}</b>
                      </div>
</div>
                </div>
                </div>

                <!-- 数据溯源抽屉 -->
                  <el-drawer
    :visible.sync="traceDrawer"
    size="440px"
    :with-header="false"
    :modal="false"
    custom-class="cd-trace-drawer"
    
  >
    <div v-if="traceRow" class="cd-trace">
      <div class="cd-trace-head">
        <span class="cd-trace-close" title="关闭" @click="traceDrawer = false">
          <i class="el-icon-close"></i>
        </span>
        <div class="cd-trace-title">{{ traceRow.name }}</div>
        <div class="cd-trace-sub">{{ traceRow.scope }} · {{ traceRow.category }}</div>
        <div v-if="typeof traceRow.emission === 'number'" class="cd-trace-emission">
          <b>{{ traceRow.emission.toLocaleString() }}</b><span>tCO₂e</span>
        </div>
      </div>

      <!-- 计算参数（活动数据 / 排放因子） -->
      <div v-for="grp in traceParamGroups()" :key="grp.key" class="cd-trace-part">
        <div class="cd-trace-part-t">
          <span>{{ grp.label }}</span>
          <span class="cd-trace-sec-hint">点 ✏️ 更正（留痕）</span>
        </div>
        <div class="cd-trace-params">
          <div
            v-for="it in grp.items"
            :key="it.ci"
            :class="['cd-trace-prow', { on: activeParam === it.ci }]"
            @click="activeParam = it.ci"
          >
            <span :class="['cd-trace-sym', { 'is-ad': paramSym(it.ci) === 'AD', 'is-ef': paramSym(it.ci) === 'EF' }]">
              {{ paramSym(it.ci) }}
            </span>
            <span class="cd-trace-pname">{{ it.cp.label }}</span>
            <span class="cd-trace-pval">{{ it.cp.val }}</span>
            <i
              v-if="!isPeriodFiled"
              class="el-icon-edit cd-trace-edit"
              title="更正参数值（留痕）"
              @click.stop="openParamEdit(traceRow, it.cp, it.ci)"
            ></i>
          </div>
        </div>
      </div>

      <!-- 当前参数的 凭证 / 匹配 / 记录 -->
      <div v-if="activeParamCp()" class="cd-trace-detail">
        <div class="cd-detail-block">
          <div class="cd-detail-t">凭证材料<span class="cd-detail-sub">{{ activeParamCp().label }}</span></div>
          <div class="cd-proof-card" :class="{ empty: !activeParamCp().proof }">
            <div class="cd-proof-card-h">
              <i class="el-icon-paperclip"></i>
              <span class="cd-proof-card-n">{{ activeParamCp().proof || '暂无凭证材料' }}</span>
              <span v-if="activeParamCp().proof" class="cd-proof-card-tag">已归档</span>
            </div>
            <div v-if="activeParamCp().proof" class="cd-proof-card-b">
              <span class="cd-proof-card-src">{{ activeParamCp().source || '—' }}</span>
              <el-button type="text" size="mini" style="color:#0067fe;padding:0;" @click.stop="linkProof(traceRow)">
                查看 / 下载
              </el-button>
            </div>
            <div v-else class="cd-proof-card-b">
              {{ activeParamMatch() && activeParamMatch().candidates > 1 ? '因子库 / 折算参数无需凭证材料' : '可在「✏️ 更正」中上传佐证附件' }}
            </div>
          </div>
        </div>

        <div class="cd-detail-block">
          <div class="cd-detail-t">匹配过程</div>
          <div v-if="activeParamMatch()" class="cd-match-box">
            <div class="cd-match-row-h">
              <b>{{ activeParamCp().label }}</b>
              <span class="cd-match-tag">匹配 {{ activeParamMatch().candidates }} 候选</span>
            </div>
            <div class="cd-match-row-b">{{ activeParamMatch().rule }}</div>
            <div class="cd-match-row-f">采用：{{ activeParamMatch().adopted }}</div>
          </div>
        </div>

        <div class="cd-detail-block">
          <div class="cd-detail-t">更正记录</div>
          <div v-if="activeParamLogs().length" class="cd-log">
            <div v-for="(l, i) in activeParamLogs()" :key="i" class="cd-log-item">
              <span class="cd-log-time">{{ l.time }}</span>
              <span class="cd-log-txt">{{ l.old }} → {{ l.new }}（{{ l.reason }}）</span>
            </div>
          </div>
          <div v-else class="cd-log-empty">暂无更正记录</div>
        </div>
      </div>
    </div>
  </el-drawer>
              </div>
            </div>

            <!-- 底部固定操作栏 -->
            <div v-if="resultTab === 'list'" key="bar-result-list" class="stage-confirm-bar">
              <span class="stage-confirm-hint"><i class="el-icon-info"></i> {{ currentPeriodKey }} · 园区碳排放总量 {{ kpiTotals.totalEmission.toLocaleString() }} tCO₂ · 单位能耗 {{ kpiTotals.carbonPerTce }} tCO₂/tce</span>
              <span class="stage-confirm-btns">
                <el-button key="btn-archive" size="small" :type="isFiledNow ? 'default' : 'primary'"
                  :icon="isFiledNow ? 'el-icon-unlock' : 'el-icon-lock'"
                  @click="togglePeriodArchive">{{ isPeriodFiled ? '解除锁定' : '锁定本期' }}</el-button>
                <el-button key="btn-export" size="small" icon="el-icon-download" @click="exportCalculationData">导出数据</el-button>
                <el-button key="btn-report" size="small" icon="el-icon-document" @click="generateReport">生成园区核算报告</el-button>
              </span>
            </div>
          </div>

          <!-- Tab 2：配置与模型 -->
          <div v-if="cdActiveTab === 'model'" key="tab-model" class="cd-tab-content cd-tab-model">
            <div class="cd-steps">
              <div :class="['cd-step', { 'is-active': cfgActive === 1 }]" @click="cfgActive = 1">
                <span class="cd-step-no">1</span><span class="cd-step-name">园区主体与依据</span>
              </div>
              <div class="cd-step-line"></div>
              <div :class="['cd-step', { 'is-active': cfgActive === 2 }]" @click="cfgActive = 2">
                <span class="cd-step-no">2</span><span class="cd-step-name">核算底账与源清单</span>
              </div>
              <div class="cd-step-line"></div>
              <div :class="['cd-step', { 'is-active': cfgActive === 3 }]" @click="cfgActive = 3">
                <span class="cd-step-no">3</span><span class="cd-step-name">园区核算模型</span>
              </div>
            </div>

            <div class="cd-model-content cd-model-scroll">
              <!-- ① 园区主体与依据：基础信息 + 政策依据与指标体系 -->
              <div v-show="cfgActive === 1" class="cd-model-section">
                <div class="cd-sub-card">
                  <div class="cd-sub-title">
                    <i class="el-icon-office-building"></i> 园区基础信息
                    <span v-if="isEditing(1)" style="font-size:11px;color:#e6a23c;font-weight:normal;margin-left:auto;">编辑中 · 完成后点击底部「保存」</span>
                  </div>
                  <div class="cd-info-body">
                    <div class="cd-info-row">
                      <span class="cd-ir-label">园区名称</span>
                      <span v-if="!isEditing(1)" class="cd-ir-val">{{ parkInfo.name }}</span>
                      <el-input v-else v-model="parkInfo.name" size="mini" placeholder="请输入园区全称" style="flex:1;"></el-input>
                    </div>
                    <div class="cd-info-row">
                      <span class="cd-ir-label">规划面积</span>
                      <span v-if="!isEditing(1)" class="cd-ir-val">{{ formatArea(parkInfo.area) }}</span>
                      <div v-else style="display:flex;align-items:center;flex:1;justify-content:flex-end;">
                        <el-input-number v-model="parkInfo.area" :precision="2" :step="10000" :min="0" size="mini" controls-position="right" style="width:160px;margin-right:6px;"></el-input-number>
                        <span style="font-size:12px;color:#64748b;font-weight:500;">m²</span>
                      </div>
                    </div>
                    <div class="cd-info-row">
                      <span class="cd-ir-label">年能耗规模</span>
                      <span v-if="!isEditing(1)" class="cd-ir-val">{{ parkInfo.annualEnergyScale }}</span>
                      <el-select v-else v-model="parkInfo.annualEnergyScale" size="mini" style="flex:1;">
                        <el-option label="100万tce以下" value="100万tce以下"></el-option>
                        <el-option label="100万tce及以上" value="100万tce及以上"></el-option>
                      </el-select>
                    </div>
                    <div class="cd-info-row">
                      <span class="cd-ir-label">规上企业</span>
                      <span v-if="!isEditing(1)" class="cd-ir-val">{{ parkInfo.enterprisesCount }} 家重点用能企业</span>
                      <div v-else style="display:flex;align-items:center;flex:1;justify-content:flex-end;">
                        <el-input-number v-model="parkInfo.enterprisesCount" :min="1" :max="2000" size="mini" controls-position="right" style="width:120px;margin-right:6px;"></el-input-number>
                        <span style="font-size:12px;color:#64748b;">家</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 核算政策依据与指标体系（标准联动带出） -->
                <div class="cd-sub-card" style="margin-top: 12px;">
                  <div class="cd-sub-title">
                    <i class="el-icon-reading"></i> 核算依据与指标体系
                                      </div>
                  <div class="cd-info-body">
                    <!-- 核算标准（下拉联动） -->
                    <div class="cd-info-row" style="align-items:flex-start;">
                      <span class="cd-ir-label" style="padding-top:4px;">核算标准</span>
                      <div v-if="!isEditing(1)" class="cd-ir-val" style="display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:4px;">
                        <span style="font-weight:600;color:#0067fe;">{{ currentStandard.name }}</span>
                        <span style="font-size:10px;color:#16a34a;background:#f0fdf4;padding:1px 6px;border-radius:3px;border:1px solid #bbf7d0;">{{ currentStandard.status }}</span>
                      </div>
                      <el-select v-else v-model="selectedStandardCode" size="mini" style="flex:1;" @change="onStandardChange">
                        <el-option v-for="std in standards" :key="std.code" :label="std.name" :value="std.code">
                          <span style="float:left">{{ std.name }}</span>
                          <span style="float:right;color:#8492a6;font-size:12px">{{ std.status }}</span>
                        </el-option>
                      </el-select>
                    </div>

                    <!-- 评价指标体系（由标准带出） -->
                    <div class="cd-info-row">
                      <span class="cd-ir-label">指标体系</span>
                      <span class="cd-ir-val" style="color:#475569;">{{ currentStandard.indicatorSystemName }}</span>
                    </div>

                    <!-- 建设评价指标列表（1 项核心 + 5 项引导 统一风格渲染） -->
                    <div style="margin-top:12px;">
                      <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;margin-bottom:8px;border-bottom:1px dashed #e2e8f0;">
                        <span style="font-weight:600;font-size:12px;color:#334155;">评价指标体系配置（共 6 项）</span>
                        <span style="font-size:11px;color:#94a3b8;">1 核心（必考） · 适用 {{ applicableGuidedIndicators.length }} 引导 · 豁免 {{ exemptGuidedIndicators.length }} 引导</span>
                      </div>

                      <div v-for="item in indicatorList" :key="item.key" style="padding:9px 12px;background:#f8fafc;border-radius:6px;margin:7px 0;border:1px solid #f1f5f9;">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                          <div style="display:flex;align-items:center;gap:6px;">
                            <span :style="{
                              fontSize: '10.5px',
                              padding: '1px 6px',
                              borderRadius: '3px',
                              fontWeight: '600',
                              color: item.isCore ? '#1d4ed8' : '#0891b2',
                              background: item.isCore ? '#eff6ff' : '#ecfeff',
                              border: '1px solid ' + (item.isCore ? '#bfdbfe' : '#a5f3fc')
                            }">{{ item.typeName }}</span>
                            <span style="font-size:12.5px;font-weight:600;color:#1e293b;">{{ item.name }}</span>
                          </div>

                          <!-- 适用状态与控制 -->
                          <div>
                            <!-- 核心指标：固定适用，强制考核 -->
                            <template v-if="item.required">
                              <span style="font-size:11px;color:#1e40af;background:#eff6ff;padding:2px 8px;border-radius:4px;border:1px solid #bfdbfe;display:flex;align-items:center;gap:3px;">
                                <i class="el-icon-lock" style="font-size:10px;"></i> 强制考核
                              </span>
                            </template>

                            <!-- 引导指标：支持适用与不适用裁剪 -->
                            <template v-else>
                              <template v-if="!isEditing(1)">
                                <span v-if="item.applicable" style="font-size:11px;color:#16a34a;background:#f0fdf4;padding:2px 8px;border-radius:4px;border:1px solid #bbf7d0;">适用</span>
                                <span v-else style="font-size:11px;color:#64748b;background:#f1f5f9;padding:2px 8px;border-radius:4px;border:1px solid #cbd5e1;">不适用（已豁免）</span>
                              </template>
                              <template v-else>
                                <el-radio-group v-model="getGuidedIndicator(item.key).applicable" size="mini">
                                  <el-radio-button :label="true">适用</el-radio-button>
                                  <el-radio-button :label="false">不适用</el-radio-button>
                                </el-radio-group>
                              </template>
                            </template>
                          </div>
                        </div>


                        <!-- 引导指标不适用理由展示/填报 -->
                        <div v-if="!item.required && !item.applicable" style="margin-top:6px;padding-top:6px;border-top:1px dashed #e2e8f0;">
                          <div v-if="!isEditing(1)" style="font-size:11px;color:#d97706;display:flex;align-items:flex-start;gap:4px;">
                            <i class="el-icon-warning-outline" style="margin-top:2px;"></i>
                            <span>豁免理由：{{ item.reason || '未填写具体豁免说明' }}</span>
                          </div>
                          <div v-else>
                            <el-input
                              v-model="getGuidedIndicator(item.key).reason"
                              size="mini"
                              placeholder="请填报不适用理由（作为发改委零碳园区验收评审存证依据）"
                              clearable
                            >
                              <template slot="prepend"><span style="color:#e6a23c;">豁免理由</span></template>
                            </el-input>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ② 核算底账与源清单（碳排放源清单 + 评价其他计算参数清单） -->
              <div v-show="cfgActive === 2" class="cd-model-section">
                <!-- 顶部双板块子切换选项卡 -->
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:4px;background:#f1f5f9;border-radius:6px;">
                  <div style="display:flex;gap:4px;">
                    <button
                      type="button"
                      key="btn-stage2-sources"
                      :style="{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: stage2SubTab === 'sources' ? '700' : 'normal',
                        color: stage2SubTab === 'sources' ? '#0067fe' : '#64748b',
                        background: stage2SubTab === 'sources' ? '#ffffff' : 'transparent',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        boxShadow: stage2SubTab === 'sources' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }"
                      @click="stage2SubTab = 'sources'"
                    >
                      <i class="el-icon-data-line"></i> 碳排放源清单
                      <span style="font-size:10.5px;background:#e2e8f0;padding:1px 6px;border-radius:10px;color:#475569;">{{ emissionSources.length }}</span>
                    </button>
                    <button
                      type="button"
                      key="btn-stage2-ledgers"
                      :style="{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: stage2SubTab === 'ledgers' ? '700' : 'normal',
                        color: stage2SubTab === 'ledgers' ? '#0067fe' : '#64748b',
                        background: stage2SubTab === 'ledgers' ? '#ffffff' : 'transparent',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        boxShadow: stage2SubTab === 'ledgers' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }"
                      @click="stage2SubTab = 'ledgers'"
                    >
                      <i class="el-icon-document-checked"></i> 其他计算参数清单
                      <span style="font-size:10.5px;background:#e2e8f0;padding:1px 6px;border-radius:10px;color:#475569;">{{ paramGroups.reduce((a, g) => a + g.items.length, 0) }}</span>
                    </button>
                  </div>
                </div>

                <!-- 1. 板块一：碳排放源清单 -->
                <div v-show="stage2SubTab === 'sources'" class="cd-sub-card">
                  <div class="cd-sub-title" style="display:flex;align-items:center;justify-content:space-between;">
                    <div style="display:flex;align-items:center;">
                      <i class="el-icon-data-line" style="color:#0067fe;margin-right:6px;"></i>
                      <span style="font-weight:600;font-size:13px;color:#1e293b;">零碳园区碳排放源清单</span>
                      <span class="cd-sub-note" style="font-size:11px;color:#94a3b8;margin-left:8px;">化石燃料燃烧 · 能源加工转换 · 净购入电力热力 · 工业过程</span>
                    </div>
                    <el-button v-if="isEditing(2)" type="primary" size="mini" icon="el-icon-plus" @click="openAddSource()">新增排放源</el-button>
                  </div>

                                    <!-- 筛选控制条（园区统一核算边界，仅按类别与数据通道筛选） -->
                  <div style="display:flex;gap:8px;margin-top:10px;align-items:center;flex-wrap:wrap;">
                    <el-select v-model="sourceFilterCategory" size="mini" placeholder="核算类别" style="width:140px;">
                      <el-option label="全部分类" value="all"></el-option>
                      <el-option v-for="cat in sourceCategories" :key="cat" :label="cat" :value="cat"></el-option>
                    </el-select>
                    <el-select v-model="sourceFilterChannel" size="mini" placeholder="数据来源渠道" style="width:150px;">
                      <el-option label="全部数据渠道" value="all"></el-option>
                      <el-option label="底座数据识别" value="底座数据识别"></el-option>
                      <el-option label="材料识别" value="材料识别"></el-option>
                    </el-select>
                    <span style="font-size:11px;color:#64748b;margin-left:auto;">
                      统一核算主体：<strong>{{ parkInfo.name }}</strong> · 筛选 {{ filteredEmissionSources.length }} 项 / 共 {{ emissionSources.length }} 项
                    </span>
                  </div>

                  <!-- 按照四大法定分类分组展示 -->
                  <div style="margin-top:12px;display:flex;flex-direction:column;gap:12px;">
                    <div
                      v-for="group in groupedEmissionSources"
                      :key="group.key"
                      v-show="sourceFilterCategory === 'all' || sourceFilterCategory === group.category"
                      style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.02);"
                    >
                      <!-- 分组头部 -->
                      <div style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center;">
                        <div style="display:flex;align-items:center;gap:8px;">
                          <span :style="{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: group.badgeColor
                          }"></span>
                          <span style="font-size:13px;font-weight:700;color:#0f172a;">{{ group.name }}</span>
                          <span style="font-size:11px;color:#64748b;">({{ group.totalCount }} 项)</span>
                          <span style="font-size:10.5px;color:#94a3b8;margin-left:4px;">
                            <span v-if="group.platformCount > 0" style="color:#16a34a;margin-right:6px;">底座数据识别 {{ group.platformCount }}</span>
                            <span v-if="group.ocrCount > 0" style="color:#ea580c;">材料识别 {{ group.ocrCount }}</span>
                          </span>
                        </div>

                        <!-- 编辑态提供该分类快捷添加按钮 -->
                        <div v-if="isEditing(2)">
                          <el-button type="text" size="mini" icon="el-icon-plus" style="padding:0;font-size:12px;color:#0067fe;" @click.stop="openAddSource(group.category)">
                            添加该类源
                          </el-button>
                        </div>
                      </div>

                      <!-- 组内卡片列表 -->
                      <div style="padding:8px 10px;display:flex;flex-direction:column;gap:8px;">
                        <template v-if="group.items && group.items.length > 0">
                          <div
                            v-for="(item, idx) in group.items"
                            :key="item.id"
                            style="padding:9px 11px;background:#ffffff;border-radius:6px;border:1px solid #e2e8f0;transition:all 0.2s ease;"
                          >
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                              <div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0;">
                                <span style="font-size:10.5px;color:#64748b;font-family:monospace;background:#f1f5f9;padding:1px 6px;border-radius:3px;border:1px solid #e2e8f0;font-weight:600;">
                                  {{ String(item.id).padStart(2, '0') }}
                                </span>
                                <span v-if="group.productOriented" style="font-size:10px;color:#7c3aed;background:#f5f3ff;padding:1px 5px;border-radius:3px;border:1px solid #ddd6fe;font-weight:600;">重点产品</span>
                                <span style="font-size:12.5px;font-weight:600;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ item.name }}</span>
                                <span v-if="!item.enabled" style="font-size:10px;color:#94a3b8;background:#f1f5f9;padding:1px 5px;border-radius:3px;">已停用</span>
                              </div>

                              <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                                <template v-if="isEditing(2)">
                                  <el-button type="text" size="mini" icon="el-icon-edit" style="color:#0067fe;padding:0;font-size:13px;" @click.stop="openEditSource(item)" title="编辑"></el-button>
                                  <el-button type="text" size="mini" icon="el-icon-delete" style="color:#ef4444;padding:0;font-size:13px;" @click.stop="deleteSource(item)" title="删除"></el-button>
                                </template>
                              </div>
                            </div>


                            <div style="margin-top:5px;font-size:11px;color:#475569;display:flex;align-items:center;gap:4px;background:#f8fafc;padding:3px 8px;border-radius:4px;">
                              <i class="el-icon-link" style="color:#0067fe;"></i>
                              <span style="color:#64748b;">数据渠道：</span>
                              <strong style="color:#0f172a;">{{ item.channel }}</strong>
                              <template v-if="item.channelDetail">
                                <span style="color:#94a3b8;">·</span>
                                <span>{{ item.channelDetail }}</span>
                              </template>
                            </div>
                          </div>
                        </template>

                        <div v-else style="padding:14px 0;text-align:center;color:#94a3b8;font-size:11.5px;">
                          该分类下暂无符合筛选条件的排放源
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 2. 板块二：评价其他计算参数清单（与阶段1适用指标实时联动） -->
                <div v-show="stage2SubTab === 'ledgers'" class="cd-sub-card">
                  <div class="cd-sub-title" style="display:flex;align-items:center;justify-content:space-between;">
                    <div style="display:flex;align-items:center;">
                      <i class="el-icon-document-checked" style="color:#0067fe;margin-right:6px;"></i>
                      <span style="font-weight:600;font-size:13px;color:#1e293b;">其他计算参数清单</span>
                      <span class="cd-sub-note" style="font-size:11px;color:#94a3b8;margin-left:8px;">1项核心指标能耗分母 + 5项引导指标计算输入参数</span>
                    </div>
                  </div>

                  <!-- 指标参数输入分组（按评价指标分组，组内为所需参数输入） -->
                  <div style="margin-top:12px;display:flex;flex-direction:column;gap:10px;">
                    <div v-for="g in paramGroups" :key="g.key" style="border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;background:#ffffff;">
                      <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div style="display:flex;align-items:center;gap:6px;">
                          <span :style="{ fontSize: '10.5px', padding: '1px 7px', borderRadius: '3px', fontWeight: '600', color: g.isCore ? '#1d4ed8' : '#0891b2', background: g.isCore ? '#eff6ff' : '#ecfeff', border: '1px solid ' + (g.isCore ? '#bfdbfe' : '#a5f3fc') }">{{ g.typeName }}</span>
                          <span style="font-size:12.5px;font-weight:600;color:#1e293b;">{{ g.indicatorName }}</span>
                        </div>
                        <span v-if="!g.applicable" style="font-size:10.5px;color:#64748b;background:#f1f5f9;padding:2px 8px;border-radius:4px;border:1px solid #cbd5e1;">不适用</span>
                      </div>
                      <div v-for="p in g.items" :key="p.id" style="margin-top:8px;padding:8px 10px;background:#f8fafc;border-radius:4px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                          <span style="font-size:12px;font-weight:600;color:#1e293b;">输入参数：{{ p.name }}</span>
                          <span style="font-size:10.5px;font-weight:600;color:#16a34a;">{{ p.channel }}</span>
                        </div>
                        <div v-if="p.channel !== '系统汇总' && p.channelDetail" style="margin-top:4px;font-size:11px;color:#64748b;">{{ p.channelDetail }}</div>
                        <div v-if="!p.applicable" style="margin-top:4px;font-size:11px;color:#d97706;">不适用：{{ p.reason || '豁免' }}</div>
                        <el-button v-if="isEditing(2) && g.applicable && p.channel !== '系统汇总'" type="text" size="mini" icon="el-icon-edit" style="color:#0067fe;padding:0;font-size:12px;margin-top:4px;" @click.stop="openEditParam(p)">编辑数据渠道</el-button>
                      </div>
                    </div>
                  </div>
                  </div>
              </div>

              <!-- ③ 园区核算模型（公式关联与核算模型树中枢） -->
              <div v-show="cfgActive === 3" class="cd-model-section">
                <!-- 园区碳排放综合核算总模型 -->
                <div class="cd-sub-card">
                  <div class="cd-sub-title">
                    <i class="el-icon-cpu" style="color:#0067fe;"></i> 园区碳排放核算主模型
                    <span style="font-size:11px;color:#16a34a;background:#f0fdf4;padding:1px 6px;border-radius:3px;margin-left:auto;border:1px solid #bbf7d0;">发改委试行方法</span>
                  </div>
                  <div style="margin-top:8px;padding:10px 12px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">
                    <div style="font-size:12.5px;font-weight:700;color:#0f172a;font-family:monospace;">
                      E_园区总排放 = E_燃烧 + E_转换 + E_净购入 + E_过程
                    </div>
                  </div>
                </div>

                <!-- 四大分类核算模型树与公式关联映射 -->
                <div class="cd-sub-card" style="margin-top:12px;">
                  <div class="cd-sub-title">
                    <i class="el-icon-s-operation" style="color:#0067fe;"></i> 分类核算公式树与清单源关联映射
                  </div>

                  <div style="display:flex;flex-direction:column;gap:10px;margin-top:10px;">
                    <!-- 1. 化石燃料燃烧核算模型 -->
                    <div style="border:1px solid #fde68a;background:#fffdfa;border-radius:6px;padding:10px 12px;">
                      <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:12.5px;font-weight:700;color:#92400e;display:flex;align-items:center;gap:6px;">
                          <i class="el-icon-folder"></i> 1. 化石燃料燃烧模型 (E_燃烧)
                        </span>
                        <span style="font-size:11px;color:#d97706;background:#fef3c7;padding:1px 6px;border-radius:3px;">直接排放 · 范围1</span>
                      </div>
                      <div style="margin-top:6px;font-family:monospace;font-size:11.5px;color:#1e293b;background:#ffffff;padding:6px 8px;border-radius:4px;border:1px solid #fed7aa;">
                        E_燃烧 = ∑ [ 燃料消耗量(FC) × 低位发热量(NCV) × 单位热值含碳量(CC) × 碳氧化率(OF) × 44/12 ]
                      </div>
                      <div style="margin-top:6px;font-size:11px;color:#64748b;line-height:1.6;">
                        <div>• <strong>关联排放源</strong>：② 排放源清单 · 化石燃料燃烧类</div>
                        <div>• <strong>因子库关联</strong>：<span style="color:#0067fe;cursor:pointer;text-decoration:underline;" @click="openFactorLibrary">《国家温室气体清单排放因子库》</span></div>
                      </div>
                    </div>

                    <!-- 2. 能源加工转换核算模型 -->
                    <div style="border:1px solid #bae6fd;background:#f8fafc;border-radius:6px;padding:10px 12px;">
                      <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:12.5px;font-weight:700;color:#0369a1;display:flex;align-items:center;gap:6px;">
                          <i class="el-icon-folder"></i> 2. 能源加工转换模型 (E_转换)
                        </span>
                        <span style="font-size:11px;color:#0284c7;background:#e0f2fe;padding:1px 6px;border-radius:3px;">二次加工与损耗</span>
                      </div>
                      <div style="margin-top:6px;font-family:monospace;font-size:11.5px;color:#1e293b;background:#ffffff;padding:6px 8px;border-radius:4px;border:1px solid #bae6fd;">
                        E_转换 = ∑ [ 转换投入能源(AD_入) × EF_入 - 产出二次能源产品(AD_出) × EF_出 ]
                      </div>
                      <div style="margin-top:6px;font-size:11px;color:#64748b;line-height:1.6;">
                        <div>• <strong>关联排放源</strong>：② 排放源清单 · 能源加工转换类</div>
                        <div>• <strong>因子库关联</strong>：<span style="color:#0067fe;cursor:pointer;text-decoration:underline;" @click="openFactorLibrary">《国家温室气体清单排放因子库》</span></div>
                      </div>
                    </div>

                    <!-- 3. 净购入电力热力核算模型 -->
                    <div style="border:1px solid #bfdbfe;background:#f8fafc;border-radius:6px;padding:10px 12px;">
                      <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:12.5px;font-weight:700;color:#1d4ed8;display:flex;align-items:center;gap:6px;">
                          <i class="el-icon-folder"></i> 3. 净购入电力热力模型 (E_净购入)
                        </span>
                        <span style="font-size:11px;color:#2563eb;background:#dbeafe;padding:1px 6px;border-radius:3px;">间接排放 · 含零碳核减</span>
                      </div>
                      <div style="margin-top:6px;font-family:monospace;font-size:11.5px;color:#1e293b;background:#ffffff;padding:6px 8px;border-radius:4px;border:1px solid #bfdbfe;">
                        E_净购入 = Σ(受入电力种类_i × EF_i) − Σ(送出电力种类_i × EF_i) + Σ(受入热力种类_i × HF_i) − Σ(送出热力种类_i × HF_i)（自发自用电量计入受入；光伏、绿电核销 EF = 0）
                      </div>
                      <div style="margin-top:6px;font-size:11px;color:#64748b;line-height:1.6;">
                        <div>• <strong>关联排放源</strong>：② 排放源清单 · 净购入电力热力类（含零碳核减）</div>
                        <div>• <strong>零碳抵扣源</strong>：分布式光伏自用（逆变器直连）、跨省交易绿电与绿证（交易中心凭证OCR），按发改委规则按 0 碳因子抵扣受入电量</div>
                        <div>• <strong>因子库关联</strong>：<span style="color:#0067fe;cursor:pointer;text-decoration:underline;" @click="openFactorLibrary">《国家温室气体清单排放因子库》</span></div>
                      </div>
                    </div>
                                        <!-- 4. 工业过程核算模型（具体产品归口） -->
                    <div style="border:1px solid #ddd6fe;background:#faf5ff;border-radius:6px;padding:10px 12px;">
                      <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:12.5px;font-weight:700;color:#6d28d9;display:flex;align-items:center;gap:6px;">
                          <i class="el-icon-folder"></i> 4. 工业过程核算模型 (E_过程)
                        </span>
                        <span style="font-size:11px;color:#7c3aed;background:#ede9fe;padding:1px 6px;border-radius:3px;">重点工业具体产品归口</span>
                      </div>
                      <div style="margin-top:6px;font-family:monospace;font-size:11.5px;color:#1e293b;background:#ffffff;padding:6px 8px;border-radius:4px;border:1px solid #ddd6fe;">
                        E_过程 = ∑(具体工业产品产量 P_j × 单位产品过程排放因子 EF_j)
                      </div>
                      <div style="margin-top:6px;font-size:11px;color:#64748b;line-height:1.6;">
                        <div>• <strong>关联排放源</strong>：② 排放源清单 · 工业过程类（按产品归口，产品数量随清单维护）</div>
                        <div>• <strong>因子来源</strong>：企业实测材料等文件（分产品实测与核查数据）</div>
                      </div>
                    </div>

<!-- 5. 其他指标计算模型（1核心 + 5引导，输入参数与②计算参数清单一一对应） -->
                    <div style="border:1px solid #a5f3fc;background:#f8fffe;border-radius:6px;padding:10px 12px;">
                      <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:12.5px;font-weight:700;color:#0e7490;display:flex;align-items:center;gap:6px;">
                          <i class="el-icon-folder"></i> 5. 其他指标计算模型（1 核心 + 5 引导）
                        </span>
                        <span style="font-size:11px;color:#0891b2;background:#ecfeff;padding:1px 6px;border-radius:3px;">输入参数见②计算参数清单</span>
                      </div>
                      <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px;">
                        <div style="font-family:monospace;font-size:11.5px;color:#1e293b;background:#ffffff;padding:6px 8px;border-radius:4px;border:1px solid #e2e8f0;">
                          单位能耗碳排放（核心）= 园区综合碳排放量 ÷ 园区综合能耗量
                        </div>
                        <div style="font-family:monospace;font-size:11.5px;color:#1e293b;background:#ffffff;padding:6px 8px;border-radius:4px;border:1px solid #e2e8f0;">
                          清洁能源消费比重 = 非化石能源折标消纳量 ÷ 园区综合能耗量 × 100%
                        </div>
                        <div style="font-family:monospace;font-size:11.5px;color:#1e293b;background:#ffffff;padding:6px 8px;border-radius:4px;border:1px solid #e2e8f0;">
                          产品能效达标比例 = 能效达标产品类型数量 ÷ 产品类型总数 × 100%
                        </div>
                        <div style="font-family:monospace;font-size:11.5px;color:#1e293b;background:#ffffff;padding:6px 8px;border-radius:4px;border:1px solid #e2e8f0;">
                          工业固废综合利用率 = 固废综合利用量 ÷ 固废产生总量 × 100%
                        </div>
                        <div style="font-family:monospace;font-size:11.5px;color:#1e293b;background:#ffffff;padding:6px 8px;border-radius:4px;border:1px solid #e2e8f0;">
                          工业余能利用率 = Σ[各类余能已利用量 ×（已利用量 ÷ 理论可回收量）] ÷ Σ各类余能已利用量 × 100%
                        </div>
                        <div style="font-family:monospace;font-size:11.5px;color:#1e293b;background:#ffffff;padding:6px 8px;border-radius:4px;border:1px solid #e2e8f0;">
                          中水回用率 = 中水利用量 ÷ 具备回用条件总用水量 × 100%
                        </div>
                      </div>
                    </div>

                                      </div>
                </div>
              </div>
            </div>

            <!-- 操作页脚 -->
            <div class="stage-confirm-bar">
              <span class="stage-confirm-hint"><i class="el-icon-info"></i> {{ cfgBarHint }}</span>
              <span class="stage-confirm-btns">
                <el-button v-if="!isEditing(cfgActive)" key="btn-cfg-edit" type="primary" size="small" icon="el-icon-edit" @click="startCfgEdit(cfgActive)">修改</el-button>
                <template v-else>
                  <el-button key="btn-cfg-cancel" size="small" icon="el-icon-close" @click="cancelCfgEdit">取消</el-button>
                  <el-button key="btn-cfg-save" type="primary" size="small" icon="el-icon-check" @click="saveCfgEdit">保存</el-button>
                </template>
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- 排放源新增/编辑弹窗 -->
    <el-dialog :title="sourceIsEdit ? '编辑零碳园区排放源' : '新增零碳园区排放源'" :visible.sync="sourceDialog" width="500px" append-to-body>
      <el-form label-width="110px" size="small">
        <el-form-item label="法定核算类别" required>
          <el-select v-model="sourceForm.category" placeholder="请选择" style="width:100%;">
            <el-option label="化石燃料燃烧" value="化石燃料燃烧"></el-option>
            <el-option label="能源加工转换" value="能源加工转换"></el-option>
            <el-option label="净购入电力热力" value="净购入电力热力"></el-option>
            <el-option label="工业过程（具体产品归口）" value="工业过程"></el-option>
          </el-select>
        </el-form-item>

        <!-- 工业过程专项产品核算指引 -->
        <div v-if="sourceForm.category === '工业过程'" style="margin: -6px 0 12px 110px;padding: 6px 10px;background:#f5f3ff;border-radius:4px;border:1px solid #ddd6fe;font-size:11px;color:#6b21a8;line-height:1.5;">
          <i class="el-icon-info"></i> 以具体工业产品归口核算（基于产品产量台账与辅料/特气耗用）
        </div>

        <el-form-item :label="sourceForm.category === '工业过程' ? '具体工业产品' : '排放源名称'" required>
          <el-input
            v-model="sourceForm.name"
            :placeholder="sourceForm.category === '工业过程' ? '如：12英寸集成电路芯片（半导体晶圆产品）' : '如：集中供热天然气蒸汽锅炉 / 110kV综合变电站受电'"
          ></el-input>
        </el-form-item>

        <el-form-item label="核算申报主体">
          <div style="font-size:12px;color:#0f172a;font-weight:600;padding-top:4px;">
            {{ parkInfo.name }}
            <span style="font-size:10.5px;color:#16a34a;background:#f0fdf4;padding:1px 6px;border-radius:3px;margin-left:6px;border:1px solid #bbf7d0;font-weight:normal;">园区统一核算主体</span>
          </div>
        </el-form-item>
        <el-form-item label="数据获取渠道" required>
          <el-radio-group v-model="sourceForm.channel">
            <el-radio label="底座数据识别">底座数据识别（在线表计/系统直连）</el-radio>
            <el-radio label="材料识别">材料识别（单据/台账/检测报告解析）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="通道/凭证说明">
          <el-input
            v-model="sourceForm.channelDetail"
            :placeholder="sourceForm.category === '工业过程' ? '如：ERP产品下线台账 & 电子特气耗用监测排污报告' : '如：SCADA总流量计直连 / 电力交易中心绿电凭证OCR'"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="sourceDialog = false">取消</el-button>
        <el-button type="primary" size="small" @click="saveSource">确定保存</el-button>
      </span>
    </el-dialog>

    <!-- 其他计算参数清单编辑弹窗 -->
    <el-dialog title="编辑计算参数数据渠道" :visible.sync="indicatorLedgerDialog" width="500px" append-to-body>
        <el-form label-width="90px" size="small">
          <el-form-item label="参数名称">
            <el-input v-model="indicatorLedgerForm.name" disabled></el-input>
          </el-form-item>
          <el-form-item label="数据渠道" required>
            <el-radio-group v-model="indicatorLedgerForm.channel">
              <el-radio label="底座数据识别">底座数据识别（在线表计/系统直连）</el-radio>
              <el-radio label="材料识别">材料识别（单据/台账/检测报告解析）</el-radio>
              <el-radio label="系统汇总">系统汇总（由排放源清单核算结果自动汇总）</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="渠道说明" required>
            <el-input v-model="indicatorLedgerForm.channelDetail" type="textarea" :rows="2" placeholder="数据接入方式说明"></el-input>
          </el-form-item>
        </el-form>
        <div slot="footer" style="text-align:right;">
          <el-button size="small" @click="indicatorLedgerDialog = false">取消</el-button>
          <el-button size="small" type="primary" @click="saveParam">保存</el-button>
        </div>
      </el-dialog>

    <!-- 计算参数更正弹窗（锁期前可改，留痕） -->
    <el-dialog title="更正计算参数" :visible.sync="paramEditDialog" width="460px" append-to-body>
      <el-form label-width="80px" size="small">
        <el-form-item label="参数名称"><el-input :value="paramEditForm.name" disabled></el-input></el-form-item>
        <el-form-item label="原值"><el-input :value="paramEditForm.oldVal + ' ' + paramEditForm.unit" disabled></el-input></el-form-item>
        <el-form-item label="新值" required><el-input v-model="paramEditForm.val"></el-input></el-form-item>
        <el-form-item label="更正理由" required><el-input v-model="paramEditForm.reason" type="textarea" :rows="2" placeholder="如：抄表读数修正 / 凭证补录"></el-input></el-form-item>
        <el-form-item label="佐证附件">
          <div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;">
            <span v-if="paramEditTarget && paramEditTarget.r && paramEditTarget.r.proof" class="cd-proof-tag" style="cursor:default;">
              <i class="el-icon-paperclip"></i>{{ paramEditTarget.r.proof }}
            </span>
            <span v-else style="font-size:11px;color:#94a3b8;">暂无附件</span>
            <el-button size="mini" plain icon="el-icon-upload2" @click="linkProof(paramEditTarget && paramEditTarget.r)">上传附件</el-button>
          </div>
        </el-form-item>
      </el-form>
      <div style="font-size:11px;color:#94a3b8;line-height:1.6;">更正将留痕（原值/新值/理由/时间），并重算该行排放、组小计与园区总量；本期锁定后不可更正。</div>
      <div slot="footer" style="text-align:right;">
        <el-button size="small" @click="paramEditDialog = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveParamEdit">保存更正</el-button>
      </div>
    </el-dialog>

    <!-- 新手引导浮层 -->
    <onboarding-guide
      :visible="showOnboarding"
      :step="onboardingStep"
      :steps-override="onboardingSteps"
      @skip="finishOnboarding"
      @prev="onboardingStep--"
      @next="onboardingStep++"
      @finish="finishOnboarding"
      @finish-all="finishOnboarding"
    />
  </div>
</template>

<script>
import AgentIcon from '@/pages/zcip/common/AgentIcon.vue'
import OnboardingGuide from '../../agent-center/components/OnboardingGuide.vue'
import traceGuideMixin from '../../common/traceGuideMixin'
import agentCoreMixin from './agentCoreMixin'
import agentChatMixin from './agentChatMixin'

export default {
  name: 'ParkAccountingAgent',
  components: {
    AgentIcon, OnboardingGuide },
  mixins: [traceGuideMixin, agentCoreMixin, agentChatMixin]
}
</script>

<style src="../../footprint/accounting/agent-global.css"></style>
<style scoped src="./agent-scoped.css"></style>
