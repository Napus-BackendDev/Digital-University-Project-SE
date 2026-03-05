# Frontend Google Authentication - Changes Documentation

## Overview

Connected the existing Google Sign-In UI in `SignIn.vue` to the backend `/auth/google` endpoint, enabling full end-to-end authentication with JWT cookie sessions.

---

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/service/api.js` | Modified | Added auth API methods + `withCredentials` |
| `src/store/modules/Auth/index.js` | New | Vuex auth module (state, actions, getters) |
| `src/store/store.js` | Modified | Registered the `auth` Vuex module |
| `src/containers/TheContainer.vue` | Modified | Hide login modal after authentication |

---

## Step-by-Step Changes

### 1. `src/service/api.js` — Added auth API + withCredentials

**Why:** The frontend needs to send the Google ID token to the backend and receive a JWT cookie back. `withCredentials: true` is required for the browser to send/receive cookies in cross-origin requests (frontend on port 8080, backend on port 8081).

**What changed:**

- Added `withCredentials: true` to the existing axios instance so all API calls include cookies:
  ```js
  instance.defaults.withCredentials = true;
  ```

- Created a separate axios instance for auth routes because they are mounted at `/auth` on the backend (not `/api/v1`):
  ```js
  const authInstance = axios.create({
    baseURL: 'http://localhost:8081/auth',
    withCredentials: true,
    headers: { "Content-Type": "application/json" }
  });
  ```

- Added an `auth()` method with three operations:
  ```js
  auth(method, data) {
    switch (method) {
      case 'google-login':   // POST /auth/google — sends Google ID token
        return authInstance.post('/google', data)
      case 'logout':         // POST /auth/logout — clears JWT cookie
        return authInstance.post('/logout')
      case 'me':             // GET /auth/me — fetches current user from cookie
        return authInstance.get('/me')
    }
  }
  ```

---

### 2. `src/store/modules/Auth/index.js` — New Vuex auth module

**Why:** The app needs centralized auth state so any component can check if the user is logged in, get user info, or trigger login/logout. Vuex is the standard state management for Vue 2.

**What it contains:**

#### State
```js
state: {
  user: null,            // User object (name, email, roles, picture)
  isAuthenticated: false, // Whether user is logged in
  loading: false,         // Loading state during auth operations
}
```

#### Actions

- **`singin({ token })`** — Called by `SignIn.vue` after Google sign-in:
  1. Sets loading to `true`
  2. POSTs the Google ID token to backend via `Service.auth("google-login", { credential: token })`
  3. Backend verifies the token with Google, upserts the user, returns user data + sets JWT cookie
  4. Commits `SET_USER` with the returned user object
  5. Navigates to `/` (home/dashboard)
  6. On failure, clears user state

  > **Note:** The action name is `singin` (not `signIn`) to match the existing dispatch call in `SignIn.vue`: `this.$store.dispatch("auth/singin", body)`

- **`fetchMe()`** — Checks if user has a valid session:
  1. Calls `GET /auth/me` (browser sends the JWT cookie automatically)
  2. If valid, commits user data to state
  3. If invalid/expired, clears user state
  4. Useful for page refresh — restores auth state from cookie

- **`logout()`** — Ends the session:
  1. Calls `POST /auth/logout` (backend clears the cookie)
  2. Clears local user state
  3. Redirects to `/pages/login`

#### Getters
```js
isAuthenticated  // Boolean — is user logged in?
currentUser      // Full user object
userRoles        // Array of role names (e.g., ["ADMIN"])
isAdmin          // Boolean — has ADMIN role?
isStaff          // Boolean — has STAFF role?
loading          // Boolean — auth operation in progress?
```

---

### 3. `src/store/store.js` — Registered the auth module

**Why:** Vuex modules must be registered in the store to be accessible. Without this, `this.$store.dispatch("auth/singin", ...)` throws `[vuex] unknown action type: auth/singin`.

**What changed:**

```js
// Added import
import Auth from "@/store/modules/Auth/index.js";

// Added to modules
export default new Vuex.Store({
  modules: {
    Forms: formModel,
    Setting: Setting,
    Questions: Questions,
    auth: Auth              // <-- new
  }
});
```

> **Important:** The key is `auth` (lowercase) because `SignIn.vue` dispatches `auth/singin`.

---

### 4. `src/containers/TheContainer.vue` — Hide login modal after auth

**Why:** The `<SignIn />` component is rendered inside `TheContainer.vue` (the main layout wrapper for all pages). It had `:show="true"` hardcoded, so the login modal was always visible — even after successful login.

**What changed:**

- Added `v-if` to conditionally render the modal:
  ```html
  <!-- Before -->
  <SignIn />

  <!-- After -->
  <SignIn v-if="!isAuthenticated" />
  ```

- Added the `isAuthenticated` computed property from the auth store:
  ```js
  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated'
    })
  }
  ```

**How it works:** After login, the `SET_USER` mutation sets `isAuthenticated: true`. Vue reactivity detects the change, `v-if="!isAuthenticated"` becomes `false`, and the modal is removed from the DOM.

---

## Authentication Flow Diagram

```
User clicks Google logo
        │
        ▼
SignIn.vue: this.$gAuth.signIn()
        │
        ▼
Google popup → user signs in → returns googleUser
        │
        ▼
SignIn.vue: extracts id_token from googleUser.getAuthResponse()
        │
        ▼
SignIn.vue: this.$store.dispatch("auth/singin", { token: id_token })
        │
        ▼
Auth/index.js: singin() action
        │
        ▼
api.js: POST http://localhost:8081/auth/google  { credential: id_token }
        │                                          (withCredentials: true)
        ▼
Backend verifies token with Google → upserts user → returns user data
        │                                          + sets httpOnly JWT cookie
        ▼
Auth/index.js: commit("SET_USER", user)  →  isAuthenticated = true
        │
        ▼
TheContainer.vue: v-if="!isAuthenticated" hides the modal
        │
        ▼
router.push("/")  →  user sees dashboard
```

---

## Notes

- The `cspreport/fine-allowlist 400` error in the console is from Google's sign-in iframe — it is harmless and cannot be fixed from our side.
- On page refresh, auth state is lost (Vuex resets). Call `this.$store.dispatch("auth/fetchMe")` in `App.vue` or a router guard to restore the session from the cookie.
- The `SignIn.vue` component itself was **not modified** except for uncommenting 3 lines that already existed in the codebase.
