import { sendMessage } from '../../mock/chat'

let convIdCounter = 100

function generateConvId() {
  return 'conv-' + (++convIdCounter)
}

export default {
  namespaced: true,
  state: {
    conversations: [],
    currentConversationId: '',
    models: [
      { id: 'claude-opus-4', name: 'Claude Opus 4', tag: '推荐' },
      { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', tag: '快速' },
      { id: 'claude-haiku-4', name: 'Claude Haiku 4', tag: '轻量' },
      { id: 'gpt-4o', name: 'GPT-4o', tag: '' }
    ],
    currentModel: 'claude-opus-4',
    sending: false
  },
  getters: {
    currentConversation(state) {
      return state.conversations.find(function(c) { return c.id === state.currentConversationId }) || null
    },
    messages(state, getters) {
      var conv = getters.currentConversation
      return (conv && conv.messages) ? conv.messages : []
    },
    currentAgentId(state, getters) {
      var conv = getters.currentConversation
      return (conv && conv.agentId) ? conv.agentId : ''
    }
  },
  mutations: {
    SET_CONVERSATIONS(state, list) { state.conversations = list },
    SET_CURRENT_CONVERSATION(state, id) { state.currentConversationId = id },
    SET_CURRENT_MODEL(state, id) { state.currentModel = id },
    SET_SENDING(state, v) { state.sending = v },
    ADD_CONVERSATION(state, conv) { state.conversations.unshift(conv) },
    REMOVE_CONVERSATION(state, id) {
      var idx = state.conversations.findIndex(function(c) { return c.id === id })
      if (idx > -1) state.conversations.splice(idx, 1)
    },
    ADD_MESSAGE(state, payload) {
      var conv = state.conversations.find(function(c) { return c.id === payload.conversationId })
      if (conv) conv.messages.push(payload.msg)
    },
    SET_CONV_TITLE(state, payload) {
      var conv = state.conversations.find(function(c) { return c.id === payload.conversationId })
      if (conv) conv.title = payload.title
    }
  },
  actions: {
    createConversation({ commit, state }, payload) {
      var agentId = (payload && payload.agentId) || ''
      var id = generateConvId()
      var conv = {
        id: id,
        title: '新会话',
        agentId: agentId,
        model: state.currentModel,
        messages: [],
        createdAt: Date.now()
      }
      commit('ADD_CONVERSATION', conv)
      commit('SET_CURRENT_CONVERSATION', id)
      return id
    },
    selectConversation({ commit }, id) {
      commit('SET_CURRENT_CONVERSATION', id)
    },
    deleteConversation({ commit, state }, id) {
      commit('REMOVE_CONVERSATION', id)
      if (state.currentConversationId === id) {
        var next = state.conversations[0]
        commit('SET_CURRENT_CONVERSATION', next ? next.id : '')
      }
    },
    selectModel({ commit }, modelId) {
      commit('SET_CURRENT_MODEL', modelId)
    },
    async sendMessage({ commit, state, getters }, content) {
      var convId = state.currentConversationId
      if (!convId) return
      commit('ADD_MESSAGE', { conversationId: convId, msg: { role: 'user', content: content, time: Date.now() } })
      commit('SET_SENDING', true)

      var conv = getters.currentConversation
      if (conv && conv.title === '新会话' && conv.messages.filter(function(m) { return m.role === 'user' }).length === 1) {
        var shortTitle = content.length > 20 ? content.slice(0, 20) + '...' : content
        commit('SET_CONV_TITLE', { conversationId: convId, title: shortTitle })
      }

      var agentId = (conv && conv.agentId) ? conv.agentId : ''
      var res = await sendMessage({ agentId: agentId, content: content, model: state.currentModel })
      var msgData = Object.assign({ role: 'agent', model: state.currentModel, time: Date.now() }, res.data)
      commit('ADD_MESSAGE', { conversationId: convId, msg: msgData })
      commit('SET_SENDING', false)
      return res
    }
  }
}
