# Backend Architecture Document: Digital University Project SE

## 1. Document Overview
### Purpose of this document
This document provides a comprehensive technical overview of the backend architecture for the Digital University Project. it serves as the single source of truth for the system's design, technology stack, security protocols, and operational procedures.

### Scope
Covers the Node.js Express backend, MongoDB data layer, authentication/authorization services, and file storage infrastructure.

### Related links
- **Swagger API Docs**: `http://localhost:8081/api-docs` (Local) / `[STAGING_URL]/api-docs`
- **Backend Repository**: `https://github.com/Digital-University-Project-SE/backend`
- **Postman Collection**: `[PLACEHOLDER_LINK]`

---

## 2. Project Overview
### Business context
Digital University Project SE is a centralized platform designed to digitize university administrative and educational workflows, primarily focusing on dynamic form generation, survey collection, and academic data management.

### Core backend responsibilities
- Dynamic Form and Question management.
- Secure collection and processing of student/faculty responses.
- Role-based access control (RBAC) for university members.
- Centralized logging and error reporting.

### High-level system goals
- **Modularity**: Allowing independent development of features like Forms and Responses.
- **Data Integrity**: Ensuring complex form structures remain consistent.
- **Efficiency**: Standardized API responses to minimize frontend overhead.

---

## 3. Architecture Overview
### Overall architecture style
**Modular Monolith**: The system is organized into self-contained modules under the `server/Project/` directory. Each module (Form, Question, Response, etc.) follows a structured Controller-Service-Model pattern.

### High-level component explanation
- **Router Layer**: Entry point for requests, handling versioning (`/api/v1`) and basic routing.
- **Middleware Layer**: Handles Authentication (JWT), Validation (`express-validator`), and File Uploads (`Multer`).
- **Controller Layer**: Orchestrates requests, translates parameters, and calls services.
- **Service Layer**: Contains the core business logic and cross-module interactions.
- **Data Layer (Mongoose)**: Manages MongoDB interactions and schema enforcement.

### Request flow
1.  **Client** sends a REST request to `/api/v1/[module]`.
2.  **Middlewares** verify JWT, validate input bodies, and handle file buffers.
3.  **Controller** receives clean data and invokes the appropriate **Service**.
4.  **Service** interacts with **Mongoose Models** to fetch/persist data.
5.  **Global Logger** intercepts the response to add standardized metadata before sending it to the client.

---

## 4. Technology Stack
- **Backend Framework**: Node.js with Express.
- **Database**: MongoDB (managed via Mongoose).
- **Authentication**: JWT-based (JSON Web Tokens).
- **Infrastructure**: Dockerized environment (standardized `Dockerfile` and `docker-compose.yml`).
- **API Documentation**: Swagger/OpenAPI 3.0 (integrated via `swagger-ui-express`).
- **Monitoring/Logging**: Winston for structured logging.

---

## 5. System Components
### Form Module
- **Responsibility**: Lifecycle management of academic forms.
- **Key Features**: Multi-language titles, versioning, and configuration settings.
- **Dependencies**: Question Module.

### Question Module
- **Responsibility**: Defining individual form elements.
- **Key Features**: Support for multiple types (Checkbox, Radio, Text) and image attachments.
- **Design Notes**: Uses a standardized `config` object to store type-specific properties.

### Response Module
- **Responsibility**: Persisting user submissions.
- **Key Features**: File upload support for answers and responder tracking.
- **Design Notes**: Heavily utilizes Mongoose `.populate()` to provide context to the frontend.

---

## 6. API Design
### Standards
- **Versioning**: Prefix `/api/v1/` for all routes.
- **Method Usage**: GET for retrieval, POST for creation/querying by ID, PUT for updates, DELETE for removal.
- **Response Format**: Wrapped in a standardized `ApiResponse` object:
  ```json
  {
    "code": 20021,
    "httpcode": 200,
    "message": [{ "key": "en", "value": "Success" }],
    "data": { ... },
    "status": "success",
    "statusCode": 200,
    "timestamp": "ISO-TIMESTAMP",
    "url": "/actual/path"
  }
  ```

---

## 7. Data Architecture
### Database choice
**MongoDB**: Chosen for its flexible schema, allowing for complex and nested Form/Question structures without expensive joins.

### Core Collections
- `forms`: Metadata and configuration.
- `questions`: Individual form items with type-specific configs.
- `responses`: User-submitted data linked to forms and responders.
- `users`: Credentials and profile data.

---

## 8. Security Architecture
- **Authentication**: Stateless JWT provided in the `Authorization` header.
- **Authorization**: Role-Based Access Control (RBAC) enforced at the middleware level.
- **File Security**: Uploads are restricted by extension (Images, PDF, Excel) and stored outside the web root where possible.
- **Secrets**: Managed via `.env` files (excluded from version control).

---

## 9. Scalability and Performance
- **Modular Design**: Prepared for scaling later.
- **Caching**: [ASSUMPTION] Redis for session/form-metadata caching.
- **Indexing**: Compound indices on `form_id` and `responder_id` within the `responses` collection.

---

## 10. Reliability and Operations
- **Health Checks**: A dedicated endpoint is available at `/api/v1/health` for real-time monitoring of application uptime, MongoDB connection state, and system memory metrics.
- **Logging**: Structured Winston logs stored in a central `logs/` directory and optionally exported to MongoDB.
- **Rollback**: Container-based versioning allows for instant image rollbacks via Docker.

---

## 11. Development Standards
- **Naming**: camelCase for variables/functions, PascalCase for Models/Controllers.
- **Structure**: Consistent `model/service/controller` per module.
- **Testing**: Jest + Supertest for API integration testing. Standard requires 100% pass rate before merge.

---

## 12. Environments
- **Local**: Development with local MongoDB or Docker Desktop.
- **Development**: Shared internal environment for team testing.
- **Staging**: Exact mirror of production for final QA.
- **Production**: High-availability production cluster.

---

## 13. Risks and Known Limitations
- **Technical Risk**: Heavy reliance on `.populate()` can slow down queries for extremely deep form structures.
- **Tradeoff**: Local file storage used initially; will require migration to S3 or other cloud storage for multi-instance scaling.

---

## 14. Architecture Decision Summary

| Decision | Selection | Rationale |
| :--- | :--- | :--- |
| **Language** | Node.js | Rapid development and broad ecosystem support. |
| **Arch Style** | Modular Monolith | Balances simplicity with the capability to scale specific domains. |
| **Data Layer** | MongoDB | Optimal for the highly variable nature of university forms. |
| **Auth** | JWT | Enables stateless scaling across multiple container instances. |

---

## 15. Appendix
- **Repositories**: `[PLACEHOLDER_LINK]`
- **Dashboard**: `[PLACEHOLDER_LINK]`
- **Wiki**: `[PLACEHOLDER_LINK]`
