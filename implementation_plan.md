# Consolidated Security, Authorization, and Docker Compose Optimization Plan

This implementation plan covers the security audit, bug fixes, role-based authorization reinforcement, and the consolidation of the Docker/Docker Compose services into a single root-level orchestrator suitable for CI/CD deployment.

---

## User Review Required

> [!IMPORTANT]
> - **Exposed Ports**: In the unified root `docker-compose.yml`, internal services (`db`, `redis`, `backend`) will only be accessible within the internal Docker bridge network (`uniform-network`). Only the `frontend` container (running Nginx) will expose its ports (e.g. port `8010` in development, port `80` in production) to the host.
> - **Google OAuth Origins**: This implementation uses Google Identity Services ID tokens, so configure the frontend origin (for example `https://uniform.mfu.ac.th` and local development origins) in Google Cloud Console. The backend verifies the posted ID token at `/api/v1/auth/google`.
> - **Security Guard Enforcement**: Standard Express middlewares are added to enforce authentication on settings, questions, and responses.

## Open Questions

- None (All architectural paths have been reviewed and verified).

---

## Implementation Status

- Done: backend auth middleware now hydrates the current user with populated role and organization.
- Done: `onQueryByUser` blocks cross-user form reads unless the authenticated requester is Admin.
- Done: Google OAuth signup assigns the seeded `User` role dynamically.
- Done: settings, questions, responses, form list/create/update/delete, users, and roles routes require authentication where sensitive.
- Done: logger redacts secrets and only intercepts `res.json`.
- Done: Redis pattern invalidation uses `scanIterator`.
- Done: sidebar shows `Forms` by default and requires explicit read permission for non-admin pages.
- Done: root compose runs backend, db, redis, and frontend on an internal network, exposing only frontend to the host.
- Done: deploy script uses the root compose file with `backend/.env` as the compose env file and seeds through `uniform-backend`.
- Done: `.env.example` templates were removed by request; the project uses real local `.env` files.
- Done: backend production image now starts with direct `node` and includes the missing `redis` runtime dependency.
- Done: obsolete backend/frontend split Docker Compose files were removed; root compose is the only supported Docker Compose entrypoint.

---

## Proposed Changes

### 1. Backend Security and Authorization Fixes

#### [MODIFY] [form.js](file:///Users/leng/Documents/GitHub/Digital-University-Project-SE/backend/server/Project/Form/service/form.js)
- Fix authorization bypass in `onQueryByUser`:
  - Ensure that `request.user.id` is matching the requested `request.body._id` OR the requesting user has the `Admin` role. If not, block the request with a `403 Forbidden` response.

#### [MODIFY] [auth.routes.js](file:///Users/leng/Documents/GitHub/Digital-University-Project-SE/backend/server/Project/Auth/auth.routes.js)
- Fix default role assignment:
  - On new Google user registration, fetch the `User` role dynamically from the database (`Roles.findOne({ 'title.value': 'User' })`) and assign its ObjectID, instead of relying on a hardcoded schema default that doesn't exist in seed data.

#### [MODIFY] [setting.routes.js](file:///Users/leng/Documents/GitHub/Digital-University-Project-SE/backend/server/Project/Settings/setting.routes.js)
- Secure all settings endpoints:
  - Apply the `requireAuth` middleware to all routes (`group`, `message`, `status`, `verification`, `question_type`, `collaborator`, `emailTemplate`).

#### [MODIFY] [questions.routes.js](file:///Users/leng/Documents/GitHub/Digital-University-Project-SE/backend/server/Project/Questions/questions.routes.js)
- Secure write operations:
  - Apply `requireAuth` to `POST`, `PUT`, and `DELETE` routes.
  - Apply `requireAuth` to the `GET /exp` (get all questions) route.

