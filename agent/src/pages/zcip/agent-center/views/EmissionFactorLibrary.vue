<template>
  <div class="ef-library-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title"><i class="el-icon-coin"></i> 排放因子库</h2>
        <p class="page-desc">覆盖能源、原材料、运输、废弃物等全品类排放因子，支撑碳足迹精准核算</p>
      </div>
    </div>

    <!-- ============ 第一层：因子库列表 ============ -->
    <template v-if="currentView === 'list'">
      <!-- 搜索栏 -->
      <div class="toolbar">
        <el-input placeholder="搜索因子库名称..." prefix-icon="el-icon-search" size="small" v-model="searchText" clearable style="width: 260px;"></el-input>
        <el-select v-model="filterType" placeholder="库类型" size="small" clearable style="width: 140px; margin-left: 8px;">
          <el-option v-for="t in dbTypes" :key="t" :label="t" :value="t"></el-option>
        </el-select>
        <el-button type="primary" size="small" icon="el-icon-plus" style="margin-left: auto;" @click="openDbAdd">新增因子库</el-button>
      </div>

      <!-- 因子库表格 -->
      <div class="table-wrapper">
        <div class="table-title-bar">
          <span class="table-title-text">因子库列表</span>
        </div>
        <div class="table-scroll">
      <el-table :data="pagedDatabases" border stripe size="small" style="width: 100%;" :header-cell-style="headerCellStyle" @row-click="enterDatabase">
        <el-table-column label="因子库名称" prop="name" min-width="220">
          <template slot-scope="{ row }">
            <i :class="row.icon" :style="{ color: row.color }" style="margin-right: 6px;"></i>
            <span style="cursor: pointer; color: #0067FE;">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" prop="type" width="120">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="typeTagType(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="因子数量" width="90" align="center">
          <template slot-scope="{ row }">{{ row.factors.length }}</template>
        </el-table-column>
        <el-table-column label="数据来源" prop="publisher" width="160"></el-table-column>
        <el-table-column label="覆盖地区" prop="region" width="120"></el-table-column>
        <el-table-column label="最新版本" prop="version" width="100"></el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center">
          <template slot-scope="{ row }">
            <el-button type="text" size="mini" @click.stop="enterDatabase(row)">进入</el-button>
            <el-button type="text" size="mini" @click.stop="openDbEdit(row)">编辑</el-button>
            <el-button type="text" size="mini" class="btn-danger" @click.stop="deleteDb(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
        </div>
        <div class="pagination-bar" v-if="filteredDatabases.length > 0">
          <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="filteredDatabases.length" :page-sizes="[10, 20, 50]" :page-size="pageSize" :current-page="currentPage" @size-change="handleSizeChange" @current-change="handlePageChange"></el-pagination>
        </div>
      </div>
    </template>

    <!-- ============ 第二层：因子库内部因子列表 ============ -->
    <template v-else>
      <!-- 返回按钮 + 因子库信息 -->
      <div class="db-detail-header">
        <el-button size="mini" icon="el-icon-back" @click="backToList">返回因子库列表</el-button>
        <div class="db-info">
          <i :class="currentDb.icon" :style="{ color: currentDb.color }" style="font-size: 20px;"></i>
          <div>
            <div class="db-name">{{ currentDb.name }}</div>
            <div class="db-meta">
              <el-tag size="mini" :type="typeTagType(currentDb.type)">{{ currentDb.type }}</el-tag>
              <el-tag size="mini" type="warning" effect="plain" style="margin-left: 8px;">来源优先级 P{{ currentDb.sourceTier || 4 }}</el-tag>
              <span style="margin-left: 8px; color: #909399; font-size: 12px;">
                {{ currentDb.publisher }} | 覆盖地区：{{ currentDb.region }} | 版本：{{ currentDb.version }} | {{ currentDb.factors.length }}条因子
              </span>
            </div>
            <div class="db-format-desc"><i class="el-icon-info"></i> {{ currentDb.formatDesc }}</div>
          </div>
        </div>
      </div>

      <!-- 因子搜索栏 -->
      <div class="toolbar">
        <el-input placeholder="搜索因子名称、匹配关键词..." prefix-icon="el-icon-search" size="small" v-model="factorSearchText" clearable style="width: 240px;"></el-input>
        <el-select v-model="filterCategory" placeholder="因子类别" size="small" clearable style="width: 120px; margin-left: 8px;">
          <el-option v-for="cat in currentDbCategories" :key="cat" :label="cat" :value="cat"></el-option>
        </el-select>
        <el-button type="primary" size="small" icon="el-icon-plus" style="margin-left: auto;" @click="openFactorAdd">新增因子</el-button>
        <el-button size="small" icon="el-icon-upload2" style="margin-left: 8px;" @click="showImportDialog = true">批量导入</el-button>
      </div>

      <!-- 因子表格：固定列 + 库特有动态列 + 行展开匹配档案 -->
      <div class="detail-table-scroll">
      <el-table :data="filteredFactors" border stripe size="small">
        <!-- 行展开：匹配档案 -->
        <el-table-column type="expand">
          <template slot-scope="{ row }">
            <div class="factor-profile">
              <div class="fp-grid">
                <div class="fp-item"><label>活动标识</label><span class="code-font">{{ row.activityId || '—' }}</span></div>
                <div class="fp-item"><label>系统边界</label><el-tag size="mini" :type="boundaryTagType(row.systemBoundary)">{{ boundaryText(row.systemBoundary) }}</el-tag></div>
                <div class="fp-item"><label>气体口径</label><span>{{ row.gasType }}</span></div>
                <div class="fp-item"><label>强度口径</label><span>{{ row.intensityType || '—' }}</span></div>
                <div class="fp-item"><label>技术路线</label><span>{{ row.techRoute || '—' }}</span></div>
                <div class="fp-item"><label>材料属性</label><span>{{ row.materialOrigin || '—' }}</span></div>
                <div class="fp-item"><label>活动数据单位</label><span>{{ row.activityUnit || '—' }}</span></div>
                <div class="fp-item"><label>因子单位</label><span>{{ row.factorUnit }}</span></div>
                <div class="fp-item"><label>技术适用条件</label><span>{{ row.techInfo || '—' }}</span></div>
                <div class="fp-item"><label>质量表征</label><span>{{ qualityText(row) }}</span></div>
                <div class="fp-item"><label>出处引用</label><span>{{ sourceText(row) }}</span></div>
              </div>
              <div v-if="isGwpDb" class="fp-tags">
                <label>使用说明</label>
                <span style="color: #909399; font-size: 12px;">GWP系数为折算参数，不参与智能体活动匹配；由核算引擎在分气体因子折算CO₂e时按标准要求的GWP版本调用（如CBAM用AR5、国内新标准用AR6）。</span>
              </div>
              <div v-else class="fp-tags">
                <label>匹配关键词</label>
                <el-tag v-for="t in (row.tags || [])" :key="t" size="mini" type="info" class="fp-tag">{{ t }}</el-tag>
                <span v-if="!row.tags || row.tags.length === 0" style="color: #C0C4CC;">—</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="因子编码" prop="factorId" width="100" align="center">
          <template slot-scope="{ row }">
            <span class="code-font">{{ row.factorId }}</span>
          </template>
        </el-table-column>
        <el-table-column label="因子名称" prop="name" min-width="180"></el-table-column>
        <!-- 库特有动态列 -->
        <el-table-column
          v-for="col in currentDb.extraColumns"
          :key="col.key"
          :label="col.label"
          :width="col.width"
          :align="col.align || 'left'"
          show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span :class="{ 'fp-en': col.key === 'nameEn', 'fp-unc': col.key === 'uncertainty' }">{{ row[col.key] || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类别" prop="category" width="90">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="categoryTagType(row.category)">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="因子值" width="150" align="right">
          <template slot-scope="{ row }">
            <span class="ef-value">{{ row.value }}</span>
            <span class="ef-unit"> {{ row.factorUnit }}</span>
          </template>
        </el-table-column>
        <el-table-column label="适用地区" prop="region" width="90"></el-table-column>
        <el-table-column label="年份" prop="year" width="70" align="center"></el-table-column>
        <el-table-column label="数据质量" width="110" align="center">
          <template slot-scope="{ row }">
            <el-tag v-if="row.authoritative" size="mini" type="success" effect="plain">官方权威</el-tag>
            <div v-else-if="row.dqr" class="q-dqr">
              <span class="q-num">{{ row.dqr.toFixed(1) }}</span>
              <div class="q-bar"><div class="q-fill" :style="{ width: (row.dqr / 5 * 100) + '%' }"></div></div>
            </div>
            <span v-else-if="row.uncertainty" class="fp-unc">{{ row.uncertainty }}</span>
            <span v-else style="color: #C0C4CC;">—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="110" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="mini" @click="openFactorEdit(row)">编辑</el-button>
            <el-button type="text" size="mini" class="btn-danger" @click="deleteFactor(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      </div>
    </template>

    <!-- 新增/编辑因子库对话框 -->
    <el-dialog :title="dbEditMode ? '编辑因子库' : '新增因子库'" :visible.sync="showDbDialog" width="520px" append-to-body :close-on-click-modal="false">
      <el-form :model="dbForm" label-width="90px" size="small">
        <el-form-item label="库名称" required>
          <el-input v-model="dbForm.name" placeholder="如：企业自建因子库"></el-input>
        </el-form-item>
        <el-form-item label="库类型" required>
          <el-select v-model="dbForm.type" style="width: 100%;">
            <el-option v-for="t in dbTypeOptions" :key="t" :label="t" :value="t"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="发布机构">
          <el-input v-model="dbForm.publisher" placeholder="如：本企业碳管理部"></el-input>
        </el-form-item>
        <el-form-item label="覆盖地区">
          <el-input v-model="dbForm.region" placeholder="如：中国 / 全球"></el-input>
        </el-form-item>
        <el-form-item label="版本">
          <el-input v-model="dbForm.version" placeholder="如 v1.0"></el-input>
        </el-form-item>
        <el-form-item label="格式说明">
          <el-input type="textarea" :rows="2" v-model="dbForm.formatDesc" placeholder="该库数据格式自述，将显示在库详情页头"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="showDbDialog = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveDb">保存</el-button>
      </div>
    </el-dialog>

    <!-- 新增/编辑因子对话框 -->
    <el-dialog :title="factorEditMode ? '编辑因子 — ' + (currentDb ? currentDb.name : '') : '新增因子 — ' + (currentDb ? currentDb.name : '')" :visible.sync="showFactorDialog" width="660px" append-to-body :close-on-click-modal="false">
      <div class="prefill-bar">
        <i class="el-icon-magic-stick"></i>
        <span>事实字段（因子值/单位/年份/地区/出处）请按源数据填写；未填的推断字段可由智能体预填，请核对</span>
        <el-button type="primary" size="mini" icon="el-icon-magic-stick" @click="autoFillFactorForm">智能体预填</el-button>
      </div>
      <el-form :model="factorForm" label-width="100px" size="small">
        <!-- 行1 身份 -->
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="因子名称" required>
              <el-input v-model="factorForm.name" placeholder="如：华东电网平均排放因子"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="英文原名">
              <el-input v-model="factorForm.nameEn" placeholder="可选，国际因子建议填写"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 行2 分类 -->
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="活动标识">
              <div style="display: flex; gap: 4px;">
                <el-input v-model="factorForm.activityId" placeholder="如 electricity_grid-average_east-china，供智能体精确匹配" style="flex: 1;"></el-input>
                <el-popover placement="bottom" width="380" trigger="click" v-model="showAidPop">
                  <div class="aid-pop">
                    <div class="aid-pop-title"><i class="el-icon-magic-stick"></i> 智能体建议（点击选用）</div>
                    <div v-for="c in aidCandidates" :key="c.id" class="aid-cand" @click="applyAid(c.id)">
                      <span class="code-font">{{ c.id }}</span>
                      <el-tag size="mini" :type="c.source === '复用' ? 'success' : 'warning'">{{ c.source }}</el-tag>
                    </div>
                    <div v-if="!aidCandidates.length" class="aid-empty">请先填写因子名称，暂无建议</div>
                  </div>
                  <el-button slot="reference" size="small" icon="el-icon-magic-stick" @click="genAidCandidates">建议</el-button>
                </el-popover>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类别" required>
              <el-select v-model="factorForm.category" style="width: 100%;">
                <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 行3 计量核心 -->
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="因子值" required>
              <el-input v-model="factorForm.value" placeholder="如 0.581"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="因子单位" required>
              <el-input v-model="factorForm.factorUnit" placeholder="如 kgCO₂e/kWh" @change="syncGasTypeFromUnit"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="活动单位" required>
              <el-input v-model="factorForm.activityUnit" placeholder="如 kWh"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 行4 计量口径与适用范围 -->
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="气体口径" required>
              <el-select v-model="factorForm.gasType" style="width: 100%;">
                <el-option label="CO₂" value="CO₂"></el-option>
                <el-option label="CO₂e" value="CO₂e"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="适用地区" required>
              <el-select v-model="factorForm.region" filterable allow-create default-first-option style="width: 100%;" placeholder="选择或输入地区">
                <el-option-group label="通用">
                  <el-option label="全球" value="全球"></el-option>
                  <el-option label="全国" value="全国"></el-option>
                </el-option-group>
                <el-option-group label="区域电网">
                  <el-option v-for="g in gridRegions" :key="g" :label="g" :value="g"></el-option>
                </el-option-group>
                <el-option-group label="省级">
                  <el-option v-for="p in provinceNames" :key="p" :label="p" :value="p"></el-option>
                </el-option-group>
                <el-option-group label="国际">
                  <el-option label="欧盟" value="欧盟"></el-option>
                  <el-option label="英国" value="英国"></el-option>
                  <el-option label="美国" value="美国"></el-option>
                </el-option-group>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="年份">
              <el-input v-model="factorForm.year" placeholder="如 2024"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 行5 电力口径与质量表征 -->
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="强度口径">
              <el-select v-model="factorForm.intensityType" style="width: 100%;" clearable placeholder="电力类因子选择">
                <el-option label="年均" value="年均"></el-option>
                <el-option label="年均（不包括非化石能源）" value="年均（不包括非化石能源）"></el-option>
                <el-option label="化石能源" value="化石能源"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="质量表征">
              <el-select v-model="factorForm.qualityType" style="width: 100%;" placeholder="选择质量表征方式">
                <el-option label="DQR评分" value="dqr"></el-option>
                <el-option label="不确定度" value="uncertainty"></el-option>
                <el-option label="官方权威" value="auth"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="factorForm.qualityType === 'dqr'">
          <el-col :span="12">
            <el-form-item label="DQR评分">
              <el-input-number v-model="factorForm.dqr" :min="1" :max="5" :step="0.5" size="small" style="width: 120px;"></el-input-number>
              <span style="margin-left: 8px; color: #909399; font-size: 12px;">1~5分</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="factorForm.qualityType === 'uncertainty'">
          <el-col :span="12">
            <el-form-item label="不确定度">
              <el-input v-model="factorForm.uncertainty" placeholder="如 ±5%"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 行6 技术代表性与系统边界（T层比较与边界对齐） -->
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="系统边界" required>
              <el-select v-model="factorForm.systemBoundary" style="width: 100%;" placeholder="生命周期边界">
                <el-option label="摇篮到大门 (含上游)" value="cradle-to-gate"></el-option>
                <el-option label="直接燃烧 (消费侧直接)" value="direct-combustion"></el-option>
                <el-option label="大门到大门 (工序加工)" value="gate-to-gate"></el-option>
                <el-option label="摇篮到坟墓 (全生命周期)" value="cradle-to-grave"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="技术路线">
              <el-input v-model="factorForm.techRoute" placeholder="如 热轧/电炉/长流程"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="材料属性">
              <el-select v-model="factorForm.materialOrigin" style="width: 100%;" clearable placeholder="原生/再生">
                <el-option label="原生" value="原生"></el-option>
                <el-option label="再生" value="再生"></el-option>
                <el-option label="混合" value="混合"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="匹配关键词">
          <div style="display: flex; gap: 4px;">
            <el-input v-model="factorForm.tagsInput" placeholder="多个关键词用逗号分隔，如：电网,电力,外购电（供智能体因子匹配命中）" style="flex: 1;"></el-input>
            <el-button size="small" icon="el-icon-magic-stick" @click="suggestTagsFill">建议</el-button>
          </div>
          <div v-if="factorTagsPreview.length" style="margin-top: 6px;">
            <el-tag v-for="t in factorTagsPreview" :key="t" size="mini" type="info" style="margin-right: 4px;">{{ t }}</el-tag>
          </div>
        </el-form-item>
        <el-form-item label="技术条件">
          <el-input type="textarea" :rows="2" v-model="factorForm.techInfo" placeholder="技术适用条件说明（可选）"></el-input>
        </el-form-item>
        <el-form-item label="出处引用">
          <el-input v-model="factorForm.citation" placeholder="因子级出处（可选，缺省使用库级出处）"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="showFactorDialog = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveFactor">保存</el-button>
      </div>
    </el-dialog>

    <!-- 批量导入因子对话框 -->
    <el-dialog :title="'批量导入因子 — ' + (currentDb ? currentDb.name : '')" :visible.sync="showImportDialog" width="780px" append-to-body :close-on-click-modal="false" @close="resetImport">
      <!-- 步骤1：上传文件 -->
      <div v-if="importStep === 1" class="import-zone">
        <div class="import-tip">
          <i class="el-icon-info"></i>
          <div>
            支持 CSV 格式（UTF-8，Excel 可直接另存为 CSV），按标准模板列自动识别；
            「因子编码」留空将自动生成；重复编码、缺少必填字段的行将被跳过并在预览中提示。
            事实字段（因子值/单位/年份/地区/出处）以源数据为准；活动标识、匹配关键词、类别、活动单位等推断字段由智能体预填并在预览中标记，请核对。
            <el-button type="text" size="mini" icon="el-icon-download" @click="downloadFactorTemplate">下载导入模板</el-button>
          </div>
        </div>
        <div class="import-drop" @click="$refs.importFileInput.click()">
          <input type="file" ref="importFileInput" accept=".csv" style="display: none;" @change="handleImportFile" />
          <i class="el-icon-upload"></i>
          <div class="import-drop-text">点击选择 CSV 文件</div>
          <div class="import-drop-hint">仅支持 .csv，单次建议不超过 1000 条</div>
        </div>
      </div>

      <!-- 步骤2：预览确认 -->
      <div v-else class="import-preview">
        <el-alert type="info" :closable="false" style="margin-bottom: 12px;">
          <template slot="title">
            文件「{{ importFileName }}」解析完成：有效 <b style="color:#67C23A">{{ importRows.length }}</b> 条，
            无效 <b style="color:#F56C6C">{{ importErrors.length }}</b> 条，将导入至当前因子库
          </template>
        </el-alert>
        <el-table :data="importRows.slice(0, 10)" border size="mini" max-height="300">
          <el-table-column label="因子编码" width="130">
            <template slot-scope="{ row }"><span class="code-font">{{ row.factorId || '自动生成' }}</span></template>
          </el-table-column>
          <el-table-column label="智能体预填" width="150">
            <template slot-scope="{ row }">
              <el-tag v-for="p in (row.preFilled || [])" :key="p" size="mini" type="success" effect="plain" style="margin: 1px;">{{ p }}</el-tag>
              <span v-if="!row.preFilled || !row.preFilled.length" style="color: #C0C4CC;">—</span>
            </template>
          </el-table-column>
          <el-table-column label="因子名称" prop="name" min-width="150" show-overflow-tooltip></el-table-column>
          <el-table-column label="活动标识" width="200" show-overflow-tooltip>
            <template slot-scope="{ row }">
              <span v-if="row.activityId" class="code-font">{{ row.activityId }}</span>
              <span v-else-if="row.suggestedActivityId" class="code-font aid-sug"><i class="el-icon-magic-stick"></i> {{ row.suggestedActivityId }}</span>
              <span v-else style="color: #C0C4CC;">—</span>
            </template>
          </el-table-column>
          <el-table-column label="因子值" width="90" align="right">
            <template slot-scope="{ row }"><span class="ef-value">{{ row.value }}</span></template>
          </el-table-column>
          <el-table-column label="因子单位" prop="factorUnit" width="130"></el-table-column>
          <el-table-column label="地区" prop="region" width="80"></el-table-column>
          <el-table-column label="年份" prop="year" width="70" align="center"></el-table-column>
          <el-table-column label="质量" width="90" align="center">
            <template slot-scope="{ row }">
              <el-tag v-if="row.authoritative" size="mini" type="success">官方权威</el-tag>
              <span v-else-if="row.dqr" class="q-num">DQR {{ row.dqr }}</span>
              <span v-else class="fp-unc">{{ row.uncertainty }}</span>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="importRows.length > 10" class="import-more">仅预览前 10 条，其余 {{ importRows.length - 10 }} 条将在确认后一并导入</div>
        <div v-if="importErrors.length" class="import-errors">
          <div class="import-errors-title"><i class="el-icon-warning-outline"></i> 无效行（{{ importErrors.length }}条，将被跳过）：</div>
          <div v-for="e in importErrors.slice(0, 5)" :key="e.rowNo" class="import-error-row">第{{ e.rowNo }}行：{{ e.reason }}</div>
          <div v-if="importErrors.length > 5" class="import-more">…其余 {{ importErrors.length - 5 }} 条错误略</div>
        </div>
      </div>

      <div slot="footer">
        <el-button v-if="importStep === 2" size="small" icon="el-icon-refresh-left" @click="resetImport">重新上传</el-button>
        <el-button size="small" @click="showImportDialog = false">取消</el-button>
        <el-button v-if="importStep === 2" size="small" type="primary" :disabled="importRows.length === 0" @click="doImport">确认导入 {{ importRows.length }} 条</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
// ===== 地区标准字典（因子匹配的地域结构化基础） =====
// 标准名 → { code: activityId地区后缀, level: 层级, aliases: 别名 }
const REGION_DICT = {
  '全球': { code: '', level: 'global', aliases: ['全球平均', '世界'] },
  '全国': { code: 'cn', level: 'national', aliases: ['中国', '中国全国', '全国平均'] },
  '华北': { code: 'north-china', level: 'grid', aliases: ['华北区域', '华北电网', '华北区域电网'] },
  '东北': { code: 'north-east-china', level: 'grid', aliases: ['东北区域', '东北电网', '东北区域电网'] },
  '华东': { code: 'east-china', level: 'grid', aliases: ['华东区域', '华东电网', '华东区域电网', '长三角'] },
  '华中': { code: 'central-china', level: 'grid', aliases: ['华中区域', '华中电网', '华中区域电网'] },
  '西北': { code: 'north-west-china', level: 'grid', aliases: ['西北区域', '西北电网', '西北区域电网'] },
  '南方': { code: 'south-china', level: 'grid', aliases: ['南方区域', '南方电网', '南方区域电网'] },
  '西南': { code: 'south-west-china', level: 'grid', aliases: ['西南区域', '西南电网', '西南区域电网'] },
  '欧盟': { code: 'eu', level: 'org', aliases: ['欧洲', 'EU'] },
  '英国': { code: 'uk', level: 'country', aliases: ['UK', 'Defra'] },
  '美国': { code: 'us', level: 'country', aliases: ['US', 'EPA'] }
}
// 省级 → 所属电网区域（蒙东实际属东北，此处内蒙古简化归华北；川渝属华中电网）
const PROVINCES = [
  { name: '中国北京', short: '北京', grid: '华北' }, { name: '中国天津', short: '天津', grid: '华北' },
  { name: '中国河北', short: '河北', grid: '华北' }, { name: '中国山西', short: '山西', grid: '华北' },
  { name: '中国山东', short: '山东', grid: '华北' }, { name: '中国内蒙古', short: '内蒙古', grid: '华北' },
  { name: '中国辽宁', short: '辽宁', grid: '东北' }, { name: '中国吉林', short: '吉林', grid: '东北' }, { name: '中国黑龙江', short: '黑龙江', grid: '东北' },
  { name: '中国上海', short: '上海', grid: '华东' }, { name: '中国江苏', short: '江苏', grid: '华东' }, { name: '中国浙江', short: '浙江', grid: '华东' },
  { name: '中国安徽', short: '安徽', grid: '华东' }, { name: '中国福建', short: '福建', grid: '华东' },
  { name: '中国河南', short: '河南', grid: '华中' }, { name: '中国湖北', short: '湖北', grid: '华中' }, { name: '中国湖南', short: '湖南', grid: '华中' },
  { name: '中国江西', short: '江西', grid: '华中' }, { name: '中国重庆', short: '重庆', grid: '华中' }, { name: '中国四川', short: '四川', grid: '华中' },
  { name: '中国陕西', short: '陕西', grid: '西北' }, { name: '中国甘肃', short: '甘肃', grid: '西北' }, { name: '中国青海', short: '青海', grid: '西北' },
  { name: '中国宁夏', short: '宁夏', grid: '西北' }, { name: '中国新疆', short: '新疆', grid: '西北' },
  { name: '中国广东', short: '广东', grid: '南方' }, { name: '中国广西', short: '广西', grid: '南方' }, { name: '中国云南', short: '云南', grid: '南方' },
  { name: '中国贵州', short: '贵州', grid: '南方' }, { name: '中国海南', short: '海南', grid: '南方' },
  { name: '中国西藏', short: '西藏', grid: '西南' }
]

// ===== GWP 全球增温潜势系数库（折算参数库，非活动排放因子） =====
// 工厂函数：默认数据与 localStorage 迁移共用，保证两处数据一致
function makeGwpDb() {
  const AR6_SRC = { dataset: 'IPCC AR6 WG1 Table 7.15', publisher: 'IPCC', url: 'https://www.ipcc.ch/report/ar6/wg1/' }
  const AR5_SRC = { dataset: 'IPCC AR5 WG1 Table 8.7', publisher: 'IPCC', url: 'https://www.ipcc.ch/report/ar5/wg1/' }
  return {
    id: 'GWP',
    name: 'GWP 全球增温潜势系数库',
    type: '参数库',
    publisher: 'IPCC',
    region: '全球',
    version: 'AR6 Table 7.15',
    factorCount: 10,
    status: '启用',
    sourceTier: 1,
    icon: 'el-icon-odometer',
    color: '#00A8A0',
    formatDesc: '温室气体折算参数库（非活动排放因子） · AR6/AR5 双版本并存 · 不参与智能体活动匹配，由核算引擎分气体折算CO₂e时按标准要求选版本调用（如CBAM用AR5、国内新标准用AR6）',
    extraColumns: [
      { key: 'gasSymbol', label: '气体', width: 80, align: 'center' },
      { key: 'gwpVersion', label: 'GWP版本', width: 90, align: 'center' }
    ],
    factors: [
      { factorId: 'GWP-CV-001', activityId: 'gwp_co2', name: '二氧化碳（CO₂）', category: '转换系数', gasSymbol: 'CO₂', gwpVersion: 'AR6', activityUnit: 'kgCO₂', value: '1', factorUnit: 'kgCO₂e/kgCO₂', gasType: 'CO₂e', region: '全球', year: '2021', authoritative: true, techRoute: 'GWP折算', source: AR6_SRC, tags: ['GWP', '折算系数', 'CO₂', '二氧化碳'], techInfo: 'AR6 GWP-100 · 基准气体（定义为1）' },
      { factorId: 'GWP-CV-002', activityId: 'gwp_ch4-fossil', name: '甲烷（化石源）', category: '转换系数', gasSymbol: 'CH₄', gwpVersion: 'AR6', activityUnit: 'kgCH₄', value: '29.8', factorUnit: 'kgCO₂e/kgCH₄', gasType: 'CO₂e', region: '全球', year: '2021', authoritative: true, techRoute: 'GWP折算', source: AR6_SRC, tags: ['GWP', '折算系数', 'CH₄', '甲烷'], techInfo: 'AR6 GWP-100 · 化石源甲烷口径（含甲烷氧化为CO₂的间接贡献）' },
      { factorId: 'GWP-CV-003', activityId: 'gwp_ch4-non-fossil', name: '甲烷（非化石源）', category: '转换系数', gasSymbol: 'CH₄', gwpVersion: 'AR6', activityUnit: 'kgCH₄', value: '27.0', factorUnit: 'kgCO₂e/kgCH₄', gasType: 'CO₂e', region: '全球', year: '2021', authoritative: true, techRoute: 'GWP折算', source: AR6_SRC, tags: ['GWP', '折算系数', 'CH₄', '甲烷', '生物质'], techInfo: 'AR6 GWP-100 · 非化石源（生物质源）甲烷口径' },
      { factorId: 'GWP-CV-004', activityId: 'gwp_n2o', name: '氧化亚氮（N₂O）', category: '转换系数', gasSymbol: 'N₂O', gwpVersion: 'AR6', activityUnit: 'kgN₂O', value: '273', factorUnit: 'kgCO₂e/kgN₂O', gasType: 'CO₂e', region: '全球', year: '2021', authoritative: true, techRoute: 'GWP折算', source: AR6_SRC, tags: ['GWP', '折算系数', 'N₂O', '氧化亚氮'], techInfo: 'AR6 GWP-100' },
      { factorId: 'GWP-CV-005', activityId: 'gwp_hfc-134a', name: 'HFC-134a', category: '转换系数', gasSymbol: 'HFC-134a', gwpVersion: 'AR6', activityUnit: 'kgHFC-134a', value: '1526', factorUnit: 'kgCO₂e/kgHFC-134a', gasType: 'CO₂e', region: '全球', year: '2021', authoritative: true, techRoute: 'GWP折算', source: AR6_SRC, tags: ['GWP', '折算系数', 'HFC', '制冷剂'], techInfo: 'AR6 GWP-100 · 常用制冷剂' },
      { factorId: 'GWP-CV-006', activityId: 'gwp_sf6', name: '六氟化硫（SF₆）', category: '转换系数', gasSymbol: 'SF₆', gwpVersion: 'AR6', activityUnit: 'kgSF₆', value: '24300', factorUnit: 'kgCO₂e/kgSF₆', gasType: 'CO₂e', region: '全球', year: '2021', authoritative: true, techRoute: 'GWP折算', source: AR6_SRC, tags: ['GWP', '折算系数', 'SF₆', '电气绝缘'], techInfo: 'AR6 GWP-100 · 电气设备绝缘气体' },
      { factorId: 'GWP-CV-007', activityId: 'gwp_nf3', name: '三氟化氮（NF₃）', category: '转换系数', gasSymbol: 'NF₃', gwpVersion: 'AR6', activityUnit: 'kgNF₃', value: '17400', factorUnit: 'kgCO₂e/kgNF₃', gasType: 'CO₂e', region: '全球', year: '2021', authoritative: true, techRoute: 'GWP折算', source: AR6_SRC, tags: ['GWP', '折算系数', 'NF₃', '半导体'], techInfo: 'AR6 GWP-100 · 半导体/光伏制造刻蚀与清洗工艺' },
      { factorId: 'GWP-CV-008', activityId: 'gwp_cf4', name: '四氟化碳（CF₄，PFC）', category: '转换系数', gasSymbol: 'CF₄', gwpVersion: 'AR6', activityUnit: 'kgCF₄', value: '7380', factorUnit: 'kgCO₂e/kgCF₄', gasType: 'CO₂e', region: '全球', year: '2021', authoritative: true, techRoute: 'GWP折算', source: AR6_SRC, tags: ['GWP', '折算系数', 'PFC', '铝冶炼'], techInfo: 'AR6 GWP-100 · 铝冶炼副产PFC代表气体' },
      { factorId: 'GWP-CV-101', activityId: 'gwp_ch4_ar5', name: '甲烷（AR5对照）', category: '转换系数', gasSymbol: 'CH₄', gwpVersion: 'AR5', activityUnit: 'kgCH₄', value: '28', factorUnit: 'kgCO₂e/kgCH₄', gasType: 'CO₂e', region: '全球', year: '2013', authoritative: true, techRoute: 'GWP折算', source: AR5_SRC, tags: ['GWP', '折算系数', 'CH₄', 'AR5'], techInfo: 'AR5 GWP-100 · 供CBAM等要求AR5口径的标准调用' },
      { factorId: 'GWP-CV-102', activityId: 'gwp_n2o_ar5', name: '氧化亚氮（AR5对照）', category: '转换系数', gasSymbol: 'N₂O', gwpVersion: 'AR5', activityUnit: 'kgN₂O', value: '265', factorUnit: 'kgCO₂e/kgN₂O', gasType: 'CO₂e', region: '全球', year: '2013', authoritative: true, techRoute: 'GWP折算', source: AR5_SRC, tags: ['GWP', '折算系数', 'N₂O', 'AR5'], techInfo: 'AR5 GWP-100 · 供CBAM等要求AR5口径的标准调用' }
    ]
  }
}

export default {
  name: 'EmissionFactorLibrary',
  data() {
    return {
      currentView: 'list', // 'list' | 'detail'
      currentDb: null,
      searchText: '',
      filterType: '',
      factorSearchText: '',
      filterCategory: '',
      currentPage: 1,
      pageSize: 10,
      // ===== 因子库管理 =====
      showDbDialog: false,
      dbEditMode: false,
      dbForm: { name: '', type: '企业自建', publisher: '', region: '中国', version: 'v1.0', formatDesc: '' },
      dbTypeOptions: ['生命周期数据库', '国际通用', '行业专用', '国家官方', '参数库', '企业自建'],
      // ===== 因子管理 =====
      showFactorDialog: false,
      factorEditMode: false,
      factorEditIndex: -1,
      categoryOptions: ['能源', '原材料', '资源', '运输', '废气', '废水', '固废', '转换系数'],
      factorForm: {
        name: '', nameEn: '', activityId: '', intensityType: '', category: '能源', gasType: 'CO₂e', year: '', value: '',
        factorUnit: '', activityUnit: '', region: '', qualityType: 'dqr', dqr: 4,
        uncertainty: '±10%', tagsInput: '', techInfo: '', citation: '', techRoute: '', materialOrigin: '', systemBoundary: 'cradle-to-gate'
      },
      // ===== 批量导入 =====
      showImportDialog: false,
      importStep: 1,
      importFileName: '',
      importRows: [],
      importErrors: [],
      // ===== 智能体活动标识建议 =====
      showAidPop: false,
      aidCandidates: [],
      databases: [
        {
          id: 'CPCD',
          name: '中国产品全生命周期温室气体排放系数库（CPCD）',
          type: '生命周期数据库',
          publisher: '生态环境部环境规划院',
          region: '中国',
          version: '2026版',
          factorCount: 18,
          status: '启用',
          sourceTier: 1,
          icon: 'el-icon-s-data',
          color: '#409EFF',
          formatDesc: '中文名称 · 按能源/原材料/资源/运输/废水/固废分类 · 标注数据等级（实测/统计/文献） · DQR质量评分 · CO₂e统一按AR6 GWP(100)折算（基准年2020） · 真实因子经CPCD官方核实（lca.cityghg.com）',
          extraColumns: [{ key: 'dataGrade', label: '数据等级', width: 90, align: 'center' }],
          factors: [
            { factorId: 'CPCD-EN-001', activityId: 'electricity_grid-average_east-china', name: '华东电网平均排放因子', category: '能源', activityUnit: 'kWh', value: '0.581', factorUnit: 'kgCO₂e/kWh', gasType: 'CO₂e', region: '华东', year: '2024', dqr: 5, dataGrade: '统计', tags: ['电网', '电力', '外购电', '购入电力', '华东'], techInfo: '适用于华东区域电网覆盖范围内的外购电力间接排放核算' },
            { factorId: 'CPCD-EN-002', activityId: 'electricity_grid-average_north-china', name: '华北电网平均排放因子', category: '能源', activityUnit: 'kWh', value: '0.647', factorUnit: 'kgCO₂e/kWh', gasType: 'CO₂e', region: '华北', year: '2024', dqr: 5, dataGrade: '统计', tags: ['电网', '电力', '外购电', '购入电力', '华北'], techInfo: '适用于华北区域电网覆盖范围内的外购电力间接排放核算' },
            { factorId: 'CPCD-EN-003', activityId: 'electricity_grid-average_south-china', name: '南方电网平均排放因子', category: '能源', activityUnit: 'kWh', value: '0.527', factorUnit: 'kgCO₂e/kWh', gasType: 'CO₂e', region: '南方', year: '2024', dqr: 5, dataGrade: '统计', tags: ['电网', '电力', '外购电', '购入电力', '南方'], techInfo: '适用于南方区域电网覆盖范围内的外购电力间接排放核算' },
            { factorId: 'CPCD-EN-004', activityId: 'electricity_generation_pv', name: '光伏发电排放因子', category: '能源', activityUnit: 'kWh', value: '0.048', factorUnit: 'kgCO₂e/kWh', gasType: 'CO₂e', region: '全国', year: '2023', dqr: 4, dataGrade: '统计', tags: ['光伏', '绿电', '清洁能源', '电力'], techInfo: '适用于自发自用或合同购入的光伏电力排放核算' },
            { factorId: 'CPCD-EN-005', activityId: 'electricity_generation_wind', name: '风力发电排放因子', category: '能源', activityUnit: 'kWh', value: '0.015', factorUnit: 'kgCO₂e/kWh', gasType: 'CO₂e', region: '全国', year: '2023', dqr: 4, dataGrade: '统计', tags: ['风电', '绿电', '清洁能源', '电力'], techInfo: '适用于自发自用或合同购入的风电电力排放核算' },
            { factorId: 'CPCD-EN-006', activityId: 'electricity_generation_hydro', name: '水力发电排放因子', category: '能源', activityUnit: 'kWh', value: '0.005', factorUnit: 'kgCO₂e/kWh', gasType: 'CO₂e', region: '全国', year: '2023', dqr: 4, dataGrade: '统计', tags: ['水电', '绿电', '清洁能源', '电力'], techInfo: '适用于自发自用或合同购入的水电电力排放核算' },
            { factorId: 'CPCD-EN-007', activityId: 'fuel-production_natural-gas', name: '天然气生产', category: '能源', activityUnit: 'm³', value: '0.548', factorUnit: 'kgCO₂e/m³', gasType: 'CO₂e', region: '全国', year: '2023', dqr: 4, dataGrade: '统计', tags: ['天然气', '燃气', '燃料', '上游生产'], techInfo: '天然气生产环节（上游）排放，不含燃烧环节' },
            { factorId: 'CPCD-EN-008', activityId: 'fuel-production_diesel', name: '柴油生产', category: '能源', activityUnit: 'kg', value: '0.620', factorUnit: 'kgCO₂e/kg', gasType: 'CO₂e', region: '全国', year: '2023', dqr: 4, dataGrade: '统计', tags: ['柴油', '燃料', '上游生产'], techInfo: '柴油生产环节（上游）排放，不含燃烧环节' },
            { factorId: 'CPCD-EN-009', activityId: 'heat_supply_district-heating', name: '热力（集中供热）', category: '能源', activityUnit: 'MJ', value: '0.092', factorUnit: 'kgCO₂e/MJ', gasType: 'CO₂e', region: '华北', year: '2023', dqr: 4, dataGrade: '统计', tags: ['热力', '供热', '蒸汽', '外购热力'], techInfo: '适用于外购热力/蒸汽的间接排放核算' },
            { factorId: 'CPCD-MA-001', activityId: 'material_steel_hot-rolled-bar', name: '热轧钢棒（碳钢/合金钢）', category: '原材料', activityUnit: 'kg', value: '2.43', factorUnit: 'kgCO₂e/kg', gasType: 'CO₂e', region: '中国江苏', year: '2022', dqr: 5, dataGrade: '实测', techRoute: '热轧', materialOrigin: '原生', source: { dataset: 'CPCD词条41242X0072022B', publisher: '中国城市温室气体工作组', url: 'https://lca.cityghg.com/pages/product-view/9050' }, tags: ['钢材', '热轧钢棒', '圆钢', '扁钢', '钢', '金属'], techInfo: '摇篮到大门 · 企业数据（江苏沙钢集团淮钢特钢）· 具体工艺 · 经第三方认证机构审核' },
            { factorId: 'CPCD-MA-002', activityId: 'material_steel_alloy', name: '高合金钢', category: '原材料', activityUnit: 'kg', value: '3.52', factorUnit: 'kgCO₂e/kg', gasType: 'CO₂e', region: '全国', year: '2023', dqr: 4, dataGrade: '文献', tags: ['钢材', '合金钢', '不锈钢', '金属'], techInfo: '合金元素占比高的特种钢材平均' },
            { factorId: 'CPCD-MA-003', activityId: 'material_aluminium_cast', name: '铸造铝合金', category: '原材料', activityUnit: 'kg', value: '8.52', factorUnit: 'kgCO₂e/kg', gasType: 'CO₂e', region: '全国', year: '2023', dqr: 4, dataGrade: '文献', tags: ['铝', '铝合金', '铸造铝', '金属'], techInfo: '含电解铝上游电解环节排放' },
            { factorId: 'CPCD-MA-004', activityId: 'material_plastic_thermoplastic', name: '热塑性塑料', category: '原材料', activityUnit: 'kg', value: '2.73', factorUnit: 'kgCO₂e/kg', gasType: 'CO₂e', region: '全国', year: '2023', dqr: 4, dataGrade: '文献', tags: ['塑料', '热塑性', '树脂', 'PP', 'PE'], techInfo: '通用热塑性树脂（PP/PE/ABS）平均' },
            { factorId: 'CPCD-RE-001', activityId: 'water_supply', name: '自来水', category: '资源', activityUnit: 't', value: '0.193', factorUnit: 'kgCO₂e/t', gasType: 'CO₂e', region: '全国', year: '2023', dqr: 4, dataGrade: '统计', tags: ['水', '自来水', '水资源', '供水'] },
            { factorId: 'CPCD-TR-001', activityId: 'transport_road_freight-diesel', name: '公路运输-柴油货车', category: '运输', activityUnit: 't·km', value: '0.085', factorUnit: 'kgCO₂e/t·km', gasType: 'CO₂e', region: '全国', year: '2023', dqr: 4, dataGrade: '统计', tags: ['运输', '公路', '货车', '物流', '柴油车'], techInfo: '中型及以上柴油货车公路货运平均' },
            { factorId: 'CPCD-TR-002', activityId: 'transport_rail_freight', name: '铁路运输', category: '运输', activityUnit: 't·km', value: '0.010', factorUnit: 'kgCO₂e/t·km', gasType: 'CO₂e', region: '全国', year: '2023', dqr: 5, dataGrade: '统计', tags: ['运输', '铁路', '火车', '货运'], techInfo: '电气化铁路货运平均，含电力间接排放' },
            { factorId: 'CPCD-WW-001', activityId: 'wastewater_treatment', name: '废水处理', category: '废水', activityUnit: 'm³', value: '0.296', factorUnit: 'kgCO₂e/m³', gasType: 'CO₂e', region: '全国', year: '2023', dqr: 4, dataGrade: '统计', tags: ['废水', '污水处理', '水处理', '市政'] },
            { factorId: 'CPCD-SW-001', activityId: 'waste_sludge-disposal', name: '污泥处置', category: '固废', activityUnit: 'kg', value: '0.486', factorUnit: 'kgCO₂e/kg', gasType: 'CO₂e', region: '全国', year: '2023', dqr: 3, dataGrade: '文献', tags: ['污泥', '固废', '处置', '填埋'] }
          ]
        },
        {
          id: 'IPCC',
          name: 'IPCC排放因子数据库',
          type: '国际通用',
          publisher: 'IPCC',
          region: '全球',
          version: '2006指南',
          factorCount: 5,
          status: '启用',
          sourceTier: 1,
          icon: 'el-icon-s-flag',
          color: '#F56C6C',
          formatDesc: '燃料燃烧Tier-1缺省因子（真实数据） · 净热值基准AR5 GWP-100 · 以不确定度区间表征数据质量 · GWP折算系数已独立至「GWP全球增温潜势系数库」',
          extraColumns: [
            { key: 'gasType', label: '气体种类', width: 90, align: 'center' },
            { key: 'uncertainty', label: '不确定度', width: 90, align: 'center' }
          ],
          factors: [
            { factorId: 'IPCC-EN-001', activityId: 'fuel-combustion_natural-gas', name: '天然气燃烧', category: '能源', activityUnit: 'm³', value: '2.16172', factorUnit: 'kgCO₂e/m³', gasType: 'CO₂e', region: '全球', year: '2006', techRoute: '燃烧', systemBoundary: 'direct-combustion', uncertainty: '±5%', source: { dataset: 'IPCC 2006 Guidelines Vol.2 Tables 1.2-1.4, 2.3', publisher: 'IPCC', url: 'https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol2.html' }, tags: ['天然气', '燃烧', '锅炉', '燃料', '燃气'], techInfo: '固定源燃烧缺省因子 · 净热值基准 · AR5 GWP-100（CH₄=28, N₂O=265）' },
            { factorId: 'IPCC-EN-002', activityId: 'fuel-combustion_diesel', name: '柴油燃烧', category: '能源', activityUnit: 'L', value: '2.66085', factorUnit: 'kgCO₂e/L', gasType: 'CO₂e', region: '全球', year: '2006', techRoute: '燃烧', systemBoundary: 'direct-combustion', uncertainty: '±5%', source: { dataset: 'IPCC 2006 Guidelines Vol.2 Tables 1.2-1.4, 2.3', publisher: 'IPCC', url: 'https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol2.html' }, tags: ['柴油', '燃烧', '燃料', '内燃机'], techInfo: '净热值基准 · AR5 GWP-100 · 按质量计为 3196.75 kgCO₂e/t' },
            { factorId: 'IPCC-EN-003', activityId: 'fuel-combustion_gasoline', name: '汽油燃烧', category: '能源', activityUnit: 'L', value: '2.29886', factorUnit: 'kgCO₂e/L', gasType: 'CO₂e', region: '全球', year: '2006', techRoute: '燃烧', systemBoundary: 'direct-combustion', uncertainty: '±5%', source: { dataset: 'IPCC 2006 Guidelines Vol.2 Tables 1.2-1.4, 2.3', publisher: 'IPCC', url: 'https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol2.html' }, tags: ['汽油', '燃烧', '燃料', '乘用车'], techInfo: '净热值基准 · AR5 GWP-100 · 按质量计为 3080.75 kgCO₂e/t' },
            { factorId: 'IPCC-EN-004', activityId: 'fuel-combustion_bituminous-coal', name: '烟煤燃烧', category: '能源', activityUnit: 'kg', value: '2.45816', factorUnit: 'kgCO₂e/kg', gasType: 'CO₂e', region: '全球', year: '2006', techRoute: '燃烧', systemBoundary: 'direct-combustion', uncertainty: '±5%', source: { dataset: 'IPCC 2006 Guidelines Vol.2 Tables 1.2-1.4, 2.3', publisher: 'IPCC', url: 'https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol2.html' }, tags: ['煤', '烟煤', '煤炭', '燃烧', '燃料'], techInfo: '其他烟煤（other bituminous coal）· 净热值基准 · AR5 GWP-100' },
            { factorId: 'IPCC-EN-005', activityId: 'fuel-combustion_anthracite', name: '无烟煤燃烧', category: '能源', activityUnit: 'kg', value: '2.6427', factorUnit: 'kgCO₂e/kg', gasType: 'CO₂e', region: '全球', year: '2006', techRoute: '燃烧', systemBoundary: 'direct-combustion', uncertainty: '±5%', source: { dataset: 'IPCC 2006 Guidelines Vol.2 Tables 1.2-1.4, 2.3', publisher: 'IPCC', url: 'https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol2.html' }, tags: ['煤', '无烟煤', '燃烧', '燃料'], techInfo: '无烟煤（anthracite）· 净热值基准 · AR5 GWP-100 · CO₂不确定度较紧，CH₄/N₂O缺省值不确定度可达数量级' }
          ]
        },
        makeGwpDb(),
        {
          id: 'ECOINVENT',
          name: 'Ecoinvent',
          type: '生命周期数据库',
          publisher: 'ecoinvent Centre',
          region: '全球',
          version: 'v3.10',
          factorCount: 7,
          status: '启用',
          sourceTier: 3,
          icon: 'el-icon-s-grid',
          color: '#67C23A',
          formatDesc: '国际通用LCA数据集 · 中英双语命名 · DQR质量评分 · ⚠️ 演示数据，完整数据集需ecoinvent商业授权',
          extraColumns: [{ key: 'nameEn', label: '英文原名', width: 190 }],
          factors: [
            { factorId: 'ECO-MA-001', activityId: 'material_steel_converter', name: '转炉钢', nameEn: 'Steel, converter', category: '原材料', activityUnit: 'kg', value: '2.11', factorUnit: 'kgCO₂e/kg', gasType: 'CO₂e', region: '全球', year: '2023', dqr: 5, tags: ['钢材', '转炉', '钢', '金属', 'Steel'], techInfo: '全球平均转炉钢（BOF），cut-off模型' },
            { factorId: 'ECO-MA-002', activityId: 'material_aluminium_primary', name: '原生铝', nameEn: 'Aluminium, primary', category: '原材料', activityUnit: 'kg', value: '8.25', factorUnit: 'kgCO₂e/kg', gasType: 'CO₂e', region: '全球', year: '2023', dqr: 5, tags: ['铝', '原生铝', '电解铝', '金属', 'Aluminium'], techInfo: '全球平均原生电解铝' },
            { factorId: 'ECO-MA-003', activityId: 'material_copper', name: '铜', nameEn: 'Copper', category: '原材料', activityUnit: 'kg', value: '3.52', factorUnit: 'kgCO₂e/kg', gasType: 'CO₂e', region: '全球', year: '2023', dqr: 5, tags: ['铜', '紫铜', '线束', '金属', 'Copper'], techInfo: '全球平均阴极铜' },
            { factorId: 'ECO-MA-004', activityId: 'material_plastic_pp', name: '聚丙烯', nameEn: 'Plastics, PP', category: '原材料', activityUnit: 'kg', value: '1.95', factorUnit: 'kgCO₂e/kg', gasType: 'CO₂e', region: '全球', year: '2023', dqr: 5, tags: ['塑料', '聚丙烯', 'PP', '树脂'], techInfo: '全球平均聚丙烯粒料' },
            { factorId: 'ECO-MA-005', activityId: 'material_rubber', name: '橡胶', nameEn: 'Rubber', category: '原材料', activityUnit: 'kg', value: '2.80', factorUnit: 'kgCO₂e/kg', gasType: 'CO₂e', region: '全球', year: '2023', dqr: 4, tags: ['橡胶', '轮胎', '密封件'], techInfo: '合成橡胶全球平均' },
            { factorId: 'ECO-MA-006', activityId: 'material_glass', name: '玻璃', nameEn: 'Glass', category: '原材料', activityUnit: 'kg', value: '1.27', factorUnit: 'kgCO₂e/kg', gasType: 'CO₂e', region: '全球', year: '2023', dqr: 5, tags: ['玻璃', '平板玻璃', '光伏玻璃'], techInfo: '平板玻璃全球平均' },
            { factorId: 'ECO-TR-001', activityId: 'transport_sea_freight', name: '海运货运', nameEn: 'Transport, freight, sea', category: '运输', activityUnit: 't·km', value: '0.011', factorUnit: 'kgCO₂e/t·km', gasType: 'CO₂e', region: '全球', year: '2023', dqr: 5, tags: ['运输', '海运', '船运', '物流', '国际运输'], techInfo: '远洋集装箱船货运全球平均' }
          ]
        },
        {
          id: 'ELCD',
          name: 'ELCD（European Life Cycle Database）',
          type: '生命周期数据库',
          publisher: '欧洲委员会联合研究中心(JRC)',
          region: '欧盟',
          version: 'v3.2',
          factorCount: 6,
          status: '启用',
          sourceTier: 1,
          icon: 'el-icon-s-grid',
          color: '#9B59B6',
          formatDesc: '欧盟官方LCA数据集 · 中英双语命名 · DQR质量评分 · ⚠️ 演示数据，官方已停止更新（v3.2为最终版）',
          extraColumns: [{ key: 'nameEn', label: '英文原名', width: 190 }],
          factors: [
            { factorId: 'ELCD-EN-001', activityId: 'electricity_grid-average_eu', name: '电力(中压)', nameEn: 'Electricity, medium voltage', category: '能源', activityUnit: 'kWh', value: '0.436', factorUnit: 'kgCO₂e/kWh', gasType: 'CO₂e', region: '欧盟', year: '2023', dqr: 5, tags: ['电力', '电网', '外购电', '中压'], techInfo: '欧盟混合电网中压供电平均' },
            { factorId: 'ELCD-MA-001', activityId: 'material_steel_primary_eu', name: '原生钢', nameEn: 'Steel, primary', category: '原材料', activityUnit: 'kg', value: '2.45', factorUnit: 'kgCO₂e/kg', gasType: 'CO₂e', region: '欧盟', year: '2023', dqr: 5, tags: ['钢材', '原生钢', '钢', '金属', 'Steel'], techInfo: '欧盟平均原生钢（高炉-转炉路线）' },
            { factorId: 'ELCD-MA-002', activityId: 'material_aluminium_primary_eu', name: '原生铝', nameEn: 'Aluminium, primary', category: '原材料', activityUnit: 'kg', value: '8.16', factorUnit: 'kgCO₂e/kg', gasType: 'CO₂e', region: '欧盟', year: '2023', dqr: 5, tags: ['铝', '原生铝', '电解铝', '金属', 'Aluminium'], techInfo: '欧盟平均原生电解铝（水电占比高）' },
            { factorId: 'ELCD-TR-001', activityId: 'transport_road_freight_eu', name: '公路货运', nameEn: 'Transport, freight, road', category: '运输', activityUnit: 't·km', value: '0.062', factorUnit: 'kgCO₂e/t·km', gasType: 'CO₂e', region: '欧盟', year: '2023', dqr: 5, tags: ['运输', '公路', '货车', '物流'], techInfo: '欧盟平均公路货运（欧六排放标准车队）' },
            { factorId: 'ELCD-TR-002', activityId: 'transport_rail_freight_eu', name: '铁路货运', nameEn: 'Transport, freight, rail', category: '运输', activityUnit: 't·km', value: '0.018', factorUnit: 'kgCO₂e/t·km', gasType: 'CO₂e', region: '欧盟', year: '2023', dqr: 5, tags: ['运输', '铁路', '火车', '货运'], techInfo: '欧盟平均铁路货运（电气化率约80%）' },
            { factorId: 'ELCD-EN-002', activityId: 'fuel-combustion_natural-gas_boiler', name: '锅炉天然气燃烧', nameEn: 'Natural gas, burned in boiler', category: '能源', activityUnit: 'Nm³', value: '2.04', factorUnit: 'kgCO₂e/Nm³', gasType: 'CO₂e', region: '欧盟', year: '2023', dqr: 4, tags: ['天然气', '锅炉', '燃烧', '燃气'], techInfo: '欧盟工业锅炉天然气燃烧' }
          ]
        },
        {
          id: 'NATIONAL-GEF',
          name: '国家温室气体排放因子数据库',
          type: '国家官方',
          publisher: '生态环境部',
          region: '中国',
          version: '公告〔2025〕47号（2023年电力因子）',
          factorCount: 9,
          status: '启用',
          sourceTier: 1,
          icon: 'el-icon-lightning',
          color: '#E6A23C',
          formatDesc: '生态环境部官方公告因子（真实数据） · 官方权威（发布即最高可信） · 电力因子含年均/年均（不包括非化石能源）/化石能源三种口径及区域因子 · 优先用于履约级核算',
          extraColumns: [{ key: 'intensityType', label: '口径', width: 150, align: 'center' }],
          factors: [
            { factorId: 'NGEF-EN-001', activityId: 'electricity_grid-average_cn', name: '全国电力平均二氧化碳排放因子', category: '能源', activityUnit: 'kWh', value: '0.5306', factorUnit: 'kgCO₂/kWh', gasType: 'CO₂', region: '全国', year: '2023', techRoute: '电网平均', authoritative: true, intensityType: '年均', source: { dataset: '2023年电力二氧化碳排放因子（公告〔2025〕47号）', publisher: '生态环境部、国家统计局', url: 'https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202512/t20251231_1139517.html' }, tags: ['电网', '电力', '外购电', '全国', '平均因子'] },
            { factorId: 'NGEF-EN-002', activityId: 'electricity_grid-average_excl-market_cn', name: '全国电力平均因子（不含市场化非化石电量）', category: '能源', activityUnit: 'kWh', value: '0.6096', factorUnit: 'kgCO₂/kWh', gasType: 'CO₂', region: '全国', year: '2023', authoritative: true, intensityType: '年均（不包括非化石能源）', source: { dataset: '2023年电力二氧化碳排放因子（公告〔2025〕47号）', publisher: '生态环境部、国家统计局', url: 'https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202512/t20251231_1139517.html' }, tags: ['电网', '电力', '外购电', '全国'], techInfo: '不包括市场化交易的非化石能源电量（如绿电交易电量），适用于绿电交易外的范围二核算' },
            { factorId: 'NGEF-EN-003', activityId: 'electricity_grid-fossil_cn', name: '全国化石能源电力二氧化碳排放因子', category: '能源', activityUnit: 'kWh', value: '0.8273', factorUnit: 'kgCO₂/kWh', gasType: 'CO₂', region: '全国', year: '2023', techRoute: '化石能源发电', authoritative: true, intensityType: '化石能源', source: { dataset: '2023年电力二氧化碳排放因子（公告〔2025〕47号）', publisher: '生态环境部、国家统计局', url: 'https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202512/t20251231_1139517.html' }, tags: ['电网', '电力', '化石能源', '火电'] },
            { factorId: 'NGEF-EN-004', activityId: 'electricity_grid-average_east-china', name: '华东区域电力平均因子', category: '能源', activityUnit: 'kWh', value: '0.5500', factorUnit: 'kgCO₂/kWh', gasType: 'CO₂', region: '华东', year: '2023', techRoute: '电网平均', authoritative: true, intensityType: '年均', source: { dataset: '2023年电力二氧化碳排放因子（公告〔2025〕47号）', publisher: '生态环境部、国家统计局', url: 'https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202512/t20251231_1139517.html' }, tags: ['电网', '电力', '外购电', '华东'] },
            { factorId: 'NGEF-EN-005', activityId: 'electricity_grid-average_north-china', name: '华北区域电力平均因子', category: '能源', activityUnit: 'kWh', value: '0.6361', factorUnit: 'kgCO₂/kWh', gasType: 'CO₂', region: '华北', year: '2023', techRoute: '电网平均', authoritative: true, intensityType: '年均', source: { dataset: '2023年电力二氧化碳排放因子（公告〔2025〕47号）', publisher: '生态环境部、国家统计局', url: 'https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202512/t20251231_1139517.html' }, tags: ['电网', '电力', '外购电', '华北'] },
            { factorId: 'NGEF-EN-006', activityId: 'electricity_grid-average_north-east-china', name: '东北区域电力平均因子', category: '能源', activityUnit: 'kWh', value: '0.5122', factorUnit: 'kgCO₂/kWh', gasType: 'CO₂', region: '东北', year: '2023', techRoute: '电网平均', authoritative: true, intensityType: '年均', source: { dataset: '2023年电力二氧化碳排放因子（公告〔2025〕47号）', publisher: '生态环境部、国家统计局', url: 'https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202512/t20251231_1139517.html' }, tags: ['电网', '电力', '外购电', '东北'] },
            { factorId: 'NGEF-EN-007', activityId: 'electricity_grid-average_central-china', name: '华中区域电力平均因子', category: '能源', activityUnit: 'kWh', value: '0.5271', factorUnit: 'kgCO₂/kWh', gasType: 'CO₂', region: '华中', year: '2023', techRoute: '电网平均', authoritative: true, intensityType: '年均', source: { dataset: '2023年电力二氧化碳排放因子（公告〔2025〕47号）', publisher: '生态环境部、国家统计局', url: 'https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202512/t20251231_1139517.html' }, tags: ['电网', '电力', '外购电', '华中'] },
            { factorId: 'NGEF-EN-008', activityId: 'electricity_grid-average_north-west-china', name: '西北区域电力平均因子', category: '能源', activityUnit: 'kWh', value: '0.5543', factorUnit: 'kgCO₂/kWh', gasType: 'CO₂', region: '西北', year: '2023', techRoute: '电网平均', authoritative: true, intensityType: '年均', source: { dataset: '2023年电力二氧化碳排放因子（公告〔2025〕47号）', publisher: '生态环境部、国家统计局', url: 'https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202512/t20251231_1139517.html' }, tags: ['电网', '电力', '外购电', '西北'] },
            { factorId: 'NGEF-EN-009', activityId: 'electricity_grid-average_south-china', name: '南方区域电力平均因子', category: '能源', activityUnit: 'kWh', value: '0.4042', factorUnit: 'kgCO₂/kWh', gasType: 'CO₂', region: '南方', year: '2023', techRoute: '电网平均', authoritative: true, intensityType: '年均', source: { dataset: '2023年电力二氧化碳排放因子（公告〔2025〕47号）', publisher: '生态环境部、国家统计局', url: 'https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202512/t20251231_1139517.html' }, tags: ['电网', '电力', '外购电', '南方'] }
          ]
        }
      ]
    }
  },
  computed: {
    isGwpDb() {
      return !!this.currentDb && this.currentDb.id === 'GWP'
    },
    dbTypes() {
      return [...new Set(this.databases.map(d => d.type))]
    },
    totalFactorCount() {
      return this.databases.reduce((sum, d) => sum + d.factors.length, 0)
    },
    // 匹配关键词输入预览
    factorTagsPreview() {
      return this.factorForm.tagsInput.split(/[,，]/).map(t => t.trim()).filter(Boolean)
    },
    // 地区下拉选项（标准字典）
    gridRegions() {
      return Object.keys(REGION_DICT).filter(k => REGION_DICT[k].level === 'grid')
    },
    provinceNames() {
      return PROVINCES.map(p => p.name)
    },
    filteredDatabases() {
      return this.databases.filter(d => {
        const matchSearch = !this.searchText || d.name.includes(this.searchText)
        const matchType = !this.filterType || d.type === this.filterType
        return matchSearch && matchType
      })
    },
    pagedDatabases() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.filteredDatabases.slice(start, start + this.pageSize)
    },
    currentDbCategories() {
      if (!this.currentDb) return []
      return [...new Set(this.currentDb.factors.map(f => f.category))]
    },
    filteredFactors() {
      if (!this.currentDb) return []
      return this.currentDb.factors.filter(f => {
        const matchSearch = !this.factorSearchText ||
          f.name.includes(this.factorSearchText) ||
          (f.activityId || '').includes(this.factorSearchText) ||
          (f.tags || []).some(t => t.includes(this.factorSearchText))
        const matchCategory = !this.filterCategory || f.category === this.filterCategory
        return matchSearch && matchCategory
      })
    }
  },
  methods: {
    boundaryText(val) {
      const map = {
        'cradle-to-gate': '摇篮到大门(含上游)',
        'direct-combustion': '直接燃烧(消费侧直接)',
        'gate-to-gate': '大门到大门(工序加工)',
        'cradle-to-grave': '摇篮到坟墓(全生命周期)'
      }
      return map[val] || val || '摇篮到大门'
    },
    boundaryTagType(val) {
      if (val === 'direct-combustion') return 'warning'
      if (val === 'cradle-to-grave') return 'success'
      return 'info'
    },
    handleSizeChange(val) { this.pageSize = val; this.currentPage = 1 },
    handlePageChange(val) { this.currentPage = val },
    typeTagType(type) {
      const map = { '生命周期数据库': '', '国际通用': 'danger', '行业专用': 'warning', '参数库': 'success', '国家官方': 'success' }
      return map[type] || 'info'
    },
    categoryTagType(cat) {
      const map = { '能源': 'warning', '原材料': '', '运输': 'success', '资源': 'info', '废气': 'danger', '废水': 'info', '固废': 'danger' }
      return map[cat] || 'info'
    },
    // 质量表征三态文本（匹配档案用）
    qualityText(row) {
      if (row.authoritative) return '官方权威数据（发布即最高可信，无需DQR评分）'
      if (row.dqr) return 'DQR评分 ' + row.dqr.toFixed(1) + '/5（数值可比较，供置信度计算）'
      if (row.uncertainty) return '未评级（该库采用不确定度表征：' + row.uncertainty + '）'
      return '—'
    },
    // 结构化出处文本：source对象 > citation字符串 > 库级出处
    sourceText(row) {
      if (row.source) {
        let t = row.source.dataset + ' · ' + (row.source.publisher || '')
        if (row.source.url) t += ' · ' + row.source.url
        return t
      }
      if (row.citation) return row.citation
      return this.currentDb.publisher + ' · ' + this.currentDb.version
    },
    enterDatabase(row) {
      this.currentDb = row
      this.currentView = 'detail'
      this.factorSearchText = ''
      this.filterCategory = ''
    },
    backToList() {
      this.currentView = 'list'
      this.currentDb = null
    },
    // ===== 地区标准化与地域匹配（因子匹配引擎的地域基础） =====
    // 任意地区写法归一为标准名（华东电网→华东、江苏→中国江苏、中国→全国）
    normalizeRegion(raw) {
      if (!raw) return raw
      const r = String(raw).trim()
      if (REGION_DICT[r]) return r
      if (PROVINCES.some(p => p.name === r)) return r
      for (const k of Object.keys(REGION_DICT)) {
        if (REGION_DICT[k].aliases.indexOf(r) > -1) return k
      }
      const byShort = PROVINCES.find(p => p.short === r)
      if (byShort) return byShort.name
      for (const k of Object.keys(REGION_DICT)) {
        if (r.indexOf(k) > -1) return k
      }
      return r
    },
    // 地域匹配（供因子匹配引擎调用）：exact > region(省级活动→所属电网区域因子) > national(→全国因子) > global
    regionMatch(activityRegion, factorRegion) {
      if (!factorRegion) return { matched: false, level: 'none' }
      const ar = this.normalizeRegion(activityRegion)
      const fr = this.normalizeRegion(factorRegion)
      if (ar === fr) return { matched: true, level: 'exact' }
      if (fr === '全球') return { matched: true, level: 'global' }
      const aProv = PROVINCES.find(p => p.name === ar)
      if (aProv && fr === aProv.grid) return { matched: true, level: 'region' }
      if (aProv && fr === '全国') return { matched: true, level: 'national' }
      if (REGION_DICT[ar] && REGION_DICT[ar].level === 'grid' && fr === '全国') return { matched: true, level: 'national' }
      return { matched: false, level: 'none' }
    },
    // ===== 智能体活动标识标注引擎（词典复用优先 + 命名规范生成兜底） =====
    suggestActivityId(name, category, region) {
      if (!name) return []
      const normRegion = this.normalizeRegion(region)
      const regionEn = (REGION_DICT[normRegion] && REGION_DICT[normRegion].code) || ''
      const RULES = [
        { re: /天然气.*生产|生产.*天然气/, base: 'fuel-production_natural-gas' },
        { re: /柴油.*生产|生产.*柴油/, base: 'fuel-production_diesel' },
        { re: /化石能源|火电/, base: 'electricity_grid-fossil' },
        { re: /电网|外购电|购入电/, base: 'electricity_grid-average' },
        { re: /光伏/, base: 'electricity_generation_pv' },
        { re: /风电|风力/, base: 'electricity_generation_wind' },
        { re: /水电|水力/, base: 'electricity_generation_hydro' },
        { re: /电力|供电|电源/, base: 'electricity' },
        { re: /海运|船|航运/, base: 'transport_sea_freight' },
        { re: /铁路|火车/, base: 'transport_rail_freight' },
        { re: /公路|货车|卡车/, base: 'transport_road_freight' },
        { re: /运输|物流|货运/, base: 'transport' },
        { re: /天然气|燃气/, base: 'fuel-combustion_natural-gas' },
        { re: /柴油/, base: 'fuel-combustion_diesel' },
        { re: /汽油/, base: 'fuel-combustion_gasoline' },
        { re: /无烟煤/, base: 'fuel-combustion_anthracite' },
        { re: /烟煤/, base: 'fuel-combustion_bituminous-coal' },
        { re: /煤/, base: 'fuel-combustion_coal' },
        { re: /热力|供热|蒸汽/, base: 'heat_supply' },
        { re: /钢/, base: 'material_steel' },
        { re: /铝/, base: 'material_aluminium' },
        { re: /铜/, base: 'material_copper' },
        { re: /塑料|聚丙烯|树脂|PP/, base: 'material_plastic' },
        { re: /橡胶|轮胎/, base: 'material_rubber' },
        { re: /玻璃/, base: 'material_glass' },
        { re: /自来水|供水/, base: 'water_supply' },
        { re: /废水|污水/, base: 'wastewater_treatment' },
        { re: /污泥|固废|垃圾|填埋/, base: 'waste' }
      ]
      // 全库 activityId 词典（跨库对齐键的复用池）
      const dict = []
      this.databases.forEach(db => db.factors.forEach(f => { if (f.activityId) dict.push(f) }))
      const candidates = []
      const ruleHit = RULES.find(r => r.re.test(name))
      if (ruleHit) {
        const base = ruleHit.base
        const reused = dict.filter(f => f.activityId.indexOf(base) === 0)
        if (reused.length) {
          const exact = regionEn && reused.find(f => f.activityId === base + '_' + regionEn)
          if (exact) {
            candidates.push({ id: exact.activityId, source: '复用', reason: '库内已存在同活动同地区标识' })
          } else {
            candidates.push({ id: base + (regionEn ? '_' + regionEn : ''), source: '规则生成', reason: '命名规范生成（库内已有同活动因子）' })
          }
          reused.slice(0, 2).forEach(f => {
            if (!candidates.some(c => c.id === f.activityId)) {
              candidates.push({ id: f.activityId, source: '复用', reason: '库内相近活动：' + f.name })
            }
          })
        } else {
          candidates.push({ id: base + (regionEn ? '_' + regionEn : ''), source: '规则生成', reason: '按命名规范生成' })
        }
      }
      // 无规则命中：按名称前缀找相近已有因子兜底
      if (!candidates.length && name.length >= 2) {
        const kw = name.slice(0, 2)
        dict.filter(f => f.name.indexOf(kw) > -1).slice(0, 2).forEach(f => {
          candidates.push({ id: f.activityId, source: '复用', reason: '库内名称相近：' + f.name })
        })
      }
      return candidates.slice(0, 3)
    },
    genAidCandidates() {
      this.aidCandidates = this.suggestActivityId(this.factorForm.name, this.factorForm.category, this.factorForm.region)
    },
    applyAid(id) {
      this.factorForm.activityId = id
      this.showAidPop = false
    },
    // ===== 智能体匹配关键词标注引擎（词表命中 + 同活动因子复用 + 地区词） =====
    suggestTags(name, category, region, activityId) {
      const tags = new Set()
      // 1) 同活动标识（activityId）因子的已有 tags 并集复用（跨库对齐后的模糊命中层共享）
      if (activityId) {
        this.databases.forEach(db => db.factors.forEach(f => {
          if (f.activityId === activityId && f.tags) f.tags.forEach(t => tags.add(t))
        }))
      }
      // 2) 内置碳核算词表命中因子名称（含同义词/俗称）
      const LEXICON = ['电网', '电力', '外购电', '购入电力', '光伏', '风电', '风力', '水电', '水力', '绿电', '清洁能源', '天然气', '燃气', '柴油', '汽油', '原煤', '烟煤', '无烟煤', '煤炭', '生物质', '热力', '供热', '蒸汽', '钢材', '碳钢', '合金钢', '不锈钢', '转炉钢', '铝合金', '电解铝', '铸造铝', '铜', '线束', '塑料', '聚丙烯', '树脂', '橡胶', '轮胎', '玻璃', '光伏玻璃', '运输', '公路', '铁路', '海运', '船运', '物流', '货运', '货车', '自来水', '供水', '废水', '污水', '水处理', '污泥', '固废', '填埋', '焚烧', '锅炉', '内燃机', '燃烧', '金属', '铝', '钢', '煤', '线缆']
      LEXICON.forEach(w => { if (name && name.indexOf(w) > -1) tags.add(w) })
      // 3) 地区词（提升地域匹配召回，经标准化）
      const normR = this.normalizeRegion(region)
      if (normR && normR !== '全球') {
        const r = normR === '全国' ? '全国' : normR.replace(/^中国/, '')
        if (r && r.length <= 3) tags.add(r)
      }
      return Array.from(tags).slice(0, 8)
    },
    suggestTagsFill() {
      const sug = this.suggestTags(this.factorForm.name, this.factorForm.category, this.factorForm.region, this.factorForm.activityId)
      if (!sug.length) {
        this.$message.info('暂无建议，请手动填写')
        return
      }
      const cur = this.factorForm.tagsInput.split(/[,，]/).map(t => t.trim()).filter(Boolean)
      const merged = Array.from(new Set(cur.concat(sug)))
      this.factorForm.tagsInput = merged.join(',')
      this.$message.success('已合并智能体建议的 ' + (merged.length - cur.length) + ' 个关键词')
    },
    // ===== 智能体预填推断（第三档字段：预填+人工确认） =====
    // 活动数据单位：从因子单位分母反推（kgCO₂e/t·km → t·km）
    inferActivityUnit(factorUnit) {
      if (!factorUnit) return ''
      const m = String(factorUnit).match(/\/(.+)$/)
      return m ? m[1].trim() : ''
    },
    // 类别：按名称规则推断
    inferCategory(name) {
      if (!name) return ''
      if (/钢|铝|铜|塑料|聚丙烯|树脂|橡胶|轮胎|玻璃|金属/.test(name)) return '原材料'
      if (/运输|物流|货运|海运|船|铁路|火车|公路|货车/.test(name)) return '运输'
      if (/自来水|供水/.test(name)) return '资源'
      if (/废水|污水/.test(name)) return '废水'
      if (/废气/.test(name)) return '废气'
      if (/污泥|固废|垃圾|填埋|焚烧/.test(name)) return '固废'
      if (/电网|电力|外购电|光伏|风电|水电|柴油|汽油|煤|天然气|燃气|热力|供热|蒸汽/.test(name)) return '能源'
      return ''
    },
    // 强度口径：按名称推断（电力类，减排路径为绿电替换——绿电因子近0，无需边际口径）
    inferIntensityType(name) {
      if (!name) return ''
      // 注意："不包括非化石能源"含"化石"二字，须先判"不含/不包括"
      if (/不含|不包括/.test(name)) return '年均（不包括非化石能源）'
      if (/化石|火电/.test(name)) return '化石能源'
      if (/电网|区域电力|外购电/.test(name)) return '年均'
      return ''
    },
    // 库级质量默认（国家库官方权威；其他库不自动改）
    defaultQualityForDb() {
      return this.currentDb && this.currentDb.id === 'NATIONAL-GEF' ? 'auth' : ''
    },
    // 技术路线：按名称推断（T层比较的结构化字段）
    inferTechRoute(name) {
      if (!name) return ''
      if (/电炉/.test(name)) return '电炉'
      if (/长流程|高炉/.test(name)) return '长流程'
      if (/热轧|冷轧/.test(name)) return name.indexOf('冷轧') > -1 ? '冷轧' : '热轧'
      if (/再生|废钢/.test(name)) return '再生'
      if (/电解/.test(name)) return '电解'
      if (/电网|电力/.test(name)) return '电网平均'
      if (/燃烧|锅炉/.test(name)) return '燃烧'
      if (/GWP/.test(name)) return 'GWP折算'
      return ''
    },
    // 材料属性：按名称推断
    inferMaterialOrigin(name) {
      if (!name) return ''
      if (/再生|废钢|回收/.test(name)) return '再生'
      if (/原生|一次/.test(name)) return '原生'
      return ''
    },
    // 表单一键预填：填充未填的第三档字段（不覆盖已填值）
    autoFillFactorForm() {
      let filled = 0
      if (!this.factorForm.activityId) {
        const sug = this.suggestActivityId(this.factorForm.name, this.factorForm.category, this.factorForm.region)
        if (sug.length) { this.factorForm.activityId = sug[0].id; filled++ }
      }
      const sugT = this.suggestTags(this.factorForm.name, this.factorForm.category, this.factorForm.region, this.factorForm.activityId)
      if (sugT.length) {
        const cur = this.factorForm.tagsInput.split(/[,，]/).map(t => t.trim()).filter(Boolean)
        const merged = Array.from(new Set(cur.concat(sugT)))
        if (merged.length > cur.length) { this.factorForm.tagsInput = merged.join(','); filled++ }
      }
      if (!this.factorForm.activityUnit) {
        const au = this.inferActivityUnit(this.factorForm.factorUnit)
        if (au) { this.factorForm.activityUnit = au; filled++ }
      }
      if (this.factorForm.category === '能源') {
        const cat = this.inferCategory(this.factorForm.name)
        if (cat && cat !== '能源') { this.factorForm.category = cat; filled++ }
      }
      if (!this.factorForm.intensityType) {
        const it = this.inferIntensityType(this.factorForm.name)
        if (it) { this.factorForm.intensityType = it; filled++ }
      }
      if (this.factorForm.qualityType === 'dqr') {
        const dq = this.defaultQualityForDb()
        if (dq) { this.factorForm.qualityType = dq; filled++ }
      }
      if (!this.factorForm.techRoute) {
        const tr = this.inferTechRoute(this.factorForm.name)
        if (tr) { this.factorForm.techRoute = tr; filled++ }
      }
      if (!this.factorForm.materialOrigin) {
        const mo = this.inferMaterialOrigin(this.factorForm.name)
        if (mo) { this.factorForm.materialOrigin = mo; filled++ }
      }
      if (filled) this.$message.success('智能体已预填 ' + filled + ' 项，请核对')
      else this.$message.info('暂无可预填项')
    },
    // ===== 气体口径与单位交叉校验 =====
    // 从因子单位解析气体口径（gasType = 单位分子的结构化解析结果），兼容 CO₂e/CO2e/CO2-eq/CO2eq 等变体
    parseGasType(factorUnit) {
      if (!factorUnit) return null
      const u = String(factorUnit).replace(/\s/g, '').replace(/₂/g, '2')
      if (/CO2-?EQ/i.test(u)) return 'CO₂e'
      if (/CO2-?E/i.test(u)) return 'CO₂e'
      if (/CO2/i.test(u)) return 'CO₂'
      return null
    },
    // 单位输入变化时自动同步气体口径与活动数据单位（解析成功才覆盖）
    syncGasTypeFromUnit() {
      const parsed = this.parseGasType(this.factorForm.factorUnit)
      if (parsed) this.factorForm.gasType = parsed
      if (!this.factorForm.activityUnit) {
        const au = this.inferActivityUnit(this.factorForm.factorUnit)
        if (au) this.factorForm.activityUnit = au
      }
    },
    // ===== 持久化 =====
    persistDatabases() {
      try { localStorage.setItem('cfp_factor_databases_v5', JSON.stringify(this.databases)) } catch (e) { /* ignore */ }
    },
    loadDatabases() {
      try {
        const saved = localStorage.getItem('cfp_factor_databases_v5')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && parsed.length > 0) { this.databases = parsed; return }
        }
        // v4 → v5 迁移：GWP系数从IPCC库剥离为独立参数库（旧值27.9非AR6官方值，统一替换为标准库）
        const old = localStorage.getItem('cfp_factor_databases_v4')
        if (old) {
          const parsed = JSON.parse(old)
          if (parsed && parsed.length > 0) {
            const ipcc = parsed.find(d => d.id === 'IPCC')
            if (ipcc && !parsed.find(d => d.id === 'GWP')) {
              ipcc.factors = ipcc.factors.filter(f => f.category !== '转换系数' && !/^gwp_/.test(f.activityId || ''))
              ipcc.factorCount = ipcc.factors.length
              parsed.splice(parsed.indexOf(ipcc) + 1, 0, makeGwpDb())
            }
            this.databases = parsed
            this.persistDatabases()
            return
          }
        }
      } catch (e) { /* ignore */ }
    },
    // ===== 因子库管理 =====
    openDbAdd() {
      this.dbEditMode = false
      this.dbForm = { name: '', type: '企业自建', publisher: '', region: '中国', version: 'v1.0', formatDesc: '' }
      this.showDbDialog = true
    },
    openDbEdit(row) {
      this.dbEditMode = true
      this._editingDb = row
      this.dbForm = {
        name: row.name, type: row.type, publisher: row.publisher,
        region: row.region, version: row.version, formatDesc: row.formatDesc || ''
      }
      this.showDbDialog = true
    },
    saveDb() {
      if (!this.dbForm.name || !this.dbForm.type) {
        this.$message.warning('库名称和库类型为必填项')
        return
      }
      if (this.dbEditMode) {
        Object.assign(this._editingDb, this.dbForm)
        this.$message.success('因子库信息已更新')
      } else {
        const icons = ['el-icon-coin', 'el-icon-s-data', 'el-icon-collection', 'el-icon-folder-opened']
        const colors = ['#409EFF', '#67C23A', '#E6A23C', '#9B59B6', '#00A8A0']
        this.databases.push({
          id: 'CUSTOM-' + Date.now().toString().slice(-6),
          name: this.dbForm.name,
          type: this.dbForm.type,
          publisher: this.dbForm.publisher || '自建',
          region: this.dbForm.region || '中国',
          version: this.dbForm.version || 'v1.0',
          formatDesc: this.dbForm.formatDesc || '企业自建因子库 · 按统一Schema录入 · 支持智能体因子匹配',
          factorCount: 0,
          status: '启用',
          sourceTier: 4,
          icon: icons[this.databases.length % icons.length],
          color: colors[this.databases.length % colors.length],
          extraColumns: [],
          factors: []
        })
        this.$message.success('因子库已创建，进入后可新增因子')
      }
      this.persistDatabases()
      this.showDbDialog = false
    },
    deleteDb(row) {
      this.$confirm('确定删除因子库「' + row.name + '」及其全部 ' + row.factors.length + ' 条因子？删除后不可恢复。', '删除确认', { type: 'warning' }).then(() => {
        this.databases = this.databases.filter(d => d.id !== row.id)
        if (this.currentDb && this.currentDb.id === row.id) {
          this.currentView = 'list'
          this.currentDb = null
        }
        this.persistDatabases()
        this.$message.success('已删除')
      }).catch(() => {})
    },
    // ===== 因子管理 =====
    catCode(cat) {
      return { '能源': 'EN', '原材料': 'MA', '资源': 'RE', '运输': 'TR', '废气': 'GA', '废水': 'WW', '固废': 'SW', '转换系数': 'CV' }[cat] || 'OT'
    },
    genFactorId(db, cat) {
      const prefix = db.id + '-' + this.catCode(cat) + '-'
      let max = 0
      db.factors.forEach(f => {
        if (f.factorId && f.factorId.startsWith(prefix)) {
          const n = parseInt(f.factorId.slice(prefix.length)) || 0
          if (n > max) max = n
        }
      })
      return prefix + String(max + 1).padStart(3, '0')
    },
    openFactorAdd() {
      this.factorEditMode = false
      this.factorEditIndex = -1
      this.factorForm = {
        name: '', nameEn: '', activityId: '', intensityType: '', category: '能源', gasType: 'CO₂e', year: String(new Date().getFullYear()),
        value: '', factorUnit: '', activityUnit: '', region: '全国',
        qualityType: 'dqr', dqr: 4, uncertainty: '±10%', tagsInput: '', techInfo: '', citation: '', techRoute: '', materialOrigin: '', systemBoundary: 'cradle-to-gate'
      }
      this.showFactorDialog = true
    },
    openFactorEdit(row) {
      this.factorEditMode = true
      this.factorEditIndex = this.currentDb.factors.indexOf(row)
      const qualityType = row.authoritative ? 'auth' : (row.dqr ? 'dqr' : 'uncertainty')
      this.factorForm = {
        name: row.name, nameEn: row.nameEn || '', activityId: row.activityId || '', intensityType: row.intensityType || '',
        category: row.category, gasType: row.gasType, year: row.year,
        value: row.value, factorUnit: row.factorUnit, activityUnit: row.activityUnit || '',
        region: row.region, qualityType,
        dqr: row.dqr || 4, uncertainty: row.uncertainty || '±10%',
        tagsInput: (row.tags || []).join(','), techInfo: row.techInfo || '', citation: row.citation || '',
        techRoute: row.techRoute || '', materialOrigin: row.materialOrigin || ''
      }
      this.showFactorDialog = true
    },
    saveFactor() {
      const f = this.factorForm
      if (!f.name || !f.value || !f.factorUnit || !f.activityUnit) {
        this.$message.warning('因子名称、因子值、因子单位、活动数据单位为必填项')
        return
      }
      // 气体口径与单位交叉校验（矛盾即拦截）
      const parsedGas = this.parseGasType(f.factorUnit)
      if (parsedGas && parsedGas !== f.gasType) {
        this.$message.warning('气体口径与因子单位矛盾：单位「' + f.factorUnit + '」的分子为 ' + parsedGas + '，与所选口径 ' + f.gasType + ' 不一致，请修正')
        return
      }
      const factor = {
        factorId: this.factorEditMode
          ? this.currentDb.factors[this.factorEditIndex].factorId
          : this.genFactorId(this.currentDb, f.category),
        name: f.name, category: f.category, gasType: f.gasType, year: f.year,
        value: f.value, factorUnit: f.factorUnit, activityUnit: f.activityUnit, region: this.normalizeRegion(f.region),
        tags: this.factorTagsPreview
      }
      if (f.activityId) factor.activityId = f.activityId
      if (f.intensityType) factor.intensityType = f.intensityType
      if (f.techRoute) factor.techRoute = f.techRoute
      if (f.materialOrigin) factor.materialOrigin = f.materialOrigin
      if (f.nameEn) factor.nameEn = f.nameEn
      if (f.techInfo) factor.techInfo = f.techInfo
      if (f.citation) factor.citation = f.citation
      if (f.qualityType === 'dqr') factor.dqr = f.dqr
      else if (f.qualityType === 'uncertainty') factor.uncertainty = f.uncertainty
      else factor.authoritative = true
      if (this.factorEditMode) {
        this.$set(this.currentDb.factors, this.factorEditIndex, factor)
      } else {
        this.currentDb.factors.push(factor)
      }
      this.currentDb.factorCount = this.currentDb.factors.length
      this.persistDatabases()
      this.showFactorDialog = false
      this.$message.success(this.factorEditMode ? '因子已更新' : '因子已新增：' + factor.factorId)
    },
    deleteFactor(row) {
      this.$confirm('确定删除因子「' + row.name + '」？', '删除确认', { type: 'warning' }).then(() => {
        const idx = this.currentDb.factors.indexOf(row)
        if (idx > -1) this.currentDb.factors.splice(idx, 1)
        this.currentDb.factorCount = this.currentDb.factors.length
        this.persistDatabases()
        this.$message.success('已删除')
      }).catch(() => {})
    },
    // ===== 批量导入 =====
    parseCSV(text) {
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)
      const rows = []
      let row = []
      let field = ''
      let inQuotes = false
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        if (inQuotes) {
          if (ch === '"') {
            if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
          } else { field += ch }
        } else {
          if (ch === '"') { inQuotes = true }
          else if (ch === ',') { row.push(field); field = '' }
          else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = '' }
          else if (ch !== '\r') { field += ch }
        }
      }
      if (field !== '' || row.length > 0) { row.push(field); rows.push(row) }
      return rows
    },
    csvEscape(v) {
      const s = String(v == null ? '' : v)
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
    },
    downloadFactorTemplate() {
      const headers = ['因子编码', '活动标识', '因子名称', '英文原名', '类别', '气体口径', '强度口径', '因子值', '因子单位', '活动数据单位', '适用地区', '年份', '质量表征类型', 'DQR评分', '不确定度', '匹配关键词', '技术适用条件', '出处', '技术路线', '材料属性']
      const rows = [
        ['', 'electricity_generation_pv', '光伏发电排放因子', 'Photovoltaic', '能源', 'CO₂e', '', '0.048', 'kgCO₂e/kWh', 'kWh', '全国', '2023', 'DQR评分', '4', '', '光伏,绿电,电力', '适用于自发自用光伏电力', 'CPCD 2026版', '光伏发电', ''],
        ['', 'material_steel_eaf', '电炉再生钢材', '', '原材料', 'CO₂e', '', '0.67', 'kgCO₂e/kg', 'kg', '全国', '2024', 'DQR评分', '4', '', '钢材,电炉,废钢,再生钢', '全废钢电炉冶炼', '行业统计', '电炉', '再生']
      ]
      const csv = '\uFEFF' + [headers].concat(rows).map(r => r.map(this.csvEscape).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = '排放因子导入模板.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    },
    handleImportFile(e) {
      const file = e.target.files[0]
      if (!file) return
      const HEADER_MAP = {
        '因子编码': 'factorId', '活动标识': 'activityId', '因子名称': 'name', '英文原名': 'nameEn',
        '类别': 'category', '气体口径': 'gasType', '强度口径': 'intensityType', '因子值': 'value',
        '因子单位': 'factorUnit', '活动数据单位': 'activityUnit', '适用地区': 'region', '年份': 'year',
        '质量表征类型': 'qualityType', 'DQR评分': 'dqr', '不确定度': 'uncertainty',
        '匹配关键词': 'tags', '技术适用条件': 'techInfo', '出处': 'citation',
        '技术路线': 'techRoute', '材料属性': 'materialOrigin'
      }
      const reader = new FileReader()
      reader.onload = (ev) => {
        const rows = this.parseCSV(ev.target.result)
        if (rows.length < 2) {
          this.$message.warning('文件为空或只有表头行')
          return
        }
        const colIdx = {}
        rows[0].forEach((h, i) => {
          const key = HEADER_MAP[String(h).trim()]
          if (key !== undefined && colIdx[key] === undefined) colIdx[key] = i
        })
        if (colIdx.name === undefined) {
          this.$message.warning('未识别到「因子名称」列，请使用标准模板（可点击下载导入模板）')
          return
        }
        const parsed = []
        const errors = []
        const existingIds = new Set(this.currentDb.factors.map(f => f.factorId))
        for (let r = 1; r < rows.length; r++) {
          const cells = rows[r]
          if (!cells || cells.every(c => !String(c).trim())) continue
          const get = k => (colIdx[k] !== undefined ? String(cells[colIdx[k]] == null ? '' : cells[colIdx[k]]).trim() : '')
          const preFilled = []
          // 智能体预填：活动数据单位（因子单位分母反推，空值时兜底）
          let activityUnitVal = get('activityUnit')
          if (!activityUnitVal) {
            activityUnitVal = this.inferActivityUnit(get('factorUnit'))
            if (activityUnitVal) preFilled.push('活动单位')
          }
          // 智能预填：类别（空时按名称推断）
          let categoryVal = get('category')
          if (!categoryVal) {
            categoryVal = this.inferCategory(get('name'))
            if (categoryVal) preFilled.push('类别')
          }
          // 智能预填：强度口径（空时按名称推断）
          let intensityTypeVal = get('intensityType')
          if (!intensityTypeVal) {
            intensityTypeVal = this.inferIntensityType(get('name'))
            if (intensityTypeVal) preFilled.push('强度口径')
          }
          const miss = []
          if (!get('name')) miss.push('因子名称')
          if (!get('value')) miss.push('因子值')
          if (!get('factorUnit')) miss.push('因子单位')
          if (!activityUnitVal) miss.push('活动数据单位')
          let qType = get('qualityType') || 'DQR评分'
          // 智能预填：质量表征（库级默认，国家库→官方权威；仅当未显式填写且无DQR数值时）
          if (get('qualityType') && get('qualityType') !== 'DQR评分' && get('qualityType') !== '不确定度' && get('qualityType') !== '官方权威') {
            qType = get('qualityType') // 保留未知值交给质量校验
          } else if (!get('qualityType') && this.currentDb && this.currentDb.id === 'NATIONAL-GEF') {
            qType = '官方权威'
            preFilled.push('质量表征')
          }
          let qualityBad = false
          if (qType === 'DQR评分' && !(parseFloat(get('dqr')) > 0)) qualityBad = true
          if (qType === '不确定度' && !get('uncertainty')) qualityBad = true
          const fid = get('factorId')
          // 气体口径与单位交叉校验：显式填写>单位解析>默认CO₂e；显式值与单位矛盾则报错
          const unitParsed = this.parseGasType(get('factorUnit'))
          const explicitGasRaw = get('gasType')
          const explicitGas = explicitGasRaw ? (this.parseGasType(explicitGasRaw) || explicitGasRaw) : ''
          let gasType = 'CO₂e'
          let gasConflict = false
          if (explicitGas) {
            gasType = explicitGas
            if (unitParsed && unitParsed !== explicitGas) gasConflict = true
          } else if (unitParsed) {
            gasType = unitParsed
          }
          if (miss.length) {
            errors.push({ rowNo: r + 1, reason: '缺少必填：' + miss.join('、') })
            continue
          }
          if (gasConflict) {
            errors.push({ rowNo: r + 1, reason: '气体口径与单位矛盾：单位分子为' + unitParsed + '，填写的口径为' + explicitGas })
            continue
          }
          if (qualityBad) {
            errors.push({ rowNo: r + 1, reason: '质量表征类型与数值不匹配（' + qType + '）' })
            continue
          }
          if (fid && existingIds.has(fid)) {
            errors.push({ rowNo: r + 1, reason: '因子编码 ' + fid + ' 已存在' })
            continue
          }
          const factor = {
            factorId: fid || null,
            name: get('name'), category: categoryVal || '能源', gasType: gasType,
            value: get('value'), factorUnit: get('factorUnit'), activityUnit: activityUnitVal,
            region: this.normalizeRegion(get('region')) || '全国', year: get('year') || String(new Date().getFullYear()),
            tags: get('tags').split(/[,，]/).map(t => t.trim()).filter(Boolean)
          }
          // 地区归一提示（写法被标准化时记录）
          if (get('region') && factor.region !== get('region')) preFilled.push('地区归一')
          if (fid) existingIds.add(fid)
          if (get('activityId')) factor.activityId = get('activityId')
          if (get('nameEn')) factor.nameEn = get('nameEn')
          if (intensityTypeVal) factor.intensityType = intensityTypeVal
          if (get('techInfo')) factor.techInfo = get('techInfo')
          if (get('citation')) factor.citation = get('citation')
          // 技术路线/材料属性：显式列优先，空值时智能体推断
          if (get('techRoute')) factor.techRoute = get('techRoute')
          else {
            const tr = this.inferTechRoute(factor.name)
            if (tr) { factor.techRoute = tr; preFilled.push('技术路线') }
          }
          if (get('materialOrigin')) factor.materialOrigin = get('materialOrigin')
          else {
            const mo = this.inferMaterialOrigin(factor.name)
            if (mo) { factor.materialOrigin = mo; preFilled.push('材料属性') }
          }
          if (qType === '官方权威') factor.authoritative = true
          else if (qType === '不确定度') factor.uncertainty = get('uncertainty')
          else factor.dqr = Math.min(5, Math.max(1, parseFloat(get('dqr')) || 4))
          // 智能体辅助标注：活动标识为空时自动建议（导入时人工在预览中确认）
          if (!factor.activityId) {
            const sug = this.suggestActivityId(factor.name, factor.category, factor.region)
            if (sug.length) { factor.suggestedActivityId = sug[0].id; preFilled.push('活动标识') }
          }
          // 智能体辅助标注：匹配关键词为空时自动建议（词表命中+同活动复用）
          if (!factor.tags.length) {
            const aidForTags = factor.activityId || factor.suggestedActivityId
            const sugTags = this.suggestTags(factor.name, factor.category, factor.region, aidForTags)
            if (sugTags.length) { factor.tags = sugTags; preFilled.push('匹配关键词') }
          }
          factor.preFilled = preFilled
          parsed.push(factor)
        }
        this.importFileName = file.name
        this.importRows = parsed
        this.importErrors = errors
        this.importStep = 2
      }
      reader.readAsText(file, 'UTF-8')
    },
    doImport() {
      this.importRows.forEach(f => {
        if (!f.factorId) f.factorId = this.genFactorId(this.currentDb, f.category)
        if (!f.activityId && f.suggestedActivityId) f.activityId = f.suggestedActivityId
        delete f.suggestedActivityId
        delete f.preFilled
        this.currentDb.factors.push(f)
      })
      this.currentDb.factorCount = this.currentDb.factors.length
      this.persistDatabases()
      this.$message.success('成功导入 ' + this.importRows.length + ' 条因子')
      this.resetImport()
      this.showImportDialog = false
    },
    resetImport() {
      this.importStep = 1
      this.importFileName = ''
      this.importRows = []
      this.importErrors = []
      if (this.$refs.importFileInput) this.$refs.importFileInput.value = ''
    }
  },
  mounted() {
    this.loadDatabases()
  }
}
</script>

