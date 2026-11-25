<template>
  <div class="home-page">
    <div class="home-bg-glow"></div>
    <div class="home-bg-grid"></div>

    <div class="home-content">
      <!-- ========== 小亦欢迎区（横向布局：图标 + 文案并排，压缩纵向空间） ========== -->
      <div class="xiao-yi-section">
        <div class="xy-avatar-wrap">
          <div class="xy-avatar-glow"></div>
          <img :src="imgBase + '智能体.png'" alt="小易" class="xy-avatar-icon xy-avatar-float" />
        </div>
        <div class="xy-text-col">
          <div class="xy-title-line">
            <span class="xy-hi">您好，我是</span>
            <span class="xy-name-badge">小易</span>
            <span class="xy-role grad-text">零碳智能助手</span>
          </div>
          <p class="xy-subtitle">覆盖产品碳足迹、组织碳核算、零碳工厂等全场景碳核算与申报辅助</p>
        </div>
      </div>

      <!-- ========== 业务能力 ========== -->
      <div class="capability-section">
        <div class="section-label">
          <span class="label-bar"></span>
          <span class="label-text">业务能力</span>
        </div>
        <div class="capability-bar">
          <div class="cap-item" v-for="(cap, i) in capabilities" :key="i">
            <div class="cap-dot" :style="{ background: cap.color }"></div>
            <span class="cap-name">{{ cap.name }}</span>
            <i class="el-icon-arrow-right cap-arrow" v-if="i < capabilities.length - 1"></i>
          </div>
        </div>
      </div>

      <!-- ========== 知识库能力 ========== -->
      <div class="knowledge-section">
        <div class="section-label">
          <span class="label-bar"></span>
          <span class="label-text">知识库能力</span>
        </div>
        <div class="kb-grid">
          <div class="kb-card" v-for="kb in knowledgeBases" :key="kb.name" @click="searchKnowledge(kb)">
            <div class="kb-icon" :style="{ background: kb.color }"><i :class="kb.icon"></i></div>
            <div class="kb-info">
              <div class="kb-name">{{ kb.name }}</div>
              <div class="kb-desc">{{ kb.desc }}</div>
            </div>
            <div class="kb-count">{{ kb.count }}<span class="kb-unit">条</span></div>
          </div>
        </div>
      </div>

      <!-- ========== 智能场景入口 ========== -->
      <div class="scenario-section">
        <div class="section-label">
          <span class="label-bar"></span>
          <span class="label-text">智能场景</span>
        </div>
        <div class="scenario-grid">
          <div class="scenario-card" v-for="(sc, i) in scenarios" :key="i" @click="enterScenario(sc)">
            <div class="scenario-img-wrap" :style="{ background: sc.bgColor }">
              <img :src="sc.image" :alt="sc.title" class="scenario-img" />
              <div class="scenario-status" :class="sc.status === '可用' ? 'status-on' : 'status-off'">
                <span class="status-dot-sm" v-if="sc.status === '可用'"></span>{{ sc.status }}
              </div>
            </div>
            <div class="scenario-body">
              <h3 class="scenario-title">{{ sc.title }}</h3>
              <p class="scenario-desc">{{ sc.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'AgentCenter',
  data() {
    const imgBase = (process.env.NODE_ENV === 'production' ? './' : '/') + 'images/'
    return {
      imgBase,
      capabilities: [
        { name: '标准适配', color: '#0067fe' },
        { name: '数据采集', color: '#0067fe' },
        { name: '核算引擎', color: '#0067fe' },
        { name: '合规校验', color: '#0067fe' },
        { name: '报告生成', color: '#0067fe' }
      ],
      knowledgeBases: [
        { name: '政策标准库', shortName: '标准', icon: 'el-icon-document', color: '#0067fe', count: 36, keywords: ['标准','政策','ISO','GB','指南','核算方法'], desc: '核算方法论、评价标准与申报政策' },
        { name: '平台模板库', shortName: '模板', icon: 'el-icon-files', color: '#0067fe', count: 52, keywords: ['模板','报告','自评表','申报'], desc: '核算模板与申报模板' },
        { name: '单元过程库', shortName: '过程', icon: 'el-icon-s-grid', color: '#0067fe', count: 168, keywords: ['单元过程','工艺','工序','LCA'], desc: '工艺工序过程数据集' },
        { name: '排放因子库', shortName: '因子', icon: 'el-icon-data-line', color: '#0067fe', count: 1280, keywords: ['因子','排放系数','EF','活动数据'], desc: '温室气体排放因子数据' }
      ],
      scenarios: [
        {
          title: '产品碳足迹',
          desc: '基于ISO 14067全生命周期评价方法，核算产品碳排放，应对碳关税与碳标签要求',
          image: imgBase + '产品.png',
          bgColor: '#001429',
          status: '可用',
          route: '/agent-center/apps/carbon-accounting'
        },
        {
          title: '产品环境足迹',
          desc: '基于欧盟PEF方法论要求，评估产品多类别环境影响，对标绿色贸易壁垒',
          image: imgBase + '环境.png',
          bgColor: '#001429',
          status: '可用',
          route: '/agent-center/apps/pef-accounting'
        },
        {
          title: '组织碳核算',
          desc: '基于GHG Protocol温室气体核算体系，核算组织碳排放，支撑组织碳披露',
          image: imgBase + '组织 .png',
          bgColor: '#001429',
          status: '可用',
          route: '/agent-center/apps/org-accounting'
        },
        {
          title: '北京碳市场',
          desc: '基于北京市碳排放权交易管理办法，核算重点单位排放量，支撑配额履约',
          image: imgBase + '北京.png',
          bgColor: '#001429',
          status: '可用',
          route: '/agent-center/apps/beijing-carbon'
        },
        {
          title: '园区碳核算',
          desc: '基于零碳园区碳排放核算方法与指标体系，核算园区碳排放，支撑零碳园区申报',
          image: imgBase + '园区.png',
          bgColor: '#001429',
          status: '可用',
          route: '/park-accounting/workspace'
        },
        {
          title: '绿色工厂',
          desc: '基于绿色工厂评价通则要求，测算绿色评价指标，辅助绿色工厂申报',
          image: imgBase + '绿色工厂.png',
          bgColor: '#001429',
          status: '可用',
          route: '/green-factory/agent'
        },
        {
          title: '零碳工厂',
          desc: '基于国家级零碳工厂建设工作的通知，核算评价指标，辅助申报',
          image: imgBase + '碳工厂.png',
          bgColor: '#001429',
          status: '可用',
          route: '/agent-center/apps/zero-carbon-factory'
        },
        {
          title: '智慧报告',
          desc: '基于能碳多源数据，辅助生成申报报告，支持多场景智慧报告',
          image: imgBase + '智慧报告.png',
          bgColor: '#001429',
          status: '可用',
          route: '/agent-center/apps/report-submission'
        }
      ]
    }
  },
  methods: {
    enterScenario(sc) {
      if (sc.status === '可用' && sc.route) {
        if (this.$route.fullPath === sc.route) return
        this.$router.push(sc.route).catch(() => {})
      } else {
        this.$message.info(sc.title + ' 正在规划中，敬请期待')
      }
    },
    searchKnowledge(kb) {
      this.$message.success('正在检索「' + kb.name + '」，共 ' + kb.count + ' 条数据')
    }
  }
}
</script>

<style scoped>
.home-page {
  height: 100%;
  overflow: hidden;
  overflow-x: hidden;
  background: linear-gradient(135deg, #e8f0fe 0%, #eaf2fb 50%, #e5f0fd 100%);
  position: relative;
}

.home-bg-glow {
  position: absolute;
  top: -100px;
  right: -100px;
  width: 400px;
  height: 400px;
  background: rgba(0, 103, 254, 0.06);
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}

.home-bg-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(0, 103, 254, 0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0, 103, 254, 0.03) 1px, transparent 1px);
  background-size: 26px 26px;
  mask-image: radial-gradient(ellipse 90% 80% at 50% 30%, #000 20%, transparent 85%);
  -webkit-mask-image: radial-gradient(ellipse 90% 80% at 50% 30%, #000 20%, transparent 85%);
  pointer-events: none;
}

.home-content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  height: 100%;
  margin: 0 auto;
  padding: 20px 40px 16px;
  display: flex;
  flex-direction: column;
}

/* ========== 小亦欢迎区（横向布局） ========== */
.xiao-yi-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  margin-bottom: 12px;
  animation: fade-up 0.5s ease 0.1s both;
  flex-shrink: 0;
}

