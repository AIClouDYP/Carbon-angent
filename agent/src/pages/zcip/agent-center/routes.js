/**
 * 首页路由配置
 */

// 应用中心 - 第一层：左对话框+右智能体列表
const AgentCenter = () => import('./views/AgentCenter.vue')
// 碳足迹智能体中心 - 第二层：左对话框+右核算任务列表
const CarbonAccountingCenter = () => import('./views/CarbonAccountingCenter.vue')
const PefAccountingCenter = () => import('./views/PefAccountingCenter.vue')
// 组织碳核算智能体中心 - 第二层：左对话框+右核算任务列表
const OrgAccountingCenter = () => import('./views/OrgAccountingCenter.vue')

const BeijingCarbonCenter = () => import('../beijing-carbon/agent-center/views/BeijingCarbonCenter.vue')
// 产品与物料库
const EnterpriseProductLibrary = () => import('./views/EnterpriseProductLibrary.vue')
// 产品SOP库
const ProductSOPLibrary = () => import('./views/ProductSOPLibrary.vue')
// 报告与档案中心
const EnterpriseCarbonReport = () => import('./views/EnterpriseCarbonReport.vue')
// 政策标准库
const StandardsLibrary = () => import('./views/StandardsLibrary.vue')
// 政策标准库 - 穿透详情页
const StandardsDetail = () => import('./views/StandardsDetail.vue')
// 排放因子库
const EmissionFactorLibrary = () => import('./views/EmissionFactorLibrary.vue')
// 单元过程库
const ProcessLibrary = () => import('./views/ProcessLibrary.vue')
// 组织资源库
const OrganizationResourceLibrary = () => import('./views/OrganizationResourceLibrary.vue')
// Skill管理
const SkillManagement = () => import('./views/SkillManagement.vue')
// 组织模板库（企业模板库）
const AccountingTemplateLibrary = () => import('./views/AccountingTemplateLibrary.vue')
// 平台模板库
const PlatformTemplateLibrary = () => import('./views/PlatformTemplateLibrary.vue')
// 核算公式库
const FormulaLibrary = () => import('./views/FormulaLibrary.vue')
// 佐证材料库
const DeclarationMaterialLibrary = () => import('./views/DeclarationMaterialLibrary.vue')
// 企业因子库（企业实测/自定义私因数，与排放因子库公因数分库）
const EnterpriseFactorLibrary = () => import('./views/EnterpriseFactorLibrary.vue')

