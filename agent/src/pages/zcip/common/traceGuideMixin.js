/**
 * 数据清单统一交互 mixin（平台级共性）
 * ------------------------------------------------------------
 * 规范：docs/_data-list-interaction-spec.md
 *
 * 契约：
 *   1. 点击数据行 → 推「数据卡片」引导（不自动打开抽屉）
 *   2. 卡片下方给建议按钮：查看完整溯源 / 确认此数据
 *   3. 用户输入含「溯源」→ 打开右侧抽屉
 *
 * 使用方需提供：
 *   · data: traceRow（当前聚焦数据行）、traceDrawer（抽屉开关）
 *   · messages 数组（用于推送引导）
 *   · 可选：_push(text, suggestions)（部分场景的自有推送方法）
 */
export default {
  methods: {
    /**
     * 推「数据溯源」引导卡片
     * @param {Object} row 数据行 { name, scope, category, emission, hasData, confirmed }
     * @param {Object} [options] 覆盖项 { title, suggestions, extraHtml }
     */
    pushTraceGuide(row, options) {
      if (!row) return
      const opt = options || {}
      const hasData = row.hasData !== false
      const st = !hasData ? '缺失数据' : (row.confirmed ? '已确认' : '待确认')
      const stColor = !hasData ? '#F56C6C' : (row.confirmed ? '#52C41A' : '#E6A23C')
      const box = 'padding:10px 12px;background:rgba(0,103,254,0.04);border-radius:8px;border-left:3px solid #0067FE;margin:6px 0;line-height:1.9;font-size:12.5px;'

      let html = '<strong style="color:#0067FE;">【' + (opt.title || '数据溯源') + '】' + (row.name || '—') + '</strong>'
      html += '<div style="' + box + '">'
      const scope = row.scope || ''
      const category = row.category || ''
      if (scope || category) {
        html += '所属范围：' + (scope || '—') + (category ? ' · ' + category : '') + '<br/>'
      }
      if (typeof row.emission === 'number') {
        html += '排放量：<b style="color:#0067FE;font-size:15px;">' + row.emission.toLocaleString() + '</b> tCO₂e<br/>'
      }
      if (typeof row.value === 'number' && typeof row.emission !== 'number') {
        html += '数值：<b style="color:#0067FE;font-size:15px;">' + row.value.toLocaleString() + '</b> ' + (row.unit || '') + '<br/>'
      }
      html += '数据状态：<b style="color:' + stColor + ';">' + st + '</b>'
      html += '</div>'
      if (opt.extraHtml) html += opt.extraHtml
      html += '<div style="font-size:11.5px;color:#94a3b8;margin-top:4px;">提示：完整参数链（活动数据 / 排放因子 / 凭证）可点击下方「查看完整溯源」查看。</div>'

      const suggestions = opt.suggestions || ['查看完整溯源', '确认此数据']
      if (Array.isArray(this.messages)) {
        this.messages.push({
          id: Date.now(),
          role: 'assistant',
          content: html,
          timestamp: '刚刚',
          suggestions: suggestions
        })
        if (typeof this.scrollToBottom === 'function') this.scrollToBottom()
      }
    },

    /**
     * 识别「查看溯源」意图
     * @param {string} q 用户输入
     * @returns {boolean} true 表示已处理（调用方应中断后续逻辑）
     */
    handleTraceIntent(q) {
      const text = String(q || '')

      // ① 确认当前数据
      if (text.indexOf('确认') > -1 && this.traceRow) {
        return this.confirmTraceRow(this.traceRow)
      }

      // ② 查看完整溯源
      if (text.indexOf('溯源') === -1) return false
      const wantView = text.indexOf('查看') > -1 || text.indexOf('完整') > -1 || text.indexOf('明细') > -1
      if (!wantView) return false
      if (this.traceRow) {
        this.traceDrawer = true
        if (typeof this.scrollToBottom === 'function') this.scrollToBottom()
      } else {
        const msg = '请先在右侧数据清单中点击一项数据，再查看其溯源明细。'
        if (typeof this._push === 'function') {
          this._push(msg, ['查看数据清单'])
        } else if (Array.isArray(this.messages)) {
          this.messages.push({ id: Date.now(), role: 'assistant', content: msg, timestamp: '刚刚' })
        }
      }
      return true
    },

    /**
     * 确认当前数据行
     * @param {Object} row 数据行
     * @returns {boolean} 恒为 true（已处理）
     */
    confirmTraceRow(row) {
      if (!row) return false
      const name = row.name || '该数据'

      // 缺失数据不可确认
      if (row.hasData === false) {
        this._pushTraceMsg(
          '「' + name + '」当前为缺失数据，无法确认。请先补充数据或上传凭证。',
          ['查看数据清单']
        )
        return true
      }

      // 已确认则提示
      if (row.confirmed) {
        this._pushTraceMsg('「' + name + '」此前已确认，无需重复操作。', ['查看完整溯源'])
        return true
      }

      // 标记确认（$set 保证响应式）
      if (typeof this.$set === 'function') {
        this.$set(row, 'confirmed', true)
      } else {
        row.confirmed = true
      }

      this._pushTraceMsg(
        '已确认「' + name + '」。该数据将作为核算输入参与后续计算。',
        ['查看完整溯源', '查看数据清单']
      )
      return true
    },

    /**
     * 内部：推送一条助手消息（统一出口）
     */
    _pushTraceMsg(content, suggestions) {
      if (Array.isArray(this.messages)) {
        this.messages.push({
          id: Date.now(),
          role: 'assistant',
          content: content,
          timestamp: '刚刚',
          suggestions: suggestions || []
        })
        if (typeof this.scrollToBottom === 'function') this.scrollToBottom()
      } else if (typeof this._push === 'function') {
        this._push(content, suggestions || [])
      }
    }
  }
}
