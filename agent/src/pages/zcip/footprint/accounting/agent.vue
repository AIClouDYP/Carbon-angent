<template>
  <div class="agent-page">
    <!-- ===== 任务列表模式（对话式+左右分栏） ===== -->
    <div v-if="pageMode === 'task-list'" class="tl-dialog-mode">
      <div class="tl-dialog-body">
        <!-- 最左：历史对话栏（可收缩） -->
        <div :class="['fp-history-sidebar', { 'fp-history-collapsed': !showHistorySidebar }]">
          <div class="fp-history-toggle" @click="toggleHistorySidebar">
            <i :class="showHistorySidebar ? 'el-icon-d-arrow-left' : 'el-icon-d-arrow-right'"></i>
            <span v-if="!showHistorySidebar" class="fp-history-vertical">历史对话</span>
          </div>
          <div v-if="showHistorySidebar" class="fp-history-content">
            <div class="fp-history-head">
              <span>历史对话</span>
              <span class="fp-history-count">{{ conversationHistory.length }}</span>
            </div>
            <div class="fp-history-list">
              <div v-for="conv in conversationHistory" :key="conv.id"
                :class="['fp-history-item', { 'fp-history-active': currentConversationId === conv.id }]"
                @click="loadConversation(conv.id)">
                <div class="fp-history-title">{{ conv.title }}</div>
                <div class="fp-history-time">{{ conv.timestamp }}</div>
                <i class="el-icon-close fp-history-del" @click.stop="deleteConversation(conv.id)"></i>
              </div>
              <div v-if="conversationHistory.length === 0" class="fp-history-empty">
                <i class="el-icon-chat-line-square"></i>
                <span>暂无历史对话</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 左侧：对话消息区 -->
        <div class="tl-dialog-left">
          <div class="tl-dialog-header">
            <div class="tl-header-left">
              <span class="bot-avatar-sm">
                <AgentIcon icon="ai-core" :size="26" />
              </span>
              <strong class="tl-header-name"><span class="chat-name-highlight" style="font-size:15px;">小易</span></strong>
              <span class="bot-status-dot"></span>
              <span class="tl-header-status">在线</span>
            </div>
            <div class="tl-header-actions">
              <span class="token-counter" v-if="estimatedTokens > 0"><i class="el-icon-coin"></i> {{ formattedTokens }}</span>
              <span class="header-onboarding-btn" @click="startOnboarding"><i class="el-icon-aim"></i> 新手引导</span>
              <span class="toolbar-icon-sep" @click="newConversation"><i class="el-icon-plus"></i> 新建对话</span>
            </div>
          </div>
          <div class="tl-dialog-messages" ref="tlDialogMessages">
            <!-- Bot 欢迎消息 -->
            <div class="tl-msg tl-msg-bot">
              <div class="tl-msg-avatar">
                <AgentIcon icon="ai-core" :size="26" />
              </div>
              <div class="tl-msg-bubble tl-bubble-bot">
                <div class="tl-bubble-welcome">
                  👋 欢迎使用产品碳足迹核算智能体！我是小易，将全程引导您完成核算。
                </div>
                <p class="tl-bubble-text">我将引导您对产品进行全生命周期（LCA）九阶段的碳足迹智能核算，包括目标与范围界定、清单分析、影响评价等全流程。</p>
                <p class="tl-bubble-hint">💡 在下方输入产品名称并回车即可开始新核算，右侧可查看历史任务继续推进。</p>
              </div>
            </div>
            <!-- 展示历史任务（在对话中） -->
            <template v-if="tlDialogStep === 'show-history'">
              <div class="tl-msg tl-msg-bot">
                <div class="tl-msg-avatar">
                  <AgentIcon icon="ai-core" :size="26" />
                </div>
                <div class="tl-msg-bubble tl-bubble-bot tl-bubble-history">
                  <p class="tl-bubble-text">以下是您的历史核算任务，点击即可继续：</p>
                  <div class="tl-history-cards">
                    <div v-for="task in taskList" :key="task.id" class="tl-history-card" @click="continueTask(task)">
                      <div class="tl-hc-top">
                        <div class="tl-hc-icon" :style="{ backgroundColor: task.status === 'completed' ? '#52c41a' : '#0067FE' }">
                          <i :class="task.status === 'completed' ? 'el-icon-circle-check' : 'el-icon-loading'"></i>
                        </div>
                        <div class="tl-hc-info">
                          <div class="tl-hc-name">{{ task.productName }}</div>
                          <div class="tl-hc-meta">
                            <el-tag size="mini" :type="getTaskStatusType(task.status)" effect="dark">{{ getTaskStatusLabel(task.status) }}</el-tag>
                            <span class="tl-hc-standard">{{ task.standard }}</span>
                          </div>
                        </div>
                        <div @click.stop>
                          <el-popconfirm title="确定删除该任务？" confirm-button-text="删除" cancel-button-text="取消" @confirm="deleteTask(task.id)">
                            <i slot="reference" class="el-icon-delete tl-hc-delete"></i>
                          </el-popconfirm>
                        </div>
                      </div>
                      <div class="tl-hc-bottom">
                        <span class="tl-hc-phase">阶段：{{ getTaskPhaseName(task.currentStepIndex) }}</span>
                        <el-progress :percentage="Math.round(task.currentStepIndex / 8 * 100)" :stroke-width="4" :show-text="false" :color="task.status === 'completed' ? '#52c41a' : '#0067FE'" style="flex:1;margin-left:6px;"></el-progress>
                        <span class="tl-hc-time">{{ task.updatedAt }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
          <!-- 底部输入框 -->
          <div class="tl-input-area">
            <div class="input-box">
              <textarea
                class="input-textarea"
                v-model="tlInputText"
                placeholder="输入消息或提问…"
                rows="1"
                @keydown.enter.exact="handleTlSendKey"
                @input="autoResizeTlTextarea"
                ref="tlInputTextareaRef"
              ></textarea>
              <div class="input-box-footer">
                <div class="input-toolbar">
                  <span class="toolbar-icon" title="常用指令" @click="showCmdHint"><i class="el-icon-s-opportunity"></i></span>
                  <span class="toolbar-icon" title="语音输入" @click="$message.info('语音输入功能开发中')"><i class="el-icon-microphone"></i></span>
                  <span class="toolbar-icon" title="图片上传" @click="$message.info('图片上传功能开发中')"><i class="el-icon-picture"></i></span>
                  <span class="toolbar-icon" title="附件上传（Excel 核算清单）" @click="triggerUpload"><i class="el-icon-upload2"></i></span>
                  <input ref="tlFileInput" type="file" accept=".xlsx,.xls" style="display:none" @change="handleInputFileChange" />
                </div>
                <button class="send-btn" :disabled="!tlInputText.trim()" @click="handleTlSend">
                  <i class="el-icon-s-promotion"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：历史任务面板 -->
        <div class="tl-dialog-right">
          <div class="tl-right-header">
            <span class="tl-right-title"><i class="el-icon-folder-opened"></i> 历史核算任务</span>
            <span class="tl-right-count">{{ taskList.length }} 条记录</span>
          </div>
          <div class="tl-right-list">
            <el-empty v-if="taskList.length === 0" description="暂无历史任务" :image-size="80"></el-empty>
            <div v-for="task in taskList" :key="task.id" class="tl-right-card" @click="continueTask(task)">
              <div class="tl-rc-top">
                <div class="tl-rc-icon" :style="{ backgroundColor: task.status === 'completed' ? '#52c41a' : '#0067FE' }">
                  <i :class="task.status === 'completed' ? 'el-icon-circle-check' : 'el-icon-loading'"></i>
                </div>
                <div class="tl-rc-info">
                  <div class="tl-rc-name">{{ task.productName }}</div>
                  <div class="tl-rc-meta">
                    <el-tag size="mini" :type="getTaskStatusType(task.status)" effect="dark">{{ getTaskStatusLabel(task.status) }}</el-tag>
                    <span class="tl-rc-standard">{{ task.standard }}</span>
                  </div>
                </div>
                <div @click.stop>
                  <el-popconfirm title="确定删除该任务？" confirm-button-text="删除" cancel-button-text="取消" @confirm="deleteTask(task.id)">
                    <i slot="reference" class="el-icon-delete tl-rc-delete"></i>
                  </el-popconfirm>
                </div>
              </div>
              <div class="tl-rc-bottom">
                <span class="tl-rc-phase">阶段：{{ getTaskPhaseName(task.currentStepIndex) }}</span>
                <el-progress :percentage="Math.round(task.currentStepIndex / 8 * 100)" :stroke-width="4" :show-text="false" :color="task.status === 'completed' ? '#52c41a' : '#0067FE'" style="flex:1;margin-left:6px;"></el-progress>
              </div>
              <div class="tl-rc-time">{{ task.updatedAt }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 任务对话模式（原有九阶段界面） ===== -->
    <div v-if="pageMode === 'task-active'" class="task-active-mode">

    <div class="agent-body">
      <!-- 左侧：智能体对话框 -->
      <div class="agent-chat-container">
          <div class="chat-header">
          <div class="header-title">
            <AgentIcon icon="ai-core" :size="26" />
            <span class="chat-name-highlight" style="font-weight:600; margin-left: 8px; font-size:16px;">小易</span>
            <span class="product-name-badge" v-if="currentProductName">{{ currentProductName }}</span>
          </div>
          <div class="header-actions">
            <span class="token-counter" v-if="estimatedTokens > 0">
              <i class="el-icon-coin"></i> {{ formattedTokens }}
            </span>
            <span class="back-link-agent" @click="goBackToUpper"><i class="el-icon-back"></i> 返回</span>
            <span class="toolbar-icon-sep" @click="resetSession"><i class="el-icon-refresh-left"></i> 重置</span>
          </div>
        </div>

        <div class="chat-messages" ref="chatMessagesRef">
          <div v-for="msg in messages" :key="msg.id"
            :class="['message-row', `message--${msg.role}`]">
            <div class="msg-avatar">
              <AgentIcon v-if="msg.role === 'assistant'" icon="ai-core" :size="26" />
              <i v-else class="el-icon-user"></i>
            </div>
            <div class="msg-body">
              <div class="msg-text" v-html="renderMarkdown(msg.content)"></div>
              <div v-if="msg.suggestions && msg.suggestions.length" class="msg-suggestions">
                <span v-for="(s, i) in msg.suggestions" :key="i" class="suggestion-btn" :class="{ 'suggestion-disabled': isTyping }" @click="!isTyping && sendSuggestion(s)">{{ s }}</span>
              </div>
              <div class="msg-footer">
                <span class="msg-time">{{ msg.timestamp }}</span>
                <div class="msg-actions" v-if="msg.role === 'assistant'">
                  <span class="msg-action-btn" title="复制内容" @click="copyMessageContent(msg.content)">
                    <i class="el-icon-document-copy"></i>
                  </span>
                  <span class="msg-action-btn" title="重新生成" @click="regenerateMessage(msg.id)">
                    <i class="el-icon-refresh"></i>
                  </span>
                </div>
                <div class="msg-actions" v-else-if="msg.role === 'user'">
                  <span class="msg-action-btn" title="复制内容" @click="copyMessageContent(msg.content)">
                    <i class="el-icon-document-copy"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部占位 -->
          <!-- 打字指示器 -->
          <div v-if="isTyping" class="message-row message--assistant">
            <div class="msg-avatar">
              <AgentIcon icon="ai-core" :size="26" />
            </div>
            <div class="msg-body">
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <!-- 快捷指令面板 -->
          <div v-if="showCmdPanel" class="cmd-panel">
            <div class="cmd-panel-header">
              <span class="cmd-panel-title"><i class="el-icon-s-opportunity"></i> 快捷指令</span>
              <span class="cmd-panel-close" @click="showCmdPanel = false"><i class="el-icon-close"></i></span>
            </div>
            <div class="cmd-panel-body">
              <div class="cmd-group">
                <div class="cmd-group-title">核算操作</div>
                <div class="cmd-list">
                  <span class="cmd-item" @click="useCmd('开始核算')"><i class="el-icon-video-play"></i> 开始核算</span>
                  <span class="cmd-item" @click="useCmd('下一步')"><i class="el-icon-right"></i> 下一步</span>
                  <span class="cmd-item" @click="useCmd('查看结果')"><i class="el-icon-view"></i> 查看结果</span>
                  <span class="cmd-item" @click="useCmd('重算')"><i class="el-icon-refresh"></i> 重算</span>
                </div>
              </div>
              <div class="cmd-group">
                <div class="cmd-group-title">配置向导</div>
                <div class="cmd-list">
                  <span class="cmd-item cmd-item-highlight" @click="useCmd('配置边界')"><i class="el-icon-set-up"></i> 边界配置向导</span>
                  <span class="cmd-item cmd-item-highlight" @click="useCmd('确认数据来源')"><i class="el-icon-document-checked"></i> 数据确认向导</span>
                </div>
              </div>
              <div class="cmd-group">
                <div class="cmd-group-title">数据查询</div>
                <div class="cmd-list">
                  <span class="cmd-item" @click="useCmd('查询排放因子')"><i class="el-icon-search"></i> 查询排放因子</span>
                  <span class="cmd-item" @click="useCmd('查看核算边界')"><i class="el-icon-set-up"></i> 查看核算边界</span>
                  <span class="cmd-item" @click="useCmd('查看数据校验结果')"><i class="el-icon-circle-check"></i> 校验结果</span>
                </div>
              </div>
              <div class="cmd-group">
                <div class="cmd-group-title">报告导出</div>
                <div class="cmd-list">
                  <span class="cmd-item" @click="useCmd('导出碳足迹报告')"><i class="el-icon-document"></i> 导出报告</span>
                  <span class="cmd-item" @click="useCmd('导出计算数据')"><i class="el-icon-download"></i> 导出数据</span>
                </div>
              </div>
            </div>
          </div>
          <div class="input-box">
            <textarea
              class="input-textarea"
              v-model="inputText"
              placeholder="提问或输入指令（输入 / 呼出快捷指令）…"
              rows="1"
              @keydown.enter.exact="handleSendKey"
              @input="autoResizeTextarea"
              ref="inputTextareaRef"
            ></textarea>
            <div class="input-box-footer">
              <div class="input-toolbar">
                <span class="toolbar-icon" title="快捷指令" @click="showCmdPanel = !showCmdPanel"><i class="el-icon-s-opportunity"></i></span>
                <span class="toolbar-icon" title="语音输入" @click="$message.info('语音输入功能开发中')"><i class="el-icon-microphone"></i></span>
                <span class="toolbar-icon" title="图片上传" @click="$message.info('图片上传功能开发中')"><i class="el-icon-picture"></i></span>
                <span class="toolbar-icon" title="附件上传（Excel 核算清单）" @click="triggerUpload">
                  <i class="el-icon-upload2"></i>
                </span>
                <input ref="inputFileInput" type="file" accept=".xlsx,.xls" style="display:none" @change="handleInputFileChange" />
              </div>
              <button class="send-btn" :disabled="!inputText.trim() || isTyping" @click="handleSend">
                <i class="el-icon-s-promotion"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：阶段0=标准库+解析内容上下布局，阶段1+=全屏内容 -->
      <aside class="agent-resources-sidebar">
        <!-- 九阶段进度条（单行：圆圈+名称） -->
        <div class="phase-progress-bar">
          <div class="phase-track">
            <div v-for="(phase, idx) in phases" :key="phase.key"
              :class="['phase-track-node', { 'track-active': idx === currentStepIndex, 'track-done': idx < currentStepIndex }]"
              @click="jumpToPhase(idx)">
              <div class="track-dot">
                <i v-if="idx < currentStepIndex" class="el-icon-check"></i>
                <span v-else>{{ idx + 1 }}</span>
              </div>
              <span class="track-label">{{ phase.name }}</span>
              <div v-if="idx < phases.length - 1" :class="['track-line', { 'track-line-done': idx < currentStepIndex || idx === currentStepIndex - 0.5 }]"></div>
            </div>
          </div>
        </div>

        <!-- 阶段0：上部核算标准（当前标准 + 切换） -->
        <div v-if="currentStepIndex === 0" class="sidebar-upper">
          <div class="upper-header">
            <div class="upper-title-row">
              <i class="el-icon-reading"></i>
              <span class="upper-title">政策标准</span>
              <el-button v-if="standardsWithSelection.length > 1" type="text" size="mini" class="std-switch-btn"
                @click="standardPickerOpen = !standardPickerOpen">
                {{ standardPickerOpen ? '收起' : '切换标准' }}
                <i :class="standardPickerOpen ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
              </el-button>
            </div>
          </div>

          <div v-if="!standardPickerOpen && selectedStandardConfig" class="std-current">
            <i class="el-icon-document-checked std-current-icon"></i>
            <div class="std-current-main">
              <span class="std-current-code">{{ selectedStandardConfig.code }}</span>
              <span class="std-current-name">{{ selectedStandardConfig.name }}</span>
            </div>
            <span class="std-current-tag">已选中</span>
          </div>

          <div v-else class="standards-list">
            <div v-for="std in standardsWithSelection" :key="std.code"
              :class="['standard-item', { 'standard-selected': std.code === selectedStandard }]"
              @click="selectStandard(std.code)">
              <div :class="['std-icon', { 'std-icon-selected': std.code === selectedStandard }]">
                <i :class="std.code === selectedStandard ? 'el-icon-folder-opened' : 'el-icon-folder'"></i>
              </div>
              <div class="std-info">
                <div class="std-code">{{ std.code }}</div>
                <div class="std-name">{{ std.name }}</div>
              </div>
              <el-tag v-if="std.code === selectedStandard" size="mini" type="success" effect="dark">已选中</el-tag>
            </div>
          </div>
        </div>

        <!-- 阶段0分割线 -->
        <div v-if="currentStepIndex === 0" class="sidebar-divider"></div>

        <!-- 下部：阶段0时在sidebar-lower内展示解析内容，阶段1+时占满右侧 -->
        <div :class="[currentStepIndex === 0 ? 'sidebar-lower' : 'sidebar-lower sidebar-lower-full']">
          <!-- 未选中标准时（仅阶段0） -->
          <div v-if="!selectedStandard && currentStepIndex === 0" class="lower-empty">
            <i class="el-icon-document"></i>
            <p>请从上方选择一个标准<br>查看其解析内容</p>
          </div>

          <!-- 阶段 0：标准解析结果（随选中标准动态渲染） -->
          <div v-if="currentStepIndex === 0 && selectedStandardConfig" class="parsing-section">
            <div class="content-header">
              <div class="content-header-row">
                <i class="el-icon-document"></i>
                <span class="content-header-title">标准内容解析</span>
              </div>
            </div>

            <div class="parsing-cards">
              <div class="parsing-card">
                <div class="parsing-card-header">
                  <span class="parsing-card-icon scope-icon"></span>
                  <span class="parsing-card-title">适用范围</span>
                </div>
                <div class="parsing-card-body">
                  <p v-if="stdScope">{{ stdScope }}</p>
                  <p v-if="stdScopeExcluded">{{ stdScopeExcluded }}</p>
                </div>
              </div>

              <div class="parsing-card">
                <div class="parsing-card-header">
                  <span class="parsing-card-icon boundary-icon"></span>
                  <span class="parsing-card-title">生命周期阶段</span>
                </div>
                <div class="parsing-card-body">
                  <p>应覆盖以下 {{ stageList.length }} 个生命周期阶段：</p>
                  <p>{{ stageList.join(' · ') }}</p>
                </div>
              </div>

              <div class="parsing-card">
                <div class="parsing-card-header">
                  <span class="parsing-card-icon boundary-icon"></span>
                  <span class="parsing-card-title">边界量化规则</span>
                </div>
                <div class="parsing-card-body">
                  <p>量化口径：<b>{{ stdQuantBasis }}</b></p>
                  <p>量化单位：<b>{{ stdUnitTypeLabel }}</b> — {{ stdUnitDetail || '—' }}</p>
                  <p>分配规则：<b>{{ stdAllocationLabel }}</b></p>
                  <p>取舍准则：{{ stdCutoff || '—' }}</p>
                </div>
              </div>

              <div class="parsing-card">
                <div class="parsing-card-header">
                  <span class="parsing-card-icon scope-icon"></span>
                  <span class="parsing-card-title">数据与因子要求</span>
                </div>
                <div class="parsing-card-body">
                  <p v-if="stdDataQuality.length">数据质量要求：</p>
                  <p v-for="(dq, di) in stdDataQuality" :key="di">
                    · <b>{{ dq.label }}：</b>{{ dq.desc }}
                  </p>
                  <p>DQR 评估维度：{{ dqrDimsText }}</p>
                  <p>因子优先序：{{ factorPriorityText }}</p>
                </div>
              </div>

              <div class="parsing-card" v-if="stdGhgGases.length">
                <div class="parsing-card-header">
                  <span class="parsing-card-icon scope-icon"></span>
                  <span class="parsing-card-title">温室气体种类</span>
                </div>
                <div class="parsing-card-body">
                  <p>核算 <b>{{ stdGhgGases.length }}</b> 种温室气体（GWP100）：</p>
                  <p>{{ stdGhgGases.map(g => g.symbol + ' ' + g.name + (g.gwp100 !== undefined ? '（GWP=' + g.gwp100 + '）' : '')).join(' · ') }}</p>
                </div>
              </div>


              <div class="parsing-card" v-if="stdFormulas.length">
                <div class="parsing-card-header">
                  <span class="parsing-card-icon scope-icon"></span>
                  <span class="parsing-card-title">核算公式</span>
                </div>
                <div class="parsing-card-body">
                  <p v-for="(f, fi) in stdFormulas" :key="fi">
                    <b>{{ f.label }}：</b>{{ f.formula }}
                  </p>
                </div>
              </div>

              <div class="parsing-card">
                <div class="parsing-card-header">
                  <span class="parsing-card-icon scope-icon"></span>
                  <span class="parsing-card-title">校验与报告要求</span>
                </div>
                <div class="parsing-card-body">
                  <p v-if="stdCompletenessRule">{{ stdCompletenessRule }}</p>
                  <p>报告模板：{{ reportTemplateLabel }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 阶段 1：核算边界配置（5个子步骤） -->
          <div v-else-if="currentStepIndex === 1" class="parsing-section">
            <div class="content-header">
              <div class="content-header-row">
                <i class="el-icon-set-up"></i>
                <span class="content-header-title">核算边界配置</span>
                <span class="content-header-sub">已由智能体按标准预填，可直接修改</span>
              </div>
            </div>

            <!-- 可编辑配置列表 -->
            <div class="boundary-edit-list">
              <!-- 1. 生命周期范围（按所选标准自适应：标准固定则只读，否则可选） -->
              <div class="boundary-edit-row">
                <span class="boundary-edit-label">生命周期范围</span>
                <!-- 标准明确规定阶段：只读锁定，不可改 -->
                <template v-if="stdStagesFixed">
                  <span class="boundary-locked-value">{{ stdScopeLabel }}</span>
                  <el-tag size="mini" type="info" effect="plain" class="boundary-locked-tag">标准固定</el-tag>
                </template>
                <!-- 标准未明确规定：用户选择通用口径 -->
                <el-select v-else v-model="boundaryConfig.lifecycleScope" size="mini" class="boundary-edit-control" @change="onBoundaryEdit('lifecycleScope')">
                  <el-option label="摇篮到坟墓" value="cradle-to-grave"></el-option>
                  <el-option label="摇篮到大门" value="cradle-to-gate"></el-option>
                  <el-option label="大门到大门" value="gate-to-gate"></el-option>
                </el-select>
              </div>
              <!-- 标准固定的阶段清单（只读展示） -->
              <div v-if="stdStagesFixed && stdStageNames.length" class="boundary-edit-row boundary-stages-row">
                <span class="boundary-edit-label">纳入阶段</span>
                <span class="boundary-stages-text">{{ stdStageNames.join(' · ') }}</span>
              </div>
              <!-- 2. 量化单位 -->
              <div class="boundary-edit-row">
                <span class="boundary-edit-label">量化单位</span>
                <!-- 标准固定：只读 -->
                <template v-if="isBoundaryLocked('unitType')">
                  <span class="boundary-locked-value">{{ boundaryUnitTypeLabel }}</span>
                  <el-tag size="mini" type="info" effect="plain" class="boundary-locked-tag">标准固定</el-tag>
                  <span class="boundary-locked-detail">{{ boundaryConfig.unitDetail }}</span>
                </template>
                <!-- 标准未固定：可选 -->
                <div v-else class="boundary-edit-group">
                  <el-select v-model="boundaryConfig.unitType" size="mini" class="boundary-edit-type" @change="onBoundaryEdit('unitType')">
                    <el-option label="声明单位" value="declaration"></el-option>
                    <el-option label="功能单位" value="functional"></el-option>
                  </el-select>
                  <el-input v-model="boundaryConfig.unitDetail" size="mini" class="boundary-edit-detail" :placeholder="boundaryConfig.unitType === 'declaration' ? '如：1台产品' : '如：1kg产品'"></el-input>
                </div>
              </div>
              <!-- 3. 分配规则 -->
              <div class="boundary-edit-row">
                <span class="boundary-edit-label">分配规则</span>
                <template v-if="isBoundaryLocked('allocationRule')">
                  <span class="boundary-locked-value boundary-locked-long">{{ stdAllocationLabel }}</span>
                  <el-tag size="mini" type="info" effect="plain" class="boundary-locked-tag">标准固定</el-tag>
                </template>
                <el-select v-else v-model="boundaryConfig.allocationRule" size="mini" class="boundary-edit-control" @change="onBoundaryEdit('allocationRule')">
                  <el-option label="质量分配" value="mass"></el-option>
                  <el-option label="经济分配" value="economic"></el-option>
                  <el-option label="能源分配" value="energy"></el-option>
                </el-select>
              </div>
              <!-- 4. 取舍规则 -->
              <div class="boundary-edit-row">
                <span class="boundary-edit-label">取舍规则</span>
                <template v-if="isBoundaryLocked('cutoffThreshold')">
                  <span class="boundary-locked-value boundary-locked-long">{{ stdCutoff }}</span>
                  <el-tag size="mini" type="info" effect="plain" class="boundary-locked-tag">标准固定</el-tag>
                </template>
                <div v-else class="boundary-edit-group">
                  <span class="boundary-edit-prefix">单项 &lt;</span>
                  <el-input v-model="boundaryConfig.cutoffItemThreshold" size="mini" class="boundary-edit-cutoff"></el-input>
                  <span class="boundary-edit-prefix">累计 ≤</span>
                  <el-input v-model="boundaryConfig.cutoffTotalThreshold" size="mini" class="boundary-edit-cutoff"></el-input>
                </div>
              </div>
              <!-- 5. 时间边界 -->
              <div class="boundary-edit-row">
                <span class="boundary-edit-label">时间边界</span>
                <el-date-picker v-model="boundaryDateRange" type="daterange" size="mini" class="boundary-edit-control" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd" @change="onDateRangeChange"></el-date-picker>
              </div>
              <!-- 6. 排放因子库（多选，按标准推荐） -->
              <div class="boundary-edit-row boundary-factor-row">
                <span class="boundary-edit-label">排放因子库</span>
                <div class="flc-wrap">
                  <el-select v-model="selectedFactorLibs" multiple filterable
                    class="flc-select" placeholder="选择排放因子库（可多选）" size="mini">
                    <el-option v-for="lib in availableFactorLibs()" :key="lib.id"
                      :label="lib.shortName || lib.name" :value="lib.id" :disabled="lib.required">
                      <div class="flc-opt">
                        <span class="flc-opt-name">{{ lib.shortName || lib.name }}</span>
                        <span class="flc-opt-meta">{{ lib.version }} · {{ lib.releaseDate }}</span>
                        <el-tag v-if="lib.id === 'elec-ts'" size="mini" type="success" effect="plain">时空分辨</el-tag>
                        <el-tag v-if="lib.required" size="mini" type="warning" effect="plain">标准要求</el-tag>
                      </div>
                    </el-option>
                  </el-select>
                  <div class="flc-foot">
                    已启用 <b>{{ selectedFactorLibs.length }}</b> 个库<span v-if="requiredFactorLibs().length">（含 {{ requiredFactorLibs().length }} 个标准必选）</span>
                    · 按标准 {{ selectedStandardConfig ? selectedStandardConfig.code : '—' }} 推荐
                    <el-button type="text" size="mini" @click="selectAllFactorLibs(true)">全选</el-button>
                    <el-button type="text" size="mini" @click="selectAllFactorLibs(false)">仅保留必选</el-button>
                  </div>
                </div>
              </div>
              <!-- 7. 电力因子精度（独立于因子库列表；仅当分时分区库覆盖企业所在省市时显示） -->
              <div class="boundary-edit-row" v-if="hasTimespaceFactorForRegion">
                <span class="boundary-edit-label">电力因子精度</span>
                <el-select v-model="elecFactorMode" size="mini" class="boundary-efm-select" @change="onElecFactorModeChange">
                  <el-option label="常规（电网平均）" value="regular"></el-option>
                  <el-option label="分时分区" value="timespace"></el-option>
                </el-select>
                <span class="efm-hint" :class="{ 'efm-hint-warn': elecFactorMode === 'timespace' }">
                  <template v-if="elecFactorMode === 'regular'">
                    采用所选因子库的区域电网平均因子，仅需电量总量数据
                  </template>
                  <template v-else>
                    <i class="el-icon-warning-outline"></i>
                    按小时级时刻与具体生产工序取值，要求阶段四电量数据充足：须按小时、按工序、分电力类型记录且覆盖完整
                  </template>
                </span>
              </div>
            </div>

          </div>

          <!-- 阶段四/五/六数据质检（双页签） -->
          <div v-else-if="currentStepIndex >= 3 && currentStepIndex <= 5 && validationStep >= 1 && validationStep <= 4" class="parsing-section">
            <div class="content-header">
              <div class="content-header-row">
                <i class="el-icon-warning-outline"></i>
                <span class="content-header-title">数据质检中心</span>
              </div>
            </div>

            <!-- 页签头部：segmented control 风格（仅阶段6显示） -->
            <div v-if="currentStepIndex === 5" class="val-tab-header">
              <div :class="['val-tab-btn', { active: validationActiveTab === 'validation' }]" @click="validationActiveTab = 'validation'">
                <i class="el-icon-warning-outline"></i>
                <span>待补充 / 待确认</span>
                <em class="val-tab-badge" v-if="validationItems.filter(v => v.status !== 'resolved' && v.status !== 'skipped').length">{{ validationItems.filter(v => v.status !== 'resolved' && v.status !== 'skipped').length }}</em>
              </div>
              <div :class="['val-tab-btn', { active: validationActiveTab === 'activity' }]" @click="validationActiveTab = 'activity'">
                <i class="el-icon-document-copy"></i>
                <span>数据清单</span>
              </div>
            </div>

            <!-- 页签1：校验项列表（仅阶段6显示）— 上下三段式 -->
            <div v-if="currentStepIndex === 5 && validationActiveTab === 'validation'" class="val-tab-content">

              <!-- ① 补充/确认清单（全宽，可下载） -->
              <div class="val-section val-checklist-section">
                <div class="val-section-header">
                  <div class="val-section-title">
                    <i class="el-icon-warning-outline"></i>
                    <span>补充 / 确认清单</span>
                    <el-tag size="mini" type="danger" effect="plain" v-if="validationItems.filter(v => v.status === 'missing').length">
                      缺失 {{ validationItems.filter(v => v.status === 'missing').length }}
                    </el-tag>
                    <el-tag size="mini" type="warning" effect="plain" v-if="validationItems.filter(v => v.status === 'pending').length">
                      待确认 {{ validationItems.filter(v => v.status === 'pending').length }}
                    </el-tag>
                  </div>
                  <el-button size="mini" type="text" icon="el-icon-download" @click="downloadMissingChecklist">下载清单</el-button>
                </div>
                <div class="val-checklist-body">
                  <div v-for="item in validationItems.filter(v => v.status !== 'resolved' && v.status !== 'skipped')" :key="'ck-' + item.id" class="checklist-item">
                    <div class="checklist-item-info">
                      <i :class="item.status === 'missing' ? 'el-icon-error' : 'el-icon-question'" :style="{ color: item.status === 'missing' ? '#f56c6c' : '#e6a23c', fontSize: '14px' }"></i>
                      <span class="checklist-item-name">{{ item.ioName }}</span>
                      <el-tag size="mini" :type="item.status === 'missing' ? 'danger' : 'warning'" effect="plain">{{ item.stage }}</el-tag>
                      <el-tag size="mini" type="info" effect="plain">{{ item.statusLabel }}</el-tag>
                    </div>
                    <div class="checklist-item-desc">{{ item.label }}</div>
                    <div class="checklist-item-suggest">
                      <i class="el-icon-paperclip"></i>
                      <span>建议上传：{{ item.supplementHint || '相关数据台账/清单文件' }}</span>
                    </div>
                  </div>
                  <div v-if="validationItems.filter(v => v.status === 'resolved').length > 0" class="checklist-resolved-tip">
                    <i class="el-icon-circle-check" style="color:#67c23a"></i>
                    已处理 {{ validationItems.filter(v => v.status === 'resolved').length }} 项
                  </div>
                </div>
              </div>

              <!-- ② 文件上传（全宽） -->
              <div class="val-section val-upload-section">
                <div class="val-section-header">
                  <div class="val-section-title">
                    <i class="el-icon-upload2"></i>
                    <span>材料上传</span>
                  </div>
                </div>
                <div class="val-upload-body">
                  <el-upload
                    action="#"
                    :auto-upload="false"
                    :show-file-list="false"
                    :on-change="handleSupplementFile"
                    multiple
                    drag
                    accept=".xlsx,.xls,.csv,.pdf,.jpg,.png"
                  >
                    <i class="el-icon-upload"></i>
                    <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
                    <div class="el-upload__tip" slot="tip">支持 Excel / PDF / 图片格式</div>
                  </el-upload>
                  <div class="supplement-file-list" v-if="supplementFiles.length > 0">
                    <div v-for="(f, i) in supplementFiles" :key="i" class="supplement-file-item">
                      <i :class="getFileIcon(f.name)"></i>
                      <span class="supplement-file-name">{{ f.name }}</span>
                      <span class="supplement-file-status" v-if="f.parsed"><i class="el-icon-circle-check"></i> 已解析</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ③ 可编辑列表（全宽，逐项填报/确认） -->
              <div class="val-section val-edit-section">
                <div class="val-section-header">
                  <div class="val-section-title">
                    <i class="el-icon-edit-outline"></i>
                    <span>逐项填报 / 确认</span>
                  </div>
                </div>
                <div class="val-edit-list">
                  <div v-for="item in validationItems" :key="item.id" class="validation-task-card" :class="`is-status-${item.status}`">
                    <div class="vtc-header">
                      <div class="vtc-title">
                        <el-tag size="mini" effect="dark" type="info">{{ item.stage }}</el-tag>
                        <i class="el-icon-arrow-right vtc-arrow"></i>
                        <el-tag size="mini" effect="plain" type="success">{{ item.process }}</el-tag>
                        <span class="vtc-problem-desc">
                          <i :class="item.status === 'missing' ? 'el-icon-warning-outline' : 'el-icon-info'" :style="{ color: item.status === 'missing' ? '#f56c6c' : '#e6a23c', marginRight: '4px' }"></i>
                          {{ item.label }}
                        </span>
                      </div>
                      <div class="vtc-status">
                        <el-tag size="small" :type="statusTagType(item.status)">{{ item.statusLabel }}</el-tag>
                      </div>
                    </div>
                    <div class="vtc-body">
                      <div class="vtc-data-field">
                        <span class="vtc-label">{{ item.ioType === 'input' ? '输入项' : '输出项' }}名称：</span>
                        <span class="vtc-value-name">{{ item.ioName }}</span>
                      </div>
                      <div class="vtc-data-field">
                        <span class="vtc-label">{{ item.status === 'missing' ? '待填报数值' : '待确认数值' }}：</span>
                        <div v-if="item.status !== 'resolved' && item.status !== 'skipped'" class="vtc-input-group">
                          <el-input size="small" v-model="item.value" placeholder="请输入..." style="width: 140px;">
                            <template slot="append" v-if="item.unit">{{ item.unit }}</template>
                          </el-input>
                        </div>
                        <div v-else class="vtc-readonly-val">
                           <strong>{{ item.value || '—' }}</strong>
                        </div>
                      </div>
                      <div class="vtc-data-field vtc-recommend-field" v-if="item.recommended !== undefined && item.status !== 'resolved' && item.status !== 'skipped'">
                        <span class="vtc-label">智能体推荐值：</span>
                        <span class="vtc-recommend-val">{{ item.recommended }}{{ item.unit ? ' ' + item.unit : '' }}</span>
                        <span class="vtc-recommend-note">{{ item.recommendNote }}</span>
                        <el-button type="text" size="mini" class="vtc-adopt-btn" @click="adoptRecommended(item)">采纳</el-button>
                      </div>
                      <div class="vtc-actions">
                        <el-button v-if="item.status !== 'resolved' && item.status !== 'skipped'" size="small" :type="item.status === 'missing' ? 'primary' : 'warning'" @click="handleValItemClick(item)">
                          <i class="el-icon-check"></i> {{ item.status === 'missing' ? '提交填报' : '确认数据' }}
                        </el-button>
                        <span v-else-if="item.status === 'resolved'" class="vtc-resolved-mark"><i class="el-icon-circle-check"></i> 已处理</span>
                        <span v-else class="vtc-skipped-mark"><i class="el-icon-remove-outline"></i> 已跳过</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 全部校验项处理完毕后的下一步入口 -->
              <div class="val-next-bar" v-if="currentStepIndex === 5 && validationAllResolved">
                <el-button type="primary" size="small" @click="finishValidation"><i class="el-icon-right"></i> 确认数据，进入下一步</el-button>
              </div>

            </div>

            <!-- 页签2：活动数据与因子（阶段4/5始终显示，阶段6按选中状态显示） -->
            <div v-if="currentStepIndex < 5 || validationActiveTab === 'activity'" class="val-tab-content">
              <div v-for="stage in modelStages" :key="stage.key" class="activity-stage-group">
                <div class="activity-stage-header">
                  <span :class="['stage-dot', stage.dotClass]"></span>
                  <strong>{{ stage.title }}</strong>
                  <el-tag size="mini" type="info">{{ stage.processes.length }} 个单元过程</el-tag>
                </div>
                <div v-for="proc in stage.processes" :key="proc.name" class="activity-proc-card">
                  <div class="activity-proc-title">
                    <i class="el-icon-cpu"></i>
                    <span>{{ proc.name }}</span>
                  </div>
                  <!-- 输入区 -->
                  <div class="activity-io-section">
                    <div class="activity-io-label"><i class="el-icon-bottom"></i> 输入流</div>
                    <div class="aet-table">
                      <div class="aet-header">
                        <span class="aet-col-name" style="background:#f5f7fa">名称</span>
                        <span class="aet-col-val" style="background:#f5f7fa">活动数据</span>
                        <span class="aet-col-unit" style="background:#f5f7fa">单位</span>
                        <span class="aet-col-factor">排放因子</span>
                      </div>
                      <div v-for="inp in proc.inputs" :key="inp.name" class="aet-row aet-input-row is-clickable" @click="onActivityRowClick(inp, proc, 'input')">
                        <span class="aet-col-name"><i v-if="inp.verified" class="el-icon-circle-check aet-verified-icon"></i>{{ inp.name }}</span>
                        <!-- 分时分区模式：活动数据改为「查看详情」按钮，排放因子不再折算显示 -->
                        <template v-if="isTsElec(inp, stage)">
                          <span class="aet-col-val">
                            <el-button type="text" size="mini" icon="el-icon-view" class="ts-view-btn" @click.stop="openTsDetail(inp, proc.name)">查看详情</el-button>
                          </span>
                          <span class="aet-col-unit">{{ inp.unit }}</span>
                          <span class="aet-col-factor aet-factor-none">—</span>
                        </template>
                        <template v-else>
                          <span class="aet-col-val">
                            <template v-if="currentStepIndex === 2"><span class="aet-val-hidden">—</span></template>
                            <template v-else><input class="aet-input" v-model="inp.value" /></template>
                          </span>
                          <span class="aet-col-unit">{{ inp.unit }}</span>
                          <span class="aet-col-factor" v-if="inp.factor"><input class="aet-input aet-factor-input" v-model="inp.factor" /><small>{{ inp.factorUnit }}</small></span>
                          <span class="aet-col-factor aet-factor-none" v-else>—</span>
                        </template>
                      </div>
                    </div>
                  </div>
                  <!-- 输出区 -->
                  <div class="activity-io-section">
                    <div class="activity-io-label"><i class="el-icon-top"></i> 输出流</div>
                    <div class="aet-table">
                      <div class="aet-header">
                        <span class="aet-col-name" style="background:#f5f7fa">名称</span>
                        <span class="aet-col-val" style="background:#f5f7fa">活动数据</span>
                        <span class="aet-col-unit" style="background:#f5f7fa">单位</span>
                        <span class="aet-col-factor">排放因子</span>
                      </div>
                      <div v-for="out in proc.outputs" :key="out.name" class="aet-row aet-output-row is-clickable" @click="onActivityRowClick(out, proc, 'output')">
                        <span class="aet-col-name"><i v-if="out.verified" class="el-icon-circle-check aet-verified-icon"></i>{{ out.name }}</span>
                        <span class="aet-col-val"><input class="aet-input" v-model="out.value" /></span>
                        <span class="aet-col-unit">{{ out.unit }}</span>
                        <span class="aet-col-factor" v-if="out.factor"><input class="aet-input aet-factor-input" v-model="out.factor" /><small>{{ out.factorUnit }}</small></span>
                        <span class="aet-col-factor aet-factor-none" v-else>—</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 阶段八（碳足迹分析）高级选项卡面板 -->
          <div v-else-if="currentStepIndex === 7" class="parsing-section analysis-section">
            <div class="content-header">
              <div class="content-header-row">
                <i class="el-icon-data-line"></i>
                <span class="content-header-title">碳足迹数据分析中心</span>
                <span class="content-header-sub">高级统计学及因子拉动敏感度分析</span>
              </div>
            </div>

            <!-- 分页选项卡头部 -->
            <div class="analysis-tabs-header">
              <div :class="['tab-item', { active: analysisActiveTab === 'routine' }]" @click="analysisActiveTab = 'routine'">常规分析</div>
              <div :class="['tab-item', { active: analysisActiveTab === 'uncertainty' }]" @click="analysisActiveTab = 'uncertainty'">不确定性分析</div>
              <div :class="['tab-item', { active: analysisActiveTab === 'sensitivity' }]" @click="analysisActiveTab = 'sensitivity'">敏感度分析</div>
            </div>

            <!-- 页签内容容器 -->
            <div class="analysis-tab-content">
              <!-- 1. 常规分析 -->
              <div v-if="analysisActiveTab === 'routine'" class="tab-pane">
                <div class="kpi-grid-rich">
                  <div v-for="k in analysisProfile.kpis" :key="k.label" class="kpi-card-rich">
                    <span class="kpi-rich-label">{{ k.label }}</span>
                    <strong :class="['kpi-rich-val', k.cls]">{{ k.value }} <small v-if="k.unit">{{ k.unit }}</small> <small v-if="k.sub">{{ k.sub }}</small></strong>
                  </div>
                </div>

                <h5 class="chart-section-title">{{ analysisProfile.yoyTitle }}</h5>
                <div class="yoy-chart-container">
                  <div v-for="(row, idx) in analysisProfile.yoyRows" :key="idx" class="yoy-row">
                    <div class="yoy-row-header">
                      <span class="yoy-stage-name">{{ row.name }}</span>
                      <span :class="['yoy-stage-rate', row.rateCls]">{{ row.rateText }}</span>
                    </div>
                    <div class="yoy-bar-pair">
                      <div class="yoy-bar-item">
                        <span class="yoy-bar-label">本期</span>
                        <div class="yoy-bar-track"><div class="yoy-bar-fill curr-fill" :style="{ width: row.currWidth }"></div></div>
                        <span class="yoy-bar-val">{{ row.currText }}</span>
                      </div>
                      <div class="yoy-bar-item">
                        <span class="yoy-bar-label">上期</span>
                        <div class="yoy-bar-track"><div class="yoy-bar-fill base-fill" :style="{ width: row.prevWidth }"></div></div>
                        <span class="yoy-bar-val">{{ row.prevText }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <h5 class="chart-section-title" style="margin-top: 15px;">{{ analysisProfile.momTitle }}</h5>
                <div class="mom-list-container">
                  <div class="mom-table-header">
                    <span class="m-proc">单元过程名称</span>
                    <span class="m-change">环比波动</span>
                  </div>
                  <div v-for="(row, idx) in analysisProfile.momRows" :key="idx" class="mom-table-row">
                    <span class="m-proc">{{ row.proc }}</span>
                    <span :class="['m-change', row.cls]">{{ row.change }}</span>
                  </div>
                </div>

                <div class="analysis-conclusion" style="margin-top: 12px;">
                  <i class="el-icon-info"></i>
                  <span>{{ analysisProfile.conclusionText }}</span>
                </div>

                <!-- 电力因子口径对比（仅启用分时分区时显示）-->
                <div v-if="powerFactorCompare.show" class="ts-compare-card">
                  <div class="ts-cmp-header">
                    <i class="el-icon-s-data"></i>
                    <span>生产阶段电力因子口径对比</span>
                    <el-tag size="mini" type="success" effect="plain" style="margin-left: 8px;">已启用分时分区</el-tag>
                  </div>
                  <div class="ts-cmp-body">
                    <!-- 左右对比 -->
                    <div class="ts-cmp-pair">
                      <div class="ts-cmp-side">
                        <div class="ts-cmp-side-label">常规口径（区域电网年均）</div>
                        <div class="ts-cmp-side-value">{{ powerFactorCompare.normalEmission.toLocaleString() }}<span class="ts-cmp-unit">kgCO₂e</span></div>
                        <div class="ts-cmp-side-sub">占总碳足迹 {{ powerFactorCompare.normalShare }}%</div>
                      </div>
                      <div class="ts-cmp-arrow">
                        <i class="el-icon-right"></i>
                      </div>
                      <div class="ts-cmp-side ts-cmp-side-active">
                        <div class="ts-cmp-side-label">分时分区口径</div>
                        <div class="ts-cmp-side-value">{{ powerFactorCompare.tsEmission.toLocaleString() }}<span class="ts-cmp-unit">kgCO₂e</span></div>
                        <div class="ts-cmp-side-sub">占总碳足迹 {{ powerFactorCompare.tsShare }}%</div>
                      </div>
                    </div>

                    <!-- 差异汇总 -->
                    <div class="ts-cmp-summary">
                      <div class="ts-cmp-sum-item">
                        <span class="ts-cmp-sum-label">电力排放差</span>
                        <span class="ts-cmp-sum-val" :class="powerFactorCompare.emisDiff <= 0 ? 'ts-cmp-down' : 'ts-cmp-up'">
                          {{ powerFactorCompare.emisDiff <= 0 ? '↓' : '↑' }}
                          {{ Math.abs(powerFactorCompare.emisDiff).toLocaleString() }} kgCO₂e
                          （{{ powerFactorCompare.emisDiffPct > 0 ? '+' : '' }}{{ powerFactorCompare.emisDiffPct }}%）
                        </span>
                      </div>
                      <div class="ts-cmp-sum-item">
                        <span class="ts-cmp-sum-label">总碳足迹</span>
                        <span class="ts-cmp-sum-val">
                          {{ powerFactorCompare.normalTotal.toLocaleString() }} → {{ powerFactorCompare.tsTotal.toLocaleString() }}
                          <span :class="powerFactorCompare.totalDiffPct <= 0 ? 'ts-cmp-down' : 'ts-cmp-up'">
                            （{{ powerFactorCompare.totalDiffPct > 0 ? '+' : '' }}{{ powerFactorCompare.totalDiffPct }}%）
                          </span>
                        </span>
                      </div>
                      <div class="ts-cmp-sum-item">
                        <span class="ts-cmp-sum-label">电力排放因子偏差</span>
                        <span class="ts-cmp-sum-val" :class="factorDeltaPct <= 0 ? 'ts-cmp-down' : 'ts-cmp-up'">
                          {{ factorDeltaPct <= 0 ? '↓' : '↑' }} {{ Math.abs(factorDeltaPct).toFixed(1) }}%
                        </span>
                      </div>
                    </div>

                    <!-- 分工序明细 -->
                    <div class="ts-cmp-table" v-if="powerFactorCompare.rows.length">
                      <div class="ts-cmp-tr ts-cmp-th">
                        <span class="ts-cmp-td-name">单元过程</span>
                        <span class="ts-cmp-td-num">常规排放</span>
                        <span class="ts-cmp-td-num">分时排放</span>
                        <span class="ts-cmp-td-num">偏差</span>
                        <span class="ts-cmp-td-num">排放差(kgCO₂e)</span>
                      </div>
                      <div v-for="r in powerFactorCompare.rows" :key="r.proc" class="ts-cmp-tr">
                        <span class="ts-cmp-td-name">{{ r.proc }}</span>
                        <span class="ts-cmp-td-num">{{ r.normalEmission.toLocaleString() }}</span>
                        <span class="ts-cmp-td-num ts-cmp-ts-factor">{{ r.tsEmission.toLocaleString() }}</span>
                        <span class="ts-cmp-td-num" :class="r.diffPct <= 0 ? 'ts-cmp-down' : 'ts-cmp-up'">
                          {{ r.diffPct > 0 ? '+' : '' }}{{ r.diffPct }}%
                        </span>
                        <span class="ts-cmp-td-num" :class="r.diffEmis <= 0 ? 'ts-cmp-down' : 'ts-cmp-up'">
                          {{ r.diffEmis > 0 ? '+' : '' }}{{ r.diffEmis.toLocaleString() }}
                        </span>
                      </div>
                    </div>

                    <div class="ts-cmp-tip">
                      <i class="el-icon-info"></i>
                      分时分区因子按企业所在区域（{{ tsRegion() }}）逐小时取值，并依各工序用电时刻加权；差异主要来自区域电网结构与该区域日内发电波动。
                    </div>
                  </div>
                </div>
              </div>

              <!-- 2. 不确定性分析 -->
              <div v-else-if="analysisActiveTab === 'uncertainty'" class="tab-pane">
                <div class="kpi-grid-rich">
                  <div class="kpi-card-rich">
                    <span class="kpi-rich-label">随机模拟次数 (N)</span>
                    <strong class="kpi-rich-val" style="color: #e6a23c;">{{ uncertaintyParams.sampleSize.toLocaleString() }} <small>次</small></strong>
                  </div>
                  <div class="kpi-card-rich">
                    <span class="kpi-rich-label">不确定度范围</span>
                    <strong class="kpi-rich-val" style="color: #e6a23c;">{{ uncertaintyRangeText }}</strong>
                  </div>
                  <div class="kpi-card-rich">
                    <span class="kpi-rich-label">分布均值 (μ)</span>
                    <strong class="kpi-rich-val" style="color: #e6a23c;">{{ formatEmission(totalCarbonEmission) }} <small>kgCO₂e</small></strong>
                  </div>
                  <div class="kpi-card-rich">
                    <span class="kpi-rich-label">标准差 (σ)</span>
                    <strong class="kpi-rich-val" style="color: #e6a23c;">{{ Math.round(totalCarbonEmission * 0.0594).toLocaleString() }} <small>kgCO₂e</small></strong>
                  </div>
                </div>
                <div class="ci-badge-box">
                  <span class="ci-label">{{ uncertaintyParams.confidenceLevel }}% 置信区间</span>
                  <div class="ci-value">{{ confidenceIntervalText }} <small>kgCO₂e</small></div>
                </div>
                <h5 class="chart-section-title">蒙特卡洛频数分布拟合图 (Monte Carlo Histogram + Normal Fit)</h5>
                <div ref="analysisMonteCarloChart" class="analysis-chart-container"></div>

                <!-- 不确定性来源分解 -->
                <h5 class="chart-section-title" style="margin-top: 12px;">不确定性来源分解 (Uncertainty Sources Breakdown)</h5>
                <div class="unc-src-grid">
                  <div v-for="src in analysisProfile.uncSources" :key="src.name" :class="['unc-src-card', src.cls]">
                    <div class="unc-src-header">
                      <span class="unc-src-name">{{ src.name }}</span>
                      <span class="unc-src-badge" :class="src.cls === 'unc-high' ? 'high' : (src.cls === 'unc-med' ? 'med' : 'low')">{{ src.badge }}</span>
                    </div>
                    <div class="unc-src-body">
                      <span class="unc-src-pct">{{ src.pct }}</span>
                      <span class="unc-src-detail">{{ src.detail }}</span>
                    </div>
                  </div>
                </div>

                <!-- 不确定性分析优化建议 -->
                <div class="analysis-suggestion-box sug-unc">
                  <div class="sug-header">
                    <i class="el-icon-warning-outline"></i>
                    <span>不确定性分析优化建议</span>
                  </div>
                  <div class="sug-body">
                    <div v-for="(sug, idx) in analysisProfile.uncSugs" :key="idx" class="sug-item">
                      <span class="sug-num">{{ idx + 1 }}</span>
                      <div class="sug-content">
                        <strong>{{ sug.title }}</strong>
                        <p>{{ sug.text }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 3. 敏感度分析 -->
              <div v-else-if="analysisActiveTab === 'sensitivity'" class="tab-pane">
                <!-- 变动比例设置区 -->
                <div class="sens-ratio-panel">
                  <span class="sens-ratio-label">因子变动比例：</span>
                  <el-radio-group v-model="sensitivityRatio" size="mini" class="sens-ratio-group">
                    <el-radio-button :label="5">±5%</el-radio-button>
                    <el-radio-button :label="10">±10%</el-radio-button>
                    <el-radio-button :label="20">±20%</el-radio-button>
                    <el-radio-button :label="30">±30%</el-radio-button>
                  </el-radio-group>
                  <div class="sens-ratio-custom">
                    <span class="sens-ratio-custom-label">自定义：</span>
                    <el-input-number v-model="sensitivityRatio" :min="1" :max="50" :step="1" size="mini" controls-position="right" class="sens-ratio-input"></el-input-number>
                    <span class="sens-ratio-unit">%</span>
                  </div>
                </div>

                <h5 class="chart-section-title" style="margin-top: 10px;">关键因子碳足迹敏感度排序 (Tornado) — 变动 ±{{ sensitivityRatio }}%</h5>
                <div class="sensitivity-list">
                  <div v-for="item in sensitivityImpactData" :key="item.name" class="sens-row">
                    <div class="sens-meta">
                      <strong class="sens-name">{{ item.name }}</strong>
                      <span :class="['sens-direction', item.coeff >= 0 ? 'corr-positive' : 'corr-negative']">
                        {{ item.coeff >= 0 ? '正相关 🔴' : '负相关 🟢' }} · 敏感度 {{ item.coeff >= 0 ? '+' : '' }}{{ item.coeff }}
                      </span>
                    </div>
                    <div class="sens-bar-container">
                      <span class="sens-impact-text">{{ item.impactValue >= 0 ? '+' : '' }}{{ formatEmission(item.impactValue) }} kgCO₂e</span>
                      <div v-if="item.coeff >= 0" class="sens-bar-track">
                        <div class="sens-bar-fill fill-pos" :style="{ width: item.barWidth + '%' }"></div>
                      </div>
                      <div v-else class="sens-bar-track-neg">
                        <div class="sens-bar-fill fill-neg" :style="{ width: item.barWidth + '%' }"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 敏感性分析优化建议 -->
                <div class="analysis-suggestion-box sug-sens">
                  <div class="sug-header">
                    <i class="el-icon-warning-outline"></i>
                    <span>敏感性分析减排优先级与行动建议</span>
                  </div>
                  <div class="sug-body">
                    <div v-for="sug in analysisProfile.sensSugs" :key="sug.pri" :class="['sug-item', sug.cls]">
                      <span :class="['sug-num', sug.numCls]">{{ sug.pri }}</span>
                      <div class="sug-content">
                        <strong>{{ sug.title }}</strong>
                        <p>{{ sug.text }}</p>
                        <div class="sug-kpi-mini">
                          <span v-for="(k, ki) in sug.kpis" :key="ki">{{ k }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="sug-summary-row">
                      <span class="sug-summary-label">综合减排方向总结</span>
                      <span class="sug-summary-val">{{ analysisProfile.sensSummary }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- 阶段八闭合 end analysis-section -->

          <!-- 阶段九（碳足迹报告生成） -->
          <div v-else-if="currentStepIndex === 8 && reportViewMode === 'report'" class="parsing-section report-section">
            <div class="content-header">
              <div class="content-header-row">
                <i class="el-icon-document"></i>
                <span class="content-header-title">产品碳足迹核算报告</span>
                <span class="content-header-sub">{{ selectedStandard }}</span>
              </div>
            </div>

          <!-- ★ 第一章：评估目的与功能单位声明（封面卡片） -->
          <div class="report-section-card">
            <div class="section-card-header section-ch1">
              <span class="section-num">01</span>
              <div class="section-info">
                <strong>评估目的与功能单位声明</strong>
              </div>
            </div>
            <div class="report-cover">
              <strong class="cover-title">{{ reportProfile.coverTitle }}</strong>
            </div>
            <div class="report-meta-grid">
              <div class="meta-row"><span class="meta-lbl">评估产品</span><span class="meta-val">{{ reportProfile.product }}</span></div>
              <div class="meta-row"><span class="meta-lbl">规格型号</span><span class="meta-val">{{ reportProfile.model }}</span></div>
              <div class="meta-row"><span class="meta-lbl">核算标准</span><span class="meta-val">{{ selectedStandard }}</span></div>
              <div class="meta-row"><span class="meta-lbl">量化单位</span><span class="meta-val">{{ unitTypeLabel }} — {{ boundaryConfig.unitDetail }}</span></div>
              <div class="meta-row"><span class="meta-lbl">时间边界</span><span class="meta-val">{{ boundaryConfig.timeBoundary || '2024-01-01 - 2024-12-31' }}</span></div>
              <div class="meta-row"><span class="meta-lbl">电力因子精度</span><span class="meta-val">{{ elecFactorModeDesc }}</span></div>
            </div>
            <p class="section-desc">{{ reportProfile.lifeDesc }}</p>
          </div>

          <!-- ★ 第二章：系统边界与范围界定 -->
          <div class="report-section-card">
            <div class="section-card-header section-ch2">
              <span class="section-num">02</span>
              <div class="section-info">
                <strong>系统边界与范围界定</strong>
              </div>
            </div>
            <div class="report-meta-grid">
              <div class="meta-row"><span class="meta-lbl">量化边界</span><span class="meta-val">{{ lifecycleScopeLabel }}</span></div>
              <div class="meta-row"><span class="meta-lbl">分配规则</span><span class="meta-val">{{ allocationRuleLabel }}</span></div>
              <div class="meta-row"><span class="meta-lbl">取舍规则</span><span class="meta-val">{{ boundaryConfig.cutoffThreshold }}（单项&lt;{{ boundaryConfig.cutoffItemThreshold }}，累计≤{{ boundaryConfig.cutoffTotalThreshold }}）</span></div>
            </div>
            <p class="section-desc">{{ lifecycleScopeLabel }}，涵盖原材料获取阶段、生产制造阶段、运输分销阶段、产品使用阶段、报废回收阶段五大阶段，所有排放源计入或依取舍规则（单项 &lt; {{ boundaryConfig.cutoffItemThreshold }}、累计 ≤ {{ boundaryConfig.cutoffTotalThreshold }}）取舍。</p>
            <p v-if="elecFactorMode === 'timespace'" class="section-desc">
              生产制造阶段的外购市电排放采用<b>分时分区电碳因子</b>核算：按企业所在区域（{{ tsRegion() }}）逐小时取电网碳强度因子，并依各工序用电时刻加权计算；其余排放源采用常规因子库年均值。
            </p>
          </div>

          <!-- ★ 第三章：全生命周期排放清单 + 饼图+堆叠柱状图 -->
          <div class="report-section-card">
            <div class="section-card-header section-ch3">
              <span class="section-num">03</span>
              <div class="section-info">
                <strong>全生命周期清单排放与汇总</strong>
              </div>
            </div>
            <!-- 碳足迹总量（各阶段构成见下方饼图） -->
            <div class="report-total-card">
              <div class="total-main">
                <div class="total-label">全生命周期碳足迹总量</div>
                <div class="total-value-row">
                  <span class="total-number">{{ formatEmission(totalCarbonEmission) }}</span>
                  <span class="total-unit">kgCO₂e</span>
                </div>
              </div>
              <div v-if="isWindTask()" class="total-degree">
                <div class="total-degree-main">{{ reportProfile.degreeText }}</div>
                <div class="total-degree-sub">{{ reportProfile.degreeSubText }}</div>
              </div>
            </div>
            <!-- 饼图 -->
            <h5 class="chart-section-title" style="margin-top: 12px;">各阶段排放占比分布</h5>
            <div class="report-chart-row">
              <div class="report-chart-box">
                <div ref="reportPieChart" class="chart-container chart-container-pie"></div>
              </div>
            </div>
            <!-- 排放明细表 -->
            <div class="report-detail-table">
              <div class="detail-table-header">
                <span class="dt-col dt-stage">阶段</span>
                <span class="dt-col dt-process">单元过程</span>
                <span class="dt-col dt-emission">排放量 (kgCO₂e)</span>
                <span class="dt-col dt-pct">占比</span>
              </div>
              <div class="detail-table-body">
                <div v-for="row in reportDetailRows" :key="row.id" :class="['detail-row', row.rowClass]">
                  <span class="dt-col dt-stage" :title="row.stage">{{ row.stage }}</span>
                  <span class="dt-col dt-process" :title="row.process">{{ row.process }}</span>
                  <span class="dt-col dt-emission" :style="{ color: row.emission < 0 ? '#52c41a' : '#303133', fontWeight: row.isBold ? '700' : '400' }">{{ formatEmission(row.emission) }}</span>
                  <span class="dt-col dt-pct">{{ row.pct }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ★ 第四章：排放分配与取舍规则 -->
          <div class="report-section-card">
            <div class="section-card-header section-ch4">
              <span class="section-num">04</span>
              <div class="section-info">
                <strong>排放分配与取舍规则</strong>
              </div>
            </div>
            <div class="allocation-rules-grid">
              <div class="rule-card">
                <div class="rule-icon"><i class="el-icon-share"></i></div>
                <div class="rule-name">分配规则</div>
                <div class="rule-value">{{ allocationRuleLabel }}</div>
                <div class="rule-desc">{{ boundaryConfig.allocationRule === 'mass' ? '按产出质量比例分配多产出工艺的温室气体排放' : boundaryConfig.allocationRule === 'economic' ? '按产品经济价值比例分配' : '按产品含能量比例分配' }}</div>
              </div>
              <div class="rule-card">
                <div class="rule-icon"><i class="el-icon-scissors"></i></div>
                <div class="rule-name">取舍规则</div>
                <div class="rule-value">{{ boundaryConfig.cutoffThreshold }}</div>
                <div class="rule-desc">单项物料/单元过程排放贡献 &lt; 总碳足迹 {{ boundaryConfig.cutoffItemThreshold }} 可舍弃；所有舍弃项累计 ≤ 总排放 {{ boundaryConfig.cutoffTotalThreshold }}</div>
              </div>
              <div class="rule-card">
                <div class="rule-icon"><i class="el-icon-time"></i></div>
                <div class="rule-name">时间边界</div>
                <div class="rule-value">{{ boundaryConfig.timeBoundary || '2024-01-01 - 2024-12-31' }}</div>
                <div class="rule-desc">活动数据采集与排放因子引用的有效时间窗口</div>
              </div>
              <div class="rule-card">
                <div class="rule-icon"><i class="el-icon-location-outline"></i></div>
                <div class="rule-name">地理边界</div>
                <div class="rule-value">{{ tsRegion() }}</div>
                <div class="rule-desc">企业生产地所在省市；排放因子优先选用该省市数据，缺失时按「市级→省级→华北区域→全国」逐级回退并标注地理代表性扣分</div>
              </div>
            </div>
          </div>

          <!-- ★ 第五章：不确定性评价 + 置信区间图 -->
          <div class="report-section-card">
            <div class="section-card-header section-ch5">
              <span class="section-num">05</span>
              <div class="section-info">
                <strong>不确定性评价结论</strong>
              </div>
            </div>
            <h5 class="chart-section-title" style="margin-top: 10px;">蒙特卡洛模拟频数分布（N=10,000）</h5>
            <div ref="reportUncertaintyChart" class="chart-container-wide"></div>
            <div class="uncertainty-summary">
              <div class="us-item"><span class="us-lbl">模拟次数</span><span class="us-val">10,000 次</span></div>
              <div class="us-item"><span class="us-lbl">均值</span><span class="us-val">{{ formatEmission(totalCarbonEmission) }} kgCO₂e</span></div>
              <div class="us-item"><span class="us-lbl">95% CI</span><span class="us-val">{{ confidenceIntervalText }}</span></div>
              <div class="us-item"><span class="us-lbl">标准差</span><span class="us-val">{{ Math.round(totalCarbonEmission * 0.0594).toLocaleString() }} kgCO₂e</span></div>
              <div class="us-item"><span class="us-lbl">变异系数</span><span class="us-val">6.0%</span></div>
            </div>
            <div class="dqr-conclusion-box" style="margin-top: 10px;">
              <i class="el-icon-success" style="color: #52c41a;"></i>
              <span>{{ reportProfile.dqrConclusion }}</span>
            </div>
          </div>

          <!-- ★ 第六章：数据代表性DQR + 雷达图 -->
          <div class="report-section-card">
            <div class="section-card-header section-ch6">
              <span class="section-num">06</span>
              <div class="section-info">
                <strong>数据代表性与DQR评分</strong>
              </div>
            </div>
            <div ref="reportDqrChart" class="chart-container"></div>
            <div class="dqr-detail-table">
              <div class="dqr-detail-header">
                <span class="dqr-col dqr-dim">评价维度</span>
                <span class="dqr-col dqr-score">评分</span>
                <span class="dqr-col dqr-limit">限值</span>
                <span class="dqr-col dqr-status">达标</span>
                <span class="dqr-col dqr-note">说明</span>
              </div>
              <div class="dqr-detail-row">
                <span class="dqr-col dqr-dim">可靠性</span>
                <span class="dqr-col dqr-score" style="color: #52c41a; font-weight: 700;">1.5</span>
                <span class="dqr-col dqr-limit">≤3.0</span>
                <span class="dqr-col dqr-status"><i class="el-icon-success" style="color: #52c41a;"></i></span>
                <span class="dqr-col dqr-note">活动数据来源可靠，主要为实测台账与BOM清单</span>
              </div>
              <div class="dqr-detail-row">
                <span class="dqr-col dqr-dim">完整性</span>
                <span class="dqr-col dqr-score" style="color: #52c41a; font-weight: 700;">2.0</span>
                <span class="dqr-col dqr-limit">≤3.0</span>
                <span class="dqr-col dqr-status"><i class="el-icon-success" style="color: #52c41a;"></i></span>
                <span class="dqr-col dqr-note">排放源覆盖完整，个别辅料数据为估算值</span>
              </div>
              <div class="dqr-detail-row">
                <span class="dqr-col dqr-dim">时间相关性</span>
                <span class="dqr-col dqr-score" style="color: #faad14; font-weight: 700;">2.5</span>
                <span class="dqr-col dqr-limit">≤3.0</span>
                <span class="dqr-col dqr-status"><i class="el-icon-success" style="color: #52c41a;"></i></span>
                <span class="dqr-col dqr-note">部分排放因子引用2023年版本，时效性略有扣分</span>
              </div>
              <div class="dqr-detail-row">
                <span class="dqr-col dqr-dim">地理相关性</span>
                <span class="dqr-col dqr-score" style="color: #52c41a; font-weight: 700;">2.0</span>
                <span class="dqr-col dqr-limit">≤3.0</span>
                <span class="dqr-col dqr-status"><i class="el-icon-success" style="color: #52c41a;"></i></span>
                <span class="dqr-col dqr-note">优先采用中国本土数据库（CPCD），地理代表性良好</span>
              </div>
              <div class="dqr-detail-row">
                <span class="dqr-col dqr-dim">技术相关性</span>
                <span class="dqr-col dqr-score" style="color: #faad14; font-weight: 700;">2.5</span>
                <span class="dqr-col dqr-limit">≤3.0</span>
                <span class="dqr-col dqr-status"><i class="el-icon-success" style="color: #52c41a;"></i></span>
                <span class="dqr-col dqr-note">个别因子为行业平均值，未区分具体工艺路线</span>
              </div>
              <div class="dqr-detail-row dqr-total-row">
                <span class="dqr-col dqr-dim" style="font-weight: 700;">综合DQR</span>
                <span class="dqr-col dqr-score" style="color: #52c41a; font-weight: 700; font-size: 15px;">2.1</span>
                <span class="dqr-col dqr-limit">≤3.0</span>
                <span class="dqr-col dqr-status"><i class="el-icon-success" style="color: #52c41a;"></i></span>
                <span class="dqr-col dqr-note" style="font-weight: 600;">五大维度均优于限值，满足外部审计披露要求</span>
              </div>
            </div>
          </div>

          <!-- ★ 第七章：敏感性分析 + Tornado图 -->
          <div class="report-section-card">
            <div class="section-card-header section-ch7">
              <span class="section-num">07</span>
              <div class="section-info">
                <strong>敏感性分析与减排热点</strong>
              </div>
            </div>
            <div ref="reportTornadoChart" class="chart-container"></div>
            <p class="section-desc">{{ reportProfile.ch7Desc }}</p>
          </div>

          <!-- ★ 第八章：合规声明 -->
          <div class="report-section-card">
            <div class="section-card-header section-ch8">
              <span class="section-num">08</span>
              <div class="section-info">
                <strong>合规声明</strong>
              </div>
            </div>
            <div class="compliance-signature">
              <div class="signature-badge">
                <i class="el-icon-circle-check" style="color: #27ae60; font-size: 18px;"></i>
                <div class="signature-text">
                  <strong>合规声明</strong>
                  <p>{{ reportProfile.complianceText }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- ★ 免责声明 -->
          <div class="report-section-card disclaimer-card">
            <div class="section-card-header disclaimer-header">
              <i class="el-icon-warning-outline"></i>
              <div class="section-info">
                <strong>免责声明</strong>
              </div>
            </div>
            <div class="disclaimer-body">
              <ol class="disclaimer-list">
                <li><b>数据来源与准确性</b>：本报告所引用的活动数据及排放因子均来源于企业实测记录、行业标准数据库及公开发布的官方统计数据。系统已尽合理努力确保数据的准确性与完整性，但不对数据源的实时更新及潜在偏差承担保证责任。</li>
                <li><b>核算边界限制</b>：本报告遵循 {{ selectedStandard }} 规范设定核算边界，采用 {{ boundaryConfig.cutoffThreshold }} 取舍规则。被取舍的微量排放源（单项 < {{ boundaryConfig.cutoffItemThreshold }}）虽对总结果影响有限，但不代表其对特定环境影响类别无贡献。</li>
                <li><b>排放因子时效性</b>：排放因子数据引用截止日期为 {{ boundaryConfig.timeBoundary || '2024-01-01 - 2024-12-31' }}，因子版本更新可能导致数值差异。建议定期复核因子库版本，及时更新引用。<template v-if="elecFactorMode === 'timespace'">本项目生产制造阶段市电采用<b>分时分区电碳因子库（2025 版，小时级）</b>，因子按省市与时刻动态取值，与常规年度平均因子存在差异。</template></li>
                <li><b>不确定性声明</b>：蒙特卡洛模拟结果表明，在 {{ uncertaintyParams.confidenceLevel }}% 置信水平下，碳足迹总量的不确定度范围为 {{ confidenceIntervalText }} kgCO₂e。实际值可能在此区间内波动，决策时应考虑不确定度影响。</li>
                <li><b>适用范围</b>：本报告仅适用于 {{ boundaryConfig.unitDetail }} 核算单位的产品碳足迹声明，不可直接用于其他产品、其他区域或其他时间周期的碳排放比较。</li>
                <li><b>知识产权</b>：本报告内容受版权保护，未经书面授权不得复制、传播或用于商业用途。报告中的方法论及核算模型归核算方所有。</li>
                <li><b>专家复核</b>：本报告尚未经独立专家复核，若需用于正式披露或法规合规用途，建议委托具备资质的专家进行复核验证。</li>
              </ol>
              <div class="disclaimer-footer">
                <span class="disclaimer-date">报告生成日期：{{ new Date().toLocaleDateString('zh-CN') }}</span>
                <span class="disclaimer-version">核算引擎版本：ZCIP-CFP-Agent v1.0</span>
              </div>
            </div>
            <div class="report-actions-panel">
              <el-button type="success" size="small" :icon="isReportArchived ? 'el-icon-check' : 'el-icon-folder-checked'" @click="handleArchiveReport" :disabled="isReportArchived">
                {{ isReportArchived ? '已归档至企业碳资产库' : '报告存档' }}
              </el-button>
              <el-dropdown @command="handleExportReport" style="margin-left: 8px;">
                <el-button type="primary" size="small" icon="el-icon-download">
                  报告导出<i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="pdf"><i class="el-icon-document"></i> PDF</el-dropdown-item>
                  <el-dropdown-item command="word"><i class="el-icon-document-add"></i> Word</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
              <el-button size="small" icon="el-icon-s-check" plain @click="handleShareReport">专家复核</el-button>
              <el-button size="small" icon="el-icon-magic-wand" type="warning" plain @click="publishAsSOP" :disabled="isSopPublished">
                {{ isSopPublished ? '已发布为SOP' : '发布为SOP' }}
              </el-button>
            </div>
          </div>
        </div>

        <!-- 阶段9：数据溯源视图 -->
        <div v-else-if="currentStepIndex === 8 && reportViewMode === 'traceability'" class="parsing-section">
          <div class="content-header">
            <div class="content-header-row">
              <i class="el-icon-link"></i>
              <span class="content-header-title">数据溯源记录</span>
              <span class="content-header-sub">来源·版本·可信度追溯</span>
            </div>
          </div>
          <div class="trace-table-container">
            <div class="trace-table-header">
              <span class="trace-col trace-col-name">数据项</span>
              <span class="trace-col trace-col-stage">所属阶段</span>
              <span class="trace-col trace-col-source">数据来源</span>
              <span class="trace-col trace-col-version">版本/日期</span>
              <span class="trace-col trace-col-conf">可信度</span>
            </div>
            <div v-for="item in activeTraceabilityData" :key="item.id" class="trace-row">
              <span class="trace-col trace-col-name"><i :class="item.icon"></i> {{ item.name }}</span>
              <span class="trace-col trace-col-stage"><span class="trace-stage-tag">{{ item.stage }}</span></span>
              <span class="trace-col trace-col-source">{{ item.source }}</span>
              <span class="trace-col trace-col-version">{{ item.version }}</span>
              <span class="trace-col trace-col-conf"><span :class="['trace-conf-tag', 'conf-' + item.confLevel]">{{ item.confLabel }}</span><el-tooltip :content="item.confReason" placement="top" effect="dark"><i class="el-icon-question trace-conf-info"></i></el-tooltip></span>
            </div>
          </div>
          <div class="trace-summary-box">
            <i class="el-icon-info"></i>
            <span>数据溯源覆盖率 100%，高可信度数据占 85%，中等可信度占 15%。所有数据均可追溯到原始来源。</span>
          </div>
          <div style="text-align:center;margin-top:12px;">
            <el-button size="small" type="primary" plain @click="switchBackToReport"><i class="el-icon-back"></i> 返回报告</el-button>
          </div>
        </div>

        <!-- 阶段9：核查推荐视图 -->
        <div v-else-if="currentStepIndex === 8 && reportViewMode === 'verification'" class="parsing-section">
          <div class="content-header">
            <div class="content-header-row">
              <i class="el-icon-circle-check"></i>
              <span class="content-header-title">核查机构推荐</span>
              <span class="content-header-sub">第三方验证</span>
            </div>
          </div>
          <div class="verify-cards-grid">
            <div v-for="org in verificationOrgs" :key="org.id" class="verify-card">
              <div class="verify-card-header">
                <div class="verify-org-logo" :style="{ background: org.logoBg }">
                  <i :class="org.logoIcon" :style="{ color: org.logoColor }"></i>
                </div>
                <div class="verify-org-info">
                  <div class="verify-org-name">{{ org.name }}</div>
                  <div class="verify-org-eng">{{ org.engName }}</div>
                </div>
              </div>
              <div class="verify-card-body">
                <div class="verify-meta-row">
                  <span class="verify-meta-label"><i class="el-icon-location-outline"></i> 总部</span>
                  <span class="verify-meta-val">{{ org.location }}</span>
                </div>
                <div class="verify-meta-row">
                  <span class="verify-meta-label"><i class="el-icon-medal"></i> 认证资质</span>
                  <span class="verify-meta-val">{{ org.qualifications }}</span>
                </div>
                <div class="verify-meta-row">
                  <span class="verify-meta-label"><i class="el-icon-document-checked"></i> 核查范围</span>
                  <span class="verify-meta-val">{{ org.scope }}</span>
                </div>
                <div class="verify-meta-row">
                  <span class="verify-meta-label"><i class="el-icon-phone-outline"></i> 联系方式</span>
                  <span class="verify-meta-val">{{ org.contact }}</span>
                </div>
                <div class="verify-meta-row">
                  <span class="verify-meta-label"><i class="el-icon-star-off"></i> 行业口碑</span>
                  <span class="verify-meta-val">{{ org.rating }}</span>
                </div>
              </div>
              <div class="verify-card-footer">
                <el-tag size="mini" :type="org.accredited ? 'success' : 'warning'" effect="dark">{{ org.accredited ? 'ISO 认证机构' : '行业推荐' }}</el-tag>
                <span class="verify-price">参考费用：{{ org.priceRange }}</span>
              </div>
            </div>
          </div>
          <div class="verify-tip-box">
            <i class="el-icon-warning-outline"></i>
            <span>建议优先选择具备 ISO 14065 认证资质的核查机构，确保核查声明被国际认可。核查周期通常为 2-4 周，费用取决于产品复杂度与数据量。</span>
          </div>
          <div style="text-align:center;margin-top:12px;">
            <el-button size="small" type="primary" plain @click="switchBackToReport"><i class="el-icon-back"></i> 返回报告</el-button>
          </div>
        </div>

        <!-- 阶段 2+：展示工艺模型与因子绑定 -->
          <div v-else class="parsing-section">
            <div class="content-header" v-if="currentStepIndex !== 6">
              <div class="content-header-row">
                <i :class="phases[currentStepIndex] ? phases[currentStepIndex].icon : 'el-icon-s-grid'"></i>
                <span class="content-header-title">{{ phases[currentStepIndex] ? phases[currentStepIndex].name : '碳足迹核算模型' }}</span>
                <span class="content-header-sub" v-if="currentStepIndex >= 2">已构建</span>
              </div>
            </div>



            <!-- 阶段三：已构建的模型拓扑图（自动初始化） -->
            <div class="model-stage-groups">
              <!-- 阶段7：树形表格+最终计算结果 -->
              <template v-if="currentStepIndex === 6">
                <div class="parsing-section result-section" style="margin-bottom: 16px;">
                  <div class="content-header">
                    <div class="content-header-row">
                      <i class="el-icon-finished"></i>
                      <span class="content-header-title">碳足迹计算结果</span>
                      <span class="content-header-sub">全生命周期排放汇总</span>
                    </div>
                  </div>
                <div class="result-banner" style="margin-bottom: 12px;">
                  <span class="result-label">最终碳足迹计算结果</span>
                  <strong class="result-val">{{ formatEmission(totalCarbonEmission) }} <small>kgCO₂e</small></strong>
                  <el-button type="primary" size="mini" icon="el-icon-download" class="export-btn" @click="exportCalculationData">导出核算数据</el-button>
                </div>
                
                <!-- 树形表格 -->
                <div class="emission-tree-table">
                  <div class="tree-table-header">
                    <span class="col-name">名称</span>
                    <span class="col-activity">活动数据</span>
                    <span class="col-factor">排放因子</span>
                    <span class="col-val">排放量 (kgCO₂e)</span>
                  </div>
                  <div class="tree-table-body">
                    <div v-for="stage in emissionTreeData" :key="stage.id" class="tree-row stage-row" @click="toggleNode(stage.id)">
                      <div class="row-content">
                        <span class="row-arrow" :class="{ 'is-expanded': isNodeExpanded(stage.id) }">▶</span>
                        <span class="row-name"><i class="el-icon-folder"></i> {{ stage.name }}</span>
                        <span class="row-activity">—</span>
                        <span class="row-factor">—</span>
                        <span class="row-val">{{ formatEmission(stage.emission) }}</span>
                      </div>
                      
                      <el-collapse-transition>
                        <div v-show="isNodeExpanded(stage.id)" class="tree-children">
                          <div v-for="proc in stage.children" :key="proc.id" class="tree-row proc-row" @click.stop="toggleNode(proc.id)">
                            <div class="row-content">
                              <span class="row-arrow" :class="{ 'is-expanded': isNodeExpanded(proc.id) }">▶</span>
                              <span class="row-name"><i class="el-icon-cpu"></i> {{ proc.name }}</span>
                              <span class="row-activity">—</span>
                              <span class="row-factor">—</span>
                              <span class="row-val">{{ formatEmission(proc.emission) }}</span>
                            </div>
                            
                            <el-collapse-transition>
                              <div v-show="isNodeExpanded(proc.id)" class="tree-children">
                                <div v-for="item in proc.children" :key="item.id" class="tree-row item-row">
                                  <div class="row-content">
                                    <span class="row-indent"></span>
                                    <span class="row-name"><i class="el-icon-document-copy"></i> {{ item.name }}</span>
                                    <span class="row-activity">{{ item.activityData }}</span>
                                    <span :class="['row-factor', item.factor === '—' ? 'row-factor-none' : '']">
                                      {{ item.factor }}
                                      <el-tag v-if="item.factorTs" size="mini" type="success" effect="plain" class="ts-factor-tag">分时</el-tag>
                                    </span>
                                    <span class="row-val">{{ formatEmission(item.emission) }}</span>
                                  </div>
                                  <div class="item-percent-bar" :style="{ width: getItemPercentWidth(item.emission), backgroundColor: item.emission < 0 ? '#52c41a' : '#0067FE' }"></div>
                                </div>
                              </div>
                            </el-collapse-transition>
                          </div>
                        </div>
                      </el-collapse-transition>
                    </div>
                  </div>
                </div>
                </div>
              </template>

              <!-- 阶段3：行内编辑模式 -->
              <template v-else-if="currentStepIndex === 2">
                <div v-for="(group, gi) in modelStages" :key="group.key" class="model-group">
                  <div class="model-group-header">
                    <span :class="['stage-dot', group.dotClass]"></span>
                    <span class="model-group-name">{{ group.title }}</span>
                    <el-tag size="mini" type="success">{{ group.processes.length }} 个单元过程</el-tag>
                  </div>
                  <div class="process-table editable">
                    <!-- 列标题 -->
                    <div class="process-row process-header-row">
                      <div class="process-col input-col"><span class="col-header-text">输入流</span></div>
                      <div class="process-col center-col"><span class="col-header-text">单元过程</span></div>
                      <div class="process-col output-col"><span class="col-header-text">输出流</span></div>
                    </div>
                    <!-- 循环单元过程 -->
                    <div v-for="(proc, pi) in group.processes" :key="proc.name + '-' + pi" class="process-row editable-row" :class="{ 'proc-highlight': highlightProc && highlightProc.gi === gi && highlightProc.pi === pi }">
                      <!-- 左列：输入（可编辑，仅名称） -->
                      <div class="process-col input-col">
                        <div v-for="(inp, ii) in proc.inputs" :key="ii" class="io-item input-item">
                          <div class="io-bubble editable-bubble">
                            <el-input v-model="inp.name" size="mini" class="io-edit-name" placeholder="输入流名称"></el-input>
                            <el-select v-model="inp.listType" size="mini" class="io-edit-listtype" placeholder="类型">
                              <el-option v-for="opt in inputTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value"></el-option>
                            </el-select>
                            <i class="el-icon-close io-del-btn" @click="removeIO(proc, 'inputs', ii)"></i>
                          </div>
                        </div>
                        <div class="io-add-row">
                          <el-button size="mini" type="text" icon="el-icon-plus" @click="addIO(proc, 'inputs')">添加输入</el-button>
                        </div>
                      </div>
                      <!-- 中列：单元过程（可编辑名称+分配规则+删除） -->
                      <div class="process-col center-col">
                        <div class="proc-card">
                          <div class="proc-card-arrow left">→</div>
                          <div class="proc-card-body" :class="{ 'proc-card-deviated': proc.allocation && proc.allocation !== 'mass' }">
                            <el-input v-model="proc.name" size="mini" class="proc-name-edit" placeholder="过程名称"></el-input>
                            <el-select v-model="proc.allocation" size="mini" class="proc-allocation-select" placeholder="分配规则" @change="onProcAllocationChange(proc)">
                              <el-option label="质量分配" value="mass"></el-option>
                              <el-option label="经济分配" value="economic"></el-option>
                              <el-option label="能源分配" value="energy"></el-option>
                            </el-select>
                            <!-- 分配规则非质量分配时，显示备注输入框 -->
                            <div v-if="proc.allocation && proc.allocation !== 'mass'" class="proc-allocation-remark">
                              <i class="el-icon-warning-outline"></i>
                              <el-input v-model="proc.allocationRemark" size="mini" placeholder="说明非质量分配的原因" class="proc-remark-input"></el-input>
                            </div>
                          </div>
                          <div class="proc-card-arrow right">→</div>
                        </div>
                        <el-button size="mini" type="text" class="proc-del-btn" icon="el-icon-delete" @click="removeProcess(gi, pi)">删除</el-button>
                      </div>
                      <!-- 右列：输出（可编辑，仅名称） -->
                      <div class="process-col output-col">
                        <div v-for="(out, oi) in proc.outputs" :key="oi" class="io-item output-item">
                          <div class="io-bubble editable-bubble">
                            <el-input v-model="out.name" size="mini" class="io-edit-name" placeholder="输出流名称"></el-input>
                            <el-select v-model="out.listType" size="mini" class="io-edit-listtype" placeholder="类型" @change="onOutputTypeChange(out)">
                              <el-option v-for="opt in outputTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value"></el-option>
                            </el-select>
                            <i class="el-icon-close io-del-btn" @click="removeIO(proc, 'outputs', oi)"></i>
                          </div>
                        </div>
                        <div class="io-add-row">
                          <el-button size="mini" type="text" icon="el-icon-plus" @click="addIO(proc, 'outputs')">添加输出</el-button>
                        </div>
                      </div>
                    </div>
                    <!-- 新增单元过程按钮 -->
                    <div class="proc-add-row">
                      <el-tooltip :content="`在「${group.title}」下新增一个单元过程`" placement="top" effect="dark">
                        <button type="button" class="proc-add-btn" @click="addProcess(gi)">
                          <i class="el-icon-plus"></i>
                          <span>新增单元过程</span>
                        </button>
                      </el-tooltip>
                    </div>
                  </div>
                </div>
              </template>
              <!-- 其他阶段：只读展示模式 -->
              <template v-else>
                <div v-for="group in modelStages" :key="group.key" class="model-group">
                  <div class="model-group-header">
                    <span :class="['stage-dot', group.dotClass]"></span>
                    <span class="model-group-name">{{ group.title }}</span>
                    <el-tag size="mini" type="success">{{ group.processes.length }} 个单元过程</el-tag>
                  </div>
                  <div class="process-table">
                    <!-- 列标题 -->
                    <div class="process-row process-header-row">
                      <div class="process-col input-col"><span class="col-header-text">输入物质/能源</span></div>
                      <div class="process-col center-col"><span class="col-header-text">单元过程</span></div>
                      <div class="process-col output-col"><span class="col-header-text">输出物质/能源</span></div>
                    </div>
                    <!-- 循环单元过程 -->
                    <div v-for="proc in group.processes" :key="proc.name" class="process-row">
                      <!-- 左列：输入 -->
                      <div class="process-col input-col">
                        <div v-for="inp in proc.inputs" :key="inp.name" class="io-item input-item">
                          <div :class="['io-bubble', { 'emission-bubble': currentStepIndex === 6, 'product-flow-bubble': inp.flowType === 'product', 'byproduct-bubble': inp.productSubType === 'by_product', 'ts-bubble': currentStepIndex >= 3 && currentStepIndex <= 5 && isTsElec(inp, group) }]" :title="currentStepIndex >= 3 ? (currentStepIndex === 6 ? `${inp.name}: ${getEmissionValue(proc.name, inp.name, true)} kgCO₂e` : `${inp.name}: ${inp.value}${inp.unit}`) : inp.name">
                            <span class="io-name">{{ inp.name }}</span>
                            <span class="io-type-tag" v-if="inp.listType" :style="{ color: getListTypeColor(inp.listType), borderColor: getListTypeColor(inp.listType) }">{{ getListTypeLabel(inp.listType) }}</span>
                            <span class="io-val" v-if="currentStepIndex >= 3">
                              <!-- 分时分区模式：市电查看详情按钮（阶段4/5/6）-->
                              <template v-if="currentStepIndex >= 3 && currentStepIndex <= 5 && isTsElec(inp, group)">
                                <el-button type="text" size="mini" icon="el-icon-view" class="ts-view-btn" @click.stop="openTsDetail(inp, proc.name)">查看详情</el-button>
                              </template>
                              <span v-else-if="currentStepIndex === 6">{{ getEmissionValue(proc.name, inp.name, true) }}<small> kgCO₂e</small></span>
                              <span v-else-if="currentStepIndex === 2">{{ inp.unit ? '（' + inp.unit + '）' : '' }}</span>
                              <span v-else>{{ inp.value }}<small>{{ inp.unit }}</small></span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <!-- 中列：单元过程 -->
                      <div class="process-col center-col">
                        <div class="proc-card">
                          <div class="proc-card-arrow left">→</div>
                          <div class="proc-card-body readonly">
                            <div class="node-box" :title="proc.name">{{ proc.name }}</div>
                            <div class="node-allocation-tag">
                              <i class="el-icon-share"></i> {{ getAllocationLabel(proc.allocation) }}
                            </div>
                            <!-- 非质量分配的备注说明 -->
                            <div v-if="proc.allocationRemark" class="node-allocation-remark" :title="proc.allocationRemark">
                              <i class="el-icon-warning-outline"></i> {{ proc.allocationRemark }}
                            </div>
                            <!-- 阶段四及以后显示已绑定因子 -->
                            <div class="node-factor-tag" v-if="currentStepIndex >= 3 && countProcFactors(proc) > 0">
                              <i class="el-icon-link"></i> {{ countProcFactors(proc) }}个因子
                            </div>
                          </div>
                          <div class="proc-card-arrow right">→</div>
                        </div>
                      </div>
                      <!-- 右列：输出 -->
                      <div class="process-col output-col">
                        <div v-for="out in proc.outputs" :key="out.name" class="io-item output-item">
                          <div :class="['io-bubble', { 'emission-bubble': currentStepIndex === 6, 'product-flow-bubble': out.flowType === 'product', 'byproduct-bubble': out.productSubType === 'by_product' }]" :title="currentStepIndex >= 3 ? (currentStepIndex === 6 ? `${out.name}: ${getEmissionValue(proc.name, out.name, false)} kgCO₂e` : `${out.name}: ${out.value}${out.unit}`) : out.name">
                            <span class="io-name">{{ out.name }}</span>
                            <span class="io-type-tag" v-if="out.listType" :style="{ color: getListTypeColor(out.listType), borderColor: getListTypeColor(out.listType) }">{{ getListTypeLabel(out.listType) }}</span>
                            <span class="io-val" v-if="currentStepIndex >= 3">
                              <span v-if="currentStepIndex === 6">{{ getEmissionValue(proc.name, out.name, false) }}<small> kgCO₂e</small></span>
                              <span v-else>{{ out.value }}<small>{{ out.unit }}</small></span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- 统一悬浮确认栏（阶段1~7） -->
          <div v-if="stageConfirmConfig" class="stage-confirm-bar">
            <span class="stage-confirm-hint"><i class="el-icon-info"></i> {{ stageConfirmConfig.hint }}</span>
            <el-button type="primary" size="small" :icon="stageConfirmConfig.icon" :disabled="isTyping" @click="stageConfirmConfig.action">{{ stageConfirmConfig.label }}</el-button>
          </div>
        </div>
        <!-- sidebar-lower闭合 -->
      </aside>
    </div>
    </div><!-- task-active-mode 闭合 -->

    <!-- 因子库选择对话框 -->

    <!-- 分时分区市电活动数据详情弹窗 -->
    <!-- 说明：powerFactorCompare 由 computed 提供 -->
    <el-dialog
      :title="`市电分时活动数据 · ${tsDetailProc}`"
      :visible.sync="tsDetailVisible"
      width="820px"
      top="6vh"
      :close-on-click-modal="false"
      custom-class="ts-dialog">
      <div v-if="tsDetailData" class="ts-dlg">
        <!-- 顶部概要 -->
        <div class="ts-dlg-summary">
          <div class="ts-dlg-sum-item">
            <div class="ts-dlg-sum-label">核算期</div>
            <div class="ts-dlg-sum-val ts-dlg-sm">{{ tsPeriod().start }} ~ {{ tsPeriod().end }}</div>
          </div>
          <div class="ts-dlg-sum-item">
            <div class="ts-dlg-sum-label">核算期总电量</div>
            <div class="ts-dlg-sum-val">{{ (Number(tsDetailItem.value) || 0).toLocaleString() }}<span class="ts-dlg-unit">kWh</span></div>
          </div>
          <div class="ts-dlg-sum-item">
            <div class="ts-dlg-sum-label">区域</div>
            <div class="ts-dlg-sum-val ts-dlg-sm">{{ tsRegion() }}</div>
          </div>
          <div class="ts-dlg-sum-item">
            <div class="ts-dlg-sum-label">核算期天数</div>
            <div class="ts-dlg-sum-val">{{ tsDaysCount() }}<span class="ts-dlg-unit">天</span></div>
          </div>
        </div>

        <!-- 日期跳转 + 当日用电 -->
        <div class="ts-dlg-datebar">
          <span class="ts-dlg-datebar-label">选择日期</span>
          <el-button size="mini" icon="el-icon-arrow-left" @click="tsPrevDay">前一天</el-button>
          <el-date-picker
            v-model="tsDetailDate"
            type="date"
            size="mini"
            value-format="yyyy-MM-dd"
            :picker-options="{
              disabledDate(time) {
                return false
              }
            }"
            style="width: 150px;"
            @change="onTsDateChange">
          </el-date-picker>
          <el-button size="mini" @click="tsNextDay">后一天<i class="el-icon-arrow-right el-icon--right"></i></el-button>
          <span class="ts-dlg-weekday">{{ weekdayOf(tsDetailDate) }}</span>
          <span class="ts-dlg-daybar-kwh">
            当日用电 <b>{{ tsDetailData.dayKwh.toLocaleString() }}</b> kWh
          </span>
        </div>

        <!-- ===== 24 小时明细表（时段 / 用电量 / 排放因子 / 数据来源）===== -->
        <div class="ts-dlg-table-wrap">
          <table class="ts-dlg-table">
            <thead>
              <tr>
                <th style="width: 140px;">时段</th>
                <th style="width: 140px;">用电量(kWh)</th>
                <th style="width: 160px;">排放因子(kgCO₂e/kWh)</th>
                <th>数据来源</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in tsDetailData.rows" :key="r.hour" :class="{ 'ts-dlg-row-stopped': r.stopped }">
                <td class="ts-dlg-td-hour">{{ r.hourLabel }}</td>
                <td class="ts-dlg-td-num">
                  <el-input
                    size="mini"
                    class="ts-dlg-kwh-input"
                    :value="r.kwh"
                    @change="onTsHourKwhChange(r, $event)">
                  </el-input>
                </td>
                <td class="ts-dlg-td-num">{{ r.factor ? r.factor.toFixed(4) : '—' }}</td>
                <td class="ts-dlg-td-src">{{ r.dataSource }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 佐证材料 -->
        <div class="ts-dlg-evidence">
          <div class="ts-ev-header">
            <span class="ts-ev-title">
              <i class="el-icon-paperclip"></i> 佐证材料
              <span class="ts-ev-count">（{{ tsEvidenceOf(tsDetailProc).length }}）</span>
            </span>
            <el-button size="mini" type="primary" plain icon="el-icon-upload2" @click="uploadTsEvidence">上传佐证材料</el-button>
          </div>
          <div v-if="tsEvidenceOf(tsDetailProc).length" class="ts-ev-list">
            <div v-for="(ev, i) in tsEvidenceOf(tsDetailProc)" :key="i" class="ts-ev-item ts-ev-item-block">
              <div class="ts-ev-row-main">
                <i class="ts-ev-icon" :class="ev.icon || 'el-icon-document'"></i>
                <div class="ts-ev-info">
                  <div class="ts-ev-name" :title="ev.name">{{ ev.name }}</div>
                  <div class="ts-ev-meta">{{ ev.desc }}</div>
                </div>
                <el-tag size="mini" :type="ev.status === 'verified' ? 'success' : 'warning'" effect="plain">
                  {{ ev.status === 'verified' ? '已验证' : '待审核' }}
                </el-tag>
                <el-button type="text" size="mini" @click="viewTsEvidence(ev)">查看</el-button>
                <el-button type="text" size="mini" class="ts-ev-del" @click="removeTsEvidence(i)">删除</el-button>
              </div>
              <!-- OCR 模拟识别结果 -->
              <div v-if="ev.ocr" class="ts-ev-ocr">
                <el-tag size="mini" :type="ev.ocr.status === 'done' ? 'success' : 'info'" effect="plain">
                  <i :class="ev.ocr.status === 'done' ? 'el-icon-circle-check' : 'el-icon-loading'"></i>
                  {{ ev.ocr.status === 'done' ? '识别完成' : '识别中' }}
                </el-tag>
                <span v-if="ev.ocr.status === 'done'" class="ts-ev-ocr-text">{{ ev.ocr.summary }}</span>
                <span v-if="ev.ocr.status === 'done'" class="ts-ev-ocr-conf">置信度 {{ ev.ocr.confidence }}%</span>
                <el-button
                  v-if="ev.ocr.status === 'done' && !ev.ocr.applied"
                  type="text" size="mini" class="ts-ev-ocr-apply"
                  @click="applyOcrResult(ev)">应用识别结果</el-button>
                <el-tag v-if="ev.ocr.applied" size="mini" type="success" effect="dark">已应用</el-tag>
              </div>
            </div>
          </div>
          <div v-else class="ts-ev-empty">
            <i class="el-icon-folder-opened"></i>
            暂无佐证材料。建议上传电表读数记录、电力交易账单等，以证明分时电量数据来源。
          </div>
        </div>

        <!-- 修改记录 -->
        <div class="ts-dlg-audit">
          <div class="ts-audit-header" @click="tsAuditExpanded = !tsAuditExpanded">
            <span class="ts-audit-title">
              <i class="el-icon-time"></i> 修改记录
              <span class="ts-audit-count">（{{ tsAuditLogOf(tsDetailProc).length }}）</span>
            </span>
            <i :class="tsAuditExpanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" class="ts-audit-toggle"></i>
          </div>
          <div v-if="tsAuditExpanded" class="ts-audit-body">
            <div v-if="!tsAuditLogOf(tsDetailProc).length" class="ts-audit-empty">
              <i class="el-icon-info"></i> 暂无修改记录
            </div>
            <div v-else class="ts-audit-list">
              <div v-for="(log, i) in tsAuditLogOf(tsDetailProc)" :key="i" class="ts-audit-item">
                <span class="ts-audit-dot"></span>
                <div class="ts-audit-main">
                  <div class="ts-audit-line">
                    <b>{{ log.time }}</b>
                    <span class="ts-audit-user">{{ log.user }}</span>
                    <span class="ts-audit-hour">{{ log.hourLabel }}</span>
                  </div>
                  <div class="ts-audit-detail">
                    用电量 <span class="ts-audit-old">{{ log.oldVal }}</span>
                    <i class="el-icon-right"></i>
                    <span class="ts-audit-new">{{ log.newVal }}</span> kWh
                    <span v-if="log.reason" class="ts-audit-reason">· {{ log.reason }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="ts-dlg-foot-tip">
          <i class="el-icon-info"></i>
          电碳因子按企业所在区域（{{ tsRegion() }}）从分时分区电碳因子库逐小时取值，随发电结构日内波动而变化；
          停产时段电量为 0 但仍保留记录。
        </div>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="tsDetailVisible = false">关闭</el-button>
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
    />
  </div>
</template>

<script>
import AgentIcon from '@/pages/zcip/common/AgentIcon.vue'
import OnboardingGuide from '../../agent-center/components/OnboardingGuide.vue'
import agentCoreMixin from './agentCoreMixin'
import agentChatMixin from './agentChatMixin'
import { isTimespaceElec, buildDayDetail, daysBetween, calcPeriodWeightedFactor } from '@/utils/timespaceElec'
import { normalizeRegion } from '@/utils/regionDict'

export default {
  name: 'CarbonFootprintAgent',
  components: { AgentIcon, OnboardingGuide },
  mixins: [agentCoreMixin, agentChatMixin],
  data() {
    return {
      showOnboarding: false,
      activeActivityRow: null,  // 数据清单当前选中行（对话联动）
      selectedFactorLibs: [],
      // 分时分区：市电活动数据详情弹窗
      tsDetailVisible: false,
      tsDetailProc: '',
      tsDetailItem: null,
      tsDetailDate: '',
      tsDetailData: null,
      // 分时加权因子缓存（避免重复计算）
      tsWeightedCache: {},
      // 分时电量佐证材料（按工序名索引）
      tsEvidenceMap: {},
      // 分时电量修改记录（按工序名索引）
      tsAuditMap: {},
      // 修改记录面板展开态
      tsAuditExpanded: false,
      onboardingStep: 0,
      onboardingSteps: [
        {
          icon: 'el-icon-data-analysis',
          title: '欢迎使用产品碳足迹核算智能体',
          text: '这里是产品碳足迹核算工作空间。基于LCA生命周期方法，为您提供九阶段智能核算服务，涵盖目标与范围界定、清单分析、影响评价、结果解读全流程。',
          features: [
            { icon: 'el-icon-s-data', title: '九阶段流程', desc: '目标界定→清单分析→影响评价→结果解读', color: '#0067FE' },
            { icon: 'el-icon-connection', title: '因子匹配', desc: '排放因子库自动匹配，支持自定义替换', color: '#0067FE' },
            { icon: 'el-icon-share', title: '全链溯源', desc: '结果→公式→参数→来源→凭证逐级可溯', color: '#ED7B2F' }
          ],
          tip: '首次使用建议依次浏览全部引导内容，约需1分钟。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-chat-dot-round',
          title: '智能对话区',
          text: '页面中间为对话区，直接向小易提问或下达指令。输入产品名称即可开始核算，小易会引导您完成九阶段流程。',
          features: [
            { icon: 'el-icon-video-play', title: '快速开始', desc: '输入产品名称即可创建核算任务', color: '#0067FE' },
            { icon: 'el-icon-magic-stick', title: '智能问答', desc: '核算方法、因子来源即问即答', color: '#0067FE' },
            { icon: 'el-icon-s-opportunity', title: '常用指令', desc: '点击灯泡图标呼出指令面板', color: '#ED7B2F' }
          ],
          tip: '试试输入产品名称开始一次碳足迹核算。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-chat-line-square',
          title: '历史对话栏',
          text: '页面左侧为历史对话栏，点击可展开查看历史对话记录，支持新建、切换和删除对话。',
          features: [
            { icon: 'el-icon-folder-opened', title: '对话记录', desc: '自动保存每次对话，按时间倒序排列', color: '#0067FE' },
            { icon: 'el-icon-plus', title: '新建对话', desc: '点击「新建」开启全新对话', color: '#0067FE' },
            { icon: 'el-icon-d-arrow-left', title: '可收缩', desc: '点击边条可展开/收缩历史栏', color: '#909399' }
          ],
          tip: '窄屏下历史栏自动隐藏。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-folder-opened',
          title: '核算任务列表',
          text: '页面右侧为核算任务列表，展示所有已创建的产品碳足迹核算任务。点击任务卡片即可继续推进九阶段核算流程。',
          features: [
            { icon: 'el-icon-aim', title: '进度跟踪', desc: '实时显示每个任务的当前阶段和进度', color: '#0067FE' },
            { icon: 'el-icon-right', title: '一键进入', desc: '点击卡片即可继续推进核算', color: '#0067FE' },
            { icon: 'el-icon-delete', title: '任务管理', desc: '支持删除已完成的核算任务', color: '#F56C6C' }
          ],
          tip: '进入任务后，右侧将切换为九阶段进度面板。',
          iconStyle: {}
        }
      ]
    }
  },
  created() {
    this.initSelectedFactorLibs()
    this.ensureStandardValid()
  },
  computed: {
    /** 阶段8：电力因子口径对比 */
    powerFactorCompare() {
      return this.buildPowerFactorCompare()
    },
    /** 阶段9：电力因子精度描述（报告元信息） */
    elecFactorModeDesc() {
      if (this.elecFactorMode === 'timespace') {
        return `分时分区（${this.tsRegion()} × 小时级）`
      }
      return '常规（区域电网年均）'
    },
    /** 阶段8：电力排放因子偏差比例（分时 vs 常规，仅显示百分比不显示因子值） */
    factorDeltaPct() {
      const c = this.powerFactorCompare
      if (!c || !c.show) return 0
      const nf = parseFloat(c.normalFactor) || 0
      const tf = parseFloat(c.tsFactor) || 0
      if (nf <= 0) return 0
      return Math.round(((tf - nf) / nf) * 1000) / 10
    }
  },
  methods: {
    // ===== 分时分区电碳因子（仅生产阶段市电）=====
    /** 该输入流是否适用分时分区因子 */
    isTsElec(inp, stage) {
      return this.elecFactorMode === 'timespace' && isTimespaceElec(inp, stage)
    },
    /** 核算期起止日期 */
    tsPeriod() {
      const tb = this.boundaryConfig && this.boundaryConfig.timeBoundary
      if (tb) {
        const parts = tb.split(' - ')
        if (parts.length === 2) return { start: parts[0], end: parts[1] }
      }
      return { start: '2024-01-01', end: '2024-12-31' }
    },
    /** 核算期天数 */
    tsDaysCount() {
      const p = this.tsPeriod()
      return daysBetween(p.start, p.end)
    },
    /** 任务区域（企业所在省市） */
    tsRegion() {
      return (this.boundaryConfig && this.boundaryConfig.region) || '北京'
    },
    /**
     * 分时分区库是否覆盖企业所在省市
     * 逻辑：读取因子库 localStorage → 找到分时分区库 → 判断其 records 中是否有该区域的因子
     * 有 → 显示「电力因子精度」选项；无 → 不显示
     */
    hasTimespaceFactorForRegion() {
      const regionName = this.tsRegion()
      if (!regionName) return false
      try {
        const raw = localStorage.getItem('cfp_factor_databases_v5')
        if (!raw) {
          // 无持久化数据时，按默认演示数据判断（仅北京有）
          return normalizeRegion(regionName) !== null && this.defaultTsRegionHasData(regionName)
        }
        const dbs = JSON.parse(raw)
        const tsDb = (dbs || []).find(d => d && d.id === 'elec-ts')
        if (!tsDb || !Array.isArray(tsDb.records) || !tsDb.records.length) {
          return this.defaultTsRegionHasData(regionName)
        }
        const region = normalizeRegion(regionName)
        if (!region) return false
        // 直接命中该区域
        if (tsDb.records.some(r => r.regionCode === region.code)) return true
        // 市级 → 回退其父级省级
        if (region.level === 'city' && region.parentCode) {
          if (tsDb.records.some(r => r.regionCode === region.parentCode)) return true
        }
        return false
      } catch (e) {
        return this.defaultTsRegionHasData(regionName)
      }
    },
    /**
     * 阶段8：电力因子口径对比数据
     */
    buildPowerFactorCompare() {
      const empty = {
        show: false, rows: [],
        normalEmission: 0, tsEmission: 0,
        normalShare: 0, tsShare: 0,
        emisDiff: 0, emisDiffPct: 0,
        normalTotal: 0, tsTotal: 0, totalDiffPct: 0,
        normalFactor: 0, tsFactor: 0
      }
      if (this.elecFactorMode !== 'timespace') return empty

      const rows = []
      let normalEmission = 0
      let tsEmission = 0

      ;(this.modelStages || []).forEach(stage => {
        (stage.processes || []).forEach(proc => {
          const elec = (proc.inputs || []).filter(i => this.isTsElecItem(i, stage))
          if (!elec.length) return
          let procNormal = 0
          let procTs = 0
          elec.forEach(i => {
            const val = parseFloat(i.value) || 0
            const nf = parseFloat(i.factor) || 0
            const tf = this.tsWeightedFactorOf(proc.name) || nf
            procNormal += val * nf
            procTs += val * tf
          })
          normalEmission += procNormal
          tsEmission += procTs
          const nfAvg = elec.length === 1 ? (parseFloat(elec[0].factor) || 0) : 0
          const tfAvg = this.tsWeightedFactorOf(proc.name) || nfAvg
          rows.push({
            proc: proc.name,
            normalEmission: Math.round(procNormal),
            tsEmission: Math.round(procTs),
            diffPct: nfAvg > 0 ? Math.round(((tfAvg - nfAvg) / nfAvg) * 10000) / 100 : 0,
            diffEmis: Math.round(procTs - procNormal)
          })
        })
      })

      if (!rows.length) return empty

      const total = this.totalCarbonEmission || 0
      const otherEmis = Math.max(0, total - tsEmission)
      const normalTotal = otherEmis + normalEmission
      const tsTotal = otherEmis + tsEmission
      const emisDiff = tsEmission - normalEmission
      // 加权平均因子（总电量加权）
      let totalKwh = 0
      let wfSum = 0
      ;(this.modelStages || []).forEach(stage => {
        (stage.processes || []).forEach(proc => {
          const elec = (proc.inputs || []).filter(i => this.isTsElecItem(i, stage))
          elec.forEach(i => {
            const val = parseFloat(i.value) || 0
            totalKwh += val
            wfSum += val * (this.tsWeightedFactorOf(proc.name) || 0)
          })
        })
      })
      const tsFactor = totalKwh > 0 ? Math.round((wfSum / totalKwh) * 10000) / 10000 : 0
      // 常规加权平均因子：按同一电量权重加权（与分时口径可比）
      let nfSum = 0
      ;(this.modelStages || []).forEach(stage => {
        (stage.processes || []).forEach(proc => {
          const elec = (proc.inputs || []).filter(i => this.isTsElecItem(i, stage))
          elec.forEach(i => {
            const val = parseFloat(i.value) || 0
            nfSum += val * (parseFloat(i.factor) || 0)
          })
        })
      })
      const normalFactor = totalKwh > 0 ? nfSum / totalKwh : 0

      return {
        show: true,
        rows,
        normalEmission: Math.round(normalEmission),
        tsEmission: Math.round(tsEmission),
        normalShare: normalTotal > 0 ? Math.round((normalEmission / normalTotal) * 1000) / 10 : 0,
        tsShare: tsTotal > 0 ? Math.round((tsEmission / tsTotal) * 1000) / 10 : 0,
        emisDiff: Math.round(emisDiff),
        emisDiffPct: normalEmission > 0 ? Math.round((emisDiff / normalEmission) * 10000) / 100 : 0,
        normalTotal: Math.round(normalTotal),
        tsTotal: Math.round(tsTotal),
        totalDiffPct: normalTotal > 0 ? Math.round(((tsTotal - normalTotal) / normalTotal) * 10000) / 100 : 0,
        normalFactor: normalFactor.toFixed(4),
        tsFactor: tsFactor.toFixed(4)
      }
    },
    /**
     * 取某工序市电的分时加权平均因子（供阶段7计算与表格展示）
     * 带缓存，避免重复计算
     */
    tsWeightedFactorOf(procName) {
      if (!this.tsWeightedCache) this.$set(this, 'tsWeightedCache', {})
      const key = procName + '|' + this.tsRegion() + '|' + (this.boundaryConfig.timeBoundary || '')
      if (this.tsWeightedCache[key] !== undefined) return this.tsWeightedCache[key]
      const p = this.tsPeriod()
      const r = calcPeriodWeightedFactor({
        procName,
        startDate: p.start,
        endDate: p.end,
        region: this.tsRegion()
      })
      this.$set(this.tsWeightedCache, key, r.avgFactor)
      return r.avgFactor
    },
    /**
     * 阶段7：判断某工序的市电是否走分时加权因子
     */
    isTsElecInStage(procName) {
      if (this.elecFactorMode !== 'timespace') return false
      // 找到该工序所属阶段
      for (const stage of this.modelStages || []) {
        const proc = (stage.processes || []).find(p => p.name === procName)
        if (proc) {
          const elec = (proc.inputs || []).find(i => isTimespaceElec(i, stage))
          return !!elec
        }
      }
      return false
    },
    /**
     * 无持久化数据时的默认判断：演示数据仅覆盖「北京」
     * 支持市级回退到省级（如「北京市区」→ 北京）
     */
    defaultTsRegionHasData(regionName) {
      const region = normalizeRegion(regionName)
      if (!region) return false
      const DEFAULT_COVERED = ['11'] // 北京行政区划代码
      if (DEFAULT_COVERED.indexOf(region.code) > -1) return true
      if (region.level === 'city' && region.parentCode) {
        return DEFAULT_COVERED.indexOf(region.parentCode) > -1
      }
      return false
    },
    /** 获取某工序的分时电量佐证材料列表 */
    tsEvidenceOf(procName) {
      return this.tsEvidenceMap[procName] || []
    },
    /** 上传佐证材料 */
    uploadTsEvidence() {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.doc,.docx'
      input.onchange = (e) => {
        const files = Array.from(e.target.files || [])
        if (!files.length) return
        const proc = this.tsDetailProc
        if (!this.tsEvidenceMap[proc]) this.$set(this.tsEvidenceMap, proc, [])
        files.forEach(f => {
          const ext = (f.name.split('.').pop() || '').toLowerCase()
          const iconMap = {
            pdf: 'el-icon-document',
            xlsx: 'el-icon-s-grid',
            xls: 'el-icon-s-grid',
            csv: 'el-icon-s-grid',
            doc: 'el-icon-document',
            docx: 'el-icon-document',
            jpg: 'el-icon-picture-outline',
            jpeg: 'el-icon-picture-outline',
            png: 'el-icon-picture-outline'
          }
          const sizeKb = f.size / 1024
          const sizeText = sizeKb > 1024 ? (sizeKb / 1024).toFixed(1) + ' MB' : sizeKb.toFixed(0) + ' KB'
          const item = {
            name: f.name,
            desc: `${sizeText} · ${new Date().toLocaleDateString('zh-CN')} 上传`,
            status: 'pending',
            icon: iconMap[ext] || 'el-icon-document',
            size: f.size,
            ocr: { status: 'pending', summary: '', confidence: 0, applied: false }
          }
          this.tsEvidenceMap[proc].push(item)
          // 模拟 OCR 识别（1.5s 后返回结果）
          this.mockOcrRecognize(item, ext)
        })
        this.$message.success(`已上传 ${files.length} 个佐证材料，正在识别…`)
      }
      input.click()
    },

    /** ===== OCR 模拟识别（前端模拟，不接后端） ===== */
    mockOcrRecognize(item, ext) {
      setTimeout(() => {
        const isSheet = ['xlsx', 'xls', 'csv'].indexOf(ext) > -1
        const isPdf = ext === 'pdf'
        const isImg = ['jpg', 'jpeg', 'png'].indexOf(ext) > -1
        if (isSheet) {
          item.ocr.summary = '识别到 24 条小时级电量记录，合计 ' + (this.tsDetailData ? this.tsDetailData.dayKwh.toFixed(2) : '0') + ' kWh'
          item.ocr.confidence = 96
        } else if (isPdf) {
          item.ocr.summary = '识别到月度电费账单，总电量 ' + (this.tsDetailData ? this.tsDetailData.dayKwh.toFixed(2) : '0') + ' kWh'
          item.ocr.confidence = 88
        } else if (isImg) {
          item.ocr.summary = '识别到电表读数照片，建议人工复核后填'
          item.ocr.confidence = 82
        } else {
          item.ocr.summary = '未识别到结构化电量数据'
          item.ocr.confidence = 45
        }
        item.ocr.status = 'done'
      }, 1500)
    },

    /** 应用 OCR 识别结果（用模拟数据回填 24 小时电量） */
    applyOcrResult(ev) {
      if (!this.tsDetailData) return
      this.$confirm('将用识别结果覆盖当前 24 小时电量数据，是否继续？', '应用识别结果', {
        confirmButtonText: '应用',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const rows = this.tsDetailData.rows || []
        rows.forEach(r => {
          if (r.stopped) return
          // 模拟：按原比例微调（±2%），模拟识别出的真实值
          const factor = 0.98 + Math.random() * 0.04
          const oldVal = r.kwh || 0
          const newVal = Math.round(oldVal * factor * 100) / 100
          r.kwh = newVal
          this.pushTsAuditLog({
            hourLabel: r.hourLabel,
            oldVal: oldVal.toFixed(2),
            newVal: newVal.toFixed(2),
            reason: '应用 OCR 识别结果'
          })
        })
        this.recalcTsDaySummary()
        ev.ocr.applied = true
        this.$message.success('已应用识别结果')
      }).catch(() => {})
    },

    /** 重算当日用电合计（排放量不在此阶段展示） */
    recalcTsDaySummary() {
      if (!this.tsDetailData) return
      const rows = this.tsDetailData.rows || []
      this.tsDetailData.dayKwh = Math.round(rows.reduce((s, r) => s + (r.kwh || 0), 0) * 100) / 100
    },

    /** ===== 电量手动调整 ===== */
    onTsHourKwhChange(row, val) {
      const oldVal = row.kwh || 0
      const newVal = Math.max(0, parseFloat(val) || 0)
      if (Math.abs(newVal - oldVal) < 0.0001) return
      row.kwh = newVal
      this.recalcTsDaySummary()
      this.pushTsAuditLog({
        hourLabel: row.hourLabel,
        oldVal: oldVal.toFixed(2),
        newVal: newVal.toFixed(2),
        reason: '手动调整'
      })
      // 偏差提示
      const orig = this.tsDetailData.origDayKwh
      if (orig > 0) {
        const diffPct = Math.abs((this.tsDetailData.dayKwh - orig) / orig) * 100
        if (diffPct > 5 && !this._tsDevWarned) {
          this._tsDevWarned = true
          this.$message.warning(`当日用电合计较原始值偏差 ${diffPct.toFixed(1)}%，请确认数据来源`)
        }
      }
    },

    /** ===== 修改记录 ===== */
    tsAuditLogOf(procName) {
      return this.tsAuditMap[procName] || []
    },
    pushTsAuditLog(entry) {
      const proc = this.tsDetailProc
      if (!proc) return
      if (!this.tsAuditMap[proc]) this.$set(this.tsAuditMap, proc, [])
      this.tsAuditMap[proc].unshift({
        time: new Date().toLocaleString('zh-CN', { hour12: false }),
        user: 'admin001',
        hourLabel: entry.hourLabel,
        oldVal: entry.oldVal,
        newVal: entry.newVal,
        reason: entry.reason || ''
      })
    },
    /** 查看佐证材料 */
    viewTsEvidence(ev) {
      this.$alert(
        `<div style="line-height:2;font-size:13px">
          <div><b>文件名：</b>${ev.name}</div>
          <div><b>说明：</b>${ev.desc}</div>
          <div><b>状态：</b>${ev.status === 'verified' ? '已验证' : '待审核'}</div>
        </div>`,
        '佐证材料详情',
        { dangerouslyUseHTMLString: true, confirmButtonText: '知道了' }
      )
    },
    /** 删除佐证材料 */
    removeTsEvidence(idx) {
      const proc = this.tsDetailProc
      const list = this.tsEvidenceMap[proc]
      if (!list || !list[idx]) return
      this.$confirm(`确认删除「${list[idx].name}」？`, '删除佐证材料', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        list.splice(idx, 1)
        this.$message.success('已删除')
      }).catch(() => {})
    },
    /** 打开市电分时详情弹窗（按当前阶段决定内容） */
    openTsDetail(inp, procName) {
      this.tsDetailProc = procName
      this.tsDetailItem = inp
      this.tsDetailDate = this.tsPeriod().start
      this.tsDetailVisible = true
      this.refreshTsDayDetail()
    },
    /** 刷新当日 24 小时明细 */
    refreshTsDayDetail() {
      if (!this.tsDetailItem || !this.tsDetailDate) return
      // 兼容：value 可能是字符串、数字或 undefined
      const raw = this.tsDetailItem.value
      const num = Number(raw)
      const totalKwh = Number.isFinite(num) && num > 0 ? num : 0
      this.tsDetailData = buildDayDetail({
        procName: this.tsDetailProc,
        date: this.tsDetailDate,
        totalKwh,
        days: this.tsDaysCount(),
        region: this.tsRegion()
      })
      // 记录原始当日用电，用于手动调整后的偏差提示
      if (this.tsDetailData) {
        this.tsDetailData.origDayKwh = this.tsDetailData.dayKwh
      }
      this._tsDevWarned = false
    },
    /** 日期变更 */
    onTsDateChange() {
      this.refreshTsDayDetail()
    },
    /** 前一天 */
    tsPrevDay() {
      const d = new Date(this.tsDetailDate + 'T00:00:00')
      d.setDate(d.getDate() - 1)
      const s = this.fmtDate(d)
      if (s < this.tsPeriod().start) {
        this.$message.info('已到核算期起始日')
        return
      }
      this.tsDetailDate = s
      this.refreshTsDayDetail()
    },
    /** 后一天 */
    tsNextDay() {
      const d = new Date(this.tsDetailDate + 'T00:00:00')
      d.setDate(d.getDate() + 1)
      const s = this.fmtDate(d)
      if (s > this.tsPeriod().end) {
        this.$message.info('已到核算期结束日')
        return
      }
      this.tsDetailDate = s
      this.refreshTsDayDetail()
    },
    /** 日期格式化 */
    fmtDate(d) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${dd}`
    },
    /** 星期几 */
    weekdayOf(date) {
      if (!date) return ''
      const d = new Date(date + 'T00:00:00')
      if (isNaN(d.getTime())) return ''
      return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
    },
    // 数据清单行点击：把该行数据读入对话，引导确认/修改
    onActivityRowClick(item, proc, dir) {
      this.activeActivityRow = { item, proc, dir }
      const cats = (this.selectedImpactCategories || []).map(c => {
        const v = this.catFactor ? this.catFactor(item, c.id) : (item.factor || '—')
        return `${c.abbr || c.name} ${v}`
      }).join(' / ')
      const lines = [
        `**【${item.name}】**（${proc.name} · ${dir === 'input' ? '输入流' : '输出流'}）`,
        '',
        `* 活动数据：**${item.value || '—'} ${item.unit || ''}**`,
        cats ? `* 因子：${cats}` : `* 因子：${item.factor || '—'} ${item.factorUnit || ''}`
      ]
      this.messages.push({
        id: 'MSG-' + Date.now(),
        role: 'assistant',
        content: lines.join('\n') + '\n\n请确认，或直接告诉我要调整的值（如「活动数据改为 90000」）。',
        timestamp: new Date().toLocaleTimeString('zh-CN'),
        suggestions: ['确认无误', '修改活动数据', '查看因子来源']
      })
      this.$nextTick(() => this.scrollToBottom && this.scrollToBottom())
    },
    // 标记该行已核对
    confirmActivityRow() {
      const row = this.activeActivityRow
      if (!row) return
      this.$set(row.item, 'verified', true)
      this.messages.push({
        id: 'MSG-' + Date.now(),
        role: 'assistant',
        content: `已标记 **${row.item.name}** 为「已核对」。\n\n可继续点击其他行核对，或点击底部「全篇校验」。`,
        timestamp: new Date().toLocaleTimeString('zh-CN'),
        suggestions: ['继续核对其他行', '全篇校验']
      })
    },
    // 展示该行因子的来源与凭证
    showFactorSource() {
      const row = this.activeActivityRow
      if (!row) return
      const libs = (this.factorDatabases || []).filter(l => l.selected).map(l => `${l.shortName || l.name} ${l.version || ''}`)
      const cats = (this.selectedImpactCategories || []).map(c =>
        `* ${c.name}：${this.catFactor ? this.catFactor(row.item, c.id) : (row.item.factor || '—')} ${c.unit || ''}`
      ).join('\n')
      this.messages.push({
        id: 'MSG-' + Date.now(),
        role: 'assistant',
        content: `**【${row.item.name}】因子来源**\n\n* 匹配方式：按物料名称 + 工艺路线自动匹配\n* 启用因子库：${libs.join(' / ') || '—'}\n* 因子版本：${(this.factorDatabases || []).filter(l => l.selected).map(l => l.releaseDate || '').filter(Boolean).join(' / ') || '—'}\n* 凭证：已关联采购/结算凭证（可在佐证材料库查看）\n\n**各类别因子值**：\n${cats || '* 主因子：' + (row.item.factor || '—') + ' ' + (row.item.factorUnit || '')}`,
        timestamp: new Date().toLocaleTimeString('zh-CN'),
        suggestions: ['确认无误', '修改因子值']
      })
    },
    // 从对话指令中解析并应用数值修改（如「活动数据改为 90000」）
    applyActivityEdit(text) {
      const row = this.activeActivityRow
      if (!row) return false
      const m = String(text).match(/(?:改为|调整到|改成|设为)\s*([\d.]+)/)
      if (!m) return false
      const val = m[1]
      const isFactor = /因子/.test(text) && !/活动数据/.test(text)
      if (isFactor) {
        this.$set(row.item, 'factor', val)
        this.messages.push({
          id: 'MSG-' + Date.now(),
          role: 'assistant',
          content: `已将 **${row.item.name}** 的因子更新为 **${val} ${row.item.factorUnit || ''}**。右侧数据清单已同步。`,
          timestamp: new Date().toLocaleTimeString('zh-CN'),
          suggestions: ['确认无误', '查看因子来源']
        })
        return true
      }
      this.$set(row.item, 'value', val)
      this.messages.push({
        id: 'MSG-' + Date.now(),
        role: 'assistant',
        content: `已将 **${row.item.name}** 的活动数据更新为 **${val} ${row.item.unit || ''}**。右侧数据清单已同步。`,
        timestamp: new Date().toLocaleTimeString('zh-CN'),
        suggestions: ['继续核对其他行', '全篇校验']
      })
      return true
    },
    // 校正当前标准：任务里存的 code 若不在本场景标准集内，回落到第一项（PEF 优先 EU PEF）
    ensureStandardValid() {
      const list = this.standards || []
      if (!list.length) return
      if (!list.some(s => s.code === this.selectedStandard)) {
        this.selectedStandard = list[0].code
      }
    },
    // 从底层因子库 selected 派生已选列表
    initSelectedFactorLibs() {
      this.selectedFactorLibs = (this.factorDatabases || []).filter(l => l.selected).map(l => l.id)
    },
    // 当前标准下可用的因子库（数据源：底层 factorDatabases）
    availableFactorLibs() {
      const cfg = this.selectedStandardConfig || {}
      const txt = (cfg.code || '') + ' ' + (cfg.name || '')
      const all = (this.factorDatabases || []).filter(l => !l.hidden)
      const list = all.filter(l => !l.standards || l.standards.some(t => txt.indexOf(t) > -1))
      return list.length ? list : all
    },
    // 切换电力因子精度（选分时分区时提示电量数据要求）
    onElecFactorModeChange(val) {
      if (val === 'timespace') {
        // 前置校验：分时分区库须覆盖企业所在省市
        if (!this.hasTimespaceFactorForRegion) {
          this.$message.warning(`分时分区电碳因子库暂无「${this.tsRegion()}」的因子数据，无法启用分时分区模式`)
          this.elecFactorMode = 'regular'
          return
        }
        this.$confirm(
          '<div style="line-height:1.8">' +
          '<b>启用分时分区电碳因子前，请确认电量数据充足：</b><br><br>' +
          '<b>1. 时间粒度</b>：电量数据须为<b>小时级</b>（每一条用电记录对应具体日期与小时），' +
          '与分时因子的小时分辨率一一对应；仅有月度/年度汇总电量无法用于分时匹配。<br>' +
          '<b>2. 工序粒度</b>：电力须按<b>具体生产工序（单元过程）</b>分别记录，不可按全厂汇总；' +
          '不同工序的用电时刻不同，须分别匹配对应时段因子。<br>' +
          '<b>3. 电力分项与完整性</b>：每个工序的市电、绿电、光伏等不同电力类型应分别记录，' +
          '不可合并为单一总电量；核算期内各工序各时段的电量数据应连续无缺失。<br><br>' +
          '<span style="color:#E6A23C">若电量数据不足，建议保持「常规」模式，采用所选因子库的区域电网平均因子。</span>' +
          '</div>',
          '启用分时分区电碳因子的数据要求',
          {
            dangerouslyUseHTMLString: true,
            confirmButtonText: '数据充足，启用',
            cancelButtonText: '暂不启用',
            type: 'warning',
            distinguishCancelAndClose: true
          }
        ).then(() => {
          const lib = (this.factorDatabases || []).find(l => l.id === 'elec-ts')
          if (lib) lib.selected = true
          if (this.selectedFactorLibs.indexOf('elec-ts') === -1) this.selectedFactorLibs.push('elec-ts')
          this.$message.success('已启用分时分区电碳因子，请确保阶段四电量数据按时刻与区域采集')
        }).catch(() => {
          this.elecFactorMode = 'regular'
          const lib = (this.factorDatabases || []).find(l => l.id === 'elec-ts')
          if (lib) lib.selected = false
          const i = this.selectedFactorLibs.indexOf('elec-ts')
          if (i > -1) this.selectedFactorLibs.splice(i, 1)
        })
      } else {
        const lib = (this.factorDatabases || []).find(l => l.id === 'elec-ts')
        if (lib) lib.selected = false
        const i = this.selectedFactorLibs.indexOf('elec-ts')
        if (i > -1) this.selectedFactorLibs.splice(i, 1)
      }
    },
    requiredFactorLibs() {
      return this.availableFactorLibs().filter(l => l.required).map(l => l.key)
    },
    // 因子库多选切换（标准强制项不可取消）
    toggleFactorLib(lib) {
      if (lib.required) {
        this.$message.info(lib.name + ' 为当前标准强制要求，不可取消')
        return
      }
      const i = this.selectedFactorLibs.indexOf(lib.key)
      if (i > -1) this.selectedFactorLibs.splice(i, 1)
      else this.selectedFactorLibs.push(lib.key)
    },
    selectAllFactorLibs(on) {
      if (on) this.selectedFactorLibs = this.availableFactorLibs().map(l => l.key)
      else this.selectedFactorLibs = this.requiredFactorLibs().slice()
    },
    startOnboarding() {
      this.onboardingStep = 0
      this.showOnboarding = true
    },
    finishOnboarding() {
      this.showOnboarding = false
    },
    goBackHome() {
      this.$router.push('/agent-center/apps/carbon-accounting').catch(() => {})
    },
    // 新建对话：脱离当前会话，回到欢迎态
    newConversation() {
      this.saveConversation()
      this.messages = []
      this.currentConversationId = null
      this.tlDialogStep = 'welcome'
      this.$message.success('已开启新对话')
    }
  }
}
</script>

<style src="./agent-global.css"></style>

<style scoped src="./agent-scoped.css">



</style>
