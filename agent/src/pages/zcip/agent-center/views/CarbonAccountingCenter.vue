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
    @skip="finishOnboarding"
    @prev="onboardingStep--"
    @next="onboardingStep++"
    @finish="finishOnboarding"
  />
  </div>
</template>

<script>
import AgentAppLayout from './components/AgentAppLayout.vue'
import CarbonRightPanel from './components/CarbonRightPanel.vue'
import OnboardingGuide from '../components/OnboardingGuide.vue'

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
      newTask: { name: '', productId: '', product: '', standard: 'ISO 14067', sopId: null },
      messages: [],
      tasks: [
        { id: 7, name: '6.5MW陆上风电机组碳足迹核算', product: '6.5MW陆上风电机组 (叶轮171m)', status: '运行中', progress: 15, currentStage: '阶段2·LCI数据采集', updateTime: '2026-09-11', taskId: 'TASK-WIND-171' },
        { id: 6, name: '燃油汽车ICE-A160碳足迹核算', product: '燃油汽车 ICE-A160 (1.6L)', status: '运行中', progress: 25, currentStage: '阶段2·LCI数据采集', updateTime: '2026-07-14', taskId: 'TASK-ICE-A160' }
      ],
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
  mounted() {
    // 从 localStorage 加载产品数据
    try {
      const savedProducts = localStorage.getItem('cfp_products')
      if (savedProducts) {
        this.enterpriseProducts = JSON.parse(savedProducts)
      }
      if (!this.enterpriseProducts || this.enterpriseProducts.length === 0) {
        this.enterpriseProducts = [
          { id: 'EP-001', name: '三元锂电池组 EV700', category: '动力电池', standard: 'ISO 14067', sopIds: ['SOP-001'], calcCount: 3, lastCalcResult: '12.5 kgCO₂e/kWh', dataCompleteness: 92 },
          { id: 'EP-002', name: '永磁同步驱动电机 200kW', category: '驱动电机', standard: 'ISO 14067', sopIds: [], calcCount: 1, lastCalcResult: '8.2 kgCO₂e/kW', dataCompleteness: 45 },
          { id: 'EP-003', name: '直流快充桩 120kW', category: '充电设备', standard: 'ISO 14067', sopIds: ['SOP-002'], calcCount: 2, lastCalcResult: '185.6 kgCO₂e/台', dataCompleteness: 88 },
          { id: 'EP-004', name: '真皮电动座椅总成', category: '汽车内饰', standard: 'ISO 14067', sopIds: [], calcCount: 0, lastCalcResult: '', dataCompleteness: 30 },
          { id: 'EP-005', name: '压铸铝合金前舱盖', category: '车身件', standard: 'ISO 14067', sopIds: [], calcCount: 1, lastCalcResult: '', dataCompleteness: 60 }
        ]
        localStorage.setItem('cfp_products', JSON.stringify(this.enterpriseProducts))
      }
      const savedSOPs = localStorage.getItem('cfp_sops')
      if (savedSOPs) {
        this.productSOPs = JSON.parse(savedSOPs)
      }
      if (!this.productSOPs || this.productSOPs.length === 0) {
        this.productSOPs = [
          { id: 'SOP-001', name: '动力电池碳足迹核算模型', productId: 'EP-001', sourceTaskId: 'T-001', publishTime: '2026-06-29', version: 'v1.0', verified: true, standard: 'ISO 14067' },
          { id: 'SOP-002', name: '直流快充桩碳足迹核算模型', productId: 'EP-003', sourceTaskId: 'T-005', publishTime: '2026-06-26', version: 'v1.0', verified: true, standard: 'ISO 14067' }
        ]
        localStorage.setItem('cfp_sops', JSON.stringify(this.productSOPs))
      }
    } catch (e) { /* ignore */ }

    // 首次访问自动弹出新手引导
    try {
      if (!localStorage.getItem('cfp_onboarding_done')) {
        this.showOnboarding = true
      }
    } catch (e) { /* ignore */ }

    this.pushWelcomeMessage()
  },
  methods: {
    onUserSend(text) {
      this.messages.push({ role: 'user', text, time: '刚刚', type: 'text' })
      if (text.includes('新建') || text.includes('创建') || text.includes('开始核算') || text.includes('新建任务')) {
        this.messages.push({ role: 'agent', text: '正在为您启动九阶段核算流程，即将进入产品碳足迹智能体工作区...', time: '刚刚', type: 'text' })
        setTimeout(() => {
          this.enterTask()
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
      return '我理解您的问题。输入"新建任务"可直接进入九阶段核算流程，或点击右侧面板切换查看。'
    },
    goToProductLibrary() {
      if (this.$router) this.$router.push('/agent-center/apps/enterprise-product-library')
    },
    onTabSwitch(panel) {
      this.rightPanel = panel
      if (panel === 'conversations') {
        this.messages.push({ role: 'agent', text: '已切换至历史对话列表，右侧展示您的对话记录。点击任一对话可查看详情。', time: '刚刚', type: 'text' })
      } else if (panel === 'tasks') {
        this.messages.push({ role: 'agent', text: '已切换至近期核算任务列表，右侧展示您的历史核算任务。点击任一任务可进入九阶段流程。', time: '刚刚', type: 'text' })
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
      const task = {
        id: this.tasks.length + 1,
        name: this.newTask.name,
        product: this.newTask.product,
        status: '运行中',
        progress: 5,
        currentStage: '阶段1·目标定义',
        updateTime: '刚刚',
        taskId: 'T-' + String(this.tasks.length + 1).padStart(3, '0')
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
          self.enterTask()
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
      if (this.newTask.sopId) {
        this.writeSopInheritance()
        inheritFlag = '&inheritSop=1'
      }
      if (this.newTask.product) {
        productFlag = '&productName=' + encodeURIComponent(this.newTask.product)
      } else if (task && task.product) {
        productFlag = '&productName=' + encodeURIComponent(task.product)
      }
      if (this.$router) this.$router.push('/footprint/accounting/agent?direct=true' + inheritFlag + productFlag)
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
      var sopId = product.sopIds && product.sopIds.length > 0 ? product.sopIds[0] : null
      var sop = sopId ? this.productSOPs.find(function(s) { return s.id === sopId }) : null
      if (!sop) {
        this.$message.warning('该产品暂无可用SOP')
        return
      }
      try {
        var savedTasks = JSON.parse(localStorage.getItem('cfp_task_list') || '[]')
        var sourceTask = savedTasks.find(function(t) { return t.id === sop.sourceTaskId })
        localStorage.setItem('cfp_inherit_sop', JSON.stringify({
          sopId: sop.id,
          sopName: sop.name,
          productId: product.id,
          productName: product.name,
          standard: product.standard,
          modelSnapshot: (sourceTask && sourceTask.stageSnapshot) ? sourceTask.stageSnapshot : null,
          createTime: new Date().toISOString()
        }))
      } catch (e) { /* ignore */ }
      this.messages.push({ role: 'agent', text: '已匹配SOP"' + sop.name + '"，正在继承模型配置并进入九阶段核算...', time: '刚刚', type: 'text' })
      var self = this
      setTimeout(function() {
        if (self.$router) self.$router.push('/footprint/accounting/agent?direct=true&inheritSop=1')
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
          '<div style="margin-top:10px;color:#909399;font-size:12px;">直接在下方输入问题，或点击右侧面板查看历史对话、核算任务和企业产品。</div>',
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
