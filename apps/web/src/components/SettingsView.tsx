import React, { useState, useEffect } from 'react';
import { useWorkspaceStore, AiModelId } from '../stores/useWorkspaceStore';
import { formatShortcut } from '../utils/platform';
import { THEME_PALETTES } from '../themeTokens';
import { availableThemes } from '../extensionsCatalog';
import {
  SETTINGS,
  SettingDef,
  SettingCategory,
  DEFAULT_EDITOR_SETTINGS,
  EditorCustomization,
  settingsToJson,
  settingsFromJson,
} from '../settingsSchema';
import { Settings, RotateCcw, Check, Search, Code2, Sliders, X, Keyboard, Palette, Bot, Blocks } from 'lucide-react';

type Section = 'commonly-used' | SettingCategory | 'appearance' | 'copilot' | 'keybindings';

const NAV: { id: Section; label: string }[] = [
  { id: 'commonly-used', label: 'Commonly Used' },
  { id: 'Text Editor', label: 'Text Editor' },
  { id: 'Files', label: 'Files' },
  { id: 'Workbench', label: 'Workbench' },
  { id: 'appearance', label: 'Color Theme & Zoom' },
  { id: 'Features', label: 'Features' },
  { id: 'ESP32', label: 'ESP32 & Serial' },
  { id: 'copilot', label: 'AI Copilot' },
  { id: 'keybindings', label: 'Keyboard Shortcuts' },
];

// Kept in sync with the handlers in App.tsx, CommandPalette.tsx and Monaco's defaults.
const SHORTCUTS: { command: string; keys: string; when?: string }[] = [
  { command: 'Show All Commands', keys: 'Ctrl+Shift+P' },
  { command: 'Show All Commands', keys: 'F1' },
  { command: 'Go to File', keys: 'Ctrl+P' },
  { command: 'Go to Line/Column', keys: 'Ctrl+G', when: 'editor' },
  { command: 'Go to Symbol in Editor', keys: 'Ctrl+Shift+O', when: 'editor' },
  { command: 'Go to Definition', keys: 'F12', when: 'editor' },
  { command: 'Go to Bracket', keys: 'Ctrl+Shift+\\', when: 'editor' },
  { command: 'Save', keys: 'Ctrl+S' },
  { command: 'Save All', keys: 'Ctrl+Shift+S' },
  { command: 'Close Editor', keys: 'Ctrl+W' },
  { command: 'Next Editor', keys: 'Ctrl+PageDown' },
  { command: 'Previous Editor', keys: 'Ctrl+PageUp' },
  { command: 'Split Editor', keys: 'Ctrl+\\' },
  { command: 'Find', keys: 'Ctrl+F', when: 'editor' },
  { command: 'Replace', keys: 'Ctrl+H', when: 'editor' },
  { command: 'Find in Files', keys: 'Ctrl+Shift+F' },
  { command: 'Toggle Line Comment', keys: 'Ctrl+/', when: 'editor' },
  { command: 'Toggle Block Comment', keys: 'Shift+Alt+A', when: 'editor' },
  { command: 'Format Document', keys: 'Shift+Alt+F', when: 'editor' },
  { command: 'Trigger Suggest', keys: 'Ctrl+Space', when: 'editor' },
  { command: 'Rename Symbol', keys: 'F2', when: 'editor' },
  { command: 'Add Selection To Next Find Match', keys: 'Ctrl+D', when: 'editor' },
  { command: 'Copy Line Down', keys: 'Shift+Alt+Down', when: 'editor' },
  { command: 'Move Line Up', keys: 'Alt+Up', when: 'editor' },
  { command: 'Delete Line', keys: 'Ctrl+Shift+K', when: 'editor' },
  { command: 'Fold', keys: 'Ctrl+Shift+[', when: 'editor' },
  { command: 'Unfold', keys: 'Ctrl+Shift+]', when: 'editor' },
  { command: 'Toggle Word Wrap', keys: 'Alt+Z' },
  { command: 'Show Explorer', keys: 'Ctrl+Shift+E' },
  { command: 'Show Search', keys: 'Ctrl+Shift+F' },
  { command: 'Show Source Control', keys: 'Ctrl+Shift+G' },
  { command: 'Show Run and Debug', keys: 'Ctrl+Shift+D' },
  { command: 'Show Extensions', keys: 'Ctrl+Shift+X' },
  { command: 'Show Problems', keys: 'Ctrl+Shift+M' },
  { command: 'Toggle Panel', keys: 'Ctrl+J' },
  { command: 'Toggle Terminal', keys: 'Ctrl+`' },
  { command: 'Open Settings', keys: 'Ctrl+,' },
  { command: 'Open Keyboard Shortcuts', keys: 'Ctrl+K Ctrl+S' },
  { command: 'Color Theme', keys: 'Ctrl+K Ctrl+T' },
  { command: 'Change Language Mode', keys: 'Ctrl+K M' },
  { command: 'Toggle Zen Mode', keys: 'Ctrl+K Z' },
  { command: 'Toggle Full Screen', keys: 'F11' },
  { command: 'Zoom In / Out / Reset', keys: 'Ctrl+= / Ctrl+- / Ctrl+0' },
  { command: 'Build Firmware', keys: 'Ctrl+B' },
  { command: 'Run Build Task', keys: 'Ctrl+Shift+B' },
  { command: 'Flash Firmware', keys: 'Ctrl+U' },
  { command: 'Start Serial Monitor', keys: 'F5' },
  { command: 'Toggle AI Copilot', keys: 'Ctrl+Shift+A' },
];

