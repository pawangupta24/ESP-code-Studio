import { useState, useEffect } from 'react';
import { Project, BuildResult, FirmwareArtifact, DeviceProfile, BuildStatus, CompilerDiagnostic } from '@esp-studio/shared-types';
import { ESP32S3_ARDUINO_TEMPLATE } from '@esp-studio/project-core';
import { SimulatedBuildProvider } from '@esp-studio/build-core';
import { MockSerialProvider } from '@esp-studio/serial-core';
import { SimulatedFlashProvider, FlashProgress } from '@esp-studio/flash-core';
import { SyncEngine } from '@esp-studio/sync-core';
import { downloadProjectAsZip } from '../utils/zipExport';

export type NavTab = 
  | 'explorer' 
  | 'devices' 
  | 'pinout' 
  | 'freertos' 
  | 'ota' 
  | 'libraries' 
  | 'extensions'
  | 'git-graph' 
  | 'templates' 
  | 'build' 
  | 'sync' 
  | 'ai-copilot'
  | 'settings';

export type BuildEngineMode = 'cloud' | 'local';

export type ThemeName = 'github-dark' | 'vscode-dark' | 'dracula' | 'monokai' | 'cyberpunk' | 'nord' | 'one-dark-pro';

export type AiModelId = 'gemini-1.5-pro' | 'gemini-1.5-flash' | 'claude-3.5-sonnet' | 'gpt-4o' | 'deepseek-coder';

export interface AiMessage {
  id: string;
  sender: 'user' | 'assistant';
  model: string;
  text: string;
  suggestedCode?: string;
  timestamp: string;
}

export interface CodeDiagnostic {
  line: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface EditorCustomization {
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  formatOnSave: boolean;
  lineNumbers?: boolean;
  bracketPairColorization?: boolean;
  cursorBlinking?: 'blink' | 'smooth' | 'phase' | 'solid';
  cursorStyle?: 'line' | 'block' | 'underline';
  renderWhitespace?: 'none' | 'boundary' | 'selection' | 'all';
  autoClosingBrackets?: boolean;
  autoClosingQuotes?: boolean;
  flashSpeed?: '40m' | '80m' | '120m';
  flashMode?: 'dio' | 'qio' | 'dout';
  defaultBaudRate?: number;
  autoScrollSerial?: boolean;
  showSerialTimestamps?: boolean;
}

export const DEFAULT_EDITOR_SETTINGS: EditorCustomization = {
  fontSize: 13,
  fontFamily: "'JetBrains Mono', Consolas, monospace",
  tabSize: 2,
  wordWrap: false,
  minimap: true,
  formatOnSave: true,
  lineNumbers: true,
  bracketPairColorization: true,
  cursorBlinking: 'smooth',
  cursorStyle: 'line',
  renderWhitespace: 'selection',
  autoClosingBrackets: true,
  autoClosingQuotes: true,
  flashSpeed: '80m',
  flashMode: 'qio',
  defaultBaudRate: 115200,
  autoScrollSerial: true,
  showSerialTimestamps: true,
};

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  plan: 'Developer Pro' | 'Enterprise Fleet' | 'Hobbyist Free';
  cloudBuildMinutesUsed: number;
  cloudBuildMinutesLimit: number;
  storageMbUsed: number;
  storageMbLimit: number;
  registeredDevices: number;
  maxDevices: number;
}

export interface GitCommitNode {
  hash: string;
  message: string;
  author: string;
  date: string;
  branch: string;
  tag?: string;
  filesChanged: number;
}

export interface TelemetryPoint {
  time: string;
  [key: string]: number | string;
}

export interface LibraryItem {
  name: string;
  version: string;
  author: string;
  description: string;
  installed: boolean;
  category: 'Sensors' | 'Display' | 'Communication' | 'Data Processing';
}

export interface ExtensionItem {
  id: string;
  name: string;
  displayName: string;
  publisher: string;
  version: string;
  description: string;
  icon: string;
  downloads: string;
  rating: number;
  category: 'Language' | 'Formatter' | 'Embedded Runtime' | 'Debugging';
  fileExtensions: string[];
  installed: boolean;
  enabled: boolean;
  features: string[];
  sampleTemplate?: {
    filename: string;
    content: string;
  };
}

export interface WorkspaceState {
  project: Project;
  activeFilePath: string;
  openTabs: string[];
  activeNavTab: NavTab;
  buildEngineMode: BuildEngineMode;
  
  // Customization & Themes
  theme: ThemeName;
  editorSettings: EditorCustomization;
  
  // User & Account
  isLoggedIn: boolean;
  user: UserAccount;
  isAuthModalOpen: boolean;
  isTourOpen: boolean;
  
  // Git Graph & Version Control
  gitBranches: string[];
  currentBranch: string;
  gitCommits: GitCommitNode[];
  stagedFiles: string[];
  
  // Build state
  isBuilding: boolean;
  buildStatus: BuildStatus;
  buildLogs: string[];
  diagnostics: CompilerDiagnostic[];
  lastArtifact: FirmwareArtifact | null;
  buildDurationMs: number;
  
  // Flash state
  isFlashing: boolean;
  flashProgress: FlashProgress | null;
  
  // Serial state
  isSerialConnected: boolean;
  serialBaudRate: number;
  serialLogs: string[];
  telemetryData: TelemetryPoint[];
  autoScrollSerial: boolean;
  showTimestamps: boolean;
  
  // Libraries
  libraries: LibraryItem[];
  
  // Extensions & Language Packs
  extensions: ExtensionItem[];
  extensionSearchQuery: string;
  selectedExtensionId: string | null;
  
  // Sync state
  syncStatus: 'SYNCED' | 'PENDING' | 'CONFLICT' | 'OFFLINE';
  isSyncModalOpen: boolean;
  lastSyncedAt: string;
  revisionCount: number;
  
