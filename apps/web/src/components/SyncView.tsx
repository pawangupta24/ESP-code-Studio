import React, { useState } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { GitBranch, GitCommit, RefreshCw, AlertOctagon } from 'lucide-react';

export const SyncView: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [isSimulatingConflict, setIsSimulatingConflict] = useState(false);

  const revisions = [
    { rev: `rev-${state.revisionCount}`, message: 'Active local working copy', author: 'Local Developer', time: 'Just now', current: true },
    { rev: 'rev-009', message: 'Configured ESP32-S3 WS2812 pin 48 & telemetry interval', author: 'Alice (Cloud)', time: '2 hours ago' },
    { rev: 'rev-008', message: 'Added FreeRTOS heap memory watcher', author: 'Bob (Cloud)', time: 'Yesterday' },
    { rev: 'rev-001', message: 'Initial commit from ESP32-S3 template', author: 'ESP Studio System', time: '3 days ago' },
  ];

  return (
    <div className="flex-1 p-6 bg-[#0d1117] overflow-y-auto text-xs font-mono select-none">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <GitBranch className="w-5 h-5 text-[#58a6ff]" />
              <span>Local-First Cloud Synchronization Engine</span>
            </h2>
            <p className="text-[#8b949e] mt-0.5">
              Deterministic SHA-256 tree hashing with 3-way non-destructive merge resolution.
            </p>
          </div>

          <button
            onClick={actions.triggerSync}
            className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg font-semibold text-xs flex items-center space-x-2 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Synchronize Now</span>
          </button>
        </div>

        {/* Sync Status Banner */}
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
            <div>
              <div className="text-white font-bold text-sm">Status: {state.syncStatus}</div>
              <div className="text-[#8b949e] text-[11px]">Last synced at {state.lastSyncedAt}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSimulatingConflict(!isSimulatingConflict)}
              className="px-3 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-amber-400 border border-amber-900/50 text-[11px]"
            >
              {isSimulatingConflict ? 'Clear Simulated Conflict' : 'Simulate 3-Way Conflict'}
            </button>
          </div>
        </div>

        {/* Conflict Resolution Mockup if activated */}
        {isSimulatingConflict && (
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/60 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
              <div className="flex items-center space-x-2 text-amber-400 font-bold">
                <AlertOctagon className="w-4 h-4" />
                <span>Concurrent Modification Detected in src/main.cpp</span>
              </div>
              <span className="text-[10px] text-amber-300">Three-Way Merge Required</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="p-3 bg-[#0d1117] rounded-lg border border-[#30363d] space-y-1">
                <div className="text-[#58a6ff] font-bold">Local Offline Copy:</div>
                <code className="text-[#c9d1d9] block bg-[#161b22] p-2 rounded">
                  #define TELEMETRY_INTERVAL_MS 2000<br/>
                  #define STATUS_LED_PIN 48
                </code>
                <button
                  onClick={() => {
                    actions.notify('info', 'Kept local changes (simulated sync).');
                    setIsSimulatingConflict(false);
                  }}
                  className="w-full mt-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold"
                >
                  Keep Local Version
                </button>
              </div>

              <div className="p-3 bg-[#0d1117] rounded-lg border border-[#30363d] space-y-1">
                <div className="text-purple-400 font-bold">Remote Cloud Revision:</div>
                <code className="text-[#c9d1d9] block bg-[#161b22] p-2 rounded">
                  #define TELEMETRY_INTERVAL_MS 5000<br/>
                  #define STATUS_LED_PIN 48
                </code>
                <button
                  onClick={() => {
                    actions.notify('info', 'Adopted cloud changes (simulated sync).');
                    setIsSimulatingConflict(false);
                  }}
                  className="w-full mt-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold"
                >
                  Adopt Cloud Version
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Revision History */}
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-3">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
            <span className="font-bold text-white text-xs">Project Revision History</span>
            <span className="text-[#8b949e] text-[11px]">Transactional SHA-256 Tree</span>
          </div>

          <div className="space-y-2">
            {revisions.map((rev) => (
              <div
                key={rev.rev}
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  rev.current
                    ? 'bg-[#0d1117] border-[#58a6ff]/50'
                    : 'bg-[#0d1117]/60 border-[#21262d]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <GitCommit className={`w-4 h-4 ${rev.current ? 'text-[#58a6ff]' : 'text-[#8b949e]'}`} />
                  <div>
                    <div className="text-white font-semibold flex items-center space-x-2">
                      <span>{rev.message}</span>
                      {rev.current && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-950 text-[#58a6ff] border border-blue-800">
                          HEAD
                        </span>
                      )}
                    </div>
                    <div className="text-[#8b949e] text-[10px] mt-0.5">
                      Revision: <code className="text-slate-300">{rev.rev}</code> • by {rev.author} • {rev.time}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => actions.notify('info', `Revision diffs are not available yet (sample revision ${rev.rev}).`)}
                  className="px-2 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white rounded text-[11px]"
                >
                  View Diff
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
