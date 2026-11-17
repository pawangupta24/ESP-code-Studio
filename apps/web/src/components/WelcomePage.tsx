import React from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { FileIcon } from './FileIcon';
import { formatShortcut } from '../utils/platform';
import { pickColorTheme, pickNewFileLanguage } from '../quickPicks';
import { FilePlus, FileText, FolderOpen, LayoutTemplate, Palette, Keyboard, Blocks, Sparkles } from 'lucide-react';

/** VS Code's Welcome page: start actions, recent files and walkthrough links. */
export const WelcomePage: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const recent = state.recentFiles.filter((p) => state.project.files[p]).slice(0, 8);

  const link = (icon: React.ReactNode, label: string, onClick: () => void, hint?: string) => (
    <button key={label} onClick={onClick} className="flex items-center gap-2 py-1 text-[13px] text-[#58a6ff] hover:underline text-left">
      {icon}
      <span>{label}</span>
      {hint && <span className="text-[11px] text-[#8b949e]">{formatShortcut(hint)}</span>}
    </button>
  );

  const card = (icon: React.ReactNode, title: string, body: string, onClick: () => void) => (
    <button key={title} onClick={onClick} className="w-full text-left p-3 rounded-md bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] flex gap-3">
      <span className="text-[#58a6ff] mt-0.5">{icon}</span>
      <span>
        <span className="block text-[13px] text-white">{title}</span>
        <span className="block text-[12px] text-[#8b949e] mt-0.5">{body}</span>
      </span>
    </button>
  );

  return (
    <div className="flex-1 overflow-y-auto font-sans select-none">
      <div className="max-w-4xl mx-auto px-10 py-12">
        <h1 className="text-3xl text-white font-light">ESP Studio</h1>
        <p className="text-[#8b949e] text-base mt-1">Editing evolved, for ESP32</p>

        <div className="grid md:grid-cols-2 gap-12 mt-10">
          <div className="space-y-8">
            <section>
              <h2 className="text-lg text-white mb-2">Start</h2>
              {link(<FilePlus className="w-4 h-4" />, 'New File...', () => pickNewFileLanguage(actions))}
              {link(<FileText className="w-4 h-4" />, 'Open File...', () => window.dispatchEvent(new Event('esp-studio:open-file')), 'Ctrl+O')}
              {link(<FolderOpen className="w-4 h-4" />, 'Open Folder...', () => window.dispatchEvent(new Event('esp-studio:open-folder')))}
              {link(<LayoutTemplate className="w-4 h-4" />, 'New Project from Template...', () => actions.setActiveNavTab('templates'))}
            </section>

            <section>
              <h2 className="text-lg text-white mb-2">Recent</h2>
              {recent.length === 0 ? (
                <p className="text-[13px] text-[#8b949e]">You have no recent files.</p>
              ) : (
                recent.map((p) => (
                  <button key={p} onClick={() => actions.openFile(p)} className="flex items-center gap-2 py-1 text-[13px] text-left group">
                    <FileIcon filename={p.split('/').pop()!} className="w-4 h-4" />
                    <span className="text-[#58a6ff] group-hover:underline">{p.split('/').pop()}</span>
                    <span className="text-[#8b949e] text-[12px] truncate">{p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : ''}</span>
                  </button>
                ))
              )}
            </section>
          </div>

          <section className="space-y-2">
            <h2 className="text-lg text-white mb-2">Walkthroughs</h2>
            {card(<Sparkles className="w-5 h-5" />, 'Get Started with ESP Studio', 'A short tour of building, flashing and the serial monitor.', () => actions.setTourOpen(true))}
            {card(<Palette className="w-5 h-5" />, 'Choose a Color Theme', 'Pick a theme, or install more from Extensions.', () => pickColorTheme(state, actions))}
            {card(<Keyboard className="w-5 h-5" />, 'Learn the Keyboard Shortcuts', 'Every command and its keybinding.', () => actions.openSettings('keybindings'))}
            {card(<Blocks className="w-5 h-5" />, 'Add Language Support', 'Install snippets for Python, Go, Rust, Java and more.', () => {
              actions.setSidebarView('extensions');
              actions.setActiveNavTab('extensions');
            })}
          </section>
        </div>
      </div>
    </div>
  );
};
