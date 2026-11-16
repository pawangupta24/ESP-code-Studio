# ESP Studio — Device Identity & Hardware Protocol

**Document Version:** 1.0.0  
**Target Hardware:** ESP32-S3  
**Communication Standards:** Web Serial API (W3C), Native OS Serial (CDC/VCP), esptool SLIP Protocol

---

## 1. Device Identification Philosophy

Traditional IoT tooling relies solely on MAC addresses or dynamic COM port assignments (e.g., `COM3`, `/dev/ttyUSB0`). This fails in production when multiple identical boards are connected, or when a board is plugged into a different USB port.

ESP Studio introduces **Permanent Provisioned Device Identity**:
- Every board registered with ESP Studio receives a persistent logical ID (e.g., `SPRAYER-001`, `TELEMETRY-NODE-4`).
- This logical ID is provisioned into the ESP32-S3 **NVS (Non-Volatile Storage)** namespace `esp_studio` under the key `device_id`.
- The device profile in the cloud & local database correlates the logical ID with the hardware MAC, chip revision, and flash size.

---

## 2. NVS Provisioning Layout

The ESP Studio firmware includes a lightweight provisioning header:

```c
#include <nvs_flash.h>
#include <nvs.h>

#define ESP_STUDIO_NVS_NAMESPACE "esp_studio"
#define ESP_STUDIO_KEY_DEVICE_ID "device_id"
#define ESP_STUDIO_KEY_FIRMWARE_VER "fw_ver"

esp_err_t esp_studio_read_identity(char* out_device_id, size_t max_len) {
    nvs_handle_t my_handle;
    esp_err_t err = nvs_open(ESP_STUDIO_NVS_NAMESPACE, NVS_READONLY, &my_handle);
    if (err != ESP_OK) return err;
    err = nvs_get_str(my_handle, ESP_STUDIO_KEY_DEVICE_ID, out_device_id, &max_len);
    nvs_close(my_handle);
    return err;
}
```

---

## 3. Serial Packet Protocol (Command & Telemetry Mode)

When connected to ESP Studio in normal runtime mode (after boot), the device can emit and receive structured serial frames wrapped in JSON delimiters or human-readable lines.

### 3.1 Device Announce Packet (On Boot)
```json
{
  "$esp_studio": {
    "event": "BOOT",
    "device_id": "SPRAYER-001",
    "chip": "ESP32-S3 (Revision 0)",
    "mac": "84:F7:03:1A:2B:3C",
    "firmware": "1.0.5",
    "flash_size_mb": 8,
    "free_heap": 284192
  }
}
```

### 3.2 Host Command Injections
- `ESP:PING` -> Device replies `{"$esp_studio": {"event": "PONG", "uptime_ms": 14205}}`
- `ESP:RESET` -> Triggers software restart (`esp_restart()`)
- `ESP:OTA:START` -> Enters local WiFi or serial OTA mode

---

## 4. Hardware Connection Matrix

| Parameter | Handshake Mode | Bootloader / Flash Mode | Runtime Telemetry Mode |
| :--- | :--- | :--- | :--- |
| **Baud Rate** | 115,200 | 921,600 (High Speed) | 115,200 (Default) |
| **DTR / RTS** | Used to trigger bootloader | DTR=0, RTS=1 -> DTR=1, RTS=0 | Kept HIGH / standard |
| **Parity** | None | None | None |
| **Data Bits** | 8 | 8 | 8 |
| **Stop Bits** | 1 | 1 | 1 |
