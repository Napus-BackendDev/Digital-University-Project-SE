import messages from "@/store/modules/Setting/messages/index";
import status from "@/store/modules/Setting/status/index";
import verification from "@/store/modules/Setting/verification/index";
import authen from "@/store/modules/Setting/authen/index";
import question_type from "@/store/modules/Setting/question_type/index";
import collaborator from "@/store/modules/Setting/controll/index";
import emailTemplate from "@/store/modules/Setting/emailTemplate/index";


const module = {
    namespaced: true,
    modules: {
        messages,
        status,
        verification,
        authen,
        question_type,
        collaborator,
        emailTemplate
    },
    state: {
        lang: getInitialLanguage(),
    },

    mutations: {
        lang(state, obj) {
            state.lang = obj;
            localStorage.setItem("lang", obj);
            // Dynamic import to avoid circular dependency if possible, 
            // but since i18n is exported we can just import it or use root instance if available.
            // For now, we will handle the i18n.locale update in the action or component if needed,
            // but usually, it's safer to do it where the state changes.
        },
    },

    actions: {
        setLang({ commit }, lang) {
            commit("lang", lang);
            // We'll need a way to reach the i18n instance. 
            // In many Vue 2 projects, it's attached to the root.
        }
    },

    getters: {
        lang(state, obj) {
            return state.lang;
        },

    },
};
export default module;

function getMachineLanguage() {
    const locale = (navigator.languages?.[0] || navigator.language || 'en').split(/[-_]/)[0].toLowerCase();
    return ['th', 'en'].includes(locale) ? locale : 'en';
}

function getInitialLanguage() {
    const savedLanguage = localStorage.getItem('lang');
    return ['th', 'en'].includes(savedLanguage) ? savedLanguage : getMachineLanguage();
}
