<template>
  <transition name="onboard-fade">
    <div class="onboard-mask" v-if="visible" @click="maskClick">
      <div class="onboard-modal">
        <!-- 步骤指示器 -->
        <div class="onboard-dots">
          <span
            v-for="n in steps.length"
            :key="n"
            class="onboard-dot"
            :class="{ active: n === currentStep + 1, done: n <= currentStep }"
          ></span>
        </div>

        <!-- 步骤内容 -->
        <div class="onboard-step-content" :key="currentStep">
          <div class="onboard-icon-big" :style="currentStepData.iconStyle"><i :class="currentStepData.icon"></i></div>
          <h3 class="onboard-step-title">{{ currentStepData.title }}</h3>
          <p class="onboard-step-text">{{ currentStepData.text }}</p>
          <!-- 特性列表 -->
          <div class="onboard-features" v-if="currentStepData.features && currentStepData.features.length">
            <div class="onboard-feature-item" v-for="(feat, fi) in currentStepData.features" :key="fi">
              <i :class="feat.icon" class="feat-icon" :style="{ color: feat.color || '#0067fe' }"></i>
              <div class="feat-body">
                <div class="feat-title">{{ feat.title }}</div>
                <div class="feat-desc">{{ feat.desc }}</div>
              </div>
            </div>
          </div>
          <!-- 提示标签 -->
          <div class="onboard-tip" v-if="currentStepData.tip">
            <i class="el-icon-lightbulb"></i>
            <span>{{ currentStepData.tip }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="onboard-buttons">
          <button class="onboard-btn-skip" @click="$emit('skip')" v-if="currentStep < steps.length - 1">跳过</button>
          <button class="onboard-btn-prev" @click="$emit('prev')" v-if="currentStep > 0">上一步</button>
          <button class="onboard-btn-next" @click="$emit('next')" v-if="currentStep < steps.length - 1">
            {{ currentStep === steps.length - 2 ? '完成' : '下一步' }}<i class="el-icon-arrow-right"></i>
          </button>
          <button class="onboard-btn-finish" @click="$emit('finish')" v-if="currentStep === steps.length - 1">
            开始使用<i class="el-icon-check"></i>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
/**
 * OnboardingGuide — 交互式新手引导浮层组件
 *
 * 功能：
 * - 6步引导（平台总览→知识库阵列→智能体矩阵→智能对话→历史会话→完成）
 * - 每步含图标、标题、正文、特性列表、操作提示
 * - 步骤指示器（圆点→激活变胶囊→完成变色）
 * - 跳过/上一步/下一步/完成 按钮
 * - 弹出动画（cubic-bezier 弹性缓动）
 */
export default {
  name: 'OnboardingGuide',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    step: {
      type: Number,
      default: 0
    },
    stepsOverride: {
      type: Array,
      default: null
    }
  },
  computed: {
    currentStep() {
      return this.step
    },
    currentStepData() {
      return this.steps[this.step] || this.steps[0]
    },
    steps() {
      if (this.stepsOverride && this.stepsOverride.length) {
        return this.stepsOverride
      }
      return [
        {
          icon: 'el-icon-s-home',
          title: '欢迎使用产品碳足迹核算',
          text: '这里是产品碳足迹核算工作空间。通过自然语言对话，即可完成产品全生命周期碳排放核算——从功能单位定义、BOM拆解、数据采集到排放计算与报告生成，全程智能引导。',
          features: [
            { icon: 'el-icon-chat-dot-round', title: '对话式核算', desc: '用自然语言描述需求，智能体自动引导核算流程', color: '#0067fe' },
            { icon: 'el-icon-set-up', title: '九阶段流程', desc: '功能单位→系统边界→BOM→数据采集→分配→计算→校验→报告', color: '#0067fe' },
            { icon: 'el-icon-document-checked', title: '合规可溯源', desc: '内置 ISO 14067、GHG Protocol 等标准，结果可溯源', color: '#ED7B2F' }
          ],
          tip: '首次使用建议依次浏览全部引导内容，约需 1 分钟。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-chat-dot-round',
          title: '智能对话区',
          text: '页面左侧为对话区，直接输入您的核算需求（如「核算某型号动力电池的碳足迹」），智能体会自动识别产品信息、引导您逐步完成数据填写与核算。也可从产品库直接发起核算。',
          features: [
            { icon: 'el-icon-edit-outline', title: '自然语言输入', desc: '描述产品名称或核算需求即可启动流程', color: '#0067fe' },
            { icon: 'el-icon-magic-stick', title: '智能引导', desc: '自动拆解核算步骤，逐步引导数据采集', color: '#0067fe' },
            { icon: 'el-icon-data-analysis', title: '实时计算', desc: '数据录入即计算，随时查看中间结果', color: '#ED7B2F' }
          ],
          tip: '试试输入「核算三元锂电池组碳足迹」开始体验。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-chat-line-round',
          title: '历史对话',
          text: '右侧第一个页签为历史对话，自动保存您的每一次对话记录。可随时回看之前的咨询内容、继续未完成的对话，或搜索历史记录快速定位。',
          features: [
            { icon: 'el-icon-clock', title: '自动保存', desc: '每次对话自动记录，无需手动操作', color: '#0067fe' },
            { icon: 'el-icon-refresh-left', title: '一键续作', desc: '点击历史对话可恢复上下文，继续之前的工作', color: '#0067fe' },
            { icon: 'el-icon-search', title: '快速搜索', desc: '支持按对话名称或内容关键词搜索', color: '#ED7B2F' }
          ],
          tip: '历史对话按时间倒序排列，最近的对话排在最前。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-s-order',
          title: '核算任务',
          text: '右侧第二个页签为核算任务列表，展示所有碳足迹核算任务的进度与状态。每个任务卡片显示产品名称、当前阶段、完成进度和更新时间，点击即可进入任务详情。',
          features: [
            { icon: 'el-icon-aim', title: '进度跟踪', desc: '实时显示任务完成度和当前所处阶段', color: '#0067fe' },
            { icon: 'el-icon-warning-outline', title: '异常提醒', desc: '数据缺失或校验失败时自动标记异常', color: '#F56C6C' },
            { icon: 'el-icon-search', title: '快速筛选', desc: '支持按任务名称或产品名称搜索', color: '#0067fe' }
          ],
          tip: '任务按更新时间倒序排列，运行中的任务排在最前。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-s-goods',
          title: '产品库',
          text: '右侧第三个页签为产品与物料库，展示所有已登记的产品信息。每个产品卡片显示分类、核算标准、数据完整度和历史核算次数，点击「核算」按钮可直接发起该产品的碳足迹核算。',
          features: [
            { icon: 'el-icon-box', title: '产品管理', desc: '集中展示企业所有产品及核算状态', color: '#0067fe' },
            { icon: 'el-icon-data-line', title: '数据完整度', desc: '直观展示每个产品的BOM数据完善程度', color: '#0067fe' },
            { icon: 'el-icon-s-data', title: '一键核算', desc: '点击「核算」按钮直接发起碳足迹核算', color: '#ED7B2F' }
          ],
          tip: '数据完整度越高，核算结果越准确。建议先完善BOM数据再发起核算。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-success',
          title: '一切就绪！',
          text: '您已了解产品碳足迹核算工作空间的核心功能。现在可以在对话区输入需求，或从产品库选择产品发起核算，开始您的碳足迹核算之旅。',
          features: [
            { icon: 'el-icon-magic-stick', title: '对话即操作', desc: '自然语言驱动，无需填写复杂表单', color: '#0067fe' },
            { icon: 'el-icon-trophy', title: '专业可信', desc: '内置权威标准与因子库，结果合规可溯源', color: '#0067fe' },
            { icon: 'el-icon-refresh', title: '持续优化', desc: '核算模型与知识库持续迭代更新', color: '#722ED1' }
          ],
          tip: '如需再次查看本引导，随时点击右下角「新手引导」按钮。',
          iconStyle: { color: 'var(--success)' }
        }
      ]
    }
  },
  methods: {
    maskClick(e) {
      if (e.target === e.currentTarget) { this.$emit('skip') }
    }
  }
}
</script>

