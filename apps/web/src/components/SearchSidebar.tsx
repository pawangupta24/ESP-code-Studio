import React, { useState } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { Search, Replace } from 'lucide-react';
import { FileIcon } from './FileIcon';
import { requestReveal } from '../editorBridge';

interface SearchOptions {
  matchCase: boolean;
  wholeWord: boolean;
  useRegex: boolean;
}

/** Build the global search pattern, or return the regex syntax error to show the user. */
export function buildSearchRegex(query: string, opts: SearchOptions): RegExp | string {
  let source = opts.useRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (opts.wholeWord) source = `\\b(?:${source})\\b`;
  try {
    return new RegExp(source, opts.matchCase ? 'g' : 'gi');
  } catch (err) {
    return (err as Error).message;
  }
}

interface Match {
  line: number;
  col: number;
  before: string;
  hit: string;
  after: string;
}

export const SearchSidebar: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [query, setQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [opts, setOpts] = useState<SearchOptions>({ matchCase: false, wholeWord: false, useRegex: false });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const regex = query ? buildSearchRegex(query, opts) : null;
  const regexError = typeof regex === 'string' ? regex : null;

  // Find matches across all files
  const searchResults: { filePath: string; matches: Match[] }[] = [];
  if (regex instanceof RegExp) {
    Object.entries(state.project.files).forEach(([path, file]) => {
      if (file.isBinary) return;
      const matches: Match[] = [];
      file.content.split('\n').forEach((lineText, idx) => {
        regex.lastIndex = 0;
        const m = regex.exec(lineText);
        // Empty matches (e.g. regex "a*") are not results
        if (m && m[0]) {
          const start = Math.max(0, m.index - 30);
          matches.push({
            line: idx + 1,
            col: m.index + 1,
            before: lineText.slice(start, m.index).trimStart(),
            hit: m[0],
            after: lineText.slice(m.index + m[0].length, m.index + m[0].length + 120),
          });
        }
      });
      if (matches.length > 0) searchResults.push({ filePath: path, matches });
    });
  }

  const totalMatches = searchResults.reduce((acc, r) => acc + r.matches.length, 0);

  const handleReplaceAll = () => {
    if (!(regex instanceof RegExp) || totalMatches === 0) return;
    if (!confirm(`Replace matches in ${searchResults.length} file(s) with "${replaceText}"?`)) return;
    searchResults.forEach(({ filePath }) => {
      const content = state.project.files[filePath].content;
      // Literal mode: escape "$" so "$1"/"$&" in the replacement are not treated as group references
      const replacement = opts.useRegex ? replaceText : replaceText.replace(/\$/g, '$$$$');
      actions.updateFileContent(filePath, content.replace(regex, replacement));
    });
  };

  const openMatch = (filePath: string, m?: Match) => {
    actions.setActiveFilePath(filePath);
    if (m) requestReveal(filePath, m.line, m.col);
  };

  const toggle = (key: keyof SearchOptions, label: string, title: string) => (
    <button
      onClick={() => setOpts({ ...opts, [key]: !opts[key] })}
      title={title}
      className={`px-1 rounded text-[10px] font-bold border ${
        opts[key] ? 'bg-[#1f6feb]/40 border-[#58a6ff] text-white' : 'border-transparent text-[#8b949e] hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full bg-[#161b22] border-r border-[#30363d] flex flex-col h-full select-none text-xs font-mono">
      {/* Title */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-[#30363d] text-[#8b949e] font-semibold text-[11px] tracking-wide">
        <span className="uppercase text-[#8b949e]">Search</span>
        <button
          onClick={() => setIsReplaceOpen(!isReplaceOpen)}
          className={`p-1 rounded hover:bg-[#21262d] ${isReplaceOpen ? 'text-[#58a6ff]' : 'text-[#8b949e]'}`}
          title="Toggle Replace"
        >
          <Replace className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search & Replace Inputs */}
      <div className="p-2 border-b border-[#21262d] space-y-2">
        <div
          className={`flex items-center space-x-1 bg-[#0d1117] border px-2 py-1 rounded ${
            regexError ? 'border-rose-500' : 'border-[#30363d]'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-[#8b949e] flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in files..."
            className="w-full min-w-0 bg-transparent text-white text-xs outline-none placeholder-[#484f58]"
          />
          {toggle('matchCase', 'Aa', 'Match Case')}
          {toggle('wholeWord', 'ab', 'Match Whole Word')}
          {toggle('useRegex', '.*', 'Use Regular Expression')}
        </div>

        {isReplaceOpen && (
          <div className="space-y-1.5">
            <div className="flex items-center space-x-1.5 bg-[#0d1117] border border-[#30363d] px-2 py-1 rounded">
              <Replace className="w-3.5 h-3.5 text-[#8b949e]" />
              <input
                type="text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Replace with..."
                className="w-full bg-transparent text-white text-xs outline-none placeholder-[#484f58]"
              />
            </div>
            <button
              onClick={handleReplaceAll}
              disabled={totalMatches === 0}
              className="w-full py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] border border-[#30363d] text-[10px] font-semibold disabled:opacity-40"
            >
              Replace All ({totalMatches})
            </button>
          </div>
        )}

        <div className={`text-[10px] px-1 ${regexError ? 'text-rose-400' : 'text-[#8b949e]'}`}>
          {regexError
            ? regexError
            : query
              ? `${totalMatches} results in ${searchResults.length} files`
              : 'Type to search across workspace'}
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-1 space-y-1">
        {searchResults.map((res) => {
          const fileName = res.filePath.split('/').pop() || res.filePath;
          return (
            <div key={res.filePath}>
              <div
                onClick={() => setCollapsed({ ...collapsed, [res.filePath]: !collapsed[res.filePath] })}
                onDoubleClick={() => openMatch(res.filePath)}
                title={res.filePath}
                className="flex items-center justify-between px-2 py-1 cursor-pointer hover:bg-[#21262d] rounded text-white font-semibold text-[11px]"
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <FileIcon filename={fileName} className="w-3.5 h-3.5" />
                  <span className="truncate">{res.filePath}</span>
                </div>
                <span className="text-[10px] px-1 rounded-full bg-[#0d1117] text-[#8b949e]">
                  {res.matches.length}
                </span>
              </div>

              {!collapsed[res.filePath] && (
                <div className="pl-4">
                  {res.matches.map((m) => (
                    <div
                      key={m.line}
                      onClick={() => openMatch(res.filePath, m)}
                      className="flex items-center space-x-2 px-2 py-0.5 cursor-pointer hover:bg-white/5 rounded text-[11px] text-[#8b949e] hover:text-[#c9d1d9]"
                    >
                      <span className="text-[#58a6ff] text-[10px] w-6 text-right flex-shrink-0">{m.line}</span>
                      <span className="truncate">
                        {m.before}
                        <mark className="bg-[#bb800966] text-white rounded-sm">{m.hit}</mark>
                        {m.after}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
