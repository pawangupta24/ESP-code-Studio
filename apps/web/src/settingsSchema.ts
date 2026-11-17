// Single source of truth for user settings: the Settings UI, settings.json view and the
// Monaco editor options are all generated from SETTINGS below, so every visible setting
// actually does something.

export interface EditorCustomization {
  // Text Editor
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontLigatures: boolean;
  lineHeight: number;
  letterSpacing: number;
  cursorStyle: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin';
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  cursorSmoothCaretAnimation: 'off' | 'explicit' | 'on';
  multiCursorModifier: 'alt' | 'ctrlCmd';
  tabSize: number;
  insertSpaces: boolean;
  detectIndentation: boolean;
  autoIndent: 'none' | 'keep' | 'brackets' | 'advanced' | 'full';
  lineNumbers: 'on' | 'off' | 'relative' | 'interval';
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
  renderLineHighlight: 'none' | 'gutter' | 'line' | 'all';
  rulers: string;
  wordWrap: boolean;
  glyphMargin: boolean;
  folding: boolean;
  showFoldingControls: 'always' | 'mouseover' | 'never';
  stickyScroll: boolean;
  renderControlCharacters: boolean;
  bracketPairColorization: boolean;
  guidesBracketPairs: boolean;
  guidesIndentation: boolean;
  matchBrackets: 'always' | 'near' | 'never';
  autoClosingBrackets: boolean;
  autoClosingQuotes: boolean;
  minimap: boolean;
  minimapSide: 'right' | 'left';
  minimapRenderCharacters: boolean;
  minimapScale: number;
  smoothScrolling: boolean;
  mouseWheelZoom: boolean;
  scrollBeyondLastLine: boolean;
  quickSuggestions: boolean;
  suggestOnTriggerCharacters: boolean;
  acceptSuggestionOnEnter: 'on' | 'smart' | 'off';
  tabCompletion: 'on' | 'off' | 'onlySnippets';
  snippetSuggestions: 'top' | 'bottom' | 'inline' | 'none';
  parameterHints: boolean;
  hover: boolean;
  formatOnSave: boolean;
  formatOnPaste: boolean;
  formatOnType: boolean;
  linkedEditing: boolean;
  selectionHighlight: boolean;
  links: boolean;
  colorDecorators: boolean;
  // Files
  autoSave: 'off' | 'afterDelay';
  autoSaveDelay: number;
  trimTrailingWhitespace: boolean;
  insertFinalNewline: boolean;
  defaultLanguage: string;
  // Workbench
  showActivityBar: boolean;
  showStatusBar: boolean;
  showToolbar: boolean;
  showBreadcrumbs: boolean;
  showTabs: boolean;
  treeIndent: number;
  confirmDelete: boolean;
  // ESP32
  flashSpeed: string;
  flashMode: string;
  defaultBaudRate: number;
  autoScrollSerial: boolean;
  showSerialTimestamps: boolean;
}

export const DEFAULT_EDITOR_SETTINGS: EditorCustomization = {
  fontSize: 13,
  fontFamily: "'JetBrains Mono', Consolas, monospace",
  fontWeight: 'normal',
  fontLigatures: false,
  lineHeight: 0,
  letterSpacing: 0,
  cursorStyle: 'line',
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'off',
  multiCursorModifier: 'alt',
  tabSize: 2,
  insertSpaces: true,
  detectIndentation: true,
  autoIndent: 'advanced',
  lineNumbers: 'on',
  renderWhitespace: 'selection',
  renderLineHighlight: 'all',
  rulers: '',
  wordWrap: false,
  glyphMargin: true,
  folding: true,
  showFoldingControls: 'mouseover',
  stickyScroll: false,
  renderControlCharacters: false,
  bracketPairColorization: true,
  guidesBracketPairs: false,
  guidesIndentation: true,
  matchBrackets: 'always',
  autoClosingBrackets: true,
  autoClosingQuotes: true,
  minimap: true,
  minimapSide: 'right',
  minimapRenderCharacters: true,
  minimapScale: 1,
  smoothScrolling: true,
  mouseWheelZoom: false,
  scrollBeyondLastLine: false,
  quickSuggestions: true,
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: 'on',
  tabCompletion: 'off',
  snippetSuggestions: 'inline',
  parameterHints: true,
  hover: true,
  formatOnSave: false,
  formatOnPaste: false,
  formatOnType: false,
  linkedEditing: false,
  selectionHighlight: true,
  links: true,
  colorDecorators: true,
  autoSave: 'off',
  autoSaveDelay: 1000,
  trimTrailingWhitespace: false,
  insertFinalNewline: false,
  defaultLanguage: 'plaintext',
  showActivityBar: true,
  showStatusBar: true,
  showToolbar: true,
  showBreadcrumbs: true,
  showTabs: true,
  treeIndent: 14,
  confirmDelete: true,
  flashSpeed: '80m',
  flashMode: 'qio',
  defaultBaudRate: 115200,
  autoScrollSerial: true,
  showSerialTimestamps: true,
};

