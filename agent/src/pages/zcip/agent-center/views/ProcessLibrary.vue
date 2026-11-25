<template>
  <div class="process-library-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title"><i class="el-icon-cpu"></i> 单元过程库</h2>
        <p class="page-desc">可复用的标准单元过程模板库，涵盖各生命周期阶段的典型工艺，支持快速拼装核算模型</p>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="toolbar">
      <el-input placeholder="搜索单元过程名称..." prefix-icon="el-icon-search" size="small" v-model="searchText" clearable style="width: 240px;"></el-input>
      <el-select v-model="filterStage" placeholder="生命周期阶段" size="small" clearable style="width: 140px; margin-left: 8px;">
        <el-option v-for="s in stageTypes" :key="s" :label="s" :value="s"></el-option>
      </el-select>
      <el-select v-model="filterIndustry" placeholder="适用行业" size="small" clearable style="width: 120px; margin-left: 8px;">
        <el-option v-for="ind in industries" :key="ind" :label="ind" :value="ind"></el-option>
      </el-select>
      <el-button type="primary" size="small" icon="el-icon-plus" style="margin-left: auto;" @click="openAdd">新增单元过程</el-button>
    </div>

    <!-- 单元过程表格 -->
    <div class="table-wrapper">
      <div class="table-title-bar">
        <span class="table-title-text">单元过程列表</span>
      </div>
      <div class="table-scroll">
    <el-table :data="pagedProcesses" border stripe size="small" style="width: 100%;" :header-cell-style="headerCellStyle" @row-click="viewDetail">
      <el-table-column label="编号" prop="id" width="90" align="center">
        <template slot-scope="{ row }">
          <span style="font-family: monospace; font-size: 13px; color: #909399;">{{ row.id || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单元过程名称" prop="name" min-width="180">
        <template slot-scope="{ row }">
          <i :class="stageIcon(row.stage)" :style="{ color: stageColor(row.stage) }" style="margin-right: 6px;"></i>
          <span style="cursor: pointer; color: #0067FE;">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="生命周期阶段" prop="stage" width="120">
        <template slot-scope="{ row }">
          <el-tag size="mini" :type="stageTagType(row.stage)">{{ row.stage }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="适用行业" prop="industry" width="100"></el-table-column>
      <el-table-column label="输入流" width="70" align="center">
        <template slot-scope="{ row }">{{ row.inputs.length }}</template>
      </el-table-column>
      <el-table-column label="输出流" width="70" align="center">
        <template slot-scope="{ row }">{{ row.outputs.length }}</template>
      </el-table-column>
      <el-table-column label="分配规则" prop="allocation" width="90">
        <template slot-scope="{ row }">{{ allocLabel(row.allocation) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template slot-scope="{ row }">
          <el-tag size="mini" :type="row.verified ? 'success' : 'warning'">{{ row.verified ? '已验证' : '待验证' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template slot-scope="{ row, $index }">
          <el-button type="text" size="mini" @click.stop="viewDetail(row)">查看</el-button>
          <el-button type="text" size="mini" @click.stop="openEdit(row)">编辑</el-button>
          <el-button type="text" size="mini" @click.stop="copyProcess(row)">复制</el-button>
          <el-button type="text" size="mini" style="color: #f56c6c;" @click.stop="deleteProcess(row, $index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
      </div>
      <div class="pagination-bar" v-if="filteredProcesses.length > 0">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="filteredProcesses.length" :page-sizes="[10, 20, 50]" :page-size="pageSize" :current-page="currentPage" @size-change="handleSizeChange" @current-change="handlePageChange"></el-pagination>
      </div>
    </div>

    <!-- 详情弹窗（只读） -->
    <el-dialog :title="detailData ? detailData.name : ''" :visible.sync="detailVisible" width="720px">
      <template v-if="detailData">
        <el-descriptions :column="3" border size="small" style="margin-bottom: 16px;">
          <el-descriptions-item label="过程编号">{{ detailData.id || '—' }}</el-descriptions-item>
          <el-descriptions-item label="生命周期阶段">{{ detailData.stage }}</el-descriptions-item>
          <el-descriptions-item label="适用行业">{{ detailData.industry }}</el-descriptions-item>
          <el-descriptions-item label="分配规则">{{ allocLabel(detailData.allocation) }}</el-descriptions-item>
        </el-descriptions>
        <div class="io-section">
          <div class="io-column io-input">
            <div class="io-column-title">输入流（{{ detailData.inputs.length }}）</div>
            <div v-for="(inp, i) in detailData.inputs" :key="'in-'+i" class="io-row">
              <span class="io-name">{{ inp.name }}</span>
              <span class="io-type" :style="{ color: getColor(inp.listType) }">{{ getLabel(inp.listType) }}</span>
              <span class="io-val">{{ inp.value }} {{ inp.unit }}</span>
              <span class="io-factor" v-if="inp.factor">{{ inp.factor }} {{ inp.factorUnit }}</span>
            </div>
          </div>
          <div class="io-arrow">→</div>
          <div class="io-column io-output">
            <div class="io-column-title">输出流（{{ detailData.outputs.length }}）</div>
            <div v-for="(out, i) in detailData.outputs" :key="'out-'+i" class="io-row">
              <span class="io-name">{{ out.name }}</span>
              <span class="io-type" :style="{ color: getColor(out.listType) }">{{ getLabel(out.listType) }}</span>
              <span class="io-val">{{ out.value }} {{ out.unit }}</span>
              <span class="io-factor" v-if="out.factor">{{ out.factor }} {{ out.factorUnit }}</span>
            </div>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 新增/编辑弹窗 -->
    <el-dialog :title="editMode === 'add' ? '新增单元过程' : '编辑单元过程'" :visible.sync="editVisible" width="860px" :close-on-click-modal="false">
      <el-form :model="editForm" label-width="100px" size="small" inline>
        <el-form-item label="过程编号">
          <el-input v-model="editForm.id" placeholder="保存时自动生成" disabled style="width: 120px;"></el-input>
        </el-form-item>
        <el-form-item label="过程名称">
          <el-input v-model="editForm.name" placeholder="如：涂装工序" style="width: 220px;"></el-input>
        </el-form-item>
        <el-form-item label="生命周期阶段">
          <el-select v-model="editForm.stage" placeholder="选择阶段" style="width: 140px;">
            <el-option label="原材料获取" value="原材料获取"></el-option>
            <el-option label="整车生产" value="整车生产"></el-option>
            <el-option label="分销运输" value="分销运输"></el-option>
            <el-option label="使用阶段" value="使用阶段"></el-option>
            <el-option label="报废回收" value="报废回收"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="适用行业">
          <el-input v-model="editForm.industry" placeholder="如：汽车" style="width: 100px;"></el-input>
        </el-form-item>
        <el-form-item label="分配规则">
          <el-select v-model="editForm.allocation" style="width: 120px;">
            <el-option label="质量分配" value="mass"></el-option>
            <el-option label="经济分配" value="economic"></el-option>
            <el-option label="能源分配" value="energy"></el-option>
            <el-option label="不分配" value="none"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="验证状态">
          <el-switch v-model="editForm.verified" active-text="已验证" inactive-text="待验证"></el-switch>
        </el-form-item>
      </el-form>

      <!-- 输入/输出编辑区 -->
      <div class="edit-io-section">
        <!-- 输入流 -->
        <div class="edit-io-column">
          <div class="edit-io-header">
            <span>输入流（{{ editForm.inputs.length }}）</span>
            <el-button type="text" size="mini" icon="el-icon-plus" @click="addEditIO('inputs')">添加输入</el-button>
          </div>
          <div v-for="(inp, i) in editForm.inputs" :key="'ein-'+i" class="edit-io-row">
            <el-input v-model="inp.name" size="mini" placeholder="名称" style="width: 120px;"></el-input>
            <el-input v-model="inp.value" size="mini" placeholder="数值" style="width: 70px;"></el-input>
            <el-input v-model="inp.unit" size="mini" placeholder="单位" style="width: 60px;"></el-input>
            <el-input v-model="inp.factor" size="mini" placeholder="因子" style="width: 70px;"></el-input>
            <el-input v-model="inp.factorUnit" size="mini" placeholder="因子单位" style="width: 90px;"></el-input>
            <el-select v-model="inp.listType" size="mini" placeholder="类型" style="width: 90px;" @change="onInputTypeChange(inp)">
              <el-option v-for="opt in inputTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value"></el-option>
            </el-select>
            <i class="el-icon-delete edit-io-del" @click="removeEditIO('inputs', i)"></i>
          </div>
        </div>
        <!-- 输出流 -->
        <div class="edit-io-column">
          <div class="edit-io-header">
            <span>输出流（{{ editForm.outputs.length }}）</span>
            <el-button type="text" size="mini" icon="el-icon-plus" @click="addEditIO('outputs')">添加输出</el-button>
          </div>
          <div v-for="(out, i) in editForm.outputs" :key="'eout-'+i" class="edit-io-row">
            <el-input v-model="out.name" size="mini" placeholder="名称" style="width: 120px;"></el-input>
            <el-input v-model="out.value" size="mini" placeholder="数值" style="width: 70px;"></el-input>
            <el-input v-model="out.unit" size="mini" placeholder="单位" style="width: 60px;"></el-input>
            <el-input v-model="out.factor" size="mini" placeholder="因子" style="width: 70px;"></el-input>
            <el-input v-model="out.factorUnit" size="mini" placeholder="因子单位" style="width: 90px;"></el-input>
            <el-select v-model="out.listType" size="mini" placeholder="类型" style="width: 90px;" @change="onOutputTypeChange(out)">
              <el-option v-for="opt in outputTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value"></el-option>
            </el-select>
            <i class="el-icon-delete edit-io-del" @click="removeEditIO('outputs', i)"></i>
          </div>
        </div>
      </div>

      <div slot="footer">
        <el-button size="small" @click="editVisible = false">取消</el-button>
        <el-button type="primary" size="small" @click="saveProcess">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
const TYPE_OPTIONS = [
  { value: 'raw_material', label: '原材料', color: '#409EFF' },
  { value: 'packaging', label: '包装材料', color: '#13C2C2' },
  { value: 'transport', label: '运输', color: '#2F54EB' },
  { value: 'energy', label: '能源', color: '#FA8C16' },
  { value: 'resource', label: '资源', color: '#52C41A' },
  { value: 'consumable', label: '辅料', color: '#722ED1' },
  { value: 'main_product', label: '主产品', color: '#EB2F96' },
  { value: 'by_product', label: '副产品', color: '#C62828' },
  { value: 'waste_gas', label: '废气', color: '#F5222D' },
  { value: 'solid_waste', label: '固体废物', color: '#8D6E63' },
  { value: 'wastewater', label: '废水', color: '#1890FF' }
]

const INPUT_TYPES = TYPE_OPTIONS.filter(t => ['raw_material','packaging','transport','energy','resource','consumable','product'].includes(t.value))
const OUTPUT_TYPES = TYPE_OPTIONS.filter(t => ['main_product','by_product','waste_gas','solid_waste','wastewater'].includes(t.value))

export default {
  name: 'ProcessLibrary',
  data() {
    return {
      searchText: '',
      filterStage: '',
      filterIndustry: '',
      detailVisible: false,
      detailData: null,
      editVisible: false,
      editMode: 'add',
      editIndex: -1,
      currentPage: 1,
      pageSize: 10,
      inputTypeOptions: INPUT_TYPES,
      outputTypeOptions: OUTPUT_TYPES,
      editForm: {
        id: '', name: '', stage: '', industry: '', allocation: 'mass', verified: false,
        inputs: [], outputs: []
      },
      processes: [
        {
          id: 'UP-001', name: '原料获取（金属+塑料）', stage: '原材料获取', industry: '通用', allocation: 'mass', verified: true,
          inputs: [
            { name: '非合金钢', value: '620', unit: 'kg', factor: '2.12', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
            { name: '铸造铝合金', value: '85', unit: 'kg', factor: '8.52', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
            { name: '热塑性塑料', value: '135', unit: 'kg', factor: '2.73', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
            { name: '橡胶', value: '75', unit: 'kg', factor: '2.95', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
            { name: '铜(线束)', value: '28', unit: 'kg', factor: '3.48', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
            { name: '原材料入厂物流', value: '8500', unit: 't·km', factor: '0.148', factorUnit: 'kgCO₂e/t·km', flowType: 'elementary', listType: 'transport' }
          ],
          outputs: [
            { name: '汽车零部件毛坯', value: '1388', unit: 'kg', factor: null, factorUnit: null, flowType: 'product', listType: 'main_product' }
          ]
        },
        {
          id: 'UP-002', name: '原材料包装', stage: '原材料获取', industry: '通用', allocation: 'mass', verified: true,
          inputs: [
            { name: '瓦楞纸', value: '12', unit: 'kg', factor: '1.08', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'packaging' }
          ],
          outputs: [
            { name: '废瓦楞纸', value: '3', unit: 'kg', factor: '0.52', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'solid_waste' }
          ]
        },
        {
          id: 'UP-003', name: '涂装工序', stage: '整车生产', industry: '汽车', allocation: 'mass', verified: true,
          inputs: [
            { name: '市电', value: '1200', unit: 'kWh', factor: '0.581', factorUnit: 'kgCO₂e/kWh', flowType: 'elementary', listType: 'energy' },
            { name: '热力', value: '15000', unit: 'MJ', factor: '0.092', factorUnit: 'kgCO₂e/MJ', flowType: 'elementary', listType: 'energy' },
            { name: '天然气使用', value: '850', unit: 'Nm³', factor: '2.162', factorUnit: 'kgCO₂e/Nm³', flowType: 'elementary', listType: 'energy' },
            { name: '水', value: '850', unit: 't', factor: '0.193', factorUnit: 'kgCO₂e/t', flowType: 'elementary', listType: 'resource' }
          ],
          outputs: [
            { name: 'VOC焚烧', value: '120', unit: 'kg', factor: '2.52', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'waste_gas' },
            { name: '污泥', value: '280', unit: 'kg', factor: '0.486', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'solid_waste' },
            { name: '废水', value: '950', unit: 'm³', factor: '0.296', factorUnit: 'kgCO₂e/m³', flowType: 'elementary', listType: 'wastewater' }
          ]
        },
        {
          id: 'UP-004', name: '焊接工序', stage: '整车生产', industry: '汽车', allocation: 'mass', verified: true,
          inputs: [
            { name: '市电', value: '2800', unit: 'kWh', factor: '0.581', factorUnit: 'kgCO₂e/kWh', flowType: 'elementary', listType: 'energy' },
            { name: 'CO₂保护气', value: '0.12', unit: 't', factor: '0.705', factorUnit: 'kgCO₂e/t', flowType: 'elementary', listType: 'resource' }
          ],
          outputs: [
            { name: 'CO₂排放', value: '0.12', unit: 't', factor: '1.401', factorUnit: 'kgCO₂e/t', flowType: 'elementary', listType: 'waste_gas' },
            { name: '废水', value: '85', unit: 'm³', factor: '0.296', factorUnit: 'kgCO₂e/m³', flowType: 'elementary', listType: 'wastewater' }
          ]
        },
        {
          id: 'UP-005', name: '冲压工序', stage: '整车生产', industry: '汽车', allocation: 'mass', verified: true,
          inputs: [
            { name: '市电', value: '1800', unit: 'kWh', factor: '0.581', factorUnit: 'kgCO₂e/kWh', flowType: 'elementary', listType: 'energy' },
            { name: '水', value: '65', unit: 't', factor: '0.193', factorUnit: 'kgCO₂e/t', flowType: 'elementary', listType: 'resource' }
          ],
          outputs: [
            { name: '边角料（废钢）', value: '42', unit: 'kg', factor: '1.05', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'solid_waste' },
            { name: '废水', value: '35', unit: 'm³', factor: '0.296', factorUnit: 'kgCO₂e/m³', flowType: 'elementary', listType: 'wastewater' }
          ]
        },
        {
          id: 'UP-006', name: '总装工序', stage: '整车生产', industry: '汽车', allocation: 'mass', verified: true,
          inputs: [
            { name: '市电', value: '1200', unit: 'kWh', factor: '0.581', factorUnit: 'kgCO₂e/kWh', flowType: 'elementary', listType: 'energy' },
            { name: '水', value: '45', unit: 't', factor: '0.193', factorUnit: 'kgCO₂e/t', flowType: 'elementary', listType: 'resource' }
          ],
          outputs: [
            { name: '燃油乘用车整车', value: '1', unit: '辆', factor: null, factorUnit: null, flowType: 'product', listType: 'main_product' }
          ]
        },
        {
          id: 'UP-007', name: '分销物流（海陆联运）', stage: '分销运输', industry: '通用', allocation: 'mass', verified: true,
          inputs: [
            { name: '国际海运', value: '8000', unit: 't·km', factor: '0.011', factorUnit: 'kgCO₂e/t·km', flowType: 'elementary', listType: 'transport' },
            { name: '国内公路', value: '1500', unit: 't·km', factor: '0.085', factorUnit: 'kgCO₂e/t·km', flowType: 'elementary', listType: 'transport' },
            { name: '国内水运', value: '1800', unit: 't·km', factor: '0.024', factorUnit: 'kgCO₂e/t·km', flowType: 'elementary', listType: 'transport' }
          ],
          outputs: [
            { name: '已交付产品', value: '1', unit: '批', factor: null, factorUnit: null, flowType: 'product', listType: 'main_product' }
          ]
        },
        {
          id: 'UP-008', name: '燃油车使用环节', stage: '使用阶段', industry: '汽车', allocation: 'mass', verified: true,
          inputs: [
            { name: '汽油燃烧', value: '7500', unit: 'kg', factor: '2.925', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'energy' },
            { name: '机油消耗', value: '85', unit: 'kg', factor: '1.488', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'consumable' },
            { name: '轮胎磨损', value: '32', unit: 'kg', factor: '2.95', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'consumable' }
          ],
          outputs: [
            { name: 'CO₂尾气排放', value: '23500', unit: 'kg', factor: '1.0', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'waste_gas' },
            { name: '退役车辆', value: '1', unit: '辆', factor: null, factorUnit: null, flowType: 'product', listType: 'main_product' }
          ]
        },
        {
          id: 'UP-009', name: '拆解报废（金属回收）', stage: '报废回收', industry: '汽车', allocation: 'mass', verified: true,
          inputs: [
            { name: '市电', value: '850', unit: 'kWh', factor: '0.581', factorUnit: 'kgCO₂e/kWh', flowType: 'elementary', listType: 'energy' },
            { name: '柴油使用', value: '1800', unit: 'MJ', factor: '0.072', factorUnit: 'kgCO₂e/MJ', flowType: 'elementary', listType: 'energy' }
          ],
          outputs: [
            { name: '废钢-mM', value: '620', unit: 'kg', factor: null, factorUnit: null, flowType: 'product', listType: 'by_product' },
            { name: '废塑料-mTe', value: '85', unit: 'kg', factor: null, factorUnit: null, flowType: 'product', listType: 'by_product' },
            { name: '轮胎-mp', value: '75', unit: 'kg', factor: null, factorUnit: null, flowType: 'product', listType: 'by_product' },
            { name: '废电池-mp', value: '18', unit: 'kg', factor: null, factorUnit: null, flowType: 'product', listType: 'by_product' },
            { name: '废液-mp', value: '25', unit: 'kg', factor: '0.65', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'wastewater' }
          ]
        },
        {
          id: 'UP-010', name: '电池组装工序', stage: '整车生产', industry: '电池', allocation: 'mass', verified: false,
          inputs: [
            { name: '市电', value: '3500', unit: 'kWh', factor: '0.581', factorUnit: 'kgCO₂e/kWh', flowType: 'elementary', listType: 'energy' },
            { name: '正极材料(NCM)', value: '180', unit: 'kg', factor: '14.8', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
            { name: '负极材料(石墨)', value: '95', unit: 'kg', factor: '3.2', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
            { name: '电解液', value: '75', unit: 'kg', factor: '5.8', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' }
          ],
          outputs: [
            { name: '动力电池包', value: '1', unit: '套', factor: null, factorUnit: null, flowType: 'product', listType: 'main_product' },
            { name: '废电解液', value: '8', unit: 'kg', factor: '1.83', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'wastewater' }
          ]
        },
        {
          id: 'UP-011', name: '光伏组件生产', stage: '整车生产', industry: '光伏', allocation: 'mass', verified: false,
          inputs: [
            { name: '市电', value: '2200', unit: 'kWh', factor: '0.581', factorUnit: 'kgCO₂e/kWh', flowType: 'elementary', listType: 'energy' },
            { name: '硅片', value: '180', unit: 'kg', factor: '12.5', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
            { name: '玻璃', value: '320', unit: 'kg', factor: '1.35', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' },
            { name: '铝边框', value: '45', unit: 'kg', factor: '8.16', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'raw_material' }
          ],
          outputs: [
            { name: '光伏组件', value: '1', unit: '块', factor: null, factorUnit: null, flowType: 'product', listType: 'main_product' },
            { name: '废硅片', value: '5', unit: 'kg', factor: '1.2', factorUnit: 'kgCO₂e/kg', flowType: 'elementary', listType: 'solid_waste' }
          ]
        }
      ]
    }
  },
  computed: {
    stageTypes() { return [...new Set(this.processes.map(p => p.stage))] },
    industries() { return [...new Set(this.processes.map(p => p.industry))] },
    totalIOCount() { return this.processes.reduce((s, p) => s + p.inputs.length + p.outputs.length, 0) },
    filteredProcesses() {
      return this.processes.filter(p => {
        const ms = !this.searchText || p.name.includes(this.searchText)
        const mt = !this.filterStage || p.stage === this.filterStage
        const mi = !this.filterIndustry || p.industry === this.filterIndustry
        return ms && mt && mi
      })
    },
    pagedProcesses() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.filteredProcesses.slice(start, start + this.pageSize)
    }
  },
  mounted() {
    this.loadProcesses()
  },
  methods: {
    handleSizeChange(val) { this.pageSize = val; this.currentPage = 1 },
    handlePageChange(val) { this.currentPage = val },
    loadProcesses() {
      try {
        const saved = localStorage.getItem('cfp_processes')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && parsed.length > 0) {
            this.processes = parsed
            return
          }
        }
      } catch (e) { /* ignore */ }
      this.persist()
    },
    persist() {
      try { localStorage.setItem('cfp_processes', JSON.stringify(this.processes)) } catch (e) { /* ignore */ }
    },
    genProcessId() {
      const max = this.processes.reduce((m, p) => {
        const n = parseInt((p.id || '').replace('UP-', '')) || 0
        return Math.max(m, n)
      }, 0)
      return 'UP-' + String(max + 1).padStart(3, '0')
    },
    stageIcon(s) { return { '原材料获取':'el-icon-magic-stick','整车生产':'el-icon-cpu','分销运输':'el-icon-truck','使用阶段':'el-icon-set-up','报废回收':'el-icon-delete' }[s] || 'el-icon-s-operation' },
    stageColor(s) { return { '原材料获取':'#409EFF','整车生产':'#E6A23C','分销运输':'#2F54EB','使用阶段':'#67C23A','报废回收':'#909399' }[s] || '#909399' },
    stageTagType(s) { return { '原材料获取':'','整车生产':'warning','分销运输':'primary','使用阶段':'success','报废回收':'info' }[s] || 'info' },
    allocLabel(v) { return { mass:'质量分配', economic:'经济分配', energy:'能源分配', none:'不分配' }[v] || '质量分配' },
    getLabel(v) { const o = TYPE_OPTIONS.find(t => t.value === v); return o ? o.label : v },
    getColor(v) { const o = TYPE_OPTIONS.find(t => t.value === v); return o ? o.color : '#909399' },
    viewDetail(row) { this.detailData = row; this.detailVisible = true },
    onInputTypeChange(item) {
      item.flowType = item.listType === 'product' ? 'product' : 'elementary'
    },
    onOutputTypeChange(item) {
      if (item.listType === 'main_product') { item.flowType = 'product'; item.productSubType = 'main' }
      else if (item.listType === 'by_product') { item.flowType = 'product'; item.productSubType = 'by_product' }
      else { item.flowType = 'elementary'; item.productSubType = null }
    },
    cloneIO(arr) { return arr.map(o => ({ ...o })) },
    openAdd() {
      this.editMode = 'add'
      this.editIndex = -1
      this.editForm = { id: '', name: '', stage: '', industry: '', allocation: 'mass', verified: false, inputs: [], outputs: [] }
      this.editVisible = true
    },
    openEdit(row) {
      this.editMode = 'edit'
      this.editIndex = this.processes.indexOf(row)
      this.editForm = { id: row.id || '', name: row.name, stage: row.stage, industry: row.industry, allocation: row.allocation, verified: row.verified, inputs: this.cloneIO(row.inputs), outputs: this.cloneIO(row.outputs) }
      this.editVisible = true
    },
    copyProcess(row) {
      const copy = JSON.parse(JSON.stringify(row))
      copy.id = this.genProcessId()
      copy.name = row.name + '（副本）'
      copy.verified = false
      this.processes.push(copy)
      this.persist()
      this.$message.success('已复制单元过程：' + copy.name)
    },
    deleteProcess(row, index) {
      this.$confirm('确认删除单元过程「' + row.name + '」？', '提示', { type: 'warning' }).then(() => {
        this.processes.splice(index, 1)
        this.persist()
        this.$message.success('已删除')
      }).catch(() => {})
    },
    addEditIO(type) {
      this.editForm[type].push({ name: '', value: '', unit: '', factor: '', factorUnit: '', flowType: 'elementary', listType: type === 'inputs' ? 'raw_material' : 'waste_gas' })
    },
    removeEditIO(type, index) { this.editForm[type].splice(index, 1) },
    saveProcess() {
      if (!this.editForm.name.trim()) { this.$message.warning('请填写过程名称'); return }
      if (!this.editForm.stage) { this.$message.warning('请选择生命周期阶段'); return }
      if (this.editMode === 'add') {
        const newProcess = JSON.parse(JSON.stringify(this.editForm))
        newProcess.id = this.genProcessId()
        this.processes.push(newProcess)
        this.$message.success('已新增单元过程')
      } else {
        this.$set(this.processes, this.editIndex, JSON.parse(JSON.stringify(this.editForm)))
        this.$message.success('已保存修改')
      }
      this.persist()
      this.editVisible = false
    }
  }
}
</script>

<style scoped>
.process-library-page {
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
.stat-card { flex: 1; background: #fff; border-radius: 8px; padding: 16px 20px; border: 1px solid #ebeef5; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.stat-num { font-size: 28px; font-weight: 700; color: #303133; }
.stat-label { font-size: 13px; color: #909399; margin-top: 4px; }
.stat-green .stat-num { color: #67C23A; }
.stat-blue .stat-num { color: #409EFF; }
.stat-orange .stat-num { color: #E6A23C; }
.toolbar { display: flex; align-items: center; margin-bottom: 12px; flex-shrink: 0; }

/* 详情弹窗 */
.io-section { display: flex; gap: 0; align-items: stretch; }
.io-column { flex: 1; }
.io-column-title { font-weight: 600; font-size: 13px; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 2px solid #ebeef5; }
.io-input .io-column-title { color: #67C23A; border-color: #67C23A; }
.io-output .io-column-title { color: #E6A23C; border-color: #E6A23C; }
.io-arrow { display: flex; align-items: center; font-size: 20px; color: #c0c4cc; padding: 0 16px; }
.io-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 13px; border-bottom: 1px solid #f5f7fa; }
.io-name { flex: 1; color: #303133; }
.io-type { font-size: 13px; padding: 1px 4px; border: 1px solid; border-radius: 3px; white-space: nowrap; }
.io-val { color: #606266; white-space: nowrap; }
.io-factor { color: #909399; font-size: 13px; white-space: nowrap; }

/* 编辑弹窗 */
.edit-io-section { display: flex; gap: 16px; margin-top: 8px; }
.edit-io-column { flex: 1; }
.edit-io-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 2px solid #ebeef5; font-weight: 600; font-size: 13px; }
.edit-io-row { display: flex; align-items: center; gap: 4px; margin-bottom: 4px; flex-wrap: wrap; }
.edit-io-del { color: #c0c4cc; cursor: pointer; font-size: 14px; margin-left: 4px; }
.edit-io-del:hover { color: #f56c6c; }

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
.empty-state span { font-size: 13px; }
</style>
