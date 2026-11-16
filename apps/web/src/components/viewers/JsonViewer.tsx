import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, Check, Code, Network } from 'lucide-react';
import { THEME_PALETTES } from '../../themeTokens';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

interface JsonViewerProps {
  content: string;
  filePath: string;
}

const JsonNode: React.FC<{ name?: string; value: any; level?: number }> = ({ name, value, level = 0 }) => {
  const [collapsed, setCollapsed] = useState(false);

  if (value !== null && typeof value === 'object') {
    const isArray = Array.isArray(value);
    const keys = Object.keys(value);

    return (
      <div className="font-mono text-xs my-0.5" style={{ marginLeft: `${level * 16}px` }}>
        <div
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center space-x-1 cursor-pointer hover:bg-white/5 py-0.5 rounded px-1"
        >
          {collapsed ? <ChevronRight className="w-3 h-3 text-[#8b949e]" /> : <ChevronDown className="w-3 h-3 text-[#8b949e]" />}
          {name && <span className="text-[#58a6ff] font-semibold">"{name}": </span>}
          <span className="text-purple-400 font-bold">{isArray ? `Array [${keys.length}]` : `Object {${keys.length}}`}</span>
        </div>

        {!collapsed && (
          <div className="border-l border-[#30363d]/50 ml-2 pl-1">
            {keys.map((k) => (
              <JsonNode key={k} name={isArray ? undefined : k} value={value[k]} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Primitive values
  return (
    <div className="font-mono text-xs py-0.5 px-1 hover:bg-white/5 rounded flex items-center space-x-1" style={{ marginLeft: `${level * 16}px` }}>
      {name && <span className="text-[#58a6ff]">"{name}": </span>}
      {typeof value === 'string' ? (
        <span className="text-amber-300">"{value}"</span>
      ) : typeof value === 'number' ? (
        <span className="text-emerald-400">{value}</span>
      ) : typeof value === 'boolean' ? (
        <span className="text-purple-400 font-bold">{value ? 'true' : 'false'}</span>
      ) : (
        <span className="text-rose-400 italic">null</span>
      )}
    </div>
  );
};

export const JsonViewer: React.FC<JsonViewerProps> = ({ content, filePath }) => {
  const [state] = useWorkspaceStore();
  const [mode, setMode] = useState<'tree' | 'raw'>('tree');
  const [copied, setCopied] = useState(false);
  const palette = THEME_PALETTES[state.theme] || THEME_PALETTES['github-dark'];

  let parsed: any = null;
  let parseError: string | null = null;
  try {
    parsed = JSON.parse(content);
  } catch (err: any) {
    parseError = err.message || 'Invalid JSON syntax';
  }

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
      {/* Top Bar */}
      <div
        style={{ backgroundColor: palette.bgSidebar, borderColor: palette.border }}
        className="h-9 border-b px-3 flex items-center justify-between text-[11px] select-none"
      >
        <div className="flex items-center space-x-2">
          <span className="text-yellow-400 font-bold text-xs">{`{ }`}</span>
          <span className="font-semibold text-white">{filePath.split('/').pop()}</span>
          <span className="text-[10px] text-[#8b949e]">JSON Explorer</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-[#0d1117] rounded border border-[#30363d] p-0.5">
            <button
              onClick={() => setMode('tree')}
              className={`px-2 py-0.5 rounded text-[10px] flex items-center space-x-1 ${
                mode === 'tree' ? 'bg-[#1f6feb] text-white font-semibold' : 'text-[#8b949e] hover:text-white'
              }`}
            >
              <Network className="w-3 h-3" />
              <span>Tree View</span>
            </button>
            <button
              onClick={() => setMode('raw')}
              className={`px-2 py-0.5 rounded text-[10px] flex items-center space-x-1 ${
                mode === 'raw' ? 'bg-[#1f6feb] text-white font-semibold' : 'text-[#8b949e] hover:text-white'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>Raw JSON</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-2 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white border border-[#30363d] text-[10px] flex items-center space-x-1"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-4">
        {parseError ? (
          <div className="p-4 rounded bg-rose-950/40 border border-rose-800 text-rose-300">
            <strong>JSON Parse Error:</strong> {parseError}
          </div>
        ) : mode === 'tree' ? (
          <div className="space-y-1">
            <JsonNode value={parsed} />
          </div>
        ) : (
          <pre className="p-4 rounded-lg bg-[#0d1117] border border-[#30363d] text-[#58a6ff] overflow-auto whitespace-pre font-mono text-xs">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};
