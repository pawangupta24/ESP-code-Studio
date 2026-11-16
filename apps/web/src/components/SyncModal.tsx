import React from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';

export const SyncModal: React.FC = () => {
  const [state, actions] = useWorkspaceStore();

  if (!state.isSyncModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-mono select-none">
      <div className="w-full max-w-xl bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-[#58a6ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="font-bold text-white text-sm">Cloud & Local Synchronization</span>
          </div>
          <button
            onClick={() => actions.setSyncModalOpen(false)}
            className="text-[#8b949e] hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 space-y-4">
          {!state.isLoggedIn && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] text-amber-300 flex items-center justify-between">
              <div>
                <span className="font-bold">Guest Mode Active:</span> Local-only persistence. Changes remain safely on this device.
              </div>
              <button
                onClick={() => {
                  actions.setSyncModalOpen(false);
                  actions.setAuthModalOpen(true);
                }}
                className="ml-3 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded font-semibold text-[10px]"
              >
                Sign In to Enable Cloud Sync
              </button>
            </div>
          )}

          <div className="p-3 bg-[#0d1117] rounded border border-[#30363d] flex items-center justify-between">
            <div>
              <div className="text-[#8b949e]">Current Sync Status:</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">{state.syncStatus}</div>
            </div>
            <button
              onClick={() => actions.triggerSync()}
              className="px-3 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded font-semibold text-xs"
            >
              Sync Now
            </button>
          </div>

          <div className="space-y-2">
            <span className="text-[#8b949e] block font-semibold">Local-First Revision Model:</span>
            <p className="text-[#c9d1d9] leading-relaxed text-[11px]">
              Every save is committed directly to your local workspace index with SHA-256 integrity digests. When connected to the network, changes are fast-forwarded or reconciled via three-way merge without overwriting embedded pin configurations.
            </p>
          </div>

          <div className="border border-[#21262d] rounded p-2.5 bg-[#0d1117] text-[11px] text-[#8b949e] space-y-1">
            <div className="flex justify-between">
              <span>Project ID:</span>
              <span className="text-[#c9d1d9]">{state.project.metadata.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Tracked Files:</span>
              <span className="text-[#c9d1d9]">{Object.keys(state.project.files).length} files</span>
            </div>
            <div className="flex justify-between">
              <span>Outbox Queue:</span>
              <span className="text-emerald-400">0 pending operations</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#0d1117] border-t border-[#30363d] flex justify-end">
          <button
            onClick={() => actions.setSyncModalOpen(false)}
            className="px-4 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-white rounded font-medium text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
