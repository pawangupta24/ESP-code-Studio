import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { formatShortcut } from '../utils/platform';
import { runEditorAction } from '../editorBridge';
import {
  FilePlus,
  FolderPlus,
  FolderOpen,
  Save,
  Download,
  X,
  Undo2,
  Redo2,
  Scissors,
  Copy,
  Clipboard,
  Search,
  Sparkles,
  CheckSquare,
  Command,
  Terminal,
  AlertCircle,
  Eye,
  ZoomIn,
  ZoomOut,
  ArrowLeft,
  ArrowRight,
  Play,
  Zap,
  RotateCcw,
  Radio,
  BookOpen,
  Info,
  Activity,
  Cpu,
  Layers,
  Bot,
  Columns2,
  Settings,
  Palette,
} from 'lucide-react';

interface MenuItem {
  label: string;
  shortcut?: string;
  icon?: React.FC<{ className?: string }>;
  action?: () => void;
  separator?: boolean;
  disabled?: boolean;
}

interface MenuCategory {
  id: string;
  label: string;
  items: MenuItem[];
}

export const TopMenuBar: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handlePromptCreateFile = () => {
    const filename = prompt('Enter new file path (e.g. src/sensors.h):');
    if (filename && filename.trim()) {
      actions.createFile(filename.trim(), '// Header file created in ESP Studio\n#pragma once\n');
    }
  };

  const handlePromptCreateFolder = () => {
    const folder = prompt('Enter new folder name (e.g. include/drivers):');
    if (folder && folder.trim()) {
      actions.createFile(`${folder.trim()}/.gitkeep`, '');
    }
  };

  const handleSaveAs = () => {
    const current = state.project.files[state.activeFilePath];
    if (!current) return;
    const target = prompt('Save a copy as:', state.activeFilePath)?.trim();
    if (!target || target === state.activeFilePath) return;
    if (state.project.files[target]) {
      alert(`"${target}" already exists.`);
      return;
    }
    actions.createFile(target, current.content);
  };

  const edit = (actionId: string) => () => runEditorAction(actionId);

  const menuCategories: MenuCategory[] = [
    {
      id: 'file',
      label: 'File',
      items: [
        { label: 'New File...', shortcut: 'Ctrl+N', icon: FilePlus, action: handlePromptCreateFile },
        { label: 'New Folder...', icon: FolderPlus, action: handlePromptCreateFolder },
        { label: 'Open File...', shortcut: 'Ctrl+P', icon: FolderOpen, action: () => actions.setCommandPaletteOpen(true, '') },
        { separator: true, label: '' },
        { label: 'Save', shortcut: 'Ctrl+S', icon: Save, action: () => actions.saveFile() },
        { label: 'Save As...', icon: Save, action: handleSaveAs },
        { label: 'Save All', shortcut: 'Ctrl+Shift+S', icon: Save, action: actions.saveAllFiles },
        { separator: true, label: '' },
        { label: 'Export Project as ZIP', icon: Download, action: actions.exportProjectZip },
        { separator: true, label: '' },
        {
          label: 'Preferences: Settings',
          shortcut: 'Ctrl+,',
          icon: Settings,
          action: () => actions.setActiveNavTab('settings'),
        },
        {
          label: 'Preferences: Keyboard Shortcuts',
          shortcut: 'Ctrl+K Ctrl+S',
          icon: Command,
          action: () => actions.setActiveNavTab('settings'),
        },
        {
          label: 'Preferences: Color Theme',
          shortcut: 'Ctrl+K Ctrl+T',
          icon: Palette,
          action: () => actions.setActiveNavTab('settings'),
        },
        { separator: true, label: '' },
        {
          label: 'Close Editor',
          shortcut: 'Ctrl+W',
          icon: X,
          action: () => actions.closeTab(state.activeFilePath),
        },
        {
          label: 'Close All Tabs',
          icon: X,
          action: actions.closeAllTabs,
        },
      ],
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z', icon: Undo2, action: edit('undo') },
        { label: 'Redo', shortcut: 'Ctrl+Y', icon: Redo2, action: edit('redo') },
        { separator: true, label: '' },
        { label: 'Cut', shortcut: 'Ctrl+X', icon: Scissors, action: edit('editor.action.clipboardCutAction') },
        { label: 'Copy', shortcut: 'Ctrl+C', icon: Copy, action: edit('editor.action.clipboardCopyAction') },
        { label: 'Paste', shortcut: 'Ctrl+V', icon: Clipboard, action: edit('editor.action.clipboardPasteAction') },
        { separator: true, label: '' },
        { label: 'Find in File', shortcut: 'Ctrl+F', icon: Search, action: edit('actions.find') },
        { label: 'Replace in File', shortcut: 'Ctrl+H', icon: Search, action: edit('editor.action.startFindReplaceAction') },
        { label: 'Find in All Workspace Files', shortcut: 'Ctrl+Shift+F', icon: Search, action: () => actions.setSidebarView('search') },
        { separator: true, label: '' },
        { label: 'Toggle Line Comment', shortcut: 'Ctrl+/', action: edit('editor.action.commentLine') },
        { separator: true, label: '' },
        { label: 'Format Document', shortcut: 'Shift+Alt+F', icon: Sparkles, action: actions.formatCurrentCode },
      ],
    },
    {
      id: 'selection',
      label: 'Selection',
      items: [
        { label: 'Select All', shortcut: 'Ctrl+A', icon: CheckSquare, action: edit('editor.action.selectAll') },
        { label: 'Expand Selection', shortcut: 'Shift+Alt+Right', action: edit('editor.action.smartSelect.expand') },
        { label: 'Shrink Selection', shortcut: 'Shift+Alt+Left', action: edit('editor.action.smartSelect.shrink') },
        { separator: true, label: '' },
        { label: 'Copy Line Up', shortcut: 'Shift+Alt+Up', action: edit('editor.action.copyLinesUpAction') },
        { label: 'Copy Line Down', shortcut: 'Shift+Alt+Down', action: edit('editor.action.copyLinesDownAction') },
        { label: 'Move Line Up', shortcut: 'Alt+Up', action: edit('editor.action.moveLinesUpAction') },
        { label: 'Move Line Down', shortcut: 'Alt+Down', action: edit('editor.action.moveLinesDownAction') },
        { separator: true, label: '' },
        { label: 'Add Cursor Above', shortcut: 'Ctrl+Alt+Up', action: edit('editor.action.insertCursorAbove') },
        { label: 'Add Cursor Below', shortcut: 'Ctrl+Alt+Down', action: edit('editor.action.insertCursorBelow') },
        { label: 'Add Next Occurrence', shortcut: 'Ctrl+D', action: edit('editor.action.addSelectionToNextFindMatch') },
      ],
    },
    {
      id: 'view',
      label: 'View',
      items: [
        { label: 'Command Palette...', shortcut: 'Ctrl+Shift+P', icon: Command, action: () => actions.setCommandPaletteOpen(true) },
        { separator: true, label: '' },
        { label: 'Explorer', shortcut: 'Ctrl+Shift+E', icon: Layers, action: () => actions.setSidebarView('explorer') },
        { label: 'Search & Replace', shortcut: 'Ctrl+Shift+F', icon: Search, action: () => actions.setSidebarView('search') },
        { label: 'Source Control (Git)', shortcut: 'Ctrl+Shift+G', icon: Radio, action: () => actions.setSidebarView('git') },
        { label: 'Run & Hardware Debug', shortcut: 'Ctrl+Shift+D', icon: Cpu, action: () => actions.setSidebarView('debug') },
        { label: 'Extensions Marketplace', shortcut: 'Ctrl+Shift+X', icon: Layers, action: () => actions.setActiveNavTab('extensions') },
        { separator: true, label: '' },
        { label: 'Problems Diagnostics', shortcut: 'Ctrl+Shift+M', icon: AlertCircle, action: () => actions.setBottomPanelTab('problems') },
        { label: 'Build Output', icon: Terminal, action: () => actions.setBottomPanelTab('build') },
        { label: 'PlatformIO Terminal', shortcut: 'Ctrl+`', icon: Terminal, action: () => actions.setBottomPanelTab('terminal') },
        { label: 'Serial Monitor', icon: Terminal, action: () => actions.setBottomPanelTab('serial') },
        { label: 'Waveform Plotter', icon: Activity, action: () => actions.setBottomPanelTab('plotter') },
        { separator: true, label: '' },
        { label: 'Toggle Split Editor', shortcut: 'Ctrl+\\', icon: Columns2, action: actions.toggleSplitEditor },
        { label: 'Toggle AI Copilot Assistant', icon: Bot, action: actions.toggleAiPanel },
        {
          label: `Minimap: ${state.editorSettings.minimap ? 'Shown' : 'Hidden'}`,
          icon: Eye,
          action: () => actions.setEditorSettings({ minimap: !state.editorSettings.minimap }),
        },
        {
          label: `Word Wrap: ${state.editorSettings.wordWrap ? 'On' : 'Off'}`,
          action: () => actions.setEditorSettings({ wordWrap: !state.editorSettings.wordWrap }),
        },
        { separator: true, label: '' },
        { label: 'Settings', shortcut: 'Ctrl+,', icon: Settings, action: () => actions.setActiveNavTab('settings') },
        { separator: true, label: '' },
        { label: 'Zoom In', shortcut: 'Ctrl+=', icon: ZoomIn, action: actions.zoomIn },
        { label: 'Zoom Out', shortcut: 'Ctrl+-', icon: ZoomOut, action: actions.zoomOut },
        { label: 'Reset Zoom', shortcut: 'Ctrl+0', action: actions.resetZoom },
      ],
    },
    {
      id: 'go',
      label: 'Go',
      items: [
        {
          label: 'Back',
          shortcut: 'Alt+Left',
          icon: ArrowLeft,
          action: () => {
            const idx = state.openTabs.indexOf(state.activeFilePath);
            if (idx > 0) actions.setActiveFilePath(state.openTabs[idx - 1]);
          },
        },
        {
          label: 'Forward',
          shortcut: 'Alt+Right',
          icon: ArrowRight,
          action: () => {
            const idx = state.openTabs.indexOf(state.activeFilePath);
            if (idx < state.openTabs.length - 1) actions.setActiveFilePath(state.openTabs[idx + 1]);
          },
        },
        { separator: true, label: '' },
        { label: 'Go to File...', shortcut: 'Ctrl+P', icon: FolderOpen, action: () => actions.setCommandPaletteOpen(true, '') },
        { label: 'Go to Line/Column...', shortcut: 'Ctrl+G', action: edit('editor.action.gotoLine') },
        { separator: true, label: '' },
        { label: 'Next Problem', shortcut: 'F8', icon: AlertCircle, action: edit('editor.action.marker.next') },
        { label: 'Previous Problem', shortcut: 'Shift+F8', icon: AlertCircle, action: edit('editor.action.marker.prev') },
      ],
    },
    {
      id: 'run',
      label: 'Run',
      items: [
        { label: 'Build Firmware (PlatformIO)', shortcut: 'Ctrl+B', icon: Play, action: actions.triggerBuild },
        { label: 'Upload / Flash USB (esptool)', shortcut: 'Ctrl+U', icon: Zap, action: actions.triggerFlash },
        { label: 'Start Debugging & Monitor', shortcut: 'F5', icon: Play, action: actions.toggleSerialConnection },
        { separator: true, label: '' },
        { label: 'OTA Wireless Firmware Deploy', icon: Radio, action: () => actions.setActiveNavTab('ota') },
        { label: 'Clean Build Cache & Outputs', icon: RotateCcw, action: actions.clearSerialLogs },
        { separator: true, label: '' },
        {
          label: `Compilation Engine: ${state.buildEngineMode.toUpperCase()}`,
          action: () => actions.setBuildEngineMode(state.buildEngineMode === 'cloud' ? 'local' : 'cloud'),
        },
      ],
    },
    {
      id: 'terminal',
      label: 'Terminal',
      items: [
        { label: 'New Terminal', shortcut: 'Ctrl+Shift+`', icon: Terminal, action: () => actions.setBottomPanelTab('terminal') },
        { label: 'Open Serial Terminal', icon: Terminal, action: () => actions.setBottomPanelTab('serial') },
        { label: 'Open Real-Time Plotter', icon: Activity, action: () => actions.setBottomPanelTab('plotter') },
        { separator: true, label: '' },
        { label: 'Connect / Disconnect Serial', icon: Radio, action: actions.toggleSerialConnection },
        { label: 'Clear Serial Logs', icon: X, action: actions.clearSerialLogs },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        { label: 'Welcome Feature Tour', icon: Sparkles, action: () => actions.setTourOpen(true) },
        { label: 'Documentation & PRD', icon: BookOpen, action: () => actions.openTab('docs/PRODUCT_REQUIREMENTS.md') },
        { label: 'Architecture & Developer Guide', icon: BookOpen, action: () => actions.openTab('ARCHITECTURE.md') },
        { label: 'Keyboard Shortcuts Reference', shortcut: 'Ctrl+K Ctrl+S', icon: Command, action: () => actions.setActiveNavTab('settings') },
        { separator: true, label: '' },
        { label: 'ESP32-S3 Hardware Pinout', icon: Cpu, action: () => actions.setActiveNavTab('pinout') },
        { label: 'FreeRTOS Task Monitor', icon: Activity, action: () => actions.setActiveNavTab('freertos') },
        { label: 'Cloud & Local Sync Status', icon: Radio, action: () => actions.setSyncModalOpen(true) },
        { separator: true, label: '' },
        {
          label: 'About ESP Studio',
          icon: Info,
          action: () => {
            alert('ESP Studio v0.1.0\nA Hybrid Embedded Development Platform for ESP32 & ESP32-S3\nPlatform: Web & Desktop (Tauri 2)\nLicense: Apache-2.0');
          },
        },
      ],
    },
  ];

  const handleMenuClick = (id: string) => {
    setOpenMenu(openMenu === id ? null : id);
  };

  const handleMenuMouseEnter = (id: string) => {
    // If any menu is already open, hovering over adjacent menus opens them (standard OS behavior)
    if (openMenu !== null) {
      setOpenMenu(id);
    }
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled || item.separator) return;
    setOpenMenu(null);
    if (item.action) {
      item.action();
    }
  };

  return (
    <div ref={containerRef} className="relative flex items-center select-none font-sans text-xs">
      {/* Top Menu Bar Buttons Row */}
      <div className="flex items-center space-x-0.5">
        {menuCategories.map((cat) => {
          const isOpen = openMenu === cat.id;

          return (
            <div key={cat.id} className="relative">
              <button
                onClick={() => handleMenuClick(cat.id)}
                onMouseEnter={() => handleMenuMouseEnter(cat.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-normal transition-colors cursor-pointer ${
                  isOpen
                    ? 'bg-[#30363d] text-white'
                    : 'text-[#c9d1d9] hover:bg-[#21262d] hover:text-white'
                }`}
              >
                {cat.label}
              </button>

              {/* Dropdown Menu Popup */}
              {isOpen && (
                <div className="absolute left-0 top-full mt-1 min-w-[240px] bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {cat.items.map((item, idx) => {
                    if (item.separator) {
                      return <div key={idx} className="my-1 border-t border-[#30363d]" />;
                    }

                    const Icon = item.icon;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleItemClick(item)}
                        disabled={item.disabled}
                        className={`w-full px-3 py-1 flex items-center justify-between text-left text-[11px] font-mono transition-colors ${
                          item.disabled
                            ? 'opacity-40 cursor-not-allowed text-[#8b949e]'
                            : 'hover:bg-[#1f6feb] hover:text-white text-[#c9d1d9] cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          {Icon ? (
                            <Icon className="w-3.5 h-3.5 text-[#8b949e] group-hover:text-white flex-shrink-0" />
                          ) : (
                            <span className="w-3.5" />
                          )}
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.shortcut && (
                          <span className="text-[10px] text-[#8b949e] group-hover:text-white/80 ml-4 font-sans flex-shrink-0">
                            {formatShortcut(item.shortcut)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
