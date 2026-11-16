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

---

## What works today

### Working

- **Monaco editor**, the editor engine from VS Code:
  - syntax highlighting for C/C++, Python, Rust, JS/TS, JSON, INI, CMake, Markdown and more
  - per-file undo history, cursor and scroll position kept when switching tabs
  - minimap, bracket colouring and the usual editor settings
- **Editor tabs**: unsaved-change dots, Save / Save All, middle-click to close, drag to reorder, and a right-click menu (Close, Close Others, Close All, Split Right, Copy Path)
- **Split editor**, side by side, with a draggable divider
- **Quick Open** (`Ctrl+P`):
  - type a file name, or `name:line` to jump straight to a line
  - start with `>` to run commands
  - start with `:` to go to a line in the current file
- **Find in Files** (`Ctrl+Shift+F`): match case, whole word, regex, highlighted results, click to jump, and Replace All with confirmation
- **Explorer**: file tree, filter, create / rename / delete files and folders, Open to the Side, and export the project as a ZIP
- **Menus** (Edit, Selection, Go): they act on the editor, so find/replace, go to line, move/copy lines, multi-cursor and next/previous problem all work
- **Problems panel**: click an entry to jump to its line
- **File viewers** for Markdown, JSON, CSV, PDF, images/SVG and firmware hex (`.bin`, `.hex`, `.elf`)
- **Themes**: GitHub Dark, VS Code Dark, Dracula, Monokai, Nord, One Dark Pro, Cyberpunk
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
| Extensions marketplace | Static list; "install" toggles a flag and can add a sample file |
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
| `Ctrl+B` | Build firmware *(VS Code uses this to toggle the sidebar)* |
| `Ctrl+U` | Flash firmware |
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
