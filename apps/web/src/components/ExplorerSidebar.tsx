import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useWorkspaceStore, WELCOME_TAB, focusedPath } from '../stores/useWorkspaceStore';
import { FileIcon } from './FileIcon';
import { detectLanguage, NEW_FILE_TEMPLATES } from '../languages';
import { extractSymbols, symbolPathAt, DocSymbol, SymbolKind } from '../symbols';
import { requestReveal } from '../editorBridge';
import { readTextFiles, isFileDrag } from '../utils/fileImport';
import { ChevronRight, ChevronDown, FilePlus, FolderPlus, ChevronsDownUp, Download, X } from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  isFolder: boolean;
  children?: FileNode[];
}

/** Inline input shown in the tree while creating or renaming (like VS Code). */
type Editing =
  | { kind: 'new-file' | 'new-folder'; parent: string }
  | { kind: 'rename'; path: string; isFolder: boolean };

const INVALID_NAME = /[\\:*?"<>|]/;
const PLACEHOLDER = '.gitkeep'; // keeps an otherwise empty folder alive; hidden in the tree

const KIND_BADGE: Record<SymbolKind, [string, string]> = {
  function: ['ƒ', '#d2a8ff'],
  method: ['m', '#d2a8ff'],
  class: ['C', '#f0883e'],
  struct: ['S', '#f0883e'],
  enum: ['E', '#f0883e'],
  interface: ['I', '#79c0ff'],
  namespace: ['{}', '#8b949e'],
  module: ['M', '#8b949e'],
  heading: ['#', '#79c0ff'],
  section: ['[]', '#e3b341'],
};

const parentOf = (path: string) => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '');
const join = (dir: string, name: string) => (dir ? `${dir}/${name}` : name);

// Defined at module scope so store updates (e.g. cursor moves) don't remount it and lose the text.
const InlineInput: React.FC<{
  padding: number;
  initial: string;
  isFolder: boolean;
  validate: (name: string) => string | null;
  onCommit: (name: string) => void;
  onCancel: () => void;
}> = ({ padding, initial, isFolder, validate, onCommit, onCancel }) => {
  const [value, setValue] = useState(initial);
  const done = useRef(false); // Enter and the blur that follows must commit only once
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const dot = initial.lastIndexOf('.');
    el.setSelectionRange(0, dot > 0 && !isFolder ? dot : initial.length);
  }, []);
  const finish = (commit: boolean) => {
    if (done.current) return;
    done.current = true;
    if (commit) onCommit(value);
    else onCancel();
  };
  const error = value.trim() ? validate(value) : null;
  return (
    <div style={{ paddingLeft: padding }} className="relative py-0.5 pr-2 flex items-center gap-1.5">
      <span className="w-3 flex-shrink-0" />
      <FileIcon filename={value || 'file'} isFolder={isFolder} className="w-3.5 h-3.5 flex-shrink-0" />
      <input
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter' && !error) finish(true);
          if (e.key === 'Escape') finish(false);
        }}
        onBlur={() => finish(!error)}
        className={`flex-1 min-w-0 bg-[#0d1117] border px-1 text-xs text-white outline-none ${error ? 'border-rose-500' : 'border-[#58a6ff]'}`}
      />
      {error && (
        <div style={{ left: padding + 20 }} className="absolute top-full right-2 z-20 bg-[#5a1d1d] border border-rose-500 text-[11px] text-white px-2 py-1">
          {error}
        </div>
      )}
    </div>
  );
};

