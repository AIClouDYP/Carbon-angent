<template>
  <div class="product-library-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title"><i class="el-icon-goods"></i> 企业产品库</h2>
        <p class="page-desc">企业自产产品的统一登记底座，为碳足迹核算与 LCA 建模提供产品数据，支持一键发起核算并继承已有 SOP 模型</p>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="toolbar">
      <el-input placeholder="搜索产品名称、类别..." prefix-icon="el-icon-search" size="small" v-model="searchText" clearable style="width: 240px;"></el-input>
      <el-select v-model="filterCategory" placeholder="按类别筛选" size="small" clearable class="toolbar-select">
        <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat"></el-option>
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
          <el-col :span="12">
            <el-form-item label="类别" required>
              <el-input v-model="formData.category" placeholder="如：燃油汽车"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
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
        name: '', category: '',
        weight: null, grossWeight: null, specs: '', packagingInfo: '',
        serviceLife: '', usePhaseEnergy: '', productionLocation: '', discontinued: false
      }
    },
    loadProducts() {
      try {
        const saved = localStorage.getItem('cfp_products_v4')
        if (saved) {
          this.products = JSON.parse(saved)
        }
        if (!this.products || this.products.length === 0) {
          this.products = [
            {
              id: 'EP-001', name: '小米SU7', category: '新能源乘用车',
              weight: 2205, grossWeight: 2230,
              specs: 'SU7-MAX-2024', packagingInfo: '裸车发运+防撞护角, 约25kg',
              serviceLife: '15年/300,000km', usePhaseEnergy: '电耗14.8kWh/100km', productionLocation: '北京亦庄智能制造基地', discontinued: false
            },
            {
              id: 'EP-002', name: '小米YU7', category: '新能源乘用车',
              weight: 2400, grossWeight: 2425,
              specs: 'YU7-MAX-2025', packagingInfo: '裸车发运+防撞护角, 约25kg',
              serviceLife: '15年/300,000km', usePhaseEnergy: '电耗16.5kWh/100km', productionLocation: '北京亦庄智能制造基地', discontinued: false
            },
          ]
          this.persist()
        }
      } catch (e) { /* ignore */ }
    },
    persist() {
      try {
        localStorage.setItem('cfp_products_v4', JSON.stringify(this.products))
        // 广播产品库变更（同一页面内 storage 事件不触发，需自定义事件）
        window.dispatchEvent(new CustomEvent('cfp-products-changed'))
      } catch (e) { /* ignore */ }
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
  font-size: 13px;
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
  font-size: 13px;
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
  font-size: 13px;
}

/* 对话框 */
.divider-label {
  font-size: 13px;
  color: var(--text-muted);
}
</style>
