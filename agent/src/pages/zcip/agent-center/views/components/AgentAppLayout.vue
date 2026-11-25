<template>
  <div class="agent-app-layout">
    <!-- ===== 左侧历史对话栏（可选，可收缩） ===== -->
    <div v-if="showHistorySidebar !== undefined && showHistorySidebar !== null" :class="['aap-history-sidebar', { 'aap-history-collapsed': historyCollapsed }]">
      <div class="aap-history-toggle" @click="historyCollapsed = !historyCollapsed">
        <i :class="historyCollapsed ? 'el-icon-d-arrow-right' : 'el-icon-d-arrow-left'"></i>
        <span v-if="historyCollapsed" class="aap-history-vertical">历史对话</span>
      </div>
      <div v-if="!historyCollapsed" class="aap-history-content">
        <slot name="history-sidebar"></slot>
      </div>
    </div>

    <!-- ===== 左侧对话消息区 ===== -->
    <div class="chat-panel">
      <!-- 头部状态栏 -->
      <div class="chat-header">
        <div class="header-left">
          <span class="bot-avatar-sm">
            <AgentIcon :icon="agentIcon || 'ai-core'" :color="agentThemeColor || '#0067FE'" :size="26" />
          </span>
          <strong class="header-title chat-name-highlight">{{ agentName || '智能体' }}</strong>
          <span class="bot-status-dot"></span>
          <span class="header-status">在线</span>
        </div>
        <div class="header-actions">
          <slot name="chat-header-actions"></slot>
        </div>
      </div>

      <!-- 消息列表流 -->
      <div class="chat-messages" ref="chatMessagesRef">
        <!-- 默认欢迎语（若父组件未在 messages 首项配置） -->
        <div v-if="showDefaultWelcome" class="msg msg-agent">
          <div class="msg-avatar">
            <AgentIcon :icon="agentIcon || 'ai-core'" :color="agentThemeColor || '#0067FE'" :size="26" />
          </div>
          <div class="msg-body">
            <div class="msg-text">{{ welcomeText || '欢迎使用智能体助手！在下方输入消息即可开始与我交流。' }}</div>
            <div class="msg-time">刚刚</div>
          </div>
        </div>

        <!-- 对话内容 -->
        <div v-for="msg in messages" :key="msg.id"
          :class="['msg', msg.role === 'user' ? 'msg-user' : 'msg-agent']">
          <div class="msg-avatar">
            <i v-if="msg.role === 'user'" class="el-icon-user"></i>
            <AgentIcon v-else :icon="agentIcon || 'ai-core'" :color="agentThemeColor || '#0067FE'" :size="26" />
          </div>
          <div class="msg-body">
            <!-- 气泡普通文本消息 (支持富文本) -->
            <div v-if="msg.type !== 'form'">
              <div class="msg-text" v-html="msg.text"></div>
              <div v-if="msg.suggestions && msg.suggestions.length" class="msg-suggestions">
                <span v-for="(s, i) in msg.suggestions" :key="i" class="sug-chip"
                  @click="$emit('send', s)">{{ s }}</span>
              </div>
            </div>
            <!-- 内嵌表单插槽 -->
            <div v-else class="msg-form-wrapper">
              <slot name="msg-form" :msg="msg"></slot>
            </div>
            <div class="msg-time">{{ msg.time || '刚刚' }}</div>
          </div>
        </div>
      </div>

      <!-- 输入栏区 -->
      <div class="chat-input-area">
        <div class="input-box">
          <textarea
            class="input-textarea"
            v-model="localInputText"
            :placeholder="placeholderText || '输入消息或提问…'"
            rows="1"
            @keydown.enter.exact="handleEnterSend"
            @input="autoResizeTextarea"
            ref="inputTextareaRef"
          ></textarea>
          <div class="input-box-footer">
            <div class="input-toolbar">
              <span class="toolbar-icon" title="常用指令" @click="$emit('cmd-click')"><i class="el-icon-s-opportunity"></i></span>
              <span class="toolbar-icon" title="语音输入" @click="$message.info('语音输入功能开发中')"><i class="el-icon-microphone"></i></span>
              <span class="toolbar-icon" title="图片上传" @click="$message.info('图片上传功能开发中')"><i class="el-icon-picture"></i></span>
              <span class="toolbar-icon" title="附件上传" @click="$message.info('附件上传功能开发中')"><i class="el-icon-upload2"></i></span>
            </div>
            <button class="send-btn" :disabled="!localInputText.trim()" @click="submitSend" :style="{ background: agentThemeColor || '#0067FE' }">
              <i class="el-icon-s-promotion"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 右侧业务联动面板区 ===== -->
    <div class="right-panel-container">
      <slot name="right-panel"></slot>
    </div>
  </div>
