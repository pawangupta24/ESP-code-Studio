import React, { useState } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { FileCode, FileText, Settings, Trash2, Edit2, FilePlus, FolderPlus, Search } from 'lucide-react';

export const FileExplorer: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [filter, setFilter] = useState('');

  const filePaths = Object.keys(state.project.files).sort();

  const getFileIcon = (path: string) => {
    if (path.endsWith('.cpp') || path.endsWith('.c')) return <FileCode className="w-3.5 h-3.5 text-[#58a6ff]" />;
    if (path.endsWith('.h') || path.endsWith('.hpp')) return <FileCode className="w-3.5 h-3.5 text-purple-400" />;
    if (path.endsWith('.py')) return <span className="text-xs" title="MicroPython">🐍</span>;
    if (path.endsWith('.rs')) return <span className="text-xs" title="Rust Embedded">🦀</span>;
    if (path.endsWith('.js') || path.endsWith('.mjs')) return <span className="text-xs" title="QuickJS">🟨</span>;
    if (path.endsWith('.json')) return <span className="text-xs" title="JSON Schema">📋</span>;
    if (path.endsWith('.ini')) return <Settings className="w-3.5 h-3.5 text-amber-400" />;
    if (path.endsWith('.md')) return <FileText className="w-3.5 h-3.5 text-blue-300" />;
    if (path.endsWith('.S') || path.endsWith('.asm')) return <span className="text-xs" title="Assembly">🔬</span>;
    return <FileText className="w-3.5 h-3.5 text-[#8b949e]" />;
  };

  const handleCreateFile = () => {
    const name = prompt('Enter new file path (e.g. main.py, src/main.rs, lib/driver.cpp):');
    if (!name) return;

    let initialCode = '// Module created in ESP Studio\n#include <Arduino.h>\n\n';
    if (name.endsWith('.py')) {
      initialCode = '# MicroPython on ESP32-S3\nimport machine\nimport time\n\nprint("Hello from ESP32 MicroPython!")\n';
    } else if (name.endsWith('.rs')) {
      initialCode = '//! Rust no_std for ESP32-S3\n#![no_std]\n#![no_main]\n\n#[entry]\nfn main() -> ! {\n    loop {}\n}\n';
    } else if (name.endsWith('.js') || name.endsWith('.mjs')) {
      initialCode = '// QuickJS Embedded Runtime for ESP32-S3\nconsole.log("Embedded JavaScript initialized.");\n';
    } else if (name.endsWith('.json')) {
      initialCode = '{\n  "name": "esp32s3-project",\n  "version": "1.0.0"\n}\n';
    } else if (name.endsWith('.md')) {
      initialCode = '# Project Documentation\n\nNotes and wiring pinouts.\n';
    }

    actions.createFile(name, initialCode);
  };

  const handleCreateFolder = () => {
    const name = prompt('Enter folder name (e.g. lib/display):');
    if (name) actions.createFile(`${name}/README.md`, `# ${name}\nFolder initialized.\n`);
  };

  const handleRename = (oldPath: string) => {
    const newName = prompt(`Rename ${oldPath} to:`, oldPath);
    if (newName && newName !== oldPath) actions.renameFile(oldPath, newName);
  };

  const handleDelete = (path: string) => {
    if (confirm(`Delete file "${path}"?`)) actions.deleteFile(path);
  };

  // Group files into root vs subfolders
  const filteredFiles = filePaths.filter((p) => p.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col h-full select-none text-xs font-mono">
      {/* Explorer Header */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-[#30363d] text-[#8b949e] font-semibold text-[11px] tracking-wide">
        <span className="uppercase text-[#8b949e]">Explorer</span>
        <div className="flex items-center space-x-1">
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

      {/* Workspace Root Folder Item */}
      <div className="px-3 py-2 text-[#58a6ff] flex items-center justify-between font-semibold border-b border-[#21262d] bg-[#0d1117]/50">
        <span className="truncate">{state.project.metadata.name}</span>
        <span className="text-[10px] text-[#8b949e]">{filePaths.length} files</span>
      </div>

      {/* Files Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {filteredFiles.map((path) => {
          const isActive = state.activeFilePath === path;
          const isDirty = state.openTabs.includes(path) && state.syncStatus === 'PENDING';

          return (
            <div
              key={path}
              onClick={() => actions.setActiveFilePath(path)}
              className={`group px-3 py-1.5 flex items-center justify-between cursor-pointer transition-colors ${
                isActive
                  ? 'bg-[#21262d] text-[#58a6ff] font-medium border-l-2 border-[#58a6ff]'
                  : 'text-[#c9d1d9] hover:bg-[#21262d]/50 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                {getFileIcon(path)}
                <span className="truncate text-xs">{path}</span>
              </div>

              <div className="flex items-center space-x-1">
                {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1" title="Unsaved changes"></span>}
                <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRename(path);
                    }}
                    className="p-0.5 hover:text-white rounded"
                    title="Rename File"
                  >
                    <Edit2 className="w-3 h-3 text-[#8b949e]" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(path);
                    }}
                    className="p-0.5 hover:text-rose-400 rounded"
                    title="Delete File"
                  >
                    <Trash2 className="w-3 h-3 text-[#8b949e]" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-[#0d1117] border-t border-[#30363d] text-[11px] text-[#8b949e] space-y-1">
        <div className="flex justify-between">
          <span>Target Chip:</span>
          <span className="text-white">ESP32-S3 (LX7)</span>
        </div>
        <div className="flex justify-between">
          <span>Flash Mode:</span>
          <span className="text-[#58a6ff]">QIO @ 80MHz</span>
        </div>
      </div>
    </div>
  );
};
