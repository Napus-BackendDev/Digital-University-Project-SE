import api from '@/service/api';

const module = {
    namespaced: true,
    state: {
        user: null,
        users: []
    },
    mutations: {
        user(state, obj) {
            state.user = obj;
        },
        users(state, list) {
            state.users = list;
        }
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
        },
        async getAll({ commit }) {
            try {
                const res = await api.user('exp');
                const users = (res && res.data && res.data.data) || [];
                commit('users', users); // Make sure mutation exists
                return users;
            } catch (err) {
                console.error('User/getAll error:', err);
                throw err;
            }
        }
    },
    getters: {
        user(state) {
            return state.user;
        },
        users(state) {
            return state.users;
        }
    }
};

export default module;