const AI_MODELS: { id: AiModelId; name: string }[] = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'deepseek-coder', name: 'DeepSeek Coder V2' },
];

const inputCls =
  'bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] rounded px-2 py-1 text-xs text-white outline-none';

const SettingRow: React.FC<{
  def: SettingDef;
  value: any;
  onChange: (v: any) => void;
  onReset: () => void;
}> = ({ def, value, onChange, onReset }) => {
  const modified = value !== DEFAULT_EDITOR_SETTINGS[def.key];
  return (
    <div
      className={`group pl-3 pr-2 py-2.5 border-l-2 hover:bg-[#161b22]/60 ${
        modified ? 'border-[#58a6ff]' : 'border-transparent'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-white">
          <span className="text-[#8b949e]">{def.section}: </span>
          <span className="font-semibold">{def.title}</span>
        </span>
        {modified && (
          <button onClick={onReset} title="Reset to default" className="text-[#8b949e] hover:text-[#58a6ff]">
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
      <p className="text-[11px] text-[#8b949e] mt-0.5 mb-1.5">{def.description}</p>

      {def.type === 'boolean' ? (
        <label className="flex items-center gap-2 text-[11px] text-[#c9d1d9] cursor-pointer">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="accent-[#58a6ff]" />
          <span>{def.id}</span>
        </label>
      ) : def.type === 'enum' ? (
        <select
          value={String(value)}
          onChange={(e) => {
            const opt = def.options!.find((o) => String(o.value) === e.target.value);
            if (opt) onChange(opt.value);
          }}
          className={`${inputCls} min-w-[200px]`}
        >
          {def.options!.map((o) => (
            <option key={String(o.value)} value={String(o.value)}>
              {o.label ?? String(o.value)}
            </option>
          ))}
        </select>
      ) : def.type === 'number' ? (
        <input
          type="number"
          min={def.min}
          max={def.max}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (e.target.value !== '' && Number.isFinite(n)) {
              onChange(Math.max(def.min ?? -Infinity, Math.min(def.max ?? Infinity, n)));
            }
          }}
          className={`${inputCls} w-28`}
        />
      ) : (
        <>
          <input
            type="text"
            value={value}
            list={def.options ? `dl-${def.key}` : undefined}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputCls} w-full max-w-md`}
          />
          {def.options && (
            <datalist id={`dl-${def.key}`}>
              {def.options.map((o) => (
                <option key={String(o.value)} value={String(o.value)}>
                  {o.label}
                </option>
              ))}
            </datalist>
          )}
        </>
      )}
    </div>
  );
};

