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
        exp({ commit }, data) {
            return Service.response('exp', data, {})
                .then(response => {
                    commit('responses', response.data.data || []);
                    return response;
                })
                .catch(err => { throw err; });
        },
        get({ commit }, data) {
            return Service.response('get', data, {})
                .then(response => {
                    const result = response.data.data;
                    if (Array.isArray(result)) {
                        commit('responses', result);
                    }
                    return result;
                })
                .catch(err => {
                    const statusCode = err?.response?.status || err?.response?.data?.httpcode;
                    if (statusCode === 404) {
                        if (data && data._id) {
                            return null;
                        }
                        commit('responses', []);
                        return [];
                    }
                    throw err;
                });
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
                formData.append('submit', String(!!data.submit));

                const files = [];
                const fileQuestions = [];
                (data.answers || []).forEach(ans => {
                    if (ans.response instanceof File) {
                        files.push(ans.response);
                        fileQuestions.push(ans.question);
                    } else if (Array.isArray(ans.response)) {
                        ans.response.forEach(r => {
                            if (r instanceof File) {
                                files.push(r);
                                fileQuestions.push(ans.question);
                            }
                        });
                    }
                });

                const answersPayload = (data.answers || []).map(ans => ({
                    question: ans.question,
                    response: Array.isArray(ans.response)
                        ? JSON.stringify(ans.response.map(r => r instanceof File ? (r.name || '') : r))
                        : (ans.response instanceof File ? (ans.response.name || '') : String(ans.response ?? ''))
                }));

                formData.append('answers', JSON.stringify(answersPayload));

                // attach files as repeated 'file' fields and append matching answers[question] entries
                files.forEach((file, idx) => {
                    formData.append('answers[question]', fileQuestions[idx]);
                    formData.append('answers[response]', file, file.name);
                });

                payload = formData;
            } else {
                payload = {
                    responder: data.responder,
                    form: data.form,
                    submit: !!data.submit,
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
                .catch(err => { throw err; });
        },
        update({ commit }, data) {
            const hasFile = (data.answers || []).some(ans =>
                ans.response instanceof File ||
                (Array.isArray(ans.response) && ans.response.some(r => r instanceof File))
            );

            let payload = data;
            if (hasFile) {
                const formData = new FormData();
                formData.append('responder', data.responder);
                formData.append('form', data.form);
                if (data._id) formData.append('_id', data._id);
                if (typeof data.submit !== 'undefined') {
                    formData.append('submit', String(!!data.submit));
                }

                // collect all files and their question ids
                const files = [];
                const fileQuestions = [];
                (data.answers || []).forEach(ans => {
                    if (ans.response instanceof File) {
                        files.push(ans.response);
                        fileQuestions.push(ans.question);
                    } else if (Array.isArray(ans.response)) {
                        ans.response.forEach(r => {
                            if (r instanceof File) {
                                files.push(r);
                                fileQuestions.push(ans.question);
                            }
                        });
                    }
                });

                const answersPayload = (data.answers || []).map(ans => ({
                    question: ans.question,
                    response: Array.isArray(ans.response)
                        ? JSON.stringify(ans.response.map(r => r instanceof File ? (r.name || '') : r))
                        : (ans.response instanceof File ? (ans.response.name || '') : String(ans.response ?? ''))
                }));

                formData.append('answers', JSON.stringify(answersPayload));
                files.forEach((file, idx) => {
                    formData.append('answers[question]', fileQuestions[idx]);
                    formData.append('answers[response]', file, file.name);
                });
                payload = formData;
            }

            return Service.response(hasFile ? 'update-multipart' : 'update', payload, {})
                .then(response => {
                    commit('responses', response.data.data);
                    return response;
                })
                .catch(err => { throw err; });
        },
        delete({ commit, state }, data) {
            // Send ID in both query and data for maximum compatibility across server configurations
            const config = {
                params: { _id: data._id || data.id },
                data: data
            };
            return Service.response('delete', config.data, config)
                .then(response => {
                    // Filter out the deleted response from the local state
                    const deletedId = data._id || data.id || (response.data && response.data.data && response.data.data._id);
                    if (deletedId && Array.isArray(state.responses)) {
                        const newList = state.responses.filter(r => (r._id || r.id) !== String(deletedId));
                        commit('responses', newList);
                    }
                    return response;
                })
                .catch(err => { throw err; });
        }
    },
    getters: {
        responses: state => state.responses
    }
};

export default module;
