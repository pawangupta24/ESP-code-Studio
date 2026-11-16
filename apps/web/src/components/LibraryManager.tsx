import React, { useState } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { Package, Search, Check, Plus, ExternalLink } from 'lucide-react';

export const LibraryManager: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [query, setQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const filtered = state.libraries.filter((lib) => {
    const matchesQuery = lib.name.toLowerCase().includes(query.toLowerCase()) ||
                         lib.description.toLowerCase().includes(query.toLowerCase());
    const matchesCat = filterCategory === 'All' || lib.category === filterCategory;
    return matchesQuery && matchesCat;
  });

  return (
    <div className="w-80 bg-[#161b22] border-r border-[#30363d] flex flex-col h-full select-none text-xs font-mono">
      {/* Header */}
      <div className="p-3 border-b border-[#30363d]">
        <div className="flex items-center space-x-2 text-white font-semibold mb-2">
          <Package className="w-4 h-4 text-[#58a6ff]" />
          <span>Embedded Library Registry</span>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#8b949e]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search PlatformIO / Arduino libraries..."
            className="w-full bg-[#0d1117] border border-[#30363d] pl-8 pr-3 py-1.5 rounded text-white text-xs outline-none focus:border-[#58a6ff]"
          />
        </div>

        {/* Categories */}
        <div className="flex space-x-1 mt-2 overflow-x-auto py-1">
          {['All', 'Sensors', 'Display', 'Communication', 'Data Processing'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-[#58a6ff] text-black font-bold'
                  : 'bg-[#21262d] text-[#8b949e] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Library List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filtered.map((lib) => (
          <div
            key={lib.name}
            className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff]/50 transition-colors space-y-2"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-white font-bold text-xs">{lib.name}</span>
                <div className="text-[10px] text-[#8b949e] mt-0.5">
                  v{lib.version} by {lib.author}
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#21262d] text-[#58a6ff]">
                {lib.category}
              </span>
            </div>

            <p className="text-[11px] text-[#8b949e] leading-relaxed line-clamp-2">
              {lib.description}
            </p>

            <div className="flex items-center justify-between pt-1 border-t border-[#21262d]">
              <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                <span>PlatformIO Registry</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </span>

              <button
                onClick={() => actions.toggleLibrary(lib.name)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[10px] font-semibold transition-colors ${
                  lib.installed
                    ? 'bg-rose-950/60 text-rose-400 border border-rose-800 hover:bg-rose-900'
                    : 'bg-[#238636] hover:bg-[#2ea043] text-white'
                }`}
              >
                {lib.installed ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Installed (Remove)</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3" />
                    <span>Install</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
