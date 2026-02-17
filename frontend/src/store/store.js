import Vue from "vue";
import Vuex from "vuex";
Vue.use(Vuex);

import formModel from "@/store/modules/Form";
import questionModel from "@/store/modules/Questions";
import settingModel from "@/store/modules/Setting";

export default new Vuex.Store({
  modules : {
      Forms: formModel,
      Questions: questionModel,
      setting: settingModel,
  }
});
