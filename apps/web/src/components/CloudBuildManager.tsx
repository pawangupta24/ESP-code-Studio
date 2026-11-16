import React from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { Cloud, CheckCircle2, Clock, Download, Layers } from 'lucide-react';

export const CloudBuildManager: React.FC = () => {
  const [state, actions] = useWorkspaceStore();

  const pipelineSteps = [
    { name: 'Queue & Worker Allocator', status: 'Completed', detail: 'BullMQ worker container: builder-esp32s3-us-east-1' },
    { name: 'Toolchain Sandbox (Docker)', status: 'Completed', detail: 'PlatformIO v6.1.15 / GCC 12.2.0 (Xtensa LX7)' },
    { name: 'Firmware Compilation', status: state.buildStatus === 'COMPILING' ? 'In Progress' : state.buildStatus === 'SUCCESS' ? 'Completed' : 'Pending', detail: 'Compiling .pio/build/esp32s3/src/main.cpp.o' },
    { name: 'Partition Table & Bootloader', status: state.buildStatus === 'SUCCESS' ? 'Completed' : 'Pending', detail: 'Merged 3 ELF sections @ 0x0000, 0x8000, 0x10000' },
    { name: 'S3 Artifact Storage & CDN', status: state.buildStatus === 'SUCCESS' ? 'Completed' : 'Pending', detail: 'SHA-256 verification and upload to AWS S3 bucket' },
  ];

  return (
    <div className="flex-1 p-6 bg-[#0d1117] overflow-y-auto text-xs font-mono">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Cloud className="w-5 h-5 text-[#58a6ff]" />
              <span>Cloud Build & CI/CD Pipeline</span>
            </h2>
            <p className="text-[#8b949e] mt-0.5">
              Containerized headless builds running isolated Docker PlatformIO toolchains.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-[10px] text-[#8b949e]">Engine Mode:</div>
              <div className="text-xs font-bold text-[#58a6ff] uppercase">{state.buildEngineMode} Compilation</div>
            </div>
            <button
              onClick={actions.triggerBuild}
              disabled={state.isBuilding}
              className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg font-semibold text-xs shadow-md disabled:opacity-50"
            >
              {state.isBuilding ? 'Running Pipeline...' : 'Trigger Cloud Build'}
            </button>
          </div>
        </div>

        {/* Pipeline Execution Flow */}
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-4">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5">
            <span className="font-bold text-white text-xs">Build Pipeline Stages</span>
            <div className="flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-[#8b949e]" />
              <span className="text-[#8b949e]">Last Build: {state.buildDurationMs ? `${state.buildDurationMs} ms` : 'Idle'}</span>
            </div>
          </div>

          <div className="space-y-3">
            {pipelineSteps.map((step, idx) => (
              <div key={idx} className="flex items-start space-x-3 p-2.5 rounded-lg bg-[#0d1117] border border-[#21262d]">
                <div className="mt-0.5">
                  {step.status === 'Completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : step.status === 'In Progress' ? (
                    <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-600"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{step.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      step.status === 'Completed' ? 'text-emerald-400 bg-emerald-950/60' :
                      step.status === 'In Progress' ? 'text-blue-400 bg-blue-950/60' : 'text-slate-500'
                    }`}>
                      {step.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8b949e] mt-0.5">{step.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Build Artifacts & Memory Map */}
        {state.lastArtifact && (
          <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-4">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5">
              <span className="font-bold text-white text-xs flex items-center space-x-2">
                <Layers className="w-4 h-4 text-[#58a6ff]" />
                <span>Standardized Firmware Package</span>
              </span>
              <span className="text-emerald-400 text-[11px]">Ready for Flashing</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {state.lastArtifact.manifest.segments.map((seg) => (
                <div key={seg.name} className="p-3 bg-[#0d1117] rounded-lg border border-[#21262d] space-y-1">
                  <div className="text-white font-semibold capitalize">{seg.name}</div>
                  <div className="text-[#8b949e] text-[10px]">Offset: <code className="text-[#58a6ff]">{seg.offset}</code></div>
                  <div className="text-[10px] text-slate-400">Size: {(seg.sizeBytes / 1024).toFixed(1)} KB</div>
                  <button
                    onClick={() => alert(`Downloading artifact: ${seg.path}`)}
                    className="w-full mt-2 py-1 bg-[#21262d] hover:bg-[#30363d] text-white rounded text-[10px] flex items-center justify-center space-x-1"
                  >
                    <Download className="w-3 h-3 text-[#58a6ff]" />
                    <span>Download</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Merged One-Shot Binary */}
            <div className="p-3 bg-blue-950/20 border border-blue-900/50 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-[#58a6ff] font-bold">merged-firmware.bin</div>
                <div className="text-[10px] text-[#8b949e]">Consolidated flash image starting at 0x00000000 for manufacturing & factory flashing</div>
              </div>
              <button
                onClick={() => alert('Downloading merged factory image: merged-firmware.bin')}
                className="px-3 py-1.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded text-xs font-semibold flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Merged BIN</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