  // Active target device
  activeDevice: DeviceProfile;
  targetBoard: string;
  framework: 'arduino' | 'espidf';
  
  // UI states
  isCommandPaletteOpen: boolean;
  paletteQuery: string; // initial text: '>' = commands, '' = files, ':' = go to line
  sidebarView: string; // 'explorer' | 'search' | 'git' | 'debug' | 'extensions' | 'esp32' | '' (hidden)
  dirtyFiles: string[]; // edited since last Save (content itself is auto-persisted)
  bottomPanelTab: 'serial' | 'plotter' | 'terminal' | 'build' | 'problems' | 'closed';
  searchQuery: string;
  zoomLevel: number;
  splitFilePath: string | null;
  
  // AI Copilot
  activeAiModel: AiModelId;
  isAiPanelOpen: boolean;
  aiMessages: AiMessage[];
  codeDiagnostics: CodeDiagnostic[];
}

const STORAGE_KEY = 'esp_studio_project_state_v1';

function getInitialProject(): Project {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.metadata && parsed.files) return parsed;
      }
    } catch {
      // Fallback
    }
  }
  return ESP32S3_ARDUINO_TEMPLATE('proj-esp32s3-default', 'esp32s3-sprayer-controller');
}

const UI_STORAGE_KEY = 'esp_studio_ui_state_v1';

function pickUiState(s: WorkspaceState) {
  return {
    theme: s.theme,
    editorSettings: s.editorSettings,
    zoomLevel: s.zoomLevel,
    openTabs: s.openTabs,
    activeFilePath: s.activeFilePath,
    sidebarView: s.sidebarView,
  };
}

function loadUiState(project: Project): Partial<ReturnType<typeof pickUiState>> {
  try {
    const ui = JSON.parse(window.localStorage.getItem(UI_STORAGE_KEY) || '{}');
    if (!ui || typeof ui !== 'object') return {};
    const out: Partial<ReturnType<typeof pickUiState>> = {};
    if (typeof ui.theme === 'string') out.theme = ui.theme;
    if (ui.editorSettings && typeof ui.editorSettings === 'object') {
      out.editorSettings = { ...DEFAULT_EDITOR_SETTINGS, ...ui.editorSettings };
    }
    if (typeof ui.zoomLevel === 'number') out.zoomLevel = Math.max(70, Math.min(160, ui.zoomLevel));
    if (typeof ui.sidebarView === 'string') out.sidebarView = ui.sidebarView;
    if (Array.isArray(ui.openTabs)) {
      // Only restore tabs whose files still exist
      const tabs: string[] = ui.openTabs.filter((t: unknown) => typeof t === 'string' && project.files[t]);
      out.openTabs = tabs;
      out.activeFilePath = tabs.includes(ui.activeFilePath) ? ui.activeFilePath : tabs[0] || '';
    }
    return out;
  } catch {
    return {};
  }
}

const initialProject = getInitialProject();

