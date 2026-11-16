import React, { useState, useMemo } from 'react';
import { useWorkspaceStore, ThemeName, DEFAULT_EDITOR_SETTINGS, EditorCustomization, AiModelId } from '../stores/useWorkspaceStore';
import { formatShortcut } from '../utils/platform';
import {
  Settings,
  Shield,
  Palette,
  Type,
  RotateCcw,
  Check,
  Search,
  Code2,
  Sliders,
  Cpu,
  Bot,
  Keyboard,
  X,
  Copy,
  CheckCircle2,
  Sparkles,
  FileCode,
} from 'lucide-react';

type SettingsTab = 'commonly-used' | 'text-editor' | 'workbench' | 'esp32' | 'copilot' | 'keybindings';

interface ShortcutItem {
  command: string;
  description: string;
  keys: string;
  category: string;
}

const SHORTCUT_LIST: ShortcutItem[] = [
  { command: 'workbench.action.openSettings', description: 'Open Settings (Preferences)', keys: 'Ctrl+,', category: 'Preferences' },
  { command: 'workbench.action.openGlobalKeybindings', description: 'Open Keyboard Shortcuts', keys: 'Ctrl+K Ctrl+S', category: 'Preferences' },
  { command: 'workbench.action.quickOpen', description: 'Go to File / Quick Search', keys: 'Ctrl+P', category: 'Navigation' },
  { command: 'workbench.action.showCommands', description: 'Show All Commands (Command Palette)', keys: 'Ctrl+Shift+P', category: 'Navigation' },
  { command: 'workbench.view.explorer', description: 'Show Explorer Sidebar', keys: 'Ctrl+Shift+E', category: 'View' },
  { command: 'workbench.view.search', description: 'Find & Replace in Files', keys: 'Ctrl+Shift+F', category: 'View' },
  { command: 'workbench.view.scm', description: 'Show Source Control (Git)', keys: 'Ctrl+Shift+G', category: 'View' },
  { command: 'workbench.view.extensions', description: 'Show Extensions Marketplace', keys: 'Ctrl+Shift+X', category: 'View' },
  { command: 'workbench.action.terminal.toggleTerminal', description: 'Toggle Serial / Terminal Panel', keys: 'Ctrl+`', category: 'Terminal' },
  { command: 'workbench.action.splitEditor', description: 'Split Editor Right', keys: 'Ctrl+\\', category: 'View' },
  { command: 'workbench.action.zoomIn', description: 'Zoom In UI', keys: 'Ctrl+=', category: 'Appearance' },
  { command: 'workbench.action.zoomOut', description: 'Zoom Out UI', keys: 'Ctrl+-', category: 'Appearance' },
  { command: 'workbench.action.resetZoom', description: 'Reset Zoom UI (100%)', keys: 'Ctrl+0', category: 'Appearance' },
  { command: 'editor.action.formatDocument', description: 'Format Code (Prettier Indentation)', keys: 'Shift+Alt+F', category: 'Editor' },
  { command: 'esp32.buildFirmware', description: 'Build / Compile Firmware (PlatformIO)', keys: 'Ctrl+B', category: 'ESP32 Toolchain' },
  { command: 'esp32.flashFirmware', description: 'Upload / Flash USB (esptool Web Flasher)', keys: 'Ctrl+U', category: 'ESP32 Toolchain' },
  { command: 'esp32.toggleSerial', description: 'Toggle Serial Monitor Connection', keys: 'F5', category: 'ESP32 Toolchain' },
  { command: 'esp32.otaDeploy', description: 'Open Wireless OTA Deployer', keys: 'Ctrl+Shift+O', category: 'ESP32 Toolchain' },
  { command: 'esp32.aiCopilot', description: 'Toggle Embedded AI Copilot Panel', keys: 'Ctrl+Shift+A', category: 'AI Copilot' },
];