.xy-avatar-wrap {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0067fe;
}

.xy-avatar-glow {
  position: absolute;
  inset: -18px;
  background: radial-gradient(circle, rgba(0, 103, 254, 0.22) 0%, transparent 70%);
  border-radius: 50%;
  animation: dot-pulse 3s infinite;
}

.xy-avatar-icon {
  width: 64px;
  height: 64px;
  object-fit: contain;
  filter: drop-shadow(0 0 12px rgba(0, 103, 254, 0.5));
  position: relative;
  z-index: 1;
}

.xy-avatar-float {
  animation: xy-float 4s ease-in-out infinite;
}

@keyframes xy-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.xy-text-col {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.xy-title-line {
  display: flex;
  align-items: center;
  gap: 10px;
}

.xy-hi {
  font-size: 14px;
  color: #475569;
  font-weight: 500;
}

.xy-name-badge {
  display: inline-block;
  font-size: 14px;
  font-weight: 600;
  color: #0067fe;
  background: rgba(0, 103, 254, 0.08);
  padding: 1px 10px;
  border-radius: 8px;
  letter-spacing: 1px;
}

.xy-role {
  font-size: 16px;
  font-weight: 600;
}

.grad-text {
  background: linear-gradient(135deg, #0067fe, #0067fe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.xy-subtitle {
  font-size: 13px;
  color: #475569;
  margin: 0;
  line-height: 1.5;
}

.spin-slow { transform-origin: center; animation: spin 8s linear infinite; }
.spin-reverse { transform-origin: center; animation: spin-reverse 12s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
@keyframes spin-reverse { 100% { transform: rotate(-360deg); } }

/* ========== 通用 section label ========== */
.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.label-bar {
  width: 3px;
  height: 16px;
  background: linear-gradient(180deg, #0067fe, #0067fe);
  border-radius: 2px;
}

.label-text {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}

/* ========== 业务能力 ========== */
.capability-section {
  margin-bottom: 14px;
  animation: fade-up 0.5s ease 0.15s both;
  flex-shrink: 0;
}

.capability-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  padding: 8px 16px;
  box-shadow: 0 4px 20px rgba(0, 103, 254, 0.04);
}

.cap-item {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: center;
}

.cap-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cap-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
}

.cap-arrow {
  font-size: 13px;
  color: #94a3b8;
  margin-left: 6px;
}

/* ========== 知识库能力 ========== */
.knowledge-section {
  margin-bottom: 14px;
  animation: fade-up 0.5s ease 0.2s both;
  flex-shrink: 0;
}

.kb-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.kb-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 16px rgba(0, 103, 254, 0.03);
}

.kb-card:hover {
  background: rgba(255, 255, 255, 0.85);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 103, 254, 0.08);
}

