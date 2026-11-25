<template>
  <div class="report-submission-center" :style="{ '--rs-color': themeColor, '--rs-color-light': themeColorLight, '--rs-color-hover': themeColorHover, '--rs-color-bg': themeColorBg, '--rs-color-border': themeColorBorder }">
  <!-- ================= 模态A：总览/接待态 ================= -->
  <template v-if="pageMode === 'home'">
    <!-- 最左：历史对话栏（可收缩，与产品碳足迹/零碳工厂智能体一致） -->
    <div :class="['rs-history-sidebar', { 'rs-history-collapsed': !showHistorySidebar }]">
      <div class="rs-history-toggle" @click="toggleHistorySidebar">
        <i :class="showHistorySidebar ? 'el-icon-d-arrow-left' : 'el-icon-d-arrow-right'"></i>
        <span v-if="!showHistorySidebar" class="rs-history-vertical">历史对话</span>
      </div>
      <div v-if="showHistorySidebar" class="rs-history-content">
        <div class="rs-history-head">
          <span>历史对话</span>
          <span class="rs-history-count">{{ conversationHistory.length }}</span>
        </div>
        <div class="rs-history-list">
          <div v-for="conv in conversationHistory" :key="conv.id"
            :class="['rs-history-item', { 'rs-history-active': currentConversationId === conv.id }]"
            @click="loadConversation(conv.id)">
            <div class="rs-history-title">{{ conv.title }}</div>
            <div class="rs-history-time">{{ conv.timestamp }}</div>
            <i class="el-icon-close rs-history-del" @click.stop="deleteConversation(conv.id)"></i>
          </div>
          <div v-if="conversationHistory.length === 0" class="rs-history-empty">
            <i class="el-icon-chat-line-square"></i>
            <span>暂无历史对话</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 中：对话框 -->
    <div class="chat-panel">
      <div class="chat-header">
        <div class="header-title">
          <span class="bot-avatar-sm" :style="{ background: 'var(--rs-color-light)' }">
            <AgentIcon icon="ai-core" :color="themeColor" :size="24" />
          </span>
          <span class="chat-name-highlight">小易</span>
          <span class="bot-status-dot"></span>
          <span class="header-status">在线</span>
        </div>
        <div class="header-actions">
          <el-tooltip content="当前会话上下文长度估算值（按中文字符≈1.5 token折算），新建对话后清零，非计费计量" placement="bottom">
            <span class="token-counter" v-if="estimatedTokens > 0"><i class="el-icon-coin"></i> {{ formattedTokens }}</span>
          </el-tooltip>
          <span class="header-onboarding-btn" @click="startOnboarding"><i class="el-icon-aim"></i> 新手引导</span>
          <span class="toolbar-icon-sep" @click="newConversation"><i class="el-icon-plus"></i> 新建对话</span>
        </div>
      </div>
      <div class="chat-messages" ref="chatMessages">
        <!-- 欢迎消息 + 快捷操作 -->
        <div class="msg msg-agent msg-welcome">
          <div class="msg-avatar"><AgentIcon icon="ai-core" :color="themeColor" :size="26" /></div>
          <div class="msg-body">
            <!-- 欢迎气泡正文随右侧页签联动（与下方解读块同源，杜绝视图与引导语脱节） -->
            <div class="msg-text" v-if="rightPanel === 'calendar'">当前处于<b>【排期规则】</b>视图。系统已配置 {{ calBrief.enabledCount }} 条启用中的法定报送排期（共 {{ submissionCalendar.length }} 条），期次到达后将<b>自动触发任务实例</b>并推送补水；如需补充地方专项或临时申报，可点击右上方「+ 新建报送计划」，或对启用中的规则「提前启动」下期草稿。</div>
            <div class="msg-text" v-else>欢迎使用智慧报告！报告任务由<b>报送排期</b>按「主管部门 / 频次 / 期次」三要素自动滚动生成，<b>无需手动创建</b>。本期应编制 {{ dueReports.length }} 份报告，点击右侧任务卡片按钮即可开始编排；已归档的报告可一键<b>登记提报</b>，归档文件统一在<b>报告与档案中心</b>查看与下载。</div>
            <!-- 查询类能力（历史报告 / 进度）为通用对话能力：指令面板与对话直接可用，不设专门按钮 -->
            <!-- 左侧减负（信息架构收敛）：概览卡与任务卡已全部撤出对话区（右侧为唯一作业区），
                 仅保留结构化预警催办行（点整行定位任务），业务动线单一化 -->
            <div v-if="rightPanel === 'reports' && alertLines.length" class="rs-alert-lines">
              <div v-for="(a, ai) in alertLines" :key="ai" :class="['rs-alert-line', 'urg-accent-' + a.level]" @click="enterReport(a.r)">
                <span class="rs-alert-text"><b>《{{ a.r.name }}》</b>{{ a.text }}</span>
              </div>
            </div>
            <!-- 排期解读（排期规则页签专用）：左侧 Agent 上下文随右侧页签联动，不再挂着任务概览与右侧脱节 -->
            <div class="rs-brief-card" v-if="rightPanel === 'calendar'">
              <div class="rs-brief-head"><span>排期规则解读</span></div>
              <div class="rs-brief-stats">
                <div class="rs-stat"><b>{{ calBrief.enabledCount }}</b><span>启用中规则</span></div>
                <div class="rs-stat"><b>{{ calBrief.deptCount }}</b><span>覆盖部门</span></div>
                <div class="rs-stat ok"><b>{{ calBrief.nextDays }}</b><span>下一窗口（天）</span></div>
              </div>
              <div class="rs-brief-list">
                <div class="rs-brief-cap">最近触发</div>
                <!-- 注意：rs-brief-item 默认是 4 列网格（点/主体/倒计时/CTA），此处无倒计时列，
                     必须挂 cal-variant 变体改为 3 列，否则「查看任务」会被塞进 64px 倒计时列挤成竖排 -->
                <div class="rs-brief-item last cal-variant">
                  <span :class="['rs-urg', 'u-' + (calBrief.nextDays <= 14 ? 'yellow' : 'green')]"></span>
                  <div class="rs-brief-main">
                    <div class="rs-brief-name">{{ calBrief.nextName || '—' }}</div>
                    <div class="rs-brief-sub">{{ calBrief.nextDept }} · {{ calBrief.nextFreq }}<template v-if="calBrief.nextDays <= 14"> · 临期窗口</template></div>
                  </div>
                  <span class="rs-brief-cta" @click.stop="rightPanel = 'reports'">查看任务</span>
                </div>
              </div>
              <div style="margin-top:8px;font-size: 13px;color:#94a3b8;line-height:1.6;">如需调整申报窗口或增补地方专项，点右上角「新建报送计划」；启用中的规则可「提前启动」下期草稿。</div>
            </div>
            <div class="msg-time">刚刚</div>
          </div>
        </div>
        <!-- 历史报告卡片（对话中展示） -->
        <div v-if="showHistoryInChat" class="msg msg-agent">
          <div class="msg-avatar"><AgentIcon icon="ai-core" :color="themeColor" :size="26" /></div>
          <div class="msg-body">
            <div class="msg-text">以下是您的历史报告任务，点击即可查看详情：</div>
            <div class="chat-report-list">
              <div v-for="report in reports" :key="report.id" class="chat-report-card" @click="enterReport(report)">
                <div class="crc-top">
                  <span class="crc-name">{{ report.name }}</span>
                  <el-tag size="mini" :type="reportStatusMeta(report).tag" effect="dark">{{ reportStatusMeta(report).label }}</el-tag>
                </div>
                <div class="crc-bottom">
                  <span class="crc-meta">{{ report.type }} · {{ report.period }}</span>
                  <span class="crc-score" v-if="report.complianceScore">合规 {{ report.complianceScore }}%</span>
                </div>
              </div>
            </div>
            <div class="msg-time">刚刚</div>
          </div>
        </div>
        <!-- 对话消息流 -->
        <div v-for="(msg, i) in messages" :key="i" :class="['msg', msg.role === 'user' ? 'msg-user' : 'msg-agent']">
          <div class="msg-avatar">
            <AgentIcon v-if="msg.role !== 'user'" icon="ai-core" :color="themeColor" :size="26" />
            <i v-else class="el-icon-user"></i>
          </div>
          <div class="msg-body">
            <div class="msg-text">
                <template v-if="msg.isTyping">
                  <span class="rp-typing-indicator"><i class="rp-dot"></i><i class="rp-dot"></i><i class="rp-dot"></i></span>
                </template>
                <template v-else>
                  <span v-html="msg.text"></span>
                </template>
              </div>
            <div class="msg-time">{{ msg.time }}</div>
          </div>
        </div>
      </div>
      <!-- 快捷指令面板（灯泡呼出，与其他智能体一致） -->
      <div v-if="showCmdPanel" class="cmd-panel">
        <div class="cmd-panel-header">
          <span class="cmd-panel-title"><i class="el-icon-s-opportunity"></i> 快捷指令</span>
          <span class="cmd-panel-close" @click="showCmdPanel = false"><i class="el-icon-close"></i></span>
        </div>
        <div class="cmd-panel-body">
          <div class="cmd-group">
            <div class="cmd-group-title">进度与质量</div>
            <div class="cmd-list">
              <span class="cmd-item" @click="useCmd('汇总本期所有智慧报告进度')"><i class="el-icon-s-data"></i> 汇总本期提报进度</span>
              <span class="cmd-item" @click="useCmd('一键核查本期所有任务的数据缺漏')"><i class="el-icon-warning-outline"></i> 核查数据缺漏</span>
            </div>
          </div>
          <div class="cmd-group">
            <div class="cmd-group-title">报告资产</div>
            <div class="cmd-list">
              <span class="cmd-item" @click="useCmd('查询历史报告')"><i class="el-icon-collection"></i> 查询历史报告</span>
            </div>
          </div>
        </div>
      </div>
      <!-- 输入区域 -->
      <div class="chat-input-area">
        <div class="input-box">
          <textarea class="input-textarea" v-model="userInput" placeholder="提问或输入指令（如：新建报告）…" rows="1"
            @keydown.enter.exact="sendMessageKey" @input="autoResizeTextarea" ref="inputTextareaRef"></textarea>
          <div class="input-box-footer">
            <div class="input-toolbar">
              <span class="toolbar-icon" title="快捷指令" @click="showCmdPanel = !showCmdPanel"><i class="el-icon-s-opportunity"></i></span>
              <span class="toolbar-icon" title="语音输入" @click="$message.info('语音输入功能开发中')"><i class="el-icon-microphone"></i></span>
              <span class="toolbar-icon" title="图片上传" @click="$message.info('图片上传功能开发中')"><i class="el-icon-picture"></i></span>
              <span class="toolbar-icon" title="附件上传" @click="$message.info('附件上传功能开发中')"><i class="el-icon-upload2"></i></span>
            </div>
            <button class="send-btn" :disabled="!userInput.trim()" @click="sendMessage" :style="{ background: themeColor }">
              <i class="el-icon-s-promotion"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 右：任务窄栏（两个页签；本期统计收进报送任务容器内部，排期视图不占位） -->
    <aside class="rs-sidebar">
      <div class="rs-tabs-header">
        <div :class="['rs-tab', { active: rightPanel === 'reports' }]" @click="rightPanel = 'reports'">
          <i class="el-icon-s-order"></i><span>报送任务</span>
        </div>
        <div :class="['rs-tab', { active: rightPanel === 'calendar' }]" @click="rightPanel = 'calendar'">
          <i class="el-icon-date"></i><span>排期规则</span>
        </div>
      </div>
      <div class="rs-tab-content">
        <!-- 报送任务（期次看板：本期应报自动置顶；头部数据条收在本容器内部，随页签显隐） -->
        <template v-if="rightPanel === 'reports'">
          <div class="rs-toolbar">
            <el-input placeholder="搜索报告..." prefix-icon="el-icon-search" size="mini" v-model="searchReport" style="flex:1;"></el-input>
            <el-select v-model="filterDept" size="mini" clearable placeholder="主管部门" style="width: 132px; margin: 0 6px;" class="rs-dept-filter">
              <el-option v-for="d in deptOptions" :key="d" :label="d" :value="d"></el-option>
            </el-select>
            <el-tooltip content="临时报告（非周期），不走报送排期" placement="top">
              <el-button size="mini" icon="el-icon-plus" class="rs-rc-cta rs-temp-btn" @click="startCreateReport">临时报告</el-button>
            </el-tooltip>
          </div>
          <div class="rs-filter-tags">
            <span v-for="f in filters" :key="f.key" :class="['rs-ft', { active: filterTag === f.key }]" @click="filterTag = f.key">{{ f.label }} ({{ statusCounts[f.key] }})</span>
          </div>
          <!-- 本期应报（报送排期自动生成，数量多时内部滚动，不挤占其他任务） -->
          <div class="rs-section-head">
            <span>本期应报</span>
            <span class="rs-section-badge">{{ filteredDueReports.length }}</span>
            <span class="rs-section-note">排期自动生成</span>
          </div>
          <div class="rs-due-list">
            <div v-for="report in filteredDueReports" :key="report.id" :class="['rs-report-card', 'rs-compact', 'urg-border-' + urgency(report)]" @click="enterReport(report)">
              <div class="rs-cp-title">
                <span :class="['rs-urg', 'u-' + urgency(report)]"></span>
                <span class="rs-cp-name">{{ report.name }}</span>
              </div>
              <!-- 状态行只保留「状态 + 操作按钮」：阶段、临期档位、倒计时不进卡片
                   （紧急度仍由左侧色条与左栏催办行表达，不重复占位） -->
              <div class="rs-cp-row">
                <div class="rs-cp-tags">
                  <el-tag size="mini" :type="reportStatusMeta(report).tag" effect="plain">{{ reportStatusMeta(report).label }}</el-tag>
                </div>
                <el-button size="mini" :type="ctaSolid(report) ? 'primary' : ''" class="rs-rc-cta" :style="ctaStyle(report)" @click.stop="ctaAction(report)">{{ ctaLabel(report) }}</el-button>
              </div>
              <div class="rs-cp-extra">
                <span class="rs-cp-meta">{{ report.period }} · {{ report.dept }} · {{ report.freq }}</span>
                <el-progress :percentage="report.progress" :stroke-width="4" :show-text="false" :color="reportStatus(report) === 'closed' ? 'var(--rs-color)' : urgencyColor(report)" style="flex:1;margin:0 8px;"></el-progress>
                <span class="rs-cp-pct">{{ report.progress }}%</span>
              </div>
            </div>
            <div v-if="filteredDueReports.length === 0" class="rs-empty-mini">{{ searchReport ? '未找到匹配的报告' : '本期应报任务已全部完成' }}</div>
          </div>
          <!-- 其他任务（历史期次 + 临时报告；与本期应报同构容器：间距/滚动/空态对齐，计数见分组徽章） -->
          <div class="rs-section-head muted" v-if="filteredOtherReports.length > 0 || (otherReports.length > 0 && filterTag === 'all')">
            <span>其他任务</span>
            <span class="rs-section-badge">{{ filteredOtherReports.length }}</span>
          </div>
          <div class="rs-other-list">
            <div v-for="report in filteredOtherReports" :key="report.id" :class="['rs-report-card', 'rs-compact', 'urg-border-' + urgency(report)]" :title="report.remark || ''" @click="enterReport(report)">
              <div class="rs-cp-title">
                <span :class="['rs-urg', 'u-' + urgency(report)]"></span>
                <span class="rs-cp-name">{{ report.name }}</span>
              </div>
              <div class="rs-cp-row">
                <div class="rs-cp-tags">
                  <el-tag size="mini" :type="reportStatusMeta(report).tag" effect="plain">{{ reportStatusMeta(report).label }}</el-tag>
                </div>
                <el-button size="mini" :type="ctaSolid(report) ? 'primary' : ''" class="rs-rc-cta" :style="ctaStyle(report)" @click.stop="ctaAction(report)">{{ ctaLabel(report) }}</el-button>
              </div>
              <div class="rs-cp-extra">
                <span class="rs-cp-meta">{{ report.auto ? freqLabel(report.freq) : '临时报告' }} · {{ report.period }}<template v-if="report.complianceScore"> · 合规{{ report.complianceScore }}%</template></span>
                <span v-if="reportStatus(report) !== 'composing'" class="rs-cp-crb" @click.stop="goCarbonReportCenter(report)">报告与档案中心 ↗</span>
                <span v-if="reportStatus(report) === 'composing'" class="rs-cp-del" title="删除任务" @click.stop="deleteReportCard(report)"><i class="el-icon-delete"></i></span>
                <el-progress :percentage="report.progress" :stroke-width="4" :show-text="false" :color="reportStatus(report) === 'closed' ? 'var(--rs-color)' : urgencyColor(report)" style="flex:1;margin:0 8px;"></el-progress>
                <span class="rs-cp-pct">{{ report.progress }}%</span>
              </div>
            </div>
            <div v-if="filteredOtherReports.length === 0 && otherReports.length > 0" class="rs-empty-mini">未找到匹配的报告</div>
          </div>
        </template>
        <!-- 报送排期（排期前瞻视图：下次窗口何时开、还有几天，支持提前启动） -->
        <template v-if="rightPanel === 'calendar'">
          <div class="rs-calendar-intro">
            <i class="el-icon-info"></i>
            期次按计划自动生成；可「提前启动」下期草稿
          </div>
          <div class="rs-cal-toolbar">
            <span class="rs-cal-add-btn" @click="openCalDialog"><i class="el-icon-plus"></i> 新建报送计划</span>
            <span :class="['rs-early-btn', 'rs-cal-toggle-on', { active: calEnabledOnly }]" @click="calEnabledOnly = !calEnabledOnly">
              <i class="el-icon-view"></i> 仅看启用
            </span>
          </div>
          <div class="rs-filter-tags">
            <el-select v-model="calFreqFilter" size="mini" clearable placeholder="全部频次" class="rs-cal-freq-select">
              <el-option v-for="f in calFreqOptions" :key="f" :label="f" :value="f"></el-option>
            </el-select>
            <span :class="['rs-ft', { active: calDeptFilter === 'all' }]" @click="calDeptFilter = 'all'">全部部门</span>
            <span v-for="d in calendarDepts" :key="d" :class="['rs-ft', { active: calDeptFilter === d }]" @click="calDeptFilter = d">{{ d }}</span>
          </div>
          <!-- 卡片组内部滚动：顶部说明/工具条/筛选固定，滚动仅发生在计划卡片列表内 -->
          <div class="rs-cal-list">
            <div v-for="cal in filteredCalendar" :key="cal.id" class="rs-cal-card" :class="{ 'rs-cal-off': !cal.enabled }">
            <div class="rs-cal-head">
              <span class="rs-cal-dept">{{ cal.dept }}</span>
              <el-tag size="mini" effect="dark" :type="cal.enabled ? 'primary' : 'info'" :color="cal.enabled ? 'var(--rs-color)' : ''">{{ cal.enabled ? cal.freq : cal.freq + ' · 已停用' }}</el-tag>
            </div>
            <div class="rs-cal-name"><span class="rs-cal-next-tag">下期</span>{{ cal.nextName }}</div>
            <div class="rs-cal-row">· 提报窗口：{{ cal.window }}</div>
            <div v-if="cal.route" class="rs-cal-row">· 场景适配：{{ cal.route }}</div>
            <div class="rs-cal-row">· 距开启：还有 <b>{{ daysUntil(cal.nextGen) }}</b> 天</div>
            <div class="rs-cal-actions">
              <!-- 在途防重保护（Idempotency Guard）：该期次已有在途任务（提前启动或自动派生）时，
                   按钮态前置为「查看在途任务」并定位跳转，杜绝重复孤儿任务 -->
              <span v-if="!calTaskInFlight(cal)" :class="['rs-early-btn', 'rs-primary-act', { disabled: !cal.enabled }]" @click="cal.enabled && earlyStart(cal)">
                <i class="el-icon-time"></i> 提前启动
              </span>
              <span v-else class="rs-early-btn rs-primary-act rs-early-ok" @click="gotoInFlightTask(cal)" title="该期次任务已在编排中，点击定位">
                <i class="el-icon-circle-check"></i> 查看在途任务
              </span>
                <span class="rs-early-btn rs-txt-act" @click="toggleCalEnabled(cal)">
                <i :class="cal.enabled ? 'el-icon-video-pause' : 'el-icon-video-play'"></i> {{ cal.enabled ? '停用' : '启用' }}
              </span>
              <span class="rs-early-btn rs-txt-act" @click="openCalDialog(cal)">
                <i class="el-icon-edit"></i> 编辑
              </span>
              <!-- 危险操作收敛：删除收进「更多」折叠菜单，仅系统管理员角色可见（演示角色常量，生产接权限中枢 RBAC） -->
              <el-dropdown v-if="currentRole === '系统管理员'" trigger="click" @command="cmd => calMore(cmd, cal)">
                <span class="rs-early-btn rs-txt-act"><i class="el-icon-more"></i> 更多</span>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="delete" class="rs-cal-del-item"><i class="el-icon-delete"></i> 删除计划</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
            </div>
            <div v-if="filteredCalendar.length === 0" class="rs-empty-mini">未找到匹配的报送计划</div>
          </div>
        </template>
      </div>
    </aside>

    <!-- 新建报送计划弹窗：创建时确定匹配规则，之后期次自动生成 -->
    <el-dialog :title="editingCalId ? '编辑报送计划' : '新建报送计划'" :visible.sync="calDialogVisible" width="440px" append-to-body :close-on-click-modal="false">
      <div class="rs-cal-dlg-sec">报送要素</div>
      <el-form label-width="86px" size="small">
        <el-form-item label="报告类型" required>
          <el-select v-model="calForm.reportType" placeholder="选择报告类型" style="width:100%" :disabled="!!editingCalId" @change="onCalTypeChange">
            <el-option v-for="t in calTypeOptionsForPlan" :key="t" :label="t" :value="t">
              <div class="rs-type-opt">
                <span>{{ t }}</span>
                <span class="rs-type-opt-meta">{{ typeMeta(t) }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <!-- 日历 → 模板库关联：选定报告类型后即时解析关联模板，解析不到时阻断提示 -->
        <el-form-item label="关联模板" v-if="calForm.reportType">
          <div v-if="calTemplate" class="rs-cal-tpl">
            <i class="el-icon-link"></i>
            <span>{{ calTemplate.docName }}</span>
            <el-tag size="mini" effect="plain">{{ calTemplate.version }}</el-tag>
          </div>
          <div v-else class="rs-cal-tpl-warn">
            <i class="el-icon-warning-outline"></i>
            <span>平台模板库中暂无匹配「{{ calForm.reportType }}」的报告模板，请先在模板库补充后再创建计划</span>
            <el-button type="text" size="mini" class="rs-cal-tpl-link" @click="goPlatformTemplates">前往平台模板库 →</el-button>
          </div>
        </el-form-item>
        <el-form-item label="主管部门" required>
          <el-select v-model="calForm.dept" placeholder="选择或输入主管部门" filterable allow-create style="width:100%">
            <el-option label="生态环境局" value="生态环境局"></el-option>
            <el-option label="发展改革委" value="发展改革委"></el-option>
            <el-option label="统计局" value="统计局"></el-option>
            <el-option label="能源局" value="能源局"></el-option>
            <el-option label="工业和信息化局" value="工业和信息化局"></el-option>
            <el-option label="ESG评级机构" value="ESG评级机构"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="报送频次">
          <el-radio-group v-model="calForm.freq">
            <el-radio-button v-for="f in calFreqOptions" :key="f" :label="f"></el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="首次期次" required>
          <el-date-picker v-model="calForm.firstPeriod" type="month" value-format="yyyy-MM" placeholder="选择首次期次所属月份" style="width:100%"></el-date-picker>
        </el-form-item>
        <el-form-item label="提报窗口" required>
          <div style="display:flex;gap:6px;align-items:center;">
            <el-date-picker v-model="calForm.windowStart" type="date" value-format="yyyy-MM-dd" placeholder="开始日" style="flex:1"></el-date-picker>
            <span style="font-size: 13px;color:#909399;white-space:nowrap;">~</span>
            <el-date-picker v-model="calForm.windowEnd" type="date" value-format="yyyy-MM-dd" placeholder="截止日" style="flex:1"></el-date-picker>
          </div>
          <div v-if="calWindowPreview" class="rs-cal-dlg-hint">
            窗口共 {{ calWindowDays }} 天：{{ calWindowPreview }}
          </div>
        </el-form-item>
      </el-form>
      <!-- 场景适配：由所选模板的变体元数据动态渲染，单一变体模板自动隐藏 -->
      <scenario-match :template="calMatchTpl" v-model="calForm.route"></scenario-match>
      <!-- 审批模式：创建任务时确定审批层级与审核人员（编排内只读执行，不可切换） -->
      <div class="rs-cal-dlg-sec">审批模式</div>
      <div style="padding:0 20px 4px;">
        <el-radio-group v-model="calForm.approval.level" size="mini" @change="onApprovalLevelChange(calForm.approval)">
          <el-radio-button v-for="o in approvalModeOptions" :key="o.level" :label="o.level">{{ o.label }}</el-radio-button>
        </el-radio-group>
        <div v-for="(n, ni) in calForm.approval.chain" :key="ni" style="display:flex;align-items:center;gap:8px;margin-top:6px;">
          <span style="font-size: 13px;color:#909399;width:64px;">L{{ n.nodeLevel }} 节点</span>
          <el-input v-model="n.roleKey" size="mini" style="width:118px;" placeholder="节点名称"></el-input>
          <el-select v-model="n.by" size="mini" style="flex:1;" filterable allow-create default-first-option placeholder="选择企业人员（可自行填写）">
            <el-option v-for="p in personnelOptions" :key="p.value" :label="p.label" :value="p.value"></el-option>
          </el-select>
        </div>
      </div>
      <span slot="footer">
        <el-button size="small" @click="calDialogVisible = false">取 消</el-button>
        <el-button size="small" type="primary" @click="submitCalRule">创建规则</el-button>
      </span>
    </el-dialog>
  </template>

  <!-- ================= 模态B：任务激活沉浸态（四阶段工作台） ================= -->
  <template v-else>
    <div class="rs-workbench">
      <!-- 左：副驾驶对话区（收起后拉宽作业区：黄金分割向业务侧倾斜） -->
      <div :class="['rwb-chat-panel', { 'is-collapsed': chatCollapsed }]">
        <template v-if="!chatCollapsed">
        <div class="rwb-chat-header">
          <div class="header-title">
            <span class="bot-avatar-sm" :style="{ background: 'var(--rs-color-light)' }">
              <AgentIcon icon="ai-core" :color="themeColor" :size="24" />
            </span>
            <span class="chat-name-highlight">小易</span>
          </div>
          <div class="header-actions">
            <el-tooltip content="当前会话上下文长度估算值（按中文字符≈1.5 token折算），重置后清零，非计费计量" placement="bottom">
              <span class="token-counter" v-if="wbTokens > 0"><i class="el-icon-coin"></i> {{ wbFormattedTokens }}</span>
            </el-tooltip>
            <span class="rwb-back" @click="exitWorkbench"><i class="el-icon-back"></i> 返回</span>
            <span v-if="activeTask && reportStatus(activeTask) === 'composing'" class="rwb-back" @click="deleteActiveTask"><i class="el-icon-delete"></i> 删除</span>
            <el-tooltip content="重置整个任务编排至阶段一：已填报数据、AI 改写、签署与回执留痕将全部清空（不可撤销）" placement="bottom">
              <span class="toolbar-icon-sep" @click="resetWbChat"><i class="el-icon-refresh-left"></i> 重置</span>
            </el-tooltip>
            <el-tooltip content="收起副驾驶，将右侧作业区拉宽至全宽（工业台账视野）" placement="bottom">
              <span class="rwb-back" @click="chatCollapsed = true"><i class="el-icon-s-fold"></i></span>
            </el-tooltip>
          </div>
        </div>
        <div class="rwb-chat-msgs" ref="wbMsgs" @click="onWbMsgsClick">
          <!-- 阶段切换后历史线索默认折叠：左栏只留当前阶段的协同内容，避免上一阶段表单线索污染视线 -->
          <div v-if="wbHistoryCut > 0" class="rwb-hist-fold" @click="wbShowAllHistory = !wbShowAllHistory">
            <i :class="wbShowAllHistory ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
            {{ wbShowAllHistory ? '收起历史对话（' + wbHistoryCut + ' 条）' : '已折叠 ' + wbHistoryCut + ' 条历史对话（当前阶段之前的过程记录）——点击展开回看' }}
          </div>
          <div v-for="(m, i) in wbVisibleMessages" :key="i" :class="['rwb-wb-msg', m.role]">
            <span v-if="m.role === 'user'">{{ m.text }}</span>
            <span v-else v-html="m.text"></span>
            <div v-if="m.suggestions && m.suggestions.length" class="rwb-wb-sugs">
              <span v-for="s in m.suggestions" :key="s" class="rwb-wb-sug" @click="sendWb(s)">{{ s }}</span>
            </div>
          </div>
        </div>
        <!-- 事件驱动线索卡已迁入输入区内部（附着在输入框正上方）：与输入框视觉连为一体，不再悬浮在消息流中造成孤儿卡片 -->
        <!-- 任务快捷指令面板 -->
        <!-- 任务快捷指令面板 -->
        <div v-if="wbCmdOpen" class="cmd-panel">
          <div class="cmd-panel-header">
            <span class="cmd-panel-title"><i class="el-icon-s-opportunity"></i> 任务指令</span>
            <span class="cmd-panel-close" @click="wbCmdOpen = false"><i class="el-icon-close"></i></span>
          </div>
          <div class="cmd-panel-body">
            <div class="cmd-group">
              <div class="cmd-group-title">阶段操作</div>
              <div class="cmd-list">
                <span class="cmd-item" @click="useWbCmd('查看本阶段说明')"><i class="el-icon-info"></i> 本阶段说明</span>
                <span class="cmd-item" @click="useWbCmd('查看任务全流程进度')"><i class="el-icon-data-line"></i> 全流程进度</span>
                <span v-if="activeStage === 1" class="cmd-item" @click="wbCmdOpen = false; openTemplatePreview()"><i class="el-icon-tickets"></i> 模板结构预览</span>
                <span v-if="activeStage === 1" class="cmd-item" @click="wbCmdOpen = false; gotoStage(2)"><i class="el-icon-right"></i> 进入数据采集</span>
                <span v-if="activeStage === 2" class="cmd-item" @click="useWbCmd('查看缺项填报要求')"><i class="el-icon-warning-outline"></i> 缺项清单</span>
                <span v-if="activeStage === 3" class="cmd-item" @click="useWbCmd('查看换算依据')"><i class="el-icon-set-up"></i> 换算依据</span>
                <span v-if="activeStage === 3 && checkSummary.blocking" class="cmd-item" @click="useWbCmd('查看异常处置建议')"><i class="el-icon-warning"></i> 异常处置建议</span>
                <span v-if="activeStage === 3" class="cmd-item" @click="wbCmdOpen = false; confirmGenerate()"><i class="el-icon-s-check"></i> 确认生成结果</span>
                <span v-if="activeStage === 4" class="cmd-item" @click="useWbCmd('查看修订留痕')"><i class="el-icon-edit"></i> 修订留痕</span>
                <!-- 阶段四正常态不在面板挂"改数"入口（保持签署动作单一重心），
                     改数出口收敛到指令面板 + 对话指令；勾稽不通过时面板会自动出现退回条 -->
                <span v-if="activeStage === 4" class="cmd-item" @click="useWbCmd('退回阶段三重新计算')"><i class="el-icon-refresh-left"></i> 退回重算 / 重新补录</span>
                <span v-if="activeStage === 4" class="cmd-item" @click="wbCmdOpen = false; confirmArchive()"><i class="el-icon-document-checked"></i> 签字确认归档</span>
              </div>
            </div>
          </div>
        </div>
        <div class="chat-input-area rwb-chat-input-area">
          <!-- 事件驱动线索已改为对话消息形态：由小易在对话流中提出（见 showClueCard），不再使用底部弹卡 -->
          <div class="input-box">
            <textarea class="input-textarea" v-model="wbInput" placeholder="针对当前任务提问…" rows="1"
              @keydown.enter.exact="sendWb" ref="wbTextareaRef"></textarea>
            <div class="input-box-footer">
              <div class="input-toolbar">
                <span class="toolbar-icon" title="任务指令" @click="wbCmdOpen = !wbCmdOpen"><i class="el-icon-s-opportunity"></i></span>
                <span class="toolbar-icon" title="语音输入" @click="$message.info('语音输入功能开发中')"><i class="el-icon-microphone"></i></span>
                <span class="toolbar-icon" title="图片上传" @click="$message.info('图片上传功能开发中')"><i class="el-icon-picture"></i></span>
                <span class="toolbar-icon" title="附件上传" @click="$message.info('附件上传功能开发中')"><i class="el-icon-upload2"></i></span>
              </div>
              <button class="send-btn" :disabled="!wbInput.trim()" @click="sendWb"><i class="el-icon-s-promotion"></i></button>
            </div>
          </div>
        </div>
        </template>
        <!-- 折叠态：48px 窄浮标，点击展开恢复副驾驶 -->
        <div v-else class="rwb-chat-rail" @click="chatCollapsed = false" title="展开副驾驶">
          <i class="el-icon-s-unfold"></i>
          <span class="rwb-rail-name">小易 · 副驾驶</span>
          <i class="el-icon-d-arrow-right"></i>
        </div>
      </div>

      <!-- 右：阶段内容区（副驾驶折叠时拉宽至 95%+） -->
      <aside class="rwb-stage-panel">
        <div class="rwb-stage-head">
          <div class="rwb-title" v-if="activeTask">
            <span class="rwb-name">{{ activeTask.name }}</span>
            <el-tag size="mini" :type="reportStatusMeta(activeTask).tag" effect="dark">{{ reportStatusMeta(activeTask).label }}</el-tag>
            <span v-if="reportStageHint(activeTask)" class="rwb-stage-hint">{{ reportStageHint(activeTask) }}</span>
            <span class="rwb-meta">{{ activeTask.dept }} · {{ activeTask.freq }} · {{ activeTask.period }}</span>
            <span v-if="reportStatus(activeTask) === 'composing'" :class="['rwb-deadline', { urgent: daysLeft(activeTask.deadline) <= 7 }]">
              <i class="el-icon-timer"></i> 距截止 {{ daysLeft(activeTask.deadline) }} 天
            </span>
          </div>
        </div>

        <!-- ===== 形式B：成稿校核式（右侧直接显示报告结果，无阶段） ===== -->
        <div v-if="isDocumentMode" class="rwb-doc">
          <!-- 顶部：章节导航（横向）+ 确认进度 -->
          <div class="doc-topbar">
            <div class="doc-mode-switch">
              <span :class="['doc-mode-btn', { active: docViewMode === 'edit' }]" @click="docViewMode = 'edit'">
                <i class="el-icon-edit-outline"></i> 编制
              </span>
              <span :class="['doc-mode-btn', { active: docViewMode === 'preview' }]" @click="docViewMode = 'preview'">
                <i class="el-icon-document-checked"></i> 预览与归档
              </span>
            </div>
            <div class="doc-nav-h" v-if="docViewMode === 'edit'">
              <div class="doc-nav-select-wrap">
                <div class="doc-nav-select" :class="{ open: docNavOpen }" @click.stop="docNavOpen = !docNavOpen">
                  <i :class="['doc-nav-dot', docSecCls(docCurrentSection)]"></i>
                  <span class="doc-nav-select-no">{{ docCurrentSection.no }}</span>
                  <span class="doc-nav-select-name">{{ docCurrentSection.title }}</span>
                  <span class="doc-nav-select-count">{{ docSecStat(docCurrentSection).done }}/{{ docSecStat(docCurrentSection).total }}</span>
                  <i :class="['doc-nav-arrow', docNavOpen ? 'el-icon-arrow-up' : 'el-icon-arrow-down']"></i>
                </div>
                <div v-if="docNavOpen" class="doc-nav-dropdown" @click.stop>
                  <div v-for="sec in docSections" :key="sec.key"
                    :class="['doc-nav-option', { active: (docActiveKey || (docSections[0] && docSections[0].key)) === sec.key }]"
                    @click="scrollToDocSection(sec)">
                    <i :class="['doc-nav-dot', docSecCls(sec)]"></i>
                    <span class="doc-nav-opt-no">{{ sec.no }}</span>
                    <span class="doc-nav-opt-name">{{ sec.title }}</span>
                    <span class="doc-nav-opt-count">{{ docSecStat(sec).done }}/{{ docSecStat(sec).total }}</span>
                  </div>
                </div>
              </div>
              <el-button v-if="docStats.confirmed < docStats.total" size="mini" class="doc-next-btn" icon="el-icon-d-arrow-right" @click="docNextPending">
                下一个待确认 <em class="doc-next-count">{{ docStats.total - docStats.confirmed }}</em>
              </el-button>
            </div>
            <div class="doc-progress">
              <span class="doc-progress-num"><b>{{ docStats.confirmed }}</b> / {{ docStats.total }} 已确认</span>
              <span v-if="docStats.pending" class="doc-progress-tag doc-st-pending">{{ docStats.pending }} 待确认</span>
              <span v-if="docStats.missing" class="doc-progress-tag doc-st-missing">{{ docStats.missing }} 待补录</span>
            </div>
            <div class="doc-progress-track"><div class="doc-progress-fill" :style="{ width: docStats.percent + '%' }"></div></div>
          </div>

            <div v-if="docViewMode === 'edit'" class="doc-body" ref="docBody" @scroll="onDocScroll" @click="docNavOpen = false">
            <div class="doc-title">{{ activeTask.name }}</div>
            <div class="doc-subtitle">{{ activeTask.period }} · {{ activeTask.dept }} · 模板 {{ (activeTask.templateLock && activeTask.templateLock.version) || '—' }}</div>

            <div v-for="sec in docSections" :key="sec.key" :id="'doc-sec-' + sec.key" :data-key="sec.key" class="doc-section">
              <div class="doc-sec-title">{{ sec.no }}、{{ sec.title }}</div>

              <template v-if="sec.type === 'fields'">
                <div v-for="(it, ii) in sec.items" :key="it.k" :id="'doc-item-' + sec.key + '-' + ii"
                  :class="['doc-field', { 'doc-item-flash': docFocusKey === (sec.key + '-' + ii) }]"
                  @click="onDocItemClick(sec, it, ii)">
                  <span class="doc-field-label">{{ it.label }}</span>
                  <el-input v-if="editingKey === (sec.key + '-' + ii)"
                    :ref="'inline-' + sec.key + '-' + ii"
                    v-model="it.value" size="mini" class="doc-inline-input"
                    @blur="finishInlineEdit(sec, it)"
                    @keyup.enter.native="finishInlineEdit(sec, it)" />
                  <span v-else class="doc-field-value" :class="{ 'is-empty': it.status === 'missing' }">{{ it.value }}</span>
                  <span :class="['doc-mat-icon', getItemMaterials(sec, it).exact.length ? 'mat-exact' : (getItemMaterials(sec, it).all.length ? 'mat-loose' : 'mat-none')]"
                    :title="getItemMaterials(sec, it).all.length ? ('佐证材料 ' + getItemMaterials(sec, it).all.length + ' 份（精确 ' + getItemMaterials(sec, it).exact.length + '）') : '无佐证材料，建议补充'"
                    @click.stop="getItemMaterials(sec, it).all.length ? openItemMaterials(sec, it) : uploadForItem(sec, it)">📎</span>
                  <span class="doc-field-src">{{ it.src }}</span>
                  <span v-if="showDocStatus(sec, it)" :class="['doc-status', docStatusMeta[it.status].cls]" @click.stop="confirmDocItem(sec, it)">
                    <i :class="docStatusMeta[it.status].icon"></i>{{ docStatusMeta[it.status].label }}
                  </span>
                </div>
              </template>

              <div v-else-if="sec.type === 'table'" class="doc-table-wrap">
                <table class="doc-table">
                  <thead>
                    <tr>
                      <th v-for="(c, ci) in sec.columns" :key="ci">{{ c }}</th>
                      <th class="doc-th-status">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, ri) in sec.rows" :key="row.k" :id="'doc-item-' + sec.key + '-' + ri"
                      :class="{ 'doc-item-flash': docFocusKey === (sec.key + '-' + ri) }"
                      @click="focusDocItem(sec, row)">
                      <td v-for="(col, ci) in sec.columns" :key="ci"
                        :class="{ 'doc-td-name': ci === 0, 'doc-td-num': ci > 0 && /值|量|率|金额|代码/.test(col) }">
                        <el-input v-if="editingKey === (sec.key + '-' + ri + '-' + ci)"
                          :ref="'cell-' + sec.key + '-' + ri + '-' + ci"
                          v-model="cellEditValue" size="mini" class="doc-cell-input"
                          @blur="finishCellEdit(sec, row, col)"
                          @keyup.enter.native="finishCellEdit(sec, row, col)" />
                        <span v-else :class="{ 'doc-cell-clickable': isCellEditable(col) }"
                          @click.stop="isCellEditable(col) && onDocCellClick(sec, row, col, ri, ci)">{{ docCellValue(sec, row, col, ci) }}</span>
                      </td>
                      <td class="doc-td-status">
                        <span :class="['doc-mat-icon', getItemMaterials(sec, row).exact.length ? 'mat-exact' : (getItemMaterials(sec, row).all.length ? 'mat-loose' : 'mat-none')]"
                          :title="getItemMaterials(sec, row).all.length ? ('佐证材料 ' + getItemMaterials(sec, row).all.length + ' 份（精确 ' + getItemMaterials(sec, row).exact.length + '）') : '无佐证材料，建议补充'"
                          @click.stop="getItemMaterials(sec, row).all.length ? openItemMaterials(sec, row) : uploadForItem(sec, row)">📎</span>
                        <span v-if="showDocStatus(sec, row)" :class="['doc-status', docStatusMeta[row.status].cls]" @click.stop="confirmDocItem(sec, row)">
                          <i :class="docStatusMeta[row.status].icon"></i>{{ docStatusMeta[row.status].label }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <template v-else>
                <div v-for="(it, ii) in sec.items" :key="it.k" :id="'doc-item-' + sec.key + '-' + ii"
                  :class="['doc-text-item', { 'doc-item-flash': docFocusKey === (sec.key + '-' + ii) }]"
                  @click="onDocItemClick(sec, it, ii)">
                  <span class="doc-text-label">{{ it.label }}</span>
                  <el-input v-if="editingKey === (sec.key + '-' + ii)"
                    :ref="'inline-' + sec.key + '-' + ii"
                    v-model="it.value" size="mini" type="textarea" :rows="3" class="doc-inline-input"
                    @blur="finishInlineEdit(sec, it)" />
                  <span v-else class="doc-text-value">{{ it.value }}</span>
                  <span v-if="showDocStatus(sec, it)" :class="['doc-status', docStatusMeta[it.status].cls]" @click.stop="confirmDocItem(sec, it)">
                    <i :class="docStatusMeta[it.status].icon"></i>{{ docStatusMeta[it.status].label }}
                  </span>
                </div>
              </template>
            </div>
            </div>
            <div v-else class="doc-preview">
              <!-- 文件产出与确认归档（对齐阶段4 面板形态） -->
              <div class="rwb-panel-title">文件产出与确认归档</div>

              <!-- 文件卡片 -->
              <div class="rwb-file-card">
                <div class="rwb-file-icon"><i class="el-icon-document"></i></div>
                <div class="rwb-file-info">
                  <b>{{ activeTask.name }}.docx</b>
                  <span>已按锁定模板渲染 · 含附表 {{ docPreviewMeta.tables }} 张</span>
                </div>
                <el-button size="small" @click="$message.info('已打开定稿预览（演示）')">预览</el-button>
                <el-dropdown size="small" trigger="click" @command="k => $message.success('已导出 ' + k + ' 格式（演示）')">
                  <el-button size="small">导出报告<i class="el-icon-arrow-down el-icon--right"></i></el-button>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item command="DOCX">Word 文档<span class="rwb-export-desc">可编辑</span></el-dropdown-item>
                    <el-dropdown-item command="PDF">PDF<span class="rwb-export-desc">带水印归档件</span></el-dropdown-item>
                    <el-dropdown-item command="XLSX">Excel 附表<span class="rwb-export-desc">仅数据表</span></el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
              </div>

              <!-- 报送包 -->
              <div class="rwb-bundle-line">
                <span class="rwb-bundle-label">报送包</span>
                <span class="rwb-bundle-desc">报告 1 份 · 附表 {{ docPreviewMeta.tables }} 张 · 佐证材料 {{ docPreviewMeta.proofTotal }} 项<template v-if="docStats.pending || docStats.missing"><b class="rwb-bundle-warn">（{{ docStats.missing }} 项待补{{ docStats.pending ? ' · ' + docStats.pending + ' 项待确认' : '' }}）</b></template></span>
                <span class="rwb-bundle-act" @click="$message.info('已打开佐证材料清单（演示）')"><i class="el-icon-collection"></i> 查看清单</span>
                <span class="rwb-bundle-act" @click="$message.success('已打包下载（演示）')"><i class="el-icon-folder-add"></i> 打包下载</span>
              </div>

              <!-- 格式校验胶囊 -->
              <div class="rwb-fmt-caps">
                <span class="rwb-fmt-cap"><i class="el-icon-circle-check"></i> 公文版式合规</span>
                <span class="rwb-fmt-cap"><i class="el-icon-circle-check"></i> 正文 {{ docPreviewMeta.chapters - docPreviewMeta.tables }} 部分 + 附表 {{ docPreviewMeta.tables }} 张齐备</span>
                <span class="rwb-fmt-cap"><i class="el-icon-circle-check"></i> 法定落款与签章位完整</span>
              </div>

              <!-- 证据核验 -->
              <div class="rwb-evidence-line">
                <span class="rwb-evidence-label">证据核验</span>
                <span class="rwb-bundle-act" @click="$message.info('已打开数据溯源链（演示）')"><i class="el-icon-view"></i> 数据溯源链</span>
                <span class="rwb-evidence-hint">逐级下钻至原始采集 · 只读</span>
              </div>

              <!-- 审核签发 -->
              <div class="rwb-panel-title" style="margin-top:16px;">审核签发
                <el-tag size="mini" :type="activeTask.submitted ? 'success' : 'warning'" effect="plain">
                  {{ activeTask.submitted ? '已归档' : (docAuditChain.filter(n => n.done).length + '/' + docAuditChain.length + ' 级通过') }}
                </el-tag>
                <span class="rwb-panel-sub">多级审核全部通过后方可签字归档；退回后需修改并重新送审</span>
              </div>
              <div class="rwb-mode-line">
                <span class="rwb-mode-label">审批模式</span>
                <el-tag size="mini" type="warning" effect="plain">{{ docAuditChain.length }} 级审批（{{ docAuditChain.length }} 节点链）</el-tag>
                <span style="font-size: 13px;color:#909399;margin-left:8px;">审批层级与审核人已在创建任务时锁定，编排内不可切换</span>
              </div>
              <div class="rwb-audit">
                <div v-for="(lv, li) in docAuditChain" :key="'au-' + li" class="rwb-audit-level">
                  <div class="rwb-audit-line" :class="{ 'is-last': li === docAuditChain.length - 1 }"></div>
                  <div :class="['rwb-audit-badge', lv.done ? 'ok' : 'idle']">
                    <i :class="lv.done ? 'el-icon-check' : 'el-icon-more'"></i>
                  </div>
                  <div class="rwb-audit-body">
                    <div class="rwb-audit-head">
                      <b>{{ lv.name }}</b>
                      <el-tag size="mini" :type="lv.done ? 'success' : 'info'" effect="plain">{{ lv.done ? '已通过' : '待审核' }}</el-tag>
                      <span class="rwb-audit-by">{{ lv.by }}</span>
                    </div>
                    <div class="rwb-audit-actions">
                      <el-button size="mini" type="primary" plain :disabled="lv.done || activeTask.submitted" @click="docPassAudit(li)">通过</el-button>
                      <el-button size="mini" :disabled="lv.done || activeTask.submitted" @click="$message.info('已退回上一环节（演示）')">退回修改</el-button>
                      <el-button size="mini" type="text" @click="$message.info('批注功能（演示）')">添加批注</el-button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 归档信息 -->
              <div class="rwb-evidence-line" style="margin-top:12px;">
                <span class="rwb-evidence-label">归档信息</span>
                <span class="rwb-evidence-hint" v-if="docPreviewMeta.receiptNo">回执号 <b>{{ docPreviewMeta.receiptNo }}</b> · 提交时间 {{ docPreviewMeta.receiptTime }}</span>
                <span class="rwb-evidence-hint" v-else>尚未归档（签字归档后生成回执号与内容指纹）</span>
                <span class="rwb-evidence-hint" v-if="docPreviewMeta.fingerprint">· 指纹 <code>{{ docPreviewMeta.fingerprint }}</code></span>
              </div>
            </div>

          <!-- 底部：按模式给不同操作 -->
          <div v-if="docViewMode === 'edit'" class="doc-footer">
            <span class="doc-footer-hint"><i class="el-icon-info"></i> 点击任一项可在左侧与小易确认来源与取值</span>
            <span class="doc-footer-btns">
              <el-button size="small" icon="el-icon-refresh-left" @click="resetToInitial">恢复初始版本</el-button>
              <el-button size="small" icon="el-icon-circle-check" @click="docFullCheck">全篇校验</el-button>
              <el-button size="small" type="primary" icon="el-icon-document-checked" @click="docFinalize">生成定稿</el-button>
            </span>
          </div>
          <div v-else class="doc-footer">
            <span class="doc-footer-hint">
              <i class="el-icon-lock"></i>
              <template v-if="activeTask.submitted">报告已归档，内容指纹已固化，不可再修改</template>
              <template v-else-if="docAuditChain.filter(n => n.done).length < docAuditChain.length">
                多级审核未全部通过（{{ docAuditChain.filter(n => n.done).length }}/{{ docAuditChain.length }}），需完成审核后方可签字归档
              </template>
              <template v-else>定稿为只读版本；如需修改请切回「编制」</template>
            </span>
            <span class="doc-footer-btns">
              <el-button size="small" icon="el-icon-back" @click="docViewMode = 'edit'">返回编制</el-button>
              <el-button v-if="!activeTask.submitted" size="small" type="primary" icon="el-icon-s-check"
                :disabled="docAuditChain.filter(n => n.done).length < docAuditChain.length"
                @click="docArchive">签字确认并归档</el-button>
              <el-button v-else size="small" type="success" icon="el-icon-finished" disabled>已归档</el-button>
            </span>
          </div>
        </div>

        <!-- 四阶段步骤条（形式B 成稿校核式下不显示阶段） -->
        <div v-if="!isDocumentMode" class="rwb-stepper">
          <template v-for="(st, i) in stages">
            <div :key="st.n" :class="['rwb-step', { active: activeStage === st.n, done: activeStage > st.n }]" @click="gotoStage(st.n)">
              <span class="rwb-step-dot">
                <i v-if="activeStage > st.n" class="el-icon-check"></i>
                <span v-else>{{ st.n }}</span>
              </span>
              <span class="rwb-step-label">{{ st.name }}</span>
            </div>
            <div v-if="i < stages.length - 1" :key="'l' + st.n" :class="['rwb-step-line', { done: activeStage > st.n }]"></div>
          </template>
        </div>

        <div v-if="!isDocumentMode" class="rwb-main">
          <!-- 阶段一：模板匹配与主体核对（报表清单告知"要交什么"，概况核对主体与边界） -->
          <div v-if="!isDocumentMode && activeStage === 1" class="rwb-panel">
            <!-- 只读存证徽章（PRD 3.2 锁定语义：任务创建时已固化 templateLock，此处仅展示，不做二次锁定） -->
            <div class="rwb-lock-badge">
              <i class="el-icon-lock"></i>
              <b>任务基准已锁定</b>
              <span>{{ templateInfo ? templateInfo.docName : '—' }} · {{ templateInfo ? templateInfo.version : '—' }}</span>
              <span class="rwb-lock-sub">在途任务不受后续改版影响</span>
            </div>

            <!-- ① 场景路由与核算依据摘要（结论卡）：3 秒看懂口径与依据，海量条文收纳进右侧抽屉按需下钻 -->
            <div class="rs-pd-section">
              <div class="rs-pd-title">场景路由与核算依据摘要</div>
              <div class="rs-pd-card">
                <!-- 依据警示条：当且仅当标准废止 / 更新预警 / 模板库改版时出现，平时高度为 0 不占位 -->
                <div v-if="(standardStatus && standardStatus.state !== 'ok') || policyUpdateWarning || templateDrift" class="rwb-warn-banner">
                  <i class="el-icon-warning-outline"></i>
                  <template v-if="standardStatus && standardStatus.state !== 'ok'">{{ standardStatus.text }}——请核对依据适用性</template>
                  <template v-else-if="policyUpdateWarning">标准库已发布更高生效版本（现行 {{ policyUpdateWarning.currentVersion }}），本任务仍按创建时锁定版本执行</template>
                  <template v-else-if="templateDrift">模板库已更新至 {{ templateDrift.current }}{{ templateDrift.updateTime ? '（' + templateDrift.updateTime + '）' : '' }}，本任务仍按锁定版本 {{ templateDrift.locked }} 执行；如需改用最新版，请新建任务</template>
                </div>
                <div class="rwb-scope-row">
                  <span class="rs-pd-bd-label">适用场景</span>
                  <template v-if="activeVariant">
                    <b class="rs-pd-static">{{ activeVariant.label }}</b>
                    <span class="rwb-scope-sub">{{ activeVariant.suite }}</span>
                    <el-tag size="mini" type="success" effect="plain">场景路由已命中</el-tag>
                  </template>
                  <!-- 兜底场景选择器：企业档案信息不全导致解析未命中时，降级为手动下拉选择 -->
                  <el-select v-else-if="activeTemplate && activeTemplate.variants && activeTemplate.variants.length" :value="''" size="mini" style="flex:1;" placeholder="请选择填报场景" @change="onVariantChange">
                    <el-option v-for="v in activeTemplate.variants" :key="v.key" :label="v.label" :value="v.key">
                      <div class="rs-type-opt"><span>{{ v.label }}</span><span class="rs-type-opt-meta">{{ v.suite }}</span></div>
                    </el-option>
                  </el-select>
                  <span class="rwb-scope-basis">依据行业：{{ activePanels[1] ? (activePanels[1].industry || '—') : '—' }}</span>
                </div>
                <div class="rwb-scope-row">
                  <span class="rs-pd-bd-label">核算标准</span>
                  <b class="rs-pd-static">{{ templateInfo ? templateInfo.standard : '—' }}</b>
                  <el-tag v-if="standardStatus" size="mini" :type="standardStatus.state === 'ok' ? 'success' : 'danger'" effect="plain">{{ standardStatus.text }}</el-tag>
                  <span class="rwb-scope-sub">折标口径与规则参数见依据明细</span>
                </div>
                <div v-if="activePanels[1] && (activePanels[1].bndItems || []).length" class="rwb-scope-row">
                  <span class="rs-pd-bd-label">统计边界</span>
                  <span class="rwb-rep-scopes"><el-tag v-for="(s, si) in activePanels[1].bndItems" :key="si" size="mini" effect="plain">{{ s }}</el-tag></span>
                </div>
                <span class="rwb-drawer-link" @click="openCaliberDetail">查看完整编制依据与格式规范 <i class="el-icon-arrow-right"></i></span>
              </div>
            </div>

            <!-- ② 报表与章节范围裁定：纯数据驱动（variants.sections → stageItems / collectNa 与阶段二·三严格同源），主屏不平铺表样 -->
            <div class="rs-pd-section">
              <div class="rs-pd-title">报表与章节范围
                <el-tooltip content="本清单与后续数据采集、生成与校验消费的模板元数据严格同源；表样骨架在宽屏弹窗中查看" placement="top">
                  <i class="el-icon-warning-outline rs-pd-lock-tip"></i>
                </el-tooltip>
              </div>
              <div class="rs-pd-card">
                <div v-if="scopeBodyCount" class="rwb-scope-row">
                  <span class="rs-pd-bd-label">正文章节</span>
                  <b class="rs-pd-static">共 {{ scopeBodyCount }} 节</b>
                  <span class="rwb-scope-sub">{{ scopeBodyNames.slice(0, 2).join('、') }}等（悬停查看全部）</span>
                  <el-tooltip :content="scopeBodyNames.join('、')" placement="top"><i class="el-icon-info rs-pd-lock-tip"></i></el-tooltip>
                </div>
                <div class="rwb-scope-row">
                  <span class="rs-pd-bd-label">适用附表</span>
                  <b class="rs-pd-static">共 {{ collectRequired.length }} 套</b>
                </div>
                <div class="rwb-pill-row">
                  <el-tag v-for="ch in collectRequired" :key="sectionNo(ch) || ch.name" size="mini" effect="plain" class="rwb-pill">{{ ch.name }}</el-tag>
                </div>
                <template v-if="collectNa.length">
                  <div class="rwb-scope-row">
                    <span class="rs-pd-bd-label">依法豁免</span>
                    <b class="rs-pd-static">{{ collectNa.length }} 项</b>
                    <span class="rwb-scope-sub">不计入采集进度与完整性闸门</span>
                  </div>
                  <div class="rwb-pill-row">
                    <el-tag v-for="m in collectNa" :key="'na-' + (sectionNo(m) || m.name)" size="mini" type="info" effect="plain" class="rwb-pill">✕ {{ m.name }}（{{ m.ready }}）</el-tag>
                  </div>
                </template>
                <span class="rwb-drawer-link" @click="openTemplatePreview()">预览模板空白骨架（宽屏弹窗 · 大表支持横向滚动） <i class="el-icon-arrow-right"></i></span>
              </div>
            </div>

            <div class="rs-pd-section">
              <div class="rs-pd-title">主体概况与顶层指标
                <el-tag v-if="profileCoverage" size="mini" effect="plain" style="margin-left:4px;">
                  必填 {{ profileCoverage.total }} 项 · 已带出 {{ profileCoverage.filled }} 项<template v-if="profileCoverage.missing"> · 待补录 {{ profileCoverage.missing }} 项</template>
                </el-tag>
                <el-tag v-else size="mini" effect="plain" style="margin-left:4px;">企业档案带出 · 可编辑</el-tag>
                <span v-if="profileSet" class="rs-prof-src-note">字段由企业档案带出，可直接编辑</span>
              </div>

              <!-- 主干标识：2~3 个核心标识平铺常显；行政/人员备案与经济能耗指标收拢于下方折叠手风琴
                  （经济与能耗指标是表1 必填内容、正文与勾稽的引用源，只能收起不能剔除，保证阶段二 self 章节继承不断链） -->
              <div class="rs-pd-card">
                <div class="rs-pd-tagrow">
                  <div class="rs-pd-fact"><span class="rs-pd-bd-label">单位名称</span><b>{{ scopeIdentity[0].value }}</b></div>
                  <div class="rs-pd-fact"><span class="rs-pd-bd-label">{{ scopeIdentity[1].label }}</span><b>{{ scopeIdentity[1].value }}</b></div>
                  <div class="rs-pd-fact"><span class="rs-pd-bd-label">管理属性</span><b>{{ scopeIdentity[2].value }}</b></div>
                </div>
              </div>

              <!-- 方案A/B：能源利用状况报告字段集（分组字段 + 本期/上年/同比），按填报领域变体切换；分组默认收缩 -->
              <template v-if="profileSet">
                <div v-for="grp in profileGroups" :key="grp.key" class="rs-pd-card rs-prof-card">
                  <div class="rs-prof-head-row is-clickable" @click="toggleProfileGroup(grp.key)">
                    <span class="rs-prof-name">{{ grp.name }}</span>
                    <span :class="['rs-prof-count', { 'has-missing': grp.filled < grp.fields.length }]">
                      {{ grp.filled }}/{{ grp.fields.length }}<template v-if="grp.filled < grp.fields.length"> · 待补录 {{ grp.fields.length - grp.filled }} 项</template>
                    </span>
                    <i :class="isProfileExpanded(grp.key) ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" class="rs-prof-arrow"></i>
                  </div>
                  <el-collapse-transition>
                    <div v-show="isProfileExpanded(grp.key)">
                      <div class="rs-pd-info-grid">
                        <div v-for="f in grp.fields" :key="f.k" :class="['rs-pd-info-item', f.span2 ? 'rs-span2' : '']">
                          <span class="rs-pd-bd-label">{{ f.label }}</span>
                          <el-input v-model="profileValues[f.k]" size="mini" style="flex:1;" :placeholder="f.filled ? '' : '待补录'"></el-input>
                          <span v-if="f.unit" class="rs-prof-unit">{{ f.unit }}</span>
                          <!-- 来源标签仅在非默认来源（标准带出）时显示，避免逐字段重复噪音 -->
                          <el-tag v-if="f.src === 'std'" size="mini" effect="plain" type="info" class="rs-prof-src">标准带出</el-tag>
                        </div>
                      </div>
                    </div>
                  </el-collapse-transition>
                </div>

                <div class="rs-pd-card rs-prof-card">
                  <div class="rs-prof-head-row is-clickable" @click="toggleProfileGroup('economic')">
                    <span class="rs-prof-name">{{ profileEconomic.name }}</span>
                    <span :class="['rs-prof-count', { 'has-missing': profileEconomic.filled < profileEconomic.fields.length }]">
                      {{ profileEconomic.filled }}/{{ profileEconomic.fields.length }}<template v-if="profileEconomic.filled < profileEconomic.fields.length"> · 待补录 {{ profileEconomic.fields.length - profileEconomic.filled }} 项</template>
                    </span>
                    <i :class="isProfileExpanded('economic') ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" class="rs-prof-arrow"></i>
                  </div>
                  <el-collapse-transition>
                    <div v-show="isProfileExpanded('economic')">
                      <div class="rs-prof-table">
                        <div class="rs-prof-thead">
                          <span>指标名称</span><span>单位</span><span>本期值</span><span>上年值</span><span>同比变化率</span><span>变化情况说明</span>
                        </div>
                        <div v-for="f in profileEconomic.fields" :key="f.k" class="rs-prof-trow">
                          <span class="rs-prof-tname">{{ f.label }}</span>
                          <span class="rs-prof-tunit">{{ f.unit }}</span>
                          <el-input v-model="profileValues[f.k].cur" size="mini" placeholder="本期"></el-input>
                          <el-input v-model="profileValues[f.k].prev" size="mini" placeholder="上年"></el-input>
                          <span :class="['rs-prof-yoy', f.yoyCls]">{{ f.yoy }}</span>
                          <el-input v-model="profileValues[f.k].note" size="mini" placeholder="选填"></el-input>
                        </div>
                      </div>
                      <div class="rs-pd-card-sub">同比变化率由本期值与上年值自动计算；波动超 ±20% 时合规校验将提示填写变化情况说明</div>
                    </div>
                  </el-collapse-transition>
                </div>

                <div class="rs-pd-card rs-prof-card">
                  <div class="rs-prof-head-row is-clickable" @click="toggleProfileGroup('sign')">
                    <span class="rs-prof-name">{{ profileSign.name }}</span>
                    <span :class="['rs-prof-count', { 'has-missing': profileSign.filled < profileSign.fields.length }]">
                      {{ profileSign.filled }}/{{ profileSign.fields.length }}<template v-if="profileSign.filled < profileSign.fields.length"> · 待补录 {{ profileSign.fields.length - profileSign.filled }} 项</template>
                    </span>
                    <i :class="isProfileExpanded('sign') ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" class="rs-prof-arrow"></i>
                  </div>
                  <el-collapse-transition>
                    <div v-show="isProfileExpanded('sign')">
                      <div class="rs-pd-info-grid">
                        <div v-for="f in profileSign.fields" :key="f.k" class="rs-pd-info-item">
                          <span class="rs-pd-bd-label">{{ f.label }}</span>
                          <el-input v-model="profileValues[f.k]" size="mini" style="flex:1;" :placeholder="f.filled ? '' : '待补录'"></el-input>
                        </div>
                      </div>
                      <div class="rs-pd-card-sub">签署信息将渲染至各报表页脚；封二另需单位名称（盖章）、报告编写人员名单、分管节能负责人及法定代表人签字（盖章）</div>
                    </div>
                  </el-collapse-transition>
                </div>
              </template>

              <!-- 其他报告类型：原简版概况 -->
              <div v-else class="rs-pd-card">
                <div class="rs-pd-info-grid">
                  <div class="rs-pd-info-item"><span class="rs-pd-bd-label">单位名称</span><el-input v-model="activePanels[1].orgName" size="mini" style="flex:1;"></el-input></div>
                  <div class="rs-pd-info-item"><span class="rs-pd-bd-label">统一社会信用代码</span><el-input v-model="activePanels[1].creditCode" size="mini" style="flex:1;"></el-input></div>
                  <div class="rs-pd-info-item rs-span2"><span class="rs-pd-bd-label">单位地址</span><el-input v-model="activePanels[1].address" size="mini" style="flex:1;"></el-input></div>
                  <div class="rs-pd-info-item"><span class="rs-pd-bd-label">行业领域</span><el-input v-model="activePanels[1].industry" size="mini" style="flex:1;"></el-input></div>
                  <div class="rs-pd-info-item"><span class="rs-pd-bd-label">重点用能等级</span><el-input v-model="activePanels[1].energyLevel" size="mini" style="flex:1;"></el-input></div>
                  <div class="rs-pd-info-item rs-span2"><span class="rs-pd-bd-label">物理边界</span><el-input v-model="activePanels[1].org" size="mini" style="flex:1;"></el-input></div>
                </div>
                <div class="rs-pd-edit-row" style="align-items:flex-start;margin-top:6px;">
                  <span class="rs-pd-bd-label" style="padding-top:4px;">{{ activePanels[1].bndLabel }}</span>
                  <div style="flex:1;min-width:0;">
                    <div class="rwb-bnd-sources" style="margin-top:0;">
                      <el-tag v-for="(s, si) in activePanels[1].bndItems" :key="si" size="mini" effect="plain" closable @close="activePanels[1].bndItems.splice(si, 1)" class="rwb-bnd-src">{{ s }}</el-tag>
                    </div>
                    <el-input v-model="bndInput" size="mini" style="margin-top:6px;" placeholder="添加系统划分，回车确认" @keydown.enter.native="addBndItem"></el-input>
                  </div>
                </div>
                <div class="rs-pd-edit-row" style="margin-top:6px;padding-top:8px;border-top:1px dashed #ebeef5;"><span class="rs-pd-bd-label">责任填报部门</span><el-input v-model="activePanels[1].fillDept" size="mini" style="flex:1;"></el-input><el-tag size="mini" type="info" effect="plain" class="rwb-src-tag" style="margin-left:8px;">填报属性</el-tag></div>
              </div>
            </div>



            <!-- 贴底栏：就绪统计 + 流转按钮 -->
            <div class="rwb-actionbar">
              <span class="rwb-ab-note">确认主体标识与报表范围无误后进入数据采集（基准已锁定，范围与指标树随快照执行）</span>
              <el-button type="primary" :style="{ background: themeColor, borderColor: themeColor }" @click="gotoStage(2)">确认主体与范围，进入数据采集 →</el-button>
            </div>
          </div>

          <!-- 阶段二：数据采集与补录 -->
          <div v-if="!isDocumentMode && activeStage === 2" class="rwb-panel">
            <div class="rwb-panel-title">数据采集与补录
              <span class="rwb-panel-sub">按章节核对数据就绪度；缺项章节展开即可补录，清零后进入生成与校验</span>
            </div>
            <!-- 顶部：字段级统计行（数据总项/已确定/待处理）：去掉百分比进度条与冗余数字，口径与待办问题一致 -->
            <div class="rwb-stat-line">
              <span>数据总项 <b>{{ collectFieldStats.total }}</b> 项</span>
              <span class="rwb-stat-sep">│</span>
              <span>已确定 <b class="ok">{{ collectFieldStats.confirmed }}</b> 项</span>
              <span class="rwb-stat-sep">│</span>
              <span>待处理 <b class="warn">{{ collectFieldStats.pending }}</b> 项<template v-if="collectFieldStats.blocking">（<b class="danger">阻断 {{ collectFieldStats.blocking }}</b> 项）</template></span>
            </div>
            <div class="rwb-focus-line">
              <!-- 问题工作台视图切换（V5.1 附录 A）：待办问题（缺项+质量预警）/ 已豁免 / 全量一览 -->
              <el-radio-group v-model="chapterFilter" size="mini">
                <el-radio-button label="missing">待办问题（{{ missingChapterCount + warningChapterCount }}）</el-radio-button>
                <el-radio-button label="exempt">已豁免（{{ collectNa.length }}）</el-radio-button>
                <el-radio-button label="all">全量报表一览（{{ chapterItems.length }}）</el-radio-button>
              </el-radio-group>
              <span class="rwb-focus-actions">
                <!-- 全局补录快捷通道：批量下载缺项模板 / 批量导入回填 -->
                <el-button size="mini" type="text" icon="el-icon-download" @click="downloadMissingTemplates">批量下载缺项模板</el-button>
                <el-button size="mini" type="text" icon="el-icon-upload2" @click="openImport">批量导入回填</el-button>
              </span>
            </div>
            <!-- 首屏静态大黄框已移除：缺项信息由统计行 + 章节卡「缺项」徽章 + 底部闸门三处承载，不再重复挂彩色容器 -->
            <!-- 免填项说明已收纳至底部「系统判定与豁免依据」，不再首屏抢占视线 -->
            <!-- 采集清单：按报表章节分组，表级状态与字段明细同处一栏
                 （此前「表级清单 + 字段明细」两处重复同一批表的表名/状态/就绪度，已合并） -->
            <div class="rwb-chapters" style="margin-top:14px;">
              <div v-for="ch in visibleChapters" :key="ch.name" class="rwb-chapter" :class="{ 'is-missing': ch.status === '缺项', 'is-done': ch.status !== '缺项' && isJustCompleted(ch), 'is-exempt': ch.status === '不适用' }" :data-sec="sectionNo(ch)">
                <div class="rwb-ch-head" @click="toggleChapter(ch)">
                  <i :class="isChapterOpen(ch) ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" class="rwb-ch-arrow"></i>
                  <span class="rwb-ch-name">{{ ch.name }}</span>
                  <!-- 缺项章节显示字段级补齐进度：避免"每行都有值"被误读为整表完成（闸门按字段级空值判定） -->
                  <el-tag size="mini" :type="ch.status === '缺项' ? 'warning' : (ch.status === '不适用' ? 'info' : 'success')" effect="plain">{{ ch.status === '缺项' ? ('缺项 · 已填 ' + filledCountOf(ch) + '/' + (ch.fields || []).length) : (ch.status === '不适用' ? 'EXEMPT · 已豁免' : (isJustCompleted(ch) ? '✓ 已补齐' : ch.status)) }}</el-tag>
                  <span class="rwb-ch-count">{{ (ch.fields || []).length }} 项<template v-if="ch.totalFields && ch.totalFields > (ch.fields || []).length"> / 共 {{ ch.totalFields }} 项</template></span>
                  <el-button v-if="ch.status === '缺项'" size="mini" type="text" class="rwb-ch-act" @click.stop="downloadImportTemplate(sectionNo(ch))">下载本表模板</el-button>
                  <el-button v-if="ch.status === '缺项'" size="mini" type="text" class="rwb-ch-act" @click.stop="openImport(sectionNo(ch))">导入本表</el-button>
                  <el-button v-if="ch.status === '缺项' && hasRefFields(ch)" size="mini" type="text" class="rwb-ch-act rwb-ch-batch" style="color:var(--rs-color);margin-right:8px;font-weight:600;" @click.stop="batchFillChapterRefs(ch)"><i class="el-icon-lightning"></i> 引用基准补全本表</el-button>
                  <el-button v-if="ch.status === '缺项'" size="mini" type="text" class="rwb-ch-act" @click.stop="sendCollectGuide(ch)">AI 协助</el-button>
                </div>
                <el-collapse-transition>
                  <div v-show="isChapterOpen(ch) && !isJustCompleted(ch)" class="rwb-ch-body">
                    <!-- 章节级数据来源 + TIER 来源分级徽标（V5.1 附录 A-3 文本层） -->
                    <div class="rwb-ch-src-inline"><span>数据来源</span>{{ ch.ready }}<el-tooltip :content="sourceTier(ch.ready).tip" placement="top"><span :class="['rwb-tier-tag', sourceTier(ch.ready).tier]">{{ sourceTier(ch.ready).badge }}</span></el-tooltip></div>
                    <!-- 字段级问题集合（V5.1 附录 A-4 issues[] 简化模型）：异动/守恒/缺项 -->
                    <div v-if="issuesOf(ch).length" class="rwb-issues">
                      <div v-for="(iss, ii) in issuesOf(ch)" :key="ii" :class="['rwb-issue', 'is-' + iss.severity.toLowerCase()]">
                        <i :class="iss.severity === 'BLOCKING' ? 'el-icon-circle-close' : (iss.severity === 'WARNING' ? 'el-icon-warning' : 'el-icon-info')"></i>
                        <span class="rwb-issue-desc"><b>{{ issueTypeLabel(iss.type) }}</b>{{ iss.description }}</span>
                        <span class="rwb-issue-fix">{{ iss.suggestedFix }}</span>
                      </div>
                    </div>
                    <!-- 复合阻断处置（仅 BLOCKING 触发）：默认收起为一行处置条（不常驻打断填表），展开后三步闭环 -->
                    <div v-if="needDispose(ch)" class="rwb-dispose-bar">
                      <i class="el-icon-circle-close"></i>
                      <span>阻断 {{ blockingCount(ch) }} 项 · 复合处置（差异归因 → 规则确认 → 消除违背）</span>
                      <span class="rwb-dispose-toggle" @click="toggleDispose(ch)">{{ disposeOpenOf(ch) ? '收起处置' : '展开处置' }}</span>
                    </div>
                    <el-collapse-transition>
                      <div v-if="needDispose(ch) && disposeOpenOf(ch)" class="rwb-dispose">
                        <div class="rwb-dispose-head"><i class="el-icon-s-operation"></i> 复合处置 · 三步消除质量阻断</div>
                        <div class="rwb-dispose-step">
                          <span class="rwb-ds-no">1</span><b>差异归因</b>
                          <span v-for="c in ['生产工况变化', '统计口径调整', '计量误差', '填报笔误']" :key="c" :class="['rwb-ds-chip', { active: disposeOf(sectionNo(ch)).cause === c }]" @click="setDispose(ch, 'cause', c)">{{ c }}</span>
                        </div>
                        <div class="rwb-dispose-step">
                          <span class="rwb-ds-no">2</span><b>规则确认</b>
                          <span :class="['rwb-ds-chip', { active: disposeOf(sectionNo(ch)).rule === 'fix' }]" @click="setDispose(ch, 'rule', 'fix')">纠偏数值（回填正确口径）</span>
                          <span :class="['rwb-ds-chip', { active: disposeOf(sectionNo(ch)).rule === 'waive' }]" @click="setDispose(ch, 'rule', 'waive')">提交工况豁免说明（留痕放行）</span>
                        </div>
                        <div class="rwb-dispose-step">
                          <span class="rwb-ds-no">3</span><b>消除违背</b>
                          <span v-if="disposeOf(sectionNo(ch)).rule === 'fix'" class="rwb-ds-hint">请修正<span class="rwb-ds-locate" @click="locateBlockingField(ch)">下方问题字段行（点击定位）</span>——改对后阻断自动消除、看板实时回落</span>
                          <template v-else-if="disposeOf(sectionNo(ch)).rule === 'waive'">
                            <el-input v-model="disposeFlows[sectionNo(ch)].note" size="mini" style="width: 260px;" placeholder="填写工况豁免说明（随报告留痕）" />
                            <el-button size="mini" plain class="rwb-btn-warn" @click="waiveChapterIssues(ch)">确认留痕并放行</el-button>
                          </template>
                          <span v-else class="rwb-ds-hint">请先完成差异归因与规则确认</span>
                        </div>
                      </div>
                    </el-collapse-transition>
                    <!-- EXEMPT 豁免判定依据（V5.1 附录 A-2）：附档案字段与条款，不计入闸门 -->
                    <div v-if="ch.status === '不适用'" class="rwb-exempt-basis">
                      <i class="el-icon-circle-check"></i>
                      EXEMPT 豁免判定：填报领域为「{{ activeTask.field }}」，按附件2 编制要求本任务仅报「{{ activeVariant.label }}」场景对应表格（来源：{{ sourceTier(ch.ready).label }}）；豁免项不计入采集进度与完整性闸门。
                    </div>
                    <!-- 主体类章节（self）：其字段即阶段一「用能单位概况」，此处不重复罗列 -->
                    <div v-if="ch.self" class="rwb-ch-self">
                      <i class="el-icon-circle-check"></i>
                      本表为用能单位主体信息，已在「阶段一 · 用能单位概况」核对确认（共 {{ ch.totalFields || (ch.fields || []).length }} 项），此处不重复罗列；如需修改请返回阶段一编辑。
                    </div>
                    <template v-else>
                      <!-- 规范化数据表格：指标名称 | 填报口径说明 | 上期基准 | 本期填报值（单位内嵌后缀），列宽对齐统一 -->
                      <div class="rwb-ch-row rwb-ch-th">
                        <span class="rwb-fd-idx">#</span>
                        <span class="rwb-fd-name">数据项名称</span>
                        <span class="rwb-fd-hint">填报口径 / 说明</span>
                        <span class="rwb-fd-ref">上期基准</span>
                        <span class="rwb-fd-fill">本期填报值（必填）</span>
                      </div>
                      <div v-for="(f, fi) in ch.fields" :key="fi" class="rwb-ch-row" :data-fd="f.name">
                        <span class="rwb-fd-idx">{{ fi + 1 }}</span>
                        <span class="rwb-fd-name">{{ f.name }}<el-tag v-if="!String(f.value || '').trim()" size="mini" type="warning" effect="plain" style="margin-left:6px;">待补录</el-tag><el-tooltip v-else-if="ch.status === '缺项'" content="该字段已有值；整表补齐后章节才会流转为已采集" placement="top"><el-tag size="mini" type="success" effect="plain" style="margin-left:6px;cursor:help;">已填</el-tag></el-tooltip><el-tooltip v-else :content="'来源：' + ch.ready" placement="top"><el-tag size="mini" type="success" effect="plain" style="margin-left:6px;cursor:help;">已导入 {{ f.value }}</el-tag></el-tooltip><el-tooltip v-if="f.waived" :content="f.waived" placement="top"><el-tag size="mini" type="info" effect="plain" style="margin-left:6px;">已豁免留痕</el-tag></el-tooltip></span>
                        <span class="rwb-fd-hint">{{ f.hint }}</span>
                        <span class="rwb-fd-ref">{{ f.ref || '—' }}</span>
                        <!-- 在线填报：缺项章节可直接填写本期值（填完即采集，状态联动）；单位内嵌为输入框后缀，消除数字与单位脱节；
                             点击输入框时左侧安静弹出该数据项的出处依据线索卡（一键填入），交互重心保持在右侧 -->
                        <span class="rwb-fd-fill">
                          <div v-if="ch.status === '缺项' && isBoolField(f)" class="rwb-fd-bool" @click="showClueCard(ch, f)">
                            <span :class="['rwb-bool-opt', { active: f.value === '是' }]" @click="setBoolValue(ch, f, '是')">是</span>
                            <span :class="['rwb-bool-opt', { active: f.value === '否' }]" @click="setBoolValue(ch, f, '否')">否</span>
                          </div>
                          <div v-else-if="ch.status === '缺项'" class="rwb-fd-input-wrap">
                            <el-input v-model="f.value" size="mini" class="rwb-fd-input" :placeholder="f.ref ? '参考 ' + f.ref : (f.unit && /文本/.test(f.unit) ? '填写说明文字' : '待补录')" @focus="showClueCard(ch, f)" @change="refreshItemStatus(ch)">
                              <template v-if="f.unit && f.unit.length <= 8 && !/文本/.test(f.unit)" slot="append">{{ f.unit }}</template>
                            </el-input>
                            <span v-if="!String(f.value || '').trim() && f.ref && f.ref !== '—'" class="rwb-fd-quick-fill" title="点击引用上期历史基准值快速填入" @click.stop="quickFillRef(ch, f)">
                              <i class="el-icon-magic-stick"></i> 引用上期({{ f.ref }})
                            </span>
                          </div>
                          <span v-if="ch.status === '缺项' && f.unit && f.unit.length > 8" class="rwb-fd-unit-ext">{{ f.unit }}</span>
                          <span v-else-if="!ch.status || ch.status !== '缺项'" class="rwb-fd-filled">{{ f.value || '—' }}<em v-if="f.unit" class="rwb-fd-unit-txt"> {{ f.unit }}</em></span>
                          <i v-if="ch.status === '缺项' && f.value" class="el-icon-circle-check rwb-fd-ok"></i>
                          <el-tooltip v-if="f.devWarn" :content="f.devWarn" placement="top"><i class="el-icon-warning rwb-fd-dev"></i></el-tooltip>
                        </span>
                      </div>
                    </template>
                  </div>
                </el-collapse-transition>
              </div>
              <!-- 仅看缺项且缺项清零时的空态 -->
              <div v-if="!visibleChapters.length" class="rwb-ch-empty">
                <i class="el-icon-circle-check"></i> 无待办问题——可切回「全量报表一览」查看完整清单
              </div>
            </div>

            <!-- 系统判定与豁免依据：表23~24 等免填表格收纳到底部（默认折叠、中性灰），首屏视线让给待办问题 -->
            <div v-if="collectNa.length && chapterFilter !== 'exempt'" class="rwb-exempt-fold" @click="naOpen = !naOpen">
              <i class="el-icon-lock"></i>
              <span class="rwb-exempt-summary">系统判定与豁免依据：{{ collectNa.length }} 项免填（{{ collectNa.map(m => m.name).join('、') }}），不计入采集进度与闸门——点击展开判定依据</span>
              <i :class="naOpen ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" class="rwb-exempt-arrow"></i>
              <div v-if="naOpen" class="rwb-exempt-detail">填报领域为「{{ activeTask.field }}」，按附件2 规范本任务仅报「{{ activeVariant.label }}」场景对应表格；免填项不计入采集进度与完整性闸门，逐项判定明细可在「已豁免」页签查看。</div>
            </div>

            <!-- 底部：完整性 + 质量 双闸门（Sticky）——未清零列出具体缺项（可点击定位），质量阻断未清零同样不放行 -->
            <div class="rwb-actionbar" :class="{ 'is-complete': collectRate >= 100 && !collectFieldStats.blocking }">
              <span class="rwb-ab-note">
                <template v-if="collectMissing.length">
                  <i class="el-icon-warning-outline"></i>
                  尚存 {{ collectMissing.length }} 个缺项章节待处理：<template v-for="(m, mi) in collectMissing"><a :key="sectionNo(m)" class="rwb-ab-link" @click="locateField(sectionNo(m))">{{ m.name }}</a><span class="rwb-ab-gap">（差 {{ missingFieldsOf(m).length }} 项：</span><template v-for="(mf, mfi) in missingFieldsOf(m)"><a :key="mf.name" class="rwb-ab-link" @click="focusMissingField(sectionNo(m), mf.name)">{{ mf.name }}</a><span v-if="mfi < missingFieldsOf(m).length - 1" :key="mf.name + '-d'">、</span></template><span class="rwb-ab-gap">）</span><span v-if="mi < collectMissing.length - 1" :key="sectionNo(m) + '-d'">；</span></template>
                </template>
                <template v-else-if="collectFieldStats.blocking">
                  <i class="el-icon-circle-close" style="color:#f56c6c"></i>
                  质量守卫：尚有 {{ collectFieldStats.blocking }} 项阻断问题待处置（见待办问题中的复合处置卡片）
                </template>
                <template v-else>
                  <i class="el-icon-circle-check" style="color:#67c23a"></i>
                  缺项已全部补齐、质量守卫通过，完整性闸门已放行
                </template>
              </span>
              <!-- 清零守卫的状态联动：缺项/阻断未清零时按钮物理置灰并改写文案（不做可点蓝钮+拦截 Toast 的诱导式交互） -->
              <el-button type="primary" :class="gateBlocked ? 'rs-guard-off' : 'rwb-pulse'" :disabled="gateBlocked" :style="gateBlocked ? {} : { background: themeColor, borderColor: themeColor }" @click="gotoStage(3)">{{ gateBlocked ? '待缺项清零后放行（尚有 ' + (collectFieldStats.pending + collectMissing.length) + ' 项待办）' : '进入生成与校验 →' }}</el-button>
            </div>
          </div>

          <!-- 阶段三：生成与校验（原阶段三 + 原阶段四合并：校验区置于面板顶部，异常时自动展开并需处置清零） -->
          <div v-if="!isDocumentMode && activeStage === 3" class="rwb-panel">
            <div class="rwb-panel-title">生成与校验
              <span class="rwb-panel-sub">系统按锁定口径换算并受控生成叙述；确认生成时自动执行硬规则校验，异常清零后可进入文件产出</span>
            </div>
            <!-- 监管预审合规体检卡 (Pre-audit Compliance Card) -->
            <div class="rwb-preaudit-card" :class="checkSummary.blocking ? 'is-pending' : 'is-pass'">
              <div class="rwb-pac-top">
                <div class="rwb-pac-badge">
                  <i :class="checkSummary.blocking ? 'el-icon-warning-outline' : 'el-icon-circle-check'"></i>
                  <span>{{ checkSummary.blocking ? '监管预审 · 待清阻断' : '监管预审 · 100% 合规合格' }}</span>
                </div>
                <div class="rwb-pac-result">
                  <span class="rwb-pac-res-tag" :class="checkSummary.blocking ? 'is-warn' : 'is-ok'">
                    {{ checkSummary.blocking ? '⚠️ 存在主管机关驳回风险' : '✓ 具备法定上报合规性（预计一次性受理通过率 100%）' }}
                  </span>
                </div>
              </div>
              <div class="rwb-pac-grid">
                <div class="rwb-pac-item">
                  <span class="rwb-pac-k">主管部门规范比对</span>
                  <span class="rwb-pac-v"><i class="el-icon-check"></i> 100% 格式对齐（锁定模板一致）</span>
                </div>
                <div class="rwb-pac-item">
                  <span class="rwb-pac-k">法定逻辑与平衡勾稽</span>
                  <span class="rwb-pac-v"><i class="el-icon-check"></i> 100% 守恒自洽（无断链算式）</span>
                </div>
                <div class="rwb-pac-item">
                  <span class="rwb-pac-k">阻断性质量异常项</span>
                  <span class="rwb-pac-v" :style="{ color: checkSummary.blocking ? '#f56c6c' : '#67c23a', fontWeight: 'bold' }">
                    {{ checkSummary.blocking ? checkSummary.blocking + ' 项待处理' : '0 阻断（全部清零/留痕放行）' }}
                  </span>
                </div>
                <div class="rwb-pac-item">
                  <span class="rwb-pac-k">数据源头穿透核验</span>
                  <span class="rwb-pac-v"><i class="el-icon-connection"></i> 全项打通底层通用电表/台账底座</span>
                </div>
              </div>
            </div>

            <!-- 校验区（置顶）：校验在确认生成结果时自动执行，用户无需切换阶段即可看到结果与处置 -->
            <div :class="['rwb-verify-zone', checkSummary.blocking ? 'has-anomaly' : ((checkSummary.hasAnomaly || checkSummary.escalatedCount) ? 'is-warning' : 'is-pass')]">
              <div class="rwb-vz-head" @click="verifyExpanded = !verifyOpen">
                <i :class="checkSummary.blocking ? 'el-icon-warning-outline' : ((checkSummary.hasAnomaly || checkSummary.escalatedCount) ? 'el-icon-warning' : 'el-icon-circle-check')"></i>
                <b>校验（格式合规 + 数据逻辑）</b>
                <!-- 分级标签：通过 / 待处置 / 待人工核验 / 豁免说明——只有全清（含人工核验归零）才切稳态纯绿 -->
                <el-tag size="mini" type="success" effect="dark">{{ checkSummary.pass }} 项通过</el-tag>
                <el-tag v-if="checkSummary.pendingCount" size="mini" type="danger" effect="dark">{{ checkSummary.pendingCount }} 项待处置</el-tag>
                <el-tag v-if="checkSummary.awaitingCount" size="mini" type="warning" effect="dark">{{ checkSummary.awaitingCount }} 项待人工确认说明</el-tag>
                <el-tag v-if="checkSummary.confirmedCount" size="mini" type="success" effect="plain">{{ checkSummary.confirmedCount }} 项已人工确认</el-tag>
                <el-tag v-if="checkSummary.waivedCount" size="mini" type="info" effect="plain">{{ checkSummary.waivedCount }} 项豁免说明</el-tag>
                <span class="rwb-vz-text">{{ checkSummary.summaryText }}</span>
                <el-button size="mini" type="text" class="rwb-vz-toggle">{{ verifyOpen ? '收起明细' : '查看明细' }} <i :class="verifyOpen ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i></el-button>
              </div>
              <!-- 异常项快捷锚点：点击就地平滑滚动并高亮对应章节 / 表格，免于在长报告中来回查找 -->
              <div v-if="verifyAnchors.length" class="rwb-vz-anchors">
                <span v-for="(a, ai) in verifyAnchors" :key="ai" :class="['rwb-vz-anchor', a.cls]" @click.stop="locateReportSection(a.sec, a.title)">
                  <i class="el-icon-aim"></i>{{ a.title }}
                </span>
              </div>
              <el-collapse-transition>
                <div v-show="verifyOpen" class="rwb-vz-body">
                  <!-- 校验状态总览（客观计数，不做加权评分）：通过数 / 总规则数 + 待处置数（阻断 / 建议拆分）；
                       下方明细按状态或分组快捷过滤，无需在全量表格里肉眼找红字 -->
                  <div :class="['rwb-vz-summary', checkSummary.hasAnomaly ? 'is-warn' : 'is-ok']">
                    <div class="rwb-vzs-line">
                      <i :class="checkSummary.hasAnomaly ? 'el-icon-warning-outline' : 'el-icon-circle-check'"></i>
                      <span v-if="checkSummary.hasAnomaly">校验未全部通过：共 <b>{{ checkSummary.total }}</b> 项规则，已通过 <b>{{ checkSummary.pass }}</b> 项，待处置 <b>{{ verifyPendingCount }}</b> 项（阻断 {{ verifyBlockingCount }} 项 · 建议 {{ verifyPendingCount - verifyBlockingCount }} 项）</span>
                      <span v-else>校验全部通过：共 <b>{{ checkSummary.total }}</b> 项规则，已通过 <b>{{ checkSummary.pass }}</b> 项</span>
                    </div>
                    <div class="rwb-vzs-chips">
                      <span :class="['rwb-vzs-chip', { active: verifyFilter === 'all' }]" @click="verifyFilter = 'all'">全部 ({{ checkSummary.total }})</span>
                      <span :class="['rwb-vzs-chip', 'is-pending', { active: verifyFilter === 'pending' }]" @click="verifyFilter = 'pending'">待处置 ({{ verifyPendingCount }})</span>
                      <span v-for="g in checkSummary.groups" :key="g.category"
                        :class="['rwb-vzs-chip', { active: verifyFilter === g.category }]" @click="verifyFilter = g.category">{{ g.category }} ({{ g.pass }}/{{ g.total }})</span>
                    </div>
                  </div>

                  <!-- 校验明细：按分组展示（格式合规 / 数据逻辑），悬停可看规则说明与判定依据 -->
                  <div v-for="g in verifyGroups" :key="g.category" class="rwb-check-group">
                    <div class="rwb-check-group-title">{{ g.category }}（{{ g.pass }}/{{ g.total }} 通过）</div>
                    <div class="rwb-table">
                      <div class="rwb-tr rwb-th"><span>校验项</span><span>结果</span><span>阈值</span><span>判定</span></div>
                      <div v-for="row in g.items" :key="row.id" class="rwb-tr">
                        <span :title="row.desc">{{ row.name }}<em v-if="!row.blocking" class="rwb-check-soft">建议项</em></span>
                        <span>{{ row.value }}</span>
                        <span class="text-muted" :title="row.standard">{{ row.threshold }}</span>
                        <span><el-tag size="mini" :type="row.pass ? 'success' : 'danger'">{{ row.pass ? '通过' : '异常' }}</el-tag></span>
                      </div>
                    </div>
                  </div>
                  <div v-if="verifyFilter !== 'all' && !verifyGroups.length" class="rwb-check-empty" style="margin-top:10px;">
                    <i class="el-icon-circle-check"></i> 当前筛选下无待处置校验项。
                  </div>
                  <div v-if="!verifyCards.length" class="rwb-check-empty" style="margin-top:10px;">
                    <i class="el-icon-circle-check"></i> 全部校验项通过，无待处置异常。
                  </div>
                  <div v-for="(card, ci) in verifyCards" :key="card.id" class="rwb-anomaly-card" style="margin-top:10px;">
                    <div class="rwb-ac-head">
                      <el-tag size="mini" :type="card.resolved ? 'success' : (card.escalated ? 'warning' : 'danger')" effect="dark">{{ card.resolved ? '已人工确认' : (card.escalated ? '待人工确认说明' : (card.level || '异常')) }}</el-tag>
                      <b>{{ card.title }}</b>
                    </div>
                    <p class="rwb-ac-desc">{{ card.desc }}</p>
                    <div class="rwb-ac-suggest"><i class="el-icon-lightning"></i> {{ card.suggest }}</div>
                    <!-- 待处置：可由系统重算消除（确认处置），或移交人工（转人工核实） -->
                    <div v-if="!card.escalated && !card.resolved" class="rwb-ac-actions">
                      <el-button size="mini" type="primary" @click="resolveCard(ci)">确认处置</el-button>
                      <el-button size="mini" @click="escalateCard(ci)">转人工核实</el-button>
                      <el-dropdown size="mini" trigger="click" class="rwb-ac-more" @command="cmd => onCardAction(ci, cmd)">
                        <span class="rwb-ac-more-btn">其他处置方式<i class="el-icon-arrow-down"></i></span>
                        <el-dropdown-menu slot="dropdown">
                          <el-dropdown-item v-for="a in cardActions" :key="a.key" :command="a.key">{{ a.label }}</el-dropdown-item>
                        </el-dropdown-menu>
                      </el-dropdown>
                    </div>
                    <!-- 已转人工：必须显式处置——填写偏差合理解释并盖章，或退回阶段二重新采集补水；未处置则持续阻断放行 -->
                    <div v-else-if="!card.resolved" class="rwb-ac-confirm">
                      <div class="rwb-ac-confirm-tip"><i class="el-icon-warning-outline"></i> 该项已移交人工，须由经办人填写偏差合理解释后方可放行（说明随报告附注与修订留痕归档）</div>
                      <el-input v-model="card.note" type="textarea" :rows="2" size="mini" maxlength="200" show-word-limit
                        placeholder="请填写偏差合理解释，如：化成工序待机能耗未纳入 MES 采集范围，已核对计量点归属，差异属统计口径差异，不影响报表结果"></el-input>
                      <div class="rwb-ac-actions">
                        <el-button size="mini" type="primary" :disabled="!canConfirmNote(card)" @click="confirmCardNote(ci)">确认说明并盖章</el-button>
                        <el-button size="mini" @click="sendBackForCollect(ci)">退回重新采集补水</el-button>
                      </div>
                    </div>
                    <!-- 已人工确认：盖戳记，解除阻断 -->
                    <div v-else class="rwb-ac-stamp">
                      <div class="rwb-ac-stamp-mark"><i class="el-icon-circle-check"></i> 已人工确认</div>
                      <div class="rwb-ac-stamp-body">
                        <div class="rwb-ac-stamp-note">偏差说明：{{ card.note }}</div>
                        <div class="rwb-ac-stamp-meta">经办人：{{ card.stamp.by }} · 确认时间：{{ card.stamp.at }} · 已写入修订留痕与报告附注</div>
                      </div>
                    </div>
                  </div>
                </div>
              </el-collapse-transition>
            </div>
            <div class="rwb-panel-title" style="margin-top:16px;"><span class="rwb-panel-name">报告成文画布</span>
              <span class="rwb-panel-sub">正文连续排版、所见即所得；左栏目录与质检索引可直达章节。全量 {{ stageAnnexCount }} 张附表为纯数据表，按需查阅。</span>
            </div>
            <div class="rwb-doc-layout">
              <!-- 左：章节目录与质检索引（固钉；只做跳转与高亮，异常处置唯一权威位在顶部校验区） -->
              <aside :class="['rwb-doc-toc', { 'is-collapsed': tocCollapsed }]">
                <div class="rwb-toc-title">
                  <span v-if="!tocCollapsed">章节目录与质检索引</span>
                  <i :class="tocCollapsed ? 'el-icon-s-unfold' : 'el-icon-s-fold'" class="rwb-toc-fold"
                    :title="tocCollapsed ? '展开目录（正文画布更宽）' : '收起目录（正文画布更宽）'" @click="tocCollapsed = !tocCollapsed"></i>
                </div>
                <div class="rwb-toc-list">
                  <div v-for="(ch, chi) in stageBodyChapters" :key="ch.name"
                    :class="['rwb-toc-item', { 'is-active': canvasSecIndex === chi }]" :title="ch.name" @click="scrollCanvasTo(chi)">
                    <i :class="tocSecState(ch).cls" :title="tocSecState(ch).title"></i>
                    <span v-if="!tocCollapsed" class="rwb-toc-name">{{ ch.name }}</span>
                    <template v-if="!tocCollapsed">
                      <em v-if="tocSecState(ch).badge" :class="['rwb-toc-badge', tocSecState(ch).badgeCls]">{{ tocSecState(ch).badge }}</em>
                      <!-- 改写态：待审（有未决 AI 改动）/ 已修订（改动已接受并写入正文） -->
                      <em v-if="aiPolish[chi]" class="rwb-toc-badge is-review">待审</em>
                      <em v-else-if="manualEdits[chi]" :class="['rwb-toc-badge', manualEdits[chi].numberChanged ? 'is-block' : 'is-edited']">{{ manualEdits[chi].numberChanged ? '数值待复核' : '人工修订' }}</em>
                      <em v-else-if="aiNarratives[chi] !== undefined" class="rwb-toc-badge is-edited">已修订</em>
                    </template>
                    <em v-else class="rwb-toc-idx">{{ chi + 1 }}</em>
                  </div>
                </div>
                <template v-if="!tocCollapsed && stageAnnexChapters.length">
                  <div class="rwb-toc-sub">附表 {{ stageAnnexChapters.length }} 张（纯数据表 · 只读查阅）</div>
                  <div class="rwb-toc-annex">
                    <span v-for="a in stageAnnexChapters" :key="a.name" class="rwb-toc-annex-item" @click="openAnnexInPreview(a)">{{ a.name }}</span>
                  </div>
                </template>
                <div v-if="checkSummary.blocking" class="rwb-toc-guard">
                  <i class="el-icon-warning-outline"></i>
                  <span v-if="!tocCollapsed">质检 {{ checkSummary.blocking }} 项未处置</span>
                  <em v-if="!tocCollapsed" class="rwb-toc-guard-link" @click="focusVerifyZone">去处置 →</em>
                </div>
              </aside>

              <!-- 右：报告正式成文画布（连续白底纸张流，底面合一） -->
              <section class="rwb-doc-canvas">
                <!-- 改动导航器：AI 改动是一份可完成的清单（与画布同屏，审阅不跳窗） -->
                <div v-if="aiPolishCount" class="rwb-canvas-polish-bar">
                  <i class="el-icon-magic-stick"></i>
                  <span>AI 改写改动：<b>{{ aiPolishCount }}</b> 处待审</span>
                  <em>改动保持待定，接受后才写入正文</em>
                  <span class="rwb-cpb-actions">
                    <el-button size="mini" @click="gotoNextPolish">下一处改动</el-button>
                    <el-button size="mini" @click="acceptAllPolish">全部接受</el-button>
                    <el-button size="mini" @click="rejectAllPolish">全部拒绝</el-button>
                  </span>
                </div>
                <!-- 锁定态（Q3）：已归档 / 已签字哈希锁定 / 审核通过待签 → 正文只读 -->
                <div v-if="canvasLocked" class="rwb-canvas-locked">
                  <i class="el-icon-lock"></i>
                  <span>本任务已锁定（{{ activeTask ? activeTask.status : '' }}{{ signRecord ? ' · 已签字哈希锁定' : '' }}）：正文只读，如需修订请先撤回锁定或新建修订版本。</span>
                </div>
                <div class="rwb-canvas-sheet">
                  <div class="rwb-canvas-cover">
                    <div class="rwb-canvas-org">{{ reportPreview ? reportPreview.org : '' }}</div>
                    <div class="rwb-canvas-title">{{ reportPreview ? reportPreview.title : '' }}（正文）</div>
                    <div class="rwb-canvas-meta">共 {{ stageBodyChapters.length }} 章 · 附表 {{ stageAnnexCount }} 张 · 模板 {{ templateDrift ? templateDrift.locked : '' }}</div>
                    <div v-if="!canvasLocked" class="rwb-canvas-style">
                      <span class="rp-style-label">AI 改写风格</span>
                      <el-select v-model="polishTone" size="mini" class="rp-style-sel" @change="persistPolishStyle">
                        <el-option v-for="o in polishToneOptions" :key="o.value" :label="o.label" :value="o.value">
                          <div class="rs-type-opt"><span>{{ o.label }}</span><span class="rs-type-opt-meta">{{ o.hint }}</span></div>
                        </el-option>
                      </el-select>
                      <span class="rwb-canvas-style-aud">受理部门：{{ polishAudienceLabel }}</span>
                      <span class="rwb-canvas-style-tip">作用于全部章节的 AI 改写；数值 / 术语 / 篇幅三道护栏照旧生效</span>
                    </div>
                  </div>
                  <div v-for="(ch, chi) in canvasChapters" :key="ch.name" :id="'rwb-sec-' + chi" :data-rsec="ch.name"
                    :class="['rwb-canvas-sec', { 'is-flash': canvasSecIndex === chi }]">
                    <div class="rwb-canvas-sec-head">
                      <h3 class="rwb-canvas-h">{{ ch.name }}</h3>
                      <span class="rwb-canvas-sec-ops">
                        <el-button size="mini" type="text" :disabled="!!adopted[sectionNo(ch)]" @click="onAdoptChapter(ch)">{{ adopted[sectionNo(ch)] ? '已采纳 ✓' : '采纳' }}</el-button>
                        <el-button size="mini" type="text" @click="onRegenChapter(ch)">重新生成</el-button>
                      </span>
                    </div>
                    <div v-if="ch.content.table" class="rwb-table rwb-doc-table">
                      <div class="rwb-tr rwb-th">
                        <!-- key 用位置索引：附件2 部分表（如表27）左右两组列名相同，用列名做 key 会重复 -->
                        <span v-for="(c, ci) in ch.content.table.columns" :key="'h' + ci">{{ c }}</span>
                      </div>
                      <div v-for="(row, ri) in ch.content.table.rows" :key="ri"
                        :class="['rwb-tr', { 'rwb-tr-total': ri === ch.content.table.rows.length - 1 }]">
                        <span v-for="(c, ci) in ch.content.table.columns" :key="ci"
                          :class="{ 'rwb-val-penetrate': isPenetratable(row, c, ci) }"
                          :title="isPenetratable(row, c, ci) ? '点击穿透追溯原始数据源' : ''"
                          @click="onTableCellClick(row, c, ci, ch)">
                          {{ sectionRowValue(row, c, ci) }}
                          <i v-if="isPenetratable(row, c, ci)" class="el-icon-connection rwb-penetrate-icon"></i>
                        </span>
                      </div>
                    </div>
                    <div class="rwb-narrative" @mouseup="onCanvasMouseUp(chi)">
                      <!-- 改写就地发生：常态只显示正文（工具条 hover 才出现）；改写中/待审时以原文 vs AI 内联 diff 呈现。
                           未锁定时正文可就地打字（点击即编辑，失焦保存并留痕）；数值被改动须填口径说明 -->
                      <template v-if="!aiPolish[chi]">
                        <p :id="'rwb-narr-' + chi"
                          :class="['rwb-canvas-para', { 'is-collapsed': isNarrativeLong(ch) && !isNarrativeOpen(ch), 'is-editing': editChapter === chi }]"
                          :contenteditable="!canvasLocked && editChapter === chi"
                          :title="canvasLocked ? '文件已锁定，正文只读' : '点击可就地编辑'"
                          @click="startEditChapter(chi)" @blur="saveChapterEdit(chi)">
                          <template v-for="(seg, si) in narrativeSegments(ch)">
                            <span v-if="seg.idx === undefined" :key="'t' + si">{{ seg.text }}</span>
                            <span v-else :key="'n' + si" class="rwb-num" @click.stop="onNumClick(ch, seg, chi)">{{ seg.text }}</span>
                          </template>
                        </p>
                        <el-button v-if="isNarrativeLong(ch)" size="mini" type="text" class="rwb-narrative-toggle" @click="toggleNarrative(ch)">
                          {{ isNarrativeOpen(ch) ? '收起' : '展开全文' }}
                          <i :class="isNarrativeOpen(ch) ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
                        </el-button>
                        <div v-if="!canvasLocked" class="rp-para-tools rwb-canvas-tools" :class="{ 'is-pinned': selChapter === chi || editChapter === chi }">
                          <span class="rp-tool" @click="runPolish(chi, 'polish')"><i class="el-icon-magic-stick"></i> AI 润色</span>
                          <span class="rp-tool" @click="runPolish(chi, 'expand')">扩写</span>
                          <span class="rp-tool" @click="runPolish(chi, 'condense')">精简</span>
                          <span class="rp-tool" @click="runPolish(chi, 'rewrite')">重写</span>
                        </div>
                        <!-- 选区微调胶囊：选中文字/聚焦该段时浮出（阅读时不可见） -->
                        <div v-if="!canvasLocked && (selChapter === chi || editChapter === chi)" class="rwb-canvas-selbar">
                          <span class="rwb-sel-hint"><i class="el-icon-edit-outline"></i> {{ editChapter === chi ? '就地编辑中（失焦自动保存并留痕）' : '已选中文字' }}</span>
                          <span class="rp-tool" @click="runPolish(chi, 'polish')"><i class="el-icon-magic-stick"></i> AI 润色该段</span>
                          <span class="rp-tool" @click="revertChapterEdit(chi)"><i class="el-icon-refresh-left"></i> 撤销改动</span>
                          <span class="rp-tool is-primary" @click="saveChapterEdit(chi)"><i class="el-icon-document-checked"></i> 保存为正式稿</span>
                        </div>
                      </template>
                      <template v-else>
                        <div class="rp-diff">
                          <div class="rp-diff-row is-old">
                            <span class="rp-diff-tag">原文</span>
                            <span class="rp-diff-text">
                              <template v-if="aiPolish[chi].status === 'streaming'">{{ ch.content.narrative }}</template>
                              <template v-else>
                                <template v-for="(p, pi) in diffParts(chi, 'old')">
                                  <del v-if="p.type === 'del'" :key="pi">{{ p.text }}</del>
                                  <span v-else :key="pi">{{ p.text }}</span>
                                </template>
                              </template>
                            </span>
                          </div>
                          <div class="rp-diff-row is-new">
                            <span class="rp-diff-tag">AI {{ aiPolish[chi].modeLabel }}<template v-if="aiPolish[chi].styleLabel"> · {{ aiPolish[chi].styleLabel }}</template></span>
                            <span class="rp-diff-text">
                              <template v-if="aiPolish[chi].status === 'streaming'">{{ aiPolish[chi].text }}<i class="rp-caret"></i></template>
                              <template v-else>
                                <template v-for="(p, pi) in diffParts(chi, 'new')">
                                  <ins v-if="p.type === 'add'" :key="pi">{{ p.text }}</ins>
                                  <span v-else :key="pi">{{ p.text }}</span>
                                </template>
                              </template>
                            </span>
                          </div>
                        </div>
                        <!-- 改写护栏：数值不一致为硬伤（阻断接受），术语/篇幅异常仅提示 -->
                        <div v-if="aiPolish[chi].guard && aiPolish[chi].guard.issues.length" :class="['rp-guard', 'is-' + aiPolish[chi].guard.level]">
                          <i :class="aiPolish[chi].guard.level === 'block' ? 'el-icon-circle-close' : 'el-icon-warning-outline'"></i>
                          <div class="rp-guard-body">
                            <div v-for="(it, ii) in aiPolish[chi].guard.issues" :key="ii">{{ it }}</div>
                            <div v-if="aiPolish[chi].guard.level === 'block'" class="rp-guard-tip">该改动不可接受：报告数据须与规则引擎换算结果一致，请重新生成或拒绝。</div>
                          </div>
                        </div>
                        <div class="rp-diff-actions">
                          <template v-if="aiPolish[chi].status === 'pending'">
                            <el-button size="mini" type="primary" :disabled="aiPolish[chi].guard && aiPolish[chi].guard.level === 'block'" :style="{ background: themeColor, borderColor: themeColor }" @click="acceptPolish(chi)"><i class="el-icon-check"></i> 接受</el-button>
                            <el-button size="mini" @click="rejectPolish(chi)"><i class="el-icon-close"></i> 拒绝</el-button>
                            <el-button size="mini" type="text" @click="runPolish(chi, aiPolish[chi].mode)">重新生成</el-button>
                          </template>
                          <span v-else class="rp-diff-streaming"><i class="el-icon-loading"></i> 正在生成…</span>
                        </div>
                      </template>
                    </div>
                    <!-- 底栏：有换算依赖才出现换算入口与说明；右侧保留附表穿透入口 -->
                    <div class="rwb-doc-foot">
                      <!-- 人工修订留痕（就地编辑产生）：数值变更另标"待复核" -->
                      <span v-if="manualEdits[chi]" :class="['rwb-edit-chip', { 'is-num': manualEdits[chi].numberChanged }]">
                        <i :class="manualEdits[chi].numberChanged ? 'el-icon-warning-outline' : 'el-icon-edit-outline'"></i>
                        {{ manualEdits[chi].numberChanged ? '数值已改 · 待复核' : '人工修订' }} · {{ manualEdits[chi].by }} {{ manualEdits[chi].at }}
                      </span>
                      <template v-if="(ch.adapts || []).length || narrativeAdaptRefs(ch).length">
                        <span v-if="(ch.adapts || []).length" class="rwb-adapt-entry" @click="openAdaptDrawer(ch, 0)">
                          <i class="el-icon-set-up"></i> 口径换算依据 · {{ ch.adapts.length }} 项
                        </span>
                        <span v-else class="rwb-adapt-entry" @click="openNarrativeAdapts(ch)">
                          <i class="el-icon-set-up"></i> 换算依据 · 来自 {{ narrativeAdaptRefs(ch).length }} 张报表
                        </span>
                        <span class="rwb-doc-foot-hint">
                          <template v-if="(ch.adapts || []).length">规则引擎执行，非 AI 计算；正文数值可点击回溯</template>
                          <template v-else>本章数值由附表换算得出；点击带下划线的数值可穿透核查</template>
                        </span>
                      </template>
                      <span class="rwb-doc-goto" @click="viewChapterInPreview(ch)">在定稿版式中查看本章 <i class="el-icon-top-right"></i></span>
                    </div>
                  </div>
                </div>
                <div v-if="stageAnnexCount" class="rwb-na-note">
                  <i class="el-icon-info"></i>
                  <span>附表 {{ stageAnnexCount }} 张为纯数据表（不做文字改写）：可从左栏目录直达，或在定稿版式中通读。</span>
                </div>
              </section>
            </div>
            <div :class="['rwb-actionbar', { 'is-guarded': releaseGuarded }]">
              <span class="rwb-ab-note">
                <template v-if="releaseGuarded">
                  <i class="el-icon-warning-outline"></i>
                  <template v-if="checkSummary.awaitingCount">尚有 <b>{{ checkSummary.awaitingCount }}</b> 项数据偏差待人工确认说明</template>
                  <template v-if="checkSummary.awaitingCount && checkSummary.pendingCount">，</template>
                  <template v-if="checkSummary.pendingCount">另有 <b>{{ checkSummary.pendingCount }}</b> 项异常待处置</template>
                  ——处置完成后守卫自动放行（结论写入修订留痕与报告附注）
                </template>
                <template v-else>
                  <i class="el-icon-circle-check"></i> 校验无阻断异常{{ checkSummary.confirmedCount ? '（' + checkSummary.confirmedCount + ' 项已人工确认）' : '' }}，确认后进入文件产出
                </template>
              </span>
              <!-- 守卫未放行：以锁定徽标替代按钮（灰色、不可点击、带锁图标），避免"还有待核验项却能一键通过"；
                   处置清零后才点亮主操作蓝按钮。两态互斥渲染，不做伪禁用（伪禁用仍可点击） -->
              <span v-if="releaseGuarded" class="rwb-guard-lock" title="存在未处置异常，守卫未放行">
                <i class="el-icon-lock"></i> 待处置完成后进入文件产出
              </span>
              <el-button v-else type="primary" :style="{ background: themeColor, borderColor: themeColor }" @click="confirmGenerate">确认生成结果，进入文件产出 →</el-button>
            </div>
          </div>

          <!-- 阶段四：渲染·修订·确认归档（原阶段五；校验与异常处置已并入阶段三） -->
          <div v-if="!isDocumentMode && activeStage === 4" class="rwb-panel">
            <div class="rwb-panel-title">文件产出与确认归档</div>
            <div class="rwb-file-card">
              <div class="rwb-file-icon"><i class="el-icon-document"></i></div>
              <div class="rwb-file-info">
                <b>{{ activeTask ? activeTask.name : '' }}.docx</b>
                <span>已按锁定模板渲染 · 含附表 {{ bundleSummary.annex }} 张</span>
              </div>
              <!-- 导出（清单 #7）：5 种格式共享导出服务，统一嵌入元信息水印 -->
              <el-button size="small" @click="openReportPreview">预览</el-button>
              <el-dropdown size="small" trigger="click" @command="onExport">
                <el-button size="small">导出报告<i class="el-icon-arrow-down el-icon--right"></i></el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item v-for="f in exportFormats" :key="f.key" :command="f.key">
                    {{ f.label }}<span class="rwb-export-desc">{{ f.desc }}</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
            <!-- 报送包行：报告与佐证材料同属一个交付物（报送材料包），故构成说明、清单入口与打包动作同处一行。
                 溯源链等只读核验另起一行——"可下载的交付物"与"只读核验视图"不混作一类。 -->
            <div class="rwb-bundle-line">
              <span class="rwb-bundle-label">报送包</span>
              <span class="rwb-bundle-desc">报告 1 份 · 附表 {{ bundleSummary.annex }} 张 · 佐证材料 {{ bundleSummary.total }} 项<template v-if="bundleSummary.missing || bundleSummary.pending"><b class="rwb-bundle-warn">（{{ bundleSummary.missing }} 项待补{{ bundleSummary.pending ? ' · ' + bundleSummary.pending + ' 项待回传' : '' }}）</b></template></span>
              <span class="rwb-bundle-act" @click="openMaterials"><i class="el-icon-collection"></i> 查看清单</span>
              <span class="rwb-bundle-act" @click="downloadBundle"><i class="el-icon-folder-add"></i> 打包下载</span>
            </div>
            <!-- 格式校验结论胶囊化：原为一整串连排灰字（像未排版的日志），改为 3 个可读胶囊，细节收进 hover -->
            <div v-if="stageFormats" class="rwb-fmt-caps">
              <el-tooltip v-for="c in formatCapsules" :key="c.label" :content="c.tip" placement="top">
                <span class="rwb-fmt-cap"><i class="el-icon-circle-check"></i> {{ c.label }}</span>
              </el-tooltip>
            </div>
            <!-- 定稿勾稽校验不再在面板中展示：阶段四的职责是核验 / 签署 / 盖章 / 归档，
                 数据一致性证据由「定稿版式通读」与「数据溯源链」承载，面板不再复制算式。
                 但闸门仍然生效：勾稽不成立时归档按钮禁用，底栏直接给出未通过原因与处置指引。 -->
            <!-- 逆向流程：仅当定稿勾稽不成立（必须退回）时出现——此时它是唯一出路，不给按钮用户会卡死；
                 正常态不展示"改数"入口，阶段四收束在核验 / 签署 / 归档（确需改动可让小易执行退回指令）。 -->
            <div v-if="!previewCheck.pass" class="rwb-revert-bar">
              <i class="el-icon-warning-outline"></i>
              <span>定稿勾稽校验未通过：报告数据必须保持一致，须退回前置环节重新处理</span>
              <el-button size="mini" @click="returnToStage(2, '退回阶段二重新补录')">退回阶段二重新补录</el-button>
              <el-button size="mini" type="warning" plain @click="returnToStage(3, '退回阶段三重新计算')">退回阶段三重新计算</el-button>
            </div>
            <!-- 证据核验行：只读视图（不产出文件），与上方「可下载的交付物」分层 -->
            <div class="rwb-evidence-line">
              <span class="rwb-evidence-label">证据核验</span>
              <span class="rwb-bundle-act" @click="openTrace"><i class="el-icon-view"></i> 数据溯源链</span>
              <span class="rwb-evidence-hint">逐级下钻至原始采集 · 只读</span>
            </div>
            <!-- 修订留痕已移至「归档证据」区（审核签发之后、签发凭据之前）并默认收起：
                 它是信息性过程记录，夹在核验与签发之间会把「核验 → 签发 → 归档」动作链截断 -->
            <!-- 审核签发（V5.1 架构解耦：业务流与权限流分离）——单人闭环为基线，多级协同为插件 -->
            <div class="rwb-panel-title" style="margin-top:16px;">审核签发
              <el-tag v-if="approvalMode === 'MULTI_LEVEL_APPROVAL'" size="mini" :type="auditSummary.allPassed ? 'success' : 'warning'" effect="plain">
                {{ auditSummary.passedCount }}/{{ auditSummary.total }} 级通过
              </el-tag>
              <el-tag v-else size="mini" type="success" effect="plain">无需审批 · 直接签发</el-tag>
              <span class="rwb-panel-sub">{{ approvalMode === 'DIRECT_SIGN' ? '一键确认签发并归档（操作人留痕）' : '多级审核全部通过后方可签字归档；退回后需修改并重新送审' }}</span>
            </div>
            <div class="rwb-mode-line">
              <span class="rwb-mode-label">审批模式</span>
              <el-tag size="mini" :type="approvalChainOf.level ? 'warning' : 'success'" effect="plain">
                {{ approvalLevelLabel }}
              </el-tag>
              <span style="font-size: 13px;color:#909399;margin-left:8px;">审批层级与审核人已在创建任务时锁定，编排内不可切换</span>
            </div>
            <!-- 多级审批插件（按审批层级 1~3 级；演示脚本——模拟流转，生产接入企业组织权限中枢 / BPMN 工作流） -->
            <div v-if="approvalMode === 'MULTI_LEVEL_APPROVAL'" class="rwb-audit">
              <div v-for="(lv, li) in auditSummary.levels" :key="lv.key" class="rwb-audit-level">
                <div class="rwb-audit-line" :class="{ 'is-last': li === auditSummary.levels.length - 1 }"></div>
                <div :class="['rwb-audit-badge', lv.passed ? 'ok' : (lv.rejected ? 'err' : 'idle')]">
                  <i :class="lv.passed ? 'el-icon-check' : (lv.rejected ? 'el-icon-close' : 'el-icon-more')"></i>
                </div>
                <div class="rwb-audit-body">
                  <div class="rwb-audit-head">
                    <b>{{ lv.name }}</b>
                    <el-tag size="mini" :type="lv.passed ? 'success' : (lv.rejected ? 'danger' : 'info')" effect="plain">
                      {{ lv.passed ? '已通过' : (lv.rejected ? '已退回' : '待审核') }}
                    </el-tag>
                    <span v-if="lv.by" class="rwb-audit-by">{{ lv.by }} · {{ lv.time }}</span>
                  </div>
                  <div v-if="lv.comment" class="rwb-audit-comment">意见：{{ lv.comment }}</div>
                  <div class="rwb-audit-actions">
                    <el-button size="mini" type="primary" plain :disabled="lv.passed" @click="passAudit(lv.key)">通过</el-button>
                    <el-button size="mini" :disabled="lv.rejected" @click="rejectAudit(lv.key)">退回修改</el-button>
                    <el-button size="mini" type="text" @click="auditComment(lv.key)">添加批注</el-button>
                  </div>
                </div>
              </div>
            </div>
            <!-- DIRECT_SIGN 基线：单一主操作区，点击后确认报表真实性并生成归档包 -->
            <div v-else class="rwb-direct-sign">
              <div class="rwb-ds-main">
                <i class="el-icon-finished"></i>
                <div class="rwb-ds-body">
                  <b>报告确认与签发归档</b>
                  <span>确认数据真实、完整、口径无误后，一键签发归档：内容指纹固化 + 多格式带水印交付件 + 归档登记。</span>
                </div>
              </div>
              <div class="rwb-ds-meta">签发时以当前登录身份留痕操作人，并固化内容指纹（哈希锁定）；算法与指纹见下方「签发凭据」。</div>
            </div>
            <!-- 归档证据（一）：修订留痕默认收起——签字前可见过程记录（合规要求），但不打断动作链 -->
            <div class="rwb-rev-fold" @click="revisionOpen = !revisionOpen">
              <i :class="revisionOpen ? 'el-icon-arrow-down' : 'el-icon-arrow-right'"></i>
              <b>修订留痕（{{ activePanels[4].revisions.length }} 次）</b>
              <span class="rwb-rev-fold-hint">{{ revisionOpen ? '收起' : '展开查看' }}</span>
            </div>
            <div v-if="revisionOpen" class="rwb-rev-list">
              <div v-for="(rev, ri) in activePanels[4].revisions" :key="ri + '-' + rev.time" class="rwb-rev-row">
                <span class="rwb-rev-time">{{ rev.time }}</span>
                <span>{{ rev.text }}</span>
                <el-tag size="mini" type="info">{{ rev.by }}</el-tag>
              </div>
            </div>
            <!-- 归档证据（二）签发凭据（清单 #15）：签字归档时生成内容指纹，可随时校验完整性（检出签发后的任何改动） -->
            <div v-if="signRecord" class="rwb-sign">
              <div class="rwb-sign-head">
                <i class="el-icon-lock"></i>
                <b>签发凭据</b>
                <el-tag size="mini" type="success" effect="plain">已哈希锁定</el-tag>
                <el-button size="mini" type="text" @click="verifySignature">校验完整性</el-button>
              </div>
              <div class="rwb-sign-grid">
                <div><span>内容指纹</span><code>{{ signRecord.fingerprint }}</code></div>
                <div><span>覆盖范围</span>报告 + 佐证材料 {{ signedMaterials.length }} 项</div>
                <div><span>签发时间</span>{{ signRecord.signedAt }}</div>
                <div><span>签发人</span>{{ signRecord.signer }}</div>
                <div><span>算法</span>{{ signRecord.algorithm }}</div>
              </div>
              <div v-if="bundleSummary.missing" class="rwb-sign-scope-note">
                <i class="el-icon-warning-outline"></i>
                含 {{ bundleSummary.missing }} 项待补材料，补录后须重新校验
              </div>
              <!-- ApprovalNode 审批链（V5.1 向后兼容：DIRECT_SIGN 1 节点 / MULTI_LEVEL 3 节点） -->
              <div class="rwb-sign-chain">
                <div class="rwb-sign-chain-head">审批链（{{ signRecord.approvalMode === 'DIRECT_SIGN' ? '无需审批 · 直接签发完结' : (signRecord.approvalLevel || 0) + ' 级审批 · ' + (signRecord.approvalChain || []).length + ' 节点' }}）</div>
                <div v-for="(n, ni) in signRecord.approvalChain" :key="ni" class="rwb-sign-node">
                  <span class="rwb-sign-node-lv">L{{ n.nodeLevel }}</span>
                  <span class="rwb-sign-node-role">{{ n.roleKey }}</span>
                  <span class="rwb-sign-node-status">{{ n.status }}</span>
                  <span class="rwb-sign-node-by">{{ n.operatorName }}</span>
                  <span v-if="n.comments" class="rwb-sign-node-cmt">{{ n.comments }}</span>
                </div>
              </div>
              <div v-if="signVerify" :class="['rwb-sign-verify', signVerify.ok ? 'ok' : (signVerify.legacy ? 'legacy' : 'err')]">
                <i :class="signVerify.ok ? 'el-icon-circle-check' : (signVerify.legacy ? 'el-icon-info' : 'el-icon-warning-outline')"></i>
                <span>{{ signVerify.reason }}（指纹 {{ signVerify.current }}）</span>
              </div>
              <div class="rwb-sign-note">{{ signRecord.note }}</div>
            </div>
            <div class="rwb-actionbar">
              <span class="rwb-ab-note">{{ approvalMode === 'DIRECT_SIGN' ? (archiveAllowed ? '无需审批（直接签发）：确认后以当前登录身份固化内容指纹（哈希锁定），修订入口关闭，不可撤销' : '定稿勾稽校验未通过，请先退回阶段三重新计算') : (!auditSummary.allPassed ? ('多级审核未全部通过（' + auditSummary.passedCount + '/' + auditSummary.total + '），需完成审核后方可签字归档') : (archiveAllowed ? '确认后文件防篡改锁定（哈希锁定），修订入口关闭，不可撤销' : '定稿勾稽校验未通过，请先退回阶段三重新计算')) }}</span>
              <el-button type="primary" :disabled="!archiveGate" :style="archiveGate ? { background: themeColor, borderColor: themeColor } : {}" @click="confirmArchive">签字确认并归档</el-button>
            </div>
            <!-- 阶段四到此收束：核验定稿文件 → 审核签发 → 签字确认并归档。
                 交付物分两行：「报送包」行承载可下载的包级动作（查看清单 / 打包下载），
                 「证据核验」行承载只读核验（数据溯源链）；提报状态跟踪（部门 × 期次看板）属大厅总览能力，已归口报告大厅。 -->
          </div>
        </div>
      </aside>
    </div>
  </template>

    <!-- 模板结构预览弹窗：只承载「本任务锁定模板的章节结构」。
         模板全称 / 版本 / 编制依据 / 依据标准已在阶段一面板与模板概览中展示，此处不再重复。 -->
    <!-- 模板骨架预览：高密度宽表（表1 24 列网格）→ 保留居中宽屏弹窗（88vw 全视口 + 独立横向滚动），杜绝抽屉内嵌套横滚 -->
    <el-dialog title="模板结构预览" :visible.sync="tplPreviewVisible" width="88%" top="4vh" append-to-body :close-on-click-modal="false" custom-class="rwb-tpl-dialog">
      <div class="rwb-tpl-head">
        <div class="rwb-tpl-head-main">
          <b>{{ templateInfo ? templateInfo.docName : '—' }}</b>
          <el-tag v-if="activeVariant" size="mini" type="warning" effect="plain">{{ activeVariant.label }}</el-tag>
          <el-tag size="mini" effect="plain">报表 {{ templateSections.length }} 张</el-tag>
        </div>
        <span class="rwb-tpl-lock"><i class="el-icon-lock"></i> {{ templateInfo ? templateInfo.version : '—' }} · 创建时锁定</span>
      </div>
      <template-sections-preview :sections="previewSections" :profile-sections="previewProfileSections" />
      <div slot="footer" style="text-align:right;">
        <el-button size="small" @click="tplPreviewVisible = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 提报状态登记弹窗：登记提报 / 登记受理统一结构（标题栏 → 文字说明 → 表单字段 → 附件凭证 → 按钮区） -->
    <el-dialog :title="submitRegTitle" :visible.sync="submitRegDialog.visible" width="560px" top="12vh" append-to-body custom-class="rs-reg-dialog" :close-on-click-modal="false">
      <div class="rs-reg-desc">
        <i :class="submitRegDialog.mode === 'submission' ? 'el-icon-upload' : 'el-icon-circle-check'"></i>
        <span v-if="submitRegDialog.mode === 'submission'">报告已在主管部门平台完成提交？请登记提报信息，凭证可随政府回执补录；登记后任务进入「已提报 · 待受理」。</span>
        <span v-else>主管部门已受理该报告？请登记受理信息，确认后任务闭环（已受理），回执与凭证将随任务留痕。</span>
      </div>
      <div class="rs-reg-fields">
        <div class="rs-reg-field" v-if="submitRegDialog.mode === 'submission'">
          <span class="rs-reg-label">提报方式</span>
          <el-select v-model="submitRegDialog.form.way" size="mini" style="flex:1;">
            <el-option label="在线报送（报送系统）" value="在线报送（报送系统）"></el-option>
            <el-option label="邮件报送" value="邮件报送"></el-option>
            <el-option label="门户上传" value="门户上传"></el-option>
          </el-select>
        </div>
        <div class="rs-reg-field">
          <span class="rs-reg-label">{{ submitRegDialog.mode === 'submission' ? '提报时间' : '受理时间' }}</span>
          <el-date-picker v-model="submitRegDialog.form.time" type="datetime" size="mini" style="flex:1;" value-format="yyyy-MM-dd HH:mm" placeholder="默认当前时间"></el-date-picker>
        </div>
        <div class="rs-reg-field">
          <span class="rs-reg-label">{{ submitRegDialog.mode === 'submission' ? '凭证号' : '受理文号' }}</span>
          <el-input v-model="submitRegDialog.form.receipt" size="mini" :placeholder="submitRegDialog.mode === 'submission' ? '回执号 / 受理编号（选填）' : '受理文号 / 批复编号（选填）'"></el-input>
        </div>
      </div>
      <div class="rs-reg-attach">
        <div class="rs-reg-label">附件凭证</div>
        <!-- action 为必填属性（本处仅本地选取凭证文件、不自动上传）：缺失会触发 ElUpload 属性告警 -->
        <el-upload action="#" :auto-upload="false" :on-change="onRegFileChange" :on-remove="onRegFileRemove" :file-list="submitRegDialog.files" drag multiple class="rs-reg-upload">
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将凭证扫描件拖到此处，或 <em>点击选择</em></div>
          <div class="el-upload__tip" slot="tip">支持 PDF / 图片，可多选</div>
        </el-upload>
      </div>
      <div slot="footer" style="text-align:right;">
        <el-button size="small" @click="submitRegDialog.visible = false">取 消</el-button>
        <el-button size="small" type="primary" :style="{ background: themeColor, borderColor: themeColor }" @click="confirmSubmitReg">{{ submitRegDialog.mode === 'submission' ? '确认已提报' : '确认已受理' }}</el-button>
      </div>
    </el-dialog>

    <!-- 存证底卷轻量抽屉（已归档/已提报/已受理任务）：官方回执凭单 → 法定指纹存证（成果物下载与佐证清单收敛至报告与档案中心，不在此重复） -->
    <el-drawer title="存证底卷" :visible.sync="archiveDrawer.visible" direction="rtl" size="480px" append-to-body custom-class="rs-archive-drawer">
      <div v-if="archiveDrawer.report" class="rs-arch-body">
        <div class="rs-arch-head">
          <b>{{ archiveDrawer.report.name }}</b>
          <el-tag size="mini" :type="reportStatusMeta(archiveDrawer.report).tag" effect="dark">{{ reportStatusMeta(archiveDrawer.report).label }}</el-tag>
        </div>
        <div class="rs-arch-meta">{{ archiveDrawer.report.period }} · {{ archiveDrawer.report.dept }} · {{ archiveDrawer.report.freq }}</div>

        <!-- ① 官方回执与受理凭单 -->
        <div class="rs-arch-sec">
          <div class="rs-arch-sec-title"><i class="el-icon-postcard"></i> 官方回执与受理凭单</div>
          <div class="rs-arch-grid">
            <div class="rs-arch-row"><span>回执 / 文号</span><b>{{ archiveDrawer.report.receiptNo || '待回写（登记提报后录入）' }}</b></div>
            <div class="rs-arch-row"><span>登记时间</span><b>{{ archiveDrawer.report.receiptTime || '—' }}</b></div>
            <div class="rs-arch-row"><span>受理机关</span><b>{{ archiveDrawer.report.receiptAcceptedBy || archiveDrawer.report.dept }}</b></div>
            <div class="rs-arch-row"><span>提报方式</span><b>{{ archiveDrawer.report.receiptWay || '—' }}</b></div>
          </div>
          <div v-if="(archiveDrawer.report.receiptFiles || []).length" class="rs-arch-files">
            <el-tag v-for="f in archiveDrawer.report.receiptFiles" :key="f" size="mini" effect="plain" class="rs-fp-tag" @click="previewReceiptFile(f)"><i class="el-icon-picture-outline"></i> {{ f }}</el-tag>
          </div>
        </div>

        <!-- ② 法定数字指纹存证 -->
        <div class="rs-arch-sec">
          <div class="rs-arch-sec-title"><i class="el-icon-key"></i> 法定数字指纹存证</div>
          <div class="rs-arch-fp">{{ archiveDrawer.report.fingerprint || '历史期次未留痕指纹（生产迁移时补录）' }}</div>
          <div class="rs-arch-grid" v-if="archiveDrawer.report.signMeta">
            <div class="rs-arch-row"><span>签署人</span><b>{{ archiveDrawer.report.signMeta.signer }}</b></div>
            <div class="rs-arch-row"><span>签署时间</span><b>{{ archiveDrawer.report.signMeta.signedAt }}</b></div>
            <div class="rs-arch-row"><span>审批模式</span><b>{{ archiveDrawer.report.signMeta.approvalMode === 'DIRECT_SIGN' ? '无需审批（直接签发）' : ((archiveDrawer.report.signMeta.approvalLevel || 3) + ' 级审批（' + ((archiveDrawer.report.signMeta.approvalChain || []).length || 3) + ' 节点链）') }}</b></div>
          </div>
        </div>

        <!-- 深层穿透入口 -->
        <div class="rs-arch-foot">
          <span class="rs-arch-jump" @click="goCarbonReportCenter(archiveDrawer.report)">前往 报告与档案中心 查验全宗底卷 ↗</span>
        </div>
      </div>
    </el-drawer>

    <!-- 新建临时报告弹窗：与「新建报送计划」同为新建类动作，统一弹窗形态 -->
    <el-dialog title="新建临时报告" :visible.sync="newReportDialog" width="520px" top="15vh" append-to-body custom-class="rs-reg-dialog" :close-on-click-modal="false">
      <div class="rs-reg-desc">
        <i class="el-icon-edit-outline"></i>
        <span>临时报告非周期、不入排期，创建后直接进入编排；周期性报告由排期自动生成。</span>
      </div>
      <div class="rs-reg-fields">
        <div class="rs-reg-field">
          <span class="rs-reg-label">报告类型</span>
          <el-select v-model="newReport.type" size="mini" style="flex:1;" placeholder="选择类型" @change="onNewReportTypeChange">
            <el-option v-for="name in calTypeOptions" :key="name" :label="name" :value="name">
              <div class="rs-type-opt">
                <span>{{ name }}</span>
                <span class="rs-type-opt-meta">{{ typeMeta(name) }}</span>
              </div>
            </el-option>
          </el-select>
        </div>
        <div class="rs-reg-field">
          <span class="rs-reg-label">报告名称</span>
          <el-input v-model="newReport.name" size="mini" style="flex:1;" placeholder="选类型与期间后自动生成，可修改" @input="newReport.nameTouched = true"></el-input>
        </div>
        <div class="rs-reg-field">
          <span class="rs-reg-label">时间维度</span>
          <el-select v-model="newReport.dim" size="mini" style="flex:1;" @change="onDimChange">
            <el-option label="周" value="周"></el-option>
            <el-option label="月" value="月"></el-option>
            <el-option label="年" value="年"></el-option>
            <el-option label="自定义" value="自定义"></el-option>
          </el-select>
        </div>
        <div class="rs-reg-field">
          <span class="rs-reg-label">{{ newReport.dim === '年' ? '报告年份' : newReport.dim === '自定义' ? '时间区间' : newReport.dim === '周' ? '所属周' : '所属月份' }}</span>
          <el-date-picker v-if="newReport.dim === '年'" v-model="newReport.rangeYear" type="year" size="mini" style="flex:1;" value-format="yyyy" placeholder="选择年份" @change="autoFillName"></el-date-picker>
          <el-date-picker v-else-if="newReport.dim === '自定义'" v-model="newReport.rangeDates" type="daterange" size="mini" style="flex:1;" value-format="yyyy-MM-dd" range-separator="~" start-placeholder="开始日期" end-placeholder="结束日期" popper-class="rs-dim-range-popper" @change="autoFillName"></el-date-picker>
          <el-date-picker v-else-if="newReport.dim === '周'" v-model="newReport.rangeWeek" type="week" size="mini" style="flex:1;" value-format="yyyy-MM-dd" placeholder="选择周（任选该周内一天）" @change="autoFillName"></el-date-picker>
          <el-date-picker v-else v-model="newReport.rangeMonth" type="month" size="mini" style="flex:1;" value-format="yyyy-MM" placeholder="选择月份" @change="autoFillName"></el-date-picker>
        </div>
        <div class="rs-reg-field rs-reg-field-top" v-if="newReportTpl && newReportTpl.variants && newReportTpl.variants.length">
          <span class="rs-reg-label">填报场景</span>
          <el-select v-model="newReportScene" size="mini" style="flex:1;" placeholder="请选择填报场景（决定报表套件）">
            <el-option v-for="v in newReportTpl.variants" :key="v.key" :label="v.label" :value="v.key">
              <div class="rs-type-opt"><span>{{ v.label }}</span><span class="rs-type-opt-meta">{{ v.suite }}</span></div>
            </el-option>
          </el-select>
        </div>
        <div class="rs-reg-field">
          <span class="rs-reg-label">期望完成日</span>
          <el-date-picker v-model="newReport.deadline" type="date" size="mini" style="flex:1;" value-format="yyyy-MM-dd" placeholder="选填，用于任务催办与倒计时"></el-date-picker>
        </div>
        <div class="rs-reg-field rs-reg-field-top">
          <span class="rs-reg-label">审批模式</span>
          <div style="flex:1;">
            <el-radio-group v-model="newReport.approval.level" size="mini" @change="onApprovalLevelChange(newReport.approval)">
              <el-radio-button v-for="o in approvalModeOptions" :key="o.level" :label="o.level">{{ o.label }}</el-radio-button>
            </el-radio-group>
            <div v-for="(n, ni) in newReport.approval.chain" :key="ni" style="display:flex;align-items:center;gap:8px;margin-top:6px;">
              <span style="font-size: 13px;color:#909399;width:52px;">L{{ n.nodeLevel }}</span>
              <el-input v-model="n.roleKey" size="mini" style="width:118px;" placeholder="节点名称"></el-input>
              <el-select v-model="n.by" size="mini" style="flex:1;" filterable allow-create default-first-option placeholder="选择企业人员（可自行填写）">
                <el-option v-for="p in personnelOptions" :key="p.value" :label="p.label" :value="p.value"></el-option>
              </el-select>
            </div>
          </div>
        </div>
        <div class="rs-reg-field rs-reg-field-top">
          <span class="rs-reg-label">备注</span>
          <el-input v-model="newReport.remark" type="textarea" :rows="2" size="mini" style="flex:1;" placeholder="报告缘由 / 专项背景（选填，随任务留痕）"></el-input>
        </div>
      </div>
      <div slot="footer" style="text-align:right;">
        <el-button size="small" @click="newReportDialog = false">取 消</el-button>
        <el-button size="small" type="primary" :style="{ background: themeColor, borderColor: themeColor }" @click="submitCreate">创建并进入编排</el-button>
      </div>
    </el-dialog>

    <!-- 整篇报告预览：参照零碳工厂「整篇方案编制」范式（左目录 + 右正文，目录点击锚点跳转）。
         AI 改写就地发生：段落悬停出改写入口 → 结果以内联 diff 呈现 → 接受后才写入正文（改动保持待定）。
         数据源与阶段三「报告内容预览」同一份 chapters，不另维护副本 -->
    <el-dialog title="定稿版式通读（只读）" :visible.sync="reportPreviewVisible" width="1080px" top="2vh" append-to-body custom-class="rwb-report-dialog">
      <div v-if="reportPreview" class="rp-layout">
        <div class="rp-toc">
          <div class="rp-toc-title">{{ reportPreview.org }} · {{ reportPreview.title }}</div>
          <div class="rp-toc-item" @click="jumpToReportSection('cover')">
            <span>封面与落款</span>
            <el-tag size="mini" effect="plain">定稿</el-tag>
          </div>
          <div v-for="(ch, ci) in reportPreview.chapters" :key="ci" class="rp-toc-item" @click="jumpToReportSection(ci)">
            <span>{{ ch.name }}</span>
            <el-tag v-if="ch.kind === 'annex'" size="mini" type="info" effect="plain">附件</el-tag>
            <el-tag v-else size="mini" type="success" effect="plain">已生成</el-tag>
          </div>
          <div class="rp-toc-hint">本视图为只读通读（含封面、落款与全部附表）；正文改写请在阶段三「报告成文画布」中进行。</div>
        </div>
        <div class="rp-doc">
          <div id="rp-sec-cover" class="rp-section">
            <div class="rp-cover">
              <div class="rp-cover-org">{{ reportPreview.org }}</div>
              <div class="rp-cover-title">{{ reportPreview.title }}</div>
              <div class="rp-cover-seal">
                <div>{{ reportPreview.org }}</div>
                <div class="rp-cover-seal-sub">（加盖公章）</div>
                <div>{{ reportPreview.coverDate }}</div>
              </div>
            </div>
          </div>
          <div v-for="(ch, ci) in reportPreview.chapters" :id="'rp-sec-' + ci" :key="'doc' + ci" :class="['rp-section', { 'rwb-locate-flash': flashSecIndex === ci }]">
            <!-- 报告由「正文 + 附件」两部分构成：正文是叙述（可 AI 改写），附件是报表（纯数据） -->
            <div v-if="ci === 0" class="rp-group">报告正文</div>
            <div v-else-if="ch.kind === 'annex' && reportPreview.chapters[ci - 1].kind === 'body'" class="rp-group">附件报表</div>
            <!-- 定稿通读＝对外公文的只读形态：章节标题下不再挂系统备注。
                 原 desc（"规则引擎按数据生成 · 可 AI 改写" / 模板 source 原文如"可直接编辑（对应下方…）"）
                 在归档阶段既不可操作、又与"封存只读"语义冲突，属界面语言泄漏进公文；
                 数据来源统一收敛到附表上方的来源标签条（.rp-table-bar）与数据溯源链，单一来源说明。 -->
            <div class="rp-sec-head">
              <span class="rp-sec-title">{{ ch.name }}</span>
            </div>
            <!-- 表体由规则引擎生成，明确标注只读，避免与可改写的叙述段落混淆 -->
            <div v-if="ch.content.table" class="rp-table-block">
              <!-- 表格来源按该表真实的数据来源标注：并非所有附件报表都由规则引擎生成 -->
              <div class="rp-table-bar">
                <span class="rp-table-lock" :class="{ 'is-editable': fillTypeOf(ch) && fillTypeOf(ch).editable }">
                  <i :class="fillTypeOf(ch) ? fillTypeOf(ch).icon : 'el-icon-set-up'"></i>
                  {{ fillTypeOf(ch) ? fillTypeOf(ch).label : '规则引擎计算' }}<template v-if="fillTypeOf(ch) && !fillTypeOf(ch).editable"> · 只读</template>
                </span>
                <span class="rp-table-hint">{{ fillTypeOf(ch) ? fillTypeOf(ch).hint : '' }}</span>
              </div>
              <div class="rp-table-wrap">
                <table>
                  <thead>
                    <!-- key 用位置索引：附件2 部分表（如表27）左右两组列名相同，用列名做 key 会重复 -->
                    <tr><th v-for="(c, ci) in ch.content.table.columns" :key="'h' + ci">{{ c }}</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, ri) in ch.content.table.rows" :key="ri">
                      <td v-for="(c, cix) in ch.content.table.columns" :key="cix"
                        :class="{ 'rwb-val-penetrate': isPenetratable(row, c, cix) }"
                        :title="isPenetratable(row, c, cix) ? '点击穿透追溯原始数据源' : ''"
                        @click="onTableCellClick(row, c, cix, ch)">
                        {{ sectionRowValue(row, c, cix) }}
                        <i v-if="isPenetratable(row, c, cix)" class="el-icon-connection rwb-penetrate-icon"></i>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <!-- 叙述段落（仅报告正文有）：定稿视图为只读通读，正文改写统一在阶段三「报告成文画布」中进行 -->
            <div v-if="ch.kind === 'body'" class="rp-para-block">
              <p class="rp-para">{{ ch.content.narrative }}</p>
            </div>
          </div>
          <div class="rp-sign">
            填报负责人：{{ reportPreview.sign.leader }}　　填报人：{{ reportPreview.sign.filler }}　　电话：{{ reportPreview.sign.phone }}　　填报日期：{{ reportPreview.sign.date }}
          </div>
        </div>
      </div>
      <div v-else class="rp-empty">当前阶段尚未生成报告内容</div>
      <span slot="footer">
        <el-button size="small" @click="reportPreviewVisible = false">关 闭</el-button>
        <el-button size="small" type="primary" :style="{ background: themeColor, borderColor: themeColor }" @click="onExport('pdf')">导出 PDF</el-button>
      </span>
    </el-dialog>

    <!-- 编制依据明细抽屉（只读依据）：规则集本体（政策标准库）+ 编制规则参数 + 成文格式要求 -->
    <!-- 编制依据明细：文档型内容 → 右侧抽屉（600px，垂直阅读不打断主流程）；表样类宽表仍走宽屏弹窗 -->
    <el-drawer :visible.sync="caliberVisible" direction="rtl" size="600px" append-to-body custom-class="rwb-cal-drawer">
      <!-- 凭证化头部：标题 + 引用出处副行（Trust & Authority：依据是什么、来自哪、是否现行，一眼锚定） -->
      <template slot="title">
        <div class="rwb-cal-title">
          <i class="el-icon-set-up"></i>
          <div>
            <div class="rwb-cal-title-main">编制依据明细</div>
            <div class="rwb-cal-title-sub">引用自报告模板《{{ templateInfo ? templateInfo.docName : '—' }}》 · {{ templateInfo ? templateInfo.version : '—' }} · 任务创建时锁定</div>
          </div>
        </div>
      </template>
      <div v-if="caliberInfo" class="rwb-cal-wrap">
        <!-- 依据声明（信任凭证块）：名称 + 标准号 + 时效状态（取自标准库现行性核验） -->
        <div class="rwb-cal-declare">
          <div class="rwb-cal-declare-main">
            <b>{{ caliberInfo.name }}</b>
            <div class="rwb-cal-declare-code">依据标准：{{ caliberInfo.standardCode || '—' }}</div>
          </div>
          <el-tag v-if="standardStatus" size="mini" :type="standardStatus.state === 'ok' ? 'success' : 'danger'" effect="dark">{{ standardStatus.state === 'ok' ? '现行有效' : standardStatus.text }}</el-tag>
        </div>

        <!-- ❶ 核算规则：数据怎么算——全部内容为附件2 对用户的真实要求（平台机制解释不展示） -->
        <div class="rwb-cal-sec">
          <div class="rwb-cal-sec-title"><span class="rwb-cal-sec-no">1</span>核算规则<span class="rwb-cal-sec-hint">数据怎么算</span></div>
          <div class="rwb-cal-grid">
            <div class="rwb-cal-grid-row"><span class="rwb-cal-grid-key">编制依据</span><span class="rwb-cal-grid-val">{{ caliberInfo.name }}</span></div>
            <div class="rwb-cal-grid-row"><span class="rwb-cal-grid-key">依据标准</span><span class="rwb-cal-grid-val">{{ caliberInfo.standardCode || '—' }}</span></div>
            <template v-if="caliberInfo.ruleAvailable">
              <div v-for="p in caliberInfo.ruleParams" :key="p.key" class="rwb-cal-grid-row">
                <span class="rwb-cal-grid-key">{{ reportParamLabel(p.key) }}</span>
                <span class="rwb-cal-grid-val">
                  {{ paramText(p.value) }}
                  <em v-if="p.clauseRefs && p.clauseRefs.length" class="rwb-cal-clause"><i class="el-icon-collection-tag"></i>{{ p.clauseRefs[0] }}</em>
                </span>
              </div>
            </template>
            <div v-else class="rwb-cal-grid-row"><span class="rwb-cal-grid-key">编制规则参数</span><span class="rwb-cal-grid-val">{{ caliberInfo.ruleReason || '未从政策标准库取到该规则集' }}</span></div>
          </div>
        </div>

        <!-- ❷ 成文格式：文档怎么排 -->
        <div class="rwb-cal-sec" v-if="caliberInfo.formatReqs.length">
          <div class="rwb-cal-sec-title"><span class="rwb-cal-sec-no">2</span>成文格式<span class="rwb-cal-sec-hint">文档怎么排</span></div>
          <div class="rwb-cal-grid">
            <div v-for="(r, ri) in caliberInfo.formatReqs" :key="ri" class="rwb-cal-grid-row">
              <span class="rwb-cal-grid-val"><i class="el-icon-check"></i>{{ r }}</span>
            </div>
          </div>
        </div>
        <!-- 多口径适配属跨任务能力（同一批数据在不同出口任务中按各自创建时锁定的规则集换算）：
             本任务只有唯一出口与唯一锁定口径，故任务工作台内不展示该概念，抽屉内亦无相关条目 -->

      </div>
    </el-drawer>

    <!-- 数据溯源弹窗：L1 报表 → L2 口径适配 → L3 模块数据池 → L4 原始采集（只读核验，无演示值兜底） -->
    <el-dialog title="数据溯源链" :visible.sync="traceVisible" width="880px" top="6vh" append-to-body>
      <div class="rwb-trace-note">
        <i class="el-icon-info"></i>
        从报告逐级下钻至数据来源：每级给出 <b>数值 · 规则/来源 · 时间 · 责任方</b>。
      </div>
      <div class="rwb-trace">
        <div v-for="(lv, li) in traceTree" :key="lv.level" class="rwb-trace-level">
          <div class="rwb-trace-line" :class="{ 'is-last': li === traceTree.length - 1 }"></div>
          <div class="rwb-trace-badge">{{ lv.level }}</div>
          <div class="rwb-trace-body">
            <div class="rwb-trace-head">
              <b>{{ lv.name }}</b>
              <span class="rwb-trace-desc">{{ lv.desc }}</span>
            </div>
            <div v-for="(n, ni) in lv.nodes" :key="ni" class="rwb-trace-node">
              <div class="rwb-trace-node-top">
                <span class="rwb-trace-label">{{ n.label }}</span>
                <span class="rwb-trace-value">{{ n.value }}</span>
              </div>
              <div class="rwb-trace-node-meta">
                <span><i class="el-icon-set-up"></i>{{ n.rule }}</span>
                <span><i class="el-icon-time"></i>{{ n.time }}</span>
                <span><i class="el-icon-user"></i>{{ n.by }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 佐证材料清单弹窗（只读核验 + 整包下载）：报告与佐证材料同属一个报送包，归档前在此核对齐备性。
         不提供上传 / 删除——归档关口不设可写入口（上传归属阶段二工具栏），此处仅核验与打包。 -->
    <el-dialog title="佐证材料清单" :visible.sync="materialVisible" width="780px" top="8vh" append-to-body custom-class="rwb-mat-dialog">
      <div class="rwb-mat-note">
        <i class="el-icon-info"></i>
        缺项不阻断归档，可在提报后补录。
      </div>
      <div class="rwb-mat-sum">
        <span class="rwb-mat-sum-item is-ok"><i class="el-icon-circle-check"></i> 已齐 {{ bundleSummary.ready }} 项</span>
        <span v-if="bundleSummary.missing" class="rwb-mat-sum-item is-miss"><i class="el-icon-warning-outline"></i> 待补 {{ bundleSummary.missing }} 项</span>
        <span v-if="bundleSummary.pending" class="rwb-mat-sum-item is-wait"><i class="el-icon-time"></i> 待回传 {{ bundleSummary.pending }} 项</span>
        <span class="rwb-mat-sum-total">共 {{ bundleSummary.total }} 项 · 材料哈希随包留存</span>
      </div>
      <div class="rwb-mat-body">
        <div v-for="g in materialGroups" :key="g.name" class="rwb-mat-group">
          <div class="rwb-mat-group-head">
            <span>{{ g.name }}</span>
            <span class="rwb-mat-group-count">{{ g.items.length }} 项</span>
          </div>
          <div v-for="(m, mi) in g.items" :key="mi" :class="['rwb-mat-item', 'is-' + m.status]">
            <span :class="['rwb-mat-badge', 'is-' + m.status]">{{ materialStatusMeta(m.status).label }}</span>
            <div class="rwb-mat-main">
              <div class="rwb-mat-name">
                {{ m.name }}
                <span class="rwb-mat-type">{{ m.type }}</span>
                <el-tag v-if="m.required" size="mini" type="warning" effect="plain">必需</el-tag>
              </div>
              <div class="rwb-mat-meta">来源：{{ m.source }}<template v-if="m.time"> · {{ m.time }}</template><template v-if="m.hash"> · 哈希 {{ m.hash }}</template></div>
              <div v-if="m.note" class="rwb-mat-note-line">{{ m.note }}</div>
            </div>
            <span class="rwb-mat-size">{{ m.size || '—' }}</span>
          </div>
        </div>
      </div>
      <span slot="footer">
        <el-button size="small" @click="materialVisible = false">关 闭</el-button>
        <el-button size="small" type="primary" icon="el-icon-folder-add" :style="{ background: themeColor, borderColor: themeColor }" @click="downloadBundle">打包下载</el-button>
      </span>
    </el-dialog>

    <!-- 口径换算依据抽屉（查验载体：文档型文本走右侧抽屉，垂直阅读体验佳，不割裂正文）
         入口：正文中的数值标签（虚线数字）/ 章节底部「口径换算依据 · N 项」 -->
    <el-drawer :visible.sync="adaptDrawer.visible" direction="rtl" size="600px" append-to-body custom-class="rwb-adapt-drawer">
      <div slot="title" class="rwb-adapt-dw-title">
        <span>口径换算依据</span>
        <em v-if="adaptDrawer.title">阅读位置：{{ adaptDrawer.title }}</em>
      </div>
      <div v-if="adaptDrawerRows.length" class="rwb-adapt-dw">
        <div class="rwb-adapt-dw-tip">
          <i class="el-icon-set-up"></i> 规则引擎执行 · 非 AI 计算 · 数值可回溯至公式库与因子库（只读存证）
          <span v-if="adaptDrawer.source" class="rwb-adapt-dw-src">依据出处：{{ adaptDrawer.source }}</span>
        </div>

        <!-- 当前指标：原值 → 换算规则 → 写入报告值（三段式链路，替代原平铺四列表格） -->
        <div v-if="adaptDrawerRow" class="rwb-adapt-cur">
          <div class="rwb-adapt-cur-name">{{ adaptDrawerRow.name }}</div>
          <div class="rwb-adapt-flow">
            <div class="rwb-adapt-node">
              <em>原始数据</em>
              <b>{{ adaptDrawerRow.from }}</b>
            </div>
            <i class="el-icon-right rwb-adapt-flow-arrow"></i>
            <div class="rwb-adapt-node is-rule">
              <em>换算规则</em>
              <b>{{ adaptDrawerRow.rule }}</b>
            </div>
            <i class="el-icon-right rwb-adapt-flow-arrow"></i>
            <div class="rwb-adapt-node is-out">
              <em>写入报告</em>
              <b>{{ adaptDrawerRow.to }}</b>
            </div>
          </div>
          <div class="rwb-adapt-refs">
            <div v-if="adaptDrawerRow.formulaRef" class="rwb-adapt-ref">
              <span class="rwb-adapt-ref-key">计算逻辑</span>
              <span class="rwb-adapt-ref-val">{{ adaptDrawerRow.formulaRef }}<em>公式库</em></span>
            </div>
            <div v-if="adaptDrawerRow.factorRef" class="rwb-adapt-ref">
              <span class="rwb-adapt-ref-key">系数取值</span>
              <span class="rwb-adapt-ref-val">{{ adaptDrawerRow.factorRef }}<em>因子库</em></span>
            </div>
            <div v-if="adaptFactorMap[adaptDrawerRow.name]" class="rwb-adapt-ref">
              <span class="rwb-adapt-ref-key">因子命中</span>
              <span class="rwb-adapt-ref-val">
                {{ adaptFactorMap[adaptDrawerRow.name].factorName }}（{{ adaptFactorMap[adaptDrawerRow.name].factorId }}）
                · {{ adaptFactorMap[adaptDrawerRow.name].factorValue }} {{ adaptFactorMap[adaptDrawerRow.name].factorUnit }}
                · {{ adaptFactorMap[adaptDrawerRow.name].sourcePool }}
                · 置信度 {{ adaptFactorMap[adaptDrawerRow.name].confidence }}
                <em v-if="adaptFactorMap[adaptDrawerRow.name].memoryHit">命中历史匹配</em>
              </span>
            </div>
          </div>
        </div>

        <!-- 本章节换算项清单：点击切换上方详情（替代原先整表平铺在正文里） -->
        <div class="rwb-adapt-list-title">{{ adaptDrawer.source }} · 换算项（{{ adaptDrawerRows.length }} 项）</div>
        <div class="rwb-adapt-list">
          <div v-for="(r, ri) in adaptDrawerRows" :key="ri" :class="['rwb-adapt-item', { 'is-active': ri === adaptDrawer.idx }]" @click="adaptDrawer.idx = ri">
            <span class="rwb-ai-idx">{{ ri + 1 }}</span>
            <span class="rwb-ai-name">{{ r.name }}</span>
            <span class="rwb-ai-from">{{ r.from }}</span>
            <span class="rwb-ai-val">{{ r.to }}</span>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 离线表格导入（清单 #2 补缺采集主渠道）：解析 CSV → 字段映射 → 数据预览 → 写入采集项 -->
    <el-dialog title="导入表格补录" :visible.sync="importVisible" width="860px" top="6vh" append-to-body>
      <div class="rwb-imp-note">
        <i class="el-icon-info"></i>
        支持 <b>CSV</b>（Excel 可「另存为 CSV」）；自动识别表头并建议字段映射，未匹配字段可手动指定。
      </div>

      <div class="rwb-imp-row">
        <span class="rwb-imp-label">补录章节</span>
        <el-select v-model="importSectionNo" size="small" style="width:240px;" @change="importMapping = []">
          <el-option v-for="m in collectMissing" :key="sectionNo(m)" :label="m.name" :value="sectionNo(m)"></el-option>
        </el-select>
        <span class="rwb-imp-label" style="margin-left:16px;">数据文件</span>
        <input ref="importFile" type="file" accept=".csv,text/csv" style="display:none;" @change="e => onImportFile(e.target.files && e.target.files[0])" />
        <el-button size="small" icon="el-icon-folder-opened" @click="$refs.importFile.click()">选择文件</el-button>
        <el-button size="small" type="text" icon="el-icon-download" @click="downloadImportTemplate">下载导入模板</el-button>
        <span v-if="importFileName" class="rwb-imp-file"><i class="el-icon-document"></i>{{ importFileName }}（{{ importRows.length }} 行）</span>
      </div>

      <template v-if="importMapping.length">
        <div class="rwb-imp-head">
          <b>字段映射</b>
          <el-tag size="mini" :type="importSummary.rate >= 80 ? 'success' : 'warning'" effect="plain">
            已匹配 {{ importSummary.matched }}/{{ importSummary.total }}（{{ importSummary.rate }}%）
          </el-tag>
          <span class="rwb-imp-hint">精确 {{ importSummary.high }} · 包含 {{ importSummary.medium }} · 模糊 {{ importSummary.low }} · 未匹配 {{ importSummary.none }}</span>
        </div>
        <div class="rwb-table rwb-imp-table">
          <div class="rwb-tr rwb-th"><span>目标字段</span><span>单位</span><span>来源列</span><span>置信度</span></div>
          <div v-for="(row, ri) in importMapping" :key="row.field" class="rwb-tr">
            <span :title="row.hint">{{ row.field }}</span>
            <span class="text-muted">{{ row.unit || '—' }}</span>
            <span>
              <el-select v-model="row.sourceIndex" size="mini" clearable placeholder="未匹配" @change="onImportMapChange(row, ri)">
                <el-option v-for="(h, hi) in importHeaders" :key="hi" :label="h" :value="hi"></el-option>
              </el-select>
            </span>
            <span><el-tag size="mini" :type="importConfidence[row.confidence].type" effect="plain">{{ importConfidence[row.confidence].label }}</el-tag></span>
          </div>
        </div>

        <div class="rwb-imp-head" style="margin-top:14px;">
          <b>数据预览</b>
          <span class="rwb-imp-hint">仅显示前 5 行，确认无误后导入</span>
        </div>
        <div class="rwb-table rwb-imp-table">
          <div class="rwb-tr rwb-th">
            <span v-for="m in importMapping" :key="m.field">{{ m.field }}</span>
          </div>
          <div v-for="(r, ri) in importPreview" :key="ri" class="rwb-tr">
            <span v-for="m in importMapping" :key="m.field">{{ r[m.field] || '—' }}</span>
          </div>
        </div>
      </template>
      <el-empty v-else description="请选择章节与 CSV 文件后查看字段映射" :image-size="60"></el-empty>

      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="importVisible = false">取消</el-button>
        <el-button size="small" type="primary" :disabled="!importMapping.length" @click="confirmImport">确认导入</el-button>
      </span>
    </el-dialog>

    <!-- 数据源头穿透抽屉：从报告数值直达底层通用原始数据源 -->
    <el-drawer
      title="数据源头穿透与核验"
      :visible.sync="penetrateDrawer.visible"
      direction="rtl"
      size="640px"
      append-to-body
      custom-class="rwb-pen-drawer">
      <div v-if="penetrateDrawer.data" class="rwb-pen-body">
        <!-- 1. 当前报告呈现值 -->
        <div class="rwb-pen-card" style="border-top: 3px solid var(--rs-color);">
          <div class="rwb-pen-card-title">
            <i class="el-icon-document" style="color: var(--rs-color);"></i>
            <span>报告呈现指标</span>
          </div>
          <div class="rwb-pen-kv">
            <div class="rwb-pen-kv-item">
              <span class="rwb-pen-kv-k">指标名称：</span>
              <span class="rwb-pen-kv-v" style="font-weight: 700; color: var(--rs-color);">{{ penetrateDrawer.data.itemName }}</span>
            </div>
            <div class="rwb-pen-kv-item">
              <span class="rwb-pen-kv-k">所属章节：</span>
              <span class="rwb-pen-kv-v">{{ penetrateDrawer.data.chapterName }}</span>
            </div>
            <div class="rwb-pen-kv-item">
              <span class="rwb-pen-kv-k">报告呈现值：</span>
              <span class="rwb-pen-kv-v" style="font-size: 16px; font-weight: 700; color: #1e293b;">{{ penetrateDrawer.data.reportValue }}</span>
            </div>
            <div class="rwb-pen-kv-item">
              <span class="rwb-pen-kv-k">锁定口径：</span>
              <span class="rwb-pen-kv-v"><el-tag size="mini" type="primary" effect="plain">{{ (activeTask && activeTask.dept) || '主管部门' }} 法定口径</el-tag></span>
            </div>
          </div>
        </div>

        <!-- 2. 换算与核算链路（任务确定口径） -->
        <div class="rwb-pen-card">
          <div class="rwb-pen-card-title">
            <i class="el-icon-set-up" style="color: #e6a23c;"></i>
            <span>法定口径换算依据</span>
          </div>
          <div class="rwb-pen-step-flow">
            <div class="rwb-pen-step-item" style="border-left-color: #e6a23c;">
              <span class="rwb-pen-step-tag">算法逻辑</span>
              <div class="rwb-pen-step-main">
                <div class="rwb-pen-step-name">{{ penetrateDrawer.data.ruleName }}</div>
                <div class="rwb-pen-step-desc">计算公式：<code>{{ penetrateDrawer.data.formula }}</code></div>
              </div>
            </div>
            <div class="rwb-pen-step-item" style="border-left-color: #67c23a;">
              <span class="rwb-pen-step-tag">采用参数</span>
              <div class="rwb-pen-step-main">
                <div class="rwb-pen-step-name">{{ penetrateDrawer.data.factorName }}</div>
                <div class="rwb-pen-step-desc">标准依据：{{ penetrateDrawer.data.standardDoc }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. 底层通用原始数据源 -->
        <div class="rwb-pen-card" style="border-top: 3px solid #67c23a;">
          <div class="rwb-pen-card-title">
            <i class="el-icon-connection" style="color: #67c23a;"></i>
            <span>原始数据</span>
          </div>
          <div class="rwb-pen-kv" style="grid-template-columns: 1fr;">
            <div class="rwb-pen-kv-item">
              <span class="rwb-pen-kv-k">原始计量源：</span>
              <span class="rwb-pen-kv-v"><b>{{ penetrateDrawer.data.rawSource.device }}</b></span>
            </div>
            <div class="rwb-pen-kv-item">
              <span class="rwb-pen-kv-k">原始采集底数：</span>
              <span class="rwb-pen-kv-v" style="font-size: 15px; font-weight: 700; color: #0067fe;">{{ penetrateDrawer.data.rawSource.rawValue }}</span>
            </div>
            <div class="rwb-pen-kv-item">
              <span class="rwb-pen-kv-k">归集系统/途径：</span>
              <span class="rwb-pen-kv-v">{{ penetrateDrawer.data.rawSource.sourceSystem }}</span>
            </div>
            <div class="rwb-pen-kv-item">
              <span class="rwb-pen-kv-k">采集时间戳：</span>
              <span class="rwb-pen-kv-v">{{ penetrateDrawer.data.rawSource.timestamp }}</span>
            </div>
            <div class="rwb-pen-kv-item">
              <span class="rwb-pen-kv-k">来源凭单号：</span>
              <span class="rwb-pen-kv-v"><code>{{ penetrateDrawer.data.rawSource.rawReceiptNo }}</code></span>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
    <!-- 新手引导浮层 -->
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
import AgentIcon from '@/pages/zcip/common/AgentIcon.vue'
import OnboardingGuide from '../../agent-center/components/OnboardingGuide.vue'
import ScenarioMatch from './components/ScenarioMatch.vue'
import { loadPlatformTemplates } from '../../agent-center/data/platformTemplates'
import { DEFAULT_FORMULAS } from '../../agent-center/data/formulaLibrary'
import TemplateSectionsPreview from '../../agent-center/components/TemplateSectionsPreview.vue'
// 基础支撑：政策标准库服务（规则集加载 / 种子入库 / 依据现行性核验 / 参数标签）
import { ensureSeed, loadStandards, queryStandardConfig, getUpdateWarnings, REPORT_PARAM_LABELS, REPORT_SEEDS } from '@/utils/policyStandardService'
// 基础支撑：排放因子匹配服务（7 场景路由 + 可维护匹配规则表 + 企业映射记忆 + 单位归一）
import { matchFactor } from '@/utils/factorMatchingService'
// 基础支撑：导出服务（5 格式共享框架 + 元信息水印；Word 复用已装依赖 docx，其余零新增依赖）
import { exportReport, EXPORT_FORMATS } from '@/utils/exportService'
// 基础支撑：离线表格导入（清单 #2 补缺采集主渠道；零依赖 CSV 解析 + 字段映射建议）
import { readFileAsText, parseCsv, suggestMapping, applyMapping, mappingSummary, MAPPING_CONFIDENCE } from '@/utils/importService'
// 基础支撑：签发引擎（清单 #15；前端内容指纹 + 完整性校验，生产环境替换为服务端签名）
import { signReport, verifyReport } from '@/utils/signService'
// 章节行值解析（模板预置行对象 / 数组行 / 行名字符串三种形态统一取值）
import { sectionRowValue, sectionRowArray } from '@/utils/sectionRows'

// 整篇预览：AI 改写意图（用户只表达"想要什么"，具体改写交给模型；界面不暴露 prompt）
const AI_POLISH_MODES = {
  polish: { label: '润色' },
  expand: { label: '扩写' },
  condense: { label: '精简' },
  rewrite: { label: '重写' }
}

// 整篇预览：AI 改动持久化 key（按任务 id 分片存储待审改动与已接受正文）
const AI_POLISH_KEY = 'cfp_report_ai_polish'
// AI 改写风格（文体 × 受众）：只调整表达，不改动数值与术语——数值一致性 / 术语 / 篇幅三道护栏照旧生效。
// 演示态按风格做后处理变换；接真实 LLM 时这两个参数直接作为提示词参数注入。
const POLISH_TONES = [
  { value: 'official', label: '公文正式', hint: '报送口径，措辞规范' },
  { value: 'rigorous', label: '专业严谨', hint: '技术口径，依据写清' },
  { value: 'plain', label: '简洁直述', hint: '短句直陈，去修饰' },
  { value: 'briefing', label: '汇报说明', hint: '结论先行，便于阅读' }
]
const POLISH_STYLE_KEY = 'cfp_report_polish_style'

/**
 * 工作台主数据本地持久化：reports / submissionCalendar 刷新不丢
 * seed 变更（mock 结构调整）时旧缓存自动失效，回退内置演示数据
 */
const RS_REPORTS_KEY = 'rs_reports_v1'
const RS_CAL_KEY = 'rs_calendar_v1'
// seed 4：报告状态统一为 3 个（编制中 / 待提报·受理 / 已闭环），stage 收敛为 1~4（不再用 5 表示终态）
// seed 5：本期应报收敛为 3 份（能源审计 / 合规披露 / 能源利用状况），移除碳排放月报与年度碳排放报告演示任务
// seed 6：月度/季度排期的下期推进（月报 → 11 月期次、合规披露 → 2027Q1），不再自动派发 10 月期次任务
// seed 7：清掉 seed 6 期间被「HMR 旧内存数据回写」污染的本缓（残留 10 月期次任务）
// seed 8：演示任务审批配置更新（2026年度能源利用状况报告 → 三级审批）
// seed 9：统一时间维度口径——报送频次与临时报告时间维度统一为 周 / 月 / 年（自定义仅临时报告），临时专项统一更名为「临时报告」
const RS_SEED = 9
// 记录每个 key 实际载入数据的 seed：旧 seed 载入的内存数据禁止回写，
// 否则热更新（HMR）时内存里的旧数据会被按新 seed 写回，形成「旧数据 + 新 seed」的脏缓存
const RS_LOADED_SEED = {}
function loadRsData(key, fallback) {
  try {
    const w = JSON.parse(localStorage.getItem(key) || 'null')
    if (w && w.seed === RS_SEED && Array.isArray(w.data)) {
      RS_LOADED_SEED[key] = RS_SEED
      return w.data
    }
  } catch (e) { /* ignore */ }
  RS_LOADED_SEED[key] = RS_SEED
  return fallback
}
function saveRsData(key, data) {
  if (RS_LOADED_SEED[key] !== RS_SEED) return
  try { localStorage.setItem(key, JSON.stringify({ seed: RS_SEED, data: data })) } catch (e) { /* ignore */ }
}

/**
 * 校验规则目录（清单 #9「格式与逻辑校验」9 类）。
 * 作为校验的**单一数据源**：面板校验项（stagePanels[n].checks）按 id 引用本目录，
 * 规则说明区与综合质量评分同源读取，避免"规则说一套、执行另一套"。
 *  - category：分组（格式合规 / 数据逻辑），用于校验区三级进度展示
 *  - blocking：是否阻断产出（必须项不通过需处置清零）
 *  - standard：判定依据（指向报送标准 / 编制依据 / 内部规范）
 */
/**
 * 异常卡片的处置方式（清单 #11：6 种）。
 *  - defer = true：需回到前置环节处理（补充数据 / 修正报表 / 更新口径映射），卡片保留、继续阻断
 *  - defer = false：确认类（确认使用 / 确认正常）与忽略类，处置后移除卡片并重算放行
 */
const CARD_ACTIONS = [
  { key: 'supplement', label: '补充数据', defer: true, hint: '请在上传材料或对话中补充该数据项，补录后自动重跑校验' },
  { key: 'fix', label: '修正报表', defer: true, hint: '请按报送格式修正报表，修正后自动重跑校验' },
  { key: 'caliber', label: '更新口径映射', defer: true, hint: '口径映射属规则集内容，请在政策标准库调整后重新加载' },
  { key: 'use', label: '确认使用', defer: false, hint: '已确认使用该数据（留痕）' },
  { key: 'normal', label: '确认正常', defer: false, hint: '已确认属正常波动（留痕）' },
  { key: 'ignore', label: '忽略（需填原因）', defer: false, hint: '已忽略并留痕' }
]

/**
 * 报告状态（唯一口径，共 3 个）：
 *  - 编制中       报告尚未定稿归档（阶段一~四进行中）
 *  - 待提报·受理  已签字归档，处于提报环节（内含「待提报 / 已提报待受理」两个子态）
 *  - 已闭环       主管部门已受理，提报链路走完
 *
 * 设计要点：
 *  1) 状态只回答"报告在哪个环节"，不承载任务内部进度——阶段号、缺项与异常由卡片副行
 *     与徽标表达（原先 7 个状态把"阶段"与"提报环节"混装在一起）。
 *  2) 不设「提报失败」：提报在主管部门平台完成、系统内仅登记结果，失败不可达
 *     （接口直报对接后，其失败属提报记录的执行状态，不是报告状态）。
 *  3) 历史数据兼容：旧值（待核对概况 / 待数据采集 / 编排中 / 校验中 / 已归档 / 已提报 / 已受理）
 *     由 reportStatus() 归一，不依赖存储值。
 */
const REPORT_STATUS = {
  composing: { key: 'composing', label: '编制中', tag: 'primary', phase: 'composing' },
  submitting: { key: 'submitting', label: '待提报·受理', tag: 'warning', phase: 'submitting' },
  closed: { key: 'closed', label: '已闭环', tag: 'success', phase: 'closed' }
}

/** 状态筛选相位（Tab 与统计口径；缺项不占 Tab，由卡片徽标与概览副标透出） */
const REPORT_PHASES = [
  { key: 'all', label: '全部' },
  { key: 'composing', label: '编制中' },
  { key: 'submitting', label: '待提报·受理' },
  { key: 'closed', label: '已闭环' }
]

/** 编制阶段短名（卡片副行用：只表编制走到哪一步，不参与状态判定） */
const STAGE_LABELS = { 1: '主体核对', 2: '数据采集', 3: '生成与校验', 4: '确认归档' }


/**
 * 佐证材料库（演示数据）：与阶段二采集项引用的凭证一一对应。
 * 设计要点：材料清单不独立造数——每项都对应阶段二字段 hint 里已点名的凭证
 *（电费结算单、燃气/热力结算单、检测报告编号 HJ-2025-0312、计量表编号、企业档案件），
 * 此前从未汇总到一处；汇总后作为「报送材料包」的组成部分与报告同体交付。
 * status: ready 已齐 / missing 待补 / pending 待回传（提报后由主管部门回执回传）
 * required: 必需项缺失会在「报送包」行与清单弹窗透出计数，但不阻断归档（材料常随后补录）
 */
const MATERIAL_LIB = {
  nybg: [
    { group: '原始凭证', name: '电费结算单（1~12 月）', relatedItems: ['电力消费量', '电力', '外购电量'], type: 'PDF', source: '电网结算系统 · 智能导入', time: '2026-09-16', size: '2.4 MB', required: true, status: 'ready', hash: 'A1B2-C3D4', note: '对应表2 电力消费量 · 计量点 0102-3311' },
    { group: '原始凭证', name: '天然气购气结算单', relatedItems: ['天然气消费量', '天然气'], type: 'PDF', source: '燃气公司结算单 · 智能导入', time: '2026-09-16', size: '1.1 MB', required: true, status: 'ready', hash: 'E5F6-A7B8', note: '对应表3 天然气消费量 · 计量表 G-2026-118' },
    { group: '原始凭证', name: '外购热力结算单', relatedItems: ['外购热力', '热力消费量'], type: 'PDF', source: '热力公司结算单 · 智能导入', time: '2026-09-16', size: '0.8 MB', required: true, status: 'ready', hash: 'C9D0-E1F2', note: '对应表3 外购热力 · 供方 京能热力' },
    { group: '原始凭证', name: '产品产量统计表（MES 导出）', relatedItems: ['单位产品综合能耗', '产品产量', '工业总产值'], type: 'XLSX', source: 'MES 制造执行系统 · 自动导出', time: '2026-09-16', size: '0.5 MB', required: true, status: 'ready', hash: 'B7C8-D9E0', note: '对应表4 单位产品综合能耗（电芯）产量口径' },
    { group: '原始凭证', name: '计量器具检定证书', relatedItems: ['计量', '计量器具', '能源计量'], type: 'PDF', source: '计量管理台账 · 人工上传', time: '2026-03-12', size: '1.6 MB', required: false, status: 'ready', hash: 'D3E4-F5A6', note: '电能表 / 燃气表检定有效期至 2027-03' },
    { group: '原始凭证', name: '污染物排放检测报告（HJ-2025-0312）', type: 'PDF', source: '环保台账 · 人工上传', time: '', size: '—', required: true, status: 'missing', hash: '', note: '阶段二排污数据为缺项，补齐后随报告归档' },
    { group: '资质与制度', name: '营业执照（副本）', relatedItems: ['单位名称', '统一社会信用代码', '单位地址', '法定代表人'], type: 'PDF', source: '企业档案库 · 自动带出', time: '2026-01-08', size: '0.3 MB', required: true, status: 'ready', hash: 'F1A2-B3C4', note: '统一社会信用代码与表1 一致' },
    { group: '资质与制度', name: '能源管理制度与能源管理岗位文件', type: 'PDF', source: '企业档案库 · 自动带出', time: '2026-01-08', size: '0.9 MB', required: true, status: 'ready', hash: 'D5E6-F7A8', note: '对应表8 节能管理落实情况' },
    { group: '资质与制度', name: '能源管理负责人与能源管理师备案证明', type: 'PDF', source: '企业档案库 · 自动带出', time: '2026-02-20', size: '0.4 MB', required: true, status: 'ready', hash: 'B9C0-D1E2', note: '对应表8 人员配备项' },
    { group: '资质与制度', name: '年度节能培训记录与签到表', type: 'PDF', source: '企业档案库 · 人工上传', time: '', size: '—', required: false, status: 'missing', hash: '', note: '表8 培训项已按上期口径填报，建议补充培训记录佐证' }
  ],
  default: [
    { group: '原始凭证', name: '能源费用结算凭证', type: 'PDF', source: '结算系统 · 智能导入', time: '', size: '1.2 MB', required: true, status: 'ready', hash: 'A1B2-C3D4', note: '对应本任务能源消费量数据来源' },
    { group: '原始凭证', name: '计量点台账与抄表记录', type: 'XLSX', source: '能源计量台账 · 自动带出', time: '', size: '0.4 MB', required: true, status: 'ready', hash: 'E5F6-A7B8', note: '计量点归属与抄表口径核对依据' },
    { group: '原始凭证', name: '检测报告或第三方核查材料', type: 'PDF', source: '人工上传', time: '', size: '—', required: false, status: 'missing', hash: '', note: '涉及排放或检测类指标时需附，可按需补录' },
    { group: '资质与制度', name: '营业执照（副本）', type: 'PDF', source: '企业档案库 · 自动带出', time: '', size: '0.3 MB', required: true, status: 'ready', hash: 'C9D0-E1F2', note: '主体信息与报表表头一致' },
    { group: '资质与制度', name: '能源管理制度文件', type: 'PDF', source: '企业档案库 · 自动带出', time: '', size: '0.6 MB', required: false, status: 'ready', hash: 'D3E4-F5A6', note: '制度与岗位落实情况佐证' }
  ]
}

/** 按任务取佐证材料清单：阶段四报送包、清单弹窗与存证底卷共用同一份数据源（不维护第二份清单） */
function materialsOf(report) {
  const t = report || {}
  const lib = MATERIAL_LIB[t.taskKey] || MATERIAL_LIB.default
  return lib.map(m => Object.assign({}, m))
}

/**
 * 多级审核流（清单 #11）：填报人自查 → 部门负责人审核 → 碳管理师复核。
 * 每级可「通过 / 退回修改 / 添加批注」；三级全部通过后方可签字归档（签发后不可修改）。
 */
const AUDIT_LEVELS = [
  { key: 'self', name: '填报人自查', role: '填报人' },
  { key: 'dept', name: '部门负责人审核', role: '部门负责人' },
  { key: 'expert', name: '碳管理师复核', role: '碳管理师' }
]

/**
 * 审批层级模型（V5.1 审批模式解耦：业务流 / 权限流分离）
 * 平台无流程引擎，改用「任务级配置快照」：创建任务时确定审批层级与各节点审核人，编排内只读执行。
 *  - level = 0 无需审批：不设审核节点，填报人确认后直接签发归档
 *  - level = 1 / 2 / 3：按平台三级审核链依次取前 N 级（填报人自查 → 部门负责人审核 → 碳管理师复核）
 * 生产接入 BPMN / 组织权限中枢时，把该 chain 交给工作流服务执行即可，数据模型无需重构。
 */
const APPROVAL_LEVELS = AUDIT_LEVELS.map((l, i) => ({ level: i + 1, roleKey: l.name }))
const APPROVAL_MODE_OPTIONS = [
  { level: 0, label: '无需审批' },
  { level: 1, label: '一级审批' },
  { level: 2, label: '二级审批' },
  { level: 3, label: '三级审批' }
]
// 按层级重建审批链（保留已填审核人）
function approvalChainOfLevel(level, prev) {
  const kept = (prev || []).map(n => n.by || '')
  const n = Math.max(0, Math.min(APPROVAL_LEVELS.length, Number(level) || 0))
  return APPROVAL_LEVELS.slice(0, n).map((x, i) => ({ nodeLevel: x.level, roleKey: x.roleKey, by: kept[i] || '' }))
}
function defaultApproval() {
  return { level: 0, chain: [] }
}
// 任务审批配置归一：旧结构（DIRECT_SIGN / MULTI_LEVEL_APPROVAL）与缺失字段均映射到层级模型
function normalizeApproval(a) {
  let level
  if (a && typeof a.level === 'number') level = a.level
  else if (a && a.mode === 'MULTI_LEVEL_APPROVAL') level = 3
  else level = 0
  level = Math.max(0, Math.min(APPROVAL_LEVELS.length, Number(level) || 0))
  const src = (a && Array.isArray(a.chain)) ? a.chain : []
  const chain = APPROVAL_LEVELS.slice(0, level).map((x, i) => ({
    nodeLevel: x.level, roleKey: x.roleKey, by: (src[i] && src[i].by) || ''
  }))
  // mode 由层级派生，供归档凭据与存证展示沿用（0 = 无需审批）
  return { level, mode: level === 0 ? 'DIRECT_SIGN' : 'MULTI_LEVEL_APPROVAL', chain }
}

/**
 * 临期预警档位常量（全平台统一着色口径）：
 * 红 ≤7 天（紧急临期）/ 黄 8~14 天（注意排期）/ 绿 >14 天（周期充裕）——不再引入第 4 种颜色。
 * 卡片倒计时徽章、左侧 Border 强调色、进度条主色均由本常量计算驱动（urgencyColor / urgency）。
 */
const URGENCY_CONFIG = {
  CRITICAL: { maxDays: 7, color: '#F56C6C', bg: '#FEF0F0', label: '紧急临期' },
  WARNING: { maxDays: 14, color: '#E6A23C', bg: '#FDF6EC', label: '注意排期' },
  NORMAL: { maxDays: Infinity, color: '#67C23A', bg: '#F0F9EB', label: '周期充裕' }
}

/**
 * CTA 临期强调阈值（天）：剩余 ≤ 该天数时，任务卡片主操作按钮转为紧急色。
 * 与 URGENCY_CONFIG.CRITICAL（7 天红档标签）构成两级递进——标签提示"注意排期"，
 * 按钮转红表示"该动手了"，避免两级都用一个阈值导致提醒失去层次。
 */
const CTA_URGENT_DAYS = 3

const CHECK_RULES = [
  // ---- 格式合规（4 类）----
  { id: 'fmt-head', name: '表头完整性', category: '格式合规', severity: '必须', blocking: true, desc: '单位名称 / 统一社会信用代码 / 填报日期等必填项是否齐备', standard: '附件2 报表格式要求' },
  { id: 'fmt-indicator', name: '指标完整性', category: '格式合规', severity: '必须', blocking: true, desc: '所有必填指标行是否有数据（本场景免填项除外）', standard: '附件2 报表格式要求' },
  { id: 'fmt-unit', name: '单位正确性', category: '格式合规', severity: '必须', blocking: true, desc: '数值单位是否与报送标准规定单位一致', standard: '附件2 报表格式要求' },
  { id: 'fmt-precision', name: '精度合规性', category: '格式合规', severity: '建议', blocking: false, desc: '小数位数是否符合报送标准要求', standard: '附件2 报表格式要求' },
  // ---- 数据逻辑（5 类）----
  { id: 'log-sum', name: '分项加总 = 总量', category: '数据逻辑', severity: '必须', blocking: true, desc: '分品种折标加总应等于能源合计；范围 1+2 加总应等于碳排放总量', standard: '内部规范 · 勾稽平衡' },
  { id: 'log-factor', name: '能耗 × 因子推算偏差', category: '数据逻辑', severity: '必须', blocking: true, desc: '能耗 × 排放因子 ≈ 碳排放，偏差 >5% 需核实', standard: 'GB/T 32150' },
  { id: 'log-yoy', name: '同比波动', category: '数据逻辑', severity: '建议', blocking: false, desc: '本期 vs 上期：±10% 提醒 / ±20% 核实 / ±50% 阻断', standard: '内部规范 · 同比阈值' },
  { id: 'log-cross', name: '跨源一致性', category: '数据逻辑', severity: '必须', blocking: true, desc: '同一数据在不同报表 / 系统（MES、计量装置）中的值应一致或差异可解释', standard: '内部规范 · 交叉验证' },
  { id: 'log-caliber', name: '口径合规', category: '数据逻辑', severity: '必须', blocking: true, desc: '范围边界、计算方法是否符合报送标准与编制依据', standard: '编制依据（政策标准库）' }
]

/**
 * 附件报表的数据来源类型（按表号）。
 * 报告附件并非全部由规则引擎生成：主体表来自企业档案、项目与自查类需人工填报、
 * 碳排放表引用碳核查报告——因此表格的只读性与标注必须按来源区分，不能一律标"规则引擎生成"。
 */
const SECTION_FILL_TYPE = {
  '表1': 'profile', '表2': 'auto', '表3': 'manual', '表4': 'auto', '表5': 'auto',
  '表6': 'manual', '表7': 'manual', '表8': 'manual',
  '表9': 'profile', '表10': 'auto', '表11': 'auto', '表12': 'manual', '表13': 'manual',
  '表14': 'profile', '表15': 'auto', '表16': 'manual',
  '表17': 'profile', '表18': 'auto', '表19': 'manual',
  '表20': 'profile', '表21': 'auto', '表22': 'manual',
  '表23': 'profile', '表24': 'auto', '表25': 'manual',
  '表26': 'external', '表27': 'mixed', '表28': 'manual'
}
/**
 * 报告正文的生成内容（附件2 规定的 10 个正文部分）。
 * 正文是「叙述性内容」——AI 改写的作用对象；附件报表（表1~28）是纯数据，不做文字润色。
 * 演示态数据，真实实现由规则引擎按数据池与口径生成。
 */
/** 附件2 规定的 10 个正文部分标题（与 BODY_DEMO 的 正文一~十 一一对应） */
const BODY_TITLES = [
  '用能单位基本情况', '能源消费情况', '能源利用效率', '主要用能环节与设备', '节能措施与节能量',
  '碳排放情况', '可再生能源利用', '节能法规执行情况', '节能目标完成情况', '下一年度节能计划'
]

const BODY_DEMO = {
  '正文一': '京能新能源电池制造有限公司为北京市重点用能单位，主营锂离子动力电池研发与制造，厂区位于北京经济技术开发区。能源管理由能源管理部统一负责，已通过 ISO 50001 能源管理体系认证，配备能源管理师 3 人。',
  '正文二': '2026 年度能源消费量（当量值）3,477.3 吨标准煤，较上年 3,621.0 吨标准煤下降 4.0%；其中电力 2,630.1 吨标准煤（占 75.6%），为主要能源品种。电芯制造车间用电占终端能源消费约 71.2%，涂布与化成工序为主要耗能环节。',
  '正文三': '单位产品综合能耗 0.2704 吨标准煤/万只，同比下降 3.8%，优于电池制造业单位产品能耗限额限定值；单位产品电耗 0.2045 吨标准煤/万只，下降主要受光伏自发自用与化成工序余热回收改造投运影响。',
  '正文四': '主要用能环节为电芯制造车间（涂布、化成、分容工序）与动力站房（空压、冷冻、纯水）。空压系统比功率 0.32 kW/(m³/min)，略高于行业先进值 0.30；冷冻机组综合 COP 4.8，达到二级能效。年度节能措施合计节约 535.0 吨标准煤，折合经济效益约 64.2 万元。',
  '正文五': '2026 年度实施节能改造项目 3 项，累计投资 966 万元，形成节能量 535.0 吨标准煤/年。其中化成工序余热回收利用改造、空压系统变频改造与群控优化 2 项已完工投运，厂房屋顶分布式光伏二期 800 千瓦在建（预计 2026 年 12 月并网）。',
  '正文六': '2026 年度能源活动产生碳排放量 14,733.3 吨二氧化碳，其中直接排放 1,118.1 吨（化石燃料燃烧），间接排放 13,615.2 吨（净购入电力 13,045.4 吨、净购入热力 569.8 吨）。数据引用本单位碳核查报告，口径为京内，与本市碳核查报告口径一致。',
  '正文七': '厂区屋顶光伏装机容量 1,200 千瓦，年度发电 128.6 万千瓦时并全部自发自用；参与市场化绿电交易 320 万千瓦时，核销绿色电力证书 3,200 张（折合 320 万千瓦时）。可再生能源电力占外购电力比例约 20.9%。',
  '正文八': '对照《重点用能单位节能管理办法》要求逐项自查：16 项要求中 14 项已执行；能耗在线监测系统接入、能效对标活动 2 项未完全执行，原因分别为系统对接改造中、尚未开展行业对标。',
  '正文九': '“十五五”节能目标为单位产值能耗下降 14%。2026 年度实际下降 16.6%（年度计划下降率 2.0%，超额完成），累计时间进度完成率 102.9%；能源消费总量 3,477.3 吨标准煤，控制在年度计划 3,580 吨标准煤以内。',
  '正文十': '2027 年度计划实施空压系统变频改造收尾、冷冻站群控优化、光伏二期 800 千瓦扩建三项措施，预计形成节能量 156 吨标准煤；同步完成能耗在线监测系统与市级平台对接，并开展行业能效对标。'
}

// 阶段三「重新生成」的叙述补充说明（按次数轮换，体现"按最新采集数据重算"的差异化输出）
const REGEN_NOTES = [
  '（本次重新生成：补充了同比变化归因与主要影响因素说明。）',
  '（本次重新生成：补充了与上期对比分析及数据来源说明。）'
]

const FILL_TYPE_TEXT = {
  profile: { label: '企业档案带出', hint: '取自组织资源库，可在阶段一编辑', editable: true, icon: 'el-icon-user' },
  auto: { label: '规则引擎计算', hint: '活动数据 × 公式库计算逻辑 × 因子库系数（版本已锁定）', editable: false, icon: 'el-icon-set-up' },
  manual: { label: '人工填报', hint: '依据台账 / 项目资料逐项填报，非系统计算得出', editable: true, icon: 'el-icon-edit-outline' },
  external: { label: '引用外部数据', hint: '引用碳核查报告等外部成果，口径与主管部门一致', editable: false, icon: 'el-icon-link' },
  mixed: { label: '自动采集 + 人工补充', hint: '计量装置自动采集部分，绿证 / 台账等需人工补录', editable: true, icon: 'el-icon-connection' }
}

/**
 * 字符级 diff（LCS 回溯）：把原文与改写结果对齐成 same / del / add 片段，
 * 供审阅时做段内（intraline）高亮——看清具体改了哪几个字，而非整段替换。
 * 中文按字符切分；超长文本退化为整段替换，避免 O(m×n) 回溯卡顿。
 */
function charDiff(a, b) {
  const A = String(a || '').split('')
  const B = String(b || '').split('')
  const m = A.length
  const n = B.length
  if (!m) return B.length ? [{ type: 'add', text: String(b) }] : []
  if (!n) return [{ type: 'del', text: String(a) }]
  if (m * n > 400000) return [{ type: 'del', text: String(a) }, { type: 'add', text: String(b) }]
  const dp = []
  for (let i = 0; i <= m; i++) dp.push(new Int32Array(n + 1))
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const out = []
  const push = (type, ch) => {
    const last = out[out.length - 1]
    if (last && last.type === type) last.text += ch
    else out.push({ type: type, text: ch })
  }
  let i = 0
  let j = 0
  while (i < m && j < n) {
    if (A[i] === B[j]) { push('same', A[i]); i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { push('del', A[i]); i++ }
    else { push('add', B[j]); j++ }
  }
  while (i < m) { push('del', A[i]); i++ }
  while (j < n) { push('add', B[j]); j++ }
  return out
}

// ===== 报告场景的 AI 改写护栏 =====
// 报告是要报送主管部门的正式文件，AI 只应改「表述」，不应改「数据」与「口径」。
// 以下三条判定在前端即可完成，后端接入时复用同一套规则。
const GUARD_NUM_RE = /\d[\d,]*(?:\.\d+)?/g
// 口径术语：出现即代表口径含义，改写后必须原样保留
const GUARD_CALIBER_TERMS = [
  '当量值', '折标系数', '综合能源消费量', '能源消费量', '碳排放量',
  '直接排放量', '间接排放量', '单位产品综合能耗', '单位产值综合能耗', '单位营业收入能耗'
]
// 各改写意图的合理长度区间（改写后 / 原文）
const GUARD_LEN_RATIO = {
  polish: [0.6, 1.6],
  expand: [1.2, 2.5],
  condense: [0.25, 0.8],
  rewrite: [0.6, 1.8]
}
const GUARD_MODE_TEXT = { polish: '润色', expand: '扩写', condense: '精简', rewrite: '重写' }

/**
 * 改写结果校验：返回 { level: 'ok' | 'warn' | 'block', issues: [] }。
 * block = 阻断接受（数值被改 / 丢失，属硬伤，须重新生成或拒绝）；warn = 提示但允许接受。
 */
function guardCheck(src, dst, mode) {
  const s = String(src || '')
  const d = String(dst || '')
  const issues = []
  let level = 'ok'
  const numsOf = t => (String(t).match(GUARD_NUM_RE) || []).map(n => n.replace(/,/g, ''))
  const srcNums = numsOf(s)
  const dstNums = numsOf(d)
  // 1) 数值护栏：原文数字不得丢失或被改写
  const lost = srcNums.filter(n => dstNums.indexOf(n) === -1)
  if (lost.length) {
    level = 'block'
    issues.push('数值不一致：原文数值 ' + lost.slice(0, 4).join('、') + (lost.length > 4 ? ' 等' : '') + ' 未在改写结果中保留')
  }
  // 非扩写意图：不得凭空新增数字（扩写允许补充论据数据）
  if (mode !== 'expand') {
    const added = dstNums.filter(n => srcNums.indexOf(n) === -1)
    if (added.length) {
      level = 'block'
      issues.push('新增数值：' + added.slice(0, 4).join('、') + (added.length > 4 ? ' 等' : '') + ' 未见于原文，需核实后再用')
    }
  }
  // 2) 术语护栏：原文出现过的口径术语必须保留
  const lostTerms = GUARD_CALIBER_TERMS.filter(t => s.indexOf(t) !== -1 && d.indexOf(t) === -1)
  if (lostTerms.length) {
    if (level !== 'block') level = 'warn'
    issues.push('口径术语缺失：' + lostTerms.join('、') + '（术语变更会影响口径含义）')
  }
  // 3) 篇幅护栏：长度突变通常意味着改写跑偏
  const ratio = s.length ? d.length / s.length : 1
  const range = GUARD_LEN_RATIO[mode]
  if (range && s.length >= 20 && (ratio < range[0] || ratio > range[1])) {
    if (level !== 'block') level = 'warn'
    issues.push('篇幅异常：改写后为原文的 ' + Math.round(ratio * 100) + '%（' +
      (GUARD_MODE_TEXT[mode] || '改写') + '预期 ' + Math.round(range[0] * 100) + '%~' + Math.round(range[1] * 100) + '%）')
  }
  return { level: level, issues: issues }
}

// ===== 附件报表演示数据（原型演示态：定稿版式通读须呈现完整数据，不留空占位）=====
// 报表结构仍以模板库 sections 为唯一来源，此处只提供演示取值，不复制表结构：
//  · ANNEX_DEMO_CELLS：表号 → 指标名称 → { 列名: 值 }（补模板行未预置的数据列）
//  · ANNEX_DEMO_ROWS：表号 → 行数组（模板只给一行占位提示、须按实际条目逐条填报的表，演示态给出示例条目）
// 口径与主体数据保持一致：能源合计 3,477.3 tce、电力 2,140.0 万kWh、天然气 46.2 万m³、热力 5,180 百万kJ、
// 余热余压回收 176.6 tce、综合能源消费量 0.3477 万吨标准煤、工业总产值 186,500 万元。
const ANNEX_DEMO_CELLS = {
  '表1': {
    '能源消费成本': { '本期值': '5,286', '上年值': '5,412', '同比变化率（%）': '-2.3%' },
    '能源消费占生产成本比例': { '本期值': '3.5%', '上年值': '3.9%', '同比变化率（%）': '-10.3%' },
    '单位产值综合能耗': { '本期值': '0.0186', '上年值': '0.0223', '同比变化率（%）': '-16.6%' }
  },
  '表3': {
    '原煤': { '工业生产消费量': '—', '加工转换投入（合计 / 火力发电 / 供热 / 原煤入洗 / 炼焦 / 炼油 / 制气等）': '—', '能源加工转换产出': '—', '产出折标量（吨标准煤）': '—', '回收利用': '—' },
    '洗精煤': { '工业生产消费量': '—', '加工转换投入（合计 / 火力发电 / 供热 / 原煤入洗 / 炼焦 / 炼油 / 制气等）': '—', '能源加工转换产出': '—', '产出折标量（吨标准煤）': '—', '回收利用': '—' },
    '焦炭': { '工业生产消费量': '—', '加工转换投入（合计 / 火力发电 / 供热 / 原煤入洗 / 炼焦 / 炼油 / 制气等）': '—', '能源加工转换产出': '—', '产出折标量（吨标准煤）': '—', '回收利用': '—' },
    '天然气（气态）': { '工业生产消费量': '46.2', '加工转换投入（合计 / 火力发电 / 供热 / 原煤入洗 / 炼焦 / 炼油 / 制气等）': '—', '能源加工转换产出': '—', '产出折标量（吨标准煤）': '—', '回收利用': '—' },
    '电力': { '工业生产消费量': '2,140.0', '加工转换投入（合计 / 火力发电 / 供热 / 原煤入洗 / 炼焦 / 炼油 / 制气等）': '—', '能源加工转换产出': '—', '产出折标量（吨标准煤）': '—', '回收利用': '—' },
    '热力': { '工业生产消费量': '5,180', '加工转换投入（合计 / 火力发电 / 供热 / 原煤入洗 / 炼焦 / 炼油 / 制气等）': '—', '能源加工转换产出': '—', '产出折标量（吨标准煤）': '—', '回收利用': '176.6' }
  },
  '表7': {
    '年度计划能源消费总量': { '2022年': '3,800', '2023年': '3,760', '2024年': '3,700', '2025年': '3,640', '2026年': '3,580', '“十五五”节能目标': '3,500' },
    '能源消费总量': { '2022年': '3,782', '2023年': '3,741', '2024年': '3,689', '2025年': '3,621', '2026年': '3,477', '“十五五”节能目标': '—' },
    '计划时间进度能源消费总量': { '2022年': '3,800', '2023年': '7,560', '2024年': '11,260', '2025年': '14,900', '2026年': '18,480', '“十五五”节能目标': '21,980' },
    '实际时间进度能源消费差值': { '2022年': '-18', '2023年': '-19', '2024年': '-11', '2025年': '-19', '2026年': '-103', '“十五五”节能目标': '—' },
    '单位产值能耗年度计划下降率': { '2022年': '2.0%', '2023年': '2.0%', '2024年': '2.0%', '2025年': '2.0%', '2026年': '2.0%', '“十五五”节能目标': '2.5%' },
    '计划累计时间进度': { '2022年': '20.0%', '2023年': '40.0%', '2024年': '60.0%', '2025年': '80.0%', '2026年': '100.0%', '“十五五”节能目标': '—' },
    '实际累计时间进度': { '2022年': '20.5%', '2023年': '40.5%', '2024年': '60.3%', '2025年': '80.5%', '2026年': '102.9%', '“十五五”节能目标': '—' }
  },
  '表28': {
    '1 节能计划与节能措施': { '法规要求节能工作': '每年制定并实施节能计划和节能措施，并确保完成能耗总量控制和节能目标', '是否执行': '是', '未执行原因': '—' },
    '2 能源管理制度': { '法规要求节能工作': '建立健全能源管理制度，包括淘汰落后、节能技术改造及奖惩等管理机制', '是否执行': '是', '未执行原因': '—' },
    '3 节能奖惩制度': { '法规要求节能工作': '建立节能奖惩制度，将能耗总量控制和节能目标完成情况与奖惩挂钩', '是否执行': '是', '未执行原因': '—' },
    '4 节能目标责任制': { '法规要求节能工作': '建立节能目标责任制，分解目标并落实到相应层级或岗位，定期组织内部考核', '是否执行': '是', '未执行原因': '—' },
    '5 节能工作领导小组与能源管理负责人': { '法规要求节能工作': '成立节能工作领导小组，聘任能源管理负责人并报主管部门备案', '是否执行': '是', '未执行原因': '—' },
    '6 能源管理体系建设与运行': { '法规要求节能工作': '建立健全能源管理体系并使之有效运行（ISO 50001）', '是否执行': '是', '未执行原因': '—' },
    '7 能源计量器具与计量管理': { '法规要求节能工作': '配备经依法检定或校准的能源计量器具，完善能源计量体系', '是否执行': '是', '未执行原因': '—' },
    '8 原始记录与统计台账': { '法规要求节能工作': '设置原始记录、统计台账，建立统计资料审核、签署、交接、归档制度', '是否执行': '是', '未执行原因': '—' },
    '9 按时报送能源利用状况报告': { '法规要求节能工作': '每年按要求报送上年度能源利用状况报告', '是否执行': '是', '未执行原因': '—' },
    '10 实施能源审计并报送': { '法规要求节能工作': '实施能源审计并向区级以上节能主管部门报送能源审计报告', '是否执行': '是', '未执行原因': '—' },
    '12 采用节能技术推广目录': { '法规要求节能工作': '优先采用国家重点节能低碳技术推广目录中的技术、工艺和用能设备', '是否执行': '是', '未执行原因': '—' },
    '13 节能资金投入': { '法规要求节能工作': '安排资金用于节能技术研发、节能技术改造、计量器具配备与节能培训', '是否执行': '是', '未执行原因': '—' },
    '14 执行单位产品能耗限额与能源效率强制性国家标准': { '法规要求节能工作': '执行单位产品能耗限额强制性国家标准和能源效率强制性国家标准', '是否执行': '是', '未执行原因': '—' },
    '11 建设能耗在线监测系统': { '法规要求节能工作': '建设能耗在线监测系统并与市级平台对接', '是否执行': '否', '未执行原因': '系统与市级平台对接改造中，预计 2027 年完成接入' },
    '15 开展能效对标活动（非必须）': { '法规要求节能工作': '开展能效对标活动（非必须项）', '是否执行': '否', '未执行原因': '本年度未开展专项能效对标活动，计划 2027 年结合行业对标平台开展' },
    '16 落实固定资产投资项目节能审查制度（有新项目的需执行）': { '法规要求节能工作': '落实固定资产投资项目节能审查制度（有新项目的需执行）', '是否执行': '是', '未执行原因': '—' }
  }
}

const ANNEX_DEMO_ROWS = {
  // 表5：仅填报填报目录外的产品；本单位主要产品（锂电池电芯）在目录内 → 按表4 填报，本表免填
  '表5': [{ name: '本表免填：本单位主要产品（锂电池电芯）已在填报目录中，按表4「工业单位产品综合能耗情况表」填报' }],
  // 表6：本单位无符合条件的数据中心 → 报告内如实标注免填依据，不留空占位
  '表6': [{ name: '本表免填：本单位无全年电力消耗 500 万千瓦时及以上的数据中心（依据企业档案自动判定）' }],
  // 表8：模板仅给一行占位提示，演示态给出示例项目条目
  '表8': [
    { name: '1', cells: { '项目类型': '节能技术改造', '项目分类': '余热余压利用', '项目名称': '化成工序余热回收利用改造', '主要改造内容': '化成柜冷却水余热回收 + 板式换热器 + 热泵机组', '投资金额（万元）': '386', '节能效果（吨标准煤/年）': '176.6', '是否合同能源管理模式': '否', '项目进度': '已完工投运', '审批部门': '区发展改革委备案' } },
    { name: '2', cells: { '项目类型': '节能技术改造', '项目分类': '电机系统能效提升', '项目名称': '空压系统变频改造与群控优化', '主要改造内容': '空压机变频改造、压缩空气管网泄漏治理、群控策略优化', '投资金额（万元）': '152', '节能效果（吨标准煤/年）': '96.4', '是否合同能源管理模式': '否', '项目进度': '已完工投运', '审批部门': '区发展改革委备案' } },
    { name: '3', cells: { '项目类型': '可再生能源利用', '项目分类': '分布式光伏', '项目名称': '厂房屋顶分布式光伏二期 800 千瓦', '主要改造内容': '联合厂房、动力站房屋顶建设分布式光伏 800 千瓦，自发自用余电上网', '投资金额（万元）': '428', '节能效果（吨标准煤/年）': '262.0', '是否合同能源管理模式': '是（合同能源管理）', '项目进度': '在建（预计 2026 年 12 月并网）', '审批部门': '区发展改革委备案' } }
  ],
  // 表27：官方表样为 6 行 × 两组（能源名称 / 计量单位 / 利用量），按位置取值避免重名列串值
  '表27': [
    { name: '市场化交易绿电', vals: ['万kWh', '320', '绿色电力证书', '张', '3,200'] },
    { name: '太阳能光热应用面积', vals: ['㎡', '—', '年内太阳能光伏发电使用量', '万kWh', '128.6'] },
    { name: '太阳能光伏装机容量', vals: ['MW', '1.2', '太阳能光伏发电总量', '万kWh', '128.6'] },
    { name: '地源热泵供暖（制冷）面积', vals: ['㎡', '—', '中深层地热应用面积', '㎡', '—'] },
    { name: '空气源热泵应用面积', vals: ['㎡', '1,860', '沼气投入量', '万m³', '—'] },
    { name: '垃圾直燃投入量', vals: ['吨', '—', '其它', '吨标准煤', '—'] }
  ]
}

export default {
  name: 'ReportSubmissionCenter',
  components: { AgentIcon, OnboardingGuide, ScenarioMatch, TemplateSectionsPreview },
  data() {
    // ===== 用能单位概况：6 类填报场景（附件2 表1/9/14/17/20/23）共用「主体标识 + 能源管理与资质」两组 =====
    const baseGroups = [
      {
        key: 'base', name: '主体标识', icon: 'el-icon-office-building',
        fields: [
          { k: 'region', label: '所属地区', src: 'org' },
          { k: 'domain', label: '所属领域', src: 'std' },
          { k: 'industry', label: '行业', src: 'org' },
          { k: 'orgType', label: '单位类型', src: 'org' },
          { k: 'orgName', label: '单位详细名称', src: 'org' },
          { k: 'legalCode', label: '法人单位代码', src: 'org' },
          { k: 'regDate', label: '单位注册日期', src: 'org' },
          { k: 'regCapital', label: '单位注册资本', unit: '万元', src: 'org' },
          { k: 'address', label: '单位地址', span2: true, src: 'org' },
          { k: 'postcode', label: '邮政编码', src: 'org' },
          { k: 'districtCode', label: '行政区划代码', src: 'org' },
          { k: 'email', label: '电子邮箱', src: 'org' }
        ]
      },
      {
        key: 'manage', name: '能源管理与资质', icon: 'el-icon-user',
        fields: [
          { k: 'energyOrg', label: '能源管理机构名称', src: 'org' },
          { k: 'leaderName', label: '节能主管领导', src: 'org' },
          { k: 'leaderPhone', label: '领导联系电话', src: 'org' },
          { k: 'managerName', label: '能源管理负责人', src: 'org' },
          { k: 'managerMobile', label: '负责人手机', src: 'org' },
          { k: 'managerCert', label: '能源管理师证号', src: 'org' },
          { k: 'managerCount', label: '能源管理师人数', unit: '人', src: 'org' },
          { k: 'certified', label: '能源管理体系认证', src: 'org' },
          { k: 'certDate', label: '认证通过日期', src: 'org' },
          { k: 'certOrg', label: '认证机构', src: 'org' },
          { k: 'fax', label: '传真（区号）', src: 'org' },
          { k: 'centralSoe', label: '是否央企 / 央企集团名称', span2: true, src: 'org' }
        ]
      }
    ]
    // 各场景在主体标识组追加专属字段（工业「从业人员」/ 其他非工业「是否公共机构」/ 交通「细分行业」/ 教育「是否中央部属院校」等）
    const baseGroupsWith = extra => [
      { ...baseGroups[0], fields: baseGroups[0].fields.concat(extra) },
      baseGroups[1]
    ]
    // 每张报表页脚复用的签署信息
    const signGroup = {
      key: 'sign', name: '签署信息（每张报表页脚复用）', icon: 'el-icon-edit-outline',
      fields: [
        { k: 'signLeader', label: '填报负责人', src: 'org' },
        { k: 'signFiller', label: '填报人', src: 'org' },
        { k: 'signPhone', label: '电话', src: 'org' },
        { k: 'signDate', label: '填报日期', src: 'org' }
      ]
    }
    return {
      // ===== 主题色（独立配置：当前与其他智能体统一为标准蓝；如需智慧报告专属色，改这五个值即可整体换回紫色系） =====
      themeColor: '#0067FE',
      themeColorLight: 'rgba(0,103,254,0.08)',
      themeColorHover: '#0052CC',
      themeColorBg: 'rgba(0,103,254,0.06)',
      themeColorBorder: 'rgba(0,103,254,0.35)',
      // ===== 新手引导 =====
      showOnboarding: false,
      onboardingStep: 0,
      onboardingSteps: [
        {
          icon: 'el-icon-document-checked',
          title: '欢迎使用智慧报告智能体',
          text: '这里是智慧报告工作空间。为您提供碳排放报告、能源审计报告、合规披露文件的智能编排服务，涵盖模板匹配、口径适配、合规校验、智慧报告全流程。',
          features: [
            { icon: 'el-icon-s-order', title: '3类报告', desc: '碳排放报告·能源审计报告·合规披露文件', color: '#0067FE' },
            { icon: 'el-icon-s-check', title: CHECK_RULES.length + '条校验规则', desc: '格式合规 + 数据逻辑（口径一致性·因子版本·勾稽平衡）自动校验', color: '#0067FE' },
            { icon: 'el-icon-s-claim', title: '模板自动匹配', desc: '模板由平台模板库统一维护，创建计划时自动匹配', color: '#0067FE' }
          ],
          tip: '首次使用建议依次浏览全部引导内容，约需1分钟。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-chat-dot-round',
          title: '智能对话区',
          text: '页面中间为对话区，直接向小易提问或下达指令。输入"新建报告"即可创建报告任务，小易会引导您完成编排与提报。',
          features: [
            { icon: 'el-icon-plus', title: '快速创建', desc: '输入"新建报告"或在右栏点「新建」', color: '#0067FE' },
            { icon: 'el-icon-magic-stick', title: '智能问答', desc: '「查看进度」「口径适配」即问即答', color: '#0067FE' },
            { icon: 'el-icon-s-opportunity', title: '常用指令', desc: '点击灯泡图标查看指令清单', color: '#0067FE' }
          ],
          tip: '试试输入"新建报告"开始一个报告任务。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-chat-line-square',
          title: '历史对话栏',
          text: '页面左侧为历史对话栏，点击可展开查看历史对话记录，支持切换和删除对话；发送消息后自动记录会话。',
          features: [
            { icon: 'el-icon-folder-opened', title: '对话记录', desc: '自动保存每次对话，按时间倒序排列', color: '#0067FE' },
            { icon: 'el-icon-switch-button', title: '快速切换', desc: '点击历史对话即可恢复上下文', color: '#0067FE' },
            { icon: 'el-icon-d-arrow-left', title: '可收缩', desc: '点击边条可展开/收缩历史栏', color: '#909399' }
          ],
          tip: '窄屏（<1100px）下历史栏自动隐藏。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-s-grid',
          title: '右侧工作台',
          text: '页面右侧为两页签工作台：报送任务按「本期应报（排期自动生成）+ 其他任务」分区展示；排期规则页签配置各「部门 / 报告类型 / 频次」的报送计划（期次自动生成，支持停用 / 编辑 / 删除）。报告模板由平台模板库统一维护，创建计划时自动匹配并锁定版本。合规校验为编排时自动执行的内置能力，可直接向小易提问了解。',
          features: [
            { icon: 'el-icon-s-order', title: '报送任务', desc: '本期应报置顶+截止倒计时，点击开始编排', color: '#0067FE' },
            { icon: 'el-icon-date', title: '报送排期', desc: '部门/频次/期次自动生成计划，可停用/编辑/删除', color: '#0067FE' },
            { icon: 'el-icon-s-claim', title: '模板自动匹配', desc: '创建计划时自动匹配平台模板库并锁定版本', color: '#0067FE' }
          ],
          tip: '周期性报告无需手动创建，点开「报送任务」即可开始本期编排。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-circle-check',
          title: '归档与提报',
          text: '报告在编排内完成签字归档后，状态为「已归档·待提报」：请在主管部门平台提交后，回到任务卡片点击「登记提报」录入凭证；主管部门受理后再点「登记受理」即闭环。归档文件统一在「报告与档案中心」查看与下载，已归档 / 已提报 / 已受理的任务承载留痕与档案，不可删除。',
          features: [
            { icon: 'el-icon-upload', title: '登记提报', desc: '政府平台提交后录入凭证与附件', color: '#0067FE' },
            { icon: 'el-icon-circle-check', title: '登记受理', desc: '主管部门受理后确认闭环', color: '#0067FE' },
            { icon: 'el-icon-collection', title: '报告与档案中心', desc: '归档报告统一查看与下载', color: '#0067FE' }
          ],
          tip: '已归档的任务卡片上有「报告与档案中心 ↗」快捷入口。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-bell',
          title: '即将上线（规划中）',
          text: '当期的提醒已由欢迎区【本期提报态势】推送到工作台（任务聚合、紧急置顶、截止倒计时）；以下为规划中的跨期分析能力，当前版本暂未开放，界面不会有对应入口：',
          features: [
            { icon: 'el-icon-data-analysis', title: '报表统计分析（规划中）', desc: '跨期趋势——按部门 / 期次 / 类型的提报时效与质量对比', color: '#909399' }
          ],
          tip: '规划中能力暂无界面入口，以实际版本发布为准。',
          iconStyle: {}
        }
      ],
      userInput: '',
      searchReport: '',
      messages: [],
      showCmdPanel: false,
      rightPanel: 'reports',
      // ===== 双模态：home=总览接待态 / active=任务激活沉浸态 =====
      pageMode: 'home',
      activeTaskId: null,
      activeStage: 1,
      wbCmdOpen: false,
      wbInput: '',
      wbMessages: [],
      docActiveKey: '',   // 章节导航当前高亮
      docNavOpen: false,   // 章节下拉展开态
      docViewMode: 'edit',  // 'edit'=编制态 | 'preview'=预览与归档态
      docPreviewOpen: {},  // 预览态章节展开（表默认收起）
      docAuditPassed: {}, // 预览态：各级审批通过状态
      docFocusKey: '',   // 当前定位到的待确认项
      docOverrides: {},   // 项级覆盖层（确认/改值，持久到本任务会话）
      editingKey: '',     // 当前行内编辑中的项（sec.key-idx / sec.key-ri-ci），空=无
      cellEditValue: '',  // 表格单元格编辑临时值
      docFocus: null,     // 当前聚焦项 { secKey, itemKey }
      bndInput: '',
      // 注：原 previewException（例外放行标记）已移除——报告数据必须保持一致，不设例外路径

      // 阶段三校验区展开状态（null = 默认：有异常自动展开、无异常收起）
      verifyExpanded: null,
      // 四阶段定义（原阶段三/四合并为「生成与校验」：校验是生成产物的质检，不再是独立阶段）
      stages: [
        { n: 1, name: '模板匹配与主体核对', icon: 'el-icon-aim' },
        { n: 2, name: '数据采集', icon: 'el-icon-s-data' },
        { n: 3, name: '生成与校验', icon: 'el-icon-set-up' },
        { n: 4, name: '确认归档', icon: 'el-icon-document-checked' }
      ],
      // 数据就绪度说明已并入态势统计（底座由外部模块提供，消费方视角）
      // 右栏状态筛选
      filterTag: 'all',
      filterDept: '',
      // 副驾驶折叠态：收起后对话区收为 48px 窄浮标，右侧作业区拉宽（响应式声明必须，否则赋值不触发渲染）
      chatCollapsed: false,
      // 历史对话展开态：默认折叠上一阶段的线索消息，只留当前阶段协同内容
      wbShowAllHistory: false,
      // 整篇预览中由异常锚点定位到的章节下标（-1 表示无高亮）
      flashSecIndex: -1,
      // 成文画布中当前定位/高亮的章节下标（-1 表示无）
      canvasSecIndex: -1,
      // 左栏目录折叠态（收起后画布更宽，适配窄屏工作台）
      tocCollapsed: false,
      // 校验明细过滤态：'all' | 'pending' | 分组名（格式合规 / 数据逻辑）
      verifyFilter: 'all',
      // 正文就地人工修订：{ text, note, numberChanged, by, at }（按正文章节下标存）
      manualEdits: {},
      // 就地编辑态与选区态（章节下标，-1 表示无）
      editChapter: -1,
      selChapter: -1,
      // 口径换算依据抽屉（正文数值点击 / 章节底部入口）：rows 为已解析的换算项，source 为来源表名
      adaptDrawer: { visible: false, title: '', source: '', rows: [], idx: 0 },
      penetrateDrawer: { visible: false, data: null },
      // 状态过滤 Tab：与报告状态（3 个）同一口径；缺项不进 Tab，用卡片徽标 + 概览副标透出
      filters: REPORT_PHASES,
      // 模板预览弹窗开关（目录与内容由共享组件 TemplateSectionsPreview 渲染）
      tplPreviewVisible: false,
      // 整篇报告预览弹窗开关（阶段三：按定稿版式通读全文）
      reportPreviewVisible: false,
      // 阶段二 / 阶段三章节展开状态（按表号索引）：章节数据来自 computed（每次重算返回新对象），
      // 展开态必须存在独立 state，不能挂在章节对象上，否则点开后立刻丢失
      collectOpen: {},
      narrOpen: {},
      // 整篇预览：段落级 AI 改写待审改动（key = 章节索引，值 = { mode, modeLabel, text, status }）。
      // 改动保持 pending 直到被接受/拒绝，不静默写入正文。
      aiPolish: {},
      // AI 改写风格（文体 × 受众）：选择后作用于后续生成，并随改动一并留痕
      polishTone: (() => { try { return (JSON.parse(localStorage.getItem(POLISH_STYLE_KEY) || '{}').tone) || 'official' } catch (e) { return 'official' } })(),
      // 已接受的 AI 改写正文（key = 章节索引）：随任务会话保持，切换任务时重置（enterReport）
      aiNarratives: {},
      // 阶段三章节级操作：已采纳章节（key=章节号）与重新生成的叙述覆盖（key=章节号）
      adopted: {},
      regenNarratives: {},
      regenSeq: {},
      // 改动导航游标（记录上次跳转到的章节索引，用于「下一处改动」）
      aiPolishCursor: -1,
      // 编制依据明细弹窗（展示该规则集引用的公式与参数）
      caliberVisible: false,
      // 数据溯源弹窗（L1 报表 → L4 原始采集）
      traceVisible: false,
      // 佐证材料清单弹窗（只读核验 + 整包下载）
      materialVisible: false,
      // 修订留痕展开态：归档证据默认收起——信息性内容不打断「核验 → 签发 → 归档」动作链
      revisionOpen: false,
      // 签发记录（清单 #15）：签字归档时生成内容指纹，供完整性校验
      signRecord: null,
      // 完整性校验结果（签字后重新计算指纹比对）
      signVerify: null,
      // 阶段二章节过滤（缺项消番模式）：默认「待补录缺项」，全量一览一键切换
      chapterFilter: 'missing',
      // 免填/条件判定说明条展开状态（默认收起为单行摘要）
      naOpen: false,
      // 复合阻断处置流（按章节号）：{ cause: 差异归因, rule: 处置规则, note: 豁免说明 }
      disposeFlows: {},
      // 处置表单展开态（按章节号）：阻断存在时默认收起为一行处置条
      disposeOpen: {},
      // 消番动效：在缺项 Tab 下刚补齐的章节（保留为置灰折叠态，切换 Tab / 刷新后归位全量）
      justCompleted: [],
      // 阶段四审批模式（V5.1 架构解耦）已改为**任务级配置**：创建任务时确定
      // （calForm.approval / newReport.approval → task.approval），编排内只读；
      // 由计算属性 approvalChainOf / approvalMode 从当前任务读取（缺失回退单人闭环基线）
      // 离线表格导入（清单 #2 主渠道）：文件解析结果与字段映射
      importVisible: false,
      importSectionNo: '',
      importFileName: '',
      importHeaders: [],
      importRows: [],
      importMapping: [],
      importConfidence: MAPPING_CONFIDENCE,
      // 多级审核流状态（清单 #11）：key → { status: pending | passed | rejected, by, time, comment }
      auditFlow: {
        self: { status: 'passed', by: '填报人（当前用户）', time: '09-16 09:40', comment: '数据已核对计量点归属' },
        dept: { status: 'passed', by: '部门负责人（当前用户）', time: '09-16 10:05', comment: '同意报送' },
        expert: { status: 'pending', by: '', time: '', comment: '' }
      },
      // 阶段面板数据（按阶段组织）
      stagePanels: {
        1: {
          bndTitle: '用能边界与填报属性',
          bndLabel: '排放源识别',
          fillDept: '安环部',
          statRange: '',
          industry: '制造业（新能源电池）',
          energyLevel: '重点用能单位（北京市名录在册）',
          org: '京能新能电池制造基地 · 全厂区（生产区 + 动力站房 + 研发楼）',
          orgName: '京能新能源电池制造有限公司',
          creditCode: '91110108MA07P5Q678',
          address: '北京市北京经济技术开发区宏达北路12号',
          bndItems: ['固定燃烧源（天然气锅炉）', '移动燃烧源（厂内叉车）', '过程排放（无）', '净购入电力'],
          special: '',
          src: { fillDept: 'org', industry: 'org', energyLevel: 'org', org: 'org', bndItems: 'org', special: 'auto', statRange: 'auto' },
          pools: [
            { ch: '基础计量', items: '外购电量 SCADA、天然气流量计', ready: '接口可用', ok: true, note: '' },
            { ch: '生产统计', items: '工业总产值、主要产品产量', ready: 'ERP/MES 接口可用', ok: true, note: '' },
            { ch: '购存台账', items: '柴油采购发票、期初/期末库存', ready: '需人工补录台账', ok: false, note: '' },
            { ch: '专项台账', items: '节能技改项目、绿电交易凭证', ready: '需台账核对', ok: false, note: '' }
          ]
        },
        2: {
          // 采集项明细（演示态数据）；表清单与表名以模板 sections 为准，见 computed stageItems
          rawItems: [
            { name: '月度用电量', ready: '电力数据 · 自动采集', status: '已采集', totalFields: 4,
              fields: [
                { name: '本月用电量', unit: '千瓦时', hint: '取自电表抄见或 SCADA' },
                { name: '峰段 / 平段 / 谷段电量', unit: '千瓦时', hint: '按分时电价时段拆分' },
                { name: '电费金额', unit: '元', hint: '与电费账单核对' },
                { name: '计量点编号 / 抄表日期', unit: '文本', hint: '溯源用' }
              ] },
            { name: '外购热力量', ready: '能耗台账 · 自动采集', status: '已采集', totalFields: 3,
              fields: [
                { name: '外购热力量', unit: '吉焦', hint: '与热力结算单核对' },
                { name: '热力折标量', unit: '吨标准煤', hint: '按当量值折标' },
                { name: '结算单编号 / 供方名称', unit: '文本', hint: '溯源用' }
              ] },
            { name: '天然气消耗量', ready: '能耗台账 · 自动采集', status: '已采集', totalFields: 3,
              fields: [
                { name: '天然气用量', unit: '立方米', hint: '与燃气表读数核对' },
                { name: '天然气折标量', unit: '吨标准煤', hint: '按当量值折标' },
                { name: '供气单位 / 计量表编号', unit: '文本', hint: '溯源用' }
              ] },
            { name: '排污数据', ready: '环保台账 · 人工录入', status: '缺项',
              reason: '排污数据分散在环保台账与检测报告中，数据底座未接入',
              suggest: '上传《污染物排放检测报告》或环保台账，系统解析后自动回填；也可直接在下方字段明细中在线填写',
              caliber: '按报送模板要求的污染物种类与计量单位',
              ref: '上期：COD 1.2 t、氨氮 0.08 t、颗粒物 0.6 t',
              fields: [
                { name: 'COD（化学需氧量）排放量', unit: 't', hint: '取自排污许可证执行报告或检测报告', ref: '上期 1.2' },
                { name: '氨氮排放量', unit: 't', hint: '与 COD 同源', ref: '上期 0.08' },
                { name: '颗粒物排放量', unit: 't', hint: '有组织排放合计', ref: '上期 0.6' },
                { name: '数据来源说明', unit: '文本', hint: '检测报告编号或在线监测点位名称', ref: '上期 检测报告 HJ-2025-0312' }
              ] },
            { name: '表6 数据中心能源利用效率情况表', ready: '条件性表格 · 自动判定', status: '不适用',
              reason: '本单位无全年电力消耗 500 万千瓦时及以上的数据中心（依据企业档案自动判定），本表免填',
              fields: [
                { name: '本表免填说明', unit: '—', hint: '本单位无全年电力消耗 500 万千瓦时及以上的数据中心', value: '本表免填（依据系统自动判定）' }
              ] }
          ]
        },
        3: {
          // 规则引擎的生成结果（按表号挂载到模板章节上）；
          // 章节结构（有哪些表、表名、列）以模板库 sections 为唯一来源，此处只承载内容
          generated: [
            {
              name: '碳排放核算（范围1 + 范围2）',
              desc: '主管部门规定因子 · 规则引擎执行',
              content: {
                table: {
                  columns: ['排放源', '活动数据', '排放量（tCO₂）'],
                  rows: [
                    ['外购电量', '1,820 MWh', '1,109.5'],
                    ['天然气', '32.6 万Nm³', '704.9'],
                    ['合计（范围1 + 范围2）', '—', '1,814.4']
                  ]
                },
                narrative: '本期碳排放总量 1,814.4 吨二氧化碳当量，其中范围 2（外购电力与热力）占比 61.1%，为主要排放来源。与上月相比总量下降 4.2%，主要受用电量环比减少影响。'
              },
              adapts: [
                { name: '外购电量', from: '1,820 MWh', rule: '×电网因子 0.6096 kgCO₂/kWh', to: '1,109.5 tCO₂', formulaRef: 'FL-002', factorRef: '电网排放因子 · 2025年第3号公告版' },
                { name: '天然气', from: '32.6 万Nm³', rule: '×21.622 tCO₂/万Nm³', to: '704.9 tCO₂', formulaRef: 'FL-001', factorRef: '天然气排放因子 · 2025年第3号公告版' },
                { name: '碳排放总量（范围1+2）', from: '—', rule: '范围1 + 范围2 加总', to: '1,814.4 tCO₂', formulaRef: 'FL-018', factorRef: '' }
              ]
            }
          ],
          // 校验与异常处置（原独立阶段四已并入本阶段：校验区置于面板顶部，异常时自动展开并需处置）
          // 校验项按 id 引用 CHECK_RULES（9 类：格式合规 4 + 数据逻辑 5）
          checks: [
            { id: 'fmt-head', value: '13/13 项齐备', threshold: '必填项齐备', pass: true },
            { id: 'fmt-indicator', value: '4 章齐备', threshold: '必填项齐备', pass: true },
            { id: 'fmt-unit', value: '全部一致', threshold: '与规定单位一致', pass: true },
            { id: 'fmt-precision', value: '1 项 2 位小数', threshold: '按规范位数', pass: true },
            { id: 'log-sum', value: '差 0.8 tCO₂', threshold: '必须为 0', pass: false },
            { id: 'log-factor', value: '2.1%', threshold: '≤5%', pass: true },
            { id: 'log-yoy', value: '-4.2%', threshold: '±10% 提醒', pass: true },
            { id: 'log-cross', value: '跨部门口径差异 9.9%', threshold: '差异可解释', pass: true },
            { id: 'log-caliber', value: '范围 1+2 · 法人边界', threshold: '符合规则集', pass: true }
          ],
          cards: [
            { id: 'ac1', title: '范围分项加总与总量差 0.8 tCO₂', desc: '范围1+范围2 分项加总 1,814.4 tCO₂，与报告总量栏 1,813.6 tCO₂（上期结转口径）不一致。', suggest: '疑似四舍五入精度导致，建议按报送规范统一保留 1 位小数后重算（AI 建议）', sec: '碳排放核算' }
          ]
        },
        4: {
          revisions: [
            { time: '09-05 14:20', text: '预览页修订「范围2 排放量」：1,108.9 → 1,109.5 tCO₂（自动重跑勾稽校验通过）', by: '手改' },
            { time: '09-05 15:02', text: '异常卡片处置：确认勾稽差异为精度舍入，统一精度后重渲染', by: '人工' }
          ],
          // 预览修订指标：修订后自动重跑勾稽类校验项；破坏平衡则阻断签字（勾稽类强制重跑，同比类豁免）
          metrics: [
            { key: 's1', name: '范围1 排放量', unit: 'tCO₂', value: 704.9, editable: true },
            { key: 's2', name: '范围2 排放量', unit: 'tCO₂', value: 1109.5, editable: true },
            { key: 'total', name: '报告总量（范围1+2）', unit: 'tCO₂', value: 1814.4, editable: false }
          ]
        }
      },
      // ===== 能源利用状况报告（附件2）专用阶段面板：以真实编制要求为蓝本 =====
      // 能源利用状况报告（附件2）专用阶段面板：演示主体为工业企业（京能新能源电池制造）
      // 填报领域=工业，报表族走表1~8 + 表26~28；非工业场景由模板 variants 支持切换
      nybgPanels: {
        1: {
          bndTitle: '用能边界与填报属性',
          bndLabel: '系统划分',
          fillDept: '能源管理部',
          statRange: '2026全年',
          industry: '制造业（新能源电池）',
          energyLevel: '重点用能单位（北京市名录在册）',
          org: '京能新能源电池制造基地 · 全厂区（能源平衡表口径，物理边界与法人边界一致）',
          orgName: '京能新能源电池制造有限公司',
          creditCode: '91110108MA07P5Q678',
          address: '北京市北京经济技术开发区宏达北路12号',
          bndItems: ['生产系统：电芯制造车间（涂布/卷绕/化成）、动力站房（天然气锅炉）', '辅助系统：空调制冷、空压机组、水泵风机', '附属系统：办公研发楼、厂内运输车辆'],
          special: '',
          src: { fillDept: 'org', industry: 'org', energyLevel: 'org', org: 'org', bndItems: 'org', special: 'auto', statRange: 'auto' },
          pools: [
            { ch: '基础计量', items: '外购电量 SCADA、天然气流量计', ready: '接口可用', ok: true, note: '' },
            { ch: '生产统计', items: '工业总产值、电芯产量（B204-1）', ready: 'ERP/MES 接口可用', ok: true, note: '' },
            { ch: '购存台账', items: '柴油采购发票、期初/期末库存', ready: '需人工补录台账', ok: false, note: '' },
            { ch: '专项台账', items: '年度节能技改项目、绿电交易凭证', ready: '需台账核对', ok: false, note: '' }
          ]
        },
        2: {
          // 采集项明细（演示态数据）；表清单与表名以模板 sections 为准，见 computed stageItems
          rawItems: [
            { name: '表1 基本情况表', ready: '组织资源库 · 自动带出', status: '已采集', totalFields: 30,
              fields: [
                { name: '单位详细名称', unit: '文本', hint: '与营业执照一致' },
                { name: '法人单位代码', unit: '文本', hint: '统一社会信用代码' },
                { name: '单位注册日期 / 注册资本', unit: '年月 / 万元', hint: '取自工商登记信息' },
                { name: '所属地区 / 行政区划代码', unit: '文本', hint: '至区县级' },
                { name: '单位地址 / 邮政编码 / 电子邮箱', unit: '文本', hint: '通信地址' },
                { name: '能源管理机构名称', unit: '文本', hint: '如"能源管理部"' },
                { name: '节能主管领导 / 联系电话', unit: '文本', hint: '含区号' },
                { name: '能源管理负责人 / 手机 / 能源管理师证号', unit: '文本', hint: '证号须在有效期内' },
                { name: '能源管理体系认证情况', unit: '是/否 + 日期 + 机构', hint: '如已通过 ISO 50001' },
                { name: '上缴利税 / 从业人员 / 能源管理师人数', unit: '万元 / 人 / 人', hint: '本期值与上年值' },
                { name: '综合能源消费量（当量值）', unit: '万吨标准煤', hint: '与表2 合计一致' },
                { name: '工业总产值 / 销售收入 / 生产成本', unit: '万元', hint: '本期值与上年值' },
                { name: '填报负责人 / 填报人 / 电话 / 填报日期', unit: '文本', hint: '签署信息，渲染至页脚' }
              ] },
            { name: '表2 能源消费结构表', ready: '数据底座 · 电力/天然气/柴油', status: '已采集', totalFields: 40,
              fields: [
                { name: '原煤 / 洗精煤 / 焦炭（实物量 + 折标量）', unit: '吨 / 吨标准煤', hint: '按代码01~03 分品种填报' },
                { name: '天然气（实物量 + 折标量）', unit: '万立方米 / 吨标准煤', hint: '含外购与自产' },
                { name: '汽油 / 柴油 / 燃料油', unit: '吨 / 吨标准煤', hint: '移动源与固定源合并统计' },
                { name: '液化石油气 / 其他石油制品', unit: '吨 / 吨标准煤', hint: '' },
                { name: '电力（外购量）', unit: '万千瓦时 / 吨标准煤', hint: '与电费账单核对' },
                { name: '热力（外购量）', unit: '百万千焦 / 吨标准煤', hint: '与热力结算单核对' },
                { name: '其他能源品种（如生物质、余热余压）', unit: '各品种单位', hint: '按代码37~39 填报' },
                { name: '能源消费量合计', unit: '吨标准煤', hint: '各品种折标量加总（代码40）' },
                { name: '本年 / 上年综合能源消费量（当量值）', unit: '万吨标准煤', hint: '用于同比对比' }
              ] },
            { name: '表3 工业能源消费结构附表', ready: '能源管理台账 · 待人工填报', status: '缺项',
              reason: '该项为能源加工转换投入产出与余热余压回收记录，数据底座无对应成品指标',
              suggest: '上传《年度能源管理台账》（含加工转换投入产出、回收利用记录），系统解析后自动回填',
              caliber: 'GB/T 2589 当量值折标',
              ref: '上期：加工转换投入 12,400 tce、产出 11,860 tce；余热余压回收 176.6 tce',
              fields: [
                { name: '加工转换投入量（按能源品种）', unit: 'tce', hint: '原煤入洗、炼焦、发电供热等投入，按品种分行', ref: '上期 12,400' },
                { name: '加工转换产出量（按能源品种）', unit: 'tce', hint: '二次能源产出：电力、热力、焦炭、成品油等', ref: '上期 11,860' },
                { name: '余热余压回收利用量', unit: 'tce', hint: '回收后自用的余热余压折标量', ref: '上期 176.6' },
                { name: '回收利用去向说明', unit: '文本', hint: '如"用于本厂预热/发电"，无则填"无"', ref: '上期 用于本厂发电' }
              ] },
            { name: '表5 其他单位产品综合能耗情况表', ready: '条件性表格 · 自动判定', status: '不适用',
              reason: '本单位主要产品（锂电池电芯）已在填报目录中，按表4 填报；本表仅填报目录外产品，故免填',
              // 免填章节同样给出 fields（与表23~24 一致）：章节卡片与字段区都按 fields 渲染，
              // 缺失会读 undefined.length 导致渲染异常
              fields: [
                { name: '本表免填说明', unit: '—', hint: '主要产品（锂电池电芯）在填报目录内，按表4 填报；本表仅填报目录外产品', value: '本表免填（依据系统自动判定）' }
              ] },
            { name: '表4 单位产品综合能耗（电芯）', ready: 'MES 产量 + 能源折标 · 计算', status: '已采集', totalFields: 6,
              fields: [
                { name: '主要产品名称 / 年产能 / 年产量', unit: '文本 / 万只 / 万只', hint: '取自 MES 产量数据' },
                { name: '单位产品综合能耗（指标值）', unit: '吨标准煤/万只', hint: '子项 ÷ 母项' },
                { name: '子项值（综合能耗）', unit: '吨标准煤', hint: '与表2 合计一致' },
                { name: '母项值（合格产品产量）', unit: '万只', hint: '与产量台账核对' },
                { name: '单位产品电耗', unit: '千瓦时/万只', hint: '仅电力部分' },
                { name: '节能量（对比上年）', unit: '吨标准煤', hint: '按单位产品能耗差值 × 产量测算' }
              ] },
            { name: '表26 碳排放情况表', ready: '碳核查报告 · 直接引用', status: '已采集', totalFields: 8,
              fields: [
                { name: '化石燃料燃烧排放量', unit: '吨二氧化碳', hint: '引用碳核算结果' },
                { name: '工业生产过程排放量', unit: '吨二氧化碳', hint: '无过程排放时填 0' },
                { name: '净购入电力间接排放量', unit: '吨二氧化碳', hint: '净购入电量 × 电网因子' },
                { name: '净购入热力间接排放量', unit: '吨二氧化碳', hint: '净购入热力量 × 热力因子' },
                { name: '输出电力抵减量', unit: '吨二氧化碳', hint: '有对外供电时填报' },
                { name: '输出热力抵减量', unit: '吨二氧化碳', hint: '有对外供热时填报' },
                { name: '回收利用抵减量', unit: '吨二氧化碳', hint: '余热余压等回收自用部分' },
                { name: '碳排放总量', unit: '吨二氧化碳', hint: '上述各项加总后扣减' }
              ] },
            { name: '表27 新能源及可再生能源利用表', ready: '光伏计量 · 自动采集', status: '已采集', totalFields: 12,
              fields: [
                { name: '太阳能光伏装机容量 / 发电总量', unit: '千瓦 / 万千瓦时', hint: '取自逆变器与并网计量' },
                { name: '太阳能光热利用面积', unit: '平方米', hint: '如有太阳能热水系统' },
                { name: '地源热泵供暖（制冷）面积', unit: '平方米', hint: '含水源、地源、污水源' },
                { name: '中深层地热应用面积', unit: '平方米', hint: '' },
                { name: '空气源热泵应用面积', unit: '平方米', hint: '' },
                { name: '沼气投入量 / 垃圾直燃投入量', unit: '万立方米 / 万吨', hint: '无则填 0' },
                { name: '绿色电力证书核销量', unit: '万千瓦时', hint: '填年度内核销量（实际使用量）' },
                { name: '其他可再生能源利用量', unit: '吨标准煤', hint: '按折标量填报' }
              ] },
            { name: '表28 节能工作落实自查表', ready: '法务合规 · 待逐项勾选', status: '缺项',
              reason: '该项为法规要求节能工作落实情况的自查勾选，需企业逐项确认',
              suggest: '按法规要求逐项勾选执行情况，未执行项须填写原因后提交',
              caliber: '法规要求节能工作清单（8 项）',
              ref: '上期：全部执行（8/8 项）',
              fields: [
                { name: '年度节能计划制定与实施', unit: '是/否', hint: '是否制定节能计划、节能措施并确保完成能耗总量控制与节能目标', ref: '上期 是' },
                { name: '能源管理制度建立', unit: '是/否', hint: '含淘汰落后、节能技改、奖惩等管理机制', ref: '上期 是' },
                { name: '能源计量器具配备与检定', unit: '是/否', hint: '按 GB 17167 配备并定期检定', ref: '上期 是' },
                { name: '能源消费统计与台账', unit: '是/否', hint: '按月度/年度如实统计并建立台账', ref: '上期 是' },
                { name: '能耗在线监测系统接入', unit: '是/否', hint: '是否按要求接入能耗在线监测系统', ref: '上期 是' },
                { name: '节能技术改造项目实施', unit: '是/否', hint: '年度节能技改项目落实情况', ref: '上期 是' },
                { name: '节能培训与宣传教育', unit: '是/否', hint: '年度节能培训开展情况', ref: '上期 是' },
                { name: '能源管理负责人与能源管理师配备', unit: '是/否', hint: '是否按要求配备并备案', ref: '上期 是' },
                { name: '未执行项及原因说明', unit: '文本', hint: '存在未执行项时逐项说明原因，无则填"无"', ref: '上期 无' }
              ] },
            { name: '表23~24 其他非工业报表族', ready: '填报领域为工业，整族免填', status: '不适用',
              fields: [
                { name: '本任务免填说明', unit: '—', hint: '填报领域为工业，按附件2 规范填报表1~8；表26 碳排放、表27 新能源利用、表28 节能自查三表仍适用（见上方对应章节）' }
              ] }
          ]
        },
        3: {
          // 规则引擎的生成结果（按表号挂载到模板章节上）；
          // 章节结构（有哪些表、表名、列）以模板库 sections 为唯一来源，此处只承载内容
          generated: [
            {
              name: '表2 能源消费结构',
              desc: 'GB/T 2589 当量值折标 · 规则引擎执行',
              content: {
                table: {
                  columns: ['能源品种', '实物量', '折标量（tce）'],
                  rows: [
                    ['电力（代码33）', '2,140.0 万kWh', '2,630.1'],
                    ['天然气（代码15）', '46.2 万Nm³', '614.5'],
                    ['柴油（代码21）', '38.5 t', '56.1'],
                    ['外购热力（代码32）', '5,180 百万千焦', '176.6'],
                    ['能源消费量合计（代码40）', '—', '3,477.3']
                  ]
                },
                narrative: '2026 年度能源消费量（当量值）3,477.3 吨标准煤，较上年 3,621.0 吨标准煤下降 4.0%；其中电力 2,630.1 吨标准煤（占 75.6%），为主要能源品种。电芯制造车间用电占终端能源消费约 71.2%（涂布/化成工序为主），为主要耗能环节。'
              },
              adapts: [
                { name: '电力（代码33）', from: '2,140.0 万kWh', rule: '×1.229 tce/万kWh（当量值）', to: '2,630.1 tce', formulaRef: 'FL-030', factorRef: '电力当量值折标系数 1.229 tce/万kWh' },
                { name: '天然气（代码15）', from: '46.2 万Nm³', rule: '×13.300 tce/万Nm³', to: '614.5 tce', formulaRef: 'FL-030', factorRef: '天然气折标系数 13.300 tce/万Nm³' },
                { name: '柴油（代码21）', from: '38.5 t', rule: '×1.4571 tce/t', to: '56.1 tce', formulaRef: 'FL-030', factorRef: '柴油折标系数 1.4571 tce/t' },
                { name: '外购热力（代码32）', from: '5,180 百万千焦', rule: '×0.0341 tce/百万千焦', to: '176.6 tce', formulaRef: 'FL-030', factorRef: '热力折标系数 0.0341 tce/百万千焦' },
                { name: '能源消费量合计（代码40）', from: '—', rule: '各品种折标量加总', to: '3,477.3 tce', formulaRef: 'FL-031', factorRef: '' }
              ]
            },
            {
              // 表号修正：电芯为本单位主要产品且在填报目录内 → 归 表4（工业单位产品综合能耗情况表）；
              // 原先挂「表5」会错配到「其他单位产品综合能耗情况表」（该表仅填报目录外产品）
              name: '表4 单位产品综合能耗',
              desc: '子项 ÷ 母项 · 按 GB/T 2589 折标',
              content: {
                table: {
                  columns: ['指标', '本年度', '上年度', '变化率（%）', '单位'],
                  rows: [
                    ['单位营业收入电耗', '114.7', '119.8', '-4.2%', 'kWh/万元'],
                    ['锂电池电芯单位产品综合能耗', '0.2704', '0.2811', '-3.8%', 'tce/万只'],
                    ['　其中：子项（综合能源消费量）', '3,477.3', '3,621.0', '-4.0%', 'tce'],
                    ['　其中：母项（合格产品产量）', '12,860', '12,880', '-0.2%', '万只'],
                    ['　其中：单位产品电耗', '0.2045', '0.2128', '-3.9%', 'tce/万只']
                  ]
                },
                narrative: '单位产品综合能耗 0.2704 吨标准煤/万只，同比下降 3.8%；单位产品电耗 0.2045 吨标准煤/万只。下降主要受光伏自发自用电量增长及化成工序余热回收改造投运影响。'
              },
              adapts: [
                { name: '子项：综合能源消费量', from: '3,477.3 tce', rule: '取自表2 合计', to: '3,477.3 tce', formulaRef: 'FL-031', factorRef: '' },
                { name: '母项：合格产品产量（电芯）', from: '12,860 万只', rule: '取自 MES 产量统计', to: '12,860 万只', formulaRef: '', factorRef: 'MES 产量统计（数据池）' },
                { name: '单位产品综合能耗', from: '—', rule: '子项 ÷ 母项', to: '0.2704 tce/万只', formulaRef: 'FL-032', factorRef: '' }
              ]
            },
            {
              name: '表26 碳排放情况（能源活动产生）',
              desc: '引用碳核查结果 · 口径与主管部门一致',
              content: {
                table: {
                  columns: ['排放类别', '排放量（tCO₂）', '占比'],
                  rows: [
                    ['化石燃料燃烧排放', '1,118.1', '7.6%'],
                    ['净购入电力间接排放', '13,045.4', '88.5%'],
                    ['净购入热力间接排放', '569.8', '3.9%'],
                    ['输出电/热抵减量', '0', '0.0%'],
                    ['碳排放总量', '14,733.3', '100%']
                  ]
                },
                narrative: '碳排放总量 14,733.3 吨二氧化碳，其中净购入电力间接排放 13,045.4 吨（占 88.5%），为主要排放来源；化石燃料燃烧排放 1,118.1 吨（占 7.6%）。该结果与 2026 年度碳核查报告一致，可直接引用至表26。'
              },
              adapts: [
                { name: '化石燃料燃烧排放', from: '天然气 46.2 万Nm³ + 柴油 38.5 t', rule: '×21.622 / ×3.096 tCO₂/单位', to: '1,118.1 tCO₂', formulaRef: 'FL-001', factorRef: '天然气 21.622 tCO₂/万Nm³ · 柴油 3.096 tCO₂/t' },
                { name: '净购入电力间接排放', from: '2,140.0 万kWh', rule: '×0.6096 kgCO₂/kWh', to: '13,045.4 tCO₂', formulaRef: 'FL-002', factorRef: '电网排放因子 0.6096 kgCO₂/kWh' },
                { name: '净购入热力间接排放', from: '5,180 百万千焦', rule: '×0.11 tCO₂/GJ', to: '569.8 tCO₂', formulaRef: 'FL-003', factorRef: '热力排放因子 0.11 tCO₂/GJ' },
                { name: '输出电/热抵减量', from: '无对外供能', rule: '—', to: '0 tCO₂', formulaRef: '', factorRef: '' },
                { name: '碳排放总量', from: '—', rule: '燃烧 + 净购入电 + 净购入热 − 抵减', to: '14,733.3 tCO₂', formulaRef: 'FL-018', factorRef: '' }
              ]
            }
          ],
          // 校验与异常处置（原独立阶段四已并入本阶段）
          // 校验项按 id 引用 CHECK_RULES（9 类：格式合规 4 + 数据逻辑 5），名称与判定依据从规则目录取
          checks: [
            { id: 'fmt-head', value: '13/13 项齐备', threshold: '必填项齐备', pass: true },
            { id: 'fmt-indicator', value: '11 张表齐备', threshold: '必填项齐备', pass: true },
            { id: 'fmt-unit', value: '全部一致', threshold: '与规定单位一致', pass: true },
            { id: 'fmt-precision', value: '2 项 3 位小数', threshold: '按规范位数', pass: false },
            { id: 'log-sum', value: '能源合计 差 0 tce；表26 差 0 tCO₂', threshold: '必须为 0', pass: true },
            { id: 'log-factor', value: '偏差 2.1%', threshold: '≤5%', pass: true },
            { id: 'log-yoy', value: '-4.0%', threshold: '±10% 提醒', pass: true },
            { id: 'log-cross', value: '偏差 2.8%', threshold: '≤2%', pass: false },
            { id: 'log-caliber', value: '当量值折标 · 法人边界', threshold: '符合规则集', pass: true }
          ],
          cards: [
            { id: 'ny1', title: '化成工序电量与 MES 统计偏差 2.8%', desc: '表2 电力消费中化成工序部分 612.4 万kWh，MES 化成能耗统计 595.2 万kWh，偏差 2.8%，超出 2% 一致性阈值。', suggest: '疑似化成柜待机能耗未计入 MES，建议核对计量点归属与统计口径后修正表2拆分（AI 建议）', history: [{ period: '2024年度', dev: '1.2%' }, { period: '2025年度', dev: '1.6%' }], sec: '工业能源消费结构表' }
          ]
        },
        4: {
          revisions: [
            { time: '03-12 10:20', text: '预览页修订「表2 电力消费量」：2,138.6 → 2,140.0 万kWh（核对计量点归属后覆盖，自动重跑折标勾稽通过）', by: '手改' },
            { time: '03-12 11:05', text: '异常卡片处置：化成工序电量口径核对完毕，重渲染通过', by: '人工' }
          ],
          formats: '封面黑体一号 · 正文仿宋三号 · 1.5倍行距 · 表1~8、表26~28 全表齐备 · 填报负责人/填报人/电话/填报日期落款完整',
          // 关键核算指标封存值（阶段四只读总览）：口径与表2 一致
          // （电力 2,140.0 万kWh × 1.229 = 2,630.1 tce；天然气 46.2 万m³ × 13.30 = 614.5 tce；
          //  柴油 38.5 t × 1.4571 = 56.1 tce；外购热力 5,180 百万千焦 × 0.0341 = 176.6 tce；合计 3,477.3 tce）
          metrics: [
            { key: 'power', name: '电力折标量', unit: 'tce', value: 2630.1, editable: true },
            { key: 'gas', name: '天然气折标量', unit: 'tce', value: 614.5, editable: true },
            { key: 'diesel', name: '柴油折标量', unit: 'tce', value: 56.1, editable: true },
            { key: 'heat', name: '外购热力折标量', unit: 'tce', value: 176.6, editable: true },
            { key: 'total', name: '能源合计（折标）', unit: 'tce', value: 3477.3, editable: false }
          ]
        }
      },
      newReport: { name: '', type: '碳排放报告', dim: '月', rangeYear: '', rangeMonth: '', rangeDates: [], rangeWeek: '', remark: '', deadline: '', nameTouched: false, approval: defaultApproval() },
      showHistorySidebar: false,
      currentConversationId: null,
      conversationHistory: [
        { id: 'c1', title: '2026年度碳排放报告编排', timestamp: '2026/09/01 14:20' },
        { id: 'c2', title: '合规校验规则咨询', timestamp: '2026/08/28 10:05' }
      ],
      reports: loadRsData(RS_REPORTS_KEY, [
        { id: 2, name: '2026年度能源审计报告', short: '能源审计', type: '能源审计报告', field: '工业', approval: { level: 1, chain: [{ nodeLevel: 1, roleKey: '填报人自查', by: '李明（能源管理负责人）' }] }, status: '待提报·受理', progress: 100, period: '2026年度', complianceScore: 96, auto: true, dept: '发展改革委', freq: '年', deadline: '2026-08-31', stage: 4, issues: [], templateId: 'PT-010', templateLock: { version: 'v2.1', docName: '《企业能源审计报告》模板', caliber: { standardCode: 'GB/T 17166' }, standard: '' } },
        { id: 3, name: '2026年6月合规披露文件', short: '合规披露', type: '合规披露文件', field: '工业', approval: { level: 3, chain: [{ nodeLevel: 1, roleKey: '填报人自查', by: '李明（能源管理负责人）' }, { nodeLevel: 2, roleKey: '部门负责人审核', by: '王志强（节能主管领导）' }, { nodeLevel: 3, roleKey: '碳管理师复核', by: '赵敏（碳管理师）' }] }, status: '编制中', progress: 70, period: '2026年6月', complianceScore: 88, auto: true, dept: '生态环境局', freq: '月', deadline: '2026-07-15', stage: 3, issues: ['1项勾稽异常'], templateId: 'PT-011', templateLock: { version: 'v1.5', docName: '《环境信息合规披露文件》模板', caliber: { standardCode: '企业环境信息依法披露管理办法' }, standard: '企业环境信息依法披露管理办法' } },
        { id: 5, name: '2026年度能源利用状况报告', short: '能源状况报告', type: '能源利用状况报告', field: '工业', approval: { level: 3, chain: [{ nodeLevel: 1, roleKey: '填报人自查', by: '李明（能源管理负责人）' }, { nodeLevel: 2, roleKey: '部门负责人审核', by: '王志强（节能主管领导）' }, { nodeLevel: 3, roleKey: '碳管理师复核', by: '赵敏（碳管理师）' }] }, status: '编制中', progress: 30, period: '2026年度', complianceScore: 0, auto: true, dept: '发展改革委', freq: '年', deadline: '2027-03-31', stage: 1, issues: [], taskKey: 'nybg', detailMode: 'guided', templateId: 'PT-012', templateLock: { version: 'v1.0', docName: '《用能单位能源利用状况报告》（附件2规范）', caliber: { standardCode: '附件2' }, standard: '附件2 用能单位能源利用状况报告格式' }, sceneRule: { field: '工业' } },
        { id: 6, name: '2026年度能源利用状况报告2', short: '能源状况报告2', type: '能源利用状况报告', field: '工业', detailMode: 'document', approval: { level: 3, chain: [{ nodeLevel: 1, roleKey: '填报人自查', by: '李明（能源管理负责人）' }, { nodeLevel: 2, roleKey: '部门负责人审核', by: '王志强（节能主管领导）' }, { nodeLevel: 3, roleKey: '碳管理师复核', by: '赵敏（碳管理师）' }] }, status: '编制中', progress: 30, period: '2026年度', complianceScore: 0, auto: true, dept: '发展改革委', freq: '年', deadline: '2027-03-31', stage: 1, issues: [], taskKey: 'nybg', templateId: 'PT-012', templateLock: { version: 'v1.0', docName: '《用能单位能源利用状况报告》（附件2规范）', caliber: { standardCode: '附件2' }, standard: '附件2 用能单位能源利用状况报告格式' }, sceneRule: { field: '工业' } },
        { id: 7, name: '2025年度碳排放报告', short: '年度碳报告', type: '碳排放报告', field: '工业', status: '已闭环', submitted: true, progress: 100, period: '2025年度', auto: true, dept: '生态环境局', freq: '年', deadline: '2026-01-31', stage: 4, issues: [], templateId: 'PT-009', templateLock: { version: 'v3.0', docName: '《企业碳排放核算报告》模板', caliber: { standardCode: 'GB/T 32150-2015' }, standard: '企业温室气体排放报告管理办法（主管部门报送要求）' },
          fingerprint: '3e5a7c9b1d3f5a7c9b1d3f5a7c9b1d3f5a7c9b1d3f5a7c9b1d3f5a7c9b1d3f5a', signMeta: { signer: '当前登录用户（admin01）', signedAt: '2026-01-28 15:07', approvalMode: 'DIRECT_SIGN' }, receiptNo: 'ZF-2025-0930', receiptTime: '2026-02-02 09:15', receiptAcceptedBy: '生态环境局', receiptWay: '门户上传' }
      ]),
      submissionCalendar: loadRsData(RS_CAL_KEY, [
        { id: 'cal1', dept: '生态环境局', reportType: '碳排放报告', freq: '月', window: '11月1日 ~ 11月12日', nextName: '2026年11月碳排放月报', nextPeriod: '2026年11月', nextGen: '2026-11-01', windowEnd: '2026-11-12', enabled: true },
        { id: 'cal2', dept: '生态环境局', reportType: '碳排放报告', freq: '年', window: '次年1月1日 ~ 1月31日', nextName: '2027年度碳排放报告', nextPeriod: '2027年度', nextGen: '2027-01-01', windowEnd: '2027-01-31', enabled: true },
        { id: 'cal3', dept: '发展改革委', reportType: '能源审计报告', freq: '年', window: '期次结束后1个月内', nextName: '2027年度能源审计报告', nextPeriod: '2027年度', nextGen: '2027-01-05', windowEnd: '2027-02-05', enabled: true },
        { id: 'cal4', dept: '生态环境局', reportType: '合规披露文件', freq: '月', window: '1月8日 ~ 1月23日', nextName: '2027年1月合规披露文件', nextPeriod: '2027年1月', nextGen: '2027-01-08', windowEnd: '2027-01-23', enabled: true },
        { id: 'cal5', dept: '发展改革委', reportType: '能源利用状况报告', freq: '年', window: '次年3月1日 ~ 3月31日', nextName: '2027年度能源利用状况报告', nextPeriod: '2027年度', nextGen: '2027-03-01', windowEnd: '2027-03-31', templateId: 'PT-012', route: '工业（条件组合命中）', sceneRule: { field: '工业' }, enabled: true }
      ]),
      // 日历页签部门筛选：按计划的受理主管部门过滤（纯查看工具，默认显示全部计划）
      calDeptFilter: 'all',
      // 排期规则检索：频次筛选 + 仅看启用开关（部门胶囊叠加生效）
      calFreqFilter: '',
      calEnabledOnly: false,
      // 当前登录角色（演示态常量；生产接企业权限中枢 RBAC，删除计划仅系统管理员可见）
      currentRole: '系统管理员',
      // ===== 用能单位概况：字段集按模板变体定义（随模板库 variants 的匹配结果切换） =====
      // 依据《用能单位能源利用状况报告格式》（附件2）表1（工业）/表23（其他非工业）字段
      profileFieldSets: {
        industrial: {
          label: '工业（表1 工业基本情况表）',
          groups: baseGroupsWith([{ k: 'employees', label: '从业人员', unit: '人', src: 'org' }]),
          economic: {
            key: 'economic', name: '经济与能耗指标（需本期值 / 上年值 / 同比变化率）', icon: 'el-icon-data-line',
            fields: [
              { k: 'tax', label: '上缴利税', unit: '万元' },
              { k: 'output', label: '工业总产值', unit: '万元' },
              { k: 'revenue', label: '销售收入', unit: '万元' },
              { k: 'cost', label: '生产成本', unit: '万元' },
              { k: 'energyTotal', label: '综合能源消费量（当量值）', unit: '万吨标准煤' }
            ]
          },
          sign: signGroup
        },
        transport: {
          label: '交通运输、仓储和邮政业（表9 基本情况表）',
          groups: baseGroupsWith([{ k: 'subIndustry', label: '细分行业', src: 'org' }]),
          economic: {
            key: 'economic', name: '经营与营运指标（需本期值 / 上年同期值 / 同比变化率）', icon: 'el-icon-data-line',
            fields: [
              { k: 'revenue', label: '主营业务收入', unit: '万元' },
              { k: 'managerCount2', label: '能源管理师人数', unit: '人' },
              { k: 'energyTotal', label: '能源消费量', unit: '万吨标准煤' },
              { k: 'bizCost', label: '主营业务生产成本', unit: '万元' },
              { k: 'energyCost', label: '能源消费成本', unit: '万元' },
              { k: 'energyRatio', label: '能源消费占生产成本比例', unit: '%' },
              { k: 'revenueIntensity', label: '万元主营业务收入能耗', unit: '吨标准煤/万元' },
              { k: 'truckCount', label: '营运货车数量', unit: '辆' },
              { k: 'truckTonnage', label: '营运货车净载重吨位', unit: '吨' },
              { k: 'busCount', label: '营运客车数量', unit: '辆' },
              { k: 'shipCount', label: '营运船舶数量', unit: '艘' },
              { k: 'berthCount', label: '生产用泊位个数', unit: '个' },
              { k: 'airlineCount', label: '民用航空航线条数', unit: '条' },
              { k: 'railMileage', label: '铁路营业里程', unit: '公里' },
              { k: 'postOffice', label: '邮政业营业网点', unit: '处' }
            ]
          },
          sign: signGroup
        },
        hotel: {
          label: '住宿和餐饮业（表14 基本情况表）',
          groups: baseGroups,
          economic: {
            key: 'economic', name: '经营与能耗指标（需本期值 / 上年同期值 / 同比变化率）', icon: 'el-icon-data-line',
            fields: [
              { k: 'revenue', label: '主营业务收入', unit: '万元' },
              { k: 'bizArea', label: '营业面积', unit: '平方米' },
              { k: 'managerCount2', label: '能源管理师人数', unit: '人' },
              { k: 'roomCount', label: '客房数', unit: '间' },
              { k: 'bedCount', label: '床位数', unit: '个' },
              { k: 'seatCount', label: '餐位数', unit: '个' },
              { k: 'energyTotal', label: '能源消费量', unit: '万吨标准煤' },
              { k: 'bizCost', label: '主营业务成本', unit: '万元' },
              { k: 'energyCost', label: '能源消费成本', unit: '万元' },
              { k: 'energyRatio', label: '能源消费占主营业务成本比例', unit: '%' },
              { k: 'revenueIntensity', label: '单位主营业务收入能耗', unit: '千克标准煤/万元' },
              { k: 'areaIntensity', label: '单位营业面积能耗', unit: '千克标准煤/平方米' }
            ]
          },
          sign: signGroup
        },
        retail: {
          label: '批发和零售业（表17 基本情况表）',
          groups: baseGroups,
          economic: {
            key: 'economic', name: '经营与能耗指标（需本期值 / 上年同期值 / 同比变化率）', icon: 'el-icon-data-line',
            fields: [
              { k: 'revenue', label: '主营业务收入', unit: '万元' },
              { k: 'bizArea', label: '营业面积', unit: '平方米' },
              { k: 'managerCount2', label: '能源管理师人数', unit: '人' },
              { k: 'energyTotal', label: '能源消费量', unit: '万吨标准煤' },
              { k: 'bizCost', label: '主营业务成本', unit: '万元' },
              { k: 'energyCost', label: '能源消费成本', unit: '万元' },
              { k: 'energyRatio', label: '能源消费占主营业务成本比例', unit: '%' },
              { k: 'revenueIntensity', label: '单位营业收入能耗', unit: '千克标准煤/万元' },
              { k: 'areaIntensity', label: '单位营业面积能耗', unit: '千克标准煤/平方米' }
            ]
          },
          sign: signGroup
        },
        education: {
          label: '教育业（表20 基本情况表）',
          groups: baseGroupsWith([
            { k: 'centralUniv', label: '是否中央部属院校', src: 'org' },
            { k: 'ministry', label: '所属部委名称', src: 'org' }
          ]),
          economic: {
            key: 'economic', name: '办学规模与能耗指标（需本期值 / 上年同期值 / 同比变化率）', icon: 'el-icon-data-line',
            fields: [
              { k: 'studentCount', label: '在校学生人数', unit: '人' },
              { k: 'buildArea', label: '建筑面积', unit: '平方米' },
              { k: 'managerCount2', label: '能源管理师', unit: '人' },
              { k: 'energyTotal', label: '能源消费量', unit: '万吨标准煤' },
              { k: 'energyCost', label: '能源消费成本', unit: '万元' },
              { k: 'studentIntensity', label: '单位在校学生能耗', unit: '吨标准煤/万人' },
              { k: 'buildIntensity', label: '单位建筑面积能耗', unit: '吨标准煤/万平方米' }
            ]
          },
          sign: signGroup
        },
        'non-industrial': {
          label: '其他非工业（表23 其他非工业基本情况表）',
          groups: baseGroupsWith([{ k: 'isPublic', label: '是否公共机构', src: 'org' }]),
          economic: {
            key: 'economic', name: '经营与能耗指标（需本期值 / 上年同期值 / 同比变化率）', icon: 'el-icon-data-line',
            fields: [
              { k: 'revenue', label: '主营业务收入', unit: '万元' },
              { k: 'bizArea', label: '营业面积', unit: '平方米' },
              { k: 'managerCount2', label: '能源管理师人数', unit: '人' },
              { k: 'energyTotal', label: '能源消费量', unit: '万吨标准煤' }
            ]
          },
          sign: signGroup
        }
      },
      // 用能单位概况分组展开状态（默认全部展开，点击分组头可收起）
      profileExpand: {},
      // 用能单位概况取值（按字段 key 索引；economic 组为 {cur, prev, note} 结构）
      profileValues: {
        region: '北京市·北京经济技术开发区', domain: '工业', industry: '电气机械和器材制造业',
        orgType: '有限责任公司', isPublic: '否', orgName: '京能新能源电池制造有限公司',
        legalCode: '91110108MA07P5Q678', regDate: '2018-06', regCapital: '50000',
        address: '北京市北京经济技术开发区宏达北路12号', postcode: '100176',
        districtCode: '110115', email: 'nygl@jnxny.com',
        energyOrg: '能源管理部', leaderName: '王志强', leaderPhone: '010-6789 1234',
        managerName: '李明', managerMobile: '139 0123 4567', managerCert: 'NYGLS-2019-00821',
        managerCount: '3', employees: '1286',
        certified: '是（ISO 50001）', certDate: '2022-09', certOrg: '中环联合（北京）认证中心',
        fax: '010-6789 5678', centralSoe: '否（非央企）',
        signLeader: '王志强', signFiller: '李明', signPhone: '010-6789 1234', signDate: '2026-01-20',
        tax: { cur: '8420', prev: '7860', note: '' },
        output: { cur: '186500', prev: '162300', note: '' },
        revenue: { cur: '178200', prev: '155600', note: '' },
        cost: { cur: '152400', prev: '138900', note: '' },
        bizArea: { cur: '28600', prev: '28600', note: '' },
        managerCount2: { cur: '3', prev: '3', note: '' },
        energyTotal: { cur: '0.3477', prev: '0.3621', note: '' }
      },
      // 新建报送计划弹窗（创建时确定匹配规则，之后期次自动生成）
      calDialogVisible: false,
      calForm: { reportType: '', dept: '', freq: '月', firstPeriod: '', windowStart: '', windowEnd: '', route: {}, approval: defaultApproval() },
      // 提报状态登记弹窗（登记提报 / 登记受理共用统一结构）
      submitRegDialog: { visible: false, mode: 'submission', report: null, form: { way: '在线报送（报送系统）', time: '', receipt: '' }, files: [] },
      // 存证底卷轻量抽屉（已归档 / 已提报 / 已受理任务的凭证直读入口）
      archiveDrawer: { visible: false, report: null },
      // 报送计划编辑态（非 null = 编辑模式，弹窗类型锁定）
      editingCalId: null,
      // 填报场景手动选择覆盖（仅数据异常兜底路径使用：场景解析不到时的人工指定；null = 按创建时锁定规则）
      variantOverride: null,
      // 新建临时报告弹窗（与新建报送计划同为新建类动作，统一弹窗形态）
      newReportDialog: false,
      // 临时报告场景（多场景模板创建时确认，写入任务 sceneRule，编排内仍可手动切换）
      newReportScene: '',
      // 模板库数据：与平台模板库管理页同源（agent-center/data/platformTemplates.js），页面不再维护副本
      templates: loadPlatformTemplates(),
      // 校验规则目录：与面板校验项同源（单一数据源见 CHECK_RULES，9 类：格式合规 4 + 数据逻辑 5）
      complianceRules: CHECK_RULES,
      // 异常卡片处置方式（6 种，见 CARD_ACTIONS）
      cardActions: CARD_ACTIONS,
      // 导出格式目录（与导出服务同源，界面不另写一份）
      exportFormats: EXPORT_FORMATS,
    }
  },
  // 页面加载即检查报送排期：生成日已到的计划自动派生期次任务（autoGenerateDue）
  mounted() {
    this.ensureDocModeTask()
    this.ensureApprovalForms()
    this.autoGenerateDue()
  },
  computed: {
    // 形式B：按模板 + 正文生成完整报告结构（11 张表 + 10 段正文）
    docSections() {
      const list = []
      const cn = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
      // 1) 正文部分（叙述性内容）
      Object.keys(BODY_DEMO).forEach((k, i) => {
        const idx = Number(String(k).replace('正文', '').replace('一', '1').replace('二', '2').replace('三', '3').replace('四', '4').replace('五', '5').replace('六', '6').replace('七', '7').replace('八', '8').replace('九', '9').replace('十', '10'))
        const no = Number.isFinite(idx) && idx > 0 ? idx - 1 : i
        list.push({
          key: 'body-' + i, no: '正文' + (cn[no] || (i + 1)), title: BODY_TITLES[no] || ('正文' + (i + 1)),
          type: 'text',
          items: (() => {
            const ov = this.docOverrides['body|' + k] || {}
            return [{ k: k, label: '', value: ov.value || BODY_DEMO[k], status: ov.status || 'confirmed', src: '规则引擎生成' }]
          })()
        })
      })
      // 2) 附件表（模板 sections，工业场景 11 张）
      ;(this.templateSections || []).forEach(sec => {
        const no = sec.no || this.sectionNo(sec)
        if (!no || String(no).indexOf('表') !== 0) return
        const fill = SECTION_FILL_TYPE[no] || 'manual'
        const cols = sec.columns || []
        const raw = ANNEX_DEMO_ROWS[no] || sec.rows || []
        // 演示态：仅保留 2 项待确认/待补录，其余默认已确认（避免满屏待确认）
        const DEMO_PENDING = { '表1|从业人员': 'pending', '表2|柴油': 'missing' }
        const defaultStatus = 'confirmed'
        list.push({
          key: no, no: no, title: sec.name || no, type: 'table', fillType: fill,
          fillLabel: (FILL_TYPE_TEXT[fill] && FILL_TYPE_TEXT[fill].label) || '人工填报',
          columns: cols,
          rows: raw.map((r, ri) => {
            const obj = (typeof r === 'object' && r !== null) ? r : { name: String(r) }
            const ok = no + '|' + (obj.name || ri)
            const ov = this.docOverrides[ok] || {}
            return {
              k: no + '-' + ri,
              name: obj.name || '',
              cells: Object.assign({}, obj.cells || {}, ov.cells || {}),
              status: ov.status || DEMO_PENDING[ok] || defaultStatus
            }
          })
        })
      })
      return list
    },
    // 形式B：成稿校核式（右侧直接显示结果，无阶段）
    isDocumentMode() {
      return !!(this.activeTask && this.activeTask.detailMode === 'document')
    },
    docFlatItems() {
      const list = []
      ;(this.docSections || []).forEach(sec => {
        if (sec.type === 'table') {
          (sec.rows || []).forEach(r => list.push({ sec: sec, item: r }))
        } else {
          (sec.items || []).forEach(it => list.push({ sec: sec, item: it }))
        }
      })
      return list
    },
    docStats() {
      const all = this.docFlatItems
      const st = x => x.item.status
      const confirmed = all.filter(x => st(x) === 'confirmed').length
      const pending = all.filter(x => st(x) === 'pending').length
      const missing = all.filter(x => st(x) === 'missing').length
      return {
        total: all.length, confirmed: confirmed, pending: pending, missing: missing,
        percent: all.length ? Math.round(confirmed / all.length * 100) : 0
      }
    },
    // 预览态：定稿元信息
    docPreviewMeta() {
      const t = this.activeTask || {}
      const st = this.docStats
      const tpl = t.templateLock || {}
      return {
        version: tpl.version || 'v1.0',
        docName: tpl.docName || '—',
        chapters: (this.docSections || []).length,
        tables: (this.docSections || []).filter(x => x.type === 'table').length,
        genTime: t.genTime || '—',
        fingerprint: t.fingerprint || '',
        receiptNo: t.receiptNo || '',
        receiptTime: t.receiptTime || '',
        proofTotal: 14,
        status: t.submitted ? '已归档' : (st.confirmed === st.total ? '待归档' : '编制中')
      }
    },
    // 预览态：审批链
    docAuditChain() {
      const t = this.activeTask || {}
      const chain = (t.approval && t.approval.chain) || []
      if (!chain.length) return []
      return chain.map((c, i) => ({
        idx: i + 1,
        name: c.roleKey || ('第 ' + (i + 1) + ' 级'),
        by: c.by || '—',
        done: t.submitted ? true : (i === 0 || !!this.docAuditPassed[i])
      }))
    },
    // 当前章节（下拉框展示）
    docCurrentSection() {
      const list = this.docSections || []
      const key = this.docActiveKey || (list[0] && list[0].key)
      return list.find(x => x.key === key) || list[0] || { no: '—', title: '—', type: 'text', items: [], rows: [] }
    },
    docStatusMeta() {
      return {
        confirmed: { label: '已确认', cls: 'doc-st-confirmed', icon: 'el-icon-circle-check' },
        pending: { label: '待确认', cls: 'doc-st-pending', icon: 'el-icon-warning-outline' },
        missing: { label: '待补录', cls: 'doc-st-missing', icon: 'el-icon-circle-close' }
      }
    },

    // 模态B当前激活任务
    activeTask() {
      return this.reports.find(r => r.id === this.activeTaskId) || null
    },
    // 阶段面板：能源利用状况报告走专用面板，其余走通用面板
    activePanels() {
      return (this.activeTask && this.activeTask.taskKey === 'nybg') ? this.nybgPanels : this.stagePanels
    },
    // 态势统计带：待处置=有异常项 / 待补录=有缺项或处于采集阶段 / 就绪=无任何问题
    // 本期应报概览：分类口径 = 任务下一步动作（与卡片 CTA 一一对应，互斥且覆盖）
    // 编排中（继续编排/开始提报/确认归档）· 待补录（去补录）· 待登记提报（已归档，登记提报）
    // 概览数据条：3 状态计数（本期应报 + 编制中 / 待提报·受理 / 已闭环）
    briefStats() {
      const n = k => this.dueReports.filter(r => this.taskPhase(r) === k).length
      return {
        total: this.dueReports.length,
        composing: n('composing'),
        submitting: n('submitting'),
        closed: n('closed')
      }
    },
    // 左侧预警催办行（副驾驶纯文字播报，点击整行定位任务；不再渲染任何卡片）
    alertLines() {
      return this.urgentList.slice(0, 3).map(r => {
        let text
        if (this.reportStatus(r) === 'submitting') {
          text = this.isSubmitted(r)
            ? '已登记提报，等待主管部门<b>受理回执</b>'
            : '已完成签字归档，请在主管部门平台提交后<b>登记提报回执</b>'
        } else {
          // 天数格式化硬兜底：daysLeft 恒返回数字，此处再以 isFinite 把关，
          // 非有限值（null/undefined/NaN）一律不进插值，杜绝 "/"、"--"、NaN 上屏
          const raw = r.deadline ? this.daysLeft(r.deadline) : null
          const d = Number.isFinite(raw) ? raw : null
          text = d === null ? '截止时间未设置，请先补全排期'
            : (d > 0 ? '仅剩 ' + d + ' 天截止' : '已到截止日，请立即处置')
          if (r.issues && r.issues.length) text += '，存在「' + r.issues[0] + '」待处置'
          if (d !== null) text += '，建议优先处置'
        }
        return { r, text, level: this.urgency(r) }
      })
    },
    // 紧急待办列表：按紧急度排序取前 3 项（卡片定位是概览+最紧迫提醒，全量清单在右栏，避免重复）
    urgentList() {
      const order = { red: 0, yellow: 1, green: 2 }
      return this.dueReports.slice()
        .sort((a, b) => order[this.urgency(a)] - order[this.urgency(b)] || this.daysLeft(a.deadline) - this.daysLeft(b.deadline))
        .slice(0, 3)
    },
    // 过滤 Tab 计数：与报告状态同源（all + 3 相位）
    statusCounts() {
      const n = k => this.reports.filter(r => this.taskPhase(r) === k).length
      return { all: this.reports.length, composing: n('composing'), submitting: n('submitting'), closed: n('closed') }
    },
    // 阶段二采集完成率
    // 应报项：排除"不适用"（本场景免填的表不计入采集进度，避免分母虚高、进度失真）
    collectRequired() {
      return this.stageItems.filter(x => x.status !== '不适用')
    },
    // 本场景免填项：仅作说明，不进入主列表与进度统计
    collectNa() {
      return this.stageItems.filter(x => x.status === '不适用')
    },
    collectRate() {
      const items = this.collectRequired
      if (!items.length) return 0
      return Math.round((items.length - items.filter(x => x.status === '缺项').length) / items.length * 100)
    },
    // 阶段二缺项清单（右侧汇总提示与左侧引导共用）
    collectMissing() {
      return (this.stageItems || []).filter(x => x.status === '缺项')
    },
    // 清零守卫：缺项未清零或存在阻断质量问题时物理禁用流转按钮
    gateBlocked() {
      return this.collectRate < 100 || this.collectFieldStats.blocking > 0
    },
    // 硬规则校验摘要（阶段三·生成与校验：校验区与动作栏共用；校验在确认生成结果时自动执行）
    // 校验项按 id 关联 CHECK_RULES 取名称 / 分组 / 判定依据，并按分组汇总（格式合规 / 数据逻辑）
    // blocking = 未处置的异常卡片数（阻断产出）；已转人工核实的异常不再阻断本环节
    checkSummary() {
      const panel = this.activePanels[3] || {}
      const raw = panel.checks || []
      const checks = raw.map(c => {
        const rule = CHECK_RULES.find(r => r.id === c.id) || {}
        return {
          id: c.id,
          name: rule.name || c.name || '—',
          category: rule.category || '其他',
          severity: rule.severity || '必须',
          blocking: rule.blocking !== undefined ? rule.blocking : true,
          standard: rule.standard || '',
          desc: rule.desc || '',
          value: c.value,
          threshold: c.threshold,
          pass: c.pass
        }
      })
      const fails = checks.filter(c => !c.pass)
      const cards = panel.cards || []
      // 异常卡片三态：待处置（pending）→ 已转人工待确认说明（awaiting）→ 已人工确认（resolved，盖戳记）
      const pending = cards.filter(c => !c.escalated && !c.resolved)
      const awaiting = cards.filter(c => c.escalated && !c.resolved)
      const confirmed = cards.filter(c => c.resolved)
      const escalated = cards.filter(c => c.escalated)
      // 按分组统计（供校验区三级进度展示）
      const groups = []
      checks.forEach(c => {
        let g = groups.find(x => x.category === c.category)
        if (!g) { g = { category: c.category, total: 0, pass: 0, items: [] }; groups.push(g) }
        g.total++
        if (c.pass) g.pass++
        g.items.push(c)
      })
      let summaryText = checks.slice(0, 3).map(c => c.name + ' ' + c.value).join(' · ')
      if (pending.length) summaryText = pending.map(c => c.title).join('；')
      else if (awaiting.length) summaryText = '待人工确认说明：' + awaiting.map(c => c.title).join('；')
      else if (confirmed.length) summaryText = '已人工确认：' + confirmed.map(c => c.title).join('；')
      // 豁免说明计数：阶段二人工留痕放行的字段（随报告存档，不计入闸门，但需在校验横幅可见）
      const waivedCount = ((this.activePanels[2] || {}).rawItems || []).reduce((n, it) => n + ((it.fields || []).filter(f => f.waived).length), 0)
      return {
        checks,
        groups,
        total: checks.length,
        pass: checks.length - fails.length,
        fail: fails.length,
        // 放行闸门 = 待处置 + 已转人工但未确认说明（"已转人工"不等于"已处置"，必须显式确认后才放行）
        blocking: pending.length + awaiting.length,
        pendingCount: pending.length,
        awaitingCount: awaiting.length,
        confirmedCount: confirmed.length,
        escalatedCount: escalated.length,
        hasAnomaly: fails.length > 0,
        waivedCount,
        summaryText
      }
    },
    // 底部放行守卫：存在待处置项或"已转人工但未填写偏差说明"的项时，禁止一键放行
    releaseGuarded() {
      return this.checkSummary.blocking > 0
    },
    // 异常项快捷锚点：把校验区待处置 / 待人工核验的异常转成可点击定位的锚点
    verifyAnchors() {
      return ((this.activePanels[3] || {}).cards || []).map(c => ({
        title: c.title,
        sec: c.sec || '',
        cls: c.escalated ? 'is-escal' : 'is-block'
      }))
    },
    // 换算因子溯源表（key = 指标名）：复用排放因子匹配服务，按「智慧报告」场景路由取因子。
    // 价值：换算过程不仅可看"用了什么规则"，还能看到"系数取自哪个因子库、置信度多少"——
    //      匹配链路为 企业记忆(P0) → 可维护规则表 → 兜底规则，与碳核算各智能体同一套引擎。
    adaptFactorMap() {
      const map = {}
      const chapters = (this.activePanels[3] || {}).chapters || []
      chapters.forEach(ch => {
        (ch.adapts || []).forEach(row => {
          if (map[row.name]) return
          try {
            const hit = matchFactor({ name: row.name, unit: '', value: 0 }, 'report-submission')
            const s = hit.selected || {}
            map[row.name] = {
              factorId: s.factorId || '',
              factorName: s.factorName || '',
              factorValue: s.factorValue || '',
              factorUnit: s.factorUnit || '',
              sourcePool: s.sourcePool || '',
              confidence: s.confidence || hit.confidence || '',
              memoryHit: !!hit.memoryHit,
              scenario: hit.scenario || ''
            }
          } catch (e) { /* 匹配失败不阻断换算依据展示 */ }
        })
      })
      return map
    },
    // 口径换算依据抽屉：rows 由入口解析后写入（正文数值点击 → 命中项所属表；章节入口 → 本章换算项）
    adaptDrawerRows() {
      return this.adaptDrawer.rows || []
    },
    adaptDrawerRow() {
      return this.adaptDrawerRows[this.adaptDrawer.idx] || null
    },
    // 全报告换算项池：换算项实际挂在附件报表上，正文叙述引用其适配值时需回穿到来源表，
    // 故按"适配值 + 来源表"建池供正文数值锚点匹配（附源表名，便于抽屉标注依据出处）
    adaptPool() {
      const pool = []
      this.stageChapters.forEach(ch => {
        (ch.adapts || []).forEach(r => pool.push({ row: r, src: ch.name }))
      })
      return pool
    },
    // 数据溯源链（清单 #13 归档回溯 / #16 溯源引擎）：按本任务真实数据血缘生成，共 4 级。
    //  - L1 报表级：当前任务 + 锁定模板
    //  - L2 口径适配级：阶段三各章节的换算依据（含公式引用与因子匹配结果）
    //  - L3 模块数据池级：阶段二的数据来源通道（只读引用，不二次造数）
    //  - L4 原始采集级：阶段二采集项已填字段的真实值
    // 已移除原「L3 标准化级」：该层无独立数据源（口径统一语义并入 L2），且原实现为固定演示值。
    // 已取消「取不到数据回退演示节点」：归档阶段的证据不得由演示值兜底——取不到就如实标注「本层无记录」。
    traceTree() {
      const t = this.activeTask || {}
      const tpl = this.templateInfo || {}
      const panel2 = this.activePanels[2] || {}
      const chapters = this.stageChapters || []

      // L2：口径适配级 —— 取自阶段三换算依据（含公式库引用与因子匹配结果）。
      // 取数源必须用 stageChapters（阶段三合并视图：正文 + 附件）：换算项实际挂在生成结果上，
      // panel3.chapters 只对通用任务存在——读错集合会让本层对真实任务永远为空。
      const adapts = []
      chapters.forEach(ch => {
        ;(ch.adapts || []).forEach(a => {
          if (adapts.length >= 4) return
          const ft = this.adaptFactorMap[a.name] || {}
          adapts.push({
            label: a.name,
            value: a.to,
            rule: a.rule
              + (a.formulaRef ? '（公式 ' + a.formulaRef + '）' : '')
              + (ft.factorId ? '（因子 ' + ft.factorId + ' · ' + (ft.sourcePool || '因子库') + '）' : ''),
            time: '阶段三 · 规则引擎执行',
            by: '规则引擎'
          })
        })
      })

      // L3：模块数据池级 —— 优先取阶段二声明的数据来源通道（pools）；
      // 未声明时按采集项的来源通道（ready 字段，如"数据底座 · 电力/天然气/柴油"）归并，
      // 如实反映"只读引用各模块成品指标、不二次造数"的来源，避免本层无谓留空。
      let pools = (panel2.pools || []).map(p => ({
        label: p.ch,
        value: p.items || '—',
        rule: '只读引用 · ' + (p.ready || '—'),
        time: '任务创建时锁定',
        by: '数据池接口'
      }))
      if (!pools.length) {
        const byChannel = {}
        ;(panel2.rawItems || []).forEach(it => {
          const chName = String(it.ready || '').split('·')[0].trim()
          if (!chName) return
          if (!byChannel[chName]) byChannel[chName] = []
          byChannel[chName].push(it.name)
        })
        pools = Object.keys(byChannel).map(chName => ({
          label: chName,
          value: byChannel[chName].slice(0, 3).join('、') + (byChannel[chName].length > 3 ? ' 等 ' + byChannel[chName].length + ' 张表' : ''),
          rule: '只读引用 · 不二次造数',
          time: '任务创建时锁定',
          by: '数据池接口'
        }))
      }

      // L4：原始采集级 —— 复用「单元格穿透核查」的原始数据源解析器（buildPenetrationData）：
      // 与点击穿透查看的原始数据同源，不另造一份；按定稿表中可穿透的数值单元格回推原始采集记录。
      // （阶段二采集项在演示数据中只存字段元信息、无值，直接取字段值会让本层永远为空。）
      const raws = []
      const seenDevice = {}
      chapters.forEach(ch => {
        if (raws.length >= 5) return
        const tb = ch.content && ch.content.table
        if (!tb) return
        ;(tb.rows || []).forEach(row => {
          if (raws.length >= 5) return
          ;(tb.columns || []).forEach((col, ci) => {
            if (raws.length >= 5) return
            if (!this.isPenetratable(row, col, ci)) return
            const val = this.sectionRowValue(row, col, ci)
            if (!String(val || '').trim()) return
            const itemName = (row && row.name) || (Array.isArray(row) ? row[0] : String(row || '')) || '核算项目'
            const d = this.buildPenetrationData(itemName, col, val, ch.name)
            const device = d.rawSource.device
            if (seenDevice[device]) return
            seenDevice[device] = true
            raws.push({
              label: device,
              value: d.rawSource.rawValue,
              rule: d.rawSource.sourceSystem + ' · 凭证 ' + d.rawSource.rawReceiptNo,
              time: d.rawSource.timestamp,
              by: this.rawRoleOf(device)
            })
          })
        })
      })

      return [
        {
          level: 'L1', name: '报表级', desc: '报表名称 / 部门 / 期次 / 总量',
          nodes: [{
            label: t.name || '智慧报告',
            value: t.period || '—',
            rule: '报送模板 ' + (tpl.name || '—') + '（' + (tpl.version || '—') + '，创建时锁定）',
            time: t.deadline ? ('截止 ' + t.deadline) : '—',
            by: '任务排期生成'
          }]
        },
        { level: 'L2', name: '口径适配级', desc: '原始值 → 换算规则 → 报送口径值', nodes: adapts.length ? adapts : [this.traceEmptyNode('本任务数据由人工直接填报，无口径换算过程')] },
        { level: 'L3', name: '模块数据池级', desc: '只读引用各模块成品指标（不二次造数）', nodes: pools.length ? pools : [this.traceEmptyNode('本任务未接入模块数据池，数据由人工填报')] },
        { level: 'L4', name: '原始采集级', desc: '数据源 / 原始值 / 采集系统 / 采集时间', nodes: raws.length ? raws : [this.traceEmptyNode('本任务定稿表未标记可穿透的原始数据源')] }
      ]
    },
    // 报送材料清单（阶段四报送包 / 清单弹窗 / 存证底卷共用同一份数据源）：
    //  = 材料库（原始凭证 + 资质与制度）+ 动态项（报告交付物 + 签发与回执）
    bundleMaterials() {
      const t = this.activeTask || {}
      const tpl = this.templateInfo || {}
      const lib = materialsOf(t)
      const deliver = [
        {
          group: '报告交付物',
          name: (t.name || '报告') + ' · 定稿正文与附表',
          type: 'DOCX / PDF',
          source: '规则引擎渲染 · 模板 ' + (tpl.name || '—') + '（' + (tpl.version || '—') + '）',
          time: this.signRecord ? this.signRecord.signedAt : '待签字归档',
          size: '—',
          required: true,
          status: 'ready',
          hash: '—',
          note: '正文 ' + (this.stageBodyChapters || []).length + ' 章 + 附表 ' + (this.stageAnnexCount || 0) + ' 张，导出即带元信息水印'
        },
        {
          group: '报告交付物',
          name: '标准报送数据表（CSV / XML / JSON）',
          type: 'CSV / XML / JSON',
          source: '统一导出服务 · 按锁定口径生成',
          time: '随时可导出',
          size: '—',
          required: false,
          status: 'ready',
          hash: '—',
          note: '供政府在线填报系统或 API 直报接口使用'
        }
      ]
      const sign = this.signRecord
      const signedCount = this.signedMaterialsOf(deliver.concat(lib)).length
      const tail = [
        {
          group: '签发与回执',
          name: '内容指纹存证单',
          type: '存证记录',
          source: '签发引擎 · 内容指纹（FNV-1a 双通道）',
          time: sign ? sign.signedAt : '签字归档后生成',
          size: '—',
          required: true,
          status: sign ? 'ready' : 'missing',
          hash: sign ? sign.fingerprint : '',
          note: sign
            ? ('覆盖报告 + 佐证材料 ' + signedCount + ' 项；材料补录后须重新校验完整性')
            : '签字归档时固化，覆盖报告与全部佐证材料'
        },
        {
          group: '签发与回执',
          name: '提报回执 / 受理凭单',
          type: '回执扫描件',
          source: '主管部门报送平台 · 登记提报后录入',
          time: t.receiptTime || '待提报',
          size: '—',
          required: false,
          status: t.receiptNo ? 'ready' : 'pending',
          hash: '',
          note: t.receiptNo ? ('回执号 ' + t.receiptNo) : '完成提报并登记回执后回传，不影响归档'
        }
      ]
      return deliver.concat(lib, tail)
    },
    // 指纹与打包共用的材料快照：排除「签发与回执」组（其中含指纹本身，纳入会形成自指），
    // 且字段收敛为稳定集合——同一份材料多次序列化必须一致，否则指纹比对无意义。
    signedMaterials() {
      return this.signedMaterialsOf(this.bundleMaterials)
    },
    // 材料分组（清单弹窗按组呈现，组序即清单顺序）
    materialGroups() {
      const groups = []
      this.bundleMaterials.forEach(m => {
        let g = groups.find(x => x.name === m.group)
        if (!g) { g = { name: m.group, items: [] }; groups.push(g) }
        g.items.push(m)
      })
      return groups
    },
    // 报送包构成摘要（报送包行与清单弹窗顶部共用同一份计数口径）
    bundleSummary() {
      const list = this.bundleMaterials
      return {
        total: list.length,
        ready: list.filter(m => m.status === 'ready').length,
        missing: list.filter(m => m.status === 'missing').length,
        pending: list.filter(m => m.status === 'pending').length,
        annex: this.stageAnnexCount || 0
      }
    },
    // 校验区异常卡片（带空值守卫：activePanels[3] 或 cards 缺失时返回空数组，避免模板取值抛错）
    verifyCards() {
      return ((this.activePanels[3] || {}).cards) || []
    },
    // 校验状态总览（客观计数，替代原加权评分）：待处置 = 未通过的校验规则数；按必须/建议拆分
    verifyPendingCount() {
      return (this.checkSummary.checks || []).filter(c => !c.pass).length
    },
    verifyBlockingCount() {
      return (this.checkSummary.checks || []).filter(c => !c.pass && c.blocking).length
    },
    // 明细过滤：全部 / 待处置 / 指定分组（分组内保留通过项，便于对照阈值）
    verifyGroups() {
      const groups = this.checkSummary.groups || []
      if (this.verifyFilter === 'all') return groups
      if (this.verifyFilter === 'pending') {
        return groups
          .map(g => Object.assign({}, g, { items: g.items.filter(i => !i.pass) }))
          .filter(g => g.items.length)
      }
      return groups.filter(g => g.category === this.verifyFilter)
    },
    // 阶段三校验区是否展开（默认：有阻断异常时自动展开，无异常时收起为摘要条）
    verifyOpen() {
      if (this.verifyExpanded !== null) return this.verifyExpanded
      return this.checkSummary.blocking > 0
    },
    // ===== 预览修订后重校（勾稽类强制重跑；同比类不因修订失效，豁免） =====
    previewRules() {
      const isNybg = this.activeTask && this.activeTask.taskKey === 'nybg'
      if (isNybg) {
        return [{ name: '能源合计 = 分品种折标加总', lhs: 'total', parts: ['power', 'gas', 'diesel', 'heat'], tolerance: 0 }]
      }
      return [{ name: '报告总量 = 范围1 + 范围2', lhs: 'total', parts: ['s1', 's2'], tolerance: 0 }]
    },
    // 修订后重校结果（每次修订自动重算）
    previewCheck() {
      const metrics = (this.activePanels[4] || {}).metrics || []
      if (!metrics.length) return { hasMetrics: false, items: [], pass: true, passCount: 0, total: 0 }
      const map = {}
      metrics.forEach(m => { map[m.key] = Number(m.value) || 0 })
      const r1 = v => Math.round(v * 10) / 10
      const items = this.previewRules.map(r => {
        const sum = r1(r.parts.reduce((a, k) => a + (map[k] || 0), 0))
        const diff = r1((map[r.lhs] || 0) - sum)
        return { name: r.name, lhs: r1(map[r.lhs] || 0), sum, diff, pass: Math.abs(diff) <= r.tolerance }
      })
      return {
        hasMetrics: true,
        items,
        pass: items.every(i => i.pass),
        passCount: items.filter(i => i.pass).length,
        total: items.length
      }
    },
    // 签字放行条件：定稿勾稽校验必须全部成立——报告数据保持一致是硬约束，
    // 不设"例外放行"（不平衡即阻断，出路只有退回前置环节重新补录 / 重算）
    archiveAllowed() {
      return this.previewCheck.pass
    },
    // 多级审核汇总（清单 #11）：逐级状态 + 是否全部通过
    auditSummary() {
      // 审核人优先取实际审核记录；未审核时显示创建任务时锁定的审核人（approval.chain）
      const chain = this.approvalChainOf.chain
      // 审核节点按任务配置的审批层级裁剪（0 级 = 无审核节点，走直接签发分支）
      const levels = AUDIT_LEVELS.slice(0, chain.length).map((l, idx) => {
        const st = this.auditFlow[l.key] || {}
        return Object.assign({}, l, {
          status: st.status || 'pending',
          by: st.by || ((chain[idx] && chain[idx].by) || ''),
          time: st.time || '',
          comment: st.comment || '',
          passed: st.status === 'passed',
          rejected: st.status === 'rejected'
        })
      })
      const passedCount = levels.filter(l => l.passed).length
      return {
        levels,
        passedCount,
        total: levels.length,
        allPassed: passedCount === levels.length,
        hasRejected: levels.some(l => l.rejected)
      }
    },
    // 审批配置（任务级）：创建任务时确定审核节点与审核人员，编排内只读执行
    approvalChainOf() {
      return normalizeApproval(this.activeTask && this.activeTask.approval)
    },
    // 审批模式：DIRECT_SIGN（无需审批，直接签发）/ MULTI_LEVEL_APPROVAL（按层级逐级审核）
    approvalMode() {
      return this.approvalChainOf.mode
    },
    // 审批层级选项（0 无需审批 / 1~3 级）
    approvalModeOptions() {
      return APPROVAL_MODE_OPTIONS
    },
    // 企业人员清单（审核人下拉选项）：取自组织资源库带出的用能单位概况人员；
    // 支持 allow-create 自行录入新人员（生产环境对接企业通讯录 / 组织架构）
    personnelOptions() {
      const v = this.profileValues || {}
      const list = [
        { name: v.managerName, role: '能源管理负责人' },
        { name: v.leaderName, role: '节能主管领导' },
        { name: v.signFiller, role: '填报人' },
        { name: '赵敏', role: '碳管理师' }
      ]
      const seen = {}
      return list
        .filter(x => x.name && !seen[x.name] && (seen[x.name] = true))
        .map(x => ({ value: x.name + '（' + x.role + '）', label: x.name + '（' + x.role + '）' }))
    },
    // 审批层级文案（阶段四只读展示）
    approvalLevelLabel() {
      const o = APPROVAL_MODE_OPTIONS.find(x => x.level === this.approvalChainOf.level)
      const label = (o && o.label) || '无需审批'
      return this.approvalChainOf.level ? (label + '（' + this.approvalChainOf.chain.length + ' 节点链）') : '无需审批（直接签发）'
    },
    // 签字归档综合闸门（V5.1 审批模式解耦）：
    // DIRECT_SIGN 单人闭环基线 = 定稿勾稽校验全部成立（无例外放行）；
    // MULTI_LEVEL_APPROVAL 多级协同插件 = 基线 + 三级审核全部通过
    archiveGate() {
      if (this.approvalMode === 'DIRECT_SIGN') return this.archiveAllowed
      return this.archiveAllowed && this.auditSummary.allPassed
    },
    // ApprovalNode 审批链（V5.1 数据模型向后兼容：DIRECT_SIGN 仅 1 节点直接完结；MULTI_LEVEL 展开 3 节点）
    approvalChainNodes() {
      const now = new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      if (this.approvalMode === 'DIRECT_SIGN') {
        const signer = (this.approvalChainOf.chain[0] && this.approvalChainOf.chain[0].by) || '当前登录用户（admin01）'
        return [{
          nodeLevel: 1,
          roleKey: 'SUBMITTER',
          status: this.signRecord ? 'APPROVED' : 'PENDING',
          operatorId: 'admin01',
          operatorName: signer,
          signTimestamp: this.signRecord ? this.signRecord.signedAt : '',
          signatureDigest: this.signRecord ? this.signRecord.fingerprint : '',
          comments: '无需审批，直接签发归档'
        }]
      }
      const roleMap = { self: 'SUBMITTER', dept: 'REVIEWER', expert: 'LEGAL_REPRESENTATIVE' }
      return this.auditSummary.levels.map((l, i) => ({
        nodeLevel: i + 1,
        roleKey: roleMap[l.key] || 'REVIEWER',
        status: l.passed ? 'APPROVED' : (l.rejected ? 'REJECTED' : 'PENDING'),
        operatorId: 'admin01',
        operatorName: l.by || '',
        signTimestamp: l.time || '',
        signatureDigest: '',
        comments: l.comment || ''
      }))
    },
    // 导入目标章节的字段清单（缺项章节才有字段明细，作为字段映射的目标字段集）
    importTargetFields() {
      const ch = (this.stageItems || []).find(x => this.sectionNo(x) === this.importSectionNo)
      return (ch && ch.fields) || []
    },
    // 导入映射质量汇总（导入前的就绪度提示）
    importSummary() {
      return mappingSummary(this.importMapping)
    },
    // 导入数据预览（前 5 行，按已映射字段展示）
    importPreview() {
      return applyMapping((this.importRows || []).slice(0, 5), this.importMapping)
    },
    // 阶段二章节数据项明细（仅含有字段清单的应报章节；免填章节不进入明细）
    chapterItems() {
      return this.collectRequired.filter(x => x.fields && x.fields.length)
    },
    // 问题工作台视图（V5.1 附录 A-1/A-2）：missing=待办问题（缺项 + 质量预警 + 刚补齐保留），exempt=已豁免清单
    visibleChapters() {
      if (this.chapterFilter === 'exempt') return this.collectNa
      if (this.chapterFilter !== 'missing') return this.chapterItems
      const miss = this.chapterItems.filter(x => x.status === '缺项')
      const warn = this.chapterItems.filter(x => x.status !== '缺项' && x.status !== '不适用' && this.chapterQuality(x) !== 'PASS')
      const done = this.justCompleted
        .map(no => this.chapterItems.find(x => this.sectionNo(x) === no))
        .filter(x => x && x.status !== '缺项')
      const seen = {}
      return miss.concat(warn, done).filter(x => (seen[this.sectionNo(x)] ? false : (seen[this.sectionNo(x)] = true)))
    },
    // 缺项章节数（过滤页签计数）
    missingChapterCount() {
      return this.chapterItems.filter(x => x.status === '缺项').length
    },
    // 质量预警章节数（已采集但存在 WARNING/BLOCKED 问题，V5.1 附录 A-1）
    warningChapterCount() {
      return this.chapterItems.filter(x => x.status !== '缺项' && x.status !== '不适用' && this.chapterQuality(x) !== 'PASS').length
    },
    // 字段级统计（数据总项 / 已确定 / 待处理 / 阻断）：替代百分比进度条，口径与待办问题一致。
    // 待处理 = 缺项字段 + BLOCKING/WARNING 质量问题（INFO 级仅提示不计数）；豁免项不进入统计
    collectFieldStats() {
      let total = 0, confirmed = 0, pending = 0, blocking = 0
      this.chapterItems.forEach(ch => {
        const miss = ch.status === '缺项'
        ;(ch.fields || []).forEach(f => {
          total++
          if (miss && !String(f.value || '').trim()) pending++
          else confirmed++
        })
        this.issuesOf(ch).forEach(iss => {
          if (iss.type === 'MISSING_DATA' || iss.severity === 'INFO') return
          pending++
          if (iss.severity === 'BLOCKING') blocking++
        })
      })
      return { total, confirmed, pending, blocking }
    },
    // ===== 模板概览与预览（内容全部由模板库 templates 提供，页面不硬编码任何模板内容） =====
    // 当前任务锁定的模板（任务创建时绑定 templateId；未绑定的旧任务按模板库 reportType 精确兜底匹配）
    activeTemplate() {
      const t = this.activeTask
      if (!t) return null
      // 在途任务按锁定的 templateId 直接取（不受后续审核状态影响）；
      // 未绑定 templateId 的旧任务仅在「已发布」模板中按 reportType 兜底匹配
      if (t.templateId) return this.templates.find(x => x.id === t.templateId) || null
      return this.templates.filter(x => x.type === '报告模板' && x.status === '已发布').find(x => x.reportType === t.type) || null
    },
    // 模板概览展示信息：以任务创建时锁定的快照为准（在途任务不受模板库改版影响）
    templateInfo() {
      const cur = this.activeTemplate
      const lock = (this.activeTask && this.activeTask.templateLock) || null
      if (!cur && !lock) return null
      return {
        docName: (lock && lock.docName) || (cur && cur.docName) || '—',
        version: (lock && lock.version) || (cur && cur.version) || '—',
        updateTime: (cur && cur.updateTime) || '',
        caliber: (lock && lock.caliber) || (cur && cur.caliber) || null,
        standard: (lock && lock.standard) || (cur && cur.standard) || '—'
      }
    },
    // ===== 阶段一 Scope 摘要（PRD V5.2 3.2）：全部由模板库 variants 与采集元数据驱动，前端不硬编码表名与数量 =====
    // 正文章节数与名称（正文为叙述性章节，来自 variants.body，与阶段三正文同源）
    scopeBodyCount() {
      const v = this.activeVariant
      const body = (v && v.body) || (this.activeTemplate && this.activeTemplate.body) || []
      return body.length
    },
    scopeBodyNames() {
      const v = this.activeVariant
      const body = (v && v.body) || (this.activeTemplate && this.activeTemplate.body) || []
      return body.map(b => b.name)
    },
    // 主干标识行：单位名称 / 单位代码 / 管理属性（档案字段集与简版概况两条数据路径统一取值）
    scopeIdentity() {
      const p1 = this.activePanels[1] || {}
      const pv = this.profileValues || {}
      return [
        { label: '单位名称', value: (this.profileSet && pv.orgName) || p1.orgName || '—' },
        { label: this.profileSet ? '法人单位代码' : '统一社会信用代码', value: (this.profileSet && pv.legalCode) || p1.creditCode || '—' },
        { label: '管理属性', value: p1.energyLevel || '—' }
      ]
    },
    // 模板版本漂移：模板库当前版本 ≠ 任务锁定版本时提示（在途任务仍按锁定版本执行）
    templateDrift() {
      const cur = this.activeTemplate
      const lock = this.activeTask && this.activeTask.templateLock
      if (!cur || !lock || !lock.version || !cur.version) return null
      if (lock.version === cur.version) return null
      return { locked: lock.version, current: cur.version, updateTime: cur.updateTime || '' }
    },
    // 公式库数据（读同一份数据源：编制依据引用的公式在此解析，规则必须可执行、可追溯）
    // 说明：公式库暂无独立服务层，此处直读其存储 key；后续抽服务时替换此实现即可。
    formulaRef() {
      try {
        const saved = localStorage.getItem('cfp_formula_library')
        const list = saved ? JSON.parse(saved) : []
        // 幂等合并兜底：其他模块覆盖公式库缓存时，内置公式按 id 自动补回（读取层合并，不写回）
        const byId = new Set(list.map(f => f.id))
        const missing = DEFAULT_FORMULAS.filter(f => !byId.has(f.id))
        return missing.length ? list.concat(missing.map(f => JSON.parse(JSON.stringify(f)))) : list
      } catch (e) { return DEFAULT_FORMULAS.map(f => JSON.parse(JSON.stringify(f))) }
    },
    // 政策标准库数据：统一走标准库服务（含 ensureSeed，避免缓存未初始化时依据核验静默失效）
    standardsRef() {
      ensureSeed()
      const list = loadStandards()
      // 读取层兜底合并（只读、不写回）：种子条目被标准库管理页整体覆盖 / 缓存丢失时按 code 补回，
      // 保证依据现行性核验与编制依据解析不因「库里缺种子」而误报（与本文件公式库兜底同范式）
      const codes = new Set(list.map(s => s.code))
      const missing = (REPORT_SEEDS || []).filter(s => !codes.has(s.code))
      return missing.length ? list.concat(missing.map(s => JSON.parse(JSON.stringify(s)))) : list
    },
    // 编制依据：解析引用声明 → 关联政策标准库规则集（四类参数 + 执行映射）与公式库
    // caliber 结构：{ name, standardCode（→ 标准库规则集）, formulaStandard（→ 公式库 appliedStandard）, factorVersion（→ 因子库版本锁定） }
    // 规则本体存于标准库、模板只持引用：同一规则集可被多模板复用，政策升版时一处生效。
    caliberInfo() {
      // 先确保标准库种子入库（幂等）：修复首次访问时 caliberInfo 先于 ensureSeed 求值、
      // 查询落空后 computed 缓存导致永远显示「不适用场景」的时序问题
      ensureSeed()
      const raw = this.templateInfo && this.templateInfo.caliber
      if (!raw) return null
      // 快照兼容：早期任务快照的 caliber 为字符串（仅名称），引用键（standardCode 等）从当前模板的编制依据声明补全
      const tplCal = (this.activeTemplate && this.activeTemplate.caliber) || null
      const c = typeof raw === 'string'
        ? Object.assign({ name: raw }, tplCal && typeof tplCal === 'object' ? tplCal : {})
        : raw
      const std = c.formulaStandard || ''
      const formulas = std ? this.formulaRef.filter(f => f.appliedStandard === std && f.status === '启用') : []
      // 规则集本体：按 standardCode 从政策标准库取该场景配置段（params 四类参数 + mappings 执行规则）
      const code = c.standardCode || ''
      let cfg = code
        ? queryStandardConfig(code, 'REPORT')
        : { available: false, reason: '模板未声明编制依据（standardCode）' }
      // 兜底：标准库缓存被其他页面覆盖 / 种子未入库时，从服务层源常量解析——
      // 保证演示案例的依据内容恒可用（REPORT_SEEDS 与标准库种子同源，不受缓存状态影响）
      if (!cfg.available && code) {
        const seed = REPORT_SEEDS.find(s => s.code === code && s.structured && s.structured.scenarioKind === 'REPORT')
        if (seed) {
          cfg = {
            available: true, code: seed.code, name: seed.name, version: seed.version,
            params: seed.structured.params || [],
            clauses: seed.structured.dimensions || [],
            mappings: seed.structured.mappings || []
          }
        }
      }
      // 格式要求：与核算口径同源（标准库 sign 维度：封面字体 / 行距 / 落款）——按分组归类进解析结果
      let stdRec = (this.standardsRef || []).find(s => s.code === code)
      if (!stdRec) stdRec = REPORT_SEEDS.find(s => s.code === code) // 源常量兜底
      const signDim = stdRec && stdRec.structured && (stdRec.structured.dimensions || []).find(d => d.key === 'sign')
      const formatReqs = (signDim && signDim.points) || []
      // 分组化返回：与弹窗五个分组一一对应（声明 / 规则参数 / 格式要求 / 引用公式；多口径 targets 独立按部门解析）
      // 顶层保留 name/standardCode 等兼容字段，分组字段供界面与下游按归类取用
      // 引用声明精简为 standardCode 单键（依据名称由标准库解析；公式/因子属平台内部配置，不作依据展示）
      const declaration = { name: cfg.name || code || c.name || '—', standardCode: code }
      return Object.assign({}, declaration, {
        declaration,           // 分组① 依据声明
        ruleAvailable: !!cfg.available,
        ruleReason: cfg.reason || '',
        ruleParams: cfg.params || [],   // 分组② 编制规则参数
        ruleMappings: cfg.mappings || [],
        ruleClauses: cfg.clauses || [],
        formatReqs,            // 分组③ 成文格式要求
        formulas,              // 公式库关联（界面不再展示，供下游校验）
      })
    },
    // 依据标准时效校验：模板引用的标准是否仍在标准库中且为现行
    standardStatus() {
      const info = this.templateInfo
      if (!info || !info.standard || info.standard === '—') return null
      const list = this.standardsRef
      if (!list.length) return null
      // 优先按模板引用的依据编号命中（caliber.standardCode，与「编制依据卡片」同源解析）；
      // 命中不到再退回「名称文本双向包含」匹配——避免依据本体已在库中、仅名称写法不同而误报
      const refCode = info.caliber && info.caliber.standardCode
      const hit = (refCode && list.find(s => s.code === refCode))
        || list.find(s => info.standard.includes(s.code) || s.name.includes(info.standard))
      if (!hit) return { state: 'missing', text: '未在政策标准库中检索到该依据' }
      if (hit.status !== '现行') return { state: 'obsolete', text: '依据标准「' + hit.code + '」当前状态：' + hit.status }
      return { state: 'ok', text: hit.code + ' · ' + hit.status + (hit.version ? ' · ' + hit.version : '') }
    },
    // 政策更新预警：标准库中存在更高生效版本时提示（在途任务仍按创建时锁定版本执行）
    policyUpdateWarning() {
      const info = this.templateInfo
      if (!info || !info.standard) return null
      const warnings = getUpdateWarnings() || []
      return warnings.find(w => info.standard.includes(w.code)) || null
    },
    // 当前任务对应的填报场景：规则全部来自模板库（variants[].conditions）
    // 取值优先级：手动选择（variantOverride）> 报送计划固定规则（sceneRule）；
    // 不做企业档案自动路由——无法确定匹配时返回 null，界面显示「请选择」由用户手动指定
    activeVariant() {
      const t = this.activeTemplate
      if (!t || !t.variants || !t.variants.length) return null
      if (this.variantOverride && t.variants.some(v => v.key === this.variantOverride)) {
        return t.variants.find(v => v.key === this.variantOverride)
      }
      const rule = (this.activeTask && this.activeTask.sceneRule) || {}
      const dims = (t.matchFields || []).map(f => f.key)
      const hit = t.variants.find(v => {
        const c = v.conditions || {}
        const keys = Object.keys(c).filter(k => !dims.length || dims.includes(k))
        return keys.length && keys.every(k => rule[k] && rule[k] !== 'auto' && String(rule[k]) === String(c[k]))
      })
      return hit || null
    },
    // 模板预览弹窗的章节目录（模板库驱动；无章节明细的模板以适用范围标签降级呈现）
    templateSections() {
      const v = this.activeVariant
      if (v && v.sections && v.sections.length) return v.sections
      const t = this.activeTemplate
      if (t && t.sections && t.sections.length) return t.sections
      // 模板未定义章节结构时给出明确提示（不拿"适用范围"充当目录）
      return [{ name: '该模板暂未定义章节结构', purpose: '请在平台模板库中补充该模板的章节结构（sections）', source: '', columns: [], rows: [], note: '模板内容由模板库统一维护' }]
    },
    // 阶段二采集清单：表清单同样以模板 sections 为骨架（与阶段一模板预览、阶段三生成结果同一份来源），
    // 字段明细按表号挂载；模板未覆盖的项（如免填说明）追加在末尾，避免丢失。
    stageItems() {
      const v = this.activeVariant
      const tpl = this.activeTemplate
      const sections = (v && v.sections && v.sections.length) ? v.sections : ((tpl && tpl.sections) || [])
      const items = (this.activePanels[2] && this.activePanels[2].rawItems) || []
      if (!sections.length) return items
      const used = []
      const list = sections.map(sec => {
        const no = this.sectionNo(sec)
        // 注意传对象而非 it.name：sectionNo 内部读 x.no || x.name，传字符串会取到空值导致永不匹配；
        // 空表号不参与匹配（''==='' 会错挂），无表号章节的采集项统一追加在清单末尾
        const idx = no !== '' ? items.findIndex((it, i) => used.indexOf(i) === -1 && this.sectionNo(it) === no) : -1
        if (idx !== -1) {
          used.push(idx)
          // 带上模板的结构标记（如 self=主体类章节，其字段已在阶段一核对），表名以模板为准
          return { ...sec, ...items[idx], no: sec.no, name: sec.name }
        }
        const rows = sec.rows || []
        return {
          no: sec.no,
          name: sec.name,
          self: sec.self,
          ready: sec.source || '规则引擎 · 数据池',
          status: '已采集',
          totalFields: rows.length,
          fields: rows.slice(0, 6).map(r => ({ name: typeof r === 'string' ? r : ((r && r.name) || ''), unit: '—', hint: sec.purpose || '' }))
        }
      })
      items.forEach((it, i) => { if (used.indexOf(i) === -1) list.push(it) })
      return list
    },
    // 阶段三面板只列「报告正文」：正文是 AI 改写的作用对象，需逐章核对与采纳；
    // 附件报表是纯数据表，逐张列出会与阶段一模板预览、整篇预览三处重复
    stageBodyChapters() {
      return this.stageChapters.filter(c => c.kind === 'body')
    },
    stageAnnexCount() {
      return this.stageChapters.filter(c => c.kind === 'annex').length
    },
    // 画布章节：正文取「人工就地修订 > AI 改写已接受 > 系统生成」的当前生效文本
    // （与定稿视图同源，避免两处文本不一致；正文章节索引与 aiNarratives / aiPolish 的键一致）
    canvasChapters() {
      return this.stageBodyChapters.map((ch, i) => {
        const manual = this.manualEdits[i]
        const applied = manual ? manual.text : this.aiNarratives[i]
        if (applied === undefined) return ch
        return { ...ch, content: { ...ch.content, narrative: applied } }
      })
    },
    // 画布锁定态（Q3 裁决）：进入提报环节（待提报·受理 / 已闭环）/ 已签字哈希锁定 / 多级审核全部通过待签 → 正文只读
    canvasLocked() {
      const t = this.activeTask
      if (!t) return true
      if (this.reportStatus(t) !== 'composing') return true
      if (this.signRecord) return true
      if (this.approvalMode === 'MULTI_LEVEL_APPROVAL' && this.auditSummary.allPassed) return true
      return false
    },
    // 附表清单（左栏目录用）：纯数据表，只读查阅
    stageAnnexChapters() {
      return this.stageChapters.filter(c => c.kind === 'annex')
    },
    // 阶段四：文件渲染格式说明（报表清单与张数由模板驱动，避免与模板脱钩）
    stageFormats() {
      const v = this.activeVariant
      const b = this.stageBodyChapters.length
      const n = this.stageAnnexCount
      return '封面黑体一号 · 正文仿宋三号 · 1.5 倍行距 · ' + (v ? v.suite : '') +
        ' · 报告正文 ' + b + ' 部分 + 附件报表 ' + n + ' 张齐备 · 填报负责人 / 填报人 / 电话 / 填报日期落款完整'
    },
    // 注：定稿勾稽校验不再生成展示数据（面板不展示算式）。
    // 勾稽判定仍由 previewCheck / previewRules 承担，闸门（archiveGate → archiveAllowed）依赖它，
    // 面板仅在未通过时由底栏给出原因与处置指引。
    // 阶段四：格式校验结论胶囊（三段式可读呈现，细节进 hover tooltip；
    // 原实现把整串说明连排成一行灰字，读起来像未排版的日志）
    formatCapsules() {
      const v = this.activeVariant
      const b = this.stageBodyChapters.length
      const n = this.stageAnnexCount
      return [
        { label: '公文版式合规', tip: '封面黑体一号 · 正文仿宋三号 · 1.5 倍行距' },
        { label: '正文 ' + b + ' 部分 + 附表 ' + n + ' 张齐备', tip: v ? v.suite : '报表清单与张数由锁定模板驱动' },
        { label: '法定落款与签章位完整', tip: '填报负责人 / 填报人 / 电话 / 填报日期落款完整；封二盖章位与签字位齐备' }
      ]
    },
    // 阶段三章节：以模板库定义的章节结构为骨架（有哪些表 / 表名 / 列，唯一来源是模板），
    // 再按表号挂载规则引擎的生成结果（表体数据 + 叙述 + 换算依据）。
    // 未挂载到生成结果的章节，按模板结构生成骨架（表头取自模板，数值列留空待换算）。
    stageChapters() {
      const v = this.activeVariant
      const tpl = this.activeTemplate
      const body = (v && v.body) || []
      const sections = (v && v.sections && v.sections.length) ? v.sections : ((tpl && tpl.sections) || [])
      const generated = (this.activePanels[3] && this.activePanels[3].generated) || []
      if (!sections.length && !body.length) return generated
      // 报告正文（叙述）：有文字内容，是 AI 改写的作用对象
      // 注：章节不再携带 desc（原"规则引擎按数据生成 · 可 AI 改写"是作业视图话术，
      // 定稿通读为对外公文只读形态，来源说明统一走附表来源标签条与数据溯源链）
      const bodyChapters = body.map(b => ({
        no: b.no,
        name: b.name,
        kind: 'body',
        fillType: b.fillType,
        content: { table: null, narrative: this.regenNarratives[b.no] || BODY_DEMO[b.no] || (b.purpose || '') },
        adapts: []
      }))
      // 附件报表（纯数据）：不做文字润色，数据来源按表号判定。
      // 注意：空表号（无「表N」前缀的章节）不参与匹配，否则 ''==='' 会让所有章节
      // 错误命中同一条生成结果（表现为多张附件套用同一份内容）。
      const annexChapters = sections.map(sec => {
        const hit = generated.find(g => {
          const gNo = this.sectionNo(g)
          return gNo && gNo === this.sectionNo(sec)
        })
        if (hit) {
          // 视图对象统一不携带 desc（口径描述等元数据仍保留在生成结果数据里，供溯源 / 导出使用；
          // 定稿通读的来源说明只走附表来源标签条与数据溯源链，避免第三份展示文案）
          const merged = { ...sec, ...hit, no: sec.no, name: sec.name, kind: 'annex' }
          delete merged.desc
          return merged
        }
        const cols = sec.columns || []
        return {
          no: sec.no,
          name: sec.name,
          kind: 'annex',
          // 注：不再携带 desc（模板 source 原文含"可直接编辑 / 对应下方…"等界面话术，不宜进公文视图）
          content: {
            table: cols.length
              ? {
                columns: cols,
                // 模板预置行是对象形态（{ name, cells: { 列名: 值 } }）：必须逐列解析取值，
                // 否则整行对象会被序列化后塞进首列（表现为「"name":"上缴利税","cells":[...]」这类脏数据）；
                // 数值列再由用能单位概况（阶段一填报值）与演示数据回填，定稿通读不留空占位；
                // 行数不再截断（定稿报告须完整成表），个别表的示例条目由 ANNEX_DEMO_ROWS 提供
                rows: (ANNEX_DEMO_ROWS[sec.no] || sec.rows || []).map(r => this.annexRowValues(r, cols, sec))
              }
              : null,
            narrative: ''
          },
          adapts: []
        }
      })
      // 正文在前、附件在后（与报告装订顺序一致）
      return bodyChapters.concat(annexChapters)
    },
    // 整篇报告预览：按定稿版式拼装「封面 + 各章正文 + 落款」。
    // 章节数据与阶段三「报告内容预览」同源（stageChapters），不另维护副本；
    // 封面主体与落款取自用能单位概况（企业档案带出）。
    reportPreview() {
      const t = this.activeTask
      const p = this.profileValues || {}
      const raw = this.stageChapters
      if (!t || !raw.length) return null
      const d = p.signDate || ''
      // 已接受的 AI 改写按章节索引覆盖正文（生成新对象，不污染模板源数据）
      const chapters = raw.map((ch, ci) => {
        const applied = this.aiNarratives[ci]
        if (applied === undefined) return ch
        return { ...ch, content: { ...ch.content, narrative: applied } }
      })
      return {
        org: p.orgName || '（单位名称）',
        title: (t.period || '') + (t.type || ''),
        coverDate: d ? d.replace(/^(\d{4})-(\d{2}).*$/, '$1 年 $2 月') : '',
        chapters: chapters,
        sign: {
          leader: p.signLeader || '—',
          filler: p.signFiller || '—',
          phone: p.signPhone || '—',
          date: d || '—'
        }
      }
    },
    // 整篇预览：待审 AI 改动数（含生成中），供改动导航器展示与按钮禁用态
    // 风格选项与当前风格标签（文体 · 受众）
    polishToneOptions() { return POLISH_TONES },
    // 受理部门不由用户选：取当前任务的受理机关（报送计划里的主管部门 / 临时报告的本级）
    polishAudienceLabel() {
      return (this.activeTask && this.activeTask.dept) || '本级'
    },
    polishStyleLabel() {
      const tn = POLISH_TONES.find(o => o.value === this.polishTone) || POLISH_TONES[0]
      return tn.label
    },
    aiPolishCount() {
      return Object.keys(this.aiPolish).length
    },

    // 阶段一字段来源标注（std=后台标准·锁定 / org=企业档案·可修改 / auto=系统判定）
    srcMap() {
      return this.activePanels[1].src || {}
    },
    // ===== 用能单位概况（方案A：三组字段 + 本期/上年/同比；方案B：按填报领域切换字段集） =====
    // 当前字段集：非能源利用状况报告的任务沿用原简版（无 profileFieldSets 时返回 null）
    profileSet() {
      if (!this.activeTask || this.activeTask.taskKey !== 'nybg') return null
      // 概况字段集随模板填报场景切换（附件2 六类表格各自的基本情况表）；场景由模板库 conditions 匹配得出
      const v = this.activeVariant
      const sets = this.profileFieldSets
      return (v && sets[v.key]) || sets['non-industrial'] || null
    },
    // 字段组：注入取值、来源、完成状态
    profileGroups() {
      const set = this.profileSet
      if (!set) return []
      return set.groups.map(grp => {
        const fields = grp.fields.map(f => {
          const v = this.profileValues[f.k]
          const filled = !!(v !== undefined && v !== null && String(v).trim() !== '')
          return { ...f, value: v, filled }
        })
        return { ...grp, fields, filled: fields.filter(f => f.filled).length }
      })
    },
    // 模板结构预览章节：报告正文在前 + 附件报表在后——与 stageChapters 顺序一致，
    // 使预览完整反映报告全部构成（此前仅含附件报表，正文 10 部分缺失）
    previewSections() {
      const v = this.activeVariant
      const body = ((v && v.body) || []).map(b => Object.assign({}, b, { body: true }))
      return body.concat(this.templateSections)
    },
    // 模板结构预览：概况表（self 章节）所含的基本信息分组（概况分组 + 经济指标 + 签署信息），
    // 随填报场景自动切换字段集——预览与「用能单位概况」同源，不另维护字段清单
    previewProfileSections() {
      const set = this.profileSet
      if (!set) return []
      return [
        ...this.profileGroups.map(g => ({ key: g.key, name: g.name, fields: g.fields })),
        { key: 'economic', name: '经济与能耗指标', fields: set.economic.fields },
        { key: 'sign', name: '签署信息', fields: set.sign.fields }
      ]
    },
    // 经济与能耗指标（含同比变化率自动计算）
    profileEconomic() {
      const set = this.profileSet
      if (!set) return { fields: [], filled: 0 }
      const fields = set.economic.fields.map(f => {
        const v = this.profileValues[f.k] || {}
        const cur = parseFloat(v.cur), prev = parseFloat(v.prev)
        let yoy = '—', yoyCls = ''
        if (!isNaN(cur) && !isNaN(prev) && prev !== 0) {
          const rate = (cur - prev) / prev * 100
          yoy = (rate >= 0 ? '↑ ' : '↓ ') + Math.abs(rate).toFixed(1) + '%'
          yoyCls = rate >= 0 ? 'up' : 'down'
        }
        const filled = !!(v.cur !== undefined && String(v.cur).trim() !== '')
        return { ...f, cur: v.cur, prev: v.prev, note: v.note, yoy, yoyCls, filled }
      })
      return { ...set.economic, fields, filled: fields.filter(f => f.filled).length }
    },
    // 签署信息组（置于概况区末尾）
    profileSign() {
      const set = this.profileSet
      if (!set || !set.sign) return { fields: [], filled: 0, name: '签署信息', icon: 'el-icon-edit-outline' }
      const fields = set.sign.fields.map(f => {
        const v = this.profileValues[f.k]
        return { ...f, value: v, filled: !!(v !== undefined && v !== null && String(v).trim() !== '') }
      })
      return { ...set.sign, fields, filled: fields.filter(f => f.filled).length }
    },
    // 表1 必填项覆盖统计（已带出 / 待补录）
    profileCoverage() {
      const set = this.profileSet
      if (!set) return null
      const baseFields = set.groups.reduce((arr, g) => arr.concat(g.fields), [])
      const econFields = set.economic.fields
      const signFields = (set.sign && set.sign.fields) || []
      const total = baseFields.length + econFields.length + signFields.length
      const filled = this.profileGroups.reduce((n, g) => n + g.filled, 0)
        + this.profileEconomic.filled + this.profileSign.filled
      return { total, filled, missing: total - filled, label: set.label }
    },
    // 日历部门选项（按规则去重）
    calendarDepts() {
      const seen = []
      this.submissionCalendar.forEach(c => { if (!seen.includes(c.dept)) seen.push(c.dept) })
      return seen
    },
    // 日历按部门过滤
    filteredCalendar() {
      return this.submissionCalendar.filter(c =>
        (this.calDeptFilter === 'all' || c.dept === this.calDeptFilter) &&
        (!this.calFreqFilter || c.freq === this.calFreqFilter) &&
        (!this.calEnabledOnly || c.enabled)
      )
    },
    // 排期规则可选频次（取自计划数据去重）
    calFreqOptions() {
      return [...new Set(this.submissionCalendar.map(c => c.freq).filter(Boolean))]
    },
    // 排期解读（排期规则页签左侧联动块）：启用规则数 / 覆盖部门数 / 最近触发窗口
    calBrief() {
      const enabled = this.submissionCalendar.filter(c => c.enabled)
      const upcoming = enabled.slice().sort((a, b) => this.daysUntil(a.nextGen) - this.daysUntil(b.nextGen))[0]
      return {
        enabledCount: enabled.length,
        deptCount: [...new Set(enabled.map(c => c.dept))].length,
        nextName: upcoming ? upcoming.nextName : '',
        nextDept: upcoming ? upcoming.dept : '',
        nextFreq: upcoming ? upcoming.freq : '',
        nextDays: upcoming ? this.daysUntil(upcoming.nextGen) : 0
      }
    },
    // 新建报送计划可选报告类型（仅取模板库中「已发布」的报告模板，未过审/停用的不可选用）
    calTypeOptions() {
      // 选项取自模板的 reportType 字段，且仅限智慧报告场景（scope 过滤）：
      // 产品碳足迹 / 园区自评 / 北京报送等其他场景的报告模板不进入本智能体的类型选择
      return [...new Set(this.templates.filter(t => t.type === '报告模板' && t.status === '已发布' && t.reportType && t.scope === '智慧报告').map(t => t.reportType))]
    },
    // 报送计划的类型选项：仅列支持周期报送的类型（periods 明确为空的非周期类型排除；未声明视为不限）
    calTypeOptionsForPlan() {
      return this.calTypeOptions.filter(name => {
        const tpl = this.templates.find(x => x.reportType === name)
        if (!tpl || !tpl.periods) return true
        return tpl.periods.length > 0
      })
    },
    // 报送频次选项：由所选类型的模板 periods 驱动（未声明时给常规四项）
    calFreqOptions() {
      const tpl = this.templates.find(x => x.reportType === this.calForm.reportType)
      const allowed = ['周', '月', '年']   // 时间维度统一口径（自定义仅用于临时报告）
      const declared = ((tpl && tpl.periods) || []).filter(f => allowed.indexOf(f) > -1)
      return declared.length ? declared : allowed
    },
    // 按报告类型解析模板（日历 → 模板库关联；解析不到时提示先补模板，避免创建出无模板依据的计划）
    calTemplate() {
      if (!this.calForm.reportType) return null
      return this.templates.find(t => t.type === '报告模板' && t.reportType === this.calForm.reportType) || null
    },
    // 提报窗口预览：直接回显所填区间（所见即所得，消除"天数"歧义）
    calWindowPreview() {
      const f = this.calForm
      if (!f.windowStart || !f.windowEnd) return ''
      const md = d => (d.getMonth() + 1) + '月' + d.getDate() + '日'
      return md(new Date(f.windowStart + 'T00:00:00')) + ' ~ ' + md(new Date(f.windowEnd + 'T00:00:00'))
    },
    // 提报窗口天数（含首尾，供预览显示）
    calWindowDays() {
      const f = this.calForm
      if (!f.windowStart || !f.windowEnd) return 0
      const diff = (new Date(f.windowEnd + 'T00:00:00') - new Date(f.windowStart + 'T00:00:00')) / 86400000
      return diff >= 0 ? diff + 1 : 0
    },
    // 场景适配所用模板：与上方「关联模板」同源（均按 reportType 字段解析），
    // 避免按模板名推导导致的「关联模板已解析到、场景适配却为空」的不一致。
    calMatchTpl() {
      return this.calTemplate
    },
    // 本期应报：日历自动生成且未提报的期次任务
    dueReports() {
      return this.reports.filter(r => r.auto && !this.isClosed(r.status))
    },
    // 其他任务：已提报的历史期次 + 手动创建的临时报告
    otherReports() {
      return this.reports.filter(r => !r.auto || this.isClosed(r.status))
    },
    filteredDueReports() {
      return this.dueReports
        .filter(r => this.matchFilter(r) && this.matchSearch(r) && this.matchDept(r))
        .sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999')) // 截止日最近在最上（组内局部排序，不做全局混排）
    },
    filteredOtherReports() {
      // 历史期次保持倒序溯源习惯：所属期次倒序 → 截止日倒序（同样不做全局混排）
      return this.otherReports
        .filter(r => this.matchFilter(r) && this.matchSearch(r) && this.matchDept(r))
        .sort((a, b) => (b.period || '').localeCompare(a.period || '') || (b.deadline || '').localeCompare(a.deadline || ''))
    },
    // 主管部门轻量筛选选项（取自任务数据 dept 字段，去重）
    deptOptions() {
      return [...new Set(this.reports.map(r => r.dept).filter(Boolean))]
    },
    // 存证底卷结构化条目：全部由任务对象真实存证元信息派生（指纹 / 回执 / 档案编号），不硬编码演示数据
    archiveDossier() {
      const r = this.archiveDrawer.report
      if (!r) return []
      const base = [
        { type: '交付成果', name: r.name + ' · 归档定稿', note: 'PDF / Word / Excel 五格式导出，统一嵌入元信息防伪水印', action: 'download' },
        { type: '存证', name: '内容指纹存证单', note: r.fingerprint ? '内容指纹 ' + r.fingerprint.slice(0, 16) + '…（哈希锁定防篡改，覆盖报告 + 佐证材料 ' + materialsOf(r).length + ' 项）' + ((r.signMeta && r.signMeta.signedAt) ? ' · 签署于 ' + r.signMeta.signedAt : '') : '历史期次未留痕指纹（生产迁移时补录）', action: '' },
        { type: '凭单', name: '提报回执 / 受理凭单', note: r.receiptNo ? (r.receiptNo + (r.receiptTime ? ' · 登记于 ' + r.receiptTime : '') + ' · ' + (r.receiptAcceptedBy || r.dept)) : '尚未登记提报回执', action: r.receiptNo ? 'preview' : '' },
        { type: '档案', name: '报告与档案中心条目', note: r.reportNo ? '档案编号 ' + r.reportNo + '（已归集至企业报告资产库）' : '—', action: r.reportNo ? 'jump' : '' }
      ]
      // 佐证材料与阶段四共用同一份数据源（不维护第二份清单）：归档后按同一口径查验齐备性
      const mats = materialsOf(r).map(m => ({
        type: '佐证材料 · ' + m.group,
        name: m.name,
        note: [m.source, m.time, m.size, this.materialStatusMeta(m.status).label].filter(Boolean).join(' · '),
        action: ''
      }))
      return base.concat(mats)
    },
    showHistoryInChat() {
      return false // 预留：历史报告在对话中展示的开关（当前右栏承载列表）
    },
    // 历史对话折叠：裁切点 = 当前阶段引导消息的下标（其之前的内容视为历史，默认折叠）
    wbHistoryCut() {
      for (let i = this.wbMessages.length - 1; i >= 0; i--) {
        if (this.wbMessages[i].stage === this.activeStage) return i
      }
      return 0
    },
    wbVisibleMessages() {
      return this.wbShowAllHistory ? this.wbMessages : this.wbMessages.slice(this.wbHistoryCut)
    },
    // 工作台对话 token 估算
    wbTokens() {
      let total = 0
      this.wbMessages.forEach(m => { total += Math.ceil((m.text || '').length * 1.5) })
      return total
    },
    wbFormattedTokens() {
      const t = this.wbTokens
      if (t >= 10000) return (t / 10000).toFixed(1) + '万 tokens'
      if (t >= 1000) return (t / 1000).toFixed(1) + 'k tokens'
      return t + ' tokens'
    },
    // 提报状态登记弹窗标题
    submitRegTitle() {
      return (this.submitRegDialog.mode === 'submission' ? '登记提报 — ' : '登记受理 — ') + (this.submitRegDialog.report ? this.submitRegDialog.report.name : '')
    },
    // 临时报告所选类型对应的智慧报告模板（含 variants 时创建弹窗需确认填报场景）
    newReportTpl() {
      return this.templates.find(x => x.reportType === this.newReport.type && x.scope === '智慧报告') || null
    },
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
  watch: {
    // 主数据持久化：任何变更（创建 / 状态推进 / 编辑 / 删除）自动写回本地
    reports: { deep: true, handler(v) { saveRsData(RS_REPORTS_KEY, v) } },
    submissionCalendar: { deep: true, handler(v) { saveRsData(RS_CAL_KEY, v) } },
    // 缺项消番模式：进入阶段二 / 切到缺项视图时，缺项章节自动展开（把输入框推到用户眼前）
    chapterFilter(v) { if (v === 'missing') this.openMissingChapters(); else this.justCompleted = [] },
    activeStage(v) { if (v === 2) this.openMissingChapters(); else this.justCompleted = []; this.wbShowAllHistory = false },
    // 质量守卫阻断数变化：新增阻断时由小易在对话流中同步叙事（解释发生了什么、处置入口在哪），与右侧处置条分工
    'collectFieldStats.blocking'(n, o) {
      const prev = o || 0
      if (n > prev) {
        const hit = this.firstBlocking()
        if (hit) {
          this.wbMessages.push({
            role: 'agent',
            text: '<b>【质量守卫 · 阻断】</b>「' + hit.ch.name + '」检出' + this.issueTypeLabel(hit.issue.type) + '问题：' + hit.issue.description
              + ' ——该问题将<b>阻断进入生成与校验</b>。可在章节卡内「展开复合处置」三步闭环（差异归因 → 规则确认 → 消除违背），或直接修正数值；处置清零后我立即放行。'
          })
          this.$nextTick(() => { if (this.$refs.wbMsgs) this.$refs.wbMsgs.scrollTo({ top: this.$refs.wbMsgs.scrollHeight, behavior: 'smooth' }) })
        }
      }
    }
  },
  methods: {
    // 章节行值解析（模板预置对象行 / 数组行 / 行名字符串统一取值）——
    // 以 methods 形式暴露给模板使用（整篇预览与阶段三内容表格的表体渲染）
    sectionRowValue,
    // 附件报表行取值：模板预置行按列解析（对象 / 数组 / 字符串三种形态统一取值）+ 数值列回填。
    // 表1 等基本情况表的「本期值 / 上年值 / 同比变化率」属企业档案带出项，取自阶段一「用能单位概况」填报值，
    // 定稿版式通读须与档案一致，不能留「—」空占位。
    annexRowValues(row, cols, sec) {
      const base = sectionRowArray(row, cols)
      const rowName = String(base[0] || '').trim()
      // 演示取值（表号 + 指标名称定位）：模板行未预置的数据列由此补齐
      const demo = ((sec && ANNEX_DEMO_CELLS[sec.no]) || {})[rowName] || {}
      const eco = ((this.profileEconomic && this.profileEconomic.fields) || []).find(f => f.label === rowName)
      const plain = (this.profileGroups || []).reduce((arr, g) => arr.concat(g.fields), []).find(f => f.label === rowName)
      const num = v => { const n = parseFloat(String(v === undefined || v === null ? '' : v).replace(/,/g, '')); return isNaN(n) ? null : n }
      return cols.map((c, i) => {
        const v = base[i]
        if (v !== '' && v !== undefined && v !== null) return v
        const key = String(c || '').trim()
        if (demo[key] !== undefined) return demo[key]
        const isCur = /本期值|本期$/.test(key)
        const isPrev = /上年值|上期值|上年同期|上年$/.test(key)
        if (eco) {
          if (isCur) return eco.cur || '—'
          if (isPrev) return eco.prev || '—'
          if (/同比/.test(key)) {
            const cur = num(eco.cur), prev = num(eco.prev)
            if (cur === null || prev === null || prev === 0) return '—'
            const rate = (cur - prev) / prev * 100
            return (rate >= 0 ? '+' : '') + rate.toFixed(1) + '%'
          }
          if (/说明/.test(key)) return eco.note || '—'
        }
        // 普通档案字段（如从业人员 / 能源管理师人数）只有单值：仅回填本期值，
        // 不复制到上年值列（避免造出并不存在的上年数据）
        if (plain && isCur) return plain.value || '—'
        return '—'
      })
    },
    // 新手引导
    startOnboarding() {
      this.onboardingStep = 0
      this.showOnboarding = true
    },
    finishOnboarding() {
      this.showOnboarding = false
    },
    toggleHistorySidebar() { this.showHistorySidebar = !this.showHistorySidebar },
    // 新建对话：脱离当前会话，回到欢迎态
    newConversation() {
      this.currentConversationId = null
      this.messages = []
      this.$message.success('已开启新对话')
    },
    loadConversation(id) {
      this.currentConversationId = id
      const conv = this.conversationHistory.find(c => c.id === id)
      if (conv) this.$message.info('已载入对话「' + conv.title + '」')
    },
    deleteConversation(id) {
      this.conversationHistory = this.conversationHistory.filter(c => c.id !== id)
      if (this.currentConversationId === id) this.currentConversationId = null
    },
    ensureConversation(firstText) {
      if (!this.currentConversationId) {
        const conv = { id: 'c' + Date.now(), title: firstText.slice(0, 12) || '新对话', timestamp: new Date().toLocaleString('zh-CN') }
        this.conversationHistory.unshift(conv)
        this.currentConversationId = conv.id
      }
    },
    // 搜索匹配：名称 / 类型 / 主管部门 / 期次
    matchSearch(r) {
      const k = this.searchReport
      return !k || r.name.includes(k) || r.type.includes(k) || (r.dept || '').includes(k) || (r.period || '').includes(k)
    },
    // 状态标签配色：与报告状态表同源，不再按状态字符串逐一 if
    getStatusType(s) {
      const st = this.reportStatus({ status: s })
      return (REPORT_STATUS[st] || REPORT_STATUS.composing).tag
    },
    // 提报截止倒计时（天）：基于当前系统日期计算，不硬编码演示基准日
    // 距截止天数：恒返回数字（缺失/非法日期一律按 0 处理），杜绝 '--' / NaN / undefined 泄漏进任何插值文案
    daysLeft(deadline) {
      const t = deadline ? new Date(deadline).getTime() : NaN
      if (isNaN(t)) return 0
      return Math.max(0, Math.ceil((t - new Date().setHours(0, 0, 0, 0)) / 86400000))
    },
    // 紧急度判定（URGENCY_CONFIG 常量驱动）：红=有校验异常或 ≤7 天临期 / 黄=有缺项或 8~14 天 / 绿=就绪
    urgency(report) {
      // 已进入提报环节（待提报·受理 / 已闭环）的任务不再催办编制截止（提报由人工登记推进）
      if (this.reportStatus(report) !== 'composing') return 'green'
      // 未设截止日（如临时报告）不参与临期判定：daysLeft 对缺失日期兜底返回 0，
      // 若直接比较会让这类任务恒判"紧急临期"（红档）
      const valid = !!report.deadline && !isNaN(new Date(report.deadline).getTime())
      const d = valid ? this.daysLeft(report.deadline) : Infinity
      if ((report.issues || []).some(i => i.includes('异常')) || d <= URGENCY_CONFIG.CRITICAL.maxDays) return 'red'
      if ((report.issues || []).length || d <= URGENCY_CONFIG.WARNING.maxDays) return 'yellow'
      return 'green'
    },
    // 档位主色取值（进度条 / Border 联动统一出自 URGENCY_CONFIG，杜绝第 4 种颜色）
    urgencyColor(report) {
      return { red: URGENCY_CONFIG.CRITICAL.color, yellow: URGENCY_CONFIG.WARNING.color, green: URGENCY_CONFIG.NORMAL.color }[this.urgency(report)]
    },
    // ===== 报告状态（唯一口径）=====
    // 3 个状态（编制中 / 待提报·受理 / 已闭环）；兼容历史数据的 7 种旧值。
    // 状态只回答"报告在哪个环节"——阶段与异常不进卡片状态行（紧急度由左侧色条与左栏催办行表达）。
    reportStatus(r) {
      const s = String((r && r.status) || '')
      if (s === '已闭环' || s === '已受理') return 'closed'
      if (s === '待提报·受理' || s === '已归档' || s === '已提报') return 'submitting'
      return 'composing' // 编制中 / 编排中 / 校验中 / 待数据采集 / 待核对概况
    },
    reportStatusMeta(r) {
      return REPORT_STATUS[this.reportStatus(r)] || REPORT_STATUS.composing
    },
    // 提报子态（仅"待提报·受理"内有意义）：未登记=待提报，已登记=已提报待受理
    isSubmitted(r) {
      return !!(r && (r.submitted === true || r.status === '已提报'))
    },
    // 卡片副行：只给编制阶段（不报"几项待处理"——待处理项在阶段面板内按项呈现，
    // 列表与工作台头部不做指导性计数）
    reportStageHint(r) {
      if (this.reportStatus(r) !== 'composing') return ''
      const st = Math.min(Math.max(parseInt(r && r.stage, 10) || 1, 1), 4)
      return STAGE_LABELS[st] || ''
    },
    // 任务相位（Tab / 概览 / 数据条同一口径）：直接取报告状态的相位，不再做字符串反推
    taskPhase(r) {
      return this.reportStatusMeta(r).phase
    },
    // 右栏状态筛选匹配：直接对接任务相位（all 兜底放行）
    matchFilter(r) {
      if (this.filterTag === 'all') return true
      return this.taskPhase(r) === this.filterTag
    },
    // 主管部门筛选匹配（轻量下拉，取自 dept 字段）
    matchDept(r) {
      return !this.filterDept || r.dept === this.filterDept
    },
    // 距日历下期窗口开启天数：基于当前系统日期计算
    daysUntil(dateStr) {
      const diff = Math.ceil((new Date(dateStr) - new Date().setHours(0, 0, 0, 0)) / 86400000)
      return diff > 0 ? diff : 0
    },
    // 报告类型 → 默认报送要素（主管部门/频次/提报窗口天数），贴合各部门报送制度；未命中类型不预填
    calPrefill(reportType) {
      // ① 模板优先：关联模板已配置 prefill 时直接采用（随模板加载，零代码接入）
      const tpl = this.calTemplate
      if (tpl && tpl.prefill && tpl.prefill.dept) {
        return { dept: tpl.prefill.dept, freq: tpl.prefill.freq, days: tpl.prefill.windowDays || 15, from: 'template' }
      }
      // ② 大模型智能预填：根据报告类型语义推断报送要素（原型以规则模拟 LLM 推理，接入真实大模型后由 AI 生成）
      const t = reportType || ''
      if (t.indexOf('碳排放') >= 0 || t.indexOf('碳核算') >= 0) return { dept: '生态环境局', freq: '年', days: 31, from: 'ai' }
      if (t.indexOf('能源审计') >= 0) return { dept: '发展改革委', freq: '年', days: 30, from: 'ai' }
      if (t.indexOf('能源利用') >= 0) return { dept: '发展改革委', freq: '年', days: 31, from: 'ai' }
      if (t.indexOf('统计') >= 0) return { dept: '统计局', freq: '月', days: 15, from: 'ai' }
      if (t.indexOf('能耗') >= 0) return { dept: '能源局', freq: '月', days: 15, from: 'ai' }
      if (t.indexOf('ESG') >= 0 || t.indexOf('披露') >= 0) return { dept: 'ESG评级机构', freq: '年', days: 45, from: 'ai' }
      if (t.indexOf('奖补') >= 0 || t.indexOf('申报') >= 0) return { dept: '工业和信息化局', freq: '年', days: 45, from: 'ai' }
      if (t.indexOf('合规') >= 0) return { dept: '生态环境局', freq: '月', days: 15, from: 'ai' }
      // ③ 大模型也无法给出结果 → 空白，由用户手动填写
      return null
    },
    // 选择报告类型后自动预填：主管部门/频次取映射表；首次期次默认当前月；提报窗口=期次月结束次日起连续 N 天（均可手动调整）
    onCalTypeChange() {
      this.calForm.route = {}
      const t = this.calForm.reportType
      if (!t) return
      const pre = this.calPrefill(t)
      if (pre) {
        this.calForm.dept = pre.dept
        this.calForm.freq = pre.freq
        const src = pre.from === 'template' ? '已按模板配置预填' : '已由 AI 智能预填'
        this.$message.info(src + '主管部门与频次，请核对提报窗口，可手动调整')
      }
      if (!this.calForm.firstPeriod) {
        const now = new Date()
        this.calForm.firstPeriod = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')
      }
      const parts = this.calForm.firstPeriod.split('-').map(Number)
      const start = new Date(parts[0], parts[1], 1) // 期次次月 1 日
      const days = pre ? pre.days : 15
      const end = new Date(start.getTime() + (days - 1) * 86400000)
      const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
      this.calForm.windowStart = ymd(start)
      this.calForm.windowEnd = ymd(end)
      // 频次约束：以模板 periods（支持的报送周期）为准，预填值不在范围内时回落到第一项
      if (this.calFreqOptions.indexOf(this.calForm.freq) === -1) this.calForm.freq = this.calFreqOptions[0]
      if (pre) this.$message.info('已按「' + t + '」预填主管部门、频次与提报窗口，可手动调整')
    },
    // 打开新建 / 编辑报送计划弹窗（创建时确定匹配规则，之后期次自动生成；编辑仅影响未来派生）
    openCalDialog(cal) {
      this.editingCalId = null
      this.calForm = { reportType: '', dept: '', freq: '月', firstPeriod: '', windowStart: '', windowEnd: '', route: {}, approval: defaultApproval() }
      if (cal) {
        // 编辑模式：回填计划配置（报告类型锁定不可改——改类型等于换了计划语义，应删除重建）
        this.editingCalId = cal.id
        this.calForm = {
          reportType: cal.reportType, dept: cal.dept, freq: cal.freq,
          firstPeriod: cal.nextGen ? cal.nextGen.slice(0, 7) : '',
          windowStart: cal.windowStart || '', windowEnd: cal.windowEnd || '',
          route: Object.assign({}, cal.sceneRule || {}),
          approval: normalizeApproval(cal.approval)
        }
      }
      this.calDialogVisible = true
      if (!cal) {
        // 演示默认：选中「能源利用状况报告」并触发预填（主管部门/频次/提报窗口一次到位，仍可手动调整）
        this.calForm.reportType = '能源利用状况报告'
        this.onCalTypeChange()
      }
    },
    // 由首次期次 + 频次推算期次名称与开启日
    buildPeriodMeta(freq, ym) {
      const parts = ym.split('-').map(Number)
      const y = parts[0], m = parts[1]
      if (freq === '周') return { period: this.weekLabel(ym + '-01'), gen: ym + '-01' }
      if (freq === '月') return { period: y + '年' + m + '月', gen: ym + '-01' }
      return { period: y + '年度', gen: y + '-01-01' }
    },
    // 表单兜底：模板直接读取 approval.level，任何重置遗漏都补默认值（防 undefined 渲染报错）
    ensureApprovalForms() {
      if (!this.calForm.approval) this.$set(this.calForm, 'approval', defaultApproval())
      if (!this.newReport.approval) this.$set(this.newReport, 'approval', defaultApproval())
    },
    // 审批层级切换（创建任务弹窗内）：按所选层级展开 / 收敛审批节点（保留已填审核人）
    onApprovalLevelChange(a) {
      a.chain = approvalChainOfLevel(a.level, a.chain)
    },
    // 提交新建报送计划：写入日历，之后期次按计划自动派生
    submitCalRule() {
      const f = this.calForm
      if (!f.reportType || !f.dept || !f.firstPeriod || !f.windowStart || !f.windowEnd) {
        this.$message.warning('请完整填写报告类型、主管部门、首次期次与提报窗口')
        return
      }
      const meta = this.buildPeriodMeta(f.freq, f.firstPeriod)
      const ws = new Date(f.windowStart + 'T00:00:00')
      const we = new Date(f.windowEnd + 'T00:00:00')
      if (we < ws) {
        this.$message.warning('提报窗口的截止日不得早于开始日')
        return
      }
      const md = d => (d.getMonth() + 1) + '月' + d.getDate() + '日'
      const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
      // 场景适配：规则全部来自模板库的填报场景（variants）
      // route = 展示文案；sceneRule = 结构化规则（固定取值），期次任务据此直接命中场景；
      // 场景在创建时必选（方案A统一口径）：多场景模板的条件未全部固定时阻断创建，不做「暂不固定」后移
      const tpl = this.calMatchTpl
      let route = ''
      const sceneRule = {}
      if (tpl && tpl.variants && tpl.variants.length) {
        const cond = f.route || {}
        const dims = (tpl.matchFields || []).map(x => x.key)
        const keys = dims.length
          ? dims
          : [...new Set(tpl.variants.reduce((a, v) => a.concat(Object.keys(v.conditions || {})), []))]
        const unset = keys.filter(k => !cond[k] || cond[k] === 'auto')
        if (unset.length) {
          this.$message.warning('请完成场景适配条件的选择（决定期次任务的填报场景与报表套件）')
          return
        }
        keys.forEach(k => { sceneRule[k] = cond[k] })
        const hit = tpl.variants.find(v => Object.entries(v.conditions || {}).every(([k, val]) => cond[k] === val))
        route = hit ? hit.label + '（条件组合命中）' : '条件组合未命中，转人工适配'
      }
      const payload = {
        dept: f.dept, reportType: f.reportType, freq: f.freq,
        window: md(ws) + ' ~ ' + md(we),
        nextName: meta.period + f.reportType, nextPeriod: meta.period, nextGen: meta.gen,
        windowStart: ymd(ws), windowEnd: ymd(we),
        templateId: tpl ? tpl.id : '',
        route: route,
        sceneRule: sceneRule,
        approval: normalizeApproval(f.approval)
      }
      if (this.editingCalId) {
        // 编辑模式：更新计划本身（报告类型不可改）；只影响未来派生，已生成的期次任务不动
        const cal = this.submissionCalendar.find(c => c.id === this.editingCalId)
        if (cal) Object.assign(cal, payload)
        this.$message.success('报送计划已更新，下期：' + meta.period + f.reportType)
      } else {
        this.submissionCalendar.push(Object.assign({ id: 'cal-new-' + Date.now(), enabled: true, createdAt: ymd(new Date()) }, payload))
        this.$message.success('报送计划已创建，期次按「' + f.freq + '」自动生成，下期：' + meta.period + f.reportType)
      }
      this.calDialogVisible = false
      this.calDeptFilter = f.dept
    },
    // 停用 / 启用报送计划：停用后不再自动派生期次任务，「提前启动」同时不可用；已生成的期次任务不受影响
    toggleCalEnabled(cal) {
      cal.enabled = !cal.enabled
      if (cal.enabled) {
        this.$message.success('已启用报送计划：' + cal.dept + ' · ' + cal.reportType + '，恢复期次自动派生')
      } else {
        this.$message.warning('已停用报送计划：' + cal.dept + ' · ' + cal.reportType + '，停止期次自动派生（已生成的任务不受影响）')
      }
    },
    // 删除报送计划：仅移除计划本身，停止后续派生；已生成的期次任务保留（任务一旦创建即独立存在）
    deleteCal(cal) {
      const hasTask = this.reports.some(r => r.earlyKey === cal.id)
      this.$confirm(
        '确定删除报送计划「' + cal.dept + ' · ' + cal.reportType + '」（' + cal.freq + '）？'
        + '该计划多为主管部门法定定期任务，删除后后续期次将<b>不再自动生成</b>，可能产生逾期申报的合规风险。'
        + (hasTask ? '已生成的期次任务将保留，仅停止后续派生。' : '')
        + '如仅需暂停自动派生，建议改用「停用」。',
        '删除报送计划',
        { confirmButtonText: '仍要删除', cancelButtonText: '取消', type: 'warning', dangerouslyUseHTMLString: true }
      ).then(() => {
        const i = this.submissionCalendar.indexOf(cal)
        if (i >= 0) this.submissionCalendar.splice(i, 1)
        this.$message.success('报送计划已删除：' + cal.dept + ' · ' + cal.reportType)
      }).catch(() => {})
    },
    // 在途防重保护（Idempotency Guard）：该期次已存在在途任务（提前启动或日历自动派生共用 earlyKey）时返回该任务
    calTaskInFlight(cal) {
      return this.reports.find(r => r.earlyKey === cal.id && !this.isClosed(r.status)) || null
    },
    // 「查看在途任务」：定位跳转至报送任务列表并展开该任务编排（不新建重复实例）
    gotoInFlightTask(cal) {
      const t = this.calTaskInFlight(cal)
      if (!t) return
      this.rightPanel = 'reports'
      this.enterReport(t)
      this.$message.info('「' + cal.nextName + '」已有在途任务，已为你打开编排（不重复实例化）')
    },
    // 提前启动：立即实例化日历中已定义的下期草稿任务（解决死等调度日的僵化）
    earlyStart(cal) {
      if (this.reports.some(r => r.earlyKey === cal.id)) {
        this.$message.info('「' + cal.nextName + '」已提前启动，见报送任务列表')
        return
      }
      this.createCalTask(cal)
      this.rightPanel = 'reports'
      this.$message.success('已提前启动「' + cal.nextName + '」草稿任务，已同步至报送任务列表')
    },
    // 「更多」菜单分发（删除已收编于此，仅系统管理员角色可见入口）
    calMore(cmd, cal) {
      if (cmd === 'delete') this.deleteCal(cal)
    },
    // 日历计划 → 期次任务实例化（提前启动 / 到期自动派生共用）：
    // 模板与场景规则随计划带入任务；计划固定取值直接命中填报场景，条件「暂不固定」则进入任务后人工选择
    createCalTask(cal) {
      const tpl = this.templates.find(x => x.id === cal.templateId)
        || this.templates.filter(x => x.type === '报告模板' && x.status === '已发布').find(x => x.reportType === cal.reportType)
        || null
      const sceneRule = cal.sceneRule || {}
      this.reports.unshift({
        id: Math.max.apply(null, this.reports.map(r => r.id).concat([0])) + 1,
        name: cal.nextName,
        short: cal.reportType.slice(0, 5),
        type: cal.reportType,
        field: sceneRule.field || this.profileValues.domain || '',
        status: '编制中',
        progress: 5,
        period: cal.nextPeriod,
        auto: true,
        dept: cal.dept,
        freq: cal.freq,
        deadline: cal.windowEnd,
        stage: 2,
        issues: [],
        templateId: tpl ? tpl.id : '',
        templateLock: tpl ? { version: tpl.version, docName: tpl.docName, caliber: tpl.caliber ? JSON.parse(JSON.stringify(tpl.caliber)) : null, standard: tpl.standard || '' } : null,
        sceneRule: sceneRule,
        approval: normalizeApproval(cal.approval),
        earlyKey: cal.id
      })
    },
    // 报送排期到期自动派生：进入页面时检查全部启用计划，生成日已到且期次任务不存在时自动创建。
    // 兑现「任务由报送排期自动滚动生成，无需手动创建」的产品承诺（调度由进入页面时触发，生产环境为后端定时任务）。
    autoGenerateDue() {
      this.submissionCalendar.forEach(cal => {
        if (!cal.enabled) return
        if (this.daysUntil(cal.nextGen) > 0) return
        const exists = this.reports.some(r => r.earlyKey === cal.id || (r.dept === cal.dept && r.period === cal.nextPeriod))
        if (exists) return
        this.createCalTask(cal)
        this.messages.push({ role: 'agent', text: '<b>【报送排期 · 自动生成】</b> 已到「' + cal.nextGen + '」生成日，「' + cal.nextName + '」期次任务已自动创建（' + cal.dept + ' · ' + cal.freq + '，提报截止 ' + cal.windowEnd + '），见「报送任务」列表。', time: '刚刚', type: 'text' })
      })
      this.scrollBottom()
    },
    // 跳转平台模板库：模板详情与维护入口在智能体中心，工作台只做任务侧的模板匹配
    goPlatformTemplates() {
      this.$router.push('/agent-center/apps/platform-template-library')
    },
    // 跳转报告与档案中心：归档报告的查看/下载统一在报告与档案中心（企业报告资产库）
    // 携带 focus 参数：目标页高亮定位到该报告条目
    goCarbonReportCenter(report) {
      const query = (report && report.reportNo) ? { focus: report.reportNo } : {}
      this.$router.push({ path: '/agent-center/apps/carbon-footprint-report', query: query })
    },
    // 首页任务卡删除：仅未存档任务（编排中 / 待提报）可删；已归档 / 已提报 / 已受理承载留痕与档案，不可删
    deleteReportCard(report) {
      this.$confirm('删除后任务与编排记录将不可恢复，确定删除「' + report.name + '」？', '删除任务', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const i = this.reports.indexOf(report)
        if (i >= 0) this.reports.splice(i, 1)
        this.$message.success('任务已删除：' + report.name)
      }).catch(() => {})
    },
    // 兜底人工指定填报场景（仅场景解析不到的数据异常路径）：确认后写入覆盖并标记下游需重新确认
    onVariantChange(key) {
      if (!key || (this.activeVariant && this.activeVariant.key === key)) return
      const target = this.activeTemplate.variants.find(v => v.key === key)
      const label = target ? target.label : key
      this.$confirm('指定为「' + label + '」后下游阶段需重新确认。是否确认？', '指定填报场景', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.variantOverride = key
        // 注：原 invalidatedStages / phaseOps / maxStepIndex 属其他智能体（方案编制）的复制残留，
        // 三者均未在本组件 data 中声明，赋值无任何作用且 `maxStepIndex` 恒为 undefined，已移除
        this.$message.success('已指定填报场景为「' + label + '」')
      }).catch(() => {})
    },
    // 删除当前任务：仅未存档（未归档未提报）任务可删；已归档/已提报/已受理承载留痕与档案，不提供删除
    deleteActiveTask() {
      const t = this.activeTask
      if (!t) return
      if (this.reportStatus(t) !== 'composing') {
        this.$message.warning('已进入提报环节的任务（待提报·受理 / 已闭环）承载留痕与档案，不可删除')
        return
      }
      this.$confirm('删除后任务与编排记录将不可恢复，确定删除「' + t.name + '」？', '删除任务', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const i = this.reports.indexOf(t)
        if (i >= 0) this.reports.splice(i, 1)
        this.$message.success('任务已删除：' + t.name)
        this.exitWorkbench()
      }).catch(() => {})
    },
    // 提报状态登记（统一弹窗）：登记提报（已归档 → 已提报）与登记受理（已提报 → 已受理）。
    // 弹窗结构统一：标题栏 → 文字说明 → 表单字段 → 附件凭证 → 按钮区；
    // 真实对接时由后端接收政府回执（API-R06）自动驱动，前端承接人工录入；看板 cell 同步推进。
    openSubmitReg(report, mode) {
      const now = new Date()
      const pad = n => String(n).padStart(2, '0')
      this.submitRegDialog.report = report
      this.submitRegDialog.mode = mode
      this.submitRegDialog.form = { way: '在线报送（报送系统）', time: now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()), receipt: '' }
      this.submitRegDialog.files = []
      this.submitRegDialog.visible = true
    },
    onRegFileChange(file, fileList) { this.submitRegDialog.files = fileList },
    onRegFileRemove(file, fileList) { this.submitRegDialog.files = fileList },
    confirmSubmitReg() {
      const d = this.submitRegDialog
      const report = d.report
      if (!report) return
      const time = d.form.time || new Date().toLocaleString('zh-CN', { hour12: false })
      const attach = (d.files || []).map(f => f.name).join('、')
      if (d.mode === 'submission') {
        report.status = '待提报·受理'
        this.$set(report, 'submitted', true)
        // 存证元信息原子回写任务对象（供卡片凭证透出与存证底卷抽屉直读）
        this.$set(report, 'receiptNo', d.form.receipt || '待回写')
        this.$set(report, 'receiptTime', time)
        this.$set(report, 'receiptWay', d.form.way)
        this.$set(report, 'receiptAcceptedBy', report.dept)
        this.$set(report, 'receiptFiles', (d.files || []).map(f => f.name))
        this.pushRevision('登记提报：' + report.name + '（' + d.form.way + (d.form.receipt ? '，凭证 ' + d.form.receipt : '') + (attach ? '，附件 ' + attach : '') + '）', '人工')
        this.$message.success('已登记提报：' + report.name)
      } else {
        report.status = '已闭环'
        // 受理回执回写任务对象（文号/受理机关/登记时间）
        if (d.form.receipt) this.$set(report, 'receiptNo', d.form.receipt)
        this.$set(report, 'receiptAcceptedBy', report.dept)
        this.$set(report, 'receiptTime', time)
        this.pushRevision('登记受理：' + report.name + (d.form.receipt ? '（文号 ' + d.form.receipt + '）' : '') + (attach ? '，附件 ' + attach : '') + '，任务闭环', '人工')
        this.$message.success('已登记受理：' + report.name + '，任务闭环')
      }
      d.visible = false
    },
    sendMessage() {
      if (!this.userInput.trim()) return
      const input = this.userInput
      this.ensureConversation(input)
      this.messages.push({ role: 'user', text: this.userInput, time: '刚刚', type: 'text' })
      this.userInput = ''
      if (input.includes('本期') || input.includes('应报') || input.includes('待报')) {
        this.rightPanel = 'reports'
        this.messages.push({ role: 'agent', text: '本期应报 ' + this.dueReports.length + ' 份（由报送排期自动生成）：' + this.dueReports.map(r => r.name + '（剩' + this.daysLeft(r.deadline) + '天）').join('、') + '。已为你切换至「报送任务」。', time: '刚刚', type: 'text' })
        this.scrollBottom()
        return
      }
      if (input.includes('新建') || input.includes('创建')) {
        this.newReport = { name: '', type: '碳排放报告', dim: '月', rangeYear: '', rangeMonth: '', rangeDates: [], rangeWeek: '', remark: '', deadline: '', nameTouched: false, approval: defaultApproval() }
        this.newReportScene = ''
        this.newReportDialog = true
        this.messages.push({ role: 'agent', text: '已为你打开<b>新建临时报告</b>窗口：周期性报告由报送排期自动生成，临时报告填写后直接进入编排。', time: '刚刚', type: 'text' })
        this.scrollBottom()
        return
      }
      setTimeout(() => {
        this.messages.push({ role: 'agent', text: this.reply(input), time: '刚刚', type: 'text' })
        this.scrollBottom()
      }, 600)
    },
    reply(input) {
      if (input.includes('历史') || input.includes('列表')) return '报送任务见右侧「报送任务」页签：本期应报 ' + this.dueReports.length + ' 份自动置顶，历史期次与临时报告在下方。'
      if (input.includes('进度') || input.includes('状态')) return '本期应报 ' + this.briefStats.total + ' 份：编制中 ' + this.briefStats.composing + ' 份、待提报·受理 ' + this.briefStats.submitting + ' 份、已闭环 ' + this.briefStats.closed + ' 份。'
      if (input.includes('日历') || input.includes('周期') || input.includes('频次')) return '报告任务由报送排期按「部门/频次/期次」自动生成（见右侧「排期规则」页签），如安环部碳排放月报每月1日自动生成期次任务，无需手动创建。'
      if (input.includes('模板')) return '报告模板由平台模板库统一维护（当前 ' + this.calTypeOptions.length + ' 类），工作台不重复展示模板列表。创建报送计划时选定报告类型即自动匹配模板并锁定版本，其填报场景（variants）成为期次任务的场景规则；模板详情请在「智能体中心 → 平台模板库」查看。'
      if (input.includes('合规') || input.includes('校验')) return '合规校验含格式合规与数据逻辑共 <b>' + CHECK_RULES.length + ' 条</b>规则（口径一致性、排放因子版本、报告格式合规、勾稽平衡等）。编排报告时自动执行校验。'
      if (input.includes('口径')) return '口径适配确保3部门合计值与总量口径一致，范围3各小类之和=范围3合计值。自动校验并在偏差时标注原因。'
      // 风格控制指令（文体 / 受众 / 章节）：进入编排后对章节改写生效
      const styleCmd = this.parsePolishStyleCmd(input)
      if (styleCmd && styleCmd.tone) return this.applyPolishStyleCmd(styleCmd)
      return '我理解您的问题。输入"新建报告"可创建提报任务，或通过右侧页签查看报送任务与报送排期。'
    },
    startCreateReport() {
      this.ensureConversation('新建报告')
      this.newReport = { name: '', type: '碳排放报告', dim: '月', rangeYear: '', rangeMonth: '', rangeDates: [], rangeWeek: '', remark: '', deadline: '', nameTouched: false, approval: defaultApproval() }
      this.newReportScene = ''
      this.newReportDialog = true
      this.messages.push({ role: 'agent', text: '已为你打开<b>新建临时报告</b>窗口（非周期，不入报送排期）；周期性报告仍由报送排期自动生成，无需手动创建。', time: '刚刚', type: 'text' })
      this.scrollBottom()
    },
    // 时间维度 + 期间选择 → 期次文本（统一口径：周 / 月 / 年 / 自定义）
    formatPeriod(dim, year, month, dates, week) {
      if (dim === '年') return year ? year + '年度' : ''
      if (dim === '自定义') {
        const d = dates || []
        return (d.length === 2 && d[0] && d[1]) ? (d[0] + ' ~ ' + d[1]) : ''
      }
      if (dim === '周') return week ? this.weekLabel(week) : ''
      if (!month) return ''
      const y = month.slice(0, 4), m = +month.slice(5, 7)
      return y + '年' + m + '月'
    },
    // 周标签（ISO 周）：2026年第41周
    weekLabel(d) {
      const dt = new Date(d + 'T00:00:00')
      const day = (dt.getDay() + 6) % 7
      const thu = new Date(dt.getTime() + (3 - day) * 86400000)
      const jan1 = new Date(thu.getFullYear(), 0, 1)
      const week = Math.floor((thu - jan1) / 86400000 / 7) + 1
      return thu.getFullYear() + '年第' + week + '周'
    },
    // 频次展示标签：周报 / 月报 / 年报
    freqLabel(f) {
      return ({ 周: '周报', 月: '月报', 年: '年报' })[f] || (f || '')
    },
    // 名称自动生成：报告期次 + 报告类型（用户手动编辑过名称后不再覆盖）
    autoFillName() {
      const n = this.newReport
      if (n.nameTouched) return
      const p = this.formatPeriod(n.dim, n.rangeYear, n.rangeMonth, n.rangeDates, n.rangeWeek)
      if (p) n.name = p + n.type
    },
    // 切换时间维度：清空期间选择；当前类型不支持新维度时自动切换到第一个可用类型
    onDimChange() {
      // 修正：原引用不存在的 computed `calTypeOptionsFiltered`（undefined.includes → TypeError，
      // 导致切换时间维度时区间不清空、类型不校正且无任何提示）
      const opts = this.calTypeOptions || []
      if (!opts.includes(this.newReport.type)) {
        this.newReport.type = opts[0] || ''
      }
      this.newReport.rangeYear = ''
      this.newReport.rangeMonth = ''
      this.newReport.rangeDates = []
      this.newReport.rangeWeek = ''
      this.autoFillName()
    },
    // 类型切换：重置填报场景选择（场景选项随新类型的 variants 变化）
    onNewReportTypeChange() {
      this.newReportScene = ''
      this.autoFillName()
    },
    submitCreate() {
      const n = this.newReport
      if (!n.name) { this.$message.warning('请填写报告名称'); return }
      const period = this.formatPeriod(n.dim, n.rangeYear, n.rangeMonth, n.rangeDates, n.rangeWeek)
      if (!period) { this.$message.warning('请选择' + (n.dim === '年' ? '报告年份' : n.dim === '自定义' ? '时间区间（起止日期）' : n.dim === '周' ? '所属周' : '所属月份')); return }
      // 多场景模板：创建时确认填报场景（写入 sceneRule，编排内仍可手动切换）
      const sceneKey = this.newReportScene
      let sceneRule = {}
      if (this.newReportTpl && this.newReportTpl.variants && this.newReportTpl.variants.length) {
        const hit = this.newReportTpl.variants.find(v => v.key === sceneKey)
        if (!hit) { this.$message.warning('请选择填报场景'); return }
        sceneRule = Object.assign({}, hit.conditions)
      }
      const report = {
        // id 取最大编号 +1（不用 length+1：删除任务后 length 会回退，导致 id 复用 →
        // activeTask 命中错任务、AI 改动分片（按任务 id 存取）串味）
        id: this.reports.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) + 1,
        name: n.name,
        type: n.type,
        approval: normalizeApproval(n.approval),
        status: '编制中',
        progress: 10,
        period: period,
        remark: n.remark || '',
        sceneRule: sceneRule,
        complianceScore: 0,
        auto: false,
        dept: '本级',
        freq: n.dim,
        deadline: n.deadline || ''
      }
      this.reports.unshift(report)
      this.newReportDialog = false
      this.messages.push({ role: 'agent', text: '✅ 已创建临时报告"' + report.name + '"（' + report.period + '，非周期，不入报送排期）' + (report.remark ? '。备注：' + report.remark : '') + '。智能体将自动执行口径适配与合规校验。', time: '刚刚', type: 'text' })
      this.rightPanel = 'reports'
      this.newReport = { name: '', type: '碳排放报告', dim: '月', rangeYear: '', rangeMonth: '', rangeDates: [], rangeWeek: '', remark: '', deadline: '', nameTouched: false, approval: defaultApproval() }
      this.$message.success('报告任务创建成功')
      this.scrollBottom()
    },
    // ===== 双模态切换 =====
    // 进入任务激活沉浸态（按任务所处阶段定位）
    // 幂等补齐「成稿校核式」演示任务（兼容老缓存：无该任务时自动补入，不覆盖用户数据）
    ensureDocModeTask() {
      if (!Array.isArray(this.reports)) return
      const base = this.reports.find(r => r && r.id === 5)
      if (base && base.detailMode !== 'guided') base.detailMode = 'guided'
      const exists = this.reports.find(r => r && r.id === 6)
      if (exists) {
        if (exists.detailMode !== 'document') exists.detailMode = 'document'
        return
      }
      this.reports.unshift({
        id: 6, name: '2026年度能源利用状况报告2', short: '能源状况报告2', type: '能源利用状况报告', field: '工业',
        detailMode: 'document',
        approval: { level: 3, chain: [
          { nodeLevel: 1, roleKey: '填报人自查', by: '李明（能源管理负责人）' },
          { nodeLevel: 2, roleKey: '部门负责人审核', by: '王志强（节能主管领导）' },
          { nodeLevel: 3, roleKey: '碳管理师复核', by: '赵敏（碳管理师）' }
        ] },
        status: '编制中', progress: 30, period: '2026年度', complianceScore: 0, auto: true,
        dept: '发展改革委', freq: '年', deadline: '2027-03-31', stage: 1, issues: [],
        taskKey: 'nybg', templateId: 'PT-012',
        templateLock: { version: 'v1.0', docName: '《用能单位能源利用状况报告》（附件2规范）', caliber: { standardCode: '附件2' }, standard: '附件2 用能单位能源利用状况报告格式' },
        sceneRule: { field: '工业' }
      })
    },
    // ===== 形式B：成稿校核交互 =====
    docItemStatus(sec, item) {
      return item.status || 'pending'
    },
    // 表格单元格取值：首列取行名；模板有值用模板；缺失按语义补演示数据（同行数据自洽、刷新不变）
    docCellValue(sec, row, col, ci) {
      const name = row.name || ''
      const cells = row.cells || {}
      if (ci === 0) return name || '—'
      const raw = cells[col]
      if (raw !== undefined && raw !== null && raw !== '') return raw
      const seedRow = this._hash(sec.no + '|' + name)
      const seed = this._hash(sec.no + '|' + name + '|' + col)
      const cur = (seedRow % 880 + 120) * 10            // 本期值基准
      const yoy = (seedRow % 2 === 0 ? 1 : -1) * ((seedRow % 11) + 1)   // ±1~11%
      if (/计量单位|单位/.test(col)) return this._guessUnit(name, sec.no)
      if (/代码/.test(col)) return String(100 + (seedRow % 800))
      if (/本期/.test(col)) return cur.toLocaleString()
      if (/上年/.test(col)) return Math.round(cur / (1 + yoy / 100)).toLocaleString()
      if (/同比|变化率/.test(col)) return (yoy > 0 ? '+' : '') + yoy + '%'
      if (/说明|备注|情况/.test(col)) return '—'
      if (/消费量|购进量|库存|产量|产值|利税|收入|成本|金额|能耗|节能量|折标|金额/.test(col)) return (cur / 10).toLocaleString()
      if (seed % 3 === 0) return (cur / 10).toLocaleString()
      return '—'
    },
    _hash(str) {
      let h = 0
      for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) & 0x7fffffff }
      return h
    },
    _guessUnit(name, no) {
      if (/电/.test(name)) return '万千瓦时'
      if (/天然气|气/.test(name)) return '万立方米'
      if (/热/.test(name)) return '百万千焦'
      if (/水/.test(name)) return '万立方米'
      if (/煤|焦炭/.test(name)) return '吨'
      if (/油/.test(name)) return '吨'
      if (/利税|产值|收入|成本|金额/.test(name)) return '万元'
      if (/能耗|节能量|折标/.test(name)) return '吨标准煤'
      if (/率|比例/.test(name)) return '%'
      return '—'
    },
    // 形式B：提交归档（内容指纹 + 回执登记 + 状态流转）
    docArchive() {
      const st = this.docStats
      if (st.confirmed < st.total) {
        this.$message.warning('仍有 ' + (st.total - st.confirmed) + ' 项未确认，请先完成核对')
        return
      }
      // 审批闸门：多级审核全部通过才可签字归档
      const chain = this.docAuditChain || []
      const passed = chain.filter(n => n.done).length
      if (chain.length && passed < chain.length) {
        this.$message.warning('多级审核未全部通过（' + passed + '/' + chain.length + '），需完成审核后方可签字归档')
        return
      }
      const t = this.activeTask
      if (!t) return
      if (t.submitted || this.reportStatus(t) !== 'composing') {
        this.$message.warning('本期报告已归档，不可重复提交')
        return
      }
      this.$confirm('提交后将进行内容指纹存证并按审批链流转（填报人 → 部门负责人 → 碳管理师复核），是否确认提交归档？', '提交归档', {
        confirmButtonText: '确认提交', cancelButtonText: '再检查一下', type: 'warning'
      }).then(() => {
        const now = new Date()
        const no = 'ZF-' + now.getFullYear() + '-' + String(1000 + Math.floor(Math.random() * 9000))
        t.status = '待提报·受理'
        t.submitted = true
        t.progress = 100
        t.receiptNo = no
        t.receiptTime = now.toLocaleString('zh-CN')
        t.fingerprint = 'fp-' + Math.random().toString(16).slice(2, 18)
        this.docViewMode = 'preview'
        this.wbMessages.push({
          role: 'agent',
          text: '<b>【已归档】</b>报告已提交并完成内容指纹存证。\n\n'
            + '<b>回执号</b>：' + no + '\n'
            + '<b>提交时间</b>：' + t.receiptTime + '\n'
            + '<b>流转</b>：填报人自查 → 部门负责人审核 → 碳管理师复核\n\n'
            + '归档文件可在「报告与档案中心」查看与下载。',
          suggestions: ['查看归档回执']
        })
      }).catch(() => {})
    },
    // 预览态：切换章节展开（表格默认收起）
    togglePreviewSec(sec) {
      const cur = this.docPreviewOpen[sec.key]
      this.$set(this.docPreviewOpen, sec.key, !cur)
    },
    previewSecOpen(sec) {
      // 正文默认展开；表格默认收起
      const v = this.docPreviewOpen[sec.key]
      if (v === undefined) return sec.type !== 'table'
      return v
    },
    // 预览态：审批节点通过（演示流转）
    docPassAudit(i) {
      this.$set(this.docAuditPassed, i, true)
      const chain = this.docAuditChain
      const passed = chain.filter(n => n.done).length
      if (passed === chain.length) {
        this.$message.success('全部 ' + chain.length + ' 级审核已通过，可签字确认并归档')
      } else {
        this.$message.success('第 ' + (i + 1) + ' 级已通过（' + passed + '/' + chain.length + '）')
      }
    },
    // 形式B：左侧对话意图 → 右侧文档操作
    handleDocIntent(input) {
      const t = (input || '').trim()
      if (!t) return false
      // 下一个待确认
      if (/下一个|下一项/.test(t)) { this.docNextPending(); return true }
    // 撤回上一次修改
    if (/^撤回/.test(t)) { this.undoLastEdit(); return true }
    // 依次调整（应用全部联动项）
    if (/^依次调整/.test(t)) { this.applyImpacts(); return true }
    // 撤销本次修改（含联动）
    if (/^撤销修改/.test(t)) { this.cancelImpacts(); return true }
    // 查看材料
    if (/^查看材料/.test(t)) {
      const f0 = this.findDocFocus()
      if (f0) this.openItemMaterials(f0.sec, f0.item)
      return true
    }
      // 全篇校验
      if (/全篇校验|整篇校验|^校验|校验结果|检查一遍/.test(t)) { this.docFullCheck(); return true }
      // 生成定稿
      if (/生成定稿|出定稿|^定稿/.test(t)) { this.docFinalize(); return true }
      // 提交归档
      if (/提交归档|^归档|提交审批|提交/.test(t)) { this.docArchive(); return true }
      // 查看回执
      if (/回执|归档记录/.test(t)) {
        const tk = this.activeTask || {}
        this.wbMessages.push({
          role: 'agent',
          text: tk.receiptNo
            ? ('<b>【归档回执】</b>\n回执号：' + tk.receiptNo + '\n提交时间：' + (tk.receiptTime || '—') + '\n受理单位：' + (tk.dept || '—') + '\n状态：' + (tk.status || '—'))
            : '当前报告尚未提交归档，完成核对与定稿后可提交。',
          suggestions: tk.receiptNo ? [] : ['全篇校验', '生成定稿']
        })
        return true
      }
      const f = this.findDocFocus()
      if (!f) return false
      const name = f.item.name || f.item.label || '该项'

      /* ===== 正文（段落）：支持对话框输入修改方向/内容 ===== */
      if (f.sec.type === 'text') {
        // ① 直接替换：「改为：xxx」/「改成 xxx」
        const mReplace = t.match(/^(?:改为|改成|替换为|更新为)[:：\s]*(.+)$/)
        if (mReplace && mReplace[1].trim()) {
          this.applyTextEdit(f.sec, f.item, mReplace[1].trim(), '直接替换')
          return true
        }
        // ② 润色/改写：「润色这段」「改得更正式」「简化表述」
        if (/润色|改写|优化|更正式|更简洁|简化|精简|口语化|专业化/.test(t)) {
          this.aiPolishText(f.sec, f.item, t)
          return true
        }
        // ③ 补充：「补充能源管理师人数」「增加与上期的对比」
        const mAppend = t.match(/^(?:补充|增加|加上|添加|写入)[:：\s]*(.+)$/)
        if (mAppend && mAppend[1].trim()) {
          const cur = f.item.value || ''
          const add = mAppend[1].trim()
          const sep = /[。！？]$/.test(cur) ? '' : '。'
          this.applyTextEdit(f.sec, f.item, cur + sep + add + '。', '补充内容')
          return true
        }
        // ④ 删除：「删除这句」「删掉 xxx」
        if (/^(?:删除|删掉|去掉)/.test(t)) {
          this.applyTextEdit(f.sec, f.item, '（待补充）', '删除内容')
          return true
        }
      }
      // 确认
      if (/确认该值|确认无误|^确认$|没问题|正确|^对$|核对无误/.test(t)) {
        const ok = this.confirmDocItem(f.sec, f.item)
        if (!ok) {
          // 待补录项：不能直接确认，引导补录，避免"确认→失败→再定位"的死循环
          this.wbMessages.push({
            role: 'agent',
            text: '<b>' + name + '</b> 当前<b>缺少数据</b>，无法直接确认。请直接输入数值（如 38.2），或点「补充数值」/「上传材料」。',
            suggestions: ['补充数值', '上传材料']
          })
          return true
        }
        const st = this.docStats
        const rest = this.docPendingList()
        let text = '已确认 <b>' + name + '</b>。'
        let sugs = []
        if (!rest.length) {
          text += '\n\n<b>数据核对完成</b>（' + st.total + '/' + st.total + ' 项）。下一步建议全篇校验，通过后生成定稿并提交归档。'
          sugs = ['全篇校验', '生成定稿']
        } else {
          // 自动接力到下一项
          const next = rest[0]
          this.focusDocEntry(next)
          const nm2 = next.item.name || next.item.label || '下一项'
          const miss = next.item.status === 'missing'
          text += '\n\n已自动跳到下一项：<b>' + next.sec.no + '、' + next.sec.title + ' — ' + nm2 + '</b>（'
            + (miss ? '待补录' : '待确认') + '，还剩 <b>' + rest.length + '</b> 项）。'
            + (miss ? '\n该项缺少数据，请提供数值或上传材料。' : '\n请核对后确认，或直接告知正确值。')
          sugs = miss ? ['补充数值', '上传材料'] : ['确认该值', '修改该项', '上传材料']
        }
        this.wbMessages.push({ role: 'agent', text: text, suggestions: sugs })
        return true
      }
      // 修改（带新值）
      const m = t.match(/(?:改为|改成|应该是|修改为|填|为)\s*([\d,\.]+)/) || t.match(/^([\d,\.]+)$/)
      if (m) {
        const raw = m[1].replace(/,/g, '')
        const val = /^\d+(\.\d+)?$/.test(raw) ? Number(raw).toLocaleString() : m[1]
        this.updateDocItemValue(f.sec, f.item, val)
        const st2 = this.docStats
        const rest2 = this.docPendingList()
        let t3 = '已把 <b>' + name + '</b> 更新为 <b>' + val + '</b>，并标记为已确认（本次更正已留痕）。'
        let s3 = []
        if (!rest2.length) {
          t3 += '\n\n<b>全部项目已确认</b>（' + st2.total + '/' + st2.total + '）。下一步：全篇校验 → 生成定稿 → 提交归档。'
          s3 = ['全篇校验', '生成定稿']
        } else {
          const nx = rest2[0]
          this.focusDocEntry(nx)
          const nm3 = nx.item.name || nx.item.label || '下一项'
          const miss3 = nx.item.status === 'missing'
          t3 += '\n\n已自动跳到下一项：<b>' + nx.sec.no + '、' + nx.sec.title + ' — ' + nm3 + '</b>（还剩 <b>' + rest2.length + '</b> 项）。'
          s3 = miss3 ? ['补充数值', '上传材料'] : ['确认该值', '修改该项', '上传材料']
        }
        this.wbMessages.push({ role: 'agent', text: t3, suggestions: s3 })
        return true
      }
      // 修改意图（未给值）
      if (/修改|更正|改一下|调整/.test(t)) {
        this.wbMessages.push({ role: 'agent', text: '请直接告知新值（如「改为 8,600」），我会更新 <b>' + name + '</b> 并留痕。', suggestions: [] })
        return true
      }
      // 补充数值：提示直接输入
      if (/补充数值|填数值|输入数值|补充数据/.test(t)) {
        this.wbMessages.push({
          role: 'agent',
          text: '请直接输入 <b>' + name + '</b> 的数值（例如 <b>38.2</b>），我会填入并标记为已确认。',
          suggestions: ['上传材料']
        })
        return true
      }
      // 上传材料
      if (/上传材料|补录|凭证/.test(t)) {
        const isTable = f.sec.type === 'table'
        const hint = isTable
          ? '可上传该行指标对应的原始凭证（如电费结算单、燃气购气单、产量统计表、检测报告），或直接告知数值。'
          : '可上传支撑该段内容的证明材料（如制度文件、验收报告、会议纪要），或直接告知需要修改的表述。'
        this.wbMessages.push({
          role: 'agent',
          text: '请上传 <b>' + name + '</b> 的佐证材料。\n\n' + hint + '\n\n上传后我会自动关联到该项，并在归档时一并存证。',
          suggestions: ['改为 ', '确认该值']
        })
        return true
      }
      return false
    },
    /** 应用正文修改（写覆盖层 + 反馈） */
    applyTextEdit(sec, item, newVal, action) {
      const oldVal = item.value || ''
      item.value = newVal
      this.updateDocItemValue(sec, item, newVal)
      this._lastEdit = { sec, item, oldVal, col: null }
      const oldLen = oldVal.length
      const newLen = newVal.length
      this.wbMessages.push({
        role: 'agent',
        text: '✅ <b>' + action + '完成</b>：' + sec.no + '、' + sec.title + '\n'
          + '　字数：' + oldLen + ' → <b>' + newLen + '</b> 字\n'
          + '　新内容：' + (newLen > 60 ? newVal.slice(0, 60) + '…' : newVal) + '\n\n'
          + '变更已留痕。',
        suggestions: ['下一个待确认', '撤回修改']
      })
      this.$nextTick(() => {
        const el = this.$refs.wbMsgs
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      })
    },
    /** AI 润色/改写正文（演示：按指令做规则化调整） */
    aiPolishText(sec, item, instruction) {
      const old = item.value || ''
      let newVal = old
      let mode = '润色'
      if (/简洁|简化|精简/.test(instruction)) {
        // 简化：保留前两句
        const parts = old.split('。').filter(x => x.trim())
        newVal = parts.slice(0, 2).join('。') + '。'
        mode = '简化表述'
      } else if (/正式|专业/.test(instruction)) {
        newVal = old.replace(/是/g, '系').replace(/很/g, '较为').replace(/了/g, '')
        mode = '正式化'
      } else if (/口语/.test(instruction)) {
        newVal = old.replace(/系/g, '是').replace(/较为/g, '比较')
        mode = '口语化'
      } else {
        newVal = old
      }
      if (newVal === old) {
        this.wbMessages.push({
          role: 'agent',
          text: '已完成<b>' + mode + '</b>检查：当前表述已符合要求（' + old.length + ' 字）。\n'
            + '如需进一步调整，可直接说「改为：xxx」或「补充 xxx」。',
          suggestions: ['下一个待确认']
        })
        return
      }
      this.applyTextEdit(sec, item, newVal, 'AI ' + mode)
    },

    findDocFocus() {
      if (!this.docFocus) return null
      const sec = (this.docSections || []).find(x => x.key === this.docFocus.secKey)
      if (!sec) return null
      const items = sec.type === 'table' ? (sec.rows || []) : (sec.items || [])
      const item = items.find(x => x.k === this.docFocus.itemKey)
      return item ? { sec: sec, item: item } : null
    },
    // 收集所有未确认项（按文档顺序）
    docPendingList() {
      const list = []
      ;(this.docSections || []).forEach(sec => {
        const items = sec.type === 'table' ? (sec.rows || []) : (sec.items || [])
        items.forEach((it, i) => {
          if (it.status !== 'confirmed') list.push({ sec: sec, key: sec.key + '-' + i, item: it })
        })
      })
      return list
    },
    // 定位到某一项（滚动 + 高亮 + 聚焦）
    focusDocEntry(entry) {
      this.docFocusKey = entry.key
      this.docActiveKey = entry.sec.key
      this.docFocus = { secKey: entry.sec.key, itemKey: entry.key }
      this.$nextTick(() => {
        const el = document.getElementById('doc-item-' + entry.key)
        const body = this.$refs.docBody
        if (el && body) {
          const top = el.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 70
          body.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
        }
      })
    },
    // 下一个待确认：按文档顺序循环定位未确认项
    docNextPending() {
      const list = []
      ;(this.docSections || []).forEach(sec => {
        const items = sec.type === 'table' ? (sec.rows || []) : (sec.items || [])
        items.forEach((it, i) => {
          if (it.status !== 'confirmed') list.push({ sec: sec, key: sec.key + '-' + i, item: it })
        })
      })
      if (!list.length) { this.$message.success('全部项目已确认'); return }
      const cur = list.findIndex(x => x.key === this.docFocusKey)
      const next = list[(cur + 1) % list.length]
      this.docFocusKey = next.key
      this.docActiveKey = next.sec.key
      this.docFocus = { secKey: next.sec.key, itemKey: next.key }
      // 左侧推送定位说明，形成"左问右定位"的闭环
      const nm = next.item.name || next.item.label || '该项'
      const isMissing = next.item.status === 'missing'
      const st = isMissing ? '待补录' : '待确认'
      this.wbMessages.push({
        role: 'agent',
        text: '已定位到 <b>' + next.sec.no + '、' + next.sec.title + ' — ' + nm + '</b>（' + st + '，第 ' + (cur + 2 > list.length ? 1 : cur + 2) + '/' + list.length + ' 项）。\n\n'
          + (isMissing
            ? '该项<b>缺少数据</b>，请提供数值（如「改为 38.2」）或上传凭证材料。'
            : '请核对数值，确认无误或告知正确值（如「改为 8,600」）。'),
        suggestions: isMissing ? ['补充数值', '上传材料'] : ['确认该值', '修改该项', '上传材料']
      })
      this.$nextTick(() => {
        const el = document.getElementById('doc-item-' + next.key)
        const body = this.$refs.docBody
        if (el && body) {
          const top = el.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 70
          body.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
        }
      })
    },
    // 章节导航：点击跳转
    scrollToDocSection(sec) {
      this.docActiveKey = sec.key
      this.docNavOpen = false
      const body = this.$refs.docBody
      const el = document.getElementById('doc-sec-' + sec.key)
      if (!body || !el) return
      const top = el.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop
      body.scrollTo({ top: Math.max(0, top - 4), behavior: 'smooth' })
    },
    // 章节导航：滚动高亮（scroll spy）
    onDocScroll() {
      const body = this.$refs.docBody
      if (!body) return
      const secs = Array.prototype.slice.call(body.querySelectorAll('.doc-section'))
      if (!secs.length) return
      const baseTop = body.getBoundingClientRect().top
      let cur = secs[0]
      secs.forEach(el => {
        if (el.getBoundingClientRect().top - baseTop <= 48) cur = el
      })
      const key = cur.getAttribute('data-key')
      if (key && key !== this.docActiveKey) this.docActiveKey = key
    },
    // 章节完成度（导航状态点）
    docSecStat(sec) {
      const items = sec.type === 'table' ? (sec.rows || []) : (sec.items || [])
      const total = items.length
      const done = items.filter(x => x.status === 'confirmed').length
      return { total: total, done: done }
    },
    docSecCls(sec) {
      const st = this.docSecStat(sec)
      if (!st.total || st.done === st.total) return 'is-done'
      if (st.done === 0) return 'is-missing'
      return 'is-partial'
    },
    // 点击报告中的字段/行 → 左侧对话聚焦该项
    /** 取当前项关联的佐证材料（分层：精确=note含项名；章节级=note含表号） */
    getItemMaterials(sec, item) {
      const lib = MATERIAL_LIB[(this.activeTask || {}).taskKey] || MATERIAL_LIB.default || []
      const secNo = sec.no || ''
      const name = item.name || item.label || ''
      const exact = []
      const loose = []
      lib.forEach(m => {
        const note = m.note || ''
        // ① 显式 relatedItems（最精确）
        if (m.relatedItems && m.relatedItems.length) {
          const hit = m.relatedItems.some(x => x && name && (name.indexOf(x) > -1 || x.indexOf(name) > -1))
          if (hit) { exact.push(m); return }
        }
        // ② note 含项名
        if (name && name.length > 1 && note.indexOf(name) > -1) { exact.push(m); return }
        // ③ 章节级
        if (secNo && note.indexOf(secNo) > -1) { loose.push(m) }
      })
      return { exact: exact, loose: loose, all: exact.concat(loose) }
    },
    /** 材料状态文案 */
    matStatusLabel(st) {
      return st === 'ready' ? '已齐' : (st === 'missing' ? '待补' : (st === 'pending' ? '待回传' : '—'))
    },
    /** 打开当前项的材料（定位到清单弹窗） */
    openItemMaterials(sec, item) {
      const res = this.getItemMaterials(sec, item)
      if (!res.all.length) {
        this.$message.info('该项暂无关联材料，可点「上传凭证」补充')
        return
      }
      this.materialVisible = true
    },
    /** 上传凭证（演示：关联到当前项并标记已齐） */
    uploadForItem(sec, item) {
      const name = item.name || item.label || '该项'
      this.$prompt('请输入材料名称（如：2025年度审计报告）', '上传佐证材料 · ' + name, {
        confirmButtonText: '确认上传',
        cancelButtonText: '取消',
        inputPlaceholder: '材料名称'
      }).then(({ value }) => {
        const lib = MATERIAL_LIB[(this.activeTask || {}).taskKey] || MATERIAL_LIB.default
        if (lib && value) {
          lib.push({
            group: '人工上传',
            name: value,
            type: 'PDF',
            source: '人工上传',
            time: new Date().toLocaleDateString('zh-CN'),
            size: '—',
            required: true,
            status: 'ready',
            hash: '',
            note: '对应' + (sec.no || '') + ' ' + name
          })
        }
        this.wbMessages.push({
          role: 'agent',
          text: '✅ 已上传佐证材料 <b>' + value + '</b>，并关联到「' + sec.no + '、' + sec.title + ' — ' + name + '」。',
          suggestions: ['下一项']
        })
        this.$message.success('材料已上传并关联')
      }).catch(() => {})
    },

    /** 是否显示状态标签：异常必显示；已确认仅用户动过才显示 */
    showDocStatus(sec, item) {
      const st = this.docItemStatus(sec, item)
      if (st === 'pending' || st === 'missing') return true
      // confirmed：仅当用户确认/修改过（有覆盖记录）才显示
      const key = this.docOverrideKey(sec, item)
      return !!(this.docOverrides && this.docOverrides[key])
    },

    /** 计算同行联动影响（本期值→同比变化率；实物量→折标量） */
    computeImpacts(sec, row, col, oldVal, newVal) {
      const impacts = []
      const cols = sec.columns || []
      const toNum = v => {
        const x = Number(String(v == null ? '' : v).replace(/[,%＋+\s]/g, ''))
        return isNaN(x) ? null : x
      }
      const fmt = v => (v > 0 ? '+' : '') + v.toFixed(1) + '%'
      const oldNum = toNum(oldVal)
      const newNum = toNum(newVal)
      if (oldNum === null || newNum === null) return impacts

      // ① 本期值 → 同比变化率 = (本期 - 上年) / 上年
      if (/本期/.test(col)) {
        const prevCol = cols.find(c => /上年|上年同期/.test(c))
        const yoyCol = cols.find(c => /同比|变化率/.test(c))
        if (prevCol && yoyCol) {
          const prev = toNum(this.docCellValue(sec, row, prevCol, cols.indexOf(prevCol)))
          if (prev !== null && prev !== 0) {
            impacts.push({
              col: yoyCol,
              oldVal: fmt((oldNum - prev) / prev * 100),
              newVal: fmt((newNum - prev) / prev * 100)
            })
          }
        }
      }

      // ② 实物量/消费量 → 折标量 = 数值 × 折标系数
      if (/实物量|消费量|购进量/.test(col) && !/折标/.test(col)) {
        const coefCol = cols.find(c => /折标系数/.test(c) && !/参考/.test(c))
        const stdCol = cols.find(c => /折标量|折标煤|吨标准煤/.test(c))
        if (coefCol && stdCol) {
          const coef = toNum(this.docCellValue(sec, row, coefCol, cols.indexOf(coefCol)))
          if (coef !== null && coef > 0) {
            impacts.push({
              col: stdCol,
              oldVal: (oldNum * coef).toFixed(2),
              newVal: (newNum * coef).toFixed(2)
            })
          }
        }
      }

      return impacts
    },
    /** 依次调整：应用全部联动项 */
    applyImpacts() {
      const p = this._pendingImpacts
      if (!p || !p.impacts || !p.impacts.length) {
        this.$message.info('没有待应用的联动项')
        return
      }
      p.impacts.forEach(im => {
        this.updateDocCellValue(p.sec, p.row, im.col, im.newVal)
      })
      const cnt = p.impacts.length
      this._pendingImpacts = null
      this.wbMessages.push({
        role: 'agent',
        text: '✅ <b>已依次应用 ' + cnt + ' 项联动调整</b>：\n'
          + p.impacts.map((im, i) => '　' + (i + 1) + '. ' + im.col + ' → <b>' + im.newVal + '</b>').join('\n'),
        suggestions: ['下一项']
      })
      this.$nextTick(() => {
        const el = this.$refs.wbMsgs
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      })
    },
    /** 撤销本次修改 + 联动（回到编辑前的值） */
    cancelImpacts() {
      const last = this._lastEdit
      this._pendingImpacts = null
      if (!last) { this.$message.info('没有可撤销的修改'); return }
      const { sec, item, oldVal, col } = last
      if (col) {
        this.updateDocCellValue(sec, item, col, oldVal)
      } else {
        this.updateDocItemValue(sec, item, oldVal)
      }
      this._lastEdit = null
      this.wbMessages.push({
        role: 'agent',
        text: '↩ <b>已撤销本次修改</b>，恢复为 <b>' + (oldVal || '（空）') + '</b>（联动项未应用）',
        suggestions: []
      })
    },

    /** 保存后左侧反馈（旧值→新值 + 留痕 + 下一步） */
    pushEditFeedback(sec, item, oldVal, newVal, col) {
      const name = item.label || item.name || (sec.type === 'text' ? sec.title : '该项')
      const colLabel = col ? '·' + col : ''
      this._lastEdit = { sec, item, oldVal, col }
      // 联动提示：同行计算列（同比/变化率/折标量等）
      let linkTip = ''
      if (col) {
        const calcCols = (sec.columns || []).filter(c => /同比|变化率|折标|节能量|合计/.test(c) && c !== col)
        if (calcCols.length) {
          linkTip = '\n\n🔗 联动更新：<b>' + calcCols.slice(0, 3).join('、') + '</b> 已按新值重算'
        }
      }
      // 同行联动影响（本期值→同比；实物量→折标量）
      const impacts = col ? this.computeImpacts(sec, item, col, oldVal, newVal) : []
      this._pendingImpacts = impacts.length ? { sec, row: item, impacts } : null
      let impactText = ''
      if (impacts.length) {
        impactText = '\n\n📊 <b>受影响的数值（' + impacts.length + ' 项）</b>：\n'
          + impacts.map((im, i) => '　' + (i + 1) + '. ' + im.col + '：' + im.oldVal + ' → <b>' + im.newVal + '</b>').join('\n')
          + '\n\n请选择：[依次调整] 应用全部联动 / [撤销修改] 放弃本次修改'
      }
      this.wbMessages.push({
        role: 'agent',
        text: '✅ <b>已更新</b>：' + sec.no + '、' + sec.title + ' — <b>' + name + colLabel + '</b>\n'
          + '　<b>' + (oldVal || '（空）') + '</b> → <b>' + newVal + '</b>（人工修改）'
          + impactText,
        suggestions: impacts.length ? ['依次调整', '撤销修改'] : ['下一项', '撤回修改']
      })
      this.$nextTick(() => {
        const el = this.$refs.wbMsgs
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      })
    },
    /** 撤回上一次修改 */
    undoLastEdit() {
      const last = this._lastEdit
      if (!last) { this.$message.info('没有可撤回的修改'); return }
      const { sec, item, oldVal, col } = last
      if (col) {
        this.updateDocCellValue(sec, item, col, oldVal)
      } else {
        this.updateDocItemValue(sec, item, oldVal)
      }
      this._lastEdit = null
      this.wbMessages.push({
        role: 'agent',
        text: '↩ 已撤回上一次修改，恢复为 <b>' + (oldVal || '（空）') + '</b>',
        suggestions: []
      })
    },

    /** 判断单元格是否可编辑（仅数值列，排除单位/说明/同比/代码等） */
    isCellEditable(col) {
      if (!col) return false
      if (/单位|计量|说明|备注|同比|变化率|增减|代码|名称|指标/.test(col)) return false
      return true
    },
    /** 点击表格单元格：左侧引导 + 进入单元格编辑 */
    onDocCellClick(sec, row, col, ri, ci) {
      if (ci === 0) return   // 名称列不可编辑
      if (!this.isCellEditable(col)) return   // 非数值列不可编辑
      this.focusDocItem(sec, row)
      this.startCellEdit(sec, row, col, ri, ci)
    },
    /** 进入单元格编辑 */
    startCellEdit(sec, row, col, ri, ci) {
      this._editOldValue = String(this.docCellValue(sec, row, col, ci) || '')
      this.editingKey = sec.key + '-' + ri + '-' + ci
      const v = this.docCellValue(sec, row, col, ci)
      this.cellEditValue = (v === '—' || v === null || v === undefined) ? '' : String(v)
      this.$nextTick(() => {
        const ref = this.$refs['cell-' + sec.key + '-' + ri + '-' + ci]
        const el = Array.isArray(ref) ? ref[0] : ref
        if (!el) return
        if (el.focus) el.focus()
        else if (el.$refs && el.$refs.input) { el.$refs.input.focus(); el.$refs.input.select && el.$refs.input.select() }
      })
    },
    /** 单元格失焦保存（编辑即视为已确认） */
    finishCellEdit(sec, row, col) {
      if (!this.editingKey) return   // 已处理（防 blur + enter 双触发）
      const val = this.cellEditValue
      const oldVal = this._editOldValue
      this.editingKey = ''
      if (oldVal === val) return
      // 数值列校验：必须为数字（允许千分位逗号）
      if (this.isCellEditable(col) && /值|量|率|金额|系数|库存/.test(col)) {
        const num = Number(String(val).replace(/,/g, '').trim())
        if (val !== '' && isNaN(num)) {
          this.$message.warning('「' + col + '」需填写数值，已保留原值 ' + oldVal)
          this.wbMessages.push({
            role: 'agent',
            text: '⚠ <b>校验未通过</b>：「' + col + '」输入 <b>' + val + '</b> 不是有效数字。\n已保留原值 <b>' + oldVal + '</b>，请重新填写。',
            suggestions: []
          })
          return
        }
        // 偏差预警（与旧值相比超 ±100%）
        const oldNum = Number(String(oldVal).replace(/,/g, '').trim())
        if (!isNaN(oldNum) && oldNum !== 0) {
          const pct = ((num - oldNum) / Math.abs(oldNum)) * 100
          if (Math.abs(pct) > 100) {
            this.wbMessages.push({
              role: 'agent',
              text: '⚠ <b>偏差预警</b>：「' + col + '」由 <b>' + oldVal + '</b> 改为 <b>' + val + '</b>（' + (pct > 0 ? '+' : '') + pct.toFixed(1) + '%），差异较大，请确认是否误输入。',
              suggestions: ['撤回修改']
            })
          }
        }
      }
      this.updateDocCellValue(sec, row, col, val)
      this.pushEditFeedback(sec, row, oldVal, val, col)
    },
    /** 更新指定单元格（写覆盖层 + 行内 cells + 状态确认） */
    updateDocCellValue(sec, row, col, val) {
      const key = this.docOverrideKey(sec, row)
      const ov = Object.assign({}, this.docOverrides[key], { status: 'confirmed' })
      ov.cells = Object.assign({}, ov.cells || {}, { [col]: val })
      row.cells = Object.assign({}, row.cells || {}, { [col]: val })
      this.$set(this.docOverrides, key, ov)
      row.status = 'confirmed'
    },

    /** 点击字段：左侧引导 + 右侧进入行内编辑（两者并存） */
    onDocItemClick(sec, item, idx) {
      this.focusDocItem(sec, item)
      this.startInlineEdit(sec, item, idx)
    },
    /** 进入行内编辑 */
    startInlineEdit(sec, item, idx) {
      this._editOldValue = item.value
      this.editingKey = sec.key + '-' + idx
      this.$nextTick(() => {
        const ref = this.$refs['inline-' + sec.key + '-' + idx]
        const el = Array.isArray(ref) ? ref[0] : ref
        if (!el) return
        if (el.focus) el.focus()
        else if (el.$refs && el.$refs.input) el.$refs.input.focus()
        else if (el.$refs && el.$refs.textarea) el.$refs.textarea.focus()
      })
    },
    /** 失焦保存：写入覆盖层并标记已确认（编辑即视为已确认） */
    finishInlineEdit(sec, item) {
      if (!this.editingKey) return   // 已处理（防 blur + enter 双触发）
      const val = item.value
      const oldVal = this._editOldValue
      this.editingKey = ''
      if (oldVal === val) return
      this.updateDocItemValue(sec, item, val)
      this.pushEditFeedback(sec, item, oldVal, val)
    },

    focusDocItem(sec, item) {
      const isRow = sec.type === 'table'
      const isText = sec.type === 'text'
      const st = this.docItemStatus(sec, item)
      const meta = this.docStatusMeta[st] || { label: st }

      // 去重：同一项且值/状态未变 → 仅保留高亮
      const _fk = sec.key + '-' + (item.k || item.name || '')
      const _fv = String(isRow ? (item.name || '') : (item.value || ''))
      if (this._lastFocusKey === _fk && this._lastFocusValue === _fv && this._lastFocusStatus === st) {
        this.docFocus = { secKey: sec.key, itemKey: item.k }
        return
      }
      this._lastFocusKey = _fk
      this._lastFocusValue = _fv
      this._lastFocusStatus = st

      let name = ''
      let value = ''
      let src = ''
      let extra = ''
      let sugs = []
      let editTip = ''
      // 关联佐证材料（分层：精确 / 章节级）
      const matRes = this.getItemMaterials(sec, item)
      const mats = matRes.all
      let matText = ''
      if (mats.length) {
        matText = '<b>【佐证材料】</b>共 ' + mats.length + ' 份\n'
        if (matRes.exact.length) {
          matText += '　<b>精确关联（' + matRes.exact.length + '）</b>\n'
            + matRes.exact.slice(0, 3).map(m => '　　· 📎 ' + m.name + '（' + this.matStatusLabel(m.status) + '）').join('\n')
            + (matRes.exact.length > 3 ? '\n　　… 共 ' + matRes.exact.length + ' 份' : '') + '\n'
        }
        if (matRes.loose.length) {
          matText += '　<span style="color:#8c8c8c;">章节级材料（' + matRes.loose.length + '）</span>\n'
            + matRes.loose.slice(0, 3).map(m => '　　<span style="color:#8c8c8c;">· 📎 ' + m.name + '（' + this.matStatusLabel(m.status) + '）</span>').join('\n')
            + (matRes.loose.length > 3 ? '\n　　<span style="color:#8c8c8c;">… 共 ' + matRes.loose.length + ' 份</span>' : '') + '\n'
        }
      } else {
        matText = '<b>【佐证材料】</b>暂无关联材料（可点「上传凭证」补充）\n'
      }

      if (isRow) {
        /* ===== 表格：数值视角 ===== */
        name = item.name || '（表格行）'
        const cols = sec.columns || []
        value = cols.slice(1, 4).map((c, i) => c + '：' + this.docCellValue(sec, item, c, i + 1)).join(' ／ ')
        src = sec.fillLabel || '模板表'

        // 数值校验：本期 vs 上年差异
        const curCol = cols.find(c => /本期/.test(c))
        const prevCol = cols.find(c => /上年/.test(c))
        let chk = '数值格式 ✓'
        if (curCol && prevCol) {
          const cur = Number(String(this.docCellValue(sec, item, curCol, cols.indexOf(curCol))).replace(/,/g, ''))
          const prev = Number(String(this.docCellValue(sec, item, prevCol, cols.indexOf(prevCol))).replace(/,/g, ''))
          if (!isNaN(cur) && !isNaN(prev) && prev !== 0) {
            const pct = (cur - prev) / prev * 100
            chk += ' ／ 与上年差异 ' + (pct > 0 ? '+' : '') + pct.toFixed(1) + '%'
              + (Math.abs(pct) <= 20 ? '（合理区间 ±20%）' : '（⚠ 超出 ±20%，请复核）')
          }
        }
        // 联动预告
        let link = ''
        if (curCol) {
          const yoyCol = cols.find(c => /同比|变化率/.test(c))
          if (yoyCol) link = '修改「本期值」将重算「' + yoyCol + '」'
          const coefCol = cols.find(c => /折标系数/.test(c) && !/参考/.test(c))
          const stdCol = cols.find(c => /折标量|吨标准煤/.test(c))
          if (coefCol && stdCol) link += (link ? '；' : '') + '修改数量将重算「' + stdCol + '」'
        }
        extra = '<b>【校验】</b>' + chk + '\n'
          + (link ? '<b>【联动】</b>' + link + '\n' : '')
        sugs = mats.length ? ['查看材料', '上传凭证', '下一项'] : ['上传凭证', '下一项']
        editTip = '💡 可直接在右侧修改数值（单击即编辑，失焦自动保存），\n'
          + '　或在此输入：如「改为 8600」「上传凭证」。'
      } else if (isText) {
        /* ===== 正文：写作视角 ===== */
        name = item.label || sec.title
        const full = item.value || ''
        value = full.length > 60 ? full.slice(0, 60) + '…（共 ' + full.length + ' 字）' : full
        src = item.src || '规则引擎生成'

        // 要素核查（通用：按章节标题推断应有要素）
        const title = sec.title || ''
        let elems = []
        if (/基本情况|单位概况/.test(title)) elems = ['单位名称', '所属行业', '地理位置', '能源管理情况']
        else if (/能源消费/.test(title)) elems = ['能源消费总量', '主要能源品种', '同比变化', '变化原因']
        else if (/利用效率/.test(title)) elems = ['单位产品能耗', '对标情况', '改进措施']
        else if (/节能|措施/.test(title)) elems = ['已实施措施', '节能量', '投资额']
        else if (/碳排放/.test(title)) elems = ['排放总量', '排放结构', '核算方法']
        else elems = ['核心数据', '变化说明', '原因分析']
        extra = '<b>【要素核查】</b>应包含：' + elems.join(' / ') + '\n'
          + '　当前字数 ' + full.length + ' 字（建议 80~300 字）'
          + (full.length < 80 ? '，⚠ 内容偏短' : '') + '\n'
        sugs = ['润色表述', '下一个待确认']
        editTip = '💡 可直接在右侧编辑段落（单击即编辑，失焦自动保存），\n'
          + '　或在此输入调整要求：如「润色这段」「补充 xxx」「改为：xxx」。'
      } else {
        /* ===== 字段：键值对 ===== */
        name = item.label || '字段'
        value = item.value
        src = item.src || ''
        sugs = st === 'missing' ? ['上传材料', '下一个待确认'] : ['下一项', '上传材料']
        editTip = '💡 可直接在右侧修改（单击即编辑，失焦自动保存），\n'
          + '　或在此输入：如「改为 xxx」「上传材料」。'
      }

      this.docFocus = { secKey: sec.key, itemKey: item.k }
      const basis = sec.fillLabel || (this.activeTask && this.activeTask.templateLock && this.activeTask.templateLock.standard) || '模板规则'
      const isUserEdited = !!(this.docOverrides && this.docOverrides[this.docOverrideKey(sec, item)])

      // 已确认且用户未动过 → 极简（3 行）；异常或用户改过 → 完整
      let text
      if (st === 'confirmed' && !isUserEdited) {
        text = '<b>【定位】</b>' + sec.no + '、' + sec.title + ' — <b>' + name + '</b>\n'
          + '<b>【当前值】</b>' + value + '\n'
          + '<span style="color:#8c8c8c;font-size: 13px;">' + src + ' · ' + basis + ' · ✓ 已确认（AI 生成，未修改）</span>\n'
          + '<span style="color:#8c8c8c;font-size: 13px;">📎 佐证材料 ' + mats.length + ' 份' + (matRes.exact.length ? '（精确 ' + matRes.exact.length + ' · 章节 ' + matRes.loose.length + '）' : (mats.length ? '（' + mats.slice(0, 2).map(m => m.name).join('、') + (mats.length > 2 ? '…' : '') + '）' : '')) + '</span>\n\n'
          + editTip
      } else {
        text = '<b>【定位】</b>' + sec.no + '、' + sec.title + ' — <b>' + name + '</b>\n'
          + '<b>【当前值】</b>' + value + '\n'
          + '<b>【来源】</b>' + src + '\n'
          + '<b>【依据】</b>' + basis + '\n'
          + matText
          + extra
          + '<b>【状态】</b>' + meta.label + (isUserEdited ? '（人工修改）' : '') + '\n\n'
          + (st === 'missing'
            ? '⚠ 该项缺少数据。可直接在右侧填写，或上传凭证材料由我提取。'
            : editTip)
      }
      this.wbMessages.push({
        role: 'agent',
        text: text,
        suggestions: sugs
      })
      this.$nextTick(() => {
        const el = this.$refs.wbMsgs
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      })
    },
    // 确认单项（待确认 → 已确认）
    confirmDocItem(sec, item) {
      const st = this.docItemStatus(sec, item)
      if (st === 'missing') { this.$message.warning('该项缺少数据，请先补录数值或上传材料后再确认'); return false }
      if (st === 'confirmed') { this.$message.info('该项已确认'); return true }
      const key = this.docOverrideKey(sec, item)
      this.$set(this.docOverrides, key, Object.assign({}, this.docOverrides[key], { status: 'confirmed' }))
      item.status = 'confirmed'
      this.$message.success('已确认该项')
      return true
    },
    docOverrideKey(sec, item) {
      if (sec.type === 'table') return sec.key + '|' + (item.name || item.k)
      return 'body|' + item.k
    },
    // 更新某项的值（表格写 cells，正文写 value）
    updateDocItemValue(sec, item, val) {
      const key = this.docOverrideKey(sec, item)
      const ov = Object.assign({}, this.docOverrides[key], { status: 'confirmed' })
      if (sec.type === 'table') {
        const cols = sec.columns || []
        const col = cols.find(c => /本期|数值|值/.test(c) && !/上年|同比/.test(c)) || cols[1]
        ov.cells = Object.assign({}, ov.cells || {}, { [col]: val })
        item.cells = Object.assign({}, item.cells || {}, ov.cells)
      } else {
        ov.value = val
        item.value = val
      }
      this.$set(this.docOverrides, key, ov)
      item.status = 'confirmed'
    },
    // 全篇校验
    /** 恢复初始版本（清除全部手工修改，二次确认） */
    resetToInitial() {
      const editCount = Object.keys(this.docOverrides || {}).length
      if (!editCount) { this.$message.info('当前没有手工修改，无需恢复'); return }
      this.$confirm('将清除全部 <b>' + editCount + '</b> 处手工修改，恢复为模板生成的初始版本。是否继续？', '恢复初始版本', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确认恢复',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.docOverrides = {}
        this.editingKey = ''
        this._lastEdit = null
        this._pendingImpacts = null
        this._lastFocusKey = ''
        this._lastFocusValue = ''
        this._lastFocusStatus = ''
        this.wbMessages.push({
          role: 'agent',
          text: '↺ <b>已恢复初始版本</b>（清除 ' + editCount + ' 处手工修改），所有项回到模板生成状态。',
          suggestions: ['下一个待确认', '全篇校验']
        })
        this.$message.success('已恢复初始版本')
      }).catch(() => {})
    },
    /** 跨模块校验（综合能耗 vs 分项折标合计；碳排放 vs 消费量×因子） */
    checkCrossModule() {
      const issues = []
      const secs = this.docSections || []
      const tables = secs.filter(x => x.type === 'table')
      if (tables.length < 2) return issues

      // ① 综合能耗（表1）vs 各能源折标量合计（表2/表3）
      const t1 = tables[0]
      const totalRow = (t1.rows || []).find(r => /综合能耗|综合能源消费/.test(r.name || ''))
      if (totalRow) {
        const cols1 = t1.columns || []
        const curCol1 = cols1.find(c => /本期/.test(c)) || cols1[2]
        const declared = Number(String(this.docCellValue(t1, totalRow, curCol1, cols1.indexOf(curCol1))).replace(/,/g, ''))
        if (!isNaN(declared) && declared > 0) {
          // 汇总后续表格的折标量列
          let sum = 0
          let found = false
          tables.slice(1, 4).forEach(t => {
            const cols = t.columns || []
            const stdCol = cols.find(c => /折标量|吨标准煤/.test(c))
            if (!stdCol) return
            const ci = cols.indexOf(stdCol)
            ;(t.rows || []).forEach(r => {
              const v = Number(String(this.docCellValue(t, r, stdCol, ci)).replace(/,/g, ''))
              if (!isNaN(v)) { sum += v; found = true }
            })
          })
          if (found && sum > 0) {
            const diff = Math.abs(declared - sum) / declared
            if (diff > 0.05) {
              issues.push({
                title: '综合能耗与分项折标合计不一致',
                detail: '表1「综合能耗」本期值 ' + declared.toLocaleString() + ' 吨标准煤，'
                  + '分项折标合计 ' + sum.toFixed(2) + ' 吨标准煤，差异 ' + (diff * 100).toFixed(1) + '%（阈值 5%）'
              })
            }
          }
        }
      }
      return issues
    },
    docFullCheck() {
      const st = this.docStats
      const pending = []
      const missing = []
      ;(this.docSections || []).forEach(sec => {
        const items = sec.type === 'table' ? (sec.rows || []) : (sec.items || [])
        items.forEach(it => {
          const nm = it.name || it.label || '（正文）'
          if (it.status === 'pending') pending.push(sec.no + '、' + sec.title + ' — ' + nm)
          if (it.status === 'missing') missing.push(sec.no + '、' + sec.title + ' — ' + nm)
        })
      })
      // 跨模块校验（表间勾稽）
      const cross = this.checkCrossModule()
      let text = '<b>【全篇校验】</b>共 ' + st.total + ' 项：<b>' + st.confirmed + '</b> 项通过'
      if (pending.length) text += ' · <b>' + pending.length + '</b> 项待确认'
      if (missing.length) text += ' · <b>' + missing.length + '</b> 项待补录'
      if (cross.length) text += ' · <b>' + cross.length + '</b> 项跨模块异常'
      text += '。\n\n'
      if (cross.length) {
        text += '<b>🔗 跨模块校验（' + cross.length + ' 项异常）</b>\n'
          + cross.map(x => '• <b>' + x.title + '</b>\n　' + x.detail).join('\n') + '\n\n'
      }
      if (!pending.length && !missing.length && !cross.length) {
        text += '✅ 全部校验通过（格式合规 / 勾稽平衡 / 跨模块一致 / 完整性 ≥95% / DQR ≤ 3），可「生成定稿」并提交归档。'
      } else {
        if (missing.length) text += '<b>待补录（' + missing.length + '）</b>\n' + missing.map(x => '• ' + x).join('\n') + '\n\n'
        if (pending.length) text += '<b>待确认（' + pending.length + '）</b>\n' + pending.map(x => '• ' + x).join('\n') + '\n\n'
        text += '可「下一个待确认」逐项处理，或直接说「改为 8,600」更正数值。'
      }
      this.wbMessages.push({
        role: 'agent',
        text: text,
        suggestions: (pending.length || missing.length) ? ['下一个待确认', '修改该项'] : ['生成定稿']
      })
    },
    // 生成定稿（演示：标记进度）
    docFinalize() {
      const st = this.docStats
      if (st.confirmed < st.total) { this.$message.warning('仍有 ' + (st.total - st.confirmed) + ' 项未确认，无法生成定稿'); return }
      if (this.activeTask) {
        this.activeTask.progress = 100
        this.activeTask.genTime = new Date().toLocaleString('zh-CN')
      }
      this.docViewMode = 'preview'   // 生成定稿后自动切到预览与归档态
      this.$message.success('已生成定稿，可提交归档')
      this.wbMessages.push({
        role: 'agent',
        text: '<b>【生成】</b>报告定稿已生成，全篇 ' + st.total + ' 项数据均已确认。\n\n下一步可提交归档（内容指纹存证 + 回执登记）。',
        suggestions: ['提交归档']
      })
    },
    enterReport(report) {
      this.activeTaskId = report.id
      // 阶段号归一（同 buildStageGuide）：已归档 / 已提报 / 已受理任务的 stage 为 5（终态），
      // 直接赋值会让右侧无面板可渲染（白屏）——统一归一到阶段四只读态
      this.activeStage = Math.min(Math.max(parseInt(report.stage, 10) || 1, 1), 4)
      // 重置随任务会话的状态，避免跨任务串台：
      // 审核流 / 签发记录 / 验签结果 / AI 改写 / 预览异常态 / 各章节展开态均属"任务会话态"，
      // 若不重置，A 任务归档后进入 B 任务会直接显示 A 的签发凭据与审核进度。
      this.auditFlow = {
        self: { status: 'passed', by: '填报人（当前用户）', time: '09-16 09:40', comment: '数据已核对计量点归属' },
        dept: { status: 'passed', by: '部门负责人（当前用户）', time: '09-16 10:05', comment: '同意报送' },
        expert: { status: 'pending', by: '', time: '', comment: '' }
      }
      this.signRecord = null
      this.signVerify = null
      // 已归档任务：内存态 signRecord 已随刷新丢失，用任务上持久化的存证元信息还原签发凭据卡
      // （否则重进已归档报告看不到内容指纹，而凭据是归档可追溯性的关键凭证）
      if (report.fingerprint) {
        const meta = report.signMeta || {}
        this.signRecord = {
          fingerprint: report.fingerprint,
          signedAt: meta.signedAt || '',
          signer: meta.signer || '',
          algorithm: 'FNV-1a（双通道）· 前端内容指纹',
          approvalMode: meta.approvalMode || 'DIRECT_SIGN',
          approvalChain: [],
          audits: [],
          note: '（依据任务留痕还原：本期报告已签字归档，文件哈希锁定，修订入口已关闭）'
        }
      }
      this.aiNarratives = {}
      this.aiPolish = {}
      this.aiPolishCursor = -1
      this.adopted = {}
      this.regenNarratives = {}
      this.regenSeq = {}
      this.verifyExpanded = null
      this.collectOpen = {}
      this.narrOpen = {}
      this.canvasSecIndex = -1
      this.manualEdits = {}
      this.editChapter = -1
      this.selChapter = -1
      this.adaptDrawer = { visible: false, title: '', source: '', rows: [], idx: 0 }
      // 跨任务串味防护（补齐）：以下同为"任务会话态"，不重置会把 A 任务的选择/处置带到 B 任务
      this.variantOverride = null        // 人工指定的填报场景
      this.disposeFlows = {}             // 复合阻断处置归因（按章节号）
      this.disposeOpen = {}
      this.justCompleted = []            // 阶段二"刚补齐"消番标记
      this.chapterFilter = 'missing'     // 阶段二缺项过滤（默认只看待补录）
      this.verifyFilter = 'all'          // 校验明细过滤
      this.flashSecIndex = -1            // 定位闪烁游标
      this.wbShowAllHistory = false      // 左栏历史折叠展开态
      this.wbCmdOpen = false
      this.naOpen = false                // 免填说明条展开态
      this.profileExpand = {}            // 用能单位概况分组展开态
      this.traceVisible = false          // 关闭上一个任务遗留的弹窗
      this.materialVisible = false
      this.revisionOpen = false          // 修订留痕折叠态归位（默认收起）
      this.reportPreviewVisible = false
      // 异常卡片处置态归一化：note / resolved 必须显式存在，否则 v-model 与守卫判定拿不到响应式属性
      ;[this.stagePanels, this.nybgPanels].forEach(set => {
        Object.keys(set || {}).forEach(k => {
          const cards = (set[k] || {}).cards || []
          cards.forEach(card => {
            if (card.note === undefined) this.$set(card, 'note', '')
            if (card.resolved === undefined) this.$set(card, 'resolved', false)
          })
        })
      })
      // 进入任务时刷新支撑层数据：确保与模板库管理页的改动同步（版本漂移、依据校验依赖最新数据）
      this.templates = loadPlatformTemplates()
      // 初始化预览修订基准值（区分系统原值/干预后值）
      this.initPreviewMetrics()
      // 恢复历史填报值（collectedSnapshot → 面板字段），刷新/重进不丢
      this.$nextTick(() => { this.applyCollectedSnapshot() })
      // 若任务当前处于阶段二，直接推送采集清单与缺失项引导
      const initStage = Math.min(Math.max(parseInt(report.stage, 10) || 1, 1), 4)
      // 阶段四：buildEnterGuide → buildStageGuide(4) 返回的就是「归档助手」卡片本身，
      // 即阶段四唯一消息，不再额外叠加（避免两条雷同消息）
      this.wbMessages = [Object.assign(initStage === 2 ? this.buildCollectGuideMsg() : this.buildEnterGuide(report), { stage: initStage })]
      this.pageMode = 'active'
    },
    // ===== 各阶段智能引导语（进入任务 / 阶段流转 / 对话指令共用，与实际功能保持一致） =====
    // 结构统一为：本阶段做什么（含系统已自动完成的部分）→ 需要用户做什么 → 下一步
    buildStageGuide(n, taskName) {
      // 阶段号归一：已归档任务在任务对象上记为 stage 5（终态），而界面只有 1~4 阶段面板。
      // 不归一会出现两种故障：引导回落到阶段一（"已归档却显示模板匹配"）、右侧无面板可渲染（白屏）。
      const stage = Math.min(Math.max(parseInt(n, 10) || 1, 1), 4)
      // 阶段四：左栏只保留一张结构化协同卡片（归档助手）——不再产出"已进入阶段四…"的通用过渡引导，
      // 避免它与【归档助手 · 阶段四】并列成两条雷同消息（左右信噪比对称）
      if (stage === 4) return this.archiveAssistantMsg()
      const name = taskName || (this.activeTask ? this.activeTask.name : '')
      const s = this.checkSummary
      const guides = {
        1: () => {
          const cov = this.profileCoverage
          const v = this.activeVariant
          // 引导话术极简化（PRD 3.2）：仅 1~2 句，报表数量由模板元数据动态插值，研判结论上浮右侧主工作台，不做长文复读
          let text = '已根据企业档案自动匹配' + (v ? '「' + v.label + '」' : '') + '场景与 <b>' + this.collectRequired.length + ' 套适用报表</b>，场景路由与核算依据摘要见右侧主工作台。'
          text += '\n\n请核对右侧报表范围与主体标识信息，确认无误后进入数据采集。'
          if (cov && cov.missing) text += '\n\n概况尚有 <b>' + cov.missing + ' 项待补录</b>——已为你自动展开对应分组。'
          return {
            text,
            suggestions: ['查看模板结构预览', '查看编制依据', '直接进入数据采集']
          }
        },
        2: () => ({
          text: '已进入<b>阶段二 · 数据采集</b>。右侧是主操作区：待办问题已按章节列好，点击任意输入框，我会在<b>左侧对话</b>中给出该数据项的<b>出处依据</b>，可一键填入参考值；勾稽自洽、极端异动、精度合规等质量守卫在填报时<b>实时生效</b>，阻断问题在卡片内闭环处置。\n\n补齐进度是<b>按字段</b>判定的：章节头会显示「缺项 · 已填 X/Y 项」，未补齐的字段行标<b>「待补录」</b>，底部会列出还差哪几项——点字段名可直接定位并聚焦到该输入框。',
          suggestions: ['查看缺项填报要求', '上传材料补齐缺项']
        }),
        3: () => {
          const parts = []
          if (s.pendingCount) parts.push('<b>' + s.pendingCount + ' 项异常待处置</b>')
          if (s.awaitingCount) parts.push('<b>' + s.awaitingCount + ' 项数据偏差待人工确认说明</b>')
          const v = s.blocking
            ? '硬规则校验发现 ' + parts.join('、') + '（' + s.pass + '/' + s.total + ' 项通过）：待处置项请「确认处置」或「转人工核实」；已转人工项须由经办人<b>填写偏差合理解释并盖章</b>，处置完成后守卫自动放行文件产出。'
            : (s.confirmedCount
              ? '硬规则校验 ' + s.pass + '/' + s.total + ' 项通过，其中 ' + s.confirmedCount + ' 项偏差已人工确认并盖章（说明随报告附注归档）。'
              : '硬规则校验已通过（' + s.total + '/' + s.total + ' 项），无阻断异常。')
          return {
            text: '已进入<b>阶段三 · 生成与校验</b>。\n\n系统已按锁定编制依据完成换算与结论预计算（总量 / 占比 / 同比），AI 仅基于系统算好的数值受控生成叙述（数字经正则回查，不自行算数）。下方按报表章节展示将写入报告的内容，口径换算依据可展开核查。\n\n<b>校验与异常处置已并入本阶段</b>（面板顶部，无需切换）：' + v,
            suggestions: s.blocking ? ['查看异常处置建议', '转人工核实'] : ['介绍本阶段要做什么', '确认生成结果']
          }
        },
        // 阶段四不设通用引导条目：统一由 archiveAssistantMsg() 产出结构化协同卡片（见本方法顶部早返回）
      }
      const g = (guides[stage] || guides[1])()
      return { role: 'agent', text: g.text, suggestions: g.suggestions }
    },
    // 形式B：成稿校核式引导（结果先行，无阶段、无数据采集入口）
    buildDocGuide() {
      const t = this.activeTask || {}
      const st = this.docStats
      const tpl = (t.templateLock && t.templateLock.docName) || '附件2 模板'
      const secCount = (this.docSections || []).length
      const tableCount = (this.docSections || []).filter(x => x.type === 'table').length
      const bodyCount = secCount - tableCount
      const text = '<b>您好，我是小易！</b>「' + (t.name || '当前报告') + '」已按 <b>' + tpl + '</b> 生成完整报告，右侧可直接查看与核对（进度见顶部）。\n\n'
        + '<b>怎么用</b>：\n'
        + '• 点击右侧任一字段 / 表格行 —— 我说明它的取值来源与校验情况\n'
        + '• 说「<b>下一个待确认</b>」—— 我逐项定位，你确认或更正\n'
        + '• 说「<b>改为 8,600</b>」—— 直接更正该项并留痕\n\n'
        + '<b>编制依据</b>：' + ((t.templateLock && t.templateLock.standard) || '附件2 用能单位能源利用状况报告格式')
        + '；填报场景：' + (t.field || '工业') + '（' + bodyCount + ' 段正文 + ' + tableCount + ' 张附件表）。'
      const hasPending = (st.pending + st.missing) > 0
      return {
        role: 'agent',
        text: text,
        suggestions: hasPending ? ['下一个待确认', '全篇校验', '生成定稿'] : ['全篇校验', '生成定稿'],
        docMode: true
      }
    },
    // 进入任务的引导语（按任务所处阶段给出对应引导）
    buildEnterGuide(task) {
      if (task && task.detailMode === 'document') return this.buildDocGuide()
      return this.buildStageGuide(task.stage || 1, task.name)
    },
    // 阶段二引导文案（进入任务即处于阶段二时复用，与 gotoStage 保持一致）
    buildCollectGuideMsg() {
      return this.buildStageGuide(2)
    },
    exitWorkbench() {
      this.pageMode = 'home'
      this.activeTaskId = null
    },
    // 重置工作台对话：回到任务进入时的欢迎语（token随之清零）
    // 编排重置（整个任务）：清空填报 / AI 改写 / 签署与回执留痕，阶段回到 1，对话重新开始（不可撤销）
    resetWbChat() {
      const self = this
      const t = this.activeTask
      if (!t) return
      this.$confirm(
        '将把「' + t.name + '」的整个编排<b>重置至阶段一</b>：已填报数据、AI 改写、签署与回执留痕将全部清空，对话重新开始。此操作不可撤销，确定继续？',
        '重置任务编排',
        { confirmButtonText: '确认重置', cancelButtonText: '取消', type: 'warning', dangerouslyUseHTMLString: true }
      ).then(() => {
        // 1) 归档中心联动条目移除（该条目由本次编排归档产生，重置后不再有效）
        const removedNo = t.reportNo || ''
        if (removedNo) {
          try {
            const list = JSON.parse(localStorage.getItem('org_carbon_reports_v2') || '[]')
            localStorage.setItem('org_carbon_reports_v2', JSON.stringify(list.filter(x => x.reportNo !== removedNo)))
          } catch (e) { /* ignore */ }
        }
        // 2) 面板数据恢复至初始演示态（阶段二采集明细 / 阶段三生成与校验 / 阶段四修订指标与留痕 / 阶段一概况）
        const fresh = self.$options.data.call(self)
        self.activePanels = fresh.activePanels
        self.profileValues = fresh.profileValues
        // 3) AI 改写存储清理（按任务 id 分片）与派生状态归零
        const id = t.id
        try {
          const store = self.readAiStore()
          if (store[id]) { delete store[id]; localStorage.setItem(AI_POLISH_KEY, JSON.stringify(store)) }
        } catch (e) { /* ignore */ }
        self.aiNarratives = {}
        self.aiPolish = {}
        self.aiPolishCursor = -1
        self.regenNarratives = {}
        self.regenSeq = {}
        self.signRecord = null
        self.signVerify = null
        self.disposeFlows = {}
        self.disposeOpen = {}
        self.chapterFilter = 'missing'
        // 4) 任务对象：阶段 / 状态 / 进度回位，清空全部编排产物留痕字段
        self.$set(t, 'stage', 1)
        self.$set(t, 'status', '编制中')
        self.$set(t, 'progress', 30)
        self.$set(t, 'issues', [])
        ;['collectedSnapshot', 'fingerprint', 'signMeta', 'receiptNo', 'receiptTime', 'receiptAcceptedBy', 'receiptWay', 'receiptFiles', 'reportNo'].forEach(k => self.$delete(t, k))
        // 5) 阶段与对话回位
        self.activeStage = 1
        self.wbMessages = [self.isDocumentMode ? self.buildDocGuide() : Object.assign(self.buildStageGuide(1), { stage: 1 })]
        self.wbShowAllHistory = false
        self.$nextTick(() => { if (self.$refs.wbMsgs) self.$refs.wbMsgs.scrollTo({ top: 0, behavior: 'smooth' }) })
        self.$message.success('任务编排已重置至阶段一：填报数据与留痕已清空')
      }).catch(() => {})
    },
    // CTA 文案：按任务状态给出明确行动点
    // CTA 文案：由报告状态 + 提报子态 + 编制阶段共同决定（不再逐个比对状态字符串）
    ctaLabel(report) {
      const st = this.reportStatus(report)
      if (st === 'closed') return '查看归档'
      if (st === 'submitting') return this.isSubmitted(report) ? '登记受理' : '登记提报'
      const map = { 1: '开始提报', 2: '去补录', 3: '继续编排', 4: '确认归档' }
      return map[Math.min(Math.max(parseInt(report.stage, 10) || 1, 1), 4)] || '进入提报'
    },
    // CTA 动作分发：已闭环→存证底卷；待提报·受理→登记提报/登记受理；其余进入工作台
    ctaAction(report) {
      const st = this.reportStatus(report)
      if (st === 'closed') return this.openArchiveDrawer(report)
      if (st === 'submitting') return this.openSubmitReg(report, this.isSubmitted(report) ? 'acceptance' : 'submission')
      this.enterReport(report)
    },
    // 存证底卷轻量抽屉：由卡片指纹标签或「查看归档」唤起，按任务对象直读存证元信息
    openArchiveDrawer(report) {
      this.archiveDrawer.report = report
      this.archiveDrawer.visible = true
    },
    // 底卷内交付物下载：先载入任务编排上下文（导出载荷取自阶段三章节与签署信息），再走统一导出服务
    archiveDownload(report, format) {
      this.enterReport(report)
      this.$nextTick(() => this.onExport(format))
    },
    // 回执凭证附件在线预览（演示态：真实实现接材料溯源/档案中心预览服务）
    previewReceiptFile(name) {
      this.$message.info('正在打开「' + name + '」预览…')
    },
    // 提报闭环判定：仅「已闭环」（已受理）为闭环。
    // 注意：已提报（待受理）仍在提报环节，不可与闭环混用——历史上本方法把两者都算闭环，
    // 正是"同一状态两种归类"的根源（凭证透出按闭环、统计按待办）。
    isClosed(s) {
      const v = (s && typeof s === 'object') ? s.status : s
      return v === '已闭环' || v === '已受理'
    },
    // 类型选项的辅助说明：适用场景 + 支持的报送周期（下拉选项内展示）
    typeMeta(name) {
      const tpl = this.templates.find(x => x.reportType === name)
      if (!tpl) return ''
      const p = (tpl.periods && tpl.periods.length) ? tpl.periods.join(' / ') : '不限周期'
      return ((tpl.scopes && tpl.scopes[0]) ? tpl.scopes[0] + ' · ' : '') + '支持：' + p
    },
    // CTA 实底判断：编排推进是智能体主功能，实底强调；提报登记是人工辅助动作，描边弱化
    ctaSolid(report) {
      return this.reportStatus(report) === 'composing'
    },
    // CTA 临期强调：剩余 ≤ CTA_URGENT_DAYS 天时主操作按钮转紧急色。
    // 与 7 天红档标签形成两级递进：7 天红档＝提醒注意排期；3 天内＝该动手了（主操作转红）。
    ctaUrgent(report) {
      if (!this.ctaSolid(report)) return false
      const valid = !!report.deadline && !isNaN(new Date(report.deadline).getTime())
      if (!valid) return false
      return this.daysLeft(report.deadline) <= CTA_URGENT_DAYS
    },
    // CTA 按钮样式：临期转紧急色，常态实底用主题色；非实底（描边）不填色
    ctaStyle(report) {
      if (!this.ctaSolid(report)) return {}
      const color = this.ctaUrgent(report) ? URGENCY_CONFIG.CRITICAL.color : this.themeColor
      return { background: color, borderColor: color }
    },
    // 系统划分：回车添加
    addBndItem() {
      const v = (this.bndInput || '').trim()
      if (!v) return
      const panel = this.activePanels[1]
      if (panel.bndItems.includes(v)) {
        this.$message.info('该项已存在')
      } else {
        panel.bndItems.push(v)
      }
      this.bndInput = ''
    },
    // 阶段三章节级操作：采纳（写入修订留痕，不可重复采纳）与重新生成（按最新采集数据重算叙述，变体轮换）
    onAdoptChapter(ch) {
      const no = this.sectionNo(ch)
      if (this.adopted[no]) return
      this.$set(this.adopted, no, true)
      this.pushRevision('采纳章节内容：「' + ch.name + '」（' + ((ch.content && ch.content.narrative) || '').length + ' 字）', '人工')
      this.$message.success('已采纳「' + ch.name + '」内容，已写入修订留痕')
    },
    onRegenChapter(ch) {
      const no = this.sectionNo(ch)
      const seq = (this.regenSeq[no] || 0) + 1
      this.$set(this.regenSeq, no, seq)
      const base = BODY_DEMO[no] || (ch.content && ch.content.narrative) || ''
      this.$set(this.regenNarratives, no, (base + ' ' + REGEN_NOTES[(seq - 1) % REGEN_NOTES.length]).trim())
      this.pushRevision('重新生成章节叙述：「' + ch.name + '」（第 ' + seq + ' 次，按最新采集数据重算）', 'AI 重新生成')
      this.$message.success('「' + ch.name + '」叙述已按最新采集数据重新生成')
    },
    // 当前时间（MM-DD HH:mm），用于修订留痕
    nowStamp() {
      const d = new Date()
      const p = n => (n < 10 ? '0' + n : '' + n)
      return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
    },
    // 写入阶段五修订留痕（异常处置/移交均留痕，保证可追溯）
    pushRevision(text, by) {
      const panel = this.activePanels[4]
      if (!panel || !panel.revisions) return
      panel.revisions.unshift({ time: this.nowStamp(), text, by })
    },
    // 阶段三确认生成结果：校验已自动执行；有阻断异常则展开校验区要求先处置，无阻断异常则进入确认归档
    confirmGenerate() {
      const s = this.checkSummary
      if (s.blocking) {
        this.verifyExpanded = true
        this.wbMessages.push({
          role: 'agent',
          text: '<b>【阶段三 · 生成与校验】</b> 硬规则校验已自动执行：<b>' + s.pass + '/' + s.total + ' 项通过</b>，尚有 <b>' + s.blocking + ' 项未处置</b>'
            + (s.awaitingCount ? '（其中 ' + s.awaitingCount + ' 项数据偏差待人工确认说明）' : '')
            + '。\n\n' + s.summaryText + '\n\n校验区已在面板顶部展开：待处置项请「确认处置」或「转人工核实」；已转人工项需<b>填写偏差合理解释并盖章</b>后方可放行文件产出。',
          suggestions: ['查看异常处置建议', '转人工核实']
        })
      } else {
        // 校验通过 → 进入阶段四：统一走 gotoStage(4)，左栏只产生一条「归档助手」结构化卡片
        // （此前这里另推一条"已进入阶段四…"，与归档助手信息重复，已合并）
        this.gotoStage(4)
      }
      this.$nextTick(() => { if (this.$refs.wbMsgs) this.$refs.wbMsgs.scrollTo({ top: this.$refs.wbMsgs.scrollHeight, behavior: 'smooth' }) })
    },
    // 异常卡片：确认处置 → 移除卡片、同步重算校验项、写入留痕
    resolveCard(idx) {
      const panel = this.activePanels[3]
      const card = (panel.cards || [])[idx]
      if (!card) return
      panel.cards.splice(idx, 1)
      ;(panel.checks || []).forEach(c => { if (!c.pass) { c.pass = true; c.value = '已修正（重算通过）' } })
      this.pushRevision('异常卡片处置：' + card.title + '（确认处置，重算通过）', '人工')
      this.$message.success('已确认处置：重算通过并写入修订留痕')
      this.closeVerifyActions(card.id, '已确认处置')
    },
    // 异常卡片：转人工核实 → 卡片进入"待人工确认说明"态。
    // 注意：转人工不等于已处置，闸门仍保持阻断，必须由经办人填写偏差说明并盖章后方可放行
    escalateCard(idx) {
      const panel = this.activePanels[3]
      const card = (panel.cards || [])[idx]
      if (!card) return
      this.$set(card, 'escalated', true)
      this.$set(card, 'note', '')
      this.pushRevision('异常移交人工核实：' + card.title + '（待经办人填写偏差说明后放行）', '转人工')
      this.$message.warning('已转人工：请填写偏差合理解释并盖章，未确认前不放行文件产出')
      this.closeVerifyActions(card.id, '已转人工核实')
    },
    // 人工确认说明是否可提交（偏差说明需具备实质内容，避免空话式盖章）
    canConfirmNote(card) {
      return !!(card && card.note && String(card.note).trim().length >= 8)
    },
    // 确认说明并盖章：异常项盖上"已人工确认"戳记，闸门放行该项（说明随报告附注与修订留痕归档）
    confirmCardNote(idx) {
      const panel = this.activePanels[3]
      const card = (panel.cards || [])[idx]
      if (!card) return
      if (!this.canConfirmNote(card)) { this.$message.warning('请填写偏差合理解释（不少于 8 字）后再盖章'); return }
      const note = String(card.note).trim()
      this.$set(card, 'resolved', true)
      this.$set(card, 'stamp', { by: '张伟（经办人）', at: this.nowStamp() })
      this.pushRevision('异常人工确认并盖章：' + card.title + '（偏差说明：' + note + '）', '人工确认')
      this.$message.success('已盖「已人工确认」戳记，说明随报告附注归档；该项不再阻断放行')
      this.closeVerifyActions(card.id, '已人工确认')
    },
    // 退回重新采集补水：异常项不认可说明、需回前置环节补数——卡片退回待处置态并跳回阶段二
    sendBackForCollect(idx) {
      const panel = this.activePanels[3]
      const card = (panel.cards || [])[idx]
      if (!card) return
      this.$set(card, 'escalated', false)
      this.$set(card, 'resolved', false)
      this.$set(card, 'note', '')
      this.pushRevision('异常退回重新采集补水：' + card.title + '（已退回阶段二，补数后重跑校验）', '退回重采')
      this.$message.warning('已退回阶段二：请补齐该数据项后重跑校验')
      // 走 gotoStage：同步任务 stage、推送阶段引导并带 stage 标记
      //（直接给 activeStage 赋值会让左侧历史折叠裁切失效、任务阶段不同步）
      this.gotoStage(2)
    },
    // 异常卡片的其他处置方式（清单 #11：6 种）
    //  - 确认类（确认使用 / 确认正常）：等效确认处置，移除卡片并重算放行
    //  - 修正类（补充数据 / 修正报表 / 更新口径映射）：需回前置环节处理，卡片保留、继续阻断
    //  - 忽略类：必须填写原因，留痕后移除卡片
    onCardAction(idx, action) {
      const panel = this.activePanels[3]
      const card = (panel.cards || [])[idx]
      if (!card) return
      const hit = CARD_ACTIONS.find(a => a.key === action)
      if (!hit) return
      if (action === 'ignore') {
        this.$prompt('忽略属提示类处置，请填写原因（随报告一并归档）', '忽略异常', {
          inputPlaceholder: '如：该偏差属口径差异，已在报告口径说明中披露',
          inputValidator: v => (v && String(v).trim() ? true : '请填写原因')
        }).then(({ value }) => {
          panel.cards.splice(idx, 1)
          this.pushRevision('异常卡片忽略：' + card.title + '（原因：' + String(value).trim() + '）', '人工')
          this.$message.success('已忽略并留痕')
          this.closeVerifyActions(card.id, '已忽略并留痕')
        }).catch(() => {})
        return
      }
      if (hit.defer) {
        this.$set(card, 'handling', hit.label)
        this.pushRevision('异常卡片处置意向：' + card.title + '（' + hit.label + '，待前置环节处理后重跑）', '人工')
        this.$message.warning(hit.hint)
        return
      }
      panel.cards.splice(idx, 1)
      ;(panel.checks || []).forEach(c => { if (!c.pass) { c.pass = true; c.value = '已修正（重算通过）' } })
      this.pushRevision('异常卡片处置：' + card.title + '（' + hit.label + '，重算通过）', '人工')
      this.$message.success(hit.hint)
      this.closeVerifyActions(card.id, hit.label)
    },
    // 注：报送看板（部门 × 期次矩阵）及其单元格详情、状态元信息已整体移除——
    // 看板数据与报告列表不联动（期次体系对不上；登记提报时靠"取第一个待提报格"猜期次），
    // 提报状态统一由报告列表（3 个状态）表达。
    // 归档后进入提报队列：仅写入修订留痕（提报执行与政府回执由人工登记 / 后端 API-R06 对接）
    markEnterSubmitQueue() {
      const t = this.activeTask
      if (!t) return
      this.pushRevision('提报状态联动：' + t.dept + ' 任务「' + (t.name || '') + '」已归档，待人工提报', '系统')
    },
    // 进入任务时复位阶段四视图态（校验区展开态）。
    // 注：指标封存后不再有"系统原值 / 干预后值"之分，故原基准值初始化与例外标记一并移除。
    initPreviewMetrics() {
      this.verifyExpanded = null
    },
    // 注：阶段四不提供「就地修订指标 / 例外放行」——
    // 归档关口的职责是核验、签署、盖章与归档；报告数据必须保持一致，核心数值改动一律走 returnToStage 的逆向流程
    // （原 onPreviewRevise / markPreviewException 已移除；previewCheck 保留为定稿勾稽校验结论）。
    // 阶段四逆向流程：封存指标确需改动时，退回前置环节重新补录 / 重算。
    // 合规要求：归档关口不得就地改写核心数值（否则已生成文件、阶段二采集源、阶段三校验结论同时失效），
    // 改动必须走显式退回并留痕，前置校验结论随之重跑。
    returnToStage(n, label) {
      const to = n === 2 ? '阶段二 · 数据采集' : '阶段三 · 生成与校验'
      const why = n === 2
        ? '需回到采集环节重新补录原始数据，已完成的口径换算、校验结论与本次定稿版本将同步作废重跑。'
        : '需回到生成与校验环节按修正后的数据重新生成并重跑校验，本次定稿版本作废。'
      this.$confirm('退回后进入「' + to + '」：' + why + '退回动作会写入修订留痕，处理完成后需重新走确认归档。', label, {
        type: 'warning',
        confirmButtonText: '确认' + label,
        cancelButtonText: '取消'
      }).then(() => {
        this.pushRevision(label + '：定稿指标已封存，确需改动核心数值故退回前置环节重新处理', '人工')
        this.wbMessages.push({
          role: 'agent',
          text: '<b>【已退回 · ' + to + '】</b>报告退回前置环节重新处理：定稿版本与签发入口暂时关闭，' + why +
            '处理完成后请重新执行「确认生成结果」并核对封存指标。'
        })
        this.gotoStage(n)
      }).catch(() => {})
    },
    // 阶段四签字归档：不可逆节点，二次确认后锁定
    confirmArchive() {
      // 重复归档拦截：刷新后内存态 signRecord 会丢失，须以任务持久化状态兜底
      const cur = this.activeTask
      if (this.signRecord || (cur && this.reportStatus(cur) !== 'composing')) {
        this.$message.warning('本期报告已签字归档，文件已哈希锁定，不可重复归档')
        return
      }
      if (!this.archiveAllowed) {
        this.$message.warning('定稿勾稽校验未通过：报告数据必须保持一致，请先退回阶段三重新计算')
        return
      }
      this.$confirm('签字确认后，文件将进行防篡改哈希锁定并归档，修订入口同步关闭，且不可撤销。是否确认归档？', '确认签字归档', {
        confirmButtonText: '确认归档',
        cancelButtonText: '再检查一下',
        type: 'warning'
      }).then(() => {
        // 任务引用必须在回调首行取得：下方「写入报告与档案中心 / 回写报告编号」都要用它。
        // 原先在回调尾部才 `const t = ...`，形成 TDZ（ReferenceError 被 try/catch 静默吞掉），
        // 表现为"提示已归档成功、任务状态也变了，但档案中心没入库、报告编号丢失"的半失败。
        const t = this.activeTask
        // 签发（清单 #15）：对报告内容计算指纹并生成签名记录，作为归档的防篡改凭据
        const payload = this.buildExportPayload()
        this.signRecord = signReport(payload, {
          signer: this.approvalMode === 'DIRECT_SIGN'
            ? '当前登录用户（admin01）'
            : ((this.auditSummary.levels[this.auditSummary.levels.length - 1] || {}).by || '系统签发'),
          audits: this.approvalMode === 'DIRECT_SIGN'
            ? [{ name: '无需审批（直接签发）', by: '当前登录用户（admin01）', time: '', status: 'passed' }]
            : this.auditSummary.levels.map(l => ({ name: l.name, by: l.by, time: l.time, status: l.status }))
        })
        // Filing Package 审批链（V5.1 数据模型：ApprovalNode[] 向后兼容——DIRECT_SIGN 1 节点 / MULTI_LEVEL 3 节点）
        this.$set(this.signRecord, 'approvalMode', this.approvalMode)
        this.$set(this.signRecord, 'approvalLevel', this.approvalChainOf.level)
        this.$set(this.signRecord, 'approvalChain', this.approvalChainNodes.map(n => Object.assign({}, n, {
          status: 'APPROVED',
          signTimestamp: n.signTimestamp || this.signRecord.signedAt,
          signatureDigest: n.signatureDigest || this.signRecord.fingerprint
        })))
        this.signVerify = null
        this.pushRevision('签字确认并归档，文件哈希锁定（内容指纹 ' + this.signRecord.fingerprint + '）', '签字')
        this.$message.success('已签字确认，文件哈希锁定并归档')
        // 归档联动报告与档案中心：文件资产统一在报告与档案中心查看/下载（企业报告资产库），
        // 任务视角回看走编排详情——工作台不维护第二份报告列表
        try {
          const stored = localStorage.getItem('org_carbon_reports_v2')
          const list = stored ? JSON.parse(stored) : []
          const maxNo = list.reduce((m, r) => { const mt = /ECR-\d+-(\d+)/.exec(r.reportNo || ''); return mt ? Math.max(m, +mt[1]) : m }, 0)
          const newNo = 'ECR-2026-' + String(maxNo + 1).padStart(3, '0')
          const lock = t.templateLock || {}
          list.unshift({
            id: 'rs-' + Date.now(),
            reportNo: newNo,
            name: t.name,
            type: 'smart-report', typeLabel: t.type || '能源报送报告',
            subject: (this.activePanels[1] && this.activePanels[1].orgName) || '京能新能源电池制造有限公司',
            standard: lock.standard || (this.activeTemplate && this.activeTemplate.standard) || '—',
            period: t.period,
            totalEmission: '—', emissionUnit: '—',
            status: '已完成',
            sourceAgent: '能碳多源数据智慧报告智能体',
            createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
            summary: '按' + (lock.docName || (this.activeTemplate && this.activeTemplate.docName) || '锁定模板') + '（' + (lock.version || '') + '）渲染归档，内容指纹 ' + this.signRecord.fingerprint + '，哈希锁定防篡改。'
          })
          localStorage.setItem('org_carbon_reports_v2', JSON.stringify(list))
          // 回写报告编号：任务卡片「报告与档案中心 ↗」跳转时可定位到该条目
          if (t) this.$set(t, 'reportNo', newNo)
        } catch (e) {
          // 写库失败必须让用户知道：档案中心条目与报告编号缺失会影响后续提报与回执登记
          this.$message.error('归档写库失败：' + (e && e.message ? e.message : '未知错误') + '（请重试；若持续失败请联系管理员）')
        }
        // 归档回写任务状态：签字归档只是文件定稿，提报动作尚未发生——状态进入「待提报·受理」（待提报子态），
        // 人工在政府平台提交后于工作台任务卡片「登记提报」推进（真实对接时由后端回执驱动）；
        // 阶段号收敛为 4（终态不再借用越界的 stage=5）
        if (t) {
          this.$set(t, 'status', '待提报·受理')
          this.$set(t, 'submitted', false)
          this.$set(t, 'progress', 100)
          this.$set(t, 'stage', 4)
          this.$set(t, 'issues', [])
          // 存证元信息落任务对象（供卡片凭证透出与存证底卷抽屉直读）：
          // 指纹 + 签署人/签署时间 + 审批模式（DIRECT_SIGN 单节点 / MULTI_LEVEL 三节点链）
          this.$set(t, 'fingerprint', this.signRecord.fingerprint)
          this.$set(t, 'signMeta', { signer: this.signRecord.signer, signedAt: this.signRecord.signedAt, approvalMode: this.signRecord.approvalMode })
        }
        // 归档后进入提报队列（仅留痕）：提报执行与回执由人工登记 / 后端对接
        this.markEnterSubmitQueue()
        this.wbMessages.push({ role: 'agent', text: '<b>【阶段四 · 确认归档】</b> 报告已签字确认，文件完成<b>哈希锁定并归档</b>（内容指纹 <code>' + this.signRecord.fingerprint + '</code>），修订入口已关闭。任务状态为「待提报·受理」：在主管部门平台提交后，请在报告大厅任务卡片<b>登记提报</b>；下一期次将由报送排期自动滚动生成。' })
        this.$nextTick(() => { if (this.$refs.wbMsgs) this.$refs.wbMsgs.scrollTo({ top: this.$refs.wbMsgs.scrollHeight, behavior: 'smooth' }) })
      }).catch(e => {
        // 用户取消（'cancel' / 'close'）静默；真实异常必须暴露，不能吞掉归档失败
        if (e === 'cancel' || e === 'close') return
        this.$message.error('归档失败：' + (e && e.message ? e.message : '未知错误'))
      })
    },
    // 完整性校验（清单 #15）：重算内容指纹并与签发记录比对，检出签发后的任何改动
    verifySignature() {
      const rec = this.signRecord || {}
      // 历史期次指纹（生产迁移前的旧口径：未覆盖佐证材料清单，形如 64 位十六进制）：
      // 与本期「报告 + 佐证材料」口径不可直接比对——既不谎报"一致"，也不误报"疑似篡改"，
      // 如实说明口径差异并给出处置建议（重新签字归档以获得材料级防篡改校验）。
      if (this.isLegacyFingerprint(rec.fingerprint)) {
        this.signVerify = {
          ok: false,
          legacy: true,
          reason: '历史期次指纹按归档时口径固化（未覆盖佐证材料清单），与本期材料级口径不可直接比对；如需材料级防篡改校验，请对本期报告重新签字归档',
          current: rec.fingerprint
        }
        this.$message.warning('历史期次指纹：固化口径与本期不同，详见凭据说明')
        return
      }
      const r = verifyReport(this.buildExportPayload(), this.signRecord)
      this.signVerify = r
      if (r.ok) this.$message.success(r.reason)
      else this.$message.error(r.reason)
    },
    // 历史期次指纹判定：本期口径为 XXXX-XXXX-XXXX-XXXX，旧口径为 64 位十六进制
    isLegacyFingerprint(fp) {
      const s = String(fp || '')
      return !!s && !/^[0-9A-F]{4}(-[0-9A-F]{4}){3}$/i.test(s)
    },
    // 用能单位概况分组展开/收缩：默认收缩；存在待补录项的分组自动展开（便于直接看到需补内容）
    isProfileExpanded(key) {
      if (this.profileExpand[key] !== undefined) return this.profileExpand[key]
      return this.profileGroupHasMissing(key)
    },
    toggleProfileGroup(key) {
      this.$set(this.profileExpand, key, !this.isProfileExpanded(key))
    },
    // 分组是否存在待补录项（未填写的必填字段）
    profileGroupHasMissing(key) {
      if (key === 'economic') return this.profileEconomic.filled < this.profileEconomic.fields.length
      if (key === 'sign') return this.profileSign.filled < this.profileSign.fields.length
      const g = this.profileGroups.find(x => x.key === key)
      return g ? g.filled < g.fields.length : false
    },
    // 面板指令入口：关闭面板后走统一分发
    useCmd(text) {
      this.showCmdPanel = false
      this.runQuickCmd({ text })
    },
    // 指令分发
    runQuickCmd(cmd) {
      this.ensureConversation(cmd.text)
      this.messages.push({ role: 'user', text: cmd.text, time: '刚刚', type: 'text' })
      this.syncPanelByInput(cmd.text)
      // 新建临时报告：统一弹窗
      if (cmd.text.includes('新建')) {
        this.newReport = { name: '', type: '碳排放报告', dim: '月', rangeYear: '', rangeMonth: '', rangeDates: [], rangeWeek: '', remark: '', deadline: '', nameTouched: false, approval: defaultApproval() }
        this.newReportScene = ''
        this.newReportDialog = true
        this.messages.push({ role: 'agent', text: '已为你打开<b>新建临时报告</b>窗口：周期性报告由报送排期自动生成，临时报告填写后直接进入编排。', time: '刚刚', type: 'text' })
        this.scrollBottom()
        return
      }
      let reply = ''
      if (cmd.text.includes('进度') || cmd.text.includes('态势')) {
        reply = '本期应报 ' + this.briefStats.total + ' 份：编制中 ' + this.briefStats.composing + ' 份、待提报·受理 ' + this.briefStats.submitting + ' 份、已闭环 ' + this.briefStats.closed + ' 份。最紧迫：「' + (this.urgentList[0] ? this.urgentList[0].name : '无') + '」。已为你切换至「报送任务」。'
      } else if (cmd.text.includes('缺漏')) {
        const bad = this.dueReports.filter(r => (r.issues || []).length)
        reply = bad.length
          ? '核查结果：' + bad.map(r => '「' + r.name + '」' + r.issues.join('、')).join('；') + '。其余任务数据完整。'
          : '核查完成：本期所有任务数据完整，无缺漏。'
      } else if (cmd.text.includes('历史报告') || cmd.text.includes('归档报告')) {
        // 对话式查询报告与档案中心归档数据：只做问答摘要，列表与下载统一在报告与档案中心（不在此重复 UI）
        let list = []
        try { list = JSON.parse(localStorage.getItem('org_carbon_reports_v2')) || [] } catch (e) { list = [] }
        if (!list.length) {
          reply = '报告与档案中心暂无归档报告。完成报送任务的签字归档后，报告会自动登记至报告与档案中心。'
        } else {
          const done = list.filter(r => r.status === '已完成').length
          const pending = list.length - done
          const recent = list.slice(0, 3).map((r, i) => (i + 1) + '）<b>' + (r.name || '—') + '</b>（' + (r.period || '—') + ' · ' + (r.createdAt || '—') + '）').join('<br/>')
          reply = '报告与档案中心共归档 <b>' + list.length + '</b> 份报告（已完成 ' + done + (pending ? '、待审核 ' + pending : '') + '），最近归档：<br/>' + recent + '<br/><br/>完整列表、查看与下载请前往「报告与档案中心」；已归档任务卡片也有快捷跳转 ↗'
        }
      } else {
        reply = '我理解您的问题。可输入「汇总进度」「核查缺漏」「新建报告」，或通过右侧页签查看报送任务与报送排期。'
      }
      this.scrollBottom()
      setTimeout(() => {
        this.messages.push({ role: 'agent', text: reply, time: '刚刚', type: 'text' })
        this.scrollBottom()
      }, 400)
    },
    // 工作台任务指令面板入口
    useWbCmd(text) {
      this.wbCmdOpen = false
      this.wbInput = text
      this.sendWb()
    },
    // 阶段流转（动作栏/对话指令共用）：每个阶段推送与该阶段实际功能一致的智能引导语。
    // 阶段值同步回写任务，退出重进时按实际所处阶段定位（enterReport 读取 report.stage）。
    gotoStage(n) {
      // 同阶段重复点击：不重复推引导，仅滚动到最新对话
      if (n === this.activeStage) {
        this.$nextTick(() => { if (this.$refs.wbMsgs) this.$refs.wbMsgs.scrollTo({ top: this.$refs.wbMsgs.scrollHeight, behavior: 'smooth' }) })
        return
      }
      this.activeStage = n
      const t = this.activeTask
      if (t && t.stage !== n) this.$set(t, 'stage', n)
      // 引导消息带阶段标记：供左侧"历史折叠"裁切，保证左栏默认只呈现当前阶段内容
      this.wbMessages.push(Object.assign(this.buildStageGuide(n), { stage: n }))
      this.wbShowAllHistory = false
      this.$nextTick(() => { if (this.$refs.wbMsgs) this.$refs.wbMsgs.scrollTo({ top: this.$refs.wbMsgs.scrollHeight, behavior: 'smooth' }) })
      // 阶段三：进入即推送「校验溯源助手」，针对待处置异常在左栏给出协同动作（诊断 / 公差 / 采纳）
      if (n === 3) this.pushVerifyAssistant()
      // 阶段四不额外推送：buildStageGuide(4) 返回的就是「归档助手」卡片，避免两条雷同消息
    },
    // 阶段四「归档助手」：终审环节左栏唯一的协同卡片（文案单一来源，buildStageGuide(4) 直接复用）。
    // 内容结构：已完成什么 → 需要你确认什么 → 改数怎么走 → 前序对话已折叠；
    // 勾稽未通过时切换为失败态（说明原因 + 唯一出路），与面板的退回条保持一致口径。
    archiveAssistantMsg() {
      const t = this.activeTask || {}
      const s = this.checkSummary
      const p = this.previewCheck
      const check = s && s.total
        ? '已完成前置 <b>' + s.total + ' 项</b>硬规则校验（' + s.pass + '/' + s.total + ' 通过' +
          (s.confirmedCount ? '，其中 ' + s.confirmedCount + ' 项数据偏差已人工确认并盖章' : '') + '）'
        : '已完成前置校验'
      const failed = p.hasMetrics && !p.pass
      const bad = failed ? p.items.filter(i => !i.pass).map(i => i.name + ' 差 ' + i.diff).join('；') : ''
      const lines = [
        '<b>【归档助手 · 阶段四】</b>本期报告《' + (t.name || '—') + '》' + check +
          (failed
            ? '；但<b>定稿勾稽校验未通过</b>（' + bad + '），须退回前置环节重新处理后方可归档。'
            : '，无未处置异常，已形成正式待审版本。'),
        failed
          ? '请在面板内「定稿勾稽校验未通过」提示条点击「退回阶段三重新计算」（或「退回阶段二重新补录」），处理完成后重新走校验与确认归档——报告数据必须保持一致，不支持例外放行。'
          : '请复核右侧<b>签发身份（当前登录用户 admin01）与内容指纹</b>，确认后点击「签字确认并归档」完成法定盖章与报送备案。'
      ]
      if (!failed) lines.push('· 归档关口不提供就地改写（数据一致性已由前置勾稽校验锁定）；确需改动核心数值，直接对我说「退回阶段三重新计算」或「退回阶段二重新补录」即可。')
      lines.push('· 前序阶段（数据采集 / 生成与校验）的过程对话已折叠，可点顶部折叠条随时回看。')
      return {
        role: 'agent',
        stage: 4,
        text: lines.join('\n'),
        suggestions: failed ? ['退回阶段三重新计算', '查看修订留痕'] : ['查看修订留痕', '签字确认并归档']
      }
    },
    // 校验溯源助手：把右侧异常卡片转成左栏可点选的协同动作（偏差成因诊断 / 历史同期公差 / 一键采纳说明）
    pushVerifyAssistant() {
      const panel = this.activePanels[3] || {}
      const cards = (panel.cards || []).filter(c => !c.escalated)
      if (!cards.length) return
      const card = cards[0]
      const lines = ['<b>【校验溯源助手】</b>硬规则校验发现 <b>' + cards.length + ' 项</b>异常待处置，首项：<b>' + card.title + '</b>。', card.desc]
      if (card.suggest) lines.push('· AI 建议：' + card.suggest)
      // 动作按钮绑定卡片稳定 id（而非数组索引：卡片处置后索引前移会让历史消息的按钮失效或错打）
      lines.push('可点选：' + this.verifyActionsHtml(card.id))
      // 注意：仅阶段引导消息带 stage 标记（历史折叠以它为裁切基准），助手/派生消息不打标记
      this.wbMessages.push({ role: 'agent', text: lines.join('\n') })
    },
    // 校验溯源助手动作按钮组（data-card-id 为稳定标识，处置后按 id 精确收敛按钮）
    verifyActionsHtml(cardId) {
      const acts = [['diag', 'el-icon-search', '偏差成因诊断'], ['tolerance', 'el-icon-data-line', '查看历史同期公差'], ['adopt', 'el-icon-check', '一键采纳说明']]
      return acts.map(a => '<span class="wb-clue-fill" data-card-act="' + a[0] + '" data-card-id="' + cardId + '"><i class="' + a[1] + '"></i>' + a[2] + '</span>').join(' ')
    },
    // 卡片处置后收敛该消息的动作按钮：不留"点了没反应"的哑按钮（同时防止误删已盖章的人工确认留痕）
    // el 为兼容参数：旧版消息按钮只带索引（无稳定 id），卡片已清空时直接就地收敛被点击的按钮组，保证点击必有可见反馈
    closeVerifyActions(cardId, tip, el) {
      const doneHtml = '<span class="wb-clue-done"><i class="el-icon-circle-check"></i> ' + (tip || '该项已处置') + '，校验已重算通过</span>'
      if (cardId) {
        const html = this.verifyActionsHtml(cardId)
        this.wbMessages.forEach(m => {
          if (m.role !== 'agent' || !m.text || m.text.indexOf(html) === -1) return
          m.text = m.text.replace(html, doneHtml)
        })
        return
      }
      if (!el || !el.parentNode) return
      const wrap = el.parentNode
      Array.prototype.slice.call(wrap.querySelectorAll('.wb-clue-fill[data-card-act]')).forEach(n => n.remove())
      const span = document.createElement('span')
      span.className = 'wb-clue-done'
      span.innerHTML = '<i class="el-icon-circle-check"></i> ' + (tip || '该项已处置') + '，校验已重算通过'
      wrap.appendChild(span)
    },
    // 正文数值分段：把叙述拆成「纯文本 + 换算数值」两类片段。
    // 仅当数值能在换算项池的适配值中命中时才渲染为可点击轻量标签——正文里只有"有底卷可查"的指标带下划线，
    // 避免满屏可点造成噪声。命中时记录来源表，点击即穿透到该表的换算依据。
    narrativeSegments(ch) {
      const text = (ch && ch.content && ch.content.narrative) || ''
      if (!text) return []
      const own = (ch && ch.adapts) || []
      const pool = own.length
        ? own.map(r => ({ row: r, src: ch.name }))
        : this.adaptPool
      if (!pool.length) return [{ text }]
      const segs = []
      const re = /\d[\d,]*(?:\.\d+)?%?/g
      let last = 0
      let m = re.exec(text)
      while (m) {
        if (m.index > last) segs.push({ text: text.slice(last, m.index) })
        const raw = m[0]
        const num = raw.replace(/,/g, '').replace(/%$/, '')
        let hit = -1
        if (num.length >= 3) {
          // 先精确匹配适配值；未命中再退化为整数位匹配（容忍四舍五入/位数截断，如 3,477.2 与 3,477.3 tce）
          const intPart = num.split('.')[0]
          const match = (needle) => pool.findIndex(p => String(p.row.to || '').replace(/,/g, '').indexOf(needle) > -1)
          hit = match(num)
          if (hit < 0 && intPart.length >= 4) hit = match(intPart)
        }
        segs.push(hit > -1 ? { text: raw, idx: hit, src: pool[hit].src } : { text: raw })
        last = m.index + raw.length
        m = re.exec(text)
      }
      if (last < text.length) segs.push({ text: text.slice(last) })
      return segs
    },
    // 打开口径换算依据抽屉（章节入口）：展示本章换算项；本章无换算项时给出明确说明
    openAdaptDrawer(ch, idx) {
      if (!ch) return
      const rows = ch.adapts || []
      if (!rows.length) { this.$message.info('本章节无换算推演，数值直接引用采集数据'); return }
      this.adaptDrawer.title = ch.name
      this.adaptDrawer.source = ch.name
      this.adaptDrawer.rows = rows
      this.adaptDrawer.idx = Math.min(Math.max(idx || 0, 0), rows.length - 1)
      this.adaptDrawer.visible = true
    },
    // 本章叙述引用了哪些报表的换算项（脚注入口与提示文案共用）
    narrativeAdaptRefs(ch) {
      const srcs = []
      this.narrativeSegments(ch).forEach(s => {
        if (s.idx !== undefined && s.src && srcs.indexOf(s.src) < 0) srcs.push(s.src)
      })
      return srcs
    },
    // 从章节脚注一次性展开本章引用的全部换算项（跨报表聚合）
    openNarrativeAdapts(ch) {
      const srcs = this.narrativeAdaptRefs(ch)
      const rows = []
      srcs.forEach(n => {
        const c = this.stageChapters.find(x => x.name === n)
        if (c) rows.push.apply(rows, c.adapts || [])
      })
      if (!rows.length) { this.$message.info('本章节无换算推演，数值直接引用采集数据'); return }
      this.adaptDrawer.title = (ch && ch.name) || ''
      this.adaptDrawer.source = srcs.join('、')
      this.adaptDrawer.rows = rows
      this.adaptDrawer.idx = 0
      this.adaptDrawer.visible = true
    },
    // 打开口径换算依据抽屉（正文数值锚点）：穿透到该数值所属报表的换算依据，并保留当前阅读章节作为上下文
    openAdaptDrawerForSeg(ch, seg) {
      if (!seg || seg.idx === undefined) return
      const src = seg.src || (ch && ch.name) || ''
      const srcChapter = this.stageChapters.find(c => c.name === src)
      const rows = (srcChapter && srcChapter.adapts) || (ch && ch.adapts) || []
      if (!rows.length) return
      this.adaptDrawer.title = (ch && ch.name) || ''
      this.adaptDrawer.source = src
      this.adaptDrawer.rows = rows
      this.adaptDrawer.idx = Math.min(seg.idx, rows.length - 1)
      this.adaptDrawer.visible = true
    },
    // ===== 正文就地编辑（阶段 C）：允许人工修改，但必须留修订记录；数值变更需填口径说明后方可保存 =====
    // 进入就地编辑态（锁定态下不进入）
    startEditChapter(chi) {
      if (this.canvasLocked) return
      this.editChapter = chi
      this.$nextTick(() => {
        const el = document.getElementById('rwb-narr-' + chi)
        if (el) {
          el.focus()
          // 光标落到段末，避免点击后定位错乱
          const r = document.createRange()
          r.selectNodeContents(el)
          r.collapse(false)
          const sel = window.getSelection()
          sel.removeAllRanges()
          sel.addRange(r)
        }
      })
    },
    // 保存就地编辑：先做数值一致性比对——数值被改动时必须填写口径说明（阻断前置，非事后提示）
    saveChapterEdit(chi) {
      if (this.editChapter !== chi) return
      const el = document.getElementById('rwb-narr-' + chi)
      const text = el ? String(el.innerText || '').trim() : ''
      const base = (this.aiNarratives[chi] !== undefined
        ? this.aiNarratives[chi]
        : ((this.stageBodyChapters[chi] || {}).content || {}).narrative) || ''
      if (!text) { this.$message.warning('正文不能为空，已保留原文'); this.restoreNarrDom(chi); return }
      if (text === String(base).trim()) { this.editChapter = -1; return }
      const numsOf = s => String(s).match(/\d[\d,]*(?:\.\d+)?/g) || []
      const changed = numsOf(text).join('|') !== numsOf(base).join('|')
      if (!changed) { this.commitChapterEdit(chi, text, '', false); return }
      const self = this
      this.$prompt('检测到正文数值与底层附表核算不一致。请填写口径说明（将写入修订留痕与报告附注，并标记该章数值待复核）。', '数值变更需说明', {
        inputPlaceholder: '如：该数值为定性补充口径（含在建产线），非核算口径，附表口径不变',
        inputValidator: v => (v && String(v).trim().length >= 8 ? true : '请填写不少于 8 字的口径说明'),
        confirmButtonText: '确认变更并留痕',
        cancelButtonText: '取消并还原'
      }).then(({ value }) => {
        self.commitChapterEdit(chi, text, String(value).trim(), true)
      }).catch(() => {
        self.restoreNarrDom(chi)
        self.$message.info('已取消数值变更，正文还原')
      })
    },
    // 写入人工修订记录（text/说明/数值标记/修订人/时间）+ 修订留痕
    commitChapterEdit(chi, text, note, numberChanged) {
      this.$set(this.manualEdits, chi, { text, note, numberChanged, by: '张伟（经办人）', at: this.nowStamp() })
      const name = (this.stageBodyChapters[chi] || {}).name || ('第 ' + (chi + 1) + ' 章')
      this.pushRevision('正文就地修订：' + name + '（' + (numberChanged ? '含数值变更，口径说明：' + note + '，该章数值标记待复核' : '仅表述修订，数值未变') + '）', '人工修订')
      this.editChapter = -1
      this.$message.success(numberChanged ? '已保存并留痕；该章数值已标记待复核' : '已保存人工修订并留痕')
    },
    // 撤销人工修订：回到 AI 初始/系统生成版本
    revertChapterEdit(chi) {
      if (this.manualEdits[chi] === undefined) { this.$message.info('该章无人工修订'); return }
      const name = (this.stageBodyChapters[chi] || {}).name || ('第 ' + (chi + 1) + ' 章')
      this.$delete(this.manualEdits, chi)
      this.pushRevision('撤销正文人工修订：' + name + '（回到 AI 初始生成版本）', '撤销修订')
      this.$message.info('已撤销人工修订')
    },
    // 取消/还原：把 DOM 文本恢复到当前生效文本
    restoreNarrDom(chi) {
      const el = document.getElementById('rwb-narr-' + chi)
      if (!el) return
      const manual = this.manualEdits[chi]
      const text = manual ? manual.text : (this.aiNarratives[chi] !== undefined
        ? this.aiNarratives[chi]
        : ((this.stageBodyChapters[chi] || {}).content || {}).narrative)
      el.innerText = text || ''
      this.editChapter = -1
    },
    // 数值胶囊点击：编辑态下不打开底卷抽屉（避免与打字冲突），仅查看态可穿透
    isPenetratable(row, colName, colIndex) {
      const val = this.sectionRowValue(row, colName, colIndex)
      if (val === null || val === undefined || val === '' || val === '—') return false
      return /\d/.test(String(val)) || colIndex === 0
    },
    hasRefFields(ch) {
      return (ch.fields || []).some(f => !String(f.value || '').trim() && f.ref && f.ref !== '—')
    },
    quickFillRef(ch, f) {
      if (!f.ref || f.ref === '—') return
      const numMatch = /(\d+(\.\d+)?)/.exec(f.ref)
      const val = numMatch ? numMatch[1] : f.ref
      this.$set(f, 'value', val)
      this.refreshItemStatus(ch)
      this.$message.success('已自动引用上期基准值：' + val)
    },
    batchFillChapterRefs(ch) {
      let count = 0
      ;(ch.fields || []).forEach(f => {
        if (!String(f.value || '').trim() && f.ref && f.ref !== '—') {
          const numMatch = /(\d+(\.\d+)?)/.exec(f.ref)
          const val = numMatch ? numMatch[1] : f.ref
          this.$set(f, 'value', val)
          count++
        }
      })
      if (count > 0) {
        this.refreshItemStatus(ch)
        this.$message.success('已自动引用上期基准补全本表 ' + count + ' 项数据！')
      }
    },
    onTableCellClick(row, colName, colIndex, chapter) {
      if (!this.isPenetratable(row, colName, colIndex)) return
      const val = this.sectionRowValue(row, colName, colIndex)
      let itemName = ''
      if (typeof row === 'string') {
        itemName = row
      } else if (Array.isArray(row)) {
        itemName = row[0] || '核算项目'
      } else if (row && row.name) {
        itemName = row.name
      } else if (row && row.cells) {
        itemName = Object.values(row.cells)[0] || '核算指标'
      }
      const chapterName = (chapter && chapter.name) || '附表报表'
      this.penetrateDrawer.data = this.buildPenetrationData(itemName, colName, val, chapterName)
      this.penetrateDrawer.visible = true
    },
    buildPenetrationData(itemName, colName, val, chapterName) {
      const itemStr = String(itemName)
      let rawSource = {
        device: '1#配电房 10kV 进线总电表',
        rawValue: '2,140.0 万kWh',
        sourceSystem: 'SCADA 能耗在线遥测采集系统',
        timestamp: '2026-03-31 23:59:59',
        rawReceiptNo: 'MTR-ELEC-202603-09412',
      }
      let formula = '报告呈现值 = 原始抄表底数 × 任务法定折算系数'
      let ruleName = '电网用电折标/碳排核算'
      let factorName = '全国电网平均排放因子 0.6096 kgCO₂/kWh'
      let standardDoc = '生态环境部2025年第3号公告 / GB/T 32150'

      if (itemStr.indexOf('气') > -1 || itemStr.indexOf('天然气') > -1) {
        rawSource = {
          device: '厂区天然气进气调压计量站流量计',
          rawValue: '46.2 万Nm³',
          sourceSystem: '燃气管网流量计遥测 + 月度财务结算发票',
          timestamp: '2026-03-31 18:00:00',
          rawReceiptNo: 'GAS-INV-202603-88410',
          }
        formula = '碳排放量 = 天然气消耗量 × 21.622 tCO₂/万Nm³'
        ruleName = '化石燃料燃烧碳排放折算'
        factorName = '天然气折算系数 13.300 tce/万Nm³ · 21.622 tCO₂/万Nm³'
        standardDoc = '重点行业企业温室气体排放核算方法与报告指南'
      } else if (itemStr.indexOf('柴油') > -1) {
        rawSource = {
          device: '厂内应急发电机油库称重地磅',
          rawValue: '38.5 吨',
          sourceSystem: 'ERP 供应链物料出入库领料台账',
          timestamp: '2026-03-25 14:30:20',
          rawReceiptNo: 'ERP-MAT-202603-3310',
          }
        formula = '折标量 = 消耗量(t) × 1.4571 tce/t'
        ruleName = '柴油折标煤核算'
        factorName = '柴油折标系数 1.4571 tce/t'
        standardDoc = 'GB/T 2589 综合能耗计算通则'
      } else if (itemStr.indexOf('热') > -1 || itemStr.indexOf('热力') > -1) {
        rawSource = {
          device: '蒸汽/热水外购管网超声波热量计',
          rawValue: '5,180 百万千焦',
          sourceSystem: '供热管网仪表远传监测底座',
          timestamp: '2026-03-31 23:59:59',
          rawReceiptNo: 'THM-MTR-202603-1029',
          }
        formula = '排放量 = 购入热力 × 0.11 tCO₂/GJ'
        ruleName = '外购热力折标与间接排放'
        factorName = '热力折标系数 0.0341 tce/GJ · 0.11 tCO₂/GJ'
        standardDoc = '省级应对气候变化核算指南'
      } else if (itemStr.indexOf('产') > -1 || itemStr.indexOf('产量') > -1 || itemStr.indexOf('电芯') > -1) {
        rawSource = {
          device: 'MES 制造执行系统 · 成品打包入库质检线',
          rawValue: '12,860 万只',
          sourceSystem: '企业生产调度与MES物料数据池',
          timestamp: '2026-03-31 22:00:00',
          rawReceiptNo: 'MES-FIN-202603-5591',
          }
        formula = '单位产品综合能耗 = 综合能源消费量 ÷ 合格产品产量'
        ruleName = '产品综合单耗强度核算'
        factorName = 'MES 产品合格产量基准'
        standardDoc = '重点用能单位能耗计量与审计规范'
      } else if (itemStr.indexOf('总量') > -1 || itemStr.indexOf('综合') > -1 || itemStr.indexOf('合计') > -1) {
        rawSource = {
          device: '全厂各分项计量表具底层归集汇流',
          rawValue: '分项原始总加',
          sourceSystem: '统一能效与碳核算基础数据底座池',
          timestamp: '2026-03-31 23:59:59',
          rawReceiptNo: 'POOL-AGG-202603-0001',
          }
        formula = '汇总 = 各能源分项按口径折算之和'
        ruleName = '能耗综合折标/碳排放总量汇算'
        factorName = '多能源品种加权汇总'
        standardDoc = '国家温室气体与综合能耗核算通则'
      }

      return {
        itemName: itemName,
        colName: colName,
        reportValue: String(val) + ((colName && colName.indexOf('率') > -1 && String(val).indexOf('%') < 0) ? '%' : ''),
        chapterName: chapterName,
        ruleName: ruleName,
        formula: formula,
        factorName: factorName,
        standardDoc: standardDoc,
        rawSource: rawSource
      }
    },
    onNumClick(ch, seg, chi) {
      if (this.editChapter === chi) return
      this.openAdaptDrawerForSeg(ch, seg)
    },
    // 段落选区感知：有非空选区时浮出微调胶囊（仅未锁定态）
    onCanvasMouseUp(chi) {
      if (this.canvasLocked) return
      const sel = window.getSelection()
      if (sel && !sel.isCollapsed && String(sel).trim()) this.selChapter = chi
    },
    // 目录质检索引：把该章的质检状态映射为目录上的状态点（只做提示与跳转，处置唯一权威位在顶部校验区）
    tocSecState(ch) {
      const cards = (this.activePanels[3] || {}).cards || []
      const hit = cards.filter(c => (c.sec || '') && (c.sec === ch.name || ch.name.indexOf(c.sec) > -1 || c.sec.indexOf(ch.name) > -1))
      if (!hit.length) return { cls: 'el-icon-circle-check is-ok', title: '本章无质检异常', badge: '', badgeCls: '' }
      if (hit.some(c => !c.escalated && !c.resolved)) return { cls: 'el-icon-warning is-block', title: '本章存在待处置异常', badge: '待处置', badgeCls: 'is-block' }
      if (hit.some(c => c.escalated && !c.resolved)) return { cls: 'el-icon-warning is-warn', title: '本章存在待人工确认说明的偏差', badge: '待确认', badgeCls: 'is-warn' }
      return { cls: 'el-icon-circle-check is-ok', title: '本章偏差已人工确认', badge: '已确认', badgeCls: 'is-ok' }
    },
    // 目录 → 画布定位：平滑滚动到目标章节并高亮（复用同一套高亮语义）
    scrollCanvasTo(idx) {
      const el = document.getElementById('rwb-sec-' + idx)
      this.canvasSecIndex = idx
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setTimeout(() => { if (this.canvasSecIndex === idx) this.canvasSecIndex = -1 }, 2600)
    },
    // 附表查阅：附表是宽表型数据，走定稿版式弹窗（宽视口 + 独立横向滚动）
    openAnnexInPreview(a) {
      this.locateReportSection(a.name, a.name)
    },
    // 目录底部守卫入口：把视线送回顶部校验区（异常处置的唯一权威位）
    focusVerifyZone() {
      this.verifyExpanded = true
      this.$nextTick(() => {
        const z = this.$el.querySelector('.rwb-verify-zone')
        if (z) z.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    },
    // 主屏 → 定稿通读视图就地穿透：直接打开预览弹窗并传入本章索引（复用 flashSecIndex 高亮机制），
    // 不做正文匹配——本节内容必然在定稿视图中，定位到该章即可，操作链路最短
    viewChapterInPreview(ch) {
      const chapters = (this.reportPreview && this.reportPreview.chapters) || []
      const idx = chapters.findIndex(c => c.name === ch.name)
      if (idx < 0) { this.$message.info('定稿视图中未找到「' + ch.name + '」'); return }
      this.flashSecIndex = idx
      this.openReportPreview()
      let tries = 0
      const locate = () => {
        const el = document.getElementById('rp-sec-' + idx)
        if (!el) { if (tries++ < 30) setTimeout(locate, 200); return }
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      setTimeout(locate, 200)
      // 弹窗渲染较重，高亮窗口留足余量（保证滚动到位后仍能看见高亮）
      setTimeout(() => { this.flashSecIndex = -1 }, 6000)
    },
    // 异常项快捷锚点：优先在阶段三正文中就地平滑滚动并高亮对应章节；
    // 附件报表（如"表2"）不在正文列表内，则自动打开「整篇预览」并定位到该表——两级命中保证锚点始终可达
    locateReportSection(sec, title) {
      if (!sec) { this.$message.info('该异常无对应章节锚点，请展开校验明细查看：' + (title || '')); return }
      const contains = (k, s) => k === s || k.indexOf(s) > -1 || s.indexOf(k) > -1
      const nodes = Array.prototype.slice.call(document.querySelectorAll('.rwb-canvas-sec[data-rsec]'))
      const hit = nodes.find(n => contains(n.dataset.rsec || '', sec))
      if (hit) {
        // 命中正文章节：画布就地滚动 + 高亮（目录索引同步为当前章）
        const idx = nodes.indexOf(hit)
        this.canvasSecIndex = idx
        hit.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setTimeout(() => { if (this.canvasSecIndex === idx) this.canvasSecIndex = -1 }, 2600)
        return
      }
      // 正文未收录（附表为纯数据表）→ 打开定稿版式视图并定位到该表
      const rp = this.reportPreview
      const chapters = (rp && rp.chapters) || []
      const idx = chapters.findIndex(ch => contains(ch.name || '', sec))
      if (idx < 0) {
        this.$message.info('「' + sec + '」未找到对应内容，请展开校验明细查看')
        return
      }
      this.$message.info('已打开「定稿版式」，定位到「' + sec + '」')
      this.openReportPreview()
      // 预览弹窗有渲染/过渡延迟（章节 DOM 较重），且内容重渲染会替换节点导致高亮类丢失：
      // 高亮用 Vue 数据驱动（:class 绑定 flashSecIndex）而非直接操作 DOM：
      // 预览内容重渲染会替换节点，手工加的类会被丢弃；数据绑定则由框架保证类始终挂在当前节点上
      this.flashSecIndex = idx
      let tries = 0
      const locate = () => {
        const el = document.getElementById('rp-sec-' + idx)
        if (!el) { if (tries++ < 30) setTimeout(locate, 200); return }
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      setTimeout(locate, 200)
      setTimeout(() => { this.flashSecIndex = -1 }, 5000)
    },
    // 校验溯源助手动作分发（消息内按钮经事件委托触发）
    onVerifyAssistant(act, cardId, idx, el) {
      const panel = this.activePanels[3] || {}
      const cards = panel.cards || []
      // 卡片定位以稳定 id 为准（索引会随卡片处置前移，历史消息里的索引会失效或错打到别的卡片）
      let card = cardId ? cards.find(c => c.id === cardId) : null
      if (!card && !cardId && idx !== undefined && idx !== null && !isNaN(idx)) card = cards[idx]
      // 卡片已处置（校验已通过）：不再静默失效——明确反馈并把该消息的动作按钮收敛为"已处置"
      if (!card) {
        this.closeVerifyActions(cardId, '该项已处置', el)
        this.$message.info('该异常已处置完毕（当前校验已通过），无需重复操作')
        return
      }
      // 已人工确认并盖章的卡片：动作按钮不再生效（避免覆盖留痕）
      if (card.resolved) {
        this.closeVerifyActions(cardId, '已人工确认', el)
        this.$message.info('该项已转人工确认并盖章，偏差说明已随报告附注归档，无需重复处置')
        return
      }
      let text = ''
      if (act === 'diag') {
        text = '<b>【偏差成因诊断 · ' + card.title + '】</b>\n· 现象：' + card.desc
          + '\n· 候选成因：① 计量点归属不一致（部分能耗未纳入统计口径）；② 统计周期错位（MES 按班次、报表按自然月）；③ 待机 / 辅助能耗未纳入 MES 采集范围。'
          + '\n· 建议路径：先核对计量点归属与统计口径，再选择处置方式——右侧异常卡片「确认处置」，或在此「一键采纳说明」。'
      } else if (act === 'tolerance') {
        const hist = (card.history || []).map(h => h.period + ' ' + h.dev).join('、') || '暂无历史留痕'
        text = '<b>【历史同期公差 · ' + card.title + '】</b>\n· 历史同期偏差：' + hist
          + '\n· 一致性阈值：2%（校验规则口径）；本期偏差超出阈值，需说明或修正后方可产出文件。'
      } else if (act === 'adopt') {
        const ci = cards.indexOf(card)
        if (ci > -1) cards.splice(ci, 1)
        ;(panel.checks || []).forEach(c => { if (!c.pass) { c.pass = true; c.value = '已采纳说明（重算通过）' } })
        this.pushRevision('异常卡片处置：' + card.title + '（采纳 AI 说明：' + (card.suggest || '') + '）', '人工')
        this.$message.success('已采纳说明：异常处置完成并留痕')
        this.closeVerifyActions(cardId, '已采纳说明')
        text = '<b>【已采纳说明】</b>「' + card.title + '」已按 AI 建议留痕采纳（写入修订留痕），校验重算通过；剩余待处置异常 <b>' + (panel.cards || []).length + '</b> 项。'
      }
      if (text) {
        this.wbMessages.push({ role: 'agent', text })
        this.$nextTick(() => { if (this.$refs.wbMsgs) this.$refs.wbMsgs.scrollTo({ top: this.$refs.wbMsgs.scrollHeight, behavior: 'smooth' }) })
      }
    },
    // 打开模板结构预览弹窗
    openTemplatePreview() {
      this.tplPreviewVisible = true
    },
    // 打开整篇报告预览（阶段三「报告内容预览」的通读入口）。
    // 打开时载入该任务已持久化的 AI 改动：待审改动与已接受正文都不因关闭弹窗 / 刷新而丢失。
    openReportPreview() {
      this.loadAiEdits()
      this.reportPreviewVisible = true
    },
    // 读取 AI 改动存储（按任务 id 分片）
    readAiStore() {
      try {
        const raw = localStorage.getItem(AI_POLISH_KEY)
        return raw ? JSON.parse(raw) : {}
      } catch (e) { return {} }
    },
    // 载入当前任务的 AI 改动
    loadAiEdits() {
      const id = this.activeTask ? this.activeTask.id : null
      this.aiNarratives = {}
      this.aiPolish = {}
      this.aiPolishCursor = -1
      if (!id) return
      const cur = this.readAiStore()[id]
      if (!cur) return
      this.aiNarratives = cur.narratives || {}
      this.aiPolish = cur.polish || {}
    },
    // 持久化当前任务的 AI 改动（待审 + 已接受）
    persistAiEdits() {
      const id = this.activeTask ? this.activeTask.id : null
      if (!id) return
      const all = this.readAiStore()
      all[id] = { narratives: this.aiNarratives, polish: this.aiPolish }
      try { localStorage.setItem(AI_POLISH_KEY, JSON.stringify(all)) } catch (e) { /* ignore */ }
    },
    // 整篇报告预览：目录跳转到指定章节（锚点滚动，与零碳工厂整篇预览同范式）
    jumpToReportSection(key) {
      const el = document.getElementById('rp-sec-' + key)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    // ===== 整篇预览：段落级 AI 改写（就地生成 → 内联 diff → 接受/拒绝）=====
    // 触发改写：先进入 streaming（逐字追加），完成后转 pending 等待人工决定。
    // 真实实现由后端 SSE 返回，此处以定时器模拟流式，交互链路与真实一致。
    runPolish(ci, mode) {
      const ch = (this.reportPreview && this.reportPreview.chapters[ci]) || null
      if (!ch) return
      const meta = AI_POLISH_MODES[mode] || AI_POLISH_MODES.polish
      const style = { tone: this.polishTone }
      const styleLabel = this.polishStyleLabel
      const full = this.buildAiText(mode, ch.content.narrative || '', style)
      this.$set(this.aiPolish, ci, { mode: mode, modeLabel: meta.label, styleLabel: styleLabel, text: '', status: 'streaming' })
      const step = Math.max(2, Math.round(full.length / 60))
      let i = 0
      const timer = setInterval(() => {
        const cur = this.aiPolish[ci]
        if (!cur || cur.status !== 'streaming') { clearInterval(timer); return }
        i += step
        const done = i >= full.length
        this.$set(this.aiPolish, ci, {
          mode: mode,
          modeLabel: meta.label,
          styleLabel: styleLabel,
          text: done ? full : full.slice(0, i),
          status: done ? 'pending' : 'streaming',
          // 生成完成即校验（数值 / 术语 / 篇幅），结果随改动一并持久化
          guard: done ? guardCheck(ch.content.narrative || '', full, mode) : null
        })
        if (done) {
          clearInterval(timer)
          // 关闭弹窗 / 刷新后待审改动仍在（生成中不落盘，避免重开时卡在 streaming 态）
          this.persistAiEdits()
        }
      }, 24)
    },
    // 接受改动：写入该章节正文并持久化（此后该章 narrative 即为定稿内容），再移出待审清单。
    // 未通过数值校验（guard.level === 'block'）的改动禁止接受，须重新生成或拒绝。
    acceptPolish(ci) {
      const cur = this.aiPolish[ci]
      const ch = (this.reportPreview && this.reportPreview.chapters[ci]) || null
      if (!cur || !ch || cur.status !== 'pending') return
      if (cur.guard && cur.guard.level === 'block') {
        this.$message.warning('该处改动未通过数值校验，请重新生成或拒绝')
        return
      }
      this.$set(this.aiNarratives, ci, cur.text)
      this.$delete(this.aiPolish, ci)
      this.persistAiEdits()
      this.$message.success('已接受该处改动，写入正文')
    },
    // 拒绝改动：丢弃结果，正文保持原文
    rejectPolish(ci) {
      this.$delete(this.aiPolish, ci)
      this.persistAiEdits()
      this.$message.info('已拒绝该处改动，正文保持原文')
    },
    // 全部接受：批量操作前先明确范围（改动较多或含阻断项时二次确认，避免"一键跳过审阅"）
    acceptAllPolish() {
      const keys = Object.keys(this.aiPolish).map(Number)
      if (!keys.length) return
      const blocked = keys.filter(k => this.aiPolish[k].guard && this.aiPolish[k].guard.level === 'block')
      const run = () => keys.forEach(k => this.acceptPolish(k))
      if (!blocked.length && keys.length < 5) { run(); return }
      const parts = []
      if (keys.length >= 5) parts.push('将接受 ' + keys.length + ' 处改动')
      if (blocked.length) parts.push('其中 ' + blocked.length + ' 处未通过数值校验会被跳过')
      this.$confirm(parts.join('，') + '。确认继续？', '批量接受确认', { type: 'warning' }).then(run).catch(() => {})
    },
    rejectAllPolish() {
      this.aiPolish = {}
      this.aiPolishCursor = -1
      this.persistAiEdits()
      this.$message.info('已拒绝全部改动，正文保持原文')
    },
    // 跳转到下一处待审改动（走到末尾回到第一处）：审阅发生在画布内，不跳窗
    gotoNextPolish() {
      const keys = Object.keys(this.aiPolish).map(Number).sort((a, b) => a - b)
      if (!keys.length) return
      const next = keys.find(k => k > this.aiPolishCursor)
      this.aiPolishCursor = (next === undefined) ? keys[0] : next
      const idx = this.aiPolishCursor
      if (idx < 0 || idx >= this.canvasChapters.length) return
      this.canvasSecIndex = idx
      const el = document.getElementById('rwb-sec-' + idx)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => { if (this.canvasSecIndex === idx) this.canvasSecIndex = -1 }, 2600)
    },
    // ===== 对话式风格控制 =====
    // 解析指令中的文体 / 受众 / 章节 / 动作，如「把第二章改成对主管部门汇报的正式口径」
    parsePolishStyleCmd(input) {
      const s = String(input || '')
      const hasTone = /风格|语气|口吻|文体|公文|正式|严谨|简洁直述|汇报|说明|主管部门|政府|管理层|领导|核查|第三方/.test(s)
      if (!hasTone) return null
      // 受众词一并映射到文体：对主管部门→公文正式；对管理层→汇报说明；对核查机构→专业严谨
      const tone = /公文|正式|主管部门|政府/.test(s) ? 'official'
        : /严谨|专业|技术|核查|第三方/.test(s) ? 'rigorous'
          : /简洁|直述/.test(s) ? 'plain'
            : /汇报|说明|管理层|领导/.test(s) ? 'briefing' : ''
      const mode = /扩写/.test(s) ? 'expand'
        : /精简|压缩/.test(s) ? 'condense'
          : /重写/.test(s) ? 'rewrite'
            : /润色|改写|改一下|调整/.test(s) ? 'polish' : ''
      return { tone: tone, mode: mode, chapterIndex: this.matchChapterIndex(s) }
    },
    // 章节匹配：支持「第2章 / 第二章 / 表2」
    matchChapterIndex(text) {
      const chapters = (this.reportPreview && this.reportPreview.chapters) || []
      const cn = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 }
      const m = String(text).match(/第\s*([0-9]+|[一二三四五六七八九十]+)\s*[章节]/)
      if (m) {
        const raw = m[1]
        const n = /^[0-9]+$/.test(raw) ? Number(raw) : (cn[raw] || 0)
        if (n > 0 && n <= chapters.length) return n - 1
      }
      const mt = String(text).match(/表\s*([0-9]+)/)
      if (mt) {
        const no = '表' + mt[1]
        const idx = chapters.findIndex(c => String(c.no || c.name || '').indexOf(no) > -1)
        if (idx > -1) return idx
      }
      return -1
    },
    // 应用风格指令：设置风格（并按需对指定章节执行改写），返回给用户的回复文本
    applyPolishStyleCmd(cmd) {
      if (cmd.tone) this.polishTone = cmd.tone
      this.persistPolishStyle()
      let extra = ''
      const chapters = (this.reportPreview && this.reportPreview.chapters) || []
      if (cmd.chapterIndex > -1 && cmd.mode && chapters[cmd.chapterIndex]) {
        const ch = chapters[cmd.chapterIndex]
        this.runPolish(cmd.chapterIndex, cmd.mode)
        extra = '，已对「' + (ch.name || ('第 ' + (cmd.chapterIndex + 1) + ' 章')) + '」执行' +
          ((AI_POLISH_MODES[cmd.mode] || {}).label || '改写') + '，改动待审'
      }
      return '已切换改写风格为 <b>' + this.polishStyleLabel + '</b>' + extra +
        '（受理部门：' + this.polishAudienceLabel + '）。后续章节改写均按该文体生成，数值一致性 / 术语 / 篇幅三道护栏照旧生效。'
    },
    // 按改写意图产出文本（演示态：基于原文变换；真实实现由模型返回）
    buildAiText(mode, src, style) {
      const s = src || ''
      const tone = (style && style.tone) || this.polishTone || 'official'
      if (mode === 'condense') {
        // 精简：压缩表述但保留含数值的句子（数值不得因改写丢失，否则会被数值护栏阻断）
        const parts = s.split(/[；。]/).filter(Boolean)
        const kept = parts.filter(p => /\d/.test(p))
        return this.applyPolishStyle((kept.length ? kept : parts.slice(0, 2)).join('；') + '。', tone)
      }
      if (mode === 'expand') {
        return this.applyPolishStyle(s + '从用能结构看，电力与天然气合计占终端能源消费的 92% 以上，能源结构以清洁能源为主；下一步将通过工艺余热回收与光伏自发自用进一步压降单位产品能耗。', tone)
      }
      if (mode === 'rewrite') {
        return this.applyPolishStyle('本年度用能情况概述如下：' + s, tone)
      }
      return this.applyPolishStyle('经核定，' + s.replace(/^本期/, '2026 年度'), tone)
    },
    // 风格后处理：只调整表达方式，不动数值与术语（数值一致性由护栏二次校验）
    applyPolishStyle(text, tone) {
      let out = String(text || '')
      if (tone === 'plain') {
        out = out.replace(/进一步|切实|较好地|顺利|进行了|的相关|有关/g, '').replace(/，{2,}/g, '，')
      } else if (tone === 'rigorous') {
        if (out.indexOf('口径与数据来源') < 0) out += '（口径与数据来源详见数据溯源）'
      } else if (tone === 'briefing') {
        if (out.indexOf('结论：') !== 0) out = '结论：' + out
      }
      return out
    },
    // 风格选择持久化（刷新后保持）
    persistPolishStyle() {
      try { localStorage.setItem(POLISH_STYLE_KEY, JSON.stringify({ tone: this.polishTone })) } catch (e) { /* ignore */ }
    },
    // 该章节（附件报表）的数据来源类型与说明；正文类章节（无表号）返回 null
    fillTypeOf(ch) {
      const no = this.sectionNo(ch)
      if (!no || no.indexOf('表') !== 0) return null
      return FILL_TYPE_TEXT[SECTION_FILL_TYPE[no]] || FILL_TYPE_TEXT.auto
    },
    // 从章节对象提取表号（"表2 能源消费结构" → "表2"），用于模板结构与生成结果对齐
    sectionNo(x) {
      if (!x) return ''
      // 兼容对象（{ no, name }）与字符串两种入参，避免调用方传 it.name 时静默匹配失败
      const raw = (typeof x === 'string') ? x : (x.no || x.name || '')
      const m = String(raw).match(/表\s*[\d~\-]+/)
      return m ? m[0].replace(/\s/g, '') : ''
    },
    // 某章节的段内 diff 片段：原文侧只渲染 same/del，AI 侧只渲染 same/add。
    // 仅 pending 时计算（生成中由模板直接流式呈现，不跑 diff）；结果按改动内容 memo，避免重复回溯。
    diffParts(ci, side) {
      const cur = this.aiPolish[ci]
      const ch = (this.reportPreview && this.reportPreview.chapters[ci]) || null
      if (!cur || !ch || cur.status !== 'pending') return []
      const key = ci + '#' + (cur.text || '').length
      if (!this._diffMemo || this._diffMemo.key !== key) {
        const parts = charDiff(ch.content.narrative || '', cur.text || '')
        this._diffMemo = {
          key: key,
          old: parts.filter(p => p.type !== 'add'),
          new: parts.filter(p => p.type !== 'del')
        }
      }
      return side === 'old' ? this._diffMemo.old : this._diffMemo.new
    },
    // 打开编制依据明细（规则集本体 + 四类参数 + 多口径目标 + 引用公式）
    openCaliberDetail() {
      this.caliberVisible = true
    },
    // 打开数据溯源链（L1 报表 → L4 原始采集，每级含数值 / 规则来源 / 时间 / 责任方）
    openTrace() {
      this.traceVisible = true
    },
    // 打开佐证材料清单（只读核验 + 整包下载；与报告同属一个报送包，故同在阶段四交付物区）
    openMaterials() {
      this.materialVisible = true
    },
    // 材料状态元信息（清单弹窗徽标与摘要计数共用）
    materialStatusMeta(s) {
      const map = {
        ready: { label: '已齐', cls: 'ok', icon: 'el-icon-circle-check' },
        missing: { label: '待补', cls: 'miss', icon: 'el-icon-warning-outline' },
        pending: { label: '待回传', cls: 'wait', icon: 'el-icon-time' }
      }
      return map[s] || { label: s || '—', cls: 'idle', icon: 'el-icon-more' }
    },
    // 溯源层级空态节点：取不到真实数据时如实标注，不以演示值兜底（归档证据不能是编造的）
    traceEmptyNode(reason) {
      return { label: '本层无记录', value: '—', rule: reason, time: '—', by: '—' }
    },
    // 原始采集责任方：由采集点名称判定（不给每个节点硬编码操作人）
    rawRoleOf(device) {
      const s = String(device || '')
      if (/SCADA|遥测|计量|热量计|地磅|表/.test(s)) return '计量采集'
      if (/MES|ERP|系统/.test(s)) return '业务系统接口'
      if (/发票|结算|凭证/.test(s)) return '凭证智能导入'
      return '数据源系统'
    },
    // 材料快照（供指纹与打包共用）：排除含指纹本身的「签发与回执」组，字段收敛为稳定集合
    signedMaterialsOf(list) {
      return (list || [])
        .filter(m => m.group !== '签发与回执')
        .map(m => ({ group: m.group, name: m.name, type: m.type, source: m.source, status: m.status, hash: m.hash }))
    },
    // 打包下载报送材料包：与「导出报告」共用统一导出入口（bundle 为包级交付物，非单文件格式）
    downloadBundle() {
      return this.onExport('bundle')
    },
    // 打开离线表格导入（清单 #2 主渠道）：目标默认为首个缺项章节；可传入章节号从章节头直达预选
    openImport(no) {
      const miss = this.collectMissing
      this.importSectionNo = no || (miss.length ? this.sectionNo(miss[0]) : '')
      this.importFileName = ''
      this.importHeaders = []
      this.importRows = []
      this.importMapping = []
      this.importVisible = true
    },
    // 选择文件并解析（CSV；Excel 可直接「另存为 CSV」）
    async onImportFile(file) {
      if (!file) return
      try {
        const text = await readFileAsText(file)
        const rows = parseCsv(text)
        if (!rows.length) { this.$message.warning('文件为空或格式无法识别'); return }
        this.importFileName = file.name
        this.importHeaders = rows[0]
        this.importRows = rows.slice(1)
        this.importMapping = suggestMapping(this.importHeaders, this.importTargetFields)
        if (!this.importMapping.length) {
          this.$message.warning('该章节无字段明细，无法建立字段映射')
        }
      } catch (e) {
        this.$message.error('解析失败：' + (e && e.message ? e.message : '未知错误'))
      }
    },
    // 下载章节导入模板 CSV（表头 = 章节字段名，精确匹配映射；可传章节号从卡片头直接下载）
    downloadImportTemplate(no) {
      const target = no || this.importSectionNo
      const fields = no
        ? ((this.chapterItems.find(x => this.sectionNo(x) === target) || {}).fields || [])
        : this.importTargetFields
      if (!fields.length) { this.$message.warning('该章节无字段明细，无法生成模板'); return }
      const ch = this.chapterItems.find(x => this.sectionNo(x) === target)
      const esc = v => '"' + String(v).replace(/"/g, '""') + '"'
      const csv = '\ufeff' + fields.map(f => esc(f.name)).join(',') + '\n'
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = '导入模板-' + ((ch && ch.name) || target) + '.csv'
      a.click()
      URL.revokeObjectURL(a.href)
      this.$message.success('模板已下载：表头与本表字段一一对应，填好另存为 CSV 后导回')
    },
    // 批量下载缺项模板：全部缺项章节字段合并为一张补录清单 CSV（章节 / 字段 / 单位 / 口径 / 上期参考 / 本期补录值空列）
    downloadMissingTemplates() {
      const miss = this.collectMissing || []
      if (!miss.length) { this.$message.info('当前无缺项，无需下载'); return }
      const esc = v => '"' + String(v === undefined || v === null ? '' : v).replace(/"/g, '""') + '"'
      const head = ['章节', '数据项名称', '单位', '填写口径 / 说明', '上期参考值', '本期补录值'].map(esc).join(',')
      const lines = ['\ufeff' + head]
      miss.forEach(m => (m.fields || []).forEach(f => {
        lines.push([m.name, f.name, f.unit, f.hint, f.ref, ''].map(esc).join(','))
      }))
      const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = '缺项补录清单-' + ((this.activeTask && this.activeTask.name) || '报送任务') + '.csv'
      a.click()
      URL.revokeObjectURL(a.href)
      const fieldCount = lines.length - 1
      this.$message.success('已下载 ' + miss.length + ' 个缺项章节共 ' + fieldCount + ' 项字段的补录清单')
    },
    // 缺项消番模式：缺项章节自动展开
    openMissingChapters() {
      (this.collectMissing || []).forEach(m => this.$set(this.collectOpen, this.sectionNo(m), true))
    },
    // 在线填报值持久化（修复刷新丢失）：填充值快照写入 report 对象（reports deep watch 自动落盘 rs_reports_v1）
    snapshotCollected() {
      const r = this.activeTask
      if (!r) return
      const snap = {}
      ;(this.activePanels[2] && this.activePanels[2].rawItems || []).forEach(it => {
        const vals = {}
        ;(it.fields || []).forEach(f => {
          if (f.value !== undefined && f.value !== null && String(f.value).trim() !== '') vals[f.name] = f.value
        })
        if (Object.keys(vals).length) snap[this.sectionNo(it)] = vals
      })
      this.$set(r, 'collectedSnapshot', snap)
    },
    // 恢复：进入任务时把历史填报值套回面板字段（与 collectedSnapshot 逐项对应）
    applyCollectedSnapshot() {
      const r = this.activeTask
      const snap = r && r.collectedSnapshot
      if (!snap) return
      ;(this.activePanels[2] && this.activePanels[2].rawItems || []).forEach(it => {
        const vals = snap[this.sectionNo(it)]
        if (!vals) return
        ;(it.fields || []).forEach(f => {
          if (vals[f.name] !== undefined) this.$set(f, 'value', vals[f.name])
        })
      })
    },
    // 手动指定字段来源列（映射建议未命中或需纠正时使用）
    onImportMapChange(row, idx) {
      const src = this.importHeaders[row.sourceIndex] === undefined ? '' : String(this.importHeaders[row.sourceIndex])
      this.$set(this.importMapping, idx, Object.assign({}, row, { sourceHeader: src }))
    },
    // 确认导入：映射结果写入采集项，推进采集进度并留痕
    confirmImport() {
      if (!this.importMapping.length) { this.$message.warning('请先选择并解析文件'); return }
      const s = this.importSummary
      if (s.needManual) {
        this.$message.warning('仍有 ' + s.none + ' 个字段未匹配来源列：请手动指定，否则该字段将留空')
      }
      const data = applyMapping(this.importRows, this.importMapping)
      const no = this.importSectionNo
      const panel = this.activePanels[2] || {}
      const item = (panel.rawItems || []).find(x => this.sectionNo(x) === no)
      let filled = 0
      if (item) {
        this.$set(item, 'status', '已采集')
        this.$set(item, 'ready', '离线表格导入 · ' + this.importFileName)
        this.$set(item, 'importedRows', data.length)
        this.$set(item, 'importedFields', s.matched)
        // 字段值落库：映射命中的字段写入首行导入值，采集明细即时可见（不再是仅改状态的假导入）
        const first = data[0] || {}
        ;(item.fields || []).forEach(f => {
          const v = first[f.name]
          if (v !== undefined && String(v).trim() !== '') { this.$set(f, 'value', String(v).trim()); filled++ }
        })
      }
      this.pushRevision('离线表格导入：' + this.importFileName + ' → ' + (no || '—') + '（' + data.length + ' 行，' + s.matched + '/' + s.total + ' 字段已映射，首行回填 ' + filled + ' 项）', '人工')
      this.snapshotCollected()
      this.importVisible = false
      // 回填反馈：定位到该章节并闪烁高亮（左侧导入 / AI 回填与右侧表单双向互通的可视确认）
      this.locateField(no)
      this.$message.success('已导入 ' + data.length + ' 行数据（' + s.matched + '/' + s.total + ' 字段映射成功，' + filled + ' 项已回填）')
    },
    // 多级审核：通过（记录审核人与时间，写入修订留痕）。
    // 退回约束：曾被退回的级别不能直接补签「通过」，必须填写复核说明后按「退回后重新审核」通过。
    passAudit(key) {
      const lv = AUDIT_LEVELS.find(l => l.key === key)
      if (!lv) return
      const prev = this.auditFlow[key] || {}
      if (prev.status === 'rejected') {
        this.$prompt('该级审核曾被退回，不能直接补签通过。请填写复核说明（随报告归档）', lv.name + ' · 退回后重新审核', {
          inputPlaceholder: '如：已按退回意见核对电费结算单，数据无误',
          inputValidator: v => (v && String(v).trim() ? true : '请填写复核说明')
        }).then(({ value }) => {
          this.applyAuditPass(key, lv, String(value).trim())
        }).catch(() => {})
        return
      }
      this.applyAuditPass(key, lv, '')
    },
    // 审核通过落库（首次通过 / 退回后重新审核共用）
    applyAuditPass(key, lv, redoComment) {
      const prev = this.auditFlow[key] || {}
      const redo = !!redoComment
      this.$set(this.auditFlow, key, {
        status: 'passed',
        by: lv.role + '（当前用户）',
        time: new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
        comment: redo
          ? (prev.comment ? prev.comment + '；' : '') + '复核说明：' + redoComment
          : (prev.comment || '')
      })
      this.pushRevision('多级审核通过：' + lv.name + (redo ? '（退回后重新审核，复核说明已随报告归档）' : ''), '审核')
      this.$message.success(lv.name + (redo ? ' 重新审核通过' : ' 已通过'))
    },
    // 多级审核：退回修改（必须填写退回意见，退回后需重新送审）
    rejectAudit(key) {
      const lv = AUDIT_LEVELS.find(l => l.key === key)
      if (!lv) return
      this.$prompt('退回后报告需修改并重新走审核流程，请填写退回意见（随报告一并归档）', lv.name + ' · 退回修改', {
        inputPlaceholder: '如：表2 电力消费量需与电费结算单核对后重报',
        inputValidator: v => (v && String(v).trim() ? true : '请填写退回意见')
      }).then(({ value }) => {
        this.$set(this.auditFlow, key, {
          status: 'rejected',
          by: lv.role + '（当前用户）',
          time: new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
          comment: String(value).trim()
        })
        this.pushRevision('多级审核退回：' + lv.name + '（意见：' + String(value).trim() + '）', '审核')
        this.$message.warning(lv.name + ' 已退回修改')
      }).catch(() => {})
    },
    // 多级审核：添加批注（不改变审核状态，批注随报告归档供审计查阅）
    auditComment(key) {
      const lv = AUDIT_LEVELS.find(l => l.key === key)
      if (!lv) return
      this.$prompt('批注随报告归档，供后续审计查阅', lv.name + ' · 添加批注', {
        inputValue: (this.auditFlow[key] || {}).comment || '',
        inputPlaceholder: '如：已核对与碳核查报告口径一致'
      }).then(({ value }) => {
        const cur = this.auditFlow[key] || {}
        this.$set(this.auditFlow, key, Object.assign({}, cur, { comment: String(value || '').trim() }))
        this.pushRevision('多级审核批注：' + lv.name + '（' + String(value || '').trim() + '）', '审核')
        this.$message.success('批注已保存')
      }).catch(() => {})
    },
    // 报告导出（清单 #7）：5 种格式共享导出服务，统一嵌入元信息水印；导出动作写入修订留痕。
    // bundle（报送材料包）属包级交付物：报告 + 佐证材料 + 材料清单，与单文件格式分开计文案。
    async onExport(format) {
      try {
        const r = await exportReport(format, this.buildExportPayload())
        if (format === 'pdf') {
          this.$message.success('已打开打印视图，请在打印对话框中选择「另存为 PDF」')
        } else if (format === 'bundle') {
          this.$message.success('已生成 ' + ((r && r.filename) || '报送材料包.zip')
            + '（含报告数据件 + ' + this.signedMaterials.length + ' 项佐证材料索引 + 材料清单）')
        } else {
          this.$message.success('已导出 ' + ((r && r.filename) || format) + '（含元信息水印）')
        }
        this.pushRevision(format === 'bundle'
          ? '打包下载报送材料包（报告 + 佐证材料 ' + this.signedMaterials.length + ' 项）'
          : '导出报告文件（' + String(format).toUpperCase() + '）', '人工')
      } catch (e) {
        this.$message.error('导出失败：' + (e && e.message ? e.message : '未知错误'))
      }
    },
    // 导出载荷：章节取自阶段三（正文 + 附件），元信息取自企业档案与签署信息。
    // 正文必须应用已接受的 AI 改写（与整篇预览 reportPreview 同一覆盖逻辑），
    // 否则会出现"屏幕上是改写后文本、导出文件与防篡改指纹却是旧文本"的内容割裂。
    buildExportPayload() {
      const t = this.activeTask || {}
      const sections = (this.stageChapters || []).map((ch, ci) => {
        const content = ch.content || {}
        const applied = this.aiNarratives[ci]
        const table = content.table
        return {
          name: ch.name,
          narrative: applied !== undefined ? applied : (content.narrative || ''),
          columns: table ? (table.columns || []) : [],
          rows: table ? (table.rows || []) : [],
          note: ch.note || ch.purpose || ''
        }
      })
      const sign = (this.reportPreview && this.reportPreview.sign) || {}
      // 取当前任务的面板（nybg 任务走 nybgPanels，硬编码 stagePanels 会串到通用面板的主体信息）
      const p = this.activePanels[1] || {}
      return {
        title: t.name || '智慧报告',
        sections,
        // 佐证材料随报告一并进入导出与签发载荷：报告 + 佐证材料 = 一个报送材料包，
        // 指纹若不覆盖材料，归档后替换材料不会被检出（防篡改只防一半）
        materials: this.signedMaterials,
        // 已签字任务：把内容指纹带入载荷，供打包说明与存证口径展示（不参与指纹计算）
        fingerprint: this.signRecord ? this.signRecord.fingerprint : '',
        meta: {
          org: sign.org || p.orgName || '—',
          filler: sign.filler || '—',
          date: sign.date || new Date().toLocaleDateString('zh-CN')
        },
        filename: t.name || '智慧报告'
      }
    },
    // 口径规则参数键 → 中文名（对齐政策标准库的四类参数标签）
    reportParamLabel(key) {
      return REPORT_PARAM_LABELS[key] || key
    },
    // 参数值转可读文本（值可为对象，如 { boundary: '法人边界', scope: '...' }）
    paramText(v) {
      if (v === null || v === undefined) return '—'
      if (typeof v !== 'object') return String(v)
      return Object.keys(v).map(k => v[k]).join(' · ')
    },
    // 章节明细展开/收缩（缺项章节默认展开，便于直接看到待补数据项；其余默认收缩）
    // 展开状态按「表号」存在独立 state：章节数据来自 computed（每次重算返回新对象），
    // 若把 _open 挂在章节对象上会在下次重算时丢失，表现为"点不开"。
    isChapterOpen(ch) {
      const no = this.sectionNo(ch)
      return this.collectOpen[no] !== undefined ? this.collectOpen[no] : ch.status === '缺项'
    },
    toggleChapter(ch) {
      const no = this.sectionNo(ch)
      this.$set(this.collectOpen, no, !this.isChapterOpen(ch))
    },
    // 报告叙述折叠：画布是"正式成文"载体，正文默认全展开（仅在用户主动收起时才折叠）
    isNarrativeLong(ch) {
      return ((ch.content && ch.content.narrative) || '').length > 90
    },
    isNarrativeOpen(ch) {
      const no = this.sectionNo(ch)
      return this.narrOpen[no] !== undefined ? this.narrOpen[no] : true
    },
    toggleNarrative(ch) {
      const no = this.sectionNo(ch)
      this.$set(this.narrOpen, no, !this.isNarrativeOpen(ch))
    },
    // 缺项章节内的空字段：闸门按字段级空值判定，章节头与底栏据此明确"还差哪几项"，
    // 避免"多数行已有值（绿标）"被误读为整表完成
    missingFieldsOf(ch) {
      return (ch.fields || []).filter(f => !String(f.value || '').trim())
    },
    filledCountOf(ch) {
      return (ch.fields || []).length - this.missingFieldsOf(ch).length
    },
    // 底栏缺失字段直达：展开章节 → 平滑滚动 → 聚焦该字段并短暂高亮
    focusMissingField(no, name) {
      const ch = (this.stageItems || []).find(x => this.sectionNo(x) === no)
      if (!ch) return
      if (!this.isChapterOpen(ch)) this.$set(this.collectOpen, no, true)
      if (this.chapterFilter === 'exempt') this.chapterFilter = 'missing'
      this.$nextTick(() => {
        const root = document.querySelector('.rwb-chapter[data-sec="' + no + '"]')
        if (!root) return
        root.scrollIntoView({ behavior: 'smooth', block: 'start' })
        const rows = Array.prototype.slice.call(root.querySelectorAll('.rwb-ch-row'))
        const row = rows.find(r => {
          const n = r.querySelector('.rwb-fd-name')
          return n && n.innerText.indexOf(name) > -1
        })
        const inp = row && row.querySelector('input, textarea')
        if (!inp) return
        inp.focus()
        // 高亮标记同时挂在行与输入框上：行元素不会因重渲染被替换，确保高亮可见
        row.classList.add('rwb-flash-focus')
        inp.classList.add('rwb-flash-focus')
        setTimeout(() => {
          row.classList.remove('rwb-flash-focus')
          inp.classList.remove('rwb-flash-focus')
        }, 1800)
      })
    },
    // 在线填报状态联动：章节内全部字段有值 → 置为已采集（并清除缺项原因/建议）；否则保持缺项
    refreshItemStatus(item) {
      // 状态流转必须写在源数据（rawItems）上——stageItems 计算属性的展开副本会在重算时丢失变更
      const no = this.sectionNo(item)
      const raw = (this.activePanels[2].rawItems || []).find(x => this.sectionNo(x) === no) || item
      const fields = raw.fields || []
      // 填报一线防呆：本期值与上期参考值偏离 ≥±50% 时即时预警（不等阶段三校验才暴露）
      fields.forEach(f => {
        const refNum = parseFloat(String(f.ref || '').replace(/,/g, '').match(/-?\d+(\.\d+)?/))
        const cur = parseFloat(String(f.value || '').replace(/,/g, ''))
        if (!isNaN(refNum) && refNum > 0 && !isNaN(cur) && String(f.value || '').trim() !== '') {
          const pct = Math.round((cur - refNum) / refNum * 100)
          if (Math.abs(pct) >= 50) this.$set(f, 'devWarn', '本期值较上期变动 ' + (pct > 0 ? '+' : '') + pct + '%（上期 ' + refNum + '），请确认是否无误')
          else if (f.devWarn) this.$delete(f, 'devWarn')
        } else if (f.devWarn) this.$delete(f, 'devWarn')
      })
      const allFilled = fields.length > 0 && fields.every(f => f.value !== undefined && f.value !== null && String(f.value).trim() !== '')
      if (allFilled && raw.status === '缺项') {
        raw.status = '已采集'
        delete raw.reason
        delete raw.suggest
        // 消番动效：缺项 Tab 下补齐的章节保留原位（置灰折叠），不立即从界面抹去
        if (this.chapterFilter === 'missing' && this.justCompleted.indexOf(no) === -1) this.justCompleted.push(no)
        this.$message.success('「' + raw.name + '」已补齐 ✓')
      }
      this.snapshotCollected()
    },
    // 是/否 枚举类字段识别（按计量单位标注），行内 Segmented 单选直接完成补录
    isBoolField(f) {
      return /是\/否/.test(f.unit || '')
    },
    setBoolValue(ch, f, v) {
      this.$set(f, 'value', v)
      this.refreshItemStatus(ch)
      this.snapshotCollected()
    },
    // ===== V5.1 附录 A：二维正交状态 / issues[] / TIER 来源分级（原型简化版） =====
    // 字段级问题集合（issues[] 简化模型：type/severity/description/suggestedFix，哈希与锚点留空位）
    issuesOf(ch) {
      const issues = []
      const miss = ch.status === '缺项'
      const flds = ch.fields || []
      flds.forEach(f => {
        if (f.waived) return // 已豁免留痕：不再重复报警（留痕标签在字段行展示）
        if (miss && !(String(f.value || '').trim())) {
          issues.push({ type: 'MISSING_DATA', severity: 'INFO', field: f.name, description: f.name + ' 待补录', suggestedFix: '在线填写 / 导入本表 / 点击输入框查看线索' })
          return
        }
        const refNum = parseFloat(String(f.ref || '').replace(/,/g, '').match(/-?\d+(\.\d+)?/))
        const cur = parseFloat(String(f.value || '').replace(/,/g, ''))
        if (!isNaN(refNum) && refNum > 0 && !isNaN(cur)) {
          const pct = Math.round((cur - refNum) / refNum * 100)
          if (cur <= 0) {
            issues.push({ type: 'PHYSICAL_VIOLATION', severity: 'BLOCKING', field: f.name, description: f.name + ' 出现非正值（' + f.value + ' ' + (f.unit || '') + '）', suggestedFix: '能耗指标不允许非正值，请核对纠偏或提交工况豁免说明' })
          } else if (Math.abs(pct) >= 50) {
            issues.push({ type: 'ABNORMAL_VARIATION', severity: 'WARNING', field: f.name, description: f.name + ' 较上期变动 ' + (pct > 0 ? '+' : '') + pct + '%（上期 ' + refNum + '）', suggestedFix: '核对本期统计口径；如属实，请在报告正文附异动说明' })
          } else if (Math.abs(pct) >= 20) {
            issues.push({ type: 'ABNORMAL_VARIATION', severity: 'INFO', field: f.name, description: f.name + ' 较上期变动 ' + (pct > 0 ? '+' : '') + pct + '%', suggestedFix: '波动在 ±20%~50% 区间，建议复核后留存说明' })
          }
        }
        // 精度合规（前移自阶段三校验：建议级实时提示，不阻断）
        const dec = String(f.value || '').indexOf('.') > -1 ? String(f.value).split('.')[1].length : 0
        if (!isNaN(cur) && dec >= 3) {
          issues.push({ type: 'PRECISION_RISK', severity: 'INFO', field: f.name, description: f.name + ' 填写了 ' + dec + ' 位小数', suggestedFix: '报送规范建议保留 2 位小数，请确认精度口径' })
        }
      })
      // 勾稽自洽（前移自阶段三校验：实时守卫）——加工转换产出量不得大于投入量（转换效率 ≤ 100%）
      const fin = flds.find(x => (x.name || '').indexOf('加工转换投入量') > -1)
      const fout = flds.find(x => (x.name || '').indexOf('加工转换产出量') > -1)
      const nin = fin && !fin.waived ? parseFloat(String(fin.value || '').replace(/,/g, '')) : NaN
      const nout = fout && !fout.waived ? parseFloat(String(fout.value || '').replace(/,/g, '')) : NaN
      if (!isNaN(nin) && nin > 0 && !isNaN(nout) && nout > nin) {
        issues.push({ type: 'LOGIC_CONFLICT', severity: 'BLOCKING', field: fout.name, description: '加工转换产出量（' + nout + '）大于投入量（' + nin + '）——违反能量守恒（加工转换效率不应超过 100%）', suggestedFix: '核对投入/产出口径或计量单位；如确有外购二次能源投入，请在复合处置中归因说明' })
      }
      return issues
    },
    // 章节质量维度（qualityStatus 简化版）：BLOCKING→BLOCKED / WARNING→WARNING / 其余 PASS
    chapterQuality(ch) {
      const issues = this.issuesOf(ch)
      if (issues.some(i => i.severity === 'BLOCKING')) return 'BLOCKED'
      if (issues.some(i => i.severity === 'WARNING')) return 'WARNING'
      return 'PASS'
    },
    issueTypeLabel(t) {
      return { ABNORMAL_VARIATION: '同比异动', PHYSICAL_VIOLATION: '物理守恒', MISSING_DATA: '缺项', SOURCE_CONFLICT: '多源冲突', LEGAL_COMPLIANCE_RISK: '合规风险', LOGIC_CONFLICT: '勾稽自洽', PRECISION_RISK: '精度合规' }[t] || '问题'
    },
    // ===== 事件驱动填报线索（对话消息形态）：点击右侧输入框，由小易在对话流中提出出处依据与一键填入 =====
    showClueCard(ch, f) {
      if (ch.status !== '缺项') return // 仅对可填报（缺项）字段给出线索
      const num = (String(f.ref || '').match(/\d[\d,]*(?:\.\d+)?/) || [])[0] || ''
      const isNum = !!num && !/文本|是\/否/.test(f.unit || '')
      const no = this.sectionNo(ch)
      // 防刷屏：同一字段的线索消息已存在时不重复推送（滚动到底部定位既有消息）
      const marker = 'data-clue="' + no + '|' + f.name + '"'
      if (this.wbMessages.some(m => m.role === 'agent' && (m.text || '').indexOf(marker) > -1)) {
        this.$nextTick(() => { if (this.$refs.wbMsgs) this.$refs.wbMsgs.scrollTo({ top: this.$refs.wbMsgs.scrollHeight, behavior: 'smooth' }) })
        return
      }
      const lines = ['<b>【填报线索 · ' + f.name + '】</b><span class="rwb-clue-sec">（' + ch.name + '）</span><span class="rwb-clue-anchor" ' + marker + '></span>']
      lines.push('· 数据来源：' + ch.ready)
      if (ch.caliber) lines.push('· 口径依据：' + ch.caliber)
      if (f.hint) lines.push('· 填写口径：' + f.hint)
      if (f.ref) lines.push('· 上期参考：' + f.ref)
      if (isNum) {
        lines.push('<span class="wb-clue-fill" data-clue-sec="' + no + '" data-clue-fd="' + f.name + '" data-clue-val="' + num + '" title="按上期参考值代填，仍走防呆校验，可在右侧修正"><i class="el-icon-magic-wand"></i>一键填入 ' + num + '</span>')
      } else {
        lines.push('请在右侧对应行填写。')
      }
      this.wbMessages.push({ role: 'agent', text: lines.join('\n') })
      this.$nextTick(() => { if (this.$refs.wbMsgs) this.$refs.wbMsgs.scrollTo({ top: this.$refs.wbMsgs.scrollHeight, behavior: 'smooth' }) })
    },
    // 一键填入（消息内按钮经事件委托触发）：按上期参考值落库（仍走 refreshItemStatus 的防呆与状态联动）
    clueFillFromMsg(secNo, fdName, val) {
      if (!secNo || !fdName || !val) return
      const ch = (this.stageItems || []).find(x => this.sectionNo(x) === secNo)
      if (!ch || ch.status !== '缺项') return
      const f = (ch.fields || []).find(x => x.name === fdName)
      if (!f) return
      this.$set(f, 'value', val)
      this.refreshItemStatus(ch)
      this.snapshotCollected()
      this.$message.success('已按上期参考值填入「' + fdName + '」，请核对口径')
    },
    // ===== 复合阻断处置（差异归因 → 规则确认 → 消除违背，卡片内闭环） =====
    disposeOf(no) { return this.disposeFlows[no] || {} },
    setDispose(ch, key, val) {
      const no = this.sectionNo(ch)
      const cur = Object.assign({ note: '' }, this.disposeOf(no))
      cur[key] = val
      this.$set(this.disposeFlows, no, cur)
    },
    // 复合处置仅服务 BLOCKING（守恒违背/勾稽冲突/非正值）：WARNING（±50% 异动）用预警行+说明即可，不弹三步仪式
    needDispose(ch) {
      if (ch.status === '不适用') return false
      return this.issuesOf(ch).some(i => i.severity === 'BLOCKING')
    },
    blockingCount(ch) {
      return this.issuesOf(ch).filter(i => i.severity === 'BLOCKING').length
    },
    disposeOpenOf(ch) { return !!this.disposeOpen[this.sectionNo(ch)] },
    toggleDispose(ch) {
      const no = this.sectionNo(ch)
      this.$set(this.disposeOpen, no, !this.disposeOpen[no])
    },
    // 章节内首个 BLOCKING 问题（供守卫消息与字段定位）
    firstBlocking() {
      for (const ch of this.chapterItems) {
        const iss = this.issuesOf(ch).find(i => i.severity === 'BLOCKING')
        if (iss) return { ch, issue: iss }
      }
      return null
    },
    locateBlockingField(ch) {
      const iss = this.issuesOf(ch).find(i => i.severity === 'BLOCKING' && i.field)
      if (iss && iss.field) this.locateField(this.sectionNo(ch), iss.field)
      else this.locateField(this.sectionNo(ch))
    },
    // 豁免留痕放行：仅对当前阻断/预警问题生效，归因与说明随报告存档；纠偏路径下直接改值即自动消除
    waiveChapterIssues(ch) {
      const no = this.sectionNo(ch)
      const flow = this.disposeOf(no)
      if (!flow.cause || !String(flow.note || '').trim()) { this.$message.warning('请先完成差异归因并填写豁免说明'); return }
      const raw = (this.activePanels[2].rawItems || []).find(x => this.sectionNo(x) === no) || ch
      const stamp = '归因：' + flow.cause + '；豁免说明：' + String(flow.note).trim()
      this.issuesOf(ch).filter(i => i.severity !== 'INFO' && i.type !== 'MISSING_DATA').forEach(i => {
        const f = (raw.fields || []).find(x => x.name === i.field)
        if (f) this.$set(f, 'waived', stamp)
      })
      this.$delete(this.disposeFlows, no)
      this.snapshotCollected()
      this.$message.success('已留痕放行：归因与豁免说明将随报告存档')
      // 对话流同步确认（与"所有交互由小易提出"范式一致）
      this.wbMessages.push({ role: 'agent', text: '<b>【复合处置 · 已闭环】</b>「' + ch.name + '」的阻断问题已按「' + flow.cause + '」留痕放行，质量守卫回落，可继续填报；留痕将随报告存档供核查追溯。' })
      this.$nextTick(() => { if (this.$refs.wbMsgs) this.$refs.wbMsgs.scrollTo({ top: this.$refs.wbMsgs.scrollHeight, behavior: 'smooth' }) })
    },
    // 来源分级（TIER 文本层，V5.1 降级约定：sourceDocHash/cellCoordinate 留空位）
    // 展示策略：界面（徽章 + tooltip）只出现中文，英文枚举码仅保留在数据模型 tier 字段（血缘/留痕用），不对用户展示
    sourceTier(ready) {
      const t = ready || ''
      if (/档案|组织资源|官方/.test(t)) return {
        tier: 'TIER_1_OFFICIAL', label: '官方档案', type: 'success', badge: '官方档案 · 免复核',
        tip: '数据来源分级 · 官方档案：来自企业档案 / 组织资源库等权威官方记录，最高置信度——直接引用，一般无需人工复核。'
      }
      if (/SCADA|数据底座|自动|在线监测|系统/.test(t)) return {
        tier: 'TIER_2_SYSTEM', label: '系统采集', type: '', badge: '系统采集 · 自动对齐',
        tip: '数据来源分级 · 系统采集：来自计量系统 / 数据底座自动采集（SCADA、电费 API、MES、光伏并网计量等），高置信度——系统自动对齐入库，异常时由质量校验兜底。'
      }
      return {
        tier: 'TIER_3_MANUAL', label: '人工填报', type: 'info', badge: '人工填报 · 需附台账佐证',
        tip: '数据来源分级 · 人工填报：数据底座无对应成品指标，需人工整理录入（如能源管理台账）；置信度最低——系统执行最高强度质量守卫（±20%/±50% 异动、勾稽自洽、非正值守恒），向核查机构举证时需附台账原件。'
      }
    },
    isJustCompleted(ch) {
      return this.justCompleted.indexOf(this.sectionNo(ch)) > -1
    },
    // 左侧对话 ↔ 右侧采集清单联动：点击消息中的章节 / 字段锚点，展开章节并滚动高亮定位
    onWbMsgsClick(e) {
      // 消息内「校验溯源助手」动作（诊断 / 公差 / 采纳）——先于一键填入判定（同为 .wb-clue-fill 类）
      const cardAct = e.target && e.target.closest ? e.target.closest('.wb-clue-fill[data-card-act]') : null
      if (cardAct) {
        this.onVerifyAssistant(cardAct.dataset.cardAct, cardAct.dataset.cardId, cardAct.dataset.cardIdx, cardAct)
        return
      }
      // 消息内「一键填入」按钮：事件委托触发代填（v-html 消息无法直接绑事件）
      const fill = e.target && e.target.closest ? e.target.closest('.wb-clue-fill') : null
      if (fill) {
        this.clueFillFromMsg(fill.dataset.clueSec, fill.dataset.clueFd, fill.dataset.clueVal)
        return
      }
      const el = e.target && e.target.closest ? e.target.closest('.wb-jump') : null
      if (!el) return
      this.locateField(el.dataset.sec, el.dataset.fd)
    },
    locateField(no, fd) {
      if (!no) return
      if (this.activeStage !== 2) { this.gotoStage(2); this.$message.info('已切换到阶段二 · 数据采集') }
      this.$set(this.collectOpen, no, true)
      this.$nextTick(() => {
        let chap = this.$el.querySelector('.rwb-chapter[data-sec="' + no + '"]')
        // 缺项视图中章节已补齐（不可见）时：自动切回全量一览再定位
        if (!chap && this.chapterFilter === 'missing') {
          this.chapterFilter = 'all'
          this.$nextTick(() => { this.locateField(no, fd) })
          return
        }
        if (!chap) return
        chap.scrollIntoView({ behavior: 'smooth', block: 'start' })
        const head = chap.querySelector('.rwb-ch-head')
        if (head) {
          head.classList.add('rwb-locate-flash')
          setTimeout(() => head.classList.remove('rwb-locate-flash'), 1600)
        }
        if (fd) {
          setTimeout(() => {
            const row = chap.querySelector('.rwb-ch-row[data-fd="' + fd + '"]')
            if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 350)
        }
      })
    },
    // 阶段二引导：采集完成度 + 缺失数据项清单（含缺失原因与补录建议）+ 补录方式
    buildCollectGuide() {
      const items = this.stageItems || []
      const missing = items.filter(x => x.status === '缺项')
      const na = items.filter(x => x.status === '不适用')
      const done = items.length - missing.length - na.length
      let t = '<b>【阶段二 · 数据采集】</b>采集清单共 ' + items.length + ' 项：已就绪 ' + done + ' 项'
      if (na.length) t += '、不适用 ' + na.length + ' 项（本任务免填）'
      t += '、<b>缺项 ' + missing.length + ' 项</b>。\n'
      if (missing.length) {
        t += '\n<b>缺失数据项清单：</b>（点击名称可定位到右侧对应章节 / 字段行）\n'
        missing.forEach((m, i) => {
          const no = this.sectionNo(m)
          t += (i + 1) + '. <span class="wb-jump" data-sec="' + no + '"><b>' + m.name + '</b></span>\n'
          t += '   · 数据来源：' + m.ready + '\n'
          if (m.reason) t += '   · 缺失原因：' + m.reason + '\n'
          if (m.fields && m.fields.length) {
            t += '   · <b>需补充的具体数据项（' + m.fields.length + ' 项）</b>：\n'
            m.fields.forEach((f, fi) => {
              t += '     ' + (fi + 1) + ') <span class="wb-jump" data-sec="' + no + '" data-fd="' + f.name + '">' + f.name + '</span>（' + f.unit + '）' + (f.ref ? ' · ' + f.ref : '') + '\n'
            })
          }
          if (m.suggest) t += '   · 补录建议：' + m.suggest + '\n'
        })
        t += '\n<b>补录方式（三选一）：</b>\n'
        t += '① 点击右侧对应行「去补录」，按引导填报\n'
        t += '② 直接上传材料（PDF / Excel / 图片），系统解析后自动回填\n'
        t += '③ 缺口较小时在对话中告知数据，系统代为落库\n'
      } else {
        t += '\n全部数据项已就绪，可直接进入生成与校验。\n'
      }
      t += '\n完整性闸门：缺项清零后自动放行至生成与校验。'
      return t
    },
    // 单项补录引导：字段级清单 + 缺失原因 + 数据来源 + 口径要求 + 历史参考
    // （数据项明细统一在下方「采集清单」的章节内展示，此处仅确保对应章节展开）
    sendCollectGuide(item) {
      // 展开对应章节（状态存在 collectOpen，不挂在 computed 返回的临时对象上）
      this.$set(this.collectOpen, this.sectionNo(item), true)
      const lines = ['<b>【补录引导 · ' + item.name + '】</b>']
      lines.push('· 数据来源：' + item.ready)
      if (item.reason) lines.push('· 缺失原因：' + item.reason)
      if (item.caliber) lines.push('· 口径要求：' + item.caliber)
      if (item.fields && item.fields.length) {
        const no = this.sectionNo(item)
        lines.push('· <b>需补充的具体数据项（' + item.fields.length + ' 项）：</b>（点击名称定位到右侧字段行）')
        item.fields.forEach((f, fi) => {
          lines.push('  ' + (fi + 1) + ') <span class="wb-jump" data-sec="' + no + '" data-fd="' + f.name + '">' + f.name + '</span>（' + f.unit + '）')
          if (f.hint) lines.push('     — ' + f.hint)
          if (f.ref) lines.push('     — ' + f.ref)
        })
      }
      if (item.suggest) lines.push('· 补录建议：' + item.suggest)
      lines.push('')
      lines.push('补录方式：上传材料由系统解析回填，或直接在对话中告知数据（可逐项提供）。')
      this.wbMessages.push({ role: 'agent', text: lines.join('\n') })
      this.$nextTick(() => { if (this.$refs.wbMsgs) this.$refs.wbMsgs.scrollTo({ top: this.$refs.wbMsgs.scrollHeight, behavior: 'smooth' }) })
    },
    // 工作台辅助对话（支持建议气泡直传文本）
    sendWb(text) {
      const content = (typeof text === 'string' && text) ? text : this.wbInput
      const input = (content || '').trim()
      // 对话式风格控制：如「把第二章改成对主管部门汇报的正式口径」「这段改成简洁直述」
      const styleCmd2 = this.parsePolishStyleCmd(input)
      if (styleCmd2 && styleCmd2.tone) {
        return this.applyPolishStyleCmd(styleCmd2)
      }
      if (!input) return
      this.wbMessages.push({ role: 'user', text: input })
      this.wbInput = ''
      // 形式B：成稿校核式，优先处理"确认/修改/下一个"等文档操作意图
      if (this.isDocumentMode && this.handleDocIntent(input)) return
      const stageNames = ['', '模板匹配与主体核对', '数据采集', '生成与校验', '确认归档']
      let reply = ''
      // 流转指令：直接跳转
      if (input.includes('直接进入') && input.includes('数据采集')) {
        this.gotoStage(2)
        return
      }
      setTimeout(() => {
        if (input.includes('标准依据')) {
          reply = '本报告标准依据：排放因子采用生态环境部 2025 年第 3 号公告版（全国电网平均因子 0.6096 kgCO₂/kWh 等），核算方法遵循 GB/T 32150 温室气体核算体系，编制依据版本已在任务创建时锁定。'
        } else if (input.includes('概况') || input.includes('单位信息') || input.includes('字段')) {
          if (this.profileCoverage) {
            const groups = this.profileGroups.map(g => g.name + '（' + g.fields.length + ' 项，已带出 ' + g.filled + ' 项）').join('；')
            reply = '用能单位概况按' + this.profileCoverage.label + '字段集组织，共 ' + this.profileCoverage.total + ' 项：' + groups
              + '；' + this.profileEconomic.name.replace(/（.*?）/, '') + '（' + this.profileEconomic.fields.length + ' 项，含本期值 / 上年值 / 同比变化率自动计算）；'
              + this.profileSign.name.replace(/（.*?）/, '') + '（' + this.profileSign.fields.length + ' 项，渲染至各报表页脚）。'
              + '各分组默认展开、点击分组头可收起；标注「企业档案」的字段可直接编辑，变更同步至企业档案。'
          } else {
            reply = '当前报告类型沿用简版概况：单位名称、统一社会信用代码、单位地址、行业领域、重点用能等级、物理边界。'
          }
        } else if (input.includes('缺项') || input.includes('缺什么') || input.includes('缺失') || input.includes('缺漏')) {
          reply = this.buildCollectGuide()
        } else if (input.includes('模板预览') || input.includes('模板结构') || input.includes('报表清单')) {
          this.openTemplatePreview()
          return
        } else if (input.includes('编制依据')) {
          this.openCaliberDetail()
          return
        } else if (input.includes('换算依据')) {
          const chs = this.stageChapters || []
          const list = chs.map((c, i) => (i + 1) + '. <b>' + c.name + '</b>：按锁定编制依据完成换算（明细可在右侧章节内展开「换算依据」查看）').join('\n')
          reply = '<b>【阶段三 · 口径换算依据】</b>\n' + (list || '本任务编制依据已在任务创建时锁定。') + '\n\n换算由确定性规则引擎执行、结论预计算，AI 不参与算数；换算明细供核查溯源。'
        } else if (input.includes('确认生成结果')) {
          this.confirmGenerate()
          return
        } else if (input.includes('异常')) {
          // 异常卡片归属阶段三（校验与异常处置已并入阶段三），此处按阶段三面板取数
          const cards = (this.activePanels[3] || {}).cards || []
          reply = cards.length
            ? '<b>【阶段三 · 校验异常处置建议】</b>\n' + cards.map((c, i) => (i + 1) + '. <b>' + c.title + '</b>\n   原因：' + c.desc + '\n   建议：' + c.suggest).join('\n') + '\n\n处置入口在阶段三面板顶部的校验区：可「确认处置」或「转人工核实」（转人工须填写偏差说明并盖章），处置结果写入修订留痕。'
            : '当前无待处置异常：定稿勾稽校验成立，可直接签字归档。'
        } else if (input.includes('转人工核实')) {
          reply = '请在阶段三面板顶部的校验区点击异常卡片「转人工核实」：责任移交人工后，须由经办人填写偏差合理解释并盖章方可放行文件产出。'
        } else if (input.includes('修订留痕')) {
          const revs = (this.activePanels[4] || {}).revisions || []
          reply = revs.length
            ? '<b>【阶段四 · 修订留痕（' + revs.length + ' 次）】</b>\n' + revs.map((r, i) => (i + 1) + '. [' + r.time + ' · ' + r.by + '] ' + r.text).join('\n') + '\n\n留痕覆盖校验异常处置、人工确认盖章、退回重算与签字归档等全部人工动作，随报告一并归档备查。'
            : '当前报告尚无修订记录。'
        } else if (input.includes('退回阶段三') || input.includes('退回阶段二')) {
          const to = input.includes('退回阶段二') ? 2 : 3
          this.returnToStage(to, to === 2 ? '退回阶段二重新补录' : '退回阶段三重新计算')
          return
        } else if (input.includes('修改数值') || input.includes('改动数值') || input.includes('调整数值')) {
          reply = '阶段四的关键核算指标已封存，<b>归档关口不提供就地修订</b>（否则已生成文件、阶段二采集源与阶段三校验结论会同时失效）。确需改动请走逆向流程：直接对我说「退回阶段三重新计算」或「退回阶段二重新补录」，退回动作会写入修订留痕，处理完成后需重新走确认归档。'
        } else if (input.includes('签字确认')) {
          this.confirmArchive()
          return
        } else if (input.includes('报告文件')) {
          reply = '报告文件已按锁定模板渲染完成（含数据表格与图表）：右侧「文件产出与确认归档」可点<b>「预览」</b>通读定稿版式全文，或从<b>「导出报告」</b>下拉选择 PDF / Word / Excel 等格式导出。'
        } else if (input.includes('进入文件产出')) {
          if (this.checkSummary.blocking) {
            this.verifyExpanded = true
            reply = '校验发现 <b>' + this.checkSummary.blocking + ' 项异常待处置</b>，请在面板顶部校验区完成处置（确认处置 / 转人工核实），清零后方可产出文件。'
          } else {
            this.gotoStage(4)
            return
          }
        } else if (input.includes('本阶段说明') || input.includes('介绍本阶段')) {
          const desc = { 1: '模板匹配：核对报送三要素（受理主管机关 / 频次 / 期次）与填报领域，锁定报告模板、适用范围与编制依据版本（可打开「模板结构预览」查看模板包含的章节）；主体核对：核对用能单位概况字段（主体标识 / 能源管理与资质 / 经济与能耗指标 / 签署信息，由企业档案带出）', 2: '从数据池采集成品指标，缺项由对话引导补录，闸门清零后放行', 3: '系统按锁定口径换算、结论预计算，AI 仅基于结论受控生成叙述（数字正则回查）；硬规则校验与异常处置已并入本阶段——校验区置于面板顶部，异常时自动展开，清零后方可产出文件', 4: '按锁定模板渲染文件并校验格式；数据一致性由前置勾稽校验把关（不平衡即阻断归档，一致性证据见「定稿版式通读」），归档关口不可就地修订；复核签发身份与内容指纹后签字归档，哈希锁定且不可撤销；确需改动核心数值可对我说「退回阶段三重新计算」' }
          reply = '阶段' + this.activeStage + '（' + stageNames[this.activeStage] + '）：' + desc[this.activeStage] + '。'
        } else if (input.includes('进度')) {
          reply = '「' + (this.activeTask ? this.activeTask.name : '') + '」当前处于阶段' + this.activeStage + '/4（' + stageNames[this.activeStage] + '），整体进度 ' + (this.activeTask ? this.activeTask.progress : 0) + '%。'
        } else {
          const tips = {
            1: '可核对报送三要素与用能单位概况，确认无误后进入数据采集。',
            2: '可在对话中补录缺项数据，或上传材料由系统解析回填；缺项清零后自动放行。',
            3: '可在面板顶部校验区查看校验结果并处置异常（确认处置 / 转人工核实），下方可展开章节查看换算依据与叙述；异常清零后可产出文件。',
            4: '可核验定稿版式通读与修订留痕，复核签发身份与内容指纹后签字归档；确需改动核心数值可对我说「退回阶段三重新计算」。'
          }
          reply = this.isDocumentMode
            ? ('当前为「<b>成稿校核</b>」模式：右侧已是按模板生成的完整报告（共 ' + this.docStats.total + ' 项，已确认 ' + this.docStats.confirmed + ' 项）。\n\n可以直接：\n• 点右侧任一项，我说明取值来源与校验情况\n• 说「下一个待确认」逐项核对\n• 说「改为 8,600」更正数值\n• 说「全篇校验」检查整体合规性')
            : ('当前处于阶段' + this.activeStage + '（' + stageNames[this.activeStage] + '）。' + (tips[this.activeStage] || ''))
        }
        this.wbMessages.push({ role: 'agent', text: reply })
        this.$nextTick(() => { if (this.$refs.wbMsgs) this.$refs.wbMsgs.scrollTo({ top: this.$refs.wbMsgs.scrollHeight, behavior: 'smooth' }) })
      }, 400)
    },
    goBack() { this.$router.go(-1) },
    sendMessageKey(e) { if (e.shiftKey) return; e.preventDefault(); this.sendMessage() },
    autoResizeTextarea() {
      const el = this.$refs.inputTextareaRef
      if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px' }
    },
    scrollBottom() {
      this.$nextTick(() => { if (this.$refs.chatMessages) this.$refs.chatMessages.scrollTo({ top: this.$refs.chatMessages.scrollHeight, behavior: 'smooth' }) })
    },
    // 对话回答联动右栏：回答"进度/任务"类问题自动切至报送任务页签，"日历/计划"类切至日历页签
    syncPanelByInput(input) {
      if (input.includes('进度') || input.includes('态势') || input.includes('本期') || input.includes('应报') || input.includes('任务')) this.rightPanel = 'reports'
      else if (input.includes('日历') || input.includes('计划') || input.includes('频次')) this.rightPanel = 'calendar'
    },
  }
}
</script>

<style scoped>
.report-submission-center { height: 100%; display: flex; gap: 12px; overflow: hidden; }

/* ========== 最左：历史对话栏（标准可收缩样式） ========== */
.rs-history-sidebar { flex: 0 0 200px; background: #fff; border-radius: 8px; display: flex; box-shadow: 0 2px 8px rgba(0,0,0,0.06); overflow: hidden; transition: flex-basis 0.2s; }
.rs-history-collapsed { flex-basis: 36px; }
.rs-history-toggle { width: 36px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; cursor: pointer; color: #909399; border-right: 1px solid #ebeef5; transition: color 0.2s; }
.rs-history-toggle:hover { color: var(--rs-color); }
.rs-history-vertical { writing-mode: vertical-lr; font-size: 13px; letter-spacing: 2px; }
.rs-history-content { flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 10px; }
.rs-history-head { display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 600; color: #303133; padding-bottom: 8px; border-bottom: 1px solid #ebeef5; margin-bottom: 8px; }
.rs-history-count { font-size: 13px; color: #909399; background: var(--rs-color-bg); border-radius: 8px; padding: 0 6px; }
.rs-history-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.rs-history-item { position: relative; padding: 8px 26px 8px 10px; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
.rs-history-item:hover { background: var(--rs-color-bg); }
.rs-history-active { background: var(--rs-color-bg); }
.rs-history-title { font-size: 13px; color: #303133; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rs-history-time { font-size: 12px; color: #c0c4cc; margin-top: 2px; }
.rs-history-del { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); color: #c0c4cc; font-size: 13px; cursor: pointer; }
.rs-history-del:hover { color: #f56c6c; }
.rs-history-empty { text-align: center; color: #c0c4cc; font-size: 13px; padding: 20px 0; }
.rs-history-empty i { font-size: 24px; display: block; margin-bottom: 6px; }

/* ========== 中：对话框 ========== */
.chat-panel { flex: 1; min-width: 0; background: #fff; border-radius: 8px; display: flex; flex-direction: column; box-shadow: 0 2px 8px rgba(0,0,0,0.06); overflow: hidden; position: relative; }

/* ========== 快捷指令浮层面板（与其他智能体一致） ========== */
.cmd-panel { position: absolute; bottom: 78px; left: 16px; right: 16px; background: #fff; border: 1px solid #ebeef5; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); z-index: 20; padding: 12px 14px; }
.cmd-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.cmd-panel-title { font-size: 13px; font-weight: 700; color: #303133; display: flex; align-items: center; gap: 5px; }
.cmd-panel-title i { color: var(--rs-color); }
.cmd-panel-close { color: #c0c4cc; cursor: pointer; font-size: 13px; }
.cmd-panel-close:hover { color: #909399; }
.cmd-panel-body { display: flex; gap: 16px; flex-wrap: wrap; }
.cmd-group { flex: 1; min-width: 140px; }
.cmd-group-title { font-size: 13px; color: #909399; margin-bottom: 6px; }
.cmd-list { display: flex; flex-direction: column; gap: 4px; }
.cmd-item { font-size: 13px; color: #303133; background: var(--rs-color-bg); border: 1px solid transparent; border-radius: 6px; padding: 6px 10px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all .15s; user-select: none; }
.cmd-item:hover { border-color: var(--rs-color-border); color: var(--rs-color); }
.cmd-item i { color: var(--rs-color); font-size: 13px; }
.chat-header { height: 48px; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #ebeef5; flex-shrink: 0; }
.header-title { display: flex; align-items: center; gap: 8px; }
.bot-avatar-sm { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.chat-name-highlight { font-size: 15px; font-weight: 600; color: #303133; }
.bot-status-dot { width: 7px; height: 7px; border-radius: 50%; background: #52c41a; }
.header-status { font-size: 13px; color: #909399; }
.header-actions { display: flex; align-items: center; gap: 12px; }
.toolbar-icon-sep {
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
  user-select: none;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid #dbe5f1;
  background: rgba(255, 255, 255, 0.7);
}
.toolbar-icon-sep:hover {
  border-color: var(--rs-color);
  color: var(--rs-color);
  background: rgba(255, 255, 255, 0.9);
}
.header-onboarding-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid #dbe5f1;
  background: rgba(255, 255, 255, 0.7);
  font-family: inherit;
}
.header-onboarding-btn:hover { color: var(--rs-color); border-color: var(--rs-color); background: rgba(255,255,255,0.9); }
.header-onboarding-btn i { font-size: 13px; }
.token-counter {
  font-size: 13px;
  color: #94a3b8;
  padding: 3px 10px;
  background: rgba(0,103,254,0.04);
  border: 1px solid rgba(0,103,254,0.08);
  border-radius: 10px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: inherit;
}
.token-counter i { font-size: 13px; color: #E6A23C; }
.chat-messages { flex: 1; overflow-y: auto; padding: 12px 16px; }
.msg { display: flex; gap: 8px; margin-bottom: 12px; }
.msg-user { flex-direction: row-reverse; }
.msg-avatar { width: 32px; height: 32px; border-radius: 50%; background: #ecf5ff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.msg-avatar i { font-size: 16px; }
.msg-body { max-width: 340px; }
/* 智能体回复与欢迎语统一宽度：flex:1 占满可用宽度（不随内容收缩），max-width 封顶；
   用户输入保持内容宽度的短气泡 */
.msg-agent .msg-body, .msg-welcome .msg-body { flex: 1 1 auto; max-width: min(640px, 72%); }
.msg-text { background: #f5f7fa; padding: 10px 12px; border-radius: 8px; font-size: 13px; line-height: 1.6; color: #303133; }
.msg-user .msg-text { background: var(--rs-color); color: #fff; }
.msg-time { font-size: 13px; color: #909399; margin-top: 4px; }

/* 注：原「快捷操作按钮」样式（.quick-actions / .quick-btn）随快捷按钮区一并移除，已无引用 */

/* 对话中的历史报告卡片 */
.chat-report-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
.chat-report-card { background: #fff; border: 1px solid #ebeef5; border-radius: 8px; padding: 10px 12px; cursor: pointer; transition: all 0.2s; }
.chat-report-card:hover { border-color: var(--rs-color); box-shadow: 0 2px 8px var(--rs-color-light); }
.crc-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.crc-name { font-size: 13px; font-weight: 600; color: #303133; }
.crc-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; }
.crc-meta { font-size: 13px; color: #909399; }
.crc-score { font-size: 13px; color: var(--rs-color); font-weight: 600; }

/* 注：原「内嵌创建表单」样式（.msg-form / .form-title / .form-actions）随临时报告改弹窗一并移除，已无引用 */

/* 输入区域 */
.chat-input-area { padding: 12px 16px; border-top: 1px solid #ebeef5; background: #fff; flex-shrink: 0; }
.input-box { background: #f5f7fa; border: 1px solid #e4e7ed; border-radius: 12px; padding: 8px 12px 4px; transition: border-color 0.2s, box-shadow 0.2s; }
.input-box:focus-within { border-color: var(--rs-color); box-shadow: 0 0 0 2px var(--rs-color-light); background: #fff; }
.input-textarea { width: 100%; border: none; outline: none; resize: none; background: transparent; font-size: 14px; line-height: 1.5; color: #303133; min-height: 20px; max-height: 120px; overflow-y: auto; font-family: inherit; }
.input-textarea::placeholder { color: #c0c4cc; }
.input-box-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 4px; }
.input-toolbar { display: flex; gap: 4px; }
.toolbar-icon { width: 28px; height: 28px; border-radius: 6px; background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; color: #909399; font-size: 14px; }
.toolbar-icon:hover { background: var(--rs-color-bg); color: var(--rs-color); }
.send-btn { width: 32px; height: 32px; border-radius: 50%; border: none; background: var(--rs-color); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px; transition: all 0.2s; flex-shrink: 0; }
.send-btn:hover:not(:disabled) { background: var(--rs-color-hover); transform: scale(1.05); }
.send-btn:disabled { background: #dcdfe6; color: #fff; cursor: not-allowed; }

/* ========== 右：任务窄栏（标准列表样式，四页签） ========== */
.rs-sidebar { flex: 0 0 clamp(320px, 27vw, 400px); background: #fff; border-radius: 8px; display: flex; flex-direction: column; box-shadow: 0 2px 8px rgba(0,0,0,0.06); overflow: hidden; }
/* 临时报告按钮：防 1080P 下文字贴边/折行，保持与筛选下拉的 6px 间隙 */
.rs-temp-btn { margin-left: 6px; padding: 7px 10px; white-space: nowrap; }
/* 左侧预警催办行：去盒子化，仅左侧彩色边框做重点（档位色随 urgency 联动），hover 变蓝 */
.rs-alert-lines { display: flex; flex-direction: column; gap: 2px; margin-top: 8px; }
.rs-alert-line { display: flex; align-items: flex-start; gap: 6px; font-size: 13px; line-height: 1.7; color: #606266; padding: 4px 6px 4px 10px; border-left: 3px solid #dcdfe6; cursor: pointer; transition: all .15s; }
.rs-alert-line.urg-accent-red { border-left-color: #F56C6C; }
.rs-alert-line.urg-accent-yellow { border-left-color: #E6A23C; }
.rs-alert-line.urg-accent-green { border-left-color: #dcdfe6; }
.rs-alert-line:hover { color: var(--rs-color); }
.rs-alert-line:hover .rs-alert-text b { color: var(--rs-color); }
.rs-alert-text b { color: #1e293b; }
/* 页签头：内容与分割线保持 12px 呼吸间距，层次更分明 */
.rs-tabs-header { display: flex; border-bottom: 1px solid #f0f2f5; flex-shrink: 0; margin-bottom: 12px; padding: 0 8px; }
.rs-tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; height: 48px; font-size: 13px; color: #606266; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
.rs-tab:hover { color: var(--rs-color); }
.rs-tab.active { color: var(--rs-color); font-weight: 600; border-bottom-color: var(--rs-color); }
.rs-tab-content { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.rs-toolbar { display: flex; gap: 8px; align-items: center; margin-bottom: 2px; }

/* 分区标题（本期应报 / 其他任务）：左侧竖条区分语义——主题色=行动区，灰=存档区 */
.rs-section-head { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: #303133; padding-left: 8px; border-left: 3px solid var(--rs-color); border-radius: 1px; margin: 12px 0 8px; }
.rs-section-head.muted { border-left-color: #dcdfe6; }
.rs-section-badge { font-size: 12px; color: var(--rs-color); background: var(--rs-color-bg); border-radius: 8px; padding: 0 6px; font-weight: 600; }
.rs-section-head.muted .rs-section-badge { color: #909399; background: #f5f7fa; }
.rs-section-note { margin-left: auto; font-size: 12px; color: #909399; font-weight: 400; }

/* 本期应报卡片（左侧主题色竖条强调） */
.rs-report-due { border-left: 3px solid var(--rs-color); }
.rs-rc-deadline { font-size: 13px; color: #606266; flex-shrink: 0; display: flex; align-items: center; gap: 2px; }
.rs-rc-deadline i { font-size: 13px; }
.rs-rc-deadline.urgent { color: #E6A23C; font-weight: 700; }

.rs-empty-mini { text-align: center; font-size: 13px; color: #909399; padding: 8px 0; background: var(--rs-color-bg); border-radius: 6px; }

/* 本期应报内部滚动区：恰好显示 3 张卡片，超出内部滚动（计数由分组徽章承担，不设文字提示） */
.rs-due-list { display: flex; flex-direction: column; gap: 10px; max-height: 290px; overflow-y: auto; flex-shrink: 0; padding-right: 2px; }
.rs-due-list::-webkit-scrollbar { width: 4px; }
.rs-due-list::-webkit-scrollbar-thumb { background: rgba(0,103,254,0.2); border-radius: 2px; }
/* 其他任务列表：与本期应报同构（间距/滚动上限/空态对齐，均 3 张卡） */
.rs-other-list { display: flex; flex-direction: column; gap: 10px; max-height: 290px; overflow-y: auto; flex-shrink: 0; padding-right: 2px; }
.rs-other-list::-webkit-scrollbar { width: 4px; }
.rs-other-list::-webkit-scrollbar-thumb { background: rgba(144,147,153,0.25); border-radius: 2px; }
/* ===== 临期视觉强化（URGENCY_CONFIG 统一驱动）：卡片左侧 Border 强调色 / 倒计时徽章着色 ===== */
.rs-report-card.urg-border-red { border-left: 3px solid #F56C6C; }
.rs-report-card.urg-border-yellow { border-left: 3px solid #E6A23C; }
.rs-report-card.urg-border-green { border-left: 3px solid #dcdfe6; }

/* 凭证 / 指纹标签：仅在存证底卷内使用（列表卡片不再透出，避免把凭证号与指纹当卡片信息展示） */
.rs-fp-tag { cursor: pointer; font-family: 'Exo 2', monospace; }
.rs-fp-tag:hover { border-color: var(--rs-color); color: var(--rs-color); }
/* ===== 存证底卷抽屉 ===== */
.rs-arch-body { padding: 0 20px 20px; overflow-y: auto; height: 100%; box-sizing: border-box; }
.rs-arch-head { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #1e293b; }
.rs-arch-meta { font-size: 13px; color: #94a3b8; margin: 6px 0 4px; }
.rs-arch-sec { border: 1px solid #ebeef5; border-radius: 6px; padding: 10px 12px; margin-top: 12px; }
.rs-arch-sec-title { font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
.rs-arch-sec-title i { color: var(--rs-color); margin-right: 4px; }
.rs-arch-row { display: flex; gap: 10px; font-size: 13px; line-height: 1.9; }
.rs-arch-row span { flex: 0 0 64px; color: #94a3b8; }
.rs-arch-row b { color: #303133; font-weight: 500; word-break: break-all; }
.rs-arch-fp { font-family: 'Exo 2', monospace; font-size: 13px; color: #475569; background: #f8fafc; border: 1px dashed #e2e8f0; border-radius: 4px; padding: 6px 8px; word-break: break-all; margin-bottom: 8px; }
.rs-arch-files { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
.rs-arch-actions { display: flex; gap: 8px; }
.rs-arch-item { display: flex; align-items: flex-start; gap: 8px; padding: 7px 0; border-bottom: 1px dashed #f0f2f5; }
.rs-arch-item:last-child { border-bottom: none; }
.rs-arch-item-type { flex: 0 0 52px; font-size: 12px; color: var(--rs-color); background: var(--rs-color-bg); border-radius: 3px; text-align: center; line-height: 18px; height: 18px; margin-top: 2px; }
.rs-arch-item-main { flex: 1; min-width: 0; }
.rs-arch-item-name { font-size: 13px; color: #303133; }
.rs-arch-item-note { font-size: 13px; color: #909399; line-height: 1.6; }
.rs-arch-item-act { flex-shrink: 0; font-size: 13px; color: var(--rs-color); cursor: pointer; margin-top: 2px; }
.rs-arch-item-act:hover { text-decoration: underline; }
.rs-arch-foot { margin-top: 14px; text-align: right; }
.rs-arch-jump { font-size: 13px; color: var(--rs-color); cursor: pointer; }
.rs-arch-jump:hover { text-decoration: underline; }

/* 报送排期页签（排期前瞻视图） */
.rs-calendar-intro { font-size: 13px; color: #606266; line-height: 1.6; background: var(--rs-color-bg); border: 1px solid var(--rs-color-border); border-radius: 6px; padding: 8px 10px; display: flex; gap: 6px; align-items: flex-start; flex-shrink: 0; }
.rs-calendar-intro i { color: var(--rs-color); margin-top: 2px; }
/* 排期规则工具栏：频次筛选 / 仅看启用开关 */
.rs-cal-toggle-on { color: #909399; }
.rs-cal-toggle-on.active { color: var(--rs-color); font-weight: 600; }
.rs-early-ok { color: #67c23a; }
.rs-cal-del-item { color: #f56c6c; }
/* 日历卡片组：占满剩余高度、内部滚动（页面级滚动收敛为卡片组内滚） */
.rs-cal-list { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 2px; }
.rs-cal-list::-webkit-scrollbar { width: 4px; }
.rs-cal-list::-webkit-scrollbar-thumb { background: rgba(0,103,254,0.2); border-radius: 2px; }
.rs-cal-card { border: 1px solid #ebeef5; border-radius: 8px; padding: 12px 14px; transition: all .2s; }
.rs-cal-card:hover { border-color: var(--rs-color-border); background: var(--rs-color-bg); }
.rs-cal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.rs-cal-dept { font-size: 13px; font-weight: 700; color: #606266; }
.rs-cal-name { font-size: 13px; font-weight: 700; color: #303133; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; min-width: 0; }
.rs-cal-next-tag { flex-shrink: 0; font-size: 12px; font-weight: 600; color: var(--rs-color); background: var(--rs-color-bg); border: 1px solid var(--rs-color-border); border-radius: 4px; padding: 0 5px; line-height: 16px; }
.rs-cal-row { font-size: 13px; color: #606266; line-height: 1.7; }
.rs-cal-row b { color: var(--rs-color); font-size: 13px; }
.rs-cal-actions { margin-top: 10px; display: flex; justify-content: flex-end; align-items: center; gap: 8px; }
/* 卡片操作按钮主次分明：默认文字链（无外框，灰色图标+文字，hover 变蓝），主要动作用幽灵按钮 */
.rs-early-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  transition: all .15s ease;
  user-select: none;
}
.rs-early-btn:hover { color: var(--rs-color); background: var(--rs-color-bg); }
.rs-early-btn.rs-primary-act {
  font-weight: 600;
  color: var(--rs-color);
  background: var(--rs-color-bg);
  border: 1px solid var(--rs-color-border);
  border-radius: 6px;
  padding: 4px 14px;
  white-space: nowrap;
}
.rs-early-btn.rs-primary-act:hover { background: var(--rs-color); color: #fff; }
.rs-early-btn.rs-primary-act.disabled { opacity: .45; cursor: not-allowed; }
.rs-early-btn.disabled { opacity: .45; cursor: not-allowed; }
/* 清零守卫置灰态：去蓝色底，视觉上与"可点亮"状态拉开 */
.rs-guard-off { background: #f5f7fa !important; border-color: #dcdfe6 !important; color: #a8abb2 !important; cursor: not-allowed; }
/* 停用状态的日历卡片整体弱化 */
.rs-cal-off { opacity: .6; }
.rs-cal-del { color: #F56C6C; background: #fef0f0; border-color: #fde2e2; }
.rs-cal-del:hover { background: #fde2e2; }
.rs-cp-del { color: #c0c4cc; cursor: pointer; font-size: 13px; flex-shrink: 0; }
.rs-cp-del:hover { color: #F56C6C; }
.rs-early-btn i { font-size: 13px; transition: transform .2s ease; }
.rs-early-btn:hover {
  background: var(--rs-color);
  border-color: var(--rs-color);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 103, 254, 0.3);
}
.rs-early-btn:hover i { transform: translateX(-2px); }
.rs-early-btn.disabled {
  color: #c0c4cc;
  background: #f5f7fa;
  border-color: #ebeef5;
  cursor: not-allowed;
  box-shadow: none;
}

/* 报告任务卡（窄栏列表） */
.rs-report-card { border: 1px solid #ebeef5; border-radius: 8px; padding: 12px; cursor: pointer; transition: all 0.2s; }
.rs-report-card:hover { border-color: var(--rs-color); box-shadow: 0 2px 8px var(--rs-color-light); }
.rs-rc-top { display: flex; gap: 10px; align-items: center; }
.rs-rc-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; font-size: 15px; }
.rs-rc-info { flex: 1; min-width: 0; }
.rs-rc-name { font-size: 13px; font-weight: 600; color: #303133; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rs-rc-meta { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
.rs-rc-type { font-size: 13px; color: #909399; }
.rs-rc-bottom { display: flex; align-items: center; gap: 6px; margin-top: 8px; }
.rs-rc-period { font-size: 13px; color: #606266; flex-shrink: 0; }
.rs-rc-score { font-size: 13px; color: var(--rs-color); font-weight: 600; flex-shrink: 0; }

/* 空态 */
.rs-empty { text-align: center; padding: 40px 0; color: #909399; }
.rs-empty i { font-size: 40px; margin-bottom: 8px; }
.rs-empty-link { color: var(--rs-color); cursor: pointer; font-size: 13px; margin-top: 8px; display: inline-block; }
.rs-empty-link:hover { color: var(--rs-color-hover); }

/* 响应式：窄屏隐藏历史栏 */
@media (max-width: 1100px) {
  .rs-history-sidebar { display: none; }
}

/* ========== 模态A增强：态势卡片（多任务聚合） ========== */
/* 欢迎消息放宽消息体，为态势卡片腾出完整展示宽度 */
.msg-welcome .msg-body { max-width: min(640px, 70%); }
/* 去嵌套化：解读卡不再做白底描边阴影的"卡中卡"，扁平融入气泡（数据条内格子承担层次） */
.rs-brief-card { margin-top: 10px; background: transparent; border: none; border-radius: 0; padding: 2px 2px; box-shadow: none; max-width: 100%; text-align: left; }
.rs-brief-head { font-size: 13px; font-weight: 700; color: #303133; display: flex; align-items: center; margin-bottom: 10px; }
.rs-brief-head > span:first-child { display: flex; align-items: center; gap: 6px; }
.rs-brief-head i { color: var(--rs-color); }
.rs-brief-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 8px; }
.rs-stat { background: #f8fafc; border-radius: 8px; padding: 8px 0 7px; text-align: center; }
.rs-stat b { display: block; font-size: 18px; line-height: 1.2; color: #1e293b; }
.rs-stat span { font-size: 13px; color: #909399; }
.rs-stat.warn b { color: #f56c6c; }
.rs-stat.info b { color: #E6A23C; }
.rs-stat.ok b { color: #67C23A; }
.rs-brief-cap { font-size: 13px; color: #b0b9c6; margin: 2px 4px 4px; }
.rs-brief-list { margin-top: 2px; max-height: 248px; overflow-y: auto; }
.rs-brief-list::-webkit-scrollbar { width: 4px; }
.rs-brief-list::-webkit-scrollbar-thumb { background: #dce4ef; border-radius: 2px; }
.rs-brief-item {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) 64px auto;
  align-items: center;
  gap: 10px;
  padding: 9px 4px;
  border-bottom: 1px dashed #eef2f7;
  cursor: pointer;
  transition: background .15s;
}
/* 排期解读变体（无倒计时列）：3 列网格，CTA 自然占位不挤压 */
.rs-brief-item.cal-variant { grid-template-columns: 10px minmax(0, 1fr) auto; }
.rs-brief-item.last { border-bottom: none; }
.rs-brief-item:hover { background: var(--rs-color-bg); }
.rs-brief-main { min-width: 0; }
.rs-brief-name { font-size: 13px; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; }
.rs-brief-sub { font-size: 13px; color: #64748b; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rs-brief-issue { margin-left: 6px; color: #d48806; }
.rs-brief-ddl { font-size: 13px; color: #64748b; }
.rs-brief-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  font-size: 13px;
  color: var(--rs-color);
  font-weight: 600;
  border: 1px solid var(--rs-color-border);
  border-radius: 12px;
  width: 88px;
  white-space: nowrap;
  transition: all .15s ease;
}
.rs-brief-item:hover .rs-brief-cta { background: var(--rs-color); border-color: var(--rs-color); color: #fff; }
.rs-brief-name { min-width: 0; font-size: 13px; color: #303133; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; }
.rs-brief-ddl { font-size: 13px; color: #909399; text-align: right; }
.rs-brief-cta { font-size: 13px; color: var(--rs-color); font-weight: 600; text-align: right; }
.rs-brief-more { margin-top: 6px; font-size: 13px; color: var(--rs-color); text-align: center; cursor: pointer; }
.rs-brief-more:hover { text-decoration: underline; }

/* 紧急度圆点（态势列表与右栏卡片共用） */
.rs-urg { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.u-red { background: #f56c6c; box-shadow: 0 0 0 3px rgba(245,108,108,.15); }
.u-yellow { background: #E6A23C; box-shadow: 0 0 0 3px rgba(230,162,60,.15); }
.u-green { background: #67C23A; }

/* ========== 模态A增强：右栏筛选与紧凑卡片 ========== */
/* 排期工具栏两行布局：第一行主操作（新建）+ 仅看启用（两端对齐）；控件统一 32px 高度 */
.rs-cal-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-shrink: 0; }
.rs-cal-add-btn { display: inline-flex; align-items: center; justify-content: center; gap: 4px; height: 32px; font-size: 13px; font-weight: 600; color: #fff; background: var(--rs-color); border: none; border-radius: 6px; padding: 0 16px; cursor: pointer; transition: all .2s; }
.rs-cal-add-btn:hover { background: var(--rs-color-hover, #0052CC); box-shadow: 0 2px 8px rgba(0, 103, 254, 0.3); }
.rs-cal-toolbar .rs-early-btn { height: 32px; font-size: 13px; }
.rs-cal-freq-select { width: 110px; margin-right: 6px; }
.rs-cal-freq-select .el-input__inner { height: 32px; line-height: 32px; border-radius: 6px; font-size: 13px; }
.rs-cal-add-btn:hover { background: var(--rs-color); color: #fff; border-style: solid; border-color: var(--rs-color); box-shadow: 0 2px 8px rgba(0, 103, 254, 0.3); }
.rs-cal-dlg-sec { font-size: 13px; font-weight: 700; color: #303133; margin: 4px 0 12px; padding-left: 8px; border-left: 3px solid var(--rs-color); }
/* 提报窗口实时预览（所见即所得） */
.rs-cal-dlg-hint { margin-top: 4px; font-size: 13px; color: var(--rs-color); background: var(--rs-color-bg); border-radius: 4px; padding: 3px 8px; display: inline-block; }
.rs-cal-dlg-match { background: var(--rs-color-bg); border: 1px solid var(--rs-color-border); border-radius: 6px; padding: 10px 12px; margin-bottom: 8px; }
.rs-cal-dlg-row { display: flex; align-items: baseline; gap: 8px; font-size: 13px; color: #606266; line-height: 1.8; }
.rs-cal-dlg-row .lbl { flex-shrink: 0; font-weight: 600; color: #303133; }
.rs-cal-dlg-tip { font-size: 13px; color: #909399; line-height: 1.6; margin-top: 6px; }
.rs-filter-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.rs-ft { font-size: 13px; color: #606266; background: #f5f7fa; border: 1px solid #ebeef5; border-radius: 10px; padding: 2px 10px; cursor: pointer; transition: all .15s; user-select: none; }
.rs-ft:hover { color: var(--rs-color); border-color: var(--rs-color-border); }
.rs-ft.active { color: #fff; background: var(--rs-color); border-color: var(--rs-color); }
.rs-compact { padding: 9px 12px; }
.rs-cp-title { display: flex; align-items: center; gap: 6px; min-width: 0; margin-bottom: 5px; }
.rs-cp-row { display: flex; align-items: center; gap: 6px; min-width: 0; }
.rs-cp-tags { display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0; }
.rs-cp-name { flex: 1; min-width: 0; font-size: 13px; font-weight: 600; color: #303133; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* 工作台头部的编制阶段副行（卡片状态行不展示阶段，仅此处保留） */
.rwb-stage-hint { font-size: 13px; color: #909399; margin-left: 4px; }
.rs-cp-extra { display: flex; align-items: center; margin-top: 6px; }
.rs-cp-meta { font-size: 13px; color: #909399; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rs-cp-crb { font-size: 13px; color: var(--rs-color); cursor: pointer; flex-shrink: 0; }
.rs-cp-crb:hover { text-decoration: underline; }
.rs-cp-pct { font-size: 13px; color: #606266; flex-shrink: 0; }
.rs-rc-cta { flex-shrink: 0; padding: 4px 8px; min-width: 84px; text-align: center; }

/* ========== 模态B：任务激活沉浸态（左对话35% + 右内容65%，同碳足迹任务详情范式） ========== */
.rs-workbench { flex: 1; min-width: 0; display: flex; gap: 12px; animation: rwb-in .25s ease; }
@keyframes rwb-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

/* 左：任务对话容器（35%） */
/* 副驾驶对话区：栅格 3:7（业务侧倾斜）；折叠态收为 48px 窄浮标，右侧作业区随之拉宽 */
.rwb-chat-panel { flex: 0 0 30%; min-width: 0; background: #fff; border-radius: 8px; display: flex; flex-direction: column; box-shadow: 0 2px 8px rgba(0,0,0,0.06); overflow: hidden; transition: flex-basis .25s ease; }
.rwb-chat-panel.is-collapsed { flex: 0 0 48px; cursor: pointer; }
.rwb-chat-rail { height: 100%; display: flex; flex-direction: column; align-items: center; gap: 14px; padding-top: 16px; color: var(--rs-color, #0067FE); }
.rwb-chat-rail > i { font-size: 16px; }
.rwb-rail-name { writing-mode: vertical-lr; letter-spacing: 3px; font-size: 13px; color: #606266; }
.rwb-chat-header { height: 48px; padding: 0 14px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ebeef5; flex-shrink: 0; }
.rwb-back { font-size: 13px; color: #606266; cursor: pointer; display: flex; align-items: center; gap: 3px; padding: 4px 10px; border-radius: 8px; border: 1px solid #dbe5f1; background: rgba(255,255,255,0.7); transition: all .2s; flex-shrink: 0; }
.rwb-back:hover { color: var(--rs-color); border-color: var(--rs-color); }
.rwb-chat-msgs { flex: 1; overflow-y: auto; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
.rwb-wb-msg { font-size: 13px; line-height: 1.6; padding: 8px 10px; border-radius: 8px; max-width: 92%; white-space: pre-wrap; word-break: break-word; }
.rwb-wb-msg.agent { background: #f5f7fa; color: #303133; align-self: flex-start; border-top-left-radius: 2px; }
.rwb-wb-msg.user { background: var(--rs-color); color: #fff; align-self: flex-end; border-top-right-radius: 2px; }
.rwb-chat-input-area { padding: 10px 12px; border-top: 1px solid #ebeef5; flex-shrink: 0; }

/* 右：阶段内容区（65%） */
.rwb-stage-panel { flex: 1; min-width: 0; background: #fff; border-radius: 8px; display: flex; flex-direction: column; box-shadow: 0 2px 8px rgba(0,0,0,0.06); overflow: hidden; }
.rwb-stage-head { padding: 10px 20px; border-bottom: 1px solid #ebeef5; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
.rwb-title { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.rwb-name { font-size: 15px; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rwb-meta { font-size: 13px; color: #909399; flex-shrink: 0; }
.rwb-deadline { font-size: 13px; color: #606266; display: flex; align-items: center; gap: 3px; flex-shrink: 0; }
.rwb-deadline.urgent { color: #E6A23C; font-weight: 700; }
.rwb-demo-tag { font-size: 12px; color: #909399; border: 1px solid #e4e7ed; border-radius: 8px; padding: 1px 8px; flex-shrink: 0; }

.rwb-stepper { display: flex; align-items: center; padding: 14px 24px; border-bottom: 1px solid #ebeef5; flex-shrink: 0; }
.rwb-step { display: flex; flex-direction: column; align-items: center; gap: 5px; cursor: pointer; }
.rwb-step-dot { width: 28px; height: 28px; border-radius: 50%; border: 2px solid #dcdfe6; background: #fff; color: #909399; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; transition: all .2s; }
.rwb-step-label { font-size: 13px; color: #909399; }
.rwb-step.active .rwb-step-dot { border-color: var(--rs-color); background: var(--rs-color); color: #fff; box-shadow: 0 0 0 4px var(--rs-color-bg); }
.rwb-step.active .rwb-step-label { color: var(--rs-color); font-weight: 700; }
.rwb-step.done .rwb-step-dot { border-color: var(--rs-color); color: var(--rs-color); }
.rwb-step.done .rwb-step-label { color: #606266; }
/* 阶段四按需进入：校验无异常时显示"校验通过"弱化态（仍可点击查看明细） */
.rwb-step.passed .rwb-step-dot { border-color: #67C23A; color: #67C23A; }
.rwb-step.passed .rwb-step-label { color: #67C23A; }
.rwb-step.passed.active .rwb-step-dot { border-color: var(--rs-color); background: var(--rs-color); color: #fff; }
.rwb-step.passed.active .rwb-step-label { color: var(--rs-color); }
.rwb-step-line { flex: 1; height: 2px; background: #ebeef5; margin: 0 8px 18px; }
.rwb-step-line.done { background: var(--rs-color); }

.rwb-main { flex: 1; min-width: 0; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; }
/* 阶段面板撑满滚动容器高度，使底部动作栏可吸底（sticky 受包含块限制，面板高度不足则失效） */
.rwb-panel { display: flex; flex-direction: column; flex: 1 0 auto; min-height: 0; }
.rwb-panel-title { font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
.rwb-panel-title i { color: var(--rs-color); }

/* 阶段一：pd-section 分节卡片（对齐零碳工厂范式） */
.rs-pd-section { margin-bottom: 16px; }
.rs-pd-title { font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 8px; padding-left: 8px; border-left: 3px solid var(--rs-color); display: flex; align-items: center; gap: 6px; }
/* 标题旁锁定语义提示图标：常驻低调、悬浮显示说明（收纳原常驻说明文字） */
.rs-pd-lock-tip { font-size: 14px; color: #c0c4cc; cursor: help; transition: color .15s; }
.rs-pd-lock-tip:hover { color: var(--rs-color); }
.rs-pd-card { background: rgba(255,255,255,0.65); border: 1px solid rgba(0,103,254,0.08); border-radius: 10px; padding: 10px 12px; }
.rs-pd-tagrow { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px 28px; }
.rs-pd-fact { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
.rs-pd-fact b { font-size: 13px; color: #0f172a; white-space: nowrap; }
.rs-pd-bd-label { font-size: 13px; color: #475569; flex-shrink: 0; }
.rs-pd-card-sub { font-size: 13px; color: #64748b; margin-top: 4px; line-height: 1.6; }
.rs-pd-collapse-head { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; padding: 2px 0; }
.rs-pd-collapse-head:hover .rs-pd-card-name { color: var(--rs-color); }
.rs-pd-card-name { font-size: 13px; font-weight: 600; color: #1e293b; }
.rs-pd-edit-row { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #475569; padding: 4px 0; }
/* 用能单位概况：双列信息栅格（对齐零碳工厂企业基本信息的行式表单形态） */
.rs-pd-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; }
.rs-pd-info-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #475569; min-width: 0; }
.rs-pd-info-item .rs-pd-bd-label { flex-shrink: 0; width: 84px; }
/* 用能单位概况：分组卡片（主体标识 / 能源管理与资质 / 经济与能耗指标） */
.rs-prof-card { margin-bottom: 8px; }
.rs-prof-head-row { display: flex; align-items: center; gap: 6px; padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px dashed #ebeef5; }
.rs-prof-head-row.is-clickable { cursor: pointer; user-select: none; }
.rs-prof-head-row.is-clickable:hover .rs-prof-name { color: var(--rs-color); }
.rs-prof-arrow { margin-left: 6px; font-size: 13px; color: #94a3b8; }
.rs-prof-head-row i { font-size: 13px; color: var(--rs-color); }
.rs-prof-name { font-size: 13px; font-weight: 600; color: #1e293b; }
.rs-prof-count { margin-left: auto; font-size: 13px; color: #64748b; font-variant-numeric: tabular-nums; }
.rs-prof-count.has-missing { color: #e6a23c; font-weight: 600; }
.rs-prof-unit { flex-shrink: 0; font-size: 13px; color: #94a3b8; }
.rs-prof-src-note { margin-left: auto; font-size: 13px; color: #94a3b8; font-weight: 400; }
.rs-prof-src { flex-shrink: 0; }
/* 经济与能耗指标表：指标 / 单位 / 本期 / 上年 / 同比 / 说明（灰底容器 + 渐变表头 + 白底行） */
.rs-prof-table { display: flex; flex-direction: column; gap: 2px; background: #EEF2FD; border: none; border-radius: 6px; padding: 8px 6px; overflow: hidden; }
.rs-prof-thead, .rs-prof-trow {
  display: grid;
  grid-template-columns: 1.6fr 0.8fr 1fr 1fr 0.9fr 1.5fr;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
}
.rs-prof-thead {
  background: linear-gradient(180deg, rgba(54,177,235,.2), rgba(1,103,231,.2));
  border-radius: 4px 4px 0 0;
  font-size: 13px;
  font-weight: 500;
  color: #1E293B;
}
.rs-prof-trow { background: #FFFFFF; border-top: none; font-size: 13px; color: #475569; font-variant-numeric: tabular-nums; }
.rs-prof-trow:hover { background: #fafcff; }
.rs-prof-tname { font-weight: 500; color: #1e293b; }
.rs-prof-tunit { font-size: 13px; color: #94a3b8; }
.rs-prof-yoy { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; color: #64748b; }
.rs-prof-yoy.up { color: #d4380d; }
.rs-prof-yoy.down { color: #389e0d; }
.rs-span2 { grid-column: 1 / -1; }
.rs-pd-static { color: #303133; font-weight: 600; flex: 1; min-width: 0; }
.rs-pd-check-head { display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 600; color: #94a3b8; padding: 2px 0 6px; border-bottom: 1px dashed #ebeef5; }
.rs-pd-check-head span:nth-child(1) { flex: 0 0 92px; }
.rs-pd-check-head span:nth-child(2) { flex: 1; }
.rs-pd-check-head span:nth-child(3) { flex: 0 0 150px; }
.rs-pd-check-head span:nth-child(4) { flex: 0 0 90px; text-align: right; }
.rs-pool-ch { flex: 0 0 92px; font-weight: 700; color: #606266; }
.rs-pool-items { flex: 1; min-width: 0; padding-right: 8px; }
.rs-pd-activate { margin-top: 10px; background: #fdf6ec; border: 1px solid #faecd8; border-radius: 6px; padding: 8px 10px; font-size: 13px; color: #9a6b1f; display: flex; align-items: center; gap: 6px; }
.rs-pd-activate i { color: #E6A23C; font-size: 13px; }
.rwb-lock-note { font-size: 13px; color: #909399; margin-top: 6px; display: flex; align-items: center; gap: 4px; }

/* （阶段一 arch 三段式与来源标注样式已由 rs-pd 分节卡片范式替代） */

/* 边界标签组 */
.rwb-bnd-sources { display: flex; align-items: flex-start; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
.rwb-bnd-src { margin: 1px 2px 1px 0; }

/* 底部流转动作栏：内容短时贴底（margin-top:auto），内容长时随滚动吸底（sticky） */
.rwb-actionbar {
  position: sticky;
  bottom: -20px;
  margin: auto -24px -20px;
  padding: 12px 24px;
  background: #fff;
  border-top: 1px solid #ebeef5;
  box-shadow: 0 -2px 8px rgba(15, 35, 70, 0.04);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  z-index: 5;
}
.rwb-ab-note { font-size: 13px; color: #909399; }
/* 底部闸门动态闭环：清零转绿放行；缺项清单可点击定位 */
.rwb-actionbar.is-complete .rwb-ab-note { color: #67c23a; font-weight: 600; }
.rwb-ab-link { color: var(--rs-color, #0067FE); cursor: pointer; margin: 0 2px; }
.rwb-ab-link:hover { text-decoration: underline; }
/* 顶部作业看板第二行：视图切换 + 全局补录快捷通道 */
.rwb-focus-line { display: flex; align-items: center; margin-top: 8px; }
.rwb-focus-actions { margin-left: auto; display: flex; align-items: center; }
.rwb-focus-actions .el-button--text { padding: 0 4px; }
/* 底栏缺项明细：章节名后的"差 N 项"说明文本（弱化，不抢链接） */
.rwb-ab-gap { color: #b0b8c4; }
/* 阶段四格式校验结论胶囊（替代原先一整串连排灰字） */
.rwb-fmt-caps { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.rwb-fmt-cap { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: #1f7a4d; background: #eefaf3; border: 1px solid #cdebd9; border-radius: 999px; padding: 3px 10px; cursor: default; }
.rwb-fmt-cap i { font-size: 13px; }
/* 阶段四逆向流程条：改动核心数值只能退回前置环节（归档关口不就地开倒车） */
.rwb-revert-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; padding: 8px 12px; background: #fffaf0; border: 1px dashed #f0d9a8; border-radius: 6px; font-size: 13px; color: #8a6d3b; }
.rwb-revert-bar i { color: #e6a23c; }
.rwb-revert-bar span { flex: 1; min-width: 220px; }
/* 注：定稿勾稽算式行样式已随面板展示一并移除（勾稽判定仍在闸门内生效） */
/* 缺失字段直达后的输入框短暂高亮（与防呆琥珀色一致） */
.rwb-flash-focus { box-shadow: 0 0 0 2px #f0a300 !important; }
.rwb-ch-row.rwb-flash-focus .el-input__inner { box-shadow: 0 0 0 2px #f0a300 !important; background: #fffdf5; }
/* 缺项章节卡片态：本期值输入框琥珀虚线（待补录落焦），填后 ✓ 正向消除反馈 */
.rwb-chapter.is-missing .el-input__inner { border: 1px dashed #f0a300; background: #fffdf5; }
.rwb-chapter.is-missing .el-input__inner:focus { border-color: #f0a300; background: #fff; }
.rwb-fd-ok { color: #67c23a; margin-left: 4px; font-size: 13px; }
/* 字段行视觉层级：上期参考值 / 口径说明弱化为事实参考 */
.rwb-ch-row .rwb-fd-hint, .rwb-ch-row .rwb-fd-ref { color: #94a3b8; }
/* 免填摘要条：默认单行收敛（ellipsis），点击展开判定说明 */
.rwb-na-note { cursor: pointer; flex-wrap: wrap; }
.rwb-na-summary { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rwb-na-arrow { margin-left: auto; color: #c0c4cc; flex-shrink: 0; }
.rwb-na-detail { flex-basis: 100%; font-size: 13px; color: #909399; line-height: 1.7; }
/* 是/否 枚举字段：行内 Segmented 单选，点一下完成补录 */
.rwb-fd-bool { display: inline-flex; }
.rwb-bool-opt { font-size: 13px; padding: 3px 10px; border: 1px solid #dcdfe6; color: #606266; cursor: pointer; background: #fff; }
.rwb-bool-opt:first-child { border-radius: 3px 0 0 3px; }
.rwb-bool-opt:last-child { border-radius: 0 3px 3px 0; border-left: none; }
.rwb-bool-opt:hover { color: var(--rs-color, #0067FE); }
.rwb-bool-opt.active { background: var(--rs-color, #0067FE); border-color: var(--rs-color, #0067FE); color: #fff; }
/* 消番保留态：刚补齐章节置灰折叠，归位前保持界面稳定 */
.rwb-chapter.is-done .rwb-ch-head { opacity: .6; }
.rwb-chapter.is-done .rwb-ch-head:hover { opacity: 1; }
/* 闸门放行：主按钮脉冲引导视觉下落过渡到阶段三 */
.rwb-pulse { animation: rwbPulse 1.6s ease-in-out infinite; }
@keyframes rwbPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(103, 194, 58, .45); } 50% { box-shadow: 0 0 0 8px rgba(103, 194, 58, 0); } }
/* V5.1 附录 A：TIER 来源分级徽标（文本层） */
.rwb-tier-tag { font-size: 12px; border-radius: 8px; padding: 0 7px; margin-left: 6px; border: 1px solid #e4e9f2; color: #64748b; background: #f8fafc; white-space: nowrap; }
.rwb-tier-tag.TIER_1_OFFICIAL { color: #2e7d32; border-color: #c8e6c9; background: #f1f8e9; }
.rwb-tier-tag.TIER_2_SYSTEM { color: #0067FE; border-color: #cfe0ff; background: #f0f6ff; }
.rwb-tier-tag.TIER_3_MANUAL { color: #b26a00; border-color: #ffe2b8; background: #fff8ec; }
/* V5.1 附录 A：issues[] 问题列表（简化模型：异动/守恒/缺项） */
.rwb-issues { margin: 4px 0 6px; display: flex; flex-direction: column; gap: 3px; }
/* 异动预警：去彩盒改左彩边（档位色），与处置卡同构，降低视觉噪点 */
.rwb-issue { display: flex; align-items: baseline; gap: 6px; font-size: 13px; line-height: 1.6; padding: 3px 8px 3px 10px; border-left: 3px solid #dcdfe6; background: transparent; }
.rwb-issue i { flex-shrink: 0; }
.rwb-issue.is-blocking { border-left-color: #F56C6C; color: #c45656; }
.rwb-issue.is-warning { border-left-color: #E6A23C; color: #b88230; }
.rwb-issue.is-info { border-left-color: #c9d6ea; color: #64748b; }
.rwb-issue-desc b { margin-right: 4px; }
.rwb-issue-fix { margin-left: auto; color: #94a3b8; text-align: right; }
/* EXEMPT 豁免判定依据 */
.rwb-exempt-basis { display: flex; align-items: flex-start; gap: 6px; font-size: 13px; line-height: 1.7; color: #2e7d32; background: #f1f8e9; border: 1px solid #c8e6c9; border-radius: 6px; padding: 6px 10px; margin-top: 6px; }
.rwb-exempt-basis i { flex-shrink: 0; margin-top: 2px; }

/* 工作台对话建议气泡 */
.rwb-wb-sugs { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 7px; }
.rwb-wb-sug { font-size: 13px; color: var(--rs-color); background: #fff; border: 1px solid var(--rs-color-border); border-radius: 12px; padding: 3px 10px; cursor: pointer; transition: all .15s; user-select: none; }
.rwb-wb-sug:hover { background: var(--rs-color); color: #fff; }

/* （阶段一旧样式已由报送档案三段式替代） */
.rwb-progress-line { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.rwb-progress-text { font-size: 13px; color: #606266; flex-shrink: 0; }
/* ===== 阶段一 Scope 主工作台（PRD V5.2 3.2）：锁定徽章 / 依据警示条 / 范围裁定卡 / 抽屉链接 ===== */
.rwb-lock-badge { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: #1E293B; background: #f0f7ff; border: 1px solid #cfe3ff; border-radius: 6px; padding: 6px 12px; margin-bottom: 14px; }
.rwb-lock-badge i { color: #0067FE; }
.rwb-lock-badge .rwb-lock-sub { color: #94a3b8; font-size: 13px; }
.rwb-warn-banner { display: flex; align-items: flex-start; gap: 6px; font-size: 13px; line-height: 1.6; color: #b8860b; background: #fffbe6; border: 1px solid #ffe58f; border-radius: 6px; padding: 7px 10px; margin-bottom: 10px; }
.rwb-warn-banner i { color: #e6a23c; margin-top: 2px; flex-shrink: 0; }
.rwb-scope-row { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: #303133; line-height: 1.7; margin-bottom: 8px; flex-wrap: wrap; }
.rwb-scope-row .rs-pd-bd-label { flex: 0 0 64px; padding-top: 1px; }
.rwb-scope-sub { color: #94a3b8; font-size: 13px; }
.rwb-scope-basis { color: #909399; font-size: 13px; margin-left: auto; }
.rwb-drawer-link { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--rs-color, #0067FE); cursor: pointer; margin-top: 2px; }
.rwb-drawer-link:hover { text-decoration: underline; }
.rwb-pill-row { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0 10px 74px; }
.rwb-pill { max-width: 100%; }
.rwb-pill .el-tag { overflow: hidden; text-overflow: ellipsis; }
/* 编制依据抽屉：内边距收紧，垂直阅读 */
/* ===== 编制依据抽屉（Trust & Authority）：凭证化头部 + 依据声明块 + 轻量键值行 =====
   （抽屉骨架 header/body 的留白规则在文件末尾全局块——append-to-body 元素不吃 scoped 属性） */
.rwb-cal-title { display: flex; align-items: center; gap: 10px; }
.rwb-cal-title > i { font-size: 20px; color: var(--rs-color, #0067FE); }
.rwb-cal-title-main { font-size: 15px; font-weight: 700; color: #0f172a; line-height: 1.3; }
.rwb-cal-title-sub { font-size: 13px; color: #94a3b8; margin-top: 3px; }
/* 依据声明：信任凭证块（名称 + 标准号 + 现行徽章） */
.rwb-cal-declare { display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #f0f7ff, #f8fbff); border: 1px solid #cfe3ff; border-radius: 8px; padding: 12px 14px; }
.rwb-cal-declare-main { flex: 1; min-width: 0; }
.rwb-cal-declare-main b { display: block; font-size: 14px; color: #0f172a; line-height: 1.4; }
.rwb-cal-declare-code { font-size: 13px; color: #64748b; margin-top: 3px; }
/* ===== 阶段二信息层级重构：字段级统计行 / 豁免收纳 / 事件驱动线索卡 / 复合处置卡片 ===== */
.rwb-stat-line { display: flex; align-items: baseline; gap: 12px; font-size: 13px; color: #606266; margin-bottom: 12px; flex-wrap: wrap; }
.rwb-stat-line b { font-size: 15px; color: #1E293B; font-variant-numeric: tabular-nums; margin: 0 2px; }
.rwb-stat-line b.ok { color: #67c23a; }
.rwb-stat-line b.warn { color: #e6a23c; }
.rwb-stat-line b.danger { color: #f56c6c; }
.rwb-stat-sep { color: #dcdfe6; }
/* 豁免依据：底部折叠收纳（中性灰虚线框，不再用黄色提示条抢视线） */
.rwb-exempt-fold { display: flex; align-items: flex-start; gap: 6px; font-size: 13px; line-height: 1.7; color: #909399; background: #fafafa; border: 1px dashed #e4e7ed; border-radius: 6px; padding: 7px 10px; margin-top: 12px; cursor: pointer; flex-wrap: wrap; }
.rwb-exempt-fold i { color: #c0c4cc; margin-top: 2px; flex-shrink: 0; }
.rwb-exempt-summary { flex: 1; min-width: 0; }
.rwb-exempt-arrow { margin-left: auto; }
.rwb-exempt-detail { flex-basis: 100%; font-size: 13px; color: #909399; line-height: 1.7; }
/* 填报线索消息（对话形态）：由小易在对话流中提出，样式与普通 Agent 消息一致，仅一键填入按钮做强调 */
/* 消息内「一键填入」样式在文件末尾全局块——v-html 注入的内容不带 scoped 属性 */
/* 复合阻断处置卡片：差异归因 → 规则确认 → 消除违背（卡片内闭环） */
.rwb-dispose { border: 1px solid #eef2f7; border-left: 3px solid #F56C6C; background: #fafafa; border-radius: 6px; padding: 10px 12px; margin: 8px 0; }
/* 处置条（收起态）：一行轻量提示，点击展开三步表单，不常驻打断填表 */
.rwb-dispose-bar { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #c45656; background: #fafafa; border-left: 3px solid #F56C6C; border-radius: 4px; padding: 5px 10px; margin: 8px 0; }
.rwb-dispose-bar i { flex-shrink: 0; }
.rwb-dispose-toggle { margin-left: auto; color: var(--rs-color, #0067FE); cursor: pointer; flex-shrink: 0; }
.rwb-dispose-toggle:hover { text-decoration: underline; }
.rwb-ds-locate { color: var(--rs-color, #0067FE); cursor: pointer; }
.rwb-ds-locate:hover { text-decoration: underline; }
.rwb-dispose-head { font-size: 13px; font-weight: 600; color: #c45656; margin-bottom: 8px; }
.rwb-dispose-step { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #606266; margin-bottom: 6px; flex-wrap: wrap; }
.rwb-dispose-step:last-child { margin-bottom: 0; }
.rwb-ds-no { flex: 0 0 16px; height: 16px; line-height: 16px; text-align: center; border-radius: 50%; background: #c45656; color: #fff; font-size: 12px; }
.rwb-ds-chip { font-size: 13px; padding: 3px 10px; border: 1px solid #dcdfe6; border-radius: 20px; background: #fff; cursor: pointer; color: #606266; transition: all .15s; }
.rwb-ds-chip:hover { border-color: var(--rs-color, #0067FE); color: var(--rs-color, #0067FE); }
.rwb-ds-chip.active { background: var(--rs-color, #0067FE); border-color: var(--rs-color, #0067FE); color: #fff; }
.rwb-ds-hint { font-size: 13px; color: #909399; }
/* 工作台表格：灰底容器 + 渐变表头块 + 白底数据行（与零碳工厂表格体系统一） */
.rwb-table { display: flex; flex-direction: column; gap: 2px; background: #EEF2FD; border: none; border-radius: 6px; padding: 8px 6px; overflow: hidden; }
.rwb-tr {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  font-size: 13px;
  color: #303133;
  border-bottom: none;
  background: #FFFFFF;
  font-variant-numeric: tabular-nums;
}
.rwb-tr:last-child { border-bottom: none; }
.rwb-tr > span { flex: 1; min-width: 0; }
.rwb-tr.rwb-th {
  display: flex;
  align-items: stretch;
  gap: 4px;
  height: 28px;
  padding: 0;
  background: transparent;
  border-bottom: none;
  font-weight: 500;
  color: #1E293B;
  font-size: 13px;
}
.rwb-tr.rwb-th > span {
  display: flex;
  align-items: center;
  padding: 0 8px;
  background: linear-gradient(180deg, rgba(54,177,235,.2), rgba(1,103,231,.2));
  border-radius: 4px 4px 0 0;
  color: #1E293B;
  font-size: 13px;
  font-weight: 500;
  line-height: 16px;
}
.text-ok { color: #67C23A; }
.text-warn { color: #E6A23C; }
.text-muted { color: #909399; font-size: 13px; }
.text-strong { font-weight: 700; color: var(--rs-color); }
.rwb-missing-note { display: flex; align-items: flex-start; gap: 6px; font-size: 13px; line-height: 1.6; color: #b8860b; background: #fffbe6; border: 1px solid #ffe58f; border-radius: 6px; padding: 7px 10px; margin-bottom: 10px; }
/* 明细列：序号 / 数据项 / 单位 / 口径 / 上期值（章节数据项明细使用） */
.rwb-fd-idx { flex: 0 0 16px; height: 16px; line-height: 16px; text-align: center; background: #E2ECFE; color: #0067FE; border-radius: 3px; font-size: 12px; }
.rwb-fd-name { flex: 0 0 25%; color: #1E293B; }
.rwb-fd-unit { flex: 0 0 64px; color: #0067FE; }
.rwb-fd-hint { flex: 1; color: #94a3b8; line-height: 1.5; }
.rwb-fd-ref { flex: 0 0 110px; text-align: right; color: #909399; font-variant-numeric: tabular-nums; }
/* 在线填报列：缺项章节可直接填写本期值（填完即采集） */
.rwb-fd-fill { flex: 0 0 210px; text-align: left; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.rwb-fd-filled { color: #1E293B; font-variant-numeric: tabular-nums; }
.rwb-fd-unit-txt { font-style: normal; color: #94a3b8; font-size: 13px; }
.rwb-fd-unit-ext { font-size: 13px; color: #94a3b8; }
/* 本期填报输入框：单位内嵌为后缀附加块，数字与单位不再脱节 */
.rwb-fd-input { flex: 0 0 168px; }
.rwb-fd-input .el-input__inner { text-align: right; font-variant-numeric: tabular-nums; }
.rwb-fd-input .el-input-group__append { padding: 0 8px; background: #f5f7fa; color: #64748b; font-size: 13px; }
/* 章节数据项明细：按报表章节分组折叠 */
.rwb-panel-sub { margin-left: 8px; font-size: 13px; font-weight: 400; color: #94a3b8; }
.rwb-panel-name { flex-shrink: 0; white-space: nowrap; }
.rwb-chapters { display: flex; flex-direction: column; gap: 4px; }
/* ===== 报告成文画布：左目录索引 + 右连续纸张流（底面合一） ===== */
.rwb-doc-layout { display: flex; align-items: flex-start; gap: 14px; }
.rwb-doc-toc { position: sticky; top: 0; flex: 0 0 220px; width: 220px; background: #F7FAFF; border: 1px solid #E6ECF5; border-radius: 8px; padding: 10px 8px; font-size: 13px; max-height: 70vh; overflow-y: auto; }
.rwb-toc-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #1E293B; padding: 2px 6px 8px; }
.rwb-toc-fold { margin-left: auto; cursor: pointer; color: #94a3b8; font-size: 13px; }
.rwb-toc-fold:hover { color: var(--rs-color); }
.rwb-doc-toc.is-collapsed { flex: 0 0 40px; width: 40px; padding: 10px 4px; }
.rwb-doc-toc.is-collapsed .rwb-toc-title { justify-content: center; padding: 2px 0 8px; }
.rwb-doc-toc.is-collapsed .rwb-toc-fold { margin-left: 0; }
.rwb-doc-toc.is-collapsed .rwb-toc-item { justify-content: center; gap: 3px; padding: 6px 2px; flex-direction: column; }
.rwb-toc-idx { font-style: normal; font-size: 12px; color: #94a3b8; font-variant-numeric: tabular-nums; }
.rwb-doc-toc.is-collapsed .rwb-toc-guard { justify-content: center; padding: 6px 2px; }
.rwb-toc-list { display: flex; flex-direction: column; gap: 1px; }
.rwb-toc-item { display: flex; align-items: center; gap: 6px; padding: 6px 6px; border-radius: 5px; cursor: pointer; color: #475569; transition: background-color .15s; }
.rwb-toc-item:hover { background: #EFF5FF; }
.rwb-toc-item.is-active { background: #E8F1FF; color: var(--rs-color); font-weight: 600; }
.rwb-toc-item i { flex-shrink: 0; font-size: 13px; }
.rwb-toc-item i.is-ok { color: #67C23A; }
.rwb-toc-item i.is-warn { color: #E6A23C; }
.rwb-toc-item i.is-block { color: #F56C6C; }
.rwb-toc-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rwb-toc-badge { flex-shrink: 0; font-style: normal; font-size: 12px; border-radius: 8px; padding: 0 5px; }
.rwb-toc-badge.is-ok { color: #529b2e; background: #f0f9eb; }
.rwb-toc-badge.is-warn { color: #b88230; background: #fdf6ec; }
.rwb-toc-badge.is-block { color: #c45656; background: #fef0f0; }
.rwb-toc-badge.is-review { color: #b88230; background: #fdf6ec; }
.rwb-toc-badge.is-edited { color: #64748b; background: #f1f5f9; }
/* 画布内改动导航器：审阅不跳窗 */
/* 章节工具条：AI 改写风格控制（文体 × 受众） */
.rwb-canvas-style { display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap; margin-top: 10px; padding: 6px 10px; background: #F4F7FE; border-radius: 6px; }
.rwb-canvas-style-aud { font-size: 13px; color: #606266; padding: 0 2px; }
.rwb-canvas-style-tip { font-size: 13px; color: #94a3b8; }
.rp-style-group { display: inline-flex; align-items: center; gap: 4px; margin-right: 6px; }
.rp-style-label { font-size: 13px; color: #94a3b8; }
.rp-style-sel { width: 104px; }
.rp-style-sel.is-narrow { width: 92px; }
.rp-style-sel >>> .el-input__inner { height: 24px; line-height: 24px; font-size: 13px; padding: 0 6px; }

.rwb-canvas-polish-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; padding: 8px 12px; background: #fdf6ec; border: 1px solid #faecd8; border-radius: 8px; font-size: 13px; color: #b88230; }
.rwb-canvas-polish-bar i { color: #E6A23C; }
.rwb-canvas-polish-bar b { font-variant-numeric: tabular-nums; }
.rwb-canvas-polish-bar em { font-style: normal; color: #c9a06a; font-size: 13px; }
.rwb-cpb-actions { margin-left: auto; display: inline-flex; gap: 6px; }
/* 改写工具条：常态隐藏，悬停该段才出现（保持文档清爽） */
.rwb-canvas-tools { opacity: 0; transition: opacity .15s; }
.rwb-narrative:hover .rwb-canvas-tools { opacity: 1; }
/* 段落被选中 / 就地编辑时工具条常显：风格下拉与改写动作无需 hover 即可见 */
.rwb-canvas-tools.is-pinned { opacity: 1; }
/* 就地编辑：公文段落排版 + 编辑态可感知 */
.rwb-canvas-para { font-size: 13.5px; line-height: 1.95; color: #303133; margin: 0; text-align: justify; letter-spacing: .2px; border-radius: 4px; padding: 2px 4px; margin-left: -4px; transition: background-color .15s, box-shadow .15s; }
.rwb-canvas-para:not([contenteditable="true"]):hover { background: #f8fbff; }
.rwb-canvas-para.is-editing { background: #fffdf7; box-shadow: 0 0 0 1px #f5dab1 inset; outline: none; cursor: text; }
/* 选区微调胶囊 */
.rwb-canvas-selbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 6px; padding: 5px 10px; border-radius: 14px; background: rgba(244, 248, 255, .92); border: 1px solid var(--rs-color-border); font-size: 13px; }
.rwb-sel-hint { color: #8a94a6; }
.rwb-sel-hint i { color: var(--rs-color); }
.rwb-canvas-selbar .rp-tool { color: var(--rs-color); cursor: pointer; }
.rwb-canvas-selbar .rp-tool.is-primary { font-weight: 600; }
/* 锁定横幅：只读态显著可辨 */
.rwb-canvas-locked { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; padding: 8px 12px; border-radius: 8px; background: #f4f4f5; border: 1px solid #e4e7ed; color: #909399; font-size: 13px; }
.rwb-canvas-locked i { color: #a8abb2; }
/* 人工修订留痕标记（脚注） */
.rwb-edit-chip { display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0; font-size: 13px; color: #64748b; background: #f1f5f9; border-radius: 10px; padding: 2px 9px; }
.rwb-edit-chip.is-num { color: #b88230; background: #fdf6ec; }
.rwb-toc-sub { font-size: 13px; color: #94a3b8; padding: 10px 6px 6px; border-top: 1px dashed #E6ECF5; margin-top: 8px; }
.rwb-toc-annex { display: flex; flex-direction: column; gap: 1px; }
.rwb-toc-annex-item { padding: 4px 6px; border-radius: 5px; color: #64748b; font-size: 13px; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rwb-toc-annex-item:hover { background: #EFF5FF; color: var(--rs-color); }
.rwb-toc-guard { margin-top: 10px; padding: 7px 8px; border-radius: 6px; background: #fdf6ec; color: #b88230; font-size: 13px; display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.rwb-toc-guard-link { font-style: normal; cursor: pointer; color: var(--rs-color); margin-left: auto; }
.rwb-toc-guard-link:hover { text-decoration: underline; }
/* 右侧画布：一张连续的纸，章节之间以细分隔线区隔（不再一章一张卡） */
.rwb-doc-canvas { flex: 1; min-width: 0; }
.rwb-canvas-sheet { background: #fff; border: 1px solid #eef1f6; border-radius: 8px; padding: 20px 26px 8px; box-shadow: 0 1px 2px rgba(15, 23, 42, .04); }
.rwb-canvas-cover { text-align: center; padding: 6px 0 16px; border-bottom: 1px solid #eef1f6; margin-bottom: 4px; }
.rwb-canvas-org { font-size: 15px; font-weight: 700; color: #1E293B; letter-spacing: 1px; }
.rwb-canvas-title { font-size: 13.5px; color: #334155; margin-top: 6px; letter-spacing: .5px; }
.rwb-canvas-meta { font-size: 13px; color: #a8b3c4; margin-top: 8px; }
.rwb-canvas-sec { padding: 16px 0 4px; border-bottom: 1px dashed #f2f5fa; border-radius: 6px; scroll-margin-top: 8px; }
.rwb-canvas-sec:last-child { border-bottom: none; }
.rwb-canvas-sec.is-flash { animation: rwbFlash 1.6s ease; }
.rwb-canvas-sec-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.rwb-canvas-h { flex: 1; min-width: 0; margin: 0; font-size: 13.5px; font-weight: 700; color: #1E293B; letter-spacing: .3px; }
.rwb-canvas-sec-ops { flex-shrink: 0; opacity: 0; transition: opacity .15s; }
.rwb-canvas-sec:hover .rwb-canvas-sec-ops { opacity: 1; }
.rwb-canvas-sec-ops .el-button--text { padding: 0 3px; font-size: 13px; }
.rwb-chapter { background: #F7FAFF; border: 1px solid #E6ECF5; border-radius: 6px; overflow: hidden; }
.rwb-ch-head { display: flex; align-items: center; gap: 8px; padding: 8px 10px; cursor: pointer; user-select: none; font-size: 13px; transition: background-color .2s; }
.rwb-ch-head:hover { background: #EFF5FF; }
.rwb-ch-arrow { font-size: 13px; color: #94a3b8; }
.rwb-ch-name { font-weight: 600; color: #1E293B; }
.rwb-ch-count { font-size: 13px; color: #0067FE; font-variant-numeric: tabular-nums; }
.rwb-ch-act { margin-left: auto; flex-shrink: 0; padding: 0 4px; }
/* 阶段三折叠标题的换算口径（与阶段一/二的"数据来源"语义不同，保留在标题行） */
.rwb-ch-src { margin-left: auto; font-size: 13px; color: #94a3b8; }
/* 展开区：章节级数据来源（折叠标题不再重复该信息，避免与阶段一模板预览的"数据来源"重复） */
.rwb-ch-src-inline { display: flex; gap: 6px; font-size: 13px; color: #94a3b8; line-height: 1.6; padding-bottom: 6px; margin-bottom: 6px; border-bottom: 1px dashed #EEF2F8; }
.rwb-ch-src-inline span { flex-shrink: 0; color: #b0b8c4; }
.rwb-ch-body { padding: 4px 10px 8px; background: #FFFFFF; border-top: 1px dashed #E6ECF5; }
/* 主体类章节：字段已在阶段一核对，此处仅给出来源说明，不重复罗列 */
.rwb-ch-self { display: flex; align-items: flex-start; gap: 6px; font-size: 13px; line-height: 1.7; color: #529b2e; background: #f0f9eb; border: 1px solid #e1f3d8; border-radius: 6px; padding: 7px 10px; }
.rwb-ch-self i { margin-top: 2px; flex-shrink: 0; }
.rwb-ch-row { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: #475569; padding: 3px 0; }
/* 章节明细列标题行：吸顶（长清单上下滚动核对时表头始终可见，避免填错列） */
.rwb-ch-th { font-size: 13px; font-weight: 600; color: #64748b; padding: 6px 0 5px; margin-bottom: 2px; border-bottom: 1px solid #eef2f7; position: sticky; top: 0; z-index: 2; background: #fff; }
/* 填报一线防呆：本期值偏离上期参考值 ±50% 预警 */
.rwb-fd-dev { color: #e6a23c; margin-left: 4px; font-size: 13px; cursor: help; }
/* 左侧对话 ↔ 右侧清单联动：消息内跳转锚点 / 缺项提示条可点击名称 / 定位高亮 */
.wb-jump { color: var(--rs-color, #0067FE); cursor: pointer; border-bottom: 1px dashed var(--rs-color, #0067FE); }
.wb-jump:hover { opacity: .75; }
.rwb-missing-link { color: var(--rs-color, #0067FE); cursor: pointer; }
.rwb-missing-link:hover { text-decoration: underline; }
.rwb-locate-flash { animation: rwbFlash 1.6s ease; }
@keyframes rwbFlash { 0% { background: #fff7e6; } 100% { background: transparent; } }
.rwb-ch-th .rwb-fd-idx { background: transparent; color: #94a3b8; }
.rwb-ch-th .rwb-fd-name,
.rwb-ch-th .rwb-fd-unit,
.rwb-ch-th .rwb-fd-ref { color: #64748b; }
.rwb-missing-note i { color: #e6a23c; margin-top: 2px; flex-shrink: 0; }

/* 本场景免填项说明：中性弱化，不与缺项提示抢注意力 */
.rwb-na-note { display: flex; align-items: flex-start; gap: 6px; font-size: 13px; line-height: 1.7; color: #909399; background: #fafafa; border: 1px solid #ebeef5; border-radius: 6px; padding: 7px 10px; margin-top: 10px; }
.rwb-na-note i { color: #c0c4cc; margin-top: 2px; flex-shrink: 0; }
/* 缺项聚合视图空态（仅看缺项且缺项清零） */
.rwb-ch-empty { padding: 18px 0; text-align: center; color: #909399; font-size: 13px; background: #fafafa; border: 1px dashed #ebeef5; border-radius: 6px; }

.rwb-narrative { position: relative; }
.rwb-narrative p { font-size: 13.5px; line-height: 1.95; color: #303133; margin: 0; text-align: justify; letter-spacing: .2px; }
.rwb-narrative p + .rwb-narrative-toggle { margin-top: 6px; }
/* 「正文体 + 算底卷」分层：正文在画布连续成文，换算依据收进右侧抽屉 */
.rwb-doc-table { margin-bottom: 10px; }
.rwb-doc-foot { display: flex; align-items: center; gap: 10px; row-gap: 6px; flex-wrap: wrap; margin-top: 10px; padding-top: 9px; border-top: 1px dashed #eef1f6; }
.rwb-doc-foot-hint { font-size: 13px; color: #a8b3c4; flex: 1; min-width: 0; }
/* 就地穿透：主屏作业 → 定稿版式通读（打开弹窗并高亮本章） */
.rwb-doc-goto { margin-left: auto; flex-shrink: 0; white-space: nowrap; font-size: 13px; color: var(--rs-color); cursor: pointer; }
.rwb-doc-goto:hover { text-decoration: underline; }
.rwb-doc-goto i { font-size: 13px; }
/* 换算数值标签：虚线底线提示"可点开底卷"，不打断行文阅读 */
.rwb-num { color: #1F4D8F; border-bottom: 1px dashed #a9c4e8; cursor: pointer; font-variant-numeric: tabular-nums; padding: 0 1px; transition: background .15s; }
.rwb-num:hover { background: #eef4ff; border-bottom-color: var(--rs-color); }
.rwb-adapt-entry { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--rs-color); background: #f4f8ff; border: 1px dashed var(--rs-color-border); border-radius: 12px; padding: 2px 10px; cursor: pointer; flex-shrink: 0; }
.rwb-adapt-entry:hover { background: #e8f1ff; border-style: solid; }
/* 报告内容表格的合计行强调 */
/* 报告内容表格的合计行强调 */
.rwb-tr-total { background: #F2F7FF; font-weight: 700; color: #1F4D8F; }
/* 长叙述折叠：默认 3 行 + 底部渐隐 + 展开全文 */
.rwb-narrative p.is-collapsed { max-height: 4.5em; overflow: hidden; position: relative; }
.rwb-narrative p.is-collapsed::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 1.6em; background: linear-gradient(180deg, rgba(255,255,255,0), #fff); }
.rwb-narrative-toggle { padding: 0; margin: 0 0 8px; font-size: 13px; }

/* 阶段一：模板匹配元信息 + 报表清单 + 数据接入就绪度 */
.rwb-rep-meta { margin-top: 10px; padding-top: 8px; border-top: 1px dashed #ebeef5; display: flex; flex-direction: column; gap: 5px; }
.rwb-rep-row { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 8px; font-size: 13px; }
.rwb-rep-row > b { min-width: 0; }
.rwb-rep-scopes { display: flex; flex-wrap: wrap; gap: 4px; flex: 1; min-width: 0; }
.rwb-rep-lock { font-size: 13px; color: #909399; }
.rwb-rep-variant-suite { font-size: 13px; color: #909399; }
/* 换算明细：来源标注（公式库 / 因子库可追溯） */
.rwb-adapt-src { font-style: normal; font-size: 12px; color: var(--rs-color); border: 1px solid var(--rs-color-border); border-radius: 8px; padding: 0 5px; margin-left: 5px; cursor: help; }

/* 编制依据明细弹窗 */
/* 引用出处：弹窗级上下文行（不参与分组编号） */
.rwb-cal-source { display: block; font-size: 13px; color: #909399; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px dashed #ebeef5; }
.rwb-cal-source b { color: #475569; font-weight: 600; margin: 0 2px; }
/* 区块序号：叙事顺序引导（依据声明与后续分组平级，均按统一 grid 形态呈现） */
.rwb-cal-sec-title { display: flex; align-items: center; }
.rwb-cal-sec-no { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; background: var(--rs-color, #0067FE); color: #fff; font-size: 12px; font-weight: 700; margin-right: 6px; flex-shrink: 0; }
/* 依据明细：引用出处等弱化文本 */
.rwb-cal-wrap { /* 抽屉内由 .el-drawer__body 统一滚动，不再限制 68vh（dialog 时代遗留） */ }
.rwb-cal-head { padding-bottom: 10px; border-bottom: 1px dashed #ebeef5; }
.rwb-cal-head b { display: block; font-size: 14px; color: #303133; margin-bottom: 4px; }
.rwb-cal-head-meta { display: inline-block; font-size: 13px; color: #909399; margin-right: 14px; }
.rwb-cal-list { display: flex; flex-direction: column; gap: 10px; }
.rwb-cal-item { border: 1px solid #ebeef5; border-radius: 8px; padding: 10px 12px; }
.rwb-cal-item-head { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #303133; }
.rwb-cal-id { font-family: Consolas, Monaco, monospace; font-size: 13px; color: #fff; background: var(--rs-color); border-radius: 4px; padding: 1px 6px; }
.rwb-cal-unit { font-size: 13px; color: #909399; }
.rwb-cal-obj { margin-left: auto; }
.rwb-cal-formula { margin-top: 6px; }
.rwb-cal-formula code { font-family: Consolas, Monaco, monospace; font-size: 13px; color: #E6A23C; background: #fdf6ec; border-radius: 4px; padding: 3px 8px; display: inline-block; }
.rwb-cal-desc { margin-top: 6px; font-size: 13px; color: #909399; line-height: 1.6; }
.rwb-cal-params { margin-top: 6px; display: flex; flex-direction: column; gap: 3px; }
.rwb-cal-param { font-size: 13px; color: #606266; line-height: 1.6; }
.rwb-cal-param code { font-family: Consolas, Monaco, monospace; color: #0067FE; }
.rwb-cal-param em { font-style: normal; color: #909399; }
.rwb-cal-empty { text-align: center; color: #909399; font-size: 13px; padding: 40px 0; }
/* 编制依据明细：分组卡片 + 轻量键值行（去掉 key 列灰底，靠字色分层；行高 1.7 保证长文案可读） */
.rwb-cal-sec { margin-top: 14px; }
.rwb-cal-sec-title { font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }
.rwb-cal-sec-hint { margin-left: auto; font-size: 13px; color: #94a3b8; font-weight: 400; }
.rwb-cal-grid { border: 1px solid #eef2f7; border-radius: 8px; overflow: hidden; }
.rwb-cal-grid-row { display: flex; border-bottom: 1px solid #f2f4f8; font-size: 13px; background: #fff; }
.rwb-cal-grid-row:last-child { border-bottom: none; }
.rwb-cal-grid-key { flex: 0 0 108px; padding: 9px 12px; color: #64748b; border-right: 1px solid #f2f4f8; }
.rwb-cal-grid-val { flex: 1; min-width: 0; padding: 9px 12px; color: #0f172a; line-height: 1.7; word-break: break-word; }
.rwb-cal-grid-val i { color: #67c23a; margin-right: 5px; }
.rwb-cal-clause { display: flex; align-items: center; gap: 4px; margin-top: 3px; font-style: normal; font-size: 13px; color: #909399; border-left: 2px solid #dbe7ff; padding-left: 6px; }
.rwb-cal-conflict { display: flex; align-items: flex-start; gap: 5px; margin-top: 6px; font-size: 13px; color: #E6A23C; background: #fdf6ec; border: 1px solid #faecd8; border-radius: 5px; padding: 6px 8px; line-height: 1.6; }
/* 模板库改版联动提示：在途任务仍按锁定版本执行 */
.rwb-drift-note { margin-top: 8px; font-size: 13px; color: #E6A23C; background: #fdf6ec; border: 1px solid #faecd8; border-radius: 6px; padding: 7px 10px; display: flex; gap: 5px; align-items: flex-start; line-height: 1.6; }
/* 新建报送计划：日历 → 模板库关联展示 */
.rs-cal-tpl { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #303133; line-height: 1.6; }
.rs-cal-tpl i { color: var(--rs-color); flex-shrink: 0; }
.rs-cal-tpl-warn { display: flex; align-items: flex-start; gap: 5px; font-size: 13px; color: #E6A23C; background: #fdf6ec; border-radius: 6px; padding: 6px 10px; line-height: 1.5; }
/* 报表清单入口：面板只告知量级，点击打开「模板预览」弹窗 */
.rwb-rt-entry { display: flex; align-items: center; gap: 10px; margin-top: 12px; padding: 10px 12px; border: 1px solid var(--rs-color-border); background: var(--rs-color-bg); border-radius: 8px; cursor: pointer; transition: all .15s; }
.rwb-rt-entry:hover { border-color: var(--rs-color); box-shadow: 0 2px 8px rgba(0, 103, 254, 0.12); }
.rwb-rt-entry > i { font-size: 16px; color: var(--rs-color); flex-shrink: 0; }
.rwb-rt-entry-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.rwb-rt-entry-body b { font-size: 13px; color: #303133; }
.rwb-rt-entry-body span { font-size: 13px; color: #909399; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rwb-rt-entry-cta { flex-shrink: 0; font-size: 13px; color: var(--rs-color); font-weight: 600; }
/* 模板结构预览弹窗：壳体定制（custom-class 作用域，仅影响本弹窗；章节预览由共享组件渲染） */
.rwb-tpl-dialog { border-radius: 12px; box-shadow: 0 12px 40px rgba(15, 35, 70, 0.18); }
.rwb-tpl-dialog .el-dialog__header { padding: 16px 20px 10px; border-bottom: 1px solid #f2f4f8; }
.rwb-tpl-dialog .el-dialog__title { font-size: 15px; font-weight: 600; color: #0f172a; }
.rwb-tpl-dialog .el-dialog__headerbtn { top: 18px; right: 18px; }
.rwb-tpl-dialog .el-dialog__headerbtn .el-dialog__close:hover { color: var(--rs-color); }
.rwb-tpl-dialog .el-dialog__body { padding: 14px 20px 16px; }
.rwb-tpl-dialog .el-dialog__footer { padding: 0 20px 14px; }
/* 头部信息条：浅色主题底，左侧「模板全称 + 场景 + 报表数」，右侧版本锁定徽章 */
.rwb-tpl-head { display: flex; align-items: center; gap: 10px; background: linear-gradient(90deg, var(--rs-color-bg, rgba(0, 103, 254, 0.06)), transparent 70%); border: 1px solid var(--rs-color-border, #d9e6ff); border-radius: 8px; padding: 9px 12px; margin-bottom: 12px; }
.rwb-tpl-head-main { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; }
.rwb-tpl-head-main b { font-size: 13px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rwb-tpl-lock { flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: #E6A23C; background: #fff; border: 1px solid #faecd8; border-radius: 20px; padding: 2px 10px; }
/* 共享组件在本弹窗内的微调：目录 active 左侧指示条 + 表格斑马纹（不影响平台模板库页） */
.rwb-tpl-dialog .tsp-toc-item { border-left: 2px solid transparent; }
.rwb-tpl-dialog .tsp-toc-item.active { border-left-color: var(--rs-color); }
.rwb-tpl-dialog .tsp-table tbody tr:nth-child(even) td { background: #fafbfd; }
/* 底部格式要求行：来自政策标准库依据条目的「落款与格式」维度 */
.rwb-tpl-format { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px 10px; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #ebeef5; font-size: 13px; }
.rwb-tpl-format-label { flex-shrink: 0; font-weight: 600; color: var(--rs-color); }
.rwb-tpl-format-item { color: #64748b; }

/* 阶段三校验区（置顶）：异常时橙色并自动展开，无异常时绿色弱化；校验与异常处置同页完成 */
.rwb-verify-zone { border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; }
.rwb-verify-zone.is-pass { border: 1px solid #e1f3d8; background: #f0f9eb; }
/* 警示态（存在待人工核验 / 非阻断异常）：浅黄底，避免"7/9 通过"被刷成纯绿造成全盘通过的误读 */
.rwb-verify-zone.is-warning { border: 1px solid #faecd8; background: #fdf6ec; }
.rwb-verify-zone.is-warning .rwb-vz-head { color: #E6A23C; }
.rwb-verify-zone.has-anomaly { border: 1px solid #fde2e2; background: #fef6f6; }
.rwb-vz-head { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 13px; }
.rwb-verify-zone.is-pass .rwb-vz-head { color: #67C23A; }
.rwb-verify-zone.has-anomaly .rwb-vz-head { color: #F56C6C; }
.rwb-vz-text { flex: 1; min-width: 0; font-size: 13px; color: #909399; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* 异常项快捷锚点：点击就地定位并高亮对应章节 */
.rwb-vz-anchors { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(0, 0, 0, 0.06); }
.rwb-vz-anchor { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; border-radius: 12px; padding: 2px 10px; cursor: pointer; background: #fff; transition: all .15s; }
.rwb-vz-anchor.is-block { color: #c45656; border: 1px solid #fde2e2; }
.rwb-vz-anchor.is-block:hover { background: #F56C6C; color: #fff; border-color: #F56C6C; }
.rwb-vz-anchor.is-escal { color: #b88230; border: 1px solid #faecd8; }
.rwb-vz-anchor.is-escal:hover { background: #E6A23C; color: #fff; border-color: #E6A23C; }
.rwb-vz-toggle { flex-shrink: 0; }
.rwb-vz-body { margin-top: 10px; }
.rwb-vz-body .rwb-table { background: #fff; border-radius: 6px; overflow: hidden; }
.rwb-verify-zone.has-anomaly .rwb-anomaly-card { background: #fff; }
/* 校验状态总览：客观计数（通过/总数 + 待处置）与快捷过滤；不做加权评分，避免伪精确与双闸门口径 */
.rwb-vz-summary { background: #fff; border-radius: 8px; padding: 9px 12px; margin-bottom: 10px; }
.rwb-vzs-line { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #303133; }
.rwb-vzs-line i { font-size: 14px; }
.rwb-vz-summary.is-warn .rwb-vzs-line i { color: #E6A23C; }
.rwb-vz-summary.is-ok .rwb-vzs-line i { color: #67C23A; }
.rwb-vzs-line b { font-variant-numeric: tabular-nums; }
.rwb-vzs-chips { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.rwb-vzs-chip { font-size: 13px; color: #475569; background: #f4f6fa; border: 1px solid #e8eef7; border-radius: 12px; padding: 2px 10px; cursor: pointer; transition: all .15s; }
.rwb-vzs-chip:hover { border-color: var(--rs-color-border); color: var(--rs-color); }
.rwb-vzs-chip.active { background: var(--rs-color); border-color: var(--rs-color); color: #fff; }
.rwb-vzs-chip.is-pending:not(.active) { color: #c45656; background: #fef0f0; border-color: #fde2e2; }
/* 校验明细按分组展示（格式合规 / 数据逻辑） */
.rwb-check-group { margin-bottom: 10px; }
.rwb-check-group:last-child { margin-bottom: 0; }
.rwb-check-group-title { font-size: 13px; font-weight: 600; color: #5a6b85; margin-bottom: 6px; }
.rwb-check-soft { font-style: normal; margin-left: 5px; font-size: 12px; color: #909399; background: #f4f6f9; border-radius: 3px; padding: 1px 4px; }
/* 签发凭据（清单 #15）：内容指纹 + 完整性校验 */
.rwb-sign { margin-top: 14px; border: 1px solid #e1f3d8; background: #f8fdf5; border-radius: 8px; padding: 10px 12px; }
.rwb-sign-head { display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 8px; }
.rwb-sign-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 16px; font-size: 13px; color: #606266; }
.rwb-sign-grid > div { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
.rwb-sign-grid > div > span { flex: 0 0 64px; color: #909399; }
.rwb-sign-grid code { font-family: Consolas, Monaco, monospace; color: #67C23A; }
.rwb-sign-verify { margin-top: 8px; display: flex; align-items: center; gap: 6px; font-size: 13px; border-radius: 5px; padding: 6px 8px; }
.rwb-sign-verify.ok { color: #67C23A; background: #f0f9eb; }
.rwb-sign-verify.err { color: #F56C6C; background: #fef0f0; }
/* 历史期次指纹（旧口径，未覆盖佐证材料）：如实说明口径差异，不谎报一致也不误报篡改 */
.rwb-sign-verify.legacy { color: #909399; background: #f4f4f5; }
.rwb-sign-note { margin-top: 6px; font-size: 13px; color: #909399; }
/* 离线表格导入（清单 #2 补缺采集主渠道）：解析 → 字段映射 → 预览 → 导入 */
.rwb-imp-note { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #606266; background: #f5f8ff; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; }
.rwb-imp-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
.rwb-imp-label { font-size: 13px; color: #5a6b85; }
.rwb-imp-file { font-size: 13px; color: #67C23A; }
.rwb-imp-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 13px; }
.rwb-imp-hint { font-size: 13px; color: #909399; }
.rwb-imp-table { border: 1px solid #ebeef5; border-radius: 6px; overflow: hidden; }
.rwb-imp-table .rwb-tr { display: flex; border-bottom: 1px solid #f2f4f8; }
.rwb-imp-table .rwb-tr:last-child { border-bottom: none; }
.rwb-imp-table .rwb-tr > span { flex: 1; min-width: 0; padding: 6px 8px; font-size: 13px; border-right: 1px solid #f2f4f8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rwb-imp-table .rwb-tr > span:last-child { border-right: none; }
.rwb-imp-table .rwb-th { background: #f8fafc; font-weight: 600; color: #5a6b85; }
/* 阶段四审批模式（V5.1 架构解耦：单人闭环基线 / 多级协同插件） */
.rwb-mode-line { display: flex; align-items: center; gap: 8px; margin: 6px 0 10px; }
.rwb-mode-label { font-size: 13px; color: #94a3b8; }
.rwb-direct-sign { border: 1px solid #e4e9f2; border-radius: 8px; padding: 12px 14px; background: #fbfdff; }
.rwb-ds-main { display: flex; align-items: flex-start; gap: 10px; }
.rwb-ds-main > i { font-size: 22px; color: var(--rs-color, #0067FE); margin-top: 2px; }
.rwb-ds-body { display: flex; flex-direction: column; gap: 4px; }
.rwb-ds-body b { font-size: 13px; color: #1E293B; }
.rwb-ds-body span { font-size: 13px; color: #64748b; line-height: 1.7; }
.rwb-ds-meta { margin-top: 8px; font-size: 13px; color: #94a3b8; line-height: 1.7; border-top: 1px dashed #eef2f7; padding-top: 8px; }
/* 签发凭据审批链（ApprovalNode[]） */
.rwb-sign-chain { margin-top: 8px; border-top: 1px dashed #eef2f7; padding-top: 8px; }
.rwb-sign-chain-head { font-size: 13px; color: #909399; margin-bottom: 5px; }
.rwb-sign-node { display: flex; align-items: baseline; gap: 8px; font-size: 13px; color: #475569; padding: 2px 0; }
.rwb-sign-node-lv { font-family: Consolas, Monaco, monospace; color: #94a3b8; }
.rwb-sign-node-role { font-weight: 600; color: #303133; }
.rwb-sign-node-status { color: #67c23a; }
.rwb-sign-node-by { color: #64748b; }
.rwb-sign-node-cmt { color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* 多级审核流（清单 #11）：填报人自查 → 部门负责人审核 → 碳管理师复核 */
.rwb-audit-level { position: relative; display: flex; gap: 10px; padding-bottom: 12px; }
.rwb-audit-level:last-child { padding-bottom: 0; }
.rwb-audit-line { position: absolute; left: 12px; top: 28px; bottom: 0; width: 2px; background: #e8eef7; }
.rwb-audit-line.is-last { display: none; }
.rwb-audit-badge { flex: 0 0 26px; height: 26px; line-height: 26px; text-align: center; border-radius: 50%; font-size: 13px; position: relative; z-index: 1; }
.rwb-audit-badge.ok { background: #f0f9eb; color: #67C23A; border: 1px solid #c2e7b0; }
.rwb-audit-badge.err { background: #fef0f0; color: #F56C6C; border: 1px solid #fbc4c4; }
.rwb-audit-badge.idle { background: #f4f6f9; color: #909399; border: 1px solid #e4e7ed; }
.rwb-audit-body { flex: 1; min-width: 0; }
.rwb-audit-head { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.rwb-audit-by { font-size: 13px; color: #909399; }
.rwb-audit-comment { margin-top: 4px; font-size: 13px; color: #606266; line-height: 1.6; }
.rwb-audit-actions { margin-top: 6px; }
/* 导出菜单项说明（格式用途提示） */
.rwb-export-desc { color: #909399; font-size: 13px; margin-left: 8px; }
/* 数据溯源链（清单 #13 / #16）：L1 报表 → L4 原始采集，逐级下钻（只读核验，无演示值兜底） */
.rwb-trace-note { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #606266; background: #f5f8ff; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; }
.rwb-trace-level { position: relative; display: flex; gap: 12px; padding-bottom: 14px; }
.rwb-trace-line { position: absolute; left: 21px; top: 26px; bottom: 0; width: 2px; background: #e8eef7; }
.rwb-trace-line.is-last { display: none; }
.rwb-trace-badge { flex: 0 0 44px; height: 22px; line-height: 22px; text-align: center; font-size: 13px; font-weight: 600; color: #fff; background: var(--rs-color); border-radius: 11px; position: relative; z-index: 1; }
.rwb-trace-body { flex: 1; min-width: 0; }
.rwb-trace-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; font-size: 13px; }
.rwb-trace-desc { font-size: 13px; color: #909399; }
.rwb-trace-node { border: 1px solid #ebeef5; border-radius: 6px; padding: 8px 10px; margin-bottom: 6px; }
.rwb-trace-node:last-child { margin-bottom: 0; }
.rwb-trace-node-top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; font-size: 13px; }
.rwb-trace-label { color: #0f172a; }
.rwb-trace-value { color: var(--rs-color); font-weight: 600; white-space: nowrap; }
.rwb-trace-node-meta { margin-top: 4px; display: flex; flex-wrap: wrap; gap: 12px; font-size: 13px; color: #909399; }
.rwb-trace-node-meta i { margin-right: 3px; }
/* 换算依据的因子溯源标记（系数取自因子库，走因子匹配服务链路） */
.rwb-factor-trace { display: inline-block; margin-left: 5px; font-style: normal; font-size: 12px; color: #67C23A; background: #f0f9eb; border-radius: 3px; padding: 1px 4px; cursor: help; white-space: nowrap; }
/* 异常卡片「其他处置方式」下拉入口 */
.rwb-ac-more { display: inline-block; margin-left: 8px; }
.rwb-ac-more-btn { font-size: 13px; color: var(--rs-color); cursor: pointer; }
.rwb-ac-more-btn i { margin-left: 2px; }

/* 注：原「校验摘要条」样式（.rwb-check-summary / .rwb-cs-body）随阶段四勾稽校验展示移除，已无引用 */
.rwb-check-empty { border: 1px dashed #e1f3d8; background: #f0f9eb; color: #67C23A; border-radius: 8px; padding: 14px; font-size: 13px; display: flex; align-items: center; gap: 6px; }

/* 注：原「指标预览与修订」的数值输入框 / 派生值样式已随阶段四封存改造移除（面板不再有可写指标） */

.rwb-anomaly-card { border: 1px solid #fde2e2; background: #fef6f6; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; }
.rwb-ac-head { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #303133; }
.rwb-ac-desc { font-size: 13px; color: #606266; margin: 6px 0; line-height: 1.6; }
.rwb-ac-suggest { font-size: 13px; color: #E6A23C; background: #fdf6ec; border-radius: 6px; padding: 6px 10px; display: flex; align-items: flex-start; gap: 5px; line-height: 1.5; }
.rwb-ac-actions { margin-top: 8px; display: flex; gap: 8px; }
.rwb-ac-escalated { margin-top: 8px; font-size: 13px; color: #E6A23C; background: #fdf6ec; border-radius: 6px; padding: 6px 10px; display: flex; align-items: center; gap: 5px; }
/* 待人工确认说明：必须显式处置（填写偏差说明并盖章，或退回重采） */
.rwb-ac-confirm { margin-top: 8px; }
.rwb-ac-confirm-tip { font-size: 13px; color: #b88230; background: #fdf6ec; border-radius: 6px; padding: 6px 10px; margin-bottom: 8px; line-height: 1.6; }
.rwb-ac-confirm .el-textarea { margin-bottom: 8px; }
.rwb-ac-confirm .el-textarea__inner { font-size: 13px; line-height: 1.6; }
/* 已人工确认戳记 */
.rwb-ac-stamp { margin-top: 8px; display: flex; align-items: stretch; gap: 10px; background: #f0f9eb; border: 1px solid #e1f3d8; border-radius: 6px; padding: 8px 10px; }
.rwb-ac-stamp-mark { flex-shrink: 0; display: flex; align-items: center; gap: 4px; align-self: center; font-size: 13px; font-weight: 700; color: #529b2e; border: 1.5px solid #67C23A; border-radius: 6px; padding: 4px 8px; transform: rotate(-4deg); letter-spacing: .5px; }
.rwb-ac-stamp-body { flex: 1; min-width: 0; }
.rwb-ac-stamp-note { font-size: 13px; color: #4b5563; line-height: 1.6; }
.rwb-ac-stamp-meta { font-size: 13px; color: #8a94a6; margin-top: 3px; }
/* 守卫未放行：底栏提示转警示色，主按钮降级为次级灰态 */
.rwb-actionbar.is-guarded { background: #fdf6ec; border-top-color: #faecd8; }
.rwb-actionbar.is-guarded .rwb-ab-note { color: #b88230; }
.rwb-ab-note b { font-variant-numeric: tabular-nums; }
/* 守卫锁定徽标：灰态、不可点击（非伪禁用，点击不会触发流转） */
.rwb-guard-lock { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; font-size: 13px; color: #9aa4b2; background: #f2f4f8; border: 1px solid #e4e8ef; border-radius: 4px; padding: 9px 16px; cursor: not-allowed; user-select: none; }

.rwb-file-card { display: flex; align-items: center; gap: 12px; border: 1px solid var(--rs-color-border); background: var(--rs-color-bg); border-radius: 8px; padding: 12px 16px; }
.rwb-file-icon { width: 40px; height: 40px; border-radius: 8px; background: var(--rs-color); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.rwb-file-info { flex: 1; min-width: 0; }
.rwb-file-info b { display: block; font-size: 13px; color: #303133; }
.rwb-file-info span { font-size: 13px; color: #909399; }
/* 报送包行：报告与佐证材料同属一个交付物，构成说明 + 清单入口 + 打包动作同处一行。
   次级文字链形态（无边框无底色）——不抢「签字确认并归档」的视觉重心 */
.rwb-bundle-line { display: flex; align-items: center; gap: 10px; margin-top: 8px; padding: 0 2px; font-size: 13px; color: #606266; flex-wrap: wrap; }
.rwb-bundle-label { flex-shrink: 0; color: #909399; }
.rwb-bundle-desc { flex: 1; min-width: 0; color: #606266; }
.rwb-bundle-warn { color: #E6A23C; font-weight: 600; }
.rwb-bundle-act { flex-shrink: 0; white-space: nowrap; font-size: 13px; color: var(--rs-color); cursor: pointer; }
.rwb-bundle-act:hover { text-decoration: underline; }
.rwb-bundle-act i { font-size: 13px; }
/* 证据核验行：只读核验视图（不产出文件），与上方「可下载的交付物」分层 */
.rwb-evidence-line { display: flex; align-items: center; gap: 10px; margin-top: 10px; padding: 0 2px; font-size: 13px; color: #606266; flex-wrap: wrap; }
.rwb-evidence-label { flex-shrink: 0; color: #909399; }
.rwb-evidence-hint { font-size: 13px; color: #a8b3c4; }
/* 归档证据：修订留痕默认收起（信息性过程记录不打断「核验 → 签发 → 归档」动作链） */
.rwb-rev-fold { display: flex; align-items: center; gap: 8px; margin-top: 16px; padding: 8px 12px; border: 1px dashed var(--rs-color-border); border-radius: 6px; background: #fafbfd; font-size: 13px; color: #303133; cursor: pointer; }
.rwb-rev-fold:hover { background: #f4f8ff; }
.rwb-rev-fold i { color: var(--rs-color); }
.rwb-rev-fold-hint { margin-left: auto; font-size: 13px; color: #a8b3c4; }
.rwb-rev-list { margin-top: 6px; padding: 0 12px; }
/* 签发凭据：覆盖范围含佐证材料时的补录提示（材料变更会使指纹失效） */
.rwb-sign-scope-note { display: flex; align-items: flex-start; gap: 6px; margin-top: 8px; font-size: 13px; color: #E6A23C; background: #FDF6EC; border-radius: 4px; padding: 6px 10px; line-height: 1.6; }
/* 佐证材料清单弹窗（只读核验 + 整包下载） */
.rwb-mat-note { display: flex; align-items: flex-start; gap: 6px; font-size: 13px; color: #606266; background: #f5f8ff; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; line-height: 1.7; }
.rwb-mat-sum { display: flex; align-items: center; gap: 14px; padding: 0 2px 10px; border-bottom: 1px solid #eef1f6; font-size: 13px; }
.rwb-mat-sum-item { display: inline-flex; align-items: center; gap: 4px; }
.rwb-mat-sum-item.is-ok { color: #67C23A; }
.rwb-mat-sum-item.is-miss { color: #E6A23C; }
.rwb-mat-sum-item.is-wait { color: #909399; }
.rwb-mat-sum-total { margin-left: auto; font-size: 13px; color: #a8b3c4; }
.rwb-mat-body { max-height: 52vh; overflow-y: auto; margin-top: 4px; }
.rwb-mat-group { margin-top: 12px; }
.rwb-mat-group-head { display: flex; align-items: center; gap: 8px; padding-bottom: 6px; font-size: 13px; font-weight: 600; color: #303133; }
.rwb-mat-group-count { font-size: 13px; font-weight: 400; color: #a8b3c4; }
.rwb-mat-item { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 6px; padding: 9px 10px; border: 1px solid #eef1f6; border-radius: 6px; }
.rwb-mat-item.is-missing { border-color: #f5dab1; background: #fffaf3; }
.rwb-mat-item.is-pending { background: #fafbfd; }
.rwb-mat-badge { flex-shrink: 0; width: 48px; padding: 2px 0; border-radius: 3px; font-size: 13px; text-align: center; }
.rwb-mat-badge.is-ok { color: #67C23A; background: #f0f9eb; }
.rwb-mat-badge.is-miss { color: #E6A23C; background: #fdf6ec; }
.rwb-mat-badge.is-wait { color: #909399; background: #f4f4f5; }
.rwb-mat-main { flex: 1; min-width: 0; }
.rwb-mat-name { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 13px; color: #303133; }
.rwb-mat-type { font-size: 13px; color: #909399; }
.rwb-mat-meta { margin-top: 3px; font-size: 13px; color: #909399; line-height: 1.6; }
.rwb-mat-note-line { margin-top: 3px; font-size: 13px; color: #a8b3c4; line-height: 1.6; }
.rwb-mat-size { flex-shrink: 0; font-size: 13px; color: #a8b3c4; font-variant-numeric: tabular-nums; }
.rwb-rev-row { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #303133; padding: 6px 0; border-bottom: 1px dashed #ebeef5; }
.rwb-rev-time { color: #909399; font-family: 'Exo 2', monospace; flex-shrink: 0; }
.rp-typing-indicator { display: inline-flex; gap: 4px; padding: 4px 0; align-items: center; height: 20px; }
.rp-dot { width: 6px; height: 6px; background-color: var(--rs-color); border-radius: 50%; animation: rp-typing 1.4s infinite ease-in-out both; }
.rp-dot:nth-child(1) { animation-delay: -0.32s; }
.rp-dot:nth-child(2) { animation-delay: -0.16s; }
@keyframes rp-typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
/* Fade Transition */
.rs-fade-enter-active, .rs-fade-leave-active { transition: opacity 0.4s ease, transform 0.4s ease; }
.rs-fade-enter, .rs-fade-leave-to { opacity: 0; transform: translateY(10px); }
/* 单元格穿透样式 */
.rwb-val-penetrate {
  cursor: pointer !important;
  position: relative;
  transition: all 0.2s ease;
  color: #0067FE !important;
  font-weight: 500;
  text-decoration: underline;
  text-decoration-style: dashed;
  text-underline-offset: 3px;
}
.rwb-val-penetrate:hover {
  background-color: rgba(0, 103, 254, 0.08) !important;
  border-radius: 3px;
  text-decoration-style: solid;
}
.rwb-penetrate-icon {
  font-size: 13px;
  margin-left: 3px;
  opacity: 0.7;
}
.rwb-val-penetrate:hover .rwb-penetrate-icon {
  opacity: 1;
}

/* 穿透抽屉结构 */
.rwb-pen-drawer .el-drawer__body {
  padding: 16px 20px;
  background: #f8fafc;
  overflow-y: auto;
}
.rwb-pen-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.rwb-pen-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.rwb-pen-card-title {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.rwb-pen-step-flow {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rwb-pen-step-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #f8fafc;
  border-radius: 6px;
  padding: 10px 12px;
  border-left: 4px solid #0067FE;
}
.rwb-pen-step-tag {
  font-size: 13px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  background: #fff;
  color: #475569;
  border: 1px solid #cbd5e1;
  white-space: nowrap;
}
.rwb-pen-step-main { flex: 1; }
.rwb-pen-step-name { font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 2px; }
.rwb-pen-step-desc { font-size: 13px; color: #64748b; line-height: 1.5; }
.rwb-pen-kv {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 12px;
  font-size: 13px;
}
.rwb-pen-kv-item { display: flex; align-items: center; gap: 4px; }
.rwb-pen-kv-k { color: #64748b; min-width: 80px; }
.rwb-pen-kv-v { color: #1e293b; word-break: break-all; }
/* 阶段二快捷填入与胶囊按钮 */
.rwb-fd-input-wrap { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.rwb-fd-quick-fill {
  font-size: 13px;
  color: #0067FE;
  background: rgba(0, 103, 254, 0.08);
  border: 1px solid rgba(0, 103, 254, 0.25);
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  user-select: none;
}
.rwb-fd-quick-fill:hover {
  background: #0067FE;
  color: #fff;
  border-color: #0067FE;
}
.rwb-ch-batch {
  background: rgba(0, 103, 254, 0.06);
  border-radius: 4px;
  padding: 3px 8px;
}
.rwb-ch-batch:hover {
  background: rgba(0, 103, 254, 0.12);
}

/* 监管预审合规体检卡 (Pre-audit Card) */
.rwb-preaudit-card {
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: all 0.3s;
}
.rwb-preaudit-card.is-pass {
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
  border: 1px solid #bbf7d0;
  border-left: 4px solid #16a34a;
}
.rwb-preaudit-card.is-pending {
  background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
  border: 1px solid #fde68a;
  border-left: 4px solid #d97706;
}
.rwb-pac-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(0,0,0,0.08);
}
.rwb-pac-badge {
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}
.rwb-preaudit-card.is-pass .rwb-pac-badge { color: #15803d; }
.rwb-preaudit-card.is-pending .rwb-pac-badge { color: #b45309; }
.rwb-pac-res-tag {
  font-size: 13px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 12px;
}
.rwb-pac-res-tag.is-ok {
  color: #166534;
  background: #dcfce7;
  border: 1px solid #86efac;
}
.rwb-pac-res-tag.is-warn {
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fcd34d;
}
.rwb-pac-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 16px;
  font-size: 13px;
}
.rwb-pac-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.rwb-pac-k { color: #64748b; }
.rwb-pac-v { color: #1e293b; font-weight: 500; display: flex; align-items: center; gap: 4px; }
.rwb-pac-v .el-icon-check { color: #16a34a; font-weight: bold; }
</style>

<!-- 整篇报告预览弹窗经 append-to-body 挂到 body 下，样式需脱离 scoped 才能命中；
     按定稿报告版式呈现（封面 + 正文 + 落款），弹窗高度固定、正文区滚动 -->
<style>
/* 自定义时间区间（daterange）日期面板：居中显示，修复在弹窗内定位偏移到页面左上角的问题 */
.rs-dim-range-popper {
  left: 50% !important;
  top: calc(15vh + 230px) !important;
  transform: translateX(-50%) !important;
}
/* 提报状态登记弹窗（登记提报 / 登记受理统一结构） */
.rs-reg-dialog .el-dialog__body { padding: 16px 20px; max-height: 70vh; overflow-y: auto; }
.rs-reg-desc { display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px; background: var(--rs-color-bg, rgba(0,103,254,.06)); border-radius: 6px; font-size: 13px; color: #606266; line-height: 1.7; margin-bottom: 14px; }
.rs-reg-desc i { color: var(--rs-color, #0067FE); font-size: 15px; margin-top: 2px; }
.rs-reg-fields { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
.rs-reg-field { display: flex; align-items: center; gap: 10px; }
.rs-reg-field-top { align-items: flex-start; }
.rs-reg-field-top .rs-reg-label { margin-top: 4px; }
.rs-reg-label { flex: 0 0 62px; font-size: 13px; color: #606266; }
.rs-reg-attach { margin-bottom: 4px; }
.rs-reg-attach > .rs-reg-label { display: block; margin-bottom: 6px; }
.rs-reg-upload .el-upload, .rs-reg-upload .el-upload-dragger { width: 100%; }
.rs-reg-upload .el-upload-dragger { height: 110px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.rs-reg-upload .el-icon-upload { margin: 8px 0 4px; font-size: 40px; }
/* 报告类型下拉选项：类型名 + 适用场景与支持周期说明 */
.rs-type-opt { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.rs-type-opt-meta { font-size: 13px; color: #909399; }
.rwb-report-dialog .el-dialog__body { padding: 0 20px; max-height: 78vh; overflow: hidden; }
.rp-layout { display: flex; gap: 0; height: 72vh; }
.rp-toc { flex: 0 0 230px; border-right: 1px solid #e4e7ed; padding: 12px 12px 12px 0; overflow-y: auto; }
.rp-toc-title { font-size: 13px; font-weight: 700; color: #1e293b; padding-bottom: 10px; border-bottom: 1px dashed #e4e7ed; margin-bottom: 8px; line-height: 1.6; }
.rp-toc-item { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 7px 8px; border-radius: 6px; cursor: pointer; font-size: 13px; color: #303133; transition: background .15s; }
.rp-toc-item:hover { background: rgba(0,103,254,.06); color: #0067FE; }
.rp-toc-hint { margin-top: 12px; font-size: 13px; color: #94a3b8; line-height: 1.7; border-top: 1px dashed #e4e7ed; padding-top: 10px; }
.rp-doc { flex: 1; min-width: 0; overflow-y: auto; padding: 12px 4px 12px 16px; }
.rp-section { margin-bottom: 26px; scroll-margin-top: 8px; }
/* 报告正文 / 附件报表 的分组标题 */
.rp-group { font-size: 13px; font-weight: 700; color: #0067FE; letter-spacing: 1px; padding: 4px 0 8px; margin-bottom: 14px; border-bottom: 2px solid rgba(0,103,254,.25); }
.rp-sec-head { display: flex; align-items: baseline; gap: 8px; padding-bottom: 8px; border-bottom: 2px solid rgba(0,103,254,.15); margin-bottom: 12px; }
.rp-sec-title { font-size: 15px; font-weight: 700; color: #1e293b; }
.rp-table-block { margin-bottom: 12px; }
.rp-table-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 13px; }
.rp-table-lock { color: #E6A23C; font-weight: 600; }
/* 可编辑来源（企业档案带出 / 人工填报）用主色，与只读来源的橙色区分 */
.rp-table-lock.is-editable { color: #0067FE; }
.rp-table-hint { color: #94a3b8; }
.rp-table-wrap { border: 1px solid #e4e7ed; border-radius: 6px; overflow: hidden; }
.rp-table-wrap table { width: 100%; border-collapse: collapse; font-size: 13px; }
.rp-table-wrap th { background: #f5f7fa; font-weight: 600; color: #303133; text-align: left; padding: 8px 12px; border-bottom: 1px solid #e4e7ed; }
.rp-table-wrap td { padding: 7px 12px; color: #303133; border-bottom: 1px solid #ebeef5; }
.rp-table-wrap tr:last-child td { border-bottom: none; }
.rp-para { margin: 0; font-size: 13px; line-height: 2; color: #303133; text-indent: 2em; text-align: justify; }
.rp-cover { text-align: center; padding: 24px 0 32px; }
.rp-cover-org { font-size: 15px; letter-spacing: 2px; color: #303133; margin-bottom: 16px; }
.rp-cover-title { font-size: 26px; font-weight: 700; color: #1e293b; letter-spacing: 3px; line-height: 1.6; }
.rp-cover-seal { margin-top: 56px; font-size: 14px; color: #303133; line-height: 2.4; }
.rp-cover-seal-sub { color: #606266; }
.rp-sign { margin-top: 40px; padding-top: 16px; border-top: 1px dashed #dcdfe6; font-size: 13px; color: #606266; }
.rp-empty { padding: 60px 0; text-align: center; color: #909399; font-size: 13px; }
/* 改动导航器：把 AI 改动变成一份可完成的清单，而非散落各处 */
.rp-bar { display: flex; align-items: center; gap: 10px; height: 40px; padding: 0 4px; border-bottom: 1px solid #e4e7ed; font-size: 13px; color: #606266; }
.rp-bar-info { flex: 1; min-width: 0; }
.rp-bar-info b { color: #0067FE; }
.rp-bar-hint { font-style: normal; color: #94a3b8; }
.rp-bar-actions { flex-shrink: 0; display: flex; align-items: center; gap: 6px; }
/* 段落块：悬停才露出改写入口，不打断阅读流（On-demand initiation） */
.rp-para-block { position: relative; }
.rp-para-tools { position: absolute; top: -12px; right: 0; display: none; align-items: center; gap: 2px; background: #fff; border: 1px solid #e4e7ed; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,.08); padding: 2px 4px; z-index: 2; }
.rp-para-block:hover .rp-para-tools { display: flex; }
.rp-tool { font-size: 13px; color: #606266; cursor: pointer; padding: 2px 7px; border-radius: 4px; white-space: nowrap; }
.rp-tool:hover { background: rgba(0,103,254,.08); color: #0067FE; }
/* 内联 diff：除颜色外另有「原文 / AI」文字标签，不依赖颜色作单一提示（无障碍） */
.rp-diff { border: 1px solid #e4e7ed; border-radius: 6px; overflow: hidden; }
.rp-diff-row { display: flex; gap: 8px; padding: 8px 12px; font-size: 13px; line-height: 2; }
.rp-diff-row.is-old { background: #fef0f0; }
.rp-diff-row.is-new { background: #f0f9eb; }
.rp-diff-tag { flex-shrink: 0; width: 62px; font-size: 13px; font-weight: 600; line-height: 2.36; }
.rp-diff-row.is-old .rp-diff-tag { color: #f56c6c; }
.rp-diff-row.is-new .rp-diff-tag { color: #67c23a; }
.rp-diff-text { flex: 1; min-width: 0; text-indent: 2em; text-align: justify; }
.rp-diff-row.is-old .rp-diff-text { color: #909399; }
.rp-diff-row.is-new .rp-diff-text { color: #303133; }
/* 段内（intraline）高亮：只标出真正变化的字符，而非整段替换 */
.rp-diff-text del { background: #fde2e2; color: #c45656; text-decoration: line-through; border-radius: 2px; padding: 0 1px; }
.rp-diff-text ins { background: #e1f3d8; color: #529b2e; text-decoration: none; border-radius: 2px; padding: 0 1px; }
.rp-caret { display: inline-block; width: 2px; height: 14px; background: #0067FE; margin-left: 2px; vertical-align: middle; animation: rp-blink .8s step-end infinite; }
@keyframes rp-blink { 50% { opacity: 0; } }
/* 改写校验：block = 硬伤（红，阻断接受）；warn = 提示（橙，允许接受） */
.rp-guard { display: flex; gap: 6px; align-items: flex-start; margin-top: 8px; padding: 8px 10px; border-radius: 6px; font-size: 13px; line-height: 1.7; }
.rp-guard.is-block { background: #fef0f0; color: #c45656; border: 1px solid #fde2e2; }
.rp-guard.is-warn { background: #fdf6ec; color: #b88230; border: 1px solid #faecd8; }
.rp-guard i { padding-top: 2px; }
.rp-guard-body { flex: 1; min-width: 0; }
.rp-guard-tip { margin-top: 4px; opacity: .85; }
.rp-diff-actions { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.rp-diff-streaming { font-size: 13px; color: #909399; }
.rwb-title-btn { margin-left: auto; }
/* 警示次级按钮：全局存在 `.el-button--warning { background: var(--warning) !important }`（实心橙），
   会把 plain 警示按钮变成"橙字压橙底"（文字不可见）。故此类按钮不使用 warning 类型，改用本类显式着色 */
.rwb-btn-warn.el-button.is-plain { background: #fdf6ec; border-color: #f5dab1; color: #b88230; }
.rwb-btn-warn.el-button.is-plain:hover,
.rwb-btn-warn.el-button.is-plain:focus { background: #E6A23C; border-color: #E6A23C; color: #fff; }
.rp-typing-indicator { display: inline-flex; gap: 4px; padding: 4px 0; align-items: center; height: 20px; }
.rp-dot { width: 6px; height: 6px; background-color: var(--rs-color); border-radius: 50%; animation: rp-typing 1.4s infinite ease-in-out both; }
.rp-dot:nth-child(1) { animation-delay: -0.32s; }
.rp-dot:nth-child(2) { animation-delay: -0.16s; }
@keyframes rp-typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
/* Fade Transition */
.rs-fade-enter-active, .rs-fade-leave-active { transition: opacity 0.4s ease, transform 0.4s ease; }
.rs-fade-enter, .rs-fade-leave-to { opacity: 0; transform: translateY(10px); }
/* 单元格穿透样式 */
.rwb-val-penetrate {
  cursor: pointer !important;
  position: relative;
  transition: all 0.2s ease;
  color: #0067FE !important;
  font-weight: 500;
  text-decoration: underline;
  text-decoration-style: dashed;
  text-underline-offset: 3px;
}
.rwb-val-penetrate:hover {
  background-color: rgba(0, 103, 254, 0.08) !important;
  border-radius: 3px;
  text-decoration-style: solid;
}
.rwb-penetrate-icon {
  font-size: 13px;
  margin-left: 3px;
  opacity: 0.7;
}
.rwb-val-penetrate:hover .rwb-penetrate-icon {
  opacity: 1;
}

/* 穿透抽屉结构 */
.rwb-pen-drawer .el-drawer__body {
  padding: 16px 20px;
  background: #f8fafc;
  overflow-y: auto;
}
.rwb-pen-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.rwb-pen-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.rwb-pen-card-title {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.rwb-pen-step-flow {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rwb-pen-step-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #f8fafc;
  border-radius: 6px;
  padding: 10px 12px;
  border-left: 4px solid #0067FE;
}
.rwb-pen-step-tag {
  font-size: 13px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  background: #fff;
  color: #475569;
  border: 1px solid #cbd5e1;
  white-space: nowrap;
}
.rwb-pen-step-main { flex: 1; }
.rwb-pen-step-name { font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 2px; }
.rwb-pen-step-desc { font-size: 13px; color: #64748b; line-height: 1.5; }
.rwb-pen-kv {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 12px;
  font-size: 13px;
}
.rwb-pen-kv-item { display: flex; align-items: center; gap: 4px; }
.rwb-pen-kv-k { color: #64748b; min-width: 80px; }
.rwb-pen-kv-v { color: #1e293b; word-break: break-all; }
/* 阶段二快捷填入与胶囊按钮 */
.rwb-fd-input-wrap { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.rwb-fd-quick-fill {
  font-size: 13px;
  color: #0067FE;
  background: rgba(0, 103, 254, 0.08);
  border: 1px solid rgba(0, 103, 254, 0.25);
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  user-select: none;
}
.rwb-fd-quick-fill:hover {
  background: #0067FE;
  color: #fff;
  border-color: #0067FE;
}
.rwb-ch-batch {
  background: rgba(0, 103, 254, 0.06);
  border-radius: 4px;
  padding: 3px 8px;
}
.rwb-ch-batch:hover {
  background: rgba(0, 103, 254, 0.12);
}

/* 监管预审合规体检卡 (Pre-audit Card) */
.rwb-preaudit-card {
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: all 0.3s;
}
.rwb-preaudit-card.is-pass {
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
  border: 1px solid #bbf7d0;
  border-left: 4px solid #16a34a;
}
.rwb-preaudit-card.is-pending {
  background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
  border: 1px solid #fde68a;
  border-left: 4px solid #d97706;
}
.rwb-pac-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(0,0,0,0.08);
}
.rwb-pac-badge {
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}
.rwb-preaudit-card.is-pass .rwb-pac-badge { color: #15803d; }
.rwb-preaudit-card.is-pending .rwb-pac-badge { color: #b45309; }
.rwb-pac-res-tag {
  font-size: 13px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 12px;
}
.rwb-pac-res-tag.is-ok {
  color: #166534;
  background: #dcfce7;
  border: 1px solid #86efac;
}
.rwb-pac-res-tag.is-warn {
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fcd34d;
}
.rwb-pac-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 16px;
  font-size: 13px;
}
.rwb-pac-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.rwb-pac-k { color: #64748b; }
.rwb-pac-v { color: #1e293b; font-weight: 500; display: flex; align-items: center; gap: 4px; }
.rwb-pac-v .el-icon-check { color: #16a34a; font-weight: bold; }
</style>

<style>
/* ===== 全局样式（非 scoped）：append-to-body 的抽屉骨架挂在组件树外，内置元素（header/body/close）
   不携带本组件 data-v 属性，scoped 规则永远命不中——抽屉骨架的留白与关闭钮必须在全局块定义 ===== */
.rwb-cal-drawer .el-drawer__header { margin-bottom: 0; padding: 16px 20px 12px; border-bottom: 1px solid #f0f2f5; color: #0f172a; }
.rwb-cal-drawer .el-drawer__body { padding: 16px 20px 24px; overflow-y: auto; }
.rwb-cal-drawer .el-drawer__close-btn { color: #909399; }
/* 口径换算依据抽屉：三段式链路 + 章节换算项清单 */
.rwb-adapt-drawer .el-drawer__header { margin-bottom: 0; padding: 16px 20px 12px; border-bottom: 1px solid #f0f2f5; color: #0f172a; }
.rwb-adapt-drawer .el-drawer__body { padding: 14px 20px 24px; overflow-y: auto; }
.rwb-adapt-dw-title { display: flex; flex-direction: column; gap: 2px; }
.rwb-adapt-dw-title span { font-size: 15px; font-weight: 600; }
.rwb-adapt-dw-title em { font-style: normal; font-size: 13px; color: #94a3b8; }
.rwb-adapt-dw-tip { font-size: 13px; color: #8a94a6; background: #f7f9fc; border-radius: 6px; padding: 7px 10px; margin-bottom: 12px; }
.rwb-adapt-dw-tip i { color: var(--rs-color); margin-right: 4px; }
.rwb-adapt-dw-src { display: block; margin-top: 4px; color: #64748b; }
.rwb-adapt-cur { border: 1px solid #eef1f6; border-radius: 8px; padding: 12px 14px; background: #fff; }
.rwb-adapt-cur-name { font-size: 13px; font-weight: 600; color: #1E293B; margin-bottom: 10px; }
.rwb-adapt-flow { display: flex; align-items: stretch; gap: 6px; }
.rwb-adapt-flow-arrow { align-self: center; color: #c0c9d6; font-size: 14px; }
.rwb-adapt-node { flex: 1; min-width: 0; border: 1px solid #eef1f6; border-radius: 6px; padding: 8px 10px; background: #fafbfd; }
.rwb-adapt-node em { display: block; font-style: normal; font-size: 13px; color: #94a3b8; margin-bottom: 3px; }
.rwb-adapt-node b { display: block; font-size: 13px; color: #334155; line-height: 1.5; word-break: break-all; }
.rwb-adapt-node.is-rule { background: #f7f9fc; }
.rwb-adapt-node.is-out { background: #f2f7ff; border-color: #dbe7fa; }
.rwb-adapt-node.is-out b { color: #1F4D8F; }
.rwb-adapt-refs { margin-top: 10px; padding-top: 9px; border-top: 1px dashed #eef1f6; display: flex; flex-direction: column; gap: 6px; }
.rwb-adapt-ref { display: flex; gap: 8px; font-size: 13px; line-height: 1.6; }
.rwb-adapt-ref-key { flex-shrink: 0; width: 56px; color: #94a3b8; }
.rwb-adapt-ref-val { color: #475569; }
.rwb-adapt-ref-val em { font-style: normal; margin-left: 5px; font-size: 12px; color: var(--rs-color); border: 1px solid var(--rs-color-border); border-radius: 8px; padding: 0 5px; }
.rwb-adapt-list-title { font-size: 13px; font-weight: 600; color: #1E293B; margin: 16px 0 8px; }
.rwb-adapt-list { display: flex; flex-direction: column; gap: 4px; }
.rwb-adapt-item { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border: 1px solid #eef1f6; border-radius: 6px; font-size: 13px; cursor: pointer; transition: all .15s; }
.rwb-adapt-item:hover { border-color: var(--rs-color-border); background: #f8fbff; }
.rwb-adapt-item.is-active { border-color: var(--rs-color); background: #f2f7ff; }
.rwb-ai-idx { flex-shrink: 0; width: 16px; height: 16px; line-height: 16px; text-align: center; border-radius: 50%; background: #eef1f6; color: #64748b; font-size: 12px; }
.rwb-adapt-item.is-active .rwb-ai-idx { background: var(--rs-color); color: #fff; }
.rwb-ai-name { flex: 1; min-width: 0; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rwb-ai-from { flex-shrink: 0; font-size: 13px; color: #94a3b8; }
.rwb-ai-val { flex-shrink: 0; font-weight: 600; color: #1F4D8F; font-variant-numeric: tabular-nums; }
.rs-archive-drawer .el-drawer__header { margin-bottom: 0; padding: 16px 20px 12px; border-bottom: 1px solid #f0f2f5; color: #0f172a; }
.rs-archive-drawer .el-drawer__body { padding: 0 0 12px; overflow-y: auto; }

/* ===== 对话消息内的富交互元素（v-html 注入内容不吃 scoped 属性，必须全局定义）===== */
/* 「一键填入」：实心主按钮形态，一眼可辨为可点按钮 */
.wb-clue-fill { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: #fff; background: var(--rs-color, #0067FE); border: none; border-radius: 6px; padding: 4px 12px; cursor: pointer; margin: 6px 0 2px; box-shadow: 0 1px 4px rgba(0, 103, 254, 0.25); transition: all .15s; }
.wb-clue-fill:hover { background: var(--rs-color-hover, #0052CC); box-shadow: 0 2px 8px rgba(0, 103, 254, 0.35); }
.wb-clue-fill i { font-size: 13px; }
/* 已处置标记：替换失效的动作按钮，明确"这件事已经办完"，避免哑按钮的点击无反应观感 */
.wb-clue-done { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: #1f9e5f; background: #eefaf3; border: 1px solid #cdebd9; border-radius: 6px; padding: 3px 10px; margin: 6px 0 2px; }
.rwb-clue-sec { font-size: 13px; color: #94a3b8; font-weight: 400; }
/* 历史对话折叠条（v-html 外，普通模板元素，样式放全局仅为与消息内元素同处管理） */
.rwb-hist-fold { display: flex; align-items: center; justify-content: center; gap: 4px; font-size: 13px; color: #94a3b8; background: #f8fafc; border: 1px dashed #e4e7ed; border-radius: 6px; padding: 5px 10px; margin: 2px 0 8px; cursor: pointer; }
.rwb-hist-fold:hover { color: var(--rs-color, #0067FE); border-color: var(--rs-color-border, rgba(0, 103, 254, 0.35)); }
.rp-typing-indicator { display: inline-flex; gap: 4px; padding: 4px 0; align-items: center; height: 20px; }
.rp-dot { width: 6px; height: 6px; background-color: var(--rs-color); border-radius: 50%; animation: rp-typing 1.4s infinite ease-in-out both; }
.rp-dot:nth-child(1) { animation-delay: -0.32s; }
.rp-dot:nth-child(2) { animation-delay: -0.16s; }
@keyframes rp-typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
/* Fade Transition */
.rs-fade-enter-active, .rs-fade-leave-active { transition: opacity 0.4s ease, transform 0.4s ease; }
.rs-fade-enter, .rs-fade-leave-to { opacity: 0; transform: translateY(10px); }
/* 单元格穿透样式 */
.rwb-val-penetrate {
  cursor: pointer !important;
  position: relative;
  transition: all 0.2s ease;
  color: #0067FE !important;
  font-weight: 500;
  text-decoration: underline;
  text-decoration-style: dashed;
  text-underline-offset: 3px;
}
.rwb-val-penetrate:hover {
  background-color: rgba(0, 103, 254, 0.08) !important;
  border-radius: 3px;
  text-decoration-style: solid;
}
.rwb-penetrate-icon {
  font-size: 13px;
  margin-left: 3px;
  opacity: 0.7;
}
.rwb-val-penetrate:hover .rwb-penetrate-icon {
  opacity: 1;
}

/* 穿透抽屉结构 */
.rwb-pen-drawer .el-drawer__body {
  padding: 16px 20px;
  background: #f8fafc;
  overflow-y: auto;
}
.rwb-pen-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.rwb-pen-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.rwb-pen-card-title {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.rwb-pen-step-flow {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rwb-pen-step-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #f8fafc;
  border-radius: 6px;
  padding: 10px 12px;
  border-left: 4px solid #0067FE;
}
.rwb-pen-step-tag {
  font-size: 13px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  background: #fff;
  color: #475569;
  border: 1px solid #cbd5e1;
  white-space: nowrap;
}
.rwb-pen-step-main { flex: 1; }
.rwb-pen-step-name { font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 2px; }
.rwb-pen-step-desc { font-size: 13px; color: #64748b; line-height: 1.5; }
.rwb-pen-kv {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 12px;
  font-size: 13px;
}
.rwb-pen-kv-item { display: flex; align-items: center; gap: 4px; }
.rwb-pen-kv-k { color: #64748b; min-width: 80px; }
.rwb-pen-kv-v { color: #1e293b; word-break: break-all; }
/* 阶段二快捷填入与胶囊按钮 */
.rwb-fd-input-wrap { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.rwb-fd-quick-fill {
  font-size: 13px;
  color: #0067FE;
  background: rgba(0, 103, 254, 0.08);
  border: 1px solid rgba(0, 103, 254, 0.25);
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  user-select: none;
}
.rwb-fd-quick-fill:hover {
  background: #0067FE;
  color: #fff;
  border-color: #0067FE;
}
.rwb-ch-batch {
  background: rgba(0, 103, 254, 0.06);
  border-radius: 4px;
  padding: 3px 8px;
}
.rwb-ch-batch:hover {
  background: rgba(0, 103, 254, 0.12);
}

/* 监管预审合规体检卡 (Pre-audit Card) */
.rwb-preaudit-card {
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: all 0.3s;
}
.rwb-preaudit-card.is-pass {
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
  border: 1px solid #bbf7d0;
  border-left: 4px solid #16a34a;
}
.rwb-preaudit-card.is-pending {
  background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
  border: 1px solid #fde68a;
  border-left: 4px solid #d97706;
}
.rwb-pac-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(0,0,0,0.08);
}
.rwb-pac-badge {
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}
.rwb-preaudit-card.is-pass .rwb-pac-badge { color: #15803d; }
.rwb-preaudit-card.is-pending .rwb-pac-badge { color: #b45309; }
.rwb-pac-res-tag {
  font-size: 13px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 12px;
}
.rwb-pac-res-tag.is-ok {
  color: #166534;
  background: #dcfce7;
  border: 1px solid #86efac;
}
.rwb-pac-res-tag.is-warn {
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fcd34d;
}
.rwb-pac-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 16px;
  font-size: 13px;
}
.rwb-pac-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.rwb-pac-k { color: #64748b; }
.rwb-pac-v { color: #1e293b; font-weight: 500; display: flex; align-items: center; gap: 4px; }
.rwb-pac-v .el-icon-check { color: #16a34a; font-weight: bold; }

/* ===== 形式B：成稿校核式 ===== */
.rwb-doc { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0, 103, 254, 0.06); }
.doc-topbar { position: relative; padding: 8px 14px 10px; border-bottom: 1px solid #eef2f7; background: #fafcff; display: flex; align-items: center; gap: 14px; }
.doc-nav-h { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; }
.doc-nav-label { flex: none; font-size: 13px; color: #64748b; font-weight: 600; }
.doc-nav-label i { margin-right: 2px; }
.doc-nav-select-wrap { position: relative; flex: 1; min-width: 0; }
.doc-nav-select { display: flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border: 1px solid #e2eaf5; border-radius: 6px; background: #fff; font-size: 13px; color: #1e293b; cursor: pointer; transition: all .15s; }
.doc-nav-select:hover, .doc-nav-select.open { border-color: #0067fe; box-shadow: 0 0 0 2px rgba(0,103,254,.08); }
.doc-nav-select-no { flex: none; color: #64748b; font-size: 13px; }
.doc-nav-select-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
.doc-nav-select-count { flex: none; font-size: 12px; color: #94a3b8; }
.doc-nav-arrow { flex: none; font-size: 13px; color: #94a3b8; }
.doc-nav-dropdown { position: absolute; left: 0; right: 0; top: 30px; z-index: 30; max-height: 340px; overflow-y: auto; background: #fff; border: 1px solid #e2eaf5; border-radius: 8px; box-shadow: 0 8px 24px rgba(15,23,42,.12); padding: 4px 0; }
.doc-nav-option { display: flex; align-items: center; gap: 6px; padding: 6px 10px; cursor: pointer; font-size: 13px; }
.doc-nav-option:hover { background: #f5f9ff; }
.doc-nav-option.active { background: #e8f2ff; }
.doc-nav-option.active .doc-nav-opt-name { color: #0067fe; font-weight: 600; }
.doc-nav-opt-no { flex: none; font-size: 13px; color: #94a3b8; min-width: 34px; }
.doc-nav-opt-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #475569; }
.doc-nav-opt-count { flex: none; font-size: 12px; color: #b0b8c4; }
.doc-nav-dot { width: 6px; height: 6px; border-radius: 50%; flex: none; }
.doc-nav-dot.is-done { background: #0f9d58; }
.doc-nav-dot.is-partial { background: #d48806; }
.doc-nav-dot.is-missing { background: #F56C6C; }
.doc-progress { flex: none; display: flex; align-items: center; gap: 8px; font-size: 13px; color: #475569; }
.doc-progress-num b { color: #0067fe; font-size: 14px; }
.doc-progress-tag { padding: 1px 7px; border-radius: 9px; font-size: 12px; }
.doc-progress-track { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: #eef2f7; }
.doc-progress-fill { height: 100%; background: linear-gradient(90deg, #0067fe, #4d9bff); transition: width .3s; }
.doc-main { display: none; }
.doc-nav { display: none; }
.doc-body { flex: 1; min-height: 0; overflow-y: auto; padding: 18px 22px; }
.doc-title { font-size: 18px; font-weight: 700; color: #0f172a; text-align: center; }
.doc-subtitle { margin-top: 4px; text-align: center; font-size: 13px; color: #94a3b8; }
.doc-section { margin-top: 16px; }
.doc-sec-title { font-size: 13px; font-weight: 700; color: #1e293b; padding-left: 8px; border-left: 3px solid #0067fe; margin-bottom: 8px; }
.doc-field, .doc-text-item { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-bottom: 1px dashed #eef2f7; cursor: pointer; transition: background .15s; }
.doc-field:hover, .doc-text-item:hover { background: #f7fbff; }
.doc-field-label { flex: none; width: 170px; font-size: 13px; color: #64748b; }
.doc-field-value { flex: 1; min-width: 0; font-size: 13px; color: #1e293b; font-weight: 600; }
.doc-field-value.is-empty { color: #F56C6C; font-weight: 400; }
.doc-field-src { flex: none; font-size: 12px; color: #94a3b8; }
.doc-text-label { flex: none; width: 60px; font-size: 13px; color: #64748b; }
.doc-cell-input { width: 100%; }
.doc-cell-input .el-input__inner { height: 22px; line-height: 22px; font-size: 13px; padding: 0 6px; text-align: right; }
.doc-cell-clickable { cursor: text; display: block; min-height: 18px; border-radius: 3px; }
.doc-cell-clickable:hover { background: #f0f7ff; box-shadow: inset 0 0 0 1px #bae0ff; }
.doc-mat-icon { cursor: pointer; font-size: 13px; margin: 0 4px; opacity: 0.8; }
.doc-mat-icon:hover { opacity: 1; transform: scale(1.15); }
.doc-mat-icon.mat-exact { color: #1890ff; opacity: 1; }
.doc-mat-icon.mat-loose { color: #bfbfbf; opacity: 0.7; }
.doc-mat-icon.mat-none { color: #ff4d4f; opacity: 0.5; filter: grayscale(1); }
.doc-inline-input { flex: 1; min-width: 120px; }
.doc-inline-input .el-input__inner { height: 26px; line-height: 26px; font-size: 13px; padding: 0 8px; }
.doc-inline-input .el-textarea__inner { font-size: 13px; padding: 6px 8px; line-height: 1.7; }
.doc-text-value { flex: 1; min-width: 0; font-size: 13px; color: #1e293b; line-height: 1.7; }
.doc-status { flex: none; display: inline-flex; align-items: center; gap: 3px; padding: 1px 7px; border-radius: 9px; font-size: 12px; cursor: pointer; }
.doc-st-confirmed { background: #e6f7ec; color: #0f9d58; border: 1px solid #cdebd7; }
.doc-st-pending { background: #fff7e6; color: #d48806; border: 1px solid #ffe7ba; }
.doc-st-missing { background: #fef0f0; color: #F56C6C; border: 1px solid #fde2e2; }
.doc-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.doc-table th { background: #f5f7fa; color: #64748b; font-weight: 600; padding: 7px 6px; border: 1px solid #ebeef5; white-space: nowrap; }
.doc-table td { padding: 7px 6px; border: 1px solid #ebeef5; color: #1e293b; text-align: center; }
.doc-table tbody tr { cursor: pointer; }
.doc-table tbody tr:hover td { background: #f7fbff; }
.doc-footer { padding: 10px 16px; border-top: 1px solid #eef2f7; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #fafcff; }
.doc-footer-hint { font-size: 13px; color: #94a3b8; }
.doc-footer-btns { display: flex; gap: 8px; }


.doc-table-wrap { border: 1px solid #eef2f7; border-radius: 8px; overflow: hidden; }
.doc-table-meta { display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: #fafcff; border-bottom: 1px solid #eef2f7; font-size: 13px; color: #94a3b8; }
.doc-table-fill { padding: 1px 7px; border-radius: 9px; background: #eef4ff; color: #2b6cb0; border: 1px solid #dbeafe; }
.doc-table-count { color: #b0b8c4; }
.doc-table-wrap { overflow-x: auto; overflow-y: hidden; }
.doc-table-wrap .doc-table { display: table; width: 100%; min-width: 100%; }
.doc-th-status, .doc-td-status { position: sticky; right: 0; background: #fff; box-shadow: -4px 0 6px -4px rgba(0,0,0,0.08); }
.doc-table thead .doc-th-status { background: #f5f7fa; }
.doc-text-value { line-height: 1.7; }


/* ===== 章节导航 ===== */
.doc-main { flex: 1; min-height: 0; display: flex; }
.doc-nav { flex: none; width: 178px; border-right: 1px solid #eef2f7; background: #fafcff; display: flex; flex-direction: column; overflow: hidden; }
.doc-nav-title { padding: 8px 12px; font-size: 13px; font-weight: 700; color: #64748b; border-bottom: 1px solid #eef2f7; background: #f5f8fc; }
.doc-nav-list { flex: 1; min-height: 0; overflow-y: auto; padding: 6px 0; }
.doc-nav-item { display: flex; align-items: center; gap: 6px; padding: 5px 10px; cursor: pointer; border-left: 2px solid transparent; transition: all .15s; }
.doc-nav-item:hover { background: #f0f6ff; }
.doc-nav-item.active { background: #e8f2ff; border-left-color: #0067fe; }
.doc-nav-item.active .doc-nav-name { color: #0067fe; font-weight: 600; }
.doc-nav-no { flex: none; font-size: 12px; color: #94a3b8; min-width: 30px; }
.doc-nav-name { flex: 1; min-width: 0; font-size: 13px; color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.doc-nav-dot { flex: none; width: 6px; height: 6px; border-radius: 50%; }
.doc-nav-dot.is-done { background: #0f9d58; }
.doc-nav-dot.is-partial { background: #d48806; }
.doc-nav-dot.is-missing { background: #F56C6C; }


/* 章节选择器：限制宽度 */
.doc-nav-h { flex: none; display: flex; align-items: center; gap: 8px; max-width: 380px; }
.doc-nav-select-wrap { position: relative; flex: none; width: 210px; }
.doc-nav-select-name { max-width: 118px; }
.doc-next-btn { flex: none; padding: 5px 10px !important; font-size: 13px !important; border-color: #ffe0b2 !important; color: #d48806 !important; background: #fffaf0 !important; }
.doc-next-btn:hover { background: #fff3e0 !important; border-color: #ffc069 !important; }
.doc-next-count { font-style: normal; margin-left: 3px; padding: 0 5px; border-radius: 8px; background: #ffe7ba; color: #ad6800; font-size: 12px; }
.doc-item-flash { background: #fffbe6 !important; box-shadow: inset 3px 0 0 #d48806; }
.doc-item-flash td { background: #fffbe6 !important; }


/* 表格：贴近附件2 版式 */
.doc-table th { vertical-align: middle; line-height: 1.35; font-size: 13px; padding: 6px 8px; }
.doc-table td { font-size: 13px; padding: 6px 8px; }
.doc-td-name { text-align: left !important; padding-left: 10px !important; color: #334155; }
.doc-td-num { text-align: right !important; font-variant-numeric: tabular-nums; }
.doc-table tbody tr:nth-child(even) td { background: #fcfdff; }
.doc-table tbody tr:hover td { background: #f2f8ff !important; }


/* 表格列宽：状态列固定，说明/名称列自适应占满 */
.doc-th-status, .doc-td-status { width: 72px; min-width: 72px; }
.doc-table th.doc-th-status { padding-left: 4px; padding-right: 4px; }
.doc-table td.doc-td-status { padding-left: 4px; padding-right: 6px; }
.doc-table th:last-of-type:not(.doc-th-status), .doc-table td.doc-td-num:last-of-type { }


/* ===== 形式B：两态切换 ===== */
.doc-mode-switch { flex: none; display: flex; gap: 2px; padding: 2px; background: #eef2f7; border-radius: 7px; }
.doc-mode-btn { padding: 3px 12px; font-size: 13px; color: #64748b; border-radius: 5px; cursor: pointer; transition: all .15s; white-space: nowrap; }
.doc-mode-btn:hover { color: #0067fe; }
.doc-mode-btn.active { background: #fff; color: #0067fe; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,.08); }

/* ===== 预览与归档态 ===== */
.doc-preview { flex: 1; min-height: 0; overflow-y: auto; padding: 14px 18px; background: #f7f9fc; }
.dp-card { background: #fff; border: 1px solid #eef2f7; border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; }
.dp-meta-row { display: flex; align-items: center; gap: 12px; font-size: 13px; color: #475569; flex-wrap: wrap; }
.dp-meta-sub { margin-top: 6px; font-size: 13px; color: #94a3b8; }
.dp-badge { padding: 1px 8px; border-radius: 9px; background: #fff7e6; color: #d48806; border: 1px solid #ffe7ba; font-size: 13px; font-weight: 600; }
.dp-badge.is-filed { background: #e6f7ec; color: #0f9d58; border-color: #cdebd7; }
.dp-meta-item b { color: #0f172a; }
.dp-meta-sub code { background: #f5f7fa; padding: 1px 5px; border-radius: 3px; font-size: 13px; color: #64748b; }
.dp-muted { color: #b0b8c4; }
.dp-check { display: flex; gap: 16px; align-items: center; font-size: 13px; flex-wrap: wrap; }
.dp-check-item { display: inline-flex; align-items: center; gap: 4px; }
.dp-check-item.is-pass { color: #0f9d58; }
.dp-check-item.is-warn { color: #d48806; }
.dp-body { background: #fff; border: 1px solid #eef2f7; border-radius: 8px; padding: 22px 26px; margin-bottom: 10px; }
.dp-field { display: flex; gap: 12px; padding: 6px 0; border-bottom: 1px dashed #f0f3f8; font-size: 13px; }
.dp-field-label { flex: none; width: 170px; color: #64748b; }
.dp-field-value { flex: 1; color: #1e293b; font-weight: 600; }
.dp-table-wrap { overflow-x: auto; }
.dp-text { font-size: 13px; line-height: 1.8; color: #334155; margin: 4px 0; }
.dp-audit-title { font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
.dp-audit-flow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dp-audit-node { display: flex; align-items: center; gap: 6px; padding: 6px 10px; border: 1px solid #eef2f7; border-radius: 6px; background: #fafcff; }
.dp-audit-node.done { border-color: #cdebd7; background: #f4fbf7; }
.dp-audit-node i { color: #94a3b8; }
.dp-audit-node.done i { color: #0f9d58; }
.dp-audit-main { display: flex; flex-direction: column; }
.dp-audit-name { font-size: 13px; color: #1e293b; font-weight: 600; }
.dp-audit-by { font-size: 13px; color: #94a3b8; }
.dp-audit-arrow { color: #cbd5e1; font-size: 13px; }


.dp-sec-head { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; padding: 6px 8px; border-radius: 5px; }
.dp-sec-head:hover { background: #f2f8ff; }
.dp-sec-head > span:first-child { flex: 1; }
.dp-sec-meta { flex: none; font-size: 13px; color: #94a3b8; font-weight: 400; }
.dp-sec-arrow { flex: none; font-size: 13px; color: #94a3b8; }
.doc-mode-btn i { margin-right: 3px; font-size: 13px; }
.doc-mode-btn { padding: 4px 14px; font-size: 13px; }

</style>







