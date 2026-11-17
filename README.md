# ESP Studio

A VS Code–style IDE for ESP32 and ESP32-S3 firmware, running in the browser or as a Tauri desktop app.

> **Status: early prototype (v0.1.0).** The editor and workbench are functional. Building, flashing, serial, sync, git, extensions and the AI assistant are **simulated**; they show realistic output but do not touch real hardware or services yet. See [What works today](#what-works-today).

---

## Quick start

Requires **Node.js 18+**.

```bash
npm install
npm run dev
```

Then open <http://localhost:5173> in Chrome or Edge.

Or use the launcher for your OS, which checks Node, installs dependencies on first run, and opens the browser:

| OS | Command |
| :-- | :-- |
| Windows | double-click `start.bat`, or run `.\start.ps1` |
| macOS / Linux | `chmod +x start.sh && ./start.sh` |

**Windows: `npm.ps1 cannot be loaded because running scripts is disabled`.** PowerShell is blocking npm's wrapper script. Use `npm.cmd run dev` or `start.bat`, or allow local scripts once for your user:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## What works today

### Working

- **Monaco editor**, the editor engine from VS Code:
  - syntax highlighting for about 80 languages, including Python, C/C++, Go, Java, C#, Rust, JS/TS, PHP, Ruby, Lua, Kotlin, Dart, SQL, YAML and Markdown
  - language detected from the file extension; change it per file with **Change Language Mode** (`Ctrl+K M` or click the language in the status bar)
  - per-file undo history, cursor and scroll position kept when switching tabs
  - built-in formatter (`Shift+Alt+F`) for JSON, JS/TS, HTML and CSS
- **Settings** (`Ctrl+,`): about 70 settings, VS Code style:
  - covers font, cursor, indentation, display, brackets, minimap, suggestions, formatting, auto save, layout and ESP32 options
  - every setting really changes the editor
  - search, `@modified` filter, per-setting reset
  - editable `settings.json` view that rejects unknown keys and invalid values
- **Extensions** (`Ctrl+Shift+X`): 25 extensions. Installing one really adds to the editor:
  - snippet extensions for Python, MicroPython, Arduino/FreeRTOS C++, Go, Java, C#, Rust, PHP, Ruby, Lua, Kotlin, Dart, SQL, HTML/CSS, Docker, Shell and more add snippets to IntelliSense (type the prefix, e.g. `ifmain` in Python)
  - color theme extensions (Tokyo Night, Catppuccin, Solarized Dark, Ayu) add themes to the theme picker (`Ctrl+K Ctrl+T`)
- **Menu bar** with VS Code's File, Edit, Selection, View, Go, Run, Terminal and Help menus:
  - submenus, checkmarks for toggles, `Alt+F` / `Alt+E` / ... and arrow-key navigation
  - **File**: New Text File, New File (pick a language), Open File and Open Folder from your disk, Save / Save As / Save All, Auto Save, Revert File
  - **View**: Appearance options (Full Screen, Zen Mode, show/hide Side Bar, Activity Bar, Status Bar, Panel, Minimap, Breadcrumbs, Sticky Scroll, Tabs) and Editor Layout
  - **Go**: Go to Symbol, Definition, References and Bracket
- **Editor tabs**: unsaved-change dots, Save / Save All, middle-click to close, drag to reorder, and a right-click menu (Close, Close Others, Close All, Split Right, Copy Path)
- **Split editor**, side by side, with a draggable divider
- **Quick Open** (`Ctrl+P`):
  - type a file name, or `name:line` to jump straight to a line
  - start with `>` to run commands
  - start with `:` to go to a line in the current file
- **Find in Files** (`Ctrl+Shift+F`): match case, whole word, regex, highlighted results, click to jump, and Replace All with confirmation
- **Explorer**: file tree, filter, create / rename / delete files and folders, Open to the Side, and export the project as a ZIP
- **Problems panel**: click an entry to jump to its line
- **File viewers** for Markdown, JSON, CSV, PDF, images/SVG and firmware hex (`.bin`, `.hex`, `.elf`)
- **Themes**: GitHub Dark, VS Code Dark, Dracula, Monokai, Nord, One Dark Pro, Cyberpunk, plus four more from theme extensions
- **Resizable layout**: sidebar, bottom panel, split editor and AI panel can all be dragged. Double-click a divider to reset it.
- **Persistence**: project files, open tabs, theme, editor settings, zoom and panel sizes are kept in browser `localStorage` across reloads

### Simulated (UI only, not connected)

| Feature | Current behaviour |
| :-- | :-- |
| Build | `SimulatedBuildProvider` prints fake PlatformIO output and a fake artifact |
| Flash | `SimulatedFlashProvider` shows progress; no Web Serial or `esptool-js` yet |
| Serial monitor / plotter | `MockSerialProvider` generates fake telemetry |
| Cloud sync, accounts | Local mock; there is no backend server |
| Source control / Git graph | Hard-coded sample history; commits are kept in memory only |
| Extensions marketplace | Built-in catalogue only (no download from a real marketplace); ratings and install counts are sample data |
| AI assistant | Canned replies chosen by keyword; no model is called |
| Device manager, pinout, FreeRTOS, OTA | Demonstration screens with sample data |

The provider interfaces in [`packages/`](packages) (`build-core`, `flash-core`, `serial-core`, `sync-core`) are where real implementations will plug in.

---

## Keyboard shortcuts

On macOS, `Ctrl` is `⌘`.

| Shortcut | Action |
| :-- | :-- |
| `Ctrl+P` | Go to file |
| `Ctrl+Shift+P` / `F1` | Command palette |
| `Ctrl+G` | Go to line |
| `Ctrl+Shift+O` | Go to symbol in file |
| `Ctrl+K M` | Change language mode |
| `Ctrl+K Ctrl+T` | Color theme |
| `Ctrl+K Ctrl+S` | Keyboard shortcuts |
| `Ctrl+K Z` / `Esc` | Enter / leave Zen mode |
| `F11` | Full screen |
| `Alt+Z` | Toggle word wrap |
| `Alt+F`, `Alt+E`, ... | Open a menu (then use the arrow keys) |
| `Ctrl+Alt+N` | New text file |
| `Ctrl+O` | Open file from disk |
| `Ctrl+S` / `Ctrl+Shift+S` | Save / Save all |
| `Ctrl+W` | Close editor *(desktop app only; the browser keeps this key)* |
| `Ctrl+PageUp` / `Ctrl+PageDown` | Previous / next tab |
| `Ctrl+\` | Toggle split editor |
| `Ctrl+F` / `Ctrl+H` | Find / replace in file |
| `Ctrl+Shift+F` | Find in files |
| `Ctrl+Shift+E` / `G` / `D` / `X` | Explorer / Source Control / Run & Debug / Extensions |
| `Ctrl+J` / ``Ctrl+` `` | Toggle panel / terminal |
| `Ctrl+Shift+M` | Problems |
| `Ctrl+Shift+A` | AI assistant |
| `Ctrl+B` / `Ctrl+Shift+B` | Build firmware *(in VS Code, Ctrl+B toggles the sidebar)* |
| `Ctrl+U` | Flash firmware |
| `F5` | Start / stop serial monitor |
| `Ctrl+,` | Settings |
| `Ctrl+=` / `Ctrl+-` / `Ctrl+0` | Zoom in / out / reset |

---

## Scripts

| Command | What it does |
| :-- | :-- |
| `npm run dev` | Web IDE dev server on port 5173 |
| `npm run build --workspace=@esp-studio/web` | Type-check and build the web app to `apps/web/dist` |
| `npm run typecheck` | Type-check the whole monorepo |
| `npm run package:zip` | Create `esp-studio-starter.zip` |
| `npm run desktop:dev` | Run the Tauri desktop app in dev mode |
| `npm run desktop:build` | Build desktop installers |

`npm run build` builds every workspace, including the desktop app, so it needs the Rust toolchain as well.

### Desktop app (Tauri 2)

Requires [Rust](https://rustup.rs) and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS.

```bash
# Windows
powershell -ExecutionPolicy Bypass -File .\scripts\build-desktop.ps1

# macOS / Linux
./scripts/build-desktop.sh
```

Installers are written to `apps/desktop/src-tauri/target/release/bundle/`.

---

## Project layout

```
apps/
  web/                React + Vite web IDE (the main app)
    src/App.tsx         workbench layout and global shortcuts
    src/stores/         workspace state (useWorkspaceStore.ts)
    src/editorBridge.ts lets menus, palette and search drive the live editor
    src/settingsSchema.ts     every setting: UI, settings.json and Monaco options
    src/extensionsCatalog.ts  extensions and what they contribute (snippets, themes)
    src/languages.ts          language detection, names, new-file templates
    src/components/     editor, sidebars, panels, viewers
  desktop/            Tauri 2 shell that wraps the web app
packages/
  shared-types/       project, device, build and serial types
  project-core/       project templates and validation
  build-core/         BuildProvider interface + simulated build
  flash-core/         FlashProvider interface + simulated flash
  serial-core/        SerialProvider interface + mock serial
  sync-core/          sync engine, hashing, conflict resolution
  device-core/        device registry, NVS helpers
  protocol/           event contracts
  editor/             C/C++ editor presets
  ui/                 shared buttons, badges, theme
templates/            ESP32-S3 Arduino and ESP-IDF starter projects
docs/                 design specifications (see below)
scripts/              build, icon and packaging scripts
```

---

## Design docs

These describe the **planned** system. Some of it (cloud backend, database, real build workers) is not built yet.

- [Architecture & developer guide](ARCHITECTURE.md)
- [Product requirements](docs/PRODUCT_REQUIREMENTS.md)
- [System architecture](docs/SYSTEM_ARCHITECTURE.md)
- [Build system](docs/BUILD_SYSTEM.md)
- [Device protocol](docs/DEVICE_PROTOCOL.md)
- [Sync protocol](docs/SYNC_PROTOCOL.md)
- [Database schema](docs/DATABASE_SCHEMA.md)
- [API specification](docs/API_SPECIFICATION.md)
- [Security design](docs/SECURITY_DESIGN.md)
- [Testing strategy](docs/TESTING_STRATEGY.md)
- [Roadmap](docs/DEVELOPMENT_ROADMAP.md)

---

## Known limitations

- Tailwind CSS and Monaco load from CDNs, so the app needs internet access, including the desktop build.
- All data lives in browser `localStorage`. Clearing site data deletes your project, so use **Export ZIP** to keep a copy.
- No automated tests yet.

## License

Apache-2.0, as declared in `package.json`.
