
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
            Service.setting('get', {}, {})
                .then((response) => {
                    console.log('data ไอควย', response.data.data);
                    commit("item", response.data.data);
                }).catch((err) => {
                });
        },
        post({ commit }, data) {
            Service.setting('create', data, {})
                .then((response) => {

                }).catch((err) => {
                });
        },
        put({ commit }, data) {
            Service.setting('update', data, {})
                .then((response) => {

                }).catch((err) => {
                });
        },
        delete({ commit }, data) {
            Service.setting('delete', data, {})
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
