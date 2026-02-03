import Service from '@/services/api';
import store from '@/stores/store';

const ServeModules = {
    namespaced: true,

    state: {
        questions: []   
    },
    mutations: {
        setQuestions(state, questions) {
            state.questions = questions;
        }
    },
    actions: {
        async getQuestions({ commit } , data ) {
            await Service.question('get', data, {})
            .then(response => { 
                store.commit('setQuestions', response.data);
            })
            .catch(error => {
                console.log(error);
            })
        },
        async createQuestions({ commit } , data ) {
            await Service.question('create', data, {})
            .then(response => {
                store.commit('setQuestions', response.data);
            })
            .catch(error => {
                console.log(error);
            })
        },
        async updateQuestions({ commit } , data ) {
            await Service.question('update', data, {})
            .then(response => {
                store.commit('setQuestions', response.data);
            })
            .catch(error => {
                console.log(error);
            })
        },
        async deleteQuestions({ commit } , data ) {
            await Service.question('delete', data, {})
            .then(response => {
                store.commit('setQuestions', response.data);
            })
            .catch(error => {
                console.log(error);
            })
        }
    },
    getters: {
        getQuestions: (state) => state.questions
    }
}

export default ServeModules;