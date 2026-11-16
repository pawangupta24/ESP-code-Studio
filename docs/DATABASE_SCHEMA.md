# ESP Studio — Database Schema Specification

**Document Version:** 1.0.0  
**Cloud Storage:** PostgreSQL 16 + AWS S3 (Blobs)  
**Local Storage:** SQLite 3 (Desktop) / IndexedDB (Browser)

---

## 1. Cloud Database Schema (PostgreSQL)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Workspaces
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    board_target VARCHAR(64) NOT NULL DEFAULT 'esp32-s3-devkitc-1',
    framework VARCHAR(32) NOT NULL DEFAULT 'arduino', -- 'arduino' | 'espidf'
    head_revision_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Project Revisions
CREATE TABLE project_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_revision_id UUID REFERENCES project_revisions(id),
    revision_number BIGINT NOT NULL,
    commit_message TEXT,
    author_id UUID REFERENCES users(id),
    tree_hash VARCHAR(64) NOT NULL, -- SHA-256 of canonical file tree
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, revision_number)
);

-- 5. Project Files (Content-addressed in S3 or stored as chunks)
CREATE TABLE project_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    revision_id UUID NOT NULL REFERENCES project_revisions(id) ON DELETE CASCADE,
    file_path VARCHAR(512) NOT NULL, -- e.g. 'src/main.cpp'
    sha256_hash VARCHAR(64) NOT NULL,
    size_bytes BIGINT NOT NULL,
    s3_key VARCHAR(1024) NOT NULL,
    is_binary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(revision_id, file_path)
);

-- 6. Provisioned Devices
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    custom_device_id VARCHAR(64) NOT NULL UNIQUE, -- e.g. 'SPRAYER-001'
    chip_family VARCHAR(32) NOT NULL,             -- e.g. 'ESP32-S3'
    chip_revision INT,
    mac_address VARCHAR(17) NOT NULL,             -- 'AA:BB:CC:DD:EE:FF'
    active_firmware_version VARCHAR(32),
    assigned_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    last_connected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Build Jobs
CREATE TABLE build_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    revision_id UUID NOT NULL REFERENCES project_revisions(id),
    status VARCHAR(32) NOT NULL DEFAULT 'QUEUED', -- QUEUED, RUNNING, SUCCESS, FAILED, CANCELLED
    duration_ms INT,
    log_s3_key VARCHAR(1024),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 8. Build Artifacts
CREATE TABLE build_artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    build_job_id UUID NOT NULL REFERENCES build_jobs(id) ON DELETE CASCADE,
    artifact_type VARCHAR(32) NOT NULL, -- 'app_bin', 'bootloader', 'partitions', 'merged_bin', 'manifest'
    sha256_hash VARCHAR(64) NOT NULL,
    size_bytes BIGINT NOT NULL,
    flash_address VARCHAR(16),          -- e.g. '0x10000'
    s3_key VARCHAR(1024) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 2. Local Database Schema (SQLite / Desktop & Local Cache)

```sql
CREATE TABLE IF NOT EXISTS local_projects (
    project_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    local_path TEXT NOT NULL,
    board_target TEXT NOT NULL,
    framework TEXT NOT NULL,
    last_synced_revision TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_file_index (
    project_id TEXT NOT NULL,
    relative_path TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    is_dirty INTEGER NOT NULL DEFAULT 0, -- 1 = modified locally since last sync
    last_modified_ms INTEGER NOT NULL,
    PRIMARY KEY (project_id, relative_path)
);

CREATE TABLE IF NOT EXISTS sync_outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL,
    operation_type TEXT NOT NULL, -- 'UPSERT_FILE', 'DELETE_FILE', 'COMMIT_REV'
    payload_json TEXT NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_device_cache (
    custom_device_id TEXT PRIMARY KEY,
    chip_family TEXT NOT NULL,
    mac_address TEXT NOT NULL,
    com_port TEXT,
    last_seen TEXT NOT NULL
);
```
