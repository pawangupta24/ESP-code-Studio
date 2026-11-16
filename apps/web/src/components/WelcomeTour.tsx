import React, { useState } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { Sparkles, Cloud, Cpu, Terminal, RefreshCw, X, ArrowRight, ArrowLeft, Blocks } from 'lucide-react';

export const WelcomeTour: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [step, setStep] = useState(0);

  if (!state.isTourOpen) return null;

  const tourSteps = [
    {
      title: 'Welcome to ESP Studio!',
      subtitle: 'A Hybrid Embedded Development Platform for ESP32-S3',
      icon: Sparkles,
      color: 'text-amber-400',
      description:
        'ESP Studio unifies browser and desktop embedded development with dual compilation (Cloud Docker Workers + Local PlatformIO), Web Serial flashing, and local-first revision synchronization.',
      highlight: 'Core Principle: One codebase, one project format, two execution environments.',
    },
    {
      title: 'Dual Execution Engines',
      subtitle: 'Compile in the Cloud or 100% Offline',
      icon: Cloud,
      color: 'text-[#58a6ff]',
      description:
        'Toggle between Cloud Compilation (isolated Docker containers compiling via BullMQ queue) and Local Compilation (offline PlatformIO toolchain managed directly by your machine).',
      highlight: 'Switch engines anytime from the top navigation toggle.',
    },
    {
      title: 'Real-Time Hardware Telemetry',
      subtitle: 'Serial Monitor + Live Waveform Oscilloscope Plotter',
      icon: Terminal,
      color: 'text-emerald-400',
      description:
        'Stream UART output at up to 921,600 baud directly over Chrome / Edge Web Serial. Switch to the Serial Plotter to graph analog sensors and FreeRTOS heap memory in real-time.',
      highlight: 'Press Ctrl+U to flash via USB CDC, then open the bottom console.',
    },
    {
      title: 'Permanent NVS Device Identity',
      subtitle: 'Track Fleet Hardware Across Reboots',
      icon: Cpu,
      color: 'text-purple-400',
      description:
        'Each board receives a provisioned logical device ID (e.g. SPRAYER-001) stored inside ESP32 Non-Volatile Storage (NVS namespace: esp_studio), independent of dynamic USB COM port numbers.',
      highlight: 'Inspect partition maps and strapping pins in the Device & Pinout tabs.',
    },
    {
      title: 'Local-First Cloud Synchronization',
      subtitle: 'Offline Supremacy with 3-Way Merge',
      icon: RefreshCw,
      color: 'text-cyan-400',
      description:
        'All file edits are hashed with SHA-256 and committed locally. When online, revisions sync with cloud storage without silently overwriting critical pin configurations.',
      highlight: 'Open the Git Graph or Sync tab to inspect branches and commit trees.',
    },
    {
      title: 'Extensions & Multi-Language Support',
      subtitle: 'MicroPython, Rust, QuickJS, JSON & Formatters',
      icon: Blocks,
      color: 'text-purple-400',
      description:
        'Just like VS Code, install extensions for different programming languages (MicroPython, Rust esp-rs, QuickJS JavaScript, Assembly) and configuration formatters. Opening any file type prompts you to install its matching extension.',
      highlight: 'Press Ctrl+Shift+X or click Extensions in the sidebar.',
    },
  ];

  const current = tourSteps[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono select-none">
      <div className="w-full max-w-lg bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs">
        {/* Header */}
        <div className="px-5 py-3 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]/60">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#8b949e]">
              Feature Walkthrough • Step {step + 1} of {tourSteps.length}
            </span>
          </div>
          <button
            onClick={() => actions.setTourOpen(false)}
            className="text-[#8b949e] hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-[#0d1117] border border-[#21262d]">
              <Icon className={`w-6 h-6 ${current.color}`} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{current.title}</h3>
              <p className="text-xs text-[#8b949e]">{current.subtitle}</p>
            </div>
          </div>

          <p className="text-xs text-[#c9d1d9] leading-relaxed">
            {current.description}
          </p>

          <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-900/40 text-[11px] text-[#58a6ff]">
            💡 {current.highlight}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-1.5 pt-2">
            {tourSteps.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === step ? 'bg-[#58a6ff] w-4' : 'bg-[#30363d]'
                }`}
              ></span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#0d1117] border-t border-[#30363d] flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-3 py-1.5 rounded text-xs font-semibold text-[#8b949e] hover:text-white disabled:opacity-30 flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {step < tourSteps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-4 py-1.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
            >
              <span>Next Feature</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => actions.setTourOpen(false)}
              className="px-4 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg text-xs font-semibold"
            >
              Get Started with ESP Studio
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
