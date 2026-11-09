import Mock from 'mockjs'
import './agents'
import './tasks'
import './chat'
import './notifications'

Mock.setup({ timeout: '300-600' })

// ★ 修复 MockJS 全局拦截导致的 "cancel" 运行时错误
// MockJS 默认拦截所有 XMLHttpRequest，未匹配mock规则的请求会抛出 Error("cancel")
// 解决方案：保留真实XHR，仅对匹配mock规则的请求走Mock拦截，其余透传到真实网络
var _origOpen = Mock.XHR.prototype.open
Mock.XHR.prototype.open = function(method, url, async, username, password) {
  // 检查当前URL是否命中任何已注册的mock规则
  var hasMockRule = false
  for (var key in Mock._mocked) {
    if (Mock._mocked.hasOwnProperty(key)) {
      var ruleUrl = Mock._mocked[key].rurl
      if (ruleUrl && (ruleUrl instanceof RegExp ? ruleUrl.test(url) : url.indexOf(ruleUrl) !== -1)) {
        hasMockRule = true
        break
      }
    }
  }
  if (!hasMockRule) {
    // 不匹配mock规则 → 创建真实XHR透传（避免cancel错误）
    this.xhr = new window.OrigXHR()
    this.xhr.open(method, url, async, username, password)
  } else {
    // 匹配mock规则 → 走Mock拦截
    _origOpen.call(this, method, url, async, username, password)
  }
}

// 保留真实 XMLHttpRequest 引用供透传使用
if (!window.OrigXHR) {
  window.OrigXHR = window.XMLHttpRequest
  Mock.XHR.prototype.withCredentials = true
}
