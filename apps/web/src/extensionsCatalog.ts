// Built-in extension catalogue. Installing + enabling an extension really changes the editor:
// - `snippets` are registered as Monaco completion items (type the prefix, pick from IntelliSense)
// - `themes` become selectable color themes (Settings / Ctrl+K Ctrl+T)
// Syntax highlighting itself is always on: Monaco ships grammars for ~80 languages.

export interface Snippet {
  prefix: string;
  body: string; // Monaco snippet syntax: $1, ${1:placeholder}, $0
  description: string;
}

export interface ExtensionItem {
  id: string;
  name: string;
  displayName: string;
  publisher: string;
  version: string;
  description: string;
  icon: string;
  downloads: string;
  rating: number;
  category: 'Language' | 'Formatter' | 'Embedded Runtime' | 'Debugging' | 'Theme' | 'Snippets';
  fileExtensions: string[];
  installed: boolean;
  enabled: boolean;
  features: string[];
  sampleTemplate?: { filename: string; content: string };
  contributes?: {
    snippets?: { language: string; items: Snippet[] }[];
    themes?: string[];
  };
}

type CatalogEntry = Omit<ExtensionItem, 'installed' | 'enabled'> & { preinstalled?: boolean };

const ARDUINO_SNIPPETS: Snippet[] = [
  { prefix: 'setup', body: 'void setup() {\n\tSerial.begin(${1:115200});\n\t$0\n}', description: 'Arduino setup()' },
  { prefix: 'loop', body: 'void loop() {\n\t$0\n}', description: 'Arduino loop()' },
  { prefix: 'pinMode', body: 'pinMode(${1:pin}, ${2|OUTPUT,INPUT,INPUT_PULLUP|});', description: 'Configure a GPIO pin' },
  { prefix: 'digitalWrite', body: 'digitalWrite(${1:pin}, ${2|HIGH,LOW|});', description: 'Write a digital pin' },
  { prefix: 'serialprint', body: 'Serial.printf("${1:%d}\\n", ${2:value});', description: 'Serial.printf' },
  { prefix: 'millis', body: 'static uint32_t ${1:last} = 0;\nif (millis() - ${1:last} >= ${2:1000}) {\n\t${1:last} = millis();\n\t$0\n}', description: 'Non-blocking timer with millis()' },
  { prefix: 'xTaskCreate', body: 'xTaskCreatePinnedToCore(${1:taskFn}, "${2:Task}", ${3:4096}, NULL, ${4:1}, NULL, ${5:0});', description: 'FreeRTOS task pinned to a core' },
  { prefix: 'task', body: 'void ${1:taskFn}(void *pvParameters) {\n\tfor (;;) {\n\t\t$0\n\t\tvTaskDelay(pdMS_TO_TICKS(${2:100}));\n\t}\n}', description: 'FreeRTOS task function' },
  { prefix: 'wifi', body: '#include <WiFi.h>\n\nWiFi.begin("${1:ssid}", "${2:password}");\nwhile (WiFi.status() != WL_CONNECTED) {\n\tdelay(500);\n}\nSerial.println(WiFi.localIP());', description: 'Connect to Wi-Fi' },
];

const PYTHON_SNIPPETS: Snippet[] = [
  { prefix: 'def', body: 'def ${1:name}(${2:args}):\n\t"""${3:Docstring}"""\n\t${0:pass}', description: 'Function definition' },
  { prefix: 'class', body: 'class ${1:Name}:\n\tdef __init__(self${2:, args}):\n\t\t${0:pass}', description: 'Class definition' },
  { prefix: 'ifmain', body: 'if __name__ == "__main__":\n\t${0:main()}', description: 'Main guard' },
  { prefix: 'for', body: 'for ${1:item} in ${2:items}:\n\t${0:pass}', description: 'For loop' },
  { prefix: 'try', body: 'try:\n\t${1:pass}\nexcept ${2:Exception} as ${3:e}:\n\t${0:raise}', description: 'Try / except' },
  { prefix: 'with', body: 'with open(${1:"file.txt"}, ${2:"r"}) as ${3:f}:\n\t${0:data = f.read()}', description: 'With open(...)' },
  { prefix: 'lc', body: '[${1:x} for ${1:x} in ${2:items}${3: if ${4:cond}}]', description: 'List comprehension' },
  { prefix: 'dataclass', body: 'from dataclasses import dataclass\n\n@dataclass\nclass ${1:Name}:\n\t${2:field}: ${3:int}', description: 'Dataclass' },
  { prefix: 'async', body: 'async def ${1:name}(${2}):\n\t${0:await asyncio.sleep(0)}', description: 'Async function' },
];

