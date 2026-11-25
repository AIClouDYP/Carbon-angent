<template>
  <div class="standards-library-page">
    <!-- 页头：编号 + 名称 + 状态标签 -->
    <div class="page-header">
      <div class="header-left">
        <el-button size="small" icon="el-icon-back" @click="goBack" class="back-btn">返回列表</el-button>
        <h2 class="page-title">
          <i class="el-icon-collection"></i>
          <span v-if="form">{{ form.code || '（无编号）' }}</span>
          <span v-else>政策标准库 · 详情</span>
          <span v-if="form && form.name" class="title-name">{{ form.name }}</span>
          <template v-if="form">
            <el-tag v-if="form.version" size="small" style="margin-left:8px;">{{ form.version }}</el-tag>
            <el-tag size="small" :type="form.status === '现行' ? 'success' : 'info'" style="margin-left:6px;">{{ form.status }}</el-tag>
            <el-tag size="small" :type="parseStatusTagType(form.parseStatus)" style="margin-left:6px;">{{ parseStatusText(form.parseStatus) }}</el-tag>
          </template>
        </h2>
        <p class="page-desc">解析结果为草稿，请在三页签核对后统一发布；发布后成果自动分发至政策标准库 / 核算公式库 / 平台模板库。</p>
      </div>
      <div class="header-right">
        <el-button size="small" icon="el-icon-download" @click="exportDetail">导出配置</el-button>
        <el-button type="primary" size="small" icon="el-icon-check" :loading="saving" @click="publishDetail">
          {{ isPublished ? '保存修改' : '保存并发布' }}
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" v-loading="true" class="detail-loading"></div>

    <!-- 未找到 -->
    <el-empty v-else-if="!form" description="未找到该标准条目（标识可能已变更）">
      <el-button size="small" @click="goBack">返回列表</el-button>
    </el-empty>

    <template v-else>
      <div class="detail-body">
        <div v-if="parseMeta && parseMeta.source" class="detail-card source-card">
          <div class="source-main">
            <span class="source-tag">Skill 解析</span>
            <span class="source-text">来源文件：{{ sourceFilesSummary }}</span>
            <span class="source-text">解析时间：{{ formatParsedAt }}</span>
            <span class="source-text">Skill：{{ parseMeta.skillName || parseMeta.skillId || '标准解析' }}</span>
            <span v-if="parseMeta.promptModified" class="source-text">模板已修改</span>
            <span v-if="attachmentCount" class="source-text">附件已纳入解析</span>
            <span v-if="isSkillSimulated" class="source-simulated">前端模拟解析</span>
          </div>
        </div>

        <!-- 基本信息（通用固定字段，可折叠） -->
        <div class="detail-card base-card">
          <div class="card-title card-title-toggle" @click="baseInfoCollapsed = !baseInfoCollapsed">
            <i class="el-icon-document"></i> 基本信息
            <span class="card-hint">通用固定字段，修改后同步至标准库</span>
            <i :class="baseInfoCollapsed ? 'el-icon-arrow-down' : 'el-icon-arrow-up'" class="toggle-icon"></i>
          </div>
          <el-form v-show="!baseInfoCollapsed" :model="form" ref="baseForm" label-width="80px" size="small" class="detail-form">
            <el-row :gutter="16">
              <el-col :span="6">
                <el-form-item label="类型">
                  <el-select v-model="form.type" style="width:100%">
                    <el-option v-for="t in typeOptions" :key="t" :label="t" :value="t"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="发布机构">
                  <el-input v-model="form.issuer" placeholder="如 ISO / 国家市场监督管理总局"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="发布年份">
                  <el-input-number v-model="form.yearNum" :min="1990" :max="2099" :controls="false" style="width:100%;" placeholder="如 2024"></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="业务场景">
                  <el-select v-model="form.scenarios" multiple collapse-tags style="width:100%" placeholder="选择适用场景" @change="onScenarioChange">
                    <el-option v-for="sc in scenarioEnum" :key="sc.key" :label="sc.label" :value="sc.key"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="简介">
              <el-input type="textarea" :rows="2" v-model="form.desc" placeholder="标准内容简介"></el-input>
            </el-form-item>
            <el-alert v-if="form.parseStatus === 'rejected' && form.rejectReason" :title="'驳回原因：' + form.rejectReason" type="error" :closable="false" style="margin-bottom:12px;"></el-alert>
            <!-- 人工审核入口（待确认状态） -->
            <div v-if="form.parseStatus === 'pending'" class="detail-audit">
              <div class="audit-left">
                <span class="detail-audit-tip"><i class="el-icon-warning-outline"></i> 该标准待人工确认，逐项核对后点击「保存并发布」即生效并分发</span>
                <span class="audit-progress">已核对 {{ verifiedItemCount }} / {{ totalItemCount }}；未核对 {{ unverifiedItemCount }} 项</span>
              </div>
              <div>
                <el-button type="danger" size="small" plain @click="rejectStandard">驳回</el-button>
              </div>
            </div>
          </el-form>
        </div>

        <!-- 三页签：标准知识 / 公式参数 / 报告模板 -->
        <div class="detail-card tabs-card">
          <el-tabs v-model="activeTab" class="detail-tabs">
            <!-- ========== 页签 1：标准知识 ========== -->
            <el-tab-pane name="knowledge">
              <span slot="label"><i class="el-icon-reading"></i> 标准知识
                <span class="tab-count" :class="{ 'tab-count-warn': knowledgeItemCount && knowledgeVerifiedCount < knowledgeItemCount }">{{ knowledgeVerifiedCount }}/{{ knowledgeItemCount }}</span>
              </span>
              <div class="tab-pane-body">
                <div class="tab-desc">
                  需要被理解、检索和引用的知识内容。分组体系预置于标准解析 Skill，同一场景共用一套；条款依据附着于每条条目。
                </div>

                <!-- 未预设分组的场景（REPORT） -->
                <el-empty v-if="!hasKnowledgeGroups" :image-size="80"
                  description="该场景不预设知识分组（消费方式为「选模板 + 配口径」）">
                  <div class="empty-hint">如需补充知识，可手动新增分组</div>
                </el-empty>

                <!-- 分组列表 -->
                <div v-for="(dim, di) in structured.dimensions" :key="dim.key || di" class="dim-block dim-group">
                  <!-- 分组头部 -->
                  <div class="dim-group-head">
                    <span class="dim-group-index">{{ String(di + 1).padStart(2, '0') }}</span>
                    <el-input v-model="dim.name" size="small" class="dim-group-name" placeholder="分组名称" @input="dim.label = dim.name"></el-input>
                    <el-tag v-if="dim.type === 'table'" size="mini" type="warning">表格</el-tag>
                    <el-tag v-else size="mini">条目</el-tag>
                    <span class="dim-group-count">{{ groupVerifiedCount(dim) }}/{{ (dim.points || []).length }} 条</span>
                    <el-button size="mini" type="text" class="btn-danger" @click="removeGroup(di)">删除分组</el-button>
                  </div>
                  <div v-if="dim.desc" class="dim-group-desc">{{ dim.desc }}</div>

                  <!-- 列表型：条目 + 条款溯源 -->
                  <template v-if="dim.type !== 'table'">
                    <div v-for="(p, pi) in dim.points" :key="pi" class="dim-item">
                      <div class="dim-item-main">
                        <el-checkbox v-model="p.verified" class="verify-check"></el-checkbox>
                        <el-input
                          v-if="!isLongPoint(p)"
                          size="small"
                          v-model="p.text"
                          placeholder="输入知识条目内容"
                        ></el-input>
                        <el-input
                          v-else
                          v-model="p.text"
                          type="textarea"
                          :rows="expandedPoints.has(pointKey(dim, pi)) ? 6 : 3"
                          :autosize="false"
                          class="long-point-editor"
                          placeholder="输入知识条目内容；长内容建议拆成多条，如确属完整规则可在此编辑"
                        ></el-input>
                        <el-button size="mini" type="text" class="btn-danger" @click="removePoint(dim, pi)">删除</el-button>
                      </div>
                      <div v-if="isLongPoint(p)" class="long-point-toolbar">
                        <span class="long-point-count">{{ (p.text || '').length }} 字</span>
                        <el-button size="mini" type="text" @click="togglePointExpanded(dim, pi)">
                          {{ expandedPoints.has(pointKey(dim, pi)) ? '收起编辑' : '展开编辑' }}
                        </el-button>
                      </div>
                      <div class="dim-item-refs">
                        <div v-for="(c, ci) in p.clauseRefs" :key="ci" class="dim-ref-row">
                          <i class="el-icon-paperclip dim-ref-icon"></i>
                          <el-input size="mini" v-model="p.clauseRefs[ci]" placeholder="条款位置（如：第5.1条）"></el-input>
                          <el-button size="mini" type="text" class="btn-danger" @click="p.clauseRefs.splice(ci, 1)">删</el-button>
                        </div>
                        <el-button size="mini" type="text" icon="el-icon-plus" @click="p.clauseRefs.push('')">添加条款依据</el-button>
                      </div>
                    </div>
                    <el-button size="mini" plain icon="el-icon-plus" @click="addPoint(dim)">添加条目</el-button>
                  </template>

                  <!-- 表格型：列定义 + 行数据 -->
                  <template v-else>
                    <div class="table-group">
                      <el-input size="mini" v-model="dim.columnsText" placeholder="列定义（逗号分隔，如：参数,取值,单位,说明）" class="col-def-input"></el-input>
                      <el-table :data="dim.rows" border size="mini" class="table-group-grid">
                        <el-table-column v-for="(col, ci) in dimColumns(dim)" :key="ci" :label="col" :min-width="110">
                          <template slot-scope="{ row }">
                            <el-input size="mini" v-model="row[ci]" :placeholder="col"></el-input>
                          </template>
                        </el-table-column>
                        <el-table-column width="60" align="center">
                          <template slot-scope="{ $index }">
                            <el-button size="mini" type="text" class="btn-danger" @click="dim.rows.splice($index, 1)">删</el-button>
                          </template>
                        </el-table-column>
                      </el-table>
                      <el-button size="mini" plain icon="el-icon-plus" @click="addTableRow(dim)">添加行</el-button>
                    </div>
                  </template>
                </div>

                <el-button type="primary" size="small" plain icon="el-icon-plus" class="add-group-btn" @click="addGroup">新增自定义分组</el-button>
              </div>
            </el-tab-pane>

            <!-- ========== 页签 2：公式参数 ========== -->
            <el-tab-pane name="formula">
              <span slot="label"><i class="el-icon-cpu"></i> 公式参数
                <span class="tab-count">{{ formulaItemCount }}</span>
              </span>
              <div class="tab-pane-body">
                <div class="tab-desc">
                  需要被计算引擎使用的计算规则与参数。公式是核心，参数是依赖，计算规则是约束，三者多对多关联，发布后进入核算公式库。
                </div>

                <el-tabs v-model="formulaSubTab" type="card" class="sub-tabs">
                  <!-- 公式 -->
                  <el-tab-pane name="formulas">
                    <span slot="label">公式 <span class="tab-count">{{ (structured.formulas || []).length }}</span></span>
                    <div class="sub-tab-body">
                      <el-table :data="structured.formulas" border size="mini">
                        <el-table-column label="核对" width="74" align="center">
                          <template slot-scope="{ row }"><el-checkbox v-model="row.verified"></el-checkbox></template>
                        </el-table-column>
                        <el-table-column label="公式编码" width="130">
                          <template slot-scope="{ row }"><el-input size="mini" v-model="row.code" placeholder="如 PCF-MAT-001"></el-input></template>
                        </el-table-column>
                        <el-table-column label="公式名称" min-width="150">
                          <template slot-scope="{ row }"><el-input size="mini" v-model="row.name" placeholder="如 原材料阶段排放量"></el-input></template>
                        </el-table-column>
                        <el-table-column label="表达式" min-width="170">
                          <template slot-scope="{ row, $index }">
                            <el-input
                              v-if="!isLongText(row.expression)"
                              size="mini"
                              v-model="row.expression"
                              placeholder="如 E = A × EF"
                            ></el-input>
                            <div v-else class="cell-long-editor">
                              <el-input
                                v-model="row.expression"
                                type="textarea"
                                :rows="isEditorExpanded('formula', $index) ? 5 : 2"
                                class="formula-editor"
                                placeholder="多行公式表达式，如 E = A × EF"
                              ></el-input>
                              <el-button size="mini" type="text" @click="toggleEditorExpanded('formula', $index)">
                                {{ isEditorExpanded('formula', $index) ? '收起' : '展开' }}
                              </el-button>
                            </div>
                          </template>
                        </el-table-column>
                        <el-table-column label="结果指标" min-width="130">
                          <template slot-scope="{ row }"><el-input size="mini" v-model="row.resultIndicator" placeholder="如 温室气体排放量"></el-input></template>
                        </el-table-column>
                        <el-table-column label="结果单位" width="100">
                          <template slot-scope="{ row }"><el-input size="mini" v-model="row.resultUnit" placeholder="kgCO₂e"></el-input></template>
                        </el-table-column>
                        <el-table-column label="引用参数" min-width="140">
                          <template slot-scope="{ row }"><el-input size="mini" v-model="row.paramRefsText" placeholder="如 A, EF（逗号分隔）"></el-input></template>
                        </el-table-column>
                        <el-table-column label="来源条款" min-width="130">
                          <template slot-scope="{ row }"><el-input size="mini" v-model="row.clauseRef" placeholder="如 第7.2条"></el-input></template>
                        </el-table-column>
                        <el-table-column width="60" align="center">
                          <template slot-scope="{ $index }">
                            <el-button size="mini" type="text" class="btn-danger" @click="structured.formulas.splice($index, 1)">删</el-button>
                          </template>
                        </el-table-column>
                      </el-table>
                      <el-button size="mini" plain icon="el-icon-plus" style="margin-top:6px;" @click="addFormula">添加公式</el-button>
                      <div class="sub-tab-hint">表达式建议结构化存储，便于计算引擎解析；标准未给出具体数值时不得自行生成。</div>
                    </div>
                  </el-tab-pane>

                  <!-- 参数 -->
                  <el-tab-pane name="parameters">
                    <span slot="label">参数 <span class="tab-count">{{ (structured.parameters || []).length }}</span></span>
                    <div class="sub-tab-body">
                      <el-table :data="structured.parameters" border size="mini">
                        <el-table-column label="核对" width="74" align="center">
                          <template slot-scope="{ row }"><el-checkbox v-model="row.verified"></el-checkbox></template>
                        </el-table-column>
                        <el-table-column label="参数编码" width="120">
                          <template slot-scope="{ row }"><el-input size="mini" v-model="row.key" placeholder="如 EF"></el-input></template>
                        </el-table-column>
                        <el-table-column label="参数名称" min-width="140">
                          <template slot-scope="{ row }"><el-input size="mini" v-model="row.name" placeholder="如 原材料排放因子"></el-input></template>
                        </el-table-column>
                        <el-table-column label="参数定义" min-width="160">
                          <template slot-scope="{ row, $index }">
                            <el-input
                              v-if="!isLongText(row.definition)"
                              size="mini"
                              v-model="row.definition"
                              placeholder="参数含义说明"
                            ></el-input>
                            <div v-else class="cell-long-editor">
                              <el-input
                                v-model="row.definition"
                                type="textarea"
                                :rows="isEditorExpanded('parameter', $index) ? 5 : 2"
                                placeholder="参数含义、适用范围与例外说明"
                              ></el-input>
                              <el-button size="mini" type="text" @click="toggleEditorExpanded('parameter', $index)">
                                {{ isEditorExpanded('parameter', $index) ? '收起' : '展开' }}
                              </el-button>
                            </div>
                          </template>
                        </el-table-column>
                        <el-table-column label="单位" width="110">
                          <template slot-scope="{ row }"><el-input size="mini" v-model="row.unit" placeholder="kgCO₂e/kg"></el-input></template>
                        </el-table-column>
                        <el-table-column label="取值来源" min-width="130">
                          <template slot-scope="{ row }"><el-input size="mini" v-model="row.source" placeholder="如 因子库 / 企业数据"></el-input></template>
                        </el-table-column>
                        <el-table-column label="标准给定值" width="120" align="center">
                          <template slot-scope="{ row }">
                            <el-tooltip content="标准明确给出数值时才填写；未给出时留空，由核算任务采集" placement="top">
                              <el-input size="mini" v-model="row.value" placeholder="可留空"></el-input>
                            </el-tooltip>
                          </template>
                        </el-table-column>
                        <el-table-column label="来源条款" min-width="120">
                          <template slot-scope="{ row }"><el-input size="mini" v-model="row.clauseRef" placeholder="如 第7.3条"></el-input></template>
                        </el-table-column>
                        <el-table-column width="60" align="center">
                          <template slot-scope="{ $index }">
                            <el-button size="mini" type="text" class="btn-danger" @click="structured.parameters.splice($index, 1)">删</el-button>
                          </template>
                        </el-table-column>
                      </el-table>
                      <el-button size="mini" plain icon="el-icon-plus" style="margin-top:6px;" @click="addParameter">添加参数</el-button>
                      <div class="sub-tab-hint">参数定义 ≠ 参数取值：定义由标准解析产出；取值仅当标准规定数值时才有。</div>
                    </div>
                  </el-tab-pane>

                  <!-- 计算规则 -->
                  <el-tab-pane name="rules">
                    <span slot="label">计算规则 <span class="tab-count">{{ (structured.calcRules || []).length }}</span></span>
                    <div class="sub-tab-body">
                      <el-table :data="structured.calcRules" border size="mini">
                        <el-table-column label="核对" width="74" align="center">
                          <template slot-scope="{ row }"><el-checkbox v-model="row.verified"></el-checkbox></template>
                        </el-table-column>
                        <el-table-column label="规则类型" width="130">
                          <template slot-scope="{ row }">
                            <el-select size="mini" v-model="row.type" style="width:100%">
                              <el-option v-for="t in ruleTypeOptions" :key="t" :label="t" :value="t"></el-option>
                            </el-select>
                          </template>
                        </el-table-column>
                        <el-table-column label="规则内容" min-width="280">
                          <template slot-scope="{ row, $index }">
                            <el-input
                              v-if="!isLongText(row.content)"
                              size="mini"
                              v-model="row.content"
                              placeholder="规则描述"
                            ></el-input>
                            <div v-else class="cell-long-editor">
                              <el-input
                                v-model="row.content"
                                type="textarea"
                                :rows="isEditorExpanded('rule', $index) ? 5 : 2"
                                placeholder="规则内容；复杂规则建议拆分为多条"
                              ></el-input>
                              <el-button size="mini" type="text" @click="toggleEditorExpanded('rule', $index)">
                                {{ isEditorExpanded('rule', $index) ? '收起' : '展开' }}
                              </el-button>
                            </div>
                          </template>
                        </el-table-column>
                        <el-table-column label="约束对象" min-width="140">
                          <template slot-scope="{ row }"><el-input size="mini" v-model="row.target" placeholder="如 公式 PCF-MAT-001"></el-input></template>
                        </el-table-column>
                        <el-table-column label="来源条款" min-width="120">
                          <template slot-scope="{ row }"><el-input size="mini" v-model="row.clauseRef" placeholder="如 第6.4条"></el-input></template>
                        </el-table-column>
                        <el-table-column width="60" align="center">
                          <template slot-scope="{ $index }">
                            <el-button size="mini" type="text" class="btn-danger" @click="structured.calcRules.splice($index, 1)">删</el-button>
                          </template>
                        </el-table-column>
                      </el-table>
                      <el-button size="mini" plain icon="el-icon-plus" style="margin-top:6px;" @click="addCalcRule">添加规则</el-button>
                      <div class="sub-tab-hint">规则约束公式的适用条件、输入要求与执行方式；不是每个公式都需具备全部规则。</div>
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </div>
            </el-tab-pane>

            <!-- ========== 页签 3：报告模板 ========== -->
            <el-tab-pane name="template">
              <span slot="label"><i class="el-icon-document"></i> 报告模板
                <span class="tab-count" :class="{ 'tab-count-warn': templateSectionCount && templateVerifiedCount < templateSectionCount }">{{ templateVerifiedCount }}/{{ templateSectionCount }}</span>
              </span>
              <div class="tab-pane-body">
                <div class="tab-desc">
                  需要被报告生成模块使用的结构与模板。报告正文由大模型在模板原文格式约束下生成，系统仅结构化「需要企业填写的内容」。
                </div>

                <!-- ① 模板原文 -->
                <div class="dim-block">
                  <div class="dim-label">① 模板原文</div>
                  <div v-if="tplFile && tplFile.name" class="tpl-file">
                    <i class="el-icon-document-checked tpl-file-icon"></i>
                    <span class="tpl-file-name">{{ tplFile.name }}</span>
                    <span class="tpl-file-meta">{{ tplFile.pages ? tplFile.pages + ' 页 · ' : '' }}{{ tplFile.uploadedAt || '' }}</span>
                    <el-button size="mini" type="text" @click="editTplFile">编辑</el-button>
                    <el-button size="mini" type="text" class="btn-danger" @click="removeTplFile">移除</el-button>
                  </div>
                  <div v-else class="tpl-file-empty">
                    <el-button size="mini" plain icon="el-icon-upload2" @click="editTplFile">填写模板文件信息</el-button>
                    <span class="tpl-file-tip">上传后生成报告时作为格式依据</span>
                  </div>
                </div>

                <!-- ② 待填字段（按章节分组） -->
                <div class="dim-block">
                  <div class="dim-label">② 待填字段（按章节分组）</div>
                  <div v-for="(sec, si) in tplSections" :key="si" class="tpl-section">
                    <div class="tpl-section-head">
                      <el-checkbox v-model="sec.verified" class="section-verify">章节已核对</el-checkbox>
                      <el-input size="small" v-model="sec.name" class="tpl-section-name" placeholder="章节名称，如 第一章 企业基本情况"></el-input>
                      <el-select size="small" v-model="sec.type" style="width:110px;">
                        <el-option label="表单类" value="form"></el-option>
                        <el-option label="表格类" value="table"></el-option>
                      </el-select>
                      <el-button size="mini" type="text" class="btn-danger" @click="removeTemplateSection(si)">删除章节</el-button>
                    </div>
                    <el-table :data="sec.fields" border size="mini" class="tpl-field-grid">
                      <el-table-column label="字段名称" min-width="160">
                        <template slot-scope="{ row }"><el-input size="mini" v-model="row.name" placeholder="如 企业名称"></el-input></template>
                      </el-table-column>
                      <el-table-column label="类型" width="110">
                        <template slot-scope="{ row }">
                          <el-select size="mini" v-model="row.type" style="width:100%">
                            <el-option label="文本" value="text"></el-option>
                            <el-option label="数值" value="number"></el-option>
                            <el-option label="日期" value="date"></el-option>
                            <el-option label="计算" value="calc"></el-option>
                          </el-select>
                        </template>
                      </el-table-column>
                      <el-table-column label="单位" width="90">
                        <template slot-scope="{ row }"><el-input size="mini" v-model="row.unit" placeholder="t"></el-input></template>
                      </el-table-column>
                      <el-table-column label="必填" width="70" align="center">
                        <template slot-scope="{ row }"><el-checkbox v-model="row.required"></el-checkbox></template>
                      </el-table-column>
                      <el-table-column label="计算式（计算类型时填）" min-width="160">
                        <template slot-scope="{ row }">
                          <el-input
                            v-if="!isLongText(row.calcRule)"
                            size="mini"
                            v-model="row.calcRule"
                            :disabled="row.type !== 'calc'"
                            placeholder="如 实物量 × 折标系数"
                          ></el-input>
                          <el-input
                            v-else
                            v-model="row.calcRule"
                            type="textarea"
                            :rows="3"
                            :disabled="row.type !== 'calc'"
                            class="formula-editor"
                            placeholder="多行计算式，如 实物量 × 折标系数"
                          ></el-input>
                        </template>
                      </el-table-column>
                      <el-table-column width="60" align="center">
                        <template slot-scope="{ $index }">
                          <el-button size="mini" type="text" class="btn-danger" @click="sec.fields.splice($index, 1)">删</el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                    <el-button size="mini" plain icon="el-icon-plus" style="margin-top:6px;" @click="addField(sec)">添加字段</el-button>
                  </div>
                  <el-button size="mini" plain icon="el-icon-plus" style="margin-top:8px;" @click="addTemplateSection">添加章节</el-button>
                  <div class="sub-tab-hint">字段直接挂在章节下，不单独维护字段库；计算字段由系统算出，不需企业填写。</div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { SCENARIOS, recordDiffOnApprove, validateIndicatorsWeight } from '@/utils/policyStandardService'
