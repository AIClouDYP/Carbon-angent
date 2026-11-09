import { getNotifications, getUnreadCount } from '../../mock/notifications'

export default {
  namespaced: true,
  state: {
    notifications: [],
    unreadCount: 0,
    loading: false
  },
  mutations: {
    SET_NOTIFICATIONS(state, list) { state.notifications = list },
    SET_UNREAD_COUNT(state, n) { state.unreadCount = n },
    SET_LOADING(state, v) { state.loading = v }
  },
  actions: {
    async fetchNotifications({ commit }) {
      commit('SET_LOADING', true)
      const [listRes, countRes] = await Promise.all([getNotifications(), getUnreadCount()])
      commit('SET_NOTIFICATIONS', listRes.data)
      commit('SET_UNREAD_COUNT', countRes.data)
      commit('SET_LOADING', false)
    }
  }
}