</template>

<script>
import AgentIcon from '@/pages/zcip/common/AgentIcon.vue'

export default {
  name: 'AgentAppLayout',
  components: { AgentIcon },
  props: {
    agentName: { type: String, default: '' },
    agentIcon: { type: String, default: '' },
    agentThemeColor: { type: String, default: '' },
    avatarBgColor: { type: String, default: '' },
    welcomeText: { type: String, default: '' },
    showDefaultWelcome: { type: Boolean, default: true },
    messages: { type: Array, default: () => [] },
    placeholderText: { type: String, default: '' },
    showHistorySidebar: { type: Boolean, default: null }
  },
  data() {
    return {
      localInputText: '',
      historyCollapsed: true
    }
  },
  watch: {
    messages() {
      this.scrollToBottom()
    }
  },
  mounted() {
    this.scrollToBottom()
  },
  methods: {
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.chatMessagesRef
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    },
    goBack() {
      if (this.$router) this.$router.go(-1)
    },
    handleEnterSend(e) {
      if (e.shiftKey) return
      e.preventDefault()
      this.submitSend()
    },
    submitSend() {
      if (!this.localInputText.trim()) return
      const text = this.localInputText
      this.localInputText = ''
      this.$emit('send', text)
      this.autoResizeTextarea()
    },
    autoResizeTextarea() {
      const el = this.$refs.inputTextareaRef
      if (el) {
        el.style.height = 'auto'
        el.style.height = Math.min(el.scrollHeight, 120) + 'px'
      }
    }
  }
}
</script>

<style scoped>
.agent-app-layout {
  height: 100%;
  display: flex;
  gap: 16px;
  background: linear-gradient(135deg, #e8f0fe 0%, #eaf2fb 50%, #e5f0fd 100%);
  position: relative;
}

/* ===== 左侧历史对话栏（可选） ===== */
.aap-history-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.6);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,103,254,0.04);
  display: flex;
  overflow: hidden;
  transition: width 0.25s ease;
  align-self: stretch;
}
.aap-history-sidebar.aap-history-collapsed { width: 36px; }
.aap-history-toggle {
  width: 36px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  border-right: 1px solid rgba(0,103,254,0.06);
  padding: 8px 0;
  color: #909399;
  transition: color 0.2s;
}
.aap-history-toggle:hover { color: #0067FE; }
.aap-history-toggle i { font-size: 16px; }
.aap-history-vertical {
  writing-mode: vertical-rl;
  font-size: 13px;
  letter-spacing: 2px;
}
.aap-history-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.agent-app-layout::before {
  content: '';
  position: absolute;
  top: -60px;
  right: -60px;
  width: 200px;
  height: 200px;
  background: rgba(0, 103, 254, 0.10);
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
  z-index: 0;
}
.agent-app-layout::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(0,103,254,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,103,254,0.03) 1px, transparent 1px);
  background-size: 26px 26px;
  mask-image: radial-gradient(ellipse 90% 80% at 50% 30%, #000 20%, transparent 85%);
  -webkit-mask-image: radial-gradient(ellipse 90% 80% at 50% 30%, #000 20%, transparent 85%);
  pointer-events: none;
  z-index: 0;
}
.agent-app-layout > * {
  position: relative;
  z-index: 1;
}

/* ========== 左侧面板 ========== */
.chat-panel {
  flex: 1;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 24px rgba(0, 103, 254, 0.05);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.7);
  min-width: 0;
}

.chat-header {
  height: 56px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(0, 103, 254, 0.06);
  flex-shrink: 0;
  background: transparent;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bot-avatar-sm {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent !important;
}
.bot-avatar-sm i {
  font-size: 15px;
}
.header-title {
  font-size: 16px;
  font-weight: 800;
  background: linear-gradient(135deg, #0067fe, #0067fe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.5px;
}
.bot-status-dot {
  width: 7px;
  height: 7px;
  background: var(--success);
  border-radius: 50%;
  margin-left: 4px;
}
.header-status {
  font-size: 13px;
  color: #909399;
}
.header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}
.msg {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  align-items: flex-start;
}
.msg-user {
  flex-direction: row-reverse;
}
.msg-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: none;
}
.msg-avatar i {
  font-size: 16px;
  color: #909399;
}
.msg-user .msg-avatar {
  background: var(--primary-bg);
  border-color: rgba(0, 103, 254, 0.1);
}
.msg-user .msg-avatar i {
  color: var(--primary);
}

