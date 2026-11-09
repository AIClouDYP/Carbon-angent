import { getAgents } from '../../mock/agents'

export default {
  namespaced: true,
  state: {
    agents: [],
    loading: false
  },
  mutations: {
    SET_AGENTS(state, agents) { state.agents = agents },
    SET_LOADING(state, v) { state.loading = v }
  },
  actions: {
    async fetchAgents({ commit }) {
      commit('SET_LOADING', true)
      const res = await getAgents()
      commit('SET_AGENTS', res.data)
      commit('SET_LOADING', false)
    }
  }
}
