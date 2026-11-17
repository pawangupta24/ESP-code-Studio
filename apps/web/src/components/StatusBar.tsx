import React from 'react';
import { useWorkspaceStore, focusedPath } from '../stores/useWorkspaceStore';
import { THEME_PALETTES } from '../themeTokens';
import { getDefaultSerialPort } from '../utils/platform';
import { runEditorAction, setEndOfLine } from '../editorBridge';
import { detectLanguage, languageName } from '../languages';
import { pickColorTheme, pickLanguageMode, pickTabSize } from '../quickPicks';
import { GitBranch, AlertCircle, AlertTriangle, Cpu, Cloud, Laptop, Bell, BellDot, ZoomIn, Loader2 } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const palette = THEME_PALETTES[state.theme] || THEME_PALETTES['github-dark'];

  const errorCount = state.codeDiagnostics.filter((d) => d.severity === 'error').length;
  const warningCount = state.codeDiagnostics.filter((d) => d.severity === 'warning').length;

  const path = focusedPath(state);
  const file = state.project.files[path];
  const languageLabel = file ? languageName(detectLanguage(path, state.languageOverrides[path])) : '';
  const eol = file?.content.includes('\r\n') ? 'CRLF' : 'LF';
  const { line, col, selected } = state.cursor;
  const unread = state.notifications.length;

  const pickEol = () =>
    actions.showQuickPick({
      placeholder: 'Select End of Line Sequence',
      items: [
        { id: 'LF', label: 'LF', detail: 'Unix / macOS', current: eol === 'LF' },
        { id: 'CRLF', label: 'CRLF', detail: 'Windows', current: eol === 'CRLF' },
      ],
      onPick: (id) => setEndOfLine(path, id === 'CRLF'),
    });

  return (
    <div
      style={{ backgroundColor: palette.bgSidebar, borderColor: palette.border, color: palette.textMuted }}
      className="h-6 border-t px-2 flex items-center justify-between text-[11px] select-none font-mono z-10"
    >
      {/* Left: Git Branch, Problems, Device Target, Connection Status, Engine */}
      <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden">
        {/* Git Branch */}
        <button
          onClick={() => actions.setActiveNavTab('git-graph')}
          className="flex items-center space-x-1 hover:text-white transition-colors flex-shrink-0"
          title="Current Git Branch"
        >
          <GitBranch className="w-3 h-3 text-[#58a6ff]" />
          <span className="font-semibold text-white">{state.currentBranch}</span>
        </button>

        {/* Problems Badge */}
        <button
          onClick={() => actions.setBottomPanelTab('problems')}
          className="flex items-center space-x-2 hover:text-white transition-colors flex-shrink-0"
          title="View Diagnostics"
        >
          <span className="flex items-center space-x-0.5 text-rose-400">
            <AlertCircle className="w-3 h-3" />
            <span>{errorCount}</span>
          </span>
          <span className="flex items-center space-x-0.5 text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            <span>{warningCount}</span>
          </span>
        </button>

        {/* Target Board */}
        <div className="hidden md:flex items-center space-x-1 text-white flex-shrink-0">
          <Cpu className="w-3 h-3 text-[#58a6ff]" />
          <span>{state.targetBoard}</span>
        </div>

        {/* Device COM Port Status */}
        <button
          onClick={() => actions.setActiveNavTab('devices')}
          className="hidden lg:flex items-center space-x-1 text-emerald-400 hover:underline flex-shrink-0"
          title="Connected Device Profile"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{state.activeDevice.deviceId} ({getDefaultSerialPort()})</span>
        </button>

        {/* Cloud / Local Build Mode */}
        <div className="hidden xl:flex items-center space-x-1 text-[#8b949e] flex-shrink-0">
          {state.buildEngineMode === 'cloud' ? (
            <Cloud className="w-3 h-3 text-[#1f6feb]" />
          ) : (
            <Laptop className="w-3 h-3 text-[#238636]" />
          )}
          <span className="capitalize">{state.buildEngineMode} Engine</span>
        </div>
      </div>

      {/* Right: progress, zoom, Line/Col, Spaces, UTF-8, EOL, Language, Theme, notifications */}
      <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
        {/* Long-running work, like VS Code's progress item */}
        {(state.isBuilding || state.isFlashing) && (
          <button onClick={() => actions.setBottomPanelTab(state.isBuilding ? 'build' : 'serial')} className="flex items-center gap-1 text-white">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{state.isBuilding ? 'Building...' : `Flashing ${state.flashProgress?.percentage ?? 0}%`}</span>
          </button>
        )}

        {state.zoomLevel !== 100 && (
          <button onClick={actions.resetZoom} className="flex items-center gap-1 hover:text-white" title="Reset Zoom (Ctrl+0)">
            <ZoomIn className="w-3 h-3" />
            <span>{state.zoomLevel}%</span>
          </button>
        )}

        {file && (
          <>
            <button onClick={() => runEditorAction('editor.action.gotoLine')} className="text-white hover:underline" title="Go to Line/Column (Ctrl+G)">
              Ln {line}, Col {col}
              {selected > 0 && ` (${selected} selected)`}
            </button>
            <button onClick={() => pickTabSize(state, actions)} className="hidden md:inline hover:text-white" title="Select Indentation">
              Spaces: {state.editorSettings.tabSize}
            </button>
            <span className="hidden md:inline">UTF-8</span>
            <button onClick={pickEol} className="hidden md:inline hover:text-white" title="Select End of Line Sequence">
              {eol}
            </button>
          </>
        )}

        {/* Language Mode */}
        {file && (
          <button
            onClick={() => pickLanguageMode(state, actions)}
            style={{ color: palette.accent }}
            className="hover:underline hidden sm:flex items-center space-x-1"
            title="Select Language Mode (Ctrl+K M)"
          >
            <span>{languageLabel}</span>
          </button>
        )}

        {/* Theme Name */}
        <button onClick={() => pickColorTheme(state, actions)} style={{ color: palette.accent }} className="hidden lg:inline hover:underline" title="Color Theme (Ctrl+K Ctrl+T)">
          {palette.name}
        </button>

        {/* Notification center bell */}
        <button
          onClick={() => actions.setNotificationCenterOpen(!state.isNotificationCenterOpen)}
          className="hover:text-white"
          title={unread ? `${unread} notification(s)` : 'No Notifications'}
        >
          {unread ? <BellDot className="w-3.5 h-3.5 text-white" /> : <Bell className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
