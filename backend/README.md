### For Swagger UI###

API_DOCS="http://localhost:8081/api-docs/"

### Start backend Service ###
npm i & npm start

### Test API with Jest ###

npm test

---

# Backend Changes Documentation

## Overview

Set up Google OAuth authentication, role-based access control (3 roles), and configured CORS for frontend-backend communication.

---

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `server.js` | Modified | Added `dotenv.config()` at top, removed EJS view engine |
| `config/express.js` | Modified | Replaced wildcard CORS handler with proper `cors()` middleware |
| `config/corsAndIP.js` | Modified | Added frontend origins + `credentials: true` |
| `server/Project/Auth/auth.routes.js` | New | Google OAuth token verification + JWT cookie sessions |
| `server/Project/User/models/user.model.js` | New | User model (Google profile + roles) |
| `server/Project/User/user.routes.js` | New | User CRUD routes (no manual create) |
| `server/Project/Role/models/role.model.js` | New | Role model (ADMIN, STAFF, USER) |
| `server/Project/Role/role.routes.js` | New | Role CRUD routes |
| `middleware/auth.js` | New | `requireAuth` and `requireRole` middleware |
| `server/router/app.routes.js` | Modified | Registered auth, role, user routes |
| `.env` | Modified | Updated `GOOGLE_CLIENT_ID` to match frontend |
| `seed.js` | Modified | Seeds 3 default roles |

---

## Step-by-Step Changes

### 1. `server.js` — Load env vars early + remove EJS

**Why:** `dotenv.config()` was only called inside `config/config.js`, but `config/express.js` (which loads auth routes) is required **before** `config.js`. So `process.env.GOOGLE_CLIENT_ID` was `undefined` when `auth.routes.js` loaded, causing token verification to fail with "Wrong recipient, payload audience != requiredAudience".

**What changed:**
```js
// Added at the very top, before any other require
require('dotenv').config();
```

Also removed EJS-related code (`app.set('view engine', 'ejs')`, view render routes) since the backend is now a pure API server.

---

### 2. `config/express.js` — Replaced wildcard CORS with proper middleware

**Why:** There was a manual CORS handler that set `Access-Control-Allow-Origin: *` on all requests. When the frontend sends `withCredentials: true`, browsers reject wildcard `*` origins — they require the specific origin. This caused: `"The value of the 'Access-Control-Allow-Origin' header must not be the wildcard '*' when the request's credentials mode is 'include'"`.

**Before:**
```js
app.use(function (req, res, next) {
  if (req.method === "OPTIONS") {
    const headers = { "Access-Control-Allow-Origin": "*", ... };
    res.writeHead(200, headers);
    res.end();
  } else {
    res.header("Access-Control-Allow-Origin", "*");
    next();
  }
});
```

**After:**
```js
const cors = require('cors');
const { corsOptions } = require('./corsAndIP');

// Applied before all routes
app.use(cors(corsOptions));
```

The `cors()` middleware automatically responds to preflight `OPTIONS` requests and returns the specific requesting origin (not `*`).

---

### 3. `config/corsAndIP.js` — Added frontend origins + credentials

**Why:** The frontend runs on `localhost:8080` (Vue CLI dev server), but the allowed origins only had `localhost:5173`. Also needed `credentials: true` so the browser accepts `Set-Cookie` headers from cross-origin responses.

**What changed:**
```js
// Added localhost:8080 and 8081
const allowedDomains = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
  'https://example.com',
  'https://anotherdomain.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedDomains.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true  // <-- new: allows cookies
};
```

---

### 4. `server/Project/Auth/auth.routes.js` — Google OAuth + JWT sessions

**Why:** Needed server-side verification of Google ID tokens (never trust the client) and session management via httpOnly JWT cookies.

**Three endpoints:**

