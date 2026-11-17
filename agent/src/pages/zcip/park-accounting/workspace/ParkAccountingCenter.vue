<template>
  <div class="park-accounting-page">
  <agent-app-layout
    agent-name="小易"
    agent-icon="ai-core"
    agent-theme-color="rgb(0,103,254)"
    avatar-bg-color="rgba(0,103,254,0.1)"
    placeholder-text="提问或输入指令（如：新建核算）…"
    :messages="messages"
    :show-default-welcome="false"
    :show-history-sidebar="true"
    @send="onUserSend"
    @cmd-click="showCmdHint"
    ref="layoutRef"
  >
    <!-- 对话中内嵌：核算时间范围选择器 -->
    <template #msg-form="{ msg }">
      <div class="msg-form">
        <div class="form-title"><i class="el-icon-date"></i> 选择核算时间范围</div>
        <el-date-picker
          v-model="tempRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd"
          format="yyyy-MM-dd"
          size="small"
          :clearable="false"
          :picker-options="periodPickerOptions"
          style="width: 100%;"
        ></el-date-picker>
        <div v-if="tempRange && tempRange.length === 2" class="range-preview">
          将创建：<b>{{ previewTaskName() }}</b><br/>
          <span class="range-detail">{{ tempRange[0] }} ~ {{ tempRange[1] }}</span>
        </div>
        <div v-else class="range-preview range-empty">
          请选择核算数据的起止日期
        </div>
        <div class="form-actions">
          <el-button size="small" @click="cancelPeriod">取消</el-button>
          <el-button size="small" type="primary" style="background:#0067FE;border-color:#0067FE;" @click="confirmPeriod">确定并进入核算</el-button>
        </div>
      </div>
    </template>

    <!-- 右侧联动面板 -->
    <template #right-panel>
      <park-right-panel
        :right-panel="rightPanel"
        :tasks="tasks"
        @enter-task="enterTask"
        @start-create="startCreateTask"
        @delete-task="deleteTask"
      />
    </template>

    <!-- 标题栏右侧操作区 -->
    <template #chat-header-actions>
      <span class="token-counter" v-if="estimatedTokens > 0"><i class="el-icon-coin"></i> {{ formattedTokens }}</span>
      <span class="header-onboarding-btn" @click="startOnboarding"><i class="el-icon-aim"></i> 新手引导</span>
      <span class="header-onboarding-btn" @click="newConversation"><i class="el-icon-plus"></i> 新建对话</span>
    </template>

    <!-- 左侧历史对话栏内容 -->
    <template #history-sidebar>
      <div class="fp-side-history">
        <div class="fp-side-head">
          <span>历史对话</span>
          <span class="fp-side-count">{{ conversations.length }}</span>
        </div>
        <div class="fp-side-list">
          <div v-for="c in conversations" :key="c.id" class="fp-side-item" @click="$message.info('恢复对话：' + c.name)">
            <div class="fp-side-name">{{ c.name }}</div>
            <div class="fp-side-meta">{{ c.messageCount }} 条 · {{ c.updateTime }}</div>
          </div>
          <div v-if="conversations.length === 0" class="fp-side-empty">
            <i class="el-icon-chat-line-square"></i>
            <span>暂无历史对话</span>
          </div>
        </div>
      </div>
    </template>
  </agent-app-layout>

  <!-- 新手引导 -->
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
// 演示数据版本：修改演示数据后递增此值，页面加载时自动清除旧缓存
const ORG_DATA_VERSION = '2026-10-29.3'

import AgentAppLayout from '@/pages/zcip/agent-center/views/components/AgentAppLayout.vue'
import ParkRightPanel from './components/ParkRightPanel.vue'
import OnboardingGuide from '@/pages/zcip/agent-center/components/OnboardingGuide.vue'

