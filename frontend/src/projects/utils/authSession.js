let pendingSessionCheck = null;

/**
 * Determine whether a target route belongs to the authenticated main application.
 * Public auth pages (/pages/login, /login) and external anonymous form-fill (/forms/:id)
 * remain accessible without a forced login redirect.
 */
export function isProtectedRoute(route) {
    if (!route || !route.path) return false;

    if (route.name === 'Login' || route.path === '/login' || route.path === '/pages/login') {
        return false;
    }

    if (route.name === 'FormFill') {
        const q = route.query || {};
        const isInternal = q.source === 'internal' || q.mode === 'preview' || q.mode === 'duplicate';
        return isInternal;
    }

    if (Array.isArray(route.matched) && route.matched.length > 0) {
        return route.matched.some(record => record.meta && record.meta.requiresAuth);
    }

    return true;
}

/**
 * Clear local user session state across localStorage and Vuex store.
 */
export function clearClientSession(store) {
    if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('activeUserId');
        window.localStorage.removeItem('authToken');
    }
    if (store && store.commit) {
        try {
            store.commit('User/user', null);
        } catch (e) {}
        try {
            store.commit('Forms/clearForms');
        } catch (e) {}
    }
}

/**
 * Navigate cleanly to /pages/login preserving intended destination in ?redirect=...
 */
export function buildLoginLocation(redirectPath) {
    const cleanRedirect =
        redirectPath && redirectPath !== '/login' && redirectPath !== '/pages/login'
            ? redirectPath
            : null;
    return cleanRedirect
        ? { path: '/pages/login', query: { redirect: cleanRedirect } }
        : { path: '/pages/login' };
}

/**
 * Verify current JWT cookie session via GET /auth/me.
 * Deduplicates concurrent checks and tears down stale local state on 401/error.
 */
export async function verifyActiveSession({ store, api }) {
    if (pendingSessionCheck) {
        return pendingSessionCheck;
    }

    pendingSessionCheck = (async () => {
        try {
            const res = await api.auth('me');
            const user = res && res.data && res.data.user;
            if (user && user._id) {
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.setItem('activeUserId', String(user._id));
                }
                if (store && store.commit) {
                    store.commit('User/user', user);
                }
                return user;
            }
        } catch (err) {
            // 401 or session dropped -> handled below by clearing session
        }

        clearClientSession(store);
        return null;
    })();

    try {
        return await pendingSessionCheck;
    } finally {
        pendingSessionCheck = null;
    }
}
