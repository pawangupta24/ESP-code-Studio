import React, { useState, useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { runEditorAction, requestReveal } from '../editorBridge';
import { pickColorTheme, pickLanguageMode, pickNewFileLanguage, pickTabSize } from '../quickPicks';
import { Check } from 'lucide-react';
import { FileIcon } from './FileIcon';
import {
  Terminal, Cpu, Zap, Cloud, Trash2, Code, RotateCcw, Blocks, Save, X, Columns2, Bot,
  Settings, Search, Palette, Hash, PanelBottom, FilePlus,
} from 'lucide-react';

interface PaletteItem {
  id: string;
  title: string;
  detail: string;
  icon?: React.FC<{ className?: string }>;
  fileName?: string;
  checked?: boolean;
  run: () => void;
}

/**
 * Match quality, lower sorts first: 0 exact, 1 prefix, 2 word starts with query,
 * 3 substring, 4 in-order characters, -1 no match. So "go" ranks "Go" above "Cameligo".
 */
export function fuzzyScore(text: string, query: string): number {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (!q) return 0;
  const firstWord = t.split(/\s+/)[0];
  if (firstWord === q) return 0;
  if (t.startsWith(q)) return 1;
  if (new RegExp(`[\\s/._(-]${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(t)) return 2;
  if (t.includes(q)) return 3;
  let i = 0;
  for (const ch of t) if (ch === q[i]) i++;
  return i === q.length ? 4 : -1;
}

function rank<T>(items: T[], query: string, text: (item: T) => string): T[] {
  return items
    .map((item) => ({ item, score: fuzzyScore(text(item), query) }))
    .filter((r) => r.score >= 0)
    .sort((a, b) => a.score - b.score)
    .map((r) => r.item);
}

/**
 * Quick Open, VS Code style. One input, three modes chosen by prefix:
 *   (none) go to file, optionally "name:line"   — Ctrl+P
 *   >      run command                          — Ctrl+Shift+P / F1
 *   :      go to line in the active file
 */
export const CommandPalette: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isP = (e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'p';
      if (isP || e.key === 'F1') {
        e.preventDefault();
        e.stopPropagation();
        actions.setCommandPaletteOpen(true, isP && !e.shiftKey ? '' : '>');
      }
    };
    // Capture phase: otherwise the browser's Print dialog / Monaco's own F1 palette wins
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  useEffect(() => {
    if (state.isCommandPaletteOpen) {
      setSearch(state.paletteQuery);
      setSelectedIndex(0);
    }
  }, [state.isCommandPaletteOpen, state.paletteQuery, state.quickPick]);

  useEffect(() => {
    listRef.current?.children[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!state.isCommandPaletteOpen) return null;

  const commands: PaletteItem[] = [
    { id: 'goto-file', title: 'Go to File...', detail: 'Quick open any workspace file (Ctrl+P)', icon: Search, run: () => actions.setCommandPaletteOpen(true, '') },
    { id: 'goto-line', title: 'Go to Line/Column...', detail: 'Jump to a line in the active file (Ctrl+G)', icon: Hash, run: () => actions.setCommandPaletteOpen(true, ':') },
    { id: 'new-text-file', title: 'File: New Text File', detail: 'Untitled file in the default language (Ctrl+Alt+N)', icon: FilePlus, run: () => actions.newUntitledFile() },
    { id: 'new-file', title: 'File: New File...', detail: 'Pick a language for a new file', icon: FilePlus, run: () => pickNewFileLanguage(actions) },
    { id: 'revert', title: 'File: Revert File', detail: 'Discard changes since the last save', icon: RotateCcw, run: () => actions.revertFile() },
    { id: 'auto-save', title: 'File: Toggle Auto Save', detail: `Currently ${state.editorSettings.autoSave}`, icon: Save, run: () => actions.setEditorSettings({ autoSave: state.editorSettings.autoSave === 'off' ? 'afterDelay' : 'off' }) },
    { id: 'language-mode', title: 'Change Language Mode', detail: 'Pick the language for the current file (Ctrl+K M)', icon: Code, run: () => pickLanguageMode(state, actions) },
    { id: 'indent', title: 'Indent Using Spaces', detail: `Tab size: ${state.editorSettings.tabSize}`, icon: Code, run: () => pickTabSize(state, actions) },
    { id: 'symbol', title: 'Go to Symbol in Editor...', detail: 'Functions and classes in this file (Ctrl+Shift+O)', icon: Hash, run: () => runEditorAction('editor.action.quickOutline') },
    { id: 'zen', title: 'View: Toggle Zen Mode', detail: 'Hide everything but the editor (Ctrl+K Z, Esc to leave)', icon: PanelBottom, run: actions.toggleZenMode },
    { id: 'fullscreen', title: 'View: Toggle Full Screen', detail: 'F11', icon: PanelBottom, run: actions.toggleFullScreen },
    { id: 'activity-bar', title: 'View: Toggle Activity Bar Visibility', detail: '', icon: PanelBottom, run: () => actions.setEditorSettings({ showActivityBar: !state.editorSettings.showActivityBar }) },
    { id: 'status-bar', title: 'View: Toggle Status Bar Visibility', detail: '', icon: PanelBottom, run: () => actions.setEditorSettings({ showStatusBar: !state.editorSettings.showStatusBar }) },
    { id: 'keybindings', title: 'Preferences: Open Keyboard Shortcuts', detail: 'Ctrl+K Ctrl+S', icon: Settings, run: () => actions.openSettings('keybindings') },
    { id: 'theme', title: 'Preferences: Color Theme', detail: 'Ctrl+K Ctrl+T', icon: Palette, run: () => pickColorTheme(state, actions) },
    { id: 'clean', title: 'ESP Studio: Clean Build Outputs', detail: 'Remove the last build artifact and logs', icon: Trash2, run: actions.cleanBuild },
    { id: 'save', title: 'File: Save', detail: 'Save the active file (Ctrl+S)', icon: Save, run: () => actions.saveFile() },
    { id: 'save-all', title: 'File: Save All', detail: 'Save every modified file (Ctrl+Shift+S)', icon: Save, run: actions.saveAllFiles },
    { id: 'close-editor', title: 'View: Close Editor', detail: 'Close the active tab (Ctrl+W)', icon: X, run: () => actions.closeTab(state.activeFilePath) },
    { id: 'close-all', title: 'View: Close All Editors', detail: 'Close every open tab', icon: X, run: actions.closeAllTabs },
    { id: 'split', title: 'View: Toggle Split Editor', detail: 'Open or close the side-by-side editor (Ctrl+\\)', icon: Columns2, run: actions.toggleSplitEditor },
    { id: 'toggle-panel', title: 'View: Toggle Panel', detail: 'Show or hide the bottom panel (Ctrl+J)', icon: PanelBottom, run: () => actions.setBottomPanelTab(state.bottomPanelTab === 'closed' ? 'terminal' : 'closed') },
    { id: 'find', title: 'Find', detail: 'Find in the active file (Ctrl+F)', icon: Search, run: () => runEditorAction('actions.find') },
    { id: 'replace', title: 'Replace', detail: 'Find and replace in the active file (Ctrl+H)', icon: Search, run: () => runEditorAction('editor.action.startFindReplaceAction') },
    { id: 'find-in-files', title: 'Search: Find in Files', detail: 'Search across the workspace (Ctrl+Shift+F)', icon: Search, run: () => actions.setSidebarView('search') },
    { id: 'word-wrap', title: 'View: Toggle Word Wrap', detail: `Currently ${state.editorSettings.wordWrap ? 'on' : 'off'}`, icon: Code, run: () => actions.setEditorSettings({ wordWrap: !state.editorSettings.wordWrap }) },
    { id: 'minimap', title: 'View: Toggle Minimap', detail: `Currently ${state.editorSettings.minimap ? 'shown' : 'hidden'}`, icon: Code, run: () => actions.setEditorSettings({ minimap: !state.editorSettings.minimap }) },
    { id: 'settings', title: 'Preferences: Open Settings', detail: 'Editor, toolchain and theme settings (Ctrl+,)', icon: Settings, run: () => actions.openSettings() },
    { id: 'ai', title: 'View: Toggle AI Copilot Panel', detail: 'Show or hide the assistant (Ctrl+Shift+A)', icon: Bot, run: actions.toggleAiPanel },
    {
      id: 'build',
      title: 'ESP Studio: Trigger Compilation',
      detail: `Compile firmware with ${state.buildEngineMode.toUpperCase()} engine`,
      icon: Cpu,
      run: () => void actions.triggerBuild(),
    },
    {
      id: 'flash',
      title: 'ESP Studio: Flash Firmware to Device',
      detail: `Upload binaries to ${state.activeDevice.deviceId} via USB CDC`,
      icon: Zap,
      run: () => void actions.triggerFlash(),
    },
    {
      id: 'serial-toggle',
      title: 'ESP Studio: Toggle Serial Monitor',
      detail: state.isSerialConnected ? 'Disconnect serial stream' : 'Connect to COM4 @ 115200 baud',
      icon: Terminal,
      run: () => void actions.toggleSerialConnection(),
    },
    {
      id: 'plotter',
      title: 'ESP Studio: Open Serial Waveform Plotter',
      detail: 'Inspect live analog & FreeRTOS telemetry waveforms',
      icon: Terminal,
      run: () => actions.setBottomPanelTab('plotter'),
    },
    {
      id: 'format',
      title: 'ESP Studio: Format Current File',
      detail: 'Re-indent code and strip trailing whitespace',
      icon: Code,
      run: () => actions.formatCurrentCode(),
    },
    {
      id: 'extensions-market',
      title: 'ESP Studio: Open Extensions Marketplace',
      detail: 'Browse and install MicroPython, Rust, QuickJS, JSON, and custom language packs',
      icon: Blocks,
      run: () => actions.setActiveNavTab('extensions'),
    },
    {
      id: 'install-micropython',
      title: 'Extensions: Install MicroPython for ESP32',
      detail: 'Add Python 3 grammar, REPL execution, and machine.Pin support',
      icon: Blocks,
      run: () => actions.installExtension('micropython-esp32', true),
    },
    {
      id: 'install-rust',
      title: 'Extensions: Install Rust (esp-rs & no_std)',
      detail: 'Add Rust language grammar, Cargo.toml support, and esp-hal bindings',
      icon: Blocks,
      run: () => actions.installExtension('rust-esp32', true),
    },
    {
      id: 'sync',
      title: 'ESP Studio: Synchronize Cloud & Local Workspace',
      detail: 'Reconcile local SHA-256 revisions with cloud S3 repository',
      icon: Cloud,
      run: () => void actions.triggerSync(),
    },
    {
      id: 'clear-serial',
      title: 'ESP Studio: Clear Serial Terminal Buffer',
      detail: 'Flush all log memory lines',
      icon: Trash2,
      run: () => actions.clearSerialLogs(),
    },
    {
      id: 'reset-arduino',
      title: 'ESP Studio: Reset to ESP32-S3 Arduino Template',
      detail: 'Re-initialize project workspace to default blink structure',
      icon: RotateCcw,
      run: () => {
        if (confirm('Reset the workspace to the Arduino template? All current files will be replaced.')) {
          actions.resetProjectToTemplate('arduino');
        }
      },
    },
  ];

  let items: PaletteItem[];
  let emptyText = 'No matching results.';
  const quickPick = state.quickPick;

  if (quickPick) {
    // A picker (language mode, theme, ...) replaces the normal modes; current choice first
    const sorted = [...quickPick.items].sort((a, b) => Number(!!b.current) - Number(!!a.current));
    items = rank(sorted, search.trim(), (i) => `${i.label} ${i.detail ?? ''}`).map((i) => ({
      id: i.id,
      title: i.label,
      detail: i.detail ?? '',
      checked: i.current,
      run: () => quickPick.onPick(i.id),
    }));
  } else if (search.startsWith('>')) {
    items = rank(commands, search.slice(1).trim(), (c) => `${c.title} ${c.detail}`);
    emptyText = 'No matching commands.';
  } else if (search.startsWith(':')) {
    const line = parseInt(search.slice(1), 10);
    const path = state.activeFilePath;
    items = line > 0 && path
      ? [{ id: 'line', title: `Go to line ${line}`, detail: path, icon: Hash, run: () => requestReveal(path, line) }]
      : [];
    emptyText = path ? 'Type a line number to go to.' : 'No file is open.';
  } else {
    // "name" or "name:line"
    const [fileQuery, lineQuery] = search.split(':');
    const line = parseInt(lineQuery || '', 10);
    // Open tabs first, like VS Code's "recently opened"
    const paths = [...state.openTabs, ...Object.keys(state.project.files).sort().filter((p) => !state.openTabs.includes(p))];
    items = rank(paths, fileQuery.trim(), (p) => p).map((path) => ({
      id: path,
      title: path.split('/').pop() || path,
      detail: path,
      fileName: path.split('/').pop() || path,
      run: () => {
        actions.setActiveFilePath(path);
        if (line > 0) requestReveal(path, line);
      },
    }));
    emptyText = 'No matching files.';
  }

  const selected = Math.min(selectedIndex, Math.max(0, items.length - 1));

  const execute = (item: PaletteItem) => {
    // Close first: some commands re-open the palette in another mode
    actions.setCommandPaletteOpen(false);
    item.run();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(items.length ? (selected + 1) % items.length : 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(items.length ? (selected - 1 + items.length) % items.length : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selected]) execute(items[selected]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      actions.setCommandPaletteOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-16 font-mono select-none"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) actions.setCommandPaletteOpen(false);
      }}
    >
      <div className="w-full max-w-xl bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Input */}
        <div className="p-2 border-b border-[#30363d] flex items-center space-x-2">
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder={quickPick?.placeholder ?? 'Search files by name (type > for commands, : for line)'}
            className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] rounded px-2 py-1 text-white text-xs outline-none font-mono placeholder-[#8b949e]"
          />
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-1">
          {items.length === 0 ? (
            <div className="p-4 text-center text-[#8b949e] text-xs">{emptyText}</div>
          ) : (
            items.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selected;
              return (
                <div
                  key={item.id}
                  onClick={() => execute(item)}
                  onMouseMove={() => setSelectedIndex(idx)}
                  className={`px-2 py-1.5 rounded flex items-center space-x-2.5 cursor-pointer ${
                    isSelected ? 'bg-[#1f6feb]/40 text-white' : 'text-[#c9d1d9]'
                  }`}
                >
                  {item.fileName ? (
                    <FileIcon filename={item.fileName} className="w-4 h-4 flex-shrink-0" />
                  ) : quickPick ? (
                    <span className="w-4 flex-shrink-0">{item.checked && <Check className="w-4 h-4 text-[#58a6ff]" />}</span>
                  ) : (
                    Icon && <Icon className="w-4 h-4 text-[#58a6ff] flex-shrink-0" />
                  )}
                  <span className="text-xs truncate">{item.title}</span>
                  <span className="text-[10px] text-[#8b949e] truncate">{item.detail}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
