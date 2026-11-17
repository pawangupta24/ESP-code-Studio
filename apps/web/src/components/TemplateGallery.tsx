import React from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { Sparkles, ArrowRight, Cpu, Radio, Wifi, Camera, Check } from 'lucide-react';

interface ProjectTemplate {
  id: string;
  title: string;
  category: 'Agriculture & Robotics' | 'BLE & Wireless' | 'Web & Networking' | 'AI & Vision' | 'Industrial FreeRTOS';
  description: string;
  icon: React.FC<{ className?: string }>;
  tags: string[];
  files: Record<string, string>;
}

export const TemplateGallery: React.FC = () => {
  const [state, actions] = useWorkspaceStore();

  const templates: ProjectTemplate[] = [
    {
      id: 'sprayer-controller',
      title: 'ESP32-S3 Smart Sprayer & PWM Solenoid Controller',
      category: 'Agriculture & Robotics',
      icon: Cpu,
      tags: ['Arduino', 'PWM', 'NVS Identity', 'ADC Sensors'],
      description: 'Production controller for agricultural sprayers with pressure sensors, PWM solenoids, status WS2812 LED, and persistent NVS identity.',
      files: {
        'platformio.ini': `[env:esp32-s3-devkitc-1]\nplatform = espressif32 @ 6.7.0\nboard = esp32-s3-devkitc-1\nframework = arduino\nmonitor_speed = 115200\nbuild_flags = -D ARDUINO_USB_CDC_ON_BOOT=1\n`,
        'src/main.cpp': `#include <Arduino.h>\n#define SOLENOID_PWM_PIN 18\n#define STATUS_LED 48\nvoid setup() {\n  Serial.begin(115200);\n  pinMode(SOLENOID_PWM_PIN, OUTPUT);\n  pinMode(STATUS_LED, OUTPUT);\n  Serial.println("[APP] Smart Sprayer Initialized: SPRAYER-001");\n}\nvoid loop() {\n  digitalWrite(STATUS_LED, HIGH);\n  delay(500);\n  digitalWrite(STATUS_LED, LOW);\n  delay(500);\n}\n`,
      },
    },
    {
      id: 'ble-beacon',
      title: 'ESP32-S3 BLE 5.0 Environmental Telemetry Beacon',
      category: 'BLE & Wireless',
      icon: Radio,
      tags: ['BLE', 'NimBLE', 'Battery Optimized', 'Sensors'],
      description: 'Ultra-low power Bluetooth Low Energy beacon advertising temperature, humidity, and battery voltage packets at 100ms intervals.',
      files: {
        'platformio.ini': `[env:esp32-s3-devkitc-1]\nplatform = espressif32 @ 6.7.0\nboard = esp32-s3-devkitc-1\nframework = arduino\nmonitor_speed = 115200\n`,
        'src/main.cpp': `#include <Arduino.h>\n#include <BLEDevice.h>\n#include <BLEUtils.h>\n#include <BLEServer.h>\n#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"\nvoid setup() {\n  Serial.begin(115200);\n  BLEDevice::init("ESP32S3-BEACON-01");\n  BLEServer *pServer = BLEDevice::createServer();\n  Serial.println("[BLE] Advertising Started!");\n}\nvoid loop() {\n  delay(1000);\n}\n`,
      },
    },
    {
      id: 'async-web',
      title: 'ESP32-S3 Async Web Dashboard & WebSocket Telemetry',
      category: 'Web & Networking',
      icon: Wifi,
      tags: ['AsyncTCP', 'WebSockets', 'JSON API', 'mDNS'],
      description: 'High-throughput async HTTP and WebSocket server serving an interactive real-time telemetry dashboard directly from SPIFFS.',
      files: {
        'platformio.ini': `[env:esp32-s3-devkitc-1]\nplatform = espressif32 @ 6.7.0\nboard = esp32-s3-devkitc-1\nframework = arduino\nmonitor_speed = 115200\nlib_deps = ESPAsyncWebServer, ArduinoJson\n`,
        'src/main.cpp': `#include <Arduino.h>\n#include <WiFi.h>\nvoid setup() {\n  Serial.begin(115200);\n  WiFi.begin("IoT-Network", "SecurePass");\n  Serial.println("[HTTP] Async Server Ready on Port 80");\n}\nvoid loop() {\n  delay(2000);\n}\n`,
      },
    },
    {
      id: 'vision-ai',
      title: 'ESP32-S3 Camera Vision & Edge ML Object Detection',
      category: 'AI & Vision',
      icon: Camera,
      tags: ['ESP-WHO', 'OV2640', 'TensorFlow Lite', 'Edge AI'],
      description: 'Camera frame grabber streaming JPEG snapshots over HTTP with onboard TensorFlow Lite micro-inference classification.',
      files: {
        'platformio.ini': `[env:esp32-s3-devkitc-1]\nplatform = espressif32 @ 6.7.0\nboard = esp32-s3-devkitc-1\nframework = arduino\nbuild_flags = -D BOARD_HAS_PSRAM\n`,
        'src/main.cpp': `#include <Arduino.h>\n#include "esp_camera.h"\nvoid setup() {\n  Serial.begin(115200);\n  Serial.println("[AI] Camera Driver Initialized with 8MB PSRAM");\n}\nvoid loop() {\n  delay(500);\n}\n`,
      },
    },
  ];

  return (
    <div className="flex-1 p-6 bg-[#0d1117] overflow-y-auto text-xs font-mono select-none">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>ESP Studio Embedded Project Template Library</span>
          </h2>
          <p className="text-[#8b949e] mt-0.5">
            Production-ready starter configurations with pre-configured platformio.ini flags, pin maps, and dependencies.
          </p>
        </div>

        {/* Template Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          {templates.map((tpl) => {
            const Icon = tpl.icon;
            const isCurrent = state.project.metadata.name === tpl.id;

            return (
              <div
                key={tpl.id}
                className="p-5 rounded-2xl bg-[#161b22] border border-[#30363d] hover:border-[#58a6ff]/60 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-xl bg-[#0d1117] border border-[#21262d] text-[#58a6ff]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#21262d] text-[#8b949e]">
                      {tpl.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">{tpl.title}</h3>
                    <p className="text-[11px] text-[#8b949e] mt-1 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tpl.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded bg-[#0d1117] text-[#58a6ff] border border-[#21262d] text-[10px]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#21262d] flex justify-between items-center">
                  <span className="text-[10px] text-slate-500">
                    {Object.keys(tpl.files).length} project files included
                  </span>

                  <button
                    onClick={async () => {
                      const choice = await actions.showDialog({
                        severity: 'warning',
                        message: `Load template '${tpl.title}'?`,
                        detail: 'This replaces the files in the current workspace. Export a ZIP first if you want to keep them.',
                        buttons: ['Load Template', 'Cancel'],
                      });
                      if (choice === 0) actions.loadTemplateProject(tpl.id, tpl.files);
                    }}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isCurrent
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-[#1f6feb] hover:bg-[#388bfd] text-white'
                    }`}
                  >
                    {isCurrent ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    <span>{isCurrent ? 'Active Project' : 'Use Template'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
