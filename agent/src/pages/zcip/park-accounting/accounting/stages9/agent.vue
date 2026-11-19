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
                  👋 欢迎使用园区碳核算智能体！我是小易，将全程引导您完成核算。
                </div>
                <p class="tl-bubble-text">我将引导您对零碳园区碳排放的九阶段智能核算，包括目标与范围界定、清单分析、影响评价等全流程。</p>
                <p class="tl-bubble-hint">💡 在下方输入园区名称并回车即可开始新核算，右侧可查看历史任务继续推进。</p>
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
                  <span class="toolbar-icon" title="附件上传" @click="$message.info('附件上传功能开发中')"><i class="el-icon-upload2"></i></span>
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
                  <span class="cmd-item" @click="useCmd('导出评价报告')"><i class="el-icon-document"></i> 导出报告</span>
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
                <span class="toolbar-icon" title="附件上传" @click="$message.info('附件上传功能开发中')"><i class="el-icon-upload2"></i></span>
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
              <div class="parsing-card" v-for="blk in parkParsingBlocks" :key="blk.key">
                <div class="parsing-card-header">
                  <span :class="['parsing-card-icon', blk.icon]"></span>
                  <span class="parsing-card-title">{{ blk.title }}</span>
                </div>
                <div class="parsing-card-body" v-html="blk.html"></div>
              </div>
              <div v-if="!parkParsingBlocks.length" class="parsing-empty">
                <i class="el-icon-document"></i>
                <span>该标准暂未提供结构化解析内容</span>
              </div>
            </div>
          </div>

          <!-- 阶段 1：核算边界配置（5个子步骤） -->
          <div v-else-if="currentStepIndex === 1" class="parsing-section">
            <div class="content-header">
              <div class="content-header-row">
                <i class="el-icon-set-up"></i>
                <span class="content-header-title">核算边界配置</span>
                <span class="content-header-sub">园区碳核算</span>
              </div>
            </div>

            <div class="boundary-edit-list">

              <!-- ① 核算主体 -->
              <div class="boundary-section-title"><i class="el-icon-office-building"></i> 核算主体</div>
              <div class="boundary-edit-row">
                <span class="boundary-edit-label">园区名称</span>
                <el-input v-model="parkBasicInfo.name" size="mini" class="boundary-edit-control" placeholder="请输入园区名称"></el-input>
              </div>
              <div class="boundary-edit-row">
                <span class="boundary-edit-label">园区面积</span>
                <el-input v-model="parkBasicInfo.area" size="mini" class="boundary-edit-control" placeholder="如 12.5">
                  <template slot="append">km²</template>
                </el-input>
              </div>

              <!-- ② 核算边界（只读） -->
              <div class="boundary-section-title"><i class="el-icon-set-up"></i> 核算边界</div>
              <div class="boundary-edit-row">
                <span class="boundary-edit-label">边界类型</span>
                <span class="boundary-readonly-text">园区法定地理边界</span>
              </div>
              <div class="boundary-edit-row boundary-edit-row-tall">
                <span class="boundary-edit-label">核算范围</span>
                <div class="boundary-scope-tags">
                  <span class="boundary-scope-tag">化石燃料燃烧排放</span>
                  <span class="boundary-scope-tag">能源加工转换排放</span>
                  <span class="boundary-scope-tag">净购入电力热力隐含排放</span>
                  <span class="boundary-scope-tag">工业过程排放</span>
                </div>
              </div>
              <div class="boundary-edit-row">
                <span class="boundary-edit-label">气体范围</span>
                <span class="boundary-readonly-text">仅核算二氧化碳（CO₂），不含 CH₄、N₂O 等其他温室气体</span>
              </div>
              <div class="boundary-edit-row">
                <span class="boundary-edit-label">计量单位</span>
                <span class="boundary-readonly-text">万吨 CO₂（总量） · tCO₂/tce（强度指标）</span>
              </div>

              <!-- ③ 核算年度 -->
              <div class="boundary-section-title"><i class="el-icon-date"></i> 核算年度</div>
              <div class="boundary-edit-row">
                <span class="boundary-edit-label">核算周期</span>
                <el-date-picker v-model="boundaryDateRange" type="daterange" size="mini" class="boundary-edit-control"
                  range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期"
                  value-format="yyyy-MM-dd" format="yyyy-MM-dd" :clearable="false"
                  @change="onBoundaryPeriodChange">
                </el-date-picker>
              </div>

              <!-- ④ 排放因子库 -->
              <div class="boundary-section-title"><i class="el-icon-coin"></i> 排放因子库</div>
              <div class="boundary-edit-row boundary-factor-row">
                <div class="flc-wrap">
                  <el-select v-model="selectedFactorLibs" multiple filterable class="flc-select" placeholder="选择排放因子库（可多选）" size="mini">
                    <el-option v-for="lib in availableFactorLibs()" :key="lib.id" :label="lib.shortName || lib.name" :value="lib.id" :disabled="lib.required">
                      <div class="flc-opt">
                        <span class="flc-opt-name">{{ lib.shortName || lib.name }}</span>
                        <span class="flc-opt-meta">{{ lib.version }} · {{ lib.releaseDate }}</span>
                        <el-tag v-if="lib.required" size="mini" type="warning" effect="plain">标准要求</el-tag>
                      </div>
                    </el-option>
                  </el-select>
                  <div class="flc-foot">
                    已启用 <b>{{ selectedFactorLibs.length }}</b> 个库
                    <span v-if="requiredFactorLibs().length">（含 {{ requiredFactorLibs().length }} 个必选）</span>
                    · 按标准 {{ selectedStandardConfig ? selectedStandardConfig.code : '—' }} 推荐
                    <el-button type="text" size="mini" @click="selectAllFactorLibs(true)">全选</el-button>
                    <el-button type="text" size="mini" @click="selectAllFactorLibs(false)">仅保留必选</el-button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- 阶段四/五/六数据质检（双页签） -->
          <!-- 阶段6：整体质量评估 -->
          <div v-else-if="currentStepIndex === 5" class="parsing-section qa-park-section">

            <!-- 顶部统计 -->
            <!-- 子页签 -->
            <div class="src-subtabs">
              <div :class="['src-subtab', { active: parkQaTab === 'validation' }]" @click="parkQaTab = 'validation'">
                <i class="el-icon-warning-outline"></i> 待补充 / 待确认
                <span class="src-subtab-count" v-if="validationItems.filter(v => v.status !== 'resolved' && v.status !== 'skipped').length">{{ validationItems.filter(v => v.status !== 'resolved' && v.status !== 'skipped').length }}</span>
              </div>
              <div :class="['src-subtab', { active: parkQaTab === 'quality' }]" @click="parkQaTab = 'quality'">
                <i class="el-icon-data-analysis"></i> 整体质量评估
              </div>
              <div :class="['src-subtab', { active: parkQaTab === 'list' }]" @click="parkQaTab = 'list'">
                <i class="el-icon-document-copy"></i> 数据清单
                <span class="src-subtab-count">{{ parkQualityAssessment.total }}</span>
              </div>
            </div>

            <!-- 滚动内容：待补充 / 待确认清单 -->
            <div v-show="parkQaTab === 'validation'" class="qa-park-scroll">

              <!-- ① 补充/确认清单 -->
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
                      <span class="checklist-item-name">{{ item.ioName || item.name || item.label }}</span>
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

              <!-- ② 文件上传 -->
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

              <!-- ③ 逐项填报 / 确认 -->
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
                        <span class="vtc-value-name">{{ item.ioName || item.name || '—' }}</span>
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
              <div class="val-next-bar" v-if="validationAllResolved">
                <el-button type="primary" size="small" @click="finishValidation"><i class="el-icon-right"></i> 确认数据，进入下一步</el-button>
              </div>

            </div>

            <!-- 滚动内容 -->
            <div v-show="parkQaTab === 'quality'" class="qa-park-scroll">

              <!-- ① 加权质量分 + DQR 分布 -->
              <div class="qa-row-2">
                <div class="qa-hero qa-hero-clickable" title="点击查看质量分解读" @click="onParkQaClick('score')">
                  <div class="qa-hero-score">
                    <span class="qa-score-num">{{ parkQualityAssessment.weightedScore }}</span>
                    <span class="qa-score-max">/ 5.0</span>
                  </div>
                  <div class="qa-hero-meta">
                    <span :class="['qa-grade', 'is-' + parkQualityAssessment.weightedGrade.toLowerCase()]">{{ parkQualityAssessment.weightedGrade }}</span>
                    <span class="qa-hero-label">加权质量分</span>
                  </div>
                </div>
                <div class="qa-card qa-card-chart">
                  <div class="qa-card-title"><i class="el-icon-pie-chart"></i> DQR 分布</div>
                  <div ref="parkQaDqrChart" class="qa-chart qa-chart-clickable" style="height:160px" title="点击查看解读" @click="onParkQaClick('dqr')"></div>
                </div>
              </div>

              <!-- ② 数据来源结构 + 覆盖率 -->
              <div class="qa-row-2">
                <div class="qa-card qa-card-chart">
                  <div class="qa-card-title"><i class="el-icon-coin"></i> 数据来源结构</div>
                  <div ref="parkQaSourceChart" class="qa-chart qa-chart-clickable" style="height:176px" title="点击查看解读" @click="onParkQaClick('source')"></div>
                </div>
                <div class="qa-card qa-card-chart">
                  <div class="qa-card-title"><i class="el-icon-aim"></i> 覆盖率</div>
                  <div ref="parkQaCoverChart" class="qa-chart qa-chart-clickable" style="height:176px" title="点击查看解读" @click="onParkQaClick('cover')"></div>
                </div>
              </div>

              <!-- ③ 因子置信度 + 时效性 -->
              <div class="qa-row-2">
                <div class="qa-card qa-card-chart">
                  <div class="qa-card-title"><i class="el-icon-medal"></i> 因子匹配置信度</div>
                  <div ref="parkQaConfChart" class="qa-chart qa-chart-clickable" style="height:176px" title="点击查看解读" @click="onParkQaClick('conf')"></div>
                </div>
                <div class="qa-card qa-card-chart">
                  <div class="qa-card-title"><i class="el-icon-time"></i> 时效性</div>
                  <div ref="parkQaTimeChart" class="qa-chart qa-chart-clickable" style="height:176px" title="点击查看解读" @click="onParkQaClick('time')"></div>
                </div>
              </div>

              <!-- ④ 低质量项 -->
              <div class="qa-card">
                <div class="qa-card-title">
                  <i class="el-icon-warning-outline"></i> 低质量项
                  <span class="qa-badge">{{ parkQualityAssessment.lowQuality.length }}</span>
                </div>
                <div v-if="!parkQualityAssessment.lowQuality.length" class="qa-empty">无低质量项</div>
                <div v-else class="qa-low-list">
                  <div v-for="(x, i) in parkQualityAssessment.lowQuality" :key="i" class="qa-low-item">
                    <span :class="['qa-low-dot', x.level === 'block' ? 'is-block' : 'is-warn']"></span>
                    <span class="qa-low-name">{{ x.proc }} · {{ x.unit }} · {{ x.label }}</span>
                    <span class="qa-low-level">{{ x.level === 'block' ? '阻断' : '警告' }}</span>
                  </div>
                </div>
              </div>

            </div>

            <!-- 滚动内容：数据清单 -->
            <div v-show="parkQaTab === 'list'" class="qa-park-scroll">
              <div class="datalist-tree">
                <div v-for="g in parkDataListTree" :key="g.key" class="dl-cat">
                  <!-- 分类头 -->
                  <div class="dl-cat-head">
                    <i :class="[g.icon, 'act-group-icon']" :style="{ color: g.color }"></i>
                    <span class="dl-cat-name">{{ g.key }}</span>
                    <span class="dl-cat-count">{{ g.sources.length }} 项 · {{ g.paramCount }} 参数</span>
                  </div>

                  <!-- 排放源 -->
                  <div v-for="src in g.sources" :key="src.name" class="dl-src">
                    <div class="dl-src-head">
                      <span class="dl-src-name">{{ src.name }}</span>
                      <span class="dl-src-channel">{{ src.channel }}</span>
                    </div>

                    <!-- 物料 -->
                    <div v-for="(mat, mi) in src.mats" :key="mi" class="dl-mat">
                      <div class="dl-mat-head">
                        <i v-if="mat.direction === 'input'" class="el-icon-bottom-right dl-dir is-input"></i>
                        <i v-else-if="mat.direction === 'output'" class="el-icon-top-right dl-dir is-output"></i>
                        <span class="dl-mat-name">{{ mat.name }}</span>
                      </div>

                      <div class="param-table dl-param-table">
                        <div class="param-tr param-th">
                          <span class="col-name">参数名称</span>
                          <span class="col-value ta-r">参数值</span>
                          <span class="col-raw ta-c">原始值</span>
                          <span class="col-src">来源 · 佐证材料</span>
                        </div>
                        <div v-for="p in mat.params" :key="p.key" class="param-tr param-row is-clickable-row"
                          :class="{ 'is-readonly-row': p.readonly }"
                          @click="openDataListTrace(p, src, mat)">
                          <span class="col-name">
                            <i v-if="!(mat.direction === 'single' && src.type)" class="param-sym is-ad">{{ p.key }}</i>
                            {{ p.label }}
                          </span>
                          <span class="col-value ta-r" @click.stop>
                            <span v-if="p.readonly" class="dl-val">{{ p.value || '待汇总' }}</span>
                            <el-input v-else v-model="p.value" size="mini" class="act-inline-input" @click.native.stop></el-input>
                            <span class="param-unit">{{ p.unit }}</span>
                          </span>
                          <span class="col-raw ta-c param-raw">
                            <template v-if="p.rawValue">{{ p.rawValue }}<small class="param-raw-unit" v-if="p.rawUnit"> {{ p.rawUnit }}</small></template>
                            <span v-else class="param-raw-unknown">—</span>
                          </span>
                          <span class="col-src"><span class="param-src" :title="p.source">{{ p.source || '—' }}</span></span>
                        </div>
                        <!-- 因子行 -->
                        <div v-if="mat.factorObj && mat.factorObj.ef" class="param-tr param-row is-clickable-row"
                          @click="openDataListFactorTrace(mat, 'ef', src)">
                          <span class="col-name"><i class="param-sym is-ef">EF</i> 排放因子</span>
                          <span class="col-value ta-r" @click.stop>
                            <el-input v-model="mat.factorObj.ef.value" size="mini" class="act-inline-input" @click.native.stop></el-input>
                            <span class="param-unit">{{ mat.factorObj.ef.unit }}</span>
                          </span>
                          <span class="col-raw ta-c param-raw"><span class="param-raw-unknown">—</span></span>
                          <span class="col-src"><span class="param-src" :title="mat.factorObj.ef.sourceDetail || mat.factorObj.ef.source">{{ mat.factorObj.ef.source }}</span></span>
                        </div>
                        <div v-if="mat.factorObj && mat.factorObj.cef" class="param-tr param-row is-clickable-row"
                          @click="openDataListFactorTrace(mat, 'cef', src)">
                          <span class="col-name"><i class="param-sym is-cef">CEF</i> 折标煤系数</span>
                          <span class="col-value ta-r" @click.stop>
                            <el-input v-model="mat.factorObj.cef.value" size="mini" class="act-inline-input" @click.native.stop></el-input>
                            <span class="param-unit">{{ mat.factorObj.cef.unit }}</span>
                          </span>
                          <span class="col-raw ta-c param-raw"><span class="param-raw-unknown">—</span></span>
                          <span class="col-src"><span class="param-src" :title="mat.factorObj.cef.sourceDetail || mat.factorObj.cef.source">{{ mat.factorObj.cef.source }}</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 底部固定栏 -->
            <div class="stage-confirm-bar src-block-footer">
              <span class="stage-confirm-hint">
                <i class="el-icon-info"></i>
                质量评级 {{ parkQualityAssessment.weightedGrade }} 级，低质量项 {{ parkQualityAssessment.lowQuality.length }} 个
              </span>
              <span class="stage-confirm-btns">
                <el-button type="primary" size="small" icon="el-icon-check" @click="currentStepIndex = 6">
                  进入排放计算
                </el-button>
              </span>
            </div>

          </div>

          <!-- 阶段八（碳足迹分析）高级选项卡面板 -->
          <!-- 阶段8：排放分析（图表与指标，无页签） -->
          <div v-else-if="currentStepIndex === 7" class="parsing-section qa-park-section">

            <!-- 顶部：关键指标 -->
            <div class="ana-metric-row">
              <!-- 核心硬指标 -->
              <div class="ana-metric-box is-core">
                <div class="amb-top">
                  <span class="amb-label">单位能耗碳排放</span>
                  <span class="amb-badge is-core">核心硬指标</span>
                </div>
                <div class="amb-value-row">
                  <span :class="['amb-num', parkIndicatorRows[0] && parkIndicatorRows[0].pass ? 'is-pass' : 'is-fail']">{{ parkCarbonPerTce.toFixed(3) }}</span>
                  <span class="amb-unit">tCO₂/tce</span>
                </div>
                <div :class="['amb-sub', parkIndicatorRows[0] && parkIndicatorRows[0].pass ? 'is-pass' : 'is-fail']">
                  门槛 ≤ 0.20 · {{ parkIndicatorRows[0] && parkIndicatorRows[0].pass ? '达标' : '未达标' }}
                </div>
              </div>

              <!-- 引导指标达标 -->
              <div class="ana-metric-box is-guided">
                <div class="amb-top">
                  <span class="amb-label">引导指标达标</span>
                  <span class="amb-badge is-guided">引导指标</span>
                </div>
                <div class="amb-value-row">
                  <span class="amb-num is-guided">{{ parkIndicatorStats.guidedPass }}/{{ parkIndicatorStats.guidedTotal }}</span>
                  <span class="amb-unit">项</span>
                </div>
                <div class="amb-sub">{{ parkIndicatorStats.guidedPass === parkIndicatorStats.guidedTotal ? '全部达标' : (parkIndicatorStats.guidedTotal - parkIndicatorStats.guidedPass) + ' 项未达标' }}</div>
              </div>

              <!-- 总体达标 -->
              <div class="ana-metric-box is-total">
                <div class="amb-top">
                  <span class="amb-label">总体达标情况</span>
                  <span class="amb-badge is-total">全部指标</span>
                </div>
                <div class="amb-value-row">
                  <span class="amb-num is-total">{{ parkIndicatorStats.pass }}/{{ parkIndicatorStats.total }}</span>
                  <span class="amb-unit">项</span>
                </div>
                <div class="amb-sub">{{ parkIndicatorStats.pass === parkIndicatorStats.total ? '全部达标' : '存在未达标项' }}</div>
              </div>
            </div>

            <!-- 滚动内容 -->
            <div class="src-block-scroll">

              <!-- ① 指标对标表 -->
              <div class="ana-card">
                <div class="ana-card-title">
                  <i class="el-icon-medal"></i>
                  <span>园区对标指标</span>
                  <span class="ana-all-badge">
                    <i class="el-icon-circle-check"></i>
                    {{ parkIndicatorStats.pass }}/{{ parkIndicatorStats.total }} 项达标
                  </span>
                </div>
                <div class="ana-ind-table">
                  <div class="ana-ind-tr ana-ind-th">
                    <span>指标</span><span>类型</span><span>当前值</span><span>目标要求</span><span>判定</span>
                  </div>
                  <div v-for="r in parkIndicatorRows" :key="r.key" :class="['ana-ind-tr', { 'is-core': r.isCore }]" :title="r.calcText">
                    <span class="ana-ind-name">{{ r.name }}</span>
                    <span><em :class="['ana-type', r.isCore ? 'core' : 'guided']">{{ r.typeName }}</em></span>
                    <span class="ana-ind-val">{{ r.valueText }}</span>
                    <span class="ana-ind-target">{{ r.targetText }}</span>
                    <span><em :class="['ana-tag', r.pass ? 'ok' : 'fail']">{{ r.pass ? '达标' : '未达标' }}</em></span>
                  </div>
                </div>
              </div>

              <!-- ② 碳排放构成 + 表 -->
              <div class="ana-card">
                <div class="ana-card-title"><i class="el-icon-pie-chart"></i> 碳排放构成</div>
                <div class="ana-pie-wrap">
                  <div ref="parkAnaPieChart" class="ana-chart-pie"></div>
                  <table class="ana-scope-table">
                    <thead><tr><th>排放类别</th><th class="ta-r">占比</th><th class="ta-r">数值 (tCO₂)</th></tr></thead>
                    <tbody>
                      <tr v-for="r in parkScopeTable" :key="r.name">
                        <td><span class="ana-dot" :style="{ background: r.color }"></span>{{ r.name }}</td>
                        <td class="ta-r">{{ r.pct }}%</td>
                        <td class="ta-r">{{ r.value.toFixed(1) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- ③ 排放源贡献 Top 8 -->
              <div class="ana-card">
                <div class="ana-card-title"><i class="el-icon-s-data"></i> 排放源贡献 (Top 8)</div>
                <div ref="parkAnaBarChart" class="ana-chart-bar"></div>
              </div>

            </div>

            <!-- 底部固定栏 -->
            <div class="stage-confirm-bar src-block-footer">
              <span class="stage-confirm-hint">
                <i class="el-icon-info"></i>
                {{ parkIndicatorStats.pass }}/{{ parkIndicatorStats.total }} 项指标达标，可生成核算报告
              </span>
              <span class="stage-confirm-btns">
                <el-button type="primary" size="small" icon="el-icon-document" @click="currentStepIndex = 8">
                  生成核算报告
                </el-button>
              </span>
            </div>

          </div>
          <!-- 阶段八闭合 end analysis-section -->

          <!-- 阶段九（碳足迹报告生成） -->
          <!-- 阶段9：园区碳排放核算报告 -->
          <!-- 阶段9：零碳园区建设自评报告 -->
          <div v-else-if="currentStepIndex === 8 && reportViewMode === 'report'" class="parsing-section qa-park-section">

            <!-- 标题行 -->
            <div class="qa-park-header">
              <div class="act-header">
                <i class="el-icon-document-checked"></i>
                <span class="act-header-title">零碳园区建设自评报告</span>
                <span class="act-header-stat">{{ parkReportProfile.standard }}</span>
              </div>
            </div>

            <!-- 内容区（内部滚动） -->
            <div class="src-block-scroll">

              <!-- ① 园区基本情况 -->
              <div class="ana-card">
                <div class="ana-card-title"><span class="rpt-ch-num">01</span><i class="el-icon-office-building"></i> 园区基本情况</div>
                <div class="rpt-meta-grid">
                  <div class="rpt-meta-row"><span class="rpt-meta-lbl">园区名称</span><span class="rpt-meta-val">{{ parkReportProfile.parkName }}</span></div>
                  <div class="rpt-meta-row"><span class="rpt-meta-lbl">园区面积</span><span class="rpt-meta-val">{{ parkReportProfile.area }} km²</span></div>
                  <div class="rpt-meta-row"><span class="rpt-meta-lbl">核算标准</span><span class="rpt-meta-val">{{ parkReportProfile.standard }}</span></div>
                  <div class="rpt-meta-row"><span class="rpt-meta-lbl">核算年度</span><span class="rpt-meta-val">{{ parkReportProfile.period }}</span></div>
                  <div class="rpt-meta-row"><span class="rpt-meta-lbl">核算边界</span><span class="rpt-meta-val">园区法定地理边界</span></div>
                  <div class="rpt-meta-row"><span class="rpt-meta-lbl">气体范围</span><span class="rpt-meta-val">仅二氧化碳（CO₂）</span></div>
                </div>
              </div>

              <!-- ② 零碳建设指标体系自评（核心章节） -->
              <div class="ana-card">
                <div class="ana-card-title">
                  <span class="rpt-ch-num">02</span>
                  <i class="el-icon-medal"></i> 零碳建设指标体系自评
                  <span class="rpt-badge-pass">{{ parkIndicatorStats.pass }}/{{ parkIndicatorStats.total }} 项达标</span>
                </div>
                <div class="ana-ind-table">
                  <div class="ana-ind-tr ana-ind-th">
                    <span>指标</span><span>类型</span><span>当前值</span><span>目标要求</span><span>自评</span>
                  </div>
                  <div v-for="r in parkIndicatorRows" :key="r.key" :class="['ana-ind-tr', { 'is-core': r.isCore }]">
                    <span class="ana-ind-name">{{ r.name }}</span>
                    <span><em :class="['ana-type', r.isCore ? 'core' : 'guided']">{{ r.typeName }}</em></span>
                    <span class="ana-ind-val">{{ r.valueText }}</span>
                    <span class="ana-ind-target">{{ r.targetText }}</span>
                    <span><em :class="['ana-tag', r.pass ? 'ok' : 'fail']">{{ r.pass ? '达标' : '未达标' }}</em></span>
                  </div>
                </div>
              </div>

              <!-- ③ 碳排放核算结果 -->
              <div class="ana-card">
                <div class="ana-card-title"><span class="rpt-ch-num">03</span><i class="el-icon-finished"></i> 碳排放核算结果</div>
                <div class="rpt-total-card">
                  <div class="rpt-total-label">园区碳排放总量</div>
                  <div class="rpt-total-value">
                    <span class="rpt-total-num">{{ parkReportProfile.total.toFixed(1) }}</span>
                    <span class="rpt-total-unit">tCO₂</span>
                    <span class="rpt-total-eq">≈ {{ parkReportProfile.totalWan }} 万吨CO₂</span>
                  </div>
                </div>
                <div class="rpt-kpi-grid">
                  <div class="rpt-kpi"><span class="rpt-kpi-lbl">综合能耗</span><strong class="rpt-kpi-val">{{ parkReportProfile.energy }} <small>tce</small></strong></div>
                  <div class="rpt-kpi"><span class="rpt-kpi-lbl">单位能耗碳排放</span><strong class="rpt-kpi-val">{{ parkReportProfile.carbonPerTce }} <small>tCO₂/tce</small></strong></div>
                  <div class="rpt-kpi"><span class="rpt-kpi-lbl">指标达标</span><strong class="rpt-kpi-val">{{ parkReportProfile.indicatorPass }}/{{ parkReportProfile.indicatorTotal }} <small>项</small></strong></div>
                  <div class="rpt-kpi"><span class="rpt-kpi-lbl">数据质量</span><strong class="rpt-kpi-val">{{ parkReportProfile.qualityGrade }} <small>级</small></strong></div>
                </div>
                <div class="rpt-cat-table" style="margin-top: 10px;">
                  <div class="rpt-cat-tr rpt-cat-th">
                    <span>排放类别</span><span class="ta-r">排放量 (tCO₂)</span><span class="ta-r">占比</span>
                  </div>
                  <div v-for="g in parkEmissionCalc.groups" :key="g.key" class="rpt-cat-tr">
                    <span><span class="ana-dot" :style="{ background: g.color }"></span>{{ g.key }}</span>
                    <span class="ta-r rpt-mono">{{ g.subtotal.toFixed(1) }}</span>
                    <span class="ta-r rpt-mono">{{ (g.subtotal / parkEmissionCalc.total * 100).toFixed(1) }}%</span>
                  </div>
                  <div class="rpt-cat-tr rpt-cat-total">
                    <span>合计</span>
                    <span class="ta-r rpt-mono">{{ parkEmissionCalc.total.toFixed(1) }}</span>
                    <span class="ta-r rpt-mono">100.0%</span>
                  </div>
                </div>
              </div>

              <!-- ④ 零碳措施与成效 -->
              <div class="ana-card">
                <div class="ana-card-title"><span class="rpt-ch-num">04</span><i class="el-icon-sunny"></i> 零碳措施与成效</div>
                <div class="rpt-measure-list">
                  <div v-for="(m, mi) in parkReportProfile.measures" :key="mi" class="rpt-measure-item">
                    <div class="rpt-measure-head">
                      <i :class="m.icon" class="rpt-measure-icon"></i>
                      <span class="rpt-measure-name">{{ m.name }}</span>
                      <span class="rpt-measure-val">{{ m.value }}</span>
                    </div>
                    <div class="rpt-measure-desc">{{ m.desc }}</div>
                  </div>
                </div>
              </div>

              <!-- ⑤ 数据质量与可追溯性 -->
              <div class="ana-card">
                <div class="ana-card-title"><span class="rpt-ch-num">05</span><i class="el-icon-document-checked"></i> 数据质量与可追溯性</div>
                <div class="rpt-quality-bar">
                  <span class="rpt-quality-score">{{ parkReportProfile.qualityScore }}</span>
                  <span class="rpt-quality-max">/ 5.0</span>
                  <span :class="['qa-grade', 'is-' + parkReportProfile.qualityGrade.toLowerCase()]">{{ parkReportProfile.qualityGrade }}</span>
                  <span class="rpt-quality-desc">加权质量分（按活动数据量加权）</span>
                </div>
                <p class="rpt-desc">
                  本次核算共归集 {{ parkReportProfile.sourceCount }} 个排放源、{{ parkReportProfile.categoryCount }} 个排放类别，
                  低质量项 {{ parkReportProfile.lowCount }} 个。活动数据主要来源于园区数据底座直连计量表、材料凭证 OCR 识别与人工录入，
                  排放因子采用 IPCC 2006、DB11/T 1787、华北区域电网等权威缺省值，全部参数均留存佐证材料，可追溯至原始凭证。
                </p>
              </div>

              <!-- ⑥ 达标差距分析 -->
              <div class="ana-card">
                <div class="ana-card-title"><span class="rpt-ch-num">06</span><i class="el-icon-warning-outline"></i> 达标差距分析</div>
                <div v-if="!parkReportProfile.gaps.length" class="rpt-empty-ok">
                  <i class="el-icon-circle-check"></i> 所有指标均已达标，无差距项
                </div>
                <div v-else class="rpt-gap-list">
                  <div v-for="(g, gi) in parkReportProfile.gaps" :key="gi" class="rpt-gap-item">
                    <div class="rpt-gap-head">
                      <span class="rpt-gap-name">{{ g.name }}</span>
                      <span class="rpt-gap-delta">{{ g.delta }}</span>
                    </div>
                    <div class="rpt-gap-desc">{{ g.desc }}</div>
                  </div>
                </div>
              </div>

              <!-- ⑦ 改进路径与时间表 -->
              <div class="ana-card">
                <div class="ana-card-title"><span class="rpt-ch-num">07</span><i class="el-icon-magic-stick"></i> 改进路径与时间表</div>
                <div class="rpt-plan-list">
                  <div v-for="(p, pi) in parkReportProfile.plans" :key="pi" class="rpt-plan-item">
                    <div class="rpt-plan-phase">{{ p.phase }}</div>
                    <div class="rpt-plan-body">
                      <div class="rpt-plan-title">{{ p.title }}</div>
                      <div class="rpt-plan-desc">{{ p.desc }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ⑧ 自评结论 -->
              <div class="ana-card rpt-conclusion">
                <div class="ana-card-title"><span class="rpt-ch-num">08</span><i class="el-icon-stamp"></i> 自评结论</div>
                <div :class="['rpt-concl-box', parkIndicatorStats.pass === parkIndicatorStats.total ? 'is-pass' : 'is-fail']">
                  <div class="rpt-concl-icon">
                    <i :class="parkIndicatorStats.pass === parkIndicatorStats.total ? 'el-icon-circle-check' : 'el-icon-warning-outline'"></i>
                  </div>
                  <div class="rpt-concl-body">
                    <div class="rpt-concl-title">
                      {{ parkIndicatorStats.pass === parkIndicatorStats.total ? '已达到零碳园区建设标准' : '尚未完全达到零碳园区建设标准' }}
                    </div>
                    <div class="rpt-concl-desc">
                      本次自评共 {{ parkIndicatorStats.total }} 项指标，其中 {{ parkIndicatorStats.pass }} 项达标、
                      {{ parkIndicatorStats.total - parkIndicatorStats.pass }} 项未达标。
                      园区碳排放总量 {{ parkReportProfile.totalWan }} 万吨CO₂，单位能耗碳排放 {{ parkReportProfile.carbonPerTce }} tCO₂/tce。
                    </div>

                </div>
              </div>

            </div>

            <!-- ⑨ 免责声明 -->
            <div class="ana-card rpt-disclaimer">
              <div class="ana-card-title">
                <span class="rpt-ch-num">09</span>
                <i class="el-icon-warning-outline"></i> 免责声明
              </div>
              <ol class="rpt-dis-list">
                <li><b>数据来源与准确性</b>：本报告所引用的活动数据及排放因子均来源于园区数据底座直连计量表、材料凭证 OCR 识别、企业实测记录及公开发布的官方统计数据。系统已尽合理努力确保数据的准确性与完整性，但不对数据源的实时更新及潜在偏差承担保证责任。</li>
                <li><b>核算边界限制</b>：本报告遵循 {{ parkReportProfile.standard }} 规范设定核算边界，采用园区法定地理边界。被取舍的微量排放源（单项 &lt; 1%）或未纳入核算范围的部分可能对结果产生影响。</li>
                <li><b>排放因子时效性</b>：排放因子数据引用 IPCC 2006、DB11/T 1787、华北区域电网 2022 等版本，因子版本更新可能导致数值差异。建议定期核对因子库版本并更新换算基准。</li>
                <li><b>不确定性声明</b>：受数据精度、计量器具误差及统计口径影响，核算结果存在不确定性。指标达标判定为参考性结论，正式达标认定以主管部门组织的专家评审为准。</li>
                <li><b>适用范围</b>：本报告仅适用于 {{ parkReportProfile.parkName }} 在 {{ parkReportProfile.period }} 期间的园区碳排放核算与零碳建设自评，不可直接用于其他园区、其他区域或其他时间周期的碳排放比较。</li>
                <li><b>知识产权</b>：本报告内容受版权保护，未经书面授权不得复制、传播或用于商业用途。报告中的方法论及核算模型归核算方所有。</li>
                <li><b>专家复核</b>：本报告尚未经独立专家复核，若需用于正式披露或法规合规用途，建议委托具备资质的专家进行复核验证。</li>
              </ol>
              <div class="rpt-dis-footer">
                <span>报告生成日期：{{ new Date().toLocaleDateString('zh-CN') }}</span>
                <span>核算引擎版本：ZCIP-Park-Agent v1.0</span>
              </div>
                  </div>

            <!-- 底部按钮栏 -->
            </div>

            <!-- 底部按钮栏 -->
            <div class="stage-confirm-bar src-block-footer">
              <span class="stage-confirm-hint">
                <i class="el-icon-info"></i>
                自评报告已生成，可导出、归档或申请专家复核
              </span>
              <span class="stage-confirm-btns">
                <el-button size="small" type="success" :icon="isReportArchived ? 'el-icon-check' : 'el-icon-folder-checked'" @click="archiveParkReport">
                  {{ isReportArchived ? '已归档至园区碳资产库' : '报告存档' }}
                </el-button>
                <el-dropdown @command="handleExportParkReport" style="margin-left: 8px;">
                  <el-button type="primary" size="small" icon="el-icon-download">
                    报告导出<i class="el-icon-arrow-down el-icon--right"></i>
                  </el-button>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item command="pdf"><i class="el-icon-document"></i> PDF</el-dropdown-item>
                    <el-dropdown-item command="word"><i class="el-icon-document-add"></i> Word</el-dropdown-item>
                    <el-dropdown-item command="xlsx"><i class="el-icon-s-order"></i> 明细 Excel</el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
                <el-button size="small" icon="el-icon-s-check" plain @click="handleExpertReview">专家复核</el-button>
              </span>
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
              <!-- 阶段7：碳排放计算 -->
              <!-- 阶段7：碳排放计算 -->
              <!-- 阶段7：碳排放计算（树形，只显示值与结果） -->
              <template v-if="currentStepIndex === 6">
                <div class="parsing-section qa-park-section">

                  <!-- 顶部总量 -->
                  <div class="calc-total-bar">
                    <div class="calc-total-left">
                      <i class="el-icon-finished"></i>
                      <span class="calc-total-label">园区碳排放总量</span>
                      <div class="calc-total-value">
                        <strong>{{ parkEmissionCalc.total.toFixed(1) }}</strong>
                        <span class="calc-total-unit">tCO₂</span>
                        <span class="calc-total-eq">≈ {{ parkEmissionCalc.totalWan }} 万吨CO₂</span>
                      </div>
                    </div>
                    <div class="calc-total-kpis">
                      <span class="ctk-item"><em>综合能耗</em><b>{{ parkTotalEnergy.toFixed(0) }}</b> tce</span>
                      <span class="ctk-item"><em>单位能耗碳排放</em><b>{{ parkCarbonPerTce.toFixed(3) }}</b> tCO₂/tce</span>
                    </div>
                  </div>

                  <!-- 树形表格 -->
                  <div class="src-block-scroll">
                    <div class="s7-tree">
                      <div class="s7-thead">
                        <span class="s7-th-name">名称</span>
                        <span class="s7-th-em">排放量 (tCO₂)</span>
                      </div>

                      <div v-for="cat in parkCalcTree.groups" :key="cat.key" class="s7-group">
                        <div class="s7-row s7-cat-row" @click="toggleCalcTree(cat.key)">
                          <span class="s7-arrow" :class="{ 'is-open': isCalcTreeOpen(cat.key) }">▶</span>
                          <i :class="[cat.icon, 's7-icon']" :style="{ color: cat.color }"></i>
                          <span class="s7-name">{{ cat.name }}</span>
                          <span class="s7-count">{{ cat.sources.length }} 项</span>
                          <span class="s7-em">{{ cat.emission === null ? '—' : fmt2(cat.emission) }}</span>
                        </div>

                        <div v-show="isCalcTreeOpen(cat.key)" class="s7-children">
                          <div v-for="src in cat.sources" :key="src.key" class="s7-group">
                            <div class="s7-row s7-src-row" @click.stop="toggleCalcTree(src.key)">
                              <span class="s7-arrow" :class="{ 'is-open': isCalcTreeOpen(src.key) }">▶</span>
                              <i class="el-icon-document s7-icon"></i>
                              <span class="s7-name">{{ src.name }}</span>
                              <span class="s7-em" :class="{ 'is-ind': src.isIndicator }">
                                {{ src.isIndicator ? src.emission : fmt2(src.emission) }} <small v-if="src.emissionUnit">{{ src.emissionUnit }}</small>
                              </span>
                            </div>

                            <div v-show="isCalcTreeOpen(src.key)" class="s7-children">
                              <div v-for="(pp, pi) in src.params" :key="pi" class="s7-prow">
                                <span class="s7-pname">
                                  <i :class="['param-sym', pp.key === 'CEF' ? 'is-cef' : 'is-ef']">{{ pp.key }}</i>
                                  {{ pp.label }}
                                </span>
                                <span class="s7-pval">{{ pp.value }} <small>{{ pp.unit }}</small></span>
                                <span class="s7-psrc">{{ pp.source || '—' }}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  <!-- 底部固定栏 -->
                  <div class="stage-confirm-bar src-block-footer">
                    <span class="stage-confirm-hint">
                      <i class="el-icon-info"></i>
                      按四大法定分类逐项计算结果，点击分类或排放源可展开查看参数
                    </span>
                    <span class="stage-confirm-btns">
                      <el-button size="small" icon="el-icon-download" @click="exportParkCalc">导出计算结果</el-button>
                      <el-button type="primary" size="small" icon="el-icon-check" @click="currentStepIndex = 7">进入排放分析</el-button>
                    </span>
                  </div>

                </div>
              </template>

              <!-- 阶段3：行内编辑模式 -->
              <template v-else-if="currentStepIndex === 2">
                <div class="src-list-section src-four-blocks">

                  <!-- 子页签 -->
                  <div class="src-subtabs src-block-fixed">
                    <div :class="['src-subtab', { active: stage3SubTab === 'sources' }]" @click="stage3SubTab = 'sources'">
                      <i class="el-icon-s-order"></i> 碳排放源清单
                      <span class="src-subtab-count">{{ emissionSourceStats.total }}</span>
                    </div>
                    <div :class="['src-subtab', { active: stage3SubTab === 'ledgers' }]" @click="stage3SubTab = 'ledgers'">
                      <i class="el-icon-document"></i> 其他计算参数清单
                      <span class="src-subtab-count">{{ indicatorParamStats.total }}</span>
                    </div>
                  </div>

                  <div class="src-block-scroll">
<!-- ① 碳排放源清单 -->
                  <div v-show="stage3SubTab === 'sources'">



                  <!-- 底座数据同步提示 -->
          <div v-if="baseSyncDone" class="src-sync-banner is-done">
            <i class="el-icon-circle-check"></i>
            <span>已从数据底座同步 <b>{{ baseSyncCount }}</b> 项排放源（底座数据识别），其余可通过上传材料或手动添加补充</span>
          </div>

          <!-- 分组列表 -->
                  <div class="src-group-list">
                    <div v-for="g in groupedEmissionSources" :key="g.key" class="src-group">
                      <div class="src-group-head">
                        <i :class="[g.icon, 'src-group-icon']" :style="{ color: g.color }"></i>
                        <span class="src-group-name">{{ g.key }}</span>
                        <span class="src-group-count">{{ g.total }} 项</span>
                        <span v-if="g.platformCount" class="src-channel-badge is-platform">底座数据识别 {{ g.platformCount }}</span>
                        <span v-if="g.ocrCount" class="src-channel-badge is-ocr">材料识别 {{ g.ocrCount }}</span>
                        <el-button size="mini" type="text" class="src-add-btn" icon="el-icon-plus" @click="openAddSource(g.key)">添加排放源</el-button>
                      </div>
                      <div class="src-item-list">
                        <div v-for="src in g.items" :key="src.id" class="src-item" :class="{ 'is-disabled': !src.enabled }">
                          <div class="src-item-main">
                            <span class="src-item-name">{{ src.name }}</span>
                            <span :class="['src-item-role', src.role === 'input' ? 'is-input' : (src.role === 'output' ? 'is-output' : 'is-both')]">
              {{ src.roleLabel }}
            </span>
            <span :class="['src-item-channel', src.channel === '底座数据识别' ? 'is-platform' : (src.channel === '手动添加' ? 'is-manual' : 'is-ocr')]">{{ src.channel }}</span>
                          </div>
<!-- 输入项 / 输出项（仅能源加工转换、净购入电力热力） -->
            <div v-if="src.role === 'both' || src.inputs || src.outputs" class="src-io-block">
              <!-- 输入项 -->
              <div class="src-io-group">
                <div class="src-io-head">
                  <span class="src-io-label is-input"><i class="el-icon-bottom-right"></i> 输入项</span>
                  <span class="src-io-count">{{ (src.inputs || []).length }}</span>
                  <el-button size="mini" type="text" class="src-io-add" icon="el-icon-plus" @click.stop="addSourceIO(src, 'inputs')">添加输入</el-button>
                </div>
                <div v-if="(src.inputs || []).length" class="src-io-list">
                  <div v-for="(io, idx) in src.inputs" :key="io.id" class="src-io-item">
                    <el-select v-model="io.name" size="mini" filterable allow-create class="src-io-name" placeholder="选择物料/能源">
                      <el-option v-for="mt in materialLibrary" :key="'in-' + mt" :label="mt" :value="mt"></el-option>
                    </el-select>
                    
                    <i class="el-icon-close src-io-del" @click.stop="removeSourceIO(src, 'inputs', idx)"></i>
                  </div>
                </div>
                <div v-else class="src-io-empty">暂无输入项</div>
              </div>

              <!-- 输出项 -->
              <div class="src-io-group">
                <div class="src-io-head">
                  <span class="src-io-label is-output"><i class="el-icon-top-right"></i> 输出项</span>
                  <span class="src-io-count">{{ (src.outputs || []).length }}</span>
                  <el-button size="mini" type="text" class="src-io-add" icon="el-icon-plus" @click.stop="addSourceIO(src, 'outputs')">添加输出</el-button>
                </div>
                <div v-if="(src.outputs || []).length" class="src-io-list">
                  <div v-for="(io, idx) in src.outputs" :key="io.id" class="src-io-item">
                    <el-select v-model="io.name" size="mini" filterable allow-create class="src-io-name" placeholder="选择物料/能源">
                      <el-option v-for="mt in materialLibrary" :key="'out-' + mt" :label="mt" :value="mt"></el-option>
                    </el-select>
                    
                    <i class="el-icon-close src-io-del" @click.stop="removeSourceIO(src, 'outputs', idx)"></i>
                  </div>
                </div>
                <div v-else class="src-io-empty">暂无输出项</div>
              </div>
            </div>
                          <div class="src-item-actions">
                            <el-button size="mini" type="text" icon="el-icon-edit" @click.stop="openEditSource(src)">编辑</el-button>
                            <el-button size="mini" type="text" icon="el-icon-delete" @click.stop="removeEmissionSource(src)">删除</el-button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  </div><!-- /sources -->

                  <!-- ② 其他计算参数清单 -->
                  <div v-show="stage3SubTab === 'ledgers'" class="param-list-section">

                    <div class="param-group-list">
                      <div v-for="g in indicatorParamList" :key="g.key" class="param-group">
                        <div class="param-group-head">
                          <span :class="['param-type-badge', g.type === 'core' ? 'is-core' : 'is-guided']">
                            {{ g.type === 'core' ? '核心指标' : '引导指标' }}
                          </span>
                          <span class="param-group-name">{{ g.name }}</span>
                          <span class="param-group-count">{{ g.params.length }} 个输入参数</span>
                        </div>
                        <div class="param-item-list">
                          <div v-for="p in g.params" :key="p.id" class="param-item">
                            <div class="param-item-main">
                              <span class="param-item-name">{{ p.name }}</span>
                              <span v-if="p.channel === '系统汇总'" class="param-channel-tag is-sys">{{ p.channel }}</span>
                            </div>
                            <div class="param-item-detail" v-if="p.channelDetail">{{ p.channelDetail }}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="src-foot-hint">
                      <i class="el-icon-info"></i>
                      <span>系统汇总参数由前序阶段自动汇总；材料识别参数需上传佐证材料；底座参数由数据底座直连</span>
                    </div>
                  </div>

                  <!-- ② end -->
                  </div><!-- /src-block-scroll 滚动区结束 -->

          

        <!-- 底部固定栏 -->
                  <div class="stage-confirm-bar src-block-footer">
                    <span class="stage-confirm-hint">
                      <i class="el-icon-info"></i>
                      按四大法定分类维护排放源清单与指标底账
                    </span>
                    <span class="stage-confirm-btns">
                      <el-button size="small" @click="stage3SubTab = 'sources'">取消</el-button>
                      <el-button type="primary" size="small" icon="el-icon-check" @click="confirmStage3">
                        确认边界无误后启动多源数据收集
                      </el-button>
                    </span>
                  </div>
                  </div><!-- /src-list-section -->
              </template>
              <!-- 阶段4：活动数据 -->
              <!-- 阶段4：活动数据 -->
              <!-- 阶段4：活动数据 -->
              <!-- 阶段4：活动数据 -->
              <template v-else-if="currentStepIndex === 3">
                <div class="src-list-section src-four-blocks">

                  <!-- 顶部统计 -->
                  <div class="src-subtabs">
                    <div class="act-header">
                      <i class="el-icon-s-data"></i>
                      <span class="act-header-title">活动数据采集</span>
                      <span class="act-header-stat">已确认 <b>{{ activityStats.verified }}</b> / 共 {{ activityStats.total }} 个参数</span>
                    </div>
                  </div>

                  <!-- 内容滚动区 -->
                  <div class="src-block-scroll">
                    <div class="act-group-list">
                      <div v-for="g in groupedActivityData" :key="g.key" class="act-group">
                          <div class="act-group-head">
                        <i :class="[g.icon, 'act-group-icon']" :style="{ color: g.color }"></i>
                        <span class="act-group-name">{{ g.key }}</span>
                        <span class="act-group-count">{{ g.total }} 项 · {{ g.paramTotal }} 参数</span>
                          </div>

                          <div v-for="src in g.items" :key="src.id" class="act-source">
                              <div class="act-source-head">
                                <span class="act-source-name">{{ src.name }}</span>
                              </div>

                              <!-- 三层：直接参数表 -->
                              <div v-if="src.params && src.params.length">
                        <div class="param-table">
                          <div class="param-tr param-th">
                            <span class="col-name">参数名称</span>
                            <span class="col-value ta-r">参数值</span>
                            <span class="col-raw ta-c">原始值</span>
                            <span class="col-src">来源 · 佐证材料</span>
                            <span class="col-status">状态</span>
                          </div>
                          <div v-for="pp in src.params" :key="pp.key"
                            :data-pid="'act-' + src.id + '-' + pp.key"
                            :class="['param-tr', 'param-row', 'is-clickable-row', { 'row-highlight': highlightPid === ('act-' + src.id + '-' + pp.key) }]"
                            @click="openActTrace(pp, src, null, 'single')">
                            <span class="col-name">
                              <i class="param-sym is-ad">{{ pp.key }}</i> {{ pp.label }}
                            </span>
                            <span class="col-value ta-r">
                              <el-input v-model="pp.value" size="mini" class="act-inline-input" @click.native.stop></el-input>
                              <span class="param-unit">{{ pp.unit || '' }}</span>
                            </span>
                            <span class="col-raw ta-c param-raw">
                              <template v-if="pp.rawValue !== undefined && pp.rawValue !== ''">
                                {{ pp.rawValue }}<small class="param-raw-unit" v-if="pp.rawUnit"> {{ pp.rawUnit }}</small>
                              </template>

                              <span v-else class="param-raw-unknown">—</span>
                            </span>
                            <span class="col-src">
                              <span class="param-src" :title="pp.source">{{ pp.source || '—' }}</span>
                            </span>
                            <span class="col-status">
                              <span v-if="pp.readonly && !pp.value" class="param-tag-computing" title="系统汇总参数，待计算后自动生成">待计算</span>
                              <span v-else-if="pp.verified" class="param-tag-confirmed is-clickable" @click.stop="toggleParamVerified(pp)">
                                <i class="el-icon-check"></i> 已确认
                                <i v-show="!pp.source" class="el-icon-warning-outline param-status-warn"></i>
                              </span>
                              <span v-else class="param-tag-pending is-clickable" @click.stop="toggleParamVerified(pp)">待确认</span>
                              <el-tooltip v-if="!pp.source" :content="'数据来源待补充'" placement="top">
                                <i class="param-issue-icon is-warn">!</i>
                              </el-tooltip>
                            </span>
                          </div>
                        </div>
                              </div>

                              <!-- 输入分组 -->
                              <div v-if="src.inputs && src.inputs.length" class="io-section">
                          <div class="io-section-label is-input"><i class="el-icon-bottom-right"></i> 输入</div>
                          <div v-for="mat in src.inputs" :key="mat.id" class="io-material">
                            <div class="io-material-name">{{ mat.name }}</div>
                            <div class="param-table">
                              <div class="param-tr param-th">
                                <span class="col-name">参数名称</span>
                                <span class="col-value ta-r">参数值</span>
                                <span class="col-raw ta-c">原始值</span>
                                <span class="col-src">来源 · 佐证材料</span>
                                <span class="col-status">状态</span>
                              </div>
                              <div v-for="pp in mat.params" :key="pp.key"
                            :data-pid="'act-' + src.id + '-' + pp.key"
                            :class="['param-tr', 'param-row', 'is-clickable-row', { 'row-highlight': highlightPid === ('act-' + src.id + '-' + pp.key) }]"
                            @click="openActTrace(pp, src, mat, 'input')">
                                <span class="col-name">
                                  <i class="param-sym is-ad">{{ pp.key }}</i> {{ pp.label }}
                                </span>
                                <span class="col-value ta-r">
                                  <el-input v-model="pp.value" size="mini" class="act-inline-input" @click.native.stop></el-input>
                                  <span class="param-unit">{{ pp.unit || '' }}</span>
                                </span>
                                <span class="col-raw ta-c param-raw">
                                  <template v-if="pp.rawValue !== undefined && pp.rawValue !== ''">
                                    {{ pp.rawValue }}<small class="param-raw-unit" v-if="pp.rawUnit"> {{ pp.rawUnit }}</small>
                                  </template>
                                  <span v-else class="param-raw-unknown">—</span>
                                </span>
                                <span class="col-src">
                                  <span class="param-src" :title="pp.source">{{ pp.source || '—' }}</span>
                                </span>
                                <span class="col-status">
                                  <span v-if="pp.verified" class="param-tag-confirmed is-clickable"
                                    :title="pp.source ? '点击取消确认' : '数据来源待核，点击取消确认'"
                                    @click.stop="toggleParamVerified(pp)">
                                    <i class="el-icon-check"></i> 已确认
                                    <i v-show="!pp.source" class="el-icon-warning-outline param-status-warn"></i>
                                  </span>
                                  <span v-if="!(pp.readonly && !pp.value) && !pp.verified" class="param-tag-pending is-clickable"
                                    title="点击确认为已确认" @click.stop="toggleParamVerified(pp)">
                                    待确认
                                  </span>
                                  <el-tooltip v-if="!pp.source" :content="'数据来源待补充'" placement="top">
                                    <i class="param-issue-icon is-warn">!</i>
                                  </el-tooltip>
                                </span>
                              </div>
                            </div>
                          </div>
                              </div>

                              <!-- 输出分组 -->
                              <div v-if="src.outputs && src.outputs.length" class="io-section">
                          <div class="io-section-label is-output"><i class="el-icon-top-right"></i> 输出</div>
                          <div v-for="mat in src.outputs" :key="mat.id" class="io-material">
                            <div class="io-material-name">{{ mat.name }}</div>
                            <div class="param-table">
                              <div class="param-tr param-th">
                                <span class="col-name">参数名称</span>
                                <span class="col-value ta-r">参数值</span>
                                <span class="col-raw ta-c">原始值</span>
                                <span class="col-src">来源 · 佐证材料</span>
                                <span class="col-status">状态</span>
                              </div>
                              <div v-for="pp in mat.params" :key="pp.key"
                            :data-pid="'act-' + src.id + '-' + pp.key"
                            :class="['param-tr', 'param-row', 'is-clickable-row', { 'row-highlight': highlightPid === ('act-' + src.id + '-' + pp.key) }]"
                            @click="openActTrace(pp, src, mat, 'output')">
                                <span class="col-name">
                                  <i class="param-sym is-ad">{{ pp.key }}</i> {{ pp.label }}
                                </span>
                                <span class="col-value ta-r">
                                  <el-input v-model="pp.value" size="mini" class="act-inline-input" @click.native.stop></el-input>
                                  <span class="param-unit">{{ pp.unit || '' }}</span>
                                </span>
                                <span class="col-raw ta-c param-raw">
                                  <template v-if="pp.rawValue !== undefined && pp.rawValue !== ''">
                                    {{ pp.rawValue }}<small class="param-raw-unit" v-if="pp.rawUnit"> {{ pp.rawUnit }}</small>
                                  </template>
                                  <span v-else class="param-raw-unknown">—</span>
                                </span>
                                <span class="col-src">
                                  <span class="param-src" :title="pp.source">{{ pp.source || '—' }}</span>
                                </span>
                                <span class="col-status">
                                  <span v-if="pp.verified" class="param-tag-confirmed is-clickable"
                                    :title="pp.source ? '点击取消确认' : '数据来源待核，点击取消确认'"
                                    @click.stop="toggleParamVerified(pp)">
                                    <i class="el-icon-check"></i> 已确认
                                    <i v-show="!pp.source" class="el-icon-warning-outline param-status-warn"></i>
                                  </span>
                                  <span v-if="!(pp.readonly && !pp.value) && !pp.verified" class="param-tag-pending is-clickable"
                                    title="点击确认为已确认" @click.stop="toggleParamVerified(pp)">
                                    待确认
                                  </span>
                                  <el-tooltip v-if="!pp.source" :content="'数据来源待补充'" placement="top">
                                    <i class="param-issue-icon is-warn">!</i>
                                  </el-tooltip>
                                </span>
                              </div>
                            </div>
                          </div>
                              </div>
                          </div>
                      </div>
                    </div>

                    <!-- 其他计算参数（指标计算输入） -->
                    <div class="act-group ind-section">
                      <div class="act-group-head">
                        <i class="el-icon-s-marketing act-group-icon" style="color:#8b5cf6"></i>
                        <span class="act-group-name">其他计算参数</span>
                        <span class="act-group-count">{{ indicatorParamListWithAuto.length }} 项指标 · {{ indicatorParamStats2.total }} 参数</span>
                      </div>

                      <div class="ind-group-list">
                        <div v-for="g in indicatorParamListWithAuto" :key="g.key" class="act-source">
                            <div class="act-source-head">
                          <span :class="['ind-type-badge', g.type === 'core' ? 'is-core' : 'is-guided']">{{ g.type === 'core' ? '核心指标' : '引导指标' }}</span>
                          <span class="act-source-name">{{ g.name }}</span>
                            </div>

                            <div class="param-table">
                                <div class="param-tr param-th">
                            <span class="col-name">参数名称</span>
                            <span class="col-value ta-r">参数值</span>
                            <span class="col-raw ta-c">原始值</span>
                            <span class="col-src">来源 · 佐证材料</span>
                            <span class="col-status">状态</span>
                                </div>
                                <div v-for="pp in g.params" :key="pp.id"
                            :data-pid="'ind-' + pp.id"
                            :class="['param-tr', 'param-row', { 'is-readonly-row': pp.readonly, 'row-highlight': highlightPid === ('ind-' + pp.id) }]"
                            @click="openActTrace(pp, { name: g.name, category: '指标参数', channel: pp.channel }, null, 'single')">
                                    <span class="col-name">
                              <i class="param-sym is-ad">AD</i> {{ pp.name }}
                                    </span>
                                    <span class="col-value ta-r" @click.stop>
                                        <template v-if="pp.readonly">
                                <span class="ind-value-readonly">{{ pp.value || '待汇总' }}</span>
                                        </template>
                                        <template v-else>
                                <el-input v-model="pp.value" size="mini" class="act-inline-input" @click.native.stop></el-input>
                                        </template>
                                        <span class="param-unit">{{ pp.unit || '' }}</span>
                                    </span>
                                    <span class="col-raw ta-c param-raw">
                                        <template v-if="pp.rawValue !== undefined && pp.rawValue !== ''">
                                          {{ pp.rawValue }}<small class="param-raw-unit" v-if="pp.rawUnit"> {{ pp.rawUnit }}</small>
                                        </template>
                                        <span v-else class="param-raw-unknown">—</span>
                                    </span>
                                    <span class="col-src">
                                        <span class="param-src" :title="pp.source">{{ pp.source || '—' }}</span>
                                    </span>
                                    <span class="col-status">
                                        <span v-if="pp.readonly && !pp.value" class="param-tag-computing" title="系统汇总参数，待计算后自动生成">待计算</span>
                                        <span v-else-if="pp.verified" class="param-tag-confirmed is-clickable" @click.stop="toggleParamVerified(pp)">
                                <i class="el-icon-check"></i> 已确认
                                        </span>
                                        <span v-if="!(pp.readonly && !pp.value) && !pp.verified" class="param-tag-pending is-clickable" @click.stop="toggleParamVerified(pp)">待确认</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 底部固定栏 -->
                  <div class="stage-confirm-bar src-block-footer">
                    <span class="stage-confirm-hint"><i class="el-icon-info"></i> 待确认 {{ activityStats.pending }} 个参数，全部确认后可进入排放因子匹配</span>
                    <span class="stage-confirm-btns">
                      <el-button size="small" icon="el-icon-right" :disabled="activityStats.pending === 0" @click="gotoNextPending">
                        下一个待确认（{{ activityStats.pending }}）
                      </el-button>
                      <el-button v-if="activityStats.pending === 0" type="primary" size="small" icon="el-icon-check" @click="confirmActivityData">确认数据，进入因子匹配</el-button>
                    </span>
                  </div>
                </div>
              </template>

              <!-- 阶段5：排放因子匹配 -->
              <!-- 阶段5：排放因子匹配 -->
              <template v-else-if="currentStepIndex === 4">
                <div class="src-list-section src-four-blocks">

                  <!-- 顶部统计 -->
                  <div class="src-subtabs">
                    <div class="act-header">
                      <i class="el-icon-connection"></i>
                      <span class="act-header-title">排放因子匹配</span>
                      <span class="act-header-stat">已确认 <b>{{ factorMatchStats.verified }}</b> / 共 {{ factorMatchStats.total }} 个因子</span>
                    </div>
                  </div>

                  <!-- 内容滚动区 -->
                  <div class="src-block-scroll">
                    <div class="act-group-list">
                      <div v-for="g in groupedFactorMatch" :key="g.key" class="act-group">
                          <div class="act-group-head">
                        <i :class="[g.icon, 'act-group-icon']" :style="{ color: g.color }"></i>
                        <span class="act-group-name">{{ g.key }}</span>
                        <span class="act-group-count">{{ g.total }} 项 · {{ g.factorTotal }} 因子</span>
                          </div>

                          <div v-for="src in g.items" :key="src.id" class="act-source">
                              <div class="act-source-head">
                                <span class="act-source-name">{{ src.name }}</span>
                              </div>

                              <!-- A. 单一因子（化石燃料 / 净购入电力热力 / 工业过程） -->
                              <div v-if="src.factors && src.factors.length">
                        <div class="param-table">
                          <div class="param-tr param-th">
                            <span class="col-name">参数名称</span>
                            <span class="col-value ta-r">参数值</span>
                            <span class="col-raw ta-c">原始值</span>
                            <span class="col-src">来源 · 佐证材料</span>
                            <span class="col-status">状态</span>
                          </div>
                          <div v-for="ff in src.factors" :key="ff.key" class="param-tr param-row is-clickable-row"
                            :data-pid="'fac-' + src.id + '-' + ff.key"
                            @click="openFactorTrace(ff, src)">
                            <span class="col-name">
                              <i :class="['param-sym', ff.key === 'CEF' ? 'is-cef' : 'is-ef']">{{ ff.key }}</i> {{ ff.name }}
                            </span>
                            <span class="col-value ta-r" @click.stop>
                              <el-input v-model="ff.value" size="mini" class="act-inline-input" @click.native.stop></el-input>
                              <span class="param-unit">{{ ff.unit }}</span>
                            </span>
                            <span class="col-raw ta-c param-raw">
                              <template v-if="ff.rawValue">{{ ff.rawValue }}<small class="param-raw-unit" v-if="ff.rawUnit"> {{ ff.rawUnit }}</small></template>
                              <span v-else class="param-raw-unknown">—</span>
                            </span>
                            <span class="col-src">
                              <span class="param-src" :title="ff.sourceDetail || ff.source">{{ ff.source }}</span>
                            </span>
                            <span class="col-status" @click.stop>
                              <span v-if="ff.verified" class="param-tag-confirmed is-clickable" @click.stop="toggleFactorVerified(ff)">
                                <i class="el-icon-check"></i> 已确认
                              </span>
                              <span v-else class="param-tag-pending is-clickable" @click.stop="toggleFactorVerified(ff)">待确认</span>
                            </span>
                          </div>
                        </div>
                              </div>

                              <!-- B. 输入分组（能源加工转换） -->
                              <div v-if="src.inputs && src.inputs.length" class="io-section">
                                  <div class="io-section-label is-input"><i class="el-icon-bottom-right"></i> 投入</div>
                                  <div v-for="mat in src.inputs" :key="mat.id" class="io-material">
                            <div class="io-material-name">{{ mat.name }}</div>
                            <div class="param-table">
                              <div class="param-tr param-th">
                                <span class="col-name">参数名称</span>
                                <span class="col-value ta-r">参数值</span>
                                <span class="col-raw ta-c">原始值</span>
                                <span class="col-src">来源 · 佐证材料</span>
                                <span class="col-status">状态</span>
                              </div>
                              <div v-for="ff in mat.factors" :key="ff.key" class="param-tr param-row is-clickable-row"
                                :data-pid="'fac-' + src.id + '-' + mat.id + '-' + ff.key"
                                @click="openFactorTrace(ff, src)">
                                <span class="col-name">
                                  <i :class="['param-sym', ff.key === 'CEF' ? 'is-cef' : 'is-ef']">{{ ff.key }}</i> {{ ff.name }}
                                </span>
                                <span class="col-value ta-r" @click.stop>
                                  <el-input v-model="ff.value" size="mini" class="act-inline-input" @click.native.stop></el-input>
                                  <span class="param-unit">{{ ff.unit }}</span>
                                </span>
                                <span class="col-raw ta-c param-raw">
                                  <template v-if="ff.rawValue">{{ ff.rawValue }}<small class="param-raw-unit" v-if="ff.rawUnit"> {{ ff.rawUnit }}</small></template>
                                  <span v-else class="param-raw-unknown">—</span>
                                </span>
                                <span class="col-src">
                                  <span class="param-src" :title="ff.sourceDetail || ff.source">{{ ff.source }}</span>
                                </span>
                                <span class="col-status" @click.stop>
                                  <span v-if="ff.verified" class="param-tag-confirmed is-clickable" @click.stop="toggleFactorVerified(ff)">
                                    <i class="el-icon-check"></i> 已确认
                                  </span>
                                  <span v-else class="param-tag-pending is-clickable" @click.stop="toggleFactorVerified(ff)">待确认</span>
                                </span>
                              </div>
                            </div>
                                  </div>
                              </div>

                              <!-- C. 产出分组（能源加工转换） -->
                              <div v-if="src.outputs && src.outputs.length" class="io-section">
                                  <div class="io-section-label is-output"><i class="el-icon-top-right"></i> 产出（计算时扣减）</div>
                                  <div v-for="mat in src.outputs" :key="mat.id" class="io-material">
                            <div class="io-material-name">{{ mat.name }}</div>
                            <div class="param-table">
                              <div class="param-tr param-th">
                                <span class="col-name">参数名称</span>
                                <span class="col-value ta-r">参数值</span>
                                <span class="col-raw ta-c">原始值</span>
                                <span class="col-src">来源 · 佐证材料</span>
                                <span class="col-status">状态</span>
                              </div>
                              <div v-for="ff in mat.factors" :key="ff.key" class="param-tr param-row is-clickable-row"
                                :data-pid="'fac-' + src.id + '-' + mat.id + '-' + ff.key"
                                @click="openFactorTrace(ff, src)">
                                <span class="col-name">
                                  <i :class="['param-sym', ff.key === 'CEF' ? 'is-cef' : 'is-ef']">{{ ff.key }}</i> {{ ff.name }}
                                </span>
                                <span class="col-value ta-r" @click.stop>
                                  <el-input v-model="ff.value" size="mini" class="act-inline-input" @click.native.stop></el-input>
                                  <span class="param-unit">{{ ff.unit }}</span>
                                </span>
                                <span class="col-raw ta-c param-raw">
                                  <template v-if="ff.rawValue">{{ ff.rawValue }}<small class="param-raw-unit" v-if="ff.rawUnit"> {{ ff.rawUnit }}</small></template>
                                  <span v-else class="param-raw-unknown">—</span>
                                </span>
                                <span class="col-src">
                                  <span class="param-src" :title="ff.sourceDetail || ff.source">{{ ff.source }}</span>
                                </span>
                                <span class="col-status" @click.stop>
                                  <span v-if="ff.verified" class="param-tag-confirmed is-clickable" @click.stop="toggleFactorVerified(ff)">
                                    <i class="el-icon-check"></i> 已确认
                                  </span>
                                  <span v-else class="param-tag-pending is-clickable" @click.stop="toggleFactorVerified(ff)">待确认</span>
                                </span>
                              </div>
                            </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                    </div>
                  </div>

                  <!-- 底部固定栏 -->
                  <div class="stage-confirm-bar src-block-footer">
                    <span class="stage-confirm-hint">
                      <i class="el-icon-info"></i>
                      待确认 {{ factorMatchStats.pending }} 个因子，全部确认后可进入数据校验
                    </span>
                    <span class="stage-confirm-btns">
                      <el-button v-if="factorMatchStats.pending > 0" size="small" icon="el-icon-right" @click="gotoNextPendingFactor">
                        下一个待确认（{{ factorMatchStats.pending }}）
                      </el-button>
                      <el-button v-if="factorMatchStats.pending === 0" type="primary" size="small" icon="el-icon-check" @click="confirmFactorMatch">
                        确认因子，进入数据校验
                      </el-button>
                    </span>
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
                          <div :class="['io-bubble', { 'emission-bubble': currentStepIndex === 6, 'product-flow-bubble': inp.flowType === 'product', 'byproduct-bubble': inp.productSubType === 'by_product' }]" :title="currentStepIndex >= 3 ? (currentStepIndex === 6 ? `${inp.name}: ${getEmissionValue(proc.name, inp.name, true)} kgCO₂e` : `${inp.name}: ${inp.value}${inp.unit}`) : inp.name">
                            <span class="io-name">{{ inp.name }}</span>
                            <span class="io-type-tag" v-if="inp.listType" :style="{ color: getListTypeColor(inp.listType), borderColor: getListTypeColor(inp.listType) }">{{ getListTypeLabel(inp.listType) }}</span>
                            <span class="io-val" v-if="currentStepIndex >= 3">
                              <span v-if="currentStepIndex === 6">{{ getEmissionValue(proc.name, inp.name, true) }}<small> kgCO₂e</small></span>
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
                            <!-- 分配规则偏离全局时，显示备注 -->
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

          <!-- 统一悬浮确认栏（仅阶段1、2 使用；阶段3~9 已各自有专属底部栏） -->
          <div v-if="stageConfirmConfig && (currentStepIndex === 0 || currentStepIndex === 1)" class="stage-confirm-bar">
            <span class="stage-confirm-hint"><i class="el-icon-info"></i> {{ stageConfirmConfig.hint }}</span>
            <el-button type="primary" size="small" :icon="stageConfirmConfig.icon" :disabled="isTyping" @click="stageConfirmConfig.action">{{ stageConfirmConfig.label }}</el-button>
          </div>
        </div>
        <!-- sidebar-lower闭合 -->
      </aside>
    </div>
    </div><!-- task-active-mode 闭合 -->

    <!-- 因子库选择对话框 -->

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

    <!-- 阶段5 因子详情抽屉 -->
    <el-drawer :visible.sync="factorTraceVisible" direction="rtl" size="520px" append-to-body custom-class="trace-drawer" :show-close="false">
      <div class="trace-custom-header">
        <div class="trace-custom-title">
          <i class="el-icon-connection"></i>
          <span>因子详情</span>
        </div>
        <i class="el-icon-close trace-close" @click="factorTraceVisible = false"></i>
      </div>

      <div v-if="factorTraceRow" class="trace-body">
        <!-- 头部 -->
        <div class="trace-head">
          <div class="trace-head-icon"><i class="el-icon-connection"></i></div>
          <div class="trace-head-info">
            <div class="trace-title">{{ factorTraceRow.sourceName }}</div>
            <div class="trace-sub">{{ factorTraceRow.category }} · {{ factorTraceRow.channel }}</div>
          </div>
        </div>

        <!-- ① 参数信息 -->
        <div class="trace-card">
          <div class="trace-card-title"><i class="el-icon-data-line"></i> 参数信息</div>
          <div class="trace-kv">
            <span class="trace-k">参数名称</span>
            <span class="trace-v">
              <i :class="['param-sym', factorTraceRow.key === 'CEF' ? 'is-cef' : 'is-ef']">{{ factorTraceRow.key }}</i>
              {{ factorTraceRow.name }}
            </span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">当前值</span>
            <span class="trace-v">
              <el-input v-model="factorTraceRow.value" size="mini" style="width:110px;"></el-input>
              <span class="param-unit" style="margin-left:6px;">{{ factorTraceRow.unit }}</span>
            </span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">所属类别</span>
            <span class="trace-v">{{ factorTraceRow.category }}</span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">数据渠道</span>
            <span class="trace-v">{{ factorTraceRow.channel }}</span>
          </div>
        </div>

        <!-- ② 因子来源 -->
        <div class="trace-card">
          <div class="trace-card-title"><i class="el-icon-link"></i> 因子来源</div>
          <div class="trace-kv">
            <span class="trace-k">来源库</span>
            <span class="trace-v">{{ factorTraceRow.source || '—' }}</span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">匹配置信度</span>
            <span class="trace-v">
              <span :class="['trace-quality-badge', factorTraceRow.confidence === '高' ? 'is-high' : (factorTraceRow.confidence === '低' ? 'is-low' : 'is-mid')]">
                {{ factorTraceRow.confidence }}
              </span>
            </span>
          </div>
          <div class="trace-kv" v-if="factorTraceRow.sourceDetail">
            <span class="trace-k">取值依据</span>
            <span class="trace-v trace-v-note">{{ factorTraceRow.sourceDetail }}</span>
          </div>
        </div>

        <!-- ③ 数据质量 -->
        <div class="trace-card">
          <div class="trace-card-title"><i class="el-icon-medal"></i> 数据质量</div>
          <div class="trace-kv">
            <span class="trace-k">质量评级</span>
            <span class="trace-v">
              <span :class="['trace-quality-badge', factorTraceRow.quality.cls]">{{ factorTraceRow.quality.level }}</span>
            </span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">评级依据</span>
            <span class="trace-v">{{ factorTraceRow.quality.note }}</span>
          </div>
        </div>

        <!-- ④ 佐证材料 -->
        <div class="trace-card">
          <div class="trace-card-title"><i class="el-icon-paperclip"></i> 佐证材料</div>
          <div v-if="factorTraceRow.proofFiles && factorTraceRow.proofFiles.length" class="proof-file-list">
            <div v-for="(f, fi) in factorTraceRow.proofFiles" :key="fi" class="proof-file-item">
              <i :class="proofFileIcon(f.name)"></i>
              <span class="proof-file-name" :title="f.name">{{ f.name }}</span>
              <span class="proof-file-size">{{ f.sizeText }}</span>
              <span class="proof-file-tag">已归档</span>
              <span class="proof-file-actions">
                <el-button type="text" size="mini" icon="el-icon-delete" @click="removeProof(fi)">删除</el-button>
              </span>
            </div>
          </div>
          <div v-else class="trace-empty">暂无佐证材料</div>
          <div class="proof-upload-area">
            <el-upload
              ref="proofUploader"
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="onProofFileChange"
              multiple>
              <el-button size="mini" icon="el-icon-upload2" class="proof-upload-btn">
                {{ (factorTraceRow.proofFiles && factorTraceRow.proofFiles.length) ? '继续添加佐证' : '上传佐证材料' }}
              </el-button>
            </el-upload>
            <span class="proof-upload-tip">支持 PDF / Excel / Word / 图片，单个 ≤ 20MB</span>
          </div>
        </div>

        <!-- ⑤ 修改记录 -->
        <div class="trace-card">
          <div class="trace-card-title"><i class="el-icon-time"></i> 修改记录</div>
          <div v-if="factorTraceRow.history && factorTraceRow.history.length">
            <div v-for="(h, i) in factorTraceRow.history" :key="i" class="trace-history-item">
              <span class="trace-history-time">{{ h.time }}</span>
              <span class="trace-history-change">{{ h.field }}：{{ h.from }} → {{ h.to }}</span>
            </div>
          </div>
          <div v-else class="trace-empty">暂无修改记录</div>
        </div>
      </div>

      <div class="trace-footer">
        <el-button size="small" @click="factorTraceVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveFactorTrace">保存</el-button>
      </div>
    </el-drawer>

    <!-- 阶段4 参数详情抽屉 -->
    <el-drawer :visible.sync="actTraceVisible" direction="rtl" size="520px" append-to-body custom-class="trace-drawer" :show-close="false">
      <div class="trace-custom-header">
        <div class="trace-custom-title">
          <i class="el-icon-data-analysis"></i>
          <span>参数详情</span>
        </div>
        <i class="el-icon-close trace-close" @click="actTraceVisible = false"></i>
      </div>

      <div v-if="actTraceRow" class="trace-body">
        <!-- 头部 -->
        <div class="trace-head">
          <div class="trace-head-icon"><i class="el-icon-document"></i></div>
          <div class="trace-head-info">
            <div class="trace-title">{{ actTraceRow.sourceName }}</div>
            <div class="trace-sub">
              {{ actTraceRow.category }}
              <template v-if="actTraceRow.material"> · {{ actTraceRow.material }}</template>
              <template v-if="actTraceRow.direction === 'input'"> · 输入</template>
              <template v-else-if="actTraceRow.direction === 'output'"> · 输出</template>
            </div>
          </div>
        </div>

        <!-- ① 参数信息 -->
        <div class="trace-card">
          <div class="trace-card-title"><i class="el-icon-data-line"></i> 参数信息</div>
          <div class="trace-kv">
            <span class="trace-k">参数名称</span>
            <span class="trace-v"><i class="param-sym is-ad">{{ actTraceRow.paramKey }}</i> {{ actTraceRow.paramName }}</span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">当前值</span>
            <span class="trace-v">
              <el-input v-model="actTraceRow.value" size="mini" style="width:120px;" :disabled="actTraceRow.readonly"></el-input>
              <span class="param-unit" style="margin-left:6px;">{{ actTraceRow.unit }}</span>
            </span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">所属类别</span>
            <span class="trace-v">{{ actTraceRow.category }}</span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">数据渠道</span>
            <span class="trace-v">{{ actTraceRow.channel }}</span>
          </div>
        </div>

        <!-- ② 数据来源 -->
        <div class="trace-card">
          <div class="trace-card-title"><i class="el-icon-link"></i> 数据来源</div>
          <div class="trace-kv">
            <span class="trace-k">数据来源</span>
            <span class="trace-v"><span class="trace-v">{{ actTraceRow.source || '未记录' }}</span></span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">原始值</span>
            <span class="trace-v">
              <span v-if="actTraceRow.rawValue">{{ actTraceRow.rawValue }} {{ actTraceRow.rawUnit }}</span>
              <span v-else class="trace-empty">—</span>
            </span>
          </div>
          <div class="trace-kv" v-if="actTraceRow.convertNote">
            <span class="trace-k">换算说明</span>
            <span class="trace-v">{{ actTraceRow.convertNote }}</span>
          </div>
        </div>

        <!-- ③ 数据质量 -->
        <div class="trace-card">
          <div class="trace-card-title"><i class="el-icon-medal"></i> 数据质量</div>
          <div class="trace-kv">
            <span class="trace-k">质量评级</span>
            <span class="trace-v">
              <span :class="['trace-quality-badge', actTraceRow.quality.cls]">{{ actTraceRow.quality.level }}</span>
            </span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">评级依据</span>
            <span class="trace-v">{{ actTraceRow.quality.note }}</span>
          </div>
        </div>

        <!-- ④ 佐证材料 -->
        <div class="trace-card">
          <div class="trace-card-title"><i class="el-icon-paperclip"></i> 佐证材料</div>

          <!-- 已上传文件列表 -->
          <div v-if="actTraceRow.proofFiles && actTraceRow.proofFiles.length" class="proof-file-list">
            <div v-for="(f, fi) in actTraceRow.proofFiles" :key="fi" class="proof-file-item">
              <i :class="proofFileIcon(f.name)"></i>
              <span class="proof-file-name" :title="f.name">{{ f.name }}</span>
              <span class="proof-file-size">{{ f.sizeText }}</span>
              <span class="proof-file-tag">已归档</span>
              <span class="proof-file-actions">
                <el-button type="text" size="mini" icon="el-icon-view" @click="previewProof(f)">预览</el-button>
                <el-button type="text" size="mini" icon="el-icon-refresh" @click="replaceProof(fi)">替换</el-button>
                <el-button type="text" size="mini" icon="el-icon-delete" @click="removeProof(fi)">删除</el-button>
              </span>
            </div>
          </div>
          <div v-else class="trace-empty">暂无佐证材料</div>

          <!-- 上传区 -->
          <div class="proof-upload-area">
            <el-upload
              ref="proofUploader"
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="onProofFileChange"
              multiple>
              <el-button size="mini" icon="el-icon-upload2" class="proof-upload-btn">
                {{ (actTraceRow.proofFiles && actTraceRow.proofFiles.length) ? '继续添加佐证' : '上传佐证材料' }}
              </el-button>
            </el-upload>
            <span class="proof-upload-tip">支持 PDF / Excel / Word / 图片，单个 ≤ 20MB</span>
          </div>
        </div>

        <!-- ⑤ 修改记录 -->
        <div class="trace-card">
          <div class="trace-card-title"><i class="el-icon-time"></i> 修改记录</div>
          <div v-if="actTraceRow.history && actTraceRow.history.length">
            <div v-for="(h, i) in actTraceRow.history" :key="i" class="trace-history-item">
              <span class="trace-history-time">{{ h.time }}</span>
              <span class="trace-history-change">{{ h.field }}：{{ h.from }} → {{ h.to }}</span>
            </div>
          </div>
          <div v-else class="trace-empty">暂无修改记录</div>
        </div>
      </div>

      <div class="trace-footer">
        <el-button size="small" @click="actTraceVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveActTrace">保存</el-button>
      </div>
    </el-drawer>


  <!-- 排放源新增/编辑对话框 -->
  <el-dialog :visible.sync="sourceDialogVisible" :title="sourceDialogMode === 'add' ? '添加排放源（手动添加）' : '编辑排放源'" width="460px" append-to-body>
    <el-form :model="sourceForm" label-width="88px" size="small">
      <el-form-item label="排放源名称">
        <el-input v-model="sourceForm.name" placeholder="如：天然气、柴油"></el-input>
      </el-form-item>
      <el-form-item label="所属分类">
        <el-select v-model="sourceForm.category" style="width:100%">
          <el-option label="化石燃料燃烧" value="化石燃料燃烧"></el-option>
          <el-option label="能源加工转换" value="能源加工转换"></el-option>
          <el-option label="净购入电力热力" value="净购入电力热力"></el-option>
          <el-option label="工业过程" value="工业过程"></el-option>
        </el-select>
      </el-form-item>
      <!-- 编辑系统识别渠道时，只读展示渠道与数据来源 -->
      <el-form-item label="数据渠道" v-if="sourceDialogMode === 'edit' && sourceForm.channel && sourceForm.channel !== '手动添加'">
        <span :class="['src-item-channel', sourceForm.channel === '底座数据识别' ? 'is-platform' : 'is-ocr']">{{ sourceForm.channel }}</span>
        <span class="src-channel-readonly-hint">系统识别，不可修改</span>
      </el-form-item>
      <el-form-item label="数据来源" v-if="sourceDialogMode === 'edit' && sourceForm.channel && sourceForm.channel !== '手动添加'">
        <span class="src-channel-detail-text">{{ sourceForm.channelDetail || '（无明细）' }}</span>
      </el-form-item>
    </el-form>
    <span slot="footer">
      <el-button size="small" @click="sourceDialogVisible = false">取消</el-button>
      <el-button size="small" type="primary" @click="saveEmissionSource">确定</el-button>
    </span>
  </el-dialog>
  </div>

</template>

<script>
import * as echarts from 'echarts'

// 挂载全局 echarts（供 mixin 调用）
if (typeof window !== 'undefined') {
  window.__ECHARTS__ = echarts
}
import AgentIcon from '@/pages/zcip/common/AgentIcon.vue'
import OnboardingGuide from '@/pages/zcip/agent-center/components/OnboardingGuide.vue'
import agentCoreMixin from './agentCoreMixin'
import agentChatMixin from './agentChatMixin'

export default {
  name: 'CarbonFootprintAgent',
  components: { AgentIcon, OnboardingGuide },
  mixins: [agentCoreMixin, agentChatMixin],
  data() {
    return {
      showOnboarding: false,
      activeActivityRow: null,  // 数据清单当前选中行（对话联动）
      selectedFactorLibs: [],
      onboardingStep: 0,
      onboardingSteps: [
        {
          icon: 'el-icon-data-analysis',
          title: '欢迎使用园区碳核算智能体',
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
          text: '页面中间为对话区，直接向小易提问或下达指令。输入园区名称即可开始核算，小易会引导您完成九阶段流程。',
          features: [
            { icon: 'el-icon-video-play', title: '快速开始', desc: '输入园区名称即可创建核算任务', color: '#0067FE' },
            { icon: 'el-icon-magic-stick', title: '智能问答', desc: '核算方法、因子来源即问即答', color: '#0067FE' },
            { icon: 'el-icon-s-opportunity', title: '常用指令', desc: '点击灯泡图标呼出指令面板', color: '#ED7B2F' }
          ],
          tip: '试试输入园区名称开始一次碳足迹核算。',
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
  methods: {
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
      const all = this.factorDatabases || []
      const list = all.filter(l => !l.standards || l.standards.some(t => txt.indexOf(t) > -1))
      return list.length ? list : all
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
      this.$router.push('/park-accounting/workspace').catch(() => {})
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
