# ESP Studio — Cloud API & Real-Time Protocol Specification

**Document Version:** 1.0.0  
**Transport:** REST (OpenAPI 3.1) & WebSocket (Socket.IO / Native WS)  
**Authentication:** JWT Bearer Token / API Keys

---

## 1. REST Endpoints

### 1.1 Authentication & Profile
- `POST /api/v1/auth/register` — Create user account
- `POST /api/v1/auth/login` — Authenticate and receive access + refresh tokens
- `GET /api/v1/users/me` — Retrieve active profile & workspace memberships

### 1.2 Projects
- `GET /api/v1/workspaces/:workspaceId/projects` — List projects
- `POST /api/v1/workspaces/:workspaceId/projects` — Create project from template
- `GET /api/v1/projects/:projectId` — Fetch project metadata & head revision
- `GET /api/v1/projects/:projectId/tree` — Fetch complete file tree manifest
- `POST /api/v1/projects/:projectId/files` — Upload / stage files
- `DELETE /api/v1/projects/:projectId` — Archive or delete project

### 1.3 Synchronization
- `POST /api/v1/projects/:projectId/sync/handshake` — Submit local tree hashes and detect diffs
- `POST /api/v1/projects/:projectId/sync/commit` — Commit new revision with file diffs
- `GET /api/v1/projects/:projectId/sync/revisions` — List revision history

### 1.4 Cloud Compilation
- `POST /api/v1/projects/:projectId/builds` — Enqueue cloud build job
  - Payload: `{ "board": "esp32-s3-devkitc-1", "framework": "arduino", "clean": false }`
  - Returns: `{ "job_id": "job-8910a", "status": "QUEUED" }`
- `GET /api/v1/builds/:jobId` — Check build job status & summary
- `GET /api/v1/builds/:jobId/artifacts` — Get signed download URLs for `firmware.bin`, `merged-firmware.bin`, `flash-manifest.json`
- `POST /api/v1/builds/:jobId/cancel` — Abort running compilation

### 1.5 Devices & Fleet Management
- `GET /api/v1/workspaces/:workspaceId/devices` — List registered devices
- `POST /api/v1/devices/register` — Register provisioned device ID (e.g., `SPRAYER-001`)
- `PATCH /api/v1/devices/:deviceId` — Update device metadata or assign target project

---

## 2. WebSocket Events (`wss://api.example.com/events`)

### 2.1 Client Subscriptions
- `subscribe:build` -> `{ "jobId": "job-8910a" }`
- `subscribe:project` -> `{ "projectId": "uuid..." }`

### 2.2 Server Streams
- `build:log` -> `{ "jobId": "job-8910a", "line": "Compiling .pio/build/esp32s3/src/main.cpp.o..." }`
- `build:status` -> `{ "jobId": "job-8910a", "status": "SUCCESS", "duration_ms": 3410 }`
- `project:remote_change` -> `{ "projectId": "uuid...", "newRevision": 14, "author": "Alice" }`
