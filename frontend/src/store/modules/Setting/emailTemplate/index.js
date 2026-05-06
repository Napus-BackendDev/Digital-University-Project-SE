import Service from "@/service/api.js";
import store from "@/store/store";

const module = {
    namespaced: true,
    state: {
        item: [],
        current: null
    },

    mutations: {
        item(state, obj) {
            state.item = obj;
        },
        current(state, obj) {
            state.current = obj;
        }
    },

    actions: {
        get({ commit }, data) {
            return Service.setting('email-template-get', data || {}, {})
                .then((response) => {
                    if(data && data.id) {
                        commit("current", response.data.data)
                    } else {
                        commit("item", response.data.data)
                    }
                    return response.data.data;
                }).catch((err) => {
                    throw err;
                });
        },
        post({ commit }, data) {
            return Service.setting('email-template-create', data, {})
                .then((response) => {
                    return response;
                }).catch((err) => {
                    throw err;
                });
        },
        put({ commit }, data) {
            return Service.setting('email-template-update', data, {})
                .then((response) => {
                    return response;
                }).catch((err) => {
                    throw err;
                });
        },
        delete({ commit }, data) {
            return Service.setting('email-template-delete', data, {})
                .then((response) => {
                    return response;
                }).catch((err) => {
                    throw err;
                });
        },
    },

    getters: {
        item(state, obj) {
            return state.item;
        },
        current(state, obj) {
            return state.current;
        }
    },
};

export default module;
