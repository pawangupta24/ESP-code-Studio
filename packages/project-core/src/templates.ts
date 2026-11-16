import { Project } from '@esp-studio/shared-types';

export const ESP32S3_ARDUINO_TEMPLATE: (id: string, name: string) => Project = (id, name) => ({
  metadata: {
    id,
    name,
    description: 'ESP32-S3 Arduino Starter Project with LED Blink & Serial Telemetry',
    boardTarget: 'esp32-s3-devkitc-1',
    boardFamily: 'ESP32-S3',
    framework: 'arduino',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  files: {
    'platformio.ini': {
      path: 'platformio.ini',
      content: `[env:esp32-s3-devkitc-1]
platform = espressif32 @ 6.7.0
board = esp32-s3-devkitc-1
framework = arduino
monitor_speed = 115200
build_flags = 
    -D ARDUINO_USB_CDC_ON_BOOT=1
    -D CORE_DEBUG_LEVEL=3
`,
    },
    'src/main.cpp': {
      path: 'src/main.cpp',
      content: `#include <Arduino.h>

#define LED_PIN 48 // ESP32-S3 onboard RGB WS2812 / Status LED
#define TELEMETRY_INTERVAL_MS 2000

unsigned long lastTelemetry = 0;
uint32_t loopCounter = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(LED_PIN, OUTPUT);
  Serial.println("[ESP Studio] Initialized ESP32-S3 Target");
  Serial.println("[ESP Studio] Device ID: SPRAYER-001");
  Serial.println("[ESP Studio] Firmware v1.0.0 Ready");
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  delay(250);
  digitalWrite(LED_PIN, LOW);
  delay(250);

  if (millis() - lastTelemetry >= TELEMETRY_INTERVAL_MS) {
    lastTelemetry = millis();
    loopCounter++;
    Serial.printf("[TELEMETRY] Loop: %u | Free Heap: %u bytes\\n", loopCounter, ESP.getFreeHeap());
  }
}
`,
    },
    'include/README': {
      path: 'include/README',
      content: `ESP Studio Include Directory\nHeaders (.h files) located here will be automatically included during compilation.\n`,
    },
    'include/sensor_config.h': {
      path: 'include/sensor_config.h',
      content: `#ifndef SENSOR_CONFIG_H\n#define SENSOR_CONFIG_H\n\n#include <stdint.h>\n\n// ESP32-S3 Pin Allocations\n#define PIN_PRESSURE_ADC 1\n#define PIN_FLOW_RATE_PULSE 4\n#define PIN_STATUS_RGB 48\n#define PIN_I2C_SDA 8\n#define PIN_I2C_SCL 9\n\ntypedef struct {\n  uint32_t sampleRateHz;\n  float calibrationOffset;\n  uint8_t alertThresholdPercent;\n} SprayerSensorProfile_t;\n\n#endif // SENSOR_CONFIG_H\n`,
    },
    'partitions.csv': {
      path: 'partitions.csv',
      content: `# Name,   Type, SubType, Offset,  Size, Flags\nnvs,      data, nvs,     0x9000,  0x5000,\notadata,  data, ota,     0xe000,  0x2000,\napp0,     app,  ota_0,   0x10000, 0x300000,\napp1,     app,  ota_1,   0x310000,0x300000,\nspiffs,   data, spiffs,  0x610000,0x1e0000,\n`,
    },
    'manifest.json': {
      path: 'manifest.json',
      content: `{\n  "target": "esp32s3",\n  "version": "1.0.5",\n  "deviceId": "SPRAYER-001",\n  "flash": {\n    "mode": "dio",\n    "speed": "80m",\n    "size": "8MB"\n  },\n  "partitions": [\n    { "name": "nvs", "offset": "0x9000", "size": "20KB" },\n    { "name": "app0", "offset": "0x10000", "size": "3MB" }\n  ]\n}\n`,
    },
    'README.md': {
      path: 'README.md',
      content: `# ESP Studio - ESP32-S3 Sprayer Controller\n\nHybrid embedded firmware for precision agricultural sprayer telemetry and flow monitoring.\n\n## Hardware Pinout Matrix\n\n| Peripheral | ESP32-S3 GPIO | Bus / Type | Notes |\n| :--- | :--- | :--- | :--- |\n| **WS2812 Status LED** | GPIO 48 | RMT / One-Wire | RGB Diagnostic Indicator |\n| **Pressure Sensor** | GPIO 1 | ADC1_CH0 | 0 - 3.3V Analog Input |\n| **Flow Pulse Sensor** | GPIO 4 | Interrupt | Hardware Pulse Counter |\n| **I2C Bus (SDA)** | GPIO 8 | I2C Primary | BME280 / Barometer |\n| **I2C Bus (SCL)** | GPIO 9 | I2C Primary | 400 kHz Fast Mode |\n\n## Features\n- [x] Dual-Core FreeRTOS telemetry pinned to Core 0\n- [x] Web Serial 921,600 baud streaming\n- [x] OTA dual-partition rollback protection\n- [ ] Bluetooth LE configuration client\n\n\`\`\`cpp\n// Quick check of ESP32-S3 internal SRAM\nSerial.printf("Internal Free Heap: %u bytes\\n", esp_get_free_heap_size());\n\`\`\`\n`,
    },
    'telemetry.log': {
      path: 'telemetry.log',
      content: `[2026-11-13 12:00:01] [INFO] [BOOT] ESP32-S3 chip revision v0.2 booting...\n[2026-11-13 12:00:02] [INFO] [NVS] Loaded device identifier: SPRAYER-001\n[2026-11-13 12:00:03] [INFO] [WIFI] WiFi station initialized in background.\n[2026-11-13 12:00:04] [INFO] [ADC] Pressure sensor calibration ok: 42.8 PSI\n[2026-11-13 12:00:05] [WARN] [HEAP] Free SRAM 284120 bytes (Normal operation)\n`,
    },
    'schematic.svg': {
      path: 'schematic.svg',
      content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" width="100%" height="100%">\n  <rect width="400" height="240" fill="#0d1117" rx="12"/>\n  <rect x="40" y="40" width="120" height="160" fill="#161b22" stroke="#58a6ff" stroke-width="2" rx="8"/>\n  <text x="100" y="80" fill="#58a6ff" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle">ESP32-S3</text>\n  <text x="100" y="105" fill="#8b949e" font-family="monospace" font-size="11" text-anchor="middle">SPRAYER-001</text>\n  <circle cx="100" cy="140" r="12" fill="#238636"/>\n  <text x="100" y="144" fill="#ffffff" font-family="monospace" font-size="10" text-anchor="middle">OK</text>\n  <line x1="160" y1="90" x2="260" y2="90" stroke="#a5d6ff" stroke-width="2" stroke-dasharray="4"/>\n  <rect x="260" y="70" width="100" height="40" fill="#21262d" stroke="#30363d" rx="6"/>\n  <text x="310" y="95" fill="#c9d1d9" font-family="monospace" font-size="11" text-anchor="middle">Sensor ADC</text>\n  <line x1="160" y1="150" x2="260" y2="150" stroke="#e3b341" stroke-width="2"/>\n  <rect x="260" y="130" width="100" height="40" fill="#21262d" stroke="#30363d" rx="6"/>\n  <text x="310" y="155" fill="#e3b341" font-family="monospace" font-size="11" text-anchor="middle">I2C Bus</text>\n</svg>\n`,
    },
    'firmware.bin': {
      path: 'firmware.bin',
      content: `ESP32-S3_BIN_IMAGE_V1\nOffset: 0x00010000 | Magic: 0xE9 | Segments: 3\nEntry: 0x40378120 | Hash: 9f8a3c2b1e4d7a8f90b1c2d3e4f5a6b7\nFLASH_MODE: DIO | SPEED: 80MHz | SIZE: 8MB\n[BINARY IMAGE DATA - 0x10000 to 0x72A40 - Validated ELF]\n`,
    },
    'datasheet.pdf': {
      path: 'datasheet.pdf',
      content: `%PDF-1.4\n1 0 obj << /Title (ESP32-S3 Hardware Specification) /Author (Espressif Systems) >> endobj\n2 0 obj << /Type /Catalog /Pages 3 0 R >> endobj\n3 0 obj << /Type /Pages /Kids [4 0 R] /Count 1 >> endobj\n4 0 obj << /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] >> endobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000095 00000 n \n0000000140 00000 n \n0000000195 00000 n \ntrailer << /Size 5 /Root 2 0 R >>\nstartxref\n280\n%%EOF\n`,
    },
  },
});
