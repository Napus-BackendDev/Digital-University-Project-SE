import Vue from "vue";
import Vuex from "vuex";
Vue.use(Vuex);

import Form from "@/store/modules/Form";
import Setting from "@/store/modules/Setting";
import Questions from "@/store/modules/Questions/index.js";
import Responses from "@/store/modules/Responses/index.js";

export default new Vuex.Store({
  modules: {
    Forms: Form,
    Setting: Setting,
    Questions: Questions,
    Responses: Responses
  }
});
