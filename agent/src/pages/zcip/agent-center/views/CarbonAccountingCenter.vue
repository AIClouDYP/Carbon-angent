<template>
  <div class="carbon-accounting-page">
  <agent-app-layout
    agent-name="小易"
    agent-icon="ai-core"
    agent-theme-color="rgb(0,103,254)"
    avatar-bg-color="rgba(0,103,254,0.1)"
    placeholder-text="提问或输入指令（如：新建任务）…"
    :messages="messages"
    :show-default-welcome="false"
    :show-history-sidebar="true"
    @send="onUserSend"
    @cmd-click="showCmdHint"
    ref="layoutRef"
  >
    <!-- 对话框中内嵌创建任务表单 -->
    <template #msg-form="{ msg }">
      <div class="msg-form">
        <div class="form-title"><i class="el-icon-edit-outline"></i> 创建核算任务</div>
        <el-form :model="newTask" label-width="80px" size="small">
          <el-form-item label="任务名称">
            <el-input v-model="newTask.name" placeholder="如：动力电池碳足迹核算"></el-input>
          </el-form-item>
          <el-form-item label="核算产品">
            <el-select v-model="newTask.productId" filterable placeholder="选择企业产品" style="width:100%;" @change="onProductSelect">
              <el-option v-for="p in enterpriseProducts" :key="p.id" :label="p.name" :value="p.id">
                <span style="float:left">{{ p.name }}</span>
                <span style="float:right;color:#8492a6;font-size:12px;">{{ p.category }}</span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="核算标准">
            <el-select v-model="newTask.standard" placeholder="选择标准" style="width:100%;">
              <el-option label="ISO 14067" value="ISO 14067"></el-option>
              <el-option label="GHG Protocol" value="GHG Protocol"></el-option>
              <el-option label="PAS 2050" value="PAS 2050"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
        <div class="form-actions">
          <el-button size="small" @click="cancelCreate">取消</el-button>
          <el-button size="small" type="primary" style="background:rgb(0,103,254);border-color:rgb(0,103,254);" @click="submitCreate">创建并开始核算</el-button>
        </div>
      </div>
    </template>

    <!-- 右侧联动面板 -->
    <template #right-panel>
      <carbon-right-panel
        :right-panel="rightPanel"
        :tasks="tasks"
        :conversations="conversations"
        :products="enterpriseProducts"
        :sops="productSOPs"
        @tab-switch="onTabSwitch"
        @enter-task="enterTask"
        @delete-task="deleteTask"
        @start-create="startCreateTask"
        @quick-calc="quickCalcWithSOP"
        @go-to-product-library="goToProductLibrary"
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
    @next="onboardingStep < onboardingSteps.length - 1 ? onboardingStep++ : finishOnboarding()"
    @finish="finishOnboarding"
  />
  </div>
</template>

<script>
import AgentAppLayout from './components/AgentAppLayout.vue'
import CarbonRightPanel from './components/CarbonRightPanel.vue'
import OnboardingGuide from '../components/OnboardingGuide.vue'
import { loadCfpProducts } from '@/utils/productStore'

