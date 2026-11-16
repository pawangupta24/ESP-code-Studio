import React, { useEffect, useRef, useState } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { THEME_PALETTES } from '../themeTokens';
import { setPrimaryEditor, setFocusedEditor, releaseEditor } from '../editorBridge';

declare global {
  interface Window {
    monaco?: any;
    require?: any;
  }
}

interface MonacoEditorProps {
  filePath: string;
  content: string;
  onCursorChange?: (line: number, col: number) => void;
  isPrimary?: boolean;
}

const MONACO_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs';

// Map file extensions to Monaco language IDs
const getLanguageId = (path: string): string => {
  const ext = '.' + (path.split('.').pop() || '').toLowerCase();
  const map: Record<string, string> = {
    '.cpp': 'cpp',
    '.c': 'c',
    '.hpp': 'cpp',
    '.h': 'c',
    '.ino': 'cpp',
    '.py': 'python',
    '.rs': 'rust',
    '.js': 'javascript',
    '.mjs': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.json': 'json',
    '.ini': 'ini',
    '.cfg': 'ini',
    '.md': 'markdown',
    '.html': 'html',
    '.htm': 'html',
    '.css': 'css',
    '.sh': 'shell',
    '.bash': 'shell',
    '.ps1': 'powershell',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.xml': 'xml',
    '.cmake': 'cmake',
  };
  if (path.toLowerCase().endsWith('cmakelists.txt')) return 'cmake';
  if (path.toLowerCase().includes('dockerfile')) return 'dockerfile';
  return map[ext] || 'plaintext';
};

// One Monaco model per file, shared by every editor pane. This is what gives each
// file its own undo history and keeps split panes of the same file in sync.
// ponytail: models of deleted/renamed files are never disposed; dispose in
// deleteFile/renameFile if projects grow to thousands of files.
const getModel = (monaco: any, path: string, content: string) => {
  const uri = monaco.Uri.file('/' + path);
  return monaco.editor.getModel(uri) || monaco.editor.createModel(content, getLanguageId(path), uri);
};

// Scroll/cursor position per file, restored when switching back to a tab.
const viewStates = new Map<string, any>();