export default {
  name: 'OrgAccountingCenter',
  components: {
    AgentAppLayout,
    ParkRightPanel,
    OnboardingGuide
  },
  data() {
    return {
      rightPanel: 'tasks',
      showOnboarding: false,
      onboardingStep: 0,
      // 当前园区（园区碳核算以园区法定地理边界为主体）
      tempRange: [],
      periodPickerOptions: {
        shortcuts: [
          { text: '本年度', onClick(picker) { const y = new Date().getFullYear(); picker.$emit('pick', [new Date(y, 0, 1), new Date(y, 11, 31)]) } },
          { text: '上年度', onClick(picker) { const y = new Date().getFullYear() - 1; picker.$emit('pick', [new Date(y, 0, 1), new Date(y, 11, 31)]) } },
          { text: '本季度', onClick(picker) { const d = new Date(); const q = Math.floor(d.getMonth() / 3); picker.$emit('pick', [new Date(d.getFullYear(), q * 3, 1), new Date(d.getFullYear(), q * 3 + 3, 0)]) } },
          { text: '本月', onClick(picker) { const d = new Date(); picker.$emit('pick', [new Date(d.getFullYear(), d.getMonth(), 1), new Date(d.getFullYear(), d.getMonth() + 1, 0)]) } }
        ]
      },
      enterprise: {
        name: '北京亦庄新城零碳智能产业园',
        industry: '零碳产业园区'
      },
      messages: [],
      // 核算任务（演示保留 1 条）
      tasks: [], // 由 loadTasks() 从 org_task_list 填充
      conversations: [
        { id: 'C-001', name: '2025年度排放核算咨询', messageCount: 12, updateTime: '2026-09-11 10:30' }
      ]
    }
  },
  computed: {
    // 园区碳核算专属新手引导文案
    onboardingSteps() {
      return [
        {
          icon: 'el-icon-s-home',
          title: '欢迎使用园区碳核算',
          text: '这里是园区碳核算工作空间。依据《零碳园区碳排放核算方法（试行）》，为园区完成碳排放核算与零碳指标评价——从核算边界、排放源清单、活动数据采集到指标诊断与报告生成，全程智能引导。',
          features: [
            { icon: 'el-icon-chat-dot-round', title: '对话式核算', desc: '用自然语言描述需求，智能体自动引导核算流程', color: '#0067fe' },
            { icon: 'el-icon-set-up', title: '四大法定分类', desc: '化石燃料燃烧、能源加工转换、净购入电力热力、工业过程', color: '#0067fe' },
            { icon: 'el-icon-document-checked', title: '合规可溯源', desc: '依据《零碳园区碳排放核算方法（试行）》附件4，1 核心 + 5 引导指标', color: '#0067fe' }
          ],
          tip: '首次使用建议依次浏览全部引导内容，约需 1 分钟。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-chat-dot-round',
          title: '智能对话区',
          text: '页面左侧为对话区，直接输入核算需求（如「新建核算」「查看核算边界」「查询排放因子」），智能体会按核算要求逐项引导。核算主体为园区法定地理边界。',
          features: [
            { icon: 'el-icon-edit-outline', title: '自然语言输入', desc: '描述核算需求即可启动流程', color: '#0067fe' },
            { icon: 'el-icon-magic-stick', title: '智能引导', desc: '按核算要求逐项引导数据填报与核对', color: '#0067fe' },
            { icon: 'el-icon-data-analysis', title: '实时计算', desc: '数据录入即计算，随时查看中间结果', color: '#ED7B2F' }
          ],
          tip: '试试输入「新建核算」开始园区的碳排放核算。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-chat-line-round',
          title: '历史对话',
          text: '左侧可展开历史对话栏，自动保存每一次对话记录。可随时回看之前的咨询内容、继续未完成的对话，快速定位历史记录。',
          features: [
            { icon: 'el-icon-clock', title: '自动保存', desc: '每次对话自动记录，无需手动操作', color: '#0067fe' },
            { icon: 'el-icon-refresh-left', title: '一键续作', desc: '点击历史对话可恢复上下文，继续之前的工作', color: '#0067fe' }
          ],
          tip: '历史对话按时间倒序排列，最近的对话排在最前。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-s-order',
          title: '核算任务',
          text: '右侧为核算任务列表，展示园区的核算任务进度与状态。每个任务卡片显示核算年度、核算标准、当前步骤、完成进度和更新时间，点击即可进入该任务的核算详情。',
          features: [
            { icon: 'el-icon-aim', title: '进度跟踪', desc: '实时显示任务完成度和当前所处阶段', color: '#0067fe' },
            { icon: 'el-icon-warning-outline', title: '异常提醒', desc: '数据缺失或校验失败时自动标记异常', color: '#F56C6C' },
            { icon: 'el-icon-search', title: '快速筛选', desc: '支持按任务名称或核算期间搜索', color: '#0067fe' }
          ],
          tip: '任务按更新时间倒序排列，运行中的任务排在最前。',
          iconStyle: {}
        }
      ]
    },
    estimatedTokens() {
      let total = 0
      this.messages.forEach(m => {
        total += Math.ceil(((m.text || '') + '').length / 1.5)
      })
      return total
    },
    formattedTokens() {
      return this.estimatedTokens >= 1000 ? (this.estimatedTokens / 1000).toFixed(1) + 'k tokens' : this.estimatedTokens + ' tokens'
    }
  },
  mounted() {
    // 数据版本检查：版本变化则清除旧缓存，确保演示数据与代码一致
    try {
      if (localStorage.getItem('org_data_ver') !== ORG_DATA_VERSION) {
        localStorage.removeItem('park_task_list')
        localStorage.removeItem('org_onboarding_done')
        localStorage.setItem('org_data_ver', ORG_DATA_VERSION)
      }
    } catch (e) { /* ignore */ }

    // 从统一数据源（org_task_list）加载任务
    this.loadTasks()

    // 首次访问自动弹出新手引导
    try {
      if (!localStorage.getItem('org_onboarding_done')) {
        this.showOnboarding = true
      }
    } catch (e) { /* ignore */ }

    this.pushWelcomeMessage()
  },
  methods: {
    // 进入核算详情界面
    enterTask(task) {
      if (!task || !task.id) return
      // 双模式：默认任务走三步·五项确认，新建任务走九阶段
      const isDefault = task.mode === 'default' || task.id === 'PARK-DEFAULT'
      // 用 replace 避免平台页签栏新增一个页签
      if (isDefault) {
        this.$router.replace({
          path: '/park-accounting/accounting/agent',
          query: { task: task.id }
        })
      } else {
        // 九阶段：direct=true 直接进入对话模式（跳过任务列表）
        this.$router.replace({
          path: '/park-accounting/accounting/stages9',
          query: { task: task.id, direct: 'true' }
        })
      }
    },
    /** 从统一数据源加载任务列表（org_task_list）并映射为卡片结构 */
    loadTasks() {
      let raw = []
      try { raw = JSON.parse(localStorage.getItem('park_task_list') || '[]') } catch (e) { raw = [] }
      if (Array.isArray(raw) && raw.length) {
        this.tasks = raw.map(this.mapTask)
      } else {
        // 无数据 → 用演示数据初始化并落库
        this.tasks = [{
          id: 'PARK-DEFAULT',
          mode: 'default',
          name: '北京亦庄新城零碳智能产业园 碳排放核算',
          periodText: '2025-01-01 ~ 2025-12-31',
          standard: '零碳园区碳排放核算方法（试行）',
          status: '运行中',
          currentStepIndex: 0,
          currentStage: '步骤1·园区主体与依据',
          updateTime: '2026-11-11'
        }]
        this.saveTasks()
      }
    },
    /** 任务数据 → 卡片结构 */
    mapTask(t) {
      // 双模式：默认任务用三步，新建任务用九阶段
      const STEPS_3 = ['步骤1·园区主体与依据', '步骤2·核算底账与源清单', '步骤3·园区核算模型']
      const STEPS_9 = ['阶段1·核算依据', '阶段2·核算边界', '阶段3·核算模型', '阶段4·活动数据', '阶段5·排放因子',
        '阶段6·数据校验', '阶段7·排放计算', '阶段8·排放分析', '阶段9·排放报告']
      const isDefault = t.mode === 'default' || t.id === 'PARK-DEFAULT'
      const STEPS = isDefault ? STEPS_3 : STEPS_9
      const step = Number(t.currentStepIndex) || 0
      const statusMap = { 'in-progress': '运行中', 'completed': '已完成', 'error': '异常' }
      return {
        id: t.id,
        name: t.productName || t.name || '园区碳排放核算',
        periodText: t.periodText || '',
        standard: t.standard || '',
        status: statusMap[t.status] || t.status || '运行中',
        currentStepIndex: step,
        currentStage: t.currentStage || STEPS[step] || STEPS[0],
        updateTime: t.updatedAt || t.createdAt || ''
      }
    },
    /** 删除任务 */
    deleteTask(task) {
      if (!task || !task.id) return
      this.$confirm('确定删除任务「' + task.name + '」？删除后不可恢复。', '删除确认', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.tasks = this.tasks.filter(t => t.id !== task.id)
        this.saveTasks()
        this.$message.success('已删除任务')
      }).catch(() => {})
    },
    /** 卡片结构 → 任务数据（写回统一数据源） */
    saveTasks() {
      try {
        const backMap = { '运行中': 'in-progress', '已完成': 'completed', '异常': 'error' }
        const raw = this.tasks.map(t => ({
          id: t.id,
          productName: t.name,
          periodText: t.periodText,
          standard: t.standard,
          currentStepIndex: t.currentStepIndex || 0,
          status: backMap[t.status] || t.status,
          createdAt: t.updateTime,
          updatedAt: t.updateTime
        }))
        localStorage.setItem('park_task_list', JSON.stringify(raw))
      } catch (e) { /* ignore */ }
    },
    // 新建核算：时间范围已解析 → 带参进入任务界面（阶段1 预填时间范围，标准在任务内确认）
    goCreateTask(period) {
      // 新建任务 → 直接进入九阶段（direct=true 跳过任务列表）
      // 用 replace 避免平台页签栏新增一个页签
      this.$router.replace({
        path: '/park-accounting/accounting/stages9',
        query: { new: '1', direct: 'true', start: period.start, end: period.end }
      })
    },
    // 未识别时间范围时引导补充
    startCreateTask() {
      this.messages.push({
        role: 'agent',
        text: '请告知本次核算的**时间范围**，例如：<br/>'
          + '• 2025年度 → 全年<br/>'
          + '• 2025年1月 → 单月<br/>'
          + '• 2025年一季度 → 单季度<br/>'
          + '• 2025-01-01 至 2025-12-31 → 自定义区间<br/><br/>'
          + '确认时间范围后进入核算任务，标准与边界在任务内确认。',
        time: '刚刚',
        type: 'text',
        suggestions: ['2025年度', '2025年1月', '2025年一季度']
      })
    },
    /** 确认时间范围 → 进入任务 */
    confirmPeriod() {
      if (!this.tempRange || this.tempRange.length < 2) {
        this.$message.warning('请选择核算时间范围')
        return
      }
      this.goCreateTask({ start: this.tempRange[0], end: this.tempRange[1] })
    },
    /** 取消时间选择 */
    cancelPeriod() {
      this.messages = this.messages.filter(m => m.type !== 'form')
      this.messages.push({
        role: 'agent',
        text: '已取消。需要开始核算时，输入「新建核算」即可。',
        time: '刚刚',
        type: 'text'
      })
    },
    /** 任务名预览（按时间范围判断年/季/月/自定义） */
    previewTaskName() {
      const r = this.tempRange || []
      if (r.length < 2 || !r[0] || !r[1]) return '园区碳排放核算'
      const sd = new Date(r[0])
      const ed = new Date(r[1])
      const sameYear = sd.getFullYear() === ed.getFullYear()
      const lastDay = new Date(ed.getFullYear(), ed.getMonth() + 1, 0).getDate()
      const isFirst = sd.getDate() === 1
      const isEnd = ed.getDate() === lastDay
      if (sameYear && sd.getMonth() === 0 && isFirst && ed.getMonth() === 11 && ed.getDate() === 31) {
        return '年度园区碳排放核算'
      }
      if (sameYear && isFirst && isEnd) {
        const sm = sd.getMonth() + 1
        const em = ed.getMonth() + 1
        if ([1, 4, 7, 10].indexOf(sm) > -1 && [3, 6, 9, 12].indexOf(em) > -1 && em - sm === 2) {
          return '季度园区碳排放核算'
        }
      }
      if (sameYear && sd.getMonth() === ed.getMonth() && isFirst && isEnd) {
        return '月度园区碳排放核算'
      }
      return '园区碳排放核算'
    },
    /** 从自然语言解析核算时间范围（年 / 季度 / 半年 / 月 / 自定义区间） */
    parsePeriod(text) {
      const t = (text || '').trim()
      const pad = x => (x < 10 ? '0' + x : '' + x)
      const lastDay = (y, m) => new Date(y, m, 0).getDate()
      const mk = (y1, m1, d1, y2, m2, d2) => ({
        start: y1 + '-' + pad(m1) + '-' + pad(d1),
        end: y2 + '-' + pad(m2) + '-' + pad(d2)
      })

      // ① 自定义区间
      let m = t.match(/(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?\s*[至到~－—-]\s*(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/)
      if (m) return mk(+m[1], +m[2], +m[3], +m[4], +m[5], +m[6])

      // ② 季度
      m = t.match(/(\d{4})\s*年?\s*(?:[Qq]([1-4])|第?([一二三四1-4])季度)/)
      if (m) {
        const y = +m[1]
        const qMap = { '一': 1, '二': 2, '三': 3, '四': 4 }
        const q = +(m[2] || qMap[m[3]] || m[3])
        if (q >= 1 && q <= 4) {
          const sm = (q - 1) * 3 + 1
          const em = q * 3
          return mk(y, sm, 1, y, em, lastDay(y, em))
        }
      }

      // ③ 半年
      m = t.match(/(\d{4})\s*年?\s*(上|下)半年/)
      if (m) {
        const y = +m[1]
        return m[2] === '上' ? mk(y, 1, 1, y, 6, 30) : mk(y, 7, 1, y, 12, 31)
      }

      // ④ 单月
      m = t.match(/(\d{4})\s*[-/.年]\s*(\d{1,2})\s*月份?/)
      if (m) {
        const y = +m[1]
        const mo = +m[2]
        if (mo >= 1 && mo <= 12) return mk(y, mo, 1, y, mo, lastDay(y, mo))
      }

      // ⑤ 年度
      m = t.match(/(\d{4})\s*年?度?/)
      if (m) {
        const y = +m[1]
        if (y >= 2000 && y <= 2100) return mk(y, 1, 1, y, 12, 31)
      }

      return null
    },
    showCmdHint() {
      this.messages.push({
        role: 'agent',
          text: '💡 常用指令：<br/>• <strong>新建核算</strong> — 创建园区核算任务<br/>• <strong>核算进度</strong> — 查看任务所处环节<br/>• <strong>任务列表</strong> — 查看全部任务<br/>• <strong>核算边界</strong> — 查看园区核算边界<br/>• <strong>排放源</strong> — 查看四大分类排放源',
        time: '刚刚',
        type: 'text'
      })
    },
    onUserSend(text) {
      const t = (text || '').trim()
      if (!t) return
      this.messages.push({ role: 'user', text: t, time: '刚刚', type: 'text' })
      const reply = this.reply(t)
      if (reply) {
        this.messages.push({ role: 'agent', text: reply, time: '刚刚', type: 'text' })
      }
    },
    reply(input) {
      const t = input || ''
      if (/继续上次|继续核算|继续任务/.test(t)) {
        const last = this.tasks.find(x => x.status === '运行中')
        if (last) {
          this.enterTask(last)
          return '正在进入「' + last.name + '」…'
        }
        return '当前没有进行中的核算任务，输入「新建核算」开始一次核算。'
      }
      if (/新建|创建|开始核算|核算\d{4}|\d{4}\s*年/.test(t)) {
        const period = this.parsePeriod(t)
        if (period) {
          this.goCreateTask(period)
          return '正在进入核算任务（' + period.start + ' ~ ' + period.end + '）…'
        }
        // 未识别到时间范围 → 弹出时间选择器
        this.tempRange = []
        this.messages.push({
          role: 'agent',
          text: '请选择本次核算的**时间范围**（也可直接输入"2025年度""2025年1月"等）：',
          time: '刚刚',
          type: 'form'
        })
        return ''
      }
      if (/范围|边界|scope/i.test(t)) {
        return '核算范围属于具体任务的核算内容，进入对应任务后可在「核算边界」「核算模型」环节查看。'
      }
      if (/进度|状态|任务/.test(t)) {
        const running = this.tasks.filter(x => x.status === '运行中').length
        const done = this.tasks.filter(x => x.status === '已完成').length
        return '共 ' + this.tasks.length + ' 个核算任务：' + running + ' 个运行中 · ' + done + ' 个已完成。<br/>点击右侧任务卡片可继续推进。'
      }
      if (/因子/.test(t)) {
          return '排放因子来源：<br/>• 化石燃料燃烧：低位发热量 × 单位热值含碳量 × 碳氧化率（DB11 或 IPCC 缺省值）<br/>• 净购入电力：华北区域电网排放因子<br/>• 净购入热力：热力排放因子<br/>• 工业过程：按产品归集的过程排放因子<br/><br/>数据来源：能源台账、结算凭证、计量记录、产量统计报表';
      }
      if (/标准|依据/.test(t)) {
          return '核算依据：<strong>《零碳园区碳排放核算方法（试行）》</strong>（国家发展改革委等部门 · 零碳园区建设通知附件4）<br/><br/>核心要求：<br/>• 边界：园区法定地理边界<br/>• 范围：化石燃料燃烧 + 能源加工转换 + 净购入电力热力 + 工业过程<br/>• 气体：仅二氧化碳（CO₂）<br/>• 计量：万吨 CO₂（总量）/ tCO₂/tce（强度）';
      }
      if (/企业|主体/.test(t)) {
          return '当前核算主体：<strong>' + this.enterprise.name + '</strong>（零碳产业园区）<br/>边界口径：园区法定地理边界<br/>核算范围：四大法定分类<br/>气体范围：仅 CO₂';
      }
          return '我可以帮您：<br/>• <strong>新建核算</strong> — 创建园区核算任务<br/>• <strong>核算进度</strong> — 查看任务所处环节<br/>• <strong>任务列表</strong> — 查看全部核算任务<br/>• <strong>核算边界</strong> — 查看园区边界与范围';
    },
    startOnboarding() {
      this.onboardingStep = 0
      this.showOnboarding = true
    },
    finishOnboarding() {
      this.showOnboarding = false
      try { localStorage.setItem('org_onboarding_done', '1') } catch (e) { /* ignore */ }
    },
    newConversation() {
      this.messages = []
      this.pushWelcomeMessage()
      this.$message.success('已开启新对话')
    },
    // 公共欢迎语（初始化与新建对话共用，数据动态实时计算）
    pushWelcomeMessage() {
      const running = this.tasks.filter(t => t.status === '运行中').length
      const done = this.tasks.filter(t => t.status === '已完成').length
      const expt = this.tasks.filter(t => t.status === '异常').length
      const lastRunning = this.tasks.find(t => t.status === '运行中')
      this.messages.push({
        role: 'agent',
        text:
            '<strong>您好，我是小易！</strong>园区碳核算智能体已就绪。<br/><br/>' +
            '我将协助您完成园区的碳排放核算与零碳指标评价。<br/><br/>' +
          '<div style="margin:8px 0;padding:12px 14px;background:rgba(230,126,34,0.04);border-radius:8px;border-left:3px solid #E67E22;">' +
            '<strong style="color:#E67E22;">当前园区</strong><br/>' +
          this.enterprise.name + '（' + this.enterprise.industry + '）' +
          '</div>' +
          '<div style="margin-top:8px;padding:10px 14px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067fe;">' +
          '<strong style="color:#0067fe;">进行中的任务</strong><br/>' +
          running + ' 个任务进行中，' + done + ' 个已完成' +
          (expt > 0 ? ' · <span style="color:#F56C6C;font-weight:600;">' + expt + ' 个异常待处理</span>' : '') +
          (lastRunning ? '<br/><span style="font-size:12px;color:#909399;">最近：' + lastRunning.name + ' · ' + lastRunning.currentStage + '</span>' : '') +
          '</div>' +
          '<div style="margin-top:8px;padding:10px 14px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067fe;">' +
          '<strong style="color:#0067fe;">我能做什么</strong><br/>' +
          '• <strong>新建核算</strong> — 输入"新建核算"开始一次核算<br/>' +
          '• <strong>进度跟踪</strong> — 查看各任务所处环节与完成情况<br/>' +
          '• <strong>报告编制</strong> — 核算完成后生成排放报告<br/>' +
          '• <strong>数据核对</strong> — 提示数据缺失、口径不一致等问题' +
          '</div>' +
          '<div style="margin-top:10px;color:#909399;font-size:12px;">需要我做什么？您可以直接输入问题，或点击右侧查看核算任务。</div>',
        time: '刚刚',
        type: 'text',
        suggestions: lastRunning ? ['继续上次核算', '新建核算', '查看进度'] : ['新建核算', '查看进度']
      })
    }
  }
}
</script>

<style scoped>
.park-accounting-page {
  height: 100%;
  position: relative;
}

/* ===== 左侧历史对话栏内容 ===== */
.fp-side-history {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.fp-side-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 700;
  color: #303133;
  border-bottom: 1px solid rgba(0, 103, 254, 0.06);
}
.fp-side-count {
  background: rgba(0, 103, 254, 0.08);
  border-radius: 10px;
  padding: 1px 8px;
  font-size: 11px;
  color: #909399;
  font-weight: 400;
}
.fp-side-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
}
.fp-side-list::-webkit-scrollbar { width: 4px; }
.fp-side-list::-webkit-scrollbar-thumb { background: rgba(0, 103, 254, 0.15); border-radius: 4px; }
.fp-side-item {
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: background 0.2s;
}
.fp-side-item:hover { background: rgba(0, 103, 254, 0.06); }
.fp-side-name {
  font-size: 12px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fp-side-meta { font-size: 10px; color: #c0c4cc; margin-top: 2px; }
.fp-side-empty {
  text-align: center;
  padding: 30px 0;
  color: #c0c4cc;
  font-size: 12px;
}
.fp-side-empty i { font-size: 28px; display: block; margin-bottom: 6px; }

/* 内建创建表单在气泡里的额外局部样式 */
.msg-form {
  max-width: 440px;
}
.range-preview {
  margin-top: 10px;
  padding: 8px 10px;
  background: rgba(0, 103, 254, 0.04);
  border-radius: 6px;
  font-size: 12px;
  color: #475569;
  line-height: 1.7;
}
.range-preview b {
  color: #0067fe;
}
.range-detail {
  color: #64748b;
  font-size: 11.5px;
}
.range-empty {
  background: rgba(230, 162, 60, 0.08);
  color: #b88230;
}
.form-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.msg-form >>> .el-form-item { margin-bottom: 10px !important; }
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

/* 标题栏新手引导/新建对话按钮（与 agent-global.css 的胶囊样式一致） */
.header-onboarding-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid #dbe5f1;
  background: rgba(255, 255, 255, 0.7);
  font-family: 'Exo 2', sans-serif;
}
.header-onboarding-btn:hover {
  border-color: #0067fe;
  color: #0067fe;
  background: rgba(255, 255, 255, 0.9);
}
.header-onboarding-btn i {
  font-size: 13px;
}
/* token 消耗 */
.token-counter {
  font-size: 11px;
  color: #94a3b8;
  padding: 3px 10px;
  background: rgba(0, 103, 254, 0.04);
  border: 1px solid rgba(0, 103, 254, 0.08);
  border-radius: 10px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'Exo 2', sans-serif;
}
.token-counter i { font-size: 13px; color: #E6A23C; }
</style>
