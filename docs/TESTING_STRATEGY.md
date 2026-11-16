# ESP Studio — Testing Strategy

**Document Version:** 1.0.0  
**Test Coverage:** Unit, Integration, E2E, and Physical Hardware-in-the-Loop (HIL)

---

## 1. Testing Pyramid

```
                / \
               /   \      Hardware-in-the-Loop (ESP32-S3 test bench)
              / HIL \     Web Serial flashing & UART loopback
             /-------\
            /   E2E   \   Playwright tests across Web & Tauri
           /-----------\
          / Integration \ Provider contract tests (Mock vs Real)
         /---------------\
        /   Unit Tests    \ Pure functions: 3-way merge, parser, DTOs
       /-------------------\
```

---

## 2. Test Suites by Layer

### 2.1 Unit Tests (`packages/*`)
- **`sync-core`**: Test 3-way merge algorithm with overlapping and non-overlapping diffs; test outbox ordering.
- **`project-core`**: Test project file tree serialization, template expansion, and path traversal guards.
- **`build-core`**: Validate compiler error regex parsing and `flash-manifest.json` schema verification.
- **`device-core`**: Validate UUID generation, NVS encoding/decoding, and MAC formatters.

### 2.2 Integration Tests (`apps/*`)
- **Web Serial Provider Mocking**: Inject mock serial streams to verify terminal ANSI rendering, line buffering, and autoscroll performance under heavy load (10k lines/sec).
- **Build Provider Contract**: Run identical source code through mock cloud provider and local build provider, verifying identical output manifests.

### 2.3 Hardware-in-the-Loop (HIL) Bench
- Automated test rig with an ESP32-S3-DevKitC-1 connected via USB.
- Tests execute:
  1. Bootloader handshake.
  2. Flash erase and full image upload.
  3. Reset into application.
  4. UART capture of serial output asserting `[BOOT] ESP Studio Ready: SPRAYER-001`.