export const SettingsView: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [section, setSection] = useState<Section>(state.settingsSection as Section);
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<'ui' | 'json'>('ui');
  const [jsonText, setJsonText] = useState('');
  const [jsonStatus, setJsonStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [shortcutFilter, setShortcutFilter] = useState('');

  // Menu items like "Keyboard Shortcuts" open Settings on a specific section
  useEffect(() => setSection(state.settingsSection as Section), [state.settingsSection]);

  const s = state.editorSettings;
  const set = (key: keyof EditorCustomization, value: any) => actions.setEditorSettings({ [key]: value });

  const q = query.trim().toLowerCase();
  const onlyModified = q.startsWith('@modified');
  const textQuery = onlyModified ? q.slice('@modified'.length).trim() : q;

  // Search spans all categories (like VS Code); otherwise show the selected category.
  const visible = SETTINGS.filter((d) => {
    if (onlyModified && s[d.key] === DEFAULT_EDITOR_SETTINGS[d.key]) return false;
    if (textQuery) return `${d.id} ${d.title} ${d.description} ${d.section}`.toLowerCase().includes(textQuery);
    if (onlyModified) return true;
    return section === 'commonly-used' ? !!d.common : d.category === section;
  });

  const grouped = visible.reduce<Record<string, SettingDef[]>>((acc, d) => {
    const group = q || section === 'commonly-used' ? `${d.category} › ${d.section}` : d.section;
    (acc[group] ||= []).push(d);
    return acc;
  }, {});

  const modifiedCount = SETTINGS.filter((d) => s[d.key] !== DEFAULT_EDITOR_SETTINGS[d.key]).length;
  const showSchemaList = !!q || !['appearance', 'copilot', 'keybindings'].includes(section);

  const openJson = () => {
    setJsonText(JSON.stringify(settingsToJson(s), null, 2));
    setJsonStatus(null);
    setViewMode('json');
  };

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonText || '{}');
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('settings.json must be an object');
      actions.setEditorSettings(settingsFromJson(parsed));
      setJsonStatus({ ok: true, text: 'Applied' });
    } catch (err) {
      setJsonStatus({ ok: false, text: (err as Error).message });
    }
  };

  const themes = availableThemes(state.extensions);
  const shortcuts = SHORTCUTS.filter((k) =>
    `${k.command} ${k.keys} ${k.when ?? ''}`.toLowerCase().includes(shortcutFilter.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] text-xs font-mono select-none overflow-hidden">
      {/* Header */}
      <div className="h-11 border-b border-[#30363d] px-4 flex items-center justify-between flex-shrink-0 bg-[#161b22]">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#58a6ff]" />
          <span className="font-bold text-white text-sm">Settings</span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30">User</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => (viewMode === 'ui' ? openJson() : setViewMode('ui'))}
            title={viewMode === 'ui' ? 'Open Settings (JSON)' : 'Open Settings (UI)'}
            className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] flex items-center gap-1.5"
          >
            {viewMode === 'ui' ? <Code2 className="w-3.5 h-3.5" /> : <Sliders className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{viewMode === 'ui' ? 'Open settings.json' : 'Open Settings UI'}</span>
          </button>
          <button
            onClick={async () => {
              const choice = await actions.showDialog({
                severity: 'warning',
                message: 'Reset all settings to their defaults?',
                buttons: ['Reset All', 'Cancel'],
              });
              if (choice === 0) actions.resetEditorSettings();
            }}
            className="px-2 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-rose-400 border border-[#30363d] flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset All</span>
          </button>
          <button onClick={() => actions.setActiveNavTab('explorer')} title="Close Settings" className="p-1 rounded text-[#8b949e] hover:text-white hover:bg-[#30363d]">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewMode === 'json' ? (
        <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-[#8b949e]">
              settings.json: only values that differ from the defaults. Ctrl+S or Apply to save.
            </span>
            <div className="flex items-center gap-2">
              {jsonStatus && <span className={jsonStatus.ok ? 'text-emerald-400' : 'text-rose-400'}>{jsonStatus.text}</span>}
              <button onClick={applyJson} className="px-3 py-1 rounded bg-[#1f6feb] hover:bg-[#388bfd] text-white font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Apply
              </button>
            </div>
          </div>
          <textarea
            value={jsonText}
            spellCheck={false}
            onChange={(e) => {
              setJsonText(e.target.value);
              setJsonStatus(null);
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                e.stopPropagation();
                applyJson();
              }
            }}
            className="flex-1 w-full bg-[#161b22] border border-[#30363d] focus:border-[#58a6ff] rounded p-3 text-xs text-[#c9d1d9] leading-relaxed outline-none resize-none select-text"
          />
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="px-4 py-2 border-b border-[#30363d] flex items-center gap-2 flex-shrink-0">
            <div className="flex-1 relative">
              <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search settings (type @modified to see changed settings)"
                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] rounded pl-8 pr-2 py-1.5 text-xs text-white outline-none placeholder-[#8b949e]"
              />
            </div>
            <button
              onClick={() => setQuery(onlyModified ? '' : '@modified ')}
              className={`px-2 py-1 rounded border text-[11px] ${
                onlyModified ? 'bg-[#1f6feb]/30 border-[#58a6ff] text-white' : 'border-[#30363d] text-[#8b949e] hover:text-white'
              }`}
            >
              {modifiedCount} modified
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Category rail */}
            <div className="w-48 border-r border-[#30363d] py-2 overflow-y-auto flex-shrink-0 hidden sm:block">
              {NAV.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setSection(n.id);
                    setQuery('');
                  }}
                  className={`w-full text-left px-4 py-1 text-xs ${
                    section === n.id && !q ? 'text-white font-semibold bg-[#21262d]' : 'text-[#8b949e] hover:text-white'
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="max-w-3xl space-y-5">
                {showSchemaList &&
                  (visible.length === 0 ? (
                    <div className="text-[#8b949e] p-6 text-center">No settings found.</div>
                  ) : (
                    Object.entries(grouped).map(([group, defs]) => (
                      <div key={group}>
                        <h3 className="text-sm font-bold text-white mb-1">{group}</h3>
                        {defs.map((d) => (
                          <SettingRow
                            key={d.key}
                            def={d}
                            value={s[d.key]}
                            onChange={(v) => set(d.key, v)}
                            onReset={() => set(d.key, DEFAULT_EDITOR_SETTINGS[d.key])}
                          />
                        ))}
                      </div>
                    ))
                  ))}

                {!q && section === 'appearance' && (
                  <>
                    <div>
                      <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                        <Palette className="w-4 h-4 text-[#58a6ff]" /> Color Theme
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {themes.map((id) => {
                          const p = THEME_PALETTES[id];
                          if (!p) return null;
                          const active = state.theme === id;
                          return (
                            <button
                              key={id}
                              onClick={() => actions.setTheme(id)}
                              className={`p-2.5 rounded border text-left ${
                                active ? 'border-[#58a6ff] bg-[#21262d]' : 'border-[#30363d] hover:bg-[#21262d]/60'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-white">{p.name}</span>
                                {active && <Check className="w-3.5 h-3.5 text-[#58a6ff]" />}
                              </div>
                              <div className="flex gap-1 mt-2">
                                {[p.bgMain, p.accent, p.syntaxKeyword, p.syntaxString, p.syntaxType].map((c, i) => (
                                  <span key={i} className="w-4 h-4 rounded-sm border border-black/30" style={{ backgroundColor: c }} />
                                ))}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => {
                          actions.setExtensionSearchQuery('theme');
                          actions.setActiveNavTab('extensions');
                        }}
                        className="mt-2 text-[11px] text-[#58a6ff] hover:underline flex items-center gap-1"
                      >
                        <Blocks className="w-3 h-3" /> Browse more color themes in Extensions
                      </button>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white mb-2">Window: Zoom Level</h3>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="70"
                          max="160"
                          step="10"
                          value={state.zoomLevel}
                          onChange={(e) => actions.setZoomLevel(parseInt(e.target.value, 10))}
                          className="w-64 accent-[#58a6ff]"
                        />
                        <span className="text-white w-12">{state.zoomLevel}%</span>
                        <button onClick={actions.resetZoom} className="text-[11px] text-[#58a6ff] hover:underline">
                          Reset
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {!q && section === 'copilot' && (
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-purple-400" /> AI Copilot: Model
                    </h3>
                    <p className="text-[11px] text-[#8b949e] mb-2">
                      The assistant currently returns simulated replies; the model choice is saved for when a provider is connected.
                    </p>
                    <select value={state.activeAiModel} onChange={(e) => actions.setAiModel(e.target.value as AiModelId)} className={`${inputCls} min-w-[240px]`}>
                      {AI_MODELS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!q && section === 'keybindings' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Keyboard className="w-4 h-4 text-[#58a6ff]" /> Keyboard Shortcuts
                      </h3>
                      <input
                        type="text"
                        value={shortcutFilter}
                        onChange={(e) => setShortcutFilter(e.target.value)}
                        placeholder="Search keybindings"
                        className={`${inputCls} w-56`}
                      />
                    </div>
                    <table className="w-full text-left text-xs border border-[#30363d]">
                      <thead className="bg-[#161b22] text-[#8b949e]">
                        <tr>
                          <th className="px-3 py-1.5 font-semibold">Command</th>
                          <th className="px-3 py-1.5 font-semibold">Keybinding</th>
                          <th className="px-3 py-1.5 font-semibold hidden sm:table-cell">When</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#21262d]">
                        {shortcuts.map((k) => (
                          <tr key={k.command + k.keys} className="hover:bg-[#161b22]/60">
                            <td className="px-3 py-1.5 text-white">{k.command}</td>
                            <td className="px-3 py-1.5">
                              <kbd className="px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[#c9d1d9] text-[11px]">
                                {formatShortcut(k.keys)}
                              </kbd>
                            </td>
                            <td className="px-3 py-1.5 text-[#8b949e] hidden sm:table-cell">{k.when === 'editor' ? 'editorTextFocus' : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
