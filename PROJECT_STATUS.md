## Project Status – Backend API (2026-02-27)

### Overview

- **Domain**: Local-first collaborative photo review system (users, projects, libraries, photos, photo reviews).
- **Backend stack**: Fastify v5, Knex + PostgreSQL, JWT auth, Jest tests.

### Database & Schema

- PostgreSQL schema defined in `packages/backend/src/db/schema.sql`:
  - `users`, `projects`, `library`, `photos`, `photo_reviews`.
  - Indices for photos and reviews.
- Additional table via migration:
  - `project_members`:
    - Composite primary key `(project_id, user_id)`.
    - `is_owner` boolean, `created_at` timestamp.
    - Used for access control (ownership and membership).

### Auth & Security

- **Registration**: `POST /auth/register`
  - Validated by `RegisterSchema`.
  - Stores `password_hash` using `bcrypt.hash(password, 10)`.
- **Login**: `POST /auth/login`
  - Validated by `LoginSchema`.
  - Verifies credentials with `bcrypt.compare`.
  - Issues JWT using `jsonwebtoken` with payload `{ id, email, name }`, signed with `JWT_SECRET`, `expiresIn: '7d'`.
  - Response: `{ token, user: { id, email, name } }` on success.
- **Auth middleware**:
  - `ensureAuthenticated` in `utils/auth.ts`:
    - Uses `request.jwtVerify()` from `@fastify/jwt` in normal mode.
    - Test-only bypass via headers `x-test-bypass-auth` and `x-test-user-id`.
  - `getAuthenticatedUserId` reads `request.user.id`.

### Core Modules (CRUD)

- **Projects**
  - Routes: `/projects`
    - `POST /` – create project (owner = current user and project_members row created).
    - `GET /` – list projects for current member.
    - `GET /:projectId` – get project if member.
    - `PATCH /:projectId` – update (owners only).
    - `POST /:projectId/archive` – soft-archive (owners only).
    - `DELETE /:projectId` – delete (owners only).
  - Service: `services/projects.service.ts`
    - Uses `project_members` for membership/ownership checks.
    - Pagination via `utils/pagination.ts`.

- **Project members (collaborators)**
  - Routes: `/projects/:projectId/members`
    - `GET` – list members (owners only).
    - `POST` – add member.
    - `DELETE /:userId` – remove member (ensures at least one owner remains).
    - `PATCH /:userId` – update ownership flag.
  - Service: `services/project-members.service.ts`.

- **Libraries**
  - Routes: `/libraries`
    - `POST /` – create library under a project (owners only).
    - `GET /` – list by `projectId` (members).
    - `GET /:libraryId` – get library (members).
    - `PATCH /:libraryId` – update (owners only).
    - `POST /:libraryId/archive` – soft-archive (owners only).
  - Service: `services/libraries.service.ts`.

- **Photos**
  - Routes: `/photos`
    - `GET /` – list with filters (`projectId`, `libraryId`, `search`, optional `decision` via joined reviews).
    - `GET /:photoId` – get single photo (members only).
    - `PATCH /:photoId` – limited metadata update (`metadata`, `thumbnailPath`) for members.
    - `GET /libraries/:libraryId/photos` – list photos by library for members.
  - Service: `services/photos.service.ts`.

- **Photo reviews**
  - Routes: `/photo-reviews`
    - `PUT /:photoId` – upsert current user’s review for a photo:
      - Body: `{ libraryId, seen?, decision?, renamedTo? }`.
      - Updates `seen_at` and `voted_at` as appropriate.
    - `GET /me` – list current user’s reviews with filters (`projectId`, `libraryId`, `decision`).
    - `GET /photos/:photoId/reviews` – list reviews for a photo (members only).
  - Service: `services/photo-reviews.service.ts` with `ON CONFLICT (photo_id, user_id) DO UPDATE` via Knex.

### Routing & App Setup

- `app.ts`:
  - Creates Fastify instance with logger, CORS, JWT plugin, and DB decoration.
  - Registers Swagger and Swagger UI.
  - Registers `routes/index.ts`.
- `routes/index.ts`:
  - `/health` – simple health check.
  - Registers:
    - `/auth` → `auth.routes.ts`
    - `/projects` → `projects.routes.ts`
    - project members routes (no prefix, nested under `/projects/:projectId/members`)
    - `/libraries` → `libraries.routes.ts`
    - `/photos` → `photos.routes.ts`
    - `/photo-reviews` → `photo-reviews.routes.ts`

### Documentation & Tooling

- **OpenAPI / Swagger**
  - `@fastify/swagger` + `@fastify/swagger-ui` configured in `app.ts`.
  - Swagger UI: `GET /docs`.
  - Raw OpenAPI JSON: `GET /docs/json`.
- **Validation**
  - JSON schemas defined per route using Fastify `schema` option.
  - Shared auth schemas in `utils/types.ts` (`RegisterSchema`, `LoginSchema`).

### Testing

- Jest and ts-jest configured (`jest.config.cjs`, `package.json` `test` script).
- Example integration test:
  - `src/__tests__/projects.e2e.test.ts`:
    - Builds app.
    - Ensures a user in `users`.
    - Calls `POST /projects` with test auth bypass headers.
    - Verifies project creation and `project_members` owner row.

### Next Possible Steps

- Add more tests for:
  - Auth (`/auth/login` success/failure cases).
  - Permissions (owners vs members).
  - Photo review flows and filters.
- Expand Swagger schemas with detailed response examples.
- Add simple frontend or API client to drive the workflow.