.kb-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #fff;
  flex-shrink: 0;
}

.kb-info {
  flex: 1;
  min-width: 0;
}

.kb-name {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 2px;
}

.kb-desc {
  font-size: 13px;
  color: #475569;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kb-count {
  font-size: 18px;
  font-weight: 700;
  color: #0067fe;
  display: flex;
  align-items: baseline;
  gap: 2px;
  flex-shrink: 0;
}

.kb-unit {
  font-size: 13px;
  color: #475569;
  font-weight: 400;
}

/* ========== 智能场景 ========== */
.scenario-section {
  animation: fade-up 0.5s ease 0.25s both;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.scenario-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.scenario-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 103, 254, 0.05);
  display: flex;
  flex-direction: column;
}

.scenario-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 103, 254, 0.12);
  border-color: rgba(0, 103, 254, 0.2);
}

.scenario-img-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scenario-img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  transition: transform 0.4s ease;
}

.scenario-card:hover .scenario-img {
  transform: scale(1.05);
}

.scenario-status {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  backdrop-filter: blur(8px);
}

.status-on {
  background: rgba(0, 103, 254, 0.85);
  color: #fff;
}

.status-off {
  background: rgba(148, 163, 184, 0.85);
  color: #fff;
}

.status-dot-sm {
  width: 5px;
  height: 5px;
  background: #fff;
  border-radius: 50%;
  animation: dot-pulse 1.5s infinite;
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.scenario-body {
  padding: 8px 12px 10px;
  flex-shrink: 0;
}

.scenario-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px;
}

.scenario-desc {
  font-size: 13px;
  color: #475569;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ========== 动画 ========== */
@keyframes fade-down {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ========== 响应式 ========== */
@media (max-width: 1100px) {
  .scenario-grid { grid-template-columns: repeat(3, 1fr); }
  .kb-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 700px) {
  .scenario-grid { grid-template-columns: repeat(2, 1fr); }
  .capability-bar { flex-wrap: wrap; }
  .cap-item { flex: 0 0 45%; }
  .home-page { overflow-y: auto; }
}
</style>
