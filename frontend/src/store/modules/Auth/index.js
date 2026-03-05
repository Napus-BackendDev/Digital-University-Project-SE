import Service from "@/service/api.js";
import router from "@/router/index";

const module = {
  namespaced: true,

  state: {
    user: null,
    isAuthenticated: false,
    loading: false,
  },

  mutations: {
    SET_USER(state, user) {
      state.user = user;
      state.isAuthenticated = !!user;
    },
    CLEAR_USER(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
  },

  actions: {
    // Google Sign-In: send id_token to backend
    async singin({ commit }, { token }) {
      commit("SET_LOADING", true);
      try {
        const response = await Service.auth("google-login", { credential: token });
        commit("SET_USER", response.data.user);
        router.push("/").catch(() => {});
        return response.data;
      } catch (error) {
        commit("CLEAR_USER");
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    // Fetch current user from cookie session
    async fetchMe({ commit }) {
      try {
        const response = await Service.auth("me");
        commit("SET_USER", response.data.user);
        return response.data.user;
      } catch (error) {
        commit("CLEAR_USER");
        return null;
      }
    },

    // Logout
    async logout({ commit }) {
      try {
        await Service.auth("logout");
      } catch (error) {
        // ignore
      } finally {
        commit("CLEAR_USER");
        router.push("/pages/login");
      }
    },
  },

  getters: {
    isAuthenticated: (state) => state.isAuthenticated,
    currentUser: (state) => state.user,
    userRoles: (state) => (state.user ? state.user.roles : []),
    isAdmin: (state) =>
      state.user && state.user.roles && state.user.roles.includes("ADMIN"),
    isStaff: (state) =>
      state.user && state.user.roles && state.user.roles.includes("STAFF"),
    loading: (state) => state.loading,
  },
};

export default module;
