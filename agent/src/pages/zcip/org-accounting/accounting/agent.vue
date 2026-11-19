<template>
  <div class="agent-page">

    <!-- ===== 任务对话模式（原有九阶段界面） ===== -->
    <div v-if="pageMode === 'task-active'" class="task-active-mode">

    <div class="agent-body">
      <!-- 左侧：智能体对话框 -->
      <div class="agent-chat-container">
          <div class="chat-header">
          <div class="header-title">
            <AgentIcon icon="ai-core" :size="26" />
            <span class="chat-name-highlight" style="font-weight:600; margin-left: 8px; font-size:16px;">小易</span>
            <span class="product-name-badge" v-if="currentProductName">{{ currentProductName }}</span>
          </div>
          <div class="header-actions">
            <span class="token-counter" v-if="estimatedTokens > 0">
              <i class="el-icon-coin"></i> {{ formattedTokens }}
            </span>
            <span class="back-link-agent" @click="goBackToUpper"><i class="el-icon-back"></i> 返回</span>
            <span class="toolbar-icon-sep" @click="resetSession"><i class="el-icon-refresh-left"></i> 重置</span>
          </div>
        </div>

        <div class="chat-messages" ref="chatMessagesRef">
          <div v-for="msg in messages" :key="msg.id"
            :class="['message-row', `message--${msg.role}`]">
            <div class="msg-avatar">
              <AgentIcon v-if="msg.role === 'assistant'" icon="ai-core" :size="26" />
              <i v-else class="el-icon-user"></i>
            </div>
            <div class="msg-body">
              <div class="msg-text" v-html="renderMarkdown(msg.content)"></div>
              <div v-if="msg.suggestions && msg.suggestions.length" class="msg-suggestions">
                <span v-for="(s, i) in msg.suggestions" :key="i" class="suggestion-btn" :class="{ 'suggestion-disabled': isTyping }" @click="!isTyping && sendSuggestion(s)">{{ s }}</span>
              </div>
              <div class="msg-footer">
                <span class="msg-time">{{ msg.timestamp }}</span>
                <div class="msg-actions" v-if="msg.role === 'assistant'">
                  <span class="msg-action-btn" title="复制内容" @click="copyMessageContent(msg.content)">
                    <i class="el-icon-document-copy"></i>
                  </span>
                  <span class="msg-action-btn" title="重新生成" @click="regenerateMessage(msg.id)">
                    <i class="el-icon-refresh"></i>
                  </span>
                </div>
                <div class="msg-actions" v-else-if="msg.role === 'user'">
                  <span class="msg-action-btn" title="复制内容" @click="copyMessageContent(msg.content)">
                    <i class="el-icon-document-copy"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部占位 -->
          <!-- 打字指示器 -->
          <div v-if="isTyping" class="message-row message--assistant">
            <div class="msg-avatar">
              <AgentIcon icon="ai-core" :size="26" />
            </div>
            <div class="msg-body">
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <!-- 快捷指令面板 -->
          <div v-if="showCmdPanel" class="cmd-panel">
            <div class="cmd-panel-header">
              <span class="cmd-panel-title"><i class="el-icon-s-opportunity"></i> 快捷指令</span>
              <span class="cmd-panel-close" @click="showCmdPanel = false"><i class="el-icon-close"></i></span>
            </div>
            <div class="cmd-panel-body">
              <div class="cmd-group">
                <div class="cmd-group-title">核算操作</div>
                <div class="cmd-list">
                  <span class="cmd-item" @click="useCmd('开始核算')"><i class="el-icon-video-play"></i> 开始核算</span>
                  <span class="cmd-item" @click="useCmd('下一步')"><i class="el-icon-right"></i> 下一步</span>
                  <span class="cmd-item" @click="useCmd('查看结果')"><i class="el-icon-view"></i> 查看结果</span>
                  <span class="cmd-item" @click="useCmd('重算')"><i class="el-icon-refresh"></i> 重算</span>
                </div>
              </div>
              <div class="cmd-group">
                <div class="cmd-group-title">配置向导</div>
                <div class="cmd-list">
                  <span class="cmd-item cmd-item-highlight" @click="useCmd('配置边界')"><i class="el-icon-set-up"></i> 边界配置向导</span>
                  <span class="cmd-item cmd-item-highlight" @click="useCmd('确认数据来源')"><i class="el-icon-document-checked"></i> 数据确认向导</span>
                </div>
              </div>
              <div class="cmd-group">
                <div class="cmd-group-title">数据查询</div>
                <div class="cmd-list">
                  <span class="cmd-item" @click="useCmd('查询排放因子')"><i class="el-icon-search"></i> 查询排放因子</span>
                  <span class="cmd-item" @click="useCmd('查看核算边界')"><i class="el-icon-set-up"></i> 查看核算边界</span>
                  <span class="cmd-item" @click="useCmd('查看数据校验结果')"><i class="el-icon-circle-check"></i> 校验结果</span>
                </div>
              </div>
              <div class="cmd-group">
                <div class="cmd-group-title">报告导出</div>
                <div class="cmd-list">
                  <span class="cmd-item" @click="useCmd('导出排放报告')"><i class="el-icon-document"></i> 导出报告</span>
                  <span class="cmd-item" @click="useCmd('导出计算数据')"><i class="el-icon-download"></i> 导出数据</span>
                </div>
              </div>
            </div>
          </div>
          <div class="input-box">
            <textarea
              class="input-textarea"
              v-model="inputText"
              placeholder="提问或输入指令（输入 / 呼出快捷指令）…"
              rows="1"
              @keydown.enter.exact="handleSendKey"
              @input="autoResizeTextarea"
              ref="inputTextareaRef"
            ></textarea>
            <div class="input-box-footer">
              <div class="input-toolbar">
                <span class="toolbar-icon" title="快捷指令" @click="showCmdPanel = !showCmdPanel"><i class="el-icon-s-opportunity"></i></span>
                <span class="toolbar-icon" title="语音输入" @click="$message.info('语音输入功能开发中')"><i class="el-icon-microphone"></i></span>
                <span class="toolbar-icon" title="图片上传" @click="$message.info('图片上传功能开发中')"><i class="el-icon-picture"></i></span>
                <span class="toolbar-icon" title="附件上传" @click="$message.info('附件上传功能开发中')"><i class="el-icon-upload2"></i></span>
              </div>
              <button class="send-btn" :disabled="!inputText.trim() || isTyping" @click="handleSend">
                <i class="el-icon-s-promotion"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：阶段0=标准库+解析内容上下布局，阶段1+=全屏内容 -->
      <aside class="agent-resources-sidebar">
        <!-- 九阶段进度条（单行：圆圈+名称） -->
        <div class="phase-progress-bar">
          <div class="phase-track">
            <div v-for="(phase, idx) in phases" :key="phase.key"
              :class="['phase-track-node', { 'track-active': idx === currentStepIndex, 'track-done': idx < currentStepIndex }]"
              @click="jumpToPhase(idx)">
              <div class="track-dot">
                <i v-if="idx < currentStepIndex" class="el-icon-check"></i>
                <span v-else>{{ idx + 1 }}</span>
              </div>
              <span class="track-label">{{ phase.name }}</span>
              <div v-if="idx < phases.length - 1" :class="['track-line', { 'track-line-done': idx < currentStepIndex || idx === currentStepIndex - 0.5 }]"></div>
            </div>
          </div>
        </div>

        <!-- 阶段0：上部核算标准（当前标准 + 切换） -->
        <div v-if="currentStepIndex === 0" class="sidebar-upper">
          <div class="upper-header">
            <div class="upper-title-row">
              <i class="el-icon-reading"></i>
              <span class="upper-title">政策标准</span>
              <el-button v-if="standardsWithSelection.length > 1" type="text" size="mini" class="std-switch-btn"
                @click="standardPickerOpen = !standardPickerOpen">
                {{ standardPickerOpen ? '收起' : '切换标准' }}
                <i :class="standardPickerOpen ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
              </el-button>
            </div>
          </div>

          <div v-if="!standardPickerOpen && selectedStandardConfig" class="std-current">
            <i class="el-icon-document-checked std-current-icon"></i>
            <div class="std-current-main">
              <span class="std-current-code">{{ selectedStandardConfig.code }}</span>
              <span class="std-current-name">{{ selectedStandardConfig.name }}</span>
            </div>
            <span class="std-current-tag">已选中</span>
          </div>

          <div v-else class="standards-list">
            <div v-for="std in standardsWithSelection" :key="std.code"
              :class="['standard-item', { 'standard-selected': std.code === selectedStandard }]"
              @click="selectStandard(std.code)">
              <div :class="['std-icon', { 'std-icon-selected': std.code === selectedStandard }]">
                <i :class="std.code === selectedStandard ? 'el-icon-folder-opened' : 'el-icon-folder'"></i>
              </div>
              <div class="std-info">
                <div class="std-code">{{ std.code }}</div>
                <div class="std-name">{{ std.name }}</div>
              </div>
              <el-tag v-if="std.code === selectedStandard" size="mini" type="success" effect="dark">已选中</el-tag>
            </div>
          </div>
        </div>


        <!-- 阶段0分割线 -->
        <div v-if="currentStepIndex === 0" class="sidebar-divider"></div>

        <!-- 下部：阶段0时在sidebar-lower内展示解析内容，阶段1+时占满右侧 -->
        <div :class="[currentStepIndex === 0 ? 'sidebar-lower' : 'sidebar-lower sidebar-lower-full']">
          <!-- 未选中标准时（仅阶段0） -->
          <div v-if="!selectedStandard && currentStepIndex === 0" class="lower-empty">
            <i class="el-icon-document"></i>
            <p>请从上方选择一个标准<br>查看其解析内容</p>
          </div>

          <!-- 阶段 0：标准解析结果（随选中标准动态渲染） -->
          <div v-if="currentStepIndex === 0 && selectedStandardConfig" class="parsing-section stage-scroll s1-section">
            <div class="content-header">
              <div class="content-header-row">
                <i class="el-icon-document"></i>
                <span class="content-header-title">标准内容解析</span>
              </div>
            </div>

            <div class="parsing-cards">
              <div class="parsing-card" v-for="blk in orgParsingBlocks" :key="blk.key">
                <div class="parsing-card-header">
                  <span :class="['parsing-card-icon', blk.icon]"></span>
                  <span class="parsing-card-title">{{ blk.title }}</span>
                </div>
                <div class="parsing-card-body" v-html="blk.html"></div>
              </div>
              <div v-if="!orgParsingBlocks.length" class="parsing-card">
                <div class="parsing-card-body">
                  <p>该标准暂无结构化解析内容，可在任务中按标准要求逐步确认。</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 阶段 1：核算边界配置（5个子步骤） -->
          <div v-else-if="currentStepIndex === 1" class="parsing-section stage-scroll s2-section">
            <div class="content-header">
              <div class="content-header-row">
                <i class="el-icon-set-up"></i>
                <span class="content-header-title">核算边界配置</span>
                <span class="content-header-sub">组织碳核算 · 5 项配置</span>
              </div>
            </div>

            <!-- 子步骤进度 -->
            <div class="sub-step-progress">
              <div v-for="(label, idx) in boundarySubStepLabels" :key="idx"
                :class="['sub-step-item', { 'sub-step-done': idx < boundaryActiveIdx, 'sub-step-active': idx === boundaryActiveIdx }]">
                <div class="sub-step-dot">{{ idx + 1 }}</div>
                <span>{{ label }}</span>
              </div>
            </div>

            <!-- 可编辑配置列表 -->
            <div class="boundary-edit-list">
              <!-- ① 组织边界 -->
              <div class="boundary-edit-row">
                <span class="boundary-edit-label">组织边界</span>
                <el-select v-model="boundaryConfig.lifecycleScope" size="mini" class="boundary-edit-control" @change="onBoundaryEdit('lifecycleScope')">
                  <el-option label="运营控制权法" value="operational"></el-option>
                  <el-option label="财务控制权法" value="financial"></el-option>
                  <el-option label="股权比例法" value="equity"></el-option>
                </el-select>
              </div>
              <!-- ② 核算范围 -->
              <div class="boundary-edit-row">
                <span class="boundary-edit-label">核算范围</span>
                <div class="boundary-edit-group">
                  <el-select v-model="boundaryConfig.unitType" size="mini" class="boundary-edit-type" @change="onBoundaryEdit('unitType')">
                    <el-option label="范围1+2" value="scope12"></el-option>
                    <el-option label="范围1+2+3" value="scope123"></el-option>
                  </el-select>
                  <el-input v-model="boundaryConfig.unitDetail" size="mini" class="boundary-edit-detail" readonly title="按选定范围自动生成"></el-input>
                </div>
              </div>
              <!-- ③ 基准年 -->
              <div class="boundary-edit-row">
                <span class="boundary-edit-label">基准年</span>
                <el-date-picker v-model="boundaryConfig.baseYear" type="year" value-format="yyyy"
                  placeholder="选择核算基准年" size="mini" class="boundary-edit-control" style="width: 140px;">
                </el-date-picker>
              </div>
              <!-- ④ 数据所属期 -->
              <div class="boundary-edit-row">
                <span class="boundary-edit-label">数据所属期</span>
                <el-date-picker v-model="boundaryDateRange" type="daterange" size="mini" class="boundary-edit-control"
                  range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期"
                  value-format="yyyy-MM-dd" format="yyyy-MM-dd" :clearable="false"
                  :picker-options="periodPickerOptions"
                  @change="onBoundaryPeriodChange"></el-date-picker>
              </div>
              <!-- ⑤ 排放因子库 -->
              <div class="boundary-edit-row boundary-factor-row">
                <span class="boundary-edit-label">排放因子库</span>
                <div class="flc-wrap">
                  <el-select v-model="selectedFactorLibs" multiple filterable
                    class="flc-select" placeholder="选择排放因子库（可多选）" size="mini">
                    <el-option v-for="lib in availableFactorLibs()" :key="lib.id"
                      :label="lib.shortName || lib.name" :value="lib.id" :disabled="lib.required">
                      <div class="flc-opt">
                        <span class="flc-opt-name">{{ lib.shortName || lib.name }}</span>
                        <span class="flc-opt-meta">{{ lib.version }} · {{ lib.releaseDate }}</span>
                        <el-tag v-if="lib.required" size="mini" type="warning" effect="plain">标准要求</el-tag>
                      </div>
                    </el-option>
                  </el-select>
                  <div class="flc-foot">
                    已启用 <b>{{ selectedFactorLibs.length }}</b> 个库
                    <el-button type="text" size="mini" @click="selectAllFactorLibs(true)">全选</el-button>
                    <el-button type="text" size="mini" @click="selectAllFactorLibs(false)">仅保留必选</el-button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- 阶段四/五/六数据质检（数据清单） -->
          <div v-else-if="currentStepIndex >= 3 && currentStepIndex <= 5 && validationStep >= 1 && validationStep < 6" class="parsing-section stage-scroll tabbed s6-section">



            <div v-if="currentStepIndex === 5" class="val-tab-header">
              <div :class="['val-tab-btn', { active: validationActiveTab === 'validation' }]" @click="validationActiveTab = 'validation'">
                <i class="el-icon-warning-outline"></i>
                <span>待补充 / 待确认</span>
                <em class="val-tab-badge" v-if="validationItems.filter(v => v.status !== 'resolved' && v.status !== 'skipped').length">{{ validationItems.filter(v => v.status !== 'resolved' && v.status !== 'skipped').length }}</em>
              </div>

              <div :class="['val-tab-btn', { active: validationActiveTab === 'activity' }]" @click="validationActiveTab = 'activity'">
                <i class="el-icon-document-copy"></i>
                <span>数据清单</span>
              </div>
            </div>

            <!-- 页签1：待补充 / 待确认清单（仅阶段6） -->
            <div v-if="currentStepIndex === 5 && validationActiveTab === 'validation'" class="val-tab-content">

              <!-- ① 补充/确认清单（全宽，可下载） -->
              <div class="val-section val-checklist-section">
                <div class="val-section-header">
                  <div class="val-section-title">
                    <i class="el-icon-warning-outline"></i>
                    <span>补充 / 确认清单</span>
                    <el-tag size="mini" type="danger" effect="plain" v-if="validationItems.filter(v => v.status === 'missing').length">
                      缺失 {{ validationItems.filter(v => v.status === 'missing').length }}
                    </el-tag>
                    <el-tag size="mini" type="warning" effect="plain" v-if="validationItems.filter(v => v.status === 'pending').length">
                      待确认 {{ validationItems.filter(v => v.status === 'pending').length }}
                    </el-tag>
                  </div>
                  <el-button size="mini" type="text" icon="el-icon-download" @click="downloadMissingChecklist">下载清单</el-button>
                </div>
                <div class="val-checklist-body">
                  <div v-for="item in validationItems.filter(v => v.status !== 'resolved' && v.status !== 'skipped')" :key="'ck-' + item.id" class="checklist-item">
                    <div class="checklist-item-info">
                      <i :class="item.status === 'missing' ? 'el-icon-error' : 'el-icon-question'" :style="{ color: item.status === 'missing' ? '#f56c6c' : '#e6a23c', fontSize: '14px' }"></i>
                      <span class="checklist-item-name">{{ item.ioName || item.name || item.label }}</span>
                      <el-tag size="mini" :type="item.status === 'missing' ? 'danger' : 'warning'" effect="plain">{{ item.stage }}</el-tag>
                      <el-tag size="mini" type="info" effect="plain">{{ item.statusLabel }}</el-tag>
                    </div>
                    <div class="checklist-item-desc">{{ item.label }}</div>
                    <div class="checklist-item-suggest">
                      <i class="el-icon-paperclip"></i>
                      <span>建议上传：{{ item.supplementHint || '相关数据台账/清单文件' }}</span>
                    </div>
                  </div>
                  <div v-if="validationItems.filter(v => v.status === 'resolved').length > 0" class="checklist-resolved-tip">
                    <i class="el-icon-circle-check" style="color:#67c23a"></i>
                    已处理 {{ validationItems.filter(v => v.status === 'resolved').length }} 项
                  </div>
                </div>
              </div>

              <!-- ② 文件上传（全宽） -->
              <div class="val-section val-upload-section">
                <div class="val-section-header">
                  <div class="val-section-title">
                    <i class="el-icon-upload2"></i>
                    <span>材料上传</span>
                  </div>
                </div>
                <div class="val-upload-body">
                  <el-upload
                    action="#"
                    :auto-upload="false"
                    :show-file-list="false"
                    :on-change="handleSupplementFile"
                    multiple
                    drag
                    accept=".xlsx,.xls,.csv,.pdf,.jpg,.png"
                  >
                    <i class="el-icon-upload"></i>
                    <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
                    <div class="el-upload__tip" slot="tip">支持 Excel / PDF / 图片格式</div>
                  </el-upload>
                  <div class="supplement-file-list" v-if="supplementFiles.length > 0">
                    <div v-for="(f, i) in supplementFiles" :key="i" class="supplement-file-item">
                      <i :class="getFileIcon(f.name)"></i>
                      <span class="supplement-file-name">{{ f.name }}</span>
                      <span class="supplement-file-status" v-if="f.parsed"><i class="el-icon-circle-check"></i> 已解析</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ③ 可编辑列表（全宽，逐项填报/确认） -->
              <div class="val-section val-edit-section">
                <div class="val-section-header">
                  <div class="val-section-title">
                    <i class="el-icon-edit-outline"></i>
                    <span>逐项填报 / 确认</span>
                  </div>
                </div>
                <div class="val-edit-list">
                  <div v-for="item in validationItems" :key="item.id" class="validation-task-card" :class="`is-status-${item.status}`">
                    <div class="vtc-header">
                      <div class="vtc-title">
                        <el-tag size="mini" effect="dark" type="info">{{ item.stage }}</el-tag>
                        <i class="el-icon-arrow-right vtc-arrow"></i>
                        <el-tag size="mini" effect="plain" type="success">{{ item.process }}</el-tag>
                        <span class="vtc-problem-desc">
                          <i :class="item.status === 'missing' ? 'el-icon-warning-outline' : 'el-icon-info'" :style="{ color: item.status === 'missing' ? '#f56c6c' : '#e6a23c', marginRight: '4px' }"></i>
                          {{ item.label }}
                        </span>
                      </div>
                      <div class="vtc-status">
                        <el-tag size="small" :type="statusTagType(item.status)">{{ item.statusLabel }}</el-tag>
                      </div>
                    </div>
                    <div class="vtc-body">
                      <div class="vtc-data-field">
                        <span class="vtc-label">{{ item.ioType === 'input' ? '输入项' : '输出项' }}名称：</span>
                        <span class="vtc-value-name">{{ item.ioName || item.name || '—' }}</span>
                      </div>
                      <div class="vtc-data-field">
                        <span class="vtc-label">{{ item.status === 'missing' ? '待填报数值' : '待确认数值' }}：</span>
                        <div v-if="item.status !== 'resolved' && item.status !== 'skipped'" class="vtc-input-group">
                          <el-input size="small" v-model="item.value" placeholder="请输入..." style="width: 140px;">
                            <template slot="append" v-if="item.unit">{{ item.unit }}</template>
                          </el-input>
                        </div>
                        <div v-else class="vtc-readonly-val">
                          <strong>{{ item.value || '—' }}</strong>
                        </div>
                      </div>
                      <div class="vtc-data-field vtc-recommend-field" v-if="item.recommended !== undefined && item.status !== 'resolved' && item.status !== 'skipped'">
                        <span class="vtc-label">智能体推荐值：</span>
                        <span class="vtc-recommend-val">{{ item.recommended }}{{ item.unit ? ' ' + item.unit : '' }}</span>
                        <span class="vtc-recommend-note">{{ item.recommendNote }}</span>
                        <el-button type="text" size="mini" class="vtc-adopt-btn" @click="adoptRecommended(item)">采纳</el-button>
                      </div>
                      <div class="vtc-actions">
                        <el-button v-if="item.status !== 'resolved' && item.status !== 'skipped'" size="small" :type="item.status === 'missing' ? 'primary' : 'warning'" @click="handleValItemClick(item)">
                          <i class="el-icon-check"></i> {{ item.status === 'missing' ? '提交填报' : '确认数据' }}
                        </el-button>
                        <span v-else-if="item.status === 'resolved'" class="vtc-resolved-mark"><i class="el-icon-circle-check"></i> 已处理</span>
                        <span v-else class="vtc-skipped-mark"><i class="el-icon-remove-outline"></i> 已跳过</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 全部校验项处理完毕后的下一步入口 -->
              <div class="val-next-bar" v-if="currentStepIndex === 5 && validationAllResolved">
                <el-button type="primary" size="small" @click="finishValidation"><i class="el-icon-right"></i> 确认数据，进入下一步</el-button>
              </div>

            </div>

            <!-- 页签0：整体质量评估（仅阶段6，保留作为可选页签） -->
            <div v-if="currentStepIndex === 5 && validationActiveTab === 'quality'" class="val-tab-content quality-tab">
              <!-- 加权质量分 + DQR 环形图 -->
              <div class="qa-row-2">
                <div class="qa-hero qa-hero-clickable" title="点击查看质量分解读" @click="onQaChartClick('score')">
                  <div class="qa-hero-score">
                    <span class="qa-score-num">{{ qualityAssessment.weightedScore }}</span>
                    <span class="qa-score-max">/ 5.0</span>
                  </div>
                  <div class="qa-hero-meta">
                    <span :class="['qa-grade', 'is-' + qualityAssessment.weightedGrade.toLowerCase()]">{{ qualityAssessment.weightedGrade }} 级</span>
                    <span class="qa-hero-label">加权质量分</span>
                  </div>
                </div>
                <div class="qa-card qa-card-chart">
                  <div class="qa-card-title"><i class="el-icon-pie-chart"></i> DQR 分布</div>
                  <div ref="qaDqrChart" class="qa-chart qa-chart-clickable" style="height:152px" title="点击查看解读" @click="onQaChartClick('dqr')"></div>
                </div>
              </div>

              <!-- 数据来源结构（环形） + 覆盖率（仪表盘） -->
              <div class="qa-row-2">
                <div class="qa-card qa-card-chart">
                  <div class="qa-card-title"><i class="el-icon-coin"></i> 数据来源结构</div>
                  <div ref="qaSourceChart" class="qa-chart qa-chart-clickable" style="height:172px" title="点击查看解读" @click="onQaChartClick('source')"></div>
                </div>
                <div class="qa-card qa-card-chart">
                  <div class="qa-card-title"><i class="el-icon-aim"></i> 覆盖率</div>
                  <div ref="qaCoverChart" class="qa-chart qa-chart-clickable" style="height:172px" title="点击查看解读" @click="onQaChartClick('coverage')"></div>
                </div>
              </div>

              <!-- 因子置信度（横向条形） + 时效性（柱状对比） -->
              <div class="qa-row-2">
                <div class="qa-card qa-card-chart">
                  <div class="qa-card-title"><i class="el-icon-medal"></i> 因子匹配置信度</div>
                  <div ref="qaConfChart" class="qa-chart qa-chart-clickable" style="height:172px" title="点击查看解读" @click="onQaChartClick('conf')"></div>
                </div>
                <div class="qa-card qa-card-chart">
                  <div class="qa-card-title"><i class="el-icon-time"></i> 时效性</div>
                  <div ref="qaTimeChart" class="qa-chart qa-chart-clickable" style="height:172px" title="点击查看解读" @click="onQaChartClick('time')"></div>
                </div>
              </div>

              <!-- 低质量项清单 -->
              <div class="qa-card">
                <div class="qa-card-title">
                  <i class="el-icon-warning-outline"></i> 低质量项
                  <span class="qa-badge">{{ qualityAssessment.lowQuality.length }}</span>
                </div>
                <div v-if="!qualityAssessment.lowQuality.length" class="qa-empty">无低质量项</div>
                <div v-else class="qa-low-list">
                  <div v-for="(x, i) in qualityAssessment.lowQuality" :key="i" class="qa-low-item">
                    <span :class="['qa-low-dot', x.level === 'block' ? 'is-block' : 'is-warn']"></span>
                    <span class="qa-low-name">{{ x.proc }} · {{ x.unit }} · {{ x.key }}</span>
                    <span class="qa-low-level">{{ x.level === 'block' ? '阻断' : '警告' }}</span>
                  </div>
                </div>
              </div>
            </div>


            <!-- 页签2：活动数据与因子（范围 → 大类 → 排放源 → 排放单元） -->
            <div v-if="currentStepIndex < 5 || validationActiveTab === 'activity'" class="val-tab-content">
                <div v-for="scope in modelTree" :key="scope.key" class="activity-scope-group">
                  <!-- ① 范围 -->
                  <div class="activity-scope-header">
                    <i class="el-icon-folder-opened activity-scope-icon"></i>
                    <span class="activity-scope-name">{{ scope.name }}</span>
                    <el-tag size="mini" effect="plain">{{ scope.categories.length }} 个大类</el-tag>
                  </div>

                  <!-- ② 大类 -->
                  <div v-for="cat in scope.categories" :key="cat.key" class="activity-stage-group">
                    <div class="activity-stage-header">
                      <span :class="['stage-dot', cat.dotClass]"></span>
                      <strong>{{ cat.title }}</strong>
                      <el-tag size="mini" type="info">{{ cat.processes.length }} 个排放源</el-tag>
                    </div>

                    <!-- ③ 排放源 -->
                    <div v-for="proc in cat.processes" :key="proc.name" class="activity-proc-card">
                      <div class="activity-proc-title">
                        <i class="el-icon-document"></i>
                        <span class="activity-proc-name">{{ proc.name }}</span>
                        <span v-if="currentStepIndex >= 6 && procEmission(proc) > 0" class="activity-proc-emission">
                          {{ formatEmission(procEmission(proc)) }} tCO₂e
                        </span>
                        
                      </div>

                      <!-- ④ 排放单元参数表 -->
                      <div v-for="(u, ui) in proc.units" :key="ui" class="param-block" :data-unit="u.name">
                        <div class="param-block-head">
                          <i class="el-icon-location-outline"></i>
                          <span class="param-unit-name">{{ u.name }}</span>
                          
                          <span v-if="currentStepIndex >= 6 && u.emission > 0" class="param-unit-emission">{{ formatEmission(u.emission) }} tCO₂e</span>
                        </div>
                        <div class="param-table">
                          <div class="param-tr param-th">
                            <span class="col-name">参数名称</span>
                            <span class="col-value ta-r">参数值</span>
                            <span class="col-raw ta-c" v-if="currentStepIndex === 3">原始值</span>
                            <span class="col-src">来源 · 佐证材料</span>
                            </span>
                            <span class="col-status">状态</span>
                          </div>
                          <div v-for="p in paramsForStep(u)" :key="p.key" class="param-tr param-row"
                            :data-issue-id="paramIssueId(proc, u, p.key)"
                            :class="paramRowClass(proc, u, p)"
                            @click="selectParam(proc, u, p.key, cat.title)">
                            <span class="col-name">
                              <i :class="['param-sym', paramSymCls(p.key)]">{{ p.key }}</i>
                              {{ p.label }}
                            </span>
                            <span class="col-value ta-r" @click.stop>
                              <template v-if="!p._editing">
                                <span class="param-text" @click.stop="onParamTextClick(proc, u, p.key, cat.title)">{{ p.value || '点击填写' }}</span>
                              </template>
                              <template v-else>
                                <input class="param-input" :data-pk="p.key" v-model="p.value" placeholder="填写"
                                  @focus="p.__old = p.value"
                                  @blur="endEdit(u, p.key)"
                                  @keyup.enter="endEdit(u, p.key)" />
                              </template>
                              <span class="param-unit">{{ p.unit || '' }}</span>
                              <!-- 确认状态已由「状态」列展示，此处不再重复 -->
                            </span>
                            <span class="col-raw ta-c param-raw" v-if="currentStepIndex === 3">
                              <template v-if="p.rawValue !== undefined && p.rawValue !== ''">
                                {{ p.rawValue }}<small class="param-raw-unit" v-if="p.rawUnit"> {{ p.rawUnit }}</small>
                              </template>
                              <span v-else class="param-raw-unknown">—</span>
                            </span>
                            <span class="col-src">
                              <span class="param-src">{{ p.source || '—' }}</span>
                              <span v-if="p.proof && p.proof !== p.source" class="param-proof"><i class="el-icon-paperclip"></i> {{ p.proof }}</span>
                            </span>
                            </span>
                            <span class="col-status">
                              <!-- 阻断级：不可确认 -->
                              <span v-if="paramIssueClass(proc, u, p) === 'is-block'" class="param-tag-blocked" title="存在必须修正的问题，无法确认">
                                待修正
                              </span>
                              <!-- 无值：待补充 -->
                              <span v-else-if="!p.value" class="param-tag-missing" title="请先填写参数值">待补充</span>
                              <!-- 已确认（警告级带标记） -->
                              <span v-else-if="p.verified" class="param-tag-confirmed is-clickable"
                                :title="paramIssueClass(proc, u, p) === 'is-warn' ? '已确认（存在警告，点击取消确认）' : '点击取消确认'"
                                @click.stop="unconfirmParam(proc, u, p.key)">
                                <i class="el-icon-check"></i> 已确认
                                <i v-if="paramIssueClass(proc, u, p) === 'is-warn'" class="el-icon-warning-outline param-status-warn"></i>
                              </span>
                              <!-- 待确认 -->
                              <span v-else class="param-tag-pending is-clickable"
                                title="点击确认为已确认" @click.stop="confirmParam(proc, u, p.key)">
                                待确认
                              </span>
                              <el-tooltip v-if="paramIssueTip(proc, u, p)" :content="paramIssueTip(proc, u, p)" placement="top">
                                <i :class="['param-issue-icon', paramIssueClass(proc, u, p)]">
                                  <template v-if="paramIssueClass(proc, u, p) === 'is-block'">!</template>
                                  <template v-else-if="paramIssueClass(proc, u, p) === 'is-warn'">!</template>
                                  <template v-else>i</template>
                                </i>
                              </el-tooltip>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div v-if="!proc.units || !proc.units.length" class="param-block">


                        <div class="param-block-head">


                          <i class="el-icon-document"></i>


                          <span class="param-unit-name">{{ proc.name }}（按排放源汇总）</span>


                          <span v-if="proc.emission > 0" class="param-unit-emission">{{ formatEmission(proc.emission) }} tCO₂e</span>


                        </div>


                        <div class="param-table">


                          <div class="param-tr param-th">


                            <span>参数名称</span><span class="ta-r">参数值</span><span class="ta-c">原始值</span><span>来源 · 佐证材料</span><span class="col-status">状态</span>


                          </div>


                          <div class="param-tr param-row" @click="selectParam(proc, proc, 'AD', cat.title)">


                            <span><i class="param-sym is-ad">AD</i> 活动数据</span>


                            <span class="col-value ta-r" @click.stop>


                              <input class="param-input" v-model="proc.activityData" placeholder="填写"


                                @focus="proc.__adOld = proc.activityData"


                                @blur="onParamChange(proc, 'AD', proc.__adOld, proc.activityData)" />


                              <span class="param-unit">{{ proc.unit || '' }}</span>


                            </span>
                            <span class="col-raw ta-c" v-if="currentStepIndex === 3">
                              <template v-if="proc.rawValue !== undefined && proc.rawValue !== ''">
                                {{ proc.rawValue }}<small class="param-raw-unit" v-if="proc.rawUnit"> {{ proc.rawUnit }}</small>
                              </template>
                              <span v-else class="param-raw-unknown">—</span>
                            </span>

