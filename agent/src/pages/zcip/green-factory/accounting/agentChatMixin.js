/**
 * 绿色工厂自评价智能体 - 对话 Mixin
 *
 * 负责：消息处理、指令响应、多轮对话、自动回复
 */

export default {
  data() {
    return {
      messages: [],        // task-active 模式消息
      tlMessages: [],      // task-list 模式消息（独立，避免两模式串扰）
      tlDialogStep: 'welcome' // 'welcome' | 'show-history'
    }
  },

  methods: {
    // 判断是否为最新一条 assistant 消息（实时快捷按钮只渲染在该消息上）
    isLastAssistantMsg(msg) {
      const last = [...this.messages].reverse().find(m => m.role === 'assistant')
      return !!last && last.id === msg.id
    },
    // ===== 任务列表模式对话 =====
    handleTlSendKey(e) {
      if (e.shiftKey) return
      e.preventDefault()
      this.handleTlSend()
    },

    handleTlSend() {
      const text = this.tlInputText.trim()
      if (!text) return

      this.tlMessages.push({ role: 'user', text: text, time: '刚刚' })
      this.tlInputText = ''
      this.$nextTick(this.scrollTlToBottom)

      const self = this
      this.isTyping = true
      setTimeout(function() {
        self.isTyping = false
        const reply = self.processInput(text)
        self.tlMessages.push({ role: 'agent', text: reply, time: '刚刚' })
        self.$nextTick(self.scrollTlToBottom)
      }, 600)
    },

    autoResizeTlTextarea() {
      const ta = this.$refs.tlInputTextareaRef
      if (ta) {
        ta.style.height = 'auto'
        ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
      }
    },

    scrollTlToBottom() {
      const c = this.$refs.tlDialogMessages
      if (c) c.scrollTop = c.scrollHeight
    },

    // ===== 任务对话模式 =====
    handleSendKey(e) {
      if (e.shiftKey) return
      e.preventDefault()
      this.handleSend()
    },

    handleSend() {
      const text = this.inputText.trim()
      if (!text || this.isTyping) return

      this.messages.push({ id: Date.now(), role: 'user', content: text, timestamp: '刚刚' })
      this.inputText = ''
      this.$nextTick(this.scrollToBottom)

      const self = this
      this.isTyping = true
      setTimeout(function() {
        self.isTyping = false
        const reply = self.processActiveInput(text)
        if (reply) {
          self.messages.push({ id: Date.now() + 1, role: 'assistant', content: reply, timestamp: '刚刚', suggestions: self.getReplySuggestions() })
        }
        self.$nextTick(self.scrollToBottom)
        // 同步对话记录到当前任务
        self.updateTaskProgress()
      }, 800)
    },

    // 点击建议按钮直接发送
    sendSuggestion(text) {
      if (this.isTyping) return
      this.inputText = text
      this.handleSend()
    },

    // 根据当前阶段生成建议按钮（阶段1返回待传证明材料；阶段2返回材料上传建议；阶段3返回页签操作+推进建议；其余阶段为流程推进类）
    getReplySuggestions() {
      const i = this.currentStepIndex
      const last = this.phases.length - 1
      if (i === 0) {
        const q = this.phaseDetails[0].qualification
        const checks = [...q.autoChecks, ...q.manualChecks]
        const pendIds = [...new Set(checks.filter(c => c.proofStatus === 'pending').map(c => c.proofId))]
        // 上传按钮合并为一个（避免按钮过多），点击后返回待传清单
        return pendIds.length ? ['下载材料清单', '上传自评材料'] : ['下载材料清单']
      }
      if (i === 1) {
        // 阶段2 数据收集与校验（新结构：指标→参数→确认）
        const pc = this.collectPendingCount || { missing: 0, pending: 0, total: 0 }
        if (pc.total) {
          return ['下一项待处理', '确认当前参数', '数据清单说明']
        }
        return ['数据清单说明', '下一步：指标核算与评价']
      }
      if (i === 2) {
        // 阶段3 指标核算与评价
        return ['查看核算明细', '下一步：数据溯源与材料归档']
      }
      if (i < last) {
        return ['下一步：' + this.phases[i + 1].name]
      }
      return ['重新自评']
    },

    autoResizeTextarea() {
      const ta = this.$refs.inputTextareaRef
      if (ta) {
        ta.style.height = 'auto'
        ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
      }
    },

    scrollToBottom() {
      const c = this.$refs.chatMessagesRef
      if (c) c.scrollTop = c.scrollHeight
    },

    // ===== 指令处理 =====
    processInput(input) {
      const isStartIntent = input.includes('新建') || input.includes('开始') || input.includes('申报') || input.includes('自评') ||
        (this.currentFactoryName && input.includes(this.currentFactoryName))
      if (isStartIntent) {
        return this.startNewTask(input)
      }
      if (input.includes('历史') || input.includes('记录')) {
        this.tlDialogStep = 'show-history'
        return '以下是您的历史自评项目，点击即可继续推进：'
      }
      if (input.includes('指标') || input.includes('分类')) {
        return this.getIndicatorTypeInfo()
      }
      if (input.includes('库') || input.includes('基础库')) {
        return this.getLibraryInfo()
      }
      if (input.includes('溯源') || input.includes('来源')) {
        return this.getTraceabilityInfo()
      }
      return '我理解您的问题。您可以输入"开始自评"启动绿色工厂辅助自评流程，输入"历史记录"查看历史项目，输入"指标分类"了解指标分类体系。'
    },

    processActiveInput(input) {
      // 阶段4：确认/调整建设目标（与底部确认按钮、①标题区「调整目标」同链路，引导语随确认状态切换；silent 防止双重推送）
      if (this.currentStepIndex === 3 && (input.includes('确认建设目标') || input.includes('调整建设目标'))) {
        if (input.includes('调整')) {
          this.phaseOps.goalConfirmed = false
          return this.buildOptGuideHtml()
        }
        this.toggleGoalConfirm(true)
        return this.buildGoalConfirmedGuideHtml()
      }
      // 阶段1：下载材料清单（资格证明材料备料清单，已匹配/待上传分状态）
      if (this.currentStepIndex === 0 && (input.includes('材料清单') || (input.includes('下载') && input.includes('材料')))) {
        const q = this.phaseDetails[0].qualification
        const checks = [...q.autoChecks, ...q.manualChecks]
        const total = [...new Set(checks.map(c => c.proofId).filter(id => id && q.proofPool[id]))]
        const done = [...new Set(checks.filter(c => c.proofStatus === 'matched' && c.proofId && q.proofPool[c.proofId]).map(c => c.proofId))]
        this.downloadMaterialChecklist()
        return '<strong>材料清单已生成并开始下载</strong><br/><br/>共 ' + total.length + ' 份资格证明材料：已匹配 <strong style="color:#52c41a;">' + done.length + '</strong> 份、待上传 <strong style="color:#E6A23C;">' + (total.length - done.length) + '</strong> 份。备齐后点击「上传自评材料」或输入「上传 + 材料名」，识别后自动关联右侧对应资格条件。'
      }
      // 材料上传识别（阶段1：上传 + 待关联资格证明材料名；通用入口「上传自评材料」返回待传清单）
      if (input.includes('上传') && this.currentStepIndex === 0) {
        const q = this.phaseDetails[0].qualification
        const checks = [...q.autoChecks, ...q.manualChecks]
        const pendIds = [...new Set(checks.filter(c => c.proofStatus === 'pending').map(c => c.proofId))]
        const pid = pendIds.find(id => q.proofPool[id] && input.includes(q.proofPool[id].name))
        if (pid) {
          this.uploadQualificationProof(pid)
          return null // 识别结果消息由 uploadQualificationProof 推送
        }
        if (!pendIds.length) {
          return '阶段1的资格证明材料已全部关联，无需再上传。核对右侧基本信息与资格条件后，点击底部「确认并进入数据收集与校验」推进。'
        }
        const rows = pendIds.map(id => '• ' + q.proofPool[id].name).join('<br/>')
        return '<strong>待上传证明材料清单</strong><br/><br/>以下资格条件尚缺证明材料，点击「上传自评材料」或输入「上传 + 材料名」即可上传识别：<br/>' + rows
      }
      // 材料上传识别（阶段2：上传 + 材料指令短名）
      // 阶段2：下一项待处理
      if (this.currentStepIndex === 1 && input.includes('下一项')) {
        this.locateNextPending()
        return null // 引导由 locateNextPending 推送
      }
      // 阶段2：确认当前参数
      if (this.currentStepIndex === 1 && input.includes('确认当前参数')) {
        if (!this.currentCollectParam) {
          return '请先在右侧单击某个参数行（或点「下一项待处理」），再执行确认。'
        }
        return '请在右侧点击该参数的状态标签（待确认 → 已确认）完成确认；也可点「下一项待处理」继续。'
      }
      // 阶段2：数据清单说明
      if (this.currentStepIndex === 1 && (input.includes('数据清单') || input.includes('清单说明'))) {
        const pc = this.collectPendingCount || { missing: 0, pending: 0, total: 0 }
        return '<strong>数据收集清单说明</strong><br/><br/>' +
          '<div style="padding:10px 12px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;margin:8px 0;line-height:1.9;">' +
          '按 <b>评价指标 → 计算参数 → 参数详情</b> 组织，共 14 项指标、5 个一级分类（能源低碳化 4 / 资源高效化 4 / 生产洁净化 3 / 产品绿色化 2 / 用地集约化 1）。<br/>' +
          '每项参数包含：数值、数据源（底座/材料）、状态（待补充/待确认/已确认）。<br/>' +
          '<b>单位产品类指标</b>（1.1 / 3.1 / 4.4）按产品分组：独立计量产品各自成组，分摊产品共用计量项后按产量比例分摊。' +
          '</div>' +
          '当前待处理：<b style="color:#E6A23C;">待补充 ' + pc.missing + ' · 待确认 ' + pc.pending + '</b><br/>' +
          '→ 点顶部「下一项待处理」逐项推进，或直接单击右侧参数行查看详情'
      }
      if (input.includes('上传') && this.currentStepIndex === 1) {
        const mhs = this.phaseDetails[1].materialHints
        const idx = mhs.findIndex(m => m.cmd && input.includes(m.cmd))
        if (idx > -1) {
          if (mhs[idx].status === 'done') {
            return '《' + mhs[idx].name + '》已完成识别，无需重复上传。可上传其他材料，或输入"下一步"推进阶段。'
          }
          this.uploadMaterialForModel(idx)
          return null // 识别结果消息由 uploadMaterialForModel 推送
        }
      }
      if (input.includes('下一步') || input.includes('继续') || input.includes('数据确认')) {
        // 阶段4：目标未确认 → 引导先确认；已确认（措施默认全采纳，可取消）→ 放行推进
        if (this.currentStepIndex === 3 && !this.phaseOps.goalConfirmed) {
          return '请先完成建设目标设定：在右侧调整建设期与各指标期末目标值（核心 3 项不得低于官方要求），点击底部「确认建设目标」或直接输入「确认建设目标」。'
        }
        if (this.currentStepIndex < this.phases.length - 1) {
          this.nextPhase()
          return null // 阶段进入引导消息由 nextPhase 统一推送
        }
        return '已是最后阶段。'
      }
      if (input.includes('进度') || input.includes('状态')) {
        const phase = this.phases[this.currentStepIndex]
        return '当前处于<strong>阶段 ' + (this.currentStepIndex + 1) + '：' + phase.name + '</strong>，进度 ' + this.progressPercent + '%。'
      }
      if (input.includes('指标') || input.includes('分类')) {
        return this.getIndicatorTypeInfo()
      }
      if (input.includes('库') || input.includes('基础库')) {
        return this.getLibraryInfo()
      }
      // 阶段3双页签切换指令
      if (this.currentStepIndex === 1 && (input.includes('待处理') || input.includes('待补充'))) {
        this.phaseOps.dataTab = 'validation'
        return '<strong>已切换至「待补充 / 待确认」页签</strong><br/><br/>右侧展示待处理清单：明细可下载、支持上传佐证材料、逐项填报数值 / 确认口径，每项可关联佐证材料库已有材料或上传新材料。'
      }
      if (this.currentStepIndex === 1 && (input.includes('活动数据') || input.includes('采集清单'))) {
        this.phaseOps.dataTab = 'activity'
        return '<strong>已切换至「活动数据与因子」页签</strong><br/><br/>按指标分组（指标 → 数据项）展示：每个输入项的活动数据与匹配因子成对呈现、数值可直接修正，每行数据 / 因子可独立关联或上传证明材料；填报指标直接填报结果值。'
      }
      if (input.includes('诊断') || input.includes('资格')) {
        return '<strong>企业信息与资格校验</strong><br/><br/>阶段一第②步：官方基本信息表由组织资源库自动带出（单位名称/地址/行业/主要产品/单位性质/信用代码等），用户确认补填；前置资质类资格条件（绿色工厂/能碳管理中心/能耗规模等）系统自动核验；负面清单承诺（近三年无安全环保事故、非失信被执行人等8项）由企业逐项填报，智能体自动校验并输出资格结论。'
      }
      if (input.includes('差距') || input.includes('改善') || input.includes('优化') || input.includes('建设目标')) {
        return '<strong>数据溯源与材料归档</strong><br/><br/>指标核算与评价已完成，系统已生成评价报告初稿（评价报告 + 证明材料目录）。<br/>'
      }
      if (input.includes('材料') || input.includes('下载')) {
        return '<strong>数据溯源与材料归档</strong><br/><br/>从平台模板库加载绿色工厂评价报告模板，按六章结构填充内容（素材来自阶段1-5：概况→建设基础→目标分析→建设路径→预期成效→证明材料目录）。数据与指标类全自动填充，叙述类由大模型生成草稿待企业确认补充，规划决策类（重点项目/建设目标）由企业主导编写；每项数据标注来源/统计口径/计算过程/判定依据及证明材料名称与页码，定稿归档至报告与档案中心（哈希防篡改），支持下载材料包。'
      }
      // 阶段4：重新自评
      if (input.includes('重新自评') || input.includes('重新开始') || input.includes('重新核算')) {
        this.resetSession()
        return '<strong>已重新自评</strong><br/><br/>任务已重置，对话与进度恢复至阶段1，可重新开始绿色工厂自评流程。'
      }
      return '我理解您的问题。输入"下一步"推进流程，输入"查看进度"查看当前状态，输入"指标分类"了解指标体系。'
    },

    // ===== 信息卡片 =====
    startNewTask(input) {
      // 绿色工厂：直接创建任务并进入详情（不弹窗确认）
      // 默认：评价依据 = 最新政策版本；主体类型 = 制造型企业；评价年度 = 政策要求年
      const plan = this.planVersions[0]
      const name = this.autoFactoryName
      const baseYear = String(plan.baselineYear)
      const sameYear = this.taskList.find(t => t.factoryName === name && String(t.baselineYear) === baseYear)
      if (sameYear) {
        this.$nextTick(() => { this.continueTask(sameYear) })
        return '<strong>已进入现有自评任务</strong><br/>' +
          '<div style="padding:12px 14px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;margin:8px 0;">' +
          '「<b>' + name + '</b>」评价年度 ' + baseYear + ' 年 · 制造型企业<br/>' +
          '正在加载任务详情，可继续推进流程。' +
          '</div>'
      }
      const task = this.createTask(name, 'GF', 'manufacturing', plan)
      task.baselineYear = baseYear
      this.$nextTick(() => { this.continueTask(task) })
      return '<strong>已创建自评任务</strong><br/>' +
        '<div style="padding:12px 14px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;margin:8px 0;">' +
        '「<b>' + name + '</b>」· 制造型企业 · 评价年度 ' + baseYear + ' 年<br/>' +
        '评价依据：' + plan.label + '<br/>' +
        '正在进入任务详情...' +
        '</div>'
    },

    getIndicatorTypeInfo() {
      return '<strong>指标分类体系</strong><br/><br/>' +
        '<div style="padding:12px 14px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;">' +
        '<strong style="color:#0067FE;">两类指标（按结果产生方式划分）</strong><br/><br/>' +
        '<strong>1. 计算指标</strong> — 有计算公式 → 系统按公式计算<br/>' +
        '输入参数可自动采集与人工填报混合（参数级属性，同一指标两者可并存）<br/>' +
        '示例：能源消耗强度、碳排放强度、可再生能源利用率<br/><br/>' +
        '<strong>2. 填报指标</strong> — 无计算公式、需逐项核查 → 用户填报结果值<br/>' +
        '示例：生产工艺和设备先进性、绿色设计、产品碳足迹<br/>' +
        '</div>' +
        '<div style="margin-top:6px;color:#909399;font-size:12px;">两类判定由智能体在阶段二依据指标体系（附件1）性质自动完成，用户可调整；两类均需数据来源跟踪，形成完整溯源链。</div>'
    },

    getLibraryInfo() {
      return '<strong>9 个基础库</strong><br/><br/>' +
        '<div style="padding:12px 14px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;">' +
        '1. 政策标准库 — 标准/条款/指标体系/核心指标两级要求<br/>' +
        '2. 组织资源库 — 企业基本信息+排放源/用能设备<br/>' +
        '3. 组织模板库 — 保存已确认核算模型<br/>' +
        '4. 统一数据底座 — 自动采集活动数据<br/>' +
        '5. 排放因子库 — 因子匹配<br/>' +
        '6. 核算公式库 — 参数管理+公式管理<br/>' +
        '7. 平台模板库 — 绿色工厂评价报告模板<br/>' +
        '8. 佐证材料库 — 原始支撑材料<br/>' +
        '9. 评价报告 — 定稿归档（评价报告+证明材料目录）' +
        '</div>'
    },

    getTraceabilityInfo() {
      return '<strong>统一溯源链</strong><br/><br/>' +
        '<div style="padding:12px 14px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;">' +
        '<strong>计算指标</strong>：指标结果 → 公式 → 输入参数 → 数据来源 → 原始凭证<br/>' +
        '自动采集参数记底座记录（采集时间/接口/记录编号），人工填报参数记用户标注凭证<br/><br/>' +
        '<strong>填报指标</strong>：指标结果 → 用户填报值 → 来源说明 → 上传材料' +
        '</div>'
    },

    showCmdHint() {
      const isList = this.pageMode === 'task-list'
      const hint = isList
        ? '常用指令：<br/>• "开始自评" — 启动绿色工厂自评流程<br/>• "历史记录" — 查看历史项目<br/>• "指标分类" — 了解指标体系<br/>• "基础库" — 查看9个基础库<br/>• "溯源链" — 了解数据来源跟踪'
        : '常用指令：<br/>• "下一步" — 推进流程<br/>• "上传XX" — 上传材料自动建模（阶段2：能源台账/购电合同/工艺说明等）<br/>• "查看进度" — 查询当前阶段<br/>• "指标分类" — 了解指标体系<br/>• "基础库" — 查看9个基础库<br/>• "资格诊断" — 企业基本信息与资格校验<br/>• "建设目标" — 建设目标设定与优化建议<br/>• "材料下载" — 自评材料编制与下载'

      if (isList) {
        this.tlMessages.push({ role: 'agent', text: hint, time: '官方建议' })
      } else {
        this.messages.push({ id: Date.now(), role: 'assistant', content: hint, timestamp: '官方建议' })
      }
      this.$nextTick(isList ? this.scrollTlToBottom : this.scrollToBottom)
    },

    useCmd(cmd) {
      this.inputText = cmd
      this.handleSend()
    },

    useTlCmd(cmd) {
      this.tlInputText = cmd
      this.handleTlSend()
    },

    copyMessageContent(content) {
      const temp = document.createElement('textarea')
      temp.value = content.replace(/<[^>]+>/g, '')
      document.body.appendChild(temp)
      temp.select()
      document.execCommand('copy')
      document.body.removeChild(temp)
      this.$message.success('已复制')
    }
  }
}
