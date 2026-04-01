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