const SectionHeader: React.FC<{
  title: string;
  collapsed: boolean;
  count?: number;
  onToggle: () => void;
  actions?: React.ReactNode;
}> = ({ title, collapsed, count, onToggle, actions }) => (
  <div
    onClick={onToggle}
    className="group h-6 px-1 flex items-center justify-between cursor-pointer text-[#c9d1d9] text-[11px] font-bold uppercase tracking-wide flex-shrink-0"
  >
    <div className="flex items-center gap-1 min-w-0">
      {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      <span className="truncate">{title}</span>
      {count !== undefined && <span className="ml-1 px-1.5 rounded-full bg-[#30363d] text-[10px] font-normal">{count}</span>}
    </div>
    <div className="flex items-center opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
      {actions}
    </div>
  </div>
);

const IconButton: React.FC<{ title: string; onClick: () => void; children: React.ReactNode }> = ({ title, onClick, children }) => (
  <button title={title} onClick={onClick} className="p-0.5 rounded text-[#8b949e] hover:text-white hover:bg-[#30363d]">
    {children}
  </button>
);

export const ExplorerSidebar: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [filter, setFilter] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string; isFolder: boolean } | null>(null);
  const treeRef = useRef<HTMLDivElement>(null);

  const filePaths = Object.keys(state.project.files).sort();
  const fileSet = new Set(filePaths);
  const folderSet = new Set<string>();
  filePaths.forEach((p) => {
    for (let d = parentOf(p); d; d = parentOf(d)) folderSet.add(d);
  });
  const filesUnder = (folder: string) => filePaths.filter((p) => p.startsWith(folder + '/'));
  const exists = (path: string) => fileSet.has(path) || folderSet.has(path);
  const toggleSection = (id: string) => setCollapsedSections((p) => ({ ...p, [id]: !p[id] }));

  // ---- tree ----
  const root: Record<string, any> = {};
  filePaths.forEach((path) => {
    if (filter && !path.toLowerCase().includes(filter.toLowerCase())) return;
    const parts = path.split('/');
    let current = root;
    parts.forEach((part, idx) => {
      const isFile = idx === parts.length - 1;
      if (isFile && part === PLACEHOLDER) return;
      current[part] ||= { name: part, path: parts.slice(0, idx + 1).join('/'), isFolder: !isFile, children: isFile ? undefined : {} };
      if (!isFile) current = current[part].children;
    });
  });
  const toArray = (obj: Record<string, any>): FileNode[] =>
    Object.values(obj)
      .map((n: any) => ({ ...n, children: n.children ? toArray(n.children) : undefined }))
      .sort((a, b) => (a.isFolder === b.isFolder ? a.name.localeCompare(b.name) : a.isFolder ? -1 : 1));
  const tree = toArray(root);

  // Rows currently visible, in order (keyboard navigation walks this list)
  const visibleRows: FileNode[] = [];
  const walk = (nodes: FileNode[]) =>
    nodes.forEach((n) => {
      visibleRows.push(n);
      if (n.isFolder && !collapsedFolders[n.path] && n.children) walk(n.children);
    });
  walk(tree);

  // Scroll a row into view only if it is (partly) hidden. Scrolling a row that is already
  // visible would move the tree under the mouse between the two clicks of a double-click.
  const scrollToRow = (path: string) =>
    requestAnimationFrame(() => {
      const row = treeRef.current?.querySelector(`[data-path="${CSS.escape(path)}"]`);
      const box = treeRef.current?.getBoundingClientRect();
      if (!row || !box) return;
      const r = row.getBoundingClientRect();
      if (r.top < box.top || r.bottom > box.bottom) row.scrollIntoView({ block: 'nearest' });
    });

  const focused = focusedPath(state);

  // ---- auto reveal the file in the focused editor group (explorer.autoReveal) ----
  useEffect(() => {
    const path = focused;
    if (!state.editorSettings.autoReveal || !state.project.files[path]) return;
    setSelected(path);
    setCollapsedFolders((prev) => {
      const next = { ...prev };
      for (let d = parentOf(path); d; d = parentOf(d)) delete next[d];
      return next;
    });
    scrollToRow(path);
  }, [focused]);

  // Close the context menu on outside click / Escape
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('click', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [contextMenu]);

  // ---- operations ----
  const startCreate = (kind: 'new-file' | 'new-folder', parent?: string) => {
    // Default location: the selected folder, or the selected file's folder
    const base = parent ?? (selected ? (folderSet.has(selected) ? selected : parentOf(selected)) : '');
    if (base) setCollapsedFolders((p) => ({ ...p, [base]: false }));
    setCollapsedSections((p) => ({ ...p, folder: false }));
    setEditing({ kind, parent: base });
  };

  const validateName = (name: string): string | null => {
    if (!editing) return null;
    const trimmed = name.trim();
    if (!trimmed) return 'A file or folder name must be provided.';
    if (INVALID_NAME.test(trimmed) || trimmed.split('/').some((seg) => seg === '' || seg === '.' || seg === '..')) {
      return `The name ${trimmed} is not valid as a file or folder name.`;
    }
    const dir = editing.kind === 'rename' ? parentOf(editing.path) : editing.parent;
    const target = join(dir, trimmed);
    if (editing.kind === 'rename' && target === editing.path) return null;
    if (exists(target)) return `A file or folder ${trimmed} already exists at this location.`;
    return null;
  };

  /** Rename/move a file or a whole folder. Refuses to overwrite. */
  const movePath = (from: string, to: string, isFolder: boolean) => {
    if (from === to) return;
    if (isFolder && to.startsWith(from + '/')) {
      actions.notify('error', `Cannot move '${from}' into itself.`);
      return;
    }
    if (exists(to)) {
      actions.notify('error', `A file or folder '${to}' already exists.`);
      return;
    }
    if (isFolder) filesUnder(from).forEach((p) => actions.renameFile(p, to + p.slice(from.length)));
    else actions.renameFile(from, to);
    setSelected(to);
  };

  const commitEdit = (name: string) => {
    const e = editing;
    setEditing(null);
    const trimmed = name.trim();
    if (!e || !trimmed || validateName(name)) return;
    if (e.kind === 'rename') {
      movePath(e.path, join(parentOf(e.path), trimmed), e.isFolder);
    } else if (e.kind === 'new-file') {
      const path = join(e.parent, trimmed);
      actions.createFile(path, NEW_FILE_TEMPLATES[detectLanguage(path)] ?? '');
    } else {
      const path = join(e.parent, trimmed);
      actions.createFile(`${path}/${PLACEHOLDER}`, '', false);
      setSelected(path);
    }
    treeRef.current?.focus();
  };

  const deletePath = async (path: string, isFolder: boolean) => {
    const name = path.split('/').pop();
    const targets = isFolder ? filesUnder(path) : [path];
    if (state.editorSettings.confirmDelete) {
      const choice = await actions.showDialog({
        severity: 'warning',
        message: isFolder ? `Are you sure you want to delete '${name}' and its contents?` : `Are you sure you want to delete '${name}'?`,
        detail: `${isFolder ? `${targets.length} file(s) will be deleted. ` : ''}This cannot be undone: the browser workspace has no recycle bin.`,
        buttons: ['Delete', 'Cancel'],
      });
      if (choice !== 0) return;
    }
    targets.forEach(actions.deleteFile);
    setSelected(null);
  };

  const importDropped = async (files: File[], folder: string) => {
    const result = await readTextFiles(files, (f) => join(folder, f.name));
    const paths = Object.keys(result.files);
    const clashes = paths.filter((p) => fileSet.has(p));
    if (clashes.length) {
      const choice = await actions.showDialog({
        severity: 'warning',
        message: clashes.length === 1 ? `Replace '${clashes[0]}'?` : `Replace ${clashes.length} existing files?`,
        detail: clashes.join('\n'),
        buttons: ['Replace', 'Cancel'],
      });
      if (choice !== 0) return;
    }
    if (paths.length) actions.importFiles(result.files);
    if (result.skipped) actions.notify('warning', `${result.skipped} file(s) skipped (binary, build output or larger than 2 MB).`);
  };

  // ---- drag & drop: move inside the tree, or import files from the OS ----
  const onDragOverTarget = (e: React.DragEvent, folder: string) => {
    if (isFileDrag(e) || e.dataTransfer.types.includes('text/x-esp-path')) {
      e.preventDefault();
      e.stopPropagation();
      setDropTarget(folder);
    }
  };
  const onDropTarget = (e: React.DragEvent, folder: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);
    if (isFileDrag(e)) return void importDropped(Array.from(e.dataTransfer.files), folder);
    const from = e.dataTransfer.getData('text/x-esp-path');
    if (!from || parentOf(from) === folder) return;
    movePath(from, join(folder, from.split('/').pop()!), folderSet.has(from));
  };

  // ---- keyboard navigation (tree has focus) ----
  const onTreeKeyDown = (e: React.KeyboardEvent) => {
    if (editing) return;
    const idx = visibleRows.findIndex((r) => r.path === selected);
    const row = visibleRows[idx];
    const select = (r?: FileNode) => {
      if (!r) return;
      setSelected(r.path);
      scrollToRow(r.path);
    };
    const keys: Record<string, () => void> = {
      ArrowDown: () => select(visibleRows[Math.min(visibleRows.length - 1, idx + 1)] ?? visibleRows[0]),
      ArrowUp: () => select(visibleRows[Math.max(0, idx - 1)]),
      ArrowRight: () => {
        if (!row?.isFolder) return;
        if (collapsedFolders[row.path]) setCollapsedFolders((p) => ({ ...p, [row.path]: false }));
        else select(row.children?.[0]);
      },
      ArrowLeft: () => {
        if (row?.isFolder && !collapsedFolders[row.path]) setCollapsedFolders((p) => ({ ...p, [row.path]: true }));
        else if (row) select(visibleRows.find((r) => r.path === parentOf(row.path)));
      },
      Enter: () => {
        if (row?.isFolder) setCollapsedFolders((p) => ({ ...p, [row.path]: !p[row.path] }));
        else if (row) actions.openFile(row.path);
      },
      ' ': () => row && !row.isFolder && actions.openFile(row.path, { preview: true }),
      F2: () => row && setEditing({ kind: 'rename', path: row.path, isFolder: row.isFolder }),
      Delete: () => row && void deletePath(row.path, row.isFolder),
    };
    if (keys[e.key]) {
      e.preventDefault();
      keys[e.key]();
    }
  };

  // ---- rendering ----
  const pad = (level: number) => level * state.editorSettings.treeIndent + 8;

  const renderInput = (level: number, initial: string, isFolder: boolean) => (
    <InlineInput
      key="__inline__"
      padding={pad(level)}
      initial={initial}
      isFolder={isFolder}
      validate={validateName}
      onCommit={commitEdit}
      onCancel={() => {
        setEditing(null);
        treeRef.current?.focus();
      }}
    />
  );

  const renderCreateRow = (parent: string, level: number) =>
    editing && editing.kind !== 'rename' && editing.parent === parent ? renderInput(level, '', editing.kind === 'new-folder') : null;

  const renderNode = (node: FileNode, level: number): React.ReactNode => {
    if (editing?.kind === 'rename' && editing.path === node.path) return renderInput(level, node.name, node.isFolder);
    const collapsed = !!collapsedFolders[node.path];
    const isSelected = selected === node.path;
    const isDirty = state.dirtyFiles.includes(node.path);
    const folderForDrop = node.isFolder ? node.path : parentOf(node.path);

    return (
      <div key={node.path}>
        <div
          data-path={node.path}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/x-esp-path', node.path);
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={(e) => onDragOverTarget(e, folderForDrop)}
          onDrop={(e) => onDropTarget(e, folderForDrop)}
          onClick={() => {
            setSelected(node.path);
            if (node.isFolder) setCollapsedFolders((p) => ({ ...p, [node.path]: !p[node.path] }));
            else actions.openFile(node.path, { preview: true });
          }}
          onDoubleClick={() => {
            if (node.isFolder) return;
            actions.openFile(node.path);
            actions.pinTab(node.path);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setSelected(node.path);
            setContextMenu({ x: e.clientX, y: e.clientY, path: node.path, isFolder: node.isFolder });
          }}
          style={{ paddingLeft: pad(level) }}
          className={`flex items-center justify-between py-[3px] pr-2 cursor-pointer border ${
            isSelected ? 'bg-[#1f6feb]/25 border-[#58a6ff]/60' : 'border-transparent hover:bg-[#21262d]/60'
          } ${focused === node.path ? 'text-white' : 'text-[#c9d1d9]'} ${
            node.isFolder && dropTarget === node.path ? 'bg-[#1f6feb]/20' : ''
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-3 flex-shrink-0 text-[#8b949e]">
              {node.isFolder && (collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
            </span>
            <FileIcon filename={node.name} isFolder={node.isFolder} isOpen={!collapsed} className="w-3.5 h-3.5 flex-shrink-0" />
            <span className={`truncate ${isDirty ? 'text-amber-300' : ''}`}>{node.name}</span>
          </div>
          {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Unsaved changes" />}
        </div>
        {node.isFolder && !collapsed && (
          <div>
            {renderCreateRow(node.path, level + 1)}
            {node.children?.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // ---- outline of the active file ----
  const activePath = focused;
  const activeFile = state.project.files[activePath];
  const symbols = useMemo(
    () => (activeFile ? extractSymbols(activeFile.content, detectLanguage(activePath, state.languageOverrides[activePath])) : []),
    [activeFile?.content, activePath, state.languageOverrides]
  );
  const currentSymbol = symbolPathAt(symbols, state.cursor.line).pop();
  const renderSymbol = (s: DocSymbol): React.ReactNode => (
    <div key={`${s.line}:${s.name}`}>
      <div
        onClick={() => requestReveal(activePath, s.line)}
        style={{ paddingLeft: pad(s.depth) + 12 }}
        className={`flex items-center gap-1.5 py-[3px] pr-2 cursor-pointer ${
          currentSymbol === s ? 'bg-[#21262d] text-white' : 'text-[#c9d1d9] hover:bg-[#21262d]/60'
        }`}
        title={`Line ${s.line}`}
      >
        <span className="w-4 text-center text-[10px] font-bold flex-shrink-0" style={{ color: KIND_BADGE[s.kind][1] }}>
          {KIND_BADGE[s.kind][0]}
        </span>
        <span className="truncate">{s.name}</span>
      </div>
      {s.children.map(renderSymbol)}
    </div>
  );

  const menuItem = (label: string, run: () => void, hint = '', danger = false) => (
    <button
      key={label}
      onClick={run}
      className={`w-full text-left px-3 py-1 flex justify-between ${danger ? 'text-rose-400 hover:bg-rose-950' : 'hover:bg-[#1f6feb] hover:text-white'}`}
    >
      <span>{label}</span>
      <span className="opacity-60">{hint}</span>
    </button>
  );

  return (
    <div className="w-full bg-[#161b22] border-r border-[#30363d] flex flex-col h-full select-none text-xs">
      <div className="h-9 px-3 flex items-center justify-between border-b border-[#30363d] text-[11px] tracking-wide text-[#8b949e] flex-shrink-0">
        <span className="uppercase font-semibold">Explorer</span>
        <IconButton title="Export Project as ZIP" onClick={actions.exportProjectZip}>
          <Download className="w-3.5 h-3.5" />
        </IconButton>
      </div>

      <div className="p-2 border-b border-[#21262d] flex-shrink-0">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter files"
          className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] px-2 py-1 rounded text-white text-[11px] outline-none placeholder-[#6e7681]"
        />
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Open Editors */}
        <div className="flex flex-col border-b border-[#21262d] flex-shrink-0">
          <SectionHeader
            title="Open Editors"
            collapsed={!!collapsedSections.open}
            count={state.dirtyFiles.length ? state.dirtyFiles.length : undefined}
            onToggle={() => toggleSection('open')}
          />
          {!collapsedSections.open && (
            // Fixed height (like a VS Code pane): if this list grew with each opened file it would push
            // the file tree down between the two clicks of a double-click, opening the wrong file.
            <div className="h-28 overflow-y-auto">
              {/* With a split, VS Code lists the editors per group */}
              {(state.splitFilePath
                ? ([[0, state.openTabs], [1, state.splitTabs]] as const)
                : ([[0, state.openTabs]] as const)
              ).map(([group, tabs]) => (
                <React.Fragment key={group}>
                  {state.splitFilePath && (
                    <div className="pl-3 py-[2px] text-[10px] font-bold uppercase tracking-wide text-[#8b949e]">Group {group + 1}</div>
                  )}
              {tabs.map((tab) => {
                const name = tab === WELCOME_TAB ? 'Welcome' : tab.split('/').pop()!;
                const dirty = state.dirtyFiles.includes(tab);
                const groupActive = group === 1 ? state.splitFilePath : state.activeFilePath;
                return (
                  <div
                    key={tab}
                    onClick={() => {
                      if (group === 1) actions.setSplitFilePath(tab);
                      else {
                        actions.setActiveGroup(0);
                        actions.openFile(tab);
                      }
                    }}
                    title={tab === WELCOME_TAB ? 'Welcome' : tab}
                    className={`group/row ${state.splitFilePath ? 'pl-5' : 'pl-3'} pr-2 py-[3px] flex items-center gap-1.5 cursor-pointer ${
                      groupActive === tab && activePath === tab ? 'bg-[#21262d] text-white' : 'text-[#c9d1d9] hover:bg-[#21262d]/60'
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void actions.requestCloseTabs([tab], group);
                      }}
                      title="Close"
                      className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center text-[#8b949e] hover:text-white"
                    >
                      {dirty && <span className="w-2 h-2 rounded-full bg-amber-400 group-hover/row:hidden" />}
                      <X className={`w-3.5 h-3.5 ${dirty ? 'hidden group-hover/row:block' : 'invisible group-hover/row:visible'}`} />
                    </button>
                    <FileIcon filename={name} className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className={`truncate ${group === 0 && state.previewTab === tab ? 'italic' : ''}`}>{name}</span>
                    <span className="truncate text-[10px] text-[#8b949e]">{tab === WELCOME_TAB ? '' : parentOf(tab)}</span>
                  </div>
                );
              })}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Folder */}
        <div className={`flex flex-col min-h-0 border-b border-[#21262d] ${collapsedSections.folder ? '' : 'flex-1'}`}>
          <SectionHeader
            title={state.project.metadata.name}
            collapsed={!!collapsedSections.folder}
            onToggle={() => toggleSection('folder')}
            actions={
              <>
                <IconButton title="New File..." onClick={() => startCreate('new-file')}>
                  <FilePlus className="w-3.5 h-3.5" />
                </IconButton>
                <IconButton title="New Folder..." onClick={() => startCreate('new-folder')}>
                  <FolderPlus className="w-3.5 h-3.5" />
                </IconButton>
                <IconButton title="Collapse Folders in Explorer" onClick={() => setCollapsedFolders(Object.fromEntries([...folderSet].map((f) => [f, true])))}>
                  <ChevronsDownUp className="w-3.5 h-3.5" />
                </IconButton>
              </>
            }
          />
          {!collapsedSections.folder && (
            <div
              ref={treeRef}
              tabIndex={0}
              onKeyDown={onTreeKeyDown}
              onDragOver={(e) => onDragOverTarget(e, '')}
              onDragLeave={(e) => e.currentTarget === e.target && setDropTarget(null)}
              onDrop={(e) => onDropTarget(e, '')}
              onContextMenu={(e) => {
                if (e.target !== e.currentTarget) return;
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, path: '', isFolder: true });
              }}
              className={`flex-1 overflow-y-auto py-0.5 min-h-[60px] outline-none focus:ring-1 focus:ring-inset focus:ring-[#58a6ff]/50 ${
                dropTarget === '' ? 'bg-[#1f6feb]/10' : ''
              }`}
            >
              {renderCreateRow('', 0)}
              {tree.map((n) => renderNode(n, 0))}
              {tree.length === 0 && !editing && <div className="px-4 py-3 text-[#8b949e]">{filter ? 'No matching files.' : 'Empty workspace.'}</div>}
            </div>
          )}
        </div>

        {/* Outline */}
        <div className="flex flex-col flex-shrink-0">
          <SectionHeader title="Outline" collapsed={!!collapsedSections.outline} onToggle={() => toggleSection('outline')} />
          {!collapsedSections.outline && (
            <div className="max-h-[35vh] overflow-y-auto pb-1">
              {!activeFile ? (
                <div className="px-4 py-2 text-[#8b949e]">The active editor cannot provide outline information.</div>
              ) : symbols.length === 0 ? (
                <div className="px-4 py-2 text-[#8b949e]">No symbols found in document '{activePath.split('/').pop()}'.</div>
              ) : (
                symbols.map(renderSymbol)
              )}
            </div>
          )}
        </div>
      </div>

      {contextMenu && (
        <div
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 240), left: Math.min(contextMenu.x, window.innerWidth - 230) }}
          className="fixed bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl py-1 z-50 text-[12px] font-sans text-[#c9d1d9] w-56"
        >
          {contextMenu.isFolder ? (
            <>
              {menuItem('New File...', () => startCreate('new-file', contextMenu.path))}
              {menuItem('New Folder...', () => startCreate('new-folder', contextMenu.path))}
            </>
          ) : (
            <>
              {menuItem('Open', () => actions.openFile(contextMenu.path))}
              {menuItem('Open to the Side', () => actions.setSplitFilePath(contextMenu.path))}
            </>
          )}
          {contextMenu.path && (
            <>
              <div className="my-1 border-t border-[#30363d]" />
              {menuItem('Copy Path', () => void navigator.clipboard.writeText(contextMenu.path))}
              {menuItem('Copy Name', () => void navigator.clipboard.writeText(contextMenu.path.split('/').pop()!))}
              <div className="my-1 border-t border-[#30363d]" />
              {menuItem('Rename...', () => setEditing({ kind: 'rename', path: contextMenu.path, isFolder: contextMenu.isFolder }), 'F2')}
              {menuItem('Delete', () => void deletePath(contextMenu.path, contextMenu.isFolder), 'Delete', true)}
            </>
          )}
        </div>
      )}
    </div>
  );
};
