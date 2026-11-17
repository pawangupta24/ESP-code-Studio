import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ActivityBar } from './components/ActivityBar';
import { ExplorerSidebar } from './components/ExplorerSidebar';
import { SearchSidebar } from './components/SearchSidebar';
import { SourceControlSidebar } from './components/SourceControlSidebar';
import { EditorGroup } from './components/EditorGroup';
import { ProblemsPanel } from './components/ProblemsPanel';
import { StatusBar } from './components/StatusBar';
import { SerialMonitor } from './components/SerialMonitor';
import { SerialPlotter } from './components/SerialPlotter';
import { PioTerminal } from './components/PioTerminal';
import { BuildPanel } from './components/BuildPanel';
import { DeviceManager } from './components/DeviceManager';
import { PinoutViewer } from './components/PinoutViewer';
import { FreeRtosMonitor } from './components/FreeRtosMonitor';
import { OtaDeployer } from './components/OtaDeployer';
import { CloudBuildManager } from './components/CloudBuildManager';
import { GitGraphView } from './components/GitGraphView';
import { TemplateGallery } from './components/TemplateGallery';
import { ExtensionsSidebar } from './components/ExtensionsSidebar';
import { ExtensionsMarketplace } from './components/ExtensionsMarketplace';
import { SyncView } from './components/SyncView';
import { SettingsView } from './components/SettingsView';
import { SyncModal } from './components/SyncModal';
import { AuthModal } from './components/AuthModal';
import { WelcomeTour } from './components/WelcomeTour';
import { CommandPalette } from './components/CommandPalette';
import { AiAssistantPanel } from './components/AiAssistantPanel';
import { LibraryManager } from './components/LibraryManager';
import { useWorkspaceStore, NavTab, WELCOME_TAB, focusedPath } from './stores/useWorkspaceStore';
import { Notifications, Dialog, InputBox } from './components/WorkbenchOverlays';
import { readTextFiles, isFileDrag } from './utils/fileImport';
import { pickColorTheme, pickLanguageMode } from './quickPicks';
import { THEME_PALETTES } from './themeTokens';
import {
  Terminal,
  Activity,
  Hammer,
  AlertCircle,
  X,
  Code2,
  Maximize2,
  Minimize2,
} from 'lucide-react';

const SIDEBAR_VIEWS = ['explorer', 'search', 'git', 'extensions', 'debug', 'esp32'];

const ESP32_TOOLS: { id: NavTab; label: string }[] = [
  { id: 'devices', label: 'Board & Device Manager' },
  { id: 'pinout', label: 'Pinout & GPIO Matrix' },
  { id: 'freertos', label: 'FreeRTOS Task Monitor' },
  { id: 'ota', label: 'OTA Wireless Deploy' },
  { id: 'libraries', label: 'Library Manager' },
  { id: 'templates', label: 'Project Templates' },
  { id: 'build', label: 'Cloud Build Pipeline' },
  { id: 'sync', label: 'Cloud Sync' },
  { id: 'git-graph', label: 'Git Graph' },
];

