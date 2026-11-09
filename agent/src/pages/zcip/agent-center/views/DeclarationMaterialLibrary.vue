<template>
  <div class="declaration-material-library-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title"><i class="el-icon-folder-opened"></i> 佐证材料库</h2>
        <p class="page-desc">企业佐证材料的统一存证与引用中心：企业资质、审计报告、CMA/CNAS 检测证书、凭证等——申报场景按材料清单取件，核算与报送场景的引用关系全程留痕可查（一份材料可被多个条件引用）</p>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="toolbar">
      <el-input placeholder="搜索材料名称、编号..." prefix-icon="el-icon-search" size="small" v-model="searchText" clearable style="width: 240px;"></el-input>
      <el-select v-model="filterType" placeholder="材料类型" size="small" clearable style="width: 150px; margin-left: 8px;">
        <el-option v-for="t in typeOptions" :key="t" :label="t" :value="t"></el-option>
      </el-select>
      <el-select v-model="filterStatus" placeholder="有效性" size="small" clearable style="width: 120px; margin-left: 8px;">
        <el-option label="有效" value="有效"></el-option>
        <el-option label="待更新" value="待更新"></el-option>
        <el-option label="已过期" value="已过期"></el-option>
      </el-select>
      <el-button size="small" type="primary" icon="el-icon-plus" style="margin-left: 8px;" @click="openAdd">上传材料</el-button>
    </div>

    <!-- 材料列表 -->
    <div class="table-wrapper">
      <div class="table-title-bar">
        <span class="table-title-text">材料清单</span>
        <span class="table-title-count">共 {{ filteredMaterials.length }} 份</span>
      </div>
      <el-table :data="filteredMaterials" border stripe size="small" style="width: 100%;">
        <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
        <el-table-column label="材料编号" prop="code" width="140" align="center">
          <template slot-scope="{ row }"><span class="code-font">{{ row.code }}</span></template>
        </el-table-column>
        <el-table-column label="材料名称" prop="name" min-width="220" show-overflow-tooltip></el-table-column>
        <el-table-column label="类型" prop="type" width="110" align="center">
          <template slot-scope="{ row }"><el-tag size="mini" effect="plain">{{ row.type }}</el-tag></template>
        </el-table-column>
        <el-table-column label="申报主体" prop="subject" min-width="160" show-overflow-tooltip></el-table-column>
        <el-table-column label="有效期至" prop="expireDate" width="110" align="center"></el-table-column>
        <el-table-column label="有效性" width="90" align="center">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="row.status === '有效' ? 'success' : row.status === '待更新' ? 'warning' : 'danger'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="被引用" min-width="200">
          <template slot-scope="{ row }">
            <el-tag v-for="ref in row.references" :key="ref" size="mini" type="info" effect="plain" style="margin:1px;">{{ ref }}</el-tag>
            <span v-if="!row.references || !row.references.length" style="color:#c0c4cc;">未被引用</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="mini" @click="previewMaterial(row)">预览</el-button>
            <el-button type="text" size="mini" class="btn-danger" @click="deleteMaterial(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 预览抽屉 -->
    <el-drawer title="材料详情" :visible.sync="previewVisible" size="440px" append-to-body>
      <div v-if="current" class="detail-content" style="padding: 0 20px;">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="材料编号">{{ current.code }}</el-descriptions-item>
          <el-descriptions-item label="材料名称">{{ current.name }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ current.type }}</el-descriptions-item>
          <el-descriptions-item label="申报主体">{{ current.subject }}</el-descriptions-item>
          <el-descriptions-item label="上传时间">{{ current.uploadTime }}</el-descriptions-item>
          <el-descriptions-item label="有效期至">{{ current.expireDate }}</el-descriptions-item>
          <el-descriptions-item label="有效性"><el-tag size="mini" :type="current.status === '有效' ? 'success' : 'warning'">{{ current.status }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="被引用条件">{{ (current.references || []).join('；') || '—' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>

    <!-- 上传对话框 -->
    <el-dialog title="上传申报材料" :visible.sync="editVisible" width="520px" append-to-body>
      <el-form :model="editForm" label-width="100px" size="small">
        <el-form-item label="材料名称" required>
          <el-input v-model="editForm.name" placeholder="如：法定代表人零碳工厂申报承诺书"></el-input>
        </el-form-item>
        <el-form-item label="材料类型" required>
          <el-select v-model="editForm.type" style="width: 100%;">
            <el-option v-for="t in typeOptions" :key="t" :label="t" :value="t"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="申报主体" required>
          <el-input v-model="editForm.subject" placeholder="如：绿算智算中心"></el-input>
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
  name: 'DeclarationMaterialLibrary',
  data() {
    return {
      searchText: '',
      filterType: '',
      filterStatus: '',
      typeOptions: ['承诺书', '资格证明', '检测报告', '凭证', '证书', '图纸文件'],
      previewVisible: false,
      editVisible: false,
      current: null,
      editForm: { name: '', type: '', subject: '', expireDate: '' },
      materials: [
        { code: 'PM-001', name: '法定代表人零碳工厂申报承诺书', type: '承诺书', subject: '绿算智算中心', uploadTime: '2026-07-02', expireDate: '2027-07-01', status: '有效', references: ['合法性承诺', '数据真实性承诺', '不重复申报承诺'] },
        { code: 'PM-002', name: '独立供配电系统设施图纸', type: '图纸文件', subject: '绿算智算中心', uploadTime: '2026-07-02', expireDate: '—', status: '有效', references: ['拥有独立供配电和制冷系统'] },
        { code: 'PM-003', name: 'PUE年度检测报告（2025）', type: '检测报告', subject: '绿算智算中心', uploadTime: '2026-07-05', expireDate: '2027-07-04', status: '有效', references: ['电能利用效率达GB 40879 2级及以上'] },
        { code: 'PM-004', name: '机架规模审计材料', type: '凭证', subject: '绿算智算中心', uploadTime: '2026-07-05', expireDate: '—', status: '有效', references: ['规模≥3000个标准机架'] },
        { code: 'PM-005', name: '能碳管理中心验收证明', type: '资格证明', subject: '绿算智算中心', uploadTime: '2026-06-20', expireDate: '—', status: '有效', references: ['能碳管理中心已建成'] },
        { code: 'PM-006', name: '绿电交易合同（2025年度）', type: '凭证', subject: '绿算智算中心', uploadTime: '2026-01-15', expireDate: '2026-12-31', status: '有效', references: ['绿电消费占比核算'] },
        { code: 'PM-007', name: '自建光伏并网凭证', type: '凭证', subject: '绿算智算中心', uploadTime: '2026-01-15', expireDate: '—', status: '有效', references: ['自建光伏装机容量'] },
        { code: 'PM-008', name: 'ISO 50001能源管理体系证书', type: '证书', subject: '绿算智算中心', uploadTime: '2025-11-08', expireDate: '2026-11-07', status: '待更新', references: ['能源管理体系认证'] },
        { code: 'PM-009', name: '上年度综合能耗统计报表', type: '凭证', subject: '绿算智算中心', uploadTime: '2026-02-10', expireDate: '—', status: '有效', references: ['年综合能耗≥1000吨标准煤'] },
        { code: 'PM-010', name: '行业能效对标结果报告', type: '检测报告', subject: '绿算智算中心', uploadTime: '2026-03-01', expireDate: '—', status: '有效', references: ['主要产品单位能耗达行业标杆'] },
        { code: 'PM-011', name: '碳排放信息披露报告（2024版）', type: '检测报告', subject: '绿算智算中心', uploadTime: '2025-04-12', expireDate: '2026-04-11', status: '已过期', references: ['碳排放信息披露透明度与质量'] }
      ]
    }
  },
  computed: {
    filteredMaterials() {
      return this.materials.filter(m =>
        (!this.searchText || m.name.includes(this.searchText) || m.code.includes(this.searchText)) &&
        (!this.filterType || m.type === this.filterType) &&
        (!this.filterStatus || m.status === this.filterStatus)
      )
    }
  },
  methods: {
    previewMaterial(row) { this.current = row; this.previewVisible = true },
    openAdd() {
      this.editForm = { name: '', type: '', subject: '', expireDate: '' }
      this.editVisible = true
    },
    submitAdd() {
      if (!this.editForm.name || !this.editForm.type || !this.editForm.subject) {
        this.$message.warning('请填写材料名称、类型与申报主体')
        return
      }
      this.materials.unshift({
        code: 'PM-' + String(this.materials.length + 101).padStart(3, '0'),
        name: this.editForm.name,
        type: this.editForm.type,
        subject: this.editForm.subject,
        uploadTime: new Date().toISOString().slice(0, 10),
        expireDate: this.editForm.expireDate || '—',
        status: '有效',
        references: []
      })
      this.editVisible = false
      this.$message.success('材料已入库')
    },
    deleteMaterial(row) {
      if (row.references && row.references.length) {
        this.$message.warning('材料被 ' + row.references.length + ' 个申报条件引用，请先解除引用关系')
        return
      }
      this.$confirm('确认删除材料"' + row.name + '"？', '删除确认', { type: 'warning' }).then(() => {
        this.materials = this.materials.filter(m => m.code !== row.code)
        this.$message.success('材料已删除')
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.declaration-material-library-page { padding: 20px 24px; height: 100%; overflow-y: auto; box-sizing: border-box; background: #f5f7fa; }
.page-header { margin-bottom: 16px; }
.page-title { font-size: 20px; color: #1e293b; margin: 0 0 6px; display: flex; align-items: center; gap: 8px; }
.page-desc { font-size: 13px; color: #64748b; margin: 0; }
.toolbar { display: flex; align-items: center; margin-bottom: 14px; }
.table-wrapper { background: #fff; border-radius: 8px; padding: 14px 16px 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.table-title-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.table-title-text { font-size: 14px; font-weight: 700; color: #1e293b; }
.table-title-count { font-size: 12px; color: #909399; }
.code-font { font-family: 'Exo 2', monospace; font-size: 12px; color: #475569; }
.btn-danger { color: #f56c6c; }
.detail-content { padding-bottom: 20px; }
</style>
