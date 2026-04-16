import Service from "@/service/api.js";

const module = {
    namespaced: true,
    state: {
        roles: [],
        role: null
    },
    mutations: {
        roles(state, data) {
            state.roles = data;
        },
        role(state, data) {
            state.role = data;
        }
    },
    actions: {
        get({ commit }, data) {
            return Service.roles('get', data)
                .then(response => {
                    const role = response.data.data;
                    commit('role', role);
                    return role;
                })
                .catch(err => { throw err; });
        },
        getAll({ commit }) {
            return Service.roles('exp')
                .then(response => {
                    const roles = response.data.data || [];
                    commit('roles', roles);
                    return roles;
                })
                .catch(err => { throw err; });
        },
        create({ commit }, data) {
            return Service.roles('create', data)
                .then(response => {
                    return response.data;
                })
                .catch(err => { throw err; });
        },
        update({ commit }, data) {
            return Service.roles('update', data)
                .then(response => {
                    return response.data;
                })
                .catch(err => { throw err; });
        },
        delete({ commit }, data) {
            return Service.roles('delete', data)
                .then(response => {
                    return response.data;
                })
                .catch(err => { throw err; });
        }
    },
    getters: {
        roles: state => state.roles,
        role: state => state.role
    }
};

export default module;
