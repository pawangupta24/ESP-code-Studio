# ESP Studio — Security & Sandboxing Architecture

**Document Version:** 1.0.0  
**Status:** Approved  
**Focus:** Cloud Build Isolation, Local Filesystem Sandboxing, and Hardware Safety

---

## 1. Threat Model & Vectors

Embedded IDE platforms present unique security risks because users submit arbitrary source code (`.c`, `.cpp`), header files, build definitions (`platformio.ini`), and hardware flashing instructions. Potential threats include:
1. **Remote Code Execution in Build Workers:** Malicious PlatformIO build scripts (`extra_scripts = pre:evil.py`) executing arbitrary code on the cloud backend.
2. **Path Traversal Attacks:** Malicious file paths (e.g., `../../../../etc/passwd`) inside project archives or sync handshakes.
3. **Firmware Brick Attacks:** Malicious bootloader or bad flash offsets causing physical damage or bricking embedded hardware.
4. **Denial of Service (DoS):** Infinite macro recursion or compiler memory bombs in C++ template metaprogramming.

---

## 2. Cloud Compilation Isolation (Zero Trust Workers)

```
[Cloud API] 
     |
     v (Redis Queue)
[BullMQ Orchestrator]
     |
     v (Docker Engine with gVisor / runsc runtime)
+-------------------------------------------------------------+
| Container: esp32-builder                                    |
| - Read-only root filesystem (`--read-only`)                 |
| - Non-root execution (`USER builder:1000`)                  |
| - Dropped capabilities (`--cap-drop=ALL`)                   |
| - No host network (`--network none`)                        |
| - Storage quote: 512 MB tmpfs for build outputs             |
| - Strict ulimits: CPU=2 cores, Memory=3GB, Timeout=180s     |
| - Script Filter: Blocks external urllib/socket in scripts   |
+-------------------------------------------------------------+
```

---

## 3. Local Desktop Security (Tauri 2 Sandboxing)

1. **Path Restriction:** Local file operations are constrained to user-selected project directories and the internal `~/.esp-studio/` directory via Tauri's path scoping capabilities.
2. **Explicit Hardware Permissions:** Serial and USB connections require explicit user approval dialogs before opening any native COM port.
3. **No Embedded Cloud Secrets:** Desktop binaries never package administrative API keys or unencrypted database credentials. All communication uses ephemeral user session tokens.

---

## 4. Firmware Safety & Flash Integrity

1. **Checksum Verification:** Flash manifests include SHA-256 digests for each partition segment (`bootloader`, `partitions`, `application`). Upload tools verify payloads prior to issuing write commands.
2. **Protected Partitions:** ESP Studio enforces write protection on NVS partitions holding board calibration and device UUIDs unless the user explicitly executes a destructive "Erase Entire Chip" command.
