import Service from "../../../service/api";

const ServerModule = {
    namespaced: true,

    state: {
        questions: []
    },

    mutations: {
        questions(state, questions) {
            state.questions = questions;
        }
    },
    actions: {
        get({ commit }, data) {
            return Service.question('exp', data, {})
                .then(response => {
                    commit('questions', response.data.data);
                    return response;
                })
                .catch(error => { console.log(error); throw error; });
        },
        create({ commit }, data) {
            return Service.question('create', data, {})
                .then(response => {
                    commit('questions', response.data.data);
                    return response;
                })
                .catch(error => { console.log(error); throw error; });
        },
        update({ commit }, data) {
            return Service.question('update', data, {})
                .then(response => {
                    commit('questions', response.data.data);
                    return response;
                })
                .catch(error => { console.log(error); throw error; });
        },
        delete({ commit }, data) {
            return Service.question('delete', data, {})
                .then(response => {
                    commit('questions', response.data.data);
                    return response;
                })
                .catch(error => { console.log(error); throw error; });
        }
    },
    getters: {
        questions: (state) => state.questions
    }
}

export default ServerModule;
