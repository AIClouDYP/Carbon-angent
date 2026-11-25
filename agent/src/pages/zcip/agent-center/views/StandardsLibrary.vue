<template>
  <div class="standards-library-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title"><i class="el-icon-collection"></i> 政策标准库</h2>
        <p class="page-desc">覆盖产品碳足迹、组织碳核算、产品环境足迹、园区碳核算、碳市场管控等全碳核算场景的标准法规库</p>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="toolbar">
      <el-input placeholder="搜索编号/文号、名称..." prefix-icon="el-icon-search" size="small" v-model="searchText" clearable style="width: 260px;"></el-input>
      <el-select v-model="filterType" placeholder="类型" size="small" clearable style="width: 150px; margin-left: 8px;">
        <el-option label="国际标准" value="国际标准"></el-option>
        <el-option label="国家标准" value="国家标准"></el-option>
        <el-option label="行业标准" value="行业标准"></el-option>
        <el-option label="规范/指南" value="规范/指南"></el-option>
        <el-option label="政策文件" value="政策文件"></el-option>
      </el-select>
      <el-button size="small" icon="el-icon-refresh-left" style="margin-left: 8px;" :disabled="!searchText && !filterType" @click="resetFilters">重置</el-button>
    </div>

    <!-- 标准列表表格 -->
    <div class="table-wrapper">
      <div class="table-title-bar">
        <span class="table-title-text">标准列表</span>
        <div style="display:flex;align-items:center;">
          <span class="sync-source-hint" style="font-size:12px;color:#8c8c8c;margin-right:12px;">
            政策文件来源：政策采集与发布 · 上次同步 {{ lastSyncTime || '—' }}
          </span>
          <el-button size="small" icon="el-icon-refresh" :loading="syncing" @click="syncPolicies">同步政策</el-button>
          <el-button size="small" icon="el-icon-document" @click="showSyncRecords = true">同步记录</el-button>
          <el-button type="primary" size="small" icon="el-icon-upload2" style="margin-left:8px;" @click="showUploadDialog = true">上传解析标准</el-button>
        </div>
      </div>
      <div class="table-scroll">
    <el-table :data="pagedStandards" border stripe size="small" style="width: 100%;" v-loading="tableLoading" element-loading-text="加载中..." :header-cell-style="headerCellStyle">
      <el-table-column type="index" label="序号" width="60" align="center" :index="indexMethod"></el-table-column>
      <el-table-column label="编号/文号" prop="code" width="170">
        <template slot-scope="{ row }">
          <span class="code-font">{{ row.code }}</span>
        </template>
      </el-table-column>
      <el-table-column label="名称" prop="name" min-width="320" show-overflow-tooltip></el-table-column>
      <el-table-column label="类型" prop="type" width="110" align="center">
        <template slot-scope="{ row }">
          <el-tag size="mini" :type="typeTagType(row.type)">{{ row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布机构" prop="issuer" width="170" show-overflow-tooltip></el-table-column>
      <el-table-column label="发布年份" prop="year" width="90" align="center"></el-table-column>
      <el-table-column label="状态" prop="status" width="80" align="center">
        <template slot-scope="{ row }">
          <el-tag size="mini" :type="row.status === '现行' ? 'success' : 'info'">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="业务场景" width="130" align="center">
        <template slot-scope="{ row }">
          <template v-if="(row.scenarios && row.scenarios.length)">
            <el-tag v-for="sc in row.scenarios" :key="sc" size="mini" type="warning" effect="plain" style="margin:1px;">{{ scenarioLabel(sc) }}</el-tag>
          </template>
          <span v-else></span>
        </template>
      </el-table-column>
      <el-table-column label="版本" prop="version" width="80" align="center">
        <template slot-scope="{ row }">
          <span>{{ row.version || '' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="解析状态" width="100" align="center">
        <template slot-scope="{ row }">
          <el-tag size="mini" :type="row.structured ? 'success' : 'info'">{{ row.structured ? '解析完成' : '未解析' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="生效状态" width="100" align="center">
        <template slot-scope="{ row }">
          <el-tag size="mini" :type="parseStatusTagType(row.parseStatus)">{{ parseStatusText(row.parseStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template slot-scope="{ row }">
          <el-button type="text" size="mini" class="btn-drill" @click="openDetail(row)">详情</el-button>
          <el-button type="text" size="mini" @click="editStandard(row)">编辑</el-button>
          <el-button type="text" size="mini" class="btn-danger" @click="deleteStandard(row)">删除</el-button>
        </template>
      </el-table-column>
      <!-- 空状态 -->
      <template slot="empty">
        <div class="table-empty">
          <i class="el-icon-folder-opened"></i>
          <p>{{ searchText || filterType ? '未找到匹配的标准' : '暂无标准数据' }}</p>
          <el-button v-if="searchText || filterType" size="mini" @click="resetFilters">清空筛选</el-button>
        </div>
      </template>
    </el-table>
      </div>
    <!-- 分页 -->
    <div class="pagination-bar">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredStandards.length"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :current-page.sync="currentPage"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      ></el-pagination>
    </div>
    </div>

    <!-- 详情弹窗 -->

    <!-- 上传解析标准对话框（智能体引导入库） -->
    <el-dialog
      title="上传新核算标准"
      :visible.sync="showUploadDialog"
      width="560px"
      custom-class="std-upload-dialog"
      :close-on-click-modal="false"
      @close="resetUpload"
    >
      <!-- 步骤条 -->
      <div class="std-steps">
        <div :class="['std-step', { 'step-active': parseStep === 0, 'step-done': parseStep > 0 }]">
          <div class="std-step-dot">1</div><span>上传文件</span>
        </div>
        <div class="std-step-line"></div>
        <div :class="['std-step', { 'step-active': parseStep === 1, 'step-done': parseStep > 1 }]">
          <div class="std-step-dot">2</div><span>智能解析</span>
        </div>
        <div class="std-step-line"></div>
        <div :class="['std-step', { 'step-active': parseStep === 2, 'step-done': parseStep > 2 }]">
          <div class="std-step-dot">3</div><span>提交审核</span>
        </div>
      </div>

      <!-- 步骤1：上传文件 -->
      <div v-if="parseStep === 0" class="std-upload-zone">
        <div class="std-agent-tip">
          <i class="el-icon-cpu"></i>
          <span>请上传标准文件（PDF / Word）。前端原型按「标准解析 Skill」规范执行模拟解析，生成待人工核对的草稿。</span>
        </div>
        <div class="std-drop-zone"
          :class="{ 'drop-active': isDragOver }"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="handleFileDrop"
          @click="triggerFileInput">
          <input type="file" ref="fileInput" accept=".pdf,.doc,.docx" multiple style="display:none" @change="handleFileSelect" />
          <i class="el-icon-upload std-drop-icon"></i>
          <div class="std-drop-text">点击选择文件，或拖拽主文件与附件到此处</div>
          <div class="std-drop-hint">支持 .pdf / .doc / .docx；首个文件默认为主文件，单文件不超过 20MB</div>
        </div>
        <div v-for="(item, index) in uploadFiles" :key="item.file.name + '-' + index" class="std-file-card" :class="{ 'is-main': item.role === 'main' }">
          <i class="el-icon-document std-file-icon"></i>
          <div class="std-file-info">
            <div class="std-file-name">
              {{ item.file.name }}
              <el-tag size="mini" :type="item.role === 'main' ? 'primary' : 'info'" effect="plain">{{ item.role === 'main' ? '主文件' : '附件' }}</el-tag>
            </div>
            <div class="std-file-size">{{ formatFileSize(item.file.size) }}</div>
          </div>
          <el-button v-if="item.role !== 'main'" type="text" size="mini" @click.stop="setMainFile(item)">设为主文件</el-button>
          <i class="el-icon-close std-file-remove" @click.stop="removeFile(item)"></i>
        </div>
      </div>

      <!-- 步骤2：智能解析中 -->
      <div v-if="parseStep === 1" class="std-parsing-zone">
        <div class="std-parse-task" v-for="(task, i) in parseTasks" :key="i"
          :class="{ 'task-done': task.done, 'task-running': task.running }">
          <i :class="task.done ? 'el-icon-circle-check' : (task.running ? 'el-icon-loading' : 'el-icon-time')"></i>
          <span>{{ task.label }}</span>
          <span v-if="task.done && task.result" class="task-result">{{ task.result }}</span>
        </div>
      </div>

      <!-- 步骤3：确认解析结果 -->
      <div v-if="parseStep === 2" class="std-confirm-zone">
        <div class="std-agent-tip success">
          <i class="el-icon-circle-check"></i>
          <span>解析完成！请确认以下标准信息，可手动修正后提交——入库后进入「待人工审核」状态，审核通过方对智能体生效。</span>
        </div>
        <el-form label-width="90px" size="small" class="std-confirm-form">
          <el-form-item label="编号/文号" required>
            <el-input v-model="parsedStd.code" placeholder="如 ISO 14067:2018"></el-input>
          </el-form-item>
          <el-form-item label="名称" required>
            <el-input v-model="parsedStd.name" placeholder="标准全称"></el-input>
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="parsedStd.type" style="width:100%">
              <el-option label="国际标准" value="国际标准"></el-option>
              <el-option label="国家标准" value="国家标准"></el-option>
              <el-option label="行业标准" value="行业标准"></el-option>
              <el-option label="规范/指南" value="规范/指南"></el-option>
              <el-option label="政策文件" value="政策文件"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="发布机构">
            <el-input v-model="parsedStd.issuer" placeholder="如 ISO / 国家市场监督管理总局"></el-input>
          </el-form-item>
          <el-form-item label="发布年份">
            <el-input v-model="parsedStd.year" placeholder="如 2024"></el-input>
          </el-form-item>
          <el-form-item label="业务场景" required>
            <el-select v-model="parsedStd.scenarios" multiple style="width:100%" placeholder="选择该标准适用的核算场景（决定解析模板）" @change="onParseScenariosChange">
              <el-option v-for="sc in scenarioEnum" :key="sc.key" :label="sc.label" :value="sc.key"></el-option>
            </el-select>
            <div v-if="parsedStd.scenarios && parsedStd.scenarios.length" class="std-parse-hint" style="margin-top:4px;color:#909399;font-size:12px;">
              已按「标准解析 Skill」的 {{ parsedStd.scenarios.join(' / ') }} 分组模板生成草稿，请在标准详情页逐项核对
            </div>
          </el-form-item>
          <el-form-item label="简介">
            <el-input type="textarea" :rows="3" v-model="parsedStd.desc" placeholder="标准内容简介"></el-input>
          </el-form-item>
        </el-form>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button v-if="parseStep === 2" @click="parseStep = 0; resetUpload()">重新上传</el-button>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button v-if="parseStep === 0" type="primary" :disabled="!uploadFiles.length" @click="startParse">开始解析</el-button>
        <el-button v-if="parseStep === 2" type="primary" @click="confirmImport">提交待审核</el-button>
      </span>
    </el-dialog>

    <!-- 编辑标准对话框 -->
    <el-dialog
      title="编辑核算标准"
      :visible.sync="showEditDialog"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form v-if="editingStd" label-width="90px" size="small">
        <el-form-item label="编号/文号" required>
          <el-input v-model="editingStd.code" placeholder="如 ISO 14067:2018"></el-input>
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="editingStd.name" placeholder="标准全称"></el-input>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="editingStd.type" style="width:100%">
            <el-option label="国际标准" value="国际标准"></el-option>
            <el-option label="国家标准" value="国家标准"></el-option>
            <el-option label="行业标准" value="行业标准"></el-option>
            <el-option label="规范/指南" value="规范/指南"></el-option>
            <el-option label="政策文件" value="政策文件"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="发布机构">
          <el-input v-model="editingStd.issuer" placeholder="如 ISO / 国家市场监督管理总局"></el-input>
        </el-form-item>
        <el-form-item label="发布年份">
          <el-input v-model="editingStd.year" placeholder="如 2024"></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="editingStd.status">
            <el-radio label="现行">现行</el-radio>
            <el-radio label="废止">废止</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="业务场景">
          <el-select v-model="editingStd.scenarios" multiple style="width:100%">
            <el-option v-for="sc in scenarioEnum" :key="sc.key" :label="sc.label" :value="sc.key"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="版本">
          <el-input v-model="editingStd.version" placeholder="系统配置版本，如 V1 / V2"></el-input>
        </el-form-item>
        <el-form-item label="简介">
          <el-input type="textarea" :rows="3" v-model="editingStd.desc" placeholder="标准内容简介"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showEditDialog = false; editingStd = null">取消</el-button>
        <el-button type="primary" @click="saveEditStandard">保存</el-button>
      </span>
    </el-dialog>

    <!-- 同步记录 -->
    <el-dialog title="同步记录" :visible.sync="showSyncRecords" width="720px" append-to-body>
      <el-table :data="syncRecords" border size="small" empty-text="暂无同步记录">
        <el-table-column prop="time" label="同步时间" width="170" align="center"></el-table-column>
        <el-table-column prop="type" label="类型" width="100" align="center"></el-table-column>
        <el-table-column prop="total" label="拉取" width="70" align="center"></el-table-column>
        <el-table-column label="新增" width="70" align="center">
          <template slot-scope="{ row }"><span style="color:#52c41a;">{{ row.added }}</span></template>
        </el-table-column>
        <el-table-column label="更新" width="70" align="center">
          <template slot-scope="{ row }"><span style="color:#1890ff;">{{ row.updated }}</span></template>
        </el-table-column>
        <el-table-column label="废止" width="70" align="center">
          <template slot-scope="{ row }"><span style="color:#ff4d4f;">{{ row.abolished }}</span></template>
        </el-table-column>
        <el-table-column prop="status" label="结果" width="80" align="center"></el-table-column>
      </el-table>
      <div style="margin-top:12px;font-size:12px;color:#8c8c8c;">
        说明：同步仅更新政策文件的上游字段（编号/名称/机构/年份/简介/状态），不覆盖本模块已维护的业务场景与结构化配置。
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showSyncRecords = false">关闭</el-button>
        <el-button type="primary" :loading="syncing" @click="syncPolicies">立即同步</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  SCENARIOS, ensureSeed, loadStandards, makePcfSkeleton, makePolicySkeleton,
  makeGenericAccountingSkeleton, validateParams, validateIndicatorsWeight,
  // 智慧报告场景的内置标准：数据源在服务层（唯一来源），此处仅作别名，
  // 保证「标准库管理页」与「智慧报告智能体」读到同一份种子，且 ensureSeed 可统一入库。
  REPORT_SEEDS as EXTRA_STANDARDS
} from '@/utils/policyStandardService'
import { getGroupTemplate } from '@/pages/zcip/agent-center/data/skillGroupTemplates'
import { getSkillConfigById } from '@/pages/zcip/agent-center/data/skillPrompts'

export default {
  name: 'StandardsLibrary',
  data() {
    return {
      searchText: '',
      filterType: '',
      // ===== 分页 =====
      currentPage: 1,
      pageSize: 10,
      headerCellStyle: { background: 'var(--bg-hover, #f8fafc)', color: 'var(--text-primary, #0f172a)', fontWeight: 600, textAlign: 'center' },
      // ===== 表格状态 =====
      tableLoading: false,
      // ===== 政策同步（从「政策采集与发布」同步） =====
      syncing: false,
      lastSyncTime: '',
      showSyncRecords: false,
      syncRecords: [],
      // ===== 上传解析标准 =====
      showUploadDialog: false,
      parseStep: 0,
      uploadFiles: [],
      isDragOver: false,
      parseTasks: [],
      parsedStd: null,
      // ===== 编辑标准 =====
      showEditDialog: false,
      editingStd: null,
      // 业务场景枚举（R040201 STORY-005：与场景路由 7 场景对齐，多对多映射）
      scenarioEnum: SCENARIOS,
      standards: [
        // ===== 智慧报告场景（内置新增标准见模块常量 EXTRA_STANDARDS） =====
        ...EXTRA_STANDARDS,
        // ===== 产品碳足迹场景 =====
        { code: 'ISO 14067:2018', name: '温室气体 — 产品碳足迹 — 量化和声明指南', type: '国际标准', scope: '产品碳足迹', issuer: 'ISO', year: '2018', status: '现行', desc: '规定了产品碳足迹的量化方法和通报要求，基于LCA方法（ISO 14040/14044），涵盖从摇篮到坟墓的全生命周期GHG排放。' },
        { code: 'PAS 2050:2011', name: '商品和服务的生命周期温室气体排放评价规范', type: '规范/指南', scope: '产品碳足迹', issuer: 'BSI', year: '2011', status: '现行', desc: '全球首个产品碳足迹评估标准，规定了商品和服务在全生命周期内GHG排放的量化方法，是ISO 14067的前身。' },
        { code: 'GB/T 24067-2024', name: '温室气体 产品碳足迹 量化要求和指南', type: '国家标准', scope: '产品碳足迹', issuer: '国家市场监督管理总局', year: '2024', status: '现行', version: '2024版', parseStatus: 'effective', desc: '中国产品碳足迹核算的国家标准，等同采用ISO 14067:2018，规定了产品碳足迹量化的原则、方法和报告要求。',
          structured: { kind: 'accounting', dimensions: [
            { key: 'boundary', label: '核算边界', points: ['摇篮到坟墓全生命周期（含原材料获取/生产/分销/使用/报废）', '功能单位声明（如 1件产品 / 1km 运输）', '截断规则：舍弃阶段需论证其排放占比 <1%'] },
            { key: 'model', label: '核算模型', points: ['基于 LCA 四阶段框架（目标定义/清单/影响评估/解释）', 'BOM 驱动的过程树建模', '副产品分配优先物理分配，其次经济分配'] },
            { key: 'data', label: '数据要求', points: ['初级数据（现场实测）优先于次级数据', '数据质量评分 DQR 五维度（时间/地理/技术/完整性/可靠性）', '次要数据允许二手来源但须标注出处'] },
            { key: 'factor', label: '因子优先级', points: ['场地特定因子 > 行业平均 > 国家缺省 > 国际缺省', 'GWP 采用 IPCC AR6（100年）', '电力因子区分消费侧/生产侧口径'] },
            { key: 'validation', label: '校验规则', points: ['质量平衡校验（投入产出一致性）', '敏感性分析（关键参数±10%）', '不确定度评估（关键排放源）'] },
            { key: 'report', label: '报告要求', points: ['披露功能单位/系统边界/数据来源/分配方法', '三期数据（前年/去年/今年）对比', '第三方核查声明（适用时）'] }
          ] } },
        { code: 'QC/T 1248-2025', name: '汽车生命周期碳足迹核算方法和要求', type: '行业标准', scope: '产品碳足迹', issuer: '工业和信息化部', year: '2025', status: '现行', desc: '汽车行业产品碳足迹核算标准，规定了燃油汽车、电动汽车等从原材料获取到报废回收全生命周期的碳足迹核算方法。' },
        { code: 'GB/T 51366-2019', name: '建筑碳排放计算标准', type: '国家标准', scope: '产品碳足迹', issuer: '住房和城乡建设部', year: '2019', status: '现行', desc: '建筑行业碳排放计算标准，涵盖建材生产、运输、建造、运行、拆除等阶段。' },
        { code: 'IEC 63366:2023', name: '电工产品碳足迹评估方法', type: '国际标准', scope: '产品碳足迹', issuer: 'IEC', year: '2023', status: '现行', desc: '电工电子产品碳足迹评估的国际标准，适用于电气设备的全生命周期碳排放核算。' },
        // ===== 组织碳核算场景 =====
        { code: 'ISO 14064-1:2018', name: '温室气体 — 组织层面量化与报告', type: '国际标准', scope: '组织碳核算', issuer: 'ISO', year: '2018', status: '现行', desc: '规定了组织层面GHG排放量和移除量的量化和报告要求，覆盖范围1/2/3排放。' },
        { code: 'ISO 14064-3:2019', name: '温室气体 — 声明核查与验证', type: '国际标准', scope: '组织碳核算', issuer: 'ISO', year: '2019', status: '现行', desc: '规定了GHG声明的核查和验证过程的要求。' },
        { code: 'GB/T 32150-2015', name: '工业企业温室气体排放核算和报告通则', type: '国家标准', scope: '组织碳核算', issuer: '国家市场监督管理总局', year: '2015', status: '现行', desc: '中国组织级温室气体排放核算的基础标准，适用于工业企业温室气体排放的量化与报告。' },
        { code: 'GHG Protocol Corporate', name: '温室气体核算体系 — 企业核算与报告标准', type: '规范/指南', scope: '组织碳核算', issuer: 'WRI/WBCSD', year: '2004', status: '现行', desc: '全球最广泛使用的组织级GHG核算标准，定义了范围1/2/3排放的分类与核算方法。' },
        { code: 'ISO 14064-2:2019', name: '温室气体 — 项目层面量化与报告', type: '国际标准', scope: '组织碳核算', issuer: 'ISO', year: '2019', status: '现行', desc: '规定了项目层面GHG减排量或清除增加量的量化、监测和报告要求。' },
        // ===== 产品环境足迹场景 =====
        { code: 'EU PEF Methodology', name: '欧盟产品环境足迹方法论（PEF）', type: '国际标准', scope: '产品环境足迹', issuer: '欧盟委员会', year: '2021', status: '现行', desc: '欧盟产品环境足迹评估方法，包含16个环境影响类别（气候变化/水资源/酸化/富营养化/资源消耗等），是欧盟绿色新政的核心工具。' },
        { code: 'EU OEF Methodology', name: '欧盟组织环境足迹方法论（OEF）', type: '国际标准', scope: '产品环境足迹', issuer: '欧盟委员会', year: '2021', status: '现行', desc: '欧盟组织环境足迹评估方法，用于评估组织整体的环境影响，与PEF方法论配套使用。' },
        // ===== 园区碳核算场景 =====
        { code: '零碳园区碳排放核算方法（试行）', name: '零碳园区碳排放核算方法（试行）', type: '规范/指南', scope: '园区碳核算', issuer: '国家发展改革委/工业和信息化部/国家能源局', year: '2025', status: '现行', desc: '国家级零碳园区碳排放核算方法，规定了园区企业/公共配套/能源供应三维度碳排放核算边界、排放源识别与计算方法。' },
        { code: '国家级零碳园区建设指标体系（试行）', name: '国家级零碳园区建设指标体系（试行）', type: '政策文件', scope: '园区碳核算', issuer: '国家发展改革委/工业和信息化部/国家能源局', year: '2025', status: '现行', parseStatus: 'effective', desc: '国家级零碳园区建设评价指标体系，含可再生能源占比、碳排放强度等核心指标。' },
        { code: 'GB/T 39197-2020', name: '生态工业园区评价标准', type: '国家标准', scope: '园区碳核算', issuer: '国家市场监督管理总局', year: '2020', status: '现行', desc: '生态工业园区评价标准，规定了园区资源能源利用、污染控制、环境管理等方面的评价指标。' },
        { code: 'ISO 14001:2015', name: '环境管理体系 — 要求与使用指南', type: '国际标准', scope: '园区碳核算', issuer: 'ISO', year: '2015', status: '现行', desc: '环境管理体系国际标准，适用于园区及企业的环境管理体系建立与认证。' },
        // ===== 零碳工厂场景 =====
        { code: '国家级零碳工厂建设评估指标体系（试行）', name: '国家级零碳工厂建设评估指标体系及指标说明（试行）', type: '政策文件', scope: '园区碳核算', issuer: '工业和信息化部', year: '2026', status: '现行', version: '试行', parseStatus: 'effective', desc: '国家级零碳工厂建设评估指标体系，规定了零碳工厂的基本要求、申报条件、评估指标与碳排放核算方法。',
          structured: { kind: 'policy',
            applyConditions: ['制造型企业：独立法人、规上企业、能耗规模达标', '已列入绿色工厂名单（或达到绿色工厂评价要求）', '能耗水平达到行业能耗限额标准先进值/标杆水平', '算力设施：机架规模达标、GB 40879 能效 2 级、独立供配电制冷（1.3 算力设施不设核心指标基本要求）', '体系与承诺类条件由企业确认后自动校验', '负面清单：近三年无重大安全/环保/质量处罚'],
            indicators: [
              { name: '单位能耗碳排放', basic: '行业基本要求（见指标说明）', target: '行业目标要求（见指标说明）', caliber: 'C ÷ E₁（E₁ 含原料用能）' },
              { name: '非化石能源消费占比', basic: '行业基本要求（见指标说明）', target: '行业目标要求（见指标说明）', caliber: 'R = 非化石能源消费量 ÷ 能源消费总量（E₂ 不含原料用能）' },
              { name: '非化石能源电力消费物理认定量占比', basic: '行业基本要求（见指标说明）', target: '行业目标要求（见指标说明）', caliber: '物理认定绿电量 ÷ 总用电量（支持绿证 GEC / 绿电 PPA 认定）' }
            ],
            materialRequirements: ['营业执照与法人证明', '绿色工厂证明材料', '能源计量器具配备证明', '碳排放核算报告与数据来源凭证', '绿电/绿证交易凭证（适用时）'],
            mappings: [
              { indicator: '单位能耗碳排放', dataSource: '能源消耗台账 + 碳排放核算', factorCategory: '燃料燃烧因子 / 电力因子（消费侧）', formula: 'C ÷ E₁' },
              { indicator: '非化石能源消费占比', dataSource: '能源消费结构台账', factorCategory: '—（占比类指标）', formula: 'R = 非化石 ÷ 总量' },
              { indicator: '非化石能源电力消费物理认定量占比', dataSource: '电费结算单 + 绿证台账', factorCategory: '绿电因子（物理认定口径）', formula: '认定绿电量 ÷ 总用电量' }
            ] } },
        { code: '关于开展零碳工厂建设工作的指导意见', name: '关于开展零碳工厂建设工作的指导意见', type: '政策文件', scope: '园区碳核算', issuer: '工业和信息化部等五部门', year: '2026', status: '现行', parseStatus: 'effective', desc: '五部门联合印发的零碳工厂建设工作指导意见，明确了零碳工厂建设的总体要求与实施路径。' },
        // ===== 碳市场管控场景 =====
        { code: '全国碳排放权交易管理办法', name: '碳排放权交易管理办法（试行）', type: '规范/指南', scope: '碳市场管控', issuer: '生态环境部', year: '2021', status: '现行', desc: '全国碳排放权交易市场的管理办法，规定了重点排放单位纳入、配额分配、清缴、交易等规则。' },
        { code: '北京市企业CO₂核算和报告指南', name: '北京市企业（单位）二氧化碳核算和报告指南', type: '规范/指南', scope: '碳市场管控', issuer: '北京市生态环境局', year: '2024', status: '现行', desc: '北京市重点排放单位二氧化碳核算和报告的技术指南，规定了核算边界、排放源识别、活动数据获取、排放量计算等要求。' },
        { code: '北京碳排放权交易管理办法', name: '北京市碳排放权交易管理办法', type: '规范/指南', scope: '碳市场管控', issuer: '北京市生态环境局', year: '2014', status: '现行', desc: '北京市碳排放权交易管理办法，规定了北京市重点排放单位的碳排放报告、核查与配额管理。' },
        { code: 'EU ETS Directive', name: '欧盟排放交易体系指令（EU ETS）', type: '国际标准', scope: '碳市场管控', issuer: '欧盟委员会', year: '2003', status: '现行', desc: '欧盟排放交易体系指令，全球首个跨国碳排放交易机制，覆盖电力、工业、航空等行业。' },
        { code: 'CBAM Regulation', name: '欧盟碳边境调节机制（CBAM）条例', type: '国际标准', scope: '碳市场管控', issuer: '欧盟委员会', year: '2023', status: '现行', desc: '欧盟碳边境调节机制实施条例，规定了进口商品嵌入式碳排放的核算、申报与核查要求，覆盖钢铁、铝、水泥、化肥、电力、氢六类商品。' },
        // ===== LCA方法 =====
        { code: 'ISO 14040:2006', name: '环境管理 — 生命周期评估 — 原则与框架', type: '国际标准', scope: 'LCA方法', issuer: 'ISO', year: '2006', status: '现行', desc: 'LCA方法的根本性标准，定义了生命周期评估的原则、框架及四个阶段（目标与范围定义、清单分析、影响评估、解释）。' },
        { code: 'ISO 14044:2006', name: '环境管理 — 生命周期评估 — 要求与指南', type: '国际标准', scope: 'LCA方法', issuer: 'ISO', year: '2006', status: '现行', desc: 'ISO 14040的配套标准，提供了LCA的具体要求和技术指南，包括数据质量、分配方法、敏感性分析等。' },
        { code: 'GB/T 24040-2008', name: '环境管理 生命周期评价 原则与框架', type: '国家标准', scope: 'LCA方法', issuer: '国家市场监督管理总局', year: '2008', status: '现行', desc: '中国LCA基础标准，等同采用ISO 14040:2006。' },
        { code: 'GB/T 24044-2008', name: '环境管理 生命周期评价 要求与指南', type: '国家标准', scope: 'LCA方法', issuer: '国家市场监督管理总局', year: '2008', status: '现行', desc: '中国LCA技术要求标准，等同采用ISO 14044:2006。' },
        // ===== 通则/术语 =====
        { code: 'ISO 14050:2020', name: '环境管理 — 词汇', type: '国际标准', scope: '通则/术语', issuer: 'ISO', year: '2020', status: '现行', desc: '环境管理领域术语和定义的国际标准，统一了GHG、LCA、碳足迹等核心概念的定义。' },
        { code: 'GB/T 32151-2015', name: '温室气体排放核算与报告要求 术语', type: '国家标准', scope: '通则/术语', issuer: '国家市场监督管理总局', year: '2015', status: '现行', desc: '中国温室气体排放核算与报告领域的术语标准，规范了核算边界、排放源、活动数据等核心术语。' }
      ]
    }
  },
  computed: {
    filteredStandards() {
      return this.standards.filter(s => {
        const matchSearch = !this.searchText ||
          s.code.toLowerCase().includes(this.searchText.toLowerCase()) ||
          s.name.includes(this.searchText)
        const matchType = !this.filterType || s.type === this.filterType
        return matchSearch && matchType
      })
    },
    // 当前页数据
    pagedStandards() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.filteredStandards.slice(start, start + this.pageSize)
    }
  },
  watch: {
    // 筛选条件变化时重置到第一页
    searchText() { this.currentPage = 1 },
    filterType() { this.currentPage = 1 },
  },
  methods: {
    /**
     * 政策同步：从「政策采集与发布」拉取已发布政策
     * 演示版：模拟上游返回，按 sourceId / code 去重合并
     * 生产版：GET {POLICY_CENTER}/api/policies?status=published&updatedAfter=...
     */
    syncPolicies() {
      this.syncing = true
      const now = new Date()
      const ts = now.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')

      // 模拟上游已发布政策（生产环境由接口返回）
      const upstream = [
        {
          sourceId: 'POL-2026-001',
          code: '京环发〔2026〕7号',
          name: '北京市碳排放单位二氧化碳排放核算和报告要求',
          type: '政策文件',
          issuer: '北京市生态环境局',
          year: '2026',
          scenarios: ['BEIJING_CARBON'],
          desc: '规定北京市碳排放单位的核算边界、排放源、核算方法与报告要求'
        },
        {
          sourceId: 'POL-2025-014',
          code: '发改环资〔2025〕910号',
          name: '关于开展零碳园区建设的通知',
          type: '政策文件',
          issuer: '国家发展改革委、工业和信息化部、国家能源局',
          year: '2025',
          scenarios: ['PARK'],
          desc: '明确零碳园区建设的基本条件、指标体系与申报要求'
        }
      ]

      setTimeout(() => {
        let added = 0
        let updated = 0
        upstream.forEach(u => {
          const idx = this.standards.findIndex(s => s.sourceId === u.sourceId || s.code === u.code)
          if (idx === -1) {
            this.standards.push(Object.assign({}, u, {
              sourceSystem: 'policy-center',
              syncTime: ts,
              status: '现行',
              parseStatus: 'pending',
              version: 'V1'
            }))
            added++
          } else {
            // 已存在：仅更新上游字段，保留本模块加工成果（structured 等）
            const keep = this.standards[idx]
            this.standards.splice(idx, 1, Object.assign({}, keep, {
              code: u.code, name: u.name, type: u.type, issuer: u.issuer,
              year: u.year, desc: u.desc,
              sourceSystem: 'policy-center', syncTime: ts
            }))
            updated++
          }
        })

        localStorage.setItem('carbon-library-standards-v2', JSON.stringify(this.standards))
        this.lastSyncTime = ts
        this.syncRecords.unshift({
          time: ts,
          type: '增量同步',
          total: upstream.length,
          added,
          updated,
          abolished: 0,
          status: '成功'
        })
        this.syncing = false
        this.$message.success(`同步完成：新增 ${added} 条 / 更新 ${updated} 条 / 废止 0 条`)
      }, 1200)
    },

    typeTagType(type) {
      const map = { '国际标准': 'danger', '国家标准': 'success', '行业标准': 'warning', '规范/指南': 'info', '政策文件': '' }
      return map[type] || 'info'
    },
    // 跳转到独立详情页（code@version 唯一标识，详情页自行读取数据源）
    openDetail(row) {
      this.$router.push({
        path: '/agent-center/apps/standards-library/detail',
        query: { code: row.code, version: row.version || '' }
      })
    },
    // ===== 分页方法 =====
    handleSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
    },
    handlePageChange(page) {
      this.currentPage = page
    },
    // 序号（连续编号，跨页累加）
    indexMethod(index) {
      return (this.currentPage - 1) * this.pageSize + index + 1
    },
    // 清空筛选
    resetFilters() {
      this.searchText = ''
      this.filterType = ''
      this.currentPage = 1
    },
    // 编辑标准（运维人员可编辑所有标准；多版本并存下按行引用定位）
    editStandard(row) {
      this._editingRow = row
      this.editingStd = { ...row }
      this.showEditDialog = true
    },
    // 保存编辑
    saveEditStandard() {
      if (!this.editingStd.code || !this.editingStd.name) {
        this.$message.warning('编号和名称为必填项')
        return
      }
      const idx = this.standards.indexOf(this._editingRow)
      if (idx > -1) {
        this.$set(this.standards, idx, { ...this.editingStd })
        this.persistCustomStandards()
        this.$message.success('标准已更新')
      }
      this.showEditDialog = false
      this.editingStd = null
      this._editingRow = null
    },
    // 删除标准（运维人员可删除所有标准；按行引用定位，支持同编号多版本）
    deleteStandard(row) {
      this.$confirm(`确定删除标准「${row.code} ${row.name}」${row.version ? '（版本 ' + row.version + '）' : ''}吗？删除后不可恢复。`, '删除确认', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const idx = this.standards.indexOf(row)
        if (idx > -1) {
          this.standards.splice(idx, 1)
          this.persistCustomStandards()
          this.$message.success('标准已删除')
          // 删除后如果当前页无数据，回退一页
          if (this.pagedStandards.length === 0 && this.currentPage > 1) {
            this.currentPage--
          }
        }
      }).catch(() => {})
    },
    // ===== 上传解析方法 =====
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    handleFileSelect(e) {
      this.appendFiles(Array.from(e.target.files || []))
      if (this.$refs.fileInput) this.$refs.fileInput.value = ''
    },
    handleFileDrop(e) {
      this.isDragOver = false
      this.appendFiles(Array.from(e.dataTransfer.files || []))
    },
    appendFiles(files) {
      const validExts = ['pdf', 'doc', 'docx']
      files.forEach(file => {
        const ext = file.name.split('.').pop().toLowerCase()
        if (!validExts.includes(ext)) {
          this.$message.warning(`「${file.name}」仅支持 PDF / Word 格式`)
          return
        }
        if (file.size > 20 * 1024 * 1024) {
          this.$message.warning(`「${file.name}」不能超过 20MB`)
          return
        }
        if (this.uploadFiles.some(item => item.file.name === file.name && item.file.size === file.size)) return
        const role = this.uploadFiles.length === 0 ? 'main' : 'attachment'
        this.uploadFiles.push({ file, role })
      })
    },
    setMainFile(item) {
      this.uploadFiles.forEach(file => { file.role = file === item ? 'main' : 'attachment' })
    },
    removeFile(item) {
      this.uploadFiles = this.uploadFiles.filter(file => file !== item)
      if (this.uploadFiles.length && !this.uploadFiles.some(file => file.role === 'main')) {
        this.uploadFiles[0].role = 'main'
      }
      if (!this.uploadFiles.length && this.$refs.fileInput) this.$refs.fileInput.value = ''
    },
    mainFile() {
      const item = this.uploadFiles.find(file => file.role === 'main')
      return item ? item.file : null
    },
    formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    },
    startParse() {
      if (!this.mainFile()) return
      this.parseStep = 1
      this.parseTasks = [
        { label: '文档读取与版式解析', done: false, running: true, result: '' },
        { label: '标准解析 Skill · 知识分组与条款抽取', done: false, running: false, result: '' },
        { label: '标准解析 Skill · 公式参数与计算规则', done: false, running: false, result: '' },
        { label: '标准解析 Skill · 报告模板字段', done: false, running: false, result: '' },
        { label: '解析结果映射与草稿生成', done: false, running: false, result: '' }
      ]
      this.runParseTask(0)
    },
    runParseTask(index) {
      if (index >= this.parseTasks.length) {
        this.parseStep = 2
        return
      }
      setTimeout(() => {
        this.$set(this.parseTasks[index], 'done', true)
        this.$set(this.parseTasks[index], 'running', false)
        if (index === 4) {
          const parseOk = this.runSkillParse()
          if (!parseOk) return
        }
        const results = [
          `已解析 ${this.uploadFiles.length} 个文件 · ${Math.round(this.uploadFiles.reduce((total, item) => total + item.file.size, 0) / 1024)}KB`,
          this.parsedStd ? this.parsedStd.structured.dimensions.length + ' 个知识分组' : '',
          this.parsedStd && this.parsedStd.structured.formulas
            ? this.parsedStd.structured.formulas.length + ' 个公式 · ' + this.parsedStd.structured.parameters.length + ' 个参数'
            : '按场景模板生成计算资产',
          this.parsedStd ? this.parsedStd.structured.reportTemplate.sections.length + ' 个模板章节' : '',
          this.parsedStd ? (this.parsedStd.code + ' · ' + this.parsedStd.type) : ''
        ]
        this.$set(this.parseTasks[index], 'result', results[index])
        if (index + 1 < this.parseTasks.length) {
          this.$set(this.parseTasks[index + 1], 'running', true)
        }
        this.runParseTask(index + 1)
      }, 600 + Math.random() * 500)
    },
    // 前端原型无法接入大模型：以「标准解析 Skill」为规范，用规则化模拟器生成同构草稿。
    // 后续接真实模型时，只需把 runSkillParse 换成服务调用，并保留本映射层。
    runSkillParse() {
      const skillConfig = getSkillConfigById('standard-parsing')
      const mainFile = this.mainFile()
      const fileName = mainFile.name.toLowerCase()
      // 政策类文件识别（申报政策/管理办法/通知/指导意见）
      const isPolicy = ['零碳工厂', '指标体系', '指导意见', '管理办法', '通知', '建设方案'].some(k => fileName.includes(k))
      let info = { code: 'CUSTOM-STD', name: '', type: isPolicy ? '政策文件' : '规范/指南', scope: isPolicy ? '园区碳核算' : '产品碳足迹', issuer: '', year: String(new Date().getFullYear()), desc: '' }
      if (fileName.includes('cbam')) {
        info = { code: 'EU CBAM', name: '欧盟碳边境调节机制（CBAM）嵌入式排放核算规则', type: '国际标准', scope: '产品碳足迹', issuer: '欧盟委员会', year: '2023', desc: '欧盟碳边境调节机制实施细则，规定了进口商品嵌入式碳排放的核算方法、申报流程与核查要求，覆盖钢铁、铝、水泥、化肥、电力、氢六类商品。' }
      } else if (fileName.includes('14067')) {
        info = { code: 'ISO 14067:2018', name: '温室气体 — 产品碳足迹 — 量化和声明指南', type: '国际标准', scope: '产品碳足迹', issuer: 'ISO', year: '2018', desc: '规定了产品碳足迹的量化方法和通报要求，基于LCA方法，涵盖从摇篮到坟墓的全生命周期GHG排放。' }
      } else if (fileName.includes('14064')) {
        info = { code: 'ISO 14064-1:2018', name: '温室气体 — 组织层面量化与报告', type: '国际标准', scope: '组织碳核算', issuer: 'ISO', year: '2018', desc: '规定了组织层面GHG排放量和移除量的量化和报告要求。' }
      } else if (fileName.includes('14044')) {
        info = { code: 'ISO 14044:2006', name: '环境管理 — 生命周期评估 — 要求与指南', type: '国际标准', scope: 'LCA方法', issuer: 'ISO', year: '2006', desc: 'ISO 14040的配套标准，提供了LCA的具体要求和技术指南。' }
      } else if (fileName.includes('2050')) {
        info = { code: 'PAS 2050:2011', name: '商品和服务的生命周期温室气体排放评价规范', type: '规范/指南', scope: '产品碳足迹', issuer: 'BSI', year: '2011', desc: '全球首个产品碳足迹评估标准，是ISO 14067的前身。' }
      } else if (fileName.includes('24067')) {
        info = { code: 'GB/T 24067-2024', name: '温室气体 产品碳足迹 量化要求和指南', type: '国家标准', scope: '产品碳足迹', issuer: '国家市场监督管理总局', year: '2024', desc: '中国产品碳足迹核算的国家标准，等同采用ISO 14067:2018。' }
      } else if (fileName.includes('pef')) {
        info = { code: 'EU PEF', name: '欧盟产品环境足迹方法论（PEF）', type: '国际标准', scope: '产品碳足迹', issuer: '欧盟委员会', year: '2021', desc: '欧盟产品环境足迹评估方法，包含16个环境影响类别，是欧盟绿色新政的核心工具。' }
      } else {
        const match = mainFile.name.match(/([A-Z]+\/?[A-Z]*\s*\d+[-:]?\d*)/)
        if (match) info.code = match[1]
        info.name = mainFile.name.replace(/\.(pdf|doc|docx)$/i, '')
        info.desc = isPolicy ? '用户上传的自定义政策文件。' : '用户上传的自定义核算标准文件。'
      }
      const scenario = isPolicy ? 'ZCF' : 'PCF'
      info.scenarios = [scenario]
      const groups = getGroupTemplate(scenario)
      const fileStem = mainFile.name.replace(/\.(pdf|doc|docx)$/i, '')
      const clauseBase = isPolicy ? ['第一章', '第二章', '第三章'] : ['第5.1条', '第6.2条', '第7.3条']
      const attachmentFiles = this.uploadFiles.filter(item => item.role !== 'main').map(item => item.file.name)
      const materialSuffix = attachmentFiles.length ? `；附件覆盖：${attachmentFiles.join('、')}` : ''

      // 按 Skill Prompt 的三类成果生成同构 JSON：
      // standardKnowledge → structured.dimensions
      // formulaParams → structured.formulas / parameters / calcRules
      // reportTemplate → structured.reportTemplate
      const dimensions = groups.map((g, gi) => ({
        key: g.key,
        name: g.name,
        label: g.name,
        desc: g.desc,
        type: g.type || 'list',
        points: [{
          text: `（待人工核对）主文件「${fileStem}」中「${g.name}」相关条款，覆盖：${g.desc}${materialSuffix}。`,
          clauseRefs: [clauseBase[Math.min(gi, clauseBase.length - 1)]]
        }]
      }))

      const formulas = scenario === 'PCF' ? [{
        code: 'CUSTOM-CF-001',
        name: '产品碳足迹总量（待人工核对）',
        expression: 'CF = Σ(AD_i × EF_i)',
        resultIndicator: '产品碳足迹',
        resultUnit: 'kgCO₂e',
        paramRefsText: 'AD_i, EF_i',
        clauseRef: '第6.2条'
      }] : []

      const parameters = scenario === 'PCF' ? [
        { key: 'AD_i', name: '活动数据（待人工核对）', definition: '生命周期各过程的活动数据', unit: '按过程确定', source: '标准原文', value: '', clauseRef: '第6.2条' },
        { key: 'EF_i', name: '排放因子（待人工核对）', definition: '活动数据对应排放因子', unit: 'kgCO₂e/活动单位', source: '标准原文', value: '', clauseRef: '第6.3条' }
      ] : []

      const calcRules = [{
        type: '数据规则',
        content: '（待人工核对）按标准原文确认初级与次级数据优先级。',
        target: formulas.length ? '公式 CUSTOM-CF-001' : '全部指标',
        clauseRef: '第6.2条'
      }]

      info.structured = {
        kind: isPolicy ? 'policy' : 'accounting',
        scenarioKind: scenario,
        parseMeta: {
          source: 'skill-simulated',
          skillId: 'standard-parsing',
          skillName: skillConfig ? skillConfig.name : '标准解析',
          promptModified: Boolean(skillConfig && skillConfig.modified),
          promptUpdatedAt: skillConfig ? skillConfig.updatedAt : '',
          promptTemplate: skillConfig ? skillConfig.promptTemplate : '',
          fileName: mainFile.name,
          sourceFiles: this.uploadFiles.map(item => ({
            name: item.file.name,
            role: item.role === 'main' ? 'main' : 'attachment',
            size: item.file.size
          })),
          parsedAt: new Date().toISOString()
        },
        dimensions
      }
      if (scenario === 'PCF') {
        info.structured.formulas = formulas
        info.structured.parameters = parameters
        info.structured.calcRules = calcRules
      }
      info.structured.reportTemplate = {
        file: { name: mainFile.name, pages: '', uploadedAt: new Date().toLocaleDateString('zh-CN') },
        sections: [{
          name: '基本信息（待人工核对）',
          type: 'form',
          fields: [
            { name: '标准编号', type: 'text', unit: '', required: true, calcRule: '' },
            { name: '核算对象', type: 'text', unit: '', required: true, calcRule: '' }
          ]
        }]
      }

      if (!info.scenarios || !info.scenarios.length) info.scenarios = ['PCF']
      this.parsedStd = info
      return true
    },
    // 场景变更时按 Skill 分组模板重建知识草稿；其余结构保留，人工在详情页核对。
    onParseScenariosChange() {
      if (!this.parsedStd) return
      const mainFile = this.mainFile()
      const primary = (this.parsedStd.scenarios || [])[0]
      const groups = getGroupTemplate(primary)
      if (!groups.length) {
        if (!this.parsedStd.structured) this.parsedStd.structured = {}
        if (!Array.isArray(this.parsedStd.structured.dimensions)) this.parsedStd.structured.dimensions = []
        this.parsedStd.structured.parseMeta = {
          source: 'skill-simulated',
          skillId: 'standard-parsing',
          fileName: mainFile ? mainFile.name : '',
          sourceFiles: this.uploadFiles.map(item => ({
            name: item.file.name,
            role: item.role === 'main' ? 'main' : 'attachment',
            size: item.file.size
          })),
          parsedAt: new Date().toISOString()
        }
        return
      }
      const old = Array.isArray(this.parsedStd.structured && this.parsedStd.structured.dimensions)
        ? this.parsedStd.structured.dimensions : []
      const byKey = {}
      old.forEach(g => { if (g && g.key) byKey[g.key] = g })
      const fileName = mainFile ? mainFile.name : ''
      const fileStem = fileName.replace(/\.(pdf|doc|docx)$/i, '')
      const clauseBase = ['第1条', '第2条', '第3条']
      this.parsedStd.structured.scenarioKind = primary
      this.parsedStd.structured.parseMeta = {
        source: 'skill-simulated',
        skillId: 'standard-parsing',
        fileName,
        sourceFiles: this.uploadFiles.map(item => ({
          name: item.file.name,
          role: item.role === 'main' ? 'main' : 'attachment',
          size: item.file.size
        })),
        parsedAt: new Date().toISOString()
      }
      this.parsedStd.structured.dimensions = groups.map((g, gi) => {
        const cur = byKey[g.key]
        if (cur) return cur
        return {
          key: g.key,
          name: g.name,
          label: g.name,
          desc: g.desc,
          type: g.type || 'list',
          points: [{
            text: `（待人工核对）主文件「${fileStem}」中「${g.name}」相关条款，覆盖：${g.desc}。`,
            clauseRefs: [clauseBase[Math.min(gi, clauseBase.length - 1)]]
          }]
        }
      })
    },
    scenarioLabel(key) {
      const sc = this.scenarioEnum.find(s => s.key === key)
      return sc ? sc.label : key
    },
    // 申报政策结构化骨架（申报条件 + 指标体系 + 材料要求 + 映射关系）——委托服务模块
    makePolicySkeleton() {
      return makePolicySkeleton()
    },
    confirmImport() {
      if (!this.parsedStd.code || !this.parsedStd.name) {
        this.$message.warning('编号和名称为必填项')
        return
      }
      if (!this.parsedStd.scenarios || !this.parsedStd.scenarios.length) {
        this.$message.warning('请至少选择一个业务场景（决定解析模板与智能体查询范围）')
        return
      }
      // R040201 RULE-005：参数必挂条款溯源（仅含 params 的结构化内容校验）
      const vp = validateParams(this.parsedStd.structured)
      if (!vp.ok) {
        this.$message.warning(`以下参数缺少条款溯源，请补充后提交：${vp.missingKeys.join('、')}`)
        return
      }
      // R040201 RULE-014：申报指标权重合计校验（填写了权重才触发）
      if (this.parsedStd.structured && this.parsedStd.structured.indicators) {
        const vw = validateIndicatorsWeight(this.parsedStd.structured.indicators)
        if (!vw.ok) {
          this.$message.warning(`指标权重合计为 ${vw.total}%，须等于 100%`)
          return
        }
      }
      const newStd = {
        ...this.parsedStd,
        status: '现行',
        // 入库状态机：上传解析后进入「待人工审核」，审核通过后方对智能体生效
        parseStatus: 'pending',
        _sourceFile: (this.mainFile() || {}).name || '',
        _sourceFiles: this.uploadFiles.map(item => ({
          name: item.file.name,
          role: item.role === 'main' ? 'main' : 'attachment',
          size: item.file.size
        })),
        _importedAt: new Date().toLocaleString('zh-CN')
      }
      const exists = this.standards.find(s => s.code === newStd.code)
      if (exists) {
        // 版本并存：新条目作为新版本入库，旧版本保留（在途任务按启动时版本执行）
        newStd.version = 'V' + (this.standards.filter(s => s.code === newStd.code).length + 1)
        this.$confirm(`标准 ${newStd.code} 已存在（版本 ${exists.version || '—'}）。新解析结果将作为新版本「${newStd.version}」入库待审核，在途任务仍按启动时版本执行。`, '版本并存提示', {
          confirmButtonText: '入库新版本',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.standards.unshift(newStd)
          this.finishImport(newStd)
        }).catch(() => {})
      } else {
        newStd.version = this.parsedStd.version || 'V1'
        this.standards.unshift(newStd)
        this.finishImport(newStd)
      }
    },
    finishImport(newStd) {
      this.persistCustomStandards()
      this.showUploadDialog = false
      this.resetUpload()
      this.$message.success(`标准「${newStd.name}」已入库（待人工审核，审核通过后对智能体生效）`)
    },
    parseStatusText(ps) {
      return { pending: '待确认', effective: '已生效' }[ps] || '未解析'
    },
    parseStatusTagType(ps) {
      return { pending: 'warning', effective: 'success' }[ps] || 'info'
    },
    resetUpload() {
      this.parseStep = 0
      this.uploadFiles = []
      this.parseTasks = []
      this.parsedStd = null
      this.isDragOver = false
    },
    // 持久化全部标准（运维人员可编辑所有标准）
    persistCustomStandards() {
      try {
        localStorage.setItem('carbon-library-standards-v2', JSON.stringify(this.standards))
      } catch (e) { /* ignore */ }
    },
    // 加载标准（v2：含结构化解析内容/解析状态/版本；旧 v1 缓存无新字段，直接失效以加载升级后的内置数据）
    loadCustomStandards() {
      try {
        const saved = localStorage.getItem('carbon-library-standards-v2')
        if (saved) {
          this.standards = JSON.parse(saved)
          // 幂等补种：内置标准对已有缓存用户补齐（按 code 判重）；
          // 同时同步内置条目的「场景分类 / 场景枚举 / 结构化配置」——
          // 平台场景改名（如「报告提报」→「智慧报告」）与口径规则集升级需推送到已有缓存。
          // 判定为「结构性缺失」才覆盖（不改写用户对参数内容的微调）。
          const byCode = new Map(this.standards.map(s => [s.code, s]))
          let changed = false
          EXTRA_STANDARDS.forEach(def => {
            const cur = byCode.get(def.code)
            if (!cur) {
              this.standards.push(JSON.parse(JSON.stringify(def)))
              changed = true
              return
            }
            const stale = cur.scope !== def.scope ||
              !cur.structured || !cur.structured.scenarioKind ||
              !(cur.structured.params && cur.structured.params.length)
            if (stale) {
              Object.assign(cur, JSON.parse(JSON.stringify(def)))
              changed = true
            }
          })
          if (changed) this.persistCustomStandards()
        } else {
          // 首次加载：持久化内置标准，供其他模块（如智慧报告智能体校验模板引用的依据）读取
          this.persistCustomStandards()
        }
      } catch (e) { /* ignore */ }
    }
  },
  mounted() {
    // R040201 STORY-010 前置：存量 PCF 标准参数化入库（种子合并，已有 params 的条目不动）
    const merged = ensureSeed()
    if (merged > 0) this.$message.info(`政策标准库升级：${merged} 条标准已完成参数化解析入库`)
    this.loadCustomStandards()
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
.page-header { margin-bottom: 20px; display: flex; align-items: flex-start; justify-content: space-between; flex-shrink: 0; }
.page-title { font-size: 20px; color: #303133; margin: 0 0 6px 0; }
.page-title i { color: #0067FE; }
.page-desc { font-size: 13px; color: #909399; margin: 0; }
.stats-row { display: flex; gap: 16px; margin-bottom: 16px; flex-shrink: 0; }
.stat-card {
  flex: 1; background: #fff; border-radius: 8px; padding: 14px 18px;
  border: 1px solid #ebeef5; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  display: flex; align-items: center; gap: 14px;
}
.stat-icon {
  width: 44px; height: 44px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; flex-shrink: 0;
}
.stat-content { flex: 1; min-width: 0; }
.stat-num { font-size: 24px; font-weight: 700; color: #303133; line-height: 1.2; }
.stat-label { font-size: 12px; color: #909399; margin-top: 2px; }
.toolbar { display: flex; align-items: center; margin-bottom: 12px; flex-shrink: 0; }
/* 分页 */
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
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
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}
/* 编号等宽字体 */
.code-font { font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; }
/* 穿透详情按钮 */
.btn-drill { color: #0067FE; }
.btn-drill:hover { color: #409eff; }
/* 危险按钮 */
.btn-danger { color: #f56c6c; }
.btn-danger:hover { color: #f78989; }
/* 空状态 */
.table-empty { padding: 40px 0; text-align: center; color: #909399; }
.table-empty i { font-size: 40px; color: #c0c4cc; margin-bottom: 10px; }
.table-empty p { font-size: 13px; margin: 0 0 12px; }

/* ===== 上传解析对话框 ===== */
.std-upload-dialog .el-dialog__body { padding: 16px 20px; }
.std-steps { display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
.std-step { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #94a3b8; }
.std-step-dot {
  width: 24px; height: 24px; border-radius: 50%; background: #f1f5f9;
  border: 2px solid #e2e8f0; display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600; color: #94a3b8;
}
.std-step.step-active { color: #0067FE; font-weight: 600; }
.std-step.step-active .std-step-dot { background: #0067FE; border-color: #0067FE; color: #fff; }
.std-step.step-done { color: #67C23A; }
.std-step.step-done .std-step-dot { background: #67C23A; border-color: #67C23A; color: #fff; }
.std-step-line { width: 60px; height: 2px; background: #e2e8f0; margin: 0 12px; }
/* 上传区 */
.std-agent-tip {
  display: flex; align-items: flex-start; gap: 8px; background: #f0f7ff;
  border-radius: 8px; padding: 10px 12px; margin-bottom: 14px;
  font-size: 12.5px; color: #606266; line-height: 1.5;
}
.std-agent-tip i { color: #0067FE; margin-top: 1px; flex-shrink: 0; }
.std-agent-tip.success { background: #f0f9eb; }
.std-agent-tip.success i { color: #67C23A; }
.std-drop-zone {
  border: 2px dashed #dcdfe6; border-radius: 10px; padding: 30px 20px;
  text-align: center; cursor: pointer; transition: all 0.25s; background: #fafbfc;
}
.std-drop-zone:hover, .std-drop-zone.drop-active { border-color: #0067FE; background: rgba(0,103,254,0.04); }
.std-drop-icon { font-size: 36px; color: #c0c4cc; margin-bottom: 8px; }
.std-drop-zone:hover .std-drop-icon { color: #0067FE; }
.std-drop-text { font-size: 13px; color: #606266; margin-bottom: 4px; }
.std-drop-hint { font-size: 11px; color: #94a3b8; }
.std-file-card {
  display: flex; align-items: center; gap: 10px; margin-top: 12px;
  padding: 10px 12px; background: #f0f7ff; border: 1px solid rgba(0,103,254,0.15); border-radius: 8px;
}
.std-file-card.is-main {
  background: rgba(0,103,254,0.08);
  border-color: rgba(0,103,254,0.28);
}
.std-file-icon { font-size: 22px; color: #0067FE; flex-shrink: 0; }
.std-file-info { flex: 1; min-width: 0; }
.std-file-name { font-size: 13px; font-weight: 600; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.std-file-name .el-tag { margin-left: 6px; }
.std-file-size { font-size: 11px; color: #94a3b8; }
.std-file-remove { cursor: pointer; color: #94a3b8; font-size: 14px; padding: 4px; border-radius: 4px; }
.std-file-remove:hover { color: #f56c6c; background: rgba(245,108,108,0.1); }
/* 解析区 */
.std-parsing-zone { padding: 10px 0; }
.std-parse-task {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  font-size: 13px; color: #94a3b8; border-bottom: 1px solid #f1f5f9;
}
.std-parse-task:last-child { border-bottom: none; }
.std-parse-task i { font-size: 15px; flex-shrink: 0; }
.std-parse-task.task-running { color: #0067FE; }
.std-parse-task.task-running i { color: #0067FE; }
.std-parse-task.task-done { color: #606266; }
.std-parse-task.task-done i { color: #67C23A; }
.task-result { margin-left: auto; font-size: 11px; color: #67C23A; font-weight: 600; }
/* 确认区 */
.std-confirm-form { margin-top: 6px; }

/* ===== 详情弹窗：结构化解析内容 ===== */
.std-structured { margin-top: 14px; border: 1px solid #ebeef5; border-radius: 8px; padding: 12px 14px; }
.ss-title { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 10px; }
.ss-title i { color: #0067FE; margin-right: 4px; }
.ss-title-hint { font-size: 12px; font-weight: 400; color: #909399; margin-left: 6px; }
.ss-dim { margin-bottom: 10px; }
.ss-dim:last-child { margin-bottom: 0; }
.ss-dim-label { font-size: 12.5px; font-weight: 600; color: #0067FE; margin-bottom: 6px; }
.ss-points { margin: 0; padding-left: 18px; }
.ss-points li { font-size: 12.5px; color: #606266; line-height: 1.8; }
.ss-table { margin-top: 2px; }
.ss-empty {
  margin-top: 14px; padding: 18px; text-align: center; font-size: 12.5px; color: #909399;
  background: #fafbfc; border: 1px dashed #e2e8f0; border-radius: 8px; line-height: 1.7;
}
.ss-empty i { font-size: 22px; color: #c0c4cc; display: block; margin-bottom: 6px; }
.ss-audit {
  margin-top: 14px; display: flex; justify-content: space-between; align-items: center;
  padding: 10px 12px; background: #fdf6ec; border: 1px solid #faecd8; border-radius: 8px;
}
.ss-audit-tip { font-size: 12.5px; color: #e6a23c; }
.ss-audit-tip i { margin-right: 4px; }
</style>
