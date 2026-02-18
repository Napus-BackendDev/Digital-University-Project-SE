import Vue from "vue";
import Vuex from "vuex";
Vue.use(Vuex);



import formModel from "@/store/modules/Form";
import questionModel from "@/store/modules/Questions";
import settingModel from "@/store/modules/Setting";
// import responseModel from "@/store/modules/responseModel";
// import settingModel from "@/store/modules/settingModel";
// import organizationModel from "@/store/modules/organizationModel";

export default new Vuex.Store({
  modules: {
    Forms: formModel,
    Questions: questionModel,
    setting: settingModel,
  }
});
