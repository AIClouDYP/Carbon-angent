/**
 * 产品环境足迹(PEF)核算模块路由配置
 *
 * 页面说明：
 *   - agent.vue：九阶段工作台（由智能体中心创建任务后跳转进入）
 *   - data-collection.vue：数据采集页（通知面板入口）
 *   - emission-detail.vue：排放源明细页（通知面板入口）
 */

// 懒加载组件（优化首屏性能）
const Agent = () => import('./accounting/agent.vue')
const DataCollection = () => import('./accounting/data-collection.vue')
const EmissionDetail = () => import('./accounting/emission-detail.vue')

export const pefAccountingRoutes = [
  {
    path: '/pef-accounting/accounting/agent',
    component: Agent,
    name: 'PefAccountingAgent',
    meta: {
      title: '环境足迹智能体',
      icon: 'el-icon-s-marketing',
      requireAuth: true,
      breadcrumb: [],
      hideBreadcrumb: true,
      theme: 'light'
    }
  },

  // 数据采集页
  {
    path: '/pef-accounting/accounting/data-collection',
    component: DataCollection,
    name: 'PefDataCollection',
    meta: {
      title: '数据采集',
      icon: 'el-icon-edit-outline',
      requireAuth: true,
      breadcrumb: ['产品环境足迹', '环境足迹核算', '数据采集'],
      theme: 'dark'
    }
  },

  // 排放源明细页
  {
    path: '/pef-accounting/accounting/emission-detail',
    component: EmissionDetail,
    name: 'PefEmissionDetail',
    meta: {
      title: '排放源明细',
      icon: 'el-icon-s-grid',
      requireAuth: true,
      breadcrumb: ['产品环境足迹', '环境足迹核算', '排放源明细'],
      theme: 'dark'
    }
  }
]
