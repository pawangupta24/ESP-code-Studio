import React, { useState, useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { THEME_PALETTES, ThemeColorPalette } from '../themeTokens';
import { Search, X, Check, Code, ChevronRight, Sparkles, Bot, ZoomIn, ZoomOut, AlertCircle, AlertTriangle, Blocks, Download } from 'lucide-react';

// C/C++ Keywords & Types
const CPP_KEYWORDS = new Set([
  'auto', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default', 'delete', 'do',
  'else', 'enum', 'extern', 'false', 'for', 'goto', 'if', 'inline', 'namespace', 'new',
  'nullptr', 'NULL', 'operator', 'private', 'protected', 'public', 'register', 'return',
  'sizeof', 'static', 'struct', 'switch', 'template', 'this', 'throw', 'true', 'try',
  'typedef', 'typename', 'union', 'using', 'virtual', 'volatile', 'while'
]);

const CPP_TYPES = new Set([
  'void', 'bool', 'char', 'short', 'int', 'long', 'float', 'double', 'signed', 'unsigned',
  'int8_t', 'int16_t', 'int32_t', 'int64_t', 'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t',
  'size_t', 'String', 'ESP', 'Serial', 'WiFi', 'Wire', 'SPI', 'Preferences', 'File',
  'TaskHandle_t', 'TickType_t', 'QueueHandle_t', 'SemaphoreHandle_t', 'UBaseType_t', 'BaseType_t', 'IPAddress'
]);

const CPP_FUNCTIONS = new Set([
  'setup', 'loop', 'pinMode', 'digitalWrite', 'digitalRead', 'delay', 'delayMicroseconds',
  'millis', 'micros', 'vTaskDelay', 'xTaskCreatePinnedToCore', 'vTaskDelete', 'printf',
  'println', 'print', 'begin', 'available', 'read', 'write', 'flush', 'end',
  'esp_get_free_heap_size', 'esp_restart', 'log_i', 'log_e', 'log_w', 'log_d',
  'pdMS_TO_TICKS', 'HIGH', 'LOW', 'OUTPUT', 'INPUT', 'INPUT_PULLUP'
]);

// Python Keywords & Types (MicroPython / CircuitPython)
const PY_KEYWORDS = new Set([
  'def', 'class', 'import', 'from', 'as', 'return', 'if', 'elif', 'else', 'while', 'for', 'in',
  'try', 'except', 'finally', 'with', 'pass', 'break', 'continue', 'lambda', 'yield', 'global',
  'nonlocal', 'async', 'await', 'assert', 'raise', 'is', 'not', 'and', 'or', 'del'
]);

const PY_BUILTINS = new Set([
  'self', 'None', 'True', 'False', 'print', 'len', 'range', 'int', 'str', 'float', 'list',
  'dict', 'set', 'tuple', 'bytearray', 'machine', 'Pin', 'ADC', 'PWM', 'I2C', 'SPI',
  'neopixel', 'NeoPixel', 'time', 'sleep', 'sleep_ms', 'ticks_ms'
]);

// Rust Keywords & Types (esp-rs / no_std)
const RS_KEYWORDS = new Set([
  'fn', 'let', 'mut', 'impl', 'struct', 'enum', 'pub', 'use', 'mod', 'match', 'if', 'else',
  'while', 'for', 'in', 'loop', 'return', 'break', 'continue', 'trait', 'type', 'const',
  'static', 'unsafe', 'extern', 'crate', 'ref', 'move', 'where', 'async', 'await', 'as'
]);

const RS_BUILTINS = new Set([
  'u8', 'u16', 'u32', 'u64', 'usize', 'i8', 'i16', 'i32', 'i64', 'isize', 'f32', 'f64',
  'bool', 'char', 'str', 'String', 'Option', 'Some', 'None', 'Result', 'Ok', 'Err', 'Vec',
  'Peripherals', 'ClockControl', 'Delay', 'println!', 'panic!', 'log!'
]);

// JavaScript Keywords & Types (QuickJS / Moddable)
const JS_KEYWORDS = new Set([
  'function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'import',
  'export', 'from', 'default', 'class', 'new', 'this', 'async', 'await', 'try', 'catch',
  'throw', 'typeof', 'instanceof', 'switch', 'case', 'break', 'continue'
]);

const JS_BUILTINS = new Set([
  'console', 'Digital', 'PWM', 'setInterval', 'setTimeout', 'clearInterval', 'Math', 'JSON',
  'Promise', 'Array', 'Object', 'true', 'false', 'null', 'undefined'
]);

function tokenizeLine(
  line: string,
  palette: ThemeColorPalette,
  fileExt: string,
  extensionActive: boolean
): React.ReactNode[] {
  if (!line) return [' '];
  const trimmed = line.trimStart();

  // If extension is not active and not standard C/C++, show plain or minimal syntax
  if (!extensionActive && fileExt !== '.cpp' && fileExt !== '.c' && fileExt !== '.h' && fileExt !== '.hpp' && fileExt !== '.ini') {
    return [<span key="plain" style={{ color: palette.text }}>{line}</span>];
  }

  // 1. Python Tokenizer (.py)
  if (fileExt === '.py') {
    if (trimmed.startsWith('#')) {
      return [<span key="py-comment" style={{ color: palette.syntaxComment }}>{line}</span>];
    }
    const regex = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#.*$|\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?\b|\b[a-zA-Z_]\w*\b|[^\s\w"']+|\s+)/g;
    const tokens: React.ReactNode[] = [];
    let match: RegExpExecArray | null;
    let idx = 0;
    while ((match = regex.exec(line)) !== null) {
      const t = match[0];
      const key = `py-${idx++}`;
      if (t.startsWith('#')) tokens.push(<span key={key} style={{ color: palette.syntaxComment }}>{t}</span>);
      else if (t.startsWith('"') || t.startsWith("'")) tokens.push(<span key={key} style={{ color: palette.syntaxString }}>{t}</span>);
      else if (/^\d/.test(t) || t.startsWith('0x')) tokens.push(<span key={key} style={{ color: palette.syntaxNumber }}>{t}</span>);
      else if (PY_KEYWORDS.has(t)) tokens.push(<span key={key} style={{ color: palette.syntaxKeyword, fontWeight: 'bold' }}>{t}</span>);
      else if (PY_BUILTINS.has(t)) tokens.push(<span key={key} style={{ color: palette.syntaxType }}>{t}</span>);
      else tokens.push(<span key={key} style={{ color: palette.text }}>{t}</span>);
    }
    return tokens;
  }

  // 2. Rust Tokenizer (.rs, .toml)
  if (fileExt === '.rs' || fileExt === '.toml') {
    if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
      return [<span key="rs-comment" style={{ color: palette.syntaxComment }}>{line}</span>];
    }
    const regex = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\/.*$|\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?(?:u32|i32|usize)?\b|\b[a-zA-Z_]\w*!?\b|[^\s\w"']+|\s+)/g;
    const tokens: React.ReactNode[] = [];
    let match: RegExpExecArray | null;
    let idx = 0;
    while ((match = regex.exec(line)) !== null) {
      const t = match[0];
      const key = `rs-${idx++}`;
      if (t.startsWith('//')) tokens.push(<span key={key} style={{ color: palette.syntaxComment }}>{t}</span>);
      else if (t.startsWith('"') || t.startsWith("'")) tokens.push(<span key={key} style={{ color: palette.syntaxString }}>{t}</span>);
      else if (/^\d/.test(t) || t.startsWith('0x')) tokens.push(<span key={key} style={{ color: palette.syntaxNumber }}>{t}</span>);
      else if (RS_KEYWORDS.has(t)) tokens.push(<span key={key} style={{ color: palette.syntaxKeyword, fontWeight: 'bold' }}>{t}</span>);
      else if (RS_BUILTINS.has(t)) tokens.push(<span key={key} style={{ color: palette.syntaxType }}>{t}</span>);
      else tokens.push(<span key={key} style={{ color: palette.text }}>{t}</span>);
    }
    return tokens;
  }

  // 3. JavaScript Tokenizer (.js, .mjs)
  if (fileExt === '.js' || fileExt === '.mjs') {
    if (trimmed.startsWith('//')) {
      return [<span key="js-comment" style={{ color: palette.syntaxComment }}>{line}</span>];
    }
    const regex = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`[^`]*`|\/\/.*$|\b\d+(?:\.\d+)?\b|\b[a-zA-Z_]\w*\b|[^\s\w"']+|\s+)/g;
    const tokens: React.ReactNode[] = [];
    let match: RegExpExecArray | null;
    let idx = 0;
    while ((match = regex.exec(line)) !== null) {
      const t = match[0];
      const key = `js-${idx++}`;
      if (t.startsWith('//')) tokens.push(<span key={key} style={{ color: palette.syntaxComment }}>{t}</span>);
      else if (t.startsWith('"') || t.startsWith("'") || t.startsWith('`')) tokens.push(<span key={key} style={{ color: palette.syntaxString }}>{t}</span>);
      else if (/^\d/.test(t)) tokens.push(<span key={key} style={{ color: palette.syntaxNumber }}>{t}</span>);
      else if (JS_KEYWORDS.has(t)) tokens.push(<span key={key} style={{ color: palette.syntaxKeyword, fontWeight: 'bold' }}>{t}</span>);
      else if (JS_BUILTINS.has(t)) tokens.push(<span key={key} style={{ color: palette.syntaxType }}>{t}</span>);
      else tokens.push(<span key={key} style={{ color: palette.text }}>{t}</span>);
    }
    return tokens;
  }

  // 4. INI & PlatformIO Config (.ini, .cfg)
  if (fileExt === '.ini' || fileExt === '.cfg') {
    if (trimmed.startsWith(';') || trimmed.startsWith('#')) {
      return [<span key="ini-comment" style={{ color: palette.syntaxComment }}>{line}</span>];
    }
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      return [<span key="ini-section" style={{ color: palette.syntaxKeyword, fontWeight: 'bold' }}>{line}</span>];
    }
    const eqIdx = line.indexOf('=');
    if (eqIdx !== -1) {
      const key = line.substring(0, eqIdx);
      const val = line.substring(eqIdx + 1);
      return [
        <span key="k" style={{ color: palette.syntaxType, fontWeight: '600' }}>{key}</span>,
        <span key="eq" style={{ color: palette.textMuted }}>=</span>,
        <span key="v" style={{ color: palette.syntaxString }}>{val}</span>,
      ];
    }
    return [<span key="ini-txt" style={{ color: palette.text }}>{line}</span>];
  }

  // 5. JSON (.json)
  if (fileExt === '.json') {
    const regex = /("(?:\\.|[^"\\])*"|\b\d+(?:\.\d+)?\b|\b(?:true|false|null)\b|[{}\[\],:]|\s+)/g;
    const tokens: React.ReactNode[] = [];
    let match: RegExpExecArray | null;
    let idx = 0;
    while ((match = regex.exec(line)) !== null) {
      const t = match[0];
      const key = `json-${idx++}`;
      if (t.startsWith('"')) {
        tokens.push(<span key={key} style={{ color: t.includes(':') || line.indexOf(t) < line.indexOf(':') ? palette.syntaxType : palette.syntaxString }}>{t}</span>);
      } else if (/^\d/.test(t)) {
        tokens.push(<span key={key} style={{ color: palette.syntaxNumber }}>{t}</span>);
      } else if (t === 'true' || t === 'false' || t === 'null') {
        tokens.push(<span key={key} style={{ color: palette.syntaxKeyword }}>{t}</span>);
      } else {
        tokens.push(<span key={key} style={{ color: palette.textMuted }}>{t}</span>);
      }
    }
    return tokens;
  }

  // 6. Markdown (.md)
  if (fileExt === '.md') {
    if (trimmed.startsWith('#')) {
      return [<span key="md-h" style={{ color: palette.syntaxKeyword, fontWeight: 'bold' }}>{line}</span>];
    }
    if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      return [<span key="md-bullet" style={{ color: palette.accent }}>{line}</span>];
    }
    return [<span key="md-txt" style={{ color: palette.text }}>{line}</span>];
  }

  // 7. Default C/C++ Tokenizer
  if (trimmed.startsWith('//')) {
    return [<span key="comment" style={{ color: palette.syntaxComment }}>{line}</span>];
  }
  if (trimmed.startsWith('#')) {
    const parts = line.split(/(<[^>]+>|"[^"]*"|\s+)/);
    return parts.map((part, idx) => {
      if (part.startsWith('#')) return <span key={idx} style={{ color: palette.syntaxPreprocessor, fontWeight: 'bold' }}>{part}</span>;
      if (part.startsWith('<') || part.startsWith('"')) return <span key={idx} style={{ color: palette.syntaxString }}>{part}</span>;
      return <span key={idx} style={{ color: palette.text }}>{part}</span>;
    });
  }

  const regex = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\/.*$|\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?f?\b|\b[a-zA-Z_]\w*\b|[^\s\w"']+|\s+)/g;
  const tokens: React.ReactNode[] = [];
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = regex.exec(line)) !== null) {
    const token = match[0];
    const key = `t-${idx++}`;
    if (token.startsWith('//')) tokens.push(<span key={key} style={{ color: palette.syntaxComment }}>{token}</span>);
    else if (token.startsWith('"') || token.startsWith("'")) tokens.push(<span key={key} style={{ color: palette.syntaxString }}>{token}</span>);
    else if (/^\d/.test(token) || token.startsWith('0x')) tokens.push(<span key={key} style={{ color: palette.syntaxNumber }}>{token}</span>);
    else if (CPP_KEYWORDS.has(token)) tokens.push(<span key={key} style={{ color: palette.syntaxKeyword, fontWeight: 'bold' }}>{token}</span>);
    else if (CPP_TYPES.has(token)) tokens.push(<span key={key} style={{ color: palette.syntaxType }}>{token}</span>);
    else if (CPP_FUNCTIONS.has(token)) tokens.push(<span key={key} style={{ color: palette.syntaxFunction }}>{token}</span>);
    else if (/^[{}()[\];,.<>!=+\-*/%&|^~?:#]$/.test(token)) tokens.push(<span key={key} style={{ color: palette.textMuted }}>{token}</span>);
    else tokens.push(<span key={key} style={{ color: palette.text }}>{token}</span>);
  }

  return tokens.length > 0 ? tokens : [' '];
}

export const CodeEditor: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [showFind, setShowFind] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const currentFile = state.project.files[state.activeFilePath];
  const content = currentFile?.content || '';
  const lines = content.split('\n');
  const palette = THEME_PALETTES[state.theme] || THEME_PALETTES['github-dark'];
  const scaledFontSize = Math.max(10, Math.min(24, Math.round((state.editorSettings.fontSize * state.zoomLevel) / 100)));

  // File extension & matching language extension
  const fileExt = '.' + (state.activeFilePath.split('.').pop() || '');
  const matchingExt = state.extensions.find((e) => e.fileExtensions.includes(fileExt));
  const isExtensionActive = matchingExt ? matchingExt.installed && matchingExt.enabled : true;

  // Language display name
  const getLanguageName = () => {
    if (fileExt === '.py') return 'MicroPython (ESP32)';
    if (fileExt === '.rs' || fileExt === '.toml') return 'Rust (esp-rs)';
    if (fileExt === '.js' || fileExt === '.mjs') return 'JavaScript (QuickJS)';
    if (fileExt === '.ini' || fileExt === '.cfg') return 'PlatformIO INI';
    if (fileExt === '.json') return 'JSON Schema';
    if (fileExt === '.md') return 'Markdown';
    if (fileExt === '.S' || fileExt === '.asm') return 'Xtensa Assembly';
    return 'C/C++ (ESP32-S3)';
  };

  // Sync scrolling between textarea, pre highlight overlay, and gutter
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    if (preRef.current) {
      preRef.current.scrollTop = target.scrollTop;
      preRef.current.scrollLeft = target.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = target.scrollTop;
    }
  };

  // Keyboard shortcuts (Ctrl+S, Ctrl+F, Shift+Alt+F, Zoom hotkeys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (state.editorSettings.formatOnSave) actions.formatCurrentCode();
        actions.triggerSync();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowFind((prev) => !prev);
      } else if (e.shiftKey && e.altKey && e.key === 'F') {
        e.preventDefault();
        actions.formatCurrentCode();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        actions.zoomIn();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        actions.zoomOut();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        actions.resetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.editorSettings.formatOnSave]);

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      actions.updateFileContent(state.activeFilePath, newContent);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = content.substring(0, pos);
    const lineNum = textBefore.split('\n').length;
    const colNum = pos - textBefore.lastIndexOf('\n');
    setCursorPos({ line: lineNum, col: colNum });
  };

  const handleReplaceAll = () => {
    if (!findQuery) return;
    const updated = content.replaceAll(findQuery, replaceQuery);
    actions.updateFileContent(state.activeFilePath, updated);
  };

  const pathParts = state.activeFilePath.split('/');

  return (
    <div
      style={{ backgroundColor: palette.bgMain, color: palette.text }}
      className="flex-1 flex flex-col h-full overflow-hidden select-none font-mono text-xs transition-colors duration-200"
    >
      {/* Editor Tabs */}
      <div
        style={{ backgroundColor: palette.bgSidebar, borderColor: palette.border }}
        className="h-9 border-b flex items-center overflow-x-auto select-none"
      >
        {state.openTabs.map((tabPath) => {
          const isActive = state.activeFilePath === tabPath;
          const fileName = tabPath.split('/').pop() || tabPath;
          const isDirty = state.syncStatus === 'PENDING';

          return (
            <div
              key={tabPath}
              onClick={() => actions.setActiveFilePath(tabPath)}
              style={{
                backgroundColor: isActive ? palette.bgMain : 'transparent',
                color: isActive ? palette.accent : palette.textMuted,
                borderRightColor: palette.border,
                borderTopColor: isActive ? palette.accent : 'transparent',
              }}
              className={`h-full px-3.5 flex items-center space-x-2 border-r cursor-pointer transition-colors ${
                isActive ? 'border-t-2 font-semibold' : 'hover:bg-black/20'
              }`}
            >
              <span>{fileName}</span>
              {isDirty && isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  actions.closeTab(tabPath);
                }}
                className="hover:text-rose-400 p-0.5 rounded text-[10px]"
                title="Close Tab"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* Recommended Extension Notification Banner (VS Code Style) */}
      {matchingExt && !matchingExt.installed && (
        <div className="bg-[#1f6feb]/15 border-b border-[#1f6feb]/40 px-3 py-1.5 flex items-center justify-between text-[11px] animate-fadeIn">
          <div className="flex items-center space-x-2">
            <span className="text-sm">{matchingExt.icon}</span>
            <span className="text-[#c9d1d9]">
              Install recommended extension <strong className="text-white">'{matchingExt.displayName}'</strong> for <code className="text-[#58a6ff]">{fileExt}</code> support?
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => actions.installExtension(matchingExt.id, false)}
              className="flex items-center space-x-1 px-2.5 py-0.5 rounded bg-[#1f6feb] hover:bg-[#388bfd] text-white font-semibold text-[10px] shadow-sm transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Install Extension</span>
            </button>
            <button
              onClick={() => actions.setActiveNavTab('extensions')}
              className="px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white text-[10px]"
            >
              Marketplace
            </button>
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation & Toolbar */}
      <div
        style={{ backgroundColor: palette.bgMain, borderColor: palette.border }}
        className="h-7 border-b px-3 flex items-center justify-between text-[11px]"
      >
        <div className="flex items-center space-x-1" style={{ color: palette.textMuted }}>
          <Code className="w-3 h-3" style={{ color: palette.accent }} />
          <span>{state.targetBoard}</span>
          {pathParts.map((part, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-2.5 h-2.5 opacity-50" />
              <span style={{ color: idx === pathParts.length - 1 ? palette.text : palette.textMuted }}>
                {part}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Toolbar: Snippets, Extensions, Prettier Format, AI Copilot */}
        <div className="flex items-center space-x-2">
          {/* Extensions Marketplace Button */}
          <button
            onClick={() => actions.setActiveNavTab('extensions')}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#161b22] hover:bg-[#21262d] text-[#58a6ff] border border-[#30363d] text-[10px]"
            title="Browse Extensions Marketplace"
          >
            <Blocks className="w-3 h-3 text-purple-400" />
            <span>Extensions</span>
          </button>

          {/* Prettier Format Button */}
          <button
            onClick={actions.formatCurrentCode}
            style={{ backgroundColor: palette.bgSidebar, borderColor: palette.border, color: palette.accent }}
            className="flex items-center space-x-1 px-2 py-0.5 rounded border text-[10px] hover:opacity-80 transition-opacity"
            title="Format Document with Prettier (Shift+Alt+F)"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Format</span>
          </button>

          {/* AI Copilot Quick Button */}
          <button
            onClick={actions.toggleAiPanel}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-purple-950/70 hover:bg-purple-900 border border-purple-800 text-purple-300 text-[10px] transition-colors"
            title="Open AI Embedded Copilot"
          >
            <Bot className="w-3 h-3 text-purple-400" />
            <span>Copilot</span>
          </button>
        </div>
      </div>

      {/* Floating Find / Replace Toolbar */}
      {showFind && (
        <div
          style={{ backgroundColor: palette.bgSidebar, borderColor: palette.border }}
          className="border-b p-2 flex items-center space-x-2 z-10 shadow-lg"
        >
          <Search className="w-3.5 h-3.5" style={{ color: palette.textMuted }} />
          <input
            type="text"
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            placeholder="Find in file..."
            style={{ backgroundColor: palette.bgMain, borderColor: palette.border, color: palette.text }}
            className="border px-2 py-0.5 rounded text-xs outline-none"
          />
          <input
            type="text"
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            placeholder="Replace with..."
            style={{ backgroundColor: palette.bgMain, borderColor: palette.border, color: palette.text }}
            className="border px-2 py-0.5 rounded text-xs outline-none"
          />
          <button
            onClick={handleReplaceAll}
            style={{ backgroundColor: palette.bgActive, color: palette.text }}
            className="px-2 py-0.5 rounded hover:opacity-80 text-[11px]"
          >
            Replace All
          </button>
          <button
            onClick={() => setShowFind(false)}
            className="p-1 hover:text-white rounded"
          >
            <X className="w-3.5 h-3.5" style={{ color: palette.textMuted }} />
          </button>
        </div>
      )}

      {/* Code Text Area with Line Numbers, Syntax Coloring & Error Squiggles */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line Numbers Column with Diagnostics Gutter */}
        <div
          ref={gutterRef}
          style={{ backgroundColor: palette.bgMain, borderColor: palette.border }}
          className="w-14 py-3 text-right select-none border-r text-xs overflow-hidden"
        >
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const isCurrent = cursorPos.line === lineNum;
            const diag = state.codeDiagnostics.find((d) => d.line === lineNum);

            return (
              <div
                key={i}
                style={{
                  height: '1.625rem',
                  color: isCurrent ? palette.accent : palette.textMuted,
                  backgroundColor: diag ? palette.errorBg : undefined,
                }}
                className={`flex items-center justify-end pr-2 space-x-1 ${
                  isCurrent ? 'font-bold' : ''
                }`}
                title={diag ? `[${diag.severity.toUpperCase()}] ${diag.message}` : `Line ${lineNum}`}
              >
                {diag && (
                  <span
                    className="w-1.5 h-1.5 rounded-full inline-block"
                    style={{ backgroundColor: diag.severity === 'error' ? palette.errorColor : palette.warningColor }}
                  />
                )}
                <span>{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Dual-Layer Synchronized Code Area: Colored Syntax & Real-time Textarea */}
        <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: palette.bgMain }}>
          {/* Syntax-highlighted and Error Squiggle Layer */}
          <pre
            ref={preRef}
            aria-hidden="true"
            style={{
              fontSize: `${scaledFontSize}px`,
              fontFamily: state.editorSettings.fontFamily,
              lineHeight: '1.625rem',
              tabSize: state.editorSettings.tabSize,
              color: palette.text,
            }}
            className="absolute inset-0 p-3 m-0 pointer-events-none overflow-hidden whitespace-pre font-mono select-none"
          >
            {lines.map((lineText, idx) => {
              const lineNum = idx + 1;
              const diag = state.codeDiagnostics.find((d) => d.line === lineNum);

              return (
                <div
                  key={idx}
                  className="w-full flex items-center"
                  style={{
                    height: '1.625rem',
                    backgroundColor: diag ? palette.errorBg : undefined,
                    borderBottom: diag
                      ? `2px dashed ${diag.severity === 'error' ? palette.errorColor : palette.warningColor}`
                      : undefined,
                  }}
                >
                  <span className="flex-shrink-0">
                    {tokenizeLine(lineText, palette, fileExt, isExtensionActive)}
                  </span>
                  {diag && (
                    <span
                      style={{
                        color: diag.severity === 'error' ? palette.errorColor : palette.warningColor,
                      }}
                      className="ml-4 inline-flex items-center text-[10px] opacity-90 font-sans"
                    >
                      {diag.severity === 'error' ? (
                        <AlertCircle className="w-3 h-3 inline mr-1 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 inline mr-1 flex-shrink-0" />
                      )}
                      <span>{diag.message}</span>
                    </span>
                  )}
                </div>
              );
            })}
          </pre>

          {/* Real-time Native Typing Input Layer */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => actions.updateFileContent(state.activeFilePath, e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            onKeyUp={updateCursorPosition}
            onClick={updateCursorPosition}
            onScroll={handleScroll}
            spellCheck={false}
            style={{
              fontSize: `${scaledFontSize}px`,
              fontFamily: state.editorSettings.fontFamily,
              lineHeight: '1.625rem',
              tabSize: state.editorSettings.tabSize,
              caretColor: palette.accent,
            }}
            className="absolute inset-0 p-3 m-0 w-full h-full bg-transparent text-transparent resize-none outline-none whitespace-pre font-mono selection:bg-[#1f6feb]/30"
          />
        </div>
      </div>

      {/* Editor Status Bar with Language Pack & Zoom Controls */}
      <div
        style={{ backgroundColor: palette.bgSidebar, borderColor: palette.border, color: palette.textMuted }}
        className="h-6 border-t px-3 flex items-center justify-between text-[11px]"
      >
        <div className="flex items-center space-x-4">
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>{lines.length} lines</span>
          <span>{content.length} chars</span>

          {/* Diagnostic Problems Pill */}
          {state.codeDiagnostics.length > 0 && (
            <span
              onClick={() => actions.setBottomPanelTab('problems')}
              className="flex items-center space-x-1 cursor-pointer hover:underline"
              style={{ color: palette.warningColor }}
              title="Click to view problems"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{state.codeDiagnostics.length} Problem</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* Zoom In / Zoom Out Controls */}
          <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded border" style={{ borderColor: palette.border, backgroundColor: palette.bgMain }}>
            <button
              onClick={actions.zoomOut}
              className="hover:text-white p-0.5"
              title="Zoom Out (Ctrl+-)"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <button
              onClick={actions.resetZoom}
              className="px-1 hover:text-white text-[10px]"
              title="Reset Zoom (Ctrl+0)"
            >
              {state.zoomLevel}%
            </button>
            <button
              onClick={actions.zoomIn}
              className="hover:text-white p-0.5"
              title="Zoom In (Ctrl++)"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          <span>UTF-8</span>
          <span>LF</span>

          {/* Dynamic Language Mode from Extensions */}
          <button
            onClick={() => actions.setActiveNavTab('extensions')}
            className="hover:underline flex items-center space-x-1 text-[#58a6ff]"
            title="Active Language Grammar (Click to manage in Extensions Marketplace)"
          >
            <span>{getLanguageName()}</span>
            {matchingExt && !matchingExt.installed && (
              <span className="px-1 py-0.2 rounded text-[9px] bg-amber-950 text-amber-300 border border-amber-800">
                Install Ext
              </span>
            )}
          </button>

          <span style={{ color: palette.accent }}>{palette.name}</span>
          <span className="text-emerald-400 flex items-center space-x-1">
            <Check className="w-3 h-3" />
            <span>Ready</span>
          </span>
        </div>
      </div>
    </div>
  );
};
