import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { THEME_PALETTES } from '../themeTokens';
import { MonacoEditor } from './MonacoEditor';
import { MarkdownViewer } from './viewers/MarkdownViewer';
import { PdfViewer } from './viewers/PdfViewer';
import { CsvViewer } from './viewers/CsvViewer';
import { JsonViewer } from './viewers/JsonViewer';
import { BinaryViewer } from './viewers/BinaryViewer';
import { ImagePreview } from './viewers/ImagePreview';
import { FileIcon } from './FileIcon';
import {
  Columns2,
  X,
  ChevronRight,
  Sparkles,
  Download,
  Code,
} from 'lucide-react';

interface EditorGroupProps {
  activePath: string;
  onCursorChange?: (line: number, col: number) => void;
  isSecondary?: boolean;
}

export const EditorGroup: React.FC<EditorGroupProps> = ({
  activePath,
  onCursorChange,
  isSecondary = false,
}) => {
  const [state, actions] = useWorkspaceStore();
  const palette = THEME_PALETTES[state.theme] || THEME_PALETTES['github-dark'];

  const file = state.project.files[activePath];
  const content = file?.content || '';
  const lowerPath = activePath.toLowerCase();

  // Extension prompt check
  const fileExt = '.' + (activePath.split('.').pop() || '').toLowerCase();
  const matchingExt = state.extensions.find((e) => e.fileExtensions.includes(fileExt));

  const pathParts = activePath.split('/');

  const [tabMenu, setTabMenu] = useState<{ x: number; y: number; path: string } | null>(null);
  const [dragTab, setDragTab] = useState<string | null>(null);

  // Dismiss the tab context menu on any outside click or Escape
  useEffect(() => {
    if (!tabMenu) return;
    const close = () => setTabMenu(null);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('click', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [tabMenu]);

  const selectTab = (tabPath: string) => {
    if (isSecondary) actions.setSplitFilePath(tabPath);
    else actions.setActiveFilePath(tabPath);
  };

  const tabMenuItems: { label: string; run: (path: string) => void }[] = [
    { label: 'Close', run: actions.closeTab },
    { label: 'Close Others', run: actions.closeOtherTabs },
    { label: 'Close All', run: actions.closeAllTabs },
    { label: 'Split Right', run: actions.setSplitFilePath },
    { label: 'Copy Path', run: (path) => void navigator.clipboard.writeText(path) },
  ];

  // Render viewer based on file format
  const renderViewer = () => {
    if (lowerPath.endsWith('.md') || lowerPath.endsWith('.markdown')) {
      return <MarkdownViewer content={content} filePath={activePath} />;
    }
    if (lowerPath.endsWith('.pdf')) {
      return <PdfViewer filePath={activePath} />;
    }
    if (lowerPath.endsWith('.csv')) {
      return <CsvViewer content={content} filePath={activePath} />;
    }
    if (lowerPath.endsWith('.json')) {
      return <JsonViewer content={content} filePath={activePath} />;
    }
    if (lowerPath.endsWith('.bin') || lowerPath.endsWith('.hex') || lowerPath.endsWith('.elf')) {
      return <BinaryViewer content={content} filePath={activePath} />;
    }
    if (
      lowerPath.endsWith('.svg') ||
      lowerPath.endsWith('.png') ||
      lowerPath.endsWith('.jpg') ||
      lowerPath.endsWith('.jpeg') ||
      lowerPath.endsWith('.webp')
    ) {
      return <ImagePreview content={content} filePath={activePath} />;
    }

    // Default to Monaco Editor
    return (
      <MonacoEditor
        filePath={activePath}
        content={content}
        onCursorChange={onCursorChange}
        isPrimary={!isSecondary}
      />
    );
  };

  return (
    <div
      style={{ backgroundColor: palette.bgMain, borderColor: palette.border }}
      className="flex-1 flex flex-col h-full overflow-hidden select-none font-mono text-xs"
    >
      {/* Editor Tabs Bar */}
      <div
        style={{ backgroundColor: palette.bgSidebar, borderColor: palette.border }}
        className="h-9 border-b flex items-center justify-between overflow-x-auto select-none"
      >
        <div className="flex items-center h-full overflow-x-auto">
          {state.openTabs.map((tabPath) => {
            const isActive = activePath === tabPath;
            const fileName = tabPath.split('/').pop() || tabPath;
            const isDirty = state.dirtyFiles.includes(tabPath);

            return (
              <div
                key={tabPath}
                title={tabPath}
                onClick={() => selectTab(tabPath)}
                onAuxClick={(e) => {
                  // Middle-click closes the tab
                  if (e.button === 1) {
                    e.preventDefault();
                    actions.closeTab(tabPath);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setTabMenu({ x: e.clientX, y: e.clientY, path: tabPath });
                }}
                draggable
                onDragStart={() => setDragTab(tabPath)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragTab) actions.moveTab(dragTab, tabPath);
                  setDragTab(null);
                }}
                style={{
                  backgroundColor: isActive ? palette.bgMain : 'transparent',
                  color: isActive ? palette.accent : palette.textMuted,
                  borderRightColor: palette.border,
                  borderTopColor: isActive ? palette.accent : 'transparent',
                }}
                className={`h-full px-3 flex items-center space-x-2 border-r cursor-pointer transition-colors ${
                  isActive ? 'border-t-2 font-semibold' : 'hover:bg-black/20'
                }`}
              >
                <FileIcon filename={fileName} className="w-3.5 h-3.5" />
                <span className="truncate max-w-[130px]">{fileName}</span>
                {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Unsaved changes (Ctrl+S)"></span>}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.closeTab(tabPath);
                  }}
                  className="hover:text-rose-400 p-0.5 rounded text-[10px]"
                  title="Close Tab"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Tab Right Controls: Split Editor, Format, AI */}
        <div className="flex items-center space-x-1.5 px-2">
          <button
            onClick={actions.toggleSplitEditor}
            className={`p-1 rounded hover:bg-white/10 transition-colors ${
              state.splitFilePath ? 'text-[#58a6ff] bg-[#58a6ff]/15' : 'text-[#8b949e] hover:text-white'
            }`}
            title={state.splitFilePath ? "Close Split Editor" : "Split Editor Right"}
          >
            <Columns2 className="w-3.5 h-3.5" />
          </button>

          {isSecondary && (
            <button
              onClick={() => actions.setSplitFilePath(null)}
              className="p-1 rounded hover:bg-white/10 text-[#8b949e] hover:text-rose-400"
              title="Close this split editor pane"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={actions.formatCurrentCode}
            className="p-1 rounded hover:bg-white/10 text-amber-400 hover:text-amber-300"
            title="Format Document (Shift+Alt+F)"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recommended Extension Prompt Banner (VS Code Style) */}
      {matchingExt && !matchingExt.installed && (
        <div className="bg-[#1f6feb]/15 border-b border-[#1f6feb]/40 px-3 py-1 flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-2">
            <span className="text-sm">{matchingExt.icon}</span>
            <span className="text-[#c9d1d9]">
              Install recommended extension <strong className="text-white">'{matchingExt.displayName}'</strong> for <code className="text-[#58a6ff]">{fileExt}</code> support?
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => actions.installExtension(matchingExt.id, false)}
              className="flex items-center space-x-1 px-2.5 py-0.5 rounded bg-[#1f6feb] hover:bg-[#388bfd] text-white font-semibold text-[10px] shadow-sm"
            >
              <Download className="w-3 h-3" />
              <span>Install Extension</span>
            </button>
            <button
              onClick={() => actions.setActiveNavTab('extensions')}
              className="px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white text-[10px]"
            >
              Marketplace
            </button>
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div
        style={{ backgroundColor: palette.bgMain, borderColor: palette.border }}
        className="h-7 border-b px-3 flex items-center justify-between text-[11px] text-[#8b949e]"
      >
        <div className="flex items-center space-x-1">
          <Code className="w-3 h-3 text-[#58a6ff]" />
          <span>{state.targetBoard}</span>
          {pathParts.map((part, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-2.5 h-2.5 opacity-50" />
              <span style={{ color: idx === pathParts.length - 1 ? palette.text : palette.textMuted }}>
                {part}
              </span>
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center space-x-2 text-[10px]">
          <span style={{ color: palette.accent }}>{state.project.metadata.framework}</span>
          <span>•</span>
          <span>{state.activeDevice.chipFamily}</span>
        </div>
      </div>

      {/* Primary Viewer Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {file ? (
          renderViewer()
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-2 text-[#8b949e]">
            <Code className="w-10 h-10 opacity-30" />
            <div>Go to File <kbd className="px-1 rounded bg-[#21262d] text-[#c9d1d9]">Ctrl+P</kbd></div>
            <div>Show All Commands <kbd className="px-1 rounded bg-[#21262d] text-[#c9d1d9]">Ctrl+Shift+P</kbd></div>
            <div>Find in Files <kbd className="px-1 rounded bg-[#21262d] text-[#c9d1d9]">Ctrl+Shift+F</kbd></div>
          </div>
        )}
      </div>

      {/* Tab Right-Click Menu */}
      {tabMenu && (
        <div
          style={{ top: tabMenu.y, left: tabMenu.x }}
          className="fixed bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl py-1 z-50 text-[11px] text-[#c9d1d9] w-36"
        >
          {tabMenuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => item.run(tabMenu.path)}
              className="w-full text-left px-3 py-1 hover:bg-[#1f6feb] hover:text-white"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