export const App: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const activityView = state.sidebarView;
  const setActivityView = actions.setSidebarView;
  const stateRef = useRef(state);
  stateRef.current = state;
  const palette = THEME_PALETTES[state.theme] || THEME_PALETTES['github-dark'];

  // Window title like VS Code: "● file.cpp - project - ESP Studio"
  useEffect(() => {
    const path = focusedPath(state);
    const name = path === WELCOME_TAB ? 'Welcome' : path.split('/').pop();
    const dirty = state.dirtyFiles.includes(path) ? '● ' : '';
    document.title = [name && `${dirty}${name}`, state.project.metadata.name, 'ESP Studio'].filter(Boolean).join(' - ');
  }, [state.activeFilePath, state.splitFilePath, state.activeGroup, state.dirtyFiles, state.project.metadata.name]);

  // Drop files from the OS onto the editor area to open them
  const [fileDragOver, setFileDragOver] = useState(false);
  const onEditorDrop = async (e: React.DragEvent) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    setFileDragOver(false);
    const { files, skipped } = await readTextFiles(Array.from(e.dataTransfer.files), (f) => f.name);
    const paths = Object.keys(files);
    const clashes = paths.filter((p) => state.project.files[p]);
    if (clashes.length) {
      const choice = await actions.showDialog({
        severity: 'warning',
        message: clashes.length === 1 ? `Replace '${clashes[0]}'?` : `Replace ${clashes.length} existing files?`,
        detail: clashes.join('\n'),
        buttons: ['Replace', 'Cancel'],
      });
      if (choice !== 0) return;
    }
    if (paths.length) actions.importFiles(files);
    if (skipped) actions.notify('warning', `${skipped} file(s) skipped (binary, build output or larger than 2 MB).`);
  };

  // Resizable Section Dimensions (with local storage persistence)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('esp_studio_sidebar_width');
      return saved ? Math.max(160, Math.min(700, parseInt(saved, 10))) : 260;
    } catch {
      return 260;
    }
  });

  const [bottomPanelHeight, setBottomPanelHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('esp_studio_bottom_panel_height');
      return saved ? Math.max(80, Math.min(800, parseInt(saved, 10))) : 240;
    } catch {
      return 240;
    }
  });

  const [aiPanelWidth, setAiPanelWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('esp_studio_ai_panel_width');
      return saved ? Math.max(240, Math.min(700, parseInt(saved, 10))) : 360;
    } catch {
      return 360;
    }
  });

  const [splitRatio, setSplitRatio] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('esp_studio_split_ratio');
      return saved ? Math.max(0.2, Math.min(0.8, parseFloat(saved))) : 0.5;
    } catch {
      return 0.5;
    }
  });

  const [isPanelMaximized, setIsPanelMaximized] = useState(false);
  const [preMaximizedHeight, setPreMaximizedHeight] = useState(240);
  const [isDragging, setIsDragging] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Global shortcuts. Capture phase so they win over Monaco's own bindings for the same keys
  // (e.g. Ctrl+U), matching what the menus and Keyboard Shortcuts page advertise.
  const chordUntil = useRef(0);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      const k = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const consume = (fn: () => void) => {
        e.preventDefault();
        e.stopPropagation();
        fn();
      };

      // Ctrl+K chords outside the editor. Inside it, Monaco resolves them (see MonacoEditor.tsx).
      const inEditor = !!(e.target as Element | null)?.closest?.('.monaco-editor');
      if (!inEditor && Date.now() < chordUntil.current && !['control', 'meta', 'shift', 'alt'].includes(k)) {
        chordUntil.current = 0;
        const chord: Record<string, string> = ctrl
          ? { s: 'keybindings', t: 'colorTheme' }
          : { z: 'zenMode', m: 'languageMode' };
        if (chord[k]) return consume(() => runCommand(chord[k]));
        return;
      }
      if (!inEditor && ctrl && !e.shiftKey && !e.altKey && k === 'k') {
        chordUntil.current = Date.now() + 1500;
        return;
      }

      // Keys without Ctrl
      if (!ctrl) {
        if (k === 'escape' && s.zenMode && !s.isCommandPaletteOpen) return consume(actions.toggleZenMode);
        if (k === 'f5' && !e.shiftKey) return consume(() => void actions.toggleSerialConnection());
        if (e.altKey && !e.shiftKey && k === 'arrowleft') return consume(actions.goBack);
        if (e.altKey && !e.shiftKey && k === 'arrowright') return consume(actions.goForward);
        if (k === 'f11') return consume(actions.toggleFullScreen);
        if (e.altKey && !e.shiftKey && k === 'z') return consume(() => actions.setEditorSettings({ wordWrap: !s.editorSettings.wordWrap }));
        return;
      }
      if (e.altKey) {
        if (k === 'n') consume(() => actions.newUntitledFile());
        return;
      }

      const tabStep = (delta: number) => {
        // Cycle tabs within the focused editor group
        const inSplit = s.activeGroup === 1 && !!s.splitFilePath;
        const tabs = inSplit ? s.splitTabs : s.openTabs;
        const next = tabs[(tabs.indexOf(focusedPath(s)) + delta + tabs.length) % tabs.length];
        if (tabs.length > 1) actions.openFile(next);
      };

      const shifted: Record<string, () => void> = {
        e: () => actions.setSidebarView('explorer'),
        f: () => actions.setSidebarView('search'),
        g: () => actions.setSidebarView('git'),
        d: () => actions.setSidebarView('debug'),
        x: () => actions.setSidebarView('extensions'),
        m: () => actions.setBottomPanelTab('problems'),
        a: actions.toggleAiPanel,
        b: () => void actions.triggerBuild(),
        s: actions.saveAllFiles,
        '~': () => actions.setBottomPanelTab('terminal'),
      };
      const plain: Record<string, () => void> = {
        ',': () => actions.openSettings(),
        o: () => window.dispatchEvent(new Event('esp-studio:open-file')),
        s: () => actions.saveFile(),
        b: () => void actions.triggerBuild(),
        u: () => void actions.triggerFlash(),
        j: () => actions.setBottomPanelTab(s.bottomPanelTab === 'closed' ? 'terminal' : 'closed'),
        '`': () => actions.setBottomPanelTab(s.bottomPanelTab === 'terminal' ? 'closed' : 'terminal'),
        '\\': actions.toggleSplitEditor,
        w: () => {
          const path = focusedPath(s);
          if (path) void actions.requestCloseTabs([path], s.activeGroup === 1 && s.splitFilePath ? 1 : 0);
        },
        '=': actions.zoomIn,
        '+': actions.zoomIn,
        '-': actions.zoomOut,
        '0': actions.resetZoom,
        pagedown: () => tabStep(1),
        pageup: () => tabStep(-1),
      };

      const handler = (e.shiftKey ? shifted : plain)[k];
      if (handler) consume(handler);
    };
    // Named commands, shared by the chord handler above and Monaco's in-editor chords
    const runCommand = (name: string) => {
      const s = stateRef.current;
      if (name === 'languageMode') pickLanguageMode(s, actions);
      else if (name === 'colorTheme') pickColorTheme(s, actions);
      else if (name === 'zenMode') actions.toggleZenMode();
      else if (name === 'keybindings') actions.openSettings('keybindings');
    };
    const onCommand = (e: Event) => runCommand((e as CustomEvent<string>).detail);
    const onFullScreen = () => actions.setFullScreenState(!!document.fullscreenElement);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('esp-studio:command', onCommand);
    document.addEventListener('fullscreenchange', onFullScreen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('esp-studio:command', onCommand);
      document.removeEventListener('fullscreenchange', onFullScreen);
    };
  }, []);

  // Opening the marketplace from anywhere also shows its sidebar list
  useEffect(() => {
    if (state.activeNavTab === 'extensions') setActivityView('extensions');
  }, [state.activeNavTab]);

  // Persist layout sizes once a drag ends
  useEffect(() => {
    if (isDragging) return;
    try {
      localStorage.setItem('esp_studio_sidebar_width', sidebarWidth.toString());
      localStorage.setItem('esp_studio_bottom_panel_height', bottomPanelHeight.toString());
      localStorage.setItem('esp_studio_ai_panel_width', aiPanelWidth.toString());
      localStorage.setItem('esp_studio_split_ratio', splitRatio.toString());
    } catch {
      // quota
    }
  }, [isDragging, sidebarWidth, bottomPanelHeight, aiPanelWidth, splitRatio]);

  // 1. Sidebar Resize Handler
  const handleSidebarResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(160, Math.min(700, startWidth + deltaX));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // 2. Bottom Panel Resize Handler
  const handleBottomResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startY = e.clientY;
    const startHeight = bottomPanelHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY; // Moving UP increases height
      const maxHeight = window.innerHeight - 140;
      const newHeight = Math.max(80, Math.min(maxHeight, startHeight + deltaY));
      setBottomPanelHeight(newHeight);
      setIsPanelMaximized(false);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // 3. AI Panel Resize Handler
  const handleAiResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX;
    const startWidth = aiPanelWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX; // Moving LEFT increases width
      const newWidth = Math.max(240, Math.min(700, startWidth + deltaX));
      setAiPanelWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // 4. Split Editor Resize Handler
  const handleSplitResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!editorContainerRef.current) return;
    setIsDragging(true);
    const rect = editorContainerRef.current.getBoundingClientRect();

    const onMouseMove = (moveEvent: MouseEvent) => {
      const relativeX = moveEvent.clientX - rect.left;
      const ratio = Math.max(0.2, Math.min(0.8, relativeX / rect.width));
      setSplitRatio(ratio);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Zen mode hides everything except the editor and menu bar (Esc or Ctrl+K Z to leave)
  const zen = state.zenMode;
  const hasSidebar = !zen && SIDEBAR_VIEWS.includes(activityView);
  const showActivityBar = !zen && state.editorSettings.showActivityBar;
  const showPanel = !zen && state.bottomPanelTab !== 'closed';

  // Bottom panel maximize toggle
  const toggleMaximizePanel = () => {
    if (isPanelMaximized) {
      setBottomPanelHeight(preMaximizedHeight);
      setIsPanelMaximized(false);
    } else {
      setPreMaximizedHeight(bottomPanelHeight);
      setBottomPanelHeight(Math.max(320, window.innerHeight - 150));
      setIsPanelMaximized(true);
    }
  };

  return (
    <div
      style={{ backgroundColor: palette.bgMain, color: palette.text }}
      className="flex flex-col h-screen w-screen overflow-hidden select-none font-mono transition-colors duration-200"
    >
      {/* Top Header */}
      <Header />

      {/* Main VS Code Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Leftmost Activity Bar */}
        {showActivityBar && <ActivityBar
          activeView={activityView}
          onSelectView={(v) => {
            if (v === 'settings') {
              // Settings is a full-page view; it does not replace the sidebar
              actions.setActiveNavTab(state.activeNavTab === 'settings' ? 'explorer' : 'settings');
            } else if (activityView === v) {
              // Click active icon again to toggle collapse
              setActivityView('');
            } else {
              setActivityView(v);
              if (v === 'explorer') actions.setActiveNavTab('explorer');
              else if (v === 'extensions') actions.setActiveNavTab('extensions');
            }
          }}
        />}

        {/* Dynamic Resizable Sidebar Container */}
        {hasSidebar && (
          <div
            style={{ width: `${sidebarWidth}px` }}
            className="h-full flex-shrink-0 flex flex-col overflow-hidden relative max-w-[calc(100vw-48px)]"
          >
            {activityView === 'explorer' && <ExplorerSidebar />}
            {activityView === 'search' && <SearchSidebar />}
            {activityView === 'git' && <SourceControlSidebar />}
            {activityView === 'extensions' && <ExtensionsSidebar />}
            {activityView === 'debug' && <DeviceManager />}
            {activityView === 'esp32' && (
              <div className="w-full h-full bg-[#161b22] border-r border-[#30363d] text-xs font-mono overflow-y-auto">
                <div className="h-9 px-3 flex items-center border-b border-[#30363d] text-[#8b949e] font-semibold text-[11px] tracking-wide uppercase">
                  ESP32 Tools
                </div>
                {ESP32_TOOLS.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => actions.setActiveNavTab(tool.id)}
                    className={`w-full text-left px-3 py-1.5 transition-colors ${
                      state.activeNavTab === tool.id
                        ? 'bg-[#21262d] text-[#58a6ff] border-l-2 border-[#58a6ff]'
                        : 'text-[#c9d1d9] hover:bg-[#21262d]/50 hover:text-white'
                    }`}
                  >
                    {tool.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sidebar Vertical Splitter Handle */}
        {hasSidebar && (
          <div
            onMouseDown={handleSidebarResizeStart}
            onDoubleClick={() => setSidebarWidth(260)}
            className="w-1.5 hover:w-2 active:w-2 bg-[#30363d]/50 hover:bg-[#58a6ff] active:bg-[#58a6ff] cursor-col-resize transition-all z-20 flex-shrink-0 border-r border-[#30363d]"
            title="Drag to resize sidebar (Double-click to reset 260px)"
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {state.activeNavTab === 'devices' ? (
            <DeviceManager />
          ) : state.activeNavTab === 'templates' ? (
            <TemplateGallery />
          ) : state.activeNavTab === 'git-graph' ? (
            <GitGraphView />
          ) : state.activeNavTab === 'pinout' ? (
            <PinoutViewer />
          ) : state.activeNavTab === 'freertos' ? (
            <FreeRtosMonitor />
          ) : state.activeNavTab === 'ota' ? (
            <OtaDeployer />
          ) : state.activeNavTab === 'libraries' ? (
            <LibraryManager />
          ) : state.activeNavTab === 'build' ? (
            <CloudBuildManager />
          ) : state.activeNavTab === 'sync' ? (
            <SyncView />
          ) : state.activeNavTab === 'settings' ? (
            <SettingsView />
          ) : state.activeNavTab === 'extensions' ? (
            <ExtensionsMarketplace />
          ) : (
            <>
              {/* Primary Code Editor & Multi-Format Viewers */}
              <div
                ref={editorContainerRef}
                className={`flex-1 flex overflow-hidden relative ${fileDragOver ? 'ring-2 ring-inset ring-[#58a6ff] bg-[#1f6feb]/10' : ''}`}
                style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
                onDragOver={(e) => {
                  if (!isFileDrag(e)) return;
                  e.preventDefault();
                  setFileDragOver(true);
                }}
                onDragLeave={(e) => e.currentTarget === e.target && setFileDragOver(false)}
                onDrop={(e) => void onEditorDrop(e)}
              >
                {state.splitFilePath ? (
                  <>
                    {/* Left Split Pane */}
                    <div style={{ width: `${splitRatio * 100}%` }} className="h-full flex overflow-hidden">
                      <EditorGroup
                        activePath={state.activeFilePath}
                      />
                    </div>

                    {/* Splitter Divider Handle */}
                    <div
                      onMouseDown={handleSplitResizeStart}
                      onDoubleClick={() => setSplitRatio(0.5)}
                      className="w-1.5 hover:w-2 active:w-2 bg-[#30363d]/60 hover:bg-[#58a6ff] active:bg-[#58a6ff] cursor-col-resize transition-all z-20 flex-shrink-0 border-x border-[#30363d]"
                      title="Drag to resize split panes (Double-click to center 50/50)"
                    />

                    {/* Right Split Pane */}
                    <div style={{ width: `${(1 - splitRatio) * 100}%` }} className="h-full flex overflow-hidden">
                      <EditorGroup
                        activePath={state.splitFilePath}
                        isSecondary={true}
                      />
                    </div>
                  </>
                ) : (
                  <EditorGroup
                    activePath={state.activeFilePath}
                  />
                )}

                {/* AI Copilot Panel with Splitter */}
                {state.isAiPanelOpen && (
                  <>
                    <div
                      onMouseDown={handleAiResizeStart}
                      onDoubleClick={() => setAiPanelWidth(360)}
                      className="w-1.5 hover:w-2 active:w-2 bg-[#30363d]/60 hover:bg-[#58a6ff] active:bg-[#58a6ff] cursor-col-resize transition-all z-20 flex-shrink-0 border-l border-[#30363d]"
                      title="Drag to resize AI Assistant (Double-click to reset 360px)"
                    />
                    <div style={{ width: `${aiPanelWidth}px` }} className="h-full flex-shrink-0 flex overflow-hidden max-w-[calc(100vw-48px)]">
                      <AiAssistantPanel />
                    </div>
                  </>
                )}
              </div>

              {/* Bottom Panel Vertical Splitter Handle */}
              {showPanel && (
                <div
                  onMouseDown={handleBottomResizeStart}
                  onDoubleClick={() => setBottomPanelHeight(240)}
                  className="h-1.5 hover:h-2 active:h-2 bg-[#30363d]/60 hover:bg-[#58a6ff] active:bg-[#58a6ff] cursor-row-resize transition-all z-20 flex-shrink-0 border-t border-[#30363d]"
                  title="Drag to resize bottom panel (Double-click to reset 240px)"
                />
              )}

              {/* Bottom Docked Panel (Terminal, Problems, Output, Serial, Plotter) */}
              {showPanel && (
                <div
                  style={{
                    backgroundColor: palette.bgSidebar,
                    borderColor: palette.border,
                    height: `${bottomPanelHeight}px`,
                  }}
                  className="border-t flex flex-col flex-shrink-0 overflow-hidden"
                >
                  {/* Panel Tab Header */}
                  <div
                    style={{ borderColor: palette.border }}
                    className="h-8 border-b px-2 sm:px-3 flex items-center justify-between text-[11px] select-none"
                  >
                    <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto whitespace-nowrap min-w-0 pr-2">
                      <button
                        onClick={() => actions.setBottomPanelTab('problems')}
                        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded transition-colors ${
                          state.bottomPanelTab === 'problems'
                            ? 'bg-[#21262d] text-[#58a6ff] font-semibold'
                            : 'text-[#8b949e] hover:text-white'
                        }`}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Problems ({state.codeDiagnostics.length})</span>
                      </button>

                      <button
                        onClick={() => actions.setBottomPanelTab('terminal')}
                        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded transition-colors ${
                          state.bottomPanelTab === 'terminal'
                            ? 'bg-[#21262d] text-[#58a6ff] font-semibold'
                            : 'text-[#8b949e] hover:text-white'
                        }`}
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>PlatformIO Terminal</span>
                      </button>

                      <button
                        onClick={() => actions.setBottomPanelTab('build')}
                        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded transition-colors ${
                          state.bottomPanelTab === 'build'
                            ? 'bg-[#21262d] text-[#58a6ff] font-semibold'
                            : 'text-[#8b949e] hover:text-white'
                        }`}
                      >
                        <Hammer className="w-3.5 h-3.5" />
                        <span>Output</span>
                      </button>

                      <button
                        onClick={() => actions.setBottomPanelTab('serial')}
                        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded transition-colors ${
                          state.bottomPanelTab === 'serial'
                            ? 'bg-[#21262d] text-[#58a6ff] font-semibold'
                            : 'text-[#8b949e] hover:text-white'
                        }`}
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Serial Monitor</span>
                      </button>

                      <button
                        onClick={() => actions.setBottomPanelTab('plotter')}
                        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded transition-colors ${
                          state.bottomPanelTab === 'plotter'
                            ? 'bg-[#21262d] text-[#58a6ff] font-semibold'
                            : 'text-[#8b949e] hover:text-white'
                        }`}
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Serial Plotter</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={toggleMaximizePanel}
                        className="text-[#8b949e] hover:text-white p-1 rounded"
                        title={isPanelMaximized ? 'Restore Panel Height' : 'Maximize Panel'}
                      >
                        {isPanelMaximized ? (
                          <Minimize2 className="w-3.5 h-3.5" />
                        ) : (
                          <Maximize2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => actions.setBottomPanelTab('closed')}
                        className="text-[#8b949e] hover:text-white p-1 rounded"
                        title="Hide Panel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Panel Content */}
                  <div className="flex-1 overflow-hidden">
                    {state.bottomPanelTab === 'problems' && <ProblemsPanel />}
                    {state.bottomPanelTab === 'terminal' && <PioTerminal />}
                    {state.bottomPanelTab === 'build' && <BuildPanel />}
                    {state.bottomPanelTab === 'serial' && <SerialMonitor />}
                    {state.bottomPanelTab === 'plotter' && <SerialPlotter />}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom VS Code Status Bar */}
      {!zen && state.editorSettings.showStatusBar && <StatusBar />}

      {/* Sync Dialog Modal */}
      <SyncModal />

      {/* User Cloud Account Modal */}
      <AuthModal />

      {/* Mini Feature Tour */}
      <WelcomeTour />

      {/* Command Palette (Ctrl+K / Ctrl+Shift+P) */}
      <CommandPalette />

      {/* VS Code workbench overlays: toasts / notification center, modal dialog, input box */}
      <Notifications />
      <InputBox />
      <Dialog />
    </div>
  );
};

export default App;
