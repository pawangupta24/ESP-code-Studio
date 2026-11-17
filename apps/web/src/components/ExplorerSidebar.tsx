import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { FileIcon } from './FileIcon';
import { detectLanguage, NEW_FILE_TEMPLATES } from '../languages';
import {
  ChevronRight,
  ChevronDown,
  FilePlus,
  FolderPlus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Download,
  Columns2,
} from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  isFolder: boolean;
  children?: FileNode[];
}

export const ExplorerSidebar: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [filter, setFilter] = useState('');
  const [isOpenEditorsCollapsed, setIsOpenEditorsCollapsed] = useState(false);
  const [isWorkspaceCollapsed, setIsWorkspaceCollapsed] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string; isFolder: boolean } | null>(null);

  // Dismiss the context menu on any outside click or Escape
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

  const filePaths = Object.keys(state.project.files).sort();

  // Folders are implicit (derived from file paths), so folder ops fan out over the files inside
  const filesUnder = (folder: string) => filePaths.filter((p) => p.startsWith(folder + '/'));

  const handleNewFileIn = (folder: string) => {
    const name = prompt(`New file in ${folder}/:`)?.trim();
    if (name) actions.createFile(`${folder}/${name}`);
  };

  const handleRenameFolder = (folder: string) => {
    const next = prompt('Rename folder to:', folder)?.trim().replace(/\/+$/, '');
    if (!next || next === folder) return;
    filesUnder(folder).forEach((p) => actions.renameFile(p, next + p.slice(folder.length)));
  };

  const handleDeleteFolder = (folder: string) => {
    const files = filesUnder(folder);
    if (!state.editorSettings.confirmDelete || confirm(`Delete folder "${folder}" and its ${files.length} file(s)?`)) {
      files.forEach(actions.deleteFile);
    }
  };

  // Build nested tree structure
  const buildTree = (): FileNode[] => {
    const root: Record<string, any> = {};

    filePaths.forEach((path) => {
      if (filter && !path.toLowerCase().includes(filter.toLowerCase())) return;

      const parts = path.split('/');
      let current = root;

      parts.forEach((part, idx) => {
        const isFile = idx === parts.length - 1;
        if (!current[part]) {
          current[part] = {
            name: part,
            path: parts.slice(0, idx + 1).join('/'),
            isFolder: !isFile,
            children: isFile ? undefined : {},
          };
        }
        if (!isFile) {
          current = current[part].children;
        }
      });
    });

    const toArray = (obj: Record<string, any>): FileNode[] => {
      return Object.values(obj)
        .map((node) => ({
          name: node.name,
          path: node.path,
          isFolder: node.isFolder,
          children: node.children ? toArray(node.children) : undefined,
        }))
        .sort((a, b) => {
          if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name);
          return a.isFolder ? -1 : 1;
        });
    };

    return toArray(root);
  };

  const tree = buildTree();

  const toggleFolder = (path: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleCreateFile = () => {
    const name = prompt('New file name (e.g. src/telemetry.cpp, app.py, main.go):')?.trim();
    if (!name) return;
    // Start from the language's template (empty for languages without one)
    actions.createFile(name, NEW_FILE_TEMPLATES[detectLanguage(name)] ?? '');
  };

  const handleCreateFolder = () => {
    const name = prompt('New Folder Name (e.g. lib/drivers):');
    if (!name) return;
    actions.createFile(`${name}/README.md`, `# ${name}\nInitialized.\n`);
  };

  const handleContextMenu = (e: React.MouseEvent, path: string, isFolder: boolean) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, path, isFolder });
  };

  const renderNode = (node: FileNode, level = 0) => {
    const isFolder = node.isFolder;
    const isCollapsed = collapsedFolders[node.path];
    const isActive = state.activeFilePath === node.path;
    const isDirty = state.dirtyFiles.includes(node.path);

    return (
      <div key={node.path} className="select-none font-mono text-xs">
        <div
          onClick={() => {
            if (isFolder) toggleFolder(node.path);
            else actions.setActiveFilePath(node.path);
          }}
          onContextMenu={(e) => handleContextMenu(e, node.path, isFolder)}
          style={{ paddingLeft: `${level * state.editorSettings.treeIndent + 10}px` }}
          className={`flex items-center justify-between py-1 pr-2 cursor-pointer transition-colors group ${
            isActive
              ? 'bg-[#21262d] text-[#58a6ff] font-medium border-l-2 border-[#58a6ff]'
              : 'text-[#c9d1d9] hover:bg-[#21262d]/50 hover:text-white'
          }`}
        >
          <div className="flex items-center space-x-1.5 truncate">
            {isFolder && (
              <span className="text-[#8b949e]">
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </span>
            )}
            <FileIcon filename={node.name} isFolder={isFolder} isOpen={!isCollapsed} className="w-3.5 h-3.5" />
            <span className="truncate text-xs">{node.name}</span>
          </div>

          <div className="flex items-center space-x-1">
            {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
          </div>
        </div>

        {isFolder && !isCollapsed && node.children && (
          <div>{node.children.map((child) => renderNode(child, level + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-[#161b22] border-r border-[#30363d] flex flex-col h-full select-none text-xs font-mono">
      {/* Explorer Title Bar */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-[#30363d] text-[#8b949e] font-semibold text-[11px] tracking-wide">
        <span className="uppercase text-[#8b949e]">Explorer</span>
        <div className="flex items-center space-x-1">
          <button onClick={actions.exportProjectZip} title="Export Project as ZIP" className="hover:text-[#58a6ff] p-1 rounded hover:bg-[#21262d]">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleCreateFile} title="New File" className="hover:text-white p-1 rounded hover:bg-[#21262d]">
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleCreateFolder} title="New Folder" className="hover:text-white p-1 rounded hover:bg-[#21262d]">
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-2 border-b border-[#21262d]">
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2 top-2 text-[#8b949e]" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter files..."
            className="w-full bg-[#0d1117] border border-[#30363d] pl-7 pr-2 py-1 rounded text-white text-[11px] outline-none placeholder-[#484f58]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Open Editors Section */}
        <div className="border-b border-[#21262d]">
          <div
            onClick={() => setIsOpenEditorsCollapsed(!isOpenEditorsCollapsed)}
            className="px-2 py-1 flex items-center justify-between cursor-pointer bg-[#0d1117]/40 text-[#8b949e] hover:text-white text-[10px] uppercase font-bold tracking-wider"
          >
            <div className="flex items-center space-x-1">
              {isOpenEditorsCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <span>Open Editors</span>
            </div>
            <span>{state.openTabs.length}</span>
          </div>

          {!isOpenEditorsCollapsed && (
            <div className="py-0.5">
              {state.openTabs.map((tab) => {
                const isActive = state.activeFilePath === tab;
                const fileName = tab.split('/').pop() || tab;
                return (
                  <div
                    key={tab}
                    onClick={() => actions.setActiveFilePath(tab)}
                    className={`px-3 py-1 flex items-center justify-between cursor-pointer ${
                      isActive ? 'bg-[#21262d] text-[#58a6ff]' : 'text-[#8b949e] hover:text-white hover:bg-black/20'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <FileIcon filename={fileName} className="w-3 h-3" />
                      <span className="truncate">{fileName}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.closeTab(tab);
                      }}
                      className="hover:text-rose-400 p-0.5 rounded text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Project Files Tree Section */}
        <div>
          <div
            onClick={() => setIsWorkspaceCollapsed(!isWorkspaceCollapsed)}
            className="px-2 py-1 flex items-center justify-between cursor-pointer bg-[#0d1117]/40 text-[#8b949e] hover:text-white text-[10px] uppercase font-bold tracking-wider border-b border-[#21262d]"
          >
            <div className="flex items-center space-x-1">
              {isWorkspaceCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <span className="truncate">{state.project.metadata.name}</span>
            </div>
            <span>{filePaths.length}</span>
          </div>

          {!isWorkspaceCollapsed && <div className="py-1">{tree.map((node) => renderNode(node))}</div>}
        </div>
      </div>

      {/* Right Click Context Menu */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl py-1 z-50 text-xs font-mono text-[#c9d1d9] w-40"
          onClick={() => setContextMenu(null)}
        >
          {contextMenu.isFolder ? (
            <button
              onClick={() => handleNewFileIn(contextMenu.path)}
              className="w-full text-left px-3 py-1 hover:bg-[#1f6feb] hover:text-white flex items-center space-x-1.5"
            >
              <FilePlus className="w-3 h-3" />
              <span>New File...</span>
            </button>
          ) : (
            <button
              onClick={() => actions.setSplitFilePath(contextMenu.path)}
              className="w-full text-left px-3 py-1 hover:bg-[#1f6feb] hover:text-white flex items-center space-x-1.5"
            >
              <Columns2 className="w-3 h-3" />
              <span>Open to the Side</span>
            </button>
          )}
          <button
            onClick={() => {
              if (contextMenu.isFolder) return handleRenameFolder(contextMenu.path);
              const newName = prompt('Rename file to:', contextMenu.path)?.trim();
              if (!newName || newName === contextMenu.path) return;
              if (state.project.files[newName]) alert(`"${newName}" already exists.`);
              else actions.renameFile(contextMenu.path, newName);
            }}
            className="w-full text-left px-3 py-1 hover:bg-[#1f6feb] hover:text-white flex items-center space-x-1.5"
          >
            <Edit2 className="w-3 h-3" />
            <span>Rename</span>
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(contextMenu.path);
            }}
            className="w-full text-left px-3 py-1 hover:bg-[#1f6feb] hover:text-white flex items-center space-x-1.5"
          >
            <Copy className="w-3 h-3" />
            <span>Copy Path</span>
          </button>
          <div className="h-px bg-[#30363d] my-1" />
          <button
            onClick={() => {
              if (contextMenu.isFolder) handleDeleteFolder(contextMenu.path);
              else if (!state.editorSettings.confirmDelete || confirm(`Delete file "${contextMenu.path}"?`)) actions.deleteFile(contextMenu.path);
            }}
            className="w-full text-left px-3 py-1 hover:bg-rose-950 text-rose-400 flex items-center space-x-1.5"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};
