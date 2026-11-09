/**
 * 绿色工厂智能体路由配置
 */

const Agent = () => import('./accounting/agent.vue')

export const greenFactoryRoutes = [
  {
    path: '/green-factory/agent',
    component: Agent,
    name: 'GreenFactoryAgent',
    meta: {
      title: '绿色工厂',
      icon: 'el-icon-cpu',
      requireAuth: true,
      breadcrumb: [],
      hideBreadcrumb: true,
      theme: 'light'
    }
  }
]
