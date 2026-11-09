/**
 * 组织碳核算智能体路由配置
 *
 * 页面说明：
 *   - agent.vue：组织碳核算智能体（菜单直达入口）
 */

// 懒加载组件
const Agent = () => import('./accounting/agent.vue')

export const orgAccountingRoutes = [
  {
    path: '/org-accounting/accounting',
    redirect: '/org-accounting/accounting/agent'
  },
  {
    path: '/org-accounting/accounting/agent',
    component: Agent,
    name: 'OrgAccountingAgent',
    meta: {
      title: '组织碳核算',
      icon: 'el-icon-chat-dot-round',
      requireAuth: true,
      breadcrumb: [],
      hideBreadcrumb: true,
      theme: 'light'
    }
  }
]