<style scoped>
.ef-library-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.page-header { margin-bottom: 20px; flex-shrink: 0; }
.page-title { font-size: 20px; color: #303133; margin: 0 0 6px 0; }
.page-title i { color: #0067FE; }
.page-desc { font-size: 13px; color: #909399; margin: 0; }
.stats-row { display: flex; gap: 16px; margin-bottom: 16px; flex-shrink: 0; }
.stat-card {
  flex: 1; background: #fff; border-radius: 8px; padding: 16px 20px;
  border: 1px solid #ebeef5; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.stat-num { font-size: 28px; font-weight: 700; color: #303133; }
.stat-label { font-size: 12px; color: #909399; margin-top: 4px; }
.stat-green .stat-num { color: #67C23A; }
.stat-blue .stat-num { color: #409EFF; }
.stat-orange .stat-num { color: #E6A23C; }
.toolbar { display: flex; align-items: center; margin-bottom: 12px; flex-shrink: 0; }
.btn-danger { color: #f56c6c; }
.btn-danger:hover { color: #f78989; }
.ef-value { font-weight: 600; color: #0067FE; }
.ef-unit { font-size: 11px; color: #909399; }
.code-font { font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; color: #909399; }

/* 第二层详情页头 */
.db-detail-header {
  display: flex; align-items: center; gap: 16px;
  margin-bottom: 16px; padding: 16px 20px;
  background: #fff; border-radius: 8px; border: 1px solid #ebeef5;
  flex-shrink: 0;
}
.db-info { display: flex; align-items: center; gap: 12px; }
.db-name { font-size: 18px; font-weight: 600; color: #303133; }
.db-meta { display: flex; align-items: center; margin-top: 4px; }
.db-format-desc {
  margin-top: 6px; font-size: 12px; color: #67C23A; line-height: 1.5;
}
.db-format-desc i { margin-right: 4px; }

/* 行展开：匹配档案 */
.factor-profile { padding: 4px 12px 8px; }
.fp-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 24px; margin-bottom: 10px;
}
.fp-item { display: flex; align-items: baseline; gap: 8px; font-size: 12px; }
.fp-item label { color: #909399; white-space: nowrap; min-width: 84px; }
.fp-item span { color: #303133; font-weight: 500; }
.fp-tags { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.fp-tags label { font-size: 12px; color: #909399; margin-right: 4px; }
.fp-tag { margin-right: 2px; }
.fp-en { font-size: 12px; color: #909399; font-style: italic; }
.fp-unc { font-size: 12px; color: #909399; font-family: 'Consolas', 'Monaco', monospace; }

/* 数据质量三态 */
.q-dqr { display: flex; align-items: center; gap: 6px; justify-content: center; }
/* 表单智能体预填提示条 */
.prefill-bar {
  display: flex; align-items: center; gap: 8px; background: #f0f9eb;
  border: 1px solid #e1f3d8; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px;
  font-size: 12px; color: #67C23A; line-height: 1.5;
}
.prefill-bar i { color: #00A8A0; flex-shrink: 0; }
.prefill-bar span { flex: 1; }

/* 批量导入 */
.import-zone { padding: 4px 0; }
.import-tip {
  display: flex; align-items: flex-start; gap: 8px; background: #f0f7ff;
  border-radius: 8px; padding: 10px 12px; margin-bottom: 14px;
  font-size: 12.5px; color: #606266; line-height: 1.7;
}
.import-tip i { color: #0067FE; margin-top: 3px; flex-shrink: 0; }
.import-drop {
  border: 2px dashed #dcdfe6; border-radius: 10px; padding: 34px 20px;
  text-align: center; cursor: pointer; transition: all 0.25s; background: #fafbfc;
}
.import-drop:hover { border-color: #0067FE; background: rgba(0,103,254,0.04); }
.import-drop i { font-size: 36px; color: #c0c4cc; margin-bottom: 8px; }
.import-drop:hover i { color: #0067FE; }
.import-drop-text { font-size: 13px; color: #606266; margin-bottom: 4px; }
.import-drop-hint { font-size: 11px; color: #94a3b8; }
.import-preview { padding: 0; }
.import-more { font-size: 12px; color: #909399; padding: 6px 0; }
.import-errors { margin-top: 10px; padding: 8px 12px; background: #fef0f0; border-radius: 6px; }
.import-errors-title { font-size: 12.5px; color: #F56C6C; font-weight: 600; margin-bottom: 4px; }
.import-error-row { font-size: 12px; color: #909399; line-height: 1.8; }
/* 智能体活动标识建议 */
.aid-pop { padding: 4px; }
.aid-pop-title { font-size: 12.5px; color: #0067FE; font-weight: 600; padding: 4px 8px 8px; }
.aid-cand {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 6px 8px; border-radius: 4px; cursor: pointer; transition: background 0.15s;
}
.aid-cand:hover { background: rgba(0,103,254,0.06); }
.aid-empty { font-size: 12px; color: #C0C4CC; text-align: center; padding: 12px; }
.aid-sug { color: #00A8A0; }
.q-num { font-size: 12px; font-weight: 700; color: #0067FE; font-family: 'Consolas', monospace; }
.q-bar { width: 40px; height: 5px; border-radius: 3px; background: #ebeef5; overflow: hidden; }
.q-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #67C23A, #0067FE); }

/* 表格区 */
.table-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-card);
}
.table-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}
.table-title-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
}
.table-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 4px 4px 0 4px;
}
/* 因子库详情视图：因子表格滚动容器 */
.detail-table-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-card);
  padding: 4px 4px 0 4px;
}
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-muted);
}
.empty-state i { font-size: 48px; margin-bottom: 12px; color: var(--text-placeholder); }
.empty-state p { font-size: 14px; margin: 0 0 4px; }
.empty-state span { font-size: 12px; }
</style>
