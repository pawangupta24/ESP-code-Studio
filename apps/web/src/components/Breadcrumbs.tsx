import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { FileIcon } from './FileIcon';
import { detectLanguage } from '../languages';
import { extractSymbols, symbolPathAt, DocSymbol } from '../symbols';
import { requestReveal } from '../editorBridge';
import { ChevronRight } from 'lucide-react';

type Dropdown = { left: number; folder: string } | { left: number; symbols: DocSymbol[] };

/**
 * VS Code breadcrumbs: workspace › folders › file › symbol at the cursor.
 * Every segment opens a picker of its siblings (folder contents or symbols).
 */
export const Breadcrumbs: React.FC<{ path: string; showSymbols: boolean }> = ({ path, showSymbols }) => {
  const [state, actions] = useWorkspaceStore();
  const [dropdown, setDropdown] = useState<Dropdown | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const content = state.project.files[path]?.content ?? '';
  const language = detectLanguage(path, state.languageOverrides[path]);
  const symbols = useMemo(() => (showSymbols ? extractSymbols(content, language) : []), [content, language, showSymbols]);
  const symbolChain = showSymbols ? symbolPathAt(symbols, state.cursor.line) : [];

  useEffect(() => {
    if (!dropdown) return;
    const close = (e: MouseEvent) => !barRef.current?.contains(e.target as Node) && setDropdown(null);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDropdown(null);
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [dropdown]);

  // Direct children of a folder ('' = workspace root): sub-folders first, then files
  const childrenOf = (folder: string) => {
    const prefix = folder ? folder + '/' : '';
    const folders = new Set<string>();
    const files: string[] = [];
    Object.keys(state.project.files).forEach((p) => {
      if (!p.startsWith(prefix)) return;
      const rest = p.slice(prefix.length);
      if (rest.includes('/')) folders.add(prefix + rest.split('/')[0]);
      else if (rest !== '.gitkeep') files.push(p);
    });
    return [
      ...[...folders].sort().map((p) => ({ path: p, isFolder: true })),
      ...files.sort().map((p) => ({ path: p, isFolder: false })),
    ];
  };

  const open = (e: React.MouseEvent, d: { folder: string } | { symbols: DocSymbol[] }) => {
    const barLeft = barRef.current?.getBoundingClientRect().left ?? 0;
    const left = (e.currentTarget as HTMLElement).getBoundingClientRect().left - barLeft;
    setDropdown({ left, ...d });
  };

  const parts = path.split('/');
  const fileName = parts[parts.length - 1];
  const segment = (key: string, label: React.ReactNode, onClick: (e: React.MouseEvent) => void, bright = false) => (
    <React.Fragment key={key}>
      <ChevronRight className="w-3 h-3 opacity-50 flex-shrink-0" />
      <button
        onClick={onClick}
        className={`px-0.5 rounded hover:text-white hover:bg-[#21262d] truncate flex items-center gap-1 ${bright ? 'text-[#c9d1d9]' : ''}`}
      >
        {label}
      </button>
    </React.Fragment>
  );

  return (
    <div ref={barRef} className="relative h-6 px-3 flex items-center gap-0.5 text-[11px] text-[#8b949e] border-b border-[#30363d] flex-shrink-0 min-w-0">
      <button onClick={(e) => open(e, { folder: '' })} className="px-0.5 rounded hover:text-white hover:bg-[#21262d] truncate">
        {state.project.metadata.name}
      </button>
      {parts.slice(0, -1).map((part, i) => segment(`d${i}`, part, (e) => open(e, { folder: parts.slice(0, i).join('/') })))}
      {segment(
        'file',
        <>
          <FileIcon filename={fileName} className="w-3 h-3" />
          {fileName}
        </>,
        (e) => open(e, { folder: parts.slice(0, -1).join('/') }),
        true
      )}
      {symbolChain.map((s, i) => segment(`s${i}`, s.name, (e) => open(e, { symbols: i === 0 ? symbols : symbolChain[i - 1].children })))}

      {dropdown && (
        <div
          style={{ left: dropdown.left }}
          className="absolute top-full mt-0.5 z-30 min-w-[220px] max-w-[360px] max-h-[50vh] overflow-y-auto bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl py-1 font-sans text-[12px]"
        >
          {'folder' in dropdown
            ? childrenOf(dropdown.folder).map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    if (item.isFolder) setDropdown({ left: dropdown.left, folder: item.path });
                    else {
                      setDropdown(null);
                      actions.openFile(item.path);
                    }
                  }}
                  className={`w-full text-left px-3 py-1 flex items-center gap-1.5 hover:bg-[#1f6feb] hover:text-white ${
                    item.path === path ? 'text-white bg-[#21262d]' : 'text-[#c9d1d9]'
                  }`}
                >
                  <FileIcon filename={item.path.split('/').pop()!} isFolder={item.isFolder} className="w-3.5 h-3.5" />
                  <span className="truncate">{item.path.split('/').pop()}</span>
                  {item.isFolder && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
                </button>
              ))
            : dropdown.symbols.map((s) => (
                <button
                  key={`${s.line}:${s.name}`}
                  onClick={() => {
                    setDropdown(null);
                    requestReveal(path, s.line);
                  }}
                  className="w-full text-left px-3 py-1 flex items-center justify-between gap-3 text-[#c9d1d9] hover:bg-[#1f6feb] hover:text-white"
                >
                  <span className="truncate">{s.name}</span>
                  <span className="text-[10px] opacity-60">{s.kind}</span>
                </button>
              ))}
        </div>
      )}
    </div>
  );
};
