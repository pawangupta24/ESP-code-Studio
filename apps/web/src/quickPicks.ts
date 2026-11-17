// VS Code-style pickers shared by the menus, command palette and status bar.
import type { WorkspaceState, useWorkspaceStore } from './stores/useWorkspaceStore';
import { allLanguages, detectLanguage, languageName } from './languages';
import { availableThemes } from './extensionsCatalog';
import { THEME_PALETTES } from './themeTokens';

type Actions = ReturnType<typeof useWorkspaceStore>[1];

export function pickLanguageMode(state: WorkspaceState, actions: Actions) {
  const path = state.activeFilePath;
  if (!path) return;
  const auto = detectLanguage(path);
  const current = detectLanguage(path, state.languageOverrides[path]);
  actions.showQuickPick({
    placeholder: 'Select Language Mode',
    items: [
      { id: '__auto__', label: 'Auto Detect', detail: `${languageName(auto)} (from file extension)`, current: !state.languageOverrides[path] },
      ...allLanguages().map((l) => ({
        id: l.id,
        label: l.name,
        detail: `(${l.id})${l.extensions.length ? '  ' + l.extensions.slice(0, 4).join(' ') : ''}`,
        current: !!state.languageOverrides[path] && l.id === current,
      })),
    ],
    onPick: (id) => actions.setLanguageOverride(path, id === '__auto__' ? null : id),
  });
}

export function pickColorTheme(state: WorkspaceState, actions: Actions) {
  actions.showQuickPick({
    placeholder: 'Select Color Theme (install more from Extensions)',
    items: [
      ...availableThemes(state.extensions).map((id) => ({
        id,
        label: THEME_PALETTES[id]?.name ?? id,
        current: id === state.theme,
      })),
      { id: '__browse__', label: 'Browse Additional Color Themes...', detail: 'Extensions' },
    ],
    onPick: (id) => {
      if (id === '__browse__') {
        actions.setExtensionSearchQuery('theme');
        actions.setActiveNavTab('extensions');
      } else {
        actions.setTheme(id);
      }
    },
  });
}

export function pickNewFileLanguage(actions: Actions) {
  const common = ['plaintext', 'python', 'cpp', 'c', 'javascript', 'typescript', 'json', 'markdown', 'html', 'css', 'rust', 'go', 'java', 'shell', 'yaml'];
  const langs = allLanguages();
  const first = common.flatMap((id) => langs.filter((l) => l.id === id));
  const rest = langs.filter((l) => !common.includes(l.id));
  actions.showQuickPick({
    placeholder: 'Select a language for the new file',
    items: [...first, ...rest].map((l) => ({ id: l.id, label: l.name, detail: l.extensions[0] })),
    onPick: (id) => actions.newUntitledFile(id),
  });
}

export function pickTabSize(state: WorkspaceState, actions: Actions) {
  actions.showQuickPick({
    placeholder: 'Select Tab Size',
    items: [1, 2, 3, 4, 6, 8].map((n) => ({ id: String(n), label: `Indent Using Spaces: ${n}`, current: state.editorSettings.tabSize === n })),
    onPick: (id) => actions.setEditorSettings({ tabSize: Number(id), insertSpaces: true, detectIndentation: false }),
  });
}
