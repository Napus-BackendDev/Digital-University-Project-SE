# Tasks

- `[x]` Fix authorization bypass in `onQueryByUser` (`backend/server/Project/Form/service/form.js`)
- `[x]` Assign dynamic `User` role on Google OAuth signup (`backend/server/Project/Auth/auth.routes.js`)
- `[x]` Secure all settings endpoints (`backend/server/Project/Settings/setting.routes.js`)
- `[x]` Secure questions and response routes (`backend/server/Project/Questions/questions.routes.js` & `backend/server/Project/Response/response.routes.js`)
- `[x]` Fix the `res.status().json` bug in `backend/config/logger.js`
- `[x]` Refactor `delPattern` to use `scanIterator` in `backend/helpers/redis.js`
- `[x]` Update frontend sidebar access control checks (`frontend/src/containers/TheSidebar.vue`)
- `[x]` Consolidate all Docker Compose configurations into `/docker-compose.yml`
- `[x]` Update the deployment script `/deploy.sh`
- `[x]` Removed `.env.example` templates by request; project uses real local `.env` files
- `[x]` Add missing backend Redis runtime dependency
- `[x]` Fix production backend container startup command
- `[x]` Delete obsolete backend/frontend split Docker Compose files
- `[x]` Verify all changes (build and run locally/simulate tests)

## Verification Notes

- `[x]` `docker compose --env-file backend/.env config --quiet`
- `[x]` Rebuilt and started the unified local Docker stack
- `[x]` Backend connected to MongoDB and Redis in Docker
- `[x]` `GET /api/v1/health` through `http://localhost:8010` returned `200`
- `[x]` Unauthenticated `GET /api/v1/settings/message` returned `401`
- `[x]` Unauthenticated `GET /api/v1/response/exp` returned `401`
- `[x]` Unauthenticated `GET /api/v1/question/exp` returned `401`
- `[x]` Unauthenticated `POST /api/v1/form/user` returned `401`
- `[x]` Public `POST /api/v1/response` with empty payload returned `404`, confirming it is not blocked by auth (`401`)
- `[x]` Container port check: only `uniform-frontend` publishes host port `8010`; backend, MongoDB, and Redis are internal-only
- `[!]` `npm test` was attempted in `backend`, but Jest exits with "No tests found" because the repo has no backend test files
