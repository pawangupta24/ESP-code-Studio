// Lets menus, palette, search and problems drive the live Monaco editors (one per editor
// group) without threading refs through the component tree.

const editors = new Map<any, string>(); // editor -> file it currently shows
let focusedEditor: any = null; // last editor that had focus (menus act on it)
let pendingReveal: { path: string; line: number; col: number } | null = null;

const pathOf = (editor: any) => editors.get(editor);

function reveal(editor: any, line: number, col: number) {
  editor.setPosition({ lineNumber: line, column: col });
  editor.revealLineInCenter(line);
  editor.focus();
}

/** Editor showing `path`, preferring the focused one (a file may be open in both groups). */
function editorFor(path: string): any {
  if (focusedEditor && pathOf(focusedEditor) === path) return focusedEditor;
  for (const [editor, p] of editors) if (p === path) return editor;
  return null;
}

/** Called by every MonacoEditor whenever its file changes. Applies a pending reveal. */
export function setEditorPath(editor: any, path: string) {
  editors.set(editor, path);
  if (pendingReveal && pendingReveal.path === path) {
    const { line, col } = pendingReveal;
    pendingReveal = null;
    reveal(editor, line, col);
  }
}

export function setFocusedEditor(editor: any) {
  focusedEditor = editor;
}

export function releaseEditor(editor: any) {
  editors.delete(editor);
  if (focusedEditor === editor) focusedEditor = null;
}

/** Run a built-in Monaco action/command (e.g. 'actions.find', 'undo') in the focused editor. */
export function runEditorAction(actionId: string) {
  const editor = focusedEditor && editors.has(focusedEditor) ? focusedEditor : editors.keys().next().value;
  if (!editor) return;
  editor.focus();
  editor.trigger('menu', actionId, null);
}

/**
 * Run Monaco's formatter on `path` if it is open in an editor and its language has one
 * (JSON, JS/TS, HTML, CSS, ...). Resolves true when formatting ran.
 */
export async function formatDocumentIn(path: string): Promise<boolean> {
  const action = editorFor(path)?.getAction('editor.action.formatDocument');
  // isSupported() is false unless a formatting provider is registered for the model's language
  if (!action || !action.isSupported()) return false;
  try {
    await action.run();
    return true;
  } catch {
    return false;
  }
}

/** Switch the line endings of an open file (LF / CRLF); the content change flows back to the store. */
export function setEndOfLine(path: string, crlf: boolean) {
  const monaco = (window as any).monaco;
  const model = monaco?.editor.getModel(monaco.Uri.file('/' + path));
  model?.pushEOL(crlf ? monaco.editor.EndOfLineSequence.CRLF : monaco.editor.EndOfLineSequence.LF);
}

/** Jump to a line. Applied immediately if the file is showing, else once an editor opens it. */
export function requestReveal(path: string, line: number, col = 1) {
  const editor = editorFor(path);
  if (editor) reveal(editor, line, col);
  else pendingReveal = { path, line, col };
}
