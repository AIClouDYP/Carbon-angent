import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// Element UI
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

// 全局样式
import './styles/global.css'

// Mock 数据（开发环境）
import './mock'

Vue.use(ElementUI, { size: 'small' })
Vue.config.productionTip = false
Vue.config.errorHandler = function(err, vm, info) {
  console.error('[Vue Error]', err, info)
  var errDiv = document.createElement('div')
  errDiv.style.cssText = 'position:fixed;bottom:0;left:0;width:100%;background:#ff4d4f;color:#fff;padding:12px;z-index:99999;font-size:12px;max-height:200px;overflow:auto;'
  errDiv.textContent = 'Vue Error: ' + err.message + '\n' + (err.stack || '') + '\nInfo: ' + info
  document.body.appendChild(errDiv)
}

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
