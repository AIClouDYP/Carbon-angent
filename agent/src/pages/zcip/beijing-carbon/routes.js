/**
 * 北京碳市场管控模块路由配置
 */

// 懒加载智能体页面
const Agent = () => import('./accounting/agent.vue')

export const beijingCarbonRoutes = [
  {
    path: '/beijing-carbon/accounting/agent',
    component: Agent,
    name: 'BeijingCarbonAgent',
    meta: {
      title: '北京碳市场',
      icon: 'el-icon-s-flag',
      requireAuth: true,
      hideBreadcrumb: true,
      theme: 'light'
    }
  }
]