.msg-body {
  max-width: 75%;
}
.msg-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.sug-chip {
  font-size: 13px;
  color: #0067fe;
  padding: 5px 12px;
  border: 1px solid rgba(0, 103, 254, 0.25);
  border-radius: 14px;
  background: #fff;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
  user-select: none;
}
.sug-chip:hover {
  background: rgba(0, 103, 254, 0.06);
  border-color: #0067fe;
}

.msg-text {
  background: rgba(255, 255, 255, 0.8);
  padding: 14px 18px;
  border-radius: 8px;
  border: 1px solid rgba(0, 103, 254, 0.06);
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  word-break: break-word;
}
.msg-user .msg-text {
  background: rgba(0, 103, 254, 0.06);
  color: #303133;
  border: none;
  border-radius: 8px;
  box-shadow: none;
}
.msg-time {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
  padding-left: 2px;
}
.msg-user .msg-time {
  text-align: right;
  padding-right: 2px;
}

/* 消息表单包装 */
.msg-form-wrapper {
  background: rgba(245, 247, 250, 0.8);
  border: 1px solid rgba(0, 103, 254, 0.06);
  padding: 16px;
  border-radius: 12px 12px 12px 4px;
  width: 340px;
}

/* 输入框 */
.chat-input-area {
  padding: 16px 24px;
  border-top: 1px solid rgba(0,103,254,0.06);
  background: transparent;
  flex-shrink: 0;
}
.input-box {
  background: rgba(245, 247, 250, 0.8);
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  transition: all 0.3s;
}
.input-box:focus-within {
  border-color: var(--primary);
  background: var(--bg-card);
  box-shadow: 0 0 0 3px rgba(0, 103, 254, 0.08);
}
.input-textarea {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 14px;
  resize: none;
  outline: none;
  font-family: inherit;
  color: var(--text-primary);
  padding: 4px 0;
  min-height: 24px;
  max-height: 120px;
}
.input-box-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}
.input-toolbar {
  display: flex;
  gap: 6px;
}
.toolbar-icon {
  cursor: pointer;
  color: #909399;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  transition: var(--transition);
}
.toolbar-icon:hover {
  color: var(--primary);
  background-color: rgba(0, 103, 254, 0.04);
}
.send-btn {
  color: #fff;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #C0C4CC !important;
  transition: all 0.3s;
}
.send-btn:not(:disabled) {
  background: linear-gradient(135deg, #0067fe, #0067fe) !important;
}
.send-btn:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: scale(1.04);
  box-shadow: 0 4px 12px rgba(0, 103, 254, 0.25);
}
.send-btn:disabled {
  background: var(--text-placeholder) !important;
  cursor: not-allowed;
}

/* ========== 右侧面板容器 ========== */
.right-panel-container {
  width: 420px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 103, 254, 0.05);
}

/* ========== 科技感机器人头像 SVG 专属样式 ========== */
.tech-robot-svg-inline {
  width: 100%;
  height: 100%;
  display: block;
}
.tech-robot-svg-inline-msg {
  width: 22px;
  height: 22px;
  display: block;
  margin: 4px;
}
.rot-glow-ring {
  transform-origin: center;
  animation: rotate-inf-clock 12s linear infinite;
}
.antenna-glow {
  animation: antenna-pulse-tech 1.5s ease-in-out infinite alternate;
}
.eye-glow {
  animation: eye-blink-pulse-tech 2s ease-in-out infinite alternate;
}

@keyframes rotate-inf-clock {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes antenna-pulse-tech {
  0% { opacity: 0.4; fill: #00e5ff; }
  100% { opacity: 1; fill: #ff0077; }
}
@keyframes eye-blink-pulse-tech {
  0% { opacity: 0.5; fill: #00e5ff; }
  100% { opacity: 1; fill: #00ffaa; }
}

.spin-slow { transform-origin: center; animation: spin 8s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

</style>
