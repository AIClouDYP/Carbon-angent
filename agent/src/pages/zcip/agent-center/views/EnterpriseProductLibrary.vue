<template>
  <div class="product-library-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title"><i class="el-icon-goods"></i> 产品与物料库</h2>
        <p class="page-desc">企业自产产品与外购供应链物料（原辅料 / 包装材料）的统一登记底座，为碳足迹核算与 LCA 建模提供产品与物料数据</p>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="toolbar">
      <el-input placeholder="搜索产品名称、类别..." prefix-icon="el-icon-search" size="small" v-model="searchText" clearable style="width: 240px;"></el-input>
      <el-select v-model="filterCategory" placeholder="按类别筛选" size="small" clearable class="toolbar-select">
        <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat"></el-option>
      </el-select>
      <el-select v-model="filterMatType" placeholder="物料类型" size="small" clearable class="toolbar-select" style="margin-left: 8px;">
        <el-option v-for="t in matTypeOptions" :key="t" :label="t" :value="t"></el-option>
      </el-select>
    </div>

    <!-- 产品表格 -->
    <div class="table-wrapper">
      <div class="table-title-bar">
        <span class="table-title-text">产品列表</span>
        <el-button type="primary" size="small" icon="el-icon-plus" @click="openAddDialog">新增产品</el-button>
      </div>
      <div class="table-scroll">
      <el-table :data="pagedProducts" border size="small" stripe style="width: 100%;" :header-cell-style="headerCellStyle">
        <el-table-column label="序号" type="index" width="55" align="center"></el-table-column>
        <el-table-column prop="category" label="类别" width="100"></el-table-column>
        <el-table-column label="物料类型" width="100" align="center">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="row.matType === '外购原辅料' ? 'warning' : (row.matType === '包装材料' ? '' : 'success')" effect="plain">{{ row.matType || '自产产品' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="产品编号" prop="id" width="110"></el-table-column>
        <el-table-column label="产品名称" min-width="160" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span class="product-name-cell">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="型号" min-width="130" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span v-if="row.specs">{{ row.specs }}</span>
            <span v-else class="text-placeholder">—</span>
          </template>
        </el-table-column>
        <el-table-column label="净重(kg)" width="85" align="center">
          <template slot-scope="{ row }">
            <span v-if="row.weight" style="font-weight: 500;">{{ row.weight }}</span>
            <span v-else class="text-placeholder">—</span>
          </template>
        </el-table-column>
        <el-table-column label="毛重(kg)" width="95" align="center">
          <template slot-scope="{ row }">
            <span v-if="row.grossWeight" style="font-weight: 500;">{{ row.grossWeight }}</span>
            <span v-else class="text-placeholder">—</span>
          </template>
        </el-table-column>
        <el-table-column label="使用寿命" width="130" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span v-if="row.serviceLife">{{ row.serviceLife }}</span>
            <span v-else class="text-placeholder">—</span>
          </template>
        </el-table-column>
        <el-table-column label="产地" width="140" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span v-if="row.productionLocation">{{ row.productionLocation }}</span>
            <span v-else class="text-placeholder">—</span>
          </template>
        </el-table-column>
        <el-table-column label="是否停产" width="80" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="row.discontinued ? 'info' : 'success'" size="mini">{{ row.discontinued ? '已停产' : '在产' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="mini" @click="startCalc(row)"><i class="el-icon-magic-wand"></i> 发起核算</el-button>
            <el-button type="text" size="mini" @click="openEditDialog(row)">编辑</el-button>
            <el-button type="text" size="mini" class="btn-danger" @click="deleteProduct(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- 空状态 -->
      <div v-if="filteredProducts.length === 0" class="empty-state">
        <i class="el-icon-goods"></i>
        <p>暂无产品数据</p>
        <span>点击右上角「新增产品」开始登记</span>
      </div>
      </div>
      <!-- 分页 -->
      <div class="pagination-bar" v-if="filteredProducts.length > 0">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredProducts.length"
          :page-sizes="[10, 20, 50]"
          :page-size="pageSize"
          :current-page="currentPage"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        ></el-pagination>
      </div>
    </div>
    <el-dialog :title="editMode ? '编辑产品' : '新增产品'" :visible.sync="dialogVisible" width="640px" append-to-body custom-class="product-dialog">
      <el-form :model="formData" label-width="110px" size="small">
        <!-- 基本信息 -->
        <el-divider content-position="left"><span class="divider-label">基本信息</span></el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="物料类型" required>
              <el-select v-model="formData.matType" style="width: 100%;">
                <el-option v-for="t in matTypeOptions" :key="t" :label="t" :value="t"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="类别" required>
              <el-input v-model="formData.category" placeholder="如：燃油汽车"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="产品名称" required>
              <el-input v-model="formData.name" placeholder="如：燃油汽车 ICE-A160"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 物理属性 -->
        <el-divider content-position="left"><span class="divider-label">物理属性</span></el-divider>
        <el-form-item label="型号">
          <el-input v-model="formData.specs" placeholder="如：A160-MT-2024"></el-input>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="净重(kg)">
              <el-input-number v-model="formData.weight" :min="0" :precision="1" controls-position="right" style="width: 100%;"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="毛重(kg)">
              <el-input-number v-model="formData.grossWeight" :min="0" :precision="1" controls-position="right" style="width: 100%;"></el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="包装信息">
          <el-input v-model="formData.packagingInfo" placeholder="如：裸车发运+防撞护角, 约25kg"></el-input>
        </el-form-item>

        <!-- 使用与生产 -->
        <el-divider content-position="left"><span class="divider-label">使用与生产</span></el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="使用寿命">
              <el-input v-model="formData.serviceLife" placeholder="如：15年/150,000km"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产地">
              <el-input v-model="formData.productionLocation" placeholder="如：华南低碳产业园"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="使用阶段能耗">
          <el-input v-model="formData.usePhaseEnergy" placeholder="如：汽油消耗6.5L/100km"></el-input>
        </el-form-item>
        <el-form-item label="是否停产">
          <el-switch v-model="formData.discontinued" active-text="已停产" inactive-text="在产"></el-switch>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveProduct">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'EnterpriseProductLibrary',
  data() {
    return {
      products: [],
      searchText: '',
      filterCategory: '',
      filterMatType: '',
      matTypeOptions: ['自产产品', '外购原辅料', '包装材料'],
      dialogVisible: false,
      editMode: false,
      currentPage: 1,
      pageSize: 10,
      headerCellStyle: { background: 'var(--bg-hover, #f8fafc)', color: 'var(--text-primary, #0f172a)', fontWeight: 600, textAlign: 'center' },
      formData: this.emptyForm()
    }
  },
  computed: {
    categories() {
      return [...new Set(this.products.map(p => p.category))]
    },
    activeProducts() {
      return this.products.filter(p => !p.discontinued)
    },
    productionLocations() {
      return [...new Set(this.products.map(p => p.productionLocation).filter(Boolean))]
    },
    filteredProducts() {
      return this.products.filter(p => {
        if (this.searchText && !p.name.includes(this.searchText) && !p.category.includes(this.searchText)) return false
        if (this.filterCategory && p.category !== this.filterCategory) return false
        if (this.filterMatType && (p.matType || '自产产品') !== this.filterMatType) return false
        return true
      })
    },
    pagedProducts() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.filteredProducts.slice(start, start + this.pageSize)
    }
  },
  mounted() {
    this.loadProducts()
  },
  methods: {
    emptyForm() {
      return {
        name: '', category: '', matType: '自产产品',
        weight: null, grossWeight: null, specs: '', packagingInfo: '',
        serviceLife: '', usePhaseEnergy: '', productionLocation: '', discontinued: false
      }
    },
    loadProducts() {
      try {
        const saved = localStorage.getItem('cfp_products_v3')
        if (saved) {
          this.products = JSON.parse(saved)
        }
        if (!this.products || this.products.length === 0) {
          this.products = [
            {
              id: 'EP-001', name: '燃油轿车 ICE-A160 1.6L手动', category: '燃油乘用车',
              weight: 1320, grossWeight: 1345,
              specs: 'A160-MT-2024', packagingInfo: '裸车发运+防撞护角, 约25kg',
              serviceLife: '15年/150,000km', usePhaseEnergy: '汽油消耗6.5L/100km', productionLocation: '武汉整车制造基地', discontinued: false
            },
            {
              id: 'EP-002', name: '燃油轿车 ICE-A160 1.6L自动', category: '燃油乘用车',
              weight: 1340, grossWeight: 1365,
              specs: 'A160-CVT-2024', packagingInfo: '裸车发运+防撞护角, 约25kg',
              serviceLife: '15年/150,000km', usePhaseEnergy: '汽油消耗6.8L/100km', productionLocation: '武汉整车制造基地', discontinued: false
            },
            {
              id: 'EP-003', name: '燃油SUV ICE-X200 2.0T', category: '燃油乘用车',
              weight: 1680, grossWeight: 1705,
              specs: 'X200-2.0T-2024', packagingInfo: '裸车发运+防撞护角, 约25kg',
              serviceLife: '15年/150,000km', usePhaseEnergy: '汽油消耗8.8L/100km', productionLocation: '武汉整车制造基地', discontinued: false
            },
            {
              id: 'EP-004', name: '纯电动轿车 EV-C60', category: '新能源乘用车',
              weight: 1650, grossWeight: 1675,
              specs: 'C60-EV-2024', packagingInfo: '裸车发运+防撞护角, 约25kg',
              serviceLife: '15年/300,000km', usePhaseEnergy: '电耗14.5kWh/100km', productionLocation: '武汉新能源制造基地', discontinued: false
            },
            {
              id: 'EP-005', name: '纯电动SUV EV-X80', category: '新能源乘用车',
              weight: 2100, grossWeight: 2125,
              specs: 'X80-EV-2024', packagingInfo: '裸车发运+防撞护角, 约25kg',
              serviceLife: '15年/300,000km', usePhaseEnergy: '电耗18.2kWh/100km', productionLocation: '武汉新能源制造基地', discontinued: false
            },
            {
              id: 'EP-006', name: '插电混动轿车 PHEV-A180', category: '新能源乘用车',
              weight: 1510, grossWeight: 1535,
              specs: 'A180-PHEV-2024', packagingInfo: '裸车发运+防撞护角, 约25kg',
              serviceLife: '15年/200,000km', usePhaseEnergy: '纯电14kWh/100km + 混动4.2L/100km', productionLocation: '武汉新能源制造基地', discontinued: false
            },
            {
              id: 'EP-007', name: '三元锂电池包 NCM70', category: '动力电池',
              weight: 350, grossWeight: 395,
              specs: 'NCM70-355V', packagingInfo: '木箱+防震衬垫, 约45kg',
              serviceLife: '8年/1500次循环', usePhaseEnergy: '充放电效率95%, 循环能耗0.15kWh/km', productionLocation: '荆门电池工厂', discontinued: false
            },
            {
              id: 'EP-008', name: '磷酸铁锂电池包 LFP55', category: '动力电池',
              weight: 420, grossWeight: 465,
              specs: 'LFP55-322V', packagingInfo: '木箱+防震衬垫, 约45kg',
              serviceLife: '10年/3000次循环', usePhaseEnergy: '充放电效率96%, 循环能耗0.16kWh/km', productionLocation: '荆门电池工厂', discontinued: false
            },
            {
              id: 'EP-009', name: '1.5T涡轮增压发动机', category: '核心零部件',
              weight: 118, grossWeight: 135,
              specs: '4A15T-130kW', packagingInfo: '木托盘+防锈膜, 约17kg',
              serviceLife: '15年/200,000km', usePhaseEnergy: '燃油消耗(装配于整车)', productionLocation: '襄阳发动机工厂', discontinued: false
            },
            {
              id: 'EP-010', name: '永磁同步驱动电机 160kW', category: '核心零部件',
              weight: 68, grossWeight: 82,
              specs: 'PMSM-160kW-12kr', packagingInfo: '纸箱+防静电袋, 约14kg',
              serviceLife: '15年/300,000km', usePhaseEnergy: '效率96%, 自损耗4%', productionLocation: '襄阳电机工厂', discontinued: false
            },
            {
              id: 'EP-011', name: '燃油MPV ICE-M300 2.0L', category: '燃油乘用车',
              weight: 1850, grossWeight: 1875,
              specs: 'M300-2.0L-2023', packagingInfo: '裸车发运+防撞护角, 约25kg',
              serviceLife: '15年/150,000km', usePhaseEnergy: '汽油消耗9.5L/100km', productionLocation: '武汉整车制造基地', discontinued: true
            },
            {
              id: 'EP-012', name: '增程式电动SUV EREV-X90', category: '新能源乘用车',
              weight: 1980, grossWeight: 2005,
              specs: 'X90-EREV-2024', packagingInfo: '裸车发运+防撞护角, 约25kg',
              serviceLife: '15年/300,000km', usePhaseEnergy: '纯电16kWh/100km + 增程5.5L/100km', productionLocation: '武汉新能源制造基地', discontinued: false
            },
            {
              id: 'EP-013', name: '电解液（外购，LFP/NCM 共用）', category: '电池原辅料', matType: '外购原辅料',
              weight: null, grossWeight: null,
              specs: '溶剂 EC/DMC + LiPF₆', packagingInfo: '250kg 铁桶',
              serviceLife: '—', usePhaseEnergy: '—', productionLocation: '供应商：江苏国泰', discontinued: false
            },
            {
              id: 'EP-014', name: '出口木箱包装托盘', category: '包装材料', matType: '包装材料',
              weight: null, grossWeight: null,
              specs: '1200×1000 免熏蒸', packagingInfo: '—',
              serviceLife: '单次周转', usePhaseEnergy: '—', productionLocation: '供应商：本地包装厂', discontinued: false
            }
          ]
          this.persist()
        }
      } catch (e) { /* ignore */ }
    },
    persist() {
      try { localStorage.setItem('cfp_products_v3', JSON.stringify(this.products)) } catch (e) { /* ignore */ }
    },
    openAddDialog() {
      this.editMode = false
      this.formData = this.emptyForm()
      this.dialogVisible = true
    },
    openEditDialog(row) {
      this.editMode = true
      this.formData = { ...this.emptyForm(), ...row }
      this.dialogVisible = true
    },
    saveProduct() {
      if (!this.formData.name || !this.formData.category) {
        this.$message.warning('请填写产品名称和类别')
        return
      }
      if (this.editMode) {
        const idx = this.products.findIndex(p => p.id === this.formData.id)
        if (idx >= 0) Object.assign(this.products[idx], this.formData)
      } else {
        this.products.unshift({
          ...this.formData,
          id: 'EP-' + Date.now().toString().slice(-6)
        })
      }
      this.persist()
      this.dialogVisible = false
      this.$message.success(this.editMode ? '产品已更新' : '产品已新增')
    },
    deleteProduct(row) {
      this.$confirm('确认删除产品"' + row.name + '"？', '删除确认', { type: 'warning' }).then(() => {
        this.products = this.products.filter(p => p.id !== row.id)
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
    },
    startCalc(product) {
      this.$router.push({
        path: '/footprint/accounting/agent',
        query: { productId: product.id, productName: product.name }
      })
    }
  }
}
</script>

<style scoped>
.product-library-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 页头 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
.page-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin: 4px 0 0;
}

/* 统计卡片 */
.stats-row {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  flex-shrink: 0;
}
.stat-card {
  flex: 1;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: var(--shadow-card);
  transition: var(--transition);
}
.stat-card:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}
.stat-card.stat-blue { border-left: 3px solid var(--primary); }
.stat-card.stat-green { border-left: 3px solid var(--success); }
.stat-card.stat-orange { border-left: 3px solid var(--warning); }

.stat-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.stat-icon-default { background: var(--bg-primary-light); color: var(--text-secondary); }
.stat-icon-blue { background: var(--primary-bg); color: var(--primary); }
.stat-icon-green { background: rgba(0, 103, 254, 0.1); color: var(--success); }
.stat-icon-orange { background: rgba(237, 123, 47, 0.1); color: var(--warning); }

.stat-body { flex: 1; }
.stat-num {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}
.stat-blue .stat-num { color: var(--primary); }
.stat-green .stat-num { color: var(--success); }
.stat-orange .stat-num { color: var(--warning); }
.stat-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

/* 搜索栏 */
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0 12px;
  flex-shrink: 0;
}
.toolbar-select { width: 160px; }

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
.product-name-cell {
  font-weight: 500;
  color: var(--text-primary);
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
  font-size: 12px;
}

/* 对话框 */
.divider-label {
  font-size: 12px;
  color: var(--text-muted);
}
</style>
