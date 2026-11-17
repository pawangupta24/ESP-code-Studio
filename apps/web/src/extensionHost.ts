// Applies what enabled extensions contribute to the live Monaco instance.
import type { ExtensionItem } from './extensionsCatalog';
import { extractSymbols, SYMBOL_LANGUAGES, DocSymbol } from './symbols';

let symbolsRegistered = false;

/**
 * Document symbols for languages Monaco has no provider for. Powers Go to Symbol
 * (Ctrl+Shift+O), sticky scroll and outline-based folding in the editor. Registered once.
 */
export function registerSymbolProviders() {
  const monaco = (window as any).monaco;
  if (!monaco || symbolsRegistered) return;
  symbolsRegistered = true;
  const K = monaco.languages.SymbolKind;
  const kinds: Record<DocSymbol['kind'], number> = {
    function: K.Function, method: K.Method, class: K.Class, struct: K.Struct, enum: K.Enum,
    interface: K.Interface, namespace: K.Namespace, module: K.Module, heading: K.String, section: K.Namespace,
  };
  const toMonaco = (s: DocSymbol, model: any): any => ({
    name: s.name,
    detail: '',
    kind: kinds[s.kind],
    tags: [],
    range: {
      startLineNumber: s.line,
      startColumn: 1,
      endLineNumber: Math.min(s.endLine, model.getLineCount()),
      endColumn: model.getLineMaxColumn(Math.min(s.endLine, model.getLineCount())),
    },
    selectionRange: { startLineNumber: s.line, startColumn: 1, endLineNumber: s.line, endColumn: model.getLineMaxColumn(s.line) },
    children: s.children.map((c) => toMonaco(c, model)),
  });
  for (const lang of SYMBOL_LANGUAGES) {
    monaco.languages.registerDocumentSymbolProvider(lang, {
      provideDocumentSymbols: (model: any) => extractSymbols(model.getValue(), lang).map((s) => toMonaco(s, model)),
    });
  }
}

let registered: { dispose(): void }[] = [];
let lastKey = '';

/** Register snippet completion providers for every installed + enabled extension. Idempotent. */
export function syncExtensionContributions(extensions: ExtensionItem[]) {
  const monaco = (window as any).monaco;
  if (!monaco) return;

  const active = extensions.filter((e) => e.installed && e.enabled && e.contributes?.snippets);
  const key = active.map((e) => e.id).join(',');
  if (key === lastKey) return;
  lastKey = key;

  registered.forEach((d) => d.dispose());
  registered = [];

  for (const ext of active) {
    for (const group of ext.contributes!.snippets!) {
      registered.push(
        monaco.languages.registerCompletionItemProvider(group.language, {
          provideCompletionItems(model: any, position: any) {
            const word = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn,
            };
            return {
              suggestions: group.items.map((s) => ({
                label: s.prefix,
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: s.body,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: `${s.description} — ${ext.displayName}`,
                documentation: { value: '```\n' + s.body.replace(/\$\{\d+(?::([^}]*))?\}|\$\d/g, '$1') + '\n```' },
                range,
              })),
            };
          },
        })
      );
    }
  }
}
