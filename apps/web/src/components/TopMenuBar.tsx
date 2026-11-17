import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore, focusedPath } from '../stores/useWorkspaceStore';
import { formatShortcut } from '../utils/platform';
import { runEditorAction } from '../editorBridge';
import { pickColorTheme, pickLanguageMode, pickNewFileLanguage } from '../quickPicks';
import { readTextFiles } from '../utils/fileImport';
import { Check, ChevronRight } from 'lucide-react';

interface MenuItem {
  label: string;
  shortcut?: string;
  action?: () => void;
  checked?: boolean;
  disabled?: boolean;
  submenu?: MenuItem[];
  separator?: boolean;
}

const SEP: MenuItem = { label: '', separator: true };
const REPO_URL = 'https://github.com/pawangupta24/ESP-code-Studio';
// A folder picked from disk arrives as "folderName/sub/file"; drop the folder name
const pathInFolder = (f: File) => ((f as any).webkitRelativePath || f.name).split('/').slice(1).join('/');

export const TopMenuBar: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [subOpen, setSubOpen] = useState<number | null>(null);
  const [subIdx, setSubIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const s = state.editorSettings;
  const current = focusedPath(state); // file in the focused editor group
  const currentGroup: 0 | 1 = state.activeGroup === 1 && state.splitFilePath ? 1 : 0;
  const edit = (id: string) => () => runEditorAction(id);
  const toggle = (key: keyof typeof s) => () => actions.setEditorSettings({ [key]: !s[key] });
  const showPanel = (tab: typeof state.bottomPanelTab) => () => actions.setBottomPanelTab(tab);
  const view = (v: string) => () => {
    actions.setSidebarView(v);
    actions.setActiveNavTab(v === 'extensions' ? 'extensions' : 'explorer');
  };
  const nextEditor = (delta: number) => () => {
    const tabs = currentGroup === 1 ? state.splitTabs : state.openTabs;
    if (tabs.length > 1) actions.openFile(tabs[(tabs.indexOf(current) + delta + tabs.length) % tabs.length]);
  };

  const pathExists = (p: string) =>
    !!state.project.files[p] || Object.keys(state.project.files).some((f) => f.startsWith(p + '/'));

  const handleNewFolder = async () => {
    const folder = (
      await actions.showInputBox({
        prompt: 'Folder name',
        placeholder: 'e.g. include/drivers',
        value: '',
        validate: (v) => (!v.trim() ? null : pathExists(v.trim()) ? `A file or folder ${v.trim()} already exists.` : null),
      })
    )?.trim();
    if (folder) {
      actions.createFile(`${folder}/.gitkeep`, '', false);
      actions.setSidebarView('explorer');
    }
  };

  const handleSaveAs = async () => {
    const file = state.project.files[current];
    if (!file) return;
    const target = (
      await actions.showInputBox({
        prompt: 'Save a copy of the file as',
        value: current,
        selectBaseName: true,
        validate: (v) => (v.trim() && v.trim() !== current && state.project.files[v.trim()] ? `${v.trim()} already exists.` : null),
      })
    )?.trim();
    if (target && target !== current) actions.createFile(target, file.content);
  };

  const onFilesPicked = async (e: React.ChangeEvent<HTMLInputElement>, asFolder: boolean) => {
    const input = e.target;
    if (!input.files?.length) return;
    const picked = Array.from(input.files);
    input.value = '';
    const { files, skipped } = await readTextFiles(picked, asFolder ? pathInFolder : (f) => f.name);
    const count = Object.keys(files).length;
    if (count === 0) {
      actions.notify('warning', 'No text files to open. Binary files, build folders and files over 2 MB are skipped.');
      return;
    }
    if (asFolder) {
      const root = ((picked[0] as any).webkitRelativePath || 'workspace').split('/')[0];
      const choice = await actions.showDialog({
        severity: 'warning',
        message: `Open folder '${root}'?`,
        detail: `${count} file(s)${skipped ? `, ${skipped} skipped` : ''}. This replaces the current workspace; export it as a ZIP first if you want to keep it.`,
        buttons: ['Open Folder', 'Cancel'],
      });
      if (choice === 0) actions.importFiles(files, root);
    } else {
      const existing = Object.keys(files).filter((p) => state.project.files[p]);
      if (existing.length) {
        const choice = await actions.showDialog({
          severity: 'warning',
          message: existing.length === 1 ? `Replace '${existing[0]}'?` : `Replace ${existing.length} existing files?`,
          detail: existing.join('\n'),
          buttons: ['Replace', 'Cancel'],
        });
        if (choice !== 0) return;
      }
      actions.importFiles(files);
    }
    if (skipped) actions.notify('warning', `${skipped} file(s) skipped (binary, build output or larger than 2 MB).`);
  };

  const recent = state.recentFiles.filter((p) => state.project.files[p]);

  const menus: { label: string; items: MenuItem[] }[] = [
    {
      label: 'File',
      items: [
        { label: 'New Text File', shortcut: 'Ctrl+Alt+N', action: () => actions.newUntitledFile() },
        { label: 'New File...', action: () => pickNewFileLanguage(actions) },
        { label: 'New Folder...', action: () => void handleNewFolder() },
        SEP,
        { label: 'Open File...', shortcut: 'Ctrl+O', action: () => fileInputRef.current?.click() },
        { label: 'Open Folder...', action: () => folderInputRef.current?.click() },
        {
          label: 'Open Recent',
          submenu: recent.length
            ? [...recent.map((p) => ({ label: p, action: () => actions.openFile(p) })), SEP, { label: 'Clear Recently Opened', action: () => actions.clearRecentFiles() }]
            : [{ label: 'No recent files', disabled: true }],
        },
        { label: 'Go to File...', shortcut: 'Ctrl+P', action: () => actions.setCommandPaletteOpen(true, '') },
        SEP,
        { label: 'Save', shortcut: 'Ctrl+S', action: () => actions.saveFile(), disabled: !state.project.files[current] },
        { label: 'Save As...', action: () => void handleSaveAs(), disabled: !state.project.files[current] },
        { label: 'Save All', shortcut: 'Ctrl+Shift+S', action: actions.saveAllFiles, disabled: state.dirtyFiles.length === 0 },
        SEP,
        { label: 'Auto Save', checked: s.autoSave === 'afterDelay', action: () => actions.setEditorSettings({ autoSave: s.autoSave === 'off' ? 'afterDelay' : 'off' }) },
        {
          label: 'Preferences',
          submenu: [
            { label: 'Settings', shortcut: 'Ctrl+,', action: () => actions.openSettings() },
            { label: 'Extensions', shortcut: 'Ctrl+Shift+X', action: view('extensions') },
            { label: 'Keyboard Shortcuts', shortcut: 'Ctrl+K Ctrl+S', action: () => actions.openSettings('keybindings') },
            SEP,
            { label: 'Color Theme', shortcut: 'Ctrl+K Ctrl+T', action: () => pickColorTheme(state, actions) },
          ],
        },
        SEP,
        { label: 'Revert File', action: () => actions.revertFile(), disabled: !state.dirtyFiles.includes(current) },
        { label: 'Close Editor', shortcut: 'Ctrl+W', action: () => void actions.requestCloseTabs([current], currentGroup), disabled: !current },
        { label: 'Close All Editors', action: actions.closeAllTabs, disabled: state.openTabs.length === 0 },
        SEP,
        { label: 'Export Project as ZIP...', action: actions.exportProjectZip },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z', action: edit('undo') },
        { label: 'Redo', shortcut: 'Ctrl+Y', action: edit('redo') },
        SEP,
        { label: 'Cut', shortcut: 'Ctrl+X', action: edit('editor.action.clipboardCutAction') },
        { label: 'Copy', shortcut: 'Ctrl+C', action: edit('editor.action.clipboardCopyAction') },
        { label: 'Paste', shortcut: 'Ctrl+V', action: edit('editor.action.clipboardPasteAction') },
        SEP,
        { label: 'Find', shortcut: 'Ctrl+F', action: edit('actions.find') },
        { label: 'Replace', shortcut: 'Ctrl+H', action: edit('editor.action.startFindReplaceAction') },
        SEP,
        { label: 'Find in Files', shortcut: 'Ctrl+Shift+F', action: view('search') },
        SEP,
        { label: 'Toggle Line Comment', shortcut: 'Ctrl+/', action: edit('editor.action.commentLine') },
        { label: 'Toggle Block Comment', shortcut: 'Shift+Alt+A', action: edit('editor.action.blockComment') },
        SEP,
        { label: 'Format Document', shortcut: 'Shift+Alt+F', action: () => void actions.formatCurrentCode() },
        { label: 'Change Language Mode...', shortcut: 'Ctrl+K M', action: () => pickLanguageMode(state, actions), disabled: !state.project.files[current] },
      ],
    },
    {
      label: 'Selection',
      items: [
        { label: 'Select All', shortcut: 'Ctrl+A', action: edit('editor.action.selectAll') },
        { label: 'Expand Selection', shortcut: 'Shift+Alt+Right', action: edit('editor.action.smartSelect.expand') },
        { label: 'Shrink Selection', shortcut: 'Shift+Alt+Left', action: edit('editor.action.smartSelect.shrink') },
        SEP,
        { label: 'Copy Line Up', shortcut: 'Shift+Alt+Up', action: edit('editor.action.copyLinesUpAction') },
        { label: 'Copy Line Down', shortcut: 'Shift+Alt+Down', action: edit('editor.action.copyLinesDownAction') },
        { label: 'Move Line Up', shortcut: 'Alt+Up', action: edit('editor.action.moveLinesUpAction') },
        { label: 'Move Line Down', shortcut: 'Alt+Down', action: edit('editor.action.moveLinesDownAction') },
        { label: 'Duplicate Selection', action: edit('editor.action.duplicateSelection') },
        SEP,
        { label: 'Add Cursor Above', shortcut: 'Ctrl+Alt+Up', action: edit('editor.action.insertCursorAbove') },
        { label: 'Add Cursor Below', shortcut: 'Ctrl+Alt+Down', action: edit('editor.action.insertCursorBelow') },
        { label: 'Add Cursors to Line Ends', shortcut: 'Shift+Alt+I', action: edit('editor.action.insertCursorAtEndOfEachLineSelected') },
        { label: 'Add Next Occurrence', shortcut: 'Ctrl+D', action: edit('editor.action.addSelectionToNextFindMatch') },
        { label: 'Select All Occurrences', shortcut: 'Ctrl+Shift+L', action: edit('editor.action.selectHighlights') },
      ],
    },
    {
      label: 'View',
      items: [
        { label: 'Command Palette...', shortcut: 'Ctrl+Shift+P', action: () => actions.setCommandPaletteOpen(true) },
        SEP,
        {
          label: 'Appearance',
          submenu: [
            { label: 'Full Screen', shortcut: 'F11', checked: state.isFullScreen, action: actions.toggleFullScreen },
            { label: 'Zen Mode', shortcut: 'Ctrl+K Z', checked: state.zenMode, action: actions.toggleZenMode },
            SEP,
            { label: 'Primary Side Bar', checked: !!state.sidebarView, action: () => actions.setSidebarView(state.sidebarView ? '' : 'explorer') },
            { label: 'Activity Bar', checked: s.showActivityBar, action: toggle('showActivityBar') },
            { label: 'Status Bar', checked: s.showStatusBar, action: toggle('showStatusBar') },
            { label: 'ESP Toolbar', checked: s.showToolbar, action: toggle('showToolbar') },
            { label: 'Panel', shortcut: 'Ctrl+J', checked: state.bottomPanelTab !== 'closed', action: () => actions.setBottomPanelTab(state.bottomPanelTab === 'closed' ? 'terminal' : 'closed') },
            SEP,
            { label: 'Minimap', checked: s.minimap, action: toggle('minimap') },
            { label: 'Breadcrumbs', checked: s.showBreadcrumbs, action: toggle('showBreadcrumbs') },
            { label: 'Sticky Scroll', checked: s.stickyScroll, action: toggle('stickyScroll') },
            { label: 'Editor Tabs', checked: s.showTabs, action: toggle('showTabs') },
            { label: 'Render Whitespace', checked: s.renderWhitespace === 'all', action: () => actions.setEditorSettings({ renderWhitespace: s.renderWhitespace === 'all' ? 'selection' : 'all' }) },
            SEP,
            { label: 'Zoom In', shortcut: 'Ctrl+=', action: actions.zoomIn },
            { label: 'Zoom Out', shortcut: 'Ctrl+-', action: actions.zoomOut },
            { label: 'Reset Zoom', shortcut: 'Ctrl+0', action: actions.resetZoom },
          ],
        },
        {
          label: 'Editor Layout',
          submenu: [
            { label: 'Split Right', shortcut: 'Ctrl+\\', checked: !!state.splitFilePath, action: actions.toggleSplitEditor },
            { label: 'Single', action: () => actions.setSplitFilePath(null), disabled: !state.splitFilePath },
          ],
        },
        SEP,
        { label: 'Explorer', shortcut: 'Ctrl+Shift+E', action: view('explorer') },
        { label: 'Search', shortcut: 'Ctrl+Shift+F', action: view('search') },
        { label: 'Source Control', shortcut: 'Ctrl+Shift+G', action: view('git') },
        { label: 'Run and Debug', shortcut: 'Ctrl+Shift+D', action: view('debug') },
        { label: 'Extensions', shortcut: 'Ctrl+Shift+X', action: view('extensions') },
        SEP,
        { label: 'Problems', shortcut: 'Ctrl+Shift+M', action: showPanel('problems') },
        { label: 'Output', action: showPanel('build') },
        { label: 'Terminal', shortcut: 'Ctrl+`', action: showPanel('terminal') },
        { label: 'Serial Monitor', action: showPanel('serial') },
        { label: 'Serial Plotter', action: showPanel('plotter') },
        SEP,
        { label: 'AI Copilot', shortcut: 'Ctrl+Shift+A', checked: state.isAiPanelOpen, action: actions.toggleAiPanel },
        { label: 'Word Wrap', shortcut: 'Alt+Z', checked: s.wordWrap, action: toggle('wordWrap') },
      ],
    },
    {
      label: 'Go',
      items: [
        {
          label: 'Back',
          shortcut: 'Alt+Left',
          action: actions.goBack,
          disabled: state.navIndex <= 0,
        },
        {
          label: 'Forward',
          shortcut: 'Alt+Right',
          action: actions.goForward,
          disabled: state.navIndex >= state.navHistory.length - 1,
        },
        SEP,
        {
          label: 'Switch Editor',
          submenu: [
            { label: 'Next Editor', shortcut: 'Ctrl+PageDown', action: nextEditor(1) },
            { label: 'Previous Editor', shortcut: 'Ctrl+PageUp', action: nextEditor(-1) },
          ],
        },
        SEP,
        { label: 'Go to File...', shortcut: 'Ctrl+P', action: () => actions.setCommandPaletteOpen(true, '') },
        { label: 'Go to Symbol in Editor...', shortcut: 'Ctrl+Shift+O', action: edit('editor.action.quickOutline') },
        SEP,
        { label: 'Go to Definition', shortcut: 'F12', action: edit('editor.action.revealDefinition') },
        { label: 'Go to References', shortcut: 'Shift+F12', action: edit('editor.action.goToReferences') },
        SEP,
        { label: 'Go to Line/Column...', shortcut: 'Ctrl+G', action: edit('editor.action.gotoLine') },
        { label: 'Go to Bracket', shortcut: 'Ctrl+Shift+\\', action: edit('editor.action.jumpToBracket') },
        SEP,
        { label: 'Next Problem', shortcut: 'F8', action: edit('editor.action.marker.next') },
        { label: 'Previous Problem', shortcut: 'Shift+F8', action: edit('editor.action.marker.prev') },
      ],
    },
    {
      label: 'Run',
      items: [
        { label: 'Build Firmware', shortcut: 'Ctrl+B', action: () => void actions.triggerBuild(), disabled: state.isBuilding },
        { label: 'Upload / Flash Firmware', shortcut: 'Ctrl+U', action: () => void actions.triggerFlash(), disabled: state.isFlashing },
        {
          label: state.isSerialConnected ? 'Stop Serial Monitor' : 'Start Serial Monitor',
          shortcut: 'F5',
          action: () => void actions.toggleSerialConnection(),
        },
        SEP,
        { label: 'OTA Wireless Deploy...', action: () => actions.setActiveNavTab('ota') },
        { label: 'Clean Build Outputs', action: actions.cleanBuild },
        SEP,
        {
          label: 'Build Engine',
          submenu: [
            { label: 'Cloud', checked: state.buildEngineMode === 'cloud', action: () => actions.setBuildEngineMode('cloud') },
            { label: 'Local (PlatformIO)', checked: state.buildEngineMode === 'local', action: () => actions.setBuildEngineMode('local') },
          ],
        },
      ],
    },
    {
      label: 'Terminal',
      items: [
        { label: 'New Terminal', shortcut: 'Ctrl+Shift+`', action: showPanel('terminal') },
        { label: 'Run Build Task...', shortcut: 'Ctrl+Shift+B', action: () => void actions.triggerBuild() },
        SEP,
        { label: 'Serial Monitor', action: showPanel('serial') },
        { label: 'Serial Plotter', action: showPanel('plotter') },
        { label: state.isSerialConnected ? 'Disconnect Serial' : 'Connect Serial', action: () => void actions.toggleSerialConnection() },
        { label: 'Clear Serial Output', action: actions.clearSerialLogs },
      ],
    },
    {
      label: 'Help',
      items: [
        { label: 'Welcome', action: actions.openWelcome },
        { label: 'Feature Tour', action: () => actions.setTourOpen(true) },
        { label: 'Show All Commands', shortcut: 'Ctrl+Shift+P', action: () => actions.setCommandPaletteOpen(true) },
        { label: 'Documentation', action: () => window.open(`${REPO_URL}#readme`, '_blank', 'noopener') },
        { label: 'Keyboard Shortcuts Reference', shortcut: 'Ctrl+K Ctrl+S', action: () => actions.openSettings('keybindings') },
        SEP,
        { label: 'Report Issue', action: () => window.open(`${REPO_URL}/issues/new`, '_blank', 'noopener') },
        { label: 'View on GitHub', action: () => window.open(REPO_URL, '_blank', 'noopener') },
        SEP,
        {
          label: 'About',
          action: () =>
            void actions.showDialog({
              message: 'ESP Studio',
              detail: `Version: 0.1.0\nEditor: Monaco 0.45\nBrowser: ${navigator.userAgent.match(/(Chrome|Edg|Firefox|Safari)\/[\d.]+/)?.[0] ?? 'unknown'}\nLicense: Apache-2.0`,
              buttons: ['Copy', 'OK'],
            }).then((i) => {
              if (i === 0) void navigator.clipboard.writeText('ESP Studio 0.1.0 (Monaco 0.45)');
            }),
        },
      ],
    },
  ];

  const close = () => {
    setOpenMenu(null);
    setActiveIdx(-1);
    setSubOpen(null);
    setSubIdx(-1);
  };

  const open = (idx: number, focusFirst = false) => {
    setOpenMenu(idx);
    setActiveIdx(focusFirst ? menus[idx].items.findIndex((i) => !i.separator) : -1);
    setSubOpen(null);
    setSubIdx(-1);
  };

  const run = (item: MenuItem) => {
    if (item.disabled || item.separator || item.submenu) return;
    close();
    item.action?.();
  };

  const step = (items: MenuItem[], from: number, delta: number) => {
    for (let i = 1; i <= items.length; i++) {
      const idx = (from + delta * i + items.length * 2) % items.length;
      if (!items[idx].separator) return idx;
    }
    return from;
  };

  // Ctrl+O from the global shortcut handler
  useEffect(() => {
    const openFile = () => fileInputRef.current?.click();
    const openFolder = () => folderInputRef.current?.click();
    window.addEventListener('esp-studio:open-file', openFile);
    window.addEventListener('esp-studio:open-folder', openFolder);
    return () => {
      window.removeEventListener('esp-studio:open-file', openFile);
      window.removeEventListener('esp-studio:open-folder', openFolder);
    };
  }, []);

  // Close on outside click; keyboard navigation while open; Alt+<letter> opens a menu
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (openMenu === null) {
        if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && /^[a-z]$/i.test(e.key)) {
          const idx = menus.findIndex((m) => m.label[0].toLowerCase() === e.key.toLowerCase());
          if (idx >= 0) {
            e.preventDefault();
            e.stopPropagation();
            open(idx, true);
          }
        }
        return;
      }
      const items = menus[openMenu].items;
      const sub = subOpen !== null ? items[subOpen].submenu! : null;
      const handled = () => {
        e.preventDefault();
        e.stopPropagation();
      };
      switch (e.key) {
        case 'Escape':
          handled();
          if (sub) {
            setSubOpen(null);
            setSubIdx(-1);
          } else close();
          break;
        case 'ArrowDown':
          handled();
          if (sub) setSubIdx(step(sub, subIdx, 1));
          else setActiveIdx(step(items, activeIdx, 1));
          break;
        case 'ArrowUp':
          handled();
          if (sub) setSubIdx(step(sub, subIdx < 0 ? 0 : subIdx, -1));
          else setActiveIdx(step(items, activeIdx < 0 ? 0 : activeIdx, -1));
          break;
        case 'ArrowRight':
          handled();
          if (!sub && items[activeIdx]?.submenu) {
            setSubOpen(activeIdx);
            setSubIdx(items[activeIdx].submenu!.findIndex((i) => !i.separator));
          } else open((openMenu + 1) % menus.length, true);
          break;
        case 'ArrowLeft':
          handled();
          if (sub) {
            setSubOpen(null);
            setSubIdx(-1);
          } else open((openMenu - 1 + menus.length) % menus.length, true);
          break;
        case 'Enter':
        case ' ': {
          handled();
          const item = sub ? sub[subIdx] : items[activeIdx];
          if (!item) break;
          if (item.submenu && !sub) {
            setSubOpen(activeIdx);
            setSubIdx(item.submenu.findIndex((i) => !i.separator));
          } else run(item);
          break;
        }
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  });

  const renderItems = (items: MenuItem[], active: number, isSub: boolean, parentIdx?: number) =>
    items.map((item, idx) => {
      if (item.separator) return <div key={idx} className="my-1 border-t border-[#30363d]" />;
      const isActive = idx === active || (!isSub && subOpen === idx);
      return (
        <div
          key={idx}
          className="relative"
          onMouseEnter={() => {
            if (isSub) setSubIdx(idx);
            else {
              setActiveIdx(idx);
              setSubOpen(item.submenu ? idx : null);
              setSubIdx(-1);
            }
          }}
        >
          <button
            onClick={() => run(item)}
            disabled={item.disabled}
            className={`w-full pl-2 pr-3 py-1 flex items-center text-left text-[12px] font-sans ${
              item.disabled ? 'text-[#6e7681] cursor-default' : isActive ? 'bg-[#1f6feb] text-white' : 'text-[#c9d1d9]'
            }`}
          >
            <span className="w-5 flex-shrink-0">{item.checked && <Check className="w-3.5 h-3.5" />}</span>
            <span className="flex-1 truncate">{item.label}</span>
            {item.shortcut && <span className="ml-6 text-[11px] opacity-70 flex-shrink-0">{formatShortcut(item.shortcut)}</span>}
            {item.submenu && <ChevronRight className="w-3.5 h-3.5 ml-4 flex-shrink-0" />}
          </button>
          {!isSub && item.submenu && subOpen === idx && parentIdx === undefined && (
            <div className="absolute left-full top-0 -mt-1 min-w-[230px] bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl py-1 z-50">
              {renderItems(item.submenu, subIdx, true, idx)}
            </div>
          )}
        </div>
      );
    });

  return (
    <div ref={containerRef} className="relative flex items-center select-none font-sans text-xs">
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => void onFilesPicked(e, false)} />
      <input
        ref={folderInputRef}
        type="file"
        className="hidden"
        {...({ webkitdirectory: '', directory: '' } as any)}
        onChange={(e) => void onFilesPicked(e, true)}
      />
      <div className="flex items-center" role="menubar">
        {menus.map((menu, idx) => (
          <div key={menu.label} className="relative">
            <button
              onClick={() => (openMenu === idx ? close() : open(idx))}
              onMouseEnter={() => openMenu !== null && openMenu !== idx && open(idx)}
              className={`px-2 py-0.5 rounded text-[12px] ${
                openMenu === idx ? 'bg-[#30363d] text-white' : 'text-[#c9d1d9] hover:bg-[#21262d] hover:text-white'
              }`}
            >
              {menu.label}
            </button>
            {openMenu === idx && (
              <div className="absolute left-0 top-full mt-0.5 min-w-[260px] bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl py-1 z-50">
                {renderItems(menu.items, activeIdx, false)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
