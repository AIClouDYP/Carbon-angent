/**
 * 企业产品库统一存取（全平台单一来源）
 * key: cfp_products_v4（与 EnterpriseProductLibrary.vue 同源）
 * 任何写入都广播 cfp-products-changed 自定义事件（同页面内 storage 事件不触发）
 */
export const PRODUCT_STORE_KEY = 'cfp_products_v4'

export function loadCfpProducts() {
  try {
    return JSON.parse(localStorage.getItem(PRODUCT_STORE_KEY) || '[]')
  } catch (e) {
    return []
  }
}

export function saveCfpProducts(list) {
  try {
    localStorage.setItem(PRODUCT_STORE_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('cfp-products-changed'))
  } catch (e) { /* ignore */ }
}
