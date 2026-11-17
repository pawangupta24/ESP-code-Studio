// Lightweight document symbols (functions, classes, headings...) found with regexes.
// Monaco only ships symbol providers for JS/TS/JSON/CSS/HTML; this fills the gap for the
// rest so the Outline view, breadcrumbs, Go to Symbol (Ctrl+Shift+O) and sticky scroll work.
// ponytail: regex, not a parser. Misses unusual formatting (e.g. a function signature split
// over several lines); swap in a language server when that matters.

export type SymbolKind = 'function' | 'method' | 'class' | 'struct' | 'enum' | 'interface' | 'namespace' | 'module' | 'heading' | 'section';

export interface DocSymbol {
  name: string;
  kind: SymbolKind;
  line: number; // 1-based
  endLine: number;
  depth: number;
  children: DocSymbol[];
}

type Rule = { re: RegExp; kind: SymbolKind; name: number };

const C_KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'return', 'else', 'catch', 'sizeof', 'do', 'new', 'delete', 'case', 'throw']);

// A C/C++/Java/C#/Dart function definition: type tokens, a name, "(...)" and optionally "{"
const C_FUNCTION = /^\s*(?:[\w:<>,*&\[\]~]+[\s*&]+)+([A-Za-z_~][\w:~]*)\s*\([^;]*\)\s*(?:const\s*)?(?:override\s*)?(?:noexcept\s*)?(?:->\s*[\w:<>*&]+\s*)?(?:\{.*)?$/;

// Type declarations shared by the brace languages; group 1 is the keyword, group 2 the name
const TYPE_DECL = /^\s*(?:export\s+|public\s+|private\s+|protected\s+|internal\s+|abstract\s+|static\s+|final\s+|sealed\s+|partial\s+|typedef\s+|data\s+|open\s+)*(class|struct|enum|interface|namespace|record|object|trait)\s+([A-Za-z_]\w*)/;
const TYPE_KIND: Record<string, SymbolKind> = { struct: 'struct', enum: 'enum', interface: 'interface', namespace: 'namespace', trait: 'interface' };

const RULES: Record<string, Rule[]> = {
  python: [
    { re: /^\s*class\s+([A-Za-z_]\w*)/, kind: 'class', name: 1 },
    { re: /^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)/, kind: 'function', name: 1 },
  ],
  go: [
    { re: /^\s*type\s+([A-Za-z_]\w*)\s+(?:struct|interface)/, kind: 'struct', name: 1 },
    { re: /^func\s+(?:\([^)]*\)\s*)?([A-Za-z_]\w*)/, kind: 'function', name: 1 },
  ],
  rust: [
    { re: /^\s*(?:pub(?:\([^)]*\))?\s+)?(?:struct|enum|trait|union)\s+([A-Za-z_]\w*)/, kind: 'struct', name: 1 },
    { re: /^\s*impl(?:<[^>]*>)?\s+(?:[\w:<>]+\s+for\s+)?([\w:<>]+)/, kind: 'namespace', name: 1 },
    { re: /^\s*(?:pub(?:\([^)]*\))?\s+)?(?:const\s+)?(?:async\s+)?(?:unsafe\s+)?(?:extern\s+"[^"]*"\s+)?fn\s+([A-Za-z_]\w*)/, kind: 'function', name: 1 },
    { re: /^\s*(?:pub\s+)?mod\s+([A-Za-z_]\w*)/, kind: 'module', name: 1 },
  ],
  javascript: [
    { re: /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/, kind: 'function', name: 1 },
    { re: /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/, kind: 'function', name: 1 },
  ],
  kotlin: [{ re: /^\s*(?:\w+\s+)*fun\s+(?:<[^>]*>\s*)?(?:[\w.]+\.)?([A-Za-z_]\w*)/, kind: 'function', name: 1 }],
  php: [{ re: /^\s*(?:\w+\s+)*function\s+&?([A-Za-z_]\w*)/, kind: 'function', name: 1 }],
  swift: [{ re: /^\s*(?:\w+\s+)*func\s+([A-Za-z_]\w*)/, kind: 'function', name: 1 }],
  ruby: [
    { re: /^\s*(?:class|module)\s+([A-Z][\w:]*)/, kind: 'class', name: 1 },
    { re: /^\s*def\s+(?:self\.)?([\w?!=]+)/, kind: 'function', name: 1 },
  ],
  lua: [{ re: /^\s*(?:local\s+)?function\s+([\w.:]+)/, kind: 'function', name: 1 }],
  shell: [{ re: /^\s*(?:function\s+)?([A-Za-z_][\w-]*)\s*\(\)\s*\{?/, kind: 'function', name: 1 }],
  powershell: [{ re: /^\s*function\s+([\w-]+)/i, kind: 'function', name: 1 }],
  ini: [{ re: /^\s*\[([^\]]+)\]/, kind: 'section', name: 1 }],
  yaml: [{ re: /^([A-Za-z_][\w-]*)\s*:/, kind: 'section', name: 1 }],
};
RULES.typescript = RULES.javascript;
RULES.scala = RULES.kotlin;

const BRACE_LANGS = new Set(['c', 'cpp', 'java', 'csharp', 'dart', 'go', 'rust', 'javascript', 'typescript', 'kotlin', 'php', 'swift', 'scala', 'shell', 'powershell']);
const C_LIKE = new Set(['c', 'cpp', 'java', 'csharp', 'dart']);
const HAS_TYPE_DECL = new Set([...C_LIKE, 'javascript', 'typescript', 'kotlin', 'php', 'swift', 'scala']);

