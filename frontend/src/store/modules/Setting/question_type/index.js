
import Service from "@/service/api.js";
import store from "@/store/store";

const module = {
    namespaced: true,
    state: {
        item: []
    },

    mutations: {
        item(state, obj) {
            state.item = obj;
        }
    },

    actions: {
        get({ commit }, data) {
            Service.setting('question-type-get', {}, {})
                .then((response) => {
                    commit("item", response.data.data);
                }).catch((err) => {
                });
        },
        post({ commit }, data) {
            Service.setting('question-type-create', data, {})
                .then((response) => {

                }).catch((err) => {
                });
        },
        put({ commit }, data) {
            Service.setting('question-type-update', data, {})
                .then((response) => {

                }).catch((err) => {
                });
        },
        delete({ commit }, data) {
            Service.setting('question-type-delete', data, {})
                .then((response) => {

                }).catch((err) => {
                });
        },
    },

    getters: {
        item(state, obj) {
            return state.item;
        },
    },
};

export default module;
