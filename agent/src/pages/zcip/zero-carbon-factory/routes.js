/**
 * 零碳工厂智能体路由配置
 *
 * 在主路由配置 (src/router/index.js) 中引入本文件，
 * 并将 routes 作为 zero-carbon-factory 的子路由挂载。
 */

// 懒加载组件
const Agent = () => import('./accounting/agent.vue')

export const zeroCarbonFactoryRoutes = [
  {
    path: '/zero-carbon-factory/agent',
    component: Agent,
    name: 'ZeroCarbonFactoryAgent',
    meta: {
      title: '零碳工厂',
      icon: 'el-icon-cpu',
      requireAuth: true,
      breadcrumb: [],
      hideBreadcrumb: true,
      theme: 'light'
    }
  }
]
