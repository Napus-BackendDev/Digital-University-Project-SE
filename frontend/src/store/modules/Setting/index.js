import messages from "@/store/modules/Setting/messages/index";
import status from "@/store/modules/Setting/status/index";
import verification from "@/store/modules/Setting/verification/index";
import authen from "@/store/modules/Setting/authen/index";
import question_type from "@/store/modules/Setting/question_type/index";


const module = {
    namespaced: true,
    modules: {
        messages,
        status,
        verification,
        authen,
        question_type
    },
    state: {
        lang: "en",
    },



    mutations: {
        lang(state, obj) {
            state.lang = obj;
        },
    },

    actions: {

    },

    getters: {
        lang(state, obj) {
            return state.lang;
        },

    },
};
export default module;
