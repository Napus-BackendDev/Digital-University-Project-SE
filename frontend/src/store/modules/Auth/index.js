import Service from "@/service/api.js";
import router from "@/router/index";

const module = {
  namespaced: true,

  state: {
    user: null,
    isAuthenticated: false,
    loading: false,
    is2FA: false,
  },

  mutations: {
    SET_IS_2FA(state, is2FA) {
      state.is2FA = is2FA;
    },
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
        router.push("/").catch(() => { });
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

    // Handling 2FA code submission
    async twofaSend({ commit }, body) {
      commit("SET_LOADING", true);
      try {
        // Placeholder for 2FA service call
        console.log("Sending 2FA code:", body);
        // await Service.auth("verify-2fa", body);
        commit("SET_IS_2FA", false);
      } catch (error) {
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    }
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
    is2FA: (state) => state.is2FA,
  },
};

export default module;
