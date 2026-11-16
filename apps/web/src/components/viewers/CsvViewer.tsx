import React, { useState } from 'react';
import { Search, FileSpreadsheet, Copy, Check } from 'lucide-react';
import { THEME_PALETTES } from '../../themeTokens';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

interface CsvViewerProps {
  content: string;
  filePath: string;
}

export const CsvViewer: React.FC<CsvViewerProps> = ({ content, filePath }) => {
  const [state] = useWorkspaceStore();
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const palette = THEME_PALETTES[state.theme] || THEME_PALETTES['github-dark'];

  const rows = content
    .split('\n')
    .map((r) => r.trim())
    .filter((r) => r.length > 0 && !r.startsWith('#'))
    .map((r) => r.split(',').map((c) => c.trim()));

  const header = rows[0] || [];
  const bodyRows = rows.slice(1);

  const filteredRows = bodyRows.filter((row) =>
    search ? row.some((cell) => cell.toLowerCase().includes(search.toLowerCase())) : true
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{ backgroundColor: palette.bgMain, color: palette.text }}
      className="flex-1 flex flex-col h-full overflow-hidden select-text text-xs font-mono"
    >
      {/* CSV Toolbar */}
      <div
        style={{ backgroundColor: palette.bgSidebar, borderColor: palette.border }}
        className="h-9 border-b px-3 flex items-center justify-between text-[11px] select-none"
      >
        <div className="flex items-center space-x-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-white">{filePath.split('/').pop()}</span>
          <span className="text-[10px] text-[#8b949e]">
            ({bodyRows.length} rows, {header.length} columns)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search Table */}
          <div className="flex items-center space-x-1.5 bg-[#0d1117] border border-[#30363d] px-2 py-0.5 rounded">
            <Search className="w-3 h-3 text-[#8b949e]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter table..."
              className="bg-transparent text-white text-[11px] outline-none w-32"
            />
          </div>

          <button
            onClick={handleCopy}
            className="px-2 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white border border-[#30363d] text-[10px] flex items-center space-x-1"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy CSV'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Table Grid */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left font-mono text-xs">
          <thead
            style={{ backgroundColor: palette.bgSidebar, borderColor: palette.border }}
            className="sticky top-0 border-b select-none"
          >
            <tr>
              <th className="w-12 px-3 py-2 text-center text-[#8b949e] border-r border-[#30363d] bg-black/20">
                #
              </th>
              {header.map((col, idx) => (
                <th
                  key={idx}
                  className="px-4 py-2 font-bold text-white border-r border-[#30363d] last:border-r-0"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="hover:bg-blue-600/10 border-b border-[#21262d] transition-colors"
              >
                <td className="px-3 py-1.5 text-center text-[#8b949e] border-r border-[#21262d] bg-[#0d1117]/50 select-none">
                  {rIdx + 1}
                </td>
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className="px-4 py-1.5 border-r border-[#21262d] last:border-r-0 text-[#c9d1d9] truncate max-w-xs font-mono"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
