import Vue from "vue";
import Vuex from "vuex";
Vue.use(Vuex);

import Form from "@/store/modules/Form";
import Setting from "@/store/modules/Setting";
import Questions from "@/store/modules/Questions/index.js";
import Responses from "@/store/modules/Responses/index.js";

const state = {
  sidebarShow: 'responsive',
  sidebarMinimize: false,
  asideShow: false,
  darkMode: true
}

const mutations = {
  toggleSidebarDesktop (state) {
    const sidebarOpened = [true, 'responsive'].includes(state.sidebarShow)
    state.sidebarShow = sidebarOpened ? false : 'responsive'
  },
  toggleSidebarMobile (state) {
    const sidebarClosed = [false, 'responsive'].includes(state.sidebarShow)
    state.sidebarShow = sidebarClosed ? true : 'responsive'
  },
  set (state, [variable, value]) {
    state[variable] = value
  },
  toggle (state, variable) {
    state[variable] = !state[variable]
  }
}

export default new Vuex.Store({
  state,
  mutations,
  modules: {
    Forms: Form,
    Setting: Setting,
    Questions: Questions,
    Responses: Responses
  }
});