let globalState: WorkspaceState = {
  project: initialProject,
  activeFilePath: 'src/main.cpp',
  openTabs: ['src/main.cpp', 'platformio.ini'],
  activeNavTab: 'explorer',
  buildEngineMode: 'cloud',
  
  theme: 'github-dark',
  editorSettings: { ...DEFAULT_EDITOR_SETTINGS },
  
  isLoggedIn: true,
  user: {
    id: 'usr_8921a44f',
    name: 'Embedded Systems Lead',
    email: 'developer@esp-studio.io',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    plan: 'Developer Pro',
    cloudBuildMinutesUsed: 84,
    cloudBuildMinutesLimit: 600,
    storageMbUsed: 420,
    storageMbLimit: 10000,
    registeredDevices: 4,
    maxDevices: 100,
  },
  isAuthModalOpen: false,
  isTourOpen: false,
  
  gitBranches: ['main', 'feature/dual-ota-switching', 'fix/pwm-deadband'],
  currentBranch: 'main',
  gitCommits: [
    { hash: 'a194f82', message: 'feat: add FreeRTOS Core 0 telemetry watcher & WS2812 pin 48', author: 'Embedded Systems Lead', date: '10 mins ago', branch: 'main', tag: 'v1.0.6-rc', filesChanged: 3 },
    { hash: '7c82e01', message: 'fix: optimize NVS flash wear-leveling buffer write size', author: 'Alice Chen', date: '3 hours ago', branch: 'main', filesChanged: 1 },
    { hash: 'e920d14', message: 'feat: implement dual-partition OTA rollback protection', author: 'Bob Martinez', date: 'Yesterday', branch: 'feature/dual-ota-switching', filesChanged: 4 },
    { hash: '3f11a9b', message: 'chore: initial ESP32-S3 Arduino platformio structure', author: 'ESP Studio Bot', date: '3 days ago', branch: 'main', tag: 'v1.0.0', filesChanged: 5 },
  ],
  stagedFiles: [],
  
  isBuilding: false,
  buildStatus: 'IDLE',
  buildLogs: [],
  diagnostics: [],
  lastArtifact: null,
  buildDurationMs: 0,
  
  isFlashing: false,
  flashProgress: null,
  
  isSerialConnected: false,
  serialBaudRate: 115200,
  serialLogs: [],
  telemetryData: [],
  autoScrollSerial: true,
  showTimestamps: true,
  
  libraries: [
    {
      name: 'Adafruit NeoPixel',
      version: '1.12.0',
      author: 'Adafruit',
      description: 'Arduino library for controlling single-wire-based LED pixels and strip (ESP32-S3 RGB LED support).',
      installed: true,
      category: 'Display',
    },
    {
      name: 'ArduinoJson',
      version: '7.0.4',
      author: 'Benoit Blanchon',
      description: 'Efficient JSON serialization/deserialization for embedded C++ IoT nodes.',
      installed: true,
      category: 'Data Processing',
    },
    {
      name: 'PubSubClient',
      version: '2.8.0',
      author: 'Nick O\'Leary',
      description: 'A client library for simple MQTT messaging with cloud telemetry brokers.',
      installed: false,
      category: 'Communication',
    },
    {
      name: 'ESPAsyncWebServer',
      version: '3.1.0',
      author: 'me-no-dev',
      description: 'Asynchronous HTTP and WebSocket server for ESP32 and ESP32-S3.',
      installed: false,
      category: 'Communication',
    },
    {
      name: 'Adafruit BME280',
      version: '2.2.4',
      author: 'Adafruit',
      description: 'Driver for BME280 temperature, humidity, and barometric pressure sensor.',
      installed: false,
      category: 'Sensors',
    },
  ],
  
  extensions: [
    {
      id: 'cpp-esp32',
      name: 'cpp-esp32',
      displayName: 'C/C++ & ESP-IDF IntelliSense Pro',
      publisher: 'Espressif Systems',
      version: 'v1.4.2',
      description: 'Rich C/C++ language support, Xtensa-LX7 toolchain headers, and FreeRTOS task completion.',
      icon: '⚡',
      downloads: '380k',
      rating: 4.9,
      category: 'Language',
      fileExtensions: ['.cpp', '.c', '.hpp', '.h'],
      installed: true,
      enabled: true,
      features: ['C/C++ Syntax Highlighting', 'FreeRTOS Task Macros', 'ESP32-S3 Hardware Registers', 'Clang Diagnostic Engine'],
    },
    {
      id: 'micropython-esp32',
      name: 'micropython-esp32',
      displayName: 'MicroPython & CircuitPython for ESP32',
      publisher: 'MicroPython Org',
      version: 'v1.22.0',
      description: 'Python language support for ESP32-S3 microcontrollers with live REPL injection and machine/neopixel libraries.',
      icon: '🐍',
      downloads: '194k',
      rating: 4.8,
      category: 'Language',
      fileExtensions: ['.py'],
      installed: false,
      enabled: false,
      features: ['Python 3 Syntax & Indentation', 'ESP32 machine.Pin & ADC Autocomplete', 'Live REPL Execution', 'MicroPython Firmware Bundler'],
      sampleTemplate: {
        filename: 'main.py',
        content: `# MicroPython on ESP32-S3\nimport machine\nimport time\nimport neopixel\n\n# Configure WS2812 status LED on GPIO 48\nnp = neopixel.NeoPixel(machine.Pin(48), 1)\n\nprint("ESP32-S3 MicroPython Running!")\n\nwhile True:\n    np[0] = (0, 64, 128) # Cyan pulse\n    np.write()\n    time.sleep(0.5)\n    np[0] = (0, 0, 0)\n    np.write()\n    time.sleep(0.5)\n`,
      },
    },
    {
      id: 'rust-esp32',
      name: 'rust-esp32',
      displayName: 'Rust for ESP32 (esp-rs & no_std)',
      publisher: 'Rust-ESP Community',
      version: 'v0.18.1',
      description: 'Rust language support for Xtensa and RISC-V ESP32 targets with esp-hal and esp-idf-svc bindings.',
      icon: '🦀',
      downloads: '112k',
      rating: 4.9,
      category: 'Language',
      fileExtensions: ['.rs', '.toml'],
      installed: false,
      enabled: false,
      features: ['Rust Syntax Highlighting', 'no_std Embedded HAL Support', 'Cargo.toml Dependency Resolution', 'Xtensa LLVM Target Linters'],
      sampleTemplate: {
        filename: 'src/main.rs',
        content: `//! Rust no_std firmware for ESP32-S3\n#![no_std]\n#![no_main]\n\nuse esp_backtrace as _;\nuse esp_hal::{\n    clock::ClockControl,\n    peripherals::Peripherals,\n    prelude::*,\n    delay::Delay,\n};\n\n#[entry]\nfn main() -> ! {\n    let peripherals = Peripherals::take();\n    let system = peripherals.SYSTEM.split();\n    let clocks = ClockControl::boot_defaults(system.clock_control).freeze();\n    let delay = Delay::new(&clocks);\n\n    loop {\n        delay.delay_ms(1000u32);\n    }\n}\n`,
      },
    },
    {
      id: 'quickjs-esp32',
      name: 'quickjs-esp32',
      displayName: 'QuickJS & Moddable Embedded JavaScript',
      publisher: 'Moddable Open Source',
      version: 'v2.1.0',
      description: 'Write modern ECMAScript/JavaScript directly for ESP32-S3 with XS runtime and GPIO bindings.',
      icon: '🟨',
      downloads: '64k',
      rating: 4.7,
      category: 'Embedded Runtime',
      fileExtensions: ['.js', '.mjs'],
      installed: false,
      enabled: false,
      features: ['ES2020 JavaScript Syntax', 'Digital & PWM Pin Objects', 'Asynchronous Timers', 'Embedded JSON Web APIs'],
      sampleTemplate: {
        filename: 'main.js',
        content: `// QuickJS Embedded Runtime for ESP32-S3\nimport Digital from "embedded:io/digital";\n\nconst statusLed = new Digital({\n  pin: 48,\n  mode: Digital.Output\n});\n\nconsole.log("QuickJS Embedded Initialized on ESP32-S3");\n\nlet state = 0;\nsetInterval(() => {\n  state = state === 0 ? 1 : 0;\n  statusLed.write(state);\n  console.log(\`[QuickJS] LED state: \${state}\`);\n}, 1000);\n`,
      },
    },
    {
      id: 'pio-ini-support',
      name: 'pio-ini-support',
      displayName: 'PlatformIO & INI Configuration Pack',
      publisher: 'PlatformIO',
      version: 'v3.0.1',
      description: 'Language grammar and property validation for platformio.ini and embedded configuration files.',
      icon: '⚙️',
      downloads: '520k',
      rating: 4.9,
      category: 'Formatter',
      fileExtensions: ['.ini', '.cfg'],
      installed: true,
      enabled: true,
      features: ['INI Section Syntax Highlighting', 'Board Build Flag Validation', 'Partition Table Offset Validator'],
    },
    {
      id: 'json-schema',
      name: 'json-schema',
      displayName: 'JSON & Partition Table Schema Formatter',
      publisher: 'ESP Studio Core',
      version: 'v1.2.0',
      description: 'JSON schema validation for ESP32 partition tables, flash manifests, and build configuration.',
      icon: '📋',
      downloads: '290k',
      rating: 4.8,
      category: 'Formatter',
      fileExtensions: ['.json'],
      installed: true,
      enabled: true,
      features: ['JSON Syntax & Formatting', 'ESP32 Partition Scheme Validation', 'Flash Manifest Verification'],
    },
    {
      id: 'markdown-docs',
      name: 'markdown-docs',
      displayName: 'Markdown Live Documentation & Notes',
      publisher: 'Docs Team',
      version: 'v2.0.4',
      description: 'Edit firmware release notes, circuit wiring diagrams, and project documentation in rich Markdown.',
      icon: '📝',
      downloads: '180k',
      rating: 4.7,
      category: 'Language',
      fileExtensions: ['.md'],
      installed: false,
      enabled: false,
      features: ['Markdown Heading & Link Syntax', 'Embedded Code Block Previews', 'Wiring Pinout Table Support'],
      sampleTemplate: {
        filename: 'README.md',
        content: `# ESP32-S3 Firmware Project\n\n## Hardware Pinout\n- **GPIO 48**: WS2812 Status LED\n- **GPIO 8**: I2C SDA\n- **GPIO 9**: I2C SCL\n- **GPIO 1**: Pressure Sensor ADC\n\n## Quick Start\n1. Connect ESP32-S3 via USB-C (COM4)\n2. Click **Build** to compile with PlatformIO\n3. Click **Flash USB** to upload via esptool-js\n`,
      },
    },
    {
      id: 'xtensa-asm',
      name: 'xtensa-asm',
      displayName: 'Xtensa LX7 Assembly & Hardware Disassembly',
      publisher: 'Espressif Systems',
      version: 'v1.1.0',
      description: 'Xtensa dual-core instruction set architecture assembly syntax highlighting, registers, and opcode hints.',
      icon: '🔬',
      downloads: '45k',
      rating: 4.6,
      category: 'Debugging',
      fileExtensions: ['.S', '.asm'],
      installed: false,
      enabled: false,
      features: ['Xtensa LX7 Opcode Highlighting', 'Special Register (SAR, EPC) Hints', 'Bootloader Assembly Tracing'],
    },
  ],
  extensionSearchQuery: '',
  selectedExtensionId: null,
  
  syncStatus: 'SYNCED',
  isSyncModalOpen: false,
  lastSyncedAt: new Date().toLocaleTimeString(),
  revisionCount: 1,
  
  activeDevice: {
    deviceId: 'SPRAYER-001',
    chipFamily: 'ESP32-S3',
    chipRevision: 0,
    macAddress: '84:F7:03:1A:2B:3C',
    flashSizeBytes: 8 * 1024 * 1024,
    firmwareVersion: '1.0.5',
    assignedProjectId: 'proj-esp32s3-default',
    lastConnectedAt: new Date().toISOString(),
  },
  targetBoard: 'ESP32-S3-DevKitC-1',
  framework: 'arduino',
  
  isCommandPaletteOpen: false,
  paletteQuery: '>',
  sidebarView: 'explorer',
  dirtyFiles: [],
  bottomPanelTab: 'serial',
  searchQuery: '',
  zoomLevel: 100,
  splitFilePath: null,
  
  activeAiModel: 'gemini-1.5-flash',
  isAiPanelOpen: false,
  aiMessages: [
    {
      id: 'ai-msg-1',
      sender: 'assistant',
      model: 'Gemini 1.5 Flash',
      text: 'Hello! I am your ESP32 Embedded Copilot. I can inspect your code for memory leaks, optimize FreeRTOS tasks, generate WiFi/BLE configurations, or fix compiler diagnostics. What would you like to build?',
      timestamp: '12:00 PM',
    },
  ],
  codeDiagnostics: [
    { line: 29, message: 'Line 29: Consider verifying free heap before allocating memory in telemetry loop', severity: 'warning' },
  ],
};

