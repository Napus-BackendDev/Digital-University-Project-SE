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
            return Service.response('get-by-id', data, {})
                .then(response => {
                    commit('responses', response.data.data || []);
                    return response.data.data;
                })
                .catch(err => { throw err; });
        },
        create({ commit }, data) {
            const hasFile = (data.answers || []).some(ans =>
                ans.response instanceof File ||
                (Array.isArray(ans.response) && ans.response.some(r => r instanceof File))
            );

            let payload;
            if (hasFile) {
                const formData = new FormData();
                formData.append('responder', data.responder);
                formData.append('form', data.form);
                (data.answers || []).forEach((ans, idx) => {
                    formData.append(`answers[${idx}][question]`, ans.question);
                    if (ans.response instanceof File) {
                        formData.append('file', ans.response, ans.response.name);
                        formData.append(`answers[${idx}][response]`, ans.response.name);
                    } else {
                        formData.append(`answers[${idx}][response]`,
                            Array.isArray(ans.response) ? JSON.stringify(ans.response) : String(ans.response ?? '')
                        );
                    }
                });
                payload = formData;
            } else {
                payload = {
                    responder: data.responder,
                    form: data.form,
                    answers: (data.answers || []).map(ans => ({
                        question: ans.question,
                        response: Array.isArray(ans.response)
                            ? JSON.stringify(ans.response)
                            : String(ans.response ?? '')
                    }))
                };
            }

            return Service.response(hasFile ? 'submit' : 'create', payload, {})
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
