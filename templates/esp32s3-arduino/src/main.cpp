#include <Arduino.h>

#define STATUS_LED_PIN 48
#define TELEMETRY_INTERVAL_MS 2000

unsigned long lastTelemetry = 0;
uint32_t cycleCount = 0;

void setup() {
  Serial.begin(115200);
  delay(1200);

  pinMode(STATUS_LED_PIN, OUTPUT);
  Serial.println("[BOOT] ESP Studio Runtime Initialized");
  Serial.println("[BOOT] Board: ESP32-S3-DevKitC-1-N8 (Xtensa LX7 dual-core)");
  Serial.println("[BOOT] Device Identity: SPRAYER-001");
  Serial.println("[BOOT] Ready for commands. Type ESP:PING or ESP:RESET");
}

void loop() {
  // Heartbeat pulse
  digitalWrite(STATUS_LED_PIN, HIGH);
  delay(200);
  digitalWrite(STATUS_LED_PIN, LOW);
  delay(200);

  // Periodic telemetry emission
  if (millis() - lastTelemetry >= TELEMETRY_INTERVAL_MS) {
    lastTelemetry = millis();
    cycleCount++;
    Serial.printf("[TELEMETRY] Cycle: %u | Free Heap: %u bytes | Min Heap: %u bytes\\n",
                  cycleCount,
                  ESP.getFreeHeap(),
                  ESP.getMinFreeHeap());
  }
}