export type SettingCategory = 'Text Editor' | 'Files' | 'Workbench' | 'Features' | 'ESP32';

export interface SettingDef {
  key: keyof EditorCustomization;
  id: string; // VS Code-style id shown in the UI and used in settings.json
  title: string;
  description: string;
  category: SettingCategory;
  section: string;
  type: 'boolean' | 'number' | 'enum' | 'string';
  options?: { value: string | number; label?: string }[];
  min?: number;
  max?: number;
  common?: boolean; // shown under "Commonly Used"
}

const e = (...values: (string | number)[]) => values.map((value) => ({ value }));

export const SETTINGS: SettingDef[] = [
  // ---- Text Editor ----
  { key: 'fontSize', id: 'editor.fontSize', title: 'Font Size', description: 'Controls the font size in pixels.', category: 'Text Editor', section: 'Font', type: 'number', min: 6, max: 40, common: true },
  {
    key: 'fontFamily', id: 'editor.fontFamily', title: 'Font Family', description: 'Controls the font family. Pick a preset or type any installed font.', category: 'Text Editor', section: 'Font', type: 'string', common: true,
    options: [
      { value: "'JetBrains Mono', Consolas, monospace", label: 'JetBrains Mono' },
      { value: "'Fira Code', monospace", label: 'Fira Code' },
      { value: "Consolas, 'Courier New', monospace", label: 'Consolas' },
      { value: "'Cascadia Code', monospace", label: 'Cascadia Code' },
      { value: "'Source Code Pro', monospace", label: 'Source Code Pro' },
      { value: 'Menlo, Monaco, monospace', label: 'Menlo' },
      { value: "'Courier New', monospace", label: 'Courier New' },
    ],
  },
  { key: 'fontWeight', id: 'editor.fontWeight', title: 'Font Weight', description: 'Controls the font weight.', category: 'Text Editor', section: 'Font', type: 'enum', options: e('normal', 'bold', '300', '500', '600') },
  { key: 'fontLigatures', id: 'editor.fontLigatures', title: 'Font Ligatures', description: 'Enables font ligatures (needs a font that has them, e.g. Fira Code).', category: 'Text Editor', section: 'Font', type: 'boolean' },
  { key: 'lineHeight', id: 'editor.lineHeight', title: 'Line Height', description: 'Line height in pixels. 0 computes it from the font size.', category: 'Text Editor', section: 'Font', type: 'number', min: 0, max: 60 },
  { key: 'letterSpacing', id: 'editor.letterSpacing', title: 'Letter Spacing', description: 'Letter spacing in pixels.', category: 'Text Editor', section: 'Font', type: 'number', min: -5, max: 10 },

  { key: 'cursorStyle', id: 'editor.cursorStyle', title: 'Cursor Style', description: 'Controls the cursor style.', category: 'Text Editor', section: 'Cursor', type: 'enum', options: e('line', 'block', 'underline', 'line-thin', 'block-outline', 'underline-thin') },
  { key: 'cursorBlinking', id: 'editor.cursorBlinking', title: 'Cursor Blinking', description: 'Controls the cursor animation style.', category: 'Text Editor', section: 'Cursor', type: 'enum', options: e('blink', 'smooth', 'phase', 'expand', 'solid') },
  { key: 'cursorSmoothCaretAnimation', id: 'editor.cursorSmoothCaretAnimation', title: 'Cursor Smooth Caret Animation', description: 'Controls whether the smooth caret animation is enabled.', category: 'Text Editor', section: 'Cursor', type: 'enum', options: e('off', 'explicit', 'on') },
  { key: 'multiCursorModifier', id: 'editor.multiCursorModifier', title: 'Multi Cursor Modifier', description: 'The modifier used to add multiple cursors with the mouse.', category: 'Text Editor', section: 'Cursor', type: 'enum', options: [{ value: 'alt', label: 'Alt' }, { value: 'ctrlCmd', label: 'Ctrl / Cmd' }] },

  { key: 'tabSize', id: 'editor.tabSize', title: 'Tab Size', description: 'The number of spaces a tab is equal to.', category: 'Text Editor', section: 'Indentation', type: 'number', min: 1, max: 8, common: true },
  { key: 'insertSpaces', id: 'editor.insertSpaces', title: 'Insert Spaces', description: 'Insert spaces when pressing Tab.', category: 'Text Editor', section: 'Indentation', type: 'boolean' },
  { key: 'detectIndentation', id: 'editor.detectIndentation', title: 'Detect Indentation', description: 'Detect Tab Size and Insert Spaces from the file content when it is opened.', category: 'Text Editor', section: 'Indentation', type: 'boolean' },
  { key: 'autoIndent', id: 'editor.autoIndent', title: 'Auto Indent', description: 'Controls whether the editor adjusts indentation as you type, paste or move lines.', category: 'Text Editor', section: 'Indentation', type: 'enum', options: e('none', 'keep', 'brackets', 'advanced', 'full') },

  { key: 'lineNumbers', id: 'editor.lineNumbers', title: 'Line Numbers', description: 'Controls the display of line numbers.', category: 'Text Editor', section: 'Display', type: 'enum', options: e('on', 'off', 'relative', 'interval') },
  { key: 'wordWrap', id: 'editor.wordWrap', title: 'Word Wrap', description: 'Wrap long lines at the viewport width (Alt+Z).', category: 'Text Editor', section: 'Display', type: 'boolean', common: true },
  { key: 'renderWhitespace', id: 'editor.renderWhitespace', title: 'Render Whitespace', description: 'Controls how whitespace characters are rendered.', category: 'Text Editor', section: 'Display', type: 'enum', options: e('none', 'boundary', 'selection', 'trailing', 'all'), common: true },
  { key: 'renderLineHighlight', id: 'editor.renderLineHighlight', title: 'Render Line Highlight', description: 'Controls how the current line is highlighted.', category: 'Text Editor', section: 'Display', type: 'enum', options: e('none', 'gutter', 'line', 'all') },
  { key: 'rulers', id: 'editor.rulers', title: 'Rulers', description: 'Comma-separated columns where vertical rulers are drawn, e.g. 80, 120.', category: 'Text Editor', section: 'Display', type: 'string' },
  { key: 'stickyScroll', id: 'editor.stickyScroll.enabled', title: 'Sticky Scroll', description: 'Show the enclosing function/class headers at the top while scrolling.', category: 'Text Editor', section: 'Display', type: 'boolean' },
  { key: 'glyphMargin', id: 'editor.glyphMargin', title: 'Glyph Margin', description: 'Show the vertical glyph margin (used for markers).', category: 'Text Editor', section: 'Display', type: 'boolean' },
  { key: 'folding', id: 'editor.folding', title: 'Folding', description: 'Enable code folding.', category: 'Text Editor', section: 'Display', type: 'boolean' },
  { key: 'showFoldingControls', id: 'editor.showFoldingControls', title: 'Show Folding Controls', description: 'When the folding arrows in the gutter are shown.', category: 'Text Editor', section: 'Display', type: 'enum', options: e('always', 'mouseover', 'never') },
  { key: 'renderControlCharacters', id: 'editor.renderControlCharacters', title: 'Render Control Characters', description: 'Render control characters.', category: 'Text Editor', section: 'Display', type: 'boolean' },

  { key: 'bracketPairColorization', id: 'editor.bracketPairColorization.enabled', title: 'Bracket Pair Colorization', description: 'Color matching bracket pairs.', category: 'Text Editor', section: 'Brackets', type: 'boolean' },
  { key: 'guidesBracketPairs', id: 'editor.guides.bracketPairs', title: 'Bracket Pair Guides', description: 'Draw guide lines between bracket pairs.', category: 'Text Editor', section: 'Brackets', type: 'boolean' },
  { key: 'guidesIndentation', id: 'editor.guides.indentation', title: 'Indentation Guides', description: 'Draw indentation guides.', category: 'Text Editor', section: 'Brackets', type: 'boolean' },
  { key: 'matchBrackets', id: 'editor.matchBrackets', title: 'Match Brackets', description: 'Highlight matching brackets.', category: 'Text Editor', section: 'Brackets', type: 'enum', options: e('always', 'near', 'never') },
  { key: 'autoClosingBrackets', id: 'editor.autoClosingBrackets', title: 'Auto Closing Brackets', description: 'Automatically close brackets after typing an opening one.', category: 'Text Editor', section: 'Brackets', type: 'boolean' },
  { key: 'autoClosingQuotes', id: 'editor.autoClosingQuotes', title: 'Auto Closing Quotes', description: 'Automatically close quotes.', category: 'Text Editor', section: 'Brackets', type: 'boolean' },

  { key: 'minimap', id: 'editor.minimap.enabled', title: 'Minimap', description: 'Show the minimap.', category: 'Text Editor', section: 'Minimap', type: 'boolean', common: true },
  { key: 'minimapSide', id: 'editor.minimap.side', title: 'Minimap Side', description: 'Side of the editor the minimap is rendered on.', category: 'Text Editor', section: 'Minimap', type: 'enum', options: e('right', 'left') },
  { key: 'minimapRenderCharacters', id: 'editor.minimap.renderCharacters', title: 'Minimap Render Characters', description: 'Render actual characters instead of color blocks.', category: 'Text Editor', section: 'Minimap', type: 'boolean' },
  { key: 'minimapScale', id: 'editor.minimap.scale', title: 'Minimap Scale', description: 'Scale of the minimap content.', category: 'Text Editor', section: 'Minimap', type: 'enum', options: e(1, 2, 3) },

  { key: 'smoothScrolling', id: 'editor.smoothScrolling', title: 'Smooth Scrolling', description: 'Animate scrolling.', category: 'Text Editor', section: 'Scrolling', type: 'boolean' },
  { key: 'mouseWheelZoom', id: 'editor.mouseWheelZoom', title: 'Mouse Wheel Zoom', description: 'Zoom the editor font with Ctrl + mouse wheel.', category: 'Text Editor', section: 'Scrolling', type: 'boolean' },
  { key: 'scrollBeyondLastLine', id: 'editor.scrollBeyondLastLine', title: 'Scroll Beyond Last Line', description: 'Allow scrolling past the last line.', category: 'Text Editor', section: 'Scrolling', type: 'boolean' },

  { key: 'quickSuggestions', id: 'editor.quickSuggestions', title: 'Quick Suggestions', description: 'Show suggestions automatically while typing.', category: 'Text Editor', section: 'Suggestions', type: 'boolean' },
  { key: 'suggestOnTriggerCharacters', id: 'editor.suggestOnTriggerCharacters', title: 'Suggest On Trigger Characters', description: 'Show suggestions after trigger characters like ".".', category: 'Text Editor', section: 'Suggestions', type: 'boolean' },
  { key: 'acceptSuggestionOnEnter', id: 'editor.acceptSuggestionOnEnter', title: 'Accept Suggestion On Enter', description: 'Whether Enter accepts a suggestion.', category: 'Text Editor', section: 'Suggestions', type: 'enum', options: e('on', 'smart', 'off') },
  { key: 'tabCompletion', id: 'editor.tabCompletion', title: 'Tab Completion', description: 'Insert the best match when pressing Tab.', category: 'Text Editor', section: 'Suggestions', type: 'enum', options: e('on', 'off', 'onlySnippets') },
  { key: 'snippetSuggestions', id: 'editor.snippetSuggestions', title: 'Snippet Suggestions', description: 'Where snippets from extensions appear among suggestions.', category: 'Text Editor', section: 'Suggestions', type: 'enum', options: e('top', 'bottom', 'inline', 'none') },
  { key: 'parameterHints', id: 'editor.parameterHints.enabled', title: 'Parameter Hints', description: 'Show parameter hints while typing.', category: 'Text Editor', section: 'Suggestions', type: 'boolean' },
  { key: 'hover', id: 'editor.hover.enabled', title: 'Hover', description: 'Show hover information.', category: 'Text Editor', section: 'Suggestions', type: 'boolean' },

  { key: 'formatOnSave', id: 'editor.formatOnSave', title: 'Format On Save', description: 'Format the file on save (languages with a built-in formatter: JSON, JS/TS, HTML, CSS).', category: 'Text Editor', section: 'Formatting', type: 'boolean', common: true },
  { key: 'formatOnPaste', id: 'editor.formatOnPaste', title: 'Format On Paste', description: 'Format pasted content.', category: 'Text Editor', section: 'Formatting', type: 'boolean' },
  { key: 'formatOnType', id: 'editor.formatOnType', title: 'Format On Type', description: 'Format the line after typing.', category: 'Text Editor', section: 'Formatting', type: 'boolean' },
  { key: 'linkedEditing', id: 'editor.linkedEditing', title: 'Linked Editing', description: 'Rename matching HTML tags together.', category: 'Text Editor', section: 'Formatting', type: 'boolean' },
  { key: 'selectionHighlight', id: 'editor.selectionHighlight', title: 'Selection Highlight', description: 'Highlight other occurrences of the selection.', category: 'Text Editor', section: 'Formatting', type: 'boolean' },
  { key: 'links', id: 'editor.links', title: 'Links', description: 'Detect links and make them clickable.', category: 'Text Editor', section: 'Formatting', type: 'boolean' },
  { key: 'colorDecorators', id: 'editor.colorDecorators', title: 'Color Decorators', description: 'Show inline color swatches for CSS colors.', category: 'Text Editor', section: 'Formatting', type: 'boolean' },

  // ---- Files ----
  { key: 'autoSave', id: 'files.autoSave', title: 'Auto Save', description: 'Automatically save modified files after a delay.', category: 'Files', section: 'Files', type: 'enum', options: e('off', 'afterDelay'), common: true },
  { key: 'autoSaveDelay', id: 'files.autoSaveDelay', title: 'Auto Save Delay', description: 'Delay in milliseconds before a modified file is saved (when Auto Save is afterDelay).', category: 'Files', section: 'Files', type: 'number', min: 100, max: 60000 },
  { key: 'trimTrailingWhitespace', id: 'files.trimTrailingWhitespace', title: 'Trim Trailing Whitespace', description: 'Remove trailing whitespace when saving.', category: 'Files', section: 'Files', type: 'boolean' },
  { key: 'insertFinalNewline', id: 'files.insertFinalNewline', title: 'Insert Final Newline', description: 'Ensure the file ends with a newline when saving.', category: 'Files', section: 'Files', type: 'boolean' },
  {
    key: 'defaultLanguage', id: 'files.defaultLanguage', title: 'Default Language', description: 'Language for new untitled files (File > New Text File).', category: 'Files', section: 'Files', type: 'enum',
    options: e('plaintext', 'cpp', 'c', 'python', 'javascript', 'typescript', 'json', 'markdown', 'rust', 'go', 'java', 'html', 'css', 'shell', 'yaml'),
  },

  // ---- Workbench ----
  { key: 'showActivityBar', id: 'workbench.activityBar.visible', title: 'Activity Bar Visible', description: 'Show the activity bar on the left.', category: 'Workbench', section: 'Appearance', type: 'boolean' },
  { key: 'showStatusBar', id: 'workbench.statusBar.visible', title: 'Status Bar Visible', description: 'Show the status bar at the bottom.', category: 'Workbench', section: 'Appearance', type: 'boolean' },
  { key: 'showToolbar', id: 'workbench.espToolbar.visible', title: 'ESP Toolbar Visible', description: 'Show the board / build / flash toolbar under the menu bar.', category: 'Workbench', section: 'Appearance', type: 'boolean' },
  { key: 'showBreadcrumbs', id: 'breadcrumbs.enabled', title: 'Breadcrumbs', description: 'Show the file path above the editor.', category: 'Workbench', section: 'Appearance', type: 'boolean' },
  { key: 'treeIndent', id: 'workbench.tree.indent', title: 'Tree Indent', description: 'Explorer indentation in pixels.', category: 'Workbench', section: 'Appearance', type: 'number', min: 4, max: 40 },
  { key: 'showTabs', id: 'workbench.editor.showTabs', title: 'Show Tabs', description: 'Show open editors as tabs.', category: 'Workbench', section: 'Editor Management', type: 'boolean' },

  // ---- Features ----
  { key: 'confirmDelete', id: 'explorer.confirmDelete', title: 'Confirm Delete', description: 'Ask for confirmation before deleting files in the Explorer.', category: 'Features', section: 'Explorer', type: 'boolean' },

  // ---- ESP32 ----
  { key: 'flashSpeed', id: 'esp32.flash.speed', title: 'SPI Flash Speed', description: 'Flash clock frequency used when flashing.', category: 'ESP32', section: 'Flasher', type: 'enum', options: [{ value: '80m', label: '80 MHz' }, { value: '40m', label: '40 MHz' }, { value: '26m', label: '26 MHz' }, { value: '20m', label: '20 MHz' }] },
  { key: 'flashMode', id: 'esp32.flash.mode', title: 'Flash Mode', description: 'SPI flash interface mode.', category: 'ESP32', section: 'Flasher', type: 'enum', options: [{ value: 'qio', label: 'QIO' }, { value: 'qout', label: 'QOUT' }, { value: 'dio', label: 'DIO' }, { value: 'dout', label: 'DOUT' }] },
  { key: 'defaultBaudRate', id: 'esp32.serial.baudRate', title: 'Serial Baud Rate', description: 'Default baud rate for the serial monitor.', category: 'ESP32', section: 'Serial', type: 'enum', options: e(9600, 57600, 115200, 230400, 460800, 921600) },
  { key: 'autoScrollSerial', id: 'esp32.serial.autoScroll', title: 'Serial Auto Scroll', description: 'Keep the serial monitor scrolled to the newest line.', category: 'ESP32', section: 'Serial', type: 'boolean' },
  { key: 'showSerialTimestamps', id: 'esp32.serial.timestamps', title: 'Serial Timestamps', description: 'Prefix serial lines with a timestamp.', category: 'ESP32', section: 'Serial', type: 'boolean' },
];

