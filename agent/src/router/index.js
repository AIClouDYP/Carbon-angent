import Vue from 'vue'
import VueRouter from 'vue-router'
import { accountingRoutes } from '@/pages/zcip/footprint/accounting/routes'
import { orgAccountingRoutes } from '@/pages/zcip/org-accounting/routes'
import { agentCenterRoutes } from '@/pages/zcip/agent-center/routes'
import { reportSubmissionRoutes } from '@/pages/zcip/report-submission/routes'
import { parkAccountingRoutes } from '@/pages/zcip/park-accounting/routes'
import { pefAccountingRoutes } from '@/pages/zcip/pef-accounting/routes'
import { beijingCarbonRoutes } from '@/pages/zcip/beijing-carbon/routes'
import { zeroCarbonFactoryRoutes } from '@/pages/zcip/zero-carbon-factory/routes'
import { greenFactoryRoutes } from '@/pages/zcip/green-factory/routes'

Vue.use(VueRouter)
const routes = [
  // 默认重定向到智能体中心
  {
    path: '/',
    redirect: '/agent-center/apps'
  },

  // 智能体中心路由
  ...agentCenterRoutes,

  // 产品碳足迹核算模块路由
  ...accountingRoutes,

  // 组织碳核算模块路由
  ...orgAccountingRoutes,

  // 智慧报告智能体路由
  ...reportSubmissionRoutes,

  // 园区碳核算模块路由
  ...parkAccountingRoutes,

  // 产品环境足迹模块路由
  ...pefAccountingRoutes,

  // 北京碳市场模块路由
  ...beijingCarbonRoutes,

  // 零碳工厂模块路由
  ...zeroCarbonFactoryRoutes,

  // 绿色工厂模块路由
  ...greenFactoryRoutes,

  // 兜底：未匹配的路由回到智能体中心
  {
    path: '*',
    redirect: '/agent-center/apps'
  }
]

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { x: 0, y: 0 }
  }
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title
    ? `${to.meta.title} | 零碳园区智慧能碳服务平台`
    : '零碳园区智慧能碳服务平台'
  next()
})

export default router
