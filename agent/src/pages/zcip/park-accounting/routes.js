/**
 * 园区碳核算智能体路由配置
 *
 * 路由设计：
 *   - /park-accounting/workspace          → 工作台（任务列表）
 *   - /park-accounting/accounting/stages9 → 任务详情（九阶段）
 *
 * 在主路由配置 (src/router/index.js) 中引入本文件，
 * 并将 routes 作为 park-accounting 的子路由挂载。
 */

// 懒加载组件
const Workspace = () => import('./workspace/ParkAccountingCenter.vue')
const Stages9 = () => import('./accounting/stages9/agent.vue')

export const parkAccountingRoutes = [
  {
    path: '/park-accounting',
    redirect: '/park-accounting/workspace'
  },
  {
    path: '/park-accounting/workspace',
    component: Workspace,
    name: 'ParkAccountingWorkspace',
    meta: {
      title: '园区碳核算',
      icon: 'el-icon-s-home',
      requireAuth: true,
      breadcrumb: [],
      hideBreadcrumb: true,
      theme: 'light'
    }
  },
  {
    // 兼容旧路径：统一跳转到九阶段
    path: '/park-accounting/accounting/agent',
    redirect: to => ({
      path: '/park-accounting/accounting/stages9',
      query: to.query
    })
  },
  {
    // 任务详情：九阶段
    path: '/park-accounting/accounting/stages9',
    component: Stages9,
    name: 'ParkAccountingStages9',
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
