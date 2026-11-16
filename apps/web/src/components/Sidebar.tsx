import React from 'react';
import { useWorkspaceStore, NavTab } from '../stores/useWorkspaceStore';
import { Files, Cpu, Sliders, Activity, Wifi, Package, GitCommit, Sparkles, Cloud, GitBranch, Settings, Bot, Blocks } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const [state, actions] = useWorkspaceStore();

  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'explorer', label: 'File Explorer', icon: Files },
    { id: 'ai-copilot', label: 'Embedded AI Copilot (Claude, Gemini, GPT-4o)', icon: Bot },
    { id: 'devices', label: 'Board & Device Manager', icon: Cpu },
    { id: 'extensions', label: 'Extensions Marketplace & Languages (Ctrl+Shift+X)', icon: Blocks },
    { id: 'templates', label: 'Embedded Project Templates', icon: Sparkles },
    { id: 'git-graph', label: 'Git Graph & Version Tree', icon: GitCommit },
    { id: 'pinout', label: 'ESP32-S3 Pinout & GPIO Matrix', icon: Sliders },
    { id: 'freertos', label: 'FreeRTOS Task Profiler', icon: Activity },
    { id: 'ota', label: 'Over-The-Air Wireless Flasher', icon: Wifi },
    { id: 'libraries', label: 'Embedded Libraries', icon: Package },
    { id: 'build', label: 'Cloud CI/CD & Build Pipeline', icon: Cloud },
    { id: 'sync', label: 'Local-First Cloud Sync', icon: GitBranch },
    { id: 'settings', label: 'IDE & Toolchain Settings', icon: Settings },
  ];

  return (
    <aside className="w-12 bg-[#0d1117] border-r border-[#30363d] flex flex-col items-center py-2.5 select-none justify-between">
      <div className="flex flex-col space-y-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = state.activeNavTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => actions.setActiveNavTab(item.id)}
              title={item.label}
              className={`p-2.5 rounded-lg transition-all relative group ${
                isActive
                  ? 'text-[#58a6ff] bg-[#21262d] shadow-sm'
                  : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#58a6ff] rounded-r"></div>
              )}
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center space-y-2">
        <div
          title="ESP Studio Production Workspace v1.0.0"
          className="w-7 h-7 rounded-full bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[10px] font-mono text-[#8b949e] hover:text-[#58a6ff] cursor-pointer"
        >
          S3
        </div>
      </div>
    </aside>
  );
};
