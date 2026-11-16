import React, { useState } from 'react';
import { Eye, Copy, Check } from 'lucide-react';
import { THEME_PALETTES } from '../../themeTokens';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

interface MarkdownViewerProps {
  content: string;
  filePath: string;
  onEdit?: (newContent: string) => void;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, filePath }) => {
  const [state] = useWorkspaceStore();
  const [viewMode, setViewMode] = useState<'preview' | 'split'>('preview');
  const [copied, setCopied] = useState(false);
  const palette = THEME_PALETTES[state.theme] || THEME_PALETTES['github-dark'];

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple, robust Markdown parser that renders headings, tables, code blocks, lists, quotes, checkboxes
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let inTable = false;
    let tableRows: string[][] = [];

    const flushTable = (key: number) => {
      if (tableRows.length === 0) return null;
      const header = tableRows[0];
      const rows = tableRows.slice(1).filter((r) => !r.every((c) => c.match(/^[:\-\s]+$/)));
      const res = (
        <div key={`table-${key}`} className="my-4 overflow-x-auto">
          <table className="w-full border-collapse border border-[#30363d] text-xs font-sans">
            <thead className="bg-[#161b22] text-[#c9d1d9]">
              <tr>
                {header.map((col, idx) => (
                  <th key={idx} className="border border-[#30363d] px-3 py-1.5 text-left font-bold">
                    {col.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-[#0d1117]/50' : 'bg-[#161b22]/30'}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="border border-[#30363d] px-3 py-1.5 text-[#8b949e]">
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
      return res;
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Code blocks ```
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre
              key={`code-${idx}`}
              className="p-3 my-3 rounded-lg bg-[#0d1117] border border-[#30363d] text-xs font-mono text-[#58a6ff] overflow-x-auto"
            >
              <code>{codeBlockContent.join('\n')}</code>
            </pre>
          );
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Tables | col | col |
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        const cols = trimmed.slice(1, -1).split('|');
        tableRows.push(cols);
        return;
      } else if (inTable) {
        const tableNode = flushTable(idx);
        if (tableNode) elements.push(tableNode);
      }

      // Headings
      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={idx} className="text-xl font-bold text-white border-b border-[#30363d] pb-2 my-4 font-sans">
            {trimmed.substring(2)}
          </h1>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={idx} className="text-base font-bold text-white border-b border-[#30363d]/60 pb-1.5 my-3 font-sans">
            {trimmed.substring(3)}
          </h2>
        );
      } else if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="text-sm font-bold text-white my-2.5 font-sans">
            {trimmed.substring(4)}
          </h3>
        );
      }
      // Checkboxes - [x] or - [ ]
      else if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ')) {
        const isChecked = trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ');
        const label = trimmed.substring(6);
        elements.push(
          <div key={idx} className="flex items-center space-x-2 my-1 text-xs text-[#c9d1d9] font-sans">
            <input type="checkbox" checked={isChecked} readOnly className="rounded accent-[#58a6ff]" />
            <span className={isChecked ? 'line-through text-[#8b949e]' : ''}>{label}</span>
          </div>
        );
      }
      // Bullet list -
      else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <li key={idx} className="ml-4 list-disc text-xs text-[#c9d1d9] my-0.5 font-sans">
            {trimmed.substring(2)}
          </li>
        );
      }
      // Blockquote >
      else if (trimmed.startsWith('> ')) {
        elements.push(
          <blockquote
            key={idx}
            className="pl-3 border-l-2 border-[#58a6ff] my-2 text-xs italic text-[#8b949e]"
          >
            {trimmed.substring(2)}
          </blockquote>
        );
      }
      // Blank line
      else if (trimmed === '') {
        elements.push(<div key={idx} className="h-2" />);
      }
      // Paragraph
      else {
        elements.push(
          <p key={idx} className="text-xs text-[#c9d1d9] my-1 leading-relaxed font-sans">
            {trimmed}
          </p>
        );
      }
    });

    if (inTable) {
      const tableNode = flushTable(lines.length);
      if (tableNode) elements.push(tableNode);
    }

    return elements;
  };

  return (
    <div
      style={{ backgroundColor: palette.bgMain, color: palette.text }}
      className="flex-1 flex flex-col h-full overflow-hidden select-text text-xs"
    >
      {/* Top Viewer Toolbar */}
      <div
        style={{ backgroundColor: palette.bgSidebar, borderColor: palette.border }}
        className="h-8 border-b px-3 flex items-center justify-between text-[11px] select-none"
      >
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-white">{filePath.split('/').pop()}</span>
          <span className="text-[#8b949e]">(Markdown Preview)</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setViewMode(viewMode === 'preview' ? 'split' : 'preview')}
            className={`px-2 py-0.5 rounded border text-[10px] flex items-center space-x-1 ${
              viewMode === 'preview'
                ? 'bg-[#1f6feb] text-white border-blue-600'
                : 'bg-[#21262d] text-[#8b949e] border-[#30363d]'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>{viewMode === 'preview' ? 'Preview' : 'Side-by-Side'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white border border-[#30363d] text-[10px] flex items-center space-x-1"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Content View */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'split' && (
          <div
            style={{ borderColor: palette.border }}
            className="w-1/2 h-full overflow-auto p-4 border-r font-mono text-xs bg-[#0d1117] text-[#c9d1d9] whitespace-pre"
          >
            {content}
          </div>
        )}

        <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} h-full overflow-y-auto p-6 max-w-4xl mx-auto`}>
          {renderMarkdown(content)}
        </div>
      </div>
    </div>
  );
};