export default {
  name: 'CarbonAccountingCenter',
  components: {
    AgentAppLayout,
    CarbonRightPanel,
    OnboardingGuide
  },
  data() {
    return {
      rightPanel: 'tasks',
      showOnboarding: false,
      onboardingStep: 0,
      onboardingSteps: [
        {
          icon: 'el-icon-s-home',
          title: '欢迎使用产品碳足迹工作台',
          text: '本页面负责任务入口与管理：左侧为历史对话栏，中间为对话区和创建任务表单，右侧可在「任务列表」与「企业产品库」之间切换。创建或选择任务后，将进入独立的任务详情页完成九阶段核算。',
          features: [
            { icon: 'el-icon-s-grid', title: '三栏布局', desc: '左历史对话 / 中对话 / 右任务与产品', color: '#0067FE' },
            { icon: 'el-icon-s-operation', title: '两页签', desc: '任务列表 + 企业产品库', color: '#0067FE' },
            { icon: 'el-icon-right', title: '双页分工', desc: '工作台管理入口，任务详情承载核算', color: '#ED7B2F' }
          ],
          tip: '首次使用建议依次浏览全部引导内容，约需 1 分钟。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-chat-dot-round',
          title: '中间对话与创建任务',
          text: '在中间对话区输入「新建任务」可调出内嵌创建任务表单，填写任务名称、选择企业产品与核算标准。创建后系统保存任务并跳转到任务详情页。',
          features: [
            { icon: 'el-icon-edit-outline', title: '内嵌表单', desc: '任务名称 / 产品 / 标准一次填写', color: '#0067FE' },
            { icon: 'el-icon-magic-stick', title: '对话驱动', desc: '也可直接输入需求或快捷指令', color: '#0067FE' },
            { icon: 'el-icon-right', title: '创建即进入', desc: '创建成功后进入独立任务详情页', color: '#ED7B2F' }
          ],
          tip: '试试输入「新建任务」调出创建表单。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-chat-line-square',
          title: '左侧历史对话栏',
          text: '工作台左侧展示历史对话条目及消息数、更新时间；点击条目可查看恢复提示。标题栏「新建对话」会重置当前会话并重新显示欢迎语。',
          features: [
            { icon: 'el-icon-clock', title: '历史索引', desc: '按条目查看历史咨询和更新时间', color: '#0067FE' },
            { icon: 'el-icon-plus', title: '新建对话', desc: '标题栏可清空当前会话', color: '#0067FE' },
            { icon: 'el-icon-aim', title: '重新引导', desc: '标题栏「新手引导」可再次打开本说明', color: '#909399' }
          ],
          tip: '历史对话属于工作台左栏，不在任务详情页展示。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-s-order',
          title: '右侧任务列表',
          text: '右侧第一个页签为近期核算任务。卡片显示产品、阶段、进度、状态和更新时间；点击任务进入任务详情页继续九阶段核算，已归档任务不允许删除。',
          features: [
            { icon: 'el-icon-aim', title: '进度跟踪', desc: '卡片显示当前阶段与完成进度', color: '#0067FE' },
            { icon: 'el-icon-right', title: '一键续作', desc: '点击卡片进入任务详情页', color: '#0067FE' },
            { icon: 'el-icon-lock', title: '归档保护', desc: '已归档任务隐藏删除入口', color: '#F56C6C' }
          ],
          tip: '进行中、已完成未归档可删；只有已归档不可删。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-s-goods',
          title: '右侧企业产品库',
          text: '右侧第二个页签展示产品品类、型号以及「有SOP / 待构建」状态。点击「开始核算」可直接发起核算：有 SOP 可继承模型，待构建则从零建模；齿轮按钮可前往产品库管理。',
          features: [
            { icon: 'el-icon-box', title: '产品信息', desc: '卡片显示品类与型号', color: '#0067FE' },
            { icon: 'el-icon-document-checked', title: 'SOP 状态', desc: '有SOP可继承，待构建需新建模型', color: '#0067FE' },
            { icon: 'el-icon-data-analysis', title: '开始核算', desc: '从产品卡片直接进入任务详情', color: '#ED7B2F' }
          ],
          tip: '工作台产品卡片不展示数据完整度和历史核算次数。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-success',
          title: '一切就绪！',
          text: '您已了解工作台与任务详情页的分工：工作台负责历史对话、创建任务、任务列表和企业产品库；任务详情页负责左侧对话与右侧九阶段核算。',
          features: [
            { icon: 'el-icon-s-data', title: '任务详情', desc: '左对话、右九阶段，顶部可返回工作台', color: '#0067FE' },
            { icon: 'el-icon-refresh', title: '重置会话', desc: '任务详情顶部可重置当前核算会话', color: '#0067FE' },
            { icon: 'el-icon-aim', title: '独立页签', desc: '工作台与任务详情分别激活页签', color: '#722ED1' }
          ],
          tip: '如需再次查看本引导，点击标题栏「新手引导」按钮。',
          iconStyle: { color: 'var(--success)' }
        }
      ],
      newTask: { name: '', productId: '', product: '', standard: 'ISO 14067', sopId: null },
      messages: [],
      tasks: [],
      conversations: [
        { id: 'C-001', name: '动力电池碳足迹核算咨询', preview: '关于三元锂电池组EV700的碳足迹核算流程...', messageCount: 12, updateTime: '2026-07-14 10:30' },
        { id: 'C-002', name: '驱动电机LCA标准选择', preview: 'ISO 14067与GHG Protocol在电机核算中的差异...', messageCount: 8, updateTime: '2026-07-12 15:20' },
        { id: 'C-003', name: '充电桩排放因子查询', preview: '直流快充桩120kW的电力排放因子如何选取...', messageCount: 5, updateTime: '2026-07-10 09:15' },
        { id: 'C-004', name: '汽车座椅数据采集指导', preview: '真皮电动座椅总成的BOM清单数据采集方法...', messageCount: 15, updateTime: '2026-07-08 14:00' },
        { id: 'C-005', name: '铝合金回收阶段碳排放', preview: '压铸铝合金前舱盖报废回收阶段如何核算...', messageCount: 10, updateTime: '2026-07-05 16:45' }
      ],
      enterpriseProducts: [],
      productSOPs: []
    }
  },
  computed: {
    estimatedTokens() {
      let total = 0
      this.messages.forEach(m => {
        const content = m.text || ''
        total += Math.ceil(content.length * 1.5)
      })
      return total
    },
    formattedTokens() {
      const t = this.estimatedTokens
      if (t >= 10000) return (t / 10000).toFixed(1) + '万 tokens'
      if (t >= 1000) return (t / 1000).toFixed(1) + 'k tokens'
      return t + ' tokens'
    }
  },
  beforeDestroy() {
    window.removeEventListener('cfp-products-changed', this._onProductsChanged)
    window.removeEventListener('cfp-tasks-changed', this._onTasksChanged)
  },
  mounted() {
    // 从企业产品库统一存取（cfp_products_v4，与 EnterpriseProductLibrary 同源）
    try {
      this.enterpriseProducts = loadCfpProducts()
      // 兼容字段补齐：v4 产品无 sopIds（SOP 关联由 cfp_sops 反查），缺省为空
      this.enterpriseProducts.forEach(p => { if (!p.sopIds) p.sopIds = [] })
      const savedSOPs = localStorage.getItem('cfp_sops')
      if (savedSOPs) {
        this.productSOPs = JSON.parse(savedSOPs)
      }
    } catch (e) { /* ignore */ }

    // 企业产品库增删改后实时刷新（自定义事件广播）
    this._onProductsChanged = () => {
      this.enterpriseProducts = loadCfpProducts()
      this.enterpriseProducts.forEach(p => { if (!p.sopIds) p.sopIds = [] })
    }
    window.addEventListener('cfp-products-changed', this._onProductsChanged)

    // 从 cfp_task_list 加载真实核算任务（与任务详情页 agentChatMixin 同源）
    this.loadCfpTasks()
    // 任务详情页任务增删改后实时刷新
    this._onTasksChanged = () => { this.loadCfpTasks() }
    window.addEventListener('cfp-tasks-changed', this._onTasksChanged)

    // 首次访问自动弹出新手引导
    try {
      if (!localStorage.getItem('cfp_onboarding_done')) {
        this.showOnboarding = true
      }
    } catch (e) { /* ignore */ }

    this.pushWelcomeMessage()
  },
  methods: {
    // ===== 任务列表：读 cfp_task_list 并映射为卡片字段 =====
    loadCfpTasks() {
      var raw = []
      try { raw = JSON.parse(localStorage.getItem('cfp_task_list') || '[]') } catch (e) { raw = [] }
      if (!Array.isArray(raw)) raw = []
      // 无快照的自动生成任务一律视为脏数据（旧 bug 每次挂载 unshift 的副本，产品名可能是任意 query 值）
      var isStaleShell = function(t) {
        var snap = t.stageSnapshot
        var hasSnap = snap && ((snap.messages && snap.messages.length) || snap.isModelBuilt)
        return !hasSnap
      }
      var removed = 0
      // 企业产品库产品名集合：用真实产品新建的任务即使暂无快照也不是脏数据
      var productNames = {}
      try {
        var prods = JSON.parse(localStorage.getItem('cfp_products_v4') || '[]')
        if (Array.isArray(prods)) prods.forEach(function(p) { if (p && p.name) productNames[p.name] = true })
      } catch (e) { /* ignore */ }
      // 同 id 只保留首条
      var seen = {}
      var clean = raw.filter(function(t) {
        if (!t || !t.id) { removed++; return false }
        if (seen[t.id]) { removed++; return false }
        seen[t.id] = true
        // 剔除旧 bug 产生、从未保存过进度且不是示例任务/真实产品的空壳任务
        if (t.id !== 'task-wind-preset' && t.id !== 'task-ice-a160-preset' && isStaleShell(t) && !productNames[t.productName]) {
          removed++
          return false
        }
        return true
      })
      // 一次性清理：同一产品只保留「有快照且在推进」的最新一条，其余视为历史副本；
      // 预置示例任务/无重名冲突的任务不参与合并
      var presetIds = { 'task-wind-preset': true, 'task-ice-a160-preset': true }
      var nameCount = {}
      clean.forEach(function(t) { var k = t.productName || ''; nameCount[k] = (nameCount[k] || 0) + 1 })
      var byProduct = {}
      var finalList = []
      clean.forEach(function(t) {
        var snap = t.stageSnapshot || {}
        var key = t.productName || ''
        // 只在同产品名出现多条时才做合并收口，避免把唯一的真实任务误删
        if (presetIds[t.id] || nameCount[key] < 2) { finalList.push(t); return }
        var stepIdx = typeof snap.currentStepIndex === 'number' ? snap.currentStepIndex : (t.currentStepIndex || 0)
        var snapshotMsgCount = (snap.messages && snap.messages.length) || 0
        var weight = stepIdx * 1000 + Math.min(snapshotMsgCount, 999)
        var prev = byProduct[key]
        if (prev == null) {
          byProduct[key] = { idx: finalList.length, weight: weight }
          finalList.push(t)
        } else if (weight > prev.weight) {
          finalList[prev.idx] = t
          byProduct[key] = { idx: prev.idx, weight: weight }
          removed++
        } else {
          removed++
        }
      })
      if (removed > 0) {
        try {
          localStorage.setItem('cfp_task_list', JSON.stringify(finalList))
          window.dispatchEvent(new CustomEvent('cfp-tasks-changed'))
        } catch (e) { /* ignore */ }
      }
      this.tasks = finalList.map(t => {
        var archived = !!(t.stageSnapshot && t.stageSnapshot.isReportArchived)
        var stepIdx = typeof t.currentStepIndex === 'number' ? t.currentStepIndex : 0
        return {
          id: t.id,
          name: t.productName || '未命名任务',
          product: t.standard || '',
          status: archived ? '已归档' : (t.status === 'completed' ? '已完成' : '运行中'),
          progress: Math.min(100, Math.round(((stepIdx + 1) / 9) * 100)),
          currentStage: '阶段' + (stepIdx + 1) + '·' + (archived ? '报告已归档' : '进行中'),
          updateTime: t.updatedAt || t.createdAt || '',
          taskId: t.id,
          isReportArchived: archived
        }
      })
    },
    // ===== 任务删除（三态规则：仅已归档不可删）=====
    deleteTask(task) {
      if (task.isReportArchived) {
        this.$message.warning('报告已归档，任务不可删除')
        return
      }
      var self = this
      this.$confirm('确定删除任务「' + task.name + '」吗？删除后不可恢复。', '删除任务', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        try {
          var raw = JSON.parse(localStorage.getItem('cfp_task_list') || '[]')
          if (Array.isArray(raw)) {
            var next = raw.filter(t => t && t.id !== task.id)
            localStorage.setItem('cfp_task_list', JSON.stringify(next))
          }
        } catch (e) { /* ignore */ }
        self.loadCfpTasks()
        self.$message.success('任务已删除')
      }).catch(function() { /* 取消 */ })
    },
    onUserSend(text) {
      this.messages.push({ role: 'user', text, time: '刚刚', type: 'text' })
      if (text.includes('新建') || text.includes('创建') || text.includes('开始核算') || text.includes('新建任务')) {
        this.messages.push({ role: 'agent', text: '正在为您创建核算任务，即将进入产品碳足迹任务详情页...', time: '刚刚', type: 'text' })
        setTimeout(() => {
          this.startCreateTask()
        }, 800)
        return
      }
      setTimeout(() => {
        this.messages.push({ role: 'agent', text: this.reply(text), time: '刚刚', type: 'text' })
      }, 500)
    },
    reply(input) {
      if (input.includes('进度') || input.includes('状态')) return '当前共有 ' + this.tasks.length + ' 个核算任务，其中 ' + this.tasks.filter(t => t.status === '运行中').length + ' 个运行中，' + this.tasks.filter(t => t.status === '已完成').length + ' 个已完成。点击右侧"任务列表"可查看详情。'
      if (input.includes('异常') || input.includes('错误')) {
        const expts = this.tasks.filter(t => t.status === '异常')
        return expts.length ? ('发现' + expts.length + '个异常任务：' + expts.map(t => t.name + '（' + t.taskId + '）').join('、') + '。点击右侧该任务进行查看和处理。') : '当前无异常任务，全部任务运行正常。'
      }
      return '我理解您的问题。输入「新建任务」可调出创建任务表单，创建后进入任务详情页开始九阶段核算流程，或点击右侧面板切换查看。'
    },
    goToProductLibrary() {
      if (this.$router) this.$router.push('/agent-center/apps/enterprise-product-library')
    },
    onTabSwitch(panel) {
      this.rightPanel = panel
      if (panel === 'tasks') {
        this.messages.push({ role: 'agent', text: '已切换至近期核算任务列表，右侧展示您的历史核算任务。点击任一任务可进入任务详情页继续九阶段流程。', time: '刚刚', type: 'text' })
      } else if (panel === 'products') {
        this.messages.push({ role: 'agent', text: '已切换至企业产品库。绿色标记的产品已有核算模型SOP，可一键继承模型核算；灰色标记的产品需从零构建模型。', time: '刚刚', type: 'text' })
      }
    },
    startCreateTask() {
      this.messages.push({ role: 'agent', text: '请填写以下信息，创建新的碳足迹核算任务：', time: '刚刚', type: 'text' })
      this.messages.push({ role: 'agent', text: '', time: '刚刚', type: 'form' })
      this.newTask = { name: '', productId: '', product: '', standard: 'ISO 14067', sopId: null }
    },
    cancelCreate() {
      const lastFormIdx = this.messages.findIndex((m, i) => i >= this.messages.length - 2 && m.type === 'form')
      if (lastFormIdx !== -1) {
        const guideIdx = lastFormIdx - 1
        this.messages.splice(guideIdx >= 0 ? guideIdx : lastFormIdx, guideIdx >= 0 ? 2 : 1)
      }
    },
    submitCreate() {
      if (!this.newTask.name || !this.newTask.productId) {
        this.$message.warning('请选择核算产品并填写任务名称')
        return
      }
      // 同步写入 cfp_task_list（与任务详情页 agentChatMixin 同源，卡片可持久化/可删除）
      var cfpTaskId = 'task-' + Date.now()
      try {
        var rawTasks = JSON.parse(localStorage.getItem('cfp_task_list') || '[]')
        if (!Array.isArray(rawTasks)) rawTasks = []
        rawTasks.unshift({
          id: cfpTaskId,
          productName: this.newTask.name,
          standard: this.newTask.standard,
          sopId: this.newTask.sopId || null,
          currentStepIndex: 0,
          createdAt: new Date().toLocaleString('zh-CN'),
          updatedAt: new Date().toLocaleString('zh-CN'),
          status: 'in-progress'
        })
        localStorage.setItem('cfp_task_list', JSON.stringify(rawTasks))
      } catch (e) { /* ignore */ }
      const task = {
        id: cfpTaskId,
        name: this.newTask.name,
        product: this.newTask.standard,
        status: '运行中',
        progress: 11,
        currentStage: '阶段1·目标定义',
        updateTime: '刚刚',
        taskId: cfpTaskId,
        isReportArchived: false
      }
      this.tasks.unshift(task)
      const lastFormIdx = this.messages.findIndex((m, i) => i >= this.messages.length - 2 && m.type === 'form')
      if (lastFormIdx !== -1) {
        const guideIdx = lastFormIdx - 1
        const removeStart = guideIdx >= 0 ? guideIdx : lastFormIdx
        this.messages.splice(removeStart, this.messages.length - removeStart)
      }
      if (this.newTask.sopId) {
        this.writeSopInheritance()
        this.messages.push({ role: 'agent', text: '已创建核算任务"' + task.name + '"，产品：' + task.product + '，标准：' + this.newTask.standard + '（已关联SOP，将自动继承模型配置）。正在进入九阶段核算流程...', time: '刚刚', type: 'text' })
        this.rightPanel = 'tasks'
        var self = this
        setTimeout(function() {
          self.enterTaskWithCreate(task)
          self.newTask = { name: '', productId: '', product: '', standard: 'ISO 14067', sopId: null }
        }, 800)
      } else {
        this.messages.push({ role: 'agent', text: '已创建核算任务"' + task.name + '"，产品：' + task.product + '，标准：' + this.newTask.standard + '。请在右侧点击进入九阶段核算流程。', time: '刚刚', type: 'text' })
        this.rightPanel = 'tasks'
        this.newTask = { name: '', productId: '', product: '', standard: 'ISO 14067', sopId: null }
        this.$message.success('任务创建成功')
      }
    },
    showCmdHint() {
      this.messages.push({ role: 'agent', text: '常用指令：<br/>• "新建任务" — 创建核算任务<br/>• "查看进度" — 查询任务状态<br/>• "异常处理" — 查看异常任务', time: '官方建议', type: 'text' })
    },
    enterTask(task) {
      var inheritFlag = ''
      var productFlag = ''
      // 支持从 query 显式恢复指定任务（如详情页返回工作台），不再触发默认创建/兜底新建
      var queryTaskId = this.$route && this.$route.query && this.$route.query.taskId
        ? decodeURIComponent(this.$route.query.taskId)
        : ''
      if (!task && queryTaskId) {
        var restoredTask = this.tasks.find(function(t) { return t.taskId === queryTaskId })
        if (restoredTask) task = restoredTask
      }
      if (this.newTask.sopId) {
        this.writeSopInheritance()
        inheritFlag = '&inheritSop=1'
      }
      if (this.newTask.product) {
        productFlag = '&productName=' + encodeURIComponent(this.newTask.product)
      } else if (task && task.product) {
        productFlag = '&productName=' + encodeURIComponent(task.product)
      }
      if (task && task.taskId) {
        productFlag += (productFlag ? '' : '&') + 'taskId=' + encodeURIComponent(task.taskId)
      }
      if (this.$router) this.$router.push('/footprint/accounting/agent?direct=true' + inheritFlag + productFlag)
    },
    enterTaskWithCreate(task) {
      var inheritFlag = ''
      var productFlag = ''
      if (this.newTask.sopId) {
        this.writeSopInheritance()
        inheritFlag = '&inheritSop=1'
      }
      if (task && task.name) productFlag += (productFlag ? '' : '&') + 'productName=' + encodeURIComponent(task.name)
      if (task && task.taskId) productFlag = '&taskId=' + encodeURIComponent(task.taskId)
      if (this.$router) this.$router.push('/footprint/accounting/agent?direct=true&create=1' + inheritFlag + productFlag)
    },
    onProductSelect(productId) {
      var product = this.enterpriseProducts.find(function(p) { return p.id === productId })
      if (product) {
        this.newTask.product = product.name
        this.newTask.standard = product.standard
        if (!this.newTask.name) {
          this.newTask.name = product.name + '碳足迹核算'
        }
        if (product.sopIds && product.sopIds.length > 0) {
          var sop = this.productSOPs.find(function(s) { return s.id === product.sopIds[0] })
          if (sop) {
            this.newTask.sopId = sop.id
          }
        } else {
          this.newTask.sopId = null
        }
      }
    },
    writeSopInheritance() {
      if (!this.newTask.sopId) return
      var sop = this.productSOPs.find(function(s) { return s.id === this.newTask.sopId }, this)
      if (!sop) return
      try {
        var savedTasks = JSON.parse(localStorage.getItem('cfp_task_list') || '[]')
        var sourceTask = savedTasks.find(function(t) { return t.id === sop.sourceTaskId })
        localStorage.setItem('cfp_inherit_sop', JSON.stringify({
          sopId: sop.id,
          sopName: sop.name,
          productId: this.newTask.productId,
          productName: this.newTask.product,
          standard: this.newTask.standard,
          modelSnapshot: (sourceTask && sourceTask.stageSnapshot) ? sourceTask.stageSnapshot : null,
          createTime: new Date().toISOString()
        }))
      } catch (e) { /* ignore */ }
    },
    quickCalcWithSOP(product) {
      // 产品卡片「开始核算」无条件创建核算任务；SOP只决定是否继承模型。
      var sopId = product.sopIds && product.sopIds.length > 0 ? product.sopIds[0] : null
      var sop = sopId ? this.productSOPs.find(function(s) { return s.id === sopId }) : null
      var taskName = product.name + '碳足迹核算'
      var cfpTaskId = 'task-' + Date.now()
      try {
        var rawTasks = JSON.parse(localStorage.getItem('cfp_task_list') || '[]')
        if (!Array.isArray(rawTasks)) rawTasks = []
        rawTasks.unshift({
          id: cfpTaskId,
          productName: taskName,
          standard: product.standard || 'ISO 14067',
          sopId: sopId,
          currentStepIndex: 0,
          createdAt: new Date().toLocaleString('zh-CN'),
          updatedAt: new Date().toLocaleString('zh-CN'),
          status: 'in-progress'
        })
        localStorage.setItem('cfp_task_list', JSON.stringify(rawTasks))
      } catch (e) { /* ignore */ }
      if (sop) {
        try {
          var savedTasks = JSON.parse(localStorage.getItem('cfp_task_list') || '[]')
          var sourceTask = savedTasks.find(function(t) { return t.id === sop.sourceTaskId })
          localStorage.setItem('cfp_inherit_sop', JSON.stringify({
            sopId: sop.id,
            sopName: sop.name,
            productId: product.id,
            productName: taskName,
            standard: product.standard || 'ISO 14067',
            modelSnapshot: (sourceTask && sourceTask.stageSnapshot) ? sourceTask.stageSnapshot : null,
            createTime: new Date().toISOString()
          }))
        } catch (e) { /* ignore */ }
        this.messages.push({ role: 'agent', text: '已匹配SOP"' + sop.name + '"，正在创建核算任务并继承模型配置...', time: '刚刚', type: 'text' })
      } else {
        this.messages.push({ role: 'agent', text: '正在创建核算任务"' + taskName + '"，即将进入九阶段核算流程...', time: '刚刚', type: 'text' })
      }
      this.loadCfpTasks()
      var task = { taskId: cfpTaskId, name: taskName, product: product.standard || 'ISO 14067' }
      var self = this
      setTimeout(function() {
        if (self.$router) self.$router.push('/footprint/accounting/agent?direct=true&create=1&productName=' + encodeURIComponent(taskName) + '&taskId=' + encodeURIComponent(cfpTaskId) + (sop ? '&inheritSop=1' : ''))
      }, 800)
    },
    startOnboarding() {
      this.onboardingStep = 0
      this.showOnboarding = true
    },
    finishOnboarding() {
      this.showOnboarding = false
      try {
        localStorage.setItem('cfp_onboarding_done', '1')
      } catch (e) { /* ignore */ }
    },
    // 新建对话：清空消息并重推与初始化一致的欢迎语
    newConversation() {
      this.messages = []
      this.pushWelcomeMessage()
      this.$message.success('已开启新对话')
      this.$nextTick(() => {
        if (this.$refs.layoutRef && this.$refs.layoutRef.$refs.chatMessagesRef) {
          this.$refs.layoutRef.$refs.chatMessagesRef.scrollTop = 0
        }
      })
    },
    // 公共欢迎语（初始化与新建对话共用，数据动态实时计算）
    pushWelcomeMessage() {
      const running = this.tasks.filter(t => t.status === '运行中').length
      const done = this.tasks.filter(t => t.status === '已完成').length
      const expt = this.tasks.filter(t => t.status === '异常').length
      const sopCount = this.enterpriseProducts.filter(p => p.sopIds && p.sopIds.length > 0).length
      const noSopCount = this.enterpriseProducts.length - sopCount
      this.messages.push({
        role: 'agent',
        text:
          '<strong>您好，我是小易！</strong>产品碳足迹智能体已就绪。<br/><br/>' +
          '基于全生命周期评价（LCA）方法论，为您提供从目标定义到报告生成的<strong>九阶段智能核算</strong>服务。<br/><br/>' +
          '<div style="margin:8px 0;padding:12px 14px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;">' +
          '<strong style="color:#0067FE;">核心能力</strong><br/>' +
          '• <strong>创建核算任务</strong> — 输入"新建任务"启动九阶段核算流程<br/>' +
          '• <strong>查询任务进度</strong> — 实时掌握运行中 / 已完成 / 异常任务状态<br/>' +
          '• <strong>企业产品库管理</strong> — 查看企业产品与已有SOP模型，一键继承核算<br/>' +
          '• <strong>异常诊断处理</strong> — 自动识别数据缺失、因子过期等问题' +
          '</div>' +
          '<div style="margin-top:8px;padding:10px 14px;background:rgba(230,126,34,0.04);border-radius:8px;border-left:3px solid #E67E22;">' +
          '<strong style="color:#E67E22;">企业产品库</strong><br/>' +
          '共 ' + this.enterpriseProducts.length + ' 个产品：<span style="color:#0067fe;font-weight:600;">' + sopCount + ' 个已建SOP可一键核算</span> · <span style="color:#E6A23C;">' + noSopCount + ' 个待构建模型</span>' +
          '<br/><span style="font-size:12px;color:#909399;">点击右侧"企业产品库"Tab查看详情，有SOP的产品支持一键继承模型核算</span>' +
          '</div>' +
          '<div style="margin-top:8px;padding:10px 14px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067fe;">' +
          '<strong style="color:#0067fe;">当前状态</strong><br/>' +
          '共 ' + this.tasks.length + ' 个核算任务：' + running + ' 个运行中 · ' + done + ' 个已完成' +
          (expt > 0 ? ' · <span style="color:#F56C6C;font-weight:600;">' + expt + ' 个异常待处理</span>' : '') +
          '</div>' +
          '<div style="margin-top:10px;color:#909399;font-size:12px;">查看左侧历史对话栏，或在右侧面板查看核算任务和企业产品。</div>',
        time: '刚刚',
        type: 'text'
      })
    }
  }
}
</script>

<style scoped>
.carbon-accounting-page {
  height: 100%;
  position: relative;

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
  border-bottom: 1px solid rgba(0,103,254,0.06);
}
.fp-side-count {
  background: rgba(0,103,254,0.08);
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
.fp-side-list::-webkit-scrollbar-thumb { background: rgba(0,103,254,0.15); border-radius: 4px; }
.fp-side-item {
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: background 0.2s;
}
.fp-side-item:hover { background: rgba(0,103,254,0.06); }
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
}
/* 内建创建表单在气泡里的额外局部样式 */
.msg-form {
  max-width: 320px;
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
  background: rgba(0,103,254,0.04);
  border: 1px solid rgba(0,103,254,0.08);
  border-radius: 10px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'Exo 2', sans-serif;
}
.token-counter i { font-size: 13px; color: #E6A23C; }
</style>