/** Languages Monaco has no symbol provider for, which we serve with extractSymbols. */
export const SYMBOL_LANGUAGES = ['c', 'cpp', 'java', 'csharp', 'dart', 'python', 'go', 'rust', 'kotlin', 'php', 'swift', 'scala', 'ruby', 'lua', 'shell', 'powershell', 'ini', 'yaml', 'markdown'];

/** Line where the brace block opened on `start` (or the line after) closes. */
function braceEnd(lines: string[], start: number): number {
  let depth = 0;
  let opened = false;
  for (let i = start; i < lines.length && i < start + 5000; i++) {
    const code = lines[i].replace(/\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '');
    for (const ch of code) {
      if (ch === '{') {
        depth++;
        opened = true;
      } else if (ch === '}') depth--;
    }
    if (opened && depth <= 0) return i;
    // No body on this line or the next one (e.g. a prototype): single-line symbol
    if (!opened && i > start) return start;
  }
  return start;
}

/** Last line of an indentation block (Python), ignoring blank lines. */
function indentEnd(lines: string[], start: number): number {
  const indent = lines[start].search(/\S/);
  let end = start;
  for (let i = start + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    if (lines[i].search(/\S/) <= indent) break;
    end = i;
  }
  return end;
}

export function extractSymbols(text: string, languageId: string): DocSymbol[] {
  const lines = text.split(/\r?\n/);
  const flat: DocSymbol[] = [];
  const push = (name: string, kind: SymbolKind, i: number, end: number) =>
    flat.push({ name, kind, line: i + 1, endLine: end + 1, depth: 0, children: [] });

  if (languageId === 'markdown') {
    let inFence = false;
    const headings: { level: number; i: number; name: string }[] = [];
    lines.forEach((l, i) => {
      if (/^\s*```/.test(l)) inFence = !inFence;
      const m = !inFence && /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(l);
      if (m) headings.push({ level: m[1].length, i, name: m[2] });
    });
    headings.forEach((h, k) => {
      const next = headings.slice(k + 1).find((o) => o.level <= h.level);
      push(h.name, 'heading', h.i, next ? next.i - 1 : lines.length - 1);
    });
    return nest(flat);
  }

  const rules = RULES[languageId] ?? [];
  if (!rules.length && !C_LIKE.has(languageId)) return [];
  const braces = BRACE_LANGS.has(languageId);
  const endOf = (i: number) => (languageId === 'python' ? indentEnd(lines, i) : braces ? braceEnd(lines, i) : i);

  let inBlockComment = false;
  lines.forEach((line, i) => {
    if (braces) {
      // Skip /* ... */ comments, line comments and preprocessor lines
      if (inBlockComment) {
        if (line.includes('*/')) inBlockComment = false;
        return;
      }
      if (/^\s*\/\*/.test(line) && !line.includes('*/')) {
        inBlockComment = true;
        return;
      }
      if (/^\s*(\/\/|\*|#\s*(define|include|if|ifdef|ifndef|endif|else|pragma))/.test(line)) return;
    }

    if (HAS_TYPE_DECL.has(languageId)) {
      const t = TYPE_DECL.exec(line);
      if (t) return push(t[2], TYPE_KIND[t[1]] ?? 'class', i, endOf(i));
    }

    for (const rule of rules) {
      const m = rule.re.exec(line);
      if (m) return push(m[rule.name], rule.kind, i, endOf(i));
    }

    if (C_LIKE.has(languageId)) {
      const m = C_FUNCTION.exec(line);
      if (m && !C_KEYWORDS.has(m[1]) && !/^\s*(return|else|case)\b/.test(line)) {
        const end = braceEnd(lines, i);
        if (end > i || line.includes('{')) push(m[1], m[1].includes('::') ? 'method' : 'function', i, end);
      }
    }
  });

  // Ruby/Lua/INI/YAML blocks have no braces; each symbol runs until the next one
  if (!braces && languageId !== 'python') {
    flat.forEach((s, k) => (s.endLine = flat[k + 1] ? flat[k + 1].line - 1 : lines.length));
  }
  return nest(flat);
}

/** Turn a flat, line-ordered list into a tree using line ranges; sets depth. */
function nest(flat: DocSymbol[]): DocSymbol[] {
  const roots: DocSymbol[] = [];
  const stack: DocSymbol[] = [];
  for (const s of flat) {
    while (stack.length && s.line > stack[stack.length - 1].endLine) stack.pop();
    s.depth = stack.length;
    const parent = stack[stack.length - 1];
    if (parent) {
      if (s.kind === 'function' && ['class', 'struct', 'interface', 'namespace'].includes(parent.kind)) s.kind = 'method';
      parent.children.push(s);
    } else roots.push(s);
    stack.push(s);
  }
  return roots;
}

/** Depth-first list of all symbols. */
export function flattenSymbols(symbols: DocSymbol[]): DocSymbol[] {
  return symbols.flatMap((s) => [s, ...flattenSymbols(s.children)]);
}

/** Outermost-first chain of symbols containing `line` (for breadcrumbs). */
export function symbolPathAt(symbols: DocSymbol[], line: number): DocSymbol[] {
  const hit = symbols.find((s) => line >= s.line && line <= s.endLine);
  return hit ? [hit, ...symbolPathAt(hit.children, line)] : [];
}