<span>


                              <span class="param-src">{{ proc.dataSource || '—' }}</span>


                              <span v-if="proc.proof" class="param-proof"><i class="el-icon-paperclip"></i> {{ proc.proof }}</span>


                            </span>
                            </span>
                            <span class="col-status">
                              <span v-if="procIssueLevel(proc, 'AD') === 'block'" class="param-tag-blocked" title="存在必须修正的问题，无法确认">
                                待修正
                              </span>
                              <span v-else-if="!procHasValue(proc, 'AD')" class="param-tag-missing" title="请先填写参数值">待补充</span>
                              <span v-else-if="procIsVerified(proc, 'AD')" class="param-tag-confirmed is-clickable"
                                title="点击取消确认" @click.stop="setProcVerified(proc, 'AD', false)">
                                <i class="el-icon-check"></i> 已确认
                                <i v-if="procIssueLevel(proc, 'AD') === 'warn'" class="el-icon-warning-outline param-status-warn"></i>
                              </span>
                              <span v-else class="param-tag-pending is-clickable"
                                title="点击确认为已确认" @click.stop="setProcVerified(proc, 'AD', true)">
                                待确认
                              </span>
                            </span>
                          </div>


                          <div class="param-tr param-row" @click="selectParam(proc, proc, 'EF', cat.title)">


                            <span><i class="param-sym is-ef">EF</i> 排放因子</span>


                            <span class="col-value ta-r" @click.stop>


                              <input class="param-input" v-model="proc.factor" placeholder="待匹配"


                                @focus="proc.__efOld = proc.factor"


                                @blur="onParamChange(proc, 'EF', proc.__efOld, proc.factor)" />


                              <span class="param-unit">{{ proc.factorUnit || '' }}</span>


                            </span>
                            <span class="col-raw ta-c" v-if="currentStepIndex === 3">
                              <span class="param-raw-unknown">—</span>
                            </span>

