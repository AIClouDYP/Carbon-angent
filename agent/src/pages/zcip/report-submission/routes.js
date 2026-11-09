/**
 * 智慧报告智能体路由配置
 */

const ReportSubmissionCenter = () => import('./views/ReportSubmissionCenter.vue')

export const reportSubmissionRoutes = [
  {
    path: '/agent-center/apps/report-submission',
    component: ReportSubmissionCenter,
    name: 'ReportSubmissionCenter',
    meta: {
      title: '智慧报告',
      breadcrumb: ['首页', '应用中心', '智慧报告'],
      hideBreadcrumb: true,
      theme: 'light'
    }
  }
]
