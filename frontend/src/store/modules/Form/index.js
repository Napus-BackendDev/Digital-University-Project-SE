import Vue from "vue";
import Vuex from "vuex";
import store from "../../store";
import Service from "../../../service/api";

const ServerModule = {
    namespaced: true,

    state: {
        forms: []
    },
    
    mutations: {
        forms(state, forms) {
            state.forms = forms;
        }
    },
    actions: {
        getForms({ commit } , data ) {
            Service.form('exp', data, {})
            .then(response => {
                console.log(response.data.data)
                commit('forms', response.data.data);
            })
            .catch(error => {
                console.log(error);
            })
        },
        createForm({ commit } , data ) {
            Service.form('create', data, {})
            .then(response => {
                commit('forms', response.data.data);
            })
            .catch(error => {
                console.log(error);
            })
        },
        updateForm({ commit } , data ) {
            Service.form('update', data, {})
            .then(response => {
                commit('forms', response.data.data);
            })
            .catch(error => {
                console.log(error);
            })
        },
        deleteForm({ commit } , data ) {
            Service.form('delete', data, {})
            .then(response => {
                commit('forms', response.data.data);
            })
            .catch(error => {
                console.log(error);
            })
        }
    },
    getters: {
        forms: (state) => state.forms
    }
}

export default ServerModule;