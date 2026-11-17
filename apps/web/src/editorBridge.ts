// Lets menus, palette, search and problems drive the live Monaco editor
// without threading refs through the component tree.

let primaryEditor: any = null;
let primaryPath = '';
let focusedEditor: any = null;
let pendingReveal: { path: string; line: number; col: number } | null = null;

function reveal(editor: any, line: number, col: number) {
  editor.setPosition({ lineNumber: line, column: col });
  editor.revealLineInCenter(line);
  editor.focus();
}

/** Called by the primary MonacoEditor whenever its file changes. */
export function setPrimaryEditor(editor: any, path: string) {
  primaryEditor = editor;
  primaryPath = path;
  if (pendingReveal && pendingReveal.path === path) {
    reveal(editor, pendingReveal.line, pendingReveal.col);
    pendingReveal = null;
  }
}

export function setFocusedEditor(editor: any) {
  focusedEditor = editor;
}

export function releaseEditor(editor: any) {
  if (primaryEditor === editor) {
    primaryEditor = null;
    primaryPath = '';
  }
  if (focusedEditor === editor) focusedEditor = null;
}

/** Run a built-in Monaco action/command (e.g. 'actions.find', 'undo'). */
export function runEditorAction(actionId: string) {
  const editor = focusedEditor || primaryEditor;
  if (!editor) return;
  editor.focus();
  editor.trigger('menu', actionId, null);
}

/**
 * Run Monaco's formatter on `path` if it is open in an editor and its language has one
 * (JSON, JS/TS, HTML, CSS, ...). Resolves true when formatting ran.
 */
export async function formatDocumentIn(path: string): Promise<boolean> {
  const editor = [focusedEditor, primaryEditor].find((e) => e?.getModel()?.uri.path === '/' + path);
  const action = editor?.getAction('editor.action.formatDocument');
  // isSupported() is false unless a formatting provider is registered for the model's language
  if (!action || !action.isSupported()) return false;
  try {
    await action.run();
    return true;
  } catch {
    return false;
  }
}

/** Jump to a line. Applied immediately if the file is showing, else once it opens. */
export function requestReveal(path: string, line: number, col = 1) {
  if (primaryEditor && primaryPath === path) {
    reveal(primaryEditor, line, col);
  } else {
    pendingReveal = { path, line, col };
  }
}
