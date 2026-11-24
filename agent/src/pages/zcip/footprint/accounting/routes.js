/**
 * 产品碳足迹核算模块路由配置
 *
 * 页面说明：
 *   - agent.vue：任务详情页（九阶段核算，由工作台创建/进入任务后跳转）
 *   - data-collection.vue：数据采集页（通知面板入口）
 *   - emission-detail.vue：排放源明细页（通知面板入口）
 */

// 懒加载组件（优化首屏性能）
const Agent = () => import('./agent.vue')
const DataCollection = () => import('./data-collection.vue')
const EmissionDetail = () => import('./emission-detail.vue')

export const accountingRoutes = [
  {
    path: '/footprint/accounting/agent',
    component: Agent,
    name: 'AccountingAgent',
    meta: {
      title: '产品碳足迹任务详情',
      icon: 'el-icon-cpu',
      requireAuth: true,
      breadcrumb: [],
      hideBreadcrumb: true,
      theme: 'light'
    }
  },

  // 数据采集页
  {
    path: '/footprint/accounting/data-collection',
    component: DataCollection,
    name: 'DataCollection',
    meta: {
      title: '数据采集',
      icon: 'el-icon-edit-outline',
      requireAuth: true,
      breadcrumb: ['产品碳足迹', '碳足迹核算', '数据采集'],
      theme: 'dark'
    }
  },

  // 排放源明细页
  {
    path: '/footprint/accounting/emission-detail',
    component: EmissionDetail,
    name: 'EmissionDetail',
    meta: {
      title: '排放源明细',
      icon: 'el-icon-s-grid',
      requireAuth: true,
      breadcrumb: ['产品碳足迹', '碳足迹核算', '排放源明细'],
      theme: 'dark'
    }
  }
]