<span>


                              <span class="param-src">{{ proc.factorSource || '—' }}</span>


                            </span>
                            </span>
                            <span class="col-status">
                              <span v-if="procIssueLevel(proc, 'EF') === 'block'" class="param-tag-blocked" title="存在必须修正的问题，无法确认">
                                待修正
                              </span>
                              <span v-else-if="!procHasValue(proc, 'EF')" class="param-tag-missing" title="请先填写参数值">待补充</span>
                              <span v-else-if="procIsVerified(proc, 'EF')" class="param-tag-confirmed is-clickable"
                                title="点击取消确认" @click.stop="setProcVerified(proc, 'EF', false)">
                                <i class="el-icon-check"></i> 已确认
                                <i v-if="procIssueLevel(proc, 'EF') === 'warn'" class="el-icon-warning-outline param-status-warn"></i>
                              </span>
                              <span v-else class="param-tag-pending is-clickable"
                                title="点击确认为已确认" @click.stop="setProcVerified(proc, 'EF', true)">
                                待确认
                              </span>
                            </span>
                          </div>


                        </div>


                      </div>
                    </div>
                  </div>
                </div>
              <!-- 数据清单底部按钮栏 -->
              <div v-if="currentStepIndex === 5 && validationActiveTab === 'activity'" class="val-next-bar val-list-next-bar">
                <el-button v-if="pendingValidationCount > 0" type="warning" size="small" @click="nextIssue">
                  <i class="el-icon-right"></i> 下一项（剩余 {{ pendingValidationCount }}）
                </el-button>
                <el-button v-if="pendingValidationCount > 0" size="small" @click="skipAllIssues">
                  跳过剩余
                </el-button>
                <el-button v-else type="primary" size="small" @click="finishValidation">
                  <i class="el-icon-check"></i> 确认数据，进入下一步
                </el-button>
              </div>

            </div>
          </div>


          <!-- 阶段八（排放分析）高级选项卡面板 -->
          <div v-else-if="currentStepIndex === 7" class="parsing-section analysis-section stage-scroll">
            <div class="content-header">
              <div class="content-header-row">
                <i class="el-icon-data-line"></i>
                <span class="content-header-title">排放数据分析中心</span>
                <span class="content-header-sub">高级统计学及因子拉动敏感度分析</span>
              </div>
            </div>

            <!-- 分页选项卡头部 -->
            <div class="analysis-tabs-header">
              <div :class="['tab-item', { active: analysisActiveTab === 'routine' }]" @click="switchAnalysisTab('routine')">常规分析</div>
              <div :class="['tab-item', { active: analysisActiveTab === 'uncertainty' }]" @click="analysisActiveTab = 'uncertainty'">不确定性分析</div>
              <div :class="['tab-item', { active: analysisActiveTab === 'sensitivity' }]" @click="analysisActiveTab = 'sensitivity'">敏感度分析</div>
            </div>

            <!-- 页签内容容器 -->
            <div class="analysis-tab-content">
              <!-- 1. 常规分析 -->
              <div v-if="analysisActiveTab === 'routine'" key="tab-routine" class="tab-pane">
                <!-- 4 大核心 KPI -->
                <div class="routine-kpi-grid">
                  <div class="routine-kpi">
                    <div class="rk-top">
                      <span class="rk-label">排放总量</span>
                      <span class="rk-badge">全口径</span>
                    </div>
                    <div class="rk-value">
                      <span class="rk-num">{{ formatEmission(totalCarbonEmission) }}</span>
                      <span class="rk-unit">tCO₂e</span>
                    </div>
                    <div class="rk-sub">核算期合计</div>
                  </div>

                  <div class="routine-kpi">
                    <div class="rk-top">
                      <span class="rk-label">数据完整度</span>
                      <span class="rk-badge is-green">正常</span>
                    </div>
                    <div class="rk-value">
                      <span class="rk-num">{{ dataCompleteness }}%</span>
                    </div>
                    <div class="rk-sub">已确认参数 / 全部</div>
                  </div>

                  <div class="routine-kpi">
                    <div class="rk-top">
                      <span class="rk-label">同比变化</span>
                      <span class="rk-badge is-blue">同比</span>
                    </div>
                    <div class="rk-value">
                      <span class="rk-num is-blue is-down">-2.1%</span>
                    </div>
                    <div class="rk-sub">较上年同期</div>
                  </div>

                  <div class="routine-kpi">
                    <div class="rk-top">
                      <span class="rk-label">环比变化</span>
                      <span class="rk-badge is-teal">环比</span>
                    </div>
                    <div class="rk-value">
                      <span class="rk-num is-teal is-down">-0.8%</span>
                    </div>
                    <div class="rk-sub">较上月</div>
                  </div>
                </div>

                <!-- 碳排放趋势 -->
                <div class="routine-card">
                  <div class="routine-card-title">
                    <i class="el-icon-data-line"></i> 碳排放趋势分析
                  </div>
                  <div ref="routineTrendChart" class="routine-chart routine-chart-trend"></div>
                </div>

                <!-- 范围构成 -->
                <div class="routine-card">
                  <div class="routine-card-title">
                    <i class="el-icon-pie-chart"></i> 范围构成
                  </div>
                  <div class="routine-scope-wrap">
                    <div ref="routinePieChart" class="routine-chart routine-chart-pie"></div>
                    <table class="routine-scope-table">
                      <thead>
                        <tr>
                          <th>排放范围</th>
                          <th class="ta-r">占比</th>
                          <th class="ta-r">数值 (tCO₂e)</th>
                          <th class="ta-r">同比变化</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="r in routineScopeTable" :key="r.name">
                          <td><span class="routine-dot" :style="{ background: r.color }"></span>{{ r.name }}</td>
                          <td class="ta-r">{{ r.pct }}%</td>
                          <td class="ta-r">{{ r.value.toLocaleString() }}</td>
                          <td class="ta-r">
                            <span :class="r.yoy > 0 ? 'up' : (r.yoy < 0 ? 'down' : '')">
                              {{ r.yoy > 0 ? '+' : '' }}{{ r.yoy }}%
                            </span>
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr>
                          <td>合计</td>
                          <td class="ta-r">100%</td>
                          <td class="ta-r">{{ Math.round(totalCarbonEmission).toLocaleString() }}</td>
                          <td class="ta-r"><span class="down">-2.1%</span></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <!-- 大类构成排行 -->
                <div class="routine-card">
                  <div class="routine-card-title">
                    <i class="el-icon-s-data"></i> 排放源排行榜
                  </div>
                  <div class="routine-rank-list">
                    <div v-for="(r, i) in routineRanking" :key="i" class="routine-rank-item">
                      <span class="rr-idx" :class="{ 'is-top3': i < 3 }">{{ i + 1 }}</span>
                      <span class="rr-name">{{ r.name }}</span>
                      <div class="rr-bar-track">
                        <div class="rr-bar-fill" :style="{ width: r.width }"></div>
                      </div>
                      <span class="rr-val">{{ formatEmission(r.emission) }}</span>
                      <span class="rr-pct">{{ r.pct }}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 2. 不确定性分析 -->
              <div v-else-if="analysisActiveTab === 'uncertainty'" key="tab-uncertainty" class="tab-pane">
                <!-- 标题行：方法说明 + 徽章 -->
                <div class="unc-head">
                  <div class="unc-head-left">
                    <i class="el-icon-data-analysis"></i>
                    <span class="unc-head-title">不确定性分析</span>
                    <el-tooltip content="采用 IPCC 方法1（误差传播法）：活动数据按 ±5%、排放因子按 ±3% 的典型不确定度，经独立误差传播合成综合不确定度，满足 GHG Protocol 对组织层面不确定性量化的要求。" placement="top">
                      <i class="el-icon-question unc-help"></i>
                    </el-tooltip>
                  </div>
                  <span class="unc-head-badge">IPCC 方法1 · 误差传播</span>
                </div>

                <!-- 4 大 KPI -->
                <div class="unc-kpi-grid">
                  <div class="routine-kpi rk-clickable" @click="explainUncKpi('unc')">
                    <div class="rk-top">
                      <span class="rk-label">综合不确定度</span>
                      <span class="rk-badge is-blue">主指标</span>
                    </div>
                    <div class="rk-value">
                      <span class="rk-num is-blue">{{ uncertaintyRangeText }}</span>
                    </div>
                    <div class="rk-sub">95% 置信水平 · 误差传播合成</div>
                  </div>
                
                  <div class="routine-kpi rk-clickable" @click="explainUncKpi('ci')">
                    <div class="rk-top">
                      <span class="rk-label">置信区间</span>
                      <span class="rk-badge">95% CI</span>
                    </div>
                    <div class="rk-value">
                      <span class="rk-num rk-num-sm">{{ confidenceIntervalText }}</span>
                    </div>
                    <div class="rk-sub">tCO₂e · 排放总量范围估计</div>
                  </div>
                
                  <div class="routine-kpi rk-clickable" @click="explainUncKpi('total')">
                    <div class="rk-top">
                      <span class="rk-label">排放总量</span>
                      <span class="rk-badge">核算期</span>
                    </div>
                    <div class="rk-value">
                      <span class="rk-num">{{ formatEmission(totalCarbonEmission) }}</span>
                      <span class="rk-unit">tCO₂e</span>
                    </div>
                    <div class="rk-sub">分布均值 (μ)</div>
                  </div>
                
                  <div class="routine-kpi rk-clickable" @click="explainUncKpi('sigma')">
                    <div class="rk-top">
                      <span class="rk-label">标准差 (σ)</span>
                      <span class="rk-badge">误差传播</span>
                    </div>
                    <div class="rk-value">
                      <span class="rk-num">{{ Math.round(totalCarbonEmission * calcTotalRelativeUncertainty()).toLocaleString() }}</span>
                      <span class="rk-unit">tCO₂e</span>
                    </div>
                    <div class="rk-sub">μ × 综合不确定度</div>
                  </div>
                </div>

                <!-- 参数不确定度贡献分解 -->
                <div class="routine-card">
                  <div class="routine-card-title">
                    <i class="el-icon-s-data"></i> 参数不确定度贡献分解
                    <span class="rc-sub">按方差贡献降序 · 前 6 项</span>
                  </div>
                  <div class="unc-param-list">
                    <div v-for="(p, i) in uncParamContrib" :key="i" class="unc-param-item">
                      <div class="up-row">
                        <span class="up-idx" :class="{ 'is-top1': i === 0 }">{{ i + 1 }}</span>
                        <span class="up-name">{{ p.name }}</span>
                        <span class="up-unc">±{{ p.uncPct }}%</span>
                        <div class="up-bar-track">
                          <div class="up-bar-fill" :style="{ width: p.barWidth }"></div>
                        </div>
                        <span class="up-share">{{ p.sharePct }}%</span>
                      </div>
                    </div>
                  </div>
                </div>


                <!-- 不确定性分析优化建议 -->
                <div class="analysis-suggestion-box sug-unc">
                  <div class="sug-header">
                    <i class="el-icon-warning-outline"></i>
                    <span>不确定性分析优化建议</span>
                  </div>
                  <div class="sug-body">
                    <div v-for="(sug, idx) in analysisProfile.uncSugs" :key="idx" class="sug-item">
                      <span class="sug-num">{{ idx + 1 }}</span>
                      <div class="sug-content">
                        <strong>{{ sug.title }}</strong>
                        <p>{{ sug.text }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 3. 敏感度分析 -->
              <div v-else-if="analysisActiveTab === 'sensitivity'" key="tab-sensitivity" class="tab-pane">
                <!-- 变动比例设置区 -->
                <div class="sens-ratio-panel">
                  <span class="sens-ratio-label">因子变动比例：</span>
                  <el-radio-group v-model="sensitivityRatio" size="mini" class="sens-ratio-group">
                    <el-radio-button :label="5">±5%</el-radio-button>
                    <el-radio-button :label="10">±10%</el-radio-button>
                    <el-radio-button :label="20">±20%</el-radio-button>
                    <el-radio-button :label="30">±30%</el-radio-button>
                  </el-radio-group>
                  <div class="sens-ratio-custom">
                    <span class="sens-ratio-custom-label">自定义：</span>
                    <el-input-number v-model="sensitivityRatio" :min="1" :max="50" :step="1" size="mini" controls-position="right" class="sens-ratio-input"></el-input-number>
                    <span class="sens-ratio-unit">%</span>
                  </div>
                </div>

                <h5 class="chart-section-title" style="margin-top: 10px;">关键排放源敏感度排序 (Tornado) — 变动 ±{{ sensitivityRatio }}%</h5>
                <div class="sensitivity-list">
                  <div v-for="item in sensitivityImpactData" :key="item.name" class="sens-row">
                    <div class="sens-meta">
                      <strong class="sens-name">{{ item.name }}</strong>
                      <span :class="['sens-direction', item.coeff >= 0 ? 'corr-positive' : 'corr-negative']">
                        {{ item.coeff >= 0 ? '正相关 🔴' : '负相关 🟢' }} · 敏感度 {{ item.coeff >= 0 ? '+' : '' }}{{ item.coeff }}
                      </span>
                    </div>
                    <div class="sens-bar-container">
                      <span class="sens-impact-text">{{ item.impactValue >= 0 ? '+' : '' }}{{ formatEmission(item.impactValue) }} tCO₂e</span>
                      <div v-if="item.coeff >= 0" class="sens-bar-track">
                        <div class="sens-bar-fill fill-pos" :style="{ width: item.barWidth + '%' }"></div>
                      </div>
                      <div v-else class="sens-bar-track-neg">
                        <div class="sens-bar-fill fill-neg" :style="{ width: item.barWidth + '%' }"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 敏感性分析优化建议 -->
                <div class="analysis-suggestion-box sug-sens">
                  <div class="sug-header">
                    <i class="el-icon-warning-outline"></i>
                    <span>敏感性分析减排优先级与行动建议</span>
                  </div>
                  <div class="sug-body">
                    <div v-for="sug in analysisProfile.sensSugs" :key="sug.pri" :class="['sug-item', sug.cls]">
                      <span :class="['sug-num', sug.numCls]">{{ sug.pri }}</span>
                      <div class="sug-content">
                        <strong>{{ sug.title }}</strong>
                        <p>{{ sug.text }}</p>
                        <div class="sug-kpi-mini">
                          <span v-for="(k, ki) in sug.kpis" :key="ki">{{ k }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="sug-summary-row">
                      <span class="sug-summary-label">综合减排方向总结</span>
                      <span class="sug-summary-val">{{ analysisProfile.sensSummary }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- 阶段八闭合 end analysis-section -->

          <!-- 阶段九（组织碳核算报告生成） -->
          <div v-else-if="currentStepIndex === 8 && reportViewMode === 'report'" class="parsing-section stage-scroll report-section">
            <div class="content-header">
              <div class="content-header-row">
                <i class="el-icon-document"></i>
                <span class="content-header-title">组织温室气体排放核算报告</span>
                <span class="content-header-sub">{{ selectedStandard }}</span>
              </div>
            </div>

          <div class="report-body-scroll">
          <!-- 报告封面（独立于章节） -->
          <div class="report-cover-block">
            <strong class="cover-title">{{ reportProfile.coverTitle }}</strong>
            <div class="cover-sub">{{ selectedStandard }} · 组织层级 · 法人边界</div>
          </div>
          <!-- ★ 第一章：核算目的与边界声明 -->
          <div class="report-section-card">
            <div class="section-card-header section-ch1">
              <span class="section-num">01</span>
              <div class="section-info">
                <strong>核算目的与边界声明</strong>
              </div>
            </div>
            <div class="report-meta-grid">
              <div class="meta-row"><span class="meta-lbl">核算主体</span><span class="meta-val">{{ reportProfile.product }}</span></div>
              <div class="meta-row"><span class="meta-lbl">组织层级</span><span class="meta-val">{{ reportProfile.model }}</span></div>
              <div class="meta-row"><span class="meta-lbl">核算标准</span><span class="meta-val">{{ selectedStandard }}</span></div>
              <div class="meta-row"><span class="meta-lbl">量化单位</span><span class="meta-val">{{ unitTypeLabel }} — {{ boundaryConfig.unitDetail }}</span></div>
              <div class="meta-row"><span class="meta-lbl">时间边界</span><span class="meta-val">{{ boundaryConfig.timeBoundary || '2024-01-01 - 2024-12-31' }}</span></div>
            </div>
          </div>

          <!-- ★ 第二章：系统边界与范围界定 -->
          <div class="report-section-card">
            <div class="section-card-header section-ch2">
              <span class="section-num">02</span>
              <div class="section-info">
                <strong>组织边界与运营边界界定</strong>
              </div>
            </div>
            <div class="report-meta-grid">
              <div class="meta-row"><span class="meta-lbl">合并方法</span><span class="meta-val">{{ lifecycleScopeLabel }}</span></div>
              <div class="meta-row"><span class="meta-lbl">核算范围</span><span class="meta-val">{{ unitTypeLabel }}</span></div>
              <div class="meta-row"><span class="meta-lbl">重要性阈值</span><span class="meta-val">{{ boundaryConfig.cutoffThreshold }}（单项&lt;{{ boundaryConfig.cutoffItemThreshold }}，累计≤{{ boundaryConfig.cutoffTotalThreshold }}）</span></div>
            </div>
          </div>

          <!-- ★ 第三章：排放源清单与排放量汇总 + 饼图+堆叠柱状图 -->
          <div class="report-section-card">
            <div class="section-card-header section-ch3">
              <span class="section-num">03</span>
              <div class="section-info">
                <strong>排放源清单与排放量汇总</strong>
              </div>
            </div>
            <!-- 排放总量（各范围构成见下方饼图） -->
            <div class="report-total-card">
              <div class="total-main">
                <div class="total-label">温室气体排放总量</div>
                <div class="total-value-row">
                  <span class="total-number">{{ formatEmission(totalCarbonEmission) }}</span>
                  <span class="total-unit">tCO₂e</span>
                </div>
              </div>
              <div v-if="isWindTask()" class="total-degree">
                <div class="total-degree-main">{{ reportProfile.degreeText }}</div>
                <div class="total-degree-sub">{{ reportProfile.degreeSubText }}</div>
              </div>
            </div>
            <!-- 饼图 -->
            <h5 class="chart-section-title" style="margin-top: 12px;">各范围排放占比分布</h5>
            <div class="report-chart-row">
              <div class="report-chart-box">
                <div ref="reportPieChart" class="chart-container chart-container-pie"></div>
              </div>
            </div>
            <!-- 排放明细表 -->
            <div class="report-detail-table">
              <div class="detail-table-header">
                <span class="dt-col dt-stage">排放范围</span>
                <span class="dt-col dt-process">排放源</span>
                <span class="dt-col dt-emission">排放量 (tCO₂e)</span>
                <span class="dt-col dt-pct">占比</span>
              </div>
              <div class="detail-table-body">
                <div v-for="row in reportDetailRows" :key="row.id" :class="['detail-row', row.rowClass]">
                  <span class="dt-col dt-stage" :title="row.stage">{{ row.stage }}</span>
                  <span class="dt-col dt-process" :title="row.process">{{ row.process }}</span>
                  <span class="dt-col dt-emission" :style="{ color: row.emission < 0 ? '#52c41a' : '#303133', fontWeight: row.isBold ? '700' : '400' }">{{ formatEmission(row.emission) }}</span>
                  <span class="dt-col dt-pct">{{ row.pct }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ★ 第五章：不确定性评价 + 置信区间图 -->
          <div class="report-section-card">
            <div class="section-card-header section-ch5">
              <span class="section-num">04</span>
              <div class="section-info">
                <strong>不确定性评价结论</strong>
              </div>
            </div>
            <h5 class="chart-section-title" style="margin-top: 10px;">排放总量不确定度分布（误差传播 · 95% 置信区间）</h5>
            <div ref="reportUncertaintyChart" class="chart-container-wide"></div>
            <div class="uncertainty-summary">
              <div class="us-item"><span class="us-lbl">置信水平</span><span class="us-val">{{ uncertaintyParams.confidenceLevel }}%</span></div>
              <div class="us-item"><span class="us-lbl">均值</span><span class="us-val">{{ formatEmission(totalCarbonEmission) }} tCO₂e</span></div>
              <div class="us-item"><span class="us-lbl">95% CI</span><span class="us-val">{{ confidenceIntervalText }}</span></div>
              <div class="us-item"><span class="us-lbl">标准差</span><span class="us-val">{{ Math.round(totalCarbonEmission * calcTotalRelativeUncertainty()).toLocaleString() }} tCO₂e</span></div>
              <div class="us-item"><span class="us-lbl">变异系数 (σ/μ)</span><span class="us-val">{{ uncertaintyRangeText }}</span></div>
            </div>
            <div class="dqr-conclusion-box" style="margin-top: 10px;">
              <i class="el-icon-success" style="color: #52c41a;"></i>
              <span>{{ reportProfile.dqrConclusion }}</span>
            </div>
          </div>

          <!-- ★ 第六章：数据质量评估 + 雷达图 -->
          <div class="report-section-card">
            <div class="section-card-header section-ch6">
              <span class="section-num">05</span>
              <div class="section-info">
                <strong>数据质量管理与评估</strong>
              </div>
            </div>
            <p class="section-desc">数据质量管理策略：高占比排放源（净购入电力、化石燃料）优先在线计量与结算凭证佐证；排放因子优先采用中国区域电网平均因子与生态环境部本土缺省因子；逸散类按补充记录估算，其影响已在第四章不确定性中单独量化。</p>
            <div ref="reportDqrChart" class="chart-container"></div>
            <div class="dqr-detail-table">
              <div class="dqr-detail-header">
                <span class="dqr-col dqr-dim">评价维度</span>
                <span class="dqr-col dqr-score">评分</span>
                <span class="dqr-col dqr-limit">限值</span>
                <span class="dqr-col dqr-status">达标</span>
                <span class="dqr-col dqr-note">说明</span>
              </div>
              <div class="dqr-detail-row">
                <span class="dqr-col dqr-dim">可靠性</span>
                <span class="dqr-col dqr-score" style="color: #52c41a; font-weight: 700;">1.5</span>
                <span class="dqr-col dqr-limit">≤3.0</span>
                <span class="dqr-col dqr-status"><i class="el-icon-success" style="color: #52c41a;"></i></span>
                <span class="dqr-col dqr-note">活动数据来源可靠，主要为能源台账与采购发票</span>
              </div>
              <div class="dqr-detail-row">
                <span class="dqr-col dqr-dim">完整性</span>
                <span class="dqr-col dqr-score" style="color: #52c41a; font-weight: 700;">2.0</span>
                <span class="dqr-col dqr-limit">≤3.0</span>
                <span class="dqr-col dqr-status"><i class="el-icon-success" style="color: #52c41a;"></i></span>
                <span class="dqr-col dqr-note">排放源覆盖完整，个别辅料数据为估算值</span>
              </div>
              <div class="dqr-detail-row">
                <span class="dqr-col dqr-dim">时间相关性</span>
                <span class="dqr-col dqr-score" style="color: #faad14; font-weight: 700;">2.5</span>
                <span class="dqr-col dqr-limit">≤3.0</span>
                <span class="dqr-col dqr-status"><i class="el-icon-success" style="color: #52c41a;"></i></span>
                <span class="dqr-col dqr-note">部分排放因子引用2023年版本，时效性略有扣分</span>
              </div>
              <div class="dqr-detail-row">
                <span class="dqr-col dqr-dim">地理相关性</span>
                <span class="dqr-col dqr-score" style="color: #52c41a; font-weight: 700;">2.0</span>
                <span class="dqr-col dqr-limit">≤3.0</span>
                <span class="dqr-col dqr-status"><i class="el-icon-success" style="color: #52c41a;"></i></span>
                <span class="dqr-col dqr-note">优先采用中国本土数据库（CPCD），地理代表性良好</span>
              </div>
              <div class="dqr-detail-row">
                <span class="dqr-col dqr-dim">技术相关性</span>
                <span class="dqr-col dqr-score" style="color: #faad14; font-weight: 700;">2.5</span>
                <span class="dqr-col dqr-limit">≤3.0</span>
                <span class="dqr-col dqr-status"><i class="el-icon-success" style="color: #52c41a;"></i></span>
                <span class="dqr-col dqr-note">个别因子为行业平均值，未区分具体工艺路线</span>
              </div>
              <div class="dqr-detail-row dqr-total-row">
                <span class="dqr-col dqr-dim" style="font-weight: 700;">综合数据质量</span>
                <span class="dqr-col dqr-score" style="color: #52c41a; font-weight: 700; font-size: 15px;">2.1</span>
                <span class="dqr-col dqr-limit">≤3.0</span>
                <span class="dqr-col dqr-status"><i class="el-icon-success" style="color: #52c41a;"></i></span>
                <span class="dqr-col dqr-note" style="font-weight: 600;">五大维度均优于限值，满足外部审计披露要求</span>
              </div>
            </div>
          </div>

          <!-- ★ 第七章：敏感性分析 + Tornado图 -->
          <div class="report-section-card">
            <div class="section-card-header section-ch7">
              <span class="section-num">06</span>
              <div class="section-info">
                <strong>敏感性分析与减排热点</strong>
              </div>
            </div>
            <div ref="reportTornadoChart" class="chart-container"></div>
            <p class="section-desc">{{ reportProfile.ch7Desc }}</p>
          </div>

          <!-- ★ 第八章：合规声明 -->
          <div class="report-section-card">
            <div class="section-card-header section-ch8">
              <span class="section-num">07</span>
              <div class="section-info">
                <strong>合规声明</strong>
              </div>
            </div>
            <div class="compliance-signature">
              <div class="signature-badge">
                <i class="el-icon-circle-check" style="color: #27ae60; font-size: 18px;"></i>
                <div class="signature-text">
                  <strong>合规声明</strong>
                  <p>{{ reportProfile.complianceText }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- ★ 免责声明 -->
          <div class="report-section-card disclaimer-card">
            <div class="section-card-header disclaimer-header">
              <i class="el-icon-warning-outline"></i>
              <div class="section-info">
                <strong>免责声明</strong>
              </div>
            </div>
            <div class="disclaimer-body">
              <ol class="disclaimer-list">
                <li><b>数据来源与准确性</b>：本报告所引用的活动数据及排放因子均来源于企业实测记录、行业标准数据库及公开发布的官方统计数据。系统已尽合理努力确保数据的准确性与完整性，但不对数据源的实时更新及潜在偏差承担保证责任。</li>
                <li><b>核算边界限制</b>：本报告遵循 {{ selectedStandard }} 规范设定核算边界，采用 {{ boundaryConfig.cutoffThreshold }} 重要性阈值。被取舍的微量排放源（单项 < {{ boundaryConfig.cutoffItemThreshold }}）虽对总结果影响有限，但不代表其对特定环境影响类别无贡献。</li>
                <li><b>排放因子时效性</b>：排放因子数据引用截止日期为 {{ boundaryConfig.timeBoundary || '2024-01-01 - 2024-12-31' }}，因子版本更新可能导致数值差异。建议定期复核因子库版本，及时更新引用。</li>
                <li><b>不确定性声明</b>：采用误差传播法（IPCC 方法1）量化结果表明，在 {{ uncertaintyParams.confidenceLevel }}% 置信水平下，排放总量的不确定度范围为 {{ confidenceIntervalText }} tCO₂e。实际值可能在此区间内波动，决策时应考虑不确定度影响。</li>
                <li><b>适用范围</b>：本报告仅适用于 {{ boundaryConfig.unitDetail }} 范围内的组织温室气体排放核算结果，不可直接用于其他组织、其他区域或其他时间周期的碳排放比较。</li>
                <li><b>知识产权</b>：本报告内容受版权保护，未经书面授权不得复制、传播或用于商业用途。报告中的方法论及核算模型归核算方所有。</li>
                <li><b>专家复核</b>：本报告尚未经独立专家复核，若需用于正式披露或法规合规用途，建议委托具备资质的专家进行复核验证。</li>
              </ol>
              <div class="disclaimer-footer">
                <span class="disclaimer-date">报告生成日期：{{ new Date().toLocaleDateString('zh-CN') }}</span>
                <span class="disclaimer-version">核算引擎版本：ZCIP-CFP-Agent v1.0</span>
              </div>
            </div>
          </div>
            <div class="report-actions-panel" data-marker="v2">
              <el-button type="success" size="small" :icon="isReportArchived ? 'el-icon-check' : 'el-icon-folder-checked'" @click="handleArchiveReport" :disabled="isReportArchived">
                {{ isReportArchived ? '已归档至企业碳资产库' : '报告存档' }}
              </el-button>
              <el-dropdown @command="handleExportReport" style="margin-left: 8px;">
                <el-button type="primary" size="small" icon="el-icon-download">
                  报告导出<i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="pdf"><i class="el-icon-document"></i> PDF</el-dropdown-item>
                  <el-dropdown-item command="word"><i class="el-icon-document-add"></i> Word</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
              <el-button size="small" icon="el-icon-s-check" plain @click="handleShareReport">专家复核</el-button>
            </div>
          </div>
        </div>

        <!-- 阶段9：数据溯源视图 -->
        <div v-else-if="currentStepIndex === 8 && reportViewMode === 'traceability'" class="parsing-section">
          <div class="content-header">
            <div class="content-header-row">
              <i class="el-icon-link"></i>
              <span class="content-header-title">数据溯源记录</span>
              <span class="content-header-sub">来源·版本·可信度追溯</span>
            </div>
          </div>
          <div class="trace-table-container">
            <div class="trace-table-header">
              <span class="trace-col trace-col-name">数据项</span>
              <span class="trace-col trace-col-stage">所属阶段</span>
              <span class="trace-col trace-col-source">数据来源</span>
              <span class="trace-col trace-col-version">版本/日期</span>
              <span class="trace-col trace-col-conf">可信度</span>
            </div>
            <div v-for="item in activeTraceabilityData" :key="item.id" class="trace-row">
              <span class="trace-col trace-col-name"><i :class="item.icon"></i> {{ item.name }}</span>
              <span class="trace-col trace-col-stage"><span class="trace-stage-tag">{{ item.stage }}</span></span>
              <span class="trace-col trace-col-source">{{ item.source }}</span>
              <span class="trace-col trace-col-version">{{ item.version }}</span>
              <span class="trace-col trace-col-conf"><span :class="['trace-conf-tag', 'conf-' + item.confLevel]">{{ item.confLabel }}</span><el-tooltip :content="item.confReason" placement="top" effect="dark"><i class="el-icon-question trace-conf-info"></i></el-tooltip></span>
            </div>
          </div>
          <div class="trace-summary-box">
            <i class="el-icon-info"></i>
            <span>数据溯源覆盖率 100%，高可信度数据占 85%，中等可信度占 15%。所有数据均可追溯到原始来源。</span>
          </div>
          <div style="text-align:center;margin-top:12px;">
            <el-button size="small" type="primary" plain @click="switchBackToReport"><i class="el-icon-back"></i> 返回报告</el-button>
          </div>
        </div>

        <!-- 阶段9：核查推荐视图 -->
        <div v-else-if="currentStepIndex === 8 && reportViewMode === 'verification'" class="parsing-section">
          <div class="content-header">
            <div class="content-header-row">
              <i class="el-icon-circle-check"></i>
              <span class="content-header-title">核查机构推荐</span>
              <span class="content-header-sub">第三方验证</span>
            </div>
          </div>
          <div class="verify-cards-grid">
            <div v-for="org in verificationOrgs" :key="org.id" class="verify-card">
              <div class="verify-card-header">
                <div class="verify-org-logo" :style="{ background: org.logoBg }">
                  <i :class="org.logoIcon" :style="{ color: org.logoColor }"></i>
                </div>
                <div class="verify-org-info">
                  <div class="verify-org-name">{{ org.name }}</div>
                  <div class="verify-org-eng">{{ org.engName }}</div>
                </div>
              </div>
              <div class="verify-card-body">
                <div class="verify-meta-row">
                  <span class="verify-meta-label"><i class="el-icon-location-outline"></i> 总部</span>
                  <span class="verify-meta-val">{{ org.location }}</span>
                </div>
                <div class="verify-meta-row">
                  <span class="verify-meta-label"><i class="el-icon-medal"></i> 认证资质</span>
                  <span class="verify-meta-val">{{ org.qualifications }}</span>
                </div>
                <div class="verify-meta-row">
                  <span class="verify-meta-label"><i class="el-icon-document-checked"></i> 核查范围</span>
                  <span class="verify-meta-val">{{ org.scope }}</span>
                </div>
                <div class="verify-meta-row">
                  <span class="verify-meta-label"><i class="el-icon-phone-outline"></i> 联系方式</span>
                  <span class="verify-meta-val">{{ org.contact }}</span>
                </div>
                <div class="verify-meta-row">
                  <span class="verify-meta-label"><i class="el-icon-star-off"></i> 行业口碑</span>
                  <span class="verify-meta-val">{{ org.rating }}</span>
                </div>
              </div>
              <div class="verify-card-footer">
                <el-tag size="mini" :type="org.accredited ? 'success' : 'warning'" effect="dark">{{ org.accredited ? 'ISO 认证机构' : '行业推荐' }}</el-tag>
                <span class="verify-price">参考费用：{{ org.priceRange }}</span>
              </div>
            </div>
          </div>
          <div class="verify-tip-box">
            <i class="el-icon-warning-outline"></i>
            <span>建议优先选择具备 ISO 14065 认证资质的核查机构，确保核查声明被国际认可。核查周期通常为 2-4 周，费用取决于产品复杂度与数据量。</span>
          </div>
          <div style="text-align:center;margin-top:12px;">
            <el-button size="small" type="primary" plain @click="switchBackToReport"><i class="el-icon-back"></i> 返回报告</el-button>
          </div>
        </div>

        <!-- 阶段 2+：展示工艺模型与因子绑定 -->
          <div v-else class="parsing-section">
            <div class="content-header" v-if="currentStepIndex !== 6">
              <div class="content-header-row">
                <i :class="phases[currentStepIndex] ? phases[currentStepIndex].icon : 'el-icon-s-grid'"></i>
                <span class="content-header-title">{{ phases[currentStepIndex] ? phases[currentStepIndex].name : '核算模型' }}</span>
                <span class="content-header-sub" v-if="currentStepIndex >= 2">已构建</span>
              </div>
            </div>


            <!-- 阶段三：已构建的模型拓扑图（自动初始化） -->
            <div class="model-stage-groups">
              <!-- 阶段7：树形表格+最终计算结果 -->
              <template v-if="currentStepIndex === 6">
                <div class="parsing-section result-section" style="margin-bottom: 16px;">
                  <div class="content-header">
                    <div class="content-header-row">
                      <i class="el-icon-finished"></i>
                      <span class="content-header-title">排放量计算结果</span>
                      <span class="content-header-sub">范围1+2+3 汇总</span>
                    </div>
                  </div>
                <div class="result-banner" style="margin-bottom: 12px;">
                  <span class="result-label">组织温室气体排放总量</span>
                  <strong class="result-val">{{ formatEmission(totalCarbonEmission) }} <small>tCO₂e</small></strong>
                  <el-button type="primary" size="mini" icon="el-icon-download" class="export-btn" @click="exportCalculationData">导出核算数据</el-button>
                </div>
                
                <!-- 树形表格 -->
                <div class="emission-tree-table">
                  <div class="tree-table-header">
                    <span class="col-name">名称</span>
                    <span class="col-val">排放量 (tCO₂e)</span>
                  </div>
                  <div class="tree-table-body">
                    <!-- 范围 -->
                    <div v-for="scope in modelTree" :key="scope.key" class="s7-group">
                      <div class="s7-row s7-scope-row" @click="toggleNode(scope.key)">
                        <span class="s7-arrow" :class="{ 'is-open': isNodeExpanded(scope.key) }">▶</span>
                        <span class="s7-name"><i class="el-icon-folder-opened"></i> {{ scope.name }}</span>
                        <span class="s7-em">{{ formatEmission(scopeEmission(scope)) }} <small>tCO₂e</small></span>
                      </div>
                      <div v-show="isNodeExpanded(scope.key)" class="s7-children">
                        <!-- 大类 -->
                        <div v-for="cat in scope.categories" :key="cat.key" class="s7-group">
                          <div class="s7-row s7-cat-row" @click.stop="toggleNode(cat.key)">
                            <span class="s7-arrow" :class="{ 'is-open': isNodeExpanded(cat.key) }">▶</span>
                            <span class="s7-name"><i class="el-icon-folder"></i> {{ cat.title }}</span>
                            <span class="s7-em">{{ formatEmission(catEmission(cat)) }} <small>tCO₂e</small></span>
                          </div>
                          <div v-show="isNodeExpanded(cat.key)" class="s7-children">
                            <!-- 排放源 -->
                            <div v-for="proc in cat.processes" :key="proc.name" class="s7-group">
                              <div class="s7-row s7-proc-row" @click.stop="toggleNode('proc-' + proc.name)">
                                <span class="s7-arrow" :class="{ 'is-open': isNodeExpanded('proc-' + proc.name) }">▶</span>
                                <span class="s7-name"><i class="el-icon-cpu"></i> {{ proc.name }}</span>
                                <span class="s7-em">{{ formatEmission(procEmission(proc)) }} <small>tCO₂e</small></span>
                              </div>
                              <div v-show="isNodeExpanded('proc-' + proc.name)" class="s7-children">
                                <!-- 排放单元 + 参数 -->
                                <div v-for="(u, ui) in proc.units" :key="ui" class="s7-unit">
                                  <div class="s7-row s7-unit-row">
                                    <span class="s7-name"><i class="el-icon-location-outline"></i> {{ u.name }}</span>
                                    <span class="s7-em">{{ formatEmission(u.emission) }} <small>tCO₂e</small></span>
                                  </div>
                                  <div class="s7-params">
                                    <div v-for="p in u.params" :key="p.key" class="s7-prow">
                                      <span class="s7-pname">
                                        <i :class="['param-sym', paramSymCls(p.key)]">{{ p.key }}</i>
                                        {{ p.label }}
                                      </span>
                                      <span class="s7-pval">{{ p.value }} <small>{{ p.unit }}</small></span>
                                      <span class="s7-psrc">{{ p.source || '—' }}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>

              </template>

              <!-- 阶段3：核算清单（范围 → 大类 → 排放源 → 排放单元） -->
              <template v-else-if="currentStepIndex === 2">
              <div class="parsing-section stage-scroll s3-section">

                <div v-for="scope in modelTree" :key="scope.key" class="src-scope">
                  <!-- ① 范围 -->
                  <div class="src-scope-header">
                    <i class="el-icon-folder-opened src-scope-icon"></i>
                    <span class="src-scope-name">{{ scope.name }}</span>
                    <span class="src-count">{{ scope.categories.length }} 个大类</span>
                  </div>

                  <div class="src-scope-body">
                    <!-- ② 大类 -->
                    <div v-for="cat in scope.categories" :key="cat.key" class="src-group">
                      <div class="src-group-header">
                        <span :class="['stage-dot', cat.dotClass]"></span>
                        <span class="src-group-name">{{ cat.title }}</span>
                        <span class="src-count">{{ cat.processes.length }} 个排放源</span>
                      </div>

                      <div class="src-group-body">
                        <!-- ③ 排放源 -->
                        <div v-for="(proc, pi) in cat.processes" :key="proc.name + '-' + pi" class="src-item">
                          <div class="src-head">
                            <i class="el-icon-document src-icon"></i>
                            <span class="src-name-text">{{ proc.name }}</span>
                            <el-tooltip v-if="proc.formula" :content="proc.formula" placement="top" effect="dark">
                              <i class="el-icon-question src-formula-icon"></i>
                            </el-tooltip>
                            <span class="src-head-spacer"></span>
                            <el-button size="mini" type="text" class="src-del" icon="el-icon-delete" @click="removeProcess(cat, pi)">删除</el-button>
                          </div>
                          <!-- ④ 排放单元：单个时直接展开，多个时显示分组 -->
                          <div class="src-units">
                            <!-- 单个排放单元：省略「排放单元」标签层 -->
                            <div v-if="(proc.units || []).length === 1" class="src-unit-row">
                              <i class="el-icon-location-outline src-unit-icon"></i>
                              <span class="src-unit-name">{{ proc.units[0].name }}</span>
                              <i class="el-icon-close src-unit-del" @click="removeUnit(proc, 0)"></i>
                            </div>
                            <!-- 多个排放单元：显示分组标签 -->
                            <template v-else-if="(proc.units || []).length > 1">
                              <div class="src-units-label">排放单元（{{ proc.units.length }}）</div>
                              <div v-for="(u, ui) in proc.units" :key="ui" class="src-unit-row">
                                <i class="el-icon-location-outline src-unit-icon"></i>
                                <span class="src-unit-name">{{ u.name }}</span>
                                <i class="el-icon-close src-unit-del" @click="removeUnit(proc, ui)"></i>
                              </div>
                            </template>
                            <el-button size="mini" type="text" class="src-add-unit" icon="el-icon-plus" @click="addUnit(proc)">添加排放单元</el-button>
                          </div>
                        </div>

                        <el-select
                          v-model="newProc[cat.key]" size="mini" class="src-add-select"
                          filterable allow-create default-first-option clearable
                          placeholder="+ 新增排放源（可选择或输入自定义名称）"
                          @change="name => addProcessFromSelect(cat, name)">
                          <el-option v-for="opt in availableProcesses(cat)" :key="opt.name"
                            :label="opt.name" :value="opt.name"></el-option>
                        </el-select>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- 材料识别弹窗 -->
                <el-dialog title="材料识别 · 补充排放源" :visible.sync="materialDialog" width="560px" append-to-body custom-class="material-dialog">
                  <el-upload drag :auto-upload="false" :on-change="onMaterialChange"
                    accept=".xlsx,.xls,.csv,.pdf,.jpg,.jpeg,.png" :limit="3" class="material-upload">
                    <i class="el-icon-upload"></i>
                    <div class="el-upload__text">拖拽文件到此处，或<em>点击上传</em></div>
                    <div class="el-upload__tip" slot="tip">支持设备清单 / 能源台账 / 能源审计报告（Excel / PDF / 图片）</div>
                  </el-upload>

                  <div v-if="recognizing" class="rec-loading">
                    <i class="el-icon-loading"></i> 正在识别排放源...
                  </div>

                  <div v-if="recognizedSources.length" class="rec-result">
                    <div class="rec-title">识别到 {{ recognizedSources.length }} 个排放源（勾选后加入清单）：</div>
                    <div v-for="(r, i) in recognizedSources" :key="i" class="rec-item">
                      <el-checkbox v-model="r.checked">
                        <span class="rec-name">{{ r.name }}</span>
                        <span class="rec-meta">{{ r.category }} · 排放单元：{{ r.unit }}</span>
                      </el-checkbox>
                    </div>
                  </div>

                  <span slot="footer">
                    <el-button size="small" @click="materialDialog = false">取消</el-button>
                    <el-button size="small" type="primary" :disabled="!recognizedSources.length" @click="confirmRecognized">确认添加</el-button>
                  </span>
                </el-dialog>

              </div>
              </template>
              <!-- 其他阶段：四层展示 + 参数表（AD 活动数据 / EF 排放因子） -->
              <template v-else>
                <div v-for="scope in modelTree" :key="scope.key" class="activity-scope-group">
                  <!-- ① 范围 -->
                  <div class="activity-scope-header">
                    <i class="el-icon-folder-opened activity-scope-icon"></i>
                    <span class="activity-scope-name">{{ scope.name }}</span>
                    <el-tag size="mini" effect="plain">{{ scope.categories.length }} 个大类</el-tag>
                  </div>

                  <!-- ② 大类 -->
                  <div v-for="cat in scope.categories" :key="cat.key" class="activity-stage-group">
                    <div class="activity-stage-header">
                      <span :class="['stage-dot', cat.dotClass]"></span>
                      <strong>{{ cat.title }}</strong>
                      <el-tag size="mini" type="info">{{ cat.processes.length }} 个排放源</el-tag>
                    </div>

                    <!-- ③ 排放源 -->
                    <div v-for="proc in cat.processes" :key="proc.name" class="activity-proc-card">
                      <div class="activity-proc-title">
                        <i class="el-icon-document"></i>
                        <span class="activity-proc-name">{{ proc.name }}</span>
                        <span v-if="currentStepIndex >= 6 && procEmission(proc) > 0" class="activity-proc-emission">
                          {{ formatEmission(procEmission(proc)) }} tCO₂e
                        </span>
                        
                      </div>

                      <!-- ④ 排放单元参数表 -->
                      <div v-for="(u, ui) in proc.units" :key="ui" class="param-block" :data-unit="u.name">
                        <div class="param-block-head">
                          <i class="el-icon-location-outline"></i>
                          <span class="param-unit-name">{{ u.name }}</span>
                          
                          <span v-if="currentStepIndex >= 6 && u.emission > 0" class="param-unit-emission">{{ formatEmission(u.emission) }} tCO₂e</span>
                        </div>
                        <div class="param-table">
                          <div class="param-tr param-th">
                            <span class="col-name">参数名称</span>
                            <span class="col-value ta-r">参数值</span>
                            <span class="col-raw ta-c" v-if="currentStepIndex === 3">原始值</span>
                            <span class="col-src">来源 · 佐证材料</span>
                            </span>
                            <span class="col-status">状态</span>
                          </div>
                          <div v-for="p in paramsForStep(u)" :key="p.key" class="param-tr param-row"
                            :data-issue-id="paramIssueId(proc, u, p.key)"
                            :class="paramRowClass(proc, u, p)"
                            @click="selectParam(proc, u, p.key, cat.title)">
                            <span class="col-name">
                              <i :class="['param-sym', paramSymCls(p.key)]">{{ p.key }}</i>
                              {{ p.label }}
                            </span>
                            <span class="col-value ta-r" @click.stop>
                              <template v-if="!p._editing">
                                <span class="param-text" @click.stop="onParamTextClick(proc, u, p.key, cat.title)">{{ p.value || '点击填写' }}</span>
                              </template>
                              <template v-else>
                                <input class="param-input" :data-pk="p.key" v-model="p.value" placeholder="填写"
                                  @focus="p.__old = p.value"
                                  @blur="endEdit(u, p.key)"
                                  @keyup.enter="endEdit(u, p.key)" />
                              </template>
                              <span class="param-unit">{{ p.unit || '' }}</span>
                              <!-- 确认状态已由「状态」列展示，此处不再重复 -->
                            </span>
                            <span class="col-raw ta-c param-raw" v-if="currentStepIndex === 3">
                              <template v-if="p.rawValue !== undefined && p.rawValue !== ''">
                                {{ p.rawValue }}<small class="param-raw-unit" v-if="p.rawUnit"> {{ p.rawUnit }}</small>
                              </template>
                              <span v-else class="param-raw-unknown">—</span>
                            </span>
                            <span class="col-src">
                              <span class="param-src">{{ p.source || '—' }}</span>
                              <span v-if="p.proof && p.proof !== p.source" class="param-proof"><i class="el-icon-paperclip"></i> {{ p.proof }}</span>
                            </span>
                            <span class="col-status">
                              <!-- 阻断级：不可确认 -->
                              <span v-if="paramIssueClass(proc, u, p) === 'is-block'" class="param-tag-blocked" title="存在必须修正的问题，无法确认">
                                待修正
                              </span>
                              <!-- 无值：待补充 -->
                              <span v-else-if="!p.value" class="param-tag-missing" title="请先填写参数值">待补充</span>
                              <!-- 已确认（警告级带标记） -->
                              <span v-else-if="p.verified" class="param-tag-confirmed is-clickable"
                                :title="paramIssueClass(proc, u, p) === 'is-warn' ? '已确认（存在警告，点击取消确认）' : '点击取消确认'"
                                @click.stop="unconfirmParam(proc, u, p.key)">
                                <i class="el-icon-check"></i> 已确认
                                <i v-if="paramIssueClass(proc, u, p) === 'is-warn'" class="el-icon-warning-outline param-status-warn"></i>
                              </span>
                              <!-- 待确认 -->
                              <span v-else class="param-tag-pending is-clickable"
                                title="点击确认为已确认" @click.stop="confirmParam(proc, u, p.key)">
                                待确认
                              </span>
                              <el-tooltip v-if="paramIssueTip(proc, u, p)" :content="paramIssueTip(proc, u, p)" placement="top">
                                <i :class="['param-issue-icon', paramIssueClass(proc, u, p)]">
                                  <template v-if="paramIssueClass(proc, u, p) === 'is-block'">!</template>
                                  <template v-else-if="paramIssueClass(proc, u, p) === 'is-warn'">!</template>
                                  <template v-else>i</template>
                                </i>
                              </el-tooltip>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div v-if="!proc.units || !proc.units.length" class="param-block">


                        <div class="param-block-head">


                          <i class="el-icon-document"></i>


                          <span class="param-unit-name">{{ proc.name }}（按排放源汇总）</span>


                          <span v-if="proc.emission > 0" class="param-unit-emission">{{ formatEmission(proc.emission) }} tCO₂e</span>


                        </div>


                        <div class="param-table">


                          <div class="param-tr param-th">


                            <span>参数名称</span><span class="ta-r">参数值</span><span class="ta-c">原始值</span><span>来源 · 佐证材料</span><span class="col-status">状态</span>


                          </div>


                          <div class="param-tr param-row" @click="selectParam(proc, proc, 'AD', cat.title)">


                            <span><i class="param-sym is-ad">AD</i> 活动数据</span>


                            <span class="col-value ta-r" @click.stop>


                              <input class="param-input" v-model="proc.activityData" placeholder="填写"


                                @focus="proc.__adOld = proc.activityData"


                                @blur="onParamChange(proc, 'AD', proc.__adOld, proc.activityData)" />


                              <span class="param-unit">{{ proc.unit || '' }}</span>


                            </span>
                            <span class="col-raw ta-c" v-if="currentStepIndex === 3">
                              <template v-if="proc.rawValue !== undefined && proc.rawValue !== ''">
                                {{ proc.rawValue }}<small class="param-raw-unit" v-if="proc.rawUnit"> {{ proc.rawUnit }}</small>
                              </template>
                              <span v-else class="param-raw-unknown">—</span>
                            </span>

<span>


                              <span class="param-src">{{ proc.dataSource || '—' }}</span>


                              <span v-if="proc.proof" class="param-proof"><i class="el-icon-paperclip"></i> {{ proc.proof }}</span>


                            </span>
                            </span>
                            <span class="col-status">
                              <span v-if="procIssueLevel(proc, 'AD') === 'block'" class="param-tag-blocked" title="存在必须修正的问题，无法确认">
                                待修正
                              </span>
                              <span v-else-if="!procHasValue(proc, 'AD')" class="param-tag-missing" title="请先填写参数值">待补充</span>
                              <span v-else-if="procIsVerified(proc, 'AD')" class="param-tag-confirmed is-clickable"
                                title="点击取消确认" @click.stop="setProcVerified(proc, 'AD', false)">
                                <i class="el-icon-check"></i> 已确认
                                <i v-if="procIssueLevel(proc, 'AD') === 'warn'" class="el-icon-warning-outline param-status-warn"></i>
                              </span>
                              <span v-else class="param-tag-pending is-clickable"
                                title="点击确认为已确认" @click.stop="setProcVerified(proc, 'AD', true)">
                                待确认
                              </span>
                            </span>
                          </div>


                          <div class="param-tr param-row" @click="selectParam(proc, proc, 'EF', cat.title)">


                            <span><i class="param-sym is-ef">EF</i> 排放因子</span>


                            <span class="col-value ta-r" @click.stop>


                              <input class="param-input" v-model="proc.factor" placeholder="待匹配"


                                @focus="proc.__efOld = proc.factor"


                                @blur="onParamChange(proc, 'EF', proc.__efOld, proc.factor)" />


                              <span class="param-unit">{{ proc.factorUnit || '' }}</span>


                            </span>
                            <span class="col-raw ta-c" v-if="currentStepIndex === 3">
                              <span class="param-raw-unknown">—</span>
                            </span>

<span>


                              <span class="param-src">{{ proc.factorSource || '—' }}</span>


                            </span>
                            </span>
                            <span class="col-status">
                              <span v-if="procIssueLevel(proc, 'EF') === 'block'" class="param-tag-blocked" title="存在必须修正的问题，无法确认">
                                待修正
                              </span>
                              <span v-else-if="!procHasValue(proc, 'EF')" class="param-tag-missing" title="请先填写参数值">待补充</span>
                              <span v-else-if="procIsVerified(proc, 'EF')" class="param-tag-confirmed is-clickable"
                                title="点击取消确认" @click.stop="setProcVerified(proc, 'EF', false)">
                                <i class="el-icon-check"></i> 已确认
                                <i v-if="procIssueLevel(proc, 'EF') === 'warn'" class="el-icon-warning-outline param-status-warn"></i>
                              </span>
                              <span v-else class="param-tag-pending is-clickable"
                                title="点击确认为已确认" @click.stop="setProcVerified(proc, 'EF', true)">
                                待确认
                              </span>
                            </span>
                          </div>


                        </div>


                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- 统一悬浮确认栏（阶段1~7） -->
          <div v-if="stageConfirmConfig && currentStepIndex !== 5" class="stage-confirm-bar">
            <span class="stage-confirm-hint"><i class="el-icon-info"></i> {{ stageConfirmConfig.hint }}</span>
            <el-button type="primary" size="small" :icon="stageConfirmConfig.icon" :disabled="isTyping" @click="stageConfirmConfig.action">{{ stageConfirmConfig.label }}</el-button>
          </div>
        </div>
        <!-- sidebar-lower闭合 -->

    <!-- 参数详情抽屉 -->
    <el-drawer :visible.sync="traceDrawer" direction="rtl" size="520px" append-to-body custom-class="trace-drawer" :with-header="false">
      <div class="trace-custom-header">
        <div class="trace-custom-title">
          <i class="el-icon-data-analysis"></i>
          <span>参数详情</span>
        </div>
        <i class="el-icon-close trace-close" @click="traceDrawer = false"></i>
      </div>

      <div v-if="traceRow" class="trace-body">
        <!-- 头部 -->
        <div class="trace-head">
          <div class="trace-head-icon"><i class="el-icon-document"></i></div>
          <div class="trace-head-info">
            <div class="trace-title">{{ traceRow.procName }}</div>
            <div class="trace-sub">{{ traceRow.catTitle }} · {{ traceRow.unitName }}</div>
          </div>
        </div>

        <!-- ① 参数信息 -->
        <div class="trace-card">
          <div class="trace-card-title"><i class="el-icon-data-line"></i> 参数信息</div>
          <div class="trace-kv">
            <span class="trace-k">参数类型</span>
            <span class="trace-v">
              <i :class="['trace-sym', traceRow.paramType === 'AD' ? 'is-ad' : 'is-ef']">{{ traceRow.paramType }}</i>
              {{ traceRow.paramLabel }}
            </span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">当前值</span>
            <span class="trace-v trace-v-em">{{ traceRow.value }}<small v-if="traceRow.unitText"> {{ traceRow.unitText }}</small></span>
          </div>
        </div>

        <!-- ② AD：数据来源（来源 + 原始值 + 转换链路） -->
        <div v-if="traceRow.paramType === 'AD'" class="trace-card">
          <div class="trace-card-title"><i class="el-icon-link"></i> 数据来源</div>
          <div class="trace-kv">
            <span class="trace-k">数据来源</span>
            <span class="trace-v">{{ traceRow.source || '未记录' }}</span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">原始值</span>
            <span class="trace-v">
              <template v-if="traceRow.rawValue !== undefined && traceRow.rawValue !== ''">
                {{ traceRow.rawValue }}<small v-if="traceRow.rawUnitText"> {{ traceRow.rawUnitText }}</small>
              </template>
              <span v-else class="trace-v-warn">未识别</span>
            </span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">转换系数</span>
            <span class="trace-v">
              <template v-if="traceRow.convertFactor">
                {{ traceRow.convertFactor }}<small v-if="traceRow.convertFormula" class="trace-conv-formula"> （{{ traceRow.convertFormula }}）</small>
              </template>
              <span v-else class="trace-v-note">无需换算</span>
            </span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">转换说明</span>
            <span class="trace-v trace-v-note">{{ traceRow.convertNote || '原始值与计算值一致，未做换算' }}</span>
          </div>
          <div class="trace-kv" v-if="traceRow.rawValue !== undefined && traceRow.rawValue !== ''">
            <span class="trace-k">换算链路</span>
            <span class="trace-v trace-v-conv">
              {{ traceRow.rawValue }} {{ traceRow.rawUnitText }}
              <i class="el-icon-right trace-conv-arrow"></i>
              {{ traceRow.value }} {{ traceRow.unitText }}
            </span>
          </div>
        </div>


        <!-- ② EF：因子来源（因子库 + 权威池 + 匹配链路 + T-G-T + 置信度） -->
        <div v-if="traceRow.paramType === 'EF'" class="trace-card">
          <div class="trace-card-title"><i class="el-icon-connection"></i> 因子来源</div>
          <div class="trace-kv">
            <span class="trace-k">因子库</span>
            <span class="trace-v">{{ traceRow.factorLibrary || '—' }}</span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">权威池</span>
            <span class="trace-v">
              <span v-if="traceRow.sourceTier" :class="['trace-tier', 'is-pool' + traceRow.sourceTier]">池{{ traceRow.sourceTier }}</span>
              <span v-if="traceRow.tierName" class="trace-tier-name">{{ traceRow.tierName }}</span>
              <span v-else>—</span>
            </span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">匹配链路</span>
            <span class="trace-v trace-v-note">P-1 企业实测 → P0 企业记忆 → 规则表 → 兜底缺省</span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">命中级别</span>
            <span class="trace-v">
              <span :class="['trace-hit', traceRow.hitLevelClass || 'is-fallback']">{{ traceRow.hitLevel || '—' }}</span>
            </span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">置信度</span>
            <span class="trace-v">{{ traceRow.confidence !== undefined ? traceRow.confidence : '—' }}</span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">匹配方式</span>
            <span class="trace-v">{{ traceRow.matchMode }}</span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">匹配依据</span>
            <span class="trace-v">{{ traceRow.matchBasis }}</span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">技术匹配（T）</span>
            <span class="trace-v trace-v-note">{{ traceRow.techMatch || '—' }}</span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">地理匹配（G）</span>
            <span class="trace-v trace-v-note">{{ traceRow.geoMatch || '—' }}</span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">时间匹配（T）</span>
            <span class="trace-v trace-v-note">{{ traceRow.timeMatch || '—' }}</span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">因子版本</span>
            <span class="trace-v">{{ traceRow.factorVersion || '—' }}</span>
          </div>
        </div>

        <!-- ③ 匹配策略（仅 AD，EF 已在因子来源中体现） -->
        <div v-if="traceRow.paramType === 'AD'" class="trace-card">
          <div class="trace-card-title"><i class="el-icon-connection"></i> 匹配策略</div>
          <div class="trace-kv">
            <span class="trace-k">匹配方式</span>
            <span class="trace-v">{{ traceRow.matchMode }}</span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">匹配依据</span>
            <span class="trace-v">{{ traceRow.matchBasis }}</span>
          </div>
        </div>

        <!-- ④ 数据质量 -->
        <div class="trace-card">
          <div class="trace-card-title"><i class="el-icon-medal"></i> 数据质量</div>
          <div class="trace-kv">
            <span class="trace-k">质量评级</span>
            <span class="trace-v">
              <span :class="['trace-dqr', traceRow.dqrLevel === '高' ? 'is-high' : (traceRow.dqrLevel === '低' ? 'is-low' : 'is-mid')]">{{ traceRow.dqrLevel }}</span>
            </span>
          </div>
          <div class="trace-kv">
            <span class="trace-k">评级依据</span>
            <span class="trace-v trace-v-note">{{ traceRow.dqrNote }}</span>
          </div>
        </div>

        <!-- ⑤ 校验关联 -->
        <div class="trace-card">
          <div class="trace-card-title"><i class="el-icon-warning-outline"></i> 校验关联</div>
          <div v-if="!traceRow.relatedIssues || !traceRow.relatedIssues.length" class="trace-empty">无关联校验问题</div>
          <div v-else class="trace-issue-list">
            <div v-for="(iss, i) in traceRow.relatedIssues" :key="i" class="trace-issue-item">
              <i :class="['trace-issue-dot', iss.severity === 'error' ? 'is-error' : (iss.severity === 'info' ? 'is-info' : 'is-warn')]"></i>
              <span class="trace-issue-text">{{ iss.label }}</span>
              <span class="trace-issue-tag">{{ iss.statusLabel }}</span>
            </div>
          </div>
        </div>

        <!-- ⑥ 历史趋势 -->
        <div class="trace-card">
          <div class="trace-card-title"><i class="el-icon-trend-charts"></i> 历史趋势</div>
          <div class="trace-trend">
            <div class="trace-trend-item">
              <span class="trace-trend-label">上期</span>
              <span class="trace-trend-val">{{ traceRow.trend.prev }}</span>
            </div>
            <div class="trace-trend-arrow">→</div>
            <div class="trace-trend-item">
              <span class="trace-trend-label">本期</span>
              <span class="trace-trend-val is-cur">{{ traceRow.trend.cur }}</span>
            </div>
            <div :class="['trace-trend-delta', 'is-' + traceRow.trend.deltaCls]">{{ traceRow.trend.deltaPct }}</div>
          </div>
        </div>

        <!-- ⑦ 佐证材料 -->
        <div class="trace-card">
          <div class="trace-card-title"><i class="el-icon-paperclip"></i> 佐证材料</div>
          <div v-if="traceRow.proof" class="trace-proof-item">
            <i class="el-icon-document"></i>
            <span class="trace-proof-name">{{ traceRow.proof }}</span>
            <span class="trace-proof-tag">已归档</span>
          </div>
          <div v-else class="trace-empty">暂无佐证材料</div>
          <el-button size="mini" icon="el-icon-upload" class="trace-upload-btn" @click="uploadProof">上传佐证</el-button>
        </div>

        <!-- ⑧ 修改记录 -->
        <div class="trace-card">
          <div class="trace-card-title"><i class="el-icon-time"></i> 修改记录</div>
          <div v-if="!traceRow.history || !traceRow.history.length" class="trace-empty">暂无修改记录</div>
          <div v-else class="trace-timeline">
            <div v-for="(h, i) in traceRow.history" :key="i" class="trace-tl-item">
              <span class="trace-tl-dot"></span>
              <div class="trace-tl-body">
                <div class="trace-tl-time">{{ h.time }}</div>
                <div class="trace-tl-text">{{ h.field }}：{{ h.from }} → {{ h.to }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
      </aside>
    </div>
    </div><!-- task-active-mode 闭合 -->

    <!-- 因子库选择对话框 -->

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
/* recompile-trigger */
import AgentIcon from '@/pages/zcip/common/AgentIcon.vue'
import OnboardingGuide from '../../agent-center/components/OnboardingGuide.vue'
import * as echarts from 'echarts'

// 挂载全局 echarts（供 mixin 调用）
if (typeof window !== 'undefined') {
  window.__ECHARTS__ = echarts
}
import agentCoreMixin from './agentCoreMixin'
import agentChatMixin from './agentChatMixin'

export default {
  name: 'CarbonFootprintAgent',
  components: { AgentIcon, OnboardingGuide },
  mixins: [agentCoreMixin, agentChatMixin],
  watch: {
    currentStepIndex(val) {
      if (val === 7) this.initRoutineCharts()
      if (val === 8) {
        this.$nextTick(() => {
          setTimeout(() => {
            var el = document.querySelector('.report-body-scroll')
            if (el) el.scrollTop = 0
          }, 300)
        })
      }
    }
  },
  data() {
    return {
      showOnboarding: false,
      activeActivityRow: null,  // 数据清单当前选中行（对话联动）
      selectedFactorLibs: [],
      onboardingStep: 0,
      onboardingSteps: [
        {
          icon: 'el-icon-data-analysis',
          title: '欢迎使用组织碳核算智能体',
          text: '这里是组织碳核算工作空间。基于 GHG Protocol / ISO 14064-1 方法，为您提供九阶段智能核算服务，涵盖政策标准、核算边界、核算模型、活动数据、排放因子、数据校验、排放计算、排放分析、排放报告全流程。',
          features: [
            { icon: 'el-icon-s-data', title: '九阶段流程', desc: '目标界定→清单分析→影响评价→结果解读', color: '#0067FE' },
            { icon: 'el-icon-connection', title: '因子匹配', desc: '排放因子库自动匹配，支持自定义替换', color: '#0067FE' },
            { icon: 'el-icon-share', title: '全链溯源', desc: '结果→公式→参数→来源→凭证逐级可溯', color: '#ED7B2F' }
          ],
          tip: '首次使用建议依次浏览全部引导内容，约需1分钟。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-chat-dot-round',
          title: '智能对话区',
          text: '页面中间为对话区，直接向小易提问或下达指令。点击「新建对话」即可核算本企业排放，小易会引导您完成九阶段流程。',
          features: [
            { icon: 'el-icon-video-play', title: '快速开始', desc: '一键核算本企业温室气体排放', color: '#0067FE' },
            { icon: 'el-icon-magic-stick', title: '智能问答', desc: '核算方法、因子来源即问即答', color: '#0067FE' },
            { icon: 'el-icon-s-opportunity', title: '常用指令', desc: '点击灯泡图标呼出指令面板', color: '#ED7B2F' }
          ],
          tip: '试试点击「新建对话」开始本企业的排放核算。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-chat-line-square',
          title: '历史对话栏',
          text: '页面左侧为历史对话栏，点击可展开查看历史对话记录，支持新建、切换和删除对话。',
          features: [
            { icon: 'el-icon-folder-opened', title: '对话记录', desc: '自动保存每次对话，按时间倒序排列', color: '#0067FE' },
            { icon: 'el-icon-plus', title: '新建对话', desc: '点击「新建」开启全新对话', color: '#0067FE' },
            { icon: 'el-icon-d-arrow-left', title: '可收缩', desc: '点击边条可展开/收缩历史栏', color: '#909399' }
          ],
          tip: '窄屏下历史栏自动隐藏。',
          iconStyle: {}
        },
        {
          icon: 'el-icon-folder-opened',
          title: '核算任务列表',
          text: '页面右侧为核算任务列表，展示本企业已创建的组织碳核算任务。点击任务卡片即可继续推进九阶段核算流程。',
          features: [
            { icon: 'el-icon-aim', title: '进度跟踪', desc: '实时显示每个任务的当前阶段和进度', color: '#0067FE' },
            { icon: 'el-icon-right', title: '一键进入', desc: '点击卡片即可继续推进核算', color: '#0067FE' },
            { icon: 'el-icon-delete', title: '任务管理', desc: '支持删除已完成的核算任务', color: '#F56C6C' }
          ],
          tip: '进入任务后，右侧将切换为九阶段进度面板。',
          iconStyle: {}
        }
      ]
    }
  },
  created() {
    this.initSelectedFactorLibs()
    this.ensureStandardValid()
  },
  methods: {
    /** 切换分析页签（常规分析需重绘图表） */
    switchAnalysisTab(tab) {
      this.analysisActiveTab = tab
      if (tab === 'routine') this.initRoutineCharts()
    },
    initRoutineCharts() {
      this.$nextTick(() => {
        setTimeout(() => {
          this.renderRoutineCharts()
          // 二次保险：若 canvas 未生成则重试一次
          setTimeout(() => {
            const el = this.$refs.routineTrendChart
            if (el && el.querySelectorAll('canvas').length === 0) {
              this.renderRoutineCharts()
            }
          }, 250)
        }, 100)
      })
    },
    // 数据清单行点击：把该行数据读入对话，引导确认/修改
    onActivityRowClick(item, proc, dir) {
      this.activeActivityRow = { item, proc, dir }
      const cats = (this.selectedImpactCategories || []).map(c => {
        const v = this.catFactor ? this.catFactor(item, c.id) : (item.factor || '—')
        return `${c.abbr || c.name} ${v}`
      }).join(' / ')
      const lines = [
        `**【${item.name}】**（${proc.name} · ${dir === 'input' ? '输入流' : '输出流'}）`,
        '',
        `* 活动数据：**${item.value || '—'} ${item.unit || ''}**`,
        cats ? `* 因子：${cats}` : `* 因子：${item.factor || '—'} ${item.factorUnit || ''}`
      ]
      this.messages.push({
        id: 'MSG-' + Date.now(),
        role: 'assistant',
        content: lines.join('\n') + '\n\n请确认，或直接告诉我要调整的值（如「活动数据改为 90000」）。',
        timestamp: new Date().toLocaleTimeString('zh-CN'),
        suggestions: ['确认无误', '修改活动数据', '查看因子来源']
      })
      this.$nextTick(() => this.scrollToBottom && this.scrollToBottom())
    },
    // 标记该行已核对
    confirmActivityRow() {
      const row = this.activeActivityRow
      if (!row) return
      this.$set(row.item, 'verified', true)
      this.messages.push({
        id: 'MSG-' + Date.now(),
        role: 'assistant',
        content: `已标记 **${row.item.name}** 为「已核对」。\n\n可继续点击其他行核对，或点击底部「全篇校验」。`,
        timestamp: new Date().toLocaleTimeString('zh-CN'),
        suggestions: ['继续核对其他行', '全篇校验']
      })
    },
    // 展示该行因子的来源与凭证
    showFactorSource() {
      const row = this.activeActivityRow
      if (!row) return
      const libs = (this.factorDatabases || []).filter(l => l.selected).map(l => `${l.shortName || l.name} ${l.version || ''}`)
      const cats = (this.selectedImpactCategories || []).map(c =>
        `* ${c.name}：${this.catFactor ? this.catFactor(row.item, c.id) : (row.item.factor || '—')} ${c.unit || ''}`
      ).join('\n')
      this.messages.push({
        id: 'MSG-' + Date.now(),
        role: 'assistant',
        content: `**【${row.item.name}】因子来源**\n\n* 匹配方式：按物料名称 + 工艺路线自动匹配\n* 启用因子库：${libs.join(' / ') || '—'}\n* 因子版本：${(this.factorDatabases || []).filter(l => l.selected).map(l => l.releaseDate || '').filter(Boolean).join(' / ') || '—'}\n* 凭证：已关联采购/结算凭证（可在佐证材料库查看）\n\n**各类别因子值**：\n${cats || '* 主因子：' + (row.item.factor || '—') + ' ' + (row.item.factorUnit || '')}`,
        timestamp: new Date().toLocaleTimeString('zh-CN'),
        suggestions: ['确认无误', '修改因子值']
      })
    },
    // 从对话指令中解析并应用数值修改（如「活动数据改为 90000」）
    applyActivityEdit(text) {
      const row = this.activeActivityRow
      if (!row) return false
      const m = String(text).match(/(?:改为|调整到|改成|设为)\s*([\d.]+)/)
      if (!m) return false
      const val = m[1]
      const isFactor = /因子/.test(text) && !/活动数据/.test(text)
      if (isFactor) {
        this.$set(row.item, 'factor', val)
        this.messages.push({
          id: 'MSG-' + Date.now(),
          role: 'assistant',
          content: `已将 **${row.item.name}** 的因子更新为 **${val} ${row.item.factorUnit || ''}**。右侧数据清单已同步。`,
          timestamp: new Date().toLocaleTimeString('zh-CN'),
          suggestions: ['确认无误', '查看因子来源']
        })
        return true
      }
      this.$set(row.item, 'value', val)
      this.messages.push({
        id: 'MSG-' + Date.now(),
        role: 'assistant',
        content: `已将 **${row.item.name}** 的活动数据更新为 **${val} ${row.item.unit || ''}**。右侧数据清单已同步。`,
        timestamp: new Date().toLocaleTimeString('zh-CN'),
        suggestions: ['继续核对其他行', '全篇校验']
      })
      return true
    },
    // 校正当前标准：任务里存的 code 若不在本场景标准集内，回落到第一项
    ensureStandardValid() {
      const list = this.standards || []
      if (!list.length) return
      if (!list.some(s => s.code === this.selectedStandard)) {
        this.selectedStandard = list[0].code
      }
    },
    // 从底层因子库 selected 派生已选列表
    initSelectedFactorLibs() {
      this.selectedFactorLibs = (this.factorDatabases || []).filter(l => l.selected).map(l => l.id)
    },
    // 当前标准下可用的因子库（数据源：底层 factorDatabases）
    availableFactorLibs() {
      const cfg = this.selectedStandardConfig || {}
      const txt = (cfg.code || '') + ' ' + (cfg.name || '')
      const all = this.factorDatabases || []
      const list = all.filter(l => !l.standards || l.standards.some(t => txt.indexOf(t) > -1))
      return list.length ? list : all
    },
    requiredFactorLibs() {
      return this.availableFactorLibs().filter(l => l.required).map(l => l.key)
    },
    // 因子库多选切换（标准强制项不可取消）
    toggleFactorLib(lib) {
      if (lib.required) {
        this.$message.info(lib.name + ' 为当前标准强制要求，不可取消')
        return
      }
      const i = this.selectedFactorLibs.indexOf(lib.key)
      if (i > -1) this.selectedFactorLibs.splice(i, 1)
      else this.selectedFactorLibs.push(lib.key)
    },
    selectAllFactorLibs(on) {
      if (on) this.selectedFactorLibs = this.availableFactorLibs().map(l => l.key)
      else this.selectedFactorLibs = this.requiredFactorLibs().slice()
    },
    startOnboarding() {
      this.onboardingStep = 0
      this.showOnboarding = true
    },
    finishOnboarding() {
      this.showOnboarding = false
    },
    goBackHome() {
      this.$router.push('/agent-center/apps/org-accounting').catch(() => {})
    },
    // 新建对话：脱离当前会话，回到欢迎态
    newConversation() {
      this.saveConversation()
      this.messages = []
      this.currentConversationId = null
      this.tlDialogStep = 'welcome'
      this.$message.success('已开启新对话')
    }
  }
}
</script>

<style src="./agent-global.css"></style>

<style scoped src="./agent-scoped.css">



</style>
