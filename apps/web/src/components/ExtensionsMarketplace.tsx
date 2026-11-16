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
  Sparkles,
  FileCode2,
  Star,
  ShieldCheck,
  ArrowLeft,
  X,
} from 'lucide-react';

export const ExtensionsMarketplace: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [categoryFilter, setCategoryFilter] = useState<
    'All' | 'Installed' | 'Language' | 'Formatter' | 'Embedded Runtime' | 'Debugging'
  >('All');
  const [mobileDetailView, setMobileDetailView] = useState(false);
  const palette = THEME_PALETTES[state.theme] || THEME_PALETTES['github-dark'];

  const query = state.extensionSearchQuery.toLowerCase();
  const filtered = state.extensions.filter((ext) => {
    const matchesSearch =
      ext.displayName.toLowerCase().includes(query) ||
      ext.description.toLowerCase().includes(query) ||
      ext.publisher.toLowerCase().includes(query) ||
      ext.fileExtensions.some((fe) => fe.toLowerCase().includes(query));

    if (!matchesSearch) return false;
    if (categoryFilter === 'All') return true;
    if (categoryFilter === 'Installed') return ext.installed;
    return ext.category === categoryFilter;
  });

  const selectedExt =
    state.extensions.find((e) => e.id === state.selectedExtensionId) ||
    filtered[0] ||
    state.extensions[0];
  const installedCount = state.extensions.filter((e) => e.installed).length;

  const handleSelectCard = (id: string) => {
    actions.setSelectedExtensionId(id);
    setMobileDetailView(true);
  };

  return (
    <div
      style={{ backgroundColor: palette.bgMain, color: palette.text }}
      className="flex-1 flex flex-col h-full overflow-hidden select-none font-mono text-xs"
    >
      {/* Marketplace Header */}
      <div
        style={{ backgroundColor: palette.bgSidebar, borderColor: palette.border }}
        className="p-3 sm:p-4 border-b flex flex-col space-y-3 flex-shrink-0"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Blocks className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h1 className="text-sm font-bold text-white font-sans">
                  Extensions & Language Marketplace
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-950 text-purple-300 border border-purple-800">
                  {installedCount} Installed
                </span>
              </div>
              <p className="text-[11px] text-[#8b949e] hidden sm:block">
                Install language packs, runtime engines, and formatters for ESP32 / ESP32-S3.
              </p>
            </div>
          </div>

          {/* Close to Editor Button */}
          <button
            onClick={() => actions.setActiveNavTab('explorer')}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white border border-[#30363d] text-xs transition-colors flex-shrink-0"
            title="Close Marketplace & Return to Editor"
          >
            <span className="hidden sm:inline">Editor</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search Bar & Category Filter Pills */}
        <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div
            style={{ backgroundColor: palette.bgMain, borderColor: palette.border }}
            className="flex-1 flex items-center space-x-2 px-3 py-1.5 rounded-lg border focus-within:border-[#58a6ff]"
          >
            <Search className="w-4 h-4 text-[#8b949e] flex-shrink-0" />
            <input
              type="text"
              value={state.extensionSearchQuery}
              onChange={(e) => actions.setExtensionSearchQuery(e.target.value)}
              placeholder="Search extensions (e.g. python, rust, json, ini, markdown)..."
              style={{ color: palette.text }}
              className="bg-transparent text-xs w-full outline-none placeholder:text-[#8b949e]"
            />
            {state.extensionSearchQuery && (
              <button
                onClick={() => actions.setExtensionSearchQuery('')}
                className="text-[#8b949e] hover:text-white text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
            {(['All', 'Installed', 'Language', 'Formatter', 'Embedded Runtime', 'Debugging'] as const).map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategoryFilter(cat);
                    setMobileDetailView(false);
                  }}
                  style={{
                    backgroundColor: categoryFilter === cat ? palette.accent : palette.bgMain,
                    color: categoryFilter === cat ? '#ffffff' : palette.textMuted,
                    borderColor: palette.border,
                  }}
                  className={`px-2.5 py-1 rounded-md text-[10px] border whitespace-nowrap transition-colors flex-shrink-0 ${
                    categoryFilter === cat ? 'font-bold shadow-sm' : 'hover:text-white'
                  }`}
                >
                  {cat === 'Installed' ? `Installed (${installedCount})` : cat}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Extension Cards List */}
        <div
          style={{ borderColor: palette.border }}
          className={`overflow-y-auto p-3 sm:p-4 space-y-3 border-r ${
            mobileDetailView ? 'hidden lg:block lg:flex-1' : 'flex-1'
          }`}
        >
          {filtered.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-[#8b949e] space-y-2">
              <Blocks className="w-8 h-8 mx-auto opacity-40 text-purple-400" />
              <p className="text-sm font-semibold">No extensions matching "{state.extensionSearchQuery}"</p>
              <p className="text-xs">Try searching for "python", "rust", "ini", or "json".</p>
            </div>
          ) : (
            filtered.map((ext) => {
              const isSelected = selectedExt?.id === ext.id;
              return (
                <div
                  key={ext.id}
                  onClick={() => handleSelectCard(ext.id)}
                  style={{
                    backgroundColor: isSelected ? palette.bgActive : palette.bgSidebar,
                    borderColor: isSelected ? palette.accent : palette.border,
                  }}
                  className={`p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-all hover:border-[#58a6ff]/70 space-y-2.5 ${
                    isSelected ? 'shadow-md ring-1 ring-[#58a6ff]/40' : ''
                  }`}
                >
                  {/* Top row: Icon, Name, Publisher, Version, Action */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2.5 sm:space-x-3 truncate">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
                        {ext.icon}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center space-x-1.5 sm:space-x-2 truncate">
                          <span className="font-bold text-white text-xs hover:text-[#58a6ff] truncate">
                            {ext.displayName}
                          </span>
                          <span className="text-[10px] text-[#8b949e] flex-shrink-0">{ext.version}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-[10px] text-[#8b949e] mt-0.5 flex-wrap">
                          <span className="text-[#58a6ff]">{ext.publisher}</span>
                          <span>•</span>
                          <span className="flex items-center space-x-0.5 text-amber-400">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{ext.rating}</span>
                          </span>
                          <span>•</span>
                          <span>{ext.downloads} installs</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Install / State Action */}
                    <div
                      className="flex items-center space-x-1 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!ext.installed ? (
                        <button
                          onClick={() => actions.installExtension(ext.id, true)}
                          className="flex items-center space-x-1 px-2.5 sm:px-3 py-1 rounded-lg bg-[#1f6feb] hover:bg-[#388bfd] text-white text-[11px] font-semibold transition-colors shadow-sm"
                        >
                          <Download className="w-3 h-3" />
                          <span>Install</span>
                        </button>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <span className="hidden sm:flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                            <Check className="w-3 h-3" />
                            <span>Installed</span>
                          </span>
                          <span className="sm:hidden text-emerald-400 p-1" title="Installed">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                          <button
                            onClick={() => actions.toggleExtension(ext.id)}
                            className={`p-1 rounded border text-[10px] ${
                              ext.enabled
                                ? 'bg-blue-950 text-blue-300 border-blue-800 hover:bg-blue-900'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                            }`}
                            title={ext.enabled ? 'Disable Extension' : 'Enable Extension'}
                          >
                            <Power className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => actions.uninstallExtension(ext.id)}
                            className="p-1 rounded bg-[#21262d] hover:bg-rose-950 hover:text-rose-400 border border-[#30363d] text-[#8b949e] text-[10px]"
                            title="Uninstall Extension"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-[#8b949e] line-clamp-2 leading-relaxed">
                    {ext.description}
                  </p>

                  {/* Bottom meta: Supported file extensions badges */}
                  <div className="flex items-center justify-between pt-1 border-t border-black/20 text-[10px] flex-wrap gap-1">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <span className="text-[#8b949e]">Formats:</span>
                      {ext.fileExtensions.map((fe) => (
                        <span
                          key={fe}
                          className="px-1.5 py-0.2 rounded bg-[#0d1117] text-[#58a6ff] border border-[#30363d]"
                        >
                          {fe}
                        </span>
                      ))}
                    </div>

                    <span className="px-2 py-0.5 rounded bg-[#0d1117] text-purple-300 border border-[#30363d]">
                      {ext.category}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Extension Inspector Drawer */}
        {selectedExt && (
          <div
            style={{ backgroundColor: palette.bgSidebar, borderColor: palette.border }}
            className={`flex flex-col h-full overflow-y-auto p-4 space-y-4 ${
              mobileDetailView
                ? 'w-full flex-1 z-30'
                : 'hidden lg:flex lg:w-96 lg:border-l'
            }`}
          >
            {/* Mobile Back Button */}
            {mobileDetailView && (
              <button
                onClick={() => setMobileDetailView(false)}
                className="lg:hidden flex items-center space-x-1 text-[#58a6ff] hover:underline text-xs pb-2 border-b border-[#30363d]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Extensions List</span>
              </button>
            )}

            {/* Header */}
            <div className="flex items-start space-x-3 pb-3 border-b border-[#30363d]">
              <div className="w-12 h-12 rounded-xl bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-2xl flex-shrink-0">
                {selectedExt.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-white font-sans truncate">
                  {selectedExt.displayName}
                </h2>
                <div className="flex items-center space-x-2 text-[10px] text-[#8b949e] mt-0.5">
                  <span className="text-[#58a6ff] font-semibold">{selectedExt.publisher}</span>
                  <span>•</span>
                  <span>{selectedExt.version}</span>
                </div>
                <div className="flex items-center space-x-2 mt-1 text-[10px] flex-wrap">
                  <span className="flex items-center space-x-0.5 text-amber-400">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{selectedExt.rating} rating</span>
                  </span>
                  <span className="text-[#8b949e]">• {selectedExt.downloads} installs</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center space-x-2">
              {!selectedExt.installed ? (
                <button
                  onClick={() => actions.installExtension(selectedExt.id, true)}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg bg-[#1f6feb] hover:bg-[#388bfd] text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install & Enable</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => actions.toggleExtension(selectedExt.id)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 ${
                      selectedExt.enabled
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{selectedExt.enabled ? 'Enabled' : 'Disabled'}</span>
                  </button>
                  <button
                    onClick={() => actions.uninstallExtension(selectedExt.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-rose-950 hover:text-rose-400 border border-[#30363d] text-xs text-[#8b949e]"
                  >
                    Uninstall
                  </button>
                </>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Overview</h3>
              <p className="text-[11px] text-[#8b949e] leading-relaxed">
                {selectedExt.description}
              </p>
            </div>

            {/* Key Features */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Capabilities & Features</span>
              </h3>
              <div className="space-y-1.5">
                {selectedExt.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-[11px] text-[#c9d1d9]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#58a6ff] flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Supported File Extensions */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center space-x-1">
                <FileCode2 className="w-3.5 h-3.5 text-[#58a6ff]" />
                <span>Supported File Formats</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {selectedExt.fileExtensions.map((fe) => (
                  <span
                    key={fe}
                    className="px-2 py-1 rounded-md bg-[#0d1117] text-[#58a6ff] border border-[#30363d] text-[11px] font-semibold"
                  >
                    {fe}
                  </span>
                ))}
              </div>
            </div>

            {/* Sample Starter Template */}
            {selectedExt.sampleTemplate && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Starter Template</h3>
                  <button
                    onClick={() => actions.installExtension(selectedExt.id, true)}
                    className="text-[10px] text-[#58a6ff] hover:underline"
                  >
                    + Add to Workspace
                  </button>
                </div>
                <div className="rounded-lg bg-[#0d1117] border border-[#30363d] p-2.5 overflow-x-auto text-[10px] text-[#8b949e]">
                  <div className="font-semibold text-white mb-1">{selectedExt.sampleTemplate.filename}</div>
                  <pre className="text-[#58a6ff] whitespace-pre-wrap leading-relaxed">
                    {selectedExt.sampleTemplate.content.substring(0, 150)}...
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
