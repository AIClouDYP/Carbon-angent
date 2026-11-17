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
    },    /** 阶段6 · 完成消息（园区版） */
    buildPhase6Complete(mode) {
      const q = this.parkQualityAssessment || {}
      const st = this.parkIndicatorStats || {}
      const head = mode === '部分跳过'
        ? '**【阶段6 · 数据校验 - 已完成】**\n部分缺失项已跳过，确认项已处理：'
        : '**【阶段6 · 数据校验 - 全部完成】**\n所有校验项均已逐项处理通过，数据质量满足核算要求。'
      let msg = head
      msg += '\n\n**数据质量评估**\n'
      msg += `• 加权质量分：**${q.weightedScore} / 5.0**（${q.weightedGrade} 级）\n`
      msg += `• 覆盖率：活动数据 ${q.sourceCoverage || 0}%，排放因子 ${q.factorCoverage || 0}%\n`
      msg += `• 数据项：${q.total || 0} 项（活动数据 ${q.adTotal || 0} + 排放因子 ${q.efTotal || 0}）\n`
      msg += `• 低质量项：${(q.lowQuality || []).length} 项\n`
      msg += `\n**指标达标准备**\n• 已归集 ${st.total || 6} 项指标（1 核心 + 5 引导）计算所需参数\n`
      if (mode === '部分跳过') {
        msg += '\n⚠️ 注意：跳过的缺失项可能影响核算精度，建议后续补充佐证材料。'
      }
      msg += '\n\n---\n\n**下一步**：点击「进入排放计算」，按四大分类逐项完成排放核算。'
      return msg
    },
    /** 阶段8 · 排放分析（园区版） */
    buildPhase8Content() {
      const calc = this.parkEmissionCalc || { groups: [], total: 0 }
      const st = this.parkIndicatorStats || {}
      const rows = this.parkIndicatorRows || []
      const rank = this.parkSourceRanking || []
      const fmt = (v) => (v == null ? '—' : Number(v).toFixed(2))
      const total = fmt(calc.total)
      const totalWan = (calc.total / 10000).toFixed(2)

      let msg = '**【阶段8 · 排放分析 - 全部完成】**\n\n系统已完成多维度排放分析，右侧可通过页签切换查看：\n'

      // ① 排放构成
      msg += '\n**❶ 排放构成（四大分类占比）**\n'
      ;(calc.groups || []).forEach(g => {
        const pct = calc.total ? (g.subtotal / calc.total * 100).toFixed(1) : '0.0'
        msg += `* ${g.key}：${fmt(g.subtotal)} tCO₂（${pct}%）\n`
      })
      msg += `* ━━━\n* **园区碳排放总量：${total} tCO₂ ≈ ${totalWan} 万吨CO₂**\n`

      // ② 排放源贡献 Top 5
      msg += `\n**❷ 排放源贡献 Top ${Math.min(rank.length, 5)}**\n`
      rank.slice(0, 5).forEach((x, i) => {
        msg += `${i + 1}. **${x.name}**（${x.category}）：${fmt(x.value)} tCO₂\n`
      })

      // ③ 指标达标评价
      msg += `\n**❸ 指标达标评价（${st.pass}/${st.total} 项达标）**\n`
      rows.forEach(r => {
        const tag = r.pass ? '✅ 达标' : '❌ 未达标'
        msg += `* ${r.name}（${r.typeName}）：${r.valueText}，目标 ${r.targetText} → ${tag}\n`
      })
      if (st.corePass === 0) {
        msg += `\n⚠️ **核心指标未达标**：单位能耗碳排放 ${this.parkIndicatorCalc ? this.parkIndicatorCalc.carbonPerTce.toFixed(3) : '—'} tCO₂/tce，门槛 ≤ 0.20，需在下一阶段提出改进措施。`
      }

      // ④ 关键强度指标
      msg += '\n**❹ 关键强度指标**\n'
      msg += `* 综合能耗：**${this.parkTotalEnergy.toFixed(0)} tce**\n`
      msg += `* 单位能耗碳排放：**${this.parkCarbonPerTce.toFixed(3)} tCO₂/tce**\n`
      msg += `* 非化石能源折标：${this.parkIndicatorCalc ? this.parkIndicatorCalc.nonFossilTce.toFixed(2) : '—'} tce\n`

      msg += '\n---\n\n**下一步**：点击「生成核算报告」，生成《零碳园区建设自评报告》，包含达标差距分析与改进路径建议。'

      return msg
    },

    buildPhase7Content() {
      const calc = this.parkEmissionCalc || { groups: [], total: 0 }
      const q = this.parkQualityAssessment || {}
      const st = this.parkIndicatorStats || {}
      const fmt = (v) => (v == null ? '—' : Number(v).toFixed(2))
      const total = fmt(calc.total)
      const totalWan = (calc.total / 10000).toFixed(2)
      const subject = this.isWindTask() ? '亦庄新能源汽车产业园' : '北京亦庄新城零碳智能产业园'

      let msg = `**【阶段7 · 排放计算 - 完成】**\n系统已按「活动数据 × 排放因子」对 ${subject} 的 **4 大法定分类** 逐项完成排放核算，结果如下：\n`

      // ① 四大分类
      msg += `\n**❶ 四大分类排放量**\n`
      ;(calc.groups || []).forEach(g => {
        const pct = calc.total ? (g.subtotal / calc.total * 100).toFixed(1) : '0.0'
        msg += `* ${g.key}：**${fmt(g.subtotal)} tCO₂**（${pct}%）\n`
      })
      msg += `* ━━━\n* **园区碳排放总量：${total} tCO₂ ≈ ${totalWan} 万吨CO₂**\n`

      // ② 排放源贡献 Top
      const rank = this.parkSourceRanking || []
      if (rank.length > 0) {
        msg += `\n**❷ 排放源贡献 Top ${Math.min(rank.length, 5)}**\n`
        rank.slice(0, 5).forEach((x, i) => {
          msg += `${i + 1}. ${x.name}（${x.category}）：${fmt(x.value)} tCO₂\n`
        })
      }

      // ③ 综合能耗与单位能耗碳排放
      const energy = this.parkTotalEnergy || 0
      const per = this.parkCarbonPerTce || 0
      msg += `\n**❸ 关键强度指标**\n`
      msg += `* 综合能耗：**${energy.toFixed(0)} tce**\n`
      msg += `* 单位能耗碳排放：**${per.toFixed(3)} tCO₂/tce**\n`
      msg += `* 非化石能源折标：${this.parkIndicatorCalc ? this.parkIndicatorCalc.nonFossilTce.toFixed(2) : '—'} tce\n`

      // ④ 指标参数计算结果
      msg += `\n**❹ 指标参数计算结果（${st.total || 6} 项）**\n`
      msg += `* 单位能耗碳排放、清洁能源消费比重、产品能效达标比例\n`
      msg += `* 工业固废综合利用率、工业余能利用率、中水回用率\n`
      msg += `* 详细公式与参数可在右侧树形表格「指标参数」节点查看\n`

      msg += `\n---\n\n**下一步**：点击下方「进入排放分析」，查看排放构成、Top 排放源与指标达标评价，然后生成零碳园区建设自评报告。`

      return msg
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
          content: `您好！我是小易，园区碳核算智能体。\n\n我将引导您对零碳园区碳排放的九阶段智能核算。\n当前系统处于 **【阶段1 · 政策标准】**。\n\n当前已选中标准：**${code}**（《${this.getStandardName(code)}》）\n\n请确认使用该标准进入核算，或在右侧切换其他标准：`,
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
          content: `**【排放因子库选择 - 已确认】**\n${libSummary}\n\n---\n\n**【阶段2 · 核算边界】**\n\n园区碳核算边界依据《零碳园区碳排放核算方法（试行）》确定：\n\n**核算边界（只读）：**\n· 边界类型：园区法定地理边界\n· 核算范围：化石燃料燃烧 + 能源加工转换 + 净购入电力热力 + 工业过程\n· 气体范围：仅二氧化碳（CO₂）\n· 计量单位：万吨 CO₂\n\n请在右侧确认园区主体信息与核算年度：`,
          suggestions: ['确认边界配置，进入排放源清单']
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
        const windWelcome = `您好！我是小易，园区碳核算智能体。\n\n当前核算对象为 **亦庄新能源汽车产业园**（叶轮直径171m / 塔架高度110m / 设计寿命20年）。\n\n当前处于 **【阶段1 · 政策标准】**：请在右侧「政策标准库」确认核算标准，系统将解析该标准的适用范围、生命周期阶段、边界量化规则与数据质量要求，作为后续核算的依据。\n\n当前已选中标准：**${this.selectedStandard}**`
        this.messages = [
          { id: 'MSG-001', role: 'assistant', content: windWelcome, timestamp: new Date().toLocaleTimeString('zh-CN'), suggestions: ['确认使用当前标准'] }
        ]
        return
      }
      // 构建通用个性化欢迎消息
      let welcomeContent = `您好！我是小易，园区碳核算智能体。\n\n我将引导您完成**零碳园区碳排放核算**与**零碳建设自评**，共九个阶段：\n\n**政策标准 → 核算边界 → 排放源清单 → 活动数据 → 排放因子 → 数据校验 → 排放计算 → 排放分析 → 排放报告**\n\n当前处于 **【阶段1 · 政策标准】**，请先在右侧确认核算标准。\n\n当前已选中标准：**${this.selectedStandard}**`

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
      try { localStorage.setItem('park_task_list', JSON.stringify(this.taskList)) } catch (e) { /* ignore */ }
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
      // 已有当前任务 → 视为阶段内指令，走阶段推进逻辑，不新建任务
      if (this.currentTaskId && this.taskList.find(t => t.id === this.currentTaskId)) {
        this.pageMode = 'task-active'
        this.processInput(text)
        return
      }
      // 无当前任务 → 才创建新任务
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
      // 防重入：已在创建中则跳过
      if (this._creatingTask) return
      this._creatingTask = true
      this.$nextTick(() => { this._creatingTask = false })

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
        productName: inheritData ? inheritData.productName : (queryProductName || '园区碳排放核算'),
        standard: inheritData ? inheritData.standard : '零碳园区碳排放核算方法',
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
          content: `**【SOP模型继承成功】**\n\n已从SOP"${inheritData.sopName}"继承排放源清单配置：\n* **核算产品**：${inheritData.productName}\n* **核算标准**：${inheritData.standard}\n* **系统边界**：已配置（C2C全生命周期）\n* **核算模型**：已构建\n\n系统已自动完成 **阶段0（目标定义）** 和 **阶段1（系统边界）**，当前进入 **阶段2·数据采集**。\n\n请录入本期活动数据（用电量、原材料用量等），系统将基于继承的模型自动计算排放量。`,
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
      // 直接创建新任务并进入九阶段，园区名称和标准在九阶段内部收集
      const id = 'task-' + Date.now()
      const isWind = productName && (productName.indexOf('风机') > -1 || productName.indexOf('风电机组') > -1)
      const task = {
        id: id,
        productName: productName || '新核算任务',
        standard: isWind ? '国家级零碳园区建设指标体系（试行）' : 'QC/T 1248-2025',
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
        this.$message.warning('请输入园区名称')
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
      // 保存当前进度后，返回工作台（任务列表），而非浏览器历史后退
      this.saveStageSnapshot()
      this.$router.push('/park-accounting/workspace').catch(() => {})
    },
    showCmdHint() {
      this.messages.push({
        id: 'cmd-' + Date.now(),
        role: 'assistant',
        content: '💡 常用指令：<br/>• 输入园区名称即可开始核算<br/>• "下一步" — 推进当前阶段<br/>• "查看结果" — 查看当前阶段输出<br/>• "重算" — 重新执行当前阶段计算<br/>• 右侧面板展示各阶段详细内容',
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
      // 全部已处理，进入阶段7（排放计算）
      this.currentStepIndex = 6
      this.validationStep = 5
      this.messages.push({
        id: 'MSG-' + Date.now(),
        role: 'assistant',
        content: '**【阶段6 · 数据校验】全部通过！**\n所有质检问题均已处理完毕，系统进入 **【阶段7 · 排放计算】**。\n\n右侧展示按四大分类逐项计算的排放量，以及 6 项指标参数的计算结果。',
        timestamp: new Date().toLocaleTimeString('zh-CN'),
        suggestions: ['查看指标参数计算', '进入排放分析']
      })
      this.scrollToBottom()
      this.saveStageSnapshot()
    },
    reconfirmActivityData() {
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
      // 进入阶段3（排放源清单）时自动同步底座数据
      if (idx === 2) this.$nextTick(() => this.syncBaseDataSources())
      // 阶段2+需要标记模型已构建
      if (idx >= 2) this.isModelBuilt = true
      // 阶段5（数据校验）：确保 validationStep 在 1-4 范围内，否则右侧面板不显示
      if (idx === 5 && (this.validationStep === 0 || this.validationStep > 4)) {
        this.validationStep = 1
      }
      var summaries = [
        // ① 政策标准
        '**【阶段1 · 政策标准】**\n请从右侧「政策标准库」确认零碳园区核算标准。系统将自动解析该标准的适用范围、指标体系（1 核心 + 5 引导）、核算边界规则、数据质量要求与特殊规则，作为后续八个阶段的核算依据。\n\n当前已选中标准：**' + this.selectedStandard + '**',
        // ② 核算边界
        '**【阶段2 · 核算边界】**\n请确认以下五类边界配置：\n\n* **园区主体** — 名称、面积、主导产业\n* **核算边界** — 法定地理边界 / 四大法定分类 / 仅核算 CO₂\n* **核算年度** — 起止日期与计量单位\n* **产品信息** — 园区工业过程产品清单\n* **排放因子库** — 选择 IPCC 2006、DB11/T 1787、GB/T 2589 等\n\n全部确认后进入排放源清单编制。',
        // ③ 排放源清单
        '**【阶段3 · 排放源清单】**\n右侧已初始化四大法定分类的排放源框架：\n\n* 化石燃料燃烧\n* 能源加工转换（支持多组**输入 / 输出**物料）\n* 净购入电力热力（支持多组输入 / 输出）\n* 工业过程\n\n请在对应分类下维护排放源与物料清单，结构与「类别 → 项目 → 输入/输出分组 → 物料」一致；同时可在「其他计算参数清单」中核对 16 项指标底账参数。\n\n确认后启动多源数据收集。',
        // ④ 活动数据
        '**【阶段4 · 活动数据采集】**\n系统已按数据渠道自动归集活动数据：\n\n* **底座数据识别** — 计量表直连，进入阶段即同步完成\n* **材料识别** — 左侧上传凭证后 OCR 自动识别回填\n\n当前存在待确认项，可点击「下一个待确认」逐项核对，或点击参数行查看详情、修改数值、上传佐证材料。全部确认后进入排放因子匹配。',
        // ⑤ 排放因子
        '**【阶段5 · 排放因子匹配】**\n系统已按计算公式自动匹配两类参数：\n\n* **EF 排放因子** — IPCC 2006 / DB11/T 1787 / 华北电网等\n* **CEF 折标煤系数** — GB/T 2589 当量值\n\n能源加工转换类按**投入 / 产出**分别列出因子，投入记正、产出记负。可点击参数行查看因子来源与取值依据，也可直接修改参数值。全部确认后进入数据校验。',
        // ⑥ 数据校验
        '**【阶段6 · 数据校验】**\n系统已完成数据质量评估（DQR 1~5 级）：\n\n* **整体质量评估** — 加权质量分、DQR 分布、来源结构、覆盖率、因子置信度、时效性\n* **数据清单** — 完整展示 4 大分类 + 6 项指标的全部参数，可内联编辑与查看详情\n\n审查无误后进入排放计算。',
        // ⑦ 排放计算
        '**【阶段7 · 排放计算】**\n系统已按「活动数据 × 排放因子」逐项完成核算：\n\n* **四大分类** — 化石燃料燃烧 / 能源加工转换（投入减产出）/ 净购入电力热力 / 工业过程\n* **指标参数** — 综合能耗、非化石折标、单位能耗碳排放等 6 项指标的计算结果\n\n点击分类或排放源可展开查看参数明细。',
        // ⑧ 排放分析
        '**【阶段8 · 排放分析】**\n系统已完成多维度分析：\n\n* **排放构成** — 四大分类占比环形图\n* **排放源贡献** — Top 8 排放源排行\n* **指标达标评价** — 1 项核心 + 5 项引导指标的对标结果\n\n确认后生成零碳园区建设自评报告。',
        // ⑨ 排放报告
        '**【阶段9 · 排放报告】**\n系统已生成完整的《零碳园区建设自评报告》，含 9 个章节：\n\n园区基本情况 → 指标体系自评 → 核算结果 → 零碳措施与成效 → 数据质量与可追溯性 → 达标差距分析 → 改进路径与时间表 → 自评结论 → 免责声明\n\n可导出 PDF / Word / 明细 Excel，或归档至园区碳资产库、申请专家复核。'
      ]
      var suggestionsMap = [
        // ① 政策标准
        this.isWindTask() ? ['选择 国家级零碳园区建设指标体系 标准', '选择 零碳园区碳排放核算方法 标准'] : ['选择 零碳园区碳排放核算方法 标准', '查看标准解析'],
        // ② 核算边界
        ['确认边界配置', '查看指标体系'],
        // ③ 排放源清单
        ['同步底座数据', '查看其他计算参数', '确认排放源清单'],
        // ④ 活动数据
        ['下一个待确认', '查看活动数据清单'],
        // ⑤ 排放因子
        ['下一个待确认', '查看因子来源说明'],
        // ⑥ 数据校验
        ['查看数据清单', '进入排放计算'],
        // ⑦ 排放计算
        ['查看指标参数计算', '导出计算结果', '进入排放分析'],
        // ⑧ 排放分析
        ['生成核算报告'],
        // ⑨ 排放报告
        ['数据溯源', '核查推荐', '专家复核', '导出核算报告']
      ]
      // 阶段6（数据校验）追加详细校验汇总
      let finalContent = summaries[idx]
      if (idx === 5) {
        const detail = this.buildValidationSummary()
        if (detail) finalContent += '\n\n---\n\n' + detail
      }
      this.messages.push({
        id: 'MSG-' + Date.now(),
        role: 'assistant',
        content: finalContent,
        timestamp: new Date().toLocaleTimeString('zh-CN'),
        suggestions: suggestionsMap[idx]
      })
      this.scrollToBottom()
    },    /** 发送用户消息（重新生成回复时复用） */
    sendUserMessage(text) {
      if (!text) return
      this.messages.push({
        id: 'MSG-' + Date.now(),
        role: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString('zh-CN')
      })
      this.scrollToBottom()
      this.processInput(text)
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
      // ==================== ⚠️ 重要说明 ====================
      // 此处为「前置拦截区」，只用于处理【视图切换】等副作用操作
      // ❌ 禁止在此 return { content, suggestions, nextStepIndex }
      //    因为本区 return 的对象不会被 push 到消息列表，用户看不到任何响应
      // ✅ 所有对话消息（含阶段跳转）必须写在 generateAIResponse() 中
      // ======================================================
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
    /** 生成 AI 响应（所有对话消息与阶段跳转的唯一出口）
     *  返回值结构：{ content, suggestions, followUpContent, followUpSuggestions, nextStepIndex, ... }
     *  注意：请勿在 processInput() 的前置拦截区 return 消息，那里 return 会被丢弃
     */
    generateAIResponse(input) {
      const lower = input.toLowerCase()

      // ===== 多轮澄清处理 =====
      if (this.isInClarification()) {
        // 逃生通道：阶段二完成指令优先于澄清流程（防止澄清状态卡死阶段推进）
        if (this.currentStepIndex === 1 && (lower.includes('确认边界') || lower.includes('进入核算模型') || lower.includes('进入排放源清单'))) {
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

      // ===== 阶段1 · 政策标准 (currentStepIndex === 0) =====
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
          content: `**阶段1 · 政策标准 - 完成**\n已确认适用标准：**${this.selectedStandard} 《${this.getStandardName(this.selectedStandard)}》**。标准解析完毕，核算要求已提取。\n\n**【阶段2 · 核算边界】**\n右侧已进入核算边界配置。\n\n**园区碳核算边界（依据附件4，只读）：**\n* **边界类型**：园区法定地理边界\n* **核算范围**：化石燃料燃烧 + 能源加工转换 + 净购入电力热力 + 工业过程\n* **气体范围**：仅二氧化碳（CO₂）\n* **计量单位**：万吨 CO₂（总量）/ tCO₂/tce（强度）\n\n> 说明：年综合能源消费量与单位能耗碳排放将在录入活动数据后自动计算，无需手动填写。\n\n**需要您确认的内容：**\n* 园区名称与面积\n* 核算周期（年度）\n* 排放因子库（可多选，按标准推荐）\n\n确认无误后点击底部「确认边界配置，进入排放源清单」。`,
          nextStepIndex: 1,
          suggestions: ['确认边界配置']
        }
      }

      // ===== 阶段2 · 核算边界子步骤 =====
      if (this.currentStepIndex === 1) {
        // 拦截"确认边界配置"——用户点击右侧确认按钮，直接完成全部边界配置并进入阶段3
        if (lower.includes('确认边界') || lower.includes('进入核算模型') || lower.includes('进入排放源清单')) {
          this.boundarySubStep = 5
          this.isModelBuilt = true
          this.modelStages = this.createEmptyModelStages()
          return {
            content: `**【阶段2 · 核算边界 - 完成】**\n\n配置总览：\n* **园区名称**：${(this.parkBasicInfo && this.parkBasicInfo.name) || '—'}\n* **园区面积**：${(this.parkBasicInfo && this.parkBasicInfo.area) || '—'} km²\n* **边界类型**：园区法定地理边界\n* **核算范围**：化石燃料燃烧 + 能源加工转换 + 净购入电力热力 + 工业过程\n* **气体范围**：仅二氧化碳（CO₂）\n* **计量单位**：万吨 CO₂\n* **核算周期**：${this.boundaryConfig.timeBoundary || '—'}\n\n所有边界参数已保存，进入下一阶段。`,
            followUpContent: `**【阶段3 · 排放源清单】**\n右侧已初始化四大法定分类的排放源框架（化石燃料燃烧 / 能源加工转换 / 净购入电力热力 / 工业过程）。\n\n请在对应分类下维护排放源与物料清单：\n* **类别 → 项目 → 输入/输出分组 → 物料** 四层结构\n* 能源加工转换、净购入电力热力支持**多组输入 / 输出**物料\n* 可在「其他计算参数清单」核对 16 项指标底账参数\n\n确认后启动多源数据收集。`,
            followUpSuggestions: ['同步底座数据', '确认排放源清单'],
            nextStepIndex: 2
          }
        }

        // 园区碳核算：阶段2 边界确认为单步（园区信息 + 边界 + 年度 + 因子库）
        if (this.boundarySubStep === 0) {
          // 确认边界配置 → 直接进入阶段3
          this.boundarySubStep = 1
          const info = this.parkBasicInfo || {}
          return {
            content: `**【阶段2 · 核算边界 - 完成】**\n\n**配置总览：**\n* **园区名称**：${info.name || '—'}\n* **园区面积**：${info.area || '—'} km²\n* **边界类型**：园区法定地理边界\n* **核算范围**：化石燃料燃烧 + 能源加工转换 + 净购入电力热力 + 工业过程\n* **气体范围**：仅二氧化碳（CO₂）\n* **计量单位**：万吨 CO₂\n* **核算周期**：${this.boundaryConfig.timeBoundary || '—'}\n\n边界参数已保存。\n\n> 说明：年综合能源消费量与单位能耗碳排放将在录入活动数据后自动计算，无需手动填写。`,
            suggestions: ['确认边界配置，进入排放源清单'],
            nextStepIndex: 2
          }
        }
      }

      // ===== 阶段3 · 查看其他计算参数 =====
      if (lower.includes('其他计算参数') || lower.includes('指标参数') || lower.includes('参数底账')) {
        if (this.stage3SubTab !== undefined) this.stage3SubTab = 'ledgers'
        const stats = this.indicatorParamStats || {}
        return {
          content: `**【其他计算参数清单】已切换**\n右侧已展示 6 项指标（1 核心 + 5 引导）共 **${stats.total || 16} 项**计算参数底账。\n\n参数按指标分组，来源渠道包括：\n* **系统汇总** — 由排放源核算结果自动归集（只读）\n* **底座数据识别** — 计量表直连\n* **材料识别** — 凭证 OCR 解析\n\n可在该页签核对参数值，确认无误后切回「碳排放源清单」。`,
          suggestions: ['确认排放源清单']
        }
      }

      // ===== 阶段3 · 排放源清单 (currentStepIndex === 2) =====
      if (lower.includes('同步底座') || lower.includes('底座数据') || lower.includes('上传全部') || lower.includes('上传工艺流程') || lower.includes('上传bom') || lower.includes('上传能源') || lower.includes('解析工艺') || lower.includes('工艺平衡') || lower.includes('物料平衡')) {
        // 先同步底座数据
        if (this.syncBaseDataSources) this.syncBaseDataSources()
        this.isModelBuilt = true
        this.modelStages = this.buildModelStages()
        return {
          content: `**【阶段3 · 排放源清单】其他计算参数已就绪**\n已成功同步底座数据与指标底账参数，**右侧已展示四大分类排放源清单与 16 项指标计算参数。**\n\n可直接在右侧清单中进行**增/删/改**：\n- 修改排放源名称、物料名称\n- 点击「+」新增排放源、输入/输出物料\n- 点击「✕」删除排放源或物料\n\n调整完成后，点击右侧「确认排放源清单，启动数据收集」进入下一阶段。`,
          suggestions: ['确认排放源清单'],
          nextStepIndex: 2
        }
      }

      // ===== 确认模型 / 重新确认（先校验模型结构，有问题抛出，无误才进下一阶段） =====
      if (lower.includes('确认模型') || lower.includes('确认排放源') || (lower.includes('排放源清单') && lower.includes('确认')) || lower.includes('数据收集') || lower.includes('启动多源') || lower.includes('重新确认') || lower.includes('已修正')) {
        // 第一次确认：进行模型校验
        if (!this.modelValidated) {
          const issues = this.validateModel()
          if (issues.length > 0) {
            // 有问题：列出问题，要求用户修正后重新确认
            let issueText = issues.map((iss, i) => `${i + 1}. ${iss}`).join('\n')
            return {
              content: `**【模型结构校验】检测到 ${issues.length} 个问题**\n\n${issueText}\n\n请在右侧列表中修正上述问题后，点击「已修正，重新确认」继续。`,
              suggestions: ['已修正，重新确认清单'],
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
              content: `**【阶段3 · 排放源清单 - 确认完成】**\n排放源清单与指标参数底账已确认，共归集 ${this.emissionSourceStats ? this.emissionSourceStats.total : 9} 个排放源、4 大法定分类、16 项指标计算参数。\n\n**【阶段4 · 活动数据采集】** 已启动多源数据拉取：\n* **底座数据识别** — 计量表直连数据已同步\n* **材料识别** — 上传凭证后 OCR 自动识别回填\n\n请逐项核对活动数据，或点击「下一个待确认」逐项确认。`,
              suggestions: ['下一个待确认', '查看活动数据清单', '确认数据，进入因子匹配'],
              nextStepIndex: 3,
              validationStep: 1
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
          content: `**【阶段4 · 活动数据 - 完成】**\n活动数据已锁定，所有实测数据已归档。`,
          followUpContent: `**【阶段5 · 排放因子匹配】**\n排放因子库已自动匹配各单元过程对应因子，右侧模型已显示因子绑定标签。\n\n请确认因子匹配结果：`,
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
          content: `**【阶段5 · 排放因子匹配 - 完成】**\n排放因子匹配已确认，所有单元过程均已绑定对应因子。`,
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
              content: this.buildPhase6Complete('全部确认'),
              followUpContent: this.buildPhase7Content(),
              followUpSuggestions: ['进入排放分析'],
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
            content: this.buildPhase6Complete('全部确认'),
            followUpContent: this.buildPhase7Content(),
            followUpSuggestions: ['进入排放分析'],
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
            content: this.buildPhase6Complete('部分跳过'),
            followUpContent: this.buildPhase7Content(),
            followUpSuggestions: ['进入排放分析'],
            nextStepIndex: 6,
            validationStep: 5
          }
        }
      }

      // ===== 阶段8 · 排放分析（构成、Top8、指标评价） =====
      if (lower.includes('进入排放分析') || (lower.includes('分析') && this.currentStepIndex === 6)) {
        this.analysisSubStep = 2
        this.analysisActiveTab = 'routine'
        this.uncertaintyParams.sampleSize = 10000
        this.uncertaintyParams.confidenceLevel = 95
        const analysisSummary = this.buildPhase8Content()
        return {
          content: analysisSummary,
          suggestions: ['生成核算报告'],
          nextStepIndex: 7
        }
      }

      // ===== 阶段8→9：生成核算报告，进入排放报告 =====
      if (lower.includes('生成核算报告') || lower.includes('生成报告')) {
        this.reportViewMode = 'report'
        this._reportChartsInitDone = false
        const rp = this.parkReportProfile || {}
        const st = this.parkIndicatorStats || {}
        return {
          content: `**【阶段9 · 排放报告】已生成完毕**\n系统已完成《零碳园区建设自评报告》的编制，共 **9 个章节**：\n\n① 园区基本情况\n② 零碳建设指标体系自评（${st.pass}/${st.total} 项达标）\n③ 碳排放核算结果（${rp.totalWan || '—'} 万吨CO₂）\n④ 零碳措施与成效\n⑤ 数据质量与可追溯性\n⑥ 达标差距分析\n⑦ 改进路径与时间表\n⑧ 自评结论\n⑨ 免责声明\n\n可导出 PDF / Word / 明细 Excel，或归档至园区碳资产库、申请专家复核。`,
          suggestions: ['数据溯源', '核查推荐', '专家复核'],
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

      if (lower.includes('专家复核') || lower.includes('申请复核') || lower.includes('第三方复核')) {
        return {
          content: `**【专家复核申请】已提交**\n系统已打包以下材料发送至认证核查机构：\n* 自评报告（8 章）\n* 核算明细与活动数据溯源\n* 全部佐证材料（凭证、台账、计量记录）\n\n推荐核查机构：\n* 中环联合（北京）认证中心（CQC）\n* 中国质量认证中心（CQC）\n* SGS 通标标准技术服务\n* 必维国际检验集团（BV）\n\n复核周期通常 2~4 周，最终出具第三方核查意见。`,
          suggestions: ['数据溯源', '核查推荐', '返回报告']
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
          content: `已切换回报告视图。您可继续查看零碳园区建设自评报告的各章节内容。`,
          suggestions: ['数据溯源', '核查推荐', '重新开始核算']
        }
      }

      if (lower.includes('重新开始') || lower.includes('重置')) {
        return {
          content: `核算会话已重置。目前处于 **【阶段1 · 政策标准】**。\n请确认使用右侧选中的核算标准：`,
          suggestions: ['确认使用当前标准'],
          nextStepIndex: 0
        }
      }

      return {
        content: `我已收到您的消息："${input}"\n\n你可以通过点击下方的建议按钮，按步骤推进零碳园区九阶段核算流程：`,
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
        content: this.buildPhase6Complete('全部确认'),
        timestamp: now(),
        suggestions: ['进入排放分析']
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
      const saved = localStorage.getItem('park_task_list')
      if (saved) this.taskList = JSON.parse(saved)
    } catch (e) { /* ignore */ }
  },
  beforeDestroy() {
    if (typeof window !== 'undefined' && this._onWinResize) {
      window.removeEventListener('resize', this._onWinResize)
      this._onWinResize = null
    }
  }
}
