import React, { useState } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { GitBranch, Plus, Minus, Check, GitPullRequest } from 'lucide-react';
import { FileIcon } from './FileIcon';

export const SourceControlSidebar: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [commitMsg, setCommitMsg] = useState('');

  const allFiles = Object.keys(state.project.files);
  const staged = state.stagedFiles;
  const unstaged = allFiles.filter((f) => !staged.includes(f));

  const handleCommit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commitMsg.trim()) return;
    actions.commitChanges(commitMsg);
    setCommitMsg('');
  };

  return (
    <div className="w-full bg-[#161b22] border-r border-[#30363d] flex flex-col h-full select-none text-xs font-mono">
      {/* Title */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-[#30363d] text-[#8b949e] font-semibold text-[11px] tracking-wide">
        <span className="uppercase text-[#8b949e]">Source Control</span>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => actions.setActiveNavTab('git-graph')}
            title="Open Visual Git Graph"
            className="p-1 hover:text-white rounded hover:bg-[#21262d]"
          >
            <GitPullRequest className="w-3.5 h-3.5 text-[#58a6ff]" />
          </button>
        </div>
      </div>

      {/* Branch Selector */}
      <div className="p-2 border-b border-[#21262d] bg-[#0d1117]/40 flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-[#58a6ff]">
          <GitBranch className="w-3.5 h-3.5" />
          <span className="font-bold text-xs">{state.currentBranch}</span>
        </div>
        <span className="text-[10px] text-emerald-400">clean repository</span>
      </div>

      {/* Commit Input Box */}
      <div className="p-2.5 border-b border-[#21262d] space-y-2">
        <textarea
          value={commitMsg}
          onChange={(e) => setCommitMsg(e.target.value)}
          placeholder="Message (Ctrl+Enter to commit)"
          rows={2}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              handleCommit();
            }
          }}
          className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-white text-xs outline-none focus:border-[#58a6ff] resize-none placeholder-[#484f58]"
        />
        <button
          onClick={() => handleCommit()}
          disabled={!commitMsg.trim()}
          className="w-full py-1.5 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white font-semibold text-xs flex items-center justify-center space-x-1.5 disabled:opacity-40 transition-colors shadow-sm"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Commit ({staged.length > 0 ? staged.length : allFiles.length})</span>
        </button>
      </div>

      {/* Changes / Staging Trees */}
      <div className="flex-1 overflow-y-auto">
        {/* Staged Changes */}
        <div className="border-b border-[#21262d]">
          <div className="px-3 py-1.5 flex items-center justify-between bg-[#0d1117]/30 text-[10px] uppercase font-bold tracking-wider text-[#8b949e]">
            <span>Staged Changes ({staged.length})</span>
          </div>
          <div className="py-1">
            {staged.map((path) => (
              <div
                key={path}
                className="px-3 py-1 flex items-center justify-between hover:bg-[#21262d] cursor-pointer group"
              >
                <div
                  onClick={() => actions.setActiveFilePath(path)}
                  className="flex items-center space-x-1.5 truncate text-emerald-400"
                >
                  <FileIcon filename={path} className="w-3.5 h-3.5" />
                  <span className="truncate">{path}</span>
                </div>
                <button
                  onClick={() => actions.toggleStageFile(path)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-white"
                  title="Unstage changes"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Changes */}
        <div>
          <div className="px-3 py-1.5 flex items-center justify-between bg-[#0d1117]/30 text-[10px] uppercase font-bold tracking-wider text-[#8b949e]">
            <span>Changes ({unstaged.length})</span>
          </div>
          <div className="py-1">
            {unstaged.map((path) => (
              <div
                key={path}
                className="px-3 py-1 flex items-center justify-between hover:bg-[#21262d] cursor-pointer group"
              >
                <div
                  onClick={() => actions.setActiveFilePath(path)}
                  className="flex items-center space-x-1.5 truncate text-[#c9d1d9]"
                >
                  <FileIcon filename={path} className="w-3.5 h-3.5" />
                  <span className="truncate">{path}</span>
                </div>
                <button
                  onClick={() => actions.toggleStageFile(path)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-white"
                  title="Stage changes"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
