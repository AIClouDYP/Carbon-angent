<template>
  <div class="zcf-agent-page">
    <!-- ===== 默认模式（三栏：历史对话 + 对话框 + 任务列表） ===== -->
    <div v-if="pageMode === 'task-list'" class="cd-body">
      <!-- 左栏：历史对话（可收缩） -->
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

      <!-- 中栏：对话框 -->
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
            <span class="token-counter" v-if="estimatedTokens > 0"><i class="el-icon-coin"></i> {{ formattedTokens }}</span>
            <span class="header-onboarding-btn" @click="startOnboarding"><i class="el-icon-aim"></i> 新手引导</span>
            <span class="toolbar-icon-sep" @click="newConversation"><i class="el-icon-plus"></i> 新建对话</span>
          </div>
        </div>
        <div class="chat-messages" ref="tlDialogMessages">
          <!-- 对话消息（含欢迎消息） -->
          <div v-for="(msg, i) in tlMessages" :key="i" :class="['message-row', msg.role === 'user' ? 'message--user' : 'message--assistant']">
            <div v-if="msg.role !== 'user'" class="msg-avatar"><AgentIcon icon="ai-core" :color="themeColor" :size="26" /></div>
            <div class="msg-body">
              <div class="msg-text" v-html="msg.text || msg.content"></div>
              <div v-if="msg.suggestions && msg.suggestions.length" class="msg-suggestions">
                <span v-for="s in msg.suggestions" :key="s" class="suggestion-btn" @click="useTlCmd(s)">{{ s }}</span>
              </div>
            </div>
          </div>
          <!-- 历史任务卡片（对话中展示） -->
          <template v-if="tlDialogStep === 'show-history' && taskList.length > 0">
            <div class="message-row message--assistant">
              <div class="msg-avatar"><AgentIcon icon="ai-core" :color="themeColor" :size="26" /></div>
              <div class="msg-body">
                <div class="msg-text">
                  <div class="tl-history-cards">
                    <div v-for="task in sortedTaskList" :key="task.id" class="tl-history-card" @click="continueTask(task)">
                      <div class="tl-hc-top">
                        <div class="tl-hc-icon" :style="{ backgroundColor: task.status === 'completed' ? '#52c41a' : '#0067FE' }">
                          <i :class="task.status === 'completed' ? 'el-icon-circle-check' : 'el-icon-loading'"></i>
                        </div>
                        <div class="tl-hc-info">
                          <div class="tl-hc-name">{{ task.factoryName }}</div>
                          <div class="tl-hc-meta">
                            <el-tag size="mini" :type="getTaskStatusType(task.status)" effect="dark">{{ getTaskStatusLabel(task.status) }}</el-tag>
                            <span class="tl-hc-standard">
                              <span :style="{ color: task.caseType === 'computing' ? '#8B5CF6' : '#0067FE', fontWeight: 600 }">{{ task.caseType === 'computing' ? '算力设施' : '制造型' }}</span>
                              · {{ task.baselineYear || '2025' }}年度申报
                            </span>
                          </div>
                        </div>
                        <div @click.stop>
                          <el-popconfirm title="确定删除该任务？" confirm-button-text="删除" cancel-button-text="取消" @confirm="deleteTask(task.id)">
                            <i slot="reference" class="el-icon-delete tl-hc-delete"></i>
                          </el-popconfirm>
                        </div>
                      </div>
                      <div class="tl-hc-bottom">
                        <span class="tl-hc-phase">阶段：{{ getPhaseName(task.currentStepIndex) }}</span>
                        <el-progress :percentage="Math.round(task.currentStepIndex / 5 * 100)" :stroke-width="4" :show-text="false" :color="task.status === 'completed' ? '#52c41a' : '#0067FE'" style="flex:1;margin-left:6px;"></el-progress>
                        <span class="tl-hc-time">{{ task.updatedAt }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <!-- 打字指示器 -->
          <div v-if="isTyping" class="message-row message--assistant">
            <div class="msg-avatar"><AgentIcon icon="ai-core" :color="themeColor" :size="26" /></div>
            <div class="msg-body"><div class="typing-indicator"><span></span><span></span><span></span></div></div>
          </div>
        </div>
        <!-- 快捷指令面板 -->
        <div v-if="showCmdPanel" class="cmd-panel">
          <div class="cmd-panel-header">
            <span class="cmd-panel-title"><i class="el-icon-s-opportunity"></i> 快捷指令</span>
            <span class="cmd-panel-close" @click="showCmdPanel = false"><i class="el-icon-close"></i></span>
          </div>
          <div class="cmd-panel-body">
            <div class="cmd-group">
              <div class="cmd-group-title">申报操作</div>
              <div class="cmd-list">
                <span class="cmd-item" @click="useTlCmd('开始申报')"><i class="el-icon-video-play"></i> 开始申报</span>
                <span class="cmd-item" @click="useTlCmd('历史记录')"><i class="el-icon-folder-opened"></i> 历史记录</span>
              </div>
            </div>
            <div class="cmd-group">
              <div class="cmd-group-title">信息查询</div>
              <div class="cmd-list">
                <span class="cmd-item" @click="useTlCmd('指标分类')"><i class="el-icon-s-data"></i> 指标分类</span>
                <span class="cmd-item" @click="useTlCmd('基础库')"><i class="el-icon-reading"></i> 基础库</span>
                <span class="cmd-item" @click="useTlCmd('溯源链')"><i class="el-icon-share"></i> 溯源链</span>
              </div>
            </div>
          </div>
        </div>
        <!-- 输入框 -->
        <div class="chat-input-area">
          <div class="input-box">
            <textarea class="input-textarea" v-model="tlInputText" placeholder="输入「开始申报」启动零碳工厂申报流程，或输入问题…" rows="1"
              @keydown.enter.exact="handleTlSendKey" @input="autoResizeTlTextarea" ref="tlInputTextareaRef"></textarea>
            <div class="input-box-footer">
              <div class="input-toolbar">
                <span class="toolbar-icon" title="快捷指令" @click="showCmdPanel = !showCmdPanel"><i class="el-icon-s-opportunity"></i></span>
                <span class="toolbar-icon" title="语音输入" @click="$message.info('语音输入功能开发中')"><i class="el-icon-microphone"></i></span>
                <span class="toolbar-icon" title="图片上传" @click="$message.info('图片上传功能开发中')"><i class="el-icon-picture"></i></span>
                <span class="toolbar-icon" title="附件上传" @click="$message.info('附件上传功能开发中')"><i class="el-icon-upload2"></i></span>
              </div>
              <button class="send-btn" :disabled="!tlInputText.trim()" @click="handleTlSend" :style="{ background: themeColor }">
                <i class="el-icon-s-promotion"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右栏：历史申报项目列表（固定窄栏） -->
      <aside class="cd-sidebar cd-sidebar-list">
        <div class="cd-tabs-header">
          <div class="cd-tab active">
            <i class="el-icon-folder-opened"></i><span>历史申报</span>
          </div>
        </div>
        <div class="cd-tab-content">
          <el-empty v-if="taskList.length === 0" description="暂无历史项目" :image-size="80"></el-empty>
          <div v-for="task in sortedTaskList" :key="task.id" class="cd-task-card" @click="continueTask(task)">
            <div class="cd-tc-top">
              <div class="cd-tc-icon" :style="{ backgroundColor: task.status === 'completed' ? '#52c41a' : '#0067FE' }">
                <i :class="task.status === 'completed' ? 'el-icon-circle-check' : 'el-icon-loading'"></i>
              </div>
              <div class="cd-tc-info">
                <div class="cd-tc-name">{{ task.factoryName }}</div>
                <div class="cd-tc-meta">
                  <el-tag size="mini" :type="getTaskStatusType(task.status)" effect="dark">{{ getTaskStatusLabel(task.status) }}</el-tag>
                  <span class="cd-tc-standard">
                    <span :style="{ color: task.caseType === 'computing' ? '#8B5CF6' : '#0067FE', fontWeight: 600 }">{{ task.caseType === 'computing' ? '算力设施' : '制造型' }}</span>
                    · {{ task.baselineYear || '2025' }}年度申报
                  </span>
                </div>
              </div>
              <div @click.stop>
                <el-popconfirm title="确定删除该任务？" confirm-button-text="删除" cancel-button-text="取消" @confirm="deleteTask(task.id)">
                  <i slot="reference" class="el-icon-delete cd-tc-delete"></i>
                </el-popconfirm>
              </div>
            </div>
            <div class="cd-tc-bottom">
              <span class="cd-tc-phase">{{ getPhaseName(task.currentStepIndex) }}</span>
              <el-progress :percentage="Math.round(task.currentStepIndex / 5 * 100)" :stroke-width="4" :show-text="false" :color="task.status === 'completed' ? '#52c41a' : '#0067FE'" style="flex:1;margin-left:6px;"></el-progress>
            </div>
            <div class="cd-tc-time">{{ task.updatedAt }}</div>
          </div>
        </div>
      </aside>
    </div>

    <!-- ===== 任务对话模式（两栏：对话框 + 任务详情） ===== -->
    <div v-if="pageMode === 'task-active'" class="task-active-mode">
      <div class="cd-body two-col">
        <!-- 中栏：对话区 -->
        <div class="cd-chat-container">
          <div class="chat-header">
            <div class="header-title">
              <AgentIcon icon="ai-core" :color="themeColor" :size="26" />
              <span class="chat-name-highlight" style="font-weight:600;margin-left:8px;font-size:16px;">小易</span>
              <span class="product-name-badge" v-if="currentFactoryName">{{ currentFactoryName }}</span>
            </div>
            <div class="header-actions">
              <span class="token-counter" v-if="estimatedTokens > 0">
                <i class="el-icon-coin"></i> {{ formattedTokens }}
              </span>
              <span class="toolbar-icon-sep" @click="goBackToList"><i class="el-icon-back"></i> 返回</span>
              <span class="toolbar-icon-sep" @click="resetSession"><i class="el-icon-refresh-left"></i> 重置</span>
            </div>
          </div>
          <div class="chat-messages" ref="chatMessagesRef">
            <div v-for="msg in messages" :key="msg.id" :class="['message-row', `message--${msg.role}`]">
              <div class="msg-avatar">
                <AgentIcon v-if="msg.role === 'assistant'" icon="ai-core" :color="themeColor" :size="26" />
                <i v-else class="el-icon-user"></i>
              </div>
              <div class="msg-body">
                <div class="msg-text" v-html="msg.content"></div>
                <div v-if="isLastAssistantMsg(msg) && activeSuggestions.length" class="msg-suggestions">
                  <span v-for="(s, si) in activeSuggestions" :key="si"
                    :class="['suggestion-btn', { 'suggestion-disabled': isTyping }]"
                    @click="sendSuggestion(s)">{{ s }}</span>
                </div>
                <div class="msg-time">{{ msg.timestamp }}</div>
              </div>
            </div>
            <div v-if="isTyping" class="message-row message--assistant">
              <div class="msg-avatar"><AgentIcon icon="ai-core" :color="themeColor" :size="26" /></div>
              <div class="msg-body"><div class="typing-indicator"><span></span><span></span><span></span></div></div>
            </div>
          </div>
          <!-- 快捷指令面板 -->
          <div v-if="showCmdPanel" class="cmd-panel">
            <div class="cmd-panel-header">
              <span class="cmd-panel-title"><i class="el-icon-s-opportunity"></i> 快捷指令</span>
              <span class="cmd-panel-close" @click="showCmdPanel = false"><i class="el-icon-close"></i></span>
            </div>
            <div class="cmd-panel-body">
              <div class="cmd-group">
                <div class="cmd-group-title">流程操作</div>
                <div class="cmd-list">
                  <span class="cmd-item" @click="useCmd('下一步')"><i class="el-icon-right"></i> 下一步</span>
                  <span class="cmd-item" @click="useCmd('查看进度')"><i class="el-icon-view"></i> 查看进度</span>
                </div>
              </div>
              <div class="cmd-group">
                <div class="cmd-group-title">信息查询</div>
                <div class="cmd-list">
                  <span class="cmd-item" @click="useCmd('指标分类')"><i class="el-icon-s-data"></i> 指标分类</span>
                  <span class="cmd-item" @click="useCmd('基础库')"><i class="el-icon-reading"></i> 基础库</span>
                </div>
              </div>
              <div class="cmd-group">
                <div class="cmd-group-title">阶段功能</div>
                <div class="cmd-list">
                  <span class="cmd-item" @click="useCmd('资格诊断')"><i class="el-icon-s-check"></i> 资格诊断</span>
                  <span class="cmd-item" @click="useCmd('建设目标')"><i class="el-icon-aim"></i> 建设目标</span>
                  <span class="cmd-item" @click="useCmd('材料下载')"><i class="el-icon-download"></i> 材料下载</span>
                </div>
              </div>
            </div>
          </div>
          <!-- 输入框 -->
          <div class="chat-input-area">
            <div class="input-box">
              <textarea class="input-textarea" v-model="inputText" placeholder="提问或输入指令（输入 / 呼出快捷指令）…" rows="1"
                @keydown.enter.exact="handleSendKey" @input="autoResizeTextarea" ref="inputTextareaRef"></textarea>
              <div class="input-box-footer">
                <div class="input-toolbar">
                  <span class="toolbar-icon" title="快捷指令" @click="showCmdPanel = !showCmdPanel"><i class="el-icon-s-opportunity"></i></span>
                  <span class="toolbar-icon" title="语音输入" @click="$message.info('语音输入功能开发中')"><i class="el-icon-microphone"></i></span>
                  <span class="toolbar-icon" title="图片上传" @click="$message.info('图片上传功能开发中')"><i class="el-icon-picture"></i></span>
                  <span class="toolbar-icon" title="附件上传" @click="$message.info('附件上传功能开发中')"><i class="el-icon-upload2"></i></span>
                </div>
                <button class="send-btn" :disabled="!inputText.trim() || isTyping" @click="handleSend" :style="{ background: themeColor }">
                  <i class="el-icon-s-promotion"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右栏：6阶段水平进度条 + 阶段专属内容 -->
        <aside class="cd-sidebar">
          <!-- 顶部：6阶段水平进度条 -->
          <div class="phase-progress-bar">
            <div v-if="currentStepIndex < maxStepIndex" class="history-view-banner">
              <i class="el-icon-edit-outline"></i>
              <span>正在编辑「{{ phases[currentStepIndex].name }}」，修改后点击底部「保存修改」将标记下游阶段重新确认</span>
              <el-button size="mini" type="primary" plain @click="jumpToPhase(maxStepIndex)">返回当前阶段</el-button>
            </div>
            <div class="phase-track">
              <div v-for="(phase, idx) in phases" :key="phase.key"
                :class="['phase-track-node', { 'track-active': idx === currentStepIndex, 'track-done': idx < maxStepIndex, 'track-invalidated': invalidatedStages.includes(idx) }]"
                @click="jumpToPhase(idx)">
                <div class="track-dot">
                  <i v-if="invalidatedStages.includes(idx)" class="el-icon-refresh"></i>
                  <i v-else-if="idx < maxStepIndex" class="el-icon-check"></i>
                  <span v-else>{{ idx + 1 }}</span>
                </div>
                <span class="track-label">
                  {{ phase.name }}
                  <em v-if="invalidatedStages.includes(idx)" class="track-invalidated-tag">需确认</em>
                </span>
                <div v-if="idx < phases.length - 1" :class="['track-line', { 'track-line-done': idx < maxStepIndex }]"></div>
              </div>
            </div>
          </div>

          <!-- 下方：阶段专属内容 -->
          <div class="phase-content">

            <!-- 阶段1：标准规则适配 -->
            <div v-if="currentStepIndex === 0" class="phase-detail">
              <div class="pd-section">
                <div class="pd-title"><i class="el-icon-reading"></i> 标准适配</div>
                <div class="pd-card sa-meta-card">
                  <div class="sa-meta-row sa-span2">
                    <span class="pd-bd-label">申报依据</span>
                    <el-tooltip :content="currentPlanLabel" placement="top" :open-delay="300">
                      <span class="sa-meta-value">{{ currentPlanLabel }}</span>
                    </el-tooltip>
                  </div>
                  <div class="sa-meta-row">
                    <span class="pd-bd-label">申报主体类型</span>
                    <span class="sa-meta-value">{{ applicantType === 'computing' ? '零碳算力设施' : '制造型企业' }}</span>
                  </div>
                  <div class="sa-meta-row">
                    <span class="pd-bd-label">基准年</span>
                    <span class="sa-meta-value">{{ baselineYear }}年</span>
                  </div>
                </div>
              </div>
              <div class="pd-section">
                <div class="pd-title"><i class="el-icon-document"></i> 指标体系</div>
                <div class="pd-card">
                  <div class="pd-card-head" style="cursor:pointer;user-select:none;" @click="indicatorSysExpanded = !indicatorSysExpanded">
                    <span class="pd-card-name">{{ phaseDetails[0].standard.name }}</span>
                    <el-tag size="mini" type="success" effect="dark">已加载</el-tag>
                    <i :class="indicatorSysExpanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" style="margin-left:auto;color:#909399;"></i>
                  </div>
                  <div class="pd-card-sub">{{ phaseDetails[0].standard.code }} · 共 5大类11项指标<template v-if="!indicatorSysExpanded">（点击标题展开指标明细）</template></div>
                  <template v-if="indicatorSysExpanded">
                  <div v-for="cat in phaseDetails[0].standard.categories" :key="cat.name" class="pd-cat-row">
                    <span class="pd-cat-name">{{ cat.name }}</span>
                    <span class="pd-cat-count">{{ cat.count }}项</span>
                    <span class="pd-cat-ind">{{ cat.indicators }}</span>
                  </div>
                  <div style="margin-top:10px;background:rgba(0,103,254,0.03);border:1px solid rgba(0,103,254,0.08);border-radius:8px;padding:8px 10px;">
                    <div style="display:flex;align-items:center;gap:5px;font-size:12px;font-weight:700;color:#1e293b;margin-bottom:4px;">
                      <i class="el-icon-finished" style="color:#0067FE;"></i> 指标适用性规则
                      <span style="font-weight:400;color:#94a3b8;font-size:11px;">（政策豁免与限定 · 实际判定在建模与采数后进行）</span>
                    </div>
                    <div v-for="a in phaseDetails[0].standard.applicability" :key="a.name" class="pd-cat-row" style="border-top:none;margin-top:0;padding:4px 0;white-space:nowrap;">
                      <span class="pd-cat-name" style="flex-shrink:0;">{{ a.name }}</span>
                      <span class="pd-cat-ind" style="white-space:nowrap;">{{ a.rule }}</span>
                    </div>
                  </div>
                  </template>
                </div>
              </div>
              <div class="pd-section">
                <div class="pd-title"><i class="el-icon-s-check"></i> 企业基本信息 <el-tag size="mini" effect="plain" style="margin-left:4px;">自动带出 · 可编辑</el-tag></div>
                <div class="pd-card">
                  <div v-for="f in phaseDetails[0].qualification.baseInfo" :key="f.label" class="pd-edit-row">
                    <span class="pd-bd-label">{{ f.label }}</span>
                    <el-select v-if="f.type === 'select'" v-model="f.value" size="mini" style="flex:1;">
                      <el-option v-for="opt in f.options" :key="opt" :label="opt" :value="opt"></el-option>
                    </el-select>
                    <el-input v-else v-model="f.value" size="mini" style="flex:1;" :placeholder="f.placeholder || '请输入'"></el-input>
                  </div>
                </div>
              </div>
              <div class="pd-section">
                <div class="pd-title"><i class="el-icon-finished"></i> 申报资格条件 <el-tag size="mini" effect="plain" style="margin-left:4px;">条件 · 现状 · 自动判定</el-tag></div>
                <div class="pd-card pd-card-quali">
                  <div class="pd-check-head">
                    <span>要求</span><span>现状（可调整）</span><span>材料</span><span>判断</span>
                  </div>
                  <div class="pd-card-sub" style="margin:4px 0 2px;">静态硬资格（系统自动核验 · 不通过则终止申报）</div>
                  <div v-for="c in phaseDetails[0].qualification.autoChecks.filter(x => x.blocking)" :key="c.condition" class="pd-check-edit-row">
                    <div class="pd-cond-col">
                      <div class="pd-cond-text">{{ c.condition }}</div>
                    </div>
                    <div class="pd-current-col">
                      <span v-if="c.type === 'number'" class="pd-check-current">
                        <el-input-number v-model="c.current" size="mini" :min="0" controls-position="right" style="width:92px;"></el-input-number>
                        <span class="pd-cond-unit">{{ c.unit }}</span>
                      </span>
                      <el-select v-else-if="c.type === 'yesno'" v-model="c.current" size="mini" style="width:100%;" placeholder="请选择">
                        <el-option v-for="opt in c.options" :key="opt" :label="opt" :value="opt"></el-option>
                      </el-select>
                      <el-input v-else v-model="c.current" size="mini" placeholder="请填报现状"></el-input>
                    </div>
                    <div class="pd-proof-col">
                      <template v-if="c.proofStatus === 'matched'">
                        <span class="pd-proof-name" @click="swapProof(c)" title="点击重新选择材料"><i class="el-icon-paperclip"></i> {{ phaseDetails[0].qualification.proofPool[c.proofId].name }}</span>
                        <el-popover placement="top" width="280" trigger="hover">
                          <div class="pd-proof-info-card">
                            <div class="pi-title"><i class="el-icon-document-checked"></i> 证明材料来源</div>
                            <div class="pi-row"><span class="pi-k">材料</span><span>{{ (phaseDetails[0].qualification.proofPool[c.proofId] || {}).name || '—' }}</span></div>
                            <div class="pi-row"><span class="pi-k">类别</span><span>{{ (phaseDetails[0].qualification.proofPool[c.proofId] || {}).category || '技术文件类' }}</span></div>
                            <div class="pi-row"><span class="pi-k">来源</span><span>{{ c.source || '佐证材料库' }}</span></div>
                            <div class="pi-row"><span class="pi-k">核验</span><span style="color:#52c41a;">类型匹配 ✓</span></div>
                          </div>
                          <i slot="reference" class="el-icon-warning-outline pd-proof-info" title="查看证明材料来源"></i>
                        </el-popover>
                      </template>
                      <template v-else>
                        <span class="pd-proof-link" @click="linkProof(c)" title="从佐证材料库选择已有材料"><i class="el-icon-folder-opened"></i> 关联已有</span>
                        <span class="pd-proof-sep">/</span>
                        <span class="pd-proof-pending" @click="uploadNewProof(c)" title="上传新材料"><i class="el-icon-upload2"></i> 上传新材料</span>
                        <el-popover placement="top" width="260" trigger="hover">
                          <div class="pd-proof-info-card">
                            <div class="pi-title" style="color:#E6A23C;"><i class="el-icon-warning-outline"></i> 尚未关联证明材料</div>
                            <div class="pi-row">点击「关联已有」从佐证材料库选择，或「上传新材料」，关联后此条件方可通过核验。</div>
                          </div>
                          <i slot="reference" class="el-icon-warning-outline pd-proof-info" style="color:#E6A23C;" title="尚未关联证明材料"></i>
                        </el-popover>
                      </template>
                    </div>
                    <i :class="judgeQualiPass(c) === false ? 'el-icon-error' : (judgeQualiPass(c) === true ? 'el-icon-success' : 'el-icon-remove')" :style="{ color: judgeQualiPass(c) === false ? '#f56c6c' : (judgeQualiPass(c) === true ? '#52c41a' : '#909399') }" class="pd-cond-state"></i>
                  </div>
                  <div class="pd-card-sub" style="margin:8px 0 2px;">量化条件（自动核验 · 暂不满足不拦截，核算后给出差距与改善路径）</div>
                  <div v-for="c in phaseDetails[0].qualification.autoChecks.filter(x => !x.blocking)" :key="c.condition" class="pd-check-edit-row">
                    <div class="pd-cond-col">
                      <div class="pd-cond-text">{{ c.condition }}</div>
                    </div>
                    <div class="pd-current-col">
                      <span v-if="c.type === 'number'" class="pd-check-current">
                        <el-input-number v-model="c.current" size="mini" :min="0" controls-position="right" style="width:92px;"></el-input-number>
                        <span class="pd-cond-unit">{{ c.unit }}</span>
                      </span>
                      <el-select v-else-if="c.type === 'yesno'" v-model="c.current" size="mini" style="width:100%;" placeholder="请选择">
                        <el-option v-for="opt in c.options" :key="opt" :label="opt" :value="opt"></el-option>
                      </el-select>
                      <el-input v-else v-model="c.current" size="mini" placeholder="请填报现状"></el-input>
                    </div>
                    <div class="pd-proof-col">
                      <template v-if="c.proofStatus === 'matched'">
                        <span class="pd-proof-name" @click="swapProof(c)" title="点击重新选择材料"><i class="el-icon-paperclip"></i> {{ phaseDetails[0].qualification.proofPool[c.proofId].name }}</span>
                        <el-popover placement="top" width="280" trigger="hover">
                          <div class="pd-proof-info-card">
                            <div class="pi-title"><i class="el-icon-document-checked"></i> 证明材料来源</div>
                            <div class="pi-row"><span class="pi-k">材料</span><span>{{ (phaseDetails[0].qualification.proofPool[c.proofId] || {}).name || '—' }}</span></div>
                            <div class="pi-row"><span class="pi-k">类别</span><span>{{ (phaseDetails[0].qualification.proofPool[c.proofId] || {}).category || '技术文件类' }}</span></div>
                            <div class="pi-row"><span class="pi-k">来源</span><span>{{ c.source || '佐证材料库' }}</span></div>
                            <div class="pi-row"><span class="pi-k">核验</span><span style="color:#52c41a;">类型匹配 ✓</span></div>
                          </div>
                          <i slot="reference" class="el-icon-warning-outline pd-proof-info" title="查看证明材料来源"></i>
                        </el-popover>
                      </template>
                      <template v-else>
                        <span class="pd-proof-link" @click="linkProof(c)" title="从佐证材料库选择已有材料"><i class="el-icon-folder-opened"></i> 关联已有</span>
                        <span class="pd-proof-sep">/</span>
                        <span class="pd-proof-pending" @click="uploadNewProof(c)" title="上传新材料"><i class="el-icon-upload2"></i> 上传新材料</span>
                        <el-popover placement="top" width="260" trigger="hover">
                          <div class="pd-proof-info-card">
                            <div class="pi-title" style="color:#E6A23C;"><i class="el-icon-warning-outline"></i> 尚未关联证明材料</div>
                            <div class="pi-row">点击「关联已有」从佐证材料库选择，或「上传新材料」，关联后此条件方可通过核验。</div>
                          </div>
                          <i slot="reference" class="el-icon-warning-outline pd-proof-info" style="color:#E6A23C;" title="尚未关联证明材料"></i>
                        </el-popover>
                      </template>
                    </div>
                    <i :class="judgeQualiPass(c) === false ? 'el-icon-error' : (judgeQualiPass(c) === true ? 'el-icon-success' : 'el-icon-remove')" :style="{ color: judgeQualiPass(c) === false ? '#f56c6c' : (judgeQualiPass(c) === true ? '#52c41a' : '#909399') }" class="pd-cond-state"></i>
                  </div>
                  <div class="pd-card-sub" style="margin:8px 0 2px;">负面清单承诺（自动核查 + 标准承诺书双保险 · 政策条款可溯源）</div>
                  <div v-for="c in phaseDetails[0].qualification.manualChecks" :key="c.condition" class="pd-check-edit-row">
                    <div class="pd-cond-col">
                      <div class="pd-cond-text">{{ c.condition }}</div>
                    </div>
                    <div class="pd-current-col">
                      <el-select v-if="c.type === 'yesno'" v-model="c.current" size="mini" style="width:100%;" placeholder="请选择">
                        <el-option v-for="opt in c.options" :key="opt" :label="opt" :value="opt"></el-option>
                      </el-select>
                      <el-input v-else v-model="c.current" size="mini" placeholder="请填报现状"></el-input>
                    </div>
                    <div class="pd-proof-col">
                      <template v-if="c.proofStatus === 'matched'">
                        <span class="pd-proof-name" @click="swapProof(c)" title="点击重新选择材料"><i class="el-icon-paperclip"></i> {{ phaseDetails[0].qualification.proofPool[c.proofId].name }}</span>
                      </template>
                      <template v-else>
                        <span class="pd-proof-link" @click="linkProof(c)" title="从佐证材料库选择已有材料"><i class="el-icon-folder-opened"></i> 关联已有</span>
                        <span class="pd-proof-sep">/</span>
                        <span class="pd-proof-pending" @click="uploadNewProof(c)" title="上传新材料"><i class="el-icon-upload2"></i> 上传新材料</span>
                      </template>
                      <el-popover placement="top" width="320" trigger="hover">
                        <div class="pd-proof-info-card">
                          <div class="pi-title"><i class="el-icon-link"></i> 政策依据</div>
                          <div class="pi-row"><span>{{ c.policyRef || '—' }}</span></div>
                          <div class="pi-title" style="margin-top:8px;"><i class="el-icon-search"></i> 核查地址（公示数据源）</div>
                          <div class="pi-row" style="align-items:center;">
                            <span>{{ c.checkSource }}</span>
                            <el-link type="primary" :underline="false" :href="c.checkUrl" target="_blank" style="font-size:12px;margin-left:auto;">
                              前往核查 <i class="el-icon-top-right"></i>
                            </el-link>
                          </div>
                          <div class="pi-title" style="margin-top:8px;"><i class="el-icon-edit-outline"></i> 标准承诺书</div>
                          <div class="pi-row" style="align-items:center;">
                            <span>覆盖全部负面清单条款（企业信息预填）</span>
                            <el-button size="mini" type="text" icon="el-icon-download" style="padding:0;margin-left:auto;" @click="downloadCommitment(c)">下载模板</el-button>
                          </div>
                          <div class="pi-row" style="margin-top:6px;color:#909399;font-size:11px;border-top:1px dashed #e4e7ed;padding-top:6px;">
                            判定：勾选「无此情况」+ 关联证明材料 → 该项通过。承诺书为线下签章流程（打印 → 法定代表人签字盖章 → 扫描回传佐证材料库）。
                          </div>
                        </div>
                        <i slot="reference" class="el-icon-warning-outline pd-proof-info" title="政策依据 · 人工核查 · 承诺书"></i>
                      </el-popover>
                    </div>
                    <i :class="judgeQualiPass(c) === false ? 'el-icon-error' : (judgeQualiPass(c) === true ? 'el-icon-success' : 'el-icon-remove')" :style="{ color: judgeQualiPass(c) === false ? '#f56c6c' : (judgeQualiPass(c) === true ? '#52c41a' : '#909399') }" class="pd-cond-state"></i>
                  </div>
                  <div class="pd-conclusion" :style="qualiConclusion().ok === false ? { background: 'rgba(245,108,108,0.08)', color: '#f56c6c' } : {}">
                    <i :class="qualiConclusion().ok === false ? 'el-icon-warning-outline' : 'el-icon-success'"></i> {{ qualiConclusion().text }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 阶段2：核算模型搭建 -->
            <div v-else-if="currentStepIndex === 1" class="phase-detail">
              <div class="pd-section">
                <div class="pd-title"><i class="el-icon-share"></i> 核算模型</div>
                <div v-for="(m, mi) in phaseDetails[1].indicatorModels" :key="m.name" class="model-group">
                  <div class="model-group-header">
                    <span class="model-dot"></span>
                    <span class="model-group-name">{{ m.name }}</span>
                    <el-tag size="mini" type="success">{{ m.subModules.length }} 个子模块</el-tag>
                  </div>
                  <div class="process-table">
                    <div class="process-header-row">
                      <div class="ph-sub"><span class="col-header-text">子模块</span></div>
                      <div class="ph-src"><span class="col-header-text">构成明细</span></div>
                    </div>
                    <div v-for="(sub, si) in m.subModules" :key="sub.symbol" class="submodule-block">
                      <div class="submodule-left">
                        <div class="node-box">{{ sub.symbol }}</div>
                        <el-tooltip v-if="sub.note" :content="sub.note" placement="top" :open-delay="200">
                          <div class="node-note node-note-tip">{{ sub.name }}<i class="el-icon-info tip-icon"></i></div>
                        </el-tooltip>
                        <div class="node-note" v-else>{{ sub.name }}</div>
                        <div class="node-count">{{ (sub.processes ? sub.processes.length : sub.sources.length) }} 个{{ sub.itemLabel }}</div>
                      </div>
                      <div class="submodule-right">
                        <!-- 生产过程模式（C过程：过程 → 多输入/多输出） -->
                        <template v-if="sub.processes">
                          <div v-for="(p, pi) in sub.processes" :key="pi" class="process-card">
                            <div class="process-card-head">
                              <el-select :value="p.name" size="mini" class="io-edit-name" placeholder="选择生产过程" @change="onProcessNameChange(mi, si, pi, $event)">
                                <el-option v-for="opt in sub.processOptions" :key="opt" :label="opt" :value="opt"></el-option>
                              </el-select>
                              <i class="el-icon-close io-del-btn" @click="removeProcess(si, pi)" title="删除生产过程"></i>
                            </div>
                            <div class="io-group-label">输入：</div>
                            <div v-for="(inp, ii) in p.inputs" :key="ii" class="source-line">
                              <div class="line-src io-item input-item editable-bubble">
                                <el-select :value="inp" size="mini" class="io-edit-name" placeholder="选择输入项" @change="onProcessIOChange(mi, si, pi, 'inputs', ii, $event)">
                                  <el-option v-for="opt in sub.inputOptions" :key="opt" :label="opt" :value="opt"></el-option>
                                </el-select>
                                <i class="el-icon-close io-del-btn" @click="removeProcessIO(mi, si, pi, 'inputs', ii)" title="删除输入"></i>
                              </div>
                            </div>
                            <div class="io-add-row"><el-button type="text" icon="el-icon-plus" size="mini" @click="addProcessIO(mi, si, pi, 'inputs')">添加输入</el-button></div>
                            <div class="io-group-label">输出：</div>
                            <div v-for="(out, oi) in p.outputs" :key="oi" class="source-line">
                              <div class="line-src io-item input-item editable-bubble output-bubble">
                                <el-select :value="out" size="mini" class="io-edit-name" placeholder="选择输出项" @change="onProcessIOChange(mi, si, pi, 'outputs', oi, $event)">
                                  <el-option v-for="opt in sub.outputOptions" :key="opt" :label="opt" :value="opt"></el-option>
                                </el-select>
                                <i class="el-icon-close io-del-btn" @click="removeProcessIO(mi, si, pi, 'outputs', oi)" title="删除输出"></i>
                              </div>
                            </div>
                            <div class="io-add-row"><el-button type="text" icon="el-icon-plus" size="mini" @click="addProcessIO(mi, si, pi, 'outputs')">添加输出</el-button></div>
                          </div>
                          <div class="io-add-row">
                            <el-button type="text" icon="el-icon-plus" size="mini" @click="addProcess(si)">添加生产过程</el-button>
                          </div>
                        </template>
                        <!-- 派生只读模式 -->
                        <template v-else-if="sub.derived">
                          <div class="derived-tags">
                            <el-tag v-for="(s, ri) in sub.sources" :key="ri" size="mini" effect="plain" type="success">{{ s }}</el-tag>
                            <span v-if="!sub.sources.length" class="pd-card-sub">暂无（由上游排放源 / 电力来源联动生成）</span>
                          </div>
                        </template>
                        <!-- 普通构成明细模式 -->
                        <template v-else>
                          <div v-for="(s, ri) in sub.sources" :key="ri" class="source-line">
                            <div class="line-src io-item input-item editable-bubble">
                              <el-select :value="s" size="mini" class="io-edit-name" :placeholder="'选择' + sub.itemLabel + '类型'" @change="onSourceTypeChange(mi, si, ri, $event)">
                                <el-option v-for="opt in sub.sourceOptions" :key="opt" :label="opt" :value="opt"></el-option>
                              </el-select>
                              <i class="el-icon-close io-del-btn" @click="removeEmissionSource(mi, si, ri)" title="删除"></i>
                            </div>
                          </div>
                          <div class="io-add-row">
                            <el-button type="text" icon="el-icon-plus" size="mini" @click="addEmissionSource(mi, si)">添加{{ sub.itemLabel }}</el-button>
                          </div>
                        </template>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 阶段3：数据收集与校验（双页签：待补充/待确认 + 活动数据与因子） -->
            <div v-else-if="currentStepIndex === 2" class="phase-detail">
              <div class="val-tab-header">
                <div :class="['val-tab-btn', { active: phaseOps.dataTab === 'validation' }]" @click="phaseOps.dataTab = 'validation'">
                  <i class="el-icon-warning-outline"></i>
                  <span>待补充 / 待确认</span>
                  <em class="val-tab-badge" v-if="pendingValCount()">{{ pendingValCount() }}</em>
                  <em class="val-tab-progress" v-else>✓</em>
                </div>
                <div :class="['val-tab-btn', { active: phaseOps.dataTab === 'activity' }]" @click="phaseOps.dataTab = 'activity'">
                  <i class="el-icon-document-copy"></i>
                  <span>活动数据与因子</span>
                </div>
              </div>

              <!-- 页签1：待补充/待确认（三段式：清单 → 附件上传 → 逐项确认） -->
              <div v-if="phaseOps.dataTab === 'validation'" class="val-tab-content">
                <div class="pd-section">
                  <div class="pd-title">
                    <i class="el-icon-warning-outline"></i> 待处理清单
                    <span class="pd-title-progress">{{ phaseDetails[2].validationItems.length - pendingValCount() }}/{{ phaseDetails[2].validationItems.length }} 已处理</span>
                    <el-button size="mini" type="text" icon="el-icon-download" @click="downloadValChecklist" style="margin-left:auto;">下载清单</el-button>
                  </div>
                  <div class="val-list-scroll">
                    <div v-for="item in phaseDetails[2].validationItems.filter(v => v.status !== 'resolved')" :key="item.id" class="validation-task-card" :class="'is-status-' + item.status">
                      <div class="vtc-header">
                        <div class="vtc-title">
                          <el-tag size="mini" effect="dark" type="info">{{ item.stage }}</el-tag>
                          <i class="el-icon-arrow-right vtc-arrow"></i>
                          <span class="vtc-problem-desc">
                            <i :class="item.status === 'missing' ? 'el-icon-warning-outline' : 'el-icon-info'" :style="{ color: item.status === 'missing' ? '#f56c6c' : '#e6a23c', marginRight: '4px' }"></i>
                            {{ item.name }}
                          </span>
                        </div>
                        <el-tag size="mini" :type="item.status === 'missing' ? 'danger' : 'warning'" effect="plain">{{ item.statusLabel }}</el-tag>
                      </div>
                      <div class="vtc-body vtc-body-compact">
                        <span class="vtc-label">建议提供：</span>
                        <span style="font-size:12px;color:#64748b;">{{ item.hint }}</span>
                      </div>
                    </div>
                    <div v-if="!pendingValCount()" class="val-empty-state">
                      <i class="el-icon-circle-check"></i> 全部处理完成，无待处理事项
                    </div>
                  </div>
                </div>
                <div class="pd-section">
                  <div class="pd-title">
                    <i class="el-icon-upload2"></i> 附件上传
                    <span class="pd-title-progress" v-if="phaseDetails[2].uploadedFiles.length">{{ phaseDetails[2].uploadedFiles.length }} 份</span>
                  </div>
                  <div class="val-upload-zone" @click="uploadValFile">
                    <i class="el-icon-upload"></i>
                    <div class="val-upload-text">点击或拖拽上传佐证材料（电费结算单 / 检测报告 / B204-1 报表等）</div>
                    <div class="val-upload-sub">支持 PDF / Excel / 图片，上传后自动关联对应待处理项</div>
                  </div>
                  <div v-if="!phaseDetails[2].uploadedFiles.length" class="val-empty-state">
                    <i class="el-icon-folder-opened"></i> 暂无上传文件
                  </div>
                  <div v-for="(f, fi) in phaseDetails[2].uploadedFiles" :key="f.name + f.time" class="val-file-row">
                    <i class="el-icon-document"></i>
                    <span class="val-file-name">{{ f.name }}</span>
                    <span class="val-file-time">{{ f.time }}</span>
                    <i class="el-icon-close val-file-del" @click="removeValFile(fi)" title="移除"></i>
                  </div>
                </div>
                <div class="pd-section">
                  <div class="pd-title"><i class="el-icon-edit-outline"></i> 逐项填报 / 确认</div>
                  <div>
                    <div v-for="item in phaseDetails[2].validationItems" :key="item.id" class="validation-task-card" :class="'is-status-' + item.status">
                      <div class="vtc-header">
                        <div class="vtc-title">
                          <el-tag size="mini" effect="dark" type="info">{{ item.stage }}</el-tag>
                          <i class="el-icon-arrow-right vtc-arrow"></i>
                          <span class="vtc-problem-desc">
                            <i :class="item.status === 'missing' ? 'el-icon-warning-outline' : 'el-icon-info'" :style="{ color: item.status === 'missing' ? '#f56c6c' : '#e6a23c', marginRight: '4px' }"></i>
                            {{ item.name }}
                          </span>
                        </div>
                        <div class="vtc-status">
                          <el-tag size="small" :type="item.status === 'missing' ? 'danger' : (item.status === 'pending' ? 'warning' : 'success')">{{ item.status === 'resolved' ? '已处理' : item.statusLabel }}</el-tag>
                        </div>
                      </div>
                      <div class="vtc-body vtc-body-rows">
                        <div class="vtc-row">
                          <span class="vtc-label">问题描述：</span>
                          <span class="vtc-row-text">{{ item.label }}</span>
                          <el-tag size="mini" type="info" effect="plain" style="margin-left:auto;">关联：{{ item.modelRef }}</el-tag>
                        </div>
                        <div class="vtc-row">
                          <span class="vtc-label">{{ item.status === 'missing' ? '待填报数值' : '待确认数值' }}：</span>
                          <div v-if="item.status !== 'resolved'" class="vtc-input-group">
                            <el-input size="small" v-model="item.value" placeholder="请输入..." style="width: 140px;">
                              <template slot="append" v-if="item.unit">{{ item.unit }}</template>
                            </el-input>
                            <span v-if="item.status === 'missing' && item.recommendBasis" class="vtc-recommend-tag"><i class="el-icon-magic-stick"></i> 智能推荐</span>
                          </div>
                          <div v-else class="vtc-readonly-val"><strong>{{ item.value || '—' }} {{ item.unit }}</strong></div>
                          <div class="vtc-actions">
                            <el-button v-if="item.status !== 'resolved'" size="small" :type="item.status === 'missing' ? 'primary' : 'warning'" @click="handleValItem(item)">
                              <i class="el-icon-check"></i> {{ item.status === 'missing' ? '提交填报' : '确认数据' }}
                            </el-button>
                            <span v-else class="vtc-resolved-mark"><i class="el-icon-circle-check"></i> 已处理</span>
                          </div>
                        </div>
                        <div v-if="item.status === 'missing' && item.recommendBasis" class="vtc-row">
                          <span class="vtc-label">推荐依据：</span>
                          <span class="vtc-row-text" style="color:#0067FE;">{{ item.recommendBasis }}</span>
                        </div>
                        <div class="vtc-row">
                          <span class="vtc-label">证明材料：</span>
                          <template v-if="item.status !== 'resolved' && item.proofStatus !== 'matched'">
                            <span class="pd-proof-link" @click="linkValProof(item, 'link')" title="从佐证材料库选择已有材料"><i class="el-icon-folder-opened"></i> 关联已有</span>
                            <span class="pd-proof-sep">/</span>
                            <span class="pd-proof-pending" @click="linkValProof(item, 'upload')" title="上传新材料"><i class="el-icon-upload2"></i> 上传新材料</span>
                          </template>
                          <span v-else class="pd-proof-name"><i class="el-icon-paperclip"></i> {{ item.proofName || item.hint.split('/')[0].trim() }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 页签2：活动数据与因子（对齐核算模型三级结构：指标→构成子模块→输入项行；每项上下两行=活动数据+匹配因子，均支持修改，来源凭证可更换） -->
              <div v-else class="val-tab-content">
                <div v-for="grp in phaseDetails[2].collectModel" :key="grp.indicator" class="model-group">
                  <div class="model-group-header">
                    <span class="model-dot"></span>
                    <span class="model-group-name">{{ grp.indicator }}</span>
                  </div>
                  <div v-for="sub in grp.subs" :key="sub.symbol" class="collect-sub">
                    <div class="collect-sub-title">
                      <span class="collect-sub-symbol">{{ sub.symbol }}</span>
                      <span class="collect-sub-name">{{ sub.name }}</span>
                      <el-tag size="mini" effect="plain" type="info">{{ sub.itemLabel }}</el-tag>
                    </div>
                    <div class="pd-card collect-grid">
                      <div class="cg-cell cg-head cg-cell-item">输入项</div>
                      <div class="cg-cell cg-head cg-cell-kind">类别</div>
                      <div class="cg-cell cg-head">数值</div>
                      <div class="cg-cell cg-head">来源（证明材料）</div>
                      <div class="cg-cell cg-head">操作</div>
                      <template v-for="r in sub.rows">
                        <div :key="r.item + '-i'" class="cg-cell cg-cell-item cg-item-name" :style="{ gridRow: r.factor ? 'span 2' : 'span 1' }">{{ r.item }}</div>
                        <div :key="r.item + '-dk'" class="cg-cell cg-cell-kind"><span :class="['line-kind', r.judge ? 'line-kind-judge' : (sub.fillMode ? 'line-kind-fill' : 'line-kind-data')]">{{ r.judge ? '判定' : (sub.fillMode ? '填报' : '数据') }}</span></div>
                        <div :key="r.item + '-dv'" class="cg-cell">
                          <div v-if="r.judge" class="collect-judge"><i class="el-icon-circle-check"></i> {{ r.data.value }}（系统判定）</div>
                          <el-input v-else size="mini" v-model="r.data.value" placeholder="请输入数值">
                            <template slot="append" v-if="r.data.unit">{{ r.data.unit }}</template>
                          </el-input>
                        </div>
                        <div :key="r.item + '-ds'" class="cg-cell"><span class="line-src-text">{{ r.data.source }}</span></div>
                        <div :key="r.item + '-do'" class="cg-cell cg-cell-op">
                          <template v-if="!r.data.proofName">
                            <el-button size="mini" plain icon="el-icon-folder-opened" class="collect-op-btn" title="从佐证材料库关联已有凭证" @click="linkCollectProof(r, '数据', 'link')">关联</el-button>
                            <el-button size="mini" plain icon="el-icon-upload2" class="collect-op-btn" title="上传新材料作为凭证" @click="linkCollectProof(r, '数据', 'upload')">上传</el-button>
                          </template>
                          <span v-else class="pd-proof-name" title="点击更换材料" @click="linkCollectProof(r, '数据', 'link')"><i class="el-icon-paperclip"></i> {{ r.data.proofName }}</span>
                        </div>
                        <template v-if="r.factor">
                          <div :key="r.item + '-fk'" class="cg-cell cg-cell-kind cg-row-factor"><span class="line-kind line-kind-factor">因子</span></div>
                          <div :key="r.item + '-fv'" class="cg-cell cg-row-factor">
                            <el-input size="mini" v-model="r.factor.value" placeholder="请输入因子值">
                              <template slot="append" v-if="r.factor.unit">{{ r.factor.unit }}</template>
                            </el-input>
                          </div>
                          <div :key="r.item + '-fs'" class="cg-cell cg-row-factor"><span class="line-src-text">{{ r.factor.source }}</span></div>
                          <div :key="r.item + '-fo'" class="cg-cell cg-cell-op cg-row-factor">
                            <template v-if="!r.factor.proofName">
                              <el-button size="mini" plain icon="el-icon-folder-opened" class="collect-op-btn" title="从佐证材料库关联已有凭证" @click="linkCollectProof(r, '因子', 'link')">关联</el-button>
                              <el-button size="mini" plain icon="el-icon-upload2" class="collect-op-btn" title="上传新材料作为凭证" @click="linkCollectProof(r, '因子', 'upload')">上传</el-button>
                            </template>
                            <span v-else class="pd-proof-name" title="点击更换材料" @click="linkCollectProof(r, '因子', 'link')"><i class="el-icon-paperclip"></i> {{ r.factor.proofName }}</span>
                          </div>
                        </template>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 阶段4：指标核算与评价 -->
            <div v-else-if="currentStepIndex === 3" class="phase-detail">
              <div class="pd-section">
                <div class="pd-title"><i class="el-icon-s-data"></i> 指标核算结果（{{ baselineYear }}基准年）</div>
                <div class="pd-card pd-table pd-table-indicator">
                  <div class="pd-tr pd-th">
                    <span class="pd-td pd-td-name">指标</span>
                    <span class="pd-td">当前值</span>
                    <span class="pd-td">基本要求</span>
                    <span class="pd-td">目标要求</span>
                    <span class="pd-td">评价结果</span>
                  </div>
                  <div v-for="ind in phaseDetails[3].indicators" :key="ind.name" class="pd-tr">
                    <span class="pd-td pd-td-name">{{ ind.name }}</span>
                    <span class="pd-td pd-td-value">{{ ind.value }}</span>
                    <span class="pd-td">{{ ind.basic }}</span>
                    <span class="pd-td">{{ ind.target }}</span>
                    <span class="pd-td">
                      <el-tag v-if="ind.status === 'target'" size="mini" type="success" effect="dark">满足目标要求</el-tag>
                      <el-tag v-else-if="ind.status === 'improving'" size="mini" type="warning" effect="plain">满足基本要求</el-tag>
                      <el-tag v-else-if="ind.status === 'ongoing'" size="mini" type="info" effect="plain">不设量化要求</el-tag>
                      <el-tag v-else-if="ind.status === 'na'" size="mini" type="info" effect="plain">不适用</el-tag>
                      <el-tag v-else-if="ind.status === 'fail'" size="mini" type="danger" effect="plain">未达标</el-tag>
                      <el-tag v-else size="mini" type="info" effect="plain">待算</el-tag>
                    </span>
                  </div>
                </div>
              </div>
              <div class="pd-section">
                <div class="pd-title" style="cursor:pointer;user-select:none;" @click="toggleAccDetail">
                  <i class="el-icon-document-copy"></i> 核算明细（按核算模型计算组成）
                  <span style="font-weight:400;color:#94a3b8;font-size:11px;margin-left:6px;">{{ accDetailExpanded ? '' : '（默认收起 · 点击展开计算过程）' }}</span>
                  <i :class="accDetailExpanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" style="margin-left:auto;color:#909399;"></i>
                </div>
                <template v-if="accDetailExpanded">
                <div v-for="d in phaseDetails[3].accountingDetails.indicators" :key="d.name" class="pd-card pd-acc-detail">
                  <div class="pd-card-head">
                    <span class="pd-card-name">{{ d.name }}</span>
                    <el-tag size="mini" type="success" effect="plain">{{ d.value }}</el-tag>
                  </div>
                  <div class="pd-card-sub">{{ d.formula }}</div>
                  <template v-if="d.fillMode || d.judgeMode">
                    <div v-for="r in d.rows" :key="r.item" class="pd-input-row">
                      <span class="pd-input-name">{{ r.item }}</span>
                      <span class="pd-input-used" style="color:#0067FE;font-weight:600;">{{ r.value }}</span>
                      <span class="pd-input-src" style="flex:1;text-align:right;">{{ r.source }}</span>
                    </div>
                  </template>
                  <template v-else v-for="g in d.groups">
                    <div :key="g.symbol" class="pd-cat-row" style="border-top:1px dashed rgba(0,103,254,0.12);">
                      <span class="pd-cat-name">{{ g.symbol }}</span>
                      <span class="pd-cat-ind">{{ g.rows ? g.name : (g.name + ' · ' + g.empty) }}</span>
                    </div>
                    <template v-if="g.rows">
                      <div v-for="r in g.rows" :key="r.item" class="pd-input-row">
                        <span class="pd-input-name">{{ r.item }}</span>
                        <span class="pd-input-unit" style="flex:0 0 90px;">{{ r.value }}<em class="goal-unit">{{ r.unit }}</em></span>
                        <span class="pd-input-src" style="flex:0 0 34%;">{{ r.src ? '来源：' + r.src : ((r.op || '×') + ' ' + (r.factor || '')) }}</span>
                        <span class="pd-input-used" style="color:#0067FE;font-weight:600;">= {{ r.result }}</span>
                      </div>
                      <div class="pd-input-row" style="border-bottom:none;">
                        <span class="pd-input-name"></span>
                        <span class="pd-input-unit" style="flex:0 0 90px;color:#0067FE;font-weight:600;">{{ g.subtotal }}</span>
                        <span class="pd-input-src" style="flex:0 0 34%;"></span>
                        <span class="pd-input-used" style="flex:1;"></span>
                      </div>
                    </template>
                  </template>
                  <div class="pd-card-sub" v-if="d.emptyNote">{{ d.emptyNote }}</div>
                  <div class="pd-conclusion"><i class="el-icon-success"></i> {{ d.total }}</div>
                </div>
                <div class="pd-card-sub" style="margin-top:4px;">{{ phaseDetails[3].accountingDetails.note }}</div>
                </template>
              </div>
            </div>

            <!-- 阶段5：建设目标与优化建议 -->
            <div v-else-if="currentStepIndex === 4" class="phase-detail">
              <!-- 建设目标（表1）：企业先设定建设期与期末目标，智能体分解年度轨迹 -->
              <div class="pd-section">
                <div class="pd-title"><i class="el-icon-aim"></i> ① 建设期与期末目标（企业设定）
                  <template v-if="phaseOps.goalConfirmed">
                    <el-tag size="mini" type="success" effect="plain">已确认</el-tag>
                    <el-button type="text" size="mini" icon="el-icon-edit" style="margin-left:4px;padding:0;" @click="phaseOps.goalConfirmed = false; $message.info('已解锁建设目标，调整后请重新点击「确认建设目标」生成差距分析')">调整目标</el-button>
                  </template>
                </div>
                <div class="pd-card">
                  <div class="pd-data-row">
                    <span class="pd-ind-name">建设期</span>
                    <span class="goal-period">
                      {{ phaseDetails[4].goals.startYear }} —
                      <el-date-picker type="year" size="mini" v-model="goalEndYearModel" value-format="yyyy" :clearable="false" :picker-options="goalEndYearPickerOptions" style="width:130px;" placeholder="选择年份"></el-date-picker>
                    </span>
                  </div>
                </div>
                <div class="pd-card pd-table pd-table-goal">
                  <div class="pd-tr pd-th">
                    <span class="pd-td pd-td-name">指标</span>
                    <span class="pd-td">2025 实际值</span>
                    <span class="pd-td">期末目标值（{{ phaseDetails[4].goals.endYear }}）</span>
                    <span class="pd-td">官方目标要求</span>
                  </div>
                  <div class="pd-group-label"><i class="el-icon-s-flag" style="color:#0067FE;"></i> 核心指标 <span class="cnt">目标要求由通知三（三）设定 · 不得低于</span></div>
                  <div v-for="g in phase5GoalGroups.core" :key="'c' + g.name" class="pd-tr">
                    <span class="pd-td pd-td-name">{{ g.name }}</span>
                    <span class="pd-td pd-td-value">{{ g.current }}<em v-if="g.unit !== '/'" class="goal-unit">{{ g.unit }}</em></span>
                    <span class="pd-td"><el-input size="mini" v-model="g.finalGoal" class="goal-input" placeholder="期末目标" :disabled="phaseOps.goalConfirmed" @blur="roundGoal(g, 'finalGoal')"></el-input></span>
                    <span class="pd-td">{{ g.finalTarget }}</span>
                  </div>
                  <div class="pd-group-label"><i class="el-icon-edit-outline" style="color:#94a3b8;"></i> 企业自主目标 <span class="cnt">无官方量化要求 · 预填 AI 推荐参考值，可调整</span></div>
                  <div v-for="g in phase5GoalGroups.self" :key="'s' + g.name" class="pd-tr">
                    <span class="pd-td pd-td-name">{{ g.name }}</span>
                    <span class="pd-td pd-td-value">{{ g.current }}<em v-if="g.unit !== '/'" class="goal-unit">{{ g.unit }}</em></span>
                    <span class="pd-td">
                      <el-select v-if="g.unit === '/'" v-model="g.finalGoal" size="mini" class="goal-input goal-select" placeholder="选择目标" :disabled="phaseOps.goalConfirmed">
                        <el-option label="持续符合" value="持续符合"></el-option>
                      </el-select>
                      <el-input v-else size="mini" v-model="g.finalGoal" class="goal-input" placeholder="期末目标" :disabled="phaseOps.goalConfirmed" @blur="roundGoal(g, 'finalGoal')"></el-input>
                    </span>
                    <span class="pd-td">{{ g.finalTarget }}</span>
                  </div>
                </div>
                <div class="pd-card-sub" style="margin-top:4px;">建设期由企业规划确定；期末目标确认后智能体按建设期分解年度轨迹</div>
              </div>
              <div class="pd-section">
                <div class="pd-title"><i class="el-icon-share"></i> ② 年度目标分解（智能体推荐 · 可调整）</div>
                <div class="pd-card pd-table pd-table-scroll">
                  <div class="pd-mid-table">
                    <div class="pd-tr pd-th">
                      <span class="pd-td pd-td-name">指标</span>
                      <span class="pd-td" v-for="y in goalMidYears" :key="'y' + y">{{ y }}</span>
                      <span class="pd-td">{{ phaseDetails[4].goals.endYear }}（期满）</span>
                    </div>
                    <div class="pd-group-label"><i class="el-icon-s-flag" style="color:#0067FE;"></i> 核心指标</div>
                    <div v-for="g in phase5GoalGroups.core" :key="'c' + g.name" class="pd-tr pd-tr-years">
                      <span class="pd-td pd-td-name">{{ g.name }}<em class="goal-unit">{{ g.unit }}</em></span>
                      <span class="pd-td" v-for="(m, mi) in g.mids" :key="mi">
                        <el-input size="mini" v-model="g.mids[mi]" class="goal-input" placeholder="—" :disabled="phaseOps.goalConfirmed" @blur="roundGoal(g, 'mids', mi)"></el-input>
                      </span>
                      <span class="pd-td pd-td-value">{{ g.finalGoal }}</span>
                    </div>
                    <div class="pd-group-label"><i class="el-icon-edit-outline" style="color:#94a3b8;"></i> 企业自主目标</div>
                    <div v-for="g in phase5GoalGroups.self" :key="'s' + g.name" class="pd-tr pd-tr-years">
                      <span class="pd-td pd-td-name">{{ g.name }}<em v-if="g.unit !== '/'" class="goal-unit">{{ g.unit }}</em></span>
                      <template v-if="g.unit === '/'">
                        <span v-for="(m, mi) in g.mids" :key="mi" class="pd-td pd-td-static">持续符合</span>
                      </template>
                      <template v-else>
                        <span class="pd-td" v-for="(m, mi) in g.mids" :key="mi">
                          <el-input size="mini" v-model="g.mids[mi]" class="goal-input" placeholder="—" :disabled="phaseOps.goalConfirmed" @blur="roundGoal(g, 'mids', mi)"></el-input>
                        </span>
                      </template>
                      <span class="pd-td pd-td-value">{{ g.finalGoal }}</span>
                    </div>
                  </div>
                </div>
                <div class="pd-card-sub" style="margin-top:4px;">{{ phaseDetails[4].goals.basis }}</div>
              </div>
              <!-- 目标确认后：对照目标给出优化建议 -->
              <template v-if="phaseOps.goalConfirmed">
                <div class="pd-section">
                  <div class="pd-title"><i class="el-icon-data-analysis"></i> 差距分析（对照建设目标）
                  </div>
                  <div v-if="phaseDetails[4].gaps.length" class="pd-card pd-table">
                    <div class="pd-tr pd-th">
                      <span class="pd-td pd-td-name">指标</span>
                      <span class="pd-td">当前值</span>
                      <span class="pd-td">建设目标</span>
                      <span class="pd-td">差距</span>
                    </div>
                    <template v-if="phase5GapGroups.core.length">
                      <div class="pd-group-label"><i class="el-icon-s-flag" style="color:#0067FE;"></i> 核心指标</div>
                      <div v-for="g in phase5GapGroups.core" :key="'c' + g.name" class="pd-tr">
                        <span class="pd-td pd-td-name">{{ g.name }}</span>
                        <span class="pd-td">{{ g.current }}</span>
                        <span class="pd-td">{{ g.target }}</span>
                        <span class="pd-td" style="color:#f56c6c;font-weight:600;">{{ g.gap }}</span>
                      </div>
                    </template>
                    <template v-if="phase5GapGroups.self.length">
                      <div class="pd-group-label"><i class="el-icon-edit-outline" style="color:#94a3b8;"></i> 企业自主目标</div>
                      <div v-for="g in phase5GapGroups.self" :key="'s' + g.name" class="pd-tr">
                        <span class="pd-td pd-td-name">{{ g.name }}</span>
                        <span class="pd-td">{{ g.current }}</span>
                        <span class="pd-td">{{ g.target }}</span>
                        <span class="pd-td" style="color:#f56c6c;font-weight:600;">{{ g.gap }}</span>
                      </div>
                    </template>
                  </div>
                  <div v-else class="pd-card"><div class="pd-conclusion"><i class="el-icon-success"></i> 核心指标已全部达到目标要求，无差距，按巩固提升要求持续改善建设成效</div></div>
                </div>
                <div class="pd-section">
                  <div class="pd-title"><i class="el-icon-magic-stick"></i> 改善措施推荐
                    <el-tag size="mini" effect="plain">默认全部采用 · 可逐项关闭</el-tag>
                    <span class="pd-mc-note">排放因子默认取自排放因子库，可在措施内手动调整</span></div>
                  <div v-for="m in phaseDetails[4].measures" :key="m.name" class="pd-card pd-ind-card">
                    <div class="pd-data-row">
                      <span class="pd-ind-name">
                        <el-tag size="mini" effect="plain" class="pd-mc-dir">{{ m.direction }}</el-tag>
                        {{ m.name }}
                      </span>
                      <el-switch :value="phaseOps.adoptedMeasures.includes(m.name)" active-color="#0067FE" @change="toggleAdoptMeasure(m.name)"></el-switch>
                    </div>
                    <template v-if="m.recoveries">
                      <div v-for="(r, ri) in m.recoveries" :key="'rc' + ri" class="pd-mb-rec">
                        <div class="pd-mb-row">
                          <el-select v-model="r.subType" size="mini" class="pd-mb-select" @change="applyRecoveryType(m, r)">
                            <el-option v-for="o in m.subTypeOptions" :key="o.value" :label="o.label" :value="o.value"></el-option>
                          </el-select>
                          <el-input v-model="r.amount" size="mini" class="pd-mb-input"></el-input>
                          <span class="pd-mb-unit">{{ recoveryOption(m, r).unit }}</span>
                          <i class="el-icon-close pd-mb-del" @click="removeRecovery(m, ri)"></i>
                        </div>
                        <div class="pd-mb-row">
                          <span class="pd-mb-sub-label">排放因子</span>
                          <el-input v-model="r.factorValue" size="mini" class="pd-mb-input"></el-input>
                          <span class="pd-mb-unit">{{ recoveryOption(m, r).factor ? recoveryOption(m, r).factor.unit : '' }}</span>
                        </div>
                      </div>
                      <div class="pd-mb-row">
                        <el-button type="text" size="mini" icon="el-icon-plus" @click="addRecovery(m)">添加回收项</el-button>
                      </div>
                    </template>
                    <template v-if="m.calcType">
                      <div v-for="p in m.params" :key="p.key" class="pd-mb-row">
                        <span class="pd-mb-label">{{ p.label }}（{{ p.unit }}）</span>
                        <el-input v-model="p.value" size="mini" class="pd-mb-input"></el-input>
                      </div>
                      <div class="pd-mb-row">
                        <span class="pd-mb-label">{{ m.factor.label }}（{{ m.factor.unit }}）</span>
                        <el-input v-model="m.factor.value" size="mini" class="pd-mb-input"></el-input>
                      </div>
                    </template>
                    <div class="pd-mb-row pd-mb-total">
                      <span class="pd-mb-label">项目年均减排量</span>
                      <span v-if="m.calcType"><b>{{ measureReduction(m).toLocaleString() }}</b> <small>tCO₂e</small></span>
                      <span v-else class="pd-mb-mgmt">管理类措施 · 不参与减排量测算</span>
                    </div>
                    <div class="pd-mb-reason">推荐理由：{{ m.reason }}</div>
                  </div>
                </div>
                <div class="pd-section">
                  <div class="pd-title"><i class="el-icon-data-analysis"></i> 减排效果汇总与目标对照</div>
                  <div class="pd-card">
                    <div class="pd-ms-bar">
                      <span class="pd-ms-item">已采纳措施 <b>{{ adoptedMeasureSummary().count }}</b> 项
                        <span class="pd-ms-sub">（测算措施 {{ adoptedMeasureSummary().calcCount }} · 管理类 {{ adoptedMeasureSummary().mgmtCount }}）</span></span>
                      <span class="pd-ms-item">合计年减排量 <b class="pd-ms-total">{{ adoptedMeasureSummary().total.toLocaleString() }}</b> tCO₂e</span>
                      <span v-for="(v, k) in adoptedMeasureSummary().byDirection" :key="k" class="pd-ms-dir">{{ k }} {{ v.toLocaleString() }}</span>
                    </div>
                    <div class="pd-msd-list">
                      <div v-for="m in adoptedMeasureSummary().rows" :key="'d' + m.name" class="pd-msd-row">
                        <span class="pd-msd-dir">{{ m.direction }}</span>
                        <span class="pd-msd-name">{{ m.name }}</span>
                        <span class="pd-msd-val">{{ m.reductionValue === null ? '—' : m.reductionValue.toLocaleString() + ' tCO₂e' }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="pd-card pd-gc-card" v-if="goalMeasureCompare().length">
                    <div v-for="g in goalMeasureCompare()" :key="'g' + g.name" class="pd-gc-row">
                      <div class="pd-gc-head">
                        <span class="pd-gc-name">{{ g.name }}</span>
                        <span class="pd-gc-target">{{ g.current }} → {{ g.target }}</span>
                        <span class="pd-gc-gap">差距 {{ g.gap }}</span>
                      </div>
                      <div class="pd-gc-measure">已采纳：{{ g.measures.length ? g.measures.join('、') : '—' }}</div>
                      <div class="pd-gc-foot">
                        <span>措施贡献 {{ g.contribText }}</span>
                        <span class="pd-gc-remain">剩余 {{ g.remainText }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-else class="pd-card"><div class="pd-conclusion"><i class="el-icon-success"></i> 核心指标已全部达标，无目标差距项；已采纳措施用于巩固提升建设成效</div></div>
                </div>
                <div class="pd-section">
                  <div class="pd-title"><i class="el-icon-s-opportunity"></i> 申报诊断</div>
                  <div class="pd-card"><div class="pd-conclusion"><i class="el-icon-warning-outline"></i> {{ phaseDetails[4].diagnosis }}</div></div>
                </div>
              </template>
              <div v-else class="pd-section">
                <div class="pd-card"><div class="pd-conclusion"><i class="el-icon-info"></i> 调整年度目标后，点击底部「确认建设目标」，将对照已确认目标生成差距分析与措施推荐</div></div>
              </div>
            </div>

            <!-- 阶段6：材料编制与数据溯源 -->
            <div v-else-if="currentStepIndex === 5" class="phase-detail">
              <div class="pd-section">
                <div class="pd-title"><i class="el-icon-document"></i> {{ materialSkillConfig.coreOutput.name }}</div>
                <div class="pd-card">
                  <div class="pd-bd-row"><span class="pd-bd-label">模板来源</span><span>{{ materialSkillConfig.template }}</span></div>
                  <div class="pd-bd-row"><span class="pd-bd-label">生成状态</span><span style="color:#e6a23c;">{{ materialSkillConfig.coreOutput.status }}</span></div>
                  <div class="pd-bd-row">
                    <span class="pd-bd-label">章节</span>
                    <span>共 {{ materialSkillConfig.coreOutput.sections.length }} 章</span>
                    <el-button type="text" size="mini" icon="el-icon-reading" style="margin-left:auto;padding:0;" @click="openFullPreview">打开方案编制（整篇）</el-button>
                  </div>
                </div>
              </div>
              <div class="pd-section">
                <div class="pd-title" style="cursor:pointer;user-select:none;" @click="evidenceChainExpanded = !evidenceChainExpanded">
                  <i class="el-icon-link"></i> 数据溯源与四级证据链 <span class="pd-title-progress">指标结果 → 计算过程 → 输入参数 → 数据来源</span>
                  <span style="font-weight:400;color:#94a3b8;font-size:11px;margin-left:6px;">{{ evidenceChainExpanded ? '' : '（' + phaseDetails[5].evidence.total + ' 项参数：自动采集 ' + phaseDetails[5].evidence.autoCollected + ' · 手动提供 ' + phaseDetails[5].evidence.manualProvided + ' · 明细默认收起，点击展开）' }}</span>
                  <i :class="evidenceChainExpanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" style="margin-left:auto;color:#909399;"></i>
                </div>
                <div v-if="evidenceChainExpanded" class="pd-card" style="margin-bottom:8px;">
                  <div class="pd-bd-row"><span class="pd-bd-label">参数总数</span><span>{{ phaseDetails[5].evidence.total }} 项</span></div>
                  <div class="pd-bd-row"><span class="pd-bd-label">自动采集</span><span>{{ phaseDetails[5].evidence.autoCollected }} 项（统一数据底座）</span></div>
                  <div class="pd-bd-row"><span class="pd-bd-label">手动提供</span><span>{{ phaseDetails[5].evidence.manualProvided }} 项（来源凭证已归档）</span></div>
                  <div class="pd-bd-row" style="border-top:1px dashed #e4e7ed;padding-top:8px;margin-top:2px;">
                    <span class="pd-bd-label">溯源报告</span>
                    <el-button type="text" size="mini" icon="el-icon-download" style="padding:0;" @click="downloadEvidenceReport">下载完整报告</el-button>
                  </div>
                </div>
                <div v-if="evidenceChainExpanded" class="pd-card pd-table" style="margin-bottom:8px;">
                  <div class="pd-card-sub" style="margin:0 0 6px;font-weight:600;color:#1e293b;">核算输入参数溯源明细（{{ evidenceParamRows.length }} 项 · 下方预览即报告主体，下载文件内容一致）</div>
                  <div class="pd-tr pd-th">
                    <span class="pd-td" style="flex:0 0 120px;">所属指标</span>
                    <span class="pd-td" style="flex:0 0 140px;">构成子模块</span>
                    <span class="pd-td" style="flex:1;">输入参数</span>
                    <span class="pd-td" style="flex:0 0 110px;">活动数据</span>
                    <span class="pd-td" style="flex:0 0 150px;">数据来源</span>
                    <span class="pd-td" style="flex:0 0 150px;">因子（来源）</span>
                  </div>
                  <div v-for="(r, ri) in evidenceParamRows" :key="ri" class="pd-tr">
                    <span class="pd-td section-cell-text" style="flex:0 0 120px;text-align:left;">{{ r.indicator }}</span>
                    <span class="pd-td section-cell-text" style="flex:0 0 140px;text-align:left;">{{ r.sub }}</span>
                    <span class="pd-td section-cell-text" style="flex:1;text-align:left;">{{ r.item }}</span>
                    <span class="pd-td section-cell-text" style="flex:0 0 110px;">{{ r.data }}</span>
                    <span class="pd-td section-cell-text" style="flex:0 0 150px;text-align:left;">{{ r.dataSource }}</span>
                    <span class="pd-td section-cell-text" style="flex:0 0 150px;text-align:left;">{{ r.factor }}（{{ r.factorSource }}）</span>
                  </div>
                </div>
                <template v-if="evidenceChainExpanded">
                <div v-for="ec in phaseDetails[5].evidenceChain" :key="ec.indicator" class="pd-card ec-card">
                  <div class="ec-head">
                    <span class="ec-indicator">{{ ec.indicator }}</span>
                    <span class="ec-result">{{ ec.result }}</span>
                    <el-tag size="mini" :type="ec.status === '满足目标要求' ? 'success' : 'warning'" effect="plain">{{ ec.status }}</el-tag>
                  </div>
                  <div class="ec-level ec-level-calc">
                    <span class="ec-level-tag">② 计算过程</span>
                    <span class="ec-level-text">{{ ec.calc }}</span>
                  </div>
                  <div class="ec-level ec-level-inputs">
                    <span class="ec-level-tag">③ 输入参数</span>
                    <div class="ec-input-list">
                      <div v-for="inp in ec.inputs" :key="inp.param" class="ec-input-row">
                        <span class="ec-param">{{ inp.param }}</span>
                        <span class="ec-detail">{{ inp.detail }}</span>
                        <span class="ec-source"><i class="el-icon-paperclip"></i> {{ inp.source }}</span>
                        <span class="ec-conf" :class="inp.conf === '高' ? 'conf-high' : 'conf-mid'">可信度{{ inp.conf }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="pd-card-sub">每项结果均可逆向往上追溯至原始凭证，证据链已 SHA-256 签名防篡改。</div>
                </template>
              </div>
              <div class="pd-section">
                <div class="pd-title"><i class="el-icon-time"></i> 关键留痕 <span class="pd-title-progress">四道关键确认 · 申报责任链条</span></div>
                <div class="pd-card">
                  <el-timeline v-if="confirmRecords.length">
                    <el-timeline-item
                      v-for="r in confirmRecords"
                      :key="r.key"
                      :timestamp="r.time"
                      placement="top"
                    >
                      <div class="confirm-record">
                        <div class="cr-head">
                          <span class="cr-name">{{ r.name }}</span>
                          <span class="cr-operator">{{ r.operator }}</span>
                        </div>
                        <div class="cr-what">{{ r.what }}</div>
                      </div>
                    </el-timeline-item>
                  </el-timeline>
                  <div v-else class="pd-card-sub">尚未记录关键确认操作，流程推进后将自动留痕。</div>
                </div>
              </div>
              <div class="pd-section">
                <div class="pd-title"><i class="el-icon-tickets"></i> 归档</div>
                <div class="pd-card">
                  <div class="pd-bd-row"><span class="pd-bd-label">归档位置</span><span>{{ phaseDetails[5].archived }}</span></div>
                  <div class="pd-bd-row"><span class="pd-bd-label">材料包内容</span><span>建设方案（七章）+ 证明材料附件及目录（已归集 18 份）+ 数据溯源报告（{{ phaseDetails[5].evidence.total }} 项参数清单）</span></div>
                  <div class="pd-bd-row"><span class="pd-bd-label">证据链签名</span><span>SHA-256 · {{ phaseDetails[5].hash }}（防篡改）</span></div>
                </div>
                <div class="report-actions-panel" style="margin-top:8px;">
                  <el-button type="success" size="small" :icon="isReportArchived ? 'el-icon-check' : 'el-icon-folder-checked'" @click="handleArchiveReport" :disabled="isReportArchived">
                    {{ isReportArchived ? '已归档至报告与档案中心' : '方案存档' }}
                  </el-button>
                  <el-dropdown @command="handleExportReport" style="margin-left:8px;">
                    <el-button type="primary" size="small" icon="el-icon-download">
                      方案导出<i class="el-icon-arrow-down el-icon--right"></i>
                    </el-button>
                    <el-dropdown-menu slot="dropdown">
                      <el-dropdown-item command="pdf"><i class="el-icon-document"></i> PDF</el-dropdown-item>
                      <el-dropdown-item command="word"><i class="el-icon-document-add"></i> Word</el-dropdown-item>
                    </el-dropdown-menu>
                  </el-dropdown>
                  <el-button size="small" icon="el-icon-s-check" plain style="margin-left:8px;" @click="handleShareReport">专家复核</el-button>
                </div>
              </div>
            </div>

          </div>

          <!-- 底部悬浮统一确认栏 -->
          <div v-if="stageConfirmConfig" class="stage-confirm-bar">
            <span class="stage-confirm-hint"><i class="el-icon-info"></i> {{ stageConfirmConfig.hint }}</span>
            <span class="stage-confirm-btns">
              <el-button v-if="stageConfirmConfig.extraLabel" size="small" plain :icon="stageConfirmConfig.extraIcon" @click="stageConfirmConfig.extraAction">{{ stageConfirmConfig.extraLabel }}</el-button>
              <el-button size="small" :type="stageConfirmConfig.type || 'primary'" :icon="stageConfirmConfig.icon" @click="stageConfirmConfig.action">{{ stageConfirmConfig.label }}</el-button>
            </span>
          </div>
        </aside>
      </div>
    </div>

    <!-- 新建申报任务对话框（主体类型在创建时确定） -->
    <el-dialog
      title="新建零碳工厂申报任务"
      :visible.sync="showNewTaskDialog"
      width="520px"
      append-to-body
      custom-class="new-task-dialog"
    >
      <div class="new-task-form">
        <div class="ntf-row">
          <span class="ntf-label">申报依据</span>
          <el-select v-model="newTaskForm.planId" size="mini" style="flex:1;" popper-class="plan-select-popper">
            <el-option v-for="v in planVersions" :key="v.id" :label="v.label" :value="v.id"></el-option>
          </el-select>
        </div>
        <div class="ntf-row">
          <span class="ntf-label">企业名称</span>
          <span class="ntf-auto-name"><i class="el-icon-s-grid"></i> {{ autoFactoryName }}</span>
        </div>
        <div class="ntf-row">
          <span class="ntf-label">基准年</span>
          <el-date-picker
            v-model="newTaskForm.baselineYear"
            type="year"
            value-format="yyyy"
            size="mini"
            style="flex:1;"
            :clearable="false"
            :picker-options="baselineYearPickerOptions"
            placeholder="由申报依据带出"
            @change="onBaselineYearChange"
          ></el-date-picker>
        </div>
        <div class="ntf-row">
          <span class="ntf-label">申报主体类型</span>
          <el-select v-model="newTaskForm.scene" size="mini" style="flex:1;" placeholder="由申报依据带出">
            <el-option v-for="s in (newTaskPlan.sceneOptions || [])" :key="s.key" :label="s.label" :value="s.key"></el-option>
          </el-select>
        </div>
      </div>
      <span slot="footer">
        <el-button size="small" @click="showNewTaskDialog = false">取消</el-button>
        <el-button size="small" type="primary" @click="confirmNewTask">创建并进入</el-button>
      </span>
    </el-dialog>

    <!-- 阶段6：整篇方案编制（通读 + 就地编辑一体） -->
    <el-dialog
      title="《零碳工厂建设方案》编制"
      :visible.sync="fullPreviewVisible"
      width="1080px"
      top="2vh"
      append-to-body
      custom-class="full-preview-dialog"
    >
      <div class="fp-layout">
        <div class="fp-toc">
          <div class="fp-toc-title">{{ currentFactoryName || '企业' }} · 零碳工厂建设方案</div>
          <div v-for="(s, si) in materialSkillConfig.coreOutput.sections" :key="'toc' + si" class="fp-toc-item" @click="jumpToPreviewSection(si)">
            <span>{{ s.title }}</span>
            <el-tag size="mini" :type="s.fillType === 'auto' ? 'success' : 'warning'" effect="plain">{{ s.fillType === 'auto' ? '已生成' : s.status }}</el-tag>
          </div>
          <div class="fp-toc-hint">草稿章节可直接在线编辑补充；【待企业补充】占位符可保留或替换为实际内容，编辑后点「保存本章」更新状态。</div>
        </div>
        <div class="fp-doc">
          <div v-for="(s, si) in materialSkillConfig.coreOutput.sections" :id="'fp-sec-' + si" :key="'doc' + si" class="fp-section">
            <div class="fp-sec-head">
              <span class="fp-sec-title">{{ s.title }}</span>
              <el-button v-if="s.fillType !== 'auto'" type="text" size="mini" icon="el-icon-magic-stick" :loading="isPolishing" @click="polishSection(si)">AI 润色</el-button>
              <el-button v-if="s.fillType !== 'auto'" type="text" size="mini" icon="el-icon-check" @click="saveSectionEdit(si)">保存本章</el-button>
            </div>
            <template v-for="(block, bi) in s.blocks">
              <div v-if="block.type === 'paragraph'" :key="'pp' + bi" class="fp-para">
                <el-input
                  v-if="s.fillType !== 'auto' && !block.dyn"
                  type="textarea"
                  resize="none"
                  :autosize="{ minRows: 3 }"
                  v-model="block.text"
                  class="fp-editor"
                ></el-input>
                <div v-else class="fp-para-readonly" v-html="renderPlanParagraph(planBlockText(block))"></div>
                <div v-if="block.dyn" class="fp-dyn-hint"><i class="el-icon-refresh"></i> 随改善措施自动生成（改参数、加减措施即同步更新）</div>
                <div v-if="block.refs && block.refs.length" class="section-ref-bar">
                  <i class="el-icon-link"></i>
                  <span class="section-ref-label">数据引用</span>
                  <el-tag v-for="r in block.refs" :key="r" size="mini" type="info" effect="plain" class="section-ref-tag">{{ r }}</el-tag>
                </div>
              </div>
              <div v-else-if="block.type === 'table'" :key="'tt' + bi" class="fp-table-wrap">
                <div class="section-table-caption">{{ block.caption }}</div>
                <div class="pd-card pd-table">
                  <div class="pd-tr pd-th">
                    <span v-for="c in getTableColumns(block)" :key="c.key" class="pd-td" :style="c.width ? { flex: '0 0 ' + c.width + 'px' } : {}">{{ c.label }}</span>
                  </div>
                  <div v-for="(row, ri) in getTableRows(block)" :key="ri" class="pd-tr">
                    <span v-for="c in getTableColumns(block)" :key="ri + '-' + c.key" class="pd-td">
                      <el-input
                        v-if="s.fillType !== 'auto' && !block.dynamic"
                        size="mini"
                        v-model="row[c.key]"
                        class="section-cell-input"
                      ></el-input>
                      <span v-else class="section-cell-text">{{ row[c.key] }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
      <span slot="footer">
        <el-button size="small" @click="fullPreviewVisible = false">关闭</el-button>
      </span>
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
    />
  </div>
</template>

<script>
import AgentIcon from '@/pages/zcip/common/AgentIcon.vue'
import OnboardingGuide from '../../agent-center/components/OnboardingGuide.vue'
import agentCoreMixin from './agentCoreMixin'
import agentChatMixin from './agentChatMixin'

export default {
  name: 'ZeroCarbonFactoryAgent',
  components: { AgentIcon, OnboardingGuide },
  mixins: [agentCoreMixin, agentChatMixin],
  methods: {
    // 新建对话：回到首页欢迎态（当前会话已由 updateTaskProgress 自动同步至任务）
    newConversation() {
      this.tlMessages = []
      this.currentConversationId = null
      this.tlDialogStep = 'welcome'
      this.tlMessages.push({
        role: 'agent',
        text:
          '<strong>您好，我是零碳工厂辅助申报智能体！</strong><br/><br/>' +
          '基于零碳工厂评价标准，为您提供 <strong>6 阶段智能申报辅助</strong> 服务。<br/><br/>' +
          '<div style="margin:8px 0;padding:12px 14px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;">' +
          '<strong style="color:#0067FE;">6 阶段流程</strong><br/>' +
          '1. 标准规则适配 — 加载标准·信息带出·资格核验·材料匹配<br/>' +
          '2. 核算模型搭建 — 材料识别自动建模·按指标搭建核算模型<br/>' +
          '3. 数据收集与校验 — 活动数据收集·因子匹配·质量校验<br/>' +
          '4. 指标核算与评价 — 核算·两级判定<br/>' +
          '5. 建设目标与优化建议 — 目标设定·差距分析·措施推荐·改善计划<br/>' +
          '6. 材料编制与数据溯源 — 方案生成·数据溯源·归档下载' +
          '</div>' +
          '<div style="margin-top:8px;color:#909399;font-size:12px;">点击下方按钮或输入「开始申报」启动流程。</div>',
        suggestions: ['开始申报'],
        time: '刚刚'
      })
      this.$message.success('已开启新对话')
      this.$nextTick(() => { if (this.$refs.tlDialogMessages) this.$refs.tlDialogMessages.scrollTop = 0 })
    }
  },
  mounted() {
    this.loadTasks()
    if (this.tlMessages.length === 0) {
      this.tlMessages.push({
        role: 'agent',
        text:
          '<strong>您好，我是零碳工厂辅助申报智能体！</strong><br/><br/>' +
          '基于零碳工厂评价标准，为您提供 <strong>6 阶段智能申报辅助</strong> 服务。<br/><br/>' +
          '<div style="margin:8px 0;padding:12px 14px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;">' +
          '<strong style="color:#0067FE;">6 阶段流程</strong><br/>' +
          '1. 标准规则适配 — 加载标准·信息带出·资格核验·材料匹配<br/>' +
          '2. 核算模型搭建 — 材料识别自动建模·按指标搭建核算模型<br/>' +
          '3. 数据收集与校验 — 活动数据收集·因子匹配·质量校验<br/>' +
          '4. 指标核算与评价 — 核算·两级判定<br/>' +
          '5. 建设目标与优化建议 — 目标设定·差距分析·措施推荐·改善计划<br/>' +
          '6. 材料编制与数据溯源 — 方案生成·数据溯源·归档下载' +
          '</div>' +
          '<div style="margin-top:8px;color:#909399;font-size:12px;">点击下方按钮或输入「开始申报」启动流程，企业名称与主体类型由系统引导确认。</div>',
        suggestions: ['开始申报'],
        time: '刚刚'
      })
    }
  },
}
</script>

<style src="../../footprint/accounting/agent-global.css"></style>

<style>
/* 新建任务弹窗：申报依据下拉面板（append到body，必须全局作用域） */
.plan-select-popper { min-width: 480px !important; max-width: 560px; }
.plan-select-popper .el-select-dropdown__item {
  height: auto;
  white-space: normal;
  line-height: 1.5;
  padding-top: 6px;
  padding-bottom: 6px;
}
</style>

<style scoped src="./agent-scoped.css"></style>
