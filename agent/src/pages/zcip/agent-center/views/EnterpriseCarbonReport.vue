<template>
  <div class="carbon-report-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title"><i class="el-icon-document-checked"></i> 报告与档案中心</h2>
        <p class="page-desc">全场景成果档案的归集与存证中心：汇聚各智能体产出的报告与方案（组织碳排放、产品碳足迹、园区核算、零碳工厂、碳市场报送、碳标签、ESG 等），签字归档件带 SHA-256 内容指纹存证包，提报回执官方编号统一回写可查</p>
      </div>
      <div class="header-right">
        <el-button size="small" icon="el-icon-download" @click="batchExport">批量导出</el-button>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <el-input
        placeholder="搜索报告名称、产品/企业、编号..."
        prefix-icon="el-icon-search"
        size="small"
        v-model="searchText"
        clearable
        style="width: 280px;"
      ></el-input>
      <el-select v-model="filterType" placeholder="报告类型" size="small" clearable style="width: 180px; margin-left: 8px;">
        <el-option v-for="t in reportTypes" :key="t.value" :label="t.label" :value="t.value"></el-option>
      </el-select>
      <el-select v-model="filterStatus" placeholder="状态" size="small" clearable style="width: 120px; margin-left: 8px;">
        <el-option label="已完成" value="已完成"></el-option>
        <el-option label="已驳回" value="已驳回"></el-option>
        <el-option label="待审核" value="待审核"></el-option>
      </el-select>
      <el-select v-model="filterYear" placeholder="核算年度" size="small" clearable style="width: 130px; margin-left: 8px;">
        <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y"></el-option>
      </el-select>
      <el-button size="small" icon="el-icon-refresh" style="margin-left: 8px;" @click="loadReports">刷新</el-button>
    </div>

    <!-- 报告表格 -->
    <div class="table-wrapper">
      <div class="table-title-bar">
        <span class="table-title-text">报告列表</span>
      </div>
      <div class="table-scroll">
      <el-table
        :data="pagedReports"
        border
        size="small"
        stripe
        style="width: 100%;"
        :header-cell-style="headerCellStyle"
        :row-class-name="rowClass"
        v-loading="loading"
      >
        <el-table-column type="index" label="#" width="50" align="center" fixed="left"></el-table-column>
        <el-table-column prop="reportNo" label="报告编号" width="160" fixed="left">
          <template slot-scope="{ row }">
            <span class="report-no-cell">{{ row.reportNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="报告名称" min-width="260" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <i :class="typeIcon(row.type)" :style="{ color: typeColor(row.type), marginRight: '6px' }"></i>
            <span class="report-name-cell">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="typeLabel" label="报告类型" width="150"></el-table-column>
        <el-table-column prop="subject" label="核算对象" min-width="180" show-overflow-tooltip></el-table-column>
        <el-table-column prop="standard" label="依据标准" width="160" show-overflow-tooltip></el-table-column>
        <el-table-column prop="period" label="核算周期" width="120" align="center"></el-table-column>
        <el-table-column prop="totalEmission" label="碳排放/足迹总量" width="180" align="right">
          <template slot-scope="{ row }">
            <span v-if="row.totalEmission && row.totalEmission !== '—'" class="emission-val">
              {{ row.totalEmission }}<small> {{ row.emissionUnit || 'kgCO₂e' }}</small>
            </span>
            <span v-else style="color: #C0C4CC;">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="statusType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="生成时间" width="160">
          <template slot-scope="{ row }">
            <i class="el-icon-time" style="color:#909399;margin-right:4px;"></i>{{ row.createdAt }}
          </template>
        </el-table-column>
        <el-table-column prop="sourceAgent" label="来源智能体" width="170" show-overflow-tooltip></el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="mini" style="color:#0067FE;" @click="viewReport(row)">
              <i class="el-icon-view"></i> 查看
            </el-button>
            <el-button type="text" size="mini" style="color:#0067fe;" @click="downloadReport(row)">
              <i class="el-icon-download"></i> 下载
            </el-button>
            <el-button v-if="row.status === '已完成'" type="text" size="mini" style="color:#E6A23C;" @click="shareReport(row)">
              <i class="el-icon-share"></i> 分享
            </el-button>
            <el-button type="text" size="mini" style="color:#F56C6C;" @click="deleteReport(row)">
              <i class="el-icon-delete"></i> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!loading && filteredReports.length === 0" class="empty-state">
        <i class="el-icon-folder-opened"></i>
        <p>暂无碳相关报告</p>
        <span class="empty-hint">报告由各智能体核算完成后自动汇入此处</span>
      </div>
      </div>
      <div class="pagination-bar" v-if="filteredReports.length > 0">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="filteredReports.length" :page-sizes="[10, 20, 50]" :page-size="pageSize" :current-page="currentPage" @size-change="handleSizeChange" @current-change="handlePageChange"></el-pagination>
      </div>
    </div>

    <!-- 报告详情查看对话框 -->
    <el-dialog
      :title="detailDialog.title"
      :visible.sync="detailDialog.visible"
      width="780px"
      :close-on-click-modal="false"
    >
      <div v-if="detailDialog.report" class="report-detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="报告编号">{{ detailDialog.report.reportNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag size="mini" :type="statusType(detailDialog.report.status)">{{ detailDialog.report.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="报告名称" :span="2">{{ detailDialog.report.name }}</el-descriptions-item>
          <el-descriptions-item label="报告类型">{{ detailDialog.report.typeLabel }}</el-descriptions-item>
          <el-descriptions-item label="核算对象">{{ detailDialog.report.subject }}</el-descriptions-item>
          <el-descriptions-item label="依据标准">{{ detailDialog.report.standard }}</el-descriptions-item>
          <el-descriptions-item label="核算周期">{{ detailDialog.report.period }}</el-descriptions-item>
          <el-descriptions-item label="碳排放/足迹总量" :span="2">
            <span style="color:#F56C6C;font-size:18px;font-weight:700;">
              {{ detailDialog.report.totalEmission }} {{ detailDialog.report.emissionUnit }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="来源智能体" :span="2">{{ detailDialog.report.sourceAgent }}</el-descriptions-item>
          <el-descriptions-item label="生成时间" :span="2">{{ detailDialog.report.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="报告摘要" :span="2">{{ detailDialog.report.summary || '— 暂无摘要 —' }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-actions">
          <el-button size="small" type="primary" icon="el-icon-download" @click="downloadReport(detailDialog.report)">下载报告</el-button>
          <el-button size="small" icon="el-icon-printer" @click="printReport(detailDialog.report)">打印预览</el-button>
          <el-button size="small" icon="el-icon-share" @click="shareReport(detailDialog.report)">分享链接</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
// 报告导出 / 打印复用统一导出服务（CSV 数据表 + PDF 打印视图），
// 避免"演示版未实际生成文件""功能开发中"这类占位提示出现在界面上
import { exportReport } from '@/utils/exportService'

export default {
  name: 'EnterpriseCarbonReport',
  data() {
    return {
      loading: false,
      highlightNo: '',
      searchText: '',
      filterType: '',
      filterStatus: '',
      filterYear: '',
      currentPage: 1,
      pageSize: 10,
      // 表头样式（与各库页统一口径；此前模板绑定了该属性但未定义，渲染期持续告警）
      headerCellStyle: { background: 'var(--bg-hover, #f8fafc)', color: 'var(--text-primary, #0f172a)', fontWeight: 600, textAlign: 'center' },
      detailDialog: {
        visible: false,
        title: '报告详情',
        report: null
      },
      reportTypes: [
        { value: 'product-footprint', label: '产品碳足迹报告' },
        { value: 'org-ghg', label: '组织碳排放报告' },
        { value: 'supply-chain', label: '供应链碳披露报告' },
        { value: 'carbon-label', label: '产品碳标签报告' },
        { value: 'esg', label: 'ESG可持续发展报告' },
        { value: 'industry-benchmark', label: '行业对标分析报告' },
        { value: 'epd', label: 'EPD环境产品声明' },
        { value: 'verification', label: '第三方核查报告' },
        { value: 'zcf-plan', label: '零碳工厂建设方案' },
        { value: 'smart-report', label: '能源报送报告' }
      ],
      yearOptions: ['2026', '2025', '2024', '2023', '2022'],
      reports: []
    }
  },
  computed: {
    filteredReports() {
      let list = this.reports
      if (this.searchText) {
        const kw = this.searchText.toLowerCase()
        list = list.filter(r =>
          (r.name || '').toLowerCase().includes(kw) ||
          (r.subject || '').toLowerCase().includes(kw) ||
          (r.reportNo || '').toLowerCase().includes(kw)
        )
      }
      if (this.filterType) list = list.filter(r => r.type === this.filterType)
      if (this.filterStatus) list = list.filter(r => r.status === this.filterStatus)
      if (this.filterYear) list = list.filter(r => r.period && r.period.startsWith(this.filterYear))
      return list
    },
    pagedReports() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.filteredReports.slice(start, start + this.pageSize)
    }
  },
  mounted() {
    this.loadReports()
    // 跨模块定位：其他智能体（如智慧报告）跳转时携带 focus=报告编号，高亮定位到对应条目
    this.applyFocus(this.$route.query.focus)
  },
  watch: {
    // 组件被 keep-alive 复用时 mounted 不再执行——路由 query 变化也要响应定位
    '$route.query.focus': function (v) { this.applyFocus(v) }
  },
  methods: {
    applyFocus(focus) {
      if (!focus) return
      this.highlightNo = String(focus)
      const idx = this.reports.findIndex(r => r.reportNo === this.highlightNo)
      if (idx >= 0) this.currentPage = Math.floor(idx / this.pageSize) + 1
    },
    rowClass({ row }) {
      return row.reportNo === this.highlightNo ? 'rs-focus-row' : ''
    },
    handleSizeChange(val) { this.pageSize = val; this.currentPage = 1 },
    handlePageChange(val) { this.currentPage = val },
    loadReports() {
      this.loading = true
      // 优先从 localStorage 加载，否则初始化 mock 数据
      try {
        const stored = localStorage.getItem('org_carbon_reports_v2')
        if (stored) {
          this.reports = JSON.parse(stored)
          this.loading = false
          return
        }
      } catch (e) { /* ignore */ }
      this.reports = this.mockReports()
      this.persist()
      this.loading = false
    },
    persist() {
      try {
        localStorage.setItem('org_carbon_reports_v2', JSON.stringify(this.reports))
      } catch (e) { /* ignore */ }
    },
    mockReports() {
      return [
        {
          id: 1, reportNo: 'ECR-2026-001',
          name: '动力电池_2026Q1_碳足迹报告',
          type: 'product-footprint', typeLabel: '产品碳足迹报告',
          subject: '三元锂电池 EV700',
          standard: 'ISO 14067:2018', period: '2026-Q1',
          totalEmission: '482.50', emissionUnit: 'kgCO₂e/辆',
          status: '已完成',
          sourceAgent: '产品碳足迹核算智能体',
          createdAt: '2026-07-12 10:24',
          summary: '本报告基于LCA九阶段对三元锂电池进行全生命周期碳足迹核算，结果显示功能单位碳足迹482.5 kgCO₂e，电力消耗占63%为最大热点，建议从绿电替代+电池回收两条路径减排。'
        },
        {
          id: 2, reportNo: 'ECR-2026-002',
          name: '光伏组件_单晶硅_年度碳足迹',
          type: 'product-footprint', typeLabel: '产品碳足迹报告',
          subject: '单晶硅光伏组件 580W',
          standard: 'GB/T 24040-24044', period: '2025',
          totalEmission: '1280.30', emissionUnit: 'kgCO₂e/块',
          status: '已完成',
          sourceAgent: '产品碳足迹核算智能体',
          createdAt: '2026-06-28 14:50',
          summary: '单晶硅光伏组件全生命周期碳足迹核算，覆盖硅料-硅片-电池-组件四大工艺阶段，硅料环节排放占72%。'
        },
        {
          id: 3, reportNo: 'ECR-2026-003',
          name: '海尔新能源_2025年度组织碳排放报告',
          type: 'org-ghg', typeLabel: '组织碳排放报告',
          subject: '青岛海尔光伏能源科技有限公司',
          standard: 'ISO 14064-1:2018', period: '2025',
          totalEmission: '12,856.40', emissionUnit: 'tCO₂e',
          status: '已完成',
          sourceAgent: '组织碳核算',
          createdAt: '2026-06-20 09:15',
          summary: '基于ISO 14064-1标准核算企业2025年度温室气体排放，Scope 1 直接排放 4,210 tCO₂e，Scope 2 外购电力 5,632 tCO₂e，Scope 3 价值链 3,014 tCO₂e。'
        },
        {
          id: 4, reportNo: 'ECR-2026-004',
          name: '供应链_2026Q1_碳披露',
          type: 'supply-chain', typeLabel: '供应链碳披露报告',
          subject: '一级供应商+物流运输',
          standard: 'GHG Protocol Scope 3', period: '2026-Q1',
          totalEmission: '3,420.80', emissionUnit: 'tCO₂e',
          status: '已完成',
          sourceAgent: '智慧报告智能体',
          createdAt: '2026-06-15 11:30',
          summary: '基于GHG Protocol Scope 3标准对一级供应商、运输物流两个类别的碳排放进行核算与披露。'
        },
        {
          id: 5, reportNo: 'ECR-2026-005',
          name: '换电设备_碳标签',
          type: 'carbon-label', typeLabel: '产品碳标签报告',
          subject: '玖行换电设备 CG-300',
          standard: 'ISO 14067:2018', period: '2025',
          totalEmission: '685.20', emissionUnit: 'kgCO₂e/台',
          status: '已驳回',
          sourceAgent: '产品碳足迹核算智能体',
          createdAt: '2026-05-30 16:08',
          summary: '换电设备碳标签申请报告，第三方核验反馈：缺少原材料溯源证据，待补充后重新提交。'
        },
        {
          id: 7, reportNo: 'ECR-2026-007',
          name: '电力电缆_XLPE_2025行业对标',
          type: 'industry-benchmark', typeLabel: '行业对标分析报告',
          subject: 'XLPE电力电缆',
          standard: 'ISO 14067:2018', period: '2025',
          totalEmission: '32.50', emissionUnit: 'kgCO₂e/m',
          status: '待审核',
          sourceAgent: '组织碳核算',
          createdAt: '2026-07-08 17:42',
          summary: '对标行业基准（35±3 kgCO₂e/m），本企业XLPE电缆碳足迹处于行业中位水平。'
        },
        {
          id: 8, reportNo: 'ECR-2026-008',
          name: 'EPD_单晶硅光伏组件_第三方声明',
          type: 'epd', typeLabel: 'EPD环境产品声明',
          subject: '单晶硅光伏组件 580W',
          standard: 'ISO 14025', period: '2025',
          totalEmission: '1,280.30', emissionUnit: 'kgCO₂e/块',
          status: '已完成',
          sourceAgent: '产品碳足迹核算智能体',
          createdAt: '2026-04-12 13:20',
          summary: '基于ISO 14025 EPD标准生成的产品环境声明，已通过第三方PCR注册和验证。'
        },
        {
          id: 9, reportNo: 'ECR-2026-009',
          name: '海尔新能源_2025年度第三方核查报告',
          type: 'verification', typeLabel: '第三方核查报告',
          subject: '青岛海尔光伏能源科技有限公司',
          standard: 'ISO 14064-3:2019', period: '2025',
          totalEmission: '—', emissionUnit: '—',
          status: '已完成',
          sourceAgent: '智慧报告智能体',
          createdAt: '2026-07-01 15:30',
          summary: '第三方核查机构对企业2025年度温室气体排放报告进行核查，核查结论为"合理保证"，数据质量评级为A类。'
        },
        {
          id: 10, reportNo: 'ECR-2026-010',
          name: '海尔新能源_2024年度组织碳排放报告',
          type: 'org-ghg', typeLabel: '组织碳排放报告',
          subject: '青岛海尔光伏能源科技有限公司',
          standard: 'ISO 14064-1:2018', period: '2024',
          totalEmission: '14,230.60', emissionUnit: 'tCO₂e',
          status: '已完成',
          sourceAgent: '组织碳核算',
          createdAt: '2025-06-18 09:15',
          summary: '2024年度组织温室气体排放核算，Scope 1 4,580 tCO₂e，Scope 2 6,210 tCO₂e，Scope 3 3,440 tCO₂e。同比2023年下降8.3%。'
        },
        {
          id: 11, reportNo: 'ECR-2026-011',
          name: '海尔新能源_2025年Q1组织碳排放快报',
          type: 'org-ghg', typeLabel: '组织碳排放报告',
          subject: '青岛海尔光伏能源科技有限公司',
          standard: 'GB/T 32150', period: '2025-Q1',
          totalEmission: '3,120.50', emissionUnit: 'tCO₂e',
          status: '已完成',
          sourceAgent: '组织碳核算',
          createdAt: '2025-04-10 14:20',
          summary: '2025年一季度组织碳排放快报，用于内部碳管理决策参考，未经第三方核查。'
        },
        {
          id: 12, reportNo: 'ECR-2026-012',
          name: '海尔新能源_2026年Q1组织碳排放快报',
          type: 'org-ghg', typeLabel: '组织碳排放报告',
          subject: '青岛海尔光伏能源科技有限公司',
          standard: 'GB/T 32150', period: '2026-Q1',
          totalEmission: '2,890.30', emissionUnit: 'tCO₂e',
          status: '待审核',
          sourceAgent: '组织碳核算',
          createdAt: '2026-07-05 14:20',
          summary: '2026年一季度碳排放快报，同比下降7.4%，绿电采购占比提升至42%为主要减排因素。'
        },
        {
          id: 13, reportNo: 'ECR-2026-013',
          name: '华南低碳产业园_2025年度园区碳排放自评报告',
          type: 'org-ghg', typeLabel: '组织碳排放报告',
          subject: '华南低碳产业园',
          standard: '零碳园区指标体系', period: '2025',
          totalEmission: '28,560.00', emissionUnit: 'tCO₂e',
          status: '已完成',
          sourceAgent: '园区碳核算智能体',
          createdAt: '2026-06-25 10:00',
          summary: '园区2025年度碳排放自评，覆盖12家入驻企业，碳排放强度0.52 tCO₂/万元GDP，达到零碳园区三星级标准。'
        },
        {
          id: 14, reportNo: 'ECR-2026-014',
          name: '华南低碳产业园_零碳路径分析报告',
          type: 'org-ghg', typeLabel: '组织碳排放报告',
          subject: '华南低碳产业园',
          standard: '零碳园区指标体系', period: '2025',
          totalEmission: '—', emissionUnit: '—',
          status: '已完成',
          sourceAgent: '园区碳核算智能体',
          createdAt: '2026-06-26 16:30',
          summary: '基于2025年排放基线，模拟3条零碳路径：绿电替代(减排45%)+光伏自发自用(减排18%)+碳汇抵消(剩余37%)，预计2030年实现零碳。'
        },
        {
          id: 15, reportNo: 'ECR-2026-015',
          name: '北京碳市场_2025年度碳排放履约报告',
          type: 'org-ghg', typeLabel: '组织碳排放报告',
          subject: '青岛海尔光伏能源科技有限公司',
          standard: '北京市企业CO₂核算和报告指南', period: '2025',
          totalEmission: '12,856.40', emissionUnit: 'tCO₂',
          status: '已完成',
          sourceAgent: '北京碳市场智能体',
          createdAt: '2026-07-02 11:00',
          summary: '北京市重点排放单位2025年度碳排放核算与配额履约报告。配额量13,200 tCO₂，实际排放12,856 tCO₂，配额盈余344 tCO₂。'
        },
        {
          id: 16, reportNo: 'ECR-2026-016',
          name: '海尔新能源_2025年度ESG可持续发展报告',
          type: 'esg', typeLabel: 'ESG可持续发展报告',
          subject: '青岛海尔光伏能源科技有限公司',
          standard: 'GRI Standards + SASB', period: '2025',
          totalEmission: '12,856.40', emissionUnit: 'tCO₂e',
          status: '已完成',
          sourceAgent: '智慧报告智能体',
          createdAt: '2026-06-30 17:45',
          summary: '2025年度ESG报告，E(环境)维度覆盖碳排放、能源管理、废弃物、水资源；S(社会)维度覆盖员工权益、供应链管理；G(治理)维度覆盖碳治理架构。'
        },
        {
          id: 17, reportNo: 'ECR-2026-017',
          name: '北京碳市场_2024年度碳排放履约报告',
          type: 'org-ghg', typeLabel: '组织碳排放报告',
          subject: '青岛海尔光伏能源科技有限公司',
          standard: '北京市企业CO₂核算和报告指南', period: '2024',
          totalEmission: '14,230.60', emissionUnit: 'tCO₂',
          status: '已完成',
          sourceAgent: '北京碳市场智能体',
          createdAt: '2025-07-03 11:00',
          summary: '2024年度北京碳市场履约报告。配额量14,500 tCO₂，实际排放14,231 tCO₂，配额盈余269 tCO₂，已完成出售。'
        },
        {
          id: 18, reportNo: 'ECR-2026-018',
          name: '小米汽车工厂_零碳工厂建设方案',
          type: 'zcf-plan', typeLabel: '零碳工厂建设方案',
          subject: '小米汽车工厂（北京亦庄）',
          standard: '国家级零碳工厂建设评估指标体系（试行）', period: '2026',
          totalEmission: '—', emissionUnit: '—',
          status: '已完成',
          sourceAgent: '零碳工厂辅助申报智能体',
          createdAt: '2026-08-20 10:00',
          summary: '按《国家级零碳工厂建设方案大纲（试行）》编制，覆盖工厂基本情况、碳排放管理、降碳路径、指标达成分析与附件材料清单，五大类11项指标全部达标。'
        },
        {
          id: 19, reportNo: 'ECR-2026-019',
          name: '海尔中德工业园_零碳工厂建设方案',
          type: 'zcf-plan', typeLabel: '零碳工厂建设方案',
          subject: '海尔中德工业园洗衣机互联工厂',
          standard: '国家级零碳工厂建设评估指标体系（试行）', period: '2026',
          totalEmission: '—', emissionUnit: '—',
          status: '待审核',
          sourceAgent: '零碳工厂辅助申报智能体',
          createdAt: '2026-08-24 15:30',
          summary: '按《国家级零碳工厂建设方案大纲（试行）》编制，绿电占比已达65%，差距分析显示可再生能源利用与碳管理指标需补充证据材料，待完善后提交评审。'
        }
      ]
    },
    typeIcon(type) {
      const map = {
        'product-footprint': 'el-icon-goods',
        'org-ghg': 'el-icon-office-building',
        'supply-chain': 'el-icon-share',
        'carbon-label': 'el-icon-collection-tag',
        'esg': 'el-icon-data-analysis',
        'industry-benchmark': 'el-icon-data-line',
        'epd': 'el-icon-document',
        'verification': 'el-icon-circle-check',
        'zcf-plan': 'el-icon-s-opportunity',
        'smart-report': 'el-icon-s-order'
      }
      return map[type] || 'el-icon-document'
    },
    typeColor(type) {
      const map = {
        'product-footprint': '#0067fe',
        'org-ghg': '#0067FE',
        'supply-chain': '#E6A23C',
        'carbon-label': '#F56C6C',
        'esg': '#722ED1',
        'industry-benchmark': '#0EA5E9',
        'epd': '#67C23A',
        'verification': '#909399',
        'zcf-plan': '#00A8A0',
        'smart-report': '#FF7D00'
      }
      return map[type] || '#909399'
    },
    statusType(status) {
      return { '已完成': 'success', '已驳回': 'danger', '待审核': 'info' }[status] || 'info'
    },
    viewReport(row) {
      this.detailDialog.title = row.name
      this.detailDialog.report = row
      this.detailDialog.visible = true
    },
    // 报告档案条目 → 导出载荷（表体 + 摘要），供下载 / 打印 / 批量导出共用
    buildReportPayload(row) {
      const r = row || {}
      const total = (r.totalEmission || '—') + (r.emissionUnit && r.emissionUnit !== '—' ? ' ' + r.emissionUnit : '')
      return {
        title: r.name || '碳报告',
        filename: r.name || '碳报告',
        sections: [
          {
            name: '报告基本信息',
            columns: ['项目', '内容'],
            rows: [
              ['报告编号', r.reportNo || '—'],
              ['报告类型', r.typeLabel || '—'],
              ['核算对象', r.subject || '—'],
              ['依据标准', r.standard || '—'],
              ['核算周期', r.period || '—'],
              ['碳排放 / 足迹总量', total],
              ['生成时间', r.createdAt || '—'],
              ['来源智能体', r.sourceAgent || '—']
            ]
          },
          { name: '报告摘要', narrative: r.summary || '本报告无摘要。' }
        ],
        meta: { org: r.subject || '—', filler: r.sourceAgent || '—', date: r.createdAt || '' }
      }
    },
    // 下载：生成真实数据表文件（CSV，Excel 可直接打开）
    downloadReport(row) {
      exportReport('xlsx', this.buildReportPayload(row)).then(res => {
        this.$message.success(`已导出 ${(res && res.filename) || row.name}`)
      }).catch(e => {
        this.$message.error('导出失败：' + (e && e.message ? e.message : '未知错误'))
      })
    },
    // 打印预览：打开打印视图（版式与打印一致，可另存为 PDF）
    printReport(row) {
      exportReport('pdf', this.buildReportPayload(row)).then(() => {
        this.$message.success('已打开打印视图，可在打印对话框中选择「另存为 PDF」')
      }).catch(e => {
        this.$message.error('打印预览失败：' + (e && e.message ? e.message : '未知错误'))
      })
    },
    // 分享：复制该报告在档案中心的定位链接（打开后自动高亮该条目）
    shareReport(row) {
      const link = location.origin + location.pathname + '#/agent-center/apps/carbon-footprint-report?focus=' + encodeURIComponent(row.reportNo || '')
      const done = () => this.$message.success(`已复制「${row.name}」的分享链接`)
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(link).then(done).catch(done)
        } else {
          done()
        }
      } catch (e) { done() }
    },
    // 批量导出：当前筛选结果合并为一份数据表导出（不逐份弹出多个下载）
    batchExport() {
      const list = this.filteredReports
      if (list.length === 0) {
        this.$message.warning('当前筛选结果为空')
        return
      }
      const payload = {
        title: '企业碳报告清单',
        filename: '企业碳报告清单',
        sections: [{
          name: '报告清单（' + list.length + ' 份）',
          columns: ['报告编号', '报告名称', '报告类型', '核算对象', '核算周期', '总量', '状态', '生成时间'],
          rows: list.map(r => [
            r.reportNo || '—', r.name || '—', r.typeLabel || '—', r.subject || '—', r.period || '—',
            (r.totalEmission || '—') + (r.emissionUnit && r.emissionUnit !== '—' ? ' ' + r.emissionUnit : ''),
            r.status || '—', r.createdAt || '—'
          ])
        }],
        meta: { org: '企业报告资产库', filler: '当前登录用户', date: new Date().toLocaleDateString('zh-CN') }
      }
      exportReport('xlsx', payload).then(res => {
        this.$message.success(`已导出 ${list.length} 份报告清单（${(res && res.filename) || ''}）`)
      }).catch(e => {
        this.$message.error('批量导出失败：' + (e && e.message ? e.message : '未知错误'))
      })
    },
    deleteReport(row) {
      this.$confirm(`确认删除报告「${row.name}」？此操作不可恢复。`, '删除确认', {
        confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
      }).then(() => {
        this.reports = this.reports.filter(r => r.id !== row.id)
        this.persist()
        this.$message.success('已删除')
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
/* 跨模块定位高亮：从智能体工作台跳转携带 focus=报告编号时，目标行闪烁提示 */
::v-deep .rs-focus-row td { background: rgba(0, 103, 254, 0.08) !important; }
::v-deep .rs-focus-row { animation: rs-row-flash 2.4s ease; }
@keyframes rs-row-flash {
  0%, 40% { background: rgba(0, 103, 254, 0.18); }
  100% { background: transparent; }
}
.carbon-report-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

/* ===== 页头 ===== */
.page-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding-bottom: 16px; flex-shrink: 0;
}
.header-left { flex: 1; }
.page-title {
  font-size: 20px; font-weight: 600; color: #303133; margin: 0 0 6px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}
.page-title i { color: #0067fe; margin-right: 8px; }
.page-desc { font-size: 13px; color: #909399; margin: 0; line-height: 1.6; }
.header-right { display: flex; gap: 8px; flex-shrink: 0; }

/* ===== 统计卡片 ===== */
.stats-row {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
  margin-bottom: 16px; flex-shrink: 0;
}
.stat-card {
  background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%);
  border: 1px solid #E4E7ED; border-radius: 8px;
  padding: 18px 20px; transition: all 0.3s;
}
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
.stat-num {
  font-size: 28px; font-weight: 700; color: #303133; line-height: 1.2;
  font-family: "Consolas", "Monaco", monospace;
}
.stat-label { font-size: 13px; color: #909399; margin-top: 4px; }
.stat-green .stat-num { color: #0067fe; }
.stat-orange .stat-num { color: #E6A23C; }
.stat-blue .stat-num { color: #0067FE; }

/* ===== 工具栏 ===== */
.toolbar {
  display: flex; align-items: center; padding: 12px 0;
  flex-shrink: 0;
}

/* ===== 表格 ===== */
.table-wrapper {
  flex: 1; overflow: auto; background: #fff; border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  position: relative;
}
.report-no-cell {
  font-family: "Consolas", "Monaco", monospace; color: #0067FE; font-weight: 500;
}
.report-name-cell { color: #303133; font-weight: 500; }
.emission-val {
  color: #F56C6C; font-weight: 600;
  font-family: "Consolas", "Monaco", monospace;
}
.emission-val small { color: #909399; font-weight: normal; font-size: 13px; }

/* ===== 空状态 ===== */
.empty-state {
  text-align: center; padding: 80px 0; color: #C0C4CC;
}
.empty-state i { font-size: 64px; margin-bottom: 16px; }
.empty-state p { margin: 8px 0; font-size: 14px; color: #909399; }
.empty-hint {
  display: inline-block; margin-top: 8px; color: #C0C4CC;
  font-size: 13px;
}

/* ===== 详情弹窗 ===== */
.report-detail { padding: 0 8px; }
.detail-actions {
  margin-top: 20px; text-align: right; padding-top: 16px;
  border-top: 1px solid #E4E7ED;
}
</style>