globalState = { ...globalState, ...loadUiState(initialProject) };

const listeners = new Set<(s: WorkspaceState) => void>();
let lastSavedUi = '';

function saveToLocalStorage(project: Project) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch {
      // Storage quota safety
    }
  }
}

function emit() {
  globalState = { ...globalState };
  const ui = JSON.stringify(pickUiState(globalState));
  if (ui !== lastSavedUi) {
    lastSavedUi = ui;
    try {
      window.localStorage.setItem(UI_STORAGE_KEY, ui);
    } catch {
      // Storage quota safety
    }
  }
  listeners.forEach((l) => l(globalState));
}

export const buildProvider = new SimulatedBuildProvider();
export const serialProvider = new MockSerialProvider();
export const flashProvider = new SimulatedFlashProvider();
export const syncEngine = new SyncEngine();

buildProvider.onLog((line) => {
  globalState.buildLogs = [...globalState.buildLogs.slice(-1200), line];
  emit();
});

serialProvider.onData((chunk) => {
  globalState.serialLogs = [...globalState.serialLogs.slice(-1500), chunk];

  const heapMatch = chunk.match(/Free Heap:\s*(\d+)/i);
  const pressureMatch = chunk.match(/Tank Pressure:\s*([0-9.]+)/i);

  if (heapMatch || pressureMatch) {
    const point: TelemetryPoint = {
      time: new Date().toLocaleTimeString().split(' ')[0],
      Heap: heapMatch ? Math.round(Number(heapMatch[1]) / 1000) : 280,
      Pressure: pressureMatch ? Number(pressureMatch[1]) : 2.5,
    };
    globalState.telemetryData = [...globalState.telemetryData.slice(-50), point];
  }

  emit();
});

