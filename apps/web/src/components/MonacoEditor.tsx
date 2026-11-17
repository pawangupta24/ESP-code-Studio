import React, { useEffect, useRef, useState } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { THEME_PALETTES } from '../themeTokens';
import { setEditorPath, setFocusedEditor, releaseEditor } from '../editorBridge';
import { detectLanguage } from '../languages';
import { toMonacoOptions } from '../settingsSchema';
import { syncExtensionContributions, registerSymbolProviders } from '../extensionHost';

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

// One Monaco model per file, shared by every editor pane. This is what gives each
// file its own undo history and keeps split panes of the same file in sync.
// ponytail: models of deleted/renamed files are never disposed; dispose in
// deleteFile/renameFile if projects grow to thousands of files.
const getModel = (monaco: any, path: string, content: string, language: string, settings: any) => {
  const uri = monaco.Uri.file('/' + path);
  const existing = monaco.editor.getModel(uri);
  if (existing) return existing;
  const model = monaco.editor.createModel(content, language, uri);
  if (settings.detectIndentation) model.detectIndentation(settings.insertSpaces, settings.tabSize);
  else model.updateOptions({ tabSize: settings.tabSize, insertSpaces: settings.insertSpaces });
  return model;
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
  const isPrimaryRef = useRef(isPrimary);
  isPrimaryRef.current = isPrimary;
  const [isMonacoReady, setIsMonacoReady] = useState(!!window.monaco);
  const palette = THEME_PALETTES[state.theme] || THEME_PALETTES['github-dark'];
  const settings = state.editorSettings;
  const language = detectLanguage(filePath, state.languageOverrides[filePath]);

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

    // Cursor + selection size of the primary editor feed the status bar, breadcrumbs and outline
    editor.onDidChangeCursorSelection(() => {
      const sel = editor.getSelection();
      const model = editor.getModel();
      if (!sel || !model) return;
      cursorCbRef.current?.(sel.positionLineNumber, sel.positionColumn);
      // Only the focused editor group drives the status bar / breadcrumbs / outline
      if (editor.hasTextFocus()) actions.setCursor(sel.positionLineNumber, sel.positionColumn, model.getValueLengthInRange(sel));
    });
    editor.onDidChangeModelContent(() => {
      // Skip echo of our own setValue, and always write to the file this model belongs to.
      if (syncingRef.current) return;
      actions.updateFileContent(pathRef.current, editor.getValue());
    });
    editor.onDidFocusEditorText(() => {
      setFocusedEditor(editor);
      actions.setActiveGroup(isPrimaryRef.current ? 0 : 1);
      const sel = editor.getSelection();
      const model = editor.getModel();
      if (sel && model) actions.setCursor(sel.positionLineNumber, sel.positionColumn, model.getValueLengthInRange(sel));
    });

    // Our Ctrl+K chords must go through Monaco's own keybinding service while the editor has
    // focus; otherwise Monaco keeps waiting for a chord key and swallows the next keystroke.
    const { KeyMod, KeyCode } = window.monaco;
    const chord = (second: number, command: string) =>
      editor.addCommand(KeyMod.chord(KeyMod.CtrlCmd | KeyCode.KeyK, second), () =>
        window.dispatchEvent(new CustomEvent('esp-studio:command', { detail: command }))
      );
    chord(KeyCode.KeyM, 'languageMode');
    chord(KeyCode.KeyZ, 'zenMode');
    chord(KeyMod.CtrlCmd | KeyCode.KeyT, 'colorTheme');
    chord(KeyMod.CtrlCmd | KeyCode.KeyS, 'keybindings');

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
    const model = getModel(window.monaco, filePath, content, language, settings);
    if (model.getLanguageId() !== language) window.monaco.editor.setModelLanguage(model, language);

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
    setEditorPath(editor, filePath);
  }, [isMonacoReady, filePath, content, isPrimary, language]);

  // Snippets contributed by enabled extensions
  useEffect(() => {
    if (!isMonacoReady) return;
    registerSymbolProviders();
    syncExtensionContributions(state.extensions);
  }, [isMonacoReady, state.extensions]);

  // Indentation settings apply to every open file unless auto-detected per file
  useEffect(() => {
    if (!isMonacoReady || settings.detectIndentation) return;
    window.monaco.editor.getModels().forEach((m: any) =>
      m.updateOptions({ tabSize: settings.tabSize, insertSpaces: settings.insertSpaces })
    );
  }, [isMonacoReady, settings.tabSize, settings.insertSpaces, settings.detectIndentation]);

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

    editor.updateOptions(toMonacoOptions(settings, state.zoomLevel));
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
