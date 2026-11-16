import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { Terminal, Trash2 } from 'lucide-react';

interface TermLine {
  type: 'cmd' | 'out' | 'err' | 'success';
  text: string;
}

export const PioTerminal: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const [lines, setLines] = useState<TermLine[]>([
    { type: 'out', text: 'ESP Studio Interactive PlatformIO CLI Shell v1.0.0' },
    { type: 'out', text: 'Type "help" or "pio --help" to see available embedded development commands.\n' },
  ]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    setHistory((prev) => [cmd, ...prev]);
    setHistoryIndex(-1);
    setInputVal('');

    const newLines: TermLine[] = [...lines, { type: 'cmd', text: `esp-studio@workspace:~$ ${cmd}` }];

    if (cmd === 'clear') {
      setLines([]);
      return;
    }

    if (cmd === 'help' || cmd === 'pio --help') {
      newLines.push({
        type: 'out',
        text: `Available Commands:
  pio run              - Compile active ESP32 firmware project
  pio run -t upload    - Flash firmware binary to target board
  pio device monitor   - Connect live serial stream to COM4
  pio device list      - List connected USB serial ports
  pio lib list         - View installed embedded libraries
  git status           - Check local SHA-256 sync state
  clear                - Clear terminal console`,
      });
    } else if (cmd === 'pio run') {
      newLines.push({ type: 'out', text: 'Invoking compilation engine for esp32-s3-devkitc-1...' });
      actions.triggerBuild();
      newLines.push({ type: 'success', text: 'Compilation initiated! Check Build Console tab.' });
    } else if (cmd === 'pio run -t upload') {
      newLines.push({ type: 'out', text: 'Invoking esptool flash pipeline to ESP32-S3...' });
      actions.triggerFlash();
      newLines.push({ type: 'success', text: 'Flash initiated!' });
    } else if (cmd === 'pio device monitor') {
      actions.toggleSerialConnection();
      newLines.push({ type: 'success', text: 'Toggled live serial port connection.' });
    } else if (cmd === 'pio device list') {
      newLines.push({
        type: 'out',
        text: `Found 1 target device:
  Port: COM4
  Description: ESP32-S3 USB CDC (Dual-Core LX7)
  Hardware ID: SPRAYER-001 (MAC: 84:F7:03:1A:2B:3C)`,
      });
    } else if (cmd === 'pio lib list') {
      const installed = state.libraries.filter((l) => l.installed).map((l) => `  - ${l.name} @ ${l.version}`);
      newLines.push({ type: 'out', text: `Installed Libraries:\n${installed.join('\n')}` });
    } else if (cmd === 'git status') {
      newLines.push({
        type: 'out',
        text: `On branch main\nStatus: ${state.syncStatus}\nLast synced: ${state.lastSyncedAt}\nAll tracked files match cloud SHA-256 root.`,
      });
    } else {
      newLines.push({ type: 'err', text: `bash: command not found: ${cmd}. Type "help" for a list of commands.` });
    }

    setLines(newLines);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' && history.length > 0) {
      const nextIdx = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(nextIdx);
      setInputVal(history[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx]);
      } else {
        setHistoryIndex(-1);
        setInputVal('');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090d12] overflow-hidden font-mono text-xs select-none">
      {/* Header */}
      <div className="h-8 bg-[#161b22] border-b border-[#30363d] px-3 flex items-center justify-between text-[11px]">
        <div className="flex items-center space-x-2 text-[#8b949e]">
          <Terminal className="w-3.5 h-3.5 text-[#58a6ff]" />
          <span className="font-bold text-white">PlatformIO Embedded Terminal</span>
          <span>(bash)</span>
        </div>

        <button
          onClick={() => setLines([])}
          className="p-1 hover:text-white text-[#8b949e] rounded"
          title="Clear Terminal"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Terminal View */}
      <div ref={containerRef} className="flex-1 p-3 overflow-y-auto leading-5 select-text font-mono text-[11px]">
        {lines.map((l, idx) => (
          <div key={idx} className="whitespace-pre-wrap">
            {l.type === 'cmd' ? (
              <span className="text-[#58a6ff] font-bold">{l.text}</span>
            ) : l.type === 'success' ? (
              <span className="text-emerald-400">{l.text}</span>
            ) : l.type === 'err' ? (
              <span className="text-rose-400">{l.text}</span>
            ) : (
              <span className="text-[#c9d1d9]">{l.text}</span>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleCommand} className="h-8 bg-[#161b22] border-t border-[#30363d] px-2 flex items-center">
        <span className="text-emerald-400 font-bold mr-1.5">esp-studio:~$</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Run PlatformIO CLI command (pio run, pio device monitor)..."
          className="flex-1 bg-transparent text-white outline-none font-mono text-xs placeholder-[#484f58]"
        />
      </form>
    </div>
  );
};