export const SettingsView: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('commonly-used');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'ui' | 'json'>('ui');
  const [jsonText, setJsonText] = useState(() => JSON.stringify(state.editorSettings, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonSavedAlert, setJsonSavedAlert] = useState(false);
  const [shortcutFilter, setShortcutFilter] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  const themes: { id: ThemeName; name: string; previewBg: string; previewAccent: string }[] = [
    { id: 'github-dark', name: 'GitHub Dark (Default)', previewBg: '#0d1117', previewAccent: '#58a6ff' },
    { id: 'vscode-dark', name: 'VS Code Dark Plus', previewBg: '#1e1e1e', previewAccent: '#007acc' },
    { id: 'dracula', name: 'Dracula Matrix', previewBg: '#282a36', previewAccent: '#bd93f9' },
    { id: 'monokai', name: 'Monokai Pro', previewBg: '#2d2a2e', previewAccent: '#ffd866' },
    { id: 'cyberpunk', name: 'Cyberpunk Neon', previewBg: '#120422', previewAccent: '#00ffc8' },
    { id: 'nord', name: 'Nord Frost', previewBg: '#2e3440', previewAccent: '#88c0d0' },
    { id: 'one-dark-pro', name: 'One Dark Pro', previewBg: '#282c34', previewAccent: '#61afef' },
  ];

  const toolchainSpecs = [
    { name: 'PlatformIO Core', version: 'v6.1.15 (Pinned)', status: 'Active' },
    { name: 'Espressif32 Platform', version: 'v6.7.0', status: 'Active' },
    { name: 'Toolchain Xtensa-ESP32S3-ELF', version: 'gcc12_2_0-esp-2023r2', status: 'Active' },
    { name: 'Arduino-ESP32 Framework', version: 'v2.0.14', status: 'Active' },
    { name: 'ESP-IDF Framework', version: 'v5.1.2', status: 'Active' },
    { name: 'esptool-js Web Flasher', version: 'v0.4.3 (WebASM + SLIP)', status: 'Active' },
  ];

  const categories = [
    { id: 'commonly-used', label: 'Commonly Used', icon: Sparkles },
    { id: 'text-editor', label: 'Text Editor', icon: Type },
    { id: 'workbench', label: 'Workbench & Appearance', icon: Palette },
    { id: 'esp32', label: 'ESP32 & Hardware Toolchain', icon: Cpu },
    { id: 'copilot', label: 'AI Embedded Copilot', icon: Bot },
    { id: 'keybindings', label: 'Keyboard Shortcuts', icon: Keyboard },
  ];

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      actions.setEditorSettings(parsed);
      setJsonError(null);
      setJsonSavedAlert(true);
      setTimeout(() => setJsonSavedAlert(false), 2000);
    } catch (e: any) {
      setJsonError(e.message || 'Invalid JSON syntax');
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonText);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 1500);
  };

  const handleResetToDefaultJson = () => {
    const formatted = JSON.stringify(DEFAULT_EDITOR_SETTINGS, null, 2);
    setJsonText(formatted);
    actions.resetEditorSettings();
    setJsonError(null);
  };

  // Helper to check if a setting was modified
  const isModified = (key: keyof EditorCustomization) => {
    return state.editorSettings[key] !== DEFAULT_EDITOR_SETTINGS[key];
  };

  // Reset a specific key to its default
  const resetKey = (key: keyof EditorCustomization) => {
    actions.setEditorSettings({ [key]: DEFAULT_EDITOR_SETTINGS[key] });
  };

  // Filter shortcuts
  const filteredShortcuts = useMemo(() => {
    if (!shortcutFilter.trim()) return SHORTCUT_LIST;
    const q = shortcutFilter.toLowerCase();
    return SHORTCUT_LIST.filter(
      (s) =>
        s.command.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.keys.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }, [shortcutFilter]);

  // Search filter across all settings
  const searchMatches = (terms: string[]) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return terms.some((t) => t.toLowerCase().includes(q));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] text-xs font-mono select-none overflow-hidden">
      {/* 1. VS Code Settings Header Bar */}
      <div className="h-12 border-b border-[#30363d] px-4 flex items-center justify-between flex-shrink-0 bg-[#161b22]">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-[#58a6ff]" />
            <span className="font-bold text-white text-sm">Settings</span>
            <span className="text-[#8b949e] text-xs font-normal hidden sm:inline">Preferences & Options</span>
          </div>

          {/* Scope Badges */}
          <div className="hidden md:flex items-center space-x-1 pl-3 border-l border-[#30363d]">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30">
              User
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-[#8b949e] hover:text-white cursor-pointer">
              Workspace (esp32s3-sprayer)
            </span>
          </div>
        </div>

        {/* Mode Toggle (UI vs JSON) & Actions */}
        <div className="flex items-center space-x-2">
          {/* JSON vs GUI Toggle Button */}
          <button
            onClick={() => {
              if (viewMode === 'ui') {
                setJsonText(JSON.stringify(state.editorSettings, null, 2));
                setViewMode('json');
              } else {
                setViewMode('ui');
              }
            }}
            title={viewMode === 'ui' ? 'Open Settings (JSON)' : 'Open Settings (Visual UI)'}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors border ${
              viewMode === 'json'
                ? 'bg-[#1f6feb] text-white border-blue-500 shadow-sm'
                : 'bg-[#21262d] text-[#c9d1d9] border-[#30363d] hover:bg-[#30363d] hover:text-white'
            }`}
          >
            {viewMode === 'ui' ? (
              <>
                <Code2 className="w-3.5 h-3.5 text-[#58a6ff]" />
                <span className="hidden sm:inline">Open Settings (JSON)</span>
                <span className="sm:hidden">{`{ }`}</span>
              </>
            ) : (
              <>
                <Sliders className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Open Settings (UI)</span>
                <span className="sm:hidden">UI</span>
              </>
            )}
          </button>

          {/* Reset All Settings Button */}
          <button
            onClick={() => {
              if (confirm('Reset all IDE and toolchain settings to factory defaults?')) {
                actions.resetEditorSettings();
                setJsonText(JSON.stringify(DEFAULT_EDITOR_SETTINGS, null, 2));
              }
            }}
            title="Reset All Preferences to Defaults"
            className="px-2 py-1 rounded-md text-xs bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-rose-400 border border-[#30363d] flex items-center space-x-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset All</span>
          </button>

          {/* Close Settings Button */}
          <button
            onClick={() => actions.setActiveNavTab('explorer')}
            title="Close Settings (Escape or Ctrl+W)"
            className="p-1 rounded-md text-[#8b949e] hover:text-white hover:bg-[#30363d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Search Settings Filter Pill Bar (VS Code Search Box) */}
      {viewMode === 'ui' && (
        <div className="px-4 py-2 bg-[#161b22]/70 border-b border-[#30363d] flex items-center space-x-2 flex-shrink-0">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings (e.g. font, wrap, cursor, baud, flash, gemini)..."
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] rounded-lg pl-9 pr-8 py-1.5 text-xs text-white placeholder-[#8b949e] outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <span className="text-[11px] text-[#58a6ff] bg-[#1f6feb]/15 px-2 py-1 rounded border border-[#1f6feb]/30 flex-shrink-0">
              Searching across all categories
            </span>
          )}
        </div>
      )}

      {/* 3. Main Body: Split Category Navigation Rail & Settings Area */}
      {viewMode === 'json' ? (
        /* RAW JSON SETTINGS EDITOR */
        <div className="flex-1 flex flex-col p-4 overflow-hidden bg-[#0d1117]">
          <div className="flex items-center justify-between pb-3 border-b border-[#30363d]">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-[#58a6ff]" />
              <span className="text-white font-bold text-xs">~/.esp-studio/settings.json</span>
              <span className="text-[10px] text-[#8b949e]">(Editable configuration JSON)</span>
            </div>

            <div className="flex items-center space-x-2">
              {jsonSavedAlert && (
                <span className="text-emerald-400 text-xs flex items-center space-x-1 animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Applied successfully!</span>
                </span>
              )}
              {jsonError && <span className="text-rose-400 text-xs truncate max-w-xs">{jsonError}</span>}
              <button
                onClick={handleCopyJson}
                className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] text-xs flex items-center space-x-1"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleResetToDefaultJson}
                className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white border border-[#30363d] text-xs flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Defaults</span>
              </button>
              <button
                onClick={handleApplyJson}
                className="px-3 py-1 rounded bg-[#1f6feb] hover:bg-blue-600 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Changes</span>
              </button>
            </div>
          </div>

          <div className="flex-1 pt-3 overflow-hidden flex flex-col">
            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setJsonError(null);
              }}
              spellCheck={false}
              className="flex-1 w-full bg-[#161b22] border border-[#30363d] focus:border-[#58a6ff] rounded-xl p-4 font-mono text-xs text-[#58a6ff] leading-relaxed outline-none resize-none selection:bg-[#1f6feb]/40 shadow-inner"
            />
          </div>
        </div>
      ) : (
        /* VISUAL GUI SETTINGS */
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation Category Rail */}
          <div className="w-56 border-r border-[#30363d] bg-[#161b22]/50 p-2 overflow-y-auto flex flex-col space-y-1 flex-shrink-0">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8b949e]">Categories</div>
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeTab === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id as SettingsTab)}
                  className={`w-full px-2.5 py-1.5 rounded-lg flex items-center space-x-2.5 text-xs text-left transition-colors ${
                    isSelected
                      ? 'bg-[#1f6feb]/20 text-[#58a6ff] font-semibold border border-[#1f6feb]/30 shadow-sm'
                      : 'text-[#8b949e] hover:bg-[#21262d] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}

            <div className="pt-4 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8b949e]">Toolchain Info</div>
            <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-[#8b949e]">Target Board</span>
                <span className="text-white font-semibold truncate max-w-[90px]">{state.targetBoard}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8b949e]">Framework</span>
                <span className="text-[#58a6ff] uppercase">{state.framework}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8b949e]">Compiler</span>
                <span className="text-emerald-400">GCC 12.2 (Xtensa)</span>
              </div>
            </div>
          </div>

          {/* Right Scrollable Setting Cards Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* KEYBOARD SHORTCUTS TAB */}
            {activeTab === 'keybindings' && !searchQuery ? (
              <div className="space-y-4 max-w-4xl">
                <div className="flex items-center justify-between pb-2 border-b border-[#30363d]">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Keyboard className="w-4 h-4 text-[#58a6ff]" />
                      <span>Keyboard Shortcuts</span>
                    </h3>
                    <p className="text-[#8b949e] text-[11px] mt-0.5">
                      Fast visual keybindings reference matching VS Code standard shortcuts.
                    </p>
                  </div>

                  <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={shortcutFilter}
                      onChange={(e) => setShortcutFilter(e.target.value)}
                      placeholder="Filter keybindings..."
                      className="w-full bg-[#161b22] border border-[#30363d] focus:border-[#58a6ff] rounded-md pl-8 pr-3 py-1 text-xs text-white placeholder-[#8b949e] outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-[#30363d] overflow-hidden bg-[#161b22]">
                  <table className="w-full text-left text-xs divide-y divide-[#30363d]">
                    <thead className="bg-[#21262d]/60 text-[#8b949e]">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Command</th>
                        <th className="px-4 py-2 font-semibold">Keybinding</th>
                        <th className="px-4 py-2 font-semibold hidden sm:table-cell">Category</th>
                        <th className="px-4 py-2 font-semibold">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#21262d]">
                      {filteredShortcuts.map((s) => (
                        <tr key={s.command} className="hover:bg-[#21262d]/40 transition-colors">
                          <td className="px-4 py-2">
                            <div className="text-white font-medium">{s.description}</div>
                            <div className="text-[10px] text-[#8b949e]">{s.command}</div>
                          </td>
                          <td className="px-4 py-2 font-mono">
                            <span className="px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-[#58a6ff] text-[11px] font-semibold shadow-sm inline-block">
                              {formatShortcut(s.keys)}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-[#8b949e] hidden sm:table-cell">{s.category}</td>
                          <td className="px-4 py-2">
                            <span className="px-1.5 py-0.2 rounded bg-[#0d1117] text-[#8b949e] text-[10px]">Default</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl">
                {/* 1. COMMONLY USED OR TEXT EDITOR: Font Size */}
                {(activeTab === 'commonly-used' || activeTab === 'text-editor' || searchMatches(['font', 'size', 'editor.fontSize'])) && (
                  <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white text-xs">Editor: Font Size</span>
                        <span className="ml-2 text-[10px] text-[#58a6ff] bg-[#1f6feb]/15 px-1.5 py-0.2 rounded border border-[#1f6feb]/30">
                          editor.fontSize
                        </span>
                      </div>
                      {isModified('fontSize') && (
                        <button
                          onClick={() => resetKey('fontSize')}
                          className="text-[10px] text-[#8b949e] hover:text-[#58a6ff] flex items-center space-x-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[#8b949e] text-[11px]">Controls the font size in pixels for the code editor.</p>
                    <div className="flex items-center space-x-2 pt-1">
                      {[12, 13, 14, 16, 18].map((size) => (
                        <button
                          key={size}
                          onClick={() => actions.setEditorSettings({ fontSize: size })}
                          className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                            state.editorSettings.fontSize === size
                              ? 'bg-[#1f6feb] text-white border-blue-600 shadow-sm'
                              : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:text-white'
                          }`}
                        >
                          {size}px
                        </button>
                      ))}
                      <input
                        type="number"
                        min="10"
                        max="26"
                        value={state.editorSettings.fontSize}
                        onChange={(e) => actions.setEditorSettings({ fontSize: parseInt(e.target.value, 10) || 13 })}
                        className="w-16 bg-[#0d1117] border border-[#30363d] px-2 py-1 rounded-lg text-white text-xs outline-none focus:border-[#58a6ff]"
                      />
                    </div>
                  </div>
                )}

                {/* 2. COMMONLY USED OR TEXT EDITOR: Tab Size */}
                {(activeTab === 'commonly-used' || activeTab === 'text-editor' || searchMatches(['tab', 'indent', 'spaces', 'editor.tabSize'])) && (
                  <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white text-xs">Editor: Tab Size</span>
                        <span className="ml-2 text-[10px] text-[#58a6ff] bg-[#1f6feb]/15 px-1.5 py-0.2 rounded border border-[#1f6feb]/30">
                          editor.tabSize
                        </span>
                      </div>
                      {isModified('tabSize') && (
                        <button
                          onClick={() => resetKey('tabSize')}
                          className="text-[10px] text-[#8b949e] hover:text-[#58a6ff] flex items-center space-x-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[#8b949e] text-[11px]">The number of spaces a tab is equal to for embedded C/C++ indentation.</p>
                    <div className="flex items-center space-x-2 pt-1">
                      {[2, 4, 8].map((spaces) => (
                        <button
                          key={spaces}
                          onClick={() => actions.setEditorSettings({ tabSize: spaces })}
                          className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                            state.editorSettings.tabSize === spaces
                              ? 'bg-[#1f6feb] text-white border-blue-600 shadow-sm'
                              : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:text-white'
                          }`}
                        >
                          {spaces} Spaces
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. COMMONLY USED OR TEXT EDITOR: Word Wrap */}
                {(activeTab === 'commonly-used' || activeTab === 'text-editor' || searchMatches(['wrap', 'word', 'line', 'editor.wordWrap'])) && (
                  <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-xs">Editor: Word Wrap</span>
                        <span className="text-[10px] text-[#58a6ff] bg-[#1f6feb]/15 px-1.5 py-0.2 rounded border border-[#1f6feb]/30">
                          editor.wordWrap
                        </span>
                      </div>
                      <p className="text-[#8b949e] text-[11px] mt-0.5">Controls whether lines should wrap around the viewport width or scroll horizontally.</p>
                    </div>

                    <button
                      onClick={() => actions.setEditorSettings({ wordWrap: !state.editorSettings.wordWrap })}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                        state.editorSettings.wordWrap
                          ? 'bg-[#1f6feb] text-white border-blue-600 shadow-sm'
                          : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                      }`}
                    >
                      <span>{state.editorSettings.wordWrap ? 'On' : 'Off'}</span>
                    </button>
                  </div>
                )}

                {/* 4. COMMONLY USED OR TEXT EDITOR: Format on Save */}
                {(activeTab === 'commonly-used' || activeTab === 'text-editor' || searchMatches(['format', 'save', 'prettier', 'editor.formatOnSave'])) && (
                  <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-xs">Editor: Format on Save</span>
                        <span className="text-[10px] text-[#58a6ff] bg-[#1f6feb]/15 px-1.5 py-0.2 rounded border border-[#1f6feb]/30">
                          editor.formatOnSave
                        </span>
                      </div>
                      <p className="text-[#8b949e] text-[11px] mt-0.5">Format a file on save automatically with embedded C/C++ style conventions.</p>
                    </div>

                    <button
                      onClick={() => actions.setEditorSettings({ formatOnSave: !state.editorSettings.formatOnSave })}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                        state.editorSettings.formatOnSave
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800 shadow-sm'
                          : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                      }`}
                    >
                      <span>{state.editorSettings.formatOnSave ? 'Enabled' : 'Disabled'}</span>
                    </button>
                  </div>
                )}

                {/* 5. TEXT EDITOR: Font Family */}
                {(activeTab === 'text-editor' || searchMatches(['font', 'family', 'jetbrains', 'fira', 'editor.fontFamily'])) && (
                  <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white text-xs">Editor: Font Family</span>
                        <span className="ml-2 text-[10px] text-[#58a6ff] bg-[#1f6feb]/15 px-1.5 py-0.2 rounded border border-[#1f6feb]/30">
                          editor.fontFamily
                        </span>
                      </div>
                    </div>
                    <p className="text-[#8b949e] text-[11px]">Controls the font family for code syntax.</p>
                    <select
                      value={state.editorSettings.fontFamily}
                      onChange={(e) => actions.setEditorSettings({ fontFamily: e.target.value })}
                      className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] p-2 rounded-lg text-white text-xs outline-none"
                    >
                      <option value="'JetBrains Mono', Consolas, monospace">JetBrains Mono (Recommended for Embedded)</option>
                      <option value="'Fira Code', monospace">Fira Code (Ligatures)</option>
                      <option value="Consolas, monospace">Consolas (Windows Classic)</option>
                      <option value="'Courier New', monospace">Courier New</option>
                    </select>
                  </div>
                )}

                {/* 6. TEXT EDITOR: Cursor Blinking & Style */}
                {(activeTab === 'text-editor' || searchMatches(['cursor', 'caret', 'blink', 'editor.cursorBlinking', 'editor.cursorStyle'])) && (
                  <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white text-xs">Editor: Cursor Animation & Style</span>
                        <span className="ml-2 text-[10px] text-[#58a6ff] bg-[#1f6feb]/15 px-1.5 py-0.2 rounded border border-[#1f6feb]/30">
                          editor.cursorStyle
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] text-[#8b949e] block mb-1">Cursor Blinking Animation:</label>
                        <select
                          value={state.editorSettings.cursorBlinking}
                          onChange={(e) => actions.setEditorSettings({ cursorBlinking: e.target.value as any })}
                          className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] p-1.5 rounded-lg text-white text-xs outline-none"
                        >
                          <option value="smooth">Smooth (VS Code Default)</option>
                          <option value="blink">Blink</option>
                          <option value="phase">Phase</option>
                          <option value="expand">Expand</option>
                          <option value="solid">Solid (No blink)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-[#8b949e] block mb-1">Cursor Shape:</label>
                        <select
                          value={state.editorSettings.cursorStyle}
                          onChange={(e) => actions.setEditorSettings({ cursorStyle: e.target.value as any })}
                          className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] p-1.5 rounded-lg text-white text-xs outline-none"
                        >
                          <option value="line">Line (Vertical bar)</option>
                          <option value="block">Block (Terminal / Vim style)</option>
                          <option value="underline">Underline</option>
                          <option value="line-thin">Line Thin</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. TEXT EDITOR: Line Numbers & Bracket Pairs */}
                {(activeTab === 'text-editor' || searchMatches(['bracket', 'line number', 'whitespace', 'editor.lineNumbers'])) && (
                  <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-3">
                    <span className="font-bold text-white text-xs block">Editor: Line Numbers, Colorization & Whitespace</span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        onClick={() => actions.setEditorSettings({ lineNumbers: !state.editorSettings.lineNumbers })}
                        className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors ${
                          state.editorSettings.lineNumbers
                            ? 'bg-[#21262d] text-[#58a6ff] border-[#1f6feb]/40'
                            : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                        }`}
                      >
                        <span>Line Numbers</span>
                        <span>{state.editorSettings.lineNumbers ? 'On' : 'Off'}</span>
                      </button>

                      <button
                        onClick={() => actions.setEditorSettings({ bracketPairColorization: !state.editorSettings.bracketPairColorization })}
                        className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors ${
                          state.editorSettings.bracketPairColorization
                            ? 'bg-[#21262d] text-[#58a6ff] border-[#1f6feb]/40'
                            : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                        }`}
                      >
                        <span>Bracket Colorization</span>
                        <span>{state.editorSettings.bracketPairColorization ? 'On' : 'Off'}</span>
                      </button>

                      <button
                        onClick={() => actions.setEditorSettings({ autoClosingBrackets: !state.editorSettings.autoClosingBrackets })}
                        className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors ${
                          state.editorSettings.autoClosingBrackets
                            ? 'bg-[#21262d] text-[#58a6ff] border-[#1f6feb]/40'
                            : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                        }`}
                      >
                        <span>Auto-Close Brackets</span>
                        <span>{state.editorSettings.autoClosingBrackets ? 'On' : 'Off'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 8. WORKBENCH & APPEARANCE: Theme Picker */}
                {(activeTab === 'workbench' || searchMatches(['theme', 'color', 'dark', 'dracula', 'workbench.colorTheme'])) && (
                  <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-3">
                    <div className="flex items-center justify-between border-b border-[#30363d] pb-2 text-white font-bold text-xs">
                      <div className="flex items-center space-x-2">
                        <Palette className="w-4 h-4 text-[#58a6ff]" />
                        <span>Workbench: Color Theme</span>
                      </div>
                      <span className="text-[10px] text-[#8b949e] font-normal">{state.theme}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {themes.map((t) => {
                        const isSelected = state.theme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => actions.setTheme(t.id)}
                            className={`p-3 rounded-xl border flex flex-col items-start justify-between space-y-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[#58a6ff] bg-[#21262d] shadow-md ring-1 ring-[#58a6ff]/50'
                                : 'border-[#30363d] bg-[#0d1117] hover:bg-[#21262d]/50'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-bold text-white text-xs truncate">{t.name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#58a6ff]" />}
                            </div>

                            <div className="flex items-center space-x-2 w-full pt-1">
                              <div className="w-5 h-5 rounded border border-[#30363d]" style={{ backgroundColor: t.previewBg }} />
                              <div className="w-5 h-5 rounded border border-[#30363d]" style={{ backgroundColor: t.previewAccent }} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 9. WORKBENCH: Zoom Level & Minimap */}
                {(activeTab === 'workbench' || searchMatches(['zoom', 'minimap', 'scale', 'workbench.zoomLevel'])) && (
                  <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-3">
                    <span className="font-bold text-white text-xs block">Workbench: Zoom Level & Minimap Preview</span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] text-[#8b949e]">UI & Editor Zoom: {state.zoomLevel}%</label>
                          <button onClick={actions.resetZoom} className="text-[10px] text-[#58a6ff] hover:underline">
                            Reset (100%)
                          </button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min="70"
                            max="160"
                            step="10"
                            value={state.zoomLevel}
                            onChange={(e) => actions.setZoomLevel(parseInt(e.target.value, 10))}
                            className="flex-1 accent-[#58a6ff]"
                          />
                          <span className="w-12 text-right text-white font-bold">{state.zoomLevel}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-l border-[#30363d] pl-4">
                        <div>
                          <div className="text-white font-bold text-xs">Editor Minimap</div>
                          <div className="text-[#8b949e] text-[11px]">Shows code overview on the right sidebar.</div>
                        </div>
                        <button
                          onClick={() => actions.setEditorSettings({ minimap: !state.editorSettings.minimap })}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                            state.editorSettings.minimap
                              ? 'bg-[#1f6feb] text-white border-blue-600'
                              : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                          }`}
                        >
                          {state.editorSettings.minimap ? 'Shown' : 'Hidden'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 10. ESP32 & HARDWARE TOOLCHAIN: Flash Speed & Flash Mode */}
                {(activeTab === 'esp32' || searchMatches(['flash', 'baud', 'serial', 'esp32.flashSpeed', 'hardware'])) && (
                  <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-3">
                    <div className="flex items-center space-x-2 border-b border-[#30363d] pb-2 text-white font-bold text-xs">
                      <Cpu className="w-4 h-4 text-[#58a6ff]" />
                      <span>ESP32 & Hardware: Flasher & Serial Parameters</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-[#8b949e] block mb-1">SPI Flash Clock Speed:</label>
                        <select
                          value={state.editorSettings.flashSpeed}
                          onChange={(e) => actions.setEditorSettings({ flashSpeed: e.target.value as any })}
                          className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] p-2 rounded-lg text-white text-xs outline-none"
                        >
                          <option value="80m">80 MHz (High Performance SPI)</option>
                          <option value="40m">40 MHz (Safe Default)</option>
                          <option value="26m">26 MHz</option>
                          <option value="20m">20 MHz</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-[#8b949e] block mb-1">Flash Interface Mode:</label>
                        <select
                          value={state.editorSettings.flashMode}
                          onChange={(e) => actions.setEditorSettings({ flashMode: e.target.value as any })}
                          className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] p-2 rounded-lg text-white text-xs outline-none"
                        >
                          <option value="qio">QIO (Quad I/O — 4x throughput)</option>
                          <option value="qout">QOUT (Quad Output)</option>
                          <option value="dio">DIO (Dual I/O)</option>
                          <option value="dout">DOUT (Dual Output)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-[#8b949e] block mb-1">Default Serial Baud Rate:</label>
                        <select
                          value={state.editorSettings.defaultBaudRate}
                          onChange={(e) => {
                            const baud = parseInt(e.target.value, 10);
                            actions.setEditorSettings({ defaultBaudRate: baud });
                            actions.setBaudRate(baud);
                          }}
                          className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] p-2 rounded-lg text-white text-xs outline-none"
                        >
                          <option value="115200">115200 (Standard ESP CDC)</option>
                          <option value="9600">9600 (Legacy)</option>
                          <option value="921600">921600 (High-Speed OTA/Log)</option>
                          <option value="460800">460800</option>
                          <option value="230400">230400</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#30363d]">
                      <button
                        onClick={() => actions.setEditorSettings({ autoScrollSerial: !state.editorSettings.autoScrollSerial })}
                        className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors ${
                          state.editorSettings.autoScrollSerial
                            ? 'bg-[#21262d] text-[#58a6ff] border-[#1f6feb]/40'
                            : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                        }`}
                      >
                        <span>Serial Auto-Scroll</span>
                        <span>{state.editorSettings.autoScrollSerial ? 'Active' : 'Disabled'}</span>
                      </button>

                      <button
                        onClick={() => actions.setEditorSettings({ showSerialTimestamps: !state.editorSettings.showSerialTimestamps })}
                        className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors ${
                          state.editorSettings.showSerialTimestamps
                            ? 'bg-[#21262d] text-[#58a6ff] border-[#1f6feb]/40'
                            : 'bg-[#0d1117] text-[#8b949e] border-[#30363d]'
                        }`}
                      >
                        <span>Serial Timestamps</span>
                        <span>{state.editorSettings.showSerialTimestamps ? 'Active' : 'Disabled'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 11. ESP32 TOOLCHAIN MATRIX */}
                {(activeTab === 'esp32' || searchMatches(['toolchain', 'gcc', 'platformio', 'lockfile'])) && (
                  <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-3">
                    <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
                      <span className="font-bold text-white text-xs flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span>Pinned Toolchain Lockfile Specifications</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800">
                        Zero-Drift Verified
                      </span>
                    </div>

                    <div className="divide-y divide-[#21262d]">
                      {toolchainSpecs.map((spec) => (
                        <div key={spec.name} className="py-2 flex items-center justify-between text-[11px]">
                          <span className="text-white font-medium">{spec.name}</span>
                          <div className="flex items-center space-x-3">
                            <span className="text-[#58a6ff]">{spec.version}</span>
                            <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 text-[9px] font-bold">
                              {spec.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 12. AI EMBEDDED COPILOT */}
                {(activeTab === 'copilot' || searchMatches(['ai', 'copilot', 'gemini', 'claude', 'gpt', 'deepseek'])) && (
                  <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-3">
                    <div className="flex items-center space-x-2 border-b border-[#30363d] pb-2 text-white font-bold text-xs">
                      <Bot className="w-4 h-4 text-purple-400" />
                      <span>AI Embedded Copilot: Active Reasoning Model</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] text-[#8b949e] block">Select Default Copilot Model:</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Google DeepMind)', speed: 'Ultra Fast (150ms)', tag: 'Recommended' },
                          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Google DeepMind)', speed: 'Deep Reasoning', tag: 'Pro' },
                          { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Anthropic)', speed: 'High Precision C/C++', tag: 'Pro' },
                          { id: 'gpt-4o', name: 'GPT-4o (OpenAI)', speed: 'Multimodal', tag: 'Pro' },
                          { id: 'deepseek-coder', name: 'DeepSeek Coder V2', speed: 'Open Source Weights', tag: 'Fast' },
                        ].map((m) => {
                          const isSelected = state.activeAiModel === m.id;
                          return (
                            <button
                              key={m.id}
                              onClick={() => actions.setAiModel(m.id as AiModelId)}
                              className={`p-3 rounded-xl border text-left flex flex-col justify-between space-y-1 transition-all ${
                                isSelected
                                  ? 'bg-purple-950/40 border-purple-500 text-purple-200 ring-1 ring-purple-500'
                                  : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-white'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-white truncate">{m.name}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 font-bold border border-purple-800">
                                  {m.tag}
                                </span>
                              </div>
                              <span className="text-[10px] text-[#8b949e]">{m.speed}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
