import { useState, useEffect } from 'react';
import { Project, BuildResult, FirmwareArtifact, DeviceProfile, BuildStatus, CompilerDiagnostic } from '@esp-studio/shared-types';
import { ESP32S3_ARDUINO_TEMPLATE } from '@esp-studio/project-core';
import { SimulatedBuildProvider } from '@esp-studio/build-core';
import { MockSerialProvider } from '@esp-studio/serial-core';
import { SimulatedFlashProvider, FlashProgress } from '@esp-studio/flash-core';
import { SyncEngine } from '@esp-studio/sync-core';
import { downloadProjectAsZip } from '../utils/zipExport';
import { EditorCustomization, DEFAULT_EDITOR_SETTINGS, normalizeSettings } from '../settingsSchema';
import { ExtensionItem, createExtensions, availableThemes } from '../extensionsCatalog';
import { formatDocumentIn } from '../editorBridge';
import { defaultExtension, NEW_FILE_TEMPLATES } from '../languages';

export type { EditorCustomization, ExtensionItem };
export { DEFAULT_EDITOR_SETTINGS };

/** A VS Code-style quick pick shown in the command palette (language mode, theme, ...). */
export interface QuickPickItem {
  id: string;
  label: string;
  detail?: string;
  current?: boolean;
}
export interface QuickPick {
  placeholder: string;
  items: QuickPickItem[];
  onPick: (id: string) => void;
}

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

// Built-in ids plus whatever theme extensions contribute (see extensionsCatalog.ts)
export type ThemeName = string;

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
  languageOverrides: Record<string, string>; // per-file language picked via "Change Language Mode"
  zenMode: boolean;
  isFullScreen: boolean;
  quickPick: QuickPick | null;
  settingsSection: string; // which Settings category to show when opened
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
    languageOverrides: s.languageOverrides,
    extensions: Object.fromEntries(s.extensions.map((e) => [e.id, { installed: e.installed, enabled: e.enabled }])),
  };
}

