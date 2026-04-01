
import Service from "@/service/api.js";

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
            return Service.setting('controll-get', data, {})
                .then((response) => {
                    commit("item", response.data.data)
                    return response;
                }).catch((err) => {
                    throw err;
                });
        },
        create({ commit }, data) {
            return Service.setting('controll-create', data, {})
                .then((response) => {
                    return response;
                }).catch((err) => {
                    throw err;
                });
        },
        update({ commit }, data) {
            return Service.setting('controll-update', data, {})
                .then((response) => {
                    return response;
                }).catch((err) => {
                    throw err;
                });
        },
        delete({ commit }, data) {
            return Service.setting('controll-delete', data, {})
                .then((response) => {
                    return response;
                }).catch((err) => {
                    throw err;
                });
        },
    },

    getters: {
        item(state) {
            return state.item;
        },
    },
};

export default module;
