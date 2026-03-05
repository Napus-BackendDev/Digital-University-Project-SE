import Service from "@/service/api.js";

const module = {
    namespaced: true,
    state: {
        responses: []
    },
    mutations: {
        responses(state, data) {
            state.responses = data;
        }
    },
    actions: {
        get({ commit }, data) {
            return Service.response('get-by-form-id', data, {})
                .then(response => {
                    commit('responses', response.data.data || []);
                    return response;
                })
                .catch(err => { throw err; });
        },
        getById({ commit }, data) {
            return Service.response('get-by-form-id', data, {})
                .then(response => {
                    commit('responses', response.data.data || []);
                    return response.data.data;
                })
                .catch(err => { throw err; });
        },
        create({ commit }, data) {
            const formData = new FormData();
            formData.append('responder', data.responder);
            formData.append('form', data.form);

            (data.answers || []).forEach((ans, idx) => {
                if (ans.response instanceof File) {
                    formData.append(`answers[${idx}][question]`, ans.question);
                    formData.append(`answers[${idx}][response]`, ans.response);
                } else if (Array.isArray(ans.response) && ans.response.some(r => r instanceof File)) {
                    formData.append(`answers[${idx}][question]`, ans.question);
                    ans.response.forEach(file => formData.append(`answers[${idx}][response]`, file));
                } else {
                    formData.append(`answers[${idx}][question]`, ans.question);
                    formData.append(`answers[${idx}][response]`,
                        ans.response === null || ans.response === undefined ? '' :
                            Array.isArray(ans.response) ? JSON.stringify(ans.response) :
                                String(ans.response)
                    );
                }
            });

            return Service.response('submit', formData, {})
                .then(response => {
                    commit('responses', response.data.data);
                    return response;
                })
                .catch(err => { console.log(err); throw err; });
        },
        update({ commit }, data) {
            return Service.response('update', data, {})
                .then(response => {
                    commit('responses', response.data.data);
                    return response;
                })
                .catch(err => { console.log(err); throw err; });
        },
        delete({ commit }, data) {
            return Service.response('delete', data, {})
                .then(response => {
                    commit('responses', response.data.data);
                    return response;
                })
                .catch(err => { console.log(err); throw err; });
        }
    },
    getters: {
        responses: state => state.responses
    }
};

export default module;
