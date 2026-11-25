import * as echarts from 'echarts'

export default {
  watch: {
    validationActiveTab(val) {
      if (val === 'quality' && this.currentStepIndex === 5) {
        this.$nextTick(() => this.initQualityCharts())
      }
    },
    currentStepIndex(val) {
      if (val === 5 && this.validationActiveTab === 'quality') {
        this.$nextTick(() => this.initQualityCharts())
      }
    }
  },
  // qaChartWatchAdded

  methods: {
    /** 阶段6：整体数据质量评估摘要（左侧播报） */
    buildQualitySummary() {
      const q = this.qualityAssessment || {}
      if (!q.total) {
        return '**【阶段六：数据校验】**\n\n正准备整体数据质量评估…'
      }

      const d = q.dqrDist || {}
      const bad = (d.D || 0) + (d.E || 0)
      const lines = []

      lines.push('**【阶段六：数据校验 - 整体质量评估】**')
      lines.push('')
      lines.push('已对 **' + q.total + '** 项活动数据进行全局质量评估。')
      lines.push('')
      lines.push('**① 加权质量分**')
      lines.push('· ' + q.weightedScore + ' / 5.0（' + q.weightedGrade + ' 级）')
      lines.push('')
      lines.push('**② DQR 分布**')
      lines.push('· A 级 ' + (d.A || 0) + ' 项 · B 级 ' + (d.B || 0) + ' 项 · C 级 ' + (d.C || 0) + ' 项')
      lines.push('· D 级 ' + (d.D || 0) + ' 项 · E 级 ' + (d.E || 0) + ' 项')
      lines.push('')
      lines.push('**③ 数据来源结构**')
      lines.push('· 一手数据（实测/台账）' + q.primaryCount + ' 项，占 ' + q.primaryRatio + '%')
      lines.push('· 一手排放量占比 ' + q.primaryEmissionRatio + '%')
      lines.push('')
      lines.push('**④ 覆盖率**')
      lines.push('· 排放源覆盖率 ' + q.sourceCoverage + '%')
      const cv = q.emissionCoverage
      const cvTag = cv >= 95 ? '✅ 充分' : cv >= 80 ? '⚠️ 偏低' : '⛔ 不足'
      lines.push('· 排放量覆盖率 ' + cv + '% ' + cvTag)
      lines.push('')

      if (bad > 0 || cv < 95) {
        lines.push('**⚠️ 需要关注：**')
        if (bad > 0) lines.push('· ' + bad + ' 项数据质量偏低（D/E 级），主要因因子采用缺省值')
        if (cv < 95) lines.push('· 排放量覆盖率不足 95%，建议补充数据')
        lines.push('')
      } else {
        lines.push('**✅ 数据质量整体良好，满足核算要求。**')
        lines.push('')
      }

      lines.push('详细评估结果请查看右侧「整体质量评估」页签，点击图表可查看解读。')

      return lines.join('\n')
    },

    /** 阶段6：点击质量评估图表 → 左侧推送解读 */
    onQaChartClick(type) {
      const q = this.qualityAssessment || {}
      if (!q.total) return
      let lines = []
      let title = ''

      if (type === 'score') {
        title = '加权质量分解读'
        lines.push('**当前得分：**' + q.weightedScore + ' / 5.0（' + q.weightedGrade + ' 级）')
        lines.push('')
        lines.push('**计算方式：**')
        lines.push('按排放量加权，排放量大的参数对结果影响更大')
        lines.push('加权分 = Σ(排放量 × 单项 DQR) / Σ(排放量)')
        lines.push('')
        lines.push('**分级标准：**')
        lines.push('· 1.0~1.8 → A 级（优秀）')
        lines.push('· 1.8~2.6 → B 级（良好）')
        lines.push('· 2.6~3.4 → C 级（合格）')
        lines.push('· 3.4~4.2 → D 级（偏低）')
        lines.push('· 4.2~5.0 → E 级（差）')
        lines.push('')
        const d = q.dqrDist || {}
        const bad = (d.D || 0) + (d.E || 0)
        if (bad > 0) {
          lines.push('**拉低分数的因素：**')
          lines.push('· ' + bad + ' 项数据质量偏低（D/E 级）')
          lines.push('· 主要因排放因子采用标准缺省值，未使用企业实测数据')
          lines.push('')
          lines.push('**如何提升：**')
          lines.push('· 将排放量占比大的因子升级为企业实测')
          lines.push('· 优先处理「低质量项」清单中的前 3 项')
        } else {
          lines.push('✅ 数据质量整体优秀，无低质量项拉低分数。')
        }
      } else if (type === 'dqr') {
        title = 'DQR 分布解读'
        const d = q.dqrDist || {}
        const total = q.total
        const pct = n => total ? ((n / total) * 100).toFixed(0) : 0
        lines.push('**当前 DQR 分布：**')
        lines.push('· A 级（优秀）' + (d.A || 0) + ' 项，占 ' + pct(d.A || 0) + '%')
        lines.push('· B 级（良好）' + (d.B || 0) + ' 项，占 ' + pct(d.B || 0) + '%')
        lines.push('· C 级（合格）' + (d.C || 0) + ' 项，占 ' + pct(d.C || 0) + '%')
        lines.push('· D 级（偏低）' + (d.D || 0) + ' 项，占 ' + pct(d.D || 0) + '%')
        lines.push('· E 级（差）' + (d.E || 0) + ' 项，占 ' + pct(d.E || 0) + '%')
        const bad = (d.D || 0) + (d.E || 0)
        lines.push('')
        if (bad > 0) {
          lines.push('⚠️ **有 ' + bad + ' 项数据质量偏低**，主要原因是排放因子采用标准缺省值，未使用企业实测数据。')
          lines.push('')
          lines.push('**改进建议：**')
          lines.push('· 优先将排放量占比大的排放源因子升级为企业实测')
          lines.push('· 关注燃煤、天然气等高排放项的数据来源')
        } else {
          lines.push('✅ 数据质量整体良好，无低质量项。')
        }
      } else if (type === 'source') {
        title = '数据来源结构解读'
        lines.push('**当前数据来源构成：**')
        lines.push('· 一手数据（实测/台账）' + q.primaryCount + ' 项，占 ' + q.primaryRatio + '%')
        lines.push('· 二手数据（缺省值）' + (q.total - q.primaryCount) + ' 项，占 ' + (100 - q.primaryRatio) + '%')
        lines.push('')
        lines.push('**一手排放量占比：**' + q.primaryEmissionRatio + '%')
        lines.push('')
        if (q.primaryRatio >= 60) {
          lines.push('✅ 一手数据占比较高，数据可追溯性良好。')
        } else if (q.primaryRatio >= 40) {
          lines.push('⚠️ 一手数据占比一般，建议提升实测数据比例。')
        } else {
          lines.push('⛔ 一手数据占比偏低，核算结果可信度受限。')
        }
        lines.push('')
        lines.push('**说明：**一手数据指企业实测、计量、结算单据；二手数据指数据库与标准缺省值。')
      } else if (type === 'coverage') {
        title = '覆盖率解读'
        lines.push('**当前覆盖率：**')
        lines.push('· 排放源覆盖率：' + q.sourceCoverage + '%')
        lines.push('· 排放量覆盖率：' + q.emissionCoverage + '%')
        lines.push('')
        const v = q.emissionCoverage
        if (v >= 95) {
          lines.push('✅ 排放量覆盖率充分（≥95%），数据覆盖完整，结果可信。')
        } else if (v >= 80) {
          lines.push('⚠️ 排放量覆盖率偏低（80%~95%），建议补充未覆盖的排放源数据。')
        } else {
          lines.push('⛔ 排放量覆盖率不足（<80%），核算结果可信度低，强烈建议补充数据。')
        }
        lines.push('')
        lines.push('**说明：**排放量覆盖率是指已填数据的估算排放量占全部排放源估算排放量的比例。')
      } else if (type === 'conf') {
        title = '因子匹配置信度解读'
        const list = q.confDist || []
        lines.push('**当前匹配分布：**')
        list.forEach(c => {
          lines.push('· ' + c.label + '：' + c.count + ' 项')
        })
        const low = (list.find(c => c.label === '兜底缺省') || {}).count || 0
        lines.push('')
        if (low > 0) {
          lines.push('⚠️ **' + low + ' 项因子命中「兜底缺省」**（置信度 0.82），说明未匹配到更精确的因子。')
          lines.push('')
          lines.push('**改进建议：**')
          lines.push('· 补充企业实测因子（置信度 1.00）')
          lines.push('· 完善物料规则表，提升规则表命中率')
        } else {
          lines.push('✅ 因子匹配质量良好，无兜底命中项。')
        }
        lines.push('')
        lines.push('**说明：**匹配链路为 P-1 企业实测 → P0 企业记忆 → 规则表 → 兜底缺省。')
      } else if (type === 'time') {
        title = '时效性解读'
        const ai = q.ageInfo || {}
        lines.push('**当前时效性：**')
        lines.push('· 活动数据年份：' + ai.dataYear + '（距基准年 ' + (ai.dataGap || 0) + ' 年）')
        lines.push('· 排放因子版本：' + ai.factorVersion + '（距基准年 ' + (ai.factorGap || 0) + ' 年）')
        lines.push('')
        if ((ai.dataGap || 0) <= 1) {
          lines.push('✅ 活动数据时效性良好。')
        } else {
          lines.push('⚠️ 活动数据年份较旧，建议更新为基准年数据。')
        }
        if ((ai.factorGap || 0) > 5) {
          lines.push('⚠️ 排放因子版本较旧（>' + 5 + ' 年），建议升级为最新版本。')
          lines.push('')
          lines.push('**建议：**考虑使用 IPCC 2019 修订版或最新国家排放因子库。')
        } else {
          lines.push('✅ 排放因子版本较新。')
        }
      }

      this.messages.push({
        role: 'assistant',
        content: '**【' + title + '】**\n\n' + lines.join('\n'),
        timestamp: new Date().toLocaleTimeString('zh-CN')
      })
      this.scrollToBottom()
    },

    /** 初始化阶段6 质量评估图表 */
    initQualityCharts() {
      this.$nextTick(() => {
        const q = this.qualityAssessment || {}
        if (!q.total) return

        // ① DQR 环形图
        const dqrEl = this.$refs.qaDqrChart
        if (dqrEl) {
          const c = echarts.init(dqrEl)
          const d = q.dqrDist || {}
          c.setOption({
            tooltip: { trigger: 'item', formatter: '{b}: {c} 项 ({d}%)' },
            legend: { bottom: 0, itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11, color: '#64748b' } },
            series: [{
              type: 'pie', radius: ['45%', '68%'], center: ['50%', '42%'],
              avoidLabelOverlap: true,
              label: { show: false },
              data: [
                { value: d.A || 0, name: 'A 级', itemStyle: { color: '#22c55e' } },
                { value: d.B || 0, name: 'B 级', itemStyle: { color: '#3b82f6' } },
                { value: d.C || 0, name: 'C 级', itemStyle: { color: '#f59e0b' } },
                { value: d.D || 0, name: 'D 级', itemStyle: { color: '#f97316' } },
                { value: d.E || 0, name: 'E 级', itemStyle: { color: '#ef4444' } }
              ].filter(x => x.value > 0)
            }]
          })
        }

        // ② 数据来源结构环形图
        const srcEl = this.$refs.qaSourceChart
        if (srcEl) {
          const c = echarts.init(srcEl)
          c.setOption({
            tooltip: { trigger: 'item', formatter: '{b}: {c} 项 ({d}%)' },
            legend: { bottom: 0, itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11, color: '#64748b' } },
            series: [{
              type: 'pie', radius: ['45%', '68%'], center: ['50%', '42%'],
              label: { show: false },
              data: [
                { value: q.primaryCount || 0, name: '一手数据', itemStyle: { color: '#0067fe' } },
                { value: (q.total - q.primaryCount) || 0, name: '二手数据', itemStyle: { color: '#cbd5e1' } }
              ].filter(x => x.value > 0)
            }]
          })
        }

        // ③ 覆盖率仪表盘
        const coverEl = this.$refs.qaCoverChart
        if (coverEl) {
          const c = echarts.init(coverEl)
          const val = q.emissionCoverage || 0
          c.setOption({
            series: [{
              type: 'gauge', startAngle: 200, endAngle: -20,
              min: 0, max: 100,
              radius: '92%', center: ['50%', '62%'],
              progress: { show: true, width: 14, itemStyle: { color: val >= 95 ? '#22c55e' : val >= 80 ? '#f59e0b' : '#ef4444' } },
              axisLine: { lineStyle: { width: 14, color: [[1, '#eef2f7']] } },
              axisTick: { show: false },
              splitLine: { show: false },
              axisLabel: { show: false },
              pointer: { show: false },
              detail: {
                valueAnimation: true,
                offsetCenter: [0, '-5%'],
                fontSize: 24, fontWeight: 700,
                color: val >= 95 ? '#15803d' : val >= 80 ? '#b45309' : '#b91c1c',
                formatter: '{value}%'
              },
              title: { offsetCenter: [0, '28%'], fontSize: 11, color: '#94a3b8' },
              data: [{ value: val, name: '排放量覆盖率' }]
            }]
          })
        }

        // ④ 置信度横向条形
        const confEl = this.$refs.qaConfChart
        if (confEl) {
          const c = echarts.init(confEl)
          const list = (q.confDist || []).slice().reverse()
          c.setOption({
            grid: { left: 78, right: 30, top: 12, bottom: 8 },
            xAxis: { type: 'value', show: false },
            yAxis: {
              type: 'category',
              data: list.map(x => x.label),
              axisLine: { show: false },
              axisTick: { show: false },
              axisLabel: { fontSize: 11, color: '#64748b' }
            },
            series: [{
              type: 'bar', barWidth: 12,
              data: list.map(x => ({ value: x.count, itemStyle: { color: x.color, borderRadius: 6 } })),
              label: { show: true, position: 'right', fontSize: 11, color: '#334155', formatter: '{c} 项' }
            }]
          })
        }

        // ⑤ 时效性柱状对比
        const timeEl = this.$refs.qaTimeChart
        if (timeEl) {
          const c = echarts.init(timeEl)
          const ai = q.ageInfo || {}
          c.setOption({
            grid: { left: 40, right: 20, top: 20, bottom: 28 },
            xAxis: {
              type: 'category',
              data: ['活动数据', '排放因子'],
              axisLine: { lineStyle: { color: '#e2e8f0' } },
              axisTick: { show: false },
              axisLabel: { fontSize: 11, color: '#64748b' }
            },
            yAxis: {
              type: 'value', name: '年差', nameTextStyle: { fontSize: 10, color: '#94a3b8' },
              splitLine: { lineStyle: { color: '#f1f5f9' } },
              axisLabel: { fontSize: 10, color: '#94a3b8' }
            },
            series: [{
              type: 'bar', barWidth: 26,
              data: [
                { value: ai.dataGap || 0, itemStyle: { color: '#22c55e', borderRadius: [4, 4, 0, 0] } },
                { value: ai.factorGap || 18, itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] } }
              ],
              label: { show: true, position: 'top', fontSize: 11, color: '#334155', formatter: '{c} 年' }
            }]
          })
        }
      })
    },
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
      const totals = { scope1: 0, scope2: 0, scope3: 0 }
      ;(this.modelStages || []).forEach(stage => {
        const sc = stage.scope || 'scope1'
        let sum = 0
        ;(stage.processes || []).forEach(proc => {
          if (proc.units && proc.units.length) {
            sum += proc.units.reduce((a, u) => a + (parseFloat(u.emission) || 0), 0)
          } else {
            sum += parseFloat(proc.emission) || 0
          }
        })
        totals[sc] = (totals[sc] || 0) + sum
      })
      const total = totals.scope1 + totals.scope2 + totals.scope3
      const fmt = (v) => this.formatEmission(v)
      return '**【阶段七：排放量计算 - 完成】**\n已按范围1/2/3 完成排放量计算：\n\n'
        + '* **范围1 · 直接排放**：' + fmt(totals.scope1) + ' tCO₂e\n'
        + '* **范围2 · 外购能源间接**：' + fmt(totals.scope2) + ' tCO₂e\n'
        + '* **范围3 · 价值链间接**：' + fmt(totals.scope3) + ' tCO₂e\n\n'
        + '**合计排放量**：**' + fmt(total) + ' tCO₂e**'
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
          content: `您好！我是小易，组织碳核算智能体。\n\n我将引导您对组织温室气体排放的九阶段智能核算。\n当前系统处于 **【阶段一：政策标准】**。\n\n当前已选中标准：**${code}**（《${this.getStandardName(code)}》）\n\n请确认使用该标准进入核算，或在右侧切换其他标准：`,
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
          content: `**【排放因子库选择 - 已确认】**\n${libSummary}\n\n---\n\n**【阶段二：核算边界】**\n共5个配置步骤，请逐步确认。\n\n**步骤 1/5：确认组织边界**\n请选择核算边界模式：\n* **运营控制权法**：范围1·固定源燃烧 + 范围1·移动源燃烧 + 范围1·工业过程与逸散 + 范围2·外购电力/热力 + 范围3·价值链间接\n* **财务控制权法**：范围1·固定源燃烧 + 范围1·移动源燃烧\n* **股权比例法**：仅范围1·移动源燃烧`,
          timestamp: new Date().toLocaleTimeString('zh-CN'),
          suggestions: ['运营控制权法', '财务控制权法', '股权比例法']
        })
        this.currentStepIndex = 1
        this.scrollToBottom()
        this.saveStageSnapshot()
      }, 1000)
    },
    initChatFlow() {
      // 任务加载后校正标准（避免沿用其他场景的标准 code）
      this.ensureStandardValid && this.ensureStandardValid()
      // 构建个性化欢迎消息（风机任务定制：五环节 LCA、排放强度目标）
      if (this.isWindTask()) {
        const windWelcome = `您好！我是小易，组织碳核算智能体。\n\n当前核算对象为 **' + (this.currentEnterprise || '本企业') + '**。\n\n当前处于 **【阶段一：政策标准】**：请在右侧「政策标准库」确认核算标准，系统将解析该标准的适用范围、生命周期阶段、边界量化规则与数据质量要求，作为后续核算的依据。\n\n当前已选中标准：**${this.selectedStandard}**`
        this.messages = [
          { id: 'MSG-001', role: 'assistant', content: windWelcome, timestamp: new Date().toLocaleTimeString('zh-CN'), suggestions: ['确认使用当前标准'] }
        ]
        return
      }
      // 构建通用个性化欢迎消息
      let welcomeContent = `您好！我是小易，组织碳核算智能体。\n\n我将引导您对组织温室气体排放的九阶段智能核算。\n当前系统处于 **【阶段一：政策标准】**。\n\n当前已选中标准：**${this.selectedStandard}**`

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
    /** 继续指定任务：恢复时间范围 / 标准 / 阶段 */
    continueTaskById(taskId) {
      const task = this.taskList.find(t => t.id === taskId)
      if (!task) {
        this.$message.warning('任务不存在或已被删除')
        return false
      }
      const step = Number(task.currentStepIndex) || 0
      this.pendingTaskId = null
      this.currentTaskId = task.id
      this.tlDialogStep = 'welcome'
      this.resetSession()
      // resetSession 后恢复任务上下文
      this.periodRange = task.periodText ? String(task.periodText).split(' ~ ') : []
      if (task.standard) this.selectedStandard = task.standard
      this.pageMode = 'task-active'
      this.initChatFlow()
      // 覆盖为「继续任务」提示（按当前阶段给出匹配的引导与按钮）
      const stepName = (this.phases && this.phases[step] && this.phases[step].name) || ('阶段' + (step + 1))
      const stageGuide = {
        0: {
          right: '右侧为**政策标准**与**标准内容解析**，请确认核算标准后进入核算边界。',
          suggests: ['确认使用当前标准']
        },
        1: {
          right: '右侧为**核算边界配置**（组织边界 / 核算范围 / 基准年 / 数据所属期 / 排放因子库），可自由调整；重要性阈值按标准自动确定。确认后进入核算模型。',
          suggests: ['确认边界配置']
        },
        2: {
          right: '右侧为**排放源清单**（范围1/2/3），可增删改排放源与活动数据结构，确认后进入活动数据采集。',
          suggests: ['确认清单，启动数据收集']
        },
        3: {
          right: '右侧为**活动数据采集**（排放源活动数据、数据来源），请核对或补充缺失项。',
          suggests: ['查看结果']
        },
        4: {
          right: '右侧为**排放因子匹配**（各排放源已绑定因子），请确认因子适用性。',
          suggests: ['查看结果']
        },
        5: {
          right: '右侧为**数据校验中心**（完整性 / 一致性 / 数据质量），请处理待确认与待补录项。',
          suggests: ['查看结果']
        },
        6: {
          right: '右侧为**排放量计算结果**（范围1+2+3 汇总及各排放源贡献），请核对计算结果。',
          suggests: ['查看排放贡献分析', '进入排放分析']
        },
        7: {
          right: '右侧为**排放分析**（范围构成 / 不确定性 / 因子敏感性），可切换页签查看。',
          suggests: ['进入排放报告']
        },
        8: {
          right: '右侧为**核算报告**（各章节内容），可在线编辑、导出或归档。',
          suggests: ['导出报告', '归档报告']
        }
      }
      const guide = stageGuide[step] || { right: '请在右侧查看本阶段内容。', suggests: [] }
      this.messages = [{
        id: 'MSG-' + Date.now(),
        role: 'assistant',
        content: `已继续任务：**${task.productName}**\n\n`
          + `* 时间范围：${task.periodText || '—'}\n`
          + `* 核算依据：${(typeof task.standard === 'object' && task.standard) ? (task.standard.name || task.standard.code || '—') : (task.standard || '—')}\n`
          + `* 当前阶段：**【${stepName}】**\n\n`
          + guide.right
          + `\n\n也可直接输入「下一步」推进当前阶段。`,
        timestamp: new Date().toLocaleTimeString('zh-CN'),
        suggestions: guide.suggests
      }]
      this.$nextTick(() => {
        this.currentStepIndex = step
      })
      return true
    },
    persistTaskList() {
      try { localStorage.setItem('org_task_list', JSON.stringify(this.taskList)) } catch (e) { /* ignore */ }
    },
    saveStageSnapshot() {
      if (!this.currentTaskId) return
      const task = this.taskList.find(t => t.id === this.currentTaskId)
      if (!task) return
      // 打包所有阶段状态数据到快照
      task.currentStepIndex = this.currentStepIndex
      task.updatedAt = new Date().toLocaleString('zh-CN')
      // 仅归档后才标记已完成（进入阶段9 不算完成）
      task.status = this.isReportArchived ? 'completed' : 'in-progress'
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
      // 旧快照可能缺 baseYear（新增字段），补齐默认值
      if (this.boundaryConfig && !this.boundaryConfig.baseYear) {
        this.boundaryConfig.baseYear = '2024'
      }
      this.isModelBuilt = snapshot.isModelBuilt || false
      this.validationStep = snapshot.validationStep || 0
      this.validationActiveTab = snapshot.validationActiveTab === 'activity' ? 'activity' : 'validation'
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
      // 清洗历史消息中的旧偏好文案（跨场景标准串扰，如 EU PEF）→ 统一为当前标准
      const curStd = this.selectedStandard || this.defaultStandardCode() || 'GHG Protocol'
      ;(this.messages || []).forEach(m => {
        if (m && m.content && m.content.indexOf('前任标准：') > -1) {
          m.content = m.content.replace(/前任标准：[^\n*）)]*/g, '前任标准：' + curStd)
        }
        if (m && m.content && m.content.indexOf('常用标准：') > -1 && m.content.indexOf('EU PEF') > -1) {
          m.content = m.content.replace(/常用标准：EU PEF/g, '常用标准：' + curStd)
        }
      })
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
        productName: inheritData ? inheritData.productName : (queryProductName || '组织碳排放核算'),
        standard: inheritData ? inheritData.standard : 'ISO 14064-1:2018',
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
    startNewTask() {
      // 手动触发：不立即创建任务，先进入阶段1（政策标准）确认时间范围与标准
      // 进入阶段2 时才正式落库（见 commitPendingTask）
      this.pendingTaskId = 'task-' + Date.now()
      this.currentTaskId = null
      this.periodRange = []
      this.tlDialogStep = 'welcome'
      this.resetSession()
      this.pageMode = 'task-active'
      this.initChatFlow()
    },
    createNewTask() {
      if (!this.newTaskProductName.trim()) {
        this.newTaskProductName = this.currentEnterprise || '本企业'
        return
      }
      const id = 'task-' + Date.now()
      const task = {
        id: id,
        productName: (this.currentEnterprise || this.newTaskProductName.trim()) + ' 组织碳排放核算',
        standard: this.newTaskStandard || 'GHG Protocol',
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
        this.$router.replace('/agent-center/apps/org-accounting')
      }
    },
    goBackToTaskList() {
      // 保存当前任务完整快照后返回工作台
      this.saveStageSnapshot()
      this.$router.replace('/agent-center/apps/org-accounting')
    },
    goBackToUpper() {
      this.saveStageSnapshot()
      this.$router.push('/agent-center/apps/org-accounting').catch(() => {})
    },
    showCmdHint() {
      this.messages.push({
        id: 'cmd-' + Date.now(),
        role: 'assistant',
        content: '💡 常用指令：<br/>• 点击「新建对话」开始核算本企业<br/>• "下一步" — 推进当前阶段<br/>• "查看结果" — 查看当前阶段输出<br/>• "重算" — 重新执行当前阶段计算<br/>• 右侧面板展示各阶段详细内容',
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
      this.selectedUnit = 'scope123'
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
        lifecycleScope: 'operational',
        unitType: 'scope123',
        unitDetail: '覆盖范围1（直接排放）、范围2（外购能源间接）、范围3（价值链其他间接）',
        baseYear: '2024',
        allocationRule: 'facility',
        cutoffThreshold: '1%/5%',
        cutoffItemThreshold: '1%',
        cutoffTotalThreshold: '5%',
        timeBoundary: '2025-01-01 - 2025-12-31'
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
      // 全部已处理，进入阶段7（排放量计算结果）
      this.currentStepIndex = 6
      this.validationStep = 5
      this.messages.push({
        id: 'MSG-' + Date.now(),
        role: 'assistant',
        content: '**【阶段6·数据校验】全部通过！**\n所有质检问题均已处理完毕，系统进入 **【阶段7·排放量计算】**。\n\n右侧展示排放总量及各排放源贡献树形表。',
        timestamp: new Date().toLocaleTimeString('zh-CN'),
        suggestions: ['查看排放贡献分析', '进入排放分析']
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
        '**【阶段2·核算边界】**\n配置组织边界、核算范围、数据所属期与排放因子库（重要性阈值按标准自动确定）。',
        '**【阶段3·核算模型】**\n右侧已初始化排放源清单框架（范围1/2/3 五类），请录入或上传排放源与活动数据结构，系统将自动匹配排放因子。',
        '**【阶段4·活动数据】**\n系统已并发拉取排放源活动数据（燃料消耗、外购电量、原料投入等），右侧清单已显示实测数据值。',
        '**【阶段5·排放因子】**\n右侧已自动绑定排放因子库中的对应因子，可查看各排放源的因子绑定情况。',
        '',
        '**【阶段7·排放计算】**\n右侧展示排放总量（范围1+2+3）及各排放源贡献树形表。',
        '**【阶段8·排放分析】**\n进行范围构成分析、不确定性分析和排放因子敏感性分析。',
        '**【阶段9·排放报告】**\n查看并导出组织温室气体排放核算报告，可发布为SOP或提交第三方认证。'
      ]
      var suggestionsMap = [
        this.isWindTask() ? ['选择 GHG Protocol 标准', '选择 ISO 14064-1 标准'] : ['选择 GHG Protocol 标准', '选择 ISO 14064-1 标准'],
        ['确认边界配置'],
        ['确认清单，启动数据收集', '确认清单，启动数据收集'],
        ['确认数据，进入因子匹配'],
        ['确认因子，进入数据校验'],
        ['启动数据校验'],
        ['查看排放贡献分析', '进入排放分析'],
        ['导出排放报告'],
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
              const _prevStep = this.currentStepIndex
              this.currentStepIndex = response.nextStepIndex
              this.onStepChanged(_prevStep, this.currentStepIndex)
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
            const _prevStep2 = this.currentStepIndex
            this.currentStepIndex = response.nextStepIndex
            this.onStepChanged(_prevStep2, this.currentStepIndex)
          }
          if (response.validationStep !== undefined) {
            this.validationStep = response.validationStep
          }
          this.scrollToBottom()
          this.saveStageSnapshot()
        }
      }, 1000)
    },
    /** 阶段3 开场引导：行业画像 + 清单确认指引 */
    buildStage3Guide() {
      const ent = { name: this.currentEnterprise, industry: this.currentIndustry }
      const hints = this.getIndustryHints ? this.getIndustryHints() : null
      let hintBlock = ''
      if (hints) {
        const fmt = (list) => list.map(h => '  · **' + h.name + '** — ' + h.why).join('\n')
        hintBlock = '\n\n根据您的企业（**' + (ent.name || '本企业') + ' · ' + (ent.industry || '') + '**），建议重点关注：\n'
          + '\n**范围1 直接排放**\n' + fmt(hints.scope1)
          + '\n\n**范围2 外购能源间接**\n' + fmt(hints.scope2)
          + '\n\n**范围3 价值链间接**\n' + fmt(hints.scope3)
      }
      return '**【阶段三：排放源清单】**\n核算清单是本次核算的**基础**，直接决定后续活动数据收集与排放计算的完整性。'
        + hintBlock
        + '\n\n**右侧清单已按范围1/2/3 分类**，请按以下方式确认：\n'
        + '* ✓ **保留**：本企业适用的排放源\n'
        + '* ✗ **删除**：不适用的（如无燃煤锅炉）\n'
        + '* ＋ **补充**：遗漏的（下拉选择或输入自定义名称）\n'
        + '* 📍 **细化**：为每个排放源添加**排放单元**（如"1号涂装线""2号锅炉"）\n\n'
        + '需要我按大类**逐项引导确认**吗？\n\n'
        + '> 提示：排放单元越细，后续活动数据归集越精确；如暂不细分，可按排放源汇总填报。'
    },

    /** 点击不确定性 KPI 卡片：输出该指标的详细解读（不推进阶段） */
    explainUncKpi(key) {
      const total = this.totalCarbonEmission || 0
      const unc = this.uncertaintyRangeText || '±0%'
      const ci = this.confidenceIntervalText || '[ — ]'
      const sigma = Math.round(total * this.calcTotalRelativeUncertainty())
      const top = (this.uncParamContrib && this.uncParamContrib[0]) || { name: '—', sharePct: '0' }
      let content = ''
      if (key === 'unc') {
        content = `**📊 指标解读：综合不确定度 ${unc}**\n\n**它是什么**\n表示核算结果可能偏离真实排放量的相对幅度，是不确定性分析的核心结论。\n\n**怎么算出来的**\n每个排放源的活动数据按 ±5%、排放因子按 ±3% 取典型不确定度，经误差传播公式独立合成：\n\nσ_total = √( Σ(排放量ᵢ × 5%)² + Σ(排放量ᵢ × 3%)² ) ÷ 总量\n\n**怎么判断好坏**\n* **±5% 以内**：优秀，数据以实测为主\n* **±10% 以内**：可接受，满足 GHG Protocol 要求\n* **超过 ±10%**：建议补强高占比排放源的数据质量\n\n**当前结果**\n${unc} 处于优秀水平，最大方差贡献来自「${top.name}」（占 ${top.sharePct}%）。\n\n💡 可以继续问我，例如："为什么${top.name}的贡献最大？"`
      } else if (key === 'ci') {
        content = `**📊 指标解读：置信区间 ${ci} tCO₂e**\n\n**它是什么**\n在 95% 置信水平下，真实排放量有 95% 的概率落在该区间内（μ ± 1.96σ）。\n\n**怎么算出来的**\n区间下限 = ${Math.round(total - 1.96 * sigma).toLocaleString()}（μ - 1.96σ）\n区间上限 = ${Math.round(total + 1.96 * sigma).toLocaleString()}（μ + 1.96σ）\n\n**怎么使用**\n* **对外披露**：建议以"区间 + 置信水平"的形式说明结果可信范围\n* **第三方核查**：核查员会评估区间宽度是否与数据质量相称\n* **减排目标**：基线设定应考虑区间下限，避免高估减排量\n\n**当前结果**\n区间宽度约 ±${unc}，与数据质量水平相称。\n\n💡 可以继续问我，例如："对外披露时应该怎么写？"`
      } else if (key === 'total') {
        content = `**📊 指标解读：排放总量 ${this.formatEmission(total)} tCO₂e**\n\n**它是什么**\n所有排放单元按「活动数据 × 排放因子 × 氧化率」逐项计算后，按范围汇总的结果（范围1 + 范围2 + 范围3）。\n\n**在不确定性分析中的角色**\n它是不确定性分布的中心值（均值 μ），综合不确定度和置信区间都围绕它展开。\n\n**数据一致性**\n该数值与阶段七「排放量计算」、阶段九「排放报告」完全同源，全流程可追溯。\n\n💡 可以继续问我，例如："各范围的占比是多少？"`
      } else if (key === 'sigma') {
        content = `**📊 指标解读：标准差 σ = ${sigma.toLocaleString()} tCO₂e**\n\n**它是什么**\n衡量核算结果围绕均值 μ 的离散程度：σ = μ × 综合不确定度 = ${this.formatEmission(total)} × ${unc.replace('±', '')}。\n\n**怎么理解**\n* σ 越小 → 结果越集中、越可信\n* σ 突然增大 → 通常提示某个**高占比排放源**的数据质量下降\n* 置信区间宽度 = ±1.96σ，σ 直接决定区间宽窄\n\n**当前结果**\nσ 相对均值占比 ${unc}，处于优秀水平。\n\n💡 可以继续问我，例如："如果净购入电力的数据质量提升，σ 会变成多少？"`
      }
      if (!content) return
      this.messages.push({
        id: 'MSG-' + Date.now(),
        role: 'assistant',
        content: content,
        timestamp: new Date().toLocaleTimeString('zh-CN'),
        suggestions: []
      })
      this.scrollToBottom()
    },
        generateAIResponse(input) {
      const lower = input.toLowerCase()

        // ===== 从台账重新匹配 =====
        if (lower.includes('从台账') || lower.includes('重新匹配') || lower.includes('台账同步')) {
          const ok = this.syncModelStagesFromLedger()
          const unitCount = this.getEmissionSourceList().length
          if (ok) {
            return {
              content: `**【台账重新匹配】已完成**\n\n已重新读取资源台账（org_resources_v3），清单已刷新：\n* **排放单元**：${unitCount} 个\n* **排放源**：${(this.modelStages || []).reduce((a, s) => a + (s.processes || []).length, 0)} 个\n* **大类**：${(this.modelStages || []).length} 个\n\n如有遗漏，可**上传材料识别**或**手动补充**；确认无误后启动数据收集。`,
              suggestions: ['上传材料识别', '确认清单，启动数据收集']
            }
          }
          return {
            content: '**【台账重新匹配】** 资源台账中未找到排放源设备。\n\n请先在「资源台账」中维护设备设施（标注排放源属性），或**上传材料识别**。',
            suggestions: ['上传材料识别']
          }
        }

        // ===== 参数详情（基于当前选中参数）=====
        if (lower.includes('参数详情') || lower.includes('数据溯源') || lower.includes('查看溯源') || lower.includes('追溯')) {
          const sp = this.selectedParam
          if (!sp) {
            return {
              content: '请先在右侧**点击某个参数行**（如「活动数据」「排放因子」），再查看数据溯源。',
              suggestions: []
            }
          }
          this.openTrace(sp.proc, sp.unit, sp.paramType, sp.catTitle)
          return {
            content: `已打开 **${sp.proc.name}**（${(sp.unit && sp.unit.name) || '按排放源汇总'}）的**参数详情**。\n\n可查看：参数信息、数据质量、匹配策略、校验关联、历史趋势、佐证材料、修改记录。`,
            suggestions: ['上传佐证']
          }
        }

        // ===== 材料识别（任意阶段可用）=====
        if (lower.includes('上传材料') || lower.includes('材料识别')) {
          this.materialDialog = true
          return {
            content: `**【材料识别】已打开上传窗口**\n\n请上传以下材料，我会自动识别排放源并加入右侧清单：\n* **设备清单**（Excel）：锅炉、窑炉、车辆等设备\n* **能源台账**（Excel）：电、气、水、热消耗记录\n* **能源审计报告**（PDF）：含排放源与用能分析\n* **设备铭牌/照片**（图片）：识别燃料类型与功率\n\n识别结果会以**勾选列表**展示，确认后自动归入对应范围与大类。`,
            suggestions: ['取消上传']
          }
        }

      // ===== 通用：下一步 / 继续 =====
      if (/^下一步$|^继续$|继续下一步|^推进$/.test(lower.trim())) {
        const step = this.currentStepIndex || 0
        const phaseName = (this.phases && this.phases[step] && this.phases[step].name) || ('阶段' + (step + 1))
        // 阶段1：核算依据 → 确认标准，进入阶段2
        if (step === 0) {
          this.boundarySubStep = 0
          return {
            content: `**阶段一：政策标准 - 完成**\n已确认适用标准：**${this.selectedStandard} 《${this.getStandardName(this.selectedStandard)}》**。标准解析完毕，政策条款与核算要求已提取。\n\n**【阶段二：核算边界】**\n右侧已进入核算边界配置（组织边界 / 核算范围 / 基准年 / 数据所属期 / 排放因子库，均可直接调整）。\n\n本次核算的主体与范围（请确认）：\n* **核算主体**：${this.currentEnterprise}\n* **核算标准**：${this.selectedStandard}\n\n请依次确认：\n* 组织边界（运营控制权法 / 财务控制权法 / 股权比例法）\n* 核算范围（范围1+2 / 范围1+2+3）\n\n数据所属期可在此调整，重要性阈值按标准自动确定。\n\n同时选择 **排放因子库**（可多选，按标准推荐）。确认无误后点击底部「确认边界配置，进入核算模型」。`,
            nextStepIndex: 1,
            suggestions: ['确认边界配置']
          }
        }
        // 阶段2：核算边界
        if (step === 1) {
          return {
            content: `**【阶段2·核算边界】**\n当前配置：\n* **组织边界**：${this.lifecycleScopeLabel}\n* **核算范围**：${this.unitTypeLabel}\n* **重要性阈值**：${this.boundaryConfig.cutoffThreshold}\n* **数据所属期**：${this.boundaryConfig.timeBoundary}\n\n确认无误后，点击下方「确认边界配置」进入核算模型。`,
            suggestions: ['确认边界配置'],
            nextStepIndex: 1
          }
        }
        // 阶段3：核算模型
        if (step === 2) {
          return {
            content: `**【阶段3·核算模型】**\n右侧已按范围1/2/3 构建排放源清单。\n\n请确认排放源与活动数据结构，确认无误后进入活动数据采集。`,
            suggestions: ['确认清单，启动数据收集'],
            nextStepIndex: 2
          }
        }
        // 阶段4~6：数据相关
        if (step >= 3 && step <= 5) {
          return {
            content: `**【${phaseName}】**\n请在右侧查看并确认本阶段内容，处理完待办项后继续。`,
            suggestions: ['查看结果'],
            nextStepIndex: step
          }
        }
        // 阶段7~9：计算/分析/报告
        if (step >= 6) {
          return {
            content: `**【${phaseName}】**\n请在右侧查看本阶段产出。`,
            suggestions: ['查看结果'],
            nextStepIndex: step
          }
        }
        return {
          content: `**【${phaseName}】**\n请在右侧查看当前阶段内容。`,
          suggestions: ['查看结果'],
          nextStepIndex: step
        }
      }

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
          content: `**阶段一：政策标准 - 完成**\n已确认适用标准：**${this.selectedStandard} 《${this.getStandardName(this.selectedStandard)}》**。标准解析完毕，政策条款与核算要求已提取。\n\n**【阶段二：核算边界】**\n右侧已进入核算边界配置（组织边界 / 核算范围 / 基准年 / 数据所属期 / 排放因子库，均可直接调整）。\n\n本次核算的主体与范围（请确认）：\n* **核算主体**：${this.currentEnterprise}\n* **核算标准**：${this.selectedStandard}\n\n请依次确认：\n* 组织边界（运营控制权法 / 财务控制权法 / 股权比例法）\n* 核算范围（范围1+2 / 范围1+2+3）\n\n数据所属期可在此调整，重要性阈值按标准自动确定。\n\n同时选择 **排放因子库**（可多选，按标准推荐）。确认无误后点击底部「确认边界配置，进入核算模型」。`,
          nextStepIndex: 1,
          suggestions: ['确认边界配置']
        }
      }

      // ===== 阶段二子步骤 =====
      if (this.currentStepIndex === 1) {
        // 拦截"确认边界配置"——用户点击右侧确认按钮，直接完成全部边界配置并进入阶段3
        if (lower.includes('确认边界') || lower.includes('进入核算模型')) {
            const boundaryError = this.validateBoundaryBeforeNextStage()
            if (boundaryError) {
              return {
                content: '**无法进入下一阶段**\n\n' + boundaryError,
                suggestions: ['确认边界配置']
              }
            }
          this.boundarySubStep = 5
          this.isModelBuilt = true
          // 优先从资源台账匹配排放清单，失败回退标准模板
          const synced2 = this.syncModelStagesFromLedger()
          if (!synced2) this.modelStages = this.createInitialModelStages()
          return {
            content: `**【阶段二：核算边界 - 完成】**\n配置总览：\n* **组织边界**：${this.lifecycleScopeLabel}
* **核算范围**：${this.unitTypeLabel} — ${this.boundaryConfig.unitDetail}
\n所有边界参数已保存。`,
            followUpContent: this.buildStage3Guide(),
            followUpSuggestions: ['从台账重新匹配', '上传材料识别', '确认清单，启动数据收集'],
            nextStepIndex: 2
          }
        }

        if (this.boundarySubStep === 0) {
          let boundary = 'operational'
          if (lower.includes('财务控制')) boundary = 'financial'
          else if (lower.includes('股权')) boundary = 'equity'
          this.boundaryConfig.lifecycleScope = boundary
          this.boundarySubStep = 1
          return {
            content: `**【阶段二 - 步骤 1/2】组织边界**\n已确认：**${this.lifecycleScopeLabel}**\n\n请选择本次核算的范围口径：`,
            suggestions: ['范围1+2', '范围1+2+3'],
            nextStepIndex: 1
          }
        }

        if (this.boundarySubStep === 1) {
          let scope = 'scope123'
          if ((lower.includes('范围1+2') || lower.includes('范围1和2')) && !lower.includes('3')) scope = 'scope12'
          this.boundaryConfig.unitType = scope
          this.selectedUnit = scope
          if (!this.boundaryConfig.unitDetail || this.boundaryConfig.unitDetail.indexOf('覆盖') === 0) {
            this.boundaryConfig.unitDetail = scope === 'scope12'
              ? '覆盖范围1（直接排放）、范围2（外购能源间接），范围3 暂不纳入'
              : '覆盖范围1（直接排放）、范围2（外购能源间接）、范围3（价值链其他间接）'
          }
          this.boundarySubStep = 2
          this.isModelBuilt = true
          // 优先从资源台账匹配排放清单，失败回退标准模板
          const synced = this.syncModelStagesFromLedger()
          if (!synced) this.modelStages = this.createInitialModelStages()
          return {
            content: `**【阶段二：核算边界 - 完成】**\n配置总览：\n* **组织边界**：${this.lifecycleScopeLabel}\n* **核算范围**：${this.unitTypeLabel} — ${this.boundaryConfig.unitDetail}\n* **重要性阈值**：${this.boundaryConfig.cutoffItemThreshold} / ${this.boundaryConfig.cutoffTotalThreshold}（按 ${this.selectedStandard} 规定）\n* **数据所属期**：${this.boundaryConfig.timeBoundary}\n\n下一步进入核算模型（排放源 → 活动数据 → 排放因子）。`,
            followUpContent: this.buildStage3Guide(),
            followUpSuggestions: ['从台账重新匹配', '上传材料识别', '确认清单，启动数据收集'],
            nextStepIndex: 2
          }
        }
      }

      // ===== 阶段三：材料上传与模型构建 (currentStepIndex === 2) =====
      if (lower.includes('上传全部') || lower.includes('上传工艺流程') || lower.includes('上传bom') || lower.includes('上传能源') || lower.includes('解析工艺') || lower.includes('工艺平衡') || lower.includes('物料平衡')) {
        this.isModelBuilt = true
        this.modelStages = this.buildModelStages()
        return {
          content: `**【阶段三：排放源清单】排放源清单已就绪**\n已解析排放源与活动数据结构，**右侧已按范围1/2/3 构建排放源清单**！\n\n在启动活动数据采集前，您可以直接在右侧对排放源进行**增删改**（排放源名称、活动数据、排放因子）。`,
          suggestions: ['确认清单，启动数据收集'],
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
            // 无问题：标记已校验 → 后台自动完成阶段4、5 → 直接进入阶段6（数据校验）
            this.modelValidated = true
            this.validationItems.forEach(item => {
              item.status = item.type === 'completeness' ? 'missing' : 'pending'
              item.statusLabel = item.type === 'completeness' ? '待补充' : '待确认'
            })
            return {
              content: `**【阶段三：排放源清单 - 完成】**\n排放源清单结构校验通过！\n\n**【阶段四：活动数据 - 自动完成】**\n已从能源台账 / 采购系统 / 计量点并发拉取各排放源活动数据，数值、原始值与数据来源均已自动关联。\n\n**【阶段五：排放因子 - 自动完成】**\n系统已按 P-1 企业实测 → P0 企业记忆 → 规则表 → 兜底缺省 四级链路自动匹配各排放源因子，匹配置信度已记录。\n\n**【阶段六：数据校验】**\n已完成完整性、一致性、DQR 多重校验，以下为校验结果：`,
              followUpContent: this.buildValidationSummary(),
              followUpSuggestions: ['全部使用建议值确认', '暂不处理，直接计算'],
              nextStepIndex: 5,
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
          content: `**【阶段四：活动数据 - 完成】**\n\n**已确认内容：**\n· 活动数据（AD）逐项核对完成\n· 原始值与单位换算已确认\n· 数据来源与佐证材料已关联\n\n活动数据已锁定，将作为排放计算的输入依据。`,
          followUpContent: `**【阶段五：排放因子】**\n\n系统已按**四级匹配链路**自动匹配各排放源对应的排放因子：\n\n**匹配链路：** P-1 企业实测 → P0 企业记忆 → 规则表 → 兜底缺省\n\n右侧清单已显示因子绑定标签与匹配置信度。请逐项确认因子匹配结果：\n\n> 提示：命中「兜底缺省」的因子（置信度 0.82）建议后续升级为企业实测或行业数据。`,
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
          content: `**【阶段五：排放因子 - 完成】**\n\n**已确认内容：**\n· 排放因子（EF）逐项匹配完成\n· 因子来源与权威池已核实\n· 匹配置信度已记录\n\n所有排放源均已绑定对应因子。`,
          followUpContent: this.buildQualitySummary(),
          followUpSuggestions: ['确认质量评估，进入排放分析'],
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
            content: `**【阶段六：数据校验 - 全部完成】**\n${this.validationItems.length}项校验均已处理通过：\n${this.validationItems.map(v => `* ✅ ${this.valTypeName(v.type)}：【${v.stage}·${v.process}】${v.ioName} ${v.value}${v.unit ? ' ' + v.unit : ''} 已确认`).join('\n')}\n\n数据质量满足核算要求。`,
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
            content: `**【阶段六：数据校验 - 已完成】**\n已跳过缺失项，确认项已处理：\n${this.validationItems.map(v => `* ${v.status === 'skipped' ? '⏭️' : '✅'} ${this.valTypeName(v.type)}：【${v.stage}·${v.process}】${v.ioName}${v.status === 'skipped' ? ' 暂未补充（已跳过）' : ` ${v.value}${v.unit ? ' ' + v.unit : ''} 已确认`}`).join('\n')}\n\n注意：跳过的缺失项可能影响核算精度。`,
            followUpContent: this.buildPhase7Content(),
            followUpSuggestions: ['进入排放分析'],
            nextStepIndex: 6,
            validationStep: 5
          }
        }
      }

      // ===== 阶段八：排放分析（一次性展示常规+不确定性+敏感性三项分析） =====
      if (lower.includes('进入排放分析') || (lower.includes('分析') && this.currentStepIndex === 6)) {
        this.analysisSubStep = 2
        this.analysisActiveTab = 'routine'
        this.uncertaintyParams.sampleSize = 10000
        this.uncertaintyParams.confidenceLevel = 95
        // 汽配组织碳核算：动态生成分析摘要
        const _anTotal = this.formatEmission(this.totalCarbonEmission)
        const _anStages = this.emissionTreeData || []
        const _anS1 = _anStages[0] ? _anStages[0].emission : 0
        const _anS2 = _anStages[1] ? _anStages[1].emission : 0
        const _anS3 = _anStages[2] ? _anStages[2].emission : 0
        const _anT = this.totalCarbonEmission || 1
        const _anPct = (v) => (v / _anT * 100).toFixed(1)
        const _anProcs = []
        ;(this.modelStages || []).forEach(st => {
          ;(st.processes || []).forEach(p => {
            const em = this.procEmission(p)
            if (em > 0) _anProcs.push({ name: p.name, emission: em })
          })
        })
        _anProcs.sort((a, b) => b.emission - a.emission)
        const _anP1 = _anProcs[0] || { name: '—', emission: 0 }
        const _anP2 = _anProcs[1] || { name: '—', emission: 0 }
        const _anP3 = _anProcs[2] || { name: '—', emission: 0 }
        const _anSens = this.sensitivityImpactData || []
        const _anSc1 = _anSens[0] || { name: '—', coeff: 0 }
        const _anSc2 = _anSens[1] || { name: '—', coeff: 0 }
        const _anSc3 = _anSens[2] || { name: '—', coeff: 0 }
        const _anUnc = this.uncertaintyRangeText
        const _anCi = this.confidenceIntervalText

        const analysisSummary = `**【阶段八：排放分析 - 全部完成】**\n\n系统已一次性完成三项分析，右侧可通过页签切换查看：\n\n**❶ 常规分析**（图表与指标）\n* **排放总量**：**${_anTotal} tCO₂e**\n* **范围构成**：范围1 占 ${_anPct(_anS1)}%、范围2 占 ${_anPct(_anS2)}%、范围3 占 ${_anPct(_anS3)}%\n* **同比变化**：较上年同期**下降 2.1%**\n* **环比变化**：较上期**下降 0.8%**\n* **首要排放源**：${_anP1.name}（${this.formatEmission(_anP1.emission)} tCO₂e，占 ${_anPct(_anP1.emission)}%）\n* **次大排放源**：${_anP2.name}（占 ${_anPct(_anP2.emission)}%）、${_anP3.name}（占 ${_anPct(_anP3.emission)}%）\n\n**❷ 不确定性分析**（误差传播法 · IPCC 方法1）\n* **综合不确定度**：**${_anUnc}**（AD ±5%、EF ±3%，95% 置信度）\n* **置信区间**：**${_anCi} tCO₂e**\n* **说明**：满足 GHG Protocol 对组织层面不确定性量化的要求，结果可直接用于对外披露与第三方核查。\n\n**❸ 敏感性分析**（Tornado 敏感度排行）\n* **最敏感排放源**：${_anSc1.name}（敏感度 **+${Number(_anSc1.coeff).toFixed(3)}**，正相关）\n* **次敏感**：${_anSc2.name}（**+${Number(_anSc2.coeff).toFixed(3)}**）、${_anSc3.name}（**+${Number(_anSc3.coeff).toFixed(3)}**）\n* **减排优先级**：优先优化 ${_anP1.name} 与 ${_anP2.name} 的数据质量与替代方案。\n\n三项分析均已完成，可导出碳排放核算报告：`

        return {
          content: analysisSummary,
          suggestions: ['导出排放报告'],
          nextStepIndex: 7
        }
      }

      if (lower.includes('报告') || lower.includes('导出')) {
        const filePrefix = this.isWindTask() ? '华北风力发电有限公司' : '小米汽车'
        return {
          content: `**【阶段九：排放报告】已编写导出完毕**\n系统已生成以下审计就绪成果：\n* ${filePrefix}_碳排放审计报告.pdf\n* ${filePrefix}_碳排放核算明细.xlsx\n\n本次核算摘要已归档至长期记忆中。\n\n💡 您还可进一步：\n* **数据溯源** — 查看每项活动数据与排放因子的来源追溯记录\n* **核查推荐** — 查看内置第三方核查机构名片，获取独立验证建议`,
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
          content: `已切换回报告视图。您可继续查看碳排放核算报告的各章节内容。`,
          suggestions: ['数据溯源', '核查推荐', '导出排放报告', '重新开始核算']
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
          content: `我已收到您的消息："${input}"\n\n当前处于 **【${(this.phases[this.currentStepIndex] || {}).name || '核算'}】**，可在右侧查看详细内容，或使用下方指令：`,
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
        4: '数据质量指标校验'
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
      return { completeness: '完整性校验', consistency: '一致性校验', dqr: '数据质量校验' }[type] || '数据校验'
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
          tooltip: { trigger: 'item', formatter: (p) => `${p.name}<br/>${p.value} tCO₂e（${p.percent}%）` },
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

      // 2. 数据质量雷达图
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
        const mcSigma = mcTotal * this.calcTotalRelativeUncertainty()
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
              return tip || ('均值: ' + muStr + ' tCO₂e')
            }
          },
          grid: { left: 55, right: 20, top: 15, bottom: 35 },
          xAxis: {
            type: 'category',
            data: bins.map(function(b) { return b.label }),
            axisLabel: { fontSize: 9, interval: 2, color: 'rgba(0,0,0,0.45)' },
            name: 'tCO₂e',
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
        var mcSigma = mcTotal * this.calcTotalRelativeUncertainty()
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
            name: 'tCO₂e',
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
      const saved = localStorage.getItem('org_task_list')
      if (saved) {
        const arr = JSON.parse(saved)
        // 过滤历史遗留的无时间范围任务（不符合"创建任务必须明确时间范围"规则）
        this.taskList = Array.isArray(arr) ? arr.filter(t => t && t.periodText) : []
        if (this.taskList.length !== (arr || []).length) this.persistTaskList()
      }
    } catch (e) { /* ignore */ }
  },
  beforeDestroy() {
    if (typeof window !== 'undefined' && this._onWinResize) {
      window.removeEventListener('resize', this._onWinResize)
      this._onWinResize = null
    }
  }
}