export const MonacoEditor: React.FC<MonacoEditorProps> = ({ filePath, content, onCursorChange, isPrimary = true }) => {
  const [state, actions] = useWorkspaceStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const pathRef = useRef(filePath);
  const syncingRef = useRef(false);
  const cursorCbRef = useRef(onCursorChange);
  cursorCbRef.current = onCursorChange;
  const [isMonacoReady, setIsMonacoReady] = useState(!!window.monaco);
  const palette = THEME_PALETTES[state.theme] || THEME_PALETTES['github-dark'];
  const settings = state.editorSettings;

  // Load Monaco via AMD loader
  useEffect(() => {
    if (window.monaco) return;
    let attempts = 0;
    let loading = false;
    const timer = setInterval(() => {
      attempts++;
      if (window.monaco) {
        setIsMonacoReady(true);
        clearInterval(timer);
      } else if (!loading && window.require && typeof window.require.config === 'function') {
        loading = true;
        window.require.config({ paths: { vs: MONACO_BASE } });
        window.require(['vs/editor/editor.main'], () => setIsMonacoReady(true));
      } else if (!loading && attempts > 30) {
        clearInterval(timer);
      }
    }, 200);
    return () => clearInterval(timer);
  }, []);

  // Create the editor once
  useEffect(() => {
    if (!isMonacoReady || !containerRef.current || !window.monaco) return;
    const editor = window.monaco.editor.create(containerRef.current, {
      model: null,
      automaticLayout: true,
      smoothScrolling: true,
      scrollBeyondLastLine: false,
      renderLineHighlight: 'all',
    });
    editorRef.current = editor;

    editor.onDidChangeCursorPosition((e: any) => {
      cursorCbRef.current?.(e.position.lineNumber, e.position.column);
    });
    editor.onDidChangeModelContent(() => {
      // Skip echo of our own setValue, and always write to the file this model belongs to.
      if (syncingRef.current) return;
      actions.updateFileContent(pathRef.current, editor.getValue());
    });
    editor.onDidFocusEditorText(() => setFocusedEditor(editor));

    return () => {
      viewStates.set(pathRef.current, editor.saveViewState());
      releaseEditor(editor);
      editor.dispose();
      editorRef.current = null;
    };
  }, [isMonacoReady]);

  // Swap model when the file changes; pull in external edits (format, replace-all, AI apply)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !window.monaco) return;
    const model = getModel(window.monaco, filePath, content);

    if (editor.getModel() !== model) {
      if (editor.getModel()) viewStates.set(pathRef.current, editor.saveViewState());
      pathRef.current = filePath;
      editor.setModel(model);
      const saved = viewStates.get(filePath);
      if (saved) editor.restoreViewState(saved);
    }
    if (model.getValue() !== content) {
      syncingRef.current = true;
      // pushEditOperations keeps the external change undoable (setValue would wipe history)
      model.pushEditOperations([], [{ range: model.getFullModelRange(), text: content }], () => null);
      syncingRef.current = false;
    }
    if (isPrimary) setPrimaryEditor(editor, filePath);
  }, [isMonacoReady, filePath, content, isPrimary]);

  // Theme + editor options
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = window.monaco;
    if (!editor || !monaco) return;

    monaco.editor.defineTheme('esp-studio-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: palette.syntaxKeyword.replace('#', ''), fontStyle: 'bold' },
        { token: 'type', foreground: palette.syntaxType.replace('#', '') },
        { token: 'string', foreground: palette.syntaxString.replace('#', '') },
        { token: 'number', foreground: palette.syntaxNumber.replace('#', '') },
        { token: 'comment', foreground: palette.syntaxComment.replace('#', ''), fontStyle: 'italic' },
        { token: 'delimiter', foreground: palette.textMuted.replace('#', '') },
        { token: 'identifier', foreground: palette.text.replace('#', '') },
      ],
      colors: {
        'editor.background': palette.bgMain,
        'editor.foreground': palette.text,
        'editorLineNumber.foreground': palette.textMuted,
        'editorLineNumber.activeForeground': palette.accent,
        'editorCursor.foreground': palette.accent,
        'editor.selectionBackground': '#1f6feb44',
        'editor.lineHighlightBackground': '#ffffff08',
        'editorIndentGuide.background': '#30363d55',
        'editorIndentGuide.activeBackground': '#58a6ff66',
      },
    });
    monaco.editor.setTheme('esp-studio-theme');

    editor.updateOptions({
      fontSize: Math.max(10, Math.min(26, Math.round((settings.fontSize * state.zoomLevel) / 100))),
      fontFamily: settings.fontFamily,
      tabSize: settings.tabSize,
      wordWrap: settings.wordWrap ? 'on' : 'off',
      minimap: { enabled: settings.minimap },
      lineNumbers: settings.lineNumbers ? 'on' : 'off',
      bracketPairColorization: { enabled: settings.bracketPairColorization },
      cursorBlinking: settings.cursorBlinking || 'smooth',
      cursorStyle: settings.cursorStyle || 'line',
      renderWhitespace: settings.renderWhitespace || 'selection',
      autoClosingBrackets: settings.autoClosingBrackets ? 'always' : 'never',
      autoClosingQuotes: settings.autoClosingQuotes ? 'always' : 'never',
    });
  }, [isMonacoReady, state.theme, state.zoomLevel, settings]);

  // Compiler markers / diagnostics (red/yellow squiggly lines)
  useEffect(() => {
    const model = editorRef.current?.getModel();
    const monaco = window.monaco;
    if (!model || !monaco) return;
    monaco.editor.setModelMarkers(
      model,
      'compiler',
      state.codeDiagnostics
        .filter((d) => d.line <= model.getLineCount())
        .map((d) => ({
          startLineNumber: d.line,
          startColumn: 1,
          endLineNumber: d.line,
          endColumn: model.getLineMaxColumn(d.line),
          message: d.message,
          severity: d.severity === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
        }))
    );
  }, [isMonacoReady, filePath, state.codeDiagnostics]);

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden" style={{ backgroundColor: palette.bgMain }}>
      <div ref={containerRef} className="w-full h-full" />
      {!isMonacoReady && (
        <div className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: palette.textMuted }}>
          Loading editor...
        </div>
      )}
    </div>
  );
};
