import Service from '@/services/api';
import store from '@/stores/store';

const ServeModules = {
    namespaced: true,

    state: {
        response: []   
    },
    mutations: {
        setResponse(state, questions) {
            state.questions = questions;
        }
    },
    actions: {
        async getResponse({ commit } , data ) {
            await Service.form('get', data, {})
            .then(response => { 
                store.commit('setResponse', response.data);
            })
            .catch(error => {
                console.log(error);
            })
        },
        async createResponse({ commit } , data ) {
            await Service.form('create', data, {})
            .then(response => {
                store.commit('setResponse', response.data);
            })
            .catch(error => {
                console.log(error);
            })
        },
        async updateResponse({ commit } , data ) {
            await Service.form('update', data, {})
            .then(response => {
                store.commit('setResponse', response.data);
            })
            .catch(error => {
                console.log(error);
            })
        },
        async deleteResponse({ commit } , data ) {
            await Service.form('delete', data, {})
            .then(response => {
                store.commit('setResponse', response.data);
            })
            .catch(error => {
                console.log(error);
            })
        }
    },
    getters: {
        getResponse: (state) => state.response
    }
}

export default ServeModules;