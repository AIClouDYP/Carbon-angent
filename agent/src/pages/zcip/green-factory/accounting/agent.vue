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
            <textarea class="input-textarea" v-model="tlInputText" placeholder="输入「开始申报」启动绿色工厂申报流程，或输入问题…" rows="1"
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

        <!-- 右栏：5阶段水平进度条 + 阶段专属内容 -->
        <aside class="cd-sidebar">
          <!-- 顶部：5阶段水平进度条 -->
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
                <div class="pd-title" style="cursor:pointer;user-select:none;" @click="companyInfoExpanded = !companyInfoExpanded">
                  <i class="el-icon-s-check"></i> 企业信息
                  <el-tag size="mini" effect="plain" style="margin-left:4px;">自动带出·可编辑</el-tag>
                  <i :class="companyInfoExpanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" style="margin-left:auto;color:#909399;"></i>
                </div>
                <div v-show="companyInfoExpanded" class="pd-card">
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
                <div class="pd-title"><i class="el-icon-box"></i> 产品信息</div>
                <div class="pd-card sa-meta-card">
                  <div class="sa-meta-row sa-span2" style="align-items:flex-start;">
                    <span class="pd-bd-label sa-label" style="padding-top:5px;">产品清单</span>
                    <div class="product-list">
                      <div v-for="(p, pi) in products" :key="pi" class="pl-row">
                        <el-input v-model="p.name" size="mini" placeholder="产品名称" style="flex:1;"></el-input>
                        <el-input v-model="p.unit" size="mini" placeholder="单位" style="width:70px;"></el-input>
                        <el-select v-model="p.metered" size="mini" style="width:110px;" title="该产品是否有独立的电表/水表/气表等计量器具">
                          <el-option label="独立计量" :value="true"></el-option>
                          <el-option label="分摊计量" :value="false"></el-option>
                        </el-select>
                        <el-button size="mini" type="text" icon="el-icon-delete" title="删除" @click="products.splice(pi, 1)"></el-button>
                      </div>
                      <el-button size="mini" icon="el-icon-plus" style="margin-top:4px;" @click="addProduct">添加产品</el-button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="pd-section">
                <div class="pd-title"><i class="el-icon-reading"></i> 评价标准</div>
                <div class="pd-card sa-meta-card">
                  <div class="sa-meta-row sa-span2">
                    <span class="pd-bd-label sa-label">评价标准</span>
                    <el-select v-model="currentPlanId" size="mini" style="flex:1;" @change="onPlanVersionChange">
                      <el-option v-for="p in planVersions" :key="p.id" :label="p.label" :value="p.id"></el-option>
                    </el-select>
                  </div>
                  <div class="sa-meta-row sa-span2">
                    <span class="pd-bd-label sa-label">主体类型</span>
                    <el-select v-model="applicantType" size="mini" style="flex:1;">
                      <el-option label="制造型企业" value="manufacturing"></el-option>
                    </el-select>
                  </div>
                  <div class="sa-meta-row sa-span2">
                    <span class="pd-bd-label sa-label">评价年度</span>
                    <el-date-picker v-model="baselineYear" type="year" size="mini" style="flex:1;" placeholder="选择评价年度" value-format="yyyy" :picker-options="yearPickerOptions"></el-date-picker>
                  </div>

                </div>
              </div>
              <div class="pd-section">
                <div class="pd-title" style="cursor:pointer;user-select:none;" @click="qualificationExpanded = !qualificationExpanded">
                  <i class="el-icon-finished"></i> 申报资格
                  <el-tag size="mini" :type="qualificationStatus.type" effect="plain" style="margin-left:4px;">{{ qualificationStatus.text }}</el-tag>
                  <i :class="qualificationExpanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" style="margin-left:auto;color:#909399;"></i>
                </div>
                <div v-show="qualificationExpanded" class="pd-card pd-card-quali">
                  <div class="pd-check-head">
                    <span>要求</span><span>现状（可调整）</span><span>材料</span><span>判断</span>
                  </div>
                  <div class="pd-card-sub" style="margin:4px 0 2px;">静态硬资格</div>
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
                  <div class="pd-card-sub" style="margin:8px 0 2px;">量化条件</div>
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
                  <div class="pd-card-sub" style="margin:8px 0 2px;">负面清单承诺</div>
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

            <div v-else-if="currentStepIndex === 1" class="phase-detail pd-collect">
              <!-- 阶段2：数据收集（评价指标 → 计算参数 → 参数详情） -->
              <div class="collect-toolbar">
                <div class="ct-left">
                  <span class="ct-title">数据收集清单</span>
                  <el-tag size="mini" type="warning" effect="plain" v-if="collectPendingCount.missing">待补充 {{ collectPendingCount.missing }}</el-tag>
                  <el-tag size="mini" type="info" effect="plain" v-if="collectPendingCount.pending">待确认 {{ collectPendingCount.pending }}</el-tag>
                  <el-tag size="mini" type="success" effect="plain" v-if="!collectPendingCount.total">✓ 全部完成</el-tag>
                </div>
                <el-button
                  v-if="collectPendingCount.pending"
                  size="mini"
                  type="success"
                  plain
                  icon="el-icon-check"
                  @click="confirmAllParams">
                  全部确认（{{ collectPendingCount.pending }}）
                </el-button>
                <el-button
                  size="mini"
                  :type="collectPendingCount.total ? 'primary' : 'info'"
                  :plain="!collectPendingCount.total"
                  icon="el-icon-bottom"
                  :disabled="!collectPendingCount.total"
                  @click="locateNextPending">
                  下一项待处理<template v-if="collectPendingCount.total">（{{ collectPendingCount.total }}）</template>
                </el-button>
              </div>
              <div class="collect-body">
                <div v-for="(cat, ci) in collectByCategory" :key="cat.category" class="collect-category">
                  <div class="cc-header" @click="toggleCategory(ci)">
                    <i :class="categoryExpanded[ci] === false ? 'el-icon-arrow-right' : 'el-icon-arrow-down'" class="cc-arrow"></i>
                    <span class="cc-name">{{ cat.category }}</span>
                    <span class="cc-count">{{ cat.items.length }} 项</span>
                    <el-tag size="mini" type="warning" effect="plain" v-if="cat.missing">待补充 {{ cat.missing }}</el-tag>
                    <el-tag size="mini" type="info" effect="plain" v-if="cat.pending">待确认 {{ cat.pending }}</el-tag>
                    <el-tag size="mini" type="success" effect="plain" v-if="!cat.missing && !cat.pending">✓ 已完成</el-tag>
                  </div>
                  <div v-show="categoryExpanded[ci] !== false" class="cc-body">
                    <div v-for="grp in cat.items" :key="grp.indicator" :class="['collect-indicator', { 'is-focus': currentCollectIndicator === grp.indicator }]">
                      <div class="ci-header" @click="toggleCollectGroup(grp.indicator)">
                        <i :class="collectExpanded[grp.indicator] === false ? 'el-icon-arrow-right' : 'el-icon-arrow-down'" class="ci-arrow"></i>
                        <span class="ci-index">{{ grp.no }}</span>
                        <span class="ci-name">{{ grp.indicator }}</span>
                        <el-tooltip :content="grp.formula" placement="top" effect="dark">
                        <span class="ci-formula-icon"><i class="el-icon-info"></i> 公式</span>
                      </el-tooltip>
                      <el-radio-group v-if="grp.productMode" v-model="grp.basis" size="mini" class="ci-basis-switch" @click.native.stop>
                        <el-radio-button label="product">产品</el-radio-button>
                        <el-radio-button label="output">产值</el-radio-button>
                      </el-radio-group>
                    <el-tag size="mini" type="info" effect="plain" class="ci-unit">{{ (grp.basis || intensityBasis) === 'product' && grp.productMode ? grp.numUnit + '/' + (products[0] ? products[0].unit : '产品单位') : grp.unit }}</el-tag>
                        <el-tag size="mini" :type="groupStatus(grp).type" effect="plain" class="ci-status">{{ groupStatus(grp).text }}</el-tag>
                      </div>
                      <div v-show="collectExpanded[grp.indicator] !== false" class="ci-params">
                        <!-- 判定型指标（定性 / 清单核查） -->
                        <template v-if="isJudgmentIndicator(grp)">
                          <div class="cp-head pm-judge-head">
                            <span class="pm-c-name">核查项</span>
                            <span class="pm-c-use">核查方式</span>
                            <span class="pm-c-factor">判定结果</span>
                            <span class="pm-c-energy">得分</span>
                            <span class="pm-c-source">数据源/佐证材料</span>
                            <span class="pm-c-status">状态</span>
                          </div>
                          <div v-for="(r, ri) in flattenParams(grp)" :key="'jd-' + ri" class="cp-row pm-judge-row pm-clickable" @click="focusCollectParam(grp, r, '')">
                            <span class="pm-c-name">{{ r.item }}</span>
                            <span class="pm-c-use">
                              <el-tag size="mini" type="info" effect="plain">{{ grp.judgeMethod || '材料核查' }}</el-tag>
                            </span>
                            <span class="pm-c-factor">
                              <el-select size="mini" v-model="r.data.value" style="width:100%;">
                                <el-option label="符合" value="符合"></el-option>
                                <el-option label="不符合" value="不符合"></el-option>
                                <el-option label="部分符合" value="部分符合"></el-option>
                              </el-select>
                            </span>
                            <span class="pm-c-energy">
                              {{ r.data.value === '符合' ? grp.judgeScore || '满分' : '—' }}
                            </span>
                            <span class="pm-c-source cp-src-cell">
                              <el-tag size="mini" :type="r.data.sourceType === 'platform' ? '' : 'warning'" effect="plain" class="cp-src-type">
                                {{ r.data.sourceType === 'platform' ? '底座' : '材料' }}
                              </el-tag>
                              <span class="cp-src-text" :title="r.data.source">{{ r.data.source || '—' }}</span>
                              <el-button size="mini" type="text" icon="el-icon-folder-opened" title="从佐证材料库选择" @click.stop="linkCollectProof(r, '数据', 'link')"></el-button>
                              <el-button size="mini" type="text" icon="el-icon-upload2" title="上传材料识别" @click.stop="linkCollectProof(r, '数据', 'upload')"></el-button>
                            </span>
                            <span class="pm-c-status">
                              <el-tag size="mini" :type="itemConfirmStatus(r.data).type" effect="plain" class="pm-status-tag" @click.stop="toggleItemConfirm(r.data)">{{ itemConfirmStatus(r.data).text }}</el-tag>
                            </span>
                          </div>
                        </template>

                        <!-- 按产品分组（单位产品类指标） -->
                        <template v-else-if="grp.productMode && (grp.basis || intensityBasis) === 'product'">
                          <div v-for="p in meteredProductList" :key="p.name" class="pm-sub">
                            <div class="pm-sub-title">
                              <i class="el-icon-monitor"></i> {{ p.name }}
                              <el-tag size="mini" type="success" effect="plain">独立计量</el-tag>
                            </div>
                            <div class="cp-head">
                              <span class="pm-c-name">明细项</span>
                              <span class="pm-c-use">活动数据</span>
                              <span class="pm-c-factor">因子</span>
                              <span class="pm-c-energy">结果</span>
                              <span class="pm-c-source">数据源/佐证材料</span>
                              <span class="pm-c-status">状态</span>
                            </div>
                            <div v-for="(it, ii) in grp.productItems[p.name]" :key="ii" class="cp-row pm-clickable" @click="focusCollectParam(grp, it, p.name)">
                              <span class="pm-c-name">{{ it.item }}</span>
                              <span class="pm-c-use pm-cell-inline">
                                <el-input size="mini" v-model="it.value" class="pm-num-input" placeholder="数值" @click.native.stop></el-input>
                                <em class="pm-unit">{{ it.unit }}</em>
                              </span>
                              <span class="pm-c-factor">
                                <template v-if="it.factor">{{ it.factor }} {{ it.factorUnit }}</template>
                                <template v-else>—</template>
                              </span>
                              <span class="pm-c-energy">
                                {{ it.factor ? (parseFloat(it.value || 0) * parseFloat(it.factor)).toFixed(1) : (it.value || '—') }} {{ grp.sumUnit }}
                              </span>
                              <span class="pm-c-source cp-src-cell">
                                <el-tag size="mini" :type="it.sourceType === 'platform' ? '' : 'warning'" effect="plain" class="cp-src-type">
                                  {{ it.sourceType === 'platform' ? '底座' : '材料' }}
                                </el-tag>
                                <span class="cp-src-text" :title="it.source">{{ it.source || '—' }}</span>
                                <el-button size="mini" type="text" icon="el-icon-folder-opened" title="从佐证材料库选择" @click.stop="linkCollectProof({ item: it.item, data: it }, '数据', 'link')"></el-button>
                                <el-button size="mini" type="text" icon="el-icon-upload2" title="上传材料识别" @click.stop="linkCollectProof({ item: it.item, data: it }, '数据', 'upload')"></el-button>
                              </span>
                              <span class="pm-c-status">
                                <el-tag size="mini" :type="itemConfirmStatus(it).type" effect="plain" class="pm-status-tag" @click="toggleItemConfirm(it)">{{ itemConfirmStatus(it).text }}</el-tag>
                              </span>
                            </div>
                            <div class="cp-row pm-output-row">
                              <span class="pm-c-name">{{ grp.denLabel }}</span>
                              <span class="pm-c-use pm-cell-inline">
                                <el-input size="mini" v-model="grp.productOutputs[p.name].value" class="pm-num-input" placeholder="产量"></el-input>
                                <em class="pm-unit">{{ p.unit }}</em>
                              </span>
                              <span class="pm-c-factor">—</span>
                              <span class="pm-c-energy">—</span>
                              <span class="pm-c-source cp-src-cell">
                                <el-tag size="mini" :type="grp.productOutputs[p.name].sourceType === 'platform' ? '' : 'warning'" effect="plain" class="cp-src-type">
                                  {{ grp.productOutputs[p.name].sourceType === 'platform' ? '底座' : '材料' }}
                                </el-tag>
                                <span class="cp-src-text" :title="grp.productOutputs[p.name].source">{{ grp.productOutputs[p.name].source }}</span>
                                <el-button size="mini" type="text" icon="el-icon-folder-opened" title="从佐证材料库选择" @click.stop="linkCollectProof({ item: grp.denLabel, data: grp.productOutputs[p.name] }, '数据', 'link')"></el-button>
                                <el-button size="mini" type="text" icon="el-icon-upload2" title="上传材料识别" @click.stop="linkCollectProof({ item: grp.denLabel, data: grp.productOutputs[p.name] }, '数据', 'upload')"></el-button>
                              </span>
                              <span class="pm-c-status">
                                <el-tag size="mini" :type="itemConfirmStatus(grp.productOutputs[p.name]).type" effect="plain" class="pm-status-tag" @click="toggleItemConfirm(grp.productOutputs[p.name])">{{ itemConfirmStatus(grp.productOutputs[p.name]).text }}</el-tag>
                              </span>
                            </div>
                            <div class="cp-row pm-result pm-result-flex">
                              <span class="pm-result-item">
                                <em class="pm-result-label">{{ grp.numLabel }}合计</em>
                                <b class="pm-val">{{ itemSum(grp, p.name).toFixed(1) }} {{ grp.sumUnit }}</b>
                              </span>
                              <span class="pm-result-item">
                                <em class="pm-result-label">单位产品值</em>
                                <b class="pm-val">{{ unitValueOf(grp, p.name) }} {{ grp.numUnit }}/{{ p.unit }}</b>
                              </span>
                            </div>
                          </div>

                          <div v-if="sharedProductList.length" class="pm-sub">
                            <div class="pm-sub-title">
                              <i class="el-icon-share"></i> 分摊产品
                              <el-tag size="mini" type="warning" effect="plain">共用计量器具 · 按产量比例分摊</el-tag>
                            </div>

                            <!-- ① 共用计量项（只填一次） -->
                            <div class="pm-shared-block">
                              <div class="pm-block-label">
                                <i class="el-icon-connection"></i> 共用计量项
                                <em>（共用表读数，只填一次）</em>
                              </div>
                              <div class="cp-head">
                                <span class="pm-c-name">明细项</span>
                                <span class="pm-c-use">活动数据</span>
                                <span class="pm-c-factor">因子</span>
                                <span class="pm-c-energy">结果</span>
                                <span class="pm-c-source">数据源/佐证材料</span>
                                <span class="pm-c-status">状态</span>
                              </div>
                              <div v-for="(it, ii) in grp.sharedItems" :key="'sh-' + ii" class="cp-row pm-clickable" @click="focusCollectParam(grp, it, '共用计量')">
                                <span class="pm-c-name">{{ it.item }}</span>
                                <span class="pm-c-use pm-cell-inline">
                                  <el-input size="mini" v-model="it.value" class="pm-num-input" placeholder="数值" @click.native.stop></el-input>
                                  <em class="pm-unit">{{ it.unit }}</em>
                                </span>
                                <span class="pm-c-factor">
                                  <template v-if="it.factor">{{ it.factor }} {{ it.factorUnit }}</template>
                                  <template v-else>—</template>
                                </span>
                                <span class="pm-c-energy">
                                  {{ it.factor ? (parseFloat(it.value || 0) * parseFloat(it.factor)).toFixed(1) : (it.value || '—') }} {{ grp.sumUnit }}
                                </span>
                                <span class="pm-c-source cp-src-cell">
                                  <el-tag size="mini" :type="it.sourceType === 'platform' ? '' : 'warning'" effect="plain" class="cp-src-type">
                                    {{ it.sourceType === 'platform' ? '底座' : '材料' }}
                                  </el-tag>
                                  <span class="cp-src-text" :title="it.source">{{ it.source || '—' }}</span>
                                  <el-button size="mini" type="text" icon="el-icon-folder-opened" title="从佐证材料库选择" @click.stop="linkCollectProof({ item: it.item, data: it }, '数据', 'link')"></el-button>
                                  <el-button size="mini" type="text" icon="el-icon-upload2" title="上传材料识别" @click.stop="linkCollectProof({ item: it.item, data: it }, '数据', 'upload')"></el-button>
                                </span>
                                <span class="pm-c-status">
                                  <el-tag size="mini" :type="itemConfirmStatus(it).type" effect="plain" class="pm-status-tag" @click="toggleItemConfirm(it)">{{ itemConfirmStatus(it).text }}</el-tag>
                                </span>
                              </div>
                              <div class="cp-row pm-result pm-result-flex">
                                <span class="pm-result-item">
                                  <em class="pm-result-label">共用合计</em>
                                  <b class="pm-val">{{ sharedTotal(grp).toFixed(1) }} {{ grp.sumUnit }}</b>
                                </span>
                                <span class="pm-result-item">
                                  <em class="pm-result-label">待分摊产品</em>
                                  <b class="pm-val">{{ sharedProductList.length }} 个</b>
                                </span>
                              </div>
                            </div>

                            <!-- ② 按产品分摊 -->
                            <div class="pm-alloc-block">
                              <div class="pm-block-label">
                                <i class="el-icon-pie-chart"></i> 按产品分摊
                                <em>（按产量比例）</em>
                              </div>
                              <div class="cp-head pm-alloc-head">
                                <span class="pm-c-name">产品</span>
                                <span class="pm-c-use">产量</span>
                                <span class="pm-c-source">数据源/佐证材料</span>
                                <span class="pm-c-factor">分摊比例</span>
                                <span class="pm-c-energy">分摊结果</span>
                                <span class="pm-c-value">单位产品值</span>
                                <span class="pm-c-status">状态</span>
                              </div>
                              <div v-for="p in sharedProductList" :key="'al-' + p.name" class="cp-row pm-alloc-row">
                                <span class="pm-c-name">{{ p.name }}</span>
                                <span class="pm-c-use pm-cell-inline">
                                  <el-input size="mini" v-model="grp.productOutputs[p.name].value" class="pm-num-input" placeholder="产量"></el-input>
                                  <em class="pm-unit">{{ p.unit }}</em>
                                </span>
                                <span class="pm-c-source cp-src-cell">
                                  <el-tag size="mini" :type="grp.productOutputs[p.name].sourceType === 'platform' ? '' : 'warning'" effect="plain" class="cp-src-type">
                                    {{ grp.productOutputs[p.name].sourceType === 'platform' ? '底座' : '材料' }}
                                  </el-tag>
                                  <span class="cp-src-text" :title="grp.productOutputs[p.name].source">{{ grp.productOutputs[p.name].source }}</span>
                                  <el-button size="mini" type="text" icon="el-icon-folder-opened" title="从佐证材料库选择" @click.stop="linkCollectProof({ item: p.name + ' 产量', data: grp.productOutputs[p.name] }, '数据', 'link')"></el-button>
                                  <el-button size="mini" type="text" icon="el-icon-upload2" title="上传材料识别" @click.stop="linkCollectProof({ item: p.name + ' 产量', data: grp.productOutputs[p.name] }, '数据', 'upload')"></el-button>
                                </span>
                                <span class="pm-c-factor">{{ (allocRatio(grp, p.name) * 100).toFixed(1) }}%</span>
                                <span class="pm-c-energy">{{ allocValue(grp, p.name).toFixed(1) }} {{ grp.sumUnit }}</span>
                                <span class="pm-c-value">
                                  <b class="pm-val">{{ allocUnitValue(grp, p.name) }}</b>
                                  <em class="pm-unit">{{ grp.numUnit }}/{{ p.unit }}</em>
                                </span>
                                <span class="pm-c-status">
                                  <el-tag size="mini" :type="itemConfirmStatus(grp.productOutputs[p.name]).type" effect="plain" class="pm-status-tag" @click="toggleItemConfirm(grp.productOutputs[p.name])">{{ itemConfirmStatus(grp.productOutputs[p.name]).text }}</el-tag>
                                </span>
                              </div>
                            </div>
                          </div>
                        </template>

                        <!-- 普通参数表 -->
                        <template v-else>
                          <div class="cp-head">
                            <span class="cp-c-name">参数名称</span>
                            <span class="cp-c-unit">单位</span>
                            <span class="cp-c-value">数值</span>
                            <span class="cp-c-source">数据源 / 佐证材料</span>
                            <span class="cp-c-status">状态</span>
                          </div>
                          <div v-for="(r, ri) in flattenParams(grp)" :key="grp.indicator + '-' + ri" :class="['cp-row', { 'is-current': currentCollectParam === grp.indicator + '-' + ri }]">
                            <span class="cp-c-name">{{ r.item }}</span>
                            <span class="cp-c-unit">{{ r.data.unit || '—' }}</span>
                            <span class="cp-c-value">
                              <span v-if="r.judge" class="cp-judge">{{ r.data.value }}</span>
                              <el-input v-else size="mini" v-model="r.data.value" placeholder="请输入"></el-input>
                            </span>
                            <span class="cp-c-source">
                              <el-tag size="mini" :type="r.data.sourceType === 'platform' ? '' : 'warning'" effect="plain" class="cp-src-type">
                                {{ r.data.sourceType === 'platform' ? '底座' : '材料' }}
                              </el-tag>
                              <span class="cp-src-text" :title="r.data.source">{{ r.data.source || '—' }}</span>
                              <el-button size="mini" type="text" icon="el-icon-folder-opened" :title="r.data.sourceType === 'platform' ? '用材料替换（覆盖底座数据）' : '从佐证材料库选择'" @click="linkCollectProof(r, '数据', 'link')"></el-button>
                              <el-button size="mini" type="text" icon="el-icon-upload2" :title="r.data.sourceType === 'platform' ? '上传材料替换（覆盖底座数据）' : '上传材料识别'" @click="linkCollectProof(r, '数据', 'upload')"></el-button>
                              <el-button v-if="r.data.overridden" size="mini" type="text" icon="el-icon-refresh-left" title="恢复底座数据" @click="restorePlatformData(r)"></el-button>
                            </span>
                            <span class="cp-c-status">
                              <el-tag size="mini" :type="paramStatus(r).type" effect="plain">{{ paramStatus(r).text }}</el-tag>
                            </span>
                          </div>
                        </template>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 阶段4：指标核算与评价 -->
            <div v-else-if="currentStepIndex === 2" class="phase-detail pd-eval">
              <!-- 评价结果 -->
              <div class="pd-section">
                <div class="pd-title"><i class="el-icon-data-analysis"></i> 评价结果</div>
                <div class="eval-result">
                  <div class="er-left">
                    <div class="er-ring" :style="{ background: 'conic-gradient(' + ringColor + ' ' + (greenScore * 3.6) + 'deg, #eef2f7 0deg)' }">
                      <div class="er-ring-inner">
                        <div class="er-score">{{ greenScore }}<span>/100</span></div>
                        <div class="er-score-label">总得分</div>
                      </div>
                    </div>
                    <div v-if="scoreLevel" class="er-level" :style="{ background: scoreLevel.color + '1f', color: scoreLevel.color }">{{ scoreLevel.text }}</div>
                  </div>
                  <div class="er-right">
                    <div class="er-conclusion">
                      <span class="ec-main"><b>{{ greenScore }}</b> 分</span>
                      <span class="ec-item ec-met">达标 <b>{{ evalConclusion.met }}</b></span>
                      <span class="ec-item ec-imp">改进中 <b>{{ evalConclusion.imp }}</b></span>
                      <span class="ec-item ec-fail">未达标 <b>{{ evalConclusion.fail }}</b></span>
                      <span v-if="evalConclusion.worst" class="ec-worst">
                        最低短板：{{ evalConclusion.worst.name }}（{{ evalConclusion.worst.score }}/{{ evalConclusion.worst.weight }}）
                      </span>
                    </div>
                    <div v-for="cat in categoryScores" :key="cat.name" class="er-cat">
                      <span class="er-cat-name">{{ cat.name }}</span>
                      <div class="er-bar">
                        <i :style="{ width: cat.rate + '%', background: rateColor(cat.rate) }"></i>
                      </div>
                      <span class="er-cat-score">{{ cat.score }}<em>/{{ cat.weight }}</em></span>
                      <span class="er-badges">
                        <em v-if="cat.impCount" class="er-imp-badge" :title="cat.impCount + ' 项改进中'">{{ cat.impCount }}</em>
                        <em v-if="cat.failCount" class="er-fail-badge" :title="cat.failCount + ' 项未达标'">⚠{{ cat.failCount }}</em>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 指标对标明细（合并表 + 分组行） -->
              <div class="pd-section">
                <div class="pd-title">
                  <i class="el-icon-s-data"></i> 指标对标明细（{{ baselineYear }} 年度）
                  <span class="pd-title-sub">共 {{ dynamicIndicators.length }} 项 · 5 个一级分类 · 对标赋分</span>
                </div>

                <div class="pd-card eval-table">
                  <div class="et-row et-head">
                    <span>序号</span>
                    <span>二级指标</span>
                    <span>指标类型</span>
                    <span>单位</span>
                    <span>引领值</span>
                    <span>基准值</span>
                    <span>权重分值</span>
                    <span>实际值</span>
                    <span>得分</span>
                  </div>

                  <template v-for="grp in indicatorsByCategory">
                    <div :key="'g-' + grp.name" class="et-row et-group-row">
                      <span class="etg-left">
                        <i class="el-icon-caret-bottom"></i>
                        <b>{{ grp.name }}</b>
                        <em>{{ grp.weight }} 分</em>
                      </span>
                      <span class="etg-right">
                        <div class="etg-bar"><i :style="{ width: grp.rate + '%', background: rateColor(grp.rate) }"></i></div>
                        <b>{{ grp.score }}</b> / {{ grp.weight }}
                      </span>
                    </div>

                    <div v-for="ind in grp.items" :key="ind.no"
                         :class="['et-row', 'et-data-row', { 'is-focus': currentEvalIndicator === ind.no }]"
                         @click="focusIndicator(ind)">
                      <span class="et-no">{{ ind.no }}</span>
                      <span class="et-name" :title="ind.detail">{{ ind.name }}</span>
                      <span class="et-type">{{ ind.indicatorType }}</span>
                      <span class="et-unit">{{ ind.unit }}</span>
                      <span class="et-lead">{{ ind.leading }}</span>
                      <span class="et-base">{{ ind.baseline }}</span>
                      <span class="et-w">{{ ind.weight }}</span>
                      <span class="et-value"><b>{{ ind.value }}</b></span>
                      <span class="et-score">
                        <b :style="{ color: ind.status === 'met' ? '#52c41a' : ind.status === 'improving' ? '#E6A23C' : '#F56C6C' }">{{ ind.score }}</b>
                      </span>
                    </div>

                    <div :key="'s-' + grp.name" class="et-row et-subtotal">
                      <span class="et-no"></span>
                      <span class="et-name">小计</span>
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                      <span class="et-w"><b>{{ grp.subWeight }}</b></span>
                      <span></span>
                      <span class="et-score"><b style="color:#0067FE;">{{ grp.score }}</b></span>
                    </div>
                  </template>

                  <div class="et-row et-total">
                    <span class="et-no"></span>
                    <span class="et-name"><b>合计</b></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span class="et-w"><b>{{ totalWeight }}</b></span>
                    <span></span>
                    <span class="et-score"><b style="color:#0067FE; font-size:14px;">{{ greenScore }}</b></span>
                  </div>
                </div>
              </div>

              
            </div>

            <!-- 阶段6：材料编制与数据溯源 -->
            <div v-else-if="currentStepIndex === 3" class="phase-detail">
              <div class="pd-section">
                <div class="pd-title"><i class="el-icon-document"></i> {{ materialSkillConfig.coreOutput.name }}</div>
                <div class="pd-card">
                  <div class="pd-bd-row"><span class="pd-bd-label">模板来源</span><span>{{ materialSkillConfig.template }}</span></div>
                  <div class="pd-bd-row"><span class="pd-bd-label">生成状态</span><span style="color:#52c41a;">{{ reportGeneratedText }}</span></div>
                  <div class="pd-bd-row">
                    <el-button type="text" size="mini" icon="el-icon-reading" style="margin-left:auto;padding:0;" @click="openFullPreview">打开评价报告（整篇）</el-button>
                  </div>
                </div>
              </div>
              <div class="pd-section">
                <div class="pd-title" style="cursor:pointer;user-select:none;" @click="evidenceChainExpanded = !evidenceChainExpanded">
                  <i class="el-icon-link"></i> 数据溯源与四级证据链 <span class="pd-title-progress">指标结果 → 计算过程 → 输入参数 → 数据来源</span>
                  <span style="font-weight:400;color:#94a3b8;font-size:11px;margin-left:6px;">{{ evidenceChainExpanded ? '' : '（' + phaseDetails[3].evidence.total + ' 项参数：自动采集 ' + phaseDetails[3].evidence.autoCollected + ' · 手动提供 ' + phaseDetails[3].evidence.manualProvided + ' · 明细默认收起，点击展开）' }}</span>
                  <i :class="evidenceChainExpanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" style="margin-left:auto;color:#909399;"></i>
                </div>
                <div v-if="evidenceChainExpanded" class="pd-card" style="margin-bottom:8px;">
                  <div class="pd-bd-row"><span class="pd-bd-label">参数总数</span><span>{{ phaseDetails[3].evidence.total }} 项</span></div>
                  <div class="pd-bd-row"><span class="pd-bd-label">自动采集</span><span>{{ phaseDetails[3].evidence.autoCollected }} 项（统一数据底座）</span></div>
                  <div class="pd-bd-row"><span class="pd-bd-label">手动提供</span><span>{{ phaseDetails[3].evidence.manualProvided }} 项（来源凭证已归档）</span></div>
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
                <div v-for="ec in phaseDetails[3].evidenceChain" :key="ec.indicator" class="pd-card ec-card">
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
                  <div class="pd-bd-row"><span class="pd-bd-label">归档位置</span><span>{{ phaseDetails[3].archived }}</span></div>
                  <div class="pd-bd-row"><span class="pd-bd-label">归档内容</span><span>评价指标自评表（1 章）+ 证明材料（已归集 18 份）+ 数据溯源报告（{{ phaseDetails[3].evidence.total }} 项参数清单）</span></div>
                  <div class="pd-bd-row"><span class="pd-bd-label">证据链签名</span><span>SHA-256 · {{ phaseDetails[3].hash }}（防篡改）</span></div>
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
      title="新建绿色工厂申报任务"
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
          <span class="ntf-label">评价年度</span>
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
      v-if="fullPreviewVisible"
      title="《绿色工厂评价指标自评表》"
      :visible.sync="fullPreviewVisible"
      width="1080px"
      top="2vh"
      append-to-body
      custom-class="full-preview-dialog"
    >
      <div class="fp-layout">
        <div class="fp-toc">
          <div class="fp-toc-title">{{ currentFactoryName || '企业' }} · 绿色工厂评价指标自评表</div>
          <div v-for="(s, si) in materialSkillConfig.coreOutput.sections" :key="'toc' + si" class="fp-toc-item" @click="jumpToPreviewSection(si)">
            <span>{{ s.title }}</span>
            <el-tag size="mini" :type="s.fillType === 'auto' ? 'success' : 'warning'" effect="plain">{{ s.fillType === 'auto' ? '已生成' : s.status }}</el-tag>
          </div>
          <div class="fp-toc-hint">草稿章节可直接在线编辑补充；【待企业补充】占位符可保留或替换为实际内容，编辑后点「保存本章」更新状态。</div>
        </div>
        <div class="fp-doc">
          <div v-for="(s, si) in materialSkillConfig.coreOutput.sections" :id="'fp-sec-' + si" :key="'doc' + si" class="fp-section">
            <div v-if="s.title" class="fp-sec-head">
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
                    <span v-for="c in getTableColumns(block)" :key="ri + '-' + c.key" class="pd-td" :style="c.width ? { flex: '0 0 ' + c.width + 'px' } : {}">
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
  name: 'GreenFactoryAgent',
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
          '<strong>您好，我是绿色工厂辅助申报智能体！</strong><br/><br/>' +
          '基于绿色工厂评价标准，为您提供 <strong>4 阶段智能申报辅助</strong> 服务。<br/><br/>' +
          '<div style="margin:8px 0;padding:12px 14px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;">' +
          '<strong style="color:#0067FE;">4 阶段流程</strong><br/>' +
          '1. 标准规则适配 — 加载标准·信息带出·资格核验·材料匹配<br/>' +
          '2. 数据收集与校验 — 活动数据收集·因子匹配·质量校验<br/>' +
          '3. 指标核算与评价 — 核算·核心指标评价<br/>' +
          '4. 材料编制与数据溯源 — 方案生成·数据溯源·归档下载' +
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
          '<strong>您好，我是绿色工厂辅助申报智能体！</strong><br/><br/>' +
          '基于绿色工厂评价标准，为您提供 <strong>4 阶段智能申报辅助</strong> 服务。<br/><br/>' +
          '<div style="margin:8px 0;padding:12px 14px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;">' +
          '<strong style="color:#0067FE;">4 阶段流程</strong><br/>' +
          '1. 标准规则适配 — 加载标准·信息带出·资格核验·材料匹配<br/>' +
          '2. 数据收集与校验 — 活动数据收集·因子匹配·质量校验<br/>' +
          '3. 指标核算与评价 — 核算·核心指标评价<br/>' +
          '4. 材料编制与数据溯源 — 方案生成·数据溯源·归档下载' +
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
