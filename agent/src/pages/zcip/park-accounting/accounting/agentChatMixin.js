/**
 * 园区碳核算智能体 — 对话与图表Mixin
 * 依据文件：
 *   1. 国家发展改革委等《关于开展零碳园区建设的通知》（发改环资〔2025〕910号）
 *   2. 附件4《零碳园区碳排放核算方法（试行）》
 *   3. 附件3《国家级零碳园区建设指标体系（试行）》
 */
import * as echarts from 'echarts'

export default {
  data() {
    return {
      _trendChart: null,
      _pieChart: null,
      _catChart: null
    }
  },

  methods: {
    /** 返回工作台（任务列表） */
    goBackHome() {
      this.$router.push('/park-accounting/workspace').catch(() => {})
    },

    handleCycleSend() {
      const q = (this.inputText || '').trim()
      if (!q) return
      this.messages.push({
        id: 'MSG-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        role: 'user',
        content: q,
        timestamp: new Date().toLocaleTimeString('zh-CN')
      })
      this.inputText = ''
      this.isTyping = true
      this.scrollToBottom()

      if (this.handleCommonIntent(q)) return

      setTimeout(() => {
        this.isTyping = false
        const reply = this.generateParkReply(q)
        this._push(reply.content, reply.suggestions || ['查看数据清单', '生成核算报告', '指标对标诊断'])
        this.scrollToBottom()
      }, 600)
    },

    handleCycleSuggestion(text) {
      if (text === '补充缺失数据') { this.showMissingData(); return }
      this.inputText = text
      this.handleCycleSend()
    },

    generateParkReply(q) {
      if (q.includes('光伏') || q.includes('绿电') || q.includes('清洁能源') || q.includes('消纳')) {
        return {
          content: '🌞 **园区清洁能源消纳与零碳直接核减说明**\n\n'
            + '依据发改委附件4《零碳园区碳排放核算方法（试行）》：\n'
            + '- 园区内屋顶分布式光伏（24MW）本期自发自用消纳电量 **8,520 MWh**，按零碳属性直接在净受入电力中核减；\n'
            + '- 绿电市场化交易直供消纳 **4,992 MWh**，已取得北京电力交易中心核销凭证，计入零碳因子；\n'
            + '- 本期清洁能源消费比重达 **91.5%**，达到并优于发改委附件3引导指标（≥ 90%）。'
        }
      }
      if (q.includes('指标') || q.includes('达标') || q.includes('国家级') || q.includes('诊断')) {
        return {
          content: '🎯 **国家级零碳园区建设指标体系（试行）对标诊断结果**：\n\n'
            + '1. **[核心硬指标] 单位能耗碳排放**：当前 **0.179 tCO₂/tce**（国标门槛 ≤ 0.20 tCO₂/tce，**✅ 达标**）；\n'
            + '2. **[引导指标 1] 清洁能源消费比重**：当前 **91.5%**（国标引导 ≥ 90%，**✅ 达标**）；\n'
            + '3. **[引导指标 2] 产品能效达标比例**：当前 **100%**（②清单 2 类产品全部达标）（要求 ≥ 90%，**✅ 达标**）；\n'
            + '4. **[引导指标 3] 工业固体废物综合利用率**：当前 **86.4%**（国标引导 ≥ 80%，**✅ 达标**）；\n'
            + '5. **[引导指标 4] 工业余能利用率**：当前 **59.3%**（国标引导 ≥ 50%，**✅ 达标**）；\n'
            + '6. **[引导指标 5] 工业用水重复利用率**：当前 **88.2%**（国标引导 ≥ 80%，**✅ 达标**）。\n\n'
            + '核心硬指标与 5 项引导指标全部达成，已具备国家级零碳园区申报与验收条件。'
        }
      }
      if (q.includes('报告') || q.includes('导出')) {
        return {
          content: '📄 **园区核算报告与台账就绪**\n\n您可直接在右侧操作栏点击「**生成园区核算报告**」或「**导出数据**」，系统将输出严格符合发改委发改环资〔2025〕910号附件3、4格式的年度/月度完整申报台账。'
        }
      }
      return {
        content: '📊 已收到您的指令。当前园区核算期次为 **' + this.currentPeriodKey + '**。\n\n园区碳排放总量为 **18,340 tCO₂**，单位能耗碳排放 **0.179 tCO₂/tce**（达标），清洁能源消费比重 **91.5%**（达标）。您可以点击右侧看板切换月份或查看详细数据清单。'
      }
    },

    scrollToBottom() {
      // Vue 渲染异步：必须等 DOM 更新后再取 scrollHeight，否则停在中途
      this.$nextTick(() => {
        const el = this.$refs.chatMessagesRef
        if (el) el.scrollTop = el.scrollHeight
        requestAnimationFrame(() => {
          const el2 = this.$refs.chatMessagesRef
          if (el2) el2.scrollTop = el2.scrollHeight
        })
      })
    },

    // ===== ECharts: 园区专属图表 =====
    initResultCharts() {
      this.$nextTick(() => {
        // 1. 趋势堆叠柱状图 + 同期对比折线
        const trendEl = this.$refs.resultTrendChart
        if (trendEl) {
          if (!this._trendChart) this._trendChart = echarts.init(trendEl)
          const months = ['5月', '6月', '7月', '8月', '9月', '10月']
          const fossilData = [6150, 5980, 6220, 6050, 5810, 5690]
          const convData = [4360, 4210, 4390, 4250, 4120, 4040]
          const netData = [6480, 6350, 6620, 6410, 6180, 5930]
          const procData = [3220, 3150, 3280, 3160, 3060, 2990]
          const lastYearData = [22100, 21700, 22400, 21900, 21500, 21300]

          this._trendChart.setOption({
            grid: { left: 10, right: 16, top: 32, bottom: 4, containLabel: true },
            tooltip: { trigger: 'axis', valueFormatter: v => (v || 0).toLocaleString() + ' tCO₂' },
            legend: { top: 0, itemWidth: 10, itemHeight: 8, itemGap: 14, textStyle: { fontSize: 10, color: '#606266' } },
            xAxis: {
              type: 'category', data: months,
              axisLabel: { fontSize: 10, color: '#909399' },
              axisLine: { lineStyle: { color: '#ebeef5' } },
              axisTick: { show: false }
            },
            yAxis: {
              type: 'value', name: 'tCO₂',
              nameTextStyle: { fontSize: 9, color: '#c0c4cc' },
              axisLabel: { fontSize: 10, color: '#909399' },
              splitLine: { lineStyle: { color: '#f5f7fa' } }
            },
            series: [
              { name: '化石燃料燃烧', type: 'bar', stack: 'total', data: fossilData, itemStyle: { color: '#0067fe' }, barMaxWidth: 16 },
              { name: '能源加工转换', type: 'bar', stack: 'total', data: convData, itemStyle: { color: '#0ea5e9' }, barMaxWidth: 16 },
              { name: '净购入电力热力', type: 'bar', stack: 'total', data: netData, itemStyle: { color: '#38bdf8' }, barMaxWidth: 16 },
              { name: '工业生产过程', type: 'bar', stack: 'total', data: procData, itemStyle: { color: '#fb923c' }, barMaxWidth: 16 },
              {
                name: '上年同期排放', type: 'line', z: 3, symbol: 'circle', symbolSize: 5,
                data: lastYearData, itemStyle: { color: '#94a3b8' },
                lineStyle: { width: 1.5, type: 'dashed', color: '#94a3b8' }
              }
            ]
          })
          this._trendChart.resize()
        }

        // 2. 构成环形图
        const pieEl = this.$refs.resultPieChart
        if (pieEl) {
          if (!this._pieChart) this._pieChart = echarts.init(pieEl)
          this._pieChart.setOption({
            tooltip: { trigger: 'item', formatter: '{b}：{c} tCO₂（{d}%）' },
            legend: { show: false },
            graphic: [
              { type: 'text', left: 'center', top: '38%', style: { text: '园区碳排放总量', fontSize: 10, fill: '#909399' } },
              { type: 'text', left: 'center', top: '44%', style: { text: '18,340', fontSize: 15, fontWeight: 600, fill: '#1e293b' } },
              { type: 'text', left: 'center', top: '54%', style: { text: 'tCO₂', fontSize: 9, fill: '#c0c4cc' } }
            ],
            series: [{
              type: 'pie', radius: ['52%', '72%'], center: ['50%', '50%'],
              avoidLabelOverlap: true, label: { show: false },
              itemStyle: { borderColor: '#fff', borderWidth: 2 },
              data: [
                { name: '化石燃料燃烧', value: 5690, itemStyle: { color: '#0067fe' } },
                { name: '能源加工转换', value: 4040, itemStyle: { color: '#0ea5e9' } },
                { name: '净购入电力热力', value: 5930, itemStyle: { color: '#38bdf8' } },
                { name: '工业生产过程', value: 2990, itemStyle: { color: '#fb923c' } }
              ]
            }]
          })
          this._pieChart.resize()
        }

        // 3. 重点企业与排碳源横向柱状图 (Top 8)
        const catEl = this.$refs.resultCatChart
        if (catEl) {
          if (!this._catChart) this._catChart = echarts.init(catEl)
          const cats = (this.resultCategories || []).slice().reverse()
          this._catChart.setOption({
            grid: { left: 8, right: 60, top: 6, bottom: 4, containLabel: true },
            tooltip: { trigger: 'axis', valueFormatter: v => (v || 0).toLocaleString() + ' tCO₂' },
            xAxis: {
              type: 'value', name: 'tCO₂',
              nameTextStyle: { fontSize: 9, color: '#c0c4cc' },
              axisLabel: { fontSize: 10, color: '#909399' },
              splitLine: { lineStyle: { color: '#f5f7fa' } }
            },
            yAxis: {
              type: 'category', data: cats.map(c => c.name),
              axisLabel: { fontSize: 10, color: '#606266' },
              axisLine: { lineStyle: { color: '#ebeef5' } },
              axisTick: { show: false }
            },
            series: [{
              type: 'bar', data: cats.map(c => c.value), barMaxWidth: 14,
              itemStyle: { color: '#0067fe', borderRadius: [0, 3, 3, 0] },
              label: {
                show: true, position: 'right', fontSize: 10, color: '#909399',
                formatter: p => p.value.toLocaleString()
              }
            }]
          })
          this._catChart.resize()
        }
      })
    }
  }
}