const MICROPYTHON_SNIPPETS: Snippet[] = [
  { prefix: 'pin', body: 'from machine import Pin\n${1:led} = Pin(${2:48}, Pin.${3|OUT,IN|})', description: 'machine.Pin' },
  { prefix: 'adc', body: 'from machine import ADC, Pin\n${1:adc} = ADC(Pin(${2:1}))\n${1:adc}.atten(ADC.ATTN_11DB)\nvalue = ${1:adc}.read()', description: 'Read an analog pin' },
  { prefix: 'timer', body: 'from machine import Timer\nTimer(0).init(period=${1:1000}, mode=Timer.PERIODIC, callback=lambda t: ${0:print("tick")})', description: 'Periodic timer' },
  { prefix: 'wlan', body: 'import network\nwlan = network.WLAN(network.STA_IF)\nwlan.active(True)\nwlan.connect("${1:ssid}", "${2:password}")', description: 'Connect to Wi-Fi' },
];

const JS_SNIPPETS: Snippet[] = [
  { prefix: 'log', body: 'console.log($1);', description: 'console.log' },
  { prefix: 'af', body: '(${1:args}) => {\n\t$0\n}', description: 'Arrow function' },
  { prefix: 'imp', body: "import ${2:name} from '${1:module}';", description: 'Import' },
  { prefix: 'afn', body: 'async function ${1:name}(${2}) {\n\t$0\n}', description: 'Async function' },
  { prefix: 'trycatch', body: 'try {\n\t$1\n} catch (${2:err}) {\n\t$0\n}', description: 'Try / catch' },
  { prefix: 'rfc', body: 'export function ${1:Component}() {\n\treturn <div>$0</div>;\n}', description: 'React function component' },
];

