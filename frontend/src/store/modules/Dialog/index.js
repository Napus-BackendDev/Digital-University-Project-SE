const module = {
    namespaced: true,
    state: {
        loading: false,
    },
    mutations: {
        loading(state, value) {
            state.loading = value;
        },
    },
    getters: {
        loading: (state) => state.loading,
    },
};

export default module;
