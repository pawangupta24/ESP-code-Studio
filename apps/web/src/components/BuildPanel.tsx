import React from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';

export const BuildPanel: React.FC = () => {
  const [state, actions] = useWorkspaceStore();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] overflow-hidden font-mono text-xs">
      {/* Header */}
      <div className="h-10 bg-[#161b22] border-b border-[#30363d] px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-white">Compilation Output</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            state.buildStatus === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
            state.buildStatus === 'COMPILING' ? 'bg-blue-950 text-blue-400 border border-blue-800 animate-pulse' :
            state.buildStatus === 'FAILED' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
            'bg-[#21262d] text-[#8b949e]'
          }`}>
            {state.buildStatus}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={actions.triggerBuild}
            disabled={state.isBuilding}
            className="px-3 py-1 bg-[#238636] hover:bg-[#2ea043] text-white rounded font-semibold text-xs disabled:opacity-50"
          >
            {state.isBuilding ? 'Building...' : 'Rebuild'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Console Log */}
        <div className="flex-1 p-3 bg-[#090d12] overflow-y-auto select-text font-mono text-[11px] leading-5 text-[#8b949e]">
          {state.buildLogs.length === 0 ? (
            <div className="text-slate-600 italic">No build executed yet. Click "Build" above to compile firmware.</div>
          ) : (
            state.buildLogs.map((line, idx) => (
              <div key={idx} className={line.includes('[SUCCESS]') ? 'text-emerald-400 font-bold' : line.includes('Compiling') ? 'text-[#58a6ff]' : ''}>
                {line}
              </div>
            ))
          )}
        </div>

        {/* Artifact Inspector */}
        {state.lastArtifact && (
          <div className="w-72 bg-[#161b22] border-l border-[#30363d] p-3 flex flex-col space-y-3">
            <span className="font-bold text-white uppercase text-[11px] tracking-wider text-[#8b949e]">
              Generated Artifact
            </span>
            <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] space-y-1.5 text-[11px]">
              <div className="text-[#58a6ff] font-semibold">ESP32-S3 Binary Bundle</div>
              <div className="text-[#8b949e]">Build ID: {state.lastArtifact.buildId}</div>
              <div className="text-[#8b949e]">Mode: {state.lastArtifact.manifest.flashMode} @ {state.lastArtifact.manifest.flashFreq}</div>
            </div>

            <div className="text-[11px] font-semibold text-[#c9d1d9]">Segments ({state.lastArtifact.manifest.segments.length}):</div>
            <div className="space-y-1">
              {state.lastArtifact.manifest.segments.map((seg) => (
                <div key={seg.name} className="p-2 bg-[#0d1117] rounded border border-[#21262d] flex justify-between items-center text-[11px]">
                  <div>
                    <div className="text-white font-medium">{seg.name}</div>
                    <div className="text-[#8b949e] font-mono">{seg.offset}</div>
                  </div>
                  <span className="text-xs text-[#58a6ff]">{(seg.sizeBytes / 1024).toFixed(1)} KB</span>
                </div>
              ))}
            </div>

            <button
              onClick={actions.triggerFlash}
              disabled={state.isFlashing}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold text-xs mt-auto"
            >
              Flash Artifact to Board
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
