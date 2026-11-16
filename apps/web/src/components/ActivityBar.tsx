import React from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import {
  Files,
  Search,
  GitBranch,
  PlayCircle,
  Blocks,
  Cpu,
  Settings,
  Bot,
} from 'lucide-react';

interface ActivityBarProps {
  activeView: string;
  onSelectView: (view: string) => void;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({ activeView, onSelectView }) => {
  const [state, actions] = useWorkspaceStore();

  const primaryItems = [
    { id: 'explorer', label: 'Explorer (Ctrl+Shift+E)', icon: Files },
    { id: 'search', label: 'Search & Replace (Ctrl+Shift+F)', icon: Search },
    { id: 'git', label: 'Source Control (Ctrl+Shift+G)', icon: GitBranch, badge: state.stagedFiles.length > 0 ? state.stagedFiles.length : undefined },
    { id: 'debug', label: 'Run & Hardware Debug', icon: PlayCircle },
    { id: 'extensions', label: 'Extensions Marketplace (Ctrl+Shift+X)', icon: Blocks },
    { id: 'esp32', label: 'ESP32 Hardware Tools (Pinout, FreeRTOS, OTA)', icon: Cpu },
  ];

  return (
    <div className="w-12 bg-[#0d1117] border-r border-[#30363d] flex flex-col items-center py-2 select-none justify-between z-10">
      {/* Top Activities */}
      <div className="flex flex-col space-y-2.5">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              title={item.label}
              className={`p-2.5 rounded-lg transition-all relative group ${
                isActive
                  ? 'text-white bg-[#21262d] shadow-sm'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#58a6ff] rounded-r"></div>
              )}
              <Icon className="w-5 h-5" />
              {item.badge !== undefined && (
                <span className="absolute top-1 right-1 px-1 min-w-[14px] h-3.5 rounded-full bg-[#1f6feb] text-white text-[9px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Activities: AI Copilot, Settings, Account */}
      <div className="flex flex-col items-center space-y-2">
        {/* Embedded AI Copilot Button */}
        <button
          onClick={actions.toggleAiPanel}
          title="Toggle Embedded AI Copilot (Claude, Gemini, GPT-4o)"
          className={`p-2 rounded-lg transition-colors relative ${
            state.isAiPanelOpen
              ? 'text-purple-300 bg-purple-950/80 border border-purple-800'
              : 'text-purple-400 hover:text-purple-300 hover:bg-[#161b22]'
          }`}
        >
          <Bot className="w-5 h-5" />
        </button>

        {/* Settings Button */}
        <button
          onClick={() => onSelectView('settings')}
          title="IDE & Toolchain Settings"
          className={`p-2 rounded-lg transition-colors ${
            state.activeNavTab === 'settings'
              ? 'text-[#58a6ff] bg-[#21262d]'
              : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'
          }`}
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* User Account Avatar */}
        <div
          onClick={() => actions.setAuthModalOpen(true)}
          title={`${state.user.name} (${state.user.plan}) - Click to manage account`}
          className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold border border-[#30363d] cursor-pointer hover:opacity-85 shadow-sm"
        >
          ES
        </div>
      </div>
    </div>
  );
};
