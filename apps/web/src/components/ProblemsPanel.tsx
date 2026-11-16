import React, { useState } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { FileIcon } from './FileIcon';
import { requestReveal } from '../editorBridge';

export const ProblemsPanel: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [severityFilter, setSeverityFilter] = useState<'all' | 'error' | 'warning'>('all');

  // Combine compiler diagnostics and code diagnostics
  const allProblems: {
    id: string;
    file: string;
    line: number;
    col: number;
    severity: 'error' | 'warning' | 'info';
    message: string;
  }[] = [];

  state.codeDiagnostics.forEach((cd, idx) => {
    allProblems.push({
      id: `cd-${idx}`,
      file: state.activeFilePath,
      line: cd.line,
      col: 1,
      severity: cd.severity,
      message: cd.message,
    });
  });

  state.diagnostics.forEach((d, idx) => {
    allProblems.push({
      id: `comp-${idx}`,
      file: d.file || state.activeFilePath,
      line: d.line,
      col: d.column || 1,
      severity: d.severity,
      message: d.message,
    });
  });

  const filtered = allProblems.filter((p) => {
    if (severityFilter === 'all') return true;
    return p.severity === severityFilter;
  });

  const errorCount = allProblems.filter((p) => p.severity === 'error').length;
  const warningCount = allProblems.filter((p) => p.severity === 'warning').length;

  const handleJumpToProblem = (file: string, line: number, col: number) => {
    actions.setActiveFilePath(file);
    requestReveal(file, line, col);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] overflow-hidden select-none font-mono text-xs">
      {/* Problems Toolbar */}
      <div className="h-8 bg-[#161b22] border-b border-[#30363d] px-3 flex items-center justify-between text-[11px]">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-white">Problems ({allProblems.length})</span>
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1 text-rose-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorCount} Errors</span>
            </span>
            <span className="flex items-center space-x-1 text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{warningCount} Warnings</span>
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1">
          {(['all', 'error', 'warning'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2 py-0.5 rounded text-[10px] capitalize transition-colors ${
                severityFilter === sev
                  ? 'bg-[#1f6feb] text-white font-semibold'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Problems List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#8b949e] space-y-2 p-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/60" />
            <p className="text-sm font-semibold text-white">No problems have been detected in the workspace.</p>
            <p className="text-xs">All C/C++ headers and PlatformIO configurations validated.</p>
          </div>
        ) : (
          filtered.map((prob) => {
            const fileName = prob.file.split('/').pop() || prob.file;
            return (
              <div
                key={prob.id}
                onClick={() => handleJumpToProblem(prob.file, prob.line, prob.col)}
                className="flex items-start space-x-2.5 p-2 rounded hover:bg-[#161b22] cursor-pointer border border-transparent hover:border-[#30363d] transition-colors group"
              >
                {prob.severity === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                ) : prob.severity === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                )}

                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#c9d1d9] group-hover:text-white font-sans text-xs">
                      {prob.message}
                    </span>
                    <span className="text-[#8b949e] text-[10px] font-mono">
                      Ln {prob.line}, Col {prob.col}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 text-[10px] text-[#8b949e]">
                    <FileIcon filename={fileName} className="w-3 h-3" />
                    <span className="text-[#58a6ff] hover:underline">{prob.file}</span>
                    <span>•</span>
                    <span className="uppercase text-[9px] font-bold tracking-wider">
                      {prob.severity}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