#### [MODIFY] [response.routes.js](file:///Users/leng/Documents/GitHub/Digital-University-Project-SE/backend/server/Project/Response/response.routes.js)
- Secure sensitive response endpoints:
  - Apply `requireAuth` to `GET /exp`, `POST /get`, and all `DELETE` routes.
  - Keep `POST /` (submitting a response) public so users can submit responses to forms.

#### [MODIFY] [logger.js](file:///Users/leng/Documents/GitHub/Digital-University-Project-SE/backend/config/logger.js)
- Fix `res.status().json` bug:
  - Remove the redundant and buggy override on `res.status().json` which inadvertently sets `res.statusCode = undefined` on startup. Only intercept the main `res.json` method.

#### [MODIFY] [redis.js](file:///Users/leng/Documents/GitHub/Digital-University-Project-SE/backend/helpers/redis.js)
- Safe keys invalidation:
  - Replace the blocking `client.keys(pattern)` call in `delPattern` with a safe, non-blocking cursor-based `client.scanIterator({ MATCH: pattern })` iteration.

---

### 2. Frontend Sidebar Guard Improvements

#### [MODIFY] [TheSidebar.vue](file:///Users/leng/Documents/GitHub/Digital-University-Project-SE/frontend/src/containers/TheSidebar.vue)
- Secure `canReadPage` logic:
  - Modify `canReadPage` to strictly check for explicit permission configs for non-admin users.
  - Bypass authorization checks only for the default `Forms` view, which must be visible to everyone.
  - Ensure that if `role` is null, it defaults to showing only the public/Forms section and does not fallback to showing all links.

---

### 3. Docker Compose Consolidation

#### [NEW] [docker-compose.yml](file:///Users/leng/Documents/GitHub/Digital-University-Project-SE/docker-compose.yml)
- Create a combined root compose orchestrator:
  - **db**: Mongoose database container (`mongo:7.0`).
  - **redis**: Cache server container (`redis:7.0-alpine`).
  - **backend**: Express application container, depending on `db` and `redis`.
  - **frontend**: Nginx web server container, depending on `backend`. Exposes port `8010:80` (or dynamic port via env).
  - Define unified `networks` (`uniform-network`) and persistent `volumes` (`uniform-db-data`).
  - Do NOT expose `db`, `redis`, or `backend` ports to the host interface directly.

#### [MODIFY] [deploy.sh](file:///Users/leng/Documents/GitHub/Digital-University-Project-SE/deploy.sh)
- Update deployment script to use the root `docker-compose.yml`:
  - Run `docker compose up -d --build` from the root directory.
  - Wait and execute the database seed: `docker exec -i uniform-backend node seed.js`.

---

## Verification Plan

Status: completed for static checks, Docker startup, and unauthenticated route checks. Authenticated Google login and cross-user `403` behavior still need a real Google browser session/cookie to verify end to end.

### Security & Access Control Verification
1. **Unauthenticated Check**:
   - Access `GET /api/v1/settings/message` without authentication. Verify it returns `401 Unauthorized`.
   - Access `GET /api/v1/response/exp` without authentication. Verify it returns `401 Unauthorized`.
2. **Access Control Check**:
   - Log in as a regular user. Make a POST request to `/api/v1/form/user` passing an admin's User ID in the body. Verify it returns `403 Forbidden`.
3. **Sidebar Validation**:
   - Log in as a newly created user (with no roles/permissions seeded). Check the sidebar. Verify only the "Forms" link is visible, and Admin links are hidden.

### Redis Operational Verification
1. **Cache Pattern Invalidation**:
   - Modify a form and verify the keys matching `cache:*form*` are safely scanned and deleted without blocking Redis.
2. **Offline Fallback**:
   - Terminate the Redis service (`docker compose stop redis`). Send requests to `/api/v1/form/exp`. Verify they complete successfully using MongoDB with logs reporting offline fallback.

### Deployment Verification
1. **Unified Startup**:
   - Run `./deploy.sh` and ensure all 4 services build, connect, and start cleanly, followed by successful seeding.
