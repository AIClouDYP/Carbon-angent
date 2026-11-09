import { getTasks } from '../../mock/tasks'

export default {
  namespaced: true,
  state: {
    tasks: [],
    loading: false,
    filters: { agentId: '', status: '', dateRange: [] }
  },
  mutations: {
    SET_TASKS(state, tasks) { state.tasks = tasks },
    SET_LOADING(state, v) { state.loading = v },
    SET_FILTERS(state, filters) { state.filters = { ...state.filters, ...filters } }
  },
  actions: {
    async fetchTasks({ commit, state }) {
      commit('SET_LOADING', true)
      const res = await getTasks(state.filters)
      commit('SET_TASKS', res.data)
      commit('SET_LOADING', false)
    }
  }
}
