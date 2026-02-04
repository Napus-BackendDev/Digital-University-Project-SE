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
        async getForms({ commit } , data ) {
            await Service.form('exp', data, {})
            .then(response => {
                console.log("data", response.data.data);
                commit('forms', response.data.data);
            })
            .catch(error => {
                console.log(error);
            })
        },
        async createForm({ commit } , data ) {
            await Service.form('create', data, {})
            .then(response => {
                commit('forms', response.data.data);
            })
            .catch(error => {
                console.log(error);
            })
        },
        async updateForm({ commit } , data ) {
            await Service.form('update', data, {})
            .then(response => {
                commit('forms', response.data.data);
            })
            .catch(error => {
                console.log(error);
            })
        },
        async deleteForm({ commit } , data ) {
            await Service.form('delete', data, {})
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