function loadUiState(project: Project): Partial<WorkspaceState> {
  try {
    const ui = JSON.parse(window.localStorage.getItem(UI_STORAGE_KEY) || '{}');
    if (!ui || typeof ui !== 'object') return {};
    const out: Partial<WorkspaceState> = {};
    out.extensions = createExtensions(ui.extensions && typeof ui.extensions === 'object' ? ui.extensions : undefined);
    if (typeof ui.theme === 'string' && availableThemes(out.extensions).includes(ui.theme)) out.theme = ui.theme;
    if (ui.editorSettings && typeof ui.editorSettings === 'object') {
      out.editorSettings = normalizeSettings(ui.editorSettings);
    }
    if (ui.languageOverrides && typeof ui.languageOverrides === 'object') {
      out.languageOverrides = Object.fromEntries(
        Object.entries(ui.languageOverrides).filter(([p, l]) => typeof l === 'string' && project.files[p])
      ) as Record<string, string>;
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
  
  extensions: createExtensions(),
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
  languageOverrides: {},
  zenMode: false,
  isFullScreen: false,
  quickPick: null,
  settingsSection: 'commonly-used',
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

// Content as of the last Save, per file. A file is dirty when it differs from this, so undoing
// back to the saved text clears the dot, and Revert File restores it.
const savedContent = new Map<string, string>(
  Object.entries(initialProject.files).map(([p, f]) => [p, f.content])
);
const autoSaveTimers = new Map<string, ReturnType<typeof setTimeout>>();

function resetSavedContent(project: Project) {
  savedContent.clear();
  Object.entries(project.files).forEach(([p, f]) => savedContent.set(p, f.content));
}

/** Transforms applied on save, per files.* settings. */
function applySaveTransforms(content: string, s: EditorCustomization): string {
  let out = content;
  if (s.trimTrailingWhitespace) out = out.replace(/[ \t]+$/gm, '');
  if (s.insertFinalNewline && out.length > 0 && !out.endsWith('\n')) out += '\n';
  return out;
}

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
  revertFile: (path?: string) => void;
  newUntitledFile: (language?: string) => void;
  importFiles: (files: Record<string, string>, workspaceName?: string) => void;
  setLanguageOverride: (path: string, language: string | null) => void;
  toggleZenMode: () => void;
  toggleFullScreen: () => void;
  setFullScreenState: (on: boolean) => void;
  showQuickPick: (pick: QuickPick | null) => void;
  openSettings: (section?: string) => void;
  cleanBuild: () => void;
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

  // Disabling a theme extension while its theme is active falls back to the default theme
  const dropUnavailableTheme = () => {
    if (!availableThemes(globalState.extensions).includes(globalState.theme)) globalState.theme = 'github-dark';
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
        const isDirty = savedContent.get(path) !== content;
        const listed = globalState.dirtyFiles.includes(path);
        if (isDirty && !listed) globalState.dirtyFiles = [...globalState.dirtyFiles, path];
        if (!isDirty && listed) globalState.dirtyFiles = globalState.dirtyFiles.filter((t) => t !== path);
        globalState.syncStatus = 'PENDING';
        // Content is always persisted (like VS Code hot exit); "saved" is tracked separately.
        saveToLocalStorage(globalState.project);
        emit();

        const s = globalState.editorSettings;
        clearTimeout(autoSaveTimers.get(path));
        if (s.autoSave === 'afterDelay' && isDirty) {
          autoSaveTimers.set(path, setTimeout(() => actions.saveFile(path), s.autoSaveDelay));
        }
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
      savedContent.set(normalized, initialContent);
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
        savedContent.set(newPath, savedContent.get(oldPath) ?? file.content);
        savedContent.delete(oldPath);
        if (globalState.languageOverrides[oldPath]) {
          const { [oldPath]: lang, ...rest } = globalState.languageOverrides;
          globalState.languageOverrides = { ...rest, [newPath]: lang };
        }
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
      // Content is already persisted, so closing keeps the edits; treat them as saved.
      const f = globalState.project.files[path];
      if (f) savedContent.set(path, f.content);
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

    saveFile: async (path: string = globalState.activeFilePath) => {
      const file = globalState.project.files[path];
      if (!file) return;
      clearTimeout(autoSaveTimers.get(path));
      const s = globalState.editorSettings;
      // Format through the live editor when the language has a formatter (JSON, JS/TS, HTML, CSS)
      if (s.formatOnSave) await formatDocumentIn(path);
      const transformed = applySaveTransforms(file.content, s);
      if (transformed !== file.content) actions.updateFileContent(path, transformed);
      savedContent.set(path, file.content);
      globalState.dirtyFiles = globalState.dirtyFiles.filter((t) => t !== path);
      saveToLocalStorage(globalState.project);
      emit();
    },

    saveAllFiles: () => {
      [...globalState.dirtyFiles].forEach((p) => void actions.saveFile(p));
    },

    revertFile: (path: string = globalState.activeFilePath) => {
      const saved = savedContent.get(path);
      if (saved === undefined || !globalState.project.files[path]) return;
      actions.updateFileContent(path, saved);
    },

    newUntitledFile: (language: string = globalState.editorSettings.defaultLanguage) => {
      const ext = defaultExtension(language);
      let n = 1;
      while (globalState.project.files[`Untitled-${n}${ext}`]) n++;
      actions.createFile(`Untitled-${n}${ext}`, NEW_FILE_TEMPLATES[language] ?? '');
    },

    importFiles: (files: Record<string, string>, workspaceName?: string) => {
      const paths = Object.keys(files);
      if (paths.length === 0) return;
      if (workspaceName) {
        actions.loadTemplateProject(workspaceName, files);
        return;
      }
      paths.forEach((p) => {
        globalState.project.files[p] = { path: p, content: files[p], lastModified: Date.now() };
        savedContent.set(p, files[p]);
      });
      globalState.syncStatus = 'PENDING';
      saveToLocalStorage(globalState.project);
      actions.setActiveFilePath(paths[0]);
    },

    setLanguageOverride: (path: string, language: string | null) => {
      const { [path]: _old, ...rest } = globalState.languageOverrides;
      globalState.languageOverrides = language ? { ...rest, [path]: language } : rest;
      emit();
    },

    toggleZenMode: () => {
      globalState.zenMode = !globalState.zenMode;
      emit();
    },

    toggleFullScreen: () => {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen?.();
    },

    setFullScreenState: (on: boolean) => {
      globalState.isFullScreen = on;
      emit();
    },

    showQuickPick: (pick: QuickPick | null) => {
      globalState.quickPick = pick;
      globalState.isCommandPaletteOpen = !!pick;
      globalState.paletteQuery = '';
      emit();
    },

    openSettings: (section: string = 'commonly-used') => {
      globalState.settingsSection = section;
      globalState.activeNavTab = 'settings';
      emit();
    },

    cleanBuild: () => {
      globalState.buildLogs = ['[CLEAN] Removed build outputs and cached artifacts.'];
      globalState.lastArtifact = null;
      globalState.buildStatus = 'IDLE';
      globalState.diagnostics = [];
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
      if (!availableThemes(globalState.extensions).includes(theme)) return;
      globalState.theme = theme;
      emit();
    },

    setEditorSettings: (settings: Partial<EditorCustomization>) => {
      globalState.editorSettings = { ...globalState.editorSettings, ...settings };
      if (settings.defaultBaudRate) globalState.serialBaudRate = settings.defaultBaudRate;
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
      globalState.quickPick = null;
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

    formatCurrentCode: async () => {
      // Real formatter first (JSON, JS/TS, HTML, CSS); the indenter below is a fallback for C-like code.
      if (await formatDocumentIn(globalState.activeFilePath)) return;
      const file = globalState.project.files[globalState.activeFilePath];
      if (!/\.(c|cc|cpp|h|hpp|ino|java|cs|js|ts|go|rs|kt|dart|php)$/i.test(globalState.activeFilePath)) return;
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
      globalState.languageOverrides = {};
      resetSavedContent(globalState.project);
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
      globalState.languageOverrides = {};
      resetSavedContent(globalState.project);
      globalState.syncStatus = 'PENDING';
      globalState.activeNavTab = 'explorer';
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
      if (!ext) return;
      globalState.extensions = globalState.extensions.map((e) => (e.id === id ? { ...e, installed: true, enabled: true } : e));
      emit();
      if (createSample && ext.sampleTemplate) {
        actions.createFile(ext.sampleTemplate.filename, ext.sampleTemplate.content);
      }
    },

    uninstallExtension: (id: string) => {
      globalState.extensions = globalState.extensions.map((e) => (e.id === id ? { ...e, installed: false, enabled: false } : e));
      dropUnavailableTheme();
      emit();
    },

    toggleExtension: (id: string) => {
      globalState.extensions = globalState.extensions.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e));
      dropUnavailableTheme();
      emit();
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
