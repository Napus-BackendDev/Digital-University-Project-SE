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
        getFormById({ commit } , data ) {
            return Service.form('get', data, {})
            .then(response => {
                console.log(response.data.data)
                return response.data.data;
            })
            .catch(error => {
                console.log(error);
                throw error;
            })
        },
        createForm({ commit } , data ) {
            return Service.form('create', data, {})
            .then(response => {
                commit('forms', response.data.data);
                return response;
            })
            .catch(error => {
                console.log(error);
                throw error;
            })
        },
        updateForm({ commit } , data ) {
            return Service.form('update', data, {})
            .then(response => {
                commit('forms', response.data.data);
                return response;
            })
            .catch(error => {
                console.log(error);
                throw error;
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