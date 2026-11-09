/**
 * 园区碳核算智能体路由配置
 *
 * 在主路由配置 (src/router/index.js) 中引入本文件，
 * 并将 routes 作为 park-accounting 的子路由挂载。
 */

// 懒加载组件
const Agent = () => import('./accounting/agent.vue')

export const parkAccountingRoutes = [
  {
    path: '/park-accounting/accounting/agent',
    component: Agent,
    name: 'ParkAccountingAgent',
    meta: {
      title: '园区碳核算',
      icon: 'el-icon-chat-dot-round',
      requireAuth: true,
      breadcrumb: [],
      hideBreadcrumb: true,
      theme: 'light'
    }
  }
]
