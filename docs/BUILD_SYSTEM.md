# ESP Studio — Build System Specification

**Document Version:** 1.0.0  
**Target Architecture:** ESP32-S3 (Xtensa dual-core 32-bit LX7)  
**Compilation Engines:** PlatformIO Core (Local) & Dockerized Headless Workers (Cloud)

---

## 1. Reproducible Build Guarantee

To guarantee that code built in the cloud and code built offline produce functionally identical binary artifacts, both engines enforce rigid toolchain pinning:

| Component | Pinned Version / Setting |
| :--- | :--- |
| **PlatformIO Core** | `v6.1.15` |
| **Platform Espressif32** | `v6.7.0` |
| **Toolchain Xtensa-ESP32S3-ELF** | `gcc12_2_0-esp-2023r2` |
| **Arduino-ESP32 Core** | `v2.0.14` |
| **ESP-IDF** | `v5.1.2` |

---

## 2. Standardized Firmware Artifact Package

Every successful build (cloud or local) produces an artifact directory structured according to this strict specification:

```
build-output/
├── firmware.bin           # Application binary payload
├── bootloader.bin         # ESP32-S3 2nd stage bootloader
├── partitions.bin         # Generated binary partition table
├── merged-firmware.bin    # Complete raw image padded with 0xFF for one-shot flash at 0x0
├── flash-manifest.json    # Offsets, addresses, frequencies, flash mode
├── build-info.json        # Compiler version, timestamp, Git/SHA hash, toolchain ID
└── build.log              # Raw stdout/stderr stream from compiler
```

---

## 3. Flash Manifest Schema (`flash-manifest.json`)

```json
{
  "manifest_version": "1.0",
  "chip_family": "ESP32-S3",
  "flash_mode": "qio",
  "flash_freq": "80m",
  "flash_size": "8MB",
  "segments": [
    {
      "name": "bootloader",
      "offset": "0x0000",
      "path": "bootloader.bin",
      "size": 21856,
      "sha256": "4392f..."
    },
    {
      "name": "partitions",
      "offset": "0x8000",
      "path": "partitions.bin",
      "size": 3072,
      "sha256": "8931a..."
    },
    {
      "name": "application",
      "offset": "0x10000",
      "path": "firmware.bin",
      "size": 312480,
      "sha256": "fc771..."
    }
  ]
}
```

---

## 4. Execution Pipelines

### 4.1 Cloud Build Pipeline
1. Client pushes project bundle (manifest + sources + `platformio.ini`).
2. API validates file sizes and rejects banned build scripts (`extra_scripts = http://...`).
3. Job is pushed to Redis queue `builds:esp32s3`.
4. Ephemeral Docker worker spins up:
   `docker run --rm --cpus=2 --memory=3g -v /tmp/job-123:/workspace esp32-builder:v1.0 pio run`
5. Artifacts are extracted, checksums generated, uploaded to S3, and signed download URLs returned.

### 4.2 Local Desktop Build Pipeline
1. Tauri backend invokes local `pio` or bundled PlatformIO executable.
2. Standard output / error streams are parsed via regex for compiler errors:
   `(?<file>.+):(?<line>\d+):(?<col>\d+): (?:fatal )?(?<severity>error|warning): (?<message>.+)`
3. Diagnostics are dispatched to Monaco Editor to mark inline error markers.
4. Resulting files in `.pio/build/esp32-s3-devkitc-1/` are copied into `build-output/`.
