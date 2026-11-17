// Self-check for the pure logic modules. Run with: node apps/web/scripts/check-logic.ts
// (Node 22.6+ runs TypeScript directly.) Exits non-zero on the first failed assertion.
import assert from 'node:assert/strict';
import { compileGlobs } from '../src/utils/glob.ts';
import { extractSymbols, flattenSymbols, symbolPathAt } from '../src/symbols.ts';

// ---- glob ----
const g = (p: string) => compileGlobs(p)!;
assert.equal(compileGlobs('  '), null);
assert.ok(g('*.cpp')('src/main.cpp'));
assert.ok(g('*.cpp')('main.cpp'));
assert.ok(!g('*.cpp')('src/main.c'));
assert.ok(g('src')('src/main.cpp'), 'folder name matches contents');
assert.ok(g('src')('lib/src/x.h'), 'folder at any depth');
assert.ok(!g('src')('srcs/x.h'));
assert.ok(g('src/**/*.h')('src/a/b/x.h'));
assert.ok(g('src/**/*.h')('src/x.h'));
assert.ok(!g('src/**/*.h')('include/x.h'));
assert.ok(g('*.md, include')('include/sensor.h'));
assert.ok(g('*.MD')('README.md'), 'case-insensitive');

// ---- symbols: C++ ----
const cpp = `#include <Arduino.h>
// void notAFunction() {}
class Sensor {
public:
  void begin() {
    if (x) { y(); }
  }
};

void setup() {
  Serial.begin(115200);
}

int readValue(int pin);

void loop() {
  delay(10);
}`;
const cppSyms = extractSymbols(cpp, 'cpp');
assert.deepEqual(cppSyms.map((s) => s.name), ['Sensor', 'setup', 'loop'], 'prototypes, comments and if() are not symbols');
assert.deepEqual(cppSyms[0].children.map((s) => [s.name, s.kind]), [['begin', 'method']]);
assert.equal(cppSyms[1].line, 10);
assert.equal(cppSyms[1].endLine, 12);
assert.deepEqual(symbolPathAt(cppSyms, 6).map((s) => s.name), ['Sensor', 'begin']);

// ---- symbols: Python ----
const py = `import os

class Motor:
    def __init__(self):
        self.speed = 0

    async def run(self):
        pass

def main():
    m = Motor()
`;
const pySyms = extractSymbols(py, 'python');
assert.deepEqual(flattenSymbols(pySyms).map((s) => `${s.depth}:${s.name}:${s.kind}`), ['0:Motor:class', '1:__init__:method', '1:run:method', '0:main:function']);
assert.equal(pySyms[0].endLine, 8);

// ---- symbols: Markdown ----
const md = '# Title\ntext\n## A\n```\n# not a heading\n```\n## B\n# Next';
assert.deepEqual(flattenSymbols(extractSymbols(md, 'markdown')).map((s) => `${s.depth}:${s.name}`), ['0:Title', '1:A', '1:B', '0:Next']);

// ---- symbols: Go / Rust ----
assert.deepEqual(extractSymbols('type Server struct {\n}\n\nfunc (s *Server) Start() error {\n\treturn nil\n}\n', 'go').map((s) => s.name), ['Server', 'Start']);
assert.deepEqual(flattenSymbols(extractSymbols('pub struct A {}\nimpl A {\n    pub fn new() -> Self {\n        A {}\n    }\n}\n', 'rust')).map((s) => s.name), ['A', 'A', 'new']);

console.log('check-logic: all assertions passed');
