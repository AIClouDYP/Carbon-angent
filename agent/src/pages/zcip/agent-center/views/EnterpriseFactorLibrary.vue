<template>
  <div class="enterprise-factor-library-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title"><i class="el-icon-odometer"></i> 企业因子库</h2>
        <p class="page-desc">企业私因数治理库（与运维管理的「排放因子库」公因数严格分库）：管理化验实测、绿电协议、企业 / 供应商专属因子，凭证有效期内以最高优先级参与因子匹配命中，检测报告挂「佐证材料库」留痕可查</p>
      </div>
    </div>

    <!-- 匹配优先级说明条 -->
    <div class="chain-note">
      <i class="el-icon-connection"></i>
      因子匹配优先级：<b>企业实测因子（凭证有效）</b> → 企业记忆 P0 → 规则表 → 兜底缺省；实测因子<b>凭证过期 / 超出适用边界</b>时自动降级退出命中并留痕回退
    </div>

    <!-- 搜索栏 -->
    <div class="toolbar">
      <el-input placeholder="搜索因子名称、编号..." prefix-icon="el-icon-search" size="small" v-model="searchText" clearable style="width: 240px;"></el-input>
      <el-select v-model="filterScope" placeholder="适用边界" size="small" clearable style="width: 170px; margin-left: 8px;">
        <el-option v-for="s in scopeOptions" :key="s" :label="s" :value="s"></el-option>
      </el-select>
      <el-select v-model="filterStatus" placeholder="有效性" size="small" clearable style="width: 120px; margin-left: 8px;">
        <el-option label="有效" value="有效"></el-option>
        <el-option label="待更新" value="待更新"></el-option>
        <el-option label="已过期" value="已过期"></el-option>
      </el-select>
      <el-button size="small" type="primary" icon="el-icon-plus" style="margin-left: 8px;" @click="openAdd">录入实测因子</el-button>
    </div>

    <!-- 因子列表 -->
    <div class="table-wrapper">
      <div class="table-title-bar">
        <span class="table-title-text">实测因子清单</span>
        <span class="table-title-count">共 {{ filteredFactors.length }} 条（有效 {{ countByStatus('有效') }} · 待更新 {{ countByStatus('待更新') }} · 已过期 {{ countByStatus('已过期') }}）</span>
      </div>
      <el-table :data="filteredFactors" border stripe size="small" style="width: 100%;">
        <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
        <el-table-column label="因子编号" prop="code" width="110" align="center">
          <template slot-scope="{ row }"><span class="code-font">{{ row.code }}</span></template>
        </el-table-column>
        <el-table-column label="因子名称" prop="name" min-width="200" show-overflow-tooltip></el-table-column>
        <el-table-column label="匹配关键词" prop="keyword" width="110" align="center">
          <template slot-scope="{ row }"><el-tag size="mini" effect="plain">{{ row.keyword }}</el-tag></template>
        </el-table-column>
        <el-table-column label="实测值 / 单位" width="150" align="center">
          <template slot-scope="{ row }"><span class="code-font">{{ row.value }} {{ row.unit }}</span></template>
        </el-table-column>
        <el-table-column label="适用边界" prop="scope" min-width="160" show-overflow-tooltip></el-table-column>
        <el-table-column label="检测机构 / 凭证" min-width="180">
          <template slot-scope="{ row }">
            <span class="lab-font">{{ row.lab }}</span>
            <el-tag size="mini" type="success" effect="plain" style="margin-left:4px;" :title="'佐证材料库凭证：' + row.reportNo">{{ row.reportNo }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="有效期至" prop="expireDate" width="105" align="center"></el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="row.status === '有效' ? 'success' : row.status === '待更新' ? 'warning' : 'danger'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="被引用" min-width="170">
          <template slot-scope="{ row }">
            <el-tag v-for="ref in row.references" :key="ref" size="mini" type="info" effect="plain" style="margin:1px;">{{ ref }}</el-tag>
            <span v-if="!row.references || !row.references.length" style="color:#c0c4cc;">未被引用</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="mini" @click="previewFactor(row)">详情</el-button>
            <el-button type="text" size="mini" class="btn-danger" @click="deleteFactor(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 详情抽屉 -->
    <el-drawer title="实测因子详情" :visible.sync="previewVisible" size="440px" append-to-body>
      <div v-if="current" class="detail-content" style="padding: 0 20px;">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="因子编号">{{ current.code }}</el-descriptions-item>
          <el-descriptions-item label="因子名称">{{ current.name }}</el-descriptions-item>
          <el-descriptions-item label="匹配关键词">{{ current.keyword }}</el-descriptions-item>
          <el-descriptions-item label="实测值 / 单位">{{ current.value }} {{ current.unit }}</el-descriptions-item>
          <el-descriptions-item label="适用边界">{{ current.scope }}</el-descriptions-item>
          <el-descriptions-item label="检测机构">{{ current.lab }}</el-descriptions-item>
          <el-descriptions-item label="溯源凭证">{{ current.reportNo }}（佐证材料库）</el-descriptions-item>
          <el-descriptions-item label="检测日期">{{ current.testDate }}</el-descriptions-item>
          <el-descriptions-item label="有效期至">{{ current.expireDate }}</el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag size="mini" :type="current.status === '有效' ? 'success' : current.status === '待更新' ? 'warning' : 'danger'">{{ current.status }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="被引用记录">{{ (current.references || []).join('；') || '—' }}</el-descriptions-item>
          <el-descriptions-item label="匹配说明">{{ current.status === '有效' ? '凭证有效期内：以 P-1 最高优先级参与因子匹配' : '凭证失效 / 待更新：不参与命中，匹配自动回退至后续链路并留痕' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>

    <!-- 录入对话框 -->
    <el-dialog title="录入实测因子" :visible.sync="editVisible" width="540px" append-to-body>
      <el-form :model="editForm" label-width="100px" size="small">
        <el-form-item label="因子名称" required>
          <el-input v-model="editForm.name" placeholder="如：天然气低位热值（实测）"></el-input>
        </el-form-item>
        <el-form-item label="匹配关键词" required>
          <el-input v-model="editForm.keyword" placeholder="命中用关键词，如：天然气"></el-input>
        </el-form-item>
        <el-form-item label="实测值 / 单位" required>
          <div style="display:flex;gap:8px;">
            <el-input v-model="editForm.value" placeholder="如：13.56" style="flex:1;"></el-input>
            <el-input v-model="editForm.unit" placeholder="如：tce/万Nm³" style="flex:1;"></el-input>
          </div>
        </el-form-item>
        <el-form-item label="适用边界">
          <el-input v-model="editForm.scope" placeholder="如：厂区 · 锅炉与工艺用气（超边界不参与命中）"></el-input>
        </el-form-item>
        <el-form-item label="检测机构">
          <el-input v-model="editForm.lab" placeholder="如：华测检测 CMA"></el-input>
        </el-form-item>
        <el-form-item label="溯源凭证号">
          <el-input v-model="editForm.reportNo" placeholder="佐证材料库材料编号，如：PM-014"></el-input>
        </el-form-item>
        <el-form-item label="有效期至">
          <el-date-picker v-model="editForm.expireDate" type="date" value-format="yyyy-MM-dd" style="width: 100%;"></el-date-picker>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="editVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="submitAdd">保存入库</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'EnterpriseFactorLibrary',
  data() {
    return {
      searchText: '',
      filterScope: '',
      filterStatus: '',
      previewVisible: false,
      editVisible: false,
      current: null,
      editForm: { name: '', keyword: '', value: '', unit: '', scope: '', lab: '', reportNo: '', expireDate: '' },
      scopeOptions: ['厂区 · 全厂', '厂区 · 锅炉与工艺用气', '厂区 · 厂内运输车辆', '工序 · 涂布', '设备 · 光伏并网'],
      factors: [
        { code: 'EF-001', name: '天然气低位热值（实测）', keyword: '天然气', value: '13.56', unit: 'tce/万Nm³', scope: '厂区 · 锅炉与工艺用气', lab: '华测检测 CMA', reportNo: 'PM-012', testDate: '2026-03-18', expireDate: '2027-03-17', status: '有效', references: ['2026Q2组织核算 · 范围1天然气', '零碳工厂 · 科学算碳路径'] },
        { code: 'EF-002', name: '柴油低位热值（实测）', keyword: '柴油', value: '1.4992', unit: 'tce/t', scope: '厂区 · 厂内运输车辆', lab: '华测检测 CMA', reportNo: 'PM-013', testDate: '2026-05-06', expireDate: '2026-09-01', status: '已过期', references: ['2026H1组织核算 · 移动燃烧源'] },
        { code: 'EF-003', name: '外购电力排放因子（绿电剥离实测）', keyword: '电力', value: '0.5792', unit: 'kgCO₂/kWh', scope: '厂区 · 全厂（扣除市场化绿电）', lab: '中环联合认证', reportNo: 'PM-015', testDate: '2026-06-10', expireDate: '2027-06-09', status: '有效', references: ['产品碳足迹 · 电力全生命周期'] },
        { code: 'EF-004', name: '涂布工序 NMP 回收率（实测）', keyword: 'NMP', value: '92.6', unit: '%', scope: '工序 · 涂布', lab: '厂内实验室（自测）', reportNo: 'PM-016', testDate: '2026-04-22', expireDate: '2026-10-21', status: '待更新', references: ['产品碳足迹 · 溶剂损耗边界'] },
        { code: 'EF-005', name: '自建光伏发电零碳系数（实测）', keyword: '光伏', value: '0', unit: 'kgCO₂/kWh', scope: '设备 · 光伏并网（自发自用部分）', lab: '中环联合认证', reportNo: 'PM-017', testDate: '2026-01-08', expireDate: '—', status: '有效', references: ['园区核算 · 可再生能源抵消'] }
      ]
    }
  },
  computed: {
    filteredFactors() {
      return this.factors.filter(f =>
        (!this.searchText || f.name.includes(this.searchText) || f.code.includes(this.searchText)) &&
        (!this.filterScope || f.scope === this.filterScope) &&
        (!this.filterStatus || f.status === this.filterStatus)
      )
    }
  },
  methods: {
    countByStatus(s) { return this.factors.filter(f => f.status === s).length },
    previewFactor(row) { this.current = row; this.previewVisible = true },
    openAdd() {
      this.editForm = { name: '', keyword: '', value: '', unit: '', scope: '', lab: '', reportNo: '', expireDate: '' }
      this.editVisible = true
    },
    submitAdd() {
      if (!this.editForm.name || !this.editForm.keyword || !this.editForm.value || !this.editForm.unit) {
        this.$message.warning('请填写因子名称、匹配关键词、实测值与单位')
        return
      }
      this.factors.unshift({
        code: 'EF-' + String(this.factors.length + 101).padStart(3, '0'),
        name: this.editForm.name,
        keyword: this.editForm.keyword,
        value: this.editForm.value,
        unit: this.editForm.unit,
        scope: this.editForm.scope || '厂区 · 全厂',
        lab: this.editForm.lab || '—',
        reportNo: this.editForm.reportNo || '—',
        testDate: new Date().toISOString().slice(0, 10),
        expireDate: this.editForm.expireDate || '—',
        status: '有效',
        references: []
      })
      this.editVisible = false
      this.$message.success('实测因子已入库，凭证有效期内将以 P-1 优先级参与因子匹配')
    },
    deleteFactor(row) {
      if (row.references && row.references.length) {
        this.$message.warning('因子被 ' + row.references.length + ' 条核算/命中记录引用，请先解除引用关系')
        return
      }
      this.$confirm('确认删除因子「' + row.name + '」？', '删除确认', { type: 'warning' }).then(() => {
        this.factors = this.factors.filter(f => f.code !== row.code)
        this.$message.success('因子已删除')
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.enterprise-factor-library-page { padding: 20px 24px; height: 100%; overflow-y: auto; box-sizing: border-box; background: #f5f7fa; }
.page-header { margin-bottom: 12px; }
.page-title { font-size: 20px; color: #1e293b; margin: 0 0 6px; display: flex; align-items: center; gap: 8px; }
.page-desc { font-size: 13px; color: #64748b; margin: 0; }
.chain-note { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #0067FE; background: #f0f7ff; border: 1px solid #cfe3ff; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; }
.chain-note b { color: #0052CC; }
.toolbar { display: flex; align-items: center; margin-bottom: 14px; }
.table-wrapper { background: #fff; border-radius: 8px; padding: 14px 16px 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.table-title-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.table-title-text { font-size: 14px; font-weight: 700; color: #1e293b; }
.table-title-count { font-size: 13px; color: #909399; }
.code-font { font-family: 'Exo 2', monospace; font-size: 13px; color: #475569; }
.lab-font { font-size: 13px; color: #475569; }
.btn-danger { color: #f56c6c; }
.detail-content { padding-bottom: 20px; }
</style>