const CATALOG: CatalogEntry[] = [
  // ---- Embedded ----
  {
    id: 'cpp-esp32', name: 'cpp-esp32', displayName: 'C/C++ & ESP-IDF IntelliSense Pro', publisher: 'Espressif Systems', version: 'v1.4.2',
    description: 'C/C++ snippets for Arduino-ESP32 and FreeRTOS: setup/loop, GPIO, Wi-Fi, tasks, non-blocking timers.',
    icon: '⚡', downloads: '380k', rating: 4.9, category: 'Language', fileExtensions: ['.cpp', '.c', '.hpp', '.h', '.ino'],
    features: ['Arduino & FreeRTOS snippets', 'Wi-Fi / GPIO templates', 'ESP32-S3 task helpers'],
    contributes: { snippets: [{ language: 'cpp', items: ARDUINO_SNIPPETS }, { language: 'c', items: ARDUINO_SNIPPETS }] },
    preinstalled: true,
  },
  {
    id: 'python', name: 'python', displayName: 'Python', publisher: 'Python Software', version: 'v2024.2.0',
    description: 'Python snippets and starter template: functions, classes, comprehensions, dataclasses, async.',
    icon: '🐍', downloads: '1.2M', rating: 4.8, category: 'Language', fileExtensions: ['.py', '.pyi'],
    features: ['Python 3 snippets', 'Main-guard and class templates', 'Works with MicroPython files too'],
    contributes: { snippets: [{ language: 'python', items: PYTHON_SNIPPETS }] },
    sampleTemplate: { filename: 'app.py', content: 'def main():\n    print("Hello from Python")\n\n\nif __name__ == "__main__":\n    main()\n' },
  },
  {
    id: 'micropython-esp32', name: 'micropython-esp32', displayName: 'MicroPython & CircuitPython for ESP32', publisher: 'MicroPython Org', version: 'v1.22.0',
    description: 'MicroPython snippets for ESP32-S3: machine.Pin, ADC, timers, Wi-Fi.',
    icon: '🔌', downloads: '194k', rating: 4.8, category: 'Embedded Runtime', fileExtensions: ['.py'],
    features: ['machine.Pin / ADC / Timer snippets', 'Wi-Fi station template', 'NeoPixel starter file'],
    contributes: { snippets: [{ language: 'python', items: MICROPYTHON_SNIPPETS }] },
    sampleTemplate: {
      filename: 'main.py',
      content: '# MicroPython on ESP32-S3\nimport machine\nimport time\nimport neopixel\n\nnp = neopixel.NeoPixel(machine.Pin(48), 1)\n\nwhile True:\n    np[0] = (0, 64, 128)\n    np.write()\n    time.sleep(0.5)\n    np[0] = (0, 0, 0)\n    np.write()\n    time.sleep(0.5)\n',
    },
  },
  {
    id: 'rust-esp32', name: 'rust-esp32', displayName: 'Rust for ESP32 (esp-rs & no_std)', publisher: 'Rust-ESP Community', version: 'v0.18.1',
    description: 'Rust snippets and a no_std esp-hal starter for Xtensa and RISC-V ESP32 targets.',
    icon: '🦀', downloads: '112k', rating: 4.9, category: 'Language', fileExtensions: ['.rs', '.toml'],
    features: ['fn / struct / impl / match snippets', 'esp-hal starter project'],
    contributes: {
      snippets: [{
        language: 'rust',
        items: [
          { prefix: 'fn', body: 'fn ${1:name}(${2}) -> ${3:()} {\n\t$0\n}', description: 'Function' },
          { prefix: 'struct', body: '#[derive(Debug)]\nstruct ${1:Name} {\n\t${2:field}: ${3:u32},\n}', description: 'Struct' },
          { prefix: 'impl', body: 'impl ${1:Type} {\n\t$0\n}', description: 'Impl block' },
          { prefix: 'match', body: 'match ${1:value} {\n\t${2:pattern} => $3,\n\t_ => $0,\n}', description: 'Match' },
          { prefix: 'test', body: '#[test]\nfn ${1:it_works}() {\n\t$0\n}', description: 'Unit test' },
        ],
      }],
    },
    sampleTemplate: { filename: 'src/main.rs', content: '#![no_std]\n#![no_main]\n\nuse esp_backtrace as _;\nuse esp_hal::{delay::Delay, prelude::*};\n\n#[entry]\nfn main() -> ! {\n    let delay = Delay::new();\n    loop {\n        delay.delay_millis(1000u32);\n    }\n}\n' },
  },
  {
    id: 'quickjs-esp32', name: 'quickjs-esp32', displayName: 'JavaScript & TypeScript Snippets', publisher: 'Moddable Open Source', version: 'v2.1.0',
    description: 'Modern JavaScript/TypeScript snippets: imports, arrow and async functions, try/catch, React components.',
    icon: '🟨', downloads: '640k', rating: 4.7, category: 'Snippets', fileExtensions: ['.js', '.mjs', '.ts', '.tsx', '.jsx'],
    features: ['ES2020 snippets', 'React function component', 'Works in JS and TS files'],
    contributes: { snippets: ['javascript', 'typescript'].map((language) => ({ language, items: JS_SNIPPETS })) },
  },
  {
    id: 'pio-ini-support', name: 'pio-ini-support', displayName: 'PlatformIO & INI Configuration Pack', publisher: 'PlatformIO', version: 'v3.0.1',
    description: 'Snippets for platformio.ini environments, build flags, monitor and upload options.',
    icon: '⚙️', downloads: '520k', rating: 4.9, category: 'Formatter', fileExtensions: ['.ini', '.cfg'],
    features: ['[env] section templates', 'Build flag and monitor snippets'],
    contributes: {
      snippets: [{
        language: 'ini',
        items: [
          { prefix: 'env', body: '[env:${1:esp32-s3-devkitc-1}]\nplatform = espressif32\nboard = ${1:esp32-s3-devkitc-1}\nframework = ${2|arduino,espidf|}\nmonitor_speed = ${3:115200}', description: 'PlatformIO environment' },
          { prefix: 'build_flags', body: 'build_flags =\n\t-D ${1:CORE_DEBUG_LEVEL=3}', description: 'Build flags' },
          { prefix: 'lib_deps', body: 'lib_deps =\n\t${1:adafruit/Adafruit NeoPixel}', description: 'Library dependencies' },
        ],
      }],
    },
    preinstalled: true,
  },
  {
    id: 'json-schema', name: 'json-schema', displayName: 'JSON Tools', publisher: 'ESP Studio Core', version: 'v1.2.0',
    description: 'JSON validation and formatting are built into the editor; this pack adds snippets for common structures.',
    icon: '📋', downloads: '290k', rating: 4.8, category: 'Formatter', fileExtensions: ['.json'],
    features: ['Format Document for JSON (Shift+Alt+F)', 'Object / array snippets'],
    contributes: {
      snippets: [{
        language: 'json',
        items: [
          { prefix: 'obj', body: '{\n\t"${1:key}": ${2:"value"}\n}', description: 'Object' },
          { prefix: 'arr', body: '[\n\t$0\n]', description: 'Array' },
        ],
      }],
    },
    preinstalled: true,
  },
  {
    id: 'markdown-docs', name: 'markdown-docs', displayName: 'Markdown All in One', publisher: 'Docs Team', version: 'v2.0.4',
    description: 'Markdown snippets for tables, code blocks, links and task lists, plus a README starter.',
    icon: '📝', downloads: '180k', rating: 4.7, category: 'Language', fileExtensions: ['.md'],
    features: ['Table, code block, link snippets', 'README starter'],
    contributes: {
      snippets: [{
        language: 'markdown',
        items: [
          { prefix: 'table', body: '| ${1:Column} | ${2:Column} |\n| --- | --- |\n| $3 | $4 |', description: 'Table' },
          { prefix: 'code', body: '```${1:cpp}\n$0\n```', description: 'Code block' },
          { prefix: 'link', body: '[${1:text}](${2:url})', description: 'Link' },
          { prefix: 'task', body: '- [ ] ${1:task}', description: 'Task list item' },
        ],
      }],
    },
    sampleTemplate: { filename: 'README.md', content: '# ESP32-S3 Firmware Project\n\n## Hardware Pinout\n- **GPIO 48**: WS2812 Status LED\n\n## Quick Start\n1. Build\n2. Flash\n' },
  },
  {
    id: 'xtensa-asm', name: 'xtensa-asm', displayName: 'Xtensa LX7 Assembly', publisher: 'Espressif Systems', version: 'v1.1.0',
    description: 'Assembly snippets for Xtensa function entry/return.',
    icon: '🔬', downloads: '45k', rating: 4.6, category: 'Debugging', fileExtensions: ['.S', '.asm'],
    features: ['entry / retw templates'],
    contributes: {
      snippets: [{
        language: 'mips',
        items: [{ prefix: 'func', body: '.global ${1:name}\n.type ${1:name}, @function\n${1:name}:\n\tentry a1, ${2:32}\n\t$0\n\tretw.n', description: 'Windowed ABI function' }],
      }],
    },
  },

  // ---- More languages ----
  {
    id: 'go', name: 'go', displayName: 'Go', publisher: 'Go Team', version: 'v0.41.0',
    description: 'Go snippets: func, struct, error handling, goroutines, tests.',
    icon: '🐹', downloads: '980k', rating: 4.7, category: 'Language', fileExtensions: ['.go'],
    features: ['func / struct snippets', 'if err != nil', 'Test function'],
    contributes: {
      snippets: [{
        language: 'go',
        items: [
          { prefix: 'func', body: 'func ${1:name}(${2}) ${3:error} {\n\t$0\n}', description: 'Function' },
          { prefix: 'iferr', body: 'if err != nil {\n\treturn ${1:err}\n}', description: 'Error check' },
          { prefix: 'st', body: 'type ${1:Name} struct {\n\t${2:Field} ${3:string}\n}', description: 'Struct' },
          { prefix: 'gofunc', body: 'go func() {\n\t$0\n}()', description: 'Goroutine' },
          { prefix: 'test', body: 'func Test${1:Name}(t *testing.T) {\n\t$0\n}', description: 'Test function' },
        ],
      }],
    },
    sampleTemplate: { filename: 'main.go', content: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello, world!")\n}\n' },
  },
  {
    id: 'java', name: 'java', displayName: 'Java Language Support', publisher: 'Java Tools', version: 'v1.28.0',
    description: 'Java snippets: main method, classes, records, loops.',
    icon: '☕', downloads: '870k', rating: 4.5, category: 'Language', fileExtensions: ['.java'],
    features: ['main / class / record snippets', 'sysout'],
    contributes: {
      snippets: [{
        language: 'java',
        items: [
          { prefix: 'main', body: 'public static void main(String[] args) {\n\t$0\n}', description: 'Main method' },
          { prefix: 'sysout', body: 'System.out.println($1);', description: 'Print line' },
          { prefix: 'class', body: 'public class ${1:Name} {\n\t$0\n}', description: 'Class' },
          { prefix: 'record', body: 'public record ${1:Name}(${2:String value}) {}', description: 'Record' },
          { prefix: 'fori', body: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t$0\n}', description: 'Indexed for loop' },
        ],
      }],
    },
  },
  {
    id: 'csharp', name: 'csharp', displayName: 'C#', publisher: '.NET Tools', version: 'v2.18.0',
    description: 'C# snippets: classes, properties, async methods, Console.WriteLine.',
    icon: '🟪', downloads: '760k', rating: 4.5, category: 'Language', fileExtensions: ['.cs'],
    features: ['class / prop / cw snippets', 'Async method template'],
    contributes: {
      snippets: [{
        language: 'csharp',
        items: [
          { prefix: 'cw', body: 'Console.WriteLine($1);', description: 'Console.WriteLine' },
          { prefix: 'prop', body: 'public ${1:int} ${2:Name} { get; set; }', description: 'Auto property' },
          { prefix: 'class', body: 'public class ${1:Name}\n{\n\t$0\n}', description: 'Class' },
          { prefix: 'async', body: 'public async Task ${1:RunAsync}()\n{\n\t$0\n}', description: 'Async method' },
        ],
      }],
    },
  },
  {
    id: 'php', name: 'php', displayName: 'PHP Snippets', publisher: 'PHP Tools', version: 'v1.10.0',
    description: 'PHP snippets for functions, classes and foreach loops.',
    icon: '🐘', downloads: '410k', rating: 4.6, category: 'Language', fileExtensions: ['.php'],
    features: ['function / class / foreach snippets'],
    contributes: {
      snippets: [{
        language: 'php',
        items: [
          { prefix: 'fn', body: 'function ${1:name}(${2}) {\n\t$0\n}', description: 'Function' },
          { prefix: 'class', body: 'class ${1:Name}\n{\n\tpublic function __construct()\n\t{\n\t\t$0\n\t}\n}', description: 'Class' },
          { prefix: 'foreach', body: 'foreach (\\$${1:items} as \\$${2:item}) {\n\t$0\n}', description: 'foreach' },
        ],
      }],
    },
  },
  {
    id: 'ruby', name: 'ruby', displayName: 'Ruby', publisher: 'Ruby Tools', version: 'v0.28.0',
    description: 'Ruby snippets for methods, classes and blocks.',
    icon: '💎', downloads: '220k', rating: 4.5, category: 'Language', fileExtensions: ['.rb'],
    features: ['def / class / each snippets'],
    contributes: {
      snippets: [{
        language: 'ruby',
        items: [
          { prefix: 'def', body: 'def ${1:name}(${2})\n\t$0\nend', description: 'Method' },
          { prefix: 'class', body: 'class ${1:Name}\n\tdef initialize(${2})\n\t\t$0\n\tend\nend', description: 'Class' },
          { prefix: 'each', body: '${1:items}.each do |${2:item}|\n\t$0\nend', description: 'each block' },
        ],
      }],
    },
  },
  {
    id: 'lua', name: 'lua', displayName: 'Lua', publisher: 'Lua Tools', version: 'v3.7.0',
    description: 'Lua snippets for functions, tables and loops (handy for NodeMCU firmware).',
    icon: '🌙', downloads: '150k', rating: 4.6, category: 'Language', fileExtensions: ['.lua'],
    features: ['function / for / pairs snippets'],
    contributes: {
      snippets: [{
        language: 'lua',
        items: [
          { prefix: 'fn', body: 'local function ${1:name}(${2})\n\t$0\nend', description: 'Local function' },
          { prefix: 'for', body: 'for ${1:i} = ${2:1}, ${3:10} do\n\t$0\nend', description: 'Numeric for' },
          { prefix: 'pairs', body: 'for ${1:k}, ${2:v} in pairs(${3:t}) do\n\t$0\nend', description: 'Iterate a table' },
        ],
      }],
    },
  },
  {
    id: 'kotlin', name: 'kotlin', displayName: 'Kotlin', publisher: 'Kotlin Tools', version: 'v0.2.34',
    description: 'Kotlin snippets for functions, data classes and when expressions.',
    icon: '🟣', downloads: '130k', rating: 4.4, category: 'Language', fileExtensions: ['.kt', '.kts'],
    features: ['fun / data class / when snippets'],
    contributes: {
      snippets: [{
        language: 'kotlin',
        items: [
          { prefix: 'fun', body: 'fun ${1:name}(${2}): ${3:Unit} {\n\t$0\n}', description: 'Function' },
          { prefix: 'data', body: 'data class ${1:Name}(val ${2:value}: ${3:String})', description: 'Data class' },
          { prefix: 'when', body: 'when (${1:value}) {\n\t${2:else} -> $0\n}', description: 'when' },
        ],
      }],
    },
  },
  {
    id: 'dart', name: 'dart', displayName: 'Dart & Flutter', publisher: 'Dart Code', version: 'v3.82.0',
    description: 'Dart snippets and a Flutter StatelessWidget template.',
    icon: '🎯', downloads: '520k', rating: 4.8, category: 'Language', fileExtensions: ['.dart'],
    features: ['main snippet', 'Flutter widget template'],
    contributes: {
      snippets: [{
        language: 'dart',
        items: [
          { prefix: 'main', body: 'void main() {\n\t$0\n}', description: 'main' },
          { prefix: 'stless', body: 'class ${1:MyWidget} extends StatelessWidget {\n\tconst ${1:MyWidget}({super.key});\n\n\t@override\n\tWidget build(BuildContext context) {\n\t\treturn ${0:const Placeholder()};\n\t}\n}', description: 'Flutter StatelessWidget' },
        ],
      }],
    },
  },
  {
    id: 'sql', name: 'sql', displayName: 'SQL Tools', publisher: 'Database Tools', version: 'v0.28.1',
    description: 'SQL snippets for SELECT, INSERT, CREATE TABLE and JOINs.',
    icon: '🗄️', downloads: '340k', rating: 4.5, category: 'Language', fileExtensions: ['.sql'],
    features: ['select / insert / create table / join snippets'],
    contributes: {
      snippets: ['sql', 'mysql', 'pgsql'].map((language) => ({
        language,
        items: [
          { prefix: 'sel', body: 'SELECT ${1:*}\nFROM ${2:table}\nWHERE ${3:condition};', description: 'SELECT' },
          { prefix: 'ins', body: 'INSERT INTO ${1:table} (${2:columns})\nVALUES (${3:values});', description: 'INSERT' },
          { prefix: 'ct', body: 'CREATE TABLE ${1:name} (\n\tid INTEGER PRIMARY KEY,\n\t$0\n);', description: 'CREATE TABLE' },
          { prefix: 'join', body: 'JOIN ${1:other} ON ${2:a}.${3:id} = ${1:other}.${4:a_id}', description: 'JOIN' },
        ],
      })),
    },
  },
  {
    id: 'web', name: 'web', displayName: 'HTML & CSS Snippets', publisher: 'Web Tools', version: 'v1.0.6',
    description: 'HTML boilerplate and CSS layout snippets (flex, grid, media query). HTML/CSS formatting is built in.',
    icon: '🌐', downloads: '1.5M', rating: 4.7, category: 'Snippets', fileExtensions: ['.html', '.css', '.scss'],
    features: ['! HTML5 boilerplate', 'flex / grid / media query snippets'],
    contributes: {
      snippets: [
        { language: 'html', items: [{ prefix: '!', body: '<!DOCTYPE html>\n<html lang="en">\n<head>\n\t<meta charset="UTF-8">\n\t<meta name="viewport" content="width=device-width, initial-scale=1.0">\n\t<title>${1:Document}</title>\n</head>\n<body>\n\t$0\n</body>\n</html>', description: 'HTML5 boilerplate' }] },
        {
          language: 'css',
          items: [
            { prefix: 'flex', body: 'display: flex;\njustify-content: ${1:center};\nalign-items: ${2:center};', description: 'Flex container' },
            { prefix: 'grid', body: 'display: grid;\ngrid-template-columns: ${1:repeat(3, 1fr)};\ngap: ${2:1rem};', description: 'Grid container' },
            { prefix: 'media', body: '@media (max-width: ${1:768px}) {\n\t$0\n}', description: 'Media query' },
          ],
        },
      ],
    },
  },
  {
    id: 'docker', name: 'docker', displayName: 'Docker', publisher: 'Container Tools', version: 'v1.29.0',
    description: 'Dockerfile and docker-compose snippets.',
    icon: '🐳', downloads: '890k', rating: 4.6, category: 'Language', fileExtensions: ['Dockerfile', '.yml'],
    features: ['Dockerfile template', 'Compose service snippet'],
    contributes: {
      snippets: [
        { language: 'dockerfile', items: [{ prefix: 'from', body: 'FROM ${1:node:20-alpine}\nWORKDIR /app\nCOPY . .\nRUN ${2:npm ci}\nCMD [${3:"npm", "start"}]', description: 'Basic Dockerfile' }] },
        { language: 'yaml', items: [{ prefix: 'service', body: '${1:app}:\n  image: ${2:image}\n  ports:\n    - "${3:8080}:${4:80}"', description: 'Compose service' }] },
      ],
    },
  },
  {
    id: 'shell', name: 'shell', displayName: 'Shell & PowerShell Snippets', publisher: 'Shell Tools', version: 'v0.6.0',
    description: 'Bash and PowerShell snippets for scripts, loops and parameters.',
    icon: '🐚', downloads: '260k', rating: 4.5, category: 'Snippets', fileExtensions: ['.sh', '.ps1'],
    features: ['Bash header / for / if', 'PowerShell function with param'],
    contributes: {
      snippets: [
        {
          language: 'shell',
          items: [
            { prefix: 'bash', body: '#!/usr/bin/env bash\nset -euo pipefail\n\n$0', description: 'Bash script header' },
            { prefix: 'for', body: 'for ${1:f} in ${2:*}; do\n\t$0\ndone', description: 'For loop' },
            { prefix: 'if', body: 'if [[ ${1:condition} ]]; then\n\t$0\nfi', description: 'If' },
          ],
        },
        { language: 'powershell', items: [{ prefix: 'func', body: 'function ${1:Verb-Noun} {\n\tparam(\n\t\t[string]\\$${2:Name}\n\t)\n\t$0\n}', description: 'Function with param' }] },
      ],
    },
  },

  // ---- Color themes ----
  {
    id: 'theme-tokyo-night', name: 'tokyo-night', displayName: 'Tokyo Night Theme', publisher: 'enkia', version: 'v1.0.9',
    description: 'A clean dark theme that celebrates the lights of downtown Tokyo at night.',
    icon: '🌃', downloads: '2.1M', rating: 4.9, category: 'Theme', fileExtensions: [],
    features: ['Tokyo Night color theme'], contributes: { themes: ['tokyo-night'] },
  },
  {
    id: 'theme-catppuccin', name: 'catppuccin', displayName: 'Catppuccin Mocha', publisher: 'Catppuccin', version: 'v3.14.0',
    description: 'Soothing pastel theme for the high-spirited.',
    icon: '🐱', downloads: '1.4M', rating: 4.9, category: 'Theme', fileExtensions: [],
    features: ['Catppuccin Mocha color theme'], contributes: { themes: ['catppuccin-mocha'] },
  },
  {
    id: 'theme-solarized', name: 'solarized', displayName: 'Solarized Dark', publisher: 'Ethan Schoonover', version: 'v1.2.0',
    description: 'The classic precision color scheme for machines and people.',
    icon: '🌅', downloads: '900k', rating: 4.6, category: 'Theme', fileExtensions: [],
    features: ['Solarized Dark color theme'], contributes: { themes: ['solarized-dark'] },
  },
  {
    id: 'theme-ayu', name: 'ayu', displayName: 'Ayu Mirage', publisher: 'teabyii', version: 'v1.0.5',
    description: 'A simple theme with bright colors, in its mirage variant.',
    icon: '🏜️', downloads: '780k', rating: 4.7, category: 'Theme', fileExtensions: [],
    features: ['Ayu Mirage color theme'], contributes: { themes: ['ayu-mirage'] },
  },
];

export function createExtensions(saved?: Record<string, { installed: boolean; enabled: boolean }>): ExtensionItem[] {
  return CATALOG.map(({ preinstalled, ...ext }) => {
    const s = saved?.[ext.id];
    return { ...ext, installed: s ? !!s.installed : !!preinstalled, enabled: s ? !!s.enabled : !!preinstalled };
  });
}

/** Themes that ship with the IDE (no extension needed). */
export const BUILT_IN_THEMES = ['github-dark', 'vscode-dark', 'dracula', 'monokai', 'cyberpunk', 'nord', 'one-dark-pro'];

export function availableThemes(extensions: ExtensionItem[]): string[] {
  const fromExtensions = extensions
    .filter((e) => e.installed && e.enabled)
    .flatMap((e) => e.contributes?.themes || []);
  return [...BUILT_IN_THEMES, ...fromExtensions];
}
