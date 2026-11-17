// Applies what enabled extensions contribute to the live Monaco instance.
import type { ExtensionItem } from './extensionsCatalog';

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
