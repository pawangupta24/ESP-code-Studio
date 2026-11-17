// "files to include / exclude" matching for Find in Files, VS Code style:
//   *.cpp            any .cpp file in any folder
//   src              anything under a folder named src
//   src/**/*.h       .h files under src
//   *.md, docs       comma separated: matches if any pattern matches

function globToRegExp(glob: string): RegExp {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      // "**/" matches zero or more folders, "**" anything
      const slash = glob[i + 2] === '/';
      re += slash ? '(?:.*/)?' : '.*';
      i += slash ? 2 : 1;
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`, 'i');
}

/** Compile a comma separated pattern list into a predicate. Empty input returns null (no filter). */
export function compileGlobs(patterns: string): ((path: string) => boolean) | null {
  const parts = patterns
    .split(',')
    .map((p) => p.trim().replace(/^\.\//, '').replace(/\/+$/, ''))
    .filter(Boolean);
  if (parts.length === 0) return null;
  const regexes = parts.map((p) => {
    // A pattern without "/" matches at any depth; a name also matches a folder of that name
    const anyDepth = p.includes('/') ? p : `**/${p}`;
    return [globToRegExp(anyDepth), globToRegExp(`${anyDepth}/**`)];
  });
  return (path: string) => regexes.some(([file, folder]) => file.test(path) || folder.test(path));
}
