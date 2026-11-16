# ESP Studio — Synchronization Protocol Specification

**Document Version:** 1.0.0  
**Paradigm:** Local-First with 3-Way Merge & Outbox Pattern

---

## 1. Design Principles

1. **Local-First Supremacy:** All file modifications, project creations, builds, and device interactions take place locally first. Lack of internet connectivity never disables editing or local building.
2. **Deterministic Hashing:** All file contents are hashed with SHA-256 in UTF-8 canonical format (LF line endings normalized).
3. **Never Silent Overwrite:** When concurrent modifications occur, the engine triggers a 3-way conflict resolution rather than a naive Last-Write-Wins (LWW) strategy, protecting critical pin configurations and embedded logic.

---

## 2. Sync State Machine & Lifecycle

```
[Local Edit] ---> [Compute SHA-256] ---> [Write Local DB & Disk]
                                                    |
                                                    v
                                      [Append to Outbox Table]
                                                    |
                                           (Online Check)
                                        /                  \
                                     (No)                  (Yes)
                                      |                      |
                            [Retain in Outbox]       [Sync Handshake]
                                                             |
                                            +----------------+----------------+
                                            |                                 |
                                    [Fast-Forward]                   [Conflict Detected]
                                            |                                 |
                                [Update Cloud Rev]                  [3-Way Merge UI]
```

---

## 3. Data Transfer Objects (DTOs)

### 3.1 Sync Handshake Request
```json
{
  "client_id": "desktop-client-uuid",
  "project_id": "b3e9441f-1358-45a2-899f-7c15e8b4e768",
  "base_revision_id": "rev-1002",
  "files": [
    {
      "path": "src/main.cpp",
      "sha256": "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
      "size": 1420
    },
    {
      "path": "platformio.ini",
      "sha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
      "size": 412
    }
  ]
}
```

### 3.2 Sync Handshake Response
```json
{
  "status": "CONFLICT",
  "remote_head_revision": "rev-1004",
  "conflicts": [
    {
      "path": "src/main.cpp",
      "base_hash": "a1b2c3...",
      "local_hash": "8f4343...",
      "remote_hash": "99aa88...",
      "remote_content_url": "https://s3.amazonaws.com/esp-studio-artifacts/.../main.cpp"
    }
  ],
  "fast_forward_files": [
    {
      "path": "include/config.h",
      "action": "DOWNLOAD",
      "download_url": "https://s3.amazonaws.com/esp-studio-artifacts/.../config.h"
    }
  ]
}
```

---

## 4. Conflict Resolution Strategies

For source code conflicts (C/C++, INI, Headers), ESP Studio provides:
1. **Three-Way Merge:** Auto-merges non-overlapping hunk differences based on common ancestor `base_revision`.
2. **Interactive UI Review:** Side-by-side diff view in the Monaco Editor showing:
   - Left: Local Modified Copy
   - Center: Merge Result
   - Right: Cloud Remote Copy
3. **Explicit Override Options:**
   - `Accept Local` (client branch overrides remote)
   - `Accept Remote` (remote overrides local client)
   - `Save Both` (renames local to `main.local_backup.cpp` and fetches remote)