flashProvider.onProgress((p) => {
  globalState.flashProgress = p;
  emit();
});

export function useWorkspaceStore(): [WorkspaceState, {
  setActiveFilePath: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  createFile: (path: string, initialContent?: string) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;
  openTab: (path: string) => void;
  closeTab: (path: string) => void;
  setActiveNavTab: (tab: NavTab) => void;
  setBuildEngineMode: (mode: BuildEngineMode) => void;
  setTargetBoard: (board: string) => void;
  setFramework: (framework: 'arduino' | 'espidf') => void;
  setTheme: (theme: ThemeName) => void;
  setEditorSettings: (settings: Partial<EditorCustomization>) => void;
  resetEditorSettings: () => void;
  setAuthModalOpen: (open: boolean) => void;
  setTourOpen: (open: boolean) => void;
  triggerBuild: () => Promise<void>;
  triggerFlash: () => Promise<void>;
  toggleSerialConnection: () => Promise<void>;
  sendSerialCommand: (cmd: string) => Promise<void>;
  clearSerialLogs: () => void;
  toggleAutoScroll: () => void;
  toggleTimestamps: () => void;
  toggleLibrary: (name: string) => void;
  triggerSync: () => Promise<void>;
  setSyncModalOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean, initialQuery?: string) => void;
  setSidebarView: (view: string) => void;
  saveFile: (path?: string) => void;
  saveAllFiles: () => void;
  closeOtherTabs: (path: string) => void;
  closeAllTabs: () => void;
  moveTab: (from: string, to: string) => void;
  setBottomPanelTab: (tab: WorkspaceState['bottomPanelTab']) => void;
  setBaudRate: (baud: number) => void;
  formatCurrentCode: () => void;
  resetProjectToTemplate: (template: 'arduino' | 'espidf') => void;
  loadTemplateProject: (templateName: string, files: Record<string, string>) => void;
  commitChanges: (message: string) => void;
  toggleStageFile: (filePath: string) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setZoomLevel: (zoom: number) => void;
  setAiModel: (model: AiModelId) => void;
  toggleAiPanel: () => void;
  sendAiMessage: (prompt: string) => Promise<void>;
  applyAiCode: (code: string) => void;
  installExtension: (id: string, createSample?: boolean) => void;
  uninstallExtension: (id: string) => void;
  toggleExtension: (id: string) => void;
  setExtensionSearchQuery: (query: string) => void;
  setSelectedExtensionId: (id: string | null) => void;
  loginUser: (email: string, name?: string, plan?: UserAccount['plan']) => void;
  logoutUser: () => void;
  exportProjectZip: () => void;
  setSplitFilePath: (path: string | null) => void;
  toggleSplitEditor: () => void;
}] {
  const [, setTick] = useState(0);

  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  // Opening a file from anywhere (search, problems, palette) must bring the editor back
  // if a full-page view (settings, pinout, ...) is covering it.
  const showEditor = () => {
    if (globalState.activeNavTab !== 'explorer') globalState.activeNavTab = 'explorer';
  };

  const actions = {
    setActiveFilePath: (path: string) => {
      globalState.activeFilePath = path;
      if (!globalState.openTabs.includes(path)) {
        globalState.openTabs = [...globalState.openTabs, path];
      }
      showEditor();
      emit();
    },

    updateFileContent: (path: string, content: string) => {
      if (globalState.project.files[path]) {
        globalState.project.files[path].content = content;
        globalState.project.files[path].lastModified = Date.now();
        if (!globalState.dirtyFiles.includes(path)) globalState.dirtyFiles = [...globalState.dirtyFiles, path];
        globalState.syncStatus = 'PENDING';
        saveToLocalStorage(globalState.project);
        emit();
      }
    },

    createFile: (path: string, initialContent: string = '') => {
      const normalized = path.replace(/\\/g, '/').trim();
      if (!normalized) return;
      if (globalState.project.files[normalized]) {
        // Never clobber an existing file; just open it
        actions.setActiveFilePath(normalized);
        return;
      }
      showEditor();
      globalState.project.files[normalized] = {
        path: normalized,
        content: initialContent,
        lastModified: Date.now(),
      };
      if (!globalState.openTabs.includes(normalized)) {
        globalState.openTabs = [...globalState.openTabs, normalized];
      }
      globalState.activeFilePath = normalized;
      globalState.syncStatus = 'PENDING';
      saveToLocalStorage(globalState.project);
      emit();
    },

    deleteFile: (path: string) => {
      delete globalState.project.files[path];
      actions.closeTab(path);
      globalState.syncStatus = 'PENDING';
      saveToLocalStorage(globalState.project);
      emit();
    },

    renameFile: (oldPath: string, newPath: string) => {
      const file = globalState.project.files[oldPath];
      // Refuse to rename onto an existing file (would silently destroy it)
      if (file && newPath && oldPath !== newPath && !globalState.project.files[newPath]) {
        delete globalState.project.files[oldPath];
        globalState.project.files[newPath] = {
          ...file,
          path: newPath,
          lastModified: Date.now(),
        };
        globalState.openTabs = globalState.openTabs.map((t) => (t === oldPath ? newPath : t));
        if (globalState.activeFilePath === oldPath) {
          globalState.activeFilePath = newPath;
        }
        if (globalState.splitFilePath === oldPath) globalState.splitFilePath = newPath;
        globalState.dirtyFiles = globalState.dirtyFiles.map((t) => (t === oldPath ? newPath : t));
        globalState.syncStatus = 'PENDING';
        saveToLocalStorage(globalState.project);
        emit();
      }
    },

    openTab: (path: string) => {
      if (!globalState.project.files[path]) return; // no phantom tabs for missing files
      actions.setActiveFilePath(path);
    },

    closeTab: (path: string) => {
      const idx = globalState.openTabs.indexOf(path);
      globalState.openTabs = globalState.openTabs.filter((t) => t !== path);
      if (globalState.activeFilePath === path) {
        // Like VS Code: focus the neighbour, not the first tab
        globalState.activeFilePath = globalState.openTabs[idx] || globalState.openTabs[idx - 1] || '';
      }
      if (globalState.splitFilePath === path) globalState.splitFilePath = null;
      globalState.dirtyFiles = globalState.dirtyFiles.filter((t) => t !== path);
      emit();
    },

    closeOtherTabs: (path: string) => {
      globalState.openTabs = globalState.openTabs.filter((t) => t === path);
      globalState.activeFilePath = path;
      if (globalState.splitFilePath !== path) globalState.splitFilePath = null;
      globalState.dirtyFiles = globalState.dirtyFiles.filter((t) => t === path);
      emit();
    },

    closeAllTabs: () => {
      globalState.openTabs = [];
      globalState.activeFilePath = '';
      globalState.splitFilePath = null;
      globalState.dirtyFiles = [];
      emit();
    },

    moveTab: (from: string, to: string) => {
      const toIdx = globalState.openTabs.indexOf(to);
      if (from === to || toIdx < 0) return;
      const tabs = globalState.openTabs.filter((t) => t !== from);
      tabs.splice(toIdx, 0, from);
      globalState.openTabs = tabs;
      emit();
    },

    saveFile: (path: string = globalState.activeFilePath) => {
      globalState.dirtyFiles = globalState.dirtyFiles.filter((t) => t !== path);
      saveToLocalStorage(globalState.project);
      emit();
    },

    saveAllFiles: () => {
      globalState.dirtyFiles = [];
      saveToLocalStorage(globalState.project);
      emit();
    },

    setSidebarView: (view: string) => {
      globalState.sidebarView = view;
      emit();
    },

    setActiveNavTab: (tab: NavTab) => {
      globalState.activeNavTab = tab;
      emit();
    },

    setBuildEngineMode: (mode: BuildEngineMode) => {
      globalState.buildEngineMode = mode;
      emit();
    },

    setTargetBoard: (board: string) => {
      globalState.targetBoard = board;
      globalState.project.metadata.boardTarget = board.toLowerCase();
      saveToLocalStorage(globalState.project);
      emit();
    },

    setFramework: (framework: 'arduino' | 'espidf') => {
      globalState.framework = framework;
      globalState.project.metadata.framework = framework;
      saveToLocalStorage(globalState.project);
      emit();
    },

    setTheme: (theme: ThemeName) => {
      globalState.theme = theme;
      emit();
    },

    setEditorSettings: (settings: Partial<EditorCustomization>) => {
      globalState.editorSettings = { ...globalState.editorSettings, ...settings };
      emit();
    },

    resetEditorSettings: () => {
      globalState.editorSettings = { ...DEFAULT_EDITOR_SETTINGS };
      emit();
    },

    setAuthModalOpen: (open: boolean) => {
      globalState.isAuthModalOpen = open;
      emit();
    },

    setTourOpen: (open: boolean) => {
      globalState.isTourOpen = open;
      emit();
    },

    triggerBuild: async () => {
      if (globalState.isBuilding) return;
      globalState.isBuilding = true;
      globalState.buildStatus = 'COMPILING';
      globalState.buildLogs = [];
      globalState.diagnostics = [];
      globalState.bottomPanelTab = 'build';
      emit();

      const startTime = Date.now();
      try {
        const result: BuildResult = await buildProvider.build(globalState.project);
        globalState.buildStatus = result.status;
        globalState.buildDurationMs = Date.now() - startTime;
        if (result.artifact) {
          globalState.lastArtifact = result.artifact;
        }
      } catch {
        globalState.buildStatus = 'FAILED';
      } finally {
        globalState.isBuilding = false;
        emit();
      }
    },

    triggerFlash: async () => {
      if (globalState.isFlashing) return;
      if (!globalState.lastArtifact) {
        await actions.triggerBuild();
      }
      if (!globalState.lastArtifact) return;

      globalState.isFlashing = true;
      globalState.bottomPanelTab = 'serial';
      emit();

      try {
        await flashProvider.flash(globalState.lastArtifact);
        globalState.activeDevice.firmwareVersion = '1.0.6-release';
        if (!globalState.isSerialConnected) {
          await actions.toggleSerialConnection();
        }
      } finally {
        globalState.isFlashing = false;
        emit();
      }
    },

    toggleSerialConnection: async () => {
      if (globalState.isSerialConnected) {
        await serialProvider.disconnect();
        globalState.isSerialConnected = false;
      } else {
        await serialProvider.connect('COM4', { baudRate: globalState.serialBaudRate });
        globalState.isSerialConnected = true;
        globalState.bottomPanelTab = 'serial';
      }
      emit();
    },

    sendSerialCommand: async (cmd: string) => {
      if (!globalState.isSerialConnected) return;
      await serialProvider.write(cmd);
    },

    clearSerialLogs: () => {
      globalState.serialLogs = [];
      globalState.telemetryData = [];
      emit();
    },

    toggleAutoScroll: () => {
      globalState.autoScrollSerial = !globalState.autoScrollSerial;
      emit();
    },

    toggleTimestamps: () => {
      globalState.showTimestamps = !globalState.showTimestamps;
      emit();
    },

    toggleLibrary: (name: string) => {
      globalState.libraries = globalState.libraries.map((lib) => {
        if (lib.name === name) {
          const next = !lib.installed;
          return { ...lib, installed: next };
        }
        return lib;
      });
      globalState.syncStatus = 'PENDING';
      emit();
    },

    triggerSync: async () => {
      const res = await syncEngine.sync(globalState.project);
      globalState.syncStatus = res.status;
      globalState.lastSyncedAt = new Date().toLocaleTimeString();
      globalState.revisionCount += 1;
      emit();
    },

    setSyncModalOpen: (open: boolean) => {
      globalState.isSyncModalOpen = open;
      emit();
    },

    setCommandPaletteOpen: (open: boolean, initialQuery: string = '>') => {
      globalState.isCommandPaletteOpen = open;
      globalState.paletteQuery = initialQuery;
      emit();
    },

    setBottomPanelTab: (tab: WorkspaceState['bottomPanelTab']) => {
      globalState.bottomPanelTab = tab;
      emit();
    },

    setBaudRate: (baud: number) => {
      globalState.serialBaudRate = baud;
      emit();
    },

    formatCurrentCode: () => {
      const file = globalState.project.files[globalState.activeFilePath];
      if (file && file.content) {
        // Prettier-like indentation & bracket normalization for embedded C/C++
        const lines = file.content.split('\n');
        let indentLevel = 0;
        const formattedLines = lines.map((line) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('}') || trimmed.startsWith(');')) {
            indentLevel = Math.max(0, indentLevel - 1);
          }
          const indentStr = '  '.repeat(indentLevel);
          const result = trimmed.length > 0 ? `${indentStr}${trimmed}` : '';
          if (trimmed.endsWith('{') || (trimmed.endsWith('(') && !trimmed.startsWith('//'))) {
            indentLevel++;
          }
          return result;
        });

        actions.updateFileContent(globalState.activeFilePath, formattedLines.join('\n'));
      }
    },

    resetProjectToTemplate: (template: 'arduino' | 'espidf') => {
      if (template === 'arduino') {
        globalState.project = ESP32S3_ARDUINO_TEMPLATE('proj-esp32s3-default', 'esp32s3-sprayer-controller');
        globalState.framework = 'arduino';
      }
      globalState.openTabs = Object.keys(globalState.project.files);
      globalState.activeFilePath = globalState.openTabs[0] || '';
      globalState.splitFilePath = null;
      globalState.dirtyFiles = [];
      globalState.syncStatus = 'SYNCED';
      saveToLocalStorage(globalState.project);
      emit();
    },

    loadTemplateProject: (templateName: string, files: Record<string, string>) => {
      globalState.project.metadata.name = templateName;
      globalState.project.metadata.updatedAt = new Date().toISOString();
      globalState.project.files = {};
      Object.entries(files).forEach(([path, content]) => {
        globalState.project.files[path] = {
          path,
          content,
          lastModified: Date.now(),
        };
      });
      globalState.openTabs = Object.keys(files);
      globalState.activeFilePath = globalState.openTabs[0] || '';
      globalState.splitFilePath = null;
      globalState.dirtyFiles = [];
      globalState.syncStatus = 'PENDING';
      saveToLocalStorage(globalState.project);
      emit();
    },

    commitChanges: (message: string) => {
      if (!message.trim()) return;
      const newHash = Math.random().toString(16).substring(2, 9);
      const commit: GitCommitNode = {
        hash: newHash,
        message,
        author: globalState.user.name,
        date: 'Just now',
        branch: globalState.currentBranch,
        filesChanged: Math.max(1, globalState.stagedFiles.length),
      };
      globalState.gitCommits = [commit, ...globalState.gitCommits];
      globalState.stagedFiles = [];
      globalState.syncStatus = 'SYNCED';
      emit();
    },

    toggleStageFile: (filePath: string) => {
      if (globalState.stagedFiles.includes(filePath)) {
        globalState.stagedFiles = globalState.stagedFiles.filter((f) => f !== filePath);
      } else {
        globalState.stagedFiles = [...globalState.stagedFiles, filePath];
      }
      emit();
    },

    zoomIn: () => {
      globalState.zoomLevel = Math.min(160, globalState.zoomLevel + 10);
      emit();
    },

    zoomOut: () => {
      globalState.zoomLevel = Math.max(70, globalState.zoomLevel - 10);
      emit();
    },

    resetZoom: () => {
      globalState.zoomLevel = 100;
      emit();
    },

    setZoomLevel: (zoom: number) => {
      globalState.zoomLevel = zoom;
      emit();
    },

    setAiModel: (model: AiModelId) => {
      globalState.activeAiModel = model;
      emit();
    },

    toggleAiPanel: () => {
      globalState.isAiPanelOpen = !globalState.isAiPanelOpen;
      emit();
    },

    sendAiMessage: async (prompt: string) => {
      if (!prompt.trim()) return;
      const userMsg: AiMessage = {
        id: `usr-${Date.now()}`,
        sender: 'user',
        model: globalState.activeAiModel,
        text: prompt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      globalState.aiMessages = [...globalState.aiMessages, userMsg];
      emit();

      // Intelligent simulated AI response tailored to model and prompt
      await new Promise((r) => setTimeout(r, 600));

      let replyText = '';
      let codeSnippet: string | undefined = undefined;

      const modelName = {
        'gemini-1.5-pro': 'Gemini 1.5 Pro (DeepMind)',
        'gemini-1.5-flash': 'Gemini 1.5 Flash',
        'claude-3.5-sonnet': 'Claude 3.5 Sonnet (Anthropic)',
        'gpt-4o': 'GPT-4o (OpenAI)',
        'deepseek-coder': 'DeepSeek Coder V2',
      }[globalState.activeAiModel];

      const lower = prompt.toLowerCase();
      if (lower.includes('freertos') || lower.includes('task')) {
        replyText = `Here is a production-grade FreeRTOS dual-core task implementation with FreeRTOS tick delay and stack protection for the ESP32-S3:`;
        codeSnippet = `// FreeRTOS Task pinned to Core 0 for ESP32-S3
void vSensorTask(void *pvParameters) {
  TickType_t xLastWakeTime = xTaskGetTickCount();
  const TickType_t xFrequency = pdMS_TO_TICKS(100);

  for (;;) {
    uint32_t freeHeap = esp_get_free_heap_size();
    if (freeHeap < 20000) {
      log_e("Critical Heap Warning: %lu bytes", freeHeap);
    }
    vTaskDelayUntil(&xLastWakeTime, xFrequency);
  }
}

// In setup():
// xTaskCreatePinnedToCore(vSensorTask, "SensorTask", 4096, NULL, 2, NULL, 0);`;
      } else if (lower.includes('wifi') || lower.includes('network')) {
        replyText = `Here is a robust auto-reconnecting WiFi handler using ESP32 event loops:`;
        codeSnippet = `#include <WiFi.h>

void WiFiStationConnected(WiFiEvent_t event, WiFiEventInfo_t info) {
  Serial.println("[WiFi] Connected to AP successfully!");
}

void WiFiGotIP(WiFiEvent_t event, WiFiEventInfo_t info) {
  Serial.print("[WiFi] IP Address: ");
  Serial.println(WiFi.localIP());
}

void WiFiStationDisconnected(WiFiEvent_t event, WiFiEventInfo_t info) {
  Serial.println("[WiFi] Lost connection, attempting reconnect...");
  WiFi.reconnect();
}

void initWiFi() {
  WiFi.onEvent(WiFiStationConnected, WiFiEvent_t::ARDUINO_EVENT_WIFI_STA_CONNECTED);
  WiFi.onEvent(WiFiGotIP, WiFiEvent_t::ARDUINO_EVENT_WIFI_STA_GOT_IP);
  WiFi.onEvent(WiFiStationDisconnected, WiFiEvent_t::ARDUINO_EVENT_WIFI_STA_DISCONNECTED);
  WiFi.begin("IoT-Network", "Password123");
}`;
      } else if (lower.includes('bug') || lower.includes('error') || lower.includes('diagnostic')) {
        replyText = `I reviewed your ESP32-S3 firmware. Here are potential stability improvements:
1. Ensure Serial.begin(115200) has delay(1000) for USB CDC enumeration.
2. WS2812 status pin 48 draws significant current; isolate high-load pulses from ADC readings on GPIO 1-8.
3. Protect NVS writes inside esp_studio namespace with commit validation.`;
      } else {
        replyText = `I analyzed your project "${globalState.project.metadata.name}" targeting ${globalState.targetBoard}. All peripheral registers, NVS partition offsets, and PlatformIO toolchain flags match Xtensa LX7 dual-core specifications.`;
      }

      const botMsg: AiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        model: modelName,
        text: replyText,
        suggestedCode: codeSnippet,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      globalState.aiMessages = [...globalState.aiMessages, botMsg];
      emit();
    },

    applyAiCode: (code: string) => {
      const activePath = globalState.activeFilePath;
      const current = globalState.project.files[activePath]?.content || '';
      actions.updateFileContent(activePath, current + '\n\n' + code);
    },

    installExtension: (id: string, createSample: boolean = false) => {
      const ext = globalState.extensions.find((e) => e.id === id);
      if (ext) {
        ext.installed = true;
        ext.enabled = true;
        if (createSample && ext.sampleTemplate && !globalState.project.files[ext.sampleTemplate.filename]) {
          globalState.project.files[ext.sampleTemplate.filename] = {
            path: ext.sampleTemplate.filename,
            content: ext.sampleTemplate.content,
          };
          if (!globalState.openTabs.includes(ext.sampleTemplate.filename)) {
            globalState.openTabs.push(ext.sampleTemplate.filename);
          }
          globalState.activeFilePath = ext.sampleTemplate.filename;
        }
        emit();
        saveToLocalStorage(globalState.project);
      }
    },

    uninstallExtension: (id: string) => {
      const ext = globalState.extensions.find((e) => e.id === id);
      if (ext) {
        ext.installed = false;
        ext.enabled = false;
        emit();
      }
    },

    toggleExtension: (id: string) => {
      const ext = globalState.extensions.find((e) => e.id === id);
      if (ext) {
        ext.enabled = !ext.enabled;
        emit();
      }
    },

    setExtensionSearchQuery: (query: string) => {
      globalState.extensionSearchQuery = query;
      emit();
    },

    setSelectedExtensionId: (id: string | null) => {
      globalState.selectedExtensionId = id;
      emit();
    },

    loginUser: (email: string, name?: string, plan?: UserAccount['plan']) => {
      globalState.isLoggedIn = true;
      globalState.user = {
        ...globalState.user,
        email,
        name: name || email.split('@')[0],
        plan: plan || 'Developer Pro',
      };
      globalState.isAuthModalOpen = false;
      emit();
    },

    logoutUser: () => {
      globalState.isLoggedIn = false;
      globalState.user = {
        ...globalState.user,
        id: 'usr_guest',
        name: 'Guest Developer',
        email: 'guest@esp-studio.local',
        plan: 'Hobbyist Free',
      };
      globalState.buildEngineMode = 'local';
      globalState.isAuthModalOpen = false;
      emit();
    },

    exportProjectZip: () => {
      downloadProjectAsZip(globalState.project);
    },

    setSplitFilePath: (path: string | null) => {
      globalState.splitFilePath = path;
      emit();
    },

    toggleSplitEditor: () => {
      if (globalState.splitFilePath) {
        globalState.splitFilePath = null;
      } else {
        const otherTab = globalState.openTabs.find((t) => t !== globalState.activeFilePath) || Object.keys(globalState.project.files)[1] || 'platformio.ini';
        globalState.splitFilePath = otherTab;
      }
      emit();
    },
  };

  return [globalState, actions];
}
