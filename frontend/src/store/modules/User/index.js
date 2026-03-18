import api from '@/service/api';

const module = {
    namespaced: true,
    state: {
        user: null,
    },
    mutations: {
        user(state, obj) {
            state.user = obj;
        },
    },
    actions: {
        async get({ commit }, payload) {
            try {
                const res = await api.user('get', payload);
                const data = res && res.data && res.data.data;
                const user = Array.isArray(data) ? data[0] : (data?.data || data);
                if (user) {
                    commit('user', user);
                    return user;
                }
            } catch (err) {
                console.error('User/get error:', err);
                throw err;
            }
        }
    },
    getters: {
        user(state) {
            return state.user;
        }
    }
};

export default module;