/** Validate a single value against its definition; undefined when invalid. */
export function coerce(def: SettingDef, value: unknown): any {
  if (value === undefined || value === null) return undefined;
  switch (def.type) {
    case 'boolean':
      return typeof value === 'boolean' ? value : undefined;
    case 'number': {
      const n = Number(value);
      if (typeof value === 'boolean' || !Number.isFinite(n)) return undefined;
      return Math.max(def.min ?? -Infinity, Math.min(def.max ?? Infinity, n));
    }
    case 'enum':
      return def.options!.find((o) => String(o.value) === String(value))?.value;
    case 'string':
      return typeof value === 'string' ? value : undefined;
  }
}

/** Repair settings loaded from storage (older versions stored some of these differently). */
export function normalizeSettings(raw: Record<string, unknown>): EditorCustomization {
  const out: any = { ...DEFAULT_EDITOR_SETTINGS };
  for (const def of SETTINGS) {
    const v = coerce(def, raw[def.key]);
    if (v !== undefined) out[def.key] = v;
  }
  if (raw.lineNumbers === true) out.lineNumbers = 'on';
  if (raw.lineNumbers === false) out.lineNumbers = 'off';
  return out;
}

/** settings.json view: only values that differ from the defaults, keyed by VS Code-style id. */
export function settingsToJson(s: EditorCustomization): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const def of SETTINGS) {
    if (s[def.key] !== DEFAULT_EDITOR_SETTINGS[def.key]) out[def.id] = s[def.key];
  }
  return out;
}

