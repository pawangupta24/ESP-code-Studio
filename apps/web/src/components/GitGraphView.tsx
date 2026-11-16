import React, { useState } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { GitBranch, GitCommit, Check, FileCode, Tag, ArrowUpRight } from 'lucide-react';

export const GitGraphView: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [commitMsg, setCommitMsg] = useState('');
  const [selectedCommit, setSelectedCommit] = useState(state.gitCommits[0]);

  const modifiedFiles = Object.keys(state.project.files);

  const handleCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMsg.trim()) return;
    actions.commitChanges(commitMsg);
    setCommitMsg('');
  };

  return (
    <div className="flex-1 p-6 bg-[#0d1117] overflow-y-auto text-xs font-mono select-none">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <GitBranch className="w-5 h-5 text-[#58a6ff]" />
              <span>Git Graph & Visual Version Control</span>
            </h2>
            <p className="text-[#8b949e] mt-0.5">
              Inspect commit trees, branch pointers, stage files, and commit revisions directly from the IDE.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[#8b949e]">Branch:</span>
            <select
              value={state.currentBranch}
              onChange={(e) => alert(`Switched to branch: ${e.target.value}`)}
              className="bg-[#161b22] text-white border border-[#30363d] px-2.5 py-1 rounded-lg text-xs outline-none cursor-pointer"
            >
              {state.gitBranches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Commit & Staging Area */}
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-3">
          <span className="font-bold text-white text-xs">Source Control / Working Directory</span>

          <form onSubmit={handleCommit} className="flex gap-2">
            <input
              type="text"
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              placeholder="Commit message (e.g. feat: add deep sleep wakeup timer)..."
              className="flex-1 bg-[#0d1117] border border-[#30363d] px-3 py-1.5 rounded-lg text-white text-xs outline-none focus:border-[#58a6ff]"
            />
            <button
              type="submit"
              disabled={!commitMsg.trim()}
              className="px-4 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg font-semibold text-xs disabled:opacity-40 flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Commit Changes</span>
            </button>
          </form>

          {/* Staging List */}
          <div className="text-[11px] text-[#8b949e] pt-1">
            <span>Staged Files ({state.stagedFiles.length} of {modifiedFiles.length}):</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {modifiedFiles.map((file) => {
                const isStaged = state.stagedFiles.includes(file);
                return (
                  <button
                    key={file}
                    onClick={() => actions.toggleStageFile(file)}
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] border transition-colors ${
                      isStaged
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:text-white'
                    }`}
                  >
                    <FileCode className="w-2.5 h-2.5" />
                    <span>{file}</span>
                    <span>{isStaged ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Visual Git Graph & Commit Tree */}
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-3">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5">
            <span className="font-bold text-white text-xs flex items-center space-x-2">
              <GitCommit className="w-4 h-4 text-[#58a6ff]" />
              <span>Visual Commit Tree</span>
            </span>
            <span className="text-[10px] text-[#8b949e]">{state.gitCommits.length} revisions</span>
          </div>

          <div className="space-y-2">
            {state.gitCommits.map((node, idx) => {
              const isSelected = selectedCommit?.hash === node.hash;
              const isLatest = idx === 0;

              return (
                <div
                  key={node.hash}
                  onClick={() => setSelectedCommit(node)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#1f6feb]/20 border-[#58a6ff] text-white shadow-md'
                      : 'bg-[#0d1117] border-[#21262d] text-[#c9d1d9] hover:bg-[#21262d]/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Visual branch node indicator */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        isLatest ? 'bg-[#58a6ff] border-white animate-pulse' : 'bg-[#161b22] border-[#58a6ff]'
                      }`}></div>
                      {idx < state.gitCommits.length - 1 && <div className="w-0.5 h-6 bg-[#30363d]"></div>}
                    </div>

                    <div>
                      <div className="font-bold text-xs flex items-center space-x-2">
                        <span>{node.message}</span>
                        {node.tag && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-950 text-purple-300 border border-purple-800 flex items-center space-x-1">
                            <Tag className="w-2.5 h-2.5" />
                            <span>{node.tag}</span>
                          </span>
                        )}
                        {isLatest && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-950 text-[#58a6ff] border border-blue-800">
                            HEAD &rarr; {node.branch}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#8b949e] mt-0.5">
                        <code className="text-[#58a6ff]">{node.hash}</code> • by {node.author} • {node.date} • {node.filesChanged} files changed
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`Viewing diff for commit: ${node.hash}`);
                    }}
                    className="p-1 hover:text-white text-[#8b949e] rounded"
                    title="Inspect Commit Diff"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
