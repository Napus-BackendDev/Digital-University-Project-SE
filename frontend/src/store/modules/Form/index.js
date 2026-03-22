import Vue from "vue";
import Vuex from "vuex";
import store from "../../store";
import Service from "../../../service/api";

const ServerModule = {
    namespaced: true,

    state: {
        forms: [],
        duplicateBuffer: null
    },

    mutations: {
        forms(state, forms) {
            state.forms = forms;
        },
        setDuplicateBuffer(state, data) {
            state.duplicateBuffer = data;
        }
    },
    actions: {
        get({ commit }, data) {
            return Service.form('exp', data, {})
                .then(response => {
                    commit('forms', response.data.data);
                    return response;
                })
                .catch(error => { throw error; });
        },
        getById({ commit }, data) {
            return Service.form('get', data, {})
                .then(response => response.data.data)
                .catch(error => { throw error; });
        },
        create({ commit }, data) {
            return Service.form('create', data, {})
                .then(response => {
                    commit('forms', response.data.data);
                    return response;
                })
                .catch(error => { throw error; });
        },
        update({ commit, dispatch }, data) {
            return Service.form('update', data, {})
                .then(response => {
                    dispatch('get');
                    return response;
                })
                .catch(error => { throw error; });
        },
        delete({ dispatch }, data) {
            return Service.form('delete', data, {})
                .then(response => {
                    dispatch('get');
                    return response;
                })
                .catch(error => { throw error; });
        }
    },
    getters: {
        forms: (state) => state.forms,
        duplicateBuffer: (state) => state.duplicateBuffer
    }
}

export default ServerModule;