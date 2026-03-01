import Vue from "vue";
import Vuex from "vuex";
Vue.use(Vuex);

import formModel from "@/store/modules/Form";
import Setting from "@/store/modules/Setting";

export default new Vuex.Store({
  modules: {
    Forms: formModel,
    Setting: Setting,
  }
});
