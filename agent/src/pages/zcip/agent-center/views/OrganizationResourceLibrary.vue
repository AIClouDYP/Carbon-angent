<template>
  <div class="org-resource-page">
    <!-- 页头 -->
    <div class="page-header">
      <h2 class="page-title"><i class="el-icon-office-building"></i> 组织资源库</h2>
    </div>

    <!-- 主体区域：左树右表 -->
    <div class="main-body">
      <!-- 左侧资源导航 -->
      <div class="left-nav">
        <!-- 三页签 -->
        <el-tabs v-model="activeTab" class="nav-tabs" @tab-click="onTabChange">
          <el-tab-pane label="组织区域" name="orgArea">
            <el-tree
              ref="orgTree"
              :data="orgTreeData"
              :props="treeProps"
              node-key="id"
              :current-node-key="currentTreeNode"
              highlight-current
              @node-click="onTreeNodeClick"
            >
              <span slot-scope="{ node, data }" class="tree-node">
                <i :class="data.icon" class="tree-node-icon"></i>
                <span class="tree-node-label">{{ node.label }}</span>
                <span class="tree-node-count" v-if="data.count > 0">{{ data.count }}</span>
              </span>
            </el-tree>
          </el-tab-pane>
          <el-tab-pane label="建筑空间" name="building">
            <el-tree
              ref="buildingTree"
              :data="buildingTreeData"
              :props="treeProps"
              node-key="id"
              :current-node-key="currentTreeNode"
              highlight-current
              @node-click="onTreeNodeClick"
            >
              <span slot-scope="{ node, data }" class="tree-node">
                <i :class="data.icon" class="tree-node-icon"></i>
                <span class="tree-node-label">{{ node.label }}</span>
                <span class="tree-node-count" v-if="data.count > 0">{{ data.count }}</span>
              </span>
            </el-tree>
          </el-tab-pane>
          <el-tab-pane label="设备设施" name="equipment">
            <el-tree
              ref="equipmentTree"
              :data="equipmentTreeData"
              :props="treeProps"
              node-key="id"
              :default-expanded-keys="['equip-virtual', 'equip-entity']"
              :current-node-key="currentTreeNode"
              highlight-current
              @node-click="onTreeNodeClick"
            >
              <span slot-scope="{ node, data }" class="tree-node">
                <i :class="data.icon" class="tree-node-icon"></i>
                <span class="tree-node-label">{{ node.label }}</span>
                <span class="tree-node-count" v-if="data.count > 0">{{ data.count }}</span>
              </span>
            </el-tree>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 右侧资源表格 -->
      <div class="right-table">
        <!-- 搜索栏 -->
        <div class="toolbar">
          <el-input placeholder="搜索资源名称、编码..." prefix-icon="el-icon-search" size="small" v-model="searchText" clearable style="width: 240px;"></el-input>
          <el-button type="primary" size="small" icon="el-icon-plus" @click="openAddDialog">新增资源</el-button>
        </div>

        <!-- 属性筛选栏 -->
        <div class="filter-bar" v-if="currentFilter.category === '设备设施'">
          <span class="filter-label">属性筛选：</span>
          <el-checkbox-group v-model="attrFilters" size="small" @change="onAttrFilterChange">
            <el-checkbox label="isPublicFacility">公共设施</el-checkbox>
            <el-checkbox label="isEmissionSource">排放源</el-checkbox>
            <el-checkbox label="hasMeteringPoint">计量点</el-checkbox>
          </el-checkbox-group>
        </div>

        <!-- 资源表格 -->
        <div class="table-wrapper">
          <div class="table-title-bar">
            <span class="table-title-text">{{ currentTreeLabel }}</span>
            <div class="filter-tags" v-if="activeFilters.length > 0">
              <el-tag v-for="f in activeFilters" :key="f.key" size="mini" closable @close="removeFilter(f.key)">{{ f.label }}</el-tag>
            </div>
          </div>
          <div class="table-scroll">
          <el-table :data="pagedResources" border size="small" stripe style="width: 100%;" :header-cell-style="headerCellStyle">
            <el-table-column label="序号" type="index" width="55" align="center"></el-table-column>
            <el-table-column label="资源编码" prop="id" width="100"></el-table-column>
            <el-table-column label="资源名称" min-width="160" show-overflow-tooltip>
              <template slot-scope="{ row }">
                <span class="resource-name-cell">{{ row.name }}</span>
                <el-tag v-if="row.isComposite" size="mini" type="warning" class="composite-tag">组合</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="资源分类" width="90">
              <template slot-scope="{ row }">
                <el-tag size="mini" :type="categoryTagType(row.category)">{{ row.category }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="子类" width="80">
              <template slot-scope="{ row }">
                <span v-if="row.subCategory">{{ row.subCategory }}</span>
                <span v-else class="text-placeholder">—</span>
              </template>
            </el-table-column>
            <el-table-column label="属性" width="120">
              <template slot-scope="{ row }">
                <el-tag v-if="row.isPublicFacility" size="mini" type="success" class="attr-tag">公共</el-tag>
                <el-tag v-if="row.isEmissionSource" size="mini" type="danger" class="attr-tag">排放</el-tag>
                <el-tag v-if="row.hasMeteringPoint" size="mini" type="info" class="attr-tag">计量</el-tag>
                <span v-if="!row.isPublicFacility && !row.isEmissionSource && !row.hasMeteringPoint" class="text-placeholder">—</span>
              </template>
            </el-table-column>
            <el-table-column label="所属组织" width="130" show-overflow-tooltip>
              <template slot-scope="{ row }">
                <span v-if="row.org">{{ row.org }}</span>
                <span v-else class="text-placeholder">—</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="65" align="center">
              <template slot-scope="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'" size="mini">{{ row.enabled ? '启用' : '停用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" align="center" fixed="right">
              <template slot-scope="{ row }">
                <el-button type="text" size="mini" @click="viewDetail(row)"><i class="el-icon-view"></i> 查看</el-button>
                <el-button type="text" size="mini" @click="openEditDialog(row)">编辑</el-button>
                <el-button type="text" size="mini" class="btn-danger" @click="deleteResource(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <!-- 空状态 -->
          <div v-if="filteredResources.length === 0" class="empty-state">
            <i class="el-icon-folder-opened"></i>
            <p>暂无资源数据</p>
            <span>点击右上角「新增资源」开始登记</span>
          </div>
          </div>
          <!-- 分页 -->
          <div class="pagination-bar" v-if="filteredResources.length > 0">
            <el-pagination
              background
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredResources.length"
              :page-sizes="[10, 20, 50]"
              :page-size="pageSize"
              :current-page="currentPage"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            ></el-pagination>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="editMode ? '编辑资源' : '新增资源'" :visible.sync="dialogVisible" width="640px" append-to-body custom-class="resource-dialog">
      <el-form :model="formData" label-width="110px" size="small">
        <el-divider content-position="left"><span class="divider-label">基本信息</span></el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="资源分类" required>
              <el-select v-model="formData.category" placeholder="请选择" style="width: 100%;" @change="onCategoryChange">
                <el-option label="组织区域" value="组织区域"></el-option>
                <el-option label="建筑空间" value="建筑空间"></el-option>
                <el-option label="设备设施" value="设备设施"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资源名称" required>
              <el-input v-model="formData.name" placeholder="如：精密制造生产线 / 数控加工中心 / 智能制造厂房A区"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16" v-if="formData.category === '设备设施'">
          <el-col :span="12">
            <el-form-item label="子类" required>
              <el-select v-model="formData.subCategory" placeholder="请选择" style="width: 100%;">
                <el-option label="虚拟资源" value="虚拟资源"></el-option>
                <el-option label="实体资源" value="实体资源"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="formData.subCategory === '虚拟资源'">
            <el-form-item label="组合资源">
              <el-switch v-model="formData.isComposite" active-text="是" inactive-text="否"></el-switch>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16" v-if="formData.category === '设备设施' && formData.subCategory === '虚拟资源' && formData.isComposite">
          <el-col :span="24">
            <el-form-item label="组成设备">
              <el-select v-model="formData.components" multiple placeholder="选择组成设备" style="width: 100%;">
                <el-option v-for="r in entityResources" :key="r.id" :label="r.name" :value="r.id"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16" v-if="formData.category === '设备设施' && formData.subCategory === '实体资源'">
          <el-col :span="8">
            <el-form-item label="公共设施">
              <el-switch v-model="formData.isPublicFacility" active-text="是" inactive-text="否"></el-switch>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排放源">
              <el-switch v-model="formData.isEmissionSource" active-text="是" inactive-text="否"></el-switch>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="计量点">
              <el-switch v-model="formData.hasMeteringPoint" active-text="是" inactive-text="否"></el-switch>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属组织">
              <el-input v-model="formData.org" placeholder="如：北京亦庄投资控股有限公司"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="建筑空间" v-if="formData.category === '设备设施'">
              <el-input v-model="formData.building" placeholder="如：智能制造厂房A区 2层"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="资源描述">
          <el-input v-model="formData.desc" type="textarea" :rows="2" placeholder="资源内容简要说明"></el-input>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="formData.enabled" active-text="启用" inactive-text="停用"></el-switch>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveResource">确定</el-button>
      </div>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer title="资源详情" :visible.sync="drawerVisible" size="520px" append-to-body>
      <div class="detail-content" v-if="currentResource">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="资源编码">{{ currentResource.id }}</el-descriptions-item>
          <el-descriptions-item label="资源名称">
            {{ currentResource.name }}
            <el-tag v-if="currentResource.isComposite" size="mini" type="warning" style="margin-left: 8px;">组合资源</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="资源分类">{{ currentResource.category }}</el-descriptions-item>
          <el-descriptions-item label="子类">{{ currentResource.subCategory || '—' }}</el-descriptions-item>
          <el-descriptions-item label="属性标签">
            <el-tag v-if="currentResource.isPublicFacility" size="mini" type="success" style="margin-right: 4px;">公共设施</el-tag>
            <el-tag v-if="currentResource.isEmissionSource" size="mini" type="danger" style="margin-right: 4px;">排放源</el-tag>
            <el-tag v-if="currentResource.hasMeteringPoint" size="mini" type="info" style="margin-right: 4px;">计量点</el-tag>
            <span v-if="!currentResource.isPublicFacility && !currentResource.isEmissionSource && !currentResource.hasMeteringPoint">—</span>
          </el-descriptions-item>
          <el-descriptions-item label="所属组织">{{ currentResource.org || '—' }}</el-descriptions-item>
          <el-descriptions-item label="建筑空间">{{ currentResource.building || '—' }}</el-descriptions-item>
          <el-descriptions-item label="组成设备" v-if="currentResource.components && currentResource.components.length > 0">
            <div v-for="cid in currentResource.components" :key="cid" class="component-item">
              {{ getResourceName(cid) }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="资源描述">{{ currentResource.desc || '—' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentResource.enabled ? 'success' : 'info'" size="mini">{{ currentResource.enabled ? '已启用' : '已停用' }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>

<script>
export default {
  name: 'OrganizationResourceLibrary',
  data() {
    return {
      resources: [],
      searchText: '',
      activeTab: 'orgArea',
      dialogVisible: false,
      drawerVisible: false,
      editMode: false,
      currentPage: 1,
      pageSize: 10,
      currentResource: null,
      currentTreeNode: '',
      currentTreeLabel: '组织区域',
      currentFilter: { category: '组织区域', subCategory: '', isPublicFacility: null, isEmissionSource: null, org: '' },
      attrFilters: [],
      headerCellStyle: { background: 'var(--bg-hover, #f8fafc)', color: 'var(--text-primary, #0f172a)', fontWeight: 600, textAlign: 'center' },
      formData: this.emptyForm(),
      treeProps: { label: 'label', children: 'children' }
    }
  },
  computed: {
    entityResources() {
      return this.resources.filter(r => r.category === '设备设施' && r.subCategory === '实体资源')
    },
    orgTreeData() {
      const orgs = [...new Set(this.resources.filter(r => r.category === '组织区域').map(r => r.org).filter(Boolean))]
      return orgs.map(org => ({
        id: 'org-' + org, label: org, icon: 'el-icon-office-building',
        count: this.resources.filter(r => r.category === '组织区域' && r.org === org).length,
        category: '组织区域', org
      }))
    },
    buildingTreeData() {
      const buildings = [...new Set(this.resources.filter(r => r.category === '建筑空间').map(r => r.name).filter(Boolean))]
      return buildings.map(b => ({
        id: 'building-' + b, label: b, icon: 'el-icon-school',
        count: this.resources.filter(r => r.category === '建筑空间' && r.name === b).length,
        category: '建筑空间', name: b
      }))
    },
    equipmentTreeData() {
      const virtualCount = this.resources.filter(r => r.category === '设备设施' && r.subCategory === '虚拟资源').length
      const entityCount = this.resources.filter(r => r.category === '设备设施' && r.subCategory === '实体资源').length
      return [
        { id: 'equip-virtual', label: '虚拟资源', icon: 'el-icon-share', count: virtualCount, category: '设备设施', subCategory: '虚拟资源' },
        { id: 'equip-entity', label: '实体资源', icon: 'el-icon-cpu', count: entityCount, category: '设备设施', subCategory: '实体资源' }
      ]
    },
    activeFilters() {
      const filters = []
      if (this.currentFilter.subCategory) filters.push({ key: 'subCategory', label: this.currentFilter.subCategory })
      if (this.currentFilter.org) filters.push({ key: 'org', label: this.currentFilter.org })
      if (this.attrFilters.includes('isPublicFacility')) filters.push({ key: 'attr-isPublicFacility', label: '公共设施' })
      if (this.attrFilters.includes('isEmissionSource')) filters.push({ key: 'attr-isEmissionSource', label: '排放源' })
      if (this.attrFilters.includes('hasMeteringPoint')) filters.push({ key: 'attr-hasMeteringPoint', label: '计量点' })
      return filters
    },
    filteredResources() {
      let result = this.resources
      // 分类过滤
      if (this.currentFilter.category) {
        result = result.filter(r => r.category === this.currentFilter.category)
      }
      // 子类过滤
      if (this.currentFilter.subCategory) {
        result = result.filter(r => r.subCategory === this.currentFilter.subCategory)
      }
      // 属性筛选（复选框）
      if (this.attrFilters.includes('isPublicFacility')) {
        result = result.filter(r => r.isPublicFacility === true)
      }
      if (this.attrFilters.includes('isEmissionSource')) {
        result = result.filter(r => r.isEmissionSource === true)
      }
      if (this.attrFilters.includes('hasMeteringPoint')) {
        result = result.filter(r => r.hasMeteringPoint === true)
      }
      // 组织过滤
      if (this.currentFilter.org) {
        result = result.filter(r => r.org === this.currentFilter.org)
      }
      // 建筑空间过滤
      if (this.currentFilter.building) {
        result = result.filter(r => r.name === this.currentFilter.building)
      }
      // 搜索文本过滤
      if (this.searchText) {
        result = result.filter(r => r.name.includes(this.searchText) || r.id.includes(this.searchText))
      }
      return result
    },
    pagedResources() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.filteredResources.slice(start, start + this.pageSize)
    }
  },
  mounted() {
    this.loadResources()
  },
  methods: {
    emptyForm() {
      return {
        name: '', category: '设备设施', subCategory: '', isComposite: false, components: [],
        isPublicFacility: false, isEmissionSource: false, hasMeteringPoint: false,
        org: '', building: '', desc: '', enabled: true
      }
    },
    loadResources() {
      try {
        const saved = localStorage.getItem('org_resources_v3')
        if (saved) {
          this.resources = JSON.parse(saved)
        }
        if (!this.resources || this.resources.length === 0) {
          this.resources = [
            // 组织区域
            { id: 'ORG-001', name: '北京亦庄投资控股有限公司', category: '组织区域', subCategory: '', isComposite: false, components: [], isPublicFacility: false, isEmissionSource: false, hasMeteringPoint: false, org: '北京亦庄投资控股有限公司', building: '', desc: '亦庄零碳园区运营主体，负责园区整体规划与能源管理', enabled: true },
            { id: 'ORG-002', name: '亦庄零碳园区入驻企业联盟', category: '组织区域', subCategory: '', isComposite: false, components: [], isPublicFacility: false, isEmissionSource: false, hasMeteringPoint: false, org: '亦庄零碳园区入驻企业联盟', building: '', desc: '园区内全部入驻企业集合，含京东方、中芯国际、北汽新能源等', enabled: true },
            // 建筑空间
            { id: 'BLD-001', name: '智能制造厂房A区', category: '建筑空间', subCategory: '', isComposite: false, components: [], isPublicFacility: false, isEmissionSource: false, hasMeteringPoint: false, org: '北京亦庄投资控股有限公司', building: '', desc: '园区核心生产区域，含精密制造与装配车间', enabled: true },
            { id: 'BLD-002', name: '研发办公综合楼', category: '建筑空间', subCategory: '', isComposite: false, components: [], isPublicFacility: false, isEmissionSource: false, hasMeteringPoint: false, org: '北京亦庄投资控股有限公司', building: '', desc: '园区企业研发与行政办公区域', enabled: true },
            { id: 'BLD-003', name: '能源中心站房', category: '建筑空间', subCategory: '', isComposite: false, components: [], isPublicFacility: false, isEmissionSource: false, hasMeteringPoint: false, org: '北京亦庄投资控股有限公司', building: '', desc: '园区集中供能设施，含配电、制冷、供热设备', enabled: true },
            // 设备设施-虚拟资源
            { id: 'EQ-V001', name: '精密制造生产线', category: '设备设施', subCategory: '虚拟资源', isComposite: true, components: ['EQ-E001', 'EQ-E002', 'EQ-E003'], isPublicFacility: false, isEmissionSource: false, hasMeteringPoint: true, org: '亦庄零碳园区入驻企业联盟', building: '智能制造厂房A区 1层', desc: '含数控加工中心3台、自动导引车2辆、检测工位4个', enabled: true },
            { id: 'EQ-V002', name: '表面处理后处理线', category: '设备设施', subCategory: '虚拟资源', isComposite: true, components: ['EQ-E004', 'EQ-E005', 'EQ-E006'], isPublicFacility: false, isEmissionSource: true, hasMeteringPoint: true, org: '亦庄零碳园区入驻企业联盟', building: '智能制造厂房A区 2层', desc: '含清洗槽2个、烘干炉1台、废气回收装置1套', enabled: true },
            { id: 'EQ-V003', name: '装配检测流水线', category: '设备设施', subCategory: '虚拟资源', isComposite: true, components: ['EQ-E007', 'EQ-E008'], isPublicFacility: false, isEmissionSource: false, hasMeteringPoint: true, org: '亦庄零碳园区入驻企业联盟', building: '智能制造厂房A区 3层', desc: '含自动拧紧设备6台、视觉检测台2个、输送线1条', enabled: true },
            // 设备设施-实体资源-公共设施
            { id: 'EQ-E009', name: '园区智慧照明系统', category: '设备设施', subCategory: '实体资源', isComposite: false, components: [], isPublicFacility: true, isEmissionSource: false, hasMeteringPoint: true, org: '北京亦庄投资控股有限公司', building: '园区主干道', desc: '园区道路及广场LED智慧照明', enabled: true },
            { id: 'EQ-E010', name: '再生水供水泵站', category: '设备设施', subCategory: '实体资源', isComposite: false, components: [], isPublicFacility: true, isEmissionSource: false, hasMeteringPoint: true, org: '北京亦庄投资控股有限公司', building: '能源中心站房', desc: '园区再生水回用供水系统', enabled: true },
            { id: 'EQ-E011', name: '园区污水处理站', category: '设备设施', subCategory: '实体资源', isComposite: false, components: [], isPublicFacility: true, isEmissionSource: true, hasMeteringPoint: true, org: '北京亦庄投资控股有限公司', building: '园区西北角', desc: '园区工业废水与生活污水集中处理', enabled: true },
            // 设备设施-实体资源-非公共设施
            { id: 'EQ-E001', name: '数控加工中心#1', category: '设备设施', subCategory: '实体资源', isComposite: false, components: [], isPublicFacility: false, isEmissionSource: false, hasMeteringPoint: true, org: '亦庄零碳园区入驻企业联盟', building: '智能制造厂房A区 1层', desc: '五轴联动数控加工中心', enabled: true },
            { id: 'EQ-E002', name: '数控加工中心#2', category: '设备设施', subCategory: '实体资源', isComposite: false, components: [], isPublicFacility: false, isEmissionSource: false, hasMeteringPoint: true, org: '亦庄零碳园区入驻企业联盟', building: '智能制造厂房A区 1层', desc: '五轴联动数控加工中心', enabled: true },
            { id: 'EQ-E003', name: '自动导引车#1', category: '设备设施', subCategory: '实体资源', isComposite: false, components: [], isPublicFacility: false, isEmissionSource: false, hasMeteringPoint: true, org: '亦庄零碳园区入驻企业联盟', building: '智能制造厂房A区 1层', desc: 'AGV物料自动搬运', enabled: true },
            { id: 'EQ-E004', name: '超声波清洗槽#1', category: '设备设施', subCategory: '实体资源', isComposite: false, components: [], isPublicFacility: false, isEmissionSource: true, hasMeteringPoint: true, org: '亦庄零碳园区入驻企业联盟', building: '智能制造厂房A区 2层', desc: '精密零件超声波清洗', enabled: true },
            { id: 'EQ-E005', name: '热风循环烘干炉', category: '设备设施', subCategory: '实体资源', isComposite: false, components: [], isPublicFacility: false, isEmissionSource: true, hasMeteringPoint: true, org: '亦庄零碳园区入驻企业联盟', building: '智能制造厂房A区 2层', desc: '电加热热风循环烘干', enabled: true },
            { id: 'EQ-E006', name: 'VOCs废气回收装置', category: '设备设施', subCategory: '实体资源', isComposite: false, components: [], isPublicFacility: false, isEmissionSource: false, hasMeteringPoint: true, org: '亦庄零碳园区入驻企业联盟', building: '智能制造厂房A区 2层', desc: '表面处理废气活性炭吸附回收', enabled: true },
            { id: 'EQ-E007', name: '自动拧紧设备#1', category: '设备设施', subCategory: '实体资源', isComposite: false, components: [], isPublicFacility: false, isEmissionSource: false, hasMeteringPoint: true, org: '亦庄零碳园区入驻企业联盟', building: '智能制造厂房A区 3层', desc: '装配线高精度自动拧紧', enabled: true },
            { id: 'EQ-E008', name: '视觉检测台#1', category: '设备设施', subCategory: '实体资源', isComposite: false, components: [], isPublicFacility: false, isEmissionSource: false, hasMeteringPoint: true, org: '亦庄零碳园区入驻企业联盟', building: '智能制造厂房A区 3层', desc: '产品外观与尺寸自动检测', enabled: true },
            { id: 'EQ-E012', name: '离心式空压机#1', category: '设备设施', subCategory: '实体资源', isComposite: false, components: [], isPublicFacility: false, isEmissionSource: false, hasMeteringPoint: true, org: '亦庄零碳园区入驻企业联盟', building: '能源中心站房', desc: '90kW离心式空气压缩机', enabled: true },
            { id: 'EQ-E013', name: '注塑成型机#1', category: '设备设施', subCategory: '实体资源', isComposite: false, components: [], isPublicFacility: false, isEmissionSource: false, hasMeteringPoint: true, org: '亦庄零碳园区入驻企业联盟', building: '智能制造厂房A区 1层', desc: '500吨精密注塑成型', enabled: true },
            { id: 'EQ-E014', name: '屋顶分布式光伏', category: '设备设施', subCategory: '实体资源', isComposite: false, components: [], isPublicFacility: false, isEmissionSource: false, hasMeteringPoint: true, org: '北京亦庄投资控股有限公司', building: '园区建筑屋顶', desc: '2MW分布式光伏发电系统', enabled: true },
            { id: 'EQ-E015', name: '储能电池系统', category: '设备设施', subCategory: '实体资源', isComposite: false, components: [], isPublicFacility: false, isEmissionSource: false, hasMeteringPoint: true, org: '北京亦庄投资控股有限公司', building: '能源中心站房', desc: '500kWh磷酸铁锂储能系统', enabled: true }
          ]
          this.persist()
        }
      } catch (e) { /* ignore */ }
    },
    persist() {
      try { localStorage.setItem('org_resources_v3', JSON.stringify(this.resources)) } catch (e) { /* ignore */ }
    },
    onTabChange(tab) {
      const map = { orgArea: '组织区域', building: '建筑空间', equipment: '设备设施' }
      this.currentFilter.category = map[tab.name]
      this.currentFilter.subCategory = ''
      this.currentFilter.isPublicFacility = null
      this.currentFilter.isEmissionSource = null
      this.currentFilter.org = ''
      this.currentFilter.building = ''
      this.attrFilters = []
      this.currentTreeLabel = map[tab.name]
      this.currentPage = 1
      // 清空树选中，展示全部
      this.currentTreeNode = ''
      this.$nextTick(() => {
        const treeRef = tab.name === 'orgArea' ? 'orgTree' : tab.name === 'building' ? 'buildingTree' : 'equipmentTree'
        if (this.$refs[treeRef]) this.$refs[treeRef].setCurrentKey(null)
      })
    },
    onTreeNodeClick(data) {
      this.currentTreeNode = data.id
      this.currentPage = 1
      // 设置过滤条件
      this.currentFilter.subCategory = data.subCategory || ''
      this.currentFilter.org = data.org || ''
      this.currentFilter.building = data.name || ''
      // 设置标签
      this.currentTreeLabel = data.label
    },
    onAttrFilterChange() {
      this.currentPage = 1
    },
    removeFilter(key) {
      if (key === 'subCategory') this.currentFilter.subCategory = ''
      if (key === 'org') this.currentFilter.org = ''
      if (key === 'attr-isPublicFacility') this.attrFilters = this.attrFilters.filter(f => f !== 'isPublicFacility')
      if (key === 'attr-isEmissionSource') this.attrFilters = this.attrFilters.filter(f => f !== 'isEmissionSource')
      if (key === 'attr-hasMeteringPoint') this.attrFilters = this.attrFilters.filter(f => f !== 'hasMeteringPoint')
      this.currentPage = 1
    },
    resetFilter() {
      this.currentFilter = { category: this.currentFilter.category, subCategory: '', isPublicFacility: null, isEmissionSource: null, org: '', building: '' }
      this.attrFilters = []
      this.currentTreeLabel = this.currentFilter.category
      this.currentPage = 1
      this.currentTreeNode = ''
      const treeRef = this.activeTab === 'orgArea' ? 'orgTree' : this.activeTab === 'building' ? 'buildingTree' : 'equipmentTree'
      if (this.$refs[treeRef]) this.$refs[treeRef].setCurrentKey(null)
    },
    onCategoryChange() {
      this.formData.subCategory = ''
      this.formData.isComposite = false
      this.formData.components = []
      this.formData.isPublicFacility = false
      this.formData.isEmissionSource = false
      this.formData.hasMeteringPoint = false
    },
    getResourceName(id) {
      const r = this.resources.find(x => x.id === id)
      return r ? r.name : id
    },
    categoryTagType(category) {
      const map = { '组织区域': 'primary', '建筑空间': 'success', '设备设施': 'warning' }
      return map[category] || 'info'
    },
    openAddDialog() {
      this.editMode = false
      this.formData = this.emptyForm()
      this.formData.category = this.currentFilter.category
      // 从资源类型库加载默认属性
      this.loadTypeAttributes(this.currentFilter.category)
      this.dialogVisible = true
    },
    openEditDialog(row) {
      this.editMode = true
      this.formData = { ...this.emptyForm(), ...row }
      this.dialogVisible = true
    },
    loadTypeAttributes(category) {
      // 预置资源类型属性（替代原从 localStorage 读取）
      const presetAttributes = {
        '组织区域': { level: '' },
        '建筑空间': { usage: '' },
        '设备设施': { isPublicFacility: false, isEmissionSource: false, hasMeteringPoint: true }
      }
      const attrs = presetAttributes[category]
      if (attrs) {
        Object.keys(attrs).forEach(key => {
          if (!this.formData[key]) {
            this.$set(this.formData, key, attrs[key])
          }
        })
      }
    },
    viewDetail(row) {
      this.currentResource = row
      this.drawerVisible = true
    },
    saveResource() {
      if (!this.formData.name || !this.formData.category) {
        this.$message.warning('请填写资源名称和资源分类')
        return
      }
      if (this.formData.category === '设备设施' && !this.formData.subCategory) {
        this.$message.warning('设备设施请选择子类（虚拟资源/实体资源）')
        return
      }
      if (this.editMode) {
        const idx = this.resources.findIndex(r => r.id === this.formData.id)
        if (idx >= 0) Object.assign(this.resources[idx], this.formData)
      } else {
        const prefix = this.formData.category === '组织区域' ? 'ORG' : this.formData.category === '建筑空间' ? 'BLD' : this.formData.subCategory === '虚拟资源' ? 'EQ-V' : 'EQ-E'
        this.resources.unshift({
          ...this.formData,
          id: prefix + '-' + Date.now().toString().slice(-6)
        })
      }
      this.persist()
      this.dialogVisible = false
      this.$message.success(this.editMode ? '资源已更新' : '资源已新增')
    },
    deleteResource(row) {
      this.$confirm('确认删除资源"' + row.name + '"？', '删除确认', { type: 'warning' }).then(() => {
        this.resources = this.resources.filter(r => r.id !== row.id)
        this.persist()
        this.$message.success('已删除')
      }).catch(() => {})
    },
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
    },
    handlePageChange(val) {
      this.currentPage = val
    }
  }
}
</script>

<style scoped>
.org-resource-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 页头 */
.page-header {
  padding: 0 0 16px;
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}
.page-title i { color: var(--primary); }

/* 主体区域：左树右表 */
.main-body {
  flex: 1;
  display: flex;
  gap: 16px;
  overflow: hidden;
}

/* 左侧资源导航 */
.left-nav {
  width: 280px;
  flex-shrink: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.nav-tabs {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.nav-tabs >>> .el-tabs__content {
  flex: 1;
  overflow: auto;
  padding: 8px;
}
.nav-tabs >>> .el-tabs__header {
  margin-bottom: 0;
  border-bottom: 1px solid var(--border-color);
  padding: 0 12px;
}
.nav-tabs >>> .el-tabs__nav-wrap::after {
  display: none;
}
.nav-tabs >>> .el-tabs__nav {
  display: flex;
  width: 100%;
}
.nav-tabs >>> .el-tabs__item {
  font-size: 13px;
  height: 36px;
  line-height: 36px;
  flex: 1;
  text-align: center;
  padding: 0;
}
.left-nav >>> .el-tree {
  background: transparent;
}
.left-nav >>> .el-tree-node__content {
  height: 36px;
  border-radius: 4px;
}
.left-nav >>> .el-tree-node__content:hover {
  background: var(--bg-hover);
}
.left-nav >>> .el-tree-node.is-current > .el-tree-node__content {
  background: var(--primary-bg);
}
.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}
.tree-node-icon {
  font-size: 14px;
  color: var(--text-secondary);
}
.tree-node-label {
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tree-node-count {
  font-size: 13px;
  color: var(--text-muted);
  background: var(--bg-hover);
  padding: 2px 6px;
  border-radius: 10px;
}
.left-nav >>> .el-tree-node.is-current > .el-tree-node__content .tree-node-count {
  background: var(--primary);
  color: #fff;
}

/* 右侧表格区 */
.right-table {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 搜索栏 */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 0 12px;
  flex-shrink: 0;
}

/* 属性筛选栏 */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 12px;
  flex-shrink: 0;
}
.filter-label {
  font-size: 13px;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.filter-bar >>> .el-checkbox-group {
  display: flex;
  gap: 12px;
}
.filter-bar >>> .el-checkbox {
  margin-right: 0;
}
.filter-bar >>> .el-checkbox__label {
  font-size: 13px;
}

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
.filter-tags {
  display: flex;
  gap: 4px;
}
.table-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 4px 4px 0 4px;
}
.resource-name-cell {
  font-weight: 500;
  color: var(--text-primary);
}
.composite-tag {
  margin-left: 6px;
}
.attr-tag {
  margin-right: 4px;
  margin-bottom: 2px;
}
.text-placeholder { color: var(--text-placeholder); }
.btn-danger { color: var(--danger) !important; }

/* 分页 */
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-muted);
}
.empty-state i {
  font-size: 48px;
  margin-bottom: 12px;
  color: var(--text-placeholder);
}
.empty-state p {
  font-size: 14px;
  margin: 0 0 4px;
}
.empty-state span {
  font-size: 13px;
}

/* 对话框 */
.divider-label {
  font-size: 13px;
  color: var(--text-muted);
}

/* 详情抽屉 */
.detail-content {
  padding: 16px;
}
.component-item {
  padding: 4px 0;
  border-bottom: 1px dashed var(--border-color);
}
.component-item:last-child {
  border-bottom: none;
}
</style>
