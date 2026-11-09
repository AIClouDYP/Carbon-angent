import * as echarts from 'echarts'

export default {
  methods: {
    // ===== 消息操作 =====
    copyMessageContent(content) {
      // 移除 markdown 标记，保留纯文本
      const plainText = content
        .replace(/\*\*(.+?)\*\*/g, '$1')  // 粗体
        .replace(/\*(.+?)\*/g, '$1')      // 斜体
        .replace(/\[(.+?)\]\(.+?\)/g, '$1') // 链接
        .replace(/`(.+?)`/g, '$1')        // 代码
        .replace(/\n/g, '\n')             // 保留换行

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(plainText).then(() => {
          this.$message.success('已复制到剪贴板')
        }).catch(() => {
          this.fallbackCopy(plainText)
        })
      } else {
        this.fallbackCopy(plainText)
      }
    },
    fallbackCopy(text) {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        this.$message.success('已复制到剪贴板')
      } catch (e) {
        this.$message.error('复制失败，请手动选择文本复制')
      }
      document.body.removeChild(textarea)
    },
    regenerateMessage(msgId) {
      const msgIndex = this.messages.findIndex(m => m.id === msgId)
      if (msgIndex === -1) return

      const msg = this.messages[msgIndex]
      if (msg.role !== 'assistant') return

      // 找到该 assistant 消息之前的最后一条 user 消息
      let lastUserMsg = null
      for (let i = msgIndex - 1; i >= 0; i--) {
        if (this.messages[i].role === 'user') {
          lastUserMsg = this.messages[i]
          break
        }
      }

      if (!lastUserMsg) {
        this.$message.warning('未找到对应的用户提问，无法重新生成')
        return
      }

      // 删除当前 assistant 消息及其后续所有消息，重新发送用户消息
      this.messages = this.messages.slice(0, msgIndex)
      this.$message.success('正在重新生成回复…')

      // 模拟重新发送
      setTimeout(() => {
        this.sendUserMessage(lastUserMsg.content)
      }, 300)
    },
    buildPhase7Content() {
      const stages = this.emissionTreeData
      const fmt = (v) => this.formatEmission(v)
      const raw = stages[0] ? fmt(stages[0].emission) : '—'
      const manu = stages[1] ? fmt(stages[1].emission) : '—'
      const trans = stages[2] ? fmt(stages[2].emission) : '—'
      const use = stages[3] ? fmt(stages[3].emission) : '—'
      const recycle = stages[4] ? fmt(stages[4].emission) : '—'
      const total = fmt(this.totalCarbonEmission)
      const subject = this.isWindTask() ? '6.5MW陆上风电机组' : '燃油汽车ICE-A160'
      const degreeLine = this.isWindTask() ? `\n* ━━━\n* **折算度电碳足迹：≈${this.degreeEmission} gCO₂e/kWh**\n* 全生命周期发电量 5.46亿 kWh（6.5MW × 4200h × 20年）\n* **行业参考**：陆上风机度电碳足迹集中于 5~15 gCO₂e/kWh，本机型参考目标值 5.56 gCO₂e/kWh（火电约 832 gCO₂e/kWh）` : ''
      return `**【阶段七：碳足迹计算 - 完成】**\n系统执行${subject}全生命周期各阶段碳足迹计算，结果如下：\n* **原材料获取阶段**：${raw} kgCO₂e\n* **生产制造阶段**：${manu} kgCO₂e\n* **运输分销阶段**：${trans} kgCO₂e\n* **产品使用阶段**：${use} kgCO₂e\n* **报废回收阶段**：${recycle} kgCO₂e\n* ━━━\n* **碳足迹总计：${total} kgCO₂e**${degreeLine}\n\n您可以在下方选择进入碳足迹分析与报告：`
    },
    selectStandard(code) {
      // 选中校验：仅允许选择当前列表中已通过初筛的标准（剔除失效/重复/不可计算项）
      if (!this.standards.some(s => s.code === code)) return
      this.selectedStandard = code
      this.standardPickerOpen = false
      // 记录用户选择
      this.recordUserChoice('defaultStandard', code)
      if (this.currentStepIndex === 0 && this.messages.length > 0) {
        this.messages[0] = {
          id: 'MSG-001',
          role: 'assistant',
          content: `您好！我是小易，产品碳足迹核算智能体。\n\n我将引导您对产品进行全生命周期（LCA）九阶段的碳足迹智能核算。\n当前系统处于 **【阶段一：政策标准】**。\n\n当前已选中标准：**${code}**（《${this.getStandardName(code)}》）\n\n请确认使用该标准进入核算，或在右侧切换其他标准：`,
          timestamp: new Date().toLocaleTimeString('zh-CN'),
          suggestions: ['确认使用当前标准']
        }
      }
    },
    getStandardName(code) {
      const found = this.standards.find(s => s.code === code)
      return found ? found.name : ''
    },
    toggleFactorLib(lib) {
      if (lib.disabled) return
      lib.selected = !lib.selected
    },
    selectAllFactorLibs(flag) {
      this.factorDatabases.forEach(l => { if (!l.disabled) l.selected = flag })
    },
    confirmFactorLibs() {
      this.showFactorLibDialog = false
      const enabledLibs = this.factorDatabases.filter(l => l.selected)
      const disabledLibs = this.factorDatabases.filter(l => !l.selected)
      // 记录用户偏好的因子库组合
      this.recordUserChoice('preferredFactorLibs', enabledLibs.map(l => l.id))
      let libSummary = `已启用 ${enabledLibs.length} 个因子库：${enabledLibs.map(l => l.shortName).join('、')}`
      if (disabledLibs.length > 0) {
        libSummary += `\n已禁用 ${disabledLibs.length} 个因子库：${disabledLibs.map(l => l.shortName).join('、')}`
      }
      // 合并为一条消息：因子库确认 + 阶段二开始
      this.isTyping = true
      setTimeout(() => {
        this.isTyping = false
        this.messages.push({
          id: `MSG-${Date.now()}`,
          role: 'assistant',
          content: `**【排放因子库选择 - 已确认】**\n${libSummary}\n\n---\n\n**【阶段二：核算边界】**\n共5个配置步骤，请逐步确认。\n\n**步骤 1/5：确认核算生命周期阶段范围**\n请选择核算边界模式：\n* **摇篮到坟墓**：原材料获取阶段 + 生产制造阶段 + 运输分销阶段 + 产品使用阶段 + 报废回收阶段\n* **摇篮到大门**：原材料获取阶段 + 生产制造阶段\n* **大门到大门**：仅生产制造阶段`,
          timestamp: new Date().toLocaleTimeString('zh-CN'),
          suggestions: ['摇篮到坟墓', '摇篮到大门', '大门到大门']
        })
        this.currentStepIndex = 1
        this.scrollToBottom()
        this.saveStageSnapshot()
      }, 1000)
    },
    initChatFlow() {
      // 任务加载后校正标准（避免沿用其他场景的标准 code）
      this.ensureStandardValid && this.ensureStandardValid()
      // 构建个性化欢迎消息（风机任务定制：五环节 LCA、度电碳足迹目标）
      if (this.isWindTask()) {
        const windWelcome = `您好！我是小易，产品碳足迹核算智能体。\n\n当前核算对象为 **6.5MW陆上风电机组**（叶轮直径171m / 塔架高度110m / 设计寿命20年）。\n\n当前处于 **【阶段一：政策标准】**：请在右侧「政策标准库」确认核算标准，系统将解析该标准的适用范围、生命周期阶段、边界量化规则与数据质量要求，作为后续核算的依据。\n\n当前已选中标准：**${this.selectedStandard}**`
        this.messages = [
          { id: 'MSG-001', role: 'assistant', content: windWelcome, timestamp: new Date().toLocaleTimeString('zh-CN'), suggestions: ['确认使用当前标准'] }
        ]
        return
      }
      // 构建通用个性化欢迎消息
      let welcomeContent = `您好！我是小易，产品碳足迹核算智能体。\n\n我将引导您对产品进行全生命周期（LCA）九阶段的碳足迹智能核算。\n当前系统处于 **【阶段一：政策标准】**。\n\n当前已选中标准：**${this.selectedStandard}**`

      // 添加用户偏好提示
      const prefHint = this.getPreferenceHint()
      if (prefHint) {
        welcomeContent += `\n\n💡 **根据您的历史偏好**：${prefHint}`
      }

      welcomeContent += `\n\n请确认使用该标准进入核算，或在右侧切换其他标准：`

      this.messages = [
        {
          id: 'MSG-001',
          role: 'assistant',
          content: welcomeContent,
          timestamp: new Date().toLocaleTimeString('zh-CN'),
          suggestions: ['确认使用当前标准']
        }
      ]
    },
    // ===== 任务管理方法 =====
    persistTaskList() {
      try { localStorage.setItem('cfp_task_list', JSON.stringify(this.taskList)) } catch (e) { /* ignore */ }
    },
    saveStageSnapshot() {
      if (!this.currentTaskId) return
      const task = this.taskList.find(t => t.id === this.currentTaskId)
      if (!task) return
      // 打包所有阶段状态数据到快照
      task.currentStepIndex = this.currentStepIndex
      task.updatedAt = new Date().toLocaleString('zh-CN')
      task.status = this.currentStepIndex >= 8 ? 'completed' : 'in-progress'
      task.stageSnapshot = {
        currentStepIndex: this.currentStepIndex,
        selectedStandard: this.selectedStandard,
        selectedUnit: this.selectedUnit,
        boundarySubStep: this.boundarySubStep,
        boundaryConfig: JSON.parse(JSON.stringify(this.boundaryConfig || {})),
        isModelBuilt: this.isModelBuilt,
        validationStep: this.validationStep,
        validationActiveTab: this.validationActiveTab,
        validationItems: JSON.parse(JSON.stringify(this.validationItems || [])),
        analysisActiveTab: this.analysisActiveTab,
        analysisSubStep: this.analysisSubStep,
        sensitivityRatio: this.sensitivityRatio,
        uncertaintyParams: JSON.parse(JSON.stringify(this.uncertaintyParams || {})),
        isReportArchived: this.isReportArchived,
        isSopPublished: this.isSopPublished,
        modelStages: JSON.parse(JSON.stringify(this.modelStages || [])),
        emissionValueMap: JSON.parse(JSON.stringify(this.emissionValueMap || {})),
        standards: JSON.parse(JSON.stringify(this.standards || [])),
        messages: JSON.parse(JSON.stringify(this.messages || []))
      }
      this.persistTaskList()
    },
    restoreStageSnapshot(snapshot) {
      if (!snapshot) return
      // 从快照恢复所有阶段状态数据
      this.currentStepIndex = snapshot.currentStepIndex || 0
      this.selectedStandard = snapshot.selectedStandard || this.defaultStandardCode()
      this.selectedUnit = snapshot.selectedUnit || 'declaration'
      this.boundarySubStep = snapshot.boundarySubStep || 0
      this.boundaryConfig = snapshot.boundaryConfig ? JSON.parse(JSON.stringify(snapshot.boundaryConfig)) : this.boundaryConfig
      this.isModelBuilt = snapshot.isModelBuilt || false
      this.validationStep = snapshot.validationStep || 0
      this.validationActiveTab = snapshot.validationActiveTab || 'validation'
      this.validationItems = snapshot.validationItems ? JSON.parse(JSON.stringify(snapshot.validationItems)) : this.validationItems
      this.analysisActiveTab = snapshot.analysisActiveTab || 'routine'
      this.analysisSubStep = snapshot.analysisSubStep || 0
      this.sensitivityRatio = snapshot.sensitivityRatio || 10
      this.uncertaintyParams = snapshot.uncertaintyParams ? JSON.parse(JSON.stringify(snapshot.uncertaintyParams)) : this.uncertaintyParams
      this.isReportArchived = snapshot.isReportArchived || false
      this.isSopPublished = snapshot.isSopPublished || false
      this.modelStages = snapshot.modelStages ? JSON.parse(JSON.stringify(snapshot.modelStages)) : this.modelStages
      this.emissionValueMap = snapshot.emissionValueMap ? JSON.parse(JSON.stringify(snapshot.emissionValueMap)) : this.emissionValueMap
      this.standards = snapshot.standards ? JSON.parse(JSON.stringify(snapshot.standards)) : this.standards
      this.messages = snapshot.messages ? JSON.parse(JSON.stringify(snapshot.messages)) : this.messages
    },
    handleTlSend(e) {
      if (e && e.shiftKey) return // Shift+Enter换行不发送
      if (!this.tlInputText.trim()) return
      const text = this.tlInputText.trim()
      this.tlInputText = ''
      // 用户输入任何内容都视为新建核算任务并进入九阶段
      this.startNewTask(text)
    },
    handleTlSendKey(e) {
      if (e.shiftKey) return
      e.preventDefault()
      this.handleTlSend()
    },
    autoResizeTlTextarea() {
      const el = this.$refs.tlInputTextareaRef
      if (el) {
        el.style.height = 'auto'
        el.style.height = Math.min(el.scrollHeight, 120) + 'px'
      }
    },
    // 从第二层直接跳转进入九阶段（跳过初始化对话）
    startDirectNineStage() {
      // 检查是否有SOP继承数据
      let inheritData = null
      if (this.$route.query.inheritSop === '1') {
        try {
          const raw = localStorage.getItem('cfp_inherit_sop')
          if (raw) {
            inheritData = JSON.parse(raw)
            localStorage.removeItem('cfp_inherit_sop')
          }
        } catch (e) { /* ignore */ }
      }
      const id = 'task-' + Date.now()
      // 产品名优先级：SOP继承 > query参数 > 默认值
      var queryProductName = this.$route.query.productName ? decodeURIComponent(this.$route.query.productName) : ''
      const task = {
        id: id,
        productName: inheritData ? inheritData.productName : (queryProductName || '产品碳足迹核算'),
        standard: inheritData ? inheritData.standard : 'ISO 14067',
        sopId: inheritData ? inheritData.sopId : null,
        currentStepIndex: 0,
        createdAt: new Date().toLocaleString('zh-CN'),
        updatedAt: new Date().toLocaleString('zh-CN'),
        status: 'in-progress'
      }
      this.taskList.unshift(task)
      this.persistTaskList()
      this.currentTaskId = id
      this.tlDialogStep = 'welcome'
      this.resetSession()

      if (inheritData && inheritData.modelSnapshot) {
        // 恢复模型快照，跳过阶段0/1直接到阶段2
        this.restoreStageSnapshot(inheritData.modelSnapshot)
        this.currentStepIndex = 2
        this.isModelBuilt = true
        // 用新消息替代旧对话
        this.messages = [{
          id: 'msg-sop-' + Date.now(),
          role: 'assistant',
          content: `**【SOP模型继承成功】**\n\n已从SOP"${inheritData.sopName}"继承核算模型配置：\n* **核算产品**：${inheritData.productName}\n* **核算标准**：${inheritData.standard}\n* **系统边界**：已配置（C2C全生命周期）\n* **核算模型**：已构建\n\n系统已自动完成 **阶段0（目标定义）** 和 **阶段1（系统边界）**，当前进入 **阶段2·数据采集**。\n\n请录入本期活动数据（用电量、原材料用量等），系统将基于继承的模型自动计算排放量。`,
          suggestions: ['录入活动数据', '查看模型配置', '下一步'],
          timestamp: '刚刚'
        }]
        this.pageMode = 'task-active'
      } else if (inheritData) {
        // 有SOP元数据但无模型快照，从头开始但预填产品信息
        this.selectedStandard = inheritData.standard
        this.pageMode = 'task-active'
        this.initChatFlow()
        this.messages.push({
          id: 'msg-sop-hint-' + Date.now(),
          role: 'assistant',
          content: `💡 检测到该产品关联了SOP"${inheritData.sopName}"，但模型快照数据不可用。将从阶段0开始完整构建模型。`,
          timestamp: '刚刚'
        })
      } else {
        this.pageMode = 'task-active'
        this.initChatFlow()
      }
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },
    startNewTask(productName) {
      // 直接创建新任务并进入九阶段，产品名称和标准在九阶段内部收集
      const id = 'task-' + Date.now()
      const isWind = productName && (productName.indexOf('风机') > -1 || productName.indexOf('风电机组') > -1)
      const task = {
        id: id,
        productName: productName || '新核算任务',
        standard: isWind ? 'GB/T 24067-2024' : 'QC/T 1248-2025',
        currentStepIndex: 0,
        createdAt: new Date().toLocaleString('zh-CN'),
        updatedAt: new Date().toLocaleString('zh-CN'),
        status: 'in-progress'
      }
      this.taskList.unshift(task)
      this.persistTaskList()
      this.currentTaskId = id
      this.tlDialogStep = 'welcome'
      // 记录最近产品
      if (productName) {
        this.addRecentProduct(productName)
      }
      // 初始化九阶段对话会话
      this.resetSession()
      this.pageMode = 'task-active'
      this.initChatFlow()
    },
    createNewTask() {
      if (!this.newTaskProductName.trim()) {
        this.$message.warning('请输入产品名称')
        return
      }
      const id = 'task-' + Date.now()
      const task = {
        id: id,
        productName: this.newTaskProductName.trim(),
        standard: this.newTaskStandard || 'QC/T 1248-2025',
        currentStepIndex: 0,
        createdAt: new Date().toLocaleString('zh-CN'),
        updatedAt: new Date().toLocaleString('zh-CN'),
        status: 'in-progress'
      }
      this.taskList.unshift(task)
      this.persistTaskList()
      this.currentTaskId = id
      this.newTaskProductName = ''
      this.newTaskStandard = ''
      // 初始化新任务的对话会话
      this.resetSession()
      this.selectedStandard = task.standard
      this.pageMode = 'task-active'
      this.initChatFlow()
    },
    continueTask(task) {
      this.currentTaskId = task.id
      // 无快照恢复时按任务类型应用画像（风机/通用）；有快照时快照内已含对应状态
      // 无快照恢复时按任务类型应用画像（风机/通用）；有快照时快照内已含对应状态
      if (!task.stageSnapshot) {
        if (this.isWindTask()) this.applyWindTaskProfile()
        else this.applyDefaultTaskProfile()
      } else {
        // 风机任务即使有快照也校准模型与校验项（风机五环节模型可能已随版本更新）
        if (this.isWindTask()) {
          this.applyWindTaskProfile()
          this.validationItems = this.createWindValidationItems()
        }
      }
      // 从快照恢复所有阶段状态，不再重新初始化
      if (task.stageSnapshot) {
        this.restoreStageSnapshot(task.stageSnapshot)
      } else {
        // 旧任务没有快照，走兼容路径
        this.currentStepIndex = task.currentStepIndex || 0
        this.selectedStandard = task.standard || this.defaultStandardCode()
        if (task.currentStepIndex >= 2) this.isModelBuilt = true
        this.initChatFlow()
      }
      // 快照恢复可能带回汽车口径（旧快照），风机任务最后强制校准
      if (this.isWindTask()) {
        this.applyWindTaskProfile()
        this.validationItems = this.createWindValidationItems()
        if (!this.standards.some(x => x.code === this.selectedStandard)) this.selectedStandard = this.defaultStandardCode()
      }
      this.pageMode = 'task-active'
    },
    deleteTask(taskId) {
      this.taskList = this.taskList.filter(t => t.id !== taskId)
      this.persistTaskList()
      if (this.currentTaskId === taskId) {
        this.currentTaskId = null
        this.pageMode = 'task-list'
      }
    },
    goBackToTaskList() {
      // 保存当前任务完整快照
      this.saveStageSnapshot()
      this.pageMode = 'task-list'
      this.tlDialogStep = 'welcome'
    },
    goBackToUpper() {
      this.saveStageSnapshot()
      this.$router.go(-1)
    },
    showCmdHint() {
      this.messages.push({
        id: 'cmd-' + Date.now(),
        role: 'assistant',
        content: '💡 常用指令：<br/>• 输入产品名称即可开始核算<br/>• "下一步" — 推进当前阶段<br/>• "查看结果" — 查看当前阶段输出<br/>• "重算" — 重新执行当前阶段计算<br/>• 右侧面板展示各阶段详细内容',
        suggestions: ['开始核算', '下一步', '查看结果'],
        timestamp: '刚刚'
      })
      this.scrollToBottom()
    },
    getTaskStatusLabel(status) {
      return status === 'completed' ? '已完成' : '进行中'
    },
    getTaskStatusType(status) {
      return status === 'completed' ? 'success' : 'warning'
    },
    getTaskPhaseName(stepIndex) {
      return this.phases[stepIndex] ? this.phases[stepIndex].name : '未开始'
    },
    resetSession() {
      this.currentStepIndex = 0
      this.selectedStandard = this.defaultStandardCode()
      this.selectedUnit = 'declaration'
      this.boundarySubStep = 0
      this.validationStep = 0
      this.validationActiveTab = 'validation'
      this.isModelBuilt = false
      this.analysisActiveTab = 'routine'
      this.analysisSubStep = 0
      this.sensitivityRatio = 10
      this.reportViewMode = 'report'
      this.isReportArchived = false
      this.isSopPublished = false
      this.boundaryConfig = {
        lifecycleScope: 'cradle-to-grave',
        unitType: 'declaration',
        unitDetail: '1辆汽车（排量1.6L，整备质量1850kg，设计寿命15年/20万公里）',
        allocationRule: 'mass',
        cutoffThreshold: '1%/5%',
        cutoffItemThreshold: '1%',
        cutoffTotalThreshold: '5%',
        timeBoundary: '2024-01-01 - 2024-12-31'
      }
      this.validationItems.forEach(item => {
        item.status = item.type === 'completeness' ? 'missing' : 'pending'
        item.statusLabel = item.type === 'completeness' ? '待补充' : '待确认'
      })
      this.supplementFiles = []
      if (this.isWindTask()) this.applyWindTaskProfile()
      else this.applyDefaultTaskProfile()
      this.initChatFlow()
      // 重置后清空该任务的快照，防止返回列表后再继续时恢复旧数据
      if (this.currentTaskId) {
        const task = this.taskList.find(t => t.id === this.currentTaskId)
        if (task) {
          task.stageSnapshot = null
          task.currentStepIndex = 0
          task.updatedAt = new Date().toLocaleString('zh-CN')
          task.status = 'in-progress'
          this.persistTaskList()
        }
      }
      this.$message.success('会话已重置')
    },
    handleSend(e) {
      if (e && e.shiftKey) return
      if (!this.inputText.trim()) return
      const text = this.inputText.trim()
      this.processInput(text)
      // 保存对话到历史记录
      this.saveCurrentConversation()
    },
    handleSendKey(e) {
      if (e.shiftKey) return
      e.preventDefault()
      this.handleSend()
    },
    autoResizeTextarea() {
      const el = this.$refs.inputTextareaRef
      if (el) {
        el.style.height = 'auto'
        el.style.height = Math.min(el.scrollHeight, 120) + 'px'
      }
    },
    confirmValidationIssues() {
      const unresolved = this.validationItems.filter(v => v.status !== 'resolved' && v.status !== 'skipped')
      if (unresolved.length > 0) {
        this.messages.push({
          id: 'MSG-' + Date.now(),
          role: 'assistant',
          content: `**【提示】** 当前还有 **${unresolved.length}** 项问题未处理：\n${unresolved.map(u => `* ${u.label}（${u.statusLabel}）`).join('\n')}\n\n请先处理所有待补充/待确认问题后再进入下一步，或在对话中选择「暂不处理」跳过。`,
          timestamp: new Date().toLocaleTimeString('zh-CN')
        })
        this.scrollToBottom()
        return
      }
      // 全部已处理，进入阶段7（碳足迹计算结果）
      this.currentStepIndex = 6
      this.validationStep = 5
      this.messages.push({
        id: 'MSG-' + Date.now(),
        role: 'assistant',
        content: '**【阶段6·数据校验】全部通过！**\n所有质检问题均已处理完毕，系统进入 **【阶段7·碳足迹计算结果】**。\n\n右侧展示最终碳足迹计算结果及各单元过程排放贡献树形表。',
        timestamp: new Date().toLocaleTimeString('zh-CN'),
        suggestions: ['查看排放贡献分析', '进入碳足迹分析']
      })
      this.scrollToBottom()
      this.saveStageSnapshot()
    },
    confirmActivityData() {
      // 重置验证项为初始状态
      this.validationItems.forEach(item => {
        item.status = item.type === 'completeness' ? 'missing' : 'pending'
        item.statusLabel = item.type === 'completeness' ? '待补充' : '待确认'
      })
      // 一次性展示：数据调整→重新采集→因子匹配→数据校验，全部结果合并为一条消息
      this.isTyping = true
      this.messages.push({
        id: 'MSG-' + Date.now(),
        role: 'assistant',
        content: '**【数据调整已确认】**\n系统已重新执行核算循环（数据采集→因子匹配→数据校验），结果如下：',
        timestamp: new Date().toLocaleTimeString('zh-CN')
      })
      this.scrollToBottom()
      // 1.2秒后推送校验汇总（与 buildValidationSummary 统一模式）
      setTimeout(() => {
        this.isTyping = false
        this.currentStepIndex = 5
        this.validationStep = 1
        this.validationActiveTab = 'validation'
        this.messages.push({
          id: 'MSG-' + Date.now(),
          role: 'assistant',
          content: this.buildValidationSummary(),
          timestamp: new Date().toLocaleTimeString('zh-CN'),
          suggestions: ['全部使用建议值确认', '暂不处理，直接计算']
        })
        this.scrollToBottom()
        this.saveStageSnapshot()
      }, 1200)
    },
    sendSuggestion(text) {
      this.inputText = text
      this.processInput(text)
    },
    jumpToPhase(idx) {
      if (idx === this.currentStepIndex) return
      this.currentStepIndex = idx
      // 阶段2+需要标记模型已构建
      if (idx >= 2) this.isModelBuilt = true
      // 阶段5（数据校验）：确保 validationStep 在 1-4 范围内，否则右侧面板不显示
      if (idx === 5 && (this.validationStep === 0 || this.validationStep > 4)) {
        this.validationStep = 1
      }
      // 阶段6跳转时，输出完整校验详情而非泛泛描述
      if (idx === 5) {
        this.messages.push({
          id: 'MSG-' + Date.now(),
          role: 'assistant',
          content: this.buildValidationSummary(),
          timestamp: new Date().toLocaleTimeString('zh-CN'),
          suggestions: ['全部使用建议值确认', '暂不处理，直接计算']
        })
        this.scrollToBottom()
        return
      }
      var summaries = [
        '**【阶段1·政策标准】**\n请从右侧政策标准库选择核算标准，查看标准解析结果。选择标准后系统将自动进入下一阶段。',
        '**【阶段2·核算边界】**\n配置生命周期范围、量化单位、分配规则、取舍规则和时间边界共5个步骤。',
        '**【阶段3·核算模型】**\n右侧已初始化核算模型框架，请上传工艺流程图、BOM清单、能源消耗台账等材料，系统将自动解析生成工艺拓扑模型。',
        '**【阶段4·活动数据】**\n系统已并发拉取多源活动数据（BOM清单、能耗数据等），右侧模型已显示实测数据值。',
        '**【阶段5·核算因子】**\n右侧模型已自动绑定排放因子库中的对应因子，可查看各单元过程的因子绑定情况。',
        '',
        '**【阶段7·碳足迹计算】**\n右侧展示最终碳足迹计算结果及各单元过程排放贡献树形表。',
        '**【阶段8·碳足迹分析】**\n进行常规统计分析、不确定性分析和因子敏感性分析。',
        '**【阶段9·碳足迹报告】**\n查看并导出产品碳足迹核算报告，可发布为SOP或提交第三方认证。'
      ]
      var suggestionsMap = [
        this.isWindTask() ? ['选择 GB/T 24067-2024 标准', '选择 ISO 14067 标准'] : ['选择 QC/T 1248-2025 标准', '选择 ISO 14067 标准'],
        ['确认边界配置'],
        ['上传全部材料并构建模型', '确认模型，启动数据收集'],
        ['确认数据，进入因子匹配'],
        ['确认因子，进入数据校验'],
        ['启动数据校验'],
        ['查看排放贡献分析', '进入碳足迹分析'],
        ['导出碳足迹报告'],
        ['导出核算报告', '发布为SOP']
      ]
      this.messages.push({
        id: 'MSG-' + Date.now(),
        role: 'assistant',
        content: summaries[idx],
        timestamp: new Date().toLocaleTimeString('zh-CN'),
        suggestions: suggestionsMap[idx]
      })
      this.scrollToBottom()
    },
    processInput(text) {
      // 数据清单行编辑指令优先处理（确认 / 因子来源 / 改数值）
      if (this.activeActivityRow) {
        if (text.indexOf('确认无误') > -1 && this.confirmActivityRow) {
          this.confirmActivityRow(); this.inputText = ''; return
        }
        if (text.indexOf('因子来源') > -1 && this.showFactorSource) {
          this.showFactorSource(); this.inputText = ''; return
        }
        if (/(改为|调整到|改成|设为)/.test(text) && this.applyActivityEdit && this.applyActivityEdit(text)) {
          this.inputText = ''; return
        }
      }
      // 视图切换类指令立即生效，不等待延迟
      const lower = text.toLowerCase()
      if (lower.includes('数据溯源') || lower.includes('溯源') || lower.includes('来源追溯')) {
        this.reportViewMode = 'traceability'
      } else if (lower.includes('核查推荐') || lower.includes('核查机构') || lower.includes('第三方核查')) {
        this.reportViewMode = 'verification'
      } else if (lower.includes('返回报告') || lower.includes('回到报告')) {
        this.reportViewMode = 'report'
        // 返回报告视图时重置图表初始化标记，让 updated() 重新初始化图表
        this._reportChartsInitDone = false
      }

      const userMsg = {
        id: `MSG-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString('zh-CN')
      }
      this.messages.push(userMsg)
      this.inputText = ''
      this.scrollToBottom()
      this.isTyping = true

      setTimeout(() => {
        this.isTyping = false
        const response = this.generateAIResponse(text)
        if (!response) {
          this.saveStageSnapshot()
          return
        }
        // 第一条消息：阶段完成
        const aiMsg = {
          id: `MSG-${Date.now()}`,
          role: 'assistant',
          content: response.content,
          timestamp: new Date().toLocaleTimeString('zh-CN'),
          suggestions: response.followUpContent ? null : response.suggestions
        }
        this.messages.push(aiMsg)
        this.scrollToBottom()

        // 如果有后续消息（下一阶段开始），延迟推送第二条
        if (response.followUpContent) {
          this.isTyping = true
          setTimeout(() => {
            this.isTyping = false
            const followUpMsg = {
              id: `MSG-${Date.now()}`,
              role: 'assistant',
              content: response.followUpContent,
              timestamp: new Date().toLocaleTimeString('zh-CN'),
              suggestions: response.followUpSuggestions
            }
            this.messages.push(followUpMsg)
            if (response.nextStepIndex !== undefined) {
              this.currentStepIndex = response.nextStepIndex
            }
            if (response.validationStep !== undefined) {
              this.validationStep = response.validationStep
            }
            this.scrollToBottom()
            this.saveStageSnapshot()
          }, 1200)
        } else {
          // 无后续消息，立即处理状态变更
          if (response.nextStepIndex !== undefined) {
            this.currentStepIndex = response.nextStepIndex
          }
          if (response.validationStep !== undefined) {
            this.validationStep = response.validationStep
          }
          this.scrollToBottom()
          this.saveStageSnapshot()
        }
      }, 1000)
    },
    generateAIResponse(input) {
      const lower = input.toLowerCase()

      // ===== 多轮澄清处理 =====
      if (this.isInClarification()) {
        // 逃生通道：阶段二完成指令优先于澄清流程（防止澄清状态卡死阶段推进）
        if (this.currentStepIndex === 1 && (lower.includes('确认边界') || lower.includes('进入核算模型'))) {
          this.cancelClarification()
        } else {
        // 检查是否是取消指令
        if (lower.includes('取消') || lower.includes('跳过') || lower.includes('不用了')) {
          this.cancelClarification()
          return {
            content: '已取消澄清流程。您可以随时通过快捷指令重新启动配置。'
          }
        }
        // 处理澄清回答
        const result = this.answerClarification(input)
        if (result.isComplete) {
          // 澄清完成，生成总结
          const summary = Object.entries(result.data).map(([k, v]) => `* **${k}**：${v}`).join('\n')
          return {
            content: `**【多轮澄清 - 完成】**\n感谢您的耐心确认，已记录以下配置：\n${summary}\n\n配置已自动应用，您可以继续当前阶段的核算工作。`,
            suggestions: ['查看当前配置', '继续下一步']
          }
        } else {
          // 继续下一问
          const nextQ = this.getCurrentClarification()
          if (nextQ) {
            return {
              content: `**【${nextQ.topicName}】** (${nextQ.stepNum}/${nextQ.totalSteps})\n\n${nextQ.question}`,
              suggestions: nextQ.options
            }
          }
        }
        } // else 闭合
      }

      // ===== 触发多轮澄清的关键词 =====
      // 注意：排除"确认边界配置"（阶段二完成指令，须走下方的阶段推进逻辑，不可触发澄清流程）
      if (lower.includes('配置边界') || lower.includes('设置边界') || (lower.includes('边界配置') && !lower.includes('确认'))) {
        if (this.startClarification('boundary')) {
          const q = this.getCurrentClarification()
          return {
            content: `**【${q.topicName}】** (${q.stepNum}/${q.totalSteps})\n\n${q.question}`,
            suggestions: q.options
          }
        }
      }
      if (lower.includes('确认数据') && lower.includes('来源')) {
        if (this.startClarification('dataCollection')) {
          const q = this.getCurrentClarification()
          return {
            content: `**【${q.topicName}】** (${q.stepNum}/${q.totalSteps})\n\n${q.question}`,
            suggestions: q.options
          }
        }
      }

      // ===== 阶段一：政策标准 (currentStepIndex === 0) =====
      if (this.currentStepIndex === 0 && (lower.includes('pdf') || lower.includes('上传') || lower.includes('新标准'))) {
        return {
          content: `💡 **提示**：标准文件的上传与解析已迁移至 **【运维管理 → 政策标准库】**。\n\n请在政策标准库页面点击右上角 **「上传解析标准」** 按钮，完成新标准的入库。入库后回到本页面，即可在右侧政策标准库中选择使用。`,
          suggestions: ['确认使用当前标准'],
          nextStepIndex: 0
        }
      }

      if (this.currentStepIndex === 0 && (lower.includes('确认') || lower.includes('当前标准') || lower.includes('选择'))) {
        this.boundarySubStep = 0
        // 先推送标准确认消息，再弹出因子库选择对话框
        return {
          content: `**阶段一：政策标准 - 完成**\n已确认适用标准：**${this.selectedStandard} 《${this.getStandardName(this.selectedStandard)}》**。标准解析完毕，政策条款与核算要求已提取。\n\n**【阶段二：核算边界】**\n右侧已进入核算边界配置（步骤 1/5）。\n\n本任务的生命周期模型与功能单位（请确认）：\n* **生命周期阶段**：原材料获取 → 零部件生产 → 大件运输 → 风场建设安装与运营维护（20年）→ 报废回收\n* **功能单位**：度电碳足迹（gCO₂e/kWh）（基于年发电小时数 4200h）\n\n请依次确认：\n* 生命周期范围（摇篮到坟墓 / 摇篮到大门 / 大门到大门）\n* 量化单位（功能单位 / 声明单位）\n* 分配规则（按质量 / 按经济价值 / 按能量）\n* 取舍规则（单项阈值 / 累计阈值）\n* 时间边界（核算周期）\n\n同时选择 **排放因子库**（可多选，按标准推荐）。确认无误后点击底部「确认边界配置，进入核算模型」。`,
          nextStepIndex: 1,
          suggestions: ['确认边界配置']
        }
      }

      // 标准锁定的边界项：用标准配置值覆盖（不可由用户改动）
      if (this.currentStepIndex === 1 && this.selectedStandardConfig) {
        const cfg = this.selectedStandardConfig
        const bt = cfg.boundaryTemplate || {}
        if (cfg.scopeFixedValue) this.boundaryConfig.lifecycleScope = cfg.scopeFixedValue
        if (bt.unitType) this.boundaryConfig.unitType = bt.unitType
        if (bt.unitDetail) this.boundaryConfig.unitDetail = bt.unitDetail
        if (bt.allocationRule) this.boundaryConfig.allocationRule = bt.allocationRule
      }

      // ===== 阶段二子步骤 =====
      if (this.currentStepIndex === 1) {
        // 拦截"确认边界配置"——用户点击右侧确认按钮，直接完成全部边界配置并进入阶段3
        if (lower.includes('确认边界') || lower.includes('进入核算模型')) {
          this.boundarySubStep = 5
          // 模型保持空骨架，由用户在阶段3「上传材料并构建模型」后填充
          this.isModelBuilt = false
          if (!this.modelStages || !this.modelStages.length) {
            this.modelStages = this.createEmptyModelStages()
          }
          return {
            content: `**【阶段二：核算边界 - 完成】**\n配置总览：\n* **生命周期范围**：${this.lifecycleScopeLabel}\n* **量化单位**：${this.unitTypeLabel} — ${this.boundaryConfig.unitDetail}\n* **分配规则**：${this.allocationRuleLabel}\n* **取舍规则**：${this.boundaryConfig.cutoffThreshold}（单项 < ${this.boundaryConfig.cutoffItemThreshold}，累计 ≤ ${this.boundaryConfig.cutoffTotalThreshold}）\n* **时间边界**：${this.boundaryConfig.timeBoundary}\n\n所有边界参数已保存。`,
            followUpContent: `**【阶段三：核算模型】**\n右侧已初始化核算模型框架（5个生命周期阶段已就绪，单元过程及输入/输出待录入）。\n\n请上传以下核算模型构建所需的材料，系统将自动解析并生成工艺拓扑模型：\n* **工艺流程图**：定义各阶段单元过程及输入/输出流拓扑关系\n* **BOM清单**：原材料种类及用量数据\n* **能源消耗台账**：各工序电力、热力、燃气等能耗数据\n* **包装信息**：包装材料种类及用量\n* **物流运输数据**：运输方式、距离及载重量\n* **废弃物处理记录**：废气、废水、固废等排放数据`,
            followUpSuggestions: ['上传全部材料并构建模型'],
            nextStepIndex: 2
          }
        }

        if (this.boundarySubStep === 0) {
          let scope = 'cradle-to-grave'
          if (lower.includes('摇篮到大门') || lower.includes('gate')) scope = 'cradle-to-gate'
          else if (lower.includes('大门到大门')) scope = 'gate-to-gate'
          this.boundaryConfig.lifecycleScope = scope
          this.boundarySubStep = 1
          return {
            content: `**【阶段二 - 步骤 2/5】量化单位配置**\n生命周期范围已确认：**${this.lifecycleScopeLabel}**\n\n请选择量化单位类型：`,
            suggestions: ['声明单位', '功能单位'],
            nextStepIndex: 1
          }
        }

        if (this.boundarySubStep === 1) {
          let unitType = 'declaration'
          if (lower.includes('功能单位')) unitType = 'functional'
          this.boundaryConfig.unitType = unitType
          this.selectedUnit = unitType
          this.boundarySubStep = 2
          const unitHint = unitType === 'declaration'
            ? '请输入声明单位的具体定义（如：1辆汽车（排量1.6L，整备质量1850kg，设计寿命15年/20万公里））'
            : '请输入功能单位的具体定义（如：1辆汽车（额定载客5人，在15年设计寿命内提供150,000 km的客运服务））'
          return {
            content: `**【阶段二 - 步骤 2/5】量化单位类型已选择**\n已选择：**${this.unitTypeLabel}**\n\n请输入该单位的<b>具体定义内容</b>：\n${unitHint}\n\n您可直接输入内容，或使用下方建议：`,
            suggestions: [unitType === 'declaration' ? '1辆汽车（排量1.6L，整备质量1850kg，设计寿命15年/20万公里）' : '1辆汽车（额定载客5人，在15年设计寿命内提供150,000 km的客运服务）'],
            nextStepIndex: 1
          }
        }

        if (this.boundarySubStep === 2) {
          if (lower.includes('1辆汽车') || lower.includes('1850kg') || lower.includes('整备质量') || lower.includes('排量') || lower.includes('20万公里')) {
            this.boundaryConfig.unitDetail = '1辆汽车（排量1.6L，整备质量1850kg，设计寿命15年/20万公里）'
          } else if (lower.includes('150,000') || lower.includes('150000') || lower.includes('客运服务') || lower.includes('额定载客')) {
            this.boundaryConfig.unitDetail = '1辆汽车（额定载客5人，在15年设计寿命内提供150,000 km的客运服务）'
          } else {
            this.boundaryConfig.unitDetail = input
          }
          this.boundarySubStep = 3
          return {
            content: `**【阶段二 - 步骤 3/5】分配规则配置**\n量化单位已确认：${this.boundaryConfig.unitType === 'declaration' ? '声明单位' : '功能单位'}定义：**${this.boundaryConfig.unitDetail}**\n\n多产出工艺的排放分配方式（ISO 14044 推荐）：\n* **质量分配**：按产出质量比例分配\n* **经济分配**：按产品经济价值比例分配\n* **能源分配**：按产品含能量比例分配`,
            suggestions: ['质量分配', '经济分配', '能源分配'],
            nextStepIndex: 1
          }
        }

        if (this.boundarySubStep === 3) {
          let rule = 'mass'
          if (lower.includes('经济分配') || lower.includes('economic')) rule = 'economic'
          else if (lower.includes('能源分配') || lower.includes('energy')) rule = 'energy'
          this.boundaryConfig.allocationRule = rule
          this.boundarySubStep = 4
          return {
            content: `**【阶段二 - 步骤 4/5】取舍规则配置**\n分配规则已确认：**${this.allocationRuleLabel}**\n\n根据标准规定，取舍规则最低要求为：\n* **单项物料/单元过程排放贡献 < 总碳足迹 1%** → 可舍弃不计\n* **所有舍弃项累计总和 ≤ 总排放 5%** → 总量控制\n\n您可以接受标准最低要求，或自定义更高要求（如 0.5%/3%）：`,
            suggestions: ['接受标准最低要求（1% / 5%）', '更高要求（0.5% / 3%）', '严格模式（0.1% / 1%）'],
            nextStepIndex: 1
          }
        }

        if (this.boundarySubStep === 4) {
          let cutoff = '1%/5%'
          let cutoffItem = '1%'
          let cutoffTotal = '5%'
          if (lower.includes('0.5') && lower.includes('3')) {
            cutoff = '0.5%/3%'
            cutoffItem = '0.5%'
            cutoffTotal = '3%'
          } else if (lower.includes('0.1') && lower.includes('1%')) {
            cutoff = '0.1%/1%'
            cutoffItem = '0.1%'
            cutoffTotal = '1%'
          }
          this.boundaryConfig.cutoffThreshold = cutoff
          this.boundaryConfig.cutoffItemThreshold = cutoffItem
          this.boundaryConfig.cutoffTotalThreshold = cutoffTotal
          this.boundarySubStep = 5
          return {
            content: `**【阶段二 - 步骤 5/5】时间边界配置**\n取舍规则已确认：**${this.boundaryConfig.cutoffThreshold}**（单项 < ${this.boundaryConfig.cutoffItemThreshold} 可舍弃，累计 ≤ ${this.boundaryConfig.cutoffTotalThreshold}）\n\n请确认核算的时间范围（默认格式：年月日-年月日）：`,
            suggestions: ['2024-01-01 - 2024-12-31', '2023-07-01 - 2024-06-30', '2025-01-01 - 2025-12-31'],
            nextStepIndex: 1
          }
        }

        if (this.boundarySubStep === 5) {
          // 如果用户输入中没有指定日期格式，尝试智能解析
          if (lower.includes('2024-01-01') || lower.includes('2024年度') || lower === '2024') {
            this.boundaryConfig.timeBoundary = '2024-01-01 - 2024-12-31'
          } else if (lower.includes('2023-07') || lower.includes('2023-2024')) {
            this.boundaryConfig.timeBoundary = '2023-07-01 - 2024-06-30'
          } else if (lower.includes('2025')) {
            this.boundaryConfig.timeBoundary = '2025-01-01 - 2025-12-31'
          } else {
            this.boundaryConfig.timeBoundary = input
          }
          this.boundarySubStep = 5
          // 模型保持空骨架，由用户在阶段3「上传材料并构建模型」后填充
          this.isModelBuilt = false
          if (!this.modelStages || !this.modelStages.length) {
            this.modelStages = this.createEmptyModelStages()
          }
          return {
            content: `**【阶段二：核算边界 - 完成】**\n配置总览：\n* **生命周期范围**：${this.lifecycleScopeLabel}\n* **量化单位**：${this.unitTypeLabel} — ${this.boundaryConfig.unitDetail}\n* **分配规则**：${this.allocationRuleLabel}\n* **取舍规则**：${this.boundaryConfig.cutoffThreshold}（单项 < ${this.boundaryConfig.cutoffItemThreshold}，累计 ≤ ${this.boundaryConfig.cutoffTotalThreshold}）\n* **时间边界**：${this.boundaryConfig.timeBoundary}\n\n所有边界参数已保存。`,
            followUpContent: `**【阶段三：核算模型】**\n右侧已初始化核算模型框架（5个生命周期阶段已就绪，单元过程及输入/输出待录入）。\n\n请上传以下核算模型构建所需的材料，系统将自动解析并生成工艺拓扑模型：\n* **工艺流程图**：定义各阶段单元过程及输入/输出流拓扑关系\n* **BOM清单**：原材料种类及用量数据\n* **能源消耗台账**：各工序电力、热力、燃气等能耗数据\n* **包装信息**：包装材料种类及用量\n* **物流运输数据**：运输方式、距离及载重量\n* **废弃物处理记录**：废气、废水、固废等排放数据`,
            followUpSuggestions: ['上传全部材料并构建模型'],
            nextStepIndex: 2
          }
        }
      }

      // ===== 阶段三：材料上传与模型构建 (currentStepIndex === 2) =====
      if (lower.includes('上传全部') || lower.includes('上传工艺流程') || lower.includes('上传bom') || lower.includes('上传能源') || lower.includes('解析工艺') || lower.includes('工艺平衡') || lower.includes('物料平衡')) {
        this.isModelBuilt = true
        this.modelStages = this.buildModelStages()
        return {
          content: `**【阶段三：核算模型】工艺拓扑构建完毕**\n已成功解析上传的材料数据（工艺流程图、BOM清单、能源消耗台账等），**右侧已自动为您构建各阶段的工艺及公式模型！**\n\n在启动多源活动数据收集前，您可以直接在右侧列表中对工艺拓扑进行**模型微调（增/删/改）**：\n- 修改单元过程名称或输入/输出流名称\n- 点击「+」新增输入/输出流或单元过程\n- 点击「✕」删除输入/输出流\n\n调整完成后，点击右侧「确认模型，启动数据收集」进入下一阶段。`,
          suggestions: ['确认模型，启动数据收集'],
          nextStepIndex: 2
        }
      }

      // ===== 确认模型 / 重新确认（先校验模型结构，有问题抛出，无误才进下一阶段） =====
      if (lower.includes('确认模型') || lower.includes('数据收集') || lower.includes('启动多源') || lower.includes('重新确认') || lower.includes('已修正')) {
        // 第一次确认：进行模型校验
        if (!this.modelValidated) {
          const issues = this.validateModel()
          if (issues.length > 0) {
            // 有问题：列出问题，要求用户修正后重新确认
            let issueText = issues.map((iss, i) => `${i + 1}. ${iss}`).join('\n')
            return {
              content: `**【模型结构校验】检测到 ${issues.length} 个问题**\n\n${issueText}\n\n请在右侧列表中修正上述问题后，点击「已修正，重新确认」继续。`,
              suggestions: ['已修正，重新确认模型'],
              nextStepIndex: 2
            }
          } else {
            // 无问题：标记已校验，进入下一阶段
            this.modelValidated = true
            this.validationItems[0].status = 'missing'
            this.validationItems[0].statusLabel = '待补充'
            this.validationItems[1].status = 'missing'
            this.validationItems[1].statusLabel = '待补充'
            this.validationItems[2].status = 'pending'
            this.validationItems[2].statusLabel = '待确认'
            this.validationItems[3].status = 'pending'
            this.validationItems[3].statusLabel = '待确认'

            return {
              content: `**【阶段三：核算模型 - 完成】**\n模型结构校验通过！工艺拓扑模型结构完整、逻辑合理。\n\n**【阶段四：活动数据】** 已并发拉取各单元过程活动数据，请在右侧逐项核对物料的原始值与数据来源。\n\n确认无误后进入排放因子匹配。`,
              suggestions: ['确认数据，进入因子匹配'],
              nextStepIndex: 3
            }
          }
        } else {
          // 已校验过，直接进入下一阶段（防止重复触发）
          return null
        }
      }

      // ===== 阶段4→5：确认数据，进入因子匹配 =====
      if (this.currentStepIndex === 3 && (lower.includes('确认数据') || lower.includes('因子匹配'))) {
        return {
          content: `**【阶段四：活动数据 - 完成】**\n活动数据已锁定，所有实测数据已归档。`,
          followUpContent: `**【阶段五：核算因子】**\n排放因子库已自动匹配各单元过程对应因子，右侧模型已显示因子绑定标签。\n\n请确认因子匹配结果：`,
          followUpSuggestions: ['确认因子，进入数据校验'],
          nextStepIndex: 4
        }
      }

      // ===== 阶段5→6：确认因子，进入数据校验 =====
      if (this.currentStepIndex === 4 && (lower.includes('确认因子') || lower.includes('数据校验'))) {
        // 重置验证项为初始状态
        this.validationItems.forEach(item => {
          item.status = item.type === 'completeness' ? 'missing' : 'pending'
          item.statusLabel = item.type === 'completeness' ? '待补充' : '待确认'
        })
        return {
          content: `**【阶段五：核算因子 - 完成】**\n排放因子匹配已确认，所有单元过程均已绑定对应因子。`,
          followUpContent: this.buildValidationSummary(),
          followUpSuggestions: ['全部使用建议值确认', '暂不处理，直接计算'],
          nextStepIndex: 5,
          validationStep: 1
        }
      }

      // ===== 数据校验：逐项处理 + 一次性处理全部 =====
      if (this.validationStep === 1 && this.currentStepIndex === 5) {
        // 逐项处理（来自右侧面板点击 handleValItemClick，汽车+风机项文案均匹配）
        if (lower.includes('补充铜') || lower.includes('确认天然气') || lower.includes('确认汽油') || lower.includes('废钢因子地理评分')
          || lower.includes('补充钕铁硼') || lower.includes('确认废玻纤') || lower.includes('确认年发电小时数') || lower.includes('玻纤处置因子地理评分')) {
          const resolved = this.validationItems.filter(v => v.status === 'resolved' || v.status === 'skipped')
          const remaining = this.validationItems.filter(v => v.status !== 'resolved' && v.status !== 'skipped')
          if (remaining.length > 0) {
            return {
              content: `已处理该项校验（${resolved.length}/${this.validationItems.length}）。\n\n当前还有 **${remaining.length} 项**待处理：\n${remaining.map(r => `• 【${r.stage}·${r.process}】${r.label}（${r.statusLabel}）`).join('\n')}\n\n请继续在右侧逐项处理，或选择「全部使用建议值确认」一次性完成。`,
              suggestions: ['全部使用建议值确认', '暂不处理，直接计算']
            }
          } else {
            // 所有项均已处理，进入阶段7
            return {
              content: `**【阶段六：数据校验 - 全部完成】**\n所有校验项均已逐项处理通过，数据质量满足核算要求。`,
              followUpContent: this.buildPhase7Content(),
              followUpSuggestions: ['进入碳足迹分析'],
              nextStepIndex: 6,
              validationStep: 5
            }
          }
        }
        // 全部使用建议值确认（需同时包含"全部"和"确认/建议值"，通用：按 recommended 回填）
        if (lower.includes('全部') && (lower.includes('确认') || lower.includes('建议值'))) {
          this.validationItems.forEach(v => {
            if (v.recommended !== undefined) v.value = v.recommended
            v.status = 'resolved'
            v.statusLabel = '已处理'
          })
          return {
            content: `**【阶段六：数据校验 - 全部完成】**\n${this.validationItems.length}项校验均已处理通过：\n${this.validationItems.map(v => `* ✅ ${this.valTypeName(v.type)}：【${v.stage}·${v.process}】${v.ioName} ${v.value}${v.unit ? ' ' + v.unit : ''} 已确认`).join('\n')}\n\n数据质量满足核算要求。`,
            followUpContent: this.buildPhase7Content(),
            followUpSuggestions: ['进入碳足迹分析'],
            nextStepIndex: 6,
            validationStep: 5
          }
        }
        // 暂不处理，直接计算（通用：缺失项跳过，其余按当前值确认）
        if (lower.includes('暂不') || lower.includes('直接计算')) {
          this.validationItems.forEach(v => {
            if (v.status === 'missing') {
              v.status = 'skipped'
              v.statusLabel = '已跳过'
            } else {
              v.status = 'resolved'
              v.statusLabel = '已处理'
            }
          })
          return {
            content: `**【阶段六：数据校验 - 已完成】**\n已跳过缺失项，确认项已处理：\n${this.validationItems.map(v => `* ${v.status === 'skipped' ? '⏭️' : '✅'} ${this.valTypeName(v.type)}：【${v.stage}·${v.process}】${v.ioName}${v.status === 'skipped' ? ' 暂未补充（已跳过）' : ` ${v.value}${v.unit ? ' ' + v.unit : ''} 已确认`}`).join('\n')}\n\n注意：跳过的缺失项可能影响核算精度。`,
            followUpContent: this.buildPhase7Content(),
            followUpSuggestions: ['进入碳足迹分析'],
            nextStepIndex: 6,
            validationStep: 5
          }
        }
      }

      // ===== 阶段八：碳足迹分析（一次性展示常规+不确定性+敏感性三项分析） =====
      if (lower.includes('进入碳足迹分析') || (lower.includes('分析') && this.currentStepIndex === 6)) {
        this.analysisSubStep = 2
        this.analysisActiveTab = 'routine'
        this.uncertaintyParams.sampleSize = 10000
        this.uncertaintyParams.confidenceLevel = 95
        const analysisSummary = this.isWindTask()
          ? `**【阶段八：碳足迹分析 - 全部完成】**\n\n系统已一次性完成三项分析，右侧可通过页签切换查看：\n\n**❶ 常规分析**\n* **排放总量**：${this.formatEmission(this.totalCarbonEmission)} kgCO₂e\n* **度电碳足迹**：**≈ ${this.degreeEmission} gCO₂e/kWh**（对比火电约832，减排99.3%）\n* **排放热点**：原材料生产环节占正排放**49.3%**，风场建设安装占**40.1%**，为前两大减排抓手。\n\n**❷ 不确定性分析**（蒙特卡洛模拟 N=10,000，95%置信度）\n* **相对不确定度**：**±11.6%**（符合规范限值要求）\n* **置信区间界限**：**${this.confidenceIntervalText} kgCO₂e**\n\n**❸ 敏感性分析**（Tornado 敏感度排行）\n* **分母端首要杠杆**：年发电小时数（敏感度系数 **-0.91**，负相关）\n* **材料端首要热点**：稀土采选冶因子（敏感度系数 **+0.46**，正相关）\n* **末端减排路径**：回收钢抵扣系数（敏感度系数 **-0.24**，负相关）\n\n三项分析均已完成，可导出碳足迹核算报告：`
          : `**【阶段八：碳足迹分析 - 全部完成】**\n\n系统已一次性完成三项分析，右侧可通过页签切换查看：\n\n**❶ 常规分析**\n* **排放总量**：${this.formatEmission(this.totalCarbonEmission)} kgCO₂e\n* **同比变化**：较历史车型**同比下降 1.8%**\n* **环比变化**：本季度精益车间减排**环比下降 0.6%**\n* **企业可控减排热点**：原材料获取阶段占企业可控排放的**60.3%**，为首要减排抓手。\n* **减排路径**：原材料阶段采用再生含量法（钢45%/铝30%），较原生材料方案降低约674 kgCO₂e。\n\n**❷ 不确定性分析**（蒙特卡洛模拟 N=10,000，95%置信度）\n* **相对不确定度**：**±11.6%**（符合规范限值要求）\n* **置信区间界限**：**${this.confidenceIntervalText} kgCO₂e**\n\n**❸ 敏感性分析**（Tornado 敏感度排行）\n* **企业可控首要热点**：原铝冶炼电力因子（敏感度系数 **+0.42**，正相关）\n* **减排杠杆**：再生钢含量比例（敏感度系数 **-0.22**，负相关）\n* **次要热点**：拆解能耗（敏感度系数 **+0.32**，正相关）\n\n三项分析均已完成，可导出碳足迹核算报告：`
        return {
          content: analysisSummary,
          suggestions: ['导出碳足迹报告'],
          nextStepIndex: 7
        }
      }

      if (lower.includes('报告') || lower.includes('导出')) {
        const filePrefix = this.isWindTask() ? '6.5MW陆上风电机组' : '燃油汽车_ICE-A160'
        return {
          content: `**【阶段九：碳足迹报告】已编写导出完毕**\n系统已生成以下审计就绪成果：\n* ${filePrefix}_碳足迹审计报告.pdf\n* ${filePrefix}_碳足迹核算明细.xlsx\n\n本次核算摘要已归档至长期记忆中。\n\n💡 您还可进一步：\n* **数据溯源** — 查看每项活动数据与排放因子的来源追溯记录\n* **核查推荐** — 查看内置第三方核查机构名片，获取独立验证建议`,
          suggestions: ['数据溯源', '核查推荐', '重新开始核算'],
          nextStepIndex: 8
        }
      }

      if (lower.includes('数据溯源') || lower.includes('溯源') || lower.includes('来源追溯')) {
        this.reportViewMode = 'traceability'
        return {
          content: `**【数据溯源】已加载**\n右侧已切换至数据溯源视图，展示每项活动数据与排放因子的来源、版本与可信度等级。\n\n所有数据项均可追溯到原始来源：\n* 高可信度数据（85%）— 来自实测记录或权威官方数据库\n* 中等可信度数据（15%）— 来自行业报告或推算模型\n\n您可以切换回报告视图继续查看。`,
          suggestions: ['核查推荐', '返回报告']
        }
      }

      if (lower.includes('核查推荐') || lower.includes('核查机构') || lower.includes('第三方核查')) {
        this.reportViewMode = 'verification'
        return {
          content: `**【核查推荐】已加载**\n右侧已切换至核查机构名片视图，推荐5家具备 ISO 14065 认证资质的第三方核查机构。\n\n建议优先选择国家级认证机构（如CQC），确保核查声明被国际认可。核查周期通常2-4周，费用 ¥2-8万不等。\n\n您可以切换回报告视图继续查看。`,
          suggestions: ['数据溯源', '返回报告']
        }
      }

      if (lower.includes('返回报告') || lower.includes('回到报告')) {
        this.reportViewMode = 'report'
        this._reportChartsInitDone = false
        return {
          content: `已切换回报告视图。您可继续查看碳足迹核算报告的各章节内容。`,
          suggestions: ['数据溯源', '核查推荐', '导出碳足迹报告', '重新开始核算']
        }
      }

      if (lower.includes('重新开始') || lower.includes('重置')) {
        return {
          content: `核算会话已重置。目前处于 **【阶段一：政策标准】**。\n请确认使用右侧选中的核算标准：`,
          suggestions: ['确认使用当前标准'],
          nextStepIndex: 0
        }
      }

      return {
        content: `我已收到您的消息："${input}"\n\n你可以通过点击下方的建议按钮，按步骤推进产品生命周期的九大阶段：`,
        suggestions: ['确认使用当前标准', '重新开始核算']
      }
    },
    statusTagType(status) {
      if (status === 'missing') return 'danger'
      if (status === 'pending') return 'warning'
      if (status === 'resolved') return 'success'
      if (status === 'skipped') return 'info'
      return 'info'
    },
    getValidationName(step) {
      const map = {
        1: '完整性校验 (Completeness Check)',
        2: '一致性校验 (Consistency Check)',
        3: '趋势校验 (Trend Check)',
        4: 'DQR 数据质量指标校验'
      }
      return map[step] || '数据校验'
    },
    handleValItemClick(item) {
      if (item.status === 'resolved') return
      
      let text = ''
      if (item.id === 'val-1') {
        const val = item.value || '30'
        text = `补充铜(线束)实测数据: ${val} kg`
      } else if (item.id === 'val-2') {
        const val = item.value || '850'
        text = `确认天然气核算口径: ${val} Nm³（仅计使用侧）`
      } else if (item.id === 'val-3') {
        const val = item.value || '8880'
        text = `确认汽油L→kg折算: ${val} kg`
      } else if (item.id === 'val-4') {
        const val = item.value || '3.5'
        text = `接受并确认废钢因子地理评分: ${val}`
      } else if (item.id === 'wval-1') {
        const val = item.value || '6000'
        text = `补充钕铁硼实测数据: ${val} kg`
      } else if (item.id === 'wval-2') {
        const val = item.value || '1200'
        text = `确认废玻纤核算口径: ${val} kg（仅计出厂转运）`
      } else if (item.id === 'wval-3') {
        const val = item.value || '4200'
        text = `确认年发电小时数: ${val} h/年（SCADA实测）`
      } else if (item.id === 'wval-4') {
        const val = item.value || '3.0'
        text = `接受并确认玻纤处置因子地理评分: ${val}`
      }
      
      // Update UI status immediately
      item.status = 'resolved'
      item.statusLabel = '已处理'

      if (text) {
        this.sendSuggestion(text)
      }
    },
    downloadMissingChecklist() {
      var rows = [['序号', '阶段', '数据项', '状态', '问题描述', '处理建议']]
      var missing = this.validationItems.filter(function(v) { return v.status === 'missing' })
      missing.forEach(function(item, idx) {
        rows.push([idx + 1, item.stage, item.ioName || item.label, item.statusLabel || '待补充', item.label, item.supplementHint || '相关数据台账/清单文件'])
      })
      var csv = '\uFEFF' + rows.map(function(r) { return r.join(',') }).join('\n')
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      var link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = '缺失数据清单.csv'
      link.click()
      URL.revokeObjectURL(link.href)
    },
    handleSupplementFile(file) {
      if (!file || !file.name) return
      // 添加到文件列表
      this.supplementFiles.push({ name: file.name, raw: file.raw, parsed: false })
      // 模拟解析文件并自动填充缺失数据
      this.isTyping = true
      this.messages.push({
        id: 'MSG-' + Date.now(),
        role: 'assistant',
        content: `**【数据补充】** 正在解析上传文件「${file.name}」...\n提取活动数据中，请稍候。`,
        timestamp: new Date().toLocaleTimeString('zh-CN')
      })
      this.scrollToBottom()
      setTimeout(() => {
        this.isTyping = false
        // 标记文件已解析
        const fItem = this.supplementFiles.find(f => f.name === file.name)
        if (fItem) fItem.parsed = true
        // 模拟：根据文件类型自动填充缺失项
        const filled = []
        this.validationItems.forEach(item => {
          if (item.status === 'missing' && !item.value) {
            if (item.id === 'val-1') { item.value = '30'; filled.push(`铜(线束) 30 kg`) }
            else if (item.id === 'val-2') { item.value = '850'; filled.push(`天然气 850 Nm³（确认仅计使用侧）`) }
          }
        })
        if (filled.length > 0) {
          this.messages.push({
            id: 'MSG-' + Date.now(),
            role: 'assistant',
            content: `**【文件解析完成】** 「${file.name}」已成功解析，提取到以下补充数据：\n${filled.map(f => '• ' + f).join('\n')}\n\n已自动填入对应缺失项，请在校验列表中确认后提交。`,
            timestamp: new Date().toLocaleTimeString('zh-CN'),
            suggestions: ['全部确认提交', '暂不处理，直接计算']
          })
        } else {
          this.messages.push({
            id: 'MSG-' + Date.now(),
            role: 'assistant',
            content: `**【文件解析完成】** 「${file.name}」已解析，未发现与当前缺失项直接匹配的数据。您仍可在校验列表中手动填报。`,
            timestamp: new Date().toLocaleTimeString('zh-CN')
          })
        }
        this.scrollToBottom()
        this.saveStageSnapshot()
      }, 1500)
    },
    // 采纳智能体推荐值：一键填入推荐值并按当前流程提交确认
    adoptRecommended(item) {
      if (item.status === 'resolved' || item.status === 'skipped') return
      if (item.recommended !== undefined) item.value = item.recommended
      this.handleValItemClick(item)
    },
    valTypeName(type) {
      return { completeness: '完整性校验', consistency: '一致性校验', dqr: 'DQR校验' }[type] || '数据校验'
    },
    // 右侧校验面板：全部校验项处理完毕后，点击按钮直接进入阶段七
    finishValidation() {
      const resolved = this.validationItems.filter(v => v.status === 'resolved')
      const skipped = this.validationItems.filter(v => v.status === 'skipped')
      const lines = this.validationItems.map(v => `* ${v.status === 'skipped' ? '⏭️' : '✅'} ${this.valTypeName(v.type)}：【${v.stage}·${v.process}】${v.ioName}${v.status === 'skipped' ? ' 暂未补充（已跳过）' : ` ${v.value}${v.unit ? ' ' + v.unit : ''} 已确认`}`).join('\n')
      const now = () => new Date().toLocaleTimeString('zh-CN')
      this.messages.push({
        id: 'MSG-' + Date.now(),
        role: 'assistant',
        content: `**【阶段六：数据校验 - 全部完成】**\n${resolved.length} 项已处理${skipped.length ? `、${skipped.length} 项已跳过` : ''}：\n${lines}\n\n数据质量满足核算要求。`,
        timestamp: now(),
        suggestions: ['进入碳足迹分析']
      })
      this.messages.push({
        id: 'MSG-' + (Date.now() + 1),
        role: 'assistant',
        content: this.buildPhase7Content(),
        timestamp: now()
      })
      this.currentStepIndex = 6
      this.validationStep = 5
      this.saveStageSnapshot()
      this.scrollToBottom()
    },
    getFileIcon(name) {
      if (!name) return 'el-icon-document'
      const ext = name.split('.').pop().toLowerCase()
      if (['xlsx', 'xls', 'csv'].includes(ext)) return 'el-icon-tickets'
      if (['pdf'].includes(ext)) return 'el-icon-document'
      if (['jpg', 'png', 'jpeg'].includes(ext)) return 'el-icon-picture-outline'
      return 'el-icon-document'
    },
    renderMarkdown(text) {
      if (!text) return ''
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.chatMessagesRef
        if (!container) return
        container.scrollTop = container.scrollHeight
        // 长消息（图表/富文本）渲染完成后再校准一次，确保真正到底
        this.$nextTick(() => {
          container.scrollTop = container.scrollHeight
        })
      })
    },
    // ===== ECharts 图表初始化 =====
    initReportCharts() {
      this.destroyReportCharts()
      this._chartInstances = this._chartInstances || []
      // 1. 饼图 - 各阶段排放占比（动态数据）
      if (this.$refs.reportPieChart) {
        const pie = echarts.init(this.$refs.reportPieChart)
        const pieColors = ['#607d8b', '#ff9800', '#722ed1', '#2196f3', '#52c41a']
        // 图例用阶段短名（与总览子卡命名一致），避免长括号说明换行挤压图表
        const pieData = this.emissionTreeData.map((s, i) => ({
          value: Math.round(s.emission * 10) / 10,
          name: String(s.name || '').split('（')[0],
          itemStyle: { color: pieColors[i] || '#999' }
        }))
        pie.setOption({
          backgroundColor: 'transparent',
          tooltip: { trigger: 'item', formatter: (p) => `${p.name}<br/>${p.value} kgCO₂e（${p.percent}%）` },
          // 图例（右侧垂直，阶段短名）+ 引出线标签（仅占比）：名称与数值分工，互不重复争位
          legend: {
            orient: 'vertical',
            right: 10,
            top: 'middle',
            itemWidth: 10,
            itemHeight: 8,
            itemGap: 10,
            textStyle: { fontSize: 10, color: 'rgba(0,0,0,0.6)' }
          },
          series: [{
            type: 'pie',
            radius: ['38%', '58%'],
            center: ['34%', '52%'],
            avoidLabelOverlap: true,
            minAngle: 3,
            itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
            label: {
              show: true,
              position: 'outside',
              formatter: '{d}%',
              fontSize: 10.5,
              color: '#4a5a72',
              fontWeight: 600
            },
            labelLine: {
              show: true,
              length: 8,
              length2: 10,
              smooth: false,
              lineStyle: { width: 1, color: '#c6cedb' }
            },
            labelLayout: { hideOverlap: true },
            emphasis: {
              label: { show: true, fontSize: 11.5, fontWeight: 700, color: '#1f2d3d' },
              itemStyle: { shadowBlur: 8, shadowColor: 'rgba(15,35,70,0.18)' }
            },
            data: pieData
          }]
        })
        this._chartInstances.push(pie)
      }

      // 2. DQR 雷达图
      if (this.$refs.reportDqrChart) {
        const dqr = echarts.init(this.$refs.reportDqrChart)
        dqr.setOption({
          radar: {
            indicator: [
              { name: '可靠性', max: 5 },
              { name: '完整性', max: 5 },
              { name: '时间相关性', max: 5 },
              { name: '地理相关性', max: 5 },
              { name: '技术相关性', max: 5 }
            ],
            radius: '60%',
            axisName: { fontSize: 10, color: 'rgba(0,0,0,0.45)' },
            splitArea: { areaStyle: { color: ['rgba(103,194,58,0.06)', 'rgba(0,188,212,0.06)', 'rgba(0,103,254,0.06)', 'rgba(114,46,209,0.06)'] } },
            splitLine: { lineStyle: { color: '#eeeeee' } }
          },
          tooltip: {},
          series: [{
            type: 'radar',
            data: [
              { value: [1.5, 2.0, 2.5, 2.0, 2.5], name: '实际评分', areaStyle: { color: 'rgba(82,196,26,0.3)' }, lineStyle: { color: '#52c41a', width: 2 }, itemStyle: { color: '#52c41a' } },
              { value: [3, 3, 3, 3, 3], name: '限值(3.0)', areaStyle: { color: 'rgba(250,173,20,0.1)' }, lineStyle: { color: '#faad14', width: 1, type: 'dashed' }, itemStyle: { color: '#faad14' }, symbol: 'none' }
            ]
          }],
          backgroundColor: 'transparent',
          legend: { bottom: 0, textStyle: { fontSize: 10, color: 'rgba(0,0,0,0.45)' }, itemWidth: 12, itemHeight: 8 }
        })
        this._chartInstances.push(dqr)
      }

      // 4. Tornado 敏感性分析横向柱状图（数据与报告第七章同源：reportSensitivityData 已按任务画像分叉）
      if (this.$refs.reportTornadoChart) {
        const tornado = echarts.init(this.$refs.reportTornadoChart)
        const sensData = this.reportSensitivityData.map(d => ({ name: d.name, coeff: d.coeff }))
        tornado.setOption({
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: function(params) { return params[0].name + ': ' + (params[0].value > 0 ? '+' : '') + params[0].value } },
          backgroundColor: 'transparent',
          grid: { left: 90, right: 30, top: 10, bottom: 20 },
          xAxis: { type: 'value', name: '敏感度系数', axisLabel: { fontSize: 9, color: 'rgba(0,0,0,0.45)' }, nameTextStyle: { fontSize: 9, color: '#909399' } },
          yAxis: { type: 'category', data: sensData.map(d => d.name), axisLabel: { fontSize: 9, color: 'rgba(0,0,0,0.45)' } },
          series: [{
            type: 'bar',
            barWidth: 14,
            data: sensData.map(d => ({
              value: d.coeff,
              itemStyle: { color: d.coeff > 0 ? '#ff4d4f' : '#52c41a', borderRadius: d.coeff > 0 ? [0, 3, 3, 0] : [3, 0, 0, 3] }
            })),
            label: { show: true, position: 'right', formatter: function(p) { return p.value > 0 ? '+' + p.value : p.value }, fontSize: 9 }
          }]
        })
        this._chartInstances.push(tornado)
      }

      // 5. 不确定性评价 - 蒙特卡洛模拟整体分布图
      if (this.$refs.reportUncertaintyChart) {
        const uncertainty = echarts.init(this.$refs.reportUncertaintyChart)
        const bins = this.monteCarloBins
        const curvePts = this.normalCurvePoints
        const mcTotal = this.totalCarbonEmission
        const mcSigma = mcTotal * 0.0594
        const ciLower = Math.round(mcTotal - 1.96 * mcSigma)
        const ciUpper = Math.round(mcTotal + 1.96 * mcSigma)
        const muLabel = bins.reduce(function(prev, curr) { return Math.abs(curr.center - mcTotal) < Math.abs(prev.center - mcTotal) ? curr : prev }).label
        const lowerLabel = bins.reduce(function(prev, curr) { return Math.abs(curr.center - ciLower) < Math.abs(prev.center - ciLower) ? curr : prev }).label
        const upperLabel = bins.reduce(function(prev, curr) { return Math.abs(curr.center - ciUpper) < Math.abs(prev.center - ciUpper) ? curr : prev }).label
        const muStr = Math.round(mcTotal).toLocaleString()
        uncertainty.setOption({
          backgroundColor: 'transparent',
          tooltip: {
            trigger: 'axis',
            formatter: function(params) {
              let tip = ''
              params.forEach(function(p) {
                if (p.seriesType === 'bar') tip += p.name + ': 频数 ' + p.value + ' 次<br/>'
                else if (p.seriesType === 'line') tip += '正态拟合: ' + Math.round(p.value) + ' 次<br/>'
              })
              return tip || ('均值: ' + muStr + ' kgCO₂e')
            }
          },
          grid: { left: 55, right: 20, top: 15, bottom: 35 },
          xAxis: {
            type: 'category',
            data: bins.map(function(b) { return b.label }),
            axisLabel: { fontSize: 9, interval: 2, color: 'rgba(0,0,0,0.45)' },
            name: 'kgCO₂e',
            nameTextStyle: { fontSize: 9, color: '#909399' }
          },
          yAxis: {
            type: 'value',
            name: '频数 (次)',
            axisLabel: { fontSize: 9, color: 'rgba(0,0,0,0.45)' },
            nameTextStyle: { fontSize: 9, color: '#909399' }
          },
          series: [
            {
              name: '频数分布',
              type: 'bar',
              barWidth: '60%',
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#faad14' },
                  { offset: 1, color: 'rgba(250,173,20,0.3)' }
                ]),
                borderRadius: [2, 2, 0, 0]
              },
              data: bins.map(function(b) { return b.freq }),
              markLine: {
                silent: true,
                symbol: 'none',
                data: [
                  { xAxis: muLabel, label: { formatter: '均值 ' + muStr, fontSize: 9, color: '#0067FE' }, lineStyle: { color: '#0067FE', width: 2 } },
                  { xAxis: lowerLabel, label: { formatter: 'P2.5=' + ciLower, fontSize: 8, color: '#52c41a' }, lineStyle: { color: '#52c41a', width: 1.5, type: 'dashed' } },
                  { xAxis: upperLabel, label: { formatter: 'P97.5=' + ciUpper, fontSize: 8, color: '#ff4d4f' }, lineStyle: { color: '#ff4d4f', width: 1.5, type: 'dashed' } }
                ]
              },
              z: 1
            },
            {
              name: '正态拟合',
              type: 'line',
              smooth: true,
              symbol: 'none',
              lineStyle: { color: '#e6a23c', width: 2 },
              data: curvePts.map(function(pt) { return pt[1] }),
              z: 2
            }
          ]
        })
        this._chartInstances.push(uncertainty)
      }
    },
    destroyReportCharts() {
      if (this._chartInstances) {
        this._chartInstances.forEach(c => c && c.dispose())
        this._chartInstances = []
      }
    },
    // ===== 阶段八 蒙特卡洛直方图 ECharts =====
    initAnalysisCharts() {
      this.destroyAnalysisCharts()
      if (!this._analysisChartInstances) {
        this._analysisChartInstances = []
      }
      if (this.$refs.analysisMonteCarloChart) {
        var mc = echarts.init(this.$refs.analysisMonteCarloChart)
        var bins = this.monteCarloBins
        var curvePts = this.normalCurvePoints
        var mcTotal = this.totalCarbonEmission
        var mcSigma = mcTotal * 0.0594
        var ciLower = Math.round(mcTotal - (this.uncertaintyParams.confidenceLevel === 95 ? 1.96 : 1.645) * mcSigma)
        var ciUpper = Math.round(mcTotal + (this.uncertaintyParams.confidenceLevel === 95 ? 1.96 : 1.645) * mcSigma)
        var muLabel = bins.reduce(function(prev, curr) { return Math.abs(curr.center - mcTotal) < Math.abs(prev.center - mcTotal) ? curr : prev }).label
        mc.setOption({
          backgroundColor: 'transparent',
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: function(params) {
              var tip = ''
              params.forEach(function(p) {
                if (p.seriesType === 'bar') {
                  tip += p.name + ': 频数 ' + p.value + ' 次<br/>'
                } else if (p.seriesType === 'line') {
                  tip += '正态拟合: ' + Math.round(p.value) + ' 次<br/>'
                }
              })
              return tip
            }
          },
          grid: { left: 60, right: 20, top: 30, bottom: 35 },
          xAxis: {
            type: 'category',
            data: bins.map(function(b) { return b.label }),
            axisLabel: { fontSize: 9, interval: 2, color: 'rgba(0,0,0,0.45)' },
            name: 'kgCO₂e',
            nameTextStyle: { fontSize: 9, color: '#909399' }
          },
          yAxis: {
            type: 'value',
            name: '频数 (次)',
            axisLabel: { fontSize: 9, color: 'rgba(0,0,0,0.45)' },
            nameTextStyle: { fontSize: 9, color: '#909399' }
          },
          series: [
            {
              name: '频数直方',
              type: 'bar',
              barWidth: '85%',
              data: bins.map(function(b) {
                return {
                  value: b.freq,
                  itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      { offset: 0, color: '#faad14' },
                      { offset: 1, color: 'rgba(250,173,20,0.4)' }
                    ]),
                    borderRadius: [2, 2, 0, 0]
                  }
                }
              }),
              z: 1
            },
            {
              name: '正态拟合',
              type: 'line',
              smooth: true,
              symbol: 'none',
              lineStyle: { color: '#e6a23c', width: 2 },
              data: curvePts.map(function(pt) { return pt[1] }),
              z: 2
            },
            {
              name: '均值',
              type: 'markLine',
              silent: true,
              symbol: 'none',
              lineStyle: { color: '#0067FE', width: 2, type: 'solid' },
              data: [{ xAxis: muLabel, label: { formatter: '均值 ' + Math.round(mcTotal).toLocaleString(), fontSize: 9, color: '#0067FE' } }]
            },
            {
              name: '95%CI下界',
              type: 'markLine',
              silent: true,
              symbol: 'none',
              lineStyle: { color: '#52c41a', width: 1.5, type: 'dashed' },
              data: [{ xAxis: bins.reduce(function(prev, curr) { return Math.abs(curr.center - ciLower) < Math.abs(prev.center - ciLower) ? curr : prev }).label, label: { formatter: 'P2.5=' + ciLower, fontSize: 8, color: '#52c41a' } }]
            },
            {
              name: '95%CI上界',
              type: 'markLine',
              silent: true,
              symbol: 'none',
              lineStyle: { color: '#ff4d4f', width: 1.5, type: 'dashed' },
              data: [{ xAxis: bins.reduce(function(prev, curr) { return Math.abs(curr.center - ciUpper) < Math.abs(prev.center - ciUpper) ? curr : prev }).label, label: { formatter: 'P97.5=' + ciUpper, fontSize: 8, color: '#ff4d4f' } }]
            }
          ]
        })
        this._analysisChartInstances.push(mc)
      }
    },
    destroyAnalysisCharts() {
      if (this._analysisChartInstances) {
        this._analysisChartInstances.forEach(function(c) { c && c.dispose() })
        this._analysisChartInstances = []
      }
    },
    // 图表尺寸自适应：窗口变化/侧栏展开收起时重绘，避免以旧尺寸绘制造成溢出错位
    handleChartResize() {
      const all = [].concat(this._chartInstances || [], this._analysisChartInstances || [])
      all.forEach(c => { try { c && c.resize() } catch (e) { /* ignore */ } })
    }
  },
  created() {
    // 图表尺寸自适应监听
    if (typeof window !== 'undefined') {
      this._onWinResize = () => this.handleChartResize()
      window.addEventListener('resize', this._onWinResize)
    }
    // 从localStorage加载历史任务列表
    try {
      const saved = localStorage.getItem('cfp_task_list')
      if (saved) this.taskList = JSON.parse(saved)
    } catch (e) { /* ignore */ }
    // 预置燃油汽车产品碳足迹计算任务（基于0714燃油汽车产品碳模型样例）
    const iceTaskId = 'task-ice-a160-preset'
    if (!this.taskList.find(t => t.id === iceTaskId)) {
      this.taskList.unshift({
        id: iceTaskId,
        productName: '燃油汽车 ICE-A160 产品碳足迹',
        standard: 'ISO 14067',
        sopId: 'SOP-ICE-A160',
        currentStepIndex: 1,
        createdAt: '2026/7/14 20:30:00',
        updatedAt: '2026/7/14 20:39:00',
        status: 'in-progress'
      })
      this.persistTaskList()
    }
    // 预置陆上风电机组产品碳足迹任务（基于远景《风机碳足迹与低碳发展报告2023》公开数据：
    // EN-171/6.5 机型度电碳足迹 5.56 gCO2e/kWh；五环节 LCA：原材料开采/零部件生产/风场建设安装/运营维护/废弃回收；
    // 碳排放占比：零部件生产 49.3% > 风场建设 40.1% > 运维最低；年发电小时数 3500~4500h、设计年限 20 年）
    const windTaskId = 'task-wind-preset'
    if (!this.taskList.find(t => t.id === windTaskId)) {
      this.taskList.unshift({
        id: windTaskId,
        productName: '6.5MW陆上风电机组产品碳足迹',
        standard: 'GB/T 24067-2024',
        currentStepIndex: 0,
        createdAt: '2026/9/10 09:00:00',
        updatedAt: '2026/9/10 09:10:00',
        status: 'in-progress'
      })
      this.persistTaskList()
    }
  },
  beforeDestroy() {
    if (typeof window !== 'undefined' && this._onWinResize) {
      window.removeEventListener('resize', this._onWinResize)
      this._onWinResize = null
    }
  }
}