#### `POST /auth/google`
1. Receives `{ credential: "<Google ID token>" }` from frontend
2. Verifies the token with Google using `google-auth-library`
3. Extracts user profile (email, name, picture) from the verified payload
4. Upserts the user in MongoDB (creates on first login, updates profile on subsequent logins)
5. If new user has no roles, assigns ADMIN role by default for in developing environment
6. Signs a JWT containing `userId`, `email`, `name`, `picture`, `roles`
7. Sets the JWT as an `httpOnly` cookie (1-day expiry, `sameSite: 'lax'`)
8. Returns the user object in the response body

#### `POST /auth/logout`
- Clears the `token` cookie

#### `GET /auth/me`
- Reads the JWT from the cookie, verifies it
- Re-fetches the user from the database for fresh roles
- Returns the user object

**Also changed:** Uses `process.env.GOOGLE_CLIENT_ID` instead of a hardcoded value, with fallback:
```js
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '1054366553517-...';
```

---

### 5. User & Role Models

**Role model** (`Role/models/role.model.js`):
```js
{
  name: String,        // "ADMIN", "STAFF", "USER" — unique, uppercase
  description: String  // Human-readable description
}
```

**User model** (`User/models/user.model.js`):
```js
{
  googleId: String,     // Google's unique user ID (sub claim)
  email: String,        // Google email
  name: String,         // Full name
  givenName: String,    // First name
  familyName: String,   // Last name
  picture: String,      // Profile picture URL
  roles: [ObjectId]     // References to Role documents
}
```

---

### 6. Role-Based Access Control — 3 Roles

| Role | Access |
|------|--------|
| **ADMIN** | Everything — automatically passes all role checks |
| **STAFF** | Create and view forms/questions, no user management |
| **USER** | View forms, submit responses (student role) |

**Middleware** (`middleware/auth.js`):

- **`requireAuth`** — Verifies JWT cookie, attaches `req.user` from database
- **`requireRole(...roles)`** — Checks if user has one of the required roles. ADMIN always passes:
  ```js
  function requireRole(...roles) {
    return (req, res, next) => {
      const userRoles = req.user.roles.map(r => r.name);
      if (userRoles.includes('ADMIN')) return next(); // Admin bypasses
      if (roles.some(role => userRoles.includes(role))) return next();
      return res.status(403).json({ message: 'Forbidden' });
    };
  }
  ```

---

### 7. `.env` — Matched Google Client ID with frontend

**Why:** The frontend signs in using Client ID `225788483142-...` (from `VUE_APP_CLIENTID`). The backend was verifying against a different ID `1054366553517-...`. Google rejects the token because the audience doesn't match. Both must use the same Client ID.

```env
# Before
GOOGLE_CLIENT_ID = 1054366553517-29t3nkamhr0p9v6f3fbiq73evkvmq855.apps.googleusercontent.com

# After
GOOGLE_CLIENT_ID = 225788483142-8pkg8on8nh60ao83ve33ff3lflv2ccvo.apps.googleusercontent.com
```

---

### 8. `seed.js` — Default roles

Seeds 3 roles on startup if they don't exist:
```js
{ name: 'ADMIN', description: 'Full access to everything' }
{ name: 'STAFF', description: 'Create and view forms, no user management' }
{ name: 'USER',  description: 'View and respond to forms (student)' }
```

---

## Authentication Flow

```
Frontend                              Backend
────────                              ───────
Google Sign-In popup
        │
        ▼
POST /auth/google
  { credential: id_token }  ──────►  Verify token with Google
                                      Upsert user in MongoDB
                                      Assign default role if new
                                      Sign JWT
                                      Set httpOnly cookie
  ◄──────────────────────────────────  { user: { name, email, roles } }

(subsequent requests)
Any API call with cookie    ──────►  requireAuth middleware
                                      Verify JWT from cookie
                                      Attach req.user
                                      requireRole checks access
  ◄──────────────────────────────────  200 OK / 403 Forbidden

POST /auth/logout           ──────►  Clear cookie
  ◄──────────────────────────────────  { message: "Logged out" }
```

---

## API Tests

All 18 existing tests pass after changes:
```
Test Suites: 3 passed, 3 total
Tests:       18 passed, 18 total
```
