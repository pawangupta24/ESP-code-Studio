# ESP Studio — Product Requirements Document (PRD)

**Document Version:** 1.0.0  
**Status:** Approved  
**Target Hardware:** Espressif ESP32-S3 (Extensible to ESP32, ESP32-C3/C6, and STM32)  
**Target Runtimes:** Modern Web Browsers (Chrome / Edge with Web Serial) & Native Desktop (Windows, macOS, Linux via Tauri 2)

---

## 1. Executive Summary

ESP Studio is a unified hybrid embedded development platform built for IoT engineers, firmware developers, and embedded hobbyists. It eliminates the traditional dichotomy between complex, heavyweight desktop IDEs (such as VS Code + PlatformIO/Eclipse) and limited browser-based toy flashers by providing an identical, high-performance interface backed by dual execution engines:
1. **Cloud Compilation & Storage:** Headless compilation workers and cloud collaboration.
2. **Local Compilation & Offline Operations:** Native offline PlatformIO compilation and local device control.

---

## 2. Core Personas & Use Cases

- **Firmware Developer in the Field:** Needs to flash firmware onto deployed devices (e.g. agricultural sprayers, industrial controllers) directly via Chrome on a Chromebook or laptop without installing a 10 GB C++ toolchain.
- **Embedded Systems Engineer:** Works offline on airplanes or secure laboratory networks using the desktop application, compiling with local PlatformIO, and syncing changes upon reconnecting.
- **Hardware Team Lead:** Tracks fleet devices via provisioned unique hardware IDs, inspects partition tables, and verifies flash integrity across revisions.

---

## 3. Functional Requirements

### 3.1 Project & Workspace Management
- **FR-01:** Provide standardized project templates for ESP32-S3 (`Arduino` framework and `ESP-IDF` framework).
- **FR-02:** Support multi-file tree structure: `src/`, `include/`, `lib/`, `partitions.csv`, and `platformio.ini`.
- **FR-03:** Local-first storage: Web uses IndexedDB; Desktop uses direct local filesystem + SQLite metadata.
- **FR-04:** Export and import project archives (.zip).

### 3.2 Code Editor
- **FR-05:** Embedded Monaco Editor with C/C++ syntax highlighting, auto-formatting, bracket matching, and error squiggle diagnostics.
- **FR-06:** Multi-tab file switching, dirty buffer tracking, and shortcut keys (Ctrl+S, Ctrl+B, Ctrl+U).

### 3.3 Hardware & Device Identification
- **FR-07:** Auto-detect ESP32-S3 devices over USB / UART.
- **FR-08:** Provision persistent platform UUIDs stored inside ESP32 Non-Volatile Storage (NVS) alongside MAC address and chip revision (e.g., custom ID `SPRAYER-001`).
- **FR-09:** Maintain device connection history, last known firmware version, and associated projects.

### 3.4 Build Engine (Cloud + Local)
- **FR-10:** Cloud build pipeline: Trigger compile request -> queue job in Redis/BullMQ -> compile inside isolated Docker worker -> generate standardized `FirmwareArtifact` package.
- **FR-11:** Local build pipeline: Execute desktop PlatformIO binary -> stream stdout/stderr into IDE terminal -> generate identical `FirmwareArtifact` package.
- **FR-12:** Build artifact package contract:
  - `firmware.bin` (application binary)
  - `bootloader.bin` (chip bootloader)
  - `partitions.bin` (partition table)
  - `merged-firmware.bin` (consolidated image starting at address 0x0)
  - `flash-manifest.json` (offsets, baud rate, chip family)
  - `build-info.json` (commit hash, compiler version, timestamp)

### 3.5 Firmware Flashing
- **FR-13:** Browser flashing using `esptool-js` over Web Serial with real-time percentage progress bar.
- **FR-14:** Desktop flashing using native subprocess (`esptool.py` or compiled C/Rust flasher).
- **FR-15:** Automatic baud rate negotiation (115,200 baud handshake -> 921,600 baud upload).
- **FR-16:** Support whole-chip erase, application-only flash, and partition table flash.

### 3.6 Serial Monitor
- **FR-17:** Real-time bi-directional serial terminal supporting standard baud rates (9600, 115200, 230400, 460800, 921600).
- **FR-18:** Microsecond/millisecond timestamp toggle, ANSI color rendering, auto-scroll, regex filter, and CSV/TXT export.
- **FR-19:** Serial command input bar supporting `\r\n`, `\n`, or hex payload modes.

### 3.7 Synchronization & Versioning
- **FR-20:** Local-first synchronization: All operations execute instantly against local storage and append to a transactional outbox.
- **FR-21:** SHA-256 hash tracking per file to detect diffs.
- **FR-22:** Three-way merge resolution for source code collisions (`Keep Local`, `Keep Cloud`, `Merge Diff`). Binary artifacts reject automatic merge.

---

## 4. Non-Functional Requirements

- **NFR-01 Performance:** Editor typing latency < 16ms. Serial monitor render rate up to 10,000 lines/sec without UI freeze via virtualized rendering.
- **NFR-02 Consistency:** Firmware binaries produced by cloud worker and local builder from identical commit & toolchain definitions must be bit-for-bit or functionally equivalent.
- **NFR-03 Security:** Isolated container sandboxing for all cloud compilation; strict sanitization of `platformio.ini` extra scripts to prevent arbitrary host execution.
- **NFR-04 Offline Resilience:** The desktop IDE must be 100% operational (edit, build, flash, monitor) without an active internet connection.
