import Vue from 'vue'
import Vuex from 'vuex'
import agent from './modules/agent'
import task from './modules/task'
import chat from './modules/chat'
import notification from './modules/notification'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: { agent, task, chat, notification }
})
