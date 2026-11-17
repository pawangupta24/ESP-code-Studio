import React, { useEffect, useRef, useState } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { formatShortcut } from '../utils/platform';
import { pickColorTheme } from '../quickPicks';
import { Files, Search, GitBranch, PlayCircle, Blocks, Cpu, Settings, Bot, CircleUserRound } from 'lucide-react';

interface ActivityBarProps {
  activeView: string;
  onSelectView: (view: string) => void;
}

type MenuEntry = { label: string; hint?: string; run: () => void } | null;

/** Small popup menu that opens to the right of the activity bar (Manage / Accounts). */
const PopupMenu: React.FC<{ items: MenuEntry[]; onClose: () => void; header?: React.ReactNode }> = ({ items, onClose, header }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onClose();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', onKey);
    };
  }, []);
  return (
    <div ref={ref} className="absolute left-full bottom-0 ml-1 min-w-[260px] bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl py-1 z-50 font-sans text-[12px] text-[#c9d1d9]">
      {header}
      {items.map((item, i) =>
        item === null ? (
          <div key={i} className="my-1 border-t border-[#30363d]" />
        ) : (
          <button
            key={item.label}
            onClick={() => {
              onClose();
              item.run();
            }}
            className="w-full text-left px-3 py-1 flex justify-between gap-6 hover:bg-[#1f6feb] hover:text-white"
          >
            <span>{item.label}</span>
            {item.hint && <span className="opacity-60">{formatShortcut(item.hint)}</span>}
          </button>
        )
      )}
    </div>
  );
};

export const ActivityBar: React.FC<ActivityBarProps> = ({ activeView, onSelectView }) => {
  const [state, actions] = useWorkspaceStore();
  const [menu, setMenu] = useState<'manage' | 'accounts' | null>(null);

  const primaryItems = [
    // Explorer badge = unsaved files, like VS Code
    { id: 'explorer', label: 'Explorer (Ctrl+Shift+E)', icon: Files, badge: state.dirtyFiles.length || undefined },
    { id: 'search', label: 'Search (Ctrl+Shift+F)', icon: Search },
    { id: 'git', label: 'Source Control (Ctrl+Shift+G)', icon: GitBranch, badge: state.stagedFiles.length || undefined },
    { id: 'debug', label: 'Run and Debug (Ctrl+Shift+D)', icon: PlayCircle },
    { id: 'extensions', label: 'Extensions (Ctrl+Shift+X)', icon: Blocks },
    { id: 'esp32', label: 'ESP32 Hardware Tools', icon: Cpu },
  ];

  const manageItems: MenuEntry[] = [
    { label: 'Command Palette...', hint: 'Ctrl+Shift+P', run: () => actions.setCommandPaletteOpen(true) },
    null,
    { label: 'Settings', hint: 'Ctrl+,', run: () => actions.openSettings() },
    { label: 'Extensions', hint: 'Ctrl+Shift+X', run: () => onSelectView('extensions') },
    { label: 'Keyboard Shortcuts', hint: 'Ctrl+K Ctrl+S', run: () => actions.openSettings('keybindings') },
    null,
    { label: 'Color Theme', hint: 'Ctrl+K Ctrl+T', run: () => pickColorTheme(state, actions) },
    null,
    { label: 'Welcome', run: actions.openWelcome },
  ];

  const accountItems: MenuEntry[] = state.isLoggedIn
    ? [
        { label: 'Manage Account...', run: () => actions.setAuthModalOpen(true) },
        null,
        { label: 'Sign Out', run: actions.logoutUser },
      ]
    : [{ label: 'Sign in to Sync Settings & Cloud Builds...', run: () => actions.setAuthModalOpen(true) }];

  const badge = (n?: number) =>
    n ? (
      <span className="absolute bottom-1 right-1 px-1 min-w-[16px] h-4 rounded-full bg-[#1f6feb] text-white text-[9px] font-bold flex items-center justify-center">
        {n}
      </span>
    ) : null;

  return (
    <div className="w-12 bg-[#0d1117] border-r border-[#30363d] flex flex-col items-center py-1 select-none justify-between z-10">
      <div className="flex flex-col w-full">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              title={item.label}
              className={`h-12 w-full flex items-center justify-center relative ${isActive ? 'text-white' : 'text-[#8b949e] hover:text-white'}`}
            >
              {isActive && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#58a6ff]" />}
              <Icon className="w-6 h-6" strokeWidth={1.5} />
              {badge(item.badge)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col w-full">
        <button
          onClick={actions.toggleAiPanel}
          title="Toggle AI Copilot (Ctrl+Shift+A)"
          className={`h-12 w-full flex items-center justify-center ${state.isAiPanelOpen ? 'text-purple-300' : 'text-purple-400/80 hover:text-purple-300'}`}
        >
          <Bot className="w-6 h-6" strokeWidth={1.5} />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenu(menu === 'accounts' ? null : 'accounts')}
            title={state.isLoggedIn ? `${state.user.name} (${state.user.plan})` : 'Accounts'}
            className={`h-12 w-full flex items-center justify-center ${menu === 'accounts' ? 'text-white' : 'text-[#8b949e] hover:text-white'}`}
          >
            <CircleUserRound className="w-6 h-6" strokeWidth={1.5} />
          </button>
          {menu === 'accounts' && (
            <PopupMenu
              items={accountItems}
              onClose={() => setMenu(null)}
              header={
                state.isLoggedIn ? (
                  <div className="px-3 py-1.5 text-[11px] text-[#8b949e] border-b border-[#30363d] mb-1">
                    {state.user.name} <span className="opacity-70">({state.user.plan})</span>
                  </div>
                ) : undefined
              }
            />
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setMenu(menu === 'manage' ? null : 'manage')}
            title="Manage"
            className={`h-12 w-full flex items-center justify-center ${
              menu === 'manage' || state.activeNavTab === 'settings' ? 'text-white' : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <Settings className="w-6 h-6" strokeWidth={1.5} />
          </button>
          {menu === 'manage' && <PopupMenu items={manageItems} onClose={() => setMenu(null)} />}
        </div>
      </div>
    </div>
  );
};