export const agentCenterRoutes = [
  {
    path: '/agent-center/apps',
    component: AgentCenter,
    name: 'AgentApps',
    meta: {
      title: '首页',
      breadcrumb: ['首页', '首页'],
      hideBreadcrumb: true,
      theme: 'light'
    }
  },
  {
    path: '/agent-center/apps/pef-accounting',
    component: PefAccountingCenter,
    name: 'PefAccountingCenter',
    meta: { title: '产品环境足迹', icon: 'el-icon-data-analysis', requireAuth: true, hideBreadcrumb: true, theme: 'light' }
  },
  {
    path: '/agent-center/apps/carbon-accounting',
    component: CarbonAccountingCenter,
    name: 'CarbonAccountingCenter',
    meta: {
      title: '产品碳足迹',
      breadcrumb: ['首页', '应用中心', '产品碳足迹智能体'],
      hideBreadcrumb: true,
      theme: 'light'
    }
  },
  {
    path: '/agent-center/apps/org-accounting',
    component: OrgAccountingCenter,
    name: 'OrgAccountingCenter',
    meta: {
      title: '组织碳核算',
      breadcrumb: ['首页', '应用中心', '组织碳核算'],
      hideBreadcrumb: true,
      theme: 'light'
    }
  },
  {
    path: '/agent-center/apps/beijing-carbon',
    component: BeijingCarbonCenter,
    name: 'BeijingCarbonCenter',
    meta: {
      title: '北京碳市场',
      breadcrumb: ['首页', '应用中心', '北京碳市场'],
      hideBreadcrumb: true,
      theme: 'light'
    }
  },


  // 园区碳核算 — 重定向到工作台（兼容旧链接）
  {
    path: '/agent-center/apps/zero-carbon-park',
    redirect: '/park-accounting/workspace',
    name: 'ZeroCarbonPark',
    meta: { title: '园区碳核算', hideBreadcrumb: true, theme: 'light' }
  },

  // 零碳工厂 — 重定向到新路由（兼容旧链接）
  {
    path: '/agent-center/apps/zero-carbon-factory',
    redirect: '/zero-carbon-factory/agent',
    name: 'ZeroCarbonFactory',
    meta: { title: '零碳工厂', hideBreadcrumb: true, theme: 'light' }
  },

  // 产品与物料库
  {
    path: '/agent-center/apps/enterprise-product-library',
    component: EnterpriseProductLibrary,
    name: 'EnterpriseProductLibrary',
    meta: { title: '产品与物料库', hideBreadcrumb: true, theme: 'light' }
  },

  // 产品SOP库
  {
    path: '/agent-center/apps/product-sop-library',
    component: ProductSOPLibrary,
    name: 'ProductSOPLibrary',
    meta: { title: '产品SOP库', hideBreadcrumb: true, theme: 'light' }
  },

  // 报告与档案中心
  {
    path: '/agent-center/apps/carbon-footprint-report',
    component: EnterpriseCarbonReport,
    name: 'EnterpriseCarbonReport',
    meta: { title: '报告与档案中心', hideBreadcrumb: true, theme: 'light' }
  },

  // 政策标准库
  {
    path: '/agent-center/apps/standards-library',
    component: StandardsLibrary,
    name: 'StandardsLibrary',
    meta: { title: '政策标准库', hideBreadcrumb: true, theme: 'light' }
  },

  // 政策标准库 - 穿透详情页
  {
    path: '/agent-center/apps/standards-library/detail',
    component: StandardsDetail,
    name: 'StandardsDetail',
    meta: { title: '政策标准库 · 详情', hideBreadcrumb: true, theme: 'light' }
  },

  // 排放因子库
  {
    path: '/agent-center/apps/emission-factor-library',
    component: EmissionFactorLibrary,
    name: 'EmissionFactorLibrary',
    meta: { title: '排放因子库', hideBreadcrumb: true, theme: 'light' }
  },

  // 单元过程库
  {
    path: '/agent-center/apps/process-library',
    component: ProcessLibrary,
    name: 'ProcessLibrary',
    meta: { title: '单元过程库', hideBreadcrumb: true, theme: 'light' }
  },

  // 组织资源库
  {
    path: '/agent-center/apps/organization-resource-library',
    component: OrganizationResourceLibrary,
    name: 'OrganizationResourceLibrary',
    meta: { title: '组织资源库', hideBreadcrumb: true, theme: 'light' }
  },

  // Skill管理
  {
    path: '/agent-center/apps/skill-management',
    component: SkillManagement,
    name: 'SkillManagement',
    meta: { title: 'Skill管理', hideBreadcrumb: true, theme: 'light' }
  },

  // 组织模板库（企业模板库）
  {
    path: '/agent-center/apps/accounting-template-library',
    component: AccountingTemplateLibrary,
    name: 'AccountingTemplateLibrary',
    meta: { title: '组织模板库', hideBreadcrumb: true, theme: 'light' }
  },

  // 平台模板库
  {
    path: '/agent-center/apps/platform-template-library',
    component: PlatformTemplateLibrary,
    name: 'PlatformTemplateLibrary',
    meta: { title: '平台模板库', hideBreadcrumb: true, theme: 'light' }
  },

  // 核算公式库
  {
    path: '/agent-center/apps/formula-library',
    component: FormulaLibrary,
    name: 'FormulaLibrary',
    meta: { title: '核算公式库', hideBreadcrumb: true, theme: 'light' }
  },

  // 佐证材料库
  {
    path: '/agent-center/apps/declaration-material-library',
    component: DeclarationMaterialLibrary,
    name: 'DeclarationMaterialLibrary',
    meta: { title: '佐证材料库', hideBreadcrumb: true, theme: 'light' }
  },

  // 企业因子库
  {
    path: '/agent-center/apps/enterprise-factor-library',
    component: EnterpriseFactorLibrary,
    name: 'EnterpriseFactorLibrary',
    meta: { title: '企业因子库', hideBreadcrumb: true, theme: 'light' }
  }
]
