/**
 * 园区碳核算智能体路由配置
 *
 * 双模式设计：
 *   - /park-accounting/workspace          → 工作台（任务列表）
 *   - /park-accounting/accounting/agent   → 任务详情（默认任务走三步·五项确认）
 *   - /park-accounting/accounting/stages9 → 任务详情（新建任务走九阶段）
 *
 * 在主路由配置 (src/router/index.js) 中引入本文件，
 * 并将 routes 作为 park-accounting 的子路由挂载。
 */

// 懒加载组件
const Workspace = () => import('./workspace/ParkAccountingCenter.vue')
const Agent = () => import('./accounting/agent.vue')
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
    // 默认任务：三步·五项确认
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
  },
  {
    // 新建任务：九阶段
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
