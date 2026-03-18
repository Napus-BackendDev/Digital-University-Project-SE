import Service from "@/service/api.js";

const module = {
    namespaced: true,
    state: {
        organizations: [],
        organization: null
    },
    mutations: {
        organizations(state, data) {
            state.organizations = data;
        },
        organization(state, data) {
            state.organization = data;
        }
    },
    actions: {
        get({ commit }, data) {
            // This is for getting one organization by ID via POST
            return Service.organization('get', data)
                .then(response => {
                    const org = response.data.data;
                    commit('organization', org);
                    return org;
                })
                .catch(err => { throw err; });
        },
        getAll({ commit }) {
            // This is for listing all organizations
            return Service.organization('exp')
                .then(response => {
                    const orgs = response.data.data || [];
                    commit('organizations', orgs);
                    return orgs;
                })
                .catch(err => { throw err; });
        },
        create({ commit }, data) {
            return Service.organization('create', data)
                .then(response => {
                    return response.data;
                })
                .catch(err => { throw err; });
        },
        update({ commit }, data) {
            return Service.organization('update', data)
                .then(response => {
                    return response.data;
                })
                .catch(err => { throw err; });
        },
        delete({ commit }, data) {
            return Service.organization('delete', data)
                .then(response => {
                    return response.data;
                })
                .catch(err => { throw err; });
        }
    },
    getters: {
        organizations: state => state.organizations,
        organization: state => state.organization
    }
};

export default module;
