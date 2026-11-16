import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { getDefaultSerialPort, formatShortcut, getModifierKey } from '../utils/platform';
import { TopMenuBar } from './TopMenuBar';
import {
  Play,
  Zap,
  Terminal,
  Activity,
  Cloud,
  Laptop,
  RefreshCw,
  Command,
  Cpu,
  Bot,
  Download,
  MoreVertical,
  HelpCircle,
  Search,
} from 'lucide-react';

export const Header: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const syncColor = {
    SYNCED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    CONFLICT: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    OFFLINE: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  }[state.syncStatus];

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-[#161b22] border-b border-[#30363d] select-none text-xs font-mono relative z-30 flex-shrink-0">
      {/* =========================================================================
          ROW 1: VS Code Custom Title Bar (File, Edit, Selection, View, Go, Run...)
         ========================================================================= */}
      <div className="h-8 px-2 sm:px-3 border-b border-[#21262d] flex items-center justify-between">
        {/* Left: Brand Icon & Top Menu Bar */}
        <div className="flex items-center space-x-2 min-w-0">
          {/* Brand Icon */}
          <div
            onClick={() => actions.setActiveNavTab('explorer')}
            className="flex items-center space-x-1.5 cursor-pointer flex-shrink-0"
            title="ESP Studio — Embedded IDE"
          >
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center font-bold text-[10px] text-white shadow-sm">
              ESP
            </div>
          </div>

          {/* VS Code Classic Menus: File Edit Selection View Go Run Terminal Help */}
          <div className="overflow-x-auto scrollbar-none flex-shrink min-w-0">
            <TopMenuBar />
          </div>
        </div>

        {/* Center: Quick Command / File Bar (VS Code Center Search) */}
        <div
          onClick={() => actions.setCommandPaletteOpen(true)}
          className="hidden md:flex items-center space-x-2 px-3 py-0.5 rounded bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff] cursor-pointer text-[#8b949e] text-[11px] max-w-sm truncate transition-colors shadow-sm"
          title={`Quick Search & Command Palette (${getModifierKey()}+P)`}
        >
          <Search className="w-3 h-3 text-[#58a6ff] flex-shrink-0" />
          <span className="truncate text-white/90">
            {state.project.metadata.name} <span className="text-[#8b949e]">—</span> {state.activeFilePath}
          </span>
          <span className="text-[10px] text-[#8b949e] bg-[#21262d] px-1 py-0.2 rounded font-sans flex-shrink-0">
            {getModifierKey()}+P
          </span>
        </div>

        {/* Right: Cloud Sync, Tour, Account & Responsive Overflow */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          {/* Cloud Sync Status */}
          <button
            onClick={() => actions.setSyncModalOpen(true)}
            className={`hidden sm:flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] border cursor-pointer hover:opacity-80 transition-opacity ${syncColor}`}
            title="Local-First Cloud Sync Status"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>{state.syncStatus}</span>
          </button>

          {/* Feature Tour (Desktop) */}
          <button
            onClick={() => actions.setTourOpen(true)}
            className="hidden lg:flex items-center space-x-1 px-2 py-0.5 rounded bg-[#0d1117] hover:bg-[#21262d] text-amber-400 border border-[#30363d] text-[10px]"
            title="Take a Mini Feature Tour"
          >
            <span>✨ Tour</span>
          </button>

          {/* User Account / Guest Mode Badge */}
          {state.isLoggedIn ? (
            <div
              onClick={() => actions.setAuthModalOpen(true)}
              className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] cursor-pointer"
              title={`${state.user.name} (${state.user.plan}) - Click to manage account`}
            >
              <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[8px] font-bold">
                ES
              </div>
              <span className="text-emerald-400 font-semibold text-[9px] uppercase tracking-wider hidden sm:inline">
                {state.user.plan.includes('Pro') ? 'PRO' : 'CLOUD'}
              </span>
            </div>
          ) : (
            <button
              onClick={() => actions.setAuthModalOpen(true)}
              className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-amber-300 border border-amber-500/40 text-[10px] font-semibold transition-all shadow-sm"
              title="Running in Local Guest Mode. Click to sign in or connect cloud."
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Guest</span>
            </button>
          )}

          {/* Mobile Overflow Menu */}
          <div className="lg:hidden relative" ref={menuRef}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 rounded bg-[#0d1117] hover:bg-[#21262d] text-[#8b949e] hover:text-white border border-[#30363d]"
              title="More Actions"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {mobileMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl p-1.5 space-y-1 z-50 text-[11px]">
                <button
                  onClick={() => {
                    actions.exportProjectZip();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded hover:bg-[#21262d] text-[#58a6ff] text-left"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Project ZIP</span>
                </button>

                <button
                  onClick={() => {
                    actions.setCommandPaletteOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded hover:bg-[#21262d] text-[#c9d1d9] text-left"
                >
                  <Command className="w-3.5 h-3.5" />
                  <span>Command Palette ({getModifierKey()}+K)</span>
                </button>

                <button
                  onClick={() => {
                    actions.setSyncModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded hover:bg-[#21262d] text-emerald-400 text-left"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Status ({state.syncStatus})</span>
                </button>

                <button
                  onClick={() => {
                    actions.setTourOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded hover:bg-[#21262d] text-amber-400 text-left"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Feature Tour</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: Embedded Hardware & Compilation Action Bar
         ========================================================================= */}
      <div className="h-9 px-2 sm:px-3 flex items-center justify-between text-[11px] overflow-x-auto scrollbar-none">
        {/* Left: Board Target, Framework & Engine Toggle */}
        <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
          {/* Board Target Selector */}
          <div className="flex items-center space-x-1 bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]">
            <Cpu className="w-3.5 h-3.5 text-[#58a6ff] flex-shrink-0" />
            <select
              value={state.targetBoard}
              onChange={(e) => actions.setTargetBoard(e.target.value)}
              className="bg-transparent text-white outline-none cursor-pointer text-[11px] truncate max-w-[130px] sm:max-w-none"
            >
              <option value="ESP32-S3-DevKitC-1">ESP32-S3 DevKitC-1</option>
              <option value="ESP32-WROOM-32">ESP32-WROOM-32</option>
              <option value="ESP32-C3-DevKitM-1">ESP32-C3 DevKitM-1</option>
              <option value="ESP32-C6-DevKitC-1">ESP32-C6 DevKitC-1</option>
            </select>
          </div>

          {/* Framework Selector */}
          <select
            value={state.framework}
            onChange={(e) => actions.setFramework(e.target.value as 'arduino' | 'espidf')}
            className="hidden sm:block bg-[#0d1117] text-[#8b949e] hover:text-white px-2 py-0.5 rounded border border-[#30363d] outline-none text-[11px] cursor-pointer"
          >
            <option value="arduino">Arduino Core</option>
            <option value="espidf">ESP-IDF v5.1</option>
          </select>

          {/* Cloud / Local Compilation Engine Toggle */}
          <div className="flex items-center bg-[#0d1117] p-0.5 rounded border border-[#30363d]">
            <button
              onClick={() => actions.setBuildEngineMode('cloud')}
              className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                state.buildEngineMode === 'cloud'
                  ? 'bg-[#1f6feb] text-white font-semibold shadow-sm'
                  : 'text-[#8b949e] hover:text-white'
              }`}
              title="Cloud Compilation via Docker Workers"
            >
              <Cloud className="w-3 h-3" />
              <span className="hidden md:inline">Cloud</span>
            </button>
            <button
              onClick={() => actions.setBuildEngineMode('local')}
              className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                state.buildEngineMode === 'local'
                  ? 'bg-[#238636] text-white font-semibold shadow-sm'
                  : 'text-[#8b949e] hover:text-white'
              }`}
              title="Local Compilation via PlatformIO Core"
            >
              <Laptop className="w-3 h-3" />
              <span className="hidden md:inline">Local</span>
            </button>
          </div>
        </div>

        {/* Center: Device Pill & Compilation / Flashing Controls */}
        <div className="flex items-center space-x-1.5 flex-shrink-0 mx-2">
          {/* Device ID & Port Pill */}
          <div
            onClick={() => actions.setActiveNavTab('devices')}
            className="hidden xl:flex items-center space-x-1.5 px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] cursor-pointer hover:border-[#58a6ff] transition-colors"
            title="Click to view hardware specs & NVS identity"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-white font-bold">{state.activeDevice.deviceId}</span>
            <span className="text-[#8b949e]">({getDefaultSerialPort()})</span>
          </div>

          {/* Build Action */}
          <button
            onClick={actions.triggerBuild}
            disabled={state.isBuilding}
            className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded font-semibold transition-all shadow-sm ${
              state.isBuilding
                ? 'bg-blue-900/60 text-blue-300 border border-blue-700 cursor-wait'
                : 'bg-[#238636] hover:bg-[#2ea043] text-white'
            }`}
            title={`Build Firmware (${formatShortcut('Ctrl+B')})`}
          >
            {state.isBuilding ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
            <span>{state.isBuilding ? 'Compiling...' : 'Build'}</span>
          </button>

          {/* Flash USB Action */}
          <button
            onClick={actions.triggerFlash}
            disabled={state.isFlashing}
            className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded font-semibold transition-all shadow-sm ${
              state.isFlashing
                ? 'bg-amber-900/60 text-amber-300 border border-amber-700 cursor-wait'
                : 'bg-[#1f6feb] hover:bg-[#388bfd] text-white'
            }`}
            title={`Flash USB using esptool (${formatShortcut('Ctrl+U')})`}
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>{state.isFlashing ? `${state.flashProgress?.percentage || 0}%` : 'Flash USB'}</span>
          </button>

          {/* Serial Terminal Toggle */}
          <button
            onClick={actions.toggleSerialConnection}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded border transition-colors ${
              state.isSerialConnected
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700 hover:bg-emerald-900'
                : 'bg-[#0d1117] text-[#c9d1d9] border-[#30363d] hover:bg-[#21262d]'
            }`}
            title="Open Serial Terminal"
          >
            <Terminal className="w-3 h-3" />
            <span className="hidden sm:inline">{state.isSerialConnected ? 'Connected' : 'Serial'}</span>
          </button>

          {/* Waveform Plotter Toggle */}
          <button
            onClick={() => actions.setBottomPanelTab('plotter')}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded border transition-colors ${
              state.bottomPanelTab === 'plotter'
                ? 'bg-[#58a6ff]/20 text-[#58a6ff] border-[#58a6ff]/50'
                : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:text-white'
            }`}
            title="Live Telemetry Waveform Plotter"
          >
            <Activity className="w-3 h-3" />
            <span className="hidden md:inline">Plotter</span>
          </button>
        </div>

        {/* Right: AI Copilot, Export ZIP & Shortcuts */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          {/* AI Copilot Toggle */}
          <button
            onClick={actions.toggleAiPanel}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded border text-[10px] transition-colors ${
              state.isAiPanelOpen
                ? 'bg-purple-950/80 text-purple-300 border-purple-700 shadow-sm'
                : 'bg-[#0d1117] text-[#c9d1d9] border-[#30363d] hover:bg-[#21262d]'
            }`}
            title="Toggle Embedded AI Copilot (Claude, Gemini, GPT-4o, DeepSeek)"
          >
            <Bot className="w-3 h-3 text-purple-400" />
            <span>AI Copilot</span>
          </button>

          {/* Export Project ZIP */}
          <button
            onClick={actions.exportProjectZip}
            className="hidden sm:flex items-center space-x-1 px-2 py-0.5 rounded bg-[#0d1117] hover:bg-[#21262d] text-[#58a6ff] border border-[#30363d] text-[10px] transition-colors"
            title="Export workspace as standard PKZIP archive"
          >
            <Download className="w-3 h-3" />
            <span>Export ZIP</span>
          </button>

          {/* Command Palette Button */}
          <button
            onClick={() => actions.setCommandPaletteOpen(true)}
            className="hidden lg:flex items-center space-x-1 px-1.5 py-0.5 rounded bg-[#0d1117] hover:bg-[#21262d] text-[#8b949e] hover:text-white border border-[#30363d] text-[10px]"
            title={`Command Palette (${getModifierKey()}+K)`}
          >
            <Command className="w-2.5 h-2.5 text-[#58a6ff]" />
            <span>{getModifierKey()}+K</span>
          </button>
        </div>
      </div>
    </header>
  );
};