import { normalizeGroupsByTemplate, hasGroupTemplate, GROUP_TYPES } from '../data/skillGroupTemplates'

const STORE_KEY = 'carbon-library-standards-v2'

export default {
  name: 'StandardsDetail',
  data() {
    return {
      loading: true,
      saving: false,
      activeTab: 'knowledge',
      formulaSubTab: 'formulas',
      baseInfoCollapsed: false,  // 基本信息卡片折叠状态
      expandedPoints: new Set(),
      form: null,            // 基本信息（可编辑）
      structured: null,      // 结构化内容（可编辑，与 form.structured 同步）
      typeOptions: ['国际标准', '国家标准', '行业标准', '规范/指南', '政策文件'],
      scenarioEnum: SCENARIOS,
      ruleTypeOptions: ['适用规则', '数据规则', '单位规则', '分配规则', '处理规则', '精度规则', '校验规则']
    }
  },
  computed: {
    // 唯一标识：code + version 组合（同编号多版本并存）
    itemKey() {
      return (this.$route.query.code || '') + '@' + (this.$route.query.version || '')
    },
    // 是否已发布（已生效）
    isPublished() {
      return this.form && this.form.parseStatus === 'effective'
    },
    // 主场景（取第一个适用场景）
    primaryScenario() {
      return (this.form && this.form.scenarios && this.form.scenarios[0]) || ''
    },
    // 该场景是否预设知识分组（REPORT 不预设）
    hasKnowledgeGroups() {
      return hasGroupTemplate(this.primaryScenario)
    },
    // 知识条目总数
    knowledgeItemCount() {
      const dims = (this.structured && this.structured.dimensions) || []
      return dims.reduce((n, d) => n + ((d.points && d.points.length) || 0), 0)
    },
    // 公式参数总数
    formulaItemCount() {
      const s = this.structured || {}
      return (s.formulas || []).length + (s.parameters || []).length + (s.calcRules || []).length
    },
    // 报告模板章节数
    templateSectionCount() {
      return ((this.structured && this.structured.reportTemplate && this.structured.reportTemplate.sections) || []).length
    },
    parseMeta() {
      return (this.structured && this.structured.parseMeta) || {}
    },
    sourceFilesSummary() {
      const files = Array.isArray(this.parseMeta.sourceFiles) && this.parseMeta.sourceFiles.length
        ? this.parseMeta.sourceFiles
        : (this.parseMeta.fileName ? [{ name: this.parseMeta.fileName, role: 'main' }] : [])
      const main = files.filter(file => file.role === 'main').map(file => file.name)
      const attachments = files.filter(file => file.role !== 'main').map(file => file.name)
      if (!main.length && !attachments.length) return '未记录'
      const mainText = main.length ? `主文件「${main.join('、')}」` : ''
      const attachmentText = attachments.length ? `附件 ${attachments.length} 个：${attachments.join('、')}` : ''
      return [mainText, attachmentText].filter(Boolean).join('；')
    },
    attachmentCount() {
      const files = Array.isArray(this.parseMeta.sourceFiles) ? this.parseMeta.sourceFiles : []
      return files.filter(file => file.role !== 'main').length
    },
    isSkillSimulated() {
      return this.parseMeta.source === 'skill-simulated'
    },
    formatParsedAt() {
      if (!this.parseMeta.parsedAt) return '未记录'
      const dt = new Date(this.parseMeta.parsedAt)
      return isNaN(dt.getTime()) ? String(this.parseMeta.parsedAt) : dt.toLocaleString('zh-CN')
    },
    knowledgeVerifiedCount() {
      const dims = (this.structured && this.structured.dimensions) || []
      return dims.reduce((sum, dim) => sum + this.groupVerifiedCount(dim), 0)
    },
    formulaVerifiedCount() {
      const s = this.structured || {}
      return ['formulas', 'parameters', 'calcRules'].reduce((sum, key) => {
        return sum + ((s[key] || []).filter(item => item && item.verified).length)
      }, 0)
    },
    templateVerifiedCount() {
      return this.tplSections.filter(sec => sec && sec.verified).length
    },
    verifiedItemCount() {
      return this.knowledgeVerifiedCount + this.formulaVerifiedCount + this.templateVerifiedCount
    },
    totalItemCount() {
      return this.knowledgeItemCount + this.formulaItemCount + this.templateSectionCount
    },
    unverifiedItemCount() {
      return Math.max(0, this.totalItemCount - this.verifiedItemCount)
    },
    // 模板原文文件信息（只读，安全兜底）
    tplFile() {
      return (this.structured && this.structured.reportTemplate && this.structured.reportTemplate.file) || {}
    },
    // 待填字段章节列表（只读，安全兜底）
    tplSections() {
      return (this.structured && this.structured.reportTemplate && this.structured.reportTemplate.sections) || []
    }
  },
  created() {
    this.loadDetail()
  },
  methods: {
    // 从数据源（localStorage）按唯一标识定位并加载单条详情
    loadDetail() {
      this.loading = true
      try {
        const saved = localStorage.getItem(STORE_KEY)
        let list = saved ? JSON.parse(saved) : []
        const item = list.find(s => (s.code || '') + '@' + (s.version || '') === this.itemKey)
        if (item) {
          this.form = {
            code: item.code,
            name: item.name,
            type: item.type,
            scope: item.scope,
            scenarios: item.scenarios || [],
            issuer: item.issuer,
            year: item.year || item.yearNum || '',
            yearNum: parseInt(item.yearNum || item.year, 10) || new Date().getFullYear(),
            version: item.version,
            status: item.status || '现行',
            parseStatus: item.parseStatus || '未解析',
            rejectReason: item.rejectReason || '',
            desc: item.desc || ''
          }
          // 结构化内容深拷贝，编辑不影响原数据，保存时再写回
          this.structured = item.structured ? JSON.parse(JSON.stringify(item.structured)) : {}
          this.ensureStructuredShape()
          this.normalizeDimensions(this.structured)
        } else {
          this.form = null
          this.structured = null
        }
      } catch (e) {
        this.form = null
        this.structured = null
      }
      this.loading = false
    },
    /** 补齐结构化字段，保证三页签可编辑 */
    ensureStructuredShape() {
      const s = this.structured
      if (!s) return
      if (!Array.isArray(s.dimensions)) this.$set(s, 'dimensions', [])
      if (!Array.isArray(s.formulas)) this.$set(s, 'formulas', [])
      if (!Array.isArray(s.parameters)) this.$set(s, 'parameters', [])
      if (!Array.isArray(s.calcRules)) this.$set(s, 'calcRules', [])
      if (!s.reportTemplate) this.$set(s, 'reportTemplate', { file: {}, sections: [] })
      if (!s.reportTemplate.file) this.$set(s.reportTemplate, 'file', {})
      if (!Array.isArray(s.reportTemplate.sections)) this.$set(s.reportTemplate, 'sections', [])
      // 分组为空且有场景模板时，按模板生成骨架（存量分组保留原样，不强行套模板）
      if (!s.dimensions.length) {
        s.dimensions = normalizeGroupsByTemplate([], this.primaryScenario)
      }
    },
    goBack() {
      this.$router.push('/agent-center/apps/standards-library')
    },
    /** 切换场景时按新场景模板生成分组骨架（仅在无分组时） */
    onScenarioChange() {
      if (!this.structured) return
      if (!this.structured.dimensions || !this.structured.dimensions.length) {
        this.structured.dimensions = normalizeGroupsByTemplate([], this.primaryScenario)
        this.normalizeDimensions(this.structured)
      }
    },
    // ===== 标准知识：分组与条目 =====
    groupVerifiedCount(dim) {
      return ((dim && dim.points) || []).filter(item => item && item.verified).length
    },
    isLongPoint(point) {
      return String((point && point.text) || '').length > 100
    },
    isLongText(value) {
      return String(value || '').length > 60
    },
    isEditorExpanded(scope, index) {
      return this.expandedPoints.has(scope + '@' + index)
    },
    toggleEditorExpanded(scope, index) {
      const key = scope + '@' + index
      if (this.expandedPoints.has(key)) this.expandedPoints.delete(key)
      else this.expandedPoints.add(key)
      this.expandedPoints = new Set(this.expandedPoints)
    },
    pointKey(dim, index) {
      return (dim && dim.key ? dim.key : 'group') + '@' + index
    },
    togglePointExpanded(dim, index) {
      const key = this.pointKey(dim, index)
      if (this.expandedPoints.has(key)) this.expandedPoints.delete(key)
      else this.expandedPoints.add(key)
      this.expandedPoints = new Set(this.expandedPoints)
    },
    /** 新增条目（含条款溯源） */
    addPoint(dim) {
      if (!Array.isArray(dim.points)) this.$set(dim, 'points', [])
      dim.points.push({ text: '', clauseRefs: [] })
    },
    /** 删除条目 */
    removePoint(dim, index) {
      dim.points.splice(index, 1)
    },
    /** 新增自定义分组 */
    addGroup() {
      if (!Array.isArray(this.structured.dimensions)) this.$set(this.structured, 'dimensions', [])
      this.structured.dimensions.push({
        key: 'custom_' + Date.now(),
        name: '',
        label: '',
        desc: '',
        type: GROUP_TYPES.LIST,
        points: []
      })
    },
    /** 删除分组 */
    removeGroup(index) {
      this.$confirm('确认删除该分组及其全部内容？', '删除分组', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.structured.dimensions.splice(index, 1)
      }).catch(() => {})
    },
    /** 表格型分组的列定义（逗号分隔 → 数组） */
    dimColumns(dim) {
      const txt = dim.columnsText || (Array.isArray(dim.columns) ? dim.columns.join(',') : '')
      const arr = String(txt).split(/[,，]/).map(x => x.trim()).filter(Boolean)
      return arr.length ? arr : ['列1', '列2']
    },
    /** 表格型分组新增行 */
    addTableRow(dim) {
      if (!Array.isArray(dim.rows)) this.$set(dim, 'rows', [])
      const cols = this.dimColumns(dim)
      const row = {}
      cols.forEach((c, i) => { row[i] = '' })
      dim.rows.push(row)
    },
    // ===== 公式参数 =====
    addFormula() {
      this.structured.formulas.push({
        code: '', name: '', expression: '', resultIndicator: '', resultUnit: '',
        paramRefsText: '', clauseRef: ''
      })
    },
    addParameter() {
      this.structured.parameters.push({
        key: '', name: '', definition: '', unit: '', source: '', value: '', clauseRef: ''
      })
    },
    addCalcRule() {
      this.structured.calcRules.push({
        type: '适用规则', content: '', target: '', clauseRef: ''
      })
    },
    // ===== 报告模板 =====
    editTplFile() {
      const cur = this.tplFile || {}
      this.$prompt('请输入模板文件名', '模板原文', {
        inputValue: cur.name || '',
        inputPlaceholder: '如 用能单位能源利用状况报告格式.docx'
      }).then(({ value }) => {
        if (!this.structured.reportTemplate) this.$set(this.structured, 'reportTemplate', { file: {}, sections: [] })
        this.$set(this.structured.reportTemplate, 'file', {
          name: value,
          pages: cur.pages || '',
          uploadedAt: cur.uploadedAt || new Date().toLocaleDateString('zh-CN')
        })
      }).catch(() => {})
    },
    /** 移除模板原文 */
    removeTplFile() {
      if (!this.structured.reportTemplate) return
      this.$set(this.structured.reportTemplate, 'file', {})
    },
    addTemplateSection() {
      if (!this.structured.reportTemplate) this.$set(this.structured, 'reportTemplate', { file: {}, sections: [] })
      this.structured.reportTemplate.sections.push({
        name: '',
        type: 'form',
        fields: []
      })
    },
    /** 删除章节 */
    removeTemplateSection(index) {
      if (!this.structured.reportTemplate) return
      this.structured.reportTemplate.sections.splice(index, 1)
    },
    addField(sec) {
      if (!Array.isArray(sec.fields)) this.$set(sec, 'fields', [])
      sec.fields.push({ name: '', type: 'text', unit: '', required: true, calcRule: '' })
    },
    /**
     * 旧数据兼容：points 可能是字符串数组，统一转为 { text, clauseRefs } 结构
     * 同时补齐分组名称与类型字段
     */
    normalizeDimensions(structured) {
      if (!structured || !Array.isArray(structured.dimensions)) return
      structured.dimensions.forEach((dim, di) => {
        if (!dim.key) dim.key = 'group_' + di
        if (!dim.name) dim.name = dim.label || ''
        if (!dim.label) dim.label = dim.name
        if (!dim.type) dim.type = GROUP_TYPES.LIST
        if (!Array.isArray(dim.points)) dim.points = []
        dim.points = dim.points.map(p => {
          if (typeof p === 'string') return { text: p, clauseRefs: [] }
          if (p && typeof p === 'object') {
            return {
              text: p.text !== undefined ? p.text : (p.label || ''),
              clauseRefs: Array.isArray(p.clauseRefs) ? p.clauseRefs : [],
              verified: p.verified === true
            }
          }
          return { text: '', clauseRefs: [], verified: false }
        })
        // 表格型：列定义与行
        if (dim.type === GROUP_TYPES.TABLE) {
          if (!dim.columnsText) dim.columnsText = Array.isArray(dim.columns) ? dim.columns.join(',') : ''
          if (!Array.isArray(dim.rows)) dim.rows = []
        }
      })
      const s = structured
      ;(s.formulas || []).forEach(item => { if (item.verified !== true) item.verified = false })
      ;(s.parameters || []).forEach(item => { if (item.verified !== true) item.verified = false })
      ;(s.calcRules || []).forEach(item => { if (item.verified !== true) item.verified = false })
      if (Array.isArray(s.reportTemplate && s.reportTemplate.sections)) {
        s.reportTemplate.sections.forEach(sec => { if (sec.verified !== true) sec.verified = false })
      }
    },
    parseStatusText(ps) {
      return { pending: '待审核', effective: '已生效', rejected: '已驳回' }[ps] || '未解析'
    },
    parseStatusTagType(ps) {
      return { pending: 'warning', effective: 'success', rejected: 'danger' }[ps] || 'info'
    },
    // ===== 驳回（解析结果不准确时退回） =====
    rejectStandard() {
      this.$prompt('请输入驳回原因（将记录留痕）', '驳回解析结果', {
        confirmButtonText: '驳回',
        cancelButtonText: '取消',
        inputPlaceholder: '如：知识分组归类有误 / 公式参数提取遗漏'
      }).then(({ value }) => {
        this.form.parseStatus = 'rejected'
        this.form.rejectReason = value || '解析结果不准确'
        this.persistDetail()
        this.$message.info('已驳回，可修正后重新发布')
      }).catch(() => {})
    },
    // 将当前 form 与 structured 写回数据源（供审核操作复用）
    persistDetail() {
      try {
        const saved = localStorage.getItem(STORE_KEY)
        const list = saved ? JSON.parse(saved) : []
        const idx = list.findIndex(s => (s.code || '') + '@' + (s.version || '') === this.itemKey)
        if (idx > -1) {
          const prev = list[idx]
          list[idx] = Object.assign({}, prev, {
            parseStatus: this.form.parseStatus,
            rejectReason: this.form.rejectReason,
            structured: this.serializeStructured()
          })
          localStorage.setItem(STORE_KEY, JSON.stringify(list))
        }
      } catch (e) { /* ignore */ }
    },
    /** 序列化结构化内容（表格型分组同步 columns） */
    serializeStructured() {
      const s = JSON.parse(JSON.stringify(this.structured || {}))
      ;(s.dimensions || []).forEach(dim => {
        if (dim.type === GROUP_TYPES.TABLE) {
          dim.columns = this.dimColumns(dim)
          delete dim.columnsText
        }
      })
      ;(s.formulas || []).forEach(f => {
        f.paramRefs = String(f.paramRefsText || '').split(/[,，]/).map(x => x.trim()).filter(Boolean)
        delete f.paramRefsText
      })
      return s
    },
    /**
     * 保存并发布：核对三页签 → 落库 → 分发至三库
     * 发布后 parseStatus = effective，各库（政策标准库/核算公式库/平台模板库）同步可见
     */
    publishDetail() {
      if (!this.form.code || !this.form.name) {
        this.$message.warning('标准编号和标准名称为必填项')
        return
      }
      this.normalizeDimensions(this.structured)
      // R040201 RULE-014：申报指标权重合计校验（填写了权重才触发）
      if (this.structured && this.structured.indicators) {
        const vw = validateIndicatorsWeight(this.structured.indicators)
        if (!vw.ok) {
          this.$message.warning(`指标权重合计为 ${vw.total}%，须等于 100%`)
          return
        }
      }
      const doPublish = () => {
        this.saving = true
        setTimeout(() => {
        try {
          const saved = localStorage.getItem(STORE_KEY)
          const list = saved ? JSON.parse(saved) : []
          const idx = list.findIndex(s => (s.code || '') + '@' + (s.version || '') === this.itemKey)
          if (idx > -1) {
            const prev = list[idx]
            const wasEffective = prev.parseStatus === 'effective'
            list[idx] = Object.assign({}, prev, {
              code: this.form.code,
              name: this.form.name,
              type: this.form.type,
              scenarios: this.form.scenarios,
              issuer: this.form.issuer,
              year: this.form.yearNum ? String(this.form.yearNum) : '',
              yearNum: this.form.yearNum,
              version: this.form.version,
              status: this.form.status,
              desc: this.form.desc,
              parseStatus: 'effective',
              structured: this.serializeStructured()
            })
            localStorage.setItem(STORE_KEY, JSON.stringify(list))

            if (wasEffective) {
              this.form.parseStatus = 'effective'
              this.$message.success('保存成功，已同步更新至政策标准库 / 核算公式库 / 平台模板库')
            } else {
              // 首次发布：生成与上一生效版本的配置级差异
              const diffs = recordDiffOnApprove({
                code: this.form.code, version: this.form.version, structured: this.serializeStructured()
              })
              this.form.parseStatus = 'effective'
              if (diffs && diffs.length) {
                this.$message.success(`已发布并分发至三库；与上一版本存在 ${diffs.length} 处配置差异`)
              } else {
                this.$message.success('已发布并分发至政策标准库 / 核算公式库 / 平台模板库')
              }
            }
          } else {
            this.$message.error('发布失败：条目在数据源中已不存在')
          }
        } catch (e) {
          this.$message.error('发布失败：本地数据读写异常')
        }
          this.saving = false
        }, 300)
      }
      if (this.unverifiedItemCount > 0) {
        this.$confirm(`仍有 ${this.unverifiedItemCount} 项解析结果未核对，确认要发布生效吗？`, '发布前确认', {
          confirmButtonText: '仍然发布',
          cancelButtonText: '继续核对',
          type: 'warning'
        }).then(doPublish).catch(() => {})
        return
      }
      doPublish()
    },
    /** 导出当前配置为 JSON（便于交付后端或核对） */
    exportDetail() {
      try {
        const data = {
          code: this.form.code, name: this.form.name, version: this.form.version,
          scenarios: this.form.scenarios,
          structured: this.serializeStructured()
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${this.form.code || 'standard'}-${this.form.version || 'V1'}.json`
        a.click()
        URL.revokeObjectURL(url)
        this.$message.success('配置已导出')
      } catch (e) {
        this.$message.error('导出失败')
      }
    }
  }
}
</script>

<style scoped>
.standards-library-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.page-header { margin-bottom: 16px; display: flex; align-items: flex-start; justify-content: space-between; flex-shrink: 0; }
.header-left { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.back-btn { margin-right: 4px; }
.page-title { font-size: 20px; color: #303133; margin: 0; }
.page-title i { color: #0067FE; }
.page-desc { font-size: 13px; color: #909399; margin-top: 6px; }
.header-right { flex-shrink: 0; display: flex; gap: 8px; }
.detail-loading { min-height: 240px; }
/* 外层容器：仅做垂直布局，不滚动 */
.detail-body { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
.source-card {
  flex-shrink: 0; padding: 10px 14px; margin-bottom: 12px;
  background: #f8fbff; border-color: #d9eaff;
}
.source-main { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.source-tag {
  padding: 2px 8px; font-size: 13px; color: #0067FE;
  background: #e8f1ff; border-radius: 10px; font-weight: 600;
}
.source-text { font-size: 13px; color: #606266; }
.source-simulated {
  padding: 2px 8px; font-size: 13px; color: #b88230;
  background: #fdf6ec; border-radius: 10px;
}
.detail-card {
  background: #fff; border: 1px solid #ebeef5; border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04); padding: 16px 18px; margin-bottom: 16px;
}
/* 基本信息卡片：仅自身布局，内容不滚动 */
.base-card { flex-shrink: 0; }
/* 页签卡片：自适应剩余高度 */
.tabs-card { flex: 1; min-height: 0; margin-bottom: 0; display: flex; flex-direction: column; }
/* 页签内容区：当内容过多时在此区域内滚动 */
.tab-pane-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 0 2px 16px; }
.card-title { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 14px; }
.card-title i { color: #0067FE; margin-right: 4px; }
.card-hint { font-size: 13px; font-weight: 400; color: #909399; margin-left: 6px; }
.detail-form { max-width: 1100px; }

/* 页头标题内的名称 */
.title-name { font-size: 14px; font-weight: 400; color: #606266; margin-left: 10px; }

/* ===== 三页签 ===== */
.tabs-card { padding-top: 6px; }
.detail-tabs { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.detail-tabs ::v-deep .el-tabs__header { margin-bottom: 8px; flex-shrink: 0; }
.detail-tabs ::v-deep .el-tabs__content { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
.detail-tabs ::v-deep .el-tab-pane { height: 100%; min-height: 0; display: flex; flex-direction: column; }

/* 基本信息卡片折叠 */
.card-title-toggle { cursor: pointer; user-select: none; }
.card-title-toggle:hover .toggle-icon { color: #0067FE; }
.toggle-icon { float: right; color: #909399; font-size: 14px; transition: transform 0.2s; }
.detail-tabs ::v-deep .el-tabs__item { font-size: 14px; height: 42px; line-height: 42px; }
.tab-count {
  display: inline-block; min-width: 18px; padding: 0 5px; margin-left: 4px;
  font-size: 13px; line-height: 16px; text-align: center;
  color: #0067FE; background: #e8f1ff; border-radius: 8px;
}
.tab-desc {
  font-size: 13px; color: #909399; line-height: 1.7;
  background: #f7f9fc; border-left: 3px solid #d6e4ff; border-radius: 4px;
  padding: 8px 12px; margin-bottom: 14px;
}

/* ===== 标准知识分组 ===== */
.dim-block { margin-bottom: 16px; padding: 12px 14px; background: #fafbfc; border: 1px solid #eef1f6; border-radius: 6px; }
.dim-block:last-child { margin-bottom: 0; }
.dim-label { font-size: 13px; font-weight: 600; color: #0067FE; margin-bottom: 8px; }
.dim-group { background: #fff; }
.dim-group-head {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 8px; padding-bottom: 8px;
  border-bottom: 1px dashed #e2e8f0;
}
.dim-group-index {
  flex-shrink: 0; width: 22px; height: 22px; line-height: 22px; text-align: center;
  font-size: 13px; font-weight: 600; color: #fff; background: #0067FE; border-radius: 4px;
}
.dim-group-name { flex: 1; max-width: 380px; }
.dim-group-name ::v-deep .el-input__inner { font-weight: 600; color: #303133; font-size: 13px; }
.dim-group-count { font-size: 13px; color: #909399; flex-shrink: 0; }
.dim-group-desc { font-size: 13px; color: #a8abb2; margin-bottom: 10px; line-height: 1.6; }

/* 单条知识条目 */
.dim-item {
  margin-bottom: 10px; padding: 8px 10px;
  background: #f8fafc; border-radius: 4px; border-left: 2px solid #cbd5e1;
}
.dim-item-main { display: flex; align-items: center; gap: 8px; }
.dim-item-main .el-input { flex: 1; }
.long-point-editor {
  flex: 1;
}
.long-point-editor ::v-deep .el-textarea__inner {
  font-size: 13px;
  line-height: 1.6;
}
.long-point-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}
.long-point-count {
  font-size: 13px;
  color: #909399;
}
.cell-long-editor {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}
.cell-long-editor .el-textarea,
.cell-long-editor .el-input {
  flex: 1;
  min-width: 0;
}
.cell-long-editor .el-button--text {
  flex-shrink: 0;
  white-space: nowrap;
}
.formula-editor ::v-deep .el-textarea__inner,
.cell-long-editor .el-textarea__inner {
  font-family: Consolas, Monaco, "Courier New", monospace;
}

/* 条款依据（附着于条目） */
.dim-item-refs { margin-top: 6px; padding-left: 10px; }
.dim-ref-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.dim-ref-row .el-input { flex: 1; max-width: 420px; }
.dim-ref-icon { color: #94a3b8; font-size: 13px; flex-shrink: 0; }
.dim-item-refs .el-button--text { font-size: 13px; color: #94a3b8; padding: 2px 0; }
.dim-item-refs .el-button--text:hover { color: #0067FE; }

/* 表格型分组 */
.table-group { padding: 4px 0; }
.col-def-input { margin-bottom: 8px; max-width: 520px; }
.table-group-grid { margin-bottom: 8px; }

.add-group-btn { margin-top: 4px; }

/* ===== 公式参数子页签 ===== */
.sub-tabs { margin-top: 4px; }
.sub-tabs ::v-deep .el-tabs__header { margin-bottom: 12px; }
.sub-tabs ::v-deep .el-tabs__item { font-size: 13px; height: 34px; line-height: 34px; }
.sub-tab-body { padding: 2px 0; }
.sub-tab-hint { font-size: 13px; color: #a8abb2; margin-top: 8px; line-height: 1.6; }

/* ===== 报告模板 ===== */
.tpl-file {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; background: #fff; border: 1px solid #e4e7ed; border-radius: 4px;
}
.tpl-file-icon { color: #67C23A; font-size: 18px; }
.tpl-file-name { font-size: 13px; color: #303133; font-weight: 500; }
.tpl-file-meta { font-size: 13px; color: #909399; }
.tpl-file-empty { display: flex; align-items: center; gap: 10px; }
.tpl-file-tip { font-size: 13px; color: #a8abb2; }
.tpl-section { margin-bottom: 14px; padding: 10px 12px; background: #fff; border: 1px solid #e4e7ed; border-radius: 4px; }
.tpl-section-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.tpl-section-name { flex: 1; max-width: 400px; }
.tpl-section-name ::v-deep .el-input__inner { font-weight: 600; font-size: 13px; }
.tpl-field-grid { margin-bottom: 0; }

.btn-danger { color: #f56c6c; }
.btn-danger:hover { color: #f78989; }
.detail-audit {
  margin-top: 14px; padding: 12px 14px; background: #fdf6ec; border: 1px solid #faecd8; border-radius: 6px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
}
.audit-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; min-width: 0; }
.detail-audit-tip { font-size: 13px; color: #b88230; }
.detail-audit-tip i { margin-right: 4px; }
.audit-progress { font-size: 13px; color: #8a611f; background: rgba(255,255,255,.65); padding: 3px 8px; border-radius: 10px; }
.verify-check { margin-right: 8px; white-space: nowrap; }
.verify-check ::v-deep .el-checkbox__label { font-size: 13px; color: #606266; }
.section-verify { margin-right: 8px; flex-shrink: 0; }
.section-verify ::v-deep .el-checkbox__label { font-size: 13px; color: #606266; }
.tab-count-warn {
  color: #e6a23c;
  background: #fdf6ec;
}
.empty-hint { font-size: 13px; color: #a8abb2; margin-top: 6px; }
</style>
