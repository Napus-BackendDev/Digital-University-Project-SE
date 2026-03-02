import Vue from "vue";
import Vuex from "vuex";
Vue.use(Vuex);

import formModel from "@/store/modules/Form";
import Setting from "@/store/modules/Setting";
import Questions from "@/store/modules/Questions/index.js";

export default new Vuex.Store({
  modules: {
    Forms: formModel,
    Setting: Setting,
    Questions: Questions
  }
});
