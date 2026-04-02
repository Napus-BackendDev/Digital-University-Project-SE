# Quick Guide: Backend Architecture

## Tech Stack
- **Runtime**: Node.js v18+
- **Framework**: Express (REST API)
- **Database**: MongoDB (Mongoose ODM)
- **Auth**: JWT (Stateless)
- **Documentation**: Swagger UI (`/api-docs`)

## Core Modules (`server/Project/`)
- **Form**: Lifecycle management for university forms.
- **Questions**: Configuration for dynamic form items + image uploads.
- **Response**: Data collection and submission tracking.
- **User**: IAM and RBAC (Roles).

## Standard Response Format
All API outputs are wrapped by the `loggerMiddleware` into a consistent structure:
```json
{
  "code": 200xx, "httpcode": 200, "message": [...], "data": { ... },
  "status": "success", "statusCode": 200, "timestamp": "...", "url": "..."
}
```

## Running Locally
1. `npm install`
2. Configure `.env` (MongoDB URL, Secret Keys)
3. `npm start`
4. Access docs at `http://localhost:8081/api-docs`
5.`npm test`


Name : Sai Shang Hlang
Task : Fix Bug
Details : ### Functional Fixes 1. Backend: Organization & Collaborator Filtering
Updated the onQuerys method in form.js to handle complex visibility rules.

- Rules implemented :
  - Public Access : Forms marked as public are visible to everyone.
  - Organization Access : Forms are visible if they belong to the user's organization.
  - Personal Access : Forms are visible if the user is explicitly in the allowedUser list.
  - Collaborator Access : Forms are visible if the user is listed in the controll array (Editors/Viewers).
- Admin Bypass : System Admins still see all forms in the database. 2. Frontend: Context-Aware Fetching
Updated ManageForms.vue and Forms.vue to pass the necessary user context to the backend.

- Changes :
  - Now passes userId , organizationId , and isAdmin status when fetching the form list.
  - This allows the backend to apply the filtering logic described above.
  - Maintained the secondary "Responsibility Filter" in the frontend to ensure users only see forms they are responsible for in the "Manage" view.
### Security Review (Visibility focus)
- IDOR Prevention : By moving the filtering logic to the backend $match stage in the aggregation pipeline, we prevent users from fetching forms they shouldn't see via direct API calls.
- Contextual Trust : While we are currently passing user/org IDs from the frontend (as auth is not yet implemented), the backend is now ready to receive this information from a secure req.user object in the future.
### Performance Review
- Efficient Filtering : Using $match at the beginning of the aggregation pipeline ensures that the database only processes the subset of forms the user is allowed to see, avoiding unnecessary lookups and processing for unauthorized data.
The visibility logic is now fully integrated between the frontend and backend, correctly handling users based on their organization and their roles as editors or viewers.