<template>
  <span class="agent-icon-wrapper" :class="{ 'agent-icon-animated': animated }">
    <!-- el-icon 系列：直接用 <i> 渲染 -->
    <i v-if="!isCustom" :class="icon || 'el-icon-cpu'" :style="{ color: color, fontSize: size + 'px' }"></i>
    <!-- ai-core：原始机器人图片缩小版（保留原图 3D 渲染质感 + 主题色发光呼吸 + 轻微浮动） -->
    <img
      v-else
      :src="imgSrc"
      class="ai-core-img"
      :style="{ width: size + 'px', height: size + 'px', filter: glowFilter }"
      alt=""
    />
  </span>
</template>

<script>
/**
 * AgentIcon — 统一智能体图标组件
 *
 * 用法：<AgentIcon icon="ai-core" color="#0067FE" :size="20" />
 *
 * 支持两种图标：
 *   1. Element UI 图标：icon="el-icon-office-building" 等，走 <i> 渲染
 *   2. ai-core / ai-robot：原始机器人形象图片（public/images/智能体.png）的
 *      等比缩小版，color 仅用于发光投影色调
 */
export default {
  name: 'AgentIcon',
  props: {
    icon: { type: String, default: '' },
    color: { type: String, default: '#0067FE' },
    size: { type: Number, default: 20 },
    // 是否启用动态效果（发光呼吸 + 浮动），默认开启
    animated: { type: Boolean, default: true }
  },
  computed: {
    isCustom() {
      return this.icon === 'ai-core' || this.icon === 'svg-ai-core' || this.icon === 'ai-robot'
    },
    imgSrc() {
      const base = (process.env.NODE_ENV === 'production' ? './' : '/') + 'images/'
      return base + encodeURIComponent('智能体.png')
    },
    glowFilter() {
      const h = (this.color || '#0067FE').replace('#', '')
      const full = h.length === 3 ? h.split('').map(x => x + x).join('') : h
      const n = parseInt(full, 16)
      const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
      return `drop-shadow(0 0 ${Math.max(2, this.size * 0.15)}px rgba(${r},${g},${b},0.45))`
    }
  }
}
</script>

<style scoped>
.agent-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.ai-core-img {
  display: block;
  object-fit: contain;
  pointer-events: none;
}

/* ===== 动态效果（发光呼吸 + 上下浮动，幅度随图标尺寸自适应） ===== */
.agent-icon-animated .ai-core-img {
  animation: ai-glow 3s ease-in-out infinite, ai-float 4.5s ease-in-out infinite;
}

@keyframes ai-glow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.78; }
}

@keyframes ai-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-1.5px); }
}

/* 大图标浮动幅度更大 */
.agent-icon-animated .ai-core-img[style*="width: 96px"] {
  animation-duration: 3s, 5s;
}

/* 减少动态偏好时停用动画 */
@media (prefers-reduced-motion: reduce) {
  .agent-icon-animated .ai-core-img {
    animation: none;
  }
}
</style>
