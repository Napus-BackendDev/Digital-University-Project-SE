import {
    isProtectedRoute,
    clearClientSession,
    buildLoginLocation,
    verifyActiveSession
} from '@/projects/utils/authSession';

describe('authSession utilities', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    test('isProtectedRoute requires auth for main portal routes and keeps login/public FormFill accessible', () => {
        expect(isProtectedRoute({ name: 'Login', path: '/pages/login' })).toBe(false);
        expect(isProtectedRoute({ path: '/login' })).toBe(false);
        expect(isProtectedRoute({ name: 'FormFill', path: '/forms/abc', query: {} })).toBe(false);

        // Internal modes of FormFill and main portal routes must require authentication
        expect(isProtectedRoute({ name: 'FormFill', path: '/forms/abc', query: { mode: 'preview' } })).toBe(true);
        expect(isProtectedRoute({ name: 'FormFill', path: '/forms/abc', query: { mode: 'duplicate' } })).toBe(true);
        expect(isProtectedRoute({ name: 'FormFill', path: '/forms/abc', query: { source: 'internal' } })).toBe(true);
        expect(isProtectedRoute({
            name: 'ManageForms',
            path: '/manage',
            matched: [{ meta: { requiresAuth: true } }]
        })).toBe(true);
        expect(isProtectedRoute({
            name: 'Forms',
            path: '/forms',
            matched: [{ meta: { requiresAuth: true } }]
        })).toBe(true);
    });

    test('clearClientSession wipes localStorage tokens and commits Vuex teardown', () => {
        window.localStorage.setItem('activeUserId', 'u1');
        window.localStorage.setItem('authToken', 'jwt123');
        const store = { commit: jest.fn() };

        clearClientSession(store);

        expect(window.localStorage.getItem('activeUserId')).toBeNull();
        expect(window.localStorage.getItem('authToken')).toBeNull();
        expect(store.commit).toHaveBeenCalledWith('User/user', null);
        expect(store.commit).toHaveBeenCalledWith('Forms/clearForms');
    });

    test('buildLoginLocation preserves redirect path except login routes', () => {
        expect(buildLoginLocation('/manage')).toEqual({
            path: '/pages/login',
            query: { redirect: '/manage' }
        });
        expect(buildLoginLocation('/pages/login')).toEqual({ path: '/pages/login' });
        expect(buildLoginLocation('/login')).toEqual({ path: '/pages/login' });
    });

    test('verifyActiveSession syncs user on 200 and clears stale session on 401/failure', async () => {
        window.localStorage.setItem('activeUserId', 'stale_id');
        const store = { commit: jest.fn() };

        // 1. Dropped/invalid session -> clears stale storage & store, returns null
        const failApi = {
            auth: jest.fn(() => Promise.reject({ response: { status: 401 } }))
        };
        const failedUser = await verifyActiveSession({ store, api: failApi });
        expect(failedUser).toBeNull();
        expect(window.localStorage.getItem('activeUserId')).toBeNull();
        expect(store.commit).toHaveBeenCalledWith('User/user', null);

        // 2. Valid session -> sets activeUserId & commits user
        store.commit.mockClear();
        const okApi = {
            auth: jest.fn(() => Promise.resolve({ data: { user: { _id: 'u99', email: 'test@mfu.ac.th' } } }))
        };
        const validUser = await verifyActiveSession({ store, api: okApi });
        expect(validUser).toEqual({ _id: 'u99', email: 'test@mfu.ac.th' });
        expect(window.localStorage.getItem('activeUserId')).toBe('u99');
        expect(store.commit).toHaveBeenCalledWith('User/user', { _id: 'u99', email: 'test@mfu.ac.th' });
    });
});
