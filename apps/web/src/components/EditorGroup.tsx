import React, { useState, useEffect } from 'react';
import { useWorkspaceStore, WELCOME_TAB } from '../stores/useWorkspaceStore';
import { Breadcrumbs } from './Breadcrumbs';
import { WelcomePage } from './WelcomePage';
import { THEME_PALETTES } from '../themeTokens';
import { MonacoEditor } from './MonacoEditor';
import { MarkdownViewer } from './viewers/MarkdownViewer';
import { PdfViewer } from './viewers/PdfViewer';
import { CsvViewer } from './viewers/CsvViewer';
import { JsonViewer } from './viewers/JsonViewer';
import { BinaryViewer } from './viewers/BinaryViewer';
import { ImagePreview } from './viewers/ImagePreview';
import { FileIcon } from './FileIcon';
import { Columns2, X, Sparkles, Download } from 'lucide-react';

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

  const tabsRef = React.useRef<HTMLDivElement>(null);

  // Keep the active tab visible when many tabs overflow the bar
  useEffect(() => {
    tabsRef.current?.querySelector(`[data-tab="${CSS.escape(activePath)}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activePath]);

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

  // Each editor group has its own tabs; actions below apply to this group only
  const group: 0 | 1 = isSecondary ? 1 : 0;
  const groupTabs = isSecondary ? state.splitTabs : state.openTabs;
  const isActiveGroup = !state.splitFilePath || state.activeGroup === group;

  const selectTab = (tabPath: string) => {
    if (isSecondary) actions.setSplitFilePath(tabPath);
    else {
      actions.setActiveGroup(0);
      actions.openFile(tabPath);
    }
  };

  const closeTabs = (paths: string[]) => void actions.requestCloseTabs(paths, group);
  const tabMenuItems: ({ label: string; hint?: string; run: (path: string) => void; hidden?: (path: string) => boolean } | null)[] = [
    { label: 'Close', hint: 'Ctrl+W', run: (p) => closeTabs([p]) },
    { label: 'Close Others', run: (p) => actions.closeOtherTabs(p, group) },
    { label: 'Close to the Right', run: (p) => actions.closeTabsToTheRight(p, group) },
    { label: 'Close Saved', run: () => closeTabs(groupTabs.filter((t) => !state.dirtyFiles.includes(t))) },
    { label: 'Close All', run: () => actions.closeAllTabs(group) },
    null,
    { label: 'Keep Open', run: actions.pinTab, hidden: (p) => isSecondary || state.previewTab !== p },
    { label: 'Split Right', hint: 'Ctrl+\\', run: actions.setSplitFilePath, hidden: (p) => isSecondary || p === WELCOME_TAB },
    {
      label: 'Move to Left Group',
      run: (p) => {
        actions.closeTab(p, 1);
        actions.setActiveGroup(0);
        actions.openFile(p);
      },
      hidden: () => !isSecondary,
    },
    null,
    { label: 'Copy Path', run: (p) => void navigator.clipboard.writeText(p), hidden: (p) => p === WELCOME_TAB },
    {
      label: 'Reveal in Explorer View',
      run: (p) => {
        actions.setSidebarView('explorer');
        actions.openFile(p);
      },
      hidden: (p) => p === WELCOME_TAB,
    },
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
      // Clicking anywhere in a group (tabs, viewers, editor) makes it the focused group
      onMouseDownCapture={() => actions.setActiveGroup(group)}
    >
      {/* Editor Tabs Bar */}
      {state.editorSettings.showTabs && <div
        style={{ backgroundColor: palette.bgSidebar, borderColor: palette.border }}
        className="h-9 border-b flex items-center justify-between overflow-hidden select-none flex-shrink-0"
      >
        <div ref={tabsRef} className="flex items-center h-full overflow-x-auto scrollbar-none">
          {groupTabs.map((tabPath) => {
            const isActive = activePath === tabPath;
            const isWelcome = tabPath === WELCOME_TAB;
            const fileName = isWelcome ? 'Welcome' : tabPath.split('/').pop() || tabPath;
            const isDirty = state.dirtyFiles.includes(tabPath);
            const isPreview = !isSecondary && state.previewTab === tabPath;

            return (
              <div
                key={tabPath}
                data-tab={tabPath}
                title={isWelcome ? 'Welcome' : `${tabPath}${isPreview ? ' (preview, double-click to keep open)' : ''}`}
                onClick={() => selectTab(tabPath)}
                onDoubleClick={() => !isSecondary && actions.pinTab(tabPath)}
                onAuxClick={(e) => {
                  // Middle-click closes the tab
                  if (e.button === 1) {
                    e.preventDefault();
                    closeTabs([tabPath]);
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
                  if (dragTab) actions.moveTab(dragTab, tabPath, group);
                  setDragTab(null);
                }}
                style={{
                  backgroundColor: isActive ? palette.bgMain : 'transparent',
                  // The active tab of an unfocused group is dimmed, like VS Code
                  color: isActive ? (isActiveGroup ? palette.accent : palette.text) : palette.textMuted,
                  borderRightColor: palette.border,
                  borderTopColor: isActive && isActiveGroup ? palette.accent : 'transparent',
                }}
                className={`h-full px-3 flex items-center space-x-2 border-r cursor-pointer transition-colors ${
                  isActive ? 'border-t-2 font-semibold' : 'hover:bg-black/20'
                }`}
              >
                <FileIcon filename={isWelcome ? 'welcome.md' : fileName} className="w-3.5 h-3.5" />
                <span className={`truncate max-w-[130px] ${isPreview ? 'italic' : ''}`}>{fileName}</span>
                {/* VS Code shows the dirty dot in place of the close button until hovered */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTabs([tabPath]);
                  }}
                  className="group/close w-4 h-4 flex items-center justify-center rounded hover:bg-white/10"
                  title={isDirty ? 'Unsaved changes (Ctrl+S). Close' : 'Close (Ctrl+W)'}
                >
                  {isDirty && <span className="w-2 h-2 rounded-full bg-amber-400 group-hover/close:hidden" title="Unsaved changes (Ctrl+S)" />}
                  <X className={`w-3 h-3 ${isDirty ? 'hidden group-hover/close:block' : ''}`} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Tab Right Controls: Split Editor, Format, AI */}
        <div className="flex items-center space-x-1.5 px-2">
          {!isSecondary && !state.splitFilePath && (
            <button
              onClick={actions.toggleSplitEditor}
              className="p-1 rounded hover:bg-white/10 transition-colors text-[#8b949e] hover:text-white"
              title="Split Editor Right (Ctrl+\)"
            >
              <Columns2 className="w-3.5 h-3.5" />
            </button>
          )}

          {isSecondary && (
            <button
              onClick={() => void actions.requestCloseTabs([...state.splitTabs], 1)}
              className="p-1 rounded hover:bg-white/10 text-[#8b949e] hover:text-white"
              title="Close Group"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => void actions.formatCurrentCode()}
            className="p-1 rounded hover:bg-white/10 text-amber-400 hover:text-amber-300"
            title="Format Document (Shift+Alt+F)"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>}

      {/* Recommended Extension Prompt Banner (VS Code Style) */}
      {file && matchingExt && !matchingExt.installed && (
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
      {state.editorSettings.showBreadcrumbs && file && <Breadcrumbs path={activePath} showSymbols={isActiveGroup} />}

      {/* Primary Viewer Area: the file, or the Welcome page when nothing is open */}
      <div className="flex-1 flex overflow-hidden relative">{file ? renderViewer() : <WelcomePage />}</div>

      {/* Tab Right-Click Menu */}
      {tabMenu && (
        <div
          style={{ top: tabMenu.y, left: tabMenu.x }}
          className="fixed bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl py-1 z-50 text-[12px] font-sans text-[#c9d1d9] w-56"
        >
          {tabMenuItems.map((item, i) =>
            item === null ? (
              <div key={`sep${i}`} className="my-1 border-t border-[#30363d]" />
            ) : item.hidden?.(tabMenu.path) ? null : (
              <button
                key={item.label}
                onClick={() => item.run(tabMenu.path)}
                className="w-full text-left px-3 py-1 flex justify-between hover:bg-[#1f6feb] hover:text-white"
              >
                <span>{item.label}</span>
                {item.hint && <span className="opacity-60">{item.hint}</span>}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};