<style scoped>
/* ===== 新手引导浮层 ===== */
.onboard-mask {
  position: fixed;
  inset: 0;
  background: rgba(10, 14, 26, 0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.onboard-modal {
  width: 540px;
  max-width: 90vw;
  max-height: 88vh;
  overflow-y: auto;
  background: var(--bg-card);
  border-radius: 20px;
  padding: 36px 40px 28px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
  text-align: center;
  animation: onboard-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes onboard-pop {
  from { opacity: 0; transform: scale(0.88) translateY(12px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* 步骤指示器 */
.onboard-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}
.onboard-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-color);
  transition: all 0.25s ease;
}
.onboard-dot.active {
  width: 28px;
  border-radius: 4px;
  background: var(--primary);
}
.onboard-dot.done {
  background: var(--primary-light);
}

/* 步骤内容 */
.onboard-icon-big {
  font-size: 56px;
  color: var(--primary);
  margin-bottom: 16px;
}
.onboard-step-title {
  font-family: 'Exo 2', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 10px;
}
.onboard-step-text {
  font-family: 'Exo 2', sans-serif;
  font-size: 13.5px;
  color: var(--text-secondary);
  line-height: 1.75;
  margin: 0 0 20px;
}

/* 特性列表 */
.onboard-features {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0 0 20px;
  text-align: left;
}
.onboard-feature-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(0, 103, 254, 0.03);
  border: 1px solid rgba(0, 103, 254, 0.08);
  border-radius: 10px;
  transition: all 0.2s ease;
}
.onboard-feature-item:hover {
  background: rgba(0, 103, 254, 0.06);
  border-color: rgba(0, 103, 254, 0.15);
}
.feat-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 1px;
}
.feat-body { flex: 1; min-width: 0; }
.feat-title {
  font-family: 'Exo 2', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}
.feat-desc {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
}

/* 提示标签 */
.onboard-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0 0 24px;
  padding: 8px 16px;
  background: rgba(0, 103, 254, 0.06);
  border: 1px solid rgba(0, 103, 254, 0.15);
  border-radius: 8px;
  font-size: 12px;
  color: #0067fe;
  line-height: 1.5;
}
.onboard-tip i { font-size: 14px; flex-shrink: 0; }

/* 操作按钮 */
.onboard-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
}
.onboard-btn-skip,
.onboard-btn-prev {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-secondary);
  transition: all 0.2s ease;
  font-family: 'Exo 2', sans-serif;
}
.onboard-btn-skip:hover,
.onboard-btn-prev:hover {
  border-color: var(--text-muted);
  color: var(--text-primary);
}
.onboard-btn-next,
.onboard-btn-finish {
  padding: 8px 22px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: var(--primary);
  color: #fff;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'Exo 2', sans-serif;
}
.onboard-btn-next:hover {
  background: var(--primary-light);
}
.onboard-btn-finish {
  background: var(--success);
}
.onboard-btn-finish:hover {
  background: #00c080;
}

/* 过渡动画 */
.onboard-fade-enter-active,
.onboard-fade-leave-active {
  transition: opacity 0.3s ease;
}
.onboard-fade-enter,
.onboard-fade-leave-to {
  opacity: 0;
}

/* 无障碍：减少动画 */
@media (prefers-reduced-motion: reduce) {
  .onboard-modal {
    animation: none;
  }
  .onboard-fade-enter-active,
  .onboard-fade-leave-active {
    transition-duration: 0.01ms;
  }
}
</style>