/** Parse settings.json back. Throws with a readable message on unknown keys or bad values. */
export function settingsFromJson(json: Record<string, unknown>): EditorCustomization {
  const out: any = { ...DEFAULT_EDITOR_SETTINGS };
  for (const [id, value] of Object.entries(json)) {
    const def = SETTINGS.find((d) => d.id === id);
    if (!def) throw new Error(`Unknown setting "${id}"`);
    const v = coerce(def, value);
    if (v === undefined) throw new Error(`Invalid value for "${id}": ${JSON.stringify(value)}`);
    out[def.key] = v;
  }
  return out;
}

/** Monaco editor options for the current settings. tabSize/insertSpaces are model options, set separately. */
export function toMonacoOptions(s: EditorCustomization, zoomLevel: number) {
  return {
    fontSize: Math.max(6, Math.min(60, Math.round((s.fontSize * zoomLevel) / 100))),
    fontFamily: s.fontFamily,
    fontWeight: s.fontWeight,
    fontLigatures: s.fontLigatures,
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing,
    cursorStyle: s.cursorStyle,
    cursorBlinking: s.cursorBlinking,
    cursorSmoothCaretAnimation: s.cursorSmoothCaretAnimation,
    multiCursorModifier: s.multiCursorModifier,
    autoIndent: s.autoIndent,
    lineNumbers: s.lineNumbers,
    renderWhitespace: s.renderWhitespace,
    renderLineHighlight: s.renderLineHighlight,
    rulers: s.rulers
      .split(',')
      .map((r) => parseInt(r.trim(), 10))
      .filter((n) => n > 0),
    wordWrap: s.wordWrap ? 'on' : 'off',
    glyphMargin: s.glyphMargin,
    folding: s.folding,
    showFoldingControls: s.showFoldingControls,
    stickyScroll: { enabled: s.stickyScroll },
    renderControlCharacters: s.renderControlCharacters,
    bracketPairColorization: { enabled: s.bracketPairColorization },
    guides: { bracketPairs: s.guidesBracketPairs, indentation: s.guidesIndentation },
    matchBrackets: s.matchBrackets,
    autoClosingBrackets: s.autoClosingBrackets ? 'always' : 'never',
    autoClosingQuotes: s.autoClosingQuotes ? 'always' : 'never',
    minimap: { enabled: s.minimap, side: s.minimapSide, renderCharacters: s.minimapRenderCharacters, scale: Number(s.minimapScale) },
    smoothScrolling: s.smoothScrolling,
    mouseWheelZoom: s.mouseWheelZoom,
    scrollBeyondLastLine: s.scrollBeyondLastLine,
    quickSuggestions: s.quickSuggestions,
    suggestOnTriggerCharacters: s.suggestOnTriggerCharacters,
    acceptSuggestionOnEnter: s.acceptSuggestionOnEnter,
    tabCompletion: s.tabCompletion,
    snippetSuggestions: s.snippetSuggestions,
    parameterHints: { enabled: s.parameterHints },
    hover: { enabled: s.hover },
    formatOnPaste: s.formatOnPaste,
    formatOnType: s.formatOnType,
    linkedEditing: s.linkedEditing,
    selectionHighlight: s.selectionHighlight,
    links: s.links,
    colorDecorators: s.colorDecorators,
  };
}
