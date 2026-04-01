const state = {
    dialog: {
        status: false,
        title: "Notification",
        number: "1",
        code: "0",
        message: "",
        button: [
            {
                label: "CANCEL",
                icon: "cil-ban",
                color: "secondary",
                code: "cancel"
            },
            {
                label: "CONFIRM",
                icon: "cil-check",
                color: "danger",
                code: "confirm"
            }
        ]
    },
    isCode: "",
    loading: false
};

const mutations = {
    dialog(state, obj) {
        state.dialog = { ...state.dialog, ...obj };
    },
    isCode(state, code) {
        state.isCode = code;
    },
    loading(state, status) {
        state.loading = status;
    }
};

const actions = {
    open({ commit }, options) {
        commit("isCode", "");
        commit("dialog", { ...options, status: true });
    },
    close({ commit }) {
        commit("dialog", { status: false });
    }
};

const getters = {
    dialog: state => state.dialog,
    isCode: state => state.isCode,
    loading: state => state.loading
};

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
};
