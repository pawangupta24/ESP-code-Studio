import React, { useState } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { THEME_PALETTES } from '../themeTokens';
import {
  Blocks,
  Search,
  Check,
  Download,
  Trash2,
  Power,
  Star,
  ExternalLink,
} from 'lucide-react';

export const ExtensionsSidebar: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [filter, setFilter] = useState<'all' | 'installed'>('all');
  const palette = THEME_PALETTES[state.theme] || THEME_PALETTES['github-dark'];

  const query = state.extensionSearchQuery.toLowerCase();
  const filtered = state.extensions.filter((ext) => {
    const matchesSearch =
      ext.displayName.toLowerCase().includes(query) ||
      ext.description.toLowerCase().includes(query) ||
      ext.publisher.toLowerCase().includes(query) ||
      ext.fileExtensions.some((fe) => fe.toLowerCase().includes(query));

    if (!matchesSearch) return false;
    if (filter === 'installed') return ext.installed;
    return true;
  });

  const installedCount = state.extensions.filter((e) => e.installed).length;

  const handleSelectExtension = (id: string) => {
    actions.setSelectedExtensionId(id);
    actions.setActiveNavTab('extensions');
  };

  return (
    <div
      style={{ backgroundColor: palette.bgMain, color: palette.text }}
      className="w-full flex flex-col h-full select-none font-mono text-xs overflow-hidden"
    >
      {/* Title Bar */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-[#30363d] text-[#8b949e] font-semibold text-[11px] tracking-wide flex-shrink-0">
        <div className="flex items-center space-x-1.5 truncate">
          <Blocks className="w-3.5 h-3.5 text-[#58a6ff]" />
          <span className="uppercase text-[#8b949e]">Extensions</span>
          <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px]">
            {installedCount}
          </span>
        </div>

        <button
          onClick={() => actions.setActiveNavTab('extensions')}
          className="flex items-center space-x-1 hover:text-[#58a6ff] p-1 rounded hover:bg-[#21262d] text-[10px]"
          title="Open Full Screen Extensions Marketplace"
        >
          <span>Marketplace</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Search Input Box */}
      <div className="p-2 border-b border-[#21262d] flex-shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#8b949e]" />
          <input
            type="text"
            value={state.extensionSearchQuery}
            onChange={(e) => actions.setExtensionSearchQuery(e.target.value)}
            placeholder="Search extensions in marketplace..."
            className="w-full bg-[#0d1117] border border-[#30363d] pl-8 pr-6 py-1.5 rounded text-white text-[11px] outline-none placeholder-[#484f58] focus:border-[#58a6ff]"
          />
          {state.extensionSearchQuery && (
            <button
              onClick={() => actions.setExtensionSearchQuery('')}
              className="absolute right-2 top-1.5 text-[#8b949e] hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex items-center space-x-1 mt-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-1 rounded text-[10px] font-semibold text-center transition-colors ${
              filter === 'all'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'bg-[#0d1117] text-[#8b949e] hover:text-white border border-[#30363d]'
            }`}
          >
            All ({state.extensions.length})
          </button>
          <button
            onClick={() => setFilter('installed')}
            className={`flex-1 py-1 rounded text-[10px] font-semibold text-center transition-colors ${
              filter === 'installed'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'bg-[#0d1117] text-[#8b949e] hover:text-white border border-[#30363d]'
            }`}
          >
            Installed ({installedCount})
          </button>
        </div>
      </div>

      {/* Extensions List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#21262d]">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-[#8b949e] space-y-1">
            <Blocks className="w-6 h-6 mx-auto opacity-40 text-purple-400" />
            <p className="text-xs font-semibold">No extensions found</p>
            <p className="text-[10px]">Try searching "python", "rust", "c++", or "ini"</p>
          </div>
        ) : (
          filtered.map((ext) => {
            const isSelected = state.selectedExtensionId === ext.id;

            return (
              <div
                key={ext.id}
                onClick={() => handleSelectExtension(ext.id)}
                style={{
                  backgroundColor: isSelected ? palette.bgActive : 'transparent',
                }}
                className="p-2.5 hover:bg-[#21262d]/60 cursor-pointer transition-colors space-y-1.5"
              >
                <div className="flex items-start justify-between">
                  {/* Left: Icon & Details */}
                  <div className="flex items-start space-x-2 truncate">
                    <div className="w-7 h-7 rounded bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                      {ext.icon}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="font-semibold text-white text-xs truncate hover:text-[#58a6ff]">
                          {ext.displayName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[10px] text-[#8b949e]">
                        <span className="text-[#58a6ff]">{ext.publisher}</span>
                        <span>•</span>
                        <span className="flex items-center text-amber-400">
                          <Star className="w-2.5 h-2.5 fill-current mr-0.5" />
                          <span>{ext.rating}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Install / Manage Action */}
                  <div className="flex items-center space-x-1 ml-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {!ext.installed ? (
                      <button
                        onClick={() => actions.installExtension(ext.id, true)}
                        className="px-2 py-0.5 rounded bg-[#1f6feb] hover:bg-[#388bfd] text-white text-[10px] font-semibold flex items-center space-x-1 transition-colors shadow-sm"
                        title="Install Extension"
                      >
                        <Download className="w-2.5 h-2.5" />
                        <span>Install</span>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <span className="text-emerald-400 p-0.5" title="Installed">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                        <button
                          onClick={() => actions.toggleExtension(ext.id)}
                          className={`p-1 rounded ${
                            ext.enabled ? 'text-blue-400 hover:text-blue-300' : 'text-slate-500 hover:text-white'
                          }`}
                          title={ext.enabled ? 'Disable' : 'Enable'}
                        >
                          <Power className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => actions.uninstallExtension(ext.id)}
                          className="p-1 rounded text-[#8b949e] hover:text-rose-400"
                          title="Uninstall"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-[10px] text-[#8b949e] line-clamp-2 leading-relaxed">
                  {ext.description}
                </p>

                {/* Formats Tags */}
                <div className="flex items-center space-x-1 overflow-x-auto text-[9px]">
                  {ext.fileExtensions.slice(0, 3).map((fe) => (
                    <span
                      key={fe}
                      className="px-1 py-0.2 rounded bg-[#0d1117] text-[#58a6ff] border border-[#30363d]"
                    >
                      {fe}
                    </span>
                  ))}
                  {ext.fileExtensions.length > 3 && (
                    <span className="text-[#8b949e]">+{ext.fileExtensions.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